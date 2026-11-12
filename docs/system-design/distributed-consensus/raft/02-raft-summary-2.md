# etcd/raft工程性设计

接下来我们看一看在《Consensus: Bridging Theory and Practice》大论文中，提到了很多《In Search of an Understandable Consensus Algorithm (Extended Version)》中没有涉及的，但是在实际工程落地中非常重要的细节。

## Leadership Transfer

etcd/raft还实现了**Leader Transfer**，即主动地进行leader的交接。

在集群成员变更中，有可能需要移除的节点是 leader，按照 raft thesis 的做法会比较奇怪，leader 需要管理不包含自己的集群，直到提交之后再 step down，可以通过 leadership transfer 将 leadership 转移到其他节点， 然后再移除原先的 leader。

leadership transfer 还有其他的用途，比如 leader 所在机器的负载比较高，要转移到低负载机器上；leader 要改变机房实现就近等，同时还能降低选举的影响。

其实现方式比较简单，只需要让希望成为新leader节点主动发起投票请求即可。

Leadership Transfer 的流程上大致上是：

- Leader 锁写入，停止接受新的 Propse 请求；
- Leader 等待 Follower 的日志同步追上自己；
- Leader 向 Follower 发送 `TimeoutNow` 消息，使 Follower 立即递增 term 发起选举，因为它是第一个发起选举的节点，因此大概率能够赢得选举；

仍有几个问题需要处理：

-  transferee 挂了: 当 leadership transfer 在 election timeout 时间内未完成，则终止并恢复接收客户端请求。 
-  **Leader Transfer**不保证交接一定成功，只有目标节点能够得到数量达到quorum的选票时才能当选leader。transferee 有大概率成为下一个 leader，若失败，可以重新发起 leader transfer。 
-  **Leader Transfer**类型的投票不受**Pre-Vote**、**Check Quorum**、**Leader Lease**机制约束。 

## Check Quorum

Check Quorum 是针对这种情况：当 Leader 被网络分区的时，其他实例已经选举出了新的 Leader，旧 Leader 不能收到新 Leader 的消息，这时它自己不能发现自己已不是 Leader。

**Check Quorum**期初是为了更高效地实现线性一致性读（Linearizable Read）而做出的优化。Check Quorum 机制可以帮助 Leader 主动发现这种情况：**每当 Election Timeout 时检查一次，发现自己不能与多数节点保持正常通信时**，及时退为 Follower。

**不实现 Check Quorum 逻辑对 Raft 的正确性并没有影响**，发生网络分区使 Leader 不能联系到多数选举人，同时其他选举人选举出新的 Leader，存在两个 Leader 的现象并不会影响 Raft 的正确性，老的 Leader 并不能联系到多数选举人，因而也不能 Commit 任何脏数据进来。但是在工程上有一定意义，在于可以使客户端更及时地发现自己连接的 Leader 已失效，从而去寻找得到新的 Leader。

## Pre-Vote algorithm

如下图所示，当Raft集群的网络发生分区时，会出现节点数达不到quorum（达成共识至少需要的节点数）的分区，如图中的*Partition 1*。

