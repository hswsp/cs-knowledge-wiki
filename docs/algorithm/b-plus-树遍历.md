---
title: "B+树遍历"
description: "深度优先遍历假设B+数的阶为N，一个简单的深度优先遍历程序如下。使用栈进行存储路径，关键在于倒序将子节点压栈：while (!nodeStack.empty()) {         BPlusTreeNode* currentNode = nodeStack.top();         n..."
---

# B+树遍历

# 深度优先遍历
假设B+数的阶为N，一个简单的深度优先遍历程序如下。使用栈进行存储路径，关键在于倒序将子节点压栈：

```cpp
while (!nodeStack.empty()) {
        BPlusTreeNode* currentNode = nodeStack.top();
        nodeStack.pop();

        // 处理当前节点的键值
        for (int key : currentNode->keys) {
            cout children.size() - 1; i >= 0; --i) {
            if (currentNode->children[i]) {
                nodeStack.push(currentNode->children[i]);
            }
        }
}
```
B+树是一种平衡树结构，通常用于数据库索引。下面是一个用栈实现B+树的深度优先搜索的简单示例，假设B+树的阶为N。在这个示例中，我使用了C++语言。

```cpp
#include 
#include 
#include 

using namespace std;

// 定义B+树节点结构
struct BPlusTreeNode {
    vector keys;
    vector children;
    bool isLeaf;

    BPlusTreeNode(bool leaf = false) : isLeaf(leaf) {}
};

// B+树的深度优先搜索函数
void depthFirstSearch(BPlusTreeNode* root) {
    if (!root) {
        return;
    }

    stack nodeStack;
    nodeStack.push(root);

    while (!nodeStack.empty()) {
        BPlusTreeNode* currentNode = nodeStack.top();
        nodeStack.pop();

        // 处理当前节点的键值
        for (int key : currentNode->keys) {
            cout children.size() - 1; i >= 0; --i) {
            if (currentNode->children[i]) {
                nodeStack.push(currentNode->children[i]);
            }
        }
    }
}

int main() {
    // 创建一个简单的B+树作为示例
    BPlusTreeNode* root = new BPlusTreeNode(true);
    root->keys = {10, 20};

    BPlusTreeNode* child1 = new BPlusTreeNode(true);
    child1->keys = {5, 8};
    root->children.push_back(child1);

    BPlusTreeNode* child2 = new BPlusTreeNode(true);
    child2->keys = {12, 15};
    root->children.push_back(child2);

    BPlusTreeNode* child3 = new BPlusTreeNode(true);
    child3->keys = {25, 30};
    root->children.push_back(child3);

    // 执行深度优先搜索
    cout 请注意，这只是一个简单的示例，实际B+树可能包含更多的信息和功能。在实际应用中，您可能需要更复杂的B+树实现，包括插入、删除等操作。此示例主要用于演示使用栈进行深度优先搜索的基本思想。
上述深度优先遍历的实现是先序遍历。在先序遍历中，首先访问当前节点，然后按照从右到左的顺序递归地访问其子节点。这样，可以确保先访问根节点，然后按照从左到右的顺序遍历整个树。
在代码中，以下部分体现了先序遍历的思想：

```cpp
// 深度优先搜索函数，加入二分查找和范围判断
void depthFirstSearchRange(BPlusTreeNode* root, int a, int b) {
    if (!root) {
        return;
    }

    stack nodeStack;
    nodeStack.push(root);

    while (!nodeStack.empty()) {
        BPlusTreeNode* currentNode = nodeStack.top();
        nodeStack.pop();

        // ... 其他代码 ...

        // 将当前节点的子节点入栈（从右到左）
        for (int i = currentNode->children.size() - 1; i >= 0; --i) {
            if (currentNode->children[i]) {
                nodeStack.push(currentNode->children[i]);
            }
        }
    }
}
```
在这段代码中，首先访问了当前节点 `currentNode`，然后按照从右到左的顺序将其子节点入栈，以便后续继续处理。这符合先序遍历的特点。
## 深度优先搜索某个Key
假设B+树的叶子节点会以<K,D>的形式存储值，K为数据的key，D为该数据在磁盘的位置。其他为Index节点。
在这个版本中，假设`BPlusTreeNode`结构的`keys`成员为存储键-磁盘位置对（`<K, D>`）的`pair`向量。`depthFirstSearch`函数返回找到目标键的叶子节点，并输出其磁盘位置。

```cpp
#include 
#include 
#include 

