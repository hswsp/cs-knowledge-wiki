---
title: CMake简单入门
description: "CMake 变量，引入头文件，链接库"
date: 2021-10-30
---

# 新建项目

新建项目t4，目录结构如下：

```bash
-src
	-main.c
	-CmakeLists.txt
-include
	-hello
		-hello.h
-thirdPatch
	-libhello.a
	-libhello.so
	-libhello.so.1
	-libhello.so.1.2
-CmakeLists.txt
```

该程序引入了自建的hello.h程序库包含了函数`func()`。main.c的内容如下所示：

```c
//main.c
#include <hello.h>
int main()
{
    func();
    return 0 ;
}
```

## CMake变量

### 一般变量

#### CMake变量引用的方式

使用`${}`进行变量的引用。例如：

```bash
${PROJECT_NAME} #返回项目名称
```

在 IF 等语句中,是直接使用变量名而不通过`${}`取值。

#### cmake自定义变量的方式

cmake变量定义的方式有两种：隐式定义和显式定义。

*隐式定义*

前面举了一个隐式定义的例子，就是`PROJECT`指令，他会隐式的定义`_BINARY_DIR`和`_SOURCE_DIR`两个变量。

*显示定义*

显式定义的例子我们前面也提到了,使用 `SET` 指令,就可以构建一个自定义变量了。比如:

```scss
SET(HELLO_SRC main.c)
```

就可以通过`${HELLO_SRC}`来引用这个自定义变量(main.c)了.

### 环境变量

#### 调用环境变量的方式

使用 `$ENV{NAME} `指令就可以调用系统的环境变量了。比如

```bash
MESSAGE(STATUS “HOME dir: $ENV{HOME}”)
```

#### 设置环境变量的方式

```scss
SET(ENV{ 变量名 } 值 )
```

###  CMake常用变量

使用`cmake --help-variable-list`可以查看cmake中默认变量。

| 变量名                            |                         变量说明                          |
| --------------------------------- | :-------------------------------------------------------: |
| PROJECT_NAME                      |             返回通过PROJECT指令定义的项目名称             |
| PROJECT_SOURCE_DIR                |          CMake源码地址，即cmake命令后指定的地址           |
| PROJECT_BINARY_DIR                | 运行cmake命令的目录,通常是PROJECT_SOURCE_DIR下的build目录 |
| CMAKE_MODULE_PATH                 |               定义自己的cmake模块所在的路径               |
| CMAKE_CURRENT_SOURCE_DIR          |            当前处理的CMakeLists.txt所在的路径             |
| CMAKE_CURRENT_LIST_DIR            |                      当前文件夹路径                       |
| CMAKE_CURRENT_LIST_FILE           |        输出调用这个变量的CMakeLists.txt的完整路径         |
| CMAKE_CURRENT_LIST_LINE           |                   输出这个变量所在的行                    |
| CMAKE_RUNTIME_OUTPUT_DIRECTORY    |                    生成可执行文件路径                     |
| CMAKE_LIBRARY_OUTPUT_DIRECTORY    |                    生成库的文件夹路径                     |
| CMAKE_BUILD_TYPE                  |     指定基于make的产生器的构建类型（Release，Debug）      |
| CMAKE_C_FLAGS                     |     *.C文件编译选项，如 *-std=c99 -O3 -march=native*      |
| CMAKE_CXX_FLAGS                   |   *.CPP文件编译选项，如 *-std=c++11 -O3 -march=native*    |
| CMAKE_CURRENT_BINARY_DIR          |                      target编译目录                       |
| CMAKE_INCLUDE_PATH                |                   环境变量,非cmake变量                    |
| CMAKE_LIBRARY_PATH                |                         环境变量                          |
| CMAKE_STATIC_LIBRARY_PREFIX       |               静态库前缀, Linux下默认为lib                |
| CMAKE_STATIC_LIBRARY_SUFFIX       |                静态库后缀，Linux下默认为.a                |
| CMAKE_SHARED_LIBRARY_PREFIX       |               动态库前缀，Linux下默认为lib                |
| CMAKE_SHARED_LIBRARY_SUFFIX       |               动态库后缀，Linux下默认为.so                |
| BUILD_SHARED_LIBS                 |           如果为ON，则add_library默认创建共享库           |
| CMAKE_INSTALL_PREFIX              |              配置安装路径，默认为/usr/local               |
| CMAKE_ABSOLUTE_DESTINATION_FILES  |        安装文件列表时使用ABSOLUTE DESTINATION 路径        |
| CMAKE_AUTOMOC_RELAXED_MODE        |              在严格和宽松的automoc模式间切换              |
| CMAKE_BACKWARDS_COMPATIBILITY     |                 构建工程所需要的CMake版本                 |
| CMAKE_COLOR_MAKEFILE              |         开启时，使用Makefile产生器会产生彩色输出          |
| CMAKE_ALLOW_LOOSE_LOOP_CONSTRUCTS |               用来控制IF ELSE语句的书写方式               |

