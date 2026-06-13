---
title: "二维矩阵的DFS与BFS"
description: "题目描述329. Longest Increasing Path in a MatrixGiven an m x n integers matrix, return the length of the longest increasing path in matrix.From each ce..."
---

# 二维矩阵的DFS与BFS

# 题目描述

[329. Longest Increasing Path in a Matrix](https://leetcode.cn/problems/longest-increasing-path-in-a-matrix/)

Given an `m x n` integers `matrix`, return the length of the **longest increasing path** in `matrix`.

From each cell, you can either move in four directions: left, right, up, or down. You **may not** move diagonally or move **outside the boundary** (i.e., wrap-around is not allowed).

**Example 1:**

![image](https://assets.leetcode.com/uploads/2021/01/05/grid1.jpg)

```bash
Input: matrix = [[9,9,4],[6,6,8],[2,1,1]]
Output: 4
Explanation: The longest increasing path is [1, 2, 6, 9].
```

**Example 2:**

![image](https://assets.leetcode.com/uploads/2021/01/27/tmp-grid.jpg)

```bash
Input: matrix = [[3,4,5],[3,2,6],[2,2,1]]
Output: 4
Explanation: The longest increasing path is [3, 4, 5, 6]. Moving diagonally is not allowed.
```

**Example 3:**

```bash
Input: matrix = [[1]]
Output: 1
```

# 解题思路

将矩阵看成一个有向图，每个单元格对应图中的一个节点，如果相邻的两个单元格的值不相等，则在相邻的两个单元格之间存在一条从较小值指向较大值的有向边。**问题转化成在有向图中寻找最长路径。**

# DFS

深度优先搜索是非常直观的方法。从一个单元格开始进行深度优先搜索，即可找到从该单元格开始的最长递增路径。对每个单元格分别进行深度优先搜索之后，即可得到矩阵中的最长递增路径的长度。

但是如果使用朴素深度优先搜索，时间复杂度是指数级，会超出时间限制，因此必须加以优化。

矩阵深度优先搜索里的回溯（backtracking）常常是必要的，由于这类题目通常要求**每个元素只能使用1次，因此我们需要维护一个seen矩阵**（记录访问过的元素，并且在dfs压栈和退栈的时候反复设置状态），而**每次选定的起始位置不同，seen的状态就不一样了**，导致计算的结果不可重用（因为计算结果只代表在seen的某一种确定状态下的结果，所以我们不能进行缓存）。

最终，我们只能采用回溯的方式去求解，得到的时间复杂度正是指数级别。比如经典的[Word Search II](https://leetcode-cn.com/problems/word-search-ii)，不管我们使用不使用字典树（Trie），回溯是不可避免的。

这题的每个元素只能用1次的条件是隐含的——因为要求（严格）递增路径，所以有效路径里，同一个位置的元素是不可能出现两次的。然而递增路径带来的buff却不止前面前面这个隐含条件。因为在内循环里，`**mat[ii][jj] > mat[i][j]**`**确保了之前已经访问过的元素根本就不会出现在后续的路径里，所以seen就没有存在的意义**，甚至可以直接缓存每一个子调用的计算结果，因为不管你从哪个位置开始迭代，**因为没有状态（没有seen），计算结果变成唯一的了——因此变得可以缓存了。**

朴素深度优先搜索的时间复杂度过高的原因是进行了大量的重复计算，同一个单元格会被访问多次，每次访问都要重新计算。由于同一个单元格对应的最长递增路径的长度是固定不变的，因此可以使用记忆化的方法进行优化。用矩阵 1813718137作为缓存矩阵，**已经计算过的单元格最长路径的结果存储到缓存矩阵中**。

使用记忆化深度优先搜索，当访问到一个单元格 `(i,j)` 时，如果 1813718137，说明该单元格的结果已经计算过，则直接从缓存中读取结果，如果 1813718137，说明该单元格的结果尚未被计算过，则进行搜索，并将计算得到的结果存入缓存中。

计算结果时候我们用`下游节点的最长路径(dfs求得) + 1`即可得到当前节点的最长路径。

遍历完矩阵中的所有单元格之后，即可得到矩阵中的最长递增路径的长度。

## 参考代码

```c
class Solution {
    vector> memo;
    static constexpr int dirs[4][2] = {{-1,0},{1,0},{0,-1},{0,1}};
    int dfs(vector>& matrix, int i, int j){
        if(memo[i][j]>0){
            return memo[i][j];
        }
        int n = matrix.size();
        int m = matrix[0].size();
        int lip = 1; //注意这里初始值为1， 表示只有自己一个。如果四面数都比他大，那么返回结果就是1。
        for(int k = 0;k=0&&newx=0&&newymatrix[i][j]){
                lip = max(lip,dfs(matrix,newx,newy) + 1);
            }
        }
        memo[i][j] = lip;
        return lip;
    }
public:
    int longestIncreasingPath(vector>& matrix) {
        int n = matrix.size();
        int m = matrix[0].size();
        if(n==0||m==0) return 0;
        memo.resize(n,vector(m,0));
        int lip = 0;
        for(int i = 0; i

## 复杂度分析

-  时间复杂度：1813718137，其中 m 和 n 分别是矩阵的行数和列数。深度优先搜索的时间复杂度是 1813718137，其中 V 是节点数，E 是边数。在矩阵中，1813718137，1813718137。 
-  空间复杂度：1813718137，其中 m 和 n 分别是矩阵的行数和列数。空间复杂度主要取决于缓存和递归调用深度，缓存的空间复杂度是 1813718137，递归调用深度不会超过 1813718137。 

# 拓扑排序+BFS

从方法一可以看到，每个单元格对应的最长递增路径的结果只和相邻单元格的结果有关，那么是否可以使用动态规划求解？

根据方法一的分析，动态规划的状态定义和状态转移方程都很容易得到。方法一中使用的**缓存矩阵 **1813718137**即为状态值**，状态转移方程如下：

1813718137

其中 1813718137 与 1813718137 在矩阵中相邻，并且 1813718137

动态规划除了状态定义和状态转移方程，还需要考虑边界情况。这里的边界情况是什么呢？

**如果一个单元格的值比它的所有相邻单元格的值都要大，那么这个单元格对应的最长递增路径是 1，这就是边界条件**。这个边界条件并不直观，而是需要根据矩阵中的每个单元格的值找到作为边界条件的单元格。

仍然使用方法一的思想，将矩阵看成一个有向图，计算每个单元格对应的出度，即有多少���边从该单元格出发。对于作为边界条件的单元格，该单元格的值比所有的相邻单元格的值都要大，因此**作为边界条件的单元格的出度都是 0**。

**基于出度的概念，可以使用拓扑排序求解**。从所有出度为 0 的单元格开始广度优先搜索，每一轮搜索都会遍历当前层的所有单元格，更新其余单元格的出度，并将出度变为 0 的单元格加入下一层搜索。当搜索结束时，搜索的总层数即为矩阵中的最长递增路径的长度。

**拓扑排序本质上就是不断删除入度/出度为0的广度优先搜索！**

## 参考代码

```c
class Solution {
    static constexpr int dir[4][2] = {{1,0},{-1,0},{0,1},{0,-1}};
public:
    int longestIncreasingPath(vector>& matrix) {
        int n = matrix.size();
        int m = matrix[0].size();
        if(n==0||m==0) return 0;
        vector> outDgree(n,vector(m,0));
        queue> q;
        for(int i = 0;i=0&&x=0&&ymatrix[i][j]){
                        outDgree[i][j]++;
                    }
                }
                //出度为0，加入队列
                if(outDgree[i][j]==0){
                    q.push({i,j});
                }
            }
        }
        int lip = 0;
        while(!q.empty()){
            ++lip;
            int size = q.size(); //BFS很重要一点注意这里提前取出这一层的节点数，不能放在for()表达式中取！
            for(int i = 0; i element = q.front();q.pop();        
                for(int k = 0;k =0&&x=0&&y

## 复杂度分析

-  时间复杂度：1813718137，其中 m 和 n 分别是矩阵的行数和列数。拓扑排序的时间复杂度是 1813718137，其中 V 是节点数，E 是边数。在矩阵中，1813718137，1813718137。 
-  空间复杂度：1813718137，其中 m 和 n 分别是矩阵的行数和列数。空间复杂度主要取决于队列，队列中的元素个数不会超过 1813718137。 

由于备忘录的原因，这题实际的BFS还没有DFS快。。。。