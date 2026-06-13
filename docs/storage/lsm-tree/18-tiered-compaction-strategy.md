# Tiered Compaction Strategy

In this chapter, you will:
- Implement a tiered compaction strategy and simulate it on the compaction simulator.
- Incorporate tiered compaction strategy into the system.

The tiered compaction we talk about in this chapter is the same as RocksDB's universal compaction.

## Task 1: Universal Compaction

In this chapter, you will implement RocksDB's universal compaction, which is of the tiered compaction family compaction strategies. Similar to the simple leveled compaction strategy, we only use number of files as the indicator in this compaction strategy.

### Task 1.0: Precondition

In universal compaction, we do not use L0 SSTs in the LSM state. Instead, we directly flush new SSTs to a single sorted run (called tier). In the LSM state, `levels` will now include all tiers, where the lowest index is the latest SST flushed.

Universal compaction will only trigger tasks when the number of tiers (sorted runs) is larger than `num_tiers`.

### Task 1.1: Triggered by Space Amplification Ratio

The first trigger of universal compaction is by space amplification ratio. Space amplification can be estimated by `engine_size / last_level_size`. In our implementation, we compute the space amplification ratio by `all levels except last level size / last level size`.

When `all levels except last level size / last level size >= max_size_amplification_percent * 1%`, we will need to trigger a full compaction.

### Task 1.2: Triggered by Size Ratio

The next trigger is the size ratio trigger. From the first tier, we compute the size of `this tier / sum of all previous tiers`. For the first encountered tier where this value `> (100 + size_ratio) * 1%`, we will compact all previous tiers excluding the current tier.

### Task 1.3: Reduce Sorted Runs

If none of the previous triggers produce compaction tasks, we will do a compaction to reduce the number of tiers. We will simply take all tiers into one tier (subject by `max_merge_tiers`).

## Task 2: Integrate with the Read Path

As tiered compaction does not use the L0 level of the LSM state, you should directly flush your memtables to a new tier instead of as an L0 SST.

## Related Readings

[Universal Compaction - RocksDB Wiki](https://github.com/facebook/rocksdb/wiki/Universal-Compaction)

## Test Your Understanding

- What is the estimated write amplification of universal compaction?
- What is the estimated read amplification of universal compaction?
- What are the pros/cons of universal compaction compared with simple leveled/tiered compaction?
- How much storage space is it required (compared with user data size) to run universal compaction?
- Can we merge two tiers that are not adjacent in the LSM state?
- What happens if compaction speed cannot keep up with the SST flushes?
- SSDs also write its own logs. If the SSD has a write amplification of 2x, what is the end-to-end write amplification of the whole system?

