---
source: https://www.yuque.com/yangguangfanxing/zuyi8o/bcmi308gg2bte724
---

# Diffie–Hellman Key Exchange

> 原文链接：[https://www.yuque.com/yangguangfanxing/zuyi8o/bcmi308gg2bte724](https://www.yuque.com/yangguangfanxing/zuyi8o/bcmi308gg2bte724)

[Diffie–Hellman Key Exchange](https://en.wikipedia.org/wiki/Diffie%E2%80%93Hellman_key_exchange) (DHKE) is a cryptographic method to **securely exchange cryptographic keys** (key agreement protocol) over a public (insecure) channel in a way that overheard communication does not reveal the keys. The exchanged keys are used later for encrypted communication (e.g. using a symmetric cipher like AES).

**DHKE** was one of the first **public-key protocols**, which allows two parties to exchange data securely, so that is someone sniffs the communication between the parties, the information exchanged can be revealed.

The Diffie–Hellman (DH) method is **anonymous key agreement scheme**: it allows two parties that have no prior knowledge of each other to jointly establish a **shared secret key over an insecure channel**.

Note that the DHKE method is **resistant to** [sniffing attacks](https://en.wikipedia.org/wiki/Sniffing_attack) (data interception), but it is **vulnerable to** [**man-in-the-middle attacks**](https://en.wikipedia.org/wiki/Man-in-the-middle_attack) (attacker secretly relays and possibly **alters the communication** between two parties).

The **Diffie–Hellman Key Exchange** protocol can be implemented using **discrete logarithms** (the classical [DHKE](https://en.wikipedia.org/wiki/Diffie%E2%80%93Hellman_key_exchange) algorithm) or using **elliptic-curve cryptography** (the [ECDH](https://en.wikipedia.org/wiki/Elliptic-curve_Diffie%E2%80%93Hellman) algorithm).

### Key Exchange by Mixing Colors

The Diffie–Hellman Key Exchange protocol is very similar to the concept of "**key exchanging by mixing colors**", which has a good visual representation, which simplifies its understanding. This is why we shall first explain how to exchange a secret color by **color mixing**.

The design of color mixing key exchange scheme assumes that if we have two liquids of different colors, we can **easily mix the colors** and obtain a new color, but the reverse operation is almost impossible: **no way to separate the mixed colors** back to their original color components.

This is the color exchange **scenario**, step by step:

-   **Alice** and **Bob**, agree on an arbitrary **starting (shared) color** that does not need to be kept secret (e.g. *yellow*).
-   **Alice** and **Bob** separately select a **secret color** that they keep to themselves (e.g. *red* and *sea green*).
-   Finally **Alice** and **Bobmix** their secret color together with their mutually shared color. The obtained mixed colors area ready for public exchange (in our case *orange* and *light sky blue*).

![](https://cdn.nlark.com/yuque/0/2023/png/22382307/1692092557049-4edf38c0-6649-4638-bf67-8648f054556d.png)

The next steps in the color exchanging scenario are as follows:

-   **Alice** and **Bob** publicly **exchange** their two **mixed colors**.

<!-- -->

-   <u>We assume that there is no efficient way to extract (separate) the secret color from the mixed color</u>, so third parties who know the mixed colors cannot reveal the secret colors.

<!-- -->

-   Finally, **Alice** and **Bob** mix together the color they received from the partner with their own secret color.

<!-- -->

-   The result is the **final color mixture** (*yellow-brown*) which is identical to the partner's color mixture.
-   It is the **securely exchanged shared key**.

![](https://cdn.nlark.com/yuque/0/2023/png/22382307/1692092557045-22821572-f682-4ac9-b5f0-64418277b922.png)

If a third parties have intercepted the color exchanging process, it would be computationally difficult for them to determine the secret colors.

The **Diffie-Hellman Key Exchange** protocol is based on similar concept, but uses [discrete logarithms](https://en.wikipedia.org/wiki/Discrete_logarithm) and [modular exponentiations](https://en.wikipedia.org/wiki/Modular_exponentiation) instead of color mixing.

# The Diffie-Hellman Key Exchange (DHKE) Protocol

Now, let's explain how the **DHKE** protocol works.

## The Math behind DHKE

**DHKE** is based on a simple property of [modular exponentiations](https://en.wikipedia.org/wiki/Modular_exponentiation):

where **g**, **a**, **b** and **p** are positive integers.

If we have and , we can calculate , without revealing **a** or **b** (which are called **secret exponents**).

In computing theory, these is no efficient algorithm which can find a secret exponent. If we have **m**, **g** and **p** from the below equation:

there is no efficient (fast) algorithm to find the secret exponent . This is known as the [Discrete Logartihm Problem (DLP)](https://en.wikipedia.org/wiki/Discrete_Logarithm_Problem_(DLP)).

## Discrete Logarithm Problem (DLP)

The **Discrete Logarithm Problem (DLP)** in computer science is defined as follows:

-   By given element ***b*** and value find the exponent ***x*** (if it exists)

The exponent ***x*** is called [discrete logarithm](https://en.wikipedia.org/wiki/Discrete_logarithm), i.e. . **The elements** ***a*** **and** ***b*** **can be simple integers modulo** *p* **(from the** [**group ℤ/pℤ**](https://en.wikipedia.org/wiki/Multiplicative_group_of_integers_modulo_n) 整数模n乘法群**) or elements of** [**finite cyclic multiplicative group G**](https://en.wikipedia.org/wiki/Cyclic_group) **(modulo** ***p*)(**[有限域的乘法群](https://zhuanlan.zhihu.com/p/539510930)**), where** ***p*** **is typically a prime number.**

> [群论及抽象代数学习笔记（2）- 一些群的介绍（上）：整数模n加法群与二面体群](https://zhuanlan.zhihu.com/p/604295896)

In cryptography, many algorithms rely on the **computational difficulty of the DLP problem** over carefully chosen group, for which **no efficient algorithm exists**.

> ## 有限域的乘法群一定是循环群
>
> ​因为是有限域，所以必然是**整环**，所以必然**无零因子**，进而**度公式**必然满足，即 。  
> 的不同根最多有 n 个（可以结合度公式采用反证法进行说明），同时的不同根最多只有 n-1个。
>
> 又因为 是群的阶，所以，必然乘法群中 n 个不同的元素都满足 ，所以 有 n 个不同的根。
>
> 同时，有 n-1 个不同的根，进而必然有一个元素不是 的根，而又是的根。
>
> 显然这就意味着这个元素是一个阶为 n 的元素，即该元素是一个乘法群的**生成元**，进而显然该乘法群为循环群。证毕！

## The DHKE Protocol

Now, after we are familiar with the above mathematical properties of the modular exponentiations, we are ready to explain **the DHKE protocol**. This is how it works:

![](https://cdn.nlark.com/yuque/0/2023/png/22382307/1692092556802-025a32af-ced1-4a1c-b72b-de3fd2419767.png)

Let's explain each step of this key-exchange process:

-   Alice and Bob agree to use two public integers: **modulus p** and **base g** (where **p** is [prime](https://en.wikipedia.org/wiki/Prime_number), and **g** is a [primitive root modulo](https://en.wikipedia.org/wiki/Primitive_root_modulo_n) **p** [模p原根](https://zhuanlan.zhihu.com/p/638142646)).

<!-- -->

-   For example, let **p** = 23 and **g** = 5.
-   The integers **g** and **p** are public, typically hard-coded constants in the source code.

<!-- -->

-   Alice chooses a **secret integer a** (e.g. **a** = 4), then calculates and sends to Bob the number .

<!-- -->

-   The number **A** is public. It is sent over the public channel and its interception cannot reveal the secret exponent **a**.
-   In our case we have: .

<!-- -->

-   Bob chooses a **secret integer b** (e.g. **b** = 3), then calculates and sends to Alice the number $**B = g**.

<!-- -->

-   In our case we have:

<!-- -->

-   Alice computes

<!-- -->

-   In our example:

<!-- -->

-   Bob computes

<!-- -->

-   In our example:

<!-- -->

-   Alice and Bob now share a **secret number s**

<!-- -->

-   
-   The shared secret key **s** cannot be computed from the publicly available numbers **A** and **B**, because the secret exponents **a** and **b** cannot be efficiently calculated.

In the most common implementation of DHKE (following the [RFC 3526](https://tools.ietf.org/html/rfc3526)) the base is **g** = **2** and the modulus **p** is a large **prime number** (1536 ... 8192 bits).

## Security of the DHKE Protocol

The DHKE protocol is based on the practical difficulty of the [Diffie–Hellman problem](https://en.wikipedia.org/wiki/Diffie%E2%80%93Hellman_problem), which is a variant of the well known in the computer science [DLP (discrete logarithm problem)](https://en.wikipedia.org/wiki/Discrete_Logarithm_Problem_(DLP)), for which no efficient algorithm still exists.

DHKE exchanges a **non-secret sequence of integer numbers** over insecure, public (sniffable) channel (such as signal going through a cable or propagated by waves in the air), but does not reveal the secretly-exchanged shared private key.

Again, be warned that DHKE protocol in its classical form is **vulnerable to** [man-in-the-middle attacks](https://en.wikipedia.org/wiki/Man-in-the-middle_attack), where a hacker can intercept and modify the messages exchanged between the parties.

Finally, note that the integers **g**, **p**, **a** and **p** are typically very big numbers (1024, 2048 or 4096 bits or even bigger) and this makes the [brute-force attacks](https://en.wikipedia.org/wiki/Brute-force_attack) non-sense.

## DHKE - Live Example

As live example, you can play with this online DHKE tool: <http://www.irongeek.com/diffie-hellman.php>

![](https://cdn.nlark.com/yuque/0/2023/png/22382307/1692092557047-81c8dd24-15ff-466d-ba34-db420f63ee5b.png)

## ECDH - Elliptic Curves-based Diffie-Hellman Key Exchange Protocol

The [Elliptic-Curve Diffie–Hellman (ECDH)](https://en.wikipedia.org/wiki/Elliptic-curve_Diffie%E2%80%93Hellman) is an anonymous key agreement protocol that allows two parties, each having an **elliptic-curve public–private key pair**, to establish a shared secret over an insecure channel.

**ECDH** is a variant of the classical **DHKE** protocol, where the **modular exponentiation** calculations are replaced with **elliptic-curve** calculations for improved security. We shall explain in details the **elliptic-curve cryptography (ECC)** section later.
