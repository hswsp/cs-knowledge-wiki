# 17. Infinite Galois Extensions（无限 Galois 扩张）

## Chapter IV: Infinite Algebraic Extensions

In this chapter, we investigate infinite Galois extensions and prove an analog of the fundamental theorem of Galois theory for infinite extensions. The key idea is to put a topology on the Galois group of an infinite dimensional Galois extension and then use this topology to determine which subgroups of the Galois group arise as Galois groups of intermediate extensions. We also give a number of constructions of infinite Galois extensions, constructions that arise in quadratic form theory, number theory, and Galois cohomology, among other places.

## 17 Infinite Galois Extensions

In this section, we consider Galois extensions $K/F$ of arbitrary degree and prove a fundamental theorem for such extensions. If $[K:F] = \infty$, then not all subgroups of $\operatorname{Gal}(K/F)$ have the form $\operatorname{Gal}(K/L)$ for some intermediate extension $L$ (see Problem 4). We need more information about $\operatorname{Gal}(K/F)$ in order to determine when a subgroup is of the form $\operatorname{Gal}(K/L)$. It turns out that the right way to look at $\operatorname{Gal}(K/F)$ is to put a topology on it. This was first done by Krull in the 1920s, and we see below that the subgroups of $\operatorname{Gal}(K/F)$ of the form $\operatorname{Gal}(K/L)$ are precisely the subgroups that are closed with respect to the topology we define on $\operatorname{Gal}(K/F)$. We assume in this section that the reader is familiar with the basic ideas of point set topology, in particular with the notions of compactness and the Hausdorff property. The interested reader can find a discussion of these notions in Appendix E.

Let $K$ be a Galois extension of $F$. We will use the following notation for the rest of this section. Let

$$
\begin{aligned}
G &= \operatorname{Gal}(K/F), \\
\mathcal{I} &= \{\, E : F \subseteq E \subseteq K,\ [E:F] < \infty \text{ and } E/F \text{ is Galois} \,\}, \\
\mathcal{N} &= \{\, N \subseteq G : N = \operatorname{Gal}(K/E) \text{ for some } E \in \mathcal{I} \,\}.
\end{aligned}
$$

Recall part 3 of Proposition 3.28: If $K/F$ is normal, and if $F \subseteq L \subseteq K \subseteq N$ are fields with $\tau : L \to N$ an $F$-homomorphism, then $\tau(L) \subseteq K$, and there is a $\sigma \in \operatorname{Gal}(K/F)$ with $\sigma|_L = \tau$. We will use this result frequently.

We start off by proving a few simple properties of the sets $\mathcal{I}$ and $\mathcal{N}$.

**Lemma 17.1** If $\alpha_1, \ldots, \alpha_n \in K$, then there is an $E \in \mathcal{I}$ with $\alpha_i \in E$ for all $i$.

**Proof.** Let $E \subseteq K$ be the splitting field of the minimal polynomials of the $\alpha_i$ over $F$. Then, as each $\alpha_i$ is separable over $F$, the field $E$ is normal and separable over $F$; hence, $E$ is Galois over $F$. Since there are finitely many $\alpha_i$, we have $[E:F] < \infty$, so $E \in \mathcal{I}$.
□

**Lemma 17.2** Let $N \in \mathcal{N}$, and set $N = \operatorname{Gal}(K/E)$ with $E \in \mathcal{I}$. Then $E = \mathcal{F}(N)$ and $N$ is normal in $G$. Moreover, $G/N \cong \operatorname{Gal}(E/F)$. Thus, $|G/N| = |\operatorname{Gal}(E/F)| = [E:F] < \infty$.

**Proof.** Since $K$ is normal and separable over $F$, the field $K$ is also normal and separable over $E$, so $K$ is Galois over $E$. Therefore, $E = \mathcal{F}(N)$. As in the proof of the fundamental theorem, the map $\theta : G \to \operatorname{Gal}(E/F)$ given by $\sigma \mapsto \sigma|_E$ is a group homomorphism with kernel $\operatorname{Gal}(K/E) = N$. Proposition 3.28 shows that $\theta$ is surjective. The remaining statements then follow.
□

