# etcd/raft（六）：只读请求优化

# 引言

本文介绍了etcd/raft中只读请求算法优化与实现。

# 处理只读请求算法与优化

Raft算法的目标之一是实现线性一致性（Linearizability）的语义。需要注意的，线性一致性的实现不仅与Raft算法本身有关，还与整个系统的实现（即状态机）有关。

## Log Read

Raft算法通过Raft算法实现线性一致性读最简单的方法就是让读请求也通过Raft算法的日志机制实现。即将读请求也作为一条普通的Raft日志，在应用该日志时将读取的状态返回给客户端。这种方法被称为Log Read。

Log Read的实现非常简单，其仅依赖Raft算法已有的机制。但显然，Log Read算法的延迟、吞吐量都很低。因此，为了优化只读请求的性能，就要想办法绕过Raft算法完整的日志机制。

## ReadIndex

显然，只读请求并没有需要写入的数据，因此并不需要将其写入Raft日志，而只需要关注收到请求时leader的commit index。只要在该commit index被应用到状态机后执行读操作，就能保证其线性一致性。

使用了ReadIndex的leader在收到只读请求时，会按如下方式处理：
- 记录当前的commit index，作为read index。
- 向集群中的所有节点广播一次心跳，如果收到了数量达到quorum的心跳响应，leader可以得知当收到该只读请求时，其一定是集群的合法leader。
- 继续执行，直到leader本地的apply index大于等于之前记录的read index。
- 让状态机执行只读操作，并将结果返回给客户端。

ReadIndex的方法只需要一轮心跳广播，既不需要落盘，且其网络开销也很小。ReadIndex方法对吞吐量的提升十分显著，但由于其仍需要一轮心跳广播，其对延迟的优化并不明显。

需要注意的是，当新leader刚刚当选时，其commit index可能并不是此时集群的commit index。因此，需要等到新leader至少提交了一条日志时，才能保证其commit index能反映集群此时的commit index。

通过ReadIndex机制，还能实现follower read。当follower收到只读请求后，可以给leader发送一条获取read index的消息，当leader通过心跳广播确认自己是合法的leader后，将其记录的read index返回给follower，follower等到自己的apply index大于等于其收到的read index后，即可以安全地提供满足线性一致性的只读服务。

## Lease Read

ReadIndex虽然提升了只读请求的吞吐量，但是由于其还需要一轮心跳广播，因此只读请求延迟的优化并不明显。而Lease Read在损失了一定的安全性的前提下，进一步地优化了延迟。

Lease Read同样是为了确认当前的leader为合法的leader，但是其实通过心跳与时钟来检查自身合法性的。当leader的heartbeat timeout超时时，其需要向所有节点广播心跳消息。设心跳广播前的时间戳为start，当leader收到了至少quorum数量的节点的响应时，该leader可以认为其lease的有效期为[election timeout]。一些系统在实现Lease Read时缩小了leader持有lease的时间，选择了一个略小于election timeout的时间，以减小时钟漂移带来的影响。

需要注意的是，与Leader Lease相同，Lease Read机制同样需要在选举时开启Check Quorum机制。

# etcd/raft中只读请求优化的实现

## etcd/raft中ReadIndex方法的使用

在etcd/raft中，使用ReadIndex还是Lease Read方法由通过raft的配置Config的ReadOnlyOption字段决定的。该字段的取值有两种：ReadOnlySafe与ReadOnlyLeaseBased，分别对应ReadIndex方法与Lease Read方法。

Node的ReadIndex方法就是用来获取read index的方法。当etcd/raft模块的调用者需要获取read index时，需要调用ReadIndex方法。ReadIndex方法不会直接返回read index，而是会在后续的Ready结构体的ReadStates字段中返回多次ReadIndex调用对应的ReadState。

为了让调用者能够区分ReadState是哪次调用的结果，ReadIndex方法需要传入一个唯一的rctx字段进行标识。

## etcd/raft中获取read index的实现

### readOnly结构体

在分析etcd/raft中获取read index的实现使用了raft结构体中的两个字段：readStates与readOnly。

readOnly结构体是leader仅使用ReadIndex时，用来记录等待心跳确认的read index的结构体。其字段包括：option（记录实现read index的方法）、readIndexQueue（多次调用ReadIndex方法时产生的rctx参数队列）、pendingReadIndex（rctx到其相应的状态readIndexStatus的映射）。

### 获取read index流程与实现

Node接口的ReadIndex方法会为Raft状态机应用一条MsgReadIndex消息。etcd/raft实现了Follower Read，即follower需要将获取read index的请求转发给leader，leader确认自己是合法的leader后将read index返回给follower。

当leader处理MsgReadIndex请求时，首先检查当前是否是以单节点模式运行的，如果是，那么该leader一定是合法的leader，因此可以直接返回相应的ReadState。接着，leader需要判断当前的term是否提交过日志，如果leader在当前term还没提交过消息，则其会忽略该MsgReadIndex消息。

然后，leader会根据配置的获取read index的方法执行不同的逻辑。当使用Lease Read时，leader可以直接返回相应的ReadState。当仅使用ReadIndex时，leader会将当前的commit index作为read index并通过readOnly的addRequest方法将其加入到待确认的队列中。

# 总结

本文介绍了etcd/raft中只读请求算法优化与实现。etcd/raft中只读请求优化几乎完全是按照论文实现的。

