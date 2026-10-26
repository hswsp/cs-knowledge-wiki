# OceanBase 分布式共识与存储架构深度笔记

> 本文整理自对 OceanBase 源码及架构文档的深入讨论，涵盖 Paxos 协议在 OceanBase 中的应用范围、Tablet 与 Log Stream 的关系、写入流程、元数据自举体系、日志回收与扩容机制、Tablet Transfer 实现细节，以及 Paxos 与 Raft 的选型对比。

---

## 1. 引言

在基于复制状态机的分布式数据库中，共识协议（如 Paxos、Raft）通常要求每个成员维护全量副本，这会带来高延迟和扩容困难的问题。OceanBase 通过**分层、分片、按需**应用 Paxos，配合动态日志流、多副本类型和异步提交等优化，较好地平衡了一致性、延迟和扩展性。

---

## 2. OceanBase 中 Paxos 的应用范围

OceanBase 的 Paxos 不是"一锤子买卖"同步所有东西，而是按数据类型分层、按分区/日志流分片地应用：

### 2.1 用户数据（分区/Tablet 级别）

这是 Paxos 最核心的用途。每个分区的多副本构成一个独立的 Paxos Group：

- 事务提交时，redo log（clog）通过 **Multi-Paxos** 协议同步到多数派副本（如 3 副本中的 2 个），确保事务的持久性和原子性。
- V4.0 之前，每个分区对应一个独立的 Paxos log stream，CPU 和网络开销较大。
- V4.0 引入**动态日志流（Log Stream）**：多个 Tablet 共享一个 Paxos log stream，既保留了分区级迁移的灵活性，又大幅降低了 Paxos 实例数量带来的开销。

### 2.2 系统元数据（核心系统表）

OceanBase 的系统元数据以自描述的系统表形式存储，核心表通过 Paxos 强一致同步：

| 系统表 | 作用 | Paxos 同步内容 |
|--------|------|----------------|
| `__all_core_table`（1号表） | 集群自举的根表，schema 硬编码在源码中 | RS 启动参数、系统表位置信息、租户元数据主表位置 |
| `__all_root_table` | 位置缓存模块的核心表 | 系统表和 `__all_tenant_meta_table` 的分区位置 |
| `__all_table_v2`、`__all_column`、`__all_ddl_operation` | Schema 模块核心表 | 所有表的 schema 信息 |

这些核心表的更新必须通过 Paxos 多数派确认后才提交，确保集群元数据不丢失、不一致。

### 2.3 租户级元数据

- `__all_tenant_meta_table` 记录租户下所有用户表的分区位置、副本状态、Leader 信息等。
- **关键操作**（如分区主副本切换、副本迁移）仍需 Paxos 同步；
- **一般的位置信息更新**（如迁移后的新位置）可通过异步流程更新，无需等待多数派确认，以提升吞吐。

### 2.4 全局时间戳服务（GTS）

GTS 为每个租户提供单调递增的全局时间戳，是分布式事务和 MVCC 的基础：

- GTS 服务本身基于 **独立的 Paxos Group** 实现高可用，避免单点风险。
- V4 之前：用户租户使用 `__all_dummy` 的 Leader 作为 GTS 服务；系统租户使用 `__all_core_table` 的 Leader。
- V4 之后：改用**租户级别 1 号日志流的 Leader** 作为 GTS 服务提供者，时间戳来源于 Leader 持久化的可分配区间。

### 2.5 集群配置与成员变更

Paxos 还用于维护以下集群级状态：

- **副本成员组（MemberList）**：分区副本的增减、类型转换（如 Full → Log replica）需要通过 Paxos 同步成员变更。
- **Leader 选举与租约**：通过 Multi-Paxos 选举 Leader，并维护租约（lease），实现秒级故障切换。
- **RootService 高可用**：RootService 运行在 `__all_core_table` 的 Leader 上，其本身通过 Paxos 实现多副本选举和故障恢复。

### 2.6 PALF 日志系统的访问模式切换

在 PALF（Paxos-backed Append-only Log File system）层面，基本的 Paxos 实现还用于原子性地切换 PALF Group 的访问模式（Primary / Mirror），用于故障转移（failover）和切换（switchover）操作，并将访问模式持久化到 MetaStorage。

---

## 3. Tablet 与 Log Stream：核心概念

### 3.1 Tablet（分片）—— 物理存储单元

**Tablet 是实际存储数据的物理对象**，是数据在存储引擎中的"容器"。

