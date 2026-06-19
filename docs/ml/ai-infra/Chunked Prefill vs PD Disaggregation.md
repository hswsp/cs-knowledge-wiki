# Chunked Prefill vs PD Disaggregation

在LLM服务优化领域，Chunked Prefill和PD Disaggregation是两种重要的技术方向。理解它们的原理和差异，对于选择合适的优化策略至关重要。

## 4.3.1 Chunked Prefill 原理
Chunked Prefill是一种在同构部署中缓解Prefill-Decode冲突的技术，通过将长Prefill拆分成多个小块，与Decode交错执行。

### 核心思想
```latex
 ┌─────────────────────────────────────────────────────────────────┐
 │                      Chunked Prefill      执行模式                                │
 ├─────────────────────────────────────────────────────────────────┤
 │                                                                                   │
 │   传统方式 (无Chunking):                                                           │
 │   ┌─────────────────────────────────────────────────────────┐                 │
 │   │ Prefill(4K) │ Decode     │ Decode    │ Decode   │ ...                          │   │
 │   │   500ms     │    20ms    │   20ms    │   20ms   │                     │   │
 │   └─────────────────────────────────────────────────────────┘                 │
 │   问题: 长Prefill阻塞Decode，ITL不稳定                                                 │
 │                                                                                   │
 │   Chunked Prefill:                                                                │
 │   ┌─────────────────────────────────────────────────────────————————┐                 │
 │   │Prefill │Decode │Prefill   │Decode │Prefill    │Decode │Prefill│               │   │
 │   │(1K)    │(1tok) │(1K)      │(1tok) │(1K)       │(1tok) │(1K)     │   │   │
 │   │100ms   │ 20ms  │100ms     │ 20ms  │100ms      │ 20ms  │100ms   │   │   │
 │   └─────────────────────────────────────────────────────────┘                 │
 │ 优势: Prefill和Decode交错，ITL更稳定                                                   │
 │ 代价: TTFT增加（需要等待所有Prefill chunks完成）                                            │
 │                                                                                   │
 └─────────────────────────────────────────────────────────────────┘
```

### 实现机制
```python
   class ChunkedPrefillScheduler:
        def __init__(self, chunk_size=512):
           self.chunk_size = chunk_size

        def schedule(self, waiting_requests, running_requests):
           batch = []

           # 1.   优先处理正在运行的Decode请求
           for req in running_requests:
               if not req.is_prefill_complete:
                    #   继续Prefill（取下一个chunk）
                    chunk = req.get_next_prefill_chunk(self.chunk_size)
                    batch.append(chunk)
               else:
                    # Decode阶段
                    batch.append(req)

           # 2.   在容量允许的情况下添加新请求
           remaining_slots = self.max_batch_size - len(batch)
           for req in waiting_requests[:remaining_slots]:
               chunk = req.get_next_prefill_chunk(self.chunk_size)
               batch.append(chunk)


           return batch

```

### Chunked Prefill 的优缺点
| 维度 | 优点 | 缺点 |
| :--- | :--- | :--- |
| TTFT | 中等（比纯Decode优先好） | 比纯Prefill优先差 |
| ITL | 稳定（无长阻塞） | 有小幅增加（~10-20%） |
| 实现复杂度 | 低（同构部署） | - |
| 资源利用率 | 中等 | 无法专门优化 |
| 扩展性 | 有限 | 难以独立扩展Prefill/Decode |


## 4.3.2 两种方案对比分析
![](https://images.spumn.eu.cc/ml/ai-infra/1781606345382-ddb8698a-f9f4-438b-b5f8-5cd09b4798e8.svg)

### 性能数据对比
基于Llama-2-70B模型的实验数据（输入4K，输出512 tokens）：

| 指标 | 基线(vLLM) | Chunked Prefill | PD Disaggregation |
| :--- | :--- | :--- | :--- |
| TTFT P50 | 350ms | 280ms | 120ms |
| TTFT P99 | 800ms | 600ms | 200ms |
| ITL P50 | 35ms | 30ms | 18ms |
| ITL P99 | 80ms | 55ms | 35ms |
| 吞吐量 | 100% | 110% | 150% |


### 适用场景分析
#### Chunked Prefill 适用场景
1. **资源受限环境**：GPU数量少，无法分离部署
2. **延迟要求中等**：TTFT < 500ms可接受
3. **简单部署**：希望最小化运维复杂度
4. **工作负载均匀**：Prefill和Decode比例相对稳定

#### PD Disaggregation适用场景
1. **大规模部署**：数十到数百GPU
2. **严格延迟要求**：TTFT < 200ms，ITL < 30ms
3. **异构工作负载**：Prefill和Decode比例波动大
4. **高可用要求**：需要故障隔离和独立扩缩容

## 4.3.3 混合策略
在实际生产环境中，Chunked Prefill和PD Disaggregation可以结合使用：

![](https://images.spumn.eu.cc/ml/ai-infra/1781606420585-a4e8c9e1-efd6-4439-90c8-84e4811b0a6c.svg)

优势:  

+ 短序列避免KV Cache传输开销                                               
+ 长序列获得最优TTFT和ITL                                                 
+ 资源利用更灵活          

### 路由决策逻辑
```python
  def route_request(request):
     #   基于序列特性选择处理路径
     if request.input_len < 1024:
           #   短序列：使用Chunked Prefill
           return route_to_chunked_pool(request)
     else:
           #   长序列：使用PD Disaggregation
           prefill_node = select_prefill_node(request)
           return route_to_prefill_cluster(request, prefill_node)
```

