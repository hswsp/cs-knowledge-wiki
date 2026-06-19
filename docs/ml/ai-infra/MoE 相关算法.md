# MoE 相关算法

混合专家模型（**Mixture of Experts, MoE**）通过条件计算实现**模型容量的扩展**，而不显著增加推理成本。DeepSeek-V2/V3、Mixtral等模型都采用了MoE架构，使其成为当前大模型的重要技术路线。

# 7.5.1 Expert Routing
### 问题背景
在 MoE模型中，每个输入 token只激活部分专家（experts），需要一个路由机制来决定token应该由哪些专家处理。

### MoE层结构
![](https://images.spumn.eu.cc/ml/ai-infra/1781792936980-9f2a5541-e903-4e44-b962-1d92a9d6bf8b.svg)

---

### 路由全过程
#### Step 1：路由器计算软概率 → $ P_i $
对每个 token $ x_t $，路由器输出 $ E $ 个分数，过 softmax：

$ p^{(t)} = \text{softmax}(W \cdot x_t) = [p_1^{(t)}, p_2^{(t)}, \dots, p_E^{(t)}] $

其中 $ p_i^{(t)} $ 表示 token $ t $ 分配给专家 $ i $ 的概率，且 $ \sum_i p_i^{(t)} = 1 $。

对**整批 **$ T $** 个** token 取平均：

$ \boxed{P_i = \frac{1}{T}\sum_{t=1}^{T} p_i^{(t)}} $

> $ P_i $ = 路由器“内心偏好”里，专家 $ i $ 应该拿到的平均份额（软分布）。
>

#### Step 2：Top-K 硬决策 → $ f_i $
根据 softmax 概率选出概率最高的 $ K $ 个专家（通常是 Top-1 或 Top-2），实际将 token 送到这些专家。记 $ n_i $ = 实际被 dispatch 到专家 $ i $ 的 token 数量，则：

$ \boxed{f_i = \frac{n_i}{T}} $

> $ f_i $ = 专家 $ i $ 实际吃到的 token 数占总 token 数的比例（实际负载份额）。
>

注意：Top-1 时 $ \sum_i f_i = 1 $；Top-2 时 $ \sum_i f_i = 2 $（有些实现会除以 $ K $ 使其和为 1，但原理不变）。

#### 数字例子
设 $ E=3 $ 个专家，$ T=5 $ 个 token。

路由器的 soft 概率（Step 1 输出）：

| token | 专家0 | 专家1 | 专家2 |
| --- | --- | --- | --- |
| t₁ | **0.80** | 0.15 | 0.05 |
| t₂ | 0.10 | **0.70** | 0.20 |
| t₃ | 0.20 | 0.30 | **0.50** |
| t₄ | **0.90** | 0.08 | 0.02 |
| t₅ | 0.25 | **0.60** | 0.15 |


Top-1 选择结果：

| token | 选中专家 |
| --- | --- |
| t₁ | 专家0 |
| t₂ | 专家1 |
| t₃ | 专家2 |
| t₄ | 专家0 |
| t₅ | 专家1 |


计算 $ P_i $

$ \begin{aligned}
P_0 &= (0.80+0.10+0.20+0.90+0.25)/5 = \mathbf{0.45} \\
P_1 &= (0.15+0.70+0.30+0.08+0.60)/5 = \mathbf{0.37} \\
P_2 &= (0.05+0.20+0.50+0.02+0.15)/5 = \mathbf{0.18}
\end{aligned} $

→ 路由器认为专家0应得 **45%** 的注意力。

计算 $ f_i $

+ 专家0 拿到 {t₁, t₄} → $ n_0=2 $ → $ f_0=2/5=\mathbf{0.40} $
+ 专家1 拿到 {t₂, t₅} → $ n_1=2 $ → $ f_1=2/5=\mathbf{0.40} $
+ 专家2 拿到 {t₃}    → $ n_2=1 $ → $ f_2=1/5=\mathbf{0.20} $

→ 实际负载为 **40%/40%/20%**。

代入负载均衡损失：

$ \sum_i f_i \cdot P_i = 0.40\times0.45 + 0.40\times0.37 + 0.20\times0.18 = 0.180+0.148+0.036 = \mathbf{0.364} $

损失的意义：为什么惩罚 $ f_i \cdot P_i $？

| 情况 | 含义 | 对损失的影响 |
| --- | --- | --- |
| $ P_i $ 大且 $ f_i $ 大 | 路由器高看某专家，实际也给了活 | 正常贡献 |
| $ P_i $ 小且 $ f_i $ 小 | 路由器低看，实际也没人去 | 正常贡献 |
| $ P_i $ 大但 $ f_i $ 小 | 路由器虚高，实际 token 跑别处 | 分布失衡 → 损失增大 |
| $ P_i $ 小但 $ f_i $ 大 | 负载坍塌到冷门专家 | 损失增大 |


本质：逼路由器输出的软分布 $ P $ 与实际硬分配分布 $ f $ 保持一致，防止 token 全部坍缩到少数专家。

总结：

| 符号 | 来源 | 一句话 |
| --- | --- | --- |
| $ P_i $ | 路由器 softmax 输出取 batch 平均 | “路由器**认为**专家 $ i $ 该拿多少” |
| $ f_i $ | 实际 Top-K 硬分配后计数 ÷ $ T $ | “专家 $ i $ **实际**拿到了多少 token 的比例” |


两者对齐 → 负载均衡 → MoE 不坍缩。

## 7.5.1.1 Top-K 选择
### 基本路由
对于输入 $ x $，路由分数计算为：

$ g(x) = \text{Softmax}(W_g \cdot x) $

其中 $ W_g \in \mathbb{R}^{E \times d} $ 是路由权重矩阵，$ E $ 是专家数量。

### Top-K选择
$ \text{TopK}(g(x), k) = {(i, g_i) \mid i \in \text{topk_indices}(g(x), k)} $

### 带噪声的Top-K
为**<font style="color:#DF2A3F;">防止路由崩溃（所有token都路由到少数专家</font>**），引入噪声：

$ g(x) = \text{Softmax}(W_g \cdot x + \epsilon \cdot \text{Normal}(0, 1)) $

其中 $ \epsilon $ 是噪声强度，**<font style="color:#ED740C;">训练时通常非零，推理时为零</font>**。路由实现

```python
class TopKRouter(nn.Module):
    def __init__(self, hidden_dim, num_experts, top_k=2, noise_std=1.0):
        super().__init__()
        self.num_experts = num_experts
        self.top_k = top_k
        self.noise_std = noise_std

        #   路由权重
        self.gate = nn.Linear(hidden_dim, num_experts, bias=False)

    def forward(self, x, training=True):
        """
        x: [batch, seq_len, hidden_dim]
        返回: (expert_indices, expert_weights)
        """
        #   计算路由分数
        router_logits = self.gate(x)        # [batch, seq_len, num_experts]

        #   添加噪声（仅训练时）
        if training and self.noise_std > 0:
            noise = torch.randn_like(router_logits) * self.noise_std
            router_logits = router_logits + noise

        # Softmax  归一化
        router_probs = F.softmax(router_logits, dim=-1)

        # Top-K 选择
        expert_weights, expert_indices = torch.topk(
            router_probs, self.top_k, dim=-1
        )   # [batch, seq_len, top_k]

        #   重新归一化权重
        expert_weights = expert_weights / expert_weights.sum(dim=-1, keepdim=True)

        return expert_indices, expert_weights, router_probs
```

## 7.5.1.2 Load Balancing
### 负载不均衡问题
如果路由机制不加约束，会出现：

+ 少数专家过载（处理大量 token）
+ 多数专家闲置（处理很少token） 
+ 训练不稳定，专家专业化不足

### 辅助损失函数
负载均衡损失（Load Balancing Loss）

$ \mathcal{L}_{\text{load}} = \alpha \cdot E \cdot \sum_{i=1}^{E} f_i \cdot P_i $

其中：

+ $ E $是专家（Expert）的总数：number of experts。
+ $ f_i $ 是专家 $ i $ 被选择的token比例
+ $ P_i $ 是路由器分配给专家 $ i $ 的平均概率
+ $ \alpha $ 是损失权重（通常0.01）

```python
def compute_load_balancing_loss(router_probs, expert_indices, num_experts):
    """
    计算负载均衡损失
    router_probs: [batch, seq_len, num_experts]
    expert_indices: [batch, seq_len, top_k]
    """
    #   每个专家被选择的token数
    expert_mask = F.one_hot(expert_indices, num_experts).sum(dim=-2)                # [batch, seq_len, num_experts]

    #   计算f_i（每个专家处理的token比例）
    tokens_per_expert = expert_mask.float().sum(dim=1)   # [batch, num_experts]
    f = tokens_per_expert / tokens_per_expert.sum(dim=-1, keepdim=True)

    #   计算P_i（平均路由概率）
    P = router_probs.mean(dim=[0, 1])

    #   负载均衡损失
    load_loss = num_experts * (f * P).sum()

    return load_loss
```

### 重要性损失（Importance Loss）
$ \mathcal{L}_{\text{importance}} = \beta \cdot \text{CV}(\text{importance}) $

其中<font style="color:#ED740C;">importance是每个专家被分配的路由概率之和</font>，CV是变异系数。

### 容量因子
限制每个专家能处理的token数量：

$ \text{capacity} = \frac{\text{num_tokens} \times k}{E} \times \text{capacity_factor} $

+ k 就是 Top-K 路由里的 K——每个 token 会被分配给前 k 个最高概率的专家

超出容量的token被丢弃或路由到备用专家。

```python
class CapacityLimitedRouter(TopKRouter):
    def __init__(self, hidden_dim, num_experts, top_k=2, capacity_factor=1.25):
        super().__init__(hidden_dim, num_experts, top_k)
        self.capacity_factor = capacity_factor

    def forward(self, x):
        batch, seq_len, _ = x.shape
        num_tokens = batch * seq_len

        #   计算容量
        capacity = int(num_tokens * self.top_k / self.num_experts * self.capacity_factor)

        expert_indices, expert_weights, router_probs = super().forward(x)

        #   应用容量限制
        for i in range(self.num_experts):
            expert_mask = (expert_indices == i).any(dim=-1)
            expert_count = expert_mask.sum()

            if expert_count > capacity:
                #   超出容量，需要丢弃部分token
                excess = expert_count - capacity
                #   按路由概率排序，丢弃低概率的
                expert_probs = router_probs[..., i]
                _, drop_indices = torch.topk(expert_probs[expert_mask], excess, largest=False)
                #   标记这些token为需要重路由
                ...

        return expert_indices, expert_weights
```

## 7.5.1.3 辅助损失详解
### 总损失函数
$ \mathcal{L}{\text{total}} = \mathcal{L}{\text{LM}} + \lambda_1 \mathcal{L}{\text{load}} +\lambda_2 \mathcal{L}{\text{router_zloss}} $

其中：

+ $ \mathcal{L}_{\text{LM}} $：语言模型损失
+ $ \mathcal{L}_{\text{load}} $：负载均衡损失
+ $ \mathcal{L}_{\text{router_zloss}} $：路由器z-loss（防止logits过大）

**Router Z-Loss**

$ \mathcal{L}{\text{router_zloss}} = \frac{1}{B} \sum_{i=1}^{B} \left(\log \sum_{j=1}^{E}e^{z_{ij}}\right)^2 $

其中 $ z_{ij} $ 是路由器logits，这个损失鼓励logits保持较小值，提高数值稳定性。

```python
def compute_router_z_loss(router_logits):
       """
       计算router z-loss
       router_logits: [batch, seq_len, num_experts]
       """
       # log(sum(exp(z)))
       log_sum_exp = torch.logsumexp(router_logits, dim=-1)


       #   平方损失
       z_loss = (log_sum_exp ** 2).mean()


       return z_loss
```

# 7.5.2 Expert Parallelism
### 问题背景
MoE 模型的专家数量通常很大（如 64 、 128 个），单个 GPU 无法容纳所有专家。 ExpertParallelism（EP）将专家分布到多个GPU上。

## 7.5.2.1 EP并行策略
### 专家分片
将 $ E $ 个专家分布到 $ N $ 个GPU上：

$ \text{experts_per_gpu} = \frac{E}{N} $

每个GPU负责 $ \frac{E}{N} $ 个专家的计算。

### 数据并行 + 专家并行
```latex
3个GPU，6个专家（每个GPU 2个专家）

GPU 0: [Expert 0, Expert 1] + DP副本
GPU 1: [Expert 2, Expert 3] + DP副本
GPU 2: [Expert 4, Expert 5] + DP副本

输入数据:
  Batch 0 → GPU 0 (需要Expert 0,1,4)
  Batch 1 → GPU 1 (需要Expert 2,3,5)
  Batch 2 → GPU 2 (需要Expert 0,2,5) 
```

## 7.5.2.2 All-to-All通信
### 通信模式
Expert Parallelism 的核心是All-to-All通信：

1. **Dispatch阶段**：将token发送到对应的专家所在GPU
2. **Compute阶段**：各GPU并行处理分配给它的token
3. **Combine阶段**：收集结果并返回原始位置

```python
def expert_parallel_forward(x, expert_indices, expert_weights, experts, gr
   """
   专家并行前向传播
   
   x: [local_batch, seq_len, hidden_dim]
   expert_indices: [local_batch, seq_len, top_k]
   expert_weights: [local_batch, seq_len, top_k]
   experts:当前GPU上的专家列表
   group: 专家并行通信组
   """
   batch, seq_len, _ = x.shape
   top_k = expert_indices.shape[-1]
   num_local_experts = len(experts)
   world_size = dist.get_world_size(group)

   # === Dispatch  阶段 ===
   #   准备发送缓冲区
   send_buffer = [[] for _ in range(world_size)]

   for b in range(batch):
         for s in range(seq_len):
            for k in range(top_k):
                expert_id = expert_indices[b, s, k].item()
                target_rank = expert_id // num_local_experts
                send_buffer[target_rank].append({
                     'token': x[b, s],
                     'expert_id': expert_id,
                     'weight': expert_weights[b, s, k],
                     'position': (b, s, k)
                })

   # All-to-All 通信
   recv_buffer = all_to_all(send_buffer, group)

   # === Compute  阶段 ===
   outputs = {}
   for item in recv_buffer:
         expert_id = item['expert_id']
         local_expert_id = expert_id % num_local_experts
         expert = experts[local_expert_id]


         token = item['token']
         output = expert(token)
         outputs[item['position']] = output * item['weight']
           
   # === Combine阶段 ===
   # 准备发送回原始位置的缓冲区
   send_back_buffer = [[] for _ in range(world_size)]
   for pos, output in outputs.items():
         source_rank = pos[0] // (batch // world_size)
          send_back_buffer[source_rank].append({
               'output': output,
               'position': pos
          })

         # All-to-All 通信返回结果
         recv_back_buffer = all_to_all(send_back_buffer, group)

         #   聚合结果
         final_output = torch.zeros_like(x)
         for item in recv_back_buffer:
              b, s, k = item['position']
              final_output[b, s] += item['output']

         return final_output        
```

### All-to-All 优化
1. **通信与计算重叠**：在等待通信时执行其他计算
2. **分组All-to-All**：将大All-to-All拆分为多个小All-to-All
3. **FP16/BF16通信**：降低通信带宽需求

```python
def optimized_all_to_all(send_buffers, group):
    """ 优化的All-to-All通信"""
    world_size = dist.get_world_size(group)

    #   将数据打包成连续张量
    send_tensors = []
    send_sizes = []
    for buf in send_buffers:
        if len(buf) > 0:
            tensor = torch.stack([item['token'] for item in buf])
        else:
            tensor = torch.empty(0)
        send_tensors.append(tensor)
        send_sizes.append(len(buf))

    #   交换大小信息
    recv_sizes = [torch.tensor(0) for _ in range(world_size)]
    dist.all_to_all(recv_sizes, [torch.tensor(s) for s in send_sizes], group=group)

    #   分配接收缓冲区
    recv_tensors = [
        torch.empty(recv_sizes[i], send_tensors[0].shape[1],
                    dtype=send_tensors[0].dtype, device=send_tensors[0].device)
        for i in range(world_size)
    ]

    #   执行All-to-All
    dist.all_to_all(recv_tensors, send_tensors, group=group)

    return recv_tensors
```

## 7.5.2.3 DeepSeek 的EP实现
### DeepSeek-V2/V3 架构
DeepSeek采用了创新的MoE架构： - **共享专家**：所有token都经过的共享专家（2个） -**路由专家**：通过路由选择的专家（64个，激活6个） - **细粒度专家**：每个专家更小但数量更多

### 负载均衡创新
DeepSeek 引入了设备级负载均衡：

$ \mathcal{L}_{\text{device}} = \alpha \cdot N_{\text{devices}} \cdot\sum_{d=1}^{N_{\text{devices}}} f_d \cdot P_d $

其中 $ f_d $ 是设备 $ d $ 上的token比例，$ P_d $ 是路由到设备 $ d $ 的概率。通信优化

DeepSeek的EP优化策略：

1. **双批次重叠**：
    - 批次1的通信与批次2的计算重叠
    - 批次2的通信与批次1的计算重叠
2. **细粒度调度**：
    - 将序列分成多个micro-batch
    - 独立调度每个micro-batch

```python
class DeepSeekMoELayer(nn.Module):
     def __init__(self, config, ep_group):
           super().__init__()
           self.num_shared_experts = config.num_shared_experts
           self.num_routed_experts = config.num_routed_experts
           self.top_k = config.top_k
           self.ep_group = ep_group

           #   共享专家（所有GPU都有）
           self.shared_experts = nn.ModuleList([
                Expert(config.hidden_size, config.intermediate_size)
                for _ in range(self.num_shared_experts)
           ])

           #   路由专家（EP分片）
           self.routed_experts = self.create_routed_experts()

           #   路由器
           self.router = DeepSeekRouter(
                config.hidden_size,
                self.num_routed_experts,
                self.top_k
           )

     def forward(self, x):
           #   共享专家（本地计算）
           shared_output = sum(expert(x) for expert in self.shared_experts)

           #   路由专家（EP并行）
           expert_indices, expert_weights = self.router(x)
           routed_output = expert_parallel_forward(
                x, expert_indices, expert_weights,
                self.routed_experts, self.ep_group
           )

           return shared_output + routed_output

```

## 7.5.2.4 EP 与其他并行的组合
### 3D并行（EP + TP + DP）
![](https://images.spumn.eu.cc/ml/ai-infra/1781848786625-d1ebab7c-669c-45b3-bc4c-e95fcb861237.svg)

```python
全局并行策略：
● Data Parallelism (DP): 复制完整模型
● Tensor Parallelism (TP): 层内分片
● Expert Parallelism (EP): 专家分片

示例配置（8 GPU）:
● DP = 2 (2个副本)
● TP = 2 (每层分2片)
● EP = 2 (专家分2组)

每个GPU组:
GPU 0-1: TP组1, EP组1, DP副本1
GPU 2-3: TP组2, EP组1, DP副本1
GPU 4-5: TP组1, EP组2, DP副本2
GPU 6-7: TP组2, EP组2, DP副本2
```

### 通信复杂度分析
| 并行类型 | 通信操作 | 通信量 | 频率 |
| :--- | :--- | :--- | :--- |
| DP | All-Reduce | 2x模型大小 | 每个梯度步 |
| TP | All-Reduce | 2x激活大小 | 每层 |
| EP | All-to-All | 2x token数 | 每层MoE |


### 最优并行配置
选择并行策略的考虑因素： 1. **模型大小**：大模型需要更多TP 2. **序列长度**：长序列需要更多EP 3. **GPU数量**：决定并行度上限 4. **网络带宽**：影响通信效率

