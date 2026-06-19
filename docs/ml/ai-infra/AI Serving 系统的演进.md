# AI Serving 系统的演进

AI Serving 系统经历了从简单单体服务，到模型服务器，再到面向大模型的分离式推理架构的演进。

### 第一代：单体推理服务（2015–2018）
![](https://images.spumn.eu.cc/ml/ai-infra/1781580309331-9f3b65f0-b832-492f-90c5-89cd0f9e9ac8.svg)

典型问题：

+ 模型更新需要重启服务；
+ 无法水平扩展；
+ GPU 利用率低，单个请求可能独占 GPU；
+ 不支持多模型和多版本管理。

### 第二代：模型服务器（2018–2020）
![](https://images.spumn.eu.cc/ml/ai-infra/1781580336302-531d88a2-b033-4160-a808-1d2ba9f491c4.svg)

改进点：

+ 支持多模型、多版本；
+ 支持动态模型加载 / 卸载；
+ 支持基本的批处理能力。

局限性：

+ 批处理策略较简单；
+ 不支持真正灵活的动态批处理；
+ GPU 内存管理较粗放。

### 第三代：分离式推理服务（2020 至今）
![](https://images.spumn.eu.cc/ml/ai-infra/1781580426215-0b237dde-2708-48f7-bfcf-f51651c15223.svg)

代表系统包括：

+ vLLM
+ TensorRT-LLM
+ Mooncake

核心创新：

1. **Prefill 和 Decode 分离**
    - 针对两个阶段的不同瓶颈使用不同硬件资源；
2. **KV Cache 集中管理**
    - 支持跨请求复用；
3. **连续批处理（Continuous Batching）**
    - 新请求可以动态加入，完成的请求可以及时退出；
4. **PagedAttention 内存管理**
    - 类似操作系统分页机制，提升显存利用率。

---

## 1.7.2 大模型推理的核心挑战
### 内存瓶颈
以 GPT-3 175B 模型推理为例：

| 项目 | 计算方式 | 内存需求 |
| --- | --- | ---: |
| 模型权重 | 175B × 2 字节（FP16） | 350 GB |
| KV Cache | batch_size × seq_len × hidden_dim × layers × 2(K+V) | 例如：64*2048*12288*96*2*2 字节 = 590 GB   比模型权重还大！ |
| **总计** | 350 GB + 590 GB | **约 940 GB** |


这意味着：

+ 模型权重本身至少需要 5 张 A100（80GB）；
+ 加上 KV Cache 后，可能需要 12 张 A100；
+ 在长上下文和大 batch 场景下，KV Cache 甚至可能比模型权重更大。

### 计算 vs 内存带宽
大模型推理主要分为两个阶段：

![](https://images.spumn.eu.cc/ml/ai-infra/1781580756349-cf7e6e8a-7636-423c-b2cd-be07bc7179d3.svg)

| 阶段 | 输入 | 计算特点 | 主要瓶颈 | 时间 |
| --- | --- | --- | --- | --- |
| Prefill | 完整 prompt，例如 1000 tokens | 并行 Self-Attention | 计算能力（FLOPS） | ~100ms |
| Decode | 已生成 token，逐个生成新 token | 自回归生成，难以并行 | 内存带宽 | ~20ms/token * N tokens |


> **关键洞察：Prefill 是计算密集型，Decode 是内存带宽密集型。分离部署可以更好地优化成本和性能。**
>

---

## 1.7.3 vLLM 核心创新
### PagedAttention
PagedAttention 借鉴操作系统虚拟内存思想，将 KV Cache 切分为固定大小的块。

传统连续内存分配的问题：

```latex
请求 1: [████░░░░░░░░░░░░░░░░░░░░]
请求 2: [░░░░░░░░░░░░░░░░░░░░░░░░]
请求 3: [░░░░░░░░░░░░░░░░░░░░░░░░]

问题：请求 1 未释放前，其占用空间难以被其他请求复用，内存碎片严重。
```

PagedAttention 的方式：

![](https://images.spumn.eu.cc/ml/ai-infra/1781581028095-9f885694-d846-42a3-ae1d-e360635c2ef0.svg)

```latex
物理内存块：
[0][1][2][3][4][5][6][7][8][9][10][11]

请求 1 逻辑视图：[块0] → [块2] → [块5] → [块7]
请求 2 逻辑视图：[块1] → [块3] → [块6]
请求 3 逻辑视图：[块4] → [块8] → [块9] → [块10] → [块11]
```

优势：

+ 内存块可以动态分配和回收；
+ 支持非连续物理内存；
+ 降低显存碎片；
+ 更适合长上下文和动态请求。

### Continuous Batching
传统静态批处理的问题：

```latex
Batch 1:
请求1 ████████████████████  100 tokens
请求2 ██████████            50 tokens，完成后等待
请求3 ████████████████████  100 tokens
请求4 ████████████████████  100 tokens
```

问题： 请求2完成后，需要等待其他请求，GPU空闲无法动态添加新请求

连续批处理允许请求动态进入和退出：

![](https://images.spumn.eu.cc/ml/ai-infra/1781710086496-5f474a0c-2a7d-47d5-a2dd-6b24338e9aea.svg)

优势：

+ 请求完成后立即退出；新请求可以随时加入；
+ 最大化 GPU 利用率；
+ 吞吐量可提升 5–20 倍。

---

## 1.7.4 Mooncake 架构详解
### 核心组件
Mooncake 的系统架构围绕 **Prefill-Decode 分离** 和 **KV Cache 池化** 展开。

![](https://images.spumn.eu.cc/ml/ai-infra/1781581489339-83f54a54-103b-487e-a7ec-1f7f5ee18c96.svg)

### 工作流程
1. 请求到达，全局调度器分析请求特征；
2. 请求被路由到 Prefill 节点，计算 KV Cache；
3. KV Cache 被写入分布式存储池；
4. Decode 节点读取 KV Cache，继续生成 token；
5. 新请求如果拥有相同前缀，可以复用已有 KV Cache。

### Prefix Caching
Prefix Caching 用于复用相同前缀的 KV Cache。

```latex
用户请求 1: “请解释量子计算” -> 生成 KV Cache A
                                    ↓
                              存入 Cache 池
                                    ↓
用户请求 2: “请解释量子计算的应用” -> 复用 KV Cache A，
                                  ↓
                            只需计算“的应用”
```

效果：

+ 共享前缀的请求，Prefill 时间可减少 80–90%；
+ 特别适合多轮对话、RAG 等场景。

---

## 1.7.5 云原生 AI 基础设施
### Kubernetes + GPU
云原生 AI 基础设施通常使用 Kubernetes 管理 GPU 集群。

![](https://images.spumn.eu.cc/ml/ai-infra/1781582169256-76a90e92-8232-40c9-8aa8-25854f32cf98.svg)

核心组件包括：

| 组件 | 作用 |
| --- | --- |
| API Server | Kubernetes 控制入口 |
| Scheduler | 根据资源需求调度 Pod |
| Controller | 维护期望状态 |
| etcd | 保存集群元数据 |
| NVIDIA Device Plugin | 将 GPU 资源暴露给 Kubernetes |


GPU 资源定义示例：

```yaml
apiVersion: v1
kind: Pod
spec:
  containers:
    - name: training
      resources:
        limits:
          nvidia.com/gpu: 4
```

### GPU 共享技术
| 方案 | 技术 | 隔离性 | 适用场景 |
| --- | --- | --- | --- |
| MPS | NVIDIA 多进程服务 | 进程级 | <font style="color:#ED740C;">推理服务</font> |
| MIG | 多实例 GPU | 硬件级 | 多租户 |
| vGPU | 虚拟 GPU | VM 级 | 云桌面 |
| Time-slicing | 时间片轮转 | 弱 | 开发测试 |


<font style="color:#ED740C;">MIG（Multi-Instance GPU）</font>可以将一张 GPU 切分为多个独立实例：

```latex
A100 (40GB)
┌─────────┬─────────┬─────────┬─────────┐
│ MIG 1   │ MIG 2   │ MIG 3   │ MIG 4   │
│ 10GB    │ 10GB    │ 10GB    │ 10GB    │
│ 独立计算 │ 独立计算 │ 独立计算 │ 独立计算 │
└─────────┴─────────┴─────────┴─────────┘
```

MPS = <font style="color:#ED740C;">Multi-Process Service</font>

正常情况下，多个进程同时跑 CUDA，驱动会走 **时间片轮转**（context switch）把 GPU 在进程间切来切去，开销大、延迟不可控。

MPS 的做法是：起一个 **MPS Server**，各进程的 CUDA kernel 调用被**复用进同一个 CUDA context** 里执行 → 减少 context switch，提升多进程小任务的吞吐。

---

## 1.7.6 AI Infra 未来趋势
AI 基础设施未来会沿着以下方向演进：

| 方向 | 说明 |
| --- | --- |
| 异构计算 | CPU + GPU + TPU + NPU + FPGA 协同工作，不同任务使用最合适的硬件 |
| 存算一体 | 计算靠近存储，减少数据搬运；CXL 内存扩展打破显存限制 |
| 边缘 AI | 模型压缩 + 边缘部署，实现低延迟推理并保护隐私 |
| 绿色 AI | 能效优化、液冷技术、可再生能源，降低碳排放 |
| 自动化运维 | AIOps：智能监控、故障预测、自动调优，降低运维成本 |


CXL = **Compute Express Link**

业界开放的**高速缓存一致性互连标准**，2019年由 Intel 发起推动，现由 **CXL Consortium**（成员包括 Intel/AMD/ARM/三星/SK海力士/美光等）维护：

> **CXL 把 PCIe 物理链路"升级"成能承载缓存一致性 + 内存语义（load/store）的通道**——让 CPU 能用接近内存的方式访问不在本地 DDR 插槽上的内存/设备内存。
>

---

## 本章小结
第一章介绍了 AI 基础设施的核心概念和技术体系。

### 核心知识点回顾
1. **AI Infra 定义**：支撑 AI 应用全生命周期的底层技术体系；
2. **硬件基础**：GPU 架构、Tensor Core、HBM、主流型号对比；
3. **分布式训练**：数据并行、模型并行、流水线并行、张量并行；
4. **网络通信**：NCCL、RDMA、InfiniBand、网络拓扑；
5. **存储系统**：数据加载、Checkpoint、并行文件系统；
6. **推理服务**：从单体到分离式架构、vLLM 创新、Mooncake 架构。

### 关键数字记忆
| 指标 | 数值 | 意义 |
| --- | ---: | --- |
| A100 显存带宽 | 2,039 GB/s | 数据吞吐能力 |
| H100 FP16 算力 | 989 TFLOPS | 计算能力 |
| NVLink 4.0 | 50 GB/s / 链路 | GPU 互联带宽 |
| IB NDR | 400 Gbps | 跨节点网络 |
| GPT-3 训练成本 | 数百万美元 | 体现基础设施重要性 |


### 推荐学习路径
```latex
初学者：GPU 基础 → 数据并行 → PyTorch
进阶：  NCCL → 3D 并行 → Megatron
专家：  vLLM → Mooncake → 论文阅读
```

> **Mooncake 是月之暗面开源的分离式大模型推理架构，通过 Prefill-Decode 分离、KV Cache 池化、Prefix Caching 等创新技术，实现了领先的推理性能。**
>

