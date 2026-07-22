---
title: LSM-Tree Compaction 策略全景：从 Leveled 到 Universal、FIFO 与工业界变体
description: "深入解析 LSM-Tree 中的各类 Compaction 策略，包括 RocksDB/LevelDB/Cassandra/HBase 的实现差异与权衡"
date: 2026-07-22
---

# 前言

在上一篇 [LSM Tree：高性能海量数据写数据结构](./lsm-tree) 中，我们介绍了 LSM-Tree 的基本思想：利用内存 MemTable 缓冲增量写入，再批量顺序刷到磁盘形成不可变 SSTable，用「追加写 + 后台合并」换取极致的写吞吐。但 LSM 之所以能长期工作而不变成一堆越积越多的小文件，核心就在于 **Compaction（压缩 / 合并）**——它是 LSM 的"垃圾回收器"，负责回收过期版本、删除墓碑（tombstone）、控制读放大和空间放大。

Compaction 的本质可以概括为三个问题：**何时合并（when）、选哪些文件合并（which）、合并到哪里（how）**。不同的数据库对这三个问题给出了不同答案，形成了各具特色的策略族。本文以 RocksDB 为主线，结合 LevelDB、Cassandra、HBase、ScyllaDB 等系统，系统梳理 LSM-Tree 中各类 Compaction 策略的原理、触发条件、优缺点与适用场景。

## 为什么需要 Compaction

在进入具体策略之前，先回顾 Compaction 要解决的三类"放大"问题，这也是后面所有权衡的基准：

| 放大类型 | 定义 | 直观含义 |
|---------|------|---------|
| **写放大 (Write Amplification, WA)** | 实际写入磁盘字节数 / 用户写入字节数 | 同一个 key 被反复重写的次数 |
| **读放大 (Read Amplification, RA)** | 一次点查需要访问的 SSTable 数量 | 读路径上需要二分查找的文件数 |
| **空间放大 (Space Amplification, SA)** | 磁盘实际占用 / 数据有效大小 | 过期数据、tombstone 占用的额外空间 |

LSM 的经典 **"三难困境 (trilemma)"** 指出：没有任何一种策略能同时把 WA、RA、SA 都做到最低——你只能在三角形中选一个靠近的顶点。Compaction 策略的本质，就是在这三者之间做工程上的权衡。

Compaction 的主要作用：

1. **垃圾回收**：清除被覆盖的旧版本和带删除标记的 tombstone；
2. **降低读放大**：减少 SSTable 数量，保持每层 key range 不重叠；
3. **降低空间放大**：回收过期数据占用的磁盘空间；
4. **优化数据局部性**：让冷热数据自然分层，热数据留在上层。

## Compaction 的基本分类

从 LSM 理论与工业实践来看，主流策略可以归为几大类：

```
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

---

## 一、Leveled Compaction（分层压缩）

**代表系统**：LevelDB、RocksDB（默认）、HBase、ScyllaDB LCS

Leveled 是目前最广泛使用的策略，也是 RocksDB 的默认方式，直接源自 LevelDB 的设计。

### 1.1 核心结构

Leveled 将磁盘 SSTable 分为多层（通常 L0 ~ L6，共 7 层），每个层有明确的目标大小：

```
L0:    最多 4 个 SST（可重叠，由 flush 产生）
L1:    max_bytes_for_level_base（默认 ~256MB）
L2:    L1 × max_bytes_for_level_multiplier（默认 10 倍，~2.5GB）
L3:    ~25GB
L4:    ~250GB
...
L_n:   大小 = L_{n-1} × multiplier（默认 10）
```

关键特性：

- **L0 特殊**：L0 由 MemTable flush 产生，SSTable 之间的 key range **允许重叠**；
- **L1 及以上**：同一层内所有 SSTable 的 key range **互不重叠**（non-overlapping），整层构成一个有序 run；
- **Fanout（扇出）**：相邻两层大小之比，默认 10。Fanout 相同时写放大最优。

### 1.2 触发条件

RocksDB 周期性为每一层计算 **score**，选择 score 最大的层合并：

- **L0**：`score = max(file_num / level0_file_num_compaction_trigger, total_size / max_bytes_for_level_base)`，默认 `level0_file_num_compaction_trigger = 4`；
- **非 L0**：`score = current_level_size / target_level_size`。

其它触发因素：

- 单个文件大小超过 `target_file_size_base`（默认 64MB）会被切分；
- `soft_pending_compaction_bytes_limit` / `hard_pending_compaction_bytes_limit` 控制待压缩 backlog；
- L0 文件间 range 重叠导致的 "compaction debt"。

### 1.3 合并过程

以 L1 → L2 为例：

```
L1:  [a........m] [n........z]       ← 选中 [a..m] 文件
L2:  [a..c][d..f][g..i][j..l][m..o][p..r][s..u][v..z]
                       ↓ 合并重叠的 4 个 L2 文件
