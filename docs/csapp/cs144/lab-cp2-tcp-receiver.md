---
title: "Checkpoint 2: The TCP receiver"
description: "32 位 seqno 与 64 位 absolute seqno 的换算，实现 TCPReceiver。"
---

# Overview
Suggestion: read the whole lab document before implementing.

In Checkpoint 0, you implemented the abstraction of a flow-controlled byte stream (`ByteStream`). And in Checkpoint 1, you created a `Reassembler` that accepts a sequence of substrings, all excerpted from the same byte stream, and reassembles them back into the original stream.

These modules will prove useful in your TCP implementation, but nothing in them was specific to the details of the **Transmission Control Protocol**. That changes now. In Checkpoint 2, you will implement the `TCPReceiver`, the part of a TCP implementation that handles the incoming byte stream. The `TCPReceiver` receives messages from the peer’s sender (via the `receive()` method) and turns them into calls to a `Reassembler`, which eventually writes to the incoming `ByteStream`. Applications read from this `ByteStream`, just as you did in Lab 0 by reading from the `TCPSocket`.

Meanwhile, the `TCPReceiver` also generates messages that go back to the peer’s sender, via  
the `send()` method. These “receiver messages” are responsible for telling the sender:

1. the index of the “**<font style="color:#DF2A3F;">first unassembled</font>**” byte, which is called the “<font style="color:#2F4BDA;">acknowledgment number</font>”  
or “**ackno**.” This is the first byte that the receiver needs from the sender.
2. the <font style="color:#2F4BDA;">available capacity</font> in the output `ByteStream`. This is called the “**window size**”.

Together, the **ackno** and **window size** describe describes the receiver’s window: a range of indexes that the TCP sender is allowed to send. Using the window, the receiver can control the flow of incoming data, making the sender limit how much it sends until the receiver is ready for more. We sometimes refer to the **ackno** as the “left edge” of the window (smallest index the `TCPReceiver` is interested in), and the **ackno + window size** as the “right edge” (just beyond the largest index the `TCPReceiver` is interested in).

You’ve already done most of the algorithmic work involved in implementing the `TCPReceiver` when you wrote the `Reassembler` and `ByteStream`; this lab is about <font style="color:#2F4BDA;">wiring those general classes up to</font> the details of TCP. The hardest part will involve thinking about how TCP will represent each byte’s place in the stream—known as a “**<font style="color:#DF2A3F;">sequence number</font>**.”

## Getting started
Your implementation of a `**TCPReceiver**` will use the same `Minnow` library that you used in Checkpoints 0 and 1, with additional classes and tests. To get started:

1. Make sure you have committed all your solutions to Checkpoint 1. Please don’t modify any files outside the top level of the src directory, or `webget.cc`. You may have trouble merging the Checkpoint 1 starter code otherwise.
2. While inside the repository for the lab assignments, run `git fetch --all` to retrieve the most recent version of the lab assignment.
3. Download the starter code for Checkpoint 2 by running `git merge origin/check2-startercode` . (If you have renamed the “origin” remote to be something else, you might need to use a different name here, e.g. `git merge upstream/check2-startercode` .)
4. Make sure your build system is properly set up: `cmake -S . -B build`
    1. Note for **arm64 (UTM) Mac** **users**: The g++ 13 “sanitizers” (bug checkers) seem to run very slow on arm64. `Minnow` uses these to run the tests. If you are on an arm64 Mac, please configure cmake to use a different compiler: `cmake -S . -B build -DCMAKE CXX COMPILER=clang++`
5. Compile the source code: `cmake --build build`
6. Open and start editing the writeups/check2.md file. This is the template for your lab writeup and will be included in your submission.

## Checkpoint 2: The TCP Receiver
TCP is a protocol that reliably conveys a pair of flow-controlled byte streams (one in each direction) over unreliable datagrams. Two parties, or “peers,” participate in the TCP connection, and <font style="color:#601BDE;">each peer acts as both “sender” (of its own outgoing byte stream) and “receiver” (of an incoming byte stream) at the same time.</font> 

This week, you’ll implement the “receiver” part of TCP, responsible for receiving messages from the sender, reassembling the byte stream (including its ending, when that occurs), and determining that messages that should be <font style="color:#601BDE;">sent back to the sender for acknowledgment and flow control</font>.

