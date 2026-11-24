---
title: "LSM-Tree Compaction 策略全景：从 Leveled 到 Universal、FIFO 与工业界变体"
order: 2
description: "深入解析 LSM-Tree 中的各类 Compaction 策略，包括 RocksDB/LevelDB/Cassandra/HBase 的实现差异与权衡"
date: 2026-07-22
---
# 前言

在上一篇 [LSM Tree：高性能海量数据写数据结构](/storage/storage-basics/lsm-tree/) 中，我们介绍了 LSM-Tree 的基本思想：利用内存 MemTable 缓冲增量写入，再批量顺序刷到磁盘形成不可变 SSTable，用「追加写 + 后台合并」换取极致的写吞吐。但 LSM 之所以能长期工作而不变成一堆越积越多的小文件，核心就在于 **Compaction（压缩 / 合并）**——它是 LSM 的"垃圾回收器"，负责回收过期版本、删除墓碑（tombstone）、控制读放大和空间放大。

Compaction 的本质可以概括为三个问题：**何时合并（when）、选哪些文件合并（which）、合并到哪里（how）**。不同的数据库对这三个问题给出了不同答案，形成了各具特色的策略族。本文以 RocksDB 为主线，结合 LevelDB、Cassandra、HBase、ScyllaDB 等系统，系统梳理 LSM-Tree 中各类 Compaction 策略的原理、触发条件、优缺点与适用场景。

## 为什么需要 Compaction
在进入具体策略之前，先回顾 Compaction 要解决的三类"放大"问题，这也是后面所有权衡的基准：

| 放大类型                               | 定义                                                         | 直观含义                           |
| -------------------------------------- | ------------------------------------------------------------ | ---------------------------------- |
| **写放大 (Write Amplification, WA)**   | 实际写入磁盘字节数 / 用户写入字节数                          | 同一个 key 被反复重写的次数        |
| **读放大 (Read Amplification, RA)**    | <font style="color:#ED740C;">一次点查需要访问的 SSTable 数量</font> | 读路径上需要二分查找的文件数       |
| **空间放大 (Space Amplification, SA)** | 磁盘实际占用 / 数据有效大小                                  | 过期数据、tombstone 占用的额外空间 |


LSM 的经典 **"三难困境 (trilemma)"** 指出：没有任何一种策略能同时把 WA、RA、SA 都做到最低——你只能在三角形中选一个靠近的顶点。Compaction 策略的本质，就是在这三者之间做工程上的权衡。

Compaction 的主要作用：

1. **垃圾回收**：清除被覆盖的旧版本和带删除标记的 tombstone；
2. **降低读放大**：减少 SSTable 数量，保持每层 key range 不重叠；
3. **降低空间放大**：回收过期数据占用的磁盘空间；
4. **优化数据局部性**：<font style="color:#ED740C;">让冷热数据自然分层，热数据留在上层</font>。

## Compaction 的基本分类
从 LSM 理论与工业实践来看，主流策略可以归为几大类：

```plain
LSM Compaction
├── Leveled Compaction (LCS / Leveling)        — LevelDB / RocksDB 默认
├── Tiered Compaction (STCS / Tiering)         — Cassandra 默认 / Universal 基础
├── Universal Compaction (UCS)                 — RocksDB "智能 Tiered"
├── FIFO Compaction                            — RocksDB 时序/缓存专用
├── Hybrid / Leveled-N / Tiered+Leveled        — RocksDB 混合模式
└── 工业界变体
    ├── Time-Window Compaction (TWCS)          — Cassandra 时序
    ├── Incremental Compaction (IC)            — ScyllaDB
    ├── Unified Compaction Strategy (UCS)      — Cassandra 5.0+
    └── Date-Tiered Compaction (DTCS)          — HBase / Cassandra 旧版
```

下面逐一展开。

## Leveled Compaction（分层压缩）
**代表系统**：LevelDB、RocksDB（默认）、HBase、ScyllaDB LCS

Leveled 是目前最广泛使用的策略，也是 RocksDB 的默认方式，直接源自 LevelDB 的设计。

### 1.1 核心结构
Leveled 将磁盘 SSTable 分为多层（通常 L0 ~ L6，共 7 层），<font style="color:#DF2A3F;">每个层有明确的目标大小</font>：

```bash
L0:    最多 4 个 SST（可重叠，由 flush 产生）
L1:    max_bytes_for_level_base（默认 ~256MB）
L2:    L1 × max_bytes_for_level_multiplier（默认 10 倍，~2.5GB）
L3:    ~25GB
L4:    ~250GB
...
L_n:   大小 = L_{n-1} × multiplier（默认 10）
```

关键特性：

+ **L0 特殊**：L0 由 MemTable flush 产生，SSTable 之间的 key range **允许重叠**；
+ **L1 及以上**：同一层内所有 SSTable 的 key range **互不重叠**（non-overlapping），**<font style="color:#DF2A3F;">整层构成一个有序 run</font>**；
+ **Fanout（扇出）**：<font style="color:#D22D8D;">相邻两层大小之比</font>，默认 10。Fanout 相同时写放大最优。

**Sorted run** = 一组 SST 文件，它们合起来**覆盖某个连续 key range 且内部互不重叠**，整体有序。

把一个 run 想象成"一个逻辑上已排好序的大文件"——它物理上被切成多个 SST，但这些 SST 的 key range **不重叠、无缝拼接**，读时只需二分找到其中一个 SST：

```plain
Level 2（1 个 run）:
  [a..c] [d..f] [g..i] [j..l] [m..o] [p..r] [s..u] [v..z]
   └────────────── 这 8 个 SST 拼起来就是 1 个 sorted run ──────────────┘
   key 范围不重叠，整体有序，一个 key 在这层最多出现 1 次
```

在标准 Leveled 里

+ **L0**：多个 run（每个 flush 产生的 SST 就是一个独立 run，互相重叠）
+ **L1 及以上**：每层恰好 **1 个 run**——整层的 SST 互不重叠，拼起来覆盖全 key space

这就是标准 Leveled 读放很低的原因：点查时在每层（L1+）最多查 1 个 SST。

### 1.2 触发条件
RocksDB 周期性为每一层计算 **score**，<font style="color:#DF2A3F;">选择 score 最大的层合并</font>：

+ **L0**：`score = <font style="color:#DF2A3F;">max(file_num / level0_file_num_compaction_trigger, total_size / max_bytes_for_level_base)</font>`，默认 `level0_file_num_compaction_trigger = 4`；
+ **非 L0**：`score = current_level_size / target_level_size`。
+ L0 具有最高优先级。

其它触发因素：

