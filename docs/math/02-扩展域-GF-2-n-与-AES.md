# 有限域算术：从 AES 到 Reed-Solomon（2/4）
> 多项式扩展域构造、GF(2^8) 与 AES、CLMUL 指令、对数/反对数表
>
> 系列导航：[1. 数学基础与 GF(p) 素数域](./01-数学基础与-GF-p-素数域) · **2. 扩展域 GF(2^n) 与 AES** · [3. Reed-Solomon 编解码与 C 实现](./03-Reed-Solomon-编解码与C实现) · [4. GHASH、Shamir 秘密共享与工程实战](./04-GHASH-Shamir-与工程实战)

---

## GF(2^n)：扩展域的构造
当我们需要 256 个元素的有限域时，不能用 $GF(256) = Z/256Z$——因为 $256 = 2^8$ 不是素数，$Z/256Z$ 有零因子。正确的做法是构造 $GF(2)$ 上的**多项式扩展域** $GF(2^8)$。

### 构造方法
$GF(2^n)$ 的构造类似于从实数扩展到复数的过程：

1. 取 $GF(2) = \{0, 1\}$，加法是 XOR，乘法是 AND。
2. 选择一个 n 次**不可约多项式** $P(x)$（在 $GF(2)[x]$ 上不能分解为更低次多项式之积）。
3. $GF(2^n)$**的元素是**$GF(2)[x]$**中次数小于 n 的多项式，运算在模**$P(x)$**下进行。**

### 不可约多项式的角色
不可约多项式在 $GF(2^n)$ 中的角色，类似于素数在 $\mathbb{Z}/p\mathbb{Z}$ 中的角色。多项式环 $GF(2)[x]$ 模一个不可约多项式 $P(x)$，得到的**商环**是一个域。如果 $P(x)$ 可约，商环就会有零因子，不再是域。

以 $GF(2^3)$ 为例。$GF(2)$ 上的 3 次不可约多项式有两个：$x^3 + x + 1$ 和 $x^3 + x^2 + 1$。选择 $P(x) = x^3 + x + 1$，则 $GF(2^3) = GF(2)[x] / (x^3 + x + 1)$，包含 8 个元素：

```plain
000 -> 0
001 -> 1
010 -> x
011 -> x + 1
100 -> x^2
101 -> x^2 + 1
110 -> x^2 + x
111 -> x^2 + x + 1
```

### 加法：按位 XOR
$GF(2^n)$ 中的加法就是多项式系数逐项相加，在 $GF(2)$ 中加法等于 XOR：

```plain
(x^2 + x + 1) + (x^2 + 1) = x
  即 111 XOR 101 = 010
```

加法的逆运算也是 $XOR$（因为**在 GF(2) 中**$-1 = 1$），所以 $GF(2^n)$ 中**加法和减法完全相同**。

### 乘法：多项式乘法模 P(x)
乘法是先做**普通多项式乘法（系数在**$GF(2)$**中），然后对**$P(x)$**取模**：

```plain
(x^2 + x) * (x + 1)   在 GF(2^3) 中，P(x) = x^3 + x + 1

普通乘法：x^3 + x^2 + x^2 + x = x^3 + x  (GF(2) 中 1+1=0)
模 P(x)：x^3 + x mod (x^3 + x + 1)
        = (x^3 + x) - (x^3 + x + 1) = 1    (在 GF(2) 中减法等于加法)

所以 110 * 011 = 001
```

### 如何验证不可约性
艾森斯坦判别法（Eisenstein’s criterion）——$\mathbb{Q}$（更一般地 $\mathbb{Z}$）版本（最常用）

设

$$f(x) = a_n x^n + a_{n-1} x^{n-1} + \cdots + a_1 x + a_0 \in \mathbb{Z}[x], \quad a_n 
\neq 0$$

是一个整系数多项式，并且存在素数 $p$ 使得

1. $p \mid a_i$ 对所有 $i = 0, 1, \dots, n-1$（即 $p$ 整除**除首项外的所有系数**）；
2. $p \mid a_n$（$p$ **不整除首项系数**）；
3. $p^2 \mid a_0$（$p$ 的**平方不整除常数项**）。

