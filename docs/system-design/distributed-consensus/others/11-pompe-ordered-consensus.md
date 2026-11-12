# Pompē（Pompe）：拜占庭有序共识协议详解

> 本文系统介绍 Pompē（OSDI 2020 Best Paper）如何解决传统 BFT SMR 中"拜占庭寡头"操纵交易顺序的问题，以及它背后的有序共识（Ordered Consensus）抽象。

## 1. 从 Paxos/Raft 到 Pompē：为什么我们需要关心"顺序"

### 1.1 Paxos/Raft 的世界观

学过 Paxos 和 Raft 的同学都知道，状态机复制（SMR）的正确性标准可以用三句话概括：

- **Agreement（一致性）**：所有正确节点决定相同的值；
- **Validity（合法性）**：决定的值必须由某个节点提出；
- **Termination（终止性）**：所有正确节点最终做出决定。

对于像分布式 KV 存储、配置管理（如 etcd/ZooKeeper）这样的场景，这套标准完全够用：**只要所有副本按同一顺序执行命令，线性一致性就能满足，具体是哪个顺序并不重要**。

### 1.2 区块链带来的新问题

当 BFT SMR 被应用到许可链（permissioned blockchain）场景时，事情发生了变化。在区块链 DeFi 应用中，**交易的具体顺序直接决定经济利益**：

- **抢跑攻击（Front-running）**：攻击者看到一笔大额买单后，提前挂一个买单，待价格被推高后再卖出，赚取无风险差价。Flash Boys 2.0 研究表明，32 个月内仅这类攻击就在以太坊上套利 8900 万美元。
- **三明治攻击（Sandwich Attack）**：攻击者在受害者交易前后各放一笔交易，受害者因此被"夹"在中间以更差价格成交。32 个月内三明治攻击在以太坊上造成 1.74 亿美元损失。

传统 SMR 规约对"顺序应该长什么样"完全沉默。PBFT、HotStuff 等 BFT 协议中，**主节点（primary/leader）单方面决定出块顺序**——一个拜占庭主节点可以肆无忌惮地把特定交易放在前或放在后，这就是论文所说的 **"拜占庭寡头"（Byzantine Oligarchy）**。

### 1.3 核心洞察：顺序应当是"一等公民"

Pompē 的核心观点是：**顺序本身就是一个需要被规约和证明的属性**，而不只是"达成一致就行"。论文作者 Yunhao Zhang（Cornell）等人在 OSDI 2020 上提出：

> 传统 BFT SMR 的正确性规约没有语言表达"顺序公平性"。我们引入**拜占庭有序共识（Byzantine Ordered Consensus）**这一新原语，把排序从共识中剥离出来，用民主的方式决定顺序。

这篇论文获得了 **OSDI 2020 最佳论文奖**。

---

## 2. 问题定义：什么是"有序共识"

### 2.1 传统 BFT SMR 的规约缺口

传统 SMR 只保证：

1. **Safety（安全性）**：正确副本不会提交两个冲突的日志条目；
2. **Liveness（活性）**：所有正确客户端请求最终都会被提交。

注意：规约里**完全没有**说"如果所有正确节点都先看到 c1 再看到 c2，那么 c1 就该排在 c2 前面"。这就给了拜占庭节点操纵顺序的空间。

### 2.2 Ordering Linearizability（顺序线性一致性）

Pompē 在 Safety/Liveness 之外，引入了一个全新的性质：

> **Ordering Linearizability**：若任何正确副本分配给 c2 的最小时间戳，都大于任何正确副本分配给 c1 的最大时间戳，则 c1 必然排在 c2 之前——无论拜占庭节点如何操作。

直观理解：**当所有正确副本在时间戳上"一致认为" c1 早于 c2 时，最终账本顺序必须反映这一点**。这类似于线性一致性在并发对象语义上的要求，只不过对象变成了"账本顺序"。

作者证明了一个关键的不可能结论（灵感来自 Arrow 不可能性定理和 Gibbard-Satterthwaite 定理）：

> **定理**：没有协议能同时满足"自由意志（Free Will，每个正确节点都能表达自己对顺序的偏好）"和"顺序一致性（Ordering Unanimity，当所有正确节点都同意顺序时强制遵循）"。

也就是说，**拜占庭对顺序的影响无法被彻底消除，只能被限制**。Pompē 的目标就是把这种影响用可证明的边界框住。

### 2.3 Ordering Indicator（排序指示符）

每个副本为每条命令关联一个 **ordering indicator**（Pompē 选用的是时间戳）。这个时间戳代表该副本希望命令被放置的位置。

