# io_uring 如何重塑高性能存储的 I/O 边界

---

## 一、io_uring 是什么？—— 从「每次 I/O 都要进内核」说起

在理解 RustFS 的选择之前，我们先得搞清楚传统 Linux I/O 模型的问题。

### 1.1 传统模型的痛点

假设你要从磁盘读一个 4KB 的数据块，最朴素的做法是：

```rust
let mut buf = vec![0u8; 4096];
file.read_exact(&mut buf)?;  // 阻塞，直到数据就绪
```

这里发生了什么？

1. **用户态 → 内核态**：`read` 系统调用触发上下文切换
2. **内核态 → 块层**：VFS → 文件系统 → 块层 → 设备驱动
3. **等待 DMA 完成**：数据从磁盘通过 DMA 拷贝到内核页缓存
4. **内核态 → 用户态**：再把数据从内核页缓存拷贝到用户态 `buf`
5. **返回用户态**：上下文切换回来

**一次读操作，至少两次上下文切换 + 一次内存拷贝**。如果并发量高，CPU 就在「进内核、出内核」之间反复横跳。

异步模型（如 epoll）虽然解决了等待问题，但本质上 **epoll 只是一个事件通知机制**——它告诉你「fd 就绪了」，真正的 `read/write` 系统调用还得你自己做。

### 1.2 io_uring 的革命性设计

io_uring 是 Linux 内核在 5.1（2019 年）引入的全新异步 I/O 接口。它的核心思想非常简洁：

> **把 I/O 请求的提交和完成都放到共享内存的环形队列里，让用户态和内核态通过内存直接交换数据，尽可能减少系统调用。**

io_uring 有三个核心系统调用：

| 系统调用 | 作用 |
|---|---|
| `io_uring_setup` | 创建一对环形队列（SQ + CQ），返回一个 `ring_fd` |
| `io_uring_enter` | 通知内核「SQ 里有新请求了」，同时可以等待 CQ 中的完成事件 |
| `io_uring_register` | 预注册文件描述符、缓冲区，减少运行时的动态解析开销 |

最关键的一点是：io_uring 的通信不依赖频繁的系统调用，而是依赖 **mmap 映射的共享内存**。用户态程序直接把 I/O 请求填到 Submission Queue（SQ）里，内核从 SQ 取出来执行；执行完后把结果放到 Completion Queue（CQ）里，用户态从 CQ 收割。

**理想情况下，一次 I/O 的生命周期里，用户态只需要做零次或一次系统调用。**

---

## 二、io_uring 的双环缓冲区——内核与用户态的「零拷贝」契约

要真正理解 RustFS 的源码，必须先理解 io_uring 的内核数据结构。这不是简单的「队列」，而是一套精心设计的无锁共享内存协议。

### 2.1 内存布局：三个 mmap 区域

当你调用 `io_uring_setup(entries, &params)` 时，内核会创建以下结构：

