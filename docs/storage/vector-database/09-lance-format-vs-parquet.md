---
source: https://www.yuque.com/yangguangfanxing/nmhuv1/hxboo5fhcgt5sx6d
---

# Lance Format vs Parquet 列式格式

> 原文链接：[https://www.yuque.com/yangguangfanxing/nmhuv1/hxboo5fhcgt5sx6d](https://www.yuque.com/yangguangfanxing/nmhuv1/hxboo5fhcgt5sx6d)

学习笔记：向量数据库存储格式对比

# Parquet：经典列式存储

**定位**：为 OLAP 大数据分析设计（Hadoop/Spark 生态出身，2013 年）。

### 核心特点

- **列式存储**：同一列的数据连续存放，扫描少数列时 IO 极少。

- **Row Group（行组）**：把表按行切成多个块，每块内部再按列存。

- **重压缩**：Snappy / Zstd / Gzip，压缩比高，适合**冷数据**。

- **不可变**：写完即只读，更新只能"重写整个文件"。

- **顺序扫描友好**：典型场景是 `SELECT col1, col2 FROM t WHERE ...` 全表扫一遍。

![](https://images.spumn.eu.cc/cs-knowledge-wiki/storage/vector-database/1781146973736-5718eb60-3f6f-45e2-b76d-5dd866a0d366-dd6f7f66da1dc605.png)

### 用在向量场景的痛点

| 痛点 | 说明 |
| --- | --- |
| 随机点查慢 | 取第 N 条向量要先读整个 Row Group 解压，IO 放大严重 |
| 不支持索引 | 没有原生向量索引（IVF/HNSW），ANN 查询要全扫 |
| 更新昂贵 | 增删改一条向量 = 重写整个文件 |
| Schema 演进弱 | 新增/修改列代价高，不利于迭代 embedding 模型 |
| 多版本管理无 | 没有时间旅行、没有 ACID 事务 |

# Apache Arrow 详解

Apache Arrow 是一个跨语言的**列式内存数据格式**规范，目标是让不同系统（Spark / Pandas / DuckDB / Polars / Lance / Flight RPC …）之间交换数据能做到**零拷贝（zero-cop**y）——数据不需要反复 serialize → deserialize，**大家对着同一块内存按同一套规则解读就行。**

一句话：**Arrow = 列式数据的"内存 ABI 标准"**。

## Arrow 的核心理念

| 原则 | 说明 |
| --- | --- |
| **列式布局** | 每一列单独连续存放，利于 SIMD、缓存局部性、压缩、谓词下推 |
| **零拷贝共享** | 内存布局明确且对齐，跨进程/跨语言通过共享内存或 IPC 句柄直接 read，不 parse |
| **平摊式二进制布局** | 用 **FlatBuffers** 描述 Schema 元数据；真实数据存裸 buffer，无额外对象开销 |
| **类型系统统一** | Primitive / String / Binary / Struct / List / Map / FixedSizeList / Decimal / Temporal 等全部精确定义 |

逻辑结构:

![](https://images.spumn.eu.cc/cs-knowledge-wiki/storage/vector-database/1781149612196-08e66f22-179e-4bba-bcca-3bb548450b49-dc2af7580c780b71.svg)

**Arrow 不"存储"数据到磁盘（虽然也有 Arrow IPC 文件 / 可内存映射），它的真正价值是定义了一组*****如何在内存中平坦地、列式地、可零拷贝地表示一个表*****的规则。** Lance Format 正是把这套内存规则"落盘成持久文件"的一个典型继承者。

## Arrow 内存格式的核心抽象（自顶向下）

![](https://images.spumn.eu.cc/cs-knowledge-wiki/storage/vector-database/1781148710019-9cff6272-97df-49a3-8bcc-d88939f0e901-7b34e9ede6287fa0.png)

一个 Array（列）的物理构成：

**Arrow Array = 长度(n) + null计数 + [validity bitmap buffer] + [数据 buffer(s)] + offset**

## 关键格式示意图 — 物理内存布局

下面用两张图分别说明 **定长类型**（如 `Int64`）和 **变长类型**（如 `Utf8/String`）的布局：

图 ①：定长原始类型 `Int64`列 —— `[10, NULL, 30, 40]`(n=4)

```
═══════════════════════════════════════════════════════
 SCHEMA METADATA（FlatBuffers）
   fields: [{name:"val", type:INT64, nullable:true}]
───────────────────────────────────────────────────────
 ARRAY DESCRIPTOR
   length = 4       null_count = 1      offset = 0
───────────────────────────────────────────────────────
 BUFFER 0 — Validity Bitmap（1 bit / element, 按 64-bit 对齐）
   第0位=1✓   第1位=0✗(NULL)   第2位=1✓   第3位=1✓
   内存字节: 0b1101 = 0x0D  → padded to 8 bytes
   ┌──────────────────────────┐
   │ 00001101 00000000 ...    │  ← bitmap buffer (64-bit aligned)
   └──────────────────────────┘

 BUFFER 1 — Data Buffer（8 bytes × 4 = 32 bytes, 连续平坦）
   ┌──────────┬──────────┬──────────┬──────────┐
   │ 10       │ (ignored)│ 30       │ 40       │
   │ 08000000 │ xxxxxxxx │ 1E000000 │ 28000000 │  ← little-endian i64
   └──────────┴──────────┴──────────┴──────────┘
   ↑          ↑ NULL位→此槽未定义/跳过        ↑
   index=0    index=1                    index=3
═══════════════════════════════════════════════════════
```

关键点：**NULL 不占"特殊值"坑位**，NULL 只记录在 bitmap 里，data buffer 那个位置可以留任意值（通常干脆不写）。

图 ②：变长类型 `Utf8`列 —— `["cat", NULL, "dog", "bird"]`(n=4)

变长类型的精妙之处在于 **offset buffer + data buffer** 两段式：

```
═════════════════════════════════════════════════════════════════
 BUFFER 0 — Validity Bitmap
   1101 → 同前，index 1 为 NULL
   ┌─────────────────────┐
   │ 00001101 00...      │  (8 bytes aligned)
   └─────────────────────┘

 BUFFER 1 — Offset Buffer（int32 × (n+1) = 5 × 4 = 20 bytes）
   表示每段值在 Data Buffer 中的起始偏移
   ┌────────┬────────┬────────┬────────┬────────┐
   │ off[0] │ off[1] │ off[2] │ off[3] │ off[4] │
   │   0    │   3    │   3!   │   6    │   10   │
   └────────┴────────┴────────┴────────┴────────┘
     ↑ cat=3B   ↑NULL:off不变   ↑dog=3B   ↑bird=4B
                 ↑ off[2]==off[3] ⇒ 长度为0 ⇒ NULL一致

 BUFFER 2 — Data Buffer（concat 所有非NULL值的 UTF-8 字节流）
   ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
   │ 'c' │ 'a' │ 't' │ 'd' │ 'o' │ 'g' │ 'b' │ 'i' │ 'r' │ 'd' │
   │ 63  │ 61  │ 74  │ 64  │ 6F  │ 67  │ 62  │ 69  │ 72  │ 64  │
   ├─────┴─────┴─────┴─────┼─────┴─────┴─────┼─────┴─────┴─────┤
   │  bytes[0..3)  ="cat"  │ bytes[3..6)="dog"│ bytes[6..10)="bird"│
   └───────────────────────┴──────────────────┴──────────────────┘
═════════════════════════════════════════════════════════════════
```

读取第 `i` 个值时：若 `bitmap[i]=1` → 从 `data[offset[i] .. offset[i+1]]`截一段即可。**全程无指针追逐，无 per-cell 对象分配。**

## Arrow 在生态里的位置

![](https://images.spumn.eu.cc/cs-knowledge-wiki/storage/vector-database/1781149816036-31dadc60-cbcf-4953-bc81-3d1844d2e94f-8f9e978a4fbc8663.png)

- **没有 Arrow 之前**：每两个系统之间都要 serialize（row-based JSON/Thrift/Protobuf 或 row-major tuple）→ 浪费 CPU 和内存
- **有了 Arrow**：大家都认同一套列式内存 ABI → **指针传过去就能用**，跨语言靠 C Data Interface（struct 指针 + schema）

# Lance：为 AI/向量检索而生的现代列式格式

[Lance format](https://docs.lancedb.com/lance)

**定位**：LanceDB 的底层存储格式，由 Eto Labs 开源，目标是"取代 Parquet 在 ML/AI 工作负载下的角色"。

Arrow  → 内存列存标准（IPC / Flight），偏内存/传输层

Lance  → 把 Arrow 的列存语义"落盘"成一种为向量+元数据搜索优化的格式

### 核心特点

- **列式 + 二级索引**：保留列式优点的同时，原生支持向量索引（IVF_PQ、HNSW）、标量索引（BTree、Bitmap、Inverted）。

- **Fragment（片段）机制**：数据切成多个 fragment，每个 fragment 内部按列存，但提供 **行级随机访问** —— ![](https://images.spumn.eu.cc/cs-knowledge-wiki/storage/vector-database/a2006f1ac61cb1902beacb3e29fff089-1e9f60b48e6e4244.svg) 拿到任意一行（含整条向量）比 Parquet 快 ~100×。

- **Zero-copy versioning（零拷贝版本控制）**：每次写操作产生新版本，只追加 manifest，不重写数据。支持 **时间旅行**（回到任意历史版本）。

- **支持 upsert / delete / append**：增量更新友好，符合 ML 数据持续迭代的需求。

- **Schema 演进无痛**：加列、删列只改 manifest，O(1) 完成。

- **基于 Arrow**：内存模型与 PyArrow / Polars / DuckDB 直接互通，无序列化开销。

- **流式写入与扫描**：天然支持训练时的大批量数据 loader 场景。

![](https://images.spumn.eu.cc/cs-knowledge-wiki/storage/vector-database/1781147465995-f117e454-b6a7-415e-8169-d09a8f721f8d-e2905b21b05dd20c.png)

# 横向对比表

| 维度 | Parquet | Lance |
| --- | --- | --- |
| **诞生年代 / 定位** | 2013，大数据 OLAP | 2022，AI/向量/多模态 |
| **存储模型** | 列式 + Row Group | 列式 + Fragment |
| **随机点查（按 id 取一行）** | 慢（需解压整个 Row Group） | 快（![](https://images.spumn.eu.cc/cs-knowledge-wiki/storage/vector-database/a2006f1ac61cb1902beacb3e29fff089-1e9f60b48e6e4244.svg)，比 Parquet 快 ~100×） |
| **向量索引** | 无 | 原生 IVF_PQ / HNSW |
| **标量索引** | 无（仅 min/max 统计） | BTree / Bitmap / Inverted |
| **更新 / 删除** | 重写整个文件 | 增量 fragment + tombstone |
| **版本管理** | 无 | 零拷贝多版本 + 时间旅行 |
| **Schema 演进** | 代价高 | ![](https://images.spumn.eu.cc/cs-knowledge-wiki/storage/vector-database/a2006f1ac61cb1902beacb3e29fff089-1e9f60b48e6e4244.svg) 元数据更新 |
| **压缩比** | 高（更适合冷数据归档） | 中等（牺牲一点换随机访问） |
| **典型读模式** | 全表 / 大批扫描 | 点查 + 范围扫描 + ANN |
| **生态** | Hadoop / Spark / Hive / Presto | LanceDB / PyArrow / DuckDB / PyTorch |
| **适用场景** | 数仓、BI、批分析 | 向量检索、训练数据集、特征存储、多模态 |

# 选型建议

- **Parquet**：为"扫一大堆行的几列"优化 → 数仓之王，但向量场景下又慢又笨。
- **Lance**：为"随机取整行 + 向量索引 + 频繁更新 + 多版本"优化 → AI/向量数据库时代的 Parquet 接班人。

| 你的场景 | 选 |
| --- | --- |
| 批处理报表、离线数仓 | Parquet |
| 一次写、永远只读的归档 | Parquet |
| 向量检索（RAG / 推荐 / 搜索） | **Lance** |
| ML 训练集，频繁增删改 / 多版本实验 | **Lance** |
| 需要时间旅行、Schema 频繁演进 | **Lance** |
| 与 PyTorch / Arrow / DuckDB 深度集成 | **Lance** |
