---
title: "丑数问题:针对下标的DP"
description: "264. Ugly Number IIAn ugly number is a positive integer whose prime factors are limited to 2, 3, and 5.Given an integer n, return the nth ugly numb..."
---

# 丑数问题:针对下标的DP

[264. Ugly Number II](https://leetcode.cn/problems/ugly-number-ii/)
​

An ugly number is a positive integer whose prime factors are limited to 2, 3, and 5.
Given an integer n, return the nth ugly number.

Example 1:

Input: n = 10
Output: 12
Explanation: [1, 2, 3, 4, 5, 6, 8, 9, 10, 12] is the sequence of the first 10 ugly numbers.

Example 2:

Input: n = 1
Output: 1
Explanation: 1 has no prime factors, therefore all of its prime factors are limited to 2, 3, and 5.

# 方法一：最小堆

要得到从小到大的第 n 个丑数，可以使用最小堆实现。

初始时堆为空。首先将最小的丑数 1 加入堆。

每次取出堆顶元素 x，则 x 是堆中最小的丑数，由于 1813718137也是丑数，因此将 1813718137加入堆。

**上述做法会导致堆中出现重复元素的情况。为了避免重复元素，可以使用哈希集合去重**，避免相同元素多次加入堆。

在排除重复元素的情况下，第 n 次从最小堆中取出的元素即为第 n 个丑数。

## 代码

```c
class Solution {
public:
    int nthUglyNumber(int n) {
        vector factors = {2, 3, 5};
        unordered_set seen;
        priority_queue, greater> heap;
        seen.insert(1L);
        heap.push(1L);
        int ugly = 0;
        for (int i = 0; i 

# 方法二：动态规划

定义数组 1813718137，其中 1813718137 表示第 i 个丑数，第 n 个丑数即为 1813718137。

由于最小的丑数是 1，因此 1813718137。

如何得到其余的丑数呢？定义三个指针 1813718137,1813718137,1813718137 ，表示下一个丑数是当前指针指向的丑数乘以对应的质因数。初始时，三个指针的值都是 11。

当 1813718137 时，令 1813718137，然后分别比较 1813718137 和 1813718137,1813718137,1813718137是否相等，**如果相等则将对应的指针加 1**。

这样做本质上和方法一的最小堆一样，总是把最小的那个数取出来，依次乘以2,3,5取最小值！
## 正确性证明

对于 i>1，在计算 1813718137时，指针 1813718137 的含义是使得 1813718137的最小的下标 j，即当 1813718137时 1813718137，当 1813718137时 1813718137。

因此，对于 i>1，在计算 1813718137时，1813718137都大于 1813718137，1813718137,1813718137,1813718137都小于或等于 1813718137。
令 1813718137，则 1813718137 且 1813718137是大于1813718137的最小的丑数。

在计算 1813718137之后，会更新三个指针 1813718137，更新之后的指针将用于计算 1813718137，同样满足 1813718137且 1813718137是大于 1813718137的最小的丑数。

## 代码

```c
class Solution {
public:
    int nthUglyNumber(int n) {
        vector dp(n + 1);
        dp[1] = 1;
        int p2 = 1, p3 = 1, p5 = 1;
        for (int i = 2; i 

## **复杂度分析**

时间复杂度：1813718137。需要计算数组 1813718137中的 n 个元素，每个元素的计算都可以在 1813718137的时间内完成。

空间复杂度：1813718137。空间复杂度主要取决于数组 1813718137的大小。