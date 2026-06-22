---
source: https://www.yuque.com/yangguangfanxing/nmhuv1/dqnzk9areuc1s1nd
---

# Architecture

> 原文链接：[https://www.yuque.com/yangguangfanxing/nmhuv1/dqnzk9areuc1s1nd](https://www.yuque.com/yangguangfanxing/nmhuv1/dqnzk9areuc1s1nd)

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239839969-4b9d5fb3-230b-4e92-a4a2-9ff0997cd69e.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239839881-b0b7b5b4-e27f-430e-a26e-0c1daa081a89.png)

## 回顾：向量数据库的基本任务

向量数据库可以概括为：

![](https://cdn.nlark.com/yuque/__latex/1fe0e18ba7926c9df9fef58049cd4192.svg)

基本流程：

1. 将原始数据通过 embedding model 转换为向量 ![](https://cdn.nlark.com/yuque/__latex/712ecf7894348e92d8779c3ee87eeeb0.svg)。
2. 将向量 ![](https://cdn.nlark.com/yuque/__latex/712ecf7894348e92d8779c3ee87eeeb0.svg) 与相关属性存入数据库。
3. 查询时将 query 转换为查询向量 ![](https://cdn.nlark.com/yuque/__latex/34c7b563b30bde3c748139530686798e.svg)。
4. 在数据库中寻找 ![](https://cdn.nlark.com/yuque/__latex/34c7b563b30bde3c748139530686798e.svg) 的最近邻。

主要操作包括 insert、delete、update、get by key，以及 kNN、range query、filtered query、multi-vector query 和 reranking。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239839909-b309e6b8-14de-461a-a74a-ddc179aade77.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239839876-8ff42267-2855-4759-917a-1ad497e87daa.png)

## ANNS Index 回顾

ANNS index 在多个指标之间权衡：recall、latency、throughput、memory 和 update cost。

常见索引：

| 类型 | 代表方法 |
| --- | --- |
| 表 / 聚类结构 | Flat, IVF |
| 树结构 | ANNOY |
| 图结构 | HNSW, DiskANN |
| 哈希结构 | LSH |

索引还可叠加 SQ、PQ 等量化方法，或组成 IVFPQ、IVF-HNSW、IVF+HNSW+PQ 等组合索引。为了提供新鲜结果，系统还需要 freshness layer；为了避免重建，可使用 SPFresh、FreshDiskANN 等 updatable index。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239839819-9de8697b-111d-42e8-b304-2738d3716b81.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239842460-42a24b5f-8011-41ad-8cd5-9d226d152ed7.png)

## 逻辑 VDBMS 组件

一个概念架构：

| 组件 | 作用 |
| --- | --- |
| API | 接收插入、查询、删除等请求 |
| Planner | 生成查询计划 |
| Executor | 执行查询计划 |
| Query processor | 管理查询处理逻辑 |
| Liveness | 管理更新可见性、freshness、tombstone |
| Index | 支持 ANN 搜索 |
| Storage manager | 管理持久化存储 |
| Storage | 保存向量、属性、索引、日志 |

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239842670-139b72c8-c85e-4949-b90a-a60680528118.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239842509-810ebe8c-3211-4ae1-95f2-285de89a2452.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239842472-c39a2969-b9c9-489c-80a3-b31bac9adf69.png)

生产系统还会包含 monitoring、backup、orchestration、inference、plugin storage/index、multi-tenancy、security/compliance、coordination 等模块。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239842483-58bc354b-194e-4b5d-ad95-bd0a5688b324.png)

## 早期架构：Vearch

Vearch 是较早的分布式向量搜索系统，采用定制化分布式架构：sharding、ingest queue、文件存储，并服务过生产系统。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239843775-3f73ab7e-3ede-448f-a663-f37817aea4fa.png)

#### 1. 查询架构

Vearch 的搜索子系统是层级结构：

