# 9. Cyclic Extensions（循环扩张）

We resume our investigation of special types of Galois extensions. In this section, we study Galois extensions with cyclic Galois group. Section 11 will study Galois extensions with an Abelian Galois group.

**Definition 9.1.** A Galois extension $K/F$ is called *cyclic* if $\mathrm{Gal}(K/F)$ is a cyclic group.

**Example 9.2.** Let $F$ be a field of characteristic not $2$, and let $a \in F^* - F^{*2}$. If $K = F(\sqrt{a})$, then $\mathrm{Gal}(K/F) = \{\mathrm{id}, \sigma\}$ where $\sigma(\sqrt{a}) = -\sqrt{a}$. Thus, $\mathrm{Gal}(K/F) \cong \mathbb{Z}/2\mathbb{Z}$ is cyclic. For another example, if $p$ is a prime, then the cyclotomic extension $\mathbb{Q}_p/\mathbb{Q}$ is cyclic, since $\mathrm{Gal}(\mathbb{Q}_p/\mathbb{Q}) \cong (\mathbb{Z}/p\mathbb{Z})^*$ is a cyclic group.

**Example 9.3.** Let $\omega$ be a primitive fifth root of unity in $\mathbb{C}$, let $F = \mathbb{Q}(\omega)$, and let $K = F(\sqrt[5]{2})$. Then $K$ is the splitting field of $x^5 - 2$ over $F$, so $K$ is Galois over $F$. Also, $[F : \mathbb{Q}] = 4$ and $[\mathbb{Q}(\sqrt[5]{2}) : \mathbb{Q}] = 5$. The field $K$ is the composite of these two extensions of $\mathbb{Q}$. The degree $[K : \mathbb{Q}]$ is divisible by $4$ and $5$; hence, it is divisible by $20$. Moreover, $[K : F] \le 5$, so $[K : \mathbb{Q}] \le 20$. Therefore, $[K : \mathbb{Q}] = 20$, and so $[K : F] = 5$. Let $\alpha = \sqrt[5]{2}$. The roots of $x^5 - 2$ are $\alpha, \omega\alpha, \omega^2\alpha, \omega^3\alpha, \omega^4\alpha$, so any automorphism in $\mathrm{Gal}(K/F)$ maps $\alpha$ to one of these roots, and $\mathrm{Gal}(K/F)$ is cyclic of order $5$.

**Lemma 9.4.** Let $K/F$ be a cyclic Galois extension of degree $n$, and suppose that $F$ contains a primitive $n$th root of unity $\omega$. If $\sigma$ is a generator of $\mathrm{Gal}(K/F)$, then there exists an $a \in K$ with $\sigma(a) = \omega a$.

**Proof.** Consider $\sigma$ as an $F$-linear endomorphism of the $F$-vector space $K$. Therefore, $\sigma$ satisfies the polynomial $x^n - 1$. Moreover, if there is a polynomial $g(x) \in F[x]$ of degree $m < n$ satisfied by $\sigma$, then the automorphisms $\mathrm{id}, \sigma, \dots, \sigma^{m-1}$ are linearly dependent over $F$, a contradiction to the Dedekind independence lemma. Thus, $x^n - 1$ is the minimal polynomial of $\sigma$ over $F$. However, the characteristic polynomial of $\sigma$ has degree $n = [K : F]$ and is divisible by $x^n - 1$, so $x^n - 1$ is the characteristic polynomial of $\sigma$. Since $\omega$ is a root of this polynomial, $\omega$ is an eigenvalue for $\sigma$. Thus, there is an $a \in K$ with $\sigma(a) = \omega a$. $\square$

We now give the description of cyclic extensions $K/F$ of degree $n$ when $F$ contains a primitive $n$th root of unity.

**Theorem 9.5.** Let $F$ be a field containing a primitive $n$th root of unity, and let $K/F$ be a cyclic Galois extension of degree $n$. Then there is an $a \in K$ with $K = F(a)$ and $a^n = b \in F$; that is, $K = F(\sqrt[n]{b})$.

