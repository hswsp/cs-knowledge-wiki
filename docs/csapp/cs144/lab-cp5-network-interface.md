---
title: "Checkpoint 5: down the stack (the network interface)"
description: "实现 NetworkInterface：IP 数据报与 Ethernet 帧之间的 ARP 桥。"
---

# Overview
In this week’s checkpoint, you’ll go down the stack and implement a **<font style="color:#D22D8D;">network interface</font>**<font style="color:#D22D8D;">: the bridge between Internet datagrams that travel the world</font>, and link-layer Ethernet frames that travel one hop. This component can fit “underneath” your TCP/IP implementation from the earlier labs, but it will also be used in a different setting: when you build a router in checkpoint 6, it will route datagrams between network interfaces. Figure 1 shows how the network interface fits into both settings. 

In past labs, you wrote a TCP implementation that can exchange TCP segments with any other computer that speaks TCP. How are these segments actually conveyed to the peer’s TCP implementation? As we’ve discussed, there are a few options:

+ **TCP-in-UDP-in-IP**. The TCP segments can be carried in the payload of a user datagram. When working in a normal (user-space) setting, this is the easiest to implement: Linux provides an interface (a “datagram socket”, `UDPSocket`) that lets <font style="color:#DF2A3F;">applications supply only the payload of a user datagram</font> and the target address, and the **<font style="color:#DF2A3F;">kernel</font>** takes care of <font style="color:#601BDE;">constructing the UDP header, IP header, and Ethernet header</font>, then sending the packet to the appropriate next hop. The kernel makes sure that each socket has an exclusive combination of local and remote addresses and port numbers, and since the kernel is the one writing these into the UDP and IP headers, it can guarantee isolation between different applications. 
+ **TCP-in-IP**. In common usage, TCP segments are almost always placed directly inside an Internet datagram, without a UDP header between the IP and TCP headers. This is what people mean by “TCP/IP.” **This is a little more difficult to implement**. <font style="color:#601BDE;">Linux provides an interface, called a </font>`<font style="color:#601BDE;">TUN</font>`<font style="color:#601BDE;"> device, that lets </font>**<font style="color:#601BDE;">application supply an entire</font>**<font style="color:#601BDE;"> Internet datagram</font>, and the **kernel** takes care of the rest (writing the **<font style="color:#DF2A3F;">Ethernet</font>** header, and actually sending via the physical Ethernet card, etc.). But now the <font style="color:#DF2A3F;">application has to construct the full IP header itself</font>, not just the payload. 
+ **TCP-in-IP-in-Ethernet**. In the above approach, we’re still relying on the Linux kernel for part of the networking stack. Each time your code writes an IP datagram to the `TUN` device, Linux has to construct an appropriate link-layer (Ethernet) frame with the IP datagram as its payload. This means Linux has to figure out the next hop’s Ethernet destination address, <font style="color:#601BDE;">given the IP address of the next hop</font>. If it doesn’t know this mapping already, Linux broadcasts a query that asks, “Who claims the following IP address? What’s your Ethernet address?” and waits for a response.   
**These functions are performed by the network interface**: a component that <font style="color:#601BDE;">translates outbound IP datagrams into link-layer</font> (e.g., Ethernet) frames and vice versa. (In a real system, network interfaces typically have names like `eth0`, `eth1`, `wlan0`, etc.) In this week’s lab, you’ll implement a network interface, and stick it at the very bottom of your TCP/IP stack. Your code will produce raw Ethernet frames, which will be handed over to Linux through an interface called a `**TAP**`** device**—similar to a `TUN` device, but <font style="color:#D22D8D;">more low-level, in that it exchanges raw link-layer frames instead of IP datagrams</font>.

