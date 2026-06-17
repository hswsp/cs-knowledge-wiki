---
title: "Checkpoint 0: Networking Warmup"
description: "用 OS stream socket 写 webget，并实现内存中流控的 ByteStream。"
---

# Writing a network program using an OS stream socket
In the next part of this warmup lab, you will write a short program that fetches a Web page over the Internet. You will make use of a feature provided by the Linux kernel, and by most other operating systems: the ability to create a reliable bidirectional byte stream between two programs, one running on your computer, and the other on a different computer across the Internet (e.g., a Web server such as Apache or nginx, or the netcat program).

This feature is known as a stream socket. To your program and to the Web server, the socket looks like an ordinary file descriptor (similar to a file on disk, or to the stdin or stdout I/O streams). When two stream sockets are connected, any bytes written to one socket will eventually come out in the same order from the other socket on the other computer.

In reality, however, the Internet doesn’t provide a service of reliable byte-streams. Instead, the only thing the Internet really does is to give its “best effort” to deliver short pieces of data, called Internet datagrams, to their destination. Each datagram contains some metadata (headers) that specifies things like the source and destination addresses—what computer it came from, and what computer it’s headed towards—as well as some payload data (up to about 1,500 bytes) to be delivered to the destination computer. 

Although the network tries to deliver every datagram, in practice datagrams can be (1) lost, (2) delivered out of order, (3) delivered with the contents altered, or even (4) duplicated and delivered more than once. It’s normally the job of the operating systems on either end of the connection to turn “best-effort datagrams” (the abstraction the Internet provides) into “reliable byte streams” (the abstraction that applications usually want). 

The two computers have to cooperate to make sure that each byte in the stream eventually gets delivered, in its proper place in line, to the stream socket on the other side. They also have to tell each other how much data they are prepared to accept from the other computer, and make sure not to send more than the other side is willing to accept. All this is done using an agreed-upon scheme that was set down in 1981, called the Transmission Control Protocol, or TCP. 

In this lab, you will simply use the operating system’s pre-existing support for the Transmission Control Protocol. You’ll write a program called “webget” that creates a TCP stream socket, connects to a Web server, and fetches a page—much as you did earlier in this lab. In future labs, you’ll implement the other side of this abstraction, by implementing the Transmission Control Protocol yourself to create a reliable byte-stream out of not-so-reliable datagrams.

## Let’s get started—setting up the repository on your VM and on GitHub
The lab assignments will use a starter codebase called “Minnow.” On your VM, run `git clone https://github.com/cs144/minnow` to fetch the source code for the lab.

Enter the minnow directory by typing: `cd minnow`

In a Web browser, you’ll make a repository within your own GitHub account to hold your solutions to the lab assignment.

