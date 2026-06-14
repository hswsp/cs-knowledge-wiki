# Routing Basics

![1.jpg](./assets/1-20231123113517-f49ktfg.jpg)

![25.jpg](./assets/25-20231123113517-kpoe4w8.jpg)

![2.jpg](./assets/2-20231123113517-5s566qz.jpg)

## Route algorithm

Routers forward a packet for one hop by looking at the IP address。

![3.jpg](./assets/3-20231123113517-4xk9auj.jpg)

![4.jpg](./assets/4-20231123113517-ol4ae6s.jpg)

How to send the packet without knowing anything about the topology?

- Send it to a random next hop.
- Flooding: send it to everybody.
- Source Routing: the original sender list all routers along the path
- Distributed algorithm: routers construct a forwarding table by talking with each other

![5.jpg](./assets/5-20231123113517-bzwhrl0.jpg)

### Flooding

![6.jpg](./assets/6-20231123113517-kzknikm.jpg)

Flooding: routers forward a packet to every interface, except for the one it comes from

Cons:

- infinite loops. TTL field was originally designed to avoid the infinite loops.
- Inefficient usage of links: a packet would use all links at least once
- Packets are delivered to everyone

Pros: packets arrive the destination at the shortest possible path

### Source Routing

![7.jpg](./assets/7-20231123113517-2ce0hap.jpg)

Source Routing: the source hosts specify the whole path (A -&gt; R1 -&gt; R2 -&gt; R3 -&gt; B) or part of the path (the path has to go through R2)

Cons:

- Revealing the underlying network topology causes potential vulnerabilities, and ISPs do not want to reveal that to users (due to security/competition)
- Potentially large headers and all sources need to know the networking topology to do this

Pros:

- No loops
- No need for tables at routers

### Routing tables

![8.jpg](./assets/8-20231123113517-th7d4ab.jpg)

Routing tables: map prefix of IP destination addresses to next hop IP address

- X.Y/Z is a Z-bit prefix IP destination address
- Looking up in the routing tables looks for the longest prefix match

```
If (the packet is for this router’s Ethernet address) {
        Check the IP version number and length of datagram;
        Decrement TTL, and update IP header checksum;
           If (TTL == 0)  drop;
           If (IP destination address is in the forwarding table) {
                Forward to the correct port;
```

![9.jpg](./assets/9-20231123113517-jhgexpj.jpg)

## Routing tables

![10.jpg](./assets/10-20231123113517-l1dtxcu.jpg)

![11.jpg](./assets/11-20231123113517-ampycqi.jpg)

![12.jpg](./assets/12-20231123113517-vbx3srb.jpg)

How to construct routing tables?

- If packets from any source router should be delivered to router X exactly once along the shortest path, the routing table for destination router X, is a spanning tree with **root at router X**.
- Routers build a spanning tree for each destination.

![13.jpg](./assets/13-20231123113517-8gyncyx.jpg)

![14.jpg](./assets/14-20231123113517-1hsucmv.jpg)

![15.jpg](./assets/15-20231123113517-mem04ym.jpg)

![16.jpg](./assets/16-20231123113517-hq4wqyy.jpg)

![17.jpg](./assets/17-20231123113517-uu7sxrn.jpg)

![18.jpg](./assets/18-20231123113517-ei453hb.jpg)

![19.jpg](./assets/19-20231123113517-b0yiqmz.jpg)

![20.jpg](./assets/20-20231123113517-u9miixe.jpg)

![21.jpg](./assets/21-20231123113517-dr2y05b.jpg)

![22.jpg](./assets/22-20231123113517-56tbvws.jpg)

![23.jpg](./assets/23-20231123113517-qvm2njd.jpg)

![24.jpg](./assets/24-20231123113517-4j4vpzu.jpg)

![26.jpg](./assets/26-20231123113517-f76pj9h.jpg)

![27.jpg](./assets/27-20231123113517-hoktxm4.jpg)

![28.jpg](./assets/28-20231123113517-qwpqeqf.jpg)

![29.jpg](./assets/29-20231123113517-cy4iag7.jpg)

## Bellman-Ford algorithm

Bellman-Ford algorithm: every router advising its `# hops` from the destination, and update that number when they received a smaller `# hops` (`new number + 1 &lt; old number`) from its neighbors, and breaks ties at random.

![30.jpg](./assets/30-20231123113517-tlqyoz6.jpg)

![31.jpg](./assets/31-20231123113517-tnqouvh.jpg)

![32.jpg](./assets/32-20231123113517-61rsdjy.jpg)

![33.jpg](./assets/33-20231123113517-g5a6q1u.jpg)

![34.jpg](./assets/34-20231123113517-vw6gc9p.jpg)

![35.jpg](./assets/35-20231123113517-mz7rxo1.jpg)

![36.jpg](./assets/36-20231123113517-yyeu417.jpg)

![37.jpg](./assets/37-20231123113517-d94q7ns.jpg)

![38.jpg](./assets/38-20231123113517-tocxoxq.jpg)

![39.jpg](./assets/39-20231123113517-nev7fpi.jpg)

![40.jpg](./assets/40-20231123113517-hs5tahx.jpg)

![41.jpg](./assets/41-20231123113518-xbcdzlc.jpg)

![42.jpg](./assets/42-20231123113518-341zk9v.jpg)
