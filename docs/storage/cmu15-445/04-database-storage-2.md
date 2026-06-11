# 04 - Database Storage 2

![1.jpg](https://images.spumn.eu.cc/blog/0512f401bb73b944.jpeg)

![2.jpg](https://images.spumn.eu.cc/blog/1eb74734675eb5c5.jpeg)

![3.jpg](https://images.spumn.eu.cc/blog/e8bc309bfb7e3848.jpeg)

## Log-Structured Storage

Some problems associated with the Slotted-Page Design are:

* Fragmentation: Deletion of tuples can leave gaps in the pages.
* Useless Disk I/O: Due to the block-oriented nature of non-volatile storage, the whole block needs to be read to fetch a tuple.
* Random Disk I/O: The disk reader could have to jump to 20 different places to update 20 different tuples, which can be very slow.

What if we were working on a system which only allows creation of new data and no overwrites? The log-structured storage model works with this assumption and addresses some of the problems listed above.

![4.jpg](https://images.spumn.eu.cc/blog/1ff0f21407c28115.jpeg)

![5.jpg](https://images.spumn.eu.cc/blog/d66b163b2fbaa254.jpeg)

![6.jpg](https://images.spumn.eu.cc/blog/a838332b78f39e4d.jpeg)

![7.jpg](https://images.spumn.eu.cc/blog/ca5190c9e8291492.jpeg)

**Log-Structured Storage**: Instead of storing tuples, the DBMS only stores log records.

* Stores records to ﬁle of how the database was modiﬁed (put and delete). Each log record contains the tuple’s unique identiﬁer.
* To read a record, the DBMS scans the log ﬁle backwards from newest to oldest and “recreates” the tuple.
* Fast writes, potentially slow reads. Disk writes are sequential and existing pages are immutable which leads to reduced random disk I/O.
* Works well on append-only storage because the DBMS cannot go back and update the data.
* To avoid long reads, the DBMS can have **indexes** to allow it to jump to speciﬁc locations in the log. It can also periodically compact the log. (If it had a tuple and then made an update to it, it could compact it down to just inserting the updated tuple.)
* The database can compact the log into a table \*\*sorted by the id \*\*since the temporal information is not needed anymore. These are called Sorted String Tables (SSTables) and they can make the tuple search very fast.
* **The issue with compaction is that the DBMS ends up with write ampliﬁcation**. (It re-writes the same data over and over again.)

![8.jpg](https://images.spumn.eu.cc/blog/ef4500156a376ed0.jpeg)

![9.jpg](https://images.spumn.eu.cc/blog/e7fa362f4a610d7b.jpeg)

![10.jpg](https://images.spumn.eu.cc/blog/95f0b4284cfcd5e4.jpeg)

![11.jpg](https://images.spumn.eu.cc/blog/95f0b4284cfcd5e4.jpeg)

![12.jpg](https://images.spumn.eu.cc/blog/669d12bce4219734.jpeg)

![13.jpg](https://images.spumn.eu.cc/blog/2c11140d0de3821d.jpeg)

![14.jpg](https://images.spumn.eu.cc/blog/41516c054b5f7fde.jpeg)

![15.jpg](https://images.spumn.eu.cc/blog/b72a38873c798ab1.jpeg)

![16.jpg](https://images.spumn.eu.cc/blog/be261996dae139ea.jpeg)

![17.jpg](https://images.spumn.eu.cc/blog/801dc45dc09c91a9.jpeg)

![18.jpg](https://images.spumn.eu.cc/blog/56ad4b66d3093b28.jpeg)

## Data Representation

The data in a tuple is essentially just byte arrays. It is up to the DBMS to know how to interpret those bytes to derive the values for attributes. A _**data representation**_\*\* scheme\*\* is how a DBMS stores the bytes for a value. There are ﬁve high level datatypes that can be stored in tuples: integers, variable-precision numbers, ﬁxed-point precision numbers, variable length values, and dates/times.

### Integers

Most DBMSs store integers using their “native” C/C++ types as speciﬁed by the IEEE-754 standard. These values are ﬁxed length. Examples: `INTEGER`, `BIGINT`, `SMALLINT`, `TINYINT`.

### Variable Precision Numbers

These are inexact, variable-precision numeric types that use the “native” C/C++ types speciﬁed by IEEE-754 standard. These values are also ﬁxed length. Operations on variable-precision numbers are faster to compute than arbitrary precision numbers because the CPU can execute instructions on them directly. However, there may be rounding errors when performing computations due to the fact that some numbers cannot be represented precisely. Examples: `FLOAT`, `REAL`.

### Fixed-Point Precision Numbers

These are numeric data types **with arbitrary precision and scale**. They are typically stored in exact, variable-length binary representation (almost like a string) with additional meta-data that will tell the system things like the length of the data and where the decimal should be. These data types are used when rounding errors are unacceptable, but the DBMS pays a performance penalty to get this accuracy. Examples: `NUMERIC`, `DECIMAL`.

![19.jpg](https://images.spumn.eu.cc/blog/feffdb5507e8e80f.jpeg)

![20.jpg](https://images.spumn.eu.cc/blog/9d6f3c88b198c6b3.jpeg)

![21.jpg](https://images.spumn.eu.cc/blog/967f19cb8a4ef6d9.jpeg)

![22.jpg](https://images.spumn.eu.cc/blog/5cca876e9eacc719.jpeg)

![23.jpg](https://images.spumn.eu.cc/blog/a5b4420cf4c721a9.jpeg)

![24.jpg](https://images.spumn.eu.cc/blog/8ec60d1aca2d21f5.jpeg)

![25.jpg](https://images.spumn.eu.cc/blog/c43ebe0a3411160e.jpeg)

![26.jpg](https://images.spumn.eu.cc/blog/855da28d9854b782.jpeg)

![27.jpg](https://images.spumn.eu.cc/blog/94bd515eaa7370c1.jpeg)

![28.jpg](https://images.spumn.eu.cc/blog/d357535cd663ce85.jpeg)

## Variable-Length Data

These represent data types of arbitrary length. They are typically stored with a **header** that keeps track of the length of the string to make it easy to jump to the next value. It may also contain a **checksum** for the data. Most DBMSs do not allow a tuple to exceed the size of a single page. The ones that do store the data on a special “overﬂow” page and have the tuple contain a reference to that page. These _overﬂow pages can contain pointers_ to additional overﬂow pages until all the data can be stored. Some systems will let you store these large values in an **external ﬁle**, and then the tuple will contain a pointer to that ﬁle. For example, if the database is storing photo information, the DBMS can store the photos in the external ﬁles rather than having them take up large amounts of space in the DBMS. One downside of this is that the DBMS cannot manipulate the contents of this ﬁle. Thus, there are **no durability or transaction protections**. Examples: `VARCHAR`, `VARBINARY`, `TEXT`, `BLOB`.

![29.jpg](https://images.spumn.eu.cc/blog/30c42efcd7bdc725.jpeg)

![30.jpg](https://images.spumn.eu.cc/blog/633a376d0d26db2d.jpeg)

![31.jpg](https://images.spumn.eu.cc/blog/f39e9d2eedd31d97.jpeg)

## Dates and Times

Representations for date/time vary for different systems. Typically, these are represented as some unit time (micro/milli)seconds since the unix epoch. Examples: `TIME`, `DATE`, `TIMESTAMP`.

## System Catalogs

In order for the DBMS to be able to decipher the contents of tuples, it maintains an internal **catalog to tell it meta-data about the databases.** The meta-data will contain information about what tables and columns the databases have along with their types and the orderings of the values. Most DBMSs store their catalog inside of themselves in the format that they use for their tables. They use special code to “bootstrap” these catalog tables.

![32.jpg](https://images.spumn.eu.cc/blog/e6565c404c9c106d.jpeg)

![33.jpg](https://images.spumn.eu.cc/blog/72621d24d6ec2804.jpeg)

![34.jpg](https://images.spumn.eu.cc/blog/1ef78241e256a31d.jpeg)

![35.jpg](https://images.spumn.eu.cc/blog/69b9f1e6ad296c3e.jpeg)

![36.jpg](https://images.spumn.eu.cc/blog/8776a10fe47d8846.jpeg)
