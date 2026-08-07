# 第 10 章 · Softmax 与 Norm

⏱️ 60 分钟🎯 写出 online softmax📂 code/ch10_softmax/

## 学习目标

  * 写出**数值稳定** 的 softmax（必减 max）
  * 掌握 在线 softmax：合并 (max, sum) 的更新法则——FlashAttention 的核心
  * 写出 RMSNorm（Llama / GPT-NeoX 使用，比 LayerNorm 少一次求均值）

## 10.1 数值稳定的 Softmax

数学定义：

```
softmax(x_i) = exp(x_i) / sum_j exp(x_j)
```

直接实现的死法：`exp(50)` 已经 ≈ 5×10²¹，`exp(100)` 已经溢出 fp32 上限 ≈ 3.4×10³⁸。 LLM 训练 / 推理中 attention logits 经常上百，溢出后变 inf/nan，整个层崩。

救法：**减去 max** （不影响结果，因为分子分母同除一个常数）：

```
m = max(x)
softmax(x_i) = exp(x_i - m) / sum_j exp(x_j - m)
```

现在 `x_i - m ≤ 0`，`exp(...) ∈ (0, 1]`，永远不溢出。

### 三阶段实现

```
// 每 row 一个 block, BLOCK threads/row
__global__ void softmax_row(const float* x, float* y, int rows, int cols) {
    int row = blockIdx.x;
    int tid = threadIdx.x;
    const float* xr = x + row * cols;
    float* yr       = y + row * cols;

    // ---- 1) max ----
    float local_max = -FLT_MAX;
    for (int c = tid; c < cols; c += BLOCK)
        local_max = fmaxf(local_max, xr[c]);
    local_max = block_reduce_max(local_max);     // warp shuffle, 见 Ch7
    float row_max = ...;

    // ---- 2) sum ----
    float local_sum = 0.f;
    for (int c = tid; c < cols; c += BLOCK)
        local_sum += __expf(xr[c] - row_max);
    float row_sum = block_reduce_sum(local_sum);
    float inv = 1.f / row_sum;

    // ---- 3) write ----
    for (int c = tid; c < cols; c += BLOCK)
        yr[c] = __expf(xr[c] - row_max) * inv;
}
```

`__expf` 是 CUDA intrinsic，比 `expf` 略快但精度低一点；attention 里完全够用。

## 10.2 Online Softmax — 一遍扫完

上面方法要扫数据**三次** （max → exp+sum → write）。每次扫都消耗 HBM 带宽，softmax 长度大时性能不佳。

聪明算法：维护一个 running pair `(m, l)`，`m` 是目前最大值、`l` 是 `sum exp(x_i - m)`。 新看到 `(x_new, 1)`（视为有 1 个值的小 group）时：

```
m_new = max(m, x_new)
l_new = l * exp(m - m_new) + 1 * exp(x_new - m_new)
m, l = m_new, l_new
```

结果：**一遍扫数据就同时算出 max 和 sum** 。把这个 merge 嵌进 warp shuffle，一次 block reduce 搞定。

```
__device__ void merge(float& m, float& l, float xm, float xl) {
    float new_m = fmaxf(m, xm);
    l = l * __expf(m - new_m) + xl * __expf(xm - new_m);
    m = new_m;
}

// warp 内合并
for (int o = 16; o > 0; o >>= 1) {
    float om = __shfl_xor_sync(0xffffffff, m, o);
    float ol = __shfl_xor_sync(0xffffffff, l, o);
    merge(m, l, om, ol);
}
```

**🔥 为什么这是 FlashAttention 的基石？** Attention 的 softmax 维度 = 序列长度 T，可能成千上万。如果你把整个 T×T attention matrix 物化到 HBM 再做 softmax → O(T²) 显存 + 三次扫描。 online softmax 让你**一边算 QKᵀ 一边算 softmax 一边乘 V** ，全程数据驻留在 shared/register，省 O(T²) HBM 流量。第 12 章详细推导。

