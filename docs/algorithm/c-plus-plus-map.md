---
title: "创建unordered_map容器的方法"
description: "unordered_map 容器，直译过来就是\"无序 map 容器\"的意思。所谓“无序”，指的是 unordered_map 容器不会像 map 容器那样对存储的数据进行排序。换句话说，unordered_map 容器和 map 容器仅有一"
---

unordered_map 容器，直译过来就是"无序 map 容器"的意思。所谓“无序”，指的是 unordered_map 容器不会像 map 容器那样对存储的数据进行排序。换句话说，unordered_map 容器和 map 容器仅有一点不同，即 map 容器中存储的数据是有序的，而 unordered_map 容器中是无序的。



> 对于已经学过 map 容器的读者，可以将 unordered_map 容器等价为无序的 map 容器。
>



具体来讲，unordered_map 容器和 map 容器一样，以键值对（pair类型）的形式存储数据，存储的各个键值对的键互不相同且不允许被修改。但由于 **unordered_map 容器底层采用的是哈希表存储结构**，该结构本身不具有对数据的排序功能，所以此容器内部不会自行对存储的键值对进行排序。



值得一提的是，unordered_map 容器在`<unordered_map>`头文件中，并位于 std 命名空间中。因此，如果想使用该容器，代码中应包含如下语句：



```cpp
#include <unordered_map>
using namespace std;
```



> 注意，第二行代码不是必需的，但如果不用，则后续程序中在使用此容器时，需手动注明 std 命名空间（强烈建议初学者使用）。
>



unordered_map 容器模板的定义如下所示：



```cpp
template < class Key,                        //键值对中键的类型
           class T,                          //键值对中值的类型
           class Hash = hash<Key>,           //容器内部存储键值对所用的哈希函数
           class Pred = equal_to<Key>,       //判断各个键值对键相同的规则
           class Alloc = allocator< pair<const Key,T> >  // 指定分配器对象的类型
           > class unordered_map;
```



以上 5 个参数中，必须显式给前 2 个参数传值，并且除特殊情况外，最多只需要使用前 4 个参数，各自的含义和功能如表 1 所示。

| 参数 | 含义 |
| --- | --- |
| <key,T> | 前 2 个参数分别用于确定键值对中键和值的类型，也就是存储键值对的类型。 |
| Hash = hash | 用于指明容器在存储各个键值对时要使用的哈希函数，默认使用 STL 标准库提供的 hash 哈希函数。注意，默认哈希函数只适用于基本数据类型（包括 string 类型），而不适用于自定义的结构体或者类。 |
| Pred = equal_to | 要知道，unordered_map 容器中存储的各个键值对的键是不能相等的，而判断是否相等的规则，就由此参数指定。默认情况下，使用 STL 标准库中提供的 equal_to 规则，该规则仅支持可直接用 == 运算符做比较的数据类型。 |




> 总的来说，当无序容器中存储键值对的键为自定义类型时，默认的哈希函数 hash 以及比较函数 equal_to 将不再适用，只能自己设计适用该类型的哈希函数和比较函数，并显式传递给 Hash 参数和 Pred 参数。
>



# 创建unordered_map容器的方法


常见的创建 unordered_map 容器的方法有以下几种。



1. 通过调用 unordered_map 模板类的默认构造函数，可以创建空的 unordered_map 容器。比如：



```cpp
std::unordered_map<std::string, std::string> umap;
```



由此，就创建好了一个可存储 <string,string> 类型键值对的 unordered_map 容器。



2. 当然，在创建 unordered_map 容器的同时，可以完成初始化操作。比如：



```c
std::unordered_map<std::string, std::string> umap{
    {"Python教程","http://c.biancheng.net/python/"},
    {"Java教程","http://c.biancheng.net/java/"},
    {"Linux教程","http://c.biancheng.net/linux/"} };
```



通过此方法创建的 umap 容器中，就包含有 3 个键值对元素。



3. 另外，还可以调用 unordered_map 模板中提供的**复制（拷贝）构造函数**，将现有 unordered_map 容器中存储的键值对，复制给新建 unordered_map 容器。



例如，在第二种方式创建好 umap 容器的基础上，再创建并初始化一个 umap2 容器：



```cpp
std::unordered_map<std::string, std::string> umap2(umap);
```



