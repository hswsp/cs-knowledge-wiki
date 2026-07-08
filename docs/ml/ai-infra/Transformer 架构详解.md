# Transformer 架构详解

Transformer架构由 Vaswani等人在 2017年的论文《 Attention Is All You Need》中首次提出，它彻底改变了自然语言处理领域，成为现代大语言模型的基石。

## 2.1.1 整体架构概览
Transformer采用编码器-解码器（Encoder-Decoder）结构，但现代LLM（如GPT系列）主要使用仅解码器（Decoder-only）架构。

```latex
   ┌─────────────────────────────────────────────────────────────┐
  │                       Transformer Block                       │
  ├─────────────────────────────────────────────────────────────┤
  │     Input Embeddings + Positional Encoding                    │
  │                              ↓                                │
  │     ┌─────────────────────────────────────────────────────┐   │
  │     │   Multi-Head Self-Attention (Masked for Decoder)   │    │
  │     │   + Residual Connection + Layer Normalization      │    │
  │     └─────────────────────────────────────────────────────┘   │
  │                              ↓                                │
  │     ┌─────────────────────────────────────────────────────┐   │
  │     │   Position-wise Feed-Forward Network               │    │
  │     │   + Residual Connection + Layer Normalization      │    │
  │     └─────────────────────────────────────────────────────┘   │
  │                              ↓                                │
  │     Output (to next layer or final projection)                │
  └─────────────────────────────────────────────────────────────┘



```

## 2.1.2 Self-Attention 机制数学原理
Self-Attention（自注意力）是Transformer的核心机制，它允许模型在处理序列时关注输入的不同部分。

### 核心思想
对于输入序列 $\mathbf{X} \in \mathbb{R}^{n \times d_{model}}$，Self-Attention通过三个可学习的投影矩阵将其映射为：

+ Query矩阵：$\mathbf{Q} = \mathbf{X}\mathbf{W}^Q$
+ Key矩阵：$\mathbf{K} = \mathbf{X}\mathbf{W}^K$
+ Value矩阵：$\mathbf{V} = \mathbf{X}\mathbf{W}^V$

其中 $\mathbf{W}^Q, \mathbf{W}^K, \mathbf{W}^V \in \mathbb{R}^{d_{model}} \times d_k$

### Scaled Dot-Product Attention
注意力计算的核心公式：

$\text{Attention}(\mathbf{Q}, \mathbf{K}, \mathbf{V}) =\text{softmax}\left(\frac{\mathbf{Q}\mathbf{K}^T}{\sqrt{d_k}}\right)\mathbf{V}$

### 为什么要除以 $\sqrt{d_k}$？
当 $d_k$ 较大时，点积的数值会变得很大，导致 softmax 函数的梯度变得非常小（饱和）。缩放因子 $\sqrt{d_k}$ 可以稳定梯度流：

$\text{Var}\left(\frac{\mathbf{q} \cdot \mathbf{k}}{\sqrt{d_k}}\right) = \frac{d_k \cdot\sigma^2}{d_k} = \sigma^2$

### 完整的Self-Attention计算流程
```python
def self_attention(X, W_Q, W_K, W_V, d_k):
        """
        X: 输入矩阵 [batch_size, seq_len, d_model]
        W_Q, W_K, W_V: 投影矩阵 [d_model, d_k]
        """
        # 1.   线性投影
        Q = X @ W_Q        # [batch_size, seq_len, d_k]
        K = X @ W_K        # [batch_size, seq_len, d_k]
        V = X @ W_V        # [batch_size, seq_len, d_k]

        # 2.   计算注意力分数
        scores = Q @ K.transpose(-2, -1)   # [batch_size, seq_len, seq_len]

        # 3.   缩放
        scores = scores / math.sqrt(d_k)

        # 4. Softmax   归一化
        attn_weights = softmax(scores, dim=-1)  # [batch_size, seq_len, seq_len

        # 5.   加权求和
        output = attn_weights @ V    # [batch_size, seq_len, d_k]

        return output, attn_weights
```

注：`@`是 矩阵乘法运算符（matrix multiplication operator）, 从 Python 3.5 开始引入（PEP 465），主要用于 NumPy、PyTorch、TensorFlow 等科学计算库中的二维数组/张量乘法。

```python
import numpy as np
A = np.array([[1, 2], [3, 4]])
B = np.array([[5, 6], [7, 8]])
C = A @ B   # 等价于 np.matmul(A, B)
print(C)    # [[19 22]
            #  [43 50]]
```

### Masked Self-Attention  （因果注意力）
在解码器中，为了防止模型在预测当前 token 时看到未来的信息，需要使用因果掩码（Causal Mask）：

$\text{MaskedAttention}(\mathbf{Q}, \mathbf{K}, \mathbf{V}) =\text{softmax}\left(\frac{\mathbf{Q}\mathbf{K}^T}{\sqrt{d_k}} +\mathbf{M}\right)\mathbf{V}$

