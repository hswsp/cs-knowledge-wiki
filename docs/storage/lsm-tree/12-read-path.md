# Read Path

In this chapter, you will:
- Integrate SST into the LSM read path.
- Implement LSM read path `get` with SSTs.
- Implement LSM read path `scan` with SSTs.

## Task 1: Two Merge Iterator

You have already implemented a merge iterator that merges iterators of the same type (i.e., memtable iterators). Now that we have implemented the SST formats, we have both on-disk SST structures and in-memory memtables. When we scan from the storage engine, we will need to merge data from both memtable iterators and SST iterators into a single one. In this case, we need a `TwoMergeIterator<X, Y>` that merges two different types of iterators.

You can implement `TwoMergeIterator` in `two_merge_iter.rs`. As we only have two iterators here, we do not need to maintain a binary heap. Instead, we can simply use a flag to indicate which iterator to read. Similar to `MergeIterator`, if the same key is found in both of the iterator, the first iterator takes the precedence.

## Task 2: Read Path - Scan

After implementing `TwoMergeIterator`, we can change the `LsmIteratorInner` to have the following type:

```
TwoMergeIterator<MergeIterator<MemTableIterator>, MergeIterator<SsTableIterator>>
```

So that our internal iterator of the LSM storage engine will be an iterator combining both data from the memtables and the SSTs.

Note that our SST iterator does not support passing an end bound to it. Therefore, you will need to handle the `end_bound` manually in `LsmIterator`. You will need to modify your `LsmIterator` logic to stop when the key from the inner iterator reaches the end boundary.

Because `SsTableIterator::create` involves I/O operations and might be slow, we do not want to do this in the `state` critical section. Therefore, you should firstly take read the `state` and clone the `Arc` of the LSM state snapshot. Then, you should drop the lock. After that, you can go through all L0 SSTs and create iterators for each of them, then create a merge iterator to retrieve the data.

## Task 3: Read Path - Get

For get requests, it will be processed as lookups in the memtables, and then scans on the SSTs. You can create a merge iterator over all SSTs after probing all memtables. You can seek to the key that the user wants to lookup. There are two possibilities of the seek: the key is the same as what the user probes, and the key is not the same / does not exist. You should only return the value to the user when the key exists and is the same as probed.

## Test Your Understanding

- Consider the case that a user has an iterator that iterates the whole storage engine, and the storage engine is 1TB large, so that it takes ~1 hour to scan all the data. What would be the problems if the user does so?

## Bonus Tasks

- The Cost of Dynamic Dispatch. Implement a `Box<dyn StorageIterator>` version of merge iterators and benchmark to see the performance differences.
- Parallel Seek. Creating a merge iterator requires loading the first block of all underlying SSTs. You may parallelize the process of creating iterators.

