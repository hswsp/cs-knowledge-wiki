---
title: Raft 协议（三）—— 集群成员变更
description: "Raft集群成员变更"
date: 2022-09-16
---

![Raft 协议实战系列（五）—— 集群成员变更与日志压缩](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/39cfc4f351ea491aab271b4783988552~tplv-k3u1fbpfcp-zoom-crop-mark:3024:3024:3024:1702.awebp)

> 摘录自:[Q的博客](https://juejin.cn/post/6902274909959880711),[Raft 笔记(六) – Cluster membership change](https://youjiali1995.github.io/raft/etcd-raft-cluster-membership-change/)

本文介绍 Raft 论文描述的两个 Raft 实践必备技术之一 ——集群成员变更。**本文重点讲解 raft 集群如何动态增删节点、集群变更时脑裂的诱因及应对方案。**
