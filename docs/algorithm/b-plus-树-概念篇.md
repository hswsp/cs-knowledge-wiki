---
title: "B+树定义"
description: "为了实现动态多层索引，通常采用 B-树 和 B+树。但是，用于索引的 B-树 存在缺陷，它的所有中间结点均存储的是数据指针（指向包含键值的磁盘文件块的指针），与该键值一起存储在B-树的结点中。这就会导致可以存储在 B-树中的结点数极大地减少"
---

为了实现动态多层索引，通常采用 B-树 和 B+树。但是，用于索引的 B-树 存在缺陷，它的所有中间结点均存储的是数据指针（指向包含键值的磁盘文件块的指针），与该键值一起存储在B-树的结点中。这就会导致可以存储在 B-树中的结点数极大地减少了，从而增加 B-树的层数，进而增加了记录的搜索时间。

B+树通过仅在树的叶子结点中存储数据指针而消除了上述缺陷。因此，B+树的叶结点的结构与 B-树的内部结点的结构完全不同。在这里应该注意，由于数据指针仅存在于叶子结点中，因此叶子结点必须将所有键值及其对应的数据指针存储到磁盘文件块以便访问。此外，叶子结点被链接磁盘的某个位置，以提供对记录的有序访问。因此，叶子结点形成第一级索引，而内部结点形成多层索引的其他层。叶子结点的某些关键字 key 也出现在内部结点中，充当控制搜索记录的媒介。

与 B-树不同，B+树中的结点存在两个阶（order）：对于阶 “a” 和 “ b”，一个用于内部结点，另一个用于外部（或叶）结点。

