# 第 7 章 · Reduction / Scan / Atomics

⏱️ 60 分钟🎯 写出 warp-shuffle reduce📂 code/ch07_reduce/

## 学习目标

  * 掌握 GPU reduction 五阶段优化套路（divergent → sequential → halved grid → unroll warp → shuffle）
  * 会用 `__shfl_down_sync / __shfl_up_sync` 在 warp 内交换数据
  * 写出 block 内 inclusive prefix sum
  * 明白 atomics 在高冲突下的代价，怎样用 shared-mem 私有桶规避

本章看似工程小练习，但 Softmax (Ch10)、LayerNorm/RMSNorm、FlashAttention 的 online-softmax 全都依赖 block-reduce / warp-reduce 模板。**写熟一次，受用整章 LLM。**

## 7.1 Reduction：求和的五次进化

问题：把 N=16M 个 float 加在一起。理想带宽利用 = N×4 字节 / 时间 / peak。

### v1: divergent 分歧版

```
for (int s = 1; s < blockDim.x; s *= 2) {
    if (tid % (2*s) == 0) sdata[tid] += sdata[tid + s];   // ❌ warp 内 31/32 lane 闲着
    __syncthreads();
}
```

问题：判断条件 `tid % (2*s) == 0` 让 warp 内每次只活 1/2、1/4 ... 的 lane → warp divergence。

### v2: 顺序地址版

```
for (int s = blockDim.x / 2; s > 0; s >>= 1) {
    if (tid < s) sdata[tid] += sdata[tid + s];     // 同 warp 内 tid 都满足条件
    __syncthreads();
}
```

每 warp 全员活动直到 s = 16，分歧大幅减少；同时访问也 coalesce。

### v3: 启动减半 + 每 thread 加两元素

```
int i = blockIdx.x * (blockDim.x * 2) + tid;
float v = in[i] + in[i + blockDim.x];      // load 两个再写 sdata
sdata[tid] = v;
```

kernel launch 开销摊薄一半；同时让算术与内存比例上升。

### v4: 展开最后一个 warp（去掉无用 sync）

```
for (int s = blockDim.x / 2; s > 32; s >>= 1) {
    if (tid < s) sdata[tid] += sdata[tid + s];
    __syncthreads();
}
// 当 s ≤ 32, 整个折叠都在同一 warp 内，硬件已经 SIMT 同步，不需要 __syncthreads
if (tid < 32) warp_reduce(sdata, tid);
```

### v5: warp shuffle，完全甩掉 shared 的最后一级

```
// 用 __shfl_down_sync 直接在寄存器间交换
for (int off = 16; off > 0; off >>= 1)
    v += __shfl_down_sync(0xffffffff, v, off);
// 32 个 warp-sum 写 shared, 让 warp 0 再 reduce 一次得到 block-sum
```

实测对比（T4，N=16M）：

版本| 关键改动| 时间| 带宽
---|---|---|---
v1| 原始| ~5.2 ms| ~13 GB/s
v2| sequential addressing| ~3.4 ms| ~20 GB/s
v3| 每 thread 加 2 个| ~1.7 ms| ~40 GB/s
v4| unroll last warp| ~1.2 ms| ~55 GB/s
v5| warp shuffle| ~0.85 ms| ~78 GB/s

v5 已经接近 T4 的 memory-bound roofline（实际 peak ≈ 250 GB/s，剩余差距来自 host-side finalize、grid 大小、L2 命中）。在 LLM 推理里基本用 v5 模板。

## 7.2 Warp Shuffle 详解

shuffle 指令让同 warp 内 32 个 lane 在寄存器之间直接交换数据，无需 shared memory：

```
__shfl_sync(mask, var, src_lane);          // 广播
__shfl_up_sync(mask, var, delta);          // 每 lane 收 lane-delta 的值
__shfl_down_sync(mask, var, delta);        // 每 lane 收 lane+delta 的值
__shfl_xor_sync(mask, var, lane_mask);     // 跟 lane^lane_mask 交换
```