1. If you don’t already have a GitHub account, please make one at [https://github.com](https://github.com). 
2. Navigate to [https://github.com/new](https://github.com/new) to create a new repository. 
3. Name the repository “minnow” within your GitHub account. 
4. Make sure to set the repository to “**Private**” so your solutions are not public. 
5. Click “Create Repository”. 
6. On the next screen, click “Invite collaborators”, then “Add people”.
7. Add “cs144-grader” as a collaborator (this will let us see and grade your code, while keeping it private).

Back on your VM, **register the GitHub repository as a target by running the command: **`**git remote add github https://github.com/username/minnow**` (replacing “username” with your actual GitHub username). This creates an association between your local copy of the lab assignment (on your VM) and your copy on GitHub (which you’ll use to back up your local copy and be graded).

Run `git push github` to send the starter code to your GitHub repository. If all goes well, you will see a few lines of text printed, ending in: `* [new branch] main -> main` . If you see an error message, double-check that you have executed the above steps correctly. This command uploads your code to your private copy of the repository on GitHub and lets us grade your submissions.

## Compiling the starter code
Still in the “minnow” directory, create a directory to compile the lab software: `cmake -S . -B build`

Compile the source code: `cmake --build build`

Using your favorite text editor (many students prefer VS Code editing files over SSH, but you can use whatever you want): open and start editing the writeups/check0.md file. This is the template for your lab checkpoint writeup and will be included in your submission.

## Modern C++: mostly safe but still fast and low-level
CS144 is a programming-heavy class. The lab assignment is done in a contemporary C++ style that uses recent (2011 and later) features to program as safely as possible. This might be different from how you have been asked to write C++ in the past. For references to this style, please see the C++ Core Guidelines ([http://isocpp.github.io/CppCoreGuidelines/ CppCoreGuidelines](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines)).

The basic idea is to make sure that every object is designed to <font style="color:#601BDE;">have the smallest possible public interface</font>, has a lot of internal safety checks and is hard to use improperly, and knows how to clean up after itself. We want to avoid “paired” operations (e.g. `malloc`/`free`, or `new`/`delete`), where it might be possible for the second half of the pair not to happen (e.g., if a function returns early or throws an exception). Instead, <font style="color:#601BDE;">operations happen in the constructor to an object, and the opposite operation happens in the destructor. This style is called “Resource acquisition is initialization,” or </font>**<font style="color:#601BDE;">RAII</font>**<font style="color:#601BDE;">.</font>

In particular, we would like you to:

+ Use the language documentation at [https://en.cppreference.com](https://en.cppreference.com/) as a resource. (We’d recommend you avoid cplusplus.com which is more likely to be out-of-date.)  
+ Never use `malloc()` or `free()`. 
+ Never use `new` or `delete`.  
+ Essentially never use raw pointers (`*`), and use “smart” pointers (`unique_ptr` or `shared_ptr`) only when necessary. (You will not need to use these in CS144.)  
+ Avoid templates, threads, locks, and virtual functions. (You will not need to use these in CS144.)  
+ Avoid C-style strings (`char *str`) or string functions (`strlen()`, `strcpy()`). These are pretty error-prone. Use a `std::string` instead.  
+ Never use C-style casts (e.g., `(FILE *)x`). Use a C++ `static_cast` if you have to (you generally will not need this in CS144).  
+ Prefer **<font style="color:#601BDE;">passing function arguments by const reference</font>** (e.g.: `const Address & address`).  
+ Make every variable `const` unless it needs to be mutated.  
+ Make every method `const` unless it needs to mutate the object.  
+ Avoid global variables, and **give every variable the smallest scope possible**.  
+ Before handing in an assignment, <font style="color:#DF2A3F;">run </font>`<font style="color:#DF2A3F;">cmake --build build --target tidy</font>`<font style="color:#DF2A3F;"> for suggestions on how to improve the code related to C++ programming practices, and </font>`<font style="color:#DF2A3F;">cmake --build build --target format</font>`<font style="color:#DF2A3F;"> to format the code consistently</font>.

On using Git: The labs are distributed as Git (version control) repositories—a way of documenting changes, checkpointing versions to help with debugging, and tracking the provenance of source code. <font style="color:#601BDE;">Please make frequent small commits</font> as you work, and use commit messages that identify what changed and why. **The Platonic ideal is that each commit should compile and should move steadily towards more and more tests passing**. Making small “semantic” commits helps with debugging (it’s much easier to debug if each commit compiles and the message describes one clear thing that the commit does) and protects you against claims of cheating by documenting your steady progress over time—and it’s a useful skill that will help in any career that includes software development. The graders will be reading your commit messages to understand how you developed your solutions to the labs. If you haven’t learned how to use Git, please do ask for help at the CS144 office hours or consult a tutorial (e.g., [https://guides.github.com/introduction/git-handbook](https://guides.github.com/introduction/git-handbook)). Finally, while we ask you to back your code up and submit your code to us by using a private repository on GitHub, **please make sure your code is not publicly accessible**.

**To repeat (because we have taught this class before): make frequent small commits as you work, and use commit messages that identify what changed and why.**

## Reading the Minnow support code
To support this style of programming, Minnow’s classes wrap operating-system functions (which can be called from C) in “modern” C++. We have provided you with C++ wrappers for concepts we hope you’re broadly familiar with from CS 111, especially sockets and file descriptors.

Please read over the public interfaces (the part that comes after “`public:`” in the files util/socket.hh and util/file descriptor.hh. (**Please note that a **`**Socket**`** is a type of **`**FileDescriptor**`**, and a **`**TCPSocket**`** is a type of **`**Socket**`**.**)

## Writing webget
It’s time to implement webget, a program to fetch Web pages over the Internet using the operating system’s TCP support and stream-socket abstraction—just like you did by hand earlier in this lab.

From the build directory, open the file `../apps/webget.cc` in a text editor or IDE.

In the `get_URL` function, implement the simple Web client as described in this file, using the format of an HTTP (Web) request that you used earlier. Use the `TCPSocket` and `Address` classes.

Hints:

+ Please note that <font style="color:#D22D8D;">in HTTP, each line must be ended with “</font>`<font style="color:#D22D8D;">\r\n</font>`<font style="color:#D22D8D;">”</font> (it’s not sufficient to use just “\n” or endl).  
+ Don’t forget to include the “`Connection: close`” line <font style="color:#601BDE;">in your client’s request</font>. This tells the server that it shouldn’t wait around for your client to send any more requests after this one. Instead, the server will send one reply and then will immediately end its outgoing bytestream (the one from the server’s socket to your socket). You’ll discover that your incoming byte stream has ended because <font style="color:#601BDE;">your socket will reach “EOF” (end of file) when you have read the entire byte stream coming from the server</font>. That’s how your client will know that the server has finished its reply.  
+ Make sure to read and print all the output from the server <font style="color:#601BDE;">until the socket reaches “EOF”</font> (end of file) —**a single call to read is not enough**.  
+ We expect you’ll need to write about ten lines of code.

HTTP 请求报文如下：

1. 请求行（Request Line）

```plain
GET /path HTTP/1.1
```

+ **GET**：HTTP 方法，表示请求获取指定资源。
+ **/path**：请求的资源路径，通常是服务器上的文件或接口。
+ **HTTP/1.1**：使用的 HTTP 协议版本。

请求行是 HTTP 请求的第一行，用于告知服务器客户端希望执行的操作。

2. Host 头部（Host Header）

```plain
Host: example.com
```

+ **Host**：指定请求的目标主机名。

在 HTTP/1.1 中，`Host` 头部是必需的，用于支持虚拟主机功能，即多个域名共享同一 IP 地址的服务器。 

3. Connection 头部（Connection Header）

```plain
Connection: close
```

+ **Connection: close**：指示服务器在完成响应后关闭 TCP 连接。([Wikipedia](https://zh.wikipedia.org/wiki/%E8%B6%85%E6%96%87%E6%9C%AC%E4%BC%A0%E8%BE%93%E5%8D%8F%E8%AE%AE?utm_source=chatgpt.com))

在 HTTP/1.1 中，默认使用持久连接（即连接保持打开），除非明确指定 `Connection: close`。

这三行组成了一个基本的 HTTP 请求报文，格式如下：

```plain
GET /path HTTP/1.1
Host: example.com
Connection: close
```

请注意，最后一行是一个空行，表示请求头部的结束。

Compile your program by running `cmake --build build` . If you see an error message, you will need to fix it before continuing.

Test your program by running `./apps/webget cs144.keithw.org /hello`. How does this compare to what you see when visiting [http://cs144.keithw.org/hello](http://cs144.keithw.org/hello) in a Web browser? How does it compare to the results from Section 2.1? Feel free to experiment—test it with any http URL you like!

When it seems to be working properly, run `cmake --build build --target check_webget` to run the automated test. Before implementing the `get_URL` function, you should expect to see the following:

```bash
$ cmake --build build --target check_webget
Test project /home/cs144/minnow/build
Start 1: compile with bug-checkers
1/2 Test #1: compile with bug-checkers ........ Passed 1.02 sec
Start 2: t_webget
2/2 Test #2: t_webget .........................***Failed 0.01 sec
Function called: get_URL(cs144.keithw.org, /nph-hasher/xyzzy)
Warning: get_URL() has not been implemented yet.
ERROR: webget returned output that did not match the test's expectations
```

After completing the assignment, you will see:

```bash
$ cmake --build build --target check_webget
Test project /home/cs144/minnow/build
Start 1: compile with bug-checkers
1/2 Test #1: compile with bug-checkers ........ Passed 1.09 sec
Start 2: t_webget
2/2 Test #2: t_webget ......................... Passed 0.72 sec
100% tests passed, 0 tests failed out of 2
```

The graders will run your `webget` program with a different hostname and path than make `check_webget` runs—so <font style="color:#601BDE;">make sure it doesn’t only work with the hostname and path used by the unit tests</font>.

# An in-memory reliable byte stream
By now, you’ve seen how the abstraction of a reliable byte stream can be useful in communicating across the Internet, even though the <font style="color:#601BDE;">Internet itself only provides the service of “best-effort” (unreliable) datagrams</font>.

To finish off this week’s lab, you will implement, in memory on a single computer, an object that provides this abstraction. (You may have done something similar in CS 110/111.) Bytes are written on the “input” side and can be read, in the same sequence, from the “output” side. The byte stream is finite: the writer can end the input, and then no more bytes can be written.<font style="color:#601BDE;"> When the reader has read to the end of the stream, it will reach “EOF” (end of file) and no more bytes can be read.</font>

Your byte stream will also be **<font style="color:#601BDE;">flow-controlled</font>** to <font style="color:#601BDE;">limit its memory consumption</font> at any given time. The object is <font style="color:#601BDE;">initialized with a particular “capacity”</font>: the maximum number of bytes it’s willing to store in its own memory at any given point. The byte stream will limit the writer in how much it can write at any given moment, to make sure that the stream doesn’t exceed its storage capacity. As the reader reads bytes and drains them from the stream, the writer is allowed to write more. <font style="color:#601BDE;">Your byte stream is for use in a single thread</font>—you don’t have to worry about concurrent writers/readers, locking, or race conditions.

To be clear: the byte stream is finite, but it can be almost arbitrarily long 4 before the writer ends the input and finishes the stream. Your implementation must be able to handle streams that are much longer than the capacity. <font style="color:#601BDE;">The capacity limits the number of bytes that are held in memory (written but not yet read) at a given point, but does not limit the length of the stream</font>. **An object with a capacity of only one byte could still carry a stream that is terabytes and terabytes long**, as long as the writer keeps writing one byte at a time and the reader reads each byte before the writer is allowed to write the next byte.

Here’s what the interface looks like for the writer:

```cpp
void push( std::string data ); // Push data to stream, but only as much as available capacity allows.
void close(); // Signal that the stream has reached its ending. Nothing more will be written.
bool is_closed() const; // Has the stream been closed?
uint64_t available_capacity() const; // How many bytes can be pushed to the stream right now?
uint64_t bytes_pushed() const; // Total number of bytes cumulatively pushed to the stream
```

And here is the interface for the reader:

```cpp
std::string_view peek() const; // Peek at the next bytes in the buffer
void pop( uint64_t len ); // Remove `len` bytes from the buffer
bool is_finished() const; // Is the stream finished (closed and fully popped)?
bool has_error() const; // Has the stream had an error?
uint64_t bytes_buffered() const; // Number of bytes currently buffered (pushed and not popped)
uint64_t bytes_popped() const; // Total number of bytes cumulatively popped from stream
```

Please open the **src/byte stream.hh** and **src/byte stream.cc** files, and implement an object that provides this interface. As you develop your byte stream implementation, you can run the automated tests with `cmake --build build --target check0` .

If all tests pass, the check0 test will then run a speed benchmark of your implementation. <font style="color:#601BDE;">Anything faster than 0.1 Gbit/s (in other words, 100 million bits per second) is acceptable for purposes of this class</font>, for the three pop lengths tested. (It is possible for an implementation to perform faster than 10 Gbit/s, but this depends on the speed of your computer and is not required.)

For any late-breaking questions, please check out the lab FAQ on the course website or ask your classmates or the teaching staff in the lab session (or on EdStem).

What’s next? Over the next four weeks, **you’ll implement a system to provide the same interface, no longer in memory, but instead over an unreliable network**. This is the **<font style="color:#DF2A3F;">Transmission Control Protocol</font>**—and its implementations are arguably the **most prevalent computer program in the world**.

# Submit
In your submission, please only make changes to webget.cc and the source code in the top level of src (byte stream.hh and byte stream.cc). Please don’t modify any of the tests or the helpers in util.

Remember to make small commits as you code, with good commit messages. After making a commit, back up your VM’s repository to your private GitHub repository often by running `git push github` . Your code needs to be committed and pushed to GitHub for it to be gradable.

Before handing in any assignment, please run these in order:

1. Make sure you have committed all of your changes to the Git repository. You can run `git status` to make sure there are no outstanding changes. Remember: make small commits as you code.
2. `cmake --build build --target format` (to normalize the coding style)
3. `cmake --build build --target check0` (to make sure the automated tests pass)
4. Optional: `cmake --build build --target tidy` (suggests improvements to follow good C++ programming practices)

Finish editing writeups/check0.md, filling in the number of hours this assignment took you and any other comments.

Make sure your code is committed and pushed to your private GitHub repository ( `git push github` ).

There will be a Gradescope assignment due Sunday 11:59 p.m. for you to submit the commit ID of your submission.

Please let the course staff know ASAP of any problems at the Wednesday lab session, or by posting a question on EdStem. Good luck and welcome to CS144!

