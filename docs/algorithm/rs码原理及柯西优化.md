---
title: "Intro"
description: "Forward Error Correction（前向纠错、FEC）技术可以用于在不可靠信道中传输信息，当信道中发生丢包时通过部分原始和对应的冗余信息恢复出全部的原始信息。举例来讲，数据块 _a_ 和 _b_ 生成了冗余数据块 _c_ ，在"
---

> 摘录自：[RS码原理及柯西优化](https://grandsail.github.io/posts/reed-solomon-code-caucy-optimize/)
>

# Intro
Forward Error Correction（前向纠错、FEC）技术可以用于在不可靠信道中传输信息，当信道中发生丢包时通过部分原始和对应的冗余信息恢复出全部的原始信息。举例来讲，数据块 _a_ 和 _b_ 生成了冗余数据块 _c_ ，在接收端只收到 _a_ 和 _c_ 时，能够还原出原始数据块 _b_，省去了请求和响应重传的时间。

Reed–Solomon Error Correction（RS码、里所码）是一种FEC算法，假设原始和冗余信息块数量分别是 _n_ 和 _k_，在接收端任意收到 _n_ 个原始/冗余信息块时，通过RS解码都能还原出 _n_ 个原始数据块。回到上文的例子，如果使用 _a_ 和 _b_ 这两个原始数据块（n=2），生成 _c_ 和 _d_ 两个冗余数据块（k=2），使用XOR操作时无法保证任意2个数据块到达后都能恢复出 _a_ 和 _b_，而RS码可以保证。

本文将主要基于 _An Introduction to Galois Fields and Reed-Solomon Coding_[<sup>1</sup>](https://grandsail.github.io/posts/reed-solomon-code-caucy-optimize/#fn:Galois-RS-Intro) 和 _Optimizing Cauchy Reed-Solomon Codes for Fault-Tolerant Network Storage Applications_[<sup>2</sup>](https://grandsail.github.io/posts/reed-solomon-code-caucy-optimize/#fn:Caucy-optimize) 介绍RS码基本原理及柯西优化的相关内容。

# 伽罗瓦域
### 1. Feild（域）
Field（域）是加法和乘法运算被定义的元素集合，其中的元素和定义的运算满足以下性质：

1. 两个元素进行加法和乘法运算后的结果还在域内（closure闭包性质），定义在域的加法和乘法运算都满足交换律和结合律
2. 域拥有加法元和乘法元: 0+a=a, 1*a=a
3. 定义了加法逆（减法）和乘法逆（除法）
4. 加法元乘法元
5. ab=0 <=> a=0 or b=0 (整环）

实际上在后续的介绍中，**域的加法和乘法运算的闭包性质是最为重要的**，其他性质能够协助一些原理推导。另外域的元素应理解为“存在”，而域内的加法/乘法运算应理解为**“定义”**，比如  和 都应该被理解为“加法运算”。

### 2. Finite Field（有限域）
Finite Field（有限域）即**元素有限的域**。常见的有限域有定义在模除运算_p_（p为质数）上的 ![image](https://cdn.nlark.com/yuque/__latex/ad50af61c0e16d5009ed1174abeaf83b.svg)

，其元素为{0,1,2,…,p-1}，加法运算为![image](https://cdn.nlark.com/yuque/__latex/0caad60ab76bbff047068a8d41e0d9ff.svg) ，乘法运算为 ![image](https://cdn.nlark.com/yuque/__latex/f73319229b225dd1a1f43478f6277d7a.svg)。

以下是![image](https://cdn.nlark.com/yuque/__latex/3e6873d569f47f0184bd27c64f3bdd1c.svg) 的加法表和乘法表：

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1777814745335-d6e380fe-59da-4c44-8aee-e50709728b4b.png)

### 3. Galois Field（伽罗瓦域）
Galois Field（伽罗瓦域）使用符号![image](https://cdn.nlark.com/yuque/__latex/ac3086fe2eea867f1264b31de8ba53c3.svg)表示，其元素是定义在![image](https://cdn.nlark.com/yuque/__latex/ad50af61c0e16d5009ed1174abeaf83b.svg)上的m-1次多项式。展开后为![image](https://cdn.nlark.com/yuque/__latex/944b249bb6e7aed82ff00a895fd1918d.svg) ，其中系数![image](https://cdn.nlark.com/yuque/__latex/5d496a3b872073b90e3b920cacfc3dc6.svg) 取自集合![image](https://cdn.nlark.com/yuque/__latex/54110757c48a7b2b89892d60218029e3.svg)。**在编码中我们常取**![image](https://cdn.nlark.com/yuque/__latex/645a0f501112e81811324600f76f1bce.svg)**，此时**![image](https://cdn.nlark.com/yuque/__latex/e695869ab86fb7206de0b9dfed58fb7b.svg)**次多项式表达一个长度为**![image](https://cdn.nlark.com/yuque/__latex/4760e2f007e23d820825ba241c47ce3b.svg)**位的字，当**![image](https://cdn.nlark.com/yuque/__latex/868a810156b0acf92bef049b5e9383ce.svg)**时则表示一个字节。**

> PS：以下带*的小章节可以不做理解
>

#### a. 加法运算
伽罗瓦域上的加法为对多项式**逐位进行异或**：![image](https://cdn.nlark.com/yuque/__latex/5723e87c9e5610593cc1cb225f0de5a0.svg)，根据异或的特性可以知道，加法的逆运算减法实际上也是逐位进行异或。

以下是  的加法表：

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1777814767207-275a60d4-7d20-44f0-9ab3-8a820cebe084.png)

#### b. 乘法运算
伽罗瓦域![image](https://cdn.nlark.com/yuque/__latex/b1c9b5aa0a33ba34a584eea2548e6c71.svg)的最高次限制为m-1，但乘法的直接结果可能超过这个值。下式中为![image](https://cdn.nlark.com/yuque/__latex/c34fb1f5d491d0985aa976bbd2761f67.svg) **的乘法运算**，结果的最高位已经超过![image](https://cdn.nlark.com/yuque/__latex/36c7c43af0e317b9504f3b1efb14f1d1.svg)

![image](https://cdn.nlark.com/yuque/__latex/d86a35266b5b2e74de1a7a985a7484c1.svg)

因此，需要找到**不可约多项式**![image](https://cdn.nlark.com/yuque/__latex/55ba3b4ecaffd878543e762f3ce0d49b.svg)来使得乘法的结果回到域内，使得在域外，但又回到域内，这个思想有些类似  ![image](https://cdn.nlark.com/yuque/__latex/ad50af61c0e16d5009ed1174abeaf83b.svg)上乘法的模除 p 操作。

![image](https://cdn.nlark.com/yuque/__latex/007d34672051952e511acb0dc2de0e40.svg)是![image](https://cdn.nlark.com/yuque/__latex/c34fb1f5d491d0985aa976bbd2761f67.svg)上的一个不可约多项式，以下为 ![image](https://cdn.nlark.com/yuque/__latex/ca5acd95e456dd8e6b06b53ed2792b54.svg) 的结果，使用 g(x) 将其模除回域内的过程，最终计算的结果为![image](https://cdn.nlark.com/yuque/__latex/da2688980a39655380530bdef92db8e5.svg)  即 3：

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1777814929798-154afa5e-10b3-4656-895f-f0b26c559174.png)

通过逐个计算，可以得到![image](https://cdn.nlark.com/yuque/__latex/c34fb1f5d491d0985aa976bbd2761f67.svg)的乘法表：

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1777814939227-42c73c2e-d9d9-46b3-b3ae-5bd7378b0abd.png)

#### c. 乘法函数*
以下是乘法的编程实现，分别模拟了竖乘和长除的过程，需要注意的是![image](https://cdn.nlark.com/yuque/__latex/b1c9b5aa0a33ba34a584eea2548e6c71.svg)中的加减法都是逐位进行异或操作

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

#### 4. 快速乘法*
伽罗瓦域中的乘法可以借助对数运算实现，即![image](https://cdn.nlark.com/yuque/__latex/64fcbc58b9b4f46e1496450808eeaf48.svg) 成立，其中右式的“+”是自然数加法而不是多项式加法。下表是![image](https://cdn.nlark.com/yuque/__latex/c34fb1f5d491d0985aa976bbd2761f67.svg)上的对数表：

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1777814959157-c8831bc7-7421-4a8e-a033-ac89f888ea06.png)

其中需要注意以下问题：

1. 表中的所有单元格内都是遍历整个![image](https://cdn.nlark.com/yuque/__latex/c34fb1f5d491d0985aa976bbd2761f67.svg)中所有元素尝试出来的，没有更快的生成方法
2. 表中有两个不定义的项，不定义的原因在此不做展开，可以参考[<sup>1</sup>](https://grandsail.github.io/posts/reed-solomon-code-caucy-optimize/#fn:Galois-RS-Intro)
3. ![image](https://cdn.nlark.com/yuque/__latex/0a6f2e22c56ce370dd707f9210c96f05.svg)未定义：7减7后为0，![image](https://cdn.nlark.com/yuque/__latex/0eac25aa7ae080b60d8c727b6f048ff1.svg)
4.  ![image](https://cdn.nlark.com/yuque/__latex/fe551f0480c45f17abbcc3e65ff00187.svg)未定义：![image](https://cdn.nlark.com/yuque/__latex/d3edd53b82dff7995216a961b9780720.svg)不需要使用快速乘法

快速乘法表的生成较慢（因为需要遍历），但生成后能够大幅度提高乘法的运算速度，可以作为RS码编码的一种优化方案。

## RS码
### 范德蒙特矩阵
Vandermonde（范德蒙特）矩阵是一种 m 行 n 列的特殊矩阵，它的第 i 行第 j 列的元素![image](https://cdn.nlark.com/yuque/__latex/bf80bf3329928f1c1a046a31a3952c9e.svg) ，任意 n 行组成的![image](https://cdn.nlark.com/yuque/__latex/aeb2d960dcdf712cb4dfdfdea8c21156.svg) 子矩阵都是满秩方阵（即能够求得逆矩阵）。在![image](https://cdn.nlark.com/yuque/__latex/785316b900f386b1187384e8f4e55d05.svg) 时，能够通过行之间的线性变换将范德蒙特矩阵的前 n 行变为单位矩阵，且依然保持任意![image](https://cdn.nlark.com/yuque/__latex/aeb2d960dcdf712cb4dfdfdea8c21156.svg)子矩阵满秩。下图是![image](https://cdn.nlark.com/yuque/__latex/b1c9b5aa0a33ba34a584eea2548e6c71.svg)**上的范德蒙特矩阵，**![image](https://cdn.nlark.com/yuque/__latex/d380efc20440f7892e981f77b69951dc.svg)** 的取值是**![image](https://cdn.nlark.com/yuque/__latex/b1c9b5aa0a33ba34a584eea2548e6c71.svg)**上所有的**![image](https://cdn.nlark.com/yuque/__latex/e9f1b8bc7dc8072f7149bc4f29fe54b7.svg)**个元素，次方乘法遵守伽罗瓦域上的乘法定义**。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1777814973414-e83d9f88-dfd8-4273-bee7-cccf81101408.png)

### RS编码
RS编码可以使用范德蒙特矩阵作为生成矩阵，下图左侧是![image](https://cdn.nlark.com/yuque/__latex/c34fb1f5d491d0985aa976bbd2761f67.svg) 上的范德蒙特矩阵，经过线性变换后得到右侧![image](https://cdn.nlark.com/yuque/__latex/558270b7f0a90c3c286b860273d106a0.svg) 分布矩阵。矩阵![image](https://cdn.nlark.com/yuque/__latex/558270b7f0a90c3c286b860273d106a0.svg) 有两个主要特征：**1. 前n行是单位矩阵， 2. 任意**![image](https://cdn.nlark.com/yuque/__latex/aeb2d960dcdf712cb4dfdfdea8c21156.svg)**子矩阵满秩**。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1777814997021-2ce5ac0d-9ac7-48c6-bf7f-e63861cbd6ad.png)

RS编码时将分布矩阵与原始数据向量相乘，得到一个同时包含原始和编码数据的新向量，解码时原始和编码数据块达到数目后（此例中是5个），就可以恢复出所有的原始数据。这种原始数据保持不变的编码也被称为**“系统性编码”**[<sup>3</sup>](https://grandsail.github.io/posts/reed-solomon-code-caucy-optimize/#fn:Systematic_code)，它的好处是接收端获得的所有原始数据都能够直接使用。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1777815009163-1842f24b-6f92-44a0-a7e4-6856e396f36d.png)

总结RS编码过程可以发现以下特征：

1. **逐组进行编码：**编码过程中的矩阵相乘需要有一定长度的原始数据向量才能进行。当原始数据处于持续产生的过程中时，有可能同组的第一个和最后一个原始数据生成时间差距较大，**此时RS编码器只能等待**
2. **位置关系：**同组的原始/编码数据块都需要**标明它在组内的位置**，这部分的原因会在解码部分详述
3. **组的极限长度：**每个RS编码组内的数据块个数也是有限的。分布矩阵的最大行数 == ![image](https://cdn.nlark.com/yuque/__latex/b1c9b5aa0a33ba34a584eea2548e6c71.svg)的元素个数 == ![image](https://cdn.nlark.com/yuque/__latex/e9f1b8bc7dc8072f7149bc4f29fe54b7.svg)，所以每个编码组的原始+编码数据块个数最大也是。在实际的代码实现中，因为每个元素都能表达一个字节的数据而被广泛使用，在这种情况下**每个编码组的原始+编码数据块限制为256**

### RS解码
RS解码的条件是**“收到的原始+编码数据块数目>=原始数据块数目”**，信道中的丢失过程**等价于在编码时抽去矩阵的一部分行**。下图是在![image](https://cdn.nlark.com/yuque/__latex/544e2250bdedb4af726bce4fd10e667c.svg)和![image](https://cdn.nlark.com/yuque/__latex/7feef8244919b921af413a506dceeebe.svg) 丢失的情况下，RS解码的过程，左侧的等价生成矩阵实际上就是编码过程中抽去矩阵的第2和5行。在进行解码时，要对这个![image](https://cdn.nlark.com/yuque/__latex/aeb2d960dcdf712cb4dfdfdea8c21156.svg)矩阵求逆，与获得的数据向量相乘后还原出原始数据。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1777815031710-7c1cad87-8653-49a6-bb58-3b08b50dcc2a.png)

从解码过程获得等价分布矩阵的过程可以看出，**接收端必须确定从原始的矩阵****中抽去哪些行**，所以所有原始/编码数据块都需要标明自己在组内的位置。并且在进行协议设计时，也要避免组间出现重叠，即收到一个原始/编码数据块后，要能够明确它是属于哪个编码组的。

## 柯西优化
柯西优化主要利用了柯西矩阵相较于范德蒙特矩阵求逆更快的特点，获得了**更高的编解码效率**。由于需要逐字节分割数据，之前介绍的RS编码在![image](https://cdn.nlark.com/yuque/__latex/b1c9b5aa0a33ba34a584eea2548e6c71.svg)中常将m取8、16和32这种整值。但是在以下的优化中，通过对于数据的向量/矩阵表示，m的取值可以不再整除8，比如取m=3，这样**编码组的大小能够更加灵活**。

### 柯西矩阵
柯西矩阵有跟前文所述范德蒙特矩阵作为分布矩阵时类似的两个主要特征：1. 可以通过线性变换将前n行变为单位矩阵，2. 任意 ![image](https://cdn.nlark.com/yuque/__latex/29e2ed2b656b1c0aa45c95c88aa79075.svg)子矩阵满秩。柯西矩阵中的元素如下：

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1777815058320-25c0dbe5-f2da-4c4c-b866-b172481890e3.png)

在理解RS码时将范德蒙特矩阵和柯西矩阵等价即可，柯西矩阵的求逆复杂度是![image](https://cdn.nlark.com/yuque/__latex/9410f9402eda0a40b1dea4f907a14e53.svg)，其中n是原始数据块个数，m是编码数据块个数。

### 向量/矩阵表达
在 ![image](https://cdn.nlark.com/yuque/__latex/b1c9b5aa0a33ba34a584eea2548e6c71.svg)上，可以将元素表达为向量和矩阵形式，其中向量就是它们的多项式表达形式，矩阵表达形式![image](https://cdn.nlark.com/yuque/__latex/815f8a2eda370302f445c37f69757e55.svg) 的第i列为![image](https://cdn.nlark.com/yuque/__latex/d6f30151a0898017cab60a6c38fdbd15.svg)。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1777815070001-4ce17d2b-e734-43f7-a410-73ba73eb43dc.png)

如此一来， ![image](https://cdn.nlark.com/yuque/__latex/b1c9b5aa0a33ba34a584eea2548e6c71.svg)上的乘法可以转变为纯粹的XOR操作。下图中将 5 的向量表达设为 ![image](https://cdn.nlark.com/yuque/__latex/874a3a9815fe51398fb735a9debd1e09.svg)，相乘结果 4 的向量表达为  ![image](https://cdn.nlark.com/yuque/__latex/aa042494dc3a29be7327bae911f96265.svg)，则 ![image](https://cdn.nlark.com/yuque/__latex/6098ecbb8dc13a17bed1103132b04356.svg) 。这种相乘实际上等同于伽罗瓦域上的竖乘过程，只是通过特殊的数据表达将所有操作转换为XOR操作。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1777815077829-a239dbe5-b203-4066-986e-ff42b6d94a2a.png)

### 编码结构优化
在柯西优化的编码结构中，编码的基本单位是 bit 而不再是 byte（m=8bit），重新定义  ![image](https://cdn.nlark.com/yuque/__latex/f566974a59e75239a93b336b946f9b46.svg) 作为编码的基础伽罗瓦域，其中w还是每个元素的长度，对应到上一部分的向量/矩阵即为它们的行数。但在实际的编码结构中，分布矩阵![image](https://cdn.nlark.com/yuque/__latex/9f493997c33913987175caf4a4849955.svg) 已经使用点阵表达，原始数据向量也被以bit为单位拆分，其他编码和解码原理不变。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1777815099851-61e67922-7541-4318-a716-45716821c19c.png)

编码结构的变化主要来自于数据表达方式的改变，但是带来的主要区别只有 ![image](https://cdn.nlark.com/yuque/__latex/b1c9b5aa0a33ba34a584eea2548e6c71.svg) 中m的取值范围，比如柯西优化中可以取3。

### 进一步优化
数据表达方式变化后，编解码复杂度直接取决于分布矩阵中的bit数，即bit matrix中黑格的数目。实际上编码使用的柯西矩阵也有区别，分布矩阵更少的bit数能提高编解码效率，具体的优化参见[<sup>2</sup>](https://grandsail.github.io/posts/reed-solomon-code-caucy-optimize/#fn:Caucy-optimize)。

## Ref
1. [_An Introduction to Galois Fields and Reed-Solomon Coding_](https://people.computing.clemson.edu/~jmarty/papers/IntroToGaloisFieldsAndRSCoding.pdf) [↩](https://grandsail.github.io/posts/reed-solomon-code-caucy-optimize/#fnref:Galois-RS-Intro) [↩2](https://grandsail.github.io/posts/reed-solomon-code-caucy-optimize/#fnref:Galois-RS-Intro:1)
2. [_Optimizing Cauchy Reed-Solomon Codes for Fault-Tolerant Network Storage Applications(使用第一页说明中的12页版本)_](https://ieeexplore.ieee.org/document/1659489) [↩](https://grandsail.github.io/posts/reed-solomon-code-caucy-optimize/#fnref:Caucy-optimize) [↩2](https://grandsail.github.io/posts/reed-solomon-code-caucy-optimize/#fnref:Caucy-optimize:1)
3. [_系统性编码 Systematic code Wikipedia_](https://en.wikipedia.org/wiki/Systematic_code) [↩](https://grandsail.github.io/posts/reed-solomon-code-caucy-optimize/#fnref:Systematic_code)

  


