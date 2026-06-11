# CMU15-445笔记-索引篇

面对海量数据，如何快速的找到我们想要的数据？为了解决这个问题，数据库中引入了一个新的数据结构：索引。它可以使得我们通过部分attribute的值快速定位到整个tuple，让查询速度变得更快。但代价是每次写tuple的时候，都需要同时更新索引。

本文主要介绍数据库中的索引的数据结构以及它们的trade off

## 1. 数据结构

### 1.1. hash 表

hash表应该是最常见的数据结构了，它具有单点查询快，不能范围查询等特点。其包含两个部分：

* hash函数：有诸多研究关于hash函数，但此时的hash函数只有两个要求：快和冲突少
* 存储方案：存储的方式有两种：一种是静态的，即hash表的大小不能更改；一种是动态的，hash表的大小可以动态调整

### 1.1.1. 静态表

静态表的大小是固定的，其中对于hash冲突的解决比较复杂。

**向下探测**：一个最简单的方案便是向下探测，当遇到冲突时向后探测到空的项便插入。这种方案在删除的时候会比较复杂，因为如果直接删除会造成空表项，那么便可能会分割冲突后的位置和其原位置（原位置在空表项前，探测的位置在空表项后），所以需要墓碑。

**ROBIN HOOD HASH**：向下探测的方案很简单，但是它在实际运行时，可能有些探测位置离原位置较远，有些较近。所以为了平衡距离。每个表项都会保存其距原位置的距离（简称**距离**，如果没有发生冲突就是0）。当发生冲突向下探测时，会比较自己的**距离**和当前表项的**距离**。如果自己比较大，便抢占当前位置，使得它向下探测。这便是Robin Hood探测，劫富济贫。（有必要平均吗？）

**CKCKOO HASH**：为了减少冲突，还可以将多个hash函数和hash表组合起来。假设有两个hash函数hash1、hash2，和两个hash表t1、t2，其插入的流程如下：

* 插入A，首先计算key1 = hash1(A)，若table1中key1位置为空，直接插入；否则
* 计算key2 = hash2(A)，若table2的key2位置为空，直接插入；否则
* 置换A和table2的key2中的元素B，此时问题便变成了插入B
* key1' = hash1(B)。查看table1的key1‘位置是否为空，如果为空插入。否则置换

如上步骤最后就像乒乓球一样，在table1 table2中来回置换。这种方法的问题就是最后可能造成死循环。

### 1.1.2. 动态表

**CHAINED HASHING：** 此方法很简单，就是在每个hash slot中加一个链表，将冲突的元素串成一个链表。由此我们可以把hash表分为两个部分：主hash表，以及链表（或者叫bucket）

