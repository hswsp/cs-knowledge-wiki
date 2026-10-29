# Tair 架构详解：淘宝分布式 KV 存储系统深度剖析

> 开源地址：https://github.com/alibaba/tair
>
> Tair（Taobao Pair）是阿里巴巴于 2010 年开源的高性能、高扩展、高可靠的分布式 Key/Value 存储引擎，在淘宝、天猫等电商核心场景中经历了超大规模流量考验。Tair 最具特色的两大设计是 **可插拔存储引擎层** 和 **中心调度 + 客户端智能路由的分布式架构**。本文从整体架构出发，逐层深入 ConfigServer、DataServer、Client、InvalidServer 四大模块，并重点剖析其存储引擎抽象设计与分布式数据分布、复制、迁移机制。

---

## 一、整体架构总览

### 1.1 系统组成

Tair 集群由 **3 个必选模块** + **1 个可选模块** 构成：

```
                        +----------------------------------+
                        |          Client (SDK)            |
                        |  - 路由缓存 / 本地缓存 / 版本检测  |
                        +-------+---------------+----------+
                                | 1.获取对照表   | 2.读写请求
                                v               v
                  +-------------------------------------+
                  |         ConfigServer (1主1备)        |
                  | - 节点探活  - 构建对照表              |
                  | - 数据迁移调度 - 选主/HA              |
                  +-------+---------------+-------------+
                          | 心跳 / 下发    |
                          v               v
        +----------+ +----------+ +----------+ +----------+
        |DataServer| |DataServer| |DataServer| |DataServer|  N台
        | 存储引擎  | | 存储引擎  | | 存储引擎  | | 存储引擎  |
        |mdb/ldb/  | |mdb/ldb/  | |mdb/ldb/  | |mdb/ldb/  |
        |kdb/fdb   | |kdb/fdb   | |kdb/fdb   | |kdb/fdb   |
        +----------+ +----------+ +----------+ +----------+

                        +------------------+
                        |InvalidServer(可选)|
                        | 跨集群删除/隐藏   |
                        +------------------+
```

### 1.2 各模块职责一览

| 模块 | 是否必选 | 数量 | 核心职责 |
|------|---------|------|---------|
| **Client** | 必选 | 多实例（嵌入业务进程） | 业务 SDK：路由缓存、数据序列化、本地热点缓存、版本驱动路由更新 |
| **ConfigServer** | 必选 | 2 台（主备） | 集群元数据中心：节点探活、构建数据分布对照表、调度数据迁移、主备 HA 选主 |
| **DataServer** | 必选 | N 台 | 实际数据存储：处理读写请求，多副本同步复制，在线数据迁移，插件容器 |
| **InvalidServer** | 可选 | 2 台 | 双机房独立集群部署时，负责跨集群的 delete/hide 同步与脏数据清理 |

### 1.3 请求路径概要

一次完整读写请求流程：

1. **Client 初始化**：从 ConfigServer 拉取数据分布对照表（路由表），缓存在本地内存。
2. **写请求**：Client 对 key 做 hash → 确定 bucket → 查对照表找到主 DataServer → 直连该 DataServer 写入 → DataServer 同步写入副本 → 返回成功。
3. **读请求**：同样路径，默认从主 DataServer 读取。
4. **路由更新**：DataServer 在响应中携带对照表版本号，Client 发现版本落后时主动拉取新表。

关键特性：**数据路径完全不经过 ConfigServer**，ConfigServer 仅在控制面工作，不会成为性能瓶颈。

---

## 二、ConfigServer：集群大脑

### 2.1 定位与部署

- **地位**：集群的中心化控制节点，但不在数据读写路径上。
- **部署模式**：一主一备双节点，主节点绑定 VIP（虚拟 IP）对外服务，备节点热备；主宕机后备节点秒级自动接管 VIP。
- **轻量级**：不存储任何业务数据，只维护路由信息和节点状态；即使两台 ConfigServer 同时宕机，只要 DataServer 拓扑没有变化，已初始化的 Client 仍可正常读写。

### 2.2 内部子模块架构

```
+-------------------------------------------------+
|                  ConfigServer                    |
+-------------------------------------------------+
|  +--------------+    +-----------------------+  |
|  | 心跳检测模块  |<-->| DataServer 存活列表   |  |
|  | (Heartbeat)  |    | + 节点状态/负载信息   |  |
|  +--------------+    +-----------------------+  |
|                                                 |
|  +--------------+    +-----------------------+  |
|  | 对照表构建器  |--->| 三张路由表 + 版本号    |  |
|  | (TableBuilder)|   |hash/m_hash/d_table   |  |
|  +--------------+    +-----------------------+  |
|                                                 |
|  +--------------+    +-----------------------+  |
|  | 迁移调度器    |--->| 迁移任务队列 / 进度   |  |
|  | (MigrateMgr) |    | 双写切换控制          |  |
|  +--------------+    +-----------------------+  |
|                                                 |
|  +--------------+    +-----------------------+  |
|  | 主备选主模块  |<-->| VIP / 心跳仲裁       |  |
|  | (HAManager)  |    |                       |  |
|  +--------------+    +-----------------------+  |
|                                                 |
|  +--------------+    +-----------------------+  |
|  | 插件/配额管理 |--->| 插件下发 / namespace  |  |
|  |              |    | quota 配置            |  |
|  +--------------+    +-----------------------+  |
+-------------------------------------------------+
```

### 2.3 心跳检测机制

**心跳方向**：DataServer → ConfigServer（周期性上报）。

心跳包携带信息：

- DataServer 自身健康状态（CPU、内存、磁盘使用率）
- 当前持有的 bucket 列表（哪些桶是 master，哪些是 slave）
- 正在进行的迁移任务进度
- 当前缓存的对照表版本号

**故障判定**：ConfigServer 维护超时计数器，连续多次心跳丢失（默认 2~3 个周期），即将该 DataServer 标记为不可用。

### 2.4 对照表构建：分布式的核心数据结构

Tair 数据分布的核心是 **对照表（Hash Table）**，它实现了数据在集群中的均衡分布和动态调整。

#### 2.4.1 二级映射机制

Tair 采用 **Key → Bucket → DataServer** 的二级映射，将逻辑分布与物理分布彻底解耦：

```
                 第一层（稳定）               第二层（动态）
                +-----------------+    +---------------------+
   Key --hash-> | bucket_id       |--->| Master DS 地址       |
                | (0 ~ Q-1, 固定) |    | Slave DS 地址列表    |
                +-----------------+    +---------------------+
                    hash(key) % Q          ConfigServer 维护
                    永久映射                可随节点变化调整
```

- **第一层映射**：`bucket_id = hash(key) % Q`，Q 为桶总数（生产环境通常 1023 / 4096 / 10240），集群生命周期内固定不变，保证 key → bucket 映射永远稳定。
- **第二层映射**：由 ConfigServer 动态维护，记录每个 bucket 当前由哪个 DataServer 作为主、哪些作为备。

好处：节点上下线时，只需迁移受影响的 bucket，而不需要重新映射所有 key。

#### 2.4.2 三张路由表

ConfigServer 维护三张结构相同但用途不同的对照表：

| 表名 | 变量名 | 用途 | 使用者 |
|------|--------|------|--------|
| **生效表** | `hash_table` | 当前正在使用的路由表 | Client、DataServer |
| **迁移中间表** | `m_hash_table` | 记录正在迁移的 bucket 的新旧位置 | DataServer（迁移中） |
| **目标表** | `d_hash_table` | 迁移完成后的最终路由状态 | ConfigServer |

迁移过程中三表演化：

```
[正常]  hash_table == m_hash_table == d_hash_table（版本 V）
[启动]  ConfigServer 计算新拓扑；d_hash_table 更新为目标态（V+1）；
        m_hash_table 标记迁移中的 bucket；hash_table 暂时不变（V）
[进行]  DataServer 按 m_hash_table 搬迁；搬迁中 bucket 双写源和目标
[完成]  hash_table 收敛为 d_hash_table（V+1）；三表再次一致；通知全网
```

