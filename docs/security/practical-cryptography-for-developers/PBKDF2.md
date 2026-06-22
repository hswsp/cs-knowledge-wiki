---
source: https://www.yuque.com/yangguangfanxing/zuyi8o/axkfbqllfgribhpu
---

# PBKDF2

> 原文链接：[https://www.yuque.com/yangguangfanxing/zuyi8o/axkfbqllfgribhpu](https://www.yuque.com/yangguangfanxing/zuyi8o/axkfbqllfgribhpu)

**PBKDF2** is a simple cryptographic key derivation function, which is resistant to [dictionary attacks](https://en.wikipedia.org/wiki/Dictionary_attack) and [rainbow table attacks](https://en.wikipedia.org/wiki/Rainbow_table). It is based on iteratively deriving **HMAC** many times with some padding. The **PBKDF2** algorithm is described in the Internet standard [RFC 2898 (PKCS #5)](http://ietf.org/rfc/rfc2898.txt).

**PBKDF2** takes several **input parameters** and produces the derived **key** as output:

``` python
key = pbkdf2(password, salt, iterations-count, hash-function, derived-key-len)
```

Technically, the **input data** for **PBKDF2** consists of:

-   `password` – array of bytes / string, e.g. "*p@$Sw0rD\~3*" (8-10 chars minimal length is recommended)
-   `salt` – securely-generated random bytes, e.g. "*df1f2d3f4d77ac66e9c5a6c3d8f921b6*" (**minimum 64 bits, 128 bits is recommended**)
-   `iterations`-count, e.g. 1024 iterations
-   `hash-function` for calculating **HMAC**, e.g. SHA256
-   `derived-key-len` for the output, e.g. 32 bytes (256 bits)

The **output data** is the **derived key** of requested length (e.g. 256 bits).

## PBKDF2 and Number of Iterations

**PBKDF2** allows to configure the number of **iterations** and thus to configure the time required to derive the key.

-   **Slower key derivation** means high login time / slower decryption / etc. and **higher resistance** to password cracking attacks.
-   **Faster key derivation** means short login time / faster decryption / etc. and **lower resistance** to password cracking attacks.
-   **PBKDF2** is **not resistant** to [GPU attacks](https://security.stackexchange.com/questions/118147/how-are-gpus-used-in-brute-force-attacks) (parallel password cracking using video cards) and to [ASIC attacks](https://en.wikipedia.org/wiki/Custom_hardware_attack) (specialized password cracking hardware). This is the main motivation behind more modern KDF functions.

## PBKDF2 - Example

Try **PBKDF2 key derivation** online here: <https://asecuritysite.com/encryption/PBKDF2z>.

![](https://cdn.nlark.com/yuque/0/2023/png/22382307/1691635520640-41e08819-cd04-407d-85c3-950ba4fe680b.png)

Try to **increase the iterations count** to see how this affects the speed of key derivation.

## PBKDF2 Calculation in Python - Example

Now, we shall write some **code in Python** to derive a key from a password using the **PBKDF2** algorithm.

Firstly, install the Python package `backports.pbkdf2` using the command:

``` bash
pip install backports.pbkdf2
```

Now, write the Python code to calculate PBKDF2:

``` python
import os, binascii
from backports.pbkdf2 import pbkdf2_hmac

salt = binascii.unhexlify('aaef2d3f4d77ac66e9c5a6c3d8f921d1')
passwd ="p@$Sw0rD~1".encode("utf8")
key = pbkdf2_hmac("sha256", passwd, salt,50000,32)
print("Derived key:", binascii.hexlify(key))
```

Run the above code example: <https://repl.it/@nakov/PBKDF2-in-Python>.

The **PBKDF2** calculation function takes several **input parameters**: **hash function** for the HMAC, the **password** (bytes sequence), the **salt** (bytes sequence), **iterations** count and the output **key length** (number of bytes for the derived key).

The **output** from the above code execution is the following:

``` bash
Derived key: b'52c5efa16e7022859051b1dec28bc65d9696a3005d0f97e506c42843bc3bdbc0'
```

Try to change the number of **iterations** and see whether and how the **execution time** changes.

## When to Use PBKDF2?

Today **PBKDF2** is considered old-fashioned and less secure than modern KDF functions, so it is recommended to use **Bcrypt**, **Scrypt** or **Argon2** instead. We shall explain all these KDF functions in details later in this section.

## Modern Key Derivation Functions

**PBKDF2** has a major weakness: it is **not GPU-resistant** and **not ASIC-resistant**, because it uses relatively small amount of RAM and can be efficiently implemented on GPU (graphics cards) or **ASIC** (specialized hardware).

Modern key-derivation functions (KDF) like [Scrypt](https://en.wikipedia.org/wiki/Scrypt) and [Argon2](https://en.wikipedia.org/wiki/Argon2) are designed to be **resistant** to **dictionary attacks**, **GPU attacks** and **ASIC attacks**. These functions derive a key (of fixed length) from a password (text) and need a lot memory (RAM), which does not allow fast parallel computations on GPU or ASIC hardware.

Algorithms like **Bcrypt**, **Scrypt** and **Argon2** are considered more **secure** KDF functions. They use **salt** + many **iterations** + a lot of **CPU** + a lot of **RAM** memory and this makes very hard to design a custom hardware to significantly speed up password cracking.

It takes a lot of **CPU time** to derive the key (e.g. 0.2 sec) + a lot of **RAM memory** (e.g. 1GB). The calculation process is memory-dependent, so **the memory access is the bottleneck** of the calculations. Faster RAM access will speed-up the calculations.

When a lot of CPU and RAM is used to derive the key from given password, **cracking passwords is slow** and inefficient (e.g. 5-10 attempts / second), even when using very good password cracking hardware and software. The goal of the modern KDF functions is to make practically infeasible to perform a brute-force attack to reverse the password from its hash.

Let's discuss in more details **Scrypt**, **Bcrypt** and **Argon2**.
