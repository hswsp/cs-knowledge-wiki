# Write Path

In this chapter, you will:
- Implement the LSM write path with L0 flush.
- Implement the logic to correctly update the LSM state.

## Task 1: Flush Memtable to SST

At this point, we have all in-memory things and on-disk files ready, and the storage engine is able to read and merge the data from all these structures. Now, we are going to implement the logic to move things from memory to the disk (so-called flush), and complete the Mini-LSM week 1 tutorial.

You will need to modify `LSMStorageInner::force_flush_next_imm_memtable` and `MemTable::flush`. In `LSMStorageInner::open`, you will need to create the LSM database directory if it does not exist. To flush a memtable to the disk, we will need to do three things:

- Select a memtable to flush.
- Create an SST file corresponding to a memtable.
- Remove the memtable from the immutable memtable list and add the SST file to L0 SSTs.

We have not explained what is L0 (level-0) SSTs for now. In general, they are the set of SSTs files directly created as a result of memtable flush. In week 1 of this tutorial, we will only have L0 SSTs on the disk. We will dive into how to organize them efficiently using leveled or tiered structure on the disk in week 2.

Note that creating an SST file is a compute-heavy and a costly operation. Again, we do not want to hold the `state` read/write lock for a long time, as it might block other operations and create huge latency spikes in the LSM operations.

Flush L0 Pseudo Code:

```
fn force_flush_next_imm_memtable(&self) {
    let memtable_to_flush;
    {
        let state = self.state.read();
        // pick the earliest immutable memtable
        memtable_to_flush = state.imm_memtables.last().clone();
    }
    // build SST from memtable (outside lock)
    let sst = memtable_to_flush.flush()?;
    {
        let state_lock = self.state_lock.lock();
        let mut state = self.state.write();
        // remove memtable, add SST to L0
        state.imm_memtables.pop();
        state.l0_sstables.push(sst.sst_id());
        state.sstables.insert(sst.sst_id(), sst);
    }
}
```

## Task 2: Flush Trigger

When the number of memtables (immutable + mutable) in memory exceeds the `num_memtable_limit` in LSM storage options, you should flush the earliest memtable to the disk. This is done by a flush thread in the background.

In this task, you will need to implement `LsmStorageInner::trigger_flush` in `compact.rs`, and `MiniLsm::close` in `lsm_storage.rs`. `trigger_flush` will be executed every 50 milliseconds. If the number of memtables exceed the limit, you should call `force_flush_next_imm_memtable` to flush a memtable.

## Task 3: Filter the SSTs

Now that you have a fully working storage engine, and you can use the mini-lsm-cli to interact with your storage engine.

And lastly, let us implement a simple optimization on filtering the SSTs before we end this week. Based on the key range that the user provides, we can easily filter out some SSTs that do not contain the key range, so that we do not need to read them in the merge iterator.

You will need to change your read path functions to skip the SSTs that is impossible to contain the key/key range. You will need to implement `num_active_iterators` for your iterators so that the test cases can do the check on whether your implementation is correct or not.

## Test Your Understanding

- What happens if a user requests to delete a key twice?
- How much memory (or number of blocks) will be loaded into memory at the same time when the iterator is initialized?

## Bonus Tasks

- Implement Write Stall. When the number of memtables exceed the maximum number too much, you can stop users from writing to the storage engine.
- Prefix Scan. You may filter more SSTs by implementing the prefix scan interface and using the prefix information.