![Figure 1: The network interface bridges the worlds of Internet datagrams and of link-layer frames. This component is useful as part of a host’s TCP/IP stack (left side), and also as part of an IP router (right side).](https://images.spumn.eu.cc/cs-knowledge-wiki/csapp/cs144/labs/344e29055b75-1750732867792-a7028bc6-dc91-43f1-a7a6-7fc5a693799c.png)

Most of the work will be in looking up (and caching) the Ethernet address for each next-hop IP address. The protocol for this is called the **Address Resolution Protocol**, or **ARP**. 

We’ve given you unit tests that put your network interface through its paces. In checkpoint 6, you’ll use the same network interface outside the context of TCP, as a part of an IP router.

总结：

| 模式 | 封装层次 | 实现复杂度 | 内核依赖 | 典型场景 |
| --- | --- | --- | --- | --- |
| TCP-in-UDP-in-IP | 应用层 → 传输层 → 网络层 | 低（用户态） | 高（全栈） | 简单隧道、覆盖网络 |
| TCP-in-IP | 传输层 → 网络层 | 中（需IP头部） | 中（链路层依赖） | 自定义IP协议、VPN |
| TCP-in-IP-in-Ethernet | 传输层 → 网络层 → 链路层 | 高（全手动） | 低（仅驱动） | 网络实验、硬件级开发 |


+ 趋势：从模式1到模式3，用户控制权增加，但开发成本显著提高。模式2（TUN设备）是平衡灵活性与复杂性的常见选择。

## Getting started
Make sure you have committed all your solutions. Please don’t modify any files outside the top level of the src directory, or **webget.cc**. You may have trouble merging the Checkpoint 5 starter code otherwise.

While inside the repository for the lab assignments, run `git fetch --all` to retrieve the most recent version of the lab assignment.

Download the starter code for Checkpoint 5 by running `git merge origin/check5-startercode .`  
(If you have renamed the “origin” remote to be something else, you might need to use a different name here, e.g. `git merge upstream/check5-startercode .`)

Make sure your build system is properly set up:` cmake -S . -B build`

Compile the source code: `cmake --build build`

Open and start editing the **writeups/check5.md** file. This is the template for your lab writeup and will be included in your submission.

Reminder: please make frequent **small commits** in your local Git repository as you work. If you need help to make sure you’re doing this right, please ask a classmate or the teaching staff for help. You can use the `git log` command to see your Git history.

## Checkpoint 5: The Address Resolution Protocol
Your main task in this lab will be to implement the three main methods of `NetworkInterface` (in the **network_interface.cc** file), maintaining a <font style="color:#601BDE;">mapping from IP addresses to Ethernet addresses</font>. The mapping is a cache, or “soft state”: the `NetworkInterface` keeps it around for efficiency’s sake, but if it has to restart from scratch, the mapping will naturally be regenerated without causing a problem.

1. `void NetworkInterface::send_datagram(const InternetDatagram &dgram, const Address &next hop);`

This method is called when the caller (e.g., your `TCPConnection` or a router) wants to <font style="color:#601BDE;">send an outbound Internet (IP)</font> datagram to the next hop.<sup>1</sup> It’s your interface’s job to <font style="color:#601BDE;">translate this datagram into an Ethernet frame and (eventually) send it.</font>

+ _If the destination Ethernet address is already known_, send it right away. Create an Ethernet frame (with `type = EthernetHeader::TYPE_IPv4`), set the payload to be the serialized datagram, and set the source and destination addresses.
+ _If the destination Ethernet address is unknown_, **broadcast an ARP request **for the next hop’s Ethernet address, and <font style="color:#601BDE;">queue the IP datagram</font> so it can be sent after the ARP reply is received.

Except: You don’t want to flood the network with ARP requests. <font style="color:#601BDE;">If the network interface already sent an ARP request about the same IP address in the last five seconds, don’t send a second request</font>—just wait for a reply to the first one. Again, queue the datagram until you learn the destination Ethernet address.

2. `void NetworkInterface::recv_frame(const EthernetFrame &frame);`

This method is called when an Ethernet frame arrives from the network. The code should ignore any frames not destined for the network interface (meaning, the Ethernet destination is <font style="color:#DF2A3F;">either the broadcast address</font> or the interface’s own Ethernet address stored in the ethernet address member variable).

+ If the inbound frame is IPv4 , parse the payload as an `InternetDatagram` and, if successful (meaning the `parse()` method returned `ParseResult::NoError`), push the resulting datagram on to the datagrams received queue.
+ If the inbound frame is **ARP**, parse the payload as an `ARPMessage` and, if successful, <font style="color:#D22D8D;">remember the mapping between the sender’s IP address and Ethernet address for 30 seconds</font>. (Learn mappings from both requests and replies.) In addition, if it’s an ARP request asking for our IP address, send an appropriate ARP reply.
3. `void NetworkInterface::tick(const size_t ms_since_last_tick); `

This is called as time passes. <font style="color:#D22D8D;">Expire any IP-to-Ethernet mappings that have expired</font>. 

**You can test your implementation** by running `cmake --build build --target check5` This test does not rely on your TCP implementation

## Q & A
+ How much code are you expecting? 

Overall, we expect the implementation (in **network_interface.cc**) will require about 100–150 lines of code in total. 

+ How do I ”send“ an Ethernet frame? 

Call `transmit()` on it. 

+ What data structure should I use to record the mapping between next-hop IP address and Ethernet addresses? 

Up to you! 

• How do I convert an IP address that comes in the form of an `Address` object, <font style="color:#DF2A3F;">into a raw 32-bit integer</font> that I can write into the ARP message? 

Use the `Address::ipv4 numeric()` method. 

+ What should I do if the `NetworkInterface` sends an ARP request but never gets a reply? Should I <font style="color:#D22D8D;">resend it after some timeout? Signal an error to the original sender using ICMP</font>? 

In real life, yes, both of those things, but don’t worry about that in this lab. (**<font style="color:#DF2A3F;">In real life, an interface will eventually send an ICMP “host unreachable” back across the Internet to the original sender if it can’t get a reply to its ARP requests</font>**.) 

+ What should I do if an `InternetDatagram` is queued waiting to learn the Ethernet address of the next hop, and that information never comes? Should I <font style="color:#DF2A3F;">drop the datagram after some timeout</font>? 

Again, definitely a “yes” in real life, but don’t worry about that in this lab. 

+ Where can I read if there are more FAQs after this PDF comes out? 

Please check the website ([https://cs144.github.io/lab_faq.html](https://cs144.github.io/lab_faq.html)) and _EdStem_ regularly.

## Development and debugging advice
1. Implement the `**NetworkInterface**`’s public interface (and any private methods or functions you’d like) in the file **network_interface.cc**. You may add any private members you like to the `NetworkInterface` class in **network_interface.hh**. 
2. You can test your code with `cmake --build build --target check5` . 
3. Please re-read the section on “using Git” in the Checkpoint 0 document, and remember to keep the code in the Git repository it was distributed in on the main branch. **Make small commits, using good commit messages that identify what changed and why.**
4. Please work to make your code readable to the CA who will be grading it for style. Use reasonable and clear naming conventions for variables. Use comments to explain complex or subtle pieces of code. Use “defensive programming”—explicitly check preconditions of functions or invariants, and throw an exception if anything is ever wrong. Use modularity in your design—identify common abstractions and behaviors and factor them out when possible. Blocks of repeated code and enormous functions will make it hard to follow your code.

## Submit
1. In your submission, please only make changes to the **.hh** and **.cc** files in the src directory. Within these files, please feel free to add private members as necessary, but please don’t change the public interface of any of the classes.
2. Before handing in any assignment, please run these in order:
    1. Make sure you have committed all of your changes to the Git repository. You can run `git status` to make sure there are no outstanding changes. Remember: make small commits as you code.
    2. `cmake --build build --target format` (to normalize the coding style) 
    3. `cmake --build build --target check5` (to make sure the automated tests pass) 
    4. Optional: `cmake --build build --target tidy` (suggests improvements to follow good C++ programming practices)
3. Write a report in **writeups/check5.md**. This file should be a roughly 20-to-50-line document with no more than 80 characters per line to make it easier to read. The report should contain the following sections:
    1. **Program Structure and Design**. Describe the high-level structure and design choices embodied in your code. You do not need to discuss in detail what you inherited from the starter code. Use this as an opportunity to highlight important design aspects and provide greater detail on those areas for your grading TA to understand. You are strongly encouraged to make this writeup as readable as possible by using subheadings and outlines. Please do not simply translate your program into an paragraph of English. 
    2. **Implementation Challenges**. Describe the parts of code that you found most troublesome and explain why. Reflect on how you overcame those challenges and what helped you finally understand the concept that was giving you trouble. How did you attempt to ensure that your code maintained your assumptions, invariants, and preconditions, and in what ways did you find this easy or difficult? How did you debug and test your code?
    3. **Remaining Bugs.** Point out and explain as best you can any bugs (or unhandled edge cases) that remain in the code.
4. Please also fill in the number of hours the assignment took you and any other comments. 
5. Please let the course staff know ASAP of any problems at a lab session, or by posting a question on Ed. Good luck!

## N.B.
1. Please don’t confuse the ultimate destination of the datagram, which is in the datagram’s own header as the destination address, with the next hop. In this lab you’re only going to care about the next hop’s address.

