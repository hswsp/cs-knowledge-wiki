# 19. Transcendence Bases（超越基）

In this chapter, we study field extensions that are not algebraic. In the first two sections, we give the main properties of these extensions. In the remaining sections, we focus on finitely generated extensions. We discuss how these extensions arise in algebraic geometry and how their study can lead to geometric information, and we use algebraic analogs of derivations and differentials to study these extensions.

The most fundamental concept in transcendental field theory is that of a transcendence basis. In this section, we investigate this concept. We shall see that the notion of a transcendence basis is very similar to that of a basis of a vector space. To give a rough description of a transcendence basis, let $K/F$ be a field extension. A subset $T$ of $K$ is a transcendence basis for $K/F$ if $T$ is a maximal set of "variables" in $K$. To be a little less vague, $F(T)$ is isomorphic to a rational function field $F(X)$ with $|T| = |X|$, and the maximality means that there is no larger set of variables in $K$. We need to make this precise, to prove that transcendence bases exist, and to determine their properties.

**Definition 19.1** Let $K$ be a field extension of $F$, and let $t_1,\dots,t_n \in K$. The set $\{t_1,\dots,t_n\}$ is *algebraically independent* over $F$ if $f(t_1,\dots,t_n) \neq 0$ for all nonzero polynomials $f \in F[x_1,\dots,x_n]$. An arbitrary set $S \subseteq K$ is algebraically independent over $F$ if any finite subset of $S$ is algebraically independent over $F$. If a set is not algebraically independent over $F$, then it is said to be *algebraically dependent* over $F$.

**Example 19.2** If $K = F(x_1,\dots,x_n)$ is the field of rational functions over $F$ in $n$ variables, then $\{x_1,\dots,x_n\}$ is algebraically independent over $F$. Moreover, if $r_1,\dots,r_n$ are any positive integers, then $\{x_1^{r_1},\dots,x_n^{r_n}\}$ is also algebraically independent over $F$.

Keeping with the same field extension, let $A = (a_{ij})$ be an $n \times n$ matrix with coefficients in $F$, and let $f_j = \sum_i a_{ij} x_i$. We prove that $\{f_1,\dots,f_n\}$ is algebraically independent over $F$ if and only if $\det A \neq 0$. For simplicity, we write $F[X]$ for $F[x_1,\dots,x_n]$. The matrix $A$ induces a ring homomorphism $A' : F[X] \to F[X]$ that sends $x_i$ to $f_i$. If $\det A \neq 0$, then $A$ has an inverse; say $A^{-1} = (b_{ij})$, and $A^{-1}$ induces the inverse map $(A^{-1})' : F[X] \to F[X]$ to $A'$. Therefore, $A'$ is injective, so $h(f_1,\dots,f_n) \neq 0$ for all nonzero $h$. Thus, $\{f_1,\dots,f_n\}$ is algebraically independent over $F$. Conversely, suppose that $\det A = 0$. Then the columns $C_j$ of $A$ are linearly dependent over $F$; say $\sum_j b_j C_j = 0$ with each $b_j \in F$, and not all of the $b_j$ are zero. A short calculation shows that $\sum_j b_j f_j = 0$; hence, the $f_j$ are algebraically dependent over $F$.

**Example 19.3** By convention, the empty set $\varnothing$ is algebraically independent over any field. The singleton sets $\{e\}$, $\{\pi\}$, and $\{4e^{-1}\}$ are all algebraically independent over $\mathbb{Q}$. The set $\{e, e^2\}$ is not algebraically independent over $\mathbb{Q}$, since $f(e,e^2) = 0$ if $f(x_1,x_2) = x_1^2 - x_2$. It is unknown whether $\{e, \pi\}$ is algebraically independent over $\mathbb{Q}$.

**Example 19.4** Let $F \subseteq K \subseteq L$ be fields, and let $S$ be a subset of $L$. If $S$ is algebraically independent over $F$, then $S$ is also algebraically independent over $K$. This is clear from the definition of algebraic independence. Moreover, if $T$ is any subset of $S$ and if $S$ is algebraically independent over $F$, then $T$ is also algebraically independent over $F$. The converse of the first statement is false in general. Suppose that $K = F(x) = L$. Then $\{x\}$ is algebraically independent over $F$, but $\{x\}$ is algebraically dependent over $K$.

