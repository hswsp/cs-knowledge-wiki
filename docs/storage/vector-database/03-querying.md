---
source: https://www.yuque.com/yangguangfanxing/nmhuv1/rwgt2m3mdq4xzww1
---

# Querying

> 原文链接：[https://www.yuque.com/yangguangfanxing/nmhuv1/rwgt2m3mdq4xzww1](https://www.yuque.com/yangguangfanxing/nmhuv1/rwgt2m3mdq4xzww1)

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239685248-82354cf6-9055-4e3f-bac7-373fad0d4efc.png)

## Recap

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239685278-688e3d2c-f8be-4496-8a70-0680b128bc51.png)

现代应用需要向量数据库 = **向量存储 + 语义搜索**

**插入向量：**

1. 创建嵌入向量 ![](https://cdn.nlark.com/yuque/__latex/712ecf7894348e92d8779c3ee87eeeb0.svg)
2. 将 ![](https://cdn.nlark.com/yuque/__latex/712ecf7894348e92d8779c3ee87eeeb0.svg) 存入专用数据库（附带属性）

**查询数据：**
3. 将查询嵌入为向量 ![](https://cdn.nlark.com/yuque/__latex/34c7b563b30bde3c748139530686798e.svg)
4. 找到 ![](https://cdn.nlark.com/yuque/__latex/34c7b563b30bde3c748139530686798e.svg) 的最近邻

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239685311-8b7ced95-4eff-46bf-9dad-aeac7479d005.png)

### RDBMS 与 VDBMS 对比

不同需求 → 不同设计

| 维度 | 传统数据库 (RDBMS) | 向量数据库 (VDBMS) |
| --- | --- | --- |
| 数据 | 记录 (Records) | 向量 (Vectors) |
| 查询 | 关系代数 | 最近邻 + 过滤 |
| 高级查询 | JOIN, GROUP, FK, 游标 | 无 |
| 更新 | 部分记录、多条记录 | 整体向量、插入/删除/替换 |
| 一致性 | 强一致 + 事务 | 最终一致，可调 |
| 索引更新 | 快 | 慢 |
| 存储 | 行/列存储, LSM | 向量是不透明 blob |
| 硬件/成本 | 均匀、适中 | 多样、昂贵（GPU） |
| 架构 | 更单体化 | 更分离化 |

**关键挑战：** 大向量、无结构、更新慢

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239685191-1aac898c-f310-42f4-a693-b43165d6aa12.png)

## Querying

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239685415-75e379de-a43f-434a-8dbd-797af9085dbb.png)

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239686819-90bd255f-cb4a-4517-80f7-1fa74435412f.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239686971-2331ec0e-f0fe-482e-85b5-3c3616d31310.png)

问题定义

