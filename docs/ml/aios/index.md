# AIOS: 从零构建 LLM 推理引擎

> 来源：[AIOS: Build an LLM Inference Engine from Scratch](https://github.com/wyann22/aios)
>
> 本专栏完整收录 AIOS 项目的 11 节课程，从 LLM 基础到 CUDA Graphs，手把手带你从零手写一个 LLM 推理引擎。

## 课程列表

- [Lesson 0：LLM 推理入门](./lesson-0-introduction)
- [Lesson 1：LLM 基础（Tokenizer、Decoder-only Transformer、Attention、参数量）](./lesson-1-llm-basics)
- [Lesson 2：从零手写 Qwen3 推理](./lesson-2-run-qwen3)
- [Lesson 3：从单文件到推理框架 — 将 run_qwen3.py 重构为 aios/ 包](./lesson-3-refactor-to-package)
- [Lesson 4：Prefill/Decode 拆分，理解 KV Cache](./lesson-4-kv-cache)
- [Lesson 5：Paged KV Cache](./lesson-5-paged-kv-cache)
- [Lesson 6：Static Batching 详解](./lesson-6-static-batching)
- [Lesson 7：Continuous Batching（连续批处理）](./lesson-7-continuous-batching)
- [Lesson 8：FlashInfer Flat Attention + Attention Backend](./lesson-8-flat-varlen-prefill)
- [Lesson 9：融合模型层（Fused Model Layers）](./lesson-9-fused-layers)
- [Lesson 10：CUDA Graphs（Decode Replay）](./lesson-10-cuda-graphs)
