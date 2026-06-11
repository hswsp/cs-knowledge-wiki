# PROJECT #2 - EXTENDIBLE HASH INDEX

> Do not post your project on a public Github repository.

# Overview

In this programming project you will implement disk-backed hash index in your database system. You will be using a variant of [extendible hashing](https://en.wikipedia.org/wiki/Extendible_hashing) as the hashing scheme. Unlike the two-level scheme taught in class, we added a non-resizable header page on top of the directory pages so that the hash table can hold more values and potentially achieve better multi-thread performance.

The following diagram shows an extendible hash table with a header page of max depth 2, directory pages with max depth 2, and bucket pages holding at most two entries. The values are omitted, and the hash of the keys are shown in the bucket pages instead of the key themselves.

![img](https://images.spumn.eu.cc/blog/a3d3e0a70c493851.svg)

The index provides fast data retrieval without needing to search every row in a database table enabling rapid random lookups. Your implementation should support thread-safe search, insertion, and deletion (including growing/shrinking the directory and splitting/mergeing buckets).

You must implement the following tasks:

- [**Read/Write Page Guards**](https://15445.courses.cs.cmu.edu/fall2023/project2/#page-guard)
- [**Extendible Hash Table Pages**](https://15445.courses.cs.cmu.edu/fall2023/project2/#hash-table-pages)
- [**Extendible Hashing Implementation**](https://15445.courses.cs.cmu.edu/fall2023/project2/#extendible-hashing)
- [**Concurrency Control**](https://15445.courses.cs.cmu.edu/fall2023/project2/#concurrency-control)

This is a single-person project that must be completed individually (i.e. no groups).

- **Release Date:** Sep 27, 2023
- **Due Date:** Oct 29, 2023 @ 11:59pm

Before starting, run `git pull public master` to pull the latest code from the public [BusTub repo](https://github.com/cmu-db/bustub).

> Remember to pull latest code from the bustub repository.

Your work here depends on your implementation of the buffer pool from Project 1. If your Project 1 solution was incorrect, you must fix it to successfully complete this project. We will not provide solutions for the previous programming projects.

# Project Specification

Like the first project, we are providing stub classes that contain the API that you need to implement. You should **not** modify the signatures for the pre-defined functions in these classes. If you modify the signatures, our grading test code will not work and you will get no credit for the project.

If a class already contains data members, you should **not** remove them. These are required to implement functionality needed by the rest of the system. Unless specified otherwise, you may add data members and helper functions to these classes to correctly implement the required functionality.

You may use any built-in [C++17 containers](http://en.cppreference.com/w/cpp/container) in your project unless specified otherwise. It is up to you to decide which ones you want to use. Be warned that these containers are not thread-safe; will need to use latches to protect access to them. You may not use additional third-party libraries (e.g. boost).

## Task #1 - Read/Write Page Guards

In the Buffer Pool Manager, `FetchPage` and `NewPage` functions return pointers to pages that are already pinned. The pinning mechanism ensures that the pages are not evicted until there are no more reads and writes on the page. To indicate that the page is no longer needed in memory, the programmer has to manually call `UnpinPage`.

On the other hand, if the programmer forgets to call `UnpinPage`, the page will never be evicted out of the buffer pool. As the buffer pool operates with an effectively smaller number of frames, there will be more swapping of pages in and out of the disk. Not only the performance takes a hit, the bug is also difficult to be detected.

You will implement `BasicPageGuard` which store the pointers to `BufferPoolManager` and `Page` objects. A page guard ensures that `UnpinPage` is called on the corresponding `Page` object as soon as it goes out of scope. Note that it should still expose a method for a programmer to manually unpin the page.

As `BasicPageGuard` hides the underlying `Page` pointer, it can also provide read-only/write data APIs that provide compile-time checks to ensure that the `is_dirty` flag is set correctly for each use case.

In this and future projects, multiple threads will be reading and writing from the same pages, thus reader-writer latches are required to ensure the correctness of the data. Note that in the `Page` class, there are relevant latching methods for this purpose. Similar to unpinning of a page, a programmer can forget to unlatch a page after use. To mitigate the problem, you will implement `ReadPageGuard` and `WritePageGuard` which automatically unlatch the pages as soon as they go out of scope.

You will need to implement the following functions for all `BasicPageGuard`, `ReadPageGuard` and `WritePageGuard`.

- `PageGuard(PageGuard &&that)`: Move constructor.
- `operator=(PageGuard &&that)`: Move operator.
- `Drop()`: Unpin and/or unlatch.
- `~PageGuard()`: Destructor.

You will also need to implement the following upgrade functions for `BasicPageGuard`. These functions need to guarantee that the protected page is not evicted from the buffer pool during the upgrade.

- `UpgradeRead()`: Upgrade to a `ReadPageGuard`
- `UpgradeWrite()`: Upgrade to a `WritePageGuard`

With the new page guards, implement the following wrappers in `BufferPoolManager`.

- `FetchPageBasic(page_id_t page_id)`
- `FetchPageRead(page_id_t page_id)`
- `FetchPageWrite(page_id_t page_id)`
- `NewPageGuarded(page_id_t *page_id)`

Please refer to the header files (`buffer_pool_manager.h` and `page_guard.h`) for more detailed specs and documentations.

## Task #2 - Extendible Hash Table Pages

You must implement three Page classes to store the data of your Extendible Hash Table.

- [**Hash Table Header Page**](https://15445.courses.cs.cmu.edu/fall2023/project2/#htable-header-page)
- [**Hash Table Directory Page**](https://15445.courses.cs.cmu.edu/fall2023/project2/#htable-directory-page)
- [**Hash Table Bucket Page**](https://15445.courses.cs.cmu.edu/fall2023/project2/#htable-bucket-page)

### Hash Table Header Page

The header page sits the at the first level of our disk-based extendible hash table, and there is only one header page for a hash table. It stores the logical child pointers to the directory pages (as page ids). You can think about it as a static first-level directory page. The header page has the following fields:

| Variable Name         | Size | Description                                    |
| --------------------- | ---- | ---------------------------------------------- |
| `directory_page_ids_` | 2048 | An array of directory page ids                 |
| `max_depth_`          | 4    | The maximum depth the header page could handle |

Note that although there is a physical limit of how large a page is, you should use `max_depth_` to determine the upper bound of your `directory_page_ids` array size.

You must implement the extendible hash table header page by modifying only its header file (`src/include/storage/page/extendible_htable_header_page.h`) and corresponding source file (`src/storage/page/extendible_htable_header_page.cpp`).

### Hash Table Directory Page

Directory pages sit at the second level of our disk-based extendible hash table. Each of them stores the logical child pointers to the bucket pages (as page ids), as well as metadata for handling bucket mapping and dynamic directory growing and shrinking. The directory page has the following fields:

| Variable Name      | Size | Description                                    |
| ------------------ | ---- | ---------------------------------------------- |
| `max_depth_`       | 4    | The maximum depth the header page could handle |
| `global_depth_`    | 4    | The current directory global depth             |
| `local_depths_`    | 512  | An array of bucket page local depths           |
| `bucket_page_ids_` | 2048 | An array of bucket page ids                    |

Note that although there is a physical limit of how large a page is, you should use `max_depth_` to determine the upper bound of your `bucket_page_ids_` array size.

You must implement the extendible hash table directory page by modifying only its header file (`src/include/storage/page/extendible_htable_directory_page.h`) and corresponding source file (`src/storage/page/extendible_htable_directory_page.cpp`).

### Hash Table Bucket Page

Bucket pages sit at the third level of our disk-based extendible hash table. They are the ones that are actually storing the key-value pairs. The bucket page has the following fields:

| Variable Name | Size                       | Description                                                 |
| ------------- | -------------------------- | ----------------------------------------------------------- |
| `size_`       | 4                          | The number of key-value pairs the bucket is holding         |
| `max_size_`   | 4                          | The maximum number of key-value pairs the bucket can handle |
| `array_`      | less than or equal to 4088 | An array of bucket page local depths                        |

Note that although there is a physical limit of how large a page is, you should use `max_size_` to determine the upper bound of your `array_` key-value pairs array size.

You must implement the extendible hash table bucket page by modifying only its header file (`src/include/storage/page/extendible_htable_bucket_page.h`) and corresponding source file (`src/storage/page/extendible_htable_bucket_page.cpp`).

Each extendible hash table header/directory/bucket page corresponds to the content (i.e., the `data_` part) of a memory page fetched by the buffer pool. Every time you read or write a page, you must first fetch the page from the buffer pool (using its unique `page_id`), reinterpret cast it the corresponding type, and unpin the page after reading or writing it. We strongly encourage you to take advantage of the `PageGuard` APIs you implemented in [**Task #1**](https://15445.courses.cs.cmu.edu/fall2023/project2/#page-guard) to achieve this.

## Task #3 - Extendible Hashing Implementation

Your implementation needs to support insertions, point search and deletions. There are many helper functions either implemented or documented the extendible hash table's header and cpp files. Your only strict API requirement is adhering to `Insert`, `GetValue`, and `Remove`. You also must leave the `VerifyIntegrity` function as it is. Please feel free to design and implement additional functions as you see fit.

For this semester, the hash table is intend to support only **unique keys**. This means that the hash table should return false if the user tries to insert duplicate keys.

**Note:** You should use the page classes you implemented in [**Task #2**](https://15445.courses.cs.cmu.edu/fall2023/project2/#hash-table-pages) to store the key-value pairs as well as the metadata to maintain the hash table (page ids, global/local depths). For instance, you should not use in-memory data structure such as a `std::unordered_map` to mock the hash table.

The extendible hash table is parameterized on arbitrary key, value, and key comparator types.

```c++
template <typename KeyType,
          typename ValueType,
          typename KeyComparator>
```

The type parameters are:

- `KeyType`: The type of each key in the index. In practice this will be a `GenericKey`. The actual size of a `GenericKey` varies, and is specified with its own template argument that depends on the type of indexed attribute.
- `ValueType`: The type of each value in the index. In practice, this will be a 64-bit RID.
- `KeyComparator`: A class used to compare whether two `KeyType` instances are less than, greater than, or equal to each other. These will be included in the `KeyType` implementation files.

**Note:** Our hash table functions also take a `Transaction*` with default value `nullptr`. This is intended for project 4 if you want to implement concurrent index lookup in concurrency control. You generally don't need to use it in this project.

You must implement the extendible hash table bucket page by modifying only its header file (`src/include/container/disk/hash/disk_extendible_hash_table.cpp`) and corresponding source file (`src/container/disk/hash/disk_extendible_hash_table.cpp`).

This project requires you to implement bucket splitting/merging and directory growing/shrinking. The following subsections provide a specification on the implementation details.

### Empty Table

When you first create an empty hash table, it should only have the (one and only) header page. Directory pages and bucket pages should be created on demand.

### Header Indexing

You will want to use the **most-significant bits** for indexing into the header page's `directory_page_ids_` array. This involves taking the hash of your key and perform bit operations with the depth of the header page. The header page depth will not change.

### Directory Indexing

You will want to use the **least-significant bits** for indexing into the directory page's `bucket_page_ids_` array. This involves taking the hash of your key and perform bit operations with the current depth of the directory page.

### Bucket Splitting

You must split a bucket if there is no room for insertion. You can ostensibly split as soon as the bucket becomes full, if you find that easier. However, the reference solution splits only when an insertion would overflow a page. Hence, you may find that the provided API is more amenable to this approach. As always, you are welcome to factor your own internal API.

### Bucket Merging

Merging must be attempted when a bucket becomes empty. There are ways to merge more aggressively by checking the occupancy of buckets and their split images, but these expensive checks and extra merges can increase thrashing.

To keep things relatively simple, we provide the following rules for merging:

1. Only empty buckets can be merged.
2. Buckets can only be merged with their split image if their split image has the same local depth.
3. You should keep merging recursively if the **new split image** of the merged bucket is empty.

If you are confused about a "split image,” please review the algorithm and code documentation. The concept falls out quite naturally.

### Directory Growing

There are no fancy rules for part of the hash table. You either have to grow the directory, or you do not.

### Directory Shrinking

Only shrink the directory if the local depth of every bucket is strictly less than the global depth of the directory.

## Task #4 - Concurrency Control

Finally, modify your extendible hash table implementation so that it safely supports concurrent operations with multiple threads. The thread traversing the index should acquire latches on hash table pages as necessary to ensure safe concurrent operations, and should release latches on parent pages as soon as it is possible to determine that it is safe to do so.

We recommend that you complete this task by using the `FetchPageWrite` or `FetchPageRead` buffer pool API, depending on whether you want to access a page with read or write privileges. Then modify your implementation to grab and release read and write latches as necessary to implement the latch crabbing algorithm.

**Note:** You should never acquire the same read lock twice in a single thread. It might lead to deadlock.

**Note:** You should make careful design decisions on latching. Always holding a global latch the entire hash table is probably not a good idea. TAs will manual review your implementation and bad latching design would result in points deduction.

# Instructions

See the [Project #0 instructions](https://15445.courses.cs.cmu.edu/fall2023/project0/#instructions) on how to create your private repository and setup your development environment.

## Testing

You can test the individual components of this assigment using our testing framework. We use [GTest](https://github.com/google/googletest) for unit test cases. There are three separate files that contain tests for each component:

- `Page Guards`: `test/storage/page_guard_test.cpp`
- `Hash Table Pages`: `test/storage/extendible_htable_page_test.cpp`
- `Extendible Hash Table`: `test/container/disk/hash/extendible_htable_test.cpp`

You can compile and run each test individually from the command-line:

```bash
$ make page_guard_test -j$(nproc)
$ ./test/page_guard_test
```

You can also run `make check-tests` to run ALL of the test cases. Note that some tests are disabled as you have not implemented future projects. You can disable tests in GTest by adding a `DISABLED_` prefix to the test name.

**Important:** These tests are only a subset of the all the tests that we will use to evaluate and grade your project. You should write additional test cases on your own to check the complete functionality of your implementation.

## Formatting

Your code must follow the [Google C++ Style Guide](https://google.github.io/styleguide/cppguide.html). We use [Clang](https://clang.llvm.org/) to automatically check the quality of your source code. Your project grade will be **zero** if your submission fails any of these checks.

Execute the following commands to check your syntax. The `format` target will automatically correct your code. The `check-lint` and `check-clang-tidy-p2` targets will print errors and instruct you how to fix it to conform to our style guide.

```bash
$ make format
$ make check-clang-tidy-p2
```

## Memory Leaks

For this project, we use [LLVM Address Sanitizer (ASAN) and Leak Sanitizer (LSAN)](https://clang.llvm.org/docs/AddressSanitizer.html) to check for memory errors. To enable ASAN and LSAN, configure CMake in debug mode and run tests as you normally would. If there is memory error, you will see a memory error report. Note that macOS **only supports address sanitizer without leak sanitizer**.

In some cases, address sanitizer might affect the usability of the debugger. In this case, you might need to disable all sanitizers by configuring the CMake project with:

```bash
$ cmake -DCMAKE_BUILD_TYPE=Debug -DBUSTUB_SANITIZER= ..
```

## Development Hints

You can use `BUSTUB_ASSERT` for assertions in debug mode. Note that the statements within `BUSTUB_ASSERT` will NOT be executed in release mode. If you have something to assert in all cases, use `BUSTUB_ENSURE` instead.

> Post all of your questions about this project on Piazza. Do **not** email the TAs directly with questions.

We encourage you to use a graphical debugger to debug your project if you are having problems.

If you are having compilation problems, running `make clean` does not completely reset the compilation process. You will need to delete your build directory and run `cmake ..` again before you rerun `make`.

# Grading Rubric

Each project submission will be graded based on the following criteria:

1. Does the submission successfully execute all of the test cases and produce the correct answer?
2. Does the submission execute without any memory leaks?
3. Does the submission follow the code formatting and style policies?

Note that we will use additional test cases to grade your submission that are more complex than the sample test cases that we provide you.

# Late Policy

See the [late policy](https://15445.courses.cs.cmu.edu/fall2023/syllabus.html#late-policy) in the syllabus.

# Submission

After completing the assignment, you can submit your implementation to Gradescope:

- **https://www.gradescope.com/courses/579715**

Running `make submit-p2` in your `build/` directory will generate a `zip` archive called `project2-submission.zip` under your project root directory that you can submit to Gradescope.

You can submit your answers as many times as you like and get immediate feedback.

## Notes on Gradescope and Autograder

1. If you are timing out on Gradescope, it's likely because you have a deadlock in your code or your code is too slow and does not run in 60 seconds. If your code is too slow it may be because you have performance issue on the buffer pool manager you implemented in project 1.
2. The autograder will not work if you are printing too many logs in your submissions.
3. If the autograder did not work properly, make sure that your formatting commands work and that you are submitting the right files.

> CMU students should use the Gradescope course code announced on Piazza.

# Collaboration Policy

- Every student has to work individually on this assignment.
- Students are allowed to discuss high-level details about the project with others.
- Students are **not** allowed to copy the contents of a white-board after a group meeting with other students.
- Students are **not** allowed to copy the solutions from another colleague.

> **WARNING:** All of the code for this project must be your own. You may not copy source code from other students or other sources that you find on the web. Plagiarism **will not** be tolerated. See CMU's [Policy on Academic Integrity](https://www.cmu.edu/policies/student-and-student-life/academic-integrity.html) for additional information.