# 7.1 Attention算法家族
Attention机制是Transformer架构的核心组件，也是大模型推理中最耗时的操作之一。本节深入分析从标准Self-Attention到各种优化变体的演进过程。

## 7.1.1 标准Self-Attention
### 问题背景
Self-Attention机制允许模型在处理序列时关注输入的不同位置，捕获长距离依赖关系。然而，**其计算复杂度和内存占用随序列长度呈平方增长**，成为长上下文推理的主要瓶颈。

### 数学定义
给定输入序列的Query、Key、Value矩阵 $Q, K, V \in \mathbb{R}^{n \times d_k}$，其中$n$ 是序列长度，$d_k$ 是特征维度，标准Self-Attention计算如下：

$\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V$

其中**缩放点积注意力（Scaled Dot-Product Attention）**的完整计算流程为：

1. 计算注意力分数：$S = QK^T / \sqrt{d_k}$
2. 应用Softmax：$P = \text{softmax}(S)$
3. 加权求和：$O = PV$

### 计算复杂度分析
朴素矩阵乘法 ，设

+ $A$的尺寸：$M×K$
+ $B$的尺寸：$K×N$
+ 结果 $C=AB$，尺寸：$M×N$

| **项** | **精确计数** |
| :--- | ---: |
| 乘法 | M⋅N⋅K |
| 加法 | M⋅N⋅(K−1) |
| **总算术操作（乘+加）** | M⋅N⋅(2K−1)=2MNK−MN |
| **近似/常用写法** | O(MNK) |


> 矩阵乘法 $A_{M×K}B_{K×N}$的“计算量”就是 M×N×K次乘加（≈ 2MNK次浮点运算），本质原因是：结果矩阵每个元素是长度为 K的内积。
>

| 操作 | 计算量 | 内存访问 |
| :--- | :--- | :--- |
|$QK^T$|$O(n^2 \cdot d_k)$|$O(n \cdot d_k + n^2)$|
| Softmax |$O(n^2)$|$O(n^2)$|
|$PV$|$O(n^2 \cdot d_v)$|$O(n^2 + n \cdot d_v)$|
| **总计** |$O(n^2 \cdot d)$|$O(n^2)$|


关键观察：当序列长度 $n$ 较大时（如 $n=32768$， $d=4096$），**注意力矩阵 **$S \in\mathbb{R}^{n \times n}$ 需要约 4GB的 HBM内存（ FP32），而实际计算中需要多次读写这些中间结果，导致严重的内存带宽瓶颈。

### 内存占用分析
在推理过程中，KV Cache的存储需求为：

$\text{Memory}{\text{KV}} = 2 \times n \times d_{\text{model}} \times \text{bytes}_{\text{dtype}} \times \text{num}_{\text{layers}}$

以LLaMA-2-70B为例（80层，$d_{\text{model}}=8192$，FP16）：

+ 序列长度 $n=4096$时：约 10.5 GB
+ 序列长度 $n=32768$ 时：约 84 GB

### 标准实现伪代码
```python
def standard_attention(Q, K, V):
        """
        标准Self-Attention实现
        Q, K, V: [batch_size, num_heads, seq_len, head_dim]
        """
        # Step 1:   计算注意力分数
        scores = torch.matmul(Q, K.transpose(-2, -1)) / sqrt(head_dim)

        # Step 2: Softmax   归一化
        attn_weights = F.softmax(scores, dim=-1)

        # Step 3:   加权求和
        output = torch.matmul(attn_weights, V)

        return output

```

### 实际应用与限制
适用场景：

+ 短序列推理（$n < 2048$）
+ 训练阶段的完整注意力计算
+ 需要精确注意力权重的场景

主要限制： 1. 内存墙问题：$O(n^2)$ 的内存复杂度限制上下文长度 2. 计算效率低：大量时间花费在HBM读写而非实际计算 3. 无法流式处理：必须等待完整KV Cache准备好

## 7.1.2 FlashAttention 系列
FlashAttention是由 Stanford HAI团队提出的 IO-aware精确注意力算法，通过分块计算和**重计算**技术，在不近似的情况下显著减少HBM访问。

### 7.1.2.1 FlashAttention-1
#### 核心思想
FlashAttention的核心洞察：内存访问比计算慢得多。在现代 GPU上， HBM带宽（ 1.5-2TB/s）远低于SRAM带宽（19 TB/s）和计算能力（FP16: 300+ TFLOPS）。

