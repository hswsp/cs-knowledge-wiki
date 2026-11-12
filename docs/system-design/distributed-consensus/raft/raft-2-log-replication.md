---
title: Raft 协议（二）—— 日志复制与日志压缩
description: "Raft日志复制，日志压缩与安全性问题"
date: 2022-09-16
---

> 摘录自[Q的博客](https://juejin.cn/post/6899464146719342605)

**一句话先总结文章讲啥**：基于日志的 raft 状态复制机原理，其也是分布式系统对外展现成统一视图，以及实现分布式一致性的基础。

------

# 什么是日志复制

在前文中我们讲过：共识算法通常基于**状态复制机（Replicated State Machine）模型，所有节点从同一个 state 出发**，经过一系列**同样操作 log** 的步骤，最终也必将达到**一致的 state**。也就是说，只要我们保证集群中所有节点的 log 一致，那么经过一系列追加操作（apply）后最终得到的状态机也就是一致的。

Raft 负责保证集群中所有节点 **log 的一致性**。

此外我们还提到过：raft 赋予了 leader 节点更强的领导力（**Strong Leader**）。那么 raft 保证 log 一致的方式就很容易理解了，即所有操作（log）都必须交给 leader 节点处理（follewer 接收写操作会转交给 leader 处理），并由 leader 节点复制给其它节点，来保证整个集群的 log 实现层面的一致。

这个过程，就叫做**日志复制（Log replication）**，对应的系统模型就是“**日志状态复制机**”。

## Raft 日志复制机制解析

### 整体流程解析

一旦 leader 被票选出来，它就承担起领导整个集群的责任了，开始接收客户端请求，并将操作包装成日志，并复制到其它节点上去。

整体流程如下：

- Leader 为客户端提供服务，客户端的每个请求都包含一条即将被状态复制机执行的指令。
- Leader 把该指令作为一条新的日志附加到自身的日志集合，然后向其它节点发起**附加条目请求（AppendEntries RPC）**，来要求它们将这条日志附加到各自本地的日志集合。
- 当这条日志已经确保被**安全的复制**，即大多数（N/2+1）节点都已经复制后，leader 会将该日志 **apply** 到它本地的状态机中，然后把操作成功的结果返回给客户端。

整个集群的日志模型可以宏观表示为下图（x ← 3 代表x赋值为3 ）： 

![Raft 集群日志模型](https://images.spumn.eu.cc/blog/f4c659eb830eb3e5.png) 

每条日志除了存储状态机的操作指令外（譬如 x ← 3 这种赋值指令，代表 x 赋值为3），还会拥有一个**唯一的整数索引值**（**log index**）来表明它在日志集合中的位置。此外，每条日志还会存储一个 **term** 号（日志条目方块最上方的数字，相同颜色 term 号相同），该 term 表示 leader 收到这条指令时的当前任期，term 相同的 log 是由同一个 leader 在其任期内发送的。

当一条日志被 leader 节点认为可以安全的 apply 到状态机时，称这条日志是 **committed**（上图中的 **committed entries**）。那么什么样的日志可以被 commit 呢？答案是：**当 leader 得知这条日志被集群过半的节点复制成功时**。因此在上图中我们可以看到 (term3, index7) 这条日志以及之前的日志都是 committed，尽管有两个节点拥有的日志并不完整。

Raft 保证所有 committed 日志都已经被**持久化**，且“**最终**”一定会被状态机apply。

> *注：这里的“最终”用词很微妙，它表明了一个特点：Raft保证的只是日志的一致性，而我们真正期望的状态机的一致性需要我们做一些额外工作，这一点在后续《线性一致性与性能优化》一篇会着重介绍。*

### Raft 日志复制流程图解

我们通过 [raft 动画](https://raft.github.io/)来模拟常规日志复制这一过程。

![img](https://images.spumn.eu.cc/blog/2486a6faee82a0d0.png) **图 1*

如图1，S1 当选 leader，此时还没有任何日志。我们模拟客户端向 S1 发起一个请求。

![图2](https://images.spumn.eu.cc/blog/8a3349ae3663aa9b.png) 

如图2，S1 收到客户端请求后新增了一条日志 (term2, index1)，然后并行地向其它节点发起 AppendEntries RPC。

![图 3](https://images.spumn.eu.cc/blog/4bc75e588263307d.png) 

如图3，S2、S4 率先收到了请求，各自附加了该日志，并向 S1 回应响应。

![图 4](https://images.spumn.eu.cc/blog/2b785c942e50b200.png) 

如图4，所有节点都附加了该日志，但由于 leader 尚未收到任何响应，因此暂时还不清楚该日志到底是否被成功复制。

![图 5](https://images.spumn.eu.cc/blog/fa04e568132bcd1a.png) 

如图5，当 S1 收到**2个节点**的响应时，该日志条目的边框就已经变为实线，表示该日志已经**安全的复制**，因为在5节点集群中，2个 follower 节点加上 leader 节点自身，副本数已经确保过半，此时 **S1 将响应客户端的请求**。

![图 6](https://images.spumn.eu.cc/blog/f912815aa2f7004b.png) 

如图6，leader 后续会持续发送心跳包给 followers，心跳包中会携带当前**已经安全复制（我们称之为 committed）的日志索引**，此处为 (term2, index1)。

![图 7](https://images.spumn.eu.cc/blog/2958027e70954f45.png) 

如图7，所有 follower 都通过心跳包得知 (term2, index1) 的 log 已经成功复制 （committed），因此所有节点中该日志条目的边框均变为实线。

### Raft 对日志一致性的保证

前边我们使用了 (term2, index1) 这种方式来表示一条日志条目，这里为什么要带上 term，而不仅仅是使用 index？原因是 term 可以用来检查不同节点间日志是否存在不一致的情况，阅读下一节后会更容易理解这句话。

Raft 保证：**如果不同的节点日志集合中的两个日志条目拥有相同的 term 和 index，那么它们一定存储了相同的指令。**

为什么可以作出这种保证？因为 raft 要求 leader 在一个 term 内针对同一个 index 只能创建一条日志，并且永远不会修改它。

同时 raft 也保证：**如果不同的节点日志集合中的两个日志条目拥有相同的 term 和 index，那么它们之前的所有日志条目也全部相同。**

这是因为 leader 发出的 AppendEntries RPC 中会额外携带**上一条**日志的 (term, index)，如果 follower 在本地找不到相同的 (term, index) 日志，则**拒绝接收这次新的日志**。

所以，只要 follower 持续正常地接收来自 leader 的日志，那么就可以通过归纳法验证上述结论。

### 可能出现的日志不一致场景

在所有节点正常工作的时候，leader 和 follower的日志总是保持一致，AppendEntries RPC 也永远不会失败。然而我们总要面对任意节点随时可能宕机的风险，如何在这种情况下继续保持集群日志的一致性才是我们真正要解决的问题。

![日志不一致场景图](https://images.spumn.eu.cc/blog/2eb41f9035686146.png) 

上图展示了一个 term8 的 leader 刚上任时，集群中日志可能存在的混乱情况。例如 follower 可能缺少一些日志（a ~ b），可能多了一些未提交的日志（c ~ d），也可能既缺少日志又多了一些未提交日志（e ~ f）。

*注：Follower 不可能比 leader 多出一些已提交（committed）日志，这一点是通过选举上的限制来达成的，会在下一篇 Safety 部分介绍。*

我们先来尝试复现上述 a ~ f 场景，最后再讲 raft 如何解决这种不一致问题。

**场景a~b. Follower 日志落后于 leader**

这种场景其实很简单，即 **follower 宕机了一段时间**，follower-a 从收到 (term6, index9) 后开始宕机，follower-b 从收到 (term4, index4) 后开始宕机。这里不再赘述。

**场景c. Follower 日志比 leader 多 term6**

当 term6 的 leader 正在将 (term6, index11) 向 follower 同步时，该 leader 发生了宕机，且此时只有 follower-c 收到了这条日志的 AppendEntries RPC。然后经过一系列的选举，term7 可能是选举超时，也可能是 leader 刚上任就宕机了，最终 term8 的 leader 上任了，成就了我们看到的场景 c。

**场景d. Follower 日志比 leader 多 term7**

当 term6 的 leader 将 (term6, index10) 成功 commit 后，发生了宕机。此时 term7 的 leader 走马上任，连续同步了两条日志给 follower，然而还没来得及 commit 就宕机了，随后集群选出了 term8 的 leader。

**场景e. Follower 日志比 leader 少 term5 ~ 6，多 term4**

当 term4 的 leader 将 (term4, index7) 同步给 follower，且将 (term4, index5) 及之前的日志成功 commit 后，发生了宕机，紧接着 follower-e 也发生了宕机。这样在 term5~7 内发生的日志同步全都被 follower-e 错过了。当 follower-e 恢复后，term8 的 leader 也刚好上任了。

**场景f. Follower 日志比 leader 少 term4 ~ 6，多 term2 ~ 3**

当 term2 的 leader 同步了一些日志（index4 ~ 6）给 follower 后，尚未来得及 commit 时发生了宕机，但它很快恢复过来了，又被选为了 term3 的 leader，它继续同步了一些日志（index7~11）给 follower，但同样未来得及 commit 就又发生了宕机，紧接着 follower-f 也发生了宕机，当 follower-f 醒来时，集群已经前进到 term8 了。

### 如何处理日志不一致

通过上述场景我们可以看到，真实世界的集群情况很复杂，那么 raft 是如何应对这么多不一致场景的呢？其实方式很简单暴力，想想 **Strong Leader** 这个词。

**Raft 强制要求 follower 必须复制 leader 的日志集合来解决不一致问题。**

也就是说，follower 节点上任何与 leader 不一致的日志，都会被 leader 节点上的日志所覆盖。这并不会产生什么问题，因为某些选举上的限制，如果 follower 上的日志与 leader 不一致，那么该日志在 follower 上**一定是未提交的**。未提交的日志并不会应用到状态机，也不会被外部的客户端感知到。

要使得 follower 的日志集合跟自己保持完全一致，leader 必须先找到二者间**最后一次**达成一致的地方。因为一旦这条日志达成一致，在这之前的日志一定也都一致（回忆下前文）。这个确认操作是在 AppendEntries RPC 的一致性检查步骤完成的。

Leader 针对每个 follower 都维护一个 **next index**，表示下一条需要发送给该follower 的日志索引。当一个 leader 刚刚上任时，它初始化所有 next index 值为自己最后一条日志的 index+1。但凡某个 follower 的日志跟 leader 不一致，那么下次 AppendEntries RPC 的一致性检查就会失败。在被 follower 拒绝这次 Append Entries RPC 后，leader 会减少 next index 的值并进行重试。

最终一定会存在一个 next index 使得 leader 和 follower 在这之前的日志都保持一致。极端情况下 next index 为1，表示 follower 没有任何日志与 leader 一致，leader 必须从第一条日志开始同步。

针对每个 follower，一旦确定了 next index 的值，leader 便开始从该 index 同步日志，follower 会删除掉现存的不一致的日志，保留 leader 最新同步过来的。

整个集群的日志会在这个简单的机制下自动趋于一致。此外要注意，**leader 从来不会覆盖或者删除自己的日志**，而是强制 follower 与它保持一致。

这就要求集群票选出的 leader 一定要具备“日志的正确性（原文是 Safety，但用“正确性”可以帮大家更好理解）”，这也就是前文提到的：选举上的限制。




前面的章节我们讲述了 Raft 算法是如何选主和复制日志的，然而到目前为止我们描述的**这套机制还不能保证每个节点的状态机会严格按照相同的顺序 apply 日志**。想象以下场景：

1. Leader 将一些日志复制到了大多数节点上，进行 commit 后发生了宕机。
2. 某个 follower 并没有被复制到这些日志，但它参与选举并当选了下一任 leader。
3. 新的 leader 又同步并 commit 了一些日志，这些日志覆盖掉了其它节点上的上一任 committed 日志。
4. 各个节点的状态机可能 apply 了不同的日志序列，出现了不一致的情况。

因此我们需要对“选主+日志复制”这套机制加上一些额外的限制，来保证**状态机的安全性**，也就是是 Raft 算法的正确性。

## 安全性

通常来说，共识算法需要满足三项基本性质[1]，分别为**一致性（agreement）**、**正确性（integrity）**、**最终确定性（termination）**。一致性，要求所有的正确节点都获得相同的状态。正确性，决策的结果需要来自于正确节点的提案。最终确定性，要求决策在有限的时间内产生。这三项基本性质也可以概括为两项，即**活性（liveness）**与**安全性（safety）**。对于活性与安全性，有一种比较直观的描述方式：某个事件最终会发生，且这个最终会发生的事件合理[2]。活性指的就是最终确定性，意味着该系统最终总能获取某个状态。安全性指的是一致性与正确性，意味着处理的提案来自于正确节点，且正确节点最终状态总能一致。

接下来介绍 Raft 对选主和日志复制的算法限制，以保证其安全性（论文原文是 “Safety”，其实此处翻译为 **“正确性”** 更合适一些，国内“安全性”一般对应 “Security”，但出于对论文作者的敬意，本文继续使用“安全性”）。

### 对选举的限制

我们再来分析下前文所述的 committed 日志被覆盖的场景，根本问题其实发生在第2步。Candidate 必须有足够的资格才能当选集群 leader，否则它就会给集群带来不可预料的错误。Candidate 是否具备这个资格可以在选举时添加一个小小的条件来判断，即：

**每个 candidate 必须在 RequestVote RPC 中携带自己本地日志的最新 (term, index)，如果 follower 发现这个 candidate 的日志还没有自己的新，则拒绝投票给该 candidate。**

Candidate 想要赢得选举成为 leader，必须得到集群大多数节点的投票，那么**它的日志就一定至少不落后于大多数节点**。又因为一条日志只有复制到了大多数节点才能被 commit，因此**能赢得选举的 candidate 一定拥有所有 committed 日志**。

因此前一篇文章我们才会断定地说：Follower 不可能比 leader 多出一些 committed 日志。

比较两个 (term, index) 的逻辑非常简单：如果 term 不同 term 更大的日志更新，否则 index 大的日志更新。

### 对提交的限制

除了对选举增加一点限制外，我们还需对 commit 行为增加一点限制，来完成我们 Raft 算法核心部分的最后一块拼图。

回忆下什么是 commit：

> 当 leader 得知某条日志被集群过半的节点复制成功时，就可以进行 commit，committed 日志一定最终会被状态机 apply。

所谓 commit 其实就是对日志简单进行一个标记，表明其可以被 apply 到状态机，并针对相应的客户端请求进行响应。

然而 leader 并不能在任何时候都随意 commit 旧任期留下的日志，即使它已经被复制到了大多数节点。Raft 论文给出了一个经典场景：

![图8](https://images.spumn.eu.cc/blog/28cf8ed3eeb68098.png) 

图8从左到右按时间顺序模拟了问题场景。

**阶段a**：S1 是 leader，收到请求后将 (term2, index2) 只复制给了 S2，尚未复制给 S3 ~ S5。

**阶段b**：S1 宕机，S5 当选 term3 的 leader（S3、S4、S5 三票），收到请求后保存了 (term3, index2)，尚未复制给任何节点。

**阶段c**：S5 宕机，S1 恢复，S1 重新当选 term4 的 leader，继续将 (term2, index2) 复制给了 S3，已经满足大多数节点，我们将其 commit。

**阶段d**：S1 又宕机，S5 恢复，S5 重新当选 leader（S2、S3、S4 三票），将 (term3, inde2) 复制给了所有节点并 commit。注意，此时发生了致命错误，已经 committed 的 (term2, index2) 被 (term3, index2) 覆盖了。

为了避免这种错误，我们需要添加一个额外的限制：

**Leader 只允许 commit 包含当前 term 的日志。**

针对上述场景，问题发生在阶段c，即使作为 term4 leader 的 S1 将 (term2, index2) 复制给了大多数节点，它也不能直接将其 commit，而是必须等待 term4 的日志到来并成功复制后，一并进行 commit。

**阶段e**：在添加了这个限制后，要么 (term2, index2) 始终没有被 commit，这样 S5 在阶段d将其覆盖就是安全的；要么 (term2, index2) 同 (term4, index3) 一起被 commit，这样 S5 根本就无法当选 leader，因为大多数节点的日志都比它新，也就不存在前边的问题了。

以上便是对算法增加的两个小限制，它们对确保状态机的安全性起到了至关重要的作用。

至此我们对 Raft 算法的核心部分，已经介绍完毕，如果您坚持阅读到本文，相信已经能很好掌握 Raft 协议的核心算法机制。

## 日志压缩（Log compaction）

接下来介绍Raft 实践必备技术之一——日志压缩，**重点讲解状态机日志膨胀的应对方案**。

尽管我们已经通过了解了 Raft 算法的核心部分，但相较于算法理论来说，在工程实践中仍有一些现实问题需要我们去面对。Raft 非常贴心的在论文中给出了两个常见问题的解决方案，它们分别是：

1. **集群成员变更**：如何安全地改变集群的节点成员。
2. **日志压缩**：如何解决日志集合无限制增长带来的问题。

首先我们将讲解日志压缩技术。

------

我们知道 Raft 核心算法维护了日志的一致性，通过 apply 日志我们也就得到了一致的状态机，客户端的操作命令会被包装成日志交给 Raft 处理。

然而在实际系统中，客户端操作是连绵不断的，但日志却不能无限增长：

- 首先它会占用很高的存储空间；

- 其次每次系统重启时都需要完整回放一遍所有日志才能得到最新的状态机。

因此 Raft 提供了一种机制去清除日志里积累的陈旧信息，叫做**日志压缩**。

**快照**（**Snapshot**）是一种常用的、简单的日志压缩方式，ZooKeeper、Chubby 等系统都在用。简单来说，就是将某一时刻系统的状态 dump 下来并落地存储，这样该时刻之前的所有日志就都可以丢弃了。所以大家对“压缩”一词不要产生错误理解，我们并没有办法将状态机快照“解压缩”回日志序列。

注意，**在 Raft 中我们只能为 committed 日志做 snapshot**，因为只有 committed 日志才是确保最终会应用到状态机的。

![图5](https://images.spumn.eu.cc/blog/93f11e20dccc32b6.png) 图5 展示了一个节点用快照替换了 (term1, index1) ~ (term3, index5) 的日志。

快照一般包含以下内容：

1. **日志的元数据**：最后一条被该快照 apply 的日志 term 及 index
2. **状态机**：前边全部日志 apply 后最终得到的状态机

当 leader 需要给某个 follower 同步一些旧日志，但这些日志已经被 leader 做了快照并删除掉了时，leader 就需要把该快照发送给 follower。

同样，当集群中有新节点加入，或者某个节点宕机太久落后了太多日志时，leader 也可以直接发送快照，大量节约日志传输和回放时间。

当增加了 `snapshot` 之后，发送 `log` 的过程如下:

1. `leader` 的 `next` 记录了需要发送给 `follower` 的下一个 `entry`;
2. 若 `next` 仍在 `log` 中，则发送后续的 `entries`；
3. 若 `next` 在 `snapshot` 中，则发送 `snapshot`，发送成功后，再发送后续的 `entries`；
4. `follower` 收到 `snapshot` 时，如果 `log` 与 `snapshot` 有冲突或者 `snapshot` 比 `log` 新，则丢弃全部 `log`，应用 `snapshot`。

每个节点独立的选择何时做 `snapshot`，而不是由 `leader` 统一发起 `snapshot`：

- `snapshot` 只清理 `committed log`，每个节点有能力独立的做 `snapshot`，不会带来一致性问题；
- 如果由 `leader` 做 `snapshot` 然后发送给其他节点，会浪费网络带宽；
- 每个节点的配置和状态可能不同，可以独立选择合适的时机做 `snapshot`。

同步快照使用一个新的 RPC 方法，叫做 **InstallSnapshot RPC**。

## Reference

1. Coulouris G F, Dollimore J, Kindberg T. Distributed systems: concepts and design[M]. pearson education, 2005.
2. Owicki S, Lamport L. Proving liveness properties of concurrent programs[J]. ACM Transactions on Programming Languages and Systems (TOPLAS), 1982, 4(3): 455-495.
