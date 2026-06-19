# KV Cache 的网络传输优化

## 5.7.1 RDMA 传输
RDMA (Remote Direct Memory Access) 是实现高性能KV Cache传输的关键技术。

### RDMA 核心优势：
![](https://images.spumn.eu.cc/ml/ai-infra/1781684845057-8ca78339-372c-4b5c-b28e-ae350318a929.svg)

RDMA  实现类型：

| 类型 | 协议 | 优势 | 劣势 |
| :--- | :--- | :--- | :--- |
| InfiniBand | IB verbs | 最低延迟 (~1μs) | 需要专用硬件 |
| RoCEv2 | Ethernet | 兼容现有网络 | 稍高延迟 (~2-5μs) |
| iWARP | Ethernet | 标准TCP/IP | 最高延迟 (~10μs) |


### RDMA 在KV Cache传输中的应用
```python
#   使用PyTorch RPC with TensorPipe进行RDMA传输
import torch.distributed.rpc as rpc


def send_kv_cache_rdma(kv_cache: torch.Tensor, dst_rank: int):
        """使用RDMA发送KV Cache到远程节点"""
        # TensorPipe会自动选择最佳传输方式（包括RDMA）
        rpc.rpc_sync(
              f"worker{dst_rank}",
              receive_kv_cache,
              args=(kv_cache,),
        )


  #   更底层的RDMA实现（使用ibverbs）
  class RDMATransport:
        def __init__(self, device_name: str = "mlx5_0"):
              self.ctx = ibv_open_device(device_name)
              self.pd = ibv_alloc_pd(self.ctx)
              self.cq = ibv_create_cq(self.ctx, 100)
              self.qp = self._create_qp()


        def register_memory(self, tensor: torch.Tensor) -> MR:
              """ 注册GPU内存用于RDMA"""
              return ibv_reg_mr(
                    self.pd,
                    tensor.data_ptr(),
                    tensor.numel() * tensor.element_size(),
                    IBV_ACCESS_LOCAL_WRITE | IBV_ACCESS_REMOTE_READ
              )


        def send(self, mr: MR, remote_addr: int, rkey: int, length: int):
              """ 执行RDMA写操作"""
              sge = ibv_sge(addr=mr.addr, length=length, lkey=mr.lkey)
              wr = ibv_send_wr(
                    opcode=IBV_WR_RDMA_WRITE,
                    sg_list=[sge],
                    wr_id=1,
                    send_flags=IBV_SEND_SIGNALED,
                    imm_data=0,
              )
              wr.wr.rdma.remote_addr = remote_addr
              wr.wr.rdma.rkey = rkey
              ibv_post_send(self.qp, wr)
```

## 5.7.2 零拷贝技术
零拷贝技术避免数据在传输过程中的不必要拷贝。

### 零拷贝实现方式
GPU Direct RDMA (GDR)：

![](https://images.spumn.eu.cc/ml/ai-infra/1781686004402-051076c0-85f9-4e6b-bf07-9e20da35f6a6.svg)

### GDR 性能提升：
| 传输方式 | 带宽 | 延迟 | CPU 占用 |
| :--- | :--- | :--- | :--- |
| 传统 (GPU → CPU → NIC) | 12 GB/s | 50 μs | 高 |
| GPUDirect RDMA | 24 GB/s | 5 μs | 极低 |


## 5.7.3 批量传输
批量传输可以减少网络传输的开销。

### 批量传输策略 ：
```python
class BatchKVTransfer:
    """批量KV Cache传输优化"""
    def __init__(self, batch_size: int = 10, timeout_ms: int = 10):
          self.batch_size = batch_size
          self.timeout_ms = timeout_ms
          self.pending_transfers = []
          self.lock = threading.Lock()


    def schedule_transfer(self, kv_cache: torch.Tensor, dst: int):
          """ 调度KV Cache传输"""
          with self.lock:
                self.pending_transfers.append((kv_cache, dst))

                if len(self.pending_transfers) >= self.batch_size:
                      self._flush_batch()


    def _flush_batch(self):
          """ 执行批量传输"""
          if not self.pending_transfers:
                return

          #   合并同一目标的KV Cache
          grouped = self._group_by_destination(self.pending_transfers)

          for dst, kvs in grouped.items():
                #   拼接KV Cache进行批量传输
                batched_kv = torch.cat(kvs, dim=0)
                self._send_batch(batched_kv, dst)

          self.pending_transfers = []


    def _send_batch(self, batched_kv: torch.Tensor, dst: int):
          """发送批量KV Cache"""
          # 使用RDMA进行批量传输
          # 单次传输开销分摊到多个KV Cache
          pass
```

### 批量传输效果：
| 传输模式 | 单次传输开销 | 10个KV Cache总开销 | 效率 |
| :--- | :--- | :--- | :--- |
| 单独传输 | 10 μs × 10 | 100 μs + 传输时间 | 基准 |
| 批量传输 | 10 μs × 1 | 10 μs + 传输时间 | 1.8x |


## 5.7.4 异步传输
异步传输允许计算和传输重叠，最大化资源利用率。

```python
class AsyncKVTransfer:
        """异步KV Cache传输"""
        
        def __init__(self):
              self.transfer_queue = Queue()
              self.cuda_stream = torch.cuda.Stream()
              self.transfer_thread = threading.Thread(target=self._transfer_loop)
              self.transfer_thread.start()

        def prefetch_kv_cache(self, key: str, remote_addr: str):
              """预取KV Cache"""
              # 提交异步传输请求
              future = Future()
              self.transfer_queue.put((key, remote_addr, future))
              return future

        def _transfer_loop(self):
            """ 后台传输线程"""             
            while True:
                key, remote_addr, future = self.transfer_queue.get()
                
                with torch.cuda.stream(self.cuda_stream):
                   #   在独立CUDA流上执行传输
                   kv_cache = self._fetch_from_remote(remote_addr)
                    
                   #   记录事件用于同步
                   event = torch.cuda.Event()
                   event.record()

                future.set_result((kv_cache, event))

        def wait_for_transfer(self, future: Future):
              """等待传输完成"""            
              kv_cache, event = future.result()
              event.synchronize()     #   确保传输完成
              return kv_cache
```

### 异步传输性能
### 同步传输 vs 异步传输：
![](https://images.spumn.eu.cc/ml/ai-infra/1781686920468-dcaa67cb-52b8-42f5-aa8d-5e09021450b8.svg)

