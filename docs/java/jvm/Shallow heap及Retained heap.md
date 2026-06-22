# Shallow heap及Retained heap

> 本篇文章由一文多发平台[ArtiPub](https://github.com/crawlab-team/artipub)自动发布

# 前言

快速定位性能故障并非一朝一夕之功，需要我们对很多概念有很深刻的理解，在前文中，我们介绍了heap dump的相关概念和其获取方式，今天我们一起来了解一下什么是： Shallow 和 retained sizes。

JVM（Java Virtual Machine）的内存结构主要包括虚拟机栈、堆、方法区、程序计数器和本地方法栈等。以下是对 JVM 内存中的虚拟机栈、方法区和本地方法栈的详细介绍：

1. **虚拟机栈（Java Virtual Machine Stack）：**

    * **作用：**  虚拟机栈用于存储线程的方法调用和局部变量。
    * **每个线程一个栈：**  每个线程在创建时都会被分配一个独立的虚拟机栈，栈中保存着方法的局部变量、操作数栈、动态链接和方法出口等信息。
    * **栈帧：**  虚拟机栈以栈帧（Stack Frame）为单位，每个方法被调用时，都会创建一个栈帧，栈帧包含了该方法的局部变量表、操作数栈、动态链接、方法返回地址等信息。
    * **栈的深度限制：**  JVM 可以根据系统的具体情况动态地扩展或缩小虚拟机栈的深度，但是在创建线程时，可以通过 `-Xss`​ 参数来设置栈的深度。
2. **方法区（Method Area）：**

    * **作用：**  <span data-type="text" style="color: var(--b3-font-color12);">方法区用于存储类的结构信息，如类的元数据、静态变量、常量池、方法代码等</span>。
    * **与堆共享：**  方法区是各个线程共享的内存区域，与堆一样，用于存储被加载的类信息。
    * **永久代和元空间：**  在 Java 7 及之前的版本，方法区被实现为永久代（Permanent Generation）。而在 Java 8 及以后的版本，由于永久代的一些问题，<span data-type="text" style="color: var(--b3-font-color9);">方法区被取代为元空间（Metaspace）</span>。
    * **OOM：**  方法区也可能发生内存溢出异常，例如在运行时不断生成类的情况下，会导致方法区内存耗尽。
3. **本地方法栈（Native Method Stack）：**

    * **作用：**  本地方法栈用于支持 Native 方法的执行。
    * **与虚拟机栈类似：**  本地方法栈的结构与虚拟机栈类似，也是用于支持方法的执行。不同的是，虚拟机栈为 Java 方法服务，而本地方法栈为 Native 方法服务。
    * **OOM：**  本地方法栈也可能发生内存溢出异常，例如在调用本地方法时，本地方法栈深度不足。

这三个内存区域在 Java 虚拟机中的关系如下：

​![image](https://images.spumn.eu.cc/image-20231226104601-6v2tuiy.png)​

需要注意的是，虚拟机栈、本地方法栈和程序计数器都是线程私有的，每个线程都有自己的这些内存区域。而方法区和堆是线程共享的，用于存储类的信息和对象实例。

# GC ROOT是什么？

在java语言中，都是通过<span data-type="text" style="color: var(--b3-font-color9);">可达性分析</span>来判定对象是否存活的。此算法的基本思路是：通过一系列的称为“GC Roots”的对象作为起点，从这些节点向下搜索，搜索所走过的路径称为引用链（Reference Chain），当一个对象到GC Roots没有任何引用链相连，则证明此对象是不可达的。

​![](https://pic4.zhimg.com/80/v2-57511dbba0bcb4a2eb9b82181f168b57_1440w.webp)​

<span data-type="text" style="color: var(--b3-font-color9);">在上图右侧中，我们可以看到，对象5/6/7虽然有依赖关联，但是他们到GC ROOT根节点是不可达的，所以这三个节点对象会被判定为是可回收的。</span>

<span data-type="text" style="color: var(--b3-font-color12);">GC ROOT的定义比较特别，他们不属归属于对象图中，对象也不能反向的依赖他们，这也确保了不会出现循环引用的问题</span>。因此也容易得出，<span data-type="text" style="color: var(--b3-font-color9);">只有引用类型的变量才被认为是Roots，值类型的变量永远不被认为是Roots</span>。

在Java中，可作为GC Roots的对象包括以下几种：

**虚拟机栈（栈帧中的局部变量表，Local Variable Table）中引用的对象。 方法区中类静态属性引用的对象。 方法区中常量引用的对象。 本地方法栈中JNI（即一般说的Native方法）引用的对象**。

看到这里你可能要问，选择这些对象的依据是什么呢？

首先，GCROOT的目标对象是要以当前还在存活的对象集合，因此<span data-type="text" style="color: var(--b3-font-color9);">必须要选取确定存活的引用类型对象</span>，GC管理的区域是java的堆，**虚拟机栈、方法区和本地方法栈不被GC所管理**，因此选用这些区域内引用的对象作为GC Roots，是不会被GC回收的。

**其中虚拟机栈和本地方法栈都是线程私有的内存区域**，只要线程没有终止，就能确保它们中引用的对象的存活。而方法区中类静态属性引用的对象是显然存活的。常量引用的对象在当前可能存活，因此，也可能是GC roots的一部分。

下图是使用MAT工具中的 “path to GC roots ”功能分析出来的引用链。

​![](https://pic1.zhimg.com/80/v2-1f5250688e038f1a2d361814f1cd0c40_1440w.webp)​

它标识从当前对象到GC roots的路径，这个路径解释了为什么当前对象还能存活，对分析内存泄露很有帮助。

在查询到GC root的路径时，默认是包含所有引用的，从GC角度说，一个对象无法被GC，一定是因为有强引用存在，<span data-type="text" style="color: var(--b3-font-color8);">其它引用类型在GC需要的情况下都是可以被GC掉的</span>，所以这里我使用 `exclude all phantom/weak/soft etc. references`​ 只查看GC路径上的强引用。

# shallow heap和retained heap

直译过来是浅层堆和保留堆的意思。先说一说其基本的概念。

## shallow heap

表示对象本身占用内存的大小，也就是<span data-type="text" style="color: var(--b3-font-color12);">对象头加成员变量（不是成员变量的值）的总和</span>。

如<span data-type="text" style="color: var(--b3-font-color9);">一个引用占用32或64bit，一个integer占4bytes，Long占8bytes等</span>。

如简单的一个类里面只有一个成员变量`int i`​，那么这个类的shallow size是12字节，因为对象头是8字节，成员变量int是4字节。

常规对象（非数组）的Shallow size由其成员变量的数量和类型决定，数组的shallow size由数组元素的类型（对象类型、基本类型）和数组长度决定。

**对象的值是分配给存储对象本身的内存量，不考虑所引用的对象。** 常规(非数组)对象的浅大小取决于其字段的数量和类型。数组的浅尺寸取决于数组的长度及其元素(对象、基本类型)的类型。一组对象的浅尺寸表示该集合中所有对象的浅尺寸之和。

## retained heap

如果一个对象被释放掉，那会因为该对象的释放而减少引用进而被释放的所有的对象（包括被递归释放的）所占用的heap大小，即**对象被垃圾回收器回收后能被GC从内存中移除的所有对象之和**。相对于shallow heap，Retained heap可以更精确的反映一个对象实际占用的大小（若该对象释放，retained heap都可以被释放）。

# 实际案例分析

​![](https://pic3.zhimg.com/80/v2-8a4bef30a19458b3f2615a7e91631376_1440w.webp)​

正如上图所示： 在这两张图中，我们画出了GC ROOT到所有对象引用链。在这里我们着重分析一下Retained size。

对于obj1这个对象： GC ROOT指向它，并且它依赖于obj2、obj3、obj4，但是由于obj3同样也被GC ROOT所指。 所以：

分析obj1:

对于图1，retained size包括：obj1+obj2+obj4

对于图2，retained size包括：obj1+obj2+obj3+obj4

分析obj2:

对于图1：retained size包括：obj2+obj4

对于图2：retained size包括：obj2+obj3+obj4

# 总结

本篇文章围绕内存分析中的Shallow 和Retained heap扩展了解了几个知识点如下：

* gc root的定义和概念的了解。
* 对象可达性分析和选择gc root的依据。
* 针对单个对象使用“path to GC roots”查看其引用树。
* shallow heap和retained heap的基本概念。
