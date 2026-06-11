---
title: Raft 协议（一）—— 领导者选举
description: "Raft 领导者选举"
date: 2022-09-16
---

> 摘录自[Q的博客](https://juejin.cn/user/1275089220539869/posts)

# Raft是什么？

> *Raft is a consensus algorithm for managing a replicated log. It produces a result equivalent to (multi-)Paxos, and it is as efficient as Paxos, but its structure is different from Paxos; this makes Raft more understandable than Paxos and also provides a better foundation for building practical systems.*
>
> --《In Search of an Understandable Consensus Algorithm》

在分布式系统中，为了消除单点提高系统可用性，通常会使用副本来进行容错，但这会带来另一个问题，即如何保证多个副本之间的一致性？

所谓的一致性并不是指集群中所有节点在任一时刻的状态必须完全一致，而是指一个目标，即让一个分布式系统看起来只有一个数据副本，并且读写操作都是原子的，这样应用层就可以忽略系统底层多个数据副本间的同步问题。也就是说，我们可以将一个强一致性（线性一致性）分布式系统当成一个整体，一旦某个客户端成功的执行了写操作，那么所有客户端都一定能读出刚刚写入的值。即使发生网络分区故障，或者少部分节点发生异常，整个集群依然能够像单机一样提供服务。

共识算法（Consensus Algorithm）就是用来做这个事情的，它保证即使在小部分（≤ (N-1)/2）节点故障的情况下，系统仍然能正常对外提供服务。共识算法通常基于状态复制机（Replicated State Machine）模型，也就是所有节点从同一个 state 出发，经过同样的操作 log，最终达到一致的 state。

![Replicated State Machine](https://images.spumn.eu.cc/blog/82c99b41ef758ab0.webp) 共识算法是构建强一致性分布式系统的基石，Paxos 是共识算法的代表，而 Raft 则是其作者在博士期间研究 Paxos 时提出的一个变种，主要优点是容易理解、易于实现，甚至关键的部分都在论文中给出了伪代码实现。

# Raft基本概念

## Raft一致性相关子问题

Raft 使用 Quorum 机制来实现共识和容错，我们将对 Raft 集群的操作称为提案，每当发起一个提案，必须得到大多数（> N/2）节点的同意才能提交。

Raft 核心算法将一致性问题拆分为三个子问题，逐个解决，大大提升了算法的易用性：

- **Leader election**：集群中必须存在一个 leader 节点。
- **Log replication**：Leader 节点负责接收客户端请求，并将请求操作序列化成日志同步。
- **Safety**：包括 leader 选举限制、日志提交限制等一系列措施，来确保 state machine safety。

除核心算法外还有集群成员变更、日志压缩等。

## 集群中节点角色概念

Raft 集群中每个节点都处于以下三种角色之一：

- **Leader**：所有请求的处理者，接收客户端发起的操作请求，写入本地日志后同步至集群其它节点。
- **Follower**：请求的被动更新者，从 leader 接收更新请求，写入本地文件。如果客户端的操作请求发送给了 follower，会首先由 follower 重定向给 leader。
- **Candidate**：如果 follower 在一定时间内没有收到 leader 的心跳，则判断 leader 可能已经故障，此时启动 leader election 过程，本节点切换为 candidate 直到选主结束。

## 选举相关概念

每开始一次新的选举，称为一个 term，每个 term 都有一个严格递增的整数与之关联。

节点的状态切换如图所示: ![节点状态图](https://images.spumn.eu.cc/blog/af02d7cfbf770fd4.webp)

具体说明如下：

- **Starts up**：节点刚启动时自动进入 follower 状态。
- **Times out, starts election**：进去 follower 状态后开启一个选举定时器，到期时切换为 candidate 并发起选举，leader 节点的心跳会部分重置这个定时器。
- **Times out, new election**：进入 candidate 状态后开启一个超时定时器，如果到期时还未选出新的 leader，就保持 candidate 状态并重新开始下一次选举。
- **Receives votes from majority of servers**：Candidate 状态节点收到半数以上选票，切换状态成为新的 leader。
- **Discovers current leader or new term**
  - Candidate 状态节点收到 leader 或更高 term 号（本文后续有介绍）的消息，表示已经有 leader 了，切回 follower。
- **Discovers server with higher term**：Leader 节点收到更高 term 号的消息，表示已经存在新 leader 了，切回 follower。这种切换一般发生在网络分区时，比如旧 leader 宕机后恢复。

## Term相关概念

每当 candidate 触发 leader election 时都会增加 term，如果一个 candidate 赢得选举，他将在本 term 中担任 leader 的角色，但并不是每个 term 都一定对应一个 leader，比如上述的 “times out, new election” 情况（对应下图中的t3），可能在选举超时时都没有产生一个新的 leader，此时将递增 term 号并开始一次新的选举。 ![Term 示意图](https://images.spumn.eu.cc/blog/63a0fa0882b3c1fd.webp)

Term 更像是一个逻辑时钟（logic clock）的作用，有了它，可以发现哪些节点的状态已经过期。每一个节点都保存一个 current term，在通信时带上这个term号。

节点间通过 RPC 来通信，主要有两类 RPC 请求:

**RequestVote RPCs:** 用于 candidate 拉票选举

**AppendEntries RPCs:** 用于 leader 向其它节点复制日志以及同步心跳

# 什么是选主

选主（Leader election）就是在分布式系统内抉择出一个主节点来负责一些特定的工作。在执行了选主过程后，集群中每个节点都会识别出一个特定的、唯一的节点作为leader。

我们开发的系统如果遇到选主的需求，通常会直接基于 zookeeper 或 etcd 来做，把这部分的复杂性收敛到第三方系统。然而作为 etcd 基础的 raft 自身也存在“选主”的概念，这是两个层面的事情：基于 etcd 的选主指的是利用第三方 etcd 让集群对谁做主节点的决策达成一致，技术上来说利用的是 etcd 的一致性状态机、lease 以及 watch 机制，这个事情也可以改用单节点的 MySQL/Redis 来做，只是无法获得高可用性；而 raft 本身的选主则指的是在 raft 集群自身内部通过票选、心跳等机制来协调出一个大多数节点认可的主节点作为集群的 leader 去协调所有决策。

**当你的系统利用 etcd 来写入谁是主节点的时候，这个决策也在 etcd 内部被它自己集群选出的主节点处理并同步给其它节点。**

# Raft 为什么要进行选主？

按照论文所述，原生的 Paxos 算法使用了一种点对点（peer-to-peer）的方式，所有节点地位是平等的。在理想情况下，算法的目的是制定**一个决策**，这对于简化的模型比较有意义。但在工业界很少会有系统会使用这种方式，当有一系列的决策需要被制定的时候，先选出一个 leader 节点然后让它去协调所有的决策，这样算法会更加简单快速。

此外，和其它一致性算法相比，raft 赋予了 leader 节点更强的领导力，称之为 **Strong Leader**。比如说日志条目只能从 leader 节点发送给其它节点而不能反着来，这种方式简化了日志复制的逻辑，使 raft 变得更加简单易懂。

# Raft选主过程

下图的节点状态转移图，我们在前一篇文章已经看到了，但只是做了简单的描述，接下来我们会结合具体的Leader election细节来深刻理解节点的状态转换。 ![节点状态图](https://images.spumn.eu.cc/blog/8f7fd07b4d4d8aeb.png)

## Follower状态转移过程

Raft 的选主基于一种心跳机制，集群中每个节点刚启动时都是 follower 身份（**Step: starts up**），leader 会周期性的向所有节点发送心跳包来维持自己的权威，那么首个 leader 是如何被选举出来的呢？方法是如果一个 follower 在一段时间内没有收到任何心跳，也就是选举超时，那么它就会主观认为系统中没有可用的 leader，并发起新的选举（**Step: times out, starts election**）。

这里有一个问题，即这个“选举超时时间”该如何制定？如果所有节点在同一时刻启动，经过同样的超时时间后同时发起选举，整个集群会变得低效不堪，极端情况下甚至会一直选不出一个主节点。Raft 巧妙的使用了一个随机化的定时器，让每个节点的“超时时间”在一定范围内随机生成，这样就大大的降低了多个节点同时发起选举的可能性。

![一个五节点Raft集群的初始状态，所有节点都是follower身份，term为1，且每个节点的选举超时定时器不同](https://images.spumn.eu.cc/blog/f8683d84d517b821.png) 

若 follower 想发起一次选举，follower 需要先增加自己的当前 term，并将身份切换为 candidate。然后它会向集群其它节点发送“请给自己投票”的消息（RequestVote RPC）。

![S1 率先超时，变为 candidate，term + 1，并向其它节点发出拉票请求](https://images.spumn.eu.cc/blog/a1791956327e1c8c.png) 

## Candicate状态转移过程

Follower 切换为 candidate 并向集群其他节点发送“请给自己投票”的消息后，接下来会有三种可能的结果，也即上面**节点状态图中 candidate 状态向外伸出的三条线**。

**1. 选举成功（Step: receives votes from majority of servers）**

当candicate从整个集群的**大多数**（N/2+1）节点获得了针对同一 term 的选票时，它就赢得了这次选举，立刻将自己的身份转变为 leader 并开始向其它节点发送心跳来维持自己的权威。

![“大部分”节点都给了S1选票](https://images.spumn.eu.cc/blog/3c169b791a49659b.png) 

![S1变为leader，开始发送心跳维持权威](https://images.spumn.eu.cc/blog/683d4d6a6b482d01.png) 

每个节点针对每个 term 只能投出一张票，并且按照先到先得的原则。这个规则确保只有一个 candidate 会成为 leader。

**2. 选举失败（Step: discovers current leader or new term）**

Candidate 在等待投票回复的时候，可能会突然收到其它自称是 leader 的节点发送的心跳包，如果这个心跳包里携带的 term **不小于** candidate 当前的 term，那么 candidate 会承认这个 leader，并将身份切回 follower。这说明其它节点已经成功赢得了选举，我们只需立刻跟随即可。但如果心跳包中的 term 比自己小，candidate 会拒绝这次请求并保持选举状态。

![S4、S2 依次开始选举](https://images.spumn.eu.cc/blog/7e0ff4e3f44cbcb9.png) 

![S4 成为 leader，S2 在收到 S4 的心跳包后，由于 term 不小于自己当前的 term，因此会立刻切为 follower 跟随S4](https://images.spumn.eu.cc/blog/ffbc45ee99e1d514.png) 

**3. 选举超时（Step: times out, new election）**

第三种可能的结果是 candidate 既没有赢也没有输。如果有多个 follower 同时成为 candidate，选票是可能被瓜分的，如果没有任何一个 candidate 能得到大多数节点的支持，那么每一个 candidate 都会超时。此时 candidate 需要增加自己的 term，然后发起新一轮选举。如果这里不做一些特殊处理，选票可能会一直被瓜分，导致选不出 leader 来。这里的“特殊处理”指的就是前文所述的**随机化选举超时时间**。

![S1~S5都在参与选举](https://images.spumn.eu.cc/blog/39f7ccd043a79e46.png) 

![没有任何节点愿意给他人投票](https://images.spumn.eu.cc/blog/5be9bd39782f53d7.png)

![如果没有随机化超时时间，所有节点将会继续同时发起选举……](https://images.spumn.eu.cc/blog/cc797519c844b35d.png) 

以上便是 candidate 三种可能的选举结果。

## Leader 切换状态转移过程

节点状态图中的最后一条线是：**discovers server with higher term**。想象一个场景：当 leader 节点发生了宕机或网络断连，此时其它 follower 会收不到 leader 心跳，首个触发超时的节点会变为 candidate 并开始拉票（由于随机化各个 follower 超时时间不同），由于该 candidate 的 term 大于原 leader 的 term，因此所有 follower 都会投票给它，这名 candidate 会变为新的 leader。一段时间后原 leader 恢复了，收到了来自新leader 的心跳包，发现心跳中的 term 大于自己的 term，此时该节点会立刻切换为 follower 并跟随的新 leader。

上述流程的动画模拟如下：

![S4 作为 term2 的 leader](https://images.spumn.eu.cc/blog/fab1ce319e232e7b.png) 

![S4 宕机，S5 即将率先超时](https://images.spumn.eu.cc/blog/f2fd94195cef6880.png) 

![S5 当选 term3 的 leader](https://images.spumn.eu.cc/blog/158556e68bcfe590.png) 

![S4 宕机恢复后收到了来自 S5 的 term3 心跳](https://images.spumn.eu.cc/blog/8b0978d9f9c464dd.png)

![S4 立刻变为 S5 的 follower](https://images.spumn.eu.cc/blog/0f34745afbabddfa.png) 

以上就是 raft 的选主逻辑，但还有一些细节（譬如是否给该 candidate 投票还有一些其它条件）依赖算法的其它部分基础，我们会在后续“安全性”一篇描述。
