# Why congestion control

![image.png](./assets/image-20231123113518-ouh92b6.png)

Congestion control is resource management: assigning limited resources of link rate to flows

## TCP and flow control

![image.png](./assets/image 1-20231123113518-usn74mx.png)

TCP: flow-controlled bidirectional byte stream

The speed is regulated by `link_rate` at the beginning. The steady state is limited by `min(link_rate, how fast the reader is draining the byte stream (window_size))`.

## Single-flow, single-hop model

![image.png](./assets/image 2-20231123113518-da0gwh6.png)

S(ender) —--------- X(router) —---------- R(receiver) with r = 1 Gbit/s and propagation delay = 1 second

![4.jpg](./assets/4-20231123113518-ee83fyz.jpg)

![5.jpg](./assets/5-20231123113518-alwo7p3.jpg)

![6.jpg](./assets/6-20231123113518-opwzo03.jpg)

![7.jpg](./assets/7-20231123113518-yqqorw0.jpg)

The sender sends a datagram, still waiting for the corresponding `ackno`, where could the datagram be (in the sender’s mind):

- Propagating on the link
- Waiting at the router queue (bottleneck queue)
- Could have been received by the receiver, but ackno still on the way back
- Or the datagram or the ackno is lost/dropped

![8.jpg](./assets/8-20231123113518-eh1r2lu.jpg)

Outstanding segments from the sender’s perspective: `[ackno, ackno + window_size)`

`Window_size`: cap on the number of “outstanding” bytes

- “Outstanding” means sent, not acked or judged lost

![9.jpg](./assets/9-20231123113518-smetari.jpg)

Q: what if the window size is really small?

A: throughput [公式] (if propagation delay = 1s) (RTT = 2*propogation delay)

Q: what if the window size is gigantic?

A: maximum throughput: 1 Gbit/s and the router may run out of memory or huge queueing delay. We call this **congestion**.

![10.jpg](./assets/10-20231123113518-f6b98zf.jpg)

![11.jpg](./assets/11-20231123113518-u6iwusb.jpg)

![12.jpg](./assets/12-20231123113518-biu3ej2.jpg)

## Congestion is bad

Congestion collapse (in the 1980s): receivers were advertising large `window_size` and forced the router to drop lots of packet

Or some flows send too much, others are starved. There is an issue for fairness.

![13.jpg](./assets/13-20231123113518-j4ka1yu.jpg)

Useful work should increase as demand increases. It’s okay if the derivative is less than 1, but it should not be the case that the derivative is negative.

Single-flow, single-hop model would not have a collapse, since the throughput stays at 1 Gbit/s even if many packets are dropped

The “collapse” issue:

![image8.png](./assets/image8-20231123113518-g26yzqc.png)

- If there is only 1 flow: S2 → R2, throughput would be 100 Mbit/s
- If there is two flows: S → R and S2 → R2, throughput would be ~51 Mbit/s if S sends at 100 Mbit/s (**COLLAPSE**) （这种情况大约两秒发送101Mbits）
- If there is two flows: S → R and S2 → R2, S sends at 1 Mbit/s and S2 sends at 99 Mbit/s. Throughput would be 100 Mbit/s

![14.jpg](./assets/14-20231123113518-kh1qx6r.jpg)

![15.jpg](./assets/15-20231123113518-o5z00hs.jpg)

![16.jpg](./assets/16-20231123113518-nwdhax2.jpg)

![17.jpg](./assets/17-20231123113518-sc7jq5o.jpg)

The “fairness” issue:

![image9.png](./assets/image9-20231123113518-nih3fn3.png)

[Example](Why+congestion+control++b2d95387-cefe-467b-8747-700f090dff20/Example%2067d33c8b-6f7f-4740-a532-3521f7a2694a.csv)

![18.jpg](./assets/18-20231123113518-aokzpr5.jpg)

![19.jpg](./assets/19-20231123113518-wmdjxdo.jpg)

![20.jpg](./assets/20-20231123113518-3yrs933.jpg)

The objective: maximizing a utility function: [公式] and [公式]

- [公式] , max utilization
- [公式] , proportional fairness
- [公式] , min-potential-delay fairness
- [公式], max-min fairness

## Other objectivesL

![21.jpg](./assets/21-20231123113518-sg4l59k.jpg)

- Minimize flow completion time (of average download)
- Minimize page load time (with many download flows)
- Maximize “power” (= throughput / delay)

![22.jpg](./assets/22-20231123113518-e0p93rp.jpg)

Algorithms to prevent collapse are called “**congestion control**”

- What is the right window size?
- How should flows learn the window size?
