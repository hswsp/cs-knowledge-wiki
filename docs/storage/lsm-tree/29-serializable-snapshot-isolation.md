# Serializable Snapshot Isolation

Now, we are going to add a conflict detection algorithm at the transaction commit time, so as to make the engine to have some level of serializable.

Let us go through an example of serializable. Consider that we have two transactions in the engine that:

```
txn1: get key1 -> put key1=2
txn2: get key1 -> put key2=2
```

The initial state of the database is `key1=1, key2=2`. Serializable means that the outcome of the execution has the same result of executing the transactions one by one in serial in some order. If we execute txn1 then txn2, we will get `key1=2, key2=2`. If we execute txn2 then txn1, we will get `key1=1, key2=1`.

However, with our current implementation, if the execution of these two transactions overlaps, we will get `key1=2, key2=1`. This cannot be produced with a serial execution of these two transactions. This phenomenon is called write skew.

With serializable validation, we can ensure the modifications to the database corresponds to a serial execution order.

One technique of serializable validation is to record read set and write set of each transaction in the system. We do the validation before committing a transaction (optimistic concurrency control). If the read set of the transaction overlaps with any transaction committed after its read timestamp, then we fail the validation, and abort the transaction.

## Task 1: Track Read Set in Get and Write Set

When `get` is called, you should add the key to the read set of the transaction. In our implementation, we store the hashes of the keys, so as to reduce memory usage and make probing the read set faster, though this might cause false positives when two keys have the same hash. You can use `farmhash::hash32` to generate the hash for a key. Note that even if `get` returns a key is not found, this key should still be tracked in the read set.

In `LsmMvccInner::new_txn`, you should create an empty read/write set for the transaction is `serializable=true`.

## Task 2: Track Read Set in Scan

In this tutorial, we only guarantee full serializability for `get` requests. You still need to track the read set for scans, but in some specific cases, you might still get non-serializable result.

A fully-working serializable validation will need to track key ranges, and using key hashes can accelerate the serializable check if only `get` is called.

## Task 3: Engine Interface and Serializable Validation

Now, we can go ahead and implement the validation in the commit phase. You should take the `commit_lock` every time we process a transaction commit. This ensures only one transaction goes into the transaction verification and commit phase.

You will need to go through all transactions with commit timestamp within range `(read_ts, expected_commit_ts)` (both excluded bounds), and see if the read set of the current transaction overlaps with the write set of any transaction satisfying the criteria. If we can commit the transaction, submit a write batch, and insert the write set of this transaction into `self.inner.mvcc().committed_txns`, where the key is the commit timestamp.

You can skip the check if `write_set` is empty. A read-only transaction can always be committed.

You should also modify the `put`, `delete`, and `write_batch` interface in `LsmStorageInner`. If `options.serializable = true`, `put`, `delete`, and the user-facing `write_batch` should create a transaction instead of directly creating a write batch.

## Task 4: Garbage Collection

When you commit a transaction, you can also clean up the committed txn map to remove all transactions below the watermark, as they will not be involved in any future serializable validations.

## Test Your Understanding

- If you have some experience with building a relational database, you may think about the following question: assume that we build a database based on Mini-LSM where we store each row in the relation table as a key-value pair and enable serializable verification, does the database system directly gain ANSI serializable isolation level capability? Why or why not?
- The thing we implement here is actually write snapshot-isolation that guarantees serializable. Is there any cases where the execution is serializable, but will be rejected by the write snapshot-isolation validation?
- There are databases that claim they have serializable snapshot isolation support by only tracking the keys accessed in gets and scans (instead of key range). Do they really prevent write skews caused by phantoms?

## Bonus Tasks

- Read-Only Transactions. With serializable enabled, we will need to keep track of the read set for a transaction.
- Precision/Predicate Locking. The read set can be maintained using a range instead of a single key.

