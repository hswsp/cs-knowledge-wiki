# 5. The Fundamental Theorem of Galois Theory（Galois 理论基本定理）

We are now in the position to prove the fundamental theorem of Galois theory, which describes the intermediate fields of a Galois extension $K/F$ in terms of the subgroups of the Galois group $\mathrm{Gal}(K/F)$. This theorem allows us to translate many questions about fields into questions about finite groups. As an application of this theorem, we give a mostly algebraic proof of the fundamental theorem of algebra, which says that the complex field $\mathbb{C}$ is algebraically closed.

**Theorem 5.1 (Fundamental Theorem of Galois Theory)** Let $K$ be a finite Galois extension of $F$, and let $G = \mathrm{Gal}(K/F)$. Then there is a 1–1 inclusion reversing correspondence between intermediate fields of $K/F$ and subgroups of $G$, given by $L \mapsto \mathrm{Gal}(K/L)$ and $H \mapsto \mathcal{F}(H)$. Furthermore, if $L \leftrightarrow H$, then $[K : L] = |H|$ and $[L : F] = [G : H]$. Moreover, $H$ is normal in $G$ if and only if $L$ is Galois over $F$. When this occurs, $\mathrm{Gal}(L/F) \cong G/H$.

**Proof.** We have seen in Lemma 2.9 that the maps $L \mapsto \mathrm{Gal}(K/L)$ and $H \mapsto \mathcal{F}(H)$ give injective inclusion reversing correspondences between the set of fixed fields $L$ with $F \subseteq L \subseteq K$ and the set of subgroups of $G$ of the form $\mathrm{Gal}(K/L)$ for some $L$ with $F \subseteq L \subseteq K$. Let $L$ be a subfield of $K$ containing $F$. Since $K$ is Galois over $F$, the extension $K$ is normal and separable over $F$. Thus, $K$ is also normal and separable over $L$, so $K$ is Galois over $L$. Hence, $L = \mathcal{F}(\mathrm{Gal}(K/L))$, so any intermediate field is a fixed field. Also, if $H$ is a subgroup of $G$, then $H$ is a finite group, so $H = \mathrm{Gal}(K/\mathcal{F}(H))$ by Proposition 2.14. Every subgroup of $G$ is therefore such a Galois group. The maps above then yield the desired correspondences. Recall that $|\mathrm{Gal}(K/F)| = [K : F]$ if $K$ is Galois over $F$ by Proposition 2.14. Thus, if $L \leftrightarrow H$, we have $|H| = [K : L]$, since $K$ is Galois over $L$ and $H = \mathrm{Gal}(K/L)$. Therefore,

$$
[G : H] = |G|/|H| = [K : F]/[K : L] = [L : F].
$$

Suppose that $H$ is normal in $G$, and let $L = \mathcal{F}(H)$. Take $\alpha \in L$, and let $b$ be any root of $\min(F,\alpha)$ in $K$. By the isomorphism extension theorem, there is a $\sigma \in G$ with $\sigma(a) = b$. If $\tau \in H$, then $\tau(b) = \sigma(\sigma^{-1} \tau \sigma(a))$. However, since $H$ is normal in $G$, the element $\sigma^{-1} \tau \sigma \in H$, so $\sigma^{-1} \tau \sigma(a) = a$. Thus, $\tau(b) = \sigma(a) = b$, so $b \in \mathcal{F}(H) = L$. Since $\min(F,a)$ splits over $K$, this shows that $\min(F,a)$ actually splits over $L$. Therefore, $L$ is normal over $F$ by Proposition 3.28. Since $K/F$ is separable and $L \subseteq K$, the extension $L/F$ is also separable, and so $L$ is Galois over $F$. Conversely, suppose that $L$ is Galois over $F$. Let $\theta : G \to \mathrm{Gal}(L/F)$ be given by $\theta(\sigma) = \sigma|_L$. Normality of $L/F$ shows that $\sigma|_L \in \mathrm{Gal}(L/F)$ by Proposition 3.28, so $\theta$ is a well-defined group homomorphism. The kernel of $\theta$ is

$$
\ker(\theta) = \{ \sigma \in K : \sigma|_L = \mathrm{id} \} = \mathrm{Gal}(K/L) = H.
$$

