---
title: "ASCII码"
description: "![](https://images.spumn.eu.cc/blog/c2c637b52f22dfc3.png)"
---

![](https://images.spumn.eu.cc/blog/c2c637b52f22dfc3.png)

# ASCII码


常见ASCII码如下

| Bin(二进制) | Oct(八进制) | Dec(十进制) | Hex(十六进制) | 缩写/字符 | 解释 |
| --- | --- | --- | --- | --- | --- |
| 0011 0000 | 060 | 48 | 0x30 | 0 | 字符0 |
| 0100 0001 | 0101 | 65 | 0x41 | A | 大写字母A |
| 0110 0001 | 0141 | 97 | 0x61 | a | 小写字母a |
| 0010 0000 | 040 | 32 | 0x20 | (space) | 空格 |


## 缓冲区输入


`cin`对空格和回车都不敏感，都不影响继续读入数据，所以需要利用`getchar()`函数检测回车



如下代码会一直读取缓冲区中数存入vector直到读取到回车结束

```cpp
#include <iostream>
#include <vector>

using namespace std;
int main(int, char**) {
    vector<int> n;
    int t;
    while(cin>>t){
        n.push_back(t);
        if(getchar()=='\n') break;
    }
    for(auto x: n){
        cout<<x<<" ";
    }
    cout<<endl;
    return 0;
}
```

输出结果：

```bash
build [main●●●] % /Users/wu000376/Code/Algorithm/c++/inputTest/build/input 
1 2 3 4 5 6 7
1 2 3 4 5 6 7 
build [main●●●] % 
```



## C++中常量最大、最小整数


C++中常量INT_MAX和INT_MIN分别表示最大、最小整数，定义在头文件limits.h中。



```cpp
#define INT_MAX 2147483647
#define INT_MIN (-INT_MAX - 1)
```



## 随机数


用时间值做种子，就可以产生随机数了，因为时间总是在变的嘛。



将`time(NULL)`作为srand()的参数，更新种子，再用`rand()`函数产生随机数。



```c
#include<iostream>
#include<cstdlib>
#include<time.h> 
using namespace std;
int main()
{
	srand(time(NULL));
	cout << rand() << endl; 
	return 0;
}
```



需要注意的是，`srand(time(NULL))`只需要执行一次即可。



### 限定区间


但这里获取的值是不确定的，而如果我们希望获得在某一范围内的值呢，也很简单，如下所示：



```c
#include<iostream>
#include<ctime>
using namespace std;
int main()
{
    srand(time(0));
    for (int i = 0; i < 100; i++)
    cout << rand() % 100 << endl;
    return 0;
}
```



而如果我们希望得到0 - 1之间的数呢？ 如下所示：



```c
#include<iostream>
#include<ctime>
using namespace std;
int main()
{
    srand(time(0));
    for (int i = 0; i < 100; i++)
        cout << (rand() % 10) * 0.1 << endl;
    return 0;
}
```



而我们希望得到-1 到 1 之间的数呢？



```c
#include<iostream>
#include<ctime>
using namespace std;
int main()
{
    srand(time(0));
    for (int i = 0; i < 100; i++)
        cout << (rand() % 10) * 0.2 - 1 << endl;
    return 0;
}
```



### 32位扩展


`rand()`产生的数是0~RAND_MAX( 0x7fff)，也就是说，只能生成15位。如果需要32位的，可以进行扩展：



```c
unsigned int rand_32()
{
	return (rand()&0x3)<<30 | rand()<<15 | rand();
}
```



