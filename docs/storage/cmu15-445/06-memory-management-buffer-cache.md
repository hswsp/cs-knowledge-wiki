# 06 - Memory Management + Buffer Cache

![1.jpg](https://images.spumn.eu.cc/blog/918e43cec79f3c08.jpeg)

![2.jpg](https://images.spumn.eu.cc/blog/3a70c9d7617c3e58.jpeg)

![3.jpg](https://images.spumn.eu.cc/blog/bac2ba5bf397ab1c.jpeg)

## Introduction

The DBMS is responsible for managing its memory and moving data back-and-forth from the disk. Since, for the most part, data cannot be directly operated on in the disk, any database must be able to efficiently move data represented as files on its disk into memory so that it can be used. A diagram of this interaction is shown in Figure 1. A obstacle that DBMS’s face is the problem of minimizing the slowdown of moving data around. Ideally, it should “appear” as if the data is all in the memory already. The **execution engine** shouldn’t have to worry about how data is fetched into memory.

![Figure 1: Disk-oriented DBMS.](https://images.spumn.eu.cc/blog/c493c406971ec374.png)

Another way to think of this problem is in terms of spatial and temporal control. _Spatial Control_ refers to where pages are physically written on disk. The goal of spatial control is to keep pages that are used together often as physically close together as possible on disk. _Temporal Control_ refers to when to read pages into memory and when to write them to disk. Temporal control aims to minimize the number of stalls from having to read data from disk.

![4.jpg](https://images.spumn.eu.cc/blog/f38342428f2c7525.jpeg)

![5.jpg](https://images.spumn.eu.cc/blog/4e0180d87888fb9a.jpeg)

![6.jpg](https://images.spumn.eu.cc/blog/4a502a133cad7d51.jpeg)

![7.jpg](https://images.spumn.eu.cc/blog/1f0ae5f9236e719d.jpeg)

## Locks vs. Latches

We need to make a distinction between locks and latches when discussing how the DBMS protects its internal elements. \*\*Locks: \*\*A lock is a higher-level, logical primitive that protects the contents of a database (e.g., tuples, tables, databases) from other transactions. Transactions will hold a lock for its entire duration. Database systems can expose to the user which locks are being held as queries are run. Locks need to be able to rollback changes. **Latches:** A latch is a low-level protection primitive that the DBMS uses for the critical sections in its internal data structures (e.g., hash tables, regions of memory). Latches are held for only the duration of the operation being made. Latches do not need to be able to rollback changes.

## Buffer Pool

The _buffer pool_ is an in-memory cache of pages read from disk. It is essentially a large memory region allocated inside of the database to store pages that are fetched from disk. The buffer pool’s region of memory organized as an array of **fixed size pages.** Each array entry is called a **frame**. When the DBMS requests a page, an exact copy is placed into one of the frames of the buffer pool. Then, the database system can search the buffer pool first when a page is requested. If the page is not found, then the system fetches a copy of the page from the disk. Dirty pages are buffered and not written back immediately（write-back cache）. See Figure 2 for a diagram of the buffer pool’s memory organization.

![Figure 2: Buffer pool organization and meta-data](https://images.spumn.eu.cc/blog/0f62774fec8de51c.png)

![8.jpg](https://images.spumn.eu.cc/blog/9a1f8359aedefc65.jpeg)

![9.jpg](https://images.spumn.eu.cc/blog/7cf8b4dfd8e44c34.jpeg)

### Buffer Pool Meta-data

The buffer pool must maintain certain meta-data in order to be used efficiently and correctly. Firstly, the _page table_ is an in-memory hash table that keeps track of pages that are currently in memory. It maps page ids to frame locations in the buffer pool. Since the order of pages in the buffer pool does not necessarily reflect the order on the disk, this extra indirection layer allows for the identification of page locations in the pool. \*\*Note: \*\*The **page table** is not to be confused with the **page directory**, which is the mapping from page ids to page locations in database files. All changes to the page directory must be recorded on disk to allow the DBMS to find on restart. The page table also maintains additional meta-data per page, a dirty-flag and a pin/reference counter.

![10.jpg](https://images.spumn.eu.cc/blog/e87f3a1d6e8550b0.jpeg)

The _dirty-flag_ is set by a thread whenever it modifies a page. This indicates to storage manager that the page must be written back to disk. The _pin/reference_ Counter tracks the number of threads that are currently accessing that page (either reading or modifying it). A thread has to increment the counter before they access the page. If a page’s count is greater than zero, then the storage manager is **not** allowed to evict that page from memory.

![11.jpg](https://images.spumn.eu.cc/blog/3a0d401056ea11f5.jpeg)

![12.jpg](https://images.spumn.eu.cc/blog/d0849c8293ead6be.jpeg)

![13.jpg](https://images.spumn.eu.cc/blog/66a4fc586a8e39b3.jpeg)

![14.jpg](https://images.spumn.eu.cc/blog/5c7bdd30d9c216ad.jpeg)

### Memory Allocation Policies

Memory in the database is allocated for the buffer pool according to two policies. _Global policies_ deal with decisions that the DBMS should make to benefit the entire workload that is being executed. It considers all active transactions to find an optimal decision for allocating memory. An alternative is _local policies_, which makes decisions that will make a single query or transaction run faster, even if it isn’t good for the entire workload. Local policies allocate frames to a specific transactions without considering the behavior of concurrent transactions. Most systems use a combination of both global and local views.

![15.jpg](https://images.spumn.eu.cc/blog/da5c805293e5863e.jpeg)

## Buffer Pool Optimizations

There are a number of ways to optimize a buffer pool to tailor it to the application’s workload.

![16.jpg](https://images.spumn.eu.cc/blog/8968b6a07534c418.jpeg)

### Multiple Buffer Pools

The DBMS can maintain multiple buffer pools for different purposes (i.e per-database buffer pool, per-page type buffer pool). Then, each buffer pool can adopt local policies tailored for the data stored inside of it. This method can help reduce latch contention and improves locality. Two approaches to mapping desired pages to a buffer pool are object IDs and hashing. \_Object IDs \_involve extending the record IDs to have an object identifier. Then through the object identifier, a mapping from objects to specific buffer pools can be maintained. Another approach is _hashing_ where the DBMS hashes the page id to select which buffer pool to access.

![17.jpg](https://images.spumn.eu.cc/blog/5dbf644653277a7b.jpeg)

bufferpool -> tablespace -> table

![18.jpg](https://images.spumn.eu.cc/blog/ed2d9fd283ff98f9.jpeg)

![19.jpg](https://images.spumn.eu.cc/blog/d3563b61a875c4d5.jpeg)

![20.jpg](https://images.spumn.eu.cc/blog/a0f50b3ed2aaa104.jpeg)

### Pre-fetching

The DBMS can also optimize by pre-fetching pages based on the query plan. Then, while the first set of pages is being processed, the second can be pre-fetched into the buffer pool. This method is commonly used by DBMS’s when accessing many pages sequentially.

![21.jpg](https://images.spumn.eu.cc/blog/d4679c80ca721a8f.jpeg)

![22.jpg](https://images.spumn.eu.cc/blog/c7855cdd9355c88f.jpeg)

![23.jpg](https://images.spumn.eu.cc/blog/fee7e84b71dea843.jpeg)

![24.jpg](https://images.spumn.eu.cc/blog/d63fe4a470d96402.jpeg)

![25.jpg](https://images.spumn.eu.cc/blog/b55be49bec43c00d.jpeg)

![26.jpg](https://images.spumn.eu.cc/blog/cd59cf499985100f.jpeg)

![27.jpg](https://images.spumn.eu.cc/blog/2ef9d37d3306b734.jpeg)

![28.jpg](https://images.spumn.eu.cc/blog/f29d3ae3afe9f887.jpeg)

![29.jpg](https://images.spumn.eu.cc/blog/04b8688b3103944f.jpeg)

### Scan Sharing (Synchronized Scans)

Query cursors can reuse data retrieved from storage or operator computations. This allows multiple queries to attach to a single cursor that scans a table. Ifb a query starts a scan and if there one already doing this, then the DBMS will attach the second query’s cursor to the existing cursor. The DBMS keeps track of where the second query joined with the first so that it can finish the scan when it reaches the end of the data structure.

![30.jpg](https://images.spumn.eu.cc/blog/e011c946f6a0f04c.jpeg)

![31.jpg](https://images.spumn.eu.cc/blog/f5dc6e98b27b07dc.jpeg)

Problems that Synchronized Scans might incur:

![32.jpg](https://images.spumn.eu.cc/blog/dce3a12ce4bf2ff9.jpeg)

![33.jpg](https://images.spumn.eu.cc/blog/4ace8c89213c8ec6.jpeg)

![34.jpg](https://images.spumn.eu.cc/blog/3819b83df2efc325.jpeg)

![35.jpg](https://images.spumn.eu.cc/blog/94655abea830a6fd.jpeg)

![36.jpg](https://images.spumn.eu.cc/blog/dd70cbd2ce0d3078.jpeg)

![37.jpg](https://images.spumn.eu.cc/blog/3a2e5cde75769e72.jpeg)

![38.jpg](https://images.spumn.eu.cc/blog/4d60a59d189dd26f.jpeg)

![39.jpg](https://images.spumn.eu.cc/blog/b0100ee342f6ff97.jpeg)

![40.jpg](https://images.spumn.eu.cc/blog/99d31d5fbbf859fc.jpeg)

![41.jpg](https://images.spumn.eu.cc/blog/bc162ab2a9a94d60.jpeg)

![42.jpg](https://images.spumn.eu.cc/blog/5d382f19bdf4de27.jpeg)

![43.jpg](https://images.spumn.eu.cc/blog/9bd4cfe4bef5460b.jpeg)

![44.jpg](https://images.spumn.eu.cc/blog/da45fa0d28a972b6.jpeg)

### Buffer Pool Bypass

The sequential scan operator will not store fetched pages in the buffer pool to avoid overhead. Instead, memory is local to the running query. This works well if operator needs to read a large sequence of pages that are contiguous on disk. Buffer Pool Bypass can also be used for temporary data (sorting, joins).

![45.jpg](https://images.spumn.eu.cc/blog/8a68373febb785ca.jpeg)

## OS Page Cache

Most disk operations go through the OS API. Unless explicitly told otherwise, the OS maintains its own filesystem cache. Most DBMS use **direct I/O to bypass the OS’s cache** in order to avoid redundant copies of pages and having to manage different eviction policies. **Postgres** is an example of a database system that uses the OS’s Page Cache.

![46.jpg](https://images.spumn.eu.cc/blog/1a5948ddcc999bd5.jpeg)

![47.jpg](https://images.spumn.eu.cc/blog/4b678e7926628294.jpeg)

![48.jpg](https://images.spumn.eu.cc/blog/c01e6f2ca74fb199.jpeg)

## Buffer Replacement Policies

When the DBMS needs to free up a frame to make room for a new page, it must decide which page to evict from the buffer pool. A replacement policy is an algorithm that the DBMS implements that makes a decision on which pages to evict from buffer pool when it needs space. Implementation goals of replacement policies are improved correctness, accuracy, speed, and meta-data overhead.

![49.jpg](https://images.spumn.eu.cc/blog/4714a4f6bb67c4cd.jpeg)

### Least Recently Used (LRU)

The Least Recently Used replacement policy maintains a timestamp of when each page was last accessed. The DBMS picks to evict the page with the oldest timestamp. This timestamp can be stored in a separate data structure, such as a queue, to allow for sorting and improve efficiency by reducing sort time on eviction.

![50.jpg](https://images.spumn.eu.cc/blog/6ee2192a26e3b373.jpeg)

### CLOCK

The CLOCK policy is an approximation of LRU without needing a separate timestamp per page. In the CLOCK policy, each page is given a **reference bit**. When a page is accessed, set to 1. To visualize this, organize the pages in a circular buffer with a “clock hand”. Upon sweeping check if a page’s bit is set to 1. If yes, set to zero, if no, then evict it. In this way, the clock hand remembers position between evictions.

![Figure 3: Visualization of CLOCK replacement policy. Page 1 is referenced and set to 1. When the clock hand sweeps, it sets the reference bit for page 1 to 0 and evicts page 5.](https://images.spumn.eu.cc/blog/3197e48c9c58b47f.png)

![51.jpg](https://images.spumn.eu.cc/blog/269e3065d565e4b2.jpeg)

![52.jpg](https://images.spumn.eu.cc/blog/2843ea808207dd77.jpeg)

![53.jpg](https://images.spumn.eu.cc/blog/10d68b746b9f8ac6.jpeg)

![54.jpg](https://images.spumn.eu.cc/blog/b1cdbb58d0271253.jpeg)

![55.jpg](https://images.spumn.eu.cc/blog/e81ecf821e44c864.jpeg)

![56.jpg](https://images.spumn.eu.cc/blog/4b8d7029bba26633.jpeg)

![57.jpg](https://images.spumn.eu.cc/blog/eb54a6f9190c5adc.jpeg)

![58.jpg](https://images.spumn.eu.cc/blog/eb54a6f9190c5adc.jpeg)

![59.jpg](https://images.spumn.eu.cc/blog/02aa1661d963a630.jpeg)

![60.jpg](https://images.spumn.eu.cc/blog/89ae6b0e43a1ec83.jpeg)

![61.jpg](https://images.spumn.eu.cc/blog/0f1a576ac44ed791.jpeg)

![62.jpg](https://images.spumn.eu.cc/blog/42f5a58f9a17023c.jpeg)

![63.jpg](https://images.spumn.eu.cc/blog/e49d0bfa37ac1d9d.jpeg)

![64.jpg](https://images.spumn.eu.cc/blog/4459693b16b0771d.jpeg)

![65.jpg](https://images.spumn.eu.cc/blog/db26e5c0a2843169.jpeg)

### Alternatives

There are a number of problems with LRU and CLOCK replacement policies. Namely, LRU and CLOCK are susceptible to _sequential flooding_, where the buffer pool’s contents are corrupted due to a sequential scan. Since sequential scans read every page, the timestamps of pages read may not reflect which pages we actually want. In other words, the most recently used page is actually the most unneeded page. There are three solutions to address the shortcomings of LRU and CLOCK policies. One solution is \*\*LRU-K \*\*which tracks the history of the last K references as timestamps and computes the interval between subsequent accesses. This history is used to predict the next time a page is going to be accessed.

![66.jpg](https://images.spumn.eu.cc/blog/238993da184dbd91.jpeg)

Another optimization is localization per query. The DBMS chooses which pages to evict on a per transaction/query basis. This minimizes the pollution of the buffer pool from each query.

![67.jpg](https://images.spumn.eu.cc/blog/405ef024955c99a8.jpeg)

Lastly, priority hints allow transactions to tell the buffer pool whether page is important or not based on the context of each page during query execution.

![68.jpg](https://images.spumn.eu.cc/blog/b7e541fc0433d59a.jpeg)

![69.jpg](https://images.spumn.eu.cc/blog/f92652095a012505.jpeg)

### Dirty Pages

There are two methods to handling pages with dirty bits. The fastest option is to drop any page in the buffer pool that is not dirty. A slower method is to write back dirty pages to disk to ensure that its changes are persisted. These two methods illustrate the trade-off between fast evictions versus dirty writing pages that will not be read again in the future.

![70.jpg](https://images.spumn.eu.cc/blog/f616b91f969a1386.jpeg)

One way to avoid the problem of having to write out pages unnecessarily is background writing. Through background writing, the DBMS can periodically walk through the page table and write dirty pages to disk. When a dirty page is safely written, the DBMS can either evict the page or just unset the dirty flag.

![71.jpg](https://images.spumn.eu.cc/blog/92536a91999bde18.jpeg)

## Other Memory Pools

The DBMS needs memory for things other than just tuples and indexes. These other memory pools may not always backed by disk depending on implementation.

* Sorting + Join Buffers
* Query Caches
* Maintenance Buffers
* Log Buffers
* Dictionary Caches

![72.jpg](https://images.spumn.eu.cc/blog/8ac789c82c6bd00b.jpeg)

![73.jpg](https://images.spumn.eu.cc/blog/e866380c1dab6c99.jpeg)

![74.jpg](https://images.spumn.eu.cc/blog/75cfb69391d004c5.jpeg)

![75.jpg](https://images.spumn.eu.cc/blog/daeb9d4fc91bd2d4.jpeg)

![76.jpg](https://images.spumn.eu.cc/blog/f01de6b4487aeefc.jpeg)

![77.jpg](https://images.spumn.eu.cc/blog/c63f2c035870dcac.jpeg)

![78.jpg](https://images.spumn.eu.cc/blog/fecb4cf0a50eee0c.jpeg)

![79.jpg](https://images.spumn.eu.cc/blog/334b904dd8a6a043.jpeg)

![80.jpg](https://images.spumn.eu.cc/blog/0f43ba9858511c9a.jpeg)

![81.jpg](https://images.spumn.eu.cc/blog/c5a72b19f59d21bf.jpeg)

![82.jpg](https://images.spumn.eu.cc/blog/9d7478cdb62ac5b1.jpeg)