由此，umap2 容器中就包含有 umap 容器中所有的键值对。



除此之外，C++ 11 标准中还向 unordered_map 模板类增加了移动构造函数，即以右值引用的方式将临时 unordered_map 容器中存储的所有键值对，全部复制给新建容器。例如：



```cpp
//返回临时 unordered_map 容器的函数
std::unordered_map <std::string, std::string > retUmap(){
    std::unordered_map<std::string, std::string> tempUmap{
        {"Python教程","http://c.biancheng.net/python/"},
        {"Java教程","http://c.biancheng.net/java/"},
        {"Linux教程","http://c.biancheng.net/linux/"} };
    return tempUmap;
}
//调用移动构造函数，创建 umap2 容器
std::unordered_map<std::string, std::string> umap2(retUmap());
```



注意，无论是调用复制构造函数还是拷贝构造函数，必须保证 2 个容器的类型完全相同。



4. 当然，如果不想全部拷贝，可以使用 unordered_map 类模板提供的迭代器，在现有 unordered_map 容器中选择部分区域内的键值对，为新建 unordered_map 容器初始化。例如：



```c
//传入 2 个迭代器，
std::unordered_map<std::string, std::string> umap2(++umap.begin(),umap.end());
```



通过此方式创建的 umap2 容器，其内部就包含 umap 容器中除第 1 个键值对外的所有其它键值对。

# unordered_map 自定义键值类型


## 方法1：std::function


方法1就是利用std::function为person_hash()构建函数实例。初始化时，这个函数实例就会被分配那个指向person_hash()的指针（通过构造函数实现），如下所示。



```cpp
#include <iostream>
#include <unordered_map>
#include <string>
#include <functional>

using namespace std;

class Person{
public:
string name;
int age;

Person(string n, int a){
    name = n;
    age = a;
}
bool operator==(const Person & p) const 
{
    return name == p.name && age == p.age;
}
};

size_t person_hash( const Person & p ) 
{
    return hash<string>()(p.name) ^ hash<int>()(p.age);
}

int main(int argc, char* argv[])
{
    //ERRO: unordered_map<Person,int,decltype(&person_hash)> ids;
    //ERRO: unordered_map<Person,int,person_hash> ids(100, person_hash );
    //OK: unordered_map<Person, int, decltype(&person_hash)> ids(100, person_hash );
    unordered_map<Person,int,function<size_t( const Person& p )>> ids(100, person_hash); //需要把person_hash传入构造函数
    ids[Person("Mark", 17)] = 40561;
    ids[Person("Andrew",16)] = 40562;
    for ( auto ii = ids.begin() ; ii != ids.end() ; ii++ )
        cout << ii->first.name 
            << " " << ii->first.age 
            << " : " << ii->second 
            << endl;
    return 0;
}
```



因为std::function构建对象的表达过于复杂，我们可以利用C++11新增的关键字decltype。它可以直接获取自定义哈希函数的类型，并把它作为参数传送。因此，ids的声明可以改成下面这样。



```c
unordered_map<Person,int,decltype(&person_hash)> ids(100, person_hash);
```



另外，我们还可以引入c++11新支持的lambda expression，程序如下。



```c
#include <iostream>
#include <unordered_map>
#include <string>
#include <functional>

using namespace std;

class Person{
public:
    string name;
    int age;

    Person(string n, int a){
        name = n;
        age = a;
    }

    bool operator==(const Person & p) const 
    {
        return name == p.name && age == p.age;
    }
};

int main(int argc, char* argv[])
{
    unordered_map<Person,int,std::function<size_t (const Person & p)>>
    ids(100, []( const Person & p)
             {
                 return hash<string>()(p.name) ^ hash<int>()(p.age);
             } );
    ids[Person("Mark", 17)] = 40561;
    ids[Person("Andrew",16)] = 40562;
    for ( auto ii = ids.begin() ; ii != ids.end() ; ii++ )
        cout << ii->first.name 
        << " " << ii->first.age
        << " : " << ii->second 
        << endl;
        return 0;
}
```



但是，使用lambda有2个弊端：



1. 我们就无法使用decltype获取函数对象的类型，而只能用更复杂的std::function方法。
2. 程序的可读性下降。



## 方法2：重载operator()的类


