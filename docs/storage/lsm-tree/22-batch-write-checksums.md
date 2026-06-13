# Batch Write and Checksums

In the previous chapter, you already built a full LSM-based storage engine. At the end of this week, we will implement some easy but important optimizations of the storage engine. Welcome to Mini-LSM's week 2 snack time!

In this chapter, you will:
- Implement the batch write interface.
- Add checksums to the blocks, SST metadata, manifest, and WALs.

## Task 1: Write Batch Interface

In this task, we will prepare for week 3 of this tutorial by adding a write batch API. The user provides `write_batch` with a batch of records to be written to the database. The records are `WriteBatchRecord<T: AsRef<[u8]>>`, and therefore it can be either `Bytes`, `&[u8]` or `Vec<u8>`. There are two types of records: delete and put. You may handle them in the same way as your `put` and `delete` function.

After that, you may refactor your original `put` and `delete` function to call `write_batch`.

## Task 2: Block Checksum

In this task, you will need to add a block checksum at the end of each block when encoding the SST. The format of the SST will be changed to:

```
| data | checksum (u32) |
```

We use `crc32` as our checksum algorithm. You can use `crc32fast::hash` to generate the checksum for the block after building a block.

When you read the block, you should verify the checksum in `read_block` correctly generate the slices for the block content.

## Task 3: SST Meta Checksum

In this task, you will need to add a block checksum for bloom filters and block metadata. You will need to add a checksum at the end of the bloom filter in `Bloom::encode` and `Bloom::decode`. After that, you can add a checksum at the end of block metadata.

## Task 4: WAL Checksum

In this task, you will need to do a per-record checksum in the write-ahead log. To do this, you have two choices:
- Generate a buffer of the key-value record, and use `crc32fast::hash` to compute the checksum at once.
- Write one field at a time, and use a `crc32fast::Hasher` to compute the checksum incrementally on each field.

The new WAL encoding should be like:

```
| key_len | key | value_len | value | checksum (u32) |
```

## Task 5: Manifest Checksum

Lastly, let us add a checksum on the manifest file. Manifest is similar to a WAL, except that previously, we do not store the length of each record. To make the implementation easier, we now add a header of record length at the beginning of a record, and add a checksum at the end of the record.

The new manifest format is like:

```
| record_len (u32) | JSON record | checksum (u32) |
```

## Test Your Understanding

- Consider the case that an LSM storage engine only provides `write_batch` as the write interface. Is it possible to implement it with a single write thread?
- Is it okay to put all block checksums altogether at the end of the SST file instead of store it along with the block? Why?

## Bonus Tasks

- Recovering when Corruption. If there is a checksum error, open the database in a safe mode so that no writes can be performed and non-corrupted data can still be retrieved.

