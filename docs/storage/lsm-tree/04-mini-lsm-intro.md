# 可能是史上最完整的 LSM-Tree 存储课程

TL;DR, 时隔一年多，总算填完了 Mini-LSM 系列教程的坑。在这个课程中，你可以学习如何用 Rust 语言从零造一个基于 LSM 树的存储引擎。

整个教程有三周的内容，每周六个主线任务章节和一个轻松的支线任务章节，一共 21 个章节，全部 open source + 附赠官方实现。第一周，搭建 LSM-Tree 存储引擎的框架，完成所有的内存和盘上结构，实现 get/put/delete/scan 接口。第二周，深入理解 LSM-Tree 的 Compaction 算法，实现 RocksDB 的 Leveled + Universal Compaction，并将 LSM 树的状态持久化/恢复，完成一个完整的存储引擎设计。第三周，给存储引擎加入 MVCC 支持，完成 Transaction API，并实现 Serializable Snapshot Isolation。

![图片](https://cdn.nlark.com/yuque/0/2024/webp/22382307/1706752105352-1191bf53-1378-4c70-82c0-93857a3099da.webp)

Mini-LSM 世界地图

完成整个课程后，你就可以非常深入地理解并掌握 LSM-Tree 的各个组件和相关算法；对解决存储引擎上的问题，或是基于业务场景设计一个全新的存储引擎，有非常大的帮助。

每一章节除了必做内容外，还有一些选做内容和思考习题。思考习题有简单的概念题，也有一些给定场景下的系统设计题。很多问题都来源于本人之前工作中碰到的问题和挑战，所以多思考这些课后习题也可以帮助你更好地理解 LSM-Tree 设计中的 tradeoff。

开始这门课程之前，建议你对于 key-value 存储引擎和 Rust 语言有一些基本的了解。课程的 reference solution 全部公开，每一小章节都有一个 commit。如果中间碰到困难，也可以参考官方实现。如果你对 Rust 和存储引擎没什么了解，可以阅读 [The Rust Book](https://link.zhihu.com/?target=https%3A//doc.rust-lang.org/book/) 学习 Rust，并完成 [BusTub B+ Tree Project](https://link.zhihu.com/?target=https%3A//15445.courses.cs.cmu.edu/spring2023/project2/) 或者 [PingCAP Talent Plan](https://link.zhihu.com/?target=https%3A//github.com/pingcap/talent-plan/tree/master/courses/rust/projects/project-2) 中关于存储引擎相关的内容，之后就能非常顺利地进行这门课程的学习了。

这门课程第一次发布是在 22 年年底，当时只发布了四个章节（对应现在版本的第一周内容）。如果你曾经学习过之前的一个版本，也可以把当时的代码直接 port 到这个版本中，理论上不需要做太多改动。在这里也感谢给这门课程提出过宝贵建议的同学们；在这些建议的基础上，今年我重写了整个课程，并在此基础上完成了三周的教学内容。

本失败人士做 key-value 存储也有两三年了，这个课程也算是对于我自己工作多年以来经验的一些沉淀。存储引擎作为关系型数据库系统最底层的组件，设计并优化存储引擎是一件非常重要且核心的工作。之前本人学习的过程大多都来源于实际的工业界项目，往往无法面面俱到，总是对 LSM 中的某些东西一知半解，不知道为什么要这么做或是这么设计。所以写一门课程，也是希望自己能系统地整理和阐述大脑中的知识，形成一个思维闭环。本失败人士自认为这是一个非常完整和深入的 LSM-Tree 存储引擎教程，也是一门存储的进阶课程，希望这个课程体系对大家的学习和工作能有一些帮助 :)

附录：Mini-LSM 分章节内容

| Week + Chapter | Topic |
|---------------|-------|
| 1.1 | Memtable |
| 1.2 | Merge Iterator |
| 1.3 | Block |
| 1.4 | Sorted String Table (SST) |
| 1.5 | Read Path |
| 1.6 | Write Path |
| 1.7 | SST Optimizations: Prefix Key Encoding + Bloom Filters |
| 2.1 | Compaction Implementation |
| 2.2 | Simple Compaction Strategy (Traditional Leveled Compaction) |
| 2.3 | Tiered Compaction Strategy (RocksDB Universal Compaction) |
| 2.4 | Leveled Compaction Strategy (RocksDB Leveled Compaction) |
| 2.5 | Manifest |
| 2.6 | Write-Ahead Log (WAL) |
| 2.7 | Batch Write and Checksums |
| 3.1 | Timestamp Key Encoding |
| 3.2 | Snapshot Read - Memtables and Timestamps |
| 3.3 | Snapshot Read - Transaction API |
| 3.4 | Watermark and Garbage Collection |
| 3.5 | Transactions and Optimistic Concurrency Control |
| 3.6 | Serializable Snapshot Isolation |
| 3.7 | Compaction Filters |

## Reference

### Rust 语言入门教程：
- [https://www.freecodecamp.org/news/how-to-build-a-to-do-app-with-rust/](https://www.freecodecamp.org/news/how-to-build-a-to-do-app-with-rust/)
- [https://rustwiki.org/zh-CN/rust-by-example/index.html](https://rustwiki.org/zh-CN/rust-by-example/index.html)
- [Rust语言从入门到精通系列 - 聊聊RwLock读写锁那些事儿](https://juejin.cn/post/7224205585124687932)
