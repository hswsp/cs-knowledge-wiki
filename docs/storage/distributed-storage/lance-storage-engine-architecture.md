---
source: https://www.yuque.com/yangguangfanxing/nmhuv1/ee207e2ba594f1017d50899c276305e4
---

# Lance 存储引擎架构解析

> 原文链接：[https://www.yuque.com/yangguangfanxing/nmhuv1/ee207e2ba594f1017d50899c276305e4](https://www.yuque.com/yangguangfanxing/nmhuv1/ee207e2ba594f1017d50899c276305e4)

本文重点关注 Lance 作为存储引擎 / Lakehouse Format 的内部架构：文件格式、表格式、事务、读写路径、索引、I/O 与对象存储适配。

## Lance 是什么：面向 AI Lakehouse 的列式存储引擎

Lance 官方定位是 **The Open Lakehouse Format for Multimodal AI**。它并不是一个单文件格式，而是一组分层协作、可独立演进的规范与实现：

1. **File Format**：面向对象存储和随机访问的列式文件容器。

1. **Table Format**：管理 fragments、manifests、deletion files、schema evolution、ACID commits、MVCC。

1. **Index Formats**：管理 scalar / vector / full-text / system indices。

1. **Catalog / Namespace Specs**：管理表发现、注册与跨 catalog 协调。

1. **语言绑定与生态集成**：Rust core 之上提供 Python、Java、DataFusion、PyArrow、Pandas、DuckDB、Polars、Spark、Ray 等集成。

**Catalog = 向量数据库的"元数据目录/系统表/注册表"**，管的是数据的**结构定义和拓扑信息**，而不是向量数值本身。向量存在 object storage / 磁盘 segment 里，catalog 存在分布式 KV（通常是 etcd）里。

![](https://images.spumn.eu.cc/cs-knowledge-wiki/storage/vector-database/1781340051316-f3e06ffc-c2ed-4a3c-a833-f5cad50f89a3-6466843971f73f49.svg)

### 核心设计取舍

Lance 的存储引擎围绕以下目标展开：

- **随机访问优先**：服务向量检索回表、点查、ML 训练随机采样和 selective reads。

- **Arrow-native**：内存交换格式以 Arrow 为核心，便于多语言与查询引擎集成。

- **对象存储友好**：针对 S3 / Azure / GCS / OSS / TOS 等对象存储优化 I/O 粒度、命名与提交协议。

- **版本化与事务**：通过 immutable manifest + MVCC 实现 zero-copy versioning、time travel、ACID commit。

- **数据演进友好**：通过 fragment 内多 data files 支持列级追加、回填和更新，减少整表重写。

- **索引与文件格式解耦**：索引是表层冗余结构，不内嵌到 file format 中，便于独立演进。

## Rust Workspace 中的存储引擎模块

根目录 `AGENTS.md` 对 Rust workspace 的关键 crate 有清晰描述。与存储引擎关系最密切的是：

| Crate | 位置 | 职责 |
| --- | --- | --- |
| `lance` | `rust/lance/` | 主库，提供 `Dataset`、`Scanner`、写入、事务、索引入口、查询计划等 |
| `lance-core` | `rust/lance-core/` | 基础类型、错误、缓存、通用工具 |
| `lance-arrow` | `rust/lance-arrow/` | Apache Arrow 集成层 |
| `lance-table` | `rust/lance-table/` | 表格式对象：`Manifest`、`Fragment`、`DataFile`、commit I/O 等 |
| `lance-file` | `rust/lance-file/` | Lance 文件格式的 reader / writer |
| `lance-encoding` | `rust/lance-encoding/` | 编码、解码、page scheduling、structural encodings |
| `lance-io` | `rust/lance-io/` | ObjectStore 封装、I/O 调度、存储后端 provider |
| `lance-index` | `rust/lance-index/` | scalar / vector / full-text / system index 抽象与实现 |
| `lance-linalg` | `rust/lance-linalg/` | 向量检索所需距离计算与线性代数能力 |
| `lance-namespace` | `rust/lance-namespace/` | catalog / namespace 接口 |

`rust/lance` 是面向用户和绑定层的 orchestration crate；真正的表元数据结构位于 `lance-table`，文件读写位于 `lance-file`，编码与 I/O 调度分别位于 `lance-encoding` 和 `lance-io`。

## Table Format：Manifest 驱动的版本化表结构

官方文档 `docs/src/format/table/index.md` 定义了 Lance Table Format：Lance table 是由 fragments、data files、deletion files、indices 组成的版本化集合；每个版本由一个不可变 manifest 描述。

![](https://images.spumn.eu.cc/cs-knowledge-wiki/storage/vector-database/1781340051401-3314b6ef-a92b-45b6-a0cf-2a82a4855e02-09d9bd464aa991cb.svg)

### Manifest：表版本的单一入口

源码位置：`rust/lance-table/src/format/manifest.rs`。

`Manifest` 记录一个表版本的全部逻辑元数据，核心字段包括：

- `schema: Schema`：表 schema。

- `version: u64`：表版本号。

- `branch: Option<String>`：分支信息。

- `fragments: Arc<Vec<Fragment>>`：该版本的所有 fragments。

- `index_section: Option<usize>`：索引元数据在 manifest 文件中的位置。

- `reader_feature_flags` / `writer_feature_flags`：读写兼容性 feature flags。

- `max_fragment_id`：已分配的最大 fragment id。

- `transaction_file` / `transaction_section`：事务记录位置。

- `next_row_id`：stable row id 的自增计数器。

- `data_storage_format`：data file 使用的存储格式版本。

- `config` / `table_metadata`：配置与用户元数据。

- `base_paths`：多 base path 支持。

Manifest 的核心价值是：**把一个表版本需要的所有逻辑元数据压缩成一个不可变快照**。读者只要定位到某个 manifest，就能稳定读取该版本，不受后续写入影响。

### Fragment：行方向分区

源码位置：`rust/lance-table/src/format/fragment.rs`。

Fragment 是 Lance 的行方向分区：

- 每个 fragment 有唯一 `uint32` id。

- 每个 fragment 包含一个或多个 data files。

- 每个 fragment 最多有一个 deletion file。

- `physical_rows` 记录物理行数，包含已删除行。

这与 Parquet row group 不同。**Lance 的 fragment 是表层概念**，data file 内部不再使用 Parquet 风格 row group。

### DataFile：列方向拆分

`DataFile` 包含：

- `path`：相对 dataset root 的文件路径。

- `fields: Arc<[i32]>`：该 data file 包含的 field ids。

- `column_indices: Arc<[i32]>`：field 到文件内部 column index 的映射。

- `file_major_version` / `file_minor_version`：Lance file format 版本。

- `file_size_bytes`：文件大小缓存。

- `base_id: Option<u32>`：可引用外部 base path。

这个设计使 Lance 表具有二维存储结构：

```
行维度：Dataset → Fragments
列维度：Fragment → DataFiles(fields subset)
```

因此，一个 fragment 内可以有多个 data files，每个 data file 只存部分列。添加列、回填列、更新列不必重写整表。例如新增 embedding 列时，可以为每个已有 fragment 追加一个只包含新字段的 data file，然后更新 manifest。

### DeletionFile：删除向量而非原地删除

删除文件记录某个 fragment 内被删除的本地 row offsets。支持两种格式：

- `.arrow`：Arrow IPC (Inter-Process Communication)，存 flat `Int32Array`，适合 sparse deletions。

- `.bin`：Roaring Bitmap，适合 dense deletions。

删除不会立即重写 data files。读取时 reader 根据 deletion file 过滤掉被删除行。这降低了写放大，也不会破坏历史版本。代价是查询需要额外过滤 deletion vectors；如果后续 materialize deletion / compaction，会改变 row addresses，可能影响索引。

## Dataset Storage Layout：对象存储上的目录组织

官方文档：`docs/src/format/table/layout.md`。

![](https://images.spumn.eu.cc/cs-knowledge-wiki/storage/vector-database/1781340051502-1827cdfc-e2cc-43e3-a0e9-3a9bc32e4f34-cda3ee8a0d1517b6.svg)

标准目录结构如下：

```
{dataset_root}/
    data/
        *.lance
    _versions/
        *.manifest
        latest_version_hint.json
    _transactions/
        *.txn
    _deletions/
        *.arrow
        *.bin
    _indices/
        {UUID}/
            ...
    _refs/
        tags/
            *.json
        branches/
            *.json
    tree/
        {branch_name}/
            ...
```

| 目录 | 职责 |
| --- | --- |
| `data/` | 存储 `.lance` data files |
| `_versions/` | 存储 manifest 文件，每个 manifest 对应一个表版本 |
| `_transactions/` | 存储 transaction files，用于 commit retry 和 conflict detection |
| `_deletions/` | 存储 deletion vector 文件 |
| `_indices/{UUID}/` | 存储 index segment 内容 |
| `_refs/tags/` | tag 元数据 |
| `_refs/branches/` | branch 元数据 |
| `tree/{branch_name}/` | branch dataset，类似 shallow clone |

### Manifest 命名与 latest version discovery

事务文档描述了两种 manifest naming scheme：

- **V1**：`{version}.manifest`

- **V2**：`{u64::MAX - version:020}.manifest`

V2 的目标是让对象存储的 lexicographic listing 能快速找到最新版本。

`_versions/latest_version_hint.json` 是一个优化文件，例如：

```
{"version": 42}
```

它只用于加速 latest-version discovery，不影响正确性，可缺失、可过期、可删除。

### Base Path System：跨存储位置引用

`Manifest.base_paths` 支持 data files、deletion files、index metadata 通过 `base_id` 指向不同的 base path。用途包括：

- hot / cold tiering：近期数据在 hot bucket，历史数据在 cold bucket。

- multi-region distribution：不同 fragment 放在不同 region。

- shallow clone：实验数据集只复制 manifest，新数据写入 clone root，旧数据引用生产数据集。

- dataset portability：相对路径使数据集整体搬迁无需重写文件内容。

这使 Lance 的表格式天然适合对象存储和跨环境迁移。

## Lance File Format：无 Row Group 的列式页容器

官方文档：`docs/src/format/file/index.md`。

Lance file format 是一个列式容器，负责存储单个 data file 的物理字节布局。它有几个显著特点：

1. **没有 Parquet 风格 row group**。

1. **每列有独立数量的 disk pages**。

1. **文件尾部存放 column metadata、offset tables 和 footer**。

1. **page 设计面向随机访问和对象存储 I/O**。

1. **文件层不承担表级事务、索引、统计等职责**。

![](https://images.spumn.eu.cc/cs-knowledge-wiki/storage/vector-database/1781340051568-3ac3a736-79c0-4b08-81ec-06f434031c8d-14b702d88154daac.svg)

### 为什么不使用 Row Group

官方文档对 row group 的批评非常直接：row group 会把列数据切成相同边界，导致两个问题：

- row group 太小：列页变小，云对象存储 I/O 效率差。

- row group 太大：writer 需要缓存整个 row group，内存压力大。

Lance 改用 page-based layout：每列独立切 page；扫描切分可以发生在任意 row boundary；依赖 partial page reads 降低读放大。这对宽表、embedding 列、多模态大对象尤其重要。

### 文件尾部元数据

Lance 文件大致结构：

```
Data Pages / Data Buffers
Column Metadatas
Column Metadata Offset Table
Global Buffers Offset Table
Footer
```

Footer 中包含 column metadata 起始位置、offset tables 位置、global buffer 数量、column 数量、major / minor version 和 magic `LANC`。

读取策略是：从文件尾部读一小段，解析 footer，定位 metadata，再根据投影列和 row ranges 定位所需 pages，最后根据 encoding 进一步缩小 byte ranges。

源码入口：`rust/lance-file/src/reader.rs`。其中 `CachedFileMetadata` 缓存 file schema、column metadatas、column infos、num rows、file buffers、data / metadata / footer bytes 统计和 retained global buffers。

### Writer 侧内存控制

源码：`rust/lance-file/src/writer.rs`。

`FileWriterOptions` 包含 `data_cache_bytes`、`max_page_bytes`、`keep_original_array`、`encoding_strategy`、`format_version` 等。代码中还有 `PageMetadataSpill`，用于将 page metadata 溢写到临时文件，以控制 writer 内存占用。

## Encoding Strategy：结构编码、随机访问与调度解码分离

官方文档：`docs/src/format/file/encoding.md`。源码入口：`rust/lance-encoding/src/decoder.rs`。

Lance 将 container layout 与 encoding strategy 分开。文件容器定义 page、metadata 和 footer；encoding strategy 定义 Arrow arrays 如何被编码进 page。

### 关键术语

- **Data type**：语义类型，主要来自 Arrow type system 的子集。

- **Layout**：array 编码成 buffers 和 child arrays 的方式。

- **Encoding**：语义数据到 layout 的映射。

- **Search cache**：reader 中用于随机访问的 LRU cache，缓存 encoding、page location、dictionary、mini-block metadata 等。

### Structural Encodings

主要结构编码包括：

| Encoding | 适用场景 | 特点 |
| --- | --- | --- |
| Mini Block Page Layout | int、float、bool、小字符串等较小类型 | 默认布局；数据拆为 mini-block；随机访问一个值需要读取整个 mini-block |
| Full Zip Page Layout | embedding 等较大值 | 减少 per-value chunk overhead，适合较大的固定宽度或半固定宽度值 |
| Constant Page Layout | all-null 或 page 内值相同 | 极低存储开销 |
| Blob Page Layout | MiB 级大 binary / image / video | 实际数据 out-of-line，适合惰性加载 |

Nested types 使用 repetition / definition levels 表达 list / struct 的结构信息。这样可以减少多个 Arrow validity / offset buffers 带来的多 IOPS 问题。

### Scheduling 与 Decoding 分离

`rust/lance-encoding/src/decoder.rs` 顶部注释清楚说明：读取分为 **scheduling** 和 **decoding** 两步。

- Scheduling：判断需要哪些数据并发起 I/O 请求。

- Decoding：将已加载 bytes 转为 Arrow arrays。

这种设计支持：

- row-major 的 page 调度，让完整 rows 尽快可解码。

- I/O 与 CPU 解码并行。

- I/O backpressure。

- 对 variable-size list 等间接 I/O 场景进行高优先级 follow-up read。

## Transaction / MVCC：对象存储上的 ACID 提交

官方文档：`docs/src/format/table/transaction.md`。源码入口：

- `rust/lance/src/dataset/transaction.rs`

- `rust/lance-table/src/io/commit.rs`

- `rust/lance/src/io/commit/conflict_resolver.rs`

Lance 使用 **Multi-Version Concurrency Control (MVCC)**：每次 commit 创建一个新的 immutable manifest。所有版本形成 serializable history，支持 time travel、concurrent readers/writers 和 schema evolution。

![](https://images.spumn.eu.cc/cs-knowledge-wiki/storage/vector-database/1781340051635-9b84ae3b-67f5-41e7-97af-0d265177684d-cda9f76dc2bc5823.svg)

### CommitHandler 抽象

源码 `rust/lance-table/src/io/commit.rs` 定义了 `CommitHandler` trait，负责：

- `resolve_latest_location`：解析最新 manifest 位置。

- `resolve_version_location`：解析指定版本 manifest 位置。

- `version_exists`：检查版本是否存在。

- `list_manifest_locations`：列出 manifests。

- `commit` / finalize new version 等提交相关逻辑。

实现包括：

- `RenameCommitHandler`：依赖原子 rename，适合本地等支持 rename-if-not-exists 的文件系统。

- `ConditionalPutCommitHandler`：依赖 put-if-not-exists / conditional PUT，适合部分对象存储。

- `ExternalManifestCommitHandler`：依赖外部 manifest store，例如 DynamoDB，用于 S3 等并发协调场景。

- `UnsafeCommitHandler`：不安全覆盖，主要用于特殊场景。

### Transaction 类型

源码 `rust/lance/src/dataset/transaction.rs` 中 `Transaction` 包含：

- `read_version`：事务基于哪个表版本构建。

- `uuid`：唯一事务 id。

- `operation: Operation`：具体操作。

- `tag`、`transaction_properties` 等。

`Operation` 包括：

- `Append`

- `Delete`

- `Overwrite`

- `CreateIndex`

- `Rewrite`

- `DataReplacement`

- `Merge`

- `Restore`

- `ReserveFragments`

- `Update`

- `Project`

- `UpdateConfig`

- `UpdateMemWalState`

- `Clone`

- `UpdateBases`

### Commit 流程

典型流程：

1. Writer 先写 data files / deletion files / index files，这些文件不可变。

1. 生成 transaction file：`_transactions/{read_version}-{uuid}.txn`。

1. 基于 read manifest + transaction 构建新 manifest。

1. 尝试通过 rename-if-not-exists 或 put-if-not-exists 创建新 manifest。

1. 如果成功，新版本可见。

1. 如果失败，说明有并发 writer 抢先提交：读取竞争事务，进行 conflict detection 和 rebase。

### 冲突分类

Lance 将冲突分为三类：

| 类型 | 含义 | 示例 |
| --- | --- | --- |
| Rebasable | commit layer 可以自动变换 transaction 并重试 | 两个 Delete 删除同 fragment 不同行，可合并 deletion vectors |
| Retryable | 无法自动 rebase，但应用层重新基于最新版本重试可能成功 | Update 遇到 concurrent Rewrite |
| Incompatible | 语义上不可安全重试 | Delete 遇到 Restore，目标行语义可能已改变 |

Append 是最高频操作，设计上与多数操作兼容，以支持多 writer 并发 append。Delete / Update / Rewrite 由于会修改或替换现有 fragments，冲突面更大。

## Dataset 与 Scanner：读路径的编排层

源码入口：

- `rust/lance/src/dataset.rs`

- `rust/lance/src/dataset/scanner.rs`

`Dataset` 是用户层操作的核心对象。源码中的 `Dataset` 结构包含：

- `object_store: Arc<ObjectStore>`：主 object store。

- `commit_handler: Arc<dyn CommitHandler>`：提交协调器。

- `uri` / `base`：dataset 路径。

- `manifest: Arc<Manifest>`：当前版本 manifest。

- `manifest_location`：manifest 位置。

- `session: Arc<Session>`：共享 session/cache。

- `refs: Refs`：tags / branches。

- `fragment_bitmap: Arc<RoaringBitmap>`：当前版本 fragment id bitmap。

- `index_cache` / `metadata_cache`：索引和元数据缓存。

- `file_reader_options`、`store_params`、`base_store_params` 等。

`Scanner` 则是读取计划的 builder / executor。源码中的 `Scanner` 包含：

- projection plan

- filter

- full text query

- nearest vector query

- ordering

- limit / offset

- batch size / readahead / IO buffer size

- scalar index 使用开关

- stats 使用开关

- 指定 fragments / index segments

- fast search / include deleted rows

- file reader options

- aggregate

- target parallelism

### 读取流程概览

1. `Dataset::open` 定位最新或指定版本 manifest。

1. 读取 manifest，构建 fragments、schema、feature flags、index section 指针等元数据。

1. 用户通过 `dataset.scan()` 创建 `Scanner`。

1. `Scanner` 设置 projection、filter、nearest、full_text_search、limit 等。

1. Planner 判断是否使用 scalar / vector / full-text index。

1. 如果索引可用，先走 index search，得到 row addresses / scores。

1. 对未被索引覆盖的 fragments，生成 direct scan subplan。

1. FragmentReader 根据 field ids 找 data files，并读取 deletion vectors。

1. Lance file reader 读取 footer / column metadata，定位 pages。

1. `lance-io` 的 scheduler 发起 byte range reads。

1. `lance-encoding` 解码成 Arrow arrays，最终输出 `RecordBatchStream`。

![](https://images.spumn.eu.cc/cs-knowledge-wiki/storage/vector-database/1781340051700-592a233f-b8d2-4caf-b1b3-33a25b943405-9e40f908003760ed.svg)

### 读取路径中的几个关键优化

- **打开表不加载索引内容**：manifest 只记录 index metadata；索引按需加载。

- **metadata / index cache**：Dataset 通过 session 管理缓存。

- **fragment bitmap**：快速判断哪些 fragments 存在以及索引覆盖情况。

- **deletion vectors 后过滤**：索引中可能包含已删除行，读取结果再过滤。

- **indexed + unindexed split**：索引可以部分覆盖 fragments，未覆盖部分直接扫描。

- **I/O scheduling 与 decoding 解耦**：提升对象存储并发读与 CPU 解码利用率。

## 写入路径：从 Arrow RecordBatch 到新 Manifest

源码入口：

- `rust/lance/src/dataset/write.rs`

- `rust/lance/src/dataset/write/insert.rs`

- `rust/lance/src/dataset/write/commit.rs`

- `rust/lance/src/dataset/fragment/write.rs`

典型写入接口是 `Dataset::write` 或 `InsertBuilder`。`WriteMode` 包括：

- `Create`

- `Append`

- `Overwrite`

`WriteParams` 控制：

- `max_rows_per_file`

- `max_rows_per_group`

- `max_bytes_per_file`

- `mode`

- `commit_handler`

- `data_storage_version`

- `enable_stable_row_ids`

- `enable_v2_manifest_paths`

- 以及其他写入配置。

### 写入分两阶段

Lance 写入本质上分为两阶段：

1. **数据文件阶段**：先将 Arrow batches 编码并写为 `.lance` data files，生成 fragments / data file metadata。此阶段写出的文件还没有成为新表版本的一部分。

1. **元数据提交阶段**：构造 transaction，通过 commit handler 原子写入新 manifest。只有 manifest commit 成功，新版本才可见。

这和很多 lakehouse format 类似：数据文件不可变，元数据提交决定可见性。

### InsertBuilder 与 uncommitted transactions

`InsertBuilder::execute_uncommitted` 可以写入数据但不提交，返回 `Transaction`。`CommitBuilder` 可以组合多个 uncommitted transactions，再统一提交。这为分布式写入、批量写入、两阶段协调提供了基础。

### Fragment ID 与 Row ID 分配

Append transaction 中 fragments 在事务创建时还未分配最终 fragment ids。最终 id 在 manifest construction 阶段根据当前 manifest 的 `max_fragment_id` 分配。

如果启用 stable row ids，新写入行会根据 manifest 的 `next_row_id` 顺序分配。如果 commit 失败并 rebase，需要基于最新 manifest 重新分配 row ids，保证全局唯一。

## Index Formats：表层冗余结构，而不是文件内置能力

官方文档：`docs/src/format/index/index.md`。源码入口：`rust/lance-index/src/lib.rs`。

Lance 将索引设计为独立于 file format 的冗余结构。`Index` trait 提供：

- `statistics`

- `prewarm`

- `index_type`

- `calculate_included_frags`

- `as_vector_index` 等。

`IndexType` 包括：

- Scalar / BTree / Bitmap / LabelList / Inverted / NGram / ZoneMap / BloomFilter / RTree / FM

- FragmentReuse / MemWal 等 system indices

- Vector / `IVF_FLAT` / `IVF_SQ` / `IVF_PQ` / `IVF_HNSW_*` / `IVF_RQ` 等 vector indices

### Index Metadata 与 Segment

一个 Lance index 由多个 index segments 组成。每个 segment 有独立 UUID，覆盖一组 disjoint fragments。manifest 的 `IndexSection` 中记录 `IndexMetadata`：

- `uuid`

- `name`

- `fields`

- `fragment_bitmap`

- `index_details`

- `version`

索引内容存储在 `_indices/{UUID}/`。具体文件由索引类型决定，常见情况下也复用 Lance file format 存储索引数据结构。

### 索引可以部分覆盖

Lance 不要求索引覆盖所有 fragments。若一个 index segment 只覆盖 fragments 0 和 1，而 fragment 2 未覆盖，查询计划可以：

1. 对 fragments 0/1 使用 index。

1. 对 fragment 2 直接扫描。

1. 合并结果。

这降低了索引维护门槛，也使 append 与 create index 更容易并发兼容。新增 fragments 可以暂时保持 unindexed。

### 删除、更新与索引一致性

索引文件不可变，因此索引中可能引用已删除或已更新的旧 row addresses。查询执行时需要过滤：

- fragment 有 deletion file：过滤已删除 row offsets。

- fragment 已整体删除：过滤缺失 fragment。

- indexed column 被原地更新：通过 fragment bitmap / invalidation 过滤无效 row addresses。

Compaction / Rewrite 会改变 row addresses，有三种处理方式：

1. 不处理，让索引不再覆盖相关 fragments。

1. 立即重写索引 segment。

1. 使用 Fragment Reuse Index 将旧 row addresses 映射到新 row addresses。

Stable row ids 是另一条方向：让索引使用逻辑 row id 而不是物理 row address，以降低 compaction 对索引的影响。

## Row Address、Stable Row ID 与 Lineage

官方文档：`docs/src/format/table/row_id_lineage.md`。

Lance 有两类行标识：

- **Row address**：物理位置。

- **Row ID**：逻辑标识；启用 stable row IDs 时，在逻辑行生命周期内保持不变。

Row address 是 64-bit：

```
row_address = (fragment_id << 32) | local_row_offset
```

这使得给定 row address 后，可以通过位运算快速得到 fragment id 和 fragment 内 offset，非常适合随机访问和索引回表。

但 row address 会在 compaction / update 后变化。因此 stable row id 用 manifest 中的 `next_row_id` 自增分配，为逻辑行提供稳定标识。更新时新物理行保留原 `_rowid`，旧物理行通过 deletion vector tombstone。

## lance-io：对象存储抽象与 I/O 调度

源码入口：

- `rust/lance-io/src/object_store.rs`

- `rust/lance-io/src/scheduler.rs`

`ObjectStore` 封装底层 `object_store::ObjectStore`，字段包括：

- `inner`

- `scheme`

- `block_size`

- `max_iop_size`

- `use_constant_size_upload_parts`

- `list_is_lexically_ordered`

- `io_parallelism`

- `download_retry_count`

- `io_tracker`

- `store_prefix`

Provider 覆盖本地、内存、AWS、Azure、GCP、OSS、TOS、Tencent、HuggingFace、GooseFS 等后端。

`ScanScheduler` 负责并发 I/O、优先级和背压。`scheduler.rs` 中有全局 `IOPS_COUNTER` 和 `BYTES_READ_COUNTER`，并通过 `IoQueueState` 管理：

- `iops_avail`

- `bytes_avail`

- `pending_requests`

- `priorities_in_flight`

- `done_scheduling`

- `no_backpressure`

这说明 Lance 并不是简单地发起对象存储 read，而是把 page-level / byte-range read 纳入统一调度，以适配高延迟、高吞吐的对象存储环境。

## MemWAL：面向流式写入的实验性 LSM 架构

官方文档：`docs/src/format/table/mem_wal.md`。

MemWAL 是实验性规范，目标是让 Lance 支持高吞吐流式写入，同时保持 scan、point lookup、vector search、full-text search 的索引化读取能力。

核心结构：

- **Base table**：普通 Lance table。

- **MemWAL shards**：水平扩展写入的单元，每个 shard 任一时刻只有一个 active writer。

- **MemTable**：内存中积累写入，概念上是一组 Arrow record batches。

- **WAL**：持久化 MemTable 写入，使用 Arrow IPC stream 文件。

- **Flushed MemTable**：flush 到存储后的 MemTable，必须是一个 Lance table。

- **MemWAL Index**：base table 上的 singleton system index，记录配置、merge progress、index catchup progress、shard snapshots。

MemWAL 本质上把 Lance table 放入一个 LSM-like 架构中：写入先进入 shard 的 MemTable/WAL，再异步 merge 到 base table。对有主键的表，要求同一 primary key 必须映射到唯一 shard，以保证 last-write-wins 语义。

## 总结：Lance 存储引擎的核心架构思想

Lance 的核心不是单一文件格式，而是一个面向 AI/多模态 workload 的分层存储系统：

1. **File layer**：用无 row group 的 page-based columnar container 提供高效随机访问。

1. **Encoding layer**：用 mini-block、full-zip、blob 等结构编码平衡压缩、随机访问和大对象存储。

1. **Table layer**：用 immutable manifest 管理版本、schema、fragments、deletions、indices 和 base paths。

1. **Transaction layer**：用 MVCC + optimistic concurrency + object-store atomic primitives 实现 ACID commit。

1. **Index layer**：将 scalar / vector / full-text / system indices 作为表层可独立演进的冗余结构。

1. **I/O layer**：通过统一 ObjectStore 和 ScanScheduler 适配云对象存储，并控制并发、优先级、背压。

1. **API / binding layer**：Rust core 之上提供 Python/Java 和 Arrow/DataFusion 生态集成。

一句话概括：**Lance 把“随机访问友好的列式文件”、“版本化表元数据”和“可部分覆盖的独立索引”组合起来，形成了一个特别适合 embedding、多模态数据和 ML 迭代场景的 lakehouse 存储引擎。**
