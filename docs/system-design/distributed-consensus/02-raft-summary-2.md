# Raft算法总结（二）

# etcd/raft工程性设计

接下来我们看一看在《Consensus: Bridging Theory and Practice》大论文中，提到了很多《In Search of an Understandable Consensus Algorithm》中没有涉及的，但是在实际工程落地中非常重要的细节。

## Leadership Transfer

etcd/raft还实现了Leader Transfer，即主动地进行leader的交接。在集群成员变更中，有可能需要移除的节点是leader，可以通过leadership transfer将leadership转移到其他节点，然后再移除原先的leader。

Leadership Transfer的流程：
- Leader锁写入，停止接受新的Propose请求；
- Leader等待Follower的日志同步追上自己；
- Leader向Follower发送TimeoutNow消息，使Follower立即递增term发起选举。

## Check Quorum

Check Quorum是针对当Leader被网络分区的时，其他实例已经选举出了新的Leader，旧Leader不能收到新Leader的消息，这时它自己不能发现自己已不是Leader。

Check Quorum机制可以帮助Leader主动发现这种情况：每当Election Timeout时检查一次，发现自己不能与多数节点保持正常通信时，及时退为Follower。

## Pre-Vote algorithm

当Raft集群的网络发生分区时，在节点数无法达到quorum的分区中，节点的term会不断增大。如果网络分区恢复，达不到quorum的分区中的节点的term值会远大于能够达到quorum的分区中的节点的term，导致不必要的选举。

Pre-Vote机制引入了"预投票"：当节点election timeout超时后，它们不会立即增大自身的term并请求投票，而是先发起一轮预投票。收到预投票请求的节点不会退位。只有当节点收到了达到quorum的预投票响应时，节点才能增大自身term号并发起投票请求。

## Leader Lease

Leader Lease机制对投票引入了一条新的约束：当节点在election timeout超时前，如果收到了leader的消息，那么它不会为其它发起投票或预投票请求的节点投票。Leader Lease需要依赖Check Quorum机制才能正常工作。

## Learner

加入新的节点有可能降低集群的可用性，因为新的节点需要花费很长时间来同步log。为了避免这个问题，可以引入learner状态。learner节点有如下特性：
- 当election timeout时，不会成为candidate发起选举；
- 不参与投票和commit；
- 该状态的节点不计在majority。

当learner追上集群的进度时，提升为正常的节点，完成config change。

## 只读请求算法优化

### 写主读从缺陷分析

Client将请求发送到Leader后，Leader将请求作为一个Proposal通过Raft复制。但实际多个节点不能保证同时将某一个Log应用到状态机上，加之Leader会在不同节点之间切换，所以Leader的状态机也不总有最新的状态。直接向follower发起读操作可能读到过时的数据。

### 写主读主缺陷分析

所有读操作也必须经由leader节点处理，但读写都经过leader依然还不能满足线性一致。原因：状态机落后于committed log导致脏读；网络分区导致脏读。

### Log Read

将读请求同样作为一个提案走一遍Raft流程，当这次读请求对应的日志可以被应用到状态机时，leader就可以读状态机并返回给用户。但该方案的缺点是性能差。

### Read Index

与Raft Log Read相比，Read Index省掉了同步log的开销，能够大幅提升读的吞吐。其大致流程为：
- Leader在收到客户端读请求时，记录下当前的commit index，称之为read index；
- Leader向followers发起一次心跳包，确保领导权；
- 等待leader本地的状态机至少应用到read index；
- 执行读请求，将状态机中的结果返回给客户端。

### Lease Read

Lease Read在损失了一定的安全性的前提下，进一步地优化了延迟。基本思路是省去Read Index中的心跳广播，leader设置一个比选举超时更短的时间作为租期，在租期内直接读主即可。

### Follower Read

通过ReadIndex机制，还能实现follower read：当follower收到只读请求后，可以给leader发送一条获取read index的消息，leader确认自己是合法的leader后，将其记录的read index返回给follower，follower等到自己的apply index大于等于其收到的read index后，即可以安全地提供满足线性一致性的只读服务。

# etcd/raft概述

etcd/raft将Raft算法的实现分为了3个模块：Raft状态机、存储模块、传输模块。

raft状态机完全由etcd/raft负责，raft结构体即为其实现。使用etcd/raft的开发者不能直接操作raft结构体，只能通过etcd/raft提供的raft.Node接口对其进行操作。

etcd/raft的存储模块可以划分为两部分：对存储的读取与写入。etcd/raft只需要读取存储，而对存储的写入由用户负责。

通信模块是完全由使用etcd/raft的开发者负责的。

## Node接口

Node接口为开发者提供了操作etcd/raft的方法。Node结构中的方法按调用时机可以分为三类：Tick（由时钟驱动）、Ready/Advance（成对出现，处理Ready结构体）、其它方法（需要时随时调用）。

对于Ready结构体，有几个重要的字段需要按照如下顺序处理：
- 将HardState、Entries、Snapshot写入稳定存储；
- 将Messages中的消息发送给相应的节点；将Snapshot和CommittedEntries应用到本地状态机中；
- 调用Advance方法。

## Raft状态机

在etcd/raft的实现中，raft结构体是一个Raft状态机，其通过Step方法进行状态转移。只要涉及到Raft状态机的状态转移，最终都会通过Step方法完成。

# Raft与Multi-Paxos对比

Multi-Paxos协议和Raft协议本质上都是一种序列共识协议。Raft和Paxos最大的不同在于Raft的强领导权：Raft的领导选举是共识协议必要的部分，且Raft尽可能多地将功能集中到了leader中。

Raft算法属于Multi-Paxos算法，它是在兰伯特Multi-Paxos思想的基础上，做了一些简化和限制，比如增加了日志必须是连续的，只支持领导者、跟随者和候选人三种状态，在理解和算法实现上都相对容易许多。

