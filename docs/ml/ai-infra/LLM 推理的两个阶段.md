# LLM 推理的两个阶段

LLM推理过程可以分为两个截然不同的阶段：Prefill阶段和Decode阶段。理解这两个阶段的特性对于推理优化至关重要。

## 2.4.1 Prefill 阶段（计算密集型）
Prefill 阶段处理输入prompt，计算所有token的KV Cache，为后续生成做准备。Prefill

### 工作流程
![](https://images.spumn.eu.cc/ml/ai-infra/1781593855680-6ab832bd-7221-443d-af53-600e32274a49.svg)

### 计算特性
| 特性 | 描述 |
| :--- | :--- |
| 计算模式 | <font style="color:#ED740C;">矩阵-矩阵</font>乘法 (GEMM) |
| 计算复杂度 | $ \mathcal{O}(n^2 \cdot d) $**<font style="color:#DF2A3F;">，其中 </font>**$ n $**<font style="color:#DF2A3F;"> 是序列长度</font>** |
| 内存访问 | 可预测、连续 |
| 瓶颈 | 计算能力 (Compute-bound) |
| GPU利用率 | 高 (>80%) |


### 性能指标
Prefill阶段的性能通常用 **Time-to-First-Token** (TTFT) 来衡量：

$ \text{TTFT} = \frac{\text{Prefill计算量}}{\text{GPU峰值算力} \times \text{利用率}} $

对于 7B 模型在 A100 上的典型数据：

+ 1K tokens prompt: ~50-100ms TTFT
+ 4K tokensprompt: ~200-400ms TTFT
+ 8K tokens prompt: ~500-1000ms TTFT

## 2.4.2 Decode 阶段（内存密集型）
Decode 阶段是自回归生成过程，每次只生成一个新token，直到遇到结束符或达到最大长度。

### 工作流程
![](https://images.spumn.eu.cc/ml/ai-infra/1781594083726-edfed53d-7442-480e-8747-f17c12c9249f.svg)

### 计算特性
| 特性 | 描述 |
| :--- | :--- |
| 计算模式 | 矩阵-向量乘法 (GEMV) |
| 计算复杂度 | $ \mathcal{O}(n \cdot d) $ 每步 |
| 内存访问 | 随机、分散 (访问KV Cache) |
| 瓶颈 | 内存带宽 (Memory-bound) |
| GPU利用率 | 低 (<30%) |


### 为什么Decode是内存瓶颈？
```latex
计算强度分析:

Prefill (GEMM):
  计算量: 2 × M × N × K FLOPs
  内存访问: M×K + N×K + M×N 元素
  计算强度: ~K (高)

Decode (GEMV):
  计算量: 2 × M × N FLOPs
  内存访问: M + N + M×N 元素
  计算强度: ~1 (低)

当计算强度 < 硬件计算/带宽比时，成为内存瓶颈
A100: 312 TFLOPS / 2 TB/s = 156 FLOPs/byteDecode 强度远小于156，因此是内存瓶颈
```

### 性能指标
Decode 阶段的性能用 **Time-Per-Output-Token** (TPOT) 或 **Throughput (tokens/s) **衡量：

$ \text{Throughput} = \frac{\text{Batch Size}}{\text{TPOT}} $

对于7B模型在A100上的典型数据：

+ Batch Size = 1: ~50-100ms/token (10-20 tokens/s) 
+ Batch Size = 8: ~60-120ms/token (60-130 tokens/s)
+ Batch Size = 32: ~80-160ms/token(200-400 tokens/s)

## 2.4.3 两个阶段性能特征对比
| 特性 | Prefill | Decode |
| :--- | :--- | :--- |
| 并行度 | 高 (所有token并行) | 低 (逐个token) |
| 计算类型 | GEMM | GEMV |
| 主要瓶颈 | **算力** | **内存带宽** |
| GPU利用率 | 70-90% | 10-30% |
| 批处理收益 | 中等 | 高 |
| 优化重点 | 算力优化 | 内存优化、批处理 |
| 典型延迟 | 50-500ms | 50-150ms/token |


## 2.4.4 端到端推理时间估算
完整的推理请求时间：

$ \text{Total Time} = \text{TTFT} + (\text{Output Length} - 1) \times \text{TPOT} $

示例：生成256 tokens，Prefill 1K tokens 

+ TTFT = 100ms 
+ TPOT = 80ms 
+ Total Time =100 + 255 × 80 = 20.5 seconds