方法2就是利用重载operator()的类，将哈希函数打包成可以直接调用的类。此时，虽然我们仍然需要第3个参数，但是我们不需要将函数对象的引用传入构造器里。



```c
#include <iostream>
#include <string>
#include <unordered_map>
#include <functional>
using namespace std;

class Person{
public:
    string name;
    int age;

    Person(string n, int a){
        name = n;
        age = a;
    }

    bool operator==(const Person & p) const 
    {
        return name == p.name && age == p.age;
    }
};

struct hash_name{
	size_t operator()(const Person & p) const{
		return hash<string>()(p.name) ^ hash<int>()(p.age);
	}
};

int main(int argc, char* argv[]){
	unordered_map<Person, int, hash_name> ids; //不需要把哈希函数传入构造器
	ids[Person("Mark", 17)] = 40561;
    ids[Person("Andrew",16)] = 40562;
    for ( auto ii = ids.begin() ; ii != ids.end() ; ii++ )
        cout << ii->first.name 
        << " " << ii->first.age
        << " : " << ii->second
        << endl;
    return 0;
}
```



## 方法3：模板定制


unordered_map第3个参数的默认参数是`std::hash<Key>`，实际上就是模板类。那么我们就可以对它进行模板定制，如下所示。



```c
#include <iostream>
#include <unordered_map>
#include <string>
#include <functional>
using namespace std;

typedef pair<string,string> Name;

namespace std {
    template <> //function-template-specialization
        class hash<Name>{
        public :
            size_t operator()(const Name &name ) const
            {
                return hash<string>()(name.first) ^ hash<string>()(name.second);
            }
    };
};

int main(int argc, char* argv[])
{
    unordered_map<Name,int> ids;
    ids[Name("Mark", "Nelson")] = 40561;
    ids[Name("Andrew","Binstock")] = 40562;
    for ( auto ii = ids.begin() ; ii != ids.end() ; ii++ )
        cout << ii->first.first 
             << " " << ii->first.second 
             << " : " << ii->second
             << endl;
	return 0;
}
```



当我们将模板订制包含在定义类的头文件中时，其他人无需额外工作，就可以直接用我们的类作为任何无序容器的键。这对于要使用我们自定义类的人来说，绝对是最方便的。



因此，如果你想要在多个地方用这个类，方法3是最好的选择。当然，你要确保自己的hash function不会影响std空间里的其他类。



下例是哈希函数对象和等比函数对象都采用模板定制的方法。



```cpp
#include <iostream>
#include <string>
#include <unordered_map>
#include <functional>
using namespace std;

class Person{
public:
string name;
int age;

Person(string n, int a){
    name = n;
    age = a;
}
};

namespace std{
template<>
struct hash<Person>{//哈希的模板定制
public:
size_t operator()(const Person &p) const 
{
    return hash<string>()(p.name) ^ hash<int>()(p.age);
}

};

template<>
struct equal_to<Person>{//等比的模板定制
public:
bool operator()(const Person &p1, const Person &p2) const
{
    return p1.name == p2.name && p1.age == p2.age;
}

};
}

int main(int argc, char* argv[]){
    unordered_map<Person, int> ids;
    ids[Person("Mark", 17)] = 40561;
    ids[Person("Andrew",16)] = 40562;
    for ( auto ii = ids.begin() ; ii != ids.end() ; ii++ )
        cout << ii->first.name 
            << " " << ii->first.age
            << " : " << ii->second
            << endl;
    return 0;
}
```

## 
# unordered_map容器的成员方法


unordered_map 既可以看做是关联式容器，更属于自成一脉的无序容器。因此在该容器模板类中，既包含一些在学习关联式容器时常见的成员方法，还有一些属于无序容器特有的成员方法。



表 2 列出了 unordered_map 类模板提供的所有常用的成员方法以及各自的功能。

