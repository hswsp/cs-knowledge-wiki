# “预训练+微调”范式

> [GPT-1学习笔记：“预训练+微调”范式](https://zhuanlan.zhihu.com/p/2027149256683791466)

## 前言

本文是“手搓Transformer”系列的后续学习笔记。在完成原始Transformer（[Attention Is All You Need](https://zhida.zhihu.com/search?content_id=273034530&content_type=Article&match_order=1&q=Attention+Is+All+You+Need&zhida_source=entity)）的从零实现后，本篇转向GPT-1。它虽只用了Transformer的一半架构，却开创了影响至今的预训练范式。

![image](https://pica.zhimg.com/v2-6cbd08d425081b930ccb3c1de664b1a2_r.jpg)

图源：Towards Data Science。Transformer可以拆解为BERT和GPT

- 论文原文：*[Improving Language Understanding by Generative Pre-Training](https://link.zhihu.com/?target=https%3A//cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf)*（Radford et al., 2018）
- 代码参考：HuggingFace PyTorch 复现 [pytorch-openai-transformer-lm](https://link.zhihu.com/?target=https%3A//github.com/huggingface/pytorch-openai-transformer-lm)
- OpenAI官方TF代码：[openai/finetune-transformer-lm](https://link.zhihu.com/?target=https%3A//github.com/openai/finetune-transformer-lm)

之前的手搓Transformer系列：[https://zhuanlan.zhihu.com/p/2023866936040203643](https://zhuanlan.zhihu.com/p/2023866936040203643)

## 一、GPT范式

学完Transformer之后，一个自然的问题是：Transformer架构，能不能用在更广泛的NLP任务上？

困难在于大多数NLP任务（文本蕴含、问答、情感分类等）的标注数据非常稀缺，而**无标注文本**却到处都是。2018年以前，NLP的主流做法是为每个任务单独设计模型架构，然后用有限的标注数据从头训练。这种做法有两个根本性的问题：

1. **标注数据太少，**很多任务只有几千条标注样本，不足以训练一个复杂模型。
2. **知识无法复用，**为情感分类训练的模型学到的语言知识，无法迁移到文本蕴含任务上。

GPT-1的核心贡献是提出了一套**两阶段**方案来解决这两个问题：

1. **无监督预训练（****[Unsupervised Pre-training](https://zhida.zhihu.com/search?content_id=273034530&content_type=Article&match_order=1&q=Unsupervised+Pre-training&zhida_source=entity)****）**：在大规模无标注语料上训练一个语言模型，让模型学会语言的通用表示。
2. **有监督微调（****[Supervised Fine-tuning](https://zhida.zhihu.com/search?content_id=273034530&content_type=Article&match_order=1&q=Supervised+Fine-tuning&zhida_source=entity)****）**：在下游任务的标注数据上微调，只需加一个简单的线性层。

这个“预训练+微调”的范式，后来被BERT、GPT-2、GPT-3一路继承，成了整个NLP领域的标准做法。

## 二、整体架构

![image](https://pica.zhimg.com/v2-6c256ccc19f2fa82f90a0aa0663e87a4_r.jpg "原始Transformer和decoder-only Transformer对比")

下图是GPT-1论文中的Figure 1，左侧是模型架构，右侧是不同任务的输入变换方式：

![image](https://pic3.zhimg.com/v2-425627f1b252aaa10db6daae0d36b852_r.jpg "GPT-1 论文 FIg.1")

左侧是GPT-1的Transformer decoder架构,12 层堆叠的Transformer block，每个block包含Masked Multi-Head Self-Attention和Feed Forward两个子层，加上Layer Norm。右侧展示了四种下游任务（文本分类、自然语言推理、语义相似度、多项选择）的输入格式变换方式。所有任务共享同一个Transformer主体，仅在输入格式和输出头上有差异。

### 2.1 数据流分析

在深入架构细节之前，先从宏观上理解数据是如何在GPT-1中流动的。输入是token,输出是概率分布。整个前向过程可以用一条链路概括。

![image](https://picx.zhimg.com/v2-b7ab4ceeadb25b88c84ff0fc8f8ae0e9_r.jpg "数据流动")

其中 `B` = batch size，`T` = 序列长度（最大 512），`D` = 隐藏维度（768），`V` = 词表大小（40000 + 特殊 token）。

**维度不变性**：整个Transformer的12层Block内部，tensor的shape始终是 `(B, T, D)`。每一层的输入和输出维度完全相同，这是残差连接能够工作的前提。Self-attention负责 token 之间的信息交换，FFN 负责每个token自身的非线性变换。

**最后一步的展开**：LM Head(Language Modeling Head)将768维的hidden state映射到词表大小的logits向量。由于权重绑定，这个映射本质上是在计算hidden state与每个token embedding的相似度。相似度越高，该 token 作为“下一个词”的概率越大。

![image](https://pic3.zhimg.com/v2-14f8397ef99fcdb0f782b639ffd133ee_r.jpg "图源：Towards Data Science。模型架构与数学公式对应")

## 三、架构对比

这是本文最关键的部分。如果你已经实现过Transformer的encoder-decoder架构，理解GPT-1的架构改动其实很直接。

### 3.1 Decoder

原始Transformer是encoder-decoder结构，设计用于seq2seq任务，如机器翻译。GPT-1**只使用了Decoder部分**，且去掉了cross-attention子层。

为什么可以这样做？因为**语言模型的任务是给定前文预测下一个 token**，这天然就是一个**自回归**过程，只需要 masked self-attention，即因果注意力，不需要encoder提供的上下文。

对应到代码中的`Block`：

```python
class Block(nn.Module):
    def __init__(self, n_ctx, cfg, scale=False):
        super(Block, self).__init__()
        nx = cfg.n_embd
        self.attn = Attention(nx, n_ctx, cfg, scale)
        self.ln_1 = LayerNorm(nx)
        self.mlp = MLP(4 * nx, cfg)
        self.ln_2 = LayerNorm(nx)

    def forward(self, x):
        a = self.attn(x)
        n = self.ln_1(x + a)
        m = self.mlp(n)
        h = self.ln_2(n + m)
        return h
```

对比原始Transformer的Decoder Block，GPT-1的Block里：

- **有** masked self-attention（`self.attn`）
- **没有** cross-attention（原始Decoder的第二个子层）
- **有** feed-forward network（`self.mlp`）

每个Block的结构从原来的**三个子层简化为两个子层**。

### 3.2 LayerNorm

原始Transformer采用的是**Post-LN**：先子层计算，再残差连接，最后 LayerNorm

$$
LayerNorm(x + Sublayer(x))
$$

GPT-1的代码里做法和这一致。看`Block.forward`：

```python
a = self.attn(x)       # 子层计算
n = self.ln_1(x + a)   # 残差连接 + LayerNorm (Post-LN)
m = self.mlp(n)         # 子层计算
h = self.ln_2(n + m)    # 残差连接 + LayerNorm (Post-LN)
```

**注意,**后来的 GPT-2改成了先LN再子层计算**Pre-LN**，即

$$
x + Sublayer(LayerNorm(x))
$$

**Pre-LN被证明在深层网络中训练更稳定**，这也是GPT-2相比GPT-1的一个重要改进，后续手搓GPT-2时会详细讨论。

LayerNorm的代码实现（这里我参考了OpenAI 风格，epsilon在根号内部）：

```python
class LayerNorm(nn.Module):
    def __init__(self, n_state, e=1e-5):
        super(LayerNorm, self).__init__()
        self.g = nn.Parameter(torch.ones(n_state))
        self.b = nn.Parameter(torch.zeros(n_state))
        self.e = e

    def forward(self, x):
        u = x.mean(-1, keepdim=True)
        s = (x - u).pow(2).mean(-1, keepdim=True)
        x = (x - u) / torch.sqrt(s + self.e)
        return self.g * x + self.b
```

### 3.3 位置编码

原始Transformer使用固定的正弦/余弦位置编码：

$$
PE_{(pos, 2i)} = \sin\left(\frac{pos}{10000^{2i/d_{\text{model}}}}\right)
$$

GPT-1则使用**可学习的位置嵌入** $W_p$。论文中公式：

$$
h_0 = UW_e + W_p
$$

其中 $W_e$ 是 token embedding 矩阵，$W_p$ 是 position embedding 矩阵，两者直接相加。

代码中的实现方式比较特别。`TransformerModel`使用了一个统一的`nn.Embedding`，输入`x`的最后一维包含两个通道：`x[:, :, 0]`是 token id，`x[:, :, 1]`是 position id。两者分别查同一个embedding表后求和：

```python
class TransformerModel(nn.Module):
    def __init__(self, cfg, vocab=40990, n_ctx=512):
        super(TransformerModel, self).__init__()
        self.embed = nn.Embedding(vocab, cfg.n_embd)
        self.drop = nn.Dropout(cfg.embd_pdrop)
        block = Block(n_ctx, cfg, scale=True)
        self.h = nn.ModuleList([copy.deepcopy(block) for _ in range(cfg.n_layer)])

    def forward(self, x):
        x = x.view(-1, x.size(-2), x.size(-1))
        e = self.drop(self.embed(x))
        h = e.sum(dim=2)  # 将 token emb 和 position emb 相加
        for block in self.h:
            h = block(h)
        return h
```

注意`e.sum(dim=2)`这行，`x` 的 shape 是 `(batch, seq_len, 2)`，经过embedding后变成`(batch, seq_len, 2, n_embd)`，沿 `dim=2`求和就是把 token embedding 和 position embedding 加在一起。

这里的`vocab`大小是`n_vocab + n_special + n_ctx`，也就是说token和position共享同一个 embedding 表，只是id不重叠。这种做法在概念上清晰但实现上有些 tricky（或者说十分混乱不可读，一开始以为代码是错的。。），后来的实现都改成了两个独立的embedding层。

### 3.4 注意力掩码

原始Transformer的Decoder用因果掩码来防止看到未来的token。GPT-1也一样，但因为只有Decoder，所以这个掩码就是模型**唯一的注意力约束。**没有encoder侧的padding mask，没有cross-attention mask。

```python
class Attention(nn.Module):
    def __init__(self, nx, n_ctx, cfg, scale=False):
        super(Attention, self).__init__()
        # 预计算下三角掩码
        self.register_buffer('b', torch.tril(torch.ones(n_ctx, n_ctx)).view(1, 1, n_ctx, n_ctx))
        self.n_head = cfg.n_head
        self.split_size = nx  # n_state = 768
        self.scale = scale
        self.c_attn = Conv1D(nx * 3, 1, nx)   # Q, K, V 一次性投影
        self.c_proj = Conv1D(nx, 1, nx)        # 输出投影
        self.attn_dropout = nn.Dropout(cfg.attn_pdrop)
        self.resid_dropout = nn.Dropout(cfg.resid_pdrop)

    def _attn(self, q, k, v):
        w = torch.matmul(q, k)
        if self.scale:
            w = w / math.sqrt(v.size(-1))
        b = self.b[:, :, :w.size(-2), :w.size(-1)]
        w = w * b + -1e9 * (1 - b)  # 掩码：未来位置设为近似-inf
        w = nn.Softmax(dim=-1)(w)
        w = self.attn_dropout(w)
        return torch.matmul(w, v)
```

`torch.tril`生成下三角矩阵，这和我在手搓Transformer里实现的`make_causal_mask`本质相同。掩码位置填充 $-10^9$,近似 $-\infty$，softmax 之后这些位置的权重趋近于0。

另外注意`c_attn = Conv1D(nx * 3, 1, nx)`这行，GPT-1将 Q、K、V 三个投影矩阵合并为一次计算，输出维度是`nx * 3 = 2304`，然后通过`split`拆分为三个 768 维的向量。这比分别写三个Linear层更高效。

> 又是一个工程实现上的小细节。显然，这些小trick在单纯的阅读论文是无法察觉到的，后续我也会逐步通过工程化学习论文的方式来读论文，增强工程能力。实际上，之前自己在做非AI领域的一些研究学习时，不断调试代码和整理并分析数据，也会有一些idea涌现。这是“仅看论文”无法得到的感受。

### 3.5 Self-Attention理解

在看过代码之后，值得退后一步，从直觉上理解self-attention到底在做什么。

**核心思想**：序列中的每个token都在询问其他token：“你对理解我有多大帮助？”然后根据答案，从有帮助的token那里借用信息来更新自己的表示。

具体来说，Query向量代表“我在找什么信息”，Key向量代表“我能提供什么信息”，Value向量代表“我实际携带的信息”。Q和K的点积越大，说明两个token之间的匹配度越高，Value的权重就越大。

举个例子，对于句子 `"The cat sat on the mat because it was tired"`：

- 当模型处理`"it"`这个token时，self-attention机制会计算`"it"`与所有前面 token 的注意力分数
- 理想情况下，`"cat"`会获得较高的注意力权重，因为`"it"`指代的是`"cat"`
- 这样`"it"`的表示就会融入`"cat` 的语义信息，帮助模型理解指代关系

**为什么 self-attention比LSTM更适合长程依赖？** LSTM中，信息必须沿序列逐步传递，经过100个token后信号会严重衰减。而self-attention中，任何两个token之间的信息传递都是一步到位的，不管距离多远，注意力分数的计算复杂度都是 $O(1)$。这也是**GPT-1的消融实验中Transformer全面优于 LSTM 的根本原因**。

**多头注意力的意义**：单个注意力头只能学到一种关注模式。**12个头**可以同时关注不同类型的关系，有的头可能关注语法依赖（主语-谓语），有的关注语义关联（同义词），有的关注位置邻近性。每个头在 $d_k = 64$ 维的子空间里独立计算注意力，最后拼接成**768维**的输出。

### 3.6 激活函数

原始Transformer的FFN使用ReLU激活：

$$
\text{FFN}(x) = \max(0, xW_1 + b_1)W_2 + b_2
$$

GPT-1改用GELU（Gaussian Error Linear Unit）：

标准公式

$$
\mathrm{GELU}(x) = x \cdot \mathrm{CDF}(x) = x \cdot \frac{1}{2} \left(1 + \mathrm{erf}\left(\frac{x}{\sqrt{2}}\right)\right)
$$

$\Phi(x) = \int_{-\infty}^{x} \frac{1}{\sqrt{2\pi}} e^{-\frac{t^2}{2}} \, dt$ 是标准正态分布的累积分布函数（CDF）， $\[ \mathrm{erf}(x) = \frac{2}{\sqrt{\pi}} \int_{0}^{x} e^{-t^2} \, dt \]$ 是误差函数。其中有

$$
\[ \Phi(x) = \frac{1}{2}\left(1 + \mathrm{erf}\left(\frac{x}{\sqrt{2}}\right)\right) \]
$$

一般代码实现使用

$$
\text{GELU}(x) = x \cdot \Phi(x) \approx 0.5x\left(1 + \tanh\left[\sqrt{\frac{2}{\pi}}\left(x + 0.044715x^3\right)\right]\right)
$$

输入x被概率 $Φ(x)$ 加权。 $x$ 很大 ，则 $Φ(x) ≈ 1$ ，保留 $x$ 。 $x$ 很小，则 $Φ(x) ≈ 0$ ，抑制 $x$ 。 $x ≈ 0$ 用以平滑过渡。GELU比ReLU更柔和，本质上是导函数变化更缓。

代码实现：

```python
def gelu(x):
    return 0.5 * x * (1 + torch.tanh(math.sqrt(2 / math.pi) * (x + 0.044715 * torch.pow(x, 3))))
```

![image](https://pica.zhimg.com/v2-cb65291f8878d30e8cdddfaad05a79bc_r.jpg "GELU和ReLU的原函数图像对比")

![image](https://picx.zhimg.com/v2-d869947b658c7c11e2741760259c085d_r.jpg "GELU和ReLU的导函数图像对比")

GELU可以理解为ReLU和Dropout的融合。ReLU根据输入的**符号**（正/负）决定是否保留神经元（硬门控），而 GELU根据输入的**百分位数**来加权（软门控），也就是输入越小，被抑制的概率越大，但不是完全截断为0。这让梯度在负值区域也能流动，缓解了ReLU的死神经元问题。

GELU在零附近有一个平滑的过渡区域，不像ReLU在 $x=0$ 处有硬拐点。这个特性**让优化过程更平稳**。GELU后来被BERT、GPT-2⁄3等模型广泛采用，成了Transformer类模型的标配激活函数。

### 3.7 Conv1D 替代 Linear

代码中使用了`Conv1D`而不是`nn.Linear`：

```python
class Conv1D(nn.Module):
    def __init__(self, nf, rf, nx):
        super(Conv1D, self).__init__()
        self.rf = rf
        self.nf = nf
        if rf == 1:  # 1x1 卷积，等价于线性变换
            w = torch.empty(nx, nf)
            nn.init.normal_(w, std=0.02)
            self.w = Parameter(w)
            self.b = Parameter(torch.zeros(nf))

    def forward(self, x):
        if self.rf == 1:
            size_out = x.size()[:-1] + (self.nf,)
            x = torch.addmm(self.b, x.view(-1, x.size(-1)), self.w)
            x = x.view(*size_out)
        return x
```

当`rf=1`时，这就是一个标准的线性变换 $y = xW + b$，和`nn.Linear`数学上完全等价。区别仅在于权重矩阵的shape是`(nx, nf)`而不是`nn.Linear`默认的`(nf, nx)`，即不需要转置。这是为了和 OpenAI 原始 TensorFlow 实现的权重格式兼容，方便加载预训练权重。

> 但似乎估计没必要怎么做，增加了理解的负担。一开始还以为这里有什么小巧思。。

## 四、训练框架

### 4.1 阶段一：无监督预训练

给定语料 $\mathcal{U} = \{u_1, \dots, u_n\}$，最大化语言模型的对数似然：

$$
L_1(\mathcal{U}) = \sum_i \log P(u_i \mid u_{i-k}, \dots, u_{i-1}; \Theta)
$$

其中 $k$ 是上下文窗口大小（512）。这就是标准的**自回归语言模型**——给定前 $k$ 个 token，预测下一个token。

取符号再平均得到 $loss$ 函数：

$$
\[ \mathcal{L} = -\frac{1}{N} \sum_{i=1}^{N} \log P(x_i \mid x_{<i}) \]
$$

条件概率 $P$ 通过以下方式建模：

$$
h_0 = UW_e + W_p
$$

$$
h_l = \text{transformer block}(h_{l-1}), \quad \forall l \in [1, n]
$$

$$
P(u) = \text{softmax}(h_n W_e^T)
$$

注意最后一步 $\text{softmax}(h_n W_e^T)$，**输出层和embedding层共享权重**，这对应代码中的`LMHead`。

**预训练数据**：[BooksCorpus](https://zhida.zhihu.com/search?content_id=273034530&content_type=Article&match_order=1&q=BooksCorpus&zhida_source=entity)数据集，包含7000多本未出版书籍，覆盖探险、奇幻、言情等类型。选择这个数据集的关键原因是它包含**长篇连续文本**，**有助于模型学习长程依赖**。论文提到，1B Word Benchmark虽然规模类似，但在句子层面被打乱了，破坏了长程结构。最终模型在BooksCorpus上达到了**18.4**的token-level perplexity。

**预训练配置**：Adam 优化器，最大学习率2.5e-4，前2000步线性warmup，之后cosine衰减。Batch size64，序列长度512，训练100epoch。BPE分词，40000次合并。权重初始化 $\mathcal{N}(0, 0.02)$。

> $\[ \mathrm{Perplexity} = \exp\left(-\frac{1}{N} \sum_{i=1}^{N} \log P(x_i \mid x_{<i}) \right) \]$ ，用以描述模型在预测下一个token时的不确定程度

### 4.2 阶段二：有监督微调

给定标注数据集 $\mathcal{C}$，每个样本是 $(x_1, \dots, x_m, y)$。输入经过预训练模型后，取最后一层的输出 $h_l^m$，过一个线性层预测标签：

$$
P(y \mid x_1, \dots, x_m) = \text{softmax}(h_l^m W_y)
$$

微调的分类损失：

$$
L_2(\mathcal{C}) = \sum_{(x, y)} \log P(y \mid x_1, \dots, x_m)
$$

关键的是，微调时的**总损失**加上了**辅助语言模型损失**：

$$
L_3(\mathcal{C}) = L_2(\mathcal{C}) + \lambda \cdot L_1(\mathcal{C})
$$

其中 $\lambda = 0.5$。加上LM损失的好处有两个：(a) **防止微调时模型遗忘预训练学到的语言知识**（改善泛化），(b) **加速收敛**。

代码中的`DoubleHeadModel`就是这个双头架构的实现：

```python
class DoubleHeadModel(nn.Module):
    def __init__(self, cfg, clf_token, task_head_type, vocab=40990, n_ctx=512):
        super(DoubleHeadModel, self).__init__()
        self.transformer = TransformerModel(cfg, vocab=vocab, n_ctx=n_ctx)
        self.lm_head = LMHead(self.transformer, cfg)       # 语言模型头
        if task_head_type == 'multiple_choice':
            self.task_head = MultipleChoiceHead(clf_token, cfg)
        elif task_head_type == 'similarity':
            self.task_head = SimilarityHead(clf_token, cfg)
        elif task_head_type == 'inference':
            self.task_head = ClfHead(clf_token, cfg, 3) 
        ...

    def forward(self, x):
        h = self.transformer(x)
        lm_logits = self.lm_head(h)       # 语言模型头的输出
        task_logits = self.task_head(h, x) # 任务头的输出
        return lm_logits, task_logits
```

训练循环中同时计算两个头的 loss：

```python
# train.py 中 run_epoch 函数
lm_logits, clf_logits = dh_model(XMB)
compute_loss_fct(XMB, YMB, MMB, clf_logits, lm_logits)  # lm_coef=0.5
```

### 4.3 LMHead的权重绑定

语言模型头的一个巧妙设计是**权重绑定,解码时的线性层权重直接复用token embedding矩阵**。

```python
class LMHead(nn.Module):
    def __init__(self, model, cfg, trunc_and_reshape=True):
        super(LMHead, self).__init__()
        self.n_embd = cfg.n_embd
        embed_shape = model.embed.weight.shape
        self.decoder = nn.Linear(embed_shape[1], embed_shape[0], bias=False)
        self.decoder.weight = model.embed.weight  # 权重绑定！

    def forward(self, h):
        h_trunc = h[:, :-1].contiguous().view(-1, self.n_embd)
        lm_logits = self.decoder(h_trunc)
        return lm_logits
```

注意`h[:, :-1]`,语言模型预测的是**下一个** token，所以第 $i$ 个位置的hidden state应该预测第 $i+1$ 个 token。最后一个位置没有对应的目标 token，因此需要截掉。

embedding层把**token映射到向量空间**，LM head把**向量空间映射回token概率分布**。这**两个映射本质上是互逆的操作，共享权重可以减少参数量，同时让两个方向的映射保持一致**。

### 4.4 微调的超参数

| 参数 | 值 |
| --- | --- |

**微调速度很快**，这正是预训练范式的优势之一。

## 五、任务适配

GPT-1最优雅的设计之一是**通过输入变换适配不同任务**，而不是改模型架构。所有任务都被转化为序列形式，喂给同一个Transformer。三个特殊token被引入：`⟨s⟩`（开始）、`$`（分隔符）、`⟨e⟩`（结束/分类位置）。

### 5.1 四种任务的输入格式

| 任务类型 | 输入格式 | 输出方式 |
| --- | --- | --- |

![image](https://pica.zhimg.com/v2-69886c90556c5bcb72dfdaec26a3e2fc_r.jpg "四种变换的示意图")

### 5.2 ROCStories任务的代码实现

以ROCStories（常识推理/故事补全）为例，这是一个二选一任务：给定一段故事（`x1`），判断哪个结尾（`x2` 或 `x3`）是正确的。

```python
def transform_roc(X1, X2, X3):
    n_batch = len(X1)
    xmb = np.zeros((n_batch, 2, n_ctx, 2), dtype=np.int32)  # 2个候选答案
    mmb = np.zeros((n_batch, 2, n_ctx), dtype=np.float32)    # mask
    start = encoder['_start_']
    delimiter = encoder['_delimiter_']
    for i, (x1, x2, x3) in enumerate(zip(X1, X2, X3)):
        x12 = [start] + x1[:max_len] + [delimiter] + x2[:max_len] + [clf_token]
        x13 = [start] + x1[:max_len] + [delimiter] + x3[:max_len] + [clf_token]
        l12 = len(x12)
        l13 = len(x13)
        xmb[i, 0, :l12, 0] = x12   # 候选答案1的 token ids
        xmb[i, 1, :l13, 0] = x13   # 候选答案2的 token ids
        mmb[i, 0, :l12] = 1         # 有效位置 mask
        mmb[i, 1, :l13] = 1
    # Position ids：从 n_vocab + n_special 开始
    xmb[:, :, :, 1] = np.arange(n_vocab + n_special, n_vocab + n_special + n_ctx)
    return xmb, mmb
```

`xmb`的 shape是`(batch, 2, n_ctx, 2)`：第二维的`2`对应两个候选答案，最后一维的`2`分别放token id和 position id。`mmb`是mask，标记哪些位置是有效token。

`MultipleChoiceHead`的工作方式是在`clf_token`对应位置提取hidden state，再过线性层：

```python
class MultipleChoiceHead(nn.Module):
    def forward(self, h, x):
        clf_h = h.view(-1, self.n_embd)
        flat = x[..., 0].contiguous().view(-1)
        clf_h = clf_h[flat == self.clf_token, :]  # 只取 clf_token 位置
        clf_h = clf_h.view(-1, x.size(1), self.n_embd, 1)
        clf_h = self.dropout(clf_h.transpose(1, 2)).transpose(1, 2)
        clf_h = clf_h.contiguous().view(-1, self.n_embd)
        clf_logits = self.linear(clf_h)
        return clf_logits.view(-1, x.size(1))  # (batch, n_choices)
```

## 六、GPT推理过程

前面的内容都在讨论GPT如何**训练**。但一个同样重要的问题是训练好的GPT模型是如何**生成文本**的？

### 6.1 自回归生成循环

GPT的文本生成是一个**自回归**过程，每次只预测一个 token，然后把它追加到输入末尾，再预测下一个。伪代码如下：

```python
def generate(model, prompt_tokens, max_new_tokens):
    tokens = prompt_tokens                          # shape: (1, T)
    for _ in range(max_new_tokens):
        # 1. 截断到上下文窗口长度
        input_tokens = tokens[:, -512:]             # shape: (1, min(T, 512))
        # 2. 前向传播，得到所有位置的 logits
        logits = model(input_tokens)                # shape: (1, T, V)
        # 3. 只取最后一个位置的 logits
        next_token_logits = logits[:, -1, :]        # shape: (1, V)
        # 4. 选择下一个 token
        next_token = torch.argmax(next_token_logits, dim=-1, keepdim=True)  # (1, 1)
        # 5. 追加到序列末尾
        tokens = torch.cat([tokens, next_token], dim=1)
    return tokens
```

**为什么只用最后一个位置的logits？** 由于因果掩码的存在，位置 $i$ 的输出只能看到位置 $0$ 到 $i$ 的信息。所以最后一个位置的hidden state是唯一一个融合了**全部**已知上下文的位置，只有它的预测才是基于完整输入的。前面位置的logits虽然也在计算，但它们各自只看到了部分上下文，在生成时并不使用。但在训练时，所有位置的logits 都参与 loss 计算，这正是自回归训练的高效之处，**一次前向传播可以同时产生** $T$ **个训练信号**。

![image](https://pic2.zhimg.com/v2-6b49f981545ece4a839959766ec87ed7_r.jpg "图源：Towards Data Science。GPT生成句子的自回归过程")

### 6.2 解码策略

上面的伪代码用了最简单的**贪心解码，**每步选概率最高的token。实际使用中，还有几种常见策略：

**Temperature 缩放**：在softmax之前对logits除以温度参数 $\tau$：

$$
P(w_i) = \text{softmax}(z_i / \tau)
$$

$\tau < 1$ 使分布更尖锐，更确定性；$\tau > 1$ 使分布更平坦，更随机，有创意。$\tau = 1$ 等价于标准softmax。

**Top-k 采样**：只保留概率最高的 $k$ 个 token，其余设为0后重新归一化，再采样。避免选到概率极低的噪声token。

**Top-p采样**：保留累计概率达到 $p$（如 0.9）的最小token集合，其余设为0。相比Top-k，这种方法能根据分布的形状动态调整候选集大小。当模型很确定时候选集小，不确定时候选集大。

GPT-1 论文没有深入讨论解码策略，但这些技术在后来的 GPT-2 ⁄ 3 中变得至关重要，也是在使用ChatGPT时通过temperature参数间接控制的东西。

## 七、实验结果

### 7.1 自然语言推理

论文Table 2的结果（所有数据集使用准确率评估）：

| 方法 | MNLI-m | MNLI-mm | SNLI | SciTail | QNLI | RTE |
| --- | --- | --- | --- | --- | --- | --- |

GPT-1在 5 个NLI数据集中的4 上取得了 SOTA：MNLI 上提升 1.5%，SciTail 上提升 5%，QNLI 上提升 5.8%，SNLI 上提升 0.6%。值得注意的是，GPT-1甚至超过了很多**ensemble**模型。

唯一表现不佳的是RTE，论文解释这可能是因为RTE只有 2490 个训练样本，数据量太少。论文推测如果引入多任务学习，RTE 的表现可能也会提升。

### 7.2 问答与常识推理

论文 Table 3 的结果：

| 方法 | Story Cloze | RACE-m | RACE-h | RACE |
| --- | --- | --- | --- | --- |

Story Cloze Test 提升了 **8.9%**，RACE 整体提升 **5.7%**。这两个任务都需要**长程上下文理解能力**。RACE数据集来自中学英语考试，包含大量推理类问题，充分体现了Transformer相比LSTM在捕获长程依赖上的优势。

### 7.3 语义相似度与分类

论文 Table 4 的结果（GLUE benchmark，mc=Matthews 相关系数，acc=准确率，pc=Pearson 相关系数）：

| 方法 | CoLA (mc) | SST-2 (acc) | MRPC (F1) | STS-B (pc) | QQP (F1) | GLUE |
| --- | --- | --- | --- | --- | --- | --- |

- **CoLA**（语言可接受性判断）：从 35.0 跃升到 **45.4**，提升幅度巨大（+10.4），说明预训练让模型学到了深层的语法知识。
- **STS-B**（语义文本相似度）：从 72.8 提升到 **82.0**（+9.2），Pearson相关系数的巨大提升。
- **QQP**（Quora 问题对）：比single-task baseline提升 **4.2%**。
- **GLUE 总分**：**72.8** vs 之前最好的 68.9（+3.9），在 12 个评估数据集中的**9个**取得 SOTA。

论文特别指出，GPT-1在不同规模的数据集上都表现良好：从小数据集 STS-B（约 5.7k 训练样本）到大数据集 SNLI（约 550k 训练样本）。

### 7.4 零样本能力初现

![image](https://pic2.zhimg.com/v2-1c99eebf0461257c0eadb5427af17bc3_r.jpg)

零样本表现随预训练步数的变化

四个任务的表现都随预训练深入而稳步提升，且Transformer比LSTM 差更小、更稳定。这一发现暗示了GPT-2⁄3 后来发展的方向——**用更大的模型和更多数据来增强零样本能力**。

零样本评估的具体做法不需要任何额外训练：

- **CoLA**：计算每个句子的平均token对数概率，通过阈值判断语法可接受性。
- **SST-2**：在句子末尾追加 “very” token，然后只看模型给 “positive” 和 “negative” 哪个更高的概率。
- **RACE**：选择模型给候选答案分配最高平均对数概率的选项。
- **Winograd**：将代词替换为两个可能的指代对象，选择模型赋予更高概率的那个。

这些启发式方法虽然不够优雅，但已经能在不做任何微调的情况下展现出一定的任务理解能力。这为GPT-2⁄3的 zero-shot / few-shot learning 奠定了基础。

## 八、消融实验

论文Table 5做了三组消融实验：

| 配置 | 平均分 | CoLA | SST-2 | MRPC | STS-B | QQP | MNLI | QNLI | RTE |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

**结论一：预训练是绝对核心**。去掉预训练后平均分从 74.7 暴跌到 59.9（**-14.8%**）。STS-B 从 82.0 跌到 30.9。这说明**在小数据集上，没有预训练的Transformer完全无法有效学习。**

**结论二：辅助LM loss的作用因数据集大小而异**。去掉后平均分反而略升（74.7→75.0），但在大数据集NLI（MNLI 81.8→81.1）和 QQP（70.3→69.8）上有帮助。小数据集上可能引入噪声。论文总结**数据集越大，辅助 LM loss越有帮助**。

**结论三：Transformer明显优于LSTM**。LSTM 替换后平均分下降 5.6（74.7→69.1），仅在 MRPC 一个数据集上胜出（MRPC 只有约 3600 个训练样本）。这验证了T**ransformer的自注意力机制比 LSTM 的循环记忆更适合捕获长程依赖和迁移学习**。论文还发现**LSTM在零样本实验中方差更大，说明Transformer的归纳偏置更有利于迁移。**

### 8.1迁移层数的影响

![image](https://pica.zhimg.com/v2-e4f44e8c48601a4569f873419a37179a_r.jpg)

逐层迁移预训练权重的效果

横轴是迁移的层数（0 到 12），纵轴是RACE和MultiNLI的准确率。结果显示，每增加一层迁移都会带来进一步的性能提升，12 层全部迁移时效果最好（MultiNLI 上提升高达 9%）。

这个实验说明预训练模型的**每一层**都编码了对下游任务有用的语言知识。底层可能是词法/语法信息，高层可能是语义/推理信息。

> 迁移层数是从预训练模型中继承的Transformer层数。Dev代表验证集表现，代表泛化能力。Train代表训练集表现，模型拟合能力。

## 九、模型超参数

| 参数 | 原始 Transformer (base) | GPT-1 |
| --- | --- | --- |

## 十、GPT-1后续演进

### 10.1 GPT-1 → GPT-2

由于后续我会手搓GPT-2的完整实现，这里提前梳理GPT-1到GPT-2的主要改进方向。

| 维度 | GPT-1 | GPT-2 |
| --- | --- | --- |

可以看到，GPT-2的核心不在于改进模型架构，而是把GPT-1的思路继续推进。也就是**更大、更多数据、更少人为干预**。**Pre-LN**是最重要的架构改动，也是目前几乎所有主流大模型都在使用的方案。

### 10.2 从GPT-1到现代大模型

GPT-1 开创的decoder-only与预训练范式，经过数次迭代，成为了今天大模型的基本范式。这条演进路线值得梳理：

**GPT-2（2019）**：核心主张是“不需要微调”。通过将模型扩大到1.5B参数、训练数据扩大到40GB WebText，**GPT-2展示了 zero-shot能力的涌现**。架构上最重要的改动是**Pre-LN**，这极大**改善了深层网络的训练稳定性**。这也是我后续手搓的目标。

**GPT-3（2020）**：175B参数，将scaling law推到了新的高度。核心发现是**in-context learning，上下文学习。**不需要更新任何参数，只要在prompt中给几个示例（few-shot），模型就能学会新任务。这揭示了**大模型中涌现能力（emergent abilities）的存在**，也让prompt engineering成为一门新技术。

> 包括最近的很火的skills，我个人觉得就是一种 few-shot。

**ChatGPT / InstructGPT（2022）**：架构上仍然是GPT-3.5，但训练方式发生了根本变化。引入了**指令微调（Instruction Tuning）**让**模型学会遵循人类指令**，以及 **RLHF（Reinforcement Learning from Human Feedback）**让模**型的输出对齐人类偏好**。这是“预训练→微调”范式的又一次演进，实现了新范式“预训练→指令微调→对齐”。

**现代LLM的架构改进**：虽然核心仍是decoder-only Transformer，但细节上有很多演进：

- **RoPE（Rotary Position Embedding）**：LLaMA等模型用**旋转位置编码**替代了可学习位置嵌入，通过在注意力计算中对 Q、K 向量施加旋转变换来编码相对位置信息，天然**支持长度外推**。
- **RMSNorm**：用更简单的Root Mean Square Normalization替代LayerNorm，去掉了均值中心化和偏置项，**计算更快**，效果相当。
- **GQA（Grouped Query Attention）**：介于MHA和MQA之间的折中方案，多个Query head共享一组 Key/Value，显著**降低KV cache的显存占用**。
- **SwiGLU 激活**：用 $\text{SwiGLU}(x) = x_1 \cdot \text{Swish}(x_2)$ 替代GELU，在FFN中引入门控机制，PaLM和LLaMA系列均采用。其中 $x_1=W_ax,x_2=W_bx$ , $SwiGLU(x)=(W_ax)⋅Swish(W_bx)=(W_ax)\cdot(W_bx)\cdot\sigma(W_bx)$ 。
- **FlashAttention**：不改变注意力的数学计算，而是通过算法设计，主要是tiling和在线 softmax，将注意力计算的**显存**从 $O(T^2)$ 降到 $O(T)$，同时提速2-4倍。这是一个纯工程优化，但对训练长上下文模型至关重要。

> SwiGLu的优点有：1. 显式门控，可以学习“哪些特征该被抑制/放大”，类似注意力机制 $Attention=value×softmax(score)$ ， $output=value×gate$ ，实现动态信息，更强的表达力；2. 普通FFN， $FFN(x)=W_2⋅GELU(W_1x)$ ,而SwiGLU FFN， $FFN(x)=W_2⋅(W_ax⋅Swish(W_bx))$ ,这多了两个投影 $W_a, W_b$ ，以及乘法交互，表达能力显著增强；3. 此外 $Swish(x)=x⋅σ(x)$ ，梯度更稳定，深层网络更好训练。

现代LLM的架构与GPT-1是十分地相似，变化的主要是规模、训练数据和对齐方法。后续会手搓GPT-2，然后利用本地的4070结合Qwen做小模型的一些下游任务学习。
