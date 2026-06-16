# 手搓 Transformer（一）：整体结构、数据流与实现思路

> [手搓transformer（一）：整体结构、数据流与实现思路](https://zhuanlan.zhihu.com/p/2023866936040203643)

## 为什么要手搓 transformer？

关于这个问题，主要答案有两方面——一方面最近几年保研面试中有相关考察，包括原理和代码细节，所以要进行积极准备；另一方面，“看懂”和“会写”是两回事。之前也看过很多视频和博客讲解Transformer架构，但是从未自己亲手在没有大模型辅助的情况下，写出整个代码，导致一知半解。因此最近准备记录一下自己的手搓过程，全程使用[Pytorch](https://zhida.zhihu.com/search?content_id=272569059&content_type=Article&match_order=1&q=Pytorch&zhida_source=entity)，加深理解。

“看懂”和“会写”是两回事。Transformer 的结构看起来并不复杂，[Embedding](https://zhida.zhihu.com/search?content_id=272569059&content_type=Article&match_order=1&q=Embedding&zhida_source=entity), MultiHeadAttention, [LayerNorm](https://zhida.zhihu.com/search?content_id=272569059&content_type=Article&match_order=1&q=LayerNorm&zhida_source=entity), PositionwiseFFN等。但当开始写代码时，便会遇到很多细节问题，如mask的shape是什么？为什么要除以 $\sqrt{d_k}$ ？MultiHead是怎么拆分和拼接的？为什么tok_emb+pos_emb可以直接相加？哪些地方需要dropout?等等。如果仅仅看原理讲解，是很难对这些问题有深入理解的。

## Transformer 到底长什么样？

在深入具体实现之前，我们先回答一个最核心的问题：Transformer 的整体结构是什么？

### 整体结构：Encoder + Decoder

Transformer由Encoder和Decoder两部分组成，Encoder负责理解输入，Decoder负责生成输出。

![image](https://picx.zhimg.com/v2-53513b448f992eee0559c018a5ee651f_r.jpg "Attention is all you need Fig.1")

### Encoder的作用

Encoder 的输入是多个批次(batch_size)的多个序列(seq)，每一个序列（比如一句话）：

```
"I love deep learning"
```

经过 embedding 之后，每个 token 会变成一个向量：

$$
(B, L) \to (B, L, D)
$$

为方便后续表述，这里做一个约定：

- B 表示 batch_size
- L 表示 seq_len
- D 表示d_model

然后进入多层 Encoder，每一层都会先使用**[Self-Attention](https://zhida.zhihu.com/search?content_id=272569059&content_type=Article&match_order=1&q=Self-Attention&zhida_source=entity)**建模序列内部关系，再使用 **[Feed Forward Network](https://zhida.zhihu.com/search?content_id=272569059&content_type=Article&match_order=1&q=Feed+Forward+Network&zhida_source=entity)（FFN）** 做非线性变换。最终输出:

$$
(B, L, D)
$$

> Encoder 把原始输入，转换成“包含上下文信息的表示”

### Decoder的作用

Decoder 的作用是：**逐步生成输出序列**。它的输入包括两部分：

1. 已生成的目标序列 $tgt_x \to (B, L_{tgt})$
2. Encoder 的输出 $enc_{out} \to (B, L_{src}, D)$

Decoder 每一层包含三个关键部分：

1. [Masked Self-Attention](https://zhida.zhihu.com/search?content_id=272569059&content_type=Article&match_order=1&q=Masked+Self-Attention&zhida_source=entity)，防止看到未来信息，保证自回归
2. [Cross-Attention](https://zhida.zhihu.com/search?content_id=272569059&content_type=Article&match_order=1&q=Cross-Attention&zhida_source=entity)，Query 来自 Decoder，Key和Value 来自 Encoder
3. Feed Forward Network

> Decoder 一边看“已经生成的内容”，一边参考 Encoder 的信息，逐步生成下一个 token

### Transformer 的核心思想

首先，Transformer **用 Attention 建模序列关系**，相较于RNN和CNN，不依赖顺序计算，可以并行计算，可以直接建模任意两个位置之间的关系。其次，Transformer **用 Multi-Head 机制增强表达能力**，多头把词向量空间划分为不同的子空间，从不同子空间去关注信息。最后，Transformer **用 FFN 提供非线性变换**，Attention 本质是加权平均，也就是线性操作，所以需要 FFN 增加模型表达能力**。整体结构是模块化并且是可堆叠的。

## Transformer 的数据流

在这篇文章中我们只给出总体流程，具体每个单元内部的shape在后续文章会逐步拆解。

![image](https://picx.zhimg.com/v2-9af012434ac52b097ef725c8d1e1ec11_r.jpg "Pipeline of Transformer")

## Transformer 为什么这样设计？

这一节我们从设计动机出发，理解 Transformer 的核心组成。

### 为什么需要 Embedding？

神经网络无法直接处理离散的token，如token_id：

```
"I" → 1 
"love" → 25 
"AI" → 102
```

这些数字本身没有任何语义信息。因此需要Embedding（词嵌入）：

$$
(B, L) \to (B, L, D)
$$

把每个 token 映射到一个连续向量空间中，使模型能够学习语义关系。但这还远远不够，Transformer 与 RNN 不同，它**没有顺序结构**，无法感知认识到"I love AI" 与 "AI love I"不同。因此还需要位置编码（Positional Encoding），给每个 token 注入“位置信息”，让模型知道顺序。

### 为什么需要 Attention？

在RNN中，信息是逐步传递的：

$$
x_1 \to x_2 \to x_3 \to \cdots \to x_n
$$

存在着天然劣势：（1）长距离依赖难以建模 （2）无法并行计算 （3) 梯度容易消失

Transformer 用 Attention 解决这个问题,让每个位置可以“直接看到”所有位置.需要注意的是Attention只是线性运算，需要后续加入FFN来增强模型的表达能力。

**为什么需要 Multi-Head？**

如果只有一个Attention，模型只能学到“一种关系”，如语法关系，语义关系，位置关系，指代关系等。但现实中需要**多种关系同时建模，多头便可以实现该目标**。每个 head 可以关注不同模式，head1学习语法，head2关注语义，head3关注位置等等。

> Multi-Head = 在不同子空间中做 Attention

### 为什么需要 FFN？

Attention本质上是加权平均，这使得模型表达能力有限，无法进行复杂变换。利用FFN提供非线性变换，增强模型表达能力.FFN是Position-wise,也就是逐位置处理，每个token独立处理。

### 为什么需要残差连接 + LayerNorm？

Transformer 是一个**很深的网络，多层堆叠**。如果直接堆叠，容易梯度消失，导致训练困难。所以要残差连接，保留原始信息.

$$
x + f(x)
$$

此外，为了保证训练稳定，防止梯度爆炸，还需要使用LayerNorm.

## Transformer 项目结构

为了更清晰地理解 Transformer 的实现过程，我准备将整个模型拆分为若干个独立模块，分别实现、分别讲解。

### 模块划分

1. Embedding
2. Attention
3. Normlization
4. Forward Feed
5. Encoder
6. Decoder
7. Transformer
