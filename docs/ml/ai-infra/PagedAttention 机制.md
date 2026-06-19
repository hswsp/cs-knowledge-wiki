# PagedAttention 机制

## 5.3.1 虚拟内存启发的设计
PagedAttention 是 vLLM 提出的核心创新，灵感来源于操作系统中的虚拟内存和分页机制。

### 传统KV Cache管理的问题
![](https://images.spumn.eu.cc/ml/ai-infra/1781681099476-48d61680-9269-48e0-8a15-bb653bca2c5d.svg)

### PagedAttention 的核心思想：
将KV Cache分割成固定大小的**块（Block）**，类似于操作系统中的内存页：

![](https://images.spumn.eu.cc/ml/ai-infra/1781680919764-c4b58725-23ed-46b5-a92e-01433a1acc74.svg)

## 5.3.2 Block Table 管理
PagedAttention 使用Block Table来映射逻辑块到物理块：

```python
#   简化的Block Table概念
from typing import List

class BlockTable:
    def __init__(self, block_size: int = 16):
        self.block_size = block_size
        self.logical_to_physical = {}        # 逻辑块ID → 物理块ID
        self.physical_blocks = []            # 已分配的物理块列表

    def _allocate_physical_blocks(self, num_blocks: int) -> List[int]:
        """分配指定数量的物理块，返回物理块ID列表（简化实现：ID连续递增）"""
        start_id = len(self.physical_blocks)
        new_blocks = list(range(start_id, start_id + num_blocks))
        return new_blocks

    def allocate(self, num_tokens: int) -> List[int]:
        """为新token分配物理块"""
        num_blocks_needed = (num_tokens + self.block_size - 1) // self.block_size
        new_blocks = self._allocate_physical_blocks(num_blocks_needed)
        for i, block in enumerate(new_blocks):
            logical_id = len(self.physical_blocks) + i
            self.logical_to_physical[logical_id] = block
        self.physical_blocks.extend(new_blocks)
        return new_blocks

    def get_physical_block(self, logical_block_id: int) -> int:
        """获取逻辑块对应的物理块"""
        return self.logical_to_physical[logical_block_id]
```

### Block Table的优势：
1. **消除外部碎片**：物理块不需要连续
2. **动态扩展**：序列可以动态增长，只需分配新的物理块
3. **内存共享**：不同请求可以共享相同的物理块
4. **Copy-on-Write**：只在需要修改时才复制块

## 5.3.3 内存碎片问题解决
PagedAttention 通过以下机制解决内存碎片问题：

### 内部碎片最小化
![](https://images.spumn.eu.cc/ml/ai-infra/1781681217835-c1036dcf-c05f-4460-b178-963de5ea9d00.svg)

### 外部碎片消除
![](https://images.spumn.eu.cc/ml/ai-infra/1781681519637-032d3c8f-a8b3-4d97-9588-a5d169a9cee9.svg)

## 5.3.4 vLLM 的实现
vLLM 的PagedAttention实现包含以下关键组件：

### Block Allocator
```python
class BlockAllocator:
       """管理物理KV Cache块的分配和回收"""
       def __init__(self, num_blocks: int, block_size: int):
             self.num_blocks = num_blocks
             self.block_size = block_size
             self.free_blocks = list(range(num_blocks))   #   空闲块列表
             self.block_ref_count = [0] * num_blocks      #   每个块的引用计数
           
       def allocate(self) -> int:               
             """分配一个空闲块"""
             if not self.free_blocks:
                   raise OutOfMemoryError("No free blocks available")
             block = self.free_blocks.pop()
             self.block_ref_count[block] = 1
             return block

       def free(self, block: int):               
             """释放一个块（引用计数减1）"""
             self.block_ref_count[block] -= 1
             if self.block_ref_count[block] == 0:
                   self.free_blocks.append(block)


       def incr_ref(self, block: int):              
             """增加引用计数（用于共享）"""
             self.block_ref_count[block] += 1

```

### PagedAttention Kernel
```python
# 概念性的PagedAttention计算
def paged_attention(
        query: torch.Tensor,                 # [num_heads, head_dim]
        block_tables: torch.Tensor,          # [num_blocks]
        key_cache: torch.Tensor,             # [num_blocks, block_size, num_heads, head_dim]
        value_cache: torch.Tensor,           # [num_blocks, block_size, num_heads, head_dim]
        context_len: int
  ):
        """
        使用Block Table进行注意力计算
        """
        output = torch.zeros_like(query)
        
        # 获取 head_dim 以便后续计算缩放因子
        _, head_dim = query.shape

        for i in range(context_len):
              block_id = block_tables[i // block_size]
              offset = i % block_size

              key = key_cache[block_id, offset]            # [num_heads, head_dim]
              value = value_cache[block_id, offset] # [num_heads, head_dim]

              # 计算注意力分数
              # 添加缩放因子计算，并使用 torch.sum 进行逐元素相乘求和（概念实现）
              score = torch.sum(query * key, dim=-1) / (head_dim ** 0.5)
              
              # 将分数扩展到 [num_heads, 1] 维度，以便与 value 进行广播乘法
              output += score.unsqueeze(-1) * value

        return output

```

### 3. vLLM 的性能提升
| 工作负载 | 传统实现 | vLLM PagedAttention | 提升 |
| :--- | :--- | :--- | :--- |
| ShareGPT (高共享) | 45 req/s | 120 req/s | 2.7x |
| 长文档问答 | 12 req/s | 35 req/s | 2.9x |
| 批处理推理 | 28 req/s | 75 req/s | 2.7x |