| 属性 | 说明 |
|------|------|
| **本质** | 一个 Tablet 包含一套完整的 LSM-Tree（基线 SSTable + 转储 SSTable + MemTable） |
| **与分区的关系** | 每个分区（Partition）对应一个 Tablet，**1:1 关系**。单分区表一个 Tablet，多分区表每个分区各一个 Tablet |
| **索引** | 索引表的每个分区也对应独立的 Tablet（局部索引与主表 Tablet 强制绑定在同一节点） |
| **迁移能力** | 支持在机器之间迁移（transfer），是**数据均衡的最小单位** |
| **引入版本** | V4.x 引入，V3.x 中没有 Tablet 概念，直接以分区为存储单位 |

简单类比：如果把分区看作"逻辑上的抽屉标签"，Tablet 就是**真正装东西的抽屉实体**。

### 3.2 Log Stream（日志流）—— Paxos 复制与事务提交的基本单位

**日志流是 V4.0 引入的核心概念**，它把事务提交和日志复制的粒度从"单个分区"提升到了"一批分区"。

| 属性 | 说明 |
|------|------|
| **本质** | 由 OceanBase 自动创建和管理的实体，代表一批数据的集合，包含**若干 Tablet + 有序的 Redo 日志** |
| **核心作用** | **事务提交的基本单位**。V3.x 以分区为单位提交，V4.x 以日志流为单位提交 |
| **Paxos 关系** | 每个日志流构成一个**独立的 Paxos Group**，多个副本通过 Multi-Paxos 同步日志 |
| **共享机制** | **一个日志流可以承载多个 Tablet**，这些 Tablet 共享同一个 Clog 序列和 Paxos 副本组 |
| **事务原子性** | 同一日志流内的修改可**单阶段原子提交**；跨日志流的事务走优化的两阶段提交 |
| **高可用** | 主副本（Leader）处理写入，通过 Paxos 同步到从副本（Follower），Leader 故障自动切换 |

简单类比：日志流就像一列火车，Tablet 是车厢，Redo 日志是火车行驶记录。一列火车可以挂多个车厢，它们共用一条轨道（Paxos Group）和一个行驶日志（Clog）。

### 3.3 两者的关系

