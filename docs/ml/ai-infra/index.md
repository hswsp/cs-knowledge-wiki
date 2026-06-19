# AI Infra 入门到前沿

> 面向工程师的 AI 基础设施学习笔记：从 GPU/网络/存储基础，到 LLM 训练与推理、PD 分离、KV Cache、Mooncake 与 AI Serving Stack、核心算法与技术图表。

## 开篇

- [AI Infra (Memory Storage) 入门到前沿](./AI Infra (Memory Storage) 入门到前沿.md)

## 第一章：AI 基础设施（AI Infra）基础入门

- [AI Infra 的定义和范畴](./AI Infra 的定义和范畴.md)
- [AI 训练和推理系统的整体架构](./AI 训练和推理系统的整体架构.md)
- [GPU／TPU／NPU 等 AI 加速硬件详解](./GPU／TPU／NPU 等 AI 加速硬件详解.md)
- [分布式训练基础](./分布式训练基础.md)
- [集群网络和通信](./集群网络和通信.md)
- [存储系统在 AI 中的作用](./存储系统在 AI 中的作用.md)
- [AI Serving 系统的演进](./AI Serving 系统的演进.md)

## 第二章：LLM 训练与推理基础

- [Transformer 架构详解](./Transformer 架构详解.md)
- [LLM 训练流程](./LLM 训练流程.md)
- [训练优化技术](./训练优化技术.md)
- [LLM 推理的两个阶段](./LLM 推理的两个阶段.md)
- [KV Cache 的原理和作用](./KV Cache 的原理和作用.md)
- [推理优化技术](./推理优化技术.md)
- [批处理和调度策略](./批处理和调度策略.md)
- [总结与展望（第二章）](./总结与展望（第二章）.md)

## 第三章：AI Infra 最新前沿论文分析（2024-2025）

- [引言：LLM 推理优化的核心挑战](./引言：LLM 推理优化的核心挑战.md)
- [OSDI 2024 论文深度分析](./OSDI 2024 论文深度分析.md)
- [FAST 2025 最佳论文：Mooncake 深度解析](./FAST 2025 最佳论文：Mooncake 深度解析.md)
- [ASPLOS 2024 论文深度分析](./ASPLOS 2024 论文深度分析.md)
- [其他重要工作](./其他重要工作.md)
- [技术演进脉络分析](./技术演进脉络分析.md)
- [技术对比总结](./技术对比总结.md)
- [对 Mooncake 实习新人的建议](./对 Mooncake 实习新人的建议.md)
- [本章小结（第三章）](./本章小结（第三章）.md)

## 第四章：Prefill-Decode (PD) 分离技术详解

- [为什么需要 PD 分离](./为什么需要 PD 分离.md)
- [PD 分离的基本架构](./PD 分离的基本架构.md)
- [Chunked Prefill vs PD Disaggregation](./Chunked Prefill vs PD Disaggregation.md)
- [Mooncake 的 PD 分离实现](./Mooncake 的 PD 分离实现.md)
- [vLLM Disaggregated Prefilling](./vLLM Disaggregated Prefilling.md)
- [DistServe 的设计](./DistServe 的设计.md)
- [PD 分离中的 KV Cache 传输优化](./PD 分离中的 KV Cache 传输优化.md)
- [调度策略和负载均衡](./调度策略和负载均衡.md)
- [实际部署的挑战和解决方案](./实际部署的挑战和解决方案.md)
- [总结与展望（第四章）](./总结与展望（第四章）.md)

## 第五章：KV Cache 存储与网络传输优化

- [KV Cache 的基本原理](./KV Cache 的基本原理.md)
- [KV Cache 的内存占用分析](./KV Cache 的内存占用分析.md)
- [PagedAttention 机制](./PagedAttention 机制.md)
- [Prefix Caching 技术](./Prefix Caching 技术.md)
- [KV Cache 的压缩和量化](./KV Cache 的压缩和量化.md)
- [分层存储架构](./分层存储架构.md)
- [KV Cache 的网络传输优化](./KV Cache 的网络传输优化.md)
- [Mooncake KV Cache-centric 架构](./Mooncake KV Cache-centric 架构.md)
- [LMCache 的设计](./LMCache 的设计.md)
- [InfiniStore 等 KV Cache 存储系统](./InfiniStore 等 KV Cache 存储系统.md)
- [最佳实践与优化建议](./最佳实践与优化建议.md)
- [本章小结（第五章）](./本章小结（第五章）.md)

## 第六章：Mooncake 和 AI Serving Stack

- [Mooncake 项目背景](./Mooncake 项目背景.md)
- [Mooncake 的整体架构](./Mooncake 的整体架构.md)
- [核心组件详解](./核心组件详解.md)
- [与 vLLM 的集成](./与 vLLM 的集成.md)
- [与 SGLang 的集成](./与 SGLang 的集成.md)
- [Mooncake 的开源生态](./Mooncake 的开源生态.md)
- [实际部署案例](./实际部署案例.md)
- [性能数据和优化效果](./性能数据和优化效果.md)
- [使用指南](./使用指南.md)
- [进阶主题](./进阶主题.md)

## 第七章：AI Infra 核心算法详解

- [Attention 算法家族](./Attention 算法家族.md)
- [推理加速算法](./推理加速算法.md)
- [调度算法](./调度算法.md)
- [压缩算法](./压缩算法.md)
- [MoE 相关算法](./MoE 相关算法.md)
- [总结与展望（第七章）](./总结与展望（第七章）.md)

## 第八章：技术图表集

- [AI Infra 整体架构图](./AI Infra 整体架构图.md)
- [LLM 训练和推理流程图](./LLM 训练和推理流程图.md)
- [Transformer 架构图](./Transformer 架构图.md)
- [Mooncake 架构图](./Mooncake 架构图.md)
- [PD 分离架构对比图](./PD 分离架构对比图.md)
- [KV Cache 管理图](./KV Cache 管理图.md)
- [PagedAttention 机制图](./PagedAttention 机制图.md)
- [分布式训练并行策略对比图](./分布式训练并行策略对比图.md)
- [推理调度时序图](./推理调度时序图.md)
- [投机解码流程图](./投机解码流程图.md)
