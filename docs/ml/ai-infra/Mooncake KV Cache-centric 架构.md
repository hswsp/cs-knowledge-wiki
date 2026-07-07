# Mooncake KV Cache-centric 架构

## 5.8.1 全局KV Cache Pool
Mooncake是月之暗面（Moonshot AI）开发的高性能LLM推理系统，其核心设计理念是以KV Cache为中心的架构。

### 全局KV Cache Pool架构
![](https://images.spumn.eu.cc/ml/ai-infra/1781687249928-4952e35b-c252-40f4-aa5d-1d5efbb2d93d.svg)

## 5.8.2 以存换算的设计理念
Mooncake 的核心设计理念是"以存换算"（Store-to-Compute），通过增加存储来减少重复计算。

### 以存换算的核心思想
![](https://images.spumn.eu.cc/ml/ai-infra/1781687749172-253f416b-3cec-4911-8235-1c9e782bbe25.svg)

### 以存换算的收益计算：
假设： 

+ 系统 Prompt 长度： 500 tokens 
+ 平均请求长度： 2000 tokens 
+ 缓存命中率：60% 
+ 计算成本：`$0.001/token `
+ 存储成本：`$0.0001/GB/小时`

| 指标 | 传统方式 | 以存换算 | 节省 |
| :--- | :--- | :--- | :--- |
| 每请求计算tokens | 2000 | 800 (40%需要计算) | 60% |
| 每请求计算成本 |$2.00 |$0.80 |$1.20 |
| 存储成本 (1M请求/天) |$0 |$500/天 | -$500 |
| 净节省 | - | - | **$700/天** |


## 5.8.3 缓存命中率优化
Mooncake通过多种策略优化KV Cache的命中率。

### 缓存策略
```python
class MooncakeKVPool:
    """Mooncake 全局KV Cache Pool实现"""
    def __init__(self):
        self.prefix_cache = LRUCache(maxsize=10000)       #   前缀缓存
        self.session_cache = {}         #   会话缓存
        self.cache_stats = CacheStats()


    def get_kv_cache(self, request: Request) -> Optional[KVCache]:
        """获取KV Cache，优先命中缓存"""
        # 1. 尝试匹配完整会话缓存
        session_key = request.session_id
        if session_key in self.session_cache:
              self.cache_stats.hit("session")
              return self.session_cache[session_key]

        # 2.   尝试匹配最长公共前缀
        prefix_key = self._find_longest_prefix(request.prompt)
        if prefix_key:
              self.cache_stats.hit("prefix")
              cached_kv = self.prefix_cache[prefix_key]
              #   只计算剩余部分的KV
              remaining_kv = self._compute_remaining_kv(
                   request.prompt,
                   prefix_key,
                   cached_kv
              )
              return torch.cat([cached_kv, remaining_kv], dim=0)

        self.cache_stats.miss()
        return None


    def put_kv_cache(self, request: Request, kv_cache: KVCache):
        """  存储KV Cache"""
        #   存储会话缓存
        if request.session_id:
              self.session_cache[request.session_id] = kv_cache

        #   存储前缀缓存（用于跨会话共享）
        for prefix_len in [100, 200, 500, 1000]:
              if len(request.prompt) >= prefix_len:
                   prefix = request.prompt[:prefix_len]
                   prefix_key = self._hash_prefix(prefix)
                   self.prefix_cache[prefix_key] = kv_cache[:prefix_len]
```

### 命中率优化技术
| 技术 | 描述 | 命中率提升 |
| :--- | :--- | :--- |
| 前缀树匹配 | 使用Trie结构快速匹配最长前缀 | +15% |
| 模糊匹配 | 允许小差异的前缀匹配 | +5% |
| 会话保持 | 同一会话优先使用缓存 | +20% |
| 热点预加载 | 预加载高频访问的KV Cache | +10% |
| 分层缓存 | GPU/CPU/SSD多级缓存 | +8% |


