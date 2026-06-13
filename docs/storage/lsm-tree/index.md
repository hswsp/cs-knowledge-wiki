# LSM-Tree in a Week

> 从 LSM Tree 设计原理到 Mini-LSM 三周教程，逐步实现一个 LSM-Tree 存储引擎。

## LSM Tree 基础

- [01 - LSM 树设计原理](./01-lsm-tree-design-principles)
- [02 - LevelDB 的索引建立](./02-lsm-tree-leveldb-index)
- [03 - KV 分离的实现](./03-lsm-kv-separation)
- [04 - Mini-LSM 课程介绍](./04-mini-lsm-intro)

## Week 1: Mini-LSM

- [05 - Course Overview](./05-mini-lsm-course-overview)
- [06 - Environment Setup](./06-environment-setup)
- [07 - Week 1 Overview](./07-week1-overview)
- [08 - Memtables](./08-memtables)
- [09 - Merge Iterator](./09-merge-iterator)
- [10 - Block](./10-block)
- [11 - Sorted String Table (SST)](./11-sorted-string-table)
- [12 - Read Path](./12-read-path)
- [13 - Write Path](./13-write-path)
- [14 - SST Optimizations](./14-sst-optimizations)

## Week 2: Compaction and Persistence

- [15 - Week 2 Overview](./15-week2-overview)
- [16 - Compaction Implementation](./16-compaction-implementation)
- [17 - Simple Compaction Strategy](./17-simple-compaction-strategy)
- [18 - Tiered Compaction Strategy](./18-tiered-compaction-strategy)
- [19 - Leveled Compaction Strategy](./19-leveled-compaction-strategy)
- [20 - Manifest](./20-manifest)
- [21 - Write-Ahead Log (WAL)](./21-write-ahead-log)
- [22 - Batch Write and Checksums](./22-batch-write-checksums)

## Week 3: Multi-Version Concurrency Control

- [23 - Week 3 Overview](./23-week3-overview)
- [24 - Timestamp Key Encoding](./24-timestamp-key-encoding)
- [25 - Snapshot Read - Memtables](./25-snapshot-read-memtables)
- [26 - Snapshot Read - Engine](./26-snapshot-read-engine)
- [27 - Watermark and GC](./27-watermark-gc)
- [28 - Transaction and OCC](./28-transaction-occ)
- [29 - Serializable Snapshot Isolation](./29-serializable-snapshot-isolation)
- [30 - Compaction Filters](./30-compaction-filters)
- [31 - The Rest of Your Life](./31-the-rest-of-your-life)
