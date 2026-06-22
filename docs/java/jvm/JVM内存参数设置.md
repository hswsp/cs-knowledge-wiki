# JVM内存参数设置

`JVM_XMX`, `JVM_XMS`, 和 `JVM_XMN` 是用于配置 Java 虚拟机 (JVM) 的不同内存参数：

1. `JVM_XMX`（-Xmx）: 这个参数用来设置 JVM 的最大堆内存大小。堆内存是 Java 程序用来存储对象的地方。`-Xmx` 参数后面可以跟一个数值和单位，例如 `-Xmx512m` 表示最大堆内存为 512MB。这个参数的设置可以根据应用程序的内存需求来调整，以确保应用程序不会因内存不足而崩溃。
2. `JVM_XMS`（-Xms）: 这个参数用来设置 JVM 的初始堆内存大小。与 `-Xmx` 不同，`-Xms` 指定了 JVM 启动时分配的初始堆大小。同样，它的后面可以跟一个数值和单位，例如 `-Xms256m` 表示初始堆内存为 256MB。设置初始堆内存大小可以帮助减少 JVM 启动时的内存分配开销。
3. `JVM_XMN`: 这个参数用来设置 JVM 的新生代（Young Generation）的最小堆大小。新生代是堆内存的一部分，主要用于存储新创建的对象。`-Xmn` 参数通常不需要手动设置，因为 JVM 会根据 `-Xmx` 和其他配置自动计算新生代的大小。然而，如果需要手动调整新生代的大小，可以使用 `-Xmn` 参数，后面可以跟一个数值和单位，例如 `-Xmn128m` 表示新生代最小堆内存为 128MB。

这些参数的合理配置对于 Java 应用程序的性能和稳定性非常重要，因此需要根据应用程序的需求和性能特性来进行调整。通常，建议将 `-Xmx` 和 `-Xms` 设置为相同的值，以避免 JVM 在运行时动态调整堆内存大小。而新生代的大小则可以根据应用程序的对象创建和回收模式进行调整。

# 查看当前虚拟机的配置

要查看当前虚拟机上所采用的上述三种 JVM 配置参数，可以使用 Java 命令行工具 `jcmd` 或者在运行时通过 Java 代码来获取这些信息。

1. 使用 `jcmd` 命令：

   在命令行中，可以使用 `jcmd` 命令来列出当前正在运行的 Java 进程的详细信息，包括 JVM 配置参数。以下是查看 JVM 配置参数的示例：

   ```Shell
   jcmd <PID> VM.flags
   ```

   其中 `<PID>` 是 Java 进程的进程 ID。这将列出包括堆内存的最大值 (`-Xmx` 参数)、初始堆内存大小 (`-Xms` 参数) 和新生代最小堆大小 (`-Xmn` 参数) 在内的 JVM 配置参数。
2. 使用 Java 代码：

   在 Java 代码中，可以使用 `ManagementFactory` 类的 `getRuntimeMXBean()` 方法来获取运行时的 JVM 配置参数。以下是一个示例代码：

   ```Java
   import java.lang.management.ManagementFactory;
   import java.lang.management.RuntimeMXBean;
   import java.util.List;

   public class JVMConfigInfo {
       public static void main(String[] args) {
           RuntimeMXBean runtimeMxBean = ManagementFactory.getRuntimeMXBean();
           List<String> jvmArgs = runtimeMxBean.getInputArguments();
           for (String arg : jvmArgs) {
               System.out.println(arg);
           }
       }
   }
   ```

   运行此代码将输出当前 JVM 使用的所有参数，包括 `-Xmx`、`-Xms` 和 `-Xmn`。

请注意，这两种方法都可以用来查看 JVM 配置参数，但 `jcmd` 命令通常更方便，特别是在生产环境中，因为它不需要修改应用程序代码并且可以在运行时动态查看。
