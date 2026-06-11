---
title: Brief Introduction To Spring Cloud
description: "spring-cloud-intro"
date: 2022-09-05
---

提起微服务，不得不提 Spring Cloud 全家桶系列，Spring Cloud 是一个服务治理平台，是若干个框架的集合（A lightweight event-driven **microservices** framework），提供了全套的分布式系统解决方案。包含了：服务注册与发现、配置中心、服务网关、智能路由、负载均衡、断路器、监控跟踪、分布式消息队列等等。

Spring Cloud provides tools for developers to quickly build some of the common patterns in distributed systems (e.g. configuration management, service discovery, circuit breakers, intelligent routing, micro-proxy, control bus, one-time tokens, global locks, leadership election, distributed sessions, cluster state). 

Coordination of distributed systems leads to boiler plate patterns, and using Spring Cloud developers can quickly stand up services and applications that implement those patterns. They will work well in any distributed environment, including the developer’s own laptop, bare metal data centres, and managed platforms such as Cloud Foundry.

boiler plate patterns 参考了 boilerplate code，就是一些代码量很少，可以拿过来放到系统中直接使用的样板代码。我认为 boiler plate patterns 可以白话地理解为套路模式。

分布式系统间的协作都是有套路的，开发者使用 Spring Cloud 就可以快速地构建包括这些套路的服务和应用。

Spring Cloud 通过 Spring Boot 风格的封装，屏蔽掉了复杂的配置和实现原理，最终给开发者留出了一套简单易懂、容易部署的分布式系统开发工具包。开发者可以快速的启动服务或构建应用、同时能够快速和云平台资源进行对接。微服务是可以独立部署、水平扩展、独立访问（或者有独立的数据库）的服务单元，Spring Cloud 就是这些微服务的大管家，采用了微服务这种架构之后，项目的数量会非常多，Spring Cloud 做为大管家需要管理好这些微服务，自然需要很多小弟来帮忙。

# 子项目

Spring Cloud 包含很多子项目，我们重点围绕 Netflix 和 Alibaba 两个标准实现给大家介绍：

