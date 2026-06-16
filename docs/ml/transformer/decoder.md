# 手搓 Transformer（六）：Decoder 拼装

## 前言

在前面几篇文章中，我们系统梳理了词向量位置编码Embedding层，注意力机制[Multi-Head Attention](https://zhida.zhihu.com/search?content_id=272596331&content_type=Article&match_order=1&q=Multi-Head+Attention&zhida_source=entity)层，归一化LayerNorm层，信息编码器Encoder层。本章将重要阐述Decoder部分内容。由于Decoder的[masked self-attention](https://zhida.zhihu.com/search?content_id=272596331&content_type=Article&match_order=1&q=masked+self-attention&zhida_source=entity),cross-attention,FFN三部分组件在前面都已经实现，所以我们主要讨论数据流动，以及具体的代码实现。

Decoder涉及到的**参数**与Encoder大部分一致，在此基础上多出了t_mask和s_mask，前者用于masked self-attention的掩码，后者用于cross-attention的掩码。关于二者张量的具体实现，会在下一篇Transformer的组装中具体阐述。Decoder的**输入**有两部分，一部分是已生成的词向量，形状为 $(B,L)$ ,记为dec_tokens；另一部分是Encoder编码后的信息向量,形状为 $(B,L,D)$ ,记为enc_x。Decoder的输出为解码后的信息向量，形状为 $(B,L,D)$ ,记为dec_x。

> Decoder的核心作用是根据已生成的内容和Encoder的信息预测下一个 token

## Decoder整体数据流

先从宏观结构入手

![image](https://picx.zhimg.com/v2-c92d88a6616de08cf6ad9e28cd435273_r.jpg)

Transformer架构

Decoder的第一步和Encoder极其相似，需要经过Embedding，

$$
(B, L) \to (B, L, D)
$$

将毫无意义的token_id转化为有一定意义的词向量。

Decoder第二步是多层DecoderLayer堆叠，这和Encoder也很类似，

$$
(B, L, D) \to (B, L, D)
$$

区别在于DecoderLayer内部有三个组件，并且有两个不同的输入。每一层Decoder都包含Masked self-Attention, Cross-Attention,以及FFN。

## DecoderLayer

先展示代码：

```python
# Module5: Decoder
# DecoderLayer -> Decoder
# 1. DecoderLayer
class DecoderLayer(nn.Module):
    """
    Input: (B, L, D)
    Output: (B, L, D)
    """
    def __init__(self, d_model: int, n_head: int, hidden: int, dropout: float = 0.1):
        super().__init__()
        # self attention
        self.attn = MultiHeadAttention(d_model, n_head, dropout)
        self.dropout1 = nn.Dropout(dropout)
        self.norm1 = LayerNorm(d_model)

        # cross attention
        self.cross_attn = MultiHeadAttention(d_model, n_head, dropout)
        self.dropout2 = nn.Dropout(dropout)
        self.norm2 = LayerNorm(d_model)

        # ffn
        self.ffn = PositionwiseFFN(d_model, hidden, dropout)
        self.dropout3 = nn.Dropout(dropout)
        self.norm3 = LayerNorm(d_model)

    def forward(self, enc_x: torch.Tensor, dec_x: torch.Tensor, t_mask: torch.Tensor = None, s_mask: torch.Tensor = None) -> torch.Tensor:
        # enc_x: (B, L, D)
        # dec_x: (B, L, D)
   
        # 1. self attention
        residual = dec_x
        dec_x = self.attn(dec_x, dec_x, dec_x, t_mask)
        dec_x = self.dropout1(dec_x)
        dec_x = self.norm1(dec_x + residual)

        # 2. cross attention
        residual = dec_x
        dec_x = self.cross_attn(dec_x, enc_x, enc_x, s_mask)
        dec_x = self.dropout2(dec_x)
        dec_x = self.norm2(dec_x + residual)

        # 3. ffn
        residual = dec_x
        dec_x = self.ffn(dec_x)
        dec_x = self.dropout3(dec_x)
        dec_x = self.norm3(dec_x + residual)

        return dec_x# Module5: Decoder
# DecoderLayer -> Decoder
# 1. DecoderLayer
class DecoderLayer(nn.Module):
    """
    Input: (B, L, D)
    Output: (B, L, D)
    """
    def __init__(self, d_model: int, n_head: int, hidden: int, dropout: float = 0.1):
        super().__init__()
        # self attention
        self.attn = MultiHeadAttention(d_model, n_head, dropout)
        self.dropout1 = nn.Dropout(dropout)
        self.norm1 = LayerNorm(d_model)

        # cross attention
        self.cross_attn = MultiHeadAttention(d_model, n_head, dropout)
        self.dropout2 = nn.Dropout(dropout)
        self.norm2 = LayerNorm(d_model)

        # ffn
        self.ffn = PositionwiseFFN(d_model, hidden, dropout)
        self.dropout3 = nn.Dropout(dropout)
        self.norm3 = LayerNorm(d_model)

    def forward(self, enc_x: torch.Tensor, dec_x: torch.Tensor, t_mask: torch.Tensor = None, s_mask: torch.Tensor = None) -> torch.Tensor:
        # enc_x: (B, L, D)
        # dec_x: (B, L, D)
   
        # 1. self attention
        residual = dec_x
        dec_x = self.attn(dec_x, dec_x, dec_x, t_mask)
        dec_x = self.dropout1(dec_x)
        dec_x = self.norm1(dec_x + residual)

        # 2. cross attention
        residual = dec_x
        dec_x = self.cross_attn(dec_x, enc_x, enc_x, s_mask)
        dec_x = self.dropout2(dec_x)
        dec_x = self.norm2(dec_x + residual)

        # 3. ffn
        residual = dec_x
        dec_x = self.ffn(dec_x)
        dec_x = self.dropout3(dec_x)
        dec_x = self.norm3(dec_x + residual)

        return dec_x
```

这是整篇的重点。在前文中已提及DecoderLayer包含三层结构。其中与Encoder不同的便是Masked Self-Attention。

### Masked Self-Attention

因为 Decoder 是**自回归生成**,不能看到未来的信息，便需要引入掩码。

```
已知：I love → 预测：you
```

但模型输入是：

```
I love you
```

如果不mask，模型会偷看未来答案。解决办法就是把已生成的词后续的词全部mask，也就是仅保留下三角。

![image](https://pic1.zhimg.com/v2-3c7b0bafce4ff75db3cb9ed1076a1238_r.jpg)

主对角线以上全部mask

通过图片也能知晓如何生成对应的mask，具体代码如何请待下一篇文章。在目前的代码中，`t_mask`就是图片中所提及的causal mask。

### Cross Attention

这部分将Encoder的编码信息和目前已生成的词向量信息相结合，值得一提的是，我们只需要从Encoder中获取 $K,V$ ,而 $Q$ 是Decoder自身的词向量信息。从此处也能够解释**为什么只有KV cache，而无Q cache**。不缓存Q是因为Q只在当前token一次性使用，而KV是长期可以复用的历史信息，缓存KV能够避免重复计算、将复杂度从 $O(n^2)$ 降低至 $O(n)$ 。另外，Q的计算仅依赖当前的token embedding，开销小；KV需要对历史所有token做线性投影，开销大。

![image](https://picx.zhimg.com/v2-707f2da55594e38b51ebb4a2bd17b7f7_r.jpg)

Cross-Attentio中的Q,K,V顺序

Encoder负责理解输入句子，Decoder负责生成输出句子，cross-attention将二者进行对齐。

剩下部分在前面文章中已做讲解，此处不再赘述。

## Decoder

先展示代码：

```
# 2. Decoder
class Decoder(nn.Module):
    """
    Input: (B, L)
    Output: (B, L, D)
    """
    def __init__(self, vocab_size: int, d_model: int, max_len: int, n_head: int, hidden: int, n_layer: int, dropout: float = 0.1):
        super().__init__()

        self.embedding = TransformerEmbedding(vocab_size, d_model, max_len, dropout)

        self.layers = nn.ModuleList(
            [DecoderLayer(d_model, n_head, hidden, dropout) for _ in range(n_layer)]
        )

    def forward(self, enc_x: torch.Tensor, dec_tokens: torch.Tensor, t_mask: torch.Tensor, s_mask: torch.Tensor) -> torch.Tensor:
        # enc_x: (B, L, D)
        # dec_tokens: (B, L)
        dec_x = self.embedding(dec_tokens)

        for layer in self.layers:
            dec_x = layer(enc_x, dec_x, t_mask, s_mask)
        return dec_x
```

Decoder的任务很简单，就是把前面的Embedding与堆叠的DecoderLayer进行组装。

由于目前还未讲解如何构造mask张量，以及Decoder的测试涉及到多个模块，我们将在下一篇Transformer组装中进行测试，并完成一个简单训练任务。
