# 14 - Query Planning & Optimization

## 14 - Query Planning & Optimization

![1.jpg](https://images.spumn.eu.cc/blog/daf4e07793a8ac02.jpeg)

![2.jpg](https://images.spumn.eu.cc/blog/9ccea5e324415275.jpeg)

## Overview

![3.jpg](https://images.spumn.eu.cc/blog/a86d48a7ab980000.jpeg)

Because SQL is declarative, the query only tells the DBMS what to compute, but not how to compute it. Thus, the DBMS needs to translate a SQL statement into an executable query plan. But there are different ways to execute each operator in a query plan (e.g., join algorithms) and there will be differences in performance among these plans. The job of the DBMS’s optimizer is to pick an optimal plan for any given query.

![4.jpg](https://images.spumn.eu.cc/blog/6c98f9ac42caceda.jpeg)

![image-20240307214222707](https://images.spumn.eu.cc/blog/91ea7fe4613f35ab.png)

**Figure 1: Architecture Overview** – The application connected to the database system and sends a SQL query, which may be rewritten to a different format. The SQL string is parsed into tokens that make up the syntax tree. The binder converts named objects in the syntax tree to internal identiﬁers by consulting the system catalog. The binder emits a logical plan which may be fed to a tree rewriter for additional schema info. The logical plan is given to the optimizer which selects the most efﬁcient procedure to execute the plan.

The ﬁrst implementation of a query optimizer was IBM System R and was designed in the 1970s. Prior to this, people did not believe that a DBMS could ever construct a query plan better than a human. Many concepts and design decisions from the System R optimizer are still in use today. There are two high-level strategies for query optimization. The ﬁrst approach is to use static rules, or _**heuristics**_. Heuristics match portions of the query with known patterns to assemble a plan. These rules transform the query to remove inefﬁciencies. Although these rules may **require consultation of the catalog to understand the structure of the data, they never need to examine the data itself.** An alternative approach is to use _**cost-based search**_ to read the data and estimate the cost of executing equivalent plans. The cost model chooses the plan with the lowest cost. Query optimization is the most difﬁcult part of building a DBMS. Some systems have attempted to apply **machine learning** to improve the accuracy and efﬁciency of optimizers, but no major DBMS currently deploys an optimizer based on this technique.

![6.jpg](https://images.spumn.eu.cc/blog/f3d473c57c40ada3.jpeg)

### Logical vs. Physical Plans

The optimizer generates a mapping of a _**logical algebra expression**_ to the optimal equivalent physical algebra expression. The logical plan is roughly equivalent to the relational algebra expressions in the query.

**Physical operators** deﬁne a speciﬁc execution strategy **using an access path** for the different operators in the query plan. Physical plans may depend on the physical format of the data that is processed (i.e. sorting, compression).

There does not always exist a one-to-one mapping from logical to physical plans.

![7.jpg](https://images.spumn.eu.cc/blog/22d6d5fb41b77e5e.jpeg)

![8.jpg](https://images.spumn.eu.cc/blog/f50c32fc963c5c4f.jpeg)

## Logical Query Optimization

Some selection optimizations include:

* Perform ﬁlters as early as possible (predicate pushdown).
* **Reorder predicates** so that the DBMS applies the most selective one ﬁrst.
* Breakup a complex predicate and pushing it down (split conjunctive predicates).

An example of predicate pushdown is shown in ??.

Some projection optimizations include:

* Perform projections as early as possible to create smaller tuples and reduce intermediate results (_projection pushdown_).
* Project out all attributes except the ones requested or requires.

An example of projection pushdown in shown in Figure 2.

![Screen Shot 2023-04-13 at 10.47.54 AM.png](https://images.spumn.eu.cc/blog/ce9cba0d41f6598e.png)

**Figure 2: Projection Pushdown** – Since the query only asks for the student name and ID, the DBMS can remove all columns except for those two before applying the join.

![9.jpg](https://images.spumn.eu.cc/blog/26bb75183c7791c0.jpeg)

![10.jpg](https://images.spumn.eu.cc/blog/84b08fa3784140d7.jpeg)

![11.jpg](https://images.spumn.eu.cc/blog/a0c07e7c1df60dc6.jpeg)

![12.jpg](https://images.spumn.eu.cc/blog/d55006993be3ac3c.jpeg)

![13.jpg](https://images.spumn.eu.cc/blog/19e9cabcc8a7efc0.jpeg)

![14.jpg](https://images.spumn.eu.cc/blog/694c312e366fb3ac.jpeg)

The DBMS can also optimize nested sub-queries without referencing a cost model. There are two different approaches to this type of optimization:

• Re-write the query by de-correlating and / or ﬂattening it. An example of this is shown in Figure 6.

• Decompose the nested query and store the result to a temporary table. An example of this is shown in Figure 7.

![15.jpg](https://images.spumn.eu.cc/blog/04c5531d70760d76.jpeg)

![16.jpg](https://images.spumn.eu.cc/blog/77a892c2a89f45c1.jpeg)

**Figure 6: Subquery Optimization** - Rewriting The former query can be rewritten as the latter query by rewriting the subquery as a `JOIN`. Removing a level of nesting in this way effectively _ﬂattens_ the query.

![17.jpg](https://images.spumn.eu.cc/blog/9e05c810dc33e651.jpeg)

![18.jpg](https://images.spumn.eu.cc/blog/8c0d9de218be3b58.jpeg)

**Figure 7: Subquery Optimization - Decomposition** – For complex queries with subqueries, the DBMS optimizer may break up the original query into blocks and focus on optimizing each individual block at a a time. In this example, the optimizer decomposes a query with a nested aggregation by pulling the nested query out into its own query, and subsequently using this result to realize the logic of the original query.

![19.jpg](https://images.spumn.eu.cc/blog/11601d902cd9a0dc.jpeg)

![20.jpg](https://images.spumn.eu.cc/blog/3a8bf8c319425475.jpeg)

![21.jpg](https://images.spumn.eu.cc/blog/cd6cc1c7551c68f1.jpeg)

Another optimization that a DBMS can use is to remove impossible or _unnecessary predicates_. In this optimization, the DBMS elides evaluation of predicates whose result does not change per tuple in a table. Bypassing these predicates reduces computation cost. Figure 3 shows two examples of _unnecessary predicates_.

![22.jpg](https://images.spumn.eu.cc/blog/99b3cbc3749f778f.jpeg)

**Figure 3: Unnecessary Predicates** – The predicate in the ﬁrst query will always be false and can be disregarded. The former query can be rewritten as the latter query to produce the same result but save on computation.

![23.jpg](https://images.spumn.eu.cc/blog/8ba9f9efa9394213.jpeg)

![24.jpg](https://images.spumn.eu.cc/blog/dd4519913b8c3ee0.jpeg)

![25.jpg](https://images.spumn.eu.cc/blog/9fec823e1791414a.jpeg)

A similar optimization is merging predicates. An example of this optimization is shown in Figure 4.

![26.jpg](https://images.spumn.eu.cc/blog/4e72d41900bddbf3.jpeg)

**Figure 4: Merging Predicates** – The WHERE predicate in query 1 has redundancy as what it is searching for is any value between 1 and 150. Query 2 shows the more succinct way to express request in query 1.

The ordering of `JOIN` operations is a key determinant of query performance. Exhaustive enumeration of all possible join orders is inefﬁcient, so join-ordering optimization requires a cost model. However, we can still eliminate _unnecessary joins_ with a heuristic approach to optimization. An example of join elimination is shown in Figure 5.

![Screen Shot 2023-04-13 at 11.20.23 AM.png](https://images.spumn.eu.cc/blog/03ceaa04cdcfeafc.png)

**Figure 5: Join Elimination** – The join in query 1 is wasteful because every tuple in A must exist in A. Query 1 can instead be written as query 2.

![27.jpg](https://images.spumn.eu.cc/blog/9dd16c2de512ed56.jpeg)

## Cost Estimations

DBMS’s use cost models to estimate the cost of executing a plan. These models evaluate equivalent plans for a query to help the DBMS select the most optimal one.

The cost of a query depends on several underlying metrics, including:

• **CPU**: small cost, but tough to estimate.

• **Disk I/O**: the number of block transfers.

• **Memory**: the amount of DRAM used.

![28.jpg](https://images.spumn.eu.cc/blog/3bf7b1311b72dd40.jpeg)

![29.jpg](https://images.spumn.eu.cc/blog/703671c3869170d8.jpeg)

Exhaustive enumeration of all valid plans for a query is much too slow for an optimizer to perform. For joins alone, which are commutative and associative, there are $4^n$ different orderings of every n-way join. Optimizers must limit their search space in order to work efﬁciently.

To approximate costs of queries, DBMS’s maintain internal _statistics_ about tables, attributes, and indexes in their internal catalogs. Different systems maintain these statistics in different ways. Most systems attempt to avoid on-the-ﬂy computation by maintaining an internal table of statistics. These internal tables may then be updated in the background.

For each relation $R$, the DBMS maintains the following information:

* $N\_R$: Number of tuples in R
* $V (A, R)$: Number of distinct values of attribute A

With the information listed above, the optimizer can derive the selection _cardinality_ $SC(A, R)$ statistic. The selection cardinality is the average number of records with a value for an attribute $A$ given $\frac{N\_R}{V (A,R)}$ . Note that this assumes data uniformity. This assumption is often incorrect, but it simpliﬁes the optimization process.

![30.jpg](https://images.spumn.eu.cc/blog/39c117bc8300b372.jpeg)

![31.jpg](https://images.spumn.eu.cc/blog/429061bcd2bd5ae1.jpeg)

### Selection Statistics

![32.jpg](https://images.spumn.eu.cc/blog/f6ea56eac792fc41.jpeg)

The **selection cardinality** can be used to determine the number of tuples that will be selected for a given input.

Equality predicates on unique keys are simple to estimate (see Figure 8). A more complex predicate is shown in Figure 9.

![Screen Shot 2023-04-13 at 11.40.40 AM.png](https://images.spumn.eu.cc/blog/1588c938cf50f77b.png)

**Figure 8: Simple Predicate Example** – In this example, determining what index to use is easy because the query contains an equality predicate on a unique key.

![Screen Shot 2023-04-13 at 11.40.45 AM.png](https://images.spumn.eu.cc/blog/18555b3e6e268c58.png)

**Figure 9: Complex Predicate Example** – More complex predicates, such as range or conjunctions, are harder to estimate because the selection cardinalities of the predicates must be combined in non-trivial ways.

![33.jpg](https://images.spumn.eu.cc/blog/ae26520b3277e21f.jpeg)

The _selectivity_ (sel) of a predicate P is the fraction of tuples that qualify. The formula used to compute selective depends on the type of predicate. Selectivity for complex predicates is hard to estimate accurately which can pose a problem for certain systems. An example of a selectivity computation is shown in Figure 10.

![Screen Shot 2023-04-13 at 11.48.36 AM.png](https://images.spumn.eu.cc/blog/793e4f694894801c.png)

**Figure 10: Selectivity of Negation Query Example** – The selectivity of the negation query is computed by subtracting the selectivity of the positive query from 1. In the example, the answer comes out to be $\frac{4}{5}$ which is accurate.

![34.jpg](https://images.spumn.eu.cc/blog/31ce95720aa7a6aa.jpeg)

Observe that the **selectivity** of a predicate is equivalent to the probability of that predicate. This allows probability rules to be applied in many selectivity computations. This is particularly useful when dealing with complex predicates. For example, if we assume that multiple predicates involved in a conjunction are _independent_, we can compute the total selectivity of the conjunction as the product of the selectivities of the individual predicates.

![35.jpg](https://images.spumn.eu.cc/blog/6edb9b2bdbbcc782.jpeg)

### Selectivity Computation Assumptions

In computing the selection cardinality of predicates, the following three assumptions are used.

* **Uniform Data**: The distribution of values (except for the heavy hitters) is the same.
* **Independent Predicates**: The predicates on attributes are independent.
* **Inclusion Principle:** The domain of join keys overlap such that each key in the inner relation will also exist in the outer table.

These assumptions are often not satisﬁed by real data. For example, _correlated attributes_ break the assumption of independence of predicates.

![36.jpg](https://images.spumn.eu.cc/blog/f7704e689125e972.jpeg)

## Histograms

![37.jpg](https://images.spumn.eu.cc/blog/b16e94cd4336f7d3.jpeg)

![38.jpg](https://images.spumn.eu.cc/blog/e50a7849c08523f7.jpeg)

Real data is often skewed and is tricky to make assumptions about. However, storing every single value of a data set is expensive. One way to reduce the amount of memory used by storing data in a _histogram_ to group together values. An example of a graph with buckets is shown in Figure 11.

![39.jpg](https://images.spumn.eu.cc/blog/b3c021004cde5aae.jpeg)

![40.jpg](https://images.spumn.eu.cc/blog/18b6413e60cb1ebc.jpeg)

**Figure 11: Equi-Width Histogram**: The ﬁrst ﬁgure shows the original frequency count of the entire data set. The second ﬁgure is an equi-width histogram that combines together the counts for adjacent keys to reduce the storage overhead.

![41.jpg](https://images.spumn.eu.cc/blog/73ac3749d80e4ac8.jpeg)

Another approach is to use a equi-depth histogram that varies the width of buckets so that the **total number of occurrences for each bucket is roughly the same**. An example is shown in Figure 12.

![42.jpg](https://images.spumn.eu.cc/blog/66c3d682fc689e75.jpeg)

![43.jpg](https://images.spumn.eu.cc/blog/1d1d0256cf31ecc8.jpeg)

**Figure 12: Equi-Depth Histogram** – To ensure that each bucket has roughly the same number of counts, the histogram varies the range of each bucket.

In place of histograms, some systems may use _sketches_ to generate approximate statistics about a data set.

![44.jpg](https://images.spumn.eu.cc/blog/caa5ba59bf367c9e.jpeg)

## Sampling

DBMS’s can use _sampling_ to apply predicates to a smaller copy of the table with a similar distribution (see Figure 13). The DBMS updates the sample whenever the amount of changes to the underlying table exceeds some threshold (e.g., 10% of the tuples).

![45.jpg](https://images.spumn.eu.cc/blog/bb241948b55f1fb3.jpeg)

**Figure 13: Sampling** – Instead of using one billion values in the table to estimate selectivity, the DBMS can derive the selectivities for predicates from a subset of the original table.

![46.jpg](https://images.spumn.eu.cc/blog/f962cd3ab74fba4b.jpeg)

![47.jpg](https://images.spumn.eu.cc/blog/db0c19301e56aa4e.jpeg)

## Single-Relation Query Plans

For single-relation query plans, the biggest obstacle is choosing the best access method (i.e., sequential scan, binary search, index scan, etc.) Most new database systems just use heuristics, instead of a sophisticated cost model, to pick an access method.

For OLTP queries, this is especially easy because they are sargable (Search Argument Able), which means that there exists a best index that can be selected for the query. This can also be implemented with simple heuristics.

![48.jpg](https://images.spumn.eu.cc/blog/e273caeb8ad0eda5.jpeg)

![49.jpg](https://images.spumn.eu.cc/blog/de6879cecae8acb0.jpeg)

## Multi-Relation Query Plans

For Multi-Relation query plans, as number of joins increases, the number of alternative plans grow rapidly. Consequently, it is important to restrict the search space so as to be able to ﬁnd the optimal plan in a reasonable amount of time. There are two ways to approach this search problem:

* **Bottom-up**: Start with nothing and then build up the plan to get to the outcome that you want. Examples: IBM System R, DB2, MySQL, Postgres, most open-source DBMSs.
* **Top-down**: Start with the outcome that you want, and then work down the tree to ﬁnd the optimal plan that gets you to that goal. Examples: MSSQL, Greenplum, CockroachDB, Volcano

![50.jpg](https://images.spumn.eu.cc/blog/c02f7d4a13272532.jpeg)

### Bottom-up optimization example - System R

Use static rules to perform initial optimization. Then use dynamic programming to determine the best join order for tables using a divide-and conquer search method.

* Break query up into blocks and generate the logical operators for each block.
* For each logical operator, generate a set of physical operators that implement it.
* Then, iteratively construct a ”left-deep” tree that minimizes the estimated amount of work to execute the plan

![51.jpg](https://images.spumn.eu.cc/blog/1adb1bfd298b7b4f.jpeg)

![52.jpg](https://images.spumn.eu.cc/blog/33bac8b416934c4e.jpeg)

![53.jpg](https://images.spumn.eu.cc/blog/878215993240391d.jpeg)

![54.jpg](https://images.spumn.eu.cc/blog/b2cd07f69f8c0c25.jpeg)

![55.jpg](https://images.spumn.eu.cc/blog/da540c4e0e012c31.jpeg)

![56.jpg](https://images.spumn.eu.cc/blog/7e77ace1036fa86c.jpeg)

![57.jpg](https://images.spumn.eu.cc/blog/99f4b50db7830783.jpeg)

![58.jpg](https://images.spumn.eu.cc/blog/a91d9e9bbdf4de56.jpeg)

![59.jpg](https://images.spumn.eu.cc/blog/c4cdb9a732dbc00d.jpeg)

### Top-down optimization example - Volcano

Start with a logical plan of what we want the query to be. Perform a branch-and-bound search to traverse the plan tree by converting logical operators into physical operators.

* Keep track of global best plan during search.
* Treat physical properties of data as ﬁrst-class entities during planning.

![60.jpg](https://images.spumn.eu.cc/blog/d6f2212851545c9b.jpeg)

![61.jpg](https://images.spumn.eu.cc/blog/a64fba520f9c880e.jpeg)

![62.jpg](https://images.spumn.eu.cc/blog/9f5f7ae2c5693f1f.jpeg)

![63.jpg](https://images.spumn.eu.cc/blog/70a16b8de8a0214f.jpeg)

![64.jpg](https://images.spumn.eu.cc/blog/2c2167c6ed3ccedb.jpeg)

![65.jpg](https://images.spumn.eu.cc/blog/4225aa12db83f51e.jpeg)

![66.jpg](https://images.spumn.eu.cc/blog/bb12d8f9312c4b58.jpeg)

![67.jpg](https://images.spumn.eu.cc/blog/77e65185874fd8ea.jpeg)

![68.jpg](https://images.spumn.eu.cc/blog/7df0c044946086d4.jpeg)

![69.jpg](https://images.spumn.eu.cc/blog/1149f4f314be7d2d.jpeg)

![70.jpg](https://images.spumn.eu.cc/blog/c8a6c1f65065f5d9.jpeg)

![71.jpg](https://images.spumn.eu.cc/blog/c1e7cedd65c50426.jpeg)

![72.jpg](https://images.spumn.eu.cc/blog/37141dbe657c7f62.jpeg)

![73.jpg](https://images.spumn.eu.cc/blog/8cb5c260efc79576.jpeg)

![74.jpg](https://images.spumn.eu.cc/blog/4b94b8227237c211.jpeg)

![75.jpg](https://images.spumn.eu.cc/blog/e22945b569803906.jpeg)

![76.jpg](https://images.spumn.eu.cc/blog/8ee2fbedf97079ea.jpeg)
