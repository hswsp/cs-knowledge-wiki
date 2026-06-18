---
title: "SVD 与伪逆"
description: "SVD 分解、Moore–Penrose 伪逆、正交投影与最小二乘的几何理解。"
---

# SVD 专题梳理

## 正交投影矩阵

如果 $V_r$ 是一个矩阵，它的每一列都是这些标准正交基 $v_i$：

$$
V_r = [v_1, v_2, \dots, v_r]
$$

那么根据矩阵乘法的分块法则：

$$
\boxed{V_r V_r^T = [v_1, v_2, \dots, v_r] \begin{bmatrix} v_1^T \\ v_2^T \\ \vdots \\ v_r^T \end{bmatrix} = v_1 v_1^T + v_2 v_2^T + \dots + v_r v_r^T}
$$

问：标准正交基下 $\displaystyle\sum v_i v_i^T$（即 $v v^T$ 的求和）是什么？

这个公式是线性代数中计算**正交投影矩阵**的标准形式。为了彻底理解，我们从"向量外积"的几何意义说起。

### 外积（outer product）

假设 $v$ 是一个**单位向量**（长度为1），那么 $v v^T$ 是一个 $n \times n$ 的矩阵。

> 结果是 **秩‑1 矩阵**

这个矩阵有一个性质：当你把它作用在任何向量 $x$ 上时，它会把 $x$ **垂直投射到 $v$ 所在的直线上**。

- **输入**：向量 $x$
- **操作**：$(v v^T) x = v (v^T x)$
- **结果**：$v^T x$ 是一个数字（标量），表示 $x$ 在 $v$ 方向上的投影长度。然后用这个长度去乘以单位向量 $v$，就得到了**投影后的向量**。

- $(v v^T)x = v(v^T x)$：**把 $x$ 正交投影到 $\operatorname{span}\{v\}$ 上**

即 $v v^T$ 就是一个**只负责投影到 $v$ 这一条直线**的微型投影仪。

----

若 $\{v_1,\dots,v_r\}$ 是行空间的一组标准正交基，则

- $v_1 v_1^T$：负责把向量投影到直线 $v_1$ 上
- $v_2 v_2^T$：负责把向量投影到直线 $v_2$ 上
- ...
- $v_r v_r^T$：负责把向量投影到直线 $v_r$ 上

**$\text{span}\{v_1,v_2,...v_r\}$就是由这 $r$ 条直线张成的（就像用 $r$ 根柱子撑起一个房间）。**

所以，把所有这些微型投影仪加起来：

$$
P_{A} = v_1 v_1^T + v_2 v_2^T + \dots + v_r v_r^T = \sum_{i=1}^r v_i v_i^T
$$

这就相当于在问："向量 $x$ 在这个由 $v_1$ 到 $v_r$ 构成的 $r$ 维空间里，到底占了多少分量？" 这就是**向整个行空间的正交投影**。

---

## 伪逆的定义（Moore–Penrose）

如果 $A$ 是方阵可逆，那么：

$$
A^{-1}A = I, \quad A^T \text{ 一般不是 } A^{-1}
$$

但对一般（甚至非方、秩亏）矩阵，我们定义 Moore-Penrose 伪逆 $A^+$，满足四条公理:

设 $A \in \mathbb{R}^{m\times n}$。其 **Moore–Penrose 伪逆** $A^+ \in \mathbb{R}^{n\times m}$ 是唯一满足下列四条 Penrose 方程的矩阵：
$$
\begin{aligned}
\text{(P1)}\ & A A^+ A = A \\
\text{(P2)}\ & A^+ A A^+ = A^+ \\
\text{(P3)}\ & (A A^+)^T = A A^+ \quad\text{（即 } AA^+ \text{ 是对称投影）}\\
\text{(P4)}\ & (A^+ A)^T = A^+ A \quad\text{（即 } A^+A \text{ 是对称投影）}
\end{aligned}
$$

其中关键两条是：

$$
AA^+A = A, \quad A^+AA^+ = A^+
$$

几何含义：