+ 单个文件大小超过 `target_file_size_base`（默认 64MB）会被切分；
+ `soft_pending_compaction_bytes_limit` / `hard_pending_compaction_bytes_limit` 控制待压缩 backlog；
+ L0 文件间 range 重叠导致的 "compaction debt"。

### 1.3 合并过程
以 L1 → L2 为例：

```plain
L1:  [a........m] [n........z]       ← 选中 [a..m] 文件
L2:  [a..c][d..f][g..i][j..l][m..o][p..r][s..u][v..z]
                       ↓ 合并重叠的 4 个 L2 文件
L2:  [a'..c'][d'..f'][g'..i'][j'..l'][m..o][p..r][s..u][v..z]
```

步骤：

1. <font style="color:rgb(0, 0, 0);">从 Ln 选出 SST，</font><font style="color:#DF2A3F;">找出 Ln+1 中 key range 重叠的文件</font><font style="color:rgb(0, 0, 0);">；</font>
2. <font style="color:rgb(0, 0, 0);">多路归并，对同一 key 按 seq 降序排列；</font>
3. <font style="color:rgb(0, 0, 0);">按上表裁决每个版本：</font>
    - <font style="color:rgb(0, 0, 0);">保留最新版本（若它是 tombstone 且满足"下面无更老版本 + 快照不阻碍"，则连它一起丢，整个 key 消失）；</font>
    - <font style="color:rgb(0, 0, 0);">保留对某个快照可见的旧版本；</font>
    - <font style="color:rgb(0, 0, 0);">其余旧版本丢弃；</font>
    - <font style="color:rgb(0, 0, 0);">tombstone 在非满足条件时，作为普通记录原样写入输出；</font>
4. <font style="color:rgb(0, 0, 0);">输出到 Ln+1，按 target size 切分，删除输入文件。</font>

L0 → L1 特殊：L0 文件互相重叠，通常需把 L0 中 **所有重叠的 SST** 一起与 L1 重叠部分合并。

### 1.4 Subcompaction 并行化
大文件合并可能成为瓶颈。RocksDB 支持 **Subcompaction**：<font style="color:#D22D8D;">把一个大 compaction 按 key range 切成多段</font>，每段由后台线程池的独立线程并行归并，显著降低尾延迟。L0 → L1 默认关闭，但可开启 subcompaction-based parallelization。

### 1.5 优缺点
| 维度         | 表现                                                         |
| ------------ | ------------------------------------------------------------ |
| **写放大**   | **较高**（典型 <font style="color:#DF2A3F;">10~30</font> 倍）。一个 key 从 L0 到 L6 可能被重写 6 次以上；fanout 越大 WA 越小但 RA 越大 |
| **读放大**   | **很低**。点查每层最多查 1 个 SST（L0 除外），加 Bloom Filter 往往只需 1~2 次 IO |
| **空间放大** | **最低**（~1.1 倍）。过期数据在下一次合并时即被回收          |
| **临时空间** | 合并只需 ~10% 额外临时空间                                   |
| **适用场景** | 通用 KV、读多写少、对存储空间敏感、SSD                       |


### 1.6 Leveled-N（LCS 的优化变体）
RocksDB 支持 **Leveled-N** 模式：允许每层有 **N 个有序 run** 而非 1 个，相当于在 leveling 和 tiering 之间插值：

+ 合并时把 Ln-1 的所有 run 与 Ln 的 1 个 run 合并；
+ 通过调整最大层 run 数量 K 和 size ratio T，平衡 WA/RA/SA；
+ 学术上对应 Dostoevsky 提出的 **Lazy Leveling**。

Leveled-N 里的"N 个 run"是什么意思？

就是允许 **L1+ 某层同时存在 N 个互不重叠的 sorted run**，而不是只有 1 个：

```plain
Level 2（N=2，即 2 个 run）:
  Run A: [a..e] [f..z]           ← 由上一次 compaction 产出
  Run B: [b..g] [h..n] [o..z]    ← 又一次从 L1 flush/compact 下来，range 可能与 Run A 重叠
```

+ 同一层内，**run 之间的 key range 可以重叠**（run A 和 run B 都含 `c`）；
+ 但**同一个 run 内部**，SST 还是互不重叠的；
+ 读路径上点查就需要在这层查最多 N 个 SST（每个 run 查一个），所以 RA 上升；
+ 但好处是：新数据下来时不必立即把整层和旧 run 全合并，可以"攒"几个 run 再合，从而 **降低写放大**。

Tiering vs Leveling 的本质区别

| 模式                          | 每层 run 数             | WA   | RA   |
| ----------------------------- | ----------------------- | ---- | ---- |
| **Leveling**（标准 Leveled）  | 1（L1+）                | 高   | 低   |
| **Tiering**（纯 Tiered）      | T 个（很多）            | 低   | 高   |
| **Leveled-N / Lazy Leveling** | K 个（1 < K < T，可调） | 中   | 中   |


所以 **run 就是"LSM 世界里的一个排序版本"**——Leveled-N 就是在每层多保留几个排序版本（相当于几个"时间快照"叠在一起），用增加读放换取降低写放，本质是 leveling 和 tiering 之间的一个连续可调旋钮。

---

## Tiered Compaction（大小分层压缩）
**代表系统**：Apache Cassandra（默认 STCS）、HBase（早期）、BigTable 论文原型

Tiered <font style="color:#DF2A3F;">是写优化场景的经典选择，在 RocksDB 中对应 Universal Compaction 的基础形态</font>。

STCS = Size-Tiered Compaction Strategy（大小分层压缩策略）

### 2.1 核心概念
和 Leveled 最根本的区别是：**Tiered 没有 L0/L1/L2 这样的编号层**。磁盘上就是一堆 SST 文件，按文件大小归入若干 **bucket（桶）**——同一个桶里的文件大小相近，每个桶相当于一个"大小档位"。

关键事实：

+ 任意两个文件（无论在哪个桶）**key range 都可以互相重叠**；
+ 同桶内的 SST 大小相差不超过一定比例（Cassandra 默认 `bucket_low=0.5, bucket_high=1.5`，即大小相差不超过 50%）；
+ 当某个桶里的文件数 ≥ `min_threshold`（默认 **4**）时，触发一次合并，把这 4 个文件归并成一个约 4 倍大的新 SST，新文件自动落入下一个更大的桶。

### 2.2 完整时间线示例（N=4，每次 flush 产生 10MB）
（1）空库启动，MemTable 刷出第一个 10MB：

```plain
桶 10MB:  [10MB₁]
桶 40MB:  (空)
桶 160MB: (空)
```

（2）继续写入，又 flush 了 3 个 10MB：

