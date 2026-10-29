---
title: "map排序"
description: "为了实现快速查找，map内部本身就是按序存储的（比如红黑树）。在我们插入键值对时，就会按照key的大小顺序进行存储。这也是作为key的类型必须能够进行<运算比较的原因。"
---

# map排序
## map的按Key排序


为了实现快速查找，map内部本身就是按序存储的（比如红黑树）。在我们插入<key, value>键值对时，就会按照key的大小顺序进行存储。这也是作为key的类型必须能够进行`<`运算比较的原因。



```c
#include<map>
#include<string>
#include<iostream>
using namespace std;

typedef pair<string, int> PAIR;

ostream& operator<<(ostream& out, const PAIR& p) {
  return out << p.first << "\t" << p.second;
}

int main() {
  map<string, int> name_score_map;
  name_score_map["LiMin"] = 90; 
  name_score_map["ZiLinMi"] = 79; 
  name_score_map["BoB"] = 92; 
  name_score_map.insert(make_pair("Bing",99));
  name_score_map.insert(make_pair("Albert",86));
  for (map<string, int>::iterator iter = name_score_map.begin();
       iter != name_score_map.end();
       ++iter) {
    cout << *iter << endl;
  }
  return 0;
 }
```

运行结果：

> ![image] (原图链接已失效)



map的定义：

```c
template < class Key, class T, class Compare = less<Key>,
           class Allocator = allocator<pair<const Key,T> > > class map;
```



现在我们重点看下第三个参数： `class Compare = less<Key>`这也是一个class类型的，而且提供了默认值`less<Key>`



定义map时，用greater< Key>实现按Key值递减插入数据



```c
multimap<int,int,greater<int> >mp;
```



当Key值为自定义的类时，写一个函数对象，重载operator()



```c
#include<iostream>
#include<map>
using namespace std;

typedef struct tagIntPlus
{
    int num,i;
}IntPlus;
//自定义比较规则
//注意operator是(),不是＜
struct Cmp
{
    bool operator () (IntPlus const &a,IntPlus const &b)const
    {
        if(a.num!=b.num)
            return a.num<b.num;
        else return a.i<b.i;
    }
};
int main()
{
    ...
    multimap<IntPlus,int,Cmp>mp;
   ...
    map<IntPlus,int>::iterator iter;
    for(iter=mp.begin(); iter!=mp.end(); iter++)
        cout<<iter->first.num<<" "<<iter->first.i<<" "<<iter->second<<endl;
    return 0;
}
```



## unorderd_map按照value排序


先建立一个`vector<pair<type, type>>`的容器。



```c
std::vector<std::pair<int, int>> tmp;
for (auto& i : m)
    tmp.push_back(i);

std::sort(tmp.begin(), tmp.end(), 
          [=](std::pair<int, int>& a, std::pair<int, int>& b) { return a.second < b.second; });
```

