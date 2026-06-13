---
title: "C++ 关联容器排序"
description: "STL关联式容器自定义排序规则使用函数对象自定义排序规则无论关联式容器中存储的是基础类型（如 int、double、float 等）数据，还是自定义的结构体变量或类对象（包括 string 类），都可以使用函数对象的方式为该容器自定义排序规则。下面样例以 set 容器为例，演示了如何用函数对象..."
---

# C++ 关联容器排序

# STL关联式容器自定义排序规则
## 使用函数对象自定义排序规则

无论关联式容器中存储的是基础类型（如 int、double、float 等）数据，还是自定义的结构体变量或类对象（包括 string 类），都可以使用函数对象的方式为该容器自定义排序规则。
​

下面样例以 set 容器为例，演示了如何用函数对象的方式自定义排序规则：

```cpp
#include 
#include       // set
#include        // string
using namespace std;
//定义函数对象类
class cmp {
public:
    //重载 () 运算符
    bool operator ()(const string &a,const string &b) {
        //按照字符串的长度，做升序排序(即存储的字符串从短到长)
        return  (a.length() myset{"http://c.biancheng.net/stl/",
                               "http://c.biancheng.net/python/",
                               "http://c.biancheng.net/java/"};
    //输出容器中存储的元素
    for (auto iter = myset.begin(); iter != myset.end(); ++iter) {
            cout 程序执行结果为：

```cpp
http://c.biancheng.net/stl/
http://c.biancheng.net/java/
http://c.biancheng.net/python/
```
另外，[C++](http://c.biancheng.net/cplus/) 中的 struct 和 class 非常类似（有关两者区别，可阅读《[C++ struct和class到底有什么区别](http://c.biancheng.net/view/2235.html)》一文），前者也可以包含成员变量和成员函数。因此上面程序中，函数对象类 cmp 也可以使用 struct 关键字创建：

```c
//定义函数对象类
struct cmp {
    //重载 () 运算符
    bool operator ()(const string &a, const string &b) {
        //按照字符串的长度，做升序排序(即存储的字符串从短到长)
        return  (a.length() 

值得一提的是，在定义函数对象类时，也可以将其定义为模板类。比如：

```c
//定义函数对象模板类
template 
class cmp {
public:
    //重载 () 运算符
    bool operator ()(const T &a, const T &b) {
        //按照值的大小，做升序排序
        return  a 

注意，此方式必须保证 T 类型元素可以直接使用关系运算符（比如这里的 < 运算符）做比较。
## 

## 重载关系运算符实现自定义排序
其实在 [STL](http://c.biancheng.net/stl/) 标准库中，本就包含几个可供关联式容器使用的排序规则，如表 1 表示。

排序规则
功能

std::less
底层采用 < 运算符实现升序排序，各关联式容器默认采用的排序规则。

std::greater
底层采用 > 运算符实现降序排序，同样适用于各个关联式容器。

std::less_equal
底层采用 <= 运算符实现升序排序，多用于 multimap 和 multiset 容器。

std::greater_equal
底层采用 >= 运算符实现降序排序，多用于 multimap 和 multiset 容器。

值得一提的是，表 1 中的这些排序规则，其底层也是采用函数对象的方式实现的。以 std::less 为例，其底层实现为：

```c
template 
struct less {
    //定义新的排序规则
    bool operator()(const T &_lhs, const T &_rhs) const {
        return _lhs 

在此基础上，当关联式容器中存储的数据类型为自定义的结构体变量或者类对象时，通过对现有排序规则中所用的关系运算符进行重载，也能实现自定义排序规则的目的。

注意，当关联式容器中存储的元素类型为[结构体指针](http://c.biancheng.net/view/246.html)变量或者类的[指针](http://c.biancheng.net/c/80/)对象时，只能使用函数对象的方式自定义排序规则，此方法不再适用。

举个例子：

```cpp
#include 
#include       // set
#include        // string
using namespace std;
//自定义类
class myString {
public:
//定义构造函数，向 myset 容器中添加元素时会用到
myString(string tempStr) :str(tempStr) {};
//获取 str 私有对象，由于会被私有对象调用，因此该成员方法也必须为 const 类型
string getStr() const;
private:
string str;
};
string myString::getStr() const{
    return this->str;
}
//重载  排序规则
    std::setmyset;
    //向 set 容器添加元素，这里会调用 myString 类的构造函数
    myset.emplace("http://c.biancheng.net/stl/");
    myset.emplace("http://c.biancheng.net/c/");
    myset.emplace("http://c.biancheng.net/python/");
    //
    for (auto iter = myset.begin(); iter != myset.end(); ++iter) {
        myString mystr = *iter;
        cout 

程序执行结果为：

```c
http://c.biancheng.net/c/
http://c.biancheng.net/stl/
http://c.biancheng.net/python/
```

在这个程序中，虽然 myset 容器表面仍采用默认的 `std::less<T>`排序规则，但由于我们对其所用的 < 运算符进行了重载，使得 myset 容器内部实则是以字符串的长度为基准，对各个 mystring 类对象进行排序。
# map排序
## map的按Key排序

为了实现快速查找，map内部本身就是按序存储的（比如红黑树）。在我们插入<key, value>键值对时，就会按照key的大小顺序进行存储。这也是作为key的类型必须能够进行`<`运算比较的原因。

```c
#include
#include
#include
using namespace std;

typedef pair PAIR;

ostream& operator name_score_map;
  name_score_map["LiMin"] = 90; 
  name_score_map["ZiLinMi"] = 79; 
  name_score_map["BoB"] = 92; 
  name_score_map.insert(make_pair("Bing",99));
  name_score_map.insert(make_pair("Albert",86));
  for (map::iterator iter = name_score_map.begin();
       iter != name_score_map.end();
       ++iter) {
    cout 运行结果：

![image](http://img0.tuicool.com/myyE7v.jpg!web)

map的定义：

```c
template ,
           class Allocator = allocator > > class map;
```

现在我们重点看下第三个参数： `class Compare = less<Key>`这也是一个class类型的，而且提供了默认值`less<Key>`

定义map时，用greater< Key>实现按Key值递减插入数据

```c
multimap >mp;
```

当Key值为自定义的类时，写一个函数对象，重载operator()

```c
#include
#include
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
            return a.nummp;
   ...
    map::iterator iter;
    for(iter=mp.begin(); iter!=mp.end(); iter++)
        coutfirst.numfirst.isecond

## unorderd_map按照value排序

先建立一个`vector<pair<type, type>>`的容器。

```c
std::vector> tmp;
for (auto& i : m)
    tmp.push_back(i);

std::sort(tmp.begin(), tmp.end(), 
          [=](std::pair& a, std::pair& b) { return a.second