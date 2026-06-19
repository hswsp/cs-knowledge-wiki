# 与 vLLM 的集成

## 6.4.1 vLLM 架构简介
vLLM 是一个开源的大语言模型推理和服务库，以其PagedAttention技术而闻名：

vLLM 核心特性：

+ PagedAttention： 将 KV Cache 分页管理， 减少内存碎片 
+ **Continuous Batching：**动态批处理，提高吞吐量
+ Tensor Parallelism：支持张量并行，扩展到多GPU
+ Pipeline Parallelism：支持流水线并行，扩展到多节点

### vLLM架构组件
![](https://images.spumn.eu.cc/ml/ai-infra/1781708848363-2912116a-9aca-47a7-9e26-3b6b70645eff.svg)

## 6.4.2 MooncakeConnector 实现
MooncakeConnector是 vLLM 与 Mooncake Transfer Engine 的集成组件， 实现了 PD（Prefill-Decode）分离架构

```python
# vLLM MooncakeConnector核心实现
 class MooncakeConnectorWorker:
    """Mooncake Transfer Engine 的vLLM Worker端实现"""
     
    def __init__(self, vllm_config: VllmConfig, engine_id: str):
        logger.info("Initializing Mooncake Transfer Engine worker %s", engi

        self.vllm_config = vllm_config
        self.engine = TransferEngine()
        self.hostname = get_ip()

        #   配置传输协议（默认RDMA）
        protocol = self.vllm_config.kv_transfer_config.kv_connector_extra_c
             "mooncake_protocol", "rdma"
        )

        #   初始化Transfer Engine
        ret_value = self.engine.initialize(
             self.hostname,
             "P2PHANDSHAKE",
             protocol,
             ""
        )
        if ret_value != 0:
             raise RuntimeError("Mooncake Transfer Engine initialization fai

        #   获取RPC端口
        self.rpc_port = self.engine.get_rpc_port()

        #   配置角色（Producer/Consumer）
        self.kv_role = vllm_config.kv_transfer_config.kv_role

        #   初始化发送/接收线程池
        if self.kv_role != "kv_consumer":
             self._init_sender_threads()
        if self.kv_role != "kv_producer":
             self._init_receiver_threads()
```

### 关键实现细节：
1. 内存注册：

```python
def register_kv_caches(self, kv_caches: dict[str, torch.Tensor]):
    """ 注册KV Cache到Mooncake Transfer Engine"""
    kv_data_ptrs = []
    kv_data_lens = []
    seen_base_addresses = []

    for layer_name, cache in kv_caches.items():
          base_addr = cache.data_ptr()
          if base_addr in seen_base_addresses:
              continue
          seen_base_addresses.append(base_addr)

          kv_data_ptrs.append(base_addr)
          kv_data_lens.append(cache.nbytes)

    #   批量注册内存区域
    ret_value = self.engine.batch_register_memory(kv_data_ptrs, kv_data_len
    if ret_value != 0:
          raise RuntimeError("Mooncake batch memory registration failed.")

```

2. KV Cache 传输：

```python
async def send_kv_to_decode(self, metadata: MooncakeXferMetadata): 
    """ 发送KV Cache到Decode节点"""
    #   构建传输参数
    src_ptrs, dst_ptrs, lengths = await self._build_transfer_params(
          send_reqs, metadata
    )

    #   执行批量传输
    remote_session = f"{metadata.remote_hostname}:{metadata.remote_port}"
    ret_value = await self.sender_loop.run_in_executor(
          self._sender_executor,
          self._send_blocks,
          remote_session,
          src_ptrs,
          dst_ptrs,
          lengths,
    )

    if ret_value != 0:
          raise RuntimeError(f"Mooncake transfer failed: {ret_value}")


  def _send_blocks(self, remote_session: str,
                         src_ptrs: list[int], dst_ptrs: list[int],
                         lengths: list[int]) -> int:
        """ 执行实际的KV Cache传输"""
        return self.engine.batch_transfer_sync_write(
              remote_session, src_ptrs, dst_ptrs, lengths
        )
```

## 6.4.3 配置和使用方法
### 环境准备：
```python
#   安装Mooncake Transfer Engine
pip install mooncake-transfer-engine

#   或使用Docker
docker pull mooncake/mooncake-transfer-engine:latest
```

### 启动etcd（元数据服务）：
```python
etcd --listen-client-urls http://0.0.0.0:2379 \
    --advertise-client-urls http://localhost:2379
```

### 启动Mooncake Master
```python
mooncake_master --port 50001
```

### 配置mooncake.json：
```python
{
    "metadata_server": "etcd://localhost:2379",
    "master_server": "localhost:50001",
    "protocol": "rdma",
    "device_name": "mlx5_0",
    "gpu_memory_pool_size": 8589934592,
    "cpu_memory_pool_size": 17179869184
}
```

### 启动Prefill实例：
```python
export MOONCAKE_CONFIG_PATH=./mooncake.json
export VLLM_USE_V1=0

python -m vllm.entrypoints.openai.api_server \
    --model Qwen/Qwen2.5-7B-Instruct \
    --port 8100 \
    --max-model-len 10000 \
    --gpu-memory-utilization 0.8 \
    --kv-transfer-config '{
        "kv_connector": "MooncakeStoreConnector",
        "kv_role": "kv_producer"
    }'
```

### 启动Decode实例：
```python
export MOONCAKE_CONFIG_PATH=./mooncake.json
export VLLM_USE_V1=0

python -m vllm.entrypoints.openai.api_server \
    --model Qwen/Qwen2.5-7B-Instruct \
    --port 8200 \
    --max-model-len 10000 \
    --gpu-memory-utilization 0.8 \
    --kv-transfer-config '{
        "kv_connector": "MooncakeStoreConnector",
        "kv_role": "kv_consumer"
    }'
```

### 启动Proxy
```python
python examples/online_serving/disagg_examples/disagg_proxy_demo.py \
--model Qwen/Qwen2.5-7B-Instruct \
--prefill localhost:8100 localhost:8101 \
--decode localhost:8200 localhost:8201 \
--port 8000
```

## 6.4.4 性能对比
Mooncake 与vLLM集成的性能表现：

| 上下文长度 | vLLM基线 (req/s) | Mooncake PD分离 (req/s) | 性能提升 |
| :--- | :--- | :--- | :--- |
| 1K | 1000 | 1200 | +20% |
| 8K | 300 | 500 | +67% |
| 32K | 80 | 200 | +150% |
| 128K | 20 | 100 | +400% |


**关键优化点： 1. PD分离**：Prefill和Decode不再竞争GPU资源 2**. KV Cache复用**：PrefixCaching 减少重复计算 3. **异步传输**： Transfer Engine 实现流水线化 4. **负载均衡**：Conductor优化请求分配

