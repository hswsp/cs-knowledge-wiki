# Appendix C. Group Theory（群论）

There are a number of results from group theory that we will need in Galois theory. This section gives a brief survey of these results. For a more complete treatment of group theory, see Rotman [23] or any of the general algebra texts.

## 1 Fundamentals of Finite Groups

Let $G$ be a group, and let $H$ be a subgroup of $G$. Recall that the *left coset* $gH$ of an element $g \in G$ is the set of all elements of the form $gh$ with $h \in H$. Right cosets are defined similarly. The distinct left (or right) cosets of $H$ partition $G$. If $G$ is finite, then each coset has the same number of elements. These facts form the heart of the proof of Lagrange's theorem, the most fundamental result about finite groups.

**Theorem 1.1 (Lagrange)** *If $H$ is a subgroup of a finite group $G$, then $|H|$ divides $|G|$. Moreover, if $[G:H]$ is the number of cosets of $H$ in $G$, then $|G| = |H| \cdot [G:H]$.*

**Proof.** The proof of the first statement can be found in any book on group theory. Lagrange's theorem usually is stated as just the first sentence. The proof yields the equality $|G| = |H| \cdot [G:H]$.
□

If $G$ is a group and if $N$ is a subgroup of $G$, then $N$ is said to be a *normal subgroup* of $G$ if $gng^{-1} \in N$ for all $g \in G$ and $n \in N$. If $N$ is a normal subgroup of $G$, let $G/N$ be the set of all left cosets of $N$ in $G$. Then $G/N$ can be given the structure of a group by defining multiplication by $gN \cdot hN = ghN$. This definition is well defined, independent of the representation of the cosets.

Suppose that $G$ is a finite Abelian group. Then there is a complete description of the structure of $G$. The following theorem is often called the *fundamental theorem of finite Abelian groups*.

**Theorem 1.2 (Fundamental Theorem of Finite Abelian Groups)** *Let $G$ be a finite Abelian group. Then $G$ is a direct product of cyclic subgroups. Therefore, $G \cong \mathbb{Z}/n_1\mathbb{Z} \times \cdots \times \mathbb{Z}/n_r\mathbb{Z}$ for some integers $n_i$.*

It is not hard to show that $\mathbb{Z}/nm\mathbb{Z} \cong \mathbb{Z}/n\mathbb{Z} \times \mathbb{Z}/m\mathbb{Z}$ if $\gcd(n,m) = 1$. This fact is one formulation of the Chinese remainder theorem. From this fact and the fundamental theorem of finite Abelian groups, one can obtain the following description of finite Abelian groups.

**Corollary 1.3** *Let $G$ be a finite Abelian group.*

1. *There are integers $n_1, \ldots, n_r$, where $n_i$ divides $n_{i-1}$ for each $i$, such that $G \cong \mathbb{Z}/n_1\mathbb{Z} \times \cdots \times \mathbb{Z}/n_r\mathbb{Z}$. The $n_i$ are uniquely determined by $G$ and are called the **invariant factors** of $G$.*
2. *There are integers $m_{ij}$ and primes $p_i$ such that $G \cong \mathbb{Z}/p_1^{m_{11}}\mathbb{Z} \times \cdots \times \mathbb{Z}/p_t^{m_{ts}}\mathbb{Z}$. The various $p_i^{m_{ij}}$ are uniquely determined by $G$ and are called the **elementary divisors** of $G$.*

Let $G$ be a finite group. Then the *exponent* of $G$, denoted $\exp(G)$, is the least common multiple of the orders of the elements of $G$. For example, the exponent of the symmetric group $S_3$ is $6$. We give a useful result about the exponent of a finite Abelian group.

**Proposition 1.4** *Let $G$ be a finite Abelian group. If $n = \exp(G)$, then there is an element of $G$ of order $n$. Therefore, $\exp(G)$ is the maximum order of an element of $G$. Furthermore, $G$ is cyclic if and only if $|G| = \exp(G)$.*