#### 2.4.3 Bucket 副本配置

每个 bucket 可配置多个副本（`COPY_COUNT`），对照表每个 bucket 条目记录完整副本位置：

```
示例（Q=6, COPY_COUNT=2, 4 台 DataServer）：

bucket_id    Master DS          Slave DS
    0        192.168.1.1        192.168.1.3
    1        192.168.1.2        192.168.1.4
    2        192.168.1.1        192.168.1.4
    3        192.168.1.2        192.168.1.3
    4        192.168.1.3        192.168.1.1
    5        192.168.1.4        192.168.1.2
```

- Client 的读写请求 **只与 Master DS 交互**
- 写入时 Master DS 负责同步到 Slave DS
- Master 宕机时 ConfigServer 将 Slave 提升为新 Master

#### 2.4.4 对照表构建策略

**策略一：负载均衡优先（Balance First）**

在满足硬约束前提下，尽量使每个 DataServer 持有 bucket 数量相等。

硬约束：

1. 每个 bucket 必须恰好有 `COPY_COUNT` 个副本
2. 同一 bucket 的任意两个副本不能位于同一台 DataServer
3. 单个 DataServer 上 master bucket 数量不超过 `平均值 + 1`（防倾斜）

算法：贪心 + 轮询，为每个 bucket 选当前负载最轻且不违反约束的 DataServer。

**策略二：位置安全优先（Safety First）**

在负载均衡基础上引入 **机房/机架位置感知**，强制副本跨机房部署：

- 每个 DataServer 配置 `_pos_mask`（位置掩码）标识机房/机架
- 构建对照表时优先保证副本位于不同 `_pos_mask` 的机器
- 适用于多机房容灾，单机/单机房故障不影响数据可用

```
示例（双机房，COPY_COUNT=2）：

bucket_id    Master（机房A）    Slave（机房B）
    0        10.0.1.1          10.0.2.1
    1        10.0.1.2          10.0.2.2
```

### 2.5 版本号驱动的路由传播

对照表携带 **单调递增版本号**，是路由更新的核心驱动力：

```
ConfigServer 重新生成对照表 --> 版本号 +1
        |
        v
通过心跳响应将新版本号推送给 DataServer
        |
        v
DataServer 拉取新对照表缓存到本地
        |
        v
Client 请求 DS --> DS 在 response 中带回自己的版本号
        |
        v
Client 比较本地版本号 vs 响应版本号
        +-- 一致 --> 正常返回
        +-- 不一致 --> Client 主动访问 CS 拉取最新对照表，更新本地缓存
```

**巧妙之处**：

- Client 不需要与 ConfigServer 维持心跳或长连接
- ConfigServer 不需要向大量 Client 做推送
- 只有真正在使用的 Client 才会感知版本变化并更新
- 版本未变时 ConfigServer 完全不参与数据路径

### 2.6 数据迁移调度

#### 2.6.1 节点扩容流程

```
1. 新 DS-New 启动，向 CS 发送心跳注册
2. CS 将 DS-New 加入可用节点列表
3. 重新计算 d_hash_table，将部分 bucket 分配给 DS-New
   - 尽量保持原有映射不变，仅移动最少 bucket
4. 生成迁移任务（源 DS -> 目标 DS），标记 m_hash_table
5. 下发迁移指令
6. 源 DS 遍历 bucket 数据，批量发送到目标 DS
   - 迁移期间新写入由源 DS 同时同步到目标（双写）
7. 迁移完成，CS 更新 hash_table，版本号+1
8. Client 后续请求感知版本变更，自动获取新路由
```

#### 2.6.2 节点故障流程

```
1. CS 心跳超时检测到 DS-X 不可用
2. 分析 DS-X 持有 bucket 的角色：
   a) Slave -> 在其他可用 DS 上补建副本
   b) Master -> 将其 Slave 提升为新 Master，然后补副本
3. 生成 d_hash_table，启动迁移任务补副本
4. 新对照表生效，版本号+1
```

#### 2.6.3 迁移约束校验

| 约束 ID | 规则 | 适用 |
|---------|------|------|
| c1 | 目标 DS 上 master bucket 数不超过 `平均值+1` | master 桶迁移 |
| c2 | 目标 DS 上副本 bucket 数不超过 `平均值+1` | 副本桶迁移 |
| c3 | 任何 DS 上的 bucket 总数不超过 `平均值+1` | BASE 模式 |
| c4 | 同一 bucket 的任意两个副本不能在同一 DS | 所有迁移 |

不同迁移模式（ALL/POS/BASE/FORCE）启用不同约束组合，确保迁移后集群仍满足均衡和安全。

### 2.7 ConfigServer HA 选主

- 两台 CS 同时运行，通过 **VIP 漂移** 实现主备切换
- 备 CS 持续探测主 CS 健康状态（内部心跳）
- 主宕机 -> 备在秒级内接管 VIP，成为新主
- 新主从 DataServer 心跳中重建存活列表和对照表（数据量极小，可快速重建）
- 无需复杂共识协议（Raft/Paxos），因为 CS 不持久化业务数据

---

## 三、DataServer：数据存储与读写引擎

### 3.1 定位与职责

- **角色**：集群中实际处理数据读写的节点，**所有 DataServer 地位对等**。
- **核心职责**：
  1. 数据的物理存储（内存/磁盘）
  2. 处理 Client 的读写请求
  3. 按 CS 指令执行多副本同步复制
  4. 按 CS 指令执行在线数据迁移
  5. 周期性向 CS 上报心跳（含状态、bucket 列表、迁移进度）
  6. 管理插件的加载/卸载

### 3.2 内部架构

```
+---------------------------------------------------------+
|                      DataServer                         |
+---------------------------------------------------------+
|  +---------------------------------------------------+  |
|  |            请求处理层 (Request Handler)             |  |
|  |   网络收发（tbnet） / 协议解析 / 请求分发           |  |
|  +---------------+-------------------+---------------+  |
|                  |                   |                  |
|  +---------------v-------+ +---------v---------------+  |
|  |   插件容器 (Plugin)    | |  迁移/复制管理器         |  |
|  |  - 请求前置 hook       | |  - 桶迁移任务执行        |  |
|  |  - 响应后置 hook       | |  - 副本同步写入          |  |
|  |  - quota 校验/统计     | |  - 双写控制              |  |
|  +---------------+-------+ +---------+---------------+  |
|                  |                   |                  |
|  +---------------v-------------------v---------------+  |
|  |          抽象存储引擎层 (TairEngine API)            |  |
|  |   put / get / del / range / open / close / stats   |  |
|  +---+----------+----------+----------+--------------+  |
|      |          |          |          |                 |
|   +--v---+  +---v--+  +----v--+  +----v--+  +---v--+     |
|   | mdb  |  | rdb  |  | ldb   |  | kdb   |  | fdb  |     |
|   |Memca-|  |Redis|  |LevelDB|  |Kyoto  |  |Fire- |     |
|   |ched  |  |     |  |       |  |Cabinet|  |Bird  |     |
|   +------+  +------+  +-------+  +-------+  +------+     |
|     内存      内存      持久化       持久化     持久化     |
+---------------------------------------------------------+
```

### 3.3 请求处理层

DataServer 基于阿里开源的 **tbnet** 网络库（高性能异步 IO 框架）构建网络层：

- 监听端口，接收来自 Client 和其他 DataServer 的连接
- 协议解析：Tair 自定义的二进制协议，请求包含 area、key、value、version、expire 等字段
- 请求分发：根据命令类型（get/put/del/prefix/incr 等）分发到对应处理器
- 线程模型：IO 线程负责网络收发，工作线程池负责实际存储引擎操作

### 3.4 抽象存储引擎层（TairEngine API）

