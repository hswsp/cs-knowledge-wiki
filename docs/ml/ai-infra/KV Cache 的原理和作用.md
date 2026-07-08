# KV Cache 的原理和作用

KV Cache是LLM推理优化的核心技术，它避免了在Decode阶段重复计算历史token的Key和Value。

## 2.5.1 什么是KV Cache
在Transformer的Self-Attention中，每个token的计算需要所有前面token的Key和Value。KV Cache就是缓存这些中间结果。

### 直观理解
![](https://images.spumn.eu.cc/ml/ai-infra/1781594646074-ac6f4f7e-7cc1-4d7d-9292-9a8c92b5a4e4.svg)

### 数学原理
在Self-Attention中，第 $t$ 个token的输出：

$\text{Attention}(\mathbf{q}_t, \mathbf{K}_{\leq t}, \mathbf{V}_{\leq t}) =\text{softmax}\left(\frac{\mathbf{q}_t \mathbf{K}_{\leq t}^T}{\sqrt{d_k}}\right)\mathbf{V}_{\leq t}$

其中：

+ $\mathbf{q}_t$ 是当前 token 的 Query （需要实时计算）
+ $\mathbf{K}_{\leq t} =[\mathbf{K}_1, \mathbf{K}_2, ..., \mathbf{K}_t]$ 是所有前面token的Key
+ $\mathbf{V}_{\leq t}= [\mathbf{V}_1, \mathbf{V}_2, ..., \mathbf{V}_t]$ 是所有前面token的Value

KV Cache存储的就是 $\mathbf{K}_{\leq t}$ 和 $\mathbf{V}_{\leq t}$。

## 2.5.2 KV Cache 内存占用计算
KV Cache 的内存占用是推理系统设计的核心考量。

### 计算公式
对于单条请求：

$\text{KV Cache Size} = 2 \times \text{num\_layers} \times \text{num\_heads} \times d_{head} \times \text{seq\_len} \times \text{bytes\_per\_element}$

简化公式（假设 $d_{model} = \text{num_heads} \times d_{head}$）：

$\text{KV Cache Size} = 2 \times L \times h \times d_h \times s \times \text{prec} = 2\times L \times d_{model} \times s \times \text{prec}$

其中：

+ $L$: 层数
+ $h$: 注意力头数
+ $d_h$: 每个头的维度
+ $s$: 序列长度
+ prec: 精度字节数（FP16=2, FP32=4）

### 具体计算示例
LLaMA-2 7B模型（ FP16）：

+ 层数 $L = 32$
+ 隐藏维度 $d_{model} = 4096$
+ 序列长度$s = 4096$
+ 精度 = FP16 (2 bytes)

$\text{KV Cache} = 2 \times 32 \times 4096 \times 4096 \times 2 = 2,147,483,648 \text{bytes} = 2 \text{ GB}$

### 不同模型的KV Cache占用：
| 模型 | 参数量 | 层数 | 隐藏维度 | 4K序列 | 8K序列 | 32K序列 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| LLaMA-2 | 7B | 32 | 4096 | 2.0 GB | 4.0 GB | 16.0 GB |
| LLaMA-2 | 13B | 40 | 5120 | 3.1 GB | 6.3 GB | 25.0 GB |
| LLaMA-2 | 70B | 80 | 8192 | 10.0 GB | 20.0 GB | 80.0 GB |
| GPT-4 | ~1.8T | 120 | 18432 | 162 GB | 324 GB | 1.3 TB |


### 批处理的KV Cache
对于batch size为 $b$ 的情况：

$\text{Total KV Cache} = b \times 2 \times L \times d_{model} \times s \times\text{prec}$

示例：batch_size=32，LLaMA-2 7B，4K序列 $32 \times 2 \text{ GB} = 64 \text{ GB}$

这已经接近A100的80GB显存上限！

## 2.5.3 为什么需要KV Cache
### 性能对比
| 场景 | 无KV Cache | 有KV Cache | 加速比 |
| :--- | :--- | :--- | :--- |
| 7B模型, 512 tokens | 5.2s | 0.8s | 6.5× |
| 7B模型, 1024 tokens | 21.0s | 1.6s | 13× |
| 7B模型, 2048 tokens | 84.0s | 3.2s | 26× |


### 内存vs计算的权衡
![](https://images.spumn.eu.cc/ml/ai-infra/1781595461058-3331077a-c6c4-4cd1-80ac-82a0032fafca.svg)

## 2.5.4 KV Cache 管理策略
分页KV Cache（vLLM风格）

![](https://images.spumn.eu.cc/ml/ai-infra/1781595324171-1ac83ec3-9496-40a2-b29f-8afd10deaaaa.svg)

### KV Cache 量化
通过量化降低KV Cache内存占用：

| 精度 | 内存占用 | 精度损失 | 适用场景 |
| :--- | :--- | :--- | :--- |
| FP16 | 100% | 基准 | 默认 |
| FP8 | 50% | <1% | H100支持 |
| INT8 | 50% | 1-2% | 通用 |
| INT4 | 25% | 3-5% | 长序列场景 |


