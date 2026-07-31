# 有限域算术：从 AES 到 Reed-Solomon（3/4）
> RS 编码、Berlekamp-Massey 解码、完整的 GF(2^8) 与 RS C 实现
>
> 系列导航：[1. 数学基础与 GF(p) 素数域](./01-数学基础与-GF-p-素数域) · [2. 扩展域 GF(2^n) 与 AES](./02-扩展域-GF-2-n-与-AES) · **3. Reed-Solomon 编解码与 C 实现** · [4. GHASH、Shamir 秘密共享与工程实战](./04-GHASH-Shamir-与工程实战)

---

## Reed-Solomon 编码：多项式求值与纠错
Reed-Solomon 码是最广泛使用的纠错码之一。它在 $GF(2^8)$ 上工作，将数据视为多项式系数，通过在特定点上求值来生成冗余校验符号。

### 编码原理
设**数据为**$k$**个字节**$d_0, d_1, …, d_{k-1}$，构造**数据多项式**：

$$\begin{align*}
D(x) &= d_0x^{n-1} + d_1x^{n-2} + \cdots + d_{k-1}x^{n-k} \\
     &= d_0x^{2t+k-1} + d_1x^{2t+k-2} + \cdots + d_{k-1}x^{2t + 0} \\
     &= x^{2t}(d_0x^{k-1} + d_1x^{k-2} + \cdots + d_{k-1})
\end{align*}$$

**其中**$n = k + 2t$**，**$t$**是要纠正的最大错误数**。

Reed-Solomon 编码的核心是**生成多项式**：

$$G(x) = (x - \alpha)(x - \alpha^2) \cdots (x - \alpha^{2t})$$

其中 $\alpha$ 是 $GF(2^8)$ 的一个本原元素（通常取 $\alpha =$ 0x02）。

编码时，**计算**$D(x)$**除以**$G(x)$**的余数**$R(x)$，**码字为**$C(x) = D(x) \mod (G(x)) = D(x) - R(x)$。这保证了 $C(x)$ 能被 $G(x)$ 整除，即 $C(\alpha^i) = 0$ 对 i = 1, …, 2t 成立。

### 编码实现
```c
#define GF_POLY 0x11B
#define RS_MAX_NSYM 32

typedef struct {
    int nsym;                     /* 校验符号数 = 2t */
    uint8_t gen[RS_MAX_NSYM + 1]; /* 生成多项式系数 */
} rs_codec_t;

/* 构建生成多项式 G(x) = prod(x - alpha^i) for i = 1..nsym */
static void rs_build_generator(rs_codec_t *rs)
{
    memset(rs->gen, 0, sizeof(rs->gen));
    rs->gen[0] = 1;
    int len = 1;
    for (int i = 0; i < rs->nsym; i++) {
        uint8_t root = gf256_pow(0x02, i + 1); /* alpha^(i+1) */
        /* gen = gen * (x - root)，在 GF(2^8) 中减法等于加法 */
        for (int j = len; j > 0; j--) {
            rs->gen[j] = rs->gen[j - 1] ^ gf256_mul_log(rs->gen[j], root);
        }
        rs->gen[0] = gf256_mul_log(rs->gen[0], root);
        len++;
    }
}

/* RS 编码：输入 data[0..data_len-1]，输出 parity[0..nsym-1] */
static void rs_encode(const rs_codec_t *rs,
                      const uint8_t *data, int data_len,
                      uint8_t *parity)
{
    memset(parity, 0, rs->nsym);
    for (int i = 0; i < data_len; i++) {
        uint8_t feedback = data[i] ^ parity[0];
        /* 移位寄存器 */
        for (int j = 0; j < rs->nsym - 1; j++) {
            parity[j] = parity[j + 1] ^ gf256_mul_log(feedback, rs->gen[rs->nsym - 1 - j]);
        }
        parity[rs->nsym - 1] = gf256_mul_log(feedback, rs->gen[0]);
    }
}
```

### 伴随式计算（Syndrome）
接收到码字 $R(x)$ 后，计算伴随式：

$$S_i = R(\alpha^i), \quad i = 1, 2, \ldots, 2t$$

**如果所有**$S_i = 0$**，则传输无错误**。否则，伴随式携带了错误的位置和大小信息。