这是 Tair 架构最具扩展性的设计。所有存储引擎实现统一的抽象接口：

```cpp
class tair_storage_engine {
public:
    // 生命周期
    virtual int  open(const char* path, engine_option opt) = 0;
    virtual int  close() = 0;
    virtual bool is_open() = 0;

    // 基础 CRUD
    virtual int  put(int area, tair_data_entry& key, tair_data_entry& value,
                     int version, int expire_time) = 0;
    virtual int  get(int area, tair_data_entry& key, tair_data_entry& value) = 0;
    virtual int  remove(int area, tair_data_entry& key, int version) = 0;

    // 前缀范围查询（二级索引）
    virtual int  prefix_put(int area, tair_data_entry& pkey,
                            tair_data_entry& skey, tair_data_entry& value,
                            int version, int expire) = 0;
    virtual int  prefix_get(int area, tair_data_entry& pkey,
                            tair_data_entry& skey, tair_data_entry& value) = 0;
    virtual int  prefix_del(int area, tair_data_entry& pkey,
                            tair_data_entry& skey) = 0;
    virtual int  prefix_range(int area, tair_data_entry& pkey,
                              tair_data_entry& start, tair_data_entry& end,
                              int limit, vector<tair_entry>& out) = 0;

    // 批量操作
    virtual int  mget(int area, vector<tair_data_entry>& keys,
                      map<key, value>& out) = 0;

    // 管理
    virtual int  get_stats(engine_stats& stats) = 0;
    virtual int  compact() = 0;
};
```

**关键设计价值**：

- 任何实现该接口的存储引擎都能无缝接入 Tair 分布式体系
- 上层请求处理、复制、迁移、插件、客户端协议完全复用
- 甚至可以接入 MySQL、BDB 等外部存储作为后端
- 业务无需关心底层引擎差异，分布式能力开箱即用

### 3.5 多副本复制机制

Tair 采用 **主从同步复制** 保证副本一致性（写入时同步等待副本确认）。

```
写入流程（COPY_COUNT=2）：

Client.put(key, value, version)
    |
    v
Master DataServer (bucket X 的主)
    |
    +--1. 写入本地存储引擎
    |
    +--2. 并行向 Slave DS 发送 replicate 请求
    |       |
    |       +--Slave DS 写入本地存储引擎
    |       |       |
    |       |       v
    |       +--- 写入成功响应
    |
    +--3. 所有副本写入成功 --> 返回 Client 成功
    |
    +--4. 若副本失败 --> 根据配置可降级或直接返回失败
```

**复制的关键特性**：

- **同步复制**：客户端收到成功响应时，数据已在所有副本落盘/落内存
- **副本位置**：由 ConfigServer 在对照表中指定，保证跨机器（跨机房在安全模式下）
- **复制链路**：Master → Slave，避免多副本之间的复杂协调
- **读写分离（可选）**：Slave 可配置为只读，Client 读请求可路由到 Slave 以分担压力

### 3.6 在线数据迁移执行

迁移由 ConfigServer 下达指令，DataServer 执行具体的数据搬迁。

**迁移过程中的状态机**（bucket 级别）：

```
        ┌─────────┐  接收迁移指令  ┌──────────┐
        | 正常    | -------------> | 迁移准备 |
        | serving|               +----------+
        └────┬────┘                       |
             ^                            v
             |                     ┌──────────┐
             |    迁移完成          | 迁移中    |
             +-------------------  | (双写)    |
                                   +----------+
                                        |
                                        v
                                   ┌──────────┐
                                   | 切流      |
                                   | 源→目标   |
                                   └──────────┘
```

**迁移中读写保证**：

- **读请求**：迁移未完成前，Client 仍按旧表路由到源 DS；迁移完成后路由到新主
- **写请求（双写）**：源 DS 收到写请求时，除了写入本地，还会把写入同步到目标 DS，保证迁移期间新数据不丢
- **批量搬迁**：源 DS 按 bucket 内数据的迭代器批量发送给目标 DS（批量 + 流控避免影响在线服务）
- **迁移完成标记**：源 DS 发送完所有数据后上报 CS，CS 更新对照表并递增版本号

**迁移对业务的影响**：

- 业务无感知，无需停服
- 迁移期间读写延迟可能略有上升（双写开销），但整体可控
- 迁移速度可配置（带宽限速、并发数），避免抢占在线流量

### 3.7 插件容器

DataServer 内置热插拔插件容器，提供了无需修改核心代码即可扩展功能的能力。

```
请求路径中的插件执行：

Client 请求
    |
    v
Request Handler
    |
    v
[Request Plugin 1] --> [Request Plugin 2] --> ...  (前置 hook)
    |
    v
存储引擎操作（put/get/del）
    |
    v
[Response Plugin 1] --> [Response Plugin 2] --> ...  (后置 hook)
    |
    v
Response 返回 Client
```

**插件管理**：

- 插件配置由 ConfigServer 统一下发，通过心跳同步到所有 DataServer
- 支持热加载/热卸载，无需重启 DataServer 进程
- 典型插件用途：
  - **quota 检查**：写入前校验 namespace 配额是否超限
  - **访问统计**：记录各 area 的 QPS、延迟、命中率
  - **鉴权**：校验请求来源的权限
  - **审计日志**：记录特定操作的审计日志

### 3.8 心跳上报

DataServer 周期性（默认每秒）向 ConfigServer 发送心跳包，内容包含：

- **节点基本信息**：IP、端口、启动时间、当前状态
- **资源状态**：CPU 使用率、内存使用量、磁盘使用量、连接数
- **bucket 信息**：本节点持有的所有 bucket ID、角色（master/slave）、数据量
- **迁移进度**：正在迁移的 bucket、已迁移记录数/总记录数
- **对照表版本**：当前缓存的路由表版本号
- **统计信息**：QPS、命中率、响应延迟等

---

## 四、存储引擎层深度剖析

Tair 的存储引擎层设计是其区别于其他分布式 KV 的最大特色。本章详细讲解每个内置引擎的实现特点、数据结构、适用场景，以及如何通过统一接口接入分布式能力。

### 4.1 引擎总览

Tair 内置 5 种存储引擎，覆盖缓存到持久化、从简单 KV 到复杂数据结构的全场景：

| 引擎 | 类型 | 存储介质 | 底层实现 | 定位 | 典型场景 |
|------|------|---------|---------|------|---------|
| **mdb** | 非持久化 | 内存 | 类 Memcached slab | 高性能分布式缓存 | Session、热点数据、临时缓存 |
| **rdb** | 非持久化 | 内存 | Redis 兼容数据结构 | 支持复杂结构的缓存 | 计数器、排行榜、队列、Pub/Sub |
| **ldb** | 持久化 | 磁盘 + 可选内存 cache | LevelDB（LSM-Tree） | 大容量持久化存储 | 交易快照、库存、订单、大数据量 KV |
| **kdb** | 持久化 | 磁盘 | Kyoto Cabinet（B+ Tree/Hash） | 快速持久化 KV | 需要快速随机读写的持久化场景 |
| **fdb** | 持久化 | 磁盘 | FireBird（嵌入式 SQL） | 结构化持久化存储 | 快速读取的关系型小型数据 |

```
                         统一接口：tair_storage_engine
                                    |
    +----------+----------+---------+---------+----------+
    |          |          |         |         |          |
   mdb        rdb        ldb       kdb       fdb      (未来扩展)
  (内存)     (内存)     (磁盘)    (磁盘)    (磁盘)
    |          |          |
    +- slab    +- 复杂DS  +- LSM Tree
    +- LRU     +- 淘汰    +- 可内嵌 mdb cache
```

### 4.2 mdb：内存缓存引擎（Memcached 风格）

mdb 是 Tair 最早也是最广泛使用的引擎，定位为纯内存缓存。

#### 4.2.1 内存管理：Slab Allocator

