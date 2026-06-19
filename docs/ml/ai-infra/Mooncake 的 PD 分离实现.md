# Mooncake 的 PD 分离实现

Mooncake是月之暗面（Moonshot AI）开发的开源LLM服务平台，其PD分离实现代表了业界领先水平。理解Mooncake的设计对于即将加入团队的新人至关重要。

## 4.4.1 Mooncake 架构设计
Mooncake 采用分层架构设计，将系统划分为多个功能模块，每个模块负责特定的职责。

![](https://images.spumn.eu.cc/ml/ai-infra/1781606771861-d50cdaa8-ec87-40e8-a71e-226e0dcaeec2.svg)

### 核心设计原则
1. **分离关注点**：调度、传输、执行各司其职
2. **无状态设计**：实例无状态，便于水平扩展和故障恢复
3. **异步通信**：基于消息队列的异步通信，提高系统吞吐量
4. **可观测性**：全链路监控和指标收集

## 4.4.2 Transfer Engine 详解
Transfer Engine 是Mooncake的核心创新之一，专门负责高性能KV Cache传输。

### 架构设计
![](https://images.spumn.eu.cc/ml/ai-infra/1781607031917-b4543c76-0d7d-4d1e-a2c1-4a041d87da60.svg)

传输优化技术:                                                                           

1. 零拷贝传输: GPU内存 → 网卡 (GPUDirect RDMA)                                       
2. 流水线传输: 多层级流水线并行                                                                
3. 压缩传输: FP8/INT8量化，减少传输量                                                       
4. 批量传输: 合并多个请求的KV Cache                                                                          

### 零拷贝传输实现
```cpp

// Transfer Engine  零拷贝传输伪代码
class RDMATransfer {
    public:
    //   注册GPU内存区域
    void register_gpu_memory(void* gpu_ptr, size_t size) {
        // 使用nvidia_p2p获取物理地址
        nvidia_p2p_get_pages(gpu_ptr, size, &page_table);
        
        // 注册到RDMA网卡
        ibv_reg_mr(pd, gpu_ptr, size,
            IBV_ACCESS_LOCAL_WRITE |
            IBV_ACCESS_REMOTE_READ);
    }

    //   执行GPU到GPU传输
    void transfer_gpu_to_gpu(void* src_gpu, void* dst_gpu,
    size_t size,
    RDMAConnection* conn) {
        //   构建RDMA SEND/WRITE操作
        struct ibv_sge sge;
        sge.addr = (uint64_t)src_gpu;      // GPU  物理地址
        sge.length = size;
        sge.lkey = mr->lkey;


        struct ibv_send_wr wr;
        wr.opcode = IBV_WR_RDMA_WRITE;               写操作
        // RDMA
        wr.wr.rdma.remote_addr = (uint64_t)dst_gpu;
        wr.wr.rdma.rkey = conn->remote_rkey;
        wr.sg_list = &sge;
        wr.num_sge = 1;

        //   下发到网卡
        ibv_post_send(conn->qp, &wr, &bad_wr);
    }
};

```

### 传输性能数据
Mooncake Transfer Engine 在不同配置下的性能：

| 配置 | 带宽 | 延迟 | 4K序列传输时间 |
| :--- | :--- | :--- | :--- |
| NVLink (单机) | 900GB/s | <1μs | ~1.5ms |
| IB HDR (200Gbps) | 200Gbps | 1-2μs | ~54ms |
| IB NDR (400Gbps) | 400Gbps | <1μs | ~27ms |
| RoCE (100Gbps) | 100Gbps | 5-10μs | ~107ms |
| TCP (25Gbps) | 25Gbps | 50-100μs | ~430ms |


### 优化效果
通过**零拷贝和流水线优化**， Mooncake实现了接近理论带宽的传输效率：

+ RDMA效率 :90-95%
+ NVLink效率: 85-90%
+ TCP效率: 70-80%

## 4.4.3 Global Scheduler (Conductor)
Conductor 是Mooncake的全局调度器，负责请求路由、负载均衡和资源管理。

### 调度架构
![](https://images.spumn.eu.cc/ml/ai-infra/1781607449728-ea89089e-bfcf-4b26-9de5-bfadff2fbf6a.svg)

### 调度算法
```python
class ConductorScheduler:
   def __init__(self):
       self.prefill_nodes = []        # Prefill节点列表
       self.decode_nodes = []         # Decode节点列表
       self.kv_cache_store = KVCacheStore()      # KV Cache元数据存储
                                                  


   def schedule_request(self, request):
       """主调度函数"""
       # 1. 分析请求特性
       profile = self.analyze_request(request)

       # 2.   选择Prefill节点
       prefill_node = self.select_prefill_node(request, profile)

       # 3.   预分配Decode节点
       decode_node = self.preselect_decode_node(request, profile)

       # 4.   发送调度指令
       self.send_to_prefill(request, prefill_node, decode_node)


   def select_prefill_node(self, request, profile):
       """ 选择最优Prefill节点"""
       candidates = []

       for node in self.prefill_nodes:
             if not node.is_healthy:
                  continue

             #   计算综合得分
             score = self.compute_prefill_score(node, request, profile)
             candidates.append((node, score))

       #   选择得分最高的节点
       return max(candidates, key=lambda x: x[1])[0]


   def compute_prefill_score(self, node, request, profile):
       """ 计算Prefill节点得分"""
       scores = {
             #   负载因素 (权重: 0.3)
             'load': (1 - node.current_load) * 0.3,

             #   队列深度 (权重: 0.2)
             'queue': (1 - node.queue_depth / node.max_queue) * 0.2,

             #   计算能力 (权重: 0.2)
             'compute': node.compute_score * 0.2,

             #   网络位置 (权重: 0.15)
             'network': self.network_score(node, request) * 0.15,

             #   模型缓存 (权重: 0.15)
             'model': 0.15 if node.has_model_cached(request.model_id) else 0
           }

           return sum(scores.values())
```

## 4.4.4 性能优化
在多个层面进行了深度优化，以实现极致性能。Mooncake

1. 请求流水线

![](https://images.spumn.eu.cc/ml/ai-infra/1781607738097-e07ae82b-d7e2-4f57-89e2-ddf787ca8600.svg)

2. KV Cache复用

```python
     class KVCacheReuse:
        """KV Cache 复用管理器"""
        def __init__(self):
            self.cache_index = {}     #   前缀 → KV Cache位置
            
        def find_reusable_cache(self, prompt):
            """查找可复用的KV Cache"""
            # 使用最长公共前缀匹配
            best_match = None
            best_len = 0

            for cached_prefix, cache_info in self.cache_index.items():
                  common_len = self.common_prefix_length(prompt, cached_prefix)
                  if common_len > best_len:
                      best_len = common_len
                      best_match = cache_info

            return best_match, best_len


        def compute_reuse_benefit(self, reuse_len, transfer_cost):
            """计算复用收益"""
            # 节省的计算量
            saved_compute = reuse_len * d_model * d_model * n_layers

            #   复用收益 = 节省计算 - 传输开销
            benefit = saved_compute / GPU_FLOPS - transfer_cost

            return benefit
```

3. 动态批处理

```python
class DynamicBatcher:
     """   动态批处理优化器"""
     def __init__(self):
           self.max_batch_size = 256
           self.max_wait_time = 10      # ms


     def form_batch(self, pending_requests):
           """ 动态形成批处理"""
           if not pending_requests:
                 return []

           #   按模型和序列长度分组
           groups = self.group_requests(pending_requests)

           batches = []
           for group in groups:
                 batch = self.optimize_batch(group)
                 batches.append(batch)

           return batches


     def optimize_batch(self, requests):
           """优化批处理组成"""
           # 按序列长度排序，减少padding
           sorted_reqs = sorted(requests, key=lambda r: r.input_len)

           #   动态确定批大小
           batch_size = min(
                 len(sorted_reqs),
                 self.max_batch_size,
                 self.compute_optimal_batch_size(sorted_reqs)
           )

           return sorted_reqs[:batch_size]
```

### 性能数据
Mooncake在生产环境中的性能表现

| 指标 | 基线(vLLM) | Mooncake | 提升 |
| :--- | :--- | :--- | :--- |
| TTFT P99 | 800ms | 150ms | 5.3x |
| ITL P99 | 80ms | 30ms | 2.7x |
| 吞吐量 | 100% | 180% | 1.8x |
| GPU利用率 | 45% | 75% | 1.7x |