## 10.3 LayerNorm 与 RMSNorm

| LayerNorm| RMSNorm
---|---|---
公式| y = (x - μ) / σ · γ + β| y = x / RMS(x) · γ
需要| mean μ, var σ²| 仅 mean(x²)
参数| γ, β| 仅 γ
计算| 2 次 reduce| 1 次 reduce
用户| GPT-2, BERT| Llama, GPT-NeoX, Mistral

RMSNorm 实现（每 row 一个 block）：

```
__global__ void rmsnorm_row(const float* x, const float* gamma, float* y,
                            int rows, int cols, float eps) {
    int row = blockIdx.x, tid = threadIdx.x;
    const float* xr = x + row * cols;
    float* yr       = y + row * cols;

    float local_sq = 0.f;
    for (int c = tid; c < cols; c += BLOCK) {
        float v = xr[c]; local_sq += v * v;
    }
    float sq = block_reduce_sum(local_sq);
    float inv = rsqrtf(sq / cols + eps);          // <-- rsqrt 单指令
    for (int c = tid; c < cols; c += BLOCK)
        yr[c] = xr[c] * inv * gamma[c];
}
```

`rsqrtf`（reciprocal sqrt）是单条 SFU 指令，比 `1.f / sqrtf(x)` 快很多。

## 10.4 自检

Q1: 为什么 softmax 减 max 不影响数学结果？

`exp(x - c) / sum exp(x - c) = e^{-c} * exp(x) / (e^{-c} * sum exp(x)) = exp(x) / sum exp(x)`，常数因子抵消。

Q2: online softmax 的合并公式怎么推？

展开：`sum_old exp(x_i - m_old) * exp(m_old - m_new) = sum_old exp(x_i - m_new)`。所以 `l_new = l_old * exp(m_old - m_new) + new_part`。

Q3: LayerNorm 跟 BatchNorm 的差别？

LN 沿 feature 维度归一（与 batch 无关），BN 沿 batch 维度归一。LLM 推理 batch=1 时 BN 无法工作，所以 Transformer 一律用 LN/RMSNorm。

Q4: RMSNorm 比 LayerNorm 真的更好吗？

不一定"更好"，但**更便宜** （少一次 reduce, 少一个参数 β），且效果与 LayerNorm 接近。这就是 Llama 系列的选择。

Q5: 大 cols (D=8192) 时怎么办？

每 row 一个 block 时 D=8192 → 32 thread / 32 elem each. 用 vectorized load (`float4`) 提带宽; 或者拆 row 用多 block + atomicAdd。

## 10.5 练习

  1. 把 `softmax.cu` 改成 fp16 输入 fp32 累加，对比 fp32 输入版的精度（typical max_abs ~1e-3）。
  2. 把 `online_softmax` 扩成**支持 cols > 1024**：每 thread 处理多个 element，再 warp 合并。
  3. 写一个 **LayerNorm** kernel（多一次 mean reduce），与 cpu_ref::layernorm 对拍。
  4. 用 `float4` vector load 重写 rmsnorm，看带宽是否提升 30%+。

## 10.6 工业实战：Welford、融合 norm+GEMM、fp16 数值与对齐

### 10.6.1 Welford 算法 — 数值稳定的 variance

LayerNorm 的"经典两遍"：先算 mean，再算 var。问题：D 很大（4096+）时，第二遍累加 (x-mean)² 仍可能丢精度。

Welford 算法**单遍** 同时算 mean 和 var 且数值更稳：

