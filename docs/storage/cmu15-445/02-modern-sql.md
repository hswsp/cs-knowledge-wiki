# 02 - Modern SQL

![0001.jpg](https://images.spumn.eu.cc/blog/325d813d0c941191.jpeg)

![0002.jpg](https://images.spumn.eu.cc/blog/d9d942c09a214fa4.jpeg)

## Relational Languages

Edgar Codd published a major paper on relational models in the early 1970s. Originally, he only deﬁned the mathematical notation for how a DBMS could execute queries on a relational model DBMS. The user only needs to specify the result that they want using a declarative language (i.e., SQL). The DBMS is responsible for determining the most efﬁcient plan to produce that answer. Relational algebra is based on **sets** (unordered, no duplicates). SQL is based on **bags** (unordered, allows duplicates).

## SQL History

Declarative query language for relational databases. It was originally developed in the 1970s as part of the IBM **System R** project. IBM originally called it “SEQUEL” (Structured English Query Language). The name changed in the 1980s to just “SQL” (Structured Query Language).

The language is comprised of different classes of commands:

1. **Data Manipulation Language (DML):** SELECT, INSERT, UPDATE, and DELETE statements.
2. \*\*Data Deﬁnition Language (DDL): \*\*Schema deﬁnitions for tables, indexes, views, and other objects.
3. \*\*Data Control Language (DCL): \*\*Security, access controls.

![0003.jpg](https://images.spumn.eu.cc/blog/227627dc110b09ee.jpeg)

![0004.jpg](https://images.spumn.eu.cc/blog/d8cee9a6ba0d0713.jpeg)

SQL is not a dead language. It is being updated with new features every couple of years. SQL-92 is the minimum that a DBMS has to support to claim they support SQL. Each vendor follows the standard to a certain degree but there are many proprietary extensions.

![0005.jpg](https://images.spumn.eu.cc/blog/c42289b669bbaab8.jpeg)

Some of the major updates released with each new edition of the SQL standard are shown below.

* SQL:1999 Regular expressions, Triggers
* SQL:2003 XML, Windows, Sequences
* SQL:2008 Truncation, Fancy sorting
* SQL:2011 Temporal DBs, Pipelined DML
* SQL:2016 JSON, Polymorphic tables

![0006.jpg](https://images.spumn.eu.cc/blog/a2d9db4e96e2fd1b.jpeg)

![0007.jpg](https://images.spumn.eu.cc/blog/4ecc0fcff5554b87.jpeg)

![0008.jpg](https://images.spumn.eu.cc/blog/afdc805c9860e290.jpeg)

## Joins

Combines columns from one or more tables and produces a new table. Used to express queries that involve data that spans multiple tables. Example: _Which students got an A in 15-721?_

```SQL
CREATE TABLE student (
  sid INT PRIMARY KEY,
  name VARCHAR(16),
  login VARCHAR(32) UNIQUE,
  age SMALLINT,
  gpa FLOAT
);

CREATE TABLE course (
  cid VARCHAR(32) PRIMARY KEY,
  name VARCHAR(32) NOT NULL
);

CREATE TABLE enrolled (
  sid INT REFERENCES student (sid),
  cid VARCHAR(32) REFERENCES course (cid),
  grade CHAR(1)
);
```

![0009.jpg](https://images.spumn.eu.cc/blog/33a75bb268d4df5f.jpeg)

```SQL
SELECT s.name
	FROM enrolled AS e, student AS s
WHERE e.grade = 'A' AND e.cid = '15-721'
	AND e.sid = s.sid;
```

## Aggregates

An aggregation function takes in a bag of tuples as its input and then produces a single scalar value as its output. **Aggregate functions can (almost) only be used in a SELECT output list.**

* AVG(COL): The average of the values in COL
* MIN(COL): The minimum value in COL
* MAX(COL): The maximum value in COL
* COUNT(COL): The number of tuples in the relation

![0010.jpg](https://images.spumn.eu.cc/blog/2e4f2a323492eba1.jpeg)

Example: _Get # of students with a ‘@cs’ login_. The following three queries are equivalent:

```SQL
SELECT COUNT(*) FROM student WHERE login LIKE '%@cs';

SELECT COUNT(login) FROM student WHERE login LIKE '%@cs';

SELECT COUNT(1) FROM student WHERE login LIKE '%@cs';
```

![0011.jpg](https://images.spumn.eu.cc/blog/eb14e553cd24c1e6.jpeg)

**A single SELECT statement can contain multiple aggregates**: Example: _Get # of students and their average GPA with a ‘@cs’ login_.

```SQL
SELECT AVG(gpa), COUNT(sid) FROM student WHERE login LIKE '%@cs';
```

![0012.jpg](https://images.spumn.eu.cc/blog/6cf795f5a988cf99.jpeg)

Some aggregate functions (e.g. COUNT, SUM, AVG) support the DISTINCT keyword: Example: _Get # of unique students and their average GPA with a ‘@cs’ login._

```SQL
SELECT COUNT(DISTINCT login) FROM student WHERE login LIKE '%@cs';
```

![0013.jpg](https://images.spumn.eu.cc/blog/024a9c5294edbe84.jpeg)

Output of other columns outside of an aggregate is **undeﬁned** (e.cid is undeﬁned below). Example: _Get the average GPA of students in each course._

```SQL
SELECT AVG(s.gpa), e.cid FROM enrolled AS e, student AS s WHERE e.sid = s.sid;
```

![0014.jpg](https://images.spumn.eu.cc/blog/491d08991a1e36c5.jpeg)

![0015.jpg](https://images.spumn.eu.cc/blog/65d375dfed831c17.jpeg)

Non-aggregated values in SELECT output clause must appear in GROUP BY clause.

```SQL
SELECT AVG(s.gpa), e.cid 
	FROM enrolled AS e, student AS s
WHERE e.sid = s.sid
	GROUP BY e.cid;
```

![0016.jpg](https://images.spumn.eu.cc/blog/a6006f54b50eca29.jpeg)

![0017.jpg](https://images.spumn.eu.cc/blog/7db5fe1012829cbf.jpeg)

![0018.jpg](https://images.spumn.eu.cc/blog/48ea5299a246b08e.jpeg)

![0019.jpg](https://images.spumn.eu.cc/blog/2c6c9b424abfdd4e.jpeg)

The HAVING clause ﬁlters output results based on aggregation computation. This make HAVING behave like a WHERE clause for a GROUP BY. Example: _Get the set of courses in which the average student GPA is greater than 3.9._

```SQL
SELECT AVG(s.gpa) AS avg_gpa, e.cid
	FROM enrolled AS e, student AS s
WHERE e.sid = s.sid
	GROUP BY e.cid
HAVING avg_gpa > 3.9;
```

**The above query syntax is supported by many major database systems, but is not compliant with the SQL standard**. To make the query standard compliant, we must repeat use of AVG(S.GPA) in the body of the HAVING clause.

```SQL
SELECT AVG(s.gpa), e.cid
	FROM enrolled AS e, student AS s
WHERE e.sid = s.sid
	GROUP BY e.cid
HAVING AVG(s.gpa) > 3.9;
```

![0020.jpg](https://images.spumn.eu.cc/blog/2fbe599ab2e0fc7a.jpeg)

![0021.jpg](https://images.spumn.eu.cc/blog/dfcfe97b9ca917e4.jpeg)

![0022.jpg](https://images.spumn.eu.cc/blog/f8355539a9234bf9.jpeg)

![0023.jpg](https://images.spumn.eu.cc/blog/8a43e814986e6d48.jpeg)

## String Operations

The SQL standard says that strings are \*\*case sensitive \*\*and **single-quotes only**. There are functions to manipulate strings that can be used in any part of a query.

![0024.jpg](https://images.spumn.eu.cc/blog/126fa77d7e400aa7.jpeg)

\*\*Pattern Matching: \*\*The LIKE keyword is used for string matching in predicates.

* “%” matches any substrings (including empty).
* “\_” matches any one character.

![0025.jpg](https://images.spumn.eu.cc/blog/b90eede4c7a43674.jpeg)

**String Functions SQL-92** deﬁnes string functions. Many database systems implement other functions in addition to those in the standard. Examples of standard string functions include `SUBSTRING(S, B, E)` and `UPPER(S)`.

![0026.jpg](https://images.spumn.eu.cc/blog/156676c39fbc7bcc.jpeg)

**Concatenation:** Two vertical bars (“||”) will concatenate two or more strings together into a single string.

![0027.jpg](https://images.spumn.eu.cc/blog/865c63c34d92c836.jpeg)

## Date and Time

Operations to manipulate DATE and TIME attributes. Can be used in either output or predicates. The speciﬁc syntax for date and time operations varies wildly across systems.

![0028.jpg](https://images.spumn.eu.cc/blog/d40c824de8e7c38c.jpeg)

## Output Redirection

Instead of having the result a query returned to the client (e.g., terminal), you can tell the DBMS to store the results into another table. You can then access this data in subsequent queries.

* **New Table:** Store the output of the query into a new (permanent) table.

```SQL
SELECT DISTINCT cid INTO CourseIds FROM enrolled;
```

* **Existing Table**: Store the output of the query into a table that already exists in the database. The target table must have the same number of columns with the same types as the target table, but the **names of the columns in the output query do not have to match**.

```SQL
INSERT INTO CourseIds (SELECT DISTINCT cid FROM enrolled);
```

![0029.jpg](https://images.spumn.eu.cc/blog/02f912c61c332c1e.jpeg)

![0030.jpg](https://images.spumn.eu.cc/blog/6d9a1376023ac9fd.jpeg)

![0031.jpg](https://images.spumn.eu.cc/blog/cc883592db49ebf9.jpeg)

## Output Control

Since results SQL are unordered, we must use the ORDER BY clause to impose a sort on tuples:

```SQL
SELECT sid, grade FROM enrolled WHERE cid = '15-721'
	ORDER BY grade;
```

The default sort order is ascending (ASC). We can manually specify DESC to reverse the order:

```SQL
SELECT sid, grade FROM enrolled WHERE cid = '15-721'
	ORDER BY grade DESC;
```

![0032.jpg](https://images.spumn.eu.cc/blog/b67be5a13daaf091.jpeg)

We can use multiple ORDER BY clauses to break ties or do more complex sorting:

```SQL
SELECT sid, grade FROM enrolled WHERE cid = '15-721'
ORDER BY grade DESC, sid ASC;
```

![0033.jpg](https://images.spumn.eu.cc/blog/c8a4a1c8f8af867e.jpeg)

We can also use any arbitrary expression in the ORDER BY clause:

```SQL
SELECT sid FROM enrolled WHERE cid = '15-721'
	ORDER BY UPPER(grade) DESC, sid + 1 ASC;
```

![0034.jpg](https://images.spumn.eu.cc/blog/c6357351882624d5.jpeg)

By default, the DBMS will return all of the tuples produced by the query. We can use the LIMIT clause to restrict the number of result tuples:

```SQL
SELECT sid, name FROM student WHERE login LIKE '%@cs'
	LIMIT 10;
```

We can also provide an \*\*offset \*\*to return a range in the results:

```SQL
SELECT sid, name FROM student WHERE login LIKE '%@cs'
	LIMIT 20 OFFSET 10;
```

Unless we use an ORDER BY clause with a LIMIT, \*\*the DBMS may produce different tuples in the result \*\*on each invocation of the query because the relational model does not impose an ordering.

![0035.jpg](https://images.spumn.eu.cc/blog/9717e064ff2c6af0.jpeg)

![0036.jpg](https://images.spumn.eu.cc/blog/7ed2d120b25453ea.jpeg)

## Nested Queries

Invoke queries inside of other queries to execute more complex logic within a single query. Nested queries are often difﬁcult to optimize. The scope of outer query is included in an inner query (i.e. the **inner query can access attributes from outer query**), but not the other way around. Inner queries can appear in almost any part of a query:

1. SELECT Output Targets:

```SQL
SELECT (SELECT 1) AS one FROM student;
```

1. FROM Clause:

```SQL
SELECT name
  FROM student AS s, (SELECT sid FROM enrolled) AS e
  WHERE s.sid = e.sid;
```

1. WHERE Clause:

```SQL
SELECT name FROM student
	WHERE sid IN ( SELECT sid FROM enrolled );
```

![0037.jpg](https://images.spumn.eu.cc/blog/bd2ca4011eae6a35.jpeg)

Example: _Get the names of students that are enrolled in ‘15-445’._

```SQL
SELECT name FROM student
WHERE sid IN (
SELECT sid FROM enrolled
WHERE cid = '15-445'
);
```

Note that _sid_ has different scope depending on where it appears in the query.

![0038.jpg](https://images.spumn.eu.cc/blog/30c0a00626a040d0.jpeg)

![0039.jpg](https://images.spumn.eu.cc/blog/e974562ce88bfa30.jpeg)

![0040.jpg](https://images.spumn.eu.cc/blog/798c15fc3bb80e06.jpeg)

Example: _Find student record with the highest id that is enrolled in at least one course._

```SQL
SELECT student.sid, name
  FROM student
  JOIN (SELECT MAX(sid) AS sid
  	FROM enrolled) AS max_e
  ON student.sid = max_e.sid;
```

### Nested Query Results Expressions:

* ALL: Must satisfy expression for all rows in sub-query.
* ANY: Must satisfy expression for at least one row in sub-query.
* IN: Equivalent to =`ANY()`.
* EXISTS: At least one row is returned.

Example: _Find all courses that have no students enrolled in it._

```SQL
SELECT * FROM course
  WHERE NOT EXISTS(
  	SELECT * FROM enrolled
  		WHERE course.cid = enrolled.cid
);
```

![0041.jpg](https://images.spumn.eu.cc/blog/542ac6de000b7425.jpeg)

![0042.jpg](https://images.spumn.eu.cc/blog/3886ded3228e5e78.jpeg)

![0043.jpg](https://images.spumn.eu.cc/blog/fe77eb7e48c833af.jpeg)

![0044.jpg](https://images.spumn.eu.cc/blog/95e8317b10c371e7.jpeg)

![0045.jpg](https://images.spumn.eu.cc/blog/a6a1801b4a05d423.jpeg)

![0046.jpg](https://images.spumn.eu.cc/blog/357e8b8df63497bc.jpeg)

![0047.jpg](https://images.spumn.eu.cc/blog/13c28a1c98c26beb.jpeg)

![0048.jpg](https://images.spumn.eu.cc/blog/c3365187b1384e0f.jpeg)

![0049.jpg](https://images.spumn.eu.cc/blog/86acbe7e7fbfb31a.jpeg)

![0050.jpg](https://images.spumn.eu.cc/blog/7cc22e04a51f1357.jpeg)

![0051.jpg](https://images.spumn.eu.cc/blog/9b034d8cb91d2649.jpeg)

## Window Functions

A window function perform “sliding” calculation across a set of tuples that are related. Like an aggregation but tuples are not grouped into a single output tuple. \*\*Functions: \*\*The window function can be any of the aggregation functions that we discussed above. There are also also special window functions:

1. `ROW_NUMBER`: The number of the current row.
2. `RANK`: The order position of the current row.

![0052.jpg](https://images.spumn.eu.cc/blog/dacce841fd959f31.jpeg)

![0053.jpg](https://images.spumn.eu.cc/blog/8df3ea35d73065dd.jpeg)

**Grouping:** The OVER clause speciﬁes how to group together tuples when computing the window function. Use **PARTITION BY** to specify group.

```SQL
SELECT cid, sid, ROW_NUMBER() OVER (PARTITION BY cid)
FROM enrolled ORDER BY cid;
```

![0054.jpg](https://images.spumn.eu.cc/blog/c7beb3f22a47ed9b.jpeg)

We can also put an **ORDER BY** within OVER to ensure a deterministic ordering of results even if database changes internally.

```SQL
SELECT *, ROW_NUMBER() OVER (ORDER BY cid)
FROM enrolled ORDER BY cid;
```

![0055.jpg](https://images.spumn.eu.cc/blog/530196f1f0edc1aa.jpeg)

**IMPORTANT:** The DBMS computes RANK after the window function sorting, whereas it computes ROW\_NUMBER before the sorting. Example: Find the student with the second highest grade for each course.

```SQL
SELECT * FROM (
	SELECT *, RANK() OVER (PARTITION BY cid
		ORDER BY grade ASC) AS rank
	FROM enrolled) AS ranking
WHERE ranking.rank = 2;
```

![0056.jpg](https://images.spumn.eu.cc/blog/f2221b87a6351213.jpeg)

## Common Table Expressions

Common Table Expressions (CTEs) are an alternative to windows or nested queries when writing more complex queries. They provide a way to write auxiliary statements for user in a larger query. CTEs can be thought of as a **temporary table** that is scoped to a single query. The \*\*WITH \*\*clause binds the output of the inner query to a temporary result with that name. Example: _Generate a CTE called cteName that contains a single tuple with a single attribute set to “1”. Select all attributes from this CTE. cteName._

```SQL
WITH cteName AS (
SELECT 1
)
SELECT * FROM cteName;
```

![0057.jpg](https://images.spumn.eu.cc/blog/66045718934143f5.jpeg)

We can bind output columns to names before the AS:

```SQL
WITH cteName (col1, col2) AS (
SELECT 1, 2
)
SELECT col1 + col2 FROM cteName;
```

A single query may contain multiple CTE declarations:

```SQL
WITH cte1 (col1) AS (SELECT 1), cte2 (col2) AS (SELECT 2)
SELECT * FROM cte1, cte2;
```

![0058.jpg](https://images.spumn.eu.cc/blog/e138f529f0cb8dcc.jpeg)

![0059.jpg](https://images.spumn.eu.cc/blog/e4d8d141c87253f3.jpeg)

![0060.jpg](https://images.spumn.eu.cc/blog/f15270390e3df545.jpeg)

Adding the **RECURSIVE** keyword after WITH allows a CTE to reference itself. This enables the implementation of recursion in SQL queries. With recursive CTEs, SQL is provably Turing-complete, implying that it is as computationally expressive as more general purpose programming languages (if a bit more cumbersome). Example: _Print the sequence of numbers from 1 to 10._

```SQL
WITH RECURSIVE cteSource (counter) AS (
  ( SELECT 1 )
  UNION
  ( SELECT counter + 1 FROM cteSource
  WHERE counter < 10 )
)
SELECT * FROM cteSource;
```

![0061.jpg](https://images.spumn.eu.cc/blog/c98ecc70473c9fda.jpeg)

![0062.jpg](https://images.spumn.eu.cc/blog/167a4c738df94aa9.jpeg)

![0063.jpg](https://images.spumn.eu.cc/blog/4c5a04f5479eae96.jpeg)

![0064.jpg](https://images.spumn.eu.cc/blog/2037d754db99db2b.jpeg)