Therefore, $H$ is normal in $G$. The map $\theta$ is surjective since, if $\tau \in \mathrm{Gal}(L/F)$, then there is a $\sigma \in G$ with $\sigma|_L = \tau$ by the isomorphism extension theorem. Thus, $\mathrm{Gal}(L/F) \cong G/H$.
□

Given a Galois extension $K/F$, on the surface it would seem to be intractable to determine all intermediate fields; the main problem is knowing whether we have found all of them. However, the Galois group $G = \mathrm{Gal}(K/F)$ is a finite group, which means that there is a systematic way of finding all subgroups of $G$. By finding all subgroups, we can then determine the fixed fields of each, thereby having all intermediate fields by the fundamental theorem. The next two examples illustrate this procedure. Of course, if $G$ is large, it may be too complicated to find all subgroups of $G$.

**Example 5.2** The field $\mathbb{Q}(\sqrt[3]{2}, \omega)$ is Galois over $\mathbb{Q}$, as we have seen previously. The Galois group is a group of order 6. From group theory, there are two nonisomorphic groups of order 6: the cyclic group $\mathbb{Z}/6\mathbb{Z}$ and the symmetric group $S_3$. Which is the Galois group? The subfield $\mathbb{Q}(\sqrt[3]{2})$ is not Galois over $\mathbb{Q}$, since the minimal polynomial of $\sqrt[3]{2}$ does not split over $\mathbb{Q}(\sqrt[3]{2})$. Therefore, the corresponding subgroup is not normal in $G$. However, every subgroup of an Abelian group is normal, so our Galois group is non-Abelian. Thus, $G = \mathrm{Gal}(\mathbb{Q}(\sqrt[3]{2}, \omega)/\mathbb{Q}) \cong S_3$. We can also explicitly demonstrate this isomorphism. By the isomorphism extension theorem, there are $\mathbb{Q}$-automorphisms $\sigma, \tau$ of $\mathbb{Q}(\sqrt[3]{2}, \omega)$ with

$$
\begin{aligned}
\sigma : \sqrt[3]{2} &\to \omega \sqrt[3]{2}, \quad \omega \to \omega, \\
\tau : \sqrt[3]{2} &\to \sqrt[3]{2}, \quad \omega \to \omega^2.
\end{aligned}
$$

It is easy to check that $\sigma$ has order 3, $\tau$ has order 2, and $\sigma \tau \neq \tau \sigma$. The subgroups of the Galois group are then

$$
\langle \mathrm{id} \rangle, \langle \sigma \rangle, \langle \tau \rangle, \langle \sigma \tau \rangle, \langle \sigma^2 \tau \rangle, G.
$$

The corresponding fixed fields are

$$
\mathbb{Q}(\sqrt[3]{2}, \omega), \mathbb{Q}(\omega), \mathbb{Q}(\sqrt[3]{2}), \mathbb{Q}(\omega^2 \sqrt[3]{2}), \mathbb{Q}(\omega \sqrt[3]{2}), \mathbb{Q}.
$$

One way to verify that these fields are in fact the correct ones is to show that, for any of these fields, the field is indeed fixed by the appropriate subgroup and its dimension over $\mathbb{Q}$ is correct. For instance, $\sqrt[3]{2}$ is fixed by $\tau$; hence, $\mathbb{Q}(\sqrt[3]{2}) \subseteq \mathcal{F}(\tau)$. Since the index $[G : \langle \tau \rangle] = 3$, we must have $[\mathcal{F}(\tau) : F] = 3$. But $[\mathbb{Q}(\sqrt[3]{2}) : \mathbb{Q}] = 3$, so $\mathbb{Q}(\sqrt[3]{2}) = \mathcal{F}(\tau)$. This use of dimension is extremely useful in determining the fixed field of a subgroup.

**Example 5.3** Let $K = \mathbb{Q}(\sqrt{2}, \sqrt{3})$. Then $K$ is the splitting field of $\{x^2 - 2, x^2 - 3\}$ over $\mathbb{Q}$ or, alternatively, the splitting field of $(x^2 - 2)(x^2 - 3)$ over $\mathbb{Q}$. The dimension of $K/\mathbb{Q}$ is 4. The four automorphisms of $K/\mathbb{Q}$ are given by