mdb 采用与 Memcached 类似的 Slab 内存分配器，避免频繁 malloc/free 导致的内存碎片：

```
Slab Class 1 (chunk=64B)    Slab Class 2 (chunk=128B)    Slab Class N (chunk=1MB)
+---+---+---+---+           +---+---+---+---+            +---+
|   |   |   |   |           |   |   |   |   |            |   |
+---+---+---+---+           +---+---+---+---+            +---+
 \___ 共 1MB page ___/       \___ 共 1MB page ___/
```

- 将内存划分为多个 Slab Class，每个 Class 固定 chunk 大小（按比例增长，如 1.25 倍递增）
- 每条数据根据大小选择合适的 Slab Class，分配到对应 chunk
- 过期/删除的数据其 chunk 被回收复用，不还给 OS

#### 4.2.2 数据结构

```c
struct mdb_item {
    uint64_t  item_id;          // 全局唯一 ID
    uint16_t  version;          // 乐观锁版本号
    uint16_t  area;             // namespace/area
    uint32_t  expire_time;      // 绝对过期时间戳（秒）
    uint32_t  flag;             // 用户自定义 flag（序列化类型等）

    // 双向链表指针（LRU）
    struct mdb_item* prev;
    struct mdb_item* next;

    // Hash 链表指针
    struct mdb_item* h_next;

    // 数据区（变长）
    char      key_data[];       // key + value 紧凑存储
    // 具体布局：[key_len(2B)] [key] [value_len(4B)] [value]
};
```

#### 4.2.3 Hash 索引

- 采用 **链式哈希表**：开链法解决冲突
- Hash 表大小根据 mdb 内存配额自动调整
- Hash 函数使用 MurmurHash 等高效算法

#### 4.2.4 LRU 淘汰

每个 Slab Class 维护独立的 LRU 链表：

```
最近使用 <----------------------------------------> 最久未使用

+-------+    +-------+    +-------+    +-------+    +-------+
| item1 |<-->| item3 |<-->| item7 |<-->| item2 |<-->| item9 |  ...
+-------+    +-------+    +-------+    +-------+    +-------+
   head                                                    tail
```

- 访问 item 时将其移到链表头部
- 当 Slab Class 内存不足时，从链表尾部（最久未使用）开始淘汰
- 淘汰粒度：优先淘汰已过期数据，过期数据不足时淘汰 LRU 最老数据
- LRU 为惰性 + 后台扫描混合模式

#### 4.2.5 过期策略

- **惰性过期**：get 时检查 expire_time，过期则返回不存在并异步回收
- **定期扫描**：后台线程周期性扫描部分 item，清理过期数据
- **启动加载**：重启时（mdb 数据不持久化），数据全部丢失

#### 4.2.6 适用场景与特点

- 高性能缓存（微秒级响应）
- 纯 KV 结构（不支持 list/hash 等复杂结构）
- 节点重启数据丢失，适合纯缓存场景
- 内存利用率高，Slab 机制碎片少

### 4.3 rdb：Redis 兼容内存引擎

rdb 在 Tair 中作为支持复杂数据结构的内存引擎，兼容 Redis 的数据结构语义。

#### 4.3.1 支持的数据结构

| 结构 | 底层编码 | 典型命令 |
|------|---------|---------|
| String | raw/int/embstr | get/set/incr/decr |
| List | quicklist/ziplist | lpush/rpush/lrange/lpop |
| Hash | ziplist/hashtable | hget/hset/hgetall |
| Set | intset/hashtable | sadd/smembers/sismember |
| Sorted Set | ziplist/skiplist | zadd/zrange/zrank |

#### 4.3.2 与 mdb 的区别

| 维度 | mdb | rdb |
|------|-----|-----|
| 数据结构 | 纯二进制 KV | String/List/Hash/Set/Zset |
| 淘汰策略 | Slab + LRU | 类似 Redis 的 maxmemory-policy |
| 适用场景 | 纯缓存、简单 KV | 需要复杂结构的缓存/计算 |
| 性能 | 极高（轻量） | 高（结构操作有开销） |

### 4.4 ldb：LevelDB 持久化引擎（LSM-Tree）

ldb 是 Tair 持久化场景的主力引擎，基于 Google LevelDB 改造，针对 KV 持久化、大容量场景优化。

#### 4.4.1 LSM-Tree 存储架构

```
                           写入路径
                              |
                              v
+--------------------------------------------------+
|  MemTable（内存）          |  Immutable MemTable  |
|  (跳表/SkipList)           |  (等待 flush)        |
+---------------------------+----------------------+
                            |
                    flush（顺序写）
                            v
+--------------------------------------------------+
|  Level 0 (SSTable 文件，可能重叠)                 |
+--------------------------------------------------+
                            |
                    compaction（归并排序）
                            v
+--------------------------------------------------+
|  Level 1 (SSTable 文件，key 范围不重叠)           |
+--------------------------------------------------+
                            |
                    compaction
                            v
+--------------------------------------------------+
|  Level 2  ...  Level N (单文件容量/层数可控)      |
+--------------------------------------------------+
```

**写入流程**：

1. 写入先进入 MemTable（内存中的 SkipList，同时写 WAL 保证宕机恢复）
2. MemTable 写满后转为 Immutable MemTable，后台 flush 为 Level 0 的 SSTable 文件
3. Level 0 文件数超限后触发 compaction，归并到 Level 1
4. 多层 compaction 持续进行，保证读取效率

**读取流程**：

1. 先查 MemTable → Immutable MemTable → Level 0 → Level 1 → ... → Level N
2. 使用 Bloom Filter 快速判断 key 是否可能在某 SSTable 中
3. SSTable 内部按 key 有序，二分查找定位

#### 4.4.2 ldb 的改进点

相比原生 LevelDB，Tair 的 ldb 做了多项增强：

- **内嵌 mdb 作为 cache**：可在 ldb 上层配置 mdb 作为读写缓存（ldb_cache），热点数据读写直接走内存；cache 与持久化数据的一致性由 Tair 维护
- **Namespace 支持**：在 key 前加上 area 前缀实现 namespace 隔离
- **Prefix 范围查询优化**：基于 LSM 的有序 key 特性，prefix_range 非常高效
- **统计与监控**：增加 compaction 进度、延迟统计等运维指标
- **更大的文件块与 block cache**：根据生产环境调优参数

#### 4.4.3 持久化保证

- **WAL（Write Ahead Log）**：写入先落 WAL 再进 MemTable，宕机后重放 WAL
- **Sync 策略**：可配置 fsync 频率（每次写/每秒/OS 缓冲）
- **快照**：支持 checkpoint 备份

#### 4.4.4 适用场景

- 大容量持久化存储（单实例可存 TB 级数据）
- 写多读少、顺序写友好的场景
- 需要 prefix 范围查询的场景（如订单按时间范围查询）
- 库存扣减、交易快照、商品详情等核心业务持久化

### 4.5 kdb：Kyoto Cabinet 持久化引擎

基于 Kyoto Cabinet（前身是 Tokyo Cabinet），提供两种存储模式：

- **HashDB**：哈希表文件，O(1) 随机读写
- **B+ Tree DB**：B+ 树文件，支持有序遍历和范围查询

特点：

- 纯 C/C++ 实现，嵌入式无服务端
- 支持压缩、加密
- 性能高但生态和维护性不如 LevelDB，Tair 中用得较少

### 4.6 fdb：FireBird 嵌入式 SQL 引擎

基于 FireBird 嵌入式关系数据库，通过 SQL 接口存储数据：

- 适合需要 SQL 查询能力的小型结构化数据
- 使用频率较低，主要面向特定业务场景

### 4.7 引擎选型建议

