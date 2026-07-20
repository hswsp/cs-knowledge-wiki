# 对 Mooncake 实习新人的建议

## 3.8.1 必读论文清单
**核心必读（按优先级排序）：**

1. **Mooncake (FAST 2025) - 理解整个系统的架构和思想**
2. **DistServe (arXiv 2024)** - 理解 PD 分离的理论基础 
3. **Sarathi-Serve (OSDI 2024)** - 理解Chunked Prefill调度 
4. **vLLM Paper + PagedAttention** - 理解KV Cache管理基础

**扩展阅读**： 

5. SpecInfer (ASPLOS 2024) - 投机推理技术 
6. InfiniGen (OSDI 2024) - 长文本KV管理 
7. LMCache (arXiv 2025) - 企业级KV Cache层 
8. IMPRESS (FAST 2025) - 重要性感知存储

## 3.8.2 关键技术点掌握
1. **KV Cache的数学本质** 
+ 理解self-attention中K、V的计算和存储 
+ 掌握KV Cache内存占用计算公式 
+ 理解incremental decoding的KV复用机制
2. **PD分离的权衡分析** 
+ 什么时候分离收益最大？
+ KV Cache传输开销如何计算？ 
+ 网络带宽对分离效果的影响
3. **调度算法的核心指标** 
+ TTFT (Time To First Token) 
+ **TPOT (Time Per Output Token)**
+ TBT (Time Between Tokens) 
+ Goodput vs Throughput

## 3.8.3 代码实践建议
1. **熟悉Mooncake代码库**
+ Transfer Engine的RDMA传输实现 
+ Mooncake Store的分层存储逻辑 
+ 与vLLM/SGLang的集成接口
2. 实验和测试 
+ 使用公开的 workload trace进行复现 
+ 搭建本地测试环境验证想法 
+ 参与开源社区的issue讨论
3. 性能分析工具 
+ NVIDIA Nsight Systems for GPU profiling 
+ Intel VTune for CPU profiling 
+ 自定义的latency breakdown分析

