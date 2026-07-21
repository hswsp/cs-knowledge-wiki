# 10. Hilbert Theorem 90 and Group Cohomology（Hilbert 定理 90 与群上同调）

In this section, we change gears. Instead of investigating Galois extensions with certain types of Galois groups, we investigate some deep ideas that arise in classical treatments of cyclic Galois extensions. Cohomology, first introduced in algebraic topology, is a valuable tool in many areas of algebra, including group theory, the theory of algebras, and algebraic geometry. We introduce the notions of group cohomology here, we give a couple of applications of the theory, and we relate it to cyclic extensions. To start with, we prove the so-called Hilbert theorem 90, which can be used to prove Lemma 9.4, the key step in characterizing cyclic extensions.

In order to prove the Hilbert theorem 90, we define a concept that we will see again when we formally define group cohomology. Let $K$ be a field, and let $G$ be a subgroup of $\operatorname{Aut}(K)$. A *crossed homomorphism* $f : G \to K^*$ is a function that satisfies $f(\sigma\tau) = f(\sigma) \cdot \sigma(f(\tau))$ for all $\sigma,\tau \in G$.

**Proposition 10.1** Let $K$ be a Galois extension of $F$ with Galois group $G$, and let $f : G \to K^*$ be a crossed homomorphism. Then there is an $a \in K$ with $f(\tau) = \tau(a)/a$ for all $\tau \in G$.

**Proof.** The Dedekind independence lemma shows that $\sum_{\sigma\in G} f(\sigma)\sigma(c) \ne 0$ for some $c \in K$, since each $f(\sigma) \ne 0$. Let $b = \sum_{\sigma\in G} f(\sigma)\sigma(c)$. Then

$$
\begin{aligned}
\tau(b) &= \sum_{\sigma\in G} \tau(f(\sigma))(\tau\sigma)(c), \quad\text{so} \\[4pt]
f(\tau)\tau(b) &= \sum_{\sigma\in G} f(\tau)\tau(f(\sigma)) \cdot (\tau\sigma)(c) \\
&= \sum_{\sigma\in G} f(\tau\sigma)\cdot (\tau\sigma)(c) = b.
\end{aligned}
$$

Thus, $f(\tau) = b/\tau(b)$. Setting $a = b^{-1}$ proves the result. $\square$

**Theorem 10.2 (Hilbert Theorem 90)** Let $K/F$ be a cyclic Galois extension, and let $\sigma$ be a generator of $\operatorname{Gal}(K/F)$. If $u \in K$, then $N_{K/F}(u) = 1$ if and only if $u = \sigma(a)/a$ for some $a \in K$.

**Proof.** One direction is easy. If $u = \sigma(a)/a$, then $N_{K/F}(\sigma(a)) = N_{K/F}(a)$, so $N(u) = 1$. Conversely, if $N_{K/F}(u) = 1$, then define $f : G \to K^*$ by $f(\operatorname{id}) = 1$, $f(\sigma) = u$, and $f(\sigma^i) = u\sigma(u)\cdots\sigma^{i-1}(u)$ for $i < n$. To show that $f$ is a crossed homomorphism, let $0 \le i,j < n$. If $i+j < n$, then

$$
\begin{aligned}
f(\sigma^i\sigma^j) = f(\sigma^{i+j}) &= u\sigma(u)\cdots\sigma^{i+j-1}(u) \\
&= \bigl(u\sigma(u)\cdots\sigma^{i-1}(u)\bigr) \cdot \sigma^i\bigl(u\sigma(u)\cdots\sigma^{j-1}(u)\bigr) \\
&= f(\sigma^i)\cdot \sigma^i(f(\sigma^j)).
\end{aligned}
$$

If $i+j \ge n$, then $0 \le i+j-n < n$, so

$$
f(\sigma^i\sigma^j) = f(\sigma^{i+j}) = f(\sigma^{i+j-n}) = u\sigma(u)\cdots\sigma^{i+j-n-1}(u).
$$

However,

$$
\begin{aligned}
f(\sigma^i)\sigma^i(f(\sigma^j)) &= \bigl(u\sigma(u)\cdots\sigma^{i-1}(u)\bigr) \cdot \sigma^i\bigl(u\sigma(u)\cdots\sigma^{j-1}(u)\bigr) \\
&= \bigl(u\sigma(u)\cdots\sigma^{i+j-n-1}(u)\bigr) \cdot \sigma^{i+j-n}\bigl(u\sigma(u)\cdots\sigma^{n-1}(u)\bigr) \\
&= f(\sigma^i\sigma^j)\cdot N_{K/F}(u) \\
&= f(\sigma^i\sigma^j).
\end{aligned}
$$