An algebraically independent set of elements behaves the same as a set of variables in a polynomial ring. The following lemma makes this statement precise.

**Lemma 19.5** Let $K$ be a field extension of $F$. If $t_1,\dots,t_n \in K$ are algebraically independent over $F$, then $F[t_1,\dots,t_n]$ and $F[x_1,\dots,x_n]$ are $F$-isomorphic rings, and so $F(t_1,\dots,t_n)$ and $F(x_1,\dots,x_n)$ are $F$-isomorphic fields.

**Proof.** Define $\varphi : F[x_1,\dots,x_n] \to K$ by $\varphi(f(x_1,\dots,x_n)) = f(t_1,\dots,t_n)$. Then $\varphi$ is an $F$-homomorphism of rings. The algebraic independence of the $t_i$ shows that $\varphi$ is injective, and the image of $\varphi$ is $F[t_1,\dots,t_n]$. Therefore, $F[t_1,\dots,t_n]$ and $F[x_1,\dots,x_n]$ are isomorphic. This map induces an $F$-isomorphism of quotient fields, which finishes the proof. □

**Definition 19.6** A field $K$ is *purely transcendental* over a subfield $F$ if $K$ is isomorphic to a field of rational functions over $F$ in some number, finite or infinite, of variables.

If $K = F(t_1,\dots,t_n)$ with $\{t_1,\dots,t_n\}$ algebraically independent, then $K$ is often said to be a *rational extension* of $F$. This terminology is often used in algebraic geometry. We will investigate the geometric significance of rational extensions in Section 22.

We now begin to analyze the definition of algebraic independence.

**Lemma 19.7** Let $K$ be a field extension of $F$, and let $t_1,\dots,t_n \in K$. Then the following statements are equivalent:

1. The set $\{t_1,\dots,t_n\}$ is algebraically independent over $F$.
2. For each $i$, $t_i$ is transcendental over $F(t_1,\dots,t_{i-1},t_{i+1},\dots,t_n)$.
3. For each $i$, $t_i$ is transcendental over $F(t_1,\dots,t_{i-1})$.

**Proof.** (1) $\Rightarrow$ (2): Suppose that there are $a_j \in F(t_1,\dots,t_{i-1},t_{i+1},\dots,t_n)$ such that $a_0 + a_1 t_i + \cdots + a_m t_i^m = 0$. We may write $a_j = b_j/c$ with $b_0,\dots,b_m, c \in F[t_1,\dots,t_{i-1},t_{i+1},\dots,t_n]$, and so $b_0 + b_1 t_i + \cdots + b_m t_i^m = 0$. If $b_j = g_j(t_1,\dots,t_{i-1},t_{i+1},\dots,t_n)$, then $f = \sum_j g_j(x_1,\dots,x_{i-1},x_{i+1},\dots,x_n) x_i^j$ is a polynomial and $f(t_1,\dots,t_n) = 0$. Since $\{t_1,\dots,t_n\}$ is algebraically independent over $F$, the polynomial $f$ must be $0$. Consequently, each $a_j = 0$, so $t_i$ is transcendental over $F(t_1,\dots,t_{i-1},t_{i+1},\dots,t_n)$.

(2) $\Rightarrow$ (3): If $t_i$ is transcendental over $F(t_1,\dots,t_{i-1},t_{i+1},\dots,t_n)$, then $t_i$ clearly is transcendental over the smaller field $F(t_1,\dots,t_{i-1})$.

(3) $\Rightarrow$ (1): Suppose that the $t_i$ are not algebraically independent over $F$. Choose $m$ minimal such that there is a nonzero $f(x_1,\dots,x_m) \in F[x_1,\dots,x_m]$ with $f(t_1,\dots,t_m) = 0$. Say $f = \sum_j g_j x_m^j$ with $g_j \in F[x_1,\dots,x_{m-1}]$, and let $a_j = g_j(t_1,\dots,t_{m-1})$. Then $a_0 + a_1 t_m + \cdots + a_r t_m^r = 0$. If the $a_j$ are not all zero, then $t_m$ is algebraic over $F(t_1,\dots,t_{m-1})$, a contradiction. Thus, $a_j = 0$ for each $j$. By the minimality of $m$, the $t_1,\dots,t_{m-1}$ are algebraically independent over $F$, which implies that all $g_j = 0$, so $f = 0$. This proves that $\{t_1,\dots,t_n\}$ is algebraically independent over $F$. □

