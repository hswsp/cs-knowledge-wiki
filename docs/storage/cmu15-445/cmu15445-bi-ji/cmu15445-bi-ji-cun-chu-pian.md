# CMU15-445笔记-存储篇

在关系代数中，一个数据集合可以被组织为table、tuple和attribute，这三个层级自上而下互相包含。而这只是逻辑上的划分，如何在真正磁盘和内存中有效的组织这些数据，这便是本篇文章所要介绍的主要内容。

## 1. Disk

### 1.1. File layout

Table可以看为是tuple的集合，在磁盘中与之对应的单位是文件。一个文件中会保存多个page，而page中会存储多个tuple。

page的组织方式其实和文件系统中data block组织形式非常相似，主要分为两种：

* Page directory：设置一个page作为directory，指向那些page的地址
* Linked list：将page组织为一个链表，每次查询都需要seq scan

### 1.2. Page layout

在page中包含两部分内容：

* header：保存一些元信息，比如zone map、checksum、dbms version等
* data：保存的就是实际的tuple

而在data区中，保存的即tuple，或者将其称为record。tuple有两种组织形式

### 1.2.1. Tuple Structured

在Tuple Structured中，data中保存的就是一个个tuple。为了更方便的对tuple的管理（比如删除、插入等操作），在data的开始处增加一个中间层，即slot array，如下图所示：

![](https://pic2.zhimg.com/80/v2-4c79f634777c9a8d062ed9f991504945_1440w.webp)

这样在删除压缩数据时，通过保证slot array的slot位置不变（slot内保存的指针可以变），来向上屏蔽下面的数据更改细节。（计算机系统中的大多数问题都可以通过加一个中间层解决，除了太多的中间层 ）

### 1.2.2. Log Structured

Log Structured 数据并不是保存完整的tuple，而是每次对tuple修改的log。

![](https://pic3.zhimg.com/80/v2-5fb4a9f1ab0fd9dbee89570aa9f8a796_1440w.webp)

这对写任务而言很方便，只需要append 一个log即可。但是读任务需要重新play整个修改的过程，为了加快读取的速度，可以预先的简历每个tuple id上的建立索引，使得读任务可以更快的找到对应的修改过程。

log structured方法还有一个缺点，就是日志文件的增长速度很快，为了节省磁盘空间以及log数量，可以对log文件进行压缩。

![](https://pic1.zhimg.com/80/v2-0c85ee5b5ea088b5e59d46912a0d1c84_1440w.webp)

一个更快的压缩方法就是层次压缩，利用分治的方式对数据进行压缩

### 1.2.3. Tuple layout

Tuple和Page的格式一样，都有一个head和data。

head 中保存的是：

* bitmap，标识那些数据为null
* MVCC中的时间戳等信息

而data中保存的就是二进制数据，通过table的schema来解释。其中核心问题是我们如何去表示这些不同数据类型的attribute。

常见的类型可以利用语言中的基本类型，比如int/float等。值得注意的有两种特殊类型：

1. 任意精度大小的数字，比如无限大的整数，或者无限精度的浮点数。这可能需要变长数组或分数来保存
2. blob：可以通过保存指向blob页的指针

### 1.3. Catalog

每个表都会有一些元信息，比如其schema，或者其索引信息、起始页等。这些信息都会保存在catalog中。

值得注意的是，catalog所在的页是硬编码的，因为不可能再来个catalog记录catalog的信息。

### 1.4. Storage model

在数据库中，tuple的存储方式分为列存储Decomposition Storage Model (DSM)和行存储N-Ary Storage Model (NSM)。

行存储是将同一行的数据保存在一起，其优点是修改快，缺点是当遇到OLAP事务时，需要读所有的attribute（OLAP任务可能只需要一个attribute）

列存储是将同一列的数据保存在一起，其优点是可以得到更高的压缩效率以及对OLAP事务友好，但是插入、删除等操作复杂。

## 2. Memory（Buffer Pool Management）

面向磁盘的数据库有一个重要的特性就是其数据不能全部装入内存。

所以只能将将数据部分装入内存，并向上提供全部装入内存的幻象（有点虚拟内存的感觉）。而这就是通过buffer pool management来提供的。

### 2.1. BPM的总体架构

与虚拟内存的设计思想一致，BPM核心的便是将内存中的地址映射到磁盘中的地址（再次通过增加一个中间层解决了问题），向上提供所有数据都装入内存的幻象，数据单位为页。为了区分内存中的页和磁盘中的页，我们做一个定义：

* frame：buffer中的一页
* page：磁盘中的一页

BPM结构如下图所示：

![](https://pic3.zhimg.com/80/v2-52110559a39a24f66d4c762b42891e8a_1440w.webp)

其中包含两个数据结构：

* Buffer Pool：里面包含了一些frame，而这些frame中保存的就是对应page的内容
* Page Table：保存的是 page id -> frame id的映射。

实际运行的流程如下：

1. 上层任务向BPM请求一个page
2. BPM查询对应的page是否在buffer pool中，即Page Table中包不包含page id

    1. 如果包含，那么返回对应的frame地址，并将frame 的pin count加1（代表这个frame的引用多了一次）
    2. 如果不包含，BPM需要将Page读如Buffer Pool中的frame中，再返回对应的frame地址（这其中可能包含置换）
3. 结束

### 2.2. 置换算法

置换算法是计算机系统中常见的议题。例如LRU/ CLOCK / LRU-k等置换算法也可以用在BPM中。

但对于数据库而言，可能有一些更多的考量，比如

* 一些页会更频繁的访问，比如B+树的根节点。这类页或许应该被设置为更高的优先级，更晚的置换
* 事务在执行的过程中，会有局部性。所以是否需要单独的考虑事务的query
* 脏页置换出去的代价明显要更高（需要写入磁盘）

### 2.3. 一些其它的优化

磁盘I/O是影响面向磁盘数据库速度的最大因素，所以对BPM的优化是很重要的。445中提到了如下的优化策略

### 2.3.1 Multiple Buffer Pools

使用多个Buffer Pool的好处有两个：

* 不同的任务的需要是不同的，所以可能需要针对性的设置不同的置换策略
* 提升并发能力，因为不同的buffer pool可以并发的访问

既然有了多个buffer pool，那么如何将数据分片呢？有两种方案：

* object ID：提交在record ID（tuple 的唯一ID）中硬编码一个标识符
* hash：通过hash record ID来分片

### 2.3.2 Pre-Fetching

在遍历或者index查询的时候，我们往往知道下一步需要那些page。所以在事务执行上一步的时候，BPM就可以预先读取下一步需要的page。就像个流水线

### 2.3.3 Scan Sharing

多个事务读取的数据可能有公共的部分。那么便可以利用这种公共部分，来避免重复的读取。

### 2.3.4 Buffer Pool Bypass

有些任务比如遍历整个表，可能只被执行一次。这些数据不会再被需要，所以不需要污染buffer pool，可以直接本地跑一个小cache即可
