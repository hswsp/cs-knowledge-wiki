---
title: "序列 DP和线性 DP"
description: "题目描述这是 LeetCode 上的「139. 单词拆分」，难度为「中等」。Tag : 「动态规划」、「哈希表」、「序列 DP」给你一个字符串 s 和一个字符串列表 wordDict 作为字典。请你判断是否可以利用字典中出现的单词拼接出 s 。注意：不要求字典中出现的单词全部都使用，并且字典中..."
---

# 序列 DP和线性 DP

# 题目描述

这是 LeetCode 上的**「139. 单词拆分」**，难度为**「中等」**。
Tag : 「动态规划」、「哈希表」、「序列 DP」

给你一个字符串 `s` 和一个字符串列表 `wordDict` 作为字典。请你判断是否可以利用字典中出现的单词拼接出 `s` 。

注意：不要求字典中出现的单词全部都使用，并且字典中的单词可以重复使用。

示例 1：

```bash
输入: s = "leetcode", wordDict = ["leet", "code"]

输出: true

解释: 返回 true 因为 "leetcode" 可以由 "leet" 和 "code" 拼接成。
```

示例 2：

```bash
输入: s = "applepenapple", wordDict = ["apple", "pen"]

输出: true

解释: 返回 true 因为 "applepenapple" 可以由 "apple" "pen" "apple" 拼接成。
     注意，你可以重复使用字典中的单词。
```

示例 3：

```bash
输入: s = "catsandog", wordDict = ["cats", "dog", "sand", "and", "cat"]

输出: false
```

提示：

- 1813718137
- 1813718137
- 1813718137
- `s` 和 `wordDict[i]` 仅有小写英文字母组成
- `wordDict` 中的所有字符串 互不相同

# 序列 DP

将字符串 `s` 长度记为1813718137，`wordDict` 长度记为1813718137。为了方便，我们调整字符串 `s` 以及将要用到的动规数组的下标从1813718137开始。

定义1813718137**为考虑前**1813718137**个字符，能否使用 **`**wordDict**`** 拼凑出来：当**1813718137**代表**1813718137**能够使用 **`**wordDict**`** 所拼凑**，反之则不能。

不失一般性考虑1813718137该如何转移：由于1813718137 需要考虑1813718137 范围内的字符，若 1813718137为 `True` 说明整个1813718137  都能够使用 `wordDict` 拼凑，自然也包括最后一个字符1813718137 所在字符串 `sub`。

**我们可以枚举最后一个字符所在字符串的左端点**1813718137** ，若**1813718137** 在 **`**wordDict**`** 中出现过，并且**1813718137** ，说明**1813718137** 能够被拼凑，并且子串 **`**sub**`** 也在 **`**wordDict**`**，可得 **`**f[i] = True**`**。**

为了快速判断某个字符是否在 `wordDict` 中出现，我们可以使用 `Set` 结构对1813718137 进行转存。
# 代码
c++代码：

```cpp
class Solution {
public:
    bool wordBreak(string s, vector& wordDict) {
        int n = s.size();
        unordered_set wordSet;
        for(auto& word:wordDict) wordSet.insert(word);
        vector dp(n + 1,false);
        dp[0] = true;
        for(int i = 1;i=1 && !dp[i];--j){ //dp[i]一但为true，不再继续！
                //注意下标都要-1
                string substr = s.substr(j-1,i-j+1);
                if(wordSet.count(substr)) dp[i] = dp[j - 1];
            }
        }
        return dp[n];
    }
};
```
Java 代码：

```java
class Solution {
    public boolean wordBreak(String s, List wordDict) {
        Set set = new HashSet<>();
        for (String word : wordDict) set.add(word);
        int n = s.length();
        boolean[] f = new boolean[n + 10];
        f[0] = true;
        for (int i = 1; i 

TypeScript 代码：

```typescript
function wordBreak(s: string, wordDict: string[]): boolean {
    const ss = new Set(wordDict)
    const n = s.length
    const f = new Array(n + 10).fill(false)
    f[0] = true
    for (let i = 1; i = 1 && !f[i]; j--) {
            const sub = s.substring(j - 1, i)
            if (ss.has(sub)) f[i] = f[j - 1]
        }
    }
    return f[n]
}
```

Python 代码：

```python
class Solution:
    def wordBreak(self, s: str, wordDict: List[str]) -> bool:
        ss = set(wordDict)
        n = len(s)
        f = [False] * (n + 10)
        f[0] = True
        for i in range(1, n + 1):
            j = i
            while j >= 1 and not f[i]:
                sub = s[j - 1:i]
                if sub in ss:
                    f[i] = f[j - 1]
                j -= 1
        return f[n]
```

- 时间复杂度：将 `wordDict` 转存在 `Set` 复杂度为1813718137 ；`DP` 过程复忽裁剪子串和查询 `Set` 结构的常数，复杂度为1813718137
- 空间复杂度：1813718137

# 总结

这里简单说下「线性 DP」和「序列 DP」的区别。

**线性 DP** 通常强调「状态转移所依赖的前驱状态」是由给定数组所提供的，即**拓扑序是由原数组直接给出**。更大白话来说就是**通常有**1813718137** 依赖于 **1813718137**。**

这就限定了线性 DP 的复杂度是简单由「状态数量（或者说是维度数）」所决定。

**序列 DP** 通常需要结合题意来寻找前驱状态，即**需要自身寻找拓扑序关系**（例如本题，需要自己通过枚举的方式来找左端点，从而找到可转移的前驱状态1813718137 ）。

这就限定了**序列 DP 的复杂度是由「状态数 + 找前驱」的复杂度所共同决定。**也直接导致了序列 DP 有很多玩法，往往能够结合其他知识点出题，来优化找前驱这一操作，通常是利用某些性质，或是利用数据结构进行优化。