---
title: "题目描述"
description: "[2290. Minimum Obstacle Removal to Reach Corner](https://leetcode.cn/problems/minimum-obstacle-removal-to-reach-corner/)"
---

# 题目描述


[2290. Minimum Obstacle Removal to Reach Corner](https://leetcode.cn/problems/minimum-obstacle-removal-to-reach-corner/)



You are given a 0-indexed 2D integer array grid of size m x n. Each cell has one of two values:

+ `0` represents an **empty** cell,
+ `1` represents an **obstacle** that may be removed.



You can move up, down, left, or right from and to an empty cell.



Return the minimum number of obstacles to remove so you can move from the upper left corner `(0, 0)` to the lower right corner `(m - 1, n - 1)`.



**Example 1:**



![](https://assets.leetcode.com/uploads/2022/04/06/example1drawio-1.png)



```bash
Input: grid = [[0,1,1],[1,1,0],[1,1,0]]
Output: 2
Explanation: We can remove the obstacles at (0, 1) and (0, 2) to create a path from (0, 0) to (2, 2).
It can be shown that we need to remove at least 2 obstacles, so we return 2.
Note that there may be other ways to remove 2 obstacles to create a path.
```



**Example 2:**



```c
Input: grid = [[0,1,0,0,0],[0,1,0,1,0],[0,0,0,1,0]]
Output: 0
Explanation: We can move from (0, 0) to (2, 4) without removing any obstacles, so we return 0.
```



# 解题思路


**把障碍物当作可以经过的单元格，经过它的代价为 1，空单元格经过的代价为 0。**

问题转化成从起点到终点的最短路。

我们可以用 Dijkstra，但还可以用 0-1 BFS 来将时间复杂度优化至 ![image](https://g.yuque.com/gr/latex?O(mn))。

# Dijkstra BFS搜索
**本质上Dijkstra算法就是BFS寻找最短路径的拓展版本。通常的BFS搜索只能搜索每次权重增加1的单源最短路径，这样才能保证队列里的元素单调递增。**



把所有格子都视为可走的格子。当走进障碍时距离加一，走进空地时距离不增加。我们只要求出从左上到右下的最短路即可。

```c
class Solution {
    static constexpr int dir[4][2] = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

public:
    int minimumObstacles(vector<vector<int>>& grid) {
        int n = grid.size(), m = grid[0].size();
        vector<vector<int>> dis(n,vector<int>(m,-1));
        auto cmp  = [](array<int,3>& a, array<int,3>& b){
            return a[0]>b[0];
        };
        priority_queue<array<int,3>,vector<array<int,3>>,decltype(cmp)> q(cmp);
        q.push({0,0,0});
        while (!q.empty()) {
            array<int,3> p = q.top(); q.pop();
            int i = p[1], j = p[2];
            if (dis[i][j] >= 0) continue;//表示已经访问过了，不再访问！！
            dis[i][j] = p[0]; //更新为最新的（即队头的）dis
            for (int k = 0; k < 4; k++) {
                int ii = i + dir[k][0], jj = j + dir[k][1];
                if (ii < 0 || jj < 0 || ii >= n || jj >= m) continue;
                q.push({dis[i][j] + grid[ii][jj], ii, jj});
            }
        }
        return dis[n - 1][m - 1];
    }
};
```



需要注意的是：这里使用`array<int,3>`，使用`vector<int>`会超时！



# 0-1 广度优先搜索


常规的广度优先搜索可以找出在**边权均为 1 时**的单源最短路，然而在我们的建模中，边权除了 1 之外也可能为 0。我们是否可以修改广度优先搜索的算法框架，使得它可以找出在边权为 0 或 1 时的单源最短路呢？



答案是可以的。这种修改过的广度优先搜索被称为「0-1 广度优先搜索」，[这里](https://leetcode.cn/link/?target=https://codeforces.com/blog/entry/22276) 有一篇很详细的教程。



保证广度优先搜索正确性的基础在于：**对于源点 s 以及任意两个节点 u 和 v，如果 **![image](https://g.yuque.com/gr/latex?%5Ctextit%7Bdist%7D(s%2C%20u)%20%3C%20%5Ctextit%7Bdist%7D(s%2C%20v))**（其中 **![image](https://g.yuque.com/gr/latex?%5Ctextit%7Bdist%7D(x%2C%20y))**表示从节点 x 到节点 y 的最短路长度），那么节点 u 一定会比节点 vv 先被取出队列**。在常规的广度优先搜索中，我们使用队列作为维护节点的数据结构，就保证了从队列中取出的节点，它们与源点之间的距离是单调递增的。然而如果边权可能为 0，就会出现如下的情况：



+ 源点 s被取出队列；
+ 源点 s 到节点 ![image](https://g.yuque.com/gr/latex?v_1) 有一条权值为 1 的边，将节点 ![image](https://g.yuque.com/gr/latex?v_1)加入队列；
+ 源点 s到节点 ![image](https://g.yuque.com/gr/latex?v_2)有一条权值为 0 的边，将节点 ![image](https://g.yuque.com/gr/latex?v_2)加入队列；



此时节点 ![image](https://g.yuque.com/gr/latex?v_2)一定会在节点 ![image](https://g.yuque.com/gr/latex?v_1)之后被取出队列，但节点 ![image](https://g.yuque.com/gr/latex?v_2)与源点之间的距离反而较小，这样就破坏了广度优先搜索正确性的基础。



**常规的广度优先搜索，我们都是从队尾放置新的节点，从对头取出最小的节点。这对于权值为正数而言，是正确的，因为每一次搜索后权值一定在不断增大。但是由于这里有0值，此时会导致新的节点的权值(**![image](https://g.yuque.com/gr/latex?%5Ctextit%7Bdist%7D(s%2C%20u)'%20%3D%20%5Ctextit%7Bdist%7D(s%2C%20u)%20%2B%200)**跟队头的节点权值是一样的！！同样是整个队列中最小的！！！！此时应该继续放到对头，表示最小权重。**



那么我们如何修改广度优先搜索的算法框架呢？我们可以使用双端队列（double-ended queue, deque）代替普通的队列作为维护节点的数据结构。当任一节点 u 被取出队列时，如果它到某节点 ![image](https://g.yuque.com/gr/latex?v_i)有一条权值为 0 的边，那么就将节点 ![image](https://g.yuque.com/gr/latex?v_i)加入双端队列的「队首」。如果它到某节点 ![image](https://g.yuque.com/gr/latex?v_j)有一条权值为 1 的边，那么和常规的广度优先搜索相同，我们将节点 ![image](https://g.yuque.com/gr/latex?v_j)加入双端队列的「队尾」。这样以来，我们保证了任意时刻从队首到队尾的所有节点，它们与源点之间的距离是单调递增的，即从队列中取出的节点与源点之间的距离同样是单调递增的。



0-1 广度优先搜索的实现其实与 Dijkstra 算法非常相似。在 Dijkstra 算法中，我们用优先队列保证了距离的单调递增性。而在 0-1 广度优先搜索中，实际上任意时刻队列中的节点与源点的距离均为 d 或 ![image](https://g.yuque.com/gr/latex?d%20%2B%201)（其中 dd 为某一非负整数），并且所有与源点距离为 d 的节点都出现在队首附近，所有与源点距离为 ![image](https://g.yuque.com/gr/latex?d%20%2B%201) 的节点都出现在队尾附近。因此，我们只要使用双端队列，对于边权为 0 和 1 的两种情况分别将对应节点添加至队首和队尾，就保证了距离的单调递增性。



## 代码


```c
class Solution {
    static constexpr int dirs[4][2] = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
public:
    int minimumObstacles(vector<vector<int>>& grid) {
        int m = grid.size(), n = grid[0].size();
        vector<vector<int>> dis(m,vector<int>(n,INT_MAX));
        dis[0][0] = 0;
        deque<pair<int, int>> q;
        q.emplace_front(0, 0);
        while (!q.empty()) {
            auto [x, y] = q.front();
            q.pop_front();
            for (auto &[dx, dy] : dirs) {
                int nx = x + dx, ny = y + dy;
                if (nx<0 || nx >= m || ny<0 || ny >= n) {
                   continue;
                }
               int g = grid[nx][ny];
               if (dis[x][y] + g < dis[nx][ny]) {
                   dis[nx][ny] = dis[x][y] + g;
                   g == 0 ? q.emplace_front(nx, ny) : q.emplace_back(nx, ny);
              }
            }
        }
        return dis[m - 1][n - 1];
    }
};
```

## 复杂度分析
+ 时间复杂度：![image](https://g.yuque.com/gr/latex?O(mn))。
+ 空间复杂度：![image](https://g.yuque.com/gr/latex?O(mn))。



> 类似的题目还有：[1368. Minimum Cost to Make at Least One Valid Path in a Grid](https://leetcode.cn/problems/minimum-cost-to-make-at-least-one-valid-path-in-a-grid/)
>

