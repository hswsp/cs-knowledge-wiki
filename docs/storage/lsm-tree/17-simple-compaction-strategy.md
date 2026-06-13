# Simple Compaction Strategy

In this chapter, you will:
- Implement a simple leveled compaction strategy and simulate it on the compaction simulator.
- Start compaction as a background task and implement a compaction trigger in the system.

## Task 1: Simple Leveled Compaction

In this chapter, we are going to implement our first compaction strategy -- simple leveled compaction. Simple leveled compaction is similar the original LSM paper's compaction strategy. It maintains a number of levels for the LSM tree. When a level (>= L1) is too large, it will merge all of this level's SSTs with next level.

The compaction strategy is controlled by 3 parameters:
- `size_ratio_percent`: lower level number of files / upper level number of files. When the ratio is too low, we should trigger a compaction.
- `level0_file_num_compaction_trigger`: when the number of SSTs in L0 is larger than or equal to this number, trigger a compaction of L0 and L1.
- `max_levels`: the number of levels (excluding L0) in the LSM tree.

Assume `size_ratio_percent=200`, `max_levels=3`, `level0_file_num_compaction_trigger=2`:

Assume the engine flushes two L0 SSTs. This reaches the `level0_file_num_compaction_trigger`, and your controller should trigger an L0->L1 compaction.

Now, L2 is empty while L1 has two files. The size ratio for L1 and L2 is `L2/L1=0/2=0 < size_ratio`. Therefore, we will trigger a L1+L2 compaction to push the data lower to L2.

Simple leveled compaction strategy always compact a full level, and keep a fanout size between levels, so that the lower level is always some multiplier times larger than the upper level.

We have already initialized the LSM state to have `max_level` levels. You should first implement `generate_compaction_task` that generates a compaction task based on the above 3 criteria. After that, implement `apply_compaction_result`.

## Task 2: Compaction Thread

Now that you have implemented your compaction strategy, you will need to run it in a background thread, so as to compact the files in the background. In `compact.rs`, `trigger_compaction` will be called every 50ms, and you will need to:
- generate a compaction task, if no task needs to be scheduled, return ok.
- run the compaction and get a list of new SSTs.
- Similar to `force_full_compaction`, update the LSM state.

## Task 3: Integrate with the Read Path

Now that you have multiple levels of SSTs, you can modify your read path to include the SSTs from the new levels. You will need to update the scan/get function to include all levels below L1.

## Test Your Understanding

- What is the estimated write amplification of leveled compaction?
- What is the estimated read amplification of leveled compaction?
- Is it correct that a key will only be purged from the LSM tree if the user requests to delete it and it has been compacted in the bottom-most level?
- Is it a good strategy to periodically do a full compaction on the LSM tree? Why or why not?
- If the storage device can achieve a sustainable 1GB/s write throughput and the write amplification of the LSM tree is 10x, how much throughput can the user get?
- Can you merge L1 and L3 directly if there are SST files in L2? Does it still produce correct result?

