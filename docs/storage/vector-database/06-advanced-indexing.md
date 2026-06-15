---
source: https://www.yuque.com/yangguangfanxing/nmhuv1/ffox3o473ky0yud9
---

# Advanced indexing

> 原文链接：[https://www.yuque.com/yangguangfanxing/nmhuv1/ffox3o473ky0yud9](https://www.yuque.com/yangguangfanxing/nmhuv1/ffox3o473ky0yud9)

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239777870-a5f2638a-186e-4dcd-8903-d333234103c7.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239778096-1e747b00-ce47-4474-be54-c38c2aaf63a5.png)

# 回顾与本讲主线

上一讲介绍了 kNN、过滤查询、多向量查询、reranking，以及 Flat、LSH、IVF、HNSW 等基础索引。本讲关注更工程化的问题：当数据规模非常大、索引占内存、更新频繁、重建昂贵时，向量数据库如何维持性能。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239777950-24730110-9517-4ae8-b308-21e38bd17966.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239777957-440368e2-7342-4365-856b-daff3fa63e02.png)

两个常见问题：

1. **内存占用大**：用 sharding、quantization、composite index、disk-resident index 处理。
2. **需要周期性重建**：用 freshness layer、segmenting、updatable index 处理。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239778132-97783ee8-b1d0-4e1c-a5b0-7c0497ae3dd7.png)

# Sharding：分片

Sharding 将数据切成 ![](https://cdn.nlark.com/yuque/__latex/df976ff7fcf17d60490267d18a1e3996.svg) 个互不重叠的 shard，每个 shard 存约：![](https://cdn.nlark.com/yuque/__latex/cc65684858330400be006e928432df58.svg)个向量，并单独建索引。

查询时并行访问所有 shard，每个 shard 返回局部 top-k，最后合并成全局结果。

**优点：** 每台机器数据更少，查询和插入可以并行，大多数系统都会使用。

**缺点：** 需要更多机器，总内存仍然大，边界近邻处理复杂，只是延缓内存问题，不是根本解决方案。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239786377-5096fa63-8d97-419d-8564-2227407ce4e2.png)

# Quantization：量化

量化用更少 bit 表示向量，从而减少内存、加快比较，但会损失准确率。常见方法：

1. Scalar Quantization，标量量化
2. Vector Quantization，向量量化
3. Product Quantization，乘积量化

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239786560-84e5a2f2-1bfd-46d0-b63d-39dadc894a83.png)

## SQ：标量量化

