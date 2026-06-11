# PROJECT #1 - BUFFER POOL

> Do not post your project on a public Github repository.

# Overview

During the semester, you will build a disk-oriented storage manager for the [BusTub](https://github.com/cmu-db/bustub) DBMS. In such a storage manager, the primary storage location of the database is on disk.

The first programming project is to implement a **buffer pool** in your storage manager. The buffer pool is responsible for moving physical pages back and forth from main memory to disk. It allows a DBMS to support databases that are larger than the amount of memory available to the system. The buffer pool's operations are transparent to other parts in the system. For example, the system asks the buffer pool for a page using its unique identifier (`page_id_t`) and it does not know whether that page is already in memory or whether the system has to retrieve it from disk.

**Your implementation will need to be thread-safe**. Multiple threads will concurrently access the internal data structures and must make sure that their critical sections are protected with [latches](https://stackoverflow.com/a/42464336) (these are called "locks" in operating systems).

You must implement the following storage manager components:

- [**LRU-K Replacement Policy**](https://15445.courses.cs.cmu.edu/fall2023/project1/#lru-k-replacer)
- [**Disk Scheduler**](https://15445.courses.cs.cmu.edu/fall2023/project1/#disk-scheduler)
- [**Buffer Pool Manager**](https://15445.courses.cs.cmu.edu/fall2023/project1/#buffer-pool-manager)

This is a single-person project that must be completed individually (i.e. no groups).

- **Release Date:** Sep 06, 2023
- **Due Date:** Oct 01, 2023 @ 11:59pm

> Remember to pull latest code from the bustub repository.

# Project Specification

For each of the following components, we provide stub classes that contain the API that you must implement. You should **not** modify the signatures for the pre-defined functions in these classes. If you modify the signatures, our grading test code will not work and you will get no credit for the project.

If a class already contains data members, you should **not** remove them. For example, the `BufferPoolManager` contains the `DiskScheduler` and `LRUKReplacer` objects. These are required to implement functionality needed by the rest of the system. You may add data members and helper functions to these classes to correctly implement the required functionality.

You may use any built-in [C++17 containers](http://en.cppreference.com/w/cpp/container) in your project unless specified otherwise. It is up to you to decide which ones you want to use. Be warned that these containers are not thread-safe; will need to use latches to protect access to them. You may not use additional third-party libraries (e.g. boost).

## Task #1 - LRU-K Replacement Policy

This component is responsible for tracking page usage in the buffer pool. You will implement a new class called `LRUKReplacer` in `src/include/buffer/lru_k_replacer.h` and its corresponding implementation file in `src/buffer/lru_k_replacer.cpp`. Note that `LRUKReplacer` is a stand-alone class and is not related to any of the other `Replacer` classes. You are expected to implement only the LRU-K replacement policy. You don't have to implement LRU or a clock replacement policy, even if there is a corresponding file for it.

The LRU-K algorithm evicts a frame whose backward k-distance is maximum of all frames in the replacer. Backward k-distance is computed as the difference in time between current timestamp and the timestamp of kth previous access. A frame with fewer than k historical accesses is given +inf as its backward k-distance. **When multiple frames have +inf backward k-distance, the replacer evicts the frame with the earliest overall timestamp (i.e., the frame whose least-recent recorded access is the overall least recent access, overall, out of all frames).**

The maximum size for the `LRUKReplacer` is the same as the size of the buffer pool since it contains placeholders for all of the frames in the `BufferPoolManager`. However, at any given moment, not all the frames in the replacer are considered to be evictable. The size of `LRUKReplacer` is represented by the number of *evictable* frames. The `LRUKReplacer` is initialized to have no frames in it. Then, only when a frame is marked as evictable, replacer's size will increase.

You will need to implement the *LRU-K* policy discussed in this course. You will need to implement the following methods as defined in the header file (`src/include/buffer/lru_k_replacer.h`) and in the source file (`src/buffer/lru_k_replacer.cpp`):

- `Evict(frame_id_t* frame_id)` : Evict the frame with largest backward k-distance compared to all other **evictable** frames being tracked by the `Replacer`. Store the frame id in the output parameter and return `True`. If there are no evictable frames return `False`.
- `RecordAccess(frame_id_t frame_id)` : Record that given frame id is accessed at current timestamp. This method should be called after a page is pinned in the `BufferPoolManager`.
- `Remove(frame_id_t frame_id)` : Clear all access history associated with a frame. This method should be called only when a page is deleted in the `BufferPoolManager`.
- `SetEvictable(frame_id_t frame_id, bool set_evictable)` : This method controls whether a frame is evictable or not. It also controls `LRUKReplacer`'s size. You'll know when to call this function when you implement the `BufferPoolManager`. To be specific, when pin count of a page reaches 0, its corresponding frame is marked evictable and replacer's size is incremented.
- `Size()` : This method returns the number of evictable frames that are currently in the `LRUKReplacer`.

The implementation details are up to you. You are allowed to use built-in STL containers. You may assume that you will not run out of memory, but you must make sure that your implementation is thread-safe.

## Task #2 - Disk Scheduler

This component is responsible for scheduling read and write operations on the `DiskManager`. You will implement a new class called `DiskScheduler` in `src/include/storage/disk/disk_scheduler.h` and its corresponding implementation file in `src/storage/disk/disk_scheduler.cpp`.

The disk scheduler can be used by other components (in this case, your `BufferPoolManager` in Task #3) to queue disk requests, represented by a `DiskRequest` struct (already defined in `src/include/storage/disk/disk_scheduler.h`). The disk scheduler will maintain a background worker thread which is responsible for processing scheduled requests.

The disk scheduler will utilize a shared queue to schedule and process the DiskRequests. One thread will add a request to the queue, and the disk scheduler's background worker will process the queued requests. We have provided a `Channel` class in `src/include/common/channel.h` to facilitate the safe sharing of data between threads, but feel free to use your own implementation if you find it necessary.

The `DiskScheduler` constructor and destructor are already implemented and are responsible creating and joining the background worker thread. You will only need to implement the following methods as defined in the header file (`src/include/storage/disk/disk_scheduler.h`) and in the source file (`src/storage/disk/disk_scheduler.cpp`):

- `Schedule(DiskRequest r)` : Schedules a request for the `DiskManager` to execute. The `DiskRequest` struct specifies whether the request is for a read/write, where the data should be written into/from, and the page ID for the operation. The `DiskRequest` also includes a `std::promise` whose value should be set to true once the request is processed.
- `StartWorkerThread()` : Start method for the background worker thread which processes the scheduled requests. The worker thread is created in the DiskScheduler constructor and calls this method. This method is responsible for getting queued requests and dispatching them to the `DiskManager`. Remember to set the value on the `DiskRequest`'s callback to signal to the request issuer that the request has been completed. This should not return until the DiskScheduler's destructor is called.

Lastly, one of the fields of a `DiskRequest` is a `std::promise`. If you are unfamiliar with C++ promises and futures, you can check out their [documentation](https://en.cppreference.com/w/cpp/thread/promise). For the purposes of this project, they essentially provide a callback mechanism for a thread to know when their scheduled request is completed. To see an example of how they might be used, check out `disk_scheduler_test.cpp`.

Again, the implementation details are up to you, but you must make sure that your implementation is thread-safe.

### Disk Manager

The Disk Manager class (`src/include/storage/disk/disk_manager.h`) reads and writes the page data from and to the disk. Your disk scheduler will use `DiskManager::ReadPage()` and `DiskManager::WritePage()` when it is processing a read or write request.

## Task #3 - Buffer Pool Manager

Next, implement the buffer pool manager (`BufferPoolManager`). The `BufferPoolManager` is responsible for fetching database pages from disk with the `DiskScheduler` and storing them in memory. The `BufferPoolManager` can also schedule writes of dirty pages out to disk when it is either explicitly instructed to do so or when it needs to evict a page to make space for a new page.

To make sure that your implementation works correctly with the rest of the system, we will provide you with some functions already filled in. You will also not need to implement the code that actually reads and writes data to disk (this is called the `DiskManager` in our implementation). We will provide that functionality. You do, however, need to implement the `DiskScheduler` to process disk requests and dispatch them to the `DiskManager` (this is Task #2).

All in-memory pages in the system are represented by `Page` objects. The `BufferPoolManager` does not need to understand the contents of these pages. But it is important for you as the system developer to understand that `Page` objects are just containers for memory in the buffer pool and thus are not specific to a unique page. That is, each `Page` object contains a block of memory that the `DiskManager` will use as a location to copy the contents of a **physical page** that it reads from disk. The `BufferPoolManager` will reuse the same `Page` object to store data as it moves back and forth to disk. This means that the same `Page` object may contain a different physical page throughout the life of the system. The `Page` object's identifer (`page_id`) keeps track of what physical page it contains; if a `Page` object does not contain a physical page, then its `page_id` must be set to `INVALID_PAGE_ID`.

Each `Page` object also maintains a counter for the number of threads that have "pinned" that page. Your `BufferPoolManager` is not allowed to free a `Page` that is pinned. Each `Page` object also keeps track of whether it is dirty or not. It is your job to record whether a page was modified before it is unpinned. Your `BufferPoolManager` must write the contents of a dirty `Page` back to disk before that object can be reused.

Your `BufferPoolManager` implementation will use the `LRUKReplacer` and `DiskScheduler` classes that you created in the previous steps of this assignment. The `LRUKReplacer` will keep track of when `Page` objects are accessed so that it can decide which one to evict when it must free a frame to make room for copying a new physical page from disk. When mapping `page_id` to `frame_id` in the `BufferPoolManager`, again be warned that STL containers are not thread-safe. The `DiskScheduler` will schedule writes and reads to disk on the `DiskManager`.

You will need to implement the following functions defined in the header file (`src/include/buffer/buffer_pool_manager.h`) and in the source file (`src/buffer/buffer_pool_manager.cpp`):

- `FetchPage(page_id_t page_id)`
- `UnpinPage(page_id_t page_id, bool is_dirty)`
- `FlushPage(page_id_t page_id)`
- `NewPage(page_id_t* page_id)`
- `DeletePage(page_id_t page_id)`
- `FlushAllPages()`

For `FetchPage`, you should return nullptr if no page is available in the free list and all other pages are currently pinned. **`FlushPage` should flush a page regardless of its pin status.**

For `UnpinPage`, the is_dirty parameter keeps track of whether a page was modified while it was pinned.

The `AllocatePage` private method provides the `BufferPoolManager` a unique new page id when you want to create a new page in `NewPage()`. On the other hand, the `DeallocatePage()` method is a no-op that imitates freeing a page on the disk and you should call this in your `DeletePage()` implementation.

You do not need to make your buffer pool manager super efficient -- holding the buffer pool manager lock from the start to the end in each public-facing buffer pool manager function should be enough. However, you do need to ensure your buffer pool manager has reasonable performance, otherwise there will be problems in future projects. You can compare your benchmark result (QPS.1 and QPS.2) with other students and see if your implementation is too slow.

Please refer to the header files (`lru_k_replacer.h`, `disk_scheduler.h`, `buffer_pool_manager.h`) for more detailed specs and documentations.

## Leaderboard Task (Optional)

For this project's leaderboard challenge, we are doing a benchmark on your buffer pool manager with a special storage backend.

Optimizing for the leaderboard is optional (i.e., you can get a perfect score in the project after finishing all previous tasks). However, your solution must finish the leaderboard test with a correct result and without deadlock and segfault.

The leaderboard test is compiled with the release profile:

```bash
mkdir cmake-build-relwithdebinfo
cd cmake-build-relwithdebinfo
cmake .. -DCMAKE_BUILD_TYPE=RelWithDebInfo
make -j`nproc` bpm-bench
./bin/bustub-bpm-bench --duration 5000 --latency 1
```

> We strongly recommend you to checkpoint your code before optimizing for leaderboard tests, so that if these optimizations cause problems in future projects, you can always revert them.

In the leaderboard test, we will have multiple threads accessing the pages on the disk. There are two types of threads running in the benchmark:

1. Scan threads. Each scan thread will update all pages on the disk sequentially. There will be 8 scan threads.
2. Get threads. Each get thread will randomly select a page for access using the [zipfian distribution](https://en.wikipedia.org/wiki/Zipf's_law). There will be 8 get threads.

We will run the benchmark three times, each time for 30 seconds. For the first and the second time, it will run directly on the in-memory storage backend with different buffer pool and replacer settings. For the third time, we will add a 1-millisecond latency to each of the random read/write operation, and 0.1ms latency to sequential/local read/write operations. See `DiskManagerUnlimitedMemory` class for more information.

The final score is computed as a weighted QPS of scan and get operations, with and without latency respectively:

```bash
scan_qps_large / 1000 + get_qps_large / 1000 + scan_qps_small / 1000 + get_qps_small / 1000 + scan_qps_1ms + get_qps_1ms
```

**Recommended Optimizations**

1. Better replacer algorithm. Given that get workload is skewed (i.e., some pages are more frequently accessed than others), you can design your LRU-k replacer to take page access type into consideration, so as to reduce page miss.
2. Parallel I/O operations. Instead of processing one request at a time in your disk scheduler, you can issue multiple requests to the disk manager at the same time. This optimization will be very useful in modern storage devices, where concurrent access to the disk can make better use of the disk bandwidth. You should handle the case that multiple operations to the same page are in the queue and the end result of these requests should be as if they are processed in order. In a single thread, they should have read-after-write consistency.
3. To achieve true parallelism in disk scheduler, you will also need to allow your buffer pool manager can handle multiple `FetchPage` requests and evicting multiple pages at the same time. You might need to bring in a conditional variable in your buffer pool manager to manage free pages.
4. All page data should be stored in the buffer pool manager page array. You are not allowed to use extra memory for page data (i.e., implementing a page cache in BusTub). You must properly process all read / write requests and persist data to the disk manager.
5. You can use our provided lock-free queue implementation in `third_party/readerwriterqueue` and create your own `promise` implementation that is compatible with `std::promise` so as to lower the overhead of inter-thread communication. Note that in this project, all requests must go through the `DiskScheduler`'s background thread.

### Leaderboard Policy

- Submissions *with leaderboard bonus* are subject to manual review by TAs.
  - By saying "review", it means that TAs will manually look into your code, or if they are unsure whether an optimization is correct or not by looking, they will make simple modification to existing test cases to see if your leaderboard optimization *correctly* handled the specific cases that you want to optimize.
  - One example of simple modification: change the buffer pool manager size for the benchmark.
- Your optimization should not affect correctness. You can optimize for specific cases, but it should work for all inputs in your optimized cases.
  - Allowed: only handling 3-table join reordering in Fall 2022 project 3.
  - Allowed: optimize for leaf node size > 100 in project 2.
  - Disallowed: compare the plan with the leaderboard test and convert it to ValueExecutor with the output table in project 3. That’s because your optimization should work for all table contents. Hardcoding the answer will yield wrong result in some cases.
- You should not try detecting whether your submission is running leaderboard test by using side information.
  - Unless we allow you to do so.
  - Disallowed: use `#ifdef NDEBUG`, etc.
- Submissions with obvious correctness issues will not be assigned leaderboard bonus.
- You cannot use late days for leaderboard tests.
- If you are unsure about whether an optimization is reasonable, you should post on Piazza or visit any TA's office hour.

# Instructions

See the [Project #0 instructions](https://15445.courses.cs.cmu.edu/fall2023/project0/#instructions) on how to create your private repository and setup your development environment.

## Testing

You can test the individual components of this assigment using our testing framework. We use [GTest](https://github.com/google/googletest) for unit test cases. There are three separate files that contain tests for each component:

- `LRUKReplacer`: `test/buffer/lru_k_replacer_test.cpp`
- `DiskScheduler`: `test/storage/disk_scheduler_test.cpp`
- `BufferPoolManager`: `test/buffer/buffer_pool_manager_test.cpp`

You can compile and run each test individually from the command-line:

```bash
$ make lru_k_replacer_test -j$(nproc)
$ ./test/lru_k_replacer_test
```

You can also run `make check-tests` to run ALL of the test cases. Note that some tests are disabled as you have not implemented future projects. You can disable tests in GTest by adding a `DISABLED_` prefix to the test name.

**Important:** These tests are only a subset of the all the tests that we will use to evaluate and grade your project. You should write additional test cases on your own to check the complete functionality of your implementation.

## Formatting

Your code must follow the [Google C++ Style Guide](https://google.github.io/styleguide/cppguide.html). We use [Clang](https://clang.llvm.org/) to automatically check the quality of your source code. Your project grade will be **zero** if your submission fails any of these checks.

Execute the following commands to check your syntax. The `format` target will automatically correct your code. The `check-lint` and `check-clang-tidy-p1` targets will print errors and instruct you how to fix it to conform to our style guide.

```bash
$ make format
$ make check-clang-tidy-p1
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

Running `make submit-p1` in your `build/` directory will generate a `zip` archive called `project1-submission.zip` under your project root directory that you can submit to Gradescope.

You can submit your answers as many times as you like and get immediate feedback.

## Notes on Gradescope and Autograder

1. If you are timing out on Gradescope, it's likely because you have a deadlock in your code or your code is too slow and does not run in 60 seconds. If your code is too slow it may be because your `LRUKReplacer` is not efficient enough.
2. The autograder will not work if you are printing too many logs in your submissions.
3. If the autograder did not work properly, make sure that your formatting commands work and that you are submitting the right files.
4. The leaderboard benchmark score will be calculated by stress testing your `buffer_pool_manager` implementation.

 CMU students should use the Gradescope course code announced on Piazza.

# Collaboration Policy

- Every student has to work individually on this assignment.
- Students are allowed to discuss high-level details about the project with others.
- Students are **not** allowed to copy the contents of a white-board after a group meeting with other students.
- Students are **not** allowed to copy the solutions from another colleague.

 **WARNING:** All of the code for this project must be your own. You may not copy source code from other students or other sources that you find on the web. Plagiarism **will not** be tolerated. See CMU's [Policy on Academic Integrity](https://www.cmu.edu/policies/student-and-student-life/academic-integrity.html) for additional information.