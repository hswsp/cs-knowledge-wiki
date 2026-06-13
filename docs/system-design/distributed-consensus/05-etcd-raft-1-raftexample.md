# etcd/raft（一）：raftexample

# 前言

在深入学习etcd中raft的源码之前，首先应该学会使用etcd的raft模块。幸运的是，etcd官方提供了一个基于etcd/raft的简单kvstore的实现，该实现在etcd/contrib/raftexample下。

# raftexample设计思路

![raftexample 设计图](https://pub-d5563ccdabef16dad3d61d1a290c6067.r2.dev/distributed-consensus/3cf837aabc570c4b.svg)

raftexample由三个组件组成：由raft支持的kv存储、REST API服务器、和基于etcd/raft实现的共识服务器。

- 由raft支持的kv存储是一个持有所有已提交的键值对的map。该存储建立了raft服务器和REST服务器间的通信桥梁。
- REST服务器通过访问由raft支持的kv存储的方式暴露出当前raft达成的共识。GET命令会在存储中查找键，PUT命令会向存储提出一个更新提议。
- raft服务器和其集群中的对等节点（peer）会参与共识的达成。当REST服务器提交提议时，raft服务器会将该提议发送给其对等节点。当raft达成共识时，服务器会通过一个提交信道来发布所有已提交的更新。

# httpapi

httpapi.go是REST服务器的实现。与键值对相关的请求都会通过kvstore提供的方法处理，而有关集群配置的请求则是会编码为etcd/raft/v3/raftpb中proto定义的消息格式，直接传入confChangeC信道。

# kvstore

kvstore是连接raft服务器与REST服务器的桥梁，是实现键值存储功能的重要组件。kvstore结构体非常简单，其只有4个字段：proposeC信道、读写锁mu、由map实现的键值存储kvStore、和快照管理模块snapshotter。

newKVStore函数中，先调用一次kvstore的readCommits方法，等待raft模块重放日志完成的信号；然后启动一个goroutine来循环处理来自raft模块发送过来的消息。

readCommits方法会循环遍历commitC信道中raft模块传来的消息。当data为nil时，该方法会通过kvstore的快照管理模块snapshotter尝试加载上一个快照。当data非nil时，说明这是raft模块发布的已经通过共识提交了的键值对。

# raft服务器

raft服务器的实现在raft.go中，其对etcd/raft提供的接口进行了一层封装，以便于kvstore使用。

## raftNode结构体

在raftexample中，raft服务器被封装成了一个raftNode结构体。结构体中有4个用于与其它组件交互的信道：proposeC、confChangeC、commitC、errorC。

在结构体中，还保存了etcd/raft提供的接口与其所需的相关组件：node raft.Node（etcd/raft的核心接口）、raftStorage *raft.MemoryStorage（用来保存raft状态的接口）、wal *wal.WAL（预写日志实现）、snapshotter *snap.Snapshotter（快照管理器）、transport *rafthttp.Transport（通信模块）。

## raftNode的创建与启动

在创建raftNode时，需要提供节点id、对等节点url、是否是要加入已存在的集群、获取快照的函数签名、提议信道、配置变更提议信道这些参数。

startRaft方法检查快照目录是否存在，创建快照管理器，检查是否有旧的预写日志存在并重放旧的预写日志。在重放完成后，程序设置了etcd/raft模块所需的配置，并从该配置上启动或重启节点。

在node创建完成后，程序配置并开启了通信模块，开始与集群中的其它raft节点通信。然后启动了两个goroutine：raftNode.serveRaft()和raftNode.serveChannels()。

## 信道的处理

raftNode.serveChannels()是raft服务器用来处理各种信道的输入输出的方法，也是与etcd/raft模块中Node接口的实现交互的方法。

serverChannels()方法可以分为两个部分：循环处理raft有关的逻辑（处理定时器信号驱动Node、处理Node传入的Ready结构体、处理通信模块报告的错误或停止信号等）；启动一个goroutine循环处理来自proposeC和confChangeC两个信道的消息。

Node.Ready()返回的信道逻辑最为复杂。etcd/raft的Ready结构体中包含：SoftState、HardState、ReadStates、Entries、Snapshot、CommittedEntries、Messages、MustSync等字段。

处理Ready结构体的顺序：
- 将HardState和Entries写入预写日志；
- 如果有快照，保存快照到稳定存储中，然后应用快照；
- 将Entries追加到MemoryStorage中；
- 通过通信模块将Messages中的消息分发给其它raft节点；
- 通过publishEntries方法发布新增的日志条目；
- 通过maybeTriggerSnapshot方法检查MemoryStorage中日志条目长度，如果超过设定的最大长度，则触发快照机制并压缩日志。

# 总结

raftexample是官方提供的使用了etcd/raft的最基本的功能的简单的kv存储的示例。通过分析学习这段代码，可以简单了解etcd/raft的基本使用方式。