using namespace std;

// 定义B+树节点结构
struct BPlusTreeNode {
    vector> keys; // 键-磁盘位置对
    vector children;
    bool isLeaf;

    BPlusTreeNode(bool leaf = false) : isLeaf(leaf) {}
};

// 二分查找函数，返回找到的索引或应插入的位置索引
int binarySearch(const vector>& keys, int target) {
    int left = 0;
    int right = keys.size() - 1;

    while (left  nodeStack;
    nodeStack.push(root);

    while (!nodeStack.empty()) {
        BPlusTreeNode* currentNode = nodeStack.top();
        nodeStack.pop();

        // 在当前节点的键值中执行二分查找
        int index = binarySearch(currentNode->keys, target);
        if (!currentNode->isLeaf) {
            // 非叶子节点，将相应的子节点入栈
            if (index children.size()) {
                nodeStack.push(currentNode->children[index]);
            }
        } else {
            // 叶子节点，查找到目标键时返回当前节点
            if (index keys.size() && currentNode->keys[index].first == target) {
                return currentNode;
            }
        }
    }

    return nullptr; // 未找到目标键
}

int main() {
    // 创建一个简单的B+树作为示例
    BPlusTreeNode* root = new BPlusTreeNode(true);
    root->keys = {{10, 100}, {20, 200}};

    BPlusTreeNode* child1 = new BPlusTreeNode(true);
    child1->keys = {{5, 50}, {8, 80}};
    root->children.push_back(child1);

    BPlusTreeNode* child2 = new BPlusTreeNode(true);
    child2->keys = {{12, 120}, {15, 150}};
    root->children.push_back(child2);

    BPlusTreeNode* child3 = new BPlusTreeNode(true);
    child3->keys = {{25, 250}, {30, 300}};
    root->children.push_back(child3);

    int targetKey = 15;

    // 执行深度优先搜索，加入二分查找
    BPlusTreeNode* leafNode = depthFirstSearch(root, targetKey);

    // 输出查找结果
    if (leafNode) {
        cout keys[0].second ​

在C++中，可以使用`std::lower_bound`来替代二分查找的过程。`**std::lower_bound**`**返回一个迭代器，指向在有序范围内第一个不小于某个值的元素。**
以下是修改后的代码，使用`std::lower_bound`替代`binarySearch`：

```cpp
#include 
#include 
#include 
#include  // 添加这个头文件

using namespace std;

// 定义B+树节点结构
struct BPlusTreeNode {
    vector> keys; // 键-磁盘位置对
    vector children;
    bool isLeaf;

    BPlusTreeNode(bool leaf = false) : isLeaf(leaf) {}
};

// 深度优先搜索函数，使用std::lower_bound
BPlusTreeNode* depthFirstSearch(BPlusTreeNode* root, int target) {
    if (!root) {
        return nullptr;
    }

    stack nodeStack;
    nodeStack.push(root);

    while (!nodeStack.empty()) {
        BPlusTreeNode* currentNode = nodeStack.top();
        nodeStack.pop();

        // 使用std::lower_bound查找目标键
        auto it = lower_bound(currentNode->keys.begin(), currentNode->keys.end(), make_pair(target, 0),
                              [](const pair& p1, const pair& p2) {
                                  return p1.first keys.begin();

        if (!currentNode->isLeaf) {
            // 非叶子节点，将相应的子节点入栈
            if (index children.size()) {
                nodeStack.push(currentNode->children[index]);
            }
        } else {
            // 叶子节点，查找到目标键时返回当前节点
            if (index keys.size() && currentNode->keys[index].first == target) {
                return currentNode;
            }
        }
    }

    return nullptr; // 未找到目标键
}

int main() {
    // 创建一个简单的B+树作为示例
    BPlusTreeNode* root = new BPlusTreeNode(true);
    root->keys = {{10, 100}, {20, 200}};

    BPlusTreeNode* child1 = new BPlusTreeNode(true);
    child1->keys = {{5, 50}, {8, 80}};
    root->children.push_back(child1);

    BPlusTreeNode* child2 = new BPlusTreeNode(true);
    child2->keys = {{12, 120}, {15, 150}};
    root->children.push_back(child2);

    BPlusTreeNode* child3 = new BPlusTreeNode(true);
    child3->keys = {{25, 250}, {30, 300}};
    root->children.push_back(child3);

    int targetKey = 15;

    // 执行深度优先搜索，使用std::lower_bound
    BPlusTreeNode* leafNode = depthFirstSearch(root, targetKey);

    // 输出查找结果
    if (leafNode) {
        cout keys[0].second 在这个版本中，`std::lower_bound`通过自定义的比较函数来执行查找，类似于我们之前手动实现的二分查找。
### 后序遍历
要将深度优先遍历改为后序遍历，需要修改节点的入栈顺序。在后序遍历中，需要先遍历子节点，然后才访问当前节点。以下是相应的修改：

```cpp
#include 
#include 
#include 
#include 

using namespace std;

// 定义B+树节点结构
struct BPlusTreeNode {
    vector> keys; // 键-磁盘位置对
    vector children;
    bool isLeaf;

    BPlusTreeNode(bool leaf = false) : isLeaf(leaf) {}
};

// 二分查找函数，返回找到的索引或应插入的位置索引
int binarySearch(const vector>& keys, int target) {
    int left = 0;
    int right = keys.size() - 1;

    while (left > nodeStack;  // 使用 pair 记录节点是否已访问

    // 根节点入栈
    nodeStack.push({root, false});

    while (!nodeStack.empty()) {
        auto [currentNode, visited] = nodeStack.top();
        nodeStack.pop();

        if (visited) {
            // 已访问，处理当前节点
            auto lowerBoundIt = lower_bound(currentNode->keys.begin(), currentNode->keys.end(), make_pair(a, 0),
                                            [](const pair& p1, const pair& p2) {
                                                return p1.first keys.begin(), currentNode->keys.end(), make_pair(b, 0),
                                            [](const pair& p1, const pair& p2) {
                                                return p1.first keys.begin();
            int upperIndex = upperBoundIt - currentNode->keys.begin();

            // 处理在区间 [a, b] 之间的键值
            for (int i = lowerIndex; i keys[i].first keys[i].second children.size() - 1; i >= 0; --i) {
                if (currentNode->children[i]) {
                    nodeStack.push({currentNode->children[i], false});
                }
            }
        }
    }
}

int main() {
    // 创建一个简单的B+树作为示例
    BPlusTreeNode* root = new BPlusTreeNode(true);
    root->keys = {{10, 100}, {20, 200}};

    BPlusTreeNode* child1 = new BPlusTreeNode(true);
    child1->keys = {{5, 50}, {8, 80}};
    root->children.push_back(child1);

    BPlusTreeNode* child2 = new BPlusTreeNode(true);
    child2->keys = {{12, 120}, {15, 150}};
    root->children.push_back(child2);

    BPlusTreeNode* child3 = new BPlusTreeNode(true);
    child3->keys = {{25, 250}, {30, 300}};
    root->children.push_back(child3);

    int rangeStart = 8;
    int rangeEnd = 20;

    // 执行深度优先搜索，查找在区间 [rangeStart, rangeEnd] 之间的键，后序遍历
    cout 在这个版本中，使用了一个额外的 `bool` 记录节点是否已经访问。当节点已经访问过时，表示当前节点的子节点已经被处理完毕，可以处理当前节点。这样实现的深度优先后序遍历。
## 深度优先遍历某个范围内的所有key
如果当前节点的范围完全不与目标区间重叠，那么就可以避免进一步遍历当前节点的子节点。这可以通过在深度优先搜索的过程中添加额外的条件进行判断。
以下是优化后的代码：

```cpp
#include 
#include 
#include 
#include 

using namespace std;

// 定义B+树节点结构
struct BPlusTreeNode {
    vector> keys; // 键-磁盘位置对
    vector children;
    bool isLeaf;

    BPlusTreeNode(bool leaf = false) : isLeaf(leaf) {}
};

// 二分查找函数，返回找到的索引或应插入的位置索引
int binarySearch(const vector>& keys, int target) {
    int left = 0;
    int right = keys.size() - 1;

    while (left  nodeStack;
    nodeStack.push(root);

    while (!nodeStack.empty()) {
        BPlusTreeNode* currentNode = nodeStack.top();
        nodeStack.pop();

        // 检查当前节点的范围是否与目标区间有交集
        if (currentNode->keys.back().first keys.front().first > b) {
            continue;  // 没有交集，跳过当前节点
        }

        // 对当前节点的键值进行二分查找
        auto lowerBoundIt = lower_bound(currentNode->keys.begin(), currentNode->keys.end(), make_pair(a, 0),
                                        [](const pair& p1, const pair& p2) {
                                            return p1.first keys.begin(), currentNode->keys.end(), make_pair(b, 0),
                                        [](const pair& p1, const pair& p2) {
                                            return p1.first keys.begin();
        int upperIndex = upperBoundIt - currentNode->keys.begin();

        // 处理在区间 [a, b] 之间的键值
        for (int i = lowerIndex; i keys[i].first keys[i].second children.size() - 1; i >= 0; --i) {
            if (currentNode->children[i]) {
                nodeStack.push(currentNode->children[i]);
            }
        }
    }
}

int main() {
    // 创建一个简单的B+树作为示例
    BPlusTreeNode* root = new BPlusTreeNode(true);
    root->keys = {{10, 100}, {20, 200}};

    BPlusTreeNode* child1 = new BPlusTreeNode(true);
    child1->keys = {{5, 50}, {8, 80}};
    root->children.push_back(child1);

    BPlusTreeNode* child2 = new BPlusTreeNode(true);
    child2->keys = {{12, 120}, {15, 150}};
    root->children.push_back(child2);

    BPlusTreeNode* child3 = new BPlusTreeNode(true);
    child3->keys = {{25, 250}, {30, 300}};
    root->children.push_back(child3);

    int rangeStart = 8;
    int rangeEnd = 20;

    // 执行深度优先搜索，查找在区间 [rangeStart, rangeEnd] 之间的键
    cout 这里`std::upper_bound` 函数返回一个迭代器，指向在有序序列中大于某个值的第一个元素。如果找不到大于该值的元素，则返回指向序列末尾的迭代器。
具体来说，`std::upper_bound` 在有序序列 `[first, last)` 中查找第一个大于 `value` 的元素，其中 `first` 是序列的起始位置，`last` 是序列的结束位置。它采用比较函数（默认是 `<`）来判断元素的顺序。
如果存在大于 `value` 的元素，`std::upper_bound` 将返回指向第一个大于 `value` 的元素的迭代器。如果所有元素都小于或等于 `value`，则返回指向序列末尾的迭代器。

在这个版本中，`depthFirstSearchRange`函数通过使用 `lower_bound` 和 `upper_bound` 函数，找到在区间 `[a, b]` 之间的键，并进行相应的处理。这样，你可以在深度优先搜索的过程中遍历指定范围的键。
增加了一个判断条件，即如果当前节点的范围与目标区间没有交集，就直接跳过当前节点的处理，不继续遍历其子节点。这样能够有效减少不必要的遍历。
# 广度优先
下面是将上述代码修改为B+树的广度优先遍历的版本。我使用了队列来实现广度优先搜索。

```cpp
#include 
#include 
#include 

using namespace std;

// 定义B+树节点结构
struct BPlusTreeNode {
    vector keys;
    vector children;
    bool isLeaf;

    BPlusTreeNode(bool leaf = false) : isLeaf(leaf) {}
};

// B+树的广度优先搜索函数
void breadthFirstSearch(BPlusTreeNode* root) {
    if (!root) {
        return;
    }

    queue nodeQueue;
    nodeQueue.push(root);

    while (!nodeQueue.empty()) {
        BPlusTreeNode* currentNode = nodeQueue.front();
        nodeQueue.pop();

        // 处理当前节点的键值
        for (int key : currentNode->keys) {
            cout children) {
            if (child) {
                nodeQueue.push(child);
            }
        }
    }
}

int main() {
    // 创建一个简单的B+树作为示例
    BPlusTreeNode* root = new BPlusTreeNode(true);
    root->keys = {10, 20};

    BPlusTreeNode* child1 = new BPlusTreeNode(true);
    child1->keys = {5, 8};
    root->children.push_back(child1);

    BPlusTreeNode* child2 = new BPlusTreeNode(true);
    child2->keys = {12, 15};
    root->children.push_back(child2);

    BPlusTreeNode* child3 = new BPlusTreeNode(true);
    child3->keys = {25, 30};
    root->children.push_back(child3);

    // 执行广度优先搜索
    cout 这个版本中，使用队列将当前节点的子节点按照从左到右的顺序加入队列，实现了广度优先遍历。
**与深度优先唯一的区别就是一个使用栈，倒序入子节点。一个使用队列，顺序入子节点**。
## 广度优先搜索某个Key
如果要在广度优先搜索中使用 `std::lower_bound` 进行查找，需要对广度优先搜索函数进行适当的修改。以下是相应的修改后的代码：

```cpp
#include 
#include 
#include 
#include  // 添加这个头文件

using namespace std;

// 定义B+树节点结构
struct BPlusTreeNode {
    vector> keys; // 键-磁盘位置对
    vector children;
    bool isLeaf;

    BPlusTreeNode(bool leaf = false) : isLeaf(leaf) {}
};

// 广度优先搜索函数，使用std::lower_bound
BPlusTreeNode* breadthFirstSearch(BPlusTreeNode* root, int target) {
    if (!root) {
        return nullptr;
    }

    queue nodeQueue;
    nodeQueue.push(root);

    while (!nodeQueue.empty()) {
        BPlusTreeNode* currentNode = nodeQueue.front();
        nodeQueue.pop();

        // 使用std::lower_bound查找目标键
        auto it = lower_bound(currentNode->keys.begin(), currentNode->keys.end(), make_pair(target, 0),
                              [](const pair& p1, const pair& p2) {
                                  return p1.first keys.begin();

        if (!currentNode->isLeaf) {
            // 非叶子节点，将相应的子节点入队
            for (int i = 0; i children.size(); ++i) {
                nodeQueue.push(currentNode->children[i]);
            }
        } else {
            // 叶子节点，查找到目标键时返回当前节点
            if (index keys.size() && currentNode->keys[index].first == target) {
                return currentNode;
            }
        }
    }

    return nullptr; // 未找到目标键
}

int main() {
    // 创建一个简单的B+树作为示例
    BPlusTreeNode* root = new BPlusTreeNode(true);
    root->keys = {{10, 100}, {20, 200}};

    BPlusTreeNode* child1 = new BPlusTreeNode(true);
    child1->keys = {{5, 50}, {8, 80}};
    root->children.push_back(child1);

    BPlusTreeNode* child2 = new BPlusTreeNode(true);
    child2->keys = {{12, 120}, {15, 150}};
    root->children.push_back(child2);

    BPlusTreeNode* child3 = new BPlusTreeNode(true);
    child3->keys = {{25, 250}, {30, 300}};
    root->children.push_back(child3);

    int targetKey = 15;

    // 执行广度优先搜索，使用std::lower_bound
    BPlusTreeNode* leafNode = breadthFirstSearch(root, targetKey);

    // 输出查找结果
    if (leafNode) {
        cout keys[0].second 在这个版本中，广度优先搜索函数 `breadthFirstSearch` 使用 `std::lower_bound` 进行键的查找。类似于深度优先搜索，我们在非叶子节点时将相应的子节点入队，确保队列中的节点按照广度优先的顺序被处理。