- $A A^+$ 是 $\mathbb{R}^m$ 上**投到列空间 $C(A)$ 的正交投影矩阵**——把任一向量 $b$ **沿** $C(A)^\perp = N(A^T)$ 方向"压扁"到 $C(A)$ 上。
- $A^+ A$ 是 $\mathbb{R}^n$ 上**投到行空间 $C(A^T)$ 的正交投影矩阵**——把任一向量 $x$ 沿 $C(A^T)^\perp = N(A)$ 方向压到 $C(A^T)$ 上。

**怎么理解"$AA^+$ 是投到 $C(A)$ 的正交投影"？**

把 $\mathbb{R}^m$ 沿正交直和拆开：$\mathbb{R}^m = C(A) \oplus N(A^T)$。

任意 $b$ 唯一分解为
$$
b = b_{\parallel} + b_{\perp}
$$

$$
b_{\parallel}\in C(A),\ b_{\perp}\in N(A^T),\ b_{\perp}\perp C(A).
$$

应用 $AA^+$ 后，$AA^+\,b = b_{\parallel}$ —— 垂直分量 $b_{\perp}$ 被扔掉，留下 $b$ 在 $C(A)$ 上离它最近的那个点。

判定一个矩阵 $P$ 是某子空间的正交投影，只需两条：

1. **幂等** $P^2 = P$（投一次和投两次结果一样）；
2. **对称** $P^T = P$（保证沿垂直方向投，而非斜着投）。

对 $AA^+$：

由 P1 得 $(AA^+)^2 = AA^+ A A^+ = AA^+$（幂等），由 **P3** 得对称——所以它就是一个正交投影矩阵；

又 $\mathrm{Im}(AA^+) = C(A)$，故是投到 $C(A)$ 上。

$A^+A$ 同理（用 P2、P4），投到 $C(A^T)$。

---

特例：

- 若 $A$ 列满秩，$A^+ = (A^T A)^{-1} A^T$（左逆）；
- 若 $A$ 行满秩，$A^+ = A^T (A A^T)^{-1}$（右逆）；
- 若 $A$ 可逆，$A^+ = A^{-1}$。

### 左逆几何含义

假设$A_{m\times n}$，当我们想用**列向量**的线性组合 $Ax$ 来表示**列空间**里的某个向量时，我们需要知道这些列向量之间的“关系”——它们是不是正交？长度是多少？夹角多大？

$A^\top A$这个矩阵就完整地记录了所有这些信息。它定义了列空间上的一个新的内积：

$$
\langle u, v \rangle_{A^\top A} = u^\top (A^\top A) v
$$
但这其实就是在说：先把 $u$ 和 $v$ **看作列空间**里的**坐标**，然后通过 $A$ 映射到 $\mathbb{R}^m$里（向量），再计算标准点积。

---

假设我们已经找到了$b$ 在列空间上的投影$p$。那么存在一组唯一的系数$x$，使得 $p = Ax$。

现在的问题是：**已知投影 $p$，如何求出系数 $x$？**

1. 我们知道 $p$ 在列空间里，所以 $p = Ax$。
2. 为了解出 $x$，我们可以将等式两边同时“左乘” $A^\top$。这一步的几何意义是：**把整个等式从原始的 $\mathbb{R}^m$ 空间“拉回”到系数所在的 $\mathbb{R}^n$空间**。
   $$
   \boxed{A^\top p = A^\top (A x) = (A^\top A) x}
   $$
3. 现在，我们得到了一个关于 $x$ 的方程，但左边是 $A^\top p$，右边是$(A^\top A) x$。这里的关键是：
   - $A^\top p$是一个$n$ 维向量，它代表了投影 $p$ 在每个列向量方向上的“贡献度”。
   - $(A^\top A) x$ 告诉我们，这些贡献度是由系数 $x$ 经过“内积表”变换后得到的。
4. 为了得到 $x$，我们需要解除这个“内积表”的变换。怎么做？**两边同时乘以 $(A^\top A)^{-1}$**。
   
   $$
   x = (A^\top A)^{-1} (A^\top p) := A^+ p
   $$

$(A^\top A)^{-1}$的作用是“去相关”或“正交化”：是一个“解码器”，它将混合的贡献度 ($A^\top p$) 解码为纯粹的系数 ($x$)。

因为 $A$的列向量通常不是正交的，所以它们的“贡献度”（即 $A^\top p$）是相互耦合的。$(A^\top A)^{-1}$ 的作用就是解开这种耦合，把混合在一起的贡献度还原成每个基向量方向上独立的系数。