关键创新： 1. **Tiling （分块）**：将大的注意力矩阵分解为适合 SRAM 的小块 2. **OnlineSoftmax**：在分块计算中维护softmax的归一化因子 3. **Recomputation**：反向传播时重计算注意力而非存储

#### Tiling策略
将 $Q, K, V$ 分成大小为 $B_r \times d$ 和 $B_c \times d$ 的块，其中 $B_r, B_c$ 满足：

$B_r \times B_c \leq M / 4$

$M$是SRAM容量（如A100的L2 Cache约40MB，但共享内存仅约164KB）。

#### Online Softmax算法
标准softmax需要完整的指数和：

$\text{softmax}(x_i) = \frac{e^{x_i}}{\sum_j e^{x_j}}$

Online Softmax 允许增量计算。对于两个块的结果，设：

+ 块 1： $m_1 = \max(x_1),\ell_1 = \sum e^{x_1-m_1}$
+ 块2：$m_2 = \max(x_2), \ell_2 = \sum e^{x_2 -m_2}$

合并后的统计量：

$m = \max(m_1, m_2)$$$$\ell = e^{m_1 - m} \ell_1 + e^{m_2 - m} \ell_2$

$\ell = e^{m_1 - m} \ell_1 + e^{m_2 - m} \ell_2$

FlashAttention-1 伪代码

```python
def flash_attention_v1(Q, K, V, M):
    """            
    FlashAttention-1实现
    M: SRAM容量（以元素数计）
    """
    N, d = Q.shape                           # 获取序列长度 N 和头维度 d
    B_c = ceil(M / (4 * d))                  # KV块大小：根据SRAM容量计算一次能从HBM加载多少个KV token
    B_r = min(ceil(M / (4 * d)), d)          # Q块大小：通常与B_c相同，但限制不超过d（有时块大小受d约束）
    
    # 初始化输出和统计量
    O = zeros(N, d)                          # 输出矩阵，形状 (N,d)，初始全零
    L = zeros(N)                             # log-sum-exp 归一化因子，形状 (N,)，初始0
    m = full(N, -inf)                        # 每行的最大值，初始为负无穷（用于在线softmax）

    # 分块迭代：外层循环遍历KV块（列方向）
    # 从 0开始，每次增加 B_c，直到小于 N为止（不包括 N）
    for j in range(0, N, B_c):
        K_j = K[j:j+B_c, :]                  # 从HBM加载第j个KV块：K片段 (B_c, d)
        V_j = V[j:j+B_c, :]                  # 加载对应的V片段 (B_c, d)

        # 内层循环遍历Q块（行方向）
        for i in range(0, N, B_r):
            Q_i = Q[i:i+B_r, :]              # 从HBM加载第i个Q块 (B_r, d)
            O_i = O[i:i+B_r, :]              # 当前输出块 (B_r, d)
            m_i = m[i:i+B_r]                 # 当前行的最大值 (B_r,)
            L_i = L[i:i+B_r]                 # 当前行的log-sum-exp (B_r,)

            # 计算当前块的注意力分数
            S_ij = Q_i @ K_j.T               # 矩阵乘法：(B_r, d) × (d, B_c) → (B_r, B_c)，即注意力分数
            m_new = max(m_i, rowmax(S_ij))   # 更新每行的最大值：取旧最大值与新块行最大值的逐元素较大者
            P_ij = exp(S_ij - m_new)         # 减去新最大值后取指数，得到未归一化的注意力权重 (B_r, B_c)
            L_new = exp(m_i - m_new) * L_i + rowsum(P_ij)  # 更新log-sum-exp：旧归一化因子缩放后加上当前块的行和

            # 更新输出
            O_i = (exp(m_i - m_new) * O_i * L_i + P_ij @ V_j) / L_new  # 融合输出：旧输出缩放后加上新贡献，再除以新归一化因子

            # 将更新后的值写回HBM
            m[i:i+B_r] = m_new               # 写回新的行最大值
            L[i:i+B_r] = L_new               # 写回新的log-sum-exp
            O[i:i+B_r, :] = O_i              # 写回更新后的输出块

    return O                                 # 返回最终注意力输出
```

复杂度分析

| 指标 | 标准Attention | FlashAttention-1 |
| :--- | :--- | :--- |
| FLOPs |$O(N^2 d)$|$O(N^2 d)$|
| HBM访问 |$O(N^2)$|$O(N^2 d^2 / M)$|
| 内存占用 |$O(N^2)$|$O(N)$|


