---
title: "B 树的特性"
description: "1. 所有的叶子结点都出现在同一层上，并且不带信息(可以看做是外部结点或查找失败的结点，实际上这些结点不存在，指向这些结点的指针为空)。"
---

# B 树的特性
1. **所有的叶子结点都出现在同一层上**，并且不带信息(可以看做是外部结点或查找失败的结点，实际上这些结点不存在，指向这些结点的指针为空)。 
2. 每个结点包含的关键字个数有上界和下界。用一个被称为 B-树的 **最小度数** 的固定整数![image](https://cdn.nlark.com/yuque/__latex/e3fbedbdfad93dcf4fa536081afe1329.svg)来表示这些界 ，其中![image](https://cdn.nlark.com/yuque/__latex/cead1760d9d5723460c4b8d4028f113a.svg)取决于磁盘块的大小：
    1. 除根结点以外的每个结点必须至少有![image](https://cdn.nlark.com/yuque/__latex/197acf540f0f574a974e00ef740e3da8.svg)个关键字。因此，除了根结点以外的每个内部结点有 t 个孩子。如果树非空，根结点至少有一个关键字。
    2. 每个结点至多包含![image](https://cdn.nlark.com/yuque/__latex/dc1498b487ee400fe2832eebfa588a44.svg)个关键字。 
3.  一个包含![image](https://cdn.nlark.com/yuque/__latex/712ecf7894348e92d8779c3ee87eeeb0.svg)个关键字的结点有![image](https://cdn.nlark.com/yuque/__latex/da2688980a39655380530bdef92db8e5.svg)个孩子； 
4.  一个结点中的所有关键字升序排列，两个关键字![image](https://cdn.nlark.com/yuque/__latex/a9359fcd0eef30525387b50bca39c0fe.svg)和![image](https://cdn.nlark.com/yuque/__latex/0305c36496446a2cd641134a478fcac6.svg)之间的孩子结点的所有关键字 key 在![image](https://cdn.nlark.com/yuque/__latex/7698762f1bb268e2b4835e20f2b23e79.svg)的范围之内。 
5. 与二叉排序树不同， B-树的搜索是从根结点开始，根据结点的孩子树做多路分支选择，而二叉排序树做的是二路分支选择，每一次判断都会进行一次磁盘 I/O操作。 
6.  与其他平很二叉树类似，B-树查找、插入和删除操作的时间复杂度为![image](https://cdn.nlark.com/yuque/__latex/1b0fce2bd1f5925667628ba7a81a4635.svg)量级。 

![](https://mmbiz.qpic.cn/mmbiz_png/rSmDLkNsngSKIHKxiaWgko0I3nUtUWPOZ4t1QoCBdfJKpiaNncE20YOBEeWg7aWRXaU840Be1AXczV4Z28ibPaLOQ/640?wx_fmt=png&wxfrom=5&wx_lazy=1&wx_co=1)

上图就是一颗典型的 B-树，其中最小度数 ，根结点至少包含一个关键字 `P` ，根结点以外的每个结点至少有 `t - 1 = 1` 个，每个结点最多包含 `2t - 1= 3` 个关键字；包含三个 1 关键字 `P` 的根结点有 `1 + 1 = 2` 个孩子结点，包含 3 个关键字的结点 `(C、G、L)` 包含有 4 个孩子。同一个结点中的所有关键字升序排列，比如结点 `(D、E、F)` 的内部结点就是升序排列，且均位于其父结点中的关键字 `C` 和 `G` 之间。所有的叶结点均为空。

# B-树的查找
B-树的查找操作与二叉排序树（BST）极为类似，只不多 B-树中的每个结点包含多个关键字。假设待查找的关键字为  `k` ，我们从根结点开始，递归向下进行查找。对每一个访问的非叶子结点，**如果结点包含待查找的关键字 **`**k**`** ，则返回结点指针**；否则，我们递归到该结点的恰当子代（该子代结点中的关键字均在比 `k` 更大的关键字之前）。如果抵达了叶子结点且没有找到 `k` 则返回 `null` .

## B-树查找操作演示
![](https://mmbiz.qpic.cn/mmbiz_png/rSmDLkNsngSKIHKxiaWgko0I3nUtUWPOZ4t1QoCBdfJKpiaNncE20YOBEeWg7aWRXaU840Be1AXczV4Z28ibPaLOQ/640?wx_fmt=png&wxfrom=5&wx_lazy=1&wx_co=1)

我们以查找关键字 `F` 为例进行说明。

第一步：访问根结点 `P` ，发现关键字 `F` 小于 `P` ，则查找结点 `P` 的左孩子。

![](https://mmbiz.qpic.cn/mmbiz_png/rSmDLkNsngSKIHKxiaWgko0I3nUtUWPOZ3wzLLEq4vGxY98Mm7Myj36HCp0icOpibckicv3c9nkfmNWNCgCQiaO5wzA/640?wx_fmt=png&wxfrom=5&wx_lazy=1&wx_co=1)

第二步：访问结点 `P` 的左子结点 `[C、G、L]` ，对于一个结点中包含多个关键字时，顺序进行访问，首先与关键字 `C` 进行比较，发现比 `C` 大；然后与关键字 `G` 进行比较，发现比 `G` 小，则说明待查找关键字 `F` 位于关键字 `C` 和关键字 `G` 之间的子代中。

![](https://mmbiz.qpic.cn/mmbiz_png/rSmDLkNsngSKIHKxiaWgko0I3nUtUWPOZFibLQ1gMOouu12eZwOQHYhYWLic7IIyPU08o3cib1IfXHfMj08wXVH0lA/640?wx_fmt=png&wxfrom=5&wx_lazy=1&wx_co=1)

第三步：访问关键字 `C` 和关键字 `G` 之间的子代，该子代结点包含三个关键字 `[D、E、F]` ，进行顺序遍历，比较关键字 `D` 和 `F` ，`F` 比 `D` 大

![](https://mmbiz.qpic.cn/mmbiz_png/rSmDLkNsngSKIHKxiaWgko0I3nUtUWPOZSsdkpRAjyQZRjogX4McZSiaj8icZriack9EE0wdu6lTkwuhgs23tjUAWA/640?wx_fmt=png&wxfrom=5&wx_lazy=1&wx_co=1)

顺序访问关键字 `E` ，`F` 比 `E` 大：

![](https://mmbiz.qpic.cn/mmbiz_png/rSmDLkNsngSKIHKxiaWgko0I3nUtUWPOZfWHIAibGicfABOFEAjeibghD7cEYwsFI8H5vQMcAd8NxGAZX90fZU3RzA/640?wx_fmt=png&wxfrom=5&wx_lazy=1&wx_co=1)

顺序访问关键字 `F` ，发现与待查找关键字相同，查找成功。则返回结点  `[D、E、F]` 的指针。

![](https://mmbiz.qpic.cn/mmbiz_png/rSmDLkNsngSKIHKxiaWgko0I3nUtUWPOZlibyxeaV4uahFJUgic5ICcgka8v1jfAQJbYYjfYStuO5J7J0yPtGxCLA/640?wx_fmt=png&wxfrom=5&wx_lazy=1&wx_co=1)

在此处我们顺带一起看一下 B-树中结点的一个定义：

```c
int *keys; // 存储关键字的数组
int t;  // 最小度 (定义一个结点包含关键字的个数 t-1 <= num <= 2t -1) 
BTreeNode **C; // 存储孩子结点指针的数组
int n;  // 记录当前结点包含的关键字的个数
bool leaf; // 叶子结点的一个标记，如果是叶子结点则为true,否则false
```

这是一个结点所最关键的几个属性，我们对 B-树中结点的完整定义为：

```cpp
class BTreeNode 
{ 
    int *keys; // 存储关键字的数组
    int t;  // 最小度 (定义一个结点包含关键字的个数 t-1 <= num <= 2t -1) 
    BTreeNode **C; // 存储孩子结点指针的数组
    int n;  // 记录当前结点包含的关键字的个数
    bool leaf; // 叶子结点的一个标记，如果是叶子结点则为true,否则false
    public: 
    BTreeNode(int _t, bool _leaf);
    
    // 
    void traverse(); 
    
    // 查找一个关键字
    BTreeNode *search(int k); // 如果没有出现，则返回 NULL
    
    // 设置友元，以便访问BTreeNode类中的私有成员
    friend class BTree; 
}; 
    
    // B-树 
class BTree 
{ 
    BTreeNode *root; //指向B-树根节点的指针
    int t; // 最小度
public: 
    // 构造器（初始化一棵树为空树）
    BTree(int _t) 
    { root = NULL; t = _t; } 
    
    // 进行中序遍历
    void traverse() 
    { if (root != NULL) root->traverse(); } 
    
    // B-树中查找一个关键字 k 
    BTreeNode* search(int k) 
    { return (root == NULL)? NULL : root->search(k); } 
};
```

这里面可能涉及一些 `C++` 的基础，不过你学算法，不必在意，只需要关注一个 B-树结点最重要的几个属性定义。

## B-树的查找操作的实现
```cpp
// B-树查找操作的实现 
BTreeNode *BTreeNode::search(int k) 
{ 
    // 找到第一个大于等于待查找关键字 k 的关键字
    int i = 0; 
    while (i < n && k > keys[i]) 
        i++; 

    // 如果找到的第一个关键字等于 k , 返回结点指针 
    if (keys[i] == k) 
        return this; 

    // 如果没有找到关键 k 且当前结点为叶子结点则返回NULL
    if (leaf == true) 
        return NULL; 

    // 递归访问恰当的子代
    return C[i]->search(k); 
}
```

# B-树的中序遍历
B-树的中序遍历与二叉树的中序遍历也很相似，我们从最左边的孩子结点开始，递归地打印最左边的孩子结点，然后对剩余的孩子和关键字重复相同的过程。最后，递归打印最右边的孩子.

![](https://mmbiz.qpic.cn/mmbiz_png/rSmDLkNsngSKIHKxiaWgko0I3nUtUWPOZ4t1QoCBdfJKpiaNncE20YOBEeWg7aWRXaU840Be1AXczV4Z28ibPaLOQ/640?wx_fmt=png&wxfrom=5&wx_lazy=1&wx_co=1)

对于这个图的中序遍历结果为：

![](https://mmbiz.qpic.cn/mmbiz_png/rSmDLkNsngSKIHKxiaWgko0I3nUtUWPOZlUmJQ32Vz9s8bxNu9ibttuT5tRGYkRPuroRQBkTYoSvibWEGEibpV4NKQ/640?wx_fmt=png&wxfrom=5&wx_lazy=1&wx_co=1)

**一定要注意，本应该是26个字母，但是这里缺少了字母  **`**I**`** **  ，之后我们看插入操作时可以将其插入。

## 中序遍历实现代码
```cpp
void BTreeNode::traverse() 
{ 
    // 有 n 个关键字和 n+1 个孩子  
    // 遍历 n 个关键字和前 n 个孩子
    int i; 
    for (i = 0; i < n; i++) 
    { 
        // 如果当前结点不是叶子结点, 在打印 key[i] 之前, 
        // 先遍历以 C[i] 为根的子树. 
        if (leaf == false) 
            C[i]->traverse(); 
        cout << " " << keys[i]; 
    } 

    // 打印以最后一个孩子为根的子树
    if (leaf == false) 
        C[i]->traverse(); 
}
```

# B-树的插入操作
**一个新插入的关键字 **`**k**`** 总是被插入到叶子结点。**与二叉排序树的插入操作类似，我们从根结点开始，向下遍历直到叶子结点，到达叶子结点，将关键字 `k` 插入到相应的叶子结点。与 BST 不同的是，我们通过最小度定义了一个结点可以包含关键字的个数的一个取值范围，所以在插入一个关键字时，就需要确认插入关键字之后结点是否超出结点本身最大可容纳的关键字个数。

**如果判断在插入一个关键字 k 之前，一个结点是否有可供当前结点插入的空间呢？**

我们可以使用一个称为 `splitChild()` 的操作实现，即拆分一个结点的孩子。下图中， `x` 的孩子结点 `y` 被拆分成了两个结点 `y` 和 `z` 。拆分操作将一个关键`I` 上移，并以上移的关键 `I` 对结点 `y` 进行拆分，拆分成包含关键字 `[G、H]` 的结点 `y` 和包含关键字 `[J、K]` 的结点 `z` . 这一过程又称之为 B-树的**生长**，区别于 BST 的向下生长。

![](https://mmbiz.qpic.cn/mmbiz_png/rSmDLkNsngSKIHKxiaWgko0I3nUtUWPOZzYt3NQeD92EECqkFic07mm7cs0iaYVHQl9f9HN1bh5sFdOib2pk4fxSFQ/640?wx_fmt=png&wxfrom=5&wx_lazy=1&wx_co=1)

综上，B-树在插入一个新的关键字 `k` 时，我们从根结点一直访问到叶子结点，在遍历一个结点之前，首先检查这个结点是否已经满了，即包含了 `2t - 1` 个关键字，如果结点已满，则将其拆分并创建新的空间。插入操作的伪代码描述如下：

## 插入操作伪码
1.  初始化 `x` 作为根结点 
2.  当 `x` 不是叶子结点，执行如下操作： 
3.  
    1. 找到 `x` 的下一个要被访问的孩子结点 `y`
    2. 如果 `y` 没有满，则将结点 `y` 作为新的 `x`
    3. 如果 `y` 已经满了，拆分 `y` ，结点 `x` 的指针指向结点 `y` 的两部分。如果 `k` 比  `y` 中间的关键字小， 则将 `y` 的第一部分作为新的 `x` ，否则将  `y` 的第二部分作为新的 `x` ，当将 `y` 拆分后，将 `y` 中的一个关键字移动到它的父结点 `x` 当中。
4.  当 `x` 是叶子结点时，第二步结束；由于我们已经提前拆分了所有结点，`x` 必定至少有一个额外的关键字空间，进行简单的插入即可。 

事实上 B-树的插入操作是一种**主动插入算法**，因为在插入新的关键字之前，**我们会将所有已满的结点进行拆分**，提前拆分的好处就是，我们不必进行回溯，遍历结点两次。如果我们不事先拆分一个已满的结点，而仅仅在插入新的关键字时才拆分它，那么最终可能需要再次从根结点出发遍历所有结点，比如在我们到达叶子结点时，将叶结点进行拆分，并将其中的一个关键字上移导致父结点分裂（因为上移导致父结点超出可存储的关键字的个数），父结点的分裂后，新的关键字继续上移，将可能导致新的父结点分裂，从而出现大量的回溯操作。但是 B-树这种主动插入算法中，就不会发生级联效应。当然，**这种主动插入的缺点也很明显，我们可能进行很多不必要的拆分操作。**

## 插入操作案例
![](https://mmbiz.qpic.cn/mmbiz_png/rSmDLkNsngSKIHKxiaWgko0I3nUtUWPOZ4t1QoCBdfJKpiaNncE20YOBEeWg7aWRXaU840Be1AXczV4Z28ibPaLOQ/640?wx_fmt=png&wxfrom=5&wx_lazy=1&wx_co=1)

我们以在上图中插入关键字 `I` 为例进行说明。其中最小度 `t = 2` ，一个结点最多可存储 `2t - 1 = 3` 个结点。

第一步：访问根结点，发现插入关键字 `I` 小于 `P` , 但根结点未满，不分裂，直接访问其第一个孩子结点。

![](https://mmbiz.qpic.cn/mmbiz_png/rSmDLkNsngSKIHKxiaWgko0I3nUtUWPOZ3wzLLEq4vGxY98Mm7Myj36HCp0icOpibckicv3c9nkfmNWNCgCQiaO5wzA/640?wx_fmt=png&wxfrom=5&wx_lazy=1&wx_co=1)

第二步：访问结点 `P` 的第一个孩子结点 `[C、G、L]` ，发现第一个孩子结点已满，将第一个孩子结点分裂为两个：

![](https://mmbiz.qpic.cn/mmbiz_png/rSmDLkNsngSKIHKxiaWgko0I3nUtUWPOZicuRPbzvyBPiblUMJ1rAwVhJLgvkwCF80ortyN0pL8JnVWJ1DdDCQhfw/640?wx_fmt=png&wxfrom=5&wx_lazy=1&wx_co=1)

第三步：将结点  `I` 插入到结点 `L` 的第一个左孩子当中，发现 `L` 的第一个左孩子 `[H、J、K]` 已满，则将其分裂为两个。![](https://mmbiz.qpic.cn/mmbiz_png/rSmDLkNsngSKIHKxiaWgko0I3nUtUWPOZbk4rukVb2w6jfctvpuxxEnCxrwsBxrrp8od99fcT33WVPsDs6OjEmQ/640?wx_fmt=png&wxfrom=5&wx_lazy=1&wx_co=1)

第四步：将结点 `I` 插入到结点 `J` 的第一个孩子当中，发现 `L` 的第一个孩子结点 `[H]` 未满且为叶子结点，则将 `I` 直接插入。

![](https://mmbiz.qpic.cn/mmbiz_png/rSmDLkNsngSKIHKxiaWgko0I3nUtUWPOZKmP9Vl1TBNTfM6d60A9h99rsNwVVQPibKpAmOktpOH8wFEUxwzCo4Fw/640?wx_fmt=png&wxfrom=5&wx_lazy=1&wx_co=1)

## 插入操作代码实现：
关于 B-树插入操作的实现稍微复杂一些，里面涉及到每一个结点内部指针的移动，同时涉及到父结点中相应指针的移动，不过对照着图和代码中的注释，我相信你可以看懂。

```cpp
// B-树中插入一个新的结点 k 主函数
void BTree::insert(int k) 
{ 
    // 如果树为空树
    if (root == NULL) 
    { 
        // 为根结点分配空间
        root = new BTreeNode(t, true); 
        root->keys[0] = k; //插入结点 k 
        root->n = 1; // 更新根结点高寒的关键字的个数为 1
    } 
    else  
    { 
        // 当根结点已满，则对B-树进行生长操作 
        if (root->n == 2*t-1) 
        { 
            // 为新的根结点分配空间
            BTreeNode *s = new BTreeNode(t, false); 

            // 将旧的根结点作为新的根结点的孩子
            s->C[0] = root; 

            // 将旧的根结点分裂为两个，并将一个关键字上移到新的根结点 
            s->splitChild(0, root); 

            // 新的根结点有两个孩子结点
            //确定哪一个孩子将拥有新插入的关键字
            int i = 0; 
            if (s->keys[0] < k) 
                i++; 
            s->C[i]->insertNonFull(k); 

            // 新的根结点更新为 s
            root = s; 
        } 
        else //根结点未满，调用insertNonFull()函数进行插入
            root->insertNonFull(k); 
    } 
} 

// 将关键字 k 插入到一个未满的结点中
void BTreeNode::insertNonFull(int k) 
{ 
    // 初始化 i 为结点中的最后一个关键字的位置
    int i = n-1; 

    // 如果当前结点是叶子结点
    if (leaf == true) 
    { 
        // 下面的循环做两件事：
        // a) 找到新插入的关键字位置并插入
        // b) 移动所有大于关键字 k 的向后移动一个位置
        while (i >= 0 && keys[i] > k) 
            { 
                keys[i+1] = keys[i]; 
                i--; 
            } 

        // 插入新的关键字，结点包含的关键字个数加 1 
        keys[i+1] = k; 
        n = n+1; 
    } 
    else 
    { 
        //找到第一个大于关键字 k 的关键字 keys[i] 的孩子结点
        while (i >= 0 && keys[i] > k) 
            i--; 

        // 检查孩子结点是否已满
        if (C[i+1]->n == 2*t-1) 
        { 
            // 如果已满，则进行分裂操作
            splitChild(i+1, C[i+1]); 

            // 分裂后，C[i] 中间的关键字上移到父结点，
            // C[i] 分裂称为两个孩子结点
            // 找到新插入关键字应该插入的结点位置
            if (keys[i+1] < k) 
                i++; 
        } 
        C[i+1]->insertNonFull(k); 
    } 
} 

// 结点 y 已满，则分裂结点 y 
void BTreeNode::splitChild(int i, BTreeNode *y) 
{ 
    // 创建一个新的结点存储 t - 1 个关键字
    BTreeNode *z = new BTreeNode(y->t, y->leaf); 
    z->n = t - 1; 

    //将结点 y 的后 t -1 个关键字拷贝到 z 中
    for (int j = 0; j < t-1; j++) 
        z->keys[j] = y->keys[j+t]; 

    // 如果 y 不是叶子结点，拷贝 y 的后 t 个孩子结点到 z中
    if (y->leaf == false) 
    { 
        for (int j = 0; j < t; j++) 
            z->C[j] = y->C[j+t];  
    } 

    //将 y 所包含的关键字的个数设置为 t -1
    //因为已满则为2t -1 ，结点 z 中包含 t - 1 个
    //一个关键字需要上移 
    //所以 y 中包含的关键字变为 2t-1 - (t-1) -1 
    y->n = t - 1; 

    // 给当前结点的指针分配新的空间，
    //因为有新的关键字加入，父结点将多一个孩子。
    for (int j = n; j >= i+1; j--) 
        C[j+1] = C[j]; 

    // 当前结点的下一个孩子设置为z 
    C[i+1] = z; 

    //将所有父结点中比上移的关键字大的关键字后移
    //找到上移结点的关键字的位置
    for (int j = n-1; j >= i; j--) 
        keys[j+1] = keys[j]; 

    // 拷贝 y 的中间关键字到其父结点中
    keys[i] = y->keys[t-1]; 

    //当前结点包含的关键字个数加 1 
    n = n + 1; 
}
```

# B-树的删除操作
B-树的删除操作相比于插入操作更为复杂，如果仅仅只是删除叶子结点中的关键字，也非常简单，但是如果删除的是内部节点的，就不得不对结点的孩子进行重新排列。

与 B-树的插入操作类似，我们必须确保删除操作不违背 B-树的特性。正如插入操作中每一个结点所包含的关键字的个数不能超过 `2t -1` 一样，删除操作要保证每一个结点包含的关键字的个数不少于 `t -1` 个（除根结点允许包含比 `t -1` 少的关键字的个数。

接下来一一横扫删除操作中可能出现的所有情况。

**初始的 B-树 如图所示，其中最小度 **`**t = 3**`** 每一个结点最多可包含 5 个关键字，至少包含 2个关键字（根结点除外）。**

![](https://mmbiz.qpic.cn/mmbiz_png/rSmDLkNsngSKIHKxiaWgko0I3nUtUWPOZ4t1QoCBdfJKpiaNncE20YOBEeWg7aWRXaU840Be1AXczV4Z28ibPaLOQ/640?wx_fmt=png&wxfrom=5&wx_lazy=1&wx_co=1)

## 1. 待删除的关键字 k 在结点 x 中，且 x 是叶子结点，删除关键字k
删除 B-树中的关键字 `F`

![](https://mmbiz.qpic.cn/mmbiz_png/rSmDLkNsngSKIHKxiaWgko0I3nUtUWPOZY94ib2FQOpjmXBBFLAWD9kHWfIBCMhFUaeZAyv1pp57PnK8hWs4kE8w/640?wx_fmt=png&wxfrom=5&wx_lazy=1&wx_co=1)

## 2. 待删除的关键字 k 在结点 x 中，且 x 是内部结点，分一下三种情况
#### 情况一：如果位于结点 x 中的关键字 k 之前的第一个孩子结点 y 至少有 t 个关键字，则在孩子结点 y 中找到 k 的前驱结点![image](https://cdn.nlark.com/yuque/__latex/30e59e524230712e9f2c2a4a20400c9b.svg)，递归地删除关键字![image](https://cdn.nlark.com/yuque/__latex/30e59e524230712e9f2c2a4a20400c9b.svg)，并将结点 x 中的关键字 k 替换为![image](https://cdn.nlark.com/yuque/__latex/30e59e524230712e9f2c2a4a20400c9b.svg).
删除 B-树中的关键字 `G` ，`G` 的前一个孩子结点 `y` 为 `[D、E、F]` ，包含 3个关键字，满足情况一，关键字 `G` 的直接前驱为关键 `F` ，删除 `F` ，然后将 `G` 替换为 `F` .

![](https://mmbiz.qpic.cn/mmbiz_png/rSmDLkNsngSKIHKxiaWgko0I3nUtUWPOZHFQQV0S0ia2XnpWXYXXPz4QIw3tiaKHa97wg7BRQNlibibtcF5U4bK9guw/640?wx_fmt=png&wxfrom=5&wx_lazy=1&wx_co=1)

#### 情况二：y 所包含的关键字少于 t 个关键字，则检查结点 x 中关键字 k 的后一个孩子结点 z 包含的关键字的个数，如果  z 包含的关键字的个数至少为  t 个，则在 z 中找到关键字 k 的直接后继![image](https://cdn.nlark.com/yuque/__latex/30e59e524230712e9f2c2a4a20400c9b.svg),然后删除![image](https://cdn.nlark.com/yuque/__latex/30e59e524230712e9f2c2a4a20400c9b.svg)，并将关键 k 替换为![image](https://cdn.nlark.com/yuque/__latex/30e59e524230712e9f2c2a4a20400c9b.svg).
删除 B-树中的关键字 `C` ,  `y` 中包含的关键字的个数为 2 个，小于 `t = 3` ,结点 `[C、G、L]` 中的 关键字 `C` 的后一个孩子 z 为  `[D、E、F]` 包含 3 个关键字，关键字 `C` 的直接后继为 `D` ，删除 `D` ，然后将 `C` 替换为 `D` .

![](https://mmbiz.qpic.cn/mmbiz_png/rSmDLkNsngSKIHKxiaWgko0I3nUtUWPOZV2vDmpDkrBTDictDZatIoqcEvibMVqEkyWP6y2tiaNUQGJoToh1hXqJsA/640?wx_fmt=png&wxfrom=5&wx_lazy=1&wx_co=1)

#### 情况三：如果 y 和 z 都只包含 t -1 个关键字，合并关键字 k 和所有 z 中的关键字到 结点 y 中，结点 x 将失去关键字 k 和孩子结点 z，y 此时包含 2t -1 个关键字，释放结点 z 的空间并递归地从结点 y 中删除关键字 k.
为了说明这种情况，我们将用下图进行说明。

![](https://mmbiz.qpic.cn/mmbiz_png/rSmDLkNsngSKIHKxiaWgko0I3nUtUWPOZFESqtY2svopbUwChgR0IicMicjtT745k8tR7Xib0CQkC9b3pO2gnicdFRw/640?wx_fmt=png&wxfrom=5&wx_lazy=1&wx_co=1)

删除关键字 `C` ,  结点 y 包含 2 个关键字 ，结点 z 包含 2 个关键字，均等于 `t - 1 = 2` 个， 合并关键字 `C` 和结点 z 中的所有关键字到结点 `y` 当中：

![](https://mmbiz.qpic.cn/mmbiz_png/rSmDLkNsngSKIHKxiaWgko0I3nUtUWPOZciadxu2mdIY0Cn3pibcfcIQOx0fZich1GLadwW5ceKicoOmvLAm2O6PibUA/640?wx_fmt=png&wxfrom=5&wx_lazy=1&wx_co=1)

此时结点 y 为叶子结点，直接删除关键字 `C`

![](https://mmbiz.qpic.cn/mmbiz_png/rSmDLkNsngSKIHKxiaWgko0I3nUtUWPOZuIHNgicLQwgYA1qzBPOFYyscd3niaviaibUaQ0H8Ey8IlHehGs9sUbpoiag/640?wx_fmt=png&wxfrom=5&wx_lazy=1&wx_co=1)

## 3. 如果关键字 k 不在当前在内部结点 x 中，则确定必包含 k 的子树的根结点 `x.c(i)` （如果 k 确实在 B-树中）。如果 `x.c(i)` 只有 t - 1 个关键字，必须执行下面两种情况进行处理：（看到这里一头雾水）
首先我们得确认什么是当前内部结点 x ，什么是 `x.c(i)` ,如下图所示， P 现在不是根结点，而是完整 B-树的一个子树的根结点：

![](https://mmbiz.qpic.cn/mmbiz_png/rSmDLkNsngSKIHKxiaWgko0I3nUtUWPOZmfY750CDYxk6aX9Gia35WS4V20V2kMJo5fZQmdbKNzzWE3GCYrurrqQ/640?wx_fmt=png&wxfrom=5&wx_lazy=1&wx_co=1)

#### 情况二：如果 `x.c(i)` 及 `x.c(i)` 的所有相邻兄弟都只包含 t - 1 个关键字，则将 `x.c(i)` 与 一个兄弟合并，即将 x 的一个关键字移动至新合并的结点，使之成为该结点的中间关键字，将合并后的结点作为新的 x 结点 .（依旧一头雾水）
不要惊奇，为什么情况二放前面，而情况一放后面，原因是这样有助于你的理解。

情况二上面的图标明了相应的 x 及 `x.c(i)` ，我们以删除关键字 `D` 为例，此时当前内部结点 `x` 不包含关键字 `D` , 确定是第三种情况，我们可以确认关键 `D` 一定在结点 x 的第一个孩子结点所在的子树中，结点 x 的第一个孩子结点所在子树的跟结点为 `x.c(i) 即 [C、L]` . 其中 `结点 [C、L]` 及其相邻的兄弟结点 `[T、W]` 都只包含 2 个结点（即 `t - 1`) ，则将  `[G、L]` 与 `[T、W]` 合并，并将结点 x 当中仅有的关键字 `P` 合并到新结点中；然后将合并后的结点作为新的 x 结点，递归删除关键字 `D` ，发现`D` 此时在叶子结点 y 中，直接删除，就是 **1.** 的情况。（此时清晰了很多）

![](https://mmbiz.qpic.cn/mmbiz_png/rSmDLkNsngSKIHKxiaWgko0I3nUtUWPOZDrzSwHuLia7Lz0jGgia4ExsZ81auSthtJH7ApE9RAQYJTYribHkmUU6kA/640?wx_fmt=png&wxfrom=5&wx_lazy=1&wx_co=1)

#### 情况一：`x.c(i)` 仅包含 t - 1 个关键字且 `x.c(i)` 的一个兄弟结点包含至少 t  个关键字，则将 x 的某一个关键字下移到 `x.c(i)` 中，将 `x.c(i)` 的相邻的左兄弟或右兄弟结点中的一个关键字上移到 x 当中，将该兄弟结点中相应的孩子指针移到 `x.c(i)` 中，使得 `x.c(i)` 增加一个额外的关键字。（一头雾水）
为了去掉 “一头雾水“，我们在上面情况二删除后的结果上继续进行说明：

![](https://mmbiz.qpic.cn/mmbiz_png/rSmDLkNsngSKIHKxiaWgko0I3nUtUWPOZ1MLgDlfkAX9fichMRZlTzVDcadDFV9ngASNb7kZicACR9iaOp1qnqXibQA/640?wx_fmt=png&wxfrom=5&wx_lazy=1&wx_co=1)

我们以删除结点 `[A、B]` 中的结点 `B` 为例，上图中 `x.c(i)` 包含 2 个关键字，即 t - 1 个关键字， `x.c(i)` 的一个兄弟结点 `[H、J、K]` 包含 3 个关键字（满足至少 t 个关键字的要求），则将兄弟结点 `[H、J、K]` 中的关键字 `H` 向上移动到 `x` 中， 将 x 中的关键字 `C` 下移到 `x.c(i)` 中；删除关键字 `B` .

![](https://mmbiz.qpic.cn/mmbiz_png/rSmDLkNsngSKIHKxiaWgko0I3nUtUWPOZYZibLQk0Gl4G24QuKSjhsdeWQOoFXfJGzNfaEmLUXOa2SUug12OMwZA/640?wx_fmt=png&wxfrom=5&wx_lazy=1&wx_co=1)

到这里，B-树的所有主要操作就结束了，关于 B-树查找、遍历、插入和删除的完整工程代码我就再不放在文中了，需要的朋友后台回复 「 **B-tree**」就可以获得。

# 二叉树与B-树的比较
B-树是一颗中序遍历结果有序的多路平衡树。不同于二叉树，B-树中的结点可以有多个孩子结点，二叉树只能有两个孩子结点。B-树的高度为![image](https://cdn.nlark.com/yuque/__latex/ecc577c2e23387e9c875af8f90599da3.svg)（其中 M 是B-树的阶，也就是**一个结点可以最多包含关键字的个数**，N 为结点个数）。每一次更新高度自动调整。B-树中的结点内的关键字按照从左到右升序排列。B-树中插入一个结点或者关键字相比于二叉树也更加复杂。

二叉树是一颗典型的普通树。与 B-树不同，二叉树中的结点最多可以有两个孩子结点。二叉树最顶端的根结点仅包含一个左子树和右子树。与 B-树相同，中序遍历结果有序，但是二叉树的前序遍历结果和后序遍历结果同样可以有序，二叉树中结点的插入和删除操作简单。

| N | B-Tree | Binary Tree |
| :---: | :---: | :---: |
| 1 | B-树中，一个结点最多可以包含 `M`<br/> 个孩子结点 | 二叉树中，一个结点最多包含 2 个孩子结点 |
| 2 | B-树是一颗中序遍历结果有序的有序树 | 二叉树不是排序树，可以按照前、中、后序遍历进行排序 |
| 3 | B-树的高度为 | 二叉树的高度为 |
| 4 | B-树从磁盘中加载数据 | 二叉树从RAM中加载数据 |
| 5 | B-树应用于DBMS(代码索引等) | 二叉树用在赫夫曼编码，代码优化等 |
| 6 | B-树中插入一个结点或关键字更复杂 | 二叉树插入树简单 |


# 附录
完整代码如下：

```cpp
#include<iostream>
using namespace std;

// A BTree node
class BTreeNode
{
	int *keys; // An array of keys
	int t;	 // Minimum degree (defines the range for number of keys)
	BTreeNode **C; // An array of child pointers
	int n;	 // Current number of keys
	bool leaf; // Is true when node is leaf. Otherwise false

public:

	BTreeNode(int _t, bool _leaf); // Constructor

	// A function to traverse all nodes in a subtree rooted with this node
	void traverse();

	// A function to search a key in subtree rooted with this node.
	BTreeNode *search(int k); // returns NULL if k is not present.

	// A function that returns the index of the first key that is greater
	// or equal to k
	int findKey(int k);

	// A utility function to insert a new key in the subtree rooted with
	// this node. The assumption is, the node must be non-full when this
	// function is called
	void insertNonFull(int k);

	// A utility function to split the child y of this node. i is index
	// of y in child array C[]. The Child y must be full when this
	// function is called
	void splitChild(int i, BTreeNode *y);

	// A wrapper function to remove the key k in subtree rooted with
	// this node.
	void remove(int k);

	// A function to remove the key present in idx-th position in
	// this node which is a leaf
	void removeFromLeaf(int idx);

	// A function to remove the key present in idx-th position in
	// this node which is a non-leaf node
	void removeFromNonLeaf(int idx);

	// A function to get the predecessor of the key- where the key
	// is present in the idx-th position in the node
	int getPred(int idx);

	// A function to get the successor of the key- where the key
	// is present in the idx-th position in the node
	int getSucc(int idx);

	// A function to fill up the child node present in the idx-th
	// position in the C[] array if that child has less than t-1 keys
	void fill(int idx);

	// A function to borrow a key from the C[idx-1]-th node and place
	// it in C[idx]th node
	void borrowFromPrev(int idx);

	// A function to borrow a key from the C[idx+1]-th node and place it
	// in C[idx]th node
	void borrowFromNext(int idx);

	// A function to merge idx-th child of the node with (idx+1)th child of
	// the node
	void merge(int idx);

	// Make BTree friend of this so that we can access private members of
	// this class in BTree functions
	friend class BTree;
};

class BTree
{
	BTreeNode *root; // Pointer to root node
	int t; // Minimum degree
public:

	// Constructor (Initializes tree as empty)
	BTree(int _t)
	{
		root = NULL;
		t = _t;
	}

	void traverse()
	{
		if (root != NULL) root->traverse();
	}

	// function to search a key in this tree
	BTreeNode* search(int k)
	{
		return (root == NULL)? NULL : root->search(k);
	}

	// The main function that inserts a new key in this B-Tree
	void insert(int k);

	// The main function that removes a new key in thie B-Tree
	void remove(int k);

};

BTreeNode::BTreeNode(int t1, bool leaf1)
{
	// Copy the given minimum degree and leaf property
	t = t1;
	leaf = leaf1;

	// Allocate memory for maximum number of possible keys
	// and child pointers
	keys = new int[2*t-1];
	C = new BTreeNode *[2*t];

	// Initialize the number of keys as 0
	n = 0;
}

// A utility function that returns the index of the first key that is
// greater than or equal to k
int BTreeNode::findKey(int k)
{
	int idx=0;
	while (idx<n && keys[idx] < k)
		++idx;
	return idx;
}

// A function to remove the key k from the sub-tree rooted with this node
void BTreeNode::remove(int k)
{
	int idx = findKey(k);

	// The key to be removed is present in this node
	if (idx < n && keys[idx] == k)
	{

		// If the node is a leaf node - removeFromLeaf is called
		// Otherwise, removeFromNonLeaf function is called
		if (leaf)
			removeFromLeaf(idx);
		else
			removeFromNonLeaf(idx);
	}
	else
	{

		// If this node is a leaf node, then the key is not present in tree
		if (leaf)
		{
			cout << "The key "<< k <<" is does not exist in the tree\n";
			return;
		}

		// The key to be removed is present in the sub-tree rooted with this node
		// The flag indicates whether the key is present in the sub-tree rooted
		// with the last child of this node
		bool flag = ( (idx==n)? true : false );

		// If the child where the key is supposed to exist has less that t keys,
		// we fill that child
		if (C[idx]->n < t)
			fill(idx);

		// If the last child has been merged, it must have merged with the previous
		// child and so we recurse on the (idx-1)th child. Else, we recurse on the
		// (idx)th child which now has atleast t keys
		if (flag && idx > n)
			C[idx-1]->remove(k);
		else
			C[idx]->remove(k);
	}
	return;
}

// A function to remove the idx-th key from this node - which is a leaf node
void BTreeNode::removeFromLeaf (int idx)
{

	// Move all the keys after the idx-th pos one place backward
	for (int i=idx+1; i<n; ++i)
		keys[i-1] = keys[i];

	// Reduce the count of keys
	n--;

	return;
}

// A function to remove the idx-th key from this node - which is a non-leaf node
void BTreeNode::removeFromNonLeaf(int idx)
{

	int k = keys[idx];

	// If the child that precedes k (C[idx]) has atleast t keys,
	// find the predecessor 'pred' of k in the subtree rooted at
	// C[idx]. Replace k by pred. Recursively delete pred
	// in C[idx]
	if (C[idx]->n >= t)
	{
		int pred = getPred(idx);
		keys[idx] = pred;
		C[idx]->remove(pred);
	}

	// If the child C[idx] has less that t keys, examine C[idx+1].
	// If C[idx+1] has atleast t keys, find the successor 'succ' of k in
	// the subtree rooted at C[idx+1]
	// Replace k by succ
	// Recursively delete succ in C[idx+1]
	else if (C[idx+1]->n >= t)
	{
		int succ = getSucc(idx);
		keys[idx] = succ;
		C[idx+1]->remove(succ);
	}

	// If both C[idx] and C[idx+1] has less that t keys,merge k and all of C[idx+1]
	// into C[idx]
	// Now C[idx] contains 2t-1 keys
	// Free C[idx+1] and recursively delete k from C[idx]
	else
	{
		merge(idx);
		C[idx]->remove(k);
	}
	return;
}

// A function to get predecessor of keys[idx]
int BTreeNode::getPred(int idx)
{
	// Keep moving to the right most node until we reach a leaf
	BTreeNode *cur=C[idx];
	while (!cur->leaf)
		cur = cur->C[cur->n];

	// Return the last key of the leaf
	return cur->keys[cur->n-1];
}

int BTreeNode::getSucc(int idx)
{

	// Keep moving the left most node starting from C[idx+1] until we reach a leaf
	BTreeNode *cur = C[idx+1];
	while (!cur->leaf)
		cur = cur->C[0];

	// Return the first key of the leaf
	return cur->keys[0];
}

// A function to fill child C[idx] which has less than t-1 keys
void BTreeNode::fill(int idx)
{

	// If the previous child(C[idx-1]) has more than t-1 keys, borrow a key
	// from that child
	if (idx!=0 && C[idx-1]->n>=t)
		borrowFromPrev(idx);

	// If the next child(C[idx+1]) has more than t-1 keys, borrow a key
	// from that child
	else if (idx!=n && C[idx+1]->n>=t)
		borrowFromNext(idx);

	// Merge C[idx] with its sibling
	// If C[idx] is the last child, merge it with with its previous sibling
	// Otherwise merge it with its next sibling
	else
	{
		if (idx != n)
			merge(idx);
		else
			merge(idx-1);
	}
	return;
}

// A function to borrow a key from C[idx-1] and insert it
// into C[idx]
void BTreeNode::borrowFromPrev(int idx)
{

	BTreeNode *child=C[idx];
	BTreeNode *sibling=C[idx-1];

	// The last key from C[idx-1] goes up to the parent and key[idx-1]
	// from parent is inserted as the first key in C[idx]. Thus, the loses
	// sibling one key and child gains one key

	// Moving all key in C[idx] one step ahead
	for (int i=child->n-1; i>=0; --i)
		child->keys[i+1] = child->keys[i];

	// If C[idx] is not a leaf, move all its child pointers one step ahead
	if (!child->leaf)
	{
		for(int i=child->n; i>=0; --i)
			child->C[i+1] = child->C[i];
	}

	// Setting child's first key equal to keys[idx-1] from the current node
	child->keys[0] = keys[idx-1];

	// Moving sibling's last child as C[idx]'s first child
	if(!child->leaf)
		child->C[0] = sibling->C[sibling->n];

	// Moving the key from the sibling to the parent
	// This reduces the number of keys in the sibling
	keys[idx-1] = sibling->keys[sibling->n-1];

	child->n += 1;
	sibling->n -= 1;

	return;
}

// A function to borrow a key from the C[idx+1] and place
// it in C[idx]
void BTreeNode::borrowFromNext(int idx)
{

	BTreeNode *child=C[idx];
	BTreeNode *sibling=C[idx+1];

	// keys[idx] is inserted as the last key in C[idx]
	child->keys[(child->n)] = keys[idx];

	// Sibling's first child is inserted as the last child
	// into C[idx]
	if (!(child->leaf))
		child->C[(child->n)+1] = sibling->C[0];

	//The first key from sibling is inserted into keys[idx]
	keys[idx] = sibling->keys[0];

	// Moving all keys in sibling one step behind
	for (int i=1; i<sibling->n; ++i)
		sibling->keys[i-1] = sibling->keys[i];

	// Moving the child pointers one step behind
	if (!sibling->leaf)
	{
		for(int i=1; i<=sibling->n; ++i)
			sibling->C[i-1] = sibling->C[i];
	}

	// Increasing and decreasing the key count of C[idx] and C[idx+1]
	// respectively
	child->n += 1;
	sibling->n -= 1;

	return;
}

// A function to merge C[idx] with C[idx+1]
// C[idx+1] is freed after merging
void BTreeNode::merge(int idx)
{
	BTreeNode *child = C[idx];
	BTreeNode *sibling = C[idx+1];

	// Pulling a key from the current node and inserting it into (t-1)th
	// position of C[idx]
	child->keys[t-1] = keys[idx];

	// Copying the keys from C[idx+1] to C[idx] at the end
	for (int i=0; i<sibling->n; ++i)
		child->keys[i+t] = sibling->keys[i];

	// Copying the child pointers from C[idx+1] to C[idx]
	if (!child->leaf)
	{
		for(int i=0; i<=sibling->n; ++i)
			child->C[i+t] = sibling->C[i];
	}

	// Moving all keys after idx in the current node one step before -
	// to fill the gap created by moving keys[idx] to C[idx]
	for (int i=idx+1; i<n; ++i)
		keys[i-1] = keys[i];

	// Moving the child pointers after (idx+1) in the current node one
	// step before
	for (int i=idx+2; i<=n; ++i)
		C[i-1] = C[i];

	// Updating the key count of child and the current node
	child->n += sibling->n+1;
	n--;

	// Freeing the memory occupied by sibling
	delete(sibling);
	return;
}

// The main function that inserts a new key in this B-Tree
void BTree::insert(int k)
{
	// If tree is empty
	if (root == NULL)
	{
		// Allocate memory for root
		root = new BTreeNode(t, true);
		root->keys[0] = k; // Insert key
		root->n = 1; // Update number of keys in root
	}
	else // If tree is not empty
	{
		// If root is full, then tree grows in height
		if (root->n == 2*t-1)
		{
			// Allocate memory for new root
			BTreeNode *s = new BTreeNode(t, false);

			// Make old root as child of new root
			s->C[0] = root;

			// Split the old root and move 1 key to the new root
			s->splitChild(0, root);

			// New root has two children now. Decide which of the
			// two children is going to have new key
			int i = 0;
			if (s->keys[0] < k)
				i++;
			s->C[i]->insertNonFull(k);

			// Change root
			root = s;
		}
		else // If root is not full, call insertNonFull for root
			root->insertNonFull(k);
	}
}

// A utility function to insert a new key in this node
// The assumption is, the node must be non-full when this
// function is called
void BTreeNode::insertNonFull(int k)
{
	// Initialize index as index of rightmost element
	int i = n-1;

	// If this is a leaf node
	if (leaf == true)
	{
		// The following loop does two things
		// a) Finds the location of new key to be inserted
		// b) Moves all greater keys to one place ahead
		while (i >= 0 && keys[i] > k)
		{
			keys[i+1] = keys[i];
			i--;
		}

		// Insert the new key at found location
		keys[i+1] = k;
		n = n+1;
	}
	else // If this node is not leaf
	{
		// Find the child which is going to have the new key
		while (i >= 0 && keys[i] > k)
			i--;

		// See if the found child is full
		if (C[i+1]->n == 2*t-1)
		{
			// If the child is full, then split it
			splitChild(i+1, C[i+1]);

			// After split, the middle key of C[i] goes up and
			// C[i] is splitted into two. See which of the two
			// is going to have the new key
			if (keys[i+1] < k)
				i++;
		}
		C[i+1]->insertNonFull(k);
	}
}

// A utility function to split the child y of this node
// Note that y must be full when this function is called
void BTreeNode::splitChild(int i, BTreeNode *y)
{
	// Create a new node which is going to store (t-1) keys
	// of y
	BTreeNode *z = new BTreeNode(y->t, y->leaf);
	z->n = t - 1;

	// Copy the last (t-1) keys of y to z
	for (int j = 0; j < t-1; j++)
		z->keys[j] = y->keys[j+t];

	// Copy the last t children of y to z
	if (y->leaf == false)
	{
		for (int j = 0; j < t; j++)
			z->C[j] = y->C[j+t];
	}

	// Reduce the number of keys in y
	y->n = t - 1;

	// Since this node is going to have a new child,
	// create space of new child
	for (int j = n; j >= i+1; j--)
		C[j+1] = C[j];

	// Link the new child to this node
	C[i+1] = z;

	// A key of y will move to this node. Find location of
	// new key and move all greater keys one space ahead
	for (int j = n-1; j >= i; j--)
		keys[j+1] = keys[j];

	// Copy the middle key of y to this node
	keys[i] = y->keys[t-1];

	// Increment count of keys in this node
	n = n + 1;
}

// Function to traverse all nodes in a subtree rooted with this node
void BTreeNode::traverse()
{
	// There are n keys and n+1 children, travers through n keys
	// and first n children
	int i;
	for (i = 0; i < n; i++)
	{
		// If this is not leaf, then before printing key[i],
		// traverse the subtree rooted with child C[i].
		if (leaf == false)
			C[i]->traverse();
		cout << " " << keys[i];
	}

	// Print the subtree rooted with last child
	if (leaf == false)
		C[i]->traverse();
}

// Function to search key k in subtree rooted with this node
BTreeNode *BTreeNode::search(int k)
{
	// Find the first key greater than or equal to k
	int i = 0;
	while (i < n && k > keys[i])
		i++;

	// If the found key is equal to k, return this node
	if (keys[i] == k)
		return this;

	// If key is not found here and this is a leaf node
	if (leaf == true)
		return NULL;

	// Go to the appropriate child
	return C[i]->search(k);
}

void BTree::remove(int k)
{
	if (!root)
	{
		cout << "The tree is empty\n";
		return;
	}

	// Call the remove function for root
	root->remove(k);

	// If the root node has 0 keys, make its first child as the new root
	// if it has a child, otherwise set root as NULL
	if (root->n==0)
	{
		BTreeNode *tmp = root;
		if (root->leaf)
			root = NULL;
		else
			root = root->C[0];

		// Free the old root
		delete tmp;
	}
	return;
}

// Driver program to test above functions
int main()
{
	BTree t(3); // A B-Tree with minium degree 3

	t.insert(1);
	t.insert(3);
	t.insert(7);
	t.insert(10);
	t.insert(11);
	t.insert(13);
	t.insert(14);
	t.insert(15);
	t.insert(18);
	t.insert(16);
	t.insert(19);
	t.insert(24);
	t.insert(25);
	t.insert(26);
	t.insert(21);
	t.insert(4);
	t.insert(5);
	t.insert(20);
	t.insert(22);
	t.insert(2);
	t.insert(17);
	t.insert(12);
	t.insert(6);

	cout << "Traversal of tree constructed is\n";
	t.traverse();
	cout << endl;

	t.remove(6);
	cout << "Traversal of tree after removing 6\n";
	t.traverse();
	cout << endl;

	t.remove(13);
	cout << "Traversal of tree after removing 13\n";
	t.traverse();
	cout << endl;

	t.remove(7);
	cout << "Traversal of tree after removing 7\n";
	t.traverse();
	cout << endl;

	t.remove(4);
	cout << "Traversal of tree after removing 4\n";
	t.traverse();
	cout << endl;

	t.remove(2);
	cout << "Traversal of tree after removing 2\n";
	t.traverse();
	cout << endl;

	t.remove(16);
	cout << "Traversal of tree after removing 16\n";
	t.traverse();
	cout << endl;

	return 0;
}
```

