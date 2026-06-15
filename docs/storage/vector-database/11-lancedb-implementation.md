---
source: https://www.yuque.com/yangguangfanxing/nmhuv1/vshtvxe9xmq46c5d
---

# LanceDB 开源向量数据库实现解读

> 原文链接：[https://www.yuque.com/yangguangfanxing/nmhuv1/vshtvxe9xmq46c5d](https://www.yuque.com/yangguangfanxing/nmhuv1/vshtvxe9xmq46c5d)

基于联网搜索、LanceDB 官方仓库/SDK 文档，以及本地源码阅读整理。本文重点分析开源 `lancedb/lancedb` 的本地/嵌入式实现，并补充 remote / namespace / cloud 相关抽象。

- GitHub：[https://github.com/lancedb/lancedb](https://github.com/lancedb/lancedb)

- SDK 文档：[https://lancedb.github.io/lancedb/](https://lancedb.github.io/lancedb/)

- 官方文档入口：[https://docs.lancedb.com](https://docs.lancedb.com)

- 底层 Lance 依赖：[lance-format/lance](https://github.com/lance-format/lance) tag `v8.0.0-beta.6`

# 定位

LanceDB 开源版更像一个**嵌入式、多模态、列式存储驱动的检索数据库内核**，不是必须启动完整集群服务的传统数据库。它基于 Lance columnar format，提供向量搜索、全文搜索、SQL/过滤、多模态数据存储、自动版本管理等能力。

核心判断：

- **存储引擎**主要来自 [lance-format/lance](https://github.com/lance-format/lance)；

- **查询执行**主要基于 Arrow + DataFusion + Lance 自定义执行节点；

- **索引**包括向量索引、标量索引、全文索引；

- **开源本地模式(Local / Embedded Mode)**是 in-process / embedded；

- **分布式与服务化**在开源代码中体现为 `remote_table`、`namespace`、server-side query pushdown、LanceDB Cloud 接口，而不是一个完整开源分布式集群实现。

“开源本地模式”指的就是其开源版本的核心使用方式：**作为一个嵌入式（Embedded）的库，直接运行在您的应用程序进程内部，而非一个需要独立部署和管理的数据库服务（Service）。**

具体来说，它包含以下几个关键特征：

1. **进程内集成**：通过 `pip install lancedb`或 `cargo add lancedb`将其作为库引入项目。在代码中，直接实例化一个 `lancedb.connect()`连接到本地目录，所有的数据库操作（读/写/搜）都通过调用这个库的 API 完成，与应用共享同一个进程和内存空间。
2. **无独立服务**：您**不需要**像启动 PostgreSQL、MySQL 或 MinIO 那样，先运行一个数据库守护进程。没有 `lance-server`这样的常驻服务需要配置、监控和管理。
3. **本地文件存储**：数据以 Lance 列式文件格式直接存储在指定的本地磁盘路径（如 `./data/lancedb`）或云存储（如 S3）上。查询时，库直接读取这些文件进行处理。
4. **轻量且直接**：这种模式消除了客户端-服务器间的网络开销，延迟极低，部署极其简单，非常适合集成到桌面应用、移动应用、单机服务或作为大型服务中的一个组件。

# 总体架构

![](https://images.spumn.eu.cc/cs-knowledge-wiki/storage/vector-database/1781012526929-326ee2f2-da08-4bb4-acf8-c1cbcd523234-a15c5dbcc87d355b.svg)

关键代码位置：

| 模块 | 路径 | 作用 |
| --- | --- | --- |
| crate 入口 | `rust/lancedb/src/lib.rs` | 暴露 connect、Table、Index、Query 等 API |
| Database | `rust/lancedb/src/database.rs` | namespace/table 管理接口 |
| Table | `rust/lancedb/src/table.rs` | BaseTable、NativeTable，封装 CRUD、索引、版本、优化 |
| Query | `rust/lancedb/src/table/query.rs` | 将 LanceDB query 映射到底层 Scanner / DataFusion plan |
| Index | `rust/lancedb/src/index.rs`、`index/vector.rs`、`index/scalar.rs` | 索引类型与构建参数 |
| Liveness/一致性 | `rust/lancedb/src/table/dataset.rs` | `DatasetConsistencyWrapper` |
| Remote | `rust/lancedb/src/remote/*` | 远程 client、RemoteDatabase、RemoteTable |
| 底层 Lance | `Cargo.toml` git dependency | `lance-format/lance` tag `v8.0.0-beta.6` |

# 数据模型：Database、Table、Dataset、Fragment

## Database

`Database` 是 trait，不绑定固定 catalog。它负责 namespace 和 table 管理，例如 `list_tables`、`create_table`、`open_table`、`drop_table`、`rename_table`、`clone_table` 等。

这使 LanceDB 可以支持多种元数据组织方式：

- **ListingDatabase**：通过目录 listing 管理本地表；

- **NamespaceDatabase**：通过 `lance_namespace` 管理表位置、`storage_options`、`managed_versioning`；

- **RemoteDatabase**：连接 LanceDB Cloud / remote service。

## Table

`BaseTable` 是表层核心接口:

```
#[async_trait::async_trait]
impl BaseTable for NativeTable
```

覆盖：schema/count、query/create_plan/analyze_plan、add/delete/update/merge_insert、create_index/drop_index/list_indices/index_stats、optimize、checkout/checkout_latest/restore/tags/branches、storage options，以及 DataFusion `INSERT INTO`。

`NativeTable` 是本地表实现，核心字段可理解为：

```
/// A table in a LanceDB database.
#[derive(Clone)]
pub struct NativeTable {
    name: String,
    namespace: Vec<String>,
    id: String,
    uri: String,
    pub(crate) dataset: dataset::DatasetConsistencyWrapper,
    // This comes from the connection options. We store here so we can pass down
    // to the dataset when we recreate it (for example, in checkout_latest).
    read_consistency_interval: Option<std::time::Duration>,
    // Optional namespace client for namespace operations (e.g., managed versioning).
    // pub(crate) so query.rs can access the field for server-side query execution.
    pub(crate) namespace_client: Option<Arc<dyn LanceNamespace>>,
    // Operations to push down to the namespace server.
    // pub(crate) so query.rs can access the field for server-side query execution.
    pub(crate) pushdown_operations: HashSet<NamespaceClientPushdownOperation>,
}
```

```
NativeTable
├── name / namespace / id / uri
├── DatasetConsistencyWrapper
├── read_consistency_interval
├── optional LanceNamespace client
└── pushdown_operations
```

表层负责编排 API、query/index/write 参数；真正数据读写由底层 Lance `Dataset` 完成。

## Dataset / Manifest / Fragment

底层 Lance `Dataset` 持有 `object_store`、`commit_handler`、manifest、session、refs、`fragment_bitmap`、`index_cache`、`metadata_cache` 等。

Manifest 是 Lance/LanceDB 表的**版本化元数据根**。每次写入、删除、更新、建索引、optimize 等都会以“追加新 Manifest（version+1）”的方式提交，保证 MVCC、原子提交、时间旅行和索引覆盖关系的一致性。

![](https://images.spumn.eu.cc/cs-knowledge-wiki/storage/vector-database/1781166277219-f6dd10ec-225d-4062-a1b1-c1f624934232-e4cf3782c96acccf.svg)

虚线箭头表达关键引用关系：
Dataset → Manifest → Fragments / Index Section；
DataFile.base_id → Manifest.base_paths；
index 的 fragment_bitmap 与数据 fragment 的覆盖关系。

Manifest 是 LanceDB 的 MVCC 根，包含：schema、version、branch/tag、fragments、`index_section`、`transaction_file`、`next_row_id`、`storage_format`、config、`table_metadata`、`external_base_paths`。

Fragment 组织如下：

```
Manifest
└── Fragment[]
    ├── DataFile[]
    │   ├── path
    │   ├── field ids
    │   ├── column indices
    │   ├── file format version
    │   └── file size / base id
    └── optional DeletionFile
```

这个结构决定了 LanceDB 的核心特征：追加写、不可变数据文件、删除靠 deletion vector、版本靠 manifest 切换、性能维护靠 compaction / optimize。

**Manifest 就是 Lance/LanceDB 表在某个版本上的“总账”**——一份单文件、不可变、版本化的元数据快照。每次成功的写入都会生成并提交一个新的 Manifest（一次 +1 版本），但**它本身不存数据**，只描述这一版可见的数据和索引。

### **Manifest**到底放了什么

来自 `rust/lance-table/src/format/manifest.rs::Manifest`（精简）：

- `schema`：当前列定义、字段 id、嵌套结构。
- `version: u64` + `writer_version`：单调递增的 MVCC 版本号、写入端版本。
- `branch / tag`：分支和标签引用。
- `fragments: Arc<Vec<Fragment>>` + `fragment_offsets`：这一版可见的所有数据片段（每个 Fragment 又指向 `DataFile`、`deletion_file`、`row_id_meta`）。
- `index_section: Option<usize>`：Manifest 文件内 IndexSegment 列表的偏移；IndexSegment 里有 `uuid / fragment_bitmap / index_details / index_version`。
- `transaction_file / transaction_section`：本次提交对应的事务文件路径或内联偏移。
- `next_row_id`：稳定 row id 分配水位。
- `data_storage_format`：Lance file 主/次版本。
- `config / table_metadata`：库行为配置 + 用户自定义元信息。
- `base_paths`：外部存储根的映射（外部 DataFile 用 `base_id` 引用）。
- `timestamp_nanos / reader_feature_flags / writer_feature_flags / max_fragment_id` 等。

所以一份 Manifest 等于：**“这版表是什么样、哪些 fragment 可见、哪些索引覆盖哪些 fragment、属于哪条 branch、上一笔事务是什么”**。

### 每次写入提交新 Manifest

**几乎每一次成功提交都会写一个新的 Manifest 文件，version += 1。** Lance 的 MVCC 是“追加新版本，不修改旧版本”。

具体路径（`rust/lance/src/io/commit.rs::commit_transaction`）大致是：

1. 拿到当前 dataset 的 `read_version`，目标版本一般是 `read_version + 1`。
2. 把写入操作（Append / Update / Delete / Overwrite / CreateIndex / Optimize 等）封装成 `Transaction`。
3. 写一个 transaction 文件到 object store（可选）。
4. 用旧 `Manifest` + `Transaction` 调 `transaction.build_manifest(...)` 生成新的 `Manifest` 和索引列表。
5. 通过 `commit_handler` 原子提交：尝试以 `target_version` 写入新 manifest；如果别人抢先提交了 `read_version + 1`，本次会读最新版本，做 `TransactionRebase`、`check_txn`，没冲突就重试到 `version + 1`，仍冲突则报 `commit_conflict_source`。
6. 成功后，新 Manifest 就成为最新版，旧 Manifest 仍存在，可被 time travel / checkout 使用。

### Manifest 常见误解

- **它不是“每写一条记录就一个 Manifest”，而是“****每次提交****一个 Manifest”。** 一次 `add()` 批量写入一组 fragments 后，最后一步生成一个新 Manifest。所以 Manifest 数量 ≈ 提交次数，不等于行数。
- **写数据 ≠ 改旧 Manifest。** Lance 不会修改已存在的 Manifest 或 Fragment 文件。新版本只是新写一份 Manifest（以及可能新的 Fragment / 索引文件），旧版本仍可读。
- **删除、更新、merge、compaction、create_index、optimize 同样会提交新 Manifest。** 任何对“表逻辑视图”有影响的操作都需要 bump 版本。
- **索引和数据通过 IndexSegment.fragment_bitmap 关联。** 新数据写入后，老索引的 fragment_bitmap 不包含新 fragment，所以这部分数据查询时要 fallback 扫描，等 `optimize / index` 之后才被新的 IndexSegment 覆盖——而这次 optimize 仍然以提交新 Manifest 的方式生效。
- **并发提交靠**`**commit_handler**`**+ retry + conflict_resolver 保证原子性。** 拿不到 `version + 1` 的提交者会被驳回或被自动 rebase 重试。
- **时间旅行 (**`checkout_version`**) 就是读取旧 Manifest。** 因为旧 Manifest 完整描述了那一时刻的可见 fragments 和索引，所以历史版本可以独立、稳定地复现。
- **Cleanup 会主动回收旧 Manifest / Fragment / 索引文件。** 这是显式的维护动作，不影响“每次写入都提交新 Manifest”的基本规则。

# Storage 与 Storage Manager

## Object Store 抽象

LanceDB 支持本地路径、S3、GCS、Azure Blob、OSS、remote/cloud URI。底层通过 `object_store` 抽象统一不同存储。Rust feature 中可以看到 `aws`、`azure`、`gcs`、`oss`、`dynamodb`、`remote` 等，说明对象存储和外部 commit manager 都是设计重点。

## CommitHandler

Lance 的事务提交本质是写入下一版本 manifest。并发 writer 必须避免写同一个版本，因此有 `CommitHandler` 抽象：

- 默认可使用 `conditional_put` / rename 类机制；

- S3 等对象存储缺乏强原子 rename，推荐 DynamoDB 等外部 commit 机制；

- namespace `managed_versioning` 可使用 `ExternalManifestCommitHandler`；

- LanceDB 通过 `LanceNamespaceExternalManifestStore` 将 manifest commit 与 namespace 协调。

![](https://images.spumn.eu.cc/cs-knowledge-wiki/storage/vector-database/1781012842632-c64d1801-a1cc-4eb1-a6a1-7228821bd4d8-d97deec68a4dd3b5.svg)

## Cache 与 Mirroring Object Store

`Dataset` 默认 index cache 为 6 GiB，metadata cache 为 1 GiB。对象存储上 manifest、`index_metadata`、列元数据、索引块的访问成本高，cache 是性能关键。

LanceDB 还实现了 `MirroringObjectStore`：写入先写 secondary，再写 primary；读取只读 primary；`_latest.manifest` 只写 primary。它用于“primary durable but slow，secondary fast but less durable”的场景。

# 写入路径

## Create / Add

`NativeTable::create`：构造 `WriteParams`，通过 `InsertBuilder::new(uri).execute_stream(batches)` 写入 Lance dataset，然后返回 `NativeTable` 并用 `DatasetConsistencyWrapper::new_latest` 包装。

`NativeTable::add` 的核心流程：

![](https://images.spumn.eu.cc/cs-knowledge-wiki/storage/vector-database/1781012898459-cad2c48e-8554-4d99-bcf3-b2a2dabcc290-fbb277d08ba16763.svg)

写入前会做 schema 校验、embedding function、cast、NaN 向量拒绝、并行写 partition 估算等。

## Delete / Update / Merge

- **Delete**：生成 deletion file / deletion vector，而不是原地删除 data file；查询时合并 deletion mask。

- **Update**：列式不可变文件通常通过新文件、新 fragment、新 manifest 实现。

- **Merge insert**：代码中已有 `LsmWriteSpec` 和底层 Lance `dataset/mem_wal/*`，支持 bucket / identity / unsharded 形态和 maintained indexes。这说明 LanceDB 正在引入更偏 LSM/WAL 的实时写路径。

# Index 实现

## 索引类型

| 类型 | 用途 |
| --- | --- |
| `BTree` | 标量列，适合高基数、范围/等值过滤 |
| `Bitmap` | 低基数字段 |
| `LabelList` | `List<T>` 标签列，支持 contains all/any |
| `FTS` | 全文索引，BM25 / inverted index |
| `IvfFlat` | IVF 分区 + 原始向量 |
| `IvfPq` | IVF + Product Quantization |
| `IvfSq` | IVF + Scalar Quantization |
| `IvfRq` | IVF + RabitQ Quantization |
| `IvfHnswPq` | IVF + HNSW + PQ |
| `IvfHnswSq` | IVF + HNSW + SQ |
| `IvfHnswFlat` | IVF + HNSW + 原始向量 |

`Index::Auto`：vector column 默认 IVF-PQ；scalar column 默认 BTree。

## 向量索引参数

`index/vector.rs` 中的关键参数：

- IVF：`num_partitions`、`sample_rate`、`max_iterations`、`target_partition_size`；

- PQ：`num_sub_vectors`、`num_bits`；

- HNSW：`num_edges`、`ef_construction`；

- distance：L2、Cosine、Dot、Hamming。

IVF-PQ 的逻辑：先训练 IVF 分区中心，再把向量分区；PQ 将向量切成子向量并量化；查询时先找最近分区，再在分区内近似搜索；可用 refine factor 读取原始向量重排。

## 索引生命周期

`OptimizeAction::Index` 的注释很关键：新增数据不会立即加入已有索引，但查询仍会同时搜索 indexed data 和扫描 unindexed data。随着未索引数据变多，查询变慢。`optimize_indices` 会把未索引数据追加到已有索引，不完全重训。

```
create_index: train + build index for existing data
add data: new rows query-visible but unindexed
query: indexed search + unindexed scan
optimize_indices: append unindexed rows into existing index
retrain: 数据分布变化很大时才需要考虑
```

# Query、Planner、Executor

## LanceDB Query API 到 Scanner

`table/query.rs` 会把 LanceDB query 转换为 Lance `Scanner` 配置：

- `nearest(column, vector, top_k)`；

- `minimum_nprobes` / `maximum_nprobes`；

- `ef`；

- `distance_range`；

- `use_index`；

- `prefilter`；

- `project` / `project_with_transform`；

- `filter` / `filter_substrait` / `filter_expr`；

- `full_text_search`；

- `refine`；

- `distance_metric`；

- `order_by`。

最后调用 `scanner.create_plan().await`，得到 DataFusion `ExecutionPlan`，再通过 `execute_plan` 执行。

## Planner 策略

底层 `Scanner::create_plan` 会决定：普通 scan 还是 indexed query；标量索引是否作为 prefilter；向量搜索是否使用 ANN index；FTS 是否使用 inverted index；是否 late materialization；是否需要 TakeExec 回表；是否需要 refine；是否 push down limit/count/projection。

![](https://images.spumn.eu.cc/cs-knowledge-wiki/storage/vector-database/1781012930196-95027c44-0cb0-4b8c-a87b-b8993ae042c9-096d622f6c2c9b99.svg)

## Executor 节点

Lance 在 DataFusion 物理计划中加入自定义执行节点：

- `LanceScanExec`：扫描 fragment / data file；

- `ScalarIndexExec`：标量索引查询；

- `KNNVectorDistanceExec` / ANN exec：向量距离计算与 ANN 搜索；

- FTS exec：全文搜索；

- `TakeExec`：根据 row id / row address 回表取列；

- `FilteredReadExec`：过滤读；

- optimizer：`CountPushdown`、`CoalesceTake`、`SimplifyProjection`、DataFusion `LimitPushdown`。

# Liveness / 可见性 / 一致性

这里的 liveness 可以从“新写入何时对读可见”和“表句柄如何追踪最新版本”理解。LanceDB 依赖 `DatasetConsistencyWrapper` 管理。

## 三种一致性模式

| 模式 | 触发方式 | 行为 |
| --- | --- | --- |
| Lazy | `read_consistency_interval = None` | 使用当前句柄缓存的 dataset，除非显式 `checkout_latest` |
| Strong | interval 为 0 | 每次 `get()` 都同步刷新 latest manifest |
| Eventual | interval > 0 | TTL 内返回缓存，接近过期后台刷新，过期后同步刷新 |

写操作完成后，当前 table handle 会 `dataset.update(new_dataset)`，因此**同一句柄内写后读立即可见**。其他 table handle 是否可见取决于一致性模式或是否调用 `checkout_latest()`。

## Time Travel 与可变性

当 checkout 到特定版本或 tag 时，wrapper 会进入 pinned version 状态。此时 `ensure_mutable()` 会禁止修改，避免对历史快照写入。调用 `checkout_latest()` 后重新追踪最新版本，才可继续写。

# Optimize、GC 与版本管理

`OptimizeAction` 包含三类：

1. **Compact**：合并小文件。LanceDB 使用只读/不可变文件模型，频繁 add/delete/update 会产生小文件，影响读写性能。

1. **Prune**：清理旧版本。旧版本保留用于一致性、并发读和 time travel，但会占用空间。默认保留一定时间窗口，且对较新的文件更谨慎，避免误删进行中的事务文件。

1. **Index**：优化索引，把未索引数据追加到已有索引。

这对应 LSM / MVCC 系统中的 compaction、vacuum、index maintenance 三类后台维护任务。

# Remote、Namespace 与分布式能力

开源仓库中有 `remote/*`，也有 `lance_namespace` 接口。它们体现了服务化/分布式方向，但本地开源默认路径不是完整分布式集群。

## Namespace

Namespace 的作用包括：

- catalog：表名、namespace、表位置；

- `storage_options_vending`：动态提供对象存储凭证；

- `managed_versioning`：外部协调 manifest；

- `query_pushdown`：支持 `QueryTable` 时，查询可发到 namespace server 执行。

`table/query.rs` 中的逻辑：如果 table 的 `pushdown_operations` 包含 `QueryTable`，并且有 `namespace_client`，且当前不是 branch handle，那么会把 query 转换成 namespace `QueryTableRequest`，由 server-side query 执行并返回 Arrow IPC。

## RemoteTable

`remote/table.rs` 实现远程表操作：通过 REST client 调用服务端执行 add/query/index 等。这里的分布式主要是 client-server 架构，实际分片、调度、弹性等由 LanceDB Cloud / 服务端承担。

## 开源本地与分布式边界

| 能力 | 开源本地路径 | Remote / Cloud 路径 |
| --- | --- | --- |
| 查询执行 | 本进程 DataFusion plan | 服务端 query_table / REST |
| 存储 | 本地或对象存储 | 通常对象存储 + 服务端控制面 |
| 元数据 | listing / namespace | namespace service |
| 并发提交 | object store commit handler / DynamoDB / namespace | 服务端控制 |
| 分片调度 | 无完整集群调度器 | Cloud/remote 层负责 |

# 与传统向量数据库架构的对比

传统向量数据库常见结构：Proxy / QueryNode / IndexNode / DataNode / MetaStore / ObjectStore。LanceDB 开源本地模式更轻：

```
App Process
└── LanceDB SDK / Rust Core
    └── Lance Dataset
        ├── ObjectStore
        ├── Manifest MVCC
        ├── DataFusion ExecutionPlan
        └── Index Files
```

优势：

- 运维简单，无服务依赖；

- 与 Arrow/Pandas/Polars/DuckDB 生态贴近；

- 对多模态数据和对象存储友好；

- 适合 RAG、本地 AI 应用、serverless 场景。

代价：

- 开源本地模式没有内建完整分布式调度；

- 高并发、多租户、跨节点资源管理主要依赖 remote/cloud；

- 写入追加 + deletion vector 需要定期 optimize；

- 索引对新增数据不是实时维护，未索引部分会参与扫描。

# 重点流程总结

## 查询流程

```
SDK Query
→ LanceDB QueryBuilder
→ table/query.rs 转 Scanner 配置
→ Lance Scanner create_plan
→ DataFusion ExecutionPlan
→ LanceScanExec / ScalarIndexExec / ANN / FTS / TakeExec
→ 读取 fragments / index / deletion mask
→ RecordBatch stream 返回
```

## 写入流程

```
SDK add/create/update/delete
→ Table API
→ DataFusion preprocessing plan
→ InsertExec / Lance write builders
→ 写 data files / deletion files / transaction
→ commit new manifest
→ DatasetConsistencyWrapper update
```

## 索引维护流程

```
create_index
→ Lance DatasetIndexExt create_index_builder
→ train/build index files under _indices
→ update manifest index section

add data
→ 新数据可查但未索引

optimize_indices
→ 将 unindexed rows append 到已有索引
```

# 阅读源码建议

建议按以下顺序读：

1. `rust/lancedb/src/lib.rs`：API 总览；

1. `rust/lancedb/src/database.rs`：catalog/namespace 抽象；

1. `rust/lancedb/src/table.rs`：表层 API 和 `NativeTable`；

1. `rust/lancedb/src/table/query.rs`：query 如何转成 scanner；

1. `rust/lancedb/src/index.rs`、`index/vector.rs`：索引类型与参数；

1. `rust/lancedb/src/table/dataset.rs`：一致性和 liveness；

1. `rust/lancedb/src/remote/*`：remote/cloud client；

1. 底层 `lance-format/lance` 的 `dataset.rs`、`dataset/scanner.rs`、`io/exec/*`、`io/commit.rs`、`lance-table/src/format/*`。

# 结论

LanceDB 的核心实现思路可以概括为：

用 Lance 列式对象存储格式作为持久化底座，

用 manifest 实现 MVCC 和版本管理，

用 DataFusion + Lance 自定义执行节点实现查询执行，

用 IVF/HNSW/PQ/SQ/FTS/标量索引实现混合检索，

并通过 namespace/remote 抽象向服务化与云端扩展。

它最有特色的不是“另一个 HNSW 服务”，而是把**多模态数据湖格式、向量索引、全文/标量过滤、Arrow 生态、对象存储、版本管理**组合在一起，形成适合 AI 应用的 embedded / serverless 向量数据库架构。