L2:  [a'..c'][d'..f'][g'..i'][j'..l'][m..o][p..r][s..u][v..z]
```

步骤：

1. 从 Ln 选出一个 SST；
2. 找到 Ln+1 中所有与该 SST key range 重叠的文件；
3. 多路归并，丢弃旧版本/删除标记，输出新的 SST 到 Ln+1；
4. 删除输入文件，新文件按 target size 切分。

L0 → L1 特殊：L0 文件互相重叠，通常需把 L0 中 **所有重叠的 SST** 一起与 L1 重叠部分合并。

### 1.4 Subcompaction 并行化

大文件合并可能成为瓶颈。RocksDB 支持 **Subcompaction**：把一个大 compaction 按 key range 切成多段，每段由后台线程池的独立线程并行归并，显著降低尾延迟。L0 → L1 默认关闭，但可开启 subcompaction-based parallelization。

### 1.5 优缺点

| 维度 | 表现 |
|------|------|
| **写放大** | **较高**（典型 10~30 倍）。一个 key 从 L0 到 L6 可能被重写 6 次以上；fanout 越大 WA 越小但 RA 越大 |
| **读放大** | **很低**。点查每层最多查 1 个 SST（L0 除外），加 Bloom Filter 往往只需 1~2 次 IO |
| **空间放大** | **最低**（~1.1 倍）。过期数据在下一次合并时即被回收 |
| **临时空间** | 合并只需 ~10% 额外临时空间 |
| **适用场景** | 通用 KV、读多写少、对存储空间敏感、SSD |

### 1.6 Leveled-N（LCS 的优化变体）

RocksDB 支持 **Leveled-N** 模式：允许每层有 **N 个有序 run** 而非 1 个，相当于在 leveling 和 tiering 之间插值：

- 合并时把 Ln-1 的所有 run 与 Ln 的 1 个 run 合并；
- 通过调整最大层 run 数量 K 和 size ratio T，平衡 WA/RA/SA；
- 学术上对应 Dostoevsky 提出的 **Lazy Leveling**。


---

## 二、Tiered Compaction（大小分层压缩）

**代表系统**：Apache Cassandra（默认 STCS）、HBase（早期）、BigTable 论文原型

Tiered 是写优化场景的经典选择，在 RocksDB 中对应 Universal Compaction 的基础形态。

### 2.1 核心思想

"**把大小相近的 SSTable 合并成更大的 SSTable**"。与 Leveled 按"层"组织不同，Tiered 按 **"大小桶 (bucket)"** 组织：

```
初始:    [10MB] [10MB] [10MB] [10MB]          ← flush 产生 4 个小文件
合并:    └─────── 4 个合并成 1 个 ───────┘
         [40MB]
继续写入: [40MB] [40MB] [40MB] [40MB]
合并:    └─────── 4 个合并成 1 个 ───────┘
         [160MB]
