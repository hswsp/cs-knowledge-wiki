# 为什么需要 PD 分离

## 4.1.1 LLM 推理的两个阶段
大语言模型（LLM）的推理过程可以清晰地划分为两个截然不同的阶段：Prefill阶段（也称为提示处理阶段或上下文编码阶段）和Decode阶段（也称为Token生成阶段）。理解这两个阶段的本质差异，是掌握PD分离技术的基石。

![](https://images.spumn.eu.cc/ml/ai-infra/1781603622168-5fb58310-d325-4adf-8719-749ecb3f9fe6.svg)

### Prefill 阶段的特性
#### 计算密集型特征
Prefill 阶段需要处理用户输入的完整提示（ Prompt ），计算所有 Token 的 Key 和 Value 向量，并执行完整的Self-Attention计算。这个阶段的核心特点是：

1. **高计算密度**：需要计算输入序列中所有 Token 之间的 Attention 关系，计算复杂度为$O(n²d)$，其中$n$是序列长度，$d$是模型维度。
2. **并行性高**：由于所有输入 Token已知，可以采用高度并行的矩阵运算， GPU计算单元利用率接近饱和。
3. **延迟敏感**： Prefill 阶段的延迟直接决定了**首 Token 时间（ Time To First Token,TTFT）**，这是用户体验的关键指标。

#### 延迟分析
Prefill延迟可以用以下公式近似表示：

$T_{\text{prefill}} \approx \frac{2 \times n \times d_{\text{model}}^2 + n^2 \times d_{\text{head}} \times n_{\text{layers}}}{\text{GPU\_FLOPS} \times \text{utilization}}$

其中：

+ $n$: 输入序列长度
+ $d_{model}$: 模型隐藏层维度
+ $d_{head}$: Attention 头维度 
+ $n_{layers}$: 模型层数

对于典型的Llama-2-70B模型（`d_model=8192`, `n_layers=80`, `n_heads=64`）：

+ 输入长度4K tokens时，Prefill延迟约200-500ms
+ 输入长度32K tokens时，Prefill延迟可达2-5秒

### Decode阶段的特性
#### 内存密集型特征
Decode 阶段采用自回归方式逐 Token 生成输出，每次只处理一个新 Token。其核心特点是：

1. **低计算强度**：每次只处理 1 个新 Token，计算量极小，主要操作为向量 - 矩阵乘法和Attention计算。
2. **高内存带宽需求**：需要从 HBM 加载庞大的 KV Cache（对于 70B模型，每层每 Token约占用`2×d_model×2字节 = 32KB`，80层共2.5MB/Token）。
3. **内存受限**（ Memory-Bound ）： Decode 阶段的性能主要受限于 GPU 内存带宽，而非计算能力。

#### 延迟分析
Decode延迟主要**由内存访问决定**

$$
\begin{aligned}
T_{\text{decode}} &\approx \frac{\text{KV\_Cache\_Size} \times n_{\text{layers}}}{\text{Memory\_Bandwidth}} + \text{Compute\_Latency} \\
&\approx \frac{2 \times n_{\text{layers}} \times d_{\text{model}} \times \text{seq\_len} \times 2 \text{ bytes}}{\text{Memory\_Bandwidth}}
\end{aligned}
$$

对于Llama-2-70B在A100 GPU上：

+ 序列长度4K时，单次Decode延迟约10-20ms
+ 序列长度32K时，单次Decode延迟约50-100ms

## 4.1.2 同构部署的问题
传统的LLM服务采用同构部署方式，即Prefill和Decode在同一个GPU实例上顺序执行。这种方式存在以下根本性问题：

### 资源利用率冲突
```latex
 ┌─────────────────────────────────────────────────────────────┐
 │                       同构部署的资源冲突                                │
 ├─────────────────────────────────────────────────────────────┤
 │                                                                   │
 │     GPU计算资源                                                       │
 │     ████████████████████████████████████████ Prefill:高利用率 │                                                    
 │     ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ Decode: 低利用率 │
 │                                                                   │
 │     GPU内存带宽                                                       │
 │     ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ Prefill: 低需求                                                       │
 │     ████████████████████████████████████████ Decode: 高需求           │
 │                                                                   │
 │     问题: Prefill和Decode对资源的需求模式完全相反                            │
 └─────────────────────────────────────────────────────────────┘

```

在同构部署中：

+ **Prefill阶段**：计算单元满载，但内存带宽利用率低（<30%）
+ **Decode阶段**：计算单元利用率低（<10%），但内存带宽接近饱和

这种资源需求的互补性意味着同构部署必然导致某一阶段的资源浪费。

### 批处理困境（Batching Dilemma）
同构部署面临一个根本性的批处理困境：

| 批处理策略 | TTFT影响 | ITL影响 | 吞吐量 |
| :--- | :--- | :--- | :--- |
| 大Batch Prefill | 增加（排队延迟） | 改善 | 高 |
| 小Batch Prefill | 降低 | 恶化 | 低 |
| 混合Batch | 中等 | 中等 | 中等 |


### 连续批处理（Continuous Batching）的局限
虽然连续批处理（如vLLM的PagedAttention）可以在一定程度上缓解这个问题，但它无法从根本上解决Prefill和Decode的资源需求冲突：

1. **Chunked Prefill的妥协**：<font style="color:#DF2A3F;">将Prefill拆分成小块与Decode交错执行</font>，但这会增加TTFT
2. **抢占开销**：当高优先级Prefill到达时抢占Decode，会导致ITL抖动
3. **内存碎片化**：混合执行导致KV Cache管理复杂化的

## 4.1.3 TTFT vs ITL Trade-off
PD分离的核心动机来自于两个关键性能指标之间的根本冲突：

### 关键性能指标定义
**<font style="color:#DF2A3F;">TTFT (Time To First Token)</font>**<font style="color:#DF2A3F;"> </font>

+ 定义：从请求到达系统到生成第一个输出Token的时间 
+ 用户感知：直接影响"响应速度"体验 
+ 目标：通常要求 < 100-500ms

**<font style="color:#DF2A3F;">ITL (Inter-Token Latency) </font>**

+ 定义：相邻输出 Token之间的生成间隔 
+ 用户感知：影响 "流畅度"体验 
+ 目标：通常要求 < 50-100ms

**<font style="color:#DF2A3F;">TPOT (Time Per Output Token) </font>**

+ 定义：单个输出 Token 的平均生成时间 
+ 与 ITL 的关系：TPOT ≈ ITL（在稳定状态下）

### 冲突分析


```latex
  ┌─────────────────────────────────────────────────────────────────┐
  │               TTFT与ITL的资源竞争关系                                         │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                           │
  │   资源分配策略               TTFT               ITL       用户体验          │
  │   ─────────────────────────────────────────────────────────────       │
  │ 优先Prefill              低✓              高✗           响应快但卡顿        │
  │ 优先Decode               高✗               低✓          响应慢但流畅        │
  │ 均衡分配                   中               中           折中方案           │
  │                                                                           │
  │   理想: PD分离 → Prefill和Decode各自优化 → TTFT和ITL同时优化               │
  └─────────────────────────────────────────────────────────────────┘
```

在同构部署中，优化TTFT通常意味着： 1. 减少Prefill批大小 → 降低GPU利用率 → 吞吐量下降 2. 优先调度Prefill → Decode被抢占 → ITL增加

优化 ITL 通常意味着： 1. 保持 Decode 连续执行 → Prefill 排队 → TTFT 增加 2. 大 BatchDecode → 内存压力 → 无法及时处理新Prefill

### PD分离的价值主张
PD分离通过将Prefill和Decode部署到不同的GPU集群，从根本上解决了这个trade-off：

![](https://images.spumn.eu.cc/ml/ai-infra/1781604797678-0c52364b-f777-45d1-b3c6-962d7d11204e.svg)

通过PD分离： 1. **Prefill Cluster**：配置高计算能力GPU，采用大Batch处理，最大化吞吐量 2.** Decode Cluster**：配置高内存带宽 GPU，保持低延迟，优化 ITL 3. K**V Cache 传输**：在两者之间高效传递中间状态

这种架构使得TTFT和ITL可以分别优化，不再需要在两者之间做痛苦的权衡。

