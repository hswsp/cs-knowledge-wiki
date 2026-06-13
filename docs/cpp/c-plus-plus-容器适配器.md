---
title: "priority_queue ——建堆"
description: "容器适配器（container adaptor）都不是完整的实现，而是依赖于某个现有的容器。"
---

**容器适配器（container adaptor）**都不是完整的实现，而是依赖于某个现有的容器。

# priority_queue ——建堆


**首先要包含头文件**`**#include<queue>**`, 他和`queue`不同的就在于我们可以自定义其中数据的优先级, 让优先级高的排在队列前面,优先出队。



优先队列具有队列的所有特性，包括队列的基本操作，只是在这基础上添加了内部的一个排序，它本质是一个堆实现的。



> 和队列基本操作相同:
>
> + top 访问队头元素
> + empty 队列是否为空
> + size 返回队列内元素个数
> + push 插入元素到队尾 (并排序)
> + emplace 原地构造一个元素并插入队列
> + pop 弹出队头元素
> + swap 交换内容
>



定义：`priority_queue<Type, Container, Functional>`



Type 就是数据类型，Container 就是容器类型（Container必须是用数组实现的容器，比如vector,deque等等，但不能用 list。STL里面默认用的是vector），Functional 就是比较的方式。



当需要用自定义的数据类型时才需要传入这三个参数，使用基本数据类型时，只需要传入数据类型，默认是大顶堆。一般是：



```cpp
//升序队列，小顶堆
priority_queue <int,vector<int>,greater<int> > q;
//降序队列，大顶堆
priority_queue <int,vector<int>,less<int> >q;

//greater和less是std实现的两个仿函数（就是使一个类的使用看上去像一个函数。
//其实现就是类中实现一个operator()，这个类就有了类似函数的行为，就是一个仿函数类了）
```



## 用pair做优先队列元素


注意使用pair入队列时候，可以直接使用如下形式：

```cpp
priority_queue<pair<int, int> > a;
a.emplace(1,2);
```



规则：pair的比较，先比较第一个元素，第一个相等比较第二个。



```c
#include <iostream>
#include <queue>
#include <vector>
using namespace std;
int main()
{
    priority_queue<pair<int, int> > a;
    pair<int, int> b(1, 2);
    pair<int, int> c(1, 3);
    pair<int, int> d(2, 5);
    a.push(d);
    a.push(c);
    a.push(b);
    while (!a.empty())
    {
        cout << a.top().first << ' ' << a.top().second << '\n';
        a.pop();
    }
}
```



运行结果：



```c
2 5
1 3
1 2
请按任意键继续. . .
```



以下代代码返回pair的比较结果，先按照**pair**的first元素升序，first元素相等时，再按照second元素升序：



```c
#include<iostream>
#include<vector>
#include<queue>
using namespace std;
int main(){
     priority_queue<pair<int,int>,vector<pair<int,int> >,greater<pair<int,int> > > coll;
     pair<int,int> a(3,4);
     pair<int,int> b(3,5);
     pair<int,int> c(4,3);
     coll.push(c);
     coll.push(b);
     coll.push(a);
     while(!coll.empty())
     {
         cout<<coll.top().first<<"\t"<<coll.top().second<<endl;
         coll.pop();
     }
     return 0; 
}
```



## 用自定义类型做优先队列元素


```cpp
#include <iostream>
#include <queue>
using namespace std;

//方法1
struct tmp1 //运算符重载<
{
    int x;
    tmp1(int a) {x = a;}
    bool operator<(const tmp1& a) const
    {
        return x < a.x; //大顶堆
    }
};

//方法2
struct cmp //重写仿函数
{
    bool operator() (tmp1 a, tmp1 b)
    {
        return a.x < b.x; //大顶堆
    }
};

int main()
{
    tmp1 a(1);
    tmp1 b(2);
    tmp1 c(3);
    priority_queue<tmp1> d;
    d.push(b);
    d.push(c);
    d.push(a);
    while (!d.empty())
    {
        cout << d.top().x << '\n';
        d.pop();
    }
    cout << endl;

    priority_queue<tmp1, vector<tmp1>, cmp> f;
    f.push(b);
    f.push(c);
    f.push(a);
    while (!f.empty())
    {
        cout << f.top().x << '\n';
        f.pop();
    }
}
```

方法三：lambda表达式

```cpp
 // 优先级队列，按照价格的最小堆
auto cmp = [](const vector<int>& a, const vector<int>& b) -> bool
{
   return a[1] > b[1];
};
priority_queue<vector<int>, deque<vector<int>>, decltype(cmp)> q(cmp);
```

运行结果：

```bash
3
2
1
 
3
2
1
请按任意键继续. . .
```

## 延时排序规则
在 C++ 中，可以在创建 `std::priority_queue` 时延迟指定排序规则，具体的方法是先声明一个未初始化的 `std::priority_queue`，然后在构造函数中传入排序规则。这样你可以在某些条件满足时动态决定排序规则。

下面是一个使用 lambda 表达式延迟指定排序规则的示例：

```cpp
#include <iostream>
#include <queue>
#include <vector>
#include <functional>

struct Person {
    std::string name;
    int age;

    Person(const std::string &n, int a) : name(n), age(a) {}
};

int main() {
    using PriorityQueue = std::priority_queue<Person, std::vector<Person>, std::function<bool(const Person&, const Person&)>>;
    
    // 创建空的 priority_queue
    PriorityQueue pq;

    // 条件判断
    bool sortByAgeAscending = true;

    if (sortByAgeAscending) {
        // 指定排序规则为按年龄升序
        pq = PriorityQueue([](const Person &p1, const Person &p2) {
            return p1.age > p2.age; // 最小堆，按年龄从小到大排序
        });
    } else {
        // 指定排序规则为按年龄降序
        pq = PriorityQueue([](const Person &p1, const Person &p2) {
            return p1.age < p2.age; // 最大堆，按年龄从大到小排序
        });
    }

    // 向 priority_queue 中添加元素
    pq.emplace("Alice", 30);
    pq.emplace("Bob", 25);
    pq.emplace("Charlie", 35);

    // 取出并打印元素
    while (!pq.empty()) {
        Person p = pq.top();
        pq.pop();
        std::cout << p.name << " (" << p.age << " years old)" << std::endl;
    }

    return 0;
}
```

### 解释
1. **定义 Person 结构体**：我们定义了一个 `Person` 结构体，有两个成员变量 `name` 和 `age`。
2. **定义 PriorityQueue 类型**：我们使用 `std::priority_queue`，并通过 `std::function` 指定比较函数类型。
3. **声明空的 PriorityQueue**：我们声明一个未初始化的 `PriorityQueue` 变量 `pq`。
4. **条件判断**：根据条件 `sortByAgeAscending`，决定使用哪种排序规则。
5. **初始化 PriorityQueue**：根据条件传入不同的 lambda 表达式来初始化 `pq`。
6. **添加元素**：我们使用 `emplace` 方法向 `priority_queue` 中添加元素。
7. **取出并打印元素**：我们使用 `top` 方法获取堆顶元素，并使用 `pop` 方法删除堆顶元素，直到堆为空。

这样，你可以根据实际情况在运行时动态指定 `std::priority_queue` 的排序规则。



