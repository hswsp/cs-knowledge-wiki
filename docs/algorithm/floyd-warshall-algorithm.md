---
title: "Floyd算法介绍"
description: "和Dijkstra算法一样，弗洛伊德(Floyd)算法也是一种用于寻找给定的加权图中顶点间最短路径的算法。该算法名称以创始人之一、1978年图灵奖获得者、斯坦福大学计算机科学系教授罗伯特·弗洛伊德命名。"
---

> 参考文档：[Floyd Warshall Algorithm | DP-16](https://www.geeksforgeeks.org/floyd-warshall-algorithm-dp-16/)
>

# Floyd算法介绍


和Dijkstra算法一样，弗洛伊德(Floyd)算法也是一种用于寻找给定的加权图中顶点间最短路径的算法。该算法名称以创始人之一、1978年图灵奖获得者、斯坦福大学计算机科学系教授罗伯特·弗洛伊德命名。



# 基本思想


通过Floyd计算图G=(V,E)中各个顶点的最短路径时，需要引入一个矩阵S，矩阵S中的元素`a[i][j]`表示顶点i(第i个顶点)到顶点j(第j个顶点)的距离。



假设图G中顶点个数为N，则需要对矩阵S进行N次更新。



初始时，矩阵S中顶点`a[i][j]`的距离为顶点i到顶点j的权值；如果i和j不相邻，则`a[i][j]=∞`。 



接下来开始，对矩阵S进行N次更新。



第1次更新时，如果"`a[i][j]`的距离" > "`a[i][0]+a[0][j]`"(`a[i][0]+a[0][j]`表示"i与j之间经过第1个顶点的距离")，则更新`a[i][j]`为"`a[i][0]+a[0][j]`"。 



同理，第k次更新时，如果"`a[i][j]`的距离" > "`a[i][k]+a[k][j]`"，则更新`a[i][j]`为"`a[i][k]+a[k][j]`"。更新N次之后，操作完成！



单纯的看上面的理论可能比较难以理解，下面通过实例来对该算法进行说明。



# **Floyd算法图解**


![](https://images.spumn.eu.cc/blog/24614bd460c20819.jpg)



以上图G4为例，来对弗洛伊德进行算法演示。



![](https://images.spumn.eu.cc/blog/7ddc2f9948022a33.jpg)



**初始状态**：S是记录各个顶点间最短路径的矩阵。



**第1步**：初始化S。



矩阵S中顶点`a[i][j]`的距离为顶点i到顶点j的权值；如果i和j不相邻，则`a[i][j]=∞`。实际上，就是将图的原始矩阵复制到S中。



注:`a[i][j]`表示矩阵S中顶点i(第i个顶点)到顶点j(第j个顶点)的距离。



**第2步**：以顶点A(第1个顶点)为中介点，若`a[i][j] > a[i][0]+a[0][j]`，则设置`a[i][j]=a[i][0]+a[0][j]`。



以顶点`a[1][6]`(即顶点B和顶点G之间的距离为例)，上一步操作之后，`a[1][6]=∞`；而将A作为中介点时，(B,A)=12，(A,G)=14，因此B和G之间的距离可以更新为26。



同理，依次将顶点B,C,D,E,F,G作为中介点，并更新`a[i][j]`的大小。



# **Floyd算法的代码说明**


以"邻接矩阵"为例对弗洛伊德算法进行说明，对于"邻接表"实现的图在后面会给出相应的源码。



```c
// C++ Program for Floyd Warshall Algorithm
#include <bits/stdc++.h>
using namespace std;

// Number of vertices in the graph
#define V 4

/* Define Infinite as a large enough
value.This value will be used for
vertices not connected to each other */
#define INF 99999

// A function to print the solution matrix
void printSolution(int dist[][V]);

// Solves the all-pairs shortest path
// problem using Floyd Warshall algorithm
void floydWarshall(int graph[][V])
{
	/* dist[][] will be the output matrix
	that will finally have the shortest
	distances between every pair of vertices */
	int dist[V][V], i, j, k;

	/* Initialize the solution matrix same
	as input graph matrix. Or we can say
	the initial values of shortest distances
	are based on shortest paths considering
	no intermediate vertex. */
	for (i = 0; i < V; i++)
		for (j = 0; j < V; j++)
			dist[i][j] = graph[i][j];

	/* Add all vertices one by one to
	the set of intermediate vertices.
	---> Before start of an iteration,
	we have shortest distances between all
	pairs of vertices such that the
	shortest distances consider only the
	vertices in set {0, 1, 2, .. k-1} as
	intermediate vertices.
	----> After the end of an iteration,
	vertex no. k is added to the set of
	intermediate vertices and the set becomes {0, 1, 2, ..
	k} */
	for (k = 0; k < V; k++) {
		// Pick all vertices as source one by one
		for (i = 0; i < V; i++) {
			// Pick all vertices as destination for the
			// above picked source
			for (j = 0; j < V; j++) {
				// If vertex k is on the shortest path from
				// i to j, then update the value of
				// dist[i][j]
				if (dist[i][j] > (dist[i][k] + dist[k][j]))
					dist[i][j] = dist[i][k] + dist[k][j];
			}
		}
	}

	// Print the shortest distance matrix
	printSolution(dist);
}

/* A utility function to print solution */
void printSolution(int dist[][V])
{
	cout << "The following matrix shows the shortest "
			"distances"
			" between every pair of vertices \n";
	for (int i = 0; i < V; i++) {
		for (int j = 0; j < V; j++) {
			if (dist[i][j] == INF)
				cout << "INF"
					<< "	 ";
			else
				cout << dist[i][j] << "	 ";
		}
		cout << endl;
	}
}

// Driver code
int main()
{
	/* Let us create the following weighted graph
			10
	(0)------->(3)
		|	 /|\
	5 |	 |
		|	 | 1
	\|/	 |
	(1)------->(2)
			3	 */
	int graph[V][V] = { { 0, 5, INF, 10 },
						{ INF, 0, 3, INF },
						{ INF, INF, 0, 1 },
						{ INF, INF, INF, 0 } };

	// Print the solution
	floydWarshall(graph);
	return 0;
}

// This code is contributed by Mythri J L
```



# 最大距离说明


标准 Dijkstra 算法是计算最短路径的，但你有想过为什么 Dijkstra 算法不允许存在负权重边么？



**因为 Dijkstra 计算最短路径的正确性依赖一个前提：路径中每增加一条边，路径的总权重就会增加**。



**如果你想计算最长路径，路径中每增加一条边，路径的总权重就会减少，要是能够满足这个条件，也可以用 Dijkstra 算法。**

****

同理**，**Floyd算法同样求最长路径，只需要改成



```cpp
if(dist[i][j]<dist[i][k]+dist[k][j])
{
    dist[i][j]=dist[i][k]+dist[k][j];
}
```