Therefore, $f$ is a crossed homomorphism. By Proposition 10.1, there is an $a \in K$ with $f(\sigma^i) = \sigma^i(a)/a$ for all $i$. Thus, $u = f(\sigma) = \sigma(a)/a$. $\square$

Lemma 9.4 follows quickly from the Hilbert theorem 90. If $K/F$ is a cyclic extension of degree $n$, if $\sigma$ is a generator of $\operatorname{Gal}(K/F)$, and if $F$ contains a primitive $n$th root of unity $\omega$, then $N_{K/F}(\omega) = \omega^n = 1$. Therefore, $\omega = \sigma(a)/a$ for some $a \in K$. This gives an alternative proof of Lemma 9.4, the proof most commonly seen in Galois theory texts.

We can mimic the arguments above to get results about the trace. However, before we do so, we introduce group cohomology. Given a group $G$ and an Abelian group $M$ with some extra structure to be described shortly, we will obtain a sequence of cohomology groups $H^n(G,M)$, one for each nonnegative integer.

Let $G$ be a group, and let $M$ be an Abelian group. We say that $M$ is a *$G$-module* if there is a function $G \times M \to M$, where the image of $(\sigma,m)$ is written $\sigma m$, such that

$$
\begin{aligned}
1m &= m, \\
\sigma(\tau m) &= (\sigma\tau)m, \\
\sigma(m_1+m_2) &= \sigma m_1 + \sigma m_2
\end{aligned}
$$

for all $m,m_1,m_2 \in M$ and all $\sigma,\tau \in G$. This is equivalent to the condition that $M$ is a left module over the group ring $\mathbb{Z}[G]$. For example, if $K$ is a Galois extension of a field $F$ and $G = \operatorname{Gal}(K/F)$, then $K^*$ is a $G$-module by defining $\sigma a = \sigma(a)$. Similarly, the additive group $(K,+)$ is a $G$-module.

Suppose that $M$ is a $G$-module. Let $C^n(G,M)$ be the set of all functions from the Cartesian product $G \times G \times \cdots \times G$ ($n$ times) to $M$. The elements of $C^n(G,M)$ are called *$n$-cochains*. If $n = 0$, we define $C^0(G,M) = M$. The set $C^n(G,M)$ can be made into a group by adding functions componentwise; that is, if $f,g \in C^n(G,M)$, define $f+g$ by

$$
(f+g)(\sigma_1,\dots,\sigma_n) = f(\sigma_1,\dots,\sigma_n) + g(\sigma_1,\dots,\sigma_n).
$$

One can easily check that with this operation $C^n(G,M)$ is an Abelian group. Note that $C^n(G,M) = \operatorname{hom}_{\mathbb{Z}}(\mathbb{Z}[G^n],M)$, which is another way to see that $C^n(G,M)$ is an Abelian group.

Define a map $\delta_n : C^n(G,M) \to C^{n+1}(G,M)$ by

$$
\begin{aligned}
\delta_n(f)(\sigma_1,\dots,\sigma_{n+1}) &= \sigma_1 f(\sigma_2,\dots,\sigma_{n+1}) \\
&\quad + \sum_{i=1}^n (-1)^i f(\sigma_1,\dots,\sigma_i\sigma_{i+1},\dots,\sigma_{n+1}) \\
&\quad + (-1)^{n+1} f(\sigma_1,\dots,\sigma_n).
\end{aligned}
$$

If $n = 0$, then the map $\delta_0 : M = C^0(G,M) \to C^1(G,M)$ is defined by $\delta_0(m)(\sigma) = \sigma m - m$. This definition is compatible with the general formula above. A straightforward but tedious calculation shows that $\delta_n$ is a homomorphism and that $\delta_{n+1}\circ\delta_n$ is the zero map (see Problems 1 and 2). The maps $\delta_n$ are called *boundary maps*.

