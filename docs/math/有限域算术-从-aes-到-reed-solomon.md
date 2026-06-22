> 摘录自：[有限域算术：从 AES 到 Reed-Solomon](https://quant67.com/post/algorithms/103-finite-field/finite-field.html)
>

你每天都在跟有限域打交道，只是你可能不知道。

打开一个 HTTPS 网页，AES-GCM 加密流量时在 $ GF(2^8) $ 和 $ GF(2^128) $ 上做乘法。手机扫一个二维码，Reed-Solomon 纠错码在 $ GF(2^8) $ 上做多项式求值。NAS 上跑 ZFS，它的校验和基于 Reed-Solomon 编码。你用的每一张 CD、每一张 DVD、每一块 SSD 的 ECC，底层都是有限域运算。

有限域（Finite Field），又叫伽罗瓦域（Galois Field），是一个只含有限个元素的集合，且在这个集合上定义了加减乘除四种运算，运算结果永远不会”溢出”到集合外面。这个性质使得它成为密码学和纠错编码的理想数学工具：你可以在有限的比特宽度内做完整的代数运算，不丢信息，不需要浮点数，不需要大整数库。

本文从群、环、域的公理出发，逐步构造 GF(p) 和 $ GF(2^n) $，然后深入 AES、Reed-Solomon、GHASH、Shamir 秘密共享等具体应用，最后给出一个完整的 C 实现和工程实战经验。

<!-- 这是一张图片，ocr 内容为： -->
![GF(2^8) 乘法流程](https://images.spumn.eu.cc/blog/1e1b240428447a73.svg)

# 代数结构速览：群、环、域
在讨论有限域之前，需要回顾三个代数结构。这不是纯数学的自娱自乐——理解这些公理，你才能明白为什么 AES 选择了特定的不可约多项式，为什么 Reed-Solomon 编码天然具有纠错能力。

### 群（Group）
一个集合 G 配上一个二元运算 _，_满足以下四条公理就构成一个群 $ (G, *) $：

1. **封闭性**：对任意 a, b 属于 G，$ a * b $ 也属于 G。
2. **结合律**：$ (a * b) * c = a * (b * c) $。
3. **单位元**：存在元素 e 属于 G，使得对任意 a 属于 G，e * a = a * e = a。
4. **逆元**：对任意 a 属于 G，存在 $ a^{-1} $<sup> </sup>属于 G，使得 $ a * a^{-1} = a^{-1} * a = e $。

如果还满足交换律 $ a * b = b * a $，就叫**阿贝尔群**（交换群）。

最常见的例子：整数集合在加法下构成阿贝尔群，单位元是 0，a 的逆元是 -a。

### 环（Ring）
一个集合 R 配上加法 + 和乘法 *，满足：

1. $ (R, +) $ 是阿贝尔群（加法单位元记为 0）。
2. 乘法满足结合律。
3. 乘法对加法满足分配律：$ a * (b + c) = a * b + a * c $。

如果乘法还有单位元 1，就叫**含幺环**。如果乘法还满足交换律，就叫**交换环**。

整数集合 Z 就是一个交换环。但 Z 不是域——因为 2 没有乘法逆元（1/2 不是整数）。

### 域（Field）
一个集合 F 配上加法 + 和乘法 *，满足：

1. $ (F, +) $ 是阿贝尔群。
2. $ (F \setminus \{0\}, *) $ 是阿贝尔群（非零元素在乘法下构成阿贝尔群）。
3. 乘法对加法满足分配律。

域的核心要求是：**每个非零元素都有乘法逆元**。这意味着除法（除零以外）总是可行的。

有理数 $ Q $、实数 $ R $、复数 $ C $ 都是域，但它们是无限域。我们关心的是**有限域**：元素个数有限的域。

### 有限域的基本定理
有限域的存在性和唯一性由以下定理完全刻画：

**定理**：有限域的元素个数必为素数的幂 $ p^n $，其中 $ p $ 是素数，$ n $ 是正整数。反之，对任意素数幂 $ p^n $，恰好存在一个（同构意义下）含 $ p^n $ 个元素的有限域，记作 $ GF(p^n) $。

首先我们有： 令 $ (𝐹, +, ·) $ 是一个域，而 $ char(𝐹) ≠ 0 $，则 $ char(𝐹) = 𝑝 $ 是一个素数。

那么可以证明有限域的阶一定是某个素数的幂次：

<!-- 这是一张图片，ocr 内容为： -->
![](https://images.spumn.eu.cc/blog/finite-field-cyclic-group.png)

=> **任何有限域的乘法群（**$ \mathbb{F}_{p^n}^\times $**）都是阶为 **$ p^n - 1 $** 的循环群(去掉一个 0)。**

这个定理告诉我们两件事：

1. 不存在含 6 个元素的有限域（$ 6 = 2 * 3 $，不是素数幂）。
2. $ GF(256) $ 是唯一的——不同构造方法（选不同的不可约多项式）得到的 $ GF(256) $ 在结构上是同构的。

### <font style="color:#000000;">本原多项式和最小多项式</font>
<font style="color:#000000;">令 </font>$ (R, +, \cdot) $<font style="color:#000000;"> 是一个唯一分解整环，而 </font>$ f = \sum_n a_n x^n \in R[x] \setminus \{0\} $<font style="color:#000000;">，则我们定义 </font>$ f $<font style="color:#000000;"> 的多项式容量，记作 </font>$ \text{cont}(f) $<font style="color:#000000;">，定义为 </font>$ f $<font style="color:#000000;"> 上所有系数的最大公因数，即</font>

$ \text{cont}(f) = \gcd(a_0, \cdots, a_n)  $

<font style="color:#000000;">其中 </font>$ a_n $<font style="color:#000000;"> 是 </font>$ f $<font style="color:#000000;"> 的首项系数。而 </font>$ \text{cont}(f) $<font style="color:#000000;"> 是不一定唯一的，但是最多相差一个单位。</font>

<font style="color:#000000;">假如 </font>$ \text{cont}(f) = 1 $<font style="color:#000000;">，我们就称 </font>$ f $<font style="color:#000000;"> 是个本原多项式。</font>

---

令 $ F/E $ 是一个域扩张，**而 **$ a \in F $。若 $ E(a)/E $ 是个有限扩张，则存在**唯一的首一非零**多项式 $ p(x) $，使得

$ \forall f(x) \in E[x], (f(a) = 0 \implies p(x) \mid f(x)) $

<font style="color:#000000;">我们称这个多项式为 </font>$ a $<font style="color:#000000;"> 在</font>**<font style="color:#000000;">域 </font>**$ E $**<font style="color:#000000;"> </font>**<font style="color:#000000;">上的最小多项式。</font>

<font style="color:#000000;">例如 </font>$ f(x)=(x−1)(x+1) $<font style="color:#000000;">，那么 </font>$ a = 1 $<font style="color:#000000;"> 的最小多项式是 </font>$ x−1 $<font style="color:#000000;">，因为它是首一的、以 </font>$ 1 $<font style="color:#000000;">为根的最低次多项式，并且整除任何以 </font>$ 1 $<font style="color:#000000;">为根的多项式（如 </font>$ (x−1)(x+1) $<font style="color:#000000;">）。</font>

---

### <font style="color:#000000;">有限域与分裂域</font>
<font style="color:#000000;">我们有引理：</font>

1. <font style="color:#000000;">令 </font>$ F/E $<font style="color:#000000;"> 是一个域扩张，而 </font>$ a \in F $<font style="color:#000000;">。假设 </font>$ E(a)/E $<font style="color:#000000;"> 是个有限扩张，令 </font>$ p(x) $<font style="color:#000000;"> 是 </font>$ a $<font style="color:#000000;"> 在 </font>$ E $<font style="color:#000000;"> 上的最小多项式，则</font>

$ E[x]/(p(x)) \simeq E(a) $

2. <font style="color:#000000;">令 </font>$ (F, +, \cdot) $<font style="color:#000000;"> 是个阶为 </font>$ q = p^n $<font style="color:#000000;"> 的有限域。则：</font>

$ F $<font style="color:#000000;"> (记为</font>$ \mathbb{F}_q $<font style="color:#000000;">或 </font>$ GF(q) $<font style="color:#000000;">)是 </font>$ x^{p^n} - x $**<font style="color:#000000;"> 在 </font>**$ \mathbb{F}_p $**<font style="color:#000000;"> 上的一个分裂域</font>**<font style="color:#000000;">。</font>

3. <font style="color:#000000;">令 </font>$ (F_1, +, \cdot) $<font style="color:#000000;"> 和 </font>$ (F_2, +, \cdot) $<font style="color:#000000;"> 是</font>**<font style="color:#000000;">阶相等的有限域，则 </font>**$ F_1 \simeq F_2 $<font style="color:#000000;">。假设 </font>$ |F_1| = |F_2| = q = p^n $<font style="color:#000000;">，则我们在同构的意义下，</font>**<font style="color:#000000;">记 </font>**$ \mathbb{F}_q = \mathbb{F}_{p^n} $**<font style="color:#000000;"> 为这样的有限域</font>**<font style="color:#000000;">。—— 分裂域的唯一性</font>

---

根据2，**任何阶为 **$ q=p^n $**的有限域 **$ F $ 都是多项式 $ x^{p^n} - x $在**基域** $ \mathbb{F}_p $上的**分裂域**。这意味着：

+ $ f(x) $在 $ \mathbb{F}_p $上可以分解为一次因式的乘积，即所有根均属于 $ F $(分裂域定义）；
+ $ F $包含且仅包含 $ f(x) $的全部 $ p^n $个根（包括0和1）。

根据 3 分裂域的唯一性：

+ 对于固定的 $ p $和 $ n $，多项式 $ x^{p^n} - x $在 $ \mathbb{F}_p $上的分裂域无论怎样构造，都与 $ \mathbb{F}_{p^n} $同构。
+ 因此，**所有阶为 **$ p^n $**的有限域本质上都是 **$ \mathbb{F}_{p^n} $，只是构造方式不同而已。

这两个引理告诉我们：**对于固定的 **$ p $** 和 **$ n $**，**$ \mathbb{F}_{p^n} $** 是唯一存在的**，**并且它就是 **$ x^{p^n} - x $** 的分裂域**。

---

设 $ f(x) \in \mathbb{F}_p[x] $ 是一个** **$ n $** **次**不可约多项式**。考虑商环

$ R = \mathbb{F}_p[x] / (f(x)). $

因为 $ f $ 不可约，理想 $ (f) $ 是极大理想，所以 $ R $ 是一个域。又因为 $ \dim_{\mathbb{F}_p} R = n $($ R $作为 $ \mathbb{F}_p $-向量空间的维数等于 $ degf=n $)，所以 $ R $** 是 **$ \mathbb{F}_p $** 的 **$ n $** 次扩域。**即$ R $中的每个元素都可以唯一表示为次数小于 $ n $的多项式，即形如 $ a_0+a_1x+⋯+a_{n−1}x^{n−1} $，其中 $ a_i∈\mathbb{F}_p $。

这样的表示共有 $ p^n $种，因此 $ R $恰有 $ p^n $个元素。根据引理 3，这样的扩域唯一（同构意义下），所以$ R \cong \mathbb{F}_{p^n}. $

即：

$ \boxed{\mathbb{F}_p[x] / (f(x)) \cong \mathbb{F}_{p^n}} $其中 $ f(x) \in \mathbb{F}_p[x] $ 是一个** **$ n $** **次**不可约多项式**.

另一方面，在商环$ R = \mathbb{F}_p[x] / (f(x)) $ 中，记**元素 **$ \alpha = x + (f(x)) $，即 $ x (\in \mathbb{F}_p[x]) $所在的陪集。

由于商映射 $ \pi : \mathbb{F}_p[x] \to R $ 是环同态，根据商环定义：

+ $ \pi(x) = x + (f(x)) = \alpha $,
+ $ \pi(f(x)) = f(x) + (f(x)) = 0 $.

而环同态保持多项式运算，因此：

$ f(\alpha) = f(\pi(x)) = \pi(f(x)) = f(x) + (f(x)) = 0. $

由引理 1（商环同构于单扩张），同样得到

$ \mathbb{F}_p[x]/(f(x)) \cong \mathbb{F}_p(\alpha). $

即

$ \boxed{\mathbb{F}_{p^n} \cong \mathbb{F}_p[x] / (f(x)) \cong \mathbb{F}_p(\alpha)}. $

根据有限域的基本定理$ \mathbb{F}_{p^n} $乘法阶为 $ p^n−1 $。

因此，**不可约多项式 **$ f(x) $** 决定了 **$ \mathbb{F}_p $** 的一个 **$ n $** 次扩域 **$ \mathbb{F}_{p^n} $**，并且 **$ \alpha $** 是该扩域的一个本原元（即生成元）当且仅当 **$ \alpha $** 的乘法阶为 **$ p^n - 1 $。

---

### 多项式的阶
定义多项式 $ f(x) $ 的**阶**为最小的正整数 $ e $ **使得**$ f(x) \mid (x^e - 1)  $**在 **$ \mathbb{F}_p[x] $** 中.**

这个定义与 $ \alpha $ 的乘法阶有什么关系呢？

+ 若 $ f(x) \mid (x^e - 1) $，则在商环 $ R = \mathbb{F}_p[x] / (f(x)) $ 中有 $ \alpha^e - 1 = 0 $，即 $ \alpha^e = 1 $，所以 $ \operatorname{ord}(\alpha) \mid e $。
+ 反之，若 $ \alpha^e = 1 $，则 $ \alpha $ 是 $ x^e - 1 $ 的根。由于 $ f(x) $ 是 $ \alpha $ 的**最小多项式**（因为 $ f $ 不可约且 $ f(\alpha)=0 $），所以 $ f(x) \mid (x^e - 1) $。

因此，**最小的 **$ e $** 使得 **$ f(x) \mid (x^e - 1) $** 正好就是 **$ \alpha $** 的乘法阶**，即$ \text{多项式的阶 } e_f = \operatorname{ord}(\alpha). $

---

我们知道 $ \mathbb{F}_{p^n}^\times $ 是阶为 $ p^n - 1 $ 的循环群。所以 $ \alpha $ 的乘法阶 $ \operatorname{ord}(\alpha) $ 整除 $ p^n - 1 $。

+ 当 $ \operatorname{ord}(\alpha) = p^n - 1 $ 时，$ \alpha $ 生成整个乘法群，称为**本原元**。此时 $ f(x) $ 称为**本原多项式**。
+ 等价地，多项式的阶 $ e_f = p^n - 1 $。

于是我们得到两种等价的定义：

**定义 A（阶）**：$ n $ 次不可约多项式 $ f(x) \in \mathbb{F}_p[x] $ 称为本原的，如果它的阶等于 $ p^n - 1 $。

**定义 B（生成元）**：在商环 $ \mathbb{F}_p[x]/(f(x)) \cong \mathbb{F}_{p^n} $ 中，元素 $ x $（即 $ x + (f(x)) $）的乘法阶恰为 $ p^n - 1 $。

---

应用到 AES 多项式

AES 使用的多项式是$ P(x) = x^8 + x^4 + x^3 + x + 1 \in \mathbb{F}_2[x]. $

已知它是 $ \mathbb{F}_2 $ 上的 8 次不可约多项式（30 个中最小的一个），并且是**本原多项式**。

根据定义 B，在 $ \mathbb{F}_2[x]/(P(x)) \cong \mathbb{F}_{2^8} $ 中，元素 $ x $ 的乘法阶为 $ 2^8 - 1 = 255 $。因此  
$ \{ x^0, x^1, x^2, \dots, x^{254} \} $恰好遍历所有 255 个非零元素。

这正是 AES 中字节运算的基础：每个非零字节（看作 $ \mathbb{F}_{2^8} $ 中的元素）都可以表示为 $ x $ 的幂次，从而方便进行乘法、求逆等运算。

---

# GF(p)：素数域的算术
当 n = 1 时，$ GF(p) $ 就是模 $ p $ 的整数集合 $ \{0, 1, 2, …, p-1\} $，加法和乘法都在模 $ p $ 下进行。

### 为什么 p 必须是素数
模 $ n $ 算术中，一个元素 $ a $ 有乘法逆元的充要条件是 $ gcd(a, n) = 1 $。如果 n 是素数，那么 $ \{1, 2, …, n-1\} $ 中的每个元素都与 n 互素，因此都有逆元。如果 $ n $ 不是素数，比如 $ n = 6 $，那么 $ 2 \times 3 \equiv 0 \pmod{6} $，两个非零元素相乘得到零——这就是所谓的零因子，有零因子的结构不可能是域。

元素 $ a\in R $称为**零因子（zero divisor）**，如果：

1. $ a \neq 0 $，**并且**
2. 存在某个 $ b \neq 0 $（也属于 R）使得$ a⋅b=0 $.

根据定义 => 零因子一定不可逆** ⇒ 只要环里有零因子，它就当不了域。**

### GF(p) 的四则运算
以 $ GF(7) $ 为例：

```plain
加法：3 + 5 = 8 mod 7 = 1
减法：2 - 5 = -3 mod 7 = 4
乘法：3 * 4 = 12 mod 7 = 5
除法：3 / 4 = 3 * 4^(-1) mod 7 = 3 * 2 mod 7 = 6
      (因为 4 * 2 = 8 mod 7 = 1，所以 4^(-1) = 2)
```

### 求逆元：扩展欧几里得算法
求 a 在 $ GF(p) $ 中的逆元，等价于求 `a * x + p * y = 1` 的整数解 `x`。这正是扩展欧几里得算法的经典应用。

```c
/* 扩展欧几里得算法，返回 gcd(a, b)，同时求出 x, y 使得 a*x + b*y = gcd(a,b) */
int ext_gcd(int a, int b, int *x, int *y)
{
    if (b == 0) {
        *x = 1;
        *y = 0;
        return a;
    }
    int x1, y1;
    int g = ext_gcd(b, a % b, &x1, &y1);
    *x = y1;
    *y = x1 - (a / b) * y1;
    return g;
}

/* 求 a 在模 p 下的逆元 */
int mod_inv(int a, int p)
{
    int x, y;
    ext_gcd(a, p, &x, &y);
    return ((x % p) + p) % p;
}
```

另一种方法是费马小定理：$ a^{p-1} \equiv 1\pmod{p} => a^{-1} = a^{p-2} \;mod \;p $。**这在 **$ p $** 很大时可以用快速幂高效计算，但在 **$ p $** 较小时不如扩展欧几里得直接**。

### GF(p) 的乘法群是循环群
$ GF(p) $ 的**非零元素在乘法下**构成一个 $ p-1 $ 阶的循环群。也就是说，存在一个**生成元**（原根）$ g $，使得 {$ g^0, g^1, g^2, …, g^{p-2} $} 恰好遍历 {1, 2, …, p-1}。

以 GF(7) 为例，3 是一个原根：

```plain
3^0 = 1
3^1 = 3
3^2 = 2
3^3 = 6
3^4 = 4
3^5 = 5
3^6 = 1 (回到起点)
```

这个性质在离散对数密码学（DH 密钥交换、ElGamal 加密）和 Shamir 秘密共享中至关重要。

# GF(2^n)：扩展域的构造
当我们需要 256 个元素的有限域时，不能用 $ GF(256) = Z/256Z $——因为 $ 256 = 2^8 $ 不是素数，$ Z/256Z $ 有零因子。正确的做法是构造 $ GF(2) $ 上的**多项式扩展域** $ GF(2^8) $。

### 构造方法
$ GF(2^n) $ 的构造类似于从实数扩展到复数的过程：

1. 取 $ GF(2) = \{0, 1\} $，加法是 XOR，乘法是 AND。
2. 选择一个 n 次**不可约多项式** $ P(x) $（在 $ GF(2)[x] $ 上不能分解为更低次多项式之积）。
3. $ GF(2^n) $**<font style="color:#DF2A3F;"> 的元素是 </font>**$ GF(2)[x] $**<font style="color:#DF2A3F;"> 中次数小于 n 的多项式，运算在模 </font>**$ P(x) $**<font style="color:#DF2A3F;"> 下进行。</font>**

### 不可约多项式的角色
不可约多项式在 $ GF(2^n) $ 中的角色，类似于素数在 $ \mathbb{Z}/p\mathbb{Z} $ 中的角色。多项式环 $ GF(2)[x] $ 模一个不可约多项式 $ P(x) $，得到的**商环**是一个域。如果 $ P(x) $ 可约，商环就会有零因子，不再是域。

以 $ GF(2^3) $ 为例。$ GF(2) $ 上的 3 次不可约多项式有两个：$ x^3 + x + 1 $ 和 $ x^3 + x^2 + 1 $。选择 $ P(x) = x^3 + x + 1 $，则 $ GF(2^3) = GF(2)[x] / (x^3 + x + 1) $，包含 8 个元素：

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
$ GF(2^n) $ 中的加法就是多项式系数逐项相加，在 $ GF(2) $ 中加法等于 XOR：

```plain
(x^2 + x + 1) + (x^2 + 1) = x
  即 111 XOR 101 = 010
```

加法的逆运算也是 $ XOR $（因为**在 GF(2) 中 **$ -1 = 1 $），所以 $ GF(2^n) $ 中**加法和减法完全相同**。

### 乘法：多项式乘法模 P(x)
乘法是先做**普通多项式乘法（系数在 **$ GF(2) $** 中），然后对 **$ P(x) $** 取模**：

```plain
(x^2 + x) * (x + 1)   在 GF(2^3) 中，P(x) = x^3 + x + 1

普通乘法：x^3 + x^2 + x^2 + x = x^3 + x  (GF(2) 中 1+1=0)
模 P(x)：x^3 + x mod (x^3 + x + 1)
        = (x^3 + x) - (x^3 + x + 1) = 1    (在 GF(2) 中减法等于加法)

所以 110 * 011 = 001
```

### 如何验证不可约性
艾森斯坦判别法（Eisenstein’s criterion）——$ \mathbb{Q} $（更一般地 $ \mathbb{Z} $）版本（最常用）

设

$ f(x) = a_n x^n + a_{n-1} x^{n-1} + \cdots + a_1 x + a_0 \in \mathbb{Z}[x], \quad a_n 
\neq 0 $

是一个整系数多项式，并且存在素数 $ p $ 使得

1. $ p \mid a_i $ 对所有 $ i = 0, 1, \dots, n-1 $（即 $ p $ 整除**除首项外的所有系数**）；
2. $ p \mid a_n $（$ p $ **不整除首项系数**）；
3. $ p^2 \mid a_0 $（$ p $ 的**平方不整除常数项**）。

则 $ f(x) $ 在 $ \mathbb{Z}[x] $ 中是**不可约的**；从而把 $ f $ 看成 $ \mathbb{Q}[x] $ 中的多项式也是**不可约的**（在 $ \mathbb{Q} $ 上不可约）。

判断一个 n 次多项式 $ f(x) $ 在 $ GF(2) $ 上是否不可约，最简单的方法是：**检验 **$ f(x) $** 不能被任何次数 <= n/2 的不可约多项式整除**。对于小的 n，穷举即可。对于大的 n，有更高效的算法：

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

# GF(2^8) 与 AES：密码学的核心运算
**AES（Advanced Encryption Standard）**是当今使用最广泛的对称加密算法，它的内部运算深度依赖 $ GF(2^8) $ 算术。理解这一点，你才能真正理解 AES 的设计哲学，而不只是把它当成一个黑盒。

### AES 选择的不可约多项式
AES 标准（FIPS 197）选择的不可约多项式是：

$ P(x) = x^8 + x^4 + x^3 + x + 1 $

用十六进制表示为 0x11B（包含 $ x^8 $ 项时是 9 位：100011011）。

这个多项式的选择不是随意的。它是 $ GF(2) $ 上 30 个 8 次不可约多项式中最小的一个（按字典序），且是**本原多项式**——意味着 $ x $ 是 $ GF(2^8)^* $ 的生成元，{$ x^0, x^1, …, x^{254} $} 遍历所有 255 个非零元素。本原性保证了域的乘法群具有最好的循环结构。

### S-box：GF(2^8) 上的求逆
AES 的 SubBytes 步骤使用一个 16x16 的查找表（S-box），它的数学定义是：

1. 对输入字节 b，计算 b 在 $ GF(2^8) $ 中的乘法逆元 $ b^{-1} $（0 映射到 0）。
2. 对 $ b^{-1} $ 施加一个 $ GF(2) $ 上的仿射变换。

S-box 的密码学强度来自第一步的求逆运算。$ GF(2^8) $ 上的求逆具有优秀的**非线性度**：它的布尔函数表示具有最高可能的代数次数，使得差分攻击和线性攻击都难以奏效。

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
AES 的 MixColumns 步骤将状态矩阵的每一列视为 $ GF(2^8) $ 上的 4 维向量，乘以一个固定矩阵：

```plain
| 02  03  01  01 |   | s0 |
| 01  02  03  01 | * | s1 |
| 01  01  02  03 |   | s2 |
| 03  01  01  02 |   | s3 |
```

其中 01、02、03 都是 $ GF(2^8) $ 中的元素，矩阵乘法中的加法是 XOR，乘法是 $ GF(2^8) $ 乘法。

这个矩阵的选择也有深意：它是一个 **<font style="color:#DF2A3F;">MDS（Maximum Distance Separable）矩阵</font>**，意味着任何两个不同的输入列之间，至少有 5 个字节不同（分支数为 5）。这保证了差分传播的最优扩散特性。

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

# 无进位乘法：CLMUL 指令
$ GF(2^n) $ 的乘法本质上是**无进位乘法**（carry-less multiplication）——和普通整数乘法一样做移位和累加，但”加”是 XOR 而非带进位的加法。

### 从笔算到硬件
回忆小学的竖式乘法，$ a * b $ 是把 b 的每一位对应的 a 的移位版本相加。在 $ GF(2) $ 上，<font style="color:#DF2A3F;">“相加”变成 XOR，也就不存在进位传播。这使得无进位乘法天然适合并行化</font>。

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
PCLMULQDQ 指令最初是为 AES-GCM 中的 GHASH 运算设计的（$ GF(2^{128}) $ 乘法），但它的应用远不止于此：

1. **CRC 计算**：CRC 本质上是 GF(2) 上的多项式除法，CLMUL 可以极大加速。
2. $ GF(2^8) $** 批量乘法**：Reed-Solomon 编码/解码中的批量运算。
3. **Rabin 指纹**：用于内容定义分块（CDC）的滚动哈希。
4. **Barrett 规约**：配合 CLMUL 实现高效的模不可约多项式运算。

### GF(2^8) 乘法的 CLMUL 实现
**用 CLMUL 做 **$ GF(2^8) $** 乘法**需要两步：无进位乘法得到最多 15 位的乘积，然后对 0x11B 取模：

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
**在不支持 CLMUL 的平台上（嵌入式系统、8 位微控制器），对数/反对数表是 **$ GF(2^8) $** 乘法的经典加速手段。**

### 原理
$ GF(2^8)^* $ 是一个 255 阶的循环群，选定一个生成元 g（AES 中常用 g = 0x03），任意非零元素 a 都可以表示为 $ a = g^{(log_g(a))} $。于是：

$ a \times b = g^{(\log_g(a) + \log_g(b)) \mod 255} $

<font style="color:#DF2A3F;">一次乘法变成了两次查表（log_table）、一次加法、一次查表（exp_table）</font>，总共三次内存访问。

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
`log_table` 和 `exp_table` 各 256/512 字节，合计不到 1KB，完美地放进 L1 缓存。这使得基于表的 $ GF(2^8) $ 乘法在嵌入式平台上非常高效，单次乘法只需 3 次缓存命中的内存访问。

但在需要抵抗缓存侧信道攻击的场景（如 AES 的恒定时间实现），查表操作会泄露访问模式。这时必须使用位运算或 CLMUL 实现。

# Reed-Solomon 编码：多项式求值与纠错
Reed-Solomon 码是最广泛使用的纠错码之一。它在 $ GF(2^8) $ 上工作，将数据视为多项式系数，通过在特定点上求值来生成冗余校验符号。

### 编码原理
设**<font style="color:#DF2A3F;">数据为 </font>**$ k $**<font style="color:#DF2A3F;"> 个字节 </font>**$ d_0, d_1, …, d_{k-1} $，构造**数据多项式**：

$ \begin{align*}
D(x) &= d_0x^{n-1} + d_1x^{n-2} + \cdots + d_{k-1}x^{n-k} \\
     &= d_0x^{2t+k-1} + d_1x^{2t+k-2} + \cdots + d_{k-1}x^{2t + 0} \\
     &= x^{2t}(d_0x^{k-1} + d_1x^{k-2} + \cdots + d_{k-1})
\end{align*} $

**<font style="color:#DF2A3F;">其中 </font>**$ n = k + 2t $**<font style="color:#DF2A3F;">，</font>**$ t $**<font style="color:#DF2A3F;"> 是要纠正的最大错误数</font>**。

Reed-Solomon 编码的核心是**生成多项式**：

$ G(x) = (x - \alpha)(x - \alpha^2) \cdots (x - \alpha^{2t}) $

其中 $ \alpha $ 是 $ GF(2^8) $ 的一个本原元素（通常取 $ \alpha =  $0x02）。

编码时，**计算 **$ D(x) $** 除以 **$ G(x) $** 的余数 **$ R(x) $，**码字为 **$ C(x) = D(x) \mod (G(x)) = D(x) - R(x) $。这保证了 $ C(x) $ 能被 $ G(x) $ 整除，即 $ C(\alpha^i) = 0 $ 对 i = 1, …, 2t 成立。

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
接收到码字 $ R(x) $ 后，计算伴随式：

$ S_i = R(\alpha^i), \quad i = 1, 2, \ldots, 2t $

**如果所有 **$ S_i = 0 $**，则传输无错误**。否则，伴随式携带了错误的位置和大小信息。

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

# Berlekamp-Massey 解码
Reed-Solomon 解码是一个多步骤过程。给定伴随式，我们需要找到错误位置和错误值。Berlekamp-Massey 算法是这个过程中最关键的一步。

### 解码流程概览
1. **计算伴随式** $ S_1, S_2, …, S_{2t} $。
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
Chien 搜索通过逐一代入 $ \alpha^{-i} $ 来找 `Lambda(x)` 的根：

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

$ e_i = \frac{\alpha^{j_i} \cdot \Omega(\alpha^{-j_i})}{\Lambda'(\alpha^{-j_i})} $

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

# 完整的 GF(2^8) 与 Reed-Solomon C 实现
以下是一个自包含的 C 实现，包含 $ GF(2^8) $ 算术库和 RS 编码/解码器。大约 260 行，可直接编译运行。

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

预期输出中可以看到：$ GF(2^8) $ 乘除互逆验证通过，3 个随机错误被成功纠正，原始消息完整恢复。

# GHASH 与 AES-GCM：GF(2^128) 乘法
AES-GCM 是目前最流行的 AEAD（Authenticated Encryption with Associated Data）方案。其中的认证部分 GHASH 是在 $ GF(2^{128}) $ 上做乘法。

### GHASH 的数学定义
GHASH 将消息分成 128 位的块 $ X_1, X_2, …, X_m $，计算：

$ Y_i = (Y_{i-1} \oplus X_i) \cdot H $

其中 H 是认证密钥，乘法在 $ GF(2^{128}) $ 中进行。不可约多项式是：

$ P(x) = x^{128} + x^7 + x^2 + x + 1 $

### GF(2^128) 乘法的挑战
128 位的无进位乘法产生 256 位的中间结果，然后需要模 $ P(x) $ 规约。在没有 CLMUL 的平台上，这需要大量的移位和 XOR 操作。有了 PCLMULQDQ，一次 $ GF(2^{128}) $ 乘法可以用 4 次 64 位 CLMUL（Karatsuba 分解）加规约完成：

```c
/* GF(2^128) 乘法（简化伪代码） */
/* t0 = clmul(a_lo, b_lo), t1 = clmul(a_hi, b_hi)         */
/* t2 = clmul(a_lo^a_hi, b_lo^b_hi), t3 = t2 ^ t0 ^ t1    */
/* 256-bit product = [t1_hi : t1_lo^t3_hi : t0_hi^t3_lo : t0_lo] */
/* 然后对 P(x) = x^128+x^7+x^2+x+1 做 Barrett 规约        */
```

### 性能影响
在支持 CLMUL 的处理器上，AES-GCM 的吞吐量可以超过 10 GB/s。没有 CLMUL 时，GF(2^128) 乘法成为瓶颈，吞吐量可能降至数百 MB/s。这就是为什么 OpenSSL 对 AES-GCM 有专门的 CLMUL 汇编优化路径。

# Shamir 秘密共享：GF(p) 上的应用
Shamir 秘密共享（SSS）是一个 (k, n) 门限方案：将秘密 s 分成 n 份，任意 k 份可以恢复 s，少于 k 份则无法获得 s 的任何信息。它在 $ GF(p) $ 上工作（p 是足够大的素数）。

### 原理
1. 选择一个 k-1 次随机多项式 $ f(x) = s + a_1x + a_2x^2 + … + a_{k-1}*x^{k-1} $，其中常数项是秘密 s。
2. 给第 i 个参与者分配 (i, f(i))，即多项式在 x = i 处的值。
3. 恢复时，用拉格朗日插值从 k 个点重建 f(x)，取 f(0) = s。

### 为什么用有限域
如果在实数上做，浮点精度会导致秘密泄露。在 $ GF(p) $ 上，所有运算都是精确的，且信息论安全——少于 k 份的参与者无法获得秘密的任何比特。

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

# 工程实战与性能分析
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


<font style="color:#ED740C;">对数表方法在非安全场景（Reed-Solomon 编解码、CRC 计算）中仍然是最实用的选择</font>：实现简单、跨平台、性能足够。但在密码学场景中，必须使用恒定时间实现。

### 工程踩坑表
| 陷阱 | 后果 | 正确做法 |
| :--- | :--- | :--- |
| $ GF(2^8) $ 加法用了 + 而非 XOR | 结果完全错误 | 牢记 GF(2) 中 1 + 1 = 0 |
| 乘法规约时忘记检查最高位 | 乘积溢出，域运算破坏 | xtime 中先检查 MSB 再移位 |
| 对数表中 log(0) 返回了 0 | gf_mul(0, x) 返回非零值 | 乘法函数中先判零 |
| RS 生成多项式的根从 $ \alpha^0 $ 开始 | 与标准不兼容 | QR 码用 $ \alpha^0 $，CD 用 $ \alpha^1 $，看标准 |
| GF(2^128) 的位序搞反 | GHASH 计算结果错误 | GCM 规范用的是 LSB-first 约定 |
| 用浮点数做 Shamir 秘密共享 | 精度损失导致秘密泄露 | 必须在有限域上做精确算术 |
| CLMUL 可用性未检测 | 程序在旧 CPU 上崩溃 | 运行时检测 CPUID，提供 fallback |
| Reed-Solomon 的 n 超过 255 | GF(2^8) 只有 255 个非零点 | n <= 255，需要更长码字则用 GF(2^16) |
| 混淆了 GF(2^n) 的不同不可约多项式 | 互操作失败 | 同一系统必须使用相同的 P(x) |
| 未处理 erasure（已知位置的错误） | 浪费纠错能力 | 1 个 erasure 只消耗 1 个校验符号，不是 2 个 |


### 真实世界中的有限域
有限域算术无处不在，以下是一些你可能每天都在间接使用的例子：

**QR 码**：使用 $ GF(2^8) $ 上的 Reed-Solomon 编码，不可约多项式为 $ x^8 + x^4 + x^3 + x^2 + 1 $（0x11D，注意不是 AES 的 0x11B）。纠错等级从 L（7%）到 H（30%）不等。

**CD/DVD**：CD 使用交叉交织 Reed-Solomon 码（CIRC），两层 RS 编码分别纠正突发错误和随机错误。DVD 使用 RS 乘积码（RS-PC），将数据排成二维阵列，行列各做一次 RS 编码。

**ZFS 文件系统**：ZFS 的 RAID-Z2 和 RAID-Z3 使用 $ GF(2^8) $ 上的 Reed-Solomon 编码来提供双盘和三盘容错。每个数据条带的校验计算都是在 $ GF(2^8) $ 上做矩阵运算。

**SSD 的 ECC**：现代 SSD 控制器使用 BCH 码或 LDPC 码来纠正 NAND 闪存的位错误。BCH 码的解码过程与 Reed-Solomon 密切相关，都依赖有限域算术。

**以太网**：1000BASE-T 千兆以太网的信号编码使用了 GF(2) 上的卷积码和 Trellis 编码调制，物理层的前向纠错与有限域直接相关。

**TLS 1.3**：AES-GCM 和 ChaCha20-Poly1305 是 TLS 1.3 中仅有的两个 AEAD 密码套件。AES-GCM 的 GHASH 运算直接在 $ GF(2^{128}) $ 上进行。

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

# 阅读资料
+ [纠删码EC与伽罗华域-算法理解](http://139.196.53.116/ml/index.php/archives/163/)
+ [Reed-Solomon纠错码(RS码)（里德-所罗门码） - funiyi816 - 博客园](https://www.cnblogs.com/funiyi816/p/15879114.html)

