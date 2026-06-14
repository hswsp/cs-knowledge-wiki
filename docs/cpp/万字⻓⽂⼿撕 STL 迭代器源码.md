# 万字⻓⽂⼿撕 STL 迭代器源码

与 traits 编程技法⼤家好，我是⼩贺。

⽂章每周持续更新，可以微信搜索公众号「herongwei」第⼀时间阅读和催更。

本⽂ GitHub : https://github.com/rongweihe/CPPNotes已经收录，有⼀线⼤⼚⾯试点思维导图，也整理了很多我的⽂档，欢迎点个⼩和完善。⼀起加油，变得更⭐好！

**14.1 前⾔**

上⼀篇，我们剖析了 STL 空间配置器，这⼀篇⽂章，我们来学习下 STL 迭代器以及背后的traits 编程技法。

![万字⻓⽂⼿撕 STL 迭代器源码 图 179](https://images.spumn.eu.cc/cpp-baguwen-v1/cpp_baguwen_html-179_1-9d629b964ac8.png)

在 STL 编程中，容器和算法是独⽴设计的，容器⾥⾯存的是数据，⽽算法则是提供了对数据的操作，在算法操作数据的过程中，要⽤到迭代器，迭代器可以看做是容器和算法中间的桥梁。

![万字⻓⽂⼿撕 STL 迭代器源码 图 180](https://images.spumn.eu.cc/cpp-baguwen-v1/cpp_baguwen_html-180_1-a620af8cb54b.png)

**14.2 迭代器设计模式**

为何说迭代器的时候，还谈到了设计模式？这个迭代器和设计模式⼜有什么关系呢？

其实，在《设计模式：可复⽤⾯向对象软件的基础》（GOF）这本经典书中，谈到了 23 种设计模式，其中就有 iterator 迭代模式，且篇幅颇⼤。

碰巧，笔者在研究 STL 源码的时候，同样的发现有 iterator 迭代器，⽽且还占据了⼀章的篇幅。

在设计模式中，关于 iterator 的描述如下：⼀种能够顺序访问容器中每个元素的⽅法，使⽤该⽅法不能暴露容器内部的表达⽅式。⽽类型萃取技术就是为了要解决和 iterator 有关的问题的。

有了上⾯这个基础，我们就知道了迭代器本身也是⼀种设计模式，其设计思想值得我们仔细体会。

那么 C++ STL 实现 iterator 和 GOF 介绍的迭代器实现⽅法什么区别呢？那⾸先我们需要了解 C++ 中的两个编程范式的概念，OOP（⾯向对象编程）和 GP（泛型编程）。

在 C++ 语⾔⾥⾯，我们可⽤以下⽅式来简单区分⼀下 OOP 和 GP ：

![万字⻓⽂⼿撕 STL 迭代器源码 图 181](https://images.spumn.eu.cc/cpp-baguwen-v1/cpp_baguwen_html-181_1-b9f5a62659d9.png)

OOP：将methods和datas关联到⼀起（通俗点就是⽅法和成员变量放到⼀个类中实现），通过继承的⽅式，利⽤虚函数表（virtual）来实现运⾏时类型的判定，也叫"动态多态"，由于运⾏过程中需根据类型去检索虚函数表，因此效率相对较低。

GP：泛型编程，也被称为"静态多态"，多种数据类型在同⼀种算法或者结构上皆可操作，其效率与针对某特定数据类型⽽设计的算法或者结构相同，具体数据类型在编译期确定，编译器承担更多，代码执⾏效率⾼。在STL中利⽤GP将methods和datas实现了分⽽治之。

⽽C++ STL库的整个实现采⽤的就是GP（Generic Programming），⽽不是OOP（ObjectOriented Programming）。⽽GOF设计模式采⽤的就是继承关系实现的，因此，相对来讲，C++ STL的实现效率会相对较⾼，⽽且也更有利于维护。

在STL编程结构⾥⾯，迭代器其实也是⼀种模板class，迭代器在STL中得到了⼴泛的应⽤，通过迭代器，容器和算法可以有机的绑定在⼀起，只要对算法给予不同的迭代器，⽐如vector::iterator、list::iterator，std::find()就能对不同的容器进⾏查找，⽽⽆需针对某个容器来设计多个版本。

**这样看来，迭代器似乎依附在容器之下，那么，有没有独⽴⽽适⽤于所有容器的泛化的迭代器**

**呢？这个问题先留着，在后⾯我们会看到，在STL编程结构⾥⾯，它是如何把迭代器运⽤的**

炉⽕纯⻘。

**14.3 智能指针**

STL 是泛型编程思想的产物，是以泛型编程为指导⽽产⽣的。具体来说，STL 中的迭代器将范型算法(find, count, find_if)等应⽤于某个容器中，给算法提供⼀个访问容器元素的⼯具，iterator就扮演着这个重要的⻆⾊。

稍微看过 STL 迭代器源码的，就明⽩迭代器其实也是⼀种智能指针，因此，它也就拥有了⼀般指针的所有特点—— 能够对其进⾏*和-&gt;操作。

```cpp
template<typename T>
```

classListIterator {//mylist迭代器

```cpp
public:
```

ListIterator(T *p = 0) : m_ptr(p){} //构造函数T& operator*() const { return *m_ptr;} //取值，即dereferenceT* operator-&gt;() const { return m_ptr;} //成员访问，即member access

```cpp
//...
};
```

但是在遍历容器的时候，不可避免的要对遍历的容器内部有所了解，所以，⼲脆把迭代器的开发⼯作交给容器的设计者，如此以来，所有实现细节反⽽得以封装起来不被使⽤者看到，这也正是为什么每⼀种 STL 容器都提供有专属迭代器的缘故。

⽐如笔者⾃⼰实现的list迭代器在这⾥使⽤的好处主要有：

(1) 不⽤担⼼内存泄漏（类似智能指针，析构函数释放内存）；

(2) 对于list，取下⼀个元素不是通过⾃增⽽是通过next指针来取，使⽤智能指针

可以对⾃增进⾏重载，从⽽提供统⼀接⼝。

**14.4 template 参数推导**

参数推导能帮我们解决什么问题呢？

在算法中，你可能会定义⼀个简单的中间变量或者设定算法的返回变量类型，这时候，你可能会遇到这样的问题，假如你需要知道迭代器所指元素的类型是什么，进⽽获取这个迭代器操作的算法的返回类型，但是问题是C++没有typeof这类判断类型的函数，也⽆法直接获取，那该如何是好？

注意是类型，不是迭代器的值，虽然C++提供了⼀个typeid()操作符，这个操作符只能获得型别的名称，但不能⽤来声明变量。要想获得迭代器型别，这个时候⼜该如何是好呢？

function templatefunction template的参数推导机制是⼀个不错的⽅法。

例如：

如果I是某个指向特定对象的指针，那么在 func 中需要指针所指向对象的型别的时候，怎么办呢？这个还⽐较容易，模板的参数推导机制可以完成任务，

```cpp
template <classI>
inlinevoidfunc(I iter) {
```

func_imp(iter, *iter); // 传⼊ iter 和 iter 所指的值，class ⾃动推导

```cpp
}
```

通过模板的推导机制，就能轻⽽易举的获得指针所指向的对象的类型。

```cpp
template <classI, classT>
voidfunc_imp(I iter, T t) {
```

T tmp; // 这⾥就是迭代器所指物的类别// ... 功能实现

```cpp
}
intmain() {
int i;
```

func(&i);//这⾥传⼊的是⼀个迭代器（原⽣指针也是⼀种迭代器）

```cpp
}
```

![万字⻓⽂⼿撕 STL 迭代器源码 图 184](https://images.spumn.eu.cc/cpp-baguwen-v1/cpp_baguwen_html-184_1-64e075ebc75d.png)

上⾯的做法呢，通过多层的迭代，很巧妙地导出了T，但是却很有局限性，⽐如，我希望func()返回迭代器的value type类型返回值，函数的 "templatetemplate参数推导机制" 推

**导的只是参数，⽆法推导函数的返回值类型。万⼀需要推导函数的返回值，好像就不⾏了，那**

**么⼜该如何是好？**

这就引出了下⾯的内嵌型别。

**14.5 声明内嵌型别**

上述所说的迭代器所指对象的型别，称之为迭代器的value typevalue type。

尽管在func_impl中我们可以把T作为函数的返回值，但是问题是⽤户需要调⽤的是func。

如果在参数推导机制上加上内嵌型别(typedef)呢？为指定的对象类型定义⼀个别名，然后直接获取，这样来看⼀下实现：

```cpp
template<typename T>
classMyIter {
public:
```

typedef T value_type; //内嵌类型声明

```cpp
MyIter(T *p = 0) : m_ptr(p) {}
T& operator*() const { return *m_ptr;}
private:
T *m_ptr;
};
```

//以迭代器所指对象的类型作为返回类型//注意typename是必须的，它告诉编译器这是⼀个类型

```cpp
template<typename MyIter>
typename MyIter::value_type Func(MyIter iter) {
return *iter;
}
intmain(int argc, constchar*argv[]) {
MyIter<int> iter(newint(666));
std::cout<<Func(iter)<<std::endl;  //print=> 666
}
```

![万字⻓⽂⼿撕 STL 迭代器源码 图 185](https://images.spumn.eu.cc/cpp-baguwen-v1/cpp_baguwen_html-185_1-8a63c0691d97.png)

**上⾯的解决⽅案看着可⾏，但其实呢，实际上还是有问题，这⾥有⼀个隐晦的陷阱：实际上并**

不是所有的迭代器都是class typeclass type，原⽣指针也是⼀种迭代器，由于原⽣指针不是class typeclass type，所以没法为它定义内嵌型别。

![万字⻓⽂⼿撕 STL 迭代器源码 图 186](https://images.spumn.eu.cc/cpp-baguwen-v1/cpp_baguwen_html-186_1-246574aa766d.png)

因为func如果是⼀个泛型算法，那么它也绝对要接受⼀个原⽣指针作为迭代器，下⾯的代码编译没法通过：

```cpp
int*p = newint(5);
cout<<Func(p)<<endl; // error
```

要解决这个问题，Partial specialization（模板偏特化）就出场了。

**14.6 Partial specialization（模板偏特化）**

所谓偏特化是指如果⼀个class template拥有⼀个以上的template参数，我们可以针对其中某个（或多个，但不是全部）template参数进⾏特化，⽐如下⾯这个例⼦：

```cpp
template <typename T>
```

classC {...}; //此泛化版本的 T 可以是任何类型

```cpp
template <typename T>
```

classC&lt;T*&gt; {...}; //特化版本，仅仅适⽤于 T 为“原⽣指针”的情况，是泛化版本的限制版

**所谓特化，就是特殊情况特殊处理，第⼀个类为泛化版本，T可以是任意类型，第⼆个类为**

特化版本，是第⼀个类的特殊情况，只针对原⽣指针。

**14.6.1、原⽣指针怎么办？——特性 “萃取” traits**

**还记得前⾯说过的参数推导机制+内嵌型别机制获取型别有什么问题吗？问题就在于原⽣指针**

虽然是迭代器但不是class，⽆法定义内嵌型别，⽽偏特化似乎可以解决这个问题。

有了上⾯的认识，我们再看看STL是如何应⽤的。STL定义了下⾯的类模板，它专⻔⽤来“萃取”迭代器的特性，⽽value type正是迭代器的特性之⼀：

traits在bits/stl_iterator_base_types.h这个⽂件中：

```cpp
template<class_Tp>
structiterator_traits<_Tp*> {
typedefptrdiff_t difference_type;
typedeftypename _Tp::value_type value_type;
typedeftypename _Tp::pointer pointer;
typedeftypename _Tp::reference reference;
typedeftypename _Tp::iterator_category iterator_category;
};
template<typename Iterator>
```

structiterator_traits { //类型萃取机typedeftypename Iterator::value_type value_type; //value_type 就是Iterator 的类型型别

```cpp
}
```

加⼊萃取机前后的变化：

template&lt;typename Iterator&gt; //萃取前

```cpp
typename Iterator::value_type  func(Iterator iter) {
return *iter;
}
```

//通过 iterator_traits 作⽤后的版本template&lt;typename Iterator&gt; //萃取后

```cpp
typename iterator_traits<Iterator>::value_type  func(Iterator iter) {
return *iter;
}
```

看到这⾥也许你会问了，这个萃取前和萃取后的typename ：

iterator_traits::value_type跟Iterator::value_type看起来⼀样啊，为什么还要增加iterator_traits这⼀层封装，岂不是多此⼀举？

**回想萃取之前的版本有什么缺陷：不⽀持原⽣指针。⽽通过萃取机的封装，我们可以通过类模**

**板的特化来⽀持原⽣指针的版本！如此⼀来，⽆论是智能指针，还是原⽣指针，**

iterator_traits::value_type 都能起作⽤，这就解决了前⾯的问题。

//iterator_traits的偏特化版本，针对迭代器是原⽣指针的情况

```cpp
template<typename T>
structiterator_traits<T*> {
typedef T value_type;
};
```

看到这⾥，我们不得不佩服的 STL 的设计者们，真·秒啊！我们⽤下⾯这张图来总结⼀下前⾯的流程：

![万字⻓⽂⼿撕 STL 迭代器源码 图 189](https://images.spumn.eu.cc/cpp-baguwen-v1/cpp_baguwen_html-189_1-e767ecb41555.png)

**14.6.2 、const 偏特化**

通过偏特化添加⼀层中间转换的 traits 模板 class，能实现对原⽣指针和迭代器的⽀持，有的读者可能会继续追问：对于指向常数对象的指针⼜该怎么处理呢？⽐如下⾯的例⼦：

iterator_traits&lt;constint*&gt;::value_type // 获得的 value_type 是 constint，⽽不是 intconst 变量只能初始化，⽽不能赋值（这两个概念必须区分清楚）。这将带来下⾯的问题：

```cpp
template<typename Iterator>
typename iterator_traits<Iterator>::value_type  func(Iterator iter) {
typename iterator_traits<Iterator>::value_type tmp;
```

tmp = *iter; // 编译 error

```cpp
}
int val = 666 ;
constint*p = &val;
```

func(p); // 这时函数⾥对 tmp 的赋值都将是不允许的

**那该如何是好呢？答案还是偏特化，来看实现：**

```cpp
template<typename T>
```

structiterator_traits&lt;const T*&gt; { //特化const指针typedef T value_type; //得到T⽽不是const T

```cpp
}
```

**14.7 traits编程技法总结**

**通过上⾯⼏节的介绍，我们知道，所谓的 traits 编程技法⽆⾮就是增加⼀层中间的模板**

classclass，以解决获取迭代器的型别中的原⽣指针问题。利⽤⼀个中间层iterator_traits固定了func的形式，使得重复的代码⼤量减少，唯⼀要做的就是稍稍特化⼀下iterator_tartis使其⽀持pointer和const pointer。

![万字⻓⽂⼿撕 STL 迭代器源码 图 190](https://images.spumn.eu.cc/cpp-baguwen-v1/cpp_baguwen_html-190_1-f8b77f008e5b.png)

```cpp
#include <iostream>
template <classT>
structMyIter {
```

typedef T value_type; // 内嵌型别声明

```cpp
T* ptr;
MyIter(T* p = 0) : ptr(p) {}
T& operator*() const { return *ptr; }
};
// class type
template <classT>
structmy_iterator_traits {
typedeftypename T::value_type value_type;
};
```

// 偏特化 1

```cpp
template <classT>
structmy_iterator_traits<T*> {
typedef T value_type;
};
```

// 偏特化 2

```cpp
template <classT>
structmy_iterator_traits<const T*> {
typedef T value_type;
};
```

// ⾸先询问 iterator_traits&lt;I&gt;::value_type,如果传递的 I 为指针,则进⼊特化版本,iterator_traits 直接回答;如果传递进来的 I 为 class type,就去询问

```cpp
T::value_type.
template <classI>
typename my_iterator_traits<I>::value_type Func(I ite) {
std::cout << "normal version" << std::endl;
return *ite;
}
intmain(int argc, constchar*argv[]) {
MyIter<int> ite(newint(6));
std::cout << Func(ite)<<std::endl;//print=> 6
int*p = newint(7);
std::cout<<Func(p)<<std::endl;//print=> 7
constint k = 8;
std::cout<<Func(&k)<<std::endl;//print=> 8
}
```

上述的过程是⾸先询问iterator_traits::value_type，如果传递的 I 为指针,则进⼊特化版本, iterator_traits直接回答T；如果传递进来的I为class type，就去询问T::value_type。

通俗的解释可以参照下图：

![万字⻓⽂⼿撕 STL 迭代器源码 图 192](https://images.spumn.eu.cc/cpp-baguwen-v1/cpp_baguwen_html-192_1-1b7d768ba870.png)

**总结：核⼼知识点在于模板参数推导机制+内嵌类型定义机制，为了能处理原⽣指针这种特**

**殊的迭代器，引⼊了偏特化机制。traits就像⼀台 “特性萃取机”，把迭代器放进去，就能**

榨取出迭代器的特性。

这种偏特化是针对可调⽤函数func的偏特化，想象⼀种极端情况，假如func有⼏百万⾏代码，那么如果不这样做的话，就会造成⾮常⼤的代码污染。同时增加了代码冗余。

![万字⻓⽂⼿撕 STL 迭代器源码 图 193](https://images.spumn.eu.cc/cpp-baguwen-v1/cpp_baguwen_html-193_1-4529e43f57f8.png)

**14.8 迭代器的型别和种类**

14.8.1 迭代器的型别我们再来看看迭代器的型别，常⻅迭代器相应型别有 5 种：

value_type：迭代器所指对象的类型，原⽣指针也是⼀种迭代器，对于原⽣指针 int*，int 即为指针所指对象的类型，也就是所谓的 value_type 。

difference_type：⽤来表示两个迭代器之间的距离，对于原⽣指针，STL 以 C++ 内建的 ptrdiff_t 作为原⽣指针的 difference_type。

reference_type：是指迭代器所指对象的类型的引⽤，reference_type ⼀般⽤在迭代器的 * 运算符重载上，如果 value_type 是 T，那么对应的 reference_type 就是 T&；如果value_type 是 const T，那么对应的reference_type 就是 const T&。

pointer_type：就是相应的指针类型，对于指针来说，最常⽤的功能就是 operator* 和operator-&gt; 两个运算符。

iterator_category：的作⽤是标识迭代器的移动特性和可以对迭代器执⾏的操作，从iterator_category 上，可将迭代器分为 Input Iterator、Output Iterator、ForwardIterator、Bidirectional Iterator、Random Access Iterator 五类，这样分可以尽可能地提⾼效率。

```cpp
template<typename Category,
typename T,
typename Distance = ptrdiff_t,
typename Pointer = T*,
typename Reference = T&>
```

structiterator//迭代器的定义

```cpp
{
typedef Category iterator_category;
typedef T value_type;
typedef Distance difference_type;
typedef Pointer pointer;
typedef Reference reference;
};
```

iterator class 不包含任何成员变量，只有类型的定义，因此不会增加额外的负担。由于后⾯三

**个类型都有默认值，在继承它的时候，只需要提供前两个参数就可以了。这个类主要是⽤来继**

承的，在实现具体的迭代器时，可以继承上⾯的类，这样⼦就不会漏掉上⾯的 5 个型别了。

对应的迭代器萃取机设计如下：

```cpp
tempalte<typename I>
```

structiterator_traits {//特性萃取机，萃取迭代器特性

```cpp
typedeftypename I::iterator_category iterator_category;
typedeftypename I::value_type value_type;
typedef typeanme I:difference_type difference_type;
typedeftypename I::pointer pointer;
typedeftypename I::reference reference;
};
```

//需要对型别为指针和 const 指针设计特化版本看14.8.2、迭代器的分类最后，我们来看看，迭代器型别iterator_category对应的迭代器类别，这个类别会限制迭代器的操作和移动特性。

**除了原⽣指针以外，迭代器被分为五类：**

Input Iterator：此迭代器不允许修改所指的对象，是只读的。⽀持 ==、!=、++、*、-&gt; 等操作。

Output Iterator：允许算法在这种迭代器所形成的区间上进⾏只写操作。⽀持 ++、*等操作。

Forward Iterator：允许算法在这种迭代器所形成的区间上进⾏读写操作，但只能单向移动，每次只能移动⼀步。⽀持 Input Iterator 和 Output Iterator 的所有操作。

Bidirectional Iterator：允许算法在这种迭代器所形成的区间上进⾏读写操作，可双向移动，每次只能移动⼀步。⽀持 Forward Iterator 的所有操作，并另外⽀持 – 操作。

Random Access Iterator：包含指针的所有操作，可进⾏随机访问，随意移动指定的步数。⽀持前⾯四种 Iterator 的所有操作，并另外⽀持 [n] 操作符等操作。

![万字⻓⽂⼿撕 STL 迭代器源码 图 196](https://images.spumn.eu.cc/cpp-baguwen-v1/cpp_baguwen_html-196_1-21c8a200b4b1.png)

那么，这⾥，⼩贺想问⼤家，为什么我们要对迭代器进⾏分类呢？迭代器在具体的容器⾥是到底如何运⽤的呢？这个问题就放到下⼀节在讲。

最最后，我们再来回顾⼀下六⼤组件的关系：

**container（容器）通过 allocator（配置器）取得数据储存空间**

algorithm（算法）通过 iterator（迭代器）存取 container（容器）内容

**functor（仿函数）可以协助 algorithm（算法）完成不同的策略变化**

adapter（配接器）可以修饰或套接 functor（仿函数）。

参考⽂章：

《STL源码剖析-侯捷》https://zhuanlan.zhihu.com/p/85809752https://wendeng.github.io/
