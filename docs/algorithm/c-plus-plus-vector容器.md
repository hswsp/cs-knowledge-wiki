---
title: "vector的初始化"
description: "vector的构造函数通常来说有六种，如下："
---

# vector的初始化
## 一维vector的初始化
vector的构造函数通常来说有六种，如下：



1. vector():创建一个空vector

```c
vector<int> list1;
```



默认初始化，vector 为空， size 为0。容器中没有元素，而且 capacity 也返回 0，意味着还没有分配内存空间。这种初始化方式适用于元素个数未知，需要在程序中动态添加的情况。



2.  vector(int nSize):创建一个vector,元素个数为nSize  

```c
vector<int> ilist4(7);
```



默认值初始化，list 中将包含7个元素，每个元素进行缺省的值初始化。对于int，也就是被赋值为0，因此 list4 被初始化为包含7个0。当程序运行初期元素大致数量可预知，而元素的值需要动态获取的时候，可采用这种初始化方式。



3.  **vector(int nSize,const t& t):创建一个vector，元素个数为nSize,且值均为t**  

```c
vector<int> ilist5(7, 3)
```



指定值初始化，ilist5被初始化为包含7个值为3的int。



4.  vector(const vector&):复制构造函数  

```c
vector<int> list2(list);
vector<int> list2 = list;
```



两种方式等价 ，list2 初始化为 list 的拷贝。list 必须与 list2 类型相同，也就是同为 int 的 vector 类型，list2 将具有和 list 相同的容量和元素。



5.  vector(begin,end):复制[begin,end)区间内另一个数组的元素到vector中  

```c
vector<int> list3(list.begin() + 2, list.end() - 1);
```



list3 初始化为两个迭代器指定范围中元素的拷贝，**范围中的元素类型必须与 list3 的元素类型相容**。



注意：由于只要求范围中的元素类型与待初始化的容器的元素类型相容，因此迭代器来自不同的容器是可能的，例如，用一个 double 的 list 的范围来初始化 list3 是可行的。



另外由于构造函数只是读取范围中的元素进行拷贝，因此**使用普通迭代器还是 const 迭代器来指出范围并没有区别。这种初始化方法特别适合于获取一个序列的子序列。**



6. c++11 新增

```c
vector<int> list = {1,2,3.0,4,5,6,7};
vector<int> list3 {1,2,3.0,4,5,6,7};
```



list 初始化为列表中元素的拷贝，列表中元素必须与 list 的元素类型相容。本例中必须是与整数类型相容的类型，整形会直接拷贝，其他类型会进行类型转换。



如果是c++ 98的情况，可以使用方法五结合数组给出初始化列表：

```c
int a[5]={1,2,3,4,5};
vector<int> vec5(a,a+5);
```



下面为测试代码以及运行结果：

```c
#include<iostream>
#include<vector>
using namespace std;

int main(){
    ////////////////
    //构造函数部分
    ////////////////

    //空vector
    vector<int> vec1();
    cout<<"vec1[0] = "<<vec1[0]<<endl;
    //构造一行空vector
    vector<int> vec2(1);
    
  	cout<<"vec2[0] = "<<vec2[0]<<endl;
    //构造一行指定值得vector
    vector<int> vec3(5,1);
    
  	cout<<"vec3[0-5] = ";
    for(int i=0;i<5;i++){
        cout<<' '<<vec3[i]<<' ';
    }
    cout<<endl;
  
    //利用拷贝构造函数构造
    vector<int> vec4(vec3);
    
  	cout<<"拷贝构造 vec4[0-5] = vec3[0-5] = ";
    for(int i=0;i<5;i++){
        cout<<' '<<vec4[i]<<' ';
    }
    cout<<endl;
    //复制前闭后开的一段到vector中
    int a[5]={1,2,3,4,5};
    vector<int> vec5(a,a+5);
    
  	cout<<"vec5[0-5] = ";
    for(int i=0;i<5;i++){
        cout<<' '<<vec5[i]<<' ';
    }
    cout<<endl;
}
```



结果如下：  
![](https://images.spumn.eu.cc/blog/645f646d3023058f.png)



## 二维vector的初始化
```c
vector<vector <int> > ivec(m ,vector<int>(n));
```



简单来说就是要利用上面的第三种方式，让每个元素的初值是一个一维的vector。另外前面的模板参数里面也是一个嵌套的模式。



# vector 容器迭代器输出
常见的输出迭代器是 `ostream_iterator`，方便我们把容器内容“拷贝”到一个输出流。示例如下：

```cpp
#include <algorithm>  // std::copy
#include <iterator>   // std::back_inserter
#include <vector>     // std::vector
#include <iostream>  // std::cout
using namespace std;

vector v1{1, 2, 3, 4, 5};
vector v2;
copy(v1.begin(), v1.end(), back_inserter(v2));
//输出到标准输出器
copy(v2.begin(), v2.end(),
    ostream_iterator<int>(cout, " "));
```

> 1 2 3 4 5
>

# vector成员函数
## vector的重置
**请务必记住先清空vector再resize!!!**

```cpp
ivec.clear();
ivec.resize(N,vector<int>(M,-1));
```

## `rbegin()`与`begin()`
+ `c.begin()` 返回一个迭代器，它指向容器c的第一个元素
+ `c.end()` 返回一个迭代器，它指向容器c的最后一个元素的**下一个**位置
+ `c.rbegin()` 返回一个逆序迭代器，它指向容器c的最后一个元素
+ `c.rend()` 返回一个逆序迭代器，它指向容器c的第一个元素前面的位置

## 插入（insert）


```cpp
vector<int> v = {5,4,3,2,1};
v.insert(v.begin()+1, 6);  //{5,6,4,3,2,1}  在1的位置放入6
v.insert(v.begin(),3,15); // 头部插入3个15 {15,15,15,5,6,4,3,2,1}
```



c++11 新增插入二维数组方式：

```cpp
vector<vector<int> > res;
res.push_back({1,2});
```

## 清除（erase, pop_back）


```cpp
vector<int> v = {0,1,2,3,4};
v.pop_back(); // 删除末尾元素 {0,1,2,3}
v.erase(v.begin()+1); // 删除第一个元素 {0,2,3}
v.erase(v.begin()+1, v.end());  // 删除第一个元素之后的所有元素（包括第一个）
//{0}
```

# 求和（accumulate）


在头文件`<numeric>`中



`n`表示从开始的n个元素，第三个参数是sum的初始值，求和不包括最后一个元素，也就是这里并不包括`*(v.begin()+n)`这个元素。其实第一个参数和第二个参数之间差是几，就相加了几个元素



```cpp
#include<numeric>
vector<int> v;
//...
int sum = accumulate(v.begin(), v.begin() + n, 0);
```

# 求最值（max_element）


注意，这里的`max_element`函数与`min_element`函数都是在**左闭右开**的区间查找。

```cpp
vector<int> v = {1,2,3};
// 求最大值，3 
int maxx = *max_element(v.begin(), v.end());  
// 求最大值的位置，2
int position=max_element(v.begin(), v.end())-v.begin();
```



# 反转容器（Reverse）


`reverse()`函数的用法，也是**左闭右开**

```cpp
vector<int> v = {5,4,3,2,1};
reverse(v.begin(),v.end());//容器v的值变为1,2,3,4,5
```



# 
