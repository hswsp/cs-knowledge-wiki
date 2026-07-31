# 有限域算术：从 AES 到 Reed-Solomon（4/4）
> AES-GCM/GHASH、Shamir 秘密共享、性能基准、工程踩坑与参考资料
>
> 系列导航：[1. 数学基础与 GF(p) 素数域](./01-数学基础与-GF-p-素数域) · [2. 扩展域 GF(2^n) 与 AES](./02-扩展域-GF-2-n-与-AES) · [3. Reed-Solomon 编解码与 C 实现](./03-Reed-Solomon-编解码与C实现) · **4. GHASH、Shamir 秘密共享与工程实战**

---

## GHASH 与 AES-GCM：GF(2^128) 乘法
AES-GCM 是目前最流行的 AEAD（Authenticated Encryption with Associated Data）方案。其中的认证部分 GHASH 是在 $GF(2^{128})$ 上做乘法。

### GHASH 的数学定义
GHASH 将消息分成 128 位的块 $X_1, X_2, …, X_m$，计算：

$$Y_i = (Y_{i-1} \oplus X_i) \cdot H$$

其中 H 是认证密钥，乘法在 $GF(2^{128})$ 中进行。不可约多项式是：

$$P(x) = x^{128} + x^7 + x^2 + x + 1$$

### GF(2^128) 乘法的挑战
128 位的无进位乘法产生 256 位的中间结果，然后需要模 $P(x)$ 规约。在没有 CLMUL 的平台上，这需要大量的移位和 XOR 操作。有了 PCLMULQDQ，一次 $GF(2^{128})$ 乘法可以用 4 次 64 位 CLMUL（Karatsuba 分解）加规约完成：

```c
/* GF(2^128) 乘法（简化伪代码） */
/* t0 = clmul(a_lo, b_lo), t1 = clmul(a_hi, b_hi)         */
/* t2 = clmul(a_lo^a_hi, b_lo^b_hi), t3 = t2 ^ t0 ^ t1    */
/* 256-bit product = [t1_hi : t1_lo^t3_hi : t0_hi^t3_lo : t0_lo] */
/* 然后对 P(x) = x^128+x^7+x^2+x+1 做 Barrett 规约        */
```

### 性能影响
在支持 CLMUL 的处理器上，AES-GCM 的吞吐量可以超过 10 GB/s。没有 CLMUL 时，GF(2^128) 乘法成为瓶颈，吞吐量可能降至数百 MB/s。这就是为什么 OpenSSL 对 AES-GCM 有专门的 CLMUL 汇编优化路径。

## Shamir 秘密共享：GF(p) 上的应用
Shamir 秘密共享（SSS）是一个 (k, n) 门限方案：将秘密 s 分成 n 份，任意 k 份可以恢复 s，少于 k 份则无法获得 s 的任何信息。它在 $GF(p)$ 上工作（p 是足够大的素数）。

### 原理
1. 选择一个 k-1 次随机多项式 $f(x) = s + a_1x + a_2x^2 + … + a_{k-1}*x^{k-1}$，其中常数项是秘密 s。
2. 给第 i 个参与者分配 (i, f(i))，即多项式在 x = i 处的值。
3. 恢复时，用拉格朗日插值从 k 个点重建 f(x)，取 f(0) = s。

### 为什么用有限域
如果在实数上做，浮点精度会导致秘密泄露。在 $GF(p)$ 上，所有运算都是精确的，且信息论安全——少于 k 份的参与者无法获得秘密的任何比特。

### 拉格朗日插值在 GF(p) 上的实现
```python
def shamir_split(secret, k, n, prime):
    """将 secret 分成 n 份，k 份可恢复"""
    import secrets
    coeffs = [secret] + [secrets.randbelow(prime) for _ in range(k - 1)]

    def eval_poly(x):
        result = 0
        power = 1
        for c in coeffs:
            result = (result + c * power) % prime
            power = (power * x) % prime
        return result

    shares = [(i, eval_poly(i)) for i in range(1, n + 1)]
    return shares

def shamir_recover(shares, prime):
    """从 k 份 shares 恢复秘密"""
    k = len(shares)
    secret = 0
    for i in range(k):
        xi, yi = shares[i]
        # 拉格朗日基多项式在 x=0 处的值
        num = 1
        den = 1
        for j in range(k):
            if i == j:
                continue
            xj = shares[j][0]
            num = (num * (-xj)) % prime
            den = (den * (xi - xj)) % prime
        # 模逆元
        den_inv = pow(den, prime - 2, prime)
        secret = (secret + yi * num * den_inv) % prime
    return secret

# 使用示例
prime = 2**127 - 1  # 梅森素数
secret = 123456789
shares = shamir_split(secret, 3, 5, prime)
print(f"Secret: {secret}")
print(f"Shares: {shares}")

# 任取 3 份恢复
recovered = shamir_recover(shares[:3], prime)
print(f"Recovered: {recovered}")
assert recovered == secret
```

