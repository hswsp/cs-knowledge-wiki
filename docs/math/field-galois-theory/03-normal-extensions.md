# 3. Normal Extensions（正规扩张）

In the last section, we saw that there are two ways for the field extension $F(a)/F$ to fail to be Galois: if $\min(F,a)$ does not have all its roots in $F(a)$ or if $\min(F,a)$ has repeated roots. The next two sections investigate these two situations. In this section, we investigate the case when $F(a)$ contains all the roots of $p(x)$ and what this question means for general algebraic extensions. We begin with a result that in the case of polynomials over $\mathbb{R}$ should be familiar.

**Lemma 3.1** Let $f(x) \in F[x]$ and $a \in F$. Then $a$ is a root of $f$ if and only if $x - a$ divides $f$. Furthermore, $f$ has at most $\deg(f)$ roots in any extension field of $F$.

**Proof.** By the division algorithm, $f(x) = q(x) \cdot (x - a) + r(x)$ for some $q(x)$ and $r(x)$ with $r(x) = 0$ or $\deg(r) < \deg(x - a)$. In either case, we see that $r(x) = r$ is a constant. But $f(a) = r$, so $f(a) = 0$ if and only if $x - a$ divides $f(x)$.

For the second part, we argue by induction on $n = \deg(f)$. If $n = 1$, then $f(x) = ax + b$ for some $a, b \in F$. The only root of $f$ is $-b/a$, so the result is true if $n = 1$. Assume that any polynomial over an extension field of $F$ of degree $n - 1$ has at most $n - 1$ roots in any extension field $K$ of $F$. If $f(x)$ has no roots in $K$, then we are done. If instead $a \in K$ is a root of $f$, then $f(x) = (x - a) \cdot g(x)$ for some $g(x) \in K[x]$ by the first part of the lemma. Since $g(x)$ has degree $n - 1$, by induction $g$ has at most $n - 1$ roots in $K$. The roots of $f$ consist of $a$ together with the roots of $g$. Thus, $f$ has at most $n$ roots.
□

**Definition 3.2** If $K$ is an extension field of $F$ and if $f(x) \in F[x]$, then $f$ splits over $K$ if $f(x) = a \prod_i (x - a_i) \in K[x]$ for some $a_1, \ldots, a_n \in K$ and $a \in F$. In other words, $f$ splits over $K$ if $f$ factors completely into linear factors in $K[x]$.

In order to talk about roots of a given polynomial, we need to have extension fields that contain the roots of the polynomial. The next theorem shows that for any $f(x) \in F[x]$, there is a finite extension of $F$ over which $f$ splits. We use a generalization of the construction of Example 1.6 to construct a field containing roots of a given polynomial.

**Theorem 3.3** Let $f(x) \in F[x]$ have degree $n$. There is an extension field $K$ of $F$ with $[K : F] \leq n$ such that $K$ contains a root of $f$. In addition, there is a field $L$ containing $F$ with $[L : F] \leq n!$ such that $f$ splits over $L$.

**Proof.** Let $p(x)$ be an irreducible factor of $f(x)$ in $F[x]$, and let $K$ be the field $F[x]/(p(x))$. Then $F$ is isomorphic to a subfield of $K$; namely, the map $\varphi : F \to K$ given by $\varphi(a) = a + (p(x))$ is an injection of fields. We will view $F \subseteq K$ by replacing $F$ with $\varphi(F)$. If $\alpha = x + (p(x)) \in K$, then $p(\alpha) = p(x) + (p(x)) = 0 + (p(x))$. Thus, $\alpha$ is a root of $p$ in $K$; therefore, $\alpha$ is a root of $f$. Since $[K : F] = \deg(p) \leq n$, this proves the first part of the theorem.

For the second part, we use induction on $n$. By the first part, there is a field $K \supseteq F$ with $[K : F] \leq n$ such that $K$ contains a root $\alpha$ of $f(x)$, say $f(x) = (x - \alpha) \cdot g(x)$ with $g(x) \in K[x]$. By induction, there is a field $L \supseteq K$ with $[L : K] \leq (n - 1)!$ such that $g$ splits over $L$. But then $f$ splits over $L$ and $[L : F] = [L : K] \cdot [K : F] \leq (n - 1)! \cdot n = n!$.
□

**Definition 3.4** Let $K$ be an extension field of $F$ and let $f(x) \in F[x]$.