**Proof.** A short calculation using the decomposition of $G$ into a product of cyclic groups shows that for every divisor $m$ of $|G|$ there is an element of order $m$. If $n = \exp(G)$, then $n$ divides $|G|$ by Lagrange's theorem and the definition of least common multiple. Therefore, $G$ contains an element of order $n$. Since a group $G$ is cyclic if and only if it contains an element whose order is $|G|$, we see that $G$ is cyclic if and only if $|G| = \exp(G)$.
□

An alternative proof of this proposition that does not invoke the fundamental theorem of finite Abelian groups is outlined in Problem 1.

## 2 The Sylow Theorems

Let $G$ be a finite group, and let $p$ be a prime dividing the order $|G|$ of $G$. Let $|G| = p^n q$ with $q$ not divisible by $p$. A *$p$-Sylow subgroup* of $G$ is a subgroup of order $p^n$, the maximal power of $p$ possible for a subgroup of $G$. The Sylow theorems give existence and properties of $p$-Sylow subgroups of a finite group.

**Theorem 2.1 (First Sylow Theorem)** *Let $G$ be a finite group, and let $p$ be a prime divisor of $|G|$. Then there exists a $p$-Sylow subgroup of $G$.*

**Theorem 2.2 (Second Sylow Theorem)** *Let $p$ be a prime divisor of $|G|$. If $H$ is a subgroup of $G$ of order a power of $p$, then $H \subseteq xPx^{-1}$ for some $p$-Sylow subgroup $P$ of $G$. In particular, if $P_1$ and $P_2$ are two $p$-Sylow subgroups of $G$, then $P_2 = xP_2x^{-1}$ for some $x \in G$.*

**Theorem 2.3 (Third Sylow Theorem)** *Let $p$ be a prime divisor of $|G|$. If $n$ is the number of $p$-Sylow subgroups of $G$, then $p$ divides $|G|$ and $n \equiv 1 \pmod{p}$.*

The first Sylow theorem is the best partial converse of Lagrange's theorem. Given a divisor $m$ of $|G|$, there need not be a subgroup of $G$ of order $m$. For instance, there is no subgroup of the alternating group $A_4$ of order $6$. However, if $|G| = p^n q$ as above and if $m = p^n$, then the first Sylow theorem gives the existence of a subgroup of order $m$.

Some of the power of the Sylow theorems comes from the following two facts. First, it is often convenient to have a subgroup $H$ of a group $G$ with $|H|$ and $[G:H]$ relatively prime, as is the case if $H$ is a Sylow subgroup. Second, groups of prime power order are very nicely behaved. We shall see one property of such groups shortly. If $G$ is a group of order $p^n$ with $p$ a prime, then $G$ is said to be a *$p$-group*. If $G$ is an arbitrary group, a subgroup $H$ of $G$ is said to be a *maximal subgroup* of $G$ if $H$ is a proper subgroup of $G$ that is not contained in any subgroup of $G$ other than $G$ and itself. The following result will help to use $p$-groups in field theory, for instance, in the proof of the fundamental theorem of algebra in Section 5. An outline of a proof of this proposition can be found in Problem 2.

**Proposition 2.4** *Let $G$ be a $p$-group of order $p^n$. If $H$ is a maximal subgroup of $G$, then $H$ is normal in $G$ and $[G:H] = p$.*

If $G$ is a finite group, then maximal subgroups of $G$ always exist. Using this proposition repeatedly, we can extend the first Sylow theorem.

**Corollary 2.5** *Let $G$ be a group of order $p^n q$ with $p$ a prime. Then $G$ contains a subgroup of order $p^r$ for any $r \leq n$.*

## 3 Solvable Groups

In many ways, abstract algebra began with the work of Abel and Galois on the solvability of polynomial equations by radicals. The key idea Galois had was to transform questions about fields and polynomials into questions about finite groups. For the proof that it is not always possible to express the roots of a polynomial equation in terms of the coefficients of the polynomial using arithmetic expressions and taking roots of elements, the appropriate group theoretic property that arises is the idea of solvability.

**Definition 3.1** *A group $G$ is **solvable** if there is a chain of subgroups*

$$\langle e \rangle = H_0 \subseteq H_1 \subseteq \cdots \subseteq H_n = G$$

*such that, for each $i$, the subgroup $H_i$ is normal in $H_{i+1}$ and the quotient group $H_{i+1}/H_i$ is Abelian.*