**Lemma 17.3** We have $\bigcap_{N \in \mathcal{N}} N = \{\mathrm{id}\}$. Furthermore, $\bigcap_{N \in \mathcal{N}} \sigma N = \{\sigma\}$ for all $\sigma \in G$.

**Proof.** Let $\tau \in \bigcap_{N \in \mathcal{N}} N$ and let $a \in K$. By Lemma 17.1, there is an $E \in \mathcal{I}$ with $a \in E$. Set $N = \operatorname{Gal}(K/E) \in \mathcal{N}$. The automorphism $\tau$ fixes $E$ since $\tau \in N$, so $\tau(a) = a$. Thus, $\tau = \mathrm{id}$, so $\bigcap_{N \in \mathcal{N}} N = \{\mathrm{id}\}$. For the second statement, if $\tau \in \sigma N$ for all $N$, then $\sigma^{-1}\tau \in N$ for all $N$; thus, $\sigma^{-1}\tau = \mathrm{id}$ by the first part. This yields $\tau = \sigma$, so $\bigcap_{N \in \mathcal{N}} \sigma N = \{\sigma\}$.
□

**Lemma 17.4** Let $N_1, N_2 \in \mathcal{N}$. Then $N_1 \cap N_2 \in \mathcal{N}$.

**Proof.** Let $N_i = \operatorname{Gal}(K/E_i)$ with $E_i \in \mathcal{I}$. Each $E_i$ is finite Galois over $F$; hence, $E_1 E_2$ is also finite Galois over $F$, so $E_1 E_2 \in \mathcal{I}$. However, $\operatorname{Gal}(K/E_1 E_2) = N_1 \cap N_2$; to see this, we note that $\sigma \in N_1 \cap N_2$ if and only if $\sigma|_{E_1} = \mathrm{id}$ and $\sigma|_{E_2} = \mathrm{id}$, if and only if $E_1 \subseteq \mathcal{F}(\sigma)$ and $E_2 \subseteq \mathcal{F}(\sigma)$, and if and only if $E_1 E_2 \subseteq \mathcal{F}(\sigma)$. This last condition is true if and only if $\sigma \in \operatorname{Gal}(K/E_1 E_2)$. Thus, $N_1 \cap N_2 = \operatorname{Gal}(K/E_1 E_2) \in \mathcal{N}$.
□

We can now define a topology on the Galois group $G$.

**Definition 17.5** The *Krull topology* on $G$ is defined as follows: A subset $X$ of $G$ is open if $X = \emptyset$ or if $X = \bigcup_i \sigma_i N_i$ for some $\sigma_i \in G$ and $N_i \in \mathcal{N}$.

From the definition, it is clear that $G$ and $\emptyset$ are open sets and that the union of open sets is open. To show that we do indeed have a topology on $G$, it remains to see that the intersection of two open sets is again open. It is sufficient to show that $\tau_1 N_1 \cap \tau_2 N_2$ is open for any $N_1, N_2 \in \mathcal{N}$. To see this, if $\sigma \in \tau_1 N_1 \cap \tau_2 N_2$, then

$$
\tau_1 N_1 \cap \tau_2 N_2 = \sigma N_1 \cap \sigma N_2 = \sigma(N_1 \cap N_2),
$$

and $\sigma(N_1 \cap N_2)$ is open, since $N_1 \cap N_2 \in \mathcal{N}$ by Lemma 17.4.

We point out some properties of the Krull topology. Since each nonempty open set of $G$ is a union of cosets of subgroups of $\mathcal{N}$, the set

$$
\{\sigma N : \sigma \in G,\ N \in \mathcal{N}\}
$$

is a basis for the Krull topology. If $N \in \mathcal{N}$, then $|G:N| < \infty$, so $G - \sigma N$ is a union of finitely many cosets of $N$. Therefore, $\sigma N$ is both open and closed. A set that is both closed and open is called *clopen*. The Krull topology thus has a basis of clopen sets. While the existence of nontrivial clopen sets is not common in more familiar topologies such as the usual topologies on $\mathbb{R}$ or $\mathbb{C}$, it is common for topologies arising in algebra. The following theorem describes the topology on $G$. Recall that a topological space is totally disconnected if the only connected subsets are single points.