```c
static void rs_calc_syndromes(const uint8_t *msg, int msg_len,
                              int nsym, uint8_t *syndromes)
{
    for (int i = 0; i < nsym; i++) {
        uint8_t alpha_i = gf256_pow(0x02, i + 1);
        uint8_t s = 0;
        for (int j = 0; j < msg_len; j++) {
            s = gf256_mul_log(s, alpha_i) ^ msg[j];
        }
        syndromes[i] = s;
    }
}
```

## Berlekamp-Massey 解码
Reed-Solomon 解码是一个多步骤过程。给定伴随式，我们需要找到错误位置和错误值。Berlekamp-Massey 算法是这个过程中最关键的一步。

### 解码流程概览
1. **计算伴随式** $S_1, S_2, …, S_{2t}$。
2. **Berlekamp-Massey 算法**：从伴随式求出**错误定位多项式** `Lambda(x)`。
3. **Chien 搜索**：找到 `Lambda(x)` 的根，**根的逆就是错误位置**。
4. **Forney 算法**：计算每个错误位置上的错误值。

### Berlekamp-Massey 算法
**BM 算法**的核心思想是迭代地构造最短的线性反馈移位寄存器（LFSR），使其生成的序列与伴随式序列一致。算法维护两个多项式：当前最优的` Lambda(x)` 和上一次更新的 `B(x)`。

```c
/* Berlekamp-Massey 算法：从伴随式求错误定位多项式 */
static int rs_berlekamp_massey(const uint8_t *syndromes, int nsym,
                               uint8_t *lambda)
{
    uint8_t C[RS_MAX_NSYM + 1] = {0};  /* 当前 Lambda */
    uint8_t B[RS_MAX_NSYM + 1] = {0};  /* 辅助多项式 */
    C[0] = 1;
    B[0] = 1;
    int L = 0;     /* 当前 LFSR 长度 */
    int m = 1;     /* 上次更新后的步数 */
    uint8_t b = 1; /* 上次的差异值 */

    for (int n = 0; n < nsym; n++) {
        /* 计算差异 delta */
        uint8_t delta = syndromes[n];
        for (int j = 1; j <= L; j++) {
            delta ^= gf256_mul_log(C[j], syndromes[n - j]);
        }

        if (delta == 0) {
            m++;
            continue;
        }

        uint8_t T[RS_MAX_NSYM + 1];
        memcpy(T, C, sizeof(T));

        /* C(x) = C(x) - (delta/b) * x^m * B(x) */
        uint8_t coeff = gf256_mul_log(delta, gf256_inv_log(b));
        for (int j = m; j < nsym + 1; j++) {
            C[j] ^= gf256_mul_log(coeff, B[j - m]);
        }

        if (2 * L <= n) {
            L = n + 1 - L;
            memcpy(B, T, sizeof(B));
            b = delta;
            m = 1;
        } else {
            m++;
        }
    }

    memcpy(lambda, C, nsym + 1);
    return L;  /* 错误个数 */
}
```

### Chien 搜索
Chien 搜索通过逐一代入 $\alpha^{-i}$ 来找 `Lambda(x)` 的根：

```c
/* Chien 搜索：找 Lambda(x) 的根，返回错误位置 */
static int rs_chien_search(const uint8_t *lambda, int num_errors,
                           int msg_len, uint8_t *err_pos)
{
    int count = 0;
    for (int i = 0; i < msg_len; i++) {
        uint8_t alpha_inv_i = gf256_pow(0x02, 255 - i);
        uint8_t eval = 1;
        uint8_t alpha_inv_ij = 1;
        for (int j = 1; j <= num_errors; j++) {
            alpha_inv_ij = gf256_mul_log(alpha_inv_ij, alpha_inv_i);
            eval ^= gf256_mul_log(lambda[j], alpha_inv_ij);
        }
        if (eval == 0) {
            err_pos[count++] = (uint8_t)(msg_len - 1 - i);
        }
    }
    return count;
}
```

### Forney 算法
Forney 算法利用错误求值多项式 `Omega(x)` 和 `Lambda(x)` 的形式导数来计算错误值：

