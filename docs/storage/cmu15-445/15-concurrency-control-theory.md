# 15 - Concurrency Control Theory

![1.jpg](https://images.spumn.eu.cc/blog/b8dacc033742689b.jpg)

![2.jpg](https://images.spumn.eu.cc/blog/084b4ef9a212de7b.jpg)

# Motivation

- **Lost Update Problem** (**Concurrency Control**): How can we avoid race conditions when updating records at the same time?
- **Durability Problem** (**Recovery**): How can we ensure the correct state in case of a power failure?

![3.jpg](https://images.spumn.eu.cc/blog/09e226b78556f7b3.jpg)

![4.jpg](https://images.spumn.eu.cc/blog/14c1b03da26521a2.jpg)

![5.jpg](https://images.spumn.eu.cc/blog/21a056c4931a21ef.jpg)

# Transactions

A *transaction* is the execution of a sequence of one or more operations (e.g., SQL queries) on a shared database to perform some higher level function. They are the basic unit of change in a DBMS. Partial transactions are not allowed (i.e. transactions must be atomic).

Example: Move $100 from Andy’s bank account to his promotor’s account

1. Check whether Andy has $100.
2. Deduct $100 from his account.
3. Add $100 to his promotor’s account.

Either all of the steps need to be completed or none of them should be completed.

![6.jpg](https://images.spumn.eu.cc/blog/f53fa5f35b18bb49.jpg)

![7.jpg](https://images.spumn.eu.cc/blog/72babe2abfcd027a.jpg)

## The Strawman System

A simple system for handling transactions is to execute one transaction at a time **using a single worker** (e.g. one thread). Thus, only one transaction can be running at a time. To execute the transaction, the DBMS copies the entire database ﬁle and makes the transaction changes to this new ﬁle. If the transaction succeeds, then the new ﬁle becomes the current database ﬁle. If the transaction fails, the DBMS discards the new ﬁle and none of the transaction’s changes have been saved. This method is slow as it does not allow for concurrent transactions and requires copying the whole database ﬁle for every transaction.

A (potentially) better approach is to allow concurrent execution of independent transactions while also maintaining correctness and fairness (as in all transactions are treated with equal priority and don’t get ”starved” by never being executed). But executing concurrent transactions in a DBMS is challenging. It is difﬁcult to ensure correctness (for example, if Andy only has $100 and tries to pay off two promoters at once, who should get paid?) while also executing transactions quickly (our strawman example guarantees sequential correctness, but at the cost of parallelism).

![8.jpg](https://images.spumn.eu.cc/blog/f4b0fd412255344e.jpg)

![9.jpg](https://images.spumn.eu.cc/blog/c509ce24b6129d4a.jpg)

Arbitrary interleaving of operations can lead to:

- **Temporary Inconsistency:**  Unavoidable, but not an issue.
- **Permanent Inconsistency**: Unacceptable, cause problems with correctness and integrity of data.

The scope of a transaction is only inside the database. It cannot make changes to the outside world because it cannot roll those back. For example, if a transaction causes an email to be sent, this cannot be rolled back by the DBMS if the transaction is aborted.

![10.jpg](https://images.spumn.eu.cc/blog/ce765113db328837.jpg)

# Deﬁnitions

Formally, a *database* can be represented as a ﬁxed set of named data objects $(A, B, C, . . .)$. These objects can be attributes, tuples, pages, tables, or even databases. The algorithms that we will discuss work on any type of object but all objects must be of the same type.

![11.jpg](https://images.spumn.eu.cc/blog/aa676982999bcb03.jpg)

A transaction is a sequence of read and write operations (i.e., $R(A)$, $W(B)$) on those objects. To simplify discussion, this deﬁnition assumes the database is a ﬁxed size, so the operations can only be reads and updates, not inserts or deletions.

![12.jpg](https://images.spumn.eu.cc/blog/a8abf65e631969e8.jpg)

The boundaries of transactions are deﬁned by the client. In SQL, a transaction starts with the `BEGIN` command. The outcome of a transaction is either `COMMIT` or `ABORT`. For `COMMIT`, either all of the transaction’s modiﬁcations are saved to the database, or the DBMS overrides this and aborts instead.

For `ABORT`, all of the transaction’s changes are undone so that it is like the transaction never happened. Aborts can be either self-inﬂicted or caused by the DBMS.

![13.jpg](https://images.spumn.eu.cc/blog/e68d27cf080a81b2.jpg)

The criteria used to ensure the correctness of a database is given by the acronym **ACID**.

- **A**tomicity: Atomicity ensures that either all actions in the transaction happen, or none happen.
- **C**onsistency: If each transaction is consistent and the database is consistent at the beginning of the transaction, then the database is guaranteed to be consistent when the transaction completes.
- **I**solation: Isolation means that when a transaction executes, it should have the illusion that it is isolated from other transactions.
- **D**urability: If a transaction commits, then its effects on the database should persist.

![14.jpg](https://images.spumn.eu.cc/blog/02e10c5b10889361.jpg)

![15.jpg](https://images.spumn.eu.cc/blog/6eb8fc627a2e0968.jpg)

# ACID: Atomicity

The DBMS guarantees that transactions are **atomic**. The transaction either executes all its actions or none of them. There are two approaches to this:

![16.jpg](https://images.spumn.eu.cc/blog/eca5279cc5fc1bfc.jpg)

![17.jpg](https://images.spumn.eu.cc/blog/249603f5d3012bb5.jpg)

## Approach #1:# Logging

DBMS logs all actions so that it can undo the actions of aborted transactions. It maintains undo records both in memory and on disk. Logging is used by almost all modern systems for audit and efﬁciency reasons.

![18.jpg](https://images.spumn.eu.cc/blog/2e8376ce57b8236c.jpg)

## Approach #2:# Shadow Paging

The DBMS makes copies of pages modiﬁed by the transactions and transactions make changes to those copies. Only when the transaction commits is the page made visible. This approach is typically slower at runtime than a logging-based DBMS. However, one beneﬁt is, if you are only single threaded, there is no need for logging, so there are less writes to disk when transactions modify the database. This also makes recovery simple, as all you need to do is delete all pages from uncommitted transactions. In general, though, better runtime performance is preferred over better recovery performance, so this is rarely used in practice.

![19.jpg](https://images.spumn.eu.cc/blog/ea57c7f3756bf4fe.jpg)

# ACID: Consistency

At a high level, consisitency means the “world” represented by the database is **logically** correct. All questions (i.e., queries) that the application asks about the data will return logically correct results. There are two notions of consistency:

**Database Consistency**: The database accurately represents the real world entity it is modeling and follows integrity constraints. (E.g. The age of a person cannot not be negative). Additionally, transactions in the future should see the effects of transactions committed in the past inside of the database.

**Transaction Consistency**: If the database is consistent before the transaction starts, it will also be consistent after. Ensuring transaction consistency is the **application’s** responsibility.

![20.jpg](https://images.spumn.eu.cc/blog/e6ba0485afde9e13.jpg)

![21.jpg](https://images.spumn.eu.cc/blog/ef36984dbb6cf75f.jpg)

![22.jpg](https://images.spumn.eu.cc/blog/198e135e703f4166.jpg)

# ACID: Isolation

The DBMS provides transactions the illusion that they are running alone in the system. They do not see the effects of concurrent transactions. This is equivalent to a system where transactions are executed in serial order (i.e., one at a time). But to achieve better performance, the DBMS has to interleave the operations of concurrent transactions while maintaining the illusion of isolation.

![23.jpg](https://images.spumn.eu.cc/blog/3582fa989f6a6f9a.jpg)

## Concurrency Control

A *concurrency control protocol* is how the DBMS decides the proper interleaving of operations from multiple transactions at runtime.

There are two categories of concurrency control protocols:

1. **Pessimistic**: The DBMS assumes that transactions will conﬂict, so it doesn’t let problems arise in the ﬁrst place.
2. **Optimistic**: The DBMS assumes that conﬂicts between transactions are rare, so it chooses to deal with conﬂicts when they happen after the transactions commit.

![24.jpg](https://images.spumn.eu.cc/blog/d99fe34c218ba0e5.jpg)

![25.jpg](https://images.spumn.eu.cc/blog/50f69d76d3920b58.jpg)

![26.jpg](https://images.spumn.eu.cc/blog/113434545d7d2966.jpg)

![27.jpg](https://images.spumn.eu.cc/blog/dbbb8e267a2c0df4.jpg)

![28.jpg](https://images.spumn.eu.cc/blog/4c91eb0fb3510e32.jpg)

![29.jpg](https://images.spumn.eu.cc/blog/215dee9d6af2262d.jpg)

![30.jpg](https://images.spumn.eu.cc/blog/71970eb49d40707e.jpg)

![31.jpg](https://images.spumn.eu.cc/blog/43f2d256a853af46.jpg)

![32.jpg](https://images.spumn.eu.cc/blog/17e6a7eeaeddc7f6.jpg)

![33.jpg](https://images.spumn.eu.cc/blog/12bf443677f3b09d.jpg)

![34.jpg](https://images.spumn.eu.cc/blog/4c7d2fa109b9e663.jpg)

![35.jpg](https://images.spumn.eu.cc/blog/b68b334e123f1025.jpg)

The order in which the DBMS executes operations is called an *execution schedule*. We want to interleave transactions to maximize concurrency while ensuring that the output is “correct”. The goal of a concurrency control protocol is to generate an execution schedule that is is **equivalent to some serial execution**:

- **Serial Schedule**: Schedule that does not interleave the actions of different transactions.
- **Equivalent Schedules**: For any database state, if the effect of execution the ﬁrst schedule is identical to the effect of executing the second schedule, the two schedules are equivalent.
- **Serializable Schedule**: A serializable schedule is a schedule that is equivalent to any serial execution of the transactions. Different serial executions can produce different results, but all are considered “correct”.

![36.jpg](https://images.spumn.eu.cc/blog/fb02475c9492365f.jpg)

![37.jpg](https://images.spumn.eu.cc/blog/9354902112f4c80c.jpg)

A *conﬂict* between two operations occurs if the operations are for different transactions, they are performed on the same object, and at least one of the operations is a write. There are three variations of conﬂicts:

- **Write-Read Conﬂicts** (“**Dirty Reads**”): A transaction sees the write effects of a different transaction before that transaction committed its changes.
- **Read-Write Conﬂicts** (“**Unrepeatable Reads**”): A transaction is not able to get the same value when reading the same object multiple times.
- **Write-Write conﬂict** (“**Lost Updates**”): One transaction overwrites the uncommitted data of another concurrent transaction.

There are two types for serializability: (1) *conﬂict* and (2) *view*. Neither deﬁnition allows all schedules that one would consider serializable. In practice, DBMSs support conﬂict serializability because it can be enforced efﬁciently.

![38.jpg](https://images.spumn.eu.cc/blog/4fd21277ef5f7dda.jpg)

![39.jpg](https://images.spumn.eu.cc/blog/15f9668ab6f8a419.jpg)

![40.jpg](https://images.spumn.eu.cc/blog/2a379884a8b6a5ca.jpg)

![41.jpg](https://images.spumn.eu.cc/blog/6213964945c20230.jpg)

![42.jpg](https://images.spumn.eu.cc/blog/aa96eab2d0b6f64a.jpg)

## Conﬂict Serializability

Two schedules are ***conﬂict equivalent*** iff they involve the same operations of the same transactions and every pair of conﬂicting operations is ordered in the same way in both schedules. A schedule $S$ is ***conﬂict serializable*** if it is conﬂict equivalent to some **serial schedule**.

One can verify that a schedule is conﬂict serializable by swapping non-conﬂicting operations until a serial schedule is formed. For schedules with many transactions, this becomes too expensive. A better way to verify schedules is to use a *dependency graph* (*precedence graph*).

![43.jpg](https://images.spumn.eu.cc/blog/78074ba68df17712.jpg)

![44.jpg](https://images.spumn.eu.cc/blog/756fca8d7aa2c15a.jpg)

![45.jpg](https://images.spumn.eu.cc/blog/e50a3bbf066cacda.jpg)

![46.jpg](https://images.spumn.eu.cc/blog/91c37bcc0a5ee9e2.jpg)

![47.jpg](https://images.spumn.eu.cc/blog/89c06fc1952f6930.jpg)

![48.jpg](https://images.spumn.eu.cc/blog/78703e0648cf4bf5.jpg)

![49.jpg](https://images.spumn.eu.cc/blog/9f3bfec589e2c274.jpg)

![50.jpg](https://images.spumn.eu.cc/blog/9de8cc06650f92ea.jpg)

In a dependency graph, each transaction is a node in the graph. There exists a directed edge from node $T_i$  to $T_j$ iff an operation $O_i$ from $T_i$ conﬂicts with an operation $O_j$ from $T_j$ and $O_i$ occurs before $O_j$ in the schedule. Then, a schedule is conﬂict serializable iff the dependency graph is acyclic.

![51.jpg](https://images.spumn.eu.cc/blog/4817cbbf381a1f9f.jpg)

![52.jpg](https://images.spumn.eu.cc/blog/81e4640003049db7.jpg)

![53.jpg](https://images.spumn.eu.cc/blog/11e72c921fa565ee.jpg)

![54.jpg](https://images.spumn.eu.cc/blog/714713805f1223c1.jpg)

![55.jpg](https://images.spumn.eu.cc/blog/632d1e716a6e7848.jpg)

![56.jpg](https://images.spumn.eu.cc/blog/61598f7765165f38.jpg)

![57.jpg](https://images.spumn.eu.cc/blog/1bcb169b17260cee.jpg)

![58.jpg](https://images.spumn.eu.cc/blog/61d31fc61ef55221.jpg)

![59.jpg](https://images.spumn.eu.cc/blog/2fcbb3c7b19b721a.jpg)

![60.jpg](https://images.spumn.eu.cc/blog/64deb29c5b56547d.jpg)

![61.jpg](https://images.spumn.eu.cc/blog/7029e92200c8077c.jpg)

![62.jpg](https://images.spumn.eu.cc/blog/680fff02be3b916d.jpg)

![63.jpg](https://images.spumn.eu.cc/blog/a39fecea48860563.jpg)

## View Serializability

*View serializability* is a weaker notion of serializibility that allows for all schedules that are conﬂict serializable and “**blind writes**” (i.e. performing writes without reading the value ﬁrst). Thus, it allows for more schedules than conﬂict serializability, but is difﬁcult to enforce efﬁciently. This is because the DBMS does not know how the application will “interpret” values.

![64.jpg](https://images.spumn.eu.cc/blog/aafd09cf3f9873b5.jpg)

![65.jpg](https://images.spumn.eu.cc/blog/640381e30cd50b6f.jpg)

![66.jpg](https://images.spumn.eu.cc/blog/efd9ef22129bf21e.jpg)

![67.jpg](https://images.spumn.eu.cc/blog/4e8887f266dbae5a.jpg)

![68.jpg](https://images.spumn.eu.cc/blog/a7aace82f4e749a3.jpg)

## Universe of Schedules

$SerialSchedules ⊂ ConflictSerializableSchedules ⊂ V iewSerializableSchedules ⊂ AllSchedules$

![69.jpg](https://images.spumn.eu.cc/blog/2c6ef1b8a5902160.jpg)

# ACID: Durability

All of the changes of committed transactions must be **durable** (i.e., persistent) after a crash or restart. The DBMS can either use logging or shadow paging to ensure that all changes are durable.

![70.jpg](https://images.spumn.eu.cc/blog/e87bfb1476fbc47a.jpg)

![71.jpg](https://images.spumn.eu.cc/blog/f85c813492cc3264.jpg)

![72.jpg](https://images.spumn.eu.cc/blog/98b7ab69ef24a938.jpg)

![73.jpg](https://images.spumn.eu.cc/blog/cae019bc04a78f6e.jpg)

![74.jpg](https://images.spumn.eu.cc/blog/712e9cc9786f30f6.jpg)

![75.jpg](https://images.spumn.eu.cc/blog/5425e62b95794cc0.jpg)

![76.jpg](https://images.spumn.eu.cc/blog/a96bd47caad2198a.jpg)

![77.jpg](https://images.spumn.eu.cc/blog/3538454fa4d6f315.jpg)

![78.jpg](https://images.spumn.eu.cc/blog/fe918b2a1bef0dd4.jpg)

![79.jpg](https://images.spumn.eu.cc/blog/6d08cd46b4883785.jpg)

![80.jpg](https://images.spumn.eu.cc/blog/8e6f3deb70eb7ca3.jpg)
