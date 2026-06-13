---
title: "C++ string"
description: "标准库定义了三种类型字符串流：istringstream,ostringstream,stringstream，看名字就知道这几种类型和iostream中的几个非常类似，分别可以读、写以及读和写string类型，它们也确实是从iostream类型派生而来的。要使用它们需要包含sstream头文..."
---

# C++ string

标准库定义了三种类型字符串流：`istringstream`,`ostringstream`,`stringstream`，看名字就知道这几种类型和iostream中的几个非常类似，分别可以**读、写以及读和写string类型**，它们也确实是从iostream类型派生而来的。要使用它们需要包含sstream头文件。

除了从iostream继承来的操作

- sstream类型定义了一个有string形参的构造函数，即：  `stringstream stream(s);`创建了存储s副本的stringstream对象,s为string类型对象
- 定义了名为str的成员，用来读取或设置stringstream对象所操纵的string值：`stream.str();`返回stream中存储的string类型对象`stream.str(s);` 将string类型的s复制给stream，返回void

# 类型转换

- string转char*

```c
string str=“world”;
const char *p = str.c_str();//同上，要加const或者等号右边用char*
```

- char * 转string

可以直接赋值。

```c
string s;
char *p = "hello";//直接赋值
s = p;
```

- int转string

c++11标准增加了全局函数std::to_string:

```c
string to_string (int val);

string to_string (long val);

string to_string (long long val);

string to_string (unsigned val);

string to_string (unsigned long val);

string to_string (unsigned long long val);

string to_string (float val);

string to_string (double val);

string to_string (long double val);
```

采用sstream中定义的字符串流对象来实现

```c
int aa = 30;
stringstream ss;
ss>s2;
cout

- string转换成int

stringstream可以吞下任何类型，根据实际需要吐出不同的类型。

```c
string s = "17";

stringstream ss;
ss>i;
cout

采用sstream头文件中定义的字符串流对象来实现转换

```c
istringstream is("12"); //构造输入字符串流，流的内容初始化为“12”的字符串   
int i;   
is >> i; //从is流中读入一个int整数存入i中
```
​

c++ 11新标准
​

将n进制的字符串转化为十进制 `stoi(字符串，起始位置，几进制)`；

```cpp
bool isnum(string s){
    //题目只保证第二个非空，第一个未说
    if(s.length()1000)
        return false;
    return true;
}
```
**如果是转换为**`**long**`**请用：**`**stol(字符串，起始位置，几进制)**`
**​**

# find函数

c++中string类中的find函数用于寻找字符串中是否包含子串，如果包含，那么函数返回第一个找到的子串的位置，如果不包含，返回-1. 
​

用法例子：

```c
#include
#include

using namespace std;

int main()
{
	string a="testcodecodecode";
	string b="code";
	string c="lee";
	int a_b=a.find(b);
	int a_c=a.find(c);
	cout

输出：

```bash
4
-1
```
## ​

# 分割字符串

`find_first_not_of()`函数:

```cpp
size_type find_first_not_of( const basic_string &str, size_type index = 0 );
size_type find_first_not_of( const char *str, size_type index = 0 );

size_type find_first_not_of( const char *str, size_type index, size_type num );

size_type find_first_not_of( char ch, size_type index = 0 );
```
​

- 在字符串中查找第一个与str中的字符都不匹配的字符，返回它的位置。搜索从index开始。如果没找到就返回string::nops
- 在字符串中查找第一个与str中的字符都不匹配的字符，返回它的位置。搜索从index开始，最多查找num个字符。如果没找到就返回string::nops
- 在字符串中查找第一个与ch不匹配的字符，返回它的位置。搜索从index开始。如果没找到就返回string::nops

​

C++11之前只能自己写，我目前发现的史上最优雅的一个实现是这样的：

```cpp
void split(const string& s, const string& delimiters = " ", vector& tokens)
{
    string::size_type first_pos = s.find_first_not_of(delimiters, 0);
    string::size_type last_pos = s.find_first_of(delimiters, first_pos);
    while (string::npos != first_pos || string::npos != last_pos) {
        tokens.push_back(s.substr(first_pos, last_pos - first_pos));//use emplace_back after C++11
        first_pos = s.find_first_not_of(delimiters, last_pos);
        last_pos = s.find_first_of(delimiters, first_pos);
    }
}
```
​

从C++11开始，标准库中提供了regex，regex用来做split就是小儿科了，比如：

```cpp
std::string text = "Quick brown fox.";
std::regex ws_re("\\s+"); // delimiter is whitespace
std::vector v(
	//-1 ： 表示对分隔符之间的子序列感兴趣
    std::sregex_token_iterator(text.begin(), text.end(), ws_re, -1), 
    std::sregex_token_iterator());

