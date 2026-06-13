# Sorted String Table (SST)

In this chapter, you will:
- Implement SST encoding and metadata encoding.
- Implement SST decoding and iterator.

## Task 1: SST Builder

SSTs are composed of data blocks and index blocks stored on the disk. Usually, data blocks are lazily loaded -- they will not be loaded into the memory until a user requests it. Index blocks can also be loaded on-demand, but in this tutorial, we make simple assumptions that all SST index blocks (meta blocks) can fit in memory. Generally, an SST file is of 256MB size.

The SST builder is similar to block builder -- users will call `add` on the builder. You should maintain a `BlockBuilder` inside SST builder and split blocks when necessary. Also, you will need to maintain block metadata `BlockMeta`, which includes the first/last keys in each block and the offsets of each block. The `build` function will encode the SST, write everything to disk using `FileObject::create`, and return an `SsTable` object.

The encoding of SST is like:

```
| data block | data block | ... | meta block | meta block offset (u32) |
```

You also need to implement `estimated_size` function of `SsTableBuilder`, so that the caller can know when can it start a new SST to write data.

Besides SST builder, you will also need to complete the encoding/decoding of block metadata, so that `SsTableBuilder::build` can produce a valid SST file.

## Task 2: SST Iterator

Like `BlockIterator`, you will need to implement an iterator over an SST. Note that you should load data on demand. For example, if your iterator is at block 1, it should not hold any other block content in memory until it reaches the next block.

`SsTableIterator` should implement the `StorageIterator` trait, so that it can be composed with other iterators in the future.

One thing to note is `seek_to_key` function. Basically, you will need to do binary search on block metadata to find which block might possibly contain the key. It is possible that the key does not exist in the LSM tree so that the block iterator will be invalid immediately after a seek.

We recommend only using the first key of each block to do the binary search so as to reduce the complexity of your implementation.

## Task 3: Block Cache

You can implement a new `read_block_cached` function on `SsTable`.

We use moka-rs as our block cache implementation. Blocks are cached by `(sst_id, block_id)` as the cache key. You may use `try_get_with` to get the block from cache if it hits the cache / populate the cache if it misses the cache. If there are multiple requests reading the same block and cache misses, `try_get_with` will only issue a single read request to the disk and broadcast the result to all requests.

At this point, you may change your table iterator to use `read_block_cached` instead of `read_block` to leverage the block cache.

## Test Your Understanding

- What is the time complexity of seeking a key in the SST?
- Where does the cursor stop when you seek a non-existent key in your implementation?
- Is it possible (or necessary) to do in-place updates of SST files?
- An SST is usually large (i.e., 256MB). In this case, the cost of copying/expanding the `Vec` would be significant. Does your implementation allocate enough space for your SST builder in advance?
- Does the usage of a block cache guarantee that there will be at most a fixed number of blocks in memory?
- Is it possible to store columnar data in an LSM engine? Is the current SST format still a good choice?

## Bonus Tasks

- Explore different SST encoding and layout.
- Index Blocks. Split block indexes and block metadata into index blocks, and load them on-demand.
- Index Cache. Use a separate cache for indexes apart from the data block cache.
- I/O Optimizations. Align blocks to 4KB boundary and use direct I/O to bypass the system page cache.

