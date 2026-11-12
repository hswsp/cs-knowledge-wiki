# Gossip 协议详解

说到共识算法，大家首先想到的应该都是 Raft、Paxos、Zab 算法这类理解起来比较困难的强一致性算法。但是还有一个弱一致性的共识算法比较好理解，Gossip 协议。

Gossip，意思是"流言蜚语"。

![Gossip](https://images.spumn.eu.cc/distributed-consensus/0dff0d3d53908188.png)


## Gossip 协议

Gossip 协议最早提出的时间得追溯到 1987 年发布的一篇论文：《Epidemic Algorithms for Replicated Database Maintenance》。所以 Gossip 的学名应该是又叫做"流行病算法"。

论文的开篇介绍部分描述了三种方法来进行数据的更新：

![流行病算法](https://images.spumn.eu.cc/distributed-consensus/6cb59ffee371eb7b.png)

![数据更新方式](https://images.spumn.eu.cc/distributed-consensus/b76be75937365cdb.png)

- Direct mail（直接邮件）
- Anti-entropy（反熵）
- Rumor mongering（传谣）

### Direct mail（直接邮寄）



![Direct mail](https://images.spumn.eu.cc/distributed-consensus/2a8a215cfb801b25.png)

![Direct mail 缺点](https://images.spumn.eu.cc/distributed-consensus/e2a48c2604b0452c.png)
每个服务器之间都是平等的关系，不存在中心节点、主从什么的关系。当某个节点有数据变更了，把变更的数据直接通知给剩下的节点。这个方案的优点很明显：简单、粗暴、直接。但是缺点也很明显：首先不完全可靠，因为这个要求每个站点都必须知道所有站点的存在；然后信息有时会丢失，一旦丢失，就连最终一致性也保证不了。

### Anti-entropy（反熵）



![反熵](https://images.spumn.eu.cc/distributed-consensus/331a3187dad542be.png)

![Anti-entropy](https://images.spumn.eu.cc/distributed-consensus/24baa12fdf0c3810.png)
"熵"的通俗理解就是"混乱程度"。比如你的房间，如果你不去整理那么各自物品的摆放就会越来越混乱，也就是越来越"熵"。而你整理房间的这个操作就是"反熵"。

每个服务器有规律地随机选择另一个服务器，这二者通过交换各自的内容来抹平它们之间的所有差异，这种方案是非常可靠的。但需要检查各自服务器的全量内容，因此数据量略大，不能使用太频繁。反熵虽然可靠，但传播更新的速度比直接邮件慢得多。

如果不同步，那么两者之间的数据差异越来越大，也就是越来越熵。同步的目的是缩小差异，达到最终一致性，这就是反熵。

### Rumor mongering（传谣）



![Rumor mongering](https://images.spumn.eu.cc/distributed-consensus/7fa5f2fa016c901e.png)

![Simple epidemics](https://images.spumn.eu.cc/distributed-consensus/c7a4750c5ad5cd8b.png)
比起反熵，传谣从字面上就很好理解了。"传谣"和"反熵"的差别在于只传递新信息或者发生了变更的信息，而不需要传递全量的信息。

在论文中，simple epidemics（单纯性传染病）模式下，包含两种状态：infective（传染性）和 susceptible（易感染）。处于 infective 状态的节点代表其有数据更新，需要把数据分享（传染）给其他的节点。处于 susceptible 状态的节点代表它还没接受到其他节点的数据更新（没有被感染）。

## 一个网站



![Gossip 模拟动画](https://images.spumn.eu.cc/distributed-consensus/218874246fb9df65.png)

![模拟器界面](https://images.spumn.eu.cc/distributed-consensus/0ba946263a249052.png)

![Fanout 示例](https://images.spumn.eu.cc/distributed-consensus/90e8f629716d3b2a.png)

![传播路径](https://images.spumn.eu.cc/distributed-consensus/18d90c652ff339c4.png)

![最终一致](https://images.spumn.eu.cc/distributed-consensus/6a7e42d9f440405b.png)
有一个非常仿真的动画模拟 gossip 协议的同步过程：[https://flopezluis.github.io/gossip-simulator/](https://flopezluis.github.io/gossip-simulator/)

一个节点想与网络中的其他节点分享一些信息。然后，它定期从节点集合中随机选择一个节点并交换信息，收到信息的节点也做同样的事情。该信息定期发送到 N 个目标，N 被称为扇出（Fanout）。



![复杂度公式](https://images.spumn.eu.cc/distributed-consensus/b2e298abc4788735.png)

![O(logN)](https://images.spumn.eu.cc/distributed-consensus/768e77a8f4b04809.png)
gossip 协议的复杂度是 O(logN)。比如，每次都设置为 Fanout=4，那么：
- 40 个节点，2.66 轮
- 80 个节点，3.16 轮
- 160 个节点，3.66 轮
- 320 个节点，4.16 轮

可以看到，随着节点数的翻倍增加，传播轮次并没有明显的增加。这就是 Scalable（可伸缩）。

## 其他注意点



![真实 Gossip 协议注意点](https://images.spumn.eu.cc/distributed-consensus/7709860a25e808f3.png)

![Redis meet](https://images.spumn.eu.cc/distributed-consensus/bdae8a6a1f251ee7.png)
在真正的 gossip 协议中，每个节点都有自己的周期，它们之间根本没有也不需要同步。每个节点往外同步消息的时候，是按照自己的周期来处理的，比如每 10 秒一次。

节点之间怎么知道其他节点的存在的？其中一个方式就是当节点加入集群时，必须知道该集群中的一个节点的信息。Redis 集群采用的就是 gossip 协议来交换信息。当有新节点要加入到集群的时候，需要用到一个 meet 命令。

## 六度分隔理论



![六度分隔](https://images.spumn.eu.cc/distributed-consensus/4d3877a81c4ac4b7.png)

![小世界网络](https://images.spumn.eu.cc/distributed-consensus/087a69d2a16aaed5.png)
1967年，哈佛大学的心理学教授Stanley Milgram想要描绘一个连结人与社区的人际连系网。做过一次连锁信实验，结果发现了"六度分隔"现象。简单地说："你和任何一个陌生人之间所间隔的人不会超过六个，也就是说，最多通过六个人你就能够认识任何一个陌生人。"

六度分割理论，也叫小世界理论。这其实和 Gossip 协议也有千丝万缕的联系。

