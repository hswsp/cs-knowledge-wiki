---
title: "统计函数"
description: "头文件 algorithm"
---

# 统计函数
## 统计元素出现的次数 
头文件 `algorithm`

`std::count(Iterator first, Iterator last, T &val)` 统计区间中某个元素出现的次数 

`std::count_if(InputIterator first, InputIterator last, UnaryPredicate pred)` 自定义比较函数

```cpp
// count_if example
#include <iostream>     // std::cout
#include <algorithm>    // std::count_if
#include <vector>       // std::vector

bool IsOdd (int i) { return ((i%2)==1); }

int main () {
  std::vector<int> myvector;
  for (int i=1; i<10; i++) myvector.push_back(i); // myvector: 1 2 3 4 5 6 7 8 9

  int mycount = count_if (myvector.begin(), myvector.end(), IsOdd);
  std::cout << "myvector contains " << mycount  << " odd values.\n";

  return 0;
}
```

## 查找给定区间内最大/小值


头文件 `algorithm`

`min_element()` 查找给定区间内最小值

`max_element()` 查找给定区间内最大值

```cpp
#include <iostream>
#include <vector>
#include <windows.h>
#include <algorithm>

using namespace std;

int main()
{
    vector<int> vec = {-7, 1, 10, 7, 2, 1};

    vector<int>::iterator itMax = max_element(vec.begin(), vec.end());
    vector<int>::iterator itMin = min_element(vec.begin(), vec.end());

    cout << "最大值为：" << *itMax << " " << "所在位置：" << distance(vec.begin(), itMax) << endl;
    cout << "最小值为：" << *itMin << " " << "所在位置：" << distance(vec.begin(), itMin) << endl;

    system("pause");
    return 0;
}
```



## 累加求和
```cpp
#include <numeric>

template <class InputIterator, class T>
   T accumulate (InputIterator first, InputIterator last, T init);

template <class InputIterator, class T, class BinaryOperation>
   T accumulate (InputIterator first, InputIterator last, T init,
                 BinaryOperation binary_op);
```

`accumulate`带有三个形参：头两个形参指定要累加的元素范围，第三个形参则是累加的初值。



accumulate函数将它的一个内部变量设置为指定的初始值，然后在此初值上累加输入范围内所有元素的值。accumulate算法返回累加的结果，其返回类型就是其第三个实参的类型。

```c
int sum = accumulate(vec.begin() , vec.end() , 42);
```



对于自定义数据类型，我们就需要自己动手写一个回调函数来实现自定义数据的处理，然后让它作为accumulate()的第四个参数



```c
#include <vector>
#include <string>
using namespace std;
 
struct Grade
{
	string name;
	int grade;
};
 
int main()
{
	Grade subject[3] = {
		{ "English", 80 },
		{ "Biology", 70 },
		{ "History", 90 }
	};
 
	int sum = accumulate(subject, subject + 3, 0, [](int a, Grade b){return a + b.grade; });
	cout << sum << endl;
 
	system("pause");
	return 0;
}
```

## 排序函数
### C++ is_sorted()函数


is_sorted() 函数有 2 种语法格式，分别是：

```c
//判断 [first, last) 区域内的数据是否符合 std::less<T> 排序规则，即是否为升序序列
bool is_sorted (ForwardIterator first, ForwardIterator last);
//判断 [first, last) 区域内的数据是否符合 comp 排序规则  
bool is_sorted (ForwardIterator first, ForwardIterator last, Compare comp);
```



其中，first 和 last 都为正向迭代器（这意味着该函数适用于大部分容器），[first, last) 用于指定要检测的序列；comp 用于指定自定义的排序规则。



> 注意，如果使用默认的升序排序规则，则 [first, last) 指定区域内的元素必须支持使用 < 小于运算符做比较；同样，如果指定排序规则为 comp，也要保证 [first, last) 区域内的元素支持该规则内部使用的比较运算符。
>



另外，该函数会返回一个 bool 类型值，即如果 [first, last) 范围内的序列符合我们指定的排序规则，则返回 true；反之，函数返回 false。值得一提得是，如果 [first, last) 指定范围内只有 1 个元素，则该函数始终返回 true。



举个例子：



```c
#include <iostream>     // std::cout
#include <algorithm>    // std::is_sorted
#include <vector>       // std::array
#include <list>         // std::list
using namespace std;
//以普通函数的方式自定义排序规则
bool mycomp1(int i, int j) {
    return (i > j);
}
//以函数对象的方式自定义排序规则
class mycomp2 {
public:
    bool operator() (int i, int j) {
        return (i > j);
    }
};

int main() {
    vector<int> myvector{ 3,1,2,4 };
    list<int> mylist{ 1,2,3,4 };
    //调用第 2 种语法格式的 is_sorted() 函数，该判断语句会得到执行
    if (!is_sorted(myvector.begin(), myvector.end(),mycomp2())) {
        cout << "开始对 myvector 容器排序" << endl;
        //对 myvector 容器做降序排序
        sort(myvector.begin(), myvector.end(),mycomp2());
        //输出 myvector 容器中的元素
        for (auto it = myvector.begin(); it != myvector.end(); ++it) {
            cout << *it << " ";
        }
    }
   
    //调用第一种语法格式的 is_sorted() 函数，该判断语句得不到执行
    if (!is_sorted(mylist.begin(), mylist.end())) {
        cout << "开始对 mylist 排序" << endl;
        //......
    }
    return 0;
}
```



程序执行结果为：

```bash
开始对 myvector 容器排序
4 3 2 1
```



结合输出结果可以看到，虽然 myvector 容器中的数据为降序序列，但我们需要的是升序序列。因此第 22 行代码中 is_sorted() 函数的返回值为 false，而 !false 即 true，所以此 if 判断语句会得到执行。



同样在 33 行代码中，mylist 容器中存储的数据为升序序列，和 is_sorted() 函数的要求相符，因此该函数的返回值为 true，而 !true 即 false，所以此 if 判断语句将无法得到执行。