Let $Z^n(G,M) = \ker(\delta_n)$. The elements of $Z^n(G,M)$ are called *$n$-cocycles*. Since $\delta_n(\delta_{n-1}(f)) = 0$ for all $f \in C^{n-1}(G,M)$, the image of $\delta_{n-1}$ is contained in $\ker(\delta_n)$. Let $B^n(G,M) = \operatorname{im}(\delta_{n-1})$ if $n > 0$. For $n = 0$, let $B^0(G,M) = 0$. The elements of $B^n(G,M)$ are called *$n$-coboundaries*. Finally, the $n$th *cohomology group* $H^n(G,M)$ of $G$ with coefficients in $M$ is defined by

$$
H^n(G,M) = Z^n(G,M)/B^n(G,M).
$$

Two cocycles in $Z^n(G,M)$ are said to be *cohomologous* if they represent the same element in $H^n(G,M)$; that is, if they differ by a coboundary.

Let us look at the cohomology groups for small $n$. The kernel of $\delta_0$ consists of all $m \in M$ with $\sigma m = m$ for all $\sigma \in G$. Therefore,

$$
H^0(G,M) = M^G = \{m \in M : \sigma m = m \text{ for all } \sigma \in G\}.
$$

If $n = 1$, then $f : G \to M$ is a 1-cocycle if $\delta_1(f) = 0$. This happens when $\sigma f(\tau) - f(\sigma\tau) + f(\sigma) = 0$ for all $\sigma,\tau \in G$. In other words, a 1-cocycle is a crossed homomorphism as defined above, at least when $M$ is the multiplicative group of a field. If $g$ is a 1-coboundary, then there is an $m \in M$ with $g(\sigma) = \sigma m - m$ for all $\sigma \in G$. Proposition 10.1 implies that if $G = \operatorname{Gal}(K/F)$, then any 1-cocycle from $G$ to $K^*$ is a 1-coboundary. In other words, $H^1(G,K^*) = 0$. This result is often referred to as the cohomological Hilbert theorem 90. It is also true that $H^1(G,K) = 0$, as we now prove.

**Proposition 10.3** Let $K/F$ be a Galois extension with Galois group $G$, and let $g : G \to K$ be a 1-cocycle. Then there is an $a \in K$ with $g(\tau) = \tau(a) - a$ for all $\tau \in G$.

**Proof.** Since $K/F$ is separable, the trace map $T_{K/F}$ is not the zero map. Thus, there is a $c \in K$ with $T_{K/F}(c) \ne 0$. If $\alpha = T_{K/F}(c)$, then $\alpha \in F^*$ and $T_{K/F}(\alpha^{-1}c) = 1$. By replacing $c$ with $\alpha^{-1}c$, we may assume that $T_{K/F}(c) = 1$. Recall that $T_{K/F}(x) = \sum_{\sigma\in G}\sigma(x)$ for all $x \in K$. Let $b = \sum_{\sigma\in G} g(\sigma)\sigma(c)$. Then $\tau(b) = \sum_{\sigma\in G} \tau(g(\sigma))(\tau\sigma)(c)$. Since $g(\tau\sigma) = g(\tau) + \tau(g(\sigma))$,

$$
\begin{aligned}
\tau(b) &= \sum_{\sigma\in G} \bigl(g(\tau\sigma) - g(\tau)\bigr)(\tau\sigma)(c) \\
&= \sum_{\sigma\in G} g(\tau\sigma)(\tau\sigma)(c) - \sum_{\sigma\in G} g(\tau)(\tau\sigma)(c) \\
&= b - g(\tau)\cdot \tau\!\left(\sum_{\sigma\in G}\sigma(c)\right) \\
&= b - g(\tau).
\end{aligned}
$$

Therefore, $g(\tau) = b - \tau(b)$. Setting $a = -b$ gives $g(\tau) = \tau(a) - a$ for all $\tau \in G$. $\square$

We record our two results about $H^1$ in the following corollary.

**Corollary 10.4 (Cohomological Hilbert Theorem 90)** Let $K$ be a Galois extension of $F$ with Galois group $G$. Then $H^1(G,K^*) = 0$ and $H^1(G,K) = 0$.

The triviality of $H^1(G,K)$ can be used to give information about the trace map of a cyclic extension and to give an alternative proof of Theorem 9.8, the proof that is typically seen in texts. We now obtain the analog of the Hilbert theorem 90 for the trace map.