SQ 对每个维度单独量化，把 FP32 压缩成 ![](https://cdn.nlark.com/yuque/__latex/df378375e7693bdcf9535661c023c02e.svg)bit。若第![](https://cdn.nlark.com/yuque/__latex/2443fbcfeb7e85e1d62b6f5e4f27207e.svg) 维取值范围为：

![](https://cdn.nlark.com/yuque/__latex/8efedefef9a707f441a0bc21883c49a2.svg)

均匀量化的 bin size 为：

![](https://cdn.nlark.com/yuque/__latex/b866f1acc22b4b3cc9166de230a95df9.svg)

量化值近似为：

![](https://cdn.nlark.com/yuque/__latex/25b6c6925555d9ae67e71f4274002a68.svg)

常见 SQ8：

![](https://cdn.nlark.com/yuque/__latex/a1bbc33594f413b23057f5b173ec62ab.svg)

通常可让内存减少约 4 倍，比较更快，recall 只小幅下降。低于 8 bit 通常更不稳定，但有系统会使用 2-bit，例如 Timescale 的 SBQ。

1. **x₃**（原始32位分量）

- 表示**原始向量中的第3个分量**，使用32位浮点数存储
- 是量化前的原始高精度数值
- 在图中可能显示为一个蓝色的32位块

1. **Q(x₃)**（量化后的8位值）

- 表示**x₃ 经过标量量化后的结果**，使用8位整数存储
- 是量化后的低精度表示
- 在图中可能显示为一个蓝色的8位块，表示存储空间减少

1. 实际数值示例：

假设某个向量的第3个分量：

- 原始值：x₃ = 0.723（32位浮点数）
- 该分量范围：min=0.0, max=1.0
- 量化计算：

```
binsize = (1.0 - 0.0) / 256 = 0.00390625
Q(x₃) = round[(0.723 - 0.0) / 0.00390625] = round[185.088] = 185
```

- 存储变化：

1. 图中的其他信息关联：

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239786398-4598da67-1293-4be5-8253-9488b3e60d04.png)

## VQ：向量量化

VQ 将整个向量映射到某个 cluster centroid。

流程：

1. 对向量聚类

1. 每个向量用最近 centroid 的编号表示
2. 距离计算时用 centroid 近似原向量

若 codebook 有 ![](https://cdn.nlark.com/yuque/__latex/df976ff7fcf17d60490267d18a1e3996.svg)个 centroid，维度为![](https://cdn.nlark.com/yuque/__latex/558270b7f0a90c3c286b860273d106a0.svg)，每轮 k-means 代价约为：

![](https://cdn.nlark.com/yuque/__latex/148a620c3cb141ac8d6177ef35566df1.svg)

codebook 空间为：

![](https://cdn.nlark.com/yuque/__latex/1291ae33af117c10fea06e843f49e846.svg)

向量编码空间约为：

![](https://cdn.nlark.com/yuque/__latex/9929a7fa599a7feda32f4065dbb557be.svg)

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239786469-589355f6-b003-4382-a807-b176b0a55f4d.png)

问题是高维空间需要非常大的 ![](https://cdn.nlark.com/yuque/__latex/df976ff7fcf17d60490267d18a1e3996.svg)才能保持分辨率：小![](https://cdn.nlark.com/yuque/__latex/df976ff7fcf17d60490267d18a1e3996.svg)误差大，大![](https://cdn.nlark.com/yuque/__latex/df976ff7fcf17d60490267d18a1e3996.svg) 又让训练和 codebook 都变得很大。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239786377-e23d5a8e-d1f6-4f58-9303-17745d4029ca.png)

## PQ：乘积量化

PQ 将 ![](https://cdn.nlark.com/yuque/__latex/558270b7f0a90c3c286b860273d106a0.svg)维向量切成![](https://cdn.nlark.com/yuque/__latex/4760e2f007e23d820825ba241c47ce3b.svg) 个子空间，每个子空间维度为：![](https://cdn.nlark.com/yuque/__latex/1a34a62de3b39d5b49c3740305245e8f.svg)，每个子空间独立做 VQ。

若每个子空间使用 ![](https://cdn.nlark.com/yuque/__latex/e81e0e0ef19a030ced1684f5fb0ced99.svg) bit，则每个子空间 centroid 数为：

![](https://cdn.nlark.com/yuque/__latex/2f2a8364ce08f88864922221c1afe5cc.svg)

乘积量化（PQ）的核心思想是：

将一个高维向量切分成多个低维子向量，然后在每个子空间中分别进行向量量化，用簇心 ID 替代原始子向量，从而实现向量压缩和快速近似距离计算。

换句话说，PQ 不是直接在整个高维空间中做一次量化，而是把高维空间拆成多个子空间，在每个子空间中独立做聚类和编码。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239787134-e2f1454c-331c-4c53-8887-b82118754d1f.png)

### 训练阶段：构建码本

在训练阶段，对于每个子空间，PQ 会独立进行向量量化（Vector Quantization, VQ）。

假设原始向量维度为 `D`，被切分成 `m` 个子向量：

```
x = [x₁, x₂, ..., xₘ]
```

每个子向量位于一个低维子空间中。

1. 记录什么？

对于每个子空间，使用聚类方法，例如 k-means，得到 ![](https://cdn.nlark.com/yuque/__latex/08dca0a15e67731bf86571d2ae05fd36.svg) 个簇心。

这些簇心也称为：

- centroid
- codeword
- 码字
- 子空间码本中的条目

对于第 `i` 个子空间，会得到一个码本：

```
Cᵢ = {c_{i1}, c_{i2}, ..., c_{iK*}}
```

所有 `m` 个子空间的码本共同构成 PQ 的完整码本：

```
C = {C₁, C₂, ..., Cₘ}
```

1. 不记录什么？

PQ 压缩完成后，通常不再存储原始高维向量。

原始向量会被替换成一个短编码：

```
code(x) = [id₁, id₂, ..., idₘ]
```

其中：

- `id₁` 表示第 1 个子向量最近的簇心编号；
- `id₂` 表示第 2 个子向量最近的簇心编号；
- 以此类推；
- `idₘ` 表示第 `m` 个子向量最近的簇心编号。

因此，数据库中的每个向量最终只需要保存一串整数 ID，而不是完整的浮点向量。

一个向量被编码为：

![](https://cdn.nlark.com/yuque/__latex/c8200be2b02f33281cb74da43cc2280b.svg)

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239787172-5cb5b0fb-c67d-48b3-8944-4b42d312a9cd.png)

### 查询阶段

当有一个查询向量 `q` 时，PQ 的处理过程如下。

1. 分割查询向量

首先将查询向量 `q` 按照与数据库向量相同的方式切分成 `m` 个子向量：

```
q = [q₁, q₂, ..., qₘ]
```

1. 与对应子空间的簇心比较

对于第 `i` 个子向量 `qᵢ`，只需要与第 `i` 个子空间码本中的 ![](https://cdn.nlark.com/yuque/__latex/08dca0a15e67731bf86571d2ae05fd36.svg) 个簇心进行比较：

```
qᵢ ↔ Cᵢ = {cᵢ1, cᵢ2, ..., cᵢK*}
```

然后找到距离最近的簇心，并用该簇心的 ID 替代 `qᵢ`。

例如：

```
qᵢ → idᵢ
```

1. 得到查询向量的 PQ 编码

将所有子空间中的最近簇心 ID 拼接起来，就得到查询向量的 PQ 编码：

```
code(q) = [id₁, id₂, ..., idₘ]
```

### 搜索阶段：查表计算近似距离

1. 预先计算距离表

在搜索前，先用查询向量 `q` 的每个子向量，分别与对应子空间码本中的所有簇心计算距离。

对于第 `i` 个子空间，计算：

```
d(qᵢ, cᵢ1), d(qᵢ, cᵢ2), ..., d(qᵢ, cᵢK*)
```

所有子空间的距离结果组成一个大小为：

```
m × K*
```

的距离表。可以理解为：

| 子空间 | 簇心 0 | 簇心 1 | ... | 簇心 K*-1 |
| --- | --- | --- | --- | --- |
| 1 | d(q₁, c{₁,0}) | d(q₁, c₁1) | ... | d(q₁, c{₁,K*-1}) |
| 2 | d(q₂, c₂0) | d(q₂, c₂1) | ... | d(q₂, c₂K*-1) |
| ... | ... | ... | ... | ... |
| m | d(qₘ, cₘ0) | d(qₘ, cₘ1) | ... | d(qₘ, cₘK*-1) |

1. 对数据库向量做快速近似距离计算

数据库中的每个向量已经被压缩成 PQ 编码：

```
code(x) = [id₁, id₂, ..., idₘ]
```

要计算查询向量 `q` 与数据库向量 `x` 的近似距离，只需要：

1. 根据 `id₁`，从第 1 个子空间的距离表中取出对应距离；
2. 根据 `id₂`，从第 2 个子空间的距离表中取出对应距离；
3. 以此类推；
4. 将 `m` 个距离相加。

即：

```
approx_dist(q, x) = Σ d(qᵢ, cᵢ,idᵢ)
```

这样，原本复杂的高维距离计算就变成了：

```
m 次查表 + m 次加法
```

这比直接计算原始高维向量之间的欧氏距离快得多。

流程总结:

| 阶段 | 操作 | 结果 |
| --- | --- | --- |
| 训练 / 压缩 | 分块 → 每块聚类 → 记录簇心 | 得到 `m` 个小型码本，数据库向量被压缩为短编码 |
| 查询编码 | 查询向量分块 → 每块与对应码本的簇心比较 → 替换为 ID | 查询向量也可以被转化为短编码 |
| 搜索 | 预先计算距离表 → 对数据库编码查表求和 | 实现快速、近似的最近邻搜索 |

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239787123-ac7d177f-d8d0-499f-a872-1ca463805505.png)

**PQ 的优势**

组合数为：

![](https://cdn.nlark.com/yuque/__latex/e2455c0b12900e048e116e0b9870a860.svg)

即多个小 codebook 组合成一个巨大隐式 codebook。

原始 FP32 向量需要：

![](https://cdn.nlark.com/yuque/__latex/90fa199968a3b7205997763cbdfee532.svg)

PQ 只需要：

![](https://cdn.nlark.com/yuque/__latex/a523612ccbf10b69de4192a98fa888bf.svg)

例如 ![](https://cdn.nlark.com/yuque/__latex/078e5669f776c9bf04caf166d5e53d50.svg)：

![](https://cdn.nlark.com/yuque/__latex/dedc78d9b19cbbf0741ba5286e260c5a.svg)

PQ的核心创新：**将高维空间分解为m个子空间的笛卡尔积**

```
原始空间：ℝᴰ
分解为：ℝ^(D/m) × ℝ^(D/m) × ... × ℝ^(D/m)  [m个]
```

原始VQ：

- 码本大小 = k
- 每个向量用 log₂k 比特表示
- 码本存储 = 32kD 比特

PQ分解后：

假设将D维向量分成m个子向量，每个子向量维度 = D/m

在每个子空间中：

- 我们只需学习 ![](https://cdn.nlark.com/yuque/__latex/d44a7d683fc5d7cb530c0267207ad123.svg) 个聚类中心。

因为：总聚类中心数 ![](https://cdn.nlark.com/yuque/__latex/b5d0226e95385ee1abd7b6f1f747a0ea.svg)

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239787403-9b107d17-066d-456d-8d47-5b0861606776.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239787362-2d89d0b2-7719-43e3-80d3-a5d218ec61a7.png)

SIFT1M 示例：Flat 约 512MB、8.26ms、100% recall；PQ 约 4MB、1.49ms、50% recall。结论是：PQ 极省内存，但单独使用准确率偏低。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239787621-87252d2e-b43b-401a-8619-391109a3e100.png)

# Composite Index：组合索引

组合索引把多个技术叠加，例如 IVF+PQ、IVF+HNSW、IVF+HNSW+PQ。现代生产级索引通常都是组合索引或图索引。

常见增强：

- **OPQ**：量化前旋转向量，使 PQ 更有效
- **Rerank**：查询后用原始向量重排
- **Residual encoding**：量化残差 ![](https://cdn.nlark.com/yuque/__latex/36ab6937943a3bb127c0adf50ae1afd8.svg)
- **Asymmetric distance**：查询向量不量化，只量化数据库向量

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239787683-a46b650a-6c3c-4b48-97c1-e576ceb53165.png)

## IVFPQ：IVF + PQ

IVFPQ 先用 IVF 将空间划分成 cell，再在 cell 内保存 PQ code。查询时先选 cell，再搜索量化向量，可选地用原始向量 rerank。

示例：

| 方法 | 内存 | 查询延迟 | Recall |
| --- | --- | --- | --- |
| Flat | 512 MB | 8.26 ms | 100% |
| PQ | 4 MB | 1.49 ms | 50% |
| IVFPQ | 9 MB | 0.09 ms | 52% |
| IVF256 PQ32x8 | 40 MB | 0.73 ms | 74% |

IVFPQ 很快且省内存，但 PQ 误差限制 recall。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239787863-0da57aec-189e-412c-8f11-4b5a037ca054.png)

## IVF + HNSW

该方法用 IVF 创建许多 cell，把 centroids 放入 HNSW。查询/插入时先用 HNSW 找最近 cell，再在 cell 内比较。

优点是快、recall 高；缺点是内存重。加入 PQ 后内存显著下降，但 recall 也下降。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239787865-7de93ef8-a3f0-4e1c-8008-1e2658229180.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239788202-4a1d971c-c539-43df-8a5d-d84a58d0e53b.png)

## IVFOADC + G + P

它的核心思想是：把多种已有 ANN 技术组合起来，再加上新的 **Grouping 分组** 和 **Pruning 剪枝**，让搜索非常快，但代价是召回率不算特别高，尤其在低内存压缩场景下。

### 名字拆解

可以粗略理解为：

在 IVFADC / OPQ / HNSW 等技术基础上，加入 Grouping 和 Pruning 的复合索引。

**IVF：Inverted File Index，倒排文件索引**

先用粗聚类器把向量空间分成很多簇。查询时，不扫描全库，而是：

1. 找到离 query 最近的几个簇；
2. 只在这些簇里面搜索候选向量。

优点是快，缺点是如果最近邻落在没被访问的簇里，就会漏掉。

**ADC：Asymmetric Distance Computation，非对称距离计算**

数据库里的向量被压缩存储，比如用 Product Quantization，PQ。

查询向量不压缩，仍然保持原始浮点形式。

搜索时计算：

```
distance(query 原始向量, database 压缩向量)
```

这叫 asymmetric，因为 query 和 database 的表示形式不同。

优点：

- 内存低；
- 距离计算快；
- 精度比 query 也压缩的 symmetric 方法更好。

**OPQ：Optimized Product Quantization**

PQ 之前先对向量做一个旋转/变换，让不同子空间的信息分布更均匀，从而提高压缩质量。

可以理解为：

普通 PQ 是直接切向量；OPQ 是先把坐标系转一下，再切，压缩误差更小。

**Residual encoding / IVFADC**

IVFADC 里面常见做法是：

1. 先用 IVF 粗聚类；
2. 每个向量只存储它相对于簇中心的残差；
3. 再对残差做 PQ 压缩。

也就是：

```
x ≈ coarse centroid + compressed residual
```

这样比直接压缩原向量更准确。

**HNSW**

HNSW 是图索引。这里它不是主角，而是作为辅助技术使用，比如加速 coarse centroid 的搜索，或者帮助组织簇之间的访问顺序。

### G + P

Novel grouping, pruning procedure

也就是新的 **分组 + 剪枝** 方法。

#### Grouping：进一步细分簇

传统 IVF 里面，一个簇可能还是很大。

查询时，如果选中某个簇，就要扫描这个簇里的很多压缩向量。

Baranchuk 这篇工作的想法是：

在每个 IVF 簇内部，再划分成若干个 subdivision / group。

但关键是：

```
Subdivide clusters without extra memory!
```

也就是说，它不是额外存很多子簇中心，也不是大量增加索引结构，而是利用已有的编码信息来隐式地把簇进一步分组。

直观上：

- 左图：普通 IVF 中，一个 query 附近需要访问几个大的簇；
- 右图：每个大簇又被细分成更小的区域，query 只需要访问其中更相关的子区域。

#### Pruning：跳过远离 query 的子区域

有了 subdivision 之后，就可以做剪枝。

查询时：

1. 先找到相关的粗簇；
2. 在粗簇内部判断哪些子区域离 query 比较近；
3. 只扫描近的 subdivision；
4. 跳过远的 subdivision。

Skip subdivisions far from query.

也就是：

不再对整个 IVF list 暴力扫描，而是在 list 内部继续筛掉一部分候选。

这样可以大幅减少要比较的压缩向量数量。

右图里每个 coarse cell 又被划分成更小的 subdivision。

- 绿色线/点表示分组或候选连接结构。
- 蓝色区域变小，表示经过 grouping + pruning 之后，真正需要扫描的范围减少了。

核心意思：

原来搜几个大簇，现在搜这些簇里靠近 query 的小分区。

### **IVFOADC+G+P**总结

**IVFOADC+G+P 是一种“工程组合拳”式的 ANN 索引：**

用 IVF 缩小搜索范围，用 OPQ/PQ/ADC 压缩和快速算距离，用 residual encoding 提高压缩精度，再通过 grouping 和 pruning 在簇内部进一步减少扫描量。

它的特点是：

| 方面 | 评价 |
| --- | --- |
| 查询速度 | 很快，可低于 1ms |
| 内存占用 | 很低，支持 16 bytes 级别压缩 |
| 召回率 | 不算高，尤其低内存下较低 |
| 方法性质 | 组合已有技术 + 新的簇内分组剪枝 |
| 适用场景 | 极端追求速度和内存压缩的大规模检索 |
| 不适合场景 | 对高召回、高精度要求特别强的场景 |

简单说：

它是一个为了速度和内存效率牺牲一部分召回率的向量索引方案。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239790077-a4f10c73-fa9d-4061-8254-14d730229a54.png)

### 性能图测试

右侧曲线图：

- 横轴：查询时间，单位 ms；
- 纵轴：Recall@10，16 bytes 压缩码长；
- 越靠左越快；
- 越靠上召回越高。

图中方法包括：

- `O-Multi-D-OADC`
- `IVFOADC`
- `IVFOADC-fast`
- `IVFOADC+G`
- `IVFOADC+G+P`

其中蓝色虚线 `IVFOADC+G+P` 表现最好。

它说明：

在相同时间预算下，加入 grouping + pruning 后召回更高；在相同召回下，查询更快。

大概可以看到：

- 在 1ms 左右，`IVFOADC+G+P` 已经能达到接近 0.78 的 Recall@10；
- 到 2ms 以上，最高大概到 0.81 左右；
- 它比单纯的 `IVFOADC` 或只加 `G` 的版本更优。

#### Very fast

因为它同时用了几层加速：

1. IVF 减少粗粒度候选；
2. PQ / OPQ 压缩减少内存和距离计算开销；
3. ADC 快速查表算距离；
4. grouping 进一步减少簇内扫描量；
5. pruning 跳过远的 subdivision；
6. HNSW 可能辅助快速定位 coarse cells。

所以查询可以做到：< 1ms

这在大规模向量检索里非常快。

#### Low recall

Low recall, very low for low memory

原因主要有几个：

第一，压缩损失

16 bytes 表示每个向量只用 16 字节左右存储，这非常省内存。

但压缩越狠，距离估计越不准。

第二，IVF 会漏簇

如果真实最近邻在没有被访问的 coarse cluster 里面，就直接被漏掉。

第三，pruning 会进一步漏候选

剪枝提高速度，但如果判断错了，就可能把包含真实最近邻的 subdivision 跳过。

第四，低内存场景更严重

内存越低，PQ code 越短，向量表示越粗糙。所以距离估计误差更大，召回下降更明显。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239789957-bc6f2052-1bf8-4908-a3c9-695b4445155b.png)

# Disk-resident Index：磁盘驻留索引

当 ![](https://cdn.nlark.com/yuque/__latex/e3714b8d071d19cf494584750b861237.svg) 时，内存索引成本很高，可以考虑把索引放到 SSD 上。

难点是 SSD 随机读受限，延迟由 I/O round-trip 数量主导。普通图索引会产生大量随机读，因此磁盘索引必须减少随机读和 I/O 请求。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239789961-d7167828-c9b7-463f-9543-f8a8d0b88dff.png)

## ANNOY：随机投影树

ANNOY 是 Random Projection Tree 的变体。构建时递归随机划分：

1. 选择随机方向 ![](https://cdn.nlark.com/yuque/__latex/77c3adce895348f6083c425fe1ba2624.svg)
2. 将数据投影到 ![](https://cdn.nlark.com/yuque/__latex/77c3adce895348f6083c425fe1ba2624.svg)
3. 找中位数阈值 ![](https://cdn.nlark.com/yuque/__latex/cead1760d9d5723460c4b8d4028f113a.svg)
4. 按条件分裂：

![](https://cdn.nlark.com/yuque/__latex/920b7a71a0bc8717f2cdd0d6b441f47d.svg)

1. 递归到叶子足够小
2. 构建多棵随机树提高准确率

**构建多棵树的关键在于“独立”和“随机”**：

- **独立构建**：每一棵随机投影树都是**完全独立**构建的。这意味着：

- **相同数据，不同视角**：所有树都是在**同一个完整数据集**上构建的。但由于每棵树在每一个分割点都使用了不同的随机方向，因此它们对数据空间的划分方式也完全不同。可以把每棵树想象成从不同角度、用不同“刀法”来切割同一个数据空间。
- **结果**：最终你会得到一个**森林**，包含 `n_trees`棵结构各异的随机投影树。同一个数据点会出现在森林中**每一棵树**的某个叶节点中，但它在每棵树里的“邻居”（同一叶节点的其他点）可能完全不同。

**优点**：

- **克服单棵树的随机性**：单棵树的划分可能由于一次“不幸”的随机方向选择而很不均匀，导致查询路径很差。多棵树可以平均掉这种坏运气。
- **提高召回率**：真正的最近邻可能在某棵树的划分中被“隔开”了，但在另一棵树的划分中，它很可能和目标点落在同一个叶节点。搜索多棵树，就能从更多“视角”找到候选近邻，提高找到真正最近邻的概率。

**查询过程**

当需要为一个查询向量 `q`寻找近似最近邻时，Annoy 会同时利用森林中的所有树：

1. **并行树遍历**：从每棵树的**根节点**开始，**同时**向下遍历。
2. **独立决策**：对于正在遍历的每一棵树，在每一个内部节点，执行和构建时完全相同的判断：

1. **到达叶节点**：在每棵树中重复步骤2，直到到达一个**叶节点**。
2. **收集候选集**：将这个查询 `q`在**所有树**中到达的叶节点内的所有数据点（向量）收集起来，合并成一个**候选向量池**。这个池子里的点，就是 `q`在每棵树的划分规则下被认为是“潜在邻居”的点。
3. **精确计算与排序**：为了避免重复，会对候选池中的向量进行**去重**。然后，**精确计算**查询向量 `q`与候选池中每一个向量的真实距离（例如欧氏距离、余弦距离等）。
4. **返回结果**：根据计算出的真实距离，对候选向量进行排序，返回距离最小的前 `n`个作为最终的近似最近邻结果。

**查询的直观理解**：你不是只问一个人（一棵树）“谁和我最近？”，而是问一群人（一个森林），每个人从自己的视角（划分方式）给出他们认为是邻居的名单。你把这些名单合起来，再亲自和名单上的每个人核对一下（精确计算距离），最后找出真正最亲近的几个。

| 方面 | 单棵树 | 多棵树（Annoy 森林） |
| --- | --- | --- |
| **构造** | 用一种随机划分序列递归分割数据。 | 独立构建多棵单棵树，每棵树有自己独立的随机划分序列。 |
| **查询** | 沿一棵树的一条路径找到单一叶节点，取其中的点作为候选。 | **并行**遍历所有树，到达多个叶节点，合并所有叶节点中的点形成更大的候选池。 |
| **核心思想** | 快速、粗略的划分。 | **集成学习**：用多棵树的“投票”（叶节点成员）来提高召回率和稳定性。 |
| **权衡** | 构建和查询极快，但结果不稳定，精度有限。 | 以更多的构建时间、更多的内存（存储多棵树）和稍长的查询时间为代价，换来**显著更高、更稳定**的搜索精度。 |

**“Build random forest for accuracy”** 正是这个精髓：通过构建一个由多棵随机投影树组成的森林，来提升搜索的准确度。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239789991-686c4753-fd06-45a8-80e5-58a7b3b9c4d3.png)

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239790202-812cc98f-7f49-42cc-951c-bab086a4d055.png)

查询时沿树下降，若查询点接近分裂平面，可搜索两边。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239790729-a939395f-a32a-40f0-8e67-a78c2dc2411b.png)

ANNOY 静态文件可 mmap、加载快、可共享，但不支持更新，需要重建。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239790673-09f8097e-3efd-46b4-a1bf-ba73c9ba858c.png)

## DiskANN 与 Vamana

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239791339-b4393445-bdb2-4c23-834e-58b3de2936ba.png)

DiskANN 是磁盘驻留图索引：

- RAM 存 PQ 压缩向量用于估计距离，
- 磁盘存 full precision vector 和最多 ![](https://cdn.nlark.com/yuque/__latex/dd1caa3f2e1582dab2cf9bfdb21b7556.svg) 个邻居 id。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239790877-fc123e6a-477f-4ad2-a79d-cdb8ef8b4fe3.png)

每次图 hop 可能触发磁盘访问，因此图要尽量少 hop、out-degree 有界（![](https://cdn.nlark.com/yuque/__latex/e72d82ff50a1c19afe0347b8f5542ff5.svg)）。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239790774-1e1cdda6-83eb-4ef2-8ed4-3471ec93fb3b.png)

### Pruning 整体流程

左边文字描述的就是完整的迭代选邻居 + 剪枝的过程：

| 步骤 | 操作 | 说明 |
| --- | --- | --- |
| 1 | `V = points near path from entry to x` | 先收集候选点集 `V`：从图入口搜索到 `x` 的路径上附近的点，都是 `x` 的邻居候选人 |
| 2 | `Find p = closest to x in V` | 在当前候选集 `V` 里，找出离 `x` 最近的点 `p` |
| 3 | `Add edge x → p` | 正式把 `p` 设为 `x` 的邻居，连一条边 |
| 4 | `Discard nodes in V near p`判断条件：`d(p, u) < d(u, x)` | 剪枝：把 `V` 里那些「离 `p` 比离 `x` 更近」的点 `u` 删掉如果 `u` 跟已选邻居 `p` 的距离，比跟 `x` 的距离还近，就从候选集移除 `u` |
| 5 | `Repeat` | 重复步骤 2→3→4，直到候选集 `V` 为空，或者 `x` 的邻居数达到上限 |

### 逐图对应流程阶段

第一次选邻居 + 第一次剪枝

- 黑色点：新节点 `x`
- 绿色点 `p`：刚从候选集 `V` 里选出的、离 `x` 最近的邻居
- 叉号点 `u`：正在被剪枝的候选点
- 黑线：`x → p`，正式加入的边
- 虚线蓝线：`x → u`，原本可能的候选边
- 虚线红线：`p → u`

这一步的判断：

```
d(p, u) < d(u, x)
```

也就是 `u` 离 `p` 比离 `x` 更近。

结论：`u` 被从候选集 `V` 中移除，**不会成为**`x`**的邻居**。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239791198-316f600a-feb4-45de-9cfb-c2c09b21c5b8.png)重复迭代，选更多邻居，剪更多冗余

现在已经选了好几个邻居（多条黑线），又有一批叉号的候选点 `u` 被剪掉。

这些 `u` 的共同点是：

它们都离某个已经选好的邻居 `p` 更近，比离 `x` 还近。

所以 `x` 不需要再直接连它们——搜索时从 `x` 走到 `p`，再从 `p` 走到 `u` 更顺。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239791301-3fa3eaff-12db-4393-8c58-44ed41688c4e.png)继续向更远方向选邻居

候选集 `V` 里剩下的点，都是**没有被之前选的邻居"覆盖"掉**的点。

也就是说，它们离任何一个已选邻居 `p`，都没有比离 `x` 更近。

因此下一个选出的 `p` 会在另一个方向上，继续剪枝该方向上的冗余候选。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239791396-9c690d81-7c69-4fac-bd95-a33c2301db33.png)选到较远的邻居

这时选出的邻居 `p` 已经离 `x` 比较远了，但它所在的方向上还有一些候选点没有被之前的邻居覆盖。

这些点中，离这个新 `p` 更近的，继续被剪掉。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239791676-11d640d7-1def-4d58-a007-69b2c04195ff.png)最终结果

候选集 `V` 已经被剪得差不多了，`x` 最终只连了几条精选的出边（黑线）。

特点：

- 邻居数量不多；
- 邻居方向分布比较均匀，不扎堆；
- 没有冗余边；
- 但各个方向都有"代表"，保证搜索时能往目标方向导航。

### 核心逻辑是什么？

这个剪枝本质上是 **"枢纽覆盖"思想**：

如果候选点 `u` 离已经选好的邻居 `p` 更近，那么从 `p` 去 `u` 比从 `x` 直接去 `u` 更符合贪心搜索的逻辑。

换句话说，`p` 已经可以作为这个方向上的"枢纽"，`x` 就不需要再额外连 `u` 了。

从几何上看，判断条件：

```
d(p, u) < d(u, x)
```

相当于在 `x` 和 `p` 之间画了一条垂直平分线。如果 `u` 落在 `p` 那一侧，就归 `p` 负责，`x` 不用管。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239791785-7a5d7fe6-4997-4bdf-adb2-807a68b3f7d8.png)

### Vamana 的 robust pruning

Vamana 的 robust pruning 用于构建更适合磁盘的图。普通剪枝条件：

![](https://cdn.nlark.com/yuque/__latex/b0f41b9fa33d55a827f26b0ee7a58f12.svg)

Vamana 引入 ![](https://cdn.nlark.com/yuque/__latex/dce02c0254ea89e45d6e0a0c9a175688.svg)：

![](https://cdn.nlark.com/yuque/__latex/dd2dd75839599fced92a19db614d4a0b.svg)

只有当 ![](https://cdn.nlark.com/yuque/__latex/77c3adce895348f6083c425fe1ba2624.svg)明显被已选邻居![](https://cdn.nlark.com/yuque/__latex/d4cd21d60552e207f237e82def9029b6.svg) 覆盖时才删除，保留更鲁棒的长边，减少搜索跳数和磁盘 I/O。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239792119-7057191b-5861-43ed-9537-e1e09fb1a6b3.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239792932-ec68c34d-e176-42f0-95c9-bc72c2552044.png)

Vamana 构建大致为（Two Passes）：

随机边初始化、

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239792392-a2e0a16b-a7ce-460a-a362-fb7c23deb7f1.png)

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239792340-dc2ff807-a9bc-4822-9b23-4720ba7b2a3f.png)

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239792347-d17461a0-450e-4727-a632-d48eae8c59ee.png)

![](https://cdn.nlark.com/yuque/__latex/c826cc2c698eb652b2325c109ef24de5.svg)的 short-range pass、

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239792723-dcafaf06-b687-465b-a924-4cd09a0eb6cb.png)

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239792875-edb6f750-d3a6-4249-b341-62ca0f92e1ca.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239792997-2e1d0f3d-d1e9-4883-b739-46dc09f3aeaa.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239792994-cf6c161f-46af-4f48-b35e-86d6054cdd69.png)

![](https://cdn.nlark.com/yuque/__latex/dce02c0254ea89e45d6e0a0c9a175688.svg)的 long-range pass。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239794459-e1d82986-c0c2-431a-b2a3-f00cbe8ffa31.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239793318-a7d5d93f-2b07-417c-ac87-8a891eac5e56.png)

实际 DiskANN 代码可能从空图开始、单 pass 构建，并临时允许 out-degree 超过![](https://cdn.nlark.com/yuque/__latex/dd1caa3f2e1582dab2cf9bfdb21b7556.svg) 后再 trim。

**实际实现的“Single Pass”（单次遍历）**

在实际的 DiskANN 代码库（可能是来自 Microsoft Research 的官方实现或其衍生版本，如FreshDiskANN）中，开发者发现：

- **简化流程**：对于每个新节点 `v`，**只进行单次遍历**。在这次遍历中，直接使用一个折中的、或经过优化的参数来搜索和确定邻居。
- **有效性**：实践表明，**单次遍历构建出的图索引，其搜索性能与两次遍历的效果相当，甚至同样优秀**。开发者备注“Not sure two passes even do anything”（不确定两次遍历是否真的有用），并且自己的实现用单次遍历也工作良好。
- **优势**：单次遍历**显著减少了建库时间**，因为每个节点只需要执行一次耗时的近邻搜索操作。

| 方面 | 论文理论 (两次遍历) | 实际实现 (单次遍历) |
| --- | --- | --- |
| **流程** | 1. 宽松搜索 (`α=1.2`) 获取候选 2. 严格筛选 (`α=1.0`) 确定邻居 | 一次搜索（使用某个有效参数）直接确定邻居 |
| **目标** | 理论上追求更优的图质量，兼顾探索与利用。 | 工程上追求**更高的构建速度**，且经验证精度损失可接受。 |
| **本质** | 一种谨慎的、两阶段的优化策略。 | 一种高效的、经验性的工程简化。 |

**为什么可以这样做？**

这在实际机器学习工程中很常见。论文中提出的方法有时为了展示更严谨的优化思路，或是在特定实验集上验证有效。但当代码被大规模应用于真实世界数据时，开发者往往会进行**工程优化和取舍**：

1. **性能瓶颈**：图构建的主要耗时在于近邻搜索，减少一次遍历能直接**缩短近一半的建库时间**，这对海量数据至关重要。
2. **收益递减**：开发者可能发现，第二次遍历带来的图质量提升（如召回率）微乎其微，不值得付出成倍的计算成本。
3. **参数弹性**：通过调整单次遍历所使用的参数（比如取`α=1.1`），可能就能达到两次遍历的综合效果。

因此，**“single pass over nodes” 是 DiskANN 在工程实践中的一个重要优化，它通过简化建图流程来大幅提升索引构建效率，同时保持了查询性能的实用性。** 这也体现了论文理论与生产代码之间常见的差异：理论追求完美和可解释性，而代码追求在可接受误差内的极致效率。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239793486-7c10945e-6977-4ff7-a8f3-8ec1d1be10df.png)

### Large Graphs

DiskANN 处理 **大规模图** 的核心策略是 **“分而治之”**。其核心挑战在于：当数据量极大时，整个图结构（所有向量及其连接关系）**无法一次性装入内存**。

为了解决这个问题，DiskANN 采用了一个**分片、构建、再合并**的流程。

第一步：聚类

- **操作**：首先对整个数据集进行聚类（例如，分为 k=40 个簇）。
- **目的**：这是为后续**分片**做准备。聚类将数据初步组织成具有局部相似性的分组，使得后续每个分片内部的数据关联性更强。

第二步：基于聚类的分片

- **操作**：不是简单地将数据随机或顺序分片，而是**基于第一步的聚类结果进行分片**。关键参数是 `ℓ`（例如 `ℓ=2`），它表示**每个数据向量会被分配到大于1个分片中**。
- **目的**：

第三步：为每个分片创建图

- **操作**：对**每一个分片**，独立运行 DiskANN 的建图算法（例如我们之前讨论的单次遍历法），为**该分片内的数据**构建一个**局部近邻图**。
- **目的**：化整为零。将无法一次性处理的大问题，分解为多个可以独立在内存中处理的小问题。

第四步：合并图

- **操作**：将所有分片的局部图合并成一个**全局图**。合并的方式是取**边的并集**。合并后，会对边进行修剪，通常**只保留长度小于某个阈值 R 的短边**（`Preserve < R`）。
- **目的**：

第五步：乘积量化

- **操作**：对整个数据集进行 **PQ 量化**，将高维向量压缩成很短的编码（例如 256 位）。
- **目的**：

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239793677-1a020c88-f0b9-436c-a647-ef3d7c624ab3.png)

## DiskANN 查询优化

基础 greedy graph search：

- 取离 ![](https://cdn.nlark.com/yuque/__latex/34c7b563b30bde3c748139530686798e.svg)最近的未访问候选![](https://cdn.nlark.com/yuque/__latex/d4cd21d60552e207f237e82def9029b6.svg)，
- 加入 ![](https://cdn.nlark.com/yuque/__latex/d4cd21d60552e207f237e82def9029b6.svg)的邻居，
- 裁剪候选列表到最好的![](https://cdn.nlark.com/yuque/__latex/c895173d3be4872abf206be4268a58cb.svg)个，
- 标记已访问，
- 重复。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239793436-9b12a6f2-59b6-4033-9abd-11c2e6bf2dfc.png)

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239793849-3c387287-f2b7-4453-97dc-43af10d8d661.png)查询向量同样会被PQ编码。 在比较距离时，**不读取原始向量**，而是通过内存中已预先计算好的“距离表”，用**查表和加法**的方式，快速算出查询向量与邻居PQ编码之间的**近似距离**。

**效果**：这实现了**在内存中进行极快速的距离近似比较**，避免了大量耗时的随机磁盘读取，是整个系统能快起来的基础。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239793984-e96a343b-dde6-4939-85d2-4c728ca6c328.png)

### Beam Search

贪心搜索每一步只探索当前最优点的一个邻居，容易陷入局部最优。波束搜索则同时探索多条路径。

- **要解决什么问题**：贪心搜索路径单一，可能错过正确的方向，导致搜索结果不准确（召回率低）。
- **核心参数**：`W`（波束宽度）。`W=1`就是贪心搜索。`W>1`意味着每一步同时探索多个候选点。
- **工作步骤**：

为什么波束搜索的 `W>1`在实践中如此有效，这不仅仅是算法改进，更是**对硬件（SSD）特性的深度利用**。

- **硬件特性**：SSD拥有“深度”的I/O队列（通常32个以上），这意味着它可以**同时处理多个未完成的读取请求**。
- **问题**：如果 `W=1`（贪心搜索），每一步只读1个随机页面，SSD的强大并行能力就被浪费了，大部分时间在等待一次I/O完成。
- **解决方案**：将 `W`设置为 `2, 4, 8`这样的值。

- **结果**：用**略微增加的单步I/O延迟**，换取了**指数级增长的探索宽度**，从而极大提升了找到正确路径的概率和搜索速度。这就是参数 `W`的“最佳点”所在——太小则硬件能力闲置，太大则单步延迟过长、计算浪费。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239794028-21b48413-a10f-4433-a9a4-b7185f11ffad.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239795708-c009a404-54eb-48a4-9cd6-a2c30b251b3d.png)

DiskANN 的优化：

1. **查询时用 PQ**：避免为所有邻居读 full precision vector。
2. **Beam search**：一次扩展 ![](https://cdn.nlark.com/yuque/__latex/a36915ecf0b5605493f5aeaf1480a9ac.svg)个候选，并行发起随机读；常见![](https://cdn.nlark.com/yuque/__latex/ac18929ab8f5d4c064cf87a1732e93e9.svg)。
3. **缓存 entry point 附近向量**：缓存 ![](https://cdn.nlark.com/yuque/__latex/a42a4fc28b384cc408de066beed57485.svg) 跳内向量，规模约为：

![](https://cdn.nlark.com/yuque/__latex/89277612ef811cf517e02e1ee60f0045.svg)

1. **Full precision rerank**：读取邻居列表时顺便读 full precision vector，用真实距离重排。

这种设计的核心优势是 **“一次读取，两份收获，零额外开销”**：

- **目标**：获取节点 `C`的邻居列表，以便继续探索。
- **顺便达成**：获得了 `C`的原始向量，可用于精确重排。

DiskANN recall 通常较高，但原始版本不支持在线 delete/insert/update，需要重建，对过滤查询也困难。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239795819-b82d914d-bfa8-4669-9102-46924badaa33.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239795883-9248d656-d6d3-4477-884b-696756fee703.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239796032-cc605546-9294-4156-b9d1-2ec437588701.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239795915-f26387b3-d5ea-49fa-bc0a-c6c39e5556d7.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239796260-5f5255fe-6589-4b62-ae07-486ebfd1c687.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239796364-3dcb0d30-a304-4cd5-a224-f65cdbe08455.png)

# 更新会让索引退化

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239796351-525dc13b-3f0d-4fb5-ab04-21337bbc1340.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239796495-ef33fbd7-2a05-45fa-b359-adbc5832a94f.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239796749-351edcbc-3cb7-4b7b-86d2-90b5d774e5c1.png)

### Cluster-based 索引

更新会导致 partition 不均衡、大 partition 延迟变高、静态 centroid 准确率下降。

### Graph-based 索引

插入删除会影响边。不更新边会让 recall、latency、memory 退化；更新边又很慢、资源密集。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239796796-a6086082-24cc-450c-8a08-d2fc5ca512c1.png)

常见方案是 out-of-place update / blue-green indexing：旧索引继续服务，新索引后台构建，完成后切换。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239796825-64cbc173-a627-4a3b-b0d1-fd03a72d0db1.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239796809-584d6c5d-11e5-4931-a105-badda90c8aa8.png)

# Freshness Layer / Liveness Layer

Freshness layer 也叫 secondary index，用于让新写入尽快可见。

做法：新数据进入内存 buffer，并通过 WAL/on-disk log 持久化；更新和删除用 tombstone；查询时同时查主索引和 freshness layer，再合并结果；后台重建或合并时把新数据并入主索引。

优点是 freshness 好；缺点是内存成本、额外 I/O、一致性和 burst 处理更复杂。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239796998-20f8275a-d78f-4d29-856e-2fda7ca521ec.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239797743-5d4287c5-f3b4-42ce-9c43-1c3300cc90f6.png)

### Neos：磁盘驻留 freshness layer

Neos 的目标是实时更新而不维护复杂二级索引。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239797517-d7fa6b7f-7f73-4f57-881e-741b866b4595.png)

它用多 GPU 对 SSD 上的新数据做 brute force 搜索，并用 SPDK、pinned GPU memory、NVMe 到 GPU copy 绕过传统存储栈。任务调度器隔离搜索和写入 I/O。

特点：插入快、无重建退化；但依赖很强硬件，例如 V100 GPU 和 Intel Optane P5800X。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239797505-911a853f-a5c6-44ef-a453-b5be3b9a1e12.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239797506-ddab03d0-7a6c-4c4d-aa85-f4a333c65eb8.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239797694-25e830e0-4aee-4218-ba67-ef20d159382e.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239797942-21397835-09a0-4ae9-9d85-d0284d834767.png)

# Segmenting：分段

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239797968-4d10dc99-5619-41e6-a83a-e063a01cc182.png)

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239798006-0b0c84ae-1c66-4298-a1fe-9d9c7dec3864.png)

Segmenting 将 collection 拆成多个 segment。

新写入追加到 growing segment；segment 满了就建索引，并开启新的 growing segment。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239798174-21ccaeef-21dc-428c-a89e-6cc251fb4de0.png)

