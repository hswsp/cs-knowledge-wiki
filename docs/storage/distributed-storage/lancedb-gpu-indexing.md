# LanceDB GPU 索引

做向量检索的朋友大概都有这个经历：数据量上到千万级之后，建索引就是泡杯咖啡等半小时；上亿级，挂着跑一晚上；十亿级，纯 CPU 跑 IVF-PQ 动辄数天。这也是为什么我看到 LanceDB 文档里那句 **"billions of rows in under four hours on a 1-8 GPU cluster"** 的时候，决定把它的 GPU 索引实现从头到尾看一遍。

结论先说：用法极其简单，加一个参数就完事。但它背后的架构设计其实很有意思——**GPU 计算部分是纯 PyTorch 写的，跑在 Python 进程里；Rust 核心一行 CUDA 代码都没有，它只是在等 Python 把"预制件"算完扔过来。**

---

## 用法：真的只加一个参数

### 环境准备

```bash
pip install lancedb
# 注意要装 CUDA 版 PyTorch，CPU 版会报错
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

如果你看到 `AssertionError: Torch not compiled with CUDA enabled`，说明装了 CPU 版 PyTorch，去 [pytorch.org](https://pytorch.org/get-started/locally/) 选 CUDA 版本重装一下就好。

### 最小示例

```python
import lancedb, numpy as np

db = lancedb.connect("./gpu_demo_db")
N, DIM = 100_000, 1536
data = [
    {"id": i, "vector": np.random.randn(DIM).astype(np.float32).tolist()}
    for i in range(N)
]
table = db.create_table("embeddings", data=data, mode="overwrite")

# 就这一行，GPU 加速
table.create_index(num_partitions=256, num_sub_vectors=96, accelerator="cuda")
```

Mac 用户（M1/M2/M3/M4）把 `"cuda"` 换成 `"mps"` 就走 Apple Silicon 的 GPU：

```python
table.create_index(num_partitions=256, num_sub_vectors=96, accelerator="mps")
```

新版 API 推荐用 Config 对象：

```python
from lancedb.index import IvfPq
table.create_index("vector", config=IvfPq(
    distance_type="l2", num_partitions=256, num_sub_vectors=96, accelerator="cuda"
))
```

### 参数调优指南

| 参数 | 建议值 | 说明 |
|---|---|---|
| `num_partitions` | `num_rows // 4096` | IVF 分区数，显存随这个线性涨 |
| `num_sub_vectors` | `dimension // 16`（1536→96） | PQ 子向量数，越大精度越高、索引越大 |
| `sample_rate` | 256 | 训练样本数 = 256 × num_partitions |
| `max_iterations` | 50 | KMeans 最大迭代次数 |

几个注意点：

- **batch size 是自动调优的**，遇到显存不够会自动减半重试，不用手动设
- **Ampere 以上 GPU**（A100、RTX 30/40 系）默认开 TF32，矩阵乘法有额外加速
- **GPU 只加速建索引，不加速查询**。查询还是走 Rust + SIMD
- 新插入的数据要 `optimize()` 才会进索引

### 验证索引状态

```python
table.wait_for_index()
stats = table.index_stats("vector_idx")
print(f"已索引行数: {stats.num_indexed_rows}")
print(f"索引大小: {stats.size_bytes / 1024 / 1024:.2f} MB")
```

---

## 架构 Pipeline：Python 调 Rust，两条路径的分叉点

LanceDB 底层是 Rust，`pip install lancedb` 装的是编译好的 native module。但 GPU 索引这条路径上，Python 和 Rust 的分工看全局图：

