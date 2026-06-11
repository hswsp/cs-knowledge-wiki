# 20 - Database Recovery with ARIES

![1.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488030315-f1f8c7e0-27ae-4285-8290-fabb13fc82ca.jpeg#averageHue=%231d2634&clientId=u545f74f4-b9e6-4&from=ui&id=u67bc1f3e&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=596395&status=done&style=none&taskId=u7d884cfd-27ff-48f7-9acc-d67f2ccb137&title=)

![2.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488029674-987f6498-9c81-42fd-84cb-38eca6eb2d11.jpeg#averageHue=%23ececec&clientId=u545f74f4-b9e6-4&from=ui&id=u2016464f&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=313827&status=done&style=none&taskId=ueea00364-378c-493c-9d4b-c3003f1a6bd&title=)

# Crash Recovery

The DBMS relies on its recovery algorithms to ensure database consistency, transaction atomicity, and durability despite failures. Each recovery algorithm is comprised of two parts:
• Actions during normal transaction processing to ensure that the DBMS can recover from a failure
• Actions after a failure to recover the database to a state that ensures the atomicity, consistency, and durability of transactions.

![3.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488029809-02246737-6d22-4f99-87df-46db23f01700.jpeg#averageHue=%23ebebeb&clientId=u545f74f4-b9e6-4&from=ui&id=u221f6339&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=387599&status=done&style=none&taskId=u99cbcfcf-6ec2-4c58-b30c-c8f46bb94f5&title=)

**A**lgorithms for **R**ecovery and **I**solation **E**xploiting **S**emantics (ARIES) is a recovery algorithm developed at IBM research in early 1990s for the DB2 system.
There are three key concepts in the ARIES recovery protocol:
• **Write Ahead Logging**: Any change is recorded in log on stable storage before the database change is written to disk (STEAL + NO-FORCE).
• **Repeating History During Redo**: On restart, retrace actions and restore database to exact state before crash.
• **Logging Changes During Undo**: Record undo actions to log to ensure action is not repeated in the event of repeated failures.

![4.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488030157-d03a8c8d-9c87-422a-8048-7f7c3c83253b.jpeg#averageHue=%23edecec&clientId=u545f74f4-b9e6-4&from=ui&id=u43e9d067&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=566873&status=done&style=none&taskId=u7c95f8f6-a6f4-45bb-bea4-3c379766836&title=)

![5.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488029826-bc4b3e95-96f8-4ce1-88e6-bf58067399f1.jpeg#averageHue=%23eaeaea&clientId=u545f74f4-b9e6-4&from=ui&id=u6aec100a&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=384477&status=done&style=none&taskId=u0708fa24-6ca9-4b39-befe-2e406c03f81&title=)

![6.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488031588-ad99c3d0-9dfa-46bd-a1d8-9e423f687d0a.jpeg#averageHue=%23efefef&clientId=u545f74f4-b9e6-4&from=ui&id=uc80867c1&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=209358&status=done&style=none&taskId=u52038007-5c96-4e60-b556-26e1c7c4336&title=)

# WAL Records

Write-ahead log records extend the DBMS’s log record format to include a globally unique *log sequence number* (**LSN)** . A high level diagram of how log records with LSN’s are written is shown in Figure 1.
All log records have an LSN. The `pageLSN` is updated every time a transaction modifies a record in the page. The `flushedLSN` in memory is updated every time the DBMS writes out the WAL buffer to disk.
Various components in the system keep track of **LSNs** that pertain to them. A table of these LSNs is shown in Figure 2.
Each data page contains a `pageLSN`, which is the LSN of the most recent update to that page. The DBMS also keeps track of the max `LSN` flushed so far (`flushedLSN`). Before the DBMS can write page `i` to disk, it must flush log at least to the point where $pageLSN_i ≤ flushedLSN$

![7.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488031899-b6197dbc-3836-4eb8-9da8-b1070ca5ad68.jpeg#averageHue=%23ececec&clientId=u545f74f4-b9e6-4&from=ui&id=u8e8e209e&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=334793&status=done&style=none&taskId=ue1829ad9-e04c-41c4-a246-26d9a0e3397&title=)

![Figure 2: LSN Types – Different parts of the system also maintain different types LSN’s that store relevant information.](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488032089-eda53bf4-db88-49d5-af40-9f1959164814.jpeg#averageHue=%23ececec&clientId=u545f74f4-b9e6-4&from=ui&id=ub6d08e41&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=true&size=333999&status=done&style=none&taskId=u284a1f44-fbe4-4f5c-84e8-2404ba34f19&title=Figure%202%3A%20LSN%20Types%20%E2%80%93%20Different%20parts%20of%20the%20system%20also%20maintain%20different%20types%20LSN%E2%80%99s%20that%20store%20relevant%20information.)

![9.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488032456-95d44e55-6b6b-4da7-9320-f84315813694.jpeg#averageHue=%23edecec&clientId=u545f74f4-b9e6-4&from=ui&id=u10bbe295&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=319734&status=done&style=none&taskId=u41f0958f-c396-41fb-9199-206eaa1a38f&title=)

![10.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488032803-22987595-050a-4314-9425-37d8f2ce12aa.jpeg#averageHue=%23e9e8e8&clientId=u545f74f4-b9e6-4&from=ui&id=u397d1a7c&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=471908&status=done&style=none&taskId=uae2317c0-f638-4f68-8641-6d5d62fd144&title=)

![11.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488033698-ec505997-fcfc-4bed-9ed1-6ae7414df113.jpeg#averageHue=%23e9e8e8&clientId=u545f74f4-b9e6-4&from=ui&id=u25f6d94b&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=425487&status=done&style=none&taskId=u52f057f3-bbc0-4148-a168-3ab56e68c22&title=)

![12.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488034154-ee23777e-e06c-4b11-bc7e-e78b9a1b761d.jpeg#averageHue=%23e9e8e8&clientId=u545f74f4-b9e6-4&from=ui&id=u8bcd7eee&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=426156&status=done&style=none&taskId=uf3246996-34c6-4e55-a530-446fd2847c7&title=)

![13.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488034407-ba547c91-6653-482e-a846-b653fa1bd546.jpeg#averageHue=%23e9e8e8&clientId=u545f74f4-b9e6-4&from=ui&id=u9e0f1894&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=435065&status=done&style=none&taskId=uef875817-dbf7-4dcd-82d2-7fa11a13349&title=)

![14.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488034782-800e8b15-6f40-45ec-a6a2-faf71183d105.jpeg#averageHue=%23e9e8e8&clientId=u545f74f4-b9e6-4&from=ui&id=ubca77158&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=440918&status=done&style=none&taskId=u7a936089-3bd8-46df-88f9-2b4d6bf587d&title=)

![15.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488035938-4a10441d-7665-4de5-addf-6947dbcc3cbd.jpeg#averageHue=%23e9e8e8&clientId=u545f74f4-b9e6-4&from=ui&id=ub256ece0&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=469211&status=done&style=none&taskId=u4a32f539-febb-4d26-98ba-2d68cee297d&title=)

**Figure 1: Writing Log Records** – Each WAL has a counter of LSNs that is incremented at every step. The page also keeps a pageLSN and a recLSN, which stores the first log record that made the page dirty. The flushedLSN is a pointer to the last LSN that was written out to disk. The MasterRecord points to the last successful checkpoint passed.

![16.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488036493-a2627828-f841-46cf-a876-e478f7c992e2.jpeg#averageHue=%23e9e8e8&clientId=u545f74f4-b9e6-4&from=ui&id=uf7d33594&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=468619&status=done&style=none&taskId=u960d3452-3087-404b-8daf-623a5b060c3&title=)

![17.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488036554-8dc56b76-100d-4f44-ae57-25b7d5d09fd6.jpeg#averageHue=%23ededed&clientId=u545f74f4-b9e6-4&from=ui&id=uda95945f&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=275171&status=done&style=none&taskId=u351a6675-f92b-45f7-afaa-c592ceac1b0&title=)

# Normal Execution

Every transaction invokes a sequence of reads and writes, followed by a commit or abort. It is this sequence of events that recovery algorithms must have.

![18.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488036680-87cf5c49-363e-43c2-b798-08804041c4c2.jpeg#averageHue=%23ededed&clientId=u545f74f4-b9e6-4&from=ui&id=uc835c8a7&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=304292&status=done&style=none&taskId=ub0504af3-610a-438e-afcf-1c57fb8aac7&title=)

## Transaction Commit

When a transaction goes to commit, the DBMS first writes `COMMIT` record to log buffer in memory. Then the DBMS flushes all log records up to and including the transaction’s `COMMIT` record to disk. Note that these log flushes are sequential, synchronous writes to disk. There can be multiple log records per log page. A diagram of a transaction commit is shown in Figure 3.
Once the `COMMIT` record is safely stored on disk, the DBMS returns an acknowledgment back to the application that the transaction has committed. At some later point, the DBMS will write a special `**TXN-END**`** record to log. This indicates that the transaction is completely finished** in the system and there will not be anymore log records for it. These `TXN-END` records are used for internal bookkeeping and do **not** need to be flushed immediately.

![19.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488037197-87707f0d-aa1c-4905-b35b-26e75cf3db28.jpeg#averageHue=%23eaeaea&clientId=u545f74f4-b9e6-4&from=ui&id=uf06e4cf9&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=401287&status=done&style=none&taskId=u3f43d630-1b5c-4b9c-8a09-846fe66c6e7&title=)

![20.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488038238-4c8d306d-5bb8-4d9f-ac62-78e421fe519f.jpeg#averageHue=%23e9e9e8&clientId=u545f74f4-b9e6-4&from=ui&id=uc997c348&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=410266&status=done&style=none&taskId=u1bc9529c-5e4a-4c1f-ade2-51faa19e6fc&title=)

![Figure 3: Transaction Commit – After the transaction commits (015), the log is flushed out and the flushedLSN is modified to point to the last log record generated. At some later point, a transaction end message is written to signify in the log that this transaction will not appear again.](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488038803-ab35fff0-4240-4771-b301-a516bfbebb2c.jpeg#averageHue=%23e9e8e8&clientId=u545f74f4-b9e6-4&from=ui&id=ua8268f5f&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=true&size=462111&status=done&style=none&taskId=u2d09e8ae-76d5-4804-8277-be30fb9c339&title=Figure%203%3A%20Transaction%20Commit%20%E2%80%93%20After%20the%20transaction%20commits%20%28015%29%2C%20the%20log%20is%20flushed%20out%20and%20the%20flushedLSN%20is%20modified%20to%20point%20to%20the%20last%20log%20record%20generated.%20At%20some%20later%20point%2C%20a%20transaction%20end%20message%20is%20written%20to%20signify%20in%20the%20log%20that%20this%20transaction%20will%20not%20appear%20again.)

![22.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488039042-74e959aa-a657-4f9a-9fd7-9fb07b9f54c5.jpeg#averageHue=%23e9e8e8&clientId=u545f74f4-b9e6-4&from=ui&id=ufa9d97a8&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=481542&status=done&style=none&taskId=ue475dde9-f3f9-448d-97c3-efcba29d355&title=)

![23.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488039001-bffc9dc1-3672-4e9d-bf94-f1e2e6d9571c.jpeg#averageHue=%23e9e8e8&clientId=u545f74f4-b9e6-4&from=ui&id=u04e3a094&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=453760&status=done&style=none&taskId=u997c8b84-9fae-4a65-b599-1a1e277bba5&title=)

## Transaction Abort

Aborting a transaction is a special case of the ARIES undo operation applied to only one transaction.
An additional field is added to the log records called the `prevLSN`. This corresponds to the previous LSN for the transaction. The DBMS uses these `prevLSN` values to maintain a **linked-list for each transaction that makes it easier to walk through the log to find its records.** 
A new type of record called the ***compensation log***** *****record***** (CLR) **is also introduced. A CLR describes the actions taken to undo the actions of a previous update record. It has all the fields of an update log record plus the *undoNext* pointer (i.e., the next-to-be-undone LSN). The DBMS adds CLRs to the log like any other record but they never need to be undone.
To abort a transaction, the DBMS first appends a `ABORT` record to the log buffer in memory. It then undoes the transaction’s updates in reverse order to remove their effects from the database. For each undone update, the DBMS creates **CLR** entry in the log and restore old value. After all of the aborted transaction’s updates are reversed, the DBMS then writes a `TXN-END` log record. A diagram of this is shown in Figure 4.

![24.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488039426-6ec6505c-fb6f-4b7d-b7a9-fb230eb2a8e0.jpeg#averageHue=%23ededed&clientId=u545f74f4-b9e6-4&from=ui&id=ud2f5157c&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=296956&status=done&style=none&taskId=u3af5e8ef-2d6a-4560-9340-94af7cd2a98&title=)

![25.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488040355-359e8a33-10ea-47fa-8546-a74fffea145a.jpeg#averageHue=%23e9e9e9&clientId=u545f74f4-b9e6-4&from=ui&id=u227dead1&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=375347&status=done&style=none&taskId=ud366b2d2-d3d0-43c3-ade9-56c2dee10b8&title=)

![Figure 4: Transaction Abort – The DBMS maintains an LSN and prevLSN for each log record that the transaction creates. When the transaction aborts, all of the previous changes are reversed. After the log entries of the reversed changes make it to disk, the DBMS appends the TXN-END record to the log for the aborted transaction.](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488041275-e7167ab8-601e-4899-b4c3-82b300813d63.jpeg#averageHue=%23e9e9e9&clientId=u545f74f4-b9e6-4&from=ui&id=ua1bacbf4&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=true&size=384686&status=done&style=none&taskId=u941dbc86-a155-4da7-95c6-1d1f8780eb0&title=Figure%204%3A%20Transaction%20Abort%20%E2%80%93%20The%20DBMS%20maintains%20an%20LSN%20and%20prevLSN%20for%20each%20log%20record%20that%20the%20transaction%20creates.%20When%20the%20transaction%20aborts%2C%20all%20of%20the%20previous%20changes%20are%20reversed.%20After%20the%20log%20entries%20of%20the%20reversed%20changes%20make%20it%20to%20disk%2C%20the%20DBMS%20appends%20the%20TXN-END%20record%20to%20the%20log%20for%20the%20aborted%20transaction.)

![27.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488041451-3fe19eb8-f739-467f-aa26-c939c859df54.jpeg#averageHue=%23e8e8e8&clientId=u545f74f4-b9e6-4&from=ui&id=u8c257ea5&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=439182&status=done&style=none&taskId=u7022a6f2-88b9-4539-92af-9474ad280cb&title=)

![28.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488041522-351540a5-7d93-44e3-961c-7177cdf104f0.jpeg#averageHue=%23eaeaea&clientId=u545f74f4-b9e6-4&from=ui&id=u6cd0d6b1&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=364732&status=done&style=none&taskId=ua43726cc-44c6-4878-86c9-37d18509690&title=)

![29.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488041484-5477dd6c-b660-4bba-a1b4-0470a2371c64.jpeg#averageHue=%23e3e3e3&clientId=u545f74f4-b9e6-4&from=ui&id=u7c27b003&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=282529&status=done&style=none&taskId=u4f5a58ba-99d5-4289-89b3-fd1b0177ebe&title=)

![30.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488042872-57a0c25c-201a-4bcd-a0fb-3cde19bc0f11.jpeg#averageHue=%23e3e2e2&clientId=u545f74f4-b9e6-4&from=ui&id=ub51c124e&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=335116&status=done&style=none&taskId=u674b53bd-34da-49cc-8a58-0bfc65d8e96&title=)

![31.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488043262-cc03c675-93cb-4507-becd-2a98e166d659.jpeg#averageHue=%23e2e2e2&clientId=u545f74f4-b9e6-4&from=ui&id=uf1edb5b7&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=332786&status=done&style=none&taskId=u35e05825-7c6d-4ba4-adc7-f5c6f30020d&title=)

![32.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488043433-0ec08aac-f00c-4be9-88f1-d877920c99b1.jpeg#averageHue=%23e2e1e1&clientId=u545f74f4-b9e6-4&from=ui&id=u3513ac15&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=382444&status=done&style=none&taskId=ua6ad1f73-034c-417a-9e3f-a60cbfcd938&title=)

![33.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488043707-b2b8c925-7cfd-47b9-9a90-d2ab0f25309a.jpeg#averageHue=%23e2e1e1&clientId=u545f74f4-b9e6-4&from=ui&id=uc8405759&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=334465&status=done&style=none&taskId=u7b342f42-b227-4ba2-bba2-b95ef62f94f&title=)

![34.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488043603-5d4eff53-ee3f-4b95-b9c0-b2ec2953f6fb.jpeg#averageHue=%23ededed&clientId=u545f74f4-b9e6-4&from=ui&id=u7aa6624f&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=304479&status=done&style=none&taskId=ue3371324-42d0-4e48-bb55-b34cf76d31c&title=)

![35.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488044497-ef805dfc-e68f-4776-ad78-502db7709e14.jpeg#averageHue=%23efefef&clientId=u545f74f4-b9e6-4&from=ui&id=ua81144f6&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=215474&status=done&style=none&taskId=u21d5f396-51d3-44ff-af5d-4780ef3515d&title=)

# Checkpointing

The DBMS periodically takes *checkpoints* where it writes the dirty pages in its buffer pool out to disk. This is used to minimize how much of the log it has to replay upon recovery.
The first two blocking checkpoint methods discussed below pause transactions during the checkpoint process. This pausing is necessary to ensure that the DBMS does not miss updates to pages during the checkpoint. Then, a better approach that allows transactions to continue to execute during the checkpoint but requires the DBMS to record additional information to determine what updates it may have missed is presented.

## Blocking Checkpoints

The DBMS halts the execution of transactions and queries when it takes a checkpoint to ensure that it writes a consistent snapshot of the database to disk. The is the same approach discussed in previous lecture:
• Halt the start of any new transactions.
• Wait until all active transactions finish executing.
• Flush dirty pages to disk.

![36.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488045434-a2b0673f-8224-4860-8549-060773aef012.jpeg#averageHue=%23ececec&clientId=u545f74f4-b9e6-4&from=ui&id=u514ec3c8&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=302432&status=done&style=none&taskId=ue15c6dc6-57fe-4564-88c4-57639f968b9&title=)

## Slightly Better Blocking Checkpoints

Like previous checkpoint scheme except that you the DBMS does not have to wait for active transactions to finish executing. The DBMS now records the internal system state as of the beginning of the checkpoint.
• Halt the start of any new transactions.
• Pause transactions while the DBMS takes the checkpoint.

![37.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488045448-f5f8bea1-5e64-4e0c-8430-66d2cf28ad1f.jpeg#averageHue=%23eaeaea&clientId=u545f74f4-b9e6-4&from=ui&id=ucdb2ec7b&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=322594&status=done&style=none&taskId=u4738d873-c076-4066-adbd-c51225c4592&title=)

![38.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488045656-80801bb0-a17d-420f-97fd-ef5f349ba5a6.jpeg#averageHue=%23eaeaea&clientId=u545f74f4-b9e6-4&from=ui&id=u563af1d1&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=323102&status=done&style=none&taskId=u6fb1fb80-d1e2-42d0-b258-da124d12f1b&title=)

![39.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488046008-f7f16454-b854-49ad-b0d7-0c7f9ae4264e.jpeg#averageHue=%23eaeaea&clientId=u545f74f4-b9e6-4&from=ui&id=ue3837f2b&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=328682&status=done&style=none&taskId=ue9593a20-7b2d-4d5b-80ad-0d022dfbdd3&title=)

![40.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488046648-271763a3-95c2-4a01-a996-1a213f1351ca.jpeg#averageHue=%23eae9e9&clientId=u545f74f4-b9e6-4&from=ui&id=uf0a8531e&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=351623&status=done&style=none&taskId=ueaacf855-26c5-4787-848a-f97b6ac1cc9&title=)

![41.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488047675-6a837577-1038-4ddd-a718-00996e994ec4.jpeg#averageHue=%23e6e6e6&clientId=u545f74f4-b9e6-4&from=ui&id=u5b7e5edc&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=428518&status=done&style=none&taskId=uf0fc054e-f38b-4eef-8a0d-644ab0ca8bb&title=)

**Active Transaction Table (ATT):**  The ATT represents the state of transactions that are actively running in the DBMS. A transaction’s entry is removed after the DBMS completes the commit/abort process for that transaction. For each transaction entry, the ATT contains the following information:
• `transactionId`: Unique transaction identifier
• `status`: The current “mode” of the transaction (Running, Committing, Undo Candidate).
• `lastLSN`: Most recent LSN written by transaction
Note that the ATT contains every transcation without the `TXN-END` log record. This includes both transactions that are either committing or aborting.

![42.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488047500-7f263519-e90d-4103-94d6-16bfd169d24c.jpeg#averageHue=%23ededed&clientId=u545f74f4-b9e6-4&from=ui&id=u5b01e214&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=301555&status=done&style=none&taskId=u972a3cc6-11a9-4ca5-a3a8-7fea8bb17d7&title=)

**Dirty Page Table (DPT): **The DPT contains information about the pages in the buffer pool that were modified by uncommitted transactions. There is one entry per dirty page containing the `recLSN` (i.e., the LSN of the log record that first caused the page to be dirty).
The DPT contains all pages that are dirty in the buffer pool. It doesn’t matter if the changes were caused by a transaction that is running, committed, or aborted.
Overall, the ATT and the DPT serve to help the DBMS recover the state of the database before the crash via the ARIES recovery protocol.

![43.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488047723-448a367a-5153-416e-be1f-56ba23e33fbf.jpeg#averageHue=%23ededed&clientId=u545f74f4-b9e6-4&from=ui&id=ub417150b&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=268719&status=done&style=none&taskId=u29e90744-a543-4a2a-9e65-5d06aeadf99&title=)

![44.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488048235-a0302581-865f-48f0-b216-d53b27a89d7d.jpeg#averageHue=%23eaeaea&clientId=u545f74f4-b9e6-4&from=ui&id=u548fe280&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=492272&status=done&style=none&taskId=uae0112dc-ddeb-4e85-b6be-e1af8badb3f&title=)

## Fuzzy Checkpoints

A *fuzzy checkpoint* is where the DBMS allows other transactions to continue to run. This is what ARIES uses in its protocol.
The DBMS uses additional log records to track checkpoint boundaries:
• `<CHECKPOINT-BEGIN>`: Indicates the start of the checkpoint. At this point, the DBMS takes a snapshot of the current ATT and DPT, which are referenced in the `<CHECKPOINT-END>` record.
• `<CHECKPOINT-END>`: When the checkpoint has completed. It contains the ATT + DPT, captured just as the `<CHECKPOINT-BEGIN>` log record is written.

![45.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488048570-326dcdcd-8e7f-464a-ac46-c416bbd1e687.jpeg#averageHue=%23ececec&clientId=u545f74f4-b9e6-4&from=ui&id=ue58d5963&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=347459&status=done&style=none&taskId=ue75b0ae0-2f53-4d0c-8e85-c23b75fbdcc&title=)

![46.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488049789-0cf72ed5-5c22-48e1-a4e9-9db252128f9e.jpeg#averageHue=%23ecebeb&clientId=u545f74f4-b9e6-4&from=ui&id=ub555dcf5&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=511469&status=done&style=none&taskId=u4e24abe9-7fc5-475a-be38-c588e5b8a65&title=)

![47.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488050080-fdc6b66f-a10d-4253-a5bf-1e5fae15df6a.jpeg#averageHue=%23ecebeb&clientId=u545f74f4-b9e6-4&from=ui&id=u90cca3cb&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=511751&status=done&style=none&taskId=ub6595b07-f886-4692-bb98-a61e6544a7d&title=)

# ARIES Recovery

The ARIES protocol is comprised of three phases. Upon start-up after a crash, the DBMS will execute the following phases as shown in Figure 5:

1. **Analysis**: Read the WAL to identify dirty pages in the buffer pool and active transactions at the time of the crash. At the end of the analysis phase the *ATT* tells the DBMS which transactions were active at the time of the crash. The *DPT* tells the DBMS which dirty pages might not have made it to disk.
2. **Redo**: Repeat all actions starting from an appropriate point in the log.
3. **Undo**: Reverse the actions of transactions that did not commit before the crash.

![48.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488049985-0ed57a36-2fab-4205-9bed-645b216c7c41.jpeg#averageHue=%23ebebeb&clientId=u545f74f4-b9e6-4&from=ui&id=u681b655c&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=345092&status=done&style=none&taskId=uc59a200f-44e1-47d0-923e-86995dcb65e&title=)

![Figure 5: ARIES Recovery: The DBMS starts the recovery process by examining the log starting from the last BEGIN-CHECKPOINT found via MasterRecord. It then begins the Analysis phase by scanning forward through time to build out ATT and DPT. In the Redo phase, the algorithm jumps to the smallest recLSN, which is the oldest log record that may have modified a page not written to disk. The DBMS then applies all changes from the smallest recLSN. The Undo phase starts at the oldest log record of a transaction active at crash and reverses all changes up to that point.](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488050684-30c05bd0-7582-4564-8d27-201fe01607ee.jpeg#averageHue=%23e9e8e8&clientId=u545f74f4-b9e6-4&from=ui&id=u715a4d70&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=true&size=410841&status=done&style=none&taskId=ub8dd5b1d-5780-47de-a683-131035f6efd&title=Figure%205%3A%20ARIES%20Recovery%3A%20The%20DBMS%20starts%20the%20recovery%20process%20by%20examining%20the%20log%20starting%20from%20the%20last%20BEGIN-CHECKPOINT%20found%20via%20MasterRecord.%20It%20then%20begins%20the%20Analysis%20phase%20by%20scanning%20forward%20through%20time%20to%20build%20out%20ATT%20and%20DPT.%20In%20the%20Redo%20phase%2C%20the%20algorithm%20jumps%20to%20the%20smallest%20recLSN%2C%20which%20is%20the%20oldest%20log%20record%20that%20may%20have%20modified%20a%20page%20not%20written%20to%20disk.%20The%20DBMS%20then%20applies%20all%20changes%20from%20the%20smallest%20recLSN.%20The%20Undo%20phase%20starts%20at%20the%20oldest%20log%20record%20of%20a%20transaction%20active%20at%20crash%20and%20reverses%20all%20changes%20up%20to%20that%20point.)

## Analysis Phase

Start from last checkpoint found via the database’s `MasterRecord` LSN.

1. Scan log forward from the checkpoint.
2. If the DBMS finds a `TXN-END` record, remove its transaction from ATT.
3. All other records, add transaction to ATT with status **UNDO**, and on commit, change transaction status to **COMMIT**.
4. For `UPDATE` log records, if page *P* is not in the DPT, then add *P* to DPT and set P’s `recLSN` to the log record’s LSN.

![50.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488050802-e9c08c16-de01-46ff-bfe8-cd8136f3ea40.jpeg#averageHue=%23ececec&clientId=u545f74f4-b9e6-4&from=ui&id=udaba5b9b&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=331924&status=done&style=none&taskId=u97ae39b8-f522-44ea-9921-5f5584951b4&title=)

![51.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488051959-c8786ec2-5c6a-49d4-8ffb-7d75e9cc8968.jpeg#averageHue=%23efefef&clientId=u545f74f4-b9e6-4&from=ui&id=u098ea527&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=221084&status=done&style=none&taskId=ucd765f81-80df-482e-8d1e-9bb64d0cd9b&title=)

![52.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488052156-d3bfac67-c510-47c0-a27b-d6b7c960c75f.jpeg#averageHue=%23e7e6e6&clientId=u545f74f4-b9e6-4&from=ui&id=ue16a4d90&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=302366&status=done&style=none&taskId=u61c64d5e-c908-49c2-b390-cdec88697d5&title=)

![53.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488052466-0f5eb80c-0c48-41aa-b053-c60ae43eae1d.jpeg#averageHue=%23e8e8e8&clientId=u545f74f4-b9e6-4&from=ui&id=u6d25c749&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=322143&status=done&style=none&taskId=uf14710c4-721d-43d6-96a5-f0f5785413c&title=)

![54.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488052867-24f5b549-d8d0-4e70-9838-3ba0c64b3f8e.jpeg#averageHue=%23e8e7e7&clientId=u545f74f4-b9e6-4&from=ui&id=uf37e538a&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=345993&status=done&style=none&taskId=ue3a7c421-49c4-47e6-b9b4-83f2cedbd8b&title=)

![55.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488052877-3afaac2e-7188-4492-ac8d-0079eaa64f84.jpeg#averageHue=%23e6e6e6&clientId=u545f74f4-b9e6-4&from=ui&id=u542b3e74&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=324272&status=done&style=none&taskId=uce43d2a8-8436-4984-8453-4f087a9e965&title=)

![56.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488054145-cfbc337c-f9e1-45a7-b22d-69fbe0f69dbd.jpeg#averageHue=%23e6e6e6&clientId=u545f74f4-b9e6-4&from=ui&id=u25ef4d3e&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=339758&status=done&style=none&taskId=u972e6c25-ae8a-4f72-bdf0-5c875980f14&title=)

![57.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488054275-813e4136-8c83-497b-9a81-ade08995e27b.jpeg#averageHue=%23e6e6e6&clientId=u545f74f4-b9e6-4&from=ui&id=u89506e3d&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=351121&status=done&style=none&taskId=ub59df253-e3fd-434e-9f45-048ddc17690&title=)

## Redo Phase

The goal of this phase is for the DBMS to repeat history to reconstruct its state up to the moment of the crash. It will reapply all updates (even aborted transactions) and redo **CLRs**.
The DBMS scans forward from log record containing smallest `recLSN` in the DPT. For each update log record or CLR with a given LSN, the DBMS re-applies the update unless:
• Affected page is not in the DPT, or
• Affected page is in DPT but that record’s LSN is less than the `recLSN` of the page in DPT, or
• Affected `pageLSN` (on disk) ≥ LSN.

![58.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488054523-d94603c0-74db-414a-bb86-07d987341003.jpeg#averageHue=%23ededed&clientId=u545f74f4-b9e6-4&from=ui&id=u58d440a1&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=297879&status=done&style=none&taskId=u56cc6ddd-1e68-43a5-bc68-5de55e38639&title=)

![59.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488054854-db787f15-0991-4633-abce-095260aed961.jpeg#averageHue=%23ededed&clientId=u545f74f4-b9e6-4&from=ui&id=u236bcda4&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=289967&status=done&style=none&taskId=ue0c7e404-41d1-4e92-aa6b-202472114fb&title=)

To redo an action, the DBMS re-applies the change in the log record and then sets the affected page’s `pageLSN` to that log record’s LSN.
At the end of the redo phase, write `TXN-END` log records for all transactions with status `COMMIT` and remove them from the **ATT**.

![60.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488054860-bf1f9064-d608-45e4-93e8-a20fc61e8471.jpeg#averageHue=%23eeeded&clientId=u545f74f4-b9e6-4&from=ui&id=u11eba2de&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=276123&status=done&style=none&taskId=ubfc39ab0-354e-4f87-b808-6bad94abaf2&title=)

## Undo Phase

In the last phase, the DBMS reverses all transactions that were active at the time of crash. These are all transactions with `UNDO` status in the ATT after the Analysis phase.
The DBMS processes transactions in reverse LSN order using the `**lastLSN**` to speed up traversal. As it reverses the updates of a transaction, the DBMS writes a CLR entry to the log for each modification.
Once the last transaction has been successfully aborted, the DBMS flushes out the log and then is ready to start processing new transactions.

![61.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488055926-26fd3157-cee9-4d21-866f-9465253710d9.jpeg#averageHue=%23ededed&clientId=u545f74f4-b9e6-4&from=ui&id=u45ddd2db&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=301176&status=done&style=none&taskId=uf191cc8d-6d89-42e7-81b7-16204e085d1&title=)

![62.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488056529-d1fbede9-56bd-4ee0-9aaf-f89a87280a6d.jpeg#averageHue=%23eeeeee&clientId=u545f74f4-b9e6-4&from=ui&id=ub081940c&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=273900&status=done&style=none&taskId=u16e3c789-e437-48c5-b900-1b2446fc1b7&title=)

![63.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488056787-76bff867-476c-43bc-bb1d-3aca8efd6e2b.jpeg#averageHue=%23eeeeee&clientId=u545f74f4-b9e6-4&from=ui&id=u04f3b1ba&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=270715&status=done&style=none&taskId=ubf73cce9-81a7-4506-8d2b-fd03b0e60ce&title=)

![64.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488056932-820ecf2b-fb50-4673-aa21-6715bc2d0239.jpeg#averageHue=%23e8e7e7&clientId=u545f74f4-b9e6-4&from=ui&id=u39ee94ba&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=344308&status=done&style=none&taskId=u90b30f0b-6c3a-40a1-94a6-8e674a3e7be&title=)

![65.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488057099-71291967-f1b6-4591-8d6f-10ec7385d85b.jpeg#averageHue=%23e8e7e7&clientId=u545f74f4-b9e6-4&from=ui&id=u79e7e325&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=368408&status=done&style=none&taskId=uae804343-ca39-4824-b61b-e5b090c6f64&title=)

![66.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488058078-c835f5be-a354-4654-882e-84952673aec0.jpeg#averageHue=%23e7e6e6&clientId=u545f74f4-b9e6-4&from=ui&id=u259abd27&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=417612&status=done&style=none&taskId=u550b18cf-831f-4a4a-accb-f56756c3417&title=)

![67.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488058846-b4a15caa-6734-4774-9340-84aa23d280c1.jpeg#averageHue=%23edecec&clientId=u545f74f4-b9e6-4&from=ui&id=u45566054&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=381679&status=done&style=none&taskId=u8b8fd87e-707c-40ab-b720-c72fc91a2a9&title=)

![68.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488059537-c65d7c55-a874-4a85-bbdb-1364e28c3713.jpeg#averageHue=%23e7e6e6&clientId=u545f74f4-b9e6-4&from=ui&id=u1d1b3529&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=415849&status=done&style=none&taskId=u5f46b71b-e74d-4329-9b83-bd3e71b89f6&title=)

![69.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488059436-d21ece15-7412-4cac-8e40-461350d1c3ad.jpeg#averageHue=%23ebebeb&clientId=u545f74f4-b9e6-4&from=ui&id=u38d85911&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=306218&status=done&style=none&taskId=u78e224c5-dd90-4eb4-990d-805087d2cf3&title=)

![70.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488059674-2af7dcc7-391c-4a22-bff5-7fedd7d2f940.jpeg#averageHue=%23e9e9e9&clientId=u545f74f4-b9e6-4&from=ui&id=uf2ea47a6&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=385172&status=done&style=none&taskId=u0cb882e2-0f1b-43d1-a075-a5e166b59d3&title=)

![71.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488060049-281887ec-fc1b-490d-ba88-9bae6e584cf8.jpeg#averageHue=%23ececec&clientId=u545f74f4-b9e6-4&from=ui&id=u966f9489&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=379960&status=done&style=none&taskId=ud18d2cf4-263c-4191-bf7a-099352192ec&title=)

![72.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/22382307/1680488061082-c818f476-9973-46f3-ab4b-72e35167814e.jpeg#averageHue=%23efefef&clientId=u545f74f4-b9e6-4&from=ui&id=u21bad449&originHeight=1688&originWidth=3000&originalType=binary&ratio=2&rotation=0&showTitle=false&size=197652&status=done&style=none&taskId=u42a98999-dae5-4c91-94ec-e67057e0340&title=)
