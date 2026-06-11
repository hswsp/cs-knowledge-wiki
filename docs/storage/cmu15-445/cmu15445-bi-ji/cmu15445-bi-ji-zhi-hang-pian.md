# CMU15-445笔记-执行篇

向上通过声明式的语言SQL暴露统一的接口，屏蔽底层的实现，我想这应该是关系型数据库的关键成功要素之一了。但是SQL语句在底层是如何进行执行的呢？这是由执行器来完成的。

执行器执行的是SQL语句编译后的AST树，其包含两个部分，AST各个operation的执行算法和AST整体的执行模型。

由于执行器面向的是AST，所以在执行之前应该会有一个编译过程，将SQL语句编译为对应的抽象语法树，可惜的是CMU15-445课程中并没有仔细介绍编译过程，可能这和数据库的关系不大？

## 1. 基础算法

面向磁盘的数据库的主要特征就是其数据不能全部装入内存，所以为了达到目的，只能采用分治的算法。在这种算法中，磁盘I/O的代价往往要远大于其在内存中的计算开销，所以下述算法是通过Disk I/O的次数来估算代价的。

附：我觉的分治和动规是算法中最核心的两个思想，它们的思想都是把大问题分解为小问题，然后通过解决小问题来进一步解决大问题。不同的是，分治算法中分解的小问题往往是独立的，而动归分解的小问题往往有递进的关系（一步步递进的解决大问题）

### 1.1. Sort

在SQL语句中，order by、建立索引、去重、aggregate等操作都需要排序，然而在数据不能全部装入内存时，排序就会变得比较复杂。其思想有点像归并排序，如下：

* 将数据分为多个块，对每个块排序（每个块都能装入内存）
* 将多个块合并

假设总的数据大小为 $N$ ，BufferPool的大小为 $B$ （单位为Page），具体的流程如下：

**pass 0：** 首先我们可以将数据分为 $\frac{N}{B}$ 个block，即每次读 $B$ 个page的数据进入内存排序。

**pass k：** 然后递归的每次合并 $B−1$ 个block数据（ $B−1$ 个page作为block的输入缓冲区，读每个block数据的第一个page，1个page作为输出缓冲区）。当 $B=2$ 时，执行流程如图所示：

