# 12 - Query Execution 1

![1.jpg](https://images.spumn.eu.cc/blog/0fd3d412ed66a790.jpeg)

![2.jpg](https://images.spumn.eu.cc/blog/78e967f8efce3bac.jpeg)

![3.jpg](https://images.spumn.eu.cc/blog/8c9f9ba52cb64ac3.jpeg)

[Defensive Programming](https://swc-osg-workshop.github.io/2017-05-17-JLAB/novice/python/05-defensive.html)
[How to profile a C program with Valgrind/Callgrind](https://medium.com/@jacksonbelizario/profiling-a-c-program-with-valgrind-callgrind-b41f15b31527)

![4.jpg](https://images.spumn.eu.cc/blog/bb55b3de6da44b7d.jpeg)

# Query Plan

The DBMS converts a SQL statement into a query plan. Operators in the query plan are arranged in a tree. Data flows from the leaves of this tree towards the root. The output of the root node in the tree is the result of the query. Typically operators are binary (1–2 children). The same query plan can be executed in multiple ways.

# Processing Models

A DBMS *processing model* defines how the system executes a query plan. It specifies things like the direction in which the query plan is evaluated and what kind of data is passed between operators along the way. There are different models of processing models that have various trade-offs for different workloads.
These models can also be implemented to invoke the operators either from **top-to-bottom** or from **bottom-to-top**. Although the top-to-bottom approach is much more common, the bottom-to-top approach can allow for tighter control of caches/registers in pipelines.
The three execution models that we consider are:
• Iterator Model
• Materialization Model
• Vectorized / Batch Model

![5.jpg](https://images.spumn.eu.cc/blog/4bb232b391806141.jpeg)

## Iterator Model

The *iterator model*, also known as the Volcano or Pipeline model, is the most common processing model and is used by almost every (row-based) DBMS.

![6.jpg](https://images.spumn.eu.cc/blog/349950267793bb77.jpeg)

The iterator model works by implementing a `Next` function for every operator in the database. Each node in the query plan calls `Next` on its children until the leaf nodes are reached, which start emitting tuples up to their parent nodes for processing. Each tuple is then processed up the plan as far as possible before the next tuple is retrieved. This is useful in disk-based systems because it allows us to fully use each tuple in memory before the next tuple or page is accessed. A sample diagram of the iterator model is shown in Figure 1.
Query plan operators in an iterator model are highly composible and easy to reason about because each operator can be implemented independent from their parent or child operators in the query plan tree so long as it implements a `Next` function as follows:
• On each call to `Next`, the operator returns either a single tuple or a null marker if there are no more tuples to emit.
• The operator implements a loop that calls `Next` on its children to retrieve their tuples and then process them. In this way, calling `Next` on a parent calls `Next` on its children. In response, the child node will return the next tuple that the parent must process.
The iterator model allows for *pipelining* where the DBMS can process a tuple through as many operators as possible before having to retrieve the next tuple. The series of tasks performed for a given tuple in the query plan is called a *pipeline*.
Some operators will block until children emit all of their tuples. Examples of such operators include joins, subqueries, and ordering (`ORDER BY`). Such operators are known as *pipeline breakers*.
Output control works easily with this approach (`LIMIT`) because an operator can stop invoking `Next` on its child (or children) operator(s) once it has all the tuples that it requires.

![7.jpg](https://images.spumn.eu.cc/blog/952c3948189083e4.jpeg)

**Figure 1: Iterator Model Example** – Pseudo code of the different `Next` functions for each of the operators. The `Next` functions are essentially for-loops that iterate over the output of their child operator. For example, the root node calls `Next` on its child, the join operator, which is an access method that loops over the relation R and emits a tuple up that is then operated on. After all tuples have been processed, a `null` pointer (or another indicator) is sent that lets the parent nodes know to move on.

![8.jpg](https://images.spumn.eu.cc/blog/b6ba6ceca7cd1d99.jpeg)

## Materialization Model

The *materialization* model is a specialization of the iterator model where each operator processes its input all at once and then emits its output all at once. Instead of having a `next` function that returns a single tuple, each operator returns all of its tuples every time it is reached. To avoid scanning too many tuples, the DBMS can propagate down information about how many tuples are needed to subsequent operators (e.g. `LIMIT`). The operator “materializes” its output as a single result. The output can be either a whole tuple (NSM) or a subset of columns (DSM). A diagram of the materialization model is shown in Figure 2.

![9.jpg](https://images.spumn.eu.cc/blog/a597216219e3a0a2.jpeg)

![10.jpg](https://images.spumn.eu.cc/blog/538482ba3a819bab.jpeg)

Every query plan operator implements an `Output` function:
• The operator processes all the tuples from its children at once.
• The return result of this function is all the tuples that operator will ever emit. When the operator finishes executing, the DBMS never needs to return to it to retrieve more data.
This approach is better for OLTP workloads because queries typically only access a small number of tuples at a time. Thus, there are fewer function calls to retrieve tuples. The materialization model is not suited for OLAP queries with large intermediate results because the DBMS may have to spill those results to disk between operators.

![11.jpg](https://images.spumn.eu.cc/blog/c057914902280594.jpeg)

## Vectorization Model

Like the iterator model, each operator in the *vectorization* *model* implements a `Next` function. However, each operator emits a *batch* (i.e. vector) of data instead of a single tuple. The operator’s internal loop implementation is optimized for processing batches of data instead of a single item at a time. The size of the batch can vary based on hardware or query properties. See Figure 3 for an example of the vectorization model.

![12.jpg](https://images.spumn.eu.cc/blog/b68725ebc57f7382.jpeg)

The vectorization model approach is ideal for OLAP queries that have to scan a large number of tuples because there are fewer invocations of the `Next` function.
The vectorization model allows operators to more easily use **vectorized (SIMD) instructions** to process batches of tuples.

![13.jpg](https://images.spumn.eu.cc/blog/a3dbe420347c70b9.jpeg)

**Figure 3: Vectorization Model Example** – The vectorization model is very similar to the iterator model except at every operator, an output buffer is compared to the desired emission size. If the buffer is larger, then a tuple batch is sent up.

![14.jpg](https://images.spumn.eu.cc/blog/1056bdf34da28372.jpeg)

## Processing Direction

• **Approach #1: Top-to-Bottom**
– Start with the root and “pull” data from children to parents
– Tuples are always passed with function calls

• **Approach #2: Bottom-to-Top**
– Start with leaf nodes and “push” data from children to parents
– Allows for tighter control of caches / registers in operator pipelines

![15.jpg](https://images.spumn.eu.cc/blog/067da958c30a2551.jpeg)

# Access Methods

An *access method* is how the DBMS accesses the data stored in a table. In general, there are two approaches to access models; data is either read from a table or from an index with a sequential scan.

![16.jpg](https://images.spumn.eu.cc/blog/f15b1c096452f5e2.jpeg)

## Sequential Scan

The sequential scan operator iterates over every page in the table and retrieves it from the buffer pool. As the scan iterates over all the tuples on each page, it evaluates the predicate to decide whether or not to emit the tuple to the next operator.
The DBMS maintains an internal cursor that tracks the last page/slot that it examined.

![17.jpg](https://images.spumn.eu.cc/blog/70823dd5f052427c.jpeg)

A sequential table scan is almost always the least efficient method by which a DBMS may execute a query. There are a number of optimizations available to help make sequential scans faster:
• **Prefetching**: Fetch the next few pages in advance so that the DBMS does not have to block on storage I/O when accessing each page.
• **Buffer Pool Bypass**: The scan operator stores pages that it fetches from disk in its local memory instead of the buffer pool in order to avoid sequential flooding (比如一次scan需要读很多页面，这些页面基本都只用这一次，但是会把很多“热数据页”挤出buffer pool。).
• **Parallelization**: Execute the scan using multiple threads/processes in parallel.
• **Late Materialization**: DSM DBMSs can delay stitching together tuples until the upper parts of the query plan. This allows each operator to pass the minimal amount of information needed to the next operator (e.g. record ID, offset to record in column). This is only useful in column-store systems.
• **Heap Clustering**: Tuples are stored in the heap pages using an order specified by a clustering index.
• **Approximate Queries (Lossy Data Skipping):**  Execute queries on a sampled subset of the entire table to produce approximate results. This is typically done for computing aggregations in a scenario that allow a low error to produce a nearly accurate answer.
• **Zone Map (Lossless Data Skipping):**  Pre-compute aggregations for each tuple attribute **in a page**. The DBMS can then decide whether it needs to access a page by checking its Zone Map first. The Zone Maps for each page are stored in separate pages and there are typically multiple entries in each Zone Map page. Thus, it is possible to reduce the total number of pages examined in a sequential scan. Zone maps are particularly valuable in the cloud database systems where data transfer over a network incurs a bigger cost. See Figure 4 for an example of a Zone Map.

![18.jpg](https://images.spumn.eu.cc/blog/94888dd5234d0c8b.jpeg)

![19.jpg](https://images.spumn.eu.cc/blog/938d61dd35b66c28.jpeg)

![20.jpg](https://images.spumn.eu.cc/blog/802ed93567b33efe.jpeg)

**Figure 4: Zone Map Example** – The zone map stores pre-computed aggregates for values in a page. In the example above, the select query realizes from the zone map that the max value in the original data is only 400. Then, instead of having to iterate through every tuple in the page, the query can avoid accessing the page at all since none of the values will be greater than 600.

## Index Scan

In an *index scan*, the DBMS picks an index to find the tuples that a query needs.
There are many factors involved in the DBMSs’ index selection process, including:

- What attributes the index contains
- What attributes the query references
- The attribute’s value domains
- Predicate composition（**谓词即函数，返回值是真值**。但是在sql中， 真值并不只是true和false，还包含了第三种情况即：Null。）
- Whether the index has unique or non-unique keys

![21.jpg](https://images.spumn.eu.cc/blog/44a5ee3a7980da71.jpeg)

A simple example of an index scan is shown in Figure 5.

![22.jpg](https://images.spumn.eu.cc/blog/4c1e0bed80b5df5b.jpeg)

**Figure 5: Index Scan Example** – Consider a single table with 100 tuples and two indexes: age and department. In the first scenario, it is better to use the department index in the scan because it only has two tuples to match. Choosing the age index would not be much better than a simple sequential scan. In the second scenario, the age index would eliminate more unnecessary scans and is the optimal choice.

![23.jpg](https://images.spumn.eu.cc/blog/00b43eafb29febb9.jpeg)

More advanced DBMSs support multi-index scans. When using multiple indexes for a query, the DBMS computes sets of record IDs using **each** matching index, **combines** these sets based on the query’s predicates, and retrieves the records and apply any predicates that may remain. The DBMS can use bitmaps, hash tables, or Bloom filters to compute record IDs through set intersection. See Figure 6 for an example that makes use of a multi-index scan.

![24.jpg](https://images.spumn.eu.cc/blog/785eef863827e794.jpeg)

![25.jpg](https://images.spumn.eu.cc/blog/558f9cb2d3e1ff98.jpeg)

**Figure 6: Multi-Index Scan Example** – Consider the same table in Figure 5. With multi-index scan support, we first compute the sets of record IDs satisfying the predicate for age and dept, respectively, using the corresponding index. We then compute the intersection of the two sets, fetch the corresponding records, and apply the remaining predicate `country=’US’`.

# Modification Queries

Operators that modify the database (`INSERT`, `UPDATE`, `DELETE`) are responsible for checking constraints and updating indexes. For `UPDATE`/`DELETE`, child operators pass Record IDs for target tuples and must keep track of previously seen tuples.

![26.jpg](https://images.spumn.eu.cc/blog/ca57ea5fa9ead5c4.jpeg)

There are two implementation choices on how to handle `INSERT` operators:
•** Choice #1**:# Materialize tuples inside of the operator.
• **Choice #2:**  Operator inserts any tuple passed in from child operators.

![27.jpg](https://images.spumn.eu.cc/blog/23e6829f1637056a.jpeg)

## Halloween Problem

The Halloween Problem is an anomaly in which an update operation changes the physical location of a tuple, causing a scan operator to visit the tuple multiple times. This can occur on clustered tables or index scans.
This phenomenon was originally discovered by IBM researchers while building **System R** on Halloween day in 1976. The solution to this problem is to keep track of the modified record IDs for each query.

![28.jpg](https://images.spumn.eu.cc/blog/6309d92b6b87c4ae.jpeg)

![29.jpg](https://images.spumn.eu.cc/blog/c0abc7e8e52d510d.jpeg)

# Expression Evaluation

The DBMS represents a `WHERE` clause as an *expression tree* (see Figure 7 for an example). The nodes in the tree represent different expression types.
Some examples of expression types that can be stored in tree nodes:
• Comparisons (`=`, `<,` `>`, `!=`)
• Conjunction (`AND`), Disjunction (`OR`)
• Arithmetic Operators (`+`, `-`, `*`, `/`, `%`)
• Constant and Parameter Values
• Tuple Attribute References

![30.jpg](https://images.spumn.eu.cc/blog/ce83a192a99d9b4f.jpeg)

**Figure 7:**  **Expression Evaluation Example** – A `WHERE` clause and a diagram of its corresponding expression.

![31.jpg](https://images.spumn.eu.cc/blog/1012756c334fffa5.jpeg)

To evaluate an expression tree at runtime, the DBMS maintains a context handle that contains metadata for the execution, such as the current tuple, the parameters, and the table schema. The DBMS then walks the tree to evaluate its operators and produce a result.
Evaluating predicates in this manner is slow because the DBMS must traverse the entire tree and determine the correct action to take for each operator. A better approach is to just **evaluate the expression directly (think JIT compilation)** . Based on a internal cost model, the DBMS would determine whether code generation will be adopted to accelerate a query.

![32.jpg](https://images.spumn.eu.cc/blog/b25a7303a4b735e5.jpeg)

![33.jpg](https://images.spumn.eu.cc/blog/0726c097cfef4961.jpeg)

![34.jpg](https://images.spumn.eu.cc/blog/4937a70f2693bf36.jpeg)

![35.jpg](https://images.spumn.eu.cc/blog/daeb786894d1a478.jpeg)

![36.jpg](https://images.spumn.eu.cc/blog/cecb1746f1867a72.jpeg)

![37.jpg](https://images.spumn.eu.cc/blog/abd463a59ef860e6.jpeg)

![38.jpg](https://images.spumn.eu.cc/blog/788f4e01559fad1a.jpeg)

![39.jpg](https://images.spumn.eu.cc/blog/5db62c07d23aac4a.jpeg)

![40.jpg](https://images.spumn.eu.cc/blog/b22d64a1b7994f17.jpeg)

![41.jpg](https://images.spumn.eu.cc/blog/25b7c1d4df16c429.jpeg)

![42.jpg](https://images.spumn.eu.cc/blog/f3ebab70e1554dcf.jpeg)

![43.jpg](https://images.spumn.eu.cc/blog/19d6b8f787aec5ea.jpeg)

![44.jpg](https://images.spumn.eu.cc/blog/41bf9d9bf274c6bf.jpeg)

![45.jpg](https://images.spumn.eu.cc/blog/e52840c672cbd699.jpeg)
