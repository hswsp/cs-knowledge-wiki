---
title: "查找函数"
description: "find() 函数本质上是一个模板函数，用于在指定范围内查找和目标元素值相等的第一个元素。"
---

# 查找函数


## STL find()


find() 函数本质上是一个模板函数，用于在指定范围内查找和目标元素值相等的第一个元素。



如下为 find() 函数的语法格式：



`InputIterator find (InputIterator first, InputIterator last, const T& val);`



其中，first 和 last 为输入迭代器，[first, last) 用于指定该函数的查找范围；val 为要查找的目标元素。



> 正因为 first 和 last 的类型为输入迭代器，因此该函数适用于所有的序列式容器。
>



另外，该函数会**返回一个输入迭代器**，当 find() 函数查找成功时，其指向的是在 [first, last) 区域内查找到的第一个目标元素；**如果查找失败，则该迭代器的指向和 last 相同**。



值得一提的是，find() 函数的底层实现，其实就是用`==`运算符将 val 和 [first, last) 区域内的元素逐个进行比对。这也就意味着，[first, last) 区域内的元素必须支持`==`运算符。



```c
#include <iostream>     // std::cout
#include <algorithm>    // std::find
#include <vector>       // std::vector
using namespace std;
int main() {
    //find() 函数作用于普通数组
    char stl[] ="http://c.biancheng.net/stl/";
    //调用 find() 查找第一个字符 'c'
    char * p = find(stl, stl + strlen(stl), 'c');
    //判断是否查找成功
    if (p != stl + strlen(stl)) {
        cout << p << endl;
    }
    //find() 函数作用于容器
    std::vector<int> myvector{ 10,20,30,40,50 };
    std::vector<int>::iterator it;

    it = find(myvector.begin(), myvector.end(), 30);
    if (it != myvector.end())
        cout << "查找成功：" << *it;
    else
        cout << "查找失败";
    return 0;
}
```



程序执行结果为：



```bash
c.biancheng.net/stl/
查找成功：30
```



可以看到，find() 函数除了可以作用于序列式容器，还可以作用于普通数组。



## STL find_if()


find_if() 同 find() 一样，为在输入迭代器所定义的范围内查找单个对象的算法，它可以在前两个参数指定的范围内查找可以使第三个参数指定的谓词返回 true 的第一个对象。谓词不能修改传给它的对象。



find_if() 会**返回一个指向被找到对象的迭代器，如果没有找到对象，会返回这个序列的结束迭代器**。



可以按如下方式使用 find_if() 来查找 numbers 中第一个大于 value 的元素：



```c
int value {5};
auto iter1 = std::find_if(std::begin(numbers), std::end(numbers),[value](int n) { return n > value; });

if(iter1 != std::end(numbers))
    std::cout << *iter1 << " was found greater than " << value << ".\n";
```



find_if() 的第三个参数是一个 lambda 表达式的谓词。这个 lambda 表达式以值的方式捕获 value，并在 lambda 参数大于 value 时返回 true。这段代码会找到一个值为 46 的元素。

## 
## 二分查找的函数