**Theorem 17.6** As a topological space, $G$ is Hausdorff, compact, and totally disconnected.

**Proof.** If $X$ is a subset of $G$ and $\sigma, \tau \in X$, let $\sigma N$ be an open neighborhood of $\sigma$ not containing $\tau$. The existence of $N$ follows from Lemma 17.3. Then

$$
X = (\sigma N \cap X) \cup ((G - \sigma N) \cap X),
$$

an intersection of two disjoint, nonempty open sets in $X$, so $X$ is not connected. Therefore, $G$ is totally disconnected. To show that $G$ is Hausdorff, let $\sigma \in G$. Lemma 17.3 shows that $\{\sigma\} = \bigcap_N \sigma N$. If $\tau \neq \sigma$, then there is an $N \in \mathcal{N}$ with $\tau \notin \sigma N$. Each $\sigma N$ is an open neighborhood of $\sigma$ but is also closed, as noted above. Thus, $\sigma N$ and $G - \sigma N$ are disjoint open sets with $\sigma \in \sigma N$ and $\tau \in G - \sigma N$, so $G$ is Hausdorff.

The most difficult part of the proof is to show that $G$ is compact. In proving that $G$ is compact, we will indirectly show how $G$ can be constructed from finite Galois groups. Let $P$ be the direct product $\prod_{N \in \mathcal{N}} G/N$ of the finite groups $G/N$. We make $P$ into a topological space by giving each $G/N$ the discrete topology and then giving $P$ the product topology. Note that each $G/N$ is both Hausdorff and compact, so $P$ is Hausdorff, and by the Tychonoff theorem, $P$ is compact. There is a natural group homomorphism $f : G \to P$ defined by $f(\sigma) = \{\sigma N\}$. We will show $f$ is a homeomorphism from $G$ to the image of $f$ and that this image is a closed subset of $P$. Since $P$ is compact and Hausdorff, this will show that $\operatorname{im}(f)$ is compact, hence $G$ is compact, since $G$ is homeomorphic to $\operatorname{im}(f)$.

Let $f$ be as above. The kernel of $f$ consists of those $\sigma \in G$ with $\{\sigma N\} = \{N\}$. Therefore, if $\sigma \in \ker(f)$, then $\sigma \in \bigcap_{N \in \mathcal{N}} N = \{\mathrm{id}\}$; this equality holds by Lemma 17.3. Thus, $f$ is injective. Let $\pi_N : P \to G/N$ be the projection onto the $N$-component. Then $\pi_N(f(\sigma)) = \sigma N$ for any $\sigma \in G$. The singleton sets $\tau N$ form a basis for the discrete topology on $G/N$, so by definition of the product topology, every open set in $P$ is a union of a finite intersection of sets of the form $\pi_N^{-1}(\tau N)$ for various $\tau \in G$ and $N \in \mathcal{N}$. To show that $f$ is continuous, it is enough to show that $f^{-1}(\pi_N^{-1}(\{\tau N\}))$ is open in $G$ for any $\tau N$. But this preimage is just $\tau N$, which is open, so $f$ is continuous. Furthermore, $f(\tau N) = \pi_N^{-1}(\{\tau N\}) \cap \operatorname{im}(f)$ is open in $\operatorname{im}(f)$, so $f^{-1}$ is also continuous. Therefore, $f$ is a homeomorphism from $G$ to $\operatorname{im}(f)$. It remains to show that $\operatorname{im}(f)$ is closed in $P$. In verifying that $\operatorname{im}(f)$ is closed in $P$, we will identify $G/N$ with the isomorphic group $\operatorname{Gal}(E_N/F)$, where $E_N = \mathcal{F}(N)$. This isomorphism is from Lemma 17.2. This amounts to identifying the coset $\tau N$ with $\tau|_{E_N}$. With this identification, for $\rho \in P$ the element $\pi_N(\rho)$ is an automorphism of $E_N$. Note that for $\tau \in G$ we have $\pi_N(f(\tau)) = \tau|_{E_N}$. Let

