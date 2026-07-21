# 18. Some Infinite Galois Extensions（若干无限 Galois 扩张）

In this section, we describe some examples of infinite Galois extensions. Some of these extensions will arise from group theoretic properties of infinite Galois groups. To discuss some of these extensions, we will require knowledge of profinite groups, information about which can be found in Appendix C, Shatz [25], or Serre [24].

## The separable closure of a field

Let $F$ be a field. Then $F$ is said to be separably closed if there is no proper separable extension of $F$. Let $F_{ac}$ be an algebraic closure of $F$. Then $F_{ac}$ is the splitting field of the set of all nonconstant polynomials in $F[x]$; hence, $F_{ac}$ is a normal extension of $F$. However, if $F$ is not perfect, then $F_{ac}$ is not Galois over $F$. Let $F_s$ be the separable closure of $F$ in $F_{ac}$. The field $F_s$ is called the *separable closure* of $F$. The following description of $F_s$ follows quickly from the properties of normal extensions.

**Proposition 18.1** Let $F_s$ be the separable closure of the field $F$. Then $F_s$ is Galois over $F$ with $\operatorname{Gal}(F_s/F) \cong \operatorname{Gal}(F_{ac}/F)$. Moreover, $F_s$ is a maximal separable extension of $F$, meaning that $F_s$ is not properly contained in any separable extension of $F$. Thus, $F_s$ is separably closed.

**Proof.** The field $F_s$ is Galois over $F$, and $\operatorname{Gal}(F_s/F) = \operatorname{Gal}(F_{ac}/F)$ by Theorem 4.23. Suppose that $F_s \subseteq L$ with $L/F$ separable. Then we can embed $L \subseteq F_{ac}$, and then $L = F_s$, since $F_s$ is the set of all separable elements over $F$ in $F_{ac}$. Finally, if $L$ is a separable extension of $F_s$, then by transitivity of separability, $L$ is a separable extension of $F$, so $L = F_s$. Therefore, $F_s$ is separably closed.
□

The group $\operatorname{Gal}(F_s/F) \cong \operatorname{Gal}(F_{ac}/F)$ is often called the *absolute Galois group* of $F$. If $G$ is the Galois group of a Galois extension of $F$, then $G$ is a homomorphic image of $\operatorname{Gal}(F_s/F)$ by the fundamental theorem.

## The quadratic closure of a field

In the next three sections, we require some knowledge of profinite groups. If $G$ is a profinite group and $p$ is a prime, then $G$ is a *pro-$p$-group* if every open normal subgroup of $G$ has index in $G$ equal to a power of $p$. If $G = \operatorname{Gal}(K/F)$ for a Galois extension $K/F$, then $G$ is a pro-$p$-group if and only if every finite Galois subextension of $K/F$ has degree a power of $p$ over $F$.

Let $F$ be a field of characteristic not 2. Then $F$ is said to be *quadratically closed* if there is no proper quadratic extension of $F$. The *quadratic closure* $F_q$ of $F$ is a subfield of $F_s$ that is quadratically closed and is a Galois extension of $F$ with $\operatorname{Gal}(F_q/F)$ a pro-2-group. The following proposition shows the existence and uniqueness of the quadratic closure of a field.

**Proposition 18.2** Let $F$ be a field with $\operatorname{char}(F) \neq 2$. Then the quadratic closure $F_q$ of $F$ is the composite inside a fixed algebraic closure of $F$ of all Galois extensions of $F$ of degree a power of 2.

**Proof.** Let $K$ be the composite inside a fixed algebraic closure of $F$ of all Galois extensions of $F$ of degree a power of 2. Then $K$ is Galois over $F$. To show that $G = \operatorname{Gal}(K/F)$ is a pro-2-group, let $N$ be an open normal subgroup of $G$. If $L = \mathcal{F}(H)$, then $[L:F] = [G:N]$ by the fundamental theorem. The intermediate field $L$ is a finite extension of $F$; hence, $L$ lies in a composite of finitely many Galois extensions of $F$ of degree a power of 2. Any such composite has degree over $F$ a power of 2 by the theorem of natural irrationalities, so $[L:F]$ is a power of 2. Thus, $[G:N]$ is a power of 2, so $G$ is a pro-2-group.