```plain
桶 10MB:  [10MB₁] [10MB₂] [10MB₃] [10MB₄]   ← 达到 4 个，触发合并
桶 40MB:  (空)
```

（3）**合并 #1**：把 4 个 10MB 多路归并 → 1 个 ~40MB 的新文件。旧的 4 个删除，新文件进入 40MB 桶：

```plain
桶 10MB:  (空)
桶 40MB:  [40MB₁]
桶 160MB: (空)
```

（4）<font style="color:#DF2A3F;">继续写入 → 10MB 桶又多次攒够</font> → 合并；反复几轮后 40MB 桶也攒到 4 个：

```plain
桶 10MB:  (空)
桶 40MB:  [40MB₁] [40MB₂] [40MB₃] [40MB₄]    ← 4 个 40MB，触发合并
桶 160MB: (空)
```

（5）**合并 #2**：4 个 40MB → 1 个 ~160MB：

```plain
桶 10MB:  (空)
桶 40MB:  (空)
桶 160MB: [160MB₁]
```

（6）系统稳定运行时，磁盘上通常会**同时存在多个档位的文件**，典型画面：

```plain
桶 10MB:  [10MB] [10MB]                   ← 最近 flush 的，还没攒够 4 个
桶 40MB:  [40MB] [40MB] [40MB]
桶 160MB: [160MB]
桶 640MB: [640MB]
         └──── 所有文件的 key range 都可能互相重叠 ────┘
```

### 2.3 一次 compaction 的 IO 视角
假设此刻触发"40MB 桶"的合并：

```plain
合并前 (磁盘上):                       合并后 (磁盘上):
─────────────────                     ─────────────────
桶 10MB:  [10MB][10MB]                桶 10MB:  [10MB][10MB]    不动
桶 40MB:  [40A][40B][40C][40D]  ──►   桶 40MB:  (空)            4 个被删除
桶 160MB: [160MB]                     桶 160MB: [160MB][160E]   新增 1 个
桶 640MB: [640MB]                     桶 640MB: [640MB]         不动

读 IO: 40A+40B+40C+40D ≈ 160MB
写 IO: 160E ≈ 160MB
本次合并写放大 ≈ 1x
```

合并期间，输入的 4 个文件和输出的 1 个大文件**同时存在于磁盘上**，所以临时空间峰值 ≈ 输入总大小（最坏翻倍）。

### 2.4 点查路径（为什么 RA 高）
查 `key=foo`：<font style="color:#ED740C;">必须在</font>**<font style="color:#ED740C;">所有现存 SST</font>**<font style="color:#ED740C;"> 里都问一遍 Bloom Filter</font>，不含 foo 的跳过，含 foo 的实际读，**<font style="color:rgb(0, 0, 0);">返回"第一个找到的版本"</font>**：

```plain
foo ∈ [10MBₐ]? → [10MBᵦ]? → [40MBₓ]? → [160MB₁]? → [640MB₁]?
       ↑ 每个桶每个文件都要问一次
```

最坏情况要扫磁盘上全部文件，这就是 Tiered 读放大高的根源。作为对比，Leveled 在 **<font style="color:rgb(0, 0, 0);">L0 每个文件是一个 run</font>**<font style="color:rgb(0, 0, 0);">，有几个文件就要问几次，</font>在 L1+ 每层只查 1 个文件，总共只查 <font style="color:rgb(0, 0, 0);">≈ </font>**<font style="color:rgb(0, 0, 0);">L0文件数 m + 层数 L</font>** 数。

### 2.5 为什么 Tiered 写放大低
一个 key 一辈子经历的重写次数：出生于 10MB 桶 → 合并一次到 40MB 桶 → 合并一次到 160MB 桶 → 合并一次到 640MB 桶…… **每个桶只被重写 1 次**，总共约 `log₄(数据量 / 10MB)` 次。

而 Leveled 中，从 Li 选一个文件合并到 Li+1 时，需要把 Li+1 中重叠的 ~10 倍数据也一起重写（fanout=10），因此写放大约 `fanout × level 数`。

### 2.6 与 Leveled 的关键差异
| 维度             | Tiered (STCS)                           | Leveled                                  |
| ---------------- | --------------------------------------- | ---------------------------------------- |
| 组织方式         | 按 **大小** 分桶                        | 按 **层 + key range** 组织               |
| 桶/层间 key 范围 | 任意重叠                                | L1+ 互不重叠                             |
| 触发条件         | 某桶文件数 ≥ `min_threshold`（默认 4）  | `某层 size / target_size > 1`            |
| 合并对象         | 同桶 4 个相似大小文件 → 1 个大文件      | Li 选 1 个 + Li+1 重叠的若干个           |
| 合并产物落位     | 落入下一个更大的桶，仍是一整个 SST      | 放到 Li+1，按 key range 拆成多个 SST     |
| 同桶/同层 run 数 | 多个（每个文件都是独立 run）            | L1+ 只有 1 个 run                        |
| 写放大           | **低**（每个 key 每个档位只重写 1 次）  | **高**（跨层搬运时连带重写下层重叠数据） |
| 读放大           | **高**（要查所有现存文件）              | **低**（每层最多 1 个文件）              |
| 空间放大         | **高**（合并期输入+输出共存，最坏 ~2x） | **低**（~1.1x，临时 ~10%）               |
| 墓碑回收         | 滞后（要等最大桶参与全量合并）          | 及时（每次合并 Li+1 重叠部分即回收）     |


### 2.7 优缺点
| 维度             | 表现                                                         |
| ---------------- | ------------------------------------------------------------ |
| **写放大**       | **最低**（<font style="color:#ED740C;">~2~4 倍</font>）。同一个 key 每个档位只被重写一次 |
| **读放大**       | **较高**。点查最坏要扫磁盘上所有文件                         |
| **空间放大**     | **最高**。合并期临时需 ~2 倍磁盘空间，tombstone 可能长期滞留大 SSTable |
| **临时空间峰值** | 合并期间常出现 50% 以上额外空间占用                          |
| **适用场景**     | 写密集型（日志、时序、批处理）、读延迟不敏感、磁盘廉价       |


Tiered 的典型痛点：

+ 大 SSTable 一旦形成很少再动，tombstone 清理滞后；
+ 读路径需查更多文件，Bloom Filter 和 block cache 压力大；
+ 偶尔出现的 "巨型 compaction"（几个 GB 级文件合并）会造成 IO 尖刺。

---

## Universal Compaction（通用压缩，RocksDB）
**代表系统**：RocksDB（`kCompactionStyleUniversal`）

