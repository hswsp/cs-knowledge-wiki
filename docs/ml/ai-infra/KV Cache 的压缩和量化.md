# KV Cache 的压缩和量化

## 5.5.1 INT8/INT4 量化
KV Cache 量化是减少内存占用的有效手段，通过<font style="color:#DF2A3F;">降低精度来节省存储空间</font>。

### INT8量化原理
![](https://images.spumn.eu.cc/ml/ai-infra/1781682755083-f186f98e-f5d1-48be-bbca-c9b911ab79ac.svg)

### INT4 量化原理：
![](https://images.spumn.eu.cc/ml/ai-infra/1781683355833-6fe62fa8-eeb6-494a-8c3a-9edee24060bd.svg)

### 量化方案对比：
| 量化方案 | 压缩率 | 精度损失 | 计算开销 | 适用场景 |
| :--- | :--- | :--- | :--- | :--- |
| FP16 (基准) | 1x | 0% | 低 | 高精度需求 |
| INT8 | 2x | <1% | 低 | 通用场景 |
| INT4 | 4x | 2-5% | 中 | 内存受限 |
| INT4-GPTQ | 4x | 1-2% | 高 | 极致压缩 |
| AWQ | 4x | <1% | 高 | 高质量需求 |


## 5.5.2 FP8 量化
**FP8 是NVIDIA H100引入的新数据类型**，专为AI工作负载优化：

![](https://images.spumn.eu.cc/ml/ai-infra/1781683672785-7d729e6c-c335-459a-bcb8-34ca1460949e.svg)

### FP8 在KV Cache中的应用：
```python
#   使用FP8存储KV Cache（需要H100和Transformer Engine）
import transformer_engine.pytorch as te


# FP8 KV Cache    存储
key_cache_fp8 = te.fp8_cast_to_fp8(key_cache, te.fp8.FP8Types.E4M3)
value_cache_fp8 = te.fp8_cast_to_fp8(value_cache, te.fp8.FP8Types.E4M3)


# FP8     注意力计算（无需反量化）
output = te.fp8_attention(query, key_cache_fp8, value_cache_fp8)
```

## 5.5.3 压缩率与精度trade-off
选择合适的量化方案需要在压缩率和精度之间权衡：

### 不同量化方案的内存节省（LLaMA-70B, 32K序列）：
| 配置 | KV Cache大小 | 相对FP16 | 精度影响 |
| :--- | :--- | :--- | :--- |
| FP16 | 20.48 GB | 100% | 基准 |
| BF16 | 20.48 GB | 100% | 与FP16相当 |
| FP8 (E4M3) | 10.24 GB | 50% | <0.5% |
| INT8 | 10.24 GB | 50% | <1% |
| INT4 | 5.12 GB | 25% | 2-5% |
| INT4-AWQ | 5.12 GB | 25% | <1% |


### 量化最佳实践：
1. **分层量化**：不同层使用不同精度
    1. <font style="color:#DF2A3F;">早期层：使用FP16（对精度敏感）</font>
    2. 后期层：使用INT8或FP8（更鲁棒）
2. **动态量化**：根据激活值动态选择scale
3. **混合精度**：Key和Value使用不同精度
    1. Key: INT8（对精度更敏感）
    2. Value: INT4（更鲁棒）

```python
#   混合精度KV Cache示例
 class MixedPrecisionKVCache:
   def __init__(self, layer_idx: int):
       #   早期层使用更高精度
       if layer_idx < 10:
            self.key_dtype = torch.float16
            self.value_dtype = torch.float16
       elif layer_idx < 30:
            self.key_dtype = torch.int8
            self.value_dtype = torch.int8
       else:
            self.key_dtype = torch.int8
            self.value_dtype = torch.int4
```

