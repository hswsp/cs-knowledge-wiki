# 加餐 宏编程（上）：用最“笨”的方式撰写宏

你好，我是陈天。
学过上一讲，相信你现在应该理解为什么在课程的[第 6 讲]我们说，宏的本质其实很简单，抛开 quote/unquote，宏编程主要的工作就是把一棵语法树转换成另一颗语法树，而这个转换的过程深入下去，不过就是数据结构到数据结构的转换。
那在Rust里宏到底是如何做到转换的呢？
接下来，我们就一起尝试构建声明宏和过程宏。希望你能从自己撰写的过程中，感受构建宏的过程中做数据转换的思路和方法，掌握了这个方法，你可以应对几乎所有和宏编程有关的问题。
## 如何构建声明宏
首先看声明宏是如何创建的。
我们 `cargo new macros --lib` 创建一个新的项目，然后在新生成的项目下，创建 examples 目录，添加 examples/rule.rs（[代码](https://play.rust-lang.org/?version=stable&mode=debug&edition=2021&gist=13d255537f5bae59fb83a205373b1ff7)）：
上一讲我们说过对于声明宏可以用 `macro_rules!` 生成。macro_rules 使用模式匹配，所以你可以提供多个匹配条件以及匹配后对应执行的代码块。
看这段代码，我们写了3个匹配的rules。
第一个 `() => (std::vec::Vec::new())` 很好理解，如果没有传入任何参数，就创建一个新的 Vec。注意，由于宏要在调用的地方展开，我们无法预测调用者的环境是否已经做了相关的 use，所以我们使用的代码最好带着完整的命名空间。
**这第二个匹配条件 **`($($el:expr),*)`**，需要详细介绍一下**。
在声明宏中，条件捕获的参数使用 `(`开头的标识符来声明。每个参数都需要提供类型，这里 `expr` 代表表达式，所以 `$el:expr`是说把匹配到的表达式命名为`$el`。`$(…),*`告诉编译器可以匹配任意多个以逗号分隔的表达式，然后捕获到的每一个表达式可以用`$el` 来访问。
由于匹配的时候匹配到一个 `$(...)*` （我们可以不管分隔符），在执行的代码块中，我们也要相应地使用 `$(...)*` 展开。所以这句 `$(v.push($el);)*` 相当于匹配出多少个 `$el`就展开多少句 push 语句。
理解了第二个匹配条件，第三个就很好理解了：如果传入用冒号分隔的两个表达式，那么会用 `from_element` 构建 Vec。
在使用声明宏时，我们需要为参数明确类型，哪些类型可用也整理在这里了：
- `item`，比如一个函数、结构体、模块等。
- `block`，代码块。比如一系列由花括号包裹的表达式和语句。
- `stmt`，语句。比如一个赋值语句。
- `pat`，模式。
- `expr`，表达式。刚才的例子使用过了。
- `ty`，类型。比如 Vec。
- `ident`，标识符。比如一个变量名。
- `path`，路径。比如：`foo`、`::std::mem::replace`、`transmute::<_, int>`。
- `meta`，元数据。一般是在 `#[...]` 和 `#![...]` 属性内部的数据。
- `tt`，单个的 token 树。
- `vis`，可能为空的一个 `Visibility` 修饰符。比如 pub、pub(crate)。
声明宏构建起来很简单，**只要遵循它的基本语法，你可以很快把一个函数或者一些重复的语句片段转换成声明宏**。
比如在处理 pipeline 时，我经常会根据某个返回 Result 的表达式的结果，做下面代码里这样的 match，使其在出错时返回 PipelineError 这个 enum 而非 Result：
但是这种写法，在同一个函数内，可能会反复出现，我们又无法用函数将其封装，所以我们可以用声明宏来实现，可以大大简化代码：
## 如何构建过程宏
接下来我们讲讲如何构建过程宏。
过程宏要比声明宏要复杂很多，不过无论是哪一种过程宏，**本质都是一样的，都涉及要把输入的 TokenStream 处理成输出的 TokenStream**。
要构建过程宏，你需要单独构建一个 crate，在 Cargo.toml 中添加 proc-macro 的声明：
这样，编译器才允许你使用 `#[proc_macro]` 相关的宏。所以我们先在今天这堂课生成的 crate 的 Cargo.toml 中添加这个声明，然后在 [lib.rs](http://lib.rs/) 里写入如下代码：
这段代码首先声明了它是一个 proc_macro，并且是最基本的、函数式的过程宏。
使用者可以通过 `query!(...)` 来调用。我们打印传入的 [TokenStream](https://doc.rust-lang.org/proc_macro/struct.TokenStream.html)，然后把一段包含在字符串中的代码解析成 TokenStream 返回。这里可以非常方便地用字符串的 parse() 方法来获得 TokenStream，是因为 TokenStream 实现了 [FromStr](https://doc.rust-lang.org/std/str/trait.FromStr.html) trait，感谢Rust。
好，明白这段代码做了什么，我们写个例子尝试使用一下，来创建 examples/query.rs，并写入代码：
可以看到，尽管 `SELECT * FROM user WHERE age > 10` 不是一个合法的 Rust 语法，但 Rust 的词法分析器还是把它解析成了 TokenStream，提供给 query 宏。
运行 `cargo run --example query`，看 query 宏对输入 TokenStream 的打印：
这里面，TokenStream 是一个 Iterator，里面包含一系列的 [TokenTree](https://doc.rust-lang.org/proc_macro/enum.TokenTree.html)：
后三个分别是 Ident（标识符）、Punct（标点符号）和 Literal（字面量）。这里的Group（组），是因为如果你的代码中包含括号，比如`{} [] <> ()` ，那么内部的内容会被分析成一个 Group（组）。你也可以试试把例子中对 `query!` 的调用改成这个样子：
再运行一下 `cargo run --example query`，看看现在的 TokenStream 长什么样子，是否包含 Group。
好，现在我们对输入的 TokenStream 有了一个概念，那么，输出的 TokenStream 有什么用呢？我们的 `query!` 宏返回了一个 `hello()` 函数的 TokenStream，这个函数真的可以直接调用么？
你可以试试在 main() 里加入对 hello() 的调用，再次运行这个 example，可以看到久违的 “Hello world!” 打印。
恭喜你！你的第一个过程宏就完成了！
虽然这并不是什么了不起的结果，但是通过它，我们认识到了过程宏的基本写法，以及TokenStream/TokenTree 的基本结构。
接下来，我们就尝试实现一个派生宏，这是过程宏的三类宏中对大家最有意义的一类，也是工作中如果需要写过程宏主要会用到的宏类型。
## 如何构建派生宏
我们期望构建一个 Builder 派生宏，实现 [proc-macro-workshop](https://github.com/dtolnay/proc-macro-workshop) 里[如下需求](https://github.com/dtolnay/proc-macro-workshop/blob/master/builder/tests/06-optional-field.rs)（proc-macro-workshop是 Rust 大牛 David Tolnay 为帮助大家更好地学习宏编程构建的练习）：
可以看到，我们仅仅是为 Command 这个结构提供了 Builder 宏，就让它支持 builder() 方法，返回了一个 CommandBuilder 结构，这个结构有若干个和 Command 内部每个域名字相同的方法，我们可以链式调用这些方法，最后 build() 出一个 Command 结构。
我们创建一个 examples/command.rs，把这部分代码添加进去。显然，它是无法编译通过的。下面先来手工撰写对应的代码，看看一个完整的、能够让 main() 正确运行的代码长什么样子：
这个代码很简单，基本就是照着 main() 中的使用方法，一个函数一个函数手写出来的，你可以看到代码中很多重复的部分，尤其是 CommandBuilder 里的方法，这是我们可以用宏来自动生成的。
那怎么生成这样的代码呢？显然，我们要把输入的 TokenStream抽取出来，也就是把在 struct 的定义内部，每个域的名字及其类型都抽出来，然后生成对应的方法代码。
**如果把代码看做是字符串的话，不难想象到，实际上就是要通过一个模板和对应的数据，生成我们想要的结果**。用模板生成 HTML，想必各位都不陌生，但通过模板生成 Rust 代码，估计你是第一次。
有了这个思路，我们尝试着用 [jinja](https://jinja.palletsprojects.com/en/3.0.x/) 写一个生成 CommandBuilder 结构的模板。在 Rust 里，我们有 [askma](https://github.com/djc/askama) 这个非常高效的库来处理 jinja。模板大概长这个样子：
这里的 fileds/builder_name 是我们要传入的参数，每个 field 还需要 name 和 ty 两个属性，分别对应 field 的名字和类型。我们也可以为这个结构生成方法：
对于原本是 Option 类型的域，要避免生成 Option，我们需要把是否是 Option 单独抽取出来，如果是 Option，那么 ty 就是 T。所以，field 还需要一个属性 optional。
有了这个思路，我们可以构建自己的数据结构来描述 Field：
**当我们有了模板，又定义好了为模板提供数据的结构，接下来要处理的核心问题就是：如何从 TokenStream 中抽取出来我们想要的信息**？
带着这个问题，我们在 [lib.rs](http://lib.rs/) 里添加一个 derive macro，把 input 打印出来：
对于 derive macro，要使用 `proce_macro_derive` 这个宏。我们把这个 derive macro 命名为 RawBuilder。在 examples/command.rs 中，我们修改 Command 结构，使其使用 RawBuilder（注意要 use macros::RawBuilder）：
运行这个 example 后，我们会看到一大片 TokenStream 的打印（比较长这里就不贴了），仔细阅读这个打印，可以看到：
- 首先有一个 Group，包含了 `#[allow(dead_code)]` 属性的信息。因为我们现在拿到的 derive 下的信息，所以所有不属于 `#[derive(...)]` 的属性，都会被放入 TokenStream 中。
- 之后是 pub/struct/Command 三个 ident。
- 随后又是一个 Group，包含了每个 field 的信息。我们看到，field 之间用逗号这个 Punct 分隔，field 的名字和类型又是通过冒号这个 Punct 分隔。而类型，可能是一个 Ident，如 String，或者一系列 Ident/Punct，如 Vec/。
**我们要做的就是，把这个 TokenStream 中的 struct 名字，以及每个 field 的名字和类型拿出来**。如果类型是 Option，那么把 T 拿出来，把 optional 设置为 true。
好，有了这个思路，来写代码。首先在 Cargo.toml 中引入一些依赖：
akama 要求模板放在和 src 平行的 templates 目录下，创建这个目录，然后写入 templates/builder.j2：
然后创建 src/raw_builder.rs（记得在 [lib.rs](http://lib.rs/) 中引入），写入代码，这段代码我加了详细的注释，你可以对着打印出来的 TokenStream和刚才的分析，相信不难理解。
核心的就是 get_struct_fields() 方法，如果你觉得难懂，可以想想如果你要把一个 `a=1,b=2` 的字符串切成 `[[a, 1], [b, 2]]` 该怎么做，就很容易理解了。
好，完成了把 TokenStream 转换成 BuilderContext 的代码，**接下来就是在 proc_macro 中使用这个结构以及它的 render 方法**。我们把 [lib.rs](http://lib.rs/) 中的代码修改一下（注意添加相关的 use）：
保存后，你立刻会发现，VS Code 抱怨 examples/command.rs 编译不过，因为里面有重复的数据结构和方法的定义。我们把之前手工生成的代码全部删掉，只保留：
运行之，我们撰写的 RawBuilder 宏起作用了！代码运行一切正常！
## 小结
这一讲我们简单介绍了 Rust 宏编程的能力，并撰写了一个声明宏 my_vec! 和一个派生宏 RawBuilder。通过自己手写，核心就是要理解清楚宏做数据转换的方法：如何从 TokenStream 中抽取需要的数据，然后生成包含目标代码的字符串，最后再把字符串转换成 TokenStream。
在构建 RawBuilder 的过程中，我们还了解了 TokenStream 和 TokenTree，虽然这两个数据结构是 Rust 下的结构，但是 token stream/token tree 这样的概念是每个支持宏的语言共有的，如果你理解了 Rust 的宏编程，那么学习其他语言的宏编程就很容易了。
在手写的过程中，你可能会觉得宏编程过于繁琐，这是因为解析 TokenStream 是一个苦力活，要和各种各样的情况打交道，如果处理不好，就很容易出错。
那在Rust生态下有没有人已经做过这个苦力活了呢？我们下节课继续……
### 思考题
最后出个思考题给你练练手。工作中，有很多场景我们需要通过第三方的 schema 来生成 Rust 数据结构，比如 protobuf 的定义到 Rust struct/enum 的转换。这些转换如果手工撰写的话，是纯粹的体力活，我们可以通过宏来简化这个操作。
假设你的公司维护了大量的 openapi v3 spec，需要你通过它来生成 Rust 类型，比如这里的 schema 定义（[来源](https://gist.github.com/danielflower/5c5ae8a46a0a49aee508690c19b33ada#file-petstore-json-L833-L869)）：
你可以试着使用今天所学内容，撰写一个 `generate!` 宏，接受一个包含 schema 定义的文件名，生成 schema。如果你遇到问题卡壳了，可以参考B站上我live coding的[视频](https://www.bilibili.com/video/BV1Za411q7LQ/)。
欢迎在留言区讨论你的想法，如果觉得有收获，也欢迎你分享给身边的朋友，邀他一起讨论。我们下节课见。