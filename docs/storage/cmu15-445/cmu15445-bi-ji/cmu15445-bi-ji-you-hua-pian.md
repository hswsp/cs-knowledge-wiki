# CMU15-445笔记-优化篇

由于SQL语句是以声明式的方式给出要求，所以在执行的过程中有很多的优化空间。对于查询计划的优化被Andy称为数据库中最难的部分，而在445课程中，对于具体的优化也只是介绍了大概，更具体可能需要在721中见到了。

## 1. Pipe Line

一个Query从发器到执行要经过如下阶段：

![](https://pic2.zhimg.com/80/v2-c251a1bbdcfbca12d39b43527329b125_1440w.webp)

其中Rewriter负责基于规则的优化，Optimizer负责基于代价的搜索。

## 2. Rule Based

关系代数有一些基本的运算率，经过这些运算率变换的关系代数表达式是等效的。而基于规则的优化就是利用这些运算率，生成最小代价的Logical Plan，在这一步只需要定义一些规则，然后匹配pattern利用规则。

### 2.1. 运算率

谓词内推： $\sigma(A \bowtie B) = \sigma A \bowtie \sigma B$

谓词分解： $\sigma _{p_1 \land p_2...} = \sigma_{p_1} \land \sigma _{p_2}...$

连接结合： $A \bowtie B \bowtie C = A \bowtie (B \bowtie C)$

连接交换： $A \bowtie B = B \bowtie A$

### 2.2. 优化规则

基于上述的一些运算率，一些静态的规则就可以被推到出来。这些静态的规则基本上对于任何数据集都是有效的，所以不需要关注一些代价信息。只需要按照固定的pattern去匹配，然后rewrite即可。

**投影下推：** 将投影规则下推到scan那一层，使得内存中保存的数据更少（相当于列裁剪？）

![](https://pic3.zhimg.com/80/v2-c866b82eb9ec2dedefcfa92441c7e422_1440w.webp)

**谓词分解：** 多个简单的谓词要比一个复杂的谓词更好优化

![](https://pic2.zhimg.com/80/v2-667f194a661b3cf582a1ae3e5f4d6949_1440w.webp)

**谓词下推：** 提前利用谓词筛选数据

![](https://pic2.zhimg.com/80/v2-817b1d2a949cc99f9ce02437a0e47719_1440w.webp)

将带 � 的笛卡尔积转化为内连接：

![](https://pic3.zhimg.com/80/v2-93768372e895a43a31664b27bcd431ae_1440w.webp)

**子查询优化：** 可以将子查询展开，也可以分解为两个查询

**表达式重写：** 重写那些运行中为常值的表达式。其中有些在表达式中可能就是常值，有些是出现逻辑上的错误（1 == 0），或者违反数据库上某种约束（primary key == nullptr）

## 3. Cost Based

Cost Based主要关注的是那些需要具体数据具体分析的优化（比如Join的顺序，scan的执行方法等）。对于Cost Based方法，其主要分为三个模块

* Cost Model：代价的评估策略
* Statistics：统计信息的维护
* Plan Enumeration：搜索最优的计划

### 3.1. Cost Model

假设数据是均匀分布的，且：

* N(R)：代表关系R的tuple数量
* V(A, R)：代表关系R中attribute A的value数量（不重复的），即A有多少种取值

这里以谓词举例，我们需要计算的是谓词P，筛选出的数据所占总数据的比例，也就是**selectivity(sel)。**

由于数据均匀分布，我们可以计算Attribute A种每个值所包含的tuple数为： $SC(A,R) = N(R) / V(A,R)$ 。

那么针对不同的谓词，其sel为

* **Equality：**$sel(A = constant) = SC(P)/V(A,R)$
* **Range Predicate：**$sel(A >=a) = (A_{max} -a)/(A_{max}-A_{min})$
* **Negation Query：**$sel(not \; P) = 1 - sel(P)$
* **Conjunction Query：**$sel(P1 \land P2) = sel(P1) * sel(P2)$ 。这里各个谓词需要独立
* **Disjunction Query：**$sel(P1 \vee P2) = sel(P1) + sel(P2) - sel(P1 \land P2)$ 。同上

### 3.2. Statistics

上述对数据的分布做出的假设是均匀分布，但实际的数据肯定为更加复杂。所以需要一些更细致的统计数据方式，但是在数据的准确性和维护性中，也需要做一个trace off。

**等宽直方图：** 如果数据整体上不是uniform，但是局部是，这样就可以局部的使用上述的规则

![](https://pic1.zhimg.com/80/v2-c93d90920beaaeb71fb1ee289175c94c_1440w.webp)

![](https://pic1.zhimg.com/80/v2-704920cdb13f30ffc9ddcf3963b3e280_1440w.webp)

**等深直方图：** 与等宽直方图不同的是，等深直方图是深度相似

![](https://pic4.zhimg.com/80/v2-d8286c8f6f8d535d91031a89642c29ab_1440w.webp)

![](https://pic4.zhimg.com/80/v2-501a43026404d52f6ee97908374af673_1440w.webp)

**Sketches：** 生成对应数据的概率分布，而不是直方图，精确度更高。有**Count-Min Sketch，** 近似的统计每个数据出现的频率，和**HyperLogLog，** 近似统计每个数据集的基数大小（V(A，R)）

**Sampling：** 可以采样一个子集，然后通过部分估计总体

### 3.3. Plan Enumeration

接下来便是对查询树的实际优化。查询计划可以分为两类：

* Single Relation：只针对单个关系的查询，多见于OLTP事务中
* Multiple Relation：针对多个关系的查询，多见于OLAP事务中

Single Relation查询往往比较简单，只需要使用简单的Rule based方法并选择最好的access method即可。

多余Multi-Relation查询会更复杂，尤其是涉及到连接顺序时。445介绍了System-R中的优化策略。

首先，为了减少搜索空间，join tree都是left-deep join tree，如下图所示

![](https://pic4.zhimg.com/80/v2-14d0832eea9b73356e227fd0c62896f3_1440w.webp)

然后开始搜索，具体的枚举空间为：

* 连接顺序
* 每个operator的执行算法（hash join / sort merge join / nested loop）
* 对每个table的访问策略，（使用哪些index，或seq scan等）

为了进一步的减少枚举代价，使用动态规划算法自底向上的来规划。

# 参考资料

[Autumn-Cat的知乎笔记](https://www.zhihu.com/people/xie-jian-49-72/posts)

‍
