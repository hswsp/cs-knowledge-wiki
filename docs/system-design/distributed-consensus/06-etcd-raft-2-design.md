# etcd/raft（二）：etcd/raft总体设计

# 引言

etcd/raft将Raft算法的实现分为了3个模块：Raft状态机、存储模块、传输模块。

Raft状态机完全由etcd/raft负责，raft结构体即为其实现。使用etcd/raft的开发者不能直接操作raft结构体，只能通过etcd/raft提供的Node接口对其进行操作。

存储模块可以划分为两部分：对存储的读取与写入。etcd/raft只需要读取存储，etcd/raft依赖的Storage接口中只有读取存储的方法。而对存储的写入由用户负责。

通信模块是完全由使用etcd/raft的开发者负责的。etcd/raft不关心开发者如何实现通信模块。

# Node、node、rawnode

Node接口为开发者提供了操作etcd/raft的方法。Node结构中的方法按调用时机可以分为三类：

- Tick：由时钟（循环定时器）驱动，每隔一定时间调用一次，驱动raft结构体的内部时钟运行。
- Ready、Advance：这两个方法往往成对出现。每当从Ready结构体信道中收到来自raft的消息时，用户需要按照一定顺序对Ready结构体中的字段进行处理。在完成对Ready的处理后，需要调用Advance方法，通知raft这批数据已经处理完成。
- 其它方法：需要时随时调用。

对于Ready结构体，有几个重要的字段需要按照如下顺序处理：
- 将HardState、Entries、Snapshot写入稳定存储；
- 将Messages中的消息发送给相应的节点；将Snapshot和CommittedEntries应用到本地状态机中；
- 调用Advance方法。

在etcd/raft中，Node接口的实现一共有两个，分别是node结构体和rawnode结构体。二者都是对etcd/raft中Raft状态机raft结构体进行操作。不同的是，node结构体是线程安全的，其内部封装了rawnode，并通过各种信道实现线程安全的操作；而rawnode是非线程安全的，其直接将Node接口中的方法转为对raft结构体的方法的调用。

# Raft状态机——raft

etcd/raft的实现的优雅之处之一，在于其很好地剥离了各模块的职责。在etcd/raft的实现中，raft结构体是一个Raft状态机，其通过Step方法进行状态转移。只要涉及到Raft状态机的状态转移，最终都会通过Step方法完成。Step方法的参数是Raft消息。

以Node接口的Tick方法为例。在rawnode的Tick方法实现中，其调用了raft结构体的tick"方法"。tick其实并非一个真正的方法，而是raft的一个字段，其类型为一个无参无返回值的函数。这样设计的原因，是leader和follower在tick被调用时的行为不同。tick字段可能的值有两个，分别为tickElection()和tickHeartbeat()，二者分别对应follower（或candidate、pre candidate）和leader的tick行为。

# 总结

本文主要从顶层的视角，简单地分析了etcd/raft的总体设计。本文主要目的是给读者对etcd/raft的结构的整体认识，便于读者接下来学习etcd/raft中Raft算法的实现与优化。