----

## SVD 的价值：两组特殊的标准正交基

SVD 的核心是：对 $A \in \mathbb{R}^{m\times n}$，存在标准正交基

- 行空间（Row Space）内：$v_1,\dots,v_r$
- 列空间（Column Space）内：$u_1,\dots,u_r$

使得

$$
A v_i = \sigma_i u_i \quad (i=1,\ldots,r),\qquad
A v_j = 0 \quad (j>r,\;v_j\in N(A))
$$

即：$A$ 把行空间的基**按比例 $\sigma_i$** 映到列空间的基；

 但是同时我们可以推导出： $A^T$ 把列空间的基**按同样的比例**映回行空间的基：$A^T u_i = \sigma_i v_i$！

---

## 核心关系：互为逆映射（按比例）

SVD 给出的关键等式是：

$$
A v_i = \sigma_i u_i \quad (i=1,\ldots,r)
$$

同时， $A^T$ 的作用正好反过来（在奇异值和正交基的意义下）：

$$
A^T u_i = \sigma_i v_i \quad (i=1,\ldots,r)
$$

原因如下：

从 $A v_i = \sigma_i u_i$ 两边左乘 $A^T$：

$$
A^T A v_i = A^T (\sigma_i u_i) = \sigma_i A^T u_i
$$

但根据特征值分解，我们知道 $A^T A v_i = \lambda_i v_i$，其中 $\lambda_i = \sigma_i^2$。

所以：

$$
\sigma_i A^T u_i = \sigma_i^2 v_i
$$

两边同时除以 $\sigma_i$（因为 $\sigma_i > 0$）：

$$
A^T u_i = \sigma_i v_i
$$

| 方向            | 映射  | 公式                     |
| --------------- | ----- | ------------------------ |
| 行空间 → 列空间 | $A$   | $A v_i = \sigma_i u_i$   |
| 列空间 → 行空间 | $A^T$ | $A^T u_i = \sigma_i v_i$ |

可以看到：

- $A$ 把行空间的**标准正交基** $v_i$ 映射到列空间，长度被拉伸了 $\sigma_i$ 倍，方向变成 $u_i$
- $A^T$ 把列空间的**标准正交基** $u_i$ 映射回行空间，长度同样被拉伸 $\sigma_i$ 倍，方向回到 $v_i$

**总结一句话**：  

$A$ 把行空间的基映射到列空间的基，$A^T$ 把列空间的基映射回行空间的基，而且这两个方向上的缩放因子是一样的（都是 $\sigma_i$）。

这就是 SVD 最漂亮的地方：两组正交基通过同一个缩放系数完美配对。

---

## SVD 分解步骤

我们需要：
$$
A v = \sigma u \quad \text{(目标)}
$$

两边左乘 $A^T$：
$$
A^T A v = A^T (\sigma u) = \sigma A^T u
$$



$A^T A$ 一定是半正定的(PSD)。那么对任意对称半正定矩阵 **$A^T A$ 的特征值 $\lambda$** 与对应的单位特征向量 $v$：
$$
A^T A v = \lambda v
$$

那么
$$
\|A v\|^2 = (A v)^T (A v) = v^T A^T A v = v^T (\lambda v) = \lambda (v^T v) = \lambda \cdot 1 = \lambda
$$

所以：
$$
\|A v\| = \sqrt{\lambda} = \sigma
$$

这样一来，左边 $A^T A v = \lambda v = \sigma^2 v$，所以：
$$
\sigma^2 v = \sigma A^T u \Rightarrow \sigma v = A^T u \quad (\text{因为 } \sigma \ne 0)
$$

这说明：$u$ 是 $A A^T$ 的特征向量！因为：

$$
A A^T u = A (\sigma v) = \sigma A v = \sigma (\sigma u) = \sigma^2 u
$$

所以 $u$ 是 $A A^T$ 的特征向量，对应特征值 $\sigma^2$。

**构造方法**：

既然 $A v = \sigma u$，且 $\sigma \ne 0$，我们可以定义：
$$
u = \frac{A v}{\sigma}
$$