**Theorem 10.5 (Additive Hilbert Theorem 90)** Let $K$ be a cyclic Galois extension of $F$, and let $\sigma$ be a generator of $\operatorname{Gal}(K/F)$. If $u \in K$, then $T_{K/F}(u) = 0$ if and only if $u = \sigma(a) - a$ for some $a \in K$.

**Proof.** If $u = \sigma(a) - a$, then $T_{K/F}(u) = 0$. Conversely, suppose that $T_{K/F}(u) = 0$. Let $n = [K:F]$, and define $g : G \to K$ by $g(\operatorname{id}) = 0$, $g(\sigma) = u$, and for $i < n$ by

$$
g(\sigma^i) = u + \sigma(u) + \cdots + \sigma^{i-1}(u).
$$

If $0 \le i,j < n$, then as $0 = T_{K/F}(u) = \sum_{t=0}^{n-1}\sigma^t(u)$, we see that regardless of whether $i+j < n$ or $i+j \ge n$, we have

$$
\begin{aligned}
g(\sigma^i\sigma^j) &= u + \sigma(u) + \cdots + \sigma^{i+j-1}(u) \\
&= \bigl(u + \sigma(u) + \cdots + \sigma^{i-1}(u)\bigr) + \sigma^i\bigl(u + \sigma(u) + \cdots + \sigma^{j-1}(u)\bigr) \\
&= g(\sigma^i) + \sigma^i(g(\sigma^j)).
\end{aligned}
$$

Therefore, $g$ is a cocycle. By Proposition 10.3, there is an $a \in K$ with $g(\sigma^i) = \sigma^i(a) - a$ for all $i$. Hence, $u = g(\sigma) = \sigma(a) - a$. $\square$

The usual argument for Theorem 9.8 goes as follows. If $K/F$ is a cyclic extension of degree $p$ with $\operatorname{char}(F) = p$, then $T_{K/F}(1) = p\cdot 1 = 0$, so by the additive Hilbert theorem 90, $1 = \sigma(a) - a$ for some $a \in K$. It is then easy to see that $a$ is a root of $x^p - x - c$ for some $c \in F$ and that $K = F(a)$.

## Group extensions

Second cohomology groups have some important applications. In what follows, we will discuss applications to group theory and to the theory of division algebras. Before doing so, we write out the formulas that determine when a 2-cochain is a 2-cocycle or a 2-coboundary. Let $G$ be a group, and let $M$ be a $G$-module. A function $f : G \times G \to M$ is a 2-cocycle if for each $\sigma,\tau,\rho \in G$, we have

$$
f(\sigma,\tau)f(\sigma\tau,\rho) = \sigma f(\tau,\rho)f(\sigma,\tau\rho).
$$

We will refer to this equation as the *cocycle condition*. On the other hand, if there are $m_\sigma \in M$ with

$$
f(\sigma,\tau) = m_\sigma + \sigma m_\tau - m_{\sigma\tau}
$$

for each $\sigma,\tau \in G$, then $f$ is a 2-coboundary.

The first application of second cohomology groups we give is to group extensions. We point out that a number of statements in the remainder of this section will be left as exercises. Suppose that $E$ is a group that contains an Abelian normal subgroup $M$, and let $G = E/M$. We then say that $E$ is a *group extension* of $G$ by $M$. The basic problem is this: Given groups $G$ and $M$, describe all groups $E$ that, up to isomorphism, contain $M$ as a normal subgroup and have $E/M \cong G$. As we shall see, if $M$ is Abelian, then $H^2(G,M)$ classifies group extensions of $G$ by $M$.

**Example 10.6** Let $E = S_3$. If $M = \langle (123)\rangle$, then $M$ is isomorphic to $\mathbb{Z}/3\mathbb{Z}$ and $M$ is an Abelian normal subgroup of $E$. The quotient group $E/M$ is isomorphic to $\mathbb{Z}/2\mathbb{Z}$. Therefore, $S_3$ is a group extension of $\mathbb{Z}/2\mathbb{Z}$ by $\mathbb{Z}/3\mathbb{Z}$.

**Example 10.7** Let $E = D_n$, the dihedral group. One description of $E$ is by generators and relations. The group $E$ is generated by elements $\sigma$ and $\tau$ satisfying $\tau^n = \sigma^2 = e$ and $\sigma\tau\sigma = \tau^{-1}$. Let $M = \langle \sigma\rangle$, a normal subgroup of $E$ that is isomorphic to $\mathbb{Z}/n\mathbb{Z}$. The quotient $E/M$ is isomorphic to $\mathbb{Z}/2\mathbb{Z}$, so $E$ is a group extension of $\mathbb{Z}/2\mathbb{Z}$ by $\mathbb{Z}/n\mathbb{Z}$.

