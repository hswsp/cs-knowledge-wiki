# PolarDB-X 架构深度解读

## 1. 整体架构概览

PolarDB-X 是阿里云自研的**云原生分布式数据库**，起源于阿里 TDDL/DRDS，历经天猫双十一核心交易链路验证。其采用 **Shared-Nothing + 存储计算分离** 架构，具备水平扩展、强一致分布式事务、HTAP 混合负载、金融级高可用、MySQL 全兼容等核心特性。

整体由四大核心组件构成：

| 组件 | 角色 | 状态 | 核心职责 |
|------|------|------|----------|
| **CN (Compute Node)** | 计算节点 | 无状态，可水平扩展 | SQL 解析、CBO 优化、分布式执行、2PC 协调、GSI 维护 |
| **DN (Data Node)** | 存储节点 | 有状态，X-Paxos 三副本 | 数据持久化、MVCC 存储、计算下推、Paxos 共识 |
| **GMS (Global Meta Service)** | 全局元数据服务 | 有状态（依赖 MetaDB） | 全局 Schema、拓扑、账号权限、TSO 全局时间戳 |
| **CDC (Change Data Capture)** | 日志节点 | 有状态 | 生成兼容 MySQL Binlog 格式的增量日志，下游订阅 |

![PolarDB-X 整体架构](https://images.spumn.eu.cc/polardbx-architecture/01-overall-architecture.excalidraw.svg)

### 设计要点

- **CN 无状态**：任意 CN 可处理任意请求，通过负载均衡水平扩展，故障不丢数据。
- **DN 三副本**：基于 X-Paxos（阿里改进版 Multi-Paxos），实现 RPO=0 的金融级高可用，角色包括 Leader/Follower/Logger。
- **GMS 作为分布式大脑**：维护全局强一致元数据，并通过 Timestamp Oracle (TSO) 提供全局单调递增时间戳，是 MVCC 与分布式事务的基石。
- **计算下推**：Project/Filter/Join/Agg 等算子尽可能下推到 DN 执行，减少网络传输。
- **HTAP**：列存节点 (IMCI) + MPP 并行执行，在同一实例内承载 TP/AP 混合负载，CPU quota 与资源池强隔离。

---

## 2. 四大核心组件

### 2.1 CN（Compute Node，计算节点）

CN 是 SQL 引擎层，对应本仓库 `polardbx-sql` 的全部代码。核心功能：

1. **接入层**：`polardbx-net` 基于自研 NIO（类似 Cobar/Reactor 模型）实现 MySQL 协议前端接入。
2. **SQL 处理**：`polardbx-parser`（FastSQL，基于 Druid fork）→ `polardbx-optimizer`（基于 Apache Calcite 深度定制的 CBO）→ `polardbx-executor`（Cursor 算子迭代器模型）。
3. **分布式事务协调**：`polardbx-transaction` 作为 2PC 协调者，处理 Prepare/Commit/Rollback。
4. **分片路由**：`polardbx-rule` 基于 Groovy 动态表达式计算分片。
5. **DN 通信**：`polardbx-rpc` 采用自研 X 协议（Protobuf + NIO），支持单 TCP 多路复用 (XSession)、流水线 (pipelining)、Plan Cache、Chunk 列式结果、流控 token。
6. **企业级能力**：SQL 限流、Baseline、GSI、Online DDL（DAG 引擎）、三权分立、TDE、Flashback Query。

![CN 计算节点内部模块数据流](https://images.spumn.eu.cc/polardbx-architecture/02-cn-internal-modules.excalidraw.svg)

### 2.2 DN（Data Node，存储节点）

> DN 代码位于独立的 `galaxyengine` 仓库（MySQL 分支 + X-Paxos 插件），本仓库 (`polardbx-sql`) 通过 `polardbx-rpc` 与之通信。

DN 核心特性：

- **X-Paxos 共识**：基于强 leadership 的 Multi-Paxos，支持 Leader/Follower/Logger/Learner 角色；日志模块独立化，支持高吞吐。
- **MVCC 多版本存储**：InnoDB 引擎 + 全局时间戳，支持 RC/RR 隔离级别下的快照读。
- **计算下推**：Project/Filter/Join/Agg 算子直接在 DN 执行，降低 CN 压力。
- **列存索引 (IMCI/CCI)**：列存节点提供列存快照，支撑 MPP 复杂分析。
- **二级索引前缀压缩**：InnoDB 二级索引的 (SK, PK) 元组前缀压缩优化，降低存储放大。

### 2.3 GMS（Global Meta Service，全局元数据服务）

GMS 是整个分布式系统的"大脑"，其本身是一个特殊的 CN 角色，通过 **MetaDB**（基于 DN 的一组系统表）持久化元数据。

| 子模块 (`polardbx-gms`) | 核心类 | 职责 |
|---|---|---|
| 拓扑管理 | `DbTopologyManager`, `DbGroupInfoManager`, `DbInfoManager` | 逻辑库、分片组 (dbGroup)、存储实例映射 |
| 表元数据 | `TableInfoManager` | tables/columns/indexes/table_partitions/table_groups 等系统表 CRUD |
| TSO | `ClusterTimestampOracle`, `LocalTimestampOracle` | 全局时间戳分配 |
| 权限 | `PolarPrivManager` | 账号/库/表/列级权限缓存，GRANT/REVOKE |
| CN 发现 | `GmsNodeManager` | 通过 `server_info` 系统表注册/发现集群内 CN 节点 |
| DN HA | `StorageHaManager`, `StorageInstHaContext` | 探测 DN leader 切换、维护可用地址 |
| 配置变更通知 | `MetaDbConfigManager` | 基于 dataId/opVersion 的配置推送（替代 Diamond） |
| 跨 CN 同步 | `IGmsSyncManager` | 广播动作到其他 CN，用于缓存刷新 |

GMS 通过 `MetaDbDataSource`（单例）维护到 meta-db DN 的 X 协议连接池。元数据变更通过 dataId 监听机制**推送**到所有 CN，无需轮询。

### 2.4 CDC（Change Data Capture，日志节点）

CDC 负责生成全局一致的增量日志，完全兼容 MySQL Binlog 格式与协议，Canal、Debezium、DTS 等生态工具可无缝对接，无需改造。

---

## 3. 源码模块划分与 Maven 结构

`polardbx-sql` 采用 Maven 多模块组织，GroupId = `com.alibaba.polardbx`：

```
polardbx-sql/
├── polardbx-common/       # 公共工具、类型系统、JDBC 抽象、Properties、异常
├── polardbx-net/          # MySQL 前端协议（NIO、Packet 编解码、认证）
├── polardbx-parser/       # SQL 解析（FastSQL，Druid fork），AST
├── polardbx-calcite/      # Apache Calcite 1.11 定制版，关系代数核心
├── polardbx-rule/         # 分片规则引擎、Groovy 路由、Comparative 条件树
├── polardbx-gms/          # 全局元数据服务（拓扑/表/权限/TSO/HA）
├── polardbx-optimizer/    # CBO 优化器（逻辑/物理计划、代价模型、RBO/CBO 规则）
├── polardbx-executor/     # 执行器（Cursor 算子、DDL DAG 引擎、GSI、DDL 新引擎）
├── polardbx-transaction/  # 事务（TSO/XA 2PC、MVCC、死锁检测、事务日志）
├── polardbx-rpc/          # 后端 DN X 协议通信（XClient/XSession/连接池/结果集）
├── polardbx-server/       # 服务入口（TddlServer、ServerConnection、Session）
├── polardbx-orc/          # ORC 列式存储读写（列存索引支持）
└── polardbx-orc-tools/    # ORC 工具
```

### 模块依赖总览

```
polardbx-server
   ├──> polardbx-net            (MySQL 前端协议)
   ├──> polardbx-parser         (SQL 解析)
   ├──> polardbx-optimizer ─┬──> polardbx-calcite  (关系代数)
   │                        ├──> polardbx-rule     (分片规则)
   │                        ├──> polardbx-gms      (元数据)
   │                        └──> polardbx-common
   ├──> polardbx-executor ──┬──> polardbx-transaction (事务)
   │                        ├──> polardbx-rpc         (DN X 协议)
   │                        └──> polardbx-gms
   └──> polardbx-common  (被所有模块依赖)
```

---

## 4. SQL 执行全链路

SQL 处理流程如下图所示：

![SQL 执行全链路](https://images.spumn.eu.cc/polardbx-architecture/03-sql-execution-flow.excalidraw.svg)

```
    客户端
       │  TCP (MySQL 协议)
       ▼
    NIOAcceptor ─ NIOProcessor ─ NIOReactor   (Reactor 多线程模型)
       │  MySQL Packet 编解码 (Handshake/Auth/COM_QUERY)
       ▼
    FrontendConnection ─ FrontendCommandHandler
       │
       ▼
    ServerConnection / ServerQueryHandler / ServerSession
       │  SQL 字节串
       ▼
    ┌───────────────── polardbx-parser ─────────────────┐
    │  Lexer (词法) → Token 流                           │
    │  MySqlStatementParser (语法) → SQLObject (AST 树) │
    └───────────────────────────────────────────────────┘
       │  AST
       ▼
    ┌──────────────── polardbx-optimizer ────────────────┐
    │  SqlConverter      : AST(Druid) → SqlNode(Calcite) │
    │  TddlValidator     : 语义校验、绑定 Schema          │
    │  逻辑优化 (RBO)    : 谓词下推/常量折叠/列裁剪       │
    │  TddlRule+Sharding : 分片谓词提取 → MatcherResult   │
    │  物理优化 (CBO)    : 代价模型 + Join 重排            │
    │  实现规则          : 逻辑算子 → 物理算子            │
    │  PlanCache         : SQL Digest 命中则复用计划      │
    │  输出 ExecutionPlan: RelNode 物理树 + CursorMeta    │
    └───────────────────────────────────────────────────┘
       │  物理计划
       ▼
    ┌──────────────── polardbx-executor ─────────────────┐
    │  PlanExecutor      : RelNode 树 → Cursor 算子树    │
    │  Cursor 实现:                                        │
    │    - LogicalViewResultCursor (下发多 DN 并行查询)   │
    │    - GatherCursor (汇聚)                            │
    │    - MergeSortCursor (有序归并排序)                 │
    │    - HashJoin / SortMergeJoin / BKAJoin             │
    │    - HashAgg / SortAgg                              │
    │  DDL 新引擎: DAG (DirectedAcyclicGraph) 调度        │
    │  IGroupExecutor: 跨分组执行                         │
    └───────────────────────────────────────────────────┘
       │  下推 SQL (每分片一条)
       ▼
    ┌──────────────── polardbx-rpc ──────────────────────┐
    │  XConnectionManager (单例全局连接池)                │
    │  XClientPool        (单 DN 连接池, RR)              │
    │  XClient            (TCP 连接, 多 XSession 复用)   │
    │  XSession           (逻辑会话, 流水线, Plan Cache) │
    │  XResult            (结果集游标, 行/Chunk, 流控)    │
    └───────────────────────────────────────────────────┘
       │  X 协议 (Protobuf + NIO)
       ▼
    DN (MySQL/X-Paxos) → 本地执行 → 返回结果
       │
       ▼
    结果聚合 (Gather/Join/Agg) → MySQL ResultSet → 客户端
```

### 关键优化点

- **PlanCache**：按 SQL Digest + 参数缓存执行计划，避免重复优化。
- **X 协议流水线 (pipelining)**：同一 XSession 上通过 `XResult.previous` 链表链式流水，前一个结果未读完即可发送下一个请求；结合 Galaxy 协议 `EXPECT_OPEN/EXPECT_CLOSE` 批量忽略 SET 等语句。
- **分片并行下发**：`LogicalViewResultCursor` 并发向多个 DN 发 SQL，`GatherCursor` 汇聚结果。
- **Chunk 模式**：列式批量返回（Protobuf `PolarxResultset.Chunk`），`BlockDecoder` 按列解码（SINT/bytes/DATETIME/DECIMAL 等专用 decoder），减少反序列化开销。
- **算子下推**：LogicalView 对应的物理算子 `PhyTableOperation`/`PhyQueryOperation` 将 Filter/Project/Limit 等下推到 DN。
- **惰性事务标记**：XSession 的 `lazyUseCtsTransaction/lazySnapshotSeq/lazyCommitSeq` 等字段随下一条 SQL 一起下发，减少 RTT。

---

## 5. 分布式事务：TSO + MVCC + 2PC

PolarDB-X 事务模型如下图所示：

![分布式事务时序图 (TSO+2PC)](https://images.spumn.eu.cc/polardbx-architecture/04-distributed-transaction.excalidraw.svg)

### 5.1 事务类型 (`polardbx-transaction`)

| 事务类 | 说明 |
|---|---|
| `TsoTransaction` | TSO 强一致分布式事务（MVCC + 2PC，默认） |
| `ReadOnlyTsoTransaction` | TSO 只读事务（只取 snapshot_ts，无锁快路径） |
| `AutoCommitTsoTransaction` / `AutoCommitSingleShardTsoTransaction` | AutoCommit 优化路径（单分片一阶段提交） |
| `XATransaction` / `XATsoTransaction` | 标准 XA 2PC |
| `AsyncCommit` 事务 | commit 日志异步持久化，客户端快速返回 |

事务类型枚举：`TransactionType`，事务状态：`TransactionState` (STARTED/COMMITTED/ABORTED/...)。

### 5.2 TSO（Timestamp Oracle）

- `ClusterTimestampOracle`：集群模式下通过 MetaDB leader 节点获取全局单调递增时间戳（保证跨 CN 全局有序）。
- `LocalTimestampOracle`：本地模式（测试/单机）。
- 时间戳语义：`snapshot_ts`（快照读时间点）与 `commit_ts`（提交时间点）是 MVCC 与 RC/RR 隔离级别的基础。

### 5.3 2PC 提交流程（TSO 事务）

1. **BEGIN**：CN 创建 `TsoTransaction` 上下文。
2. **获取 snapshot_ts**：CN 向 GMS/TSO 请求全局时间戳，作为 MVCC 快照读视图。
3. **执行 DML**：SQL 经 parser/optimizer/executor 路由到对应 DN，DN 以 snapshot_ts 做快照读，写入本地事务缓冲。
4. **COMMIT 触发**：
   - CN 向 GMS/TSO 请求 `commit_ts`。
   - CN 将事务状态 (prepare) 持久化到 `GlobalTxLog`（MetaDB 系统表）。
   - CN 向所有参与分片的 DN 发送 `XA Prepare(commit_ts)`。
   - DN 返回 Prepare OK。
5. **提交阶段**：
   - CN 将 GlobalTxLog 更新为 COMMIT（崩溃恢复依据）。
   - CN 向所有 DN 发送 `XA Commit`。
   - DN 返回 Commit OK，CN 返回 OK 给客户端。

### 5.4 关键优化与机制

- **一阶段提交**：单分片写操作时跳过 Prepare 直接 Commit，少 1 次 RTT。
- **只读事务快路径**：`ReadOnlyTsoTransaction` 只取 snapshot_ts，不加锁、不写事务日志。
- **异步提交 (Async Commit)**：commit 日志异步持久化，客户端更早收到 OK。
- **死锁检测**：`DeadlockManager` 周期采集全局 wait-for 图，检测分布式死锁并回滚。
- **崩溃恢复**：`GlobalTxLogManager` 在 CN 重启时根据 MetaDB 中的事务日志做 XA Recover，提交/回滚未决事务。
- **MVCC 快照读**：读操作以 `snapshot_ts` 为界，只看该时间点之前已提交的版本，读写不阻塞。

---

## 6. 分片路由与规则引擎

分片是 PolarDB-X 水平扩展的核心，由 `polardbx-rule` 模块负责。

### 6.1 核心抽象

| 类 | 职责 |
|---|---|
| `TddlRule` | 规则引擎入口（单 schema 级别），提供 `route()` 方法 |
| `VirtualTableRoot` | 一张 schema 下所有 TableRule 的版本化快照 |
| `TableRule` | 单表分库分表规则，持有 Groovy 表达式、虚拟节点映射 |
| `Rule<T>` | 分片规则最核心抽象，提供 `eval()` 与 `calculate()` 方法 |
| `GroovyRule<T>` | 基于 GroovyClassLoader 动态编译分片表达式（如 `(id.intValue() % 16).intdiv(4)`） |
| `EnumerativeRule<T>` | 描点枚举处理范围条件（id > 100 AND id < 200） |
| `VirtualTableRuleMatcher` | 真正执行匹配，返回路由结果 |

### 6.2 关键数据结构

| 类 | 说明 |
|---|---|
| `Comparative` | 比较树节点，表达 SQL WHERE 的 AND/OR/比较条件 (=, >, <, >=, <=, <>)，支持 `ComparativeAND/OR/BaseList` |
| `MatcherResult` | 路由结果：`List<TargetDB>` + 参与计算的条件 |
| `TargetDB` | 单目标 DN：`dbIndex` (group key) + `Map<String,Field> tableNames` |
| `Field` | 源-目标字段映射（带枚举值，标记具体参数） |
| `TableSlotMap` / `DBTableMap` | 虚拟节点映射：slot → (db, tbl) |

### 6.3 路由流程

1. 优化器从 WHERE 条件中提取分片键上的条件，构建 `Comparative` 树。
2. `VirtualTableRuleMatcher.match()` 根据分片键选择 TableRule 对应的 Rule。
3. 等值条件直接走 `GroovyRule.eval()`；范围条件走 `EnumerativeRule.calculate()` 枚举再求交集。
4. 结果为 `MatcherResult`（多个 `TargetDB`），交给执行器并行/串行下发。
5. 支持广播表、单表、同分片键 Co-located JOIN 等特殊路由策略。

---

## 7. 核心数据结构索引

按模块整理最核心的类与数据结构，便于源码阅读时快速定位：

### 7.1 polardbx-net（MySQL 前端 NIO）

| 类 | 路径关键词 | 作用 |
|---|---|---|
| `NIOAcceptor` | `com.alibaba.polardbx.net.NIOAcceptor` | 前端 TCP 接入，`OP_ACCEPT` 事件，轮询分配给 NIOProcessor |
| `NIOProcessor` | `...net.NIOProcessor` | Reactor 处理单元，持有 NIOReactor、BufferPool、连接 map |
| `NIOReactor` | `...net.NIOReactor` | R/W 双 reactor 线程，Selector + 阻塞队列 |
| `FrontendConnection` | `...net.FrontendConnection` | MySQL 前端连接抽象，持有 handler 状态机 |
| `FrontendAuthenticator` / `FrontendCommandHandler` | `...net.handler` | NIOHandler 状态模式实现：认证 / 命令分发 |
| `HandshakePacket` / `OkPacket` / `ErrorPacket` / `EOFPacket` / `RowDataPacket` | `...net.packet` | MySQL 协议报文 |

### 7.2 polardbx-server（服务入口）

| 类 | 路径关键词 | 作用 |
|---|---|---|
| `TddlServer` | `com.alibaba.polardbx.server.TddlServer` | 服务启动主类 |
| `ServerConnection` | `...server.ServerConnection` | 前端连接在 server 层的实现，持有 Session |
| `ServerQueryHandler` | `...server.handler.ServerQueryHandler` | COM_QUERY 分发入口，调用 Planner/PlanExecutor |
| `ServerSession` | `...server.ServerSession` | 会话状态（变量、事务、字符集、预编译语句） |
| `ServerConnectionFactory` | `...server.ServerConnectionFactory` | 注入 PolarPrivileges、Handler 等到 FrontendConnection |

### 7.3 polardbx-parser（SQL 解析）

| 类 | 作用 |
|---|---|
| `SQLObject` (interface) | AST 节点根接口，`accept(visitor)` |
| `SQLStatement` | SQL 语句 AST 基类 |
| `SQLExpr` | SQL 表达式基类 |
| `Lexer` / `MySqlLexer` | 词法分析器，SQL → Token 流 |
| `SQLParser` / `MySqlStatementParser` | 语法分析器，Token 流 → AST |
| `SQLASTVisitor` | AST Visitor 模式 |

### 7.4 polardbx-optimizer（CBO 优化器）

| 类 | 作用 |
|---|---|
| `Planner` | 优化器主入口（~2900 行），调度解析→校验→逻辑→物理优化 |
| `SqlConverter` | Druid AST → Calcite SqlNode |
| `TddlValidator` | SQL 语义校验（扩展 Calcite SqlValidator） |
| `ExecutionPlan` | 优化结果封装：`RelNode plan` + `CursorMeta` + 分片信息 |
| `PlanCache` | 执行计划缓存（按 SQL Digest + 参数匹配） |
| `OptimizerContext` / `PlannerContext` / `ExecutionContext` | 各级上下文 |
| `LogicalView` / `LogicalModify` / `LogicalIndexScan` / `Gather` | 核心逻辑算子 |
| `PhyTableOperation` / `PhyQueryOperation` | 物理算子（下推到 DN） |
| `HashJoin` / `SortMergeJoin` / `BKAJoin` / `BushyJoin` / `HashGroupJoin` | Join 物理算子 |
| `HashAgg` / `SortAgg` / `HashWindow` / `SortWindow` | 聚合/窗口算子 |
| `DrdsRelOptCostImpl` / `DrdsRelMdCost` / `CostModelWeight` | 代价模型 |
| `DrdsConvention` / `MppConvention` | 执行约定（普通 / MPP 列存） |

### 7.5 polardbx-rule（分片规则）

| 类 | 作用 |
|---|---|
| `TddlRule` | 规则引擎入口，`route()` 返回 MatcherResult |
| `VirtualTableRoot` | schema 级别规则快照（多版本） |
| `TableRule` | 单表分片规则（~1700 行） |
| `GroovyRule<T>` | Groovy 动态表达式规则 |
| `Comparative` / `ComparativeAND/OR/BaseList` | 条件树 |
| `MatcherResult` / `TargetDB` / `Field` | 路由结果结构 |

### 7.6 polardbx-executor（执行器）

| 类 | 作用 |
|---|---|
| `PlanExecutor` | 物理计划 → Cursor 算子树 |
| `ExecutorContext` | 执行器全局上下文 |
| `IGroupExecutor` / `TddlGroupExecutor` | 分组执行器 SPI 及实现 |
| `Cursor` (interface) / `AbstractCursor` | 游标接口（`open/next/close`） |
| `LogicalViewResultCursor` | 分片表结果游标，下发多 DN 并合并 |
| `GatherCursor` / `MergeSortCursor` / `GroupConcurrentUnionCursor` | 汇聚/排序/并发联合 |
| `DdlEngineScheduler` / `DirectedAcyclicGraph` / `TaskScheduler` | DDL 新引擎 DAG 调度 |
| `TAtomDataSource` | 单物理数据库连接池抽象 |

### 7.7 polardbx-transaction（事务）

| 类 | 作用 |
|---|---|
| `TransactionManager` | 事务管理器核心（创建/提交/回滚/purge/死锁检测/XA 恢复） |
| `TsoTransaction` / `ReadOnlyTsoTransaction` / `XATransaction` | 各事务类型实现 |
| `ClusterTimestampOracle` / `LocalTimestampOracle` | TSO 实现 |
| `GlobalTxLogManager` | 全局事务日志持久化 |
| `DeadlockManager` | 分布式死锁检测 |
| `TransactionType` / `TransactionState` | 事务类型与状态枚举 |

### 7.8 polardbx-gms（元数据）

| 类 / Record | 作用 |
|---|---|
| `MetaDbDataSource` | 单例元数据库数据源 |
| `DbTopologyManager` | 库/分片拓扑管理（~2770 行） |
| `TableInfoManager` | 表元数据访问器（~3200 行） |
| `PolarPrivManager` | 权限管理（单例） |
| `GmsNodeManager` | CN 节点发现 |
| `StorageHaManager` / `StorageInstHaContext` | DN HA 切换探测 |
| `MetaDbConfigManager` | 配置变更 dataId 推送 |
| `DbInfoRecord` / `DbGroupInfoRecord` / `StorageInfoRecord` / `TablesRecord` / `TablePartitionRecord` | 对应 MetaDB 系统表行对象 |

### 7.9 polardbx-rpc（X 协议 DN 通信）

| 类 | 作用 |
|---|---|
| `XConnectionManager` | 全局单例连接管理器，`Map<String, XClientPool>` |
| `XClientPool` | 单 DN 实例连接池（RR 选 client、idleSessions 复用） |
| `XClient` | 一条到 DN 的 TCP 连接，多路复用 XSession（~850 行） |
| `XSession` | 逻辑会话，SQL 执行/流水线/结果集（~2600 行） |
| `XConnection` | JDBC Connection 适配器，包装 XSession，加读写锁 |
| `XResult` | 结果集游标（行模式/Chunk 模式/流控 token） |
| `XResultObject` / `BlockDecoder` | Chunk 列化解码 |
| `XPacket` / `XPacketQueue` / `XPacketBuilder` | 协议包（sid/type/protobuf） |
| `XPreparedStatement` | JDBC PreparedStatement，支持 Galaxy Prepare |
| `NIOClient` / `NIOReactor` / `NIOWorker` | 自研后端 NIO 网络层 |

---

## 8. 模块依赖关系

```
                ┌───────────────────────────────────────────┐
                │              polardbx-server               │
                │  TddlServer / ServerConnection / Session   │
                └───────┬─────────────┬──────────────┬───────┘
                        │             │              │
                        ▼             ▼              ▼
              ┌─────────────┐ ┌──────────────┐ ┌─────────────┐
              │polardbx-net │ │polardbx-parser│ │polardbx-    │
              │NIO/MySQL    │ │FastSQL AST   │ │optimizer    │
              │Protocol     │ │              │ │Calcite CBO  │
              └─────────────┘ └──────────────┘ └──┬──┬──┬─────┘
                                                   │  │  │
                                 ┌─────────────────┘  │  └─────────────┐
                                 ▼                    ▼                ▼
                        ┌─────────────┐    ┌──────────────┐   ┌──────────────┐
                        │polardbx-    │    │polardbx-rule │   │polardbx-gms  │
                        │calcite      │    │分片/Groovy   │   │元数据/TSO/HA │
                        └─────────────┘    └──────────────┘   └──────────────┘
                                 │
                                 ▼
                       ┌───────────────────┐
                       │ polardbx-executor │
                       │ Cursor / DDL DAG  │
                       └──┬────────────┬───┘
                          │            │
                          ▼            ▼
              ┌─────────────────┐ ┌─────────────────┐
              │polardbx-        │ │polardbx-rpc     │
              │transaction      │ │XClient/XSession │
              │2PC/TSO/MVCC     │ │X协议/连接池     │
              └─────────────────┘ └─────────────────┘
                          │            │
                          └─────┬──────┘
                                ▼
                     ┌─────────────────────┐
                     │   polardbx-common   │
                     │ 类型/JDBC/工具/配置 │
                     └─────────────────────┘
                                ▲
                                │ (所有模块依赖)
```

---

## 9. X-Paxos 共识算法详解

PolarDB-X 的存储节点 DN 采用阿里巴巴自研的 **X-Paxos** 作为副本一致性协议，是 DN 多副本高可用的核心。X-Paxos 起源于 AliSQL（阿里内部 MySQL 分支），源码位于独立的 `galaxyengine` 仓库 `extra/IS/consensus` 目录（核心文件 `paxos.h` 806 行 + `paxos.cc` 4357 行），包含 `algorithm/`、`net/`、`protocol/`、`service/`、`log/` 等子模块，已连续多年在天猫双十一万亿级流量场景验证。

![X-Paxos 副本协议](https://images.spumn.eu.cc/polardbx-architecture/05-x-paxos.excalidraw.svg)

### 9.1 X-Paxos 是 Raft 的工程化变体（不是 Basic Paxos）

读完 `paxos.h`/`paxos.cc` 结论很明确：**X-Paxos 是 Raft 协议的工程化变体**。文件名沿用"Paxos"是历史命名（立项时 Paxos 是学术界主流术语，Raft 2014 年才发表），理论上 Raft 等价于"强 Leadership 优化的 Multi-Paxos"，但代码实现完全是 Raft 风格：

- 状态机四态 `FOLLOWER/CANDIDATE/LEADER/LEARNER`（`paxos.h:142-149`）；
- 消息只有两类：**RequestVote / RequestVoteResponce** 和 **AppendLog / AppendLogResponce**（AppendLog 即 Raft 的 AppendEntries，`paxos.cc:1603/1897`）；
- **没有** Basic Paxos 的 Prepare/Promise/Accept/Accepted 消息，也**没有** `promisedPN/acceptedPN/acceptedValue` 字段；
- 投票判断用 `(lastLogTerm, lastLogIndex)` 字典序（`paxos.cc:1687-1689`），即 Raft §5.4.1；
- commitIndex 推进取 `quorumMin(matchIndex)` 且要求 `log[N].term == currentTerm`（`paxos.cc:3351-3378`），即 Raft §5.4.2。

### 9.2 与论文版 Raft 的工程差异

| 维度 | Raft 论文 | X-Paxos 实现（代码位置） |
|---|---|---|
| 消息名 | AppendEntries / RequestVote | **AppendLog** / RequestVote（字段一致，重命名） |
| Leader 租约 | ReadIndex/LeaseRead | **epoch 逻辑时钟** + `forceSync` 强同步节点约束（`paxos.cc:3840-3879`） |
| 选举权重 | 未规定 | `electionWeight` 通过 `electionTimer_->setRandWeight()` 调节超时权重（`paxos.h:459`），权重越高越先发起选举，Leader 常驻主机房 |
| 粘性 Leader | 无 | FOLLOWER 在 election timer stage 0（刚收到心跳）时拒绝非 `force` 的投票，避免抖动（`paxos.cc:1700-1716`） |
| Leader Transfer | §3.10 提到未详述 | 显式 `LeaderCommand(LeaderTransfer)`，目标日志追上后带 `force=1` 发起选举（`paxos.cc:2917-2942`）；当选后发现更高权重节点自动让位（`electionWeightAction` L4008） |
| 成员变更 | Joint Consensus（双多数派） | **单节点变更**（每次只加/减一个，新节点先 Learner catch-up，`paxos.cc:940-970`） |
| 日志类型 | 统一 Log Entry | Consensus 元信息以 Event 形式嵌入 MySQL Binlog（见 9.4） |
| Follower 回退 | conflictTerm/conflictIndex 快退 | -1 递减 + Follower 返回 lastLogIndex 一次跳变（`paxos.cc:2789-2802`） |
| 乱序日志 | 不允许 | `logRecvCache_` 支持当前 term 内日志空洞缓存（`paxos.h:727`） |
| forceSync 跨 AZ | 无 | commitIndex 除多数派 matchIndex 外，还须 ≥ 所有 forceSync 节点的最小 matchIndex（`paxos.cc:3366-3373`），跨 AZ 保证主机房写不丢 |
| 额外角色 | Learner | 多了 **Logger**（投票 + 持日志 + 不回放状态机，跨域降本） |

### 9.3 角色模型

| 角色 | 投票权 | 数据持久化 | 状态机回放 | 典型职责 |
|---|---|---|---|---|
| **Leader** | ✅ | ✅ PaxosLog + Binlog | ✅ | 唯一写入；广播日志；多数派 Ack 后提交 apply |
| **Follower** | ✅ | ✅ PaxosLog + Binlog | ✅ 异步回放 | 参与投票；日志落盘才 Ack；可当选 Leader；可做 Follower Read |
| **Logger** | ✅ | ✅ 仅 PaxosLog | ❌ | 只投票 + 存日志；跨域容灾代 Follower 节省带宽/CPU；补齐日志可在线升级 Follower |
| **Learner** | ❌ | 异步订阅日志 | 按需回放 | 不参与多数派；只读实例 / CDC / 备副本 |

集群副本数 **2n+1** 容忍 n 故障。典型部署：
- 1 Leader + 1 Follower + 1 Logger（3 副本，单 AZ）
- 1 Leader + 2 Follower（3 副本，同城三可用区）
- 1 Leader + 2 Follower + 2 Logger（5 副本，两地三中心，Logger 放异地）

### 9.4 三种日志：Binlog / PaxosLog / Consensus Log

| 名称 | 层级 | 含义 |
|---|---|---|
| **Binlog** | MySQL 原生 | Server 层逻辑变更日志，记录事务修改内容（Row/Statement/Mixed），用于复制/恢复/CDC |
| **PaxosLog** | 抽象概念 | "被多数派确认、不可篡改的有序日志条目序列"，即 Raft 论文的 `Log Entry[(index, term, value)]` |
| **Consensus Log** | X-Paxos 物理实现 | PaxosLog 的落地形式。X-Paxos 不写独立日志文件，而是把共识元信息以 Event 形式嵌进 MySQL Binlog：节点是 Leader 时本地 binlog 就是权威 PaxosLog；Follower 直接把从 Leader 收到的日志写进本地 binlog（省去 relay log 中转和 `log-slave-updates` 重写）。一份物理文件，Leader/Follower/Logger 角色决定如何使用 |

4 类 Consensus 相关 Event/Entry：

| Event | 位置 | 作用 |
|---|---|---|
| Consensus Log Event | 每个事务 Anonymous_GTID 之前 | 记录事务的 `index`、`term`、`flag` |
| Previous Consensus Index Event | 每个 binlog 文件开头 | 标记文件起始事务 index，重启/切换时快速定位 |
| Consensus Cluster Info Event (`optype=kConfigureChange`) | 成员变更时 | 记录新成员完整配置（单节点变更载体） |
| Empty Log Entry (no-op) | 新 Leader 当选时立即写入 | 普通空条目（非特殊 Event 类型），`log_->getEmptyEntry()` 创建（L1364），用于隐式提交前任 term 日志 |

**一句话**：物理上只有一份 binlog 文件，抽象成有序 `(index, term, value)` 序列即为 PaxosLog，value 是 Binlog 事务片段，元信息通过 Consensus Event 嵌入。相比传统 MySQL 主备（主 binlog + relay log + 备 binlog 三份）零冗余。

### 9.5 完整例子：一个值如何达成共识

3 节点 `{A, B, C}`（容忍 1 故障），事务 `UPDATE t SET balance = balance - 100 WHERE id = 1` 写入 Consensus Log 的 `index=5`。每节点维护 `currentTerm / log[] / commitIndex / lastApplied`，Leader 额外维护每个 peer 的 `matchIndex[] / nextIndex[]`。

#### 9.5.1 初始状态

term=1，A 是 Leader，持有有效 Lease，index=1..4 已提交：
```
A (Leader): log=[(1,1,X)..(4,1,X)], commitIndex=4, matchIndex=[B→4, C→4]
B (Follower): log=[(1,1,X)..(4,1,X)], commitIndex=4
C (Follower): log=[(1,1,X)..(4,1,X)], commitIndex=4
```

#### 9.5.2 稳态提交（1 RTT）

A 收到事务，进入 MySQL Group Commit：
- **Flush**：Binlog Events 前插 Consensus Log Event(index=5, term=1)，append 到本地 log[]；
- **Sync**：本地 fsync，并发 AppendLog 给 B、C：
  ```
  A→B, A→C: AppendLog(term=1, prevLogIndex=4, prevLogTerm=1,
                       entries=[(5,1,UPDATE...)], leaderCommit=4)
  ```
- B、C 一致性检查通过（log[4].term==1），把 `(5,1,UPDATE...)` fsync 到本地 binlog，回 Ack(success, matchIndex=5)；
- **Commit**：A 收到 B、C Ack（2/3 多数派），更新 matchIndex=[B→5, C→5]，`quorumMin(matchIndex)=5` 且 `log[5].term==currentTerm==1`，推进 commitIndex=5，apply 到 InnoDB 回客户端 OK；
- 下一条 AppendLog/心跳捎带 `leaderCommit=5`，B、C 异步推进本地 commitIndex 并 apply。

> **1 RTT**，Follower 的 apply 异步不阻塞客户端。Follower 必须 fsync 后才 Ack（非内存态）是 RPO=0 的硬保证，区别于 MySQL MGR XCOM 仅入内存就 Ack。

#### 9.5.3 故障 1：提交后未通知 Follower，Leader 宕机

A 刚 commit+apply+回客户端 OK，但未发 `leaderCommit=5` 给 B/C 就宕机：
```
A(宕机): log=[..,(5,1,UPDATE)], commitIndex=5
B:       log=[..,(5,1,UPDATE)], commitIndex=4
C:       log=[..,(5,1,UPDATE)], commitIndex=4
```

选举：B 的 election timeout（权重高优先）率先到期，term→2 成 Candidate，发 `RequestVote(term=2, lastLogIndex=5, lastLogTerm=1)`；C 比较后认为 B 的日志 `(1,5) ≥ (1,4)` 投 B；B 获 2 票当选 term=2 Leader。

B 当选后（`becameLeader_` L1311）立即做两件事：
1. 重置所有 peer 的 nextIndex/matchIndex；
2. `replicateLog_(emptyEntry)`（L1364）append 一条 no-op 空日志 `(6, 2, EMPTY)`，AppendLog 给 C。

C 通过一致性检查后 append no-op fsync 回 Ack。B 拿到多数派：`matchIndex[C]=6`，`log[6].term == currentTerm(2)`，commitIndex 推进到 6——按日志连续性，**index=5 的 UPDATE 被隐式提交**（这就是新 Leader 必须写 no-op 的原因：绕过 Raft 论文"新 Leader 不能直接提交前任 term 日志"的安全陷阱）。捎带 `leaderCommit=6`，C apply index=5 执行 UPDATE。客户端之前收到的 OK 依然成立，RPO=0。

#### 9.5.4 故障 2：日志只在 Leader 本地落盘就宕机

A 本地 append `(5,1,UPDATE...)` 并 fsync，尚未发 AppendLog 给 B/C 就宕机：
```
A(宕机): log=[..,(5,1,UPDATE)]    ← 只有 A 有，无客户端收到 OK
B:       log=[..,(4,1,X)]
C:       log=[..,(4,1,X)]
```

B 当选 term=2 Leader（RequestVote 带 lastLogIndex=4），append no-op `(6,2,EMPTY)` 提交后 commitIndex=6 仅确认到 index=4。A 恢复作为 Follower 接 B 的 AppendLog(prevLogIndex=4, prevLogTerm=1, entries=[(5,2,?),..])，A 本地 log[5].term=1 ≠ B 期望，一致性检查失败回 reject；B 递减 `nextIndex[A]` 重发从 index=5 开始的全部日志，**A 的 `(5,1,UPDATE)` 被覆盖**。

这条日志"丢失"是合法的——它从未达多数派，没有客户端收到过 OK。

#### 9.5.5 成员变更：单节点替换 C → D

X-Paxos 不用 Joint Consensus，采用 Raft §6 **单节点变更**：每次只加/减一个投票成员，新旧配置多数派必然相交，不会脑裂。

**Step 1：D 先作为 Learner catch-up**
- `addLearner(D)`：D 异步从 B 拉历史日志，不投票；
- B 每次心跳检查 `D.matchIndex ≥ lastLogIndex - maxDelayIndex4NewMember_`（L950），追上才允许下一步，否则返回 `PE_DELAY`。

**Step 2：D 从 Learner 升级为 Follower（CCAddNode）**
- B 构造 `ConfigureChangeValue(cctype=CCMemberOp, optype=CCAddNode, addrs=[D], allservers=[A,B,D])`；
- 封装为 `optype=kConfigureChange` LogEntry，append index=7，按**旧配置 {A,B,C} 多数派 2 票**走 AppendLog；
- 日志提交后各节点执行 `applyConfigureChangeNoLock_`（L222）：A/B/C 调 `config_->addMember(D)`，投票集合变成 {A,B,C,D}（多数派变 3）；D 自己走 Learner→Follower 分支（L251-282）：`installConfig([A,B,D])`、`changeState_(FOLLOWER)`、启动选举定时器。

**Step 3：把 C 删除（CCDelNode）**
- 等 D 稳定后发 `configureChange(CCDelNode, [C])`，append index=8（此时按 4 节点配置投票，需 3 票）；
- A、B、D 落盘 Ack 达多数派提交；apply 时 `config_->delMember(C)`，投票集合变 {A,B,D}；
- C 收到日志发现删自己，`localServer_->serverId += 1000; stop();`（L321）主动退出。

整个过程业务读写不中断，任意时刻网络分区都不会双 Leader。代价是一次只变一个节点，多节点变更需串行。

### 9.6 选举与 Leader Transfer

#### 9.6.1 触发条件

- 选举计时器 `electionTimer_` 是分级 Stage Timer（`paxos.cc:3578`），默认 `electionTimeout_ = 5000ms`；
- `electionWeight` 通过 `setRandWeight()` 调节超时权重（`paxos.h:459`），权重越高越先发起选举；
- 心跳间隔 `heartbeatInterval_ = electionTimeout_/5 = 1000ms`（`paxos.cc:38`）；
- **epoch 机制**：周期 timer（`epochTimerCallback` L3840）增加 `currentEpoch_`，Leader 在 `lastAckEpoch` 里记录每个 peer 最近 ack 的 epoch；如果 `quorumMin(lastAckEpoch) < currentEpoch_`，说明丢失多数派连接，Leader 自动 step down 触发选举（这是相对纯心跳更稳的租约机制）。

#### 9.6.2 RequestVote 消息（`paxos.cc:1601-1611`）

```cpp
msg.set_term(currentTerm_);
msg.set_msgtype(RequestVote);
msg.set_candidateid(localServer_->serverId);
msg.set_lastlogindex(lastLogIndex);
msg.set_lastlogterm(entry.term());
msg.set_force(force);
```

字段为 Raft 标准四元组 `(term, candidateId, lastLogIndex, lastLogTerm)`，外加 `force` 标志。**没有 PN / Promise 等 Basic Paxos 字段**。

#### 9.6.3 投票判断（`paxos.cc:1687-1734`）

```cpp
bool logCheck = (msg->lastlogterm() > lastLogTerm ||
    (msg->lastlogterm() == lastLogTerm && msg->lastlogindex() >= lastLogIndex));
rsp->set_votegranted(logCheck && votedFor_ == 0);
```

`(lastLogTerm, lastLogIndex)` 字典序比较，term 大者新；term 相同 index 大者新。Raft §5.4.1 原文规则。

额外 **Leader Stickiness**（L1700-1716）：如果本节点是 LEADER，或 FOLLOWER 在 stage 0（刚收过心跳）且已知 Leader、请求没带 `force=1`，拒绝投票，避免稳定期抖动。投票后 `votedFor_` 和 `currentTerm_` 持久化到元数据。

#### 9.6.4 当选后（`becameLeader_` L1311-1382）

```cpp
changeState_(LEADER);
electionTimer_->stop();
config_->forEach(&Server::beginLeadership, NULL);   // 重置 nextIndex/matchIndex
if (!cdrMgr_.inRecovery) {
  LogEntry entry1;
  log_->getEmptyEntry(entry1);
  replicateLog_(entry1, false);                    // 立即写 no-op
}
```

- 重置所有 peer `nextIndex = lastLogIndex + 1`、`matchIndex = 0`；
- **立即广播一条 empty entry (no-op)**，该 no-op 属于新 term，被多数派接受后隐式提交之前所有连续日志条目。

#### 9.6.5 Leader Transfer 强制让位

显式支持 Leader 主动让位（`leaderTransferSend_` L654-737）：
1. Leader 收到 `leaderTransfer <target>` 后 `setLimitAll()` 阻塞新写入；
2. 等目标 Follower `matchIndex == commitIndex == lastLogIndex`（日志完全追上）；
3. Leader 向目标发 `LeaderCommand(LeaderTransfer, lastLogIndex)`；
4. 目标在 `onLeaderCommand`（L2917）校验日志一致，立即 `requestVote(force=true)`；
5. `force=1` 绕过其他节点的 Leader Stickiness 检查，顺利当选。

另外还有**权重化自动让位**（`electionWeightAction` L4008）：新 Leader 当选后延迟一个 electionTimeout，若集群存在 electionWeight 更高的节点，主动 transfer 给它，保证 Leader 常驻主机房。

### 9.7 成员变更（单节点变更）

X-Paxos 不用 Joint Consensus，采用 Raft §6 **单节点变更 (Single-Server Change)**。

**为什么安全**：每次只加/减一个节点时，新旧配置的多数派必然相交。例如 3 节点 {A,B,C} → 4 节点 {A,B,C,D}，旧多数派需 ≥2 票，新多数派需 ≥3 票，两个集合至少有一个公共节点，不可能同时独立选出两个 Leader。

**添加节点**（`configureChange_` CCAddNode L879-1000）：
1. **前置 catch-up**：新节点 D 必须先作为 Learner 异步追日志，直到 `matchIndex ≥ lastLogIndex - maxDelayIndex4NewMember_`（L950-957），否则返回 `PE_DELAY`；
2. Leader 构造 `ConfigureChangeValue(cctype=CCMemberOp, optype=CCAddNode, addrs=[D], allservers=[A,B,C,D])`，封装为 `optype=kConfigureChange` 的 LogEntry；
3. 按**旧配置**的多数派 AppendLog 提交（此时投票集合还是 {A,B,C}，需 2 票）；
4. 提交后各节点执行 `applyConfigureChangeNoLock_`（L222）：旧节点 `addMember(D)`；D 自己走 Learner→Follower 分支 `installConfig(...)` + `changeState_(FOLLOWER)`，正式成为投票成员。

**删除/降级节点**（CCDelNode / CCDowngradeNode）走同样流程：单条 kConfigureChange 日志提交后 delMember 或转 Learner。被删节点若发现删的是自己（L314-323），`serverId += 1000; stop();` 主动退出。

多节点变更必须串行（先加 D 再删 C）。对比 Joint Consensus 省去"C_old,new 双配置"过渡期，但变更耗时与节点数线性相关，对 DN 小规模集群（3~5 副本）足够。

### 9.8 多分组 Paxos (Multi-Group)

单分组 Paxos 只有一个 Leader，是 DN 集群写瓶颈。X-Paxos 支持**多分组**：同一物理节点运行多个 Paxos 实例（每个 Group 对应一组 Partition/物理库），不同 Group 的 Leader 分散到不同物理节点，实现多点写入。

为避免多分组引发连接/消息风暴，做了三项合并：
1. **共享消息服务**：所有 Group 复用同一 TCP 连接，日志聚合打包发送、心跳聚合；
2. **共享 Timer/租约**：同节点多个 Group 共享 Leader 任期管理；
3. **分区管理模块**：维护 Partition Key → Group ID 映射并持久化（Meta Store），分片在线迁移通过两阶段日志同步达成跨 Group 一致（协调者可由任一节点担当，Paxos 保证协调者高可用）。

### 9.9 与其他协议对比

| 维度 | X-Paxos | MySQL MGR (XCOM) | Raft (etcd/TiKV) |
|---|---|---|---|
| 理论基础 | Raft 变体（强 Leadership） | Mencius (Multi-Paxos) | Raft |
| 消息类型 | RequestVote + AppendLog | XCOM 内部 Paxos | RequestVote + AppendEntries |
| 提交 RTT | **1 RTT** (AppendLog + Ack) | 1.5~2.5 RTT | 1 RTT |
| commitIndex 推进 | quorumMin(matchIndex) + `log[N].term==currentTerm` + forceSync 约束 | 单独 Learn 广播 | quorumMin(matchIndex) + `log[N].term==currentTerm` |
| Follower Ack 前提 | **fsync 落盘** | XCOM 内存收到即 Ack | fsync 落盘 |
| 成员变更 | 单节点变更 + Learner catch-up | 组通信视图 | Joint Consensus / 单节点变更 |
| 多分组 | ✅ 消息+心跳+Timer 合并 | ✅ 连接隔离 | ✅ (Multi-Raft) |
| Logger 轻量角色 | ✅ 投票但不回放 | ❌ | ❌ |
| 日志与引擎融合 | ✅ Consensus Event 嵌入 Binlog，零 relay log | ❌ Relay Log 中转 | 一般独立 WAL |
| 选举权重/让位 | ✅ electionWeight + Leader Transfer + force 票 + Stickiness | ❌ | 部分实现 |
| 乱序日志缓存 | ✅ logRecvCache_ 支持空洞 | ❌ | ❌（要求连续） |
| forceSync 跨 AZ | ✅ 强同步副本约束 commitIndex | ❌ | ❌ |
| 双十一验证 | ✅ 多年万亿级流量 | ❌ | ❌ |

### 9.10 在 PolarDB-X 整体架构中的位置

X-Paxos 工作在 DN 层，对上层 CN **透明**：

1. CN 通过 `polardbx-rpc` 只连 DN Leader；`StorageHaManager` 周期探测 Leader 切换更新 `StorageInstHaContext`，故障秒级切换连接；
2. CN 层 2PC 事务的 `XA Prepare/Commit` 作用于 DN Leader，Leader 内部通过 X-Paxos 把事务日志复制到多数派副本才返回 OK——**单分片强一致**由 X-Paxos 保证，**跨分片强一致**由 CN 层 TSO+2PC 保证，两层共同构成端到端 ACID；
3. CDC 通过 Learner 角色订阅 DN 变更日志，生成全局 Binlog；
4. Follower 可承担 Follower Read（一致性读），配合 MVCC 快照隔离释放 Leader 读负载。


---

## 10. 参考资料

- PolarDB-X 官方文档：https://doc.polardbx.com/zh/
- 阿里云帮助中心 - PolarDB-X 架构：https://help.aliyun.com/en/polardb/polardb-for-xscale/architecture-6
- PolarDB-X 开源仓库：https://github.com/ApsaraDB/PolarDB-X
- PolarDB-X V2.4 列存引擎：https://www.alibabacloud.com/blog/601302
- X-Paxos 官方文档：https://doc.polardbx.com/en/features/topics/x-paxos.html
- PolarDB-X 存储引擎核心技术 Paxos 多副本：https://developer.aliyun.com/article/1326544
- PolarDB-X 存储架构之基于 Paxos 的最佳生产实践：https://ost.51cto.com/posts/12888
- MySQL MGR vs PolarDB-X Paxos 深度对比：https://www.alibabacloud.com/blog/in-depth-comparison-between-mysql-mgr-and-alibaba-cloud-polardb-x-paxos_601691
- 墨天轮 - PolarDB-X 三副本存储引擎 X-Paxos：https://www.modb.pro/db/434222

  


---

> 文档基于源码静态分析 + 官方公开资料整理，如有偏差请以官方实现为准。

---