```
// Welford running update
__device__ void welford_update(int& n, float& mean, float& m2, float x) {
    n += 1;
    float delta  = x - mean;
    mean        += delta / n;
    float delta2 = x - mean;
    m2          += delta * delta2;
}

// Welford merge (两个 partial 合并, warp/block reduce 用得到)
__device__ void welford_merge(int& nA, float& meanA, float& m2A,
                              int  nB, float  meanB, float  m2B) {
    int n = nA + nB;
    float delta = meanB - meanA;
    meanA = (nA * meanA + nB * meanB) / n;
    m2A  += m2B + delta * delta * (float(nA) * nB / n);
    nA = n;
}

// 最终 variance = m2 / n
```

warp 内合并用 `__shfl_xor_sync` 同时交换 (n, mean, m2) 三个 reg。生产 LayerNorm 内核（PyTorch ATen、Apex）都用 Welford。

### 10.6.2 融合 LayerNorm + QKV projection

朴素流程：

```
1) LayerNorm(X) → normed     [写 HBM]
2) QKV = normed @ W_qkv      [读 HBM]
3) split → Q, K, V            [写 HBM]
```

HBM 流量 ≈ 6 × (T·D) 字节，对 memory-bound 的小 batch decode 是浪费。

融合做法（TRT-LLM、Apex 都有实现）：把 LayerNorm 嵌入 QKV GEMM 的 **load** 阶段——每加载 X 的一行就**实时归一化** ，归一化后的值直接喂给 GEMM 的内积。

```
// 伪代码: fused LN-QKV kernel
__global__ void fused_ln_qkv(const __half* X, const __half* W_qkv,
                              const __half* gamma, const __half* beta,
                              __half* QKV, int T, int D, int D3) {
    int t = blockIdx.x;                      // row of X
    __shared__ float row_mean, row_inv_std;

    // 1) 算这一行的 mean/var (Welford block-reduce)
    welford_block_reduce(X + t*D, D, &row_mean, &row_inv_std);

    // 2) GEMM: 算 QKV[t, :] = norm(X[t,:]) @ W_qkv
    for (int out = threadIdx.x; out < D3; out += blockDim.x) {
        float acc = 0;
        for (int d = 0; d < D; ++d) {
            float xn = (__half2float(X[t*D+d]) - row_mean) * row_inv_std
                     * __half2float(gamma[d]) + __half2float(beta[d]);
            acc += xn * __half2float(W_qkv[d*D3 + out]);
        }
        QKV[t*D3 + out] = __float2half(acc);
    }
}
```

实测加速：对 decode (M=1) 阶段提升 30-50%；prefill (M 大) 因为 GEMM 已经是瓶颈，融合收益小。

### 10.6.3 fp16 softmax 的数值技巧

fp16 上限 65504，attention logits 容易爆。生产做法：**累加器必 fp32** ，**I/O 用 fp16/bf16** 。

```
// fp16 输入, fp32 累加
__global__ void softmax_fp16(const __half* x, __half* y, int rows, int cols) {
    extern __shared__ float sm[];
    int row = blockIdx.x, tid = threadIdx.x;
    const __half* xr = x + row * cols;

    // 1) row max in fp32
    float m = -FLT_MAX;
    for (int c = tid; c < cols; c += blockDim.x)
        m = fmaxf(m, __half2float(xr[c]));
    m = block_reduce_max(m);
    // 2) row sum in fp32
    float s = 0;
    for (int c = tid; c < cols; c += blockDim.x)
        s += __expf(__half2float(xr[c]) - m);
    s = block_reduce_sum(s);
    float inv = 1.f / s;
    // 3) write fp16
    for (int c = tid; c < cols; c += blockDim.x) {
        float v = __expf(__half2float(xr[c]) - m) * inv;
        y[row * cols + c] = __float2half(v);
    }
}
```

**bf16 时甚至不用减 max** （动态范围 ±10³⁸ 跟 fp32 一样），但减 max 是免费的稳定保险，**仍然要做** 。

### 10.6.4 向量化 + 对齐：减半的 HBM 流量

softmax / norm 是 memory-bound（每个元素 O(1) FLOP）。把 fp16 用 `__half2` 一次读两个：