[二分查找](http://c.biancheng.net/view/7521.html)的函数有 3 个：



1.`lower_bound(起始地址，结束地址，要查找的数值) `返回大于或**等于**val的第一个元素位置。返回的是数值第一个出现的位置。

![](https://images.spumn.eu.cc/blog/3133c396310290fb.png)



2.`upper_bound(起始地址，结束地址，要查找的数值)` 返回大于val的第一个元素位置。返回的是数值最后一个 出现的位置。

![](https://images.spumn.eu.cc/blog/15ba65994b5b09b0.png)

3.`binary_search(起始地址，结束地址，要查找的数值) ` 返回的是**是否存在**这么一个数，是一个bool值。

binary_search() 用来在一个有序区间中使用二分法查找元素是否在这个区间中，该算法的返回值为bool表示是否存在。

```cpp
template <class ForwardIterator, class T>

bool binary_search (ForwardIterator first, ForwardIterator last, const T& val)

{

  first = std::lower_bound(first,last,val);

  return (first!=last && !(val<*first));

}
```



### Example


数组 a(下标从1开始) : 1  2  3  3  3  4  5。查找 3 ：

```c
int position1 = lower_bound(a+1,a+n,3) - a; //position1 = 2
int position2 = upper_bound(a+1,a+n,3) - a; //position2 = 5
```



需要注意的是：如果数组中没有找到所求元素，函数就会返回一个假想的插入位置。

```c
int a[6] = {0,1,2,4,5,7};
    int position1 = lower_bound(a+1,a+6,3) - a;
    int position2 = upper_bound(a+1,a+6,3) - a;
    cout << position1 << endl;
    cout << position2 << endl;
// position1 = position2 = 3
```





```c
// lower_bound/upper_bound example
#include <iostream>     // std::cout
#include <algorithm>    // std::lower_bound, std::upper_bound, std::sort
#include <vector>       // std::vector

int main () {
  int myints[] = {10,20,30,30,20,10,10,20};
  std::vector<int> v(myints,myints+8);           // 10 20 30 30 20 10 10 20

  std::sort (v.begin(), v.end());                // 10 10 10 20 20 20 30 30

  std::vector<int>::iterator low,up;
  low=std::lower_bound (v.begin(), v.end(), 20); //          
  up= std::upper_bound (v.begin(), v.end(), 20); //                   

  std::cout << "lower_bound at position " << (low- v.begin()) << '\n';
  std::cout << "upper_bound at position " << (up - v.begin()) << '\n';

  return 0;
}
```



二分查找的首要条件是数列有序！



注：如果我想将该函数用于下降序列的话，使用`greater`函数，但是意义会改变:

```c
#include<iostream>
#include <algorithm>
using namespace std;
int main(){
    int a[10] = {10,9,8,7,6,5,4,3,2,1};
    cout<<*lower_bound(a,a+10,6,greater<int>())<<endl;
    cout<<*upper_bound(a,a+10,6,greater<int>())<<endl;
    return 0;
}
```



那么输出结果就变成了6和5

![](https://images.spumn.eu.cc/blog/3d2d0e27df9d9a50.png)

使用自定义比较器(greater)函数查找到的就是:

+ `lower_bound()` 函数查找**降序数组**中小于等于（<=）指定元素的第一个元素。
+ `upper_bound()`函数查找**降序数组**中小于（<）指定元素的第一个元素。

****

## 区间查找(区间整体匹配）


1. `search()` 查找**子区间首次出现**的位置 
+ 与`find()` 用来查找单个元素相比，`search()` 用来查找一个子区间。比如 从`myvector`中查找区间`[20, 30]` 的位置

```cpp
int needle1[] = {20,30};

it = std::search (myvector.begin(), myvector.end(), needle1, needle1+2);

if (it!=myvector.end())

std::cout << "needle1 found at position " << (it-myvector.begin()) << '\n';
```

+ search() 支持自定义比较函数，比如查询给定区间中每个元素比目标区间小1的子区间:

```cpp
#include <iostream>
#include <vector>

using namespace std;

bool cmpFunction (int i, int j) {

  return (i-j==1);

}

int main(int, char**) {
   

int myints[] = {1,2,3,4,5,1,2,3,4,5};

std::vector<int> haystack (myints,myints+10);

int needle2[] = {1,2,3};

// using predicate comparison:

std::vector<int>::iterator it = std::search (haystack.begin(), haystack.end(), needle2, needle2+3, cmpFunction);

if (it!=haystack.end())
    std::cout << "needle2 found at position " << (it-haystack.begin()) << '\n';
  else
    std::cout << "needle2 not found\n";

  return 0;
}
```

输出：

```bash
needle2 found at position 1
```



2. find_end() 查找子区间最后一次出现的位置 
+ search()查找子区间第一次出现的位置，而find_end() 用来查找子区间最后一次出现的位置，	find_end()支持自定义比较函数。



# 排序sort


`sort(first_pointer,first_pointer+n,cmp)`



该函数可以给数组，或者链表list、向量排序。



实现原理：sort并不是简单的快速排序，它对普通的快速排序进行了优化，此外，它还结合了插入排序和推排序。系统会根据你的数据形式和数据量自动选择合适的排序方法，这并不是说它每次排序只选择一种方法，它是在一次完整排序中不同的情况选用不同方法，比如给一个数据量较大的数组排序，开始采用快速排序，分段递归，分段之后每一段的数据量达到一个较小值后它就不继续往下递归，而是选择插入排序，如果递归的太深，他会选择推排序。



此函数有3个参数：



参数1：第一个参数是数组的首地址，一般写上数组名就可以，因为数组名是一个指针常量。



参数2：第二个参数相对较好理解，即首地址加上数组的长度n（代表尾地址的下一地址）。



参数3：默认可以不填，如果不填sort会默认按数组升序排序。也就是1,2,3,4排序。也可以自定义一个排序函数，改排序方式为降序什么的，也就是4,3,2,1这样。



使用此函数需先包含：

```c
#include <algorithm>
```



并且导出命名空间：

```cpp
using namespace std;
```





sort不只是能像上面那样简单的使用，我们可以对sort进行扩展，关键就在于第三个参数<cmp比较函数>，我们想降序排列，或者说我不是一个简简单单的数组，而是结构体、类怎么办，下面给出一些方法和例子。



## 方法一：定义比较函数（最常用）


```c
//情况一：数组排列
int A[100];
bool cmp1(int a,int b)//int为数组数据类型
{
return a>b;//降序排列
//return a<b;//默认的升序排列
}
sort(A,A+100,cmp1);

//情况二：结构体排序
Student Stu[100];
bool cmp2(Student a,Student b)
{
return a.id>b.id;//按照学号降序排列
//return a.id<b.id;//按照学号升序排列
}
sort(Stu,Stu+100,cmp2);
```



注：比较方法也可以放在结构体中或类中定义。

```cpp
//情况一：在结构体内部重载
struct Student{
    int id;
    string name;
    double grade;

    bool operator<(const Student& s)
    {
        return id>s.id;//降序排列
        //return id<s.id;//升序排列
    }
};
vector<Student> V;
sort(V.begin(),V.end());


//情况二：函数对象
struct Less
{
    bool operator()(const Student& s1, const Student& s2)
    {
        return s1.id<s2.id; //升序排列
    }
};
sort(sutVector.begin(),stuVector.end(),Less());
```



## 方法二：使用标准库函数


另外，其实我们还可以再懒一点，在标准库中已经有现成的。它在哪呢？答案是functional，我们include进来试试看。



functional提供了一堆基于模板的比较函数对象，它们是：`equal_to<Type>`、`not_equal_to<Type>`、`greater<Type>`、`greater_equal<Type>`、`less<Type>`、`less_equal<Type>`。这些东西的用法看名字就知道了。



在这里，我么sort要用到的也只是greater和less就足够了，用法如下：



```cpp
升序：sort(begin,end,less<data-type>())

降序：sort(begin,end,greater<data-type>())
```



## 方法三：使用lambda表达式


与functional同理，我们可以使用Lambda表达式代替functional接口。



比如Leetcode [179. Largest Number](https://leetcode-cn.com/problems/largest-number/) 中自定义排序如下：



```cpp
string largestNumber(vector<int>& nums) {
    //自定义拼接后比大小的函数
    sort(nums.begin(),nums.end(),[](const int& a, const int& b){
        long ax = 10;
        long bx = 10;
        while(ax<=a){ //大于a的最小10的幂
            ax*=10;
        }
        while(bx<=b){
            bx*=10;
        }
        return a*bx+b>b*ax+a;
    });
    
    if (nums[0] == 0) {
        return "0";
    }
    string out;
    for(int& x:nums){
        out+=to_string(x);
    }
    return out;
}
```





