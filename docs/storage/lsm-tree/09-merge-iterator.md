# Merge Iterator

In this chapter, you will:
- Implement memtable iterator.
- Implement merge iterator.
- Implement LSM read path `scan` for memtables.

## Task 1: Memtable Iterator

In this chapter, we will implement the LSM `scan` interface. `scan` returns a range of key-value pairs in order using an iterator API.

All LSM iterators implement the `StorageIterator` trait. It has 4 functions: `key`, `value`, `next`, and `is_valid`. When the iterator is created, its cursor will stop on some element, and `key` / `value` will return the first key in the memtable/block/SST satisfying the start condition.

`next` moves the cursor to the next place. `is_valid` returns if the iterator has reached the end or errored. You can assume `next` will only be called when `is_valid` returns true.

If the iterator does not have a lifetime generics parameter, we should ensure that whenever the iterator is being used, the underlying skiplist object is not freed. The only way to achieve that is to put the `Arc<SkipMap>` object into the iterator itself.

This is the first and most tricky Rust language thing that you will ever meet in this tutorial -- self-referential structure. We have already defined the self-referential `MemtableIterator` fields for you, and you will need to implement `MemtableIterator` and the `Memtable::scan` API.

## Task 2: Merge Iterator

Now that you have multiple memtables and you will create multiple memtable iterators. You will need to merge the results from the memtables and return the latest version of each key to the user.

`MergeIterator` maintains a binary heap internally. Note that you will need to handle errors (i.e., when an iterator is not valid) and ensure that the latest version of a key-value pair comes out.

The constructor of the merge iterator takes a vector of iterators. We assume the one with a lower index (i.e., the first one) has the latest data.

One common pitfall is on error handling. If `next` returns an error, it is no longer valid. However, when we go out of the if condition and return the error to the caller, `PeekMut`'s drop will try move the element within the heap, which causes an access to an invalid iterator. Therefore, you will need to do all error handling by yourself instead of using `?` within the scope of `PeekMut`.

We want to avoid dynamic dispatch as much as possible, and therefore we do not use `Box<dyn StorageIterator>` in the system. Instead, we prefer static dispatch using generics.

Starting this section, we will use `Key<T>` to represent LSM key types and distinguish them from values in the type system.

## Task 3: LSM Iterator + Fused Iterator

We use the `LsmIterator` structure to represent the internal LSM iterators. You will need to modify this structure multiple times throughout the tutorial when more iterators are added into the system.

Then, we want to provide extra safety on the iterator to avoid users from misusing them. `FusedIterator` is a wrapper around an iterator to normalize the behaviors across all iterators.

## Task 4: Read Path - Scan

We are finally there -- with all iterators you have implemented, you can finally implement the `scan` interface of the LSM engine. You can simply construct an LSM iterator with the memtable iterators (remember to put the latest memtable at the front of the merge iterator), and your storage engine will be able to handle the scan request.

## Test Your Understanding

- What is the time/space complexity of using your merge iterator?
- Why do we need a self-referential structure for memtable iterator?
- If a key is removed (there is a delete tombstone), do you need to return it to the user?
- If a key has multiple versions, will the user see all of them?
- What happens if your key comparator cannot give the binary heap implementation a stable order?
- Why do we need to ensure the merge iterator returns data in the iterator construction order?

## Bonus Tasks

- Foreground Iterator. Provide a `ForegroundIterator` / `LongIterator` to allow garbage collection of resources.