$$
\begin{aligned}
\mathrm{id} : \sqrt{2} &\to \sqrt{2}, \quad \sqrt{3} \to \sqrt{3}, \\
\sigma : \sqrt{2} &\to -\sqrt{2}, \quad \sqrt{3} \to \sqrt{3}, \\
\tau : \sqrt{2} &\to \sqrt{2}, \quad \sqrt{3} \to -\sqrt{3}, \\
\sigma \tau : \sqrt{2} &\to -\sqrt{2}, \quad \sqrt{3} \to -\sqrt{3}.
\end{aligned}
$$

This Galois group is Abelian and is isomorphic to $\mathbb{Z}/2\mathbb{Z} \times \mathbb{Z}/2\mathbb{Z}$. The subgroups of $G = \mathrm{Gal}(K/\mathbb{Q})$ are

$$
\langle \mathrm{id} \rangle, \langle \sigma \rangle, \langle \tau \rangle, \langle \sigma \tau \rangle, G.
$$

The corresponding intermediate fields are

$$
K, \mathbb{Q}(\sqrt{3}), \mathbb{Q}(\sqrt{2}), \mathbb{Q}(\sqrt{6}), \mathbb{Q}.
$$

**Example 5.4** Let $F = \mathbb{C}(t)$ be the rational function field in one variable over $\mathbb{C}$, and let $f(x) = x^n - t \in F[x]$. The polynomial $f$ is irreducible over $F$ by the Eisenstein criterion, since $F$ is the quotient field of the unique factorization domain $\mathbb{C}[t]$ and $t$ is an irreducible element of $\mathbb{C}[t]$. Let $K$ be the splitting field of $f$ over $F$. Then $K = F(\alpha)$, where $\alpha$ is any root of $f(x)$. To see this, if $\omega = \exp(2\pi i /n)$, then $\omega^n = 1$, so $\omega^i \alpha$ is a root of $f(x)$ for each $i$. There are exactly $n$ distinct powers of $\omega$, so the $n$ distinct elements $\alpha, \omega \alpha, \ldots, \omega^{n-1} \alpha$ are precisely the roots of $f$. All of these lie in $F(\alpha)$ and generate $F(\alpha)$, so $K = F(\alpha)$. The extension $K/F$ is then Galois since $f$ has no repeated roots. We see that $[K : F] = \deg(f) = n$.

The isomorphism extension theorem tells us that there is an automorphism $\sigma$ of $K$ defined by $\sigma(\alpha) = \omega \alpha$. This formula yields that $\sigma^i(\alpha) = \omega^i \alpha$ for each $i$, so $\sigma^i(\alpha) = \alpha$ if and only if $n$ divides $i$. Thus, $\sigma$ has order $n$ in $\mathrm{Gal}(K/F)$. This forces $\mathrm{Gal}(K/F)$ to be the cyclic group generated by $\sigma$. Each subgroup of $\langle \sigma \rangle$ is cyclic and can be generated by an element $\sigma^m$ with $m$ a divisor of $n$. Given a divisor $m$ of $n$, if $n = mk$, then the element $\alpha^k$ is fixed by $\sigma^m$, since

$$
\begin{aligned}
\sigma^m(\alpha^k) &= (\omega^m \alpha)^k \\
&= \omega^n \alpha^k = \alpha^k.
\end{aligned}
$$

Moreover, $F(\alpha^k)$ is the fixed field of $\langle \sigma^m \rangle$ for, if $m'$ is a divisor of $n$ and $\sigma^{m'}(\alpha^k) = \alpha^k$, then $\omega^{m'k} \alpha^k = \alpha^k$, which forces $n$ to divide $m'k$. But, $n = mk$, so $m$ divides $m'$, and thus $\sigma^{m'} \in \langle \sigma^m \rangle$. This proves that $\mathrm{Gal}(K/F(\alpha^k)) = \langle \sigma^m \rangle$, so the fundamental theorem tells us that $F(\alpha^k)$ is the fixed field of $\langle \sigma^m \rangle$. We have thus determined the subgroups of $\mathrm{Gal}(K/F)$ and the intermediate fields of $K/F$ to be

$$
\begin{aligned}
&\{ \langle \sigma^m \rangle : m \text{ divides } n \}, \\
&\{ F(\alpha^k) : k \text{ divides } n \},
\end{aligned}
$$

with the correspondence $F(\alpha^k) \leftrightarrow \langle \sigma^m \rangle$ if $km = n$.