由于 $\|A v\| = \sigma$，所以：
$$
\|u\| = \left\| \frac{A v}{\sigma} \right\| = \frac{\sigma}{\sigma} = 1
$$

即 $u$ 是单位向量。

因此，**只要我们从 $A^T A$ 得到了 $v$ 和 $\sigma$，就可以直接构造 $u = \frac{A v}{\sigma}$**。

同时，这个 $u$ 也必然是 $A A^T$ 的单位特征向量（对应特征值 $\sigma^2$）。

---

SVD 求解三步：

- $v$ 来自 $A^T A$ 的特征向量 → 保证 $A^T A v = \sigma^2 v$
- $\sigma = \|A v\|$ → 由范数定义和 $A^T A v = \sigma^2 v$ 推出
- $u = \frac{A v}{\sigma}$ → 自动满足 $A v = \sigma u$，且 **$u$ 是 $A A^T$ 的单位特征向量**

> **通过对称矩阵的特征分解，构造出保持正交性的奇异向量和奇异值**。

### 情况一：满秩或只需前 $r$ 个奇异向量（简化SVD）

按照前面的三步法，对每一个**非零**奇异值 $\sigma_i$ ($i=1,\dots,r$)，这样得到：

- $V_r = [v_1, v_2, \dots, v_r]$ ($n \times r$，列标准正交)
- $U_r = [u_1, u_2, \dots, u_r]$ ($m \times r$，列标准正交)
- $\Sigma_r = \operatorname{diag}(\sigma_1, \dots, \sigma_r)$

此时 $A = U_r \Sigma_r V_r^T$ 成立，称为简化SVD（thin SVD）。

---

### 情况二：完整SVD（需要补齐正交基）

完整SVD要求 $U$ 是 $m \times m$ 正交矩阵，$V$ 是 $n \times n$ 正交矩阵。需要把缺失的列补上

**补全 $V$ ($n \times n$)**：

已经有了 $r$ 个右奇异向量 $v_1,\dots,v_r$，它们张成 $\operatorname{R}(A)$（行空间）。

还需要 $n-r$ 个向量 $v_{r+1},\dots,v_n$，它们必须：

- 与已有的 $v_1,\dots,v_r$ 正交
- 彼此正交
- 都是单位向量

这些向量就是 $A^T A$ 的零空间（**即 $A$ 的零空间**）的标准正交基。

**求法**：对 $A^T A$ 做特征分解，**取特征值 $\lambda=0$ 对应的 $n-r$ 个单位正交特征向量即可**。

**补全 $U$ ($m \times m$)**：

你已经有了 $r$ 个左奇异向量 $u_1,\dots,u_r$，它们张成 $\operatorname{C}(A)$（列空间）。

还需要 $m-r$ 个向量 $u_{r+1},\dots,u_m$，它们必须：

- 与已有的 $u_1,\dots,u_r$ 正交
- 彼此正交
- 都是单位向量

这些向量就是 $AA^T$ 的零空间（即 $A^T$ 的零空间，即$A$的左零空间）的标准正交基。

**求法**：对 $AA^T$ 做特征分解，取特征值 $\lambda=0$ 对应的 $m-r$ 个单位正交特征向量即可。

----

## 由 SVD 推导 $A^+ $

设 $A\in\mathbb{R}^{m\times n}$ 的秩为 $r$，奇异值分解为

$$
A = U\Sigma V^T,\qquad
\Sigma = \begin{bmatrix} \Sigma_r & 0 \\ 0 & 0 \end{bmatrix}\in\mathbb{R}^{m\times n},\quad
\Sigma_r = \mathrm{diag}(\sigma_1,\dots,\sigma_r),\ \sigma_i>0.
$$

定义

$$
\Sigma^+ = \begin{bmatrix} \Sigma_r^{-1} & 0 \\ 0 & 0 \end{bmatrix}\in\mathbb{R}^{n\times m},\qquad
\Sigma_r^{-1} = \mathrm{diag}(1/\sigma_1,\dots,1/\sigma_r),
$$

即"非零奇异值取倒数后再转置"。下面验证 $X := V\Sigma^+ U^T$ 满足 Penrose 四条。

利用 $U^T U = I_m$、$V^T V = I_n$，先算两个关键乘积：