Universal 是 RocksDB 对 Tiered 的改良，可以理解为"**<font style="color:#DF2A3F;">带空间约束和智能挑选的 Tiered</font>**"。<font style="color:#ED740C;">它保留 Tiered 低写放大的优点，同时通过更精细的触发逻辑控制空间放大</font>。

在RocksDB的语境下，Universal Compaction 和 Tiered Compaction 指的是同一种Compaction策略，RocksDB官方文档和代码库中将其称为 Universal Compaction

### 3.1 核心模型：Sorted Runs
Universal 把所有 SSTable 按 **时间年龄** 排序为 `R1, R2, ..., Rn`，其中 R1 是最新 flush 的文件（最小），$ R_n $ 是最老的（最大）。合并只在 **时间相邻** 的 run 之间发生，输出仍为一个 run。

一个 sorted run 可以是：

+ **单个 SSTable 文件**，或者
+ **多个 SSTable 文件的集合**，<font style="color:#ED740C;">只要这些文件之间 key 范围不重叠、合起来按 key 全局有序</font>

典型稳态下可能长这样:

```plain
R1 (最新):   [SST₁]                              ← 1 个 SST，~64MB
R2:          [SST₂]                              ← 1 个 SST，~64MB
R3:          [a..j] [k..t] [u..z]                ← 3 个 SST，~190MB，被切过
R4 (最老):   [a..c][d..f][g..i]...[x..y][y..z]   ← 几十个 SST，几个 GB
```

+ 任何一个 SST 文件超过这个大小就会被切成多个 key range 不重叠的 SST。
+ run 内部：SST 之间 key 不重叠 
+ run 之间：<font style="color:#DF2A3F;">R1~R4 key range 完全重叠</font>（都是不同时期的全量）

Run 和 层的对比：

|                                                      | **<font style="color:rgb(0, 0, 0);">"层"是什么</font>**      | **<font style="color:rgb(0, 0, 0);">层 vs run 的关系</font>** |
| ---------------------------------------------------- | :----------------------------------------------------------- | :----------------------------------------------------------- |
| **<font style="color:rgb(0, 0, 0);">Leveled</font>** | <font style="color:rgb(0, 0, 0);">物理 level（L1、L2...），层内文件不重叠有序</font> | **<font style="color:rgb(0, 0, 0);">层 ≡ run</font>**<font style="color:rgb(0, 0, 0);">（1 层就是 1 个 run）</font> |
| **<font style="color:rgb(0, 0, 0);">Tiered</font>**  | <font style="color:#ED740C;">逻辑</font>**<font style="color:rgb(0, 0, 0);">档位/tier</font>**<font style="color:rgb(0, 0, 0);">，按 run 大小分的组</font> | **<font style="color:rgb(0, 0, 0);">层 ⊃ T 个 run</font>**<font style="color:rgb(0, 0, 0);">（一组里并排躺着 T 个互相重叠的 run）</font> |


<font style="color:rgb(0, 0, 0);">把上面列表</font>**<font style="color:rgb(0, 0, 0);">按大小切开分组</font>**<font style="color:rgb(0, 0, 0);">，就得到档位视图。R1、R2 在 tier 0，R3（190MB）快到 tier 1，R4（几GB）已经在更高的 tier 了</font>：

```cpp
tier 0 (64MB 级):   R1, R2, R3, R4        ← 4 个 run 并排，互相重叠
tier 1 (256MB 级):  R5, R6, R7, R8        ← 4 个 run 并排，互相重叠
tier 2 (1GB 级):    R9, R10, ...
```

不过注意：每个 tier 的 run 大小不一定相等。

1. **<font style="color:rgb(0, 0, 0);">每层最多 T 个 run</font>**<font style="color:rgb(0, 0, 0);">（数量约束）</font>
2. **<font style="color:rgb(0, 0, 0);">run 大小随层数指数增长</font>**<font style="color:rgb(0, 0, 0);">（量级约束）</font>

**<font style="color:rgb(0, 0, 0);">"档位"是事后涌现（emergent）的统计现象，不是事前规划的结构。</font>**<font style="color:rgb(0, 0, 0);">因为合并总是"把 T 个小的并成 1 个大的"，长期跑下来 run 大小</font>**<font style="color:rgb(0, 0, 0);">自然</font>**<font style="color:rgb(0, 0, 0);">形成近似几何序列——就像每天往池子里注水、满了就倒进大池子，最后大小比例会自发趋近某个规律。但这是</font>**<font style="color:rgb(0, 0, 0);">大数定律的结果</font>**<font style="color:rgb(0, 0, 0);">，不是约束出来的。</font>

<font style="color:rgb(0, 0, 0);">Leveled：选 </font>$ L_n $<font style="color:rgb(0, 0, 0);"> 一个文件 → 找 </font>$ L_{n+1} $<font style="color:rgb(0, 0, 0);"> 中与之重叠的那部分 → 归并 → 按 key range 重新切分回 </font>$ L_{n+1} $<font style="color:rgb(0, 0, 0);">。它维护的是一个划分：</font>$ L_{n+1} $<font style="color:rgb(0, 0, 0);">  始终是把 key space 切成若干段、每段一个文件。任何 key 只能落进其中一段 → 1 个候选。</font>

<font style="color:rgb(0, 0, 0);">Leveled（增量式）：</font>$ L_n $<font style="color:rgb(0, 0, 0);"> 一有数据就往 </font>$ L_{n+1} $<font style="color:rgb(0, 0, 0);"> 搬，每次搬一个文件，与 </font>$ L_{n+1} $<font style="color:rgb(0, 0, 0);"> 的重叠部分按 key range 精确重写。结果：</font>$ L_{n+1} $<font style="color:rgb(0, 0, 0);"> 永远是「把 key space 切成若干段、每段一个文件」的一个完整划分 → 任何 key 只落进一段 → 1 个候选。层内不重叠是它维护的硬不变量。</font>

**<font style="color:rgb(0, 0, 0);">Universal / tiered</font>**<font style="color:rgb(0, 0, 0);">：选相邻 run → 整体归并 → 按 </font>`**<font style="color:rgb(0, 0, 0);">target_file_size</font>**`**<font style="color:rgb(0, 0, 0);">（字节数）</font>**<font style="color:rgb(0, 0, 0);"> 切分。切分依据是"写满 64MB 就换一个文件"，</font>**<font style="color:rgb(0, 0, 0);">跟 key range 边界无关</font>**<font style="color:rgb(0, 0, 0);">。输出是一个覆盖全 span 的新 run，它和下层其它 run 完全重叠 → </font><font style="color:#ED740C;">每层可以同时存在多个"完整覆盖全 key space"的 run</font><font style="color:rgb(0, 0, 0);">。</font>