| 场景特征 | 推荐引擎 | 理由 |
|---------|---------|------|
| 纯缓存，简单 KV，要求最高性能 | mdb | 内存级吞吐，Slab 管理高效 |
| 缓存但需要 List/Zset/Hash | rdb | Redis 兼容结构，业务开发灵活 |
| 数据不能丢，容量大，写密集 | ldb | LSM 顺序写，持久化可靠，性价比高 |
| 数据不能丢，需要范围查询 | ldb | LSM 天然有序，prefix_range 高效 |
| 数据不能丢，读多写少 | kdb/ldb | 依容量与性能需求选择 |
| 需 SQL 能力的小型结构化数据 | fdb | 嵌入式 SQL 支持 |

### 4.8 引擎可插拔扩展能力

Tair 存储引擎的抽象接口使得新增引擎非常方便。只需：

1. 继承 `tair_storage_engine` 抽象类
2. 实现 `open/close/put/get/remove/prefix_*/mget` 等接口
3. 在 DataServer 配置中注册引擎
4. 重启或热加载即可使用

这意味着可以将任何符合 KV 语义的存储接入 Tair（例如 RocksDB、MySQL、甚至远程存储），**立即获得**：分布式分布、多副本复制、在线迁移、客户端路由、版本乐观锁、namespace 隔离、插件扩展等全套能力。

---
## 五、Client：智能客户端 SDK

### 5.1 定位

Client 以 SDK 形式嵌入业务应用进程（提供 Java/C++/Python/Go 等版本），是 Tair 分布式能力的终端封装。它屏蔽了集群拓扑、路由、容错、版本更新等分布式复杂性，让业务像使用本地 Map 一样使用 Tair。

### 5.2 内部组件架构

```
+----------------------------------------------------+
|                   Tair Client                      |
+----------------------------------------------------+
|  +--------------+    +--------------------------+  |
|  | 路由表缓存    |    | 版本号检测 & 自动更新     |  |
|  | (对照表)     |<-->|                          |  |
|  +------+-------+    +--------------------------+  |
|         v                                          |
|  +--------------+    +--------------------------+  |
|  | 路由计算模块  |    | 连接池管理 (按 DS 分组)   |  |
|  | hash%Q->bucket|   |  - 长连接复用            |  |
|  +------+-------+    |  - 健康检查              |  |
|         v            +--------------------------+  |
|  +--------------+    +--------------------------+  |
|  | 请求序列化    |    | 本地缓存 (LocalCache)     |  |
|  | 响应反序列化  |    | 热点 key 本地命中        |  |
|  +------+-------+    +--------------------------+  |
|         v                                          |
|  +--------------+    +--------------------------+  |
|  | 重试/容错     |    | 序列化/压缩插件          |  |
|  | 故障节点摘除  |    |                          |  |
|  +--------------+    +--------------------------+  |
+----------------------------------------------------+
```

### 5.3 启动与初始化

```
1. 读取 configID（或直接配置的 ConfigServer 地址）
2. 根据 configID 从 Diamond/配置中心 获取 ConfigServer 地址列表
3. 轮询连接两台 ConfigServer（主或备均可）
4. 拉取最新对照表（hash_table）与版本号
5. 建立与各 DataServer 的连接池
6. 启动后台线程：
   - 定期版本检查（可选）
   - 连接健康检查
   - LocalCache 清理
```

configID 是 Tair 集群的唯一标识，通常存放在阿里 Diamond 配置中心，业务只需配置 configID 即可，无需关心集群拓扑。

### 5.4 请求路由流程

一次 put/get 请求的完整路由：

```
Client.put(namespace, key, value, version, expireTime)
        |
        v
   bucket_id = hash(key) % BUCKET_COUNT     // 第一层：稳定映射
        |
        v
   查询本地对照表：bucket_id -> [Master DS, Slave DS...]
        |
        v
   从连接池取 Master DS 的连接
        |
        v
   序列化请求（二进制协议），发送给 Master DS
        |
        v
   Master DS 处理（本地写 + 副本同步）
        |
        v
   接收响应，解析返回码和数据
        |
        +-- 检查响应中的对照表版本号 V_resp
        |      +-- V_resp == V_local：返回成功
        |      +-- V_resp != V_local：异步触发 update_route()
        |
        +-- 失败处理（超时/连接异常）：
               +-- 重试 1 次（同节点或副本节点）
               +-- 主动拉取最新对照表后重试
               +-- 多次失败则向上抛出异常
```

### 5.5 路由表更新机制（版本驱动）

Client 不需要与 ConfigServer 维持心跳，完全通过响应中携带的版本号驱动更新：

```
场景 1：正常读写
  DS 在 response 带回自己的对照表版本 V_resp
  Client 比较 V_local vs V_resp：
    - 一致：正常返回
    - 不一致：Client 访问 ConfigServer 拉取新对照表并替换本地缓存

场景 2：DataServer 不可达
  请求超时 / 连接拒绝 / 网络异常
  -> Client 立即主动访问 ConfigServer 拉取最新对照表
  -> 按新表重试请求（节点可能已经切换，迁移完成）

场景 3：Client 首次初始化 / 重启
  直接访问 ConfigServer 获取最新对照表
  -> 如果 ConfigServer 主备都不可用，则启动失败

场景 4：后台轮询（可选）
  部分 SDK 支持后台定时（如 30s）拉取版本号，提前感知变更
```

这种 pull-based 设计避免了大规模 Client 对 ConfigServer 的连接压力，也不需要 CS 维护 Client 列表。

### 5.6 LocalCache 本地热点缓存

Client 内置可选的本地缓存层，用于抵御超热 Key 对集群的冲击：

```
应用 get(key)
     |
     +-- 命中本地缓存 --> 直接返回（纳秒级）
     |
     +-- 未命中 --> 远程访问 DataServer
                      |
                      +-- 返回 value --> 写入本地缓存（带短 TTL）
```

**特性**：

- 基于 LRU 淘汰，可配置容量上限
- 写入操作（put/remove）会主动失效本地缓存
- 支持配置 TTL（如 1~5 秒），即使失效失败，TTL 保证短暂不一致
- 对业务透明，无需修改代码即可开启
- 对秒杀、爆款商品等极热 Key 场景效果显著

### 5.7 容错与重试策略

- **超时重试**：可配置请求超时时间（默认 1~3 秒），超时后自动重试
- **节点摘除**：连续失败的 DataServer 会被暂时从本地路由表中标记为不可用（熔断），避免持续打故障节点
- **节点恢复**：后台定期探测被摘除节点的健康状态，恢复后重新加入
- **副本可读**：配置后可将读请求负载均衡到 Slave 副本节点，分担主节点压力
- **序列化**：默认支持 Java 原生序列化、Hessian2、Protobuf 等，用户可自定义序列化器
- **压缩**：value 超过阈值时自动开启压缩（如 Snappy/LZ4）

### 5.8 客户端 API 概览

```java
// 基础 KV 操作
Result<Void> put(int namespace, Object key, Object value);
Result<Void> put(int namespace, Object key, Object value, int version, int expireTime);
Result<DataEntry> get(int namespace, Object key);
Result<Void> remove(int namespace, Object key, int version);

// Prefix 二级索引（类似 Hash）
Result<Void> prefixPut(int ns, Object pkey, Object skey, Object value);
Result<DataEntry> prefixGet(int ns, Object pkey, Object skey);
Result<List<DataEntry>> prefixRange(int ns, Object pkey, Object start, Object end, int limit);

// 计数
Result<Integer> incr(int namespace, Object key, int delta, int initValue, int expire);

// 批量
Result<Map<Object, DataEntry>> mget(int namespace, List<Object> keys);
```

返回结果 `Result` 中包含返回码（成功/版本错误/不存在/超时等）、value、版本号。

---

## 六、分布式机制深度剖析

Tair 的分布式设计有三大支柱：**基于 Bucket 的数据分布**、**同步复制的多副本容灾**、**在线无感的数据迁移**。本章深入这三大机制的实现原理。

### 6.1 数据分布：为什么用 Bucket 而不是一致性哈希？

分布式 KV 系统常见的数据分布方式有三种：

