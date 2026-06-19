# LMCache 的设计

## 5.9.1 分层KV Cache存储
LMCache是伯克利大学SkyComputing实验室开发的开源KV Cache管理系统。

### LMCache架构
![](https://images.spumn.eu.cc/ml/ai-infra/1781688191841-182f4c27-3d99-4e90-9d44-600c194f4062.svg)

### LMCache 存储后端：
| 后端类型 | 实现 | 适用场景 |
| :--- | :--- | :--- |
| GPU | CUDA内存池 | 活跃请求 |
| CPU | 共享内存 | 近期请求 |
| Disk | LMDB/SQLite | 持久化存储 |
| Remote | Redis/Memcached | 分布式共享 |
| Cloud | S3/GCS | 长期归档 |


## 5.9.2 与vLLM集成
LMCache 可以无缝集成到vLLM中

```python
# LMCache  与vLLM集成示例
from lmcache.integration.vllm import LMCacheWrapper
from vllm import LLM


#   初始化vLLM
llm = LLM(model="meta-llama/Llama-2-7b-hf")


#   包装vLLM以使用LMCache
lmcache_config = {
    "chunk_size": 256,
    "local_cpu": True,
    "local_disk": "/tmp/lmcache",
    "remote_url": "redis://localhost:6379",
    "compression": "fp8",
}


llm_with_cache = LMCacheWrapper(llm, config=lmcache_config)


# 使用缓存的推理
# 第一次请求会计算并缓存KV
output1 = llm_with_cache.generate("Explain quantum computing")


#   第二次请求会复用缓存的KV
output2 = llm_with_cache.generate("Explain quantum computing in detail")

```

## 5.9.3 性能优化
LMCache 的性能优化策略：

### Chunk-based存储
```python
class ChunkedKVCache:
    """基于chunk的KV Cache存储"""
    def __init__(self, chunk_size: int = 256):
          self.chunk_size = chunk_size
          self.chunk_cache = {}


    def store(self, key: str, kv_cache: torch.Tensor):
          """将KV Cache分块存储"""          
          seq_len = kv_cache.shape[0]
          num_chunks = (seq_len + self.chunk_size - 1) // self.chunk_size

          for i in range(num_chunks):
                start = i * self.chunk_size
                end = min((i + 1) * self.chunk_size, seq_len)
                chunk = kv_cache[start:end]

                chunk_key = f"{key}_chunk_{i}"
                self.chunk_cache[chunk_key] = chunk


        def retrieve(self, key: str, start_chunk: int = 0) -> torch.Tensor:
             """ 检索KV Cache，支持部分检索"""              
              chunks = []
              i = start_chunk

              while True:
                    chunk_key = f"{key}_chunk_{i}"
                    if chunk_key not in self.chunk_cache:
                       break
                    chunks.append(self.chunk_cache[chunk_key])
                    i += 1

              return torch.cat(chunks, dim=0) if chunks else None
```

### 异步预取
```python
class AsyncPrefetcher:
   """    异步预取KV Cache"""
   def __init__(self, cache: ChunkedKVCache):
          self.cache = cache
          self.prefetch_queue = asyncio.Queue()
          self.prefetch_task = asyncio.create_task(self._prefetch_loop())


   async def schedule_prefetch(self, key: str, chunk_idx: int):
          """调度预取请求"""
          await self.prefetch_queue.put((key, chunk_idx))


   async def _prefetch_loop(self):
          """预取循环"""
          while True:
                key, chunk_idx = await self.prefetch_queue.get()
                chunk_key = f"{key}_chunk_{chunk_idx}"

                #   异步加载到GPU
                if chunk_key in self.cache.chunk_cache:
                     chunk = self.cache.chunk_cache[chunk_key]
                     #   预加载到GPU pinned memory
                     chunk.pin_memory()
```

### LMCache 性能数据：
| 工作负载 | 无缓存 | LMCache | 加速 |
| :--- | :--- | :--- | :--- |
| 长文档QA | 1.2s | 0.3s | 4x |
| 多轮对话 | 0.8s | 0.2s | 4x |
| 批量推理 | 45 req/s | 120 req/s | 2.7x |


