---
title: "Linux Devkit"
description: "在非 Linux 环境用 Docker + Clang/CMake 搭建 CS144 实验环境。"
---

在非 linux 操作系统完成本项目，需要搭建一个 docker 环境。编写一个 `Dockerfile`，基于 `ubuntu:latest`，安装了 LLVM、Clang、CMake，支持 C++20/23（C++21 标准尚未正式发布），并配置了 OpenSSH 服务器

请注意，Dockerfile 本身不处理端口映射和环境变量设置，这些应在运行容器时通过 `docker run` 命令指定。

---

# 🐳 Dockerfile
```dockerfile
FROM ubuntu:latest

# 设置非交互模式，避免安装过程中出现提示
ENV DEBIAN_FRONTEND=noninteractive

# 添加清华大学的 Ubuntu 镜像源, 临时使用http协议
RUN echo "Types: deb" > /etc/apt/sources.list.d/tsinghua.sources && \
    echo "URIs: http://mirrors.tuna.tsinghua.edu.cn/ubuntu/" >> /etc/apt/sources.list.d/tsinghua.sources && \
    echo "Suites: ${UBUNTU_CODENAME} ${UBUNTU_CODENAME}-updates ${UBUNTU_CODENAME}-backports ${UBUNTU_CODENAME}-security" >> /etc/apt/sources.list.d/tsinghua.sources && \
    echo "Components: main restricted universe multiverse" >> /etc/apt/sources.list.d/tsinghua.sources && \
    echo "Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg" >> /etc/apt/sources.list.d/tsinghua.sources

# disable ubuntu.sources
RUN if [ -f /etc/apt/sources.list.d/ubuntu.sources ]; then \
    mv /etc/apt/sources.list.d/ubuntu.sources /etc/apt/sources.list.d/ubuntu.sources.disabled; \
    fi

# 安装必要的工具
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

# 重新换回 HTTPS 源
RUN sed -i 's|http://mirrors.tuna.tsinghua.edu.cn|https://mirrors.tuna.tsinghua.edu.cn|g' /etc/apt/sources.list.d/tsinghua.sources

# 更新软件包并安装必要的工具，包括 ping 和 telnet
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    software-properties-common \
    lsb-release \
    curl \
    openssh-server \
    sudo \
    iputils-ping \
    iproute2 \
    less \
    vim \
    && rm -rf /var/lib/apt/lists/*

# 添加 LLVM 官方仓库的 GPG 密钥
RUN wget https://apt.llvm.org/llvm-snapshot.gpg.key && \
    apt-key add llvm-snapshot.gpg.key && \
    rm llvm-snapshot.gpg.key

# 添加 LLVM 仓库（以 LLVM 20 为例）
RUN bash -c 'echo "deb http://apt.llvm.org/$(lsb_release -cs)/ llvm-toolchain-$(lsb_release -cs)-20 main" > /etc/apt/sources.list.d/llvm.list'

# 更新软件包并安装 LLVM、Clang、CMake
RUN apt-get update && apt-get install -y \
    clang-20 \
    clang++-20 \
    lldb-20 \
    lld-20 \
    llvm-20 \
    llvm-20-dev \
    clang-tidy-20 \
    clang-format-20 \
    cmake \
    && rm -rf /var/lib/apt/lists/* 
    
# 创建符号链接
RUN update-alternatives --install /usr/bin/cc cc /usr/bin/clang-20 100
RUN update-alternatives --install /usr/bin/c++ c++ /usr/bin/clang++-20 100
RUN update-alternatives --install /usr/bin/lld lld /usr/bin/lld-20 100
RUN ln -s /usr/bin/clang-tidy-20 /usr/bin/clang-tidy
RUN ln -s /usr/bin/clang-format-20 /usr/bin/clang-format

# 创建 SSH 运行目录
RUN mkdir /var/run/sshd

# 设置 root 用户密码（出于安全考虑，建议在实际使用中更改）
RUN echo 'root:root' | chpasswd

# 允许 root 用户通过 SSH 登录
RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config
RUN sed -i 's/#Port 22/Port 22/' /etc/ssh/sshd_config
RUN ssh-keygen -A
RUN service ssh restart

# 设置默认 shell 为 bash
SHELL ["/bin/bash", "-c"]

# 设置默认工作目录
WORKDIR /minnow

# 暴露 SSH 端口
EXPOSE 22

# 设置默认启动命令
CMD ["/usr/sbin/sshd", "-D"]
```