1. If $f(x) \in F[x]$, then $K$ is a splitting field of $f$ over $F$ if $f$ splits over $K$ and $K = F(\alpha_1, \ldots, \alpha_m)$, where $\alpha_1, \ldots, \alpha_m$ are the roots of $f$.

2. If $S$ is a set of nonconstant polynomials over $F$, then $K$ is a splitting field of $S$ over $F$ if each $f \in S$ splits over $K$ and $K = F(X)$, where $X$ is the set of all roots of all $f \in S$.

Intuitively, a splitting field for a set $S$ of polynomials is a minimal field extension over which each $f \in S$ splits. This is made more concrete in Problem 2.

Theorem 3.3 yields immediately the existence of splitting fields for a finite set of polynomials.

**Corollary 3.5** If $f_1(x), \ldots, f_n(x) \in F[x]$, then there is a splitting field for $\{f_1, \ldots, f_n\}$ over $F$.

**Proof.** Suppose that $f_1, \ldots, f_n \in F[x]$. Note that a splitting field of $\{f_1, \ldots, f_n\}$ is the same as a splitting field of the product $f_1 \cdots f_n$. If $f = f_1 \cdots f_n$, then by Theorem 3.3, there is a field $L \supseteq F$ such that $f$ splits over $L$. Let $\alpha_1, \ldots, \alpha_n \in L$ be the roots of $f$. Then $F(\alpha_1, \ldots, \alpha_n)$ is a splitting field for $f$ over $F$.
□

**Example 3.6** The field $\mathbb{Q}(\omega, \sqrt[3]{2})$ is a splitting field for $x^3 - 2$ over $\mathbb{Q}$, since we have seen in Example 2.21 that this field is also the field generated by the three roots of $x^3 - 2$ over $\mathbb{Q}$. The complex field $\mathbb{C}$ is a splitting field over $\mathbb{R}$ for $x^2 + 1$, since $\mathbb{C} = \mathbb{R}(i, -i)$ is generated by $\mathbb{R}$ and the roots of $x^2 + 1$. In general, if $F$ is a field and $a \in F$, then the field $F(\sqrt{a})$ is a splitting field for $x^2 - a$ over $F$.

**Example 3.7** Let $F = \mathbb{F}_2$ and $K = F[x]/(1 + x + x^2) \cong F(\alpha)$, where $\alpha$ is a root of $1 + x + x^2$. Then $1 + x + x^2$ factors as $(x - \alpha)(x - (\alpha + 1))$ over $K$, so $K$ is a splitting field of $1 + x + x^2$.

We will show that splitting fields are unique up to isomorphism. From this fact, the next corollary would follow from Theorem 3.3. However, we give a different proof so that we can use it in the next example.

**Corollary 3.8** Let $F$ be a field and let $f(x) \in F[x]$ be a polynomial of degree $n$. If $K$ is a splitting field of $f$ over $F$, then $[K : F] \leq n!$.

**Proof.** We prove this by induction on $n = \deg(f)$. If $n = 1$, then the result is clear. Suppose that $n > 1$ and that the result is true for polynomials of degree $n - 1$. Let $K$ be a splitting field of $f$ over $F$, and let $a$ be a root of $f$ in $K$. Then $[F(a) : F] \leq n$, since $\min(F,a)$ divides $f$. If $f(x) = (x - a)g(x)$, then $\deg(g) = n - 1$ and $K$ is the splitting field of $g$ over $F(a)$. By induction, $[K : F(a)] \leq (n - 1)!$ by Theorem 3.3, so

$$
\begin{aligned}
{}[K : F] &= [F(a) : F] \cdot [K : F(a)] \\
&\leq n \cdot (n - 1)! = n!.
\end{aligned}
$$

This proves the corollary.
□

**Example 3.9** Let $k$ be a field, and let $K = k(x_1, x_2, \ldots, x_n)$ be the rational function field in $n$ variables over $k$. We view the symmetric group $S_n$ as a subgroup of $\mathrm{Aut}(K)$ by defining

$$
\sigma\left( \frac{f(x_1, \ldots, x_n)}{g(x_1, \ldots, x_n)} \right) = \frac{f(x_{\sigma(1)}, \ldots, x_{\sigma(n)})}{g(x_{\sigma(1)}, \ldots, x_{\sigma(n)})}
$$

for $\sigma \in S_n$, as in Example 2.22. Let $F = \mathcal{F}(S_n)$, the field of symmetric functions in the $x_i$. Then $S_n = \mathrm{Gal}(K/F)$ by Proposition 2.14, so $[K : F] = |S_n| = n!$. We wish to determine $F$. Let $s_1, s_2, \ldots, s_n$ be the elementary symmetric functions in the $x_i$; that is,