**Proof.** By the lemma, there is an $a$ with $\sigma(a) = \omega a$. Therefore, $\sigma^i(a) = \omega^i a$, so $a$ is fixed by $\sigma^i$ only when $n$ divides $i$. Since the order of $\sigma$ is $n$, we see that $a$ is fixed only by $\mathrm{id}$, so $\mathrm{Gal}(K/F(a)) = \{\mathrm{id}\}$. Thus, $K = F(a)$ by the fundamental theorem. We see that $\sigma(a^n) = (\omega a)^n = a^n$, so $a^n$ is fixed by $\sigma$. Hence, $b = a^n \in F$, so $K = F(\sqrt[n]{b})$. $\square$

We give a converse to this theorem that describes extensions of the form $F(\sqrt[n]{b})/F$. This converse is a special case of a theorem we will see in Section 11.

**Proposition 9.6.** Let $F$ be a field containing a primitive $n$th root of unity, and let $K = F(\sqrt[n]{b})$ for some $b \in F$. Then $K/F$ is a cyclic Galois extension. Moreover, $m = [K : F]$ is equal to the order of the coset $bF^{*n}$ in the group $F^*/F^{*n}$, and $\min(F, \sqrt[n]{b}) = x^m - d$ for some $d \in F$.

**Proof.** Let $a \in K$ with $a^n = b$. Since $F$ contains a primitive $n$th root of unity $\omega$, the polynomial $x^n - b$ splits over $K$, and it is separable over $F$ by the derivative test. Thus, $K$ is a splitting field over $F$ for $x^n - b$, so $K/F$ is Galois. We will show that $K/F$ is cyclic Galois by determining a generator for $G = \mathrm{Gal}(K/F)$. The roots of $\min(F, a)$ lie in the set $\{\omega^j a : j \in \mathbb{Z}\}$ since $\min(F, a)$ divides $x^n - b$, so if $\sigma \in G$, then $\sigma(a) = \omega^i a$ for some $i$. We write $i \bmod n$ for the smallest nonnegative integer congruent to $i$ modulo $n$. Let
$$
S = \{ i \bmod n : \sigma(a)/a = \omega^i \text{ for some } \sigma \in G \}.
$$
Then $S$ is the image of the function $G \to \mathbb{Z}/n\mathbb{Z}$ given by $\sigma \mapsto i \bmod n$, where $\sigma(a)/a = \omega^i$. This map is a well-defined group homomorphism whose image is $S$, and it is injective, since if $\sigma \mapsto 0 \bmod n$, then $\sigma(a) = a$, so $\sigma = \mathrm{id}$. Therefore, $G \cong S$, a subgroup of $\mathbb{Z}/n\mathbb{Z}$; hence, $G$ is cyclic.

