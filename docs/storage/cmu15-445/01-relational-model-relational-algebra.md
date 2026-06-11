# 01 - Relational Model & Relational Algebra

![01-introduction\_1.png](https://images.spumn.eu.cc/blog/2a299dec5bad6211.png)

![01-introduction\_2.png](https://images.spumn.eu.cc/blog/2a36e2e25da02a23.png)

![01-introduction\_3.png](https://images.spumn.eu.cc/blog/4b5466813eed6dbd.png)

![01-introduction\_4.png](https://images.spumn.eu.cc/blog/62fbe70492a2d760.png)

![01-introduction\_5.png](https://images.spumn.eu.cc/blog/1bc35865eb31f1e7.png)

![01-introduction\_6.png](https://images.spumn.eu.cc/blog/27c343952ba63c0b.png)

![01-introduction\_7.png](https://images.spumn.eu.cc/blog/eaefe96b40957be9.png)

![01-introduction\_8.png](https://images.spumn.eu.cc/blog/b020a8aabdacc00a.png)

![01-introduction\_9.png](https://images.spumn.eu.cc/blog/830ea0c214910fcf.png)

![01-introduction\_10.png](https://images.spumn.eu.cc/blog/3352f8f4fcebd829.png)

![01-introduction\_11.png](https://images.spumn.eu.cc/blog/09e659ee26eadcf0.png)

![01-introduction\_12.png](https://images.spumn.eu.cc/blog/de67df8c42173af8.png)

![01-introduction\_13.png](https://images.spumn.eu.cc/blog/ca51c51492614c28.png)

## DataBase

A database is an organized collection of inter-related data that models some aspect of the real-world (e.g., modeling the students in a class or a digital music store). People often confuse “databases” with “database management systems” (e.g., MySQL, Oracle, MongoDB, Snowflake). A database management system (DBMS) is the software that manages a database.

![01-introduction\_14.png](https://images.spumn.eu.cc/blog/f5b0ab957eb3e590.png)

Consider a database that models a digital music store (e.g., Spotify). Let the database hold information about the artists and which albums those artists have released.

![01-introduction\_15.png](https://images.spumn.eu.cc/blog/144e92bf1244535a.png)

## Flat File Strawman

Database is stored as comma-separated value (CSV) files that the DBMS manages. Each entity will be stored in its own file. The application has to parse files each time it wants to read or update records.

![01-introduction\_16.png](https://images.spumn.eu.cc/blog/9fac86616fe9a049.png)

Keeping along with the digital music store example, there would be two files: one for artist and the other for album. Each entity has its own set of attributes, so in each file, different records are delimited by new lines, while each of the corresponding attributes within a record are delimited by a comma. E.g.: An artist could have a name, year, and country attributes, while an album has name, artist and year attributes. Below is an example CSV file for information about artists with the schema (name, year, country):

![01-introduction\_17.png](https://images.spumn.eu.cc/blog/4a600dbdf8d44bd6.png)

![01-introduction\_18.png](https://images.spumn.eu.cc/blog/01d444fb6588b759.png)

### Issues with Flat File

#### Data Integrity

* How do we ensure that the artist is the same for each album entry?
* What if somebody overwrites the album year with an invalid string?
* How do we treat multiple artists on one album?
* What happens when we delete an artist with an album?

![01-introduction\_19.png](https://images.spumn.eu.cc/blog/f52a622ba6658080.png)

#### Implementation

* How do we find a particular record?
* What if we now want to create a new application that uses the same database?
* What if two threads try to write to the same file at the same time?

![01-introduction\_20.png](https://images.spumn.eu.cc/blog/8844bf532e0cac29.png)

#### Durability

* What if the machine crashes while our program is updating a record?
* What if we want to replicate the database on multiple machines for high availability?

![01-introduction\_21.png](https://images.spumn.eu.cc/blog/7a6ba1e3f4d6fd6e.png)

## Database Management System

A DBMS is a software that allows applications to store and analyze information in a database. A general-purpose DBMS is designed to allow the definition, creation, querying, update, and administration of databases in accordance with some data model.

![01-introduction\_22.png](https://images.spumn.eu.cc/blog/fd6d086ab484ec96.png)

A data model is a collection of concepts for describing the data in database.

* Examples: relational (most common), NoSQL (key/value, graph), array/matrix/vectors

**A schema is a description of a particular collection of data based on a data model.**

![01-introduction\_24.png](https://images.spumn.eu.cc/blog/04f9af4c7038ea71.png)

### Early DBMSs

Database applications were difficult to build and maintain because there was a tight coupling between logical and physical layers.

The logical layer describes which entities and attributes the database has while the physical layer is how those entities and attributes are being stored. Early on, the physical layer was defined in the application code, so if we wanted to change the physical layer the application was using, we would have to change all of the code to match the new physical layer.

![01-introduction\_25.png](https://images.spumn.eu.cc/blog/e4cdf8e01c6128dc.png)

## Relational Model

Ted Codd noticed that people were rewriting DBMSs every time they wanted to change the physical layer, so in 1970 he proposed the relational model to avoid this.

![01-introduction\_27.png](https://images.spumn.eu.cc/blog/5c48a9eaedb46dfa.png)

The relational model defines a database abstraction based on relations to avoid maintenance overhead. It has three key points:

* Store database in simple data structures (relations).
* Access data through high-level language, **DBMS figures out best execution strategy**.
* Physical storage left up to the DBMS implementation.

![01-introduction\_28.png](https://images.spumn.eu.cc/blog/53a675c82c9428c6.png)

The relational data model defines three concepts:

* **Structure**: The definition of relations and their contents. This is the attributes the relations have and the values that those attributes can hold.
* **Integrity**: Ensure the database’s contents satisfy constraints. An example constraint would be that any value for the year attribute has to be a number.
* **Manipulation**: How to access and modify a database’s contents.

![01-introduction\_29.png](https://images.spumn.eu.cc/blog/17f8b4ff851876b9.png)

**A \_relation**\*\*\* is an unordered set\*\* that contains the relationship of attributes that represent entities. Since the relationships are unordered, the DBMS can store them in any way it wants, allowing for optimization. \*\*A \*\*\*\*\*tuple\*\*\*\*​ **\_** is a set of attribute values \*\*(also known as its _domain_) in the relation. Originally, values had to be atomic or scalar, but **now values can also be lists or nested data structures**. Every attribute can be a special value, NULL, which means for a given tuple the attribute is undefined. A relation with n attributes is called an _**n-ary relation.**_

![01-introduction\_30.png](https://images.spumn.eu.cc/blog/e9c247a321aaab91.png)

### Keys

A relation’s primary key uniquely identifies a single tuple. Some DBMSs automatically create an internal primary key if you do not define one. A lot of DBMSs have support for autogenerated keys so an application does not have to manually increment the keys, but a primary key is still required for some DBMSs.

![01-introduction\_31.png](https://images.spumn.eu.cc/blog/a759e3f94f5b8a48.png)

![01-introduction\_32.png](https://images.spumn.eu.cc/blog/5bcc56481358b6b6.png)

A _foreign key_ specifies that an attribute from one relation has to map to a tuple in another relation.

![01-introduction\_33.png](https://images.spumn.eu.cc/blog/74913f8dbca773b9.png)

![01-introduction\_34.png](https://images.spumn.eu.cc/blog/13d927b5cb7a3716.png)

## Data Manipulation Languages (DMLs)

Methods to store and retrieve information from a database. There are two classes of languages for this:

* **Procedural**: The query specifies the (high-level) strategy the DBMS should use to find the desired result based on sets / bags. (relational algebra)
* **Non-Procedural (Declarative)** : The query specifies only what data is wanted and not how to find it.(relational calculus)

![01-introduction\_35.png](https://images.spumn.eu.cc/blog/55289ff8fc1c23f0.png)

## Relational Algebra

_Relational Algebra_ is a set of fundamental operations to retrieve and manipulate tuples in a relation. Each operator takes in one or more relations as inputs, and outputs a new relation. To write queries we can “chain” these operators together to create more complex operations.

![01-introduction\_36.png](https://images.spumn.eu.cc/blog/58be10fa915319b4.png)

### Select

Select takes in a relation and outputs a subset of the tuples from that relation that satisfy a selection predicate. The predicate acts like a filter, and we can combine multiple predicates using conjunctions and disjunctions. Syntax: $σ\_{predicate} (R)$. Example: $σ\_{a\_id}=’a2’ (R)$ SQL: `SELECT * FROM R WHERE a_id = 'a2'`

![01-introduction\_37.png](https://images.spumn.eu.cc/blog/e6d5606bbc711c73.png)

### Projection

Projection takes in a relation and outputs a relation with tuples that contain only specified attributes. You can rearrange the ordering of the attributes in the input relation as well as manipulate the values. Syntax: $π\_{A1,A2,. . . ,An} (R)$. Example: $π\_{b\_id-100, a\_id}(σ\_{a\_id}=’a2’ (R))$ SQL: `SELECT b_id-100, a_id FROM R WHERE a_id = 'a2'`

![01-introduction\_38.png](https://images.spumn.eu.cc/blog/48f1577479b5f126.png)

### Union

Union takes in two relations and outputs a relation that **contains all tuples** that appear in at least one of the input relations. Note: The two input relations have to have the exact same attributes. Syntax: $(R ∪ S)$. SQL: `(SELECT * FROM R) UNION ALL (SELECT * FROM S)`

![01-introduction\_39.png](https://images.spumn.eu.cc/blog/04e32fe8a2b18f3a.png)

## Intersection

Intersection takes in two relations and outputs a relation that contains all tuples that appear in **both** of the input relations. Note: The two input relations have to have the exact same attributes. Syntax: $(R ∩ S)$. SQL: `(SELECT * FROM R) INTERSECT (SELECT * FROM S)`

![01-introduction\_40.png](https://images.spumn.eu.cc/blog/c01490dd6f6a38b9.png)

### Difference

Difference takes in two relations and outputs a relation that contains all tuples that appear in the \*\*first relation but not the second \*\*relation. Note: The two input relations have to have the exact same attributes. Syntax: $(R − S)$. SQL: `(SELECT * FROM R) EXCEPT (SELECT * FROM S)`

![01-introduction\_41.png](https://images.spumn.eu.cc/blog/0af52e050ae6e5a1.png)

### Product

Product takes in two relations and outputs a relation that contains **all possible combinations** for tuples from the input relations. Syntax: $(R × S)$. SQL: `(SELECT * FROM R) CROSS JOIN (SELECT * FROM S)`, or simply `SELECT * FROM R, S`

![01-introduction\_42.png](https://images.spumn.eu.cc/blog/1ed96dadaf1cbb98.png)

### Join

Join takes in two relations and outputs a relation that contains all the tuples that are a **combination of two tuples** where for **each attribute that the two relations share,** the values for that attribute of both tuples is the same. Syntax: $(R ▷◁ S)$. SQL: `SELECT * FROM R JOIN S USING (ATTRIBUTE1, ATTRIBUTE2...)`

![01-introduction\_43.png](https://images.spumn.eu.cc/blog/dbe9621a7bea0c54.png)

![01-introduction\_44.png](https://images.spumn.eu.cc/blog/0cc865d5b3e757dd.png)

## Observation

**Relational algebra is a procedural language** because it defines the high level-steps of how to compute a query. For example, $σ\_{b\_id=102} (R ▷◁ S)$ is saying to first do the join of R and S and then do the select, whereas ($R ▷◁ (σ\_{b\_id=102} (S))$) will do the select on S first, and then do the join. **These two statements will actually produce the same answer**, but if there is only 1 tuple in S with $b\_id=102$ out of a billion tuples, then ($R ▷◁ (σ\_{b\_id=102} (S))$) will be significantly faster than $σ\_{b\_id=102} (R ▷◁ S)$.

A better approach is to say the result you want (retrieve the joined tuples from R and S where $b\_id$ equals 102), and **let the DBMS decide the steps it wants to take to compute the query.** SQL will do exactly this, and it is the de facto standard for writing queries on relational model databases.

![01-introduction\_45.png](https://images.spumn.eu.cc/blog/370aeef4060189a4.png)

![01-introduction\_46.png](https://images.spumn.eu.cc/blog/38b1f27eedbe1842.png)

![01-introduction\_47.png](https://images.spumn.eu.cc/blog/d2a31bafb0138456.png)

![01-introduction\_48.png](https://images.spumn.eu.cc/blog/86f327bb9e5fb1e7.png)

![01-introduction\_49.png](https://images.spumn.eu.cc/blog/8e75292025f0c2ff.png)

![01-introduction\_50.png](https://images.spumn.eu.cc/blog/dfdcac3e32ecd973.png)

![01-introduction\_51.png](https://images.spumn.eu.cc/blog/192461ad54f5bc9f.png)

![01-introduction\_52.png](https://images.spumn.eu.cc/blog/96763888282a4628.png)
