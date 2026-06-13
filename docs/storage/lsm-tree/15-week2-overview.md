# Week 2 Overview: Compaction and Persistence

In the last week, you have implemented all necessary structures for an LSM storage engine, and your storage engine already supports read and write interfaces. In this week, we will deep dive into the disk organization of the SST files and investigate an optimal way to achieve both performance and cost efficiency in the system.

We have 7 chapters (days) in this part:
- Day 1: Compaction Implementation. You will merge all L0 SSTs into a sorted run.
- Day 2: Simple Leveled Compaction. You will implement a classic leveled compaction algorithm.
- Day 3: Tiered/Universal Compaction. You will implement the RocksDB universal compaction algorithm.
- Day 4: Leveled Compaction. You will implement the RocksDB leveled compaction algorithm with partial compaction.
- Day 5: Manifest. You will store the LSM state on the disk and recover from the state.
- Day 6: Write-Ahead Log (WAL). User requests will be routed to both memtable and WAL.
- Day 7: Write Batch and Checksums. You will implement write batch API and checksums.

## Compaction and Read Amplification

Let us talk about compaction first. In the previous part, you simply flush the memtable to an L0 SST. Imagine that you have written gigabytes of data and now you have 100 SSTs. Every read request (without filtering) will need to read 100 blocks from these SSTs. This amplification is read amplification -- the number of I/O requests you will need to send to the disk for one get operation.

To reduce read amplification, we can merge all the L0 SSTs into a larger structure, so that it would be possible to only read one SST and one block to retrieve the requested data. This process is compaction, and these non-overlapping SSTs is a sorted run.

## Two Extremes of Compaction and Write Amplification

So from the above example, we have 2 naive ways of handling the LSM structure -- not doing compactions at all, and always do full compaction when new SSTs are flushed.

Compaction is a time-consuming operation. It will need to read all data from some files, and write the same amount of files to the disk. Not doing compactions at all leads to high read amplification, but it does not need to write new files. Always doing full compaction reduces the read amplification, but it will need to constantly rewrite the files on the disk.

The ratio of memtables flushed to the disk versus total data written to the disk is write amplification. No compaction has a write amplification ratio of 1x. Always doing compaction has a very high write amplification.

A good compaction strategy can balance read amplification, write amplification, and space amplification.

## Compaction Strategies Overview

Compaction strategies usually aim to control the number of sorted runs, so as to keep read amplification in a reasonable amount of number. There are generally two categories of compaction strategies: leveled and tiered.

In leveled compaction, the user can specify a maximum number of levels, which is the number of sorted runs in the system (except L0). During the compaction process, SSTs from two adjacent levels will be merged and then the produced SSTs will be put to the lower level of the two levels.

In tiered compaction, the engine will dynamically adjust the number of sorted runs by merging them or letting new SSTs flushed as new sorted run (a tier) to minimize write amplification. In this tutorial, we will implement RocksDB's universal compaction, which is a kind of tiered compaction strategy.

## Space Amplification

The most intuitive way to compute space amplification is to divide the actual space used by the LSM engine by the user space usage. The engine will need to store delete tombstones, and sometimes multiple version of the same key if compaction is not happening frequently enough, therefore causing space amplification.

## Persistence

After implementing the compaction algorithms, we will implement two key components in the system: manifest, which is a file that stores the LSM state, and WAL, which persists memtable data to the disk before it is flushed as an SST.

## Snack Time

After implementing compaction and persistence, we will have a short chapter on implementing the batch write interface and checksums.