![LanceDB GPU Pipeline](https://images.spumn.eu.cc/b6cfd62fdca94c52beabbdbaa67c9e15-lancedb-gpu-pipeline.svg)

### 两个 Rust crate，一个被绕过了

`pip install lancedb` 装下来，Python 环境里有**两个独立编译的 Rust .so**：

```
Python 进程
├── lancedb/_lancedb*.so     ← Rust crate: lancedb（数据库层）
│   提供 connect、Table、add、search、CPU create_index
│
└── lance/lance*.so           ← Rust crate: lance（存储格式层）
    提供 LanceDataset、write_dataset，直接读写 .lance 文件
```

两个 crate 独立编译，通过 PyO3 分别暴露给 Python。正常操作全走 `lancedb._lancedb`。

### CPU 路径：Python → PyO3 → Rust 一条龙

不传 `accelerator` 时，Python 只做参数转发，全部计算在 Rust 里完成：

```
Python: LanceTable.create_index()
  → PyO3 FFI（参数转 Arrow）
Rust: lancedb::Table::create_index()
  ├─ CPU KMeans 聚类
  ├─ CPU 分区分配
  ├─ CPU PQ 码本训练 + 编码
  └─ 序列化索引文件 (.lance)
```

这条路径上 Python 就是个薄 wrapper，一行 GPU 代码都没有。

### GPU 路径：Python 先算完，再交给 Rust 收尾

传了 `accelerator="cuda"` 之后，Python SDK **故意绕开数据库层的 Rust Table**，走了一条旁路。核心分叉点在 `create_index()` 方法：

```python
# lancedb/table.py — 核心分支（简化）
def create_index(self, ..., accelerator=None, ...):
    if accelerator is not None:
        # 不调 self._table.create_index()（那是 Rust）
        # to_lance() 打开底层存储层自己干
        self.to_lance().create_index(column=column, accelerator=accelerator, ...)
        self.checkout_latest()  # 刷新 Rust Table 版本
        return
    # 默认：直接调 Rust
    return LOOP.run(self._table.create_index(column, ...))
```

`to_lance()` 的实现就是绕开 lancedb 的 Rust Table，用 lance crate 直接打开磁盘上的 `.lance` 目录：

```python
def to_lance(self, **kwargs):
    import lance
    return lance.dataset(self._dataset_path, ...)
```

完整的 GPU 路径调用栈：

```
Python: LanceTable.create_index(accelerator="cuda")
  → self.to_lance()（绕开数据库层，直接拿 LanceDataset）
  → Python/PyTorch GPU KMeans / 分区分配 / PQ 训练 / PQ 编码
  → Python 把中间结果写成临时 Lance 文件（shuffle buffers）
  → 文件路径 + centroids + codebook 作为 kwargs 传给 Rust
  → PyO3 FFI
Rust: lance::Dataset::create_index()
  ├─ 读 Python 写好的 shuffle buffers（跳过自己算分区）
  ├─ 按 partition 外部排序
  └─ 序列化最终索引文件
→ Python: checkout_latest() 刷新版本
```

### Rust 侧的衔接：读文件，不碰 GPU

Rust 侧（`shuffler.rs`）的代码直白得过分：

```rust
let shuffler = if let Some((path, buffers)) = precomputed_shuffle_buffers {
    info!("Precomputed shuffle files provided, skip IVF partition calculation.");
    let mut shuffler = IvfShuffler::try_new(num_partitions, Some(path), true, None)?;
    unsafe { shuffler.set_unsorted_buffers(&buffers); }
    shuffler
} else {
    // CPU 路径：自己算分区
    let mut shuffler = IvfShuffler::try_new(num_partitions, None, true, None)?;
    shuffler.write_unsorted_stream(stream).await?;
    shuffler
};
```

Rust 对 GPU 完全不知情。它拿到的就是文件路径和 Arrow 数组，做的事就是读文件、排序、写索引。

### 为什么这样设计

1. **Rust 不绑 CUDA。** 如果 Rust 直接做 GPU 计算，就得依赖 `cudarc` 之类的库——编译要 CUDA toolkit、wheel 要为每个 CUDA 版本打包、没 GPU 的用户装不上、Apple Silicon 直接没戏。把 GPU 逻辑放 Python/PyTorch 侧，Rust 一行 CUDA 都不用碰。
2. **PyTorch 把脏活全做了。** cuBLAS、TF32、MPS backend、`@torch.compile`、DataLoader、pin_memory——Rust 里要从零造，Python 里免费。
3. **文件路径是最简单的跨语言接口。** Python 算完写磁盘，Rust 读磁盘。不共享内存、不传指针。看起来笨，但极其稳定、可调试。
4. **建索引是离线操作。** 花 4 小时建索引，几毫秒文件 IO overhead 无所谓。
5. **对用户透明。** 你只加一个参数，完全不用知道背后谁在算。

---

## GPU 加速范围与 One-pass 流水线

IVF-PQ 索引构建有四个计算步骤，GPU 加速其中计算密集的部分：

| 步骤 | GPU? | 用什么算 |
|---|:---:|---|
| IVF KMeans 训练质心 | ✅ | PyTorch matmul + scatter-add |
| 全量数据分区分配（找最近质心） | ✅ | GPU 距离计算 + argmin |
| 残差向量计算 (vec - centroid) | ✅ | GPU 张量减法 |
| PQ 码本训练（每子空间 k=256 KMeans） | ✅ | PyTorch GPU KMeans |
| PQ 编码（找最近 codebook entry） | ✅ | GPU 距离计算 + argmin |
| shuffle buffer 写盘 | ❌ | CPU/pyarrow IO |
| 按 partition 外部排序 | ❌ | 纯 CPU/IO |
| HNSW 图构建（IVF_HNSW_PQ 时） | ❌ | 纯 Rust/CPU |
| 索引文件序列化 | ❌ | Rust/IO |
| **查询搜索** | ❌ | Rust + SIMD |

为什么查询不用 GPU？查询是低延迟 IO 密集型（随机读磁盘索引页），一次就看 nprobes × partition_size 个候选，CPU SIMD 足够快。把数十亿向量索引常驻 GPU 显存也不现实。

GPU 部分的入口在 `lance/dataset.py:_create_index_impl`，检测到 accelerator 后走 one-pass 流水线（数据从磁盘读两遍：一遍训练，一遍编码）：

```python
def _create_index_impl(self, column, ..., accelerator=None, ...):
    if accelerator is not None:
        # GPU 训练全在 Python 里
        ivf_centroids, ivf_kmeans, pq_codebook, pq_kmeans_list = \
            one_pass_train_ivf_pq_on_accelerator(...)
        shuffle_output_dir, shuffle_buffers = \
            one_pass_assign_ivf_pq_on_accelerator(...)
        kwargs["precomputed_shuffle_buffers"] = shuffle_buffers
        kwargs["precomputed_shuffle_buffers_path"] = os.path.join(shuffle_output_dir, "data")
    kwargs["ivf_centroids"] = pa.RecordBatch.from_arrays([ivf_centroids], "_ivf_centroids")
    kwargs["pq_codebook"]   = pa.RecordBatch.from_arrays([pq_codebook],   "_pq_codebook")
    # 最后调 Rust——但传入的是已经算好的结果
    index = self._ds.create_index(column, index_type, name, replace, train, storage_options, kwargs)
```

四个阶段。

**阶段 A — 训练 IVF 质心。** 采样 `k × sample_rate`（默认 256×k）个向量在 GPU 上做 KMeans：

```python
ds = TorchDataset(dataset, batch_size=20480, columns=[column],
                  samples=sample_size, cache=True)
kmeans = KMeans(k, metric=metric, device=accelerator, centroids=init_centroids)
kmeans.fit(ds)
centroids = kmeans.centroids.cpu().numpy()
```

`cache=True` 缓存采样数据，避免 KMeans 多轮迭代时重复读盘。

**阶段 B — 全量分配 + 残差。** 对整个数据集流式过 GPU：

```python
loader = DataLoader(torch_ds, batch_size=1, pin_memory=True, collate_fn=_collate_fn)
for batch in loader:
    vecs = batch[column].to(kmeans.device)
    partitions = kmeans.transform(vecs)
    residuals = vecs - kmeans.centroids[partitions]
```

`pin_memory=True` 让 CPU 端分配页锁定内存，CPU→GPU 走 DMA 异步拷贝，比普通内存快很多。残差按子向量拆分后回 CPU 写成临时 Lance 文件。

**阶段 C — 训练 PQ 码本。** 读阶段 B 的残差，每个子空间独立做 k=256 的 KMeans：

```python
for sub_vector in range(num_sub_vectors):
    kmeans_local = KMeans(256, metric=metric, device=accelerator)
    kmeans_local.fit(ds_fit, column=f"__residual_subvec_{sub_vector+1}")
    centroids_list.append(kmeans_local.centroids.cpu().numpy())
pq_codebook = np.stack(centroids_list)
```

256 个质心对应每子向量 8-bit 编码——这就是 PQ 压缩的来源。

**阶段 D — One-pass 编码。** 再过一遍全量数据，这次同时做分区分配和 PQ 编码：

```python
for batch in loader:
    vecs = batch[column].to(ivf_kmeans.device).reshape(-1, dim)
    partitions = ivf_kmeans.transform(vecs)
    residual_vecs = vecs - ivf_kmeans.centroids[partitions]
    pq_codes = torch.stack([
        pq_kmeans_list[i].transform(residual_vecs[:, i*sub_size:(i+1)*sub_size])
        for i in range(num_sub_vectors)
    ], dim=1).to(torch.uint8).cpu()
```

写出来的 shuffle buffer 是个标准 Lance 数据集，只有三列：

```
row_id:       uint64          # 原始行号
__ivf_part_id: uint32         # IVF 分区号
__pq_code:    list<uint8>[M]  # PQ 编码
```

这些文件存到 `tempfile.mkdtemp()` 创建的临时目录，文件路径传给 Rust。Rust 拿到后做外部排序、按分区切分、序列化最终索引文件——全是 CPU/IO 活。

---

## GPU 计算核心：三个 PyTorch 算子撑起来的 KMeans

GPU 计算的核心代码在 `python/python/lance/torch/kmeans.py`，整个文件不到 200 行。KMeans 每轮迭代就两件事：E-step（把每个向量分给最近质心）和 M-step（重新计算质心）。对应的 GPU 实现：

```python
def _fit_once(self, data, epoch, last_dist=0.0, column=None):
    # float32 累加器（即使输入 fp16/bf16）
    new_centroids = torch.zeros_like(self.centroids, device=self.device, dtype=torch.float32)
    counts_per_part = torch.zeros(self.centroids.shape[0], device=self.device)
    self.rebuild_index()  # 预计算 y2 = ||centroids||^2

    for chunk in data:
        chunk = chunk.to(self.device)                    # ① CPU→GPU
        ids, dists = self._transform(chunk, y2=self.y2)   # ② 距离计算 + argmin

        valid_mask = ids >= 0
        chunk, ids = chunk[valid_mask], ids[valid_mask]

        new_centroids.index_add_(0, ids, chunk.float())   # ③ scatter-add
        counts_per_part.index_add_(0, ids, ones[:ids.shape[0]])

    self.centroids = self._updated_centroids(new_centroids, counts_per_part)
```

靠三个 PyTorch 算子撑起来：

###  1. `.to(device)` — CPU→GPU 传输

底层就是 `cuMemcpyAsync`。配合 `pin_memory=True` 的 DataLoader 走 DMA 异步拷贝，这也是为什么前面流水线里 `DataLoader` 要开 `pin_memory`。

### 2. 矩阵乘法算距离

L2 距离没有用 `torch.cdist`（大 N×K 场景不如展开式快），而是用代数恒等式：

$$\|x - c\|^2 = \|x\|^2 + \|c\|^2 - 2 \cdot x \cdot c^T$$

核心就一个矩阵乘法 `x @ c.T`，cuBLAS 已经把这个操作优化到硬件极限。在 `distance.py` 里用 `@torch.compile` 编译成融合 kernel：

```python
@torch.compile
def _l2_distance(x, y, split_size, y2=None):
    if y2 is None:
        y2 = (y * y).sum(dim=1)
    for sub_vectors in x.split(split_size):
        min_dists, idx = argmin_l2(sub_vectors, y)
        part_ids.append(idx)
        distances.append(min_dists)
```

注意这里有个自动批大小机制：根据空闲显存动态算 split_size，遇到 CUDA OOM 自动减半重试。源码：

```python
def _suggest_batch_size(tensor):
    if torch.cuda.is_available():
        free_mem, _ = torch.cuda.mem_get_info()
        return free_mem // tensor.shape[0] // 4
    return 1024 * 128
```

三种距离度量的 GPU 实现：
- **L2**：`x² + c² - 2xcᵀ` 矩阵展开
- **Cosine**：先 `F.normalize` 再算 L2（数学上等价）
- **Dot**：`1 - x @ c.T`（最大化内积即最小化距离）

###  3. `index_add_` — GPU 上的 scatter-add

M-step 需要把每个向量累加到它所属簇的质心，等价于：

```python
for i in range(N):
    new_centroids[labels[i]] += X[i]
```

`index_add_` 就是 PyTorch 提供的 GPU 并行 scatter-add 原语，这一个操作完成了 KMeans M-step 的核心累加。

### 几个细节值得注意

- **float32 累加**：即使输入是 fp16/bf16，centroid 累加始终在 float32 上做，避免精度丢失
- **空簇恢复**：某个 cluster 空了就找最大 cluster 加 1% 高斯噪声一分为二
- **收敛条件**：`|total_dist - last_dist| / total_dist < 1e-4`
- **PyTorch 懒加载**：`lance/dependencies.py` 用 `_LazyModule` 代理 torch，没装 PyTorch 也能 `import lance`，只有访问 `.cuda` 属性时才真正 import
- **NaN 处理**：`torch.where(dists.isnan(), -1, idx)` 把无效向量标成 -1 跳过

---

##  GPU 索引：最小可运行实现

如果你理解了上面的思路，会发现 GPU IVF-PQ 没那么神秘。下面是一个去掉所有工程细节后的最小实现，核心逻辑和 LanceDB 一致：

### GPU KMeans

```python
import torch

def gpu_kmeans(X, k, max_iters=50, tol=1e-4, device="cuda"):
    X = X.to(device)
    N, D = X.shape
    centroids = X[torch.randperm(N, device=device)[:k]].clone()
    x2 = (X * X).sum(dim=1, keepdim=True)  # 预计算 ||x||^2

    for i in range(max_iters):
        # E-step: ||x-c||^2 = ||x||^2 + ||c||^2 - 2*x*c^T
        c2 = (centroids * centroids).sum(dim=1)
        dists = x2 + c2.unsqueeze(0) - 2 * X @ centroids.T
        labels = dists.argmin(dim=1)

        # M-step: scatter-add
        new_centroids = torch.zeros_like(centroids)
        counts = torch.zeros(k, device=device)
        new_centroids.index_add_(0, labels, X.float())
        counts.index_add_(0, labels, torch.ones(N, device=device))

        mask = counts > 0
        new_centroids[mask] /= counts[mask, None]
        # 空簇恢复：从最大簇分裂
        for j in (~mask).nonzero(as_tuple=False):
            new_centroids[j] = X[torch.randint(0, N, (1,), device=device)]

        shift = (centroids - new_centroids).norm().item()
        centroids = new_centroids.type_as(X)
        if shift < tol:
            break

    return centroids, labels
```

核心就三行：矩阵乘法算距离、argmin 分配、`index_add_` 累加质心。

### PQ 码本训练 + 编码

```python
def gpu_train_pq(residuals, num_sub_vectors, device="cuda"):
    residuals = residuals.to(device)
    N, D = residuals.shape
    sub_dim = D // num_sub_vectors
    codebooks = []
    for m in range(num_sub_vectors):
        sub_vecs = residuals[:, m*sub_dim:(m+1)*sub_dim]
        cb, _ = gpu_kmeans(sub_vecs, k=256, device=device)
        codebooks.append(cb.to(device))
    return codebooks

def gpu_pq_encode(residuals, codebooks, device="cuda"):
    residuals = residuals.to(device)
    N, D = residuals.shape
    sub_dim = D // len(codebooks)
    codes = torch.zeros(N, len(codebooks), dtype=torch.uint8, device=device)
    for m, cb in enumerate(codebooks):
        sub_vecs = residuals[:, m*sub_dim:(m+1)*sub_dim]
        c2 = (cb * cb).sum(dim=1)
        x2 = (sub_vecs * sub_vecs).sum(dim=1, keepdim=True)
        dists = x2 + c2.unsqueeze(0) - 2 * sub_vecs @ cb.T
        codes[:, m] = dists.argmin(dim=1).to(torch.uint8)
    return codes
```

### 完整 IVF-PQ 构建

```python
def build_ivf_pq_gpu(vectors, num_partitions, num_sub_vectors, device="cuda"):
    # 1. GPU 训练 IVF 质心
    centroids, ivf_labels = gpu_kmeans(vectors, num_partitions, device=device)
    # 2. 算残差
    vectors_gpu = vectors.to(device)
    residuals = vectors_gpu - centroids[ivf_labels.to(device)]
    # 3. GPU 训练 PQ 码本
    codebooks = gpu_train_pq(residuals, num_sub_vectors, device=device)
    # 4. GPU PQ 编码
    pq_codes = gpu_pq_encode(residuals, codebooks, device=device)
    return centroids.cpu(), codebooks, ivf_labels.cpu(), pq_codes.cpu()
```

### 进阶：IndicesBuilder 分步 API

LanceDB 也暴露了底层分步 API，如果你想自定义中间步骤（比如替换质心初始化）：

```python
import lance
from lance.indices import IndicesBuilder

ds = lance.dataset("./gpu_demo_db/embeddings.lance")
builder = IndicesBuilder(ds)

ivf_model = builder.train_ivf(column="vector", num_partitions=256,
                               metric_type="l2", accelerator="cuda")
builder.assign_ivf_partitions(ivf_model, accelerator="cuda")
pq_model = builder.train_pq(ivf_model, num_sub_vectors=96)  # CPU 即可
builder.assign_pq_codes(pq_model, ivf_model)
builder.save_index()
```

---

## CPU↔GPU 数据传输管线

```
Lance 文件（Arrow 列存）
    │
    ▼ lance.torch.data.LanceDataset（IterableDataset）
Arrow FixedSizeListArray → CPU torch.Tensor（torch.from_numpy）
    │
    ▼ DataLoader(pin_memory=True)
CPU 页锁定内存（支持 DMA 异步 H2D 拷贝）
    │
    ▼ chunk.to(device)
GPU 显存（cuMemcpyAsync）
    │
    ▼ GPU 计算：KMeans / 距离 / PQ 编码
GPU 显存
    │
    ▼ result.cpu()
CPU 内存
    │
    ▼ pyarrow RecordBatch
临时 Lance shuffle buffer（磁盘文件）
    │
    ▼ Rust 读文件路径
最终 .lance/indices/*.idx
```

关键优化点汇总：

- **`pin_memory=True`**：CPU 分配页锁定内存，H2D 走 DMA 异步拷贝，比普通内存快很多
- **流式处理**：不全量加载到显存，以 batch（默认 20480）过 GPU，显存占用只跟 batch size 和 centroid 数有关
- **`cache=True`**：KMeans 训练阶段对采样数据做缓存，多轮迭代不重复读盘
- **TF32**：`torch.backends.cuda.matmul.allow_tf32 = True`（默认开），Ampere+ 架构 matmul 有大幅加速
- **float32 累加**：即使输入 fp16/bf16，centroid 累加始终在 float32 上做，保证精度

---

## FAQ

**Q: PyTorch 用了哪些 CUDA 库？**
A: LanceDB 没有直接链接任何 CUDA 库，也没有手写 CUDA kernel、没用 faiss-gpu/cuML/cupy。所有 GPU 操作通过 PyTorch Python API，底层由 PyTorch wheel 自带的 cuBLAS（矩阵乘法）、CUB（reduce/argmin）、TorchInductor（`@torch.compile` 生成融合 kernel）完成。Apple Silicon 走 MPS backend。

**Q: 报错 `Torch not compiled with CUDA enabled`？**
A: 装了 CPU 版 PyTorch。去 pytorch.org 选 CUDA 版本重装。

**Q: 显存不够怎么办？**
A: LanceDB 内部自动减半 batch size 重试。实在不够就减小 `num_partitions`。

**Q: 支持 AMD ROCm 吗？**
A: 不支持。目前只支持 NVIDIA CUDA 和 Apple Silicon MPS。

**Q: 多卡训练支持吗？**
A: OSS 版单 GPU。Enterprise 版支持 1-8 GPU 集群分布式构建。

**Q: OSS 和 Enterprise 还有什么区别？**
A: OSS 只支持 IVF_PQ 单 GPU 手动建索引；Enterprise 额外支持 IVF+HNSW 自动 GPU 索引、分布式构建、异步自动索引管理。

---

## 参考

- LanceDB GPU 索引文档：https://docs.lancedb.com/indexing/gpu-indexing
- Lance 源码（GPU 部分）：https://github.com/lancedb/lance/tree/main/python/python/lance/torch
- IVF-PQ 论文：*Product Quantization for Nearest Neighbor Search* (Jegou et al., 2011)
- 10B 规模分布式索引：https://blog.lancedb.com/how-lancedb-accelerates-vector-search-at-10-billion-scale
