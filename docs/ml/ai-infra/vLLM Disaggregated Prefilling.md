# vLLM Disaggregated Prefilling

vLLM 作为最流行的开源 LLM 推理引擎，从 v0.6.0 版本开始正式支持 DisaggregatedPrefilling （分散式预填充）。这一功能使得 vLLM 可以与 Mooncake 等 PD 分离系统无缝集成。

## 4.5.1 vLLM PD分离架构
![](https://images.spumn.eu.cc/ml/ai-infra/1781621629544-6f213081-bc30-4f69-9351-3ea90c843321.svg)

## 4.5.2 KVTransferConfig 配置
vLLM 通过<font style="color:#ED740C;"> </font>`<font style="color:#ED740C;">KVTransferConfig</font>`<font style="color:#ED740C;"> 配置 PD分离参数</font>，这是启用 Disaggregated Prefilling的关键。

### 配置参数详解
```python
from vllm import KVTransferConfig

 #   完整的KVTransferConfig配置示例
 kv_transfer_config = KVTransferConfig(         
      # ===传输层配置 ===
      # 传输后端类型: 'mooncake', 'pynccl', 'custom'
      kv_connector='mooncake',

      #   传输缓冲区大小 (GB)
      kv_buffer_size=2.0,

      #   是否启用KV Cache压缩
      kv_compression='fp8',    #   可选: None, 'fp8', 'int8'
          
      # ===角色配置 ===
      # 当前实例的角色: 'prefill', 'decode', 'both'
      kv_role='prefill',


      #   对端地址配置
      kv_ip='192.168.1.100',    #   对端IP
      kv_port=50051,            #   对端端口
     
      # === 性能调优 ===
      #   批量传输阈值
      kv_transfer_threshold=1024,      # tokens


      #   传输超时时间 (ms)
      kv_transfer_timeout=5000,


      #   是否启用异步传输
      kv_async_transfer=True,
 )

```

### 配置示例：Prefill节点
```python
# prefill_server.py - Prefill      节点配置
from vllm import LLM, SamplingParams, KVTransferConfig


 #   配置KV传输
 kv_config = KVTransferConfig(
      kv_connector='mooncake',
      kv_role='prefill',
      kv_ip='decode-server.internal',      # Decode服务器地址
                                            
      kv_port=50051,
      kv_buffer_size=4.0,
      kv_compression='fp8',
 )


 #   初始化LLM引擎
 llm = LLM(
      model="meta-llama/Llama-2-70b",
      tensor_parallel_size=4,
      kv_transfer_config=kv_config,
              
      # Prefill优化配置
      max_num_seqs=64,          #   较大的批大小
      max_num_batched_tokens=8192,    # 大batch tokens
 )


 #   启动服务
 from vllm.entrypoints.openai.api_server import run_server
 run_server(llm, port=8000)

```

### 配置示例：Decode节点
```python
# decode_server.py - Decode     节点配置
from vllm import LLM, SamplingParams, KVTransferConfig


  #   配置KV传输
  kv_config = KVTransferConfig(
       kv_connector='mooncake',
       kv_role='decode',
       kv_ip='0.0.0.0',    #   监听所有接口
       kv_port=50051,
       kv_buffer_size=8.0,     # Decode  需要更大的buffer
       kv_compression='fp8',
  )


  #   初始化LLM引擎
  llm = LLM(
       model="meta-llama/Llama-2-70b",
       tensor_parallel_size=4,
       kv_transfer_config=kv_config,
       # Decode优化配置
       max_num_seqs=256,          #   更大的批大小
       max_num_batched_tokens=2048,     # 较小的batch tokens
       #   启用连续批处理
       enable_chunked_prefill=False,        # Decode 节点不处理Prefill
  )


  #   启动服务
  run_server(llm, port=8001)
```

## 4.5.3 MooncakeConnector 实现
MooncakeConnector 是vLLM与Mooncake Transfer Engine的集成层。架构设计

```python
# vllm/distributed/kv_transfer/mooncake_connector.py


class MooncakeConnector(KVConnectorBase):
   """
   Mooncake KV Cache   传输连接器
   功能:
   1. 与Mooncake Transfer Engine通信
   2. 管理KV Cache的发送和接收
   3. 处理压缩和解压缩
   """


   def __init__(self, config: KVTransferConfig):
         super().__init__(config)


         #   初始化Mooncake Transfer Engine客户端
         self.transfer_engine = MooncakeTransferEngine(
               buffer_size=config.kv_buffer_size,
               compression=config.kv_compression,
         )


         #   建立连接
         if config.kv_role == 'prefill':
               self._connect_to_decode(config.kv_ip, config.kv_port)
         else:   # decode
               self._start_listener(config.kv_ip, config.kv_port)


   def _connect_to_decode(self, ip: str, port: int):
         """Prefill  节点: 连接到Decode节点"""
         self.decode_conn = self.transfer_engine.connect(
               addr=f"{ip}:{port}",
               mode='rdma',   #   优先使用RDMA
         )


   def _start_listener(self, ip: str, port: int):
         """Decode  节点: 启动监听"""
         self.listener = self.transfer_engine.listen(
               addr=f"{ip}:{port}",
               on_receive=self._on_kv_received,
         )


   def send_kv_cache(
         self,
         request_id: str,
         kv_cache: torch.Tensor,
         metadata: Dict[str, Any],
   ) -> bool:
         """
         发送KV Cache到Decode节点
         Args:
             request_id:请求唯一标识    
             kv_cache: KV Cache 张量 [2, n_layers, n_heads, seq_len, d_head]
             metadata: 附加元数据（序列长度、模型版本等）


   Returns:
         发送是否成功
   """
   # 1.   压缩KV Cache
   if self.config.kv_compression == 'fp8':
         kv_cache = self._compress_fp8(kv_cache)


   # 2.   准备传输描述符
   transfer_desc = TransferDescriptor(
         request_id=request_id,
         data_ptr=kv_cache.data_ptr(),
         data_size=kv_cache.numel() * kv_cache.element_size(),
         metadata=metadata,
   )


   # 3.   执行传输
   try:
         self.transfer_engine.send(self.decode_conn, transfer_desc)
         return True
   except TransferError as e:
         logger.error(f"KV transfer failed: {e}")
         return False


    def receive_kv_cache(
       self,
       request_id: str,
       timeout: Optional[float] = None,
        ) -> Optional[torch.Tensor]:
        """
        接收KV Cache（Decode节点调用）
        Args:
        request_id:请求唯一标识
        timeout: 超时时间
        Returns:
        KV Cache张量，超时返回None
        """
        #   等待KV Cache到达
       kv_cache = self._wait_for_kv(request_id, timeout)
    
       if kv_cache is None:
             return None
    
       #   解压缩
       if self.config.kv_compression == 'fp8':
              kv_cache = self._decompress_fp8(kv_cache)
       return kv_cache


     def _compress_fp8(self, tensor: torch.Tensor) -> torch.Tensor:               
          """FP8压缩"""
          # 使用NVIDIA的FP8格式
          scale = tensor.abs().max() / 448.0   # E4M3格式最大值                                              
          compressed = (tensor / scale).to(torch.float8_e4m3fn)
          return compressed, scale


      def _decompress_fp8(
          self,
          compressed: torch.Tensor,
          scale: float
      ) -> torch.Tensor:
          """FP8  解压缩"""
          return compressed.to(torch.float16) * scale
```

## 4.5.4 PyNcclConnector 实现
PyNcclConnector是基于NCCL的KV Cache传输实现，适用于单机多GPU场景。

```python
# vllm/distributed/kv_transfer/pynccl_connector.py

class PyNcclConnector(KVConnectorBase):
   """
   基于NCCL的KV Cache传输连接器
   适用场景:
   - 单机多GPU PD分离
   - NVLink高速互联
   """


   def __init__(self, config: KVTransferConfig):
         super().__init__(config)

         #   初始化NCCL通信组
         self.nccl_comm = self._init_nccl_comm()


   def _init_nccl_comm(self) -> nccl.Comm:
         """初始化NCCL通信组"""
         # 获取GPU设备
         local_rank = int(os.environ.get('LOCAL_RANK', 0))
         torch.cuda.set_device(local_rank)

         #   初始化NCCL
         comm = nccl.Comm(
               nranks=self.world_size,
               rank=self.rank,
         )
         return comm


   def send_kv_cache(
         self,
         request_id: str,
         kv_cache: torch.Tensor,
         dst_rank: int,
   ) -> bool:
         """使用NCCL发送KV Cache"""
         # NCCL发送
         nccl.send(
               sendbuf=kv_cache.data_ptr(),
               count=kv_cache.numel(),
               datatype=nccl.float16,
               dst=dst_rank,
               comm=self.nccl_comm,
         )
         return True


   def receive_kv_cache(
           self,
           request_id: str,
           shape: Tuple[int, ...],
           src_rank: int,
        ) -> torch.Tensor:
           """使用NCCL接收KV Cache"""
           # 预分配接收缓冲区
           recv_buffer = torch.empty(
                 shape,
                 dtype=torch.float16,
                 device='cuda',
           )

           # NCCL接收
           nccl.recv(
                 recvbuf=recv_buffer.data_ptr(),
                 count=recv_buffer.numel(),
                 datatype=nccl.float16,
                 src=src_rank,
                 comm=self.nccl_comm,
           )
           return recv_buffer

```

## 4.5.5 集成配置示例
```python
# 完整的vLLM + Mooncake PD分离配置

# docker-compose.yml
version: '3.8'

services:
  prefill-server:
    image: vllm/vllm-openai:latest
    runtime: nvidia
    environment:
      - CUDA_VISIBLE_DEVICES=0,1,2,3
      - VLLM_KV_CONNECTOR=mooncake
      - VLLM_KV_ROLE=prefill
      - VLLM_KV_DECODE_IP=decode-server
      - VLLM_KV_DECODE_PORT=50051
    command: >
      python -m vllm.entrypoints.openai.api_server
      --model meta-llama/Llama-2-70b
      --tensor-parallel-size 4
      --max-num-seqs 64
      --max-num-batched-tokens 8192
      --port 8000
    networks:
      - pd-network

  decode-server:
    image: vllm/vllm-openai:latest
    runtime: nvidia
    environment:
      - CUDA_VISIBLE_DEVICES=4,5,6,7
      - VLLM_KV_CONNECTOR=mooncake
      - VLLM_KV_ROLE=decode
      - VLLM_KV_LISTEN_PORT=50051
    command: >
      python -m vllm.entrypoints.openai.api_server
      --model meta-llama/Llama-2-70b
      --tensor-parallel-size 4
      --max-num-seqs 256
      --max-num-batched-tokens 2048
      --port 8001
    networks:
      - pd-network

  mooncake-transfer:
    image: mooncake/transfer-engine:latest
    privileged: true
    environment:
      - MOONCAKE_RDMA_DEVICE=mlx5_0
      - MOONCAKE_BUFFER_SIZE=16G
    volumes:
        - /dev/infiniband:/dev/infiniband
    networks:
        - pd-network
networks:
   pd-network:
      driver: bridge
```



