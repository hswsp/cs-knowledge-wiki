---
title: "Checkpoint 6: building an IP router"
description: "用最长前缀匹配实现 IP Router，把数据报转发到下一跳。"
---

# Overview
In this week’s lab checkpoint, you’ll implement an IP router on top of your existing `NetworkInterface`. A router <font style="color:#601BDE;">has several network interfaces</font>, and can receive Internet datagrams on any of them. The router’s job is to forward the datagrams it gets according to the **routing table**: a list of rules that tells the router, for any given datagram, 

+ <font style="color:#D22D8D;">What interface to send it out </font>
+ The IP address of the next hop 

Your job is to implement a router that can figure out these two things for any given datagram. (You will not need to implement the **algorithms that make the routing table, e.g. RIP, OSPF, BGP, or an SDN controller**—just the algorithm that follows the routing table.) 

Your implementation of the router will use the Minnow library with a new `Router` class, and tests that will check your router’s functionality in a simulated network. Checkpoint 6 builds on your implementation of `NetworkInterface` from Checkpoint 5, but does not use the TCP stack you implemented previously. <font style="color:#601BDE;">IP routers don’t have to know anything about TCP, ARP, or Ethernet (only IP)</font>. We expect your implementation will require about **30–60 lines of code**. (The **scripts/lines-of-code** tool prints “Router: 38 lines of code” from the starter code, and “89 lines of code” for our example solutions.)

### **RIP（路由信息协议）**
**类型**：距离矢量协议（基于跳数选择路径）。

**核心机制**：

+ 以**跳数**为度量值，最大跳数15，超过则认为不可达。
+ 每30秒广播路由表更新，通过**水平分割**（避免环路）、**毒性反转**（快速清除无效路由）等机制优化性能。  
 **特点**：
+ **优点**：简单易用，适合小型网络。
+ **缺点**：跳数限制导致无法适应大规模网络，收敛速度慢，易产生环路。  
 **应用场景**：小型企业或实验网络。

### **OSPF（开放最短路径优先）**
**类型**：链路状态协议（基于Dijkstra算法计算最短路径）。

**核心机制**：

+ 每个路由器广播**链路状态通告（LSA）**，构建**链路状态数据库（LSDB）**，通过SPF算法生成最短路径树。
+ 支持**区域划分**（Area 0为骨干区域），减少路由计算量。
+ 以**带宽**为默认度量值，支持VLSM（可变长子网掩码）和CIDR。  
 **特点**：
+ **优点**：无环路、收敛快、支持大型网络，是主流企业级协议。
+ **缺点**：配置复杂，对设备性能要求较高。  
 **应用场景**：中大型企业网络、数据中心。

### **BGP（边界网关协议）**
**类型**：路径矢量协议（用于自治系统间路由）。

**核心机制**：

+ 以**AS路径**为核心度量，通过TCP建立邻居关系，确保可靠传输。
+ 支持**路由策略**（如路由过滤、优先级设置），可控制流量路径。
+ 通过**路由反射器**和**联盟**优化大规模网络。  
 **特点**：
+ **优点**：支持跨自治系统路由，是互联网的核心协议。
+ **缺点**：配置复杂，学习门槛高，收敛速度较慢。  
 **应用场景**：互联网服务提供商（ISP）、跨国企业跨域路由。

### **SDN（软件定义网络）**
**类型**：非传统路由协议，是一种网络架构理念。

**核心机制**：

+ **控制平面与数据平面分离**：<font style="color:#601BDE;">控制器集中管理路由策略，设备仅负责转发</font>。
+ 通过**南向接口**（如OpenFlow）下发流表，实现灵活的流量控制。  
 **特点**：
+ **优点**：网络可编程性强，支持动态流量调度，简化运维。
+ **缺点**：依赖控制器稳定性，初期部署成本高。  
 **应用场景**：数据中心网络、云环境、5G核心网。

### **对比总结**
| 协议/架构 | 类型 | 核心算法/机制 | 适用规模 | 典型场景 |
| --- | --- | --- | --- | --- |
| **RIP** | 距离矢量 | 跳数度量 | 小型网络 | 家庭/小型办公室 |
| **OSPF** | 链路状态 | SPF算法+区域划分 | 中大型网络 | 企业网、校园网 |
| **BGP** | 路径矢量 | AS路径+路由策略 | 跨自治系统 | 互联网、ISP互联 |
| **SDN** | 架构（非协议） | 控制-转发分离 | 灵活适配 | 数据中心、云网络 |