![](https://cdn.nlark.com/yuque/__latex/d3bcabcf29f1fa7f556009576286dfd6.svg)

查询流程：

1. 查询到达 frontend。
2. Frontend 选择 blender 进行负载均衡。
3. Blender 提取特征，联系所有 brokers。
4. Broker 联系每个 shard 的一个 searcher。
5. Searcher 执行局部 IVF 搜索。
6. Broker 和 blender 逐级聚合结果。

**Blender 是搜索子系统的顶层调度与协调中心**，其核心角色类似于一个**分布式查询的“大脑”或“指挥者”。**

在 Vearch 系统中，Blender 是搜索子系统的顶层调度与协调中心，其核心角色类似于一个分布式查询的“大脑”或“指挥者”。它的主要功能可以概括为以下几点：

1. 查询接收与分发

- 接收查询：Blender 接收来自前端服务的用户查询请求。
- 任务分发：它将一个完整的查询请求（如一个 k-近邻搜索）拆解，并并行地分发给下一层的多个 Broker 节点。图中展示了一个 Blender 可以连接多个 (m个) Broker，从而实现并行处理，这是实现高性能搜索的关键。

1. 结果聚合与融合

- 结果收集：各个 Broker 在接收到来自下层 Searcher 的搜索结果后，会将结果返回给 Blender。
- 融合排序：Blender 负责聚合来自所有 Broker 的候选结果。它需要对所有结果进行去重、合并，并执行最终的全局排序（例如，根据距离分数重新排序），从而从海量候选集中筛选出最精确的 Top-K 个结果。

1. 负载均衡与高可用

架构图中明确标注了存在 k 个 Blender 实例。这意味着：

- 负载均衡：前端请求可以均匀地分发到不同的 Blender 实例上，避免单点瓶颈，提高系统的整体吞吐量。
- 高可用性：如果一个 Blender 实例发生故障，其他实例可以接管其工作，保证搜索服务不中断。

1. 对外提供统一接口

- Blender 对前端（Frontend）屏蔽了底层复杂的分布式搜索细节。前端只需要与 Blender 交互，无需关心请求被发给了多少个 Broker 或 Searcher。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239843554-edde5e5a-db48-4cb7-994d-e8cb2f658a7b.png)

#### 2. 索引与更新

Vearch 使用 IVF：每个 cluster 维护向量列表，并用 end position table 加速插入。每个 searcher 管理一个 shard，索引驻留在 searcher RAM 中，属性存储在 forward index 中。

更新方面同时维护 full index 和 real-time index：

- full index：夜间 ingest buffer，每周重建完整索引。
- real-time index：插入追加到最近 cluster，更新/删除通过 bitmap 标记 valid/invalid。

**简单比喻**：把整个索引库想象成一座**中央图书馆**的所有藏书目录。

- **End Position Table** 是**每个书架**内部的索引卡，告诉你哪个位置是空的可以放新书。
- **Shard Index Vertical** 是建立了**多个****完全相同的****、分布在不同城区的社区分馆**。每个分馆都有一套完整的藏书目录。市民（查询请求）可以就近去任何一个分馆查找，分馆的目录就在管理员手边（内存中），查找速度极快。如果某个分馆关门了，市民可以去另一个分馆。

##### End Position Table（结束位置表）

这是一个**优化数据插入性能**的机制，与**倒排文件** 的数据结构紧密相关。

**它要解决什么问题？**在一个标准的倒排索引中，每个聚类中心对应的向量列表通常是顺序存储的。当需要插入一个新向量时，理想的情况是把它直接追加到这个列表的末尾。但如果每个列表是紧密连续存储的，插入到中间位置会导致其后的所有数据都需要向后移动，这是非常低效的。

**它是如何工作的？**

1. **预留空间**：系统为每个聚类的向量列表预先分配一块**固定大小**的连续存储空间（可以想象成一个“槽位数组”）。
2. **记录指针**：“结束位置表”本质上就是一个指针数组，它记录了每个聚类列表中**当前最后一个有效向量的位置**（即“结束位置”）。
3. **高效插入**：当一个新向量被分配到某个聚类时，系统只需：

**带来的好处：**

- **O(1)复杂度插入**：插入操作变成了简单的追加和指针更新，避免了大规模的数据移动。
- **保持数据局部性**：同一个聚类的向量仍然存储在相对连续的内存/磁盘空间中，有利于缓存和批量读取，这对后续的快速搜索至关重要。

**简单比喻**：就像一个图书馆为每个主题（聚类）的书架预留了一整排空位。图书管理员手边有一个“结束位置表”，记录了每个主题书架最后一本书的位置。新书到来时，管理员查表，把书放到下一个空位，然后更新一下表格即可，无需移动其他书架的书。

##### Shard Index Vertical（垂直分片索引）

这是一个**数据分布与高可用性**的架构设计，用于构建分布式向量检索服务。

**“Vertical”（垂直）在这里的含义是什么？**