![](https://pic3.zhimg.com/80/v2-395f1737d6f8e2b81c3bcf112b29209e\_1440w.webp)

这样pass的次数为： $1+ \log\_{B-1}{N/B}$ ，1是第一次排序，后面那项是叶子个数为 $N/B$ ，父节点的孩子数为 $B−1$ 的树的深度。

每次pass有一次读一次写，所以总的I/O次数为 $2∗#pass$ 。

上述排序方式是直接进行排序，但是如果有B+树索引，那么便可以利用B+树索引中的元素了，因为B+树是有序的。但这只限定聚簇索引，如果非聚簇索引可能会导致更多page I/O，最坏时可能每个record都要一次I/O。（参见索引篇）

### 1.2. Aggregation

Aggregation 包括sum/min/max/avg等操作，需要对一组tuple进行统计，所以在aggregations时需要将相同的tuple放到一起（group by）。其实现方案有两种，Sorting和Hash。

**Sorting：** 经过上述的排序后，相同的record肯定相邻。所以可以直接在上述排序后的数据中做对应的Aggregation操作

**Hash：** 首先将所有数据hash到不同的bucket（此时bucket需要能装入内存），这样相同的record肯定在一个bucket中。然后分别对不同bucket进行Aggregation操作即可

一般而言，hash aggregate会更快，因为其不需要在内存中排序。但是hash aggregate对数据分布有更高的要求，需要数据尽量均匀的分布在不同的bucket中。

### 1.3. Join

在数据库表的设计中，往往需要Normalization来避免信息冗余，但是在查询时就需要Join操作（空间换时间）。

Join的实现大致可以分为三种：Loop、Sort、Hash；下面是算法以及其时间的介绍。这里假设有两个表，如下图所示，注意当N < M的时候代价更小。

![](https://pic4.zhimg.com/80/v2-66577d2cf3a2817849a3adc118b5f99f\_1440w.webp)

下述算法的总结如下图所示，hash join总是更快。如果数据分布不均匀，有很多冲突，那么Sort-Merge Join会更快。

![](https://pic2.zhimg.com/80/v2-79a8d919c5c07067199643c0603f5109\_1440w.webp)

### 1.3.1. Nested Loop Join

**Stupid Nested Loop Join：** 最简单的操作就是暴力循环，此时针对表R1中d每个tuple r，都需要遍历一遍表S。此时Disk I/O的次数： $M+m\*N$

![](https://pic2.zhimg.com/80/v2-afaa4887001b7b99caed8b52b6690bb9\_1440w.webp)

**Block Nested Loop Join：** 针对每个 tuple都遍历一遍S的操作太蠢了，一个简单的优化就是把操作单位变为block（因为要一个page做输出缓冲，一个做R的输入缓冲，其它全做S的输入缓冲，即block的大小 $B−2$ ）的。此时代价为：$M+\frac{M}{B-2}\*N$

![](https://pic2.zhimg.com/80/v2-693f1336c6e9f4f3e339796d398c7695\_1440w.webp)

**Index Nested Loop Join：** 如果有Index，那么在循环时还可以利用Index查询，当然Index也需要是聚簇的。此时代价会变得很小，为 $M+m\*C$ ，C为操作索引的时间

![](https://pic2.zhimg.com/80/v2-86fa2935efdd5dffa65f62a2232a9265\_1440w.webp)

### 1.3.2. Sort-Merge Join

Sort Merge Join是利用排序后的table做join，其好处是排序后的table，相同的record都在一起，所以可以直接顺序读。

其算法为先给R、S排序，然后对R和S顺序遍历进行Join（有点像归并的过程）。

![](https://pic3.zhimg.com/80/v2-a4f70cfdec00c3d08eb1b0a1d058ad32\_1440w.webp)

此时代价分为三个部分：

* 排序： $2\*(M+\log\_{B-1}{M/B}) + 2\*(N+\log\_{B-1}{N/B})$
* Join合并： $M+N$

### 1.3.3. Hash Join

**1.5pass Hash Join：** 如果R能够全部装入内存，那么可以只对S hash分片

![](https://pic4.zhimg.com/80/v2-c2979142475c5776063d95955d8c9d47\_1440w.webp)

**Hash Join：** 将R和S都通过hash函数分片，分别装入内存进行Join

![](https://pic1.zhimg.com/80/v2-5da0d184e857c9b68bea2437e3cd49b8\_1440w.webp)

**Grace Join：** 如果Join后发现bucket还是无法装入内存，那么就需要进一步递归的划分

![](https://pic2.zhimg.com/80/v2-54bae25a5bb87276fbc5645084dac49d\_1440w.webp)

其时间也分为两个部分：

* 构建hash表：$2_M+2_N$ ，一次读一次写
* Join： $M+N$

为了优化Join流程，可以在为R建立hash表的时候，创建一个布隆过滤器。这样为S建立hash表的时候，可以先模糊查询是否存在，如果不存在就可以丢弃。

布隆过滤器包含一个bit map数组+多个hash函数。当插入key时，会将h1(key)、h2(key) ... 位置为1，查询时会查询h1(key)位 & h2(key)位 ..，当结果为1表示可能存在。其可能出现false positive但是不可能出现false negative。注意布隆过滤器不支持删除操作

### 1.4. Scan

上述的所有算法都需要去遍历整个表，那么该如何去遍历表呢？

最朴素的就是按照页的顺序一个个遍历，然后判断那么是否符合相应的谓词。

![](https://pic3.zhimg.com/80/v2-25327acf8e660d0b29d4008f79508986\_1440w.webp)

上述朴素的遍历方案可以有两个优化：

* **Zone Map：** 保存该页数据的一些统计信息，比如​min \max \avg \cnt等，以便更快的判断。但是这带来了额外的写的开销

![](https://pic2.zhimg.com/80/v2-a9f4091f5b57ca8d35c1373457bc2af1\_1440w.webp)

* **Late Materialization：** 在列存储时，可以在一开始只读用于筛选的attribute。最后才通过筛选后record ID（offset）来读整个tuple/投影的attribute，推迟实例化的过程

![](https://pic1.zhimg.com/80/v2-e5ca2d3f50fb2286d9c22affd77403c8\_1440w.webp)

如果某个数据有Index的话，那么可以通过Index做谓词判断筛选。注意对非聚簇索引需要重新排列record ID顺序，使得它们符合磁盘上的排列。

如果有多个Index，可以使用bitmap来做多个Index的谓词判断。同一个bit，and是&，or是|。

![](https://pic3.zhimg.com/80/v2-a73863f411e3aebd77f034c1a3ceada6\_1440w.webp)

## 2. 执行模型

**Iterator Model：** 每次处理一个tuple

![](https://pic4.zhimg.com/80/v2-988f52accc6858e016a4818ccf0b11a7\_1440w.webp)

**Materialization Model：** 每次处理全部

![](https://pic1.zhimg.com/80/v2-ad9942b08f3f97d93da84c67b767e5bc\_1440w.webp)

**Vectorized / Batch Model：** 每次处理一个block

![](https://pic4.zhimg.com/80/v2-a798fd1edc773c89a7147ff5dbee4d27\_1440w.webp)

## 3. 并行执行

### 3.1. Process Model

Process Model是DBMS响应多个用户请求的架构，其中执行用户任务的单位是worker。有三种process model：

**Process Per Worker：** 在此模型中，执行流程如下：

1. 用户的请求到达Dispatcher
2. Dispatcher分配一个进程执行对应task
3. 进程执行，并将执行结果返回给用户

它的调度依赖于OS调度器，并且多进程之前需要通过shared memory进行数据共享，单个worker的失败不会引起系统的崩溃。该模型诞生在线程还不那么完善的年代，现在应该被废弃了。

![](https://pic2.zhimg.com/80/v2-046ae9d92fae00937b03fa696cd6bae5\_1440w.webp)

**Process Pool：** 此模型和上面的模型的唯一区别是不再是由Dispatcher管理进程（创建/销毁），而是通过一个进程池，任务会挂配到进程池中的空闲进程中执行。而且数据的返回需要通过Dispatcher返回给用户。

![](https://pic3.zhimg.com/80/v2-641a68fc36a84c25e9ef18631d537ab6\_1440w.webp)

**Thread per DBMS Worker：** 由于线程的切换代价更低，而且可以共享堆栈，所以线程成了代替进程的好选择。此时，每个DBMS只包含一个进程，和许许多多线程。

而且DBMS可以甩掉OS的调度器，实现自己的调度（因为DBMS能掌握更多的执行任务的信息，可以规划更好的调度）。并且，由于线程间共享数据，Dispatcher就不是必要的了。

![](https://pic3.zhimg.com/80/v2-c51722d20c2c2bab40dcbe5a550e2016\_1440w.webp)

### 3.2. Execution Parallelism

### 3.2.1. Inter-Query

Inter-Query指的是并行的执行queries，它会提升整体表现，但是会影响事务的隔离性。这带来了数据库中第二复杂的模块：OCC协议。参见事务篇

### 3.2.2. Intra-Query

Intra-Query指的是并行的执行queries中的operations，其包含三种类型：

**Intra-operator Parallelism (Horizontal)：** 将数据拆分为多个子集，在子集中并行的执行operator，最后通过exchange operator合并数据或者重新对合并的结果分片。

![](https://pic4.zhimg.com/80/v2-d126765945026ad70cee260453a798eb\_1440w.webp)

Exchage Operator有三种类型

![](https://pic4.zhimg.com/80/v2-9aeb0332207d0140016eecc580ca4ef7\_1440w.webp)

**Inter-operator Parallelism (Vertical)：** 以流水线的方式执行operator。即operator不需要等前一步operator执行完成，而是形成一个流水线。其对于传统关系型语句并不友好，因为Join，Aggregate等操作是需要scan所有的数据后才能执行，所以这种执行模式更多的被用在Flink等流处理系统中。

![](https://pic4.zhimg.com/80/v2-0c1d9928bfcdbb1855576e57ca14fcdb\_1440w.webp)

**Bushy Parallelism：** 一种inter-operator parallelism的扩展版，将一个operator分解为多个operator并行执行，然后归并数据。

![](https://pic4.zhimg.com/80/v2-54a555317e9864b09d178b82264d5fa7\_1440w.webp)

### 3.3.3. I/O Parallelism

对于面向磁盘的数据库，有时候I/O才是最大的瓶颈。所以对I/O的并行化也是有必要的，有以下方法：

**Multiple Disks per Database：** 利用多块磁盘提升I/O速度，比如RAID

**Database Partitioning：** 将数据库分为多个segment，分开存储，这种方案在分布式数据库中更常见。具体切分的方案有两种：Vertical Partitioning（按列切分）和Horizontal Partitioning（按行切分）
