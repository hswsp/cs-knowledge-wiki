# KV Cache 的基本原理

## 5.1.1 什么是KV Cache
KV Cache （Key-Value Cache）是大语言模型（LLM）推理过程中的核心优化技术。在Transformer架构的自注意力机制中，每次生成新 token时都需要计算当前 token与所有历史token的注意力分数。如果没有缓存机制，每次生成都需要重新计算所有历史token的Key和Value向量，这将导致计算复杂度随序列长度呈二次方增长。

KV Cache的核心思想是：在**自回归生成过程中，缓存之前计算的Key和Value向量，避免重复计算**。

![](https://images.spumn.eu.cc/ml/ai-infra/1781679689989-89498f46-921a-4d72-b847-9e2e599b6db5.svg)

## 5.1.2 为什么需要KV Cache
### 计算效率分析：
在没有KV Cache的情况下，生成第 $ T $个 token 时：

+ 需要计算 $ T $ 个token的 Query、Key 、 Value
+ 注意力计算复杂度为 $ O(T^2 \times d) $
+ 总计算量为 $ O(T^3 \times d) $（对于整个序列）

使用KV Cache后：

+ 只需计算1个新token的Query、Key、Value
+ 注意力计算复杂度为$ O(T \times d) $
+ 总计算量为 $ O(T^2 \times d) $

### 性能提升对比：
| 序列长度 | 无KV Cache (ms) | 有KV Cache (ms) | 加速比 |
| --- | --- | --- | --- |
| 512 | 125 | 15 | 8.3x |
| 1024 | 480 | 28 | 17.1x |
| 2048 | 1890 | 52 | 36.3x |
| 4096 | 7520 | 98 | 76.7x |


注：以上数据基于LLaMA-7B在A100 GPU上的推理测试

## 5.1.3 KV Cache 的计算公式
KV Cache 的内存占用可以通过以下公式精确计算：

$ \text{KV Cache Size} = 2 \times B \times L \times H \times K \times D $

其中：

+ 2： Key 和 Value 两个张量
+ **B (Batch Size)**：批处理大小
+ **L (Num Layers)**：Transformer层数
+ **H (Num Heads)**：注意力头数量
+ **K (Head Dimension)**：每个头的维度
+ **D (Data Type Size)**：数据类型占用的字节数

### 展开说明：
```latex
  对于单个token的KV Cache：
  
  ┌─────────────────────────────────────────────────────────────┐
  │                         单层单头的KV Cache                                 │
  ├─────────────────────────────────────────────────────────────┤
  │   Key:    [K_dim]   →   K_dim × D bytes                                   │
  │   Value: [K_dim]    →   K_dim × D bytes                                   │
  │                                                                           │
  │ 单层所有头: H × 2 × K_dim × D bytes                                       │
  │ 所有层:    L × H × 2 × K_dim × D bytes                                   │
  │ 整个序列:  T × L × H × 2 × K_dim × D bytes                               │
  │ 批处理:    B × T × L × H × 2 × K_dim × D bytes                           │
  └─────────────────────────────────────────────────────────────┘

```

简化公式（以GB为单位）：

$ \text{KV Cache (GB)} = \frac{2 \times B \times L \times H \times K \times D}{1024^3} $

### 常见数据类型的字节大小
| 数据类型 | 字节数 (D) | 说明 |
| :--- | :--- | :--- |
| FP32 | 4 | 单精度浮点 |
| FP16 | 2 | 半精度浮点 |
| BF16 | 2 | Brain浮点 |
| INT8 | 1 | 8位整数量化 |
| INT4 | 0.5 | 4位整数量化 |
| FP8 | 1 | 8位浮点量化 |