- **水平分片**：通常是指将**数据本身**按行或按范围切分，分布到不同机器上。例如，将用户ID 1-1000W的数据放在分片A，1000W-2000W的数据放在分片B。
- **垂直分片**：更准确的描述是**“基于功能或副本的分片”**。它是指**整个完整的索引**被复制成多个相同的副本（分片），每个副本作为一个独立的服务单元，共同来承载查询请求。这是一种“全量数据，多副本服务”的模式。

**它是如何构建和工作的？**

1. **分片创建**：整个向量索引（包含所有聚类和向量）被逻辑上划分为多个**分片**。图中显示，每个分片都有**多个副本**，目的是实现**高可用**和**负载均衡**。
2. **索引加载**：每个**搜索器** 进程，在内存中加载并持有一个完整分片的索引数据。这正是“One shard per searcher”的含义。这使得查询延迟极低，因为所有比较都在内存中进行。
3. **路由与查询**：

1. **前向索引存储**：搜索器不仅存储向量索引，还存储每个向量对应的“产品属性”。这是一个标准的**前向索引**，键是向量ID或图片URL，值是属性（如标题、价格等）。当搜索到最近的向量后，可以立即“前向”查找并返回这些属性，无需再访问其他数据库，极大地提升了端到端的查询效率。

**带来的好处：**

- **高可用**：多副本机制避免了单点故障。
- **高并发**：多个搜索器副本可以同时处理针对同一分片的查询，提升了系统的整体吞吐量。
- **低延迟**：索引和属性全部在搜索器内存中，响应速度极快。
- **可扩展**：可以通过增加每个分片的副本来提升该分片的服务能力，或增加总分片数来水平扩展整体数据容量。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239843451-d884bb42-7cd9-4bd0-b9e2-0d850cd9a911.png)

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239843464-127cd2aa-5ddb-4240-8bb6-db8f739feb20.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239843539-ed99f88a-d4bb-4ce9-b231-bd43ecf5117d.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239843938-02d433f5-582f-4d04-acd4-b36880103945.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239844026-d6d148dc-4eb0-49f9-8d18-b7f8d84f96fb.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239844136-8293278d-971d-49ea-b1cd-88ec1f15fcf3.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239844130-bf98875e-40b9-48f1-b90a-63a2888d4aa7.png)

**FULL INDEX** 和 **REALTIME INDEX** 的主要区别如下：

| **维度** | **FULL INDEX (批量索引)** | **REALTIME INDEX (实时索引)** |
| --- | --- | --- |
| **1. 处理方式** | **批量、周期性**处理 | **实时、原子性**处理 |
| **2. 核心流程** | 日志记录 -> 夜间定时导入 -> 周级重建 | 对插入、更新、删除操作立即响应 |
| **3. 数据流** | 数据先进入缓冲区，延迟处理 | 数据直接处理，无缓冲延迟 |
| **4. 索引更新** | 通过**每周重建**整个索引来生效 | 通过**立即追加**到最近簇来生效 |
| **5. 属性与状态维护** | 在重建阶段统一构建属性数据库和有效位图 | 在每次操作时原子性地更新属性库和位图 |
| **6. 主要目标** | 保证索引的**全局最优**和**数据一致性**，适用于可容忍延迟的数据刷新 | 保证数据的**近实时可用性**和**快速可见**，适用于需要即时响应的场景 |
| **7. 适用场景** | 非频繁更新、可接受小时/天级延迟的批量数据（如后台分析、定时报表） | 需要支持在线插入、更新、删除操作的交互式应用（如商品搜索、实时推荐） |

`FULL INDEX`是**批量导向、延迟生效**的离线处理模式；`REALTIME INDEX`是**操作导向、立即生效**的在线处理模式。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239844522-e1b1cd35-b8d9-459a-827d-cb14ccb53d32.png)

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239844474-6429238d-7304-4df7-aadd-6577d31569fc.png)

#### 3. 性能与问题

![](https://cdn.nlark.com/yuque/__latex/049516e22226e779d6c04302b4d9127c.svg)，20 个 searchers + 6 个 blenders/brokers，平均延迟约 100ms，P99 超过 300ms，最大延迟 2.1s，吞吐约 1800 QPS。

主要问题：延迟高、吞吐低、资源消耗大、real-time index 干扰吞吐、每周重建、节点角色固定导致弹性差。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239844530-f958a279-d589-4430-8c2f-dc87e5d48091.png)

## 现代架构：Manu / Milvus 2.0

Manu 是 Milvus 2.0 背后的架构思想，采用 service-oriented / disaggregated design。