**<font style="color:rgb(0, 0, 0);">Tiered（批处理式）</font>**<font style="color:rgb(0, 0, 0);">：攒够 T 个 run 才合并一次，把这 T 个整体归并成 1 个推到下一档（大小 ×T）。在"攒"的整个过程里，这一档就是同时躺着 1、2、3……T 个 run。而这 T 个 run 来自</font>**<font style="color:rgb(0, 0, 0);">不同时间窗口</font>**<font style="color:rgb(0, 0, 0);">，每个都近似覆盖全 key range → </font>**<font style="color:rgb(0, 0, 0);">必然互相重叠</font>**<font style="color:rgb(0, 0, 0);">：</font>

```cpp
tier 0 攒满的过程：
  [R1]                    ← 1 个
  [R1][R2]                ← 2 个，重叠
  [R1][R2][R3]            ← 3 个，重叠
  [R1][R2][R3][R4]        ← 4 个 = T，触发！
         ↓ 整体归并
  tier 1: [R1..R4 合并体]  ← 256MB，1 个
```

---

<font style="color:rgb(0, 0, 0);">RocksDB 的 universal 合并操作：</font>

<font style="color:rgb(0, 0, 0);">从 </font>**<font style="color:rgb(0, 0, 0);">R1（最新）</font>**<font style="color:rgb(0, 0, 0);"> 开始向右扫，只要「下一个 run 的大小 ≤ 已选中的累计大小」就纳入；一旦不满足就停。凑够 ≥2 个就合并成一个。</font>**<font style="color:rgb(0, 0, 0);">输出就地替换被合并的那一批，位置 = 这批里最老那个的位置。</font>**

<font style="color:rgb(0, 0, 0);">初始状态（稳态，年龄序 = 大小序）：</font>

```plain
新 ────────────────────────────────► 老
tier 0 (64MB级):   A[64]   B[64]   C[64]                 ← 3 个，差 1 个满
tier 1 (256MB级):  D[256]  E[256]  F[256]                ← 3 个，差 1 个满
tier 2 (1GB级):    G[1024]                               ← 1 个
```

---

<font style="color:rgb(0, 0, 0);">第 1 次触发：flush 把 tier 0 填满</font>

<font style="color:rgb(0, 0, 0);">新 flush 一个 64MB，记为</font><font style="color:rgb(0, 0, 0);"> </font>`<font style="color:rgb(0, 0, 0);">N</font>`<font style="color:rgb(0, 0, 0);">：</font>

```plain
tier 0:  N[64]  A[64]  B[64]  C[64]      ← 4 个 = T，触发！
tier 1:  D[256] E[256] F[256]
tier 2:  G[1024]
```

**<font style="color:rgb(0, 0, 0);">为什么能合并这四个？</font>**<font style="color:rgb(0, 0, 0);"> 因为它们在 run 列表里恰好</font>**<font style="color:rgb(0, 0, 0);">时间相邻</font>**<font style="color:rgb(0, 0, 0);">（就是最新的 4 个），而且比值检查一路通过：64≤64 ✓ → 64≤128 ✓ → 64≤192 ✓。</font>

<font style="color:rgb(0, 0, 0);">合并输出 256MB，记为</font><font style="color:rgb(0, 0, 0);"> </font>`<font style="color:rgb(0, 0, 0);">M1</font>`<font style="color:rgb(0, 0, 0);">。</font>**<font style="color:rgb(0, 0, 0);">关键：M1 不"搬"到任何地方，它就坐在被合并那批里最老的 C 原来的位置上</font>**<font style="color:rgb(0, 0, 0);">，右边紧挨着 D：</font>

```plain
tier 0:  （空）
tier 1:  M1[256]  D[256]  E[256]  F[256]   ← 4 个 = T，又满了！
tier 2:  G[1024]
```

**<font style="color:rgb(0, 0, 0);">所谓"升档"，物理上什么都没发生</font>**<font style="color:rgb(0, 0, 0);">——M1 只是变胖了，然后被旁观者重新贴了个"tier 1"的标签。它的</font>**<font style="color:rgb(0, 0, 0);">年龄位置纹丝未动</font>**<font style="color:rgb(0, 0, 0);">。</font>

---

<font style="color:rgb(0, 0, 0);">第 2 次触发：tier 1 满 4 个</font>

```plain
tier 1:  M1[256]  D[256]  E[256]  F[256]
                    ↓  整体归并 = 1024MB
tier 2:  M2[1024]  G[1024]        ← 2 个，离满（4 个）还早
tier 1:  （空）
```

`<font style="color:rgb(0, 0, 0);">M2</font>`<font style="color:rgb(0, 0, 0);"> </font><font style="color:rgb(0, 0, 0);">同样坐在 F 原来的位置，右边紧挨着 G。tier 2 要等攒够 4 个 1GB 才会再触发。</font>

<font style="color:rgb(0, 0, 0);">合并一批</font>**<font style="color:rgb(0, 0, 0);">时间相邻</font>**<font style="color:rgb(0, 0, 0);">的 run → 输出一个更大的 run → 它原地不动 → 因为变大了，下次画档位图时自然落进上一档。</font>

---

### 3.2 和 Leveled 对比
这两种策略本质是 LSM-tree 的两大流派：

**Leveled（"分层派"）**：追求**读放大和空间放大最优**。通过激进地将小 run 合并进大 run，保证每层内 key 不重叠，点查时每层只需查 1 个文件。代价是每次合并都要重写大量数据 → 写放大高。

**Universal / Tiered（"分桶派"）**：追求**写放大最优**。<font style="color:#ED740C;">只有等到几个大小相似的 run 凑齐了才合并</font>，且<font style="color:#DF2A3F;">合并后输出还是一个独立的 run（</font>不强行下沉到"下一层"）。代价是同一时刻可能存在多个重叠的 run → 读放大和空间放大高。

####  分组的依据不同 
**Universal**：分组依据是**时间范围**。每个 sorted run 覆盖"某段时间窗口内写入的数据"，不同 run 的**时间范围互不重叠**。一个 run 有多大，取决于那段时间写了多少数据——**没有预设目标大小**。

**Leveled**：分组依据是**容量层级**。L1 目标 256MB、L2 目标 2.56GB、L3 目标 25.6GB……**每层有严格的目标大小**，通常按 10 倍递增。数据按容量往下沉。

> 💡 这是根本分歧：Universal 的 run 是**时间维度**的分组，Leveled 的层是**空间维度**的分组。
>

#### Compaction 的触发单位不同 
**Universal**：

