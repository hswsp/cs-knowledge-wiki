# 万字⻓⽂+ STL 算法总结

⼤家好，我是⼩贺。

⽂章每周持续更新，可以微信搜索公众号「herongwei」第⼀时间阅读和催更。

本⽂ GitHub : https://github.com/rongweihe/CPPNotes已经收录，有⼀线⼤⼚⾯试点思维导图，也整理了很多我的⽂档，欢迎点个⼩和完善。⼀起加油，变得更⭐好！

# 17.1 前⾔

上⼀篇更新了 STL 关联式容器源码，今天我们来学习下 STL 算法。

STL 算法博⼤精深，涵盖范围之⼴，其算法之⼤观，细节之深⼊，泛型思维之于字⾥⾏间，每每阅读都会有不同的收获。

STL 将很多常⻅的逻辑都封装为现成的算法，熟悉这些算法的使⽤和实现很多时候可以⼤⼤简化编程。

并且在需要的时候能够对 STL 进⾏扩展，将⾃定义的容器和算法融⼊到 STL 中。

侯捷⼤师在书中说到：深⼊源码之前，先观察每⼀个算法的表现和⼤观，是⼀个⽐较好的学习⽅式。

不多 BB，先上思维导图：

![万字⻓⽂+ STL 算法总结 图 274](https://images.spumn.eu.cc/cpp-baguwen-v1/cpp_baguwen_html-274_1-6866998d7b61.png)

![万字⻓⽂+ STL 算法总结 图 275](https://images.spumn.eu.cc/cpp-baguwen-v1/cpp_baguwen_html-275_1-6866998d7b61.png)

![万字⻓⽂+ STL 算法总结 图 276](https://images.spumn.eu.cc/cpp-baguwen-v1/cpp_baguwen_html-276_1-6866998d7b61.png)

# 17.2 回顾

STL 源码剖析系列：

5 千字⻓⽂+ 30 张图解 | 陪你⼿撕 STL 空间配置器源码万字⻓⽂炸裂！⼿撕 STL 迭代器源码与 traits 编程技法超硬核 | 2 万字+20 图带你⼿撕 STL 序列式容器源码硬核来袭 | 2 万字 + 10 图带你⼿撕 STL 关联式容器源码

# 17.3 基本算法

在 STL 标准规格中，并没有区分基本算法或复杂算法，然⽽ SGI 却把常⽤的⼀些算法定义于&lt;stl_algobase.h&gt;之中，其它算法定义于 &lt;stl_algo.h&gt;中。

常⻅的基本算法有equal、fill、fill_n、iter_swap、lexicographical_compare、max、min、mismatch、swap、copy、copy_backward等。

# 17.4 质变算法和⾮质变算法

所有的 STL 算法归根到底，都可以分为两类。

所谓“质变算法”是指作⽤在由迭代器[first,last]所标示出来的区间，上运算过程中会更改区间内的元素内容：

⽐如拷⻉(copy)、互换(swap)、替换(replace)、填写(fill)、删除(remove)、排列组合(permutation)、分割(partition)。随机重排(random shuffling)、排序(sort)等算法，都属于这⼀类。

⽽⾮质变算法是指在运算过程中不会更改区间内的元素内容。⽐如查找(find)，匹配(search)、计数（count）、遍历(for_each)、⽐较(equal_mismatch)、寻找极值(max,min)等算法。

# 17.5 输⼊参数

所有泛型算法的前两个参数都是⼀对迭代器，通过称为 first，last。⽤来标示算法的操作区间。

每⼀个 STL 算法的声明，都表现出它所需要的最低程度的迭代器类型。⽐如 find() 需要⼀个inputiterator ，这是它的最低要求，但同时也可以接受更⾼类型的迭代器。

如 Forwarditerator、Bidirectionaliterator 或 RandomAcessIterator，因为，前者都可以看做是⼀个 inputiterator，⽽如果你给 find() 传⼊⼀个 Outputiterator，会导致错误。

将⽆效的迭代器传给某个算法，虽然是⼀种错误，但不保证能够在编译器期间就被捕捉出来。

因为所谓“迭代器类型”并不是真实的型别，它们只是function template的⼀种型别参数。

许多 STL 算法不仅⽀持⼀个版本，往往第⼀个版本算法会采⽤默认的⾏为，另⼀个版本会提供额外的参数，接受⼀个仿函数，以便采取其它的策略。

例如 unique() 默认情况下会使⽤ equality 操作符来⽐较两个相邻元素，但如果这些元素的型别并没有提供，那么便可以传递⼀个⾃定义的函数（或者叫仿函数）。

# 17.6 算法的泛型化

将⼀个表述完整的算法转化为程序代码，是⼀个合格程序员的基本功。

如何将算法独⽴于其所处理的数据结构之外，不受数据的牵绊，使得设计的算法在即将处理的未知的数据结构上（也许是 array，也许是 vector，也许是 list，也许是 deque）上，正确地实现所有操作呢？

这就需要进⼀步思考，关键在于只要把操作对象的型别加以抽象化，把操作对象的标示法和区间⽬标的移动⾏为抽象化，整个算法也就在⼀个抽象层⾯上⼯作了。

这个过程就叫做算法的泛型化，简称泛化。⽐如在 STL 源码剖析这本书⾥举了⼀个 find 的例⼦，如果⼀步步改成 template + 迭代器的形式，来说明了泛化的含义。

下⾯我们就来看看 STL 那些⽜批的算法，限于篇幅，算法的代码没有贴出。

具体源码细节可以去开头的 GitHub 仓库⾥研究，还有注释哦。

# 17.7 构成

**头⽂件功能**

&lt;algorithm&gt;算法函数&lt;numeric&gt;数值算法&lt;functional&gt;函数对象/仿函数

# 17.8 分类

**No.分类说明**

1⾮质变算Non-modifying sequence不直接修改容器内容的算法法operations2质变算法Modifying sequence operations可以修改容器内容的算法3排序算法Sorting/Partitions/Binary search/对序列排序、合并、搜索算法操作4数值算法Merge/Heap/Min/max对容器内容进⾏数值计算

# 17.9 填充

**函数作⽤**

fill(beg,end,val)将值val赋给[beg,end)范围内的所有元素fill_n(beg,n,val)将值val赋给[beg,beg+n)范围内的所有元素generate(beg,end,func)连续调⽤函数func填充[beg,end)范围内的所有元素generate_n(beg,n,func)连续调⽤函数func填充[beg,beg+n)范围内的所有元素fill()/fill_n()⽤于填充相同值，generate()/generate_n()⽤于填充不同值。

# 17.10 遍历/变换

**函数作⽤**

for_each(beg,end,func)将[beg,end)范围内所有元素依次调⽤函数func，返回func。不修改序列中的元素transform(beg,end,res,func)将[beg,end)范围内所有元素依次调⽤函数func，结果放⼊res中transform(beg2,end1,beg2,res,binary)将[beg,end)范围内所有元素与[beg2,beg2+end-beg)中所有元素依次调⽤函数binnary，结果放⼊res中

# 17.11 最⼤最⼩

**函数作⽤**

max(a,b)返回两个元素中较⼤⼀个max(a,b,cmp)使⽤⾃定义⽐较操作cmp,返回两个元素中较⼤⼀个max_element(beg,end)返回⼀个ForwardIterator，指出[beg,end)中最⼤的元素max_element(beg,end,cmp)使⽤⾃定义⽐较操作cmp,返回⼀个ForwardIterator，指出[beg,end)中最⼤的元素min(a,b)返回两个元素中较⼩⼀个min(a,b,cmp)使⽤⾃定义⽐较操作cmp,返回两个元素中较⼩⼀个min_element(beg,end)返回⼀个ForwardIterator，指出[beg,end)中最⼩的元素min_element(beg,end,cmp)使⽤⾃定义⽐较操作cmp,返回⼀个ForwardIterator，指出[beg,end)中最⼩的元素

# 17.12 排序算法(12个)：提供元素排序策略

函数作⽤sort(beg,end)默认升序重新排列元素sort(beg,end,comp)使⽤函数comp代替⽐较操作符执⾏sort()partition(beg,end,pred)元素重新排序，使⽤pred函数，把结果为true的元素放在结果为false的元素之前stable_sort(beg,end)与sort()类似，保留相等元素之间的顺序关系stable_sort(beg,end,pred)使⽤函数pred代替⽐较操作符执⾏stable_sort()stable_partition(beg,end)与partition()类似，保留容器中的相对顺序stable_partition(beg,end,pred)使⽤函数pred代替⽐较操作符执⾏stable_partition()partial_sort(beg,mid,end)部分排序，被排序元素个数放到[beg,end)内partial_sort(beg,mid,end,comp)使⽤函数comp代替⽐较操作符执⾏partial_sort()partial_sort_copy(beg1,end1,beg2,end2)与partial_sort()类似，只是将[beg1,end1)排序的序列复制到[beg2,end2)partial_sort_copy(beg1,end1,beg2,end2,comp)使⽤函数comp代替⽐较操作符执⾏partial_sort_copy()nth_element(beg,nth,end)单个元素序列重新排序，使所有⼩于第n个元素的元素都出现在它前⾯，⽽⼤于它的都出现在后⾯nth_element(beg,nth,end,comp)使⽤函数comp代替⽐较操作符执⾏nth_element()

# 17.13 反转/旋转

**函数作⽤**

reverse(beg,end)元素重新反序排序reverse_copy(beg,end,res)与reverse()类似，结果写⼊resrotate(beg,mid,end)元素移到容器末尾，由mid成为容器第⼀个元素rotate_copy(beg,mid,end,res)与rotate()类似，结果写⼊res

# 17.14 随机

**函数作⽤**

random_shuffle(beg,end)元素随机调整次序random_shuffle(beg,end,gen)使⽤函数gen代替随机⽣成函数执⾏random_shuffle()

# 17.15 查找算法(13个)：判断容器中是否包含某个值

**统计**

**函数作⽤**

count(beg,end,val)利⽤==操作符，对[beg,end)的元素与val进⾏⽐较，返回相等元素个数count_if(beg,end,pred)使⽤函数pred代替==操作符执⾏count()

**查找**

函数作⽤find(beg,end,val)利⽤==操作符，对[beg,end)的元素与val进⾏⽐较。当匹配时结束搜索，返回该元素的InputIteratorfind_if(beg,end,pred)使⽤函数pred代替==操作符执⾏find()find_first_of(beg1,end1,beg2,end2)在[beg1,end1)范围内查找[beg2,end2)中任意⼀个元素的第⼀次出现。返回该元素的

```cpp
Iterator
```

find_first_of(beg1,end1,beg2,end2,pred)使⽤函数pred代替==操作符执⾏find_first_of()。返回该元素的

```cpp
Iterator
```

find_end(beg1,end1,beg2,end2)在[beg1,end1)范围内查找[beg2,end2)最后⼀次出现。找到则返回最后⼀对的第⼀个ForwardIterator，否则返回end1find_end(beg1,end1,beg2,end2,pred)使⽤函数pred代替==操作符执⾏find_end()。返回该元素的Iteratoradjacent_find(beg,end)对[beg,end)的元素，查找⼀对相邻重复元素，找到则返回指向这对元素的第⼀个元素的ForwardIterator。否则返回endadjacent_find(beg,end,pred)使⽤函数pred代替==操作符执⾏adjacent_find()

**搜索**

**函数作⽤**

search(beg1,end1,beg2,end2)在[beg1,end1)范围内查找[beg2,end2)⾸⼀次出现，返回⼀个ForwardIterator，查找成功,返回[beg1,end1)内第⼀次出现[beg2,end2)的位置，查找失败指向end1search(beg1,end1,beg2,end2,pred)使⽤函数pred代替==操作符执⾏search()search_n(beg,end,n,val)在[beg,end)范围内查找val出现n次的⼦序列search_n(beg,end,n,val,pred)使⽤函数pred代替==操作符执⾏search_n()binary_search(beg,end,val)⼆分查找，在[beg,end)中查找val，找到返回truebinary_search(beg,end,val,comp)使⽤函数comp代替⽐较操作符执⾏binary_search()

**边界**

**函数作⽤**

lower_bound(beg,end,val)在[beg,end)范围内的可以插⼊val⽽不破坏容器顺序的第⼀个位置，返回⼀个ForwardIterator（返回范围内第⼀个⼤于等于值val的位置）lower_bound(beg,end,val,comp)使⽤函数comp代替⽐较操作符执⾏lower_bound()upper_bound(beg,end,val)在[beg,end)范围内插⼊val⽽不破坏容器顺序的最后⼀个位置，该位置标志⼀个⼤于val的值，返回⼀个ForwardIterator（返回范围内第⼀个⼤于val的位置）upper_bound(beg,end,val,comp)使⽤函数comp代替⽐较操作符执⾏upper_bound()equal_range(beg,end,val)返回⼀对iterator，第⼀个表示lower_bound，第⼆个表示upper_boundequal_range(beg,end,val,comp)使⽤函数comp代替⽐较操作符执⾏lower_bound()

# 17.16 删除和替换算法(15个)

**复制**

**函数作⽤**

copy(beg,end,res)复制[beg,end)到rescopy_backward(beg,end,res)与copy()相同，不过元素是以相反顺序被拷⻉

**移除**

**函数作⽤**

remove(beg,end,val)移除[first,last)区间内所有与val值相等的元素，并不是真正的从容器中删除这些元素(原容器的内容不会改变)⽽是将结果复制到⼀个以result为起始位置的容器中。新容器可以与原容器重叠remove_if(beg,end,pred)删除[beg,end)内pred结果为true的元素remove_copy(beg,end,res,val)将所有不等于val元素复制到res，返回OutputIterator指向被拷⻉的末元素的下⼀个位置remove_copy_if(beg,end,res,pred)将所有使pred结果为true的元素拷⻉到res

**替换**

**函数作⽤**

replace(beg,end,oval,nval)将[beg,end)内所有等于oval的元素都⽤nval代替replace_copy(beg,end,res,oval,nval)与replace()类似，不过将结果写⼊resreplace_if(beg,end,pred,nval)将[beg,end)内所有pred为true的元素⽤nval代替replace_copy_if(beg,end,res,pred,nval)与replace_if()，不过将结果写⼊res

**去重**

**函数作⽤**

unique(beg,end)清除序列中相邻重复元素，不真正删除元素。重载版本使⽤⾃定义⽐较操作unique(beg,end,pred)将所有使pred结果为true的相邻重复元素去重unique_copy(beg,end,res)与unique类似，不过把结果输出到resunique_copy(beg,end,res,pred)与unique类似，不过把结果输出到res

**交换**

**函数作⽤**

swap(a,b)交换存储在a与b中的值swap_range(beg1,end1,beg2)将[beg1,end1)内的元素[beg2,beg2+beg1-end1)元素值进⾏交换iter_swap(it_a,it_b)交换两个ForwardIterator的值

# 17.17 算术算法(4个)&lt;numeric&gt;&lt;numeric&gt;

函数作⽤accumulate(beg,end,val)对[beg,end)内元素之和，加到初始值val上accumulate(beg,end,val,binary)将函数binary代替加法运算，执⾏accumulate()partial_sum(beg,end,res)将[beg,end)内该位置前所有元素之和放进res中partial_sum(beg,end,res,binary)将函数binary代替加法运算，执⾏partial_sum()adjacent_difference(beg1,end1,res)将[beg,end)内每个新值代表当前元素与上⼀个元素的差放进res中adjacent_difference(beg1,end1,res,binary)将函数binary代替减法运算，执⾏adjacent_difference()inner_product(beg1,end1,beg2,val)对两个序列做内积(对应元素相乘，再求和)并将内积加到初始值val上inner_product(beg1,end1,beg2,val,binary1,binary2)将函数binary1代替加法运算,将binary2代替乘法运算，执⾏inner_product()17.18 关系算法(4个)&lt;stl_algobase.h&gt;&lt;stl_algobase.h&gt;函数作⽤equal(beg1,end1,beg2)判断[beg1,end1)与[beg2,end2)内元素都相等equal(beg1,end1,beg2,pred)使⽤pred函数代替默认的==操作符includes(beg1,end1,beg2,end2)判断[beg1,end1)是否包含[beg2,end2)，使⽤底层元素的&lt;操作符，成功返回true。重载版本使⽤⽤户输⼊的函数includes(beg1,end1,beg2,end2,comp)将函数comp代替&lt;操作符，执⾏includes()lexicographical_compare(beg1,end1,beg2,end2)按字典序判断[beg1,end1)是否⼩于[beg2,end2)lexicographical_compare(beg1,end1,beg2,end2,comp)将函数comp代替&lt;操作符，执⾏lexicographical_compare()mismatch(beg1,end1,beg2)并⾏⽐较[beg1,end1)与[beg2,end2)，指出第⼀个不匹配的位置，返回⼀对iterator，标志第⼀个不匹配元素位置。

如果都匹配，返回每个容器的endmismatch(beg1,end1,beg2,pred)使⽤pred函数代替默认的==操作符

# 17.19 集合算法(6个)

函数作⽤merge(beg1,end1,beg2,end2,res)合并[beg1,end1)与[beg2,end2)存放到resmerge(beg1,end1,beg2,end2,res,comp)将函数comp代替&lt;操作符，执⾏merge()inplace_merge(beg,mid,end)合并[beg,mid)与[mid,end)，结果覆盖[beg,end)inplace_merge(beg,mid,end,cmp)将函数comp代替&lt;操作符，执⾏inplace_merge()set_union(beg1,end1,beg2,end2,res)取[beg1,end1)与[beg2,end2)元素并集存放到resset_union(beg1,end1,beg2,end2,res,comp)将函数comp代替&lt;操作符，执⾏set_union()set_intersection(beg1,end1,beg2,end2,res)取[beg1,end1)与[beg2,end2)元素交集存放到resset_intersection(beg1,end1,beg2,end2,res,comp)将函数comp代替&lt;操作符，执⾏set_intersection()set_difference(beg1,end1,beg2,end2,res)取[beg1,end1)与[beg2,end2)元素内差集存放到resset_difference(beg1,end1,beg2,end2,res,comp)将函数comp代替&lt;操作符，执⾏set_difference()set_symmetric_difference(beg1,end1,beg2,end2,res)取[beg1,end1)与[beg2,end2)元素外差集存放到res

# 17.20 排列组合算法：提供计算给定集合按⼀定顺序的所有

**可能排列组合**

**函数作⽤**

next_permutation(beg,end)取出[beg,end)内的下移⼀个排列next_permutation(beg,end,comp)将函数comp代替&lt;操作符，执⾏next_permutation()prev_permutation(beg,end)取出[beg,end)内的上移⼀个排列prev_permutation(beg,end,comp)将函数comp代替&lt;操作符，执⾏prev_permutation()

# 17.21 堆算法(4个)

**函数作⽤**

make_heap(beg,end)把[beg,end)内的元素⽣成⼀个堆make_heap(beg,end,comp)将函数comp代替&lt;操作符，执⾏make_heap()pop_heap(beg,end)重新排序堆。它把first和last-1交换，然后重新⽣成⼀个堆。可使⽤容器的back来访问被"弹出"的元素或者使⽤pop_back进⾏真正的删除。并不真正把最⼤元素从堆中弹出pop_heap(beg,end,comp)将函数comp代替&lt;操作符，执⾏pop_heap()push_heap(beg,end)假设first到last-1是⼀个有效堆，要被加⼊到堆的元素存放在位置last-1，重新⽣成堆。在指向该函数前，必须先把元素插⼊容器后push_heap(beg,end,comp)将函数comp代替&lt;操作符，执⾏push_heap()sort_heap(beg,end)对[beg,end)内的序列重新排序sort_heap(beg,end,comp)将函数comp代替&lt;操作符，执⾏push_heap()参考：

《STL源码剖析》-侯捷https://www.jianshu.com/p/eb554b0943ab

# 17.22 结尾

哈喽，我是⼩贺，就爱分享知识，如果觉得⽂章对你有帮助，别忘记关注我哦！

![万字⻓⽂+ STL 算法总结 图 291](https://images.spumn.eu.cc/cpp-baguwen-v1/cpp_baguwen_html-291_1-78a4ac22ea29.png)