$$
C = \{\, \rho \in P : \text{for each } N, M \in \mathcal{N},\ \pi_N(\rho)|_{E_N \cap E_M} = \pi_M(\rho)|_{E_N \cap E_M} \,\}.
$$

We claim that $C = \operatorname{im}(f)$. Now, $\operatorname{im}(f) \subseteq C$ since $\pi_N(f(\tau))|_{E_N} = \tau|_{E_N}$ for any $\tau \in G$. For the reverse inclusion, let $\rho \in C$. We define $\tau : K \to K$ as follows. For $a \in K$, pick any $E_N \in \mathcal{I}$ with $a \in E_N$, possible by Lemma 17.1, and define $\tau(a) = \pi_N(\rho)(a)$. The condition on $\rho$ to be an element of $C$ shows that this is a well-defined map. To see that $\tau$ is a ring homomorphism, if $a, b \in K$, let $E_N \in \mathcal{I}$ with $a, b \in E_N$. Then $\tau|_{E_N} = \pi_N(\rho)$ is a ring homomorphism, so $\tau(a+b) = \tau(a) + \tau(b)$ and $\tau(ab) = \tau(a)\tau(b)$. The map $\tau$ is a bijection, since we can construct $\tau^{-1}$ by using $\rho^{-1}$. It is clear that $\tau$ fixes $F$, so $\tau \in G$. Now, as $\tau|_{E_N} = \pi_N(\rho)$, we see that $f(\tau) = \rho$. Thus, $C = \operatorname{im}(f)$. To show that $C$ is closed in $P$, take any $\rho \in P$ with $\rho \notin C$. Then there are $N, M \in \mathcal{N}$ with $\pi_N(\rho)|_{E_N \cap E_M} \neq \pi_M(\rho)|_{E_N \cap E_M}$. Thus, $\pi_N^{-1}(\pi_N(\rho)) \cap \pi_M^{-1}(\pi_M(\rho))$ is an open subset of $P$ containing $\rho$ and disjoint from $C$. Therefore, $P - C$ is open, so $C = \operatorname{im}(f)$ is closed.
□

The set $\mathcal{N}$, ordered by reverse inclusion, is a directed set. That is, if $N_1, N_2 \in \mathcal{N}$, then there is an $N_3 \in \mathcal{N}$ with $N_3 \subseteq N_1 \cap N_2$, namely $N_3 = N_1 \cap N_2$. The set $\{G/N : N \in \mathcal{N}\}$ together with the natural projection maps $G/N_1 \to G/N_2$ for $N_1 \subseteq N_2$ form a directed system of groups. The proof that $G = \operatorname{im}(f)$ can be viewed as showing that $G$ is the inverse limit of the set of finite groups $\{G/N\}$ (see Problem 14). The inverse limit of a set of finite groups is called a *profinite group*. For more information on profinite groups, see Shatz [25], Serre [24], or Appendix C.

The next theorem is the final step we need to extend the fundamental theorem to arbitrary Galois extensions. This theorem shows how the topology on $G$ comes in, and it is the analog of Proposition 2.14, which says that if $G$ is a finite group of automorphisms of $K$, then $G = \operatorname{Gal}(K/\mathcal{F}(G))$.

**Theorem 17.7** Let $H$ be a subgroup of $G$, and let $H' = \operatorname{Gal}(K/\mathcal{F}(H))$. Then $H' = \overline{H}$, the closure of $H$ in the topology of $G$.