It remains to determine $|G|$ and $\min(F, a)$. Let $\mathrm{Gal}(K/F) = \langle \tau \rangle$, and set $\tau(a) = \omega^t a$. If $m = |G|$, then $m$ is the least positive integer such that $(\omega^t)^m = 1$. The polynomial $\prod_{i=0}^{m-1} (x - \tau^i(a))$ lies in $F[x]$, since it is fixed by $\tau$. Looking at the constant term, we see that $a^m \in F$. Therefore, $b^m = (a^m)^n \in F^{*n}$. If $m'$ is the order of $bF^{*n}$ in $F^*/F^{*n}$, then $m'$ divides $m$. For the reverse divisibility, we know that $b^{m'} \in F^{*n}$, so $b^{m'} = c^n$ for some $c \in F$. Then $a^{m'n} = c^n$, so $a^{m'} = c\omega^i$ for some $i$, which means $a^{m'} \in F$. Therefore, $\tau^{m'}(a) = \omega^{tm'} a = a$, so $m$ divides $m'$, since $m$ is the order of $\omega^t$ in $F^*$. Both divisibilities together yield $m = m'$. Moreover, since $m = [K : F] = \deg(\min(F, a))$ and $x^m - a^m \in F[x]$ has $a$ as a root, we see that $\min(F, a) = x^m - a^m$. This finishes the proof. $\square$

The simple structure of a cyclic group allows us to give a nice description of the intermediate fields of a cyclic extension. This description was hinted at in Example 5.4.

**Corollary 9.7.** Let $K/F$ be a cyclic extension of degree $n$, and suppose that $F$ contains a primitive $n$th root of unity. If $K = F(\sqrt[n]{a})$ with $a \in F$, then any intermediate field of $K/F$ is of the form $F(\sqrt[m]{a})$ for some divisor $m$ of $n$.

**Proof.** Let $\sigma$ be a generator for $\mathrm{Gal}(K/F)$. Then any subgroup of $\mathrm{Gal}(K/F)$ is of the form $\langle \sigma^t \rangle$ for some divisor $t$ of $n$. By the fundamental theorem, the intermediate fields are the fixed fields of the $\sigma^t$. If $t$ is a divisor of $n$, write $n = tm$, and let $\alpha = \sqrt[n]{a}$. Then $\sigma^t(\alpha^m) = (\omega^t \alpha)^m = \alpha^m$, so $\alpha^m$ is fixed by $\sigma^t$. However, the order of $a^t F^{*n}$ in $F^*/F^{*n}$ is $m$, so $F(\sqrt[m]{a})$ has degree $m$ over $F$ by Proposition 9.6. By the fundamental theorem, the fixed field of $\sigma^t$ has degree $m$ over $F$, which forces $F(\sqrt[m]{a})$ to be the fixed field of $\sigma^t$. This shows that any intermediate field of $K/F$ is of the form $F(\sqrt[m]{a})$ for some divisor $m$ of $n$. $\square$

We now describe cyclic extensions of degree $p$ in characteristic $p$. Let $F$ be a field of characteristic $p > 0$. Define $\wp : F \to F$ by $\wp(a) = a^p - a$. Then $\wp$ is an additive group homomorphism with kernel $\mathbb{F}_p$. To see this, if $a, b \in F$, then
$$
\begin{aligned}
\wp(a + b) &= (a + b)^p - (a + b) \\
&= a^p - a + b^p - b \\
&= \wp(a) + \wp(b),
\end{aligned}
$$
and $\wp(a) = 0$ if and only if $a^p = a$, if and only if $a \in \mathbb{F}_p$. Note that if $\wp(a) = b$, then $\wp(a + i) = b$ for all $i \in \mathbb{F}_p$, and in fact $\wp^{-1}(b) = \{ a + i : i \in \mathbb{F}_p \}$. Therefore, if $K$ is an extension of $F$ such that there is an $\alpha \in K$ with $\wp(\alpha) = a \in F$, then $F(\alpha) = F(\wp^{-1}(a))$. The usual proof of the following theorem uses the additive version of Hilbert theorem 90, but, as with Lemma 9.4, we give a linear algebraic proof.

**Theorem 9.8.** Let $\operatorname{char}(F) = p$, and let $K/F$ be a cyclic Galois extension of degree $p$. Then $K = F(\alpha)$ with $\alpha^p - \alpha - a = 0$ for some $a \in F$; that is, $K = F(\wp^{-1}(a))$.

**Proof.** Let $\sigma$ be a generator of $\mathrm{Gal}(K/F)$, and let $T$ be the linear transformation $T = \sigma - \mathrm{id}$. The kernel of $T$ is
$$
\begin{aligned}
\ker(T) &= \{ b \in K : \sigma(b) = b \} \\
&= F.
\end{aligned}
$$
Also, $T^p = (\sigma - \mathrm{id})^p = \sigma^p - \mathrm{id} = 0$, since the order of $\sigma$ is $p$ and $\operatorname{char}(F) = p$. Thus, $\operatorname{im}(T^{p-1}) \subseteq \ker(T)$. Because $\ker(T) = F$ and $\operatorname{im}(T^{p-1})$ is an $F$-subspace of $K$, we get $\operatorname{im}(T^{p-1}) = \ker(T)$. Therefore, $1 = T^{p-1}(c)$ for some $c \in K$. Let $\alpha = T^{p-2}(c)$. Then $T(\alpha) = 1$, so $\sigma(\alpha) - \alpha = 1$ or $\sigma(\alpha) = \alpha + 1$. Since $\alpha$ is not fixed by $\sigma$, we see that $\alpha \notin F$, so $F(\alpha) = K$ because $[K : F] = p$ is prime. Now,
$$
\begin{aligned}
\sigma(\alpha^p - \alpha) &= \sigma(\alpha)^p - \sigma(\alpha) = (\alpha + 1)^p - (\alpha + 1) \\
&= \alpha^p + 1 - \alpha - 1 = \alpha^p - \alpha.
\end{aligned}
$$
If $a = \alpha^p - \alpha$, then $\wp(\alpha) = a \in F$, so $\alpha^p - \alpha - a = 0$. $\square$

The converse of this theorem is also true.

**Theorem 9.9.** Let $F$ be a field of characteristic $p$, and let $a \in F - \wp(F)$. Then $f(x) = x^p - x - a$ is irreducible over $F$, and the splitting field of $f$ over $F$ is a cyclic Galois extension of $F$ of degree $p$.

**Proof.** Let $K$ be the splitting field of $f$ over $F$. If $\alpha$ is a root of $f$, it is easy to check that $\alpha + 1$ is also a root of $f$. Hence, the $p$ roots of $f$ are $\alpha, \alpha + 1, \dots, \alpha + p - 1$. Therefore, $K = F(\alpha)$. The assumption on $a$ assures us that $\alpha \notin F$. Assume for now that $f$ is irreducible over $F$. Then $[K : F] = \deg(f) = p$. By the isomorphism extension theorem, there is a $\sigma \in \mathrm{Gal}(K/F)$ with $\sigma(\alpha) = \alpha + 1$. From this, it follows that the order of $\sigma$ is $p$, so $\mathrm{Gal}(K/F) = \langle \sigma \rangle$. This proves that $K/F$ is a cyclic Galois extension.

It remains for us to prove that $f(x)$ is irreducible over $F$. If not, then $f$ factors over $F$ as $f(x) = g_1(x) \cdots g_r(x)$, with each $g_i$ irreducible over $F$. If $\beta$ is a root of $g_i$ for some $i$, then the paragraph above shows that $K = F(\beta)$, so $[K : F] = \deg(g_i)$. This forces all degrees of the $g_i$ to be the same, so $\deg(f) = r \deg(g_1)$. Since $\deg(f)$ is prime and $f$ does not split over $F$, we see that $r = 1$; hence, $f$ is irreducible over $F$. $\square$

**Example 9.10.** Let $F = \mathbb{F}_p(x)$ be the rational function field in one variable over $\mathbb{F}_p$. We claim that $x \notin \wp(F)$, so the extension $F(\wp^{-1}(x))$ is a cyclic extension of $F$ of degree $p$. To prove this, suppose instead that $x \in \wp(F)$, so $x = a^p - a$ for some $a \in F$. We can write $a = f/g$ with $f, g \in \mathbb{F}_p[x]$ relatively prime. Then $x = f^p/g^p - f/g$, or $g^p x = f^p - f g^{p-1}$. Solving for $f^p$ gives $f^p = g^{p-1}(g x - f)$, so $g$ divides $f^p$. This is impossible; thus, $x \notin \wp(F)$, and then $F(\wp^{-1}(x))$ is a cyclic extension of $F$ of degree $p$ as we claimed.