**Example 10.8** Let $M$ and $G$ be groups, and let $\varphi : G \to \operatorname{End}(M)$ be a group homomorphism. If $E$ is the *semidirect product* $M \rtimes_\varphi G$, then $M' = \{(m,e) : m \in M\}$ is a normal subgroup of $E$ isomorphic to $M$, and $E/M' \cong G$. Thus, $E$ is a group extension of $G$ by $M$. Notice that the group extensions in each of the two previous examples are also semidirect products.

Suppose that $M$ is Abelian and that $E$ is a group extension of $G$ by $M$. We can make $M$ into a $G$-module as follows. View $G = E/M$. If $\sigma \in G$ and $m \in M$, let $e$ be any element of $E$ that is a coset representative of $\sigma$. Then define $\sigma m = eme^{-1}$. Note that we will write the group operations in these groups multiplicatively. The groups $G$ and $E$ need not be Abelian, although we are assuming that $M$ is Abelian. It is not hard to show that this definition gives a well-defined action of $G$ on $M$ and that $M$ is a $G$-module. We can obtain a 2-cocycle from this information. For each $\sigma \in G$, pick a coset representative $e_\sigma \in E$. The map $\sigma \mapsto e_\sigma$ need not be a homomorphism. Let $f(\sigma,\tau) = e_\sigma e_\tau e_{\sigma\tau}^{-1}$. Then the coset of $f(\sigma,\tau)$ in $G$ is trivial, so $e_\sigma e_\tau e_{\sigma\tau}^{-1} \in M$. Therefore, $f$ is a function from $G \times G$ to $M$. Moreover, a short calculation shows that $f$ is actually a 2-cocycle. The cocycle $f$ does depend on the choice of coset representatives chosen. Suppose that $\{d_\sigma\}$ is another set of coset representatives for the elements of $G$. Then there are $m_\sigma \in M$ with $d_\sigma = m_\sigma e_\sigma$. Let $g$ be the cocycle obtained by the choice of the $d_\sigma$; that is, $g(\sigma,\tau) = d_\sigma d_\tau d_{\sigma\tau}^{-1}$. Then

$$
\begin{aligned}
g(\sigma,\tau) = d_\sigma d_\tau d_{\sigma\tau}^{-1} &= (m_\sigma e_\sigma)(m_\tau e_\tau)(m_{\sigma\tau} e_{\sigma\tau})^{-1} \\
&= m_\sigma \sigma m_\tau e_\sigma e_\tau e_{\sigma\tau}^{-1} m_{\sigma\tau}^{-1} \\
&= (m_\sigma \sigma m_\tau m_{\sigma\tau}^{-1}) e_\sigma e_\tau e_{\sigma\tau}^{-1} \\
&= (m_\sigma \sigma m_\tau m_{\sigma\tau}^{-1}) f(\sigma,\tau).
\end{aligned}
$$

In this calculation, we used the fact that $e_\sigma m e_\sigma^{-1} = \sigma m$. The function $(\sigma,\tau) \mapsto m_\sigma \sigma m_\tau m_{\sigma\tau}^{-1}$ is the image under $\delta_1$ of the 1-cochain $\sigma \mapsto m_\sigma$. Therefore, $f$ and $g$ differ by a 1-coboundary, so they determine the same element of $H^2(G,M)$. We have thus shown that for any group extension $E$ of $G$ by $M$ there is a uniquely determined element of $H^2(G,M)$.

We can reverse these calculations. Let $M$ be a $G$-module and let $f \in Z^2(G,M)$. We can define a group $E_f$ as follows. As a set, $E_f = M \times G$. However, multiplication in $E_f$ is defined by

$$
(m,\sigma)(n,\tau) = (m\cdot \sigma n \cdot f(\sigma,\tau), \sigma\tau).
$$