则 $f(x)$ 在 $\mathbb{Z}[x]$ 中是**不可约的**；从而把 $f$ 看成 $\mathbb{Q}[x]$ 中的多项式也是**不可约的**（在 $\mathbb{Q}$ 上不可约）。

判断一个 n 次多项式 $f(x)$ 在 $GF(2)$ 上是否不可约，最简单的方法是：**检验**$f(x)$**不能被任何次数 <= n/2 的不可约多项式整除**。对于小的 n，穷举即可。对于大的 n，有更高效的算法：

```python
def is_irreducible_gf2(poly, n):
    """检测 GF(2) 上的 n 次多项式是否不可约。
    poly 用整数表示，第 i 位对应 x^i 的系数。"""
    # Rabin 不可约性测试
    u = 0b10  # u = x
    for i in range(1, n):
        # u = u^2 mod poly (即 x^(2^i) mod poly)
        u = gf2_poly_mod(gf2_poly_mul(u, u), poly)
        # 检查 gcd(u XOR x, poly) 是否为 1
        g = gf2_poly_gcd(u ^ 0b10, poly)
        if g != 1:
            return False
    return True
```

## GF(2^8) 与 AES：密码学的核心运算
**AES（Advanced Encryption Standard）**是当今使用最广泛的对称加密算法，它的内部运算深度依赖 $GF(2^8)$ 算术。理解这一点，你才能真正理解 AES 的设计哲学，而不只是把它当成一个黑盒。

### AES 选择的不可约多项式
AES 标准（FIPS 197）选择的不可约多项式是：

$$P(x) = x^8 + x^4 + x^3 + x + 1$$

用十六进制表示为 0x11B（包含 $x^8$ 项时是 9 位：100011011）。

这个多项式的选择不是随意的。它是 $GF(2)$ 上 30 个 8 次不可约多项式中最小的一个（按字典序），且是**本原多项式**——意味着 $x$ 是 $GF(2^8)^*$ 的生成元，{$x^0, x^1, …, x^{254}$} 遍历所有 255 个非零元素。本原性保证了域的乘法群具有最好的循环结构。

### S-box：GF(2^8) 上的求逆
AES 的 SubBytes 步骤使用一个 16x16 的查找表（S-box），它的数学定义是：

1. 对输入字节 b，计算 b 在 $GF(2^8)$ 中的乘法逆元 $b^{-1}$（0 映射到 0）。
2. 对 $b^{-1}$ 施加一个 $GF(2)$ 上的仿射变换。

S-box 的密码学强度来自第一步的求逆运算。$GF(2^8)$ 上的求逆具有优秀的**非线性度**：它的布尔函数表示具有最高可能的代数次数，使得差分攻击和线性攻击都难以奏效。

```c
/* AES S-box 生成：GF(2^8) 求逆 + 仿射变换 */
static uint8_t gf256_inv(uint8_t a)
{
    if (a == 0) return 0;
    /* a^(-1) = a^254 in GF(2^8)，因为非零元素的阶是 255 */
    /* 用平方-乘法链计算 a^254 = a^(2+4+8+16+32+64+128) */
    uint8_t r = a;
    /* 通过反复平方和乘法计算 a^254 */
    uint8_t a2   = gf256_mul(a, a);        /* a^2 */
    uint8_t a4   = gf256_mul(a2, a2);      /* a^4 */
    uint8_t a8   = gf256_mul(a4, a4);      /* a^8 */
    uint8_t a16  = gf256_mul(a8, a8);      /* a^16 */
    uint8_t a32  = gf256_mul(a16, a16);    /* a^32 */
    uint8_t a64  = gf256_mul(a32, a32);    /* a^64 */
    uint8_t a128 = gf256_mul(a64, a64);    /* a^128 */
    r = gf256_mul(a128, a64);              /* a^192 */
    r = gf256_mul(r, a32);                 /* a^224 */
    r = gf256_mul(r, a16);                 /* a^240 */
    r = gf256_mul(r, a8);                  /* a^248 */
    r = gf256_mul(r, a4);                  /* a^252 */
    r = gf256_mul(r, a2);                  /* a^254 */
    return r;
}

static void build_aes_sbox(uint8_t sbox[256])
{
    for (int i = 0; i < 256; i++) {
        uint8_t inv = gf256_inv((uint8_t)i);
        /* 仿射变换：b' = A * inv + c，其中 A 是循环矩阵，c = 0x63 */
        uint8_t s = inv;
        s ^= (inv << 1) | (inv >> 7);
        s ^= (inv << 2) | (inv >> 6);
        s ^= (inv << 3) | (inv >> 5);
        s ^= (inv << 4) | (inv >> 4);
        s ^= 0x63;
        sbox[i] = s;
    }
}
```

