---
title: "题目描述"
description: "[395. Longest Substring with At Least K Repeating Characters](https://leetcode.cn/problems/longest-substring-with-at-lea"
---

# 题目描述


[395. Longest Substring with At Least K Repeating Characters](https://leetcode.cn/problems/longest-substring-with-at-least-k-repeating-characters/)



Given a string `s` and an integer `k`, return the length of the longest substring of `s` such that the frequency of each character in this substring is greater than or equal to `k`.



**Example 1:**



```bash
Input: s = "aaabb", k = 3
Output: 3
Explanation: The longest substring is "aaa", as 'a' is repeated 3 times.
```



**Example 2:**



```bash
Input: s = "ababbc", k = 2
Output: 5
Explanation: The longest substring is "ababb", as 'a' is repeated 2 times and 'b' is repeated 3 times.
```



**Constraints:**

+ $1 <= s.length <= 10^4$
+ `s`**consists of only lowercase English letters.**
+ $1 <= k <= 10^5$

## 分治


解决思路：当我们采用常规的分析思路发现无法进行时，要去**关注一下数据范围中「数值小」的值。**因为数值小其实是代表了「可枚举」，往往是解题或者降低复杂度的一个重要（甚至是唯一）的突破口。



对于字符串 s，如果存在某个字符 $\textit{ch}$，它的出现次数大于 0 且小于 k，则任何包含 $\textit{ch}$ 的子串都不可能满足要求。也就是说，**我们将字符串按照**$\textit{ch}$**切分成若干段**，则满足要求的最长子串一定出现在某个被切分的段内，而不能跨越一个或多个段。因此，可以考虑分治的方式求解本题。



### 代码


```c
class Solution {
    int longestSubstringDfs(string& s, int k, int l, int r){
        array<int,26> count {};
        //统计数目
        for(int i = l;i <= r;++i){
            count[s[i]-'a']++;
        }
        //找出任意一个分界点，可能有多个字符出现次数都小于k，没关系，后面的交给递归。
        char split = 0;
        for(int i=0;i<26;++i){
            //这里注意必须有count[i]>0保证出现在s中，或者用map存储各个元素个数也行。
            if(count[i]>0 && count[i]<k){
                split = 'a' + i;
                break;
            }
        }
        //全部满足条件
        if(split==0) return r-l+1;
        int start = l;
        int maxlen = 0;
        while(start<=r){
            //略过分界点
            while(start<=r&&s[start]==split) start++;
            if(start > r) break;
            int i = start;
            //找下一个分界点。
            //这步结束后返回的start是新的分界点或者r+1
            while(start<=r&&s[start]!=split)start++;
            
            maxlen = max(maxlen,longestSubstringDfs(s,k,i,start-1));
        }
        return maxlen;
    }
public:
    int longestSubstring(string s, int k) {
        return longestSubstringDfs(s,k,0,s.size() - 1);
    }
};
```



### **复杂度分析**


+ 时间复杂度：$O(N\cdot |\Sigma|)$，其中 $N$ 为字符串的长度，$\Sigma$为字符集，本题中字符串仅包含小写字母，因此$\mid \Sigma \mid =26$ 。由于**每次递归调用都会完全去除某个字符**，因此递归深度最多为$\mid \Sigma \mid$。
+ 空间复杂度：$O(|\Sigma|^2)$。递归的深度为 $O(|\Sigma|)$，每层递归需要开辟 $O(|\Sigma|)$的额外空间。



## 枚举 + 双指针


其实看到这道题，我第一反应是「二分」，直接「二分」答案。



但是往下分析就能发现「二分」不可行，因为不具有**二段性质**。**也就是假设有长度**`t`**的一段区间满足要求的话，**`t + 1`**长度的区间是否「一定满足」或者「一定不满足」呢？**



显然并不一定，是否满足取决于 `t + 1` 个位置出现的字符在不在原有区间内。



举个🌰吧，假设我们已经画出来一段长度为 `t` 的区间满足要求（且此时 k > 1），那么当我们将长度扩成 `t + 1` 的时候（无论是往左扩还是往右扩）：



+ 如果新位置的字符在原有区间**出现过**，那必然还是满足出现次数大于 k，这时候 `t + 1`**的长度满足要求**
+ 如果新位置的字符在原有区间**没出现过**，那新字符的出现次数只有一次，这时候 `t + 1`**的长度不满足要求**



因此我们无法是使用「二分」，相应的也无法直接使用「滑动窗口」思路的双指针。因为**双指针其实也是利用了二段性质，当一个指针确定在某个位置，另外一个指针能够落在某个明确的分割点，使得左半部分满足，右半部分不满足。**



滑动窗口本质上来源于单调性，一般可以理解为，**随着左端点位置的增加，其最优决策的右端点位置单调不减。**事实上是利用决策单调性来实现复杂度优化。



**那么还有什么性质可以利用呢？这时候要留意数据范围「数值小」的内容。**



题目说明了只包含小写字母（26 个，为有限数据），**我们可以枚举最大长度所包含的字符类型数量，答案必然是 [1, 26]，即最少包含 1 个字母，最多包含 26 个字母。**



你会发现，**当确定了长度所包含的字符种类数量时，区间重新具有了二段性质。**这是本题的滑动窗口解法和迄今为止做的滑动窗口题目的最大不同，本题需要手动增加限制，即限制窗口内字符种类。



当我们使用双指针的时候：

+ 右端点往右移动必然会导致字符类型数量增加（或不变）
+ 左端点往右移动必然会导致字符类型数量减少（或不变）



因此我们需要先利用字符数量有限性（可枚举）作为切入点，使得**「****答案子串的左边界左侧的字符以及右边界右侧的字符一定不会出现在子串中」这一性质在双指针的实现下具有单调性****。**也就是题解说的「让区间重新具有二段性质」，解释如下：



我们枚举最长子串中的**字符种类数目**，它最小为 1，最大为 $|\Sigma|$（字符集的大小，本题中为 26）。



对于给定的字符种类数量 t，我们维护滑动窗口的左右边界 l,r、滑动窗口内部每个字符出现的次数 $\textit{cnt}$，以及滑动窗口内的字符种类数目 $\textit{total}$。当 $\textit{total} > t$ 时，我们不断地右移左边界 l，并对应地更新 $\textit{cnt}$以及 $\textit{total}$，直到 $\textit{total} \le t$ 为止。这样，对于任何一个右边界 r，我们都能找到最小的 l（记为 $l_{min}$），使得 $s[l_{min}...r]$ 之间的字符种类数目不多于 t。



对于任何一组 $l_{min}, r$而言，如果 $s[l_{min}...r]$之间存在某个出现次数小于 k （且不为 0，下文不再特殊说明）的字符，我们可以断定：对于任何 $l' \in (l_{min}, r)$ 而言，$s[l'...r]$依然不可能是满足题意的子串，因为：

