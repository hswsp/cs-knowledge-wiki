# 手搓 Transformer（二）：Embedding 层

## 前言

现在我们开始手搓transformer的Embedding层，默认输入是若干句子，形状是 $(B,L)$ .B 表示句子个数(batch_size),L 表示句子长度，也就是token的个数(seq_len)。Embedding层包含两层，TokenEmbedding是把每一个token id嵌入为一个d_model(超参数)的词向量，[PositionEmbedding](https://zhida.zhihu.com/search?content_id=272573706&content_type=Article&match_order=1&q=PositionEmbedding&zhida_source=entity)是加入每一个token的位置信息，其只与位置有关，与batch_size无关。输出是每一个token嵌入后的词向量的矩阵，形状是 $(B,L,D)$ .

## Embedding层数据流

这部分对应论文`Attention is All You Need`模型架构图的一小部分。

![image](https://pic4.zhimg.com/v2-65d29ba5ab1cfa04a041a028fa94b543_1440w.jpg)

Embedding层

Embedding层的详细pipeline如图所示，

![image](https://pica.zhimg.com/v2-bab5369e64a68cf2d43ac00af59b2c78_r.jpg)

pipeline of Embedding

我们先分别实现TokenEmbedding和PositionEmbedding,然后将二者相加得到最终的[TransformerEmbedding](https://zhida.zhihu.com/search?content_id=272573706&content_type=Article&match_order=1&q=TransformerEmbedding&zhida_source=entity)。

## TokenEmbedding

先展示这部分代码:

```python
# 1. TokenEmbedding
class TokenEmbedding(nn.Embedding):
    """
    Input: (B, L)
    Output: (B, L, D)
    """
    def __init__(self, vocab_size: int, d_model: int, pad_idx: int = 0):
        super().__init__(vocab_size, d_model, padding_idx=pad_idx)
```

这是transformer代码中唯一直接继承不需要自己实现的类。

### Embedding本质

`nn.Embedding` 本质就是一个查表：

```
Embedding Matrix: (vocab_size, d_model)
```

输入：[1, 25, 102]

输出：[embedding[1],embedding[25],embedding[102]]

### padding_idx作用

```
padding_idx=pad_idx
```

这表示padding的位置embedding永远为0，不参与训练。

## PositionEmbedding

先展示代码：

```
# 2. PositionEmbedding
class PositionEmbedding(nn.Module):
    """
    Input: (B, L)
    Output: (1, L, D)
    """
    def __init__(self, d_model: int, max_len: int):
        super().__init__()
        pe = torch.zeros(max_len, d_model, dtype=torch.float) # (L, D)
        position = torch.arange(0, max_len).unsqueeze(1) # (L, 1)
        div_term = torch.exp(
            torch.arange(0, d_model, 2, dtype=torch.float) * (- math.log(1e4)) / d_model
        )#(D/2,)

        pe[:, 0::2] = torch.sin(position * div_term) # (L, D/2)
        pe[:, 1::2] = torch.cos(position * div_term) # (L, D/2)

        self.register_buffer("pe", pe)
```

### 位置编码公式

$$
PE(pos, 2i) = sin(pos / 10000^{(2i/d_{model})})  \\ PE(pos, 2i+1) = cos(pos / 10000^{(2i/d_{model})})
$$

其中 $i \in N$ , $2i$ 表示偶数, $2i+1$ 表示奇数。注意到 $\sin ( )$ 和 $\cos ()$ 内部表达式一致，此外对10000进行指数操作，容易导致溢出。为了方便编码和防止溢出，我们定义

$$
div_{term} = \frac{1}{10000^{\frac{2i}{d_{model}}}} \\ =exp(-log(10000^{\frac{2i}{d_{model}}})) \\ =exp(\frac{2i \times (-log(10000))}{d_{model}}) \\
$$

故有

$$
PE(pos,2i) = sin(pos \times div_{term}) \\ PE(pos,2i+1) = cos(pos \times div_{term})
$$

这样编码能够简化代码，并且有效减少了计算溢出的可能。此外指数操作对GPU特别友好，可高度并行。在位置编码的实现中，`position` 的形状为 `(L, 1)`，而 `div_term` 的形状为 `(D/2,)`。两者相乘时会触发**广播(broadcast)机制**，自动扩展为 `(L, D/2)`，从而一次性计算所有位置与所有频率的组合。这种写法**避免了显式循环**。

为了直观感受编码结果，我绘制了位置编码可视化曲线。

![image](https://pic2.zhimg.com/v2-5837c9758ca5c424e02320799ece2369_r.jpg)

位置编码可视化曲线

在位置编码的可视化曲线中，`dim` 表示 embedding 向量的某一个维度。每一个维度对应一个不同频率的正弦或余弦函数。**低维度**变化缓慢，表示全局位置趋势；**高维度**变化快速，表示局部位置变化。多个维度共同作用，使得模型能够通过这些周期性信号组合，推断出位置之间的相对关系。

> 注意：dim表示的是d_model,不是第几个token

- 每个维度对应一个不同频率的波，同一维度不同位置对应同一频率波的不同的值
- 低维：变化慢（全局信息）
- 高维：变化快（局部信息）

![image](https://pica.zhimg.com/v2-c9e558190698d1f61918d7da03365cda_r.jpg)

位置编码热力图

从热力图中可以看出，位置编码矩阵在不同维度上呈现出不同频率的周期性变化。

这样的设计有两个优点：

**1.可以表示相对位置，模型可以通过组合不同维度，推断出两个位置之间的距离**

这里利用到了 $\sin$ 和 $\cos$ 的**相位差性质.**为了便于表述，我们先忽略多维，只看一个维度。也就是只考虑不同位置之间的编码情况。

$$
PE(pos) = sin(ω · pos)
$$

对于任意两个位置有，

$$
pos1 → sin(ω · pos1) \\ pos2 → sin(ω · pos2)
$$

利用三角函数公式，

$$
sin(a - b) = sin(a)cos(b) - cos(a)sin(b)
$$

将 $a = ω · pos2, b = ω · pos1$ 代入上述公式有，

$$
sin(ω·pos2 - ω·pos1) = sin(ω·pos2)cos(ω·pos1) - cos(ω·pos2)sin(ω·pos1)
$$

这表明位置差 $(pos2 - pos1)$ 可以由 $sin(ω·pos), cos(ω·pos)$ 的线性组合进行表示。

> 给定两个位置的编码向量，可以通过线性变换得到它们的相对位置关系

多维的意义在于用多个不同频率的“波”来编码位置。这与Fourier basis和多尺度变换是极其类似的。

**2.不需要训练**，

```
self.register_buffer("pe", pe)
```

这一句代码表示**不参与梯度更新，固定编码。**

### forward 过程

先展示代码：

```
def forward(self, x):
    seq_len = x.size(1)
    return self.pe[:seq_len, :].unsqueeze(0)
```

前面位置编码都是统一编码到`max_len`，现在只需要取与序列相同的长度`L`即可，输出形状为 $(1, L, D)$ 。注意这里的结果必须要`.unsqueeze(0)`，才能保证输出的结果可以与前面的`token_embedding`利用广播机制相加。

> .unsqueeze(x)表示在torch.Tensor的第几个维度的形状置为1

## TransformerEmbedding

先展示代码：

```
class TransformerEmbedding(nn.Module):
    """
    token embedding * sqrt(d_model) + Position embedding
    input : (B, L)
    output: (B, L, D)
    """
    def __init__(self, vocab_size: int, d_model: int, max_len: int, dropout: float = 0.1):
        super().__init__()
        self.d_model = d_model
        self.tok_emb = TokenEmbedding(vocab_size, d_model)
        self.pos_emb = PositionEmbedding(d_model, max_len)
        self.dropout = nn.Dropout(dropout)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        tok_emb = self.tok_emb(x) * math.sqrt(self.d_model)  # (B, L, D) 
        pos_emb = self.pos_emb(x)   # (1, L, D)
        return self.dropout(tok_emb + pos_emb)
```

tok_emb + pos_emb的直接相加是利用了广播机制，从shape上看，

$$
(B, L, D) + (1, L, D) = (B, L, D)
$$

值得注意的是，tok_emb需要乘以 $\sqrt{d_{model}}$ ，这样做的原因是embedding权重初始化后值普遍较小，而 positional encoding 的幅度是固定的，sin/cos 值域 [-1, 1]。如果不缩放，embedding 信号会被 positional encoding 淹没。乘以 $\sqrt{d_{model}}$ 让两者处于相近的量级。

所以，Embedding层的完整操作可以用公式表示为，

$$
Embedding_{Transformer} = Embedding_{token} \times \sqrt{d_model} + Embedding_{position}
$$

**为什么要加Dropout？**

这是为了防止模型过度依赖某些位置或词，提高泛化能力。

### 测试代码

```
def main():
    tok_emb = TokenEmbedding(vocab_size=10, d_model=4)
    x = torch.randint(0, 10, (2, 5)) # (batch_size, seq_len)
    print(f"x is {x}")

    tok_emb_out = tok_emb(x)
    print(f"the shape of token embedding out is {tok_emb_out.shape}")
    print(f"\n token embedding out is {tok_emb_out}")

    pos_emb = PositionalEmbedding(d_model=4)
    pos_emb_out = pos_emb(x)
    print(f"the shape of positional out is {pos_emb_out.shape}")
    print(f"\n positional embedding out is {pos_emb_out}")

    trans_emb = TransformerEmbedding(vocab_size=10, d_model=4, max_len=500)
    trans_emb_out = trans_emb(x)
    print(f"the shape of transformer out is {trans_emb_out.shape}")
    print(f"\n positional embedding out is {trans_emb_out}")
```

输出结果过长，便不做展示。
