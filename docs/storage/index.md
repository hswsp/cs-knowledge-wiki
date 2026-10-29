# 存储 / Storage

> 数据库内核、分布式存储、存储引擎、CMU 15-445 课程笔记、存储基础与 I/O 协议。

## 存储基础

- [io_uring 如何重塑高性能存储的 I/O 边界](./protocols/rustfs-io-uring-deep-dive)
- [NAS 各种协议](./protocols/nas-ge-zhong-xie-yi)
- [SATA 与 NVMe](./protocols/cun-chu-ji-shu-jie-shao-sata-yu-nvme)
- [LSM Tree：高性能海量数据写数据结构](./protocols/lsm-tree)
- [LSM-Tree Compaction 策略全景：从 Leveled 到 Universal、FIFO 与工业界变体](./protocols/lsm-compaction)
- [聊聊MySql事务,MVCC](./protocols/mvcc.md)

## 存储引擎

- [DuckDB 架构深度解析：查询引擎、存储引擎与 AI 时代的硬件适配](./storage-engine/duckdb-架构详解)
- [HDFS 简介](./storage-engine/hdfs-intro)
- [OceanBase 架构图文档](./storage-engine/oceanbase-architecture)
- [OceanBase 分布式共识与存储架构深度笔记](./storage-engine/oceanbase-paxos-log-stream-tablet)
- [SeekDB Architecture](./storage-engine/seekdb-architecture)
- [Lance Format vs Parquet 列式格式](./storage-engine/lance-format-vs-parquet)
- [Lance 存储引擎架构解析](./storage-engine/lance-storage-engine-architecture)
- [LanceDB 开源向量数据库实现解读](./storage-engine/lancedb-implementation)
- [LanceDB 索引原理与实现解读](./storage-engine/lancedb-indexing)
- [Lance分布式FTS索引构建：从单机到集群的全文搜索进化之路](./storage-engine/lance-distributed-fts-indexing)
- [LanceDB GPU 索引](./storage-engine/lancedb-gpu-indexing)
- [PolarDB-X 架构深度解读](./storage-engine/PolarDB-X-架构解读)
- [Tair 架构详解](./storage-engine/Tair架构详解)
- [Lustre 高性能分布式文件系统：从 0 级基础到精通](./storage-engine/Lustre架构详解)
- [Alluxio 架构深度解读](./storage-engine/alluxio-architecture)

## Intro to Database System

- [进入 Intro to Database System](./cmu15-445/)

## Vector Databases in Modern AI Applications

- [进入 Vector Databases in Modern AI Applications](./vector-database/)

## LSM-Tree in a Week

- [进入 LSM-Tree in a Week](./lsm-tree/)

> 分布式一致性（Paxos / Raft）请见 [系统设计 → 分布式共识](../system-design/#分布式共识)
