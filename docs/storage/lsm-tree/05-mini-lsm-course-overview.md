# Mini-LSM Course Overview

## Tutorial Structure

![图片](https://images.spumn.eu.cc/blog/lsm-tree-06-e498f7d597f662e7.svg)

We have 3 parts (weeks) for this tutorial. In the first week, we will focus on the storage structure and the storage format of an LSM storage engine. In the second week, we will dive into compactions in depth and implement persistence support for the storage engine. In the third week, we will implement multi-version concurrency control.

- [The First Week: Mini-LSM](https://skyzh.github.io/mini-lsm/week1-overview.html)
- [The Second Week: Compaction and Persistence](https://skyzh.github.io/mini-lsm/week2-overview.html)
- [The Third Week: Multi-Version Concurrency Control](https://skyzh.github.io/mini-lsm/week3-overview.html)

To set up the environment, please take a look at [Environment Setup](https://skyzh.github.io/mini-lsm/00-get-started.html).

## Overview of LSM

An LSM storage engine generally contains 3 parts:

- **Write-ahead log** to persist temporary data for recovery.
- **SSTs on the disk** for maintaining a tree structure.
- **Mem-tables in memory** for batching small writes.

The storage engine generally provides the following interfaces:

- `Put(key, value)`: store a key-value pair in the LSM tree.
- `Delete(key)`: remove a key and its corresponding value.
- `Get(key)`: get the value corresponding to a key.
- `Scan(range)`: get a range of key-value pairs.

To ensure persistence,

- `Sync()`: ensure all the operations before `sync` are persisted to the disk.

Some engines choose to combine `Put` and `Delete` into a single operation called `WriteBatch`, which accepts a batch of key value pairs.

In this tutorial, we assume the LSM tree is using leveled compaction algorithm, which is commonly used in real-world systems.

### Write Path

![图片](https://images.spumn.eu.cc/blog/lsm-tree-08-420d62c1b728a519.svg)

The write path of LSM contains 4 steps:

- Write the key-value pair to write-ahead log, so that it can be recovered after the storage engine crashes.
- Write the key-value pair to memtable. After (1) and (2) completes, we can notify the user that the write operation is completed.
- When a memtable is full, we will freeze them into immutable memtables, and will flush them to the disk as SST files in the background.
- We will compact some files in some level into lower levels to maintain a good shape for the LSM tree, so that read amplification is low.

### Read Path

![图片](https://images.spumn.eu.cc/blog/lsm-tree-07-ac65b1a0e89ae999.svg)

When we want to read a key,

- We will first probe all the memtables from latest to oldest.
- If the key is not found, we will then search the entire LSM tree containing SSTs to find the data.

There are two types of read: lookup and scan. Lookup finds one key in the LSM tree, while scan iterates all keys within a range in the storage engine. We will cover both of them throughout the tutorial.