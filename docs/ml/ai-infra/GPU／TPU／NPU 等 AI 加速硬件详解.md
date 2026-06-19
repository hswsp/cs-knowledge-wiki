# GPU／TPU／NPU 等 AI 加速硬件详解

## 1.3.1 为什么需要 AI 专用硬件？
在深入 GPU 架构之前，先理解一个关键问题：**为什么不能只用普通 CPU 来训练 AI 模型？**

AI 计算的核心是大量矩阵乘法和向量运算，这类任务天然适合并行化。CPU 和 GPU 的设计目标完全不同：

| 维度 | CPU | GPU |
| --- | --- | --- |
| 设计目标 | 擅长复杂控制逻辑和串行任务 | 擅长大规模并行计算 |
| 核心数量 | 通常几十个强核心 | 通常数千个简单核心 |
| 单核能力 | 强 | 相对简单 |
| 并行能力 | 有限 | 极强 |
| 典型用途 | 操作系统、业务逻辑、通用计算 | 矩阵乘法、深度学习、图形渲染 |


### CPU vs GPU 计算模式
```latex
CPU 架构（擅长串行任务）
┌──────────────────────────────────────────────┐
│ 控制单元 │ ALU │ 缓存 │ 控制单元 │ ALU │ 缓存 │
│  复杂   │ 少量 │ 大   │  复杂   │ 少量 │ 大   │
└──────────────────────────────────────────────┘
≈ 8–64 个核心，每个核心强大但数量少

GPU 架构（擅长并行任务）
┌──────────────────────────────────────────────┐
│ 控制单元 │ ALU │ ALU │ ALU │ ... │ ALU │
│  简单   │     大量简单计算单元              │
└──────────────────────────────────────────────┘
≈ 数千个核心，每个核心简单但数量庞大
```

### 具体性能对比
| 操作类型 | CPU（Intel Xeon） | GPU（NVIDIA A100） | 加速比 |
| --- | ---: | ---: | ---: |
| 矩阵乘法（FP32） | 3 TFLOPS | 19.5 TFLOPS | 6.5x |
| 矩阵乘法（FP16） | 6 TFLOPS | 312 TFLOPS | 52x |
| 内存带宽 | 200 GB/s | 2,039 GB/s | 10x |
| 并行线程数 | 64 | 6,912 | 108x |


> **核心洞察：AI 计算的核心是大量矩阵乘法和向量运算，这些操作天然适合并行化。GPU 的设计理念就是“用数量换效率”。**
>

---

## 1.3.2 GPU 架构深度解析
### NVIDIA GPU 架构演进史
```latex
2010    2012    2014    2016    2017    2018    2020    2022    2024
  │       │       │       │       │       │       │       │       │
  ▼       ▼       ▼       ▼       ▼       ▼       ▼       ▼       ▼
Fermi  Kepler  Maxwell  Pascal  Volta  Turing  Ampere  Hopper  Blackwell
```

### SM（Streaming Multiprocessor）架构
SM 是 GPU 的基本计算单元，类似于 CPU 的核心，但设计完全不同。一个 SM 内部通常包含：

+ **CUDA Core**：<font style="color:#DF2A3F;">执行通用浮点和整数计算</font>；
+ **Tensor Core**：专门加速矩阵乘加运算；
+ **Warp Scheduler**：调度线程束执行；
+ **共享内存 / L1 Cache**：为高频数据访问提供低延迟存储。