> **Why am I doing this**? These signals are crucial to TCP’s ability to provide the service of a flow-controlled, reliable byte stream over an unreliable datagram network. In TCP, acknowledgment means, “What’s the index of the next byte that the receiver needs so it can reassemble more of the ByteStream?” This tells the sender what bytes it needs to send or resend. **Flow control** means, “What range of indices is the receiver interested and willing to receive?” (a function of its available capacity). This tells the sender how much it’s allowed to send.
>

### Translating between 64-bit indexes and 32-bit seqnos
As a warmup, we’ll need to implement TCP’s way of representing indexes. Last week you created a `Reassembler` that reassembles substrings where each individual byte has a 64-bit **stream index**, <font style="color:#601BDE;">with the first byte in the stream always having index zero</font>. A 64-bit index is big enough that we can treat it as **never overflowing**. <font style="color:#601BDE;">In the TCP headers</font>, however, space is precious, and each byte’s index in the stream is represented not with a 64-bit index but <font style="color:#D22D8D;">with a 32-bit “sequence number,” or “</font>**<font style="color:#D22D8D;">seqno</font>**<font style="color:#D22D8D;">.”</font> This adds three complexities:

1. **Your implementation needs to plan for 32-bit integers to wrap around**. Streams in TCP can be arbitrarily long—there’s no limit to the length of a `ByteStream` that can be sent over TCP. But $ 2^{32} $ bytes is only 4 GiB, which is not so big. <font style="color:#601BDE;">Once a 32-bit sequence number counts up to </font>$ 2^{32}− 1 $<font style="color:#601BDE;"> , the next byte in the stream will have the sequence number zero</font>.
2. **TCP sequence numbers start at a random value**: To improve robustness and avoid <font style="color:#D22D8D;">getting confused by old segments belonging to earlier connections between the same endpoints</font>, TCP tries to make sure sequence numbers can’t be guessed and are unlikely to repeat. So the sequence numbers for a stream don’t start at zero. The first sequence number in the stream is a **random 32-bit** number called the <font style="color:#D22D8D;">Initial Sequence Number (</font>**<font style="color:#D22D8D;">ISN</font>**<font style="color:#D22D8D;">)</font>. This is the sequence number that represents the “zero point” or the SYN (beginning of stream). The rest of the sequence numbers behave normally after that: the <font style="color:#D22D8D;">first</font> byte of data will have the <font style="color:#D22D8D;">sequence number of the  </font>$ ISN+1 (mod \,2^{32}) $, the second byte will have the  $ ISN+2 (mod \,2^{32}) $, etc.
3. **The logical beginning and ending each occupy one sequence number:** In addition to ensuring the receipt of all bytes of data, TCP makes sure that the beginning and ending of the stream are received reliably. Thus, in TCP the **<font style="color:#DF2A3F;">SYN (beginning-ofstream) and FIN (end-of-stream)</font>**<font style="color:#DF2A3F;"> control flags are assigned sequence numbers</font>. Each of these occupies one sequence number. (<font style="color:#D22D8D;">The sequence number occupied by the SYN flag is the ISN</font>.) Each byte of data in the stream also occupies one sequence number. <font style="color:#D22D8D;">Keep in mind that SYN and FIN aren’t part of the stream itself and aren’t “bytes”—they represent the beginning and ending of the byte stream itself</font>.

These sequence numbers <font style="color:#601BDE;">(</font>**<font style="color:#601BDE;">seqnos</font>**<font style="color:#601BDE;">) are transmitted in the header of each TCP segment.</font> (And, again, there are <font style="color:#D22D8D;">two streams—one in each direction</font>. <font style="color:#D22D8D;">Each stream has separate sequence numbers and a different random ISN</font>.) It’s also sometimes helpful to talk about the concept of an “**absolute sequence number**” (which always starts at zero and doesn’t wrap), and about a “**stream index**” (what you’ve already been using with your `Reassembler`: an index for each byte in the stream, starting at zero).

To make these distinctions concrete, consider the byte stream containing just the three-letter string ‘`cat`’. If the `SYN` happened to have **seqno** $ 2^{32} − 2 $, then the seqnos, absolute seqnos, and stream indices of each byte are:

| _element_ | SYN | c | a | t | FIN |
| --- | --- | --- | --- | --- | --- |
| **seqno** | 2<sup>32</sup> - 2 | 2<sup>32</sup> - 1 | 0 | 1 | 2 |
| **absolute seqno** | 0 | 1 | 2 | 3 | 4 |
| **stream index** |  | 0 | 1 | 2 |  |