- 如果正确副本给 c1 的时间戳都小于给 c2 的时间戳，那么 c1 必须排在前面；
- 如果时间戳区间有重叠，拜占庭节点有一定的回旋余地，但被 Pompē 的 median 机制严格约束。

---

## 3. Pompē 协议详解

Pompē 不是一个完整的 BFT 协议，而是**构建在任意标准 BFT 协议之上的一个排序层**。论文原型基于 HotStuff 实现（代码：https://github.com/Pompe-org/Pompe-HS ），也可以接 SBFT、PBFT 等。

### 3.1 系统模型

- **节点数**：n = 3f+1，容忍最多 f 个拜占庭副本；
- **网络模型**：部分同步（partial synchrony），存在未知的 GST（Global Stabilization Time）；
- **密码学**：使用数字签名（sigma_i 表示节点 i 的签名）；
- **角色**：每个副本都可以充当 proposer（提议者），Pompē 是**无领导者的排序协议**（leaderless for ordering）。

### 3.2 两阶段架构：Ordering + Consensus

Pompē 把整条流水线拆成两个清晰分离的阶段：

```
+---------------------+      +---------------------+
|   Ordering Phase    |      |   Consensus Phase   |
|   (民主决定时间戳)   | ---> |  (底层 BFT 批量提交)  |
+---------------------+      +---------------------+
       Pompē 负责                    HotStuff/SBFT 负责
```

- **Ordering Phase**：为每条命令协商一个"民主"的时间戳 ts_m，这是 Pompē 的核心创新；
- **Consensus Phase**：周期地把已经排好序的命令打包成 batch，交给底层 BFT 协议（如 HotStuff）提交。

这种解耦的好处：排序逻辑和共识逻辑互不干扰，可以任意替换底层共识。

### 3.3 Ordering Phase：两个子步骤

#### Step 1：Propose Order（提议时间戳）

某个副本 i 收到客户端命令 c 后，成为该命令的 proposer，广播：

```
<RequestTS, c>_{sigma_i}
```

向所有副本征集"我希望这条命令在什么位置"的投票。每个副本 j 收到后，用自己的本地时钟返回一个偏好时间戳：

```
<ResponseTS, c, ts>_{sigma_j}
```

这里的 ts 是副本 j 本地的物理/逻辑时间，代表它"多早看到了 c"。

#### Step 2：Lock Order（锁定中位数时间戳）

Proposer 收集 ResponseTS 消息，直到凑齐一个 **2f+1 的 quorum**，把这些时间戳放入集合 T。然后 Pompē 的关键操作：**取中位数**：

```
ts_m = median(T)
```

Proposer 接着广播：

```
<Sequence, ts_m, c, T>_{sigma_i}
```

每个副本 j 收到后，验证：

1. 附带的 T 确实包含 2f+1 个有效签名；
2. ts_m 确实是 T 中时间戳的中位数；
3. ts_m 高于所有之前为该命令接受过的序号（防止 replay）。

验证通过则回复：

```
<SequenceResponse, ack, h>_{sigma_j}
```

否则回复 `nack`，其中 h = Hash(Sequence message)。

**为什么取中位数？**

关键性质：在 2f+1 个时间戳中，至少 f+1 个来自正确副本。中位数被两侧至少 f+1 个时间戳夹在中间，因此：

- **下界**：至少有 f+1 个正确副本的时间戳 <= ts_m，所以中位数不会无底线地被拜占庭节点拉低；
- **上界**：同理，至少有 f+1 个正确副本的时间戳 >= ts_m，所以中位数不会被无限推高。

这就是论文保证 ordering linearizability 的数学基础——拜占庭节点最多只能在正确节点时间戳构成的区间内"微调"，无法完全支配结果。

### 3.4 Consensus Phase：批量提交

Ordering phase 给每条命令分配好 ts_m 后，Pompē 周期性地（按预定义时间间隔）把一段时间内所有有序命令打包成 batch，交给底层的 BFT 协议（如 HotStuff）执行标准共识：

- 底层 BFT 按 ts_m 升序排好 batch；
- 走标准的 pre-prepare/prepare/commit（PBFT 风格）或 HotStuff 的三阶段流水线；
- 一旦 batch 被 commit，所有副本按 ts_m 顺序执行。

这一阶段 Pompē 不做新设计——它复用现有 BFT 的全部成果（view change、检查点、恢复等）。

### 3.5 View Change

Pompē 自身**没有独立的 view-change 机制**。当底层 BFT 的主节点失效时，ordering phase 也无法继续进行，Pompē 直接依赖底层 BFT 的 view-change 协议来处理。

这是一个论文明确指出的开放问题：如何安全地把 Pompē 的 ordering state 和外部 BFT 的 view change 整合起来，还需要进一步工作。