```
// 慢: 一次一个 fp16
for (int c = tid; c < cols; c += BLOCK)
    sum += __half2float(x[c]);

// 快: 一次 __half2 (相当于 fp16x2, 一条指令)
const __half2* x2 = reinterpret_cast<const __half2*>(x);
for (int c = tid; c < cols / 2; c += BLOCK) {
    __half2 v = x2[c];
    sum += __half2float(__low2half(v)) + __half2float(__high2half(v));
}
```

用 `uint4` (= 8 fp16) 一次搬 16 字节，吞吐再 +30%。生产 norm kernel **必** 向量化。

### 10.6.5 RMSNorm 与 GeLU 的 fp16 融合

Llama / Mistral 的 FFN 大量出现：

```
y = silu(x @ W_gate) ⊙ (x @ W_up)        // SwiGLU
y_norm = RMSNorm(y + residual)             // 下一层 norm
```

生产 kernel 把这一连串 **silu + element-wise mul + add residual + RMSNorm** 融合成 1 个 kernel，把 4 次 HBM 来回压缩成 1 次。TensorRT-LLM 的 fused MLP 就是这样。

### 10.6.6 各 norm 的工业选择

Norm| 用户| 需要的 reduce| 参数
---|---|---|---
LayerNorm| GPT-2/3/4, BERT| mean + var (Welford)| γ, β
RMSNorm| Llama, Mistral, Qwen, GPT-NeoX| 只要 mean(x²)| 仅 γ
GroupNorm| CV (Stable Diffusion U-Net)| 按 group 分别 mean/var| γ, β
BatchNorm| CV CNN 训练| 跨 batch 维 mean/var| γ, β, running stats

LLM 推理基本只见 LayerNorm 和 RMSNorm。后者实现简单 30%，是新模型默认选项。

## 10.7 研究前沿（2025-2026）：QK Norm、FP8 Softmax、超大融合

### 10.7.1 QK Norm — 训练稳定性新标配

2024-2025 几乎所有新模型（DeepSeek-V3、Qwen 3、Llama 4、Gemma 2）都加了 **QK Norm** ：在算 QK^T 前对 Q 和 K 各做一次 RMSNorm。

```
// 标准:    S = (Q @ K^T) / sqrt(D)
// QK-Normed: Q' = RMSNorm(Q, gamma_q)
//            K' = RMSNorm(K, gamma_k)
//            S  = Q' @ K'^T  *  scale
```

动机：fp8 训练中 logits outlier 让 softmax 输入超 fp8 范围。QK Norm 标准化后 attention logit 分布更稳，**是 fp8 训练能跑稳的关键之一** 。

### 10.7.2 FP8 / FP4 Softmax 的数值铁律

张量| fp16| fp8 推理| fp4 推理
---|---|---|---
logits 输入| fp16| fp8 E4M3| fp8 E4M3 (不是 fp4!)
row_max| fp32| fp32| fp32
exp(x - max)| fp32| fp32| fp32
row_sum| fp32| fp32| fp32
P (概率)| fp16| fp8 E4M3| fp8 E4M3

**铁律** ：softmax 内部 reduce 永远 fp32，无论输入输出多低精度。fp4 时连 attention 的 P 都最好用 fp8 而非 fp4（避免 PV 阶段精度爆崩）。

### 10.7.3 Norm 选型（2026）

Norm| 2024-2026 使用情况
---|---
LayerNorm| GPT-2/3/4 老模型；新模型已弃用
RMSNorm| Llama 2/3/4, Mistral, Qwen, DeepSeek — **事实标准**
RMSNorm + QK Norm| DeepSeek-V3, Qwen 3, Gemma 2 — 2024-26 SOTA
Z-Loss| PaLM 起源, 训练辅助 loss, 让 logsumexp 接近 0, fp8 训练有用
Pre-Norm vs Post-Norm| 新模型 Pre-Norm 主流, 但 DeepNet 等 Post-Norm 改良有人在用