The figure shows the three different types of indexing involved in TCP:

| Sequence Numbers | Absolute Sequence Numbers | Stream Indices |
| --- | --- | --- |
| - Start at the ISN | - Start at 0 | - Start at 0 |
| - Include SYN/FIN | - Include SYN/FIN | - Omit SYN/FIN |
| - 32 bits, wrapping | - 64 bits, non-wrapping | - 64 bits, non-wrapping |
| - "seqno" | - "absolute seqno" | - "stream index" |


Converting between **<font style="color:#601BDE;">absolute sequence number</font>**<font style="color:#601BDE;">s and </font>**<font style="color:#601BDE;">stream indices</font>**<font style="color:#601BDE;"> is easy enough—just add or subtract one</font>. Unfortunately, converting between **sequence numbers** and **absolute sequence** numbers is a bit harder, and confusing the two can produce tricky bugs. To prevent these bugs systematically, we’ll represent sequence numbers with a custom type: `Wrap32`, and write the conversions between it and **absolute sequence numbers** (represented with `uint64_t`). `**Wrap32**` is an example of a wrapper type: a type that contains an inner type (in this case `uint32_t`) but provides a different set of functions/operators

We’ve defined the type for you and provided some helper functions, but you’ll implement the conversions in wrapping integers.cc:

1. `static Wrap32 Wrap32::wrap( uint64_t n, Wrap32 zero_point )`   
**Convert absolute seqno → seqno**. Given an absolute sequence number (`n`) and an Initial Sequence Number (`zero_point`), produce the (relative) sequence number for `n`.
2. `uint64_t unwrap( Wrap32 zero_point, uint64_t checkpoint ) const`   
**Convert seqno → absolute seqno**. Given a sequence number (the `Wrap32`), the <font style="color:#601BDE;">Initial Sequence Number</font> (`zero_point`), and an <font style="color:#601BDE;">absolute checkpoint sequence number</font>, find the corresponding absolute sequence number that is closest to the checkpoint.   
Note: A **checkpoint** is required because any given seqno corresponds to many absolute seqnos. E.g. with an ISN of zero, the seqno “17” corresponds to the absolute seqno of 17, but also $ 2^{32} + 17 $, or $ 2^{33} + 17 $, or $ 2^{33} + 2^{32} + 17 $, or $ 2^{34} + 17 $, or $ 2^{34} + 2^{32} + 17 $, etc. The checkpoint helps resolve the ambiguity: <font style="color:#601BDE;">it’s an absolute seqno that the user of this class knows is “in the ballpark” of the correct answer</font>. In your TCP implementation, <font style="color:#DF2A3F;">you’ll use the first unassembled index as the checkpoint</font>.

Hint: The cleanest/easiest implementation will use the helper functions provided in `wrapping_integers.hh`. The wrap/unwrap operations should preserve offsets—<font style="color:#601BDE;">two </font>**<font style="color:#601BDE;">seqnos</font>**<font style="color:#601BDE;"> that differ by 17 will correspond to two </font>**<font style="color:#601BDE;">absolute seqnos</font>**<font style="color:#601BDE;"> that also differ by 17</font>. 

Hint #2: We’re expecting one line of code for <font style="color:#2F4BDA;">wrap</font>, and less than 10 lines of code for <font style="color:#2F4BDA;">unwrap</font>. If you find yourself implementing a lot more than this, it might be wise to step back and try to think of a different strategy.

You can test your implementation by running the tests: `cmake --build build --target check2` . (Reminder: Mac arm64 users should have configured to use the “clang++” compiler—see above.)

### 序列号回绕（Sequence Number Wrapping）
在TCP协议中，当序列号达到 $ 2^{32}− 1 $ 后，下一个字节的序列号会回到 `0`，并继续递增。例如：当前`seqno = 0xFFFFFFFF`（$ 2^{32}− 1 $），`下一个字节的seqno = 0`。

1. seqno与absolute seqno的转换

给定`seqno`$ S $ 、初始序列号`ISN`$ I $，其对应的`absolute seqno`$ A $ 满足：

  $ A \equiv S - I \ (\text{mod} \ 2^{32}) $ 

