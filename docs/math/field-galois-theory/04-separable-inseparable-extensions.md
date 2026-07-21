# 4. Separable and Inseparable Extensions（可分与不可分扩张）

Recall from Corollary 2.17 that an algebraic extension $F(a)/F$ fails to be Galois if either $\min(F,a)$ does not split over $F(a)$ or if $\min(F,a)$ has repeated roots. In the previous section, we investigated field extensions $K/F$ for which $\min(F,a)$ splits over $K$ for each $a \in K$. In this section, we investigate when a minimal polynomial has repeated roots. We point out that in the case of fields of characteristic 0, there is no problem of repeated roots, as we show below.

Let $f(x) \in F[x]$. A root $\alpha$ of $f$ has multiplicity $m$ if $(x - \alpha)^m$ divides $f(x)$ but $(x - \alpha)^{m+1}$ does not divide $f$. If $m > 1$, then $\alpha$ is called a repeated root of $f$.

**Definition 4.1** Let $F$ be a field. An irreducible polynomial $f(x) \in F[x]$ is separable over $F$ if $f$ has no repeated roots in any splitting field. A polynomial $g(x) \in F[x]$ is separable over $F$ if all irreducible factors of $g$ are separable over $F$.

**Example 4.2** The polynomial $x^2 - 2$ is separable over $\mathbb{Q}$, as is $(x - 1)^9$. The polynomial $x^2 + x + 1$ is separable over $\mathbb{F}_2$, since we saw in Example 2.8 that if $\alpha$ is a root, then so is $\alpha + 1$. Suppose that $\mathrm{char}(F) = p$ and $a \in F - F^p$. Then $x^p - a$ is irreducible over $F$ (see Problem 5), but it is not separable over $F$, since it has at most one root in any extension field of $F$. Note that if $\alpha$ is a root of $x^p - a$, then $x^p - a$ is separable over $F(\alpha)$.

The following lemma gives some basic properties of separability.

**Lemma 4.3** Let $f(x)$ and $g(x)$ be polynomials over a field $F$.

1. If $f$ has no repeated roots in any splitting field, then $f$ is separable over $F$.
2. If $g$ divides $f$ and if $f$ is separable over $F$, then $g$ is separable over $F$.
3. If $f_1, \ldots, f_n$ are separable polynomials over $F$, then the product $f_1 \cdots f_n$ is separable over $F$.
4. If $f$ is separable over $F$, then $f$ is separable over any extension field of $F$.

**Proof.** For property 1, if $f$ has no repeated roots in any splitting field, then neither does any irreducible factor of $f$. Thus, $f$ is separable over $F$. To show property 2, if $g$ divides $f$ with $f$ separable over $F$, then no irreducible factor of $f$ has a repeated root. However, the irreducible factors of $g$ are also irreducible factors of $f$. Thus, $g$ is separable over $F$. To prove property 3, we see that the set of irreducible factors of the $f_i$ is precisely the set of irreducible factors of the polynomial $f_1 \cdots f_n$. Each of these irreducible factors have no repeated roots, so $f_1 \cdots f_n$ is separable over $F$. Finally, for property 4, let $f(x) \in F[x]$ be separable over $F$, and let $K$ be an extension of $F$. If $p(x)$ is an irreducible factor of $f(x)$ in $K[x]$, let $\alpha$ be a root of $p$ in some algebraic closure of $K$, and set $q(x) = \min(F,\alpha)$. Then $q(x) \in K[x]$, so $p$ divides $q$. But $q$ has no repeated roots, since $q$ is an irreducible factor of $f$. Thus, $p$ has no repeated roots, so $f$ is separable over $K$.
□

In order to have an effective test for separability, we need the concept of polynomial differentiation. A more general notion of differentiation, that of a derivation, will be used to study transcendental extensions in Chapter V.

**Definition 4.4** If $f(x) = a_0 + a_1 x + \cdots + a_n x^n \in F[x]$, then the formal derivative $f'(x)$ is defined by $f'(x) = a_1 + 2a_2 x + \cdots + n a_n x^{n-1}$.

The formal derivative of a polynomial is well defined for any field $F$. We do not need limits in order to define it, as we do in calculus. However, some strange things can happen in prime characteristic. For instance, the derivative of $x^p$ is $0$ if the base field has characteristic $p$.

