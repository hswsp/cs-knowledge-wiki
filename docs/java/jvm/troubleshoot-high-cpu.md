---
title: JVM CPU 使用率飙高问题的排查过程
description: "How to Troubleshoot High Java CPU Usage Issues"
date: 2022-11-07
---

# 问题现象

首先，我们一起看看通过 VisualVM 监控到的机器 CPU 使用率图：

![Image](https://cdn.jsdelivr.net/gh/hswsp/IMAGE_HOST/img/1.png)

如上图所示，在 下午3:45 分之前，CPU 的使用率明显飙高，最高飙到近 100%，为什么会出现这样的现象呢？

# 排查过程

**Step 1：** 使用top命令，查询资源占用情况：

![Image](https://cdn.jsdelivr.net/gh/hswsp/IMAGE_HOST/img/2.png)

如上图所示，显示了服务器当前的资源占用情况，其中PID为5456的进程占用的资源最多。

在这里，我们也**使用`top -p PID`命令，查询指定PID的资源占用情况**：

![Image](https://cdn.jsdelivr.net/gh/hswsp/IMAGE_HOST/img/3.png)

**Step 2：** **使用`ps -mp PID -o THREAD,tid,time`命令，查询该进程的线程情况**：

![Image](https://cdn.jsdelivr.net/gh/hswsp/IMAGE_HOST/img/4.png)

在这里，我们也使用`ps -mp PID -o THREAD,tid,time | sort -rn`命令，将该进程下的线程按资源使用情况倒序展示：

![Image](https://cdn.jsdelivr.net/gh/hswsp/IMAGE_HOST/img/5.png)

**Step 3：** 使用**`printf "%x\n" PID`命令，将PID转为十六进制的TID**：

![Image](https://cdn.jsdelivr.net/gh/hswsp/IMAGE_HOST/img/6.png)

在这里，我们之所以需要将PID转为十六进制是因为**在堆栈信息中，TID是以十六进制形式存在的**。

**Step 4：** **使用`jstack PID | grep TID -A 100`命令，查询堆栈信息**：

![Image](https://cdn.jsdelivr.net/gh/hswsp/IMAGE_HOST/img/7.png)

如上图所示，显示该进程下多个线程均处于`TIMED_WAITING`状态。

虽然线程处于`WAITING`或者`TIMED_WAITING`状态都不会消耗 CPU，但是线程频繁的挂起和唤醒却会消耗 CPU，而且代价高昂。

而上面之所以会出现 CPU 使用率飙高的情况，则是因为有人在做压测。

特别地，在 mock 底层接口的时候，使用了类似`TimeUnit.SECONDS.sleep(1)`这样的语句。

至于为何在 下午3:45 分之后，CPU 的使用率降下来了，则是因为停止了压测。

除此之外，我们还可以使用`jinfo`和`jstat`命令来查询 Java 进程的启动参数以及 GC 情况：

**使用`jinfo PID`命令，查询启动参数：**

![Image](https://cdn.jsdelivr.net/gh/hswsp/IMAGE_HOST/img/8.png)

如上图所示，使用该命令我们主要是为了查询启动参数，如初始化堆大小、垃圾回收器等配置。

**使用`jstat -gcutil PID 1000`命令，查询 GC 情况：**

![Image](https://cdn.jsdelivr.net/gh/hswsp/IMAGE_HOST/img/9.png)

如上图所示，显示了PID为20567的 Java 进程每秒的 GC 情况，其中**1000表示 GC 状态的更新频率**，单位为毫秒。

# Reference

1. [High Java CPU Usage – Troubleshooting Tips](https://www.eginnovations.com/blog/troubleshoot-java-cpu-issues/)
