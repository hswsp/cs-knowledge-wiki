# 存储系统在 AI 中的作用

## 1.6.1 AI 工作负载的存储需求
AI 工作负载对存储系统有独特的需求。不同层级的存储对应不同的数据热度：

```latex
            ┌─────────┐
            │  热数据  │  ← Checkpoint（频繁读写）
            │ (NVMe)  │    容量：TB 级，带宽：10+ GB/s
            ├─────────┤
            │  温数据  │  ← 训练数据集
            │  (SSD)  │    容量：10–100 TB，带宽：1–5 GB/s
            ├─────────┤
            │  冷数据  │  ← 原始数据、归档
            │  (HDD)  │    容量：PB 级，带宽：100–500 MB/s
            └─────────┘
```

> **AI 存储的核心挑战：如何在 PB 级数据下，依然保持高吞吐的数据供给能力，让 GPU 不因等待数据而空转。**
>

---

## 1.6.2 训练数据存储
### 数据集规模对比
| 数据集 | 类型 | 大小 | 常见用途 |
| --- | --- | --- | --- |
| ImageNet | 图像 | 150 GB | 图像分类基准 |
| LAION-5B | 图文对 | 240 TB | 多模态预训练 |
| The Pile | 文本 | 800 GB | 语言模型预训练 |
| C4 | 文本 | 750 GB | T5 模型训练 |
| Common Crawl | 网页 | 数百 PB | 大规模预训练 |


### 数据加载瓶颈
训练中数据加载的速度直接决定了 GPU 利用率的高低。