查询时查所有 segment 并合并结果；

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239798341-b2e3509c-35a5-4c0b-ba62-b1826e0ba4ee.png)

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239798561-f764a834-9360-4869-a4d0-fc7bc1d5c4b0.png)

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239798565-3bf99664-0ea1-42ec-a344-1f833abf06ac.png)

删除用 tombstone，空洞多的 segment 后台 merge。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239798576-b4c20c82-e707-459b-88b0-fb5b99800b84.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239798664-42a0de50-d812-4c12-9719-6dbfc614f375.png)

优点：

- 避免全局重建，因为已满 segment 静态
- 每个索引较小
- growing segment 本身就是 freshness layer
- 方便分布式并行

缺点：必须查询所有 segment；更新多时会有 write amplification。Milvus、Qdrant 等系统使用类似思想。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239798992-bea8ec22-cb0a-4e06-a95c-12ebd93db4ef.png)

Sharding 和 segmenting 不同：sharding 主要按机器分布数据，segmenting 主要避免重建并适应增长；两者可以结合使用。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239799086-22464594-3564-4e03-934b-081148c3e03d.png)

# Updatable Index：可更新索引

可更新索引试图避免重建，实现方式包括 re-balancing、in-place updates、data-independent index。磁盘场景尤其重要，代表包括 FreshDiskANN 和 SPFresh。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239799027-002a8445-2521-4776-a5e8-50e5fdb29ceb.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239799058-78bcf949-c635-4878-b389-81694d7e98cc.png)