## 🐳 使用 Dockerfile 设置环境变量（可选）
如果您希望环境变量在容器中持久存在，可以在 Dockerfile 中添加 `ENV` 指令：

```dockerfile
ENV HTTP_PROXY="http://host.docker.internal:7897"
ENV HTTPS_PROXY="http://host.docker.internal:7897"
ENV ALL_PROXY="socks5://host.docker.internal:7897"
ENV NO_PROXY="localhost,127.0.0.1"
```

请注意，这种方法会将环境变量写入镜像中，可能不适用于需要动态配置的场景。

## c++默认编译器配置
当你安装 `clang-20` 和 `clang++-20` 时，它们的可执行文件名是带有版本号后缀的 (`clang-20`, `clang++-20`)。CMake 默认会查找名为 `c++`, `g++`, `clang++` 等不带版本号的编译器。因此，它找不到默认的 C++ 编译器。

有几种方法可以解决这个问题，在 Dockerfile 中最常用的方法是设置环境变量或使用 `update-alternatives`。

**方法一：设置环境变量 (推荐)**

在你的 Dockerfile 中，可以在 `RUN` 命令安装完编译器之后，但在运行 CMake 之前，设置 `CC` 和 `CXX` 环境变量，指向你安装的特定版本编译器。

```dockerfile
FROM ubuntu:noble # 或者你使用的基础镜像

# (可选) 解决之前提到的 apt-get update 502 错误
# 尝试更换镜像源，例如使用清华大学的镜像源
# RUN sed -i 's/archive.ubuntu.com/mirrors.tuna.tsinghua.edu.cn/g' /etc/apt/sources.list

RUN apt-get update && apt-get install -y --no-install-recommends \
    software-properties-common \
    && rm -rf /var/lib/apt/lists/*

# (可选) 如果需要特定版本的 clang, llvm 官方源可能更可靠
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     wget gpg \
#     && wget https://apt.llvm.org/llvm.sh \
#     && chmod +x llvm.sh \
#     && ./llvm.sh 20 all \
#     && rm llvm.sh \
#     && apt-get install -y cmake \
#     && rm -rf /var/lib/apt/lists/*

# 如果使用 Ubuntu 官方源安装的 clang-20
RUN apt-get update && apt-get install -y --no-install-recommends \
    clang-20 \
    clang++-20 \
    lldb-20 \
    lld-20 \
    llvm-20 \
    llvm-20-dev \
    cmake \
    && rm -rf /var/lib/apt/lists/*

# 设置环境变量告诉 CMake 使用哪个编译器
ENV CC=clang-20
ENV CXX=clang++-20
# （可选）如果你也想明确指定链接器
# ENV LD=lld-20

# 举例：后续的 RUN 命令如果需要编译
# WORKDIR /app
# COPY . /app
# RUN cmake . && make
```

**解释:**

+ `ENV CC=clang-20`: 将 C 编译器设置为 `clang-20`。
+ `ENV CXX=clang++-20`: 将 C++ 编译器设置为 `clang++-20`。
+ `ENV LD=lld-20`: (可选) 如果你想确保链接器也使用 lld-20。CMake 通常会根据 CXX 自动选择合适的链接器，但明确指定可以避免一些潜在问题。

**方法二：使用 **`update-alternatives`** (更“系统级”的默认设置)**

你可以使用 `update-alternatives` 命令来创建无版本后缀的符号链接，并将它们设置为默认的 C 和 C++ 编译器。