Let $K/F$ be Galois, and let $L$ be any extension field of $F$ with $K$ and $L$ inside some common field. Then $KL/L$ is Galois, since if $K$ is the splitting field of a set of separable polynomials over $F$, then $KL$ is the splitting field of the same set of polynomials over $L$, and if $f(x) \in F[x]$ is separable over $F$, then $f(x)$ is separable over $L$. The following theorem determines the Galois group of $KL/L$ and the degree of this extension.

**Theorem 5.5 (Natural Irrationalities)** Let $K$ be a finite Galois extension of $F$, and let $L$ be an arbitrary extension of $F$. Then $KL/L$ is Galois and $\mathrm{Gal}(KL/L) \cong \mathrm{Gal}(K/K \cap L)$. Moreover, $[KL : L] = [K : K \cap L]$.

**Proof.** Define $\theta : \mathrm{Gal}(KL/L) \to \mathrm{Gal}(K/F)$ by $\theta(\sigma) = \sigma|_K$. This map is well defined since $K$ is normal over $F$, and $\theta$ is a group homomorphism. The kernel of $\theta$ is $\{ \sigma \in \mathrm{Gal}(KL/L) : \sigma|_K = \mathrm{id} \}$. However, if $\sigma \in \ker(\theta)$, then $\sigma|_L = \mathrm{id}$ and $\sigma|_K = \mathrm{id}$. Thus, the fixed field of $\sigma$ contains both $K$ and $L$, so it contains $KL$. That means $\sigma = \mathrm{id}$, so $\theta$ is injective. Since the image of $\theta$ is a subgroup of $\mathrm{Gal}(K/F)$, this image is equal to $\mathrm{Gal}(K/E)$, where $E$ is the fixed field of this image. We show that $E = K \cap L$. If $a \in K \cap L$, then $a$ is fixed by $\sigma|_K$ for each $\sigma \in \mathrm{Gal}(KL/L)$. Therefore, $a \in E$, so $K \cap L \subseteq E$. For the reverse inclusion, let $a \in E$. Then $a \in K$ and $\sigma|_K(a) = a$ for all $\sigma \in \mathrm{Gal}(KL/L)$. Thus, $\sigma(a) = a$ for all such $\sigma$, so $a \in L$. This shows $E \subseteq K \cap L$, and so $E = K \cap L$. We have thus proved that

$$
\mathrm{Gal}(KL/L) \cong \mathrm{im}(\theta) = \mathrm{Gal}(K/K \cap L).
$$

The degree formula follows immediately from this isomorphism.
□

A field extension $K/F$ is called simple if $K = F(\alpha)$ for some $\alpha \in K$. The next theorem and its corollaries give some conditions for when an extension is simple.

**Theorem 5.6 (Primitive Element Theorem)** A finite extension $K/F$ is simple if and only if there are only finitely many fields $L$ with $F \subseteq L \subseteq K$.

**Proof.** We prove this with the assumption that $|F| = \infty$. The case for finite fields requires a different proof, which we will handle in Section 6. Suppose that there are only finitely many intermediate fields of $K/F$. Since $[K : F] < \infty$, we can write $K = F(\alpha_1, \ldots, \alpha_n)$ for some $\alpha_i \in K$. We use induction on $n$; the case $n = 1$ is trivial. If $L = F(\alpha_1, \ldots, \alpha_{n-1})$, then since any field between $F$ and $L$ is an intermediate field of $K/F$, by induction $L = F(\beta)$ for some $\beta$. Then $K = F(\alpha_n, \beta)$. For $a \in F$, set $M_a = F(\alpha_n + a\beta)$, an intermediate field of $K/F$. Since there are only finitely many intermediate fields of $K/F$ but infinitely many elements of $F$, there are $a, b \in F$ with $a \neq b$ and $M_a = M_b$. Therefore,

$$
\beta = \frac{(\alpha_n + b\beta) - (\alpha_n + a\beta)}{b - a} \in M_b.
$$

Hence, $\alpha_n = (\alpha_n + b\beta) - b\beta \in M_b$, so $K = F(\alpha_n, \beta) = M_b$. Thus, $K$ is a simple extension of $F$.

Conversely, suppose that $K = F(\alpha)$ for some $\alpha \in F$. Let $M$ be a field with $F \subseteq M \subseteq K$. Then $K = M(\alpha)$. Let $p(x) = \min(F,\alpha)$ and $q(x) = \min(M,\alpha) \in M[x]$. Then $q$ divides $p$ in $M[x]$. Suppose that $q(x) = a_0 + a_1 x + \cdots + x^r$, and set $M_0 = F(a_0, \ldots, a_{r-1}) \subseteq M$. Then $q \in M_0[x]$, so $\min(M_0, \alpha)$ divides $q$. Thus,

