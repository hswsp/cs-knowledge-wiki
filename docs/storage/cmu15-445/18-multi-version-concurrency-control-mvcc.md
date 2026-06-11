# 18 - Multi-Version Concurrency Control MVCC

![1.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720225946-bbe043a5-f2ad-42fe-9b42-143445367cf2.jpeg#averageHue=%231d2635&clientId=uc3fb2d5e-e0b4-4&from=ui&id=ue5f9e5c3&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=607874&status=done&style=none&taskId=uf5f060bc-365e-4743-91df-f9fced5eb0e&title=)

# Multi-Version Concurrency Control

Multi-Version Concurrency Control (MVCC) is a larger concept than just a concurrency control protocol. It involves all aspects of the DBMS’s design and implementation. MVCC is the most widely used scheme in DBMSs. It is now used in almost every new DBMS implemented in last 10 years. Even some systems (e.g., NoSQL) that do not support multi-statement transactions use it.

![2.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720225413-dac1d63d-66a4-4c6e-8ddd-985c977ba2cf.jpeg#averageHue=%23ebebeb&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u5293527c&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=312043&status=done&style=none&taskId=ub4415c35-ad8c-4e17-a4c8-88569c9030e&title=)

With MVCC, the DBMS maintains multiple physical versions of a single logical object in the database. When a transaction writes to an object, the DBMS creates a new version of that object. When a transaction reads an object, it reads the newest version that existed when the transaction started.
The fundamental concept/benefit of MVCC is that writers do not block writers and readers do not block readers. This means that one transaction can modify an object while other transactions read old versions.

![3.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720225547-e5aa6a70-e1df-479c-b0d4-38dce899509d.jpeg#averageHue=%23eceaea&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u608f6498&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=385779&status=done&style=none&taskId=uedf9cae2-c928-4751-a3a0-19bf78db60d&title=)

- [Jim Starkey](https://en.wikipedia.org/wiki/Jim_Starkey)
- [Oracle Rdb](https://dbdb.io/db/rdbvms)
- [interbase](https://www.embarcadero.com/products/interbase)
- [Firebird](https://firebirdsql.org/)

One advantage of using MVCC is that read-only transactions can read a consistent snapshot of the database without using locks of any kind. Additionally, multi-versioned DBMSs can easily support time-travel queries, which are queries based on the state of the database at some other point in time (e.g. performing a query on the database as it was 3 hours ago).

![4.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720225323-91489f6e-df36-4741-bab8-65f7574a0abb.jpeg#averageHue=%23ebebeb&clientId=uc3fb2d5e-e0b4-4&from=ui&id=ufb1b31e6&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=298046&status=done&style=none&taskId=u62db1ce9-e3bd-4bd8-8d13-03ad481b286&title=)

There are four important MVCC design decisions:

1. **Concurrency Control Protocol**
2. **Version Storage**
3. **Garbage Collection**
4. **Index Management**

The choice of concurrency protocol is between the approaches discussed in previous lectures (two-phase locking, timestamp ordering, optimistic concurrency control).

![5.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720225126-55d90f8c-1ef0-44b1-bdd0-27831bb31192.jpeg#averageHue=%23ecebeb&clientId=uc3fb2d5e-e0b4-4&from=ui&id=uc69c45c2&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=290733&status=done&style=none&taskId=uf47f295d-cc52-4425-9beb-b6559b5c182&title=)

![6.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720227649-f64796a2-3afa-4367-b5a9-44d51bea0195.jpeg#averageHue=%23ebeaea&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u06966b43&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=329561&status=done&style=none&taskId=uc5c39a7c-d750-4cb7-9a5a-155fc86c8a4&title=)

![7.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720228321-118849a6-6fed-4b2c-b6f9-02788fae4815.jpeg#averageHue=%23e5e5e5&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u33c8a485&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=388634&status=done&style=none&taskId=uf0700bd4-a0b9-4e16-8add-5772f863020&title=)

![8.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720228447-d81cfe38-2cda-4295-8df0-7b48b1d49eb8.jpeg#averageHue=%23e6e6e6&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u03120212&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=373668&status=done&style=none&taskId=uc2da2cfb-5d48-4c9e-8482-ff995377938&title=)

![9.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720228748-bc8f4c23-78e5-47fe-9f37-b9c50c2ebd2e.jpeg#averageHue=%23e6e6e6&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u4444fc21&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=346999&status=done&style=none&taskId=ud65a71e6-ce7f-4cd1-a71e-8dce3afbe62&title=)

![10.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720228780-136df465-a971-4f69-a849-b2fccd1ccf57.jpeg#averageHue=%23e6e6e6&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u87058b7c&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=353989&status=done&style=none&taskId=u69bc5f14-e3ff-4f1c-8c02-7a064857d53&title=)

![11.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720229636-c7c7ad6c-7b38-42b8-ae88-937535964d31.jpeg#averageHue=%23e6e6e6&clientId=uc3fb2d5e-e0b4-4&from=ui&id=ud1ead0b0&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=352023&status=done&style=none&taskId=u13ffc970-3fb0-470b-9b64-24afe30447e&title=)

![12.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720230919-fbba485a-2d4e-42c4-aa33-28ac0b3eede2.jpeg#averageHue=%23e7e6e6&clientId=uc3fb2d5e-e0b4-4&from=ui&id=ud4267d48&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=405867&status=done&style=none&taskId=uf8941fba-e592-4ec8-a365-2e7b8da38a6&title=)

![13.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720231096-efc863b9-ea90-4a4a-8991-61da08dadb94.jpeg#averageHue=%23e6e5e5&clientId=uc3fb2d5e-e0b4-4&from=ui&id=uf9dca409&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=391183&status=done&style=none&taskId=ub4ed010c-7c46-4aba-9d58-7f57a88a2ee&title=)

![14.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720231481-cd0e5248-c9a3-4ee1-ad09-cd326c1f1d69.jpeg#averageHue=%23e5e5e5&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u2c9fe1cf&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=402497&status=done&style=none&taskId=u922199de-541b-44a2-97c9-4c700d4ebdb&title=)

![15.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720231575-928b78bb-711b-478b-8153-866f8959289a.jpeg#averageHue=%23e6e6e6&clientId=uc3fb2d5e-e0b4-4&from=ui&id=ue07421ba&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=371039&status=done&style=none&taskId=u7129dc28-1d43-4fb4-9485-dd1f4a49b37&title=)

![16.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720231947-e0f2d998-ec6f-4663-9224-26ad8ea22aca.jpeg#averageHue=%23e5e5e5&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u9a2ed982&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=401440&status=done&style=none&taskId=u242a3b5f-19e2-4257-b0bf-d829832382b&title=)

# Snapshot Isolation

Snapshot Isolation involves providing a transaction with a consistent snapshot of the database when the transaction started. Data values from a snapshot consist of only values from committed transactions, and the transaction operates in complete isolation from other transactions until it finishes. This is idea for read-only transactions since they do not need to wait for writes from other transactions. Writes are maintained in a transaction’s private workspace and only become visible to the database once the transaction successfully commits. If two transactions update the same object, the first writer wins.

> “撕裂写” torn writes。译注：就是一个非完整的读写

![17.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720233033-5b50ac64-2df8-41cb-a54d-b4f8152eebf4.jpeg#averageHue=%23ececec&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u69cf981a&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=298066&status=done&style=none&taskId=ucd748ef9-da59-4b17-8a0c-1a90f1b4e25&title=)

**Write Skew Anomaly** can occur in Snapshot Isolation when two concurrent transactions modify different objects resulting in race conditions.

![18.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720233382-02847f9c-3f9a-4c2a-b22e-7970d0953369.jpeg#averageHue=%23ebebeb&clientId=uc3fb2d5e-e0b4-4&from=ui&id=ud6a0e94e&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=255676&status=done&style=none&taskId=u40924ea1-525c-4266-af1e-7af2c555f32&title=)

![19.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720233664-cfa3e7d7-d542-4524-aaa0-956e38c43f35.jpeg#averageHue=%23ebebeb&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u15d4ff09&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=255995&status=done&style=none&taskId=u42756f6f-a826-4653-828c-a36ccf51193&title=)

![20.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720233817-fa57cf56-2774-4aa6-99f4-25344e553e91.jpeg#averageHue=%23eae9e9&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u43e2a8bf&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=280900&status=done&style=none&taskId=u90a019c7-d8fe-4b5e-a57c-44152c491e4&title=)

![21.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720233972-aa732ea5-8cb3-4230-a2f5-4d5f0626f9dc.jpeg#averageHue=%23ebebeb&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u29379822&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=239153&status=done&style=none&taskId=uafba9fa7-aa84-4d26-b0a5-57d063056ba&title=)

![22.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720236352-af8d60f8-b1c1-4932-92d9-0a53a5bb453a.jpeg#averageHue=%23e9e6e5&clientId=uc3fb2d5e-e0b4-4&from=ui&id=uc31aa59a&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=596285&status=done&style=none&taskId=ubacbd035-390c-4b27-bc5a-21e3b6f39b8&title=)

![23.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720235052-2fa0390f-25c5-4b4f-a8d8-92fadc569044.jpeg#averageHue=%23eeeeee&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u359b6e5a&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=210389&status=done&style=none&taskId=u77895af2-d76a-45c1-a24f-961708940bd&title=)

![24.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720236302-cfc000f1-f88c-4c63-a318-1ff3794c4b63.jpeg#averageHue=%23e9e9e9&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u323ad047&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=370608&status=done&style=none&taskId=ua8794ed9-db94-4607-b294-003fe69595c&title=)

# Version Storage

This how the DBMS will store the different physical versions of a logical object and how transactions find the newest version visible to them.

The DBMS uses the tuple’s pointer field to create a **version chain** per logical tuple, which is essentially a linked list of versions sorted by timestamp. This allows the DBMS to find the version that is visible to a particular transaction at runtime. Indexes always point to the “head” of the chain, which is either the newest or oldest version depending on implementation. A thread traverses chain until it finds the correct version. Different storage schemes determine where/what to store for each version.

![25.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720236341-39a6439f-a685-4ef6-9f65-e170dc1dc499.jpeg#averageHue=%23ececec&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u1a754dd8&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=317062&status=done&style=none&taskId=ucad7c724-a095-4f90-a243-cf505b55057&title=)

## Approach #1:# Append-Only Storage

All physical versions of a logical tuple are stored in the same table space. Versions are mixed together in the table and each update just appends a new version of the tuple into the table and updates the **version chain**. The chain can either be sorted *oldest-to-newest* (O2N) which requires chain traversal on look-ups, or *newest-to-oldest* (N2O), which requires updating index pointers for every new version.

## Approach #2:# Time-Travel Storage

The DBMS maintains a separate table called the time-travel table which stores older versions of tuples. On every update, the DBMS copies the old version of the tuple to the time-travel table and overwrites the tuple in the main table with the new data. Pointers of tuples in the main table point to past versions in the time-travel table.

## Approach #3:# Delta Storage

Like time-travel storage, but **instead of the entire past tuples**, the DBMS only stores the deltas, or changes between tuples in what is known as the delta storage segment. Transactions can then recreate older versions by iterating through the deltas. This results in faster writes than time-travel storage but slower reads.

![26.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720236408-3d14312c-1884-4d16-a8e6-2bc72b74f0b7.jpeg#averageHue=%23ebebeb&clientId=uc3fb2d5e-e0b4-4&from=ui&id=uc5fd50be&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=319068&status=done&style=none&taskId=u208f87aa-7ecd-4a7c-b094-0e26f5c18ed&title=)

![27.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720237178-90b6c742-c868-4cb8-bca5-91134caedb23.jpeg#averageHue=%23eae9e9&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u9c3b9aac&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=342783&status=done&style=none&taskId=u06a734f3-fab0-42f9-85e4-ccf79d60345&title=)

![28.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720239802-796a3756-38c5-403f-9f54-eac99c835bbb.jpeg#averageHue=%23e8e8e8&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u832aaec1&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=349862&status=done&style=none&taskId=ufc0a0d9c-6e0d-46d6-9f60-0b842e59af9&title=)

![29.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720239897-603e0bc1-0d8e-48ce-aa57-08b8c0eb5a3f.jpeg#averageHue=%23e9e8e8&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u69a4a83d&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=352936&status=done&style=none&taskId=u701af6ec-5e5e-4cdc-b170-00794e5f2a4&title=)

![30.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720239929-5298c1cd-3d06-4d2f-9867-2d2d15fd7920.jpeg#averageHue=%23ececec&clientId=uc3fb2d5e-e0b4-4&from=ui&id=uf47f4ce3&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=295036&status=done&style=none&taskId=ued0e5909-902a-4294-8092-2f337f0f7a3&title=)

![31.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720240159-fab9a3d5-f601-4b8b-bf6e-cfe88421503d.jpeg#averageHue=%23e6e5e5&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u8504ca1f&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=299975&status=done&style=none&taskId=uecf904ef-d447-44b8-92a6-6f947da408f&title=)

![32.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720240216-bb99edf6-ee6a-46ec-90c5-98e8b54463e7.jpeg#averageHue=%23e6e5e5&clientId=uc3fb2d5e-e0b4-4&from=ui&id=ue0d6ada4&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=308683&status=done&style=none&taskId=u16e9a7a0-bff0-4753-8cff-4b00a76c21c&title=)

![33.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720243713-faa8b117-7197-4121-9fa9-2c5bef0492c2.jpeg#averageHue=%23e5e4e4&clientId=uc3fb2d5e-e0b4-4&from=ui&id=ud3518f44&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=353014&status=done&style=none&taskId=u5a33adc1-f909-4f31-8cf4-6110abc4af0&title=)

![34.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720243922-cb03d66f-12a0-40c1-bfef-4a7a2c83e20d.jpeg#averageHue=%23e5e5e5&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u932bcf71&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=353639&status=done&style=none&taskId=u16438fc7-4ace-42be-9166-860d5383872&title=)

![35.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720243949-de4164ee-8a81-4b0e-b6e8-599ee3dc484a.jpeg#averageHue=%23e6e5e5&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u7d69090a&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=353943&status=done&style=none&taskId=u7b81be9e-690e-499d-a48c-ce7d6dc4c4c&title=)

![36.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720243851-a5525113-721c-4240-8e88-50f70efacf82.jpeg#averageHue=%23e7e6e6&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u49e4860f&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=315002&status=done&style=none&taskId=u54838842-538b-430e-a421-153e3c4c0ce&title=)

![37.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720243897-c2cd6e53-242b-4814-bb9a-302bf73abd13.jpeg#averageHue=%23e7e6e6&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u406174c8&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=322668&status=done&style=none&taskId=u7e68b4ba-47c7-466d-9238-6df5db29413&title=)

![38.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720246998-68314ce8-eb17-49e7-8b2a-9716c137b071.jpeg#averageHue=%23e7e7e6&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u95149977&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=344284&status=done&style=none&taskId=u8260c26f-b09d-4cdf-857f-1d72c7b94bc&title=)

![39.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720247403-9c5693b1-79a3-4265-b82b-761ebd5fccc6.jpeg#averageHue=%23e6e5e5&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u200451ca&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=391456&status=done&style=none&taskId=u8b02a9a3-c28c-401e-b3db-d51eb4a7c35&title=)

# Garbage Collection

The DBMS needs to remove *reclaimable* physical versions from the database over time. A version is reclaimable if no active transaction can “see” that version or if it was created by a transaction that was aborted.

![40.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720247777-cbc17390-5a92-4c91-9147-a4cac0adf4df.jpeg#averageHue=%23ecebeb&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u75b0a9ca&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=358231&status=done&style=none&taskId=ucc1289e8-eb04-4415-85cf-6985ee5acf3&title=)

## Approach #1:# Tuple-level GC

With tuple-level garbage collection, the DBMS finds old versions by examining tuples directly. There are two approaches to achieve this:

- **Background Vacuuming:**  Separate threads periodically scan the table and look for reclaimable versions. This works with any version storage scheme. A simple optimization is to maintain a “dirty page bitmap,” which keeps track of which pages have been modified since the last scan. This allows the threads to skip pages which have not changed.
- **Cooperative Cleaning:**  Worker threads identify reclaimable versions as they traverse version chain. This only works with O2N chains.

![41.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720247510-51f1210d-525d-4e59-b9b0-8aeea1217f8c.jpeg#averageHue=%23ececec&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u8282364e&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=299543&status=done&style=none&taskId=u871d2abe-7456-458f-ae46-9026521ed2f&title=)

![42.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720247813-aee1cf62-c066-4742-a612-509f92fc163d.jpeg#averageHue=%23e9e9e8&clientId=uc3fb2d5e-e0b4-4&from=ui&id=ubc7d6060&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=332443&status=done&style=none&taskId=uaebd1293-e190-43fd-9074-da7d14a45b0&title=)

![43.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720249289-07145dd3-e57a-40ab-a5cd-3e9f8daced6b.jpeg#averageHue=%23e8e7e7&clientId=uc3fb2d5e-e0b4-4&from=ui&id=ucc7d486f&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=332322&status=done&style=none&taskId=u9b3ee6bd-2d30-4e50-b81a-5312de1a5ea&title=)

![44.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720249774-7ff73d5b-8b5e-46bd-9c71-ddac8852aec7.jpeg#averageHue=%23e9e9e9&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u8994b8e7&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=325020&status=done&style=none&taskId=u244bc3de-2444-4b5d-aea0-b49e95bf857&title=)

![45.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720250500-42d8c069-97c5-4214-831c-d3d9a17c8663.jpeg#averageHue=%23e8e8e8&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u11546818&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=341603&status=done&style=none&taskId=uc6d79d92-22c9-4d11-9177-7847fafeaa7&title=)

![46.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720250737-6205b0da-1b6e-4621-ac19-b8d40e770391.jpeg#averageHue=%23e9e8e8&clientId=uc3fb2d5e-e0b4-4&from=ui&id=uf59e7437&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=343078&status=done&style=none&taskId=u8c04bb83-156e-4ff4-bf77-2a2f0c7f71b&title=)

![47.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720251485-bb5acb2a-3346-43d0-be5d-e16b27058e33.jpeg#averageHue=%23e5e5e5&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u2288b9e4&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=405844&status=done&style=none&taskId=ub7ff7872-f8b8-49ff-8f4c-11179f86c15&title=)

![48.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720253440-2dbfed8f-75da-43ad-9609-dd7db134f3f9.jpeg#averageHue=%23e5e4e4&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u988d1792&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=407852&status=done&style=none&taskId=uf2c9e1b7-c014-4340-a63f-b9da68d7bb8&title=)

![49.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720253753-ef148d29-d45f-4203-b8c9-e38592928572.jpeg#averageHue=%23e4e4e4&clientId=uc3fb2d5e-e0b4-4&from=ui&id=ucea2e815&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=409089&status=done&style=none&taskId=ub3ca7062-e581-4a71-b7dc-0fdf0e98053&title=)

![50.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720254249-1d96d510-70f5-4947-a0a7-fb9810785cad.jpeg#averageHue=%23e5e5e5&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u98398f9e&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=398965&status=done&style=none&taskId=u6ca170b8-a1ab-4553-ae67-52e6bd3d1bf&title=)

## Approach #2:# Transaction-level GC

Under transaction-level garbage collection, each transaction is responsible for keeping track of their own old versions so the DBMS does not have to scan tuples. Each transaction maintains its own read/write set. When a transaction completes, the garbage collector can use that to identify which tuples to reclaim. The DBMS determines when all versions created by a finished transaction are no longer visible.

![51.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720253790-3cb1ec98-aa79-4629-a047-851d066b9512.jpeg#averageHue=%23ececec&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u3c985723&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=295566&status=done&style=none&taskId=ua1427fe5-7274-4762-a209-1dfff17e898&title=)

![52.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720254135-884f8395-656e-4384-9b86-7090fa9d1a9b.jpeg#averageHue=%23eae9e9&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u2d631962&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=225651&status=done&style=none&taskId=u674d748f-fa14-47d6-a4b5-89f402066d2&title=)

![53.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720255130-eab40138-5d48-4fec-bcab-2734405f6de3.jpeg#averageHue=%23e9e9e9&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u2f315f93&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=231482&status=done&style=none&taskId=u19b722ba-f8ea-4fdc-b859-b3c101b5fdf&title=)

![54.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720255787-5ffe5346-2299-4695-90ed-6215d5678d83.jpeg#averageHue=%23e7e6e6&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u9cec2ee3&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=251116&status=done&style=none&taskId=udbc4a8f8-489f-43cc-9103-c56e80fdba6&title=)

![55.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720256064-dc6aa529-5239-4443-92b1-d0205e41f5a8.jpeg#averageHue=%23e5e5e5&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u7288405b&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=251924&status=done&style=none&taskId=u4cac7e77-4075-4aaf-9f5f-2220a54a8e6&title=)

![56.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720256348-bf12c13f-3b6e-4eb6-9232-eb68d8093a17.jpeg#averageHue=%23e5e5e5&clientId=uc3fb2d5e-e0b4-4&from=ui&id=uf306aabf&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=258254&status=done&style=none&taskId=u66eaacea-ee1d-462c-94ae-a2f79ec951b&title=)

![57.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720256497-8cea707f-b4db-4517-867b-72a0ac508ab9.jpeg#averageHue=%23e6e6e6&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u08bc7fb0&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=270218&status=done&style=none&taskId=u243d959e-309d-4a4f-afd4-8ac943c4105&title=)

![58.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720257176-7e32c50d-853a-4793-b62a-f9791aee36c5.jpeg#averageHue=%23e6e6e6&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u7d377574&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=268207&status=done&style=none&taskId=u72391546-0589-40bb-8c9c-49b3cc54c8a&title=)

![59.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720258130-86b903f6-0e69-48dc-9239-05627729f769.jpeg#averageHue=%23e3e2e2&clientId=uc3fb2d5e-e0b4-4&from=ui&id=udcae5c7c&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=297867&status=done&style=none&taskId=uff0dd918-148a-4c7f-91f9-75fb8aedc14&title=)

# Index Management

All primary key (pkey) indexes always point to version chain head. How often the DBMS has to update the pkey index depends on whether the system creates new versions when a tuple is updated. If a transaction updates a pkey attribute(s), then this is treated as a `DELETE` followed by an `INSERT`.
Managing secondary indexes is more complicated. There are two approaches to handling them.

![60.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720258565-77b2b91e-a0b4-4b96-bd09-d7b7814bb3fb.jpeg#averageHue=%23ececec&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u6e3482a0&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=325686&status=done&style=none&taskId=u6d772261-2b79-442a-8e00-be99accbab6&title=)

![61.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720258738-008c6e7f-5ca3-49a1-bebe-3d015834021f.jpeg#averageHue=%23dfdfdf&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u6a0945cd&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=276827&status=done&style=none&taskId=u5713bf40-353c-41cf-a52e-48b088b326b&title=)

![62.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720259097-1d4f47fa-f5ec-4498-ae9c-3c8194705fd3.jpeg#averageHue=%23ededed&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u8eda9480&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=277951&status=done&style=none&taskId=u400d33b7-390e-42c2-9394-5fd4518c219&title=)

## Approach #1:# Logical Pointers

The DBMS uses a fixed identifier per tuple that does not change. This requires an extra indirection layer that maps the logical id to the physical location of the tuple. Then, updates to tuples can just update the mapping in the indirection layer.

## Approach #2:# Physical Pointers

The DBMS uses the physical address to the version chain head. This requires updating every index when the version chain head is updated.

![63.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720259134-66082bf0-bae1-4bb8-99b9-5c81caf9c527.jpeg#averageHue=%23e6e6e6&clientId=uc3fb2d5e-e0b4-4&from=ui&id=ub0b20a47&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=262632&status=done&style=none&taskId=u169400b5-f5b0-45ae-a411-221121b45fa&title=)

![64.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720260122-c9da7487-f9b2-4d9f-8b02-dae917f5bdf0.jpeg#averageHue=%23e6e6e6&clientId=uc3fb2d5e-e0b4-4&from=ui&id=ud2c2fd3d&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=267032&status=done&style=none&taskId=u450ada31-664e-436b-a5e0-f3dc3450bae&title=)

![65.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720261312-19b0da79-2973-40c8-bc2f-1d28b169fa0f.jpeg#averageHue=%23d9d9d9&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u96bcd78f&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=357346&status=done&style=none&taskId=u618bcff6-dc02-4d57-a03e-2a641dc8728&title=)

![66.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720261209-75258f38-07ed-4234-ad75-193eaa6ac7d9.jpeg#averageHue=%23e6e5e5&clientId=uc3fb2d5e-e0b4-4&from=ui&id=ue0b941e2&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=280993&status=done&style=none&taskId=u22ff21dc-5a10-4c0a-9562-1b12b240599&title=)

![67.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720261414-b04573e8-9ac7-44ac-a505-cf1d284cb51f.jpeg#averageHue=%23e2e2e2&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u0151c272&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=297276&status=done&style=none&taskId=u9ad3154e-1601-4053-ac2a-d32b4e9097f&title=)

![68.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720261728-cbf09dc5-26ae-49cb-be7a-ae9446d65b19.jpeg#averageHue=%23ececec&clientId=uc3fb2d5e-e0b4-4&from=ui&id=uaea56298&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=316275&status=done&style=none&taskId=ub0613579-8f14-4055-ab9e-39bc35b27eb&title=)

![69.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720262036-5410abe6-f43b-4b53-884f-a9ae2ba4dd06.jpeg#averageHue=%23e9e8e8&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u8c8c52c6&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=255650&status=done&style=none&taskId=ud13185da-19ff-4f87-8319-4ae23ded1c5&title=)

![70.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720263306-ff692756-1fd9-497b-b700-cf929d22c846.jpeg#averageHue=%23e7e6e6&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u26260a54&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=288048&status=done&style=none&taskId=u57d0899f-4318-4ca1-bd27-e5881f26db2&title=)

![71.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720263570-8f084cc2-c333-4b4a-ae39-2921fb9a2953.jpeg#averageHue=%23e4e3e3&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u195f2e6a&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=299456&status=done&style=none&taskId=u4a9a4ba5-0264-4caa-ad11-69a8516af9f&title=)

![72.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720263676-14231124-a407-430a-b3c1-30d2e6d94ca8.jpeg#averageHue=%23e4e3e3&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u68f46fee&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=307844&status=done&style=none&taskId=u79649cac-0222-43ae-b29d-c19cfe7ec02&title=)

![73.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720264339-7359a6cc-22d5-4697-9af5-18f2597baaa7.jpeg#averageHue=%23e1e0e0&clientId=uc3fb2d5e-e0b4-4&from=ui&id=uddb1f506&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=347831&status=done&style=none&taskId=u7d87c704-fe4c-46e3-afc6-a75cf320920&title=)

![74.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720264375-4691366c-6735-45cd-9bba-cba13e229316.jpeg#averageHue=%23dfdede&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u8d98d50d&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=358081&status=done&style=none&taskId=u0288c571-e8aa-4974-aafb-44f17559a66&title=)

![75.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720265783-f5dd66e7-5c16-4797-8957-a20b5f734f8f.jpeg#averageHue=%23ebebeb&clientId=uc3fb2d5e-e0b4-4&from=ui&id=ufe119b98&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=369621&status=done&style=none&taskId=u34d8692e-11fc-455b-b412-a653891cd10&title=)

![76.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720265795-80e6590c-cc93-44b3-982c-ecfb920b0f2a.jpeg#averageHue=%23ebebeb&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u9a0ee9b0&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=343062&status=done&style=none&taskId=uf23be903-e91b-4e86-8769-a18de29c4fe&title=)

![77.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720266249-9b1f991d-ddd6-4bac-bf4e-02e87e4a85f8.jpeg#averageHue=%23ebebeb&clientId=uc3fb2d5e-e0b4-4&from=ui&id=udc3147ec&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=367191&status=done&style=none&taskId=udf9306c3-59eb-43b9-9b40-c345fd86f78&title=)

![78.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720266937-421e1b2e-866e-4705-8fb6-41b863d33b6d.jpeg#averageHue=%23eeecec&clientId=uc3fb2d5e-e0b4-4&from=ui&id=uf5cd7e05&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=455413&status=done&style=none&taskId=ufbbea735-8d5e-4e42-b1c1-0084101719c&title=)

![79.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720266502-1b887b3e-4c36-4b11-b748-92051bbc894c.jpeg#averageHue=%23efefef&clientId=uc3fb2d5e-e0b4-4&from=ui&id=uf67c8abb&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=215009&status=done&style=none&taskId=ua85ec0b0-c813-466d-bbab-4f55ff56390&title=)

![80.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1678720267451-970ce6bf-5753-4a80-89a0-6e5db44d59af.jpeg#averageHue=%23f1f1f1&clientId=uc3fb2d5e-e0b4-4&from=ui&id=u9915cb65&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=146928&status=done&style=none&taskId=u3e5c0677-e5d0-4948-a4fb-e77af26f010&title=)
