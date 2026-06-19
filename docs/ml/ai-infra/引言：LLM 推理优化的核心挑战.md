# 引言：LLM 推理优化的核心挑战

大语言模型（LLM）推理服务已成为当今AI基础设施领域最具挑战性的工作负载之一。与训练阶段不同，推理服务需要同时满足**低延迟、高吞吐量和成本效益**三个相互制约的目标。本章将深入分析2024-2025年间发表在OSDI、FAST、ASPLOS等顶级会议上的前沿论文，揭示LLM推理优化的最新技术进展。

## 3.1.1 LLM 推理的两阶段特性
### LLM 推理过程本质上包含两个截然不同的计算阶段：
**Prefill阶段（预填充）**：处理完整的输入prompt，通过并行计算<font style="color:#ED740C;">生成第一个输出token</font>。该阶段具有以下特点：

+ **计算密集型**：需要处理整个输入序列，计算量大
+ **高延迟**：处理时间随输入长度线性甚至超线性增长
+ **高GPU利用率**：能够充分利用GPU计算资源

**Decode阶段（解码）**：自回归地逐个生成后续 token。该阶段具有以下特点：

+ 内存密集型：每次只处理单个token，计算量小
+ 低延迟：单个token生成速度快
+ 低GPU利用率：计算资源严重闲置

这种本质差异导致了**批处理的两难困境**：<font style="color:#ED740C;">批处理能显著提升decode阶段的吞吐量</font>，但会导致prefill和decode的相互干扰，影响**延迟SLO（Service Level Objective）**。

## 3.1.2 本章论文概览
| 论文 | 会议 | 核心贡献 | 与Mooncake的关联 |
| :--- | :--- | :--- | :--- |
| Sarathi-Serve | OSDI 2024 | Chunked Prefill + Stall-free调度 | PD融合调度思想 |
| Parrot | OSDI 2024 | 语义变量优化 | 应用层感知调度 |
| InfiniGen | OSDI 2024 | 动态KV Cache管理 | 长文本推理优化 |
| Mooncake | FAST 2025 | KV Cache中心分离架构 | 核心系统 |
| SpecInfer | ASPLOS 2024 | 树形投机推理 | 推理加速技术 |
| Centauri | ASPLOS 2024 | 通信计算重叠调度 | 分布式训练优化 |
| DistServe | arXiv 2024 | PD分离架构 | Mooncake前身思想 |
| LMCache | arXiv 2025 | 企业级KV Cache层 | Mooncake生态伙伴 |