关键结论：FlashAttention-1将HBM访问从 $O(N^2)$ 降低到 $O(N^2 d^2 / M)$，在典型配置下（$N=4096, d=64, M=64K$）可减少约50倍HBM访问。

### 7.1.2.2 FlashAttention-2
#### 核心改进
FlashAttention-2针对前向和反向传播进行了进一步优化：

1. **减少非矩阵乘法FLOPs**：将softmax统计量的计算与矩阵乘法更好地融合
2. **更好的并行性**：在batch和head维度上更均衡地分配工作
3. **优化的warp调度**：减少线程束内的分歧

#### 算法优化
主要改进在分块策略：

+ **前向传播：按行分块**，每个warp处理一个行块
+ **反向传播：利用前向的统计量**，避免重复计算

#### 性能提升
FlashAttention-2 相比 v1的典型加速比：

+ 前向传播： 1.5-2.0x
+ 反向传播： 2.0-3.0x
+ 端到端训练：1.3-1.5x

### 7.1.2.3 FlashAttention-3
#### 针对Hopper架构的优化
FlashAttention-3专为NVIDIA Hopper架构（H100）设计，充分利用新硬件特性：

1. **WGMMA（Warp Group Matrix Multiply Accumulate）：**
    - 使用新的异步矩阵乘法指令
    - 支持FP8精度的张量核心加速
2. **FP8低精度支持：**
    - 利用H100的FP8张量核心
    - 动态缩放因子管理
3. 流水线优化：
    - 更激进的指令级并行
    - 减少内存等待时间

#### FP8 量化策略
FlashAttention-3 引入动态缩放：

$Q_{fp8} = Q_{fp16} \times s_Q, \quad s_Q = 448 / \max(|Q|)$

<font style="color:#ED740C;">其中448是FP8 E4M3格式的最大可表示值</font>。

#### 性能数据
在 H100 SXM 上 （ 序列长度 8192， batch size 2， head_dim 128 ）：

+ FP16: ~500TFLOPS
+ FP8: ~900 TFLOPS（接近理论峰值）

#### FlashAttention系列对比
| 特性 | FlashAttention-1 | FlashAttention-2 | FlashAttention-3 |
| :--- | :--- | :--- | :--- |
| **核心优化** | 分块计算 + 在线softmax | 减少非矩阵乘法操作 | 利用FP8 Tensor Core |
| **HBM访问** | O(N²d²/M) | O(N²d²/M) | O(N²d²/M) |
| **计算效率** | 1x（基准） | 2x | 4x |
| **支持FP8** | ❌ | ❌ | ✅ |
| **异步处理** | ❌ | ❌ | ✅ |
| **反向传播** | 重计算 | 重计算 | 重计算 |


### 7.1.3 FlashDecoding
#### 问题背景
FlashAttention在 Prefill 阶段（处理完整序列）表现优异，但在 Decode 阶段（逐个生成token）面临新的挑战

+ **计算并行度低**：Decode阶段每次只处理一个Query
+ **内存带宽瓶颈**：需要从HBM读取完整的KV Cache
+ **GPU利用率不足**：大量计算单元空闲

#### 核心思想
FlashDecoding的核心创新：**在序列长度维度上并行化Decode阶段的注意力计算**。

传统Decode： $o = \text{softmax}(qK^T)V$

FlashDecoding 将 KV Cache 分成多个 chunk，每个 chunk 独立计算部分注意力，然后合并：

$o_i = \text{softmax}(qK_i^T)V_i \quad \text{for each chunk } i$

$o = \text{merge}(o_1, o_2, ..., o_m)$

#### Parallelism Over Context Length
FlashDecoding 引入两种并行策略：

1. **Intra-sequence Parallelism**：单个序列的KV Cache分块并行处理
2. **Inter-sequence Parallelism**：多个序列的Decode并行执行

分块合并算法

对于每个 chunk$i$，计算：

+ 局部最大值： $m_i = \max(qK_i^T)$
+ 局部和： $\ell_i =\sum \exp(qK_i^T - m_i)$
+ 局部输出：$o_i = \exp(qK_i^T - m_i)V_i / \ell_i$

全局合并： $m = \max_i(m_i)$$$$\ell = \sum_i \exp(m_i - m) \ell_i$$$$o = \sum_i\exp(m_i - m) \ell_i o_i / \ell$