### MixColumns：GF(2^8) 上的矩阵乘法
AES 的 MixColumns 步骤将状态矩阵的每一列视为 $GF(2^8)$ 上的 4 维向量，乘以一个固定矩阵：

```plain
| 02  03  01  01 |   | s0 |
| 01  02  03  01 | * | s1 |
| 01  01  02  03 |   | s2 |
| 03  01  01  02 |   | s3 |
```

其中 01、02、03 都是 $GF(2^8)$ 中的元素，矩阵乘法中的加法是 XOR，乘法是 $GF(2^8)$ 乘法。

这个矩阵的选择也有深意：它是一个 **MDS（Maximum Distance Separable）矩阵**，意味着任何两个不同的输入列之间，至少有 5 个字节不同（分支数为 5）。这保证了差分传播的最优扩散特性。

```c
/* MixColumns 中的核心运算：乘以 02 */
static inline uint8_t xtime(uint8_t a)
{
    /* 左移 1 位，如果原最高位为 1，则 XOR 0x1B（即 P(x) 的低 8 位） */
    return (a << 1) ^ ((a >> 7) * 0x1B);
}

/* 乘以 03 = 02 + 01 */
static inline uint8_t mul03(uint8_t a)
{
    return xtime(a) ^ a;
}

static void mix_columns(uint8_t state[4][4])
{
    for (int c = 0; c < 4; c++) {
        uint8_t s0 = state[0][c], s1 = state[1][c];
        uint8_t s2 = state[2][c], s3 = state[3][c];
        state[0][c] = xtime(s0) ^ mul03(s1) ^ s2 ^ s3;
        state[1][c] = s0 ^ xtime(s1) ^ mul03(s2) ^ s3;
        state[2][c] = s0 ^ s1 ^ xtime(s2) ^ mul03(s3);
        state[3][c] = mul03(s0) ^ s1 ^ s2 ^ xtime(s3);
    }
}
```

## 无进位乘法：CLMUL 指令
$GF(2^n)$ 的乘法本质上是**无进位乘法**（carry-less multiplication）——和普通整数乘法一样做移位和累加，但”加”是 XOR 而非带进位的加法。

### 从笔算到硬件
回忆小学的竖式乘法，$a * b$ 是把 b 的每一位对应的 a 的移位版本相加。在 $GF(2)$ 上，“相加”变成 XOR，也就不存在进位传播。这使得无进位乘法天然适合并行化。

Intel 在 2010 年引入的 **PCLMULQDQ 指令（属于 CLMUL 指令集）**就是专门做这件事的。它接受两个 64 位操作数，输出 128 位的无进位乘积。

```c
#include <wmmintrin.h>  /* PCLMULQDQ intrinsics */

/* 使用 CLMUL 指令计算两个 64 位多项式的无进位乘积 */
static inline __m128i clmul64(uint64_t a, uint64_t b)
{
    __m128i va = _mm_set_epi64x(0, (long long)a);
    __m128i vb = _mm_set_epi64x(0, (long long)b);
    return _mm_clmulepi64_si128(va, vb, 0x00);
}
```

### CLMUL 的应用
PCLMULQDQ 指令最初是为 AES-GCM 中的 GHASH 运算设计的（$GF(2^{128})$ 乘法），但它的应用远不止于此：

1. **CRC 计算**：CRC 本质上是 GF(2) 上的多项式除法，CLMUL 可以极大加速。
2. $GF(2^8)$**批量乘法**：Reed-Solomon 编码/解码中的批量运算。
3. **Rabin 指纹**：用于内容定义分块（CDC）的滚动哈希。
4. **Barrett 规约**：配合 CLMUL 实现高效的模不可约多项式运算。