+ 要么该字符的出现次数降为 0，此时子串内虽然少了一个出现次数小于 k 的字符，**但字符种类数目也随之小于 t 了**；
+ 要么该字符的出现次数降为非 0 整数，此时该字符的出现次数依然小于 k。



可以看出，当我们指定字符种类数目t的时候，使得**「****答案子串的左边界左侧的字符以及右边界右侧的字符一定不会出现在子串中」这一性质在双指针的实现下具有单调性****。**



根据上面的结论，我们发现：当限定字符种类数目为 t 时，满足题意的最长子串，就一定出自某个 $s[l_{min}...r]$。因此，在滑动窗口的维护过程中，就可以直接得到最长子串的大小。



此外还剩下一个细节：如何判断某个子串内的字符是否都出现了至少 k 次？我们当然可以每次遍历 $\textit{cnt}$ 数组，但是这会带来 $O(|\Sigma|)$的额外开销。



我们可以维护一个计数器 $\textit{less}$，代表当前出现次数小于 k 的字符的数量。注意到：每次移动滑动窗口的边界时，只会让某个字符的出现次数加一或者减一。对于移动右边界 l 的情况而言：



当某个字符的出现次数从 0 增加到 1 时，将 $\textit{less}$加一；



当某个字符的出现次数从 $k-1$ 增加到 $k$ 时，将 $\textit{less}$ 减一。



对于移动左边界的情形，讨论是类似的。



通过维护额外的计数器 $\textit{less}$，我们无需遍历 $\textit{cnt}$ 数组，就能知道每个字符是否都出现了至少 $k$ 次，同时可以在每次循环时，在常数时间内更新计数器的取值。读者可以自行思考 $k=1$ 时的处理逻辑。



### 代码


```java
class Solution {
    public int longestSubstring(String s, int k) {
        int ans = 0;
        int n = s.length();
        char[] cs = s.toCharArray();
        int[] cnt = new int[26];
        for (int p = 1; p <= 26; p++) {
            Arrays.fill(cnt, 0);
            // tot 代表 [j, i] 区间所有的字符种类数量；sum 代表满足「出现次数不少于 k」的字符种类数量
            for (int i = 0, j = 0, tot = 0, sum = 0; i < n; i++) {
                int u = cs[i] - 'a';
                cnt[u]++;
                // 如果添加到 cnt 之后为 1，说明字符总数 +1
                if (cnt[u] == 1) tot++;
                // 如果添加到 cnt 之后等于 k，说明该字符从不达标变为达标，达标数量 + 1
                if (cnt[u] == k) sum++;
                // 当区间所包含的字符种类数量 tot 超过了当前限定的数量 p，那么我们要删除掉一些字母，即「左指针」右移
                while (tot > p) {
                    int t = cs[j++] - 'a';
                    cnt[t]--;
                    // 如果添加到 cnt 之后为 0，说明字符总数-1
                    if (cnt[t] == 0) tot--;
                    // 如果添加到 cnt 之后等于 k - 1，说明该字符从达标变为不达标，达标数量 - 1
                    if (cnt[t] == k - 1) sum--;
                }
                // 当所有字符都符合要求，更新答案
                if (tot == sum) ans = Math.max(ans, i - j + 1);
            }
        }
        return ans;
    }
}
```



### 复杂度分析


+ 时间复杂度：$O(N \cdot |\Sigma| + |\Sigma|^2)$，其中 N 为字符串的长度，$\Sigma$为字符集，本题中字符串仅包含小写字母，因此$\mid \Sigma \mid =26$。我们需要遍历所有可能的 $t$t，共$\mid \Sigma \mid$种可能性；内层循环中滑动窗口的复杂度为 $O(N)$，且初始时需要 $O(|\Sigma|)$的时间初始化 $\textit{cnt}$ 数组。
+ 空间复杂度：$O(|\Sigma|)$。