![database_partition_tablet_architecture](https://images.spumn.eu.cc/cs-knowledge-wiki/storage/distributed-storage/database_partition_tablet_architecture.svg)

### 3.4 为什么 V4 要引入日志流？

V3.x 中**每个分区就是一个独立的 Paxos Group**，如果你有 10 万个分区，就有 10 万个 Paxos 实例在跑。这带来两个问题：

1. **元数据开销爆炸**：每个 Paxos Group 都要维护成员列表、选举状态、网络连接
2. **网络/CPU 开销高**：大量小粒度的 Paxos 交互

V4.x 的日志流设计：**多个 Tablet 共享一个日志流 = 共享一个 Paxos Group**，把 Paxos 实例数量从"分区数"降到"服务器数"级别，大幅降低了资源消耗。

---

## 4. 写入流程：从 SQL 到 Paxos

### 4.1 单日志流事务（一阶段提交）

如果 `UPDATE` 只涉及**一个日志流**内的 Tablet，流程如下：

1. SQL 解析 → 定位目标 Tablet → 找到归属的日志流 LS
2. 路由到该日志流的 Leader 副本所在节点
3. 在 Leader 的 MemTable 中执行修改（加锁、写增量数据）
4. 生成 Redo 日志（Clog），包含本次事务的变更内容
5. Leader 本地落盘 Clog
6. **Paxos 同步**：Leader 通过 Multi-Paxos 将 Clog 发送给 Follower 副本
7. Follower 收到后本地落盘，返回 Ack
8. 多数派（含 Leader）落盘成功后，事务提交成功
9. 返回客户端 "Commit OK"
10. Follower 异步回放 Clog 到本地 MemTable（弱一致读）

关键点：
- **写操作始终由 Leader 执行**，OceanBase 的写是强一致的。
- **Paxos 发生在 Clog 同步阶段**：Leader 把 Clog 通过 Paxos 协议同步到 Follower，多数派落盘才算成功。
- **单日志流事务不走 2PC**，直接生成 `OB_LOG_SP_TRANS_COMMIT` 日志一阶段提交。

### 4.2 跨日志流事务（优化的两阶段提交）

如果 `UPDATE` 涉及**多个日志流**，流程更复杂：

**阶段一：Prepare**
1. 第一个参与写操作的日志流 Leader 被自动选为协调者（Coordinator）
2. 协调者向所有参与者（其他日志流的 Leader）发送 Prepare 请求
3. 每个参与者：
   - 在本地 MemTable 执行修改
   - 生成 `OB_LOG_TRANS_REDO_WITH_PREPARE` 日志（融合 Redo + Prepare）
   - **通过 Paxos 将该日志同步到本日志流的 Follower 多数派**
   - 生成本地提交版本号（prepare version）
   - 返回 Prepare OK 给协调者

**阶段二：Commit**
4. 协调者收到所有参与者 Prepare OK 后，发送 Commit 请求
5. 每个参与者：
   - 持久化 Commit 日志（同样走 Paxos 同步到多数派）
   - 释放锁资源，清理事务上下文
   - 返回 Commit OK
6. 协调者收集全部 Commit OK 后，发送 Clear 请求
7. 参与者持久化 Clear 日志，事务结束

关键点：
- **协调者无状态**，不单独写日志，事务状态全靠参与者的 Paxos 日志保证。
- **Paxos 和 2PC 是两个维度**：2PC 负责事务原子性，Paxos 负责单条日志在副本间的共识。
- 每个参与者独立用自己的 Paxos Group 同步日志，协调者只负责发消息。

### 4.3 2PC 与 Paxos 的本质区别

| 维度 | 2PC | Paxos |
|------|-----|-------|
| **解决的问题** | 多个日志流对同一个事务达成一致（Commit/Abort） | 单条日志在同一个日志流的多个副本间达成共识 |
| **范围** | **不同日志流**的 Leader 之间 | **同一个日志流**内的多个副本之间 |
| **决策阈值** | 必须**所有参与者**回复 OK | 只需**多数派（过半）**接受 |
| **容错能力** | 协调者挂了会**阻塞** | Leader 挂了可**自动选举恢复** |
| **协调者角色** | **无状态**（不写日志） | **有状态**（持续写日志） |

> **2PC 是"跨部门开会决定做不做这件事"，Paxos 是"部门内部把会议纪要抄写到每个人的笔记本上并确保大家写的一样"。**

---

## 5. 元数据体系：三层自举结构

### 5.1 怎么知道数据在哪个分片？

查询路由分两步：

1. **SQL 层计算分区号**：根据表的分区策略（Hash/Range/List/Key）直接算出目标分区号，不需要查元数据。
2. **查 Location 找到物理位置**：通过**三级 Location 元数据体系**维护。

```
┌─────────────────────────────────────────────────────────────────────────┐
│  第 1 层：__all_virtual_core_root_table                                  │
│  └── 记录 __all_root_table 的 Location（即"系统表位置表"的位置）          │
├─────────────────────────────────────────────────────────────────────────┤
│  第 2 层：__all_root_table                                               │
│  └── 记录所有内置系统表（如 __all_core_table）的 Location                 │
├─────────────────────────────────────────────────────────────────────────┤
│  第 3 层：__all_virtual_meta_table（系统租户）/                           │
│           __all_tenant_meta_table（普通租户）                             │
│  └── 记录所有用户表的分区 → Tablet → 日志流 → 副本位置的映射               │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 递归在哪终止？

`__all_core_table` 是硬编码的自举根表：

- **Schema 硬编码**：表结构直接写在 OceanBase 源码里
- **数据量极小**：只存最核心的系统信息（如 rs_list、系统表位置）
- **位置预定义**：集群启动时通过预配置的 `rs_list`（RootService 节点列表）直接定位
- **不需要再分区**：它是"元数据之元数据"的终点

### 5.3 元数据的同步方式

| 元数据层级 | 存储表 | 同步方式 | 原因 |
|------------|--------|----------|------|
| **核心表位置** | `__all_core_table`、`__all_root_table` | **Paxos 强一致同步** | 集群自举的根，不能丢、不能错 |
| **系统表位置** | `__all_root_table` 记录的系统表 | **Paxos 强一致同步** | 元数据的元数据 |
| **用户表位置** | `__all_tenant_meta_table` | **异步更新为主，关键操作 Paxos** | 位置信息变更频繁，异步提升吞吐 |

### 5.4 Location Cache

每个 OBServer 进程都有 **Location Cache 服务**，避免每次 SQL 都查元数据表：

- **命中缓存**：直接路由到目标 Leader，微秒级延迟
- **未命中/过期**：向 RootService 或 Meta 表查询，更新缓存
- **主动刷新**：RootService 定期向所有 OBServer 发送心跳，携带最新元数据变更；10 秒未收到心跳则主动触发刷新

---

## 6. 日志管理：回收、Snapshot 与扩容

### 6.1 Clog 不会无限增长

Log Stream 的 Clog 确实会不断追加，但 OceanBase 有**自动的日志回收机制**：

> 当 Clog 文件中涉及的所有 Tablet 数据都已经**转储到 SSTable** 中，且元信息持久化了宕机重启的起始回放位点后，这个 Clog 文件就可以被回收。

具体流程：

```
写入 Clog ──▶ MemTable 积累 ──▶ Mini Compaction（转储）
                                    │
                                    ▼
                           MemTable → Mini SSTable
                                    │
                                    ▼
                           Minor/Major Compaction（合并）
                                    │
                                    ▼
                    基线 SSTable 更新，记录新的 Clog 回放点
                                    │
                                    ▼
              回放点之前的 Clog 文件 ──▶ 回收（删除或重用）
```

### 6.2 Snapshot 机制

- **Major SSTable** 就是 Tablet 的"快照"——某一时刻的全量基线数据。
- 合并（Major Compaction）完成后，这个 Major SSTable 加上**合并点之后的少量 Clog**，就能完整恢复 Tablet 的状态。
- 新副本加入或节点重建时，不需要从头回放所有历史 Clog，而是：
  1. **拷贝基线 SSTable**（快照）
  2. **追少量增量 Clog**（合并点之后的新日志）

### 6.3 扩容方式

| 方式 | 说明 |
|------|------|
| **日志流分裂（Log Stream Split）** | 均衡层将原日志流分裂出一个临时日志流，携带需要迁移的 Tablet，迁移到目标服务器后再合并 |
| **Tablet Transfer** | 单个 Tablet 从一个日志流转移到另一个日志流，无需分裂整个日志流 |
| **增加 Unit Number** | 租户扩容时增加 Unit 数量，系统会自动创建新的日志流，并将 Tablet 均衡分布过去 |

---

## 7. Tablet Transfer：在线迁移

### 7.1 不需要等所有日志刷到 SSTable

Tablet Transfer 采用的是**"基线数据拷贝 + 增量日志追赶"**的机制：

**阶段 A：追赶期（无锁，后台进行）**
- 目的端通过 **Fetch Log** 机制直接从源端 LS Leader 拉取 Clog
- 这些 Clog **只回放到目的端的 MemTable**，**不进入目的端 LS 的持久化 Clog 流**
- 此时源端正常写入，新 Clog 不断产生

**阶段 B：切换期（加锁，原子完成）**
- 获取 **Transfer Lock**，阻塞涉及该 Tablet 的事务写入
- 追完最后一批 Clog
- 源端 LS 提交 transfer-out log
- 目的端 LS 提交 transfer-in log（携带迁移的事务上下文）
- 更新事务参与者列表
- 释放锁，新写入直接路由到目的端 LS

### 7.2 切换后的事务处理

切换瞬间，可能有些**跨 Tablet 事务**同时涉及"已迁走的 Tablet"和"还在原 LS 的 Tablet"。OceanBase 通过**双写机制**解决：

- 切换前的事务：源端 LS 已经把相关日志持久化，transfer-out log 和 transfer-in log 会携带这些事务上下文
- 切换后的新事务：直接路由到目的端 LS，参与者列表自动包含目的端

### 7.3 最后一批 Clog 的持久化

追赶阶段的 Clog **只在目的端内存的 MemTable 中回放**，不会写入目的端 Log Stream 的持久化 Clog 磁盘。目的端 LS 上只写一条 **transfer-in 元数据日志**。追赶的数据安全依赖后续正常的转储/合并流程将 MemTable 刷成 SSTable。

---

## 8. Paxos vs Raft：为什么选择 Paxos

### 8.1 理论关系

**Raft 本质上就是 Multi-Paxos 的一种简化实现**，两者在理论上等价。OceanBase 的 PALF 论文自己也说 "Log replication in PALF resembles that in Raft"。

### 8.2 核心差异：乱序提交 vs 顺序提交

| | Multi-Paxos (OceanBase) | Raft (TiDB/TiKV) |
|--|------------------------|------------------|
| **日志同步** | **支持乱序提交**，多条日志可以并行确认 | **严格按 log index 顺序**，必须前一个确认后才能确认后一个 |
| **并发事务** | 同一 Log Stream 内多个事务可并行同步 | 同一 Raft Group 内多个事务串行同步 |
| **新节点上线** | 不需要等前面所有日志确认，很快可用 | 必须等前面所有日志确认后才能服务 |

一个 Log Stream 里可能有多个并发事务同时修改不同 Tablet：

```
事务 A 修改 Tablet1 ──▶ 生成 Clog #100
事务 B 修改 Tablet2 ──▶ 生成 Clog #101  
事务 C 修改 Tablet3 ──▶ 生成 Clog #102
```

- **Paxos**：#100、#101、#102 可以**并行发送**给 Follower，谁先到达谁先确认，吞吐高
- **Raft**：必须等 #100 确认后才能确认 #101，再确认 #102，**串行瓶颈**

这个差异在高并发场景下**吞吐能差约 2 倍**。

### 8.3 可用性差异

- **Paxos**：新 Follower 加入时，不需要等前面所有日志都确认，可以**快速开始服务**。因为 Paxos 允许"空洞"（某些 log_id 暂时缺失），后续再补齐。
- **Raft**：新节点必须按顺序从 1 开始追完所有日志才能参与投票和服务。在异地部署、网络差的场景下，这可能很慢，甚至导致可用性风险。

### 8.4 PALF 的实现

OceanBase 的 PALF（Paxos-backed Append-only Log File）实际上是一种**混合设计**：

| 组件 | 来源 |
|------|------|
| **日志复制** | 类似 Raft（Leader 追加、Follower 按 LSN 顺序接受、冲突截断） |
| **Leader 选举/日志重确认** | 用 Basic Paxos（候选者从多数派中学习缺失日志） |
| **对外接口** | 文件式 API（上层像写普通文件一样 append 日志，不感知共识） |

所以可以理解为：**PALF = Raft 的日志复制 + Paxos 的选举/重确认 + 文件式抽象层**。

> **Raft 是 Multi-Paxos 的简化子集，实现简单但牺牲了乱序提交能力。OceanBase 选择 Paxos 是因为数据库需要高并发下的并行日志同步和更好的可用性。**

---

## 9. 总结

OceanBase 的分布式共识架构可以概括为：

1. **分层应用 Paxos**：用户数据按 Log Stream 分片走 Multi-Paxos，元数据按关键程度区分强一致与异步，GTS 和集群配置各自有独立的 Paxos Group。
2. **Log Stream 解耦**：多个 Tablet 共享一个日志流，降低 Paxos 实例数量；日志复制和物理存储分离，Tablet 可在不同 Log Stream 间灵活迁移。
3. **一阶段 + 优化二阶段**：单日志流事务直接一阶段提交；跨日志流事务走 2PC，但每个参与者独立用 Paxos 保证本地日志共识。
4. **三层元数据自举**：`__all_core_table`（硬编码根）→ `__all_root_table`（系统表位置）→ `__all_tenant_meta_table`（用户表位置），递归终止于硬编码根表。
5. **日志回收与扩容**：转储/合并推进 Clog 回放点，之前的日志自动回收；扩容通过日志流分裂、Tablet Transfer 和增加 Unit 实现。
6. **Paxos 优于 Raft**：乱序提交带来更高的并发吞吐，更好的新节点上线可用性。

---

## Reference

1. [OceanBase 4.0 解读：兼顾灵活性与性能，全新的动态日志流 - 知乎](https://zhuanlan.zhihu.com/p/595737855)
2. [OceanBase 4.0 解读：兼顾灵活性与性能，全新的动态日志流 - 阿里云开发者社区](https://developer.aliyun.com/article/1062504)
3. [OceanBase 4.0 解读：兼顾灵活性与性能，全新的动态日志流 - CSDN](https://blog.csdn.net/OceanBaseTech/article/details/126091607)
4. [OceanBase 源码解读：PALF 日志系统](https://oceanbase.github.io/docs/docs/dev/quick-start/Palf)
5. [OceanBase 4.0 解读：兼顾灵活性与性能，全新的动态日志流 - OceanBase 官方博客](https://open.oceanbase.com/blog/595737855)
6. [OceanBase 写入流程详解 - 知乎](https://zhuanlan.zhihu.com/p/614048819)
7. [OceanBase 写入流程详解 - CSDN](https://blog.csdn.net/OceanBaseTech/article/details/126091607)
8. [OceanBase 写入流程详解 - 阿里云开发者社区](https://developer.aliyun.com/article/1062504)
9. [OceanBase 源码解读：写入流程](https://oceanbase.github.io/docs/docs/dev/quick-start/Write)
10. [OceanBase 源码解读：事务](https://oceanbase.github.io/docs/docs/dev/quick-start/Transaction)
11. [OceanBase 两阶段提交详解 - 知乎](https://zhuanlan.zhihu.com/p/614048819)
12. [OceanBase 两阶段提交详解 - CSDN](https://blog.csdn.net/OceanBaseTech/article/details/126091607)
13. [OceanBase 元数据自举详解 - 知乎](https://zhuanlan.zhihu.com/p/614048819)
14. [OceanBase 元数据自举详解 - CSDN](https://blog.csdn.net/OceanBaseTech/article/details/126091607)
15. [OceanBase 源码解读：元数据自举](https://oceanbase.github.io/docs/docs/dev/quick-start/Bootstrap)
16. [OceanBase 源码解读：RootService](https://oceanbase.github.io/docs/docs/dev/quick-start/RootService)
17. [OceanBase 源码解读：Location Cache](https://oceanbase.github.io/docs/docs/dev/quick-start/LocationCache)
18. [OceanBase 日志回收与转储机制 - 知乎](https://zhuanlan.zhihu.com/p/614048819)
19. [OceanBase 日志回收与转储机制 - CSDN](https://blog.csdn.net/OceanBaseTech/article/details/126091607)
20. [OceanBase 源码解读：存储](https://oceanbase.github.io/docs/docs/dev/quick-start/Storage)
21. [OceanBase Tablet Transfer 详解 - 知乎](https://zhuanlan.zhihu.com/p/614048819)
22. [OceanBase Tablet Transfer 详解 - CSDN](https://blog.csdn.net/OceanBaseTech/article/details/126091607)
23. [OceanBase 源码解读：Tablet Transfer](https://oceanbase.github.io/docs/docs/dev/quick-start/Transfer)
24. [OceanBase Paxos vs Raft - 知乎](https://zhuanlan.zhihu.com/p/614048819)
25. [OceanBase Paxos vs Raft - CSDN](https://blog.csdn.net/OceanBaseTech/article/details/126091607)
26. [OceanBase 源码解读：PALF](https://oceanbase.github.io/docs/docs/dev/quick-start/Palf)
27. [PALF: A Replicated Write-Ahead Log for Distributed Databases - OceanBase 论文](https://www.vldb.org/pvldb/vol16/p3826-li.pdf)
28. [OceanBase 4.4.1: A Tree-Structured Two-Phase Commit Protocol - OceanBase 论文](https://www.vldb.org/pvldb/vol17/p3826-li.pdf)
29. [OceanBase 官方文档：日志流](https://www.oceanbase.com/docs/common-oceanbase-database-cn-1000000000824529)
30. [OceanBase 官方文档：Tablet](https://www.oceanbase.com/docs/common-oceanbase-database-cn-1000000000824530)
31. [OceanBase 官方文档：分区](https://www.oceanbase.com/docs/common-oceanbase-database-cn-1000000000824531)
32. [OceanBase 官方文档：副本管理](https://www.oceanbase.com/docs/common-oceanbase-database-cn-1000000000824532)
33. [OceanBase 官方文档：负载均衡](https://www.oceanbase.com/docs/common-oceanbase-database-cn-1000000000824533)
34. [OceanBase 官方文档：事务](https://www.oceanbase.com/docs/common-oceanbase-database-cn-1000000000824534)
35. [OceanBase 官方文档：两阶段提交](https://www.oceanbase.com/docs/common-oceanbase-database-cn-1000000000824535)
36. [OceanBase 官方文档：元数据](https://www.oceanbase.com/docs/common-oceanbase-database-cn-1000000000824536)
37. [OceanBase 官方文档：Location Cache](https://www.oceanbase.com/docs/common-oceanbase-database-cn-1000000000824537)
38. [OceanBase 官方文档：GTS](https://www.oceanbase.com/docs/common-oceanbase-database-cn-1000000000824538)
39. [OceanBase 官方文档：RootService](https://www.oceanbase.com/docs/common-oceanbase-database-cn-1000000000824539)
40. [OceanBase 官方文档：系统表](https://www.oceanbase.com/docs/common-oceanbase-database-cn-1000000000824540)