![](https://pic3.zhimg.com/80/v2-fe09060f6e4007c7213a52e8e165df5e_1440w.webp)

**EXTENDIBALE HASHING：** 本方法的motivation也很简单，就是冲突的链表过长的时候，就需要进行分裂。即将bucket分裂，同时将主hash表翻倍，然后按照hash函数重新分配bucket。具体的参见 [https://www.geeksforgeeks.org/extendible-hashing-dynamic-approach-to-dbms/](https://www.geeksforgeeks.org/extendible-hashing-dynamic-approach-to-dbms/)

**LINEAR HASHING：** 上述Extendible Hashing是指数级的扩张hash表的，这未免也太快了。所以便有了LINEAR HASHING，线性扩张hash表，即每次只增加一个。其基本思想是维护一个指针split pointer，其指向下一个被拆分bucket，当任意bucket溢出时，将指针指向的当前bucket的拆分。

### 1.2. B+树

B+树是最好的索引数据结构，据Andy所说。B+树在范围查询、点查询以及cache局部性中都有很好的表现。其数据结构如下所示：

![](https://pic1.zhimg.com/80/v2-6f4a866575528a90258200cd0ec04168_1440w.webp)

### 1.2.1. 内部结构

**leaf node**会以下信息，除了key-value信息外，还有sibling pointer。

![](https://pic2.zhimg.com/80/v2-a161453be7468f4232cdc71f8d1bb741_1440w.webp)

其中value既可以保存tuple，也可以保存指向tuple的record ID。

在实现B+树时可能会面临以下问题。

**如何处理重复的key：** 可以保存多次<key, value>；也可以key只保存一次，而value保存为一个链表

**如何处理变长的key：**

可以只保存key的指针；也可以直接保存数据，但是可能会导致节点的大小不一致，内存管理更复杂；还可以将key padding到相同的长度。当然也可以加一层中间层（类似slot array）

![](https://pic1.zhimg.com/80/v2-c473fd5e3e5fdd265a089c4ae9287214_1440w.webp)

**如何搜索内部的key：** 可以维持一个有序的数组，然后二分查找，不过插入会比较复杂。或者遍历查询。如果数据的分布是确定的，也可以直接数学计算出位置。

### 1.2.2. 增删查改

增删查改的流程在各类算法书中都有详细的介绍，这里就不详细赘述。其可视化流程参见[B+ Tree Visualization](https://link.zhihu.com/?target=https%3A//www.cs.usfca.edu/~galles/visualization/BPlusTree.html)

简单描述下插入流程和删除流程（先插入然后分裂，也可以先分裂再插入）：

**插入：**

1. 找到leaf，插入
2. 如果满足分裂阈值，分裂
3. 将新页的索引插入父节点，直到根节点

**分裂：**

1. 找到leaf，删除
2. 如果满足合并阈值：

    1. 可以和周围sibing page合并，合并
    2. 如果不行，向sibling节点借value
3. 如果发生合并，递归删除父节点对应项，直到根节点

### 1.2.3. 聚簇索引

如果索引的保存顺序和tuple在磁盘中的顺序一致，便叫聚簇索引

![](https://pic1.zhimg.com/80/v2-b98b37fc78c32ab42aafddd4166e6fc4_1440w.webp)

否则便不是，如下图

![](https://pic2.zhimg.com/80/v2-a541ddf4e7087845c2f8d7c909554781_1440w.webp)

其意义在于，如果是聚簇索引，在遍历的时候便可以按照聚簇索引的顺序遍历（比如index join）。但是不能按照非聚簇索引的顺序遍历，因为可能会导致很频繁的页换入换出。

### 1.2.4. 其它的优化

**Prefix Compression：** 可以把key相同的前缀合并

**Suffix Truncation：** 只需要存储足够区分的prefix就好，可以把无效的suffix截断

**Bulk Insert：** 构造B+ 树最快的方式，先将所有key排序，然后自下向上建树

**Pointer Swizzling：** 如果已知page在内存中的话，我们就不需要通过BPM拿到对应的page地址，再查询key的value（BPM需要锁，对BPM的操作也有开销）。而是可以在value中保存地址，然后直接访问对应的地址。

### 1.3. Trie 树和Radix树

Trie树的中文名叫前缀树，即用前缀做为节点的一种树。如下图所示：

![](https://pic4.zhimg.com/80/v2-cc77e079c84111d3c089e80c6cda3063_1440w.webp)

其优点是查询的时间为O(length(word))，和word的数量无关。

Radix树是Trie树的压缩版，把只有一个child路径合并。

### 1.4. Inverted Index

Inverted Index是一种文档到关键词的索引（这是它名字的起源）

[倒排索引为什么叫倒排索引？](https://www.zhihu.com/question/23202010/answer/23928943)

其面向的场景是模糊搜索，即那些文档中出现xxx关键词。

### 1.5. Skip List

Skip List感觉上像是一个弱化版的树，其相对来说会更节省空间，但是cache命中率和时间上都会更差。

考虑一个长度为n的链表

![](https://pic4.zhimg.com/80/v2-5ab2b3c48f0e85cd082ba119d6c4e5fb_1440w.webp)

其查询时间为O(n)，如果增加一条skip list呢：

![](https://pic2.zhimg.com/80/v2-102c7a7a10c020a26b8ed0ded64b8905_1440w.webp)

假设在查询时，我们在二级链表（下面的）的长度为L2，一级链表长度为L1，那么其查询时间为： $t = |L1| + \frac{|L2|}{|L1|}$（一级链表查询时间，二级链表的某一段查询时间）。

那么查询最快的时间，就是下面分段均匀的时候，即 $|L1|^2 = |L2| = n$ ，查询时间就是 $\sqrt{n}$

由此递推，当增加更多的跳表时，时间是$\sqrt{n}$，$\sqrt[3]{n}$, ... $logn$，最后就直接变成了一棵树

## 2. 并发数据结构

并发数据结构的核心是减少锁的粒度，提供更高的并发性。但是更多的锁本身也会带来更多的开销，这也需要进行trade off。

不同的锁也有不同的开销，这里如下文章有详细说明。

[https://pages.cs.wisc.edu/~remzi/OSTEP/threads-locks-usage.pdf](https://pages.cs.wisc.edu/~remzi/OSTEP/threads-locks-usage.pdf)

### 2.1. 并发hash表

hash 表的并发很简单，因为在访问或插入时，每次只需要更新一个slot。

需要进行trade off的是锁的粒度，是锁slot还是page

### 2.2. 并发B+Tree

### 2.2.1. LATCH CRABBING/COUPLING

其基础协议流程如下：

* latch parent
* 查询对应的child，然后读取以及latch child
* 判断child是否safe，如果safe释放所有的parent latch

  * 插入：当前节点不会分裂（< full）
  * 删除：当前节点不会合并/distribute（> half full）

除了latch child外，在distribute/merge的时候还需要latch sibling。

其上加锁流程很像螃蟹交错行走（先latch parent，再latch child，再release parent（safe）），所以被Andy很形象的称为螃蟹规则

### 2.2.2. 一些优化

**Better Latch Crabbing**：在访问B+tree时，root会成为hotspot，但是root被修改的可能性很低。所以可以每次先尝试对root加读锁，当确实需要修改root时，在重新访问，对root加写锁；或者可以update锁？

**Delay Parent Updates：** 上述在插入/删除的时候，直接进行split/merge。但是实际可以推迟update。即标记需要更新的node，在下次访问的时候再进行更新

**Horizontal Scan：** 从上至下访问时，加锁的顺序是严格确定的，所以不会发生死锁。但是水平scan时，就可能发生死锁了。此时如果一个进程如果加锁失败，可以直接自杀重试，以避免死锁（最简单实用的解决方案）。
