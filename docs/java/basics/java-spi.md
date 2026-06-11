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

![img](https://images.spumn.eu.cc/blog/7c98ff6cf5cde424.png)

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

![img](https://images.spumn.eu.cc/blog/3fe26db93533cb66.png)

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

![img](https://images.spumn.eu.cc/blog/507b6b1648c08de7.png)

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

------

>  知识拓展： 其实，我们在Spring框架中，可以通过 `component-scan` 标签来对指定包路径进行扫描，只要扫到 Spring 制定的 `@Service`、`@Controller` 等注解，spring自动会把它注入[容器](https://cloud.tencent.com/product/tke?from=10680)。 
>
> 这就相当于spring制定了注解规范，我们按照这个注解规范开发相应的实现类或controller，spring并不需要感知我们是怎么实现的，他只需要根据注解规范和scan标签注入相应的bean，这正是 spi 理念的体现。 

# SPI 实现原理解析

首先，ServiceLoader实现了Iterable接口，所以它有迭代器的属性，这里主要都是实现了迭代器的hasNext和next方法。这里主要都是调用的lookupIterator的相应hasNext和next方法，lookupIterator是懒加载迭代器。

其次，LazyIterator中的hasNext方法，静态变量PREFIX就是”META-INF/services/”目录，这也就是为什么需要在classpath下的META-INF/services/目录里创建一个以服务接口命名的文件。

最后，通过反射方法`Class.forName()`加载类对象，并用newInstance方法将类实例化，并把实例化后的类缓存到providers对象中，(`LinkedHashMap<String,S>`类型） 然后返回实例对象。

------

`java.util.ServiceLoader.java` 源代码如下：

```javascript
package java.util;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URL;
import java.security.AccessController;
import java.security.AccessControlContext;
import java.security.PrivilegedAction;
import java.util.ArrayList;
import java.util.Enumeration;
import java.util.Iterator;
import java.util.List;
import java.util.NoSuchElementException;

// ServiceLoader实现了Iterable接口，可以遍历所有的服务实现者
public final class ServiceLoader<S> implements Iterable<S>
{

    // 约定的配置文件的存放目录
    private static final String PREFIX = "META-INF/services/";

    // The class or interface representing the service being loaded
    private final Class<S> service;

    // The class loader used to locate, load, and instantiate providers
    private final ClassLoader loader;

    // The access control context taken when the ServiceLoader is created
    private final AccessControlContext acc;

    // Cached providers, in instantiation order
    private LinkedHashMap<String,S> providers = new LinkedHashMap<>();

    // The current lazy-lookup iterator
    private LazyIterator lookupIterator;

    /**
     * Clear this loader's provider cache so that all providers will be
     * reloaded.
     *
     * <p> After invoking this method, subsequent invocations of the {@link
     * #iterator() iterator} method will lazily look up and instantiate
     * providers from scratch, just as is done by a newly-created loader.
     *
     * <p> This method is intended for use in situations in which new providers
     * can be installed into a running Java virtual machine.
     */
    public void reload() {
        providers.clear();
        lookupIterator = new LazyIterator(service, loader);
    }

    private ServiceLoader(Class<S> svc, ClassLoader cl) {
        service = Objects.requireNonNull(svc, "Service interface cannot be null");
        loader = (cl == null) ? ClassLoader.getSystemClassLoader() : cl;
        acc = (System.getSecurityManager() != null) ? AccessController.getContext() : null;
        reload();
    }

    private static void fail(Class<?> service, String msg, Throwable cause)
        throws ServiceConfigurationError
    {
        throw new ServiceConfigurationError(service.getName() + ": " + msg,
                                            cause);
    }

    private static void fail(Class<?> service, String msg)
        throws ServiceConfigurationError
    {
        throw new ServiceConfigurationError(service.getName() + ": " + msg);
    }

    private static void fail(Class<?> service, URL u, int line, String msg)
        throws ServiceConfigurationError
    {
        fail(service, u + ":" + line + ": " + msg);
    }

    // Parse a single line from the given configuration file, adding the name
    // on the line to the names list.
    //
    private int parseLine(Class<?> service, URL u, BufferedReader r, int lc,
                          List<String> names)
        throws IOException, ServiceConfigurationError
    {
        String ln = r.readLine();
        if (ln == null) {
            return -1;
        }
        int ci = ln.indexOf('#');
        if (ci >= 0) ln = ln.substring(0, ci);
        ln = ln.trim();
        int n = ln.length();
        if (n != 0) {
            if ((ln.indexOf(' ') >= 0) || (ln.indexOf('\t') >= 0))
                fail(service, u, lc, "Illegal configuration-file syntax");
            int cp = ln.codePointAt(0);
            if (!Character.isJavaIdentifierStart(cp))
                fail(service, u, lc, "Illegal provider-class name: " + ln);
            for (int i = Character.charCount(cp); i < n; i += Character.charCount(cp)) {
                cp = ln.codePointAt(i);
                if (!Character.isJavaIdentifierPart(cp) && (cp != '.'))
                    fail(service, u, lc, "Illegal provider-class name: " + ln);
            }
            if (!providers.containsKey(ln) && !names.contains(ln))
                names.add(ln);
        }
        return lc + 1;
    }

    // Parse the content of the given URL as a provider-configuration file.
    //
    // @param  service
    //         The service type for which providers are being sought;
    //         used to construct error detail strings
    //
    // @param  u
    //         The URL naming the configuration file to be parsed
    //
    // @return A (possibly empty) iterator that will yield the provider-class
    //         names in the given configuration file that are not yet members
    //         of the returned set
    //
    // @throws ServiceConfigurationError
    //         If an I/O error occurs while reading from the given URL, or
    //         if a configuration-file format error is detected
    //
    private Iterator<String> parse(Class<?> service, URL u)
        throws ServiceConfigurationError
    {
        InputStream in = null;
        BufferedReader r = null;
        ArrayList<String> names = new ArrayList<>();
        try {
            in = u.openStream();
            r = new BufferedReader(new InputStreamReader(in, "utf-8"));
            int lc = 1;
            while ((lc = parseLine(service, u, r, lc, names)) >= 0);
        } catch (IOException x) {
            fail(service, "Error reading configuration file", x);
        } finally {
            try {
                if (r != null) r.close();
                if (in != null) in.close();
            } catch (IOException y) {
                fail(service, "Error closing configuration file", y);
            }
        }
        return names.iterator();
    }

    // Private inner class implementing fully-lazy provider lookup
    //
    private class LazyIterator
        implements Iterator<S>
    {

        Class<S> service;
        ClassLoader loader;
        Enumeration<URL> configs = null;
        Iterator<String> pending = null;
        String nextName = null;

        private LazyIterator(Class<S> service, ClassLoader loader) {
            this.service = service;
            this.loader = loader;
        }

        private boolean hasNextService() {
            if (nextName != null) {
                return true;
            }
            if (configs == null) {
                try {
                    String fullName = PREFIX + service.getName();
                    if (loader == null)
                        configs = ClassLoader.getSystemResources(fullName);
                    else
                        configs = loader.getResources(fullName);
                } catch (IOException x) {
                    fail(service, "Error locating configuration files", x);
                }
            }
            while ((pending == null) || !pending.hasNext()) {
                if (!configs.hasMoreElements()) {
                    return false;
                }
                pending = parse(service, configs.nextElement());
            }
            nextName = pending.next();
            return true;
        }

        private S nextService() {
            if (!hasNextService())
                throw new NoSuchElementException();
            String cn = nextName;
            nextName = null;
            Class<?> c = null;
            try {
                c = Class.forName(cn, false, loader);
            } catch (ClassNotFoundException x) {
                fail(service,
                     "Provider " + cn + " not found");
            }
            if (!service.isAssignableFrom(c)) {
                fail(service,
                     "Provider " + cn  + " not a subtype");
            }
            try {
                // 用反射机制，创建接口实现对象
                S p = service.cast(c.newInstance());
               // 放进 ServiceLoader的providers容器里面
                providers.put(cn, p);
                return p;
            } catch (Throwable x) {
                fail(service,
                     "Provider " + cn + " could not be instantiated",
                     x);
            }
            throw new Error();          // This cannot happen
        }

        public boolean hasNext() {
            if (acc == null) {
                return hasNextService();
            } else {
                PrivilegedAction<Boolean> action = new PrivilegedAction<Boolean>() {
                    public Boolean run() { return hasNextService(); }
                };
                return AccessController.doPrivileged(action, acc);
            }
        }

        public S next() {
            if (acc == null) {
                return nextService();
            } else {
                PrivilegedAction<S> action = new PrivilegedAction<S>() {
                    public S run() { return nextService(); }
                };
                return AccessController.doPrivileged(action, acc);
            }
        }

        public void remove() {
            throw new UnsupportedOperationException();
        }

    }

    /**
     * Lazily loads the available providers of this loader's service.
     *
     * <p> The iterator returned by this method first yields all of the
     * elements of the provider cache, in instantiation order.  It then lazily
     * loads and instantiates any remaining providers, adding each one to the
     * cache in turn.
     *
     * <p> To achieve laziness the actual work of parsing the available
     * provider-configuration files and instantiating providers must be done by
     * the iterator itself.  Its {@link java.util.Iterator#hasNext hasNext} and
     * {@link java.util.Iterator#next next} methods can therefore throw a
     * {@link ServiceConfigurationError} if a provider-configuration file
     * violates the specified format, or if it names a provider class that
     * cannot be found and instantiated, or if the result of instantiating the
     * class is not assignable to the service type, or if any other kind of
     * exception or error is thrown as the next provider is located and
     * instantiated.  To write robust code it is only necessary to catch {@link
     * ServiceConfigurationError} when using a service iterator.
     *
     * <p> If such an error is thrown then subsequent invocations of the
     * iterator will make a best effort to locate and instantiate the next
     * available provider, but in general such recovery cannot be guaranteed.
     *
     * <blockquote style="font-size: smaller; line-height: 1.2"><span
     * style="padding-right: 1em; font-weight: bold">Design Note</span>
     * Throwing an error in these cases may seem extreme.  The rationale for
     * this behavior is that a malformed provider-configuration file, like a
     * malformed class file, indicates a serious problem with the way the Java
     * virtual machine is configured or is being used.  As such it is
     * preferable to throw an error rather than try to recover or, even worse,
     * fail silently.</blockquote>
     *
     * <p> The iterator returned by this method does not support removal.
     * Invoking its {@link java.util.Iterator#remove() remove} method will
     * cause an {@link UnsupportedOperationException} to be thrown.
     *
     * @implNote When adding providers to the cache, the {@link #iterator
     * Iterator} processes resources in the order that the {@link
     * java.lang.ClassLoader#getResources(java.lang.String)
     * ClassLoader.getResources(String)} method finds the service configuration
     * files.
     *
     * @return  An iterator that lazily loads providers for this loader's
     *          service
     */
    public Iterator<S> iterator() {
        return new Iterator<S>() {

            Iterator<Map.Entry<String,S>> knownProviders
                = providers.entrySet().iterator();

            public boolean hasNext() {
                if (knownProviders.hasNext())
                    return true;
                return lookupIterator.hasNext();
            }

            public S next() {
                if (knownProviders.hasNext())
                    return knownProviders.next().getValue();
                return lookupIterator.next();
            }

            public void remove() {
                throw new UnsupportedOperationException();
            }

        };
    }

    /**
     * Creates a new service loader for the given service type and class
     * loader.
     *
     * @param  <S> the class of the service type
     *
     * @param  service
     *         The interface or abstract class representing the service
     *
     * @param  loader
     *         The class loader to be used to load provider-configuration files
     *         and provider classes, or <tt>null</tt> if the system class
     *         loader (or, failing that, the bootstrap class loader) is to be
     *         used
     *
     * @return A new service loader
     */
    public static <S> ServiceLoader<S> load(Class<S> service,
                                            ClassLoader loader)
    {
        return new ServiceLoader<>(service, loader);
    }

    /**
     * Creates a new service loader for the given service type, using the
     * current thread's {@linkplain java.lang.Thread#getContextClassLoader
     * context class loader}.
     *
     * <p> An invocation of this convenience method of the form
     *
     * <blockquote><pre>
     * ServiceLoader.load(<i>service</i>)</pre></blockquote>
     *
     * is equivalent to
     *
     * <blockquote><pre>
     * ServiceLoader.load(<i>service</i>,
     *                    Thread.currentThread().getContextClassLoader())</pre></blockquote>
     *
     * @param  <S> the class of the service type
     *
     * @param  service
     *         The interface or abstract class representing the service
     *
     * @return A new service loader
     */
    public static <S> ServiceLoader<S> load(Class<S> service) {
        ClassLoader cl = Thread.currentThread().getContextClassLoader();
        return ServiceLoader.load(service, cl);
    }

    /**
     * Creates a new service loader for the given service type, using the
     * extension class loader.
     *
     * <p> This convenience method simply locates the extension class loader,
     * call it <tt><i>extClassLoader</i></tt>, and then returns
     *
     * <blockquote><pre>
     * ServiceLoader.load(<i>service</i>, <i>extClassLoader</i>)</pre></blockquote>
     *
     * <p> If the extension class loader cannot be found then the system class
     * loader is used; if there is no system class loader then the bootstrap
     * class loader is used.
     *
     * <p> This method is intended for use when only installed providers are
     * desired.  The resulting service will only find and load providers that
     * have been installed into the current Java virtual machine; providers on
     * the application's class path will be ignored.
     *
     * @param  <S> the class of the service type
     *
     * @param  service
     *         The interface or abstract class representing the service
     *
     * @return A new service loader
     */
    public static <S> ServiceLoader<S> loadInstalled(Class<S> service) {
        ClassLoader cl = ClassLoader.getSystemClassLoader();
        ClassLoader prev = null;
        while (cl != null) {
            prev = cl;
            cl = cl.getParent();
        }
        return ServiceLoader.load(service, prev);
    }

    /**
     * Returns a string describing this service.
     *
     * @return  A descriptive string
     */
    public String toString() {
        return "java.util.ServiceLoader[" + service.getName() + "]";
    }

}
```

# 参考资料

1. [https://www.cnblogs.com/jy107600/p/11464985.html](https://links.jianshu.com/go?to=https%3A%2F%2Fwww.cnblogs.com%2Fjy107600%2Fp%2F11464985.html) [http://blog.itpub.net/69912579/viewspace-2656555/](https://links.jianshu.com/go?to=http%3A%2F%2Fblog.itpub.net%2F69912579%2Fviewspace-2656555%2F) 
2. [https://segmentfault.com/a/1190000020422160](https://links.jianshu.com/go?to=https%3A%2F%2Fsegmentfault.com%2Fa%2F1190000020422160)