**Definition 19.8** If $K$ is a field extension of $F$, a subset $S$ of $K$ is a *transcendence basis* for $K/F$ if $S$ is algebraically independent over $F$ and if $K$ is algebraic over $F(S)$.

**Example 19.9** If $K/F$ is a field extension, then $\varnothing$ is a transcendence basis for $K/F$ if and only if $K/F$ is algebraic.

**Example 19.10** If $K = F(x_1,\dots,x_n)$, then $\{x_1,\dots,x_n\}$ is a transcendence basis for $K/F$. Moreover, if $r_1,\dots,r_n$ are positive integers, then we show that $\{x_1^{r_1},\dots,x_n^{r_n}\}$ is also a transcendence basis for $K/F$. We saw in Example 19.2 that $\{x_1^{r_1},\dots,x_n^{r_n}\}$ is algebraically independent over $F$. We need to show that $K$ is algebraic over $L = F(x_1^{r_1},\dots,x_n^{r_n})$. This is true because for each $i$ the element $x_i$ satisfies the polynomial $t^{r_i} - x_i^{r_i} \in L[t]$.

Here is a natural question that one may have about the definition of transcendence basis: Why is the condition "$K$ is algebraic over $F(S)$" used instead of "$K = F(S)$"? We give two reasons. The previous example shows that even when $K = F(X)$ for some algebraically independent set $X$ over $F$, there may be other algebraically independent sets $Y$ for which $K$ is algebraic over $F(Y)$ but that $K \neq F(Y)$. Moreover, it is a very restrictive condition to require that a field be purely transcendental over a subfield. Without the definition as it is given, existence of a transcendence basis would be uncommon, and the concept would not be very useful.

The next two examples deal with field extensions of the sort that arise in algebraic geometry. We will study extensions of this type in Section 22.

**Example 19.11** Let $k$ be a field, and let $f(x,y) = y^2 - x^3 + x \in k[x,y]$. Then $f$ is an irreducible polynomial, so $A = k[x,y]/(f)$ is an integral domain. Note that $A$ contains an isomorphic copy of $k$. Let $K$ be the quotient field of $k[x,y]/(f)$. We can then view $K$ as a field extension of $k$. If $u = x + (f)$ and $v = y + (f)$ are the images of $x, y$ in $K$, then $K = k(u,v)$. We show that $\{u\}$ is a transcendence basis for $K/k$. Since $v^2 = u^3 - u$, the field $K$ is algebraic over $k(u)$. We then need to show that $u$ is transcendental over $k$. If this is false, then $u$ is algebraic over $k$, so $K$ is algebraic over $k$. We claim that this forces $A = k[u,v]$ to be a field. To prove this, take $t \in A$. Then $t^{-1} \in K$ is algebraic over $k$, so $t^{-n} + \alpha_{n-1} t^{-(n-1)} + \cdots + \alpha_0 = 0$ for some $\alpha_i \in k$ with $\alpha_0 \neq 0$. Multiplying by $t^{n-1}$ gives
$$
t^{-1} = -(\alpha_{n-1} + \alpha_{n-2} t + \cdots + \alpha_0 t^{n-1}) \in A,
$$
proving that $A$ is a field. However, $A = k[x,y]/(f)$ is a field if and only if $(f)$ is a maximal ideal of $k[x,y]$. The ring $A$ cannot be a field, since $(f)$ is properly contained in the ideal $(x,y)$ of $k[x,y]$. Thus, $u$ is not algebraic over $k$, so $\{u\}$ is a transcendence basis for $K/k$. Note that a similar argument would show that $\{v\}$ is also a transcendence basis for $K/k$.

