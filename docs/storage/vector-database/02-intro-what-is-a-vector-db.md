---
source: https://www.yuque.com/yangguangfanxing/nmhuv1/xwep8spkdtwnkluw
---

# Intro-What is a Vector DB

> 原文链接：[https://www.yuque.com/yangguangfanxing/nmhuv1/xwep8spkdtwnkluw](https://www.yuque.com/yangguangfanxing/nmhuv1/xwep8spkdtwnkluw)

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239638162-8f8ed72f-a584-440a-9aa8-076008157d66.png)

# 向量数据库为什么重要

从现代 AI 应用切入：视觉商品搜索、RAG 问答、推荐系统。这种安排很关键，因为向量数据库不是为了替代传统数据库而出现，而是为了解决一类传统数据库不擅长的问题：如何在海量高维向量中快速找“相似”的对象。

向量数据库的核心场景可以概括为：

1. 把文本、图片、音频、用户行为等数据输入模型。
2. 模型输出一个 embedding，也就是向量表示。
3. 把向量和相关属性存入数据库。
4. 查询时也先把查询对象转成向量。
5. 在数据库里找与查询向量最接近的一批向量。

这里的“接近”通常不是传统数据库里的等值匹配或范围过滤，而是语义相似、视觉相似、偏好相似。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239638289-83eddaff-0b2b-4745-8b04-b280347f0621.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239638455-7870317b-3f4c-44d3-a6ad-cab8ed5de7c8.png)

1000 个 `float`数值（通常为 32 位浮点数）的向量在内存中大约占 **4 KB**。

```
31  30-23 22-0
├───┬──────┬───────────────┤
│ S │ 指数  │     尾数       │
└───┴──────┴───────────────┘
1位    8位        23位
```

计算方式：

- 1 个 `float`通常为 4 字节（32 位）。
- 1000 × 4 字节 = 4000 字节 ≈ 3.91 KB。

在存储或传输时，如果使用二进制格式（如 `.npy`或 `.bin`），大小接近这个值；如果保存为文本格式（如 CSV 或 JSON），由于字符编码和分隔符，文件体积会更大。实际项目中还需考虑容器格式的额外开销。

## 视觉商品搜索：第一个动机场景

课件用视觉商品搜索作为第一个例子：用户拍一张照片，系统返回相似商品。

基本流程是：

1. 对商品图片提取特征向量。
2. 把这些向量存入数据库。
3. 用户上传图片时，也提取查询图片的向量。
4. 在数据库中查找最近邻商品。

这个例子看起来直观，但马上暴露出向量数据库的系统难题。以京东的视觉搜索为例，规模可能达到：