| 成员方法 | 功能 |
| --- | --- |
| begin() | 返回指向容器中第一个键值对的正向迭代器。 |
| end() | 返回指向容器中最后一个键值对之后位置的正向迭代器。 |
| cbegin() | 和 begin() 功能相同，只不过在其基础上增加了 const 属性，即该方法返回的迭代器不能用于修改容器内存储的键值对。 |
| cend() | 和 end() 功能相同，只不过在其基础上，增加了 const 属性，即该方法返回的迭代器不能用于修改容器内存储的键值对。 |
| empty() | 若容器为空，则返回 true；否则 false。 |
| size() | 返回当前容器中存有键值对的个数。 |
| max_size() | 返回容器所能容纳键值对的最大个数，不同的操作系统，其返回值亦不相同。 |
| operator[key] | 该模板类中重载了 [] 运算符，其功能是可以向访问数组中元素那样，只要给定某个键值对的键 key，就可以获取该键对应的值。注意，如果当前容器中没有以 key 为键的键值对，则其会使用该键向当前容器中插入一个新键值对。 |
| at(key) | 返回容器中存储的键 key 对应的值，如果 key 不存在，则会抛出 out_of_range 异常。 |
| find(key) | 查找以 key 为键的键值对，如果找到，则返回一个指向该键值对的正向迭代器；反之，则返回一个指向容器中最后一个键值对之后位置的迭代器（如果 end() 方法返回的迭代器）。 |
| count(key) | 在容器中查找以 key 键的键值对的个数。 |
| equal_range(key) | 返回一个 pair 对象，其包含 2 个迭代器，用于表明当前容器中键为 key 的键值对所在的范围。 |
| emplace() | 向容器中添加新键值对，效率比 insert() 方法高。 |
| emplace_hint() | 向容器中添加新键值对，效率比 insert() 方法高。 |
| insert() | 向容器中添加新键值对。 |
| erase() | 删除指定键值对。 |
| clear() | 清空容器，即删除容器中存储的所有键值对。 |
| swap() | 交换 2 个 unordered_map 容器存储的键值对，前提是必须保证这 2 个容器的类型完全相等。 |
| bucket_count() | 返回当前容器底层存储键值对时，使用桶（一个线性链表代表一个桶）的数量。 |
| max_bucket_count() | 返回当前系统中，unordered_map 容器底层最多可以使用多少桶。 |
| bucket_size(n) | 返回第 n 个桶中存储键值对的数量。 |
| bucket(key) | 返回以 key 为键的键值对所在桶的编号。 |
| load_factor() | 返回 unordered_map 容器中当前的负载因子。负载因子，指的是的当前容器中存储键值对的数量（size()）和使用桶数（bucket_count()）的比值，即 load_factor() = size() / bucket_count()。 |
| max_load_factor() | 返回或者设置当前 unordered_map 容器的负载因子。 |
| rehash(n) | 将当前容器底层使用桶的数量设置为 n。 |
| reserve() | 将存储桶的数量（也就是 bucket_count() 方法的返回值）设置为至少容纳count个元（不超过最大负载因子）所需的数量，并重新整理容器。 |
| hash_function() | 返回当前容器使用的哈希函数对象。 |




> 注意: 对于实现互换 2 个相同类型 unordered_map 容器的键值对，除了可以调用该容器模板类中提供的 swap() 成员方法外，STL 标准库还提供了同名的 swap() 非成员函数。
>



注意：不存在的key在被索引后被添加到了map中并被赋予了一个默认值（一般的，整数为0，字符，字符串为空）。应当在索引前使用find或者count来判断键是否存在，以防止一些未定义情况



下面的样例演示了表 2 中部分成员方法的用法：



```c
#include <iostream>
#include <string>
#include <unordered_map>
using namespace std;
int main()
{
    //创建空 umap 容器
    unordered_map<string, string> umap;
    //向 umap 容器添加新键值对
    umap.emplace("Python教程", "http://c.biancheng.net/python/");
    umap.emplace("Java教程", "http://c.biancheng.net/java/");
    umap.emplace("Linux教程", "http://c.biancheng.net/linux/");

    //输出 umap 存储键值对的数量
    cout << "umap size = " << umap.size() << endl;
    //使用迭代器输出 umap 容器存储的所有键值对
    for (auto iter = umap.begin(); iter != umap.end(); ++iter) {
        cout << iter->first << " " << iter->second << endl;
    }
    return 0;
}
```



程序执行结果为：



```bash
umap size = 3
Python教程 http://c.biancheng.net/python/
Linux教程 http://c.biancheng.net/linux/
Java教程 http://c.biancheng.net/java/
```



## emplace()方法


emplace() 方法的用法很简单，其语法格式如下：



```c
template <class... Args>
  pair<iterator, bool> emplace ( Args&&... args );
```