### 10.7.4 fused-everything：Norm + Activation + Residual + Quant 一坨

2024-2026 生产 kernel 越来越往"超大融合"走。真实的 SwiGLU + RMSNorm + residual + fp8 量化 kernel：

```
__global__ void fused_swiglu_rmsnorm_quant(
    const __half* gate, const __half* up, const __half* residual,
    const __half* gamma, float* scale_out, __nv_fp8_e4m3* out, int T, int D) {
    int t = blockIdx.x, tid = threadIdx.x;
    float acc[D / BLOCK];
    // 1) SiLU(gate) * up + residual, 留寄存器
    for (int d = tid, i = 0; d < D; d += BLOCK, ++i) {
        float g = __half2float(gate[t*D+d]);
        float u = __half2float(up[t*D+d]);
        float r = __half2float(residual[t*D+d]);
        acc[i] = g / (1 + __expf(-g)) * u + r;
    }
    // 2) RMSNorm: mean(x²) reduce
    float sq = 0;
    for (int i = 0; i < D/BLOCK; ++i) sq += acc[i] * acc[i];
    sq = block_reduce_sum(sq);
    float inv_rms = rsqrtf(sq / D + 1e-5f);
    // 3) Norm * gamma + 量化到 fp8 (per-row scale)
    float row_amax = 0;
    for (int d = tid, i = 0; d < D; d += BLOCK, ++i) {
        float v = acc[i] * inv_rms * __half2float(gamma[d]);
        row_amax = fmaxf(row_amax, fabsf(v));
        acc[i] = v;
    }
    row_amax = block_reduce_max(row_amax);
    float scale = row_amax / 448.f;          // E4M3 max
    if (tid == 0) scale_out[t] = scale;
    for (int d = tid, i = 0; d < D; d += BLOCK, ++i)
        out[t*D+d] = __nv_fp8_e4m3(acc[i] / scale);
}
```

这一个 kernel 替代了 5 个独立 kernel + 4 次 HBM 来回。**LLM decode 减少 30-50% 显存流量** 。TensorRT-LLM 的 fused MLP 全这么写。

### 10.7.5 Online softmax 的扩展应用（2024-2025）

  * **Chunked Prefill** （vLLM 2024）：prompt 分多块处理，跨块用 online softmax merge
  * **Prefix Caching + Online Softmax** （SGLang）：命中 prefix 的 (m, l) 跟新 token 的合并
  * **Speculative 验证** ：多候选 token 概率分布在线 reduce
  * **Mamba 状态更新** ：借鉴 online 累加思路

### 10.7.6 训练侧新 loss 对 softmax 的影响

  * **DPO/IPO/KTO** ：偏好对齐，算 `log_prob_diff = log(p_chosen / p_rejected)`，**softmax 后再 reduce**
  * **GRPO** （DeepSeek-R1, 2025）：强化学习 reasoning，多采样 reward → softmax + relative reward reduce
  * **Z-Loss** ：辅助 loss 让 logsumexp 接近 0，fp8 训练标配

## 10.8 常见坑

  * 忘记减 max → 长 attention logits 直接 inf，模型输出全 nan
  * online softmax 的 `exp(m - m_new)` 当 m=-FLT_MAX 时报 -inf - 大数 = -inf，`exp(-inf) = 0`，正常；但初始值要小心设
  * RMSNorm 算 mean(x²) 时直接 fp16 累加 → 损失精度，必须 fp32
  * fp4 推理把 P 也存 fp4 → PV 阶段精度暴跌，必须 P 保持 fp8
  * QK Norm 漏掉 K 或 Q 任一边 → 训练 loss 看着没事但下游评测掉点
  * fused kernel 一旦写错某一步，整个 kernel 失败但 stack trace 没用 — debug 把 fused 拆回独立 kernel 二分定位