![图片](https://images.spumn.eu.cc/distributed-consensus/98f6313b9894a7ed.svg)

在节点数能够达到quorum的分区中，选举流程会正常进行，该分区中的所有节点的term最终会稳定为新选举出的leader节点的term。不幸的是，**在节点数无法达到quorum的分区中，如果该分区中没有leader节点，因为节点总是无法收到数量达到quorum的投票而不会选举出新的leader**，所以该分区中的节点在*election timeout*超时后，会增大term并发起下一轮选举，这导致该分区中的节点的term会不断增大。

如果网络一直没有恢复，这是没有问题的。但是，如果网络分区恢复，此时，**达不到quorum的分区中的节点的term值会远大于能够达到quorum的分区中的节点的term，这会导致能够达到quorum的分区的leader退位**（step down）并增大自己的`term`到更大的`term`，使集群产生一轮不必要的选举。

简单概括这个问题就是：怎样保护 Leader 不被高 term 的坏节点干扰。

**Pre-Vote**机制就是为了解决这一问题而设计的，其解决的思路在于不允许达不到quorum的分区正常进入投票流程，也就避免了其term号的增大。为此，**Pre-Vote**引入了"预投票"，也就是说，当节点*election timeout*超时后，它们不会立即增大自身的term并请求投票，而是先发起一轮预投票。**收到预投票请求的节点不会退位**。只有当节点收到了达到quorum的预投票响应时，节点才能增大自身term号并发起投票请求。这样，达不到quorum的分区中的节点永远无法增大term，也就不会在分区恢复后引起不必要的一轮投票。

etcd/raft中 PreVote 的实现是增加一个 `PreCandidate` 角色，使节点在递增 term 之前，先广播 `MsgRequestPreVote`，确认收到多数确认之后，再转为 Candidate 角色，真正递增 term 发起 `MsgRequestVote` 广播。

里面有个细节是 **PreCandidate 虽然不会递增 term，但是发送的 RequestPreVote 请求中携带是递增过的 term 值**，收到该请求的 Peer，会根据递增过的 term 值进行是否投票的逻辑判断。

## Leader Lease

Pre-Vote 可以防止 Leader 被日志旧的高 term 实例所中断。然而，高 term 的坏节点万一日志长度与多数节点相同，发过去的 RequestPreVote/RequestVote 请求仍能正常响应，仍有可能产生 disruptive 现象。

在大论文里提到有这样的 case：

- 集群移除了一个节点；
- 移除这个节点之后，这个节点不再接收 Leader 发来的日志，收不到日志中的移除自己的日志条目，仍以为自己处于集群中；
- 在 Leader 的日志同步到多数节点之前，该节点发起选举并得到多数节点的投票，导致 Leader 被顶走了；

![leaderL.png](https://images.spumn.eu.cc/distributed-consensus/a7d43365abd9dac8.png)

**Leader Lease**机制对投票引入了一条新的约束以解决这一问题：当节点在*election timeout*超时前，如果**收到了leader的消息，那么它不会为其它发起投票或预投票请求的节点投票**。也就是说，**Leader Lease**机制会阻止了正常工作的集群中的节点给其它节点投票。

Thus, servers should not be able to disrupt a leader whose cluster is receiving heartbeats. We modify the RequestVote RPC to achieve this: if a server receives a RequestVote request within the minimum election timeout of hearing from a current leader, it does not update its term or grant its vote. It can either drop the request, reply with a vote denial, or delay the request; the result is essentially the same. This does not affect normal elections, where each server waits at least a minimum election timeout before starting an election. However, it helps avoid disruptions from servers not in  : while a leader is able to get heartbeats to its cluster, it will not be deposed by larger term numbers.

需要注意的是**Leader Lease**需要依赖**Check Quorum**机制才能正常工作，例如下面例子：

假如在一个5个节点组成的Raft集群中，出现了下图中的分区情况：*Node 1*与*Node 2*互通，*Node 2*、*Node 3*、*Node 4*之间两两互通、*Node 5*与任一节点不通。在网络分区前，*Node 1*是集群的leader。

![图片](https://images.spumn.eu.cc/distributed-consensus/6400d650851fa5ab.svg)

在既没有**Leader Lease**也没有**Check Quorum**的情况下，*Node 3*、*Node 4*会因收不到leader的心跳而发起投票，因为*Node 2*、*Node 3*、*Node 4*互通，该分区节点数能达到quorum，因此它们可以选举出新的leader。

而在使用了**Leader Lease**而不使用**Check Quorum**的情况下，由于*Node 2*仍能够收到原leader *Node 1*的心跳，受**Leader Lease**机制的约束，它不会为其它节点投票。这会导致即使整个集群中存在可用节点数达到quorum的分区，但是集群仍无法正常工作。

而如果同时使用了**Leader Lease**和**Check Quorum**，那么在上图的情况下，*Node 1*会在*election timeout*超时后因检测不到数量达到quorum的活跃节点而退位为follower。这样，*Node 2*、*Node 3*、*Node 4*之间的选举可以正常进行。

此外需要注意，「server should not be able to disrupt a leader whose cluster is receiving heartbeats」这条约束与 Leadership Transfer 的 `TimeoutNow` 请求有冲突：

在 Leadership Transfer 场景下，要的就是让一个 Follower 立即发起选举并使其他正常接收旧 Leader 心跳的节点投票的效果，要是其他 Follower 都觉得自己正常接收着来自 Leader 的心跳而拒绝了这条高 term 的 RequestVote 请求，这就玩不成了。

对此需要一个额外的信息来区分一下 RequestVote 请求是常规的超时投票，还是显式的 Leadership Transfer。

## Learner

加入新的节点有可能降低集群的可用性，因为新的节点需要花费很长时间来同步 log，可能导致集群无法 commit 新的请求。

比如原来有 3 个节点的集群，可以容忍 1 个节点出错，然后新加入了一个节点， 若原先的一个节点出错会导致集群不能 commit 新的请求，直到节点恢复或新节点追上;

或者如下图（b）所示，在原本三个节点的集群中，一次添加了-:

![learner.png](https://images.spumn.eu.cc/distributed-consensus/f893c8f7dc98a85a.png)

为了避免这个问题，可以引入 learner 状态，新加入的节点设置为 learner 状态。learner 节点有如下特性：

- 当election timeout时，不会成为candidate发起选举；
- 不参与投票和 commit；
- 该状态的节点不计在 majority。

当 learner 追上集群的进度时，提升为正常的节点，完成 config change。

In order to avoid availability gaps, Raft introduces an additional phase before the configuration change, in which a new server joins the cluster as a non-voting member. The leader replicates log entries to it, but it is not yet counted towards majorities for voting or commitment purposes. Once the new server has caught up with the rest of the cluster, the reconfiguration can proceed as described above.

这个时候就会有个问题：由于加入集群后，Leader同时也在不断更新日志，所以需要Leader去判断什么时候learner算作"追上集群的进度"。

The leader needs to determine when a new server is sufficiently caught up to continue with the configuration change.

大论文里也给出了一个方案：Learner按轮次迭代，每一轮只复制到到这一轮开始的日志结束，直到某一个轮次所需时间小于*election timeout*结束，如图所示：

![learner2.png](https://images.spumn.eu.cc/distributed-consensus/8b5bc4a9f2a92f5e.png)

We suggest the following algorithm to determine when a new server is sufficiently caught up to add to the cluster. The replication of entries to the new server is split into rounds, as shown in Figure 4.5. Each round replicates all the log entries present in the leader's log at the start of the round to the new server's log. While it is replicating entries for its current round, new entries may arrive at the leader; it will replicate these during the next round. As progress is made, the round durations shrink in time. The algorithm waits a fixed number of rounds (such as 10). If the last round lasts less than an election timeout, then the leader adds the new server to the cluster, under the assumption that there are not enough unreplicated entries to create a significant availability gap.Otherwise, the leader aborts the configuration change with an error.

## 只读请求算法优化

Raft算法的目标之一是实现**线性一致性（Linearizability）** 的语义。需要注意的，**一个分布式系统正确实现了共识算法并不意味着能线性一致。共识算法只能保证多个节点对某个对象的状态是一致的**，以 Raft 为例，它只能保证不同节点对 Raft Log能达成一致，但是在通过Raft算法实现系统时，仍会存在有关消息服务质量（Quality of Service，QoS；如至多一次、至少一次、恰好一次等语义问题）、系统整体线性一致性语义等问题。

因此《CONSENSUS: BRIDGING THEORY AND PRACTICE》的*Chapter 6 Client interaction*，专门介绍了实现系统时客户端与系统交互的相关问题。

假设我们期望基于 Raft 实现一个线性一致的分布式 kv 系统，以etcd为例，让我们从最朴素的方案开始，指出每种方案存在的问题，最终使整个系统满足线性一致性。

### 写主读从缺陷分析

Client 将请求发送到 Leader 后，Leader 将请求作为一个 Proposal 通过 Raft 复制到自身以及 Follower 的 Log 中，然后将其 commit。Raft Applier将 commit 的 Log 应用(apply)到 storage上，由于 Input（即 Log）都一样，可推出各个 etcd 的状态机（即 storage）的状态能达成一致。

但实际多个 etcd 不能保证同时将某一个 Log 应用到 storage 上，也就是说各个节点不能**实时**一致，加之 Leader 会在不同节点之间切换，所以 Leader 的状态机也不总有最新的状态。

在该方案中我们假设读操作直接简单地向 follower 发起，那么由于 Raft 的 Quorum 机制（大部分节点成功即可），针对某个提案在某一时间段内，集群可能会有以下两种状态：

- 某次写操作的日志尚未被复制到一少部分 follower，但 leader 已经将其 commit。
- 某次写操作的日志已经被同步到所有 follower，但 leader 将其 commit 后，心跳包尚未通知到一部分 follower。

以上每个场景客户端都可能读到过时的数据，整个系统显然是不满足线性一致的。

### 写主读主缺陷分析

在该方案中我们限定，所有的读操作也必须经由 leader 节点处理，读写都经过 leader 依然还不能满足线性一致。

**问题一：状态机落后于 committed log 导致脏读**

因为一个提案只要被 leader commit 就可以响应客户端了，Raft 并没有限定提案结果在返回给客户端前必须先应用到状态机。所以从客户端视角当我们的某个写操作执行成功后，下一次读操作可能还是会读到旧值。

**问题二：网络分区导致脏读**

假设集群发生网络分区，旧 leader 位于少数派分区中，而且此刻旧 leader 刚好还未发现自己已经失去了领导权，当多数派分区选出了新的 leader 并开始进行后续写操作时，连接到旧 leader 的客户端可能就会读到旧值了。

因此，仅仅是直接读 leader 状态机的话，系统仍然不满足线性一致性。

那么，接下来阐述一下如何通过Raft算法实现线性一致性读语义。

### Log Read

为了**确保 leader 处理读操作时仍拥有领导权**，我们可以将读请求同样作为一个提案走一遍 Raft 流程，当这次读请求对应的日志可以被应用到状态机时，leader 就可以读状态机并返回给用户了。

但该方案的缺点也非常明显，那就是**性能差**，读操作的开销与写操作几乎完全一致。而且由于所有操作都线性化了，我们无法并发读状态机。

为了解决这一问题，《CONSENSUS: BRIDGING THEORY AND PRACTICE》给出了两个方案：**Read Index**和**Lease Read**。

### Read Index

与 Raft Log Read 相比，Read Index 省掉了同步 log 的开销，能够**大幅提升**读的**吞吐**，**一定程度上降低**读的**时延**。其大致流程为：

- **Leader 在收到客户端读请求时，记录下当前的 commit index，称之为 read index**，如果是follower收到的如请求，需要给Leader发送`ReadIndex`请求。
- Leader 向 followers 发起一次心跳包，这一步是为了**确保领导权**，避免网络分区时少数派 leader 仍处理请求。
- 等待leader本地的状态机**至少**应用到 read index（即 apply index **大于等于** read index）。
- 执行读请求，将状态机中的结果返回给客户端。

这里第三步的 apply index **大于等于** read index 是一个关键点。因为在该读请求发起时，我们将当时的 commit index 记录了下来，只要使客户端读到的内容在该 commit index 之后，那么结果**一定都满足线性一致**。

为什么在 Read Index 之后就满足了线性一致性呢？之前 LogRead 的读发生点是 commit index，这个点能使 LogRead 满足线性一致，那显然发生这个点之后的 Read Index 也能满足。

需要注意的是，实现**ReadIndex**时需要注意一个特殊情况。当新leader刚刚当选时，其*commit index*可能并不是此时集群的*commit index*。因此，需要**等到新leader至少提交了一条日志时**，才能保证其*commit index*能反映集群此时的*commit index*。幸运的是，新leader当选时为了提交非本term的日志，会提交一条空日志。因此，leader只需要等待该日志提交就能开始提供**ReadIndex**服务，而无需再提交额外的空日志。

### Lease Read

**ReadIndex**虽然提升了只读请求的吞吐量，但是由于其还需要一轮心跳广播，因此只读请求延迟的优化并不明显。而**Lease Read**在损失了一定的安全性的前提下，进一步地优化了延迟。

基本思路是我们可以省去Read Index中的第二步，leader 设置一个比选举超时（Election Timeout）更短的时间作为租期，在租期内我们可以相信其它节点一定没有发起选举，集群也就一定不会存在脑裂，所以在这个时间段内我们直接读主即可，而非该时间段内可以继续走 Read Index 流程，Read Index 的心跳包也可以为租期带来更新。

Lease Read 可以认为是 Read Index 的时间戳版本，额外依赖时间戳会为算法带来一些不确定性，**如果时钟发生漂移会引发一系列问题**，因此需要谨慎的进行配置。

需要注意的是，与**Leader Lease**相同，**Lease Read**机制同样需要在选举时开启**Check Quorum**机制，其原因与**Leader Lease**相同。

提示
 
**Leader Lease**是保证follower在能收到合法的leader的消息时拒绝其它candidate，以避免不必要的选举的机制。
 
**Lease Read**时leader为确认自己是合法leader，以保证只通过leader为只读请求提供服务时，满足线性一致性的机制。

### Wait Free

到此为止 Lease 省去了 ReadIndex 的第二步，实际能再进一步，省去第 3 步。这样的 Lease Read 在收到请求后会立刻进行读请求，不取 *commit index*也不等状态机。由于 Raft 的强 Leader 特性，在租期内的 Client 收到的 Resp 由 Leader 的状态机产生，所以只要状态机满足线性一致，那么在 Lease 内，不管何时发生读都能满足线性一致性。

同样需要注意，**只有在 Leader 的状态机应用了当前 term 的第一个 Log 后才能进行 LeaseRead**。因为新选举产生的 Leader，它虽然有全部 committed Log，但它的状态机可能落后于之前的 Leader，状态机应用到当前 term 的 Log 就保证了新 Leader 的状态机一定新于旧 Leader，之后肯定不会出现 stale read。

### Follower Read

只读请求优化中，无论我们怎么折腾，核心思想其实只有两点：

- **保证在读取时的最新 commit index 已经被 apply**。
- **保证在读取时 leader 仍拥有领导权**。

这两个保证分别对应写主读主缺陷分析中所描述的两个问题。

其实无论是 Read Index 还是 Lease Read，最终目的都是为了解决第二个问题。换句话说，**读请求最终一定都是由 leader 来承载的。**

通过**ReadIndex**机制，还能实现*follower read* ：

-  当follower收到只读请求后，可以给leader发送一条获取*read index*的消息；
-  当leader通过心跳广播确认自己是合法的leader后，将其记录的*read index*返回给follower；
-  follower等到自己的*apply index*大于等于其收到的*read index*后，即可以安全地提供满足线性一致性的只读服务。

## etcd/raft概述

etcd/raft将Raft算法的实现分为了3个模块：Raft状态机、存储模块、传输模块。

raft状态机完全由etcd/raft负责，`raft`结构体即为其实现。**使用etcd/raft的开发者不能直接操作raft结构体，只能通过etcd/raft提供的**`raft.Node`**接口对其进行操作。**

etcd/raft的存储模块可以划分为两部分：对存储的读取与写入。etcd/raft只需要读取存储，etcd/raft依赖的`Storage`接口中只有读取存储的方法。而**对存储的写入由用户负责**，etcd/raft并不关心开发者如何写入存储，对存储的写入方法可以由开发者自己定义。

说明
 
etcd使用的存储模块是在与`Storage`接口同一文件下的`MemoryStorage`结构体。`MemoryStorage`既实现了`Storage`接口需要的读取存储的方法，也为用户提供了写入存储的方法。
 
`Storage`接口定义的是**稳定存储**的读取方法。之所以etcd使用了基于内存的`MemoryStorage`，是因为etcd在写入`MemoryStorage`前，需要先写入预写日志（Write Ahead Log，WAL）或快照。而预写日志和快照是保存在稳定存储中的。
 
这样，在每次重启时，etcd可以基于保存在稳定存储中的快照和预写日志恢复`MemoryStorage`的状态。也就是说，etcd的稳定存储是通过快照、预写日志、`MemoryStorage`三者共同实现的。

通信模块是完全由使用etcd/raft的开发者负责的。etcd/raft不关心开发者如何实现通信模块。

下图是一张关于etcd/raft的实现中，开发者与etcd/raft对这3个模块的职责的示意图。

![图片](https://images.spumn.eu.cc/distributed-consensus/120f1fa9464b8f4b.svg)

因为`Node`**接口是开发者仅有的操作etcd/raft的方式**，所以我们先来看看`Node`接口与其相关实现。

### Node接口

`Node`接口为开发者提供了操作etcd/raft的方法。其接口定义在`etcd/raft/node.go`中：

`Node`结构中的方法按调用时机可以分为三类：

方法
描述

`Tick`
由时钟（循环定时器）驱动，每隔一定时间调用一次，驱动`raft`
结构体的内部时钟运行。

`Ready`
、`Advance`
这两个方法往往成对出现。准确的说，是`Ready`
方法返回的`Ready`
结构体信道的信号与`Advance`
方法成对出现。每当从`Ready`
结构体信道中收到来自`raft`
的消息时，用户需要按照一定顺序对`Ready`
结构体中的字段进行处理。在完成对`Ready`
的处理后，需要调用`Advance`
方法，通知`raft`
这批数据已经处理完成，可以继续传入下一批。

其它方法
需要时随时调用。

`Ready`结构体同样定义在`etcd/raft/node.go`中：

对于`Ready`结构体，有几个重要的字段需要按照如下顺序处理：

-  将`HardState`、`Entries`、`Snapshot`写入稳定存储（其中，`Snapshot`**的写入不需要严格按照此顺序**，etcd/raft为快照的传输提供了另一套机制以优化执行效率）。
-  本条中的操作可以并行执行：

-  将`Messages`中的消息发送给相应的节点。
-  将`Snapshot`和`CommittedEntries`应用到本地状态机中。

- 调用`Advance`方法。

提示
 
在etcd/raft中，`Node`接口的实现一共有两个，分别是[node](https://github.com/etcd-io/etcd/blob/raft/v3.5.7/raft/node.go)结构体和[rawnode](https://pkg.go.dev/go.etcd.io/etcd/raft/v3#Node)结构体。二者都是对etcd/raft中Raft状态机`raft`结构体进行操作。不同的是，`node`结构体是线程安全的，其内部封装了`rawnode`，并通过各种信道实现线程安全的操作；而`rawnode`是非线程安全的，其直接将`Node`接口中的方法转为对`raft`结构体的方法的调用。

### Raft状态机

在etcd/raft的实现中，`raft`结构体是一个Raft状态机，其**通过**`Step`**方法进行状态转移**。只要涉及到Raft状态机的状态转移，最终都会通过`Step`方法完成。`Step`方法的参数是Raft消息（在`etcd/raft/raftpb`中，是直接通过`.proto`文件生成的[**Protocol Buffers**](https://developers.google.com/protocol-buffers)的go语言实现）,该方法在`etcd/raft/raft.go`中：

`raft`结构体中的字段和相应的方法有很多，该结构体定义在`etcd/raft/raft.go`文件中:

这里仅给出创建`node`或`rawnode`时所需的`Config`结构体的结构，该结构体定义了开启`raft`状态机所需的参数，其大部分字段都与`raft`结构体中的有关字段相对应，同样也在`etcd/raft/raft.go`文件中:

### raft模块使用
etcd官方提供了一个基于*etcd/raft*的简单kvstore的实现，该实现在*etcd/contrib/raftexample*下

[raftexample](https://github.com/etcd-io/etcd/tree/main/contrib/raftexample)使用了raft模块的一些基本功能，实现了简单的分布式kv存储。该项目的根目录下还提供了该分布式kv存储示例的使用方法和基本设计思路。单来说，raftexample的设计可以用一张图来表示：

![图片](https://images.spumn.eu.cc/distributed-consensus/3cf837aabc570c4b.svg)

我们来看一下其中raft服务器是如何使用。raft服务器的实现在`etcd/contrib/raftexample/raft.go`中，其对etcd/raft提供的接口进行了一层封装，以便于`kvstore`使用：

在结构体中，还保存了etcd/raft提供的接口与其所需的相关组件：

字段
描述

`node raft.Node`
etcd/raft的核心接口，对于一个最简单的实现来说，**开发者只需要与该接口打交道即可实现基于raft的服务**。

`raftStorage *raft.MemoryStorage`
用来保存raft状态的接口，etcd/raft/storage.go中定义了etcd/raft模块所需的稳定存储接口，并提供了一个实现了该接口的内存存储`MemoryStorage`
注1，raftexample中就使用了该实现。

`wal *wal.WAL`
预写日志实现，raftexample直接使用了etcd/wal模块中的实现。

`snapshotter *snap.Snapshotter`
快照管理器的指针

`snapshotterReady chan *snap.Snapshotter`
一个用来发送snapshotter加载完毕的信号的"一次性"信道。因为snapshotter的创建对于新建raftNode来说是一个异步的过程，因此需要通过该信道来通知创建者snapshotter已经加载完成。

`snapCount uint64`
**当wal中的日志超过该值时，触发快照操作并压缩日志。**

`transport *rafthttp.Transport`
etcd/raft模块通信时使用的接口。同样，这里使用了基于http的默认实现。
接下来粗略地看一下在raftexapmle中如何使用etcd/raft的`raft.Node`接口的。

#### raftNode创建与启动

在创建raftNode时，需要提供节点`id`、对等节点url`peers`、是否是要加入已存在的集群`join`、获取快照的函数签名`getSnapshot`、提议信道`proposeC`、配置变更提议信道`confChangeC`这些参数。

在`Start`函数中，仅初始化了`raftNode`的部分参数。

这里有个字段`MaxInflightMsgs`需要说明一下：

在etcd/raft中，`Progress`的`Inflights`字段是对日志复制操作进行流控的字段。虽然`Config`的`MaxSizePerMsg`字段限制了每条`MsgApp`消息的字节数，但是在`StateReplicate`状态下优化日志复制时，每次可能会发送多条`MsgApp`消息。

为了更加清晰地处理leader为follower复制日志的各种情况，etcd/raft将leader向follower复制日志的行为分成三种，记录在`Progress`的`State`字段中：
 
- `StateProbe`：当leader刚刚当选时，或当follower拒绝了leader复制的日志时，该follower的进度状态会变为`StateProbe`类型。在该状态下，leader每次心跳期间仅为follower发送一条`MsgApp`消息，且leader会根据follower发送的相应的`MsgAppResp`消息调整该follower的进度。
- `StateReplicate`**：该状态下的follower处于稳定状态，leader会优化为其复制日志的速度，每次可能发送多条**`MsgApp`**消息**（受`Progress`的流控限制，后文会详细介绍）。
- `StateSnapshot`：当follower所需的日志已被压缩无法访问时，leader会将该follower的进度置为`StateSnapshot`状态，并向该follower发送快照。**leader不会为处于**`StateSnapshot`**状态的follower发送任何的**`MsgApp`**消息，直到其成功收到快照**。

因此，`Config`中又加入了`MaxInflightMsgs`**字段来限制每次发送的**`MsgApp`**消息数**。`Inflights`实现了`MaxInflightMsgs`字段配置的流控。

`Inflights`结构体在`etcd/raft/tracker/inflights.go`中，实现了一个动态扩容的FIFO队列，其中记录了每条`MsgApp`的`Index`字段的值，以在收到`MsgAppResp`的ack时释放队列。

在`node`创建完成后，程序配置并开启了通信模块，开始与集群中的其它raft节点通信。

随后，该函数启动了一个协程`s.serveChannels()`，用来处理`raftNode`中各种信道。

#### 信道的处理

`raftNode.serveChannels()`是raft服务器用来处理各种信道的输入输出的方法，也是**与etcd/raft模块中**`**Node**`**接口的实现交互的方法。**

`serverChannels()`方法可以分为两个部分，该方法本身会循环处理raft有关的逻辑，如处理定时器信号驱动`Node`、处理`Node`传入的`Ready`结构体、处理通信模块报告的错误或停止信号灯等；该方法还启动了一个goroutine，该goroutine中循环处理来自`proposeC`和`confChangeC`两个信道的消息。

在这两部分开始前，该方法先做了一些初始化。

首先，该方法从当前的快照的元数据设置`raftNode`的相关字段，并设置一个每100毫秒产生一个信号的循环定时器。`serveChannels`的循环会**根据这个信号调用**`**Node**`**接口的**`**Tick()**`**方法，驱动**`**Node**`**执行**。

接下来，我们先来看`serveChannels`中启动的用来处理来自`proposeC`和`confChangeC`两个信道的消息的goroutine。

这部分逻辑很简单。因为在循环中，如果`proposeC`或`confChangeC`中的一个被关闭，程序会将其置为`nil`，所以只有二者均不是`nil`时才执行循环。每次循环会通过select选取一个有消息传入的信道，通过`Node`接口提交给raft服务器。当循环结束后，关闭`stopc`信道，即发送关闭信号。这种方式在*4.2-go语言中将struct{}信道用作信号的tips*中介绍过。

`serveChannels`中的循环是与`Node`接口交互的重要逻辑。

该循环同时监听4个信道：

- 循环定时器的信道，每次收到信号后，调用`Node`接口的`Tick`函数驱动`Node`。
- `Node.Ready()`返回的信道，**每当**`**Node**`**准备好一批数据后，会将数据通过该信道发布**。开发者需要对该信道收到的`Ready`结构体中的各字段进行处理。在**处理完成一批数据后，开发者还需要调用**`**Node.Advance()**`**告知**`**Node**`**这批数据已处理完成**，可以继续传入下一批数据。
- 通信模块报错信道，收到来自该信道的错误后`raftNode`会继续上报该错误，并关闭节点。
- 用来表示停止信号的信道，当该信道被关闭时，阻塞的逻辑会从该分支运行，关闭节点。

其中，`Node.Ready()`返回的信道逻辑最为复杂。因为其需要处理raft状态机传入的各种数据，并交付给相应的模块处理。etcd/raft的`Ready`结构体中包含如下数据：

说明
本专栏所有的源代码部分均基于写下该专栏时候的etcd release-3.5版本，不同版本的代码可能有些出入。

## Raft与Multi-Decree Paxos对比

Multi-Paxos协议和Raft 协议本质上都是一种序列共识协议。

Multi-Paxos 协议也是Paxos协议族中的一种， 与基本Paxos协议不同的是， Basic Paxos是一种面向单值的共识协议， 而Multi-Paxos协议是面向序列的共识协议。Lamport在他的论文中只是提出了实现Multi-Paxos的思路，并未给出细节，因此Multi-Paxos协议本身并没有确切的标准。当后人尝试沿着Lamport的思路设计Multi-Paxos协议时，每个人设计出来的版本都各不相同，但都声称自己是Multi-Paxos协议。由于分布式算法本身就很难被正确地设计，这些自行设计的算法又未经过严格的证明，所以人们都说Multi-Paxos难以实现。

Raft协议把序列共识问题看成复制状态机问题，通过解决复制状态机问题来解决序列共识问题。实际上，序列共识问题和复制状态机问题是同一个问题，解决了其中一个，就解决了另一个。相比于Multi-Paxos协议，Raft协议的描述非常清晰，甚至在关键部分提供了伪代码级别的详细描述，所以比Multi-Paxos协议 更易于理解，也更易于实现。

在《In Search of an Understandable Consensus Algorithm (Extended Version)》原文中有阐述，Raft和Paxos最大的不同在于Raft的强领导权：Raft的领导选举是共识协议必要的部分，且Raft尽可能多地将功能集中到了leader中。这使算法更简单，且更容易理解。

The greatest difference between Raft and Paxos is Raft's strong leadership: Raft uses leader election as an essential part of the consensus protocol, and it concentrates as much functionality as possible in the leader. This approach results in a simpler algorithm that is easier to understand.

例如：

-  Multi-Paxos协议认为序列共识就是"共识的序列"，因此通过主进程推动一系列基本 Paxos 实例的方式实现了序列共识；而 Raft 协议认为序列共识就是"面向序列的共识"，所以通过对齐过程使每个进程的决策序列趋同；
-  Raft 协议会选择序列代次最大且决策序列最长的进程作为主进程，而Multi-Paxos协议则没有要求；
 在Paxos中，领导选举与基本的共识协议是独立的：它仅作为性能优化，而实现共识并不需要它。然而，这导致需要额外的机制：Paxos基本共识包括两段协议和用来领导选举的独立的机制。相反，Raft直接将领导选举合并到了算法中，并用它作为两段共识的第一段。Raft协议会将选主、开启新代次和对齐过程进行合并，减少不必要的消息次数。这使Raft的机制比Paxos更少；

![图片](https://images.spumn.eu.cc/distributed-consensus/952a055b342bf7ba.png)
 

in Paxos, leader election is orthogonal to the basic consensus protocol: it serves only as a performance optimization and is not required for achieving consensus.
 
In contrast, Raft incorporates leader election directly into the consensus algorithm and uses it as the first of the two phases of consensus. This results in less mechanism than in Paxos.

- 等等。

但无论是Multi-Paxos协议， 还是Raft协议，它们都是基于主进程驱动的序列共识协议，只是在一些表达方式和实现细节上有区别。它们的本质是一样的，例如：

 Multi-Paxos和raft都有一些相似的概念；

![图片](https://images.spumn.eu.cc/distributed-consensus/417ded798dde3faf.png)
 -  它们都需要通过选主抽象来获得一个稳定的主进程；
-  主进程都会发起一个对齐过程，使所有正确的进程获得相同的决策序列；
-  仅当某个建议值被严格过半进程接受后，才能作为决策值被商定；
-  等等。

因此，可以说Raft 算法属于 Multi-Paxos 算法，它是在兰伯特 Multi-Paxos 思想的基础上，做了一些简化和限制，**比如增加了日志必须是连续的，只支持领导者、跟随者和候选人三种状态**，在理解和算法实现上都相对容易许多。

## 参考资料

-  [GitHub - etcd-io/etcd: Distributed reliable key-value store for the most critical data of a distributed system](https://github.com/etcd-io/etcd)
-  [In Search of an Understandable Consensus Algorithm (Extended Version)](https://pages.cs.wisc.edu/~remzi/Classes/739/Spring2004/Papers/raft.pdf)
-  [Consensus: Bridging Theory and Practice](https://github.com/ongardie/dissertation)
-  [The Raft Consensus Algorithm](https://raft.github.io/)
-  [GitHub - boltdb/bolt: An embedded key/value database for Go.](https://github.com/boltdb/bolt)
-  [GitHub - dgraph-io/badger: Fast key-value DB in Go.](https://github.com/dgraph-io/badger)
-  [深入浅出etcd/raft](http://blog.mrcroxx.com/posts/code-reading/etcdraft-made-simple/0-introduction/)
-  [raftexample - Go Packages](https://pkg.go.dev/go.etcd.io/etcd/contrib/raftexample#section-readme)
-  《分布式高可用算法（电子工业出版社，江峰著）》
