# 15 | 数据结构：这些浓眉大眼的结构竟然都是智能指针？

你好，我是陈天。
到现在为止我们学了Rust的所有权与生命周期、内存管理以及类型系统，基础知识里还剩一块版图没有涉及：数据结构，数据结构里最容易让人困惑的就是智能指针，所以今天我们就来解决这个难点。
我们之前简单介绍过指针，这里还是先回顾一下：指针是一个持有内存地址的值，可以通过解引用来访问它指向的内存地址，理论上可以解引用到任意数据类型；引用是一个特殊的指针，它的解引用访问是受限的，只能解引用到它引用数据的类型，不能用作它用。
那什么是智能指针呢？
# 智能指针
在指针和引用的基础上，Rust 偷师 C++，提供了智能指针。智能指针是一个表现行为很像指针的数据结构，但除了指向数据的指针外，它还有元数据以提供额外的处理能力。
这个定义有点模糊，我们对比其他的数据结构来明确一下。
你有没有觉得很像之前讲的胖指针。智能指针一定是一个胖指针，但胖指针不一定是一个智能指针。比如 `&str` 就只是一个胖指针，它有指向堆内存字符串的指针，同时还有关于字符串长度的元数据。
我们看智能指针 String 和 &str 的区别：
![图片](https://learn.lianglianglee.com/%e4%b8%93%e6%a0%8f/%e9%99%88%e5%a4%a9%20%c2%b7%20Rust%20%e7%bc%96%e7%a8%8b%e7%ac%ac%e4%b8%80%e8%af%be/assets/f4401040f7d36b9e610b6867a5d0cf59.jpg)
从图上可以看到，String 除了多一个 capacity 字段，似乎也没有什么特殊。**但 ****String 对堆上的值有所有权，而 **`**&str**`** 是没有所有权的****，这是 Rust 中智能指针和普通胖指针的区别**。
那么又有一个问题了，智能指针和结构体有什么区别呢？因为我们知道，String 是用结构体定义的：
和普通的结构体不同的是，String 实现了 `Deref` 和 `DerefMut`，这使得它在解引用的时候，会得到 `&str`，看下面的[标准库的实现](https://doc.rust-lang.org/src/alloc/string.rs.html#2301-2316)：
另外，由于在堆上分配了数据，String 还需要为其分配的资源做相应的回收。而 String 内部使用了 `Vec`，所以它可以依赖 Vec 的能力来释放堆内存。下面是标准库中 Vec 的 [Drop trait 的实现](https://doc.rust-lang.org/src/alloc/vec/mod.rs.html#2710-2720)：
所以再清晰一下定义，**在 Rust 中，凡是需要做资源回收的数据结构，且实现了 Deref/DerefMut/Drop，都是智能指针**。
按照这个定义，除了 `String`，在之前的课程中我们遇到了很多智能指针，比如用于在堆上分配内存的 `Box` 和 `Vec`、用于引用计数的 `Rc` 和 `Arc` 。很多其他数据结构，如 `PathBuf`、`Cow<‘a, B>`、`MutexGuard`、`RwLockReadGuard` 和 `RwLockWriteGuard` 等也是智能指针。
今天我们就深入分析三个使用智能指针的数据结构：在堆上创建内存的 `Box`、提供写时克隆的 `Cow<‘a, B>`，以及用于数据加锁的 `MutexGuard`。
而且最后我们会尝试实现自己的智能指针。希望学完后你不但能更好地理解智能指针，还能在需要的时候，构建自己的智能指针来解决问题。
# Box
我们先看 Box，它是 Rust 中最基本的在堆上分配内存的方式，绝大多数其它包含堆内存分配的数据类型，内部都是通过 Box 完成的，比如 Vec。
为什么有Box的设计，我们得先回忆一下在 C 语言中，堆内存是怎么分配的。
C 需要使用 malloc/calloc/realloc/free 来处理内存的分配，很多时候，被分配出来的内存在函数调用中来来回回使用，导致谁应该负责释放这件事情很难确定，给开发者造成了极大的心智负担。
C++ 在此基础上改进了一下，提供了一个智能指针 [unique_ptr](https://en.cppreference.com/w/cpp/memory/unique_ptr)，可以在指针退出作用域的时候释放堆内存，这样保证了堆内存的单一所有权。这个 `unique_ptr` 就是 Rust 的 Box 的前身。
你看 Box 的定义里，内部就是一个 [Unique](https://doc.rust-lang.org/src/core/ptr/unique.rs.html#36-44) 用于致敬 C++，Unique 是一个私有的数据结构，我们不能直接使用，它包裹了一个 `*const T` 指针，并唯一拥有这个指针。
我们知道，在堆上分配内存，需要使用内存分配器（Allocator）。如果你上过操作系统课程，应该还记得一个简单的 [buddy system](https://en.wikipedia.org/wiki/Buddy_memory_allocation) 是如何分配和管理堆内存的。
设计内存分配器的目的除了保证正确性之外，就是为了有效地利用剩余内存，并控制内存在分配和释放过程中产生的碎片的数量。在多核环境下，它还要能够高效地处理并发请求。（如果你对通用内存分配器感兴趣，可以看参考资料）
堆上分配内存的 Box 其实有一个缺省的泛型参数 `A`，就需要满足 [Allocator trait](https://doc.rust-lang.org/std/alloc/trait.Allocator.html)，并且默认是 Global：
Allocator trait 提供很多方法：
- `allocate`是主要方法，用于分配内存，对应 C 的 `malloc`/`calloc`；
- `deallocate`，用于释放内存，对应 C 的 `free`；
- 还有 `grow`/`shrink`，用来扩大或缩小堆上已分配的内存，对应 C 的 `realloc`。
这里对 Allocator trait 我们就不详细介绍了，如果你想替换默认的内存分配器，可以使用 `#[global_allocator] `标记宏，定义你自己的全局分配器。下面的代码展示了如何在 Rust 下使用 [jemalloc](https://crates.io/crates/jemallocator)：
这样设置之后，你使用 `Box::new()` 分配的内存就是 `jemalloc` 分配出来的了。另外，如果你想撰写自己的全局分配器，可以实现 [GlobalAlloc trait](https://doc.rust-lang.org/std/alloc/trait.GlobalAlloc.html)，它和 Allocator trait 的区别，主要在于是否允许分配长度为零的内存。
## 使用场景
下面我们来实现一个自己的内存分配器。别担心，这里就是想 debug 一下，看看内存如何分配和释放，并不会实际实现某个分配算法。
首先看内存的分配。这里 MyAllocator 就用 System allocator，然后加 `eprintln!()`，和我们常用的 `println!()` 不同的是，`eprintln!()` 将数据打印到 `stderr`（[代码](https://play.rust-lang.org/?version=stable&mode=debug&edition=2018&gist=ca0ae6821e08e16609b1e10ac743e6c9)）：
### 语法说明
`**&*data**`** 用于获取原始值的引用。**在 Rust 中，`&*data` 和 `data` 的区别取决于 `data` 的类型。主要从语法层面和具体场景来看它们的差异。
#### ​`data` 是一个普通变量
- 如果 `data` 是普通变量（如 `i32` 或 `Matrix`），`data` 本身就是值，没有引用或指针语义。
- 在这种情况下，`&*data` 和 `data` 的写法无效或无意义，因为解引用 `*` 必须作用于指针类型。
例如：
#### ​`data` 是一个引用
如果 `data` 是一个引用（例如 `&T`），`&*data` 等价于 `data`，因为： 
- `*data` 解引用为原始值。
- `&` 再次借用这个值，结果还是一个 `&T` 类型，与 `data` 的类型相同。
例如：
在这种情况下，`&*data` 和 `data` 完全相同，`&*data` 是多余的。
#### ​`data` 是一个智能指针（例如 `Box`, `Rc`, 或 `Arc`）
如果 `data` 是一个智能指针（例如 `Box<T>` 或 `Arc<T>`），`&*data` 和 `data` 的区别在于： 
- `data` 是智能指针本身（例如 `Box<T>`）。
- `&*data` 是解引用智能指针后再借用得到的底层数据的引用。
例如：
- `**data**`：是 `Box<i32>` 类型，包含指向堆上数据的指针以及其他元数据。
- `**&*data**`：是 `&i32` 类型，是 `Box` 内部数据的引用。
#### ​`data` 是一个容器类型（例如 `Vec`）
如果 `data` 是一个容器类型（如 `Vec<T>`），`&*data` 会将容器转换为切片（`&[T]`）。
例如：
- `**data**`：是 `Vec<T>`，包含动态数组的元数据。
- `**&*data**`：是切片引用（`&[T]`），只指向底层数组的数据部分。
#### 总结区别

**场景**
`**data**`
`**&*data**`

普通变量
数据本身，不能使用 `&*data`
。
不适用

普通引用（`&T`
）
引用指向的数据（`&T`
 类型）。
等价于 `data`
，`&*data`
 是冗余的。

智能指针（如 `Box`
）
智能指针本身（如 `Box<T>`
 类型）。
解引用后指向的数据（如 `&T`
 类型）。

容器类型（如 `Vec`
）
容器本身（如 `Vec<T>`
 类型）。
容器中数据的切片引用（如 `&[T]`
 类型）。
注意这里不能使用 `println!() `。因为 stdout 会打印到一个由 Mutex 互斥锁保护的共享全局 buffer 中，这个过程中会涉及内存的分配，分配的内存又会触发 `println!()`，最终造成程序崩溃。而 `eprintln!` 直接打印到 stderr，不会 buffer。
运行这段代码，你可以看到类似如下输出，其中 505 大小的内存是我们 `Box::new()` 出来的：
在使用 Box 分配堆内存的时候要注意，`Box::new()` 是一个函数，所以传入它的数据会出现在栈上，再移动到堆上。所以，如果我们的 Matrix 结构不是 505 个字节，是一个非常大的结构，就有可能出问题。
比如下面的代码想在堆上分配 16M 内存，如果你在 playground 里运行，直接栈溢出 stack overflow（[代码](https://play.rust-lang.org/?version=stable&mode=debug&edition=2018&gist=4aa8e21e6da6b572dae2ad8d68787e1e)）：
但如果你在本地使用 “cargo run —release” 编译成 release 代码运行，会正常执行！
这是因为 “cargo run” 或者在 playground 下运行，默认是 debug build，它不会做任何 inline 的优化，而 `Box::new()` 的实现就一行代码，并注明了要 inline，在 release 模式下，这个函数调用会被优化掉：
如果不 inline，整个 16M 的大数组会通过栈内存传递给 `Box::new`，导致栈溢出。这里我们惊喜地发现了一个新的关键字 `box`。然而 `box` 是 Rust 内部的关键字，用户代码无法调用，它只出现在 Rust 代码中，用于分配堆内存，`box` 关键字在编译时，会使用内存分配器分配内存。
搞明白 Box 的内存分配，我们还很关心内存是如何释放的，来看它实现的 Drop trait：
哈，目前 drop trait 什么都没有做，编译器会自动插入 deallocate 的代码。这是 Rust 语言的一种策略：**在具体实现还没有稳定下来之前，我先把接口稳定，实现随着之后的迭代慢慢稳定**。
这样可以极大地避免语言在发展的过程中，引入对开发者而言的破坏性更新（breaking change）。破坏性更新会使得开发者在升级语言的版本时，不得不大幅更改原有代码。
Python 是个前车之鉴，由于引入了大量的破坏性更新，Python 2 到 3 的升级花了十多年才慢慢完成。所以 Rust 在设计接口时非常谨慎，很多重要的接口都先以库的形式存在了很久，最终才成为标准库的一部分，比如 Future trait。一旦接口稳定后，内部的实现可以慢慢稳定。
# Cow<‘a, B>
了解了 Box 的工作原理后，再来看 `Cow<‘a, B>`的原理和使用场景，（[第12讲]）讲泛型数据结构的时候，我们简单讲过参数B的三个约束。
Cow 是 Rust 下用于提供写时克隆（Clone-on-Write）的一个智能指针，它跟虚拟内存管理的写时复制（Copy-on-write）有异曲同工之妙：**包裹一个只读借用，但如果调用者需要所有权或者需要修改内容，那么它会 clone 借用的数据**。
我们看Cow的定义：
它是一个 enum，可以包含一个对类型 B 的只读引用，或者包含对类型 B 的拥有所有权的数据。
这里又引入了两个 trait，首先是 `ToOwned`，在 ToOwned trait 定义的时候，又引入了 `Borrow` trait，它们都是 [std::borrow](https://doc.rust-lang.org/std/borrow/index.html) 下的 trait：
如果你看不懂这段代码，不要着急，想要理解 Cow trait，ToOwned trait 是一道坎，因为` type Owned: Borrow` 不好理解，耐下心来我们拆开一点点解读。
首先，`type Owned: Borrow` 是一个带有关联类型的 trait ，如果你对这个知识点有些遗忘，可以再复习一下[第 13 讲]。这里 `Owned` 是关联类型，需要使用者定义，和我们之前介绍的关联类型不同的是，这里 Owned 不能是任意类型，它必须满足 Borrow trait。例如我们看 [str 对 ToOwned trait 的实现](https://doc.rust-lang.org/src/alloc/str.rs.html#215-227)：
可以看到关联类型 Owned 被定义为 String，而根据要求，String 必须定义 Borrow，那这里 Borrow 里的泛型变量 `T` 是谁呢？
ToOwned 要求是 Borrow，而此刻实现 ToOwned 的主体是 str，所以 Borrow 是 Borrow，也就是说 String 要实现 Borrow，我们看[文档](https://doc.rust-lang.org/std/string/struct.String.html#impl-Borrow)，它的确[实现了这个 trait](https://doc.rust-lang.org/src/alloc/str.rs.html#198-203)：
你是不是有点晕了，我用一张图梳理了这几个 trait 之间的关系：-
![图片](https://learn.lianglianglee.com/%e4%b8%93%e6%a0%8f/%e9%99%88%e5%a4%a9%20%c2%b7%20Rust%20%e7%bc%96%e7%a8%8b%e7%ac%ac%e4%b8%80%e8%af%be/assets/ayyc5f85c3d9897ddd1acd4c067a5852.jpg)
通过这张图，我们可以更好地搞清楚 Cow 和 `ToOwned`/`Borrow` 之间的关系。
这里，你可能会疑惑，为何 Borrow 要定义成一个泛型 trait 呢？搞这么复杂，难道一个类型还可以被借用成不同的引用么？
是的。我们看一个例子（[代码](https://play.rust-lang.org/?version=stable&mode=debug&edition=2018&gist=36831f05a3e27690beac9fd5beb5b524)）：
在这里例子里，String 可以被借用为 `&String`，也可以被借用为 `&str`。
好，再来继续看 Cow。我们说它是智能指针，那它自然需要[实现 Deref trait](https://doc.rust-lang.org/src/alloc/borrow.rs.html#332-341)：
实现的原理很简单，根据 self 是 Borrowed 还是 Owned，我们分别取其内容，生成引用：
- 对于 Borrowed，直接就是引用；
- 对于 Owned，调用其 `borrow()` 方法，获得引用。
这就很厉害了。虽然 Cow 是一个 enum，但是通过 Deref 的实现，我们可以获得统一的体验，比如 Cow，使用的感觉和 `&str`/`String` 是基本一致的。注意，**这种根据 enum 的不同状态来进行统一分发的方法是第三种分发手段**，之前讲过可以使用泛型参数做静态分发和使用 trait object 做动态分发。
## 使用场景
那么 Cow 有什么用呢？显然，它可以在需要的时候才进行内存的分配和拷贝，在很多应用场合，它可以大大提升系统的效率。如果 `Cow<‘a, B>` 中的 Owned 数据类型是一个需要在堆上分配内存的类型，如 String、Vec 等，还能减少堆内存分配的次数。
我们说过，相对于栈内存的分配释放来说，堆内存的分配和释放效率要低很多，其内部还涉及系统调用和锁，**减少不必要的堆内存分配是提升系统效率的关键手段**。而 Rust 的 Cow<‘a, B>，在帮助你达成这个效果的同时，使用体验还非常简单舒服。
光这么说没有代码佐证，我们看一个使用 Cow 的实际例子。
在解析 URL 的时候，我们经常需要将 querystring 中的参数，提取成 KV pair 来进一步使用。绝大多数语言中，提取出来的 KV 都是新的字符串，在每秒钟处理几十 k 甚至上百 k 请求的系统中，你可以想象这会带来多少次堆内存的分配。
但在 Rust 中，我们可以用 Cow 类型轻松高效处理它，在读取 URL 的过程中：
- 每解析出一个 key 或者 value，我们可以用一个 `&str` 指向 URL 中相应的位置，然后用 Cow 封装它；
- 而当解析出来的内容不能直接使用，需要 decode 时，比如 “hello%20world”，我们可以生成一个解析后的 String，同样用 Cow 封装它。
看下面的例子（[代码](https://play.rust-lang.org/?version=stable&mode=debug&edition=2018&gist=4a7ec8125238dfefc0b8b82f262c3eaf)）：
是不是很简洁。
类似 URL parse 这样的处理方式，在 Rust 标准库和第三方库中非常常见。比如 Rust 下著名的 [serde 库](https://serde.rs/)，可以非常高效地对 Rust 数据结构，进行序列化/反序列化操作，它对 Cow 就有很好的支持。
我们可以通过如下代码将一个 JSON 数据反序列化成 User 类型，同时让 User 中的 name 使用 Cow 来引用 JSON 文本中的内容（[代码](https://play.rust-lang.org/?version=stable&mode=debug&edition=2018&gist=5154f27658e3853fb894b3de993d877c)）：
未来在你用 Rust 构造系统时，也可以充分考虑在数据类型中使用 Cow。
# MutexGuard
如果说，上面介绍的 String、Box、`Cow<‘a, B>` 等智能指针，都是通过 Deref 来提供良好的用户体验，那么 MutexGuard 是另外一类很有意思的智能指针：它不但通过 Deref 提供良好的用户体验，**还通过 Drop trait 来确保，使用到的内存以外的资源在退出时进行释放**。
MutexGuard 这个结构是在调用 [Mutex::lock](https://doc.rust-lang.org/src/std/sync/mutex.rs.html#279-284) 时生成的：
首先，它会取得锁资源，如果拿不到，会在这里等待；如果拿到了，会把 `Mutex` 结构的引用传递给 `MutexGuard`。
我们看 MutexGuard 的[定义](https://doc.rust-lang.org/src/std/sync/mutex.rs.html#190-195)以及它的 `Deref` 和 `Drop` 的[实现](https://doc.rust-lang.org/src/std/sync/mutex.rs.html#462-487)，很简单：
从代码中可以看到，当 `MutexGuard` 结束时，`Mutex` 会做 unlock，这样用户在使用 `Mutex` 时，可以不必关心何时释放这个互斥锁。因为无论你在调用栈上怎样传递 `MutexGuard` ，哪怕在错误处理流程上提前退出，Rust 有所有权机制，可以确保只要 `MutexGuard` 离开作用域，锁就会被释放。
## 使用场景
我们来看一个使用 Mutex 和 MutexGuard 的例子（[代码](https://play.rust-lang.org/?version=stable&mode=debug&edition=2018&gist=f01427ed0a8534ade980b88791be9d5b)），代码很简单，我写了详尽的注释帮助你理解。
如果你有疑问，这样如何保证锁的线程安全呢？如果我在线程 1 拿到了锁，然后把 `MutexGuard` 移动给线程 2 使用，加锁和解锁在完全不同的线程下，会有很大的死锁风险。怎么办？
不要担心，`MutexGuard` 不允许 `Send`，只允许 `Sync`，也就是说，你可以把 `MutexGuard` 的引用传给另一个线程使用，但你无法把 `MutexGuard` 整个移动到另一个线程：
类似 `MutexGuard` 的智能指针有很多用途。比如要创建一个连接池，你可以在 Drop trait 中，回收 checkout 出来的连接，将其再放回连接池。如果你对此感兴趣，可以看看 [r2d2 的实现](https://github.com/sfackler/r2d2/blob/master/src/lib.rs#L611)，它是 Rust 下一个数据库连接池的实现。
# 实现自己的智能指针
到目前为止，三个经典的智能指针，在堆上创建内存的 `Box`、提供写时克隆的 `Cow<‘a, B>`，以及用于数据加锁的 `MutexGuard`，它们的实现和使用方法就讲完了。
那么，如果我们想实现自己的智能指针，该怎么做？或者咱们换个问题：有什么数据结构适合实现成为智能指针？
因为很多时候，**我们需要实现一些自动优化的数据结构**，在某些情况下是一种优化的数据结构和相应的算法，在其他情况下使用通用的结构和通用的算法。
比如当一个 `HashSet` 的内容比较少的时候，可以用数组实现，但内容逐渐增多，再转换成用哈希表实现。如果我们想让使用者不用关心这些实现的细节，使用同样的接口就能享受到更好的性能，那么，就可以考虑用智能指针来统一它的行为。
## 使用小练习
我们来看一个实际的例子。之前讲过，**Rust 下 **`**String**`** 在栈上占了 24 个字节**，然后在堆上存放字符串实际的内容，对于一些比较短的字符串，这很浪费内存。有没有办法在字符串长到一定程度后，才使用标准的字符串呢？
参考 `Cow`，我们可以用一个 enum 来处理：当字符串小于 `N` 字节时，我们直接用栈上的数组，否则，使用 `String`。但是这个 `N` 不宜太大，否则当使用 String 时，会比目前的版本浪费内存。
怎么设计呢？之前在内存管理的部分讲过，当使用 enum 时，额外的 tag + 为了对齐而使用的 padding 会占用一些内存。因为 String 结构是 8 字节对齐的，我们的 enum 最小 8 + 24 = 32 个字节。
所以，可以设计一个数据结构，**内部用一个字节表示字符串的长度，用 30 个字节表示字符串内容，再加上 1 个字节的 tag，正好也是 32 字节，可以和 String 放在一个 enum 里使用**。我们暂且称这个 enum 叫 MyString，它的结构如下图所示：

![图片](https://learn.lianglianglee.com/%e4%b8%93%e6%a0%8f/%e9%99%88%e5%a4%a9%20%c2%b7%20Rust%20%e7%bc%96%e7%a8%8b%e7%ac%ac%e4%b8%80%e8%af%be/assets/f45e1f15a1448943979f93d13cdc0197.jpg)
为了让 `MyString` 表现行为和 `&str` 一致，我们可以通过实现 `Deref` trait 让 `MyString` 可以被解引用成 `&str`。除此之外，还可以实现 `Debug`/`Display` 和 `From` trait，让 `MyString` 使用起来更方便。
整个实现的代码如下（[代码](https://play.rust-lang.org/?version=stable&mode=debug&edition=2018&gist=ce83a82cd66aa412e68eebf6b292a832)），代码本身不难理解，你可以试着自己实现一下，或者一行行抄下来运行，感受一下。
这个简单实现的 `MyString`，不管它内部的数据是纯栈上的 `MiniString` 版本，还是包含堆上内存的 `String` 版本，使用的体验和 `&str` 都一致，仅仅牺牲了一点点效率和内存，就可以让小容量的字符串，可以高效地存储在栈上并且自如地使用。
事实上，Rust 有个叫 `smartstring` 的第三方库就实现了这个功能。我们的版本在内存上不算经济，对于 `String` 来说，额外多用了 8 个字节，`smartstring` 通过优化，只用了和 `String` 结构一样大小的 24 个字节，就达到了我们想要的结果。你如果感兴趣的话，欢迎去看看它的[源代码](https://github.com/bodil/smartstring)。
# 小结
今天我们介绍了三个重要的智能指针，它们有各自独特的实现方式和使用场景。
`Box` 可以在堆上创建内存，是很多其他数据结构的基础。
`Cow` 实现了 Clone-on-write 的数据结构，让你可以在需要的时候再获得数据的所有权。`Cow` 结构是一种使用 `enum` 根据当前的状态进行分发的经典方案。甚至，你可以用类似的方案取代 `trait` object 做动态分发，[其效率是动态分发的数十倍](https://gitlab.com/antonok/enum_dispatch)。
如果你想合理地处理资源相关的管理，`MutexGuard` 是一个很好的参考，它把从 `Mutex` 中获得的锁包装起来，实现只要 `MutexGuard` 退出作用域，锁就一定会释放。如果你要做资源池，可以使用类似 `MutexGuard` 的方式。
# 思考题
- 目前 `MyString` 只能从 `&str` 生成。如果要支持从 `String` 中生成一个 `MyString`，该怎么做？
- 目前 `MyString` 只能读取，不能修改，能不能给它加上类似 `String` 的 [push_str](https://doc.rust-lang.org/std/string/struct.String.html#method.push_str) 接口？
- 你知道 `Cow<[u8]>` 和 `Cow` 的大小么？试着打印一下看看。想想，为什么它的大小是这样呢？
欢迎在留言区分享你的思考。今天你已经完成Rust学习第15次打卡了，继续加油，我们下节课见～
# 参考资料
常见的通用内存分配器有 glibc 的 [pthread malloc](http://www.malloc.de/en/)、Google 开发的 [tcmalloc](https://github.com/google/tcmalloc)、FreeBSD 上默认使用的 [jemalloc](https://github.com/jemalloc/jemalloc) 等。除了通用内存分配器，对于特定类型内存的分配，我们还可以用 [slab](https://en.wikipedia.org/wiki/Slab_allocation)，slab 相当于一个预分配好的对象池，可以扩展和收缩。