**mask** 是参与的 lane 位掩码，几乎总传 `0xffffffff`（全 32 lane）。 **关键好处** ：少一次 shared mem round trip，省 `__syncthreads`。

## 7.3 Prefix Sum (Scan)

定义：`out[i] = in[0] + in[1] + ... + in[i]`（inclusive）。 在 LLM 里用于：top-p 采样（按 cumulative prob 找截断点）、PagedAttention 的页索引计算、稀疏 softmax。

warp 内 inclusive scan（Hillis-Steele，5 步）：

```
__device__ float warp_inclusive_scan(float v) {
    for (int o = 1; o < 32; o <<= 1) {
        float t = __shfl_up_sync(0xffffffff, v, o);
        if ((threadIdx.x & 31) >= o) v += t;
    }
    return v;
}
```

block 内 scan：每 warp 算 partial，warp tail 收集到 shared，再用 1 个 warp 扫一次，最后把偏移加回去。完整见 [scan.cu](<https://github.com/jwzheng96/learn-cuda-from-scratch/blob/main/code/ch07_reduce/scan.cu>)。

## 7.4 Atomics

常用：

```
atomicAdd(&hist[bin], 1);              // int/uint/float/double
atomicMax(&maxv, val);                 // int / uint
atomicCAS(&p, expected, new_val);      // 通用乐观锁基元
```

原子操作的代价：对**同一地址** 的并发原子会被序列化。256-bin 直方图，全局 atomic 时 32M 元素争 256 个地址，热点严重。

### 规避：shared 私有桶 + 合并

```
__shared__ unsigned int local_h[256];

// 1) block 内做私有 hist (256 lane 在 shared 上 atomic，冲突大幅缩小)
for (int i = gid; i < n; i += stride)
    atomicAdd(&local_h[in[i]], 1u);
__syncthreads();

// 2) 把私有 hist atomic 加回全局 (每 block 只加 256 次)
for (int i = tid; i < 256; i += blockDim.x)
    atomicAdd(&global_h[i], local_h[i]);
```

实测 (T4, N=16M)：

方法| 时间| 说明
---|---|---
global atomic| ~14 ms| 热点冲突
shared + global| ~0.4 ms| 35× 加速

## 7.5 自检

Q1: warp shuffle 比 shared memory 快多少？

~2×。shuffle 直接在 SM 内 register file 间传递，shared mem 至少要一次读 + 一次写，外加 bank conflict 风险。

Q2: `__shfl_*` 一定要 `_sync` 版吗？

是的，CUDA 9+ 强制要 mask 参数（旧的不带 mask 版本已废弃）。原因：cooperative groups + Volta 后 warp 不再隐式同步。

Q3: `atomicAdd(&p, v)` 对 float 安全吗？

是。CUDA 提供 fp32 / fp16 原子加。但是 **顺序不保证** ——多次浮点 atomicAdd 累加结果会受执行顺序影响，bit-wise 不可复现。

Q4: block 内有 64 warp，warp shuffle 如何处理跨 warp？

不能。shuffle 只在同 warp 32 lane 内。跨 warp 必须经 shared memory。reduce v5 就是这个模式：每 warp 内 shuffle，warp 间用 shared。

Q5: 我能用 reduce v5 处理 N = 1B 吗？

能。grid-stride loop，每 block 处理多个元素；最后用 host 把 grid 个 partial 加起来 → 单层 reduce 就够了。如果连 grid 都装不下 partial，再分级。

## 7.6 练习

  1. 把 `reduce_v5` 改成"求最大值"：把 `+` 换成 `fmaxf`，warp shuffle 也跟着换 max。
  2. 实现跨 block 的 scan：先 block 内 scan，导出每 block 的总和；再 scan 这些总和；最后把偏移加回所有 element。
  3. `histogram.cu`：把 BINS 改成 4096（不能放 shared 里），思考怎么做？提示：用 L2 缓冲或者多次 pass。
  4. 用 `cooperative_groups` 重写 v5：`cg::reduce` 模板。

## 7.7 工业实战：CUB、cooperative_groups、原子热点、数值稳定

### 7.7.1 CUB / Thrust — 不要重复造轮子

生产代码很少自己写 reduce v5——直接用 **CUB** （CUDA UnBound）。CUB 是 NVIDIA 开源的 device-level / block-level / warp-level 集合算法库，跟 nvcc 一起装，header-only：

```
#include <cub/cub.cuh>

// 1) Device-wide reduction (代替你的 reduce v5)
size_t temp_bytes = 0;
cub::DeviceReduce::Sum(nullptr, temp_bytes, d_in, d_out, N);  // 询问空间
cudaMalloc(&d_tmp, temp_bytes);
cub::DeviceReduce::Sum(d_tmp, temp_bytes, d_in, d_out, N);    // 真跑

// 2) Block-level reduction (代替自己写 warp_sum + shared)
__global__ void my_kernel(float* x, float* out) {
    typedef cub::BlockReduce<float, 256> BlockR;
    __shared__ typename BlockR::TempStorage tmp;
    float v = x[threadIdx.x];
    float sum = BlockR(tmp).Sum(v);
    if (threadIdx.x == 0) out[blockIdx.x] = sum;
}

// 3) Warp-level scan
typedef cub::WarpScan<int> WarpScan;
int aggregate;
WarpScan(temp).InclusiveSum(thread_data, thread_data, aggregate);
```

CUB 内部自带 architecture-specific 优化（pre-Volta 用 shfl，Volta+ 用 cooperative_groups），**性能通常比手写好且更稳** 。还提供 Scan、Sort、Histogram、Select 等几十种算法。

**什么时候自己写** ：CUB 是模板库，给 generic 场景；如果你的 reduce 是 attention/softmax 的内嵌部分，需要跟外层算子融合 → 自己写 warp-level 模板更灵活。

### 7.7.2 cooperative_groups — Volta+ 的细粒度同步

Volta 引入 "independent thread scheduling"——warp 内 32 lane 不再隐式同步。这让 `__shfl_*_sync` 的 mask 参数变成强制要求，也催生了 cooperative_groups API：

```
#include <cooperative_groups.h>
namespace cg = cooperative_groups;

__global__ void my_reduce(float* x, float* out, int n) {
    auto block = cg::this_thread_block();
    auto warp  = cg::tiled_partition<32>(block);
    // 16-lane tile (subwarp), 用得少但偶尔需要
    auto half_warp = cg::tiled_partition<16>(warp);

    float v = x[blockIdx.x * blockDim.x + threadIdx.x];

    // warp-level reduce (替代手写 shfl 循环)
    v = cg::reduce(warp, v, cg::plus<float>());

    // block-level reduce 需要 shared, CUB 更顺手
    __shared__ float warp_sums[32];
    if (warp.thread_rank() == 0) warp_sums[warp.meta_group_rank()] = v;
    block.sync();

    if (warp.meta_group_rank() == 0) {
        float w = (warp.thread_rank() < block.num_threads() / 32)
                  ? warp_sums[warp.thread_rank()] : 0;
        w = cg::reduce(warp, w, cg::plus<float>());
        if (warp.thread_rank() == 0) out[blockIdx.x] = w;
    }
}
```

好处：API 更易读、避免 mask 写错。坏处：代码比裸 shfl 长。生产里两者混用，看团队 style。

### 7.7.3 原子操作的**热点** 问题与规避

原子操作对同一地址会被硬件序列化。常见性能悬崖：

```
// ❌ 灾难: 所有 thread atomic 到同一地址
__global__ void sum_bad(const float* x, float* total, int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < n) atomicAdd(total, x[i]);    // N 个 thread 排队
}
// N=1M 时大约比 reduce v5 慢 100×

// ✅ 好: 先 block-wide reduce, 每 block 只 atomic 一次
__global__ void sum_good(const float* x, float* total, int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    float v = (i < n) ? x[i] : 0;
    float block_sum = cg::reduce(cg::this_thread_block(), v, cg::plus<float>());
    if (threadIdx.x == 0) atomicAdd(total, block_sum);
}
```

**判断原子是否成为瓶颈** ：Nsight Compute 看 `l1tex__t_sectors_pipe_lsu_mem_global_op_atom`（原子事务数）和 stall reason "Long Scoreboard"——如果占比高就是热点。

### 7.7.4 浮点 reduce 的数值精度

问题：把 N=10⁶ 个 fp32 数累加，**顺序不同结果不同** 。如果分布范围大（含 1e-6 和 1e6），简单累加会丢小数。

#### 方法 1：fp64 累加器（推荐生产用）

```
// 输入 fp32, 累加器 fp64
double sum_d = 0;
for (...) sum_d += double(x[i]);
return float(sum_d);
// CPU 一行, GPU reduce v5 把 acc 改 double 即可
```

#### 方法 2：Kahan 补偿求和（用 fp32 也能高精度）

```
float sum = 0, c = 0;             // c 是误差补偿项
for (...) {
    float y = x[i] - c;
    float t = sum + y;
    c = (t - sum) - y;            // 把这一步丢失的 bit 存回 c
    sum = t;
}
```

Kahan 在 fp32 里精度接近 fp64，但浮点指令数 ×4。 RMSNorm / LayerNorm 里 sum 用 fp32 Kahan 或 fp64 累加都可，**不能直接 fp16 累加** ——长 D 时累加误差直接爆。

### 7.7.5 LLM 推理中的 reduce 出现在哪

本章模板会反复出现在后面：

  * **Softmax** (Ch10)：row-wise max reduce + sum reduce
  * **LayerNorm / RMSNorm** (Ch10)：row-wise mean / variance reduce
  * **FlashAttention** (Ch12)：online softmax 的 (m, l) 合并就是改造过的 reduce
  * **Sampling top-k / top-p** (Ch13)：scan-then-truncate
  * **Cross-entropy loss** 训练时：log-sum-exp reduce

所以本章不只是 demo——是后面几章的**基础模板** 。

## 7.8 研究前沿（2025-2026）：Cluster Reduce 与 LLM 推理中的 reduce

### 7.8.1 Cluster-wide Reduce（Hopper+）

Hopper / Blackwell 的 CTA cluster（见 3.9）让 reduce 多了一个层级：

```
层级:
  warp   (32)     —— __shfl_*_sync / cg::reduce(warp, ...)
  block  (≤1024)  —— BlockReduce (CUB) / cg::reduce(block, ...)
  **cluster (≤16 blocks) —— cluster.sync() + DSMEM, sm_90+**
  grid   (≤2B)    —— cooperative_groups::this_grid().sync() + 全局 atomic
```

```
// Cluster 内 reduce: 多个 block 协作算一个大 sum
__global__ void __cluster_dims__(4, 1, 1) cluster_reduce(float* x, float* out, int n) {
    namespace cg = cooperative_groups;
    auto cluster = cg::this_cluster();
    auto block   = cg::this_thread_block();
    int  rank    = cluster.block_rank();          // 0..3
    int  cluster_size = cluster.num_blocks();      // 4

    extern __shared__ float smem[];
    // 1) 每 block 算自己负责段的 partial sum
    float local = 0;
    for (int i = block.thread_rank() + rank * 1024;
             i < n;
             i += cluster_size * 1024) local += x[i];
    local = cg::reduce(block, local, cg::plus<float>());
    if (block.thread_rank() == 0) smem[0] = local;
    block.sync();

    // 2) cluster 同步: 让 rank=0 看到所有 block 的 partial
    cluster.sync();

    if (rank == 0 && block.thread_rank() == 0) {
        float total = 0;
        for (int r = 0; r < cluster_size; ++r) {
            float* peer = cluster.map_shared_rank(smem, r);   // 跨 block 读 shared!
            total += peer[0];
        }
        out[blockIdx.x / cluster_size] = total;
    }
}
```

**什么时候用** ：单 block reduce 已经够快，cluster reduce 适合"输出极少 + 输入极大 + 一次 launch 算完"的场景（如训练梯度全 reduce），把 atomicAdd 全局热点干掉。

### 7.8.2 LLM 推理中 reduce 出现的"新"地方

除了 softmax / norm，2024-2026 这些算子大量用 reduce：

算子| 用到的 reduce| 难点
---|---|---
**MoE 路由 (top-k experts)**|  每 token 选 top-k logits| V=64 sort, block 内 top-k
**MoE all-to-all**|  跨 GPU all-reduce + token shuffle| NCCL + 自定义 fused
**Speculative verification**|  逐位置 max(p_target/p_draft)| warp-level 并行
**KV cache 量化的 per-group scale**|  每 group abs max| fused 到 attention
**chunk prefill**|  chunk 内最大 logit (mask)| 跨 chunk merge
**Online softmax (FA)**|  tile 内 (m, l) merge| 本教程 Ch10/12

### 7.8.3 SGLang RadixAttention：reduce 在 prefix tree 上

SGLang 用**Trie 数据结构** 缓存多请求共享前缀的 KV：

  1. 每个新请求查找最长前缀命中
  2. 命中部分直接用现成的 KV cache, 跳过 prefill 重算
  3. 未命中部分正常 prefill, attention kernel 内把"命中段 + 新段"的 softmax**分段在线 reduce**

这要求 attention kernel 能处理"两段不同来源的 K/V" → 等同于在 FlashAttention 里多加一个 (m, l) merge 步骤（跟 chunk prefill 同思路）。kernel 改动 ~50 行，吞吐对 chat 工作负载 +2-5×。

### 7.8.4 数值精度新挑战：fp8 / fp4 时代的累加

fp8 / fp4 数据，**累加器更要小心** ：

  * fp8 (E4M3) 动态范围 ~448，长 reduce 极易溢出 → **必须 fp32 累加**
  * fp4 (E2M1) 范围 ~6 → 几乎不能直接做 reduce，必须 dequant 到 fp8/fp16 再加
  * Blackwell 2nd-gen TE 对每 16/32 元素自动选 scale，称为 **microscaling** — reduce 在 group 内做完再用 group scale 转回真实值

### 7.8.5 cooperative_groups 在 CUDA 12.x 的新功能

  * `cg::async_reduce`：异步 reduce, 与 cp.async 配合做"加载 + reduce" 重叠
  * `cg::labeled_partition`：按动态条件分组，对稀疏 attention 友好
  * `cg::cluster_group`：cluster 级同步（如上）
  * `cg::thread_block_tile<16>` / `<8>`：subwarp 分区，对 MoE top-k 路由有用

### 7.8.6 工业 reduce 推荐栈（2026）

场景| 用
---|---
简单 block reduce| CUB `BlockReduce`
warp reduce| `cg::reduce(warp, ...)` 或 `__shfl_*_sync`
跨 grid reduce| CUB `DeviceReduce` 或 cooperative launch + grid sync
cluster reduce| cooperative_groups (Hopper+)，仅特殊场景
融入 attention 的 (m, l)| 手写, 见 Ch10/12 模板
跨 GPU all-reduce| NCCL `ncclAllReduce` / NVSHMEM

## 7.9 常见坑

  * shuffle mask 写错（不是全 1）→ kernel 偶发挂，难调
  * v4 里假设 BLOCK ≥ 64 → BLOCK=32 时跑炸；写代码时加 static_assert
  * float atomicAdd 累加 → 结果不可重现，需 BFGS-类算法时要注意
  * 跨 block 的 prefix sum 漏掉"加偏移"→ 各 block 内对，全局错