使用`cmake --help-variable <cmake变量名>` 可以查看该变量的默认值和使用场景，简单使用就可以不用再去查cmake手册了。

- 运行CMake，并使用`cmake` GUI工具查看缓存。然后，您将获得所有变量。
- 或者使用`-LH`.运行CMake，然后将在配置后打印所有变量。

#### 主要的开关选项:

1. `CMAKE_ALLOW_LOOSE_LOOP_CONSTRUCTS `，用来控制 IF ELSE 语句的书写方式,在下一节语法部分会讲到。

2. `BUILD_SHARED_LIBS `这个开关用来控制默认的库编译方式,如果不进行设置,使用 ADD_LIBRARY 并没有指定库类型的情况下,默认编译生成的库都是静态库。如果 `SET(BUILD_SHARED_LIBS ON)` 后,默认生成的为动态库。

3.  `CMAKE_C_FLAGS` 设置 C 编译选项,也可以通过指令 `ADD_DEFINITIONS()` 添加。

4. **`CMAKE_CXX_FLAGS` 设置 C++ 编译选项,也可以通过指令 `ADD_DEFINITIONS()` 添加**。

#### 系统信息

1. `CMAKE_MAJOR_VERSION` , CMAKE 主版本号,比如 2.4.6 中的 2
2. `CMAKE_MINOR_VERSION` , CMAKE 次版本号,比如 2.4.6 中的 4
3. `CMAKE_PATCH_VERSION` , CMAKE 补丁等级,比如 2.4.6 中的 6
4. `CMAKE_SYSTEM `,系统名称,比如 Linux-2.6.22
5. `CMAKE_SYSTEM_NAME` ,不包含版本的系统名,比如 Linux
6. `CMAKE_SYSTEM_VERSION` ,系统版本,比如 2.6.22
7. `CMAKE_SYSTEM_PROCESSOR` ,处理器名称,比如 i686.
8. `UNIX` ,在所有的类 UNIX 平台为 TRUE ,包括 OS X 和 cygwin
9. `WIN32` ,在所有的 win32 平台为 TRUE ,包括 cygwin

## 指定C++标准

```cmake
# https://cmake.org/cmake/help/latest/prop_tgt/CXX_STANDARD.html
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# expected behaviour
#set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++17")
```