其中掩码矩阵 $\mathbf{M}$ 定义为：

$M_{ij} = \begin{cases} 0 & \text{if } i \geq j \\ -\infty & \text{if } i < j \end{cases}$

```python
def create_causal_mask(seq_len):
       """ 创建下三角掩码矩阵"""
       mask = torch.triu(torch.ones(seq_len, seq_len), diagonal=1)
       mask = mask.masked_fill(mask == 1, float('-inf'))
       return mask


  #   掩码矩阵示例（seq_len=4）
  # [[     0, -inf, -inf, -inf],
  #    [   0,   0, -inf, -inf],
  #    [   0,   0,        0, -inf],
  #    [   0,   0,        0,     0]]

```

## 2.1.3 Multi-Head Attention
<font style="color:#ED740C;">单一的注意力机制可能只关注一种类型的关系</font>。Multi-Head Attention通过并行使用多组投影矩阵，<font style="color:#DF2A3F;">让模型同时关注不同子空间的信息</font>。

### 数学定义
$\text{MultiHead}(\mathbf{Q}, \mathbf{K}, \mathbf{V}) = \text{Concat}(\text{head}_1, ...,\text{head}_h)\mathbf{W}^O$

其中每个head的计算：

$\text{head}_i = \text{Attention}(\mathbf{X}\mathbf{W}_i^Q, \mathbf{X}\mathbf{W}_i^K,\mathbf{X}\mathbf{W}_i^V)$

### 维度设置
| 参数 | 典型值 | 说明 |
| :--- | :--- | :--- |
|$d_{model}$| 768/1024/2048/4096 | 模型隐藏层维度 |
|$h$| 12/16/32/64 | 注意力头数 |
|$d_k = d_v$| 64/128 | 每个头的维度，$d_k = d_{model} / h$|
|$\mathbf{W}^O$|$d_{model} \times d_{model}$| 输出投影矩阵 |


### 计算复杂度分析
Multi-Head Attention 的计算复杂度为：

$\mathcal{O}(n^2 \cdot d_{model})$

其中 $n$ 是序列长度。这是Self-Attention成为长序列处理瓶颈的主要原因。

```python
class MultiHeadAttention(nn.Module):
      def __init__(self, d_model, num_heads):
         super().__init__()
         assert d_model % num_heads == 0


         self.d_model = d_model
         self.num_heads = num_heads
         self.d_k = d_model // num_heads


         #   投影矩阵
         self.W_Q = nn.Linear(d_model, d_model)
         self.W_K = nn.Linear(d_model, d_model)
         self.W_V = nn.Linear(d_model, d_model)
         self.W_O = nn.Linear(d_model, d_model)


      def forward(self, X, mask=None):
         batch_size, seq_len, _ = X.shape


         #   线性投影并分头
         Q = self.W_Q(X).view(batch_size, seq_len, self.num_heads, self.d_k)
         K = self.W_K(X).view(batch_size, seq_len, self.num_heads, self.d_k)
         V = self.W_V(X).view(batch_size, seq_len, self.num_heads, self.d_k)
         # Q, K, V: [batch_size, num_heads, seq_len, d_k]


         #   计算注意力
         scores = Q @ K.transpose(-2, -1) / math.sqrt(self.d_k)
         if mask is not None:
              scores = scores + mask
         attn_weights = F.softmax(scores, dim=-1)


         #   应用注意力到Value
         attn_output = attn_weights @ V   # [batch_size, num_heads, seq_len,


         #   合并多头并投影
         attn_output = attn_output.transpose(1, 2).contiguous().view(
              batch_size, seq_len, self.d_model
         )
         output = self.W_O(attn_output)


         return output, attn_weights

```

## 2.1.4 Position-wise Feed-Forward Network (FFN)
FFN对每个位置独立地应用相同的全连接网络

$\text{FFN}(\mathbf{x}) = \max(0, \mathbf{x}\mathbf{W}_1 + \mathbf{b}_1)\mathbf{W}_2+ \mathbf{b}_2$

或使用GELU激活函数（现代LLM更常用）：

$\text{FFN}(\mathbf{x}) = \text{GELU}(\mathbf{x}\mathbf{W}_1 +\mathbf{b}_1)\mathbf{W}_2 + \mathbf{b}_2$

GELU 激活函数公式

+ 精确形式（基于误差函数 erf）

$\mathrm{GELU}(x) = x \cdot \frac{1}{2} \left[ 1 + \operatorname{erf}\!\left( \frac{x}{\sqrt{2}} \right) \right]$

+ Tanh 近似（PyTorch 默认实现）

$\mathrm{GELU}(x) \approx 0.5 \, x \left( 1 + \tanh\!\left( \sqrt{\frac{2}{\pi}} \, (x + 0.044715\, x^3) \right) \right)$

