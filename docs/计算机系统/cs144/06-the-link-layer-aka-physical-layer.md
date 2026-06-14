# The Link Layer aka Physical Layer

![1.jpg](./assets/1-20231123113518-zjxw08j.jpg)

![2.jpg](./assets/2-20231123113518-1jloelt.jpg)

## “OSI model” (4/5/7 layers)

![image3.png](./assets/image3-20231123113518-rl2q1ra.png)

Last Time: How naming works? (How names are assigned and discovered?)

![image2.png](./assets/image2-20231123113518-dacj9qn.png)

Q: Why can’t we use MAC address as our IP address?

A: we need a **structured way** to delegate the responsibility of “looking for the next hop given the IP address”. Using IP addresses make this easier, since each hop can only care about the prefix of IP addresses in the local routing table. However, if we are using unstructured addresses such as hardware addresses, the routing table would each of size the number of total hardware addresses.

![3.jpg](./assets/3-20231123113518-64e6qn7.jpg)

![4.jpg](./assets/4-20231123113518-qx2p7iz.jpg)

## From “bits” to real world:

Bits are 0s and 1s: 10110110. How to translate that to analog.

One proposal: “1” -&gt; high voltage/signal; “0” -&gt; low voltage/signal

- The signal may be: low, high for a while, low for a while
- Then it’s hard to tell from the signal how many 0s and 1s there are without knowing how long each 0 and 1 lasts.

Another proposal: **preamble** - a special sequence before the actual stream to give the clock speed.

- preamble : `10101010` - high low high low …
- And then the receiver knows how long each “tick” is

But preamble is not enough for **clock synchronization**. “0” -&gt; downward transition, “1” -&gt; upward transition.

- For each “clock tick”, there must be a transition.
- Therefore, the **clock rate** can be calculated by looking at the time interval between two transitions, whether each of them is downward or upward.

![5.jpg](./assets/5-20231123113518-wxzfouv.jpg)

![6.jpg](./assets/6-20231123113518-cohq10c.jpg)

![7.jpg](./assets/7-20231123113518-rnx2uhp.jpg)

![8.jpg](./assets/8-20231123113518-ap2mppf.jpg)

## **Shannon’s capacity**

How did we tell what the link rate is?

Limits:

- Sender’s average power (“loudness”): more power probably means more bits per second
- Receiver’s average noise power: the larger the noise the less bits per second (assumes normal distribution)

The band width - the range of frequencies allowed to use: the larger this range is the more can be transmitted

In the old days: people “believed” there were a tradeoff between link rate and error rate, and this can’t be precisely described in a mathematical way:

- Intuitively, the slower you send, the more power you put into each bits and then the message would be “clearer”

BUT, there is an equation:

[公式]

- (P - average power, N - average noise, W - band width)
- **Single-flow** from a sender to a receiver. If you **send lower than the capacity C**, for whatever error rate, it can be done period.
- Information theory (1948)

![9.jpg](./assets/9-20231123113518-e8npr4m.jpg)

![10.jpg](./assets/10-20231123113518-92vgid6.jpg)

![11.jpg](./assets/11-20231123113518-7gdtzgb.jpg)

![12.jpg](./assets/12-20231123113518-oohe2vg.jpg)

![13.jpg](./assets/13-20231123113518-wbcsx0w.jpg)

![14.jpg](./assets/14-20231123113518-xg71a93.jpg)

![15.jpg](./assets/15-20231123113518-ob57k1p.jpg)

![16.jpg](./assets/16-20231123113518-vs8quw5.jpg)

![17.jpg](./assets/17-20231123113518-sksgwdv.jpg)

![18.jpg](./assets/18-20231123113518-6u1zym6.jpg)

Bandwidth在模拟信号中可以指：

- 每秒周期数，即频率，以赫兹表示
- 信号所包含的不同频率成分所占据的频率范围。

![19.jpg](./assets/19-20231123113518-eob7spb.jpg)

![20.jpg](./assets/20-20231123113518-attop7z.jpg)

![21.jpg](./assets/21-20231123113518-jlfedna.jpg)

![22.jpg](./assets/22-20231123113518-5oc86w0.jpg)

![23.jpg](./assets/23-20231123113518-dy62ato.jpg)

![24.jpg](./assets/24-20231123113518-s2837d2.jpg)

![25.jpg](./assets/25-20231123113518-sq4z61q.jpg)

![26.jpg](./assets/26-20231123113518-is0wvtd.jpg)

![27.jpg](./assets/27-20231123113518-2u67hqq.jpg)

## **Clock Synchronization**

![28.jpg](./assets/28-20231123113518-4k5gy35.jpg)

