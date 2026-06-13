# Week 3 Overview: Multi-Version Concurrency Control

In this part, you will implement MVCC over the LSM engine that you have built in the previous two weeks. We will add timestamp encoding in the keys to maintain multiple versions of a key, and change some part of the engine to ensure old data are either retained or garbage-collected based on whether there are users reading an old version.

The general approach of the MVCC part in this tutorial is inspired and partially based on BadgerDB.

The key of MVCC is to store and access multiple versions of a key in the storage engine. Therefore, we will need to change the key format to `user_key + timestamp (u64)`. And on the user interface side, we will need to have new APIs to help users to gain access to a history version.

In previous parts, we assumed that newer keys are in the upper level of the LSM tree, and older keys are in the lower level of the LSM tree. During compaction, we only keep the latest version of a key if multiple versions are found in multiple levels. In the MVCC implementation, the key with a larger timestamp is the newest key.

Generally, there are two ways of utilizing a storage engine with MVCC support. If the user uses the engine as a standalone component and do not want to manually assign the timestamps of the keys, they will use transaction APIs to store and retrieve data from the storage engine. Timestamps are transparent to the users. The other way is to integrate the storage engine into the system, where the user manages the timestamps by themselves.

We use the terminologies of BadgerDB to describe these two usages: the one the hides the timestamp is un-managed mode, and the one that gives the user full control is managed mode.

In this week, we will first spend 3 days doing a refactor on table format and memtables. We will change the key format to key slice and a timestamp. After that, we will implement necessary APIs to provide consistent snapshots and transactions.

We have 7 chapters (days) in this part:
- Day 1: Timestamp Key Refactor. You will change the `key` module to the MVCC one.
- Day 2: Snapshot Read - Memtables and Timestamps. You will refactor the memtable and the write path to support multiple version reads/writes.
- Day 3: Snapshot Read - Transaction API. You will implement the transaction API and finish the rest part of read/write path.
- Day 4: Watermark and Garbage Collection. You will implement the watermark computation algorithm and implement garbage collection at compaction time.
- Day 5: Transaction and Optimistic Concurrency Control. You will create a private workspace for all transactions and commit them in batch.
- Day 6: Serializable Snapshot Isolation. You will implement the OCC serializable checks.
- Day 7: Compaction Filter. We will generalize the compaction-time garbage collection logic to a compaction filter.

OCC (Optimistic Concurrency Control) assumes transactions will succeed. OCC分为三阶段：
- Read Phase: 对于读，放到Read Set，对于写，把写记到临时副本，放到Write Set。
- Validation Phase: 重扫Read Set，Write Set，检验数据是否满足Isolation Level。
- Write Phase (Commit Phase): 把临时副本区的数据更新到数据库中，完成事务提交。

