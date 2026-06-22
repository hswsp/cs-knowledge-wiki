---
title: "**背景**"
description: "在信息学竞赛中，我们经常会碰到一些跟区间有关的问题，比如给一些区间线段求并区间的长度，或者并区间的个数等等。这些问题的描述都非常简单，但是通常情况下数据范围会非常大，而朴素方法的[时间复杂度](https://so.csdn.net/so/"
---

# **背景**


在信息学竞赛中，我们经常会碰到一些跟区间有关的问题，比如给一些区间线段求并区间的长度，或者并区间的个数等等。这些问题的描述都非常简单，但是通常情况下数据范围会非常大，而朴素方法的[时间复杂度](https://so.csdn.net/so/search?q=%E6%97%B6%E9%97%B4%E5%A4%8D%E6%9D%82%E5%BA%A6&spm=1001.2101.3001.7020)过高，导致不能在规定时间内得到问题的解。这时，我们需要一种高效的数据结构来处理这样的问题，在本文中，我们介绍一种基于分治思想的数据结构——**线段树**(Interval Tree)。



## **简介**


线段树(interval tree)是一种二叉树形结构，属于平衡树的一种。它将线段区间组织成树形的结构，并用每个节点来表示一条线段。一棵[1,10)的线段树的结构如图1.1所示：  
![](https://images.spumn.eu.cc/blog/05109422a8699d7f.jpg)



可以看到，线段树的每个节点表示了**一条前闭后开**，即`[a,b)`的线段，这样表示的好处在于，有时候处理的区间并不是连续区间，**可能是离散的点**，如数组等。**这样就可以用**`[a,a＋1)`**的节点来表示一个数组的元素a**，做到连续与离散的统一。



由图1.1可见，线段树的根节点表示了所要处理的最大线段区间，而**叶节点则表示了形如**`[a,a+1)`**的单位区间**。对于每个非叶节点（包括根节点）所表示的区间`[s,t)`，**令**`m = (s + t) / 2`**，则其左儿子节点表示区间**`[s,m)`**，右儿子节点表示区间**`[m,t)`。这样建树的好处在于，对于每条要处理的线段，可以类似“二分”的进入线段树中处理，使得时间复杂度在`O(logN)`量级，这也是线段树之所以高效的原因。



## **性质**


线段树具有如下一些性质：

+ 线段树是一个平衡树，树的高度为logN。
+ 线段树把区间上的**任意一条长度为L的线段都分成不超过2logL条线段的并**。
+ 线段树**同一层的节点所代表的区间，相互不会重叠**。
+ 线段树任两个结点要么是包含关系要么没有公共部分, 不可能部分重叠
+ 给定一个叶子p, **从根到p路径上所有结点代表的区间都包含点p**, 且其他结点代表的区间都不包含点p
+ 线段树**叶子节点的区间是单位长度，不能再分了**。



## **基本存储结构**


```c
// 线段树节点
struct IntervalTreeNode{
    int left,right,mid;
    // 表示是否被覆盖
    bool cover;
};
```



其中，left 和right分别代表该节点所表示线段的左右端点，即当前节点所表示的线段为`[left, right)`。而`mid = (left + right) / 2`，为当前线段的中点，**储存这个点的好处是在每次在当前节点需要对线段分解的时候不需要再计算中点**。



这只是线段树节点的基本结构，在实际解决问题时，我们需要对应各种题目，在节点中添加各种数据域来保存有用的信息，比如**添加cover域来保存当前节点所表示的线段是否被覆盖等等**。根据题目来添加适当的数据域以及对其进行维护是线段树解题的精髓所在，我们在平时的做题中需要注意积累用法，并进行推广扩展，做到举一反三。



## **基本操作**


```c
// 由线段树的性质可知，建树所需要的空间大概是所需处理
// 最长线段长度的2倍多，所以需要开3倍大小的数组
IntervalTreeNode intervalTree[3 * MAX];
```



### **线段树的建立操作**


在对线段树进行操作前，我们需要建立起线段树的结构。我们使用结构体数组来保存线段树，这样对于非叶节点，若它在数组中编号为`num`，则其**左右子节点的编号为**`2*num`**，**`2*num + 1`。由于线段树是二分的树型结构，我们可以用递归的方法，从根节点开始来建立一棵线段树。代码如下所示：



```c
// left,right分别为当前节点的左右端点，num为节点在数组中的编号
void Create(int left,int right,int num){
    intervalTree[num].left = left;
    intervalTree[num].right = right;
    intervalTree[num].mid = (left + right) / 2;
    intervalTree[num].cover = false;
    // 若不为叶子节点，则递归的建立左右子树
    if(left + 1 != right){
        Create(left,intervalTree[num].mid,2*num);
        Create(intervalTree[num].mid,right,2*num+1);
    }//if
}
```



对应不同的题目，我们会在线段树节点中添加另外的数据域，并随着线段的插入或删除进行维护，要注意在建树过程中将这些数据域初始化。



### **线段树的插入（覆盖）操作**


为了在插入线段后，我们能**知道哪些节点上的线段被插入（覆盖）过。我们需要在节点中添加一个cover域**，来记录当前节点所表示的线段是否被覆盖。这样，在建树过程中，我们需要把每个节点的cover域置0；



如图1.2所示，在线段的插入过程中，我们从根节点开始插入，同样采取递归的方法。**如果插入的线段完全覆盖了当前节点所代表的线段，则将当前节点的cover 域置1并返回**。否则，将线段递归进入当前节点的左右子节点进行插入。代码如下:



```c
// 插入
void Insert(int left,int right,int num){
    // 若插入的线段完全覆盖当前节点所表示的线段
    if(intervalTree[num].left == left && intervalTree[num].right == right){
        intervalTree[num].cover = 1;
        return;
    }//if
    // 当前节点的左子节点所代表的线段包含插入的线段
    if(right <= intervalTree[num].mid){
        Insert(left,right,2*num);
    }//if
    // 当前节点的右子节点所代表的线段包含插入的线段
    else if(left >= intervalTree[num].mid){
        Insert(left,right,2*num+1);
    }//if
    // 插入的线段跨越了当前节点所代表线段的中点
    else{
        Insert(left,intervalTree[num].mid,2*num);
        Insert(intervalTree[num].mid,right,2*num+1);
    }//else
}
```



**要注意，这样插入线段时，有可能出现以下这种情况**，即先插入线段[1,3)，再插入线段[1,5)，如图1.3所示。这样，代表线段[1,3)的节点以及代表线段[1,5)的节点的cover值均为1，但是在统计时，遇到这种情况，**我们可以只统计更靠近根节点的节点，因为这个节点所代表的线段包含了其子树上所有节点所代表的线段**。



![](https://images.spumn.eu.cc/blog/cc3acf0e040e9bff.jpg)



![](https://images.spumn.eu.cc/blog/63e69aaf99c635a1.jpg)



### **线段树的删除操作**


线段树的删除操作跟插入操作不大相同，因为**一条线段只有被插入过才能被删除**。比如插入一条线段[3,10)，则只能删除线段[4,6)，不能删除线段[7,12)。**当删除未插入的线段时，操作返回false值**。



我们一样采用递归的方法对线段进行删除，如果当前节点所代表的线段未被覆盖，即**cover值为0，则递归进入此节点的左右子节点进行删除。**如果当前节点所代表的线段已被覆盖，即cover值为1，则要考虑两种情况。



**一是删除的线段完全覆盖当前节点所代表的线段，则将当前节点的cover值置0**。由于我们在插入线段的时候会出现图1.3所示的情况， 所以我们**应该递归的在当前节点的子树上所有节点删除线段**。



另一种情况是**删除的线段未完全覆盖当前节点所代表的线段**，比如当前节点代表的线段为[1,10)，而要删除的线段为[4,7)，则删除后剩下线段[1,4)和[7,10)，我们采用的方法是，**将当前节点的cover置0，并将其左右子节点的cover置1，然后递归的进入左右子节点进行删除。**



```c
// 删除
bool Delete(int left,int right,int num){
    // 删除到叶节点的情况
    if(intervalTree[num].left + 1 == intervalTree[num].right){
        int cover = intervalTree[num].cover;
        intervalTree[num].cover = 0;
        return cover;
    }//if
    // 当前节点不为叶节点且被覆盖
    if(intervalTree[num].cover == 1){
        intervalTree[num].cover = 0;
        intervalTree[2*num].cover = 1;
        intervalTree[2*num+1].cover = 1;
    }//if
    // 左子节点
    if(right <= intervalTree[num].mid){
        return Delete(left,right, 2*num);
    }//if
    // 右子节点
    else if(left >= intervalTree[num].mid){
        return Delete(left,right,2*num+1);
    }//else
    // 跨越左右子节点
    else{
        return Delete(left,intervalTree[num].mid,2*num) &&
        Delete(intervalTree[num].mid,right,2*num+1);
    }//else
}
```



相对插入操作，删除操作比较复杂，需要考虑的情况很多，稍有不慎就会出错，在比赛中写删除操作时务必联系插入操作的实现过程，仔细思考，才能避免错误。



### **线段树的统计操作**


对应不同的问题，线段树会统计不同的数据，比如线段覆盖的长度，线段覆盖连续区间的个数等等。其实现思路不尽相同，我们以下**以统计线段覆盖长度为例**，简要介绍线段树统计信息的过程。文章之后的章节会讲解一些要用到线段树的题目，并会详细介绍线段树的用法，以及各种信息的统计过程。



对于统计线段覆盖长度的问题，可以采用以下的思路来统计信息，即从根节点开始搜索整棵线段树，如果当前节点所代表的线段已被覆盖，则将统计长度加上当前线段长度。**否则，递归**进入当前节点的左右子节点进行统计。实现代码如下：



```c
// 覆盖长度
int CoverLen(int num){
    IntervalTreeNode node = intervalTree[num];
    // 如果当前节点所代表的线段已被覆盖，
    // 则将统计长度加上当前线段长度。
    if(node.cover){
        return node.right - node.left;
    }//if
    // 当遍历到叶节点时返回
    if(node.left + 1 == node.right){
        return 0;
    }//if
    // 递归进入当前节点的左右子节点进行计算
    return CoverLen(2*num) + CoverLen(2*num+1);
}
```



```c
#include <iostream>
#include <algorithm>
using namespace std;

#define MAX 10

// 线段树节点
struct IntervalTreeNode{
    int left,right,mid;
    // 表示是否被覆盖
    bool cover;
};

// 由线段树的性质可知，建树所需要的空间大概是所需处理
// 最长线段长度的2倍多，所以需要开3倍大小的数组
IntervalTreeNode intervalTree[3 * MAX];
// 创建线段树
// left,right分别为当前节点的左右端点，num为节点在数组中的编号
void Create(int left,int right,int num){
    intervalTree[num].left = left;
    intervalTree[num].right = right;
    intervalTree[num].mid = (left + right) / 2;
    intervalTree[num].cover = false;
    // 若不为叶子节点，则递归的建立左右子树
    if(left + 1 != right){
        Create(left,intervalTree[num].mid,2*num);
        Create(intervalTree[num].mid,right,2*num+1);
    }//if
}
// 插入
void Insert(int left,int right,int num){
    // 若插入的线段完全覆盖当前节点所表示的线段
    if(intervalTree[num].left == left && intervalTree[num].right == right){
        intervalTree[num].cover = 1;
        return;
    }//if
    // 当前节点的左子节点所代表的线段包含插入的线段
    if(right <= intervalTree[num].mid){
        Insert(left,right,2*num);
    }//if
    // 当前节点的右子节点所代表的线段包含插入的线段
    else if(left >= intervalTree[num].mid){
        Insert(left,right,2*num+1);
    }//if
    // 插入的线段跨越了当前节点所代表线段的中点
    else{
        Insert(left,intervalTree[num].mid,2*num);
        Insert(intervalTree[num].mid,right,2*num+1);
    }//else
}
// 删除
bool Delete(int left,int right,int num){
    // 删除到叶节点的情况
    if(intervalTree[num].left + 1 == intervalTree[num].right){
        int cover = intervalTree[num].cover;
        intervalTree[num].cover = 0;
        return cover;
    }//if
    // 当前节点不为叶节点且被覆盖
    if(intervalTree[num].cover == 1){
        intervalTree[num].cover = 0;
        intervalTree[2*num].cover = 1;
        intervalTree[2*num+1].cover = 1;
    }//if
    // 左子节点
    if(right <= intervalTree[num].mid){
        return Delete(left,right, 2*num);
    }//if
    // 右子节点
    else if(left >= intervalTree[num].mid){
        return Delete(left,right,2*num+1);
    }//else
    // 跨越左右子节点
    else{
        return Delete(left,intervalTree[num].mid,2*num) &&
        Delete(intervalTree[num].mid,right,2*num+1);
    }//else
}
// 覆盖长度
int CoverLen(int num){
    IntervalTreeNode node = intervalTree[num];
    // 如果当前节点所代表的线段已被覆盖，
    // 则将统计长度加上当前线段长度。
    if(node.cover){
        return node.right - node.left;
    }//if
    // 当遍历到叶节点时返回
    if(node.left + 1 == node.right){
        return 0;
    }//if
    // 递归进入当前节点的左右子节点进行计算
    return CoverLen(2*num) + CoverLen(2*num+1);
}

int main() {
    int x[] = {1,2,5};
    int y[] = {3,4,6};

    // 创建[1,10]区间的线段树
    Create(1,10,1);

    // 插入
    for(int i = 0;i < 3;++i){
        Insert(x[i],y[i],1);
    }//for

    // 删除
    Delete(2,3,1);

    /*for(int i = 1;i < 3*MAX;++i){
        cout<<"["<<intervalTree[i].left<<","<<intervalTree[i].right<<"]"<<"->"<<intervalTree[i].cover<<endl;
    }//for*/

    // 覆盖长度
    int len = CoverLen(1);
    cout<<len<<endl;
}
```



## 应用
### 单点更新
最基础的线段树,只更新叶子节点,然后回溯更新其父亲结点。

[[HDU][线段树]1166.敌兵布阵](http://blog.csdn.net/sunnyyoona/article/details/44593169)  
[[HDU][线段树]1754.I Hate It](http://blog.csdn.net/sunnyyoona/article/details/44595759)

### 成段更新
需要用到延迟标记(或者说懒惰标记),简单来说就是每次更新的时候不要更新到底,用延迟标记使得更新延迟到下次需要更新or询问到的时候。

### 区间合并
这类题目会询问区间中满足条件的连续最长区间,所以回溯的时候需要对左右儿子的区间进行合并。

### 扫描线
这类题目需要将一些操作排序,然后从左到右用一根扫描线(当然是在我们脑子里)扫过去。



最典型的就是矩形面积并,周长并等题。

