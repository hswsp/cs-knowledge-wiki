# PD 分离中的 KV Cache 传输优化

KV Cache 传输是PD分离架构的关键路径，其性能直接影响系统的TTFT和整体吞吐量。本节深入探讨各种传输优化技术。

## 4.7.1 传输带宽优化
硬件层面优化

![](https://images.spumn.eu.cc/ml/ai-infra/1781626490113-8c9b15d0-df44-4355-93d0-bea0d4917435.svg)

软件层面优化

```python
class BandwidthOptimizer:
   """
   传输带宽优化器
   """

   def __init__(self, network_config: NetworkConfig):
         self.network_config = network_config
         self.transfer_queue = asyncio.Queue()


   async def optimize_transfer(
         self,
         kv_cache: torch.Tensor,
         dst_addr: str,
   ) -> bool:
         """
         优化后的传输函数
         优化策略:
         1. 批量传输
         2. 流水线并行
         3. 压缩传输
         """
        # 1.   分割KV Cache为传输块
         chunks = self._split_into_chunks(kv_cache)

         # 2.   并行传输
         tasks = []
         for i, chunk in enumerate(chunks):
               task = self._transfer_chunk(chunk, dst_addr, i)
               tasks.append(task)

         # 3.   等待所有传输完成
         results = await asyncio.gather(*tasks)

         return all(results)


    def _split_into_chunks(
            self,
            kv_cache: torch.Tensor,
            chunk_size_mb: int = 64
    ) -> List[torch.Tensor]:
        """
        将KV Cache分割为传输块
        策略: 按层分割，便于流水线
        """
        n_layers = kv_cache.shape[1]      # [2, n_layers, ...]
        bytes_per_layer = kv_cache.numel() // n_layers * kv_cache.element_size()
        layers_per_chunk = max(1, chunk_size_mb * 1024 * 1024 // bytes_per_layer)
        chunks = []
        for i in range(0, n_layers, layers_per_chunk):
            end = min(i + layers_per_chunk, n_layers)
            chunk = kv_cache[:, i:end, :, :, :]
            chunks.append(chunk)
    
        return chunks


    async def _transfer_chunk(
           self,
           chunk: torch.Tensor,
           dst_addr: str,
           chunk_id: int,
        ) -> bool:
           """传输单个块"""
           # 使用RDMA发送
           try:
                 await self.rdma_send(chunk.data_ptr(), chunk.numel(), dst_addr)
                 return True
           except Exception as e:
                 logger.error(f"Chunk {chunk_id} transfer failed: {e}")
                 return False

```

## 4.7.2 重叠传输和计算
重叠传输和计算是减少传输延迟影响的关键技术。

### 流水线设计
![](https://images.spumn.eu.cc/ml/ai-infra/1781626975995-6dc19529-1f04-43a3-a99c-1d0d94428625.svg)

### 异步传输实现
```python
class AsyncTransferEngine:
   """
   异步传输引擎
   实现传输和计算的完全重叠
   """


   def __init__(self):
         self.transfer_stream = torch.cuda.Stream()
         self.compute_stream = torch.cuda.default_stream()
         self.pending_transfers = {}


   async def prefill_with_async_transfer(
         self,
         request: Request,
         prefill_func: Callable,
         transfer_func: Callable,
   ) -> torch.Tensor:
         """
         执行Prefill并异步传输KV Cache
         
         流程:
         1. 执行Prefill
         2. 在独立CUDA流中启动异步传输
         3. 返回控制，不等待传输完成
         """
       
         # 1.   执行Prefill（在计算流）
         with torch.cuda.stream(self.compute_stream):
               output, kv_cache = prefill_func(request)

         # 2.   同步计算流，确保KV Cache就绪
         self.compute_stream.synchronize()

         # 3.   在传输流中启动异步传输
         with torch.cuda.stream(self.transfer_stream):
               transfer_future = transfer_func(kv_cache)
               self.pending_transfers[request.id] = transfer_future

         return output


   async def decode_with_async_receive(
         self,
         request: Request,
         decode_func: Callable,
         receive_func: Callable,
   ) -> torch.Tensor:
         """
         执行Decode并异步接收KV Cache
         流程:
           1. 检查KV Cache是否已接收
           2. 如果未接收完成，等待
           3. 执行Decode
           """
           # 1.   等待KV Cache接收完成
           if request.id in self.pending_receives:
                 kv_cache = await self.pending_receives[request.id]
           else:
                 kv_cache = await receive_func(request.id)

           # 2.   执行Decode
           output = decode_func(request, kv_cache)

           return output


    def create_transfer_event(self) -> torch.cuda.Event:
           """  创建传输完成事件"""
           event = torch.cuda.Event()
           event.record(self.transfer_stream)
           return event
```

## 4.7.3 流水线并行
流水线并行是PD分离的高级优化技术，通过将模型层分布到多个设备上实现传输和计算的深度重叠。

### 流水线架构
![](https://images.spumn.eu.cc/ml/ai-infra/1781627099144-259fdc44-55e8-42db-b86d-b5f0df16f55f.svg)

### 流水线调度实现
```python
class PipelineScheduler:
   """
   流水线调度器
   管理模型层在多个GPU上的分布和执行
   """

   def __init__(
         self,
         model_config: ModelConfig,
         num_stages: int,
   ):
         self.num_stages = num_stages
         self.layers_per_stage = model_config.num_layers // num_stages

        #   为每个阶段分配GPU
         self.stage_gpus = list(range(num_stages))


   def schedule_prefill(
         self,
         input_ids: torch.Tensor,
   ) -> torch.Tensor:
         """
         流水线Prefill调度
         每个阶段处理一部分层，激活值在阶段间传递
         """
         hidden_states = self.embed(input_ids)

         for stage in range(self.num_stages):
               gpu = self.stage_gpus[stage]

               #   将输入移动到目标GPU
               hidden_states = hidden_states.to(f'cuda:{gpu}')

               #   执行当前阶段的层
               start_layer = stage * self.layers_per_stage
               end_layer = (stage + 1) * self.layers_per_stage

               for layer_id in range(start_layer, end_layer):
                    hidden_states = self.layers[layer_id](hidden_states)


         return hidden_states


   def schedule_kv_transfer(
         self,
         kv_caches: List[torch.Tensor],
         dst_addr: str,
   ):
         """
         流水线KV Cache传输
         各阶段的KV Cache并行传输
         """
         transfer_tasks = []

         for stage, kv_cache in enumerate(kv_caches):
               #   每个阶段的KV Cache独立传输
               task = self.async_transfer(kv_cache, dst_addr, stage)
               transfer_tasks.append(task)

         #   等待所有传输完成
         await asyncio.gather(*transfer_tasks)

```

## 4.7.4 压缩传输技术
压缩传输可以显著减少传输数据量，降低传输延迟。

量化压缩

```python
class KVCacheCompressor:
   """
   KV Cache    压缩器
   支持多种压缩算法
   """

   def __init__(self, method: str = 'fp8'):
         self.method = method


   def compress(self, kv_cache: torch.Tensor) -> Tuple[torch.Tensor, Any]
         """
         压缩KV Cache
         Returns:
               (压缩后的数据, 元数据)       
         """
         if self.method == 'fp8':
               return self._compress_fp8(kv_cache)
         elif self.method == 'int8':
               return self._compress_int8(kv_cache)
         elif self.method == 'sparse':
               return self._compress_sparse(kv_cache)
         else:
               return kv_cache, None


   def _compress_fp8(
         self,
         kv_cache: torch.Tensor
   ) -> Tuple[torch.Tensor, torch.Tensor]:
         """
         FP8 量化压缩
         FP16 (2 bytes) → FP8 (1 byte)
         压缩率: 50%
         """
         #   计算缩放因子
         max_val = kv_cache.abs().max()
         scale = max_val / 448.0     # E4M3  最大值
         #   量化到FP8
         compressed = (kv_cache / scale).to(torch.float8_e4m3fn)

         return compressed, scale


   def _compress_int8(
         self,
         kv_cache: torch.Tensor,
   ) -> Tuple[torch.Tensor, Tuple[torch.Tensor, torch.Tensor]]:
         """
          INT8  对称量化
          FP16 (2 bytes) → INT8 (1 byte)
          压缩率: 50%
        """
      # 计算缩放因子（per-channel）
      dim = -1 # 最后一个维度
      max_vals = kv_cache.abs().amax(dim=dim, keepdim=True)
      scales = max_vals / 127.0

      #   量化到INT8
      compressed = (kv_cache / scales).round().clamp(-128, 127).to(torch

      return compressed, (scales, max_vals)


   def _compress_sparse(
      self,
      kv_cache: torch.Tensor,
      sparsity: float = 0.5,
   ) -> Tuple[torch.Tensor, torch.Tensor]:
      """
      稀疏化压缩
      
      只保留重要的token
      压缩率: 可调 (默认50%)
      """
      #   计算每个token的重要性（基于L2范数）
      importance = kv_cache.norm(dim=-1)

      #   选择重要的token
      k = int(kv_cache.shape[2] * (1 - sparsity))   #   保留的token数
      topk_vals, topk_indices = torch.topk(importance, k, dim=2)

      #   压缩
      compressed = torch.gather(
            kv_cache,
            dim=2,
            index=topk_indices.unsqueeze(-1).expand(-1, -1, -1, kv_cache.sh
      )


      return compressed, topk_indices
```

### 压缩效果对比
| 压缩方法 | 压缩率 | 精度损失 | 适用场景 |
| :--- | :--- | :--- | :--- |
| FP8 | 50% | <1% | 通用推荐 |
| INT8 | 50% | 1-2% | 资源受限 |
| FP4 | 25% | 3-5% | 极端压缩 |
| 稀疏50% | 50% | 2-3% | 长序列 |
| 稀疏75% | 25% | 5-8% | 极端场景 |