| 方案 | 代表系统 | 原理 | 节点变化影响 |
|------|---------|------|-------------|
| **取模 hash** | 早期 Memcached 集群 | `hash(key) % N` | 节点增减时几乎全部 key 重映射，缓存雪崩 |
| **一致性哈希** | Memcached client、Redis Cluster（虚拟节点） | 哈希环 + 虚拟节点 | 仅部分 key 重映射，但分布均匀性依赖虚拟节点数 |
| **预分片 + 中心对照表** | **Tair** | 固定 Q 个 Bucket，Bucket → DS 映射动态调整 | 仅迁移 Bucket 粒度的数据，完全可控 |

Tair 选择第三种方案的核心原因：

1. **迁移粒度可控**：Bucket 数量 Q 远大于机器数（如 10240 个桶 vs 100 台机器），每台机器负责约 100 个桶，扩容时只需迁移部分桶到新机器
2. **分布均匀**：`hash(key) % Q` 天然均匀，每个桶数据量大致相等
3. **位置感知容易**：为每个桶指定副本位置，可以方便地做跨机房放置
4. **迁移过程可精细管理**：桶是迁移单位，可以限速、并发、断点续传

**Bucket 数量 Q 的选择**：

- Q 过太小（如 < 机器数）：数据分布不均，迁移粒度太粗
- Q 过太大（如 > 100 万）：对照表太大，Client 和 DS 同步开销高
- 生产环境推荐 Q = 1023 / 4096 / 10240，这和 Dynamo 论文中 "Q should be much larger than the number of nodes" 结论一致

### 6.2 一致性哈希思想的融入

Tair 的 Bucket 机制和一致性哈希本质上是等价的：

- 一致性哈希的"虚拟节点" ≈ Tair 的 Bucket
- 一致性哈希环上虚拟节点→物理节点的映射 ≈ Tair 的对照表
- 区别：Tair 由 ConfigServer 集中维护映射，一致性哈希由客户端各自计算

Tair 选择集中式映射的好处：可以做位置感知、负载均衡、迁移调度等全局优化，而纯客户端一致性哈希难以做到。

### 6.3 多副本复制机制

#### 6.3.1 复制架构

```
                    Master DS (bucket X)
                   /       |        \
                  /        |         \
                 v         v          v
            Slave1 DS  Slave2 DS  Slave3 DS
           (副本1)     (副本2)    (副本3)
```

- **单 Master 多 Slave**：每个 bucket 有唯一 master，写仅由 master 处理
- **同步链式/并行复制**：master 写完本地后，同步复制到所有 slave，等待全部成功才返回 client
- **复制内容**：不是复制操作命令（statement-based），而是复制最终数据（row-based），简化一致性保证

#### 6.3.2 写流程详解

```
Client --> put(key, val, version=v) --> Master DS
                                          |
                                 +--------+--------+
                                 |                 |
                                 v                 v
                            本地存储引擎         Slave DS1
                           (写 mdb/ldb)            |
                                 |                 v
                                 |            存储引擎写入
                                 |                 |
                                 +<-- ACK ---------+
                                 |
                            （等待所有副本 ACK）
                                 |
                                 v
                          返回 Client 成功
```

#### 6.3.3 一致性模型

Tair 多副本提供 **强一致性**（同步复制下）：

- 客户端收到成功响应时，数据在所有副本上都已持久化（或已入内存）
- 读主返回的一定是最新数据
- 节点故障恢复时通过副本补充保证数据不丢（已返回成功的数据）

**持久化引擎（ldb）vs 缓存引擎（mdb）的一致性差异**：

| 引擎 | 复制时机 | 故障容忍 |
|------|---------|---------|
| mdb（内存） | 写入内存后即 ACK | 整机宕机可能丢失未 checkpoint 数据（可接受，本身就是缓存） |
| ldb（磁盘） | WAL 落盘后 ACK | 单盘故障数据不丢；多副本同时损坏概率极低 |

### 6.4 在线数据迁移

Tair 的在线迁移是其支持 **不停服扩缩容** 的关键。本节从触发、流程、一致性保证三方面深入。

#### 6.4.1 触发时机

- **新节点加入**：扩容场景，需要把老节点的部分桶移到新节点
- **节点故障不可恢复**：故障节点的桶需要在其他节点重建副本
- **节点主动下线**：运维缩容，把要下线节点的桶迁走
- **负载不均衡**：某些节点负载过高，CS 触发负载再平衡
- **机房变更**：新增机房，需要把副本分布到新机柜

#### 6.4.2 迁移流程状态机（单个 bucket 视角）

```
[源 DS 持有 bucket 主/副本]
        |
        | CS 下发迁移指令 (src=DS-A, dst=DS-B, bucket=N)
        v
[迁移准备]
        |  DS-A 和 DS-B 建立迁移专用连接
        |  DS-B 初始化 bucket N 的接收上下文
        v
[全量迁移阶段]
        |  DS-A 迭代 bucket N 内所有 key-value
        |  批量发送到 DS-B
        |  DS-B 写入本地存储引擎并 ACK
        v
[双写同步阶段]
        |  全量完成后到切流前的新写入，DS-A 同时写 DS-B
        |  保证这期间的新数据不丢
        v
[切流]
        |  CS 收到迁移完成通知，更新对照表
        |  版本号 +1
        |  Client 感知版本变更，新请求路由到 DS-B
        v
[源清理]
        |  DS-A 删除 bucket N 的本地数据
        v
[迁移完成]
```

#### 6.4.3 迁移中的读写一致性

| 数据状态 | 读请求路由 | 写请求处理 |
|---------|-----------|-----------|
| **未迁完** | 旧表 → DS-A | DS-A 本地写 + 同步到 DS-B（双写） |
| **迁移中** | 旧表 → DS-A | 同上 |
| **迁完但未切流** | 旧表 → DS-A | 同上 |
| **切流后** | 新表 → DS-B | DS-B 成为新 master |

**关键保证**：

- 迁移期间读始终返回最新数据（双写保证源和目标一致）
- 切流是原子操作（版本号切换），客户端要么全用旧表要么全用新表
- 即使在切流瞬间，最多出现一次重试，不会读到脏数据

#### 6.4.4 迁移流量控制

迁移是后台任务，需避免影响在线服务：

- **并发控制**：可配置同时迁移的 bucket 数
- **带宽限速**：可配置迁移占用的最大带宽，默认限制在较小比例
- **批量大小**：每次批量迁移的 KV 对数可调
- **时段控制**：可配置只在业务低峰期迁移
- **优先级**：紧急故障恢复优先于主动扩容迁移

### 6.5 故障检测与恢复

#### 6.5.1 故障检测

Tair 采用 **心跳超时 + 连续失败阈值** 的故障检测：

```
CS 维护每个 DS 的心跳计数器：
- 每个心跳周期（默认 1s）收到心跳 -> 计数器清零
- 未收到 -> 计数器 +1
- 计数器达到阈值（默认 3）-> 标记为不可用（TIMEOUT）
```

这种简单的 phi 风格检测在实际生产中足够稳定，避免了复杂 accrual failure detector 的复杂度。

#### 6.5.2 Master 故障恢复

```
bucket X 的 master DS-A 故障
        |
        v
CS 检测到 DS-A 不可用
        |
        v
决策：在 bucket X 的 slave 中选新 master（如 DS-B）
        |
        v
更新对照表：bucket X master -> DS-B；slave 列表补全
        |
        v
迁移任务：在其他可用 DS 上补建缺失的副本
        |
        v
版本号 +1，全网通知
        |
        v
Client 重试时自动路由到新 master DS-B
```

**RTO（恢复时间）**：心跳超时（~3s）+ 新表传播（秒级） ≈ 5~10 秒业务感知。

#### 6.5.3 Slave 故障恢复

Slave 故障更简单：

