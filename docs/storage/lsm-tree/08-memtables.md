# Memtables

In this chapter, you will:
- Implement memtables based on skiplists.
- Implement freezing memtable logic.
- Implement LSM read path `get` for memtables.

## Task 1: SkipList Memtable

Firstly, let us implement the in-memory structure of an LSM storage engine -- the memtable. We choose crossbeam's skiplist implementation as the data structure of the memtable as it supports lock-free concurrent read and write.

crossbeam-skiplist provides similar interfaces to the Rust std's `BTreeMap`: `insert`, `get`, and `iter`. The only difference is that the modification interfaces (i.e., `insert`) only require an immutable reference to the skiplist, instead of a mutable one.

You will also notice that the `MemTable` structure does not have a `delete` interface. In the mini-lsm implementation, deletion is represented as a key corresponding to an empty value.

In this task, you will need to implement `MemTable::get` and `MemTable::put` to enable modifications of the memtable.

We use the `bytes` crate for storing the data in the memtable. `bytes::Byte` is similar to `Arc<[u8]>`. When you clone the `Bytes`, or get a slice of `Bytes`, the underlying data will not be copied.

## Task 2: A Single Memtable in the Engine

Now, we will add our first data structure, the memtable, to the LSM state. In `LsmStorageState::create`, you will find that when a LSM structure is created, we will initialize a memtable of id `0`. This is the mutable memtable in the initial state. At any point of the time, the engine will have only one single mutable memtable.

Taking a look at `lsm_storage.rs`, you will find there are two structures that represents a storage engine: `MiniLSM` and `LsmStorageInner`. `MiniLSM` is a thin wrapper for `LsmStorageInner`.

`LsmStorageState` stores the current structure of the LSM storage engine. For now, we will only use the `memtable` field, which stores the current mutable memtable.

Your `delete` implementation should simply put an empty slice for that key, and we call it a delete tombstone. Your `get` implementation should handle this case correspondingly.

To access the memtable, you will need to take the `state` lock. As our memtable implementation only requires an immutable reference for `put`, you ONLY need to take the read lock on `state` in order to modify the memtable. This allows concurrent access to the memtable from multiple threads.

## Task 3: Write Path - Freezing a Memtable

A memtable cannot continuously grow in size, and we will need to freeze them (and later flush to the disk) when it reaches the size limit. You may find the memtable size limit, which is equal to the SST size limit (not `num_memtables_limit`), in the `LsmStorageOptions`.

In this task, you will need to compute the approximate memtable size when put/delete a key in the memtable. This can be computed by simply adding the total number of bytes of keys and values when `put` is called.

Because there could be multiple threads getting data into the storage engine, `force_freeze_memtable` might be called concurrently from multiple threads. You will need to think about how to avoid race conditions in this case.

An intuitive way to structure the locking strategy is to modify everything in LSM state's write lock. This works fine for now. However, consider the case where you want to create a write-ahead log file for every memtables you have created.

To solve this problem, we can put I/O operations outside of the lock region. Then, we do not have costly operations within the state write lock region.

All state modification should be synchronized through the state lock. This ensures only one thread will be able to modify the LSM state while still allowing concurrent access to the LSM storage.

In this task, you will need to modify `put` and `delete` to respect the soft capacity limit on the memtable. When it reaches the limit, call `force_freeze_memtable` to freeze the memtable.

## Task 4: Read Path - Get

Now that you have multiple memtables, you may modify your read path `get` function to get the latest version of a key. Ensure that you probe the memtables from the latest one to the earliest one.

## Test Your Understanding

- Why doesn't the memtable provide a `delete` API?
- Is it possible to use other data structures as the memtable in LSM? What are the pros/cons of using the skiplist?
- Why do we need a combination of `state` and `state_lock`?
- Why does the order to store and to probe the memtables matter?
- Is the memory layout of the memtable efficient / does it have good data locality?
- After freezing the memtable, is it possible that some threads still hold the old LSM state and wrote into these immutable memtables?

## Bonus Tasks

- More Memtable Formats. You may implement other memtable formats. For example, BTree memtable, vector memtable, and ART memtable.

