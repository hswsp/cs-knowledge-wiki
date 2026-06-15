---
source: https://www.yuque.com/yangguangfanxing/nmhuv1/wi8sesq43m5npm2q
---

# Segmenting

> 原文链接：[https://www.yuque.com/yangguangfanxing/nmhuv1/wi8sesq43m5npm2q](https://www.yuque.com/yangguangfanxing/nmhuv1/wi8sesq43m5npm2q)

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239809727-e48b6c58-c2fb-4694-9eea-81d0469da658.png)

## 基本概念

- 将向量集合拆分为多个**段（segment）**

- **插入**：追加到当前活跃段（growing segment）

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239809557-d01d4178-3014-4871-b411-d45516459388.png)

## 分段生命周期

1. 插入向量时追加到活跃段
2. 活跃段写满后，对其**构建索引**
3. 同时打开一个新活跃段接收后续插入
4. 查询时：搜索**所有段**，合并结果

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239809625-7875f0b7-4f11-4177-a058-6fba3ac7264a.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239809618-cde45f5a-18f0-42ca-905a-4b0ebe5424ba.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239809607-c483c6f9-6bbb-429f-a4db-6e635288e236.png)

## 删除：墓碑机制（Tombstones）

- 不真正删除向量，而是标记为已删除（墓碑）
- 避免昂贵的原地删除操作

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239809977-cb26ee6d-e0ab-4b67-9333-c4e581e0bc50.png)

## 合并：处理空洞

- 当段中大量向量被标记删除（含很多墓碑），段变"空"
- 合并这些**几乎为空**的段，回收空间

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239810066-1082ed6f-50ab-42f6-9833-3030d6d7bd06.png)![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239810300-925b25a0-b635-47c8-942c-a34b4d0e0583.png)

## 分布式：跨机器分配段

- 可以将不同段分配到不同机器
- 实现索引构建和查询的**并行化**

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239810346-69f3ed94-8ead-44f1-a403-8118f6eccd7b.png)

## 分段的好处

- **不再需要重建**（No more rebuilds）

- **每个索引体积小**，构建和搜索更快
- **活跃段 = 新鲜层**（freshness layer），新数据可立即查询
- **易于分布式**：可将段分配给不同分片（shard）并行处理

### 缺点

- 每次查询必须搜索所有段
- 若更新密集，会产生**写放大**（write amplification）

广泛应用于多种向量数据库，如 Milvus、Qdrant

![](https://cdn.nlark.com/yuque/0/2026/png/22382307/1780239810176-53e33d41-19a7-4889-b9c5-36f846908aad.png)

## 分段 vs. 分片

| 维度 | 分片（Sharding） | 分段（Segmenting） |
| --- | --- | --- |
| 目的 | 跨机器分布数据 | 避免重建索引、适应数据增长 |
| 作用于 | 单机也适用 | 单机也适用 |
| 增长方式 | 分片数固定，每个分片变大 | 分段数增长，每个段大小固定 |
| 侧重点 | 插入/写入性能 | 查询性能 |

**两者可以协同工作**：

- 按 key 分片（shard），每个分片内部再分段（segment）
- Qdrant、Milvus 均采用这种架构