- 已知：查询向量 ![](https://cdn.nlark.com/yuque/__latex/34c7b563b30bde3c748139530686798e.svg)
- 目标：找到"某些"在 ![](https://cdn.nlark.com/yuque/__latex/34c7b563b30bde3c748139530686798e.svg) 附近的向量

三个核心问题

1. **什么是"附近"？** → 相似度分数
2. **哪些向量？** → 各种查询类型
3. **何时返回？** → 尽可能快

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239686904-b0c6a718-2c75-4409-8aeb-d6f0f612424c.png)

### 距离 / 相似度评分

给定向量 ![](https://cdn.nlark.com/yuque/__latex/b6ab13654c57543b5284b8718983024c.svg)，计算表示相似性/距离的数值。

![](https://cdn.nlark.com/yuque/__latex/7efa025b9cc4c91bff8fc6772d670318.svg)

| 名称 | 函数 ![](https://cdn.nlark.com/yuque/__latex/22bdcff8bf5bc5607f921c1bd8f270d3.svg) | 值域 |
| --- | --- | --- |
| 欧氏距离 (Euclidean) | ![](https://cdn.nlark.com/yuque/__latex/243cfe645c22c90a653f5ea20902869e.svg) | ![](https://cdn.nlark.com/yuque/__latex/bae7c5590b2f5ae8e03201128be6e42a.svg) |
| 内积 (Inner Product) / MIPS | ![](https://cdn.nlark.com/yuque/__latex/438b8229bfb04e0d39fdb5a4f8f97e90.svg) | ![](https://cdn.nlark.com/yuque/__latex/783edc9638216c947a332014f0ef4d71.svg) |
| 余弦相似度 (Cosine) | ![](https://cdn.nlark.com/yuque/__latex/7bb3cfa2155282b17bb1582705fdac74.svg) | ![](https://cdn.nlark.com/yuque/__latex/6f2d7acc821a4b49fb6271ec04a220e9.svg) |
| 马氏距离 (Mahalanobis) | ![](https://cdn.nlark.com/yuque/__latex/efa1966a1aab9e15f11513ef7bd686ab.svg) | ![](https://cdn.nlark.com/yuque/__latex/bae7c5590b2f5ae8e03201128be6e42a.svg) |
| 汉明距离 (Hamming) | ![](https://cdn.nlark.com/yuque/__latex/0dafddebccca8fbd6c0a26edb8e5fe9a.svg) 的个数 | ![](https://cdn.nlark.com/yuque/__latex/af78e8e0d93943ec0d334f2f0465afce.svg) |
| 曼哈顿距离 (Manhattan) | ![](https://cdn.nlark.com/yuque/__latex/f5598c02e5f66e574c019bc86e31f150.svg) | ![](https://cdn.nlark.com/yuque/__latex/bae7c5590b2f5ae8e03201128be6e42a.svg) |

**注：** 内积和余弦是相似度（值越大越近），需反转才能用作距离。

MIPS = Maximum Inner Product Search。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239686679-bf1eaf74-e74f-4ffe-bf90-8d4cf511a817.png)

### 相似度转距离

将相似度分数 ![](https://cdn.nlark.com/yuque/__latex/56c1b0cb7a48ccf9520b0adb3c8cb2e8.svg) 反转的方法：

1. **简单反转：** 使用 ![](https://cdn.nlark.com/yuque/__latex/dd76c49da5c89db63372657a32bc870b.svg)

1. **余弦距离：** ![](https://cdn.nlark.com/yuque/__latex/cdfed1ce640ab800ee5b35747719fffc.svg)
2. **内积转换（增加一维）：**

![](https://cdn.nlark.com/yuque/__latex/aaf79150d6af9afc7e85e48dad2a7f7c.svg)

![](https://cdn.nlark.com/yuque/__latex/8a376b8b4a7d045094172598939e3160.svg)

1. **Sigmoid 变换（数值不稳定，不常用）：** ![](https://cdn.nlark.com/yuque/__latex/e301f614d373041710db77bfd2430318.svg)

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239686638-479538da-b4c0-4810-9909-b72198e32556.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239687200-5a5b2ef7-ce58-4b00-a688-a94b298a6947.png)

### kNN 查询（核心查询）

找到 ![](https://cdn.nlark.com/yuque/__latex/df976ff7fcf17d60490267d18a1e3996.svg) 个最近邻。

**形式化定义：**

返回 ![](https://cdn.nlark.com/yuque/__latex/5754c1f5c761acdeb3a80433a6974651.svg) 满足：

![](https://cdn.nlark.com/yuque/__latex/537cf585e3f9fd46f041804582b54695.svg)

![](https://cdn.nlark.com/yuque/__latex/025ae5ccdcf48d375316e80b0ff8bbf5.svg)

![](https://cdn.nlark.com/yuque/__latex/3c3d8fce727a2e681da24607980ac6b8.svg)

**pgvector 示例：**

```
SELECT * FROM items
ORDER BY vec <-> '[1,6.4,-2.1]'
LIMIT 5;
```

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239687240-a9862f77-3318-4720-aebf-1eba14ff585c.png)

### 范围查询（Range Query）

返回指定半径 ![](https://cdn.nlark.com/yuque/__latex/cead1760d9d5723460c4b8d4028f113a.svg) 内的所有向量：

![](https://cdn.nlark.com/yuque/__latex/f26de52dc5b0e13152f42c890634581c.svg)

**pgvector 示例：**

```
SELECT * FROM items
WHERE vec <-> '[1,6.4,-2.1]' < 4;
```

不常用，因为应用中难以确定合适的 ![](https://cdn.nlark.com/yuque/__latex/cead1760d9d5723460c4b8d4028f113a.svg)。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239687308-6122fe5a-6a35-4b17-be93-18ed906e15e4.png)

### 谓词查询（Predicated Queries）

**别名：** 属性过滤、混合查询（Hybrid Queries）

**定义：** kNN/范围查询 + 对关联属性的谓词过滤。

**Pinecone 示例：**

```
index.query(
    namespace="products",
    vector=[0.81, 0.46, 0.41, 0.64, 0.11],
    filter={
        "price": {"$lt": 100},
        "color": {"$eq": "green"}
    },
    top_k=3,
    include_metadata=True
)
```

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239687579-2c839088-69b8-4b9e-a3fc-6502de6d259f.png)

#### 核心问题

ANN (Approximate Nearest Neighbors) 索引与属性索引不兼容！

- **预过滤（Prefiltering）：** 先按属性过滤 → 再 kNN

- **后过滤（Postfiltering）：** 先 kNN → 再按属性过滤

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239687489-bbbdc880-16f2-42a2-95bb-74e4fc28b38b.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239687709-759a5cf4-ffe1-4314-83c1-ec15b446960d.png)

#### 三种过滤策略

1. **预过滤 + 全表扫描**

1. **后过滤 + 增大**![](https://cdn.nlark.com/yuque/__latex/df976ff7fcf17d60490267d18a1e3996.svg)

1. **单阶段扫描（Holy Grail）**

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239687743-9ef420f5-fc37-4460-a52c-c7cbd50b759d.png)

#### 示例实现

| 方法 | 说明 | 产品 |
| --- | --- | --- |
| Block-first (预过滤) | 构建谓词位图，kNN 时使用 | Milvus, AnalyticsDB-V |
| Pre-partition (预过滤) | 按属性范围预分区，查询多个分区合并 | Milvus |
| Visit-first (单阶段) | 从最近邻开始，逐步添加满足过滤条件的下一邻居 | Timescale (pgvectorscale / StreamingDiskANN) |

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239687768-e66cb978-1a73-4aa5-9de7-bcc27078fdf8.png)

### 多向量查询（Multi-Vector Queries）

**别名：** 混合搜索、多模态搜索

**场景：**

- 同时在多个向量空间搜索
- 单个实体有多个向量（如文本 + 图像、多角度人脸、多尺度编码）
- 使用多个嵌入模型

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239688096-b32754b6-66b8-4e02-b966-44a1c66ed193.png)

#### 朴素方法

1. 执行 ![](https://cdn.nlark.com/yuque/__latex/4760e2f007e23d820825ba241c47ce3b.svg) 次 kNN 搜索 → 得到 ![](https://cdn.nlark.com/yuque/__latex/230e9de640d9344b772e7b7022fb732b.svg) 个向量
2. 合并分数（最小值、加权平均、最大值、学习组合等）
3. 选择 top ![](https://cdn.nlark.com/yuque/__latex/df976ff7fcf17d60490267d18a1e3996.svg)

**问题：** 分数合并方式可能导致漏掉真正的最近邻。

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239688347-d36aec6b-fe4b-479d-bd4c-cfe0ce530271.png)

#### 经典 top-k 算法的问题

需要"获取下一候选"操作 → 大多数向量索引不支持！

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239688268-bbddd509-4b09-43c8-bffc-6c7f15847108.png)

#### 高级方法

1. **向量融合（Vector Fusion）**

1. **迭代合并（Milvus）**

1. **MUST [Wang, ICDE'24]** — 最新研究成果
2. **Timescale 流式检索索引** — 最新研究成果

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239688218-971db258-ad0e-40a3-852f-406c5b6a7e42.png)

### 重排序（Reranking）

许多 VDBMS 提供查询后的重排序步骤。

**流程：**

1. 获取 kNN 结果集
2. 应用重排序模型重新排序

**原因：**

- 距离分数衡量的是相似性，而非相关性
- 近似索引引入误差
- 重排序可以使用更复杂的模型
- 可以引入上下文信息

**效果示意：**

```
排序前：a  b  c  d  e  f  g  h  i  j
                               ↓ 重排序模型
排序后：c  j  b  g  i  d  a  h  e  f
```

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239688250-4caf648e-8d88-42ea-bb6d-79878f767945.png)

### 精确 kNN 很慢！

**暴力搜索：**

- 对所有 ![](https://cdn.nlark.com/yuque/__latex/a770a282bbfa0ae1ec474b7ed311656d.svg) 计算 ![](https://cdn.nlark.com/yuque/__latex/df7e782176383f4c1465a5251af8fdf6.svg)，再排序/用优先队列
- 时间复杂度：![](https://cdn.nlark.com/yuque/__latex/38deca9eb0c25e3cda4b9f68cec56807.svg) top-k 时间
- 支持精确 kNN、范围查询、谓词查询等所有类型

**解决方案：近似最近邻搜索（ANNS）**

ANNS 索引的权衡

| **好处** | **代价** |
| --- | --- |
| **搜索更快**✅ | **准确度降低**❌ |
| **-** | **更多内存**❌ |
| **-** | **更慢的更新**❌ |

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239688585-c524d744-29e5-4ab9-841f-bea69bc89b40.png)

示例：基于聚类的索引

- **构建：** 聚类向量，关联到最近质心
- **查询：** 找到离 ![](https://cdn.nlark.com/yuque/__latex/34c7b563b30bde3c748139530686798e.svg) 最近的质心，搜索其列表
- **误差：** ![](https://cdn.nlark.com/yuque/__latex/34c7b563b30bde3c748139530686798e.svg) 在边缘时可能漏掉更近的邻居