# Getting started
1. Make sure you have committed all your solutions to Checkpoint 5. Please don’t modify any files outside the top level of the src directory, or **webget.cc**. You may have trouble merging the Checkpoint 6 starter code otherwise.
2. While inside the repository for the lab assignments, run `git fetch --all` to retrieve the most recent version of the lab assignment.
3. Download the starter code for Checkpoint 6 by running `git merge origin/check6-startercode` .  
(If you have renamed the “origin” remote to be something else, you might need to use a different name here, e.g. `git merge upstream/check6-startercode` .)

![Figure 1: A router contains several network interfaces and can receive IP datagrams on any one of them. The router forwards any datagram it receives to the next hop, on the appropriate outbound interface. The routing table tells the router how to make this decision.](https://images.spumn.eu.cc/cs-knowledge-wiki/csapp/cs144/labs/c387f5e76300-1750993719996-1d5978d5-f0df-4b54-b566-53dec6e5b2f3.png)

4. Make sure your build system is properly set up: `cmake -S . -B build`
5. Compile the source code: `cmake --build build`
6. Open and start editing the **writeups/check6.md** file. This is the template for your lab writeup and will be included in your submission.
7. Reminder: please make frequent **small commits** in your local Git repository as you work. If you need help to make sure you’re doing this right, please ask a classmate or the teaching staff for help. You can use the `git log` command to see your Git history.

# Implementing the Router
In this lab, you will implement a Router class that can: 

+ keep track of a routing table (the list of forwarding rules, or routes), and 
+ forward each datagram it receives: 
    - to the correct next hop 
    - on the correct outgoing `NetworkInterface`. 

Your implementation will be added to the **router.hh** and **router.cc** skeleton files. Before you get to coding, please review the documentation for the new `Router` class in **router.hh**. Here are the two methods you’ll implement, and what we’re expecting in each:

```c
void add_route(uint32_t route_prefix,
               uint8_t prefix_length,
               optional<Address> next_hop,
               size_t interface_num);
```

This method adds a route to the routing table. You’ll want to add a data structure as a private member in the `Router` class to store this information. All this method needs to do is save the route for later use.

> **What do the parts of a route mean?**
>
> A route is a “match-action” rule: it tells the router that if a datagram is headed for a particular network (a range of IP addresses), and if the route is chosen as the <font style="color:#D22D8D;">most specific matching route</font>, then the router should forward the datagram to a particular next hop on a particular interface. 
>
> **The “match”: is the datagram headed for this network**? <font style="color:#601BDE;">The route prefix and prefix length together</font> specify a range of IP addresses (a network) that might include the datagram’s destination. <font style="color:#601BDE;">The route prefix is a 32-bit numeric IP address. The prefix length is a number between 0 and 32 (inclusive)</font>; it tells the router how many **most-significant bits** of the route prefix are significant. For example, to express a route to the network “18.47.0.0/16” (this matches any 32-bit IP address where the first two bytes are 18 and 47), the route prefix would be 305070080 (18 × 2^24 + 47 × 2^16), and the prefix length would be 16. Any datagram destined for “18.47.x.y” will match. 
>
> **The “action”: what to do if the route matches and is chosen**. If the router is directly attached to the network in question, the next hop will be an empty optional. In that case, the next hop is the datagram’s destination address. But if the router is connected to the network in question through some other router, the next hop will contain the IP address of the next router along the path. The `interface_num` gives the index of the router’s `NetworkInterface` that should use to send the datagram to the next hop. You can access this interface with the interface(`interface_num`) method.
>

```c
void route();
```

Here’s where the rubber meets the road. This method needs to route each incoming datagram to the next hop, out the appropriate interface. It needs to implement the “longest-prefix match” logic of an IP router to find the best route to follow. That means:

+ The `Router` searches the routing table to find the routes that match the datagram’s destination address. By “match,” we mean the most-significant prefix length bits of the destination address are identical to the most-significant prefix length bits of the route prefix. 
+ Among the matching routes, the router chooses the route with the biggest value of `prefix_length`. This is the <font style="color:#DF2A3F;">longest-prefix-match route</font>. 
+ If no routes matched, <font style="color:#601BDE;">the router drops the datagram.</font> 
+ The router <font style="color:#601BDE;">decrements the datagram’s TTL</font> (time to live). If the TTL was zero already, or hits zero after the decrement, the router should drop the datagram. 
+ Otherwise, the router sends the modified datagram on the appropriate interface ( `interface(interface_num)->send_datagram()` ) to the appropriate next hop.

> There’s a beauty (or at least a successful abstraction) in the Internet’s design here: the router never thinks about TCP, about ARP, or about Ethernet frames. The router doesn’t even know what the link layer looks like. The router only thinks about Internet datagrams, and only interacts with the link layer through the `NetworkInterface` abstraction. When it comes to questions like, “How are link-layer addresses resolved?” or “Does the link layer even have its own addressing scheme distinct from IP?” or “What’s the format of the link-layer frames?” or “What’s the meaning of the datagram’s payload?”, the router just doesn’t care.
>

# Testing
You can test your implementation by running `cmake --build build --target check6` . This will test your router in a particular simulated network, shown in Figure 2.

![Figure 2: The simulated test network used in the router test, also run by cmake --build build --target check5 . (Fun fact: the uun network is David Mazi`eres’s slice of the Internet, allocated in 1993. The whois tool, or the linked website, can be used to look up who controls each IP address allocation.)](https://images.spumn.eu.cc/cs-knowledge-wiki/csapp/cs144/labs/9358136cfbc1-1750996122181-c327dc73-b23b-4ee5-9877-df4c8d2b958e.png)

# Q & A
1. What data structure should I use to record the routing table?

Up to you! But please don’t get crazy. It’s perfectly acceptable for each datagram to require $ O(N) $ work, where N is the number of entries in the routing table. If you’d like to do something more efficient, we’d encourage you to get a working implementation first before optimizing, and carefully document and comment whatever you choose to implement.

2. How do I convert an IP address that comes in the form of an `Address` object, into a raw 32-bit integer that I can write into the ARP message? 

Use the `Address::ipv4_numeric()` method.

3. How do I convert an IP address that comes in the form of a raw 32-bit integer into an `Address` object? 

Use the `Address::from_ipv4_numeric()` method.

4. How do I compare the most-significant N bits (where 0 ≤ N ≤ 32) of one 32-bit IP address with the most-significant N bits of another 32-bit IP address? 

This is probably the “trickiest” part of this assignment—getting that logic right. It may be worth writing a small test program in C++ (a short standalone program) or adding a test to Minnow to verify your understanding of the relevant C++ operators and double-check your logic. 

Recall that <font style="color:#601BDE;">in C and C++, it can produce undefined behavior to shift a 32-bit integer by 32 bits</font>. The tests run your code under sanitizers that try to detect this. You can run the router test directly by running `./build/tests/router` from the minnow directory.

5. If the router has no route to the destination, or if the TTL hits zero, shouldn’t <font style="color:#D22D8D;">it send an ICMP error message back to the datagram’s source</font>? 

<font style="color:#DF2A3F;">In real life, yes, that would be helpful</font>. But not necessary in this lab—dropping the datagram is sufficient. (Even in the real world, not every router will send an ICMP message back to the source in these situations.)

6. Where can I read if there are more FAQs after this PDF comes out? 

Please check the website ([https://cs144.github.io/lab_faq.html](https://cs144.github.io/lab_faq.html)) and EdStem regularly.

# Submit
In your submission, please only make changes to the .hh and .cc files in the src directory. Within these files, please feel free to add private members as necessary, but please don’t change the public interface of any of the classes.

Before handing in any assignment, please run these in order:

1. Make sure you have committed all of your changes to the Git repository. You can run `git status` to make sure there are no outstanding changes. Remember: make small commits as you code.
2. `cmake --build build --target format` (to normalize the coding style)
3. `cmake --build build --target check6` (to make sure the automated tests pass) 
4. Optional: `cmake --build build --target tidy` (suggests improvements to follow good C++ programming practices)

Write a report in **writeups/check6.md**. This file should be a roughly 20-to-50-line document with no more than 80 characters per line to make it easier to read. The report should contain the following sections:

1. **Program Structure and Design**. Describe the high-level structure and design choices embodied in your code. You do not need to discuss in detail what you inherited from the starter code. Use this as an opportunity to highlight important design aspects and provide greater detail on those areas for your grading TA to understand. You are strongly encouraged to make this writeup as readable as possible by using subheadings and outlines. Please do not simply translate your program into an paragraph of English. 
2. **Implementation Challenges**. Describe the parts of code that you found most troublesome and explain why. Reflect on how you overcame those challenges and what helped you finally understand the concept that was giving you trouble. How did you attempt to ensure that your code maintained your assumptions, invariants, and preconditions, and in what ways did you find this easy or difficult? How did you debug and test your code? 
3. **Remaining Bugs**. Point out and explain as best you can any bugs (or unhandled edge cases) that remain in the code.. 

Please also fill in the number of hours the assignment took you and any other comments.

Please let the course staff know ASAP of any problems at the lab sessions, or by posting a question on EdStem.