### FreshDiskANN

目标：十亿级向量、每秒上千次更新/删除/插入、每秒上千次查询、实时 freshness、95% recall@5。方法是 DiskANN-like 磁盘图加内存 freshness layer，周期性将内存 insert/delete list 合并到磁盘图。合并成本约与更新数量相关：

![](https://cdn.nlark.com/yuque/__latex/002b12da4c76704c6d32bf5b8e2654e5.svg)

结果：插入删除快、recall 长期稳定、成本远低于重建，但 merge 期间尾延迟可能升高。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239799116-50481e3d-9767-4613-9a40-4f3d6b7b8058.png)

### SPFresh

SPFresh 是 cluster-based + centroid graph 的组合索引，基于 SPANN/SPTAG。

核心**LIRE 协议**维护较均匀的 cluster 大小，通过 split、merge、reassign 做局部调整，避免全局重建。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239799507-4632f749-7107-4879-bc8e-c9163e988c82.png)

系统技巧包括：append-only 写入、version tag 标识旧数据、多线程 rebuilder、SPDK 绕过存储栈、append-only disk layout、lock-free search。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239799740-8ccfd95b-7940-4e34-875e-5521f69a4af9.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239799560-d715de1b-eef3-4691-a4ec-bb22aebde4c2.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239799580-d3f442a7-e9a0-4408-bb41-07ffd162e3fd.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239799674-12695f02-907c-4443-8e89-e19479114505.png)

