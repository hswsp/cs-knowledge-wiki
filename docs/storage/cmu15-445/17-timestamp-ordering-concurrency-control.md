# 17 - Timestamp-Ordering Concurrency Control

![1.jpg](https://images.spumn.eu.cc/blog/bdeb0e76a94ea900.jpg)

![2.jpg](https://images.spumn.eu.cc/blog/557abea104c10646.jpg)

## Timestamp Ordering Concurrency Control

Timestamp ordering (T/O) is an **optimistic** class of concurrency control protocols where the DBMS assumes that transaction conflicts are rare. Instead of requiring transactions to acquire locks before they are allowed to read/write to a database object, the DBMS instead uses timestamps to determine the serializability order of transactions.

Each transaction $T_i$ is assigned a unique fixed timestamp $TS(T_i )$ that is monotonically increasing. Different schemes assign timestamps at different times during the transaction. Some advanced schemes even assign multiple timestamps per transaction.

If $TS(T_i ) &lt; TS(T_j )$, then the DBMS must ensure that the execution schedule is equivalent to the serial schedule where $T_i$ appears before $T_j$.

![3.jpg](https://images.spumn.eu.cc/blog/b0e772e00fc32d38.jpg)

There are multiple timestamp allocation implementation strategies. The DBMS can use the system clock as a timestamp, but issues arise with edge cases like daylight savings. Another option is to use a logical counter. However, this has issues with overflow and with maintaining the counter across a distributed system with multiple machines. There are also hybrid approaches that use a combination of both methods.

![4.jpg](https://images.spumn.eu.cc/blog/92666efe15378a7d.jpg)

![5.jpg](https://images.spumn.eu.cc/blog/9147fef356202b52.jpg)

## Basic Timestamp Ordering (BASIC T/O)

The basic timestamp ordering protocol (BASIC T/O) allows reads and writes on database objects without using locks. Instead, every database object X is tagged with timestamp of the last transaction that successfully performed a read (denoted as $R-TS(X)$) or write (denoted as $W-TS(X)$) on that object. The DBMS then checks these timestamps for every operation. If a transaction tries to access an object in a way which violates the timestamp ordering, the transaction is aborted and restarted. The underlying assumption is that violations will be rare and thus these restarts will also be rare.

![6.jpg](https://images.spumn.eu.cc/blog/3dc774b97ddf5715.jpg)

### Read Operations

For read operations, if $TS(T_i ) &lt; W-TS(X)$, this violates timestamp order of $T_i$ with regard to the previous writer of $X$ (do not want to read something that is written in the “future”). Thus, $T_i$ is aborted and restarted with a new timestamp. Otherwise, the read is valid and $T_i$ is allowed to read $X$. The DBMS then updates $R-TS(X)$ to be the max of $R-TS(X)$ and $TS(T_i )$. It also has to make a local copy of $X$ in a private workspace to ensure repeatable reads for $T_i$ .

![7.jpg](https://images.spumn.eu.cc/blog/e020a97e79e315d7.jpg)

### Write Operations

For write operations, if $TS(T_i ) &lt; R-TS(X)$ or $TS(T_i ) &lt; W-TS(X)$, $T_i$ must be restarted (do not want to overwrite “future” change). Otherwise, the DBMS allows $T_i$ to write $X$ and updates $W-TS(X)$. Again, it needs to make a local copy of $X$ to ensure repeatable reads for $T_i$ .

![8.jpg](https://images.spumn.eu.cc/blog/0426988fee6045ec.jpg)

![9.jpg](https://images.spumn.eu.cc/blog/477c3cac87bb3c53.jpg)

![10.jpg](https://images.spumn.eu.cc/blog/26f147eacf772512.jpg)

![11.jpg](https://images.spumn.eu.cc/blog/3a54a6573fd59bba.jpg)

![12.jpg](https://images.spumn.eu.cc/blog/615454183b7c8227.jpg)

![13.jpg](https://images.spumn.eu.cc/blog/6f2008eff2f27701.jpg)

![14.jpg](https://images.spumn.eu.cc/blog/2a45d4fd3ec957f1.jpg)

![15.jpg](https://images.spumn.eu.cc/blog/613a36c79db677e4.jpg)

![16.jpg](https://images.spumn.eu.cc/blog/b3aede6e3197bf16.jpg)

![17.jpg](https://images.spumn.eu.cc/blog/bbdf2b1baa1619e5.jpg)

![18.jpg](https://images.spumn.eu.cc/blog/32d488416988794b.jpg)

![19.jpg](https://images.spumn.eu.cc/blog/071c96f0d9ebb469.jpg)

![20.jpg](https://images.spumn.eu.cc/blog/939d1a8b84ee6807.jpg)

![21.jpg](https://images.spumn.eu.cc/blog/9577b80898f0c7d2.jpg)

![22.jpg](https://images.spumn.eu.cc/blog/b0bca7795be77c37.jpg)

### Optimization: Thomas Write Rule

An optimization for writes is if $TS(T_i ) &lt; W-TS(X)$, the DBMS can instead ignore the write and allow the transaction to continue instead of aborting and restarting it. This is called the **Thomas Write Rule.**  Note that this violates timestamp order of $T_i$ but this is okay because no other transaction will ever read $T_i$ ’s write to object $X$.

The Basic T/O protocol generates a schedule that is conflict serializable if it does not use Thomas Write Rule. It cannot have deadlocks because no transaction ever waits. However, there is a possibility of starvation for long transactions if short transactions keep causing conflicts.

It also permits schedules that are not recoverable. A schedule is *recoverable* if transactions commit only after all transactions whose changes they read, commit. Otherwise, the DBMS cannot guarantee that transactions read data that will be restored after recovering from a crash.

![23.jpg](https://images.spumn.eu.cc/blog/3b41ea13f02f1804.jpg)

![24.jpg](https://images.spumn.eu.cc/blog/74c28a72f8410204.jpg)

![25.jpg](https://images.spumn.eu.cc/blog/3d69367d611d3271.jpg)

![26.jpg](https://images.spumn.eu.cc/blog/aedfd07f5ce6d5a0.jpg)

![27.jpg](https://images.spumn.eu.cc/blog/1dfd32cb049c8947.jpg)

![28.jpg](https://images.spumn.eu.cc/blog/5648fb8a5a89cfd2.jpg)

### **Potential Issues:**

• High overhead from copying data to transaction’s workspace and from updating timestamps.

• Long running transactions can get starved. The likelihood that a transaction will read something from a newer transaction increases.

• Suffers from the timestamp allocation bottleneck on highly concurrent systems.

![29.jpg](https://images.spumn.eu.cc/blog/939a4675f5cba224.jpg)

![30.jpg](https://images.spumn.eu.cc/blog/5687bee44359e02c.jpg)

## Optimistic Concurrency Control (OCC)

Optimistic concurrency control (OCC) is another optimistic concurrency control protocol which also uses timestamps to validate transactions. OCC works best when the number of conflicts is low. This is when either all of the transactions are read-only or when transactions access disjoint subsets of data. If the database is large and the workload is not skewed, then there is a low probability of conflict, making OCC a good choice.

In OCC, the DBMS creates a *private workspace* for each transaction. All modifications of the transaction are applied to this workspace. Any object read is copied into workspace and any object written is copied to the workspace and modified there. No other transaction can read the changes made by another transaction in its private workspace.

When a transaction commits, the DBMS compares the transaction’s workspace write set to see whether it conflicts with other transactions. If there are no conflicts, the write set is installed into the “global” database.

![31.jpg](https://images.spumn.eu.cc/blog/668e2c2bd0e2f7fb.jpg)

OCC consists of three phases:

1. **Read Phase**: Here, the DBMS tracks the read/write sets of transactions and stores their writes in a private workspace.
2. **Validation Phase:**  When a transaction commits, the DBMS checks whether it conflicts with other transactions.
3. **Write Phase:**  If validation succeeds, the DBMS applies the private workspace changes to the database.

**Otherwise, it aborts and restarts the transaction.**

![32.jpg](https://images.spumn.eu.cc/blog/428381cc0a47f338.jpg)

![33.jpg](https://images.spumn.eu.cc/blog/bab26e96e5bad53a.jpg)

![34.jpg](https://images.spumn.eu.cc/blog/aebc794f159ffc4c.jpg)

![35.jpg](https://images.spumn.eu.cc/blog/4f423bce022cecfc.jpg)

![36.jpg](https://images.spumn.eu.cc/blog/97f880ddb6997659.jpg)

![37.jpg](https://images.spumn.eu.cc/blog/6bc5c2e5f994201d.jpg)

![38.jpg](https://images.spumn.eu.cc/blog/dd064920f28fdea3.jpg)

![39.jpg](https://images.spumn.eu.cc/blog/1c11fe532a9f8b81.jpg)

![40.jpg](https://images.spumn.eu.cc/blog/26377b0e0badc693.jpg)

![41.jpg](https://images.spumn.eu.cc/blog/2dd6dc1345708b20.jpg)

![42.jpg](https://images.spumn.eu.cc/blog/a07b5e31eb817b1b.jpg)

![43.jpg](https://images.spumn.eu.cc/blog/aca245e23d34cc28.jpg)

![44.jpg](https://images.spumn.eu.cc/blog/25e57f0b4174b8c4.jpg)

### Validation Phase

The DBMS assigns transactions timestamps when they enter the validation phase. To ensure only serializable schedules are permitted, the DBMS checks $T_i$ against other transactions for RW and WW conflicts and makes sure that all conflicts go one way.

• **Approach 1**: Backward validation (from younger transactions to older transactions)

• **Approach 2**: Forward validation (from older transactions to younger transactions)

![45.jpg](https://images.spumn.eu.cc/blog/885466cf371265b0.jpg)

![46.jpg](https://images.spumn.eu.cc/blog/b3bcd8790c96ce52.jpg)

![47.jpg](https://images.spumn.eu.cc/blog/cd55f2cb67c39b88.jpg)

![48.jpg](https://images.spumn.eu.cc/blog/4e8428d5abd802e7.jpg)

![49.jpg](https://images.spumn.eu.cc/blog/fa0e8179feb46e58.jpg)

![50.jpg](https://images.spumn.eu.cc/blog/a81a61b893868747.jpg)

Here we describes how forward validation works. The DBMS checks the timestamp ordering of the committing transaction with all other running transactions. Transactions that have not yet entered the validation phase are assigned a timestamp of ∞.

If $TS(T_i ) &lt; TS(T_j )$, then one of the following three conditions must hold:

1. $T_i$ completes all three phases before $T_j$ begins its execution (serial ordering).
2. $T_i$ completes before $T_j$ starts its Write phase, and $T_i$ does not write to any object read by $T_j$ . $WriteSet(T_i ) ∩ ReadSet(T_j ) = ∅$.
3. $T_i$ completes its Read phase before $T_j$ completes its Read phase, and $T_i$ does not write to any object that is either read or written by $T_j$ . $WriteSet(T_i ) ∩ ReadSet(T_j ) = ∅$, and $WriteSet(T_i ) ∩ WriteSet(T_j ) = ∅$.

![51.jpg](https://images.spumn.eu.cc/blog/10abd2824ec3e40a.jpg)

![52.jpg](https://images.spumn.eu.cc/blog/c0522e686c9d7816.jpg)

![53.jpg](https://images.spumn.eu.cc/blog/2eb35712dceaaea0.jpg)

![54.jpg](https://images.spumn.eu.cc/blog/5827a193114302c1.jpg)

![55.jpg](https://images.spumn.eu.cc/blog/3967b0bc0463d28f.jpg)

![56.jpg](https://images.spumn.eu.cc/blog/d0e85246bf0fe70e.jpg)

![57.jpg](https://images.spumn.eu.cc/blog/53b3bf7cbf93d36d.jpg)

![58.jpg](https://images.spumn.eu.cc/blog/9a65897489adbb03.jpg)

![59.jpg](https://images.spumn.eu.cc/blog/314dfc89947fc983.jpg)

![60.jpg](https://images.spumn.eu.cc/blog/9b62a659f6e8e873.jpg)

![61.jpg](https://images.spumn.eu.cc/blog/213f4b2375e259b6.jpg)

![62.jpg](https://images.spumn.eu.cc/blog/4948be7fffb2b561.jpg)

![63.jpg](https://images.spumn.eu.cc/blog/b5fa8a05210d58a9.jpg)

![64.jpg](https://images.spumn.eu.cc/blog/74f82db0eb40213a.jpg)

### Potential Issues:

• High overhead for copying data locally into the transaction’s private workspace.

• Validation/Write phase bottlenecks.

• Aborts are potentially more wasteful than in other protocols because they only occur after a transaction has already executed.

• Suffers from timestamp allocation bottleneck.

![65.jpg](https://images.spumn.eu.cc/blog/6d6e7eebc0087820.jpg)

## Dynamic Databases

![66.jpg](https://images.spumn.eu.cc/blog/2b00e70b7084e4e2.jpg)

![67.jpg](https://images.spumn.eu.cc/blog/c8fc6ef7087566bd.jpg)

![68.jpg](https://images.spumn.eu.cc/blog/c7e375473c04dc7d.jpg)

![69.jpg](https://images.spumn.eu.cc/blog/e86821e8d11f138b.jpg)

![70.jpg](https://images.spumn.eu.cc/blog/6ea2a948f3eee692.jpg)

![71.jpg](https://images.spumn.eu.cc/blog/c486dcb8793c48cd.jpg)

![72.jpg](https://images.spumn.eu.cc/blog/a928a7987870798d.jpg)

![73.jpg](https://images.spumn.eu.cc/blog/af69ab2f1e3583b3.jpg)

![74.jpg](https://images.spumn.eu.cc/blog/b53ecf96d6915869.jpg)

![75.jpg](https://images.spumn.eu.cc/blog/4cb041081c7dd193.jpg)

![76.jpg](https://images.spumn.eu.cc/blog/11a2c3ee86c98e3f.jpg)

![77.jpg](https://images.spumn.eu.cc/blog/ff24bf660059be41.jpg)

![78.jpg](https://images.spumn.eu.cc/blog/196090a7103073b4.jpg)

![79.jpg](https://images.spumn.eu.cc/blog/c8826831dc3148d5.jpg)

![80.jpg](https://images.spumn.eu.cc/blog/7672b497dcddc9c1.jpg)

![81.jpg](https://images.spumn.eu.cc/blog/9801453eb65cc8aa.jpg)

## Isolation Levels

Serializability is useful because it allows programmers to ignore concurrency issues but enforcing it may allow too little parallelism and limit performance. We may want to use a weaker level of consistency to improve scalability.

Isolation levels control the extent that a transaction is exposed to the actions of other concurrent transactions.

![82.jpg](https://images.spumn.eu.cc/blog/4c5fb0276617a567.jpg)

**Anomalies:** 
• **Dirty Read**: Reading uncommitted data.
• **Unrepeatable Reads:**  Redoing a read results in a different result.
• **Phantom Reads**: Insertion or deletions result in different results for the same range scan queries.

**Isolation Levels (Strongest to Weakest):**

1. SERIALIZABLE: No Phantoms, all reads repeatable, and no dirty reads.

2. REPEATABLE READS: Phantoms may happen.

3. READ-COMMITTED: Phantoms and unrepeatable reads may happen.

4. READ-UNCOMMITTED: All anomalies may happen.

![83.jpg](https://images.spumn.eu.cc/blog/98fad58350d5675b.jpg)

![84.jpg](https://images.spumn.eu.cc/blog/2fda8f9c6f516257.jpg)

![85.jpg](https://images.spumn.eu.cc/blog/29d2a1be7b8ab0dc.jpg)

![86.jpg](https://images.spumn.eu.cc/blog/a16416b54fa09f55.jpg)

The isolation levels defined as part of SQL-92 standard only focused on anomalies that can occur in a 2PL-based DBMS. There are two additional isolation levels:

1. CURSOR STABILITY

   • Between repeatable reads and read committed

   • Prevents **Lost Update** Anomaly.

   • Default isolation level in **IBM DB2**.
2. **SNAPSHOT ISOLATION**

   • Guarantees that all reads made in a transaction see a consistent snapshot of the database that existed at the time the transaction started.

   • A transaction will commit only if its writes do not conflict with any concurrent updates made since that snapshot.

   • Susceptible to **write skew** anomaly.

![87.jpg](https://images.spumn.eu.cc/blog/5ac0b77f2910c0dc.jpg)

![88.jpg](https://images.spumn.eu.cc/blog/338c82e3468090ec.jpg)

![89.jpg](https://images.spumn.eu.cc/blog/1952c3211222f6ea.jpg)

![90.jpg](https://images.spumn.eu.cc/blog/1952c3211222f6ea.jpg)

![91.jpg](https://images.spumn.eu.cc/blog/dedb02ff6829374b.jpg)

![92.jpg](https://images.spumn.eu.cc/blog/1dc10046c6adb2ac.jpg)

![93.jpg](https://images.spumn.eu.cc/blog/dfe4eac6b626bdee.jpg)