因此， $ A $ 的可能值为  $ A + k \cdot 2^{32} $ （ k 为整数）。

2. `checkpoint`的作用

`checkpoint`用于从多个可能的 $ A $ 中选择最接近的值。例如，若`checkpoint`为 C ，则选择满足以下条件的 $ A $ ：  
  $ |A - C| \leq 2^{31} $

这样可确保 A 与 C 的差值在 $ [-2^{31}, 2^{31}] $ 范围内，避免因模运算导致的歧义。

3. 实现示例

在 "`unwrap`"函数中，通过计算候选 $ A $ 与`checkpoint`的差值，选择最接近的合法值。例如：

```c
uint64_t unwrap(Wrap32 seqno, Wrap32 isn, uint64_t checkpoint) {
    uint32_t offset = seqno - wrap(checkpoint, isn); // 低32位差值
    uint64_t candidate = checkpoint + (int32_t)offset; // 考虑符号扩展
    if (offset > (1u << 31) && candidate >= (1ull << 32)) 
        candidate -= (1ull << 32); // 处理下界溢出
    return candidate;
}
```

在TCP协议中，存在因32位序列号（`seqno`）回绕导致历史`absolute seqno`（ $ A_{\text{old}} $ ）与当前`absolute seqno`（ $ A_{\text{new}} $ ）模 $ 2^{32} $ 相等的情况。

但通过以下机制可完全避免混淆问题：

1. **接收窗口（Receive Window）限制**：
+ 接收方只会接受 `seqno` 落在当前窗口内的数据（窗口大小通常远小于 `2^32`，如默认64KB）。
+ 窗口边界限制：接收方仅接受满足  $ A \in [\text{ackno}, \text{ackno} + \text{window_size}) $  的seqno。
+ `checkpoint`选择：`checkpoint`通常为第一个未组装的字节索引（即当前`ackno`），确保 $ A_{\text{old}} $ 因超出窗口范围被直接丢弃。
+ 即使seqno回绕到 `0`，旧数据包的 `seqno` 也早已超出窗口范围，会被直接丢弃。

此逻辑确保 A 始终在窗口附近，避免历史seqno干扰。

2. **时间戳选项（PAWS机制 Protection Against Wrapped Sequences）**