$$
\begin{aligned}
s_1 &= x_1 + x_2 + \cdots + x_n, \\
s_2 &= \sum_{i \neq j} x_i x_j, \\
&\vdots \\
s_n &= x_1 x_2 \cdots x_n.
\end{aligned}
$$

Then $k(s_1, s_2, \ldots, s_n) \subseteq F$. We claim that $F = k(s_1, \ldots, s_n)$. To show this, we use the concept of splitting fields. Let

$$
f(t) = t^n - s_1 t^{n-1} + \cdots + (-1)^n s_n \in k(s_1, s_2, \ldots, s_n)[t].
$$

Then $f(t) = (t - x_1) \cdots (t - x_n)$ in $K[t]$, which can be seen by expanding this product. Since $K$ is generated over $k$ by the $x_i$, we see that $K$ is a splitting field for $f(t)$ over $k(s_1, s_2, \ldots, s_n)$. We know that $[K : F] = |S_n| = n!$, and so $[K : k(s_1, s_2, \ldots, s_n)] \geq n!$. However, $[K : k(s_1, s_2, \ldots, s_n)] \leq n!$ by Corollary 3.8. Therefore, $[K : k(s_1, s_2, \ldots, s_n)] = [K : F]$. This forces $F = k(s_1, s_2, \ldots, s_n)$. Therefore, any symmetric function can be written in terms of the elementary symmetric functions. In fact, every symmetric polynomial can be written as a polynomial in the elementary symmetric functions (see Problem 17).

### Algebraic closures

We have proved the existence of splitting fields for finite sets of polynomials. What about infinite sets? Suppose that $K$ is a splitting field over $F$ of the set of all nonconstant polynomials over $F$. We do not know yet that such a field exists, but we will show it does exist. Let $L$ be an algebraic extension of $K$. If $a \in L$, then $a$ is algebraic over $F$ by Theorem 1.24, since $K$ is algebraic over $F$. Let $f(x) = \min(F,a)$. Then $f$ splits over $K$; hence, $a \in K$. Thus, $L = K$. This proves that $K$ has no algebraic extensions. The existence of such a field will imply the existence of splitting fields of an arbitrary set of polynomials. Moreover, given $K$, we shall see that any algebraic extension of $F$ is isomorphic to a subfield of $K$. This will allow us to view all algebraic extensions of $F$ as subfields of $K$.

We first give some equivalent conditions for such a field.

**Lemma 3.10** If $K$ is a field, then the following statements are equivalent:

1. There are no algebraic extensions of $K$ other than $K$ itself.
2. There are no finite extensions of $K$ other than $K$ itself.
3. If $L$ is a field extension of $K$, then $K = \{ a \in L : a \text{ is algebraic over } K \}$.
4. Every $f(x) \in K[x]$ splits over $K$.
5. Every $f(x) \in K[x]$ has a root in $K$.
6. Every irreducible polynomial over $K$ has degree 1.

**Proof.** (1) $\Rightarrow$ (2): This is clear, since any finite extension of $F$ is an algebraic extension of $F$.

(2) $\Rightarrow$ (3): Let $a \in L$ be algebraic over $K$. Then $K(a)$ is a finite extension of $K$, so $K(a) = K$. Thus, $a \in K$.

(3) $\Rightarrow$ (4): Let $f(x) \in K[x]$, and let $L$ be a splitting field of $f$ over $K$. Since $L$ is algebraic over $K$, statement 3 shows that $L = K$; that is, $f$ splits over $K$.

(4) $\Rightarrow$ (5): This is clear.

(5) $\Rightarrow$ (6): Let $f(x) \in K[x]$ be irreducible. By statement 5, $f$ has a root in $K$, so $f$ has a linear factor. Since $f$ is irreducible, this means $f$ itself is linear, so $\deg(f) = 1$.

(6) $\Rightarrow$ (1): Let $L$ be an algebraic extension of $K$. Take $a \in L$, and let $p(x) = \min(K,a)$. By statement 6, the degree of $p$ is 1, so $[K(a) : K] = 1$. Thus, $a \in K$, so $L = K$.
□

**Definition 3.11** If $K$ satisfies the equivalent conditions of Lemma 3.10, then $K$ is said to be algebraically closed. If $K$ is an algebraic extension of $F$ and is algebraically closed, then $K$ is said to be an algebraic closure of $F$.

