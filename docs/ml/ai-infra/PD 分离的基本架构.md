# 4.2.1 系统整体架构
分离系统由三个核心组件构成：**Prefill Cluster、Decode Cluster和全局调度器**。这种架构实现了计算和内存资源的专门化，使得每个集群可以根据其工作负载特性进行优化。

![](https://images.spumn.eu.cc/ml/ai-infra/1781605330042-dab92ba6-4c84-4468-a900-041ecbc3071d.svg)

特性：

+ Prefill Cluster：高计算密度GPU（A100/H100），优化批处理
+ Decode Cluster：高内存带宽GPU，低延迟响应
+ KV Cache传输：高速互联网络（RDMA/NVLink/IB）

## Prefill Cluster 设计
Prefill Cluster的核心设计目标是最大化Prefill吞吐量，同时控制TTFT在可接受范围内。

### 硬件配置建议
| 组件 | 推荐配置 | 说明 |
| :--- | :--- | :--- |
| GPU | NVIDIA A100/H100 | 高计算密度，支持大规模并行 |
| GPU内存 | 80GB | 支持长序列Prefill |
| 网络 | 200Gbps+ RDMA | 快速KV Cache传输 |
| CPU | 高核心数 | 支持数据预处理和调度 |


### 批处理策略
Prefill Cluster 采用**激进的批处理策略**：

```python
# Prefill批处理伪代码
  class PrefillBatcher:
       def __init__(self):
             self.max_batch_tokens = 8192       #     最大批处理token数
             self.max_wait_time = 10ms          #     最大等待时间
           
       def form_batch(self, pending_requests):
             #    按序列长度分组，优化内存使用
             sorted_requests = sorted(pending_requests,
                                         key=lambda r: r.input_len)

             batch = []
             total_tokens = 0
             for req in sorted_requests:
                   if total_tokens + req.input_len <= self.max_batch_tokens:
                      batch.append(req)
                      total_tokens += req.input_len


             return batch
```

**性能目标** 

+ TTFT P99 < 200ms（对于4K输入） 
+ Prefill吞吐量 > 1000 tokens/s/GPU

## Decode Cluster设计
Decode Cluster的设计目标是保持稳定的低ITL，提供流畅的用户体验。

### 硬件配置建议
| 组件 | 推荐配置 | 说明 |
| :--- | :--- | :--- |
| GPU | NVIDIA A100/H100/L40S | 高内存带宽 |
| GPU内存 | 80GB+ | 支持大KV Cache |
| 网络 | 100Gbps+ | 接收KV Cache |
| CPU | 中等配置 | 轻量级调度 |


### 调度策略
**Decode Cluster 采用保守的调度策略**，优先保证延迟稳定性：

```python
# Decode 调度伪代码
  class DecodeScheduler:
       def __init__(self):
            self.max_batch_size = 256         #     最大批大小
            self.target_itl = 50ms            #     目标ITL
           
       def schedule(self, running_requests, new_requests):
            #   优先服务正在运行的请求（避免ITL抖动）
            batch = [r for r in running_requests if not r.completed]

            #   在ITL允许的情况下接纳新请求
            current_itl = self.estimate_itl(batch)
            for req in new_requests:
                 if len(batch) < self.max_batch_size:
                     estimated_itl = self.estimate_itl(batch + [req])
                     if estimated_itl < self.target_itl * 1.2:     # 20%  裕量
                         batch.append(req)

            return batch
```

性能目标 

+ ITL P99 < 50ms 
+ TPOT < 30ms（对于70B模型）

# 4.2.2 KV Cache 传输机制
KV Cache传输是PD分离架构的核心环节，其效率直接影响系统整体性能。

## KV Cache数据结构
![](https://images.spumn.eu.cc/ml/ai-infra/1781605589823-4d4c40af-e0ea-4874-8f6f-7fc82c8c1b10.svg)

### 传输协议选择
| 传输协议 | 带宽 | 延迟 | 适用场景 |
| :--- | :--- | :--- | :--- |
| NVLink | 900GB/s | <1μs | **<font style="color:#ED740C;">单机多GPU</font>** |
| InfiniBand HDR | 200Gbps | 1-2μs | 多机RDMA |
| InfiniBand NDR | 400Gbps | <1μs | 高性能集群 |
| TCP/IP | 25-100Gbps | 10-100μs | 低成本部署 |


### 传输时间估算
```python
T_transfer = KV_Cache_Size / Bandwidth + Latency

#   示例: 1.34GB KV Cache通过200Gbps IB传输
 T_transfer = (1.34 × 8) / 200 + 0.001             # GB→Gb, ms
               = 53.6ms + 1ms
               ≈ 54.6ms
```

这意味着KV Cache传输可能成为瓶颈，需要优化策略。

### 传输优化技术
1. 压缩传输

```python
# KV Cache 压缩示例
  class KVCacheCompressor:
          def __init__(self, method='fp8', ratio=0.5):
               self.method = method
               self.ratio = ratio


          def compress(self, k_cache, v_cache):
               if self.method == 'fp8':
                   # FP8 量化: 2字节→1字节
                   k_compressed = quantize_to_fp8(k_cache)
                   v_compressed = quantize_to_fp8(v_cache)
               elif self.method == 'sparse':
                   #   稀疏化: 只传输重要token
                   importance = compute_importance(k_cache)
                   mask = importance > threshold
                   k_compressed = k_cache[mask]
                   v_compressed = v_cache[mask]


               return k_compressed, v_compressed

```

2. 增量传输

只传输新计算的KV Cache，而非完整序列：

```python
#   增量传输伪代码
  def incremental_transfer(prev_kv_cache, new_kv_cache,
                               cached_seq_len):
          #   只传输新增部分
          new_k = new_kv_cache.k[:, :, cached_seq_len:, :]
          new_v = new_kv_cache.v[:, :, cached_seq_len:, :]


          #   传输增量
          transfer(new_k, new_v)


          # Decode 端合并
          merged_k = concat(prev_kv_cache.k, new_k)
          merged_v = concat(prev_kv_cache.v, new_v)


          return merged_k, merged_v

```

# 4.2.3 请求路由和调度
全局调度器负责将请求路由到合适的Prefill节点，并在Prefill完成后协调KV Cache传输到Decode节点。

## 调度流程
![](https://images.spumn.eu.cc/ml/ai-infra/1781605747788-5efa304f-387e-4434-88c1-3a6b73df2f3a.svg)

## 节点选择算法
### Prefill节点选择
```python
def select_prefill_node(request, prefill_nodes):
      scores = []
      for node in prefill_nodes:
        #   计算综合得分
           score = (
                  0.4 * (1 - node.load) +            # 负载权重                                                    
                  0.3 * (1 - node.queue_depth / 10) + # 队列深度权重
                  0.2 * node.compute_capacity +      # 计算能力权重
                  0.1 * (1 if node.has_model(request.model) else 0)
           )
           scores.append((node, score))


      #   选择得分最高的节点
      return max(scores, key=lambda x: x[1])[0]
```

### Decode 节点选择
```python
def select_decode_node(request, decode_nodes, kv_cache_size):
      scores = []
      for node in decode_nodes:
           #   检查内存容量
           if node.available_memory < kv_cache_size * 1.2:          # 20% 裕量                                                                   
                  continue


           #   计算综合得分
           score = (
                  0.5 * (1 - node.current_itl / 50) +      # ITL权重                                                        
                  0.3 * node.memory_bandwidth +            # 内存带宽权重
                  0.2 * (1 - node.batch_size / 256)        # 批大小权重
           )
           scores.append((node, score))


      return max(scores, key=lambda x: x[1])[0] if scores else None
```

