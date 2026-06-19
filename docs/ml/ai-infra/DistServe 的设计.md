# DistServe 的设计

DistServe是清华大学和月之暗面联合研发的PD分离服务系统，专注于在线服务的延迟优化和资源效率。它在Mooncake的基础上进一步引入了准入控制和KV Sharing机制。

## 4.6.1 DistServe 架构概览
![](https://images.spumn.eu.cc/ml/ai-infra/1781624489830-11ed9b77-e1f8-4d8f-a458-70812dd2279b.svg)

核心创新：

1. Admission Control：基于SLO**(Service Level Objective)**的在线准入控制
2. KV Sharing：跨请求KV Cache复用机制
3. Predictive Scheduling：预测性调度优化

## 4.6.2 在线准入控制
DistServe的准入控制器是其核心创新之一，它能够在请求到达时预测其对系统的影响，并做出接受/拒绝决策。

### 准入控制流程
![](https://images.spumn.eu.cc/ml/ai-infra/1781624865899-acb0f619-a2c3-494c-9ef6-4610ea52a7cc.svg)

### 负载预测模型
```python
class LoadPredictor:
   """
   负载预测器
   使用历史数据和在线学习预测请求的资源需求
   """
    
   def __init__(self):
        #   历史性能数据
         self.prefill_time_model = self._build_prefill_model()
         self.decode_time_model = self._build_decode_model()


   def _build_prefill_model(self):
         """构建Prefill时间预测模型"""
         # 基于线性回归的简化模型
         # T_prefill = a * n² + b * n + c
         #   其中n是输入序列长度
         return LinearRegressionModel(
               features=['input_len_sq', 'input_len', 'model_size'],
               target='prefill_time'
         )


   def predict_prefill_time(
         self,
         input_len: int,
         model_config: ModelConfig,
         node_config: NodeConfig,
   ) -> float:
         """
         预测Prefill执行时间
         Args:
               input_len: 输入序列长度
               model_config: 模型配置
               node_config: 节点配置（GPU类型、数量等）

         Returns:
               预测的Prefill时间（毫秒）
         """
         #   基础计算时间
         compute_time = (
               2 * input_len * model_config.hidden_size ** 2 +
               input_len ** 2 * model_config.num_heads * model_config.head_dim
         ) / (node_config.gpu_flops * 0.8)  # 80% 利用率
                                                  

         #   批处理等待时间
         wait_time = self.estimate_wait_time('prefill')


         # KV Cache 传输时间
         kv_cache_size = (
               2 * model_config.num_layers * input_len *
               model_config.hidden_size * 2      # fp16
         )
         transfer_time = kv_cache_size / node_config.network_bandwidth


         return compute_time + wait_time + transfer_time


      def predict_decode_time(
         self,
         output_len: int,
         current_batch_size: int,
         model_config: ModelConfig,
         node_config: NodeConfig,
      ) -> float:
         """预测Decode执行时间"""
         # 每token内存访问时间
         memory_time = (
               2 * model_config.num_layers * model_config.hidden_size *
               output_len * 2   # fp16
         ) / node_config.memory_bandwidth


         #   批处理开销
         batch_overhead = 0.001 * current_batch_size      # 1ms per request

         return memory_time + batch_overhead

```

### SLO 执行器
```python
class SLOEnforcer:
   """
   SLO执行器
   确保接受的请求能够满足其SLO承诺
   """

   def __init__(self):
         self.slo_definitions = {
               'interactive': {'ttft': 100, 'itl': 20},   # 交互式
               'standard': {'ttft': 500, 'itl': 50},      # 标准
               'batch': {'ttft': 5000, 'itl': 200},       # 批处理
         }

   def check_slo_feasibility(
         self,
         request: Request,
         current_load: SystemLoad,
         predictor: LoadPredictor,
   ) -> Tuple[bool, str]:
         """
         检查请求是否可以在SLO内完成
         Returns:
               是否可行, 原因)
               (
         """
         slo = self.slo_definitions[request.slo_tier]

         #   预测TTFT
         predicted_ttft = predictor.predict_prefill_time(
               request.input_len,
               request.model_config,
               current_load.prefill_nodes[0].config,
         )


         if predicted_ttft > slo['ttft']:
               return False, f"TTFT  预测({predicted_ttft}ms)超过SLO({slo['ttft']
         #   预测ITL
         predicted_itl = predictor.predict_decode_time(
               request.expected_output_len,
               current_load.decode_batch_size,
               request.model_config,
               current_load.decode_nodes[0].config,
         )


         if predicted_itl > slo['itl']:
               return False, f"ITL  预测({predicted_itl}ms)超过SLO({slo['itl']}ms)"

                             
             return True, "SLO 可行"

```

## 4.6.3 KV Sharing 机制
KV Sharing是DistServe的另一项核心创新，通过跨请求复用KV Cache来减少重复计算。

### 共享场景分析
![](https://images.spumn.eu.cc/ml/ai-infra/1781625967246-b874c769-185d-4c0a-9e6a-9da12b3ca604.svg)

### KV Sharing 管理器
```python
class KVSharingManager:
    """
    KV Cache    共享管理器
    管理KV Cache的存储、索引和复用
    """

    def __init__(self, max_cache_size_gb: float = 100):
         self.max_cache_size = max_cache_size_gb * 1024 * 1024 * 1024
         self.cache_store = {}     # prefix_hash → KVCache
         self.access_history = {}      #   访问历史（用于LRU）
         self.current_size = 0


   def compute_prefix_hash(self, tokens: List[int]) -> str:
         """计算token序列的哈希值"""
         # 使用SHA256哈希
         token_bytes = np.array(tokens).tobytes()
         return hashlib.sha256(token_bytes).hexdigest()


   def find_longest_match(
         self,
         tokens: List[int]
   ) -> Tuple[Optional[str], int]:
         """
         查找最长的匹配前缀
         Returns:
               (匹配的cache_key, 匹配长度)               
         """
         best_match = None
         best_len = 0


         #   从最长前缀开始匹配
         for length in range(len(tokens), 0, -1):
               prefix = tokens[:length]
               key = self.compute_prefix_hash(prefix)

               if key in self.cache_store:
                   best_match = key
                   best_len = length
                   break

         return best_match, best_len


   def store_kv_cache(
         self,
         tokens: List[int],
         kv_cache: torch.Tensor,
         metadata: Dict,
   ):
            """ 存储KV Cache"""
            key = self.compute_prefix_hash(tokens)

            #   检查容量
            cache_size = kv_cache.numel() * kv_cache.element_size()
            while self.current_size + cache_size > self.max_cache_size:
                  self._evict_lru_entry()


            #   存储
            self.cache_store[key] = {
                  'kv_cache': kv_cache,
                  'metadata': metadata,
                  'size': cache_size,
            }
            self.access_history[key] = time.time()
            self.current_size += cache_size


        def get_kv_cache(
            self,
            key: str
        ) -> Optional[torch.Tensor]:
            """ 获取KV Cache"""
            if key not in self.cache_store:
                  return None

            #   更新访问时间
            self.access_history[key] = time.time()


            return self.cache_store[key]['kv_cache']


        def _evict_lru_entry(self):
            """ 驱逐最久未使用的条目"""
            if not self.access_history:
                  return

            #   找到最久未使用的
            lru_key = min(self.access_history, key=self.access_history.get)


            #   驱逐
            evicted = self.cache_store.pop(lru_key)
            self.access_history.pop(lru_key)
            self.current_size -= evicted['size']
```

## 4.6.4 性能提升分析
DistServe 相比基线系统的性能提升:

| 指标 | vLLM基线 | DistServe | 提升 |
| :--- | :--- | :--- | :--- |
| TTFT P99 | 800ms | 120ms | 6.7x |
| ITL P99 | 80ms | 25ms | 3.2x |
| 吞吐量 | 100% | 220% | 2.2x |
| GPU利用率 | 45% | 85% | 1.9x |
| KV Cache命中率 | 0% | 35% | - |
| 计算节省 | 0% | 30% | - |


### KV Sharing 效果分析
在实际生产环境中，KV Sharing可以带来显著收益：

| 应用场景 | 共享比例 | 计算节省 |
| :--- | :--- | :--- |
| 客服对话 | 40-60% | 25-35% |
| 代码生成 | 20-30% | 15-20% |
| RAG检索 | 50-70% | 35-45% |
| 教育辅导 | 30-50% | 20-30% |


