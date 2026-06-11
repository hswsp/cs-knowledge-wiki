---
title: Java SPI (Service Provider Interface) 机制详解
description: "Java SPI"
date: 2022-01-25
---

 本质：Java SPI 实际上是“基于接口的编程＋策略模式＋约定配置文件” 组合实现的动态加载机制，在JDK中提供了工具类：“`java.util.ServiceLoader`”来实现服务查找。

# 什么是SPI ？

SPI 全称：Service Provider Interface，是Java提供的一套用来被第三方实现或者扩展的接口，**它可以用来启用框架扩展和替换组件。**

面向的对象的设计里，我们一般推荐模块之间基于接口编程，模块之间不对实现类进行硬编码。一旦代码里涉及具体的实现类，就违反了可拔插的原则，如果需要替换一种实现，就需要修改代码。

为了实现在模块装配的时候不用在程序里动态指明，这就需要一种服务发现机制。java spi就是提供这样的一个机制：**为某个接口寻找服务实现的机制。这有点类似IOC的思想，将装配的控制权移到了程序之外。**

SPI的作用就是为被扩展的API寻找服务实现。

SPI（Service Provider Interface），是JDK内置的一种 服务提供发现机制，可以用来启用框架扩展和替换组件，主要是被框架的开发人员使用，比如java.sql.Driver接口，其他不同厂商可以针对同一接口做出不同的实现，MySQL和PostgreSQL都有不同的实现提供给用户，而Java的SPI机制可以为某个接口寻找服务实现。Java中SPI机制主要思想是将装配的控制权移到程序之外，在模块化设计中这个机制尤其重要，其核心思想就是 解耦。

SPI整体机制图如下：

![img](https://cdn.jsdelivr.net/gh/hswsp/IMAGE_HOST/img/spi1.png)

当服务的提供者提供了一种接口的实现之后，需要在classpath下的META-INF/services/目录里创建一个以服务接口命名的文件，这个文件里的内容就是这个接口的具体的实现类。当其他的程序需要这个服务的时候，就可以通过查找这个jar包（一般都是以jar包做依赖）的META-INF/services/中的配置文件，配置文件中有接口的具体实现类名，可以根据这个类名进行加载实例化，就可以使用该服务了。JDK中查找服务的实现的工具类是：`java.util.ServiceLoader`。

# SPI 的不足

1.不能按需加载，需要遍历所有的实现，并实例化，然后在循环中才能找到我们需要的实现。如果不想用某些实现类，或者某些类实例化很耗时，它也被载入并实例化了，这就造成了浪费。

2.获取某个实现类的方式不够灵活，只能通过 Iterator 形式获取，不能根据某个参数来获取对应的实现类。（Spring 的BeanFactory，ApplicationContext 就要高级一些了。）

3.多个并发多线程使用 ServiceLoader 类的实例是不安全的。

# API 与 SPI

## SPI与API区别：

API是调用并用于实现目标的类、接口、方法等的描述；

SPI是扩展和实现以实现目标的类、接口、方法等的描述；

换句话说，API 为操作提供特定的类、方法，SPI 通过操作来符合特定的类、方法。

>  参考： [https://stackoverflow.com/questions/2954372/difference-between-spi-and-api?answertab=votes#tab-top](https://links.jianshu.com/go?to=https%3A%2F%2Fstackoverflow.com%2Fquestions%2F2954372%2Fdifference-between-spi-and-api%3Fanswertab%3Dvotes%23tab-top) 

## SPI和API的使用场景解析：

- API （Application Programming Interface）在大多数情况下，都是实现方制定接口并完成对接口的实现，调用方仅仅依赖接口调用，且无权选择不同实现。 从使用人员上来说，API 直接被应用开发人员使用。
- SPI （Service Provider Interface）是调用方来制定接口规范，提供给外部来实现，调用方在调用时则选择自己需要的外部实现。  从使用人员上来说，SPI 被框架扩展人员使用。

# SPI 应用场景

SPI扩展机制应用场景有很多，比如Common-Logging，JDBC，Dubbo等等。

### SPI流程：

有关组织和公式定义接口标准

第三方提供具体实现: 实现具体方法, 配置 META-INF/services/${interface_name} 文件

### 开发者使用

比如JDBC场景下：

首先在Java中定义了接口java.sql.Driver，并没有具体的实现，具体的实现都是由不同厂商提供。

在MySQL的jar包mysql-connector-java-6.0.6.jar中，可以找到META-INF/services目录，该目录下会有一个名字为java.sql.Driver的文件，文件内容是com.mysql.cj.jdbc.Driver，这里面的内容就是针对Java中定义的接口的实现。

同样在PostgreSQL的jar包PostgreSQL-42.0.0.jar中，也可以找到同样的配置文件，文件内容是org.postgresql.Driver，这是PostgreSQL对Java的java.sql.Driver的实现。

# 项目案例

Java 工程目录：

![img](https://cdn.jsdelivr.net/gh/hswsp/IMAGE_HOST/img/spi2.png)

下面我们来简单实现一个 JDK 的SPI的简单实现。

## Java代码开发

首先第一步，定义一个接口：

Phone.java

```javascript
package com.light.sword;

/**
 * @author: Jack
 * 2021/1/31 上午1:44
 */
public interface Phone {
    String getSystemInfo();
}
```

这个接口分别有两个实现：

Huawei.java

```javascript
package com.light.sword;

/**
 * @author: Jack
 * 2021/1/31 上午1:48
 */
public class Huawei implements Phone {
    @Override
    public String getSystemInfo() {
        return "Hong Meng";
    }
}
```

IPhone.java

```javascript
package com.light.sword;

/**
 * @author: Jack
 * 2021/1/31 上午1:48
 */
public class IPhone implements Phone {
    @Override
    public String getSystemInfo() {
        return  "iOS";
    }
}
```

## 约定配置

新建 META-INF/services 目录

>  注意：这个META-INF/services 目录是写死的约定，在 `java.util.ServiceLoader` 源码实现中, java.util.ServiceLoader#PREFIX 可以看到这个目录的硬编码。 

然后需要在resources目录下新建 `META-INF/services` 目录，并且在这个目录下新建一个与上述接口的全限定名一致的文件:

com.light.sword.Phone (这是一个文件，是的，一切皆是文件。)

在这个文件中写入接口的实现类的全限定名（文件 com.light.sword.Phone 中写死的内容）：

```javascript
com.light.sword.Huawei
com.light.sword.IPhone
```

如下图所示：

![img](https://cdn.jsdelivr.net/gh/hswsp/IMAGE_HOST/img/spi3.png)

## 加载实现类并调用服务

这时，通过ServiceLoader 加载实现类并调用服务：

Main.java

```javascript
package com.light.sword;

import java.util.ServiceLoader;

public class Main {

    public static void main(String[] args) {
        ServiceLoader<Phone> phoneServiceLoader = ServiceLoader.load(Phone.class);
        phoneServiceLoader.forEach(provider -> {
            String systemInfo = provider.getSystemInfo();
            System.out.println(systemInfo);
        });
    }
}
```

输出如下：

```javascript
Hong Meng
iOS
```

工程源代码：[https://gitee.com/universsky/java-spi-demo](https://links.jianshu.com/go?to=https%3A%2F%2Fgitee.com%2Funiverssky%2Fjava-spi-demo)

这样一个简单的 Java SPI 的demo就完成了。可以看到其中最为核心的就是通过一系列的约定（其实，就是按照人家 `java.util.ServiceLoader`   的规范标准来）， 然后，通过ServiceLoader 这个类来加载具体的实现类，进而调用实现类的服务。
