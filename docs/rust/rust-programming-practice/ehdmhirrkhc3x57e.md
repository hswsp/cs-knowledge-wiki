# 37 | 阶段实操（5）：构建一个简单的KV server-网络安全

你好，我是陈天。
上一讲我们完成了KV server整个网络部分的构建。而安全是和网络密不可分的组成部分，在构建应用程序的时候，一定要把网络安全也考虑进去。当然，如果不考虑极致的性能，我们可以使用诸如 gRPC 这样的系统，在提供良好性能的基础上，它还通过 [TLS](https://en.wikipedia.org/wiki/Transport_Layer_Security) 保证了安全性。
那么，当我们的应用架构在 TCP 上时，如何使用 TLS 来保证客户端和服务器间的安全性呢？
## 生成 x509 证书
想要使用 TLS，我们首先需要 [x509 证书](https://en.wikipedia.org/wiki/X.509)。TLS 需要 x509 证书让客户端验证服务器是否是一个受信的服务器，甚至服务器验证客户端，确认对方是一个受信的客户端。
为了测试方便，我们要有能力生成自己的 CA 证书、服务端证书，甚至客户端证书。证书生成的细节今天就不详细介绍了，我之前做了一个叫 [certify](https://github.com/tyrchen/certify) 的库，可以用来生成各种证书。我们可以在 Cargo.toml 里加入这个库：
然后在根目录下创建 fixtures 目录存放证书，再创建 examples/gen_cert.rs 文件，添入如下代码：
这个代码很简单，它先生成了一个 CA 证书，然后再生成服务器和客户端证书，全部存入刚创建的 fixtures 目录下。你需要 `cargo run --examples gen_cert` 运行一下这个命令，待会我们会在测试中用到这些证书和密钥。
## 在 KV server 中使用 TLS
TLS 是目前最主要的应用层安全协议，被广泛用于保护架构在 TCP 之上的，比如 MySQL、HTTP 等各种协议。一个网络应用，即便是在内网使用，如果没有安全协议来保护，都是很危险的。
下图展示了客户端和服务器进行 TLS 握手的过程，来源[wikimedia](https://commons.wikimedia.org/wiki/File:Full_TLS_1.3_Handshake.svg)：-
![图片](https://cdn.nlark.com/yuque/0/2024/png/22382307/1730651116007-7634e4a3-aea9-44e0-8366-575c61e1c841.png)
对于 KV server 来说，使用 TLS 之后，整个协议的数据封装如下图所示：-
![图片](https://cdn.nlark.com/yuque/0/2024/jpeg/22382307/1730651113289-3f14e763-d50f-4779-8327-df6af7130168.jpeg)
所以今天要做的就是在上一讲的网络处理的基础上，添加 TLS 支持，使得 KV server 的客户端服务器之间的通讯被严格保护起来，确保最大程度的安全，免遭第三方的偷窥、篡改以及仿造。
好，接下来我们看看 TLS 怎么实现。
估计很多人一听 TLS 或者 SSL，就头皮发麻，因为之前跟 [openssl](https://www.openssl.org/) 打交道有过很多不好的经历。openssl 的代码库太庞杂，API 不友好，编译链接都很费劲。
不过，在 Rust 下使用 TLS 的体验还是很不错的，Rust 对 openssl 有很不错的[封装](https://github.com/sfackler/rust-openssl)，也有不依赖 openssl 用 Rust 撰写的 [rustls](https://github.com/rustls/rustls)。tokio 进一步提供了符合 tokio 生态圈的 [tls 支持](https://github.com/tokio-rs/tls)，有 openssl 版本和 rustls 版本可选。
我们今天就用 [tokio-rustls](https://github.com/tokio-rs/tls/tree/master/tokio-rustls) 来撰写 TLS 的支持。相信你在实现过程中可以看到，在应用程序中加入 TLS 协议来保护网络层，是多么轻松的一件事情。
先在 Cargo.toml 中添加 tokio-rustls：
然后创建 src/network/tls.rs，撰写如下代码（记得在 src/network/mod.rs 中引入这个文件哦）：
这个代码创建了两个数据结构 TlsServerAcceptor/TlsClientConnector。虽然它有 100 多行，但主要的工作其实就是**根据提供的证书，来生成 tokio-tls 需要的 ServerConfig/ClientConfig**。
因为 TLS 需要验证证书的 CA，所以还需要加载 CA 证书。虽然平时在做 Web 开发时，我们都只使用服务器证书，但其实 TLS 支持双向验证，服务器也可以验证客户端的证书是否是它认识的 CA 签发的。
处理完 config 后，这段代码的核心逻辑其实就是客户端的 connect() 方法和服务器的 accept() 方法，它们都接受一个满足 AsyncRead + AsyncWrite + Unpin + Send 的 stream。类似上一讲，我们不希望 TLS 代码只能接受 TcpStream，所以这里提供了一个泛型参数 S：
在使用 TlsConnector 或者 TlsAcceptor 处理完 connect/accept 后，我们得到了一个 TlsStream，它也满足 AsyncRead + AsyncWrite + Unpin + Send，后续的操作就可以在其上完成了。百来行代码就搞定了 TLS，是不是很轻松？
我们来顺着往下写段测试：
这段测试代码使用了 include_str! 宏，在编译期把文件加载成字符串放在 RODATA 段。我们测试了三种情况：标准的 TLS 连接、带有客户端证书的 TLS 连接，以及客户端提供了错的域名的情况。运行 `cargo test` ，所有测试都能通过。
## 让 KV client/server 支持 TLS
在 TLS 的测试都通过后，就可以添加 kvs和 kvc对 TLS 的支持了。
由于我们一路以来良好的接口设计，尤其是 ProstClientStream/ProstServerStream 都接受泛型参数，使得 TLS 的代码可以无缝嵌入。比如客户端：
仅仅需要把传给 ProstClientStream 的 stream，从 TcpStream 换成生成的 TlsStream，就无缝支持了 TLS。
我们看完整的代码，src/server.rs：
src/client.rs：
和上一讲的代码项目相比，更新后的客户端和服务器代码，各自仅仅多了一行，就把 TcpStream 封装成了 TlsStream。这就是使用 trait 做面向接口编程的巨大威力，系统的各个组件可以来自不同的 crates，但只要其接口一致（或者我们创建 adapter 使其接口一致），就可以无缝插入。
完成之后，打开一个命令行窗口，运行：`RUST_LOG=info cargo run --bin kvs --quiet`。然后在另一个命令行窗口，运行：`RUST_LOG=info cargo run --bin kvc --quiet`。此时，服务器和客户端都收到了彼此的请求和响应，并且处理正常。
现在，我们的 KV server 已经具备足够的安全性了！以后，等我们使用配置文件，就可以根据配置文件读取证书和私钥。这样可以在部署的时候，才从 vault 中获取私钥，既保证灵活性，又能保证系统自身的安全。
## 小结
网络安全是开发网络相关的应用程序中非常重要的一个环节。虽然 KV Server 这样的服务基本上会运行在云端受控的网络环境中，不会对 internet 提供服务，然而云端内部的安全性也不容忽视。你不希望数据在流动的过程中被篡改。
TLS 很好地解决了安全性的问题，可以保证整个传输过程中数据的机密性和完整性。如果使用客户端证书的话，还可以做一定程度的客户端合法性的验证。比如你可以在云端为所有有权访问 KV server 的客户端签发客户端证书，这样，只要客户端的私钥不泄露，就只有拥有证书的客户端才能访问 KV server。
不知道你现在有没有觉得，在 Rust 下使用 TLS 是非常方便的一件事情。并且，我们构建的 ProstServerStream/ProstClientStream，因为**有足够好的抽象，可以在 TcpStream 和 TlsStream 之间游刃有余地切换**。当你构建好相关的代码，只需要把 TcpStream 换成 TlsStream，KV server 就可以无缝切换到一个安全的网络协议栈。
### 思考题
- 目前我们的 kvc/kvs 只做了单向的验证，如果服务器要验证客户端的证书，该怎么做？如果你没有头绪，可以再仔细看看测试 TLS 的代码，然后改动 kvc/kvs 使得双向验证也能通过吧。
- 除了 TLS，另外一个被广泛使用的处理应用层安全的协议是 [noise protocol](https://noiseprotocol.org/)。你可以阅读我的[这篇文章](https://zhuanlan.zhihu.com/p/96944134)了解 noise protocol。Rust 下有 [snow](https://github.com/mcginty/snow) 这个很优秀的库处理 noise protocol。对于有余力的同学，你们可以看看它的文档，尝试着写段类似 [tls.rs](http://tls.rs/) 的代码，让我们的 kvs/kvc 可以使用 noise protocol。