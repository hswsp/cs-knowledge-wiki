---
description: "七篇长文，从内存序、I/O 模型、同步原语、调度到 thread-per-core，逐层拆解工业级 C++ 并发系统的设计取舍。"
---

# C++ 并发编程

从 `std::atomic` 的内存序到 thread-per-core：七篇长文，逐层拆开工业级 C++ 并发系统里的设计取舍。

本系列的源码、配图与勘误都托管在 Gitee 仓库 [champagnew/cpp-concurrent](https://gitee.com/champagnew/cpp-concurrent)。每篇正文开头的「配套代码」表列出了该篇对应的代码目录与源文件链接，正文里提到的每一个 `.cpp` / `.h` 也都能点进去看完整实现。

## 七篇

| 篇 | 标题 | 所在层次 | 要回答的问题 |
| --- | --- | --- | --- |
| 01 | [并发地基篇：从经典论文到工程方针](01-foundations.md) | 概念框架 | 这个变量为什么要写成 `std::atomic`？换成无锁队列真的更快吗？线程开多少？ |
| 02 | [事件循环与 libev：从 select 到 epoll](02-event-loop-libev.md) | I/O 模型 | 事件循环不是「让单次 I/O 变快」，而是「让等待变便宜」——5 ms 的阻塞调用如何把吞吐砍到千分之一 |
| 03 | [Boost.Asio：从 Reactor 到 Proactor](03-boost-asio.md) | I/O 模型 | Linux 上没有原生完成通知接口，Asio 如何提供完成语义？多个线程跑同一个 `io_context` 时，同一连接的回调会不会并发？ |
| 04 | [Boost.Lockfree 与无锁容器](04-boost-lockfree.md) | 同步原语 | 无锁的价值为什么不在「快」而在「有界」，以及在什么条件下它并不比加锁快 |
| 05 | [oneTBB 与任务调度](05-onetbb.md) | 调度 | 加速比的上界由什么决定？任务切多大才不亏？工作窃取到底解决了什么问题？ |
| 06 | [Folly 与高性能组件](06-folly.md) | 数据结构与内存 | 哈希表每次插入都要 `malloc`，阿姆达尔定律会把这条串行路径放大成什么 |
| 07 | [Seastar 与 thread-per-core](07-seastar.md) | 架构 | 如果从一开始就不共享内存，前面六篇的那些手段是不是都不需要了 |

## 建议读法

- **顺序读**：七篇是一条线。01 立概念与准则，02/03 讲 I/O 模型的两半，04 讲同步原语，05 讲调度，06 讲数据结构与内存布局，07 用 share-nothing 把前面所有前提推翻一遍。
- **按问题查**：只想知道「锁还要不要加」，从 [01](01-foundations.md) 的工程准则表和 [04](04-boost-lockfree.md) 的实测走；只关心「服务为什么扛不住慢调用」，从 [02](02-event-loop-libev.md) 和 [07](07-seastar.md) 走。
- **先跑代码**：每篇的「配套代码」表就是实验入口，每个源文件头部都写了编译命令，多数程序带命令行参数，可以换参数复现文中的表。

## 代码与实验环境

- 环境：Linux x86-64 / GCC 11.4（部分示例需要 GCC 11+ 的 `-std=c++20`）。
- 文中所有输出都是真实运行结果，不是示意数据；但实验机器是 **2 核共享沙盒**，绝对数值波动较大，凡波动显著处原文都标注了范围，并明确说明「不作为单点结论」。
- 部分库（oneTBB、Folly、Seastar）在沙盒里装不上，对应的实测改用**等价的自行实现**完成——复现的是设计决策背后的代价结构，不是官方的基准数字。原文对每一处都做了说明。

## 代码目录

| 篇 | 代码目录 | 配图 |
| --- | --- | --- |
| 01 | [`01-地基篇/code/`](https://gitee.com/champagnew/cpp-concurrent/tree/master/01-%E5%9C%B0%E5%9F%BA%E7%AF%87/code) | [`figures/`](https://gitee.com/champagnew/cpp-concurrent/tree/master/01-%E5%9C%B0%E5%9F%BA%E7%AF%87/figures) |
| 02 | [`02-libev篇/code02/`](https://gitee.com/champagnew/cpp-concurrent/tree/master/02-libev%E7%AF%87/code02) | [`figures/`](https://gitee.com/champagnew/cpp-concurrent/tree/master/02-libev%E7%AF%87/figures) |
| 03 | [`03-Asio篇/code03/`](https://gitee.com/champagnew/cpp-concurrent/tree/master/03-Asio%E7%AF%87/code03) | [`figures/`](https://gitee.com/champagnew/cpp-concurrent/tree/master/03-Asio%E7%AF%87/figures) |
| 04 | [`04-Lockfree篇/code04/`](https://gitee.com/champagnew/cpp-concurrent/tree/master/04-Lockfree%E7%AF%87/code04) | [`figures/`](https://gitee.com/champagnew/cpp-concurrent/tree/master/04-Lockfree%E7%AF%87/figures) |
| 05 | [`05-oneTBB篇/code05/`](https://gitee.com/champagnew/cpp-concurrent/tree/master/05-oneTBB%E7%AF%87/code05) | [`figures/`](https://gitee.com/champagnew/cpp-concurrent/tree/master/05-oneTBB%E7%AF%87/figures) |
| 06 | [`06-Folly篇/code06/`](https://gitee.com/champagnew/cpp-concurrent/tree/master/06-Folly%E7%AF%87/code06) | [`figures/`](https://gitee.com/champagnew/cpp-concurrent/tree/master/06-Folly%E7%AF%87/figures) |
| 07 | [`07-Seastar篇/code07/`](https://gitee.com/champagnew/cpp-concurrent/tree/master/07-Seastar%E7%AF%87/code07) | [`figures/`](https://gitee.com/champagnew/cpp-concurrent/tree/master/07-Seastar%E7%AF%87/figures) |