Shamir 秘密共享的应用场景包括：密钥管理（密钥托管）、多方计算的基础组件、加密货币钱包的备份方案等。

## 工程实战与性能分析
### 基准测试：三种 GF(2^8) 乘法的对比
```c
/* 基准测试框架（简化） */
#include <time.h>

static void bench_gf_mul(const char *name,
                         uint8_t (*mul_fn)(uint8_t, uint8_t),
                         int iterations)
{
    clock_t start = clock();
    uint8_t acc = 1;
    for (int i = 0; i < iterations; i++) {
        acc = mul_fn(acc, (uint8_t)(i & 0xFF));
    }
    clock_t end = clock();
    double ms = (double)(end - start) / CLOCKS_PER_SEC * 1000.0;
    printf("%-20s %d iters in %.2f ms  (%.1f M ops/s)  [checksum: 0x%02X]\n",
           name, iterations, ms,
           (double)iterations / ms / 1000.0, acc);
}
```

典型结果（Intel i7-12700K，GCC -O2）：

| 方法 | 吞吐量 (M ops/s) | 延迟 (ns) | 是否恒定时间 |
| :--- | ---: | ---: | :---: |
| 移位-XOR（gf_mul_slow） | 约 180 | 约 5.5 | 是 |
| 对数/反对数表 | 约 650 | 约 1.5 | 否（缓存侧信道） |
| PCLMULQDQ + Barrett | 约 1200 | 约 0.8 | 是 |


对数表方法在非安全场景（Reed-Solomon 编解码、CRC 计算）中仍然是最实用的选择：实现简单、跨平台、性能足够。但在密码学场景中，必须使用恒定时间实现。

### 工程踩坑表
| 陷阱 | 后果 | 正确做法 |
| :--- | :--- | :--- |
| $GF(2^8)$ 加法用了 + 而非 XOR | 结果完全错误 | 牢记 GF(2) 中 1 + 1 = 0 |
| 乘法规约时忘记检查最高位 | 乘积溢出，域运算破坏 | xtime 中先检查 MSB 再移位 |
| 对数表中 log(0) 返回了 0 | gf_mul(0, x) 返回非零值 | 乘法函数中先判零 |
| RS 生成多项式的根从 $\alpha^0$ 开始 | 与标准不兼容 | QR 码用 $\alpha^0$，CD 用 $\alpha^1$，看标准 |
| GF(2^128) 的位序搞反 | GHASH 计算结果错误 | GCM 规范用的是 LSB-first 约定 |
| 用浮点数做 Shamir 秘密共享 | 精度损失导致秘密泄露 | 必须在有限域上做精确算术 |
| CLMUL 可用性未检测 | 程序在旧 CPU 上崩溃 | 运行时检测 CPUID，提供 fallback |
| Reed-Solomon 的 n 超过 255 | GF(2^8) 只有 255 个非零点 | n <= 255，需要更长码字则用 GF(2^16) |
| 混淆了 GF(2^n) 的不同不可约多项式 | 互操作失败 | 同一系统必须使用相同的 P(x) |
| 未处理 erasure（已知位置的错误） | 浪费纠错能力 | 1 个 erasure 只消耗 1 个校验符号，不是 2 个 |


### 真实世界中的有限域
有限域算术无处不在，以下是一些你可能每天都在间接使用的例子：

**QR 码**：使用 $GF(2^8)$ 上的 Reed-Solomon 编码，不可约多项式为 $x^8 + x^4 + x^3 + x^2 + 1$（0x11D，注意不是 AES 的 0x11B）。纠错等级从 L（7%）到 H（30%）不等。