![](https://images.spumn.eu.cc/ml/ai-infra/1781580017716-e7b11f18-0702-4269-aa47-c26a07f7db4d.svg)

### 数据加载优化策略
```python
from torch.utils.data import DataLoader
from torch.utils.data.distributed import DistributedSampler

# 1. 多进程数据加载
dataloader = DataLoader(
    dataset,
    batch_size=32,
    num_workers=8,              # 多进程加载
    pin_memory=True,            # 页锁定内存，加速 CPU→GPU 传输
    prefetch_factor=2,          # 每个 worker 预加载 2 个 batch
    persistent_workers=True,    # 保持 worker 进程
)

# 2. 分布式采样器
sampler = DistributedSampler(
    dataset,
    num_replicas=world_size,
    rank=rank,
    shuffle=True,
)
# 3. 使用 WebDataset(适合大规模数据集）
# WebDataset将数据打包为tar格式，顺序读取效率高 
from webdataset import WebDataset 
dataset = WebDataset("path/to/data-{000..999}.tar")
```

其他常见优化方式：

+ **本地 NVMe 缓存**：首次训练时将共享存储中的数据预取到本地
+ **内存缓存（tmpfs）**：小数据集可直接加载到内存
+ **NVIDIA DALI**：使用 GPU 进行数据预处理，进一步降低 CPU 瓶颈

---

## 1.6.3 Checkpoint 存储
### Checkpoint 的重要性
Checkpoint 是模型的“存档点”。训练过程中一旦发生故障，可以从 Checkpoint 恢复，避免从头开始训练。

```latex
    0% → 10% → 20% → 30% → 40% → 50%
                      ↑ 故障点
                  从 Checkpoint 恢复
                      (30%)
```

### Checkpoint 包含的内容
```python
checkpoint = {
    # 1. 模型参数
    'model_state_dict': model.state_dict(),

    # 2. 优化器状态（特别是 Adam 的动量）
    'optimizer_state_dict': optimizer.state_dict(),

    # 3. 学习率调度器
    'scheduler_state_dict': scheduler.state_dict(),

    # 4. 训练状态
    'epoch': current_epoch,
    'global_step': global_step,
    'best_loss': best_loss,

    # 5. 随机数种子（保证可复现）
    'torch_rng_state': torch.get_rng_state(),
    'cuda_rng_state': torch.cuda.get_rng_state_all(),

    # 6. 其他元数据
    'config': model_config,
    'training_args': args,
}

# 大模型Checkpoint大小估算：
# GPT-3 (175B参数)：
# - FP16模型：175B × 2字节 = 350 GB
# - 优化器状态：175B × 2 × 4字节 = 1.4 TB (Adam需要2份动量)
# - 总计：~1.75 TB per checkpoint
```

### 大模型 Checkpoint 大小估算
| 项目 | 计算方式 | 大小 |
| --- | --- | --- |
| 模型参数（FP16） | 175B × 2 字节 | 350 GB |
| 优化器状态（Adam） | 175B × 2 × 4 字节 | 1.4 TB |
| **总计** |  | **~1.75 TB / 每个 Checkpoint** |


### Checkpoint 策略
| 策略 | 频率 | 保留数量 | 适用场景 |
| --- | --- | --- | --- |
| 定期保存 | 每 N 步 | 最近 K 个 | 常规训练 |
| 最佳模型 | 验证提升时 | 1–3 个 | 需要最优模型 |
| 故障恢复 | 每 N 分钟 | 1 个 | 长时训练 |
| 分层保存 | 不同频率 | 多级 | 重要实验 |


### Checkpoint 保存优化
```python
# Checkpoint保存优化
import torch.distributed as dist

# 1. 异步保存（不阻塞训练）
def async_save_checkpoint(state, path):
    # 使用后台线程保存
    import threading
    thread = threading.Thread(target=torch.save, args=(state, path))
    thread.start()
    return thread

# 2. 仅rank 0保存（减少IO竞争）
if dist.get_rank() == 0:
    torch.save(checkpoint, save_path)
dist.barrier()  # 等待rank 0完成

# 3. 分片保存（大模型）
# 每个rank保存自己的部分
local_state = {
    'model_shard': model.local_state_dict(),
    'optimizer_shard': optimizer.local_state_dict(),
}
torch.save(local_state, f"{save_path}/rank_{rank}.pt")
```

---

## 1.6.4 高性能文件系统
### 并行文件系统对比
| 文件系统 | 开发者 | 特点 | 适用场景 |
| --- | --- | --- | --- |
| Lustre | Intel / 开源 | 成熟稳定，大规模部署 | HPC 集群 |
| GPFS / Spectrum Scale | IBM | 企业级特性丰富 | 企业 HPC |
| BeeGFS | ThinkParQ | 易部署，性能好 | 中小型集群 |
| Ceph | 开源 | 统一存储，高可用 | 云原生 |
| WekaFS | Weka | 极致性能，NVMe 优化 | AI / ML |
| JuiceFS | 开源 | 云原生，元数据分离 | 混合云 |


### Lustre 架构
Lustre 是 HPC 和 AI 训练集群中广泛使用的并行文件系统。

![](https://images.spumn.eu.cc/ml/ai-infra/1781579675466-6abeec04-8fa6-4a5d-99e3-70ca145e3ee0.svg)

MDS (元数据服务器)

+ 管理文件元数据 (权限、位置等)
+ 处理目录操作
+ 通常双机热备

Lustre 的特点：

+ **分离元数据和数据路径**：可独立扩展元数据服务器和对象存储；
+ **多个 OSS 提供并行 I/O 能力**；
+ **单文件可条带化到多个 OST**，提高带宽。

OSS = **Object Storage Server**（对象存储服务器） 

是指运行Lustre服务栈的**物理服务节点**，负责处理客户端的I/O请求、管理后端挂载的OST存储设备、协调文件锁等逻辑，是整个数据平面的服务载体。

OST = **Object Storage Target**（对象存储目标/OST存储卷） 

是指 OSS节点下挂载的**逻辑/物理块存储设备**（通常是RAID阵列/多盘组成的本地存储池，底层格式化用`ldiskfs(ext4变体)`或`ZFS`），是**真正落盘存放用户文件数据的地方**：Lustre会把一个大文件拆成多个对象， striped分布到不同OST上实现并行读写

### 存储性能基准
| 指标 | 最低要求 | 推荐配置 | 理想配置 |
| --- | ---: | ---: | ---: |
| 顺序读带宽 | 1 GB/s | 5 GB/s | 10+ GB/s |
| 顺序写带宽 | 500 MB/s | 2 GB/s | 5+ GB/s |
| 随机读 IOPS | 10K | 50K | 100K+ |
| 元数据操作 | 1K ops/s | 5K ops/s | 10K+ ops/s |
| 延迟 | <10 ms | <5 ms | <1 ms |


---

## 1.6.5 存储优化最佳实践
```python
# 1. 本地缓存策略
import os

# 将数据预读到本地NVMe SSD
local_cache = "/local_ssd/cache"
os.makedirs(local_cache, exist_ok=True)

# 首次访问时从共享存储复制
if not os.path.exists(f"{local_cache}/data"):
    os.system(f"cp -r /shared_storage/data {local_cache}/")

# 2. 内存缓存（适合小数据集）
# 将整个数据集加载到内存
import numpy as np
data = np.load("/shared_storage/dataset.npy") # 加载到内存

# 3. 使用内存文件系统 (tmpfs)
# mount -t tmpfs -o size=100G tmpfs /dev/shm/cache

# 4. 数据预处理流水线优化
from torchvision import transforms

transform = transforms.Compose([
    transforms.RandomResizedCrop(224),
    transforms.RandomHorizontalFlip(),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225]),
])
# 注意：预处理在CPU上完成，可能成为瓶颈
# 考虑使用NVIDIA DALI进行GPU加速预处理
```

---

## 小结
本节介绍了存储系统在 AI 训练和推理中的关键作用：

+ AI 存储面临的核心挑战是：在 PB 级数据下保持数据供给不成为瓶颈；
+ 不同热度的数据需要适配不同性能的存储层级；
+ 数据加载优化可以显著提升 GPU 利用率；
+ 在大模型训练中，Checkpoint 的写入和读取本身就是很大的存储挑战；
+ Lustre 等并行文件系统是 AI 集群的标配存储方案。

> **AI 存储的核心目标：让 GPU 永远不因为等待数据而空转。**
>