# B+树定义
一棵 ![image](https://cdn.nlark.com/yuque/__latex/4760e2f007e23d820825ba241c47ce3b.svg) 阶的 B+ 树可以这样定义：

1. 每个节点最多可以有 ![image](https://cdn.nlark.com/yuque/__latex/4760e2f007e23d820825ba241c47ce3b.svg) 个元素；
2. 除了根节点外，**每个节点最少有 **![image](https://cdn.nlark.com/yuque/__latex/e98b240fc76421a4575d42cecf5e9ff9.svg)**个元素**；
3. 如果根节点不是叶节点，那么它最少有 2 个孩子节点；
4. **所有的叶子节点都在同一层**；
5. 一个有 k 个孩子节点的非叶子节点有 (k-1) 个元素，按升序排列；
6. 某个元素的左子树中的元素都比它小，右子树的元素都大于或等于它；
7. 非叶子节点只存放关键字和指向下一个孩子节点的索引，记录只存放在叶子节点中；
8. 相邻的叶子节点之间用指针相连。

# 阶为 a 的 B+树内部结点的结构如下：
![](https://mmbiz.qpic.cn/mmbiz_png/rSmDLkNsngQPWn6GtIV7k8d1L3s5Y3swmkwZEHV84NIBy0icptuVcRBGukp4LU4rxib6P51gwgXQpPibwQ7nzdEzw/640?wx_fmt=png&wxfrom=5&wx_lazy=1&wx_co=1)

1. 对于每一个形如：![image](https://cdn.nlark.com/yuque/__latex/ea573810616830699b02dcf9e10ce755.svg)的内部结点，其中![image](https://cdn.nlark.com/yuque/__latex/a3b0b0f4436cd36334e383d8b38db9c7.svg) ，每一个![image](https://cdn.nlark.com/yuque/__latex/282ff0c1015821da5017765ed7c1e43c.svg)表示指向子树根结点的指针，![image](https://cdn.nlark.com/yuque/__latex/19e140f0b2867cc1eb652eb0dada41ff.svg)表示关键字值 
2. 对于每一个内部结点中的关键字值均满足：![image](https://cdn.nlark.com/yuque/__latex/411526ec80df9ed8e4bdd42df7e92b6b.svg).(内部结点的关键字由小到大有序排列)
3. 对于一个位于 ![image](https://cdn.nlark.com/yuque/__latex/282ff0c1015821da5017765ed7c1e43c.svg)所指向的子树中的结点![image](https://cdn.nlark.com/yuque/__latex/94e79ad0c1aabeafef9e2fc4af6adf66.svg)而言，满足：  
当![image](https://cdn.nlark.com/yuque/__latex/4dd40c1d51461590a8ef7ac1daf854c5.svg) 时，均有![image](https://cdn.nlark.com/yuque/__latex/adad8ab15ff590bbf88ab3eb712c0e9a.svg) .  
当 ![image](https://cdn.nlark.com/yuque/__latex/c7995622bd0cd86425ba66c5e07aa1cb.svg)时，![image](https://cdn.nlark.com/yuque/__latex/43dd2ce88f7c3eea4544bd1ab2b41d01.svg).  
当 ![image](https://cdn.nlark.com/yuque/__latex/f85f46af0ec51034cda946fad252b1d0.svg)时，![image](https://cdn.nlark.com/yuque/__latex/bf57a8e55fcfe342451203e6aca8fa26.svg). 
4. 每一个内部结点**最多有 **`**a**`** 个指向子树的指针**，即 `c` 最大取 `a` . 
5. 根结点至少包含两个指向子树的结点指针，即对于根结点而言![image](https://cdn.nlark.com/yuque/__latex/bc22b4c1498f4424367496101edf5776.svg) ; **除了根之外的每个结点都包含最少**![image](https://cdn.nlark.com/yuque/__latex/7fcf9c7384d3180a9f126017a996085a.svg)**个指向子树的指针。** 
6. 如果任意一个内部结点包含 `c` 个指向孩子结点的指针且![image](https://cdn.nlark.com/yuque/__latex/a3b0b0f4436cd36334e383d8b38db9c7.svg)，则该结点包含![image](https://cdn.nlark.com/yuque/__latex/1b78c911205c44a71244c3a42def2db6.svg)的关键字。 

# 阶为 b 的 B+树叶子结点的结构：
![](https://mmbiz.qpic.cn/mmbiz_png/rSmDLkNsngQPWn6GtIV7k8d1L3s5Y3swSGHzEEdkFn5s6ZIxWxibhufQfRVLojh04dGpBL7k4FTNssicc9mZr1Rg/640?wx_fmt=png&wxfrom=5&wx_lazy=1&wx_co=1)

1. 对于每一个形如：![image](https://cdn.nlark.com/yuque/__latex/f416fd3672845ff9d7f5caedc845acec.svg)的叶子结点，其中![image](https://cdn.nlark.com/yuque/__latex/9bce3affe5fbd49f910a1b32c1ac9c7b.svg) ，![image](https://cdn.nlark.com/yuque/__latex/f47ef0f303ba9d9f4f2ac96f6df77277.svg)是一个数据指针（指向磁盘上的值等于![image](https://cdn.nlark.com/yuque/__latex/19e140f0b2867cc1eb652eb0dada41ff.svg)的真实记录的指针，或者包含记录![image](https://cdn.nlark.com/yuque/__latex/19e140f0b2867cc1eb652eb0dada41ff.svg) 的磁盘文件块），![image](https://cdn.nlark.com/yuque/__latex/19e140f0b2867cc1eb652eb0dada41ff.svg)是一个关键字，![image](https://cdn.nlark.com/yuque/__latex/9cf1961fe19b5a9d00ed1e9e6c78a028.svg)表示 B+树中指向下一个叶子结点的指针。
2. 对任意一个叶子结点均有：![image](https://cdn.nlark.com/yuque/__latex/7a2d92df2a584979e7314eed61f63972.svg) ，![image](https://cdn.nlark.com/yuque/__latex/3558e8779d4da99901bab08e37d84aff.svg).
3. 每一个叶子结点至少包含![image](https://cdn.nlark.com/yuque/__latex/7fcf9c7384d3180a9f126017a996085a.svg) 个值.
4. 所有的叶子结点在同一层。

使用 ![image](https://cdn.nlark.com/yuque/__latex/9cf1961fe19b5a9d00ed1e9e6c78a028.svg)指针可以遍历所有的叶子结点，就和单链表一样，从而实现对磁盘上记录的有序访问。

下图为一颗完整的 B+树的结构示例：

![](https://mmbiz.qpic.cn/mmbiz_png/rSmDLkNsngQPWn6GtIV7k8d1L3s5Y3swN2DM34ZiaCrIiaqOe2clo2liasWiaUvibWXmYyRibuegnVHiaaHsLEXehVyqQ/640?wx_fmt=png&wxfrom=5&wx_lazy=1&wx_co=1)

# B+树的优点
同为![image](https://cdn.nlark.com/yuque/__latex/67df0f404d0960fadcc99f6258733f22.svg)层的 B-树和 B+树，B+树可以存储更多的结点元素，更加 ”矮胖“。这也是 B+树最大的优势所在，极大地改善了 B-树的查找效率。对于同样多的记录，B+树的高度会更矮，并且![image](https://cdn.nlark.com/yuque/__latex/9cf1961fe19b5a9d00ed1e9e6c78a028.svg)指针的出现可以帮助 B+树快速访问磁盘记录且效率非常高。总之，就是 B+树比 B-树更加好，B+树的磁盘 I / O 会更少，相比于 B-树的中序遍历，B+树只需要像遍历单链表一样扫描一遍叶子结点。