```dockerfile
FROM ubuntu:noble

# (可选) 解决之前提到的 apt-get update 502 错误
# RUN sed -i 's/archive.ubuntu.com/mirrors.tuna.tsinghua.edu.cn/g' /etc/apt/sources.list

RUN apt-get update && apt-get install -y --no-install-recommends \
    clang-20 \
    clang++-20 \
    lldb-20 \
    lld-20 \
    llvm-20 \
    llvm-20-dev \
    cmake \
    && update-alternatives --install /usr/bin/cc cc /usr/bin/clang-20 100 \
    && update-alternatives --install /usr/bin/c++ c++ /usr/bin/clang++-20 100 \
    && update-alternatives --install /usr/bin/lld lld /usr/bin/lld-20 100 \
    && rm -rf /var/lib/apt/lists/*

# 后续的 RUN 命令如果需要编译，CMake 应该能自动找到 cc 和 c++
# WORKDIR /app
# COPY . /app
# RUN cmake . && make
```

**解释:**

+ `update-alternatives --install /usr/bin/cc cc /usr/bin/clang-20 100`:
    - `--install`: 添加一个新的 alternative。
    - `/usr/bin/cc`: 这是“通用名”链接的路径 (e.g., `cc`)。
    - `cc`: 这是这个通用名的名字。
    - `/usr/bin/clang-20`: 这是实际程序的路径。
    - `100`: 这是优先级（数字越大，优先级越高）。
+ 对 `c++` 和 `lld` 也执行类似操作。

查看结果：

```dockerfile
root@ce17278be119:/minnow# update-alternatives --display cc
cc - auto mode
  link best version is /usr/bin/clang-20
  link currently points to /usr/bin/clang-20
  link cc is /usr/bin/cc
  slave cc.1.gz is /usr/share/man/man1/cc.1.gz
/usr/bin/clang-20 - priority 100
/usr/bin/gcc - priority 20
  slave cc.1.gz: /usr/share/man/man1/gcc.1.gz
```

**方法三：在 CMake 命令中指定编译器 (如果不想全局设置)**

如果你不想在 Docker 镜像级别设置默认编译器，可以在调用 `cmake` 命令时直接指定：

```dockerfile
# ... (前面的安装步骤) ...

# 假设你的 CMakeLists.txt 和源代码在 /app
WORKDIR /app
COPY . /app
RUN cmake -D CMAKE_C_COMPILER=clang-20 \
          -D CMAKE_CXX_COMPILER=clang++-20 \
          . \
    && make
```

**选择哪种方法？**

+ `ENV CC CXX`** (方法一):** 最简单直接，推荐用于 Dockerfile 中为后续的构建步骤指定编译器。它清晰地表明了构建环境的意图。
+ `update-alternatives`** (方法二):** 更像是配置系统级的默认值。如果你的镜像后续还会被用于其他编译任务，而这些任务也期望 `cc` 和 `c++` 指向这些 Clang 版本，那么这是个好选择。
+ **CMake 参数 (方法三):** 当你只想为特定的 CMake 构建过程指定编译器，而不影响镜像中的其他工具或后续的 shell 会话时使用。

---

## 🚀 运行容器
构建镜像后，您可以使用以下命令运行容器，并设置环境变量、端口映射和卷挂载：

```bash
docker build -t llvm-image:latest .

docker run -it --rm \
  --add-host=host.docker.internal:host-gateway \
  -e HTTP_PROXY="http://host.docker.internal:7897" \
  -e HTTPS_PROXY="http://host.docker.internal:7897" \
  -e ALL_PROXY="socks5://host.docker.internal:7897" \
  -e http_proxy="http://host.docker.internal:7897" \
  -e https_proxy="http://host.docker.internal:7897" \
  -e all_proxy="socks5://host.docker.internal:7897" \
  -e NO_PROXY="localhost,127.0.0.1" \
  -e no_proxy="localhost,127.0.0.1" \
  -p 2222:22 \
  -v Your Project/minnow:/minnow \
  llvm-image
```

