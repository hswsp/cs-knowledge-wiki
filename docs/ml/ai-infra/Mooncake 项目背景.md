# Mooncake 项目背景

## 6.1.1 月之暗面（Moonshot AI）公司简介
月之暗面（Moonshot AI）是一家成立于2023年3月的创新型人工智能企业，总部位于北京。公司由杨植麟博士联合创立，创始团队拥有深厚的学术背景和产业经验。杨植麟博士毕业于清华大学和卡内基梅隆大学，曾在 Google Brain和 Meta AI Research实习，是Transformer-XL和XLNet等经典论文的作者之一。

公司的另外两位联合创始人周昕宇和吴育昕同样拥有丰富的行业经验。周昕宇曾在Hulu、腾讯和旷视科技从事深度学习在硬件受限场景下的部署研究；吴育昕则在 GoogleBrain从事基础模型研究，并在Meta AI Research专注于计算机视觉领域。

Moonshot AI 在成立第一年内就完成了超过 10 亿美元的融资，估值迅速攀升至 33 亿美元（截至2024年8月），成为中国AI领域最受关注的独角兽企业之一。公司的核心战略是专注于构建前沿大语言模型，而非像百度、阿里巴巴等科技巨头那样将AI作为现有生态系统的延伸。

## 6.1.2 Kimi大模型服务
Kimi是Moonshot AI推出的旗舰级大语言模型服务，以其超长上下文窗口和强大的推理能力而闻名。Kimi的核心特点包括：

**超长上下文处理能力**：Kimi最初以支持200万汉字的上下文窗口而震惊业界，远超当时竞争对手的上下文长度。这一能力使其在处理长文档分析、多轮对话和复杂推理任务时具有显著优势。

**多模态能力**：最新的Kimi K2.5版本采用混合专家（Mixture-of-Experts, MoE）架构，拥有1 万亿总参数和 320 亿激活参数。该模型在预训练阶段就使用了 15 万亿视觉和文本混合token，实现了原生的多模态理解能力。

**Agent能力**： Kimi K2.5引入了 "Agent Swarm"技术，能够协调多达 100个子代理进行大规模并行任务处理。在视觉到代码生成方面，Kimi能够将自然语言或UI设计转换为功能完整的高保真交互式网站。

**推理性能**：在复杂推理任务上，Kimi K2.5实现了比Claude 4.5 Opus快4倍的推理速度，同时在编码、数学和长上下文分析等基准测试中保持竞争力。

## 6.1.3 为什么需要Mooncake
随着Kimi用户规模的快速增长和模型能力的不断提升，Moonshot AI面临着严峻的推理服务挑战：

**长上下文带来的计算压力**： Kimi 的超长上下文能力意味着每个请求都需要处理大量token，传统的LLM推理架构难以高效处理这种工作负载。

**多样化的请求模式**：实际生产环境中，用户请求在输入长度、输出长度和到达模式上呈现高度异质性，需要更灵活的调度策略。

**严格的延迟要求**：用户对首token时间（TTFT）和每token输出时间（TPOT）有严格的期望，需要在高吞吐和低延迟之间取得平衡。

**资源利用率优化需求**：GPU集群中的CPU、DRAM、SSD和RDMA资源往往未被充分利用，需要更高效的资源利用策略。

**过载场景处理**：在高峰期，系统需要优雅地处理超出容量的请求，而不是简单地降级所有用户体验。

这些挑战促使Moonshot AI与清华大学MADSys实验室合作，开发了Mooncake这一革命性的推理服务架构。

## 6.1.4 开源历程
Mooncake 的开源历程体现了产学研协作的成功模式：

### 时间里程碑事件
| 时间 | 里程碑事件 |
| :--- | :--- |
| 2024年6月26日 | 发布初始技术报告，介绍Mooncake架构设计理念 |
| 2024年6月27日 | 发布系列中文技术博客，深入讨论架构细节 |
| 2024年7月9日 | 开源生产环境trace数据（JSONL格式） |
| 2024年11月28日 | 开源Transfer Engine（Mooncake核心组件） |
| 2024年12月16日 | vLLM官方支持Mooncake Transfer Engine |
| 2025年2月21日 | 发布FAST'25论文使用的更新版trace数据 |
| 2025年2月25日 | Mooncake论文荣获FAST 2025最佳论文奖 |
| 2025年3月7日 | 开源Mooncake Store（分布式KV Cache存储） |
| 2025年4月10日 | SGLang官方支持Mooncake Transfer Engine |
| 2025年4月22日 | LMCache官方支持Mooncake Store作为远程连接器 |
| 2025年5月5日 | 支持SGLang在96 H100 GPU上部署DeepSeek PD分离 |
| 2025年5月8日 | Mooncake与LMCache联合，共建KVCache-centric推理生态 |
| 2025年5月9日 | NVIDIA NIXL官方支持Mooncake Transfer Engine作为后端插件 |
| 2025年6月20日 | Mooncake成为LMDeploy的PD分离后端 |
| 2025年7月20日 | Mooncake支持Kimi K2在128 H200 GPU上部署，实现224k tokens/sec预填充吞吐量和288k tokens/sec解码吞吐量 |
| 2025年8月18日 | vLLM-Ascend集成Mooncake Transfer Engine，支持昇腾NPU |
| 2025年12月23日 | SGLang引入EPD（Encode-Prefill-Decode）分离，Mooncake作为传输后端 |
| 2026年1月28日 | Mooncake正式加入PyTorch生态系统 |


截至目前，Mooncake在GitHub上已获得超过3000个Star，吸引了20余名活跃开发者，被InfoQ、OSChina、新智元、机器之心等媒体和组织高度关注和报道。

