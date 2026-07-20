# FAST 2025 最佳论文：Mooncake 深度解析

## 3.3.1 论文信息
+ 标题：Mooncake: Trading More Storage for Less Computation — A KVCache-centricArchitecture for Serving LLM Chatbot
+ 作者：Ruoyu Qin, Zheming Li, Weiran He, Jialei Cui, Heyi Tang, Feng Ren, Teng Ma,Shangming Cai, Yineng Zhang, Mingxing Zhang, Yongwei Wu, Weimin Zheng, XinranXu
+ 会议：FAST 2025 Best Paper Award
+ 单位：清华大学 & Moonshot AI (月之暗面)
+ 开源：[https://github.com/kvcache-ai/Mooncake](https://github.com/kvcache-ai/Mooncake)

## 3.3.2 核心问题
现有LLM推理系统面临三大挑战：

1. **Prefill-Decode干扰** 
+ 同 GPU上运行 prefill和 decode会相互影响 
+ 长 prompt的 prefill会阻塞decode的TBT延迟 
+ 高并发的decode会拖慢prefill的TTFT
2. **GPU利用率不均衡**
+ Prefill阶段：计算密集型， GPU计算单元饱和 
+ Decode阶段：内存密集型，GPU计算单元闲置 - 同构部署导致资源浪费
3. **KV Cache管理低效**
+ 现有系统缺乏跨请求、跨实例的KV Cache复用 
+ 重复计算相同的prompt前缀造成资源浪费

## 3.3.3 核心思想：以KV Cache为中心的分离架构
Mooncake 提出了革命性的KVCache-centric Disaggregated Architecture：

![](https://images.spumn.eu.cc/ml/ai-infra/1781601098428-e4259a68-8684-4656-ab84-4eb9ba4c79f4.svg)

### 三大核心组件：  
1. **Prefill-Decode分离** 
+ Prefill集群：专门处理计算密集型的prefill阶段 
+ Decode集群：专门处理延迟敏感的decode阶段 - 两阶段通过KV Cache传输解耦
2. **全局KV Cache池**
+ 利用集群中闲置的CPU、DRAM、SSD资源 
+ 构建分层的KV Cache存储池 - 支持跨请求的KV Cache复用（Prefix Caching）
3. **KVCache-aware调度器**
+ 全局视角的请求调度 
+ 考虑KV Cache位置、网络带宽、负载均衡 - 最大化整体吞吐量

## 3.3.4 技术细节
### 3.3.4.1 Transfer Engine：高性能KV Cache传输
Mooncake的核心创新之一是**Transfer Engine**，一个专门优化KV Cache传输的通信层：

关键优化： 1. **零拷贝传输**：直接从GPU内存传输到远端，避免中间拷贝 2. **RDMA支持**：利用InfiniBand RDMA实现低延迟、高带宽传输 3. **流水线并行**：传输与计算重叠，隐藏传输延迟 4. **自适应分块**：根据网络状况动态调整传输块大小

性能数据：

+ 在800Gbps InfiniBand网络下，传输延迟可以忽略不计（<1%总延迟）
+ 单节点NVLink带宽可达600GB/s，传输开销几乎为零

### 3.3.4.2 Mooncake Store：分布式KV Cache存储
```python
# Mooncake Store    的核心接口
  class MooncakeStore:
      def put(self, key: str, kv_cache: Tensor, tier: StorageTier) -> bool
      def get(self, key: str) -> Optional[Tensor]
      def prefetch(self, key: str, target_tier: StorageTier) -> Future
      def evict(self, strategy: EvictStrategy) -> List[str]

```

### 分层存储策略：
| 层级 | 存储介质 | 容量 | 延迟 | 用途 |
| :--- | :--- | :--- | :--- | :--- |
| L0 | GPU HBM | 小 | ~10μs | 热数据，当前batch |
| L1 | CPU DRAM | 大 | ~1μs | 温数据，prefix cache |
| L2 | Local SSD | 很大 | ~100μs | 冷数据，历史会话 |
| L3 | Remote Storage | 极大 | ~1ms | 归档数据 |


**数据流动策略**： 1. 新请求的KV Cache首先写入L0 2. 请求完成后，KV Cache异步下沉到L1/L2 3. 调度器根据预测模型决定预取策略

### 3.3.4.3 全局调度器
Mooncake的调度器在请求级别做出智能决策

调度考虑因素： 1. **KV Cache位置**：优先调度到已有相关KV Cache的节点 2. **负载均衡**：避免某些节点过载 3. **网络拓扑**：最小化跨节点KV Cache传输 4. **SLO约束**：满足TTFT和TPOT要求

调度算法

```python
def schedule_request(request):
          # 1.   查找匹配的KV Cache前缀
          cached_prefixes = global_cache_pool.find_prefix_matches(request.prompt)


          # 2.   计算各候选节点的调度成本
          for node in candidate_nodes:
             cost = compute_cost(node, request, cached_prefixes)
             #   成本包括：KV传输时间、队列等待时间、计算时间
    
          # 3.   选择成本最低的节点
          return argmin(costs)
```

## 3.3.5 实验结果
### 3.3.5.1 实验室环境测试
| 工作负载 | 基线方法 | Mooncake | 提升 |
| :--- | :--- | :--- | :--- |
| 长上下文对话 | vLLM | Mooncake | 59%-498% |
| 多轮问答 | vLLM | Mooncake | 2-4× |
| 文档分析 | vLLM | Mooncake | 3-5× |


### 3.3.5.2 生产环境部署
| 指标 | A800集群 | H800集群 |
| :--- | :--- | :--- |
| 日处理token数 | 1000亿+ | 1000亿+ |
| 请求处理能力提升 | +115% | +107% |
| 部署节点数 | 数千节点 | 数千节点 |


### 3.3.5.3关键发现
1. **长上下文场景收益最大**：当输入长度>10K时，prefix caching可避免大量重复计算
2. **网络带宽是关键**：在InfiniBand环境下，PD分离几乎没有额外开销
3. **存储-计算的权衡值得**：用便宜的存储（CPU/SSD）换取昂贵的GPU计算时间

## 3.3.6 开源生态
Mooncake 已与多个主流推理引擎集成：

| 时间 | 里程碑 |
| :--- | :--- |
| 2024.06 | 技术报告发布 |
| 2024.11 | Transfer Engine开源 |
| 2024.12 | vLLM官方支持Mooncake |
| 2025.02 | FAST 2025最佳论文 |
| 2025.03 | Mooncake Store开源 |
| 2025.04 | LMCache支持Mooncake Store |
| 2025.05 | SGLang支持Mooncake Transfer Engine |
| 2025.06 | LMDeploy支持Mooncake作为PD分离后端 |


## 3.3.7 IMPRESS：多层级Prefix KV存储系统
### 论文信息
+ 标题：IMPRESS: An Importance-Informed Multi-Tier Prefix KV Storage System forLarge Language Model Inference
+ 会议：FAST 2025
+ 作者：Weijian Chen et al.

### 核心思想
IMPRESS 针对 prefix KV 存储在磁盘时的 I/O 延迟问题，提出了**重要性感知的多层存储策略**：

**关键洞察：**

+ **当prefix KV需要存储到磁盘时，加载全部KV的I/O开销可能超过重新计算**
+ 不同token的KV对推理结果的重要性差异很大 - 重要token的集合在不同attention head之间高度相似

**技术方案**： 1. **I/O高效的重要KV识别算法**：通过分析attention模式识别关键token 2. **重要性感知的KV管理**：优先加载重要KV，延迟或跳过不重要KV 3. **精度-延迟权衡**：在保持可接受精度的前提下最小化I/O

**实验结果**：相比SOTA系统，TTFT降低2.8×，同时保持相当的推理精度。

