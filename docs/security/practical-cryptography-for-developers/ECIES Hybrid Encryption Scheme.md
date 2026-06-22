---
source: https://www.yuque.com/yangguangfanxing/zuyi8o/hivx0pm0bgqdovoz
---

# ECIES Hybrid Encryption Scheme

> 原文链接：[https://www.yuque.com/yangguangfanxing/zuyi8o/hivx0pm0bgqdovoz](https://www.yuque.com/yangguangfanxing/zuyi8o/hivx0pm0bgqdovoz)

A hybrid encryption scheme similar to the previously demonstrated code is standardized under the name **Elliptic Curve Integrated Encryption Scheme** (**ECIES**) in many crypto standards like [SECG SEC-1](http://www.secg.org/sec1-v2.pdf), [ISO/IEC 18033-2](https://www.shoup.net/iso/std4.pdf), [IEEE 1363a](http://grouper.ieee.org/groups/1722/contributions/2012/1722a-butterworth-ieee1363.pdf) and [ANSI X9.63](ftp://ftp.iks-jena.de/mitarb/lutz/standards/ansi/X9/x963-7-5-98.pdf). **ECIES** is a public-key authenticated encryption scheme, which works similarly to the above code examples, but uses a **KDF** (key-derivation function) for deriving separate **MAC key** and symmetric **encryption key** from the ECDH shared secret. It has many variants.

The **ECIES standard** combines ECC-based **asymmetric cryptography** with **symmetric ciphers** to provide data encryption by EC private key and decryption by the corresponding EC public key. The **ECIES** encryption scheme uses **ECC** cryptography (public key cryptosystem) + key-derivation function (**KDF**) + **symmetric encryption** algorithm + **MAC** algorithm, combined together like it is shown on the figure below:

![](https://cdn.nlark.com/yuque/0/2023/png/22382307/1693281677907-cf2ec1e3-5ced-400b-b25f-e46ff5addc94.png)

The input of the **ECIES encryption** consists of recipient's **public key** + **plain text message**. The output consists of sender's ephemeral public key (**ciphertext public key**) + **encrypted message** (ciphertext + symmetric algorithm parameters) + **authentication tag** (MAC code):

-   `ECIES-encrypt(recipientPublicKey, plaintextMessage) `➔ `{ cipherTextPublicKey, encryptedMessage, authTag }`

The **ECIES decryption** takes the output from the encryption + the **recipient's private key** and produces the original plaintext message or detects a problem (e.g. integrity / authentication error):

-   `ECIES-decrypt(cipherTextPublicKey, encryptedMessage, authTag, recipientPrivateKey, )` ➔ plaintextMessage

The ECIES encryption scheme is a **framework**, not a concrete algorithm. It can be implemented by plugging different algorithms, e.g. the **secp256k1** or **P-521** elliptic curve for the public-key calculations + **PBKDF2** or **Scrypt** for KDF function + **AES-CTR** or **AES-GCM** or **ChaCha20-Poly1305** for symmetric cipher and authentication tag + **HMAC-SHA512** for MAC algorithm (in case of unauthenticated encryption).

In the next section we shall demonstrate through a **code example** how to use ECIES in practice.

## ECIES Encryption - Example

Now, let's demonstrate how the **ECIES encryption scheme** works in practice in **Python**. We shall use a Python library [eciespy](https://kigawas.me/eciespy/):

``` bash
pip install eciespy
```

A sample Python code to generate public / private **key pair** and **encrypt** and **decrypt** a message using ECIES is:

``` python
from ecies.utils import generate_eth_key
from ecies import encrypt, decrypt
import binascii

privKey = generate_eth_key()
privKeyHex = privKey.to_hex()
pubKeyHex = privKey.public_key.to_hex()
print("Encryption public key:", pubKeyHex)
print("Decryption private key:", privKeyHex)

plaintext = b'Some plaintext for encryption'
print("Plaintext:", plaintext)

encrypted = encrypt(pubKeyHex, plaintext)
print("Encrypted:", binascii.hexlify(encrypted))

decrypted = decrypt(privKeyHex, encrypted)
print("Decrypted:", decrypted)
```

Run the above code example: <https://repl.it/@nakov/ECIES-in-Python>.

The above code is pretty simple: just generate ECC **public + private key pair** using `ecies.utils.generate_eth_key()` and call the `ecies.encrypt(pubKey, msg)` and `decrypt(privKey, encryptedMsg) `functions from the eciespy library.

The **output** form the above code looks like this:

``` bash
Encryption public key: 0x0dc8e06c055b45ecf110258ed5c0261ce2019b1bd0f8f226dcd010dade448b8f304a0915c68cdf7ddded8e4021d28fb92e27d08df695f48a0d2c41ddee750fc7
Decryption private key: 0x487fd8b53c471e3c38484a0fbe4751ace67a9ed28e60ea6b0b44c445b881f99d
Plaintext: b'Some plaintext for encryption'
Encrypted: b'045699078bbd101e270572d0d68e87a8f7b6cc377ebeeffb60d2fcac5dc7bdd86a26d7f79d13b92e923a0e2cdbe418a7856b27157ef150d5c72f4f8f312467d13221ebe7049b7ed2f0ed253bce13117129a7b01bb881b8dfbf004ff11f3ebed4c732744bc49ea03230c2d1b2ec80774e79c075431d2019464d3de97ceb96'
Decrypted: b'Some plaintext for encryption'
```

The Python `eciespy` library internally uses **ECC** cryptography over the **secp256k1** curve + **AES-256-GCM** authenticated encryption. Note that the above encrypted message holds together 4 values: `{cipherPubKey, AES-nonce, authTag, AES-ciphertext}`, packed in binary form and not directly visible from the above output.
