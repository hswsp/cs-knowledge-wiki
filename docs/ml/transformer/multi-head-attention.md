# 手搓 Transformer（三）：Multi-Head Attention层

## 前言

在完成[Embedding层](https://zhida.zhihu.com/search?content_id=272581169&content_type=Article&match_order=1&q=Embedding%E5%B1%82&zhida_source=entity)的coding后，我们便开始学习Transformer最核心的设计——Multi-Head Attention，多头注意力。在前面的章节中，我们已经把输入表示为 $(B,L,D)$ 的张量。接下来要解决的问题是**如何让每个token感知整个序列的信息**。这也是Transformer架构与传统的[CNN](https://zhida.zhihu.com/search?content_id=272581169&content_type=Article&match_order=1&q=CNN&zhida_source=entity)类模型主要的不同之处。传统的[RNN](https://zhida.zhihu.com/search?content_id=272581169&content_type=Article&match_order=1&q=RNN&zhida_source=entity)只能一步一步传递信息,传递信息慢，无法并行，并且很难捕捉长距离关系。而CNN感受野有限，一般用来处理图片信息。Attention让每个位置“直接看到”所有位置。

在这个模块中，我们接受的**参数**有 $d_{model}$ ,用以表示模型架构的维度； $n_{head}$ ，用以表示Multi-Head的头数； $dropout$ ,用以控制丢弃率。**输入**有四个张量，分别是 $Q,K,V,mask$ ,前三者形状分别为 $(B,Lq,D),(B,Lk,D),(B,Lv,D)$ ,后者 $mask$ 在不同的情况下形状不一样，主要有 $(B, 1, Lq, Lk) ，(1, 1, Lq, Lk)$ 两种形状。**输出**为一个张量，记为 $x$ ，形状为 $(B,Lq,D)$

## MultiHeadAttention的数据流

Multi-Head Attention模块是Transformer的核心模块，

![image](https://pic1.zhimg.com/v2-9ec2305a41fecef18fef6fe3d24c6246_1440w.jpg)

Multi-Head Attention

此外还可以加入掩码(mask)，

![image](https://pic4.zhimg.com/v2-5755fc50409bfbf2482dce4723ed74ed_1440w.jpg)

Masked Multi-Head Attention

这部分详细pipeline为，

![image](https://pic4.zhimg.com/v2-664c3ac7e8fa4dd9133d2494d4730dc5_r.jpg)

Multi-Head Attention Pipeline

这里的数据流理解还是有一定难度的，需要在coding的时候反复理解。值得一说的是，图中的mask只给了一种形状情况。关于mask的形状使用，会在后续的模块组装中做具体说明。下面总结一下整个过程中的torch.Tensor的shape变化。

$$
Q, K, V: (B, L, D) \\ → split heads: (B, H, L, Hd) \\ → attention score: (B, H, Lq, Lk) \\ → head output: (B, H, Lq, Hd) \\ → concat: (B, Lq, D) \\
$$

## MultiHeadAttention

先展示代码：

```
# Module2: Multi Head Attention
class MultiHeadAttention(nn.Module):
    """
    Input: q (B, Lq, D)
           k (B, Lk, D)
           v (B, Lv, D)
           mask (B, 1, Lq, Lk) or (1, 1, Lq, Lk)
    Output: score (B, Lq, D)
    """
    def __init__(self, d_model: int, n_head: int, dropout: float = 0.1):
        super().__init__()
        assert d_model % n_head == 0, "d_model must be divisiable by n_head"
        self.d_model = d_model
        self.n_head = n_head
        self.head_dim = self.d_model // self.n_head
        self.dropout = nn.Dropout(dropout)

        # linear projection
        self.w_q = nn.Linear(d_model, d_model)
        self.w_k = nn.Linear(d_model, d_model)
        self.w_v = nn.Linear(d_model, d_model)
        self.w_o = nn.Linear(d_model, d_model)
```

整个Multi-Head Attention模块可以用公式表示

$$
MultiHead(Q,K,V) = Concat(head_1,...,head_n)W_o \\ where head_i = Attention(QW_i^{Q},KW_i^K,VW_i^V)
$$

### 模块组件设计

在论文中，Multi-Head Attention层的组件设计如下图：

![image](https://pic2.zhimg.com/v2-cba5b65b7654aceeba52183a29b003a9_r.jpg)

Multi-Head Attention的组件设计

从图可以看出，Multi-Head Attention的定义看起来是为每一个 head 分别学习一组线性变换参数，也就是，

$$
head_i = Attention(QW_i^Q, KW_i^K, VW_i^V)
$$

这似乎意味着应该先拆分 head，再分别进行线性变换。然而在工程实现中（如本项目），通常采用另一种写法：先通过一个大的线性层映射到 `d_model` 维度，再 reshape 成多个 head。

这两种实现方式在数学上是等价的。因为一个大的投影矩阵 $W_q ∈ ℝ^{D×D}$ 可以看作是多个小矩阵 $[W_1, W_2, ..., W_H]$ 的拼接，其中每个 $W_i ∈ ℝ^{D×(D/H)}$ 。一次矩阵乘法的结果可以自然拆分为多个 head 的结果。因此，先线性再拆分，本质上是对论文中“每个 head 单独线性变换”的高效并行实现，二者是完全等价的。

因此我们直接定义了四个投影层 $W_q,W_k,W_v.W_o$ ，仅对张量的最后一个维度(`dim=-1`)进行操作，故输入输出维度为`(d_model,d_model)`。 此外，为了防止过拟合，还需要设置`dropout`。为了保证多头能够对 $d_{model}$ 空间进行完整拆分，参数 $d_{model},n_{head}$ 的设置必须要能够整除，每一个头所处理的子空间维度是

$$
head_{dim} = d_{model} // n_{head}
$$

### forward过程

先展示代码：

```python
def forward(self, q: torch.Tensor, k: torch.Tensor, v: torch.Tensor, mask: torch.Tensor = None) -> torch.Tensor:
        batch_size, q_size, _ = q.size()
        _, k_size, _ = k.size()
        _, v_size, _ = v.size()

        # 1. linear projection
        q = self.w_q(q)
        k = self.w_k(k)
        v = self.w_v(v)

        # 2. split heads
        # (B, L, D) -> (B, H, L, Hd)
        q = q.view(batch_size, q_size, self.n_head, self.head_dim).transpose(1, 2)
        k = k.view(batch_size, k_size, self.n_head, self.head_dim).transpose(1, 2)
        v = v.view(batch_size, v_size, self.n_head, self.head_dim).transpose(1, 2)

        # 3. scale attention
        score = torch.matmul(q, k.transpose(-2, -1)) / math.sqrt(self.head_dim) # (B, H, Lq, Lk)
        if mask is not None:
            score = score.masked_fill(~mask, float("-inf"))
        score = torch.softmax(score, dim=-1) # (B, H, Lq, Lk)
        score = self.dropout(score)

        attn = torch.matmul(score, v) # (B, H, Lq, Hd)

        # 4. concat heads
        # (B, H, Lq, Hd) -> (B, Lq, H, Hd) -> (B, Lq, D)
        out = attn.transpose(1, 2).contiguous().view(batch_size, q_size, self.d_model)

        # 5. linear projection
        out = self.w_o(out)

        return out
```

Transformer的Attention是`Scaled Dot-Product Attention`，核心计算为

$$
Attention(Q, K, V) = softmax(\frac{QK^T}{\sqrt{d_k}})V
$$

其中 $Q,K,V$ 分别表示 $Query,Key,Value$ .关于这三者的直观理解，可以在很多短视频平台上找到，此处不再赘述。 $d_k$ 表示每一个头的子空间维度，也就是前面的 $head_{dim}$ 。**为什么要除以** $\sqrt{d_k}$ **?**

如果不进行该操作，点积会随着维度增大而变大，softmax 会变得极端”，接近 one-hot。这会使得训练中出现梯度消失，导致训练困难。进行该操作是为了保持数值稳定，避免梯度消失。

先进行**线性投影**，让每个头在不同子空间计算注意力。 $W_q,W_k,W_v$ 是可学习参数，提升模型的表达能力，把原始embedding映射到更适合相似度计算的空间。形状变化

$$
(B, L, D) → (B, L, D)
$$

然后**拆分多头**，

```
q = q.view(batch_size, q_size, self.n_head, self.head_dim).transpose(1, 2)
```

shape变化

$$
(B, L, D)  → (B, L, H, Hd)  → (B, H, L, Hd)
$$

如何没有前面的线性变换，则会在原始的Embedding上进行拆分，这会限制模型的表达能力，导致后续训练过程中模型学习能力降低。![image](https://pic4.zhimg.com/v2-59206a06c508e2055a5fbcd36b40b1c3_r.jpg)

缩放点积注意力

接着**计算Attention**，

```
score = torch.matmul(q, k.transpose(-2, -1))
```

shape变化

$$
(B, H, Lq, Hd) × (B, H, Hd, Lk) → (B, H, Lq, Lk)
$$

表示第 i 个 token 对所有 token 的注意力权重。此外，还需要加入mask机制，用以屏蔽 padding或者在Decoder中屏蔽未来信息。对于mask张量的设计，会放在后续的transformer组装中讲解。对于需要被掩码的位置，将其Attention设置为`-inf`，后续计算Attention分数时， $softmax(-inf) = 0$ ，从而实现屏蔽的作用。然后**softmax操作计算出Attention分数，并进行加权求和**

```
score = torch.softmax(score, dim=-1)
attn = torch.matmul(score, v)
```

shape变化：

$$
(B, H, Lq, Lk) × (B, H, Lv, Hd) → (B, H, Lq, Hd)
$$

注意到，`Lk`和`Lv`必须相等，否则此处会出现错误。 这样算出来的atten,每个 token 汇聚所有 token 的信息。值得一提的是，我们计算出的`attn`，仅仅是对`V`的线性变化，模型的表达能力是有限的。所以在拼接`attn`后，我们需要再过`FFN`的非线性变换，以增强模型的表达能力。

接着**拼接多头，**把多个 head 的信息合并回来

```
out = attn.transpose(1, 2).contiguous().view(batch_size, q_size, self.d_model)
```

shape变化：

$$
(B, H, L, Hd) → (B, L, H, Hd) → (B, L, D)
$$

最后，**输出映射**。经过线性投影 $W_o$ ，将不同头的信息进行融合. $W_o$ 是可学习参数，在模型训练中能够学习融合方式。

### 测试代码

```
def main():
    multi_head_attention = MultiHeadAttention(d_model=4, n_head=2)
    # x : (B, L, D)
    x = torch.rand(4, 8, 4)
    print(f"the shape of x is {x.shape}")
    print(f"x is {x}")

    out = multi_head_attention(x, x, x)
    print(f"\n the shape of multi-head attention is {out.shape}")
    print(f"multi-head attention is {out}")
```