part per million(ppm)：百万分之分数。比百分数更精确。

![29.jpg](./assets/29-20231123113518-iu467v2.jpg)

![30.jpg](./assets/30-20231123113518-iv4uqox.jpg)

![31.jpg](./assets/31-20231123113518-mbb6dpd.jpg)

![32.jpg](./assets/32-20231123113518-aeu2h90.jpg)

![33.jpg](./assets/33-20231123113518-mrlv1q6.jpg)

![34.jpg](./assets/34-20231123113518-icgyv6q.jpg)

## Elasiticity Buffer

弹性缓冲器能够补偿时钟偏差, 解决了不同时钟域下的数据传输问题。结合PCIe 2.0协议, 采用常半满方式对弹性缓冲器进行了设计。

&gt; 转载自 [http://blog.chinaaet.com/justlxy/p/5100057990](http://blog.chinaaet.com/justlxy/p/5100057990)
&gt;

前面在介绍PCIe物理层逻辑子层的文章中，有提到过弹性缓存（Elastic Buffer，又称为CTC Buffer或者Synchronization Buffer）。其本质上是一种FIFO，主要用于解决跨时钟域问题。当然，PCIe的弹性缓存还用于补偿时钟误差（Compensate for the clock differences）。实际上，除了PCIe，弹性缓存还广泛应用于其它的高速串行接口——USB、InfiniBand、Fibre Channel、Gigabit Ethernet等基于SerDes的应用。

由于PCIe采用的基于8b/10b的嵌入式源同步时钟，接收端存在两个时钟域：一个是通过CDR从数据流中解析出来的时钟，用该时钟对数据进行采样；另一个是本地时钟域，用于其他的逻辑的。借助弹性缓存（FIFO），可以实现数据在这两个时钟域的转换。

以PCIe Gen1为例，链路上的数据速率为2.5Gbps。但实际上，任何晶振（或者其他频率发生器）都是有误差的，PCIe Spec允许的误差范围为±300ppm（Parts Per Million）。即，链路上实际的频率范围为2.49925GHz~2.50075GHz。借助弹性缓存，通过删除或者插入SKP Ordered Set可以消除链路频率误差的影响。如下图所示：

![http://files.chinaaet.com/images/blog/2019/20180821/1000019445-6367046285659124757718866.png](http://files.chinaaet.com/images/blog/2019/20180821/1000019445-6367046285659124757718866.png)

需要注意的是PCIe Spec并没有规定弹性缓存的具体位置，设计者可以将弹性缓存放在8b/10b解码器之前，也可以把弹性缓存放在8b/10b解码器之后。不过，Mindshare的建议是将弹性缓存放置于8b/10b解码器之前的。

当本地时钟域的时钟（Local Clock）的速度比数据流通过CDR解析出的时钟（Recovered Clock）的**时钟要快**时，且弹性缓存即将被读空之前，可以**向SKP Ordered Set中插入1~2个SKP**。如下图所示：

![http://files.chinaaet.com/images/blog/2019/20180821/1000019445-6367046286454501089584825.png](http://files.chinaaet.com/images/blog/2019/20180821/1000019445-6367046286454501089584825.png)

当本地时钟域的时钟（Local Clock）的速度比数据流通过CDR解析出的时钟（Recovered Clock）的**时钟要慢**时，且弹性缓存即将溢出之前，可以**从SKP Ordered Set中移除1~2个SKP**。如下图所示：

![http://files.chinaaet.com/images/blog/2019/20180821/1000019445-6367046287438955002676133.png](http://files.chinaaet.com/images/blog/2019/20180821/1000019445-6367046287438955002676133.png)

需要特别注意的是，Intel提出的PIPE规范（并非PCI-SIG强制的规范，具体参考前面关于PIPE的文章）中，只允许每次从一个SKP Ordered Set中插入或者移除一个SKP。如果需要插入或者移除两个SKP，则需要对两个SKP Ordered Set进行操作。如下图所示：

![http://files.chinaaet.com/images/blog/2019/20180821/1000019445-6367046288385905951283833.png](http://files.chinaaet.com/images/blog/2019/20180821/1000019445-6367046288385905951283833.png)

![35.jpg](./assets/35-20231123113518-hnq39rw.jpg)

![36.jpg](./assets/36-20231123113518-ghiji40.jpg)

![37.jpg](./assets/37-20231123113518-rglena1.jpg)

![38.jpg](./assets/38-20231123113518-uxunf87.jpg)

![39.jpg](./assets/39-20231123113518-a3rqebn.jpg)

注释：

- +/- 100ppm 即 [公式]
- 要等到Buffer中有一半数据之后，才开始取数据。