```
bucket X 的 slave DS-B 故障
        |
        v
CS 在其他可用 DS 上补建新的 slave 副本
        |
        v
从 master 全量同步 bucket X 数据到新 slave
        |
        v
新 slave 追平后加入副本组
```

#### 6.5.4 网络分区（脑裂）处理

Tair 设计上主要面向 **单集群内多机房** 部署，而非跨城多集群：

- 网络分区发生时，CS 只在自己的一侧工作（主 CS 所在侧）
- 被分区的少数派侧 DS 因连不上 CS，无法对外服务（CS 是 client 路由起点）
- 多数派侧 CS 重新生成对照表，标记少数派 DS 为不可用，在多数派补副本
- 分区恢复后，少数派 DS 上的旧数据会被迁移任务覆盖/清理

这是一种典型的 **主备中心 + 多数派可用** 模型，牺牲了少数派可用性换取简单一致性。

### 6.6 分布式一致性：CAP 权衡

Tair 在 CAP 三者中选择了 **CP**（一致性 + 分区容忍）：

- **C（一致性）**：同步复制提供强一致
- **A（可用性）**：故障时通过主备切换恢复，但切换有短暂不可用窗口（秒级）
- **P（分区容忍）**：网络分区时少数派侧不可用，多数派继续服务

这适合电商交易等对数据一致性要求高于短暂可用性的场景。

---

## 七、InvalidServer：跨集群一致性（可选）

### 7.1 部署背景

Tair 支持 **双机房独立集群** 部署模式应对机房级容灾：

- 机房 A 部署独立 Tair 集群（CS + DS + InvalidServer）
- 机房 B 部署独立 Tair 集群（CS + DS + InvalidServer）
- 业务在本机房读写，降低跨机房延迟

但这种部署带来新问题：业务在 A 机房删除/更新了 key，B 机房的旧数据仍可读，造成跨机房数据不一致。

### 7.2 InvalidServer 职责

InvalidServer 负责在对等集群之间传播"删除/隐藏"操作，保证跨集群一致性。

```
+------------------+                   +------------------+
|     机房 A       |                   |     机房 B       |
|  Tair 集群       |                   |  Tair 集群       |
|                  |                   |                  |
| Client --del(k)->|                   | Client --get(k)->|
|    |             |                   |       ^          |
|    v             |   跨机房同步        |       |          |
| InvalidServer    |<----------------->| InvalidServer    |
|    |             |   invalid/hide     |       |          |
|    v             |                   |       |          |
| 删除/隐藏 k      |                   | 收到 invalid --> |
|                  |                   | 在 B 集群 del(k) |
+------------------+                   +------------------+
```

### 7.3 核心功能

1. **跨集群 delete/hide 同步**
   - Client 调用 `invalid` 或 `hide` 操作时，请求同时发给本地 InvalidServer
   - InvalidServer 将操作同步到对端机房的 InvalidServer
   - 对端 InvalidServer 在本集群执行删除/隐藏

2. **集群断网后的脏数据清理**
   - 断网期间各机房独立写入，可能产生脏数据
   - 网络恢复后，InvalidServer 比对并清理断网期间不一致的数据

3. **访问统计**
   - 统计跨机房同步请求量、延迟等指标

### 7.4 hide 与 invalid 的区别

- **invalid**：硬删除，key 直接从存储引擎移除
- **hide**：软隐藏，key 仍然保留，但对 get 不可见（用于可恢复场景）

### 7.5 部署建议

- 单机房场景 **不需要** InvalidServer
- 双机房独立集群（主写 A、读 B 做容灾）推荐部署 InvalidServer
- 双机房容灾集群（同一集群跨机房）不需要 InvalidServer，由 ConfigServer 位置安全策略处理

---

## 八、核心数据模型与并发控制

### 8.1 基本概念

| 概念 | 说明 |
|------|------|
| **configID** | 唯一标识一个 Tair 集群，通常存放在 Diamond 配置中心，Client 初始化时使用 |
| **Namespace / Area** | 逻辑隔离单元（0~1023），不同 namespace 中 key 互不影响，同一集群可分配给多个业务使用 |
| **Quota** | 每个 namespace 的存储配额，超额后触发 LRU 淘汰（mdb）或返回错误（ldb） |
| **Prefix Key** | 二级索引结构（pkey + skey），类似 Redis Hash，支持一组关联数据的批量和范围操作 |

### 8.2 Namespace 隔离机制

```
同一集群，多个业务共用：

namespace=10 (商品服务)
  key: "item:1001" -> value: "{...}"
  key: "item:1002" -> value: "{...}"

namespace=20 (用户服务)
  key: "item:1001" -> value: "用户的购物车"   // key 相同但 namespace 不同，互不冲突
```

- 存储引擎内部 key = `(namespace << 32) | hash(key)`，物理上自动隔离
- 每个 namespace 独立配置 quota、过期策略
- 便于业务共享集群、降低运维成本

### 8.3 Version 机制：乐观锁并发控制

Tair 每个数据条目自带 **版本号（version）**，这是天然的乐观锁实现。

#### 8.3.1 并发写问题

经典 Last-Writer-Win 问题：

```
初始：key="counter", value="1", version=10

线程 A: get -> value=1, version=10
线程 B: get -> value=1, version=10

A: put("2", version=10) -> 成功！version -> 11
B: put("3", version=10) -> 失败！服务器 version=11 ≠ 传入 version=10
                              返回 VERSION_ERROR
```

B 的更新基于过期数据，被版本检查拒绝，避免了数据被意外覆盖。

#### 8.3.2 版本号变更规则

| 操作 | 版本号行为 |
|------|-----------|
| 写入新 key（未带 version 参数） | version = 1（初始化为 1） |
| 更新已有 key（未带 version） | version + 1（强制更新） |
| 更新已有 key（version 参数匹配当前版本） | version + 1（CAS 成功） |
| 更新已有 key（version 参数不匹配） | **拒绝写入**，返回 VERSION_ERROR |
| 更新时 version 参数传 0 | 强制覆盖，version + 1（跳过校验） |

#### 8.3.3 使用模式

```java
// 典型的"读-改-写"乐观锁模式
while (true) {
    Result<DataEntry> r = client.get(ns, key);
    if (!r.isSuccess()) break;

    int version = r.getValue().getVersion();
    Object newValue = modify(r.getValue().getValue());

    Result<Void> w = client.put(ns, key, newValue, version, 0);
    if (w.isSuccess()) {
        break;                           // 更新成功
    } else if (w.getCode() == VERSION_ERROR) {
        continue;                        // 冲突，重试
    } else {
        break;                           // 其他错误
    }
}
```

这一机制在云原生 Tair 中演化为 **TairString（exString）** 扩展数据结构，成为高性能分布式锁、原子计数器的基础。

#### 8.3.4 分布式锁实现

利用 version 可实现不需要 Redis SETNX 的分布式锁：

```java
// 尝试获取锁
// 传入固定 VERSION > 1，如果 key 不存在则创建，version = 传入值 + 1
Result<Void> r = client.put(ns, lockKey, "holder", INIT_VERSION, expireTime);
if (r.isSuccess()) {
    // 获锁成功
}

// 释放锁：检查 version 匹配才删除，避免误删他人持有的锁
client.remove(ns, lockKey, expectedVersion);
```

### 8.4 过期机制（ExpireTime）

Tair 支持灵活的数据过期配置：

| 参数值 | 含义 |
|--------|------|
| `0` 或不传 | 永不过期 |
| `< 0` | 不更改已有过期时间（update 时保留原 TTL） |
| `> 0 且 < 当前时间戳` | 相对时间（秒），如 `300` 表示 5 分钟后过期 |
| `> 0 且 > 当前时间戳` | 绝对时间戳（Unix 秒），指定精确时刻过期 |

过期清理策略因引擎而异：

- **mdb**：惰性删除（访问时判断）+ 后台定期扫描 + LRU 淘汰时顺带清理
- **ldb**：compaction 过程中物理删除，读取时也会判断过期