![io_uring_memory_layout.excalidraw](https://images.spumn.eu.cc/cs-knowledge-wiki/storage/distributed-storage/io_uring_memory_layout.excalidraw.svg)

用户态通过 `mmap` 把三个区域映射到自己的地址空间：

1. **SQ Ring**：包含 `head`、`tail`、`ring_mask`、`ring_entries`、`flags`、以及一个 `array`（索引数组）
2. **CQ Ring**：包含 `head`、`tail`、`ring_mask`、`ring_entries`、`cqes`
3. **SQE Array**：真正的 Submission Queue Entry 数组

### 2.2 提交队列（SQ）的工作流程

用户态提交一个读请求的步骤：

```c
// 1. 获取当前 tail
tail = *sring_tail;

// 2. 计算 SQE 索引（环形缓冲区）
index = tail & *sring_mask;

// 3. 填充 SQE
struct io_uring_sqe *sqe = &sqes[index];
sqe->opcode = IORING_OP_READ;
sqe->fd = fd;
sqe->addr = (unsigned long)buf;
sqe->len = len;
sqe->off = offset;

// 4. 更新 array（内核通过 array 找到 SQE）
sring_array[index] = index;

// 5. 更新 tail，并写内存屏障保证可见性
tail++;
io_uring_smp_store_release(sring_tail, tail);

// 6. 通知内核（如果开了 SQPOLL 模式，这步都可以省掉）
io_uring_enter(ring_fd, 1, 0, 0);
```

注意这里的 **内存屏障（memory barrier）**：

- `io_uring_smp_store_release` 在更新 `tail` 时使用 **Release 语义**，保证之前的 SQE 写入对内核可见。
- 内核读 `tail` 时使用 **Acquire 语义**，确保看到完整的 SQE 数据。

这是无锁编程的经典模式，避免了昂贵的锁操作。

### 2.3 完成队列（CQ）的收割流程

```c
// 1. 读 head（Acquire 语义）
head = io_uring_smp_load_acquire(cring_head);

// 2. 检查是否有新完成事件
if (head == *cring_tail) {
    return -1;  // 队列为空
}

// 3. 读取 CQE
struct io_uring_cqe *cqe = &cqes[head & (*cring_mask)];

// 4. 处理结果
int result = cqe->res;  // >0 表示成功读取的字节数，<0 表示错误码

// 5. 更新 head（Release 语义），告诉内核这个 CQE 已经被消费
head++;
io_uring_smp_store_release(cring_head, head);
```

### 2.4 为什么这比传统方式快？

传统 `read()` 的路径：

```
用户态 ──syscall──→ 内核 ──执行 I/O──→ 返回 ──syscall──→ 用户态
   ↑                                                    ↑
   └──────────── 两次上下文切换 ────────────────────────┘
```

io_uring 的路径（理想情况）：

```
用户态 ──mmap──→ 共享内存
        │
        ├── 写 SQE ──→ 内核执行（driver 线程通过 eventfd 被唤醒）
        │
        └── 读 CQE ←── 内核写入 + eventfd 通知
```

**系统调用次数从「每个 I/O 一次」降到「一批 I/O 一次」。** 这正是 io_uring 在高并发、高 QD（Queue Depth）场景下的核心收益来源。

需要强调：这一收益主要来自**系统调用次数与上下文切换的削减**，而不是「零拷贝」。RustFS 的 buffered 读路径仍然要经过内核页缓存到用户态的一次拷贝；真正的「免拷贝」来自 **O_DIRECT**（见第七章），而非 io_uring 本身。io_uring 和 O_DIRECT 是**两个正交的优化维度**，RustFS 把两者组合起来，才既拿到了异步提交、又绕过了页缓存。

---

## 三、RustFS 的 io_uring 架构——不是「用了 io_uring」，而是「编译时防呆 + 运行时降级」

### 3.1 写在仓库里的「防呆」：为什么不能用 tokio 的 io-uring runtime feature

RustFS 的 io_uring 之路有一个鲜明的设计决策：仓库里专门有一个守卫脚本 `scripts/check_no_tokio_io_uring.sh`。它**封禁的是 tokio 的 `io-uring` runtime feature**，而不是 io_uring 本身。原因如下：

在 RustFS 的 `.cargo/config.toml` 里，全局开启了 `--cfg tokio_unstable`。此时只要 workspace 里**任何一个** crate 启用了 tokio 的 `io-uring` feature，就会**静默地把所有 Linux 构建的文件 I/O 全部切到 io_uring 后端**。而受限的 Linux 环境（Docker 默认 seccomp、gVisor、proot、老内核）会拒绝 `io_uring_setup`（返回 EACCES/ENOSYS），于是服务在启动时直接 `DiskAccessDenied` 崩溃（backlog#890）。

```
# scripts/check_no_tokio_io_uring.sh（核心逻辑）
# 只封禁 tokio 依赖行里的 "io-uring" runtime feature；
# 一个显式的 io-uring crate 依赖是被允许的。
rg -n '^[[:space:]]*tokio[[:space:]]*=.*"io-uring"' --glob '**/Cargo.toml' .
```

所以 RustFS 的结论是：**任何全局生效的 io_uring 后端都无法在受限环境里优雅降级**。它需要的不是「用了 io_uring」，而是一个可以**按磁盘探测、按读操作回退、且绝不导致启动崩溃**的应用层后端。这个后端被抽成了一个独立 crate——**`rustfs-uring`**。

### 3.2 rustfs-uring crate 与 UringBackend

`rustfs-uring` 是一个发布在 crates.io 上的独立 crate（`0.2.1`，Linux-only，仓库 `rustfs/uring`），依赖 `io-uring ^0.7.13`、`libc`、`tokio`、`tracing`，约 954 行 Rust 代码。它的自我定位是：

> **Cancel-safe async io_uring read backend for RustFS storage.**

在 `crates/ecstore/Cargo.toml` 里，它是这样被引用的：

```toml
# crates/ecstore/Cargo.toml:237-238
[target.'cfg(target_os = "linux")'.dependencies]
rustfs-uring = "0.2.1"
```

而真正的集成工作发生在 `crates/ecstore/src/disk/local.rs`。RustFS 定义了一个 **`LocalIoBackend`** trait（`local.rs:2546`），默认实现是 **`StdBackend`**（标准 `pread`/mmap 路径），io_uring 实现是 **`UringBackend`**（`local.rs:3461`）。两者平级，由 `build_local_io_backend`（`local.rs:4177`）在磁盘构造时二选一：

```rust
// local.rs:4177 —— 运行时选择读后端
fn build_local_io_backend(root: PathBuf) -> Arc<dyn LocalIoBackend> {
    #[cfg(target_os = "linux")]
    if is_io_uring_read_enabled()
        && let Some(backend) = UringBackend::try_new(root.clone())
    {
        return Arc::new(backend);
    }
    Arc::new(StdBackend::new(root))
}
```

注意 `UringBackend::try_new` 返回 `Option`：**只有当 `RUSTFS_IO_URING_READ_ENABLE` 打开、且逐磁盘的运行时探测成功时，才返回 `Some(backend)`**；否则静默回退到 `StdBackend`。

### 3.3 Cancel Safety——io_uring 在 Rust async 里的「阿喀琉斯之踵」

这是整篇文章最核心的部分，也是 `rustfs-uring` 源码最值得深挖的地方。

#### 3.3.1 Rust async 的两个基本假设

Rust 的异步模型建立在两个隐含假设上：

1. **Future 的状态只在被 `poll` 时改变。**
2. **Future 可以通过不再 `poll` 来隐式取消。**

epoll 模型完美符合这两个假设。比如 `TcpListener::accept()`：

```rust
fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Item> {
    match self.accept() {
        Ok((stream, _)) => Poll::Ready(Ok(stream)),
        Err(e) if e.kind() == WouldBlock => {
            // 注册到 epoll 兴趣列表
            Poll::Pending
        }
        Err(e) => Poll::Ready(Err(e)),
    }
}
```

这里的 `self.accept()` 是**同步执行**的：要么立刻成功，要么返回 `WouldBlock` 并注册到 epoll。如果要取消，只需要不再 `poll` 这个 future——因为真正的 syscall 只发生在 `poll` 时。

#### 3.3.2 io_uring 如何打破这两个假设

io_uring 的 syscall 是**异步提交给内核**的。当你把一个 `IORING_OP_READ` 填到 SQ 里时：

1. 内核可能在**任何时刻**执行这个读操作
2. 内核执行时**不需要你的用户态线程参与**
3. 内核完成操作后，把结果写到 CQ 里

这意味着：**I/O 的生命周期和 Future 的生命周期是解耦的。**

考虑这个场景：

```rust
select! {
    // 分支 A：从磁盘读 1MB 数据
    data = uring_read(file, &mut buf, 0, 1_048_576) => {
        process(data);
    }

    // 分支 B：1 秒后超时
    _ = sleep(Duration::from_secs(1)) => {
        println!("timeout!");
        // 此时 uring_read 的 future 被 drop 了
    }
}
```

如果超时触发，`uring_read` 的 future 会被 drop。但**内核可能正在往 `buf` 里写数据**！如果 Rust 的 Drop 实现释放了 `buf`，而内核还在写，这就是经典的 **Use-After-Free（UAF）**。

更可怕的是，这甚至不是竞态条件（race condition）的级别——内核写内存是**确定会发生**的，只是时间点不确定。

#### 3.3.3 RustFS 的解决方案：Orphan Table 所有权模型

`rustfs-uring` 的核心设计可以用一句话概括：

> **从 SQE 提交到 CQE 完成的整个生命周期，driver 拥有 buffer 和 fd 的所有权。Caller 的 future 只是「借」了一个等待的句柄。**

`rustfs-uring` 的 crate docs 把这个表称为 **pending (orphan) table**（孤儿表）。核心不变量如下：

- **buffer 和 file handle 从 SQE 提交到 CQE 到达，一直由 driver 的 orphan table 持有**。内核在这个窗口内的任何时刻都可能往 buffer 里写，所以**其他任何东西都不允许释放或移动这个堆分配**。
- **drop 调用侧的 future 只是放弃「结果」**，从不碰 buffer。可选的，它会提交一个 `IORING_OP_ASYNC_CANCEL` 来加速 CQE 的到达；但**真正的资源回收永远发生在 CQE 到达之后**。
- **driver shutdown 会 cancel 所有 in-flight 操作，并把 ring drain 到 `in_flight == 0`（带一个 bounded 逃生口）之后，才 unmap ring。**

这套 API 对外暴露得非常干净——调用方根本不需要自己管理 pending table：

```rust
// 实际的 rustfs-uring 0.2.1 API（签名取自 docs.rs）
use rustfs_uring::UringDriver;

// 1. 探测 + 启动（分片版：entries 个 SQ 槽 × shards 个独立 ring）
let driver = UringDriver::probe_and_start_sharded(entries, shards)?;

// 2. 提交一个定位读，返回一个 ReadHandle（可 await 的句柄）
//    注意：读 buffer 由 driver 内部分配，调用方只传 Arc<File>！
let handle: ReadHandle = driver.read_at(Arc::new(file), offset, len);

// 3. await 这个 handle，拿到结果 Vec<u8>
let bytes: Vec<u8> = handle.await?;
```

关键点：**调用方传入的是 `Arc<File>`，而不是 buffer**。读到的数据由 driver 内部管理，`ReadHandle` 被 drop 时 driver 只是放弃结果，buffer 的回收严格发生在 CQE 到达之后。这就是 cancel safety 在 Rust 里的干净表达。

#### 3.3.4 边界情况处理

**场景 1：Shutdown 时的优雅退出**

`UringDriver::shutdown(self) -> StatsSnapshot` 会：停止接受新请求 → cancel 所有 in-flight 操作 → 把每个 ring drain 到 `in_flight == 0` → join 每个 driver 线程 → 最后才 drop/unmap ring。在挂死的磁盘上，这个 drain 是 **bounded** 的（有超时上限），而不是无限等待导致 UAF。多分片时，分片先被要求停止、再一起 join，让它们的 bounded drain **重叠**执行，而不是 `shards × DRAIN_TIMEOUT` 串行累积。

**场景 2：Driver Drop 不能在 tokio worker 上运行**

`UringDriver` 的 `Drop` 会发送 Shutdown 并 join 每个 driver 线程；在挂死的磁盘上，这个 join 可能阻塞到 bounded drain 的超时上限。RustFS 用 `ManuallyDrop<Arc<UringDriver>>` 持有 driver（`local.rs:3473`），并在 `UringBackend` 的 `Drop` 里，判断是否在 tokio runtime 上：

```rust
// local.rs:3559 —— UringBackend 的 Drop
impl Drop for UringBackend {
    fn drop(&mut self) {
        // SAFETY: ManuallyDrop::take 只在这里运行一次
        let driver = unsafe { std::mem::ManuallyDrop::take(&mut self.driver) };
        match tokio::runtime::Handle::try_current() {
            Ok(handle) => {
                // 在 tokio 上：移到 blocking 线程去 drop，绝不阻塞 worker
                handle.spawn_blocking(move || drop(driver));
            }
            Err(_) => drop(driver),
        }
    }
}
```

这是 backlog#1170 的血泪教训：在磁盘重连/关闭期间，一个可能阻塞数百毫秒到数秒的 driver 关闭，**绝不能跑在异步 worker 上**。

**场景 3：O_DIRECT 的 Block Alignment**

`read_at_direct(file, offset, len, align)` 的 `align` 是设备的逻辑块大小（2 的幂，通常 512 或 4096）。`offset` 和 `len` 是调用方的**逻辑范围，不需要对齐**：driver 会读取一个块对齐的超集范围，放进块对齐的 buffer，然后只返回 `[offset, offset + len)`。

对齐 padding 永远不会漏到调用方——这很重要：`BitrotReader` 期望读到精确的 shard 长度，任何 padding 都会被视为比特腐烂（corruption）。

---

## 四、RustFS 的部署策略——保守降级，而非激进全开

### 4.1 默认关闭，环境变量显式开启

RustFS 的 io_uring **不是**通过 `config.yaml` 配置的（原稿此处有误），而是**纯环境变量**驱动的，且默认关闭：

```bash
# 打开 io_uring 读后端（默认 false）
RUSTFS_IO_URING_READ_ENABLE=1 rustfs server /data
```

为什么要默认关闭？因为 io_uring 的可用性与运行环境强相关，而 RustFS 要在 Docker（默认 seccomp）、gVisor、老内核、以及裸机之间都能跑。方式是通过**运行时探测**来决定：每个磁盘启动时，`UringBackend::try_new`（`local.rs:3585`）会调用 `UringDriver::probe_and_start_sharded`，尝试**真正创建一个 ring 并在临时文件上完成一次 `IORING_OP_READ` 往返**。注意这里不是只调用 `io_uring_setup`——因为 gVisor/seccomp 环境可能「能创建 ring，但 op 却失败」；只有真实的读往返成功，才算探测通过（backlog#894）。

### 4.2 Per-Disk Sharded Rings：为什么分片对「缓存命中」特别有效

对于多磁盘场景，RustFS 支持**每个磁盘多个独立的 io_uring ring**，每个 ring 有自己的 driver 线程：

```rust
// local.rs:3596 —— 实际调用
// URING_QUEUE_DEPTH = 128（local.rs:951），shards 来自 get_io_uring_shards()
rustfs_uring::UringDriver::probe_and_start_sharded(URING_QUEUE_DEPTH, shards)
```

分片的**真正原因**常常被误解（原稿说「每个 ring 绑定到 CPU 核心」也不准确）。真实的道理是：

> **一个命中页缓存的 buffered 读，会在 `io_uring_enter` 内部同步完成**——也就是说，这个读的 memcpy 是由「驱动这个 ring 的那个线程」来做的。一个 ring 就把缓存命中读的吞吐锁死在单核内存带宽上。

所以分片是**线性抬高缓存命中读的内存带宽天花板**，而不是「绑核」这么简单。实测数据（16 核主机，backlog#1145）：

| 分片数 | 1 MiB 读 | 64 KiB 读 @ 并发 32 |
|---|---|---|
| 1 | 4911 MB/s | 124k IOPS |
| 2 | 8969 MB/s | — |
| 8 | 47361 MB/s | 345k IOPS |

而**未命中缓存（device-bound）的读**不需要分片——它们受设备本身限制。

分片的代价是 `disks × shards` 个 driver 线程（每个通常阻塞在 `poll(2)`/eventfd 上，CPU 占用很低）。默认 shard 数保持克制：`get_io_uring_shards()`（`local.rs:986`）默认取 `(CPU 并行度 / 4).clamp(1, 4)`，任何覆盖值都被 **clamp 到 `1..=16`**，防止一个手误打出几百个线程。

### 4.3 一张图看懂：in-flight 背压与 CQ 不溢出的结构保证

`URING_QUEUE_DEPTH = 128`（`local.rs:951`）是**每个分片**的提交队列深度。背压把 in-flight 操作上限锁在 `entries`（128）**每个分片**，而这个值**低于**该 ring 的 CQ 容量（2× entries），所以 **CQ overflow 是结构上不可达的**——不是靠运行时的错误处理，而是靠容量设计。

![io_uring_single_shard_ring.excalidraw](https://images.spumn.eu.cc/cs-knowledge-wiki/storage/distributed-storage/io_uring_single_shard_ring.excalidraw.svg)

单次读操作的最大字节数由 `URING_MAX_OP_LEN = 128 MiB`（`local.rs:961`）限制。超过这个上限的超大读会被**拆成顺序小块**逐个 await，从而把最坏情况下的 in-flight 内存绑定在 `permits × 128 MiB` 每个分片，避免一个超大单读钉住 GB 级内存。

### 4.4 完整的环境变量矩阵

| 环境变量 | 默认值 | 作用 |
|---|---|---|
| `RUSTFS_IO_URING_READ_ENABLE` | `false` | io_uring 读后端总开关 |
| `RUSTFS_IO_URING_SHARDS` | `并行度/4`, 夹在 `1..=4` | 每磁盘 ring 数，覆盖值 clamp `1..=16` |
| `RUSTFS_IO_URING_FD_CACHE` | `true` | 每磁盘描述符缓存（见 5.2） |
| `RUSTFS_OBJECT_DIRECT_IO_READ_ENABLE` | `false` | O_DIRECT 大顺序读开关 |
| `RUSTFS_OBJECT_DIRECT_IO_READ_THRESHOLD` | `4 MiB` | 只有大于该阈值的读才考虑 O_DIRECT |
| `RUSTFS_OBJECT_FILE_CACHE_RECLAIM_READ_ENABLE` | `true` | 大读后是否 `fadvise(DONTNEED)` 回收页缓存 |
| `RUSTFS_OBJECT_FILE_CACHE_RECLAIM_THRESHOLD` | `4 MiB` | 页缓存回收阈值 |
| `RUSTFS_URING_TESTS_MUST_RUN` | 未设置 | 测试用：要求 io_uring 必须可用，否则测试 panic（非真空通过） |

---

## 五、运行时降级 Latch 与灰度可观测性——生产的「安全网」

这是 RustFS io_uring 集成里最容易被忽略、但最体现工程成熟度的部分。原稿几乎没有涉及。

### 5.1 两级独立的 Latch

`UringBackend` 里有**两个相互独立的运行时降级开关**（`local.rs:3479`、`local.rs:3488`）：

1. **`active`（AtomicBool）**：整个磁盘的 io_uring 总闸。初始 `true`；一旦某次读返回「限制类 errno」（见 5.3），就置 `false`，此后该磁盘所有读**直接走 StdBackend**，不再做任何 io_uring 尝试。
2. **`direct_uring.supported`（AtomicBool）**：只控制「native O_DIRECT 读形状」。初始 `true`；一旦文件系统拒绝 O_DIRECT，就置 `false`，此后 O_DIRECT 合格读走 `StdBackend` 的对齐路径，而不是每次都重试。

两者独立：`active` 管 io_uring 整体，`direct_uring` 只管 native O_DIRECT 这一条形状。所以一个磁盘可以「O_DIRECT 被拒，退回 StdBackend 对齐路径，但 buffered io_uring 仍然生效」。

### 5.2 errno 三分类：什么才该永久降级

`is_io_uring_unsupported`（`local.rs:3525`）只对 **ENOSYS 和 EPERM** 触发整盘降级——这两个是「io_uring 子系统不可用」的信号。而 **EACCES**（通常是 per-file 的，LSM 挂在每次 read 上，StdBackend 也会遇到）、**EOPNOTSUPP**（按路径由调用方分类）、**EIO/EINVAL/ENOENT/EAGAIN**（数据/参数/缺文件错误）**都不降级整盘**。

这是 backlog#1171 收窄后的语义：一个 per-file 的 EACCES 不该把一个健康的磁盘永久踢出 io_uring。测试 `io_uring_unsupported_classifies_restriction_errnos_only`（`local.rs:17124`）专门钉死了这个分类。

### 5.3 灰度可观测性：让「降级」看得见

io_uring 是**灰度功能**（默认关闭），所以运维需要信号来判断它是否真的在工作，而不是静默退化。RustFS 提供了一组指标（backlog#1172）：

| 指标 | 含义 |
|---|---|
| `rustfs_io_uring_latch_off_total` | 磁盘被 latching 关闭的次数（`true→false` 边沿） |
| `rustfs_io_uring_read_fallback_total` | 单次读回退到 StdBackend 的次数 |
| `rustfs_io_uring_in_flight` | 当前 in-flight 操作数（gauge） |
| `rustfs_io_uring_cq_overflow` | CQ 溢出计数 |
| `rustfs_io_uring_cancel_already` | 取消时发现已完成的次数 |
| `rustfs_io_uring_direct_read_einval_total` | native O_DIRECT 读返回 EINVAL 的次数 |

driver 的 `StatsSnapshot` 会由一个后台任务每 **30 秒**导出到指标（`URING_STATS_EXPORT_INTERVAL`，`local.rs:721`、`local.rs:3712`）。这个任务只持有 driver 的 `Weak` 引用，不会阻止 driver 被回收。

### 5.4 逐磁盘探测缓存

一旦某个磁盘的探测**因为「预期限制」（EACCES/EPERM/ENOSYS/EINVAL/EOPNOTSUPP）而失败**，就把该磁盘路径记进 `URING_UNSUPPORTED_DISKS`（`local.rs:3508`），下次重构该磁盘时跳过探测，避免反复 `io_uring_setup` + 起线程。但**未预期的错误**（ENOMEM/EMFILE 等，可能是启动期瞬时压力）**不缓存**——回退到 StdBackend，并让磁盘重连时重新探测（backlog#1171）。

> 注意区分：`ProbeFailure::is_expected_restriction()`（`rustfs-uring` 里）只适用于**一次性启动探测**。运行时逐 op 的 errno 语义不同，**绝不能**复用这个分类——例如运行时的 EINVAL 有至少三重含义（offset 超 `i64::MAX`、O_DIRECT 未对齐、`entries` 超上限），任何一个都不该把磁盘永久降级。

---

---

## 六、描述符缓存：消除 io_uring 之旅上「最后的线程跳转」

原稿完全没有提到这一层，但它其实是 io_uring 性能能否兑现的关键一环。

### 6.1 为什么需要缓存 fd

io_uring 存在的意义，就是让读路径**永远不离开 tokio worker**（不经过 `spawn_blocking`）。但有一个反例：在支持 fd cache 之前，`pread_uring` 每次读都要在 blocking pool 上 `open` 文件——**每个读都付一次 `spawn_blocking` 往返**，这正是 io_uring 想消除的线程跳转。

实测（16 核主机，4-shard driver，backlog#1145）：去掉这个线程跳转，**+36% ~ +180% IOPS，p999 提升 3~5 倍**。

### 6.2 FdCache 的设计

`FdCache`（`local.rs:3321`）是一个**每磁盘**的 moka 缓存，缓存 `Arc<std::fs::File>`：

- **容量**：`FD_CACHE_CAPACITY = 512`（`local.rs:3213`）描述符/磁盘
- **TTL 兜底**：`FD_CACHE_TTL = 5s`（`local.rs:3219`）
- **淘汰**：moka 的 TinyLFU（相比单一 mutex 的 sharded get，这个缓存每个读都会碰，`>300k IOPS`）
- **键**：`FdKey { volume, path, direct }`——把 `direct` 放进键，是为了防止未来 O_DIRECT 缓存与 buffered 缓存冲突

### 6.3 为什么缓存 part 文件是安全的？

缓存一个**会被覆盖**的文件的 fd 是危险的（stale fd 读到旧 inode）。但 RustFS 缓存的是 erasure shard 的 `part.N` 文件，而它有两条安全性质：

1. **`part.N` 从不原地改写**——替换总是「写新临时文件 + `rename`」swap inode，所以缓存的 fd 永远不会观察到撕裂的 shard。
2. **`xl.meta`（唯一原地替换的路径）不走这条路**——它通过 `read_all`/`read_metadata` 读，永远不经过这个后端。

### 6.4 为什么 invalidation 是必需的

虽然 part 文件本身安全，但**heal（修复）和 delete 会破坏这个安全**：

- **heal** 复用现有版本的 `data_dir`，把重建的 shard `rename` 到**同一个** part 路径（inode 变了）。如果缓存还持有旧 fd，就会持续读到 pre-heal（损坏的）inode，**让 heal 形同虚设，侵蚀读 quorum**。
- **delete** 同理：unlink 了 part，但缓存的 fd 仍让 inode 可读。

所以 `FdCache` 有一套**基于 generation 计数器的失效机制**（`local.rs:3367` `insert_if_fresh`）：

- 每次失效（`invalidate_exact`/`invalidate_under`/`invalidate_volume`/`clear`）都 `fetch_add` generation。
- miss 路径在 open 之前快照 generation；open 完成后，如果 generation 变了（说明 open 期间发生了 heal/delete），就**拒绝把新 fd 放回缓存**（backlog#1176 的 open-then-insert 竞态）。
- 插入后再查一次 generation，收窄「失效与插入本身竞态」的极小窗口。

失效还分三种粒度：**精确路径**（能定位 key 时最便宜）、**前缀**（`delete` 用，且做组件边界检查，`a/b` 不会误伤 `a/bc`）、**整卷**（整个 bucket 没了）。测试 `fd_cache_prefix_invalidation_respects_component_boundary`（`local.rs:17227`）与 `uring_fd_cache_hides_a_healed_shard_until_invalidated`（`local.rs:17274`）专门钉死这些行为。

### 6.5 RLIMIT_NOFILE 门禁

512 个 fd **每磁盘**，`try_new` 无法预知磁盘总数，所以如果软 `RLIMIT_NOFILE` 太低（裸机非 systemd 常见的 1024），几个磁盘就会耗尽 fd（EMFILE）。`rlimit_allows_fd_cache`（`local.rs:3234`）要求软限制 **至少 16Ki** 才启用缓存，否则回退到 open-per-read。打包的 systemd unit 设了 1,048,576，所以调优过的部署不受影响。

---

## 七、O_DIRECT + io_uring：两个正交优化维度的组合

### 7.1 三层路径选择

原稿把 O_DIRECT 说得太简单（「io_uring + O_DIRECT = 零拷贝」一句带过）。RustFS 实际在每次读时按**合格性与能力**选路径（`local.rs:4085`，即 `pread_bytes` 内）：

1. **最佳路径**：io_uring + native O_DIRECT（`pread_uring_direct`）。同时拿到异步提交 + 绕过页缓存。
2. **次佳**：当 `direct_uring.supported == false`（文件系统拒绝 O_DIRECT），用 `StdBackend` 的对齐路径（它自己还能再退到 buffered）。
3. **兜底**：非 O_DIRECT 读走 buffered io_uring（`pread_uring`），任何错误回退到 `StdBackend`。

O_DIRECT 合格的条件（`local.rs:4085`）：`is_direct_io_read_enabled() && length > 0 && length >= get_direct_io_read_threshold()`（阈值默认 4 MiB）。

### 7.2 对齐探测与语义

`probe_direct_io_align`（`local.rs:1349`）用 `statx(STATX_DIOALIGN)`（内核 ≥ 6.1）探测设备的真实对齐要求，取 `stx_dio_mem_align` 与 `stx_dio_offset_align` 的最大值；探测不到时回退到 **4096**（对 512e/4Kn 设备都是安全上界）。结果缓存到 `DirectIoReadState.align`（`OnceLock`），每磁盘只探测一次。

`read_at_direct` 的语义：driver 读块对齐的超集范围到**块对齐的 buffer**，返回精确的逻辑范围。对齐 padding 永远到不了调用方。

### 7.3 一个真实的正确性细节

读侧收到 EINVAL/EOPNOTSUPP 时，`classify_direct_read_error`（`local.rs:3745`）会把**整个磁盘的 native O_DIRECT 路径** latching 关闭，并弹一个 `warn!`（而不是静默 `debug!`）。为什么？因为 O_DIRECT 的 `open` 已经成功了，一个**读时**的 EINVAL 更可能是「对齐路径的 bug」而不是「文件系统不支持」。之前的老代码静默降级，让一个真实的对齐 bug 变得几乎不可见（backlog#1214）。RustFS 用 `rustfs_io_uring_direct_read_einval_total` 计数器 + 每磁盘一次的 `warn!` 把这个信号浮出来。

---

## 八、真实源码精读——从探测到收割

这一章用 RustFS 仓库里**真实的调用点**替代原稿整段杜撰的伪代码。原稿 6.1~6.4 展示的 `buffer_pool`、`pending_table.insert`、手写 SQ/CQ 循环等，是虚构的——真实的 buffer 管理和 CQ 收割都在 `rustfs-uring` crate 内部，RustFS 只调用其干净 API。

### 8.1 探测与 Ring 创建

```rust
// local.rs:3585 —— UringBackend::try_new（逐磁盘探测）
pub(crate) fn try_new(root: PathBuf) -> Option<Self> {
    // 先查逐磁盘探测缓存：已知不支持的磁盘直接跳过
    if URING_UNSUPPORTED_DISKS.lock().expect("...").contains(&root) {
        return None;
    }
    let shards = get_io_uring_shards();
    match rustfs_uring::UringDriver::probe_and_start_sharded(URING_QUEUE_DEPTH, shards) {
        Ok(driver) => { /* 真正启用，见下方 */ }
        Err(err) => {
            if err.is_expected_restriction() {
                // 预期限制（seccomp/gVisor/老内核）：永久负缓存
                URING_UNSUPPORTED_DISKS.lock().expect("...").insert(root);
            }
            // 未预期错误（ENOMEM/EMFILE）：不缓存，重连时重试
            None
        }
    }
}
```

### 8.2 提交读请求：读路径永不离开 worker

```rust
// local.rs:3786 —— pread_uring（buffered io_uring 读）
async fn pread_uring(&self, volume: &str, path: &str, offset: usize, length: usize) -> Result<Bytes> {
    // 1. 先查描述符缓存（命中则无 open、无 spawn_blocking）
    let cached = match &cache_entry {
        Some((cache, key)) => cache.get(key).await,
        None => None,
    };
    let file = match cached {
        Some(file) => file,
        None => {
            // miss：spawn_blocking 上 open（带 generation 快照防竞态）
            // ... open + 校验 meta.len() >= end_offset ...
            file
        }
    };

    // 2. 大小决定快慢路径
    let bytes = if length <= URING_MAX_OP_LEN {
        // 快路径：单 op，driver 的 Vec 直接成为结果（零拷贝）
        match self.driver.read_at(file, offset_u64, length).await { /* ... */ }
    } else {
        // 超 128 MiB：拆成顺序小块逐个 await，绑定 in-flight 内存
        // ...
    };

    // 3. 短读校验：driver 重提交短读，所以短结果 = EOF = FileCorrupt
    if bytes.len() != length { return Err(DiskError::FileCorrupt); }

    // 4. 页缓存回收策略须与 StdBackend 一致（fadvise DONTNEED）
    if should_reclaim_file_cache_after_read(length) {
        reclaim_read_range(&file_for_reclaim, offset_u64, length)?;
    }
    Ok(Bytes::from(bytes))
}
```

### 8.3 fd 失效：heal/delete 的正确性保证

```rust
// local.rs:3367 —— FdCache::insert_if_fresh
async fn insert_if_fresh(&self, key: FdKey, file: Arc<std::fs::File>, gen_at_open: u64) {
    // open 期间发生了失效 → 拒绝缓存这个可能已经 stale 的 fd
    if self.generation.load(Ordering::Acquire) != gen_at_open {
        return;
    }
    self.cache.insert(key.clone(), file).await;
    // 再查一次，收窄插入与失效竞态的最小窗口
    if self.generation.load(Ordering::Acquire) != gen_at_open {
        self.cache.invalidate(&key).await;
    }
}
```

### 8.4 页缓存回收：行为一致性大于「用没用 io_uring」

`reclaim_read_range`（`local.rs:3253`）用 `fadvise(DONTNEED)` 把 `offset..offset+length` 从页缓存里逐出。这是**刻意的策略**——大对象读通常是冷的，留在缓存会逐出其他一切——由 `RUSTFS_OBJECT_FILE_CACHE_RECLAIM_READ_ENABLE`（默认开）和 4 MiB 阈值控制。关键点：**它是 StdBackend 的行为，不是 io_uring 的产物**，所以启用 io_uring 不能静默改变页缓存驻留语义。回收窗口还会页对齐（匹配 mmap 路径的 `[aligned_offset, offset+length)`），否则 bitrot shard 的 32 字节块头会让偏移偏离页边界，导致 mmap 与 io_uring 路径的驻留不同（backlog#1173）。

---

---

## 九、性能数据——能核实的数字，和需要警惕的数字

原稿表格里那些「1.58M IOPS、98.4 GB/s、P99 0.78ms、空闲内存 <100MB」以及「系统调用减少 70%」等在 RustFS 仓库源码里**找不到出处**，属于不可靠的杜撰数据，本版已删除。下面是能**从源码注释直接核实**的实测数字：

### 9.1 分片对缓存命中读的线性扩展（16 核主机，backlog#1145）

| 分片数 | 1 MiB 读吞吐 | 64 KiB 读 @ 并发 32 |
|---|---|---|
| 1 | 4911 MB/s | 124k IOPS |
| 2 | 8969 MB/s | — |
| 4 | 15806 MB/s | — |
| 8 | 47361 MB/s | 345k IOPS |

> 注意：**这是缓存命中**的读。命中页缓存的 buffered 读在 `io_uring_enter` 内同步完成，memcpy 由 driver 线程执行，所以吞吐被单核内存带宽锁死；分片近似线性抬升这个天花板。未命中（device-bound）的读不需要分片。

### 9.2 描述符缓存的收益（16 核主机，4-shard driver，backlog#1145）

去掉每次读的 `spawn_blocking` open 往返：**IOPS +36% ~ +180%，p999 延迟改善 3~5×**。

### 9.3 这些数字告诉我们什么

- **io_uring 的收益高度依赖工作负载**：高 QD、小 I/O、命中页缓存时收益最大；device-bound 的大 I/O 收益有限。
- **分片解决的是「缓存命中读的 memcpy 瓶颈」**，不是「设备吞吐瓶颈」。
- **fd cache 解决的是「open 的线程跳转」**，这是把 io_uring 的异步收益真正落地的关键。

### 9.4 关于「零拷贝」的诚实说明

RustFS 的 buffered io_uring 读路径**不是**零拷贝——数据仍从内核页缓存拷到用户态。真正的「直达」来自 **O_DIRECT**（绕过页缓存），那是第七章的内容。io_uring 削减的是系统调用/上下文切换，O_DIRECT 削减的是内存拷贝，两者是独立的收益来源。原稿把「io_uring 减少系统调用」和「零拷贝」混为一谈，是不准确的。

---

## 十、从 RustFS 学到的 io_uring 最佳实践

### 10.1 不要假设「用了 io_uring 就自动变快」

io_uring 的收益高度依赖工作负载：

- **高 QD、小 I/O、页缓存命中**：收益最大，因为系统调用减少的边际效应最高
- **低 QD、大 I/O、device-bound**：收益有限，因为 I/O 本身的时间远大于系统调用开销
- **缓存命中读**：需要**分片**才能突破单核 memcpy 带宽（见 9.1）

RustFS 的策略是：默认关闭、运行时探测、逐磁盘降级。

### 10.2 Cancel Safety 不是「可选优化」，是 correctness 问题

很多 io_uring 教程只展示「怎么提交和收割」，但生产环境中 **cancel safety 是生死线**。核心三问：

- Future 被 drop 时，内核是否还在操作 buffer？
- 你的 buffer 生命周期是否覆盖了整个 SQE → CQE 周期？
- Shutdown 时如何等待 in-flight I/O？

RustFS 的 **orphan table 所有权模型**是一个经过生产验证的模式：**buffer 和 fd 由 driver 持有到 CQE 到达，future 只是等待的句柄**。这个模式把「drop future」从「取消 I/O」中解耦出来，从根上消灭了 UAF。

### 10.3 运行时降级要「分级、可观测」

- **分级**：io_uring 子系统（`active`）和 native O_DIRECT 形状（`direct_uring.supported`）是两个独立 latch，一个失败不影响另一个。
- **errno 分类要窄**：只有 ENOSYS/EPERM 这类「子系统不可用」才降级整盘；per-file 的 EACCES、数据错误 EIO 都不该误伤。
- **可观测**：`latch_off_total`、`read_fallback_total`、`in_flight` 这些指标让灰度功能的状态看得见，而不是静默退化。

### 10.4 应用层 fd cache：比 IORING_REGISTER_FILES 更易控

原稿建议「用 `IORING_REGISTER_FILES` 减少 fd 查找开销」，但 RustFS 的选择是**应用层 moka 缓存**。原因在于存储系统的正确性约束：part 文件会被 heal/delete 替换 inode，需要一个**能精确失效、能感知 heal/delete 竞态**的缓存。应用层做的优势是：失效逻辑可以挂在 `delete`/`heal` 的提交点上，配合 generation 计数防 open-then-insert 竞态——这是 io_uring 注册文件做不到的。

### 10.5 页缓存行为必须与默认路径一致

引入新读后端，不能静默改变页缓存驻留语义。io_uring 读后同样要 `fadvise(DONTNEED)` 回收大读，且回收窗口要与 mmap 路径对齐。对存储系统而言，**行为一致性 > 用没用新特性**。

### 10.6 分片是扩展的关键，但要算清代价

单个 ring 的缓存命中读吞吐被单核内存带宽锁死，分片可线性提升。但代价是 `disks × shards` 个 driver 线程。默认从 `(并行度/4).clamp(1,4)` 起步，覆盖值 clamp `1..=16`，防止手误。

---

## 十一、结语：io_uring 不是终点，而是新的起点

RustFS 对 io_uring 的使用，展示了一个成熟存储系统如何**谨慎而深入**地拥抱新技术：

- **编译时防呆**：守卫脚本封禁 tokio 的全局 io-uring feature，只允许应用层、可探测、可回退的 `rustfs-uring`。
- **运行时自适应**：默认关闭、逐磁盘探测、per-file 回退、两级独立 latch。
- **Cancel safety 优先**：orphan table 所有权模型，把性能优化建立在 correctness 之上。
- **正确性细节**：fd cache 的 generation 失效、heal/delete 竞态防护、页缓存行为一致性、O_DIRECT 对齐的静默 bug 浮现。
- **灰度可观测**：latch/fallback/in_flight 指标，让新后端的状态看得见。

对于第一次接触 io_uring 的开发者，RustFS 的源码是一本活的教科书。它告诉我们：**io_uring 的强大不仅在于「减少了系统调用」，更在于它迫使我们重新思考「用户态与内核态的边界」、「异步 I/O 的生命周期管理」、「以及 Rust 的所有权模型如何与内核行为对齐」。**

这些思考，比任何性能数字都更有价值。

---

## 参考资源

- [RustFS 官方 GitHub](https://github.com/rustfs/rustfs)
- [rustfs-uring Crate (crates.io)](https://crates.io/crates/rustfs-uring)
- [rustfs-uring 文档 (docs.rs)](https://docs.rs/rustfs-uring)
- [rustfs-uring 仓库 (rustfs/uring)](https://github.com/rustfs/uring)
- [io_uring 内核文档](https://man7.org/linux/man-pages/man7/io_uring.7.html)
- [Tonbo: Async Rust is not safe with io_uring](https://tonbo.io/blog/async-rust-is-not-safe-with-io-uring)
- [ScyllaDB: How io_uring and eBPF will revolutionize programming in Linux](https://www.scylladb.com/2020/05/05/how-io_uring-and-ebpf-will-revolutionize-programming-in-linux/)
- [Red Hat Developer: Why you should use io_uring for network I/O](https://developers.redhat.com/articles/2023/04/12/why-you-should-use-iouring-network-io)