#### FlashDecoding 伪代码
```python
import math
import torch

def flash_decoding(q, K_cache, V_cache, chunk_size):
    """
    FlashDecoding 实现
    q: [batch, num_heads, 1, head_dim] - 单个query
    K_cache, V_cache: [batch, num_heads, seq_len, head_dim]
    """
    batch, num_heads, _, head_dim = q.shape
    seq_len = K_cache.shape[2]
    num_chunks = math.ceil(seq_len / chunk_size)

    # 分配临时存储
    local_max = torch.zeros(batch, num_heads, num_chunks, device=q.device, dtype=q.dtype)
    local_sum = torch.zeros(batch, num_heads, num_chunks, device=q.device, dtype=q.dtype)
    local_out = torch.zeros(batch, num_heads, num_chunks, head_dim, device=q.device, dtype=q.dtype)

    # 并行处理每个chunk
    for chunk_idx in range(num_chunks):
        start = chunk_idx * chunk_size
        end = min(start + chunk_size, seq_len)

        K_chunk = K_cache[:, :, start:end, :]   # [batch, heads, chunk_size, head_dim]
        V_chunk = V_cache[:, :, start:end, :]   # [batch, heads, chunk_size, head_dim]

        # 局部注意力计算
        scores = q @ K_chunk.transpose(-2, -1) / math.sqrt(head_dim)  # [batch, heads, 1, chunk_size]

        # 补全1: 取最大值（去掉最后一个维度）
        local_max[:, :, chunk_idx] = torch.max(scores, dim=-1).values.squeeze(-1)  # [batch, heads]

        # 计算局部 softmax
        exp_scores = torch.exp(scores - local_max[:, :, chunk_idx].unsqueeze(-1).unsqueeze(-1))
        # exp_scores: [batch, heads, 1, chunk_size]

        local_sum[:, :, chunk_idx] = torch.sum(exp_scores, dim=-1).squeeze(-1)  # [batch, heads]

        # 补全2: 局部输出 = (exp_scores @ V_chunk) / local_sum
        # exp_scores @ V_chunk -> [batch, heads, 1, head_dim]
        weighted_V = exp_scores @ V_chunk
        # 需要将 local_sum 扩展为 [batch, heads, 1, 1] 以广播除法
        local_out[:, :, chunk_idx, :] = (weighted_V / local_sum[:, :, chunk_idx].unsqueeze(-1).unsqueeze(-1)).squeeze(-2)
        # squeeze(-2) 去掉长度为1的维度，得到 [batch, heads, head_dim]

    # 全局合并
    global_max = torch.max(local_max, dim=-1, keepdim=True).values  # [batch, heads, 1]
    exp_shift = torch.exp(local_max - global_max)                  # [batch, heads, chunks]

    # 补全3: 计算全局归一化因子
    global_sum = torch.sum(exp_shift * local_sum, dim=-1, keepdim=True)  # [batch, heads, 1]

    # 补全4: 最终输出 = sum(exp_shift * local_sum * local_out) / global_sum
    # exp_shift: [b,h,c], local_sum: [b,h,c], local_out: [b,h,c,hd]
    # 需要扩展维度进行广播乘法
    numerator = torch.sum(
        exp_shift.unsqueeze(-1) * local_sum.unsqueeze(-1) * local_out,
        dim=-2  # 在 chunks 维度求和
    )  # [batch, heads, head_dim]
    output = numerator / global_sum.unsqueeze(-1)  # [batch, heads, head_dim]

    # 如果需要保持与 q 相同的形状 [batch, heads, 1, head_dim]
    output = output.unsqueeze(-2)

    return output
```

#### 与FlashAttention的对比
| 特性 | FlashAttention | FlashDecoding |
| :--- | :--- | :--- |
| **适用阶段** | Prefill | Decode |
| **Query数量** | 多个（完整序列） | 单个（逐token） |
| **并行维度** | batch × head | batch × head × seq_chunk |
| **主要瓶颈** | 计算 | 内存带宽 |
| **加速效果** | 2-4x | 3-8x（长序列） |


#### 实际应用
特别适合：

+ 长上下文对话（>8K tokens）
+ 文档摘要和问答
+ 代码生成（长代码上下文）

### 7.1.4 PagedAttention
#### 问题背景
在LLM服务中，KV Cache管理面临严峻挑战：

1. **内存碎片**：不同长度的序列导致内部和外部碎片
2. **内存浪费**：预分配固定大小导致大量空间闲置
3. **无法共享**：并行解码（如beam search）时KV Cache重复存储

以vLLM的测试数据为例：在ShareGPT工作负载上，传统系统的KV Cache利用率仅20-40%。