---

## 4. 一个具体例子：为什么 median 能抵御寡头

假设 n=4, f=1，3 个正确副本（R1, R2, R3），1 个拜占庭副本（B）。两条命令 c1, c2 几乎同时到达，正确副本本地时间戳如下：

| 副本 | c1 的 ts | c2 的 ts |
|------|----------|----------|
| R1   | 100      | 105      |
| R2   | 102      | 103      |
| R3   | 104      | 108      |
| B    | ?        | ?        |

B 想让 c2 排在 c1 前面，它会怎么操作？

- 在 c1 的 quorum 里，B 报一个巨大值（如 999），想把中位数拉高；
- 在 c2 的 quorum 里，B 报一个极小值（如 0），想把中位数拉低。

**结果**：

- c1 的 T = {100, 102, 104, 999}，中位数 = 103；
- c2 的 T = {105, 103, 108, 0}，排序后 {0, 103, 105, 108}，中位数 = 104。

所以 c1 的 ts_m = 103 < c2 的 ts_m = 104，**c1 仍然排在前面**——B 的操纵失败了。

如果 B 把 c1 的 ts 写成 101，c2 的 ts 写成 106，那中位数分别是 101.5 和 105.5，结果依然正确。

**直觉**：因为中位数对极端值不敏感（robust statistics），拜占庭节点最多只能把中位数移动到"最靠内的正确节点时间戳"的位置，无法跨越正确节点形成的"区间屏障"。这就严格限制了 ordering manipulation 的能力，把它收敛在可证明的边界里。

---

## 5. 安全性与活性论证

### 5.1 安全性（Ordering Linearizability）

**定理**：在 Pompē 中，若对于命令 c_a, c_b，所有正确副本给 c_a 的时间戳都小于给 c_b 的时间戳，则最终 c_a 必然在 c_b 之前提交。

证明思路（略述）：

- 设正确副本给 c_a 的最大时间戳为 H_a，给 c_b 的最小时间戳为 L_b，假设 H_a < L_b；
- 任意 c_a 的 quorum T_a 含 2f+1 个时间戳，其中至少 f+1 个来自正确副本，它们的值都 <= H_a，故中位数 ts_m_a <= H_a；
- 同理，c_b 的中位数 ts_m_b >= L_b；
- 于是 ts_m_a <= H_a < L_b <= ts_m_b，最终按 ts_m 排序时 c_a 一定在前。

这个证明正是 Pompē 防止拜占庭寡头的核心——它把"顺序公平性"变成了一个可被严格证明的性质，而不再是口头承诺。

### 5.2 活性

在 GST 之后（网络进入同步期），所有消息在已知时延内送达：

- Proposer 总能在时限内收齐 2f+1 个 ResponseTS；
- Sequence 消息总能被所有正确副本 ack；
- 底层 BFT 的活性保证 batch 最终 commit。

因此 Pompē 在部分同步模型下满足 liveness。

### 5.3 与 Raft/Paxos 的对比视角

| 维度            | Paxos/Raft           | PBFT/HotStuff        | Pompē                       |
|-----------------|----------------------|----------------------|-----------------------------|
| 故障模型        | 崩溃故障             | 拜占庭故障           | 拜占庭故障                  |
| 顺序决定者      | Leader               | Primary              | Quorum 投票（中位数）       |
| 顺序公平性规约  | 无                   | 无                   | Ordering Linearizability    |
| 是否防寡头      | N/A                  | 否                   | 是（可证明）                |
| 阶段数          | 2（Paxos）/2（Raft） | 3（PBFT）/3（HotStuff）| Ordering 2 + Consensus 3   |
| 通信复杂度      | O(n)                 | O(n^2)/O(n)          | O(n) + 底层 X               |
| 适用场景        | 数据中心复制         | 通用 BFT SMR         | 区块链/DeFi（顺序敏感）     |

---

## 6. Pompē 的局限与后续演进

### 6.1 Pompē 本身的局限

论文和后续工作指出了 Pompē 的若干不足：

1. **不防"非拜占庭"的偏见**：Pompē 的时间戳是"副本收到命令的时刻"，这天然混入了**网络延迟、地理位置**等无关特征（irrelevant features）。一个离欧洲节点近的客户端，即使和澳洲客户端同时发起请求，在 Pompē 中也会被排到前面——这是系统性偏见（systemic bias），不是拜占庭问题，但仍然不公平。
2. **与外部 view-change 的整合未明**：Pompē 依赖底层 BFT 处理主节点失效，但 PBFT 的 cross-view commit 等机制如何与 ordering state 交互，论文留作开放问题。
3. **部分同步模型的限制**：Pompē 在异步网络下无法工作（攻击者可以任意操控消息延迟）。