+ Sigmoid 近似（另一种常见形式）

$\mathrm{GELU}(x) = x \, \sigma\!\left( \sqrt{\frac{2}{\pi}} \, x + a x^3 \right), \quad a \approx 0.044715$

（其中 $\sigma(z) = \frac{1}{1+e^{-z}}$ 是 logistic sigmoid 函数，$\operatorname{erf}(x) = \frac{2}{\sqrt{\pi}} \int_{0}^{x} e^{-t^2} \, dt$是 **高斯曲线从 0 到 x 的“面积”的归一化度量**，乘以 ( $2/\sqrt{\pi}$ ) 使得极限值为 1）。



![](https://images.spumn.eu.cc/ml/ai-infra/1781584435464-192668c1-7a18-4de4-af33-8eade42cd153.png)

### 维度设置
+ 中间层维度：$d_{ff} = 4 \times d_{model}$（典型配置）
+ $\mathbf{W}_1: d_{model} \times d_{ff}$
+ $\mathbf{W}_2: d_{ff} \times d_{model}$

### FFN的计算量占比
在标准Transformer中，**FFN贡献了约 2/3 的总参数量和约50% 的计算量**。

```python
class FeedForward(nn.Module):
       def __init__(self, d_model, d_ff=None, dropout=0.1):
            super().__init__()
            if d_ff is None:
                 d_ff = 4 * d_model


            self.fc1 = nn.Linear(d_model, d_ff)
            self.fc2 = nn.Linear(d_ff, d_model)
            self.dropout = nn.Dropout(dropout)
            self.activation = nn.GELU()      #   现代LLM常用GELU
           
       def forward(self, x):
            x = self.fc1(x)
            x = self.activation(x)
            x = self.dropout(x)
            x = self.fc2(x)
            return x

```

## 2.1.5 Layer Normalization
Layer Normalization （层归一化）对每个样本的所有特征进行归一化，稳定训练过程

$\text{LayerNorm}(\mathbf{x}) = \gamma \odot \frac{\mathbf{x} - \mu}{\sqrt{\sigma^2 +\epsilon}} + \beta$

其中：

+ $\mu = \frac{1}{d}\sum_{i=1}^{d} x_i$ （ 均值 ）
+ $\sigma^2 = \frac{1}{d}\sum_{i=1}^{d}(x_i - \mu)^2$ （方差）
+ $\gamma, \beta$ 是可学习的缩放和平移参数 
+ $\epsilon$ 是数值稳定性的小常数（通常 $10^{-6}$）

### Pre-Norm vs Post-Norm
| 架构 | 公式 | 特点 |
| :--- | :--- | :--- |
| Post-Norm（原始 Transformer） |$\mathbf{x}_{out} = \text{LayerNorm}(\mathbf{x} + \text{Sublayer}(\mathbf{x}))$| 训练不稳定但性能上限高 |
| Pre-Norm（现代 LLM 常用） |$\mathbf{x}_{out} = \mathbf{x} + \text{Sublayer}(\text{LayerNorm}(\mathbf{x}))$| 训练更稳定，收敛更快 |


现代LLM（GPT、LLaMA等）<font style="color:#ED740C;">普遍采用Pre-Norm架构</font>。

## 2.1.6 Positional Encoding
由于Self-Attention本身不具备位置信息，需要通过Positional Encoding注入位置信息。

### 正弦/余弦位置编码（原始Transformer）
$PE_{(pos, 2i)} = \sin\left(\frac{pos}{10000^{2i/d_{model}}}\right)$

$PE_{(pos, 2i+1)} = \cos\left(\frac{pos}{10000^{2i/d_{model}}}\right)$

### 可学习位置编码
现代LLM（如GPT系列）通常使用可学习的位置嵌入：

```python
self.position_embedding = nn.Embedding(max_seq_len, d_model)
```

### RoPE（旋转位置编码）
LLaMA等模型使用RoPE（**<font style="color:#ED740C;">Rotary Position Embedding</font>**），通过旋转矩阵编码相对位置：

$\text{RoPE}(\mathbf{x}, m) = \mathbf{x} \cdot e^{i m \theta}$

RoPE 的优势：

+ 天然支持相对位置
+ 外推性能好（可处理比训练时更长的序列）
+ 与Self-Attention兼容性好

```python
class RotaryEmbedding(nn.Module):
        def __init__(self, dim, max_seq_len=2048, base=10000):
            super().__init__()
            inv_freq = 1.0 / (base ** (torch.arange(0, dim, 2).float() / dim))
            self.register_buffer("inv_freq", inv_freq)


        def forward(self, seq_len):
            t = torch.arange(seq_len, device=self.inv_freq.device)
            freqs = torch.einsum("i,j->ij", t, self.inv_freq)
            emb = torch.cat((freqs, freqs), dim=-1)
            return emb.cos(), emb.sin()
```

