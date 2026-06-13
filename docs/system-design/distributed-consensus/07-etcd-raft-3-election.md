# etcd/raft（三）：Raft选举

# 引言

本文会对etcd/raft中Raft选举算法的实现与优化进行分析。

# Raft选举算法优化

在leader选举方面，etcd/raft对基本Raft算法做了三种优化：Pre-Vote、Check Quorum、和Leader Lease。

## Pre-Vote

![网络分区示意图](https://pub-d5563ccdabef16dad3d61d1a290c6067.r2.dev/distributed-consensus/98f6313b9894a7ed.svg)

当Raft集群的网络发生分区时，在节点数无法达到quorum的分区中，节点的term会不断增大。如果网络分区恢复，达不到quorum的分区中的节点的term值会远大于能够达到quorum的分区中的节点的term，导致不必要的选举。

Pre-Vote机制引入了"预投票"：当节点election timeout超时后，它们不会立即增大自身的term并请求投票，而是先发起一轮预投票。收到预投票请求的节点不会退位。只有当节点收到了达到quorum的预投票响应时，节点才能增大自身term号并发起投票请求。

## Check Quorum

![stale read 示意图](https://pub-d5563ccdabef16dad3d61d1a290c6067.r2.dev/distributed-consensus/cc2ff99cf5c9b5f8.svg)

在Raft算法中，保证线性一致性读取的最简单的方式，就是将读请求同样当做一条Raft提议，通过与其它日志相同的方式执行，因此这种方式也叫作Log Read。显然，Log Read的性能很差。

但是，直接绕过日志机制从leader读取，可能会读到陈旧的数据，也就是说存在stale read的问题。Check Quorum可以减轻这一问题带来的影响：让leader每隔一段时间主动地检查follower是否活跃。如果活跃的follower数量达不到quorum，那么说明该leader可能是分区前的旧leader，所以此时该leader会主动退位转为follower。

## Leader Lease

![不完全分区示意图](https://pub-d5563ccdabef16dad3d61d1a290c6067.r2.dev/distributed-consensus/337458f04e5dc3ce.svg)

![Leader Lease without Check Quorum](https://pub-d5563ccdabef16dad3d61d1a290c6067.r2.dev/distributed-consensus/6400d650851fa5ab.svg)

分布式系统中的网络环境十分复杂，有时可能出现网络不完全分区的情况。Leader Lease机制对投票引入了一条新的约束：当节点在election timeout超时前，如果收到了leader的消息，那么它不会为其它发起投票或预投票请求的节点投票。

Leader Lease需要依赖Check Quorum机制才能正常工作。

## 引入的新问题与解决方案

![Check Quorum / Leader Lease 问题场景](https://pub-d5563ccdabef16dad3d61d1a290c6067.r2.dev/distributed-consensus/b4742e7d975f2d6f.svg)

![Pre-Vote 问题场景](https://pub-d5563ccdabef16dad3d61d1a290c6067.r2.dev/distributed-consensus/a0d0f9965343e055.svg)

引入Pre-Vote和Check Quorum会为Raft算法引入一些新的问题。当一个节点收到了term比自己低的消息时，原本的逻辑是直接忽略该消息。然而，开启了这些机制后，在如下的场景中会出现问题：

为了解决以上问题，节点在收到term比自己低的请求时，需要做特殊的处理：如果收到了term比当前节点term低的leader的消息，且集群开启了Check Quorum / Leader Lease或Pre-Vote，那么发送一条term为当前term的消息，令term低的节点成为follower。

# etcd/raft中Raft选举的实现

## MsgHup与hup

在etcd/raft的实现中，选举的触发是通过MsgHup消息实现的，无论是主动触发选举还是因election timeout超时都是如此。

Step方法在处理MsgHup消息时，会根据当前配置中是否开启了Pre-Vote机制，以不同的CampaignType调用hup方法。CampaignType有三种：campaignPreElection（Pre-Vote的预选举阶段）、campaignElection（正常的选举阶段）、campaignTransfer（Leader Transfer阶段）。

hup方法会对节点当前状态进行一些检查：当前节点是否已经是leader、当前节点能否提升为leader（通过promotable()方法判断）、当前的节点已提交的日志中是否有还未被应用的集群配置变更ConfChange消息。

## campaign

campaign是用来发起投票或预投票的重要方法。在开启Pre-Vote后，首次调用campaign时，参数为campaignPreElection。此时会调用becomePreCandidate方法，该方法不会修改当前节点的Term值。而如果没有开启Pre-Vote或已经完成预投票进入正式投票的流程或是Leader Transfer时，会调用becomeCandidate方法，该方法会增大当前节点的Term。

## Step方法与step

Step函数是Raft状态机状态转移的入口方法。Step方法会检查消息的Term字段，对不同的情况进行不同的处理。Step方法还会对与选举相关的一些的消息进行特殊的处理。最后，Step会调用raft接口体step字段中记录的函数签名。

becomeXXX函数会让状态机切换到相应角色，并切换raft结构体的step字段中记录的函数。让不同角色的节点能够用不同的逻辑来处理Raft消息。

## becomeXXX与stepXXX

etcd/raft中becomeXXX共有四种：becomeFollower、becomeCandidate、becomePreCandidate、becomeLeader。stepXXX共有三种：stepLeader、stepCandidate、stepFollower。

Candidate和PreCandidate的行为有很多相似之处。预选举与选举的区别在主要在于预选举不会改变状态机的term也不会修改当前term的该节点投出的选票。

Leader中与选举相关逻辑的比重较少。stepLeader中处理的消息可以分为两类：不需要知道谁是发送者的消息（如MsgBeat广播心跳、MsgCheckQuorum检查quorum），和需要知道谁是发送者的消息（如MsgTransferLeader）。

Follower中与选举相关的逻辑不是很多。follower在收到来自leader的MsgApp、MsgHeartbeat、MsgSnap消息后，会更新当前记录的leader并重置election timeout定时器。收到MsgTimeoutNow消息时，会以campaignTransfer作为参数调用hup方法。

# 总结

本文首先介绍了etcd/raft实现的Raft选举优化，并介绍了使用选举优化后引入的新问题与解决方案，接着对etcd/raft中与选举有关的源码层层深入地分析。

