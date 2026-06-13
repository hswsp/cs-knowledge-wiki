# Watermark and Garbage Collection

In this chapter, you will implement necessary structures to track the lowest read timestamp being used by the user, and collect unused versions from SSTs when doing the compaction.

## Task 1: Implement Watermark

Watermark is the structure to track the lowest `read_ts` in the system. When a new transaction is created, it should call `add_reader` to add its read timestamp for tracking. When a transaction aborts or commits, it should remove itself from the watermark. The watermark structures returns the lowest `read_ts` in the system when `watermark()` is called. If there are no ongoing transactions, it simply returns `None`.

You may implement watermark using a `BTreeMap`. It maintains a counter that how many snapshots are using this read timestamp for each `read_ts`. You should not have entries with 0 readers in the b-tree map.

## Task 2: Maintain Watermark in Transactions

You will need to add the `read_ts` to the watermark when a transaction starts, and remove it when `drop` is called for the transaction.

## Task 3: Garbage Collection in Compaction

Now that we have a watermark for the system, we can clean up unused versions during the compaction process.

- If a version of a key is above watermark, keep it.
- For all versions of a key below or equal to the watermark, keep the latest version.

也就是保留到<=watermark 的第一条记录。因为对于所有 version 都<=watermark 的记录，表明是在之前添加了，只是当前活跃的 txn 里没有再改动（包括删除），只需要最近的一条记录即可。

For example, if we have `watermark=3` and the following data:

```
a@4=3, a@3=2, a@2=1, b@2=1, c@4=4, d@3=del
```

If we do a compaction over these keys, we will get:

```
a@4=3, b@2=1, c@4=4
```

Assume these are all keys in the engine. If we do a scan at `ts=3`, we will get `a=3,b=1,c=4` before/after compaction. If we do a scan at `ts=4`, we will get `b=1,c=4` before/after compaction. Compaction will not and should not affect transactions with read `timestamp >= watermark`.

## Test Your Understanding

- In our implementation, we manage watermarks by ourselves with the lifecycle of `Transaction` (so-called un-managed mode). If the user intends to manage key timestamps and the watermarks by themselves, what do you need to do in the write_batch/get/scan API to validate their requests?
- Why do we need to store an `Arc` of `Transaction` inside a transaction iterator?
- What is the condition to fully remove a key from the SST file?
- For now, we only remove a key when compacting to the bottom-most level. Is there any other prior time that we can remove the key?

## Bonus Tasks

- Watermark. You may implement an amortized watermark structure by using a hash map or a cyclic queue.

