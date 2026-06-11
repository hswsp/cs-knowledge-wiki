# 07 - Hash Tables

![image-20240307200736480](https://images.spumn.eu.cc/blog/96cd1d3ccee30e68.png)

![image-20240307200822992](https://images.spumn.eu.cc/blog/c08301065f2647d5.png)

![image-20240307202401908](https://images.spumn.eu.cc/blog/af331a2d64a8f0a8.png)

## Data Structures

A DBMS uses various data structures for many different parts of the system internals. Some examples include:

* **Internal Meta-Data**: This is data that keeps track of information about the database and the system state. Ex: Page tables, page directories
* **Core Data Storage:** Data structures are used as the base storage for tuples in the database.
* **Temporary Data Structures**: The DBMS can build data structures on the fly while processing a query to speed up execution (e.g., hash tables for joins).
* **Table Indices:** Auxiliary data structures can be used to make it easier to find specific tuples.

![image-20240307202504805](https://images.spumn.eu.cc/blog/97e1753ddceb3eb0.png)

![image-20240307202519493](https://images.spumn.eu.cc/blog/c8ad516e6334f2b9.png)

There are two main design decisions to consider when implementing data structures for the DBMS:

1. **Data organization**: We need to figure out how to layout memory and what information to store inside the data structure in order to support efficient access.
2. **Concurrency**: We also need to think about how to enable multiple threads to access the data structure without causing problems.

![image-20240307202536032](https://images.spumn.eu.cc/blog/c3f8d3a9d376d6d8.png)

面对海量数据，如何快速的找到我们想要的数据？为了解决这个问题，数据库中引入了一个新的数据结构：索引。它可以使得我们通过部分attribute的值快速定位到整个tuple，让查询速度变得更快。但代价是每次写tuple的时候，都需要同时更新索引。 接下来介绍数据库中的索引的数据结构以及它们的trade-off

## Hash Table

A hash table implements an associative array abstract data type that maps keys to values. It provides on average $O (1)$operation complexity ($O (n)$in the worst-case) and $O (n)$ storage complexity. Note that even with $O (1)$operation complexity on average, there are constant factor optimizations which are important to consider in the real world. A hash table implementation is comprised of two parts:

* \*\*Hash Function: \*\*This tells us how to map a large key space into a smaller domain. It is used to compute an index into an array of buckets or slots. We need to consider the trade-off between fast execution and collision rate. On one extreme, we have a hash function that always returns a constant (very fast, but everything is a collision). On the other extreme, we have a “perfect” hashing function where there are no collisions, but would take extremely long to compute. The ideal design is somewhere in the middle.
* **Hashing Scheme:** This tells us how to handle key collisions after hashing. Here, we need to consider the trade-off between allocating a large hash table to reduce collisions and having to execute additional instructions when a collision occurs.

![image-20240307202550181](https://images.spumn.eu.cc/blog/e8957065f2f3fede.png)

![image-20240307202602727](https://images.spumn.eu.cc/blog/2c28f48b67248331.png)

![image-20240307202640650](https://images.spumn.eu.cc/blog/da6a53c444ce6ad9.png)

![image-20240307202652045](https://images.spumn.eu.cc/blog/4085dfd86400804b.png)

![image-20240307202707137](https://images.spumn.eu.cc/blog/d8472314e01b7a1b.png)

![image-20240307202715926](https://images.spumn.eu.cc/blog/5bc390e28c6ffb28.png)

## Hash Functions

A _hash function_ takes in any key as its input. It then returns an integer representation of that key (i.e., the “hash”). The function’s output is deterministic (i.e., the same key should always generate the same hash output). The DBMS need not use a cryptographically secure hash function (e.g., SHA-256) because we do not need to worry about protecting the contents of keys. These hash functions are primarily used internally by the DBMS and thus information is not leaked outside of the system. In general, we only care about the hash function’s speed and collision rate. The current state-of-the-art hash function is Facebook XXHash3.

![image-20240307202726635](https://images.spumn.eu.cc/blog/20155114a4e2f60e.png)

![image-20240307202738404](https://images.spumn.eu.cc/blog/193323031609afbf.png)

![image-20240307202748683](https://images.spumn.eu.cc/blog/0492f96cb3a237a5.png)

![image-20240307202803162](https://images.spumn.eu.cc/blog/7344babde79c888a.png)

## Static Hashing Schemes

A static hashing scheme is one where the size of the hash table is fixed. This means that if the DBMS runs out of storage space in the hash table, then it has to rebuild a larger hash table from scratch, which is very expensive. Typically the new hash table is twice the size of the original hash table. To reduce the number of wasteful comparisons, it is important to avoid collisions of hashed key. Typically, we use twice the number of slots as the number of expected elements. The following assumptions usually do not hold in reality:

1. The number of elements is known ahead of time.
2. Keys are unique.
3. There exists a perfect hash function.

Therefore, we need to choose the hash function and hashing schema appropriately.

![image-20240307202828445](https://images.spumn.eu.cc/blog/9d4a6e08ba1de547.png)

### Linear Probe Hashing

This is the most basic hashing scheme. It is also typically the fastest. It uses a circular buffer of array slots. The hash function maps keys to slots. When a collision occurs, we linearly seach the adjacent slots until an open one is found. For lookups, we can check the slot the key hashes to, and search linearly until we find the desired entry. If we reach an empty slot or we iterated over every slot in the hashtable, then the key is not in the table. Note that this means we have to store both key and value in the slot so that we can check if an entry is the desired one. Deletions are more tricky. **We have to be careful about just removing the entry from the slot, as this may prevent future lookups from finding entries that have been put below the now empty slot.（注：因为这里我们查找一个数是否存在的标准就是找到第一个empty slot就认为不存在了。）** There are two solutions to this problem:

* The most common approach is to use “tombstones”. Instead of deleting the entry, we replace it with a “tombstone” entry which tells future lookups to keep scanning.
* The other option is to shift the adjacent data after deleting an entry to fill the now empty slot. However, we must be careful to **only move the entries which were originally shifted.（不能移动**$hash(key)$​**就在当前位置的数）** This is rarely implemented in practice.

![image-20240307202843382](https://images.spumn.eu.cc/blog/e21f6d17a3ef5f77.png)

![image-20240307202854686](https://images.spumn.eu.cc/blog/e04043e5573c1b3f.png)

![image-20240307202905138](https://images.spumn.eu.cc/blog/a9723e304cc1b66e.png)

![image-20240307202916284](https://images.spumn.eu.cc/blog/9766a5f59f90bd06.png)

![image-20240307202939923](https://images.spumn.eu.cc/blog/f9d18f9a3d83dd5c.png)

![image-20240307202954524](https://images.spumn.eu.cc/blog/e1331b3786efb5f4.png)

![image-20240307203006240](https://images.spumn.eu.cc/blog/0959b6ed217c61f0.png)

![image-20240307203018730](https://images.spumn.eu.cc/blog/edb117e59e3f52a6.png)

![image-20240307203034851](https://images.spumn.eu.cc/blog/a156d466d98c1612.png)

![image-20240307203047112](https://images.spumn.eu.cc/blog/1a4462e57deb2638.png)

![image-20240307203057670](https://images.spumn.eu.cc/blog/7eb9a2b1b6240eba.png)

![image-20240307203110555](https://images.spumn.eu.cc/blog/c59d0e8c73e15800.png)

![image-20240307203127468](https://images.spumn.eu.cc/blog/a8f116a8535f7e2c.png)

![image-20240307203138398](https://images.spumn.eu.cc/blog/89b75b8a30b4b06c.png)

**Non-unique Keys:** In the case where the same key may be associated with multiple different values or tuples, there are two approaches.

* Seperate Linked List: Instead of storing the values with the keys, we store a pointer to a seperate storage area which contains a linked list of all the values.
* **Redundant Keys**: The more common approach is to simply store the same key multiple times in the table. Everything with linear probing still works even if we do this.

![image-20240307203150052](https://images.spumn.eu.cc/blog/acd578f5cc244169.png)

### Robin Hood Hashing

This is an extension of linear probe hashing that seeks to reduce the maximum distance of each key from their optimal position (i.e. the original slot they were hashed to) in the hash table. This strategy steals slots from “rich” keys and gives them to “poor” keys. In this variant, each entry also records the “distance” they are from their optimal position. Then, on each insert, if the key being inserted would be farther away from their optimal position at the current slot than the current entry’s distance, we replace the current entry and continue trying to insert the old entry farther down the table.

![image-20240307203202473](https://images.spumn.eu.cc/blog/9e4a9eb39eba2f4d.png)

![image-20240307203218198](https://images.spumn.eu.cc/blog/3bde78c52c112c6a.png)

![image-20240307203231055](https://images.spumn.eu.cc/blog/71ed8ab0ed140910.png)

![image-20240307203243860](https://images.spumn.eu.cc/blog/37bb7d9fc951ca48.png)

![image-20240307203256421](https://images.spumn.eu.cc/blog/d83c01b0f0a85ca4.png)

![image-20240307203309193](https://images.spumn.eu.cc/blog/70e78bdb311937b2.png)

![image-20240307203322999](https://images.spumn.eu.cc/blog/21bd8b56b6ea090e.png)

![image-20240307203339216](https://images.spumn.eu.cc/blog/4ef95f5d568b73f7.png)

![image-20240307203349518](https://images.spumn.eu.cc/blog/a5945a3ebb61e771.png)

### Cuckoo Hashing

Instead of using a single hash table, this approach maintains multiple hashtables with different hash functions. The hash functions are the same algorithm (e.g., XXHash, CityHash); they generate different hashes for the same key by using different seed values. When we insert, we check every table and choose one that has a free slot (if multiple have one, we can compare things like load factor, or more commonly, just choose a random table). If no table has a free slot, we choose (typically a random one) and evict the old entry. We then rehash the old entry into a different table. In rare cases, we may end up in a cycle. If this happens, we can rebuild all of the hash tables with new hash function seeds (less common) or _rebuild the hash tables using larger tables (more common)_ . Cuckoo hashing guarantees $O (1)$ lookups and deletions, but insertions may be more expensive. [https://github.com/efficient/libcuckoo](https://github.com/efficient/libcuckoo)

![image-20240307203359713](https://images.spumn.eu.cc/blog/70f687d8da454ef5.png)

![image-20240307203409135](https://images.spumn.eu.cc/blog/d21069fc0f4f1aec.png)

![image-20240307203427366](https://images.spumn.eu.cc/blog/3d4c96d899b3df40.png)

![image-20240307203441199](https://images.spumn.eu.cc/blog/cfb2bf72f475e358.png)

![image-20240307203454316](https://images.spumn.eu.cc/blog/072ac46a76067cd5.png)

![image-20240307203507177](https://images.spumn.eu.cc/blog/b92d3572d0b8953d.png)

![image-20240307203520521](https://images.spumn.eu.cc/blog/c315350dab15a6cf.png)

![image-20240307203537450](https://images.spumn.eu.cc/blog/5596ef971c40f596.png)

![image-20240307203547058](https://images.spumn.eu.cc/blog/8acb8c8bd2579622.png)

![image-20240307203557104](https://images.spumn.eu.cc/blog/6e8b48524ccffde5.png)

![image-20240307203608149](https://images.spumn.eu.cc/blog/62ae50c2eee627bb.png)

![image-20240307203625447](https://images.spumn.eu.cc/blog/de2daea395825a97.png)

## Dynamic Hashing Schemes

The static hashing schemes require the DBMS to know the number of elements it wants to store. Otherwise it has to rebuild the table if it needs to grow/shrink in size. Dynamic hashing schemes are able to **resize the hash table on demand** without needing to rebuild the entire table. The schemes perform this resizing in different ways that can either maximize reads or writes.

![image-20240307203636123](https://images.spumn.eu.cc/blog/85a8e61f8d4e5ded.png)

### Chained Hashing

This is the most common dynamic hashing scheme. The DBMS maintains a linked list of buckets for each slot in the hash table. Keys which hash to the same slot are simply inserted into the linked list for that slot.

![image-20240307203647800](https://images.spumn.eu.cc/blog/e4c148aca3ac09c2.png)

![image-20240307203658767](https://images.spumn.eu.cc/blog/953ccabae7750078.png)

![image-20240307203708553](https://images.spumn.eu.cc/blog/3edc36738575bb77.png)

![image-20240307203723669](https://images.spumn.eu.cc/blog/7391dd59e61bae4f.png)

![image-20240307203735885](https://images.spumn.eu.cc/blog/ee3337d6225b9ca1.png)

![image-20240307203750970](https://images.spumn.eu.cc/blog/83017eed7c958807.png)

![image-20240307203801313](https://images.spumn.eu.cc/blog/e9e28b98afcb2f19.png)

### Extendible Hashing

Improved variant of chained hashing that splits buckets instead of letting chains to grow forever. This approach allows multiple slot locations in the hash table to point to the same bucket chain. The core idea behind re-balancing the hash table is to to move bucket entries on split and increase the number of bits to examine to find entries in the hash table. This means that the DBMS only has to move data within the buckets of the split chain; all other buckets are left untouched.

![image-20240307203810162](https://images.spumn.eu.cc/blog/042de79e94d81cf1.png)

* The DBMS maintains a global and local depth bit counts that determine the number bits needed to find buckets in the slot array.
* When a bucket is full, the DBMS splits the bucket and reshuffle its elements. If the local depth of the split bucket is less than the global depth, then the new bucket is just added to the existing slot array. Otherwise, the DBMS doubles the size of the slot array to accommodate the new bucket and increments the global depth counter.

就是冲突的链表过长的时候，就需要进行分裂。即将bucket分裂，同时将**主hash表翻倍**，然后按照hash函数重新分配bucket。[https://www.geeksforgeeks.org/extendible-hashing-dynamic-approach-to-dbms/](https://www.geeksforgeeks.org/extendible-hashing-dynamic-approach-to-dbms/)

![image-20240307203821752](https://images.spumn.eu.cc/blog/1fe4ebb8a3127cf2.png)

![image-20240307203830334](https://images.spumn.eu.cc/blog/db2fca4b99126ff7.png)

![image-20240307203844898](https://images.spumn.eu.cc/blog/48e507a69193870b.png)

`global 2`表示只examine前两个bits：

![image-20240307203854475](https://images.spumn.eu.cc/blog/0bd1980ca5b266b8.png)

![image-20240307203904822](https://images.spumn.eu.cc/blog/ea8e12e730ccb79f.png)

![image-20240307203914903](https://images.spumn.eu.cc/blog/25ad1b0e31f0533f.png)

`global 3`表示increase the number of bits to examine，现在查看前三个bits：

![image-20240307203925946](https://images.spumn.eu.cc/blog/b45bafe82fa7aa32.png)

![image-20240307203938895](https://images.spumn.eu.cc/blog/caa7b9b0188c57f2.png)

![image-20240307203948531](https://images.spumn.eu.cc/blog/38d6f1b42d81ad23.png)

![image-20240307203959085](https://images.spumn.eu.cc/blog/96a2ae49b7ecf44a.png)

### Linear Hashing

Instead of immediately splitting a bucket when it overflows, this scheme maintains a split pointer that keeps track of the next bucket to split. No matter whether this pointer is pointing to a bucket that overflowed, the DBMS always splits. The overflow criterion is left up to the implementation.

* When any bucket overflows, split the bucket at the pointer location by adding a new slot entry, and create a new hash function.
* If the hash function maps to slot that has previously been pointed to by pointer, apply the new hash function.
* When the pointer reaches last slot, delete original hash function and replace it with a new hash function.

上述Extendible Hashing是指数级的扩张hash表的，这未免也太快了。所以便有了LINEAR HASHING，线性扩张hash表，即每次只增加一个。其基本思想是维护一个指针split pointer，其指向下一个被拆分bucket，当任意bucket溢出时，将指针指向的当前bucket的拆分。

![image-20240307204012206](https://images.spumn.eu.cc/blog/a93306a60de8f3d9.png)

#### 线性哈希的数学原理

假定key = 5 、 9 、13

```Plain
key % 4 = 1
```

现在我们对8求余

```Plain
5 % 8 = 5
9 % 8=1
13 % 8 = 5
```

由上面的规律可以得出

> (任意key) % n = M (任意key) %2n = M 或 (任意key) %2n = M + n

#### 线性哈希的具体实现

我们假设初始化的哈希表如下:

| 分裂点 | 桶编号 | 桶中已存储的Key         | 溢出key |
| --- | --- | ----------------- | ----- |
| \*  | 0   | 4, 8, 12          |       |
|     | 1   | 5, 9              |       |
|     | 2   | 6                 |       |
|     | 3   | 7, 11, 15, 19, 23 |       |

为了方便叙述，我们作出以下假定:

1. 为了使哈希表能进行动态的分裂，我们从桶0开始设定一个分裂点。
2. 一个桶的容量为`listSize = 5`，当**桶的容量超出后就从分裂点开始进行分裂**。
3. hash函数为 $h0 = key %4$,  $h1 = key % 8$，h1会在分裂时使用。
4. 整个表初始化包含了4个桶，桶号为0-3，并已提前插入了部分的数据。

分裂过程如下，现在插入key = 27：

1. 进行哈希运算，$h0 = 27 % 4 = 3$
2. 将key = 27插入桶3，但发现桶3已经达到了桶的容量，所以触发哈希分裂
3. 由于现在分裂点处于0桶，所以我们对0桶进行分割。这里需要注意虽然这里是**3桶满了，但我们并不会直接从3桶进行分割，而是从分割点进行分割**。这里为什么这么做，在下面会进一步介绍。
4. 对分割点所指向的桶(桶0)所包含的key采用新的hash函数($h1$)进行分割。

对所有key进行新哈希函数运算后，将产生如下的哈希表

| 分裂点 | 桶编号 | 桶中已存储的Key         | 溢出key |
| --- | --- | ----------------- | ----- |
|     | 0   | 8                 |       |
| \*  | 1   | 5,9               |       |
|     | 2   | 6                 |       |
|     | 3   | 7, 11, 15, 19, 23 | 27    |
|     | 4   | 4，12              |       |

1. 虽然进行了分裂，**但桶3并不是分裂点，所以桶3会将多出的key，放于溢出页**,一直等到桶3进行分裂。
2. 进行分裂后，将分裂点向后移动一位。

一次完整的分裂结束。

**key的读取**： 采用$h0$对key进行计算。**如果算出的桶号小于了分裂点，表示桶已经进行的分裂**，我们采用$h1$进行hash运算，算出key所对应的真正的桶号。再从真正的桶里取出value，如果算出的桶号大于了分裂点，那么表示此桶还没进行分裂，直接从当前桶进行读取value。

**说明:**

1. 如果下一次key插入0、1、2、4桶，是不会触发分裂。（没有超出桶的容量）如果是插入桶3，用户在实现时可以自己设定，可以一旦插入就触发，也可以**等溢出页达到**​`**listSize**`​**再触发新的分裂**。
2. 现在0桶被分裂了，新数据的插入怎么才能保证没分裂的桶能正常工作，已经分裂的桶能将部分插入到新分裂的桶呢?

* 只要分裂点小于桶的总数，我们依然采用$h0$函数进行哈希计算。
* 如果哈希结果小于分裂号，那么表示这个key所插入的桶已经进行了分割，那么我就采用$h1$再次进行哈希，而$h1$的哈希结果就这个key所该插入的桶号。
* 如果哈希结果大于分裂号，那么表示这个key所插入的桶还没有进行分裂。直接插入。
* 这也是为什么虽然是桶3的容量不足，但分裂的桶是**分裂点所指向的桶**。如果直接在桶3进行分裂，那么当新的key插入的时候就不能正常的判断哪些桶已经进行了分裂。

1. 如果使用分割点，就具备了无限扩展的能力。**当分割点移动到最后一个桶(桶3)。再出现分裂。那么分割点就会回到桶0**，到这个时候，$h0$作废，$h1$替代$h0$，$h2(key % 12)$替代$h1$。那么又可以开始动态分割。那个整个初始化状态就发生了变化。就好像没有发生过分裂。那么上面的规则就可以循环使用。

线性哈希的论文中是按上面的规则来进行分裂的。其实我们可以安装自己的实际情况来进行改动。 假如我们现在希望去掉分割点，一旦哪个桶满了，马上对这个桶进行分割。 可以考虑了以下方案：

1. 为所有桶增加一个标志位。初始化的时候对所有桶的标志位清空。
2. 一旦某个桶满了，直接对这个桶进行分割，然后将设置标志位。当新的数据插入的时候，经过哈希计算（$h0$）发现这个桶已经分裂了，那么就采用新的哈希函数($h1$)来计算分裂之后的桶号。在读取数据的时候处理类似。

![image-20240307204030844](https://images.spumn.eu.cc/blog/b3dc57b4893299fa.png)

![image-20240307204040479](https://images.spumn.eu.cc/blog/3be0c8a1a0420434.png)

![image-20240307204052037](https://images.spumn.eu.cc/blog/02798f798560b6d8.png)

![image-20240307204102741](https://images.spumn.eu.cc/blog/74e4f0f1e731f373.png)

![image-20240307204115239](https://images.spumn.eu.cc/blog/204c374bcc737a7b.png)

![image-20240307204126248](https://images.spumn.eu.cc/blog/17d30de76bdaade1.png)

![image-20240307204137075](https://images.spumn.eu.cc/blog/9cb35c7f33f0e515.png)

![image-20240307204146872](https://images.spumn.eu.cc/blog/1d3a63bf155f6cfd.png)

![image-20240307204158076](https://images.spumn.eu.cc/blog/05e9b88c2952702e.png)

![image-20240307204208706](https://images.spumn.eu.cc/blog/2ae7de3fc96b7909.png)

![image-20240307204218870](https://images.spumn.eu.cc/blog/23668d2ad2476eca.png)

![image-20240307204228151](https://images.spumn.eu.cc/blog/f684d2da47d233e9.png)

![image-20240307204237273](https://images.spumn.eu.cc/blog/7db73b4c4bff3c3d.png)

![image-20240307204248546](https://images.spumn.eu.cc/blog/81bad09d6c9ecf2c.png)

![image-20240307204256899](https://images.spumn.eu.cc/blog/e94341db692694d3.png)

![image-20240307204306744](https://images.spumn.eu.cc/blog/e704e3ab919f03b0.png)

![image-20240307204318176](https://images.spumn.eu.cc/blog/519d810581308fbb.png)

![image-20240307204325921](https://images.spumn.eu.cc/blog/36b6519a00d4b7e2.png)

![image-20240307204336287](https://images.spumn.eu.cc/blog/ee58481626b04e25.png)