for(auto&& s: v)
    std::cout或者

```cpp
std::string text = "Quick brown fox.";
std::regex ws_re("\\s+"); // delimiter is whitespace
std::sregex_token_iterator spos(text.begin(),text.end(),ws_re,-1);
std::sregex_token_iterator end;
for(++spos;spos!=end;++spos){
    std::coutstr()

# 字符串替换

C++的string库提供了专门的函数方法来实现字符串的替换：`string.replace()`

但是这个函数将源字符串中某个字符串只替换了一次，[string类](https://so.csdn.net/so/search?q=string%E7%B1%BB&spm=1001.2101.3001.7020)并没有实现对于源字符串中的某个字符串全部替换。

replace函数包含于头文件`#include<string>`中。

```c
string& replace (size_t pos,   size_t len,   const string& str);
string& replace (const_iterator i1, const_iterator i2, const string& str);

string& replace (size_t pos,  size_t len,   const string& str,  size_t subpos, size_t sublen);

string& replace (size_t pos,   size_t len,  const char* s);
string& replace (const_iterator i1, const_iterator i2, const char* s);

string& replace (size_t pos,   size_t len,  const char* s, size_t n);
string& replace (const_iterator i1, const_iterator i2, const char* s, size_t n);

string& replace (size_t pos,    size_t len,  size_t n, char c);
string& replace (const_iterator i1, const_iterator i2, size_t n, char c);

template   string& replace (const_iterator i1, const_iterator i2,                   InputIterator first, InputIterator last);

string& replace (const_iterator i1, const_iterator i2, initializer_list il);
```

其中的泛型算法replace把队列中与给定值相等的所有值替换为另一个值，整个队列都被扫描，即此算法的各个版本都在线性时间内执行----其复杂度为1813718137。即replace的执行要遍历由区间`[frist，last)`限定的整个队列，以把 `old_value` 替换成 `new_value`

前3种的代码操作如下，每份代码前将其函数原型和参数含义给出方便理解：

```c
/* 用法一： 
 * string& replace (size_t pos, size_t len, const string& str); 
 * 源字符串中从位置 pos 开始长度为 len 的字符串 被字符串 str 代替 
 * 
 * 功能：只替换一次
 */  
int main()  
{
    string str_line("I love compile program with visual studio.");
    cout 

```c
/* 用法二： 
 * string& replace (const_iterator i1, const_iterator i2, const string& str); 
 * 用 str 替换 迭代器起始位置 和 结束位置 之间的字符 
 *
 * 功能：替换一段字符串
 */  
int main()  
{  
    string str_line("I love compile program with visual studio."); 
    // 用 str 替换 从begin位置开始的6个字符  
    cout 

```c
/* 用法三： 
 * string& replace (size_t pos, size_t len, const string& str, size_t subpos, size_t sublen); 
 * 源串指定位置上的子串（pos开始len长度）被替换为 str 的指定子串（给定起始位置和长度）
 */  
int main()  
{  
    string str_line("I love compile program with visual studio.");
    string substr = "12345";
    cout 

需要将**源字符串中的某个字符（或某段子串）全部替换**，而string库中未提供相关的库函数，这就需要我们自己进行编写实现:

```c
/* 编写函数：
 * string& replace_all (string& src, const string& old_value, const string& new_value); 
 * 参数：源字符串src    被替换的子串old_value    替换的子串new_value
 *
 * 功能：将 源串src 中 子串old_value 全部被替换为 new_value
 */ 
string& replace_all(string& src, const string& old_value, const string& new_value) {
    // 每次重新定位起始位置，防止上轮替换后的字符串形成新的old_value
	for (string::size_type pos(0); pos != string::npos; pos += new_value.length()) {
		if ((pos = src.find(old_value, pos)) != string::npos) {
			src.replace(pos, old_value.length(), new_value);
		}
		else break;
	}
	return src;
}
 
int main()
{
	string str("I love compile program with visual studio.");
	cout 

当然，我们也可以利用正则表达式，将正则表达式内容替换为指定内容，regex库用模板函数`std::regex_replace`提供「替换」操作。

现在，给定一个数据为&quot;he...ll..o, worl..d!&quot;， 思考一下，如何去掉其中误敲的“.”？

有思路了吗？来看看正则的解法：

```cpp
char data[] = "he...ll..o, worl..d!";
std::regex reg("\\.");
// output: hello, world!
std::cout