An Abelian group $G$ is solvable; the chain of subgroups $\langle e \rangle \subset G$ satisfies the definition. Also, the symmetric groups $S_3$ and $S_4$ are solvable by considering the chains $\langle e \rangle \subset A_3 \subset S_3$ and $\langle e \rangle \subset H \subset A_4 \subset S_4$, respectively, where

$$H = \{e, (12)(34), (13)(24), (14)(23)\}.$$

Likewise, any $p$-group is solvable, since if $|G| = p^n$, there is a chain of subgroups

$$\langle e \rangle \subset N_1 \subset N_2 \subset \cdots \subset N_n = G$$

where $|N_i| = p^i$ and $N_{i-1}$ is normal in $N_i$, by Proposition 2.4. Thus, $N_i/N_{i-1}$ has order $p$; hence, it is cyclic and therefore Abelian. One can obtain such a chain by taking $N_{n-1}$ to be any maximal subgroup of $G$, $N_{n-2}$ a maximal subgroup of $N_{n-1}$, and so on, and using Proposition 2.4. We shall show below that $S_n$ is not solvable if $n \geq 5$. This is the group theoretic result we need to show that the roots of the general polynomial of degree $n$ cannot be written in terms of the coefficients of the polynomial by using algebraic operations and extraction of roots.

We now begin to work toward showing that the symmetric group $S_n$ is not solvable if $n \geq 5$. If $G$ is a group, let $G'$ be the *commutator subgroup* of $G$; that is, $G'$ is the subgroup of $G$ generated by all $ghg^{-1}h^{-1}$ with $g, h \in G$. It is an easy exercise to show that $G'$ is a normal subgroup of $G$ and that $G/G'$ is Abelian. In fact, if $N$ is a normal subgroup of $G$, then $G/N$ is Abelian if and only if $G' \subseteq N$. We define $G^{(i)}$ by recursion by setting $G^{(1)} = G'$ and $G^{(i+1)} = (G^{(i)})'$. We then obtain a chain

$$G \supseteq G^{(1)} \supseteq G^{(2)} \supseteq \cdots \supseteq G^{(n)} \supseteq \cdots$$

such that $G^{(m+1)}$ is normal in $G^{(m)}$ and $G^{(m)}/G^{(m+1)}$ is Abelian for all $m$.

**Lemma 3.2** *$G$ is solvable if and only if $G^{(n)} = \langle e \rangle$ for some $n$.*

**Proof.** Suppose that $G^{(n)} = \langle e \rangle$ for some $n$. Then the chain

$$G \supseteq G^{(1)} \supseteq \cdots \supseteq G^{(n)} = \langle e \rangle$$

shows that $G$ is solvable. Conversely, suppose that $G$ is solvable, and let

$$\langle e \rangle = H_n \subset H_{n-1} \subset \cdots \subset H_0 = G$$

be a chain of subgroups such that $H_{m+1}$ normal in $H_m$ and $H_m/H_{m+1}$ is Abelian for all $m$. Then $G/H_1$ is Abelian, so $G' = G^{(1)} \subseteq H_1$. Thus, $(G^{(1)})' \subseteq H_1'$. Because $H_1/H_2$ is Abelian, $H_1' \subseteq H_2$. Therefore, $G^{(2)} = (G^{(1)})' \subseteq H_2$. Continuing this process shows that $G^{(n)} \subseteq H_n = \langle e \rangle$, so $G^{(n)} = \langle e \rangle$.
□

**Proposition 3.3** *Let $G$ be a group, and let $N$ be a normal subgroup of $G$. Then $G$ is solvable if and only if $N$ and $G/N$ are solvable.*

**Proof.** We have $N^{(m)} \subseteq G^{(m)}$ and $(G/N)^{(m)} = (G^{(m)} N)/N$ for all $m$. Thus, if $G$ is solvable, there is an $n$ with $G^{(n)} = \langle e \rangle$. Therefore, $N^{(n)} = \langle e \rangle$ and $(G/N)^{(n)} = \langle e \rangle$, so both $N$ and $G/N$ are solvable. Conversely, suppose that $N$ and $G/N$ are solvable. Then there is an $m$ with $(G/N)^{(m)} = \langle e \rangle$, so $G^{(m)} \subseteq N$. There is an $n$ with $N^{(n)} = \langle e \rangle$, so $G^{(n+m)} = (G^{(m)})^{(n)} \subseteq N^{(n)} = \langle e \rangle$. Therefore, $G^{(n+m)} = \langle e \rangle$, so $G$ is solvable.
□