The formal derivative satisfies the same basic properties as the derivative of calculus. If $f(x), g(x) \in F[x]$ and $a, b \in F$, then

1. $(a f(x) + b g(x))' = a f'(x) + b g'(x)$;
2. $(f(x) g(x))' = f'(x) g(x) + f(x) g'(x)$;
3. $(f(g(x))' = f'(g(x)) g'(x)$.

The proof of these properties is straightforward and is left to Problem 1.

By using derivatives, we obtain a good test for determining when a polynomial has a repeated root. This test is given in the following proposition.

**Proposition 4.5** Let $f(x) \in F[x]$ be a nonconstant polynomial. Then $f$ has no repeated roots in a splitting field if and only if $\gcd(f, f') = 1$ in $F[x]$.

**Proof.** We first point out that $f$ and $f'$ are relatively prime in $F[x]$ if and only if they are relatively prime in $K[x]$. To prove this, suppose that $\gcd(f, f') = 1$ in $F[x]$. Then there are polynomials $g, h \in F[x]$ with $1 = f g + f' h$. This also is an equation in $K[x]$, so the gcd in $K[x]$ of $f$ and $f'$ must divide $1$. Thus, $\gcd(f, f') = 1$ in $K[x]$. Conversely, suppose that $\gcd(f, f') = 1$ in $K[x]$. If $d$ is the gcd of $f$ and $f'$ in $F[x]$, then $d \in K[x]$, so $d$ divides $1$; thus, $f$ and $f'$ are relatively prime in $F[x]$.

Suppose that $f$ and $f'$ are relatively prime in $F[x]$. In particular, let $K$ be a splitting field of $\{f, f'\}$ over $F$. If $f$ and $f'$ have a common root $\alpha \in K$, then $x - \alpha$ divides both $f$ and $f'$ in $K[x]$. This would contradict the fact that $f$ and $f'$ are relatively prime in $K[x]$. Therefore, $f$ and $f'$ have no common roots.

Conversely, if $f$ and $f'$ have no common roots in a splitting field $K$ of $\{f, f'\}$, let $d(x)$ be the greatest common divisor in $K[x]$ of $f(x)$ and $f'(x)$. Then $d$ splits over $K$ since $f$ splits over $K$ and $d$ divides $f$. Any root of $d$ is then a common root of $f$ and $f'$ since $d$ also divides $f'$. Thus, $d(x)$ has no roots, so $d = 1$. Therefore, $f$ and $f'$ are relatively prime over $K$; hence, they are also relatively prime over $F$.
□

With this derivative test, we can give the following criteria for when a polynomial is separable. Note that this test does not require that we know the roots of a polynomial.

**Proposition 4.6** Let $f(x) \in F[x]$ be an irreducible polynomial.

1. If $\mathrm{char}(F) = 0$, then $f$ is separable over $F$. If $\mathrm{char}(F) = p > 0$, then $f$ is separable over $F$ if and only if $f'(x) \neq 0$, and this occurs if and only if $f(x) \notin F[x^p]$.
2. If $\mathrm{char}(F) = p$, then $f(x) = g(x^{p^m})$ for some integer $m \geq 0$ and some $g(x) \in F[x]$ that is irreducible and separable over $F$.

