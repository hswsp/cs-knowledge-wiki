# 手搓 Transformer（四）：LayerNorm层

## **前言**

在前面的文章中，我们已经实现了Embedding层和Multi-Head Attention层。但还有一个看起来简单，实际上非常关键的模块——LayerNorm模块还未实现。在这篇文章中，我们会比较[BatchNorm](https://zhida.zhihu.com/search?content_id=272583990&content_type=Article&match_order=1&q=BatchNorm&zhida_source=entity)和LayerNorm的主要区别，分析[Transformer](https://zhida.zhihu.com/search?content_id=272583990&content_type=Article&match_order=1&q=Transformer&zhida_source=entity)为什么使用LayerNorm，以及手写实现一个LayerNorm。

LayerNorm层的参数有`d_model`和`eps`，后者是一个默认参数，一般设置为`1e-5`。输入是一个形状为 $(B,L,D)$ 的张量，输出是一个形状为 $(B,L,D)$ 的张量。由于LayerNorm的数据流比较简单，主要涉及到的是计算，所以本部分不再对LayerNorm的数据流进行专门分析。

## 为什么需要 Normalization？

在深度网络中，随着层数加深，会出现梯度爆炸或者梯度消失，分布漂移（[Internal Covariate Shift](https://zhida.zhihu.com/search?content_id=272583990&content_type=Article&match_order=1&q=Internal+Covariate+Shift&zhida_source=entity)）。使用Normalization会让每一层的输入分布更稳定，方便训练。常见的归一化方法(Normalization)主要有Batch Normalization和Layer Normalization两种。

> **分布漂移**是指数据的统计分布发生了变化。在Transformer架构中主要体现为网络中间层的输入分布在不断变化。比如某一层的输入`mean=0`,`var=1`；训练几步后，`mean=10`,`var=20`， 这会使得下一层的训练会很困难。每一层都要适应新分布，之前学的是标准分布，现在变成了偏移分布。

### Batch Layer(BN)

对**batch维度**做归一化

$$
\mu = \frac{1}{B}\Sigma_{i=1}^{B}x_i \\ \sigma^{2} = \frac{1}{B}\Sigma_{i=1}^{B} (x_i-\mu)^2
$$

同一个 feature，在不同样本之间做归一化。

> BN一般适合CV领域的任务，因为CV数据形状一般为 $(B, C, H, W)$ 。BatchNorm 会在**batch和空间维度 (H, W)** 上统计，同一通道的统计稳定，大 batch 下效果很好，加速收敛。比如ResNet,VGG,[EfficientNet](https://zhida.zhihu.com/search?content_id=272583990&content_type=Article&match_order=1&q=EfficientNet&zhida_source=entity).

### LayerNorm（LN）

对 **feature 维度（embedding 维）**做归一化：

$$
\mu = \frac{1}{D}\Sigma_{j=1}^{B}x_j \\ \sigma^{2} = \frac{1}{D}\Sigma_{j=1}^{B} (x_j-\mu)^2
$$

同一个 token 内部做归一化。

> LN一般适合NLP领域的任务，因为NLP数据形状一般为 $(B, L, D)$ 。在`D`(embedding层）做归一化，不依赖 batch size，每个 token 独立，适合变长序列，推理和训练一致。 比如Transformer/[BERT](https://zhida.zhihu.com/search?content_id=272583990&content_type=Article&match_order=1&q=BERT&zhida_source=entity)/GPT.

### 为什么 Transformer 用 LayerNorm？

BatchNorm的存在以下问题：

- 依赖 batch size,小batch不稳定。
- NLP 中序列长度不同，不适合BN 。
- 推理阶段要用滑动均值running mean，比较复杂，会使得推理时延增加。

相比之下，LN不依赖于batch，每个token独立，非常适合NLP和Transformer。

## LayerNorm的数学形式

LN标准公式:

$$
LayerNorm(x) = \gamma \cdot \frac{x-\mu}{\sqrt{\sigma^2+\epsilon}} + \beta
$$

其中， $\gamma,\beta$ 是可学习参数，前者是缩放因子，后者是平移因子。纯标准化会**限制表达能力**。增加可学习参数后，模型可以恢复最优分布。 $\mu$ 表示均值， $\sigma^2$ 是有偏方差，也成为全局方差。 $\epsilon$ 是极小常数，防止方差为0时除以0发生错误，一般设置为 $10^{-5}$ 。

> 在数理统计中，求一个样本 $x$ 的方差使用的公式是 $var(x) = \frac{1}{N}\Sigma_{i=1}^{N}(x_i-\mu)^2$ ,当使用该样本估计整体方差时，需要使用到方差的无偏估计量 $var(x)=\frac{1}{N-1}\Sigma_{i=1}^{N}(x_i-\mu)^2$ .显然该处使用的是样本真实方差，也就是全局方差，不需要使用总体推断。

### 手写 LayerNorm

先展示代码：

```
# Module3: LayerNorm
class LayerNorm(nn.Module):
    def __init__(self, d_model: int, eps: float = 1e-5):
        super().__init__()
        self.eps = eps

        # Parameter
        self.gamma = nn.Parameter(torch.ones(d_model))
        self.beta = nn.Parameter(torch.zeros(d_model))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x : (B, L, D)
        mean = x.mean(dim=-1, keepdim=True) # (B, L, 1)
        var = x.var(dim=-1, unbiased=False, keepdim=True) # (B, L, 1)

        std = (x - mean) / torch.sqrt(var + self.eps)
        out = self.gamma * std + self.beta
        return out
```

注意到LayerNorm 是在`D`上做归一化，所以在求解均值和方差是应设置`dim=-1`。

值得一提的是，在Transformer原论文中，LayerNorm是放在最后执行的。也就是

$$
x \to Attention \to Add \to LayerNorm
$$

这种方式一般称为**Post-LN.** 但目前主流的模型中，一般使用**Pre-LN**

$$
x \to LayerNorm \to Attention \to Add
$$

这样设计训练会更加稳定。

### 测试代码

```
def main():
    layer_norm = LayerNorm(d_model=8, eps=1e-5)
    # x : (B, L, D)
    x = torch.rand(3, 10, 8)
    out = layer_norm(x)

    print(f"the shape of out is {out.shape}")
    print(f"out is {out}")
```