**Lemma 3.4** *If $n \geq 5$, then $A_n$ is a simple group.*

For a proof of this important result, see Hungerford [13, p. 49].

**Corollary 3.5** *If $n \geq 5$, then $S_n$ is not solvable.*

**Proof.** Since $A_n$ is simple and non-Abelian, $A_n' = A_n$. Thus, we see for all $m$ that $A_n^{(m)} = A_n \neq \langle e \rangle$, so $A_n$ is not solvable. By the proposition above, $S_n$ is also not solvable.
□

## 4 Profinite Groups

We give here a brief description of profinite groups. These are the groups that arise as the Galois group of a Galois extension of any degree, possibly infinite. This information is only used in Sections 17 and 18. Most of the results are stated without proof. The interested reader can find proofs and more information about profinite groups in Serre [24] and Shatz [25].

Let $\{G_i\}_{i \in I}$ be a collection of groups. Suppose that $I$ is a *directed set*. This means that $I$ has a partial order $\leq$ such that for any $i, j \in I$, there is a $k \in I$ with $i \leq k$ and $j \leq k$. Suppose that for each $i$ and $j$ with $i \leq j$ there is a group homomorphism $\varphi_{ij} : G_j \to G_i$. Moreover, suppose that whenever $i \leq j \leq k$ we have $\varphi_{i,k} = \varphi_{j,k} \circ \varphi_{i,j}$. Then the set of groups $\{G_i\}$ together with the homomorphisms $\varphi_{i,j}$ are said to form an *inverse system* of groups.

**Definition 4.1** *Let $\{G_i, \varphi_{i,j}\}$ be an inverse system of groups. The **inverse limit** of this system is a group $G$ together with homomorphisms $\varphi_i : G \to G_i$ such that if $i \leq j$, then $\varphi_i = \varphi_{i,j} \circ \varphi_j$, along with the following universal mapping property: If $H$ is a group together with homomorphisms $\tau_i : H \to G_i$ such that $\tau_i = \varphi_{i,j} \circ \tau_j$ whenever $i \leq j$, then there is a unique group homomorphism $\tau : H \to G$ with $\tau_i = \varphi_i \circ \tau$ for each $i$; that is, the following diagram commutes:*

$$\begin{CD}
G @>\tau>> H \\
@V\varphi_i VV @| \\
G_i @<\tau_i<< H
\end{CD}$$

The following proposition shows that inverse limits exist and are unique up to isomorphism.

**Proposition 4.2** *Let $\{G_i, \varphi_{i,j}\}$ be an inverse system of groups. Then the inverse limit of the $G_i$ exists and is unique up to isomorphism.*

**Proof.** Let $\prod_i G_i$ be the direct product of the $G_i$. Define $G$ by

$$G = \left\{ \{g_i\} \in \prod_i G_i : \varphi_{i,j}(g_j) = g_i \text{ for each pair } (i,j) \text{ with } i \leq j \right\}.$$

Then $G$ is a subgroup of $\prod_i G_i$, since the $\varphi_{i,j}$ are homomorphisms. Let $\varphi_i : G \to G_i$ be the restriction to $G$ of the usual projection map. If $i \leq j$, then $\varphi_i = \varphi_{i,j} \circ \varphi_j$ by the definition of $G$. To verify the universal mapping property, let $H$ be a group with homomorphisms $\tau_i : H \to G_i$ such that $\tau_i = \varphi_{i,j} \circ \tau_j$ whenever $i \leq j$. Define a homomorphism $\tau : H \to \prod_i G_i$ by $\tau(h) = \{\tau_i(h)\}$. The condition $\tau_i = \varphi_{i,j} \circ \tau_j$ says precisely that $\mathrm{im}(\tau) \subseteq G$. Thus, $\tau$ is a homomorphism from $H$ to $G$. The formula for $\tau$ is forced upon us by the requirement that $\tau_i = \varphi_i \circ \tau$, so $\tau$ is unique. Thus, $G$ is an inverse limit of the $G_i$.
□