**Example 3.12** The complex field $\mathbb{C}$ is algebraically closed. This fact is usually referred to as the fundamental theorem of algebra, and it will be proved in Section 5. If

$$
A = \{ a \in \mathbb{C} : a \text{ is algebraic over } \mathbb{Q} \},
$$

then it is not hard to prove that $A$ is algebraically closed by using that $\mathbb{C}$ is algebraically closed; see Problem 4b. Furthermore, $\mathbb{C}$ is an algebraic closure of $\mathbb{R}$, and $A$ is an algebraic closure of $\mathbb{Q}$. However, $\mathbb{C}$ is not an algebraic closure of $\mathbb{Q}$ since $\mathbb{C}$ is not algebraic over $\mathbb{Q}$.

We wish to prove the existence of an algebraic closure of an arbitrary field $F$ and to prove the existence of a splitting field for an arbitrary set of polynomials. In order to do this, we will use a Zorn's lemma argument. The next lemma is needed for technical reasons in the proof of the existence of an algebraic closure.

**Lemma 3.13** If $K/F$ is algebraic, then $|K| \leq \max(|F|, |\mathbb{N}|)$.

**Proof.** In this proof, we require some facts of cardinal arithmetic, facts that can be found in Proposition 2.1 in Appendix B. If $a \in K$, pick a labeling $a_1, \ldots, a_m$ of the roots of $\min(F,a)$ in $K$. If $\mathcal{M}$ is the set of all monic polynomials over $F$, define $f : K \to \mathcal{M} \times \mathbb{N}$ by $f(a) = (p(x), r)$ if $p(x) = \min(F,a)$ and $a = a_r$. This map is clearly injective, so

$$
|K| \leq |\mathcal{M} \times \mathbb{N}| = \max(|\mathcal{M}|, |\mathbb{N}|).
$$

We will be done by showing that $|\mathcal{M}| \leq \max(|F|, |\mathbb{N}|)$. For this, if $\mathcal{M}_n$ is the set of monic polynomials over $F$ of degree $n$, then $|\mathcal{M}_n| = |F^n|$, since the map $(a_0, \ldots, a_{n-1}) \mapsto z^n + \sum_{i=0}^{n-1} a_i z^i$ is a bijection between $F^n$ and $\mathcal{M}_n$. If $F$ is finite, then $|F^n| = |F|^n$ is finite, and if $F$ is infinite, then $|F^n| = |F|$. Therefore, since $\mathcal{M}$ is the union of the disjoint sets $\mathcal{M}_n$, we have $|\mathcal{M}| = |\bigcup_n \mathcal{M}_n| = \max(|F|, |\mathbb{N}|)$.
□

**Theorem 3.14** Let $F$ be a field. Then $F$ has an algebraic closure.

**Proof.** Let $S$ be a set containing $F$ with $|S| > \max(|F|, |\mathbb{N}|)$. Let $\mathcal{A}$ be the set of all algebraic extension fields of $F$ inside $S$. Then $\mathcal{A}$ is ordered by defining $K \leq L$ if $L$ is an extension field of $K$. By Zorn's lemma, there is a maximal element $M$ of $\mathcal{A}$. We claim that $M$ is an algebraic closure of $F$. To show that $M$ is algebraically closed, let $L$ be an algebraic extension of $M$. By Lemma 3.13,

$$
|L| \leq \max(|M|, |\mathbb{N}|) \leq |F|, |\mathbb{N}|) < |S|.
$$

Thus, there is a function $f : L \to S$ with $f|_M = \mathrm{id}$. By defining $+$ and $\cdot$ on $f(L)$ by $f(a) + f(b) = f(a + b)$ and $f(a) \cdot f(b) = f(ab)$, we see that $f(L)$ is a field extension of $M$ and $f$ is a field homomorphism. Maximality of $M$ shows that $f(L) = M$, so $L = M$. Thus, $M$ is algebraically closed. Since $M$ is algebraic over $F$, we see that $M$ is an algebraic closure of $F$.
□

The existence of an algebraic closure yields immediately the existence of a splitting field for an arbitrary set of nonconstant polynomials.

**Corollary 3.15** Let $S$ be a set of nonconstant polynomials over $F$. Then $S$ has a splitting field over $F$.

