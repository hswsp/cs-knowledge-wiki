# InfiniStore 等 KV Cache 存储系统

## 5.10.1 字节跳动的InfiniStore
InfiniStore是字节跳动开发的分布式KV Cache存储系统，专为大规模LLM推理优化。

### InfiniStore架构
![](https://images.spumn.eu.cc/ml/ai-infra/1781689481412-6691f391-c77e-4261-aa7b-dea5026461be.svg)

### InfiniStore核心特性：
| 特性 | 描述 | 优势 |
| :--- | :--- | :--- |
| 分布式存储 | 跨节点共享KV Cache | 扩展性强 |
| 一致性哈希 | 确定性的KV Cache分布 | 负载均衡 |
| 多级缓存 | GPU/CPU/SSD分层 | 成本优化 |
| RDMA传输 | 高速节点间通信 | 低延迟 |
| 副本机制 | 多副本容错 | 高可用 |


### InfiniStore性能指标：
| 指标 | 数值 |
| :--- | :--- |
| 单节点吞吐量 | 50 GB/s |
| 跨节点RDMA带宽 | 200 Gbps |
| P99读取延迟 | < 100 μs |
| 集群规模 | 1000+ 节点 |
| 总存储容量 | PB级 |


## 5.10.2 其他开源方案
### vLLM PagedAttention
vLLM 的PagedAttention是最广泛使用的KV Cache管理方案。

```python
# vLLM PagedAttention     使用
from vllm import LLM, SamplingParams

llm = LLM(
    model="meta-llama/Llama-2-7b-hf",
    gpu_memory_utilization=0.9,
    max_num_seqs=256,
)

# PagedAttention 自动管理KV Cache
outputs = llm.generate(prompts, sampling_params)
```

### TensorRT-LLM KV Cache Manager
NVIDIA TensorRT-LLM 提供了优化的KV Cache管理：

```python
# TensorRT-LLM KV Cache    配置
from tensorrt_llm import Builder

builder = Builder()
builder.kv_cache_config = {
    "enable_kv_cache": True,
    "kv_cache_dtype": "fp8",      #   使用FP8量化
    "max_batch_size": 64,
    "max_input_len": 4096,
    "max_output_len": 1024,
}
```

### DeepSpeed-Inference KV Cache
DeepSpeed 提供了ZeRO风格的KV Cache分片：

```python
# DeepSpeed KV Cache 分片
import deepspeed

model = deepspeed.init_inference(
   model,
   mp_size=4,      #   模型并行度
   dtype=torch.half,
   kv_cache_config={
           "max_batch_size": 32,
           "max_seq_length": 2048,
           "allocate_kv_cache": True,
   }
)
```

### 开源方案对比：


