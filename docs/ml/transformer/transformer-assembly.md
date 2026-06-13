# 手搓 Transformer（七）：Transformer组装

> 本文是手搓 [Transformer](https://zhida.zhihu.com/search?content_id=272618377&content_type=Article&match_order=1&q=Transformer&zhida_source=entity)系列的第七篇。前面六篇我们逐一实现了 TokenEmbedding、[PositionEmbedding](https://zhida.zhihu.com/search?content_id=272618377&content_type=Article&match_order=1&q=PositionEmbedding&zhida_source=entity)、Multi-Head Attention、[LayerNorm](https://zhida.zhihu.com/search?content_id=272618377&content_type=Article&match_order=1&q=LayerNorm&zhida_source=entity)、Encoder 和 [Decoder](https://zhida.zhihu.com/search?content_id=272618377&content_type=Article&match_order=1&q=Decoder&zhida_source=entity)，现在终于到了最激动人心的环节——把所有模块组装成一个完整的 Transformer。由于训练代码也值得专门讲解，所以本文不对训练做讲解。不过在我的仓库中，有一个toy train，可以尝试自行运行，并观察训练中输出的变化情况~
> 完整代码见：[GitHub - sweeter-byte/coding-my-own-transformer](https://link.zhihu.com/?target=https%3A//github.com/sweeter-byte/coding-my-own-transformer) 欢迎star~

## 前言

回顾一下原论文"*Attention Is All You Need"* 中的经典架构图：左侧是 Encoder，右侧是 Decoder，它们通过 [Cross-Attention](https://zhida.zhihu.com/search?content_id=272618377&content_type=Article&match_order=1&q=Cross-Attention&zhida_source=entity) 连接在一起。我们前几篇已经分别实现了这两个模块，现在需要一个顶层类 `Transformer` 来完成以下工作：

1. **生成三种** **[Mask](https://zhida.zhihu.com/search?content_id=272618377&content_type=Article&match_order=1&q=Mask&zhida_source=entity)**——这是组装阶段最核心的逻辑
2. **调度 Encoder 和 Decoder 的前向传播**——把数据按正确的路径流过整个网络
3. **管理超参数**——将 `pad_idx`、`device` 等配置集中管理

其中 Mask 的生成是最容易出错、也是最值得深入理解的部分，所以本文会重点展开。

## Transformer 类的整体结构

先看 `__init__`，它做的事情很直接——实例化 Encoder 和 Decoder，并记录 padding index：

```
class Transformer(nn.Module):
    def __init__(self, src_pad_idx, trg_pad_idx, enc_vocab_size, dec_vocab_size,
                 d_model, max_len, n_head, hidden, enc_layer, dec_layer,
                 dropout=0.1, device=torch.device("cpu")):
        super().__init__()
        self.encoder = Encoder(enc_vocab_size, d_model, max_len, n_head, hidden, enc_layer, dropout)
        self.decoder = Decoder(dec_vocab_size, d_model, max_len, n_head, hidden, dec_layer, dropout)
        self.src_pad_idx = src_pad_idx
        self.trg_pad_idx = trg_pad_idx
        self.device = device
```

注意 Encoder 和 Decoder 可以有不同的词表大小（`enc_vocab_size` vs `dec_vocab_size`）和不同的层数（`enc_layer` vs `dec_layer`），但共享 `d_model`、`n_head`、`max_len` 等维度参数。这是因为 Cross-Attention 要求 Encoder 输出和 Decoder 中间表示的维度必须一致。

## Mask 详解：为什么需要 Mask，以及如何生成

Transformer 中一共需要 **三种 Mask**，分别用在三个不同的注意力计算中。这是整个组装过程中最关键的部分。

### Mask 的作用原理

在 Multi-Head Attention 中，mask 作用于 attention score 矩阵：

```python
score = torch.matmul(q, k.transpose(-2, -1)) / math.sqrt(self.head_dim)
if mask is not None:
    score = score.masked_fill(~mask, float("-inf"))
score = torch.softmax(score, dim=-1)
```

`mask` 中为 `False` 的位置会被填充为 $-\infty$，经过 softmax 后这些位置的注意力权重趋近于 0。也就是说，**mask 控制了每个 query 能看到哪些 key**。

我们设计 mask 的 shape 为 `(B, 1, Lq, Lk)`，其中第二个维度是 1，可以通过广播机制扩展到所有head——因为所有 head 共享同一套 mask 规则。

### Mask 1：Encoder [Self-Attention](https://zhida.zhihu.com/search?content_id=272618377&content_type=Article&match_order=1&q=Self-Attention&zhida_source=entity) 的 Padding Mask

Encoder的输入是源语言序列，由于batch中不同句子长度不同，短句会用 `<pad>` 补齐。我们不希望任何 token 去“观测”到这些 padding 位置。（英文来讲应该使用attend，这里不知如何使用中文准确表述了）

```
def make_pad_mask(self, k: torch.Tensor, pad_idx: int) -> torch.Tensor:
    """
    Input: k (B, Lk)
    Output: mask (B, 1, 1, Lk)
    """
    return (k != pad_idx).unsqueeze(1).unsqueeze(2)
```

逐步拆解这个函数的执行过程：

```
k = [[5, 3, 2, 0, 0],   # 句子1，后两个是padding
     [7, 4, 1, 6, 0]]   # 句子2，最后一个是padding

(k != 0) → [[True, True, True, False, False],
             [True, True, True, True,  False]]   # shape: (2, 5)

.unsqueeze(1).unsqueeze(2)                         # shape: (2, 1, 1, 5)
```

最终 shape 是 `(B, 1, 1, Lk)`。两个 `1` 分别对应 head 维度和 query 维度。这意味着：**不论是哪个 head、哪个 query 位置，都不能观测到 padding 位置**。这正是我们想要的效果。

### Mask 2：Decoder Self-Attention 的联合 Mask

Decoder 的 self-attention 需要同时满足两个约束：

1. **不能看到 padding**（和 Encoder 一样）
2. **不能看到未来的 token**（因为在自回归生成时，位置 $i$ 只能依赖 $0, 1, \ldots, i$ 的信息）

第二个约束通过 **[Causal Mask](https://zhida.zhihu.com/search?content_id=272618377&content_type=Article&match_order=1&q=Causal+Mask&zhida_source=entity)**（因果掩码）实现：

```
def make_causal_mask(self, q: torch.Tensor, k: torch.Tensor) -> torch.Tensor:
    """
    Input: q (B, Lq), k (B, Lk)
    Output: mask (1, 1, Lq, Lk)
    """
    len_q = q.size(1)
    len_k = k.size(1)
    mask = torch.tril(torch.ones(len_q, len_k, dtype=torch.bool, device=q.device))
    return mask.unsqueeze(0).unsqueeze(1)
```

`torch.tril` 生成一个下三角矩阵：

```
[[True, False, False, False],
 [True, True,  False, False],
 [True, True,  True,  False],
 [True, True,  True,  True ]]
```

第 $i$ 行表示位置 $i$ 能看到哪些位置——只有 $\leq i$ 的位置为 `True`。

最终，decoder 的 self-attention mask 是两者的逐元素与运算：

```
dec_pad_mask = self.make_pad_mask(trg_tokens, self.trg_pad_idx)   # (B, 1, 1, trg_L)
dec_causal_mask = self.make_causal_mask(trg_tokens, trg_tokens)   # (1, 1, trg_L, trg_L)
dec_mask = dec_pad_mask & dec_causal_mask
```

这里利用了 PyTorch 的广播机制：`(B, 1, 1, trg_L)` 和 `(1, 1, trg_L, trg_L)` 会广播为 `(B, 1, trg_L, trg_L)`。结果同时屏蔽了 padding 和未来位置。

用一个具体例子来理解。假设目标序列是 `[<sos>, "I", "am", <pad>]`，则：

```
pad_mask  = [True, True, True, False]  → 广播到每一行
causal    = [[T, F, F, F],
             [T, T, F, F],
             [T, T, T, F],
             [T, T, T, T]]

dec_mask  = [[T, F, F, F],    # <sos> 只看自己
             [T, T, F, F],    # "I" 看 <sos> 和自己
             [T, T, T, F],    # "am" 看前三个，但 <pad> 被 pad_mask 屏蔽
             [T, T, T, F]]    # <pad> 行：虽然 causal 全开，但 pad_mask 挡住了自己
```

### Mask 3：Cross-Attention 的 Padding Mask

Cross-Attention 中，query 来自 Decoder，key和value 来自 Encoder 的输出。这里我们只需要确保 Decoder 不会观测到 Encoder 输入中的 padding 位置：

```
cross_mask = self.make_pad_mask(src_tokens, self.src_pad_idx)  # (B, 1, 1, src_L)
```

不需要 causal mask，因为 Decoder 的每个位置都可以自由访问 Encoder 的所有非 padding 位置——**这正是翻译等任务中”参考完整源句”的语义。**

**三种 Mask 总结**

| Mask | 用在哪里 | 组成 | Shape |
| --- | --- | --- | --- |

## 数据流分析

理解了 Mask 之后，来看数据是如何在整个 Transformer 中流动的。以机器翻译为例，假设我们有：

- 源语言 batch：`src_tokens`，shape `(B, src_L)`
- 目标语言 batch：`trg_tokens`，shape `(B, trg_L)`

```
def forward(self, src_tokens, trg_tokens):
    # 1. 生成三种 Mask
    enc_mask = self.make_pad_mask(src_tokens, self.src_pad_idx)
    dec_pad_mask = self.make_pad_mask(trg_tokens, self.trg_pad_idx)
    dec_causal_mask = self.make_causal_mask(trg_tokens, trg_tokens)
    dec_mask = dec_pad_mask & dec_causal_mask
    cross_mask = self.make_pad_mask(src_tokens, self.src_pad_idx)

    # 2. Encoder 前向传播
    enc_x = self.encoder(src_tokens, enc_mask)

    # 3. Decoder 前向传播
    dec_x = self.decoder(enc_x, trg_tokens, dec_mask, cross_mask)

    return dec_x
```

整个数据流可以用下面的路径概括：

![image](https://pic2.zhimg.com/v2-134868e07979e3e188df6f5629ba6fc9_r.jpg)

整体流程Pipeline

几个值得注意的细节：

**Encoder 的输出** `enc_x` **会被所有 Decoder Layer 共享。** 每一层 DecoderLayer 的 Cross-Attention 都以同一个 `enc_x` 作为 key 和 value。这在代码中体现为 `enc_x` 被直接传进 `self.decoder()`，然后在内部循环中复用。

**Cross-Attention 的 Q/K/V 来源不同。** 与 Self-Attention 中 Q=K=V=x 不同，Cross-Attention 中 Q 来自 Decoder，K 和 V 来自 Encoder：

```
# DecoderLayer 中的 cross attention
dec_x = self.cross_attn(dec_x, enc_x, enc_x, s_mask)
#                        Q       K      V
```

这使得 Decoder 能够在生成每个目标 token 时，动态地从源序列中提取相关信息。

**最终的 Linear 层将隐藏维度映射到目标词表大小。** 输出 shape 为 `(B, trg_L, dec_vocab_size)`，每个位置是一个 **logits 向量**，表示该位置生成各个词的”原始分数”。训练时会配合 `CrossEntropyLoss` 使用（这部分我们留到下篇再讲）。

## 完整代码

```
class Transformer(nn.Module):
    def __init__(self, src_pad_idx, trg_pad_idx, enc_vocab_size, dec_vocab_size,
                 d_model, max_len, n_head, hidden, enc_layer, dec_layer,
                 dropout=0.1, device=torch.device("cpu")):
        super().__init__()
        self.encoder = Encoder(enc_vocab_size, d_model, max_len, n_head, hidden, enc_layer, dropout)
        self.decoder = Decoder(dec_vocab_size, d_model, max_len, n_head, hidden, dec_layer, dropout)
        self.src_pad_idx = src_pad_idx
        self.trg_pad_idx = trg_pad_idx
        self.device = device

    def make_pad_mask(self, k, pad_idx):
        return (k != pad_idx).unsqueeze(1).unsqueeze(2)

    def make_causal_mask(self, q, k):
        len_q, len_k = q.size(1), k.size(1)
        mask = torch.tril(torch.ones(len_q, len_k, dtype=torch.bool, device=q.device))
        return mask.unsqueeze(0).unsqueeze(1)

    def forward(self, src_tokens, trg_tokens):
        enc_mask = self.make_pad_mask(src_tokens, self.src_pad_idx)

        dec_pad_mask = self.make_pad_mask(trg_tokens, self.trg_pad_idx)
        dec_causal_mask = self.make_causal_mask(trg_tokens, trg_tokens)
        dec_mask = dec_pad_mask & dec_causal_mask

        cross_mask = self.make_pad_mask(src_tokens, self.src_pad_idx)

        enc_x = self.encoder(src_tokens, enc_mask)
        dec_x = self.decoder(enc_x, trg_tokens, dec_mask, cross_mask)
        return dec_x
```

## 小结

这篇文章完成了整个 Transformer 的组装。核心工作其实就是 **Mask 生成** 和 **数据流编排**——Encoder、Decoder、Attention 这些模块我们之前已经实现好了，组装阶段的关键在于理解每种 Mask 的语义，以及 Q/K/V 在不同 Attention 中的来源。

下一篇我们将进入训练阶段，包括数据预处理、学习率调度、标签平滑等实际训练时的细节。