**Proof.** Let $K$ be an algebraic closure of $F$. Then each $f(x) \in S$ splits over $K$. Let $X$ be the set of roots of all $f \in S$. Then $F(X) \subseteq K$ is a splitting field for $S$ over $F$, since each $f$ splits over $F(X)$ and this field is generated by the roots of all the polynomials from $S$.
□

To emphasize a useful interpretation of an algebraic closure, we record the following easy consequence of the existence of arbitrary splitting fields.

**Corollary 3.16** If $F$ is a field, then the splitting field of the set of all nonconstant polynomials over $F$ is an algebraic closure of $F$.

Now that we have the existence of a splitting field for any set of nonconstant polynomials, what can we say about such fields? Can we have many different splitting fields, up to isomorphism? The answer is no; the next lemma is the first step in showing this.

The following fact is used in the lemma below and in a number of other places. If $\sigma : F \to F'$ is a field homomorphism, then there is an induced ring homomorphism $F[x] \to F'[x]$, which we also denote by $\sigma$, given by $\sigma(\sum a_i x^i) = \sum \sigma(a_i) x^i$. It is an easy calculation to show that $\sigma$ does indeed induce a ring homomorphism on $F[x]$. If $f(x) = (x - a_1) \cdots (x - a_n) \in F[x]$, then the preservation of polynomial multiplication shows that $\sigma(f(x)) = (x - \sigma(a_1)) \cdots (x - \sigma(a_n))$. This relationship between $\sigma$ and factorization of polynomials will help us to study splitting fields.

**Lemma 3.17** Let $\sigma : F \to F'$ be a field isomorphism. Let $f(x) \in F[x]$ be irreducible, let $\alpha$ be a root of $f$ in some extension field $K$ of $F$, and let $\alpha'$ be a root of $\sigma(f)$ in some extension $K'$ of $F'$. Then there is an isomorphism $\tau : F(\alpha) \to F'(\alpha')$ with $\tau(\alpha) = \alpha'$ and $\tau|_F = \sigma$.

**Proof.** Since $f$ is irreducible and $f(\alpha) = 0$, the minimal polynomial of $\alpha$ over $F$ is a constant multiple of $f$. We thus have an $F$-isomorphism $\varphi : F[x]/(f(x)) \to F(\alpha)$ given by $\varphi(g(x) + (f(x))) = g(\alpha)$ and an $F'$-isomorphism $\psi : F'[x]/(f'(x)) \to F'(\alpha')$ given by $\psi(g(x) + (f'(x))) = g(\alpha')$. Since $\sigma(f) = f'$, the map $\nu(g(x) + (f(x))) = \sigma(g(x)) + (f'(x))$ gives a well-defined isomorphism $\nu : F[x]/(f(x)) \to F'[x]/(f'(x))$ which extends $\sigma$. We have the following sequence of field isomorphisms:

$$
F(\alpha) \stackrel{\varphi^{-1}}{\to} F[x]/(f(x)) \stackrel{\nu}{\to} F'[x]/(f'(x)) \stackrel{\psi}{\to} F'(\alpha').
$$

Therefore, the composition $\varphi^{-1} \circ \nu \circ \psi : F(\alpha) \to F(\alpha')$ is an isomorphism extending $\sigma$ on $F$ with $\alpha \mapsto z + (f(x)) \mapsto z + (f'(x)) \mapsto \alpha'$.
□

**Lemma 3.18** Let $\sigma : F \to F'$ be a field isomorphism, let $K$ be a field extension of $F$, and let $K'$ be a field extension of $F'$. Suppose that $K$ is a splitting field of $\{f_i\}$ over $F$ and that $\tau : K \to K'$ is a homomorphism with $\tau|_F = \sigma$. If $f_i' = \sigma(f_i)$, then $\tau(K)$ is a splitting field of $\{f_i'\}$ over $F'$.

**Proof.** Because $K$ is a splitting field of a set $\{f_i\}$ of polynomials over $F$, given $f_i$ there are $a, a_1, \ldots, a_m \in K$ with $f_i(x) = a \prod_j (x - a_j)$. Therefore, $\tau(f_i(x)) = \tau(a) \prod_j (x - \tau(a_j))$. Hence, each $f_i' = \sigma(f_i) = \tau(f_i)$ splits over $\tau(K)$. Since $K$ is generated over $F$ by the roots of the $f_i$, the field $\tau(K)$ is generated over $F'$ by the images of the roots of the $f_i$; that is, $\tau(K)$ is generated over $F'$ by the roots of the $f_i'$. Thus, $\tau(K)$ is a splitting field over $F'$ for $\{f_i'\}$.
□