We can now define a profinite group.

**Definition 4.3** *A **profinite group** is an inverse limit of finite groups.*

There is a natural topology on a profinite group. If $\{G_i\}$ is an inverse system of finite groups, give each $G_i$ the discrete topology and then give $\prod_i G_i$ the product topology. The inverse limit of the $G_i$ then inherits the subspace topology from $\prod_i G_i$. This topology is an important tool for studying profinite groups and is used frequently in proofs of the results stated in this section. We describe a relation between the topology and the algebra of $G$. Let $N_i = \ker(\varphi_i)$. Then $G/N_i$ is isomorphic to a subgroup of $G_i$; consequently, $N_i$ is a normal subgroup of finite index. Moreover, since $N_i = \varphi_i^{-1}\{0\}$, the preimage of a single point, $N_i$ is both open and closed, since $G_i$ has the discrete topology.

**Proposition 4.4** *Let $G$ be a profinite group. As a topological space, $G$ is Hausdorff, compact, and totally disconnected.*

Many of the fundamental numerical results about finite groups have analogs in the theory of profinite groups. First, we need a meaningful definition of the order of a profinite group. A *supernatural number* is a formal product $\prod_p p^{n_p}$, where $p$ runs over all primes, and the exponents are non-negative integers or $\infty$. While there is no natural way to add supernatural numbers, the product, greatest common divisor, and least common multiple of a set of supernatural numbers can be defined in the obvious way. By using supernatural numbers, we can give a useful definition of the order of a group and the index of a subgroup.

**Definition 4.5** *Let $G$ be the inverse limit of the finite groups $\{G_i\}$.*

1. *The **order** of $G$ is the supernatural number $\mathrm{lcm}_i\{|G_i|\}$.*
2. *If $H$ is a closed subgroup of $G$, then the **index** $[G:H]$ is equal to $\mathrm{lcm}_i\{[G_i : G_i \cap H]\}$.*

If $p$ is a prime and $n_i$ is the power of $p$ occurring in $|G_i|$, then $\max\{n_i\}$ is the power of $p$ occurring in $|G|$. Even though each $n_i$ is finite, the maximum may be infinite. This is the reason for allowing an exponent of $\infty$ in a supernatural number.

We record the basic numerical properties of profinite groups. The first part of the following proposition is an analog of Lagrange's theorem.

**Proposition 4.6** *Let $G$ be a profinite group.*

1. *If $H \subseteq K$ are closed subgroups of $G$, then $[G:K] = [G:H] \cdot [H:K]$.*
2. *If $H$ is a closed subgroup of $G$, then $[G:H] = \mathrm{lcm}_U\{[G/U : HU/U]\}$, where $U$ ranges over all open normal subgroups $U$ of $G$. In particular, $|G| = \mathrm{lcm}_U\{|G/U|\}$.*

Two different inverse systems of groups may have the same inverse limit. Part 2 of this proposition shows that indices are not dependent on a specific choice of inverse system.

There are good extensions of the Sylow theorems to the class of profinite groups. Let $p$ be a prime. A *pro-$p$-group* is a profinite group $G$ for which $|G| = p^n$ for some $n$ with $1 < n \leq \infty$. Equivalently, a pro-$p$-group is an inverse limit of $p$-groups. Suppose that $G$ is a profinite group whose order is divisible by a prime $p$. This means that $|G| = \prod_q q^{n_q}$, such that $n_p \geq 1$. A subgroup $H$ of $G$ is called a *$p$-Sylow subgroup* of $G$ provided that $H$ is a pro-$p$-group and $[G:H]$ is not divisible by $p$.

**Theorem 4.7** *Let $G$ be a profinite group, and let $p$ be a prime divisor of $|G|$.*

1. *The group $G$ has a $p$-Sylow subgroup.*
2. *If $P$ is a pro-$p$-subgroup of $G$, then $P$ is contained in a $p$-Sylow subgroup of $G$.*
3. *Any two $p$-Sylow subgroups of $G$ are conjugate.*
