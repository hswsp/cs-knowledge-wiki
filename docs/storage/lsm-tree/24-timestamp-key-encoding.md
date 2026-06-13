# Timestamp Key Encoding + Refactor

In this chapter, you will:
- Refactor your implementation to use `key+ts` representation.
- Make your code compile with the new key representation.

## Task 0: Use MVCC Key Encoding

You will need to replace the key encoding module to the MVCC one. We have removed some interfaces from the original key module and implemented new comparators for the keys.

Specifically, the key type definition has been changed from:

```rust
pub struct Key<T: AsRef<[u8]>>(T);
```

...to:

```rust
pub struct KeySlice<'a>(&'a [u8], u64);
pub struct KeyVec(Vec<u8>, u64);
pub struct KeyBytes(Bytes, u64);
```

...where we have a timestamp associated with the keys. We only use this key representation internally in the system. On the user interface side, we do not ask users to provide a timestamp.

In the `key+ts` encoding, the key with a smallest user key and a largest timestamp will be ordered first.

## Task 1: Encode Timestamps in Blocks

The first thing you will notice is that your code might not compile after replacing the key module. In this chapter, all you need to do is to make it compile.

You will notice that `raw_ref()` and `len()` are removed from the key API. Instead, we have `key_ref` to retrieve the slice of the user key, and `key_len` to retrieve the length of the user key.

The new block entry record will be like:

```
| key_len (u16) | key | ts (u64) | value_len (u16) | value |
```

## Task 2: Encoding Timestamps in SSTs

Then, you can go ahead and modify the table format. Specifically, you will need to change your block meta encoding to include the timestamps of the keys. All other code remains the same.

In your table builder, you may directly use the `key_ref()` to build the bloom filter. This naturally creates a prefix bloom filter for your SSTs.

## Task 3: LSM Iterators

As we use associated generic type to make most of our iterators work for different key types (i.e., `&[u8]` and `KeySlice<'_>`), we do not need to modify merge iterators and concat iterators if they are implemented correctly. The `LsmIterator` is the place where we strip the timestamp from the internal key representation and return the latest version of a key to the user.

For now, we do not modify the logic of `LsmIterator` to only keep the latest version of a key. We simply make it compile by appending a timestamp to the user key when passing the key to the inner iterator, and stripping the timestamp from a key when returning to the user.

## Task 4: Memtable

For now, we keep the logic of the memtable. We return a key slice to the user and flush SSTs with `TS_DEFAULT`. We will change the memtable to be MVCC in the next chapter.

## Task 5: Engine Read Path

Now that we have a timestamp in the key, and when creating the iterators, we will need to seek a key with a timestamp instead of only the user key. You can create a key slice with `TS_RANGE_BEGIN`, which is the largest `ts`.

When you check if a user key is in a table, you can simply compare the user key without comparing the timestamp.

At this point, you should build your implementation and pass all week 1 test cases. All keys stored in the system will use `TS_DEFAULT` (which is timestamp 0).