The next theorem, the isomorphism extension theorem, is one of the most important results of Galois theory. It proves the uniqueness of splitting fields, although its main use is in constructing automorphisms of a field, and thus for calculating the Galois group of a field extension. Before proving it, we give a proof of the case of splitting fields of a single polynomial. While the full version certainly includes this case, we give a proof of this special case for a few reasons: The proof of this special case is easy and the this case, and the full proof uses a Zorn's lemma argument and is not very intuitive.

**Theorem 3.19** Let $\sigma : F \to F'$ be a field isomorphism, let $f(x) \in F[x]$, and let $\sigma(f) \in F'[x]$ be the corresponding polynomial over $F'$. Let $K$ be the splitting field of $f$ over $F$, and let $K'$ be the splitting field of $\sigma(f)$ over $F'$. Then there is an isomorphism $\tau : K \to K'$ with $\tau|_F = \sigma$. Furthermore, if $\alpha \in K$ and if $\alpha'$ is any root of $\sigma(\min(F,\alpha))$ in $K'$, then $\tau$ can be chosen so that $\tau(\alpha) = \alpha'$.

**Proof.** We prove this by induction on $n = [K : F]$. If $n = 1$, then $f$ splits over $F$, and the result is trivial in this case. So, suppose that $n > 1$ and that the result is true for splitting fields of degree less than $n$. If $f$ splits over $F$, then the result is clear. If not, let $p(x)$ be a nonlinear irreducible factor of $f(x)$, let $\alpha$ be a root of $p$, and let $\alpha'$ be a root of $\sigma(p)$. Set $L = F(\alpha)$ and $L' = F'(\alpha')$. Then $[L : F] > 1$, so $[K : L] < n$. By Lemma 3.17, there is a field isomorphism $\rho : L \to L'$ with $\rho(\alpha) = \alpha'$. Since $K$ is the splitting field over $L$ for $f(x)$ and $K'$ is the splitting field over $L'$ for $\sigma(f)$, by induction the isomorphism $\rho$ extends to an isomorphism $\tau : K \to K'$. The isomorphism $\tau$ is then an extension of $\sigma$ (and $\rho$), and $\tau(\alpha) = \rho(\alpha) = \alpha'$.
□

**Theorem 3.20 (Isomorphism Extension Theorem)** Let $\sigma : F \to F'$ be a field isomorphism. Let $S = \{f_i(x)\}$ be a set of polynomials over $F$, and let $S' = \{\sigma(f_i)\}$ be the corresponding set over $F'$. Let $K$ be a splitting field for $S$ over $F$, and let $K'$ be a splitting field for $S'$ over $F'$. Then there is an isomorphism $\tau : K \to K'$ with $\tau|_F = \sigma$. Furthermore, if $\alpha \in K$ and $\alpha'$ is any root of $\sigma(\min(F,\alpha))$ in $K'$, then $\tau$ can be chosen so that $\tau(\alpha) = \alpha'$.

**Proof.** We prove this with a Zorn's lemma argument. Let $\mathcal{S}$ be the set of all pairs $(L, \varphi)$ such that $L$ is a subfield of $K$ and $\varphi : L \to K'$ is a homomorphism extending $\sigma$. This set is nonempty since $(F, \sigma) \in \mathcal{S}$. Furthermore, $\mathcal{S}$ is partially ordered by defining $(L, \varphi) \leq (L', \varphi')$ if $L \subseteq L'$ and $\varphi'|_L = \varphi$. Let $\{(L_i, \varphi_i)\}$ be a chain in $\mathcal{S}$. If $L = \bigcup_i L_i$ and $\varphi : L \to K'$ is defined by $\varphi(a) = \varphi_i(a)$ if $a \in L_i$, then it is not hard to see that $L$ is a field extension of all the $L_i$ and $\varphi$ is a homomorphism extending $\sigma$. Thus, $(L, \varphi)$ is an upper bound in $\mathcal{S}$ for this chain. Therefore, by Zorn's lemma there is a maximal element $(M, \tau)$ in $\mathcal{S}$. We claim that $M = K$ and $\tau(M) = K'$. If $M \neq K$, then there is an $f \in S$ that does not split over $M$. Let $\alpha \in K$ be a root of $f$ that is not in $M$, and let $p(x) = \min(F,a)$. Set $p' = \sigma(p) \in F'[x]$ and let $\alpha' \in K'$ be a root of $p'$. Such an $\alpha'$ exists since $p'$ divides $f'$ and $f'$ splits over $K'$. By Lemma 3.17, there is a $\rho : M(\alpha) \to \tau(M)(\alpha')$ that extends $\tau$. Then $(M(\alpha), \rho) \in \mathcal{S}$ is larger than $(M, \tau)$, a contradiction to the maximality of $(M, \tau)$. This proves that $M = K$. The equality $\tau(K) = K'$ follows immediately from Lemma 3.18, since $\tau(K) \subseteq K'$ is a splitting field for $S'$ over $F'$.
□

