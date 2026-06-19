# Prefix Caching 技术

## 5.4.1 共享前缀检测
Prefix Caching 是一种利用**请求间**KV Cache共享的技术，特别适用于具有共同前缀的场景。

### 典型应用场景：
```latex
  多轮对话示例：
  ┌─────────────────────────────────────────────────────────────┐
  │ 系统Prompt（所有请求共享）:                                    │
  │ "你是一个有帮助的AI助手..."                                            │
  │                                                                      │
  │     Round 1:                                                         │
  │     User: "你好" → 系统Prompt + "你好"的KV Cache计算并缓存               │
  │                                                                      │
  │     Round 2:                                                         │         
        User: "今天天气如何" → 复用系统Prompt的KV Cache                                                  │
  │     只需要计算"今天天气如何"的KV Cache                                   │
  │                                                                      │
  │     Round 3:                                                             
        User: "推荐一家餐厅" → 复用系统Prompt的KV Cache                                                  │
  │     只需要计算"推荐一家餐厅"的KV Cache                          │
  └─────────────────────────────────────────────────────────────┘
```

### Prefix Caching 的实现原理：
![](https://images.spumn.eu.cc/ml/ai-infra/1781682073875-fc984fad-31cb-432a-a822-66a65d563bc1.svg)

## 5.4.2 跨请求KV Cache复用
Prefix Caching 的核心是**跨请求复用**KV Cache：

```latex
     请求级别的KV Cache复用：
     ┌─────────────────────────────────────────────────────────────┐
     │    请求1: "你是一个AI助手。请解释量子计算。"                                             │
     │    ┌────────────────────────────────────────────────────┐                   │
     │    │████████████████████████████████████░░░░░░░░░░░░░░░░│                   │
     │    │← 共享前缀 → │ ← 唯一部分 → │                                                                      │
     │    │ KV Cache缓存 │ 新计算     │                                            │
     │    └────────────────────────────────────────────────────┘                   │
     │                                                                             │
     │    请求2: "你是一个AI助手。请解释机器学习。"                                             │
     │    ┌────────────────────────────────────────────────────┐                   │
     │    │████████████████████████████████████░░░░░░░░░░░░░░░░│                   │
     │    │   ←复用请求1的缓存 → │ ← 新计算 → │                                  │
     │    │   直接复用！        │ 只计算这部分 │                                      │
     │    └────────────────────────────────────────────────────┘                   │
     │                                                                             │
     │    请求3: "你是一个AI助手。请解释深度学习。"                                             │
     │    ┌────────────────────────────────────────────────────┐                   │
     │    │████████████████████████████████████░░░░░░░░░░░░░░░░│                   │
     │    │   ←复用请求1的缓存 → │ ← 新计算 → │                                  │
     │    │   直接复用！        │ 只计算这部分 │                                      │
     │    └────────────────────────────────────────────────────┘                   │
     └─────────────────────────────────────────────────────────────┘
```

复用效率计算：

假设系统Prompt长度为100 tokens，平均请求长度为500 tokens：

| 场景 | 无Prefix Caching | 有Prefix Caching | 节省计算 |
| :--- | :--- | :--- | :--- |
| 单请求 | 500 tokens | 500 tokens | 0% |
| 10请求 | 5000 tokens | 1000 + 10×400 = 5000 tokens | 0% |
| 100请求 | 50000 tokens | 1000 + 100×400 = 41000 tokens | 18% |
| 1000请求 | 500000 tokens | 1000 + 1000×400 = 401000 tokens | 19.8% |


> 注：实际节省取决于共享前缀的长度和请求多样性
>

## 5.4.3 应用场景
### 多轮对话系统
```python
#   多轮对话中的Prefix Caching
 class Conversation:
       def __init__(self, system_prompt: str):
          self.system_prompt = system_prompt
          self.history = []
          self.cached_kv = compute_kv_cache(system_prompt)         #   只计算一次
           
       def add_message(self, user_msg: str, assistant_msg: str):
          #   复用之前的KV Cache
          user_kv = compute_kv_cache(user_msg, prefix_kv=self.cached_kv)
          assistant_kv = compute_kv_cache(assistant_msg, prefix_kv=user_kv)
          self.history.append((user_msg, assistant_msg))
          self.cached_kv = assistant_kv        #   更新缓存

```

### 文档分析与RAG
```latex
     RAG 场景中的Prefix Caching：
     ┌─────────────────────────────────────────────────────────────┐
     │   文档1: "人工智能的发展历史..."                                           │
     │   ┌────────────────────────────────────────────────────┐                │
     │   │████████████████████████████████████████████████████│                │
     │   │   文档1的KV Cache（缓存）                                  │           │
     │   └────────────────────────────────────────────────────┘                │
     │                                                                         │
     │ 查询1: "文档1中提到的第一个AI程序是什么？"                                   │
     │ → 复用文档1的KV Cache，只需计算查询的KV                                  │
     │                                                                         │
     │ 查询2: "文档1中提到的AI寒冬是什么时候？"                                    │
     │ → 复用文档1的KV Cache，只需计算查询的KV                                  │
     │                                                                         │
     │ 查询3: "文档1中提到的深度学习突破是什么？"                                  │
     │  →复用文档1的KV Cache，只需计算查询的KV                                 │
     └─────────────────────────────────────────────────────────────┘
```

### 批量推理优化
```python
#   批量推理中的Prefix Caching
 class BatchPrefixCache:
      def __init__(self):
           self.prefix_cache = {}     # prefix_hash -> kv_cache


      def batch_generate(self, prompts: List[str]):
           #   分组具有相同前缀的请求
           groups = self._group_by_prefix(prompts)

           for prefix, unique_parts in groups.items():
                if prefix in self.prefix_cache:
                     #   复用缓存的前缀KV
                     prefix_kv = self.prefix_cache[prefix]
                else:
                     #   计算并缓存前缀KV
                     prefix_kv = compute_kv_cache(prefix)
                     self.prefix_cache[prefix] = prefix_kv

                #   批量计算剩余部分
                batch_generate(unique_parts, prefix_kv=prefix_kv)
```