上述命令将：

+ 将主机的 `Your Project/minnow` 目录挂载到容器的 `/minnow` 目录。
+ 将容器的 22 端口映射到主机的 2222 端口，允许通过 SSH 连接。
+ 设置代理相关的环境变量。

也可以直接在 IDEA 中使用容器作为 ToolChains:

### 在 CLion 中配置 Docker 工具链
1. 打开 CLion，导航至 `Settings`（或 `Preferences`） > `Build, Execution, Deployment` > `Toolchains`。
2. 点击左上角的 `+` 按钮，选择 `Docker` 类型。
3. 在弹出的窗口中，点击齿轮图标添加 Docker 服务器：
    1. 选择 `Unix Socket`（适用于本地 Docker）。
    2. 确保 Docker 守护进程正在运行。
4. 在 `Image` 字段中，选择您正在运行的 Ubuntu 容器的镜像。
5. 等待 CLion 自动检测容器中的工具链。
6. 在 `CMake`, `C Compiler`, `C++ Compiler`, `Debugger` 等字段中，使用 Dockerfile 中的工具路径，例如：
    1. CMake: `/usr/bin/cmake`
    2. C Compiler: `/usr/bin/clang-20`
    3. C++ Compiler: `/usr/bin/clang++-20`
    4. Debugger: `/usr/bin/lldb-20`
7. 点击 `Apply` 或 `OK` 保存配置。

![](https://images.spumn.eu.cc/cs-knowledge-wiki/csapp/cs144/labs/f2893d644567-1748314270703-f7fa6832-b5f2-43da-a794-13a315d4df94.png)

### 配置 CMake 构建配置
1. 导航至 `Settings` > `Build, Execution, Deployment` > `CMake`。
2. 点击左上角的 `+` 按钮，添加新的 CMake 配置。
3. 在 `Toolchain` 下拉菜单中，选择刚刚配置的 Docker 工具链。
4. 根据需要设置 `Build type`（例如 `Debug` 或 `Release`）。
5. 点击 `Apply` 或 `OK` 保存配置。

![](https://images.spumn.eu.cc/cs-knowledge-wiki/csapp/cs144/labs/a4ac405ed572-1748314682874-1ab19692-b997-436c-8663-6929268140d4.png)

将多余的 CMake 工具 disable 了，Clion 自动使用刚配置的 Dokcer 里的 Cmake 进行提示。

---

## 🧪 验证安装
进入容器后，您可以运行以下命令验证安装：

```bash
clang++-20 --version
cmake --version
ping -c 4 google.com
telnet localhost 22
```

确保输出显示了正确的版本信息，并且 `ping` 和 `telnet` 命令可以正常使用，表明安装成功。

检查 ssh 服务是否正在运行：

```bash
ps aux | grep sshd
```

检查当前环境变量：

```dockerfile
root@<container_id>:/# env | grep -i proxy
```

---

## 🔄 使用现有容器（可选）
如果您希望使用已运行的容器而非每次启动新的容器，可以考虑使用 **Remote Host** 工具链：

1. 在 CLion 中，导航至 **Settings/Preferences > Build, Execution, Deployment > Toolchains**。
2. 点击 **“+”**，选择 **Remote Host** 类型。
3. 配置 SSH 连接，主机为 `localhost`，端口为您映射的端口（例如 `2222`），用户名和密码为容器内的用户（例如 `root`）。
4. 确保容器内的 SSH 服务已启动，并允许密码登录。

检查 SSH 配置文件:

确保 `/etc/ssh/sshd_config` 文件中允许 root 用户登录，并监听正确的端口。您可以检查以下配置项：

+ `PermitRootLogin yes`
+ `Port 22`

如果进行了修改，记得重启 SSH 服务：

```plain
service ssh restart
```

请注意，使用 Remote Host 工具链可能需要额外配置，如用户权限和路径映射。