**Corollary 3.21** Let $F$ be a field, and let $S$ be a subset of $F[x]$. Any two splitting fields of $S$ over $F$ are $F$-isomorphic. In particular, any two algebraic closures of $F$ are $F$-isomorphic.

**Proof.** For the proof of the first statement, the isomorphism extension theorem gives an isomorphism extending $\mathrm{id}$ on $F$ between any two splitting fields of $S$. The second statement follows from the first, since any algebraic closure of $F$ is a splitting field of the set of all nonconstant polynomials in $F[x]$.
□

As a corollary to the existence and uniqueness of algebraic closures, we can prove that any algebraic extension of a field $F$ can be viewed as living inside a fixed algebraic closure of $F$.

**Corollary 3.22** Let $F$ be a field, and let $N$ be an algebraic closure of $F$. If $K$ is an algebraic extension of $F$, then $K$ is isomorphic to a subfield of $N$.

**Proof.** Let $M$ be an algebraic closure of $K$. By Theorem 1.24, $M$ is algebraic over $F$; hence, $M$ is also an algebraic closure of $F$. Therefore, by the previous corollary, $M \cong N$. If $f : M \to N$ is an $F$-isomorphism, then $f(K)$ is a subfield of $N$ isomorphic to $K$.
□

We now go into more detail about splitting fields. One question we will address is the following. If $K$ is the splitting field of a set $S$ of polynomials over $F$, can we determine all of the polynomials in $F[x]$ that split over $K$? Also, can we give a more intrinsic characterization of $K$, one that does not refer to the set $S$? The answer to both questions is yes and is found in Proposition 3.28.

**Definition 3.23** If $K$ is a field extension of $F$, then $K$ is normal over $F$ if $K$ is a splitting field of a set of polynomials over $F$.

**Example 3.24** If $[K : F] = 2$, then $K$ is normal over $F$. For, if $a \in K - F$, then $K = F(a)$, since $[K : F] = 2$. If $p(x) = \min(F,a)$, then $p$ has one root in $K$; hence, since $\deg(p) = 2$, this polynomial factors over $K$. Because $K$ is generated over $F$ by the roots of $p(x)$, we see that $K$ is a splitting field for $p(x)$ over $F$.

**Example 3.25** If $F \subseteq L \subseteq K$ are fields such that $K/F$ is normal, then $K/L$ is normal. This is true because if $K$ is the splitting field over $F$ of a set of polynomials $S \subseteq F[x]$, then $K$ is generated over $F$ by the roots of the polynomials in $S$. Consequently, $K$ is generated by the roots as an extension of $L$, so $K$ is a splitting field of $S$ over $L$, and so $K$ is normal over $L$.

**Example 3.26** The field $\mathbb{Q}(\omega, \sqrt[3]{2})$ is normal over $\mathbb{Q}$, since it is the splitting field of $x^3 - 2$ over $\mathbb{Q}$. Similarly, if $i = \sqrt{-1}$, then $\mathbb{Q}(\sqrt[4]{2}, i)$ is normal over $\mathbb{Q}$, since it is the splitting field of $x^4 - 2$ over $\mathbb{Q}$. The subfield $\mathbb{Q}(i)$ is also normal over $\mathbb{Q}$, as it is the splitting field of $x^2 + 1$ over $\mathbb{Q}$. However, the subfield $\mathbb{Q}(\sqrt[4]{2})$ is not normal over $\mathbb{Q}$. At this point, we do not have an effective way of showing $\mathbb{Q}(\sqrt[4]{2})/\mathbb{Q}$ is not normal, for we would have to show that there is no polynomial $f \in \mathbb{Q}(x)$ whose roots generate $\mathbb{Q}(\sqrt[4]{2})$. It is clear that $\min(\mathbb{Q}, \sqrt[4]{2})$ does not split over $\mathbb{Q}(\sqrt[4]{2})$, which will be enough to show that $\mathbb{Q}(\sqrt[4]{2})$ is not normal over $\mathbb{Q}$ once we prove Proposition 3.28.

