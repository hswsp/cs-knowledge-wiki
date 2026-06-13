# Snapshot Read - Memtables and Timestamps

In this chapter, you will:
- Refactor your memtable/WAL to store multiple versions of a key.
- Implement the new engine write path to assign each key a timestamp.
- Make your compaction process aware of multi-version keys.
- Implement the new engine read path to return the latest version of a key.

## Task 1: MemTable, Write-Ahead Log, and Read Path

We have already made most of the keys in the engine to be a `KeySlice`, which contains a bytes key and a timestamp. However, some part of our system still did not consider the timestamps. In our first task, you will need to modify your memtable and WAL implementation to take timestamps into account.

**MemTable::get**: We keep the get interface so that the test cases can still probe a specific version of a key in the memtable. This interface should not be used in your read path after finishing this task.

**MemTable::put**: The signature should be changed to `fn put(&self, key: KeySlice, value: &[u8])` and You will need to convert a key slice to a `KeyBytes` in your implementation.

**MemTable::scan**: The signature should be changed to `fn scan(&self, lower: Bound<KeySlice>, upper: Bound<KeySlice>) -> MemTableIterator`.

**MemTable::flush**: Instead of using the default timestamp, you should now use the key timestamp when flushing the memtable to the SST.

**MemTableIterator**: It should now store `(KeyBytes, Bytes)` and the return key type should be `KeySlice`.

**Wal::recover** and **Wal::put**: Write-ahead log should now accept a key slice instead of a user key slice. When serializing and deserializing the WAL record, you should put timestamp into the WAL file and do checksum over the timestamp and all other fields.

**LsmStorageInner::get**: Previously, we implement `get` as first probe the memtables and then scan the SSTs. Now that we change the memtable to use the new key-ts APIs, we will need to re-implement the `get` interface. The easiest way to do this is to create a merge iterator over everything we have.

**LsmStorageInner::scan**: You will need to incorporate the new memtable APIs, and you should set the scan range to be `(user_key_begin, TS_RANGE_BEGIN)` and `(user_key_end, TS_RANGE_END)`.

## Task 2: Write Path

We have an `mvcc` field in `LsmStorageInner` that includes all data structures we need to use for multi-version concurrency control in this week.

In your `write_batch` implementation, you will need to obtain a commit timestamp for all keys in a write batch. You can get the timestamp by using `self.mvcc().latest_commit_ts() + 1` at the beginning of the logic, and `self.mvcc().update_commit_ts(ts)` at the end of the logic to increment the next commit timestamp. To ensure all write batches have different timestamps and new keys are placed on top of old keys, you will need to hold a write lock `self.mvcc().write_lock.lock()` at the beginning of the function.

## Task 3: MVCC Compaction

What we had done in previous chapters is to only keep the latest version of a key and remove a key when we compact the key to the bottom level if the key is removed. With MVCC, we now have timestamps associated with the keys, and we cannot use the same logic for compaction.

In this chapter, you may simply remove the logic to remove the keys. You may ignore `compact_to_bottom_level` for now, and you should keep ALL versions of a key during the compaction.

Also, you will need to implement the compaction algorithm in a way that the same key with different timestamps are put in the same SST file, even if it exceeds the SST size limit.

## Task 4: LSM Iterator

In the previous chapter, we implemented the LSM iterator to act as viewing the same key with different timestamps as different keys. Now, we will need to refactor the LSM iterator to only return the latest version of a key if multiple versions of the keys are retrieved from the child iterator.

You will need to record `prev_key` in the iterator. If we already returned the latest version of a key to the user, we can skip all old versions and proceed to the next key.

## Test Your Understanding

- What is the difference of `get` in the MVCC engine and the engine you built in week 2?
- In week 2, you stop at the first memtable/level where a key is found when `get`. Can you do the same in the MVCC version?
- How do you convert `KeySlice` to `&KeyBytes`? Is it a safe/sound operation?
- Why do we need to take a write lock in the write path?

