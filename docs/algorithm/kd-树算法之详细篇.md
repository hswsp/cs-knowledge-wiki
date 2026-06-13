---
title: "kd 树的结构"
description: "kd树是一个二叉树结构，它的每一个节点记载了[特征坐标，切分轴，指向左枝的指针，指向右枝的指针]。"
---

# kd 树的结构
kd树是一个二叉树结构，它的每一个节点记载了**[特征坐标，切分轴，指向左枝的指针，指向右枝的指针]**。

其中，特征坐标是线性空间![image](https://images.spumn.eu.cc/blog/2c6cc59f51f2a9d6.svg)中的一个点![image](https://images.spumn.eu.cc/blog/407b77ccde6f51a9.svg)。

切分轴由一个整数![image](https://images.spumn.eu.cc/blog/1d6a047e4813ca61.svg)表示，这里![image](https://images.spumn.eu.cc/blog/c610daed3650f7b1.svg)，是我们在 n 维空间中沿第 r 维进行一次分割。

节点的左枝和右枝分别都是 kd 树，并且满足：如果 y 是左枝的一个特征坐标，那么![image](https://images.spumn.eu.cc/blog/a46daa41cf13788b.svg)并且如果 z 是右枝的一个特征坐标，那么![image](https://images.spumn.eu.cc/blog/676530793e018adf.svg)。

给定一个数据样本集 ![image](https://images.spumn.eu.cc/blog/f0f808bee319c616.svg)和切分轴 r , 以下递归算法将构建一个基于该数据集的 kd 树，每一次循环制作一个节点：

+ 如果 ![image](https://images.spumn.eu.cc/blog/94a2e3ac8df222a2.svg)，记录 S 中唯一的一个点为当前节点的特征数据，并且不设左枝和右枝。（![image](https://images.spumn.eu.cc/blog/8ec6915405e6a766.svg) 指集合 S 中元素的数量）
+ 如果 ![image](https://images.spumn.eu.cc/blog/a95a6cf374b523b8.svg)：
    - 将 ![image](https://images.spumn.eu.cc/blog/fb82e459529ffd88.svg) 内所有点按照第 r 个坐标的大小进行排序；
    - 选出该排列后的中位元素（如果一共有偶数个元素，则选择中位左边或右边的元素，左或右并无影响），作为当前节点的特征坐标，并且记录切分轴 r；
    - 将 ![image](https://images.spumn.eu.cc/blog/81ec3bc17435eab6.svg) 设为在 S 中所有排列在中位元素之前的元素； ![image](https://images.spumn.eu.cc/blog/3975fe05713975b7.svg) 设为在 S 中所有排列在中位元素后的元素；
    - 当前节点的左枝设为以 ![image](https://images.spumn.eu.cc/blog/81ec3bc17435eab6.svg) 为数据集并且 r 为切分轴制作出的 kd 树；当前节点的右枝设为以 ![image](https://images.spumn.eu.cc/blog/3975fe05713975b7.svg) 为数据集并且 r 为切分轴制作出的 kd 树。再设 ![image](https://images.spumn.eu.cc/blog/dc037a376cf5a620.svg)。（这里，我们想轮流沿着每一个维度进行分割；![image](https://images.spumn.eu.cc/blog/26f3c467b6d1bdd4.svg) 是因为一共有 n 个维度，在沿着最后一个维度进行分割之后再重新回到第一个维度。）

# 构造 kd 树的例子
上面抽象的定义和算法确实是很不好理解，举一个例子会清楚很多。首先随机在 ![image](https://images.spumn.eu.cc/blog/9924d806d96f7226.svg) 中随机生成 13 个点作为我们的数据集。起始的切分轴![image](https://images.spumn.eu.cc/blog/ce759ec5ed678b40.svg)；这里 ![image](https://images.spumn.eu.cc/blog/ce759ec5ed678b40.svg) 对应 ![image](https://images.spumn.eu.cc/blog/91f4eba77097809c.svg) 轴，而![image](https://images.spumn.eu.cc/blog/a80e7555e191026d.svg) 对应 y 轴。

![](https://images.spumn.eu.cc/blog/21c0be7632db2db8.png)

首先先沿 x 坐标进行切分，我们选出 x 坐标的中位点，获取最根部节点的坐标

![](https://images.spumn.eu.cc/blog/5a26d434ca0fa16b.png)

并且按照该点的x坐标将空间进行切分，所有 x 坐标小于 6.27 的数据用于构建左枝，x坐标大于 6.27 的点用于构建右枝。

![](https://images.spumn.eu.cc/blog/14b82d3abf4cb839.png)

在下一步中 ![image](https://images.spumn.eu.cc/blog/2a958127e493d0db.svg) 对应 y 轴，左右两边再按照 y 轴的排序进行切分，中位点记载于左右枝的节点。得到下面的树，左边的 x 是指这该层的节点都是沿 x 轴进行分割的。

![](https://images.spumn.eu.cc/blog/f7b47ad42262347c.png)

空间的切分如下

![](https://images.spumn.eu.cc/blog/bffd82cd5af0787e.png)

下一步中 ![image](https://images.spumn.eu.cc/blog/37d2d29cfc7af575.svg)，对应 x 轴，所以下面再按照 x 坐标进行排序和切分，有

![](https://images.spumn.eu.cc/blog/d146fde710ab266b.png)

![](https://images.spumn.eu.cc/blog/637f2446fc9f8ca3.png)

**最后每一部分都只剩一个点**，将他们记在最底部的节点中。因为不再有未被记录的点，所以不再进行切分。

![](https://images.spumn.eu.cc/blog/45fda9b7eea7a26d.png)

![](https://images.spumn.eu.cc/blog/bfd3e7f0d056f230.png)

就此完成了 kd 树的构造。

# kd 树上的 kNN 算法
给定一个构建于一个样本集的 kd 树，下面的算法可以寻找距离某个点 p 最近的 k 个样本。

1. 设 L 为一个有 k 个空位的列表，用于保存已搜寻到的最近点。
2. 根据 p 的坐标值和每个节点的切分向下搜索（也就是说，如果树的节点是照 ![image](https://images.spumn.eu.cc/blog/a22ce4326a00b9b3.svg) 进行切分，并且 p 的 r 坐标小于 a，则向左枝进行搜索；反之则走右枝）。
3. 当达到一个底部节点时，将其标记为访问过。如果 L 里不足 k 个点，则将当前节点的特征坐标加入 L ；如果 L 不为空并且当前节点的特征与 p 的距离**小于 L 里最长**的距离，则用当前特征替换掉 L 中离 p 最远的点。
4. 如果当前节点不是整棵树最顶端节点，执行 (a)；反之，输出 L，算法完成。
    1. 向上爬一个节点。如果当前（向上爬之后的）节点未曾被访问过，将其标记为被访问过，<u>然后执行 (b) 和 (c)；</u>如果当前节点被访问过，再次执行 (a)。
    2. 如果此时 L 里不足 k 个点，则将节点特征加入 L；如果 L 中已满 k 个点，且当前节点与 p 的距离小于 L 里最长的距离，则用节点特征替换掉 L 中离最远的点。
    3. **计算 p 和当前节点切分线的距离。如果该距离大于等于 L 中距离 p 最远的距离并且 L 中已有 k 个点，则在切分线另一边不会有更近的点**，执行 (4)；如果该距离小于 L 中最远的距离或者 L 中不足 k 个点，则切分线另一边可能有更近的点，因此在当前节点的另一个枝从 (2) 开始执行。

# 应用例子
设我们想查询的点为 ![image](https://images.spumn.eu.cc/blog/8ed5b062d858ad79.svg)，设距离函数是普通的 ![image](https://images.spumn.eu.cc/blog/1ce5735c4e709fa5.svg) 距离，我们想找距离问题点最近的 ![image](https://images.spumn.eu.cc/blog/e6c4949d069e1183.svg) 个点。如下：

![](https://images.spumn.eu.cc/blog/fe14b387e91800dd.png)

首先执行 (2)，我们按照切分找到最底部节点。首先，我们在顶部开始  


![](https://images.spumn.eu.cc/blog/1ff5f7a9372ea178.png)

和这个节点的 x 轴比较一下，

![](https://images.spumn.eu.cc/blog/df80d0afb3ab9fbe.png)

p 的 x 轴更小。因此我们向左枝进行搜索：

![](https://images.spumn.eu.cc/blog/e867cc58d537cf83.png)

这次对比 y 轴，

![](https://images.spumn.eu.cc/blog/b69e597bac230457.png)

p 的 y 值更小，因此向左枝进行搜索：

![](https://images.spumn.eu.cc/blog/7cde5152aa7e9f87.png)

这个节点只有一个子枝，就不需要对比了。由此找到了最底部的节点 (−4.6,−10.55)。  


![](https://images.spumn.eu.cc/blog/17ead339210e0735.png)

在二维图上是  


![](https://images.spumn.eu.cc/blog/332005a86edd0912.png)

此时我们执行 (3)。将当前结点标记为访问过，并记录下 ![image](https://images.spumn.eu.cc/blog/d0de2a0a01031c8c.svg)。啊，访问过的节点就在二叉树上显示为被划掉的好了。

然后执行 (4)，嗯，不是最顶端节点。好，执行 (a)，我爬。上面的是 (−6.88,−5.4)。

![](https://images.spumn.eu.cc/blog/059969f3ac618d20.png)

![](https://images.spumn.eu.cc/blog/a5dada803bc13eff.png)

执行 (b)，因为我们记录下的点只有一个，小于 k=3，所以也将当前节点记录下，有 ![image](https://images.spumn.eu.cc/blog/f89ccbac4c1cf22e.svg).再执行 (c)，因为当前节点的左枝是空的，所以直接跳过，回到步骤 (4)。(4) 看了一眼，好，不是顶部，交给你了，(a)。于是乎 (a) 又往上爬了一节。  


![](https://images.spumn.eu.cc/blog/d038681314c608a8.png)

![](https://images.spumn.eu.cc/blog/fd35973b79018b52.png)

(b) 说，由于还是不够三个点，于是将当前点也记录下，有 ![image](https://images.spumn.eu.cc/blog/fc1c10d86c465cd9.svg)。当然，当前结点变为被访问过的。

(c) 又发现，当前节点有其他的分枝，并且经计算得出 p 点和 L 中的三个点的距离分别是 `6.62`,`5.89`,`3.10`，但是 p 和当前节点的分割线的距离只有 2.14，小于与 L 的最大距离：

![](https://images.spumn.eu.cc/blog/007c7a2687629f25.png)

因此，在分割线的另一端可能有更近的点。于是我们在当前结点的另一个分枝从头执行 (2)。好，我们在红线这里：

![](https://images.spumn.eu.cc/blog/64afca8e2d0e422c.png)

要用 p 和这个节点比较 x 坐标:

![](https://images.spumn.eu.cc/blog/b8f60ccbc2a2935a.png)

p 的 x 坐标更大，因此探索右枝 (1.75,12.26)，并且发现右枝已经是最底部节点，因此启动 (3)。

![](https://images.spumn.eu.cc/blog/64f14264f66dc70f.png)

经计算，(1.75,12.26) 与 p 的距离是 17.48，要大于 p 与 L 的距离，因此我们不将其放入记录中。

![](https://images.spumn.eu.cc/blog/ebd740b24e1ae8ec.png)

然后 (4) 判断出不是顶端节点，呼出 (a)，爬。  


![](https://images.spumn.eu.cc/blog/124a53d47f7f583c.png)

(b) 出来一算，这个节点与 p 的距离是 4.91，要小于 p 与 L 的最大距离 6.62。

![](https://images.spumn.eu.cc/blog/e383c64400d37e43.png)

因此，我们用这个新的节点替代 L 中离 p 最远的 ![image](https://images.spumn.eu.cc/blog/745cf9d1fd81f7f3.svg)。

![](https://images.spumn.eu.cc/blog/8b8279133d2da2d4.png)

然后 (c) 又来了，我们比对 p 和当前节点的分割线的距离

![](https://images.spumn.eu.cc/blog/c350ac82f3b7cc51.png)

这个距离小于 L 与 p 的最小距离，因此我们要到当前节点的另一个枝执行 (2)。当然，那个枝只有一个点，直接到 (3)。

![](https://images.spumn.eu.cc/blog/fc369bd86dc8fedc.png)

计算距离发现这个点离 p 比 L 更远，因此不进行替代。

![](https://images.spumn.eu.cc/blog/9560af20dcb637d0.png)

(4) 发现不是顶点，所以呼出 (a)。我们向上爬，

![](https://images.spumn.eu.cc/blog/13cd4aecf50b2441.png)

这个是已经访问过的了，所以再来（a），

![](https://images.spumn.eu.cc/blog/115e0282dcfaeb1e.png)

好，（a）再爬，

![](https://images.spumn.eu.cc/blog/88af7409e8ad7d4c.webp)

啊！到顶点了。所以完了吗？当然不，还没轮到 (4) 呢。现在是 (b) 的回合。

我们进行计算比对发现顶端节点与p的距离比L还要更远，因此不进行更新。

![](https://images.spumn.eu.cc/blog/5012c24d8c100b2a.png)  
然后是 (c)，计算 p 和分割线的距离发现也是更远。

![](https://images.spumn.eu.cc/blog/39987053c6116ec9.png)

因此也不需要检查另一个分枝。

然后执行 (4)，判断当前节点是顶点，因此计算完成！输出距离 p 最近的三个样本是 ![image](https://images.spumn.eu.cc/blog/4166bb1d0905f843.svg)。

# 结语
kd 树的 kNN 算法节约了很大的计算量（虽然这点在少量数据上很难体现），但在理解上偏于复杂，希望本篇中的实例可以让读者清晰地理解这个算法。喜欢动手的读者可以尝试自己用代码实现 kd 树算法，但也可以用现成的机器学习包 scikit-learn 来进行计算。量化课堂的[下一篇文章](https://link.zhihu.com/?target=https%3A//www.joinquant.com/post/3227%3Ff%3Dstudy%26m%3Dmath)就将讲解如何用 scikit-learn 进行 kNN 分类。