![](https://images.spumn.eu.cc/ml/ai-infra/1781540020808-780212c6-1bce-4337-b877-1315c33528f5.svg)

### Tensor Core 详解
Tensor Core 是 NVIDIA GPU 的“秘密武器”，专门用于加速矩阵运算。

传统 CUDA Core 做矩阵乘法时，通常需要大量逐元素乘加：

```latex
C = A × B
64 × 64 × 64 = 262,144 次乘加运算
每个 CUDA 64 每次做1个乘加 → 需要262,144个时钟周期
```

而 Tensor Core 使用矩阵乘加单元，一次完成小矩阵块计算：

```latex
D = A × B + C
使用 4×4×4 的矩阵乘加单元
⼀次操作完成: D = A × B + C
只需要 (64 / 4)^3 = 4,096 次操作
理论加速比约 64x
```

### Tensor Core 演进
| 代数 | 架构 | 支持精度 | 核心特性 |
| --- | --- | --- | --- |
| 1st | Volta（V100） | FP16 | 首次引入，4×4×4 矩阵运算 |
| 2nd | Turing（RTX） | FP16、INT8、INT4 | 增加整数精度支持 |
| 3rd | Ampere（A100） | FP64、FP32、TF32、FP16、BF16、INT8 | TF32 自动混合精度 |
| 4th | Hopper（H100） | 上述精度 + FP8 | Transformer Engine |
| 5th | Blackwell | 上述精度 + 更高 AI 性能 | 性能进一步提升 |


### HBM（高带宽内存）
<font style="color:#DF2A3F;">HBM</font> 是 GPU 的“生命线”，决定数据能否及时喂给计算单元。

![](https://images.spumn.eu.cc/ml/ai-infra/1781540624397-0ceb100f-3536-411b-8b87-bbb673e52236.svg)

| 类型 | 典型场景 | 特点 | 典型带宽 |
| --- | --- | --- | ---: |
| GDDR6 | 游戏显卡 | 芯片分布在 PCB 周围，距离远、功耗高 | 500–800 GB/s |
| HBM2e / HBM3 | 数据中心 GPU | 3D 堆叠，与 GPU 核心封装在一起，距离近、功耗低 | 1.5–3.35 TB/s |


---

## 1.3.3 主流 GPU 型号详细对比
### NVIDIA 数据中心 GPU 家族
| 型号 | 架构 | 显存 | 显存带宽 | FP32 算力 | FP16 算力 | TDP | 发布时间 |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| V100 | Volta | 32GB HBM2 | 900 GB/s | 15.7 TFLOPS | 125 TFLOPS | 300W | 2017 |
| A100 | Ampere | 80GB HBM2e | 2,039 GB/s | 19.5 TFLOPS | 312 TFLOPS | 400W | 2020 |
| A800 | Ampere | 80GB HBM2e | 2,039 GB/s | 19.5 TFLOPS | 312 TFLOPS | 400W | 2022 |
| H100 | Hopper | 80GB HBM3 | 3.35 TB/s | 51 TFLOPS | 989 TFLOPS | 700W | 2022 |
| H800 | Hopper | 80GB HBM3 | 3.35 TB/s | 51 TFLOPS | 989 TFLOPS | 700W | 2023 |
| H200 | Hopper | 141GB HBM3e | 4.8 TB/s | 51 TFLOPS | 989 TFLOPS | 700W | 2024 |
| B200 | Blackwell | 192GB HBM3e | 8 TB/s | ~100 TFLOPS | ~2000 TFLOPS | 1000W | 2024 |


### A100 vs H100 深度对比
![](https://images.spumn.eu.cc/ml/ai-infra/1781540922722-cd372f1d-3a52-400e-80b0-0675222be2c5.svg)

| 指标 | A100 | H100 | 提升 |
| --- | ---: | ---: | ---: |
| FP32 算力 | 19.5 TFLOPS | 51 TFLOPS | +162% |
| FP16 算力 | 312 TFLOPS | 989 TFLOPS | +217% |
| 显存带宽 | 2,039 GB/s | 3,350 GB/s | +64% |


### H100 的关键创新
1. **Transformer Engine**
    - 自动在 FP16 和 FP8 之间切换；
    - 大模型训练速度可提升 4–6 倍；
    - 通过动态缩放保持精度。
2. **第四代 NVLink**
    - 单链路带宽从 25 GB/s 提升到 50 GB/s；
    - 支持最多 18 条链路；
    - GPU 间总带宽可达 900 GB/s。
3. **DPX 指令**
    - 加速动态规划算法；
    - 适用于基因组学、路径规划等场景。

### A800 / H800 特别说明
2022 年，美国出口管制政策限制了高性能 GPU 对中国的出口。NVIDIA 推出了 A800 和 H800。

| 限制项 | A100 / H100 | A800 / H800 |
| --- | --- | --- |
| 计算性能 | 完整 | 相同 |
| 显存带宽 | 完整 | 相同 |
| NVLink 带宽 | 600 GB/s | 400 GB/s（-33%） |
| 互联带宽 | 完整 | 降低 |


对训练的影响：

+ **小规模训练（单节点 8 卡）**：影响较小；
+ **大规模训练（多节点）**：<font style="color:#DF2A3F;">通信成为瓶颈，训练效率可能下降</font> 10–30%。

---

## 1.3.4 TPU 和 NPU 简介
### Google TPU
TPU（Tensor Processing Unit）是 Google 自研的 AI 专用芯片。

以 TPU v4 Pod 为例：

![](https://images.spumn.eu.cc/ml/ai-infra/1781541186774-e17fa39c-5174-44c4-9a38-91a2275d2afc.svg)

| 指标 | 数值 |
| --- | ---: |
| 芯片数量 | 64 个 TPU v4 芯片 |
| 计算核心 | 64 × 2 = 128 个核心 |
| 峰值算力 | 275 TFLOPS/chip × 64 = 17.6 PFLOPS |
| 显存容量 | 32GB/chip × 64 = 2TB HBM |
| 网络互联 | 3D Torus |


### TPU vs GPU 对比
| 特性 | TPU | GPU |
| --- | --- | --- |
| 制造商 | Google | NVIDIA |
| 软件生态 | JAX / TensorFlow | PyTorch / TensorFlow |
| 可用性 | 主要在 Google Cloud | 更广泛 |
| 灵活性 | 专用架构 | 通用架构 |
| 性价比 | 训练大模型较好 | 通用场景更好 |


### 国产 NPU
| 厂商 / 产品 | 代表型号 | 特点 |
| --- | --- | --- |
| 华为昇腾（Ascend） | Ascend 910B | 320 TFLOPS FP16，32GB HBM；支持 CANN 框架，兼容 PyTorch |
| 寒武纪（Cambricon） | MLU370 | 256 TFLOPS FP16；支持 MagicMind 推理框架 |
| 海光 DCU | DCU 系列 | 兼容 CUDA 生态，适用于国产化替代场景 |


---

## 小结
本节介绍了 AI 加速硬件的核心概念：

+ CPU 擅长串行控制，GPU 擅长并行矩阵计算；
+ Tensor Core 是 GPU 加速大模型训练和推理的关键；
+ HBM 决定了数据能否及时供给计算单元；
+ A100、H100、B200 代表了 NVIDIA 数据中心 GPU 的主要演进方向；
+ TPU、国产 NPU 是 GPU 之外的重要 AI 专用硬件路线。

> **选择 AI 硬件的核心原则：让计算模式、内存带宽、互联能力和软件生态与目标工作负载匹配。**
>

