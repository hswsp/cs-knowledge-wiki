# 手搓 Transformer（五）：Encoder组装

## 前言

在前几篇文章中，我们已经分别实现了 Transformer 的核心组件，Embedding，Multi-Head Attention，[LayerNorm](https://zhida.zhihu.com/search?content_id=272594728&content_type=Article&match_order=1&q=LayerNorm&zhida_source=entity)，但这些只是零件。通过本篇文章，我们将把这些零件真正组装成Encoder，也就是论文 Attention Is All You Need 中的这一部分

$$
Input → Embedding → N × EncoderLayer → Output
$$

本部分我们需要先实现PositionwiseFFN，这是一个非线性层，用以增强模型表达能力；然后再把Multi-Head Attention、LayerNorm、FFN组装为EncoderLayer；最后通过堆叠EncoderLayer，实现Encoder。具体的输入输出形状参数等分析，会在对应的类实现下具体讲解。

## Encoder整体数据流

在写代码之前，我们先把整体的数据流搞清楚。

![image](https://pic1.zhimg.com/v2-c049cd8f9ab4485e3fe9d07351df1194_r.jpg)

Transformer架构

### 输入输出

输入是tokens id,形状是`(B, L)`。输出是编码后的表示，形状是`(B,L,D)`。

### Encoder 的完整流程

$$
tokens (B, L)     \rightarrow Embedding (B, L, D)     \rightarrow EncoderLayer × N     \rightarrow (B, L, D)
$$

### EncoderLayer 内部结构

每一层都包含多头自注意力和前馈网络层两大模块:

$$
x \rightarrow Self Attention \rightarrow Add \& Norm \rightarrow FFN \rightarrow Add \& Norm \rightarrow Output
$$

![image](https://pica.zhimg.com/v2-37456da467e36c83c860ae34a8e6eb5a_1440w.jpg)

EncoderLayer结构

- Self-Attention：建模token之间关系
- FFN：逐token非线性变换
- Residual + LayerNorm：稳定训练

## Positionwise FFN

先展示代码：

```python
# 1. PositionwiseFFN
class PositionwiseFFN(nn.Module):
    """
    Input: (B, L, D)
    Output: (B, L, D)
    """
    def __init__(self, d_model: int, hidden: int, dropout: float = 0.1):
        super().__init__()
        self.fc1 = nn.Linear(d_model, hidden)
        self.fc2 = nn.Linear(hidden, d_model)
        self.dropout = nn.Dropout(dropout)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x : (B, L, D)
        x = self.fc1(x)
        x = F.relu(x)
        x = self.dropout(x)
        x = self.fc2(x)
        return x
```

该模块的参数设置有`d_model`,`hidden`,`dropout`.输入输出的张量结构均为`(B,L,D)`.

### 作用

FFN对每一个 token 独立进行非线性变换，不做 token 之间交互。token之间的关系建模是在前面的Attention模块完成的。该模块是是逐位置(position-wise)的 MLP.

### 结构

PositionwiseFFN是两层线性层,中间使用`Relu`作为非线性激活函数.

$$
(B, L, D)\rightarrow^{Linear} \rightarrow  (B, L, H) \rightarrow^{ReLU} \rightarrow^{Dropout}\rightarrow^{Linear}\rightarrow (B, L, D)
$$

**为什么要升维再降维？**FFN在embedding维的变换是`d_model → hidden → d_model`,也就是先进行升维,再降维.hidden通常比d_model大,一般设置为 $4 \times d_{model}$ .这样做是为了**拓展特征空间,提升表达能力;并在中间引入非线性.**

## EncoderLayer

先展示代码:

```
# 2. EncoderLayer
class EncoderLayer(nn.Module):
    """
    Input: (B, L, D)
    OutPut: (B, L, D)
    """
    def __init__(self, d_model: int, n_head: int, hidden: int, dropout: float = 0.1):
        super().__init__()
   
        # 1. Multi-Head Attention
        self.multihead = MultiHeadAttention(d_model, n_head, dropout)
        self.norm1 = self.LayerNorm(d_model)
        self.dropout1 = nn.Dropout(dropout)

        # 2. FFN
        self.ffn = PositionwiseFFN(d_model, hidden, dropout)
        self.norm2 = LayerNorm(d_model)
        self.dropout2 = nn.Dropout(dropout)

    def forward(self, x: torch.Tensor, mask: torch.Tensor = None) -> torch.Tensor:
        # x : (B, L, D)
        # self-attention
        residual = x
        x = self.multihead(x, x, x, mask)
        x = self.dropout1(x)
        x = x + residual
        x = self.norm1(x)

        # ffn
        residual = x
        x = self.ffn(x)
        x = self.dropout2(x)
        x = x + residual
        x = self.norm2(x)
   
        return x
```

### 结构拆解

MHA和ffn都是用到了dropout,防止过拟合.二者结构分别为

$$
x → MHA → Dropout → Add \& Norm  \\ x → FFN → Dropout → Add \& Norm
$$

使用残差连接,防止深层网络退化,使得梯度更稳定,更容易训练.这部分代码的书写,就是按照Transformer架构图,将之前的模块进行组装.注意,原论文中使用的是Post-Norm.

## Encoder 组装

终于来到最顶层结构。先展示代码:

```
# 3. Encoder
class Encoder(nn.Module):
    """
    Input: (B, L)
    Output: (B, L, D)
    """
    def __init__(self, vocab_size: int, d_model: int, max_len: int, n_head: int, hidden: int, n_layer: int, dropout: float = 0.1):
        super().__init__()

        self.embedding = TransformerEmbedding(vocab_size, d_model, max_len, dropout)

        self.layers = nn.ModuleList(
            [EncoderLayer(d_model, n_head, hidden, dropout) for _ in range(n_layer)]
        )

    def forward(self, tokens: torch.Tensor, mask: torch.Tensor = None) -> torch.Tensor:
        x = self.embedding(tokens)
        for layer in layers:
            x = layer(x, mask)
        return x
```

Encoder的组装就是Embedding层加N层EncoderLayer层.该模块的参数设置是所有组件模块的参数集合.输入的张量形状是`(B,L)`,也就是token id.输出的张量形状是`(B,L,D)`.

## 测试代码

```
def main():
    encoder = Encoder(vocab_size=20, max_len=10, d_model=8, n_head=4, hidden=32, n_layer=6, dropout=0.1)
    x = torch.randint(0, 20, (10, 9)) # (B, L) token_id
    out = encoder(x)
    print(f"the shape of out is {out.shape}") #(B, L, D) = (10, 9, 8)
```

输出:

```
the shape of out is torch.Size([10, 9, 8])
```