A short calculation shows that this is an associative operation with an identity $(f(1,1)^{-1},1)$, and $(m,\sigma)^{-1} = (m^{-1}f(1,1)^{-1},\sigma^{-1})$. In fact, associativity follows exactly from the condition that $f$ is a 2-cocycle. The formulas for identity and inverses use the fact that $f(1,1) = f(1,\sigma) = f(\sigma,1)$ for any $\sigma \in G$, which also follows from the cocycle condition. The group $M$ is isomorphic to the normal subgroup $\{(m,1) : m \in M\}$ of $E_f$, and the quotient of $E_f$ by this subgroup is isomorphic to $G$. It is not hard to show that if $g$ is another 2-cocycle that differs from $f$ by a 2-coboundary, then the resulting group obtained from $g$ is isomorphic to $E_f$. By being more precise about the definition of a group extension, these arguments would then show that the group extensions of $M$ by $G$ are classified by $H^2(G,M)$.

**Example 10.9** Let $M$ and $G$ be groups and $\varphi : G \to \operatorname{End}(M)$ be a group homomorphism. Let $E = M \rtimes_\varphi G$ be the semidirect product of $M$ by $G$. We determine the cocycle describing $E$. Let $M' = \{(m,e) : m \in M\}$ and $G' = \{(e,g) : g \in G\}$ be the isomorphic copies of $M$ and $G$ inside $E$. The elements of $G'$ form a natural set of coset representatives of $M'$ in $E$. The cocycle $f$ describing $E$ is defined by

$$
f(\sigma,\tau) = (e,\sigma)(e,\tau)(e,\sigma\tau)^{-1} = (e,e),
$$

so $f$ is the trivial cocycle.

Conversely, if $f$ is the trivial cocycle of $H^2(G,M)$, then we can see that the group extension constructed from $G$ and $M$ and $f$ is a semidirect product of $M$ by $G$, for the mapping $\sigma \mapsto e_\sigma$ defined earlier is a homomorphism if and only if the corresponding cocycle is trivial. Since this map is a homomorphism, we can check that the map $\varphi : G \to \operatorname{End}(M)$, where $\varphi(\sigma)$ is the automorphism $m \mapsto e_\sigma m e_\sigma^{-1}$, is also a homomorphism, and the group $E_f$ constructed above from $G,M$, and $f$ is the semidirect product $M \rtimes_\varphi G$.

**Example 10.10** Let $Q_8$ be the quaternion group. Then $Q_8 = \{\pm 1, \pm i, \pm j, \pm k\}$, and the operation on $Q_8$ is given by the relations $i^2 = j^2 = k^2 = -1$ and $ij = k = -ji$. We show that $Q_8$ is a group extension of $M = \langle i\rangle$ by $\mathbb{Z}/2\mathbb{Z}$, and we determine the cocycle for this extension. First note that $M$ is an Abelian normal subgroup of $Q_8$ and that $Q_8/M \cong \mathbb{Z}/2\mathbb{Z}$. Therefore, $Q_8$ is a group extension of $M$ by $\mathbb{Z}/2\mathbb{Z}$. We use $1$ and $j$ as coset representatives of $M$ in $Q_8$. Our cocycle $f$ that represents this group extension is then given by

$$
\begin{aligned}
f(1,1) = f(1,j) = f(j,1) &= 1, \\
f(j,j) = j^2 &= -1.
\end{aligned}
$$

This cocycle is not trivial, so $Q_8$ is not the semidirect product of $M$ and $\mathbb{Z}/2\mathbb{Z}$. In fact, $Q_8$ is not the semidirect product of any two subgroups, because one can show that there do not exist two subgroups of $Q_8$ whose intersection is $\langle 1\rangle$.

## Crossed products

Another application of the second cohomology group is in the theory of algebras. If $F$ is a field, then an *$F$-algebra* is a ring $A$ that is also an $F$-vector space, in which multiplication in $A$ and scalar multiplication are connected by the axiom

$$
\alpha(ab) = (\alpha a)b = a(\alpha b)
$$

for all $a,b \in A$ and all $\alpha \in F$. Let $K$ be a Galois extension of $F$ with Galois group $G$. If $f \in Z^2(G,K^*)$, we can construct an $F$-algebra from $K$, $G$, and $f$ as follows. For each $\sigma \in G$, let $x_\sigma$ be a symbol and let $A$ be the Abelian group

$$
A = \bigoplus_{\sigma\in G} K x_\sigma.
$$

We can define multiplication on $A$ by using the two definitions

