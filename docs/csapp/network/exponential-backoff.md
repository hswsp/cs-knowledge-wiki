---
title: "网络拥塞指数退避算法详解"
description: "重试风暴、Capped Exponential Backoff、Jitter 与生产级 C++17 实现。"
---

> 当成千上万个客户端同时撞向一个濒临崩溃的服务时，最糟糕的"重试策略"，是大家整齐划一地"立即再试一次"。
>
> ——指数退避（Exponential Backoff）就是为了打破这种"步调一致的灾难"而生。

## 一、为什么需要退避？——从"重试风暴"说起

考虑一个常见场景：

- 某个核心服务出现抖动，1 秒内有 10000 个请求超时。
- 客户端实现了"重试 1 次"。
- 所有客户端在超时（例如 2s）后**同时**发起第二次请求。

后果是：服务刚刚有一点点恢复迹象，下一秒立刻被同等量级的流量再次击穿。这种现象在工业界有几个常见名字：

- **重试风暴（Retry Storm）**
- **惊群效应（Thundering Herd）**
- **同步化拥塞（Synchronized Congestion）**

问题的核心不是"该不该重试"，而是 **"什么时候重试" 以及 "大家是不是都挑同一个时刻重试"**。

指数退避算法回答的就是这两个问题。

---

## 二、什么是指数退避（Exponential Backoff）

定义非常简单：**第 n 次重试前，等待的时间随 n 指数级增长**。

最朴素的公式：

```
delay(n) = base * 2^n      （n = 0, 1, 2, ...）
```

举例：base = 100ms

| 第 n 次重试 | 等待时间 |
|------------|----------|
| 0          | 100 ms   |
| 1          | 200 ms   |
| 2          | 400 ms   |
| 3          | 800 ms   |
| 4          | 1.6 s    |
| 5          | 3.2 s    |
| 6          | 6.4 s    |

它带来的两个直接收益：

1. **给下游系统留出恢复时间**：每次失败后等待时间翻倍，自然地降低单位时间内的请求密度。
2. **总重试次数仍然有限**：相比固定间隔，指数增长能在较短的总时长内"放弃"，避免无意义死磕。