**Proof.** If $f(x) \in F[x]$ is irreducible over $F$, then the only possibility for $\gcd(f, f')$ is $1$ or $f$. If $\mathrm{char}(F) = 0$, then $\deg(f') = \deg(f) - 1$; thus, $f$ does not divide $f'$, and so $\gcd(f, f') = 1$. Therefore, by Proposition 4.5, $f$ has no repeated roots, so $f$ is separable over $F$. If $\mathrm{char}(F) = p > 0$, the same reasoning shows $\gcd(f, f') = f$ if and only if $f$ divides $f'$, if and only if $f'(x) = 0$, if and only if $f(x) \in F[x^p]$.

For statement 2, suppose that $\mathrm{char}(F) = p$, and let $f(x) \in F[x]$. Let $m$ be maximal such that $f(x) \in F[x^{p^m}]$. Such an $m$ exists, since $f \in F[x^{p^0}]$ and $f$ lies in $F[x^{p^r}]$ for only finitely many $r$ because any nonconstant polynomial in $F[x^{p^r}]$ has degree at least $p^r$. Say $f(x) = g(x^{p^m})$. Then $g(x) \notin F[x^p]$ by maximality of $m$. Moreover, $g$ is irreducible over $F$, since if $g(x) = h(x) \cdot k(x)$, then $f(x) = h(x^{p^m}) \cdot k(x^{p^m})$ is reducible over $F$. By statement 2, $g$ is separable over $F$.
□

We now extend the concept of separability to field elements and field extensions.

**Definition 4.7** Let $K$ be an extension field of $F$ and let $\alpha \in K$. Then $\alpha$ is separable over $F$ if $\min(F,\alpha)$ is separable over $F$. If every $\alpha \in K$ is separable over $F$, then $K$ is separable over $F$.

**Example 4.8** If $F$ is a field of characteristic 0, then any algebraic extension of $F$ is separable over $F$, since every polynomial in $F[x]$ is separable over $F$. If $k$ is a field of characteristic $p > 0$ and if $k(x)$ is the rational function field in one variable over $k$, then the extension $k(x)/k(x^p)$ is not separable, for $\min(k(x^p), x) = t^p - x^p$, which has only $x$ as a root.

We are now in a position to give a characterization of Galois extension. This characterization is the most common way to show that a field extension is Galois.

**Theorem 4.9** Let $K$ be an algebraic extension of $F$. Then the following statements are equivalent:

1. $K$ is Galois over $F$.
2. $K$ is normal and separable over $F$.
3. $K$ is a splitting field of a set of separable polynomials over $F$.

**Proof.** (1) $\Rightarrow$ (2): Suppose that $K$ is Galois over $F$, and let $\alpha \in K$. Let $\alpha_1, \ldots, \alpha_n$ be the distinct elements of the set $\{ \sigma(\alpha) : \sigma \in \mathrm{Gal}(K/F) \}$. This set is finite by Lemma 2.3, since each $\sigma(\alpha)$ is a root of $\min(F,\alpha)$. Let $f(x) = \prod_i (x - \alpha_i) \in K[x]$. Then $\tau(f) = f$, since $\tau$ permutes the $\alpha_i$. Thus, the coefficients of $f$ lie in $\mathcal{F}(\mathrm{Gal}(K/F)) = F$, so $f(x) \in F[x]$. Therefore, $\min(F,\alpha)$ divides $f$, and so $\min(F,\alpha)$ splits over $K$ and has no repeated roots. Since this is true for each $\alpha \in K$, the field $K$ is the splitting field of the set $\{\min(F,\alpha) : \alpha \in K\}$ of polynomials separable over $F$. Hence, $K/F$ is normal and separable.

(2) $\Rightarrow$ (3): If $K/F$ is normal and separable, then $K$ is the splitting field of the set of separable polynomials $\{\min(F,\alpha) : \alpha \in K\}$ by Proposition 3.28.

(3) $\Rightarrow$ (1): We first assume that $[K : F] < \infty$, and we use induction on $n = [K : F]$. If $n = 1$, then $K = F$ is trivially Galois over $F$. So, suppose that $n > 1$ and that the result holds for field extensions of degree less than $n$. Say $K$ is the splitting field of the set of separable polynomials $\{f_i(x)\}$. Since $n > 1$, there is a root $\alpha$ of one of the $f_i$ which is not in $F$. Let $L = F(\alpha)$. Then $[L : F] > 1$, so $[K : L] < n$. Since $K$ is the splitting field over $L$ of the $f_i$, which are separable over $L$, by induction $K$ is Galois over $L$. Let $H = \mathrm{Gal}(K/L)$, a subgroup of $\mathrm{Gal}(K/F)$. Let $\alpha_1, \ldots, \alpha_r$ be the distinct roots of $\min(F,\alpha)$. Then, since $\alpha$ is separable over $F$, we have $[L : F] = r$. By the isomorphism extension theorem, there are $\tau_i \in \mathrm{Gal}(K/F)$ with $\tau_i(\alpha) = \alpha_i$. The cosets $\tau_i H$ are then distinct, since if $\tau_i^{-1} \tau_j \in H = \mathrm{Gal}(K/L)$, then $(\tau_i^{-1} \tau_j)(\alpha) = \alpha$; hence, $\alpha_i = \tau_i(\alpha) = \tau_j(\alpha) = \alpha_j$. Let $G = \mathrm{Gal}(K/F)$. We have

$$
|G| = |G : H| \cdot |H| \geq r \cdot |H| = [L : F] \cdot [K : L] = [K : F].
$$

Since $|G| \leq [K : F]$ by Proposition 2.13, we get $|G| = [K : F]$, so $K$ is Galois over $F$.

Now suppose that $K/F$ is arbitrary. By hypothesis, $K$ is the splitting field over $F$ of a set $S$ of separable polynomials over $F$. Let $X$ be the set of roots of all of these polynomials. So, $K = F(X)$. Let $a \in \mathcal{F}(\mathrm{Gal}(K/F))$. We wish to show that $a \in F$. There is a finite subset $\{\alpha_1, \ldots, \alpha_n\} \subseteq X$ with $a \in F(\alpha_1, \ldots, \alpha_n)$. Let $L \subseteq K$ be the splitting field of $\{\min(F,\alpha_i) : 1 \leq i \leq n\}$. Then, by the previous paragraph, $L/F$ is a finite Galois extension. Note that $a \in L$. An application of the isomorphism extension theorem shows that each element of $\mathrm{Gal}(L/F)$ extends to an $F$-automorphism of $K$, and so Proposition 3.28 implies that

$$
\mathrm{Gal}(L/F) = \{ \sigma|_L : \sigma \in \mathrm{Gal}(K/F) \}.
$$

Therefore, $a \in \mathcal{F}(\mathrm{Gal}(L/F))$, and this fixed field is $F$, since $L/F$ is Galois. This proves $\mathcal{F}(\mathrm{Gal}(K/F)) = F$, so $K/F$ is Galois.
□

**Corollary 4.10** Let $L$ be a finite extension of $F$.

1. $L$ is separable over $F$ if and only if $L$ is contained in a Galois extension of $F$.
2. If $L = F(\alpha_1, \ldots, \alpha_n)$ with each $\alpha_i$ separable over $F$, then $L$ is separable over $F$.

**Proof.** If $L \subseteq K$ with $K/F$ Galois, then $K/F$ is separable by Theorem 4.9. Hence, $L/F$ is separable. Conversely, suppose that $L/F$ is separable. Since $[L : F] < \infty$, we may write $L = F(\alpha_1, \ldots, \alpha_n)$, and each $\alpha_i$ is separable over $F$. If $K$ is the splitting field of $\{\min(F,\alpha_i) : 1 \leq i \leq n\}$, then $L \subseteq K$, and $K/F$ is Galois by Theorem 4.9.

For the proof of statement 2, let $L = F(\alpha_1, \ldots, \alpha_n)$ with each $\alpha_i$ separable over $F$. Then each $\min(F,\alpha_i)$ is a separable polynomial over $F$. If $K$ is the splitting field of these polynomials, then $K/F$ is Galois by Theorem 4.9. Thus, again by that theorem, $K$ is separable over $F$. Since $L \subseteq K$, we see that $L$ is separable over $F$.
□

Fields for which all algebraic extensions are separable are particularly well behaved. We now determine which fields have this property.

**Definition 4.11** A field $F$ is perfect if every algebraic extension of $F$ is separable.

**Example 4.12** Any field of characteristic 0 is perfect. Therefore, any field containing $\mathbb{Q}$ or contained in $\mathbb{C}$ is perfect. Any algebraically closed field is perfect for the trivial reason that there are no proper algebraic extensions of an algebraically closed field.

The following theorem characterizes perfect fields of prime characteristic. We have seen in previous examples that if $a \in F - F^p$, then $x^p - a$ is an irreducible polynomial that is not separable. Therefore, for $F$ to be perfect, we must have $F^p = F$. We now show this is sufficient to ensure that $F$ is perfect.

**Theorem 4.13** Let $F$ be a field of characteristic $p$. Then $F$ is perfect if and only if $F^p = F$.

**Proof.** Suppose that $F$ is perfect. Let $a \in F$, and consider the field $K = F(\alpha)$, where $\alpha$ is a root of $x^p - a$. The minimal polynomial of $\alpha$ divides $x^p - a = (x - \alpha)^p$. However, $K$ is separable over $F$ since $F$ is perfect; thus, this minimal polynomial has no repeated roots. This means $\alpha \in F$, so $a \in F^p$.

Conversely, suppose that $F^p = F$. Let $K$ be an algebraic extension of $F$, and let $\alpha \in K$. If $p(x) = \min(F,\alpha)$, then by Proposition 4.6 there is an $m$ with $p(x) = g(x^{p^m})$ for some $g(x) \in F[x]$ with $g$ irreducible and separable over $F$. If $g(x) = a_0 + a_1 x + \cdots + x^r$, then there are $b_i \in F$ with $b_i^p = a_i$ for all $i$. Then $p(x) = \sum_i b_i x^{p^m i} = (\sum_i b_i x^{p^{m-1} i})^p$. This contradicts the irreducibility of $p$ unless $m = 1$. Thus, $p = g$ is separable over $F$, so $\alpha$ is separable over $F$. Therefore, any algebraic extension of $F$ is separable, so $F$ is perfect.
□

**Example 4.14** Any finite field is perfect; to prove this, let $F$ be a finite field. The map $\varphi : F \to F$ given by $\varphi(a) = a^p$ is a nonzero field homomorphism, so $\varphi$ is injective. Since $F$ is finite, $\varphi$ is also surjective. Thus, $F^p = \mathrm{im}(\varphi) = F$, so $F$ is perfect by Theorem 4.13. We give another proof of this fact in Corollary 6.13.

### Purely inseparable extensions

We now discuss the condition diametrically opposed to separability. This situation is only relevant in prime characteristic, since any algebraic extension in characteristic 0 is separable. If $F$ is a field of characteristic $p > 0$, and if $a \in F$, then $x^p - a$ has only one distinct root in any splitting field, since if $\alpha$ is a root of $f$, then $x^p - a = (x - \alpha)^p$. In this case, $\alpha^p = a \in F$.

**Definition 4.15** Let $K$ be an algebraic field extension of $F$. An element $\alpha \in K$ is purely inseparable over $F$ if $\min(F,\alpha)$ has only one distinct root. The field $K$ is purely inseparable over $F$ if every element in $K$ is purely inseparable over $F$.

The definition of purely inseparable requires that we know how many roots there are of a minimal polynomial of an element. The following lemma gives an easier way to determine when an element is purely inseparable over a field.

**Lemma 4.16** Let $F$ be a field of characteristic $p > 0$. If $\alpha$ is algebraic over $F$, then $\alpha$ is purely inseparable over $F$ if and only if $\alpha^{p^n} \in F$ for some $n$. When this happens, $\min(F,\alpha) = (x - \alpha)^{p^n}$ for some $n$.

**Proof.** If $\alpha^{p^n} = a \in F$, then $\alpha$ is a root of the polynomial $x^{p^n} - a$. This polynomial factors over $F(\alpha)$ as $(x - \alpha)^{p^n}$, and $\min(F,\alpha)$ divides this polynomial, so $\min(F,\alpha)$ has only $\alpha$ as a root. Conversely, suppose that $\alpha$ is purely inseparable over $F$, and let $f(x) = \min(F,\alpha)$. There is a separable irreducible polynomial $g(x)$ over $F$ with $f(x) = g(x^{p^m})$ by Proposition 4.6. If $g$ factors over a splitting field as $g(x) = (x - b_1) \cdots (x - b_r)$, then $f(x) = (x^{p^m} - b_i) \cdots (x^{p^m} - b_r)$. If $r > 1$, then separability of $g$ says that the $b_i$ are distinct. By assumption, the only root of $f$ is $\alpha$. Thus, $b_i = \alpha^{p^m}$ for each $i$. Hence, $r = 1$, so $f(x) = x^{p^m} - b_1$. Therefore, $\alpha^{p^m} \in F$, and $\min(F,\alpha) = x^{p^m} - b_1 = (x - \alpha)^{p^m}$.
□

The basic properties of purely inseparable extensions are given in the following lemma.

**Lemma 4.17** Let $K$ be an algebraic extension of $F$.

1. If $\alpha \in K$ is separable and purely inseparable over $F$, then $\alpha \in F$.
2. If $K/F$ is purely inseparable, then $K/F$ is normal and $\mathrm{Gal}(K/F) = \{\mathrm{id}\}$. Moreover, if $[K : F] < \infty$, and if $p = \mathrm{char}(F)$, then $[K : F] = p^n$ for some $n$.
3. If $K = F(X)$ with each $\alpha \in X$ purely inseparable over $F$, then $K$ is purely inseparable over $F$.
4. If $F \subseteq L \subseteq K$ are fields, then $K/F$ is purely inseparable if and only if $K/L$ and $L/F$ are purely inseparable.

**Proof.** Suppose that $\alpha \in K$ is both separable and purely inseparable over $F$. Then $\min(F,\alpha)$ has only one distinct root, and it also has no repeated roots. Therefore, $p(x) = x - \alpha$, so $\alpha \in F$.

For property 2, if $K/F$ is purely inseparable, then each $\min(F,\alpha)$ splits over $K$, since the only root of $\min(F,\alpha)$ is $\alpha$ itself. Consequently, $K$ is normal over $F$ by Proposition 3.28. If $\sigma \in \mathrm{Gal}(K/F)$, then, for any $\alpha \in K$, the automorphism $\sigma$ maps $\alpha$ to a root of $\min(F,\alpha)$. Thus, $\sigma(\alpha) = \alpha$, so $\sigma = \mathrm{id}$. Therefore, $\mathrm{Gal}(K/F) = \{\mathrm{id}\}$. If $[K : F] < \infty$, then $K$ is finitely generated over $F$; say, $K = F(\alpha_1, \ldots, \alpha_n)$. To prove that $[K : F]$ is a power of $p = \mathrm{char}(F)$, by Proposition 1.20 it suffices by induction to prove this in the case $K = F(\alpha)$. But then $[K : F] = \deg(\min(F,\alpha))$, which is a power of $p$ by the previous lemma.

To prove property 3, suppose that $K$ is generated over $F$ by a set $X$ of elements purely inseparable over $F$. Let $a \in K$. Then $a \in F(\alpha_1, \ldots, \alpha_n)$ for some $\alpha_i \in X$. Since each $\alpha_i$ is purely inseparable over $F$, there is an $m$ such that $\alpha_i^{p^m} \in F$ for each $i$. Because $a$ is a polynomial in the $\alpha_i$, we see that $a^{p^m} \in F$. This forces $\min(F,a)$ to divide $(x - a)^{p^m}$; hence, $\min(F,a)$ has only one distinct root. Therefore, $a$ is purely inseparable over $F$, and so $K/F$ is purely inseparable.

Finally, for property 4, if $K/F$ is purely inseparable, then for any $a \in K$, there is an $m$ with $a^{p^m} \in F$. Thus, $a^{p^m} \in L$, so $K/L$ is purely inseparable. It is clear that $L/F$ is purely inseparable. Conversely, if $L/F$ and $K/L$ are purely inseparable, let $a \in K$. Then $a^{p^m} \in L$ for some $m$, and so $(a^{p^m})^{p^r} = a^{p^{m+r}} \in F$ for some $r$. Therefore, $K/F$ is purely inseparable.
□

**Example 4.18** A field extension need not be either separable or purely inseparable. For instance, if $F = \mathbb{F}_2(x)$ is the rational function field in one variable over $\mathbb{F}_2$, and if $K = F(x^{1/6})$, then $K = F(\sqrt{x}, \sqrt[3]{x})$. Moreover, $\sqrt{x}$ is purely inseparable over $F$, and $\sqrt[3]{x}$ is separable over $F$. The subfield $F(\sqrt{x})$ is purely inseparable over $F$, and the subfield $F(\sqrt[3]{x})$ is separable over $F$.

In the previous example, we can show that $F(\sqrt[3]{x})$ consists of all the elements of $K$ that are separable over $F$ and that $F(\sqrt{x})$ consists of all the elements of $K$ that are purely inseparable over $F$. This is a special case of the following lemma. We first give the relevant definitions.

**Definition 4.19** Let $K$ be a field extension of $F$. Then the separable closure of $F$ in $K$ is the set $\{ a \in K : a \text{ is separable over } F \}$. The purely inseparable closure of $F$ in $K$ is the set $\{ a \in K : a \text{ is purely inseparable over } F \}$.

The separable and purely inseparable closures of $F$ in $K$ are fields, as we now show.

**Proposition 4.20** Let $K$ be a field extension of $F$. If $S$ and $I$ are the separable and purely inseparable closures of $F$ in $K$, respectively, then $S$ and $I$ are field extensions of $F$ with $S/F$ separable, $I/F$ purely inseparable, and $S \cap I = F$. If $K/F$ is algebraic, then $K/S$ is purely inseparable.

**Proof.** Let $a, b \in S$. Then $F(a, b)$ is a separable extension of $F$ by Lemma 4.10. Hence, $a \pm b$, $ab$, and $a/b$ are separable over $F$, so they all lie in $S$. Thus, $S$ is a field. For $I$, if $c, d \in I$, then there are $n, m$ with $c^{p^n} \in F$ and $d^{p^m} \in F$. Setting $N = nm$, we have $(c \pm d)^{p^N}$, $(cd)^{p^N}$, and $(c/d)^{p^N} \in F$. Thus, $c \pm d$, $cd$, and $c/d$ belong to $I$, so $I$ is a field. The equality $S \cap I = F$ holds, since $S \cap I$ is both separable and purely inseparable over $F$. Finally, suppose that $K/F$ is algebraic. If $\alpha \in K$, then $\min(F,\alpha) = g(x^{p^n})$ for some separable, irreducible polynomial $g(x) \in F[x]$ by Proposition 4.6. If $a = \alpha^{p^n}$, then $g(a) = 0$, so $g(z) = \min(F,a)$. Therefore, $a$ is separable over $F$, so $\alpha^{p^n} = a \in S$. Thus, $K/S$ is purely inseparable.
□

If $K/F$ is an algebraic extension, we can break up the extension $K/F$ into a separable extension $S/F$ followed by a purely inseparable extension $K/S$, where $S$ is the separable closure of $F$ in $K$. Use of the separable closure is a nice tool to prove results dealing with separability. As an illustration, we prove that separability is a transitive property.

**Proposition 4.21** If $F \subseteq L \subseteq K$ are fields such that $L/F$ and $K/L$ are separable, then $K/F$ is separable.

**Proof.** Let $S$ be the separable closure of $F$ in $K$. Then $L \subseteq S$, as $L/F$ is separable. Also, since $K/L$ is separable, $K/S$ is separable. But $K/S$ is purely inseparable, so $K = S$. Thus, $K$ is separable over $F$.
□

**Example 4.22** Let $K$ be a finite extension of $F$, and suppose that $\mathrm{char}(F)$ does not divide $[K : F]$. We show that $K/F$ is separable. If $\mathrm{char}(F) = 0$, then this is clear, so suppose that $\mathrm{char}(F) = p > 0$. Let $S$ be the separable closure of $F$ in $K$. Then $K/S$ is purely inseparable, so $[K : S] = p^n$ for some $n$ by Lemma 4.17. However, since $p$ does not divide $[K : F]$, this forces $[K : S] = 1$. Thus, $K = S$, so $K$ is separable over $F$.

A natural question that Proposition 4.20 raises is whether the extension $K/I$ is separable. The answer in general is no, although it is true if $K/F$ is normal, as we now show.

**Theorem 4.23** Let $K$ be a normal extension of $F$, and let $S$ and $I$ be the separable and purely inseparable closures of $F$ in $K$, respectively. Then $S/F$ is Galois, $I = \mathcal{F}(\mathrm{Gal}(K/F))$, and $\mathrm{Gal}(S/F) \cong \mathrm{Gal}(K/I)$. Thus, $K/I$ is Galois. Moreover, $K = SI$.

**Proof.** Let $a \in S$, and set $f(x) = \min(F,a)$. Since $K$ is normal over $F$, the polynomial $f$ splits over $K$. Since $a$ is separable over $F$, the polynomial $f$ has no repeated roots, so all its roots are separable over $S$. Thus, $f$ splits over $S$. Hence, $S$ is normal over $F$ by Proposition 3.28, and since $S$ is separable over $F$, we see by Theorem 4.9 that $S$ is Galois over $F$. The map $\theta : \mathrm{Gal}(K/F) \to \mathrm{Gal}(S/F)$ given by $\theta(\sigma) = \sigma|_S$ is a well-defined group homomorphism. The kernel of $\theta$ is $\mathrm{Gal}(K/S)$, and this group is trivial by Lemma 4.17 since $K$ is purely inseparable over $S$. By the isomorphism extension theorem, if $\tau \in \mathrm{Gal}(S/F)$, there is a $\sigma \in \mathrm{Gal}(K/F)$ with $\sigma|_S = \tau$. Thus, $\theta$ is an isomorphism.

To show that $I = \mathcal{F}(\mathrm{Gal}(K/F))$, if $a \in I$, then $a^{p^n} \in F$ for some $n$. For $\sigma \in \mathrm{Gal}(K/F)$, we have $a^{p^n} = \sigma(a^{p^n}) = \sigma(a)^{p^n}$, so $\sigma(a) = a$. Thus, $I \subseteq \mathcal{F}(\mathrm{Gal}(K/F))$. Conversely, take $b \in \mathcal{F}(\mathrm{Gal}(K/F))$. There is an $n$ with $b^{p^n} \in S$ because $K/S$ is purely inseparable. Let $\tau \in \mathrm{Gal}(S/F)$. Since $\theta$ is surjective, there is a $\sigma \in \mathrm{Gal}(K/F)$ with $\tau = \theta(\sigma) = \sigma|_S$. Then $\tau(b^{p^n}) = \sigma(b^{p^n}) = b^{p^n}$. This is true for each $\tau$; hence, $b^{p^n} \in \mathcal{F}(\mathrm{Gal}(S/F)) = F$. This equality holds since $S$ is Galois over $F$. Thus, $b$ is purely inseparable over $F$. This proves $I = \mathcal{F}(\mathrm{Gal}(K/F))$, so $\mathrm{Gal}(K/F) = \mathrm{Gal}(K/I)$. Therefore, $K$ is Galois over $I$; hence, $K/I$ is separable. Finally, $K$ is separable over $SI$ since $I \subseteq SI$, and $K$ is purely inseparable over $SI$ since $S \subseteq SI$. Therefore, $K = SI$.
□

Let $K$ be a finite extension of $F$. If $S$ and $I$ are the separable and purely inseparable closures of $F$ in $K$, respectively, we define the separable degree $[K : F]_s$ of $K/F$ to be $[S : F]$ and the inseparable degree $[K : F]_i$ to be $[K : S]$. With these definitions, we see that $[K : F]_s [K : F]_i = [K : F]$. By Theorem 4.23, if $K/F$ is normal, then $[K : I] = [S : F]$, and so $[K : S] = [I : F]$. However, as the example below shows, in general $[K : S] \neq [I : F]$. The inseparable degree is defined to be $[K : S]$ and not $[I : F]$ because the degree $[K : S]$ is a better measure for how far the extension $K/F$ is from being separable. The example below shows that it is possible to have $I = F$ even if $K$ is not separable over $F$. We will use the concepts of separable and inseparable degrees in Section 8.

**Example 4.24** We give an example of a field extension $K/F$ in which $K$ is not separable over the purely inseparable closure $I$ of $F$ in $K$. This is also an example of a nonseparable field extension $K/F$ in which the purely inseparable closure is $F$. Let $k$ be a field of characteristic 2, let $F$ be the rational function field $F = k(x, y)$, let $S = F(u)$, where $u$ is a root of $t^2 + t + x$, and let $K = S(\sqrt{uy})$. Then $K/S$ is purely inseparable and $S/F$ is separable, so $S$ is the separable closure of $F$ in $K$. We will show that $I = F$, which will prove that $K/I$ is not separable since $K/S$ is not separable. To do this, we show that if $a \in K$ with $a^2 \in F$, then $a \in F$. A basis for $K/F$ is $1$, $u$, $\sqrt{uy}$, and $u\sqrt{uy}$. Say $a^2 \in F$ and write $a = \alpha + \beta u + \gamma \sqrt{uy} + \delta u \sqrt{uy}$ with $\alpha, \beta, \gamma, \delta \in F$. Then

$$
a^2 = \alpha^2 + \beta^2 (u + x) + \gamma^2 (uy) + \delta^2 (u + x) uy.
$$

The coefficient of $u$ is zero since $a^2 \in F$, so

$$
\beta^2 + (\gamma + \delta)^2 y + \delta^2 x y = 0.
$$

If $\delta = 0$, then $\beta^2 + \gamma^2 y = 0$, so $\gamma = 0$ since $y$ is not a square in $F$. But then $\beta = 0$, so $a \in F$. If $\delta \neq 0$, then

$$
x = \frac{\beta^2 + (\gamma + \delta)^2 y}{\delta^2 y} = \left(\frac{\gamma}{\delta} + 1\right)^2 + \left(\frac{\beta}{\delta}\right)^2 y,
$$

which means that $x \in F^2(y)$. But this is impossible. Thus, $\delta = 0$, and so we conclude that $a \in F$. Thus, $I = F$, so $K/I$ is not separable. Note that $K \neq SI$ also.
