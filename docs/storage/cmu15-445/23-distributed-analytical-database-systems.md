# 23 - Distributed Analytical Database Systems

![1.jpg](https://images.spumn.eu.cc/blog/f44ee680c09e5b38.jpg)

![2.jpg](https://images.spumn.eu.cc/blog/46274a01145458aa.jpg)

![3.jpg](https://images.spumn.eu.cc/blog/2d41288db594f069.jpg)

![4.jpg](https://images.spumn.eu.cc/blog/234fbd28af7deb06.jpg)

## Decision Support Systems

For a read-only OLAP database, it is common to have a bifurcated environment, where there are multiple instances of OLTP databases that ingest information from the outside world which is then fed into the backend **OLAP database**, sometimes called a **data warehouse**. There is an intermediate step called *ETL*, or **E**xtract, **T**ransform, and **L**oad, which combines the OLTP databases into a universal schema for the data warehouse.

*Decision support systems* (**DSS**) are applications that serve the management, operations, and planning levels of an organization to help people make decisions about future issues and problems by analyzing historical data stored in a data warehouse.

The two approaches for modeling an analytical database are *star schemas* and *snowflake schemas*.

![5.jpg](https://images.spumn.eu.cc/blog/5ba878f264e596e1.jpg)

### Star Schema

Star schemas contain two types of tables: *fact tables* and *dimension tables*. The **fact table** contains multiple “events” that occur in the application. It will contain the minimal unique information per event, and then the rest of the attributes will be foreign key references to outer dimension tables. The **dimension tables** contain redundant information that is reused across multiple events. In a star schema, there can only be one dimension-level out from the fact table. Since the data can only have one level of dimension tables, it can have redundant information. Denormalized data models may incur integrity and consistency violations, so replication must be handled accordingly. Queries on star schemas will (usually) be faster than a snowflake schema because there are fewer joins. An example of a star schema is shown in Figure 1.

![6.jpg](https://images.spumn.eu.cc/blog/8065914cc5c1069c.jpg)

**Figure 1: Star Schema** – The center of the schema is the SALES fact table that contains key references to outer dimension tables. Because star schemas are only one-dimensional, the outer dimensional tables cannot point to other dimension tables.

### Snowflake Schema

Snowflake schemas are similar to star schemas except that they allow for more than one dimension out from the fact table. They take up less storage space, but they require more joins to get the data needed for a query. For this reason, queries on star schemas are usually faster. An example of a snowflake schema is shown in Figure 2.

![7.jpg](https://images.spumn.eu.cc/blog/f53474da61b3c09a.jpg)

**Figure 2: Snowflake Schema** – The category information in the product dimension table can be broken out in the snowflake table.

![8.jpg](https://images.spumn.eu.cc/blog/2cc4278e20eb3d8d.jpg)

![9.jpg](https://images.spumn.eu.cc/blog/ac3ab747659bb864.jpg)

![10.jpg](https://images.spumn.eu.cc/blog/1c32523c6b72714c.jpg)

## Execution Models

A distributed DBMS’s *execution model* specifies how it will communicate between nodes during query execution. Two approaches to executing a query are pushing and pulling.

### Pushing a Query to Data

For the first approach, the DBMS sends the query (or a portion of it) to the node that contains the data. It then performs as much filtering and processing as possible where data resides before transmitting over network. The result is then sent back to where the query is being executed, which uses local data and the data sent to it, to complete the query. This is more common in a **shared nothing system**.

### Pulling Data to Query

For the second approach, the DBMS brings the data to the node that is executing a query that needs it for processing. In other words, nodes detect which partitions of the data they can do computation on and pull from storage accordingly. Then, the local operations are propagated to one node, which does the operation on all the intermediary results. This is normally what a shared disk system would do. The problem with this is that the size of the data relative to the size of the query could be very different. A filter can also be sent to only retrieve the data needed from disk.

![11.jpg](https://images.spumn.eu.cc/blog/6ef04f38ed89e589.jpg)

![12.jpg](https://images.spumn.eu.cc/blog/f25895cd79629995.jpg)

![13.jpg](https://images.spumn.eu.cc/blog/705fb8321543e18f.jpg)

![14.jpg](https://images.spumn.eu.cc/blog/ebcb2df59b72d5a7.jpg)

![15.jpg](https://images.spumn.eu.cc/blog/7a5b69ce91750e2b.jpg)

![16.jpg](https://images.spumn.eu.cc/blog/7eadae0a897cf743.jpg)

![17.jpg](https://images.spumn.eu.cc/blog/96487eca081ab4dd.jpg)

![18.jpg](https://images.spumn.eu.cc/blog/b1097d4f1d52d57b.jpg)

### Query Fault Tolerance

The data that a node receives from remote sources are cached in the buffer pool. This allows the DBMS to support intermediate results that are larger than the amount of memory available. Ephemeral pages, however, are not persisted after a restart. Therefore, a distributed DBMS must consider what happens to a long-running OLAP query if a node crashes during execution.

Most shared-nothing distributed OLAP DBMSs are designed to assume that nodes do not fail during query execution. If one node fails during query execution, then the whole query fails, which entails the entire query executing from the start. This can be expensive, as some OLAP queries can take days to execute.

The DBMS could take a snapshot of the intermediate results for a query during execution to allow it to recover if nodes fail. This operation is expensive, however, because writing data to disk is slow.

![19.jpg](https://images.spumn.eu.cc/blog/7daa198a7417a59e.jpg)

![20.jpg](https://images.spumn.eu.cc/blog/ba1ba70c85c19501.jpg)

![21.jpg](https://images.spumn.eu.cc/blog/3f9ca2271edbe1e0.jpg)

## Query Planning

All the optimizations that we talked about before are still applicable in a distributed environment, including predicate pushdown, early projections, and optimal join orderings. Distributed query optimization is even harder because it must consider the physical location of data in the cluster and data movement costs.

![22.jpg](https://images.spumn.eu.cc/blog/e910fb588e05f5aa.jpg)

One approach is to generate a single global query plan and then distribute *physical operators* to nodes, breaking it up into partition-specific fragments. Most systems implement this approach.

Another approach is to take the *SQL* query and rewrite the original query into partition-specific queries. This allows for local optimization at each node. **SingleStore** and **Vitess** are examples of systems that use this approach.

![23.jpg](https://images.spumn.eu.cc/blog/44e8c57104e0962b.jpg)

![24.jpg](https://images.spumn.eu.cc/blog/00e01d0ddbbbdd46.jpg)

![25.jpg](https://images.spumn.eu.cc/blog/274c37589ec650df.jpg)

## Distributed Join Algorithms

For analytical workloads, the majority of the time is spent doing joins and reading from disk, showing the importance of this topic. The efficiency of a distributed join depends on the target tables’ partitioning schemes.

One approach is to put entire tables on a single node and then perform the join. However, the DBMS loses the parallelism of a distributed DBMS, which defeats the purpose of having a distributed DBMS. This option also entails costly data transfer over the network.

To join tables R and S, the DBMS needs to get the proper tuples on the same node. Once there, it then executes the same join algorithms discussed earlier in the semester. One should always send the minimal amount needed to compute the join, sometimes entailing entire tuples.

There are four scenarios for distributed join algorithms.

![26.jpg](https://images.spumn.eu.cc/blog/ae4fb3b05c709249.jpg)

### Scenario 1

One of the tables is replicated at every node and the other table is partitioned across nodes. Each node joins its local data in parallel and then sends their results to a coordinating node.

![27.jpg](https://images.spumn.eu.cc/blog/2f977f6ee46bf2e0.jpg)

![28.jpg](https://images.spumn.eu.cc/blog/6738f8ec47b293f7.jpg)

### Scenario 2

Both tables are partitioned on the join attribute, with IDs matching on each node. Each node performs the join on local data and then sends to a node for coalescing.

![29.jpg](https://images.spumn.eu.cc/blog/a88d00b583eb3ef9.jpg)

![30.jpg](https://images.spumn.eu.cc/blog/aada729f2a500d55.jpg)

### Scenario 3

Both tables are partitioned on different keys. If one of the tables is small, then the DBMS broadcasts that table to all nodes. This takes us back to Scenario 1. Local joins are computed and then those joins are sent to a common node to operate the final join. This is known as a broadcast join.

![31.jpg](https://images.spumn.eu.cc/blog/4e6ae1cf7c444ea4.jpg)

![32.jpg](https://images.spumn.eu.cc/blog/01dec9c143a04adf.jpg)

![33.jpg](https://images.spumn.eu.cc/blog/4e8c4c68d20a4cef.jpg)

![34.jpg](https://images.spumn.eu.cc/blog/04fac418857df384.jpg)

### Scenario 4

This is the worst case scenario. Both tables are not partitioned on the join key. The DBMS copies the tables by reshuffling them across nodes. Local joins are computed and then the results are sent to a common node for the final join. If there isn’t enough disk space, a failure is unavoidable. This is called a *shuffle join*.

![35.jpg](https://images.spumn.eu.cc/blog/0eba06fc8dfac0e1.jpg)

![36.jpg](https://images.spumn.eu.cc/blog/23a533dfe1bd2017.jpg)

![37.jpg](https://images.spumn.eu.cc/blog/0b41594311a3d7cc.jpg)

![38.jpg](https://images.spumn.eu.cc/blog/44a3a27478e8f432.jpg)

![39.jpg](https://images.spumn.eu.cc/blog/779ac1fac9cb2a8e.jpg)

![40.jpg](https://images.spumn.eu.cc/blog/fb9411b0a51093b3.jpg)

### Semi-Join

A semi-join is a join operator where the **result only contains columns from the left table**. Distributed DBMSs use semi-join to minimize the amount of data sent during joins.

It is like a natural join, except that the attributes on the right table that are not used to compute the join are restricted.

![41.jpg](https://images.spumn.eu.cc/blog/12fc30cbc8b39097.jpg)

![42.jpg](https://images.spumn.eu.cc/blog/04f9edad3b4eaad7.jpg)

![43.jpg](https://images.spumn.eu.cc/blog/6a1b485fb994ba31.jpg)

![44.jpg](https://images.spumn.eu.cc/blog/aeba87a3ceb0ffc9.jpg)

![45.jpg](https://images.spumn.eu.cc/blog/b7065a49a5950594.jpg)

![46.jpg](https://images.spumn.eu.cc/blog/61b14bf5397469b5.jpg)

## Cloud Systems

Vendors provide database-as-a-service (**DBaaS**) offerings that are managed DBMS environments.

Newer systems are starting to blur the lines between shared-nothing and shared-disk. For example, **Amazon S3** allows for simple filtering before copying data to compute nodes. There are two types of cloud systems, **managed** or **cloud-native** DBMSs.

![47.jpg](https://images.spumn.eu.cc/blog/c044a544aba71a95.jpg)

### Managed DBMSs

In a managed DBMS, no significant modification to the DBMS to be ”aware” that it is running in a cloud environment. It provides a way to abstract away all the backup and recovery for the client. This approach is deployed in most vendors.

### Cloud-Native DBMS

A cloud-native system is designed explicitly to run in a cloud environment. This is usually based on a shared-disk architecture. This approach is used in **Snowflake, Google BigQuery, Amazon Redshift**, and **Microsoft SQL Azure.**

![48.jpg](https://images.spumn.eu.cc/blog/07d9343ee27580e8.jpg)

### Serverless Databases

Rather than always maintaining compute resources for each customer, a serverless DBMS evicts tenants when they become idle, checkpointing the current progress in the system to disk. Now, a user is only paying for storage when not actively querying. A diagram of this is shown in Figure 3.

![49.jpg](https://images.spumn.eu.cc/blog/3ce0ca9e8474a7b8.jpg)

![50.jpg](https://images.spumn.eu.cc/blog/82b8f8b3582a6e1a.jpg)

![51.jpg](https://images.spumn.eu.cc/blog/12dcbee71bfc156f.jpg)

**Figure 3: Serverless Database** – When the application server becomes idle, the user must pay for resources in the node that are not being used. In a serverless database, when the application server stops, the DBMS takes a snapshot of pages in the buffer pool and writes it out to shared disk so that the computation can be stopped. When the application server returns, the buffer pool page table restores the previous state in the node.

![52.jpg](https://images.spumn.eu.cc/blog/c63d3e86dfd7d209.jpg)

![53.jpg](https://images.spumn.eu.cc/blog/2e1283a2334e9a2f.jpg)

![54.jpg](https://images.spumn.eu.cc/blog/153234a8574d75ee.jpg)

### Data Lakes

A *Data Lake* is a centralized repository for storing large amounts of structured, semi-structured, and unstructured data without having to define a schema or ingest the data into proprietary internal formats. Data lakes are usually faster at ingesting data, as they do not require transformation right away. They do require the user to write their own transformation piplines.

![55.jpg](https://images.spumn.eu.cc/blog/f3d2b9d001720cbb.jpg)

![56.jpg](https://images.spumn.eu.cc/blog/499bbe86af953259.jpg)

![57.jpg](https://images.spumn.eu.cc/blog/8612c9da2699f4a6.jpg)

![58.jpg](https://images.spumn.eu.cc/blog/b71a0ddc7cf1a37d.jpg)

## Universal Formats

Most DBMSs use a proprietary on-disk binary file format for their databases. The only way to share data between systems is to convert data into a common text-based format, including CSV, JSON, and XML. There are new open-source binary file formats, which cloud vendors and distributed database systems support, that make it easier to access data across systems. Writing a custom file format would give way to better compression and performance, but this gives way to better interoperability.

![59.jpg](https://images.spumn.eu.cc/blog/e53cbe92cbc5e6c5.jpg)

[BusTub](https://github.com/cmu-db/bustub/tree/master/src/include/storage/page)

Notable examples of universal database file formats:

• **[Apache Parquet](https://parquet.apache.org/)**: Compressed columnar storage from Cloudera/Twitter.

• **[Apache ORC](https://orc.apache.org/)**: Compressed columnar storage from **Apache Hive**.

• **[Apache CarbonData](https://carbondata.apache.org/)**: Compressed columnar storage with indexes from Huawei.

• **[Apache Iceberg](https://iceberg.apache.org/)**​ **:**  Flexible data format that supports schema evolution from Netflix.

• **[HDF5](https://www.hdfgroup.org/)**: Multi-dimensional arrays for scientific workloads.

• **[Apache Arrow](https://arrow.apache.org/)**: In-memory compressed columnar storage from Pandas/Dremio.

![60.jpg](https://images.spumn.eu.cc/blog/1435ebb566f64cac.jpg)

## Disaggregated Components

Many existing libraries/systems implement a single component of a distributed database. Distributed databases can then leverage these components instead of re-implementing it themselves. Additionally different distributed databases can share components with each other.

Notable examples are:

**System Catalogs**: HCatalog, Google Data Catalog,[Amazon Glue Data Catalog](https://docs.aws.amazon.com/glue/latest/dg/tables-described.html),

**Node Management**: [Kubernetes](https://kubernetes.io/), [Apache YARN](https://hadoop.apache.org/docs/current/hadoop-yarn/hadoop-yarn-site/YARN.html), Cloud Vendor Tools

**Query Optimizers**: [Greenplum Orca](https://github.com/greenplum-db/gporca), [Apache Calcite](https://calcite.apache.org/)

![61.jpg](https://images.spumn.eu.cc/blog/4ef193a56f58b022.jpg)

![62.jpg](https://images.spumn.eu.cc/blog/5bd6c56229c8e30a.jpg)

![63.jpg](https://images.spumn.eu.cc/blog/3867ee5b18b3788d.jpg)