$$
\begin{aligned}
{}[K : M] &= \deg(q) \geq \deg(\min(M_0, \alpha)) = [K : M_0] \\
&= [K : M] \cdot [M : M_0].
\end{aligned}
$$

This implies that $[M : M_0] = 1$, so $M = M_0$. Therefore, $M$ is determined by $q$. However, there are only finitely many monic divisors of $p$ in $K[x]$, so there are only finitely many such $M$.
□

**Corollary 5.7** If $K/F$ is finite and separable, then $K = F(\alpha)$ for some $\alpha \in K$.

**Proof.** If $K$ is finite and separable over $F$, then $K = F(\alpha_1, \ldots, \alpha_n)$ for some $\alpha_i$. Let $N$ be the splitting field over $F$ of $\{\min(F,\alpha_i) : 1 \leq i \leq n\}$. Then $N/F$ is Galois by Theorem 4.9 since each $\min(F,\alpha_i)$ is separable over $F$. Moreover, $K \subseteq N$. By the fundamental theorem, the intermediate fields of $N/F$ are in 1–1 correspondence with the subgroups of the finite group $\mathrm{Gal}(N/F)$. Any finite group has only finitely many subgroups, so $N/F$ has only finitely many intermediate fields. In particular, $K/F$ has only finitely many intermediate fields. Therefore, $K = F(\alpha)$ for some $\alpha$ by the primitive element theorem.
□

**Corollary 5.8** If $K/F$ is finite and $F$ has characteristic 0, then $K = F(\alpha)$ for some $\alpha$.

**Proof.** This corollary follows immediately from the preceding corollary since any finite extension of a field of characteristic 0 is separable.
□

### The normal closure of a field extension

Let $K$ be an algebraic extension of $F$. The normal closure of $K/F$ is the splitting field over $F$ of the set $\{\min(F,a) : a \in K\}$ of minimal polynomials of elements of $K$. As we will show below, the normal closure $N$ of the extension $K/F$ is a minimal normal extension of $F$ which contains $K$. This is reasonable since, for each $a \in K$, the polynomial $\min(F,a)$ splits over any normal extension of $F$ containing $K$. Therefore, the set $\{\min(F,a) : a \in K\}$ is a minimal set of polynomials which must split in any extension of $K$ that is normal over $F$. We formalize this in the next result, which gives the basic properties of normal closure.

**Proposition 5.9** Let $K$ be an algebraic extension of $F$, and let $N$ be the normal closure of $K/F$.

1. The field $N$ is a normal extension of $F$ containing $K$. Moreover, if $M$ is a normal extension of $F$ with $K \subseteq M \subseteq N$, then $M = N$.
2. If $K = F(a_1, \ldots, a_n)$, then $N$ is the splitting field of the polynomials $\min(F,a_1), \ldots, \min(F,a_n)$ over $F$.
3. If $K/F$ is a finite extension, then so is $N/F$.
4. If $K/F$ is separable, then $N/F$ is Galois.

**Proof.** Since $N$ is a splitting field over $F$ of a set of polynomials, $N$ is normal over $F$. It is clear that $N$ contains $K$. Suppose that $M$ is a normal extension of $F$ with $K \subseteq M \subseteq N$. If $a \in K$, then $a \in M$, so by normality $\min(F,a)$ splits over $M$. However, if $X$ is the set of roots of the polynomials $\{\min(F,a) : a \in K\}$, we have $N = F(X)$. But since these polynomials split over $M$, all of the roots of these polynomials lie in $M$. Thus, $X \subseteq M$, and so $N = F(X) \subseteq M$. Therefore, $M = N$.

For part 2, let $L = F(X)$, where $X \subseteq N$ is the set of roots of the polynomials $\{\min(F,a_i) : 1 \leq i \leq n\}$. Then $L$ is a splitting field over $F$ of this set; hence, $K \subseteq L$ and $L/F$ is normal. By part 1, $L = N$.

For the third part, suppose that $[K : F] < \infty$. Then $K$ is a finitely generated extension of $F$; say that $K = F(a_1, \ldots, a_n)$. Let $p_i(x) = \min(F, a_i)$. By part 2, $N$ is a splitting field of $\{\min(F,a_i) : 1 \leq i \leq n\}$, a finite set of polynomials. Therefore, $[N : F] < \infty$.

