# Snack Time: SST Optimizations

In the previous chapter, you already built a storage engine with get/scan/put support. At the end of this week, we will implement some easy but important optimizations of SST formats. Welcome to Mini-LSM's week 1 snack time!

In this chapter, you will:
- Implement bloom filter on SSTs and integrate into the LSM read path `get`.
- Implement key compression in SST block format.

## Task 1: Bloom Filters

Bloom filters are probabilistic data structures that maintains a set of keys. You can add keys to a bloom filter, and you can know what key may exist / must not exist in the set of keys being added to the bloom filter.

You usually need to have a hash function in order to construct a bloom filter, and a key can have multiple hashes.

In the implementation, you will build a bloom filter from key hashes (which are `u32` numbers). For each of the hash, you will need to set `k` bits. We provide all the skeleton code for doing the magic mathematics. You only need to implement the procedure of building a bloom filter and probing a bloom filter.

## Task 2: Integrate Bloom Filter on the Read Path

For the bloom filter encoding, you can append the bloom filter to the end of your SST file. You will need to store the bloom filter offset at the end of the file, and compute meta offsets accordingly.

We use the farmhash crate to compute the hashes of the keys. When building the SST, you will need also to build the bloom filter by computing the key hash using `farmhash::fingerprint32`. You will need to encode/decode the bloom filters with the block meta. You can choose false positive rate 0.01 for your bloom filter.

After that, you can modify the `get` read path to filter SSTs based on bloom filters.

## Task 3: Key Prefix Encoding + Decoding

As the SST file stores keys in order, it is possible that the user stores keys of the same prefix, and we can compress the prefix in the SST encoding so as to save space.

We compare the current key with the first key in the block. We store the key as follows:

```
| overlap_len (u16) | rest_len (u16) | rest_key |
```

The `key_overlap_len` indicates how many bytes are the same as the first key in the block. For example, if we see a record: `5|3|LSM`, where the first key in the block is `mini-something`, we can recover the current key to `mini-LSM`.

After you finish the encoding, you will also need to implement decoding in the block iterator.

## Test Your Understanding

- How does the bloom filter help with the SST filtering process?
- Consider the case that we need a backward iterator. Does our key compression affect backward iterators?
- Can you use bloom filters on scan?
- What might be the pros/cons of doing key-prefix encoding over adjacent keys instead of with the first key in the block?