**Proof.** It is clear that $H \subseteq H'$, so it suffices to show that $H'$ is closed and that $H' \subseteq \overline{H}$. To show that $H'$ is closed, take any $\sigma \in G - H'$. Then there is an $\alpha \in \mathcal{F}(H)$ with $\sigma(\alpha) \neq \alpha$. Take $E \in \mathcal{I}$ with $\alpha \in E$, and let $N = \operatorname{Gal}(K/E) \in \mathcal{N}$. Then, for any $\tau \in N$, we have $\tau(\alpha) = \alpha$, so $\sigma\tau(\alpha) = \sigma(\alpha) \neq \alpha$. Hence, $\sigma N$ is an open neighborhood of $\sigma$ disjoint from $H'$. Therefore, $G - H'$ is open, so $H'$ is closed. To prove the inclusion $H' \subseteq \overline{H}$, we first set $L = \mathcal{F}(H)$. Let $\sigma \in H'$ and $N \in \mathcal{N}$. Set $E = \mathcal{F}(N) \in \mathcal{I}$, and let $H_0 = \{\rho|_E : \rho \in H\}$, a subgroup of the finite group $\operatorname{Gal}(E/F)$. Since $\mathcal{F}(H_0) = \mathcal{F}(H) \cap E = L \cap E$, the fundamental theorem for finite Galois extensions shows that $H_0 = \operatorname{Gal}(E/(E \cap L))$. Since $\sigma \in H'$, we have $\sigma|_L = \mathrm{id}$, so $\sigma|_E \in H_0$. Therefore, there is a $\rho \in H$ with $\rho|_E = \sigma|_E$. Thus, $\sigma^{-1}\rho \in \operatorname{Gal}(K/E) = N$, so $\rho \in \sigma N \cap H$. This shows that every basic open neighborhood $\sigma N$ of $\sigma \in H'$ meets $H$, so $\sigma \in \overline{H}$. This proves the inclusion $H' \subseteq \overline{H}$ and finishes the proof.
□

A way to describe $H' = \operatorname{Gal}(K/\mathcal{F}(H))$ that does not involve the topology on $G$ is $H' = \bigcap_{N \in \mathcal{N}} H N$ (see Problem 1).

**Theorem 17.8 (Fundamental Theorem of Infinite Galois Theory)** Let $K$ be a Galois extension of $F$, and let $G = \operatorname{Gal}(K/F)$. With the Krull topology on $G$, the maps $L \mapsto \operatorname{Gal}(K/L)$ and $H \mapsto \mathcal{F}(H)$ give an inclusion reversing correspondence between the fields $L$ with $F \subseteq L \subseteq K$ and the closed subgroups $H$ of $G$. Furthermore, if $L \leftrightarrow H$, then $|G:H| < \infty$ if and only if $[L:F] < \infty$, if and only if $H$ is open. When this occurs, $|G:H| = [L:F]$. Also, $H$ is normal in $G$ if and only if $L$ is Galois over $F$, and when this occurs, there is a group isomorphism $\operatorname{Gal}(L/F) \cong G/N$. If $G/N$ is given the quotient topology, this isomorphism is also a homeomorphism.

**Proof.** If $L$ is a subfield of $K$ containing $F$, then $K$ is normal and separable over $L$, so $K$ is Galois over $L$. Thus, $L = \mathcal{F}(\operatorname{Gal}(K/L))$. If $H$ is a subgroup of $G$, then Theorem 17.7 shows that $H = \operatorname{Gal}(K/\mathcal{F}(H))$ if and only if $H$ is closed. The two maps $L \mapsto \operatorname{Gal}(K/L)$ and $H \mapsto \mathcal{F}(H)$ then give an inclusion reversing correspondence between the set of intermediate fields of $K/F$ and the set of closed subgroups of $G$.

Let $L$ be an intermediate field of $K/F$, and let $H = \operatorname{Gal}(K/L)$. Suppose that $|G:H| < \infty$. Then $G - H$ is a finite union of cosets of $H$, each of which is closed, since $H$ is closed. Thus, $G - H$ is closed, so $H$ is open. Conversely, if $H$ is open, then $H$ contains some basic neighborhood of $\mathrm{id}$, so $N \subseteq H$ for some $N \in \mathcal{N}$. If $E = \mathcal{F}(N)$, then $L \subseteq E$, so $[L:F] < \infty$. Finally, if $[L:F] < \infty$, then choose an $E \in \mathcal{I}$ with $L \subseteq E$, possible by Lemma 17.1. Let $N = \operatorname{Gal}(K/E)$. Then $N \subseteq H$, since $L \subseteq E$, so $|G:H| \le |G:N| < \infty$. By Lemma 17.2, we have $G/N \cong \operatorname{Gal}(E/F)$ via the map $\sigma N \mapsto \sigma|_E$. Thus, $H/N$ maps to $\{\rho|_E : \rho \in H\}$, a subgroup of $\operatorname{Gal}(E/F)$ with fixed field $L \cap E = L$. By the fundamental theorem for finite extensions, the order of this group is $[E:L]$. Therefore,