$$
\Sigma\,\Sigma^+ = \begin{bmatrix} I_r & 0 \\ 0 & 0 \end{bmatrix}\in\mathbb{R}^{m\times m},\qquad
\Sigma^+\Sigma = \begin{bmatrix} I_r & 0 \\ 0 & 0 \end{bmatrix}\in\mathbb{R}^{n\times n}.
$$

二者都是对角的 0/1 投影矩阵，显然对称。于是：

$$
\begin{aligned}
A X A &= U\Sigma V^T \cdot V\Sigma^+ U^T \cdot U\Sigma V^T
= U(\Sigma\Sigma^+\Sigma)V^T = U\Sigma V^T = A, \\[2pt]
X A X &= V\Sigma^+ U^T\cdot U\Sigma V^T\cdot V\Sigma^+ U^T
= V(\Sigma^+\Sigma\Sigma^+)U^T = V\Sigma^+ U^T = X, \\[2pt]
A X &= U(\Sigma\Sigma^+)U^T \quad\Rightarrow\quad (AX)^T = U(\Sigma\Sigma^+)^T U^T = AX, \\[2pt]
X A &= V(\Sigma^+\Sigma)V^T \quad\Rightarrow\quad (XA)^T = V(\Sigma^+\Sigma)^T V^T = XA.
\end{aligned}
$$

四条 Penrose 方程全部满足；又因为伪逆唯一，所以

$$
A^+ = V\Sigma^+ U^T.
$$

直观上 SVD 把 $A$ 拆成"$V^T$ 旋转 → $\Sigma$ 在主轴上各自缩放 → $U$ 旋转"；

伪逆就是把每一步反过来——$U^T$ 还原旋转、$\Sigma^+$ 在可逆方向上倒回缩放（不可逆方向直接置零）、$V$ 还原旋转。

---

## "转置意义下的逆"（伪逆）

由 SVD：$A = U\Sigma V^T$，定义伪逆

$$
A^+ = V \Sigma^+ U^T,\quad
(\Sigma^+)_{ii} =
\begin{cases}
1/\sigma_i, & \sigma_i>0\\
0, & \sigma_i=0
\end{cases}
$$

则有
$$
A^+A = V\Sigma^{-1}U^T \cdot U\Sigma V^T = VI_rV^T = P_{\text{Row}(A)}
$$

$$
AA^+ = U\Sigma U^T \cdot V\Sigma^{-1}V^T = UI_rU^T = P_{\text{Col}(A)}
$$

对满秩方阵且正交 $U, V$ 的情形（简化说明）：
$$
A^+ A = V_r V_r^T = P_{\text{Row}(A)},\qquad
A A^+ = U_r U_r^T = P_{\text{Col}(A)}
$$

这里用 SVD 右奇异向量表示$P_{\text{Row}(A)}$ ：

$$
P_{\text{Row}(A)} = \sum_{i=1}^r v_i v_i^T = V_r V_r^T = A^+ A
$$
正是 **行空间上的投影** !

- **$A^+A$ 是 行空间上的投影**。
- $AA^+$ 是 列空间上的投影。

对比这个定义， $A$ 与 $A^T$ 互为"转置意义下的逆"（伪逆），因为：
$$
A^T A v_i = \sigma_i^2 v_i, \quad A A^T u_i = \sigma_i^2 u_i
$$

$v_1,\dots,v_r$ 是行空间的正交向量，根据正交投影矩阵，**在SVD第一步中算 $A^T A$，求其单位特征向量得 $v_1$，就是行空间基底**！

**总结一句话**：  

在 SVD 下，伪逆非常直观：

$$
A = U\Sigma V^T \quad \Longrightarrow \quad A^+ = V\Sigma^+U^T
$$

其中 $\Sigma^+$ 是把 $\Sigma$ 转置，并把非零奇异值取倒数：

$$
\sigma_i > 0 \Rightarrow (\Sigma^+)_{ii} = \frac{1}{\sigma_i}, \quad \sigma_i = 0 \Rightarrow 0
$$

- 行空间 ⇄ 列空间上，$A$ 与 $A^+$ 起互逆作用（$A^+$ 用 $1/\sigma_i$ 缩回去）
- 零空间被映射为零
- 故称 **"转置意义下的逆"（Moore–Penrose 伪逆）**

---

