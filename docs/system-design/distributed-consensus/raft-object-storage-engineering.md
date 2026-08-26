# Raft 一致性引擎的工程优化深度调研

> ⏭️ **怎么读本文**：想快速了解全景 → §2 选型表 + §7 总览图；只想看**选主优化** → §4；只想看 **Snapshot 与日志堆积** → §5–§6。附录 A（MinIO 无主架构）与附录 B（TLA+）是名词解读，正文不依赖它们。

---

## 1. 为什么 AI 时代反而更需要 Raft

在 AI/大模型时代，以往"强一致分布式存储很重、很慢"的经验正在被重写：

- **模型权重、向量、embedding、训练 checkpoint** 这类对象**不可重建或重建成本极高**，一旦丢失就前功尽弃，必须靠强一致、多副本、可恢复的存储兜底。
- 向量数据库（Milvus、Qdrant 等）、对象存储（如 Ozone）需要**选主做元数据/索引分区**，需要一个稳定、可理解、可运维的一致性协议。（反例：MinIO 走完全无主路线，见 [附录 A：MinIO 完全无主架构解读](#appendix-a-minio-完全无主架构解读)）
- Raft 相比 Paxos 的最大优势是**可理解性**：状态机、日志、任期、投票，概念清晰，工程实现和排障成本远低于 Multi-Paxos，因此成为存储引擎的"默认共识引擎"。

Raft 是一个共识组件，不是数据库：它是存储引擎**底座的一部分**，负责决定"谁是权威、按什么顺序执行命令、多数派确认后持久化"。下面拆开看各家的工程取舍。

---

## 2. 主流对象/存储引擎的 Raft 选型全景

| 系统 | 语言 | Raft 实现 | 用途定位 | Raft 用于 |
|------|------|-----------|----------|-----------|
| **etcd** | Go | `etcd-io/raft`（自研官方库） | 分布式 KV 存储，K8s 控制平面 | 全量键值强一致复制 |
| **TiKV / TiDB** | Rust | `tikv/raft-rs` | 分布式事务 KV/NewSQL | **MultiRaft**：按 Region 分片，每个 Region 一个 Raft group |
| **CockroachDB** | Go | fork 自 `etcd-io/raft` | 分布式 SQL | Range 级 Raft，跨节点复制 |
| **Apache Ozone** | Java | **Apache Ratis**（第二代 Raft 实现） | **真正的对象存储**（S3 兼容） | OzoneManager 元数据 + Datanode Container |
| **SeaweedFS** | Go | 自研 raft（filer/master） | 分布式文件/对象存储 | Filer 元数据高可用、Master 选主 |
| **MinIO** | Go | 不用 Raft（纠删码 erasure code） | 对象存储 | ❌ 反例：**完全无主（leaderless）**，无任何选主机制，靠确定性哈希定位 + Gossip 传播拓扑 + EC 抗数据损坏 |
| **MongoDB** | C++ | 不用 Raft（自研 oplog/primary 选举） | 文档对象存储 | ❌ 反例：类 Raft 但自研，方便对照 |

几个关键判断：

- **Apache Ozone 是目前"最纯粹"的对象存储 + Raft 案例**：它用 Ratis（Raft）同时支撑 OzoneManager 的元数据共识，以及 Datanode 上的 Container 复制组（每个 Container 是一个 Raft group，负责对象数据分片的强一致复制），是"对象存储直接用 Raft 做数据复制"的教科书。
- **TiKV / CockroachDB 是"存储引擎 + Raft"的深度范式**：它们证明 Raft 可以做到**分片（shard）级 MultiRaft**，把数据切成几万甚至几十万个 Region/Range，每个都是独立的 Raft group，借此把单一 Raft 的热点、瓶颈和恢复粒度都打散。**MultiRaft 本身就是一种超级工程优化**，它让"选主""快照""日志追赶"都发生在很小的粒度上。
- **反例中最有价值的是 MinIO**：它靠 **EC 抗数据损坏 + 确定性哈希定位 + Gossip 传播拓扑** 实现了**完全无主（leaderless）**，不存在任何选主环节，自然也不需要 Raft。它的 Erasure Set / Pool 组织、读写流程与代价详见 [附录 A：MinIO 完全无主架构解读](#appendix-a-minio-完全无主架构解读)。MongoDB 则是"自研的类 Raft primary 选举"而非标准 Raft。这说明"Raft 不是唯一答案"，也帮我们理解 Raft 到底在解决什么、什么时候该用它。

> 结论：本文把"对象存储引擎"宽泛地理解为"承载对象/数据副本一致性"的存储底座，重点剖析 etcd、raft-rs（TiKV）、CockroachDB、Ozone/Ratis 的 Raft 工程实现。

---

## 3. Raft 库 vs Raft 应用：工程化的分层

主流工程里，Raft 被拆成**两层**：

1. **共识核心（Consensus Core）**：只实现纯算法，包括状态机、任期、投票、日志匹配、选主。**不含网络、不含磁盘、不含状态机应用**。这是 etcd-io/raft、tikv/raft-rs、Ratis 的定位。它们的共同哲学（etcd/raft README 原话）：*"most Raft implementations have a monolithic design... this library instead follows a minimalistic design philosophy by only implementing the core raft algorithm."*
2. **宿主（Host/Storage）**：调用方必须自己实现四件套：
   - **Log**（Raft 日志的持久化，WAL）
   - **State Machine**（应用数据可持久化快照）
   - **Transport**（网络传输层）
   - **租约/高可用**（选主后的租约、流量割接）

这种"算法库 + 宿主"分层的直接收益：

- **确定性（Determinism）**：etcd/raft 把 Raft 建模为纯状态机，输入（消息/本地定时器）→ 输出 `{Messages, LogEntries, NextState}`。同一状态 + 同一输入 = 同一输出，便于 [TLA+ 形式化验证](#appendix-b-tla-是什么)和随机化测试。
- **可移植**：同一种算法可被 etcd、Kubernetes、CockroachDB、TiDB、Flannel、Calico 等几十个系统复用；raft-rs 被 TiKV 及各 Rust 生态复用。
- **性能后置**：算法核心不做 I/O 优化，宿主按需做批量、并行写盘等。

理解这层后，再去读"选主优化""快照优化"，本质都是在**核心算法之上加工程糖衣**，而非发明新共识。

> **名词速查**：「TLA+ 是什么」不占正文位置，见 [附录 B：TLA+ 是什么](#appendix-b-tla-是什么)。一句话版：用数学精确描述分布式算法、再用工具穷举所有执行交错的形式化验证语言（Leslie Lamport 设计）。

---

## 4. 选主优化：从"一轮投票"到"秒级无感切换"

Raft 基础选主链路：Follower 超时未收到心跳 → 自增 term → 转 Candidate → 广播 RequestVote → 多数派同意 → 成为 Leader → 周期性心跳维持。生产中要解决三个痛点：**① 选主抖动（频繁无意义换主）；② 选举抢占不优（落后的节点当选）；③ 换主后流量割接的秒级延迟**。对应的工程优化如下。

### 4.1 随机化选举超时 + 心跳租约

- **随机化选举超时（Randomized Election Timeout）**：Raft 本就要求选举超时随机（如 `[T, 2T)`），保证几乎不会出现"平票/同时竞选"。工程上通过 `ElectionTick`（把时间抽象为 tick）实现，如 etcd/raft 默认 `ElectionTick=10, HeartbeatTick=1`。随机化让选主在多数派可用时能快速收敛到**恰好一个** Leader。
- **心跳租约（Heartbeat-based lease / check quorum）**：Leader 定期发心跳，并通过 CheckQuorum 持续确认自己仍得到多数派响应，从而维持自己的 **Leader 租约（leader lease）**。租约有两个用途：
  - **租约读（lease read）是 Leader 侧优化**：租约有效期内，Leader 确信"这段时间内不会有新 Leader 被选出来"，因此可以在**本地直接执行线性化读**，既不必把 read-index 条目写入 Raft 日志等 commit（`ReadOnlySafe` 路径），也不必每次与多数派交互确认。代价是信任所有节点时钟有界（etcd/raft 原文：*"this approach relies on the clock of the all the machines in raft group"*）。
  - **Follower 不能本地读**：Follower 的本地状态可能落后于已提交日志，没有租约作安全前提；它要提供线性化读，必须**向 Leader 发送 MsgReadIndex 请求**，拿到安全水位后等自己的 `applied` 追上再在本节点执行（etcd/raft 原文：*"followers asks leader to get a safe read index before processing read-only queries"*），或直接把读请求转发给 Leader。
  - **选主语义**：租约超时即视为 Leader 失联，配合 CheckQuorum 可触发 Leader 主动降级（见 [§4.3](#43-checkquorum-与-leader-lease)）。

### 4.2 PreVote 预投票

**问题（论文原文，§leaderelection:prevote）**：一个被分区的服务器长时间收不到心跳，会自增 term 发起选举（虽然凑不够票无法当选）。等它重新连回集群时，它**更大的 term 会传播到集群**（通过 RequestVote 或 AppendEntries 响应），**迫使当前 Leader 降级并引发一次不必要的重新选举**，即"不必要的任期提升"造成的选举扰动（disruption）。论文指出这类事件虽然罕见，但每次都会让一个 Leader 降级。

> 注意：这不涉及"已提交日志被覆盖"。Raft 的 Leader Completeness / Election Safety 属性保证已提交的日志绝不会被新 Leader 覆盖；PreVote 优化的是**可用性与扰动**，而非安全性。

**PreVote（预投票，raft-rs 中的 `CAMPAIGN_PRE_ELECTION`）**：真正的投票前，Candidate 先发起一轮"预选举"，**不递增 term**，只询问"如果我要竞选，你们会投我吗？"。只有预选举获得多数派支持（且多数派日志不比它落后）后，才进入正式选举（`CAMPAIGN_ELECTION`）递增 term。效果：

- 落后的节点无法通过预选 → **不会无谓地把 term 顶高**，正在运行的 Leader 不受干扰；
- 避免"分裂脑瞬态"；分区恢复后快速回归正常。

### 4.3 CheckQuorum 与 leader lease

先澄清一个常见的误解：**标准 Raft（论文）并不是"Leader 只要自己认为有能力就能一直当选"**。论文明确规定了 Leader 失联时的两条机制：

1. **任期（term）过期立即降级**：*"If a candidate or leader discovers that its term is out of date, it immediately reverts to follower state."*（论文 §5.1）。Leader 一旦收到更高 term 的消息（说明有别的节点发起了新选举或新 Leader 诞生），会立刻变回 Follower，不存在"拒绝新任期"。
2. **与多数派失联主动退位**：客户端交互章节明确写道：*"a leader in Raft steps down if an election timeout elapses without a successful round of heartbeats to a majority of its cluster"*（论文 §6.1）。Leader 被分区、无法向多数派完成一轮心跳并持续超过一个 election timeout 时，**标准 Raft 就会让它主动退位**，允许客户端重试其他节点。

同时，Follower 侧的机制保证集群能自愈：Follower 若在 election timeout 内收不到任何有效通信，就"assumes there is no viable leader and begins an election"（论文 §5.2）。**多数派侧的 Follower 会自动发起选举选出新 Leader**。因此"集群既无 Leader 可用、又无法选出新 Leader"的僵局在标准 Raft 中并不会出现（除非多数派本身无法互相通信，例如分裂投票，但那属于网络故障而非算法缺陷）。

**CheckQuorum（etcd/raft 的配置项）** 是把第 2 条机制**工程化、显式化**：Leader 周期性检查多数派是否仍活跃（`QuorumActive()`），若一个 election timeout 内多数派无响应，Leader 主动 `becomeFollower` 降级（raft.go 中 *"stepped down to follower since quorum is not active"*）。它和论文 §6.1 的语义一致，主要价值是**让 Leader 在自己这一侧主动感知失联**（不必被动等更高 term 的消息打过来），并配合租约读保证失联后不再服务读请求。raft-rs 中对应的是 `LeaderTransferOutOfQuorum` 等失活降级路径。它缩短了"多数派失联后的故障切换响应时间"。

> 💡 **关键点**：CheckQuorum 与 Leader Transfer（§4.4）常配合使用。运维主动换主靠 `MsgTimeoutNow` 走"目标节点立即竞选"快路径；而 CheckQuorum 处理的是被动场景，Leader 失联时自己先退位，避免"已与多数派失联却仍服务写请求"的窗口。

### 4.4 Leader Transfer 主动转移

运维最常见的需求：**在滚动升级、负载均衡、缩容时要把 Leader 主动搬到指定节点**（如搬到有数据本地拷贝的节点、搬到低负载节点）。Raft 的 `Leadership Transfer` 扩展（etcd/raft、raft-rs 的 `CAMPAIGN_TRANSFER`）实现"主动换主"：

1. 现 Leader 让目标节点先补全日志到最新（`transfer leader to X`）；
2. 向目标发送 `MsgTimeoutNow`，使其立即（不等随机等待）发起选举并大概率当选；
3. 旧 Leader 收到新 Leader 心跳后降级。

这使**换主的停机时间可控到亚秒级**，是 Kubernetes / etcd 平滑迁移的基础。

### 4.5 优先级/加权选举与候选人限制

一些工程实现进一步优化"当选者质量"：

- **日志优先/投票检查**：RequestVote 里带上 `lastLogIndex/lastLogTerm`，Follower **只投给日志不更落后的候选人**（Raft 固有），保证当选者尽可能拥有最新日志，减少日志回退成本。
- **候选人数限制 / 租约保护**：部分实现限制同一任期内的并串行竞选，配合 CheckQuorum 与 Leader 租约，避免全集群频繁抖动（展开见 [§4.5.1](#451-并串行竞选的工程抑制)）。
- **打散选举热点（分区/分片）**：MultiRaft 在**每个 Region/Range 上独立计时**，随机化在不同 group 间天然错峰，避免所有分片在同一时刻触发选举（这属于工程上"把选主压力分散"）。

#### 4.5.1 并/串行竞选的工程抑制 {#451-并串行竞选的工程抑制}

"避免全集群频繁抖动"的关键是**同时限制同一任期内的并行竞选（并）和跨任期的连续竞选（串）**。etcd-io/raft 与 raft-rs 的实现由一串机制配合完成：

**① 随机化选举超时：错开"并行竞选"的触发时刻（治本）**

选举风暴的根源是多个 Follower 同时超时、同时变 Candidate。Raft 论文要求超时从 `[T, 2T)` 随机选取；etcd/raft 的实现是 `resetRandomizedElectionTimeout()`：

```go
// raft.go
func (r *raft) resetRandomizedElectionTimeout() {
    r.randomizedElectionTimeout = r.electionTimeout + globalRand.Intn(r.electionTimeout)
}
func (r *raft) pastElectionTimeout() bool {
    return r.electionElapsed >= r.randomizedElectionTimeout
}
```

raft-rs 完全对应（`randomized_election_timeout` 字段）。效果：各节点超时时刻错开，正常情况下**只有一个**节点先超时并发起竞选，其他人收到它更高 term 的 RequestVote 后让路，并行竞选从源头被压低概率。

**② learner / 非选民不能发起竞选：减少"候选人"资格**

竞选不是所有节点都能发起的。etcd/raft 的 `promotable()`：

```go
// raft.go
func (r *raft) promotable() bool {
    pr := r.trk.Progress[r.id]
    return pr != nil && !pr.IsLearner && !r.raftLog.hasNextOrInProgressSnapshot()
}
```

**Learner（追赶中的只读副本）没有投票权也没有竞选资格**；正在做快照恢复的节点也不行。raft-rs 里是 `promotable` 字段 + `tick_election()` 里 `!self.promotable` 直接 return。这让"能竞选"的集合从"所有节点"收窄到"健康的正式 Voter"，天然减少同一任期内可能的候选人数量。

**③ 每任期每节点最多一票（first-come-first-served）：投票侧遏制"并"**

即使多个候选人同时出线，每个节点**在同一任期内也只能投出一票**。etcd/raft 通过 `poll()` + tracker 完成：

```go
// tracker/progress.go（节选）
func (r *ProgressTracker) RecordVote(id uint64, v bool) {
    if _, ok := r.Votes[id]; ok {
        return  // 已投过，忽略后续请求
    }
    r.Votes[id] = v
}
```

raft-rs 的 `tracker.rs` 同样：`self.votes.entry(id).or_insert(vote)`，**第一个先到的请求被记录，后面的全部忽略**。多数派判定只统计每个 id 的首票。这保证同一任期内不会出现"一个节点反复改票、多个候选人轮流拿票"的振荡。

**④ 未应用完配置变更时禁止竞选（raft-rs 与 etcd 都有）**

```go
// etcd/raft 在收到 MsgHup 时
if r.hasUnappliedConfChanges() { ... return }  // 还有 pending 配置变更 → 不竞选
```

raft-rs 中同样在触发竞选前检查未应用的配置变更。成员变更（ConfChange）期间集群本来就处于过渡态，这一条避免"配置还没落定就抢主"的串行扰动。

**⑤ PreVote 预选举：把"串"的代价降为零**

跨任期的连续竞选（串行抖动）主要来自**被分区的节点重连后带着更大 term 回来**，迫使当前 Leader 降级、触发一次重选（论文 §leaderelection:prevote）。PreVote 让候选人先以**不递增 term** 的方式征求多数派意见（`becoming pre-candidate` 不改 `r.Term`、不改 `r.Vote`，raft.go `becomePreCandidate()` 注释明确），多数派不认可就不进入正式选举。这样失败的竞选不消耗 term、不打断现有 Leader，串行扰动几乎为零（详见 [§4.2](#42-prevote-预投票)）。

**⑥ CheckQuorum + 租约：在"最近见过 Leader"时拒票**

最后一道滤波在**投票侧**：如果 Follower 在最近一个 election timeout 内还收到过 Leader 心跳（租约未过期），它会**忽略**带更高 term 的 RequestVote（除非是主动转移）：

```go
// raft.go Step() 对 MsgVote/MsgPreVote 的处理
inLease := r.checkQuorum && r.lead != None && r.electionElapsed < r.electionTimeout
if !force && inLease {
    // "lease is not expired" → 不更新 term、不投赞成票
    return nil
}
```

配合 `MsgCheckQuorum`（Leader 周期性向多数派发探活，`QuorumActive()` 失活即降级），集群在多数派存活时**根本不会进入选举**；只有真的失去 Leader 一段时间后，选举才被允许发生。这就把"并行竞选"压缩到"真正需要换主"的时刻。

> 小结：**① 随机超时压低同发概率 → ② promotable 收窄候选者 → ③ 单 term 单票锁定选票 → ④ 配置变更期禁选 → ⑤ PreVote 消除无谓 term → ⑥ 租约内拒票**。六层机制叠加，才实现了"同一任期内的并/串行竞选都受限"的工程效果——没有一个开关能单独做到这一点。

---

## 5. Snapshot 优化：状态机灌装的工程艺术

### 5.1 快照驱动的日志截断与追赶

**为什么需要 Snapshot**：Raft 日志无限增长，必须做**日志压缩（Log Compaction）**，把已提交且已应用的日志合并成一个**状态机快照**，然后丢弃被压缩的日志。etcd/raft 和 raft-rs 都提供日志压缩接口（`Compact` / `apply_snapshot`），并维护 `compactIndex/compactTerm`、`RaftLog.first_index` 等边界。

**快照的双重角色**，既是"节省存储"，也是"恢复手段"：

- 正常路径：提交并应用的日志 → 生成快照 → 截断日志，省磁盘、加快重启恢复。
- **追赶路径**：当 Follower 落后太多，其需要的日志已被 Leader 压缩丢弃时，Leader 无法再通过 `AppendEntries` 逐条补齐，只能发 `InstallSnapshot`（安装快照）。这是"主从不一致难以收敛"场景的核心答案之一：**与其在"永不匹配"的日志缝隙里死磕，不如直接用快照把 Follower 的状态机整体覆盖到一致**（详见 [§6](#6-主从迟迟无法达成一致日志堆积怎么办)）。

以 **CockroachDB** 为例的极端工程版：它不把整个状态机序列化成字节流，而是**直接用 RocksDB 的 SST 文件 + RangeDelete 进行日志截断**，把不需要再重放的日志范围用 tombstone 标记，然后用 **addSSTable 批量灌入**。逻辑一致（把 follower 拉到 latest applied + 缺失日志），但**传输的是底层存储引擎的原生格式**，性能和网络带宽都远比逐条日志好。这就是"日志压缩"在真实引擎里的落地形态。

### 5.2 大快照分片与流控

快照可能非常大（GB 级状态机）。直接塞一个 RPC 会：

- **打爆网络缓冲**、阻塞正常的日志复制；
- 让 Leader 在发送快照期间**无法及时处理真实日志追加**；
- 造成长时间的尾延迟。

工程手段：

- **快照分片/流式传输**：Ratis 明确支持把快照按 **Chunk（块）** 流式传输（`RaftClient` 以流式方法发送快照块），目标节点边收边写、边校验。raft-rs/etcd 也在宿主层把快照切成块，配合 `MaxInflightMsgs` 流控下发。
- **快照限流与优先级（snapshot throttle）**：Ozone（Datanode 复制）和许多实现都会限制**同一时刻进行中的快照数**，避免大量落后副本同时灌快照而把网络打满。
- **并行快照/SST 灌入**：CockroachDB 用并发 `addSSTable` 并行导入多个 SST 分片；Ratis 也支持多 chunk 并发落盘。

### 5.3 快照与 I/O 之间的同步问题

一个隐蔽但致命的坑：Raft 要求**在同一个 Ready 批次里，先持久化 Entries，再持久化 HardState 与 Snapshot（顺序写盘）**。etcd/raft README 明确要求：

> *"Write Entries, HardState and Snapshot to persistent storage **in order**... When writing an Entry with Index i, any previously-persisted entries with Index >= i must be discarded."*

这意味着快照安装必须**原子的替换/覆盖本地状态**，同时保证不破坏"已提交但未应用"的日志边界。工程上通过：

- **原子重命名**：快照先写到临时文件，全部就绪后 rename 替换（Ozone/Ratis 同此思路）。
- **内存 RaftLog 指针迁移**：`RaftLog.restore(snapshot)` 会把 `committed/applied/unstable.offset` 重新定位到快照位置，丢弃所有已被快照覆盖的 unstable 日志。

> ⚠️ **易踩的坑**：快照覆盖前，磁盘上若还有 `index >= 快照位置` 的旧日志，必须在写入新快照时一并丢弃（论文与 etcd/raft README 都强调这一点），否则重启恢复时可能出现"日志与状态机不一致"。

---

## 6. 主从迟迟无法达成一致：日志堆积怎么办

**主节点长时间与某个从节点无法达成一致**（Follower 掉线/网络分区/磁盘慢/换主后丢失日志），积攒了非常多的 LogEntry，怎么办？

> ⏭️ 想看机制层面怎么收敛，先读 §6.1–§6.3；想了解架构层面怎么防止堆积，直接跳到 §6.4（MultiRaft + Learner）。

先明确结论：**当 Leader 无法通过 `AppendEntries` 补齐、且已积压大量日志时，停止"日志层面"的纠缠，直接用 Snapshot 把落后节点整机覆盖。** 下面拆解完整的工程策略谱系。

### 6.1 收敛机制：拒绝 + 回退 + 快照

Raft 的**日志匹配（Log Matching）**天然自带"快速回退（fast rollback）"：

1. Follower 收到 `AppendEntries`，若 `prevLogIndex/prevLogTerm` 不匹配（例如它缺了中间很多条目），就**拒绝（reject）**并附上 `rejectHint = lastIndex`（raft-rs 中 `m.reject_hint = self.raft_log.last_index()`）。
2. Leader 利用 rejectHint **指数退避回退 matchIndex**，找到真正能接上的位置再续传。
3. **若 Leader 的 matchIndex 需要回退到已被压缩并丢弃的日志（`first_index` 之后没有），就无法续传了**。此时 Leader 判定"只能走快照"，转而发送 `InstallSnapshot`。

关键工程点：**日志被压缩（compact）是触发快照追赶的分水岭。** 只要日志还没被截断，即使积压再多，理论上还能逐条补（只要带宽允许、掉线的节点还在）。工程上为了**不让未同步的日志无限膨胀**，会主动让"落后太多"的节点走快照。参考 raft-rs 中当 `reject` 且 `request_snapshot` 置位时直接发快照请求的代码路径。

### 6.2 maxUncommittedSize：限制无界日志增长

真实隐患：如果 Leader 一直有大量提案进来，而一个 Follower 一直收不到，Leader 的**未提交（uncommitted）日志会无限增长**，最终 OOM。raft-rs 用 **`UncommittedState.max_uncommitted_size`** 做软上限：

- Leader 跟踪当前未提交条目的累积字节数（`uncommitted_size`）；
- 当新增提案会让 `uncommitted_size` 超过上限时，**直接丢弃该提案（dropped）**，返回给调用方失败；
- 这实现了 etcd/raft 与 raft-rs 都宣传的 *"protection against unbounded log growth when quorum is lost"*，在不至于饿死正常提案的前提下遏制内存失控。

同时 raft-rs 用 `max_apply_unpersisted_log_limit` 控制 **applied 与 persisted 之间的最大缝隙**，避免"应用了大量还没持久化的日志"带来的恢复风险。

### 6.3 inflight 流控与批量推进

为了让"正常追日志"高效，工程上有两件套（etcd-io/raft 明确列出的特性）：

- **Optimistic Pipelining**：Leader 不必等上一批日志被 Follower 确认就继续发送下一批（乐观流水线），显著降低复制延迟。
- **Flow control via `maxInflightMsgs` + `Match/Next` Progress 状态机**：每个 Peer 维护 `progress`（`matchIndex/nextIndex/inflight`），防止给落后节点塞爆。raft-rs 还提供 `maybe_free_inflight_buffers` 释放空闲 group 的内存、`adjust_max_inflight_msgs` 动态调速。
- **Batching**：批量合并多条 Raft 消息（减少网络 syscall）、批量合并 log entries（减少磁盘 fsync 次数）、**Leader 并行写自己磁盘的同时发给从节点**（I/O 与网络并行），都是吞吐关键。

这套机制让"落后的从节点"在恢复后能以接近线性的速度追上，而不是永远在慢速重放。

### 6.4 多副本（Learner）与解耦：TiKV MultiRaft 的答案

TiKV / CockroachDB 从**架构层面**化解"单点日志堆积"：

- **MultiRaft（分区/Region 级共识）**：把数据切成几十万个小 Raft group。某个 Region 的副本落后，只影响该 Region，其他 Region 照常；追赶也发生在**小粒度**上，快照更小、更快。
- **Learner（只读/追赶副本）**：新加入副本先以 Learner 身份**只接收、不投票**，日志追上、快照装好后再转为正常 Voter。这样"加副本追赶"完全不影响集群可用性。
- **Placement Driver / Range 调度**：由中心控制面（TiKV 的 PD、CockroachDB 的 Distributor）持续巡检副本健康状况，把落后的副本标记、触发快照追赶、必要时重建副本。

这也解释了为什么 MultiRaft 系统"不怎么怕单个节点掉线很久"：追赶被控制在 Region 粒度，并有中心调度兜底。

### 6.5 工程兜底：重试、告警与自愈

最后是一整套**运维级**的策略（很多是宿主层而不是算法层的）：

- **快照重试与幂等**：`Node.ReportSnapshot()` 告知库快照发送结果，失败会退回到日志补齐或重试，保证最终收敛。
- **健康巡检与自愈**：Ozone、TiKV 的监控指标（`raft_log_gap`、`snapshot_inflight`、`regions_with_missing_peers` 等）持续暴露落后程度，超过阈值触发告警与自动补副本。
- **日志压缩策略调参**：提高 `MaxInflightMsgs`、减小 `maxMsgSize`、设置合理的快照频率，让"掉线恢复 + 追赶"在可接受的滑窗内完成，避免永远追不上。

---

## 7. 一张图总结

```mermaid
flowchart TB
    subgraph write["✍️ 写入链路"]
        A["客户端"] -->|写入| B["Leader 共识核心"]
        B --> C{"已持久化到多数派?"}
        C -- 是 --> D["提交 + 应用 + 通知客户端"]
        C -- 否 --> B
    end

    subgraph elect["🗳️ 选举优化"]
        E["PreVote 预选举<br/>不提升 term"]
        F["CheckQuorum / 租约<br/>失联主动降级"]
        G["随机化超时 + 日志检查投票"]
        H["Leader Transfer<br/>主动秒级换主"]
        I["并/串行竞选抑制<br/>六层机制"]
    end

    subgraph catchup["📥 追赶与快照"]
        J["AppendEntries 逐条补齐<br/>reject + rejectHint 回退"]
        K{"日志已被压缩?"}
        K -- 否 --> J
        K -- 是 --> L["InstallSnapshot 快照安装<br/>分片 + 流控 + 原子替换"]
        M["maxUncommittedSize 限制<br/>未提交日志无界增长"]
        N["MultiRaft 分片 + Learner<br/>小粒度追赶"]
        O["inflight 流控 + 批量 + 流水线"]
    end

    B --> E
    B --> H
    E --> I
    J --> K
    B --> M
    B --> N
    B --> O

    style A fill:#E17055,stroke:#C0392B,color:#fff,stroke-width:2px
    style B fill:#6C5CE7,stroke:#5A4BD1,color:#fff,stroke-width:2px
    style C fill:#FDCB6E,stroke:#E0B050,color:#2D3436,stroke-width:2px
    style D fill:#55EFC4,stroke:#00B894,color:#2D3436,stroke-width:2px
    style J fill:#0984E3,stroke:#0770C2,color:#fff,stroke-width:2px
    style K fill:#FDCB6E,stroke:#E0B050,color:#2D3436,stroke-width:2px
    style L fill:#636E72,stroke:#2D3436,color:#fff,stroke-width:2px
    style M fill:#0984E3,stroke:#0770C2,color:#fff,stroke-width:2px
    style N fill:#0984E3,stroke:#0770C2,color:#fff,stroke-width:2px
    style O fill:#0984E3,stroke:#0770C2,color:#fff,stroke-width:2px
    style E fill:#6C5CE7,stroke:#5A4BD1,color:#fff,stroke-width:2px
    style F fill:#6C5CE7,stroke:#5A4BD1,color:#fff,stroke-width:2px
    style G fill:#6C5CE7,stroke:#5A4BD1,color:#fff,stroke-width:2px
    style H fill:#6C5CE7,stroke:#5A4BD1,color:#fff,stroke-width:2px
    style I fill:#6C5CE7,stroke:#5A4BD1,color:#fff,stroke-width:2px
    style write fill:#FAD7D4,stroke:#E17055,stroke-width:2px,color:#2D3436
    style elect fill:#E8E4F5,stroke:#6C5CE7,stroke-width:2px,color:#2D3436
    style catchup fill:#DCEFFB,stroke:#0984E3,stroke-width:2px,color:#2D3436
```

### 核心结论速览

| 问题 | 主流工程答案 |
|------|--------------|
| 选主抖动/无谓换主 | PreVote（预投票不升 term）、CheckQuorum 失活降级 |
| 选举抢占不优 | 日志检查投票（只投给不落后的）、Leader Transfer 主动转移 |
| 读延迟/换主延迟 | 领导者租约读（lease read，Leader 本地读省去 quorum 往返）、Follower 走 ReadIndex、秒级主动换主 |
| 日志无限膨胀 | `maxUncommittedSize` 丢弃超额提案（etcd/raft、raft-rs） |
| 日志被压缩后从节点落后 | **放弃逐条补，直接 InstallSnapshot 整体覆盖** |
| 大快照传输 | 分片/流式块传输（Ratis chunk）、流控+限流、CockroachDB SST 灌入 |
| 单点拥堵热点 | **MultiRaft 分片** + Learner 追赶 + 中心调度自愈 |

---

## 8. 参考与延伸

- **etcd-io/raft**（Go，最广泛使用的 Raft 库）：https://github.com/etcd-io/raft —— 特性列表含 PreVote、CheckQuorum、Leader Transfer、日志压缩、inflight 流控、批量/流水线、无界日志保护、丢 quorum 自动降级等。
- **tikv/raft-rs**（Rust，TiKV 底座）：https://github.com/tikv/raft-rs —— `raft.rs`（`CAMPAIGN_PRE_ELECTION`、`UncommittedState.max_uncommitted_size`、reject_hint/snapshot 请求）、`raft_log.rs`（`RaftLog.restore`、`max_apply_unpersisted_log_limit`）、`storage.rs`（日志压缩接口）。
- **Apache Ozone**（真正的对象存储 + Ratis Raft）：https://ozone.apache.org/ —— OzoneManager 元数据共识 + Datanode Container 复制组，Ratis 支持快照 chunk 流式传输。
- **Apache Ratis**（Java Raft 库，Ozone 底座）：https://ratis.apache.org/ —— 第二代 Raft 实现，支持 byte-string、blocking/streaming RPC、快照分片。
- **CockroachDB**：Raft 日志截断用 RocksDB tombstone + `addSSTable` 批量灌入快照。
- **etcd-io/raft 使用方**：etcd、Kubernetes、CockroachDB、TiDB、Docker Swarm、Flannel、Calico、Hyperledger。

> 版权说明：Raft 算法与本文涉及的库均为开源（Apache-2.0 / BSD），本文为技术调研整理。

---

## 附录 A：MinIO 完全无主架构解读 {#appendix-a-minio-完全无主架构解读}

> 正文 §2 提到 MinIO 是"完全无主（leaderless）"反例。本附录展开它的组织与读写机制：MinIO 从根本上就不存在"主"，理解这些就能明白"为什么没有 Raft/没有选主也能成立"。

### A.1 节点组织：Erasure Set 与 Pool

MinIO 没有用传统环状一致性哈希，而是用**确定性哈希映射**来管理数据位置：

- **Erasure Set（ES）**：一个 ES 包含多个节点，节点下的磁盘个数必须等于纠删码 `K+M`（数据块 + 校验块）之和。例如纠删码配置为 `6+3`，则该 ES 必须有 **9 个节点**。一个文件只存储在一个 ES 内，这样既能将文件分片后均匀地分布在各节点之间，查找时也能快速得到文件物理存储节点的位置信息（若把分片散落到任意节点，文件物理位置的元信息会非常复杂）。
  - 正因为 ES 的节点数与纠删码参数强绑定，**一个 ES 对应的物理节点磁盘大小必须一致**，否则会出现负载不均和空间浪费。
- **Pool**：一个 Pool 包含多个 ES（一对多）。Pool 是 MinIO 的**最小扩容单元**，一个集群通常只包含少量 Pool。Pool 的主要作用是**物理隔离**（如不同硬件类型、不同可用区）；Pool 一旦创建，规模和配置就固定，**不能动态增删节点**。

### A.2 写入流程：Proxy 节点 + 两级哈希

1. 客户端把对象传给 **Load Balancer**，路由到一个负载较低的 MinIO 节点，该节点成为 **Proxy 节点**。
2. **Pool 选择**：Proxy 节点根据每个 Pool 的负载选择负载较低的 Pool，负载信息由 MinIO 节点间用 **Gossip 协议**交换心跳和状态信息计算得出。
3. **Erasure Set 选择**：一个 Pool 内每个 ES 有对应索引，写入时计算 `index = hash(object) % len(es_list)`，将对象放入索引为 `index` 的 ES。
4. Proxy 节点对对象做**切分与纠删码计算**，然后把计算好的块写入对应 ES 的各节点。

### A.3 读取流程：同哈希定位 + 半数确认

1. **Pool 探测**：Proxy 节点通过 Gossip 协议持有整个集群的"地图"（Pool → 其下 ES → 每个 ES 的节点 IP）。因为完全无主，Proxy 会向 Pool 发出请求询问；但由于写入时已用 hash 定位 ES，**读取时也用同样的 hash 定位**，因此只需探测与 Pool 个数相等的 ES，不必广播到集群所有节点。
2. **半数确认**：目标 ES 下所有节点收到请求后检查自己存储的数据，若包含目标对象则回复 Proxy。Proxy 收到**半数以上节点确认存在**时，才认定文件确实存在，因为单个节点不一定权威（可能网络延迟或正在恢复数据中）。
3. **组装返回**：Proxy 请求目标 ES 获取所有 Chunk 下的 Block，在本地组装数据，返回给 Load Balancer 并最终返回客户端。

### A.4 已知代价

- **ListFile 等全局操作需要广播**：由于完全无主，这类请求依赖**全局广播**来收集全局文件信息，存在潜在的性能瓶颈。
- **哈希分布不均**：写入时按确定性哈希决定文件位置，可能导致文件在 ES 之间分布不均。但 MinIO 官方认为**随机性本身会摊平这种不均**。

> 一句话总结：MinIO 用 **EC 抗数据损坏 + 确定性哈希免去元数据索引 + Gossip 传播拓扑**，把"谁存哪、谁还活着"的所有问题都变成了**无中心的计算**，自然也就不需要 Raft 的选主、日志复制和快照那一整套机制。代价是 List 类全局操作和动态扩缩容能力受限，而这正是 Raft 主从架构擅长的场景。

---

## 附录 B：TLA+ 是什么 {#appendix-b-tla-是什么}

在讨论 Raft 工程实现时经常看到这个词（etcd-io/raft 仓库就有专门的 `tla/` 目录），本附录把它解释清楚。

**TLA / TLA+**（Temporal Logic of Actions，动作时序逻辑）是图灵奖得主 **Leslie Lamport**（Paxos 算法与 LaTeX 的作者）设计的**形式化规格语言**，专门用来精确描述并发与分布式系统、并自动验证其正确性。它要解决的问题是：

普通测试只能覆盖"走过的几条路径"，而分布式系统的问题几乎都出在**极端交错**上：两个节点同时投票、消息乱序、网络分区又恢复，这些组合数量爆炸，无法靠测试穷尽。TLA+ 换了一条路：

1. **写规格（Specification）而不是代码**：用集合论 + 逻辑精确写出"系统允许做什么状态转移、哪些不变量永远不能违反"（如：任意时刻至多一个 Leader；已提交的日志不能再被覆盖）。
2. **用工具自动穷举**：
   - **TLC 模型检查器**：把系统所有可达状态和消息交错**自动穷举**，检查是否存在违反安全属性（Safety，坏情况绝不出错）或活性属性（Liveness，好事最终会发生）的执行路径。
   - **TLAPS 证明系统**：对规模大到穷举不动的规格做数学证明。

对 Raft 而言，TLA+ 的作用是**从数学上保证共识算法的安全性**：Raft 论文本身就以等效形式化描述呈现，而生产级实现（etcd-io/raft 的 `tla/` 目录、tikv/raft-rs 的 TLA 模型）会维护一份对应的 TLA+ 规格，用它验证选举、日志复制、成员变更不会出现"双主""日志冲突"等灾难。这也是为什么 §3 强调"确定性"：只有把 Raft 建模成纯状态机，才能把同构的 TLA+ 模型对齐到真实的工程实现上。

> 一句话：**TLA+ = 用数学精确描述分布式算法，再用工具自动穷举所有可能的执行交错，提前发现测试抓不到的并发 bug。** 它是共识协议、分布式数据库等"高可靠系统"的行业标准验证手段（Chrome 的网页渲染、AWS 众多核心服务也用 TLA+ 验过）。
