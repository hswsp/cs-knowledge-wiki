---
source: https://www.yuque.com/yangguangfanxing/nmhuv1/axmhg405ffl8xwgp
---

# LanceDB 索引原理与实现解读

> 原文链接：[https://www.yuque.com/yangguangfanxing/nmhuv1/axmhg405ffl8xwgp](https://www.yuque.com/yangguangfanxing/nmhuv1/axmhg405ffl8xwgp)

本文聚焦 LanceDB 支持的索引类型、查询原理、参数含义，以及 LanceDB 与底层 Lance / `lance-index` 之间的实现边界。

## 概览

LanceDB 的索引层可以理解为三类能力：

1. **向量 ANN 索引**：用于近似最近邻检索，主要是 IVF 系列，以及 IVF + HNSW + 量化的组合。

1. **标量索引**：用于 `where` 过滤、点查、范围查、标签查，包括 BTree、Bitmap、LabelList。

1. **全文索引**：用于字符串全文检索，即 FTS / inverted index。

LanceDB 自身主要提供 API、builder、参数校验和索引类型映射；真正的索引训练、构建、查询和持久化，主要发生在底层 `lance`、`lance-index`、`lance-table` 等 crate 中。

![](https://images.spumn.eu.cc/cs-knowledge-wiki/storage/vector-database/1781013540997-e8fb27fd-eb9c-416f-899b-0e9f99c327c9-dcc8c27c16cd7075.svg)

## LanceDB 暴露了哪些索引

在 `rust/lancedb/src/index.rs` 中，LanceDB 的 `Index` enum 支持以下类型：

| 类型 | 类别 | 典型用途 |
| --- | --- | --- |
| `Index::Auto` | 自动选择 | 向量列默认 IVF_PQ；可 BTree 的标量列默认 BTree |
| `Index::IvfFlat` | 向量 | IVF 粗分区 + 分区内原始向量扫描 |
| `Index::IvfPq` | 向量 | IVF + Product Quantization 压缩 |
| `Index::IvfSq` | 向量 | IVF + Scalar Quantization 压缩 |
| `Index::IvfRq` | 向量 | IVF + Residual Quantization 压缩 |
| `Index::IvfHnswFlat` | 向量 | IVF + 分区内 HNSW + 原始向量 |
| `Index::IvfHnswPq` | 向量 | IVF + 分区内 HNSW + PQ |
| `Index::IvfHnswSq` | 向量 | IVF + 分区内 HNSW + SQ |
| `Index::BTree` | 标量 | 高基数、选择性强、范围查询 |
| `Index::Bitmap` | 标量 | 低基数字段、等值过滤 |
| `Index::LabelList` | 标量 | list/tag 字段包含查询 |
| `Index::FTS` | 全文 | 文本列全文检索 |

源码中的关键映射位于 `rust/lancedb/src/table.rs` 的 `make_index_params`：

- `Index::Auto`：若字段是向量类型，默认构建 `VectorIndexParams::with_ivf_pq_params(...)`；若字段支持 BTree，则使用 `ScalarIndexParams::for_builtin(BuiltinIndexType::BTree)`。

- `Index::BTree / Bitmap / LabelList`：映射到 `BuiltinIndexType::{BTree, Bitmap, LabelList}`。

- `Index::FTS`：直接使用 FTS builder 参数。

- `Index::IvfFlat / IvfPq / IvfSq / IvfRq / IvfHnsw*`：构造不同的 `VectorIndexParams`。

`get_index_type_for_field` 则把这些 builder 归类为 LanceDB 展示层的 `IndexType::{Vector, BTree, Bitmap, LabelList, Inverted}`。

## 向量索引的共同背景

`rust/lancedb/src/index/vector.rs` 的注释说明：向量索引是近似索引，用于查找与查询向量相似的行。目前主要支持固定大小 list / tensor 形式的浮点向量列。

典型查询不是“完全精确”，而是在召回率、查询延迟、索引大小之间做权衡。

LanceDB 的向量 index builder 中会传入 `distance_type`，它会影响 IVF 训练、候选分区选择、候选向量排序和量化码的距离计算。常见距离包括 L2、Cosine、Dot 等。**使用时要注意：索引构建时的距离类型最好与查询时一致，否则索引组织方式和查询目标会不匹配。**

## IVF：LanceDB 向量索引的外层骨架

IVF 是 Inverted File Index。它的核心思想是：

1. 先用训练样本对向量空间做聚类，得到若干个质心。

1. 每个质心对应一个分区，也就是一个 IVF list。

1. 构建时，每条向量被分配到最近的质心分区。

1. 查询时，查询向量先找最近的若干个质心，只扫描这些分区。

![](https://images.spumn.eu.cc/cs-knowledge-wiki/storage/vector-database/1781013591581-08ed45cb-b7ba-491d-852f-cc8bd7e3d0bf-1d042c7fcf1760dc.svg)

### 构建阶段

以 `Index::IvfPq` 为例，LanceDB 在 `make_index_params` 中会：

1. 校验字段类型是否支持向量索引。

1. 读取向量维度。

1. 根据 `num_partitions`、`target_partition_size`、`sample_rate`、`max_iterations` 构造 `IvfBuildParams`。

1. 根据维度、`num_sub_vectors`、`num_bits` 构造 PQ 参数。

1. 调用 `VectorIndexParams::with_ivf_pq_params(...)`。

底层 Lance vector builder 再负责实际训练和写入索引。

### 查询阶段

IVF 查询大致分为：

1. 用查询向量 `q` 与 IVF 质心计算距离。

1. 选出最近的 `nprobes` 个分区。

1. 在这些分区内召回候选向量。

1. 如果配置了 refine / rerank，则读取原始向量重新计算精确距离。

1. 返回 top-k。

`nprobes` 是非常关键的查询参数：`nprobes` 越小，查询更快但可能漏掉真实近邻；`nprobes` 越大，召回率更好但读取和计算成本更高。

| 参数 | 含义 | 调参方向 |
| --- | --- | --- |
| `num_partitions` | IVF 分区数量 | 数据越大通常越需要更多分区 |
| `target_partition_size` | 目标分区大小 | 可以让系统根据数据量推导分区数 |
| `sample_rate` | 训练采样率 | 更高可能训练更稳，但构建更慢 |
| `max_iterations` | 聚类迭代次数 | 更高可能质心更好，但训练更慢 |
| `nprobes` | 查询探测分区数 | 更高召回更好、延迟更高 |

## IVF_FLAT：最容易理解的向量索引

`IVF_FLAT` = IVF 粗分区 + 分区内原始向量扫描。

它的优点是逻辑简单、没有向量压缩误差、被探测分区内可以使用原始向量距离。缺点是分区内仍然要扫原始向量，索引体积也接近原始向量数据。对超大规模数据，IO 和内存压力较大。

因此，`IVF_FLAT` 更适合数据量中等、对召回精度较敏感、可以接受较大索引体积、不想引入量化误差的场景。

## PQ / SQ / RQ：为什么要量化

当向量规模很大时，原始 float 向量既占空间，也增加距离计算成本。量化索引通过“短码”近似原始向量，从而降低索引大小和计算成本。

![](https://images.spumn.eu.cc/cs-knowledge-wiki/storage/vector-database/1781013634046-32fccba0-6b52-409c-bb06-efcd25730a4c-8e0b9130c85966d4.svg)

### IVF_PQ

PQ，即 Product Quantization，基本思路是：把 D 维向量切成多个子向量；每个子向量空间单独训练一个 codebook；一个向量最终表示为多个 code id。

例如，一个 128 维 float 向量，如果切成 16 个子向量，每个子空间用 8 bit 编码，那么一个向量的编码约为 16 字节，而不是 128 × 4 = 512 字节。实际实现还要考虑元数据、row id、codebook 等额外开销，但数量级优势明显。

LanceDB 中 `IvfPqIndexBuilder` 的关键参数包括：

- `num_sub_vectors`：子向量数量。

- `num_bits`：每个子码的 bit 数，默认常见为 8。

- `max_iterations`：PQ 训练迭代次数。

- IVF 相关参数：`num_partitions`、`target_partition_size`、`sample_rate`。

PQ 的主要权衡：压缩越强，索引越小、查询越快，但近似误差可能越大。

### IVF_SQ

SQ，即 Scalar Quantization。它不是把向量切成子空间训练 codebook，而是对每个维度或标量值做缩放和离散化，例如 float → int8。

它通常比 PQ 更简单，编码和解码成本也较低，但压缩率与误差特征不同。LanceDB 的 `Index::IvfSq` 会构造 `SQBuildParams`，其中 `sample_rate` 会传入底层训练流程。

### IVF_RQ

RQ，即 Residual Quantization。它会多轮量化：第一层码本先近似原向量，计算残差，下一层码本继续**量化残差**，最终多层码叠加逼近原始向量。

LanceDB 的 `Index::IvfRq` 会构造 `RQBuildParams::new(index.num_bits.unwrap_or(1) as u8)`。RQ 的优势是可以通过多层残差逐步逼近，但训练和查询逻辑通常更复杂。

## IVF_HNSW：组合索引

HNSW 是图索引，核心思想是把向量组织成近邻图，查询时从入口点开始贪心或候选队列式地在图上移动，逐步接近查询向量。

LanceDB 暴露的不是单独 HNSW，而是：

- `IvfHnswFlat`

- `IvfHnswPq`

- `IvfHnswSq`

也就是说：外层仍然是 IVF，内层分区内再用 HNSW 加速。

![](https://images.spumn.eu.cc/cs-knowledge-wiki/storage/vector-database/1781013683717-c96f871c-73a3-463a-8fa6-d3123c68e563-11f307f84546dfe3.svg)

### 为什么要 IVF + HNSW

纯 IVF 的问题是：选中分区后，分区内如果仍然很大，Flat 扫描或压缩码扫描也会有成本。

IVF_HNSW 的思路是先用 IVF 限定大致搜索范围，再对选中的每个分区使用 HNSW 图搜索，进一步减少分区内访问的点数。

这适合单个分区仍然较大、需要更低查询延迟、可以接受更高构建成本和更大索引结构的场景。

### 关键参数

LanceDB 的 `IvfHnsw*IndexBuilder` 会把参数映射到底层 `HnswBuildParams`：

- `m`：通常表示每个节点保留的边数上限，影响图连通性、索引大小、查询质量。

- `ef_construction`：构建时搜索宽度，越大构建越慢，但图质量通常更好。

查询侧常见还会有类似 `ef` 的候选宽度参数。更高的 ef 通常意味着更高召回率和更高延迟。

## 标量索引：BTree、Bitmap、LabelList

标量索引不是为了向量相似度，而是为了快速把过滤条件转换为 row id 集合。

![](https://images.spumn.eu.cc/cs-knowledge-wiki/storage/vector-database/1781013732864-4c724296-52b2-4835-aa54-6bd2a13bb6b3-cf384b4d9b7a1f85.svg)

### BTree

`rust/lancedb/src/index/scalar.rs` 对 BTree 的注释非常关键：

- BTree index stores a copy of the column in sorted order.

- Header entry per block of rows.

- Current block size fixed at 4096.

- Good for mostly distinct values and highly selective queries.

可以理解为：BTree 索引把目标列复制一份，并按值排序。查询等值或范围条件时，不必扫描整列，而是通过有序结构定位相关范围，再映射回 row id。

适用场景：**高基数字段**，例如 user_id、timestamp、订单号；高选择性过滤，例如 `id = 123`、`ts between ...`；以及范围查询。不适合低基数字段，例如 boolean、少数几个 category，此时 Bitmap 往往更合适。

### Bitmap

Bitmap 索引的注释说明：

- Bitmap stores a bitmap for each possible value.

- Best for low-cardinality columns.

也就是说，对每个可能值维护一个 bitmap。第 i 位表示第 i 行是否具有该值。

例如 `status in ('paid', 'pending', 'cancelled')`，每个 status 都可以有一个位图。等值过滤时直接取对应位图，组合条件时可以做位运算。

适用场景：boolean、enum / category、取值数量不大的字符串或整数列。不适合高基数字段。如果每个值都接近唯一，那么每个值都维护 bitmap 会浪费空间。

### LabelList

LabelList 面向 list/tag 类字段。比如一行有多个标签：`['rust', 'vector-db', 'ann']`。

它的目标是让“包含某个标签”的查询快速定位行集合。实现上可以理解为：从 label 映射到包含该 label 的 row id 集合或 bitmap。

适用场景包括多标签过滤、文档 tags、商品属性集合。

## FTS / Inverted：全文检索索引

FTS，即 full-text search，底层是 inverted index 的思想：

1. 对文本列进行分词、规范化。

1. 建立 term → postings 的映射。

1. 查询时把关键词映射成 postings list。

1. 根据匹配逻辑、评分或过滤条件返回候选行。

LanceDB 中 `Index::FTS` 会校验字段类型是否支持全文索引，然后把 FTS builder 参数传给底层实现。`get_index_type_for_field` 会把它映射为 `IndexType::Inverted`。

FTS 和向量索引经常可以组合使用：先用 FTS 找关键词匹配文档再做向量 rerank；先做向量 ANN 再用文本条件过滤；同时使用 scalar filter 限定业务范围。

## 索引生命周期与 Manifest

Lance 的数据组织是版本化的。索引不是一个孤立文件，而是和 Dataset manifest、fragments、index segments 共同工作。

在 `lance/src/index/api.rs` 中，`IndexSegment` 包含几个关键字段：

- `uuid`：索引段标识。

- `fragment_bitmap`：这个索引段覆盖哪些 fragments。

- `index_details`：索引具体元数据。

- `index_version`：索引版本。

![](https://images.spumn.eu.cc/cs-knowledge-wiki/storage/vector-database/1781013766642-45796630-a0fd-4cb2-a5f1-1e0d2d451282-0011ea4f96c4bf65.svg)

这意味着：索引和数据 fragment 之间存在“覆盖关系”。当表新增数据后，新 fragment 不一定已经被旧索引覆盖。查询时系统需要把已索引部分和未索引部分结合起来，避免因为索引滞后导致漏结果。

维护动作包括索引追加、合并、优化、清理等。`rust/lancedb/src/table/optimize.rs` 中的 `OptimizeAction::Index` 就对应索引维护入口之一。底层 `lance/src/index/append.rs` 处理 append / merge / optimize 相关逻辑。

## 查询时索引如何配合

实际查询往往不只是单一索引：

- 向量查询可能带 `where` 条件。

- FTS 查询可能再带标量过滤。

- ANN 结果可能需要读取原始行进行 refine / rerank。

- 未被索引覆盖的新 fragment 需要 fallback scan。

因此，查询执行层通常要做几件事：

1. 根据查询类型识别可用索引。

1. 用标量索引或全文索引得到候选 row id 集合。

1. 用向量索引得到 ANN 候选。

1. 对不同候选集合求交、合并或过滤。

1. 需要时回表读取原始向量或完整记录。

这也是为什么 LanceDB 的索引不是简单的“有索引就只查索引”：为了保证正确性，必须考虑 fragment 覆盖范围、删除、更新、refine、过滤条件和版本化 manifest。

## 选型建议

| 场景 | 推荐索引 | 原因 |
| --- | --- | --- |
| 中等规模向量，重视精度 | IVF_FLAT | 无量化误差，逻辑简单 |
| 大规模向量，追求空间和速度平衡 | IVF_PQ | 压缩率高，是 Auto 向量默认选择 |
| 希望简单量化、解码成本低 | IVF_SQ | 标量量化结构相对直接 |
| 希望残差多层逼近 | IVF_RQ | 通过残差逐步提高近似能力 |
| 分区内仍很大、需要更快检索 | IVF_HNSW_* | IVF 过滤范围，HNSW 加速分区内搜索 |
| 高基数标量、范围查询 | BTree | 有序结构适合高选择性和范围查 |
| 低基数过滤 | Bitmap | value → bitmap，位运算高效 |
| 多标签 list 字段 | LabelList | label → row 集合 |
| 文本关键词搜索 | FTS / Inverted | term → postings |

## 源码定位索引

建议按下面路径阅读：

#### LanceDB API / builder 层

- `/Users/wu000376/Github/lancedb/rust/lancedb/src/index.rs`：索引 enum 与公开入口。

- `/Users/wu000376/Github/lancedb/rust/lancedb/src/index/vector.rs`：向量索引 builder 参数。

- `/Users/wu000376/Github/lancedb/rust/lancedb/src/index/scalar.rs`：标量索引和 FTS builder 参数与注释。

- `/Users/wu000376/Github/lancedb/rust/lancedb/src/table.rs`：`create_index`、`make_index_params`、类型校验与映射。

- `/Users/wu000376/Github/lancedb/rust/lancedb/src/table/optimize.rs`：索引优化入口。

#### Lance / lance-index 实现层

- `/var/folders/98/z2dh1hdn59l0tff7cj8kdh7r0000gn/T/opencode/lance-src/rust/lance/src/index/api.rs`：索引元数据与 `IndexSegment`。

- `/var/folders/98/z2dh1hdn59l0tff7cj8kdh7r0000gn/T/opencode/lance-src/rust/lance/src/index/append.rs`：索引 append / merge / optimize。

- `/var/folders/98/z2dh1hdn59l0tff7cj8kdh7r0000gn/T/opencode/lance-src/rust/lance/src/index/vector/builder.rs`：向量索引构建流程。

- `/var/folders/98/z2dh1hdn59l0tff7cj8kdh7r0000gn/T/opencode/lance-src/rust/lance-index/src/scalar/btree.rs`：BTree 底层实现。

- `/var/folders/98/z2dh1hdn59l0tff7cj8kdh7r0000gn/T/opencode/lance-src/rust/lance-index/src/scalar/bitmap.rs`：Bitmap 底层实现。

- `/var/folders/98/z2dh1hdn59l0tff7cj8kdh7r0000gn/T/opencode/lance-src/rust/lance-index/src/scalar/inverted.rs`：FTS / inverted index 入口。

- `/var/folders/98/z2dh1hdn59l0tff7cj8kdh7r0000gn/T/opencode/lance-src/rust/lance-index/src/vector/`：IVF、PQ、SQ、RQ、HNSW 等向量索引实现。

## 总结

LanceDB 的索引设计不是单一算法，而是一套组合体系：

- 向量索引用 IVF 控制搜索空间，用 PQ/SQ/RQ 降低存储与距离计算成本，用 HNSW 加速分区内搜索。

- 标量索引用 BTree / Bitmap / LabelList 把过滤条件快速转成 row id 集合。

- 全文索引用 inverted index 把文本 token 转成 postings。

- Manifest 和 IndexSegment 负责索引版本、覆盖范围和数据 fragment 的一致性。

理解 LanceDB 索引，关键是把它看成“**查询规划 + 候选集合生成 + 回表 refine + 版本化覆盖关系**”的整体，而不是某一个孤立的数据结构。