To see that $K$ is quadratically closed, suppose that $L/K$ is a quadratic extension, and say $L = K(\sqrt{a})$ for some $a \in K$. Then $a \in E$ for some finite Galois subextension $E$. By the argument above, we have $[E:F] = 2^r$ for some $r$. The extension $E(\sqrt{a})/E$ has degree at most 2. If $\sqrt{a} \in E$, then $L = K$ and we are done. If not, consider the polynomial

$$
\prod_{\sigma \in \operatorname{Gal}(E/F)} (x^2 - \sigma(a)) \in F[x].
$$

The splitting field $N$ over $F$ of this polynomial is $N = F(\{\, \sqrt{\sigma(a)} : \sigma \in \operatorname{Gal}(E/F) \,\})$. Hence, $N$ is a 2-Kummer extension of $F$, so $[N:F]$ is a power of 2. The field $N$ is a Galois extension of $F$ of degree a power of 2, so $N \subseteq K$. Moreover, $\sqrt{a} \in N$. This shows that $\sqrt{a} \in K$, so $L = K$. Thus, $K$ is quadratically closed.
□

In the next proposition, we give an alternate description of the quadratic closure of a field $F$ of characteristic not 2.

**Proposition 18.3** Let $F$ be a field of characteristic with $\operatorname{char}(F) \neq 2$. We define fields $\{F_n\}$ by recursion by setting $F_0 = F$ and $F_{n+1} = F_n(\{\, \sqrt{a} : a \in F_n \,\})$. Then the quadratic closure of $F$ is the union $\bigcup_{n=1}^\infty F_n$.

**Proof.** Let $K = \bigcup_{n=1}^\infty F_n$. Then $K$ is a field, since $\{F_n\}$ is a totally ordered collection of fields. We show that $K$ is quadratically closed. If $a \in K$, then $a \in F_n$ for some $n$, so $\sqrt{a} \in F_{n+1} \subseteq K$. Thus, $K(\sqrt{a}) = K$, so $K$ is indeed quadratically closed. Let $F_q$ be the quadratic closure of $F$. Then $\sqrt{a} \in F_q$ for each $a \in F_q$, so we see that $F_1 \subseteq F_q$. Suppose that $F_n \subseteq F_q$. The reasoning we used to show that $K$ is quadratically closed shows also that $F_{n+1} \subseteq F_q$, so $K \subseteq F_q$. To see that this inclusion is an equality, let $E$ be a Galois extension of $F$ of degree a power of 2. Then $EK/K$ has degree a power of 2 by natural irrationalities. If $[EK : K] > 1$, then the group $\operatorname{Gal}(EK/K)$ has a subgroup of index 2 by the theory of $p$-groups. If $L$ is the fixed field of this subgroup, then $[L:K] = 2$. However, this is impossible, since $K$ is quadratically closed. This forces $EK = K$, so $E \subseteq K$. Since $F_q$ is the composite of all such $E$, we see that $F_q \subseteq K$, so $K = F_q$.
□

## The $p$-closure of a field

Let $F$ be a field of characteristic not $p$, where $p$ is some prime. Fix some algebraic closure $F_{ac}$ of $F$. The *$p$-closure* $F_p$ of $F$ is the composite in $F_{ac}$ of all Galois extensions of $F$ of degree a power of $p$. The quadratic closure of $F$ is then just $F_2$. The basic properties of the $p$-closure of a field are given in the following results. The first describes what finite extensions of $F$ lie inside $F_p$.

**Lemma 18.4** Let $p$ be a prime, and let $F$ be a field with $\operatorname{char}(F) \neq p$. If $L$ is an intermediate field of $F_{ac}/F$ with $[L:F] < \infty$, then $L \subseteq F_p$ if and only if $L$ lies in a Galois extension of $F$ of degree a power of $p$. In particular, any finite intermediate field of $F_p/F$ has degree over $F$ a power of $p$.

