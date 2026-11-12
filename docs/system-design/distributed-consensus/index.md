# 分布式共识

> 从 Paxos 到 Raft、Gossip 与拜占庭共识：共识算法的理论推导、工程优化与源码解读。

## Paxos 协议

- [Basic Paxos](/system-design/distributed-consensus/paxos/basic-paxos)
- [Multi-Paxos](/system-design/distributed-consensus/paxos/multi-paxos)

## Raft 算法

- [Raft算法总结（一）](/system-design/distributed-consensus/raft/01-raft-summary-1)
- [Raft算法总结（二）](/system-design/distributed-consensus/raft/02-raft-summary-2)
- [Raft（一）领导者选举](/system-design/distributed-consensus/raft/raft-1-leader-election)
- [Raft（二）日志复制与压缩](/system-design/distributed-consensus/raft/raft-2-log-replication)
- [Raft（三）集群成员变更](/system-design/distributed-consensus/raft/raft-3-membership-change)
- [MIT 6.824 Lab 2 - Raft](/system-design/distributed-consensus/raft/mit-6824-lab2-raft)
- [主流使用 Raft 的对象存储：一致性引擎的工程优化](/system-design/distributed-consensus/raft/raft-object-storage-engineering)

### etcd/raft 源码解读

- [etcd/raft（一）：raftexample](/system-design/distributed-consensus/raft/etcd-raft/05-etcd-raft-1-raftexample)
- [etcd/raft（二）：总体设计](/system-design/distributed-consensus/raft/etcd-raft/06-etcd-raft-2-design)
- [etcd/raft（三）：Raft选举](/system-design/distributed-consensus/raft/etcd-raft/07-etcd-raft-3-election)
- [etcd/raft（四）：Raft日志](/system-design/distributed-consensus/raft/etcd-raft/08-etcd-raft-4-log)
- [etcd/raft（五）：Raft成员变更](/system-design/distributed-consensus/raft/etcd-raft/09-etcd-raft-5-membership)
- [etcd/raft（六）：只读请求优化](/system-design/distributed-consensus/raft/etcd-raft/10-etcd-raft-6-readonly)

## Gossip 协议

- [Gossip 协议详解](/system-design/distributed-consensus/gossip/04-gossip-protocol)

## 其他共识协议

- [如何解决分布式系统中的"幽灵复现"？](/system-design/distributed-consensus/others/03-ghost-reappearance)
- [Pompē：拜占庭有序共识协议详解](/system-design/distributed-consensus/others/11-pompe-ordered-consensus)

---

*← 返回[系统设计](/system-design/)*