$$
\begin{aligned}
x_\sigma x_\tau &= f(\sigma,\tau) x_{\sigma\tau}, \\
x_\sigma a &= \sigma(a) x_\sigma.
\end{aligned}
$$

A full definition of multiplication can then be obtained by using distributivity; that is,

$$
\sum_{\sigma\in G} a_\sigma x_\sigma \cdot \sum_{\tau\in G} b_\tau x_\tau = \sum_{\sigma,\tau\in G} a_\sigma \sigma(b_\tau) f(\sigma,\tau) x_{\sigma\tau}.
$$

A calculation shows that associativity of multiplication follows immediately from the cocycle condition and that the other axioms of an $F$-algebra are straightforward. The algebra $A$ is an $F$-vector space of dimension $|G|\cdot [K:F] = |G|^2$. This algebra is called a *crossed product* and is often denoted $A = (K/F, G, f)$. Crossed products come up in the theory of division algebras. It is known that any crossed product is isomorphic to a ring of $n \times n$ matrices over a division ring. Moreover, if $D$ is a division ring that is finite dimensional over the field $F = \{a \in D : da = ad \text{ for all } d \in D\}$, the center of $D$, then some matrix ring over $D$ is isomorphic to a crossed product algebra of the form $(K/F, G, f)$ for some Galois extension $K$ of $F$.

The algebra $A$ is determined up to isomorphism not by the cocycle $f$ but by the class of $f$ in $H^2(G,M)$, as we now show. Suppose that $g$ is another 2-cocycle that differs from $f$ by a 2-coboundary. Then there are $a_\sigma \in K^*$ with $g(\sigma,\tau) = a_\sigma \sigma(a_\tau) a_{\sigma\tau}^{-1} f(\sigma,\tau)$. Let $y_\sigma = a_\sigma x_\sigma$. Then $K y_\sigma = K x_\sigma$, so $A = \bigoplus_{\sigma\in G} K y_\sigma$. Moreover, $y_\sigma a = \sigma(a) y_\sigma$ for all $a \in K$, and

$$
\begin{aligned}
y_\sigma y_\tau y_{\sigma\tau}^{-1} &= a_\sigma x_\sigma a_\tau x_\tau (a_{\sigma\tau} x_{\sigma\tau})^{-1} \\
&= a_\sigma \sigma(a_\tau) x_\sigma x_\tau x_{\sigma\tau}^{-1} a_{\sigma\tau}^{-1} \\
&= a_\sigma \sigma(a_\tau) a_{\sigma\tau}^{-1} f(\sigma,\tau) \\
&= g(\sigma,\tau).
\end{aligned}
$$

Therefore, the algebra constructed with the procedure above using the cocycle $g$ is isomorphic to $A$. Conversely, if the algebras constructed from two cocycles are isomorphic, then it can be seen that the cocycles are cohomologous; that is, they represent the same element in $H^2(G,M)$.

**Example 10.11** Let $\mathbb{H}$ be Hamilton's quaternions. The ring $\mathbb{H}$ consists of all symbols $a + bi + cj + dk$ with $a,b,c,d \in \mathbb{R}$, and multiplication is given by the relations $i^2 = j^2 = k^2 = -1$ and $ij = k = -ji$. This was the first example of a noncommutative division ring. The field of complex numbers $\mathbb{C}$ can be viewed as the subring of $\mathbb{H}$ consisting of all elements of the form $a + bi$, and $\mathbb{H} = \mathbb{C} \oplus \mathbb{C}j$. The extension $\mathbb{C}/\mathbb{R}$ is Galois with Galois group $\{\operatorname{id}, \sigma\}$, where $\sigma$ is complex conjugation. Let $x_{\operatorname{id}} = 1$ and $x_\sigma = j$. Then

$$
x_\sigma(a + bi)x_\sigma^{-1} = j(a + bi)j^{-1} = a - bi = \sigma(a + bi).
$$

The cocycle $f$ associated to this algebra is given by

$$
\begin{aligned}
f(\operatorname{id},\operatorname{id}) = x_{\operatorname{id}}x_{\operatorname{id}}x_{\operatorname{id}}^{-1} &= 1, \\
f(\operatorname{id},\sigma) = x_{\operatorname{id}}x_\sigma x_\sigma^{-1} &= 1, \\
f(\sigma,\operatorname{id}) = x_\sigma x_{\operatorname{id}}x_\sigma^{-1} &= 1, \\
f(\sigma,\sigma) = x_\sigma x_\sigma x_{\operatorname{id}}^{-1} &= j^2 = -1.
\end{aligned}
$$