### 8.5 Prefix 二级索引

除了简单的 key-value，Tair 支持 prefix 模型（类似 Redis Hash）：

```
pkey = "user:1001"
  skey = "name"     -> "张三"
  skey = "age"      -> "25"
  skey = "city"     -> "杭州"

pkey = "user:1002"
  skey = "name"     -> "李四"
  ...
```

API：

- `prefixPut/prefixGet/prefixDel`：操作单个 skey
- `prefixRange(pkey, startSkey, endSkey)`：按 skey 字典序范围查询（ldb 引擎底层 LSM 有序，非常高效）

适用场景：一个实体有多个属性，需要按 pkey 聚合管理。

---

## 九、部署模式与容灾

### 9.1 单机房集群

```
ConfigServer (主备)
    |
    +-- DataServer x N
    |
    +-- Client (业务应用)
```

最基本部署，容忍单机/单 rack 故障；业务应用直连本机房集群。

### 9.2 双机房独立集群

```
机房 A                              机房 B
+-------------------+             +-------------------+
| CS (主备)         |             | CS (主备)         |
| DS x N            |   专线      | DS x N            |
| InvalidServer(主) |<----------->| InvalidServer(备) |
+-------------------+             +-------------------+
```

- 两机房各部署独立集群
- 业务就近写本机房
- 跨机房的 delete/hide 通过 InvalidServer 同步
- 机房 A 整个故障时，业务切换到 B 机房
- 缺点：跨机房数据同步弱（只同步删除），不适合双写场景

### 9.3 双机房容灾集群（单集群跨机房）

```
          ConfigServer (主备，机房A)
                 |
      +----------+----------+
      v                     v
+----------+           +----------+
| DS - 机A |           | DS - 机B |
| master   |<--------->| slave    |
+----------+           +----------+
```

- 一个 ConfigServer 集群管理两个机房的 DS
- 采用位置安全优先策略，每个 bucket 的 master 和 slave 分布在不同机房
- 机房 A 故障时，CS 将 B 机房 slave 提升为 master
- 优点：自动跨机房切换，强一致
- 缺点：写入跨机房同步延迟（同城 ~1ms 可接受，跨城不可接受）

### 9.4 故障场景与恢复时间

| 故障场景 | 影响 | 恢复方式 | RTO |
|---------|------|---------|-----|
| 单 DataServer 宕机 | 该 DS 负责的 bucket 短暂不可用 | 心跳超时检测 + 主从切换 | ~5-10 秒 |
| ConfigServer 主宕机 | 已有客户端不受影响，新客户端暂不能启动 | 备 CS 秒级接管 VIP | ~1-3 秒 |
| 两台 CS 同时宕机 | 新客户端无法初始化，迁移无法进行；已有客户端正常读写 | CS 重启后从心跳重建状态 | 重启时间 |
| 单机房整体故障（双机房容灾集群） | 受影响 bucket 切换到备机房副本 | 主从跨机房切换 | ~10-30 秒 |
| 网络分区（少数派侧） | 少数派侧 DS 不可服务 | 多数派侧补副本后继续服务 | 取决于分区时长 |

---

## 十、架构设计总结与对比

### 10.1 Tair 核心设计智慧

| 设计决策 | 解决的问题 | 设计哲学 |
|---------|-----------|---------|
| **二级映射（Key → Bucket → DS）** | 节点扩缩容最小化数据迁移 | 逻辑层与物理层解耦，预分片思想 |
| **固定数量 Bucket（虚拟桶）** | 数据分布均匀、迁移单位可控 | 虚拟节点思想（类似一致性哈希但更可控） |
| **版本号驱动路由更新** | 避免客户端与 CS 长连接/心跳 | Pull-based、最终一致、按需更新 |
| **轻量级 ConfigServer** | 中心化节点不成为瓶颈/单点 | 控制面与数据面分离 |
| **可插拔存储引擎** | 一套分布式框架适配多种存储需求 | 面向接口、面向抽象编程 |
| **数据版本号（乐观锁）** | 分布式并发更新竞态问题 | CAS 思想，应用层解决冲突 |
| **插件容器** | 不修改核心代码即可扩展功能 | 开闭原则，热插拔 |
| **三表迁移机制** | 迁移过程有明确中间态 | 状态机思维，迁移可观测可回滚 |

### 10.2 与 Redis Cluster 的对比

| 维度 | Tair（经典开源版） | Redis Cluster |
|------|------------------|---------------|
| 集群元数据 | 中心化 ConfigServer（主备） | 去中心化 Gossip 协议 |
| 分片单位 | 固定数量 Bucket（如 10240） | 16384 Slot |
| 路由方式 | Client 本地缓存对照表，版本号驱动 | Client 缓存 Slot 映射，MOVED/ASK 重定向 |
| 扩缩容 | CS 调度在线迁移，业务无感知 | 手动/redis-cli --cluster reshard |
| 存储引擎 | 可插拔（mdb/ldb/kdb/rdb） | 单一内存引擎 |
| 并发控制 | 内置 version 乐观锁 | 需 WATCH/MULTI 或 Lua |
| 多副本一致性 | 同步复制，强一致 | 异步复制，最终一致 |
| 复杂数据结构 | rdb 引擎支持 Redis 数据结构 | 原生丰富 |
| 持久化 | ldb LevelDB 原生持久化 | RDB/AOF |
| 跨机房 | 位置安全策略原生支持 | 需要额外方案 |

### 10.3 Tair 演进：从开源经典到云原生

经典 Tair（2010 开源）的核心设计思想深刻影响了阿里后续数据库演进。今天的 **云原生 Tair（Redis 兼容版，阿里云商业产品）** 在保留其精髓基础上做了重大升级：

- **协议兼容**：完全兼容 Redis RESP 协议，无缝接入 Redis 生态，迁移零成本
- **多线程引擎**：自研多线程内核，覆盖读写全流程，单节点 QPS 从 10 万提升至 40 万
- **Proxy 层**：集群版增加 Proxy 代理层，客户端无需感知 slot/bucket 分布，Proxy 内置热 Key 缓存（QPS 超阈值自动在 Proxy 本地缓存 value）
- **大 Key 自动处理**：内置阈值（默认 10MB）检测，异步删除、自动分片拆分
- **分层存储**：基于 DRAM/NVM（持久内存）/ESSD 云盘推出内存型、持久内存型、磁盘型产品，成本最低可达 Redis 开源版 15%
- **扩展数据结构开源**：TairString、TairHash、TairZset、TairBloom、TairVector 等扩展模块开源为 Redis Module，反哺社区
- **无感切换**：VIP + 中心化 Config Server 路由，主从切换 < 1 秒，业务基本无感知
- **云原生能力**：Serverless KV、弹性扩缩容、全球多活、透明加密、任意时间点恢复

### 10.4 结语

Tair 作为阿里巴巴最早开源的基础设施之一，其架构设计代表了 2010 年前后中国互联网公司在超大规模分布式系统领域的工程智慧。无论是经典的 **中心调度 + 客户端路由** 模式，还是 **可插拔存储引擎** 的抽象，都深深影响了后续众多分布式存储系统的设计。

虽然今天云原生 Tair 已经演进为 Redis 兼容的商业产品，但开源经典版 `github.com/alibaba/tair` 仍然是学习分布式 KV 系统设计的优秀范本——它的代码量适中、架构清晰、文档完善，值得每一位分布式系统开发者研读。

---

## 参考资源

- Tair GitHub 仓库：https://github.com/alibaba/tair
- Tair Wiki：https://github.com/alibaba/tair/wiki
- InfoQ 淘宝 Tair 技术剖析：https://www.infoq.cn/article/taobao-tair
- 阿里云开发者社区 - Tair 技术专栏：https://developer.aliyun.com/group/redis
- 云数据库 Tair 官方文档：https://help.aliyun.com/product/26389.html
