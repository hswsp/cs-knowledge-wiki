---
source: https://www.yuque.com/yangguangfanxing/zuyi8o/lnoeam33brrgvbi2
---

# ECDH Key Exchange

> 原文链接：[https://www.yuque.com/yangguangfanxing/zuyi8o/lnoeam33brrgvbi2](https://www.yuque.com/yangguangfanxing/zuyi8o/lnoeam33brrgvbi2)

The [ECDH](https://en.wikipedia.org/wiki/Elliptic-curve_Diffie%E2%80%93Hellman) (Elliptic Curve Diffie–Hellman Key Exchange) is **anonymous key agreement scheme**, which allows two parties, each having an elliptic-curve public–private key pair, to establish a **shared secret** over an insecure channel. **ECDH** is very similar to the classical **DHKE** (Diffie–Hellman Key Exchange) algorithm, but it uses **ECC point multiplication** instead of **modular exponentiations**. ECDH is based on the following property of EC points:

-   (***a*** \* **G**) \* ***b*** = (***b*** \* **G**) \* ***a***

If we have two **secret numbers** ***a*** and ***b*** (two **private keys**, belonging to Alice and Bob) and an ECC elliptic curve with generator point **G**, we can exchange over an insecure channel the values (***a*** \* **G**) and (***b*** \* **G**) (the **public keys** of Alice and Bob) and then we can derive a shared secret: `secret = (a * G) * b = (b * G) * a`. Pretty simple. The above equation takes the following form:

-   `alicePubKey * bobPrivKey = bobPubKey * alicePrivKey = secret`

The **ECDH** algorithm (Elliptic Curve Diffie–Hellman Key Exchange) is trivial:

1.  **Alice** generates a **random** ECC key pair:` {alicePrivKey, alicePubKey = alicePrivKey * G}`
2.  **Bob** generates a **random** ECC key pair: `{bobPrivKey, bobPubKey = bobPrivKey * G}`
3.  Alice and Bob **exchange their public keys** through the insecure channel (e.g. over Internet)
4.  **Alice** calculates `sharedKey = bobPubKey * alicePrivKey`
5.  **Bob** calculates `sharedKey = alicePubKey * bobPrivKey`
6.  Now both **Alice** and **Bob** have the same `sharedKey == bobPubKey * alicePrivKey == alicePubKey * bobPrivKey`

In the next section, we shall implement the ECDH algorithm and demonstrate it with code example.

## ECDH Key Exchange - Examples

Now let's implement the **ECDH** algorithm (Elliptic Curve Diffie–Hellman Key Exchange) in Python.

We shall use the tinyec library for ECC in Python:

``` bash
pip install tinyec
```

Now, let's generate two public-private **key pairs**, exchange the **public keys** and calculate the **shared secret**:

``` python
from tinyec import registry
import secrets

def compress(pubKey):
    return hex(pubKey.x) + hex(pubKey.y % 2)[2:]

curve = registry.get_curve('brainpoolP256r1')

alicePrivKey = secrets.randbelow(curve.field.n)
alicePubKey = alicePrivKey * curve.g
print("Alice public key:", compress(alicePubKey))

bobPrivKey = secrets.randbelow(curve.field.n)
bobPubKey = bobPrivKey * curve.g
print("Bob public key:", compress(bobPubKey))

print("Now exchange the public keys (e.g. through Internet)")

aliceSharedKey = alicePrivKey * bobPubKey
print("Alice shared key:", compress(aliceSharedKey))

bobSharedKey = bobPrivKey * alicePubKey
print("Bob shared key:", compress(bobSharedKey))

print("Equal shared keys:", aliceSharedKey == bobSharedKey)
```

> **注意的一点是：**`bin()`**、**`oct()`**、**`hex()`**的返回值均为字符串，且分别带有**`0b`**、**`0o`**、**`0x`**前缀。故后面在读取的时候需要舍去前缀。**

Run the above code example: <https://repl.it/@nakov/ECDH-Key-Exchange-in-Python>.

The **elliptic curve** used for the ECDH calculations is **256-bit** named curve `brainpoolP256r1`. The **private keys** are **256-bit** (64 hex digits) and are generated randomly. The **public keys** will be **257 bits** (65 hex digits), due to **key compression**.

The **output** of the above code looks like this:

``` bash
Alice public key: 0x66c808e6b5be6d6620934bc6ffa2b8b47f9786c002bfb06d53a0c27535641a5d1
Bob public key: 0x7d15195432d1ac7f38aeb054d07d9b2e1faa913b78ad04d5efdd4a1ee8d9a3191
Now exchange the public keys (e.g. through Internet)
Alice shared key: 0x90f5a1cf2ed1dbb0322178df6bb0dd72c541884618b2989a3e5e663198667a621
Bob shared key: 0x90f5a1cf2ed1dbb0322178df6bb0dd72c541884618b2989a3e5e663198667a621
Equal shared keys: True
```

Due to randomization, if you run the above code, the **keys will be different**, but the calculated **shared secret** for Alice and Bob at the end will always be **the same**. The generated **shared secret** is a **257-bit** integer (compressed EC point for 256-bit curve, encoded as 65 hex digits).
