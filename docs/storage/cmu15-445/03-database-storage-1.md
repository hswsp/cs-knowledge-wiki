# 03 - Database Storage 1

![1.jpg](https://images.spumn.eu.cc/blog/f837e3ee78ff529b.jpeg)

![2.jpg](https://images.spumn.eu.cc/blog/dadff4e986141e50.jpeg)

![3.jpg](https://images.spumn.eu.cc/blog/cab80604ebf4ed52.jpeg)

## Storage

We will focus on a “disk-oriented” DBMS architecture that assumes that the primary storage location of the database is on non-volatile disk(s).

![4.jpg](https://images.spumn.eu.cc/blog/ea98d530c5b009d5.jpeg)

![5.jpg](https://images.spumn.eu.cc/blog/7387cd59034a6dee.jpeg)

At the top of the storage hierarchy, you have the devices that are closest to the CPU. This is the fastest storage, but it is also the smallest and most expensive. The further you get away from the CPU, the larger but slower the storage devices get. These devices also get cheaper per GB.

![6.jpg](https://images.spumn.eu.cc/blog/f3aa09285a8ac209.jpeg)

**Volatile Devices:**

* Volatile means that if you pull the power from the machine, then the data is lost.
* **Volatile storage supports fast random access with byte-addressable locations.** This means that the program can jump to any byte address and get the data that is there.
* For our purposes, we will always refer to this storage class as “memory.”

**Non-Volatile Devices:**

* Non-volatile means that the storage device does not require continuous power in order for the device to retain the bits that it is storing.
* It is also **block/page addressable.** This means that in order to read a value at a particular offset, the program ﬁrst has to load the 4 KB page into memory that holds the value the program wants to read.
* Non-volatile storage is traditionally better at sequential access (reading multiple contiguous chunks of data at the same time).
* We will refer to this as “disk.” We will not make a (major) distinction between solid-state storage (SSD) and spinning hard drives (HDD).

![7.jpg](https://images.spumn.eu.cc/blog/62330f05464b5c7e.jpeg)

There is also a relatively new class of storage devices that are becoming more popular called _persistent memory_. These devices are designed to be the best of both worlds: **almost as fast as DRAM with the persistence of disk**. We will not cover these devices in this course, and they are currently not in widespread production use. Probably the most famous example is Optane; unfortunately Intel is winding down its production as of summer 2022. Note that you may see older references to persistent memory as “non-volatile memory”.

![8.jpg](https://images.spumn.eu.cc/blog/d21cec65989e6a4f.jpeg)

You may see references to NVMe SSDs, where NVMe stands for non-volatile memory express. These NVMe SSDs are not the same hardware as persistent memory modules. Rather, they are typical NAND ﬂash drives that connect over an improved hardware interface. This improved hardware interface allows for much faster transfers, which leverages improvements in NAND ﬂash perfomance.

![9.jpg](https://images.spumn.eu.cc/blog/77e42e0eaed81e69.jpeg)

Since our DBMS architecture assumes that the database is stored on disk, the components of the DBMS are responsible for ﬁguring out how to move data between non-volatile disk and volatile memory since the system cannot operate on the data directly on disk. We will focus on hiding the latency of the disk rather than optimizations with registers and caches since getting data from disk is so slow. If reading data from the L1 cache reference took one second, reading from an SSD would take 4.4 hours, and reading from an HDD would take 3.3 weeks.

## Disk-Oriented DBMS Overview

The database is all on disk, and the data in database ﬁles is organized into pages, with the ﬁrst page being the **directory page**. To operate on the data, the DBMS needs to bring the data into memory. It does this by having a **buffer pool** that manages the data movement back and forth between disk and memory. The DBMS also has an **execution engine** that will execute queries. The execution engine will ask the buffer pool for a speciﬁc page, and the buffer pool will take care of bringing that page into memory and giving the execution engine a pointer to that page in memory. The buffer pool manager will ensure that the page is there while the execution engine operates on that part of memory.

![10.jpg](https://images.spumn.eu.cc/blog/6f605d7bbc87bc8e.jpeg)

![11.jpg](https://images.spumn.eu.cc/blog/aeae16385ecddfd9.jpeg)

![12.jpg](https://images.spumn.eu.cc/blog/58218eadd42f2e7e.jpeg)

## DBMS vs. OS

A high-level design goal of the DBMS is to support databases that exceed the amount of memory available. Since reading/writing to disk is expensive, disk use must be carefully managed. We do not want large stalls from fetching something from disk to slow down everything else. We want the DBMS to be able to process other queries while it is waiting to get the data from disk. This high-level design goal is like virtual memory, where there is a large address space and a place for the OS to bring in pages from disk. One way to achieve this virtual memory is by using `mmap` to map the contents of a ﬁle in a process’ address space, which makes the OS responsible for moving pages back and forth between disk and memory. \*\*Unfortunately, this means that if \*\*​ \*\*`**mmap**`**​ \*\* hits a page fault, the process will be blocked.**

* You never want to use `mmap` in your DBMS if you need to write.
* The DBMS (almost) always wants to control things itself and can do a better job at it since it knows more about the data being accessed and the queries being processed.
* The operating system is not your friend.

![13.jpg](https://images.spumn.eu.cc/blog/04a35d0a7972810d.jpeg)

![14.jpg](https://images.spumn.eu.cc/blog/1e1712cf8711fef1.jpeg)

![15.jpg](https://images.spumn.eu.cc/blog/28b9a8b022e615b8.jpeg)

![16.jpg](https://images.spumn.eu.cc/blog/9629fed90145d91b.jpeg)

![17.jpg](https://images.spumn.eu.cc/blog/a483cb4d8a91f9f2.jpeg)

TLB ( Translation Lookaside Buffer。MMU 为了加速查找页表，使用的 cache。用来加速 MMU 的转化速度)是从虚拟内存地址到物理内存地址转换的高速缓存。当处理器更改地址的虚拟到物理映射时，它需要告诉其他处理器在其缓存中使该映射无效。这个过程被称为"[TLB shootdowns](https://juejin.cn/post/6844904084957315086)"。 It is possible to use the OS by using:

* `madvise`: Tells the OS know when you are planning on reading certain pages.
* `mlock`: Tells the OS to not swap memory ranges out to disk.
* `msync`: Tells the OS to ﬂush memory ranges out to disk.

![18.jpg](https://images.spumn.eu.cc/blog/1f5569916e998560.jpeg)

![19.jpg](https://images.spumn.eu.cc/blog/c767967bef62cf43.jpeg)

We do not advise using `mmap` in a DBMS for correctness and performance reasons. Even though the system will have functionalities that seem like something the OS can provide, having the DBMS implement these procedures itself gives it better control and performance.

![20.jpg](https://images.spumn.eu.cc/blog/899c84c7da9c9309.jpeg)

![21.jpg](https://images.spumn.eu.cc/blog/73049feb9d1e91e6.jpeg)

![22.jpg](https://images.spumn.eu.cc/blog/1171345aa77b634c.jpeg)

## File Storage

In its most basic form, a DBMS stores a database as ﬁles on disk. Some may use a ﬁle hierarchy, others may use a single ﬁle (e.g., SQLite). The OS does not know anything about the contents of these ﬁles. Only the DBMS knows how to decipher their contents, since it is encoded in a way speciﬁc to the DBMS.

![23.jpg](https://images.spumn.eu.cc/blog/1ca5f412f8bd68e7.jpeg)

The DBMS’s _storage manager_ is responsible for managing a database’s ﬁles. It represents the ﬁles **as a collection of pages**. It also keeps track of what data has been read and written to pages as well how much free space there is in these pages.

![24.jpg](https://images.spumn.eu.cc/blog/6b4c1c20c0244c73.jpeg)

## Database Pages

The DBMS organizes the database across one or more ﬁles in ﬁxed-size blocks of data called pages. Pages can contain different kinds of data (tuples, indexes, etc). Most systems will not mix these types within pages. Some systems will require that pages are **self-contained**, meaning that all the information needed to read each page is on the page itself. Each page is given a unique identiﬁer. If the database is a single ﬁle, then the page id can just be the ﬁle offset. Most DBMSs have an indirection layer that **maps a page id to a ﬁle path and offset**. The upper levels of the system will ask for a speciﬁc page number. Then, the storage manager will have to turn that page number into a ﬁle and an offset to ﬁnd the page.

![25.jpg](https://images.spumn.eu.cc/blog/d05e69d1933c6438.jpeg)

Most DBMSs uses ﬁxed-size pages to avoid the engineering overhead needed to support variable-sized pages. For example, with variable-size pages, deleting a page could create a hole in ﬁles that the DBMS cannot easily ﬁll with new pages. There are three concepts of pages in DBMS:

1. Hardware page (usually 4 KB).
2. OS page (4 KB).
3. Database page (1-16 KB).

**The storage device guarantees an atomic write of the size of the hardware page.** If the hardware page is 4 KB and the system tries to write 4 KB to the disk, either all 4 KB will be written, or none of it will. This means that if our database page is larger than our hardware page, the DBMS will have to take extra measures to ensure that the data gets written out safely since the program can get partway through writing a database page to disk when the system crashes.

![26.jpg](https://images.spumn.eu.cc/blog/70fc6bb5bab3384b.jpeg)

## Database Heap

There are a couple of ways to ﬁnd the location of the page a DBMS wants on the disk, and **heap ﬁle** organization is one of those ways. A heap ﬁle is an unordered collection of pages where tuples are stored in random order.

![27.jpg](https://images.spumn.eu.cc/blog/65ec277f1278f846.jpeg)

The DBMS can locate a page on disk given a page id by using a **linked list** of pages or a page directory.

1. \*\* Linked List\*\*: Header page holds pointers to a list of free pages and a list of data pages. However, if the DBMS is looking for a speciﬁc page, it has to do a sequential scan on the data page list until it ﬁnds the page it is looking for.
2. **Page Directory**: DBMS maintains special pages that track locations of data pages along with the amount of free space on each page.

![28.jpg](https://images.spumn.eu.cc/blog/a26f9cd36bd2cb4c.jpeg)

![29.jpg](https://images.spumn.eu.cc/blog/3300083d65be1427.jpeg)

![30.jpg](https://images.spumn.eu.cc/blog/aa490561c76757af.jpeg)

![31.jpg](https://images.spumn.eu.cc/blog/149753a8f70340de.jpeg)

![32.jpg](https://images.spumn.eu.cc/blog/45818f9074860f71.jpeg)

## Page Layout

Every page includes a header that records meta-data about the page’s contents:

* Page size.
* Checksum.
* DBMS version.
* Transaction visibility.
* Self-containment. (Some systems like Oracle require this.)

![33.jpg](https://images.spumn.eu.cc/blog/9dc3832e8f0ce549.jpeg)

A **strawman approach** to laying out data is to keep track of how many tuples the DBMS has stored in a page and then append to the end every time a new tuple is added. However, _**problems arise when tuples are deleted or when tuples have variable-length attributes**_. There are two **main approaches** to laying out data in pages: (1) **slotted-pages** and (2) **log-structured**. **Slotted Pages:** Page maps slots to offsets.

* Most common approach used in DBMSs today.
* Header keeps track of the number of used slots, the offset of the starting location of the last used slot, and a slot array, which keeps track of the location of the start of each tuple.
* To add a tuple, the slot array will grow from the beginning to the end, and the data of the tuples will grow from end to the beginning. The page is considered full when the slot array and the tuple data meet.

**Log-Structured:** Covered in the next lecture.

![34.jpg](https://images.spumn.eu.cc/blog/10d6c46f969a37f1.jpeg)

![35.jpg](https://images.spumn.eu.cc/blog/4e5de634e8f4f177.jpeg)

![36.jpg](https://images.spumn.eu.cc/blog/534a2bd3d9596348.jpeg)

![37.jpg](https://images.spumn.eu.cc/blog/2fcf22b1faab1723.jpeg)

![38.jpg](https://images.spumn.eu.cc/blog/0c0c90b8cde8769b.jpeg)

![39.jpg](https://images.spumn.eu.cc/blog/07684d9a7e46dd3c.jpeg)

![40.jpg](https://images.spumn.eu.cc/blog/71183e9adcd4763a.jpeg)

![41.jpg](https://images.spumn.eu.cc/blog/74366e8c86dab3ca.jpeg)

![42.jpg](https://images.spumn.eu.cc/blog/45e782174e4b8a67.jpeg)

![43.jpg](https://images.spumn.eu.cc/blog/53bba16300cf7f30.jpeg)

![44.jpg](https://images.spumn.eu.cc/blog/ee1b5c9ab3d7ac65.jpeg)

![45.jpg](https://images.spumn.eu.cc/blog/9ea22dae162b2ef8.jpeg)

## Tuple Layout

A tuple is essentially a sequence of bytes. It is the DBMS’s job to interpret those bytes into attribute types and values.

![46.jpg](https://images.spumn.eu.cc/blog/28e50ed9cacc861d.jpeg)

**Tuple Header:** Contains meta-data about the tuple.

* Visibility information for the DBMS’s **concurrency control** protocol (i.e., information about which transaction created/modiﬁed that tuple).
* **Bit Map** for `NULL` values.
* Note that the DBMS **does not need to store meta-data about the schema** of the database here.

![47.jpg](https://images.spumn.eu.cc/blog/0b7ad024cef1140c.jpeg)

**Tuple Data:** Actual data for attributes.

* Attributes are typically stored in the order that you specify them when you create the table.
* Most DBMSs do not allow a tuple to exceed the size of a page.

**Unique Identiﬁer**:

* Each tuple in the database is assigned a unique identiﬁer.
* Most common: `page_id + (offset or slot).`
* An application cannot rely on these ids to mean anything.

![48.jpg](https://images.spumn.eu.cc/blog/96271321015b83b4.jpeg)

**Denormalized Tuple Data**: If two tables are related, the DBMS can “pre-join” them, so the tables end up on the same page. This makes reads faster since the DBMS only has to load in one page rather than two separate pages. However, it makes updates more expensive since the DBMS needs more space for each tuple.

![49.jpg](https://images.spumn.eu.cc/blog/4c7934a96e77f405.jpeg)

![50.jpg](https://images.spumn.eu.cc/blog/db694c6c726d2667.jpeg)

![51.jpg](https://images.spumn.eu.cc/blog/c53f835b5cf25afe.jpeg)

![52.jpg](https://images.spumn.eu.cc/blog/28b3eaf217afd457.jpeg)

![53.jpg](https://images.spumn.eu.cc/blog/8b7456c655fe600f.jpeg)