### 6.2 后续工作 Chronos：异步网络下的有序共识

2023 年，Zhang 等人提出了 **Chronos**（*An Efficient Asynchronous Byzantine Ordered Consensus*，The Computer Journal），解决了 Pompē 在异步网络下失效的问题。Chronos 提出了 signal asynchronous common subset（SACS）原语，在异步模型下也能实现有序共识，不再假设消息延迟有界。

### 6.3 后续工作 Bercow：加入随机性以实现 Equal Opportunity

2025 年，Zhang 等人在论文 *Ordered Consensus with Equal Opportunity*（arXiv:2509.09868）中提出了 **Bercow**——Pompē 的直接后继，核心改进是：

- 引入社会科学中的 **Equal Opportunity（机会平等）** 概念：相关特征（relevant feature，如调用时间）相同的命令应该有相等的概率被排在任意位置；
- 引入 **Secret Random Oracle (SRO)** 组件：用 TEE（SGX）或 threshold VRF 产生可信随机数，对 Pompē 分配的中位数时间戳加上随机噪声 eta_i，用修改后的时间戳 t'_i = t_i + eta_i 排序；
- 证明了 **epsilon-Ordering Equality** 和 **Delta-Ordering Linearizability** 之间的量化权衡：噪声越大，公平性越好（epsilon 越小），但顺序线性一致性窗口越宽（Delta 越大）；
- 实验表明，Delta_noise = 5·Delta_net 时，Bercow 可以把偏见控制在 10% 以内，吞吐量与 Pompē 持平，49 节点下中位延迟仅增加 14%。

### 6.4 其他相关工作

- **Aequitas / Themis**（Kelkar 等，CRYPTO 2020 / CCS 2021）：从另一个角度定义 order-fairness，采用 receive-order-fairness（若多数节点先收到 c1 则 c1 在前）；论文指出这类定义本质上仍然会放大地理位置带来的系统性偏见。
- **Wendy / Quick Order Fairness**（Cachin 等，2022）：进一步细化 order fairness 的定义。
- **EPaxos（Egalitarian Paxos）**：崩溃故障模型下的无 leader Paxos 变体，思想上与 Pompē 有相似之处（让所有副本都有发言权），但未提供拜占庭容错和顺序公平性证明。

---

## 7. 一句话总结 Pompē

> **Pompē 把"顺序谁说了算"从 leader 的独裁变成了 quorum 的民主——用中位数时间戳把拜占庭寡头对交易顺序的影响力锁死在一个可证明的区间内，从而首次在 BFT SMR 中把"顺序公平性"做成了可以被严格规约和证明的性质。**

理解 Pompē 的关键是跳出"leader 决定顺序"的思维定式：当顺序本身有经济价值时，我们需要的不再是"选一个 leader 来排序"，而是"用民主投票 + 鲁棒统计的方式，让没有任何小团体能够控制顺序"。Pompē 的 median-of-quorum 机制恰好做到了这一点——它用一个极其简洁的构造，把社会选择理论中防操纵的思想（中位数法）落地到了拜占庭容错的工程实践中。

---

## 参考与论文

- **原始论文（OSDI 2020 Best Paper）**：Yunhao Zhang, Srinath Setty, Qi Chen, Lidong Zhou, Lorenzo Alvisi. *Byzantine Ordered Consensus without Byzantine Oligarchy*. OSDI 2020.
  - USENIX 页面：https://www.usenix.org/conference/osdi20/presentation/zhang-yunhao
  - PDF：https://www.usenix.org/system/files/osdi20-zhang_yunhao_0.pdf
  - Slides：https://www.usenix.org/sites/default/files/conference/protected-files/osdi20_slides_zhang.pdf
  - 开源实现（基于 HotStuff）：https://github.com/Pompe-org/Pompe-HS
- **Bercow 扩展（Equal Opportunity + SRO）**：Yunhao Zhang et al. *Ordered Consensus with Equal Opportunity*. arXiv:2509.09868, 2025. https://arxiv.org/abs/2509.09868
- **Chronos（异步模型下的有序共识）**：Zongyang Zhang et al. *Chronos: An Efficient Asynchronous Byzantine Ordered Consensus*. The Computer Journal, 2023. https://doi.org/10.1093/comjnl/bxad048
- **博士论文**：Yunhao Zhang. *Ordered Consensus with Equal Opportunity*. Cornell PhD Thesis, 2024. https://ecommons.cornell.edu/items/6c7e6de3-cca7-4afc-84cb-72c199d2d870