Finally, if $K/F$ is separable, then each polynomial $\min(F,a)$ is separable over $F$. Therefore, $N$ is the splitting field of the set $\{\min(F,a) : a \in K\}$ of separable polynomials over $F$, so $N$ is Galois over $F$.
□

The normal closure of an algebraic extension $K/F$ is uniquely determined by the conditions in the first part of the previous proposition, as we now show.

**Corollary 5.10** Let $K$ be an algebraic extension of $F$, and let $N$ be the normal closure of $K/F$. If $N'$ is any normal extension of $F$ containing $K$, then there is an $F$-homomorphism from $N$ to $N'$. Consequently, if $N'$ does not contain any proper subfield normal over $F$ that contains $K$, then $N$ and $N'$ are $F$-isomorphic.

**Proof.** Suppose that $N'$ is normal over $F$ and contains $K$. Then $\min(F,a)$ splits over $N'$ for each $a \in K$. By the isomorphism extension theorem, the identity map on $F$ extends to a homomorphism $\sigma : N \to N'$. Then $\sigma(N)$ is a splitting field of $\{\min(F,a) : a \in K\}$ in $N'$, so $\sigma(N)$ is normal over $F$ and contains $K$. Therefore, if $N'$ does not contain any proper subfield normal over $F$ that contains $K$, then $\sigma(N) = N'$, so $N$ and $N'$ are $F$-isomorphic.
□

**Example 5.11** Let $F = \mathbb{Q}$ and $K = \mathbb{Q}(\sqrt[3]{2})$. If $\omega^3 = 1$ and $\omega \neq 1$, then $\mathbb{Q}(\sqrt[3]{2}, \omega)$ is the splitting field of $x^3 - 2$ over $\mathbb{Q}$, so it is normal over $\mathbb{Q}$. This field is clearly the smallest extension of $K$ that is normal over $\mathbb{Q}$, so $\mathbb{Q}(\sqrt[3]{2}, \omega)$ is the normal closure of $\mathbb{Q}(\omega)/\mathbb{Q}$.

**Example 5.12** If $K$ is an extension of $F$, and if $a \in K$ has minimal polynomial $p(x)$ over $F$, then the normal closure of $F(a)/F$ is the field $F(a_1, a_2, \ldots, a_n)$, where the $a_i$ are the roots of $p(x)$.

Suppose that $K/F$ is a finite separable extension with normal closure $N$. Let $G = \mathrm{Gal}(N/F)$ and $H = \mathrm{Gal}(N/K)$. So $K = \mathcal{F}(H)$. Suppose that $K$ is not Galois over $F$. Then $H$ is not normal in $G$. The minimality of $N$ as a normal extension of $F$ containing $K$ translates via the fundamental theorem into the following group theoretic relation between $G$ and $H$: The largest normal subgroup of $G$ contained in $H$ is $\langle \mathrm{id} \rangle$ for, if $H' \subseteq H$ is a normal subgroup of $G$, then $L = \mathcal{F}(H')$ is an extension of $K$ that is normal over $F$. But, as $L \subseteq N$, minimality of $N$ implies that $L = N$, so $H' = \langle \mathrm{id} \rangle$. Recall from group theory that if $H$ is a subgroup of a group $G$, then $\bigcap_{g \in G} g H g^{-1}$ is the largest normal subgroup of a group $G$ contained in a subgroup $H$. Therefore, in the context above, $\bigcap_{g \in G} g H g^{-1} = \langle \mathrm{id} \rangle$.

### The fundamental theorem of algebra

The fundamental theorem of algebra states that every polynomial in $\mathbb{C}[x]$ has a root in $\mathbb{C}$. This was first proved by Gauss and is commonly proved using the theory of analytic functions in a course in complex analysis. We give here a proof using Galois theory, which combines the fundamental theorem and the Sylow theorems of group theory. It is a nice application of the interaction of group and field theory.

To prove the fundamental theorem of algebra, we do need to know one result from analysis, namely the intermediate value theorem. Beyond this, we can give a proof using group theory and Galois theory. We point out the group theoretic fact we need: If $G$ is a finite group whose order is a power of a prime $p$, then any maximal subgroup of $G$ has index $p$ in $G$. This fact can be found in Proposition 2.4 of Appendix C.