核心特点：

- 不同功能由独立 workers 执行。
- 组件通过 distributed log 连接。
- coordinators 负责调度和元数据。
- index、search、storage 可独立扩缩容。
- 支持多种索引，如 FAISS、HNSWlib、ANNOY。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239844797-63e5d4c3-a1cf-448b-8aef-1e569ead760b.png)

### 需求如何转化为架构特性

| 需求 | 架构特性 |
| --- | --- |
| Row-level ACID 足够 | 支持单行 insert/update/delete/query |
| 一致性不能只有 strong/eventual | 提供 bounded staleness / delta consistency |
| GPU、索引、存储成本不同 | 功能解耦，独立扩缩容 |

Delta consistency 允许用户指定最大 stale 时间 ![](https://cdn.nlark.com/yuque/__latex/e7ccb9bf589e539415d2ed8b202fb932.svg)，比强一致和最终一致更灵活。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239844797-b24d1d41-8256-4bd8-94d3-ffc12996f263.png)

### 数据组织

Manu 存储：

- user data：key / ID + vector + attributes
- metadata：sequence number

数据按 primary key 静态划分为 shard：

![](https://cdn.nlark.com/yuque/__latex/8aad2fbd268aa520838facd096ccc44c.svg)

Shard 再划分为 segment：

| Segment | 含义 |
| --- | --- |
| Growing segment | append-only，正在写入 |
| Sealed segment | read-only，已封存并可建索引 |

segment 在达到 512MB 或经过 10 秒后 seal 并建索引。Growing segment 还会划分为 slice，例如每个 slice 有 10K vectors，完整 slice 可建 IVF 以支持搜索。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239844933-30a403d7-eddb-48c2-8076-42712fb67919.png)

### Manu 架构分层

#### 1. Storage layer

对象存储（S3、MinIO、文件）保存 columnar binlog、vectors、attributes、index、segment mapping SSTables。

KV store（etcd）保存 metadata、状态信息，并供 coordinators 使用。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239845315-059b961c-e2da-4c38-8276-5f1106a617eb.png)

#### 2. Worker nodes

Workers 是 stateless 的，彼此无直接协调，可独立扩缩容：

| Worker | 作用 |
| --- | --- |
| Query node | 执行搜索 |
| Data node | 将排队更新持久化为 binlog |
| Index node | 构建索引 |

**Binlog** 是 **Binary Log** 的缩写，即二进制日志。它是一种**顺序记录所有数据变更（插入、更新、删除）事件的只追加文件**。你可以把它理解为系统数据变化的“完整磁带录像”。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239845152-ffd9f08f-1180-4b9a-a1df-3b83e86cc390.png)

#### 3. Coordinators

| Coordinator | 职责 |
| --- | --- |
| Root coord | 管理系统、集群、collection，提供 timestamp oracle service |
| Data coord | 管理 data nodes 和 segment 路径 |
| Query coord | 管理 query nodes，将 segment 分配给 query nodes |
| Index coord | 管理 index nodes 和 index metadata |

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239845329-8633ce6e-81ab-43bd-ac58-d16d455f95f1.png)

#### 4. Access layer

通常是 stateless proxy：接收请求、用 metadata cache 验证、分发给 workers、聚合结果并返回。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239845350-b34c8ae0-db78-42af-9cc7-673bb31f4c10.png)

### Log Backbone：WAL 作为系统骨架

Manu 使用 Write-Ahead Log 连接组件，通常由 Kafka / Pulsar 实现。

所有状态变化都发布到 WAL：insert vector、delete vector、create/delete collection、metadata/control-plane changes。节点订阅 WAL；查询请求通常绕过 WAL，直接走查询路径。

优点：组件解耦、独立扩缩容、统一 data plane 和 control plane、提供一致时间语义。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239845732-299dfd41-cb41-436c-b184-5b0a2d7889ae.png)

### 插入路径：从 insert 到 index

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239845651-335ad4c8-415a-4f89-b422-ea3067f83ca0.png)

插入请求流程：

1. Proxy 验证请求。
2. Timestamp oracle 分配 LSN (**Log Sequence Number**) / sequence number。
3. 根据 key 分配 segment。
4. 写入 WAL。
5. 将 key-segment mapping 写入 LSM tree。
6. insert 可 acknowledge，但后台流程继续。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239845785-f8bbde0a-afa1-4797-b3e0-8cb4e8a42852.png)

