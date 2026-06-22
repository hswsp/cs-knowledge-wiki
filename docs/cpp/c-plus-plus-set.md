---
title: "set"
description: "和vector、list不同，set、map都是关联式容器。set内部是基于红黑树实现的。插入和删除操作效率较高，因为只需要修改相关指针而不用进行数据的移动。"
---

# set


和vector、list不同，set、map都是关联式容器。set内部是基于红黑树实现的。插入和删除操作效率较高，因为只需要修改相关指针而不用进行数据的移动。



按关键字有序保存元素：set(关键字即值，即只保存关键字的容器)；multiset(关键字可重复出现的set)；



在set中每个元素的值都唯一，而且系统能根据元素的值自动进行排序。set中元素的值不能直接被改变。set内部采用的是一种非常高效的平衡检索二叉树：红黑树，也称为RB树(Red-Black Tree)。RB树的统计性能要好于一般平衡二叉树。



我们说过set的内部使用了红黑树对所有的元素进行了排序。在树结构当中，我们通常使用的都是`<key, value>`的形式。其中的`key`用来排序，`value`则是我们实际存储的值。只不过set有些特殊，它的value和key是一样的，相当于是`<key, key>`的形式，所以它依然是关联式的容器。



还有一点，从数学层面，set的一个集合，好比一个袋子里面装了好多个小球。但是红黑树是一种特殊的二叉搜索树，set中的元素根据其值的大小在红黑树中有特定的位置，是不可移动的。所以，1是search操作效率会很高`O(log n)`，2是set中元素的值不可改变。



set具备的两个特点：

+ set中的元素都是排序好的
+ set中的元素都是唯一的，没有重复的



在进行数据删除操作后，迭代器会不会失效呢？删除set的数据时，实际的操作是删除红黑树中的一个节点，然后相关指针做相关调整。指向其他元素的迭代器还是指向原位置，并没有改变，所以删除一个节点后其他迭代器不会失效。list和map也是同样的道理。然而删除vector中的某个元素，vector中其他迭代器会失效，因为vector是基于数组的，删除一个元素后，后面的元素会往前移动，所以指向后面元素的迭代器会失效。



再稍微说一下迭代器的实现。迭代器是一个对象，vector的迭代器是封装了数组下标；list、map、set的迭代器是封装了元素节点的指针。

## 
## set的数据操作


数据插入删除操作同`unordered_set`,此外还有如下操作：

```java
::begin()     　//迭代器
::end() 　　　　 //迭代器
::clear()   　　//删除set容器中的所有的元素
::empty() 　　　//判断set容器是否为空
::max_size() 　//返回set容器可能包含的元素最大个数
::size() 　　　//返回当前set容器中的元素个数
::rbegin　　　//逆迭代器
::rend()　　//逆迭代器
/*返回一个迭代器，该迭代器指向set容器中的键，该键等于参数中传递的val。
如果在集合容器中没有val，它将返回一个迭代器，该迭代器指向比val大的下一个元素。*/    
::lower_bound()  
::upper_bound(); //返回大于某个值元素的迭代器
```

由于set是有序集合，默认从小到达排序，故而有

```cpp
set<int>s;
s.insert(1);
s.insert(3);
s.insert(5);
s.insert(2);
s.insert(0);
s.insert(4);
cout<<"s的最小值:"<<*s.begin()<<endl;//第一个数值（最小值）的函数为*s.begin();
cout<<"s的最大值为:"<<*s.rbegin()<<endl;//最后一个数值（最大值）的函数为*s.rbegin();
```

## vector与set转化
```cpp
int removeDuplicates(vector<int>& nums) {
        set<int> st(nums.begin(), nums.end());
        nums.assign(st.begin(), st.end());
        return st.size();

    }
```

## 
## 迭代器


set是基于红黑树实现的，那么set的迭代器begin()、end()是指向哪里的呢？



一个测试程序：