+ 触发条件：**sorted run 的数量**达到阈值 `level0_file_num_compaction_trigger`
+ 选哪些 run 合并：**从最小的 run 开始，贪心地加入大小相近的相邻 run**（"等几个大小相似的 run 凑齐了再合并"）
+ 合并结果：多个 run → 1 个 run，输出放到**尽可能高的 level**（即数据更老的方向）
+ **关键**：输入是**多个时间相邻的 run**，输出还是**1 个 run**——run 的总数减少，但每个 run 内部依然是"按 key range 分区的 SSTable 集合"

**Leveled**：

+ 触发条件：**某层大小超过目标值**（score = current_size / max_size）
+ 选哪些文件合并：从超标层挑**1 个文件**，与**下一层所有 key range 重叠的文件**合并
+ 合并结果：输出放到下一层
+ **关键**：输入是**1 个文件 + 下一层的所有重叠文件**，输出**分散到下一层的多个文件**——数据"下沉"了，但没有消除"层"这个结构

####  合并时的数据流动不同 
**Universal**（写放大低）：

```plain
R1(2MB) + R2(2MB) → R3(4MB)
R3(4MB) + R4(4MB) → R5(8MB)
```

每次合并，**输入和输出的数据量基本相当**——因为<font style="color:#DF2A3F;">是把几个大小相似的 run 合成一个</font>。所以单次 compaction 的写放大 ≈ 1x。一个 update 从最小的 run 合并到最大的 run，每次都"指数级靠近最终归宿"。

**Leveled**（写放大高）：

```plain
L1 的某个文件(64MB) + L2 中所有重叠文件(可能 500MB+) → 新的 L2 文件
```

每次合并，**1 个小文件要和大层里所有重叠文件一起重写**——输入可能是输出的 10 倍。所以单次 compaction 的写放大 ≈ 11x（默认 T=10）。一个 update 从 L0 下沉到 L6，可能被重写 30-60 次。

### 3.3 四个触发条件
当 sorted run 数量 `n >= level0_file_num_compaction_trigger` 时，Universal 按以下优先级挑选文件：

(1) Space Amplification Trigger（空间放大触发）

若预估空间放大比例超过 `max_size_amplification_percent / 100`，就 **把所有 run 全量合并** 成一个 run，强力回收空间。

```plain
size_amplification = (total_size - oldest_run_size) / oldest_run_size
```

直观含义：除最老那份"全量"之外冗余了多少。默认 200（允许 2 倍 SA），设小了会导致全量合并频繁、写放大升高。

(2) Individual Size Ratio Trigger（个体大小比触发）

从最小的 run 开始向后扫描，<font style="color:#ED740C;">只要后一个 run 的大小 </font>**<font style="color:#ED740C;">不大于前面累计合并输入的 size ratio（默认 1）</font>**<font style="color:#ED740C;">，就把它也加进来</font>。避免"小虾米拖大鲸鱼"式的低效合并。

(3) Number of Sorted Runs Trigger（run 数量触发）

若上述两条件都没触发，但 run 数量仍超限，就 **直接合并前几个小 run**，把 run 数量压下来，控制读放大。

(4) Age of Data Trigger（数据年龄触发 / TTL）

可选。若某个 run 中所有数据都已超过 TTL（`ttl` 选项），可以直接丢弃，不必参与合并。这也是 FIFO 的思想雏形。

### 3.4 优缺点
| 维度         | 表现                                                         |
| ------------ | ------------------------------------------------------------ |
| **写放大**   | 低，<font style="color:#ED740C;">介于纯 Tiered 和 Leveled 之间</font>（典型 <font style="color:#FBE4E7;">~</font><font style="color:#601BDE;">2~10 倍</font>） |
| **读放大**   | 中等。run 数量受严格控制，点查比 STCS 稳定                   |
| **空间放大** | 可控。通过 `max_size_amplification_percent` 设上限，最坏约 2~3 倍 |
| **合并风暴** | 全量合并时可能产生较大 IO 尖刺，但比 STCS 可预测             |
| **适用场景** | 写多读少、缓存层、日志采集、能用空间换写吞吐的场景           |


Universal 比 leveled 读放大高的原因：

Universal 的 sorted run 数量**上限更宽松**，且 full compaction 之前 sorted run 会持续堆积。而 Leveled 通过"层大小限制"强制数据向深层流动，**sorted run 数量被严格控制**。资料显示 Universal 的读放大是 **O(T)**（T = sorted run 数量），而 Leveled 是 **O(L)**（L = 层数），且 T 通常显著大于 L。

更关键的是：**Universal 的 L0 这一"最新 sorted run"往往由多个重叠文件组成**（每次 flush 产生一个新文件），而 Leveled 会通过 L0→L1 compaction 快速把这些文件合并成不重叠的 L1。所以 Universal 在 L0 这一层本身就积累了更多待查文件。

> RocksDB 官方建议：如果 Leveled 扛不住写入速率，优先尝试 Universal。
>

### 3.5 什么时候能安全删 tombstone？
这是个非常好的问题，抓住了关键。答案是：**不能丢**。原因是"删了的数据不能复活"。

tombstone 本身是一条"我比其他版本都新，这个 key 被删了"的标记。要想不写这个 tombstone，必须满足一个前提：

> **<font style="color:#DF2A3F;">所有可能包含同一 key 更老版本的文件，都在这次 compaction 的输入里</font>**（即不会有一个没参与合并的文件还藏着这个 key 的旧值）
>

否则：你合并时把 tombstone 丢了，但另一个没参与合并的大文件里还躺着这个 key 的旧值，下次读就会把旧值读出来——相当于**删除被撤销，数据复活了**（这是 Cassandra/RocksDB 早期真实出现过的数据一致性 bug）。

#### Leveled 为什么能及时清 tombstone
Leveled 的结构决定了 tombstone 可以"流水线式"地往下流，最终在最底层被清掉：

```plain
L0(重叠) → L1(不重叠) → L2(不重叠) → L3 → ... → Lmax(最底层)
```

+ 一次 Ln →<font style="color:#DF2A3F;"> Ln+1 合并只涉及 Ln 一个文件 + Ln+1 重叠的那几个文件</font>；
+ tombstone 被写到输出（放入 Ln+1），相当于"向下挪一层"；
+ 后续 Ln+1 → Ln+2 合并时，这个 tombstone 又继续往下挪；
+ <font style="color:#DF2A3F;">最终到达 </font>**<font style="color:#DF2A3F;">Lmax（最底层）</font>**<font style="color:#DF2A3F;">：下面没有别的层了，再合并时就可以</font>**<font style="color:#DF2A3F;">安全丢弃 tombstone</font>**——因为已经没有更老的版本需要被遮住。