**Example 19.12** We give a generalization of the previous example. Let $k$ be a field and let $f \in k[x_1,\dots,x_n]$ be an irreducible polynomial. Then $A = k[x_1,\dots,x_n]/(f)$ is an integral domain. Let $K$ be the quotient field of $A$. We may write
$$
f = g_m x_n^m + g_{m-1} x_n^{m-1} + \cdots + g_0
$$
with each $g_i \in k[x_1,\dots,x_{n-1}]$. Let us assume that $m > 0$, so that $f$ does involve the variable $x_n$. If $t_i = x_i + (f)$ is the image of $x_i$ in $A$, we claim that $\{t_1,\dots,t_{n-1}\}$ is a transcendence basis for $K/k$. To see this, the equation for $f$ above shows that $t_n$ is algebraic over $k(t_1,\dots,t_{n-1})$, so we only need to show that $\{t_1,\dots,t_{n-1}\}$ is algebraically independent over $k$. Suppose that there is a polynomial $h \in k[x_1,\dots,x_{n-1}]$ with $h(t_1,\dots,t_{n-1}) = 0$. Then $h(x_1,\dots,x_{n-1}) \in (f)$, so $f$ divides $h$. Thus, $h = f g$ for some $g \in k[x_1,\dots,x_n]$. However, the polynomial $h$ does not involve the variable $x_n$ while $f$ does, so comparing degrees in $x_n$ of $h$ and $fg$ shows that $h = 0$. Therefore, $\{t_1,\dots,t_{n-1}\}$ is algebraically independent over $k$, so $\{t_1,\dots,t_{n-1}\}$ is a transcendence basis for $K/k$.

The argument we gave for why $\{t_1,\dots,t_{n-1}\}$ is algebraically independent over $k$ is different from the argument used in the previous example to show $u$ is transcendental over $k$. We could have used the argument of this example in the previous example, but we chose to give a different argument to illustrate different methods that can be used in dealing with transcendental extensions.

There is a strong connection between the concepts of linear independence in vector spaces and algebraic independence in fields. In particular, we will prove below that every field extension has a transcendental basis and that the size of a transcendence basis is uniquely determined. The reader would benefit by recalling how the corresponding facts are proved for vector spaces.

**Lemma 19.13** Let $K$ be a field extension of $F$, and let $S \subseteq K$ be algebraically independent over $F$. If $t \in K$ is transcendental over $F(S)$, then $S \cup \{t\}$ is algebraically independent over $F$.

**Proof.** Suppose that the lemma is false. Then there is a nonzero polynomial $f \in F[x_1,\dots,x_n,y]$ with $f(s_1,\dots,s_n,t) = 0$ for some $s_i \in S$. This polynomial must involve $y$, since $S$ is algebraically independent over $F$. Write $f = \sum_{j=0}^m g_j y^j$ with $g_j \in F[x_1,\dots,x_n]$. Since $g_m \neq 0$, the element $t$ is algebraic over $F(S)$, a contradiction. Thus, $S \cup \{t\}$ is algebraically independent over $F$. □

We now prove the existence of a transcendence basis for any field extension.

**Theorem 19.14** Let $K$ be a field extension of $F$.

1. There exists a transcendence basis for $K/F$.
2. If $T \subseteq K$ such that $K/F(T)$ is algebraic, then $T$ contains a transcendence basis for $K/F$.
3. If $S \subseteq K$ is algebraically independent over $F$, then $S$ is contained in a transcendence basis of $K/F$.
4. If $S \subseteq T \subseteq K$ such that $S$ is algebraically independent over $F$ and $K/F(T)$ is algebraic, then there is a transcendence basis $X$ for $K/F$ with $S \subseteq X \subseteq T$.

**Proof.** We first mention why statement 4 implies the first three statements. If statement 4 is true, then statements 2 and 3 are true by setting $S = \varnothing$ and $T = K$, respectively. Statement 1 follows from statement 4 by setting $S = \varnothing$ and $T = K$. To prove statement 4, let $\mathcal{S}$ be the set of all algebraically independent subsets of $T$ that contain $S$. Then $\mathcal{S}$ is nonempty, since $S \in \mathcal{S}$. Ordering $\mathcal{S}$ by inclusion, a Zorn's lemma argument shows that $\mathcal{S}$ contains a maximal element $M$. If $K$ is not algebraic over $F(M)$, then $F(T)$ is not algebraic over $F(M)$, since $K$ is algebraic over $F(T)$. Thus, there is a $t \in T$ with $t$ transcendental over $F(M)$. But by Lemma 19.13, $M \cup \{t\}$ is algebraically independent over $F$ and is a subset of $T$, contradicting maximality of $M$. Thus, $K$ is algebraic over $F(M)$, so $M$ is a transcendence basis of $K/F$ contained in $T$. □

