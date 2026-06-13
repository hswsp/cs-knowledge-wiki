---
title: "B+树定义"
description: "为了实现动态多层索引，通常采用 B-树 和 B+树。但是，用于索引的 B-树 存在缺陷，它的所有中间结点均存储的是数据指针（指向包含键值的磁盘文件块的指针），与该键值一起存储在B-树的结点中。这就会导致可以存储在 B-树中的结点数极大地减少"
---

为了实现动态多层索引，通常采用 B-树 和 B+树。但是，用于索引的 B-树 存在缺陷，它的所有中间结点均存储的是数据指针（指向包含键值的磁盘文件块的指针），与该键值一起存储在B-树的结点中。这就会导致可以存储在 B-树中的结点数极大地减少了，从而增加 B-树的层数，进而增加了记录的搜索时间。

B+树通过仅在树的叶子结点中存储数据指针而消除了上述缺陷。因此，B+树的叶结点的结构与 B-树的内部结点的结构完全不同。在这里应该注意，由于数据指针仅存在于叶子结点中，因此叶子结点必须将所有键值及其对应的数据指针存储到磁盘文件块以便访问。此外，叶子结点被链接磁盘的某个位置，以提供对记录的有序访问。因此，叶子结点形成第一级索引，而内部结点形成多层索引的其他层。叶子结点的某些关键字 key 也出现在内部结点中，充当控制搜索记录的媒介。

与 B-树不同，B+树中的结点存在两个阶（order）：对于阶 “a” 和 “ b”，一个用于内部结点，另一个用于外部（或叶）结点。

# B+树定义
一棵 ![image](https://images.spumn.eu.cc/blog/cf15c9a8141aadb9.svg) 阶的 B+ 树可以这样定义：

1. 每个节点最多可以有 ![image](https://images.spumn.eu.cc/blog/cf15c9a8141aadb9.svg) 个元素；
2. 除了根节点外，**每个节点最少有 **![image](https://images.spumn.eu.cc/blog/7bc58ddefd39501c.svg)**个元素**；
3. 如果根节点不是叶节点，那么它最少有 2 个孩子节点；
4. **所有的叶子节点都在同一层**；
5. 一个有 k 个孩子节点的非叶子节点有 (k-1) 个元素，按升序排列；
6. 某个元素的左子树中的元素都比它小，右子树的元素都大于或等于它；
7. 非叶子节点只存放关键字和指向下一个孩子节点的索引，记录只存放在叶子节点中；
8. 相邻的叶子节点之间用指针相连。

# 阶为 a 的 B+树内部结点的结构如下：
![](https://images.spumn.eu.cc/blog/46e238ef5fe238ce.png)

1. 对于每一个形如：![image](https://images.spumn.eu.cc/blog/c7f6f698593ce974.svg)的内部结点，其中![image](https://images.spumn.eu.cc/blog/6dc8f33ea30069ae.svg) ，每一个![image](https://images.spumn.eu.cc/blog/8257c553b3050091.svg)表示指向子树根结点的指针，![image](https://images.spumn.eu.cc/blog/1a5403ea16092320.svg)表示关键字值 
2. 对于每一个内部结点中的关键字值均满足：![image](https://images.spumn.eu.cc/blog/eaad34ad10256761.svg).(内部结点的关键字由小到大有序排列)
3. 对于一个位于 ![image](https://images.spumn.eu.cc/blog/8257c553b3050091.svg)所指向的子树中的结点![image](https://images.spumn.eu.cc/blog/cf4ee215637f8e67.svg)而言，满足：  
当![image](https://images.spumn.eu.cc/blog/46a4125896fc0700.svg) 时，均有![image](https://images.spumn.eu.cc/blog/5c3585ca6b6a7dff.svg) .  
当 ![image](https://images.spumn.eu.cc/blog/1fcca7841a71d1c6.svg)时，![image](https://images.spumn.eu.cc/blog/ba33ac0fd959e29e.svg).  
当 ![image](https://images.spumn.eu.cc/blog/591d7f7a687ce6be.svg)时，![image](https://images.spumn.eu.cc/blog/1a8df56ddd753744.svg). 
4. 每一个内部结点**最多有 **`**a**`** 个指向子树的指针**，即 `c` 最大取 `a` . 
5. 根结点至少包含两个指向子树的结点指针，即对于根结点而言![image](https://images.spumn.eu.cc/blog/8d30544cbe36dfbb.svg) ; **除了根之外的每个结点都包含最少**![image](https://images.spumn.eu.cc/blog/ad04cd7f82874c30.svg)**个指向子树的指针。** 
6. 如果任意一个内部结点包含 `c` 个指向孩子结点的指针且![image](https://images.spumn.eu.cc/blog/6dc8f33ea30069ae.svg)，则该结点包含![image](https://images.spumn.eu.cc/blog/af15b660b027ea65.svg)的关键字。 

# 阶为 b 的 B+树叶子结点的结构：
![](https://images.spumn.eu.cc/blog/0608d3be76ee86fe.png)

1. 对于每一个形如：![image](https://images.spumn.eu.cc/blog/8cdcd10f5140a856.svg)的叶子结点，其中![image](https://images.spumn.eu.cc/blog/1d04aff7459f632b.svg) ，![image](https://images.spumn.eu.cc/blog/c7cdb8324c76bd57.svg)是一个数据指针（指向磁盘上的值等于![image](https://images.spumn.eu.cc/blog/1a5403ea16092320.svg)的真实记录的指针，或者包含记录![image](https://images.spumn.eu.cc/blog/1a5403ea16092320.svg) 的磁盘文件块），![image](https://images.spumn.eu.cc/blog/1a5403ea16092320.svg)是一个关键字，![image](https://images.spumn.eu.cc/blog/fdb9b74a9e568bc6.svg)表示 B+树中指向下一个叶子结点的指针。
2. 对任意一个叶子结点均有：![image](https://images.spumn.eu.cc/blog/eaad34ad10256761.svg) ，![image](https://images.spumn.eu.cc/blog/1d04aff7459f632b.svg).
3. 每一个叶子结点至少包含![image](https://images.spumn.eu.cc/blog/ad04cd7f82874c30.svg) 个值.
4. 所有的叶子结点在同一层。

使用 ![image](https://images.spumn.eu.cc/blog/fdb9b74a9e568bc6.svg)指针可以遍历所有的叶子结点，就和单链表一样，从而实现对磁盘上记录的有序访问。

下图为一颗完整的 B+树的结构示例：

![](https://images.spumn.eu.cc/blog/f2a47be98d3761d5.png)

# B+树的优点
同为![image](https://images.spumn.eu.cc/blog/06beba9e96e5239f.svg)层的 B-树和 B+树，B+树可以存储更多的结点元素，更加 ”矮胖“。这也是 B+树最大的优势所在，极大地改善了 B-树的查找效率。对于同样多的记录，B+树的高度会更矮，并且![image](https://images.spumn.eu.cc/blog/fdb9b74a9e568bc6.svg)指针的出现可以帮助 B+树快速访问磁盘记录且效率非常高。总之，就是 B+树比 B-树更加好，B+树的磁盘 I / O 会更少，相比于 B-树的中序遍历，B+树只需要像遍历单链表一样扫描一遍叶子结点。

