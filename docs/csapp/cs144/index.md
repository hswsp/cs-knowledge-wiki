# CS 144

> Stanford CS144: Introduction to Computer Networking 课程笔记。

## Course info

- Course: [CS 144: Introduction to Computer Networking](https://cs144.github.io/), Spring 2023
- Syllabus: [Syllabus/logistics handout](https://cs144.github.io/logistics.pdf)

## Notes

1. [课程导论（Course intro）](./01-course-intro)
2. [数据报、封装与多路复用（Datagrams, encapsulation, and multiplexing）](./03-datagrams-encapsulation-and-multiplexing)
3. [服务抽象、协议栈与可靠性（Service abstractions, stacks, and reliability）](./04-service-abstractions-stacks-and-reliability)
4. [物理层抽象（Physical Layer Abstraction）](./05-physical-layer-abstraction)
5. [链路层 / 物理层（The Link Layer aka Physical Layer）](./06-the-link-layer-aka-physical-layer)
6. [网络栈不同层的命名（Naming at different layers of the network stack）](./07-naming-at-different-layers-of-the-network-stack)
7. [分组交换（Packet Switching）](./08-packet-switching)
8. [分组交换 2（Packet Switching 2）](./09-packet-switching-2)
9. [路由基础（Routing Basics）](./10-routing-basics)
10. [Bellman-Ford 与 Dijkstra（Bellman Ford and Dijkstra）](./11-bellman-ford-and-dijkstra)
11. [互联网如何工作（简版）（How the Internet works(in brief)）](./12-how-the-internet-works-in-brief)
12. [互联网如何工作（How the Internet works）](./13-how-the-internet-works)
13. [BGP 与真实世界的互联网（BGP and How the Internet works in the real world）](./14-bgp-and-how-the-internet-works-in-the-real-world)
14. [TCP（TCP）](./15-tcp)
15. [TCP part 2（TCP part 2）](./16-tcp-part-2)
16. [TCP part 3（TCP part 3）](./17-tcp-part-3)
17. [幂等性与 TCP（Idempotence and TCP）](./18-idempotence-and-tcp)
18. [为什么需要拥塞控制（Why congestion control）](./19-why-congestion-control)
19. [什么是拥塞控制（What congestion control）](./20-what-congestion-control)
20. [拥塞控制如何工作（How congestion control）](./21-how-congestion-control)
21. [互联网视频传输（Video over Internet）](./22-video-over-internet)
22. [TLS（TLS）](./23-tls)
23. [计算机安全坏态度指南（The Bad-Attitude Guide to Computer Security）](./24-the-bad-attitude-guide-to-computer-security)
24. [家庭网络史 1（History of home networking 1）](./25-history-of-home-networking-1)
25. [家庭网络史 2（History of home networking 2）](./26-history-of-home-networking-2)
26. [家庭网络史 3（History of Home Networking 3）](./27-history-of-home-networking-3)
27. [家庭网络史 4（History of Home Networking 4）](./28-history-of-home-networking-4)
28. [Lab Checkpoint 0：网络热身（Lab Checkpoint 0: networking warmup）](./02-lab-checkpoint-0-networking-warmup)

## Labs

### Setting up your CS144 VM

The CS144 labs are designed to work with the GNU/Linux. You have four options for setting up your development machine:

- On Intel/AMD computers: Use a [VM image that we prepared](https://stanford.edu/class/cs144/vm_howto/vm-howto-image.html) in VirtualBox
- Use a [Google Cloud virtual machine](https://docs.google.com/document/d/1HlpMwultnKx8d7o4YfBmsEkjJdVWvnS-ydIIJS9nR9A/edit?usp=sharing) using our class's coupon code
- Use your own GNU/Linux installation with a C++20 compiler (GCC 12 or later, clang 15 or later)
- On ARM MacBooks and Macs: please install the [UTM virtual machine software](https://mac.getutm.app/) and use our [ARM64 GNU/Linux virtual machine image](https://web.stanford.edu/class/cs144/vm_files/cs144-arm64-2023.utm.tar.gz)

Because the labs were designed to use Linux-specific interfaces, we cannot support development on any other operating system—though you’re free to do whatever works for you, so long as the code you turn in works in the supported environment! It's unlikely that MacOS or Microsoft Windows (even with WSL) will be sufficient.

### Labs Checkpoint

Lab Checkpoint 0: networking warmup