**Proof.** If $L$ is a field lying inside some Galois extension $E$ of $F$ with $[E:F]$ a power of $p$, then $E \subseteq F_p$, so $L \subseteq F_p$. Conversely, suppose that $L \subseteq F_p$ and $[L:F] < \infty$. Then $L = F(a_1, \ldots, a_n)$ for some $a_i \in L$. From the definition of $F_p$, for each $i$ there is a Galois extension $E_i/F$ such that $a_i \in E_i$ and $[E_i:F]$ is a power of $p$. The composition of the $E_i$ is a Galois extension of $F$, whose degree over $F$ is also a power of $p$ by natural irrationalities.
□

**Proposition 18.5** Let $F_p$ be the $p$-closure of a field $F$ with $\operatorname{char}(F) \neq p$. Then $F_p$ is a Galois extension of $F$ and $\operatorname{Gal}(F_p/F)$ is a pro-$p$-group. Moreover, $F_p$ has no Galois extensions of degree $p$.

**Proof.** The proof that $F_p/F$ is Galois with $\operatorname{Gal}(F_p/F)$ a pro-$p$-group is essentially the same as the proof for the corresponding result about the quadratic closure, so we do not repeat it here. For the final statement, suppose that $L$ is a Galois extension of $F_p$ with $[L : F_p] = p$. We need to obtain a contradiction. The argument we gave for the corresponding result about the quadratic closure will not work, since the composite of field extensions of degree a power of $p$ need not have degree a power of $p$ if $p \neq 2$. Instead, we argue as follows. Say $L = F_p(a)$, and let $a_1, a_2, \ldots, a_p$ be the roots of $\min(F_p, a)$. Since $F_p(a)/F_p$ is Galois, each $a_i \in F_p(a)$. By the construction of $F_p$, for each $i$ we can find a finite Galois extension $E_i/F$ of degree a power of $p$ with $a_i \in E_i(a)$ and $\min(F_p, a) \in E_i$. Taking the composite of all the $E_i$, we obtain a finite Galois extension $E/F$ of degree a power of $p$ with $a_i \in E(a)$ and $\min(F_p, a) \in E$. Therefore, $E(a)/E$ is Galois of degree $p$.

Let $f(x) = \prod_{\sigma \in \operatorname{Gal}(E/F)} \sigma(g(x))$, a polynomial over $F$ with $f(a) = 0$. For each $\sigma$, let $a_\sigma$ be a root of $\sigma(g)$. Let $N$ be the normal closure of $F(a)/F$, so $N$ is the splitting field of $f(x)$ over $F$. The field $NE$ is normal over $F$; hence, by the isomorphism extension theorem, for each $\sigma \in \operatorname{Gal}(E/F)$ there is a $\sigma' \in \operatorname{Gal}(NE/F)$ extending $\sigma$ with $\sigma'(a) = a_\sigma$. The automorphism $\sigma'$ sends $E(a)$ to $E(a_\sigma)$. Since all the roots of $g$ lie in $E(a)$, all the roots of $\sigma(g)$ lie in $E(a_\sigma)$. Thus, for each $\sigma$, the extension $E(a_\sigma)/E$ is Galois and is of degree $p$. However, $NE = E(\{a_\sigma\})$, so $NE$ is a composite over $E$ of Galois extensions of degree $p$; hence, $[NE : E]$ is a power of $p$ by natural irrationalities. Therefore, $[NE : F]$ is a power of $p$, so $a \in F(a) \subseteq NE$ forces $a \in F_p$. This is a contradiction, so $F_p$ has no Galois extension of degree $p$.
□

If $F$ contains a primitive $p$th root of unity, then there is a construction of $F_p$ analogous to that of the quadratic closure of $F$.

**Proposition 18.6** Suppose that $F$ contains a primitive $p$th root of unity. Define a sequence of fields $\{F_n\}$ by recursion by setting $F_0 = F$ and $F_{n+1} = F_n(\{\, \sqrt[p]{a} : a \in F_n \,\})$. Then the $p$-closure of $F$ is $\bigcup_{n=1}^\infty F_n$.

**Proof.** The proof is essentially the same as that for the quadratic closure, so we only outline the proof. If $F_n \subseteq F_p$ and $a \in F_n$, then either $F_n(\sqrt[p]{a}) = F_n$, or $F_n(\sqrt[p]{a})/F_n$ is a Galois extension of degree $p$, by Proposition 9.6. In either case, $F_n(\sqrt[p]{a}) \subseteq F_p$ by the previous proposition. This shows that $\bigcup_{n=1}^\infty F_n \subseteq F_p$. To get the reverse inclusion, let $E/F$ be a Galois extension of degree a power of $p$. By the theory of $p$-groups and the fundamental theorem of Galois theory, there is a chain of intermediate fields

