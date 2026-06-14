# BGP and How the Internet works in the real world

![1.jpg](./assets/1-20231123113517-csodyhn.jpg)

![2.jpg](./assets/2-20231123113517-fshsnof.jpg)

Each ISP would have ~[公式] routers. Companies also put servers within IXPs, (though IXPs at the beginning were there for housing routers)

## BGP: does not use Bellman-Ford or Dijkstra

Each BGP router advertise routes to their neighbors &#123;a prefix + a list of AS’s to reach that a prefix through this router&#125;

Each BGP router selects one or more paths of AS’s based on its own preference (by local policies chosen by the **AS administrator**)

Loops can be detected (duplicate AS in the path)

![3.jpg](./assets/3-20231123113517-tz92eo9.jpg)

## Why path in BGP?

A router may dislike a certain AS (e.g. security reason, geo-political issue, etc.)

There is a “trust” relationship between an end-host and the border gateway router that host connects to. Therefore,it is hard to detect lies about the AS paths since BGP protocol is based on a mutual trust between two connected border gateway routers, (although there exist algorithms/techniques to verify whether the path being advertised is valid).

![4.jpg](./assets/4-20231123113517-btfe0pf.jpg)

## BGP details

BGP neighbors establish a TCP connection, and send a “keep alive” message every 60 seconds

Also called “**path vector**” algorithm

![5.jpg](./assets/5-20231123113517-q74yewz.jpg)

## Commercial Internet: customer-provider relationship

![6.jpg](./assets/6-20231123113517-o4mn72j.jpg)

Customers pay providers for carrying packets, but how should providers charge each other?

![7.jpg](./assets/7-20231123113517-3u7b9y3.jpg)

Stub AS – transit AS — transit AS — transit AS — stub AS: who pay the center transit AS? There were agreements and settlements between ISPs for dealing these situations (which would make them “peers”), and the center transit AS only carries the traffic if such settlements exist (i.e. if they are “peers”).

![8.jpg](./assets/8-20231123113517-aipoz6c.jpg)

But this agreement situation needs to stop at a “top-level”, i.e., “Tier-1” providers. “Tier 1” network are peers with all other “Tier 1” network.

![9.jpg](./assets/9-20231123113517-gprti7z.jpg)

Tier 1 ISP has access to the entire Internet Region. Each Internet Region has its own Tier 1 ISPs, and an ISP only gets promoted to “Tier 1” if it is big enough (carries large enough traffic, which means the ISP has invested a lot in its infrastructure). And **Tier 1 ISP does not charge each other** (since they are of similar large size).

![10.jpg](./assets/10-20231123113517-5yxgrm8.jpg)

For non Tier 1 ISPs, if an advertised path goes through a non-peer AS, it would not select the path, but would **select the path that goes to “Tier 1”**.

![11.jpg](./assets/11-20231123113517-p98tf5d.jpg)

![12.jpg](./assets/12-20231123113517-38mwyd8.jpg)

![13.jpg](./assets/13-20231123113517-tuy3ltw.jpg)

## Multicast: single-source, multi-destination

![14.jpg](./assets/14-20231123113517-vivnzrr.jpg)

![15.jpg](./assets/15-20231123113517-dnuh3mw.jpg)

![16.jpg](./assets/16-20231123113517-goc4ym3.jpg)

A portion of IP v4 address is reserved for Group ID. Sending packets to such IP v4 address would send the packet to each members of the group.

![17.jpg](./assets/17-20231123113517-pafz60x.jpg)

For broadcasting from a source, the paths form a spanning tree rooted at the source, and therefore by reversing the routing table for the source as the destination, you get the required spanning tree. This is called **Reverse Path Broadcasting**.

![18.jpg](./assets/18-20231123113517-zgchull.jpg)

RPB + pruning gives **RPF**

## 参考资料

[BGP漫谈](https://zhuanlan.zhihu.com/p/25433049)
