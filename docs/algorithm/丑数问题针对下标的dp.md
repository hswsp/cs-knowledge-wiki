---
title: "方法一：最小堆"
description: "[264. Ugly Number II](https://leetcode.cn/problems/ugly-number-ii/)"
---

[264. Ugly Number II](https://leetcode.cn/problems/ugly-number-ii/)



An ugly number is a positive integer whose prime factors are limited to 2, 3, and 5.

Given an integer n, return the nth ugly number.



Example 1:



> Input: n = 10  
Output: 12  
Explanation: [1, 2, 3, 4, 5, 6, 8, 9, 10, 12] is the sequence of the first 10 ugly numbers.
>



Example 2:



> Input: n = 1  
Output: 1  
Explanation: 1 has no prime factors, therefore all of its prime factors are limited to 2, 3, and 5.
>



# 方法一：最小堆


要得到从小到大的第 n 个丑数，可以使用最小堆实现。



初始时堆为空。首先将最小的丑数 1 加入堆。



每次取出堆顶元素 x，则 x 是堆中最小的丑数，由于 ![image](https://cdn.nlark.com/yuque/__latex/1d735e93163735f9dde08c5bf87d7085.svg)也是丑数，因此将 ![image](https://g.yuque.com/gr/latex?2x%2C%203x%2C%205x)加入堆。



**上述做法会导致堆中出现重复元素的情况。为了避免重复元素，可以使用哈希集合去重**，避免相同元素多次加入堆。



在排除重复元素的情况下，第 n 次从最小堆中取出的元素即为第 n 个丑数。



## 代码


```c
class Solution {
public:
    int nthUglyNumber(int n) {
        vector<int> factors = {2, 3, 5};
        unordered_set<long> seen;
        priority_queue<long, vector<long>, greater<long>> heap;
        seen.insert(1L);
        heap.push(1L);
        int ugly = 0;
        for (int i = 0; i < n; i++) {
            long curr = heap.top();
            heap.pop();
            ugly = (int)curr;
            for (int factor : factors) {
                long next = curr * factor;
                if (!seen.count(next)) {
                    seen.insert(next);
                    heap.push(next);
                }
            }
        }
        return ugly;
    }
};
```



# 方法二：动态规划


定义数组 ![image](https://g.yuque.com/gr/latex?%5Ctextit%7Bdp%7D)，其中 ![image](https://g.yuque.com/gr/latex?%5Ctextit%7Bdp%7D%5Bi%5D) 表示第 i 个丑数，第 n 个丑数即为 ![image](https://g.yuque.com/gr/latex?%5Ctextit%7Bdp%7D%5Bn%5D)。



由于最小的丑数是 1，因此 ![image](https://g.yuque.com/gr/latex?%5Ctextit%7Bdp%7D%5B1%5D%3D1)。



如何得到其余的丑数呢？定义三个指针 ![image](https://g.yuque.com/gr/latex?p_2),![image](https://g.yuque.com/gr/latex?p_3),![image](https://g.yuque.com/gr/latex?p_5) ，表示下一个丑数是当前指针指向的丑数乘以对应的质因数。初始时，三个指针的值都是 11。



当 ![image](https://g.yuque.com/gr/latex?2%20%5Cle%20i%20%5Cle%20n) 时，令 ![image](https://g.yuque.com/gr/latex?%5Ctextit%7Bdp%7D%5Bi%5D%3D%5Cmin(%5Ctextit%7Bdp%7D%5Bp_2%5D%20%5Ctimes%202%2C%20%5Ctextit%7Bdp%7D%5Bp_3%5D%20%5Ctimes%203%2C%20%5Ctextit%7Bdp%7D%5Bp_5%5D%20%5Ctimes%205))，然后分别比较 ![image](https://g.yuque.com/gr/latex?%5Ctextit%7Bdp%7D%5Bi%5D) 和 ![image](https://g.yuque.com/gr/latex?%5Ctextit%7Bdp%7D%5Bp_2%5D%20%5Ctimes%202),![image](https://g.yuque.com/gr/latex?%5Ctextit%7Bdp%7D%5Bp_3%5D%20%5Ctimes%203),![image](https://g.yuque.com/gr/latex?%5Ctextit%7Bdp%7D%5Bp_5%5D%20%5Ctimes%205)是否相等，**如果相等则将对应的指针加 1**。



这样做本质上和方法一的最小堆一样，总是把最小的那个数取出来，依次乘以2,3,5取最小值！

## 正确性证明


对于 i>1，在计算 ![image](https://g.yuque.com/gr/latex?%5Ctextit%7Bdp%7D%5Bi%5D)时，指针 ![image](https://g.yuque.com/gr/latex?p_x(x%20%5Cin%20%5C%7B2%2C3%2C5%5C%7D)) 的含义是使得 ![image](https://g.yuque.com/gr/latex?%5Ctextit%7Bdp%7D%5Bj%5D%20%5Ctimes%20x%3E%5Ctextit%7Bdp%7D%5Bi-1%5D)的最小的下标 j，即当 ![image](https://g.yuque.com/gr/latex?j%20%5Cge%20p_x)时 ![image](https://g.yuque.com/gr/latex?%5Ctextit%7Bdp%7D%5Bj%5D%20%5Ctimes%20x%3E%5Ctextit%7Bdp%7D%5Bi-1%5D)，当 ![image](https://g.yuque.com/gr/latex?j%3Cp_x)时 ![image](https://g.yuque.com/gr/latex?%5Ctextit%7Bdp%7D%5Bj%5D%20%5Ctimes%20x%20%5Cle%20%5Ctextit%7Bdp%7D%5Bi-1%5D)。



因此，对于 i>1，在计算 ![image](https://g.yuque.com/gr/latex?%5Ctextit%7Bdp%7D%5Bi%5D)时，![image](https://g.yuque.com/gr/latex?%5Ctextit%7Bdp%7D%5Bp_2%5D%20%5Ctimes%202%2C%5Ctextit%7Bdp%7D%5Bp_3%5D%20%5Ctimes%203%2C%5Ctextit%7Bdp%7D%5Bp_5%5D%20%5Ctimes%205)都大于 ![image](https://g.yuque.com/gr/latex?%5Ctextit%7Bdp%7D%5Bi-1%5D)，![image](https://g.yuque.com/gr/latex?%5Ctextit%7Bdp%7D%5Bp_2-1%5D%20%5Ctimes%202),![image](https://g.yuque.com/gr/latex?%5Ctextit%7Bdp%7D%5Bp_3-1%5D%20%5Ctimes%203),![image](https://g.yuque.com/gr/latex?%5Ctextit%7Bdp%7D%5Bp_5-1%5D%20%5Ctimes%205)都小于或等于 ![image](https://g.yuque.com/gr/latex?%5Ctextit%7Bdp%7D%5Bi-1%5D)。

令 ![image](https://g.yuque.com/gr/latex?%5Ctextit%7Bdp%7D%5Bi%5D%3D%5Cmin(%5Ctextit%7Bdp%7D%5Bp_2%5D%20%5Ctimes%202%2C%20%5Ctextit%7Bdp%7D%5Bp_3%5D%20%5Ctimes%203%2C%20%5Ctextit%7Bdp%7D%5Bp_5%5D%20%5Ctimes%205))，则 ![image](https://g.yuque.com/gr/latex?%5Ctextit%7Bdp%7D%5Bi%5D%3E%5Ctextit%7Bdp%7D%5Bi-1%5D) 且 ![image](https://cdn.nlark.com/yuque/__latex/dd6da0edaef4ded360ab35ab1fbc1f5b.svg)是大于![image](https://cdn.nlark.com/yuque/__latex/1b11f0e8a4de4c1aa42c906dff5de862.svg)的最小的丑数。



在计算 ![image](https://g.yuque.com/gr/latex?%5Ctextit%7Bdp%7D%5Bi%5D)之后，会更新三个指针 ![image](https://g.yuque.com/gr/latex?p_2%2Cp_3%2Cp_5)，更新之后的指针将用于计算 ![image](https://g.yuque.com/gr/latex?%5Ctextit%7Bdp%7D%5Bi%2B1%5D)，同样满足 ![image](https://g.yuque.com/gr/latex?%5Ctextit%7Bdp%7D%5Bi%2B1%5D%3E%5Ctextit%7Bdp%7D%5Bi%5D)且 ![image](https://g.yuque.com/gr/latex?%5Ctextit%7Bdp%7D%5Bi%2B1%5D)是大于 ![image](https://g.yuque.com/gr/latex?%5Ctextit%7Bdp%7D%5Bi%5D)的最小的丑数。



## 代码


```c
class Solution {
public:
    int nthUglyNumber(int n) {
        vector<int> dp(n + 1);
        dp[1] = 1;
        int p2 = 1, p3 = 1, p5 = 1;
        for (int i = 2; i <= n; i++) {
            int num2 = dp[p2] * 2, num3 = dp[p3] * 3, num5 = dp[p5] * 5;
            dp[i] = min(min(num2, num3), num5);
            if (dp[i] == num2) {
                p2++;
            }
            if (dp[i] == num3) {
                p3++;
            }
            if (dp[i] == num5) {
                p5++;
            }
        }
        return dp[n];
    }
};
```



## **复杂度分析**


时间复杂度：![image](https://g.yuque.com/gr/latex?O(n))。需要计算数组 ![image](https://g.yuque.com/gr/latex?%5Ctextit%7Bdp%7D)中的 n 个元素，每个元素的计算都可以在 ![image](https://g.yuque.com/gr/latex?O(1))的时间内完成。



空间复杂度：![image](https://g.yuque.com/gr/latex?O(n))。空间复杂度主要取决于数组 ![image](https://g.yuque.com/gr/latex?%5Ctextit%7Bdp%7D)的大小。