$$
F = E_0 \subseteq E_1 \subseteq \cdots \subseteq E_n = E
$$

with $E_{i+1}/E_i$ Galois of degree $p$. Since $F$ contains a primitive $p$th root of unity, $E_{i+1} = E_i(\sqrt[p]{a_i})$ for some $a_i \in E_i$ by Theorem 9.5. By induction, we can see that $E_i \subseteq F_i$, so $E \subseteq \bigcup_{n=1}^\infty F_n$. Since $F_p$ is the composite of all such $E$, this gives the reverse inclusion we want.
□

## The maximal prime to $p$ extension

Let $G$ be a profinite group, and suppose that $p$ divides $|G|$. Then a $p$-Sylow subgroup of $G$ is a pro-$p$-group $H$ such that $[G:H]$ is prime to $p$. Recall that a profinite group has a $p$-Sylow subgroup for every prime divisor $p$ of $|G|$ and that any two $p$-Sylow subgroups of $G$ are conjugate.

Let $F$ be a perfect field and let $p$ be a prime. If $G = \operatorname{Gal}(F_s/F)$, let $P$ be a $p$-Sylow subgroup of $G$. If $K$ is the fixed field of $P$, then $K$ is called the *maximal prime to $p$ extension* of $F$. The maximal prime to $p$ extension of a field is not uniquely determined. However, since any two $p$-Sylow subgroups of a profinite group are conjugate, any two maximal prime to $p$ extensions of $F$ are $F$-isomorphic. The reason for the terminology above can be found in the following result.

**Proposition 18.7** Let $F$ be a field, let $p$ be a prime, and let $K$ be a maximal prime to $p$ extension of $F$. Then any finite extension of $K$ has degree a power of $p$, and if $L$ is an intermediate field of $K/F$ with $[L:F] < \infty$, then $[L:F]$ is relatively prime to $p$. Moreover, any separable field extension $L$ of $F$ with $[L:F]$ relatively prime to $p$ is contained in some maximal prime to $p$ extension of $F$.

**Proof.** Recall that if $U$ is an open subgroup of a $p$-Sylow subgroup $P$ of $G = \operatorname{Gal}(F_s/F)$, then $[P:U]$ is a power of $p$, and if $V$ is open in $G$ with $P \subseteq V \subseteq G$, then $[G:V]$ is relatively prime to $p$. Suppose that $M$ is a finite extension of $K$. If $H = \operatorname{Gal}(F_s/M)$, then by the fundamental theorem, we have $[P:H] = [M:K] < \infty$, so $H$ is an open subgroup of $P$. Thus, $[P:H]$ is a power of $p$, so $[M:K]$ is a power of $p$.

For the second statement, let $L$ be an intermediate field of $K/F$ with $[L:F] < \infty$. If $A = \operatorname{Gal}(F_s/L)$, then $P \subseteq A$ and $[G:A] = [L:F]$ is finite, by the fundamental theorem. Since $[G:A]$ is relatively prime to $p$, we see that $[L:F]$ is relatively prime to $p$.

Let $L/F$ be an extension with $[L:F]$ relatively prime to $p$. Let $F_s$ be the separable closure of $F$, and let $G = \operatorname{Gal}(F_s/F)$. Set $H = \operatorname{Gal}(F_s/L)$, a closed subgroup of $G$, and let $P'$ be a $p$-Sylow subgroup of $H$. There is a $p$-Sylow subgroup $P$ of $G$ that contains $P'$. Note that $[G:H] = [L:F]$ is relatively prime to $p$. Moreover, we have

