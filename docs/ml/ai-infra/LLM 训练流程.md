# LLM 训练流程

大语言模型的训练通常分为三个阶段：预训练（Pre-training）、**<font style="color:#DF2A3F;">监督微调（SFT）</font>**和基于人类反馈的强化学习（RLHF）。

## 2.2.1 预训练（Pre-training）
预训练是LLM训练的第一阶段，目标是让模型学习通用的语言表示和世界知识。

### 训练目标：下一个Token预测
预训练采用<font style="color:#DF2A3F;">自监督学习</font>方式，目标是预测序列中的下一个token：

$ \mathcal{L}{\text{pretrain}} = -\sum_{t=1}^{T} \log P(x_t | x_{<t}; \theta) $

```python
#   预训练伪代码
  for batch in dataloader:
        input_ids = batch['input_ids']       # [batch_size, seq_len]
        labels = batch['labels']           #   向右偏移一位的input_ids
        logits = model(input_ids)             # [batch_size, seq_len, vocab_size]
        loss = cross_entropy(logits, labels)


        loss.backward()
        optimizer.step()

```

### 预训练数据
| 数据源 | 占比 | 说明 |
| :--- | :--- | :--- |
| Common Crawl | 60-80% | 网页数据，需要清洗 |
| 书籍/文学 | 5-15% | 高质量长文本 |
| Wikipedia | 3-5% | 百科知识 |
| 代码 | 10-20% | GitHub等代码库 |
| 学术论文 | 2-5% | ArXiv等 |


### 典型预训练配置
| 模型 | 参数量 | 训练Token数 | 批次大小 | 学习率 | 训练时长 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| GPT-3 | 175B | 300B | 3.2M | 0.6×10⁻⁴ | ~数月 |
| LLaMA-2 | 70B | 2T | 4M | 1.5×10⁻⁴ | ~数月 |
| GPT-4 | ~1.8T | ~13T | 未知 | 未知 | 未知 |


### Chinchilla Scaling Laws
DeepMind 的Chinchilla研究表明，模型参数量 $ N $ 和训练token数 $ D $ 应满足：

$ D \approx 20N $

即对于给定计算预算，模型大小和数据量应该同时扩展。例如： - 70B参数的模型应该训练约1.4T tokens - 这与早期只关注参数量的做法不同

## 2.2.2 监督微调（Supervised Fine-Tuning, SFT）
预训练后的模型需要通过SFT学习遵循指令和完成任务的能力。

### SFT数据格式
SFT数据通常采用对话格式

```python

{
  "messages": [
    {"role": "system", "content": "你是一个有帮助的助手。"},
    {"role": "user", "content": "解释什么是机器学习。"},
    {"role": "assistant", "content": "机器学习是人工智能的一个分支..."}
  ]
}
```

### 训练目标
SFT只在assistant的回复上计算损失

$ \mathcal{L}{\text{SFT}} = -\sum_{(x, y) \in \mathcal{D}} \sum_{t=1}^{|y|} \log P(y_t | x,y_{<t}; \theta) $

```python
def compute_sft_loss(model, batch):
           """
           只在assistant回复上计算损失
           """
           input_ids = batch['input_ids']
           labels = batch['labels']
           loss_mask = batch['loss_mask']      # 1 表示assistant回复的位置
           logits = model(input_ids)


           #   应用loss mask
           losses = F.cross_entropy(logits.view(-1, vocab_size), labels.view(-1),
           losses = losses * loss_mask.view(-1)


           return losses.sum() / loss_mask.sum()

```

### SFT vs 预训练的关键区别
| 方面 | 预训练 | SFT |
| :--- | :--- | :--- |
| 数据量 | 万亿级tokens | 十万到百万级样本 |
| 数据质量 | 原始网页数据 | 人工标注/高质量数据 |
| 训练目标 | 无监督 | 有监督 |
| 学习率 | 较大 (~1e-4) | 较小 (~1e-5) |
| 训练轮数 | 1 epoch | 3-5 epochs |


## 2.2.3 RLHF （人类反馈强化学习）
RLHF通过人类偏好数据进一步对齐模型行为，使其输出更符合人类期望。RLHF三阶段流程

![](https://images.spumn.eu.cc/ml/ai-infra/1781588387596-106ebd41-bdd3-4962-859c-80a40bfb42ad.svg)

### 奖励模型训练
对于偏好对 $ (x, y_w, y_l) $，其中 $ y_w $ 是人类偏好的回复，$ y_l $ 是不偏好的回复:

$ \mathcal{L}{\text{RM}} = -\mathbb{E}{(x, y_w, y_l)}\left[\log \sigma\left(r(x, y_w) - r(x,y_l)\right)\right] $

### PPO （Proximal Policy Optimization）
PPO 是RLHF中常用的优化算法，目标函数：

$ \mathcal{L}{\text{PPO}} = \mathbb{E}{(x, y)}\left[\min\left(r_t(\theta)\hat{A}_t, \text{clip}(r_t(\theta), 1-\epsilon, 1+\epsilon)\hat{A}_t\right)\right] $

其中：

+ $ r_t(\theta) = \frac{\pi_\theta(y_t|x, y_{<t})}{\pi_{\theta_{\text{old}}}(y_t|x, y_{<t})} $是重要性采样比率
+ $ \hat{A}_t $ 是优势函数估计
+ $ \epsilon $ 是裁剪参数（通常 0.1 或0.2）

### KL散度约束
为了防止策略偏离SFT模型太远，加入KL散度惩罚：

$ \mathcal{L}{\text{total}} = \mathcal{L}{\text{PPO}} - \beta \cdot \text{KL}(\pi_\theta |\pi_{\text{SFT}}) $

### DPO（Direct Preference Optimization）
DPO是RLHF的替代方案，直接用偏好数据优化策略，无需显式训练奖励模型：

$ \mathcal{L}{\text{DPO}} = -\mathbb{E}{(x, y_w, y_l)}\left[\log \sigma\left(\beta \log\frac{\pi_\theta(y_w|x)}{\pi_{\text{ref}}(y_w|x)} - \beta \log \frac{\pi_\theta(y_l|x)}{\pi_{\text{ref}}(y_l|x)}\right)\right] $

DPO 的优势：

+ 更简单，无需训练奖励模型
+ 训练更稳定
+ 计算开销更小

