# etcd/raft（四）：Raft日志

## 引言

本文会对etcd/raft中Raft日志复制算法的实现与优化进行分析。

## 日志复制算法优化

在日志复制方面，etcd/raft对基本Raft算法做了一些优化。

![Raft Log](https://images.spumn.eu.cc/distributed-consensus/e2b9edc1e7566c32.svg)

### 流控（Flow Control）

在etcd/raft中，Progress的Inflights字段是对日志复制操作进行流控的字段。虽然Config的MaxSizePerMsg字段限制了每条MsgApp消息的字节数，但是在StateReplicate状态下优化日志复制时，每次可能会发送多条MsgApp消息。

为了更加清晰地处理leader为follower复制日志的各种情况，etcd/raft将leader向follower复制日志的行为分成三种，记录在Progress的State字段中：

- StateProbe：当leader刚刚当选时，或当follower拒绝了leader复制的日志时。在该状态下，leader每次心跳期间仅为follower发送一条MsgApp消息。
- StateReplicate：该状态下的follower处于稳定状态，leader会优化为其复制日志的速度，每次可能发送多条MsgApp消息。
- StateSnapshot：当follower所需的日志已被压缩无法访问时，leader会将该follower的进度置为StateSnapshot状态，并向该follower发送快照。

Config中加入了MaxInflightMsgs字段来限制每次发送的MsgApp消息数。Inflights实现了MaxInflightMsgs字段配置的流控。

### 日志复制流程

![日志复制概览](https://images.spumn.eu.cc/distributed-consensus/08b3a84e689a321e.svg)

在etcd/raft中，日志复制的主要流程如下：

- leader通过stepLeader方法处理MsgProp消息，将提议追加到日志中；
- leader通过bcastAppend方法向所有follower广播日志复制请求；
- follower通过handleAppendEntries方法处理日志复制请求；
- leader通过处理MsgAppResp消息更新follower的进度。

### 日志提交

在etcd/raft中，leader通过maybeCommit方法判断是否可以提交日志。maybeCommit方法会通过ProgressTracker的Committed方法计算被大多数节点接受的commit index。

当commit index更新后，leader会通过bcastAppend方法通知所有follower新的commit index。

## etcd/raft中日志复制的实现

![日志路径](https://images.spumn.eu.cc/distributed-consensus/331c5797efeb32d5.svg)

### Progress

Progress结构体用于追踪每个follower的日志复制进度。其主要字段包括：

- Match：已知的follower已复制的最大日志索引。
- Next：下一个要发送给follower的日志索引。
- State：follower的状态（StateProbe、StateReplicate、StateSnapshot）。
- Paused：是否暂停向该follower发送日志。
- RecentActive：该follower最近是否活跃。

![MemoryStorage](https://images.spumn.eu.cc/distributed-consensus/67a216167e5d360e.svg)

### 日志追加

当leader收到MsgProp消息时，会通过stepLeader方法处理。stepLeader会将提议追加到日志中，并更新自己的Match和Next字段。然后，如果当前集群不是单节点模式，leader会通过bcastAppend方法向所有follower广播日志复制请求。

### 日志复制请求的处理

当follower收到MsgApp消息时，会通过handleAppendEntries方法处理。handleAppendEntries方法会检查日志的一致性，如果日志不一致，会拒绝该请求并返回当前的日志索引；如果日志一致，会追加日志并返回成功。

### 日志复制响应的处理

当leader收到MsgAppResp消息时，会根据响应更新follower的进度。如果follower拒绝了日志复制请求，leader会递减Next字段并重试；如果follower接受了日志复制请求，leader会更新Match和Next字段。

### 日志提交

当leader更新了follower的进度后，会通过maybeCommit方法判断是否可以提交日志。maybeCommit方法会通过ProgressTracker的Committed方法计算被大多数节点接受的commit index。

## 总结

本文介绍了etcd/raft中Raft日志复制算法的实现与优化。etcd/raft的日志复制实现相对直观，主要是对论文中描述的算法的直接实现，并加入了一些工程上的优化，如流控机制。