$$
\begin{aligned}
{}[G : P'] &= [G : H] \cdot [H : P'] \\
&= [G : P] \cdot [P : P'].
\end{aligned}
$$

Both $[G:H]$ and $[H:P']$ are supernatural numbers not divisible by $p$, so $[P:P']$ is not divisible by $p$. But, since $P$ is a pro-$p$-group, $[P:P']$ is a power of $p$. This forces $[P:P'] = 1$, so $P' = P$. Therefore, $P \subseteq H$, and so $L = \mathcal{F}(H)$ is contained in $\mathcal{F}(P)$, a maximal prime to $p$ extension of $F$.
□

**Example 18.8** The maximal prime to $p$ extension of a field $F$ need not be the composite of all finite extensions of degree relatively prime to $p$. For example, if $F = \mathbb{Q}$ and $p = 3$, then $\mathbb{Q}(\sqrt[3]{5})$ and $\mathbb{Q}(\omega\sqrt[3]{5})$ are both of degree 3 over $\mathbb{Q}$, where $\omega$ is a primitive third root of unity, but their composite is $\mathbb{Q}(\omega, \sqrt[3]{5})$, which has degree 6 over $\mathbb{Q}$. Therefore, these fields are not both contained in a common maximal prime to $p$ extension of $\mathbb{Q}$.

Problem 5 addresses the construction of a maximal prime to $p$ extension when $F$ is not perfect.

## The maximal Abelian extension

Let $F$ be a field, and let $F_s$ be the separable closure of $F$. Let $G = \operatorname{Gal}(F_s/F)$. If $G'$ is the commutator subgroup of $G$, then the fixed field $F_a$ of $G'$ is called the *maximal Abelian extension* of $F$. This name is justified by the following result.

**Proposition 18.9** Let $F_a$ be the maximal Abelian extension of a field $F$. Then $F_a/F$ is a Galois extension and $\operatorname{Gal}(F_a/F)$ is an Abelian group. The field $F_a$ has no extensions that are Abelian Galois extensions of $F$. Moreover, $F_a$ is the composite in $F_s$ of all finite Abelian Galois extensions of $F$.

**Proof.** The commutator subgroup $G'$ of $G$ is a normal subgroup, so the closure $\overline{G'}$ of $G'$ is a closed normal subgroup of $G$ (see Problem 17.8). Thus, by the fundamental theorem, $F_a = \mathcal{F}(\overline{G'})$ is a Galois extension of $F$ and $\operatorname{Gal}(F_a/F) \cong G/\overline{G'}$. The group $G/\overline{G'}$ is a homomorphic image of the Abelian group $G/G'$, so $G/\overline{G'}$ is also Abelian.

If $L \supseteq F_a$ is an Abelian Galois extension of $F$, then $L \subseteq F_s$. Let $H = \operatorname{Gal}(F_s/L)$, a subgroup of $G$. However, $G/H \cong \operatorname{Gal}(L/F)$, so $G/H$ is Abelian. Thus, $G' \subseteq H$, so $H = G'$. Therefore, $F_a$ is not properly contained in any Abelian extension of $F$.

For the final statement, if $K/F$ is finite Abelian Galois, then $KF_a/F_a$ is Abelian Galois by natural irrationalities. Thus, $KF_a = F_a$, so $K \subseteq F_a$. Since every element of $F_a$ lies in a finite Galois extension of $F$, to show that $F_a$ is the composite of all finite Abelian Galois extensions of $F$ it suffices to show that every finite Galois extension of $F$ inside $F_a$ is an Abelian extension. Let $E$ be such an extension. If $H = \operatorname{Gal}(F_s/E)$, then $H$ is a normal subgroup of $G$ containing $G'$; hence, $G/H$ is Abelian. But, by the fundamental theorem, we have $\operatorname{Gal}(E/F) \cong G/H$, so $E/F$ is an Abelian Galois extension.
□

**Example 18.10** The Kronecker–Weber theorem of algebraic number theory states that any Abelian extension of $\mathbb{Q}$ is contained in a cyclotomic extension. Consequently, the maximal Abelian extension of $\mathbb{Q}$ is the infinite cyclotomic extension $\mathbb{Q}(\{\, \omega_n : n \in \mathbb{N} \,\})$.

**Example 18.11** If $F$ is a field containing a primitive $n$th root of unity for all $n$, then the maximal Abelian extension of $F$ is $F(\{\, \sqrt[n]{a} : a \in F, n \in \mathbb{N} \,\})$. This follows from Kummer theory (see Problem 11.6 for part of this claim).