$$
\begin{aligned}
|G:H| &= |G/N : H/N| = \frac{|G/N|}{|H/N|} = \frac{[E:F]}{[E:L]} \\
&= [L:F].
\end{aligned}
$$

For the statement about normality, we continue to assume that $H = \operatorname{Gal}(K/L)$. Suppose that $H$ is a normal subgroup of $G$. Let $a \in L$, and let $f(x) = \min(F, a)$. If $b \in K$ is any root of $f$, by the isomorphism extension theorem there is a $\sigma \in G$ with $\sigma(a) = b$. To see that $b \in L$, take $\tau \in H$. Then

$$
\begin{aligned}
\tau(b) &= \sigma^{-1}(\sigma\tau\sigma^{-1}(a)) \\
&= \sigma^{-1}(a) = b
\end{aligned}
$$

since $\sigma\tau\sigma^{-1} \in H$, as $H$ is normal in $G$. Thus, $b \in \mathcal{F}(H) = L$, so $f$ splits over $L$. This proves that $L$ is normal over $F$, and $L$ is separable over $F$ since $K/F$ is separable. Therefore, $L$ is Galois over $F$. Conversely, if $L$ is Galois over $F$, then by the remark before Lemma 17.1 we see that the map $\sigma \mapsto \sigma|_L$ is a well-defined group homomorphism $\theta : G \to \operatorname{Gal}(L/F)$. The kernel of $\theta$ is $\operatorname{Gal}(K/L) = H$, so $H$ is normal in $G$, and $\theta$ is surjective by an application of the isomorphism extension theorem. Thus, $G/H \cong \operatorname{Gal}(L/F)$.

The last step of the proof is to show that the natural map $\nu : G/H \to \operatorname{Gal}(L/F)$ is a homeomorphism when $H$ is normal in $G$. Note that a basic open subset of $\operatorname{Gal}(L/F)$ has the form $\rho \operatorname{Gal}(L/E)$ for some extension $E$ that is finite Galois over $F$ and is contained in $L$. Let $N = \operatorname{Gal}(K/E) \in \mathcal{N}$. Then $\theta^{-1}(\operatorname{Gal}(L/E)) = N$. Thus, $\theta^{-1}(\rho \operatorname{Gal}(L/E)) = \tau N$ for any $\tau \in G$ with $\tau|_L = \rho$, so this preimage is open in $G$. Therefore, $\theta$ is continuous. Furthermore, the image of a compact set under a continuous map is compact, and any compact subset of a Hausdorff space is closed. Since $G$ is compact and $\operatorname{Gal}(L/F)$ is Hausdorff, $\theta$ maps closed sets to closed sets; that is, $\theta$ is a closed map. The map $\nu : G/H \to \operatorname{Gal}(L/F)$ induced from $\theta$ is then also continuous and closed when $G/H$ is given the quotient topology, so $\nu$ is a homeomorphism.
□

**Example 17.9** Let $K/F$ be a Galois extension with $[K:F] < \infty$. Then the Krull topology on $\operatorname{Gal}(K/F)$ is the discrete topology; hence, every subgroup of $\operatorname{Gal}(K/F)$ is closed. Thus, we recover the original fundamental theorem of Galois theory from Theorem 17.8.

**Example 17.10** Let $K = \mathbb{Q}(\{\, e^{2\pi i k/n} : k, n \in \mathbb{N} \,\})$ be the field generated over $\mathbb{Q}$ by all roots of unity in $\mathbb{C}$. Then $K$ is the splitting field over $\mathbb{Q}$ of the set $\{z^n - 1 : n \in \mathbb{N}\}$, so $K/\mathbb{Q}$ is Galois. If $L$ is a finite Galois extension of $\mathbb{Q}$ contained in $K$, then $L$ is contained in a cyclotomic extension of $\mathbb{Q}$. The Galois group of a cyclotomic extension is Abelian. Consequently, $\operatorname{Gal}(L/F)$ is Abelian. To see that $\operatorname{Gal}(K/F)$ is Abelian, by the proof of Theorem 17.8 the Galois group $\operatorname{Gal}(K/F)$ is isomorphic to a subgroup of the direct product of the $\operatorname{Gal}(L/F)$ as $L$ ranges over finite Galois subextensions of $\mathbb{Q}$, so $\operatorname{Gal}(K/F)$ is Abelian. As a consequence of this fact, any subextension of $K/\mathbb{Q}$ is a Galois extension of $\mathbb{Q}$.