其中，参数 args 表示可直接向该方法传递创建新键值对所需要的 2 个元素的值，其中第一个元素将作为键值对的键，另一个作为键值对的值。也就是说，该方法无需我们手动创建键值对，其内部会自行完成此工作。



另外需要注意的是，该方法的返回值为 pair 类型值，其包含一个迭代器和一个 bool 类型值：



+ 当 emplace() 成功添加新键值对时，返回的迭代器指向新添加的键值对，bool 值为 True；
+ 当 emplace() 添加新键值对失败时，说明容器中本就包含一个键相等的键值对，此时返回的迭代器指向的就是容器中键相同的这个键值对，bool 值为 False。



举个例子：



```c
#include <iostream>
#include <string>
#include <unordered_map>
using namespace std;
int main()
{
    //创建 umap 容器
    unordered_map<string, string> umap;
    //定义一个接受 emplace() 方法的 pair 类型变量
    pair<unordered_map<string, string>::iterator, bool> ret;
    //调用 emplace() 方法
    ret = umap.emplace("STL教程", "http://c.biancheng.net/stl/");
    //输出 ret 中包含的 2 个元素的值
    cout << "bool =" << ret.second << endl;
    cout << "iter ->" << ret.first->first << " " << ret.first->second << endl;
    return 0;
}
```



程序执行结果为：



```c
bool =1
iter ->STL教程 http://c.biancheng.net/stl/
```



通过执行结果中 bool 变量的值为 1 可以得知，emplace() 方法成功将新键值对添加到了 umap 容器中。



## emplace_hint()方法


emplace_hint() 方法的语法格式如下：



```c
template <class... Args>
  iterator emplace_hint ( const_iterator position, Args&&... args );
```



和 emplace() 方法相同，emplace_hint() 方法内部会自行构造新键值对，因此我们只需向其传递构建该键值对所需的 2 个元素（第一个作为键，另一个作为值）即可。不同之处在于：



+ emplace_hint() 方法的返回值仅是一个迭代器，而不再是 pair 类型变量。当该方法将新键值对成功添加到容器中时，返回的迭代器指向新添加的键值对；反之，如果添加失败，该迭代器指向的是容器中和要添加键值对键相同的那个键值对。
+ emplace_hint() 方法还需要传递一个迭代器作为第一个参数，该迭代器表明将新键值对添加到容器中的位置。需要注意的是，新键值对添加到容器中的位置，并不是此迭代器说了算，最终仍取决于该键值对的键的值。



> 可以这样理解，emplace_hint() 方法中传入的迭代器，仅是给 unordered_map 容器提供一个建议，并不一定会被容器采纳。
>



举个例子：



```c
#include <iostream>
#include <string>
#include <unordered_map>
using namespace std;
int main()
{
    //创建 umap 容器
    unordered_map<string, string> umap;
    //定义一个接受 emplace_hint() 方法的迭代器
    unordered_map<string,string>::iterator iter;
    //调用 empalce_hint() 方法
    iter = umap.emplace_hint(umap.begin(),"STL教程", "http://c.biancheng.net/stl/");
    //输出 emplace_hint() 返回迭代器 iter 指向的键值对的内容
    cout << "iter ->" << iter->first << " " << iter->second << endl;
    return 0;
}
```



程序执行结果为：



```bash
iter ->STL教程 http://c.biancheng.net/stl/
```



> 有关表 2 中其它成员方法的用法，读者可以自行查询 [C++ STL标准库手册](http://www.cplusplus.com/reference/unordered_map/unordered_map/)。
>

# unordered_map遍历
```cpp
//创建 umap 容器
unordered_map<string, string> umap{
    {"Python教程","http://c.biancheng.net/python/"},
    {"Java教程","http://c.biancheng.net/java/"},
        {"Linux教程","http://c.biancheng.net/linux/"} };
```

方法一：迭代器

```cpp
//遍历输出 umap 容器中所有的键值对
for (auto iter = umap.begin(); iter != umap.end(); ++iter) {
    cout << "<" << iter->first << ", " << iter->second << ">" << endl;
  }
```

方法二：新特性

```cpp

for (auto& [key, num] : mp) {
    maxn = max(maxn, num + 1);
}

```

这里如果不需要`key`可以用`_`代替