所以 tombstone 是"每层走一遍就到底"，最多 `log_fanout`(总数据 / 最小表) 层就被清掉，不会在某层搁浅。

> RocksDB 还有个小优化：合并 Ln+Ln+1 时会去 Ln+2 及以下查一下，如果确认这个 key 在更底层**不存在**，可以提前丢 tombstone。但主流程还是传到最底层再丢。
>

#### Tiered/Universal 为什么不能中间丢
假设磁盘上有 5 个 run：

```plain
R1 (最新)  [SST₁]        ← 含 key=foo 的 tombstone（刚删的）
R2         [SST₂]
R3         [SST₃]
R4         [...]         ← 假设这 3 个都不含 foo
R5 (最老)  [....GB级大文件....]  ← ⚠️ 里面可能还有 foo 的旧值！
```

现在触发 R1+R2+R3 合并（Universal 的 size-ratio 触发条件）：

+ 多路归并时遇到 foo 的 tombstone；
+ 能不能直接不写？**不能**！因为 R5 没参与这次合并，R5 里还有 foo 的旧值；
+ 如果丢掉 tombstone，输出 run 里就没有 foo 了，但 R5 里还"藏"着 foo；
+ 下次读 foo：查 R1~R3 输出 → 没有；查 R4 → 没有；查 R5 → **读到旧值，数据复活**；
+ 所以必须把 tombstone 保留写入输出 run，继续"遮住"R5 里的旧值。

只有当触发**<font style="color:#DF2A3F;">全量合并</font>**<font style="color:#DF2A3F;">（R1+R2+R3+R4+R5 全部一起合并）时，才能安全丢掉 tombstone</font>——因为此时 R5 也在输入里，它的旧值会一起被归并丢弃，没有"漏网"的文件了。

#### 为什么这是 Tiered/Universal 的痛点
全量合并在 Tiered/Universal 里是**最贵的操作**（要读写所有数据），所以不会频繁发生：

+ **STCS**：几乎不会自动全量合并，大文件里的 tombstone 要等用户手动触发 major compaction 才能清，可能滞留几天甚至几周；
+ **Universal**：有 `max_size_amplification_percent` 触发全量合并，但默认允许 2 倍空间放大，意味着 tombstone 最长要到空间涨到 2 倍时才会被清；
+ **Leveled**：每次合并都是局部的、增量的，tombstone 自然而然流向最底层被清，不需要等全量合并。

---

## FIFO Compaction（先进先出压缩）
**代表系统**：RocksDB（`kCompactionStyleFIFO`）。FIFO 是所有策略里最简单的，**严格来说它根本不做合并**。

### 4.1 核心思想
+ 所有数据都在 L0；
+ 当总大小超过 `compaction_options_fifo.max_table_files_size` 时，直接把 **最老的 SSTable 整个删除**；
+ 完全不做 merge sort，不重写任何数据。

### 4.2 TTL 模式
结合 `ttl` 选项，FIFO 会自动丢弃过期 SSTable。配合 user-defined timestamp，非常适合时序数据。

TTL（Time To Live）是 RocksDB FIFO compaction 的一个配置选项，全称是 `compaction_options_fifo.ttl`（单位：秒）。

FIFO 淘汰 SST 有两条路径：

+ 按大小淘汰：总大小超过 max_table_files_size 时，删除最老的 SST；
+ 按 TTL 淘汰：如果设置了 ttl，会额外检查每个 SST 中数据的"年龄"，超过 TTL 的 SST 直接删除，不参与任何合并。

### 4.3 优缺点
| 维度         | 表现                                                         |
| ------------ | ------------------------------------------------------------ |
| **写放大**   | **几乎为 1**（只有 flush，没有重写）                         |
| **读放大**   | 随数据量线性增长，最坏要扫所有 L0 文件                       |
| **空间放大** | 严格被 `max_table_files_size` 限制                           |
| **语义限制** | 数据按时间过期，**不保留历史**；删除/更新不会立即回收        |
| **适用场景** | <font style="color:#DF2A3F;">缓存、时序指标、消息流</font>、"过旧数据没意义"的场景 |


FIFO 本质是"**把 RocksDB 当一个有界环形缓存用**"。

---

## Tiered + Leveled 混合模式
RocksDB 还支持混合策略，本质是让上层用 Tiered、下层用 Leveled。

### 5.1 Tiered + Leveled Hybrid
+ L0 ~ Lk 层使用 Tiered（允许重叠、多 run 并存），Lk+1 以下使用 Leveled；
+ 通过 `num_levels` 和层级大小配比实现；
+ 表现为：MemTable 可以保留多个、L0 文件较多而不急于合并到 L1，从而进一步降低写放大。

### 5.2 `level_compaction_dynamic_level_bytes`
严格说不是独立策略，但能让 Leveled 在大数据量下更平滑：开启后 L1 的目标大小会根据 L0 实际数据量动态调整，避免"小数据库被强制按 L1=256MB 合并"带来的额外 WA。生产环境建议总是开启。



---

## 工业界其他变体
### 6.1 Time-Window Compaction Strategy (TWCS) — Cassandra
时序数据专用。STCS 的问题是会把不同时间窗的数据搅在一起合并，过期数据很难整块丢弃。TWCS 的思路：

+ 在一个 **时间窗**（window，默认 1 天）内用 STCS；
+ 超出窗口后，该窗口产生的 SSTable 被视为"已关闭"，只在窗口内部合并；
+ TTL 到期后可以 **整窗直接删除**，几乎零 IO 成本。

优点：对 TTL 时序数据几乎无空间放大、无 tombstone 滞留；缺点：窗口外的时间范围查询需要扫多个窗口文件。

### 6.2 Date-Tiered Compaction Strategy (DTCS) — Cassandra/HBase 旧版
TWCS 的前身，按 SSTable 的时间戳分桶，类似 STCS 但基于时间而非大小。已被 TWCS 取代，主要问题是对过期数据不够友好、配置复杂。

### 6.3 Incremental Compaction (IC) — ScyllaDB
ScyllaDB 对 STCS 的优化，核心思想是把"全量重写大 SSTable"拆成增量步骤，降低合并时的临时空间峰值。IC 保证合并过程中不会同时持有整份输入+输出的完整副本，把空间放大从最坏 2 倍降到接近 1.1 倍，同时保留 STCS 低写放大的优点。

### 6.4 Unified Compaction Strategy (UCS) — Cassandra 5.0+
Cassandra 5.0 新引入的"统一策略"，把 STCS、LCS、TWCS 统一进一个参数化的框架：通过 `static_scaling_factors` 在不同大小层级切换 tiering/leveling 行为。官方推荐所有新表默认使用 UCS，替代历史上的 STCS/LCS/TWCS 三分天下。