... 以此类推，每级大小约为上一级的 N 倍 (N=4)
```

Cassandra 中，SSTable 按大小落入不同 bucket（默认 `bucket_low=0.5, bucket_high=1.5`，即同桶大小相差不超过 50%），一个 bucket 积累到 `min_threshold`（默认 4）个文件就触发合并。

### 2.2 优缺点

| 维度 | 表现 |
|------|------|
| **写放大** | **最低**（~2~4 倍）。同一个 key 在每层只被重写一次 |
| **读放大** | **较高**。点查最坏要扫每层所有文件 |
| **空间放大** | **最高**。临时需 2 倍磁盘空间，tombstone 可能长期滞留大 SSTable |
| **临时空间峰值** | 合并期间常出现 50% 以上额外空间占用 |
| **适用场景** | 写密集型（日志、时序、批处理）、读延迟不敏感、磁盘廉价 |

Tiered 的典型痛点：

- 大 SSTable 一旦形成很少再动，tombstone 清理滞后；
- 读路径需查更多文件，Bloom Filter 和 block cache 压力大；
- 偶尔出现的 "巨型 compaction" 造成 IO 尖刺。

---

## 三、Universal Compaction（通用压缩，RocksDB）

**代表系统**：RocksDB（`kCompactionStyleUniversal`）

Universal 是 RocksDB 对 Tiered 的改良，可以理解为"**带空间约束和智能挑选的 Tiered**"。它保留 Tiered 低写放大的优点，同时通过更精细的触发逻辑控制空间放大。

### 3.1 核心模型：Sorted Runs

Universal 把所有 SSTable 按 **时间年龄** 排序为 `R1, R2, ..., Rn`，其中 R1 是最新 flush 的文件（最小），Rn 是最老的（最大）。每个 Ri 是一个覆盖全 key range 的 **sorted run**（可以是单个 L0 文件，也可以是底层一个非重叠层）。合并只在 **时间相邻** 的 run 之间发生，输出仍为一个 run。

### 3.2 四个触发条件

当 sorted run 数量 `n >= level0_file_num_compaction_trigger` 时，Universal 按以下优先级挑选文件：

#### (1) Space Amplification Trigger（空间放大触发）

若预估空间放大比例超过 `max_size_amplification_percent / 100`，就 **把所有 run 全量合并** 成一个 run，强力回收空间。

```
size_amplification = (total_size - oldest_run_size) / oldest_run_size
```

直观含义：除最老那份"全量"之外冗余了多少。默认 200（允许 2 倍 SA），设小了会导致全量合并频繁、写放大升高。

#### (2) Individual Size Ratio Trigger（个体大小比触发）

从最小的 run 开始向后扫描，只要后一个 run 的大小 **不大于前面累计合并输入的 size ratio（默认 1）**，就把它也加进来。避免"小虾米拖大鲸鱼"式的低效合并。

#### (3) Number of Sorted Runs Trigger（run 数量触发）

若上述两条件都没触发，但 run 数量仍超限，就 **直接合并前几个小 run**，把 run 数量压下来，控制读放大。

#### (4) Age of Data Trigger（数据年龄触发 / TTL）

可选。若某个 run 中所有数据都已超过 TTL（`ttl` 选项），可以直接丢弃，不必参与合并。这也是 FIFO 的思想雏形。

### 3.3 优缺点

| 维度 | 表现 |
|------|------|
| **写放大** | 低，介于纯 Tiered 和 Leveled 之间（典型 ~2~10 倍） |
| **读放大** | 中等。run 数量受严格控制，点查比 STCS 稳定 |
| **空间放大** | 可控。通过 `max_size_amplification_percent` 设上限，最坏约 2~3 倍 |
| **合并风暴** | 全量合并时可能产生较大 IO 尖刺，但比 STCS 可预测 |
| **适用场景** | 写多读少、缓存层、日志采集、能用空间换写吞吐的场景 |

> RocksDB 官方建议：如果 Leveled 扛不住写入速率，优先尝试 Universal。

---

## 四、FIFO Compaction（先进先出压缩）

**代表系统**：RocksDB（`kCompactionStyleFIFO`）

FIFO 是所有策略里最简单的，**严格来说它根本不做合并**。

### 4.1 核心思想

- 所有数据都在 L0；
- 当总大小超过 `compaction_options_fifo.max_table_files_size` 时，直接把 **最老的 SSTable 整个删除**；
- 完全不做 merge sort，不重写任何数据。

### 4.2 TTL 模式

结合 `ttl` 选项，FIFO 会自动丢弃过期 SSTable。配合 user-defined timestamp，非常适合时序数据。

### 4.3 优缺点

| 维度 | 表现 |
|------|------|
| **写放大** | **几乎为 1**（只有 flush，没有重写） |
| **读放大** | 随数据量线性增长，最坏要扫所有 L0 文件 |
| **空间放大** | 严格被 `max_table_files_size` 限制 |
| **语义限制** | 数据按时间过期，**不保留历史**；删除/更新不会立即回收 |
| **适用场景** | 缓存、时序指标、消息流、"过旧数据没意义"的场景 |

FIFO 本质是"**把 RocksDB 当一个有界环形缓存用**"。

---

## 五、Tiered + Leveled 混合模式

RocksDB 还支持混合策略，本质是让上层用 Tiered、下层用 Leveled。

### 5.1 Tiered + Leveled Hybrid

- L0 ~ Lk 层使用 Tiered（允许重叠、多 run 并存），Lk+1 以下使用 Leveled；
- 通过 `num_levels` 和层级大小配比实现；
- 表现为：MemTable 可以保留多个、L0 文件较多而不急于合并到 L1，从而进一步降低写放大。

### 5.2 `level_compaction_dynamic_level_bytes`

严格说不是独立策略，但能让 Leveled 在大数据量下更平滑：开启后 L1 的目标大小会根据 L0 实际数据量动态调整，避免"小数据库被强制按 L1=256MB 合并"带来的额外 WA。生产环境建议总是开启。


---

## 六、工业界其他变体

### 6.1 Time-Window Compaction Strategy (TWCS) — Cassandra

时序数据专用。STCS 的问题是会把不同时间窗的数据搅在一起合并，过期数据很难整块丢弃。TWCS 的思路：

- 在一个 **时间窗**（window，默认 1 天）内用 STCS；
- 超出窗口后，该窗口产生的 SSTable 被视为"已关闭"，只在窗口内部合并；
- TTL 到期后可以 **整窗直接删除**，几乎零 IO 成本。

优点：对 TTL 时序数据几乎无空间放大、无 tombstone 滞留；缺点：窗口外的时间范围查询需要扫多个窗口文件。

### 6.2 Date-Tiered Compaction Strategy (DTCS) — Cassandra/HBase 旧版

TWCS 的前身，按 SSTable 的时间戳分桶，类似 STCS 但基于时间而非大小。已被 TWCS 取代，主要问题是对过期数据不够友好、配置复杂。

### 6.3 Incremental Compaction (IC) — ScyllaDB

ScyllaDB 对 STCS 的优化，核心思想是把"全量重写大 SSTable"拆成增量步骤，降低合并时的临时空间峰值。IC 保证合并过程中不会同时持有整份输入+输出的完整副本，把空间放大从最坏 2 倍降到接近 1.1 倍，同时保留 STCS 低写放大的优点。

### 6.4 Unified Compaction Strategy (UCS) — Cassandra 5.0+

Cassandra 5.0 新引入的"统一策略"，把 STCS、LCS、TWCS 统一进一个参数化的框架：通过 `static_scaling_factors` 在不同大小层级切换 tiering/leveling 行为。官方推荐所有新表默认使用 UCS，替代历史上的 STCS/LCS/TWCS 三分天下。

### 6.5 HBase 的 Compaction 分类

HBase 作为 Hadoop 生态的列存数据库，compaction 分两类：

- **Minor Compaction**：把相邻的小 HFile 合并成大 HFile，不清理 tombstone（类似 RocksDB 的 Ln→Ln+1）；
- **Major Compaction**：把一个 Region 内所有 HFile 合并成一个，清理所有 tombstone 和过期版本。代价极大，通常手动在低峰期触发。

HBase 的 compaction 策略本身也在演进：早期 RatioBasedCompactionPolicy（类似 STCS），后来引入 ExploringCompactionPolicy，更智能地挑选文件组合以减少 IO。

### 6.6 学术进展：Lazy Leveling / Dostoevsky / FLSM

- **Lazy Leveling**：Dostoevsky 论文提出，最大层用 leveling（1 个 run），其他层用 tiering（多个 run），在点查和范围查之间取得较优平衡；
- **Fluid LSM (FLSM)**：根据观测到的性能退化动态调整 run 数量，比 Lazy Leveling 响应更快；
- **ARceKV** 等工作根据实时 workload（读/写比例、范围查比例）动态调整策略，属于 workload-driven compaction。

---

## 七、策略对比与选型建议

### 7.1 放大对比（典型值，RocksDB 默认配置）

| 策略 | 写放大 WA | 读放大 RA | 空间放大 SA | 临时空间 |
|------|-----------|-----------|-------------|---------|
| Leveled (默认) | 高（10~30x） | 低（~1） | 低（~1.1x） | ~10% |
| Leveled-N | 中（5~15x） | 中（~N） | 中 | ~10% |
| Tiered (STCS) | 低（2~4x） | 高 | 高（最坏 2x） | 最坏 ~100% |
| Universal | 中低（2~10x） | 中 | 中（可控 2~3x） | ~50% |
| FIFO | 极低（~1x） | 高（随数据量） | 严格受限 | 0 |

### 7.2 如何选型

| 场景 | 推荐策略 |
|------|---------|
| 通用 KV、读多写少、SSD 盘 | **Leveled**（默认） |
| 写密集、能接受空间放大 | **Universal** 或 STCS |
| 时序数据带 TTL | **FIFO**（RocksDB）/ **TWCS**（Cassandra） |
| 缓存、消息流、数据可丢 | **FIFO** |
| Cassandra 5.0+ 新表 | **UCS** |
| 极致写吞吐 + 不差空间 | Tiered/Universal + 关闭自动 major |
| 磁盘空间紧张 | Leveled + 开启压缩 |

### 7.3 常见调优手段

- **增大 `write_buffer_size`**：减少 flush 频率，降低 L0 SST 数量；
- **调整 `max_background_compactions` / `max_subcompactions`**：提高后台并发；
- **合理设置 fanout**：SSD 上 fanout=8~10 常用，HDD 上可减小；
- **`level_compaction_dynamic_level_bytes=true`**：避免小数据库的额外写放大；
- **设置 `ttl` + FIFO/UCS**：时序数据一定要利用 TTL 让旧数据整块淘汰；
- **业务低峰期限速**：通过 `ratelimiter` 限制 compaction IO，避免挤压前台请求；
- **监控 compaction stats**：重点观察 `compaction-pending`、`write-amplification`、`stall` 条件。

### 7.4 Compaction 引发的常见问题

- **Write Stall**：L0 文件数过多或 pending compaction 字节超限时，RocksDB 会主动 slowdown/stop 前台写入；
- **Tombstone 滞留**：Tiered/Universal 模式下，大 SSTable 中的 tombstone 要等到全量合并才会清掉，可能长期占空间；
- **Range Tombstone 放大**：范围删除标记如果分布不均，可能放大合并 IO；
- **压缩 + Compaction 叠加**：CPU 可能成为瓶颈，注意 LZ4/Snappy/ZSTD 的 CPU 开销；
- **Subcompaction 不均**：数据倾斜导致部分 subcompaction 极慢，拖累整体尾延迟。

---

## 八、总结

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
8. Dayan et al., *Dostoevsky: Better Space-Time Trade-Offs for LSM-Tree Based Key-Value Stores*, SIGMOD 2018
9. [CSDN — RocksDB 的 Compaction: Leveled Compaction 和 Universal Compaction](https://blog.csdn.net/qq_40586164/article/details/117914647)
10. [Calvin's Marbles — RocksDB 的 Compaction 策略](http://www.calvinneo.com/2024/12/29/rocksdb-compaction/)
