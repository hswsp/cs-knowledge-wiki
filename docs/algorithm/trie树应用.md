---
title: "Trie树应用"
description: "LeetCode 208. Implement Trie (Prefix Tree)A trie (pronounced as try) or prefix tree is a tree data structure used to efficiently store and retrie..."
---

# Trie树应用

# LeetCode [208. Implement Trie (Prefix Tree)](https://leetcode-cn.com/problems/implement-trie-prefix-tree/)
​

A trie (pronounced as &quot;try&quot;) or prefix tree is a tree data structure used to efficiently store and retrieve keys in a dataset of strings. There are various applications of this data structure, such as autocomplete and spellchecker.
​

Implement the Trie class:
​

- `Trie()` Initializes the trie object.
- `void insert(String word) `Inserts the string word into the trie.
- `boolean search(String word) `Returns true if the string word is in the trie (i.e., was inserted before), and false otherwise.
- `boolean startsWith(String prefix)` Returns true if there is a previously inserted string word that has the prefix prefix, and false otherwise.
 
## 题解
​

每个节点包含以下字段：
​

指向子节点的指针数组 `children`。对于本题而言，数组长度为 26，即小写英文字母的数量。此时 `children[0]` 对应小写字母 a，`children[1] `对应小写字母 b，…，`children[25] `对应小写字母 z。
布尔字段 `isEnd`，表示该节点是否为字符串的结尾。

```cpp
class Trie {
    vector children;  //26个字母
    bool is_end; //最后一个单词

public:
    Trie():is_end(false),children(26) {

    }
    
    void insert(string word) {
        Trie* node = this;
        for(auto s:word){
            int index = s-'a';
            if(node->children[index]== nullptr){
                node->children[index] = new Trie();
            }
            node = node->children[index];
        }
        node->is_end = true;
    }
    
    bool search(string word) {
        Trie* node = this;
        for(auto s:word){
            int index = s-'a';
            if(node->children[index]== nullptr){
                return false;
            }
            node = node->children[index];
        }
        if(node->is_end) return true;
        return false;
    }
    
    bool startsWith(string prefix) {
        Trie* node = this;
        for(auto s:prefix){
            int index = s-'a';
            if(node->children[index]== nullptr){
                return false;
            }
            node = node->children[index];
        }
        return true;
    }
};

/**
 * Your Trie object will be instantiated and called as such:
 * Trie* obj = new Trie();
 * obj->insert(word);
 * bool param_2 = obj->search(word);
 * bool param_3 = obj->startsWith(prefix);
 */
```

# LeetCode [212. Word Search II](https://leetcode-cn.com/problems/word-search-ii/)
Given an `m x n` board of characters and a list of strings words, return all words on the board.
​

Each word must be constructed from letters of sequentially adjacent cells, where **adjacent cells** are horizontally or vertically neighboring. The same letter cell may not be used more than once in a word.
​

Example 1:

![image.png](https://cdn.nlark.com/yuque/0/2022/png/22382307/1648479843430-e61f3452-42b4-42f3-8749-e6e16a6dc69b.png)
**Input**: board = [[&quot;o&quot;,&quot;a&quot;,&quot;a&quot;,&quot;n&quot;],[&quot;e&quot;,&quot;t&quot;,&quot;a&quot;,&quot;e&quot;],[&quot;i&quot;,&quot;h&quot;,&quot;k&quot;,&quot;r&quot;],[&quot;i&quot;,&quot;f&quot;,&quot;l&quot;,&quot;v&quot;]], words = [&quot;oath&quot;,&quot;pea&quot;,&quot;eat&quot;,&quot;rain&quot;]
**Output:** [&quot;eat&quot;,&quot;oath&quot;]
​

## 思路和算法

根据题意，我们需要逐个遍历二维网格中的每一个单元格；然后搜索从该单元格出发的所有路径，找到其中对应 words 中的单词的路径。因为这是���个回溯的过程，所以我们有如下算法：

-  遍历二维网格中的所有单元格。 
-  深度优先搜索所有从当前正在遍历的单元格出发的、由相邻且不重复的单元格组成的路径。因为题目要求同一个单元格内的字母在一个单词中不能被重复使用；所以我们在深度优先搜索的过程中，每经过一个单元格，**都将该单元格的字母临时修改为特殊字符（例如 #），以避免再次经过该单元格**。 
-  如果当前路径是 words 中的单词，则将其添加到结果集中。如果当前路径是 words 中任意一个单词的前缀，则继续搜索；反之，如果当前路径不是 words 中任意一个单词的前缀，则剪枝。我们可以将 words 中的所有字符串先添加到前缀树中，而后用 1813718137的时间复杂度查询当前路径是否为 words 中任意一个单词的前缀。 

在具体实现中，我们需要注意如下情况：

-  因为同一个单词可能在多个不同的路径中出现，所以我们需要使用**哈希集合**对结果集去重。 
-  在回溯的过程中，我们**不需要每一步**都**判断完整**的当前路径是否是 words 中任意一个单词的前缀；而是可以记录下路径中每个单元格所对应的前缀树结点，每次**只需要判断新增单元格的字母是否是上一个单元格对应前缀树结点的子结点即可。** 

## 算法优化

考虑以下情况。假设给定一个所有单元格都是 a 的二维字符网格和单词列表 `[&quot;a&quot;, &quot;aa&quot;, &quot;aaa&quot;, &quot;aaaa&quot;]`。当我们使用方法一来找出所有同时在二维网格和单词列表中出现的单词时，我们需要遍历每一个单元格的所有路径，会找到大量重复的单词。

为了缓解这种情况，我们可以**将匹配到的单词从前缀树中移除，来避免重复寻找相同的单词**。因为这种方法可以保证每个单词只能被匹配一次；所以我们也不需要再对结果集去重了。

## 代码

```c
struct TrieNode {
    string word;//如果当前word不为空，表示一个有效节点（注意这里可能为树的叶子节点，也可能不是）
    unordered_map children;
    TrieNode() {
        this->word = "";
    }   
};

void insertTrie(TrieNode * root, const string & word) {
    TrieNode * node = root;

    for (auto c : word) {
        if (!node->children.count(c)) {
            node->children[c] = new TrieNode();
        }
        node = node->children[c];
    }
  
   //单词树有效节点，这里将单词都存到子节点上！
    node->word = word;
}

class Solution {
public:
    int dirs[4][2] = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

    bool dfs(vector>& board, int x, int y, TrieNode * root, set & res) {
        char ch = board[x][y];   
     
        if (root == nullptr || !root->children.count(ch)) {
            return false;
        }
      
        //走到单词树有效节点，说明找到一个单词，放入结果集
        TrieNode * nxt = root->children[ch];
        if (nxt->word.size() > 0) {
            res.insert(nxt->word);
            nxt->word = "";//将匹配到的单词从前缀树中移除
        }
        //新增单元格的字母是上一个单元格对应前缀树结点的子结点，DFS回溯
        if (!nxt->children.empty()) {
            board[x][y] = '#';
            for (int i = 0; i = 0 && nx = 0 && ny children.empty()) {
            root->children.erase(ch);
        }

        return true;      
    }

    vector findWords(vector> & board, vector & words) {
        TrieNode * root = new TrieNode();
        //使用哈希集合对结果集去重
        set res;
        vector ans;

        for (auto & word: words) {
            insertTrie(root,word);
        }
        for (int i = 0; i 

更多详细例子：[字典树(Trie树)实现与应用](https://www.cnblogs.com/xujian2014/p/5614724.html)