Modern CMake propose an interface for this purpose `target_compile_features`. Documentation is here: [Requiring Language Standards](https://cmake.org/cmake/help/latest/manual/cmake-compile-features.7.html#requiring-language-standards). Use it like this:

```
target_compile_features(${PROJECT_NAME} PRIVATE cxx_std_17)
```

In CMake, `PUBLIC` (for everyone) = `INTERFACE` (for the other) + `PRIVATE` (for me)

## 引入第三方头文件

hello.h 位于`/root/cpp_test/backup/cmake_test/t4/include/hello`目录中，并没有位于系统标准的头文件路径，为了让我们的工程能够找到 hello.h 头文件，我们需要引入一个新的指令` INCLUDE_DIRECTORIES`，其完整语法为:
```cmake
INCLUDE_DIRECTORIES([AFTER|BEFORE] [SYSTEM] dir1 dir2 ...)
```

这条指令可以用来向工程添加多个特定的头文件搜索路径，路径之间用空格分割，**如果路径中包含了空格，可以使用双引号将它括起来**，**默认的行为是追加到当前的头文件搜索路径的后面**，你可以通过两种方式来进行控制搜索路径添加的方式:

现在我们在 src/CMakeLists.txt 中添加一个头文件搜索路径，方式很简单，加入:
```cmake
INCLUDE_DIRECTORIES(/root/cpp_test/backup/cmake_test/t4/include/hello)
```

进入 build 目录，重新进行构建，这是找不到 hello.h 的错误已经消失，但是出现了一个新的错误:

```
main.c:(.text+0x12): undefined reference to `func' 
```

因为我们并没有 link 到共享库 libhello 上。

## 为 target 添加共享库

我们现在需要完成的任务是将目标文件链接到 libhello，这里我们需要引入两个新的指令 `LINK_DIRECTORIES` 和 `TARGET_LINK_LIBRARIES`

### add_library

该指令的主要作用就是将指定的源文件生成链接文件，然后添加到工程中去。该指令常用的语法如下：

```c++
add_library(<name> [STATIC | SHARED | MODULE]
            [EXCLUDE_FROM_ALL]
            [source1] [source2] [...])
```

其中`<name>`表示库文件的名字，该库文件会根据命令里列出的源文件来创建。而`STATIC`、`SHARED`和`MODULE`的作用是指定生成的库文件的类型:

- `STATIC`库是目标文件的归档文件，在链接其它目标的时候使用。
- **`SHARED`库会被动态链接（动态链接库）**，在运行时会被加载。

- MODULE库是一种不会被链接到其它目标中的插件，但是可能会在运行时使用dlopen-系列的函数。

**默认状态下，库文件将会在于源文件目录树的构建目录树的位置被创建**，该命令也会在这里被调用。

而语法中的source1 source2分别表示各个源文件。

### link_directories

该指令的作用主要是指定要链接的库文件的路径，该指令有时候不一定需要。因为`find_package`和`find_library`指令可以得到库文件的绝对路径。不过你自己写的动态库文件放在自己新建的目录下时，可以用该指令指定该目录的路径以便工程能够找到。

`LINK_DIRECTORIES` 的全部语法是:

```cmake
LINK_DIRECTORIES(directory1 directory2 ...) #对应tasks的 "-L"参数  .dll等
```

这个指令非常简单，**添加非标准的共享库搜索路径**，比如，在工程内部同时存在共享库和可 执行二进制，在编译时就需要指定一下这些共享库的路径。对应tasks的 "`-L`"参数  .dll等。

注意：`LINK_DIRECTORIES`放在`ADD_EXECUTABLE`之前

官网不推荐使用`LINK_DIRECTORIES`，原文如下：

> Note that this command [link_directories] is rarely necessary. Library locations returned by find_package() and find_library() are absolute paths. Pass these absolute library file paths directly to the target_link_libraries() command. CMake will ensure the linker finds them.

### target_link_libraries

这个例子中我们没有用到这个指令而是使用`TARGET_LINK_LIBRARIES` 。 `TARGET_LINK_LIBRARIES` 的全部语法是:

```cmake
target_link_libraries(<target> [item1] [item2] [...]
                      [[debug|optimized|general] <item>] ...)
```

上述指令中的**`<target>`是指通过`add_executable()`和`add_library()`指令生成已经创建的目标文件**。而`[item]`表示库文件没有后缀的名字。默认情况下，库依赖项是传递的。当这个目标链接到另一个目标时，链接到这个目标的库也会出现在另一个目标的连接线上。这个传递的接口存储在`interface_link_libraries`的目标属性中，可以通过设置该属性直接重写传递接口。

这个指令可以用来为 target 添加需要链接的共享库，本例中是一个可执行文件，但是同样可以用于为自己编写的共享库添加共享库链接，libhello.so.1.2共享库的路径为`/root/cpp_test/backup/cmake_test/t4/thirdPath/libhello.so.1.2`。 为了解决我们前面遇到的 func 未定义错误，我们需要作的是向`src/CMakeLists.txt` 中添加如下指令:

```cmake
TARGET_LINK_LIBRARIES(main /root/cpp_test/backup/cmake_test/t4/thirdPath/libhello.so.1.2)
```

注意：

1. `target_link_libraries` 要在 `add_executable` 之后

2. `link_libraries` 要在 `add_executable` 之前，对应tasks的 "`-l`"参数 .lib。目前[文档](https://cmake.org/cmake/help/v3.0/command/link_libraries.html)中说 `link_libraries`已经被废弃了

   > Deprecated. Use the target_link_libraries() command instead.

### 链接库综合例子

```cmake
INCLUDE_DIRECTORIES(
	${catkin_include_dirs}
	${svo_source_dir}/include/svo
	${svo_source_dir}/include/svo/track
)
add_library(${PROJECT_NAME} SHARED src/track/tracking.cpp) 

add_executable(${PROJECT_NAME}_node src/svo_node.cpp src/system.cpp)

target_link_libraries(${PROJECT_NAME}_node ${catkin_libraries} ${PROJECT_NAME})
```

如上所述，我们接下来进行编译：

```bash
mkdir build
cd build
cmake ..
make
```

这是我们就得到了一个连接到 libhello 的可执行程序 main，位于 `build/bin`目录，运行 main 的结果是输出:

```bash
bin/main
#输出 hello world!
```

## 查看执行文链接库的情况

让我们来检查一下 main 的链接情况,输入命令：

```bash
ldd bin/main
```

得到的输出如下：

![img](https://images.spumn.eu.cc/blog/06eb2e36d5a0a9b9.png)

可以清楚的看到 main 确实链接了共享库 libhello，而且链接的是动态库 libhello.so.1

### 链接到静态库 

将 `TARGET_LINK_LIBRRARIES `指令修改为: 

```cmake
TARGET_LINK_LIBRARIES(main /root/cpp_test/backup/cmake_test/t4/thirdPath/libhello.a)
```

重新构建后再来看一下 main 的链接情况 ldd src/main

![img](https://images.spumn.eu.cc/blog/21f103f3a058711a.png)

说明，main 确实链接到了静态库 libhello.a


## 总结

CMakeLists.txt所有指令的基本操作如下：

```cmake
#命名项目
PROJECT (HELLO)
#添加生成可执行二进制文件
ADD_EXECUTABLE(hello main.c)
 
#在主CMakeLists.txt添加子执行文件
ADD_SUBDIRECTORY(src bin)
 
 
SET(LIBHELLO_SRC hello.c)
#添加共享库
ADD_LIBRARY(hello SHARED ${LIBHELLO_SRC})
#添加静态库
ADD_LIBRARY(hello_static STATIC ${LIBHELLO_SRC})
#重命名静态库
SET_TARGET_PROPERTIES(hello_static PROPERTIES OUTPUT_NAME "hello")
#清除功能开启
SET_TARGET_PROPERTIES(hello PROPERTIES CLEAN_DIRECT_OUTPUT 1)
SET_TARGET_PROPERTIES(hello_static PROPERTIES CLEAN_DIRECT_OUTPUT 1)
#设置版本号
SET_TARGET_PROPERTIES(hello PROPERTIES VERSION 1.2 SOVERSION 1)
#安装文件及可执行文件
INSTALL(TARGETS hello hello_static
        LIBRARY DESTINATION thirdPath
        ARCHIVE DESTINATION thirdPath)
 
INSTALL(FILES hello.h DESTINATION include/hello)
 
#导入第三方库头文件
INCLUDE_DIRECTORIES(/root/cpp_test/backup/cmake_test/t4/include/hello)
#导入第三方静态库
TARGET_LINK_LIBRARIES(main /root/cpp_test/backup/cmake_test/t4/thirdPath/libhello.a)
#导入第三方动态库
TARGET_LINK_LIBRARIES(main /root/cpp_test/backup/cmake_test/t4/thirdPath/libhello.so.1.2)
```

举个简单的例子，项目learn-c++目录结构如下：

```bash
-include
	-hello.h
	-smartptr.h
-src
	-hello.cpp
	-smartptr.cpp
-CmakeLists.txt
-main.cpp
```

CmakeLists.txt文件如下：

```cmake
cmake_minimum_required(VERSION 3.0.0)
project(learn-c++ VERSION 0.1.0)


# 自定义变量用如下方式
SET(LIB_SHARED_NAME LIB_SHARED)
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++17")

include(CTest)
enable_testing()


include_directories(${PROJECT_SOURCE_DIR}/include)

# 将所有cpp添加成动态库
file(GLOB_RECURSE CPP_SRC "${PROJECT_SOURCE_DIR}/src/*.cpp")

# 生成动态库
add_library(LIB_SHARED SHARED ${CPP_SRC})

LINK_DIRECTORIES(${PROJECT_SOURCE_DIR}/${CPP_SRC})# 对应tasks的 "-L"参数  .dll等


# 添加可执行程序
add_executable(learn-c++ main.cpp)
TARGET_LINK_LIBRARIES(learn-c++ ${LIB_SHARED_NAME})

target_compile_features(${PROJECT_NAME}  PRIVATE cxx_std_17)

set(CPACK_PROJECT_NAME ${PROJECT_NAME})
set(CPACK_PROJECT_VERSION ${PROJECT_VERSION})
include(CPack)
```

注：`file`的一个作用是生成目录列表。

1. 添加当前目录下的所有c文件列表到`lib_srcs`变量中

```cpp
file(GLOB lib_srcs *.c)
```

2. 添加当前目录**及其子目录下**的所有c文件列表到`lib_srcs`变量中

```cpp
file(GLOB_RECURSE lib_srcs *.c)
```
