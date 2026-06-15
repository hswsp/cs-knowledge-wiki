---
source: https://www.yuque.com/yangguangfanxing/nmhuv1/he56c9w42hccceo5
---

# Basic Indexing

> 原文链接：[https://www.yuque.com/yangguangfanxing/nmhuv1/he56c9w42hccceo5](https://www.yuque.com/yangguangfanxing/nmhuv1/he56c9w42hccceo5)

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239746917-93a505ac-97cb-4807-a071-d45e136f513a.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239747245-05923fd1-efc3-41d9-bb38-4e209126ad8a.png)

## 为什么需要索引？

向量数据库常见查询是 kNN：给定查询向量 ![](https://cdn.nlark.com/yuque/__latex/34c7b563b30bde3c748139530686798e.svg)，找到距离它最近的若干向量。最直接的方法是 Flat / Brute Force Search：扫描所有向量，计算距离，然后返回 top-k。

暴力搜索的计算量大致为：

![](https://cdn.nlark.com/yuque/__latex/83ee35b998b27d7e5926aee76683cba6.svg)

其中 ![](https://cdn.nlark.com/yuque/__latex/459f3c80a50b7be28751b0869ef5386a.svg)是向量数量，![](https://cdn.nlark.com/yuque/__latex/558270b7f0a90c3c286b860273d106a0.svg)是向量维度。它的优点是结果精确，缺点是每次查询都要比较全部向量，规模大时太慢。

索引的核心思想是：通过划分、压缩、随机化或图结构，减少查询时需要比较的候选向量数量。

代价是：可能增加误差、内存、构建成本和更新成本。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239747152-bc992a01-973d-4758-af5a-1ab6d9a94e3d.png)

## ANNS 索引的性能权衡

ANNS 是 Approximate Nearest Neighbor Search，即近似最近邻搜索。它主要在四个维度之间权衡：

| 指标 | 含义 |
| --- | --- |
| Search speed | 查询速度 |
| Accuracy / Recall | 返回结果和真实最近邻的重合程度 |
| Memory | 索引额外内存消耗 |
| Build / update cost | 构建、插入、删除、重建的代价 |

最关键的是 **速度-准确率权衡**：

- 搜索更少候选：更快，但 recall 更低
- 搜索更多候选：更准，但延迟更高

索引类型和参数配置决定系统落在权衡曲线上的位置。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239747093-9a169fe0-55be-4b26-8bdd-c0a1b2f210b4.png)

## 评价指标

1. Recall@K

Recall@K 表示返回的 ![](https://cdn.nlark.com/yuque/__latex/38a3f4d664b7a723d138f9d57be0c783.svg)个结果中，有多少是真实 top-![](https://cdn.nlark.com/yuque/__latex/38a3f4d664b7a723d138f9d57be0c783.svg) 最近邻。

设：

- ![](https://cdn.nlark.com/yuque/__latex/df0c4152730cbc565f032d99d103e0b9.svg)：索引返回的 top-![](https://cdn.nlark.com/yuque/__latex/38a3f4d664b7a723d138f9d57be0c783.svg) 集合
- ![](https://cdn.nlark.com/yuque/__latex/ea6c04f525424b7eca161748ebb79662.svg)：真实 top-![](https://cdn.nlark.com/yuque/__latex/38a3f4d664b7a723d138f9d57be0c783.svg) 最近邻集合

则：

![](https://cdn.nlark.com/yuque/__latex/9bc1b4426df9c1d3b322c0466ea23b75.svg)

例如 ![](https://cdn.nlark.com/yuque/__latex/a309e42d17f19b6b4f55c7b26cc1c5db.svg)，返回结果中有 4 个是真实最近邻，则：

![](https://cdn.nlark.com/yuque/__latex/949f13fa64e141c7103fc0f49ced6d37.svg)

即 80%。

2. Latency 与 Throughput

单次查询延迟：

![](https://cdn.nlark.com/yuque/__latex/ebaac0367046019103a3af7f27366c81.svg)

系统吞吐量：

![](https://cdn.nlark.com/yuque/__latex/9732054a8e2ac4f68981da6975e9cbac.svg)

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239747212-036dedb8-ebe5-4563-9f39-8fa438713079.png)

## 为什么传统数据库索引不适合向量？

传统 RDBMS 索引，如 B-tree，适合有序属性；但向量是高维对象，没有天然的全局排序结构。

| 维度 | RDBMS 属性索引 | 向量 ANNS 索引 |
| --- | --- | --- |
| 索引粒度 | 单个属性 | 整个向量 |
| 查询准确性 | 精确 | 通常近似 |
| 自然结构 | 有序、可排序 | 无天然顺序 |
| 更新删除 | 通常容易 | 可能困难 |
| 是否依赖数据分布 | 通常不依赖 | 常依赖数据分布 |

因此向量索引需要新的技巧：

1. 基于数据的划分：如 IVF （Inverted File Index）聚类索引
2. 有损压缩：如 PQ （Product Quantization）/ SQ 量化
3. 随机化：如 LSH
4. 图结构搜索：如 HNSW（Hierarchical Navigable Small World） / DiskANN

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239750573-94a032de-64fc-436b-ac66-c742dd476a21.png)

## 主要索引类型

| 类型 | 代表方法 | 基本思想 |
| --- | --- | --- |
| Cluster-based | IVF, PQ | 将空间划分成多个簇，只搜索相关簇 |
| Graph-based | HNSW, DiskANN | 把相似向量连成图，通过图遍历搜索 |
| LSH | E2LSH, FALCONN | 让相似向量高概率进入同一哈希桶 |
| Tree | RP tree, ANNOY | 层次化划分向量空间 |

工程上还要考虑：索引是否驻留内存、是否需要周期性重建、是否支持增量更新、删除是物理删除还是 tombstone、是否有误差界限等。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239750276-ced41f95-be2c-49c3-8925-357cccc5beae.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239750302-592dd5a5-8e6c-4dbe-b6af-f4998b60ef31.png)

## Flat Index：暴力搜索也是一种索引

Flat Index 直接存储所有向量。查询时扫描表、计算距离、排序或维护优先队列，返回 top-k。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239750430-763f912e-f75d-40aa-9d27-c6288801fbdd.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239750469-f392cf32-2a09-433e-9b36-3b76f47f6c2d.png)

优点

| 优点 | 说明 |
| --- | --- |
| 精确 | 返回真实最近邻 |
| 更新快 | 插入后立即可见，无复杂维护 |
| 无需重建 | 没有复杂结构退化 |
| 过滤查询容易 | 可以先按属性过滤再扫描 |
| GPU 友好 | 距离计算高度并行 |
| 额外内存低 | 不需要复杂索引结构 |

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239750895-8ad662c7-57ef-4ee8-9182-55de8591c2b5.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239750878-c157bd1c-8c88-4310-bc61-38efbb7b27a7.png)

缺点与适用场景

缺点是查询成本随 ![](https://cdn.nlark.com/yuque/__latex/659285da2f4e198c7055a97e87f3ea7b.svg) 增长。适合小规模集合、需要精确结果、更新频繁、过滤复杂或有强 GPU 支持的场景。

单核 CPU 在百万(1M)向量、较高维度时 QPS 很低；但多 GPU 系统可以把 Flat Search 扩展到更大规模。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239751103-13d66894-c6a6-4137-9d6b-015756fee3a1.png)

## ANN Benchmark 的启示

ANN Benchmark 对比显示：

- Exact Search with BLAS：准确率 100%，但 QPS 低
- IVF：可带来数十倍加速
- HNSW / DiskANN / Vamana：可带来百倍到数百倍加速

结论是：实际系统中，少量 recall 损失通常可以换来数量级的查询加速。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239750960-361c6434-608a-4ca5-8a41-642a7ae64c29.png)

## LSH：局部敏感哈希

### 1. 普通哈希 vs LSH

普通哈希希望不同对象尽量落到不同桶，减少冲突；LSH 则希望相近对象更容易落入同一桶。

| 哈希类型 | 目标 |
| --- | --- |
| 普通哈希 | 最小化冲突 |
| LSH | 让相近向量高概率冲突 |

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239751279-adac2f8d-5fd0-4667-bfc5-83f3ad1da351.png)

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239751382-a6f7ffa1-a2f9-4ad6-9f5a-f4b9ea878b2e.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239751433-3f09de75-a5f4-479a-8f31-c61594f293f5.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239751805-f11da1a4-6849-46d5-8e6e-c63db7784e18.png)

### 2. LSH 的核心性质

理想的 LSH 函数 ![](https://cdn.nlark.com/yuque/__latex/e5827c17bafdeffd11eade6996dd052f.svg) 满足：

![](https://cdn.nlark.com/yuque/__latex/959d4febf027500e6bac2a8d4704b53c.svg)

![](https://cdn.nlark.com/yuque/__latex/f3fc3748ca84f530d14f9d7630e230d2.svg)

### 3. 插入与查询

插入向量 ![](https://cdn.nlark.com/yuque/__latex/712ecf7894348e92d8779c3ee87eeeb0.svg)：

![](https://cdn.nlark.com/yuque/__latex/b26359ec3136a2507a2a18987088be95.svg)

查询向量 ![](https://cdn.nlark.com/yuque/__latex/34c7b563b30bde3c748139530686798e.svg)：计算 ![](https://cdn.nlark.com/yuque/__latex/273fef7df32e6485130d58354c46515d.svg)，取同一 bucket 中的候选向量，再计算真实距离并 rerank。

单个哈希表容易漏掉近邻，因此通常使用 ![](https://cdn.nlark.com/yuque/__latex/c895173d3be4872abf206be4268a58cb.svg) 个哈希表：

![](https://cdn.nlark.com/yuque/__latex/4969ccb3b2689507b161d4fa8baa1073.svg)

这样可以降低错误概率，但会增加内存和查询时间。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239751815-fb5b59a8-855b-4c53-bfa1-9e7f9174f29f.png)

具体来说：

1. 每个向量会被哈希**L次**（使用L个不同的哈希族）
2. 每个哈希结果存入对应的哈希表
3. 查询时，查询向量也会被哈希L次，在L个表中查找

查询时的具体步骤:

1. **并行计算**：计算查询向量![](https://cdn.nlark.com/yuque/__latex/34c7b563b30bde3c748139530686798e.svg)在![](https://cdn.nlark.com/yuque/__latex/c895173d3be4872abf206be4268a58cb.svg)个哈希表中的哈希值
2. **桶查找**：在![](https://cdn.nlark.com/yuque/__latex/c895173d3be4872abf206be4268a58cb.svg)个表中查找对应的哈希桶
3. **合并去重**：合并所有桶中的向量，去除重复
4. **重新排序**：对候选向量进行精确距离计算和排序
5. **返回结果**：返回top-k最近邻

这里的例子：

```
向量：x, y, q (查询点)
哈希表：g1, g2, g3, g4, g5 (L=5)

构建阶段：
1. 向量x → 计算5次哈希 → 存入5个表
   g1(x)=3, g2(x)=1, g3(x)=4, g4(x)=2, g5(x)=1
   
2. 向量y → 计算5次哈希 → 存入5个表
   g1(y)=2, g2(y)=3, g3(y)=1, g4(y)=4, g5(y)=3

查询阶段：
查询向量q → 计算5次哈希 → 在5个表中查找
g1(q)=3 → 在表g1的桶3中找到x
g2(q)=3 → 在表g2的桶3中找到y
g3(q)=4 → 在表g3的桶4中找到x
g4(q)=2 → 在表g4的桶2中找到x
g5(q)=3 → 在表g5的桶3中找到y

候选集：{x, y}

然后重新排序
```

多 Hash 优点：

1. 概率提升

单个哈希函数 `h(x)`找到最近邻的概率有限。假设：

- 单个哈希函数找到最近邻的概率 = p
- 使用L个独立哈希表，找到最近邻的概率 = ![](https://cdn.nlark.com/yuque/__latex/3231075623934a1ebdd80797de96c3ff.svg)

**示例**：

```
如果 p = 0.5 (50%概率找到最近邻)
L=1: 概率 = 0.5
L=2: 概率 = 1 - (1-0.5)² = 0.75
L=3: 概率 = 1 - (1-0.5)³ = 0.875
L=10: 概率 ≈ 0.999
```

1. 降低假阴性率

- **假阴性**：真正的最近邻没有被找到
- 多个哈希表显著降低假阴性率

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239751948-609ab8cd-ebfc-4fe5-879a-091e6e192afc.png)

### 4. LSH 的优缺点

优点：增量更新快、有理论误差界和内存界、通常不需要因数据变化而重建。

缺点：实际 VDBMS 中较少使用，高维特别是 ![](https://cdn.nlark.com/yuque/__latex/2d0336d268e37e1848d8c406dc97fe30.svg) 时性能较差，内存开销较高，综合效果常不如 HNSW / IVF。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239752262-ed70bf15-60ff-41fc-86e4-12a2ebb40261.png)

## IVF：Inverted File Index / 聚类索引

**IVF的“倒排”思路（高效）**：它为**每个聚类中心建立一个列表**，这个列表里存放着**所有属于这个聚类的向量**。

- 中心点1 -> {向量a, 向量b, 向量c...}
- 中心点2 -> {向量d, 向量e...}

IVF 也称 clustering index。它先把向量空间划分为若干 cell / cluster，每个 cluster 有一个 centroid。

### 1. 构建流程

1. 选择 cluster 数量 ![](https://cdn.nlark.com/yuque/__latex/df976ff7fcf17d60490267d18a1e3996.svg)
2. 用 k-means 等方法学习 centroids
3. 对每个向量 ![](https://cdn.nlark.com/yuque/__latex/a770a282bbfa0ae1ec474b7ed311656d.svg)，找到最近 centroid
4. 将 ![](https://cdn.nlark.com/yuque/__latex/a770a282bbfa0ae1ec474b7ed311656d.svg) 放入对应 cell

K-means 的目标是最小化所有样本点到其所属簇中心的距离平方和：

![](https://cdn.nlark.com/yuque/__latex/c942715f1984e909cc5d8155e859160e.svg)

其中：

- ![](https://cdn.nlark.com/yuque/__latex/1d183a6c99ed270e909dd0f2365a6161.svg) 表示第 ![](https://cdn.nlark.com/yuque/__latex/036441a335dd85c838f76d63a3db2363.svg) 个簇
- ![](https://cdn.nlark.com/yuque/__latex/7e7f57ade090b73b2fc19e7684298188.svg) 表示第 ![](https://cdn.nlark.com/yuque/__latex/036441a335dd85c838f76d63a3db2363.svg) 个簇的中心点
- ![](https://cdn.nlark.com/yuque/__latex/502aae7f517168521d7ba651ee25df48.svg) 表示样本点到簇中心的欧氏距离平方

K-means 算法伪代码：

```
输入：
  数据集 D = {x_1, x_2, ..., x_n}
  聚类数量 K
  最大迭代次数 max_iter

输出：
  K 个簇 C_1, C_2, ..., C_K
  K 个簇中心 μ_1, μ_2, ..., μ_K

步骤：
1. 随机初始化 K 个簇中心 μ_1, μ_2, ..., μ_K （也可以使用更稳定的初始化方法，如 K-means++）

2. 对于 t = 1 到 max_iter：

   a. 分配样本：
      对每个样本 x_i：
          计算 x_i 到每个簇中心 μ_j 的距离
          将 x_i 分配到最近的簇 C_j

   b. 更新簇中心：
      对每个簇 C_j：
          μ_j = C_j 中所有样本点的均值

   c. 判断是否收敛：
      如果簇中心或样本分配不再变化：
          停止迭代

3. 返回最终的簇和簇中心
```

常见停止条件包括：

1. 簇中心不再变化：

![](https://cdn.nlark.com/yuque/__latex/6ea0eab47fe7c255beecf735c28f3e20.svg)

1. 样本的簇分配不再变化
2. 目标函数变化小于阈值：

![](https://cdn.nlark.com/yuque/__latex/8ebf763a3a45ad622dd7bad3ba05a0cf.svg)

1. 达到最大迭代次数

如果未收敛，则重复  a  和 **b**。

### 2. 查询流程

1. 对查询向量 ![](https://cdn.nlark.com/yuque/__latex/34c7b563b30bde3c748139530686798e.svg) 找最近 centroid
2. 只扫描该 cell 中的向量
3. 返回 top-k

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239751950-59f91ed6-fcf2-4199-ae04-fa5219da1c53.png)

### 3. 跨簇近邻问题

真实近邻可能在相邻 cluster 中。如果只搜索最近 cell，就会漏掉它。解决方法是增加 probe 数量 ![](https://cdn.nlark.com/yuque/__latex/4760e2f007e23d820825ba241c47ce3b.svg)：

- ![](https://cdn.nlark.com/yuque/__latex/f0c8366376d0dc59475bc516b9982ed0.svg)：最快，但更容易漏
- ![](https://cdn.nlark.com/yuque/__latex/1d49c6548c86c61ebf804a7e89ecc6d7.svg)：更准，但更慢

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239752196-359770d2-8d51-4406-971e-a3d35ebd8b58.png)

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239752322-4558bc1e-d65d-4adb-a0f8-98795a5be7fa.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239752474-9b70f765-f2fd-490b-ab2c-d3ffe4de58db.png)

### 4. 随时间退化

IVF 的 cluster 基于构建时的数据分布。持续插入后，数据分布可能改变，导致边界错误增多、cluster list 不均衡，因此通常需要周期性重建：

![](https://cdn.nlark.com/yuque/__latex/8b9f857f644f946bcfb2f6f58a1ae068.svg)

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239752454-6557371c-64fb-4738-93e8-c09ec1b5f556.png)

### 5. IVF 参数与性质

| 参数 | 含义 | 影响 |
| --- | --- | --- |
| ![](https://cdn.nlark.com/yuque/__latex/df976ff7fcf17d60490267d18a1e3996.svg) | cell / cluster 数量 | 越大，单个 cell 越小，搜索更快，但可能更易漏近邻 |
| ![](https://cdn.nlark.com/yuque/__latex/4760e2f007e23d820825ba241c47ce3b.svg) | 查询 probe 的 cell 数 | 越大，recall 越高，但查询更慢 |

优点：内存开销低、更新快、新向量立即可见、容易扩展。

缺点：不是最快，添加数据会降低准确率，需要周期性重建。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239753000-7d882c36-57e2-48ea-9505-b5b5f3263def.png)

## HNSW：层次化可导航小世界图

HNSW 全称 Hierarchically Navigable Small Worlds，是工业界最常见、效果很强的 ANN 图索引之一。是 ANN indexes 的 crown jewel。

HNSW 结合两个思想：

![](https://cdn.nlark.com/yuque/__latex/9d8ce68ff13f014195fda471e26ea951.svg)

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239752783-a3cb9372-0afd-4c94-b50a-910319b0bc82.png)

### 1. NSW：Navigable Small World

NSW 图中节点是向量，边连接相近向量。图中既有短边也有长边，所以平均路径较短：

![](https://cdn.nlark.com/yuque/__latex/42433fa38a5bb64ddbf13bc74baefea6.svg)

查询时从 entry point 开始贪心搜索：不断移动到更接近 ![](https://cdn.nlark.com/yuque/__latex/34c7b563b30bde3c748139530686798e.svg) 的邻居，直到不能继续改善。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239752830-22e7bc74-7374-4259-b981-9c2ca6dba1a6.png)

### 2. Skip List 层次结构

Skip List 的高层用于长距离跳跃，低层用于精细搜索。HNSW 把向量图做成多层：高层稀疏、边长；低层稠密、边短。

Flip coin, if heads stop：这是在插入新节点时决定**该节点应该上升到哪一层**的随机化过程。

```
插入节点X后：
第一次抛硬币：
    正面（Heads）→ 停止，X只存在于L0层
    反面（Tails）→ 将X提升到L1层，继续抛硬币

第二次抛硬币（如果在L1层）：
    正面（Heads）→ 停止，X存在于L0和L1层
    反面（Tails）→ 将X提升到L2层，继续抛硬币

第三次抛硬币（如果在L2层）：
    正面（Heads）→ 停止，X存在于L0、L1、L2层
    反面（Tails）→ 将X提升到L3层...
    
如此反复，直到抛到正面为止
```

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239752892-02ab12d8-11b6-4fd7-8663-d49f0e6eb658.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239752918-2ea32d7b-7311-4273-a958-a7fad0278247.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239753260-22cb5543-a938-4e6d-9ca1-dad769f405d3.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239753738-4ca4d9dd-8be2-42a2-8ad8-4d6392c39648.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239753482-c34198c7-e727-4f86-a19d-d1a3dd6427cc.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239753490-8f826cc4-95d4-4840-9e12-7b2c2351497e.png)

## HNSW 查询过程

1. 从最高层 entry point 开始
2. 在当前层做 greedy search
3. 找到局部最优点后下降一层
4. 重复直到 layer 0
5. 在 layer 0 扩展搜索，返回 top-k。在最底层，要扩展搜索到 efSearch 个邻居。

由于 out-degree 被限制，搜索复杂度通常可接近：

![](https://cdn.nlark.com/yuque/__latex/42433fa38a5bb64ddbf13bc74baefea6.svg)

底层使用 ![](https://cdn.nlark.com/yuque/__latex/6702fe12bf3c5be6f5f0a582a3693af8.svg) 控制扩展候选数：

- ![](https://cdn.nlark.com/yuque/__latex/6702fe12bf3c5be6f5f0a582a3693af8.svg) 越大，recall 越高
- ![](https://cdn.nlark.com/yuque/__latex/6702fe12bf3c5be6f5f0a582a3693af8.svg) 越大，查询越慢

在最底层，算法不再是简单的"移动到最近的邻居"，而是：

```
def search_layer_0(query, entry_point, efSearch):
    """
    在最底层（layer 0）的搜索过程
    """
    # 初始化候选列表和结果列表
    candidates = MinHeap()  # 最小堆，按距离排序
    results = MaxHeap()     # 最大堆，保持efSearch个最近邻

    # 从入口点开始
    candidates.push(entry_point, distance(query, entry_point))
    results.push(entry_point, distance(query, entry_point))

    # 扩展搜索直到候选列表为空
    while not candidates.empty():
        # 取出最近的候选节点
        current = candidates.pop()

        # 获取当前节点的所有邻居（在layer 0）
        neighbors = get_neighbors_in_layer_0(current)

        for neighbor in neighbors:
            if neighbor not in visited:
                dist = distance(query, neighbor)
                visited.add(neighbor)

                # 如果结果列表未满或距离更近
                if len(results) < efSearch or dist < results.max_distance():
                    candidates.push(neighbor, dist)
                    results.push(neighbor, dist)

                    # 保持结果列表大小为efSearch
                    if len(results) > efSearch:
                        results.pop_farthest()

    return results.get_all()  # 返回efSearch个最近邻
```

搜索过程示例

```
假设 efSearch = 3，查询点 Q

Layer 2: 
  入口点 A → 移动到最近的邻居 B

Layer 1:
  从 B 开始 → 移动到最近的邻居 C

Layer 0:
  从 C 开始，但不再只找最近的邻居 D
  
  扩展过程：
  1. 查看 C 的所有邻居：D, E, F, G
  2. 计算 Q 到每个邻居的距离
  3. 保持最近的 3 个（efSearch=3）作为候选
  4. 从这 3 个候选继续扩展它们的邻居
  5. 重复直到找不到更近的点
```

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239753483-91634d96-3512-4a96-8690-6a8f1217b908.png)

## HNSW 插入过程

插入向量 ![](https://cdn.nlark.com/yuque/__latex/712ecf7894348e92d8779c3ee87eeeb0.svg) 时：

1. 随机选择最高层 ![](https://cdn.nlark.com/yuque/__latex/c895173d3be4872abf206be4268a58cb.svg)
2. 从顶层入口开始搜索
3. 在每一层找到邻近候选集合
4. 将 ![](https://cdn.nlark.com/yuque/__latex/712ecf7894348e92d8779c3ee87eeeb0.svg) 插入该层
5. 连接到最好的 ![](https://cdn.nlark.com/yuque/__latex/6f5dde593f0bc27956e14b5eaec2ed17.svg) 个邻居
6. 修剪边，避免 out-degree 膨胀
7. 下降到下一层继续

整体步骤

```
INSERTION (OVERVIEW) 流程：

1. 为向量 x 随机选择最高层 L
   - 例如：L=3 表示 x 会出现在第 0、1、2、3 层

2. 从最高层 L 开始，逐层向下插入：
   a. 在每一层执行贪心搜索，找到 x 在该层的最近邻
   b. 创建 x 在该层的节点（如果尚未存在）
   c. 将 x 连接到该层的邻居
   d. 修剪连接，避免出度过大
```

### 步骤1：随机选择最高层

```
def random_level(max_level, mL=1/ln(M)):
    """
    随机生成向量的最高层
    mL 通常为 1/ln(M)，其中 M 是基础层每个节点的平均连接数
    """
    level = 0
    # 以概率 1/mL 继续上升
    while random.random() < 1/mL and level < max_level:
        level += 1
    return level
```

**重要**：这个随机层数决定了向量出现在哪些层。比如随机到 L=2，那么向量会出现在：

- Layer 2（最高层）
- Layer 1
- Layer 0（最底层，所有向量都存在）

### 步骤2：逐层插入

从最高层开始向下插入

```
def insert_vector(x, max_level, M, efConstruction):
    # 1. 随机选择最高层
    L = random_level(max_level)
    
    # 2. 初始化入口点（通常是第一个插入的向量）
    entry_point = get_global_entry_point()
    
    # 3. 从最高层 L 向下到第 0 层
    for current_layer in range(L, -1, -1):
        # 在当前层搜索最近邻
        neighbors = search_layer(x, entry_point, efConstruction, current_layer)
        
        # 创建 x 在当前层的节点（如果尚未存在）
        create_node_at_layer(x, current_layer)
        
        # 将 x 连接到找到的邻居
        connect_to_neighbors(x, neighbors, current_layer, M)
        
        # 修剪连接，保持每个节点最多 M 个连接
        trim_connections(x, current_layer, M)
        
        # 更新 entry_point 为当前层搜索的结果
        # （用于下一层的搜索，加速搜索过程）
        entry_point = neighbors[0]  # 最近的邻居作为下一层的入口点
```

关键细节解释

1. "Create node and connect to neighbours in layer" 每一层都需要节点：即使物理上可能只有一个向量对象，但在每一层的图结构中都需要有一个节点表示。 连接是分层的：每一层的连接是独立的，一个向量在不同层可能有不同的邻居集合
2. "Search output used as entry point of next layer" 这是 HNSW 的重要优化：上一层的搜索结果（最近的节点）作为下一层搜索的起点，这显著加速了搜索过程。

```
# 插入时的搜索流程
entry_point = global_top_layer_entry

for layer in range(top_layer, 0, -1):
    # 在当前层搜索
    nearest = greedy_search_at_layer(x, entry_point, layer)
    # 记录搜索结果，用于下一层
    entry_point = nearest
```

1. "Expand: multiple entry points → better recall" 在某些实现中，为了提高召回率，可能会使用多个入口点：

```
# 使用多个入口点
entry_points = get_top_k_nearest(x, k=efConstruction, layer=current_layer)
for entry in entry_points:
    # 从每个入口点开始搜索
    candidates.extend(search_from_entry(x, entry, layer))
```

1. "Trim edge lists → avoid inflating out-degree" 为了防止节点的连接数过多，需要修剪：

```
def trim_connections(node, layer, M):
    """修剪连接，保持最多 M 个邻居"""
    neighbors = get_neighbors(node, layer)
    
    if len(neighbors) > M:
        # 按距离排序，保留最近的 M 个
        sorted_neighbors = sort_by_distance(node, neighbors)
        keep_neighbors = sorted_neighbors[:M]
        
        # 更新连接
        set_neighbors(node, keep_neighbors, layer)
```

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239754440-e05c9212-68d4-49b3-a26c-072b9e87981f.png)

最高层通常按类似对数分布采样：

![](https://cdn.nlark.com/yuque/__latex/b65162b6ebf31a03068c8daa0df598f8.svg)

构建时还使用 ![](https://cdn.nlark.com/yuque/__latex/925fe8991f96df04e2e9da55dfb9a00f.svg) 控制候选数量，候选越多，构建越慢，但图质量通常越高。

### 可视化示例

假设插入向量 x，随机选择的最高层 L=2：

```
插入前：
Layer 2: A ----- B
Layer 1: A - C - B - D
Layer 0: A-C-B-D-E-F

插入 x（L=2）：
1. 在 Layer 2 插入：
   - 搜索：找到最近邻 A
   - 创建节点：x
   - 连接：x ←→ A
   Layer 2 变为：A - x - B

2. 在 Layer 1 插入：
   - 搜索：以 A 为入口点，找到最近邻 C
   - 创建节点：x
   - 连接：x ←→ C（可能还有其他邻居）
   Layer 1 变为：A - C - x - B - D

3. 在 Layer 0 插入：
   - 搜索：以 C 为入口点，找到最近邻 E
   - 创建节点：x
   - 连接：x ←→ E（和附近的其他节点）
   Layer 0 变为：A-C-B-D-E-x-F
```

### 与搜索过程的对比

| **操作** | **插入** | **搜索** |
| --- | --- | --- |
| **入口点** | 从全局入口点开始 | 从全局入口点开始 |
| **层遍历** | 从最高层向下到 0 层 | 从最高层向下到 0 层 |
| **每层操作** | 创建节点 + 连接邻居 | 贪心搜索 |
| **复杂度** | O(log n) | O(log n) |

### 实际实现注意事项

1. 节点表示。在实际代码中，一个向量在不同层的节点通常是同一个对象的不同"视图"：

```
class HNSWNode:
    def __init__(self, id, vector):
        self.id = id
        self.vector = vector
        self.neighbors = {}  # layer -> [neighbor_ids]
        self.max_level = 0   # 该节点出现的最高层
```

2. 内存优化

由于每个节点在不同层都有连接信息，内存占用可能较大。可以优化：

```
# 使用数组存储连接，而不是字典
self.neighbors_by_layer = []  # 索引是层数
```

3. 并发控制

在多线程环境中插入时需要同步控制：

```
def insert_concurrent(x):
    with insert_lock:
        # 获取当前全局状态
        entry_point = get_entry_point()
        # 执行插入
        do_insert(x, entry_point)
```

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239754408-af3cba36-0808-41a5-8eb9-f6c527663b34.png)

## HNSW 的优缺点与参数

### 优点

- 准确率高
- 查询速度快
- 速度-准确率权衡接近工业界最优
- 适合相对静态数据
- 比 LSH 更节省内存
- 理论上支持增量插入

### 缺点

- 内存高于 IVF / PQ
- 插入比查询慢
- 删除可能破坏图连通性，常使用 tombstone
- 更新会导致内存膨胀或准确率下降
- 参数较多，需要调优

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239754533-5584e390-ad50-4da6-bfc0-23945f1b0fc2.png)

### 关键参数

1. M（每层最大连接数）

- 影响图密度和搜索精度
- 通常设置在 12-48 之间
- 越大：召回率越高，但内存和计算成本增加

2. efConstruction（构建时的扩展因子）

- 影响构建质量
- 通常设置在 100-200 之间
- 越大：构建的图质量越高，但构建时间越长

3. mL（层数分布参数）

- 控制节点在各层的分布
- 通常 `mL = 1/ln(M)`

| 参数 | 含义 | 影响 |
| --- | --- | --- |
| ![](https://cdn.nlark.com/yuque/__latex/6f5dde593f0bc27956e14b5eaec2ed17.svg) | 每个节点连接的邻居数量 | 查询时间、插入时间、内存、recall |
| ![](https://cdn.nlark.com/yuque/__latex/36c4bc1514d96a0753f1df46d37d308b.svg) | 最大出度 | 控制图稠密度与内存 |
| ![](https://cdn.nlark.com/yuque/__latex/6702fe12bf3c5be6f5f0a582a3693af8.svg) | 查询时底层扩展候选数 | 查询时间、recall |
| ![](https://cdn.nlark.com/yuque/__latex/925fe8991f96df04e2e9da55dfb9a00f.svg) | 构建时搜索候选数 | 构建时间、图质量、recall |

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239754490-826f8d69-201e-4443-bdad-16a5a9c620a2.png)

## 索引总结与选择

| 索引 | 优点 | 缺点 |
| --- | --- | --- |
| Flat | 精确、低内存、更新快、无需重建 | 大数据集不可行 |
| IVF | 速度尚可、准确率好、内存低、参数少 | 不是最快，需要重建 |
| HNSW | 速度极佳、准确率极佳 | 内存膨胀、更新困难、参数多 |
| LSH | 有误差界、更新快、无需重建 | 高维性能差、内存高、实际较少使用 |

选择索引时应考虑：

- 数据集大小
- 向量维度
- 更新频率与动态性
- 新数据是否需要立即可见
- 查询速度要求
- Recall 要求
- 内存预算

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239754496-3a6aca7b-0315-493f-bee5-bac2ed148e9a.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239755166-0d340d05-4761-4894-a7f4-d674cfe85544.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239755173-de88927f-2519-41f5-8d88-2a97e5ec8219.png)

## 核心结论

1. 向量数据库性能高度依赖 ANNS 索引。
2. 索引本质是在**速度、准确率、内存和更新成本之间**做权衡。
3. Flat Search 精确且简单，但大规模时太慢。
4. LSH 理论优雅，但实际 VDBMS 中较少使用。
5. IVF 简单、内存低、更新快，但需要重建。
6. HNSW 是当前最重要的图索引之一，速度和准确率优秀，但内存和更新成本较高。
7. 没有万能索引，必须根据数据规模、维度、更新频率、freshness、recall 和内存预算选择。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239755230-f93f88ce-875a-4730-a3c9-d3d1ad693ae8.png)
