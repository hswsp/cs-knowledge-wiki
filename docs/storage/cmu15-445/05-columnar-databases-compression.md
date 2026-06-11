# 05 - Columnar Databases & Compression

![1.jpg](https://images.spumn.eu.cc/blog/7126ebc3a1641cbf.jpeg)

![2.jpg](https://images.spumn.eu.cc/blog/718cd7d4f8b1ac82.jpeg)

![3.jpg](https://images.spumn.eu.cc/blog/5828ec823489190a.jpeg)

## Database Workloads

### OLTP: Online Transaction Processing

An OLTP workload is characterized by fast, short running operations, simple queries that operate on single entity at a time, and repetitive operations. An OLTP workload will typically handle more writes than reads. An example of an OLTP workload is the Amazon storefront. Users can add things to their cart, they can make purchases, but the actions only affect their account.

### OLAP: Online Analytical Processing

An OLAP workload is characterized by long running, complex queries, reads on large portions of the database. In OLAP worklaods, the database system is analyzing and deriving new data from existing data collected on the OLTP side. An example of an OLAP workload would be Amazon computing the most bought item in Pittsburgh on a day when its raining.

### HTAP: Hybrid Transaction + Analytical Processing

A new type of workload which has become popular recently is HTAP, which is like a combination which tries to do OLTP and OLAP together on the same database.

![4.jpg](https://images.spumn.eu.cc/blog/45cb9b1e2bb9463b.jpeg)

![5.jpg](https://images.spumn.eu.cc/blog/2f5302921124c0a2.jpeg)

![6.jpg](https://images.spumn.eu.cc/blog/179cde33cfefd558.jpeg)

![7.jpg](https://images.spumn.eu.cc/blog/1a14ec5eb330e183.jpeg)

![8.jpg](https://images.spumn.eu.cc/blog/8b84ad3ce2539284.jpeg)

## Storage Models

There are different ways to store tuples in pages. We have assumed the n-ary storage model so far.

![9.jpg](https://images.spumn.eu.cc/blog/392f86f0db9017d2.jpeg)

### N-Ary Storage Model (NSM)

In the n-ary storage model, the DBMS stores all of the attributes for a single tuple contiguously in a single page. This approach is ideal for **OLTP** workloads where requests are insert-heavy and transactions tend to operate only an individual entity. It is ideal because it takes only one fetch to be able to get all of the attributes for a single tuple.

#### Advantages:

* Fast inserts, updates, and deletes.
* Good for queries that need the entire tuple.

#### Disadvantages:

* Not good for scanning large portions of the table and/or a subset of the attributes.

![10.jpg](https://images.spumn.eu.cc/blog/628f0fe21c044c8a.jpeg)

![11.jpg](https://images.spumn.eu.cc/blog/f33854d4b47e2daf.jpeg)

![12.jpg](https://images.spumn.eu.cc/blog/1edf4f56ffdfeab5.jpeg)

![13.jpg](https://images.spumn.eu.cc/blog/574a95d766e48d2c.jpeg)

![14.jpg](https://images.spumn.eu.cc/blog/8fe1f12361dfdd0a.jpeg)

![15.jpg](https://images.spumn.eu.cc/blog/6a70a2c45ac2ac70.jpeg)

### Decomposition Storage Model (DSM)

In the decomposition storage model, the DBMS stores a single attribute (column) for all tuples contiguously in a block of data. Thus, it is also known as a “column store.” This model is ideal for **OLAP** workloads with many read-only queries that perform large scans over a subset of the table’s attributes.

#### Advantages:

* Reduces the amount of I/O wasted because the DBMS only reads the data that it needs for that query.
* Better query processing and data compression

#### Disadvantages:

* Slow for point queries, inserts, updates, and deletes because of tuple splitting/stitching.

![16.jpg](https://images.spumn.eu.cc/blog/6cdf19ad26d17e21.jpeg)

![17.jpg](https://images.spumn.eu.cc/blog/e018dae90814272d.jpeg)

![18.jpg](https://images.spumn.eu.cc/blog/0988566678b68c95.jpeg)

![19.jpg](https://images.spumn.eu.cc/blog/e0b6c3c28eae7e2c.jpeg)

To put the tuples back together when using a column store, there are two common approaches: The most commonly used approach is fixed-length offsets. Here, you know that the value in a given column will match to another value in another column at the same offset, they will correspond to the same tuple. Therefore, every single value within the column will have to be the same length. A less common approach is to use embedded tuple ids. Here, for every attribute in the columns, the DBMS stores a tuple id (ex: a primary key) with it. The system then would also store a mapping to tell it how to jump to every attribute that has that id. Note that this method has a large storage overhead because it needs to store a tuple id for every attribute entry.

![20.jpg](https://images.spumn.eu.cc/blog/0995a19df0d8205a.jpeg)

![21.jpg](https://images.spumn.eu.cc/blog/ac87f10155352d27.jpeg)

![22.jpg](https://images.spumn.eu.cc/blog/853d793b65f12ea6.jpeg)

## Database Compression

Compression is widely used in disk-based DBMSs. Because disk I/O is (almost) always the main bottleneck. Thus, compression in these systems improve performance, especially in read-only analytical workloads. The DBMS can fetch more useful tuples if they have been compressed beforehand at the cost of greater computational overhead for compression and decompression. In-memory DBMSs more complicated since they do not have to fetch data from disk to execute a query. Memory is much faster than disks, but compressing the database reduces DRAM requirements and processing. They have to strike a balance between **speed** vs. **compression** **ratio**. **Compressing the database reduces DRAM requirements.** It may decrease CPU costs during query execution.

![23.jpg](https://images.spumn.eu.cc/blog/6bed60d7cccded49.jpeg)

If data sets are completely random bits, there would be no ways to perform compression. However, there are key properties of real-world data sets that are amenable to compression:

* Data sets tend to have highly _skewed_ distributions for attribute values (e.g., Zipfian distribution of the Brown Corpus).
* Data sets tend to have high _correlation_ between attributes of the same tuple (e.g., Zip Code to City, Order Date to Ship Date).

![24.jpg](https://images.spumn.eu.cc/blog/18009cbd912000cc.jpeg)

Given this, we want a database compression scheme to have the following properties:

* Must **produce fixed-length values**. The only exception is var-length data stored in separate pools. This because the DBMS should follow word-alignment and be able to access data using offsets.
* Allow the DBMS to **postpone decompression** as long as possible during query execution (late materialization).
* Must be a **lossless scheme** because people do not like losing data. Any kind of lossy compression has to be performed at the application level.

![25.jpg](https://images.spumn.eu.cc/blog/9e9a5ec268a7369a.jpeg)

![26.jpg](https://images.spumn.eu.cc/blog/dc72e4a2dabde273.jpeg)

### Compression Granularity

Before adding compression to the DBMS, we need to decide what kind of data we want to compress. This decision determines compression schemes are available. There are four levels of compression granularity:

* **Block Level:** Compress a block of tuples for the same table.
* **Tuple Level:** Compress the contents of the entire tuple (NSM only).
* **Attribute Level:** Compress a single attribute value within one tuple. Can target multiple attributes for the same tuple.
* **Columnar Level:** Compress multiple values for one or more attributes stored for multiple tuples (DSM only). This allows for more complicated compression schemes.

![27.jpg](https://images.spumn.eu.cc/blog/79e5d578c321a769.jpeg)

## Naive Compression

The DBMS compresses data using a general purpose algorithm (e.g., gzip, LZO, LZ4, Snappy, Brotli, Oracle OZIP, Zstd). Although there are several compression algorithms that the DBMS could use, engineers often choose ones that often provides lower compression ratio in exchange for faster compress/decompress.

![28.jpg](https://images.spumn.eu.cc/blog/7367a9d17d897d03.jpeg)

An example of using naive compression is in **MySQL InnoDB**. The DBMS compresses disk pages, pad them to a power of two KBs and stored them into the buffer pool. However, every time the DBMS tries to read data, the compressed data in the buffer pool has to be decompressed.

![29.jpg](https://images.spumn.eu.cc/blog/43ad0313c37b2fc2.jpeg)

Since accessing data requires decompression of compressed data, this limits the scope of the compression scheme. If the goal is to compress the entire table into one giant block, using naive compression schemes would be impossible since the whole table needs to be compressed/decompressed for every access. Therefore, for MySQL, it breaks the table into smaller chunks since the compression scope is limited. Another problem is that these naive schemes also do not consider the high-level meaning or semantics of the data. The algorithm is oblivious to neither the structure of the data, nor how the query is planning to access the data. Therefore, this gives away the opportunity to utilize late materialization, since the DBMS will not be able to tell when it will be able to delay the decompression of data.

![30.jpg](https://images.spumn.eu.cc/blog/f6435e5dc71020bd.jpeg)

![31.jpg](https://images.spumn.eu.cc/blog/d2f3347091319869.jpeg)

![32.jpg](https://images.spumn.eu.cc/blog/062134a3ca50e9e9.jpeg)

## Columnar Compression

![33.jpg](https://images.spumn.eu.cc/blog/52244d67331eb70b.jpeg)

### Run-Length Encoding (RLE)

RLE compresses runs of the same value in a single column into triplets:

* The value of the attribute
* The start position in the column segment
* The number of elements in the run

The DBMS should sort the columns intelligently beforehand to maximize compression opportunities. This clusters duplicate attributes and thereby increasing compression ratio.

![34.jpg](https://images.spumn.eu.cc/blog/1c0cdd9e1a9849f9.jpeg)

![35.jpg](https://images.spumn.eu.cc/blog/938269abaefa28c3.jpeg)

![36.jpg](https://images.spumn.eu.cc/blog/227c82ac7c2e01de.jpeg)

![37.jpg](https://images.spumn.eu.cc/blog/71095e899976978b.jpeg)

![38.jpg](https://images.spumn.eu.cc/blog/9e4c1c3fb7d3bd01.jpeg)

### Bit-Packing Encoding

When values for an attribute are always less than the value’s declared largest size, store them as smaller data type.

![39.jpg](https://images.spumn.eu.cc/blog/8919075301ad4769.jpeg)

![40.jpg](https://images.spumn.eu.cc/blog/32b5c612803b43f0.jpeg)

### Mostly Encoding

Bit-packing variant that uses a special marker to indicate when a value exceeds largest size and then maintain a look-up table to store them.

![41.jpg](https://images.spumn.eu.cc/blog/8feec6af138b3b45.jpeg)

### Bitmap Encoding

The DBMS stores a separate bitmap for each unique value for a particular attribute where an offset in the vector corresponds to a tuple. The $i^{th}$ position in the bitmap corresponds to the $i^{th}$tuple in the table to indicate whether that value is present or not. The bitmap is **typically segmented into chunks** to avoid allocating large blocks of contiguous memory. **This approach is only practical if the value cardinality is low**, since the size of the bitmap is linear to the cardinality of the attribute value. If the cardinalty of the value is high, then the bitmaps can become larger than the original data set.

![42.jpg](https://images.spumn.eu.cc/blog/c79c19749b749a34.jpeg)

![43.jpg](https://images.spumn.eu.cc/blog/5758c26a6693c626.jpeg)

![44.jpg](https://images.spumn.eu.cc/blog/2719612030eb7b4f.jpeg)

![45.jpg](https://images.spumn.eu.cc/blog/e62b31b7cf672a92.jpeg)

### Delta Encoding

Instead of storing exact values, record the difference between values that follow each other in the same column. **The base value can be stored in-line or in a separate look-up table**. We can also use RLE on the stored deltas to get even better compression ratios.

![46.jpg](https://images.spumn.eu.cc/blog/480a73515d5a37e5.jpeg)

![47.jpg](https://images.spumn.eu.cc/blog/09732dc8767c6449.jpeg)

### Incremental Encoding

This is a type of delta encoding whereby common prefixes or suffixes and their lengths are recorded so that they need not be duplicated. This works best with sorted data.

![48.jpg](https://images.spumn.eu.cc/blog/44131ca03101e2e4.jpeg)

### Dictionary Compression

The **most common** database compression scheme is dictionary encoding. The DBMS replaces frequent patterns in values with smaller codes. It then stores only these codes and a data structure (i.e., dictionary) that maps these codes to their original value. **A dictionary compression scheme needs to support fast encoding/decoding, as well as range queries.**

![49.jpg](https://images.spumn.eu.cc/blog/c62958957a079108.jpeg)

![50.jpg](https://images.spumn.eu.cc/blog/4bf31e2457a11afd.jpeg)

\*\*Encoding and Decoding: \*\*Finally, the dictionary needs to decide how to **encodes** (convert uncompressed value into its compressed form)/**decodes** (convert compressed value back into its original form) data. It is not possible to use hash functions.

![51.jpg](https://images.spumn.eu.cc/blog/839ab4ef0d3b734e.jpeg)

The encoded values also need to **support sorting** in the same order as original values. This ensures that results returned for compressed queries run on compressed data are consistent with uncompressed queries run on original data. This **order-preserving property** allows operations to be performed directly on the codes.

![52.jpg](https://images.spumn.eu.cc/blog/4699fc4d73704f55.jpeg)

![53.jpg](https://images.spumn.eu.cc/blog/059e056a9fb6290c.jpeg)

![54.jpg](https://images.spumn.eu.cc/blog/72978ae437cd65df.jpeg)

![55.jpg](https://images.spumn.eu.cc/blog/33b808753b972572.jpeg)