如果启用了 **TCP Timestamps（RFC 1323）**，[PAWS机制会进一步解决回绕问题](https://blog.csdn.net/atomzhong/article/details/78981505?app_lang=en-US)：

+ 核心作用：每个TCP报文携带发送时的时间戳（`TSval`）。<font style="color:#601BDE;">接收方维护最近有效时间戳</font>（`Recent TSval`），若<font style="color:#601BDE;">收到的时间戳非递增，则直接丢弃报文</font>。
+ 示例：若历史seqno延迟到达，其时间戳必然小于当前窗口内报文的时间戳（如历史`TSval=2`，当前`TSval=5`），PAWS会将其判定为过期报文并丢弃。
3. **初始序列号（ISN）随机化**
+ 避免冲突：ISN基于时钟和随机哈希生成，每4微秒递增，确保不同连接的seqno无规律重复。
+ 极端情况：即使ISN随机化，PAWS和窗口机制仍能兜底，防止历史报文被误收。
4. **内核的序列号比较优化**
+ 有符号差值算法：如Linux的"`before(seq1, seq2)`"通过有符号整数比较，正确处理回绕后的seqno顺序。

关键结论

+ 双重保险：时间戳（PAWS）解决报文延迟问题，窗口约束确保 $ A_{\text{old}} $ 无法落入有效范围。
+ 性能与可靠性：PAWS默认开启，时间戳同步精度达毫秒级，结合动态窗口滑动，彻底消除历史seqno干扰。

### TCP 头部时间戳选项（TCP Timestamps Option，TSopt）
这个选项在 TCP 头部的位置如下所示。

![](https://images.spumn.eu.cc/cs-knowledge-wiki/csapp/cs144/labs/a547e96d91f9-v2-5671eb12bf15da2f12d44bdf2d5c48c6_1440w.jpg)

Timestamps 选项最初是在 [RFC 1323](https://zhida.zhihu.com/search?content_id=224133788&content_type=Article&match_order=1&q=RFC+1323&zhida_source=entity) 中引入的，这个 RFC 的标题是 "TCP Extensions for High Performance"，在这个 RFC 中同时提出的还有 Window Scale、[PAWS](https://zhida.zhihu.com/search?content_id=224133788&content_type=Article&match_order=1&q=PAWS&zhida_source=entity) 等机制。

**Timestamps 选项的组成部分**

在 [Wireshark](https://zhida.zhihu.com/search?content_id=224133788&content_type=Article&match_order=1&q=Wireshark&zhida_source=entity) 抓包中，会看到 TSval 和 TSecr 两个选项，第二个选项 TSecr 不是 secrets 的意思，而是 "TS Echo Reply" 的缩写，TSval 和 TSecr 是 TCP 选项时间戳的一部分。

TCP Timestamps Option 由四部分构成：类别（kind）、长度（Length）、发送方时间戳（TS value）、回显时间戳（TS Echo Reply）。时间戳选项类别（kind）的值等于 8，用来与其它类型的选项区分。长度（length）等于 10。两个时间戳相关的选项都是 4 字节。

![](https://images.spumn.eu.cc/cs-knowledge-wiki/csapp/cs144/labs/06af5251a46e-v2-68c136f327c4726ab76356a99014e75b_1440w.jpg)

+ 发送方发送数据时，将一个发送时间戳 1734581141 放在发送方时间戳`TSval`中
+ 接收方收到数据包以后，将收到的时间戳 1734581141 原封不动的返回给发送方，放在`TSecr`字段中，同时把自己的时间戳 3303928779 放在`TSval`中
+ 自己的时间戳放在TSval中，对方的时间戳放到TSecr中。

![](https://images.spumn.eu.cc/cs-knowledge-wiki/csapp/cs144/labs/8352e87fd42a-v2-ec852f6866d721510f661d384b5efd9d_1440w.jpg)

Timestamps 选项的提出初衷是为了解决两个问题：

1. 两端往返时延测量（[RTTM](https://zhida.zhihu.com/search?content_id=224133788&content_type=Article&match_order=1&q=RTTM&zhida_source=entity)）

TCP 在发送一个包时，会记录这个包的发送的时间 t1，用收到这个包的确认包时 t2 减去 t1 就可以得到这次的 RTT。这里有一个问题，如果发出的包出现重传，计算就变得复杂起来。这里的 RTT 到底是 t3 - t1 还是 t3 - t2 呢？这两种方式无论选择哪一种都不太合适，无法得知收到的确认 ACK 是对第一次包还是重传包的的确认。TCP RFC6298 对这种行为的处理是不对重传包进行 RTT 计算，这样计算不会带来错误，但当所有包都出现重传的情况下，将没有包可用来计算 RTT。在启用 Timestamps 选项以后，因为 ACK 包里包含了 TSval 和 TSecr，这样无论是正常确认包，还是重传确认包，都可以通过这两个值计算出 RTT。

2. 序列号回绕（PAWS）

Timestamps 选项带来的第二个作用是帮助判断 PAWS，TCP 的序列号用 32bit 来表示，因此在 $ 2^{32} $ 字节的数据传输后序列号就会溢出回绕。TCP 的窗口经过窗口缩放可以最高到 1GB（$ 2^{30} $)，在高速网络中，序列号在很短的时间内就会被重复使用。假设发送了 6 个数据包，每个数据包的大小为 1GB，第 5 个包序列号发生回绕。第 2 个包因为某些原因延迟导致重传，但没有丢失到时间 t7 才到达。这个迷途数据包与后面要发送的第 6 个包序列号完全相同，如果没有一些措施进行区分，将会造成数据的紊乱。

如果有 Timestamps 的存在，内核会维护一个为每个连接维护一个 [ts_recent](https://zhida.zhihu.com/search?content_id=224133788&content_type=Article&match_order=1&q=ts_recent&zhida_source=entity) 值，记录最后一次通信的的 timestamps 值，在 t7 时间点收到迷途数据包 2 时，由于数据包 2 的 timestamps 值小于 ts_recent 值，就会丢弃掉这个数据包。等 t8 时间点真正的数据包 6 到达以后，由于数据包 6 的 timestamps 值大于 ts_recent，这个包可以被正常接收。

![](https://images.spumn.eu.cc/cs-knowledge-wiki/csapp/cs144/labs/83f89c72bee9-v2-0528220fcefac94926ae4136d87d3119_1440w.jpg)

+ timestamps 值是一个单调递增的值，与我们所知的 epoch 时间戳不是一回事，这个选项不要求两台主机进行时钟同步。两端 timestamps 值增加的间隔也可能步调不一致，比如一条主机以每 1ms 加一的方式递增，另外一条主机可以以每 1s 加一的方式递增。
+ 与序列号一样，既然是递增 timestamps 值也是会溢出回绕的。
+ timestamps 是一个双向的选项，如果只要有一方不开启，双方都将停用 timestamps。
+ 三次握手中的第二步，如果服务端回复 SYN+ACK 包中的 TSecr 不等于握手第一步客户端发送 SYN 包中的 TSval，客户端在对 SYN+ACK 回复 RST。因为时间戳不一致，要重置连接、复位连接。

### Implementing the TCP receiver
Congratulations on getting the wrapping and unwrapping logic right! We’ll shake your hand (or, post-covid, elbow-bump) if this victory happens at the lab session. In the rest of this lab, you’ll be implementing the `TCPReceiver`. It will (1) receive messages from its peer’s sender and reassemble the `ByteStream` using a `Reassembler`, and (2) send messages back to the peer’s sender that contain the acknowledgment number (**ackno**) and **window size**. We’re expecting this to take **about 15 lines of code** in total.

First, let’s review the format of a TCP “sender message,” which contains the information about the `ByteStream`. These messages are sent from a `TCPSender` to its peer’s `TCPReceiver`:

```c
/*
* The TCPSenderMessage structure contains five fields (minnow/util/tcp_sender_message.hh):
*
* 1) The sequence number (seqno) of the beginning of the segment. If the SYN flag is set,
* this is the sequence number of the SYN flag. Otherwise, it's the sequence number of
* the beginning of the payload.
*
* 2) The SYN flag. If set, this segment is the beginning of the byte stream, and the seqno field
* contains the Initial Sequence Number (ISN) -- the zero point.
*
* 3) The payload: a substring (possibly empty) of the byte stream.
*
* 4) The FIN flag. If set, the payload represents the ending of the byte stream.
*
* 5) The RST (reset) flag. If set, the stream has suffered an error and the connection
* should be aborted.
*/
struct TCPSenderMessage
{
    Wrap32 seqno { 0 };
    bool SYN {};
    std::string payload {};
    bool FIN {};
    bool RST {};
    // How many sequence numbers does this segment use?
    size_t sequence_length() const { return SYN + payload.size() + FIN; }
};
```

The `TCPReceiver` generates its own <font style="color:#D22D8D;">messages back to the peer’s </font>`<font style="color:#D22D8D;">TCPSender</font>`:

```cpp
/*
* The TCPReceiverMessage structure contains three fields (minnow/util/tcp_receiver_message.hh):
*
* 1) The acknowledgment number (ackno): the *next* sequence number needed by the TCP Receiver.
* This is an optional field that is empty if the TCPReceiver hasn't yet received the
* Initial Sequence Number.
*
* 2) The window size. This is the number of sequence numbers that the TCP receiver is interested
* to receive, starting from the ackno if present. The maximum value is 65,535 (UINT16_MAX from
* the <cstdint> header).
*
* 3) The RST (reset) flag. If set, the stream has suffered an error and the connection
* should be aborted.
*/
struct TCPReceiverMessage
{
    std::optional<Wrap32> ackno {};
    uint16_t window_size {};
    bool RST {};
};
```

Your `TCPReceiver`’s job is to receive one of these kinds of messages and send the other:

```cpp
class TCPReceiver
{
    public:
    // Construct with given Reassembler
    explicit TCPReceiver( Reassembler&& reassembler ) : reassembler_( std::move( reassembler ) ) // The TCPReceiver receives TCPSenderMessages from the peer's TCPSender.
    void receive( TCPSenderMessage message );
    // The TCPReceiver sends TCPReceiverMessages to the peer's TCPSender.
    TCPReceiverMessage send() const;
    // Access the output (only Reader is accessible non-const)
    const Reassembler& reassembler() const { return reassembler_; }
    Reader& reader() { return reassembler_.reader(); }
    const Reader& reader() const { return reassembler_.reader(); }
    const Writer& writer() const { return reassembler_.writer(); }
    private:
    Reassembler reassembler_;
};
```

#### receive()
This is method will be called each time a new segment is received from the peer’s sender. This method needs to:

+ **Set the Initial Sequence Number if necessary**. The sequence number of the first-arriving segment that has the `SYN` flag set is the initial sequence number. You’ll want to keep track of that in order to keep converting between 32-bit wrapped seqnos/acknos and their absolute equivalents. (Note that the `SYN` flag is just one flag in the header. The same message could also carry data or have the `FIN` flag set.)  
+ **Push any data to the **`**Reassembler**`. If the `FIN` flag is set in a `TCPSegment`’s header, that means that the last byte of the payload is the last byte of the entire stream. Remember that the `Reassembler` expects stream indexes starting at zero; <font style="color:#601BDE;">you will have to unwrap the seqnos</font> to produce these.

## Development and debugging advice
1. Implement the `TCPReceiver`’s public interface (and any private methods or functions you’d like) in the file `tcp_receiver.cc`. You may add any private members you like to the `TCPReceiver `class in `tcp_receiver.hh`.
2. You can test your code with `cmake --build build --target check2` .
3. Please re-read the section on “using Git” in the Lab 0 document, and remember to keep the code in the Git repository it was distributed in on the main branch. Make small commits, using good commit messages that identify what changed and why.
4. Please work to make your code readable to the CA who will be grading it for style. Use reasonable and clear naming conventions for variables. Use comments to explain complex or subtle pieces of code. Use “defensive programming”—explicitly check preconditions of functions or invariants, and throw an exception if anything is ever wrong. Use modularity in your design—identify common abstractions and behaviors and factor them out when possible. Blocks of repeated code and enormous functions will make your code harder to follow.
5. Please also keep to the “Modern C++” style described in the Checkpoint 0 document. The cppreference website ([https://en.cppreference.com](https://en.cppreference.com)) is a great resource, although you won’t need any sophisticated features of C++ to do these labs.

## Submit
1. In your submission, please only make changes to the .hh and .cc files in the src directory. Within these files, please feel free to add private members as necessary, but please don’t change the public interface of any of the classes.
2. Before handing in any assignment, please run these in order:
    1. Make sure you have committed all of your changes to the Git repository. You can run `git status` to make sure there are no outstanding changes. Remember: make small commits as you code. 
    2. `cmake --build build --target format` (to normalize the coding style) 
    3. `cmake --build build --target check2` (to make sure the automated tests pass) 
    4. Optional: `cmake --build build --target tidy` (suggests improvements to follow good C++ programming practices)
3. Write a report in writeups/check2.md. This file should be a roughly 20-to-50-line document with no more than 80 characters per line to make it easier to read. The report should contain the following sections:
    1. **Program Structure and Design**. Describe the high-level structure and design choices embodied in your code. You do not need to discuss in detail what you inherited from the starter code. Use this as an opportunity to highlight important design aspects and provide greater detail on those areas for your grading TA to understand. You are strongly encouraged to make this writeup as readable as possible by using subheadings and outlines. Please do not simply translate your program into an paragraph of English. 
    2. **Alternative design choices** that you considered or ideally evaluated in terms of their performance, difficulty to write (e.g., hours required to produce a bug-free implementation), difficulty to read (e.g., lines of code and their degree of subtlety or nonobvious correctness), and any other dimensions you think are interesting for the reader (or for your own past self before you did this assignment). Include any measurements if applicable. 
    3. **Implementation Challenges**. Describe the parts of code that you found most troublesome and explain why. Reflect on how you overcame those challenges and what helped you finally understand the concept that was giving you trouble. How did you attempt to ensure that your code maintained your assumptions, invariants, and preconditions, and in what ways did you find this easy or difficult? How did you debug and test your code? 
    4. **Remaining Bugs**. Point out and explain as best you can any bugs (or unhandled edge cases) that remain in the code.
4. In your writeup, please also fill in the number of hours the assignment took you and any other comments.
5. Please let the course staff know ASAP of any problems at the lab session, or by posting a question on Ed. Good luck!

## Extra Credit
Extra credit will be rewarded for improvements to the test suite. Add a test case to one of the files in the tests directory (e.g. minnow/tests/recv connect.cc) that catches a **real bug** that somebody might reasonably make that isn’t already caught by the existing test suite. Please submit your test as a **Pull Request** (it’s okay to make this public) so we can take a look and decide whether to add it to the overall testsuite. (This opportunity will remain open—e.g. if you find a good additional test for the `Reassembler` in week 7, that’s great too.)

