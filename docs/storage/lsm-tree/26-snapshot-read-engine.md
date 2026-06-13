# Snapshot Read - Engine Read Path and Transaction API

In this chapter, you will:
- Finish the read path based on previous chapter to support snapshot read.
- Implement the transaction API to support snapshot read.
- Implement the engine recovery process to correctly recover the commit timestamp.

At the end of the day, your engine will be able to give the user a consistent view of the storage key space.

## Task 1: LSM Iterator with Read Timestamp

The goal of this chapter is to have something like:

```
LsmIterator { read_ts: u64, inner: MergeIterator<...> }
```

To achieve this, we can record the read timestamp (which is the latest committed timestamp) when creating the transaction. When we do a read operation over the transaction, we will only read all versions of the keys below or equal to the read timestamp.

In this task, you will need to record a read timestamp in `LsmIterator`. And you will need to change your LSM iterator `next` logic to find the correct key.

## Task 2: Multi-Version Scan and Get

Now that we have `read_ts` in the LSM iterator, we can implement `scan` and `get` on the transaction structure, so that we can read data at a given point in the storage engine.

We recommend you to create helper functions like `scan_with_ts(/* original parameters */, read_ts: u64)` and `get_with_ts` if necessary in your `LsmStorageInner` structure. The original get/scan on the storage engine should be implemented as creating a transaction (snapshot) and do a get/scan over that transaction.

To create a transaction in `LsmStorageInner::scan`, we will need to provide a `Arc<LsmStorageInner>` to the transaction constructor. Therefore, we can change the signature of `scan` to take `self: &Arc<Self>` instead of simply `&self`.

You will also need to change your `scan` function to return a `TxnIterator`. We must ensure the snapshot is live when the user iterates the engine, and therefore, `TxnIterator` stores the snapshot object.

You do not need to implement `Transaction::put/delete` for now, and all modifications will still go through the engine.

## Task 3: Store Largest Timestamp in SST

In your SST encoding, you should store the largest timestamp after the block metadata, and recover it when loading the SST. This would help the system decide the latest commit timestamp when recovering the system.

## Task 4: Recover Commit Timestamp

Now that we have largest timestamp information in the SSTs and timestamp information in the WAL, we can obtain the largest timestamp committed before the engine starts, and use that timestamp as the latest committed timestamp when creating the `mvcc` object.

If WAL is not enabled, you can simply compute the latest committed timestamp by finding the largest timestamp among SSTs. If WAL is enabled, you should further iterate all recovered memtables and find the largest timestamp.

## Test Your Understanding

- So far, we have assumed that our SST files use a monotonically increasing id as the file name. Is it okay to use `<level>_<begin_key>_<end_key>_<max_ts>.sst` as the SST file name? What might be the potential problems with that?
- Consider an alternative implementation of transaction/snapshot. Is it viable to store the current LSM state directly in the transaction context in order to gain a consistent snapshot?
- Consider that you are implementing a backup utility of the MVCC Mini-LSM engine. Is it enough to simply copy all SST files out without backing up the LSM state? Why or why not?