```java
#include<iostream>
#include<set>
using namespace std;
int main(){
    set<int> myset;
    myset.insert(4);
    myset.insert(7);
    myset.insert(2);
    myset.insert(0);
    myset.insert(4);
    set<int>::iterator it;
    for(it = myset.begin(); it != myset.end(); it++){
        cout<< *it;   //输出结果是：0247
    }
}
```



红黑树首先是二叉搜索树，所以begin()迭代器指向红黑树的最左边的节点，end()迭代器指向红黑树的最右边的节点。另外这个小程序还说明了重复插入无效。



## unordered_set


unordered_set 容器，可直译为“无序 set 容器”，即 unordered_set 容器和 set 容器很像，唯一的区别就在于 set 容器会自行对存储的数据进行排序，而 unordered_set 容器不会。



总的来说，unordered_set 容器具有以下几个特性：



1. 不再以键值对的形式存储数据，而是直接存储数据的值；
2. 容器内部存储的各个元素的值都互不相等，且不能被修改。
3. 不会对内部存储的数据进行排序（这和该容器底层采用哈希表结构存储数据有关，可阅读《[C++ STL无序容器底层实现原理](http://c.biancheng.net/view/7235.html)》一文做详细了解）；



> 对于 unordered_set 容器不以键值对的形式存储数据，读者也可以这样认为，即 unordered_set 存储的都是键和值相等的键值对，为了节省存储空间，该类容器在实际存储时选择只存储每个键值对的值。
>



另外，实现 unordered_set 容器的模板类定义在`<unordered_set>`头文件，并位于 std 命名空间中。这意味着，如果程序中需要使用该类型容器，则首先应该包含如下代码：



```c
#include <unordered_set>using namespace std;
```



> 注意，第二行代码不是必需的，但如果不用，则程序中只要用到该容器时，必须手动注明 std 命名空间（强烈建议初学者使用）。
>



unordered_set 容器的类模板定义如下：



```plain
template < class Key,            //容器中存储元素的类型
           class Hash = hash<Key>,    //确定元素存储位置所用的哈希函数
           class Pred = equal_to<Key>,   //判断各个元素是否相等所用的函数
           class Alloc = allocator<Key>   //指定分配器对象的类型
           > class unordered_set;
```



可以看到，以上 4 个参数中，只有第一个参数没有默认值，这意味着如果我们想创建一个 unordered_set 容器，至少需要手动传递 1 个参数。事实上，在 99% 的实际场景中最多只需要使用前 3 个参数（各自含义如表 1 所示），最后一个参数保持默认值即可。

| 参数 | 含义 |
| --- | --- |
| Key | 确定容器存储元素的类型，如果读者将 unordered_set 看做是存储键和值相同的键值对的容器，则此参数则用于确定各个键值对的键和值的类型，因为它们是完全相同的，因此一定是同一数据类型的数据。 |
| Hash = hash | 指定 unordered_set 容器底层存储各个元素时，所使用的哈希函数。需要注意的是，默认哈希函数 hash 只适用于基本数据类型（包括 string 类型），而不适用于自定义的结构体或者类。 |
| Pred = equal_to | unordered_set 容器内部不能存储相等的元素，而衡量 2 个元素是否相等的标准，取决于该参数指定的函数。 默认情况下，使用 STL 标准库中提供的 equal_to 规则，该规则仅支持可直接用 == 运算符做比较的数据类型。 |




> 注意，如果 unordered_set 容器中存储的元素为自定义的数据类型，则默认的哈希函数 hash 以及比较函数 equal_to 将不再适用，只能自己设计适用该类型的哈希函数和比较函数，并显式传递给 Hash 参数和 Pred 参数。至于如何实现自定义，后续章节会做详细讲解。
>



### 创建C++ unordered_set容器


前面介绍了如何创建 unordered_map 和 unordered_multimap 容器，值得一提的是，创建它们的所有方式完全适用于 unordereded_set 容器。不过，考虑到一些读者可能尚未学习其它无序容器，因此这里还是讲解一下创建 unordered_set 容器的几种方法。



1. 通过调用 unordered_set 模板类的默认构造函数，可以创建空的 unordered_set 容器。比如：



```plain
std::unordered_set<std::string> uset;
```



> 如果程序已经引入了 std 命名空间，这里可以省略所有的 std::。
>



由此，就创建好了一个可存储 string 类型值的 unordered_set 容器，该容器底层采用默认的哈希函数 hash 和比较函数 equal_to。



2. 当然，在创建 unordered_set 容器的同时，可以完成初始化操作。比如：



```c
std::unordered_set<std::string> uset{ "http://c.biancheng.net/c/",
                                      "http://c.biancheng.net/java/",
                                      "http://c.biancheng.net/linux/" };
```



通过此方法创建的 uset 容器中，就包含有 3 个 string 类型元素。



3. 还可以调用 unordered_set 模板中提供的复制（拷贝）构造函数，将现有 unordered_set 容器中存储的元素全部用于为新建 unordered_set 容器初始化。



例如，在第二种方式创建好 uset 容器的基础上，再创建并初始化一个 uset2 容器：



```c
std::unordered_set<std::string> uset2(uset);
```



由此，umap2 容器中就包含有 umap 容器中所有的元素。



除此之外，C++ 11 标准中还向 unordered_set 模板类增加了移动构造函数，即以右值引用的方式，利用临时 unordered_set 容器中存储的所有元素，给新建容器初始化。例如：



```c
//返回临时 unordered_set 容器的函数
std::unordered_set <std::string> retuset() {
    std::unordered_set<std::string> tempuset{ "http://c.biancheng.net/c/",
                                              "http://c.biancheng.net/java/",
                                              "http://c.biancheng.net/linux/" };
    return tempuset;
}
//调用移动构造函数，创建 uset 容器
std::unordered_set<std::string> uset(retuset());
```



> 注意，无论是调用复制构造函数还是拷贝构造函数，必须保证 2 个容器的类型完全相同。
>



4. 当然，如果不想全部拷贝，可以使用 unordered_set 类模板提供的迭代器，在现有 unordered_set 容器中选择部分区域内的元素，为新建 unordered_set 容器初始化。例如：



```c
//传入 2 个迭代器，
std::unordered_set<std::string> uset2(++uset.begin(),uset.end());
```



通过此方式创建的 uset2 容器，其内部就包含 uset 容器中除第 1 个元素外的所有其它元素。



5. 自定义类型的创建

```cpp
struct Rect {
	int width;
	int height;
	string name;
 
public:
	Rect(int a, int b,string str)
	{
		width = a;
		height = b;
		name = str;
	}
	
};
//哈希函数
struct Rect_hash
{	
	size_t operator()(const Rect& r1) const
	{
		return hash<string>()(r1.name) ^ hash<int>()(r1.width) ^ hash<int>()(r1.height);
	}
};
//equal相当于重载operator==
// int->string  to_string
//string temp = to_string(rc1.name) 
struct Rect_equal
{
	bool operator()(const Rect& rc1, const Rect& rc2) const noexcept
	{
		return rc1.width == rc2.width && rc1.height == rc2.height && rc1.name == rc2.name;
	}
 
};
 
void hashset_rect()
{
	unordered_set < Rect, Rect_hash, Rect_equal> rectS;
	rectS.insert({ 0,0,"rect0" });
	rectS.insert({ 1,1,"rect1" });
	rectS.insert({ 2,2,"rect2" });
	rectS.insert({ 3,3,"rect3" });
	for (auto it = rectS.begin(); it != rectS.end(); ++it)
	{
		cout << "name=" << it->name << ",width=" << it->width << ",heigh=" << it->height << endl;
	}
}
```



### C++ unordered_set容器的成员方法


unordered_set 类模板中，提供了如表 2 所示的成员方法。

| 成员方法 | 功能 |
| --- | --- |
| begin() | 返回指向容器中第一个元素的正向迭代器。 |
| end(); | 返回指向容器中最后一个元素之后位置的正向迭代器。 |
| cbegin() | 和 begin() 功能相同，只不过其返回的是 const 类型的正向迭代器。 |
| cend() | 和 end() 功能相同，只不过其返回的是 const 类型的正向迭代器。 |
| empty() | 若容器为空，则返回 true；否则 false。 |
| size() | 返回当前容器中存有元素的个数。 |
| max_size() | 返回容器所能容纳元素的最大个数，不同的操作系统，其返回值亦不相同。 |
| find(key) | 查找以值为 key 的元素，如果找到，则返回一个指向该元素的正向迭代器；反之，则返回一个指向容器中最后一个元素之后位置的迭代器（如果 end() 方法返回的迭代器）。 |
| count(key) | 在容器中查找值为 key 的元素的个数。 |
| equal_range(key) | 返回一个 pair 对象，其包含 2 个迭代器，用于表明当前容器中值为 key 的元素所在的范围。 |
| emplace() | 向容器中添加新元素，效率比 insert() 方法高。 |
| emplace_hint() | 向容器中添加新元素，效率比 insert() 方法高。 |
| insert() | 向容器中添加新元素。 |
| erase() | 删除指定元素。 |
| clear() | 清空容器，即删除容器中存储的所有元素。 |
| swap() | 交换 2 个 unordered_map 容器存储的元素，前提是必须保证这 2 个容器的类型完全相等。 |
| bucket_count() | 返回当前容器底层存储元素时，使用桶（一个线性链表代表一个桶）的数量。 |
| max_bucket_count() | 返回当前系统中，unordered_map 容器底层最多可以使用多少桶。 |
| bucket_size(n) | 返回第 n 个桶中存储元素的数量。 |
| bucket(key) | 返回值为 key 的元素所在桶的编号。 |
| load_factor() | 返回 unordered_map 容器中当前的负载因子。负载因子，指的是的当前容器中存储元素的数量（size()）和使用桶数（bucket_count()）的比值，即 load_factor() = size() / bucket_count()。 |
| max_load_factor() | 返回或者设置当前 unordered_map 容器的负载因子。 |
| rehash(n) | 将当前容器底层使用桶的数量设置为 n。 |
| reserve() | 将存储桶的数量（也就是 bucket_count() 方法的返回值）设置为至少容纳count个元（不超过最大负载因子）所需的数量，并重新整理容器。 |
| hash_function() | 返回当前容器使用的哈希函数对象。 |




注意，此容器模板类中没有重载 [ ] 运算符，也没有提供 at() 成员方法。不仅如此，由于 unordered_set 容器内部存储的元素值不能被修改，因此无论使用那个迭代器方法获得的迭代器，都不能用于修改容器中元素的值。



另外，对于实现互换 2 个相同类型 unordered_set 容器的所有元素，除了调用表 2 中的 swap() 成员方法外，还可以使用 STL 标准库提供的 swap() 非成员函数，它们具有相同的名称，用法也相同（都只需要传入 2 个参数即可），仅是调用方式上有差别。



下面的样例演示了表 2 中部分成员方法的用法：



```c
#include <iostream>
#include <string>
#include <unordered_set>
using namespace std;

int main()
{
    //创建一个空的unordered_set容器
    std::unordered_set<std::string> uset;
    //给 uset 容器添加数据
    uset.emplace("http://c.biancheng.net/java/");
    uset.emplace("http://c.biancheng.net/c/");
    uset.emplace("http://c.biancheng.net/python/");
    //查看当前 uset 容器存储元素的个数
    cout << "uset size = " << uset.size() << endl;
    //遍历输出 uset 容器存储的所有元素
    for (auto iter = uset.begin(); iter != uset.end(); ++iter) {
        cout << *iter << endl;
    }
    return 0;
}
```



程序执行结果为：



```bash
uset size = 3
http://c.biancheng.net/java/
http://c.biancheng.net/c/
http://c.biancheng.net/python/
```