We now show that any two transcendence bases have the same size.

**Theorem 19.15** Let $K$ be a field extension of $F$. If $S$ and $T$ are transcendence bases for $K/F$, then $|S| = |T|$.

**Proof.** We first prove this in the case where $S = \{s_1,\dots,s_n\}$ is finite. Since $S$ is a transcendence basis for $K/F$, the field $K$ is not algebraic over $F(S - \{s_1\})$. As $K$ is algebraic over $F(T)$, some $t \in T$ must be transcendental over $F(S - \{s_1\})$. Hence, by Lemma 19.13, $\{s_2,\dots,s_n,t\}$ is algebraically independent over $F$. Furthermore, $s_1$ is algebraic over $F(s_2,\dots,s_n,t)$, or else $\{s_1,\dots,s_n,t\}$ is algebraically independent, which is false. Thus, $\{s_2,\dots,s_n,t\}$ is a transcendence basis for $K/F$. Set $t_1 = t$. Assuming we have found $t_i \in T$ for all $i$ with $1 \leq i < m \leq n$ such that $\{t_1,\dots,t_{m-1},s_m,\dots,s_n\}$ is a transcendence basis for $K/F$, by replacing $S$ by this set, the argument above shows that there is a $t' \in T$ such that $\{t_1,\dots,t_{m-1},t',\dots,s_n\}$ is a transcendence basis for $K/F$. Setting $t_m = t'$ and continuing in this way, we get a transcendence basis $\{t_1,\dots,t_n\} \subseteq T$ of $K/F$. Since $T$ is a transcendence basis for $K/F$, we see that $\{t_1,\dots,t_n\} = T$, so $|T| = n$.

