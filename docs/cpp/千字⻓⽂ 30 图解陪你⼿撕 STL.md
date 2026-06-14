# 千字⻓⽂ 30 图解陪你⼿撕 STL

空间配置器源码⼤家好，我是⼩贺。

⽂章每周持续更新，可以微信搜索公众号「herongwei」第⼀时间阅读和催更。

本⽂ GitHub : https://github.com/rongweihe/CPPNotes已经收录，有⼀线⼤⼚⾯试点思维导图，也整理了很多我的⽂档，欢迎点个⼩和完善。⼀起加油，变得更⭐好！

# 13.1 前⾔

天下⼤事，必作于细。

源码之前，了⽆秘密。

你清楚下⾯这⼏个问题吗？

调⽤ new 和 delete 时编译器底层到底做了哪些⼯作？

STL 器底层空间配置原理是怎样的？

STL 空间配置器到底要考虑什么？

什么是内存的配置和释放？

这篇，我们就来回答这些问题。

![千字⻓⽂ 30 图解陪你⼿撕 STL 图 153](https://images.spumn.eu.cc/cpp-baguwen-v1/cpp_baguwen_html-153_1-c80790b6b467.png)

# 13.2 STL 六⼤组件

在深⼊配置器之前，我们有必要了解下 STL 的背景知识：

标准模板库（英⽂：Standard Template Library，缩写：STL），是⼀个 C++ 软件库。

STL 的价值在于两个⽅⾯，就底层⽽⾔，STL 带给我们⼀套极具实⽤价值的零部件以及⼀个整合的组织；除此之外，STL 还带给我们⼀个⾼层次的、以泛型思维 (Generic Paradigm) 为基础的、系统化的“软件组件分类学”。

STL 提供六⼤组件，了解这些为接下来的阅读打下基础。

容器（containers）：各种数据结构，如 vector, list, deque, set, map ⽤来存放数据。从实现的⻆度来看，STL 容器是⼀种 class template。

算法（algorithms）：各种常⽤的算法如 sort, search, copy, erase…从实现⻆度来看，STL 算法是⼀种 function template。

迭代器（iterators）：扮演容器与算法之间的胶合剂，是所谓的“泛型指针”。从实现⻆度来看，迭代器是⼀种将 operator *, operator -&gt;, operator++, operator– 等指针相关操作予以重载的class template。

仿函数（functors）：⾏为类似函数，可以作为算法的某种策略。从实现⻆度来看，仿函数是⼀种重载了 operator() 的 class 或class template。

适配器（adapters）：⼀种⽤来修饰容器或仿函数或迭代器接⼝的东⻄。例如 STL 提供的 queue 和 stack，虽然看似容器，其实只能算是⼀种容器适配器，因为它们的底部完全借助 deque，所有操作都由底层的 deque 供应。

配置器（allocator）：负责空间配置与管理，从实现⻆度来看，配置器是⼀个实现了动态空间配置、空间管理、空间释放的 class template。

![千字⻓⽂ 30 图解陪你⼿撕 STL 图 154](https://images.spumn.eu.cc/cpp-baguwen-v1/cpp_baguwen_html-154_1-92522997709d.png)

# 13.3 何为空间配置器

# 3.1 为何需要先了解空间配置器？

从使⽤ STL 层⾯⽽⾔，空间配置器并不需要介绍，因为容器底层都给你包装好了，但若是从STL 实现⻆度出发，空间配置器是⾸要理解的。

作为 STL 设计背后的⽀撑，空间配置器总是在默默地付出着。为什么你可以使⽤算法来⾼效地处理数据，为什么你可以对容器进⾏各种操作，为什么你⽤迭代器可以遍历空间，这⼀切的⼀切，都有“空间配置器”的功劳。

# 3.2 SGI STL 专属空间配置器

SGI STL 的空间配置器与众不同，且与 STL 标准规范不同。

其名为 alloc，⽽⾮ allocator。

虽然 SGI 也配置了 allocatalor，但是它⾃⼰并不使⽤，也不建议我们使⽤，原因是效率⽐较感⼈，因为它只是在基层进⾏配置/释放空间⽽已，⽽且不接受任何参数。

SGI STL 的每⼀个容器都已经指定缺省的空间配置器是 alloc。

![千字⻓⽂ 30 图解陪你⼿撕 STL 图 155](https://images.spumn.eu.cc/cpp-baguwen-v1/cpp_baguwen_html-155_1-466eaa244aa3.png)

在 C++ ⾥，当我们调⽤ new 和 delete 进⾏对象的创建和销毁的时候，也同时会有内存配置操作和释放操作:

这其中的 new 和 delete 都包含两阶段操作：

对于 new 来说，编译器会先调⽤ ::operator new 分配内存；然后调⽤ Obj::Obj() 构造对象内容。

对于 delete 来说，编译器会先调⽤ Obj::~Obj() 析构对象；然后调⽤ ::operator delete 释放空间。

为了精密分⼯，STL allocator 决定将这两个阶段操作区分开来。

对象构造由 ::construct() 负责；对象释放由 ::destroy() 负责。

内存配置由 alloc::allocate() 负责；内存释放由 alloc::deallocate() 负责；

STL配置器定义在中，下图直观的描述了这⼀框架结构

![千字⻓⽂ 30 图解陪你⼿撕 STL 图 156](https://images.spumn.eu.cc/cpp-baguwen-v1/cpp_baguwen_html-156_1-c15b88fffa88.png)

# 13.4 构造和析构源码

我们知道，程序内存的申请和释放离不开基本的构造和析构基本⼯具：construct() 和destroy() 。

在 STL ⾥⾯，construct() 函数接受⼀个指针 P 和⼀个初始值 value，该函数的⽤途就是将初值设定到指针所指的空间上。

destroy() 函数有两个版本，第⼀个版本接受⼀个指针，准备将该指针所指之物析构掉。直接调⽤析构函数即可。

第⼆个版本接受 first 和 last 两个迭代器，将[first,last)范围内的所有对象析构掉。

![千字⻓⽂ 30 图解陪你⼿撕 STL 图 157](https://images.spumn.eu.cc/cpp-baguwen-v1/cpp_baguwen_html-157_1-70123d454c66.png)

其中 destroy() 只截取了部分源码，全部实现还考虑到特化版本，⽐如判断元素的数值类型(value type) 是否有 trivial destructor 等限于篇幅，完整代码请参阅《STL 源码剖析》。

再来张图吧，献丑了。

![千字⻓⽂ 30 图解陪你⼿撕 STL 图 157](https://images.spumn.eu.cc/cpp-baguwen-v1/cpp_baguwen_html-157_2-d510865a5012.png)

# 13.5 内存的配置与释放

前⾯所讲都是对象的构造和析构，接下来要讲的是对象构造和析构背后的故事—（内存的分配与释放），这块是才真正的硬核，不要搞混了哦。

# 5.1 真· alloc 设计奥义

对象构造和析构之后的内存管理诸项事宜，由 &lt;stl_alloc.h&gt; ⼀律负责。SGI 对此的设计原则如下：

向 system heap 要求空间考虑多线程 (multi-threads) 状态考虑内存不⾜时的应变措施考虑过多“⼩型区块”可能造成的内存碎⽚ (fragment) 问题考虑到⼩型区块可能造成的内存破碎问题，SGI 为此设计了双层级配置器。当配置区块超过128bytes 时，称为⾜够⼤，使⽤第⼀级配置器，直接使⽤ malloc() 和 free()。

当配置区块不⼤于 128bytes 时，为了降低额外负担，直接使⽤第⼆级配置器，采⽤复杂的memory pool 处理⽅式。

**⽆论使⽤第⼀级配接器（malloc_alloc_template）或是第⼆级配接器**

（default_alloc_template），alloc 都为其包装了接⼝，使其能够符合 STL 标准。

![千字⻓⽂ 30 图解陪你⼿撕 STL 图 159](https://images.spumn.eu.cc/cpp-baguwen-v1/cpp_baguwen_html-159_1-d8479d16d75c.png)

其中， __malloc_alloc_template 就是第⼀级配置器;__default_alloc_template 就是第⼆级配置器。

这么⼀⼤堆源码看懵了吧，别着急，请看下图。

![千字⻓⽂ 30 图解陪你⼿撕 STL 图 160](https://images.spumn.eu.cc/cpp-baguwen-v1/cpp_baguwen_html-160_1-de3457d3d13d.png)

其中 SGI STL 将配置器多了⼀层包装使得 Alloc 具备标准接⼝。

![千字⻓⽂ 30 图解陪你⼿撕 STL 图 160](https://images.spumn.eu.cc/cpp-baguwen-v1/cpp_baguwen_html-160_2-543650874729.png)

# 13.6 alloc ⼀级配置器源码解读

这⾥截取部分（精华）解读

（1）第⼀级配置器以 malloc(), free(), realloc() 等 C 函数执⾏实际的内存配置、释放和重配置

操作，并实现类似 C++ new-handler 的机制（因为它并⾮使⽤ ::operator new 来配置内存，所以不能直接使⽤C++ new-handler 机制）。

（2）SGI 第⼀级配置器的 allocate() 和 reallocate() 都是在调⽤malloc() 和 realloc() 不成功

后，改调⽤ oom_malloc() 和oom_realloc()。

![千字⻓⽂ 30 图解陪你⼿撕 STL 图 162](https://images.spumn.eu.cc/cpp-baguwen-v1/cpp_baguwen_html-162_1-7d5a8690eedb.png)

（3）oom_malloc() 和 oom_realloc() 都有内循环，不断调⽤“内存不⾜处理例程”，期望某次

调⽤后，获得⾜够的内存⽽圆满完成任务，哪怕有⼀丝希望也要全⼒以赴申请啊，如果⽤户并没有指定“内存不⾜处理程序”，这个时候便⽆⼒乏天，真的是没内存了，STL 便抛出异常。或调⽤exit(1) 终⽌程序。

![千字⻓⽂ 30 图解陪你⼿撕 STL 图 163](https://images.spumn.eu.cc/cpp-baguwen-v1/cpp_baguwen_html-163_1-81888ea57a85.png)

# 13.7 alloc ⼆级配置器源码解读

照例，还是截取部分（精华）源码解读。看累了嘛，远眺歇会，回来继续看，接下来的这部分，将会更加的让我们为⼤师的智慧折服！

第⼆级配置器多了⼀些机制，专⻔针对内存碎⽚。内存碎⽚化带来的不仅仅是回收时的困难，配置也是⼀个负担，额外负担永远⽆法避免，毕竟系统要划出这么多的资源来管理另外的资源，但是区块越⼩，额外负担率就越⾼。

![千字⻓⽂ 30 图解陪你⼿撕 STL 图 164](https://images.spumn.eu.cc/cpp-baguwen-v1/cpp_baguwen_html-164_1-1e20861ef917.png)

# 7.1 SGI 第⼆级配置器到底解决了多少问题呢？

简单来说 SGI第⼆级配置器的做法是：sub-allocation （层次架构）：

前⾯也说过了，SGI STL 的第⼀级配置器是直接使⽤ malloc()， free(), realloc() 并配合类似C++ new-handler 机制实现的。第⼆级配置器的⼯作机制要根据区块的⼤⼩是否⼤于128bytes 来采取不同的策略：

![千字⻓⽂ 30 图解陪你⼿撕 STL 图 164](https://images.spumn.eu.cc/cpp-baguwen-v1/cpp_baguwen_html-164_2-a801a966763a.png)

继续跟上节奏，上⾯提到了 memory pool ，相信程序员朋友们很熟悉这个名词了，没错，这就是⼆级配置器的精髓所在，如何理解？请看下图：

![千字⻓⽂ 30 图解陪你⼿撕 STL 图 165](https://images.spumn.eu.cc/cpp-baguwen-v1/cpp_baguwen_html-165_1-6784cd4ff007.png)

有了内存池，是不是就可以了，当然没有这么简单。上图中还提到了⾃由链表，这个⼜是何⽅神圣？

我们来⼀探究竟！

# 7.2 ⾃由链表⾃由在哪？⼜该如何维护呢？

我们知道，⼀⽅⾯，⾃由链表中有些区块已经分配给了客端使⽤，所以 free_list 不需要再指向它们；另⼀⽅⾯，为了维护 free-list，每个节点还需要额外的指针指向下⼀个节点。

那么问题来了，如果每个节点有两个指针？这不就造成了额外负担吗？本来我们设计 STL 容器就是⽤来保存对象的，这倒好，对象还没保存之前，已经占据了额外的内存空间了。那么，有⽅法解决吗？当然有！再来感受⼀次⼤师的智慧！

（1）在这之前我们先来了解另⼀个概念——union（联合体/共⽤体），对 union 已经熟悉的

读者可以跳过这⼀部分的内容；如果忘记了也没关系，趁此来回顾⼀下：

（a）共⽤体是⼀种特殊的类，也是⼀种构造类型的数据结构。

（b）共⽤体表示⼏个变量共⽤⼀个内存位置，在不同的时间保存不同的数据类型和不同⻓度的变量。

（c）所有的共⽤体成员共⽤⼀个空间，并且同⼀时间只能储存其中⼀个成员变量的值。例如如下：

![千字⻓⽂ 30 图解陪你⼿撕 STL 图 166](https://images.spumn.eu.cc/cpp-baguwen-v1/cpp_baguwen_html-166_1-9e9f411acaa4.png)

⼀个union 只配置⼀个⾜够⼤的空间以来容纳最⼤⻓度的数据成员，以上例⽽⾔，最⼤⻓度是double 类型，所以 ChannelManager 的空间⼤⼩就是 double 数据类型的⼤⼩。在 C++ ⾥，union 的成员默认属性⻚为 public。union 主要⽤来压缩空间，如果⼀些数据不可能在同⼀时间同时被⽤到，则可以使⽤ union。

（2）了解了 union 之后，我们可以借助 union 的帮助，先来观察⼀下 free-list 节点的结构

![千字⻓⽂ 30 图解陪你⼿撕 STL 图 166](https://images.spumn.eu.cc/cpp-baguwen-v1/cpp_baguwen_html-166_2-af40bcc0a824.png)

来深⼊了解 free_list 的实现技巧，请看下图。

![千字⻓⽂ 30 图解陪你⼿撕 STL 图 167](https://images.spumn.eu.cc/cpp-baguwen-v1/cpp_baguwen_html-167_1-8b4af5ebe8b5.png)

在 union obj 中，定义了两个字段，再结合上图来分析：

从第⼀个字段看，obj 可以看做⼀个指针，指向链表中的下⼀个节点；

从第⼆个字段看，obj 可以也看做⼀个指针，不过此时是指向实际的内存区。

⼀物⼆⽤的好处就是不会为了维护链表所必须的指针⽽造成内存的另⼀种浪费，或许这就是所谓的⾃由奥义所在！⼤师的智慧跃然纸上。

# 7.3 第⼆级配置器的部分实现内容

到这⾥，我们已经基本了解了第⼆级配置器中 free_list 的⼯作原理了。附上第⼆级配置器的部分实现内容源码：

![千字⻓⽂ 30 图解陪你⼿撕 STL 图 167](https://images.spumn.eu.cc/cpp-baguwen-v1/cpp_baguwen_html-167_2-5b67ef56eea0.png)

![千字⻓⽂ 30 图解陪你⼿撕 STL 图 168](https://images.spumn.eu.cc/cpp-baguwen-v1/cpp_baguwen_html-168_1-5b67ef56eea0.png)

![千字⻓⽂ 30 图解陪你⼿撕 STL 图 169](https://images.spumn.eu.cc/cpp-baguwen-v1/cpp_baguwen_html-169_1-5b67ef56eea0.png)

太⻓了吧，看懵逼了，没关系，请耐⼼接着往下看。

# 13.8 空间配置器函数allocate源码解读

我们知道第⼆级配置器拥有配置器的标准接⼝函数 allocate()。此函数⾸先判断区块的⼤⼩，如果⼤于 128bytes –&gt; 调⽤第⼀级配置器；⼩于128bytes–&gt; 就检查对应的 free_list（如果没有可⽤区块，就将区块上调⾄ 8 倍数的边界，然后调⽤ refill(), 为 free list 重新填充空间。

# 8.1 空间申请

调⽤标准接⼝函数 allocate()：

![千字⻓⽂ 30 图解陪你⼿撕 STL 图 170](https://images.spumn.eu.cc/cpp-baguwen-v1/cpp_baguwen_html-170_1-6969a20b7a65.png)

![千字⻓⽂ 30 图解陪你⼿撕 STL 图 171](https://images.spumn.eu.cc/cpp-baguwen-v1/cpp_baguwen_html-171_1-2518004fafda.png)

NOTE：每次都是从对应的 free_list 的头部取出可⽤的内存块。然后对free_list 进⾏调整，使上⼀步拨出的内存的下⼀个节点变为头结点。

# 8.2 空间释放

同样，作为第⼆级配置器拥有配置器标准接⼝函数 deallocate()。该函数⾸先判断区块⼤⼩，⼤于 128bytes 就调⽤第⼀级配置器。⼩于 128 bytes 就找出对应的 free_list，将区块回收。

![千字⻓⽂ 30 图解陪你⼿撕 STL 图 172](https://images.spumn.eu.cc/cpp-baguwen-v1/cpp_baguwen_html-172_1-626b191f4223.png)

NOTE：通过调整 free_list 链表将区块放⼊ free_list 的头部。

区块回收纳⼊ free_list 的操作，如图所示：

# 8.3 重新填充 free_lists

（1）当发现 free_list 中没有可⽤区块时，就会调⽤ refill() 为free_list 重新填充空间；

（2）新的空间将取⾃内存池（经由 chunk_alloc() 完成）；

（3）缺省取得20个新节点（区块），但万⼀内存池空间不⾜，获得的节点数可能⼩于 20。

![千字⻓⽂ 30 图解陪你⼿撕 STL 图 173](https://images.spumn.eu.cc/cpp-baguwen-v1/cpp_baguwen_html-173_1-601af9fa8015.png)

# 8.4 内存池（memory pool）

唔…在前⾯提到了 memory pool，现在终于轮到这个⼤ boss 上场。

⾸先，我们要知道从内存池中取空间给 free_list 使⽤，是 chunk_alloc() 在⼯作，它是怎么⼯作的呢？

我们先来分析 chunk_alloc() 的⼯作机制：

chunk_alloc() 函数以 end_free – start_free 来判断内存池的“⽔量”（哈哈，很形象的⽐喻）。

具体逻辑都在下⾯的图⾥了，很形象吧。

![千字⻓⽂ 30 图解陪你⼿撕 STL 图 174](https://images.spumn.eu.cc/cpp-baguwen-v1/cpp_baguwen_html-174_1-e9e8a24a2681.png)

如果第⼀级配置器的 malloc() 也失败了，就发出 bad_alloc 异常。

说了这么多来看⼀下 STL 的源码吧。

![千字⻓⽂ 30 图解陪你⼿撕 STL 图 176](https://images.spumn.eu.cc/cpp-baguwen-v1/cpp_baguwen_html-176_1-b1fd66c80f03.png)

![千字⻓⽂ 30 图解陪你⼿撕 STL 图 177](https://images.spumn.eu.cc/cpp-baguwen-v1/cpp_baguwen_html-177_1-b1fd66c80f03.png)

太⻓了，⼜看懵逼了吧，没关系，请看下图。

![千字⻓⽂ 30 图解陪你⼿撕 STL 图 177](https://images.spumn.eu.cc/cpp-baguwen-v1/cpp_baguwen_html-177_2-873e234ff02b.png)

NOTE：上述就是 STL 源码当中实际内存池的操作原理，我们可以看到其实以共⽤体串联起来共享内存形成了 free_list 的实质组成。

# 13.9 本⽂⼩结

STL 源码本身博⼤精深，还有很多精妙的设计等着⼤家去探索。

⼩贺本⼈才疏学浅，在这⾥也只是在⾃⼰掌握的程度下写出⾃⼰的理解，不⾜之处希望对⼤家多多指出，互相讨论学习。肝了⼀个礼拜的⽂章，⽂中所有的图都是⾃⼰⼀个个亲⼿画的，不画不知道，画完之后真⼼感觉不容易啊。

参考⽂章：

《STL源码剖析-侯捷》https://cloud.tencent.com/developer/article/1686585https://dulishu.top/allocator-of-stl/
