> 摘录自：[RS码原理及柯西优化](https://grandsail.github.io/posts/reed-solomon-code-caucy-optimize/)
>

# <font style="color:rgb(42, 42, 42);">Intro</font>
<font style="color:rgb(52, 52, 60);">Forward Error Correction（前向纠错、FEC）技术可以用于在不可靠信道中传输信息，当信道中发生丢包时通过部分原始和对应的冗余信息恢复出全部的原始信息。举例来讲，数据块</font><font style="color:rgb(52, 52, 60);"> </font>_<font style="color:rgb(52, 52, 60);">a</font>_<font style="color:rgb(52, 52, 60);"> </font><font style="color:rgb(52, 52, 60);">和</font><font style="color:rgb(52, 52, 60);"> </font>_<font style="color:rgb(52, 52, 60);">b</font>_<font style="color:rgb(52, 52, 60);"> </font><font style="color:rgb(52, 52, 60);">生成了冗余数据块</font><font style="color:rgb(52, 52, 60);"> </font>_<font style="color:rgb(52, 52, 60);">c</font>_<font style="color:rgb(52, 52, 60);"> </font><font style="color:rgb(52, 52, 60);">，在接收端只收到</font><font style="color:rgb(52, 52, 60);"> </font>_<font style="color:rgb(52, 52, 60);">a</font>_<font style="color:rgb(52, 52, 60);"> </font><font style="color:rgb(52, 52, 60);">和</font><font style="color:rgb(52, 52, 60);"> </font>_<font style="color:rgb(52, 52, 60);">c</font>_<font style="color:rgb(52, 52, 60);"> </font><font style="color:rgb(52, 52, 60);">时，能够还原出原始数据块</font><font style="color:rgb(52, 52, 60);"> </font>_<font style="color:rgb(52, 52, 60);">b</font>_<font style="color:rgb(52, 52, 60);">，省去了请求和响应重传的时间。</font>

<font style="color:rgb(52, 52, 60);">Reed–Solomon Error Correction（RS码、里所码）是一种FEC算法，假设原始和冗余信息块数量分别是</font><font style="color:rgb(52, 52, 60);"> </font>_<font style="color:rgb(52, 52, 60);">n</font>_<font style="color:rgb(52, 52, 60);"> </font><font style="color:rgb(52, 52, 60);">和</font><font style="color:rgb(52, 52, 60);"> </font>_<font style="color:rgb(52, 52, 60);">k</font>_<font style="color:rgb(52, 52, 60);">，在接收端任意收到</font><font style="color:rgb(52, 52, 60);"> </font>_<font style="color:rgb(52, 52, 60);">n</font>_<font style="color:rgb(52, 52, 60);"> </font><font style="color:rgb(52, 52, 60);">个原始/冗余信息块时，通过RS解码都能还原出</font><font style="color:rgb(52, 52, 60);"> </font>_<font style="color:rgb(52, 52, 60);">n</font>_<font style="color:rgb(52, 52, 60);"> </font><font style="color:rgb(52, 52, 60);">个原始数据块。回到上文的例子，如果使用</font><font style="color:rgb(52, 52, 60);"> </font>_<font style="color:rgb(52, 52, 60);">a</font>_<font style="color:rgb(52, 52, 60);"> </font><font style="color:rgb(52, 52, 60);">和</font><font style="color:rgb(52, 52, 60);"> </font>_<font style="color:rgb(52, 52, 60);">b</font>_<font style="color:rgb(52, 52, 60);"> </font><font style="color:rgb(52, 52, 60);">这两个原始数据块（n=2），生成</font><font style="color:rgb(52, 52, 60);"> </font>_<font style="color:rgb(52, 52, 60);">c</font>_<font style="color:rgb(52, 52, 60);"> </font><font style="color:rgb(52, 52, 60);">和</font><font style="color:rgb(52, 52, 60);"> </font>_<font style="color:rgb(52, 52, 60);">d</font>_<font style="color:rgb(52, 52, 60);"> </font><font style="color:rgb(52, 52, 60);">两个冗余数据块（k=2），使用XOR操作时无法保证任意2个数据块到达后都能恢复出</font><font style="color:rgb(52, 52, 60);"> </font>_<font style="color:rgb(52, 52, 60);">a</font>_<font style="color:rgb(52, 52, 60);"> </font><font style="color:rgb(52, 52, 60);">和</font><font style="color:rgb(52, 52, 60);"> </font>_<font style="color:rgb(52, 52, 60);">b</font>_<font style="color:rgb(52, 52, 60);">，而RS码可以保证。</font>

> <font style="color:rgb(52, 52, 60);">本文将主要基于 </font>_<font style="color:rgb(52, 52, 60);">An Introduction to Galois Fields and Reed-Solomon Coding</font>_[<sup><font style="color:rgb(0, 86, 178);">1</font></sup>](https://grandsail.github.io/posts/reed-solomon-code-caucy-optimize/#fn:Galois-RS-Intro)<font style="color:rgb(52, 52, 60);"> 和 </font>_<font style="color:rgb(52, 52, 60);">Optimizing Cauchy Reed-Solomon Codes for Fault-Tolerant Network Storage Applications</font>_[<sup><font style="color:rgb(0, 86, 178);">2</font></sup>](https://grandsail.github.io/posts/reed-solomon-code-caucy-optimize/#fn:Caucy-optimize)<font style="color:rgb(52, 52, 60);"> 介绍RS码基本原理及柯西优化的相关内容。</font>
>

# <font style="color:rgb(42, 42, 42);">伽罗瓦域</font>
### <font style="color:rgb(42, 42, 42);">1. Feild（域）</font>
<font style="color:rgb(52, 52, 60);">Field（域）是加法和乘法运算被定义的元素集合，其中的元素和定义的运算满足以下性质：</font>

1. <font style="color:rgb(52, 52, 60);">两个元素进行加法和乘法运算后的结果还在域内（closure闭包性质），定义在域的加法和乘法运算都满足交换律和结合律</font>
2. <font style="color:rgb(52, 52, 60);">域拥有加法元和乘法元: 0+a=a, 1*a=a</font>
3. <font style="color:rgb(52, 52, 60);">定义了加法逆（减法）和乘法逆（除法）</font>
4. <font style="color:rgb(52, 52, 60);">加法元</font><font style="color:rgb(52, 52, 60);">乘法元</font>
5. <font style="color:rgb(52, 52, 60);">ab=0 <=> a=0 or b=0 (整环）</font>

<font style="color:rgb(52, 52, 60);">实际上在后续的介绍中，</font>**<font style="color:rgb(52, 52, 60);">域的加法和乘法运算的闭包性质是最为重要的</font>**<font style="color:rgb(52, 52, 60);">，其他性质能够协助一些原理推导。另外域的元素应理解为“存在”，而域内的加法/乘法运算应理解为</font>**<font style="color:rgb(52, 52, 60);">“定义”</font>**<font style="color:rgb(52, 52, 60);">，比如</font><font style="color:rgb(52, 52, 60);"> </font><font style="color:rgb(52, 52, 60);"> </font><font style="color:rgb(52, 52, 60);">和</font><font style="color:rgb(52, 52, 60);"> </font><font style="color:rgb(52, 52, 60);">都应该被理解为“加法运算”。</font>

### <font style="color:rgb(42, 42, 42);">2. Finite Field（有限域）</font>
<font style="color:rgb(52, 52, 60);">Finite Field（有限域）即</font>**<font style="color:rgb(52, 52, 60);">元素有限的域</font>**<font style="color:rgb(52, 52, 60);">。常见的有限域有定义在模除运算</font>_<font style="color:rgb(52, 52, 60);">p</font>_<font style="color:rgb(52, 52, 60);">（p为质数）上的 </font>$ \mathbb{Z}_p $<font style="color:rgb(52, 52, 60);">，其元素为{0,1,2,…,p-1}，加法运算为</font>$ (a + b) \bmod p $<font style="color:rgb(52, 52, 60);"> ，乘法运算为 </font>$ (a b) \bmod p $<font style="color:rgb(52, 52, 60);">。</font>

<font style="color:rgb(52, 52, 60);">以下是</font>$ \mathbb{Z}_2 $<font style="color:rgb(52, 52, 60);"> 的加法表和乘法表：</font>

<!-- 这是一张图片，ocr 内容为： -->
![](https://images.spumn.eu.cc/blog/37ca6793a23be38a.png)

### <font style="color:rgb(42, 42, 42);">3. Galois Field（伽罗瓦域）</font>
<font style="color:rgb(52, 52, 60);">Galois Field（伽罗瓦域）使用符号</font>$ GF(p^m) $<font style="color:rgb(52, 52, 60);">表示，其元素是定义在</font>$ \mathbb{Z}_p $<font style="color:rgb(52, 52, 60);">上的m-1次多项式。展开后为</font>$ a_{m-1}x^{m-1} + \cdots + a_1x^1 + a_0x^0, $<font style="color:rgb(52, 52, 60);"> ，其中系数</font>$ a_i $<font style="color:rgb(52, 52, 60);"> 取自集合</font>$ \{0, 1, \ldots, p - 1\} $<font style="color:rgb(52, 52, 60);">。</font>**<font style="color:rgb(52, 52, 60);">在编码中我们常取</font>**$ p=2 $**<font style="color:rgb(52, 52, 60);">，此时</font>**$ m-1 $**<font style="color:rgb(52, 52, 60);">次多项式表达一个长度为</font>**$ m $**<font style="color:rgb(52, 52, 60);">位的字，当</font>**$ m=8 $**<font style="color:rgb(52, 52, 60);">时则表示一个字节。</font>**

> <font style="color:rgb(52, 52, 60);">PS：以下带*的小章节可以不做理解</font>
>

#### <font style="color:rgb(42, 42, 42);">a. 加法运算</font>
<font style="color:rgb(52, 52, 60);">伽罗瓦域上的加法为对多项式</font>**<font style="color:rgb(52, 52, 60);">逐位进行异或</font>**<font style="color:rgb(52, 52, 60);">：</font>$ (x^2 + 1) + (x + 1) + (x^2 + x + 1) = 1 $<font style="color:rgb(52, 52, 60);">，根据异或的特性可以知道，加法的逆运算减法实际上也是逐位进行异或。</font>

<font style="color:rgb(52, 52, 60);">以下是</font><font style="color:rgb(52, 52, 60);"> </font><font style="color:rgb(52, 52, 60);"> </font><font style="color:rgb(52, 52, 60);">的加法表：</font>

<!-- 这是一张图片，ocr 内容为： -->
![](https://images.spumn.eu.cc/blog/f390e1d8da00846f.png)

#### <font style="color:rgb(42, 42, 42);">b. 乘法运算</font>
<font style="color:rgb(52, 52, 60);">伽罗瓦域</font>$ GF(2^m) $<font style="color:rgb(52, 52, 60);">的最高次限制为m-1，但乘法的直接结果可能超过这个值。下式中为</font>$ GF(2^3) $<font style="color:rgb(52, 52, 60);"> </font>**<font style="color:rgb(52, 52, 60);">的乘法运算</font>**<font style="color:rgb(52, 52, 60);">，结果的最高位已经超过</font>$ m-1=2 $

$ 5 \cdot 6 = (x^2 + 1)(x^2 + x) = x^4 + x^3 + x^2 + x $

<font style="color:rgb(52, 52, 60);">因此，需要找到</font>**<font style="color:rgb(52, 52, 60);">不可约多项式</font>**$ g(x) $<font style="color:rgb(52, 52, 60);">来使得乘法的结果回到域内，使得在域外，但又回到域内，这个思想有些类似  </font>$ \mathbb{Z}_p $<font style="color:rgb(52, 52, 60);">上乘法的模除 p 操作。</font>

$ x^3 + x + 1 $<font style="color:rgb(52, 52, 60);">是</font>$ GF(2^3) $<font style="color:rgb(52, 52, 60);">上的一个不可约多项式，以下为 </font>$ 5\cdot 6 $<font style="color:rgb(52, 52, 60);"> 的结果，使用 </font>$ g(x) $<font style="color:rgb(52, 52, 60);"> 将其模除回域内的过程，最终计算的结果为</font>$ x+1 $<font style="color:rgb(52, 52, 60);">  即 3：</font>

<!-- 这是一张图片，ocr 内容为： -->
![](https://images.spumn.eu.cc/blog/c9a5dd59ab94f664.png)

<font style="color:rgb(52, 52, 60);">通过逐个计算，可以得到</font>$ GF(2^3) $<font style="color:rgb(52, 52, 60);">的乘法表：</font>

<!-- 这是一张图片，ocr 内容为： -->
![](https://images.spumn.eu.cc/blog/e041acc9fa0b877b.png)

#### <font style="color:rgb(42, 42, 42);">c. 乘法函数*</font>
<font style="color:rgb(52, 52, 60);">以下是乘法的编程实现，分别模拟了竖乘和长除的过程，需要注意的是</font>$ GF(2^m) $<font style="color:rgb(52, 52, 60);">中的加减法都是</font>**<font style="color:rgb(52, 52, 60);">逐位进行异或</font>**<font style="color:rgb(52, 52, 60);">操作</font>

```c
int gf_mult(int m, int poly, int v1, int v2) {
    // poly: low order terms of g(x)
    int prod = 0; 
    int k; 
    int mask;
    /* Multiply phase */
    for (k = 0; k < m; k++)
    {
        // 通过移位和异或操作模拟竖乘的过程
        if (v1 & 1) {
            prod ^= (v2 << k);
        }
        v1 >>= 1;
        if (v1 == 0) break;
    }

    /* Reduce phase */
    // 当m=3，mask=10000，即上一步结果可能出现的最高位
    mask = 1 << (2m-2); 
    for (k = m - 2; k >= 0; k--)
    {
        // 通过移位mask模拟g(x)的长除过程
        if (prod & mask) {
            // 直接去掉当前最高位
            prod &= ~mask;
            // 长除上部写上1，做异或减法
            prod ^= (poly << k);
        }
        mask >>= 1;
    }
}
```

#### <font style="color:rgb(42, 42, 42);">4. 快速乘法*</font>
<font style="color:rgb(52, 52, 60);">伽罗瓦域中的乘法可以借助对数运算实现，即</font>$ a \cdot b = \log_2^{-1}(\log_2(a) + \log_2(b)) $<font style="color:rgb(52, 52, 60);"> 成立，其中右式的“+”是自然数加法而不是多项式加法。下表是</font>$ GF(2^3) $<font style="color:rgb(52, 52, 60);">上的对数表：</font>

<!-- 这是一张图片，ocr 内容为： -->
![](https://images.spumn.eu.cc/blog/c8662bbc1b207acc.png)

<font style="color:rgb(52, 52, 60);">其中需要注意以下问题：</font>

1. <font style="color:rgb(52, 52, 60);">表中的所有单元格内都是遍历整个</font>$ GF(2^3) $<font style="color:rgb(52, 52, 60);">中所有元素尝试出来的，没有更快的生成方法</font>
2. <font style="color:rgb(52, 52, 60);">表中有两个不定义的项，不定义的原因在此不做展开，可以参考</font>[<sup><font style="color:rgb(0, 86, 178);">1</font></sup>](https://grandsail.github.io/posts/reed-solomon-code-caucy-optimize/#fn:Galois-RS-Intro)
3. $ \log_2^{-1}(7) $<font style="color:rgb(52, 52, 60);">未定义：7减7后为0，</font>$ \log_2^{-1}(0) = 1 \Rightarrow 3 \cdot 6 = 1 $
4. <font style="color:rgb(52, 52, 60);"> </font>$ \log_2^{-1}(0) $<font style="color:rgb(52, 52, 60);">未定义：</font>$ 0 \cdot n = 0 \Rightarrow 0, $<font style="color:rgb(52, 52, 60);">不需要使用快速乘法</font>

<font style="color:rgb(52, 52, 60);">快速乘法表的生成较慢（因为需要遍历），但生成后能够大幅度提高乘法的运算速度，可以作为RS码编码的一种优化方案。</font>

## <font style="color:rgb(42, 42, 42);">RS码</font>
### <font style="color:rgb(42, 42, 42);">范德蒙特矩阵</font>
<font style="color:rgb(52, 52, 60);">Vandermonde（范德蒙特）矩阵是一种 m 行 n 列的特殊矩阵，它的第 i 行第 j 列的元素</font>$ V_{i,j} = \alpha_i^{j-1} $<font style="color:rgb(52, 52, 60);"> ，任意 n 行组成的</font>$ n \times n $<font style="color:rgb(52, 52, 60);"> 子矩阵都是满秩方阵（即能够求得逆矩阵）。在</font>$ m>n $<font style="color:rgb(52, 52, 60);"> 时，能够通过行之间的线性变换将范德蒙特矩阵的前 n 行变为单位矩阵，且依然保持任意</font>$ n \times n $<font style="color:rgb(52, 52, 60);">子矩阵满秩。下图是</font>$ GF(2^m) $**<font style="color:rgb(52, 52, 60);">上的范德蒙特矩阵，</font>**$ \alpha_i $**<font style="color:rgb(52, 52, 60);"> 的取值是</font>**$ GF(2^m) $**<font style="color:rgb(52, 52, 60);">上所有的</font>**$ 2^m $**<font style="color:rgb(52, 52, 60);">个元素，次方乘法遵守伽罗瓦域上的乘法定义</font>**<font style="color:rgb(52, 52, 60);">。</font>

<!-- 这是一张图片，ocr 内容为： -->
![](https://images.spumn.eu.cc/blog/181f1b7e0f18eb32.png)

### <font style="color:rgb(42, 42, 42);">RS编码</font>
**<font style="color:rgb(52, 52, 60);">RS编码可以使用范德蒙特矩阵作为生成矩阵</font>**<font style="color:rgb(52, 52, 60);">，下图左侧是</font>$ GF(2^3) $<font style="color:rgb(52, 52, 60);"> 上的范德蒙特矩阵，经过线性变换后得到右侧</font>$ D $<font style="color:rgb(52, 52, 60);"> 分布矩阵。矩阵</font>$ D $<font style="color:rgb(52, 52, 60);"> 有两个主要特征：</font>**<font style="color:rgb(52, 52, 60);">1. 前n行是单位矩阵， 2. 任意</font>**$ n \times n $**<font style="color:rgb(52, 52, 60);">子矩阵满秩</font>**<font style="color:rgb(52, 52, 60);">。</font>

<!-- 这是一张图片，ocr 内容为： -->
![](https://images.spumn.eu.cc/blog/cd033c7d00e8e598.png)

**<font style="color:#DF2A3F;">RS编码时将分布矩阵与原始数据向量相乘，得到一个同时包含原始和编码数据的新向量</font>**<font style="color:rgb(52, 52, 60);">，解码时原始和编码数据块达到数目后（此例中是5个），就可以恢复出所有的原始数据。这种原始数据保持不变的编码也被称为</font>**<font style="color:rgb(52, 52, 60);">“系统性编码”</font>**[<sup><font style="color:rgb(0, 86, 178);">3</font></sup>](https://grandsail.github.io/posts/reed-solomon-code-caucy-optimize/#fn:Systematic_code)<font style="color:rgb(52, 52, 60);">，它的好处是接收端获得的所有原始数据都能够直接使用。</font>

<!-- 这是一张图片，ocr 内容为： -->
![](https://images.spumn.eu.cc/blog/500a33f1be9ce3b7.png)

<font style="color:rgb(52, 52, 60);">总结RS编码过程可以发现以下特征：</font>

1. **<font style="color:rgb(52, 52, 60);">逐组进行编码：</font>**<font style="color:rgb(52, 52, 60);">编码过程中的矩阵相乘需要有一定长度的原始数据向量才能进行。当原始数据处于持续产生的过程中时，有可能同组的第一个和最后一个原始数据生成时间差距较大，</font>**<font style="color:rgb(52, 52, 60);">此时RS编码器只能等待</font>**
2. **<font style="color:rgb(52, 52, 60);">位置关系：</font>**<font style="color:rgb(52, 52, 60);">同组的原始/编码数据块都需要</font>**<font style="color:rgb(52, 52, 60);">标明它在组内的位置</font>**<font style="color:rgb(52, 52, 60);">，这部分的原因会在解码部分详述</font>
3. **<font style="color:rgb(52, 52, 60);">组的极限长度：</font>**<font style="color:rgb(52, 52, 60);">每个RS编码组内的数据块个数也是有限的。</font>**<font style="color:#DF2A3F;">分布矩阵的最大行数 == </font>**$ GF(2^m) $**<font style="color:#DF2A3F;">的元素个数 == </font>**$ 2^m $<font style="color:rgb(52, 52, 60);">，所以每个编码组的原始+编码数据块个数最大也是。在实际的代码实现中，因为每个元素都能表达一个字节的数据而被广泛使用，在这种情况下</font>**<font style="color:rgb(52, 52, 60);">每个编码组的原始+编码数据块限制为256</font>**

### <font style="color:rgb(42, 42, 42);">RS解码</font>
<font style="color:rgb(52, 52, 60);">RS解码的条件是</font>**<font style="color:rgb(52, 52, 60);">“</font>****<font style="color:#DF2A3F;">收到的原始+编码数据块数目>=原始数据块数目</font>****<font style="color:rgb(52, 52, 60);">”</font>**<font style="color:rgb(52, 52, 60);">，</font><font style="color:#DF2A3F;">信道中的丢失过程</font>**<font style="color:#DF2A3F;">等价于在编码时抽去矩阵的一部分行</font>**<font style="color:rgb(52, 52, 60);">。下图是在</font>$ D_2 $<font style="color:rgb(52, 52, 60);">和</font>$ D_5 $<font style="color:rgb(52, 52, 60);"> 丢失的情况下，RS解码的过程，左侧的等价生成矩阵实际上就是编码过程中抽去矩阵的第2和5行。在进行解码时，要对这个</font>$ n \times n $<font style="color:rgb(52, 52, 60);">矩阵求逆，与获得的数据向量相乘后还原出原始数据。</font>

<!-- 这是一张图片，ocr 内容为： -->
![](https://images.spumn.eu.cc/blog/e895710f6268cf5b.png)

<font style="color:rgb(52, 52, 60);">从解码过程获得等价分布矩阵的过程可以看出，</font>**<font style="color:#DF2A3F;">接收端必须确定从原始的矩阵中抽去哪些行</font>**<font style="color:rgb(52, 52, 60);">，所以所有原始/编码数据块都需要标明自己在组内的位置。并且在进行协议设计时，也要避免组间出现重叠，即收到一个原始/编码数据块后，要能够明确它是属于哪个编码组的。</font>

## <font style="color:rgb(42, 42, 42);">柯西优化</font>
<font style="color:#DF2A3F;">柯西优化主要利用了柯西矩阵相较于范德蒙特矩阵求逆更快的特点</font><font style="color:rgb(52, 52, 60);">，获得了</font>**<font style="color:rgb(52, 52, 60);">更高的编解码效率</font>**<font style="color:rgb(52, 52, 60);">。由于需要逐字节分割数据，之前介绍的RS编码在</font>$ GF(2^m) $<font style="color:rgb(52, 52, 60);">中常将</font>$ m $<font style="color:rgb(52, 52, 60);">取8、16和32这种整值。但是在以下的优化中，通过对于数据的向量/矩阵表示，</font>$ m $<font style="color:rgb(52, 52, 60);">的取值可以不再整除8，比如取</font>$ m=3 $<font style="color:rgb(52, 52, 60);">，这样</font>**<font style="color:rgb(52, 52, 60);">编码组的大小能够更加灵活</font>**<font style="color:rgb(52, 52, 60);">。</font>

### <font style="color:rgb(42, 42, 42);">柯西矩阵</font>
<font style="color:rgb(52, 52, 60);">柯西矩阵有跟前文所述范德蒙特矩阵作为分布矩阵时类似的两个主要特征：1. 可以通过线性变换将前</font>$ n $<font style="color:rgb(52, 52, 60);">行变为单位矩阵，2. </font>**<font style="color:rgb(52, 52, 60);">任意 </font>**$ n\times n $**<font style="color:rgb(52, 52, 60);">子矩阵满秩</font>**<font style="color:rgb(52, 52, 60);">。柯西矩阵中的元素如下：</font>

<!-- 这是一张图片，ocr 内容为： -->
![](https://images.spumn.eu.cc/blog/534fa98afbf8060e.png)

<font style="color:rgb(52, 52, 60);">在理解RS码时将范德蒙特矩阵和柯西矩阵等价即可，柯西矩阵的求逆复杂度是</font>$ O(n \log_2(m + n)) $<font style="color:rgb(52, 52, 60);">，其中n是原始数据块个数，m是编码数据块个数。</font>

### <font style="color:rgb(42, 42, 42);">向量/矩阵表达</font>
<font style="color:rgb(52, 52, 60);">在 </font>$ GF(2^m) $<font style="color:rgb(52, 52, 60);">上，可以将元素表达为向量和矩阵形式，其中向量就是它们的多项式表达形式，矩阵表达形式</font>$ M(e) $<font style="color:rgb(52, 52, 60);"> 的第</font>$ i $<font style="color:rgb(52, 52, 60);">列为</font>$ V(e2^{i-1}) $<font style="color:rgb(52, 52, 60);">。</font>

<!-- 这是一张图片，ocr 内容为： -->
![](https://images.spumn.eu.cc/blog/e51ed9f35b054b87.png)

<font style="color:rgb(52, 52, 60);">如此一来， </font>$ GF(2^m) $<font style="color:rgb(52, 52, 60);">上的乘法可以转变为纯粹的XOR操作。下图中将 5 的向量表达设为 </font>$ \{d_0,d_1,d_2\} $<font style="color:rgb(52, 52, 60);">，相乘结果 4 的向量表达为  </font>$ \{e_0,e_1,e_2\} $<font style="color:rgb(52, 52, 60);">，则 </font>$ e_0 = d_0 \oplus d_2,\ e_1 = d_0 \oplus d_1 \oplus d_2,\ e_2 = d_1 \oplus d_2. $<font style="color:rgb(52, 52, 60);"> 。这种相乘实际上等同于伽罗瓦域上的竖乘过程，只是通过特殊的数据表达将所有操作转换为XOR操作。</font>

<!-- 这是一张图片，ocr 内容为： -->
![](https://images.spumn.eu.cc/blog/ce6e632494ec67b2.png)

### <font style="color:rgb(42, 42, 42);">编码结构优化</font>
<font style="color:rgb(52, 52, 60);">在柯西优化的编码结构中，</font><font style="color:#DF2A3F;">编码的基本单位是 bit 而不再是 byte（m=8bit）</font><font style="color:rgb(52, 52, 60);">，重新定义  </font>$ GF(2^w) $<font style="color:rgb(52, 52, 60);"> 作为编码的基础伽罗瓦域，其中w还是每个元素的长度，对应到上一部分的向量/矩阵即为它们的行数。但在实际的编码结构中，分布矩阵</font>$ V $<font style="color:rgb(52, 52, 60);"> 已经使用点阵表达，原始数据向量也被以bit为单位拆分，其他编码和解码原理不变。</font>

<!-- 这是一张图片，ocr 内容为： -->
![](https://images.spumn.eu.cc/blog/55eb7669c3ce946b.png)

<font style="color:rgb(52, 52, 60);">编码结构的变化主要来自于数据表达方式的改变，但是带来的主要区别只有 </font>$ GF(2^m) $<font style="color:rgb(52, 52, 60);"> 中m的取值范围，比如柯西优化中可以取3。</font>

### <font style="color:rgb(42, 42, 42);">进一步优化</font>
<font style="color:rgb(52, 52, 60);">数据表达方式变化后，编解码复杂度直接取决于分布矩阵中的bit数，即bit matrix中黑格的数目。实际上编码使用的柯西矩阵也有区别，分布矩阵更少的bit数能提高编解码效率，具体的优化参见</font>[<sup><font style="color:rgb(0, 86, 178);">2</font></sup>](https://grandsail.github.io/posts/reed-solomon-code-caucy-optimize/#fn:Caucy-optimize)<font style="color:rgb(52, 52, 60);">。</font>

## <font style="color:rgb(42, 42, 42);">Ref</font>
1. [_<font style="color:rgb(0, 86, 178);">An Introduction to Galois Fields and Reed-Solomon Coding</font>_](https://people.computing.clemson.edu/~jmarty/papers/IntroToGaloisFieldsAndRSCoding.pdf)<font style="color:rgb(52, 52, 60);"> </font>[<font style="color:rgb(0, 86, 178);">↩</font>](https://grandsail.github.io/posts/reed-solomon-code-caucy-optimize/#fnref:Galois-RS-Intro)<font style="color:rgb(52, 52, 60);"> </font>[<font style="color:rgb(0, 86, 178);">↩</font><font style="color:rgb(0, 86, 178);">2</font>](https://grandsail.github.io/posts/reed-solomon-code-caucy-optimize/#fnref:Galois-RS-Intro:1)
2. [_<font style="color:rgb(0, 86, 178);">Optimizing Cauchy Reed-Solomon Codes for Fault-Tolerant Network Storage Applications(使用第一页说明中的12页版本)</font>_](https://ieeexplore.ieee.org/document/1659489)<font style="color:rgb(52, 52, 60);"> </font>[<font style="color:rgb(0, 86, 178);">↩</font>](https://grandsail.github.io/posts/reed-solomon-code-caucy-optimize/#fnref:Caucy-optimize)<font style="color:rgb(52, 52, 60);"> </font>[<font style="color:rgb(0, 86, 178);">↩</font><font style="color:rgb(0, 86, 178);">2</font>](https://grandsail.github.io/posts/reed-solomon-code-caucy-optimize/#fnref:Caucy-optimize:1)
3. [_<font style="color:rgb(0, 86, 178);">系统性编码 Systematic code Wikipedia</font>_](https://en.wikipedia.org/wiki/Systematic_code)<font style="color:rgb(52, 52, 60);"> </font>[<font style="color:rgb(0, 86, 178);">↩</font>](https://grandsail.github.io/posts/reed-solomon-code-caucy-optimize/#fnref:Systematic_code)

  