![固定 vs 指数退避](https://images.spumn.eu.cc/cs-knowledge-wiki/csapp/network/exponential-backoff/fig1_fixed_vs_exponential.svg)

---

## 三、不只是 2 倍——更通用的形式

工业代码里通常会写得更稳：

```
delay(n) = min(cap, base * factor^n)
```

- `base`：基础时长，常取 100ms ~ 1s
- `factor`：增长因子，常取 2，也有用 1.5 / 3 的
- `cap`：上限，避免重试间隔变成几十分钟，例如 30s

这种"带上限的指数增长"被称为 **Capped Exponential Backoff**。AWS SDK、gRPC、Kafka Client、etcd Client 几乎都是这种实现。

---

## 四、致命缺陷：纯指数退避仍然会"撞车"

仅靠指数增长**不足以**解决重试风暴。原因很直观：

> 所有客户端是在**几乎同一时刻**进入失败状态的，它们的重试时间表是一致的：100ms、200ms、400ms…… 哪怕等待时间在变长，**冲突时刻依然对齐**。

下图刻画了这种"对齐型撞车"：

![纯指数退避下的请求对齐](https://images.spumn.eu.cc/cs-knowledge-wiki/csapp/network/exponential-backoff/fig2_aligned_burst.svg)

可以看到，每一轮重试依然形成尖锐的脉冲，下游被反复"打靶"。

---

## 五、加入抖动（Jitter）：真正解决问题的那一步

AWS 工程师 Marc Brooker 在博客 *Exponential Backoff And Jitter* 中给出过一组著名的对比实验。结论可以总结为一句话：

> **"加 Jitter 比加 Backoff 更重要。"**

所谓 Jitter，就是给每次退避时间加一个**随机扰动**，让客户端在时间轴上"散开"。常见的三种实现：

### 5.1 Full Jitter（最常推荐）

```
delay = random(0, min(cap, base * 2^n))
```

含义：在 `[0, 当前指数上界]` 之间均匀采样。
特点：散得最开，对下游最友好。AWS 官方推荐。

### 5.2 Equal Jitter

```
temp  = min(cap, base * 2^n)
delay = temp/2 + random(0, temp/2)
```

含义：保留一半固定退避 + 一半随机。
特点：保证最小等待时间，避免太快重试。

### 5.3 Decorrelated Jitter（去相关抖动）

```
delay = min(cap, random(base, prev * 3))
```

每次抖动在"上次实际等待时间"基础上扩展，避免周期性同步。
特点：长尾控制更稳，被 AWS SDK v2 部分模块采用。

![Jitter 效果对比](https://images.spumn.eu.cc/cs-knowledge-wiki/csapp/network/exponential-backoff/fig3_jitter_effect.svg)

---

## 六、它和 TCP 拥塞控制是同一个思想吗？

是的，**精神是一致的，机制略有差异**。

| 对比维度 | TCP 拥塞控制 | 应用层重试退避 |
|---------|--------------|----------------|
| 触发信号 | 丢包 / RTO 超时 / ECN | HTTP 5xx / 超时 / 限流 |
| 退避主体 | 拥塞窗口 cwnd / RTO | 重试时间间隔 |
| 经典算法 | 慢启动 + 拥塞避免 + 快重传 + RTO 指数退避 | Capped Exp Backoff + Jitter |
| 抖动 | RTO 计算引入了 RTT 方差（Jacobson 算法） | Jitter 显式随机化 |

特别值得一提的是 **TCP RTO 的指数退避**（RFC 6298）：每次重传超时未收到 ACK，RTO 翻倍，直至上限（通常 60s）。这是指数退避在协议栈里的最经典化身——你今天写业务代码用的退避，本质上就是把传输层的智慧搬到了应用层。

---

## 七、参考实现（生产级 C++17 代码）

下面给出一个集成 "上限 + Full Jitter + 最大重试次数 + 取消信号" 的实现，仅依赖 C++17 标准库，可直接用于 HTTP / RPC 客户端封装：

```cpp
// retry.hpp
#pragma once
#include <atomic>
#include <chrono>
#include <condition_variable>
#include <functional>
#include <mutex>
#include <random>
#include <stdexcept>

namespace retry {

struct Config {
    std::chrono::milliseconds base{100};   // 基础间隔
    std::chrono::milliseconds cap{30'000}; // 上限
    int max_retries{6};                    // 最大重试次数
};

// 取消令牌：调用方可在任意线程调用 cancel() 提前中止。
class CancelToken {
public:
    void cancel() {
        {
            std::lock_guard<std::mutex> lk(mu_);
            cancelled_ = true;
        }
        cv_.notify_all();
    }

    [[nodiscard]] bool cancelled() const noexcept { return cancelled_.load(); }

    // 等待 d 或被 cancel；返回 true 表示在等待期间被取消。
    bool wait_for(std::chrono::milliseconds d) {
        std::unique_lock<std::mutex> lk(mu_);
        return cv_.wait_for(lk, d, [this] { return cancelled_.load(); });
    }

private:
    mutable std::mutex      mu_;
    std::condition_variable cv_;
    std::atomic<bool>       cancelled_{false};
};

// 执行 fn，失败时按 Full Jitter 指数退避重试。
// fn 返回 true 表示成功；返回 false 表示需要重试。
// 全程通过 token 支持外部取消，被取消则抛出 std::runtime_error。
template <typename Fn>
bool Do(const Config& cfg, CancelToken& token, Fn&& fn) {
    static thread_local std::mt19937_64 rng{std::random_device{}()};

    for (int n = 0; n <= cfg.max_retries; ++n) {
        if (token.cancelled()) {
            throw std::runtime_error("retry cancelled");
        }
        if (std::forward<Fn>(fn)()) {
            return true;
        }
        if (n == cfg.max_retries) {
            break;
        }

        // 指数上界：base * 2^n，受 cap 约束（注意防溢出）
        auto upper_ms = cfg.base.count();
        if (n < 31 && upper_ms <= (cfg.cap.count() >> n)) {
            upper_ms <<= n;
        } else {
            upper_ms = cfg.cap.count();
        }

        // Full Jitter：[0, upper) 内均匀采样
        std::uniform_int_distribution<long long> dist(0, upper_ms - 1);
        std::chrono::milliseconds sleep{dist(rng)};

        if (token.wait_for(sleep)) {
            throw std::runtime_error("retry cancelled");
        }
    }
    return false;
}

} // namespace retry
```

调用示例：

```cpp
#include "retry.hpp"
#include <iostream>

int main() {
    retry::Config cfg{
        .base = std::chrono::milliseconds(100),
        .cap  = std::chrono::seconds(30),
        .max_retries = 6,
    };
    retry::CancelToken token;

    bool ok = retry::Do(cfg, token, [] {
        // TODO: 真实业务调用，例如 HTTP GET / RPC
        // 返回 true 表示成功；false 表示触发重试
        return false;
    });

    std::cout << (ok ? "success" : "all retries exhausted") << std::endl;
}
```

几条工程经验：

1. **重试要看错误类型**：4xx（除 408/425/429）通常不该重试；连接超时、5xx、限流可以退避后重试。
2. **幂等性是前提**：非幂等写操作（POST 创建订单）切忌盲目重试，否则会出现"我只点了一次，订单建了三个"。
3. **客户端要有"重试预算"**：除单次请求的重试上限外，进程级也应有总预算（例如 1 分钟内总重试 ≤ N 次），防止雪崩。
4. **服务端要配合 `Retry-After`**：在 429 / 503 响应头里告知客户端最早可重试时间，比客户端自己猜更准。
5. **可观测性**：埋点 `retry_count`、`backoff_duration`、`final_status`，用于事后定位是否发生了重试风暴。

---

## 八、它在工业界的身影

- **AWS SDK / Boto3**：默认 Capped Exp Backoff + Full Jitter
- **gRPC**：`grpc-retry-policy` 支持 `initial_backoff`、`max_backoff`、`backoff_multiplier`，并支持 jitter
- **Kafka Producer**：`retry.backoff.ms`（线性）+ 0.2 抖动；新版本支持指数
- **以太网 CSMA/CD**：经典的 **Binary Exponential Backoff**（最早的指数退避，1970s 就有了）
- **Bitcoin / 区块链 P2P 节点**：连接失败时使用指数退避避免 DDoS 自家网络

可以看到，从最底层的物理链路（CSMA/CD），到传输层（TCP RTO），再到应用层（HTTP 重试），**指数退避 + 抖动**是贯穿整个网络协议栈的"通用解药"。