For the general case, by the previous argument we may suppose that $S$ and $T$ are both infinite. Each $t \in T$ is algebraic over $F(S)$; hence, there is a finite subset $S_t \subseteq S$ with $t$ algebraic over $F(S_t)$. If $S' = \bigcup_{t\in T} S_t$, then each $t \in T$ is algebraic over $F(S')$. Since $K$ is algebraic over $F(T)$, we see that $K$ is algebraic over $F(S')$. Thus, $S = S'$ since $S' \subseteq S$ and $S$ is a transcendence basis for $K/F$. We then have
$$
|S| = |S'| = \left|\bigcup_{t\in T} S_t\right| \leq |T \times \mathbb{N}| = |T|,
$$
where the last equality is true since $T$ is infinite. Reversing the argument, we see that $|T| \leq |S|$, so $|S| = |T|$. □

This theorem shows that the size of a transcendence basis for $K/F$ is unique. The following definition is then well defined.

**Definition 19.16** The *transcendence degree* $\mathrm{trdeg}(K/F)$ of a field extension $K/F$ is the cardinality of any transcendence basis of $K/F$.

**Corollary 19.17** Let $t_1,\dots,t_n \in K$. Then the fields $F(t_1,\dots,t_n)$ and $F(x_1,\dots,x_n)$ are $F$-isomorphic if and only if $\{t_1,\dots,t_n\}$ is an algebraically independent set over $F$.

**Proof.** If $\{t_1,\dots,t_n\}$ is algebraically independent over $F$, then $F(t_1,\dots,t_n)$ and $F(x_1,\dots,x_n)$ are $F$-isomorphic fields by Lemma 19.5. Conversely, if $F(t_1,\dots,t_n) \cong F(x_1,\dots,x_n)$, suppose that $\{t_1,\dots,t_n\}$ is algebraically dependent over $F$. By the previous theorem, there is a subset $S$ of $\{t_1,\dots,t_n\}$ such that $S$ is a transcendence basis for $F(t_1,\dots,t_n)/F$. However, the transcendence degree of this extension is $n$, which forces $|S| = n$, so $S = \{t_1,\dots,t_n\}$. Thus, $\{t_1,\dots,t_n\}$ is algebraically independent over $F$. □

We now prove the main arithmetic fact about transcendence degrees, the following transitivity result.

**Proposition 19.18** Let $F \subseteq L \subseteq K$ be fields. Then
$$
\mathrm{trdeg}(K/F) = \mathrm{trdeg}(K/L) + \mathrm{trdeg}(L/F).
$$

**Proof.** Let $S$ be a transcendence basis for $L/F$, and let $T$ be a transcendence basis for $K/L$. We show that $S \cup T$ is a transcendence basis for $K/F$, which will prove the result because $S \cap T = \varnothing$. Since $T$ is algebraically independent over $L$, the set $T$ is also algebraically independent over $F(S) \subseteq L$, so $S \cup T$ is algebraically independent over $F$. To show that $K$ is algebraic over $F(S\cup T)$, we know that $K/L(T)$ and $L/F(S)$ are algebraic. Therefore, $L(T)$ is algebraic over $F(S\cup T) = F(S)(T)$, since each $t \in T$ is algebraic over $F(S\cup T)$. Thus, by transitivity, $K$ is algebraic over $F(S\cup T)$, so $S\cup T$ is a transcendence basis for $K/F$. This proves the proposition. □

**Example 19.19** Let $K = k(x_1,\dots,x_n)$ be the field of rational functions in $n$ variables over a field $k$, and let $F = k(s_1,\dots,s_n)$ be the subfield of $K$ generated over $k$ by the elementary symmetric functions $s_1,\dots,s_n$. In Example 3.9, we saw that $K$ is an algebraic extension of $F$ with $[K:F] = n!$. Therefore, $\{s_1,\dots,s_n\}$ contains a transcendence basis of $K/k$. However, $\{x_1,\dots,x_n\}$ is a transcendence basis for $K/k$, so $\mathrm{trdeg}(K/k) = n$. This forces the $s_i$ to be algebraically independent over $k$; hence, they form a transcendence basis for $K/k$. In particular, this shows that $k(s_1,\dots,s_n) \cong k(x_1,\dots,x_n)$.

**Example 19.20** Consider the field extension $\mathbb{C}/\mathbb{Q}$. Since $\mathbb{Q}$ is countable and $\mathbb{C}$ is uncountable, the transcendence degree of $\mathbb{C}/\mathbb{Q}$ must be infinite (in fact, uncountable), for if $t_1,\dots,t_n$ form a transcendence basis for $\mathbb{C}/\mathbb{Q}$, then $\mathbb{C}$ is algebraic over $\mathbb{Q}(t_1,\dots,t_n)$, so $\mathbb{C}$ and $\mathbb{Q}$ have the same cardinality, since they are infinite fields. However, one can show that $\mathbb{Q}(t_1,\dots,t_n)$ is countable. This would give a contradiction to the uncountability of $\mathbb{C}$. Thus, any transcendence basis $T$ of $\mathbb{C}/\mathbb{Q}$ is infinite.

Let $T$ be any transcendence basis of $\mathbb{C}/\mathbb{Q}$. Since $\mathbb{C}$ is algebraic over $\mathbb{Q}(T)$ and is algebraically closed, $\mathbb{C}$ is an algebraic closure of $\mathbb{Q}(T)$. Let $\sigma$ be a permutation of $T$. Then $\sigma$ induces an automorphism of $\mathbb{Q}(T)$ that is trivial on $\mathbb{Q}$; hence, $\sigma$ extends to an automorphism of $\mathbb{C}$ by the isomorphism extension theorem. Since there are infinitely many such $\sigma$, we see that $|\operatorname{Aut}(\mathbb{C})| = \infty$. Because any automorphism of $\mathbb{R}$ is the identity, the only automorphisms of $\mathbb{C}$ that map $\mathbb{R}$ to $\mathbb{R}$ are the identity map and complex conjugation. Thus, there are infinitely many $\sigma \in \operatorname{Aut}(\mathbb{C})$ with $\sigma(\mathbb{R}) \not\subseteq \mathbb{R}$. We can easily show that $[\mathbb{C} : \sigma(\mathbb{R})] = 2$. This means that there are infinitely many subfields $F$ of $\mathbb{C}$ with $[\mathbb{C} : F] = 2$. It is a whole different question to try to construct such fields. Note that in order to get these automorphisms of $\mathbb{C}$, we invoked Zorn's lemma twice, once for the existence of a transcendence basis of $\mathbb{C}/\mathbb{Q}$ and the second time indirectly by using the isomorphism extension theorem.
