# Snack Time: Compaction Filters

Congratulations! You made it there! In the previous chapter, you made your LSM engine multi-version capable, and the users can use transaction APIs to interact with your storage engine. At the end of this week, we will implement some easy but important features of the storage engine. Welcome to Mini-LSM's week 3 snack time!

In this chapter, we will generalize our compaction garbage collection logic to become compaction filters.

For now, our compaction will simply retain the keys above the watermark and the latest version of the keys below the watermark. We can add some magic to the compaction process to help the user collect some unused data automatically as a background job.

Consider a case that the user uses Mini-LSM to store database tables. Each row in the table are prefixed with the table name. For example,

```
table1_row1 -> value1
table1_row2 -> value2
table2_row1 -> value3
```

Now the user executes `DROP TABLE table1`. The engine will need to clean up all the data beginning with `table1`.

There are a lot of ways to achieve the goal. The user of Mini-LSM can scan all the keys beginning with `table1` and requests the engine to delete it. However, scanning a very large database might be slow, and it will generate the same number of delete tombstones as the existing keys.

Therefore, scan-and-delete will not free up the space occupied by the dropped table -- instead, it will add more data to the engine and the space can only be reclaimed when the tombstones reach the bottom level of the engine.

Or, they can create column families. They store each table in a column family, which is a standalone LSM state, and directly remove the SST files corresponding to the column family when the user drop the table.

## RocksDB Column Families

列族（Column Families）是rocksdb3.0提出的一个机制，用于对同一个数据库的记录（键值对）进行逻辑划分。默认情况下所有的记录都会存储在一个默认列族里。

列族具有的属性：
- 可以跨列族进行原子写，弥补了rocksdb在单个进程内只能操作一个数据库的问题。
- 在不同的列族，提供数据库的一致性视图
- 可以对列族进行独立配置
- 动态添加和drop列族

简单的说，不同的列族是共享WAL的，但是memtable和SST file是隔离的。

## Task 1: Compaction Filter

In this tutorial, we will implement the third approach: compaction filters. Compaction filters can be dynamically added to the engine at runtime. During the compaction, if a key matching the compaction filter is found, we can silently remove it in the background.

You can iterate all compaction filters in `LsmStorageInner::compaction_filters`. If the first version of the key below watermark matches the compaction filter, simply remove it instead of keeping it in the SST file.

You can assume that the user will not get the keys within the prefix filter range. And, they will not scan the keys in the prefix range. Therefore, it is okay to return a wrong value when a user requests the keys in the prefix filter range (i.e., undefined behavior).

## 参考

- [https://github.com/facebook/rocksdb/wiki/Column-Families](https://github.com/facebook/rocksdb/wiki/Column-Families)

