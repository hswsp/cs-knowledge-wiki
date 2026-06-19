# Mooncake 的整体架构

## 6.2.1 以KV Cache为中心的分离式架构
Mooncake的核心创新在于将KV Cache视为一等资源（First-Class Resource），而非计算的副产品。传统LLM推理系统将KV Cache视为需要管理的内存开销，而Mooncake将整个系统架构围绕**KV Cache的存储、传输和复用**进行设计。

![](https://images.spumn.eu.cc/ml/ai-infra/1781705886764-6c656465-67a6-4df9-b3c0-932d27dbb9cf.svg)

Mooncake 架构包含三个核心组件：

1. **Prefill节点集群** 
+ 负责处理输入 prompt，并行计算所有输入 token的 KV Cache 
+ 优化目标：最大化计算吞吐量（MFU） 
+ 特点：计算密集型，需要强大的GPU算力
2. **Decode节点集群** 
+ 使用预计算的 KV Cache自回归生成输出 token 
+ 优化目标：最小化TPOT（Time Per Output Token） 
+ 特点：内存带宽密集型，需要高带宽显存
3. **分布式 KV Cache 池 **
+ 跨 GPU HBM 、 CPU DRAM 和 SSD 的分布式存储系统 
+ 通过RDMA实现高速数据传输 
+ 支持KV Cache的跨节点复用和共享

## 6.2.2 核心设计理念：以存换算
"以存换算"（Trading More Storage for Less Computation）是Mooncake的核心理念。这一理念基于以下观察：

**计算与存储的成本权衡**：

+ 重新计算KV Cache需要完整的Transformer前向传播
+ 传输KVCache只需要RDMA网络带宽
+ 在长上下文场景下，传输成本远低于重计算成本

数学分析表明，当满足以下条件时，传输KV Cache比重计算更划算：

```python
T_transfer < T_recompute

其中：
T_transfer = KV_Size / Network_Bandwidth
T_recompute = 2 * num_layers * d_model^2 * seq_len / GPU_FLOPS
```

在实际部署中，Mooncake利用集群中未被充分利用的CPU、DRAM、SSD资源构建分布式KV Cache池，实现了"免费"的存储扩展。

## 6.2.3 与vLLM的对比
| 特性 | vLLM (传统架构) | Mooncake (分离式架构) |
| :--- | :--- | :--- |
| Prefill/Decode | 同节点执行 | 分离到不同节点池 |
| KV Cache管理 | 单节点内存管理 | 分布式存储池 |
| 资源利用 | GPU资源为主 | GPU+CPU+DRAM+SSD全面利用 |
| 调度粒度 | 请求级别 | KV Cache块级别 |
| 过载处理 | 队列等待 | 预测性早期拒绝 |
| 长上下文优化 | 有限 | 专门优化，吞吐量提升59%~498% |
| Prefix Caching | 单节点 | 跨节点分布式 |


## 6.2.4 架构图详解
Mooncake 的完整架构包含以下层次：

**应用层**：Kimi Chat等LLM服务

**调度层**：

+ **Conductor（全局调度器）**： KV Cache-centric的全局调度器
+ Cache-aware Prefill Scheduler： 基于 KV Cache 命中率的预填充调度
+ Load-balance Decode Scheduler：基于负载均衡的解码调度
+ KVCache Balance Scheduler： KV Cache平衡调度

**计算层**：

+ Prefill Pool：预填充节点池，负责计算 KV Cache
+ Decode Pool：解码节点池，负责生成输出token

**存储层**：

+ Mooncake Store：分布式KV Cache存储
+ L1 Cache：GPU HBM中的热数据
+ L2 Cache：CPU DRAM中的温数据 
+ L3 Storage：SSD中的冷数据

**传输层**：

+ Transfer Engine：高性能数据传输引擎
+ 支持 RDMA 、 GPUDirect RDMA（GDR） 
+ 零拷贝传输 
+ 多网卡聚合（最高8×400Gbps）

**元数据层**： 

+ etcd/Redis/HTTP：服务发现和元数据管理

