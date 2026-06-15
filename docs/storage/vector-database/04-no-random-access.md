---
source: https://www.yuque.com/yangguangfanxing/nmhuv1/qw8iu3zhn35g944g
---

# No Random Access 算法详解

> 原文链接：[https://www.yuque.com/yangguangfanxing/nmhuv1/qw8iu3zhn35g944g](https://www.yuque.com/yangguangfanxing/nmhuv1/qw8iu3zhn35g944g)

**NRA（No Random Access）** 即无随机访问算法，也称 **Stream-Combine** 算法或 **TA 算法** 的变体。用于在多个排序列表中高效查找 top-k 结果，**仅通过顺序访问**完成，适用于随机访问成本很高的场景。

# 核心思想

在不进行随机访问的前提下，通过顺序扫描多个排序列表，利用**阈值（Threshold）** 尽早确定 top-k 结果。

# 与 TA 算法的对比

| 特性 | TA 算法（Threshold Algorithm） | NRA 算法（No Random Access） |
| --- | --- | --- |
| 访问方式 | 顺序访问 + 随机访问 | 仅顺序访问 |
| 数据源要求 | 支持随机访问 | 仅支持顺序访问 |
| 计算成本 | 较高（需要随机访问） | 较低（仅顺序访问） |
| 结果确定性 | 精确 top-k | 可能返回近似结果 |
| 适用场景 | 随机访问成本低 | 随机访问成本高或不可用 |

# 问题场景

- **m** 个排序列表：L₁, L₂, ..., Lₘ
- 每个列表按某个评分函数**降序排列**
- 每个对象出现在多个列表中（但不一定全部）
- **目标**：找到综合评分最高的 **k** 个对象

# 示例数据

| 列表1（价格评分） | 列表2（质量评分） | 列表3（服务评分） |
| --- | --- | --- |
| A: 0.9 | B: 0.8 | A: 0.7 |
| B: 0.8 | C: 0.7 | C: 0.6 |
| C: 0.7 | A: 0.6 | B: 0.5 |
| D: 0.6 | D: 0.5 | D: 0.4 |

- 综合评分 = 价格评分 + 质量评分 + 服务评分
- 目标：top-2

# 算法详细步骤

## 输入

- **m** 个排序列表：L₁, L₂, ..., Lₘ
- 聚合函数：![](https://cdn.nlark.com/yuque/__latex/6e4de09437a9b241b30e645632428003.svg)（如求和、平均等）
- **k**：需要返回的结果数量

## 数据结构

```
seen_objects: object_id → { scores[], seen_count, lower, upper }
threshold: 当前阈值
candidates: 候选结果集
positions: 每个列表的当前扫描位置
```

## 伪代码

```
1. 初始化：
   pos[i] = 0, S = ∅, C = ∅

2. 循环直到停止条件满足：
   a. 对每个列表 i，获取下一个对象 o 及其分数 s_i(o)
   
   b. 对每个获取到的对象 o：
      if o ∉ S:
         加入 S，初始化 lower=0, upper=乐观估计
      else:
         更新分数，更新 upper
      
      if o.seen_count == m:
         lower = upper = F(s₁, s₂, ..., sₘ)
      
      更新 lower = F(已见分数的保守估计)
   
   c. 更新阈值 T = F(各列表当前位置的分数)
   
   d. 维护候选集 C
   
   e. 停止条件：
      if |C| ≥ k 且 C 中第 k 个 lower ≥ T:
         停止

3. 返回 C 中 top-k
```

## 关键概念详解

上界（Upper Bound）与下界（Lower Bound）

- **下界**：保守估计，假设未见表分数为 **0**。`lower(o) = F(已见分数, 未见表最小可能分数)`
- **上界**：乐观估计，假设未见表分数为**当前位置的分数**。`upper(o) = F(已见分数, 未见表最大可能分数)`

阈值 T = F(当前各列表当前位置的分数)

阈值表示**尚未看到的对象可能达到的最高分数**。

停止条件

1. 候选集中至少有 **k** 个对象
2. 第 k 个候选对象的 **下界 ≥ 阈值**

## 示例执行过程

第 1 轮扫描

第 1 轮读取后，各列表的当前位置指针已指向下一个位置：

- L1: A(0.9)
- L2: B(0.8)
- L3: A(0.7)

A 没有在 L2 中出现，因为 L2 当前扫描到的最大边界是 `0.8`，所以 A 在 L2 中的未知分数最多只能估计为 `0.8`。

B 没有在 L1 中出现，B 没有在 L3 中出现。对于未知的 L1 和 L3：

- B 在 L1 中最多估计为 0.9
- B 在 L3 中最多估计为 0.7

| 对象 | 已见列表 | lower | upper |
| --- | --- | --- | --- |
| A | 1, 3 | 0.9+0+0.7=**1.6** | 0.9+0.8+0.7=**2.4** |
| B | 2 | 0+0.8+0=**0.8** | 0.9+0.8+0.7=**2.4** |

- 阈值 T = 0.9 + 0.8 + 0.7 = **2.4**

第 2 轮扫描

扫描到：

- L1: B(0.8)
- L2: C(0.7)
- L3: C(0.6)

阈值向量：(0.8, 0.7, 0.6)

| 对象 | 已见列表 | lower | upper |
| --- | --- | --- | --- |
| A | 1, 3 | **1.6** | **0.9+0.7+0.7=2.3** |
| B | 1, 2 | 0.8+0.8+0=**1.6** | 0.8+0.8+0.6=**2.2** |
| C | 2, 3 | 0+0.7+0.6=**1.3** | 0.8+0.7+0.6=**2.1** |

- 阈值 T = 0.8 + 0.7 + 0.6 = **2.1**

第 3 轮扫描

| 对象 | 已见列表 | lower | upper |
| --- | --- | --- | --- |
| A | 1, 2, 3 | 0.9+0.6+0.7=**2.2** | **2.2** |
| B | 1, 2, 3 | 0.8+0.8+0.5=**2.1** | **2.1** |
| C | 1, 2, 3 | 0.7+0.7+0.6=**2.0** | **2.0** |

- 阈值 T = 0.7 + 0.6 + 0.5 = **1.8**
- **停止条件满足**：第 2 名 lower(2.1) ≥ 阈值(1.8)

结果

```
top-2 = {A: 2.2, B: 2.1}
```

## Python 实现

```
class NRA:
    def __init__(self, lists, k, agg_func=sum):
        self.lists = lists
        self.k = k
        self.agg_func = agg_func
        self.m = len(lists)
        self.seen = {}
        self.candidates = []
        self.threshold = 0
        self.positions = [0] * self.m

    def get_next(self):
        next_objects = []
        for i in range(self.m):
            if self.positions[i] < len(self.lists[i]):
                obj_id, score = self.lists[i][self.positions[i]]
                next_objects.append((obj_id, score, i))
                self.positions[i] += 1
        return next_objects

    def update_bounds(self, obj_id, score, list_idx):
        if obj_id not in self.seen:
            self.seen[obj_id] = {
                'scores': [None] * self.m,
                'seen_count': 0,
            }
        obj = self.seen[obj_id]
        obj['scores'][list_idx] = score
        obj['seen_count'] += 1

        # 下界（未见表分数视为 0）
        known = [s for s in obj['scores'] if s is not None]
        obj['lower'] = self.agg_func(known + [0] * (self.m - len(known)))

        # 上界（未见表用当前位置分数估计）
        unknown_indices = [i for i in range(self.m) if obj['scores'][i] is None]
        upper_scores = list(known)
        for i in unknown_indices:
            if self.positions[i] < len(self.lists[i]):
                upper_scores.append(self.lists[i][self.positions[i]][1])
            else:
                upper_scores.append(0)
        obj['upper'] = self.agg_func(upper_scores)

        if obj['seen_count'] == self.m:
            obj['lower'] = obj['upper'] = self.agg_func(obj['scores'])

    def update_threshold(self):
        scores = []
        for i in range(self.m):
            if self.positions[i] < len(self.lists[i]):
                scores.append(self.lists[i][self.positions[i]][1])
            else:
                scores.append(0)
        self.threshold = self.agg_func(scores)

    def update_candidates(self):
        objects = [{'id': oid, 'lower': v['lower'], 'upper': v['upper']}
                   for oid, v in self.seen.items()]
        objects.sort(key=lambda x: x['upper'], reverse=True)

        self.candidates = []
        for i, obj in enumerate(objects):
            if i < self.k:
                self.candidates.append(obj)
            elif obj['lower'] >= objects[self.k - 1]['upper']:
                self.candidates.append(obj)
            else:
                break

    def should_stop(self):
        if len(self.candidates) < self.k:
            return False
        sorted_candidates = sorted(self.candidates, key=lambda x: x['lower'], reverse=True)
        return sorted_candidates[self.k - 1]['lower'] >= self.threshold

    def execute(self):
        while True:
            next_objs = self.get_next()
            if not next_objs:
                break
            for obj_id, score, list_idx in next_objs:
                self.update_bounds(obj_id, score, list_idx)
            self.update_threshold()
            self.update_candidates()
            if self.should_stop():
                break

        result = sorted(self.candidates, key=lambda x: x['lower'], reverse=True)[:self.k]
        return [(obj['id'], obj['lower']) for obj in result]

if __name__ == "__main__":
    lists = [
        [('A', 0.9), ('B', 0.8), ('C', 0.7), ('D', 0.6)],
        [('B', 0.8), ('C', 0.7), ('A', 0.6), ('D', 0.5)],
        [('A', 0.7), ('C', 0.6), ('B', 0.5), ('D', 0.4)],
    ]
    nra = NRA(lists, k=2)
    print("Top-2:", nra.execute())
```

# 算法变体

| 变体 | 说明 |
| --- | --- |
| **基础 NRA** | 标准顺序轮询 |
| **Sorted NRA** | 优先访问可能提供更多信息的列表 |
| **Parallel NRA** | 并行扫描多个列表 |
| **Adaptive NRA** | 动态调整访问策略 |

# 复杂度分析

时间复杂度

| 情况 | 复杂度 |
| --- | --- |
| 最坏 | ![](https://cdn.nlark.com/yuque/__latex/ff537d599754d7a821174a509721854a.svg) |
| 平均 | 远小于最坏情况 |
| 最佳 | ![](https://cdn.nlark.com/yuque/__latex/718935abcb8c9abfa507ab21c8fd2745.svg) |

N = 对象总数，m = 列表数

空间复杂度

- **O(N)**：需存储所有已见对象信息
- 可通过剪枝策略优化

# 优缺点

优点

- ✅ 无需随机访问
- ✅ 早期停止，不扫描全部数据
- ✅ 内存效率高
- ✅ 适用于流数据

缺点

- ❌ 可能返回近似结果
- ❌ 输入必须预先排序
- ❌ 阈值可能宽松，扫描数据较多
- ❌ 对数据分布敏感

# 实际应用场景

| 场景 | 说明 |
| --- | --- |
| **分布式搜索引擎** | 合并各分片排序结果流 |
| **数据库查询优化** | 多列排序查询，避免全表计算 |
| **推荐系统** | 多维度评分聚合 |
| **多媒体检索** | 多特征相似度合并 |

# 优化技巧

访问策略

- **Round-robin**：轮流访问各列表
- **Sorted access**：优先访问阈值贡献最大的列表
- **Adaptive access**：动态调整

内存优化

- 增量计算，只维护候选集
- 剪枝排除不可能进入 top-k 的对象
- 紧凑数据结构

并行化

- 多线程并行扫描
- 流水线重叠 I/O 与计算
- 分布式执行

# 相关算法比较

| 算法 | 随机访问 | 精确性 | 内存使用 | 适用场景 |
| --- | --- | --- | --- | --- |
| **NRA** | 不需要 | 可能近似 | 中等 | 顺序访问，随机访问成本高 |
| **TA** | 需要 | 精确 | 高 | 支持随机访问 |
| **J******* | 部分需要 | 精确 | 高 | 混合访问模式 |
| **Upper** | 不需要 | 近似 | 低 | 内存受限环境 |

# 总结

**NRA 算法的核心价值**：在无法进行随机访问的情况下，通过阈值机制和上下界计算，尽早确定 top-k 结果，显著减少数据访问量。

**适用领域**：

- 分布式搜索引擎
- 大规模数据库查询优化
- 流数据处理系统
- 多媒体内容检索
- 推荐系统