### GF(2^8) 乘法的 CLMUL 实现
**用 CLMUL 做**$GF(2^8)$**乘法**需要两步：无进位乘法得到最多 15 位的乘积，然后对 0x11B 取模：

```c
static uint8_t gf256_mul_clmul(uint8_t a, uint8_t b)
{
    /* 无进位乘法：得到最多 14 次多项式 */
    __m128i va = _mm_set_epi64x(0, a);
    __m128i vb = _mm_set_epi64x(0, b);
    __m128i prod = _mm_clmulepi64_si128(va, vb, 0x00);
    uint32_t p = (uint32_t)_mm_extract_epi32(prod, 0);

    /* Barrett 规约：mod 0x11B */
    /* 对于 GF(2^8)，简单的条件 XOR 就够了 */
    if (p & 0x8000) p ^= (0x11B << 7);
    if (p & 0x4000) p ^= (0x11B << 6);
    if (p & 0x2000) p ^= (0x11B << 5);
    if (p & 0x1000) p ^= (0x11B << 4);
    if (p & 0x0800) p ^= (0x11B << 3);
    if (p & 0x0400) p ^= (0x11B << 2);
    if (p & 0x0200) p ^= (0x11B << 1);
    if (p & 0x0100) p ^= 0x11B;
    return (uint8_t)p;
}
```

## 对数/反对数表：快速 GF 乘法
**在不支持 CLMUL 的平台上（嵌入式系统、8 位微控制器），对数/反对数表是**$GF(2^8)$**乘法的经典加速手段。**

### 原理
$GF(2^8)^*$ 是一个 255 阶的循环群，选定一个生成元 g（AES 中常用 g = 0x03），任意非零元素 a 都可以表示为 $a = g^{(log_g(a))}$。于是：

$$a \times b = g^{(\log_g(a) + \log_g(b)) \mod 255}$$

一次乘法变成了两次查表（log_table）、一次加法、一次查表（exp_table），总共三次内存访问。

### 构建 log/exp 表
```c
static uint8_t exp_table[512];  /* 扩展到 512 以避免取模 */
static uint8_t log_table[256];

static void build_log_tables(void)
{
    uint8_t g = 1;
    for (int i = 0; i < 255; i++) {
        exp_table[i] = g;
        exp_table[i + 255] = g;  /* 冗余映射，避免加法后取模 */
        log_table[g] = (uint8_t)i;
        g = gf256_mul_xtime(g, 0x03);  /* g = g * 0x03 */
    }
    log_table[0] = 0;  /* 约定，实际 log(0) 无定义 */
}

static inline uint8_t gf256_mul_log(uint8_t a, uint8_t b)
{
    if (a == 0 || b == 0) return 0;
    int idx = (int)log_table[a] + (int)log_table[b];
    return exp_table[idx];  /* idx 最大 254+254=508，在 exp_table 范围内 */
}
```

### 除法和求逆
有了对数表，除法和求逆变得极为简单：

```c
static inline uint8_t gf256_div_log(uint8_t a, uint8_t b)
{
    /* a / b = g^(log(a) - log(b) mod 255) */
    if (a == 0) return 0;
    /* b == 0 是除零错误，调用者负责检查 */
    int idx = (int)log_table[a] - (int)log_table[b] + 255;
    return exp_table[idx];
}

static inline uint8_t gf256_inv_log(uint8_t a)
{
    /* a^(-1) = g^(255 - log(a)) */
    if (a == 0) return 0;
    return exp_table[255 - log_table[a]];
}
```

### 表大小与缓存效率
`log_table` 和 `exp_table` 各 256/512 字节，合计不到 1KB，完美地放进 L1 缓存。这使得基于表的 $GF(2^8)$ 乘法在嵌入式平台上非常高效，单次乘法只需 3 次缓存命中的内存访问。

但在需要抵抗缓存侧信道攻击的场景（如 AES 的恒定时间实现），查表操作会泄露访问模式。这时必须使用位运算或 CLMUL 实现。