![img](https://pic3.zhimg.com/80/v2-db96197b4c11df192e401f55a4e96782_1440w.webp)



## Spring Cloud Netflix 第一代



![img](https://pic4.zhimg.com/80/v2-403fe073e211fa0d25bec05efc1f9367_1440w.webp)



> Netflix是一家美国公司，在美国、加拿大提供互联网随选流媒体播放，定制DVD、蓝光光碟在线出租业务。该公司成立于1997年，总部位于加利福尼亚州洛斯盖图，1999年开始订阅服务。2009年，该公司可提供多达10万部DVD电影，并有1千万的订户。2007年2月25日，Netflix宣布已经售出第10亿份DVD。HIS一份报告中表示，2011年Netflix网络电影销量占据美国用户在线电影总销量的45%。

针对多种 Netflix 组件提供的开发工具包，其中包括 Eureka、Ribbon、Feign、Hystrix、Zuul、Archaius 等。

- `Netflix Eureka`：一个基于 Rest 服务的服务治理组件，包括服务注册中心、服务注册与服务发现机制的实现，实现了云端负载均衡和中间层服务器的故障转移。
- `Netflix Ribbon`：客户端负载均衡的服务调用组件。
- `Netflix Hystrix`：**容错管理工具**，实现断路器模式，通过控制服务的节点，从而对延迟和故障提供更强大的容错能力。
- `Netflix Feign`：基于 Ribbon 和 Hystrix 的**声明式服务调用组件**。
- `Netflix Zuul`：微服务网关，提供动态路由，访问过滤等服务。
- `Netflix Archaius`：配置管理 API，包含一系列配置管理 API，提供动态类型化属性、线程安全配置操作、轮询框架、回调机制等功能。

## Spring Cloud Alibaba 第二代



![img](https://pic1.zhimg.com/80/v2-f3e12f5bb438a71e2f7a1bdba3b61e90_1440w.webp)



同 Spring Cloud 一样，Spring Cloud Alibaba 也是一套微服务解决方案。Spring Cloud Alibaba 致力于提供微服务开发的一站式解决方案。此项目包含开发分布式应用微服务的必需组件，方便开发者通过 Spring Cloud 编程模型轻松使用这些组件来开发分布式应用服务。

依托 Spring Cloud Alibaba，只需要添加一些注解和少量配置，就可以将 Spring Cloud 应用接入阿里微服务解决方案，通过阿里中间件来迅速搭建分布式应用系统。

这幅图是 Spring Cloud Alibaba 系列组件，其中包含了阿里开源组件，阿里云商业化组件，以及集成 Spring Cloud 组件。



![img](https://pic3.zhimg.com/80/v2-648400ab6106da89560fb26845f4deba_1440w.webp)



**阿里开源组件**

- `Nacos`：阿里巴巴开源产品，一个更易于构建云原生应用的**动态服务发现、配置管理和服务管理**平台。Nacos (official site: [nacos.io](https://nacos.io/)) is an easy-to-use platform designed for **dynamic service discovery** and configuration and service management. It helps you to build cloud native applications and microservices platform easily.
- `Sentinel`：面向分布式服务架构的轻量级流量控制产品，把流量作为切入点，从**流量控制、熔断降级、系统负载**保护等多个维度保护服务的稳定性。
- `RocketMQ`：一款开源的分布式消息系统，基于高可用分布式集群技术，提供低延时的、高可靠的消息发布与订阅服务。
- `Dubbo`：Apache Dubbo™ 是一款高性能 Java RPC 框架，用于实现服务通信。
- `Seata`：阿里巴巴开源产品，一个易于使用的高性能微服务分布式事务解决方案。

**阿里商业化组件**

- `Alibaba Cloud ACM`：一款在分布式架构环境中对应用配置进行集中管理和推送的应用配置中心产品。
- `Alibaba Cloud OSS`：阿里云对象存储服务（Object Storage Service，简称 OSS），是阿里云提供的海量、安全、低成本、高可靠的云存储服务。您可以在任何应用、任何时间、任何地点存储和访问任意类型的数据。
- `Alibaba Cloud SchedulerX`：阿里中间件团队开发的一款分布式任务调度产品，提供秒级、精准、高可靠、高可用的定时（基于 Cron 表达式）任务调度服务。
- `Alibaba Cloud SMS`：覆盖全球的短信服务，友好、高效、智能的互联化通讯能力，帮助企业迅速搭建客户触达通道。

作为 Spring Cloud 体系下的新实现，Spring Cloud Alibaba 跟官方的组件或其它的第三方实现如 Netflix，Consul，Zookeeper 等对比，具备了更多的功能：



![img](https://pic1.zhimg.com/80/v2-558276887d809f32da1f81fc43a8b91c_1440w.webp)



# 常用组件

- `Spring Cloud Netflix Eureka`：服务注册中心。
- `Spring Cloud Zookeeper`：服务注册中心。
- `Spring Cloud Consul`：服务注册和配置管理中心。
- `Spring Cloud Netflix Ribbon`：**客户端负载均衡**。
- `Spring Cloud Netflix Hystrix`：服务容错保护。
- `Spring Cloud Netflix Feign`：声明式服务调用。
- `Spring Cloud OpenFeign(可替代 Feign)`：OpenFeign 是 Spring Cloud 在 Feign 的基础上支持了 Spring MVC 的注解，如 `@RequesMapping`等等。OpenFeign 的 `@FeignClient` 可以解析 SpringMVC 的 `@RequestMapping` 注解下的接口，并通过动态代理的方式产生实现类，实现类中做负载均衡并调用其他服务。
- `Spring Cloud Netflix Zuul`：API 网关服务，过滤、安全、监控、限流、路由。
- `Spring Cloud Gateway(可替代 Zuul)`：Spring Cloud Gateway 是 Spring 官方基于 Spring 5.0，Spring Boot 2.0 和 Project Reactor 等技术开发的网关，Spring Cloud Gateway 旨在为微服务架构提供一种简单而有效的统一的 API 路由管理方式。Spring Cloud Gateway 作为 Spring Cloud 生态系中的网关，目标是替代 Netflix Zuul，其不仅提供统一的路由方式，并且基于 Filter 链的方式提供了网关基本的功能，例如：安全，监控/埋点，和限流等。
- `Spring Cloud Security`：安全认证。
- `Spring Cloud Config`：分布式配置中心。配置管理工具，支持使用 Git 存储配置内容，支持应用配置的外部化存储，支持客户端配置信息刷新、加解密配置内容等。
- `Spring Cloud Bus`：事件、消息总线，用于在集群（例如，配置变化事件）中传播状态变化，可与 Spring Cloud Config 联合实现热部署。
- `Spring Cloud Stream`：消息驱动微服务。
- `Spring Cloud Sleuth`：分布式服务跟踪。
- `Spring Cloud Alibaba Nacos`：阿里巴巴开源产品，一个更易于构建云原生应用的动态服务发现、配置管理和服务管理平台。
- `Spring Cloud Alibaba Sentinel`：面向分布式服务架构的轻量级流量控制产品，把流量作为切入点，从流量控制、熔断降级、系统负载保护等多个维度保护服务的稳定性。
- `Spring Cloud Alibaba RocketMQ`：一款开源的分布式消息系统，基于高可用分布式集群技术，提供低延时的、高可靠的消息发布与订阅服务。
- `Spring Cloud Alibaba Dubbo`：Apache Dubbo™ 是一款高性能 Java RPC 框架，用于实现服务通信。
- `Spring Cloud Alibaba Seata`：阿里巴巴开源产品，一个易于使用的高性能微服务分布式事务解决方案。

# 总结

![img](https://pic2.zhimg.com/80/v2-a786c069f918246e386b3bbd657e1905_1440w.webp)

> 虽然 Eureka，Hystrix 等不再继续开发或维护，但是目前来说不影响使用，不管怎么说感谢开源，向 Netflix 公司的开源致敬。

# 版本说明



![img](https://pic3.zhimg.com/80/v2-ba7d3020c302034419cf31d3b9bf7872_1440w.webp)



## 为什么 Spring Cloud 版本用的是单词而不是数字？

这样设计的目的是为了更好的管理每个 Spring Cloud 的子项目的清单。避免总版本号与子项目的版本号混淆。

> 例如：Spring Cloud 2.2.0.RELEASE 的 Spring Cloud Netflix 2.2.2.RELEASE 如果使用这种方式会让开发者混淆版本号。

## 定义规则

采用伦敦的地铁站名称来作为版本号的命名，根据首字母排序，字母顺序靠后的版本号越大。

**Spring 官方详细的版本查看接口：[https://start.spring.io/actuator/info](https://link.zhihu.com/?target=https%3A//start.spring.io/actuator/info)**

## 发布计划

![img](https://pic3.zhimg.com/80/v2-9ae319033005f32e05ecef772ea481a2_1440w.webp)

## 子项目版本说明

例如：**Spring Cloud Alibaba 2.1.0.RELEASE**

- 2：主版本号。当功能模块有较大更新或者整体架构发生变化时，主版本号会更新。
- 1：次版本号。次版本表示只是局部的一些变动。
- 0：修改版本号。一般是 bug 的修复或者是小的变动。
- RELEASE：希腊字母版本号。标注当前版本的软件处于哪个开发阶段。

## 希腊字母版本说明

- Base：设计阶段。只有相应的设计没有具体的功能实现。
- Alpha：软件的初级版本。存在较多的 bug。
- Bate：表示相对 Alpha 有了很大的进步，消除了严重的 bug，还存在一些潜在的 bug。
- Gamma：是 Beta 版做过一些修改，成为正式发布的候选版本（Release Candidate）
- Release：该版本表示最终版。