### 6.5 HBase 的 Compaction 分类
HBase 作为 Hadoop 生态的列存数据库，compaction 分两类：

+ **Minor Compaction**：把相邻的小 HFile 合并成大 HFile，<font style="color:#D22D8D;">不清理 tombstone</font>（类似 RocksDB 的 Ln→Ln+1）；
+ **Major Compaction**：把一个 Region 内所有 HFile 合并成一个，清理所有 tombstone 和过期版本。代价极大，通常手动在低峰期触发。

HBase 的 compaction 策略本身也在演进：早期 RatioBasedCompactionPolicy（类似 STCS），后来引入 ExploringCompactionPolicy，更智能地挑选文件组合以减少 IO。

### 6.6 学术进展：Lazy Leveling / Dostoevsky / FLSM
+ **Lazy Leveling**：Dostoevsky 论文提出，最大层用 leveling（1 个 run），其他层用 tiering（多个 run），在点查和范围查之间取得较优平衡；
+ **Fluid LSM (FLSM)**：根据观测到的性能退化动态调整 run 数量，比 Lazy Leveling 响应更快；
+ **ARceKV** 等工作根据实时 workload（读/写比例、范围查比例）动态调整策略，属于 workload-driven compaction。

---

## 策略对比与选型建议
### 7.1 放大对比（典型值，RocksDB 默认配置）
| 策略           | 写放大 WA     | 读放大 RA      | 空间放大 SA     | 临时空间   |
| -------------- | ------------- | -------------- | --------------- | ---------- |
| Leveled (默认) | 高（10~30x）  | 低（~1）       | 低（~1.1x）     | ~10%       |
| Leveled-N      | 中（5~15x）   | 中（~N）       | 中              | ~10%       |
| Tiered (STCS)  | 低（2~4x）    | 高             | 高（最坏 2x）   | 最坏 ~100% |
| Universal      | 中低（2~10x） | 中             | 中（可控 2~3x） | ~50%       |
| FIFO           | 极低（~1x）   | 高（随数据量） | 严格受限        | 0          |


### 7.2 如何选型
| 场景                      | 推荐策略                                   |
| ------------------------- | ------------------------------------------ |
| 通用 KV、读多写少、SSD 盘 | **Leveled**（默认）                        |
| 写密集、能接受空间放大    | **Universal** 或 STCS                      |
| 时序数据带 TTL            | **FIFO**（RocksDB）/ **TWCS**（Cassandra） |
| 缓存、消息流、数据可丢    | **FIFO**                                   |
| Cassandra 5.0+ 新表       | **UCS**                                    |
| 极致写吞吐 + 不差空间     | Tiered/Universal + 关闭自动 major          |
| 磁盘空间紧张              | Leveled + 开启压缩                         |


### 7.3 常见调优手段
+ **增大 **`write_buffer_size`：减少 flush 频率，降低 L0 SST 数量；
+ **调整 **`max_background_compactions`** / **`max_subcompactions`：提高后台并发；
+ **合理设置 fanout**：SSD 上 fanout=8~10 常用，HDD 上可减小；
+ `level_compaction_dynamic_level_bytes=true`：避免小数据库的额外写放大；
+ **设置 **`ttl`** + FIFO/UCS**：时序数据一定要利用 TTL 让旧数据整块淘汰；
+ **业务低峰期限速**：通过 `ratelimiter` 限制 compaction IO，避免挤压前台请求；
+ **监控 compaction stats**：重点观察 `compaction-pending`、`write-amplification`、`stall` 条件。

### 7.4 Compaction 引发的常见问题
+ **Write Stall**：L0 文件数过多或 pending compaction 字节超限时，RocksDB 会主动 slowdown/stop 前台写入；
+ **Tombstone 滞留**：<font style="color:#DF2A3F;">Tiered/Universal 模式下，大 SSTable 中的 tombstone 要等到全量合并才会清掉</font>，可能长期占空间；
+ **Range Tombstone 放大**：范围删除标记如果分布不均，可能放大合并 IO；
+ **压缩 + Compaction 叠加**：CPU 可能成为瓶颈，注意 LZ4/Snappy/ZSTD 的 CPU 开销；
+ **Subcompaction 不均**：数据倾斜导致部分 subcompaction 极慢，拖累整体尾延迟。

---

## 总结
Compaction 是 LSM-Tree 的"心脏"：它决定了 LSM 的写放大、读放大和空间放大，直接影响数据库的吞吐、延迟 TAIL 和磁盘成本。从 LevelDB 的经典 Leveled，到 Cassandra 的 STCS/TWCS/UCS，再到 RocksDB 的 Universal/FIFO 与混合模式，每一种策略都是对 WA/RA/SA 三难困境的一个工程解。

选型时没有银弹：先看清自己的 workload（读多还是写多？点查还是范围查？数据是否有时序/TTL 语义？磁盘是 SSD 还是 HDD？），再对照放大对比表选择。大多数通用场景 RocksDB 默认的 Leveled 已经足够好；如果写吞吐压得住系统，Universal 是首选替代方案；FIFO 则在缓存和时序场景下有近乎"作弊"的低写放大。

---

## 参考资料
1. [RocksDB Wiki — Compaction](https://github.com/facebook/rocksdb/wiki/Compaction)
2. [RocksDB Wiki — Universal Compaction](https://github.com/facebook/rocksdb/wiki/Universal-Compaction)
3. [RocksDB Wiki — Leveled Compaction](https://github.com/facebook/rocksdb/wiki/Leveled-Compaction)
4. [RocksDB: Evolution of Development Priorities in a Key-value Store Serving Large-scale Applications (ACM TOS 2021)](https://www.michaelstumm.com/Papers/Dong-ACMToS21.pdf)
5. [Apache Cassandra — Size Tiered Compaction Strategy](https://cassandra.apache.org/doc/latest/cassandra/managing/operating/compaction/stcs.html)
6. [ScyllaDB — Compaction Strategies](https://docs.scylladb.com/manual/stable/architecture/compaction/compaction-strategies.html)
7. [阿里云开发者社区 — 深入探讨 LSM Compaction 机制](https://developer.aliyun.com/article/758369)
8. Dayan et al., _Dostoevsky: Better Space-Time Trade-Offs for LSM-Tree Based Key-Value Stores_, SIGMOD 2018
9. [CSDN — RocksDB 的 Compaction: Leveled Compaction 和 Universal Compaction](https://blog.csdn.net/qq_40586164/article/details/117914647)
10. [Calvin's Marbles — RocksDB 的 Compaction 策略](http://www.calvinneo.com/2024/12/29/rocksdb-compaction/)
