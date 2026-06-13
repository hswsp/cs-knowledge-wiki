# Block

In this chapter, you will:
- Implement SST block encoding.
- Implement SST block decoding and block iterator.

## Task 1: Block Builder

You have already implemented all in-memory structures for an LSM storage engine in the previous two chapters. Now it's time to build the on-disk structures. The basic unit of the on-disk structure is blocks. Blocks are usually of 4-KB size (the size may vary depending on the storage medium), which is equivalent to the page size in the operating system and the page size on an SSD. A block stores ordered key-value pairs. An SST is composed of multiple blocks.

The block encoding format in our tutorial is as follows:

Each entry is a key-value pair. Key length and value length are both 2 bytes, which means their maximum lengths are 65535. (Internally stored as `u16`)

We assume that keys will never be empty, and values can be empty. An empty value means that the corresponding key has been deleted in the view of other parts of the system.

At the end of each block, we will store the offsets of each entry and the total number of entries. Each of the number is stored as `u16`.

The block has a size limit, which is `target_size`. Unless the first key-value pair exceeds the target block size, you should ensure that the encoded block size is always less than or equal to `target_size`.

The `BlockBuilder` will produce the data part and unencoded entry offsets when `build` is called. The information will be stored in the `Block` structure. This compact memory layout is very efficient.

In `Block::encode` and `Block::decode`, you will need to encode/decode the block in the format as indicated above.

## Task 2: Block Iterator

Now that we have an encoded block, we will need to implement the `StorageIterator` interface, so that the user can lookup/scan keys in the block.

`BlockIterator` can be created with an `Arc<Block>`. If `create_and_seek_to_first` is called, it will be positioned at the first key in the block. If `create_and_seek_to_key` is called, the iterator will be positioned at the first key that is `>=` the provided key.

The iterator should copy `key` from the block and store them inside the iterator (we will have key compression in the future and you will have to do so). For the value, you should only store the begin/end offset in the iterator without copying them.

When `next` is called, the iterator will move to the next position. If we reach the end of the block, we can set `key` to empty and return `false` from `is_valid`, so that the caller can switch to another block if possible.

## Test Your Understanding

- What is the time complexity of seeking a key in the block?
- Where does the cursor stop when you seek a non-existent key in your implementation?
- What is the endian of the numbers written into the blocks in your implementation?
- Is your implementation prune to a maliciously-built block?
- Can a block contain duplicated keys?
- What happens if the user adds a key larger than the target block size?
- Consider the case that the LSM engine is built on object store services (S3). How would you optimize/change the block format?

## Bonus Tasks

- Backward Iterators. You may implement `prev` for your `BlockIterator` so that you will be able to iterate the key-value pairs reversely.

