# etcd/raft（五）：Raft成员变更

# 引言

本文会对etcd/raft中Raft成员变更算法的实现与优化进行分析。

# 成员变更算法

![配置变更多主问题](https://images.spumn.eu.cc/distributed-consensus/638df266c7d6c1a2.png)

《CONSENSUS: BRIDGING THEORY AND PRACTICE》的Chapter 4介绍了两种成员变更算法，一种是一次操作一个节点的简单算法，另一种是联合共识（joint consensus）算法。两种算法都是为了避免由于节点切换配置时间不同导致的同一term出现不只一个leader的问题。

![简单成员变更算法](https://images.spumn.eu.cc/distributed-consensus/547b352dff7efca7.png)

简单成员变更算法限制每次只能增加或移除一个节点。这样可以保证新配置与旧配置的quorum至少有一个相同的节点，因为一个节点在同一term仅能给一个节点投票，所以这能避免多主问题。

![联合共识算法](https://images.spumn.eu.cc/distributed-consensus/6a54c6ad8412c952.png)

联合共识算法可以一次变更多个成员，但是需要在进入新配置前先进入一个"联合配置（joint configuration）"，在联合配置的quorum分别需要新配置和旧配置的majority（大多数）节点，以避免多主问题。当联合配置成功提交后，集群可以开始进入新配置。

etcd/raft的ConfChangeV2既支持简单的"one at a time"的成员变更算法，也支持完整的联合共识算法。需要注意的是，etcd/raft中的配置的应用时间与论文中的不同。在论文中，节点会在追加配置变更日志时应用相应的配置，而在etcd/raft的实现中，当节点应用（apply）配置变更日志条目时才会应用相应的配置。etcd/raft在"apply-time"应用新配置的方式，可以保证配置在应用前已被提交，因此不需要论文中提到的回滚旧配置的操作。

另外，同一时间只能有一个正在进行的配置变更操作，在提议配置变更请求时，如果已经在进行配置变更，那么该提议会被丢弃（被改写成一条无任何意义的日志条目）。

# etcd/raft配置的实现

etcd/raft实现的配置是按照joint configuration组织的。

## MajorityConfig

在joint consensus中，中间状态的quorum同时需要和各自的majority。或配置中voter的集合是通过MajorityConfig表示的。MajorityConfig的实现非常简单，其只是voter节点id的集合，但MajorityConfig提供了一些很实用的与majority有关方法：CommittedIndex（计算被大多数节点接受了的commit index）、VoteResult（根据给定的投票统计计算投票结果）。

## JointConfig

JointConfig表示joint consensus下的配置，即与的组合。JointConfig的元素0统一表示；元素1在joint consensus下表示，在非joint consensus下应为一个空配置。

JointConfig的CommittedIndex方法会获取两个MajorityConfig的CommittedIndex的返回值，并返回较小的结果，即被和都接受的commit index。

## Config

Config记录了全部的成员配置，既包括voter也包括learner。Config的Voter字段类型即为JointConfig，AutoLeave字段是标识joint consensus情况下离开joint configuration的方式。

etcd/raft为了简化配置变更的实现，其配置需要满足一条约束：配置的voter集合与learner集合不能有交集。

## ProgressTracker

ProgressTracker中包含了leader用来追踪follower复制进度的字段Progress和记录选票的Vote字段。ProgressTracker提供了：ConfState()（返回当前激活的配置）、Committed()（返回被quorum接受的commit index）、QuorumActive()（判断是否有达到quorum数量的节点处于活跃状态）、VoterNodes()（返回有序的voter节点id集合）等方法。

# etcd/raft配置变更的实现

etcd/raft中新配置是在apply-time生效的。如果etcd/raft模块的使用者在处理Ready结构体的CommittedEntries字段时遇到了实现了ConfChangeI接口的消息时，需要主动调用Node的ApplyConfChange方法通知Raft状态机使用新配置。

## ConfChange类型

ConfChangeV2的Transition字段表示切换配置的行为，其支持的行为有3种：
- ConfChangeTransitionAuto（默认）：自动选择行为。
- ConfChangeTransitionJointImplicit：强制使用joint consensus，并在适当时间自动退出joint consensus。
- ConfChangeTransitionJointExplicit：强制使用joint consensus，但不会自动退出，需要使用者显式控制。

ConfChangeV2的Changes字段表示一系列的节点操作：ConfChangeAddNode、ConfChangeRemoveNode、ConfChangeUpdateNode、ConfChangeAddLearnerNode。

## 提议ConfChange

在stepLeader方法处理MsgProp时，如果发现ConfChange消息或ConfChangeV2消息，会反序列化消息数据并对其进行一些预处理。Raft同一时间只能有一个未被提交的ConfChange，因此拒绝新提议。处于joint configuration的集群必须先退出joint configuration并转为，才能开始新的ConfChange。

对需要拒绝的提议的处理非常简单，只需要将该日志条目替换为没有任何意义的普通空日志条目即可。

## 应用ConfChange

etcd/raft需要使用者自行调用Node的ApplyConfChange方法来应用新配置。该方法首先通过检查ConfChangeV2的行为与变更内容，并通过confChange.Changer创建新的配置与用于进度跟踪的字典，最后调用switchToConfig方法切换到新配置并更新进度跟踪映射。

## AutoLeave

当ConfChange的类型为ConfChangeTransitionAuto或ConfChangeTransitionJointImplicit时，退出joint configuration由etcd/raft自动实现。在advance方法中，判断调用Advance方法前处理的最后一个Ready中是否包含合法的ConfChange，如果有合法的ConfChange且当前配置开启了AutoLeave，同时该节点是leader的话，那么向其日志中追加一条空的ConfChangeV2消息，以用来触发退出joint configuration的操作。

# 总结

本文介绍了etcd/raft中采用的Raft成员变更算法的实现。etcd/raft的改动不是很多，因此更重要的是熟悉论文中的方法。