Key 到 shard 的映射可写为：![](https://cdn.nlark.com/yuque/__latex/e193e412b18de1e553c132e3159379fd.svg)

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239846055-0c982e5c-5600-4eed-8020-86a7ee68c0e7.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239845823-b90512cb-d039-4121-9508-167398fb6e38.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239846219-a3131560-9027-445b-b12d-bf77cb9d4123.png)

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239846271-c2bb975c-faa1-4e37-9787-e5345cab4c93.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239846334-0634a7cb-fecd-499c-ad22-05548844f762.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239846333-60af1b46-e7b0-4cad-b592-b875137e191a.png)

之后：

- Query node 订阅 WAL，更新 RAM 中 growing segment，并按需为 slice 建轻量索引。
- Data node 订阅 WAL，转换为 columnar binlog，写入 object store；如果 segment 满足条件，则 seal 并通知 coordinator。

Slice 的概念与作用：

- **层级关系**：在 Manu 中，数据首先被写入到处于 **Growing** 状态的 Segment 里。为了更高效地管理和查询这些数据，系统会将一个大的 Segment 切分成多个较小的 **Slice**。通常情况下，**一个 Slice 大约包含 1万条向量数据**。
- **核心目的**：将大数据块切分成小切片，主要是为了支持**增量索引构建**和**资源隔离**。每个小切片可以独立地被处理，而不会阻塞整个 Segment 的写入操作。

为了更直观地理解 Slice 索引的定位，可以参考 Manu 中索引的三种状态：

| 数据状态 | 索引类型 | 存储位置与特点 |
| --- | --- | --- |
| **Growing Segment** | **Slice Index (临时索引)** | 仅存在于 **Query Node 的内存**中。随数据写入动态构建，提供低延迟查询。 |
| **Sealed Segment** | **Full Index (完整索引)** | 持久化存储在 **对象存储（如 AWS S3）**中。数据冻结后离线构建，供长期查询使用。 |
| **异常/迁移状态** | **无索引 (Binlog)** | 依赖底层的 Binlog 数据进行回放和查询。 |

简而言之，Slice 是 Manu 为了平衡**写入速度**与**查询性能**而设计的“分块”策略，而 Build Slice Index 则是让系统在面对流式数据时，依然能保持亚秒级响应能力的关键优化手段。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239846749-e07c7f87-0acc-42b6-8069-d8111d55d89c.png)

- Data coordinator 通知 index coordinator；
- index node 加载 binlog、构建索引、存入 storage；
- query coordinator 再通知 query node 加载索引。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239846783-ae46d4e8-17be-4a79-9861-44ea972b94a6.png)

### 复杂架构的收益

虽然路径复杂，但收益明显：

- WAL 写入后即可快速确认 insert。
- 读写路径基本解耦。
- WAL + growing segment 构成 liveness layer。
- WAL 和 binlog 提供 fault tolerance。
- log 提供一致时间语义。
- 各功能组件可独立扩缩容。
- 新分析任务可通过订阅 WAL / binlog 接入。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239846814-a293e619-2fe8-4013-8122-83de2378ecc0.png)

### 查询路径

简单查询流程：

1. Proxy 根据 cached metadata 联系 query nodes。
2. Query nodes 并行运行 kNN。
3. 每个 query node 搜索自己负责的所有 segments。
4. 每个 query node 返回局部 top-k。
5. Proxy 聚合全局 top-k。
6. 返回结果。

本质是分布式 top-k merge，但 Manu 通过服务解耦使扩缩容更灵活。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239846829-243f7d72-2938-4d3d-a779-168986271715.png)

### Delta Consistency