**SPDK** 的全称是 **Storage Performance Development Kit**（存储性能开发工具包）。它是由英特尔发起并开源的一个项目，其核心目标是**最大程度地释放现代存储硬件（特别是 NVMe SSD）的性能潜力**。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239800084-b7677128-bc9b-44ad-aad0-e7270f120459.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239800237-ca14b756-7540-4dcf-a5e3-bea0e9ed9b05.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239800278-99283ae9-7d29-4951-a57e-5b07debbca84.png)

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780240143850-9a95aadf-63f8-4f2e-b6b4-dc1e66000f56.png)

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239800239-206c1c35-8257-4e02-a440-55fe57685cff.png)

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780240188818-fb4a57bc-8d9e-4b69-8a2f-d05ea70de103.png)

其潜在问题：级联 split/merge/reassign 难控制，偏斜数据可能导致 cluster 不平衡，实验结果和可分布性仍有疑问。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780240188829-6123469d-d961-403d-a4c4-ae13ccb0aae2.png)

# 总结

本讲核心技术：

| 问题 | 技术 |
| --- | --- |
| 内存太大 | Sharding、SQ、PQ、Composite Index、Disk Index |
| 查询太慢 | IVF、HNSW、DiskANN、Beam Search |
| 更新后退化 | Freshness Layer、Segmenting、Updatable Index |
| 重建太贵 | Blue-green indexing、Segmenting、FreshDiskANN、SPFresh |

现代高性能 VDBMS 索引通常是：

- graph-based，例如 HNSW 或变体
- composite，例如 IVF + graph + quantization
- 在超大规模时使用 disk-resident 设计
- 用 freshness layer、segmenting 或 updatable index 处理更新

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780240188808-18065b12-c41a-4f62-8868-d521f8ae9b47.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780240189032-696a9afd-405b-4aab-8f2b-c2055b097c7e.png)

开放问题包括：更好支持谓词查询和多向量查询、稳定更新、OOD 查询、高 recall 压缩、磁盘索引、并发、安全、隐私和 federated search。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780240189107-e4c64a9a-e0c6-4967-b9f0-b366e6320ac3.png)
