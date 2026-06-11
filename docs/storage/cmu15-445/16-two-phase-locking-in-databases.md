# 16 - Two-Phase Locking in Databases

## 16 - Two-Phase Locking in Databases

![1.jpg](https://images.spumn.eu.cc/blog/14a0a9a00f26de4a.jpg)

![2.jpg](https://images.spumn.eu.cc/blog/99521b87b963ecd8.jpg)

![3.jpg](https://images.spumn.eu.cc/blog/804df7811850936d.jpg)

![4.jpg](https://images.spumn.eu.cc/blog/992e6ba478f02eff.jpg)

![5.jpg](https://images.spumn.eu.cc/blog/7965b32eaac09f59.jpg)

## Transaction Locks

A DBMS uses _locks_ to dynamically generate an execution schedule for transactions that is serializable without knowing each transaction’s read/write set ahead of time. These locks protect database objects during concurrent access when there are multiple readers and writes. The DBMS contains a centralized _lock manager_ that decides whether a transaction can acquire a lock or not. It also provides a global view of whats going on inside the system.

![6.jpg](https://images.spumn.eu.cc/blog/56edc3f0d520c45b.jpg)

![7.jpg](https://images.spumn.eu.cc/blog/d2ce579bce64183b.jpg)

There are two basic types of locks:

* **Shared Lock (S-LOCK):** A shared lock that allows multiple transactions to read the same object at the same time. If one transaction holds a shared lock, then another transaction can also acquire that same shared lock.
* **Exclusive Lock (X-LOCK)** : An exclusive lock allows a transaction to modify an object. This lock prevents other transactions from taking any other lock (`S-LOCK` or `X-LOCK`) on the object. Only one transaction can hold an exclusive lock at a time.

Transactions must request locks (or upgrades) from the lock manager. The lock manager grants or blocks requests based on what locks are currently held by other transactions. Transactions must release locks when they no longer need them to free up the object. The lock manager updates its internal lock-table with information about which transactions hold which locks and which transactions are waiting to acquire locks.

![8.jpg](https://images.spumn.eu.cc/blog/db30c06390c3865a.jpg)

![9.jpg](https://images.spumn.eu.cc/blog/5bbcd53884b49179.jpg)

![10.jpg](https://images.spumn.eu.cc/blog/dcbf2d185068bd92.jpg)

The DBMS’s lock-table does not need to be durable since any transaction that is active (i.e., still running) when the DBMS crashes is automatically aborted.

Just the usage of locks does not automatically resolve all the issues associated with concurrent transactions. Locks need to be complemented by a concurrency control protocol.

![11.jpg](https://images.spumn.eu.cc/blog/7d7419327bfcdc55.jpg)

![12.jpg](https://images.spumn.eu.cc/blog/42753855f499fe72.jpg)

## Two-Phase Locking

Two-Phase locking (2PL) is a pessimistic concurrency control protocol that uses locks to determine whether **a transaction** is allowed to access an object in the database on the ﬂy. The protocol does not need to know all of the queries that a transaction will execute ahead of time.

**Phase #1– Growing**: In the growing phase, each transaction requests the locks that it needs from the DBMS’s lock manager. The lock manager grants/denies these lock requests.

**Phase #2– Shrinking**: Transactions enter the shrinking phase immediately after it releases its ﬁrst lock. In the shrinking phase, transactions are only allowed to release locks. They are not allowed to acquire new ones.

![13.jpg](https://images.spumn.eu.cc/blog/c93de65e214c85a5.jpg)

On its own, 2PL is sufﬁcient to guarantee **conﬂict serializability**. It generates schedules whose precedence graph is acyclic. But it is susceptible to _cascading aborts_, which is when a transaction aborts and now another transaction must be rolled back, which results in wasted work.

![14.jpg](https://images.spumn.eu.cc/blog/86f06660fc808fee.jpg)

![15.jpg](https://images.spumn.eu.cc/blog/65d32a272d9d18f3.jpg)

![16.jpg](https://images.spumn.eu.cc/blog/2aea9d6e351eccf4.jpg)

![17.jpg](https://images.spumn.eu.cc/blog/b5d7de2951f4878e.jpg)

![18.jpg](https://images.spumn.eu.cc/blog/eacbd8a2ed9e3bf6.jpg)

![19.jpg](https://images.spumn.eu.cc/blog/26973155e9de9ec1.jpg)

2PL can still have dirty reads and it can also lead to deadlocks. There are also potential schedules that are serializable but would not be allowed by 2PL (locking can limit concurrency).

![20.jpg](https://images.spumn.eu.cc/blog/119ad7191bc7b59f.jpg)

![21.jpg](https://images.spumn.eu.cc/blog/6526cbd16b6e0ce1.jpg)

### Strong Strict Two-Phase Locking

A schedule is _strict_ if any value written by a transaction is never read or overwritten by another transaction until the ﬁrst transaction commits. _Strong Strict 2PL_ (also known as _**Rigorous**_​ \*\* 2PL\*\*) is a variant of 2PL where the transactions only release locks when they commit.

The advantage of this approach is that the DBMS does not incur _cascading aborts_. The DBMS can also reverse the changes of an aborted transaction by restoring the original values of modiﬁed tuples. However, Strict 2PL generates more cautious/pessimistic schedules that **limit concurrency.**

![22.jpg](https://images.spumn.eu.cc/blog/821fe4bcaad91aa5.jpg)

![23.jpg](https://images.spumn.eu.cc/blog/407c15f32af66444.jpg)

![24.jpg](https://images.spumn.eu.cc/blog/776c58de2f680e9a.jpg)

![25.jpg](https://images.spumn.eu.cc/blog/3ca366f8b5fe5ef3.jpg)

![26.jpg](https://images.spumn.eu.cc/blog/4bff1543c757d990.jpg)

![27.jpg](https://images.spumn.eu.cc/blog/2bac71e74d409553.jpg)

### Universe of Schedules

$SerialSchedules ⊂ StrongStrict2PL ⊂ ConflictSerializableSchedules ⊂ V iewSerializableSchedules ⊂ AllSchedules$

![28.jpg](https://images.spumn.eu.cc/blog/6e4605d49f1f9548.jpg)

![29.jpg](https://images.spumn.eu.cc/blog/f8c19469871339a3.jpg)

## Deadlock Handling

A _deadlock_ is a cycle of transactions waiting for locks to be released by each other. There are two approaches to handling deadlocks in 2PL: **detection and prevention**.

![30.jpg](https://images.spumn.eu.cc/blog/3648602785db78a7.jpg)

![31.jpg](https://images.spumn.eu.cc/blog/4aa6c49683f0b325.jpg)

### Approach #1:# Deadlock Detection

To detect deadlocks, the DBMS creates a _waits-for_ graph where transactions are nodes, and there exists a directed edge from $T\_i$ to $T\_j$ if transaction $T\_i$ is waiting for transaction $T\_j$ to release a lock. The system will periodically check for cycles in the waits-for graph (usually with a background thread) and then make a decision on how to break it. **Latches are not needed** when constructing the graph since if the DBMS misses a deadlock in one pass, it will ﬁnd it in the subsequent passes. Note that there is a tradeoff between the frequency of deadlock checks (uses cpu cycles) and the wait time till a deadlock is broken.

When the DBMS detects a deadlock, it will **select a “victim” transaction to abort to break the cycle**. The victim transaction will either restart or abort depending on how the application invoked it.

![32.jpg](https://images.spumn.eu.cc/blog/80d902e4d3db4558.jpg)

![33.jpg](https://images.spumn.eu.cc/blog/6926ce6b00d023d8.jpg)

![34.jpg](https://images.spumn.eu.cc/blog/12fcfe5f928ab711.jpg)

![35.jpg](https://images.spumn.eu.cc/blog/e7f6f0324ac32925.jpg)

![36.jpg](https://images.spumn.eu.cc/blog/ce1bcfaf3f0b5fae.jpg)

The DBMS can consider multiple transaction properties when selecting a victim to break the deadlock:

1. By age (newest or oldest timestamp).
2. By progress (least/most queries executed).
3. By the ## of items already locked.
4. By the ## of transactions needed to rollback with it.
5. ## of times a transaction has been restarted in the past (to avoid starvation).

There is no one choice that is better than others. Many systems use a combination of these factors.

After selecting a victim transaction to abort, the DBMS can also decide on how far to rollback the transaction’s changes. It can either rollback the entire transaction or just enough queries to break the deadlock.

![37.jpg](https://images.spumn.eu.cc/blog/a061467aca1e2c5a.jpg)

![38.jpg](https://images.spumn.eu.cc/blog/8998949a6487a2ea.jpg)

### Approach #2:# Deadlock Prevention

Instead of letting transactions try to acquire any lock they need and then deal with deadlocks afterwards, deadlock prevention 2PL stops transactions from causing deadlocks before they occur. When a transaction tries to acquire a lock held by another transaction (which could cause a deadlock), the DBMS kills one of them. To implement this, transactions are assigned priorities based on timestamps (older transactions have higher priority). These schemes guarantee no deadlocks because **only one type of direction is allowed** when waiting for a lock. When a transaction restarts, the DBMS **reuses** the same timestamp.

![39.jpg](https://images.spumn.eu.cc/blog/f944481667f6b2b6.jpg)

There are two ways to kill transactions under deadlock prevention:

* **Wait-Die (“Old Waits for Young”)** : If the requesting transaction has a higher priority than the holding transaction, it waits. Otherwise, it aborts.
* **Wound-Wait (“Young Waits for Old”)** : If the requesting transaction has a higher priority than the holding transaction, the holding transaction aborts and releases the lock. Otherwise, the requesting transaction waits.

![40.jpg](https://images.spumn.eu.cc/blog/a7aafb1522ab78c4.jpg)

![41.jpg](https://images.spumn.eu.cc/blog/94d78666b7075cf1.jpg)

![42.jpg](https://images.spumn.eu.cc/blog/263be8e37c2e051c.jpg)

## Lock Granularities

If a transaction wants to update one billion tuples, it has to ask the DBMS’s lock manager for a billion locks. This will be slow because the transaction has to take latches in the lock manager’s internal lock table data structure as it acquires/releases locks.

![43.jpg](https://images.spumn.eu.cc/blog/69abe94c698b00a6.jpg)

To avoid this overhead, the DBMS can use to use a lock hierarchy that allows a transaction to take more coarse-grained locks in the system. For example, it could acquire a single lock on the table with one billion tuples instead of one billion separate locks. When a transaction acquires a lock for an object in this hierarchy, it implicitly acquires the locks for all its children objects.

![44.jpg](https://images.spumn.eu.cc/blog/34685b4f6c08c60e.jpg)

### Database Lock Hierarchy:

1. Database level (Slightly Rare)
2. Table level (Very Common)
3. Page level (Common)
4. Tuple level (Very Common)
5. Attribute level (Rare)

![45.jpg](https://images.spumn.eu.cc/blog/fd4b1a84b132fa9e.jpg)

![46.jpg](https://images.spumn.eu.cc/blog/3472faf0ec553c67.jpg)

![47.jpg](https://images.spumn.eu.cc/blog/b2492a19bd3f693a.jpg)

**Intention locks** allow a higher level node to be locked in **shared** mode or **exclusive** mode without having to check all descendant nodes. If a node is in an intention mode, then explicit locking is being done at a lower level in the tree.

![48.jpg](https://images.spumn.eu.cc/blog/f667b784556505d5.jpg)

* **Intention-Shared (IS)** : Indicates explicit locking at a lower level with shared locks.
* **Intention-Exclusive (IX)** : Indicates explicit locking at a lower level with exclusive or shared locks.
* **Shared+Intention-Exclusive (SIX)** : The sub-tree rooted at that node is locked explicitly in **shared** mode and explicit locking is being done at a lower level with exclusive-mode locks.

![49.jpg](https://images.spumn.eu.cc/blog/5298948e2cf16b76.jpg)

![50.jpg](https://images.spumn.eu.cc/blog/a9828555ea7d7fe1.jpg)

![51.jpg](https://images.spumn.eu.cc/blog/223be886b9640be1.jpg)

![52.jpg](https://images.spumn.eu.cc/blog/8a202379d909a345.jpg)

![53.jpg](https://images.spumn.eu.cc/blog/8062c65899d27b3a.jpg)

![54.jpg](https://images.spumn.eu.cc/blog/66acaf73604583c2.jpg)

![55.jpg](https://images.spumn.eu.cc/blog/93cd0644e07be976.jpg)

![56.jpg](https://images.spumn.eu.cc/blog/257f9bcc4c060acf.jpg)

![57.jpg](https://images.spumn.eu.cc/blog/0b2822ce6bd05ae8.jpg)

![58.jpg](https://images.spumn.eu.cc/blog/2f8c0d3d944cbffc.jpg)

![59.jpg](https://images.spumn.eu.cc/blog/143a498fad5e0e1f.jpg)

![60.jpg](https://images.spumn.eu.cc/blog/8717ba5f94cf1d18.jpg)

![61.jpg](https://images.spumn.eu.cc/blog/b4bfe8c83a4524f5.jpg)

![62.jpg](https://images.spumn.eu.cc/blog/c4ac2b50defa0ee7.jpg)

![63.jpg](https://images.spumn.eu.cc/blog/5b30af1eadac5f86.jpg)

![64.jpg](https://images.spumn.eu.cc/blog/a8646166ba1669fd.jpg)

![65.jpg](https://images.spumn.eu.cc/blog/9b29f1e1e0d1c265.jpg)

![66.jpg](https://images.spumn.eu.cc/blog/c3604d01fcca5839.jpg)

![67.jpg](https://images.spumn.eu.cc/blog/d7bb49a778c6536a.jpg)

![68.jpg](https://images.spumn.eu.cc/blog/f165752307500b48.jpg)

![69.jpg](https://images.spumn.eu.cc/blog/b9e73560423d5169.jpg)

![70.jpg](https://images.spumn.eu.cc/blog/bcf0386a71f01329.jpg)

![71.jpg](https://images.spumn.eu.cc/blog/89b49e940bce17dc.jpg)

![72.jpg](https://images.spumn.eu.cc/blog/e3958c4b480bd1c7.jpg)
