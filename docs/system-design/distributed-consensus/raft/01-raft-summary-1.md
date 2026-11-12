# Raft协议概览

Raft是一个用来管理多副本日志（replicated log）的共识算法。想象一下，一个木筏（Raft）是由多根整齐一致的原木（Log）组成的，而原木又是由木质材料组成，所以你可以认为日志是由多条日志项（Log entry）组成的，如果把日志比喻成原木，那么日志项就是木质材料。故而算法起名为Raft，可以看到[Raft官方网站](https://raft.github.io/)的icon就是一个木筏。

Raft is a consensus algorithm for managing a replicated log. It produces a result equivalent to (multi-)Paxos, and it is as efficient as Paxos, but its structure is different from Paxos; this makes Raft more understandable than Paxos and also provides a better foundation for building practical systems.

Raft通过问题分解，将复杂的共识问题拆分成三个子问题，分别是：

- Leader 选举（**Leader election**），Leader 故障后集群能快速选出新 Leader；
- 日志复制（**Log replication**）， 集群只有 Leader 能写入日志， Leader 负责复制日志到 Follower 节点，并强制 Follower 节点与自己保持相同；
- 安全性（**Safety Property**），一个任期内集群只能产生一个 Leader、已提交的日志条目在发生 Leader 选举时，一定会存在更高任期的新 Leader 日志中、各个节点的状态机应用的任意位置的日志条目内容应一样等。

除核心算法外，在Raft工程实践中还需关心集群成员变更、日志压缩等问题，接下来我们会一一说明。

在[《In Search of an Understandable Consensus Algorithm (Extended Version)》](https://pages.cs.wisc.edu/~remzi/Classes/739/Spring2004/Papers/raft.pdf)论文中以浓缩的形式总结了算法以供参考：

![raft.png](https://images.spumn.eu.cc/distributed-consensus/2ccd57393e3d3fde.png)

## 成员身份

成员身份，又叫做服务器节点状态，Raft 算法支持Leader、Follower和Candidate 3 种状态。

- Follower：就相当于普通群众，默默地接收和处理来自领导者的消息，当等待领导者心跳信息超时的时候，就主动站出来，推荐自己当候选人。
- Candidate：候选人将向其他节点发送请求投票消息，通知其他节点来投票，如果赢得了大多数选票，就晋升当领导者。
- Leader：蛮不讲理的霸道总裁，一切以我为准，平常的主要工作内容就是 3 部分，处理写请求、管理日志复制和不断地发送心跳信息，通知其他节点"我是领导者，我还活着，你们现在不要发起新的选举，找个新领导者来替代我。"

需要注意的是，Raft 算法是强领导者模型，集群中只能有一个Leader。

## 领导者选举

Raft将时间划分为任意长度的term（任期），term被编号为连续的整数，这相当于muti-paxos中的epoch，这是所有代次统一共识模型相同特性。

代次共识将整个时间分为一个或多个阶段，每个阶段被称为一个代次（Epoch）。每个代次都对应一个进程，该进程是本代次的主持人， 试图在本代次内推动所有进程形成共识。

每个term从选举（election）开始，在选举中一个或多个candidate会试图成为leader。如果candidate赢得选举，那么它将在该term余下的时间了作为leader提供服务。

![图片](https://images.spumn.eu.cc/distributed-consensus/76a345e92f652686.png)

在某些情况下，一次选举可能导致投票决裂，此时该term最终可能没有leader，那么很快会开始一个新的term（伴随一次新的选举）。Raft确保一个给定的term中最多只会有一个leader。**Raft使用了随机选举超时（election timeout）时间特性以确保投票决裂很少发生**，且投票决裂可以被快速解决。也就是说，每个节点等待领导者节点心跳信息的超时时间间隔是随机的。

在Raft官网上有一个可视化Leader election过程，初学者可以用于参考：[The Secret Lives of Data](http://thesecretlivesofdata.com/raft/)。接下来我们具体走一遍该流程。

首先，在初始状态下，集群中所有的节点都是跟随者的状态。

![learder1.png](https://images.spumn.eu.cc/distributed-consensus/6b41a4fae2925cf9.png)

节点 A 的等待超时时间最小（150ms），它会最先因为没有等到领导者的心跳信息，发生超时（election timeout）。节点 A 就**增加自己的任期编号(terms)**，并推举自己为候选人，先给自己投上一张选票，然后向其他节点发送请求投票 RPC 消息（RequestVote RPC），请它们选举自己为领导者。

![leader2.png](https://images.spumn.eu.cc/distributed-consensus/49e999fd935aab3c.png)

每个服务器会按先到先得（first-come-first-served）的方式给最多一个candidate投票。假设其他节点接收到候选人 A 的请求投票 RPC 消息，在编号为 1 的这届任期内，也还没有进行过投票，那么它将把选票投给节点 A，**并增加自己的任期编号**。

![leader3.png](https://images.spumn.eu.cc/distributed-consensus/f155ed95886e46a7.png)

如果候选人在选举超时时间内赢得了"大多数"的选票，那么它就会成为本届任期内新的领导者。节点 A 当选领导者后，他将周期性地发送心跳消息（AppendEnties RPC），通知其他服务器我是领导者，阻止跟随者发起新的选举，篡权。

![leader4.png](https://images.spumn.eu.cc/distributed-consensus/cba153bbb3460902.png)

## 日志复制

在 Raft 算法中，副本数据是以日志的形式存在的，领导者接收到来自客户端写请求后，处理写请求的过程就是一个复制和应用（Apply）日志项到状态机的过程。

日志项（Log entry）是一种数据格式，它主要包含用户指定的数据，也就是**指令（Command）**，还包含一些附加信息，比如**索引值（Log index）**、**任期编号（Term）**。

![图片](https://images.spumn.eu.cc/distributed-consensus/e41995df46284f3f.png)

- 指令：一条由客户端请求指定的、状态机需要执行的指令。
- 索引值：日志项对应的整数索引值。它其实就是用来标识日志项的，是**一个连续的、单调递增的整数号码**。
- 任期编号：创建这条日志项的领导者的任期编号。

需要强调的是一届领导者任期，往往有多条日志项。而且**日志项的索引值是连续的**。

Raft 的日志复制其实是一个优化后的二阶段提交（将二阶段优化成了一阶段），减少了一半的往返消息，也就是降低了一半的消息延迟，具体过程如下图所示：

- 接收到客户端请求后，领导者基于客户端请求中的指令，创建一个新日志项，**并附加到本地日志中**。
- 领导者通过日志复制 RPC（**AppendEntries RPC**），将新的日志项复制到其他的服务器。
- 如果领导者接**收到大多数的"复制成功"响应**后，领导者**会将这条日志项提交（Commit）并应用到它的状态机中**。
- 领导者将执行的结果返回给客户端。
- **当跟随者接收到心跳信息，或者新的日志复制 RPC 消息后**，如果**跟随者发现领导者已经提交了某条日志项，而它还没应用，那么跟随者就将这条日志项应用到本地的状态机中**。

![appendLog2.png](https://images.spumn.eu.cc/distributed-consensus/8e6c36654628d646.png)

这里Leader应用本地日志项到状态机后，并没通知跟随者应用日志项。因为**当其他节点接受领导者的心跳消息，或者新的日志复制 RPC 消息后，就会将这条日志项应用到它的状态机**。而这个优化，降低了处理客户端请求的延迟，将二阶段提交优化为了一段提交，降低了一半的消息延迟。

需要注意的是，作为强领导者模型，leader会决定什么时候能够安全地将日志条目应用到状态机，这种条目被称为committed的。Raft保证committed的条目时持久性的，且最终将会被所有可用的状态机执行。一旦leader知道了一条log entry已经被复制到大多数服务器上，那么该条目会变成committed的。**这还会提交在leader的日志中所有之前的条目。**

The leader decides when it is safe to apply a log entry to the state machines; such an entry is called committed. Raft guarantees that committed entries are durable and will eventually be executed by all of the available state machines. A log entry is committed once the leader that created the entry has replicated it on a majority of the servers (e.g., entry 7 in Figure 6). This also commits all preceding entries in the leader's log, including entries created by previous leaders.

在实际环境中，复制日志的时候，你可能会遇到进程崩溃、服务器宕机等问题，这些问题会导致日志不一致。在 Raft 算法中，领导者通过强制跟随者直接复制自己的日志项，处理不一致日志。也就是说，Raft 是通过以领导者的日志为准，来实现各节点日志的一致的。具体有 2 个步骤。

- 首先，领导者通过**日志复制 RPC 的一致性检查，找到跟随者节点上，与自己相同日志项的最大索引值**。也就是说，这个索引值之前的日志，领导者和跟随者是一致的，之后的日志是不一致的了。
- 然后，领导者**强制跟随者更新覆盖的不一致日志项，实现日志的一致。**

具体操作方式在[《In Search of an Understandable Consensus Algorithm (Extended Version)》](https://pages.cs.wisc.edu/~remzi/Classes/739/Spring2004/Papers/raft.pdf)论文中有详细描述：

To bring a follower's log into consistency with its own, the leader must find the latest log entry where the two logs agree, delete any entries in the follower's log after that point, and send the follower all of the leader's entries after that point. All of these actions happen in response to the consistency check performed by AppendEntries RPCs. The leader maintains a nextIndex for each follower, which is the index of the next log entry the leader will send to that follower. When a leader first comes to power, it initializes all nextIndex values to the index just after the last one in its log (11 in Figure 7). If a follower's log is inconsistent with the leader's, the AppendEntries consistency check will fail in the next AppendEntries RPC. After a rejection, the leader decrements nextIndex and retries the AppendEntries RPC. Eventually nextIndex will reach a point where the leader and follower logs match. When this happens, AppendEntries will succeed, which removes any conflicting entries in the follower's log and appends entries from the leader's log (if any). Once AppendEntries succeeds, the follower's log is consistent with the leader's, and it will remain that way for the rest of the term.

我们具体走一遍该过程，首先我们引进AppendEntries RPC中的两个变量：

- `PrevLogIndex`：表示当前要复制的日志项，**前面一条日志项**的索引值。比如在图中，如果领导者将索引值为 8 的日志项发送给跟随者，那么此时 PrevLogIndex 值为 7。
- `PrevLogTerm`：表示当前要复制的日志项，前面一条日志项的任期编号，比如在图中，如果领导者将索引值为 8 的日志项发送给跟随者，那么此时 PrevLogTerm 值为 4。

![appendLog3.png](https://images.spumn.eu.cc/distributed-consensus/e17bad8a172f3817.png)

- 领导者通过日志复制 RPC 消息，发送当前最新日志项到跟随者（为了演示方便，假设当前需要复制的日志项是最新的），这个消息的 `PrevLogIndex` 值为 7，`PrevLogTerm`值为 4。
- 按图中情况，跟随者在它的日志中，找不到与 `PrevLogIndex` 值为 7、`PrevLogTerm` 值为 4 的日志项，也就是说它的日志和领导者的不一致了，那么跟随者就会拒绝接收新的日志项，并返回失败信息给领导者。
- 这时，**领导者会递减要复制的日志项的索引值**，并发送新的日志项到跟随者，这个消息的 `PrevLogIndex` 值为 6，`PrevLogTerm` 值为 3。
- 上图中跟随者在它的日志中，找到了 `PrevLogIndex` 值为 6、`PrevLogTerm` 值为 3 的日志项，那么日志复制 RPC 返回成功，这样一来，领导者就知道在 `PrevLogIndex` 值为 6、`PrevLogTerm` 值为 3 的位置，跟随者的日志项与自己相同。
- 领导者通过AppendEntries RPC，强行覆盖follower的`LogIndex = 6`之后的日志项。

## 安全性

前面的章节描述了Raft如何选举领导和复制日志。然而，这些讨论过的机制目前还不能充分确保每个状态机会精确地按照相同的顺序执行相同的指令。Raft在所有时刻都保证了下图这些性质的每一条都成立：

![raft2.png](https://images.spumn.eu.cc/distributed-consensus/82185ab3bba25107.png)

Raft中关键的安全性是图中的State Machine Safety Property：如果任意服务器将一个特定的日志条目应用到了其状态机中，那么不会有服务器apply具有相同index的不同Log Entry。

Safety: the key safety property for Raft is the State Machine Safety Property in Figure 3: if any server has applied a particular log entry to its state machine, then no other server may apply a different command for the same log index. Section 5.4 describes how Raft ensures this property; the solution involves an additional restriction on the election mechanism described in Section 5.2.

### 选举约束

Raft通过加入了一个对哪些服务器可以被选举为leader的约束完善了Raft算法。

为了保证Leader Completeness性质，在 Raft 算法中，约定了选举规则，主要有这样几点：

-  在一次选举中，**每一个服务器节点最多会对一个任期编号投出一张选票**，并且按照"**先来先服务**"的原则进行投票。 
-  日志完整性高的跟随者（也就是**最后一条日志项对应的任期编号值更大，索引号更大**），**拒绝投票给日志完整性低的候选人**。 

Raft作为强领导者模型，通过比较日志最后一个条目的index和term来确定哪个日志更新。如果日志最后个条目的term不同，那么有最新的term的日志更新。如果两个日志最后的term相同，那么更长的日志更新。

RequestVote RPC实现了这一约束：

![leader5.png](https://images.spumn.eu.cc/distributed-consensus/da73f3d12633cb58.png)

该方法会保证在过去的term中已被提交的条目在选举之初就在每个新的leader上，而不需要将这些条目再传输给leader。这意味着日志条目仅单向流动：从leader到follower，且**leader永远不会覆写它的日志中已存在的条目。**

除了选举规则外，我们还需要**避免一些会导致选举失败的情况，比如同一任期内，多个候选人同时发起选举，导致选票被瓜分，选举失败**。那么在 Raft 算法中，如何避免这个问题呢？答案就是随机超时时间。

在 Raft 算法中，随机超时时间是有 2 种含义的：

-  **跟随者等待领导者心跳信息超时的时间间隔**，是随机的； 
-  如果候选人在一个随机时间间隔内，没有赢得过半票数，那么选举无效了，然后候选人发起新一轮的选举，也就是说，**等待选举超时的时间间隔，是随机的**。 

总结一下Raft 算法和兰伯特的 Multi-Paxos 不同之处，主要有 2 点：

-  在 Raft 中，不是所有节点都能当选领导者，只有日志较完整的节点（也就是**日志完整度不比半数节点低的节点），才能当选领导者**； 
-  其次，**在 Raft 中，日志必须是连续的**。 

### 对提交的限制与幽灵复现问题
**除了对选举增加一点限制外，我们还需对 commit 行为增加一点限制，来完成我们 Raft 算法核心部分的最后一块拼图。**
回忆下什么是 commit：
当 leader 得知某条日志被集群过半的节点复制成功时，就可以进行 commit，committed 日志一定最终会被状态机 apply。
所谓 commit 其实就是对日志简单进行一个标记，表明其可以被 apply 到状态机，并针对相应的客户端请求进行响应。
然而 leader 并不能在任何时候都随意 commit 旧任期留下的日志，即使它已经被复制到了大多数节点。Raft 论文给出了一个经典场景：
这里主要通过 (c) 和 (d) 来说明问题所在。
**阶段a**： 是 leader，收到请求后将 `(term2, index2)`只复制给了 ，尚未复制给  ~。
**阶段b**： 宕机， 当选 `term3` 的 leader（、、 三票），收到请求后保存了 `(term3, index2)`，尚未复制给任何节点。
**阶段c**： 宕机， 恢复， 重新当选 `term4` 的 leader，**继续将 **`**(term2, index2)**`** 复制给了 S3**，已经满足大多数节点，**我们将其 commit**。
**阶段d**：又宕机，恢复，S5 重新当选 leader（、、 三票），将 `(term3, inde2)`复制给了所有节点并 commit。注意，此时发生了致命错误，已经 committed 的 `(term2, index2)` 被 `(term3, index2)` 覆盖了。

![图片](https://images.spumn.eu.cc/distributed-consensus/202fdf98f556b7f5.png)
这就产生了"幽灵复现"的问题。"幽灵复现"的问题本质属于分布式系统的"第三态"问题，即在网络系统里面，对于一个请求都有三种返回结果：成功，失败，超时未知。对于超时未知，服务端对请求命令的处理结果可以是成功或者失败，但必须是两者中之一，不能出现前后不一致情况。
为了避免这种错误，我们需要添加一个额外的限制：
**Leader 只允许 commit 包含当前 term 的日志**。
在加入以上约束后，在(d) 和 (e) 分别对应 `term=4` 有没有复制到多数派的情况。
虽然加了这个约束不会重复提交了，但如果一直没新的请求进来，`(term3, index2)` 岂不是就一直不能提交？那这里不就阻塞了吗？。假设 (c) 或 (d) 中 `index=2` 那条日志里的 Command 是 `Set("k", "1")`，S5 当选 Leader 后，客户端来查询 `Get("k")`，Leader 查到日志有记录但又不能回复 1 给客户端(因为按照约束这条日志未提交)，线性一致性要求不能返回陈旧的数据，Leader 迫切地需要知道这条日志到底能不能提交。
为了将上一个Term未Committed的Log Entry转为Committed，Raft 的解决方案如下：
Raft算法要求Leader当选后立即追加一条no-op的特殊内部日志，并立即同步到其它节点，实现前面未Committed日志全部隐式提交。从而保证了两个事情：
- 通过最大Commit原则保证不会丢数据，即是保证所有的已经Committed的Log Entry不会丢；
- 保证不会读到未Committed的数据，因为只有no-op被大多数节点同意并提交了之后（这样可以连带往期日志一起同步），服务才会对外正常工作；**no-op日志本身也是一个分界线，no-op之前的Log Entry被提交，之后的Log Entry将会被丢弃**。

本质上，**no-op 日志使 Leader 隐式地快速提交之前任期未提交的日志，确认当前** `commitIndex`，这样系统才会快速对外正常工作。在etcd中就实现了该方案，在节点启动时，leader需要获取每个follower（和learner）的进度，并**以当前term提交一条空日志条目，以提交之前term的日志**。
### 定时与可用性
我们对Raft的要求之一是安全性决不能依赖timing，在领导选举中，timing最重要的一个方面。只要系统满足如下的timing requirement，那么Raft就能够选举并维护一个稳定的leader：

是服务器将RPC并行地发送给集群中的每个服务器并收到它们的响应的平均时间，是选举超时的时间间隔，是单个服务器发生两次故障间的平均时间。论文中也有给出经过作者Implementation and evaluation之后的参考：

Raft's RPCs typically require the recipient to persist information to stable storage, so the broadcast time may range from 0.5-20 ms, depending on storage technology. As a result, the election timeout is likely to be somewhere between 10-500 ms. Typical server MTBFs are several months or more, which easily satisfies the timing requirement.

这个时间需要根据实际工程自行配置，在etcd中 默认心跳间隔时间（heartbeat-interval）是 100ms， 默认竞选超时时间（election timeout）是 1000ms：

*etcd/raft/raft.go*:

*etcd/contrib/raftexample/raft.go*：

尽管我们已经通过了解了 Raft 算法的核心部分，但相较于算法理论来说，在工程实践中仍有一些现实问题需要我们去面对。Raft 非常贴心的在论文中给出了两个常见问题的解决方案，它们分别是：

- **日志压缩**：如何解决日志集合无限制增长带来的问题。
- **集群成员变更**：如何安全地改变集群的节点成员。

## 日志压缩

我们知道 Raft 核心算法维护了日志的一致性，通过 apply 日志我们也就得到了一致的状态机，客户端的操作命令会被包装成日志交给 Raft 处理。

然而在实际系统中，客户端操作是连绵不断的，但日志却不能无限增长：

-  首先它会占用很高的存储空间； 
-  其次每次系统重启时都需要完整回放一遍所有日志才能得到最新的状态机。 

因此 Raft 提供了一种机制去清除日志里积累的陈旧信息，叫做**日志压缩（Log Compaction）**。

快照（Snapshot）是一种常用的、简单的日志压缩方式，ZooKeeper、Chubby 等系统都在用。当然压缩的增量方法例如log cleaning或者log-structured merge trees也是可行的，但是与Snapshotting相比，需要很多额外机制与复杂性。

简单来说，就是将某一时刻系统的状态 dump 下来并落地存储，这样该时刻之前的所有日志就都可以丢弃了。所以大家对"压缩"一词不要产生错误理解，我们并没有办法将状态机快照"解压缩"回日志序列。

注意，**在 Raft 中我们只能为 committed 日志做 snapshot**，因为只有 committed 日志才是确保最终会应用到状态机的。

快照一般包含以下内容：

- **日志的元数据**：最后一条被该快照 apply 的日志 term（`lastIncludedTerm`） 及 index(`lastIncludedTerm`)
- **状态机**：前边全部日志 apply 后最终得到的状态机

下图展示了一个节点用快照替换了 `(index1,term1)` —— `(index5,term3)`的日志。快照只保存了当前状态（在本例中为变量x和y），该snapshot的`lastIncludedIndex = 5`，`lastIncludedTerm = 3`，即为log entry 6的前一条数据。

![image.png](https://images.spumn.eu.cc/distributed-consensus/8f80e00a9a1a6f74.png)

如果只由 leader 做 snapshot 然后发送给其他节点，会浪费网络带宽。故而每个节点可以独立的选择何时做 snapshot，而不是由 leader 统一发起 snapshot：

- snapshot 只清理 committed log，每个节点有能力独立的做 snapshot，不会带来一致性问题；
- 每个节点的配置和状态可能不同，可以独立选择合适的时机做 snapshot。

这种快照策略与Raft的强领导原则相驳，因为follower可以不通过leader的知识来创建快照。但是数据仍仅从leader流向follower，我们认为这一偏差是合理的。

This snapshotting approach departs from Raft's strong leader principle, since followers can take snapshots without the knowledge of the leader. However, we think this departure is justified. While having a leader helps avoid conflicting decisions in reaching consensus, consensus has already been reached when snapshotting, so no decisions conflict. Data still only flows from leaders to followers, just followers can now reorganize their data.

当 leader 需要给某个 follower 同步一些旧日志，但这些日志已经被 leader 做了快照并删除掉了时，leader 就需要把该快照发送给 follower。

同样，当集群中有新节点加入，或者某个节点宕机太久落后了太多日志时，leader 也可以直接发送快照，大量节约日志传输和回放时间。

同步快照使用一个新的 RPC 方法，叫做 **InstallSnapshot RPC**

![image.png](https://images.spumn.eu.cc/distributed-consensus/d29289190d181908.png)

当增加了 snapshot 之后，发送 log 的过程如下:

- leader 的 next 记录了需要发送给 follower 的下一个 entry;
- 若 next 仍在 log 中，则发送后续的 entries；
- 若 next 在 snapshot 中，则发送 snapshot，发送成功后，再发送后续的 entries；
- follower 收到 snapshot 时，如果 log 与 snapshot 有冲突或者 snapshot 比 log 新，则丢弃全部 log，应用 snapshot。如果follower收到的快照是包含在它自身log entries中的（由于重传或错误），那么被快照覆盖的日志条目会被删除，但是快照之后的条目仍有效且必须被保留。

## 集群成员变更

在前文的理论描述中我们都假设了集群成员是不变的，然而在实践中有时会需要替换宕机机器或者改变复制级别（即增减节点）。一种最简单暴力达成目的的方式就是：停止集群、改变成员、启动集群。这种方式在执行时会导致集群整体不可用，此外还存在手工操作带来的风险。

为了避免这样的问题，Raft 论文中给出了一种无需停机的、自动化的改变集群成员的方式，其实本质上还是利用了 Raft 的核心算法，将集群成员配置作为一个特殊日志从 leader 节点同步到其它节点去。

最初[《In Search of an Understandable Consensus Algorithm (Extended Version)》](https://pages.cs.wisc.edu/~remzi/Classes/739/Spring2004/Papers/raft.pdf)实现成员变更的是联合共识（Joint Consensus），但这个方法实现起来难，后来 Raft 的作者就在[《CONSENSUS: BRIDGING THEORY AND PRACTICE》](https://github.com/ongardie/dissertation)的*Chapter 4 Cluster membership changes*中提出了一种改进后的方法，**单节点变更（single-server changes）**。两种算法都是为了避免由于节点切换配置时间不同导致的同一term出现不只一个leader的问题，如下图所示。

![image.png](https://images.spumn.eu.cc/distributed-consensus/0207d84343f181ef.png)

### 成员变更的问题

在集群中进行成员变更的最大风险是，可能会同时出现 2 个领导者。

假设我们有一个由节点 A、B、C 组成的 Raft 集群，现在我们需要增加数据副本数，增加 2 个副本（也就是增加 2 台服务器），扩展为由节点 A、B、C、D、E， 5 个节点组成的新集群。

进行成员变更时，节点 A、B 和 C 之间发生了分区错误，节点 A、B 组成旧配置中的"大多数"，也就是变更前的 3 节点集群中的"大多数"，那么这时的领导者（节点 A）依旧是领导者。另一方面，节点 C 和新节点 D、E 组成了新配置的"大多数"，也就是变更后的 5 节点集群中的"大多数"，它们可能会选举出新的领导者（比如节点 C）。那么这时，就出现了同时存在 2 个领导者的情况。

![change1.png](https://images.spumn.eu.cc/distributed-consensus/3e82910f613378f2.png)

如果出现了 2 个领导者，那么就违背了"领导者的唯一性"的原则，进而影响到集群的稳定运行。

### Joint consensus

最开始 Raft 使用 joint consensus 实现成员变更，其使用一种两阶段方法平滑切换集群成员配置来避免遇到前一节描述的问题。

为当前的配置，为目标配置。当 leader 收到成员变更的请求时，会创建一个的配置(joint consensus)，所有节点在接收到配置时就采用新的配置，不用等到 commit。 joint consensus 把新旧配置联系起来：

- log entries 复制到2个配置的所有节点上；
- 使用或 配置的节点都可能成为 leader；
- 处于状态时，必须同时收到的 majority 和的 majority 的同意才能提交或选出 leader。

**当被提交之后，创建配置，当 被提交后，整个成员变更结束**，不在中的节点可以关闭。joint consensus 确保了 C-old 和不会同时做决定，保证了 safety。

具体流程如下图所示：

![image.png](https://images.spumn.eu.cc/distributed-consensus/3adfe3936adb76d9.png)

**阶段一**

- 客户端将 发送给 leader，leader 将  与 取**并集**并立即apply，我们表示为 **C-old,new**(joint consensus)。
- Leader 将包装为日志同步给其它节点。
- Follower 收到 后立即 apply，当 的大多数节点和 的大多数节点都切换后（形式上称为的大多数节点），leader 将该日志 commit。

**阶段二**

- Leader 接着将 包装为日志同步给其它节点。
- Follower 收到 后立即 apply，如果此时发现自己不在列表，则主动退出集群。
- Leader 确认  的大多数节点都切换成功后，给客户端发送执行成功的响应。

联合共识让每个服务器能在不同时间切换配置而不需要做出安全性妥协。另外，联合共识让集群能够在配置变更时继续为客户端请求提供服务。

### single-server changes

该算法**每次只允许增加或移除一个节点**，只有当上一轮成员变更结束，才能开始下一轮，复杂的成员变更转换为多次单个成员变更。 增加或删除一个节点时，新旧配置中构成 majority 的部分必有重叠，不会有单独一部分做出决定，保证了 safety:

![change3.png](https://images.spumn.eu.cc/distributed-consensus/ce419c48b3e1070a.png)

比如将 3 节点集群扩容为 5 节点集群，这时你需要执行 2 次单节点变更，先将 3 节点集群变更为 4 节点集群，然后再将 4 节点集群变更为 5 节点集群，就像下图的样子。

![change2.png](https://images.spumn.eu.cc/distributed-consensus/c9ac934fbeb99430.png)

当发起成员变更时，leader 会增加一个特殊的 log entry，然后通过 log replication 复制到其他节点上。

此外因为节点只有接收到 config change entry 才会改变配置，所以需要处理不在当前配置内的节点的消息：

- 节点需要接收不在自己集群成员内的 leader 的 AppendEntries，否则新加入的节点将永远不会加入到集群中(不会接收任何 log)；
- 节点需要给不在自己集群成员内的节点投票，比如给3个节点的集群增加了第4个节点，当 leader 挂了需要新增加的节点也可以投票；
- 被移除的节点不会收到 heartbeat，可能会超时发起投票影响集群(因为上面第二点)，使用 check quorum 和 Pre-Vote 可以解决。

-  A server accepts AppendEntries requests from a leader that is not part of the server's latest configuration. Otherwise, a new server could never be added to the cluster (it would never accept any log entries preceding the configuration entry that adds the server). 
-  A server also grants its vote to a candidate that is not part of the server's latest configuration (if the candidate has a sufficiently up-to-date log and a current term). This vote may occasionally be needed to keep the cluster available. For example, consider adding a fourth server to a three-server cluster. If one server were to fail, the new server's vote would be needed to form a majority and elect a leader. 

需要注意的是，etcd/raft中的配置的应用时间与[《Consensus: Bridging Theory and Practice》](https://github.com/ongardie/dissertation)论文中的不同。

raft thesis 中是节点接收到成员变更的 entry 时，就使用新的配置，当该 entry 被 commit 后，意味着 majority 节点采用了新的配置，该次成员变更结束，可以开始下一轮：

When the leader receives a request to add or remove a server from its current configuration ( ), it appends the new configuration () as an entry in its log and replicates that entry using the normal Raft mechanism. The new configuration takes effect on each server as soon as it is added to that server's log: the  entry is replicated to the  servers, and a majority of the new configuration is used to determine the  entry's commitment. This means that servers do not wait for configuration entries to be committed, and each server always uses the latest configuration found in its log.
 
...
 
As with the single-server configuration change algorithm, each server starts using a new configuration as soon as it stores the configuration in its log.

采用这种方式，节点配置需要能够回退，因为未 commit 的 entry 有可能被覆盖。

Unfortunately, this decision does imply that a log entry for a configuration change can be removed (if leadership changes); in this case, a server must be prepared to fall back to the previous configuration in its log.

而在etcd/raft的实现中[[raft package - go.etcd.io/etcd/raft/v3 - Go Packages](https://pkg.go.dev/go.etcd.io/etcd/raft/v3#section-readme)]，它应用新的配置时间点是在应用层 apply 时，通知 Raft 模块进行 `ApplyConfChange` 操作来进行配置切换，而不是在将配置变更追加到 Raftlog 时立刻进行切换。

although our implementation of the membership change protocol differs somewhat from that described in chapter 4. The key invariant that membership changes happen one node at a time is preserved, but in our implementation the membership change takes effect when its entry is applied, not when it is added to the log (so the entry is committed under the old membership instead of the new). This is equivalent in terms of safety, since the old and new configurations are guaranteed to overlap.

etcd/raft在"apply-time"应用新配置的方式，可以保证配置在应用前已被提交，因此不需要论文中提到的回滚旧配置的操作。

使用 etcd/raft 的方式需要注意: 从2个节点中移除一个时，若有一个节点挂了，则整个集群不可用，但是一般至少使用3副本。

This approach introduces a problem when you try to remove a member from a two-member cluster: If one of the members dies before the other one receives the commit of the confchange entry, then the member cannot be removed any more since the cluster cannot make progress. For this reason it is highly recommended to use three or more nodes in every cluster.

另外，需要注意的是，同一时间只能有一个正在进行的配置变更操作，在提议配置变更请求时，如果已经在进行配置变更，那么该提议会被丢弃。

To ensure that we do not attempt to commit two membership changes at once by matching log positions (which would be unsafe since they should have different quorum requirements), we simply disallow any proposed membership change while any uncommitted change appears in the leader's log.

[etcd/raft](https://github.com/etcd-io/etcd/blob/release-3.5/raft/raft.go)中**对需要拒绝的提议的处理非常简单，只需要将该日志条目替换为没有任何意义的普通空日志条目**`pb.Entry{Type: pb.EntryNormal}`即可：
