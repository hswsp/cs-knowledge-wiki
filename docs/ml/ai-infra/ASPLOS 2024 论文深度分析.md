# ASPLOS 2024 论文深度分析

## 3.4.1 SpecInfer：基于树的投机推理
### 论文信息
+ 标题：SpecInfer: Accelerating Large Language Model Serving with Tree-basedSpeculative Inference and Verification
+ 作者：Xupeng Miao et al. (CMU, Tsinghua, SJTU, PKU, UCSD)
+ 会议：ASPLOS 2024
+ 论文：[https://arxiv.org/abs/2305.09781](https://arxiv.org/abs/2305.09781)

### 问题定义
LLM推理的主要瓶颈是**内存访问**：每个 token的生成都需要加载全部模型权重。投机推理（Speculative Inference）通过"小模型生成+大模型验证"的方式加速，但面临三个挑战：

1. **小模型速度**：小模型生成速度要快于大模型验证节省的时间
2. **输出对齐**：小模型和大模型的输出分布要对齐
3. **验证效率**：大模型需要高效地批量验证多个候选token

### 核心思想：树形验证
SpecInfer的核心创新是**Token Tree Verification**：

![](https://images.spumn.eu.cc/ml/ai-infra/1781601736983-b7967311-2a76-4dbf-a20b-f2df51144dd6.svg)

### 技术细节：
1. **Speculative Sampling**
+ 使用多个drafter模型（可以是不同规模的LLM，也可以是专门的n-gram模型）
+ 每个drafter独立生成候选token序列 
+ 将多个序列合并成token tree
2. **Tree Attention** 
+ 修改attention mask支持树形结构 
+ 父节点对子节点可见，兄弟节点互不可见 
+ 单次前向传播验证整棵树
3. **Token Tree Verification** 
+ 使用目标 LLM并行计算 tree中每个节点的概率 
+ 采用投机解码（Speculative Decoding）的接受/拒绝策略 
+ 接受路径上的所有token，从拒绝点重新生成

### 实验结果
| 模型 | 基线 | SpecInfer | 加速比 |
| :--- | :--- | :--- | :--- |
| LLaMA-7B | vLLM | SpecInfer | 1.5-2.3× |
| LLaMA-13B | vLLM | SpecInfer | 1.8-2.5× |
| LLaMA-33B | vLLM | SpecInfer | 2.0-2.8× |


关键发现：

+ 加速比与drafter质量正相关
+ 多个小drafter比单个大drafter效果更好
+ 在代码生成等结构化输出场景效果最佳

### 与Medusa的对比
| 特性 | SpecInfer | Medusa |
| :--- | :--- | :--- |
| 额外模型 | 需要drafter | 训练多头解码器 |
| 训练成本 | 低（复用现有模型） | 高（需要微调） |
| 灵活性 | 高（可换drafter） | 低（与模型绑定） |
| 加速效果 | 1.5-2.8× | 2-3× |
| 适用场景 | 通用 | 特定模型 |


### 对Mooncake的启发
投机推理与PD分离是正交的技术，可以叠加使用：

+ Prefill集群使用标准推理
+ Decode集群使用投机推理加速
+ 两者结合可获得更大的端到端加速

## 3.4.2 Centauri：通信计算重叠调度
### 论文信息
+ 标题：Centauri: Enabling Efficient Scheduling for Communication-ComputationOverlap in Large Model Training via Communication Partitioning
+ 会议：ASPLOS 2024 Best Paper
+ 作者：Chang Chen et al. (Peking University)

### 问题定义
大模型训练需要混合并行策略（数据并行+张量并行+流水线并行），导致大量集合通信操作。通信成为训练瓶颈，**通信计算重叠**是关键的优化手段。现有方法的问题： 1. **细粒度kernel融合**：手动优化，难以适应不同环境 2. **有限的操作调度**：缺乏系统性的重叠策略

### 核心思想：三维通信划分
Centauri提出了**通信划分空间**的三个维度

1. **原语替换（ Primitive Substitution ）** 
+ 将大通信操作拆分为多个小操作 
+ 例如：将 AllReduce替换为ReduceScatter + AllGather
2. **拓扑感知组划分（Topology-aware Group Partitioning**） 
+ 根据网络拓扑将GPU分组
+ 组内通信优先，减少跨组流量
3. **负载划分（ Workload Partitioning）** 
+ 将计算任务划分为多个子任务 
+ 子任务之间插入通信操作

**层次化调度**：

+ 操作层：单个通信与计算的重叠
+ 层级别：相邻transformer层之间的通信重叠 
+ 模型级别：前向/反向传播与参数更新的重叠

### 实验结果
在多种混合并行配置下，Centauri相比基线实现1.2-1.5×的训练加速。

