# 与 SGLang 的集成

## 6.5.1 SGLang 架构简介
SGLang 是由LMSYS组织开发的开源LLM推理框架，以其<font style="color:#DF2A3F;">高效的结构化生成能力</font>而闻名：

SGLang 核心特性：

+ **RadixAttention**： 高效的 KV Cache 管理机制
+ **Structured Generation**：支持 JSON、正则等结构化输出
+ **FlashInfer集成**：高性能 Attention Kernel
+ **多模态支持**：支持视觉-语言模型

### SGLang架构
![](https://images.spumn.eu.cc/ml/ai-infra/1781712132167-3e262166-c0ff-4128-8f66-4edf4cdb29aa.svg)

## 6.5.2 PD 分离实现
SGLang 与Mooncake的集成实现了完整的PD分离架构：

```python
# SGLang PD 分离核心实现
  class DisaggregationManager:
      def __init__(self, disaggregation_mode: str):
         self.mode = disaggregation_mode
         self.kv_manager = None


         if disaggregation_mode == "prefill":
             self.kv_manager = PrefillKVManager()
         elif disaggregation_mode == "decode":
             self.kv_manager = DecodeKVManager()


      async def process_request(self, request):
         if self.mode == "prefill":
             # Prefill  节点：计算KV Cache并发送
             kv_cache = await self.compute_kv_cache(request)
             await self.kv_manager.send_kv_cache(request.id, kv_cache)
             return {"status": "prefill_complete"}

         elif self.mode == "decode":
             # Decode节点：接收KV Cache并解码
             kv_cache = await self.kv_manager.receive_kv_cache(request.id)
             output = await self.decode(request, kv_cache)
             return output   
```

Prefill节点实现：

```python
class PrefillKVManager:
     def __init__(self):
         #   初始化Mooncake Transfer Engine
         self.transfer_engine = MooncakeTransferEngine()
         self.transfer_engine.initialize(
               local_hostname=get_ip(),
               metadata_server="etcd://localhost:2379",
               protocol="rdma"
         )

     async def send_kv_cache(self, request_id: str, kv_cache: torch.Tensor)
         """发送KV Cache到Decode节点"""
         # 注册内存
         self.transfer_engine.register_memory(kv_cache)

         #   获取目标Decode节点
         decode_node = self.get_decode_node(request_id)

         #   执行传输
         await self.transfer_engine.transfer(
               remote_session=decode_node.session,
               src_addrs=[kv_cache.data_ptr()],
               dst_addrs=[decode_node.buffer_addr],
               sizes=[kv_cache.nbytes]
         )
```

### Decode节点实现
```python
class DecodeKVManager:
    def __init__(self):
       self.transfer_engine = MooncakeTransferEngine()
       self.transfer_engine.initialize(
             local_hostname=get_ip(),
             metadata_server="etcd://localhost:2379",
             protocol="rdma"
       )
       self.pending_requests = {}

    async def receive_kv_cache(self, request_id: str) -> torch.Tensor:
       """接收来自Prefill节点的KV Cache"""
       # 分配接收缓冲区
       buffer = torch.empty(expected_size, dtype=torch.float16, device='cu

       #   注册接收缓冲区
       self.transfer_engine.register_memory(buffer)

       #   等待接收完成
       await self.transfer_engine.wait_for_transfer(request_id)

       return buffer
```

## 6.5.3 大规模部署案例（96 H100 GPUs）
与SGLang的合作实现了DeepSeek模型在96 H100 GPU上的大规模部署：Mooncake

### 部署配置：
```python
集群规模：96 × NVIDIA H100 GPUs
模型：DeepSeek-V3 (671B参数，MoE架构)

并行策略：EP + DP + TP + PD分离
 - Expert Parallelism (EP): 8
 - Data Parallelism (DP): 4
 - Tensor Parallelism (TP): 3
 - Prefill-Decode 分离：Prefill:Decode = 1:2
```

### 性能指标：
+ **TPOT降低**：约20%
+ **推理成本**：降至$0.2/1M tokens
+ **吞吐量**：相比基线提升显著

### 部署架构
```latex
┌─────────────────────────────────────────────────────────────────┐
│                  DeepSeek on 96 H100 with Mooncake              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    Prefill Pool (32 GPUs)                │   │
│   │   ┌─────────┐ ┌─────────┐ ┌─────────┐       ┌─────────┐   │   │
│   │   │ Node 1  │ │ Node 2  │ │ Node 3  │ ...   │ Node 8  │   │   │
│   │   │ (4 GPU) │ │ (4 GPU) │ │ (4 GPU) │       │ (4 GPU) │   │   │
│   │   │ TP=4    │ │ TP=4    │ │ TP=4    │       │ TP=4    │   │   │
│   │   └─────────┘ └─────────┘ └─────────┘       └─────────┘   │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                   │                            │
│                                   │ Mooncake Transfer Engine   │
│                                   ▼ (RDMA/GDR)                │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    Decode Pool (64 GPUs)                 │   │
│   │   ┌─────────┐ ┌─────────┐ ┌─────────┐     ┌─────────┐     │   │
│   │   │ Node 9  │ │ Node 10 │ │ Node 11 │ ... │ Node 24 │     │   │
│   │   │ (4 GPU) │ │ (4 GPU) │ │ (4 GPU) │     │ (4 GPU) │     │   │
│   │   │ TP=4    │ │ TP=4    │ │ TP=4    │     │ TP=4    │     │   │
│   │   └─────────┘ └─────────┘ └─────────┘     └─────────┘     │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                Mooncake Store (Distributed KV Pool)        │   │
│   │            CPU DRAM + SSD for prefix caching              │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

启动命令：

```python
# Prefill  节点
  python -m sglang.launch_server \
    --model deepseek-ai/DeepSeek-V3 \
    --tp-size 4 \
    --disaggregation-mode prefill \
    --port 30000 \
    --attention-backend fa3


  # Decode节点
  python -m sglang.launch_server \
    --model deepseek-ai/DeepSeek-V3 \
    --tp-size 4 \
    --disaggregation-mode decode \
    --port 30001 \
    --attention-backend fa3


  # Proxy/Load Balancer
  python -m sglang.srt.disaggregation.mini_lb \
    --prefill http://prefill-node-1:30000 http://prefill-node-2:30000 \
    --decode http://decode-node-1:30001 http://decode-node-2:30001 \
    --host 0.0.0.0 --port 8000
```

