---
title: "基于 UDP 的传输协议——QUIC"
description: "QUIC 的设计动机、关键特性与与 TCP/HTTP 的关系。"
---

QUIC协议是一个新的通讯协议，基于 UDP 的传输协议并希望最终取代所有基于TCP的HTTP请求。熟悉 UDP 的人都应该清楚为什么要使用 QUIC。UDP 是的特点是不可靠、数据包经常丢失、重新排序、重复等等。UDP 不包括任何更高级别协议（如 HTTP）严格要求的 TCP 的可靠性和顺序保证，这就是 QUIC 的用武之地。



本文简单介绍一下什么是 QUIC ，并NodeJs实现一个简单的通讯。



# QUIC 简介


先回顾一下UDP，UDP（用户数据报协议）是 ISO 参考模型中一种无连接的传输层协议，提供面向事务的简单不可靠信息传送服务。 UDP 协议基本上是 IP 协议与上层协议的接口。



而 QUIC 协议是在 UDP 之上定义了一个层，该层将错误处理、可靠性、流控制和内置安全性（通过TLS 1.3）引入UDP。实际上，它在UDP之上重新实现了大部分TCP的功能，但有一个关键区别：与TCP不同的是，它仍然可以不按顺序传输数据包。



![](https://images.spumn.eu.cc/cs-knowledge-wiki/csapp/network/udp/721915cea7c1-1657005414490-bb025057-0cbe-4f09-8b89-83a547cc8548.gif)



QUIC 通过在加密信封内重新实现基本传输服务来解决这个问题，使用 UDP 来跨越互联网。谷歌八年前首次宣布推出谷歌 QUIC ，在谷歌浏览器和谷歌服务之间使用它。这使他们能够独立于操作系统或操作系统更新计划进行改进。



Google QUIC 为 Chrome 提供了许多性能优势，其他公司也开始为该协议做出贡献。



# QUIC 特点


## 无队头阻塞


QUIC 连接上的多个 Stream 之间并没有依赖，都是独立的，也不会有底层协议限制，某个流发生丢包了，只会影响该流，其他流不受影响。而什么是对头阻塞，可以参阅《[TCP对头阻塞](https://link.zhihu.com/?target=https%3A//hungryturbo.com/HTTP3-explained/quic/%E4%B8%BA%E4%BB%80%E4%B9%88%E9%9C%80%E8%A6%81QUIC.html%23tcp%E9%98%9F%E5%A4%B4%E9%98%BB%E5%A1%9E)》



## 灵活性、安全性和减少延迟


QUIC 引入了许多其他重要功能：



+ **QUIC 连接独立于网络拓扑运行**：一旦建立了 QUIC 连接，源和目标 IP 地址和端口都可以更改，而无需重新建立连接。这在从一种类型的网络切换到另一种类型的移动设备（例如 LTE 到 WiFi）上变得特别有用。
+ **QUIC 连接是安全和加密的**：TLS 1.3 支持直接融入到协议中，所有 QUIC 流量都经过加密。
+ **QUIC 为 UDP 添加了关键的流量控制和错误处理**，并包含重要的安全机制以防止一系列拒绝服务攻击。
+ **QUIC 添加了对零往返 HTTP 请求的支持**：也就是说，与 HTTP over TLS over TCP 不同，它需要在客户端和服务器之间进行多次数据交换以建立 TLS 会话，然后才能传输任何 HTTP 请求数据，QUIC 允许 HTTP 请求标头作为 TLS 握手的一部分发送。正在建立 QUIC 连接，显着减少新连接的初始延迟。



![](https://images.spumn.eu.cc/cs-knowledge-wiki/csapp/network/udp/60697846b02d-v2-9121cf1c3ad35631ee05d74b53fd2b0b_1440w.jpg)



## 适用性和可管理性


加密传输协议对工程师选择传输协议和网络运营商监视活动都有影响。



**QUIC 传输协议的适用性** 描述了可能希望使用 QUIC 作为传输层的应用程序协议的注意事项。QUIC 的特性在一些有趣和微妙的方面与 TCP 的特性不同，例如握手完成之前数据的可用性，或者多个同时流的可用性。



**QUIC 传输协议的可管理性** 描述了加密传输层对网络监控和管理的影响。许多网络假定能够检查 TCP 的状态以发现网络问题（性能差、丢包率高）或滥用流量（数据泄露、攻击）的迹象。



## 浏览器支持


六年前，谷歌将 QUIC 引入 IETF 以开始标准流程，IETF 的贡献者表示有兴趣从他们的实验协议开始开发一种新的传输，就有了专有版本通常称为“Google QUIC”或“gQUIC”。



IETF 在 2016 年成立了一个 QUIC 工作组，采用 Google 的特定于 Web 的实现并将其调整为通用传输协议。就这样慢慢就有了 `HTTP/3` ，它使用 `IETF QUIC` 作为传输。



所以在考虑浏览器支持的时候，就是以 HTTP3的支持为标准：



![](https://images.spumn.eu.cc/cs-knowledge-wiki/csapp/network/udp/cf5687d87def-v2-5524910bbd3dd0ff984e1ab38b9357fd_1440w.jpg)



# QUIC 实现


在实现新的 QUIC 支持的同时，需要使用一个新的顶级内置 `quic`模块来公开 API，不过需要[自行编译](https://link.zhihu.com/?target=https%3A//github.com/nodejs/quic.git)，为避免对自身开发环境的影响，建议使用Docker ，如有兴趣可以查看项目 [docker-nodejs](https://link.zhihu.com/?target=https%3A//github.com/QuintionTang/docker-nodejs/tree/quic) 里面有完整的代码及Docker 运行方式。



`quic` 模块公开了一个 `createSocket` 函数，此函数是可以创建可用作 QUIC 服务器或客户端的 `QuicSocket` 对象实例。



下面来创建服务端，如下：



```java
const { createQuicSocket } = require("net");
const { readFileSync } = require("fs");

const port = process.env.NODE_PORT || 3005; // 定义HTTP默认端口或者从NODE_PORT环境变量获取
const key = readFileSync("./ssl_certs/server.key");
const cert = readFileSync("./ssl_certs/server.crt");
const ca = readFileSync("./ssl_certs/server.csr");
const servername = "localhost";
const alpn = "hello";
// 创建QUIC UDP IPv4套接字绑定到本地IP端口3005
const server = createQuicSocket({ endpoint: { port } });

// 密钥和证书来保护新连接，使用虚拟的hello应用协议。
server.listen({ key, cert, alpn });

server.on("session", (session) => {
    session.on("stream", (stream) => {
        stream.pipe(stream);
    });
});

server.on("listening", () => {
    console.info(`listening on ${port}...`);
    console.info("input content!");
});
```



接下来创建客户端，这里在同一个文件中模拟客户端请求，如下：



```java
const socket = createQuicSocket({
    client: {
        key,
        cert,
        ca,
        requestCert: true,
        alpn,
        servername,
    },
});

const req = socket.connect({
    address: servername,
    port,
});
req.on("secure", () => {
    const stream = req.openStream();
    // stdin -> stream
    process.stdin.pipe(stream);
    stream.on("data", (chunk) =>
        console.success("client(on-secure): ", chunk.toString())
    );
    stream.on("end", () => console.info("client(on-secure): end"));
    stream.on("close", () => {
        console.warn("stream is closed!");
        socket.close();
    });
    stream.on("error", (err) => console.error(err));
});
```



如果本地nodejs版本支持quic，那么可以直接启动：



```bash
npm run start
```



如果不支持，建议从 Dokcer 进行启动，如下：



```java
docker run -it --rm  --name quichello  -p 3005:3005  -e NODE_ENV=development  -v $PWD:/data/node/app --entrypoint '/bin/sh'  node-quic  -c 'npm install && npm run start
```



运行效果如下：



![](https://images.spumn.eu.cc/cs-knowledge-wiki/csapp/network/udp/41d4882f9fec-v2-59c7d613cd1db51e0950c5e0ad34ba8a_1440w.jpg)

