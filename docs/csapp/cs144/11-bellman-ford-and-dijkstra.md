# Bellman Ford and Dijkstra

![1.jpg](./assets/1-20231123113517-srwzff2.jpg)

![2.jpg](./assets/2-20231123113517-u7wohn1.jpg)

## Recap

![3.jpg](./assets/3-20231123113517-8dwcrs7.jpg)

Last time: flooding, source routing and distributed algorithms

All three are used in certain parts of the internet nowadays

Flooding: when we don’t know the topology – router failure, or before the routing table is decided (used as part of distributed algorithms)

Source routing: when the source host wants to control the whole path

Distributed algorithms: Bellman-ford and Dijkstra

- **Bellman-ford:** fully distributed, and each router does a small amount of computation as a part of the large computation. However, it is hard to stabilize and reason about the incorrectness (and how incorrectness is propagated in the algorithm) if the topology changes.
- **Dijkstra**: determine topology (hard part) and then do a BFS (easy part).

How often to rerun the algorithm? This is a configurable parameter (every 30, 60 or 90 seconds), and a link failure would trigger an update.

![4.jpg](./assets/4-20231123113517-n6wp4jl.jpg)

![5.jpg](./assets/5-20231123113517-1mgcb8s.jpg)

![6.jpg](./assets/6-20231123113517-5n8z655.jpg)

![7.jpg](./assets/7-20231123113517-sj1qe6d.jpg)

![8.jpg](./assets/8-20231123113517-ofs0myk.jpg)

![9.jpg](./assets/9-20231123113517-225nah6.jpg)

## Distributed Bellman-Ford Algorithm

- Assume routers know cost of link to each neighbor
- Each router has a distance vector `c = (c1, c2, …)`. Each router sends its distance vectors to its neighbors. If the router knows a lower cost path, it updates the vector. Repeat.
- Hard to stabilize.

![10.jpg](./assets/10-20231123113517-0qfnk88.jpg)

![11.jpg](./assets/11-20231123113517-ygamyof.jpg)

![12.jpg](./assets/12-20231123113517-664e746.jpg)

## How routing works in the Internet

![13.jpg](./assets/13-20231123113517-4v25sew.jpg)

![14.jpg](./assets/14-20231123113517-yql21mn.jpg)

### Autonomous Systems (AS’s)

(Stanford is an AS).

Each AS has “**border routers**” that are connected to the border routers of other AS’s. Border routers are only aware of other border routers, and communicate following **Border Gateway Protocol** ([BGP](https://zhuanlan.zhihu.com/p/25433049)).

Within each AS, it decides its own routing protocol and this is opaque from outside the AS.

Stub AS (a leaf point of the Internet) and Transit AS (would transit traffic from one border router to another border router)

### `traceroute`

**AS numbers**: AS’s use an address space different from IP addresses, and each AS is responsible for a certain range of IP addresses. (`whois` takes an IP address and return the AS number)

**Internet exchange points (IXP)**: many routers for interconnecting between border routers of ISPs and ASs. How ISPs are connected within the IXP is decided by the IXP. **IXP uses Ethernet switches** to connect different ISPS (and therefore communication happens on the hardware address level)

![15.jpg](./assets/15-20231123113517-cedzfuh.jpg)

![16.jpg](./assets/16-20231123113517-7etkbsa.jpg)

![17.jpg](./assets/17-20231123113517-aat4ljj.jpg)

![18.jpg](./assets/18-20231123113517-jfvsh75.jpg)

![19.jpg](./assets/19-20231123113517-7tt8u2q.jpg)

![20.jpg](./assets/20-20231123113517-0oaaecg.jpg)

![21.jpg](./assets/21-20231123113517-mzsk9wx.jpg)

![22.jpg](./assets/22-20231123113517-rbwtwfq.jpg)