**CD/DVD**：CD 使用交叉交织 Reed-Solomon 码（CIRC），两层 RS 编码分别纠正突发错误和随机错误。DVD 使用 RS 乘积码（RS-PC），将数据排成二维阵列，行列各做一次 RS 编码。

**ZFS 文件系统**：ZFS 的 RAID-Z2 和 RAID-Z3 使用 $GF(2^8)$ 上的 Reed-Solomon 编码来提供双盘和三盘容错。每个数据条带的校验计算都是在 $GF(2^8)$ 上做矩阵运算。

**SSD 的 ECC**：现代 SSD 控制器使用 BCH 码或 LDPC 码来纠正 NAND 闪存的位错误。BCH 码的解码过程与 Reed-Solomon 密切相关，都依赖有限域算术。

**以太网**：1000BASE-T 千兆以太网的信号编码使用了 GF(2) 上的卷积码和 Trellis 编码调制，物理层的前向纠错与有限域直接相关。

**TLS 1.3**：AES-GCM 和 ChaCha20-Poly1305 是 TLS 1.3 中仅有的两个 AEAD 密码套件。AES-GCM 的 GHASH 运算直接在 $GF(2^{128})$ 上进行。

### 有限域的选择指南
不同的应用场景选择不同的有限域，背后都有工程上的考量：

| 应用 | 有限域 | 不可约多项式 | 为什么选它 |
| :--- | :--- | :--- | :--- |
| AES | GF(2^8) | 0x11B | 8 位对齐，本原多项式 |
| QR 码 | GF(2^8) | 0x11D | QR 标准规定 |
| AES-GCM / GHASH | GF(2^128) | x^128+x^7+x^2+x+1 | 128 位块对齐，规约稀疏 |
| Shamir SSS | GF(p)，p 为大素数 | 不适用 | 信息论安全需要素数域 |
| RS over GF(2^16) | GF(2^16) | 0x1100B | 需要 n > 255 |
| AES-XTS (磁盘加密) | GF(2^128) | 同 GHASH | tweak 值的乘法 |


### 我的看法
有限域是我认为”投入产出比”最高的数学知识之一。学好 GF(2^8) 这一个域，你就能理解 AES 的内部结构、Reed-Solomon 编码的原理、CRC 的数学本质。它不像椭圆曲线那样需要深厚的代数几何背景，也不像格密码那样需要高维几何的直觉。有限域的核心概念——多项式环模不可约多项式——是具体的、可操作的、可以用几十行 C 代码完整实现的。

从工程角度看，GF(2^8) 的对数表方法几乎总是首选。512 字节的表在任何平台上都能放进 L1 缓存，实现简单，不容易出错。只有在两个场景下需要考虑替代方案：一是需要恒定时间执行（密码学），二是需要极致吞吐量（CLMUL 批处理）。

对于 Reed-Solomon 编码，我建议直接使用成熟的库（如 Intel ISA-L、zfec、par2），而不是自己从头实现。解码算法（特别是 Berlekamp-Massey 和 Forney）的边界条件非常多，一个 off-by-one 错误就能导致某些错误模式无法纠正。自己实现主要是为了理解原理，生产环境请用经过充分测试的代码。

有一点值得强调：不同标准使用不同的不可约多项式和约定（根的起始指数、位序、多项式表示方式），这是互操作问题的头号来源。如果你需要与某个标准兼容，务必仔细阅读规范中关于有限域参数的章节。我曾经在实现 QR 码的 RS 解码器时，因为用了 AES 的 0x11B 而非 QR 标准的 0x11D，花了整整两天才找到 bug。

最后，有限域不是孤立的知识点。它与快速傅里叶变换（NTT 是 FFT 在有限域上的推广）、椭圆曲线（定义在有限域上）、格密码（某些构造用到有限域上的多项式环）都有深刻联系。掌握有限域，是进入现代密码学和编码理论的关键一步。

---

## 阅读资料
+ [纠删码EC与伽罗华域-算法理解](http://139.196.53.116/ml/index.php/archives/163/)
+ [Reed-Solomon纠错码(RS码)（里德-所罗门码） - funiyi816 - 博客园](https://www.cnblogs.com/funiyi816/p/15879114.html)
