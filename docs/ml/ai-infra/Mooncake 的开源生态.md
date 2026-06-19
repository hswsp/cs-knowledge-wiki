# Mooncake 的开源生态

## 6.7.1 GitHub 仓库结构
Mooncake 项目采用模块化设计，主要组件分布在多个仓库中：

```latex
  kvcache-ai/
  ├── Mooncake/                        #   主仓库
  │     ├── mooncake-transfer-engine/ # Transfer Engine  核心
  │     │   ├── include/               # C++头文件
  │     │   ├── src/                   # 源码实现
  │     │   ├── python/                # Python绑定
  │     │   └── example/               # 示例程序
  │     ├── mooncake-store/            # 分布式KV Store
  │     │   ├── src/
  │     │   ├── include/
  │     │   └── python/
  │     ├── p2p-store/                 # P2P存储系统 
  │     ├── doc/                       # 文档
  │     ├── trace/                     # 开源trace数据
  │     └── scripts/                   # 部署脚本
  │
  ├── ktransformers/                   #   稀疏模型推理系统
  └── ai-serving-stack/                # AI Serving Stack参考架构

```

### 核心目录说明：
| 目录 | 说明 |
| :--- | :--- |
| `mooncake-transfer-engine/` | Transfer Engine核心实现，支持RDMA/GDR |
| `mooncake-store/` | 分布式KV Cache存储，支持多级缓存 |
| `p2p-store/` | P2P检查点分发系统 |
| `doc/` | 架构文档、API文档、部署指南 |
| `trace/` | 生产环境trace数据（JSONL格式） |


## 6.7.2 社区贡献
Mooncake 项目拥有活跃的开发者社区

贡献者统计：

+ GitHub Stars： 3000+
+ 活跃开发者： 20+
+ 贡献企业：阿里云、蚂蚁集团、趋境科技、9#AISoft等

主要贡献： 1. 阿里云：eRDMA支持、存储架构优化 2. 蚂蚁集团：生产环境部署验证 3.趋境科技：LMCache集成 4. NVIDIA：TensorRT-LLM集成

社区活动：

+ 每两个月发布一个Minor版本
+ 定期举办技术分享会
+ 参与GDC、KubeCon等行业会议

## 6.7.3 阿里云合作
阿里云是Mooncake项目的重要合作伙伴，在多个方面做出了贡献：

技术贡献：

+ 阿里云自研eRDMA网络的底层传输支持
+ 兼容eRDMA的GPUDirect实现 
+ 云上PD分离框架的规模化部署方案

产品集成：

+ 阿里云PAI平台集成Mooncake
+ 阿里云灵骏智算支持Mooncake部署
+ 提供云上快速部署模板

演讲与推广：

+ 2025全球开发者先锋大会（GDC）主题演讲
+ 《新技术新方案：产业共建大模型时代下的Mooncake》

## 6.7.4 未来规划
Mooncake 项目的未来发展方向：

技术路线： 1. TENT（Transfer Engine NEXT）：下一代传输引擎 - 声明式数据传输 - 更强的故障容错能力 - 更优的负载均衡

1. **多级缓存优化：**
2. 智能缓存预取
3. 自适应缓存替换策略
4. 跨集群缓存共享
5. **异构硬件支持：**
6. 昇腾NPU支持（已完成）
7. AMD GPU支持
8. 更多国产芯片适配

生态建设： 1. 与更多推理框架集成（TensorRT-LLM、Dynamo等） 2. 标准化KV Cache交换协议 3. 构建开放的推理服务生态