设查询时间为 ![](https://cdn.nlark.com/yuque/__latex/aee3c627a51feaa9ae9728090354dc3f.svg)，用户指定最大 stale 时间为 ![](https://cdn.nlark.com/yuque/__latex/e7ccb9bf589e539415d2ed8b202fb932.svg)，query node 已接收的最新更新时间为 ![](https://cdn.nlark.com/yuque/__latex/1f96a44e66fac346bde8c25379712ba2.svg)。

系统要求：查询必须包含 ![](https://cdn.nlark.com/yuque/__latex/b2337841a2e267addae5ccb7dd02a916.svg) 之前的所有更新；![](https://cdn.nlark.com/yuque/__latex/b2337841a2e267addae5ccb7dd02a916.svg) 到 ![](https://cdn.nlark.com/yuque/__latex/aee3c627a51feaa9ae9728090354dc3f.svg) 之间的更新可包含也可不包含。

判断规则：

- 若 ![](https://cdn.nlark.com/yuque/__latex/cff3bb9ce0c0d6ce863908c100cf5e80.svg)，说明必须包含的更新还没到，查询需要等待。
- 若 ![](https://cdn.nlark.com/yuque/__latex/6e7fdf53c02e3512a0d7479caa6d4f33.svg)，说明相关更新已到，可以执行查询。

**系统通过 LSN、watermarks、heartbeats 跟踪每个 channel 的更新时间**。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239846853-00c4d0c4-6029-43eb-b00a-cb8bd4fcb635.png)

### 其他架构考虑

- Full index rebuild：从 data coord 获取 segment 路径，分配 index nodes，构建后通知 query nodes 加载。
- Delete/update：通常通过 per-segment bitmap 或 tombstone 标记，后续在 rebuild/compaction 时清理。
- Segment reassignment：用于扩缩容、负载均衡、故障恢复，由 query coordinator 管理。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239847530-f2106c60-c0a5-4953-8369-39eabefa74e9.png)

- 论文还讨论 filtered queries、multi-vector queries、Bayesian optimization for index configuration、SIMD/GPU 优化、time travel、fault tolerance、monitoring 和 load balancing。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239847356-554e205e-72ff-4eea-a579-f6cd72fcd21e.png)

### 性能结果

#### 单机性能

配置：单节点 EC2 m5.4xlarge，16 vCPU、64GB RAM，Recall@50，SIFT 10M 和 DEEP 10M。结论是 Manu 单机性能较好，SIMD 和 CPU 优化很重要，磁盘系统在该实验下较慢。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239847360-a5945087-9e36-4613-9762-62d135e5f336.png)

#### Elasticity

配置：4 nodes，包括 2 data nodes、1 query node、1 index node，SIFT 100M，Recall@50 > 80%。系统可根据延迟调整 query nodes：低于 100ms 可减少，高于 150ms 可增加。

SIFT 的全称是 **Scale-Invariant Feature Transform（尺度不变特征变换）**。

- **来源**：它最初是由计算机视觉专家 David Lowe 在 1999 年提出的算法，用于从图像中提取具有尺度、旋转和光照不变性的特征点。
- **数据结构**：提取出来的特征通常被表示为高维向量。最经典的 SIFT1M 数据集包含 **100万条 128维** 的向量。
- **SIFT 100M** 具体指的是包含 **1亿条（100 Million）128维** 向量的数据集

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239847371-278a3b6e-c26b-4f80-9fc6-2c7c98a6ef11.png)

#### Scalability

Segmenting 允许随着数据集大小和 query nodes 数量近似线性扩展，即使使用 HNSW 这类图索引也能扩展。若想更好利用图索引的亚线性复杂度，可以增大 segment size。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239847334-fd4e0e15-c82b-4805-88fa-e7972752b316.png)

#### Index building

单个 index node 在 EC2 m5.4xlarge 上可在 1 小时内处理 100M vectors。由于查询和建索引路径解耦，对查询影响较小，但可能影响较小 ![](https://cdn.nlark.com/yuque/__latex/e7ccb9bf589e539415d2ed8b202fb932.svg) 下的 freshness。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239848427-63ab6e45-3c13-49af-9c39-5ae47ead1221.png)

## 总结

本讲展示了向量数据库架构从早期定制化系统 Vearch，到现代解耦式系统 Manu / Milvus 2.0 的演进。

核心思想：

1. 向量数据库不只是 ANN index，还包括 storage、**liveness**、WAL、coordinators、workers、access layer。
2. 早期系统角色固定、扩展性差；现代系统倾向于 disaggregated architecture。
3. WAL 是连接写入、存储、索引、查询和控制面的骨架。
4. Segmenting、growing/sealed segment、freshness layer 是支持动态数据的关键。
5. Delta consistency 用 ![](https://cdn.nlark.com/yuque/__latex/e7ccb9bf589e539415d2ed8b202fb932.svg) 给用户提供可调的新鲜度。
6. 独立扩缩容 query、data、index 组件，是现代 VDBMS 的重要架构优势。

向量数据库结合了 RDBMS、分布式系统和高维检索算法，是仍在快速发展的领域。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239848108-988277f7-08da-4252-bacd-9099354c8aaf.png)

阅读资料： [MANU: Milvus 2.0](https://zhuanlan.zhihu.com/p/9585789726)
