# 24 - Embedded Database Logic

![1.jpg](https://images.spumn.eu.cc/blog/9912ffd5bad58426.jpg)

![2.jpg](https://images.spumn.eu.cc/blog/0700beb2b34477d8.jpg)

## Motivation

Until now, we have assumed that all of the logic for an application is located in the application itself. Most applications interact with the DBMS using a “conversational” API (e.g., JDBC, ODBC). This is where the application sends a query request to the DBMS and then waits for a response. After the DBMS sends a response, it then waits for the next request from the application for that connection.

It may be possible to move complex application logic into the DBMS to avoid multiple network round-trips. Doing this can improve efficiency, responsiveness, and reusability in the application.

The downside of these methods is that the syntax is often not portable across different DBMSs. And depending on the engineering practices of an organization, you may need to maintain different versions of the embedded database logic.

![3.jpg](https://images.spumn.eu.cc/blog/f409fc83a1d3e094.jpg)

![4.jpg](https://images.spumn.eu.cc/blog/4cf6f033a12e3e4c.jpg)

![5.jpg](https://images.spumn.eu.cc/blog/f5e1a974dfeedea2.jpg)

![6.jpg](https://images.spumn.eu.cc/blog/cd8843d391c906b5.jpg)

![7.jpg](https://images.spumn.eu.cc/blog/629ef9abfe4ec533.jpg)

![8.jpg](https://images.spumn.eu.cc/blog/3c973926537f9d18.jpg)

![9.jpg](https://images.spumn.eu.cc/blog/6d65fe765c05d92c.jpg)

![10.jpg](https://images.spumn.eu.cc/blog/03ed6c22e5261bd9.jpg)

## User-Defined Functions

A _user defined function_ is a function written by the application developer that extends the system’s functionality beyond its built-in operations. Each function takes in scalar input arguments, performs some computation, and then returns a result (scalar, table). A UDF can only be invoked as part of a SQL statement.

![11.jpg](https://images.spumn.eu.cc/blog/d0ce17da315bac32.jpg)

Return Types:

• **Scalar Functions**: Return a single data value.

• **Table Functions**: Return a single result table.

Function Body:

• **SQL Functions:** A SQL-based UDF contains a list of SQL statements that the DBMS executes in order when the UDF is invoked. The UDF returns whatever the result of the last query is.

• **Native Programming Language**: The developer can write a UDF in a language that is natively supported by the DBMS. Examples: _SQL/PSM_ (SQL Standard), _PL/SQL_ (Oracle, DB2), _PL/pgSQL_ (Postgres), _Transact-SQL_ (MSSQL/Sybase).

• **External Programming Language**: UDFs written in more conventional programming languages (e.g., C, Java, JavaScript, Python) run a separate process (i.e., sandbox) to prevent them from crashing the DBMS process.

![12.jpg](https://images.spumn.eu.cc/blog/520aab87201928e7.jpg)

![13.jpg](https://images.spumn.eu.cc/blog/26a3e0743ecc5b6a.jpg)

![14.jpg](https://images.spumn.eu.cc/blog/388ab1a38cdb3270.jpg)

![15.jpg](https://images.spumn.eu.cc/blog/3a3e27d41d9a6e4f.jpg)

![16.jpg](https://images.spumn.eu.cc/blog/cabb6335d4287a21.jpg)

![17.jpg](https://images.spumn.eu.cc/blog/176f1a0dfa89ccae.jpg)

![18.jpg](https://images.spumn.eu.cc/blog/91faeea9b8cd0a04.jpg)

![19.jpg](https://images.spumn.eu.cc/blog/9d5006fbdb868dec.jpg)

![20.jpg](https://images.spumn.eu.cc/blog/fa1b1e81a28c1f20.jpg)

![21.jpg](https://images.spumn.eu.cc/blog/28bc763daa393408.jpg)

Using UDFs have some advantages:

• **Modularity and Code Reuse**: Different queries can reuse the same application logic without requiring reimplementation.

• **Reduced Network Overhead**: Queries will incur fewer network round-trips between the application server and DBMS for complex operations.

• **Readability**: Some types of application logic are easier to express and read as UDFs than SQL.

![22.jpg](https://images.spumn.eu.cc/blog/9d3d559c0e635848.jpg)

However, there are important pitfalls to be aware of when considering using a UDF:

• **Black Boxes**: UDFs are often treated as black boxes by query optimizers so you cannot estimate their cost.

• **Lack of Parallelism**: Parallelizing queries is challenging as a sequence of queries may be correlated. Some UDFs will incrementally construct the sequence of queries as they run. Some DBMSs will only use a single thread to execute queries with a UDF.

Complex UDFs executed iteratively without system optimizations can be very slow.

![23.jpg](https://images.spumn.eu.cc/blog/7586c1d134b9b020.jpg)

![24.jpg](https://images.spumn.eu.cc/blog/b931cc9b22c2b12b.jpg)

![25.jpg](https://images.spumn.eu.cc/blog/6118b3da2651d1cb.jpg)

![26.jpg](https://images.spumn.eu.cc/blog/02dc7915d89a3721.jpg)

## Stored Procedures

A _stored procedure_ is a self-contained function that performs more complex logic inside of the DBMS. Unlike a UDF, a stored procedure can be invoked on its own without having to **be part of a SQL statement.**

UDFs are also usually meant to be read-only, while stored procedures are allowed to modify the DBMS.

![27.jpg](https://images.spumn.eu.cc/blog/1187ee0dff74d720.jpg)

![28.jpg](https://images.spumn.eu.cc/blog/fbe031abb61813fa.jpg)

![29.jpg](https://images.spumn.eu.cc/blog/4d78c670b2ce263f.jpg)

![30.jpg](https://images.spumn.eu.cc/blog/2921fe0146bd0220.jpg)

![31.jpg](https://images.spumn.eu.cc/blog/41b0e88ce734df23.jpg)

## Triggers

A _trigger_ instructs the DBMS to invoke a UDF when some event occurs in the database. Some examples of trigger usage are constraint checking or auditing any time a tuple is modified in a table.

Each trigger is defined with the following properties:

• **Event Type**: Type of modification (`INSERT`, `UPDATE`, `DELETE`, `ALTER`).

• **Event Scope**: Scope of the modification (`TABLE`, `DATABASE`, `VIEW`).

• **Timing**: When the trigger should be activated based on statement (before, after, instead of).

![32.jpg](https://images.spumn.eu.cc/blog/9b52ff5e385aa39e.jpg)

![33.jpg](https://images.spumn.eu.cc/blog/c2caa5e065f2c57b.jpg)

![34.jpg](https://images.spumn.eu.cc/blog/0f6da20813031a1a.jpg)

![35.jpg](https://images.spumn.eu.cc/blog/8f4d6fcf445784b1.jpg)

![36.jpg](https://images.spumn.eu.cc/blog/f3dc7b307e371ed2.jpg)

## Change Notifications

A _change notification_ is like a trigger except that the DBMS sends a message to an external entity that something notable has happened in the database. They can be chained with a trigger to pass along whenever a change occurs. Notifications are asynchronous, meaning that they are only pushed to listening connection whenever they interact with the DBMS. Some ORMs will poll the DBMS with lightweight “`SELECT 1`” every so often to retrieve new notifications.

Commands:

• `LISTEN`: The connection registers with the DBMS to listen for notifications at the named event queue.

• `NOTIFY`: Push a notification to any connection that is listening at named event queue. Syntax details vary per DBMS implementation.

![37.jpg](https://images.spumn.eu.cc/blog/b9521599c1f07e89.jpg)

![38.jpg](https://images.spumn.eu.cc/blog/9e657ba249fa8435.jpg)

![39.jpg](https://images.spumn.eu.cc/blog/7b56ea6e19275322.jpg)

![40.jpg](https://images.spumn.eu.cc/blog/117c9e2f207be253.jpg)

## User-Defined Types

Most DBMSs support the basic primitive types defined in the SQL standard (e.g., ints, floats, varchars). But sometimes that application wants to store complex types that are comprised of multiple primitive types. Or these complex types might have different behaviors for various arithmetic operators.

One potential solution is to store split the complex type and store each of its primitive element as its own attribute in the table. The problem with this is that you have to make sure that the application knows how to split/combine the complex type.

Another solution is to let the **application** **serialize** the complex type (e.g., Java “serialize”, Python “pickle”, Google Protobufs) and **store it as a blob in the database**. The problem with this approach is that it not possible to edit sub-attributes in the type without first deserializing the entire blob. Likewise, the DBMS’s optimizer is unable estimate selectivity on predicates that access serialized data.

![41.jpg](https://images.spumn.eu.cc/blog/00d45f011888ca10.jpg)

A better approach is to use a _user-defined type_ (UDT). This is a special data type that is defined by the application developer that the DBMS can be stored natively. Each DBMS exposes a different API that allows you to create a UDT. This allows you override basic operators and functions.

![42.jpg](https://images.spumn.eu.cc/blog/5744b4728c6dc78e.jpg)

![43.jpg](https://images.spumn.eu.cc/blog/3495a030479985ec.jpg)

## Views

A database views is “virtual” table that contains the output from a `SELECT` query. The view can then be accessed as if it was a real table. Under the hood, queries on views are converted into a single query using the original query that generated view. Views allow programmers to simplify a complex query that is executed often. It is often also used as a mechanism for hiding a subset of a table’s attributes from certain users. One can only update a view if it only contains a **single** based table, and that it does not contain aggregations, distinctions, union, or grouping.

Unlike `SELECT...INTO`, a view does not allocate a table to store the result of the view. A _materialized_ _view_ maintains the result of a view internally that may be automatically updated when the underlying tables change.

![44.jpg](https://images.spumn.eu.cc/blog/ef1104a8bc29b700.jpg)

![45.jpg](https://images.spumn.eu.cc/blog/c54142721437378c.jpg)

![46.jpg](https://images.spumn.eu.cc/blog/141235665c61c154.jpg)

![47.jpg](https://images.spumn.eu.cc/blog/165657f4ba212035.jpg)

![48.jpg](https://images.spumn.eu.cc/blog/985160379d1f6880.jpg)

![49.jpg](https://images.spumn.eu.cc/blog/5d3978b0a2f2f450.jpg)

![50.jpg](https://images.spumn.eu.cc/blog/00984392ef569ded.jpg)