On the other hand, if we start with this cocycle and construct the crossed product $A = (\mathbb{C}/\mathbb{R}, \operatorname{Gal}(\mathbb{C}/\mathbb{R}), f)$, then $A = \mathbb{C}x_{\operatorname{id}} \oplus \mathbb{C}x_\sigma$, and the map $A \to \mathbb{H}$ given by $cx_{\operatorname{id}} + dx_\sigma \mapsto c + dj$ is an isomorphism of $\mathbb{R}$-algebras.

**Example 10.12** Let $K/F$ be a Galois extension of degree $n$ with Galois group $G$, and consider the crossed product $A = (K/F, G, 1)$, where $1$ represents the trivial cocycle. We will show that $A \cong M_n(F)$, the ring of $n \times n$ matrices over $F$. First, note that $A = \bigoplus_{\sigma\in G} K x_\sigma$, where multiplication on $A$ is determined by the relations $x_\sigma x_\tau = x_{\sigma\tau}$ and $x_\sigma a = \sigma(a) x_\sigma$ for $a \in K$. If $f = \sum a_\sigma x_\sigma \in A$, then $f$ induces a map $\varphi_f : K \to K$ given by $\varphi_f(k) = \sum a_\sigma \sigma(k)$. In other words, $\varphi_f$ is the linear combination $\sum a_\sigma \sigma$. Each $\sigma$ is an $F$-linear transformation of $K$, so $\varphi_f \in \operatorname{End}_F(K)$. The relations governing multiplication in $A$ show that the map $\varphi : A \to \operatorname{End}_F(K)$ given by $\varphi(f) = \varphi_f$ is an $F$-algebra homomorphism. Moreover, $\varphi$ is injective since if $\sum a_\sigma \sigma$ is the zero transformation, then each $a_\sigma = 0$ by the Dedekind independence lemma. Both $A$ and $\operatorname{End}_F(K)$ have dimension $n^2$ over $F$, so $\varphi$ is automatically surjective. This proves that $A \cong \operatorname{End}_F(K)$, and so $A \cong M_n(F)$.

Crossed products have a simpler description when we start with a cyclic extension. In addition, the norm map helps to describe crossed products in this situation. Suppose that $K/F$ is a cyclic Galois extension with Galois group $G = \langle \sigma\rangle$, and let $a \in F^*$. We can define a cocycle in $H^2(G,K^*)$ by

$$
f(\sigma^i, \sigma^j) =
\begin{cases}
1 & \text{if } i+j < n, \\
a & \text{if } i+j \ge n.
\end{cases}
$$

A straightforward calculation shows that $f$ is indeed a 2-cocycle. The algebra constructed from $f$ is usually denoted $(K/F, \sigma, a)$ and is called a *cyclic algebra*. This construction is a special case of the crossed product construction. If $x = x_\sigma$, then $x\alpha x^{-1} = \sigma(\alpha)$ for all $\alpha \in K$, and $x^n = a$. These relations along with $K$ and $\sigma$ fully determine the algebra $(K/F, \sigma, a)$. If $a = N_{K/F}(c)$ for some $c \in K$, then if we set $y_\sigma = c^{-1}x_\sigma$, a short calculation shows that $y_\sigma^n = 1$. Therefore, the cocycle associated to $y_\sigma$ is trivial, so $(K/F,\sigma,a) \cong M_n(F)$ by Example 10.12. Moreover, Problem 16 proves that $H^2(G,K^*) \cong F^*/N_{K/F}(K^*)$. One consequence of this fact is that two algebras $(K/F,\sigma,a)$ and $(K/F,\sigma,b)$ are isomorphic if and only if $ab^{-1} \in N_{K/F}(K^*)$. Moreover, by a theorem of the theory of algebras, if none of the elements $a, a^2, \dots, a^{n-1}$ are equal to the norm from $K$ to $F$ of a nonzero element of $K$, then $(K/F,\sigma,a)$ is a division algebra. Hamilton's quaternions are of the form $(\mathbb{C}/\mathbb{R}, \sigma, -1)$.

The interested reader can find much more information about group extensions and crossed products in Rotman [23] and Jacobson [16].
