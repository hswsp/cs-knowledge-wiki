# AI Infra 整体架构图

### 架构说明
AI Infra 整体架构包含四个核心层次：

+ **基础设施层**：GPU/TPU计算节点、高速网络（InfiniBand/RoCE）、分布式存储
+ **平台层**：Kubernetes编排、资源调度器、监控运维
+ **框架层**：PyTorch、TensorFlow、vLLM、DeepSpeed等训练和推理框架
+ **应用层**：大模型服务、AI Agent、多模态应用

![](https://images.spumn.eu.cc/ml/ai-infra/1781855579514-25579690-2c58-4cc4-b54a-1f99f4a5218e.svg)

