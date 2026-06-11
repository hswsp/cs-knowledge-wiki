---
title: Java ThreadGroup
description: "thread-group"
date: 2022-11-06
---

# 线程组概念理解

在java的多线程处理中有线程组ThreadGroup的概念，**ThreadGroup是为了方便线程管理出现了，可以统一设定线程组的一些属性，比如setDaemon，设置未处理异常的处理方法，设置统一的安全策略等等**；也可以通过线程组方便的获得线程的一些信息。

每一个ThreadGroup都可以包含一组的子线程和一组子线程组，在一个**进程中线程组是以树形的方式存在**，通常情况下根线程组是system线程组。system线程组下是main线程组，默认情况下第一级应用自己的线程组是通过main线程组创建出来的。

我们可以通过下面代码片段看下一个简单的java application中线程组的情况：

```java
package cn.outofmemory.concurrent;
 
public class ThreadGroupDemo {
	public static void main(String[] args) {
		printGroupInfo(Thread.currentThread());
		
		Thread appThread = new Thread(new Runnable(){
			@Override
			public void run() {
				for (int i=0;i<5;i++) {
					System.out.println("do loop " + i);
				}
			}
		});
		appThread.setName("appThread");
		appThread.start();
		printGroupInfo(appThread);
	}
	
	static void printGroupInfo(Thread t) {
		ThreadGroup group = t.getThreadGroup();
		System.out.println("thread " + t.getName() + " group name is " 
				+ group.getName()+ " max priority is " + group.getMaxPriority()
				+ " thread count is " + group.activeCount());
		
		ThreadGroup parent=group;
		do {
			ThreadGroup current = parent;
			parent = parent.getParent();
			if (parent == null) {
				break;
			}
 
			System.out.println(current.getName() + "'s parent is " + parent.getName());
		} while (true);
		System.out.println("--------------------------");
	}
}
```

这段代码打印结果如下：

```bash
thread main group name is main max priority is 10 thread count is 1
main's parent is system