#### 虚拟内存启发
PagedAttention借鉴操作系统虚拟内存的核心思想：

| 操作系统概念 | PagedAttention对应 |
| :--- | :--- |
| 虚拟地址 | 逻辑KV Cache块 |
| 物理页帧 | GPU内存块 |
| 页表 | Block Table |
| 按需分页 | 动态分配块 |


#### Block Table管理
**核心数据结构**

```python
class BlockTable:
      """PagedAttention 的块表管理"""
      def __init__(self, block_size, num_gpu_blocks):
          self.block_size = block_size      # 每个块的token数（如16）
          self.num_gpu_blocks = num_gpu_blocks
          self.free_blocks = list(range(num_gpu_blocks))            # 空闲块列表
          self.block_tables = {}     # sequence_id -> [block_ids]


      def allocate(self, sequence_id, num_tokens):
          """ 为序列分配块"""
          num_blocks_needed = ceil(num_tokens / self.block_size)
          if len(self.free_blocks) < num_blocks_needed:
                raise MemoryError("GPU   内存不足")
          blocks = [self.free_blocks.pop() for _ in range(num_blocks_needed)]
          self.block_tables[sequence_id] = blocks
          return blocks


      def append_token(self, sequence_id):
          """ 为序列追加新token，可能需要分配新块"""
          blocks = self.block_tables[sequence_id]
          num_tokens = len(blocks) * self.block_size

          if num_tokens % self.block_size == 0:          #  需要新块
                if not self.free_blocks:
                   raise MemoryError("GPU   内存不足")
                blocks.append(self.free_blocks.pop())


          return blocks
```

内存布局

```latex
逻辑视图（序列）：[t1, t2, t3, ..., t50]
               ↓ 映射
 物理视图（块）：
  Block 5: [t1, t2, ..., t16]
  Block 3: [t17, t18, ..., t32]
  Block 7: [t33, t34, ..., t48]
  Block 2: [t49, t50, _, _]   ( 部分使用)
```

#### 内存碎片消除
内部碎片

内部碎片来自块内未使用的空间。PagedAttention通过以下方式最小化： 

+ 选择适中的块大小（通常16-32 tokens） 
+ 最后一个块可以部分填充

外部碎片

外部碎片通过以下机制避免： 1. **统一块大小**：所有块大小相同，避免不规则分配 2. **按需分配**：不预分配连续空间 3. **块回收**：序列完成后块立即返回空闲池

#### KV Cache共享
PagedAttention支持多种共享场景

1. **Beam Search共享：**
    - 多个beam共享相同的父序列前缀
    - 写时复制（Copy-on-Write）机制
2. **并行采样共享**：
    - 同一prompt生成多个输出
    - prompt部分的KV Cache完全共享

写时复制实现

```python
def fork_sequence(self, parent_id, child_id):
        """ 创建序列的写时复制副本"""
        parent_blocks = self.block_tables[parent_id]
        #   初始时共享相同的块引用
        self.block_tables[child_id] = parent_blocks.copy()

        #   增加引用计数（实际实现中）
        for block_id in parent_blocks:
              self.ref_count[block_id] += 1


  def write_token(self, sequence_id, position, token_kv):
        """ 写入token，触发写时复制"""
        block_idx = position // self.block_size
        block_id = self.block_tables[sequence_id][block_idx]

        if self.ref_count[block_id] > 1:
              #   需要复制块
              new_block_id = self.free_blocks.pop()
              copy_block(block_id, new_block_id)
              self.ref_count[block_id] -= 1
              self.block_tables[sequence_id][block_idx] = new_block_id
              block_id = new_block_id

        #   写入KV Cache
        write_to_block(block_id, position % self.block_size, token_kv)       
```

#### PagedAttention 性能分析
在ShareGPT数据集上的实测结果（vLLM论文数据）：

| 系统 | 吞吐量 (req/s) | KV Cache利用率 |
| :--- | :--- | :--- |
| Orca | 1.0x (baseline) | ~30% |
| FasterTransformer | 1.2x | ~35% |
| **vLLM (PagedAttention)** | 2.5-3.0x | ~85% |


#### 实际应用与限制
优势：

+ 显著提升GPU内存利用率（2-4x）
+ 支持动态序列长度
+ 高效的KV Cache共享

限制：

+ 块大小选择需要权衡（太小→管理开销，太大→内部碎片） 
+ 随机访问模式可能降低缓存效率 
+ 需要额外的Block Table管理开销