**Lemma 5.13** Let $f(x) \in \mathbb{R}[x]$.

1. If $f(x) = x^2 - a$ for some $a > 0$, then $f$ has a root in $\mathbb{R}$. Therefore, every nonnegative real number has a real square root.
2. If $\deg(f)$ is odd, then $f$ has a root in $\mathbb{R}$. Consequently, the only odd degree extension of $\mathbb{R}$ is $\mathbb{R}$ itself.

**Proof.** Suppose that $f(x) = x^2 - a$ with $a > 0$. Then $f(0) < 0$ and $f(u) > 0$ for $u$ sufficiently large. Therefore, there is a $c \in [0, u]$ with $f(c) = 0$ by the intermediate value theorem. In other words, $\sqrt{a} = c \in \mathbb{R}$.

For part 2, suppose that the leading coefficient of $f$ is positive. Then

$$
\lim_{x \to \infty} f(x) = \infty \quad \text{and} \quad \lim_{x \to -\infty} f(x) = -\infty.
$$

By another use of the intermediate value theorem, there is a $c \in \mathbb{R}$ with $f(c) = 0$. If $L/\mathbb{R}$ is an odd degree extension, take $\alpha \in L - \mathbb{R}$. Then $\mathbb{R}(\alpha)/\mathbb{R}$ is also of odd degree, so $\deg(\min(\mathbb{R},\alpha))$ is odd. However, this polynomial has a root in $\mathbb{R}$ by what we have just shown. Since this polynomial is irreducible, this forces $\min(\mathbb{R},\alpha)$ to be linear, so $\alpha \in \mathbb{R}$. Therefore, $L = \mathbb{R}$.

**Lemma 5.14** Every complex number has a complex square root. Therefore, there is no field extension $N$ of $\mathbb{C}$ with $[N : \mathbb{C}] = 2$.

**Proof.** To prove this, we use the polar coordinate representation of complex numbers. Let $a \in \mathbb{C}$, and set $a = r e^{i\theta}$ with $r \geq 0$. Then $\sqrt{r} \in \mathbb{R}$ by Lemma 5.13, so $b = \sqrt{r} e^{i\theta/2} \in \mathbb{C}$. We have $b^2 = r(e^{i\theta/2})^2 = r e^{i\theta} = a$. If $N$ is an extension of $\mathbb{C}$ with $[N : \mathbb{C}] = 2$, then there is an $a \in \mathbb{C}$ with $N = \mathbb{C}(\sqrt{a})$. But, the first part of the lemma shows that $\mathbb{C}(\sqrt{a}) = \mathbb{C}$, so there are no quadratic extensions of $\mathbb{C}$.
□

**Theorem 5.15 (Fundamental Theorem of Algebra)** The field $\mathbb{C}$ is algebraically closed.

**Proof.** Let $L$ be a finite extension of $\mathbb{C}$. Since $\mathrm{char}(\mathbb{R}) = 0$, the field $L$ is separable over $\mathbb{R}$, and $L$ is also a finite extension of $\mathbb{R}$. Let $N$ be the normal closure of $L/\mathbb{R}$. We will show that $N = \mathbb{C}$, which will prove the theorem. Let $G = \mathrm{Gal}(N/\mathbb{R})$. Then

$$
\begin{aligned}
|G| &= [N : \mathbb{R}] = [N : \mathbb{C}] \cdot [\mathbb{C} : \mathbb{R}] \\
&= 2[N : \mathbb{C}]
\end{aligned}
$$

is even. Let $H$ be a 2-Sylow subgroup of $G$, and let $E$ be the fixed field of $H$. Then $|G : H| = [E : \mathbb{R}]$ is odd. Thus, by Lemma 5.13, we see that $E = \mathbb{R}$, so $G = H$ is a 2-group. Therefore, $\mathrm{Gal}(N/\mathbb{C})$ is also a 2-group. Let $P$ be a maximal subgroup of $\mathrm{Gal}(N/\mathbb{C})$. By the theory of $p$-groups, $[\mathrm{Gal}(N/\mathbb{C}) : P] = 2$. If $T$ is the fixed field of $P$, then $[T : \mathbb{C}] = 2$. This is impossible by Lemma 5.14. This contradiction shows that $|G| = 1$, so $N = \mathbb{C}$.
□
