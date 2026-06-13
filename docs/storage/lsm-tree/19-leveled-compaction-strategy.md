# Leveled Compaction Strategy

In this chapter, you will:
- Implement a leveled compaction strategy and simulate it on the compaction simulator.
- Incorporate leveled compaction strategy into the system.

## Task 1: Leveled Compaction

In chapter 2 day 2, you have implemented the simple leveled compaction strategies. However, the implementation has a few problems:
- Compaction always include a full level. Note that you cannot remove the old files until you finish the compaction, and therefore, your storage engine might use 2x storage space while the compaction is going on.
- SSTs may be compacted across empty levels. An optimal strategy is to directly place the SST from L0 to the lowest level possible, so as to avoid unnecessary write amplification.

In this chapter, you will implement a production-ready leveled compaction strategy. The strategy is the same as RocksDB's leveled compaction.

### Task 1.1: Compute Target Sizes

In this compaction strategy, you will need to know the first/last key of each SST and the size of the SSTs.

You will need to compute the target sizes of the levels. Assume `base_level_size_mb` is 200MB and the number of levels (except L0) is 6. When the LSM state is empty, the target sizes will be:

```
L5: 200MB, L4: 0, L3: 0, L2: 0, L1: 0, L0: 0
```

Before the bottom level exceeds `base_level_size_mb`, all other intermediate levels will have target sizes of 0.

When the levels grow in size as more SSTs get compacted to that level, we will compute the target size based on the size of the last level. Assume `level_size_multiplier=10`:

```
L6: 300MB, L5: 30MB, L4: 3MB, L3: 0, L2: 0, L1: 0
```

At most one level can have a positive target size below `base_level_size_mb`.

### Task 1.2: Decide Base Level

Now, let us solve the problem that SSTs may be compacted across empty levels. When we compact L0 SSTs with lower levels, we do not directly put it to L1. Instead, we compact it with the first level with `target size > 0`.

### Task 1.3: Decide Level Priorities

Now that we will need to handle compactions below L0. L0 compaction always has the top priority. After that, we can compute the compaction priorities of each level by `current_size / target_size`. We only compact levels with this ratio `> 1.0`. The one with the largest ratio will be chosen for compaction with the lower level.

### Task 1.4: Select SST to Compact

Now, let us solve the problem that compaction always include a full level. When we decide to compact two levels, we always select the oldest SST from the upper level. You can know the time that the SST is produced by comparing the SST id.

After you choose the upper level SST, you will need to find all SSTs in the lower level with overlapping keys of the upper level SST. Then, you can generate a compaction task that contain exactly one SST in the upper level and overlapping SSTs in the lower level.

## Task 2: Integrate with the Read Path

The implementation should be similar to simple leveled compaction. Remember to change both get/scan read path and the compaction iterators.

## Related Readings

[Leveled Compaction - RocksDB Wiki](https://github.com/facebook/rocksdb/wiki/Leveled-Compaction)

## Test Your Understanding

- What is the estimated write amplification of leveled compaction?
- What is the estimated read amplification of leveled compaction?
- Finding a good key split point for compaction may potentially reduce the write amplification, or it does not matter at all?
- Imagine that a user was using tiered (universal) compaction before and wants to migrate to leveled compaction. What might be the challenges?
- What happens if compaction speed cannot keep up with the SST flushes?
- What is the peak storage usage for leveled compaction? Compared with universal compaction?
- Is it true that with a lower `level_size_multiplier`, you can always get a lower write amplification?