$$e_i = \frac{\alpha^{j_i} \cdot \Omega(\alpha^{-j_i})}{\Lambda'(\alpha^{-j_i})}$$

```c
/* 错误求值多项式 Omega(x) = S(x) * Lambda(x) mod x^(2t) */
static void rs_calc_omega(const uint8_t *syndromes,
                          const uint8_t *lambda, int nsym,
                          uint8_t *omega)
{
    memset(omega, 0, nsym);
    for (int i = 0; i < nsym; i++) {
        uint8_t val = 0;
        for (int j = 0; j <= i; j++) {
            val ^= gf256_mul_log(syndromes[i - j], lambda[j]);
        }
        omega[i] = val;
    }
}

/* Forney 算法：计算错误值 */
static void rs_forney(const uint8_t *lambda, const uint8_t *omega,
                      const uint8_t *err_pos, int num_errors,
                      int msg_len, uint8_t *msg)
{
    for (int i = 0; i < num_errors; i++) {
        uint8_t Xi = gf256_pow(0x02, msg_len - 1 - err_pos[i]);
        uint8_t Xi_inv = gf256_inv_log(Xi);

        /* Lambda'(Xi_inv)：形式导数只取奇数次项 */
        uint8_t lambda_prime = 0;
        uint8_t Xi_inv_j = 1;
        for (int j = 1; j <= num_errors; j++) {
            Xi_inv_j = gf256_mul_log(Xi_inv_j, Xi_inv);
            if (j & 1) {
                lambda_prime ^= gf256_mul_log(lambda[j], Xi_inv_j);
            }
        }

        /* Omega(Xi_inv) */
        uint8_t omega_val = 0;
        Xi_inv_j = 1;
        for (int j = 0; j < num_errors; j++) {
            omega_val ^= gf256_mul_log(omega[j], Xi_inv_j);
            Xi_inv_j = gf256_mul_log(Xi_inv_j, Xi_inv);
        }

        /* 错误值 e = Xi * Omega / Lambda' */
        uint8_t error_val = gf256_mul_log(
            gf256_mul_log(Xi, omega_val),
            gf256_inv_log(lambda_prime)
        );

        msg[err_pos[i]] ^= error_val;  /* 纠正错误 */
    }
}
```

## 完整的 GF(2^8) 与 Reed-Solomon C 实现
以下是一个自包含的 C 实现，包含 $GF(2^8)$ 算术库和 RS 编码/解码器。大约 260 行，可直接编译运行。

```c
/* gf256_rs.c -- GF(2^8) arithmetic + Reed-Solomon codec
 * Compile: gcc -O2 -o gf256_rs gf256_rs.c
 * Usage:   ./gf256_rs
 */
#include <stdio.h>
#include <stdint.h>
#include <string.h>
#include <stdlib.h>

/* ===================== GF(2^8) 算术 ===================== */

#define GF_MOD 0x11B  /* x^8 + x^4 + x^3 + x + 1 */

static uint8_t gf_exp[512];
static uint8_t gf_log[256];

/* 基础乘法：移位-XOR（不依赖表） */
static uint8_t gf_mul_slow(uint8_t a, uint8_t b)
{
    uint16_t p = 0;
    for (int i = 0; i < 8; i++) {
        if (b & 1) p ^= a;
        uint8_t hi = a & 0x80;
        a <<= 1;
        if (hi) a ^= 0x1B;
        b >>= 1;
    }
    return (uint8_t)p;
}

/* 构建 log/exp 表 */
static void gf_init(void)
{
    uint8_t g = 1;
    for (int i = 0; i < 255; i++) {
        gf_exp[i] = g;
        gf_exp[i + 255] = g;
        gf_log[g] = (uint8_t)i;
        g = gf_mul_slow(g, 0x03);
    }
    gf_log[0] = 0;
}

/* 快速乘法（基于表） */
static inline uint8_t gf_mul(uint8_t a, uint8_t b)
{
    if (a == 0 || b == 0) return 0;
    return gf_exp[(int)gf_log[a] + (int)gf_log[b]];
}

/* 快速求逆 */
static inline uint8_t gf_inv(uint8_t a)
{
    if (a == 0) return 0;
    return gf_exp[255 - gf_log[a]];
}

/* 快速除法 */
static inline uint8_t gf_div(uint8_t a, uint8_t b)
{
    if (a == 0) return 0;
    return gf_exp[((int)gf_log[a] - (int)gf_log[b] + 255)];
}

/* 幂运算 */
static uint8_t gf_pow(uint8_t base, int exp)
{
    if (exp == 0) return 1;
    if (base == 0) return 0;
    int l = ((int)gf_log[base] * exp) % 255;
    if (l < 0) l += 255;
    return gf_exp[l];
}

/* =================== Reed-Solomon 编解码 =================== */

#define RS_MAX_NSYM  32
#define RS_MAX_MSG   255

typedef struct {
    int nsym;
    uint8_t gen[RS_MAX_NSYM + 1];
} rs_t;

/* 构建生成多项式 */
static void rs_generator(rs_t *rs, int nsym)
{
    rs->nsym = nsym;
    memset(rs->gen, 0, sizeof(rs->gen));
    rs->gen[0] = 1;
    for (int i = 0; i < nsym; i++) {
        uint8_t root = gf_pow(0x02, i + 1);
        for (int j = nsym; j > 0; j--) {
            rs->gen[j] = rs->gen[j - 1] ^ gf_mul(rs->gen[j], root);
        }
        rs->gen[0] = gf_mul(rs->gen[0], root);
    }
}

/* 编码：data[0..k-1] -> parity[0..nsym-1] */
static void rs_encode(const rs_t *rs,
                      const uint8_t *data, int k,
                      uint8_t *parity)
{
    int nsym = rs->nsym;
    memset(parity, 0, nsym);
    for (int i = 0; i < k; i++) {
        uint8_t fb = data[i] ^ parity[0];
        for (int j = 0; j < nsym - 1; j++) {
            parity[j] = parity[j + 1] ^ gf_mul(fb, rs->gen[nsym - 1 - j]);
        }
        parity[nsym - 1] = gf_mul(fb, rs->gen[0]);
    }
}

/* 伴随式 */
static void rs_syndromes(const uint8_t *msg, int n, int nsym,
                         uint8_t *syn)
{
    for (int i = 0; i < nsym; i++) {
        uint8_t a = gf_pow(0x02, i + 1);
        uint8_t s = 0;
        for (int j = 0; j < n; j++) {
            s = gf_mul(s, a) ^ msg[j];
        }
        syn[i] = s;
    }
}

/* Berlekamp-Massey */
static int rs_berlekamp_massey(const uint8_t *syn, int nsym,
                               uint8_t *C)
{
    uint8_t B[RS_MAX_NSYM + 1] = {0};
    uint8_t T[RS_MAX_NSYM + 1];
    memset(C, 0, (nsym + 1));
    C[0] = 1; B[0] = 1;
    int L = 0, m = 1;
    uint8_t b = 1;

    for (int n = 0; n < nsym; n++) {
        uint8_t d = syn[n];
        for (int j = 1; j <= L; j++)
            d ^= gf_mul(C[j], syn[n - j]);
        if (d == 0) { m++; continue; }
        memcpy(T, C, nsym + 1);
        uint8_t c = gf_mul(d, gf_inv(b));
        for (int j = m; j <= nsym; j++)
            C[j] ^= gf_mul(c, B[j - m]);
        if (2 * L <= n) {
            L = n + 1 - L;
            memcpy(B, T, nsym + 1);
            b = d; m = 1;
        } else { m++; }
    }
    return L;
}

/* Chien 搜索 */
static int rs_chien(const uint8_t *lam, int errs, int n,
                    uint8_t *pos)
{
    int cnt = 0;
    for (int i = 0; i < n; i++) {
        uint8_t ai = gf_pow(0x02, 255 - i);
        uint8_t ev = 1, aij = 1;
        for (int j = 1; j <= errs; j++) {
            aij = gf_mul(aij, ai);
            ev ^= gf_mul(lam[j], aij);
        }
        if (ev == 0) pos[cnt++] = (uint8_t)(n - 1 - i);
    }
    return cnt;
}

/* Forney：纠正错误 */
static void rs_forney(const uint8_t *lam, const uint8_t *syn,
                      const uint8_t *pos, int errs,
                      int nsym, int n, uint8_t *msg)
{
    /* Omega = S*Lambda mod x^nsym */
    uint8_t omega[RS_MAX_NSYM] = {0};
    for (int i = 0; i < nsym; i++) {
        uint8_t v = 0;
        for (int j = 0; j <= i && j <= errs; j++)
            v ^= gf_mul(syn[i - j], lam[j]);
        omega[i] = v;
    }

    for (int i = 0; i < errs; i++) {
        uint8_t Xi = gf_pow(0x02, n - 1 - pos[i]);
        uint8_t Xi_inv = gf_inv(Xi);
        /* Lambda' 形式导数 */
        uint8_t lp = 0, xij = 1;
        for (int j = 1; j <= errs; j++) {
            xij = gf_mul(xij, Xi_inv);
            if (j & 1) lp ^= gf_mul(lam[j], xij);
        }
        /* Omega(Xi_inv) */
        uint8_t ov = 0;
        xij = 1;
        for (int j = 0; j < nsym; j++) {
            ov ^= gf_mul(omega[j], xij);
            xij = gf_mul(xij, Xi_inv);
        }
        msg[pos[i]] ^= gf_mul(gf_mul(Xi, ov), gf_inv(lp));
    }
}

/* 解码：检测并纠正错误，返回纠正的错误数，-1 表示不可纠正 */
static int rs_decode(const rs_t *rs, uint8_t *msg, int n)
{
    int nsym = rs->nsym;
    uint8_t syn[RS_MAX_NSYM];
    rs_syndromes(msg, n, nsym, syn);

    /* 检查是否全零（无错误） */
    int all_zero = 1;
    for (int i = 0; i < nsym; i++)
        if (syn[i]) { all_zero = 0; break; }
    if (all_zero) return 0;

    uint8_t lam[RS_MAX_NSYM + 1];
    int errs = rs_berlekamp_massey(syn, nsym, lam);
    if (errs > nsym / 2) return -1;

    uint8_t pos[RS_MAX_NSYM];
    int found = rs_chien(lam, errs, n, pos);
    if (found != errs) return -1;

    rs_forney(lam, syn, pos, errs, nsym, n, msg);
    return errs;
}

/* ======================== 测试 ======================== */

int main(void)
{
    gf_init();

    /* 验证 GF(2^8) 基本运算 */
    printf("=== GF(2^8) basic test ===\n");
    uint8_t a = 0x57, b = 0x83;
    uint8_t prod = gf_mul(a, b);
    printf("0x%02X * 0x%02X = 0x%02X\n", a, b, prod);
    printf("0x%02X / 0x%02X = 0x%02X (expect 0x%02X)\n",
           prod, b, gf_div(prod, b), a);
    printf("0x%02X * inv(0x%02X) = 0x%02X (expect 0x01)\n",
           a, a, gf_mul(a, gf_inv(a)));

    /* Reed-Solomon 编解码测试 */
    printf("\n=== Reed-Solomon test ===\n");
    rs_t rs;
    int nsym = 10;  /* 可纠正 5 个错误 */
    rs_generator(&rs, nsym);

    uint8_t data[] = "Hello, Reed-Solomon!";
    int k = (int)strlen((char *)data);
    int n = k + nsym;
    uint8_t codeword[RS_MAX_MSG];
    uint8_t parity[RS_MAX_NSYM];

    rs_encode(&rs, data, k, parity);
    memcpy(codeword, data, k);
    memcpy(codeword + k, parity, nsym);

    printf("Original:  ");
    for (int i = 0; i < n; i++) printf("%02X ", codeword[i]);
    printf("\n");

    /* 引入 3 个错误 */
    codeword[2]  ^= 0xFF;
    codeword[7]  ^= 0xAA;
    codeword[15] ^= 0x55;
    printf("Corrupted: ");
    for (int i = 0; i < n; i++) printf("%02X ", codeword[i]);
    printf("\n");

    int corrected = rs_decode(&rs, codeword, n);
    printf("Corrected %d errors\n", corrected);
    printf("Decoded:   ");
    for (int i = 0; i < n; i++) printf("%02X ", codeword[i]);
    printf("\n");
    printf("Message:   %.*s\n", k, codeword);

    return 0;
}
```

编译运行：

```plain
gcc -O2 -o gf256_rs gf256_rs.c && ./gf256_rs
```

预期输出中可以看到：$GF(2^8)$ 乘除互逆验证通过，3 个随机错误被成功纠正，原始消息完整恢复。
