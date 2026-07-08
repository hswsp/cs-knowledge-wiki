# 📖 术语表 (Glossary)

按章节顺序整理；首次出现于第几章在最后列出。

## GPU 硬件

中文| 英文| 含义| 首现
---|---|---|---
流式多处理器| Streaming Multiprocessor (SM)| GPU 上独立调度执行的硬件单元，每个 SM 内含若干 CUDA core / Tensor Core / 共享内存。A100 有 108 个 SM。| Ch4
线程束| warp| 32 个 thread 一组，作为 SM 的最小调度单位，同一 warp 在同一时钟周期执行同一条指令。| Ch3
单指令多线程| SIMT| Single Instruction, Multiple Threads — warp 内 32 个线程同步执行同一指令但操作不同数据。| Ch4
线程束分歧| warp divergence| 同一 warp 内不同线程走了 if/else 两个分支，会被串行执行，性能下降。| Ch4
占用率| occupancy| 实际活跃 warp 数 / SM 最大支持 warp 数。高 occupancy 利于隐藏内存延迟。| Ch4
张量核心| Tensor Core| 专门做矩阵乘累加 (MMA) 的硬件单元，从 Volta 开始引入，吞吐远高于 CUDA core。| Ch9

## 编程模型

中文| 英文| 含义| 首现
---|---|---|---
核函数| kernel| 用 `__global__` 修饰的函数，由 host 调用、在 device 上由大量线程并行执行。| Ch2
网格| grid| kernel 启动时的所有线程块的集合。| Ch3
线程块| block / CTA| 共享 shared memory 的一组 thread，最大 1024，分配到同一 SM。| Ch3
合作组| cooperative groups| CUDA 9+ 提供的灵活同步原语，可以细粒度同步 warp 内/block 内/grid 内线程。| Ch7
流| stream| 异步命令队列，同一 stream 内严格顺序，不同 stream 间并行。| Ch8

## 内存

中文| 英文| 含义| 首现
---|---|---|---
全局内存| global memory| GPU 显存，所有线程可访问，延迟最高（几百周期），容量最大。| Ch5
共享内存| shared memory| SM 上的片上 SRAM，block 内所有线程共享，延迟接近 L1。| Ch5
寄存器| register| 线程私有的最快存储，每个 SM 有 64K~256K 寄存器。| Ch5
合并访问| memory coalescing| 一个 warp 的 32 个线程访问连续 128B 内存，硬件合并为一次内存事务。| Ch5
存储体冲突| bank conflict| 同一 warp 多线程访问 shared memory 的同一 bank，会被串行化。| Ch6

## LLM 推理

中文| 英文| 含义| 首现
---|---|---|---
通用矩阵乘| GEMM| General Matrix Multiplication, C = αAB + βC，LLM 80% 的计算来自 GEMM。| Ch9
缩放点积注意力| Scaled Dot-Product Attention| Attention(Q,K,V) = softmax(QKᵀ/√d) V，Transformer 核心算子。| Ch11
在线 softmax| online softmax| 分块计算 softmax 时维护当前最大值与归一化项的算法，是 FlashAttention 的基石。| Ch10
键值缓存| KV Cache| 推理时缓存历史 token 的 K/V 投影，避免每步重算。| Ch13
旋转位置编码| Rotary Position Embedding (RoPE)| 用复数旋转方式注入位置信息，被 Llama 等主流模型采用。| Ch13
分页注意力| PagedAttention| vLLM 提出的 KV cache 分页管理，让显存利用率接近 OS 分页。| Ch14

## 工具链

中文| 英文| 含义| 首现
---|---|---|---
编译器| nvcc| NVIDIA CUDA 编译器，把 .cu 编译为 host C++ + device PTX/SASS。| Ch1
中间表示| PTX| Parallel Thread eXecution，CUDA 的虚拟 ISA，类似 LLVM IR。| Ch8
架构机器码| SASS| 实际硬件执行的机器码，与 SM 架构强绑定。| Ch8
性能分析器| Nsight Compute| NVIDIA 的 kernel 级性能分析工具，输出 roofline、stall reason 等。| Ch8
时间线分析器| Nsight Systems| 系统级 timeline 分析，看 H2D/D2H/kernel/stream overlap。| Ch8
