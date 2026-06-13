# Compaction Implementation

In this chapter, you will:
- Implement the compaction logic that combines some files and produces new files.
- Implement the logic to update the LSM states and manage SST files on the filesystem.
- Update LSM read path to incorporate the LSM levels.

## Task 1: Compaction Implementation

In this task, you will implement the core logic of doing a compaction -- merge sort a set of SST files into a sorted run. Specifically, the `force_full_compaction` and `compact` function.

Your compaction implementation should take all SSTs in the storage engine, do a merge over them by using `MergeIterator`, and then use the SST builder to write the result into new files. You will need to split the SST files if the file is too large. After compaction completes, you can update the LSM state to add all the new sorted run to the first level of the LSM tree.

Compaction should not block L0 flush, and therefore you should not take the state lock when merging the files. You should only take the state lock at the end of the compaction process when you update the LSM state.

You can assume that the user will ensure there is only one compaction going on. `force_full_compaction` will be called in only one thread at any time. The SSTs being put in the level 1 should be sorted by their first key and should not have overlapping key ranges.

Compaction Pseudo Code:

```
fn force_full_compaction(&self) {
    let ssts_to_compact = {
        let state = self.state.read();
        state.l0_sstables.clone().into_iter()
            .chain(state.levels[0].1.clone())
            .collect::<Vec<_>>()
    };
    let new_ssts = self.compact(FullCompactionTask(ssts_to_compact))?;
    {
        let _state_lock = self.state_lock.lock();
        let mut state = self.state.write();
        state.l0_sstables.clear();
        state.levels[0] = (new_ssts[0].first_key(), new_ssts);
    }
}
```

Because we always compact all SSTs, if we find multiple version of a key, we can simply retain the latest one. If the latest version is a delete marker, we do not need to keep it in the produced SST files.

## Task 2: Concat Iterator

Now that you have created sorted runs in your system, it is possible to do a simple optimization over the read path. You do not always need to create merge iterators for your SSTs. If SSTs belong to one sorted run, you can create a concat iterator that simply iterates the keys in each SST in order, because SSTs in one sorted run do not contain overlapping key ranges and they are sorted by their first key.

## Task 3: Integrate with the Read Path

Now that we have the two-level structure for your LSM tree, and you can change your read path to use the new concat iterator to optimize the read path.

You will need to change the inner iterator type of the `LsmStorageIterator`. After that, you can construct a two merge iterator that merges memtables and L0 SSTs, and another merge iterator that merges that iterator with the L1 concat iterator.

## Test Your Understanding

- What are the definitions of read/write/space amplifications?
- Is it correct that a key will take some storage space even if a user requests to delete it?
- Given that compaction takes a lot of write bandwidth and read bandwidth and may interfere with foreground operations, it is a good idea to postpone compaction when there are large write flow.
- Is it a good idea to use/fill the block cache for compactions? Or is it better to fully bypass the block cache when compaction?
- Some researchers/engineers propose to offload compaction to a remote server or a serverless lambda function. What are the benefits, and what might be the potential challenges?

