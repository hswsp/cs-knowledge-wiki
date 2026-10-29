---
title: "Part 2：交叉熵是什么？（压缩即智能）"
description: "从跨语言压缩聚类切入，定义交叉熵、推导大模型预训练损失函数为什么必须是负对数似然，介绍知识蒸馏与 KL 散度。"
---

# 交叉熵是什么？：压缩即智能 Part 2

> [But what is Cross-Entropy? | Compression is Intelligence Part 2](https://www.3blue1brown.com/lessons/cross-entropy/#but-what-is-cross-entropy-compression-is-intelligence-part-2)

---

## 开场：用 zip 压缩给语言建家谱

![开场：语言树与压缩](https://images.spumn.eu.cc/math/information-theory/compression-is-intelligence/part2/p2_000.jpg)

Grant 用一个 2002 年的妙趣论文 *Language Trees and Zipping* 开场：**只用通用文件压缩，就能自动发现语言之间的亲缘关系**。

做法朴素到近乎玩笑：

1. 把每种语言的大量文本喂给同一个压缩器（比如 gzip / zip）
2. 把两份不同语言的文本**拼在一起**再压缩
3. 如果两门语言亲缘关系近（比如西班牙语和葡萄牙语），拼起来压得比各压各的小得多——它们共享很多统计规律；如果完全无关，拼起来几乎没有额外压缩收益

仅凭这个「拼起来能多省多少比特」，就能把语言聚类，甚至重建出印欧语系的谱系树。

这背后的魔法量正是本文主角：**交叉熵（cross-entropy）**。它衡量「用为分布 P 优化的压缩码，去压缩服从分布 Q 的数据，平均要多花多少比特」。

---

## 1. 复习：什么是最优码

![前缀码复习](https://images.spumn.eu.cc/math/information-theory/compression-is-intelligence/part2/p2_180.jpg)

承接 Part 1，对一个已知分布 P：

- **最优前缀码**给概率为 $p$ 的符号分配大约 $-\log_2 p$ 比特
- 平均码长就是熵 $H(P) = -\sum_i p_i \log p_i$，这是压缩下界

可视化仍然是那个水平条形图：每条宽度 = 概率 $p_i$，高度 = 码长 $-\log p_i$，总面积 = 平均码长 = 熵。

---

## 2. 定义交叉熵：用错模型的代价

![交叉熵几何](https://images.spumn.eu.cc/math/information-theory/compression-is-intelligence/part2/p2_360.jpg)

现在引入第二个分布 Q——代表你**以为**的概率（或你手头语言模型给出的概率）。你根据 Q 设计了一套码：对符号 i 分配 $-\log_2 q_i$ 比特。

但真实数据其实来自分布 P。那么实际平均码长是多少？**按真实分布 P 加权求和**：

$$H(P, Q) = -\sum_i p_i \cdot \log_2 q_i$$

这就是 **P 相对于 Q 的交叉熵**（注意顺序：真实分布在前，模型分布在后）。

### 几何直观

Part 1 里熵 H(P) 的矩形高度由 $-\log p_i$ 决定；交叉熵的矩形高度换成 $-\log q_i$（模型以为的码长），但宽度仍按真实 $p_i$ 加权。所以：

- 如果 $Q = P$，每条高度 = $-\log p_i$，面积 = $H(P)$ —— 回到最优
- 如果 Q 偏离 P，高度变错：真实 $p_i$ 大的符号你给了太长的码（浪费），或真实罕见的符号你给了太短的码（冲突），总面积一定 $\geq H(P)$

### 关键性质

> **Gibbs 不等式**：H(P, Q) ≥ H(P)，等号当且仅当 P = Q。

交叉熵比熵多出的那部分就是"用错模型浪费的比特"——后文会给它一个名字：KL 散度。

---

## 3. 直觉与数值例子

![数值例子](https://images.spumn.eu.cc/math/information-theory/compression-is-intelligence/part2/p2_530.jpg)

用机器人例子（P: 上 1/2，下 1/4，左 1/8，右 1/8）来演示"用错码"的后果。

假设你不知道真实分布，误以为四个方向等概率（Q = 均匀 1/4），于是给每个都分配 2 比特：

- 交叉熵 $H(P,Q) = \tfrac{1}{2}\cdot 2 + \tfrac{1}{4}\cdot 2 + \tfrac{1}{8}\cdot 2 + \tfrac{1}{8}\cdot 2 = 2$ 比特
- 熵 $H(P) = \tfrac{1}{2}\cdot 1 + \tfrac{1}{4}\cdot 2 + \tfrac{1}{8}\cdot 3 + \tfrac{1}{8}\cdot 3 = 1.75$ 比特
- 浪费 = **0.25 比特/指令**

如果 Q 更离谱（比如以为右方向出现得最多），浪费会更大。交叉熵就是这样一把刻度尺，精确衡量"你这份概率模型有多么不对"。

---

## 4. 回到语言树

![语言树结果](https://images.spumn.eu.cc/math/information-theory/compression-is-intelligence/part2/p2_700.jpg)

回到开场的语言聚类实验：

- 对语言 A 的语料训练/拟合一个模型（等价于拿到了一个分布 $P_A$），并用它压 A 文本 → 码长 ≈ $H(P_A)$
- 用同一个模型去压语言 B 的文本 → 码长 ≈ $H(P_B, P_A)$
- 差值 $H(P_B, P_A) - H(P_B)$ 就是 KL 散度，衡量"A 和 B 有多不一样"

把两两之间的这个"浪费比特数"当作距离矩阵，就能聚类、建谱系树。最妙的是：**你根本不需要懂那些语言，也不需要任何语言学先验**，一台通用压缩器就够了。

---

## 5. 大模型预训练：把交叉熵当损失函数

![预训练](https://images.spumn.eu.cc/math/information-theory/compression-is-intelligence/part2/p2_1000.jpg)

现在跳到机器学习。大语言模型预训练就是 next-token prediction：给定上文，模型对词表中每个可能的下一个 token 输出一个概率分布 Q。真实训练数据里确实出现的那个 token 记为 `x*`（one-hot 分布 P）。

每一步的损失定义为：

$$L = -\log q(x^*)$$

整个训练集上的平均损失是：

$$\langle L \rangle = -\sum_x P(x) \cdot \log q(x) = H(P, Q)$$

**预训练最小化的平均负对数似然，恰恰就是交叉熵。** 用压缩的语言说：模型学到的分布 q 越接近数据里的真实分布 p，用 q 设计的码压数据就越省比特——预训练**就是在把模型训练成一个更好的文本压缩器**。

![损失函数推导](https://images.spumn.eu.cc/math/information-theory/compression-is-intelligence/part2/p2_1180.jpg)

Grant 特别强调：这里的"P"不是某个神秘的"语言真实分布"，**它就是经验分布**——训练数据里 token 出现的频率。所谓"让模型拟合数据"，就是让 q 去逼近这个经验分布。

---

## 6. 为什么非得用 log 不可？

![为什么是 log](https://images.spumn.eu.cc/math/information-theory/compression-is-intelligence/part2/p2_1400.jpg)

面对损失函数形式 $-\log q(x^*)$，一个自然问题是：满足"模型输出概率越高 → 损失越小；越低 → 惩罚越大"这种单调递减形状的函数有无数种，为什么偏偏选中 log？

Grant 用一个简短但漂亮的论证说明你的手**被迫**选 log：

### 设定

考虑一个模式 `"my name is ___"` 在数据中出现多次，不同名字出现的频率是 P(name)。对每个位置，模型输出分布 Q(name)。我们希望损失函数 f(q) 满足：

> **一致性要求**：在所有例子上取平均损失，这个平均在 Q = P（模型输出频率 = 数据频率）时达到最小。

即要求：

$$\sum_{\text{name}} p_{\text{name}} \cdot f(q_{\text{name}}) \quad \text{在 } q = p \text{ 时取最小值，且 } \sum q_{\text{name}} = 1$$

### 证明思路（拉格朗日乘子）

带约束 $\sum q = 1$ 最小化 $\sum p\cdot f(q)$，最优条件是梯度成比例：

$$p \cdot f'(q) = \lambda \;\;\Longrightarrow\;\; f'(q) \propto \frac{1}{q}$$

积分得 $f(q) = C \cdot \log q + \text{const}$。要让损失随 $q$ 递减，常数 $C$ 必须为负，于是 $f(q) = -\log q$（或常数倍，对数换底不影响优化）。

> **结论**：只要你要求"平均损失最小当且仅当模型分布匹配数据分布"这一条性质，负对数似然 / 交叉熵就是**唯一**的选择，没有别的函数能同时满足。

这是交叉熵在机器学习里无处不在的根本原因——不是因为它"启发式地合理"，而是被数学唯一性钉死的。

---

## 7. 知识蒸馏：让小模型学大模型的"软分布"

![知识蒸馏](https://images.spumn.eu.cc/math/information-theory/compression-is-intelligence/part2/p2_1730.jpg)

交叉熵还以一种更柔软的方式出现在**知识蒸馏（distillation）**里。

情境：你有一个很大的老师模型（参数多、效果好但推理贵），想训练一个小模型（学生）模仿它。

### 朴素做法：硬标签训练

直接用普通预训练目标，在每个位置让学生去拟合数据里"那个正确的 token"——和从零训练小模型没差，只是少走了弯路。

### 蒸馏做法：软标签训练

对每个上下文，把**老师模型对整个词表的概率分布**当作目标（不是 one-hot 的"正确答案"，而是包含"第二名、第三名也可能"的软分布）。让学生最小化：

$$L_{\text{distill}} = H(Q_{\text{teacher}}, Q_{\text{student}}) = -\sum_x q_{\text{teacher}}(x) \cdot \log q_{\text{student}}(x)$$

直觉对比：

- 硬标签：像看棋谱学棋，只看到"大师走了这步"
- 蒸馏：像大师坐在旁边说"这步我 80% 走 A，15% 走 B，5% 走 C"——**学生一次拿到完整的判断结构，而不只是最终选择**

在 "my name is ___" 这种例子上，硬标签需要见上万个例子才能让模型学到"哪些名字更常见"；蒸馏只要看一个例子，从老师的完整分布里直接读到"Grant 高概率、Bob 中等、X Æ A-12 极低"等全部信息。这也是为什么蒸馏能用少得多的数据把大模型的能力"压"进小模型。

---

## 8. KL 散度：交叉熵与熵之间的空隙

![KL 散度](https://images.spumn.eu.cc/math/information-theory/compression-is-intelligence/part2/p2_1900.jpg)

视频最后补一个在 ML 论文里无处不在的量：**Kullback-Leibler 散度**（KL 散度，相对熵）。

既然交叉熵 $H(P,Q) \geq H(P)$，且等号当 $P=Q$，定义它们的差：

$$D_{\text{KL}}(P \parallel Q) = H(P, Q) - H(P) = \sum_i p_i \cdot \log_2\frac{p_i}{q_i}$$

### 含义（从三种视角看）

- **压缩视角**：用错码（基于 Q）比用最优码（基于 P）平均每条消息多花的比特数
- **统计视角**：当真实分布是 P 却用 Q 去建模时损失的信息量
- **几何视角**：两个分布之间的"有向距离"——注意它**不对称**：$D_{\text{KL}}(P\parallel Q) \neq D_{\text{KL}}(Q\parallel P)$。P 相对于 Q 的 KL 和反过来是不同的量

### 和交叉熵的关系

$$H(P,Q) = H(P) + D_{\text{KL}}(P\parallel Q)$$

最小化交叉熵 ⟺ 在固定 P 的前提下最小化 KL 散度（因为 H(P) 是常数）。在训练里这俩等价，但 KL 散度更直接表达"模型离真实分布还差多少比特"。

### 三个留给观众的思考题（Grant 结尾抛出）

1. **代数练习**：证明 $\sum p\cdot\log(p/q) = -\sum p\cdot\log q - (-\sum p\cdot\log p)$，即上面那个简洁式和"交叉熵减熵"展开式是同一件事。
2. **几何对应**：对照视频里 KL 散度的条形图，看清楚哪部分矩形面积对应哪个项，并想明白为什么 KL 非对称。
3. **蒸馏再思考**：蒸馏里为什么用交叉熵 $H(Q_{\text{teacher}}, Q_{\text{student}})$ 而不是直接用 KL 散度 $D_{\text{KL}}(Q_{\text{teacher}}\parallel Q_{\text{student}})$？提示：对学生梯度而言，老师的熵 $H(Q_{\text{teacher}})$ 是常数——两者只差一个与学生参数无关的项，梯度等价；但交叉熵的数值稳定性和实现更简单。

---

## 关键概念速查

| 概念 | 公式 | 含义 |
|------|------|------|
| 熵 H(P) | $-\sum_i p_i \log p_i$ | 用 P 的最优码压 P-数据的最短平均长度 |
| 交叉熵 H(P,Q) | $-\sum_i p_i \log q_i$ | 用 Q 的码压 P-数据的平均长度；$\geq H(P)$ |
| KL 散度 $D_{\text{KL}}(P\parallel Q)$ | $\sum_i p_i \log(p_i/q_i)$ | 用错码多花的比特 = $H(P,Q)-H(P)$；非对称 |
| 最大似然 / 预训练损失 | $-\log q(x^*)$ | 单样本交叉熵 |
| Gibbs 不等式 | $H(P,Q) \geq H(P)$ | 用真分布的码永远最优 |
| 知识蒸馏 | $H(Q_{\text{teacher}}, Q_{\text{student}})$ | 让学生拟合老师的完整软分布 |

---

## 为什么 log 是被"逼"出来的（核心推导回放）

这是整篇最值得记住的推导，浓缩成三行：

1. 我们要求平均损失 $\sum_i p_i f(q_i)$ 在 $q = p$ 时（且 $\sum q_i = 1$）取最小
2. 拉格朗日条件：$\frac{\partial}{\partial q_i}\left[\sum_j p_j f(q_j) - \lambda(\sum_j q_j - 1)\right] = p_i f'(q_i) - \lambda = 0$
3. 对所有 i：$f'(q_i) = \lambda/p_i \Longrightarrow f(q) = C\cdot\log q + D$，单调性要求 $C<0$，取 $f(q) = -\log q$

这就是你在每个深度学习框架里看到的 `CrossEntropyLoss` / `softmax_cross_entropy_with_logits` 背后那个"为什么"。

---

## 下一步

Part 3 会兑现 Part 1 末尾的承诺：**亲手实现一种把"下一位预测器"变成压缩器的算法——算术编码（arithmetic coding）**。一旦你能把任何概率模型直接转成比特流，"预测 = 压缩"就不再是比喻而变成可运行的代码：模型预测得越好，压出的比特越短；把交叉熵当损失训练模型，等价于让它成为更好的压缩器。到那时回头看"压缩即智能"这句话，就会有一个非常具体的可操作含义。

