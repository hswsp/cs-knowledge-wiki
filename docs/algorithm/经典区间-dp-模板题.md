---
title: "题目描述"
description: "这是 LeetCode 上的「516. 最长回文子序列」，难度为「中等」。"
---

# 题目描述


这是 LeetCode 上的**「516. 最长回文子序列」**，难度为**「中等」**。

> Tag : 「动态规划」、「区间 DP」
>



给你一个字符串 `s` ，找出其中最长的回文子序列，并返回该序列的长度。



子序列定义为：不改变剩余字符顺序的情况下，删除某些字符或者不删除任何字符形成的一个序列。



示例 1：

```bash
输入：s = "bbbab"

输出：4

解释：一个可能的最长回文子序列为 "bbbb" 。
```



示例 2：

```bash
输入：s = "cbbd"

输出：2

解释：一个可能的最长回文子序列为 "bb" 。
```



提示：

+ ![image](https://g.yuque.com/gr/latex?1%20%5Cle%20s.length%20%5Cle%201000)
+ `s` 仅由小写英文字母组成



# 区间动态规划


这是一道经典的区间 DP 题。



**之所以可以使用区间 DP 进行求解，是因为在给定一个回文串的基础上，如果在回文串的边缘分别添加两个新的字符，可以通过判断两字符是否相等来得知新串是否回文。**



也就是说，使用小区间的回文状态可以推导出大区间的回文状态值。



+ **从图论意义出发就是，任何一个长度为 **![image](https://g.yuque.com/gr/latex?len)** 的回文串，****必然由「长度为**![image](https://g.yuque.com/gr/latex?len-1)** 」****（比如**![image](https://cdn.nlark.com/yuque/__latex/ebd187e0d41573487a8dca3bdc576fd6.svg)**->**![image](https://cdn.nlark.com/yuque/__latex/b1099681b3cc31078636c042365dd89a.svg)**）****或「长度为**![image](https://g.yuque.com/gr/latex?len-2)** 」（两边插入）的回文串转移而来。**
+ **两个具有****公共回文部分****的回文串之间存在拓扑序（存在由「长度较小」回文串指向「长度较大」回文串的有向边）。**



通常区间 DP 问题都是，常见的基本流程为：

1. 从小到大枚举区间大小![image](https://g.yuque.com/gr/latex?len)
2. 枚举区间左端点 ，同时根据区间大小![image](https://g.yuque.com/gr/latex?len) 和左端点计算出区间右端点![image](https://g.yuque.com/gr/latex?r%20%3D%20l%2Blen-1)
3. 通过状态转移方程求![image](https://g.yuque.com/gr/latex?f%5Bl%5D%5Br%5D) 的值



因此，我们 **定义**![image](https://g.yuque.com/gr/latex?f%5Bl%5D%5Br%5D)** 为考虑区间**![image](https://g.yuque.com/gr/latex?%5Bl%2Cr%5D)** 的最长回文子序列长度为多少。**



不失一般性的考虑![image](https://g.yuque.com/gr/latex?f%5Bl%5D%5Br%5D) 该如何转移。



由于我们的状态定义 **没有限制** 回文串中必须要选![image](https://g.yuque.com/gr/latex?s%5Bl%5D) 或者![image](https://g.yuque.com/gr/latex?s%5Br%5D) 。



我们对边界字符![image](https://g.yuque.com/gr/latex?s%5Bl%5D) 和 ![image](https://g.yuque.com/gr/latex?s%5Br%5D)分情况讨论，最终的 ![image](https://g.yuque.com/gr/latex?f%5Bl%5D%5Br%5D) 应该在如下几种方案中取 ![image](https://g.yuque.com/gr/latex?max)：

+  形成的回文串一定不包含![image](https://g.yuque.com/gr/latex?s%5Bl%5D)  和![image](https://g.yuque.com/gr/latex?s%5Br%5D)  ，即完全不考虑![image](https://g.yuque.com/gr/latex?s%5Bl%5D)和![image](https://g.yuque.com/gr/latex?s%5Br%5D) ：

 ![image](https://g.yuque.com/gr/latex?f%5Bl%5D%5Br%5D%20%3D%20f%5Bl%2B1%5D%5Br-1%5D%0A) 

+  形成的回文串**可能**包含![image](https://g.yuque.com/gr/latex?s%5Bl%5D) ，但**一定不**包含![image](https://g.yuque.com/gr/latex?s%5Br%5D) ：

 ![image](https://g.yuque.com/gr/latex?f%5Bl%5D%5Br%5D%20%3D%20f%5Bl%5D%5Br-1%5D%0A) 

+  形成的回文串**可能**包含![image](https://g.yuque.com/gr/latex?s%5Br%5D) ，但**一定不**包含![image](https://g.yuque.com/gr/latex?s%5Bl%5D) ：

 ![image](https://g.yuque.com/gr/latex?f%5Bl%5D%5Br%5D%20%3D%20f%5Bl%2B1%5D%5Br%5D%0A) 

+  形成的回文串可能包含![image](https://g.yuque.com/gr/latex?s%5Bl%5D) ，也可能包含![image](https://g.yuque.com/gr/latex?s%5Br%5D) ，根据![image](https://g.yuque.com/gr/latex?s%5Bl%5D)和 ![image](https://g.yuque.com/gr/latex?s%5Br%5D)是否相等： 

![](https://cdn.nlark.com/yuque/0/2022/png/22382307/1668478740561-8d495429-d34b-4beb-8df0-6cd4262851a0.png)



需要说明的是，上述几种情况可以**确保我们做到「不漏」，但不能确保「不重」**，对于**求最值问题，我们只需要确保「不漏」即可**，某些状态重复参与比较，不会影响结果的正确性。



> 一些细节：**我们需要特判掉长度为 1 和 2 的两种基本情况**。当长度为1时，必然回文，当长度为 2 时，当且仅当两字符相等时回文。
>



## 代码：
Java：

```java
class Solution {
    public int longestPalindromeSubseq(String s) {
        int n = s.length();
        char[] cs = s.toCharArray();
        int[][] f = new int[n][n]; 
        for (int len = 1; len <= n; len++) {
            for (int l = 0; l + len - 1 < n; l++) {
                int r = l + len - 1;
                if (len == 1) {
                    f[l][r] = 1;
                } else if (len == 2) {
                    f[l][r] = cs[l] == cs[r] ? 2 : 1;
                } else {
                    f[l][r] = Math.max(f[l + 1][r], f[l][r - 1]);
                    f[l][r] = Math.max(f[l][r], f[l + 1][r - 1] + (cs[l] == cs[r] ? 2 : 0));
                }
            }
        }
        return f[0][n - 1];
    }
}
```



我们也可以不枚举区间大小![image](https://g.yuque.com/gr/latex?len)，而是枚举每一个固定的左边界![image](https://cdn.nlark.com/yuque/__latex/6945e109777fe3fd777e8254f0ec0f0c.svg)对应的所有右边界![image](https://cdn.nlark.com/yuque/__latex/72cb3a229067770aeb6caa625a65a1a1.svg), c++代码如下:

```cpp
 int longestPalindromeSubseq(string s) {
        int n = s.size();
        // dp 数组全部初始化为 0
        vector<vector<int>> dp(n, vector<int>(n, 0));
        // base case
        for (int i = 0; i < n; i++)
            dp[i][i] = 1;
        // 反着遍历保证正确的状态转移
        for (int i = n - 1; i >= 0; i--) {
            for (int j = i + 1; j < n; j++) {
                // 状态转移方程
                if (s[i] == s[j])
                    dp[i][j] = dp[i + 1][j - 1] + 2;
                else
                    dp[i][j] = max(dp[i + 1][j], dp[i][j - 1]);
            }
        }
        // 整个 s 的最长回文子串长度
        return dp[0][n - 1];
    }
```



+ 时间复杂度：![image](https://g.yuque.com/gr/latex?O(n%5E2))
+ 空间复杂度：![image](https://g.yuque.com/gr/latex?O(n%5E2))