We give an alternate proof that $\operatorname{Gal}(K/F)$ is Abelian that does not use the proof of Theorem 17.8. Take $\sigma, \tau \in \operatorname{Gal}(K/\mathbb{Q})$. If $a \in K$, then there is an intermediate field $L$ of $K/\mathbb{Q}$ that is Galois over $\mathbb{Q}$ and that $a \in L$. The restrictions $\sigma|_L, \tau|_L$ are elements of $\operatorname{Gal}(L/\mathbb{Q})$, and this group is Abelian by the previous paragraph. Thus,

$$
\sigma(\tau(a)) = \sigma|_L(\tau|_L(a)) = \tau|_L(\sigma|_L(a)) = \tau(\sigma(a)).
$$

Consequently, $\sigma\tau = \tau\sigma$, so $\operatorname{Gal}(K/\mathbb{Q})$ is Abelian.

**Example 17.11** Let $K$ be an algebraic closure of $\mathbb{F}_p$. Since $\mathbb{F}_p$ is perfect, $K$ is separable, and hence $K$ is Galois over $\mathbb{F}_p$. Let $\sigma : K \to K$ be defined by $\sigma(a) = a^p$. Then $\sigma \in G = \operatorname{Gal}(K/\mathbb{F}_p)$, and the fixed field of the cyclic subgroup $H$ of $G$ generated by $\sigma$ is $\mathbb{F}_p$. However, we prove that $H \neq G$ by constructing an automorphism of $K$ that is not in $H$. To see this, pick an integer $n_r$ for each $r \in \mathbb{N}$ such that if $r$ divides $s$, then $n_s \equiv n_r \pmod{r}$. If $F_r$ is the subfield of $K$ containing $p^r$ elements, then define $\tau$ by $\tau(a) = \sigma^{n_r}(a)$ if $a \in F_r$. The conditions on the $n_r$ show that $\tau$ is well defined, and an easy argument shows that $\tau$ is an automorphism of $K$ that fixes $\mathbb{F}_p$. For a specific example of a choice of the $n_r$, for $r \in \mathbb{N}$, write $r = p^m q$ with $q$ not a multiple of $p$. Let $n_r$ satisfy

$$
\begin{aligned}
n_r &\equiv 1 + p + \cdots + p^{m-1} \pmod{p^m}, \\
n_r &\equiv 0 \pmod{q}.
\end{aligned}
$$

Such integers exist by the Chinese remainder theorem of number theory, since $p^m$ and $q$ are relatively prime. If $\tau = \sigma^t$ for some $t$, then for all $r$, $\tau|_{F_r} = \sigma^t|_{F_r}$, so $n_r = t \pmod{r}$, as $\operatorname{Gal}(F_r/\mathbb{F}_p)$ is the cyclic group generated by $\sigma|_{F_r}$, which has order $r$. This cannot happen as $n_{p^m} \to \infty$ as $m \to \infty$. Therefore, $\tau \notin H$, so $H$ is not a closed subgroup of $G$. The group $G$ is obtained topologically from $H$, since $G = \overline{H}$ by Theorem 17.7. The argument that $G = \operatorname{im}(f)$ in the proof of Theorem 17.6 shows that any element of $G$ is obtained by the construction above, for an appropriate choice of the $n_r$. This gives a description of the Galois group $G$ as

$$
\operatorname{Gal}(K/\mathbb{F}_p) \cong \left\{\, \{n_r\} \in \prod_r \mathbb{P}_r : \text{if } r \text{ divides } s, \text{ then } n_s \equiv n_r \pmod{r} \,\right\}.
$$