**Example 3.27** Let $F$ be a field of characteristic $p > 0$, and suppose that $K = F(a_1, \ldots, a_n)$ with $a_i^p \in F$ for each $i$. Then we show that $K$ is normal over $F$. The minimal polynomial of $a_i$ divides $x^p - a_i^p$, which factors completely over $K$ as $x^p - a_i^p = (x - a_i)^p$; hence, $\min(F, a_i)$ splits over $K$. Thus, $K$ is the splitting field of $\{\min(F, a_i) : 1 \leq i \leq n\}$ over $F$. Note that each $\min(F, a_i)$ has only one distinct root, and any $F$-automorphism of $K$ is determined by its action on the generators $a_1, \ldots, a_n$, so $\mathrm{Gal}(K/F) = \{\mathrm{id}\}$. For instance, if $k(x_1, \ldots, x_n)$ is the rational function field in $n$ variables over a field $k$ of characteristic $p$, then $k(x_1, \ldots, x_n)/k(x_1^p, \ldots, x_n^p)$ is a normal extension.

If $K$ is the splitting field over $F$ of a set of polynomials $S \subseteq F[x]$, then each polynomial in $S$ splits over $K$. However, $K$ can be viewed as a splitting field in other ways, as the following proposition shows.

**Proposition 3.28** If $K$ is algebraic over $F$, then the following statements are equivalent:

1. The field $K$ is normal over $F$.
2. If $M$ is an algebraic closure of $K$ and if $\tau : K \to M$ is an $F$-homomorphism, then $\tau(K) = K$.
3. If $F \subseteq L \subseteq K \subseteq N$ are fields and if $\sigma : L \to N$ is an $F$-homomorphism, then $\sigma(L) \subseteq K$, and there is a $\tau \in \mathrm{Gal}(K/F)$ with $\tau|_L = \sigma$.
4. For any irreducible $f(x) \in F[x]$, if $f$ has a root in $K$, then $f$ splits over $K$.

**Proof.** (1) $\Rightarrow$ (2): Let $M$ be an algebraic closure of $K$, and let $\tau : K \to M$ be an $F$-homomorphism. If $K$ is the splitting field for $S \subseteq F[x]$ over $F$, then so is $\tau(K) \subseteq M$ by Lemma 3.17. Since $K$ and $\tau(K)$ are generated over $F$ by the same set of roots, $K = \tau(K)$.

(2) $\Rightarrow$ (3): Suppose that $F \subseteq L \subseteq K \subseteq N$ are fields and that $\sigma : L \to N$ is an $F$-homomorphism. Since $L \subseteq K$, the extension $L/F$ is algebraic, and so $\sigma(L) \subseteq N$ is algebraic over $F$. Let $M'$ be the algebraic closure of $F$ in $N$ and let $M$ be an algebraic closure of $M'$. Then $M$ is also an algebraic closure of $K$. By the isomorphism extension theorem, there is an extension $\rho : M \to M$ with $\rho|_L = \sigma$. Let $\tau = \rho|_K$. By condition 2 we have $\tau(K) = K$, so $\sigma(L) = \tau(L) \subseteq \tau(K) = K$. Thus, $\tau \in \mathrm{Gal}(K/F)$.

(3) $\Rightarrow$ (4): Let $f(x) \in F[x]$ be irreducible over $F$, and let $\alpha \in K$ be a root of $f$. Let $L = F(\alpha) \subseteq K$ and let $N$ be an algebraic closure of $K$. If $\beta \in N$ is any root of $f$, then there is an $F$-homomorphism $\sigma : L \to N$ given by $g(\alpha) \mapsto g(\beta)$. By condition 3, $\sigma(L) \subseteq K$, so $\beta \in K$. Hence, all roots of $f$ lie in $K$, so $f$ splits over $K$.

(4) $\Rightarrow$ (1): Condition 4 shows that $\min(F,\alpha)$ splits over $K$ for each $\alpha \in K$. Thus, $K$ is the splitting field over $F$ of $\{\min(F,\alpha) : \alpha \in K\}$, so $K$ is normal over $F$.
□

One useful consequence of Proposition 3.28 is that if $K$ is normal over $F$, then $K$ is the splitting field of $\{\min(F,\alpha) : \alpha \in K\}$ by condition 4. This is perhaps the most useful criterion to show that an extension is normal.
