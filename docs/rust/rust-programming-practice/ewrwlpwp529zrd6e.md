# 44 | 数据处理：应用程序和数据如何打交道？

你好，我是陈天。
我们开发者无论是从事服务端的开发，还是客户端的开发，和数据打交道是必不可少的。
对于客户端来说，从服务端读取到的数据，往往需要做缓存（内存缓存或者 SQLite 缓存），甚至需要本地存储（文件或者 SQLite）。
对于服务器来说，跟数据打交道的场景就更加丰富了。除了数据库和缓存外，还有大量文本数据的索引（比如搜索引擎）、实时的消息队列对数据做流式处理，或者非实时的批处理对数据仓库（data warehouse）中的海量数据进行 ETL（Extract、Transform and Load）。

![图片](https://learn.lianglianglee.com/%e4%b8%93%e6%a0%8f/%e9%99%88%e5%a4%a9%20%c2%b7%20Rust%20%e7%bc%96%e7%a8%8b%e7%ac%ac%e4%b8%80%e8%af%be/assets/1c42e693f0848b4a389870f848ffaeeb.png)
今天我们就来讲讲如何用 Rust 做数据处理，主要讲两部分，如何用 Rust 访问关系数据库，以及如何用 Rust 对半结构化数据进行分析和处理。希望通过学习这一讲的内容，尤其是后半部分的内容，能帮你打开眼界，对数据处理有更加深刻的认识。
## 访问关系数据库
作为互联网应用的最主要的数据存储和访问工具，关系数据库，是几乎每门编程语言都有良好支持的数据库类型。
在 Rust 下，有几乎所有主流关系数据库的驱动，比如 [rust-postgres、rust-mysql-simple](https://github.com/sfackler/rust-postgres) 等，不过一般我们不太会直接使用数据库的驱动来访问数据库，因为那样会让应用过于耦合于某个数据库，所以我们会使用 ORM。
Rust 下有 [diesel](https://diesel.rs/) 这个非常成熟的 ORM，还有 [sea-orm](https://github.com/SeaQL/sea-orm) 这样的后起之秀。diesel 不支持异步，而 sea-orm 支持异步，所以，有理由相信，随着 sea-orm 的不断成熟，会有越来越多的应用在 sea-orm 上构建。
如果你觉得 ORM 太过笨重，繁文缛节太多，但又不想直接使用某个数据库的驱动来访问数据库，那么你还可以用 [sqlx](https://github.com/launchbadge/sqlx)。sqlx 提供了对多种数据库（Postgres、MySQL、SQLite、MSSQL）的异步访问支持，并且不使用 DSL 就可以对 SQL query 做编译时检查，非常轻便；它可以从数据库中直接查询出来一行数据，也可以通过派生宏自动把行数据转换成对应的结构。
今天，我们就尝试使用 sqlx 处理用户注册和登录这两个非常常见的功能。
### sqlx
构建下面的表结构来处理用户登录信息：
特别说明一下，在数据库中存储用户信息需要非常谨慎，尤其是涉及敏感的数据，比如密码，需要使用特定的哈希算法存储。OWASP 对密码的存储有如下[安全建议](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)：
- 如果 Argon2id 可用，那么使用 Argon2id（需要目标机器至少有 15MB 内存）。
- 如果 Argon2id 不可用，那么使用 bcrypt（算法至少迭代 10 次）。
- 之后再考虑 scrypt/PBKDF2。
Argon2id 是 Argon2d 和 Argon2i 的组合，Argon2d 提供了强大的抗 GPU 破解能力，但在特定情况下会容易遭受[旁路攻击](https://zh.wikipedia.org/wiki/旁路攻击)（side-channel attacks），而 Argon2i 则可以防止旁路攻击，但抗 GPU 破解稍弱。所以只要是编程语言支持 Argo2id，那么它就是首选的密码哈希工具。
Rust 下有完善的 [password-hashes](https://github.com/RustCrypto/password-hashes) 工具，我们可以使用其中的 [argon2](https://github.com/RustCrypto/password-hashes/tree/master/argon2) crate，用它生成的一个完整的，包含所有参数的密码哈希长这个样子：
这个字符串里包含了 argon2id 的版本（19）、使用的内存大小（4096k）、迭代次数（3 次）、并行程度（1 个线程），以及 base64 编码的 salt 和 hash。
所以，当新用户注册时，我们使用 argon2 把传入的密码哈希一下，存储到数据库中；当用户使用 email/password 登录时，我们通过 email 找到用户，然后再通过 argon2 验证密码。数据库的访问使用 sqlx，为了简单起见，避免安装额外的数据库，就使用 SQLite来存储数据（如果你本地有 MySQL 或者 PostgreSQL，可以自行替换相应的语句）。
有了这个思路，我们创建一个新的项目，添加相关的依赖：
然后创建 examples/user.rs，添入代码，你可以对照详细的注释来理解：
在这段代码里，我们把 argon2 的能力稍微包装了一下，提供了 `generate_password_hash` 和 `verify_password` 两个方法给注册和登录使用。对于数据库的访问，我们提供了一个连接池 SqlitePool，便于无锁访问。
你可能注意到了这句写法：
是不是很惊讶，一般来说，这是 ORM 才有的功能啊。没错，它再次体现了 Rust trait 的强大：我们并不需要 ORM 就可以把数据库中的数据跟某个 Model 结合起来，只需要在查询时，提供想要转换成的数据结构 T: FromRow 即可。
看 query_as 函数和 FromRow trait 的定义（[代码](https://docs.rs/sqlx-core/0.5.9/src/sqlx_core/query_as.rs.html#157-160)）：
要让一个数据结构支持 FromRow，很简单，使用 sqlx::FromRow 派生宏即可：
希望这个例子可以让你体会到 Rust 处理数据库的强大和简约。我们用 Rust 写出了 Node.js/Python 都不曾拥有的直观感受。另外，sqlx 是一个非常漂亮的 crate，有空的话建议你也看看它的源代码，开头介绍的 sea-orm，底层也是使用了 sqlx。
**特别说明**，以上例子如果运行失败，可以去[GitHub](https://github.com/tyrchen/geektime-rust/tree/master/44_data_processing/data)上把 example.db 拷贝到本地 data 目录下，然后运行。
## 用 Rust 对半结构化数据进行分析
在生产环境中，我们会累积大量的半结构化数据，比如各种各样的日志、监控数据和分析数据。
以日志为例，虽然通常会将其灌入日志分析工具，通过可视化界面进行分析和问题追踪，但偶尔我们也需要自己写点小工具进行处理，一般，会用 Python 来处理这样的任务，因为 Python 有 pandas 这样用起来非常舒服的工具。然而，pandas 太吃内存，运算效率也不算高。有没有更好的选择呢？
在第 6 讲我们介绍过 [polars](https://github.com/pola-rs/polars)，也用 polars 和 [sqlparser](https://github.com/sqlparser-rs/sqlparser-rs) 写了一个处理 csv 的工具，其实 polars 底层使用了 [Apache arrow](https://arrow.apache.org/)。如果你经常进行大数据处理，那么你对列式存储（[columnar datastore](https://en.wikipedia.org/wiki/Column-oriented_DBMS)）和 [Data Frame](https://pandas.pydata.org/pandas-docs/stable/user_guide/dsintro.html#dataframe) 应该比较熟悉，arrow 就是一个在内存中进行存储和运算的列式存储，它是构建下一代数据分析平台的基础软件。
由于 Rust 在业界的地位越来越重要，Apache arrow 也构建了完全用 [Rust 实现的版本](https://github.com/apache/arrow-rs)，并在此基础上构建了高效的 in-memory 查询引擎 [datafusion](https://github.com/apache/arrow-datafusion) ，以及在某些场景下可以取代 Spark 的分布式查询引擎 [ballista](https://github.com/apache/arrow-datafusion/blob/master/ballista/README.md)。
Apache arrow 和 datafusion 目前已经有很多重磅级的应用，其中最令人兴奋的是 [InfluxDB IOx](https://github.com/influxdata/influxdb_iox)，它是[下一代的 InfluxDB 的核心引擎](https://www.influxdata.com/blog/announcing-influxdb-iox/)。
来一起感受一下 datafusion 如何使用：
在这段代码中，我们通过 CsvReadOptions 推断 CSV 的 schema，然后将其注册为一个逻辑上的 example 表，之后就可以通过 SQL 进行查询了，是不是非常强大？
下面我们就使用 datafusion，来构建一个 Nginx 日志的命令行分析工具。
### datafusion
在这门课程的 [GitHub repo](https://github.com/tyrchen/geektime-rust/tree/master/44_data_processing/fixtures) 里，我放了个从网上找到的样本日志，改名为 nginx_logs.csv（注意后缀需要是 csv），其格式如下：
这个日志共有十个域，除了几个 “-”，无法猜测到是什么内容外，其它的域都很好猜测。
由于 nginx_logs 的格式是在 Nginx 配置中构建的，所以，日志文件，并不像 CSV 文件那样有一行 header，没有 header，就无法让 datafusion 直接帮我们推断出 schema，也就是说**我们需要显式地告诉 datafusion 日志文件的 schema 长什么样**。
不过对于 datafusuion 来说，创建一个 schema 很简单，比如：
为了最大的灵活性，我们可以对应地构建一个简单的 schema 定义文件，里面每个字段按顺序对应 nginx 日志的字段：
这样，未来如果遇到不一样的日志文件，我们可以修改 schema 的定义，而无需修改程序本身。
对于这个 schema 定义文件，使用 [serde](https://github.com/serde-rs/serde) 和 [serde-yaml](https://github.com/dtolnay/serde-yaml) 来读取，然后再实现 From trait 把 SchemaField 对应到 datafusion 的 Field 结构：
有了这个基本的 schema 转换的功能，就可以构建我们的 nginx 日志处理结构及其功能了：
仅仅写了 80 行代码，就完成了 nginx 日志文件的读取、解析和查询功能，其中 50 行代码还是为了处理 schema 配置文件。是不是有点不敢相信自己的眼睛？
datafusion/arrow 也太强大了吧？这个简洁的背后，是 10w 行 arrow 代码和 1w 行 datafusion 代码的功劳。
再来写段代码调用它：
在这段代码里，我们从 stdin 中获取内容，把每一行输入都作为一个 SQL 语句传给 nginx_log.query，然后显示查询结果。
来测试一下：
是不是挺厉害？我们可以充分利用 SQL 的强大表现力，做各种复杂的查询。不光如此，还可以从一个包含了多个 sql 语句的文件中，一次性做多个查询。比如我创建了这样一个文件 analyze.sql：
那么，我可以这样获取结果：
## 小结
今天我们介绍了如何使用 Rust 处理存放在关系数据库中的结构化数据，以及存放在文件系统中的半结构化数据。
虽然在工作中，我们不太会使用 arrow/datafusion 去创建某个“下一代”的数据处理平台，但拥有了处理半结构化数据的能力，可以解决很多非常实际的问题。
比如每隔 10 分钟扫描 Nginx/CDN，以及应用服务器过去 10 分钟的日志，找到某些非正常的访问，然后把该用户/设备的访问切断一阵子。这样的特殊需求，一般的数据平台很难处理，需要我们自己撰写代码来实现。此时，arrow/datafusion 这样的工具就很方便。
### 思考题
- 请你自己阅读 diesel 或者 sea-orm 的文档，然后尝试把我们直接用 sqlx 构建的用户注册/登录的功能使用 diesel 或者 sea-orm 实现。
- datafusion 不但支持 csv，还支持 ndJSON/parquet/avro 等数据类型。如果你公司的生产环境下有这些类型的半结构化数据，可以尝试着阅读相关文档，使用 datafusion 来读取和查询它们。
感谢你的收听。恭喜你完成了第44次Rust学习，打卡之旅马上就要结束啦，我们下节课见。