![](https://cdn.nlark.com/yuque/__latex/f928e627a51bef1fc1dc6c9d8940b9d7.svg)

每个向量维度大约是：

![](https://cdn.nlark.com/yuque/__latex/7e8c14b18d194b11fa8bd01060e34c37.svg)

如果每个维度用一个 32 位浮点数，也就是 4 字节，那么仅存储向量本身大约需要：

![](https://cdn.nlark.com/yuque/__latex/83bd9a245b9d3001f221c063a30616b0.svg)

这说明第一个问题是存储：向量数据太大，不能简单地全部放进内存。

第二个问题是查询：如果对每个查询都暴力比较全部向量，计算量是：

![](https://cdn.nlark.com/yuque/__latex/83ee35b998b27d7e5926aee76683cba6.svg)

代入课件中的数量级：

![](https://cdn.nlark.com/yuque/__latex/2c6fcf811c0b0acf77cadb7cf03e445e.svg)

即使有每秒 20 TFLOPS 的计算能力，单次查询理论上也要约：

![](https://cdn.nlark.com/yuque/__latex/55547ed06289dc098883d52e9884cba8.svg)

这还没有算数据读取、调度、网络和系统开销。对在线搜索来说，5 秒延迟显然不可接受。

因此，向量数据库不能只是“把向量塞进传统数据库”。问题在于：传统数据库索引通常针对单个属性或属性组合，而向量最近邻搜索要比较的是整个高维向量。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239638358-53a6230f-5b94-4c71-87ed-cf80e07eea3c.png)

## 用索引加速：从全量扫描到近似搜索

接着课件回到视觉搜索例子，并引出一个朴素但重要的思路：先把向量聚类，再按簇组织数据。

查询时：

1. 找到离查询向量最近的一个或几个簇。
2. 只在这些簇内部搜索候选向量。
3. 返回候选中距离最近的结果。

插入时：

1. 判断新向量最接近哪个簇。
2. 把它加入对应簇的列表。

这就是近似最近邻搜索的基本精神：放弃完全精确的全库搜索，换取大幅性能提升。

这里的设计取舍是向量数据库的主旋律：为了毫秒级查询，可以接受一定程度的近似；为了更快写入和更低成本，可以接受最终一致性或周期性重建索引。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239638492-619d02a0-8d66-4d34-8dc0-a47edd38b6ea.png)

## RAG 问答：向量数据库作为 LLM 的外部记忆

第二个应用是 RAG，也就是 Retrieval-Augmented Generation。

普通 LLM 只根据模型参数和输入问题生成回答。RAG 的思路是：先从外部文档库中检索相关内容，再把这些内容作为上下文交给 LLM。

课件中的流程是：

1. 为文档生成 embedding。
2. 查询时为用户问题生成 embedding。
3. 通过近邻搜索找到相关文档。
4. 可选地进行 rerank，提高相关性排序质量。
5. 把文档内容放进 prompt。
6. LLM 根据问题和上下文生成回答。

在这个场景里，向量数据库承担的不是“最终回答者”的角色，而是“相关上下文检索器”的角色。它决定了模型能看到哪些外部知识，因此会直接影响回答质量。

这个例子也说明，向量数据库常常位于 AI 应用链路中间：前面接 embedding 模型，后面接 LLM、重排模型或业务逻辑。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239641372-271f5f87-b7e8-4aed-8e46-5ba116281963.png)

## 推荐系统：向量搜索与重排结合

第三个应用是推荐系统。目标是给用户推荐商品、视频、音乐等内容。

课件给出的流程是：

1. 为商品或内容创建向量。
2. 为用户偏好创建查询向量。
3. 搜索与用户偏好向量接近的内容向量。
4. 根据近期行为、业务规则或其他模型进行重排。

推荐系统对向量数据库提出几个要求：

1. **高吞吐**：用户请求量很大。
2. **好准确率**：推荐质量依赖相似性搜索质量。
3. **弹性**：每天不同时间的流量会明显波动。

这类系统通常不会只依赖一次向量搜索完成推荐，而是把向量搜索作为召回阶段，再通过更复杂的排序模型做最终结果。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239641601-45501a9c-9a1a-4b66-8b02-54e86e262ccb.png)

## 三个场景的共同模式

视觉搜索、RAG、推荐系统看起来很不同，但底层功能非常一致。

写入数据时：

1. 把原始数据转成 embedding。
2. 把 embedding 存入专门的数据库。

查询数据时：

1. 把查询也转成向量。
2. 在数据库中找相似向量。
3. 返回对应的数据、文档、商品或其他对象。

这就是对向量数据库的第一层抽象：它是一个专门为向量存储和语义搜索服务的数据库系统。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239641456-2f4dc23b-7090-4ede-8fcc-53977737b57c.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239641397-1539e7a0-10f4-4074-b286-146c92b9a7b8.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239641397-c0e7a6d8-3d7e-49a4-b30b-22465142d220.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239642450-adb8c710-a4d4-4b16-9cdd-b73cbf1075f6.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239642472-8382489d-780b-4ce8-82a8-96828afe3379.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239642468-89e82f7a-1e5c-40c6-ab74-17bc4c4afc75.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239642481-71400924-0e79-401e-bd4d-a8e41009e787.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239642737-f2f803af-66cc-418c-8b8c-585adfa967e3.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239642961-21b33fde-38d8-45d9-b50f-0e87dec34ec5.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239643120-bd6df386-d70f-42a6-9bbb-f92d9ade4f1b.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239643134-760d8ed9-ddf4-41d5-9d94-b1ca3047f751.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239643586-8c9f0580-c64e-4524-aead-165f98b1be35.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239643459-9a5dfeba-13ed-42a5-9c72-8b7f4481d00f.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239643519-6e4b3ad4-05d9-4ca9-8390-446a5f2a7a8e.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239643886-cfe01ace-a8c4-4bfd-9d1f-8e0e7f027f21.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239643561-89f7eba4-c2f8-4c71-a6a4-1766781af380.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239644118-cb24cf90-9c18-4e59-92bc-98c986713308.png)

# 什么是向量数据库：鸟瞰定义

进入技术主线后，课件给出一个非常简洁的定义：

![](https://cdn.nlark.com/yuque/__latex/7b25e18d52a8c1846821c80dd35eb345.svg)

更完整地说，向量数据库负责：

1. 存储大量向量。
2. 存储向量关联的属性或 payload。
3. 支持快速查找与查询向量相近的向量。
4. 支持一些简单过滤条件。

插入时，系统创建向量：![](https://cdn.nlark.com/yuque/__latex/712ecf7894348e92d8779c3ee87eeeb0.svg)

查询时，系统创建查询向量：![](https://cdn.nlark.com/yuque/__latex/34c7b563b30bde3c748139530686798e.svg)

然后查找与：![](https://cdn.nlark.com/yuque/__latex/34c7b563b30bde3c748139530686798e.svg)最近的向量。

注意这里的“语义搜索”不是 SQL 中的字符串匹配，而是通过 embedding 空间中的距离表达语义相似性。例如，两段文字的词面可能完全不同，但如果 embedding 接近，系统就认为它们在语义上相关。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239643995-71c9f01d-7c47-4570-b74d-74c72c5bb930.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239644095-c2137cbc-7a57-4407-bd9f-67bccc192f94.png)

## k-Nearest Neighbors (kNN)

k近邻算法是一种基于实例的**惰性学习**（lazy learning）算法，既可用于分类任务，也可用于回归任务。其核心思想是"物以类聚，人以群分"：一个数据点的类别或数值可以通过其周围最近邻的数据点来推断。

### 基本特点

- **无显式训练**：不进行模型训练，只存储训练数据
- **基于距离**：通过距离度量判断样本相似性
- **参数简单**：主要参数只有k值和距离度量方式
- **直观易懂**：决策过程易于理解和解释

### 形式化定义

给定训练集 ![](https://cdn.nlark.com/yuque/__latex/558270b7f0a90c3c286b860273d106a0.svg) 包含 ![](https://cdn.nlark.com/yuque/__latex/df378375e7693bdcf9535661c023c02e.svg) 个样本：

![](https://cdn.nlark.com/yuque/__latex/271249f128e4166cf2554a2cf2e634d4.svg)

其中：

- ![](https://cdn.nlark.com/yuque/__latex/5b13ed0ae41bee9defcf75f2efc5f060.svg) 是 ![](https://cdn.nlark.com/yuque/__latex/4760e2f007e23d820825ba241c47ce3b.svg) 维特征向量：![](https://cdn.nlark.com/yuque/__latex/98001413af741a6ea19fbf0a4f2d2b90.svg)
- ![](https://cdn.nlark.com/yuque/__latex/54507b6bac465d8afb0e218ccbf31b59.svg) 是对应的标签（分类任务为类别标签，回归任务为连续值）

对于查询点 ![](https://cdn.nlark.com/yuque/__latex/d5db0905508820c949c00b8174855f85.svg)，预测其标签 ![](https://cdn.nlark.com/yuque/__latex/10263aa9e5f049b4b7b736c19be6afad.svg)。

### 算法步骤

1. **计算距离**： 计算 ![](https://cdn.nlark.com/yuque/__latex/d5db0905508820c949c00b8174855f85.svg) 与 ![](https://cdn.nlark.com/yuque/__latex/558270b7f0a90c3c286b860273d106a0.svg) 中每个样本的距离 ![](https://cdn.nlark.com/yuque/__latex/c7e6d38b9c4c591dbafa82422c9f2152.svg)
2. **排序选择**： 将距离按升序排序，选择前 ![](https://cdn.nlark.com/yuque/__latex/df976ff7fcf17d60490267d18a1e3996.svg) 个最小距离对应的样本，构成 ![](https://cdn.nlark.com/yuque/__latex/df976ff7fcf17d60490267d18a1e3996.svg)-近邻集合 ![](https://cdn.nlark.com/yuque/__latex/e5de88fb680eb0acb0b470917d2eec83.svg)
3. **决策预测**： 根据 ![](https://cdn.nlark.com/yuque/__latex/e5de88fb680eb0acb0b470917d2eec83.svg) 中邻居的标签，通过特定规则预测 ![](https://cdn.nlark.com/yuque/__latex/10263aa9e5f049b4b7b736c19be6afad.svg)

### 距离度量

1. 欧几里得距离（Euclidean Distance）

最常用的距离度量，即多维空间中的直线距离：

![](https://cdn.nlark.com/yuque/__latex/188295b068672f53b694a8bd5625859f.svg)

**特点**：

- 各维度贡献平等
- 对特征的量纲敏感
- 需要特征标准化处理

2. 曼哈顿距离（Manhattan Distance）

各维度绝对差之和：

![](https://cdn.nlark.com/yuque/__latex/5ad8d77735a7a32e7700565f3687b471.svg)

**特点**：

- 计算效率高于欧氏距离
- 对异常值相对不敏感
- 适用于网格状数据

3. 闵可夫斯基距离（Minkowski Distance）

欧氏距离和曼哈顿距离的推广：

![](https://cdn.nlark.com/yuque/__latex/7506d22849766e30c6978eb048d1f690.svg)

其中：

- ![](https://cdn.nlark.com/yuque/__latex/9af3acf106aaeba29d00cd5d581c26a0.svg)：曼哈顿距离
- ![](https://cdn.nlark.com/yuque/__latex/645a0f501112e81811324600f76f1bce.svg)：欧几里得距离
- ![](https://cdn.nlark.com/yuque/__latex/284f6cb58f9e19443396d324a61d56a5.svg)：切比雪夫距离

4. 余弦相似度（Cosine Similarity）

衡量向量方向的相似性，忽略大小：

![](https://cdn.nlark.com/yuque/__latex/1d4e36311c0aad82d1c91c3a5cd98aff.svg)

转换为距离：![](https://cdn.nlark.com/yuque/__latex/14e03a8bb1c068b3e7cd022d7f8ec7e0.svg)

**适用场景**：文本分类、推荐系统等高维稀疏数据

距离度量选择指南

| 距离度量 | 适用场景 | 注意事项 |
| --- | --- | --- |
| 欧几里得 | 连续特征，各维度同等重要 | 需特征标准化 |
| 曼哈顿 | 高维数据，计算效率要求高 | 对异常值较鲁棒 |
| 余弦相似度 | 文本、图像等高维稀疏数据 | 关注方向而非大小 |
| 汉明距离 | 分类特征，二进制数据 | 仅适用于离散特征 |

### k值选择

k值的影响

| k值 | 模型复杂度 | 决策边界 | 偏差-方差 | 适用场景 |
| --- | --- | --- | --- | --- |
| **k值小** | 高复杂度 | 崎岖不平 | 低偏差，高方差 | 数据干净，噪声少 |
| **k值大** | 低复杂度 | 平滑 | 高偏差，低方差 | 噪声较多，数据量大 |

选择策略

- **经验法则：** 通常从较小的奇数开始尝试（如 3, 5, 7），避免分类投票时出现平局
- **交叉验证：** 通过交叉验证选择在验证集上性能最好的 ![](https://cdn.nlark.com/yuque/__latex/df976ff7fcf17d60490267d18a1e3996.svg) 值
- **启发式方法：** ![](https://cdn.nlark.com/yuque/__latex/eb5b2f44a0776b942d94c7a8363e7514.svg)，其中 ![](https://cdn.nlark.com/yuque/__latex/df378375e7693bdcf9535661c023c02e.svg) 是训练样本数量

极端情况

- 当 ![](https://cdn.nlark.com/yuque/__latex/47e038d27ecd3fdcce91001028ad1b9e.svg) 时：1-近邻，完全依赖最近的一个样本
- 当 ![](https://cdn.nlark.com/yuque/__latex/038f01b2fd948b32867c3164bf007f40.svg) 时：

### 决策规则

(1) 分类：多数投票法（Majority Voting）

![](https://cdn.nlark.com/yuque/__latex/fe0b56c7a003197ef4d482cfa5f686e0.svg)

其中：

- ![](https://cdn.nlark.com/yuque/__latex/b891664b42113aee13f0bac25eb998e5.svg) 遍历所有可能的类别
- ![](https://cdn.nlark.com/yuque/__latex/a8fc26e43ba80e137d0945813159cb60.svg) 是指示函数：

![](https://cdn.nlark.com/yuque/__latex/1fbbffc8412cee37951eb8462c28bf1d.svg)

**示例：** 假设 ![](https://cdn.nlark.com/yuque/__latex/4fa25fee44a500d527a064a4a7fb5815.svg)，邻居的类别为 ![](https://cdn.nlark.com/yuque/__latex/a431c078bcfa951cce92283f22b41c22.svg)：

- 类别 A 出现 3 次
- 类别 B 出现 1 次
- 类别 C 出现 1 次

预测结果：![](https://cdn.nlark.com/yuque/__latex/8b0bae8cf04dd4a871a7011dd40fff3a.svg)

(2) 分类：加权多数投票法（Weighted Majority Voting）

为更近的邻居分配更高的权重：

![](https://cdn.nlark.com/yuque/__latex/8f49caf3229c5e5c40569f065b5002f6.svg)

其中 ![](https://cdn.nlark.com/yuque/__latex/7c102e7a7d231bf935f9bc23417779a8.svg) 是一个很小的正数，防止分母为零。

预测公式：

![](https://cdn.nlark.com/yuque/__latex/5f44b5acdd86e79639797f0a8617e842.svg)

(3) 回归：简单平均法（Simple Average）

![](https://cdn.nlark.com/yuque/__latex/2a1dabcab24439b1c7162803123055a4.svg)

**示例：** 假设 ![](https://cdn.nlark.com/yuque/__latex/83aee1528ac6365e65df29b11c1f0a91.svg)，邻居的值为 ![](https://cdn.nlark.com/yuque/__latex/45839328cfc616a058078c99bf9f2b9f.svg)：

![](https://cdn.nlark.com/yuque/__latex/7407fb0ba732439010068d74e246c94a.svg)

(4) 回归：加权平均法（Weighted Average）

![](https://cdn.nlark.com/yuque/__latex/df7a581e32237c26948c0904308c0376.svg)

其中权重 ![](https://cdn.nlark.com/yuque/__latex/d99fd2df7b5f652a4b7fc593fb9df750.svg) 通常与距离成反比。

### 算法伪代码

基本 kNN 分类算法

输入：

- 训练集 ![](https://cdn.nlark.com/yuque/__latex/6420cc078490ba10183ff8ad074ed805.svg)
- 查询点 ![](https://cdn.nlark.com/yuque/__latex/d5db0905508820c949c00b8174855f85.svg)
- 近邻数量 ![](https://cdn.nlark.com/yuque/__latex/df976ff7fcf17d60490267d18a1e3996.svg)
- 距离函数 ![](https://cdn.nlark.com/yuque/__latex/11e99d50ed95325fa4d262ab3af77b51.svg)

输出：

- 预测标签 ![](https://cdn.nlark.com/yuque/__latex/0d16d2e7dffd695c806fe057743c0928.svg)

步骤：

1. 对于训练集中的每个样本 ![](https://cdn.nlark.com/yuque/__latex/9c96c454e645c0a56b7cb60cfd841a0b.svg)： a. 计算距离 ![](https://cdn.nlark.com/yuque/__latex/37f45acdd02faedea7a7f16c7eeccc02.svg)
2. 从 ![](https://cdn.nlark.com/yuque/__latex/558270b7f0a90c3c286b860273d106a0.svg) 中选择 k 个距离最小的样本，构成近邻集合 ![](https://cdn.nlark.com/yuque/__latex/e5de88fb680eb0acb0b470917d2eec83.svg) ![](https://cdn.nlark.com/yuque/__latex/56ef9389e67dac8e04aa2145e4ac844d.svg) 其中 ![](https://cdn.nlark.com/yuque/__latex/13d858ab596758a81f6ab2772974faa9.svg)
3. 统计 ![](https://cdn.nlark.com/yuque/__latex/e5de88fb680eb0acb0b470917d2eec83.svg) 中各类别的频数： ![](https://cdn.nlark.com/yuque/__latex/30d045e7e05ccfdbc9cac3e620198378.svg) 对于每个类别 c
4. 返回出现次数最多的类别： ![](https://cdn.nlark.com/yuque/__latex/31fcff4dea00a57a46c62348c326ef10.svg)

加权 kNN 分类算法

步骤1-2同基本kNN

1. 为每个近邻计算权重： ![](https://cdn.nlark.com/yuque/__latex/0a97c86a0633952f7944835af8fd3fa8.svg) 或其他权重函数
2. 计算每个类别的加权票数： ![](https://cdn.nlark.com/yuque/__latex/e63c07ae66a7a48c2161613b84c0cc3f.svg) 对于每个类别 c
3. 返回加权票数最高的类别： ![](https://cdn.nlark.com/yuque/__latex/07b280725ebd3680a191863f88990bf6.svg)

### 重要注意事项

1. 特征缩放的重要性

由于距离度量对特征的尺度敏感，使用 kNN 前通常需要对特征进行标准化或归一化。

**标准化（Z-score 标准化）：**

![](https://cdn.nlark.com/yuque/__latex/57bd3c73047d696ce5096721cb2f189b.svg)

其中 ![](https://cdn.nlark.com/yuque/__latex/7e7f57ade090b73b2fc19e7684298188.svg) 是特征 ![](https://cdn.nlark.com/yuque/__latex/036441a335dd85c838f76d63a3db2363.svg) 的均值，![](https://cdn.nlark.com/yuque/__latex/f7cc2da2fbc46b069a1f6ea8d80df968.svg) 是标准差。

**归一化（Min-Max 缩放）：**

![](https://cdn.nlark.com/yuque/__latex/0a3aee4e5153fad400f8e097321ea424.svg)

2. 维度灾难

在高维空间中，kNN 算法面临"维度灾难"问题：

- 随着维度增加，数据点之间的距离变得相似
- 最近邻与最远邻的区分度降低
- 需要更多的数据来维持相同的密度

**解决方案：**

- 特征选择
- 特征提取（如 PCA）
- 使用更适合高维数据的距离度量

### 算法复杂度

| 指标 | 复杂度 | 说明 |
| --- | --- | --- |
| 训练复杂度 | ![](https://cdn.nlark.com/yuque/__latex/a2006f1ac61cb1902beacb3e29fff089.svg) | 惰性学习，仅存储数据 |
| 预测复杂度 | ![](https://cdn.nlark.com/yuque/__latex/056f954e6e90b5a2b55a88e66a39d4c5.svg) | ![](https://cdn.nlark.com/yuque/__latex/df378375e7693bdcf9535661c023c02e.svg) = 训练样本数，![](https://cdn.nlark.com/yuque/__latex/56c1b0cb7a48ccf9520b0adb3c8cb2e8.svg) = 特征维度 |
| 空间复杂度 | ![](https://cdn.nlark.com/yuque/__latex/056f954e6e90b5a2b55a88e66a39d4c5.svg) | 需要存储所有训练数据 |

### 示例1：分类问题

假设有一个简单的二维数据集，包含两个类别（红色和蓝色），想要预测绿色点的类别（![](https://cdn.nlark.com/yuque/__latex/83aee1528ac6365e65df29b11c1f0a91.svg)）：

- 红色点：![](https://cdn.nlark.com/yuque/__latex/9bf88c64cab8017fa9c0cc8aff200df0.svg)
- 蓝色点：![](https://cdn.nlark.com/yuque/__latex/f4dcc5c3a1c30d73840e586407d0283c.svg)
- 查询点：![](https://cdn.nlark.com/yuque/__latex/3e8784e6604f46f0c79279a9dbf487fb.svg)

**计算欧氏距离：**

到红色点的距离：

![](https://cdn.nlark.com/yuque/__latex/131cfac44895ea51cbf77ba9cc14eeb5.svg)

到蓝色点的距离：

![](https://cdn.nlark.com/yuque/__latex/f25fb47c6d7d0a428bd343e606838238.svg)

最近 3 个邻居：红色(1.41), 蓝色(1.41), 红色(2.24)

红色：2 票，蓝色：1 票 ![](https://cdn.nlark.com/yuque/__latex/33b44e34aa35b8c4ecd0606453ee68e9.svg) 预测为红色

### 示例2：回归问题

预测房屋价格（![](https://cdn.nlark.com/yuque/__latex/83aee1528ac6365e65df29b11c1f0a91.svg)）：

| 房屋 | 面积 | 价格 | 到查询点距离 |
| --- | --- | --- | --- |
| 房屋1 | 100 m² | 300 万 | 1.2 |
| 房屋2 | 120 m² | 360 万 | 0.8 |
| 房屋3 | 90 m² | 280 万 | 1.5 |
| 房屋4 | 110 m² | 320 万 | 2.0 |

- 查询点：105 m²
- 最近 3 个邻居：房屋2 (0.8), 房屋1 (1.2), 房屋3 (1.5)

**简单平均：**

![](https://cdn.nlark.com/yuque/__latex/fa6f70d3762d17aa93076d338f1e97a4.svg)

**加权平均：**

权重：![](https://cdn.nlark.com/yuque/__latex/cf4095a0a6bd2d336c3dc5d93205e613.svg)

![](https://cdn.nlark.com/yuque/__latex/d024472b471fdf7641789894b862836c.svg)

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239644067-1dc8ab0d-4af6-4e2a-86e9-7d6aa7092ae5.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239644448-1d0e2d9d-a3f1-4723-b3f8-ae884e5c7a08.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239644544-7e4f675b-df59-4b44-9087-f91e415b5285.png)

## RDBMS 与 VDBMS 的总体差异

接下来系统比较传统关系数据库和向量数据库。

传统 RDBMS 面向的是 record，也就是有结构的行。查询语言是关系代数和 SQL，支持 join、group、foreign key、cursor、事务等复杂能力。

VDBMS 面向的是 vector，也就是高维数值数组。查询核心是最近邻搜索和简单过滤。它通常没有复杂 join，没有传统意义上的查询优化器，也不强调事务语义。

可以这样理解：

1. RDBMS 擅长精确结构化查询。
2. VDBMS 擅长高维相似性查询。
3. RDBMS 的数据语义来自字段名、类型、约束和关系。
4. VDBMS 的数据语义来自整个向量在 embedding 空间中的位置。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239644916-aae95310-6ab2-4770-9d3e-4b1e046cd3c0.png)

## Record 与 Vector 的差异

传统数据库中的一行记录通常有少量属性，比如商品 ID、卖家 ID、价格、颜色等。每个属性有名字、类型和意义，可以独立比较、过滤、聚合。

向量则是一个很长的标量列表。单个维度通常没有人类可解释的语义。第 17 个维度或第 203 个维度本身不代表“颜色”或“价格”，意义来自整个向量。

比较两条记录通常很便宜，因为只看几个字段就够了。但比较两个向量需要遍历维度：

![](https://cdn.nlark.com/yuque/__latex/558b5ba0caf369d997575ddaa069243c.svg)

这就是为什么向量查询成本高。维度越大，单次距离计算越贵；向量数量越多，全量扫描越不可行。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239644822-ebb969e3-2f04-4b19-a0ec-a4c1f856162f.png)

## RDBMS 查询：表达能力强，但系统复杂

RDBMS 的查询通常只触碰一个或几个属性，但表达能力非常强。SQL 可以做：

1. 过滤。
2. 聚合。
3. 分组。
4. 多表连接。
5. 子查询。
6. 游标。
7. 多行复杂结果生成。

这种能力背后需要复杂的数据模型、schema、索引、优化器和执行器。数据库需要判断不同执行计划的代价，选择高效路径。

所以 RDBMS 的强大来自复杂性：复杂 API、复杂查询计划、复杂执行机制。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239644661-afa97a63-687b-4f44-9bd9-f410b72d95f0.png)

## VDBMS 查询：简单 API 下的高成本相似搜索

VDBMS 查询通常触碰整个向量。最常见操作包括：

1. 按 key 获取对象。
2. 最近邻搜索。
3. 带简单属性过滤的最近邻搜索。
4. 范围查询：找出距离阈值内的向量。
5. 混合查询：向量搜索加属性过滤。
6. 多向量或多空间搜索。

最近邻搜索可能是精确的，也可能是近似的。实际系统中为了性能，近似搜索更常见。

常见相似度度量包括：

1. 欧氏距离。
2. 余弦相似度。
3. 内积。

VDBMS 目前没有统一的 SQL 等价标准。不同产品的 API 差异明显，常见形式是 HTTP 或 REST，并提供 Python、Java、Go 等语言绑定。

一些扩展型向量数据库会继承已有数据库的 SQL 能力。例如在 SQL 中加入向量距离运算：

![](https://cdn.nlark.com/yuque/__latex/c387f3517227f47353376e66cb2befc1.svg)

这类系统的优点是能保留成熟数据库的事务、SQL、数据模型和生态，但可能在纯向量搜索性能上不如原生 VDBMS。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239644977-d234ed1f-446b-4f8a-b7a2-f47d6c7d871c.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239645027-95b95081-24c1-4678-8eb0-f7f4edb387e9.png)

## 索引：VDBMS 性能的关键

RDBMS 的索引通常建立在一个属性或多个属性组合上。常见索引包括 B-tree、hash、文本索引等。它们用于加速过滤、比较和范围查询。更新通常较快。

VDBMS 的索引针对整个向量建立。常见类型包括：

1. 图索引。
2. LSH。
3. 表结构。
4. flat 索引。
5. 树结构。

向量索引的核心目的不是加速属性过滤，而是加速最近邻搜索。

但这里有一个重要代价：向量索引更新可能很慢，有时甚至需要周期性重建。于是 VDBMS 经常采用：

1. 近似最近邻。
2. 周期性索引重建。
3. 最终一致性模型。

从复杂度对比看，VDBMS 的索引更新可能是：![](https://cdn.nlark.com/yuque/__latex/8c51f5913186f8ac629f1d5838940f33.svg)或：![](https://cdn.nlark.com/yuque/__latex/391e48baddd4a41ffd6ef700a6507116.svg)

而传统索引更新常见成本可能接近：![](https://cdn.nlark.com/yuque/__latex/a2006f1ac61cb1902beacb3e29fff089.svg)或：![](https://cdn.nlark.com/yuque/__latex/42433fa38a5bb64ddbf13bc74baefea6.svg)

这也是 VDBMS 写入和索引维护比 RDBMS 更棘手的原因。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239645162-a4ca710c-f938-479c-9e9b-a6b8a4569e23.png)

## 更新：为什么 VDBMS 不像 RDBMS 那样灵活

RDBMS 可以更新单个属性，也可以基于复杂查询更新多行。事务可以保证多个读写操作的一致性。

VDBMS 通常不这么做。原因是向量的单个维度没有独立业务意义，因此“只更新某一个标量”通常没有价值。更新一个向量更像是：

1. 删除旧向量。
2. 插入新向量。

关联属性可以单独更新，但向量本身通常按整体处理。

这会带来两个后果：

1. 向量更新不一定立即反映在索引中。
2. 系统更倾向于最终一致性，而不是强事务一致性。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239646029-97331289-f922-4493-85e2-3f27ee079b13.png)

## 存储：结构化行 vs 不透明向量

RDBMS 的存储选择很多，因为它知道每行有哪些属性、属性类型、取值范围和查询方式。它可以选择：

1. 行式存储。
2. 列式存储。
3. LSM 结构。
4. 每个属性单独建索引。

这使得 RDBMS 比较容易按属性分区、按查询模式优化。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239646535-926ae83d-83b8-4938-8288-2ddbe51bd44d.png)

VDBMS 面对的是 dense vector，也就是密集向量。单个向量整体上是不透明 blob，系统很难利用“第几个维度”的语义来分区或优化。

因此 VDBMS 常见做法是：

1. 向量存入 KV、块存储或 blob 存储。
2. 索引放在内存中，部分系统支持磁盘索引。
3. 属性或 payload 存在另一套结构中。
4. 分区通常依赖向量索引或聚类结构。

这解释了为什么 VDBMS 的存储系统常常更定制化，也更依赖索引设计。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239645511-0df2a91b-3d6a-45d7-85c4-0526fc5d02d1.png)

## 硬件与架构：GPU 改变了系统设计

RDBMS 的主要资源通常是 CPU、内存和存储。不同操作的成本虽然不同，但整体资源画像相对统一，所以单体架构或粗粒度扩展比较常见。

VDBMS 增加了一个非常重要的资源：GPU。

GPU 可能用于：

1. 批量向量计算。
2. 索引构建。
3. 大规模相似度搜索。
4. embedding 生成或模型推理。

但 GPU 昂贵，功耗高，而且不同任务对资源需求差异很大。比如：

1. 查询需要低延迟。
2. 插入需要处理新数据。
3. 索引构建可能是批处理重任务。
4. embedding 生成可能依赖模型推理。

因此 **VDBMS 更容易走向 disaggregated architecture**，也就是把不同功能拆开独立扩展。查询、写入、索引构建、存储、推理可以使用不同资源池。

提醒，这些都是 generalization：现实中也有分离式 RDBMS，也有单体式 VDBMS。不过 VDBMS 是在现代云环境中成长起来的，所以更自然地接受细粒度扩展和服务拆分。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239645553-9943ae33-841f-41c3-ab92-708ccc834fd8.png)

## 两类 VDBMS：原生型与扩展型

向量数据库分成两大类。

### 原生 VDBMS

原生 VDBMS 从一开始就是为向量数据库设计的。它们通常有专门架构和高性能向量索引。例子包括：

1. Vearch。
2. Pinecone。
3. Azure AI Search。
4. Milvus。
5. Qdrant。
6. Weaviate。
7. Chroma。

优点：

1. 向量搜索性能高。
2. 架构能围绕向量索引和相似搜索优化。

缺点：

1. 查询语言和数据模型有限。
2. 通常没有成熟 SQL、事务和复杂查询。
3. 可能和原始业务数据系统分离，导致数据同步问题。

### 扩展型 VDBMS

扩展型 VDBMS 是在已有关系数据库或 NoSQL 数据库上加入向量能力。例子包括：

1. pgvector。
2. Vespa。
3. Timescale。
4. CosmosDB。
5. Redis。
6. PASE。

优点：

1. 继承原数据库的数据模型。
2. 可以保留 SQL、事务、ACID、权限和生态。
3. 可以把源数据和向量放在同一个系统中。

缺点：

1. 可能不如原生系统快。
2. 向量索引和事务结合会让更新更慢。
3. 某些系统有功能限制，例如维度上限或索引能力不足。

这一组对比说明：选型不是“哪个产品最好”，而是看业务更需要高性能向量搜索，还是更需要成熟数据库能力。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239645692-e732587a-255a-4549-9e01-3457e4baaedf.png)

## 总结: 关键挑战

第一，向量大而密集。存储、读取、比较都贵。

第二，高维空间难以索引。这对应常说的维度灾难：维度极高时，距离分布、空间划分和索引剪枝都会变得困难。

第三，向量没有天然结构或顺序。传统数据库可以按价格、时间、ID 排序或分区，但向量整体没有天然排序。

第四，搜索条件模糊。SQL 的条件通常清晰，比如价格大于某个值；向量搜索则是“相似”，而相似性的含义依赖 embedding 模型、距离函数和业务目标。

第五，向量搜索很难和属性过滤完美结合。例如先过滤再向量搜索，可能候选太少；先向量搜索再过滤，可能结果不够。如何平衡两者是系统设计难点。

第六，索引更新昂贵。和传统数据库相比，VDBMS 的写入、删除和更新往往更难做到立即可见且高性能。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239646143-daa88235-b26c-4aac-9c0b-5b6ea1f2c8f7.png)

## 逻辑组件：一个向量数据库系统大致长什么样

最后给出 VDBMS 的逻辑组件图。它不是某个产品的真实架构，而是概念框架。

主要组件包括：

1. API：接受读写请求。
2. **Index：处理向量，支持快速检索。**
3. **Storage：持久化存储向量、属性，有时也存储索引。**
4. Liveness：临时保存新写入数据，缓解索引更新慢的问题。
5. Planner：决定查询如何执行。
6. Executor：执行查询，收集结果。
7. Storage manager：管理底层存储。

其中 Liveness 很有意思。它的存在是因为索引更新可能慢，新插入的数据不能总是马上进入主索引。系统可以先把新数据放在临时结构里，查询时同时查主索引和临时数据，从而让新数据尽快可见。

实际生产系统会比这复杂很多，还会有：

1. 监控。
2. 备份。
3. 编排。
4. 推理服务。
5. 多租户。
6. 安全与合规。
7. 插件式存储或索引。
8. 分布式协调。

所以这张图更适合理解概念边界，而不是照着实现一个生产系统。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239646365-8177a070-d368-4df3-aa5b-cbc62e4336b7.png)

## 核心 takeaway

真正想建立的是一个系统视角：

1. 向量数据库不是“带向量字段的普通数据库”，而是围绕高维相似搜索重新设计的系统。
2. 它的核心操作是最近邻搜索，不是关系代数。
3. 它的核心瓶颈来自向量规模、维度、索引更新和查询延迟。
4. 它通常接受近似结果和最终一致性，以换取性能和可扩展性。
5. 原生 VDBMS 与扩展型 VDBMS 分别代表两种路线：性能优先和数据库生态优先。
6. 在现代 AI 应用中，VDBMS 往往连接 embedding 模型、LLM、推荐系统、搜索系统和业务数据。

一句话总结：

**向量数据库是为“在海量高维向量中快速找到语义相似对象”而设计的数据库系统；它牺牲一部分传统数据库能力，换取 AI 应用所需要的相似搜索性能。**
