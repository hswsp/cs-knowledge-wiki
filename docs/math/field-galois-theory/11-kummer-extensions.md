# 11. Kummer Extensions（Kummer 扩张）

In Section 9, we described Galois extensions with cyclic Galois groups under certain restrictions on the base field. We use the results proved there together with the fundamental theorem of finite Abelian groups to characterize Galois extensions with an Abelian Galois group, provided that the base field has sufficient roots of unity.

**Definition 11.1.** Let $F$ be a field containing a primitive $n$th root of unity. A Galois extension $K$ of $F$ is called an $n$-Kummer extension of $F$ provided that $\operatorname{Gal}(K/F)$ is an Abelian group whose exponent divides $n$. If $K$ is an $n$-Kummer extension of $F$ for some $n$, then $K/F$ is called a Kummer extension.

**Example 11.2.** If $F$ is a field that contains a primitive $n$th root of unity, and if $K/F$ is a cyclic extension of degree $n$, then $K/F$ is an $n$-Kummer extension. If $F$ also contains a primitive $m$th root of unity for some $m$ that is a multiple of $n$, then $K/F$ is also an $m$-Kummer extension. Therefore, if an extension is an $n$-Kummer extension, the integer $n$ need not be unique.

**Example 11.3.** Let $K = \mathbb{Q}(\sqrt{2}, \sqrt{3})$. The field $K$ is the splitting field of $(x^2 - 2)(x^2 - 3)$ over $\mathbb{Q}$, so $K$ is a Galois extension of $\mathbb{Q}$. A short calculation shows that $[K : \mathbb{Q}] = 4$, and the Galois group of $K/\mathbb{Q}$ consists of the four automorphisms
$$
\begin{aligned}
\mathrm{id} &: \sqrt{2} \to \sqrt{2}, \quad \sqrt{3} \to \sqrt{3}, \\
\sigma &: \sqrt{2} \to -\sqrt{2}, \quad \sqrt{3} \to \sqrt{3}, \\
\tau &: \sqrt{2} \to \sqrt{2}, \quad \sqrt{3} \to -\sqrt{3}, \\
\sigma\tau &: \sqrt{2} \to -\sqrt{2}, \quad \sqrt{3} \to -\sqrt{3}.
\end{aligned}
$$
The Galois group $\operatorname{Gal}(K/\mathbb{Q})$ is isomorphic to $\mathbb{Z}/2\mathbb{Z} \times \mathbb{Z}/2\mathbb{Z}$, an Abelian group of exponent $2$. Since $\mathbb{Q}$ contains the primitive second root of unity, $-1$, the extension $K/\mathbb{Q}$ is a $2$-Kummer extension.

The fundamental theorem of finite Abelian groups says that any such group is a direct product of cyclic groups. Using this fact together with the fundamental theorem of Galois theory and the characterization of cyclic extensions in Section 9, we obtain the following characterization of Kummer extensions.

**Theorem 11.4.** Let $F$ be a field containing a primitive $n$th root of unity, and let $K$ be a finite extension of $F$. Then $K/F$ is an $n$-Kummer extension if and only if $K = F(\sqrt[n]{a_1}, \dots, \sqrt[n]{a_r})$ for some $a_i \in F$.

**Proof.** Suppose that $K = F(\alpha_1, \dots, \alpha_r)$ with $\alpha_i^n = a_i \in F$. If $\omega \in F$ is a primitive $n$th root of unity, then the distinct elements $\alpha_i, \omega\alpha_i, \dots, \omega^{n-1}\alpha_i$ are all the roots of $x^n - a_i$ in $K$. Thus, $x^n - a_i$ is separable over $F$ and splits over $K$. Hence, $K$ is the splitting field of the set $\{x^n - a_i : 1 \le i \le r\}$, so $K/F$ is Galois by Theorem 4.9. If $\sigma \in \operatorname{Gal}(K/F)$, then $\sigma(\alpha_i) = \omega^j \alpha_i$ for some $j$ since $\sigma(\alpha_i)$ is also a root of $x^n - a_i$. For each $k$, we see that $\sigma^k(\alpha_i) = \omega^{kj}\alpha_i$, so $\sigma^n(\alpha_i) = \alpha_i$. This is true for each $i$, and since the $\alpha_i$ generate $K$ over $F$, we see that $\sigma^n = \mathrm{id}$. Therefore, the exponent of $\operatorname{Gal}(K/F)$ divides $n$. To prove that $\operatorname{Gal}(K/F)$ is Abelian, take $\sigma, \tau \in \operatorname{Gal}(K/F)$. Given $i$, set $\sigma(\alpha_i) = \omega^j \alpha_i$ and $\tau(\alpha_i) = \omega^k \alpha_i$. Then
$$
(\sigma\tau)(\alpha_i) = \sigma(\omega^k \alpha_i) = \omega^k \omega^j \alpha_i
$$
and
$$
(\tau\sigma)(\alpha_i) = \tau(\omega^j \alpha_i) = \omega^j \omega^k \alpha_i.
$$
Thus, $\sigma\tau$ and $\tau\sigma$ agree on the generators of $K$, so $\sigma\tau = \tau\sigma$. In other words, $\operatorname{Gal}(K/F)$ is Abelian.

For the converse, suppose that $K/F$ is Galois with $G = \operatorname{Gal}(K/F)$ an Abelian group whose exponent divides $n$. By the fundamental theorem of finite Abelian groups, $G = C_1 \times \cdots \times C_r$, where each $C_i$ is cyclic. Note that each $|C_i|$ divides $n$. Let $H_i = C_1 \times \cdots \times C_{i-1} \times C_{i+1} \times \cdots \times C_r$, a subgroup of $G$ with $G/H_i \cong C_i$. Let $L_i$ be the fixed field of $H_i$. Then $L_i$ is Galois over $F$, since $H_i$ is normal in $G$, and $\operatorname{Gal}(L_i/F) \cong G/H_i \cong C_i$. Therefore, $L_i/F$ is cyclic Galois. Let $[L_i : F] = m_i$. Then $m_i = |C_i|$, so $m_i$ divides $n$. The field $F$ contains the primitive $m_i$th root of unity $\omega^{n/m_i}$, so by Theorem 9.5, $L_i = F(\alpha_i)$ for some $\alpha_i \in L_i$ with $\alpha_i^{m_i} \in F$. Since $m_i$ divides $n$, we see that $\alpha_i^n = a_i \in F$. Under the Galois correspondence, the field $F(\alpha_1, \dots, \alpha_r) = L_1 \cdots L_r$ corresponds to the group $H_1 \cap \cdots \cap H_r$. However, this intersection is $\{\mathrm{id}\}$, so $F(\alpha_1, \dots, \alpha_r)$ corresponds to $\{\mathrm{id}\}$. Thus, $K = F(\alpha_1, \dots, \alpha_r) = F(\sqrt[n]{a_1}, \dots, \sqrt[n]{a_r})$.
□

**Example 11.5.** If $K = \mathbb{Q}(\sqrt{a_1}, \dots, \sqrt{a_r})$ for some $a_i \in \mathbb{Q}$, then $K/\mathbb{Q}$ is a $2$-Kummer extension by Theorem 11.4. The degree of $K/F$ is no larger than $2^r$, but it may be less depending on the choice of the $a_i$. Problem 1 shows that the degree is $2^r$ if the $a_i$ are distinct primes. However, $\mathbb{Q}(\sqrt{2}, \sqrt{3}, \sqrt{6})$ has degree $4$ over $\mathbb{Q}$, not degree $8$.

**Example 11.6.** Let $F = \mathbb{Q}(i)$, where $i = \sqrt{-1}$, and let $K = F(\sqrt[4]{12}, \sqrt[4]{3})$. Since $i$ is a primitive fourth root of unity, $K/F$ is a $4$-Kummer extension. The degree of $K/F$ is $8$, not $16$, since $K = F(\sqrt{2}, \sqrt[4]{3})$; this equality is true because $\sqrt[4]{12} = \sqrt{2}\sqrt[4]{3}$. This example shows that if $K = F(\alpha_1, \dots, \alpha_n)$ is an $n$-Kummer extension of $F$ with $\alpha_i^n \in F$, it might be the case that a smaller power of some of the $\alpha_i$ is also in $F$.

If $F$ contains a primitive $n$th root of unity, then $F(\sqrt[n]{a_1}, \dots, \sqrt[n]{a_r})$ is an $n$-Kummer extension of $F$. A basic question is to find its degree over $F$. Certainly, this degree is no larger than $n^r$. However, as the examples above show, the degree might be less than $n^r$. We proved in Proposition 9.6 that $[F(\sqrt[n]{a}) : F]$ is equal to the order of $aF^{*n}$ in the group $F^*/F^{*n}$. We obtain an analogous result for Kummer extensions below. However, this is a harder result, and it requires more machinery to prove. It turns out that the concept of a bilinear pairing is the right tool to investigate this question about degrees.

**Definition 11.7.** Let $G$ and $H$ be finite Abelian groups, and let $C$ be a cyclic group. A function $B : G \times H \to C$ is called a bilinear pairing if $B$ is a homomorphism in each component; that is, $B(g_1g_2, h) = B(g_1, h)B(g_2, h)$ for all $g_1, g_2 \in G$ and all $h \in H$, and $B(g, h_1h_2) = B(g, h_1)B(g, h_2)$ for all $g \in G$ and all $h_1, h_2 \in H$. The pairing $B$ is called nondegenerate if $B(g, h) = e$ for all $h \in H$ only if $g = e$, and if $B(g, h) = e$ for all $g \in G$ only if $h = e$.

Let $K/F$ be an $n$-Kummer extension, and let $\mu(F)$ be the set of all $n$th roots of unity in $F$. Then $\mu(F)$ is a cyclic group by Theorem 6.1. Also, let
$$
\mathrm{KUM}(K/F) = \{a \in K^* : a^n \in F\}.
$$
The set $\mathrm{KUM}(K/F)$ is a subgroup of $K^*$. Note that $\mathrm{KUM}(K/F)$ contains $F^*$, and if $K = F(\sqrt[n]{a_1}, \dots, \sqrt[n]{a_r})$, it also contains each $\sqrt[n]{a_i}$. Finally, let
$$
\mathrm{kum}(K/F) = \mathrm{KUM}(K/F)/F^*.
$$
We now relate bilinear pairings to Kummer extensions. We define the *Kummer pairing*
$$
B : \operatorname{Gal}(K/F) \times \mathrm{kum}(K/F) \to \mu(F)
$$
by
$$
B(\sigma, aF^*) = \sigma(a)/a.
$$
This map is well defined, since if $aF^* = \beta F^*$, then $\alpha = a\beta$ for some $a \in F^*$. Thus, $\sigma(\alpha)/\alpha = \sigma(a\beta)/a\beta = \sigma(\beta)/\beta$, since $\sigma(a) = a$.

We show that $B$ is a nondegenerate bilinear pairing below. But first, we prove a general result about bilinear pairings that allows us to exploit the Kummer pairing to answer questions about Kummer extensions.

**Lemma 11.8.** Let $B : G \times H \to C$ be a bilinear pairing. If $h \in H$, let $B_h : G \to C$ be defined by $B_h(g) = B(g, h)$. Then the map $\varphi : h \mapsto B_h$ is a group homomorphism from $H$ to $\operatorname{hom}(G, C)$. If $B$ is nondegenerate, then $\exp(G)$ divides $|C|$, the map $\varphi$ is injective, and $\varphi$ induces an isomorphism $G \cong H$.

**Proof.** The property $B(g, h_1h_2) = B(g, h_1)B(g, h_2)$ translates to $B_{h_1h_2} = B_{h_1}B_{h_2}$. Thus, $\varphi(h_1h_2) = \varphi(h_1)\varphi(h_2)$, so $\varphi$ is a homomorphism. The kernel of $\varphi$ is
$$
\begin{aligned}
\ker(\varphi) &= \{h \in H : B_h = 0\} \\
&= \{h \in H : B(g, h) = e \text{ for all } g \in G\}.
\end{aligned}
$$
If $B$ is nondegenerate, then $\ker(\varphi) = \{e\}$, so $\varphi$ is injective. Suppose that $m = |C|$. Then
$$
e = B(e, h) = B(g, h)^m = B(g^m, h).
$$
Nondegeneracy of $B$ forces $g^m = e$, so $\exp(G)$ divides $|C|$. By a group theory exercise (see Problems 4 and 5), $\operatorname{hom}(G, C)$ is isomorphic to the character group $\operatorname{hom}(G, \mathbb{C}^*)$, which is isomorphic to $G$. Therefore, there are group isomorphisms
$$
H \cong \operatorname{im}(\varphi) = \operatorname{hom}(G, C) \cong G.
$$
Since $|H| \le |\operatorname{hom}(G, C)| = |G|$, by symmetry $|G| \le |H|$, so $|G| = |H|$.
□

We now have the tools to investigate the Kummer pairing of a Kummer extension.

**Proposition 11.9.** Let $K$ be an $n$-Kummer extension of $F$, and let $B : \operatorname{Gal}(K/F) \times \mathrm{kum}(K/F) \to \mu(F)$ be the associated Kummer pairing. Then $B$ is nondegenerate. Consequently, $\mathrm{kum}(K/F) \cong \operatorname{Gal}(K/F)$.

**Proof.** First, we show that $B$ is a bilinear pairing. Let $\sigma, \tau \in \operatorname{Gal}(K/F)$ and $aF^* \in \mathrm{kum}(K/F)$. Then
$$
\begin{aligned}
B(\sigma\tau, aF^*) &= \frac{\sigma\tau(a)}{a} = \frac{\sigma(\tau(a))}{\tau(a)} \cdot \frac{\tau(a)}{a} \\
&= \tau\!\left(\frac{\sigma(a)}{a}\right) \cdot \frac{\tau(a)}{a};
\end{aligned}
$$
the final equality is true because $\operatorname{Gal}(K/F)$ is Abelian. But $\sigma(a)^n = a^n$, since $a^n \in F$. Therefore, $\sigma(a)/a$ is an $n$th root of unity, so $\sigma(a)/a \in F$. The automorphism $\tau$ then fixes $\sigma(a)/a$, so
$$
B(\sigma\tau, aF^*) = \frac{\sigma(a)}{a} \cdot \frac{\tau(a)}{a}.
$$
The pairing $B$ is thus linear in the first component. For the second component, if $a, \beta \in \mathrm{KUM}(K/F)$, then
$$
B(\sigma, aF^*\beta F^*) = \frac{\sigma(a\beta)}{a\beta} = \frac{\sigma(a)\sigma(\beta)}{a\beta} = \frac{\sigma(a)}{a} \cdot \frac{\sigma(\beta)}{\beta}.
$$
Therefore, $B$ is a bilinear pairing.

For nondegeneracy, suppose that $\sigma \in \operatorname{Gal}(K/F)$ with $B(\sigma, aF^*) = 1$ for all $aF^* \in \mathrm{kum}(K/F)$. Then $\sigma(a) = a$ for all $a \in \mathrm{KUM}(K/F)$. However, the elements in $\mathrm{KUM}(K/F)$ generate $K$ as a field extension of $F$, and so automorphisms of $K$ are determined by their action on this set. Therefore, $\sigma = \mathrm{id}$. Also, if $B(\sigma, aF^*) = 1$ for all $\sigma \in \operatorname{Gal}(K/F)$, then $\sigma(a) = a$ for all $\sigma$. But then $a \in F(\operatorname{Gal}(K/F))$, and this fixed field is $F$ by the fundamental theorem. Therefore, $aF^* = F^*$, so $B$ is nondegenerate. The isomorphism $\mathrm{kum}(K/F) \cong \operatorname{Gal}(K/F)$ then follows from Lemma 11.8.
□

If $K/F$ is a Galois extension, then $[K : F] = |\operatorname{Gal}(K/F)|$. If, in addition, $K$ is a Kummer extension of $F$, then Proposition 11.9 shows that $[K : F] = |\mathrm{kum}(K/F)|$. Therefore, if we can determine $\mathrm{kum}(K/F)$, then among other things we know the degree of $K/F$. The following result is a generalization of Theorem 9.6.

**Proposition 11.10.** Let $K/F$ be an $n$-Kummer extension. Then there is an injective group homomorphism $f : \mathrm{kum}(K/F) \to F^*/F^{*n}$, given by $f(aF^*) = a^nF^{*n}$. The image of $f$ is then a finite subgroup of $F^*/F^{*n}$ of order equal to $[K : F]$.

**Proof.** It is easy to see that $f$ is well defined and that $f$ preserves multiplication. For injectivity, let $aF^* \in \ker(f)$. Then $a^n \in F^{*n}$, so $a^n = a^n$ for some $a \in F$. Hence, $a/a$ is an $n$th root of unity, and so $a/a \in F$. Therefore, $a \in F$, so $aF^* = F^*$ is the identity. The group $\mathrm{kum}(K/F)$ is then isomorphic to the image of $f$. The final statement of the proposition follows immediately from Proposition 11.9.
□

This proposition can be used in reverse to construct Kummer extensions of a given degree. Let $G$ be a finite Abelian subgroup of $F^*/F^{*n}$. In a fixed algebraic closure of $F$, let
$$
F(G) = F(\{\sqrt[n]{a} : aF^{*n} \in G\}).
$$
Problem 6 shows that $F(G)$ is an $n$-Kummer extension with Galois group $\operatorname{Gal}(F(G)/F) \cong G$, and so $[F(G) : F] = |G|$.

**Example 11.11.** Let $F = \mathbb{C}(x, y, z)$ be the rational function field in three variables over $\mathbb{C}$, and let $K = F(\sqrt[4]{xyz}, \sqrt[4]{y^2z}, \sqrt[4]{xz^2})$. Then $K/F$ is a $4$-Kummer extension. The image of $\mathrm{kum}(K/F)$ in $F^*/F^{*4}$ is generated by the cosets of $xyz$, $yz$, and $xz^2$. For simplicity we will call these three cosets $a, b, c$ respectively. We claim that the subgroup of $F^*/F^{*4}$ generated by $a, b, c$ has order $32$, which shows that $[K : F] = 32$ by Proposition 11.10. The subgroup $\langle a, b \rangle$ of $F^*/F^{*4}$ generated by $a$ and $b$ has order $16$, since the $16$ elements $a^ib^j$ with $1 \le i, j \le 4$ are all distinct. To see this, suppose that $a^ib^j = a^kb^l$. Then there is an $h \in F^*$ with
$$
(xyz)^i(y^2z)^j = (xyz)^k(y^2z)^lh^4.
$$
Writing $h = f/g$ with $f, g \in \mathbb{C}[x, y, z]$ relatively prime gives
$$
(xyz)^i(y^2z)^jf(x, y, z) = (xyz)^k(y^2z)^lg(x, y, z)^4.
$$
By unique factorization, comparing powers of $x$ and $z$ on both sides of this equation, we obtain
$$
i \equiv k \pmod{4}, \qquad i + j \equiv k + l \pmod{4}.
$$
These equations force $i \equiv k \pmod{4}$ and $j \equiv l \pmod{4}$, so the elements $a^ib^j$ for $1 \le i, j \le 4$ are indeed distinct. Note that $abc = x^2y^2z^4F^{*4}$, so $(abc)^2 = x^4y^4z^8F^{*4} = F^{*4}$. Therefore, $c^2 = (ab)^2$, so either the subgroup $\langle a, b, c \rangle$ of $F^*/F^{*4}$ generated by $a, b, c$ is equal to $\langle a, b \rangle$, or $\langle a, b \rangle$ has index $2$ in $\langle a, b, c \rangle$. For the first to happen, we must have $c = a^ib^j$ for some $i, j$. This leads to an equation
$$
xz^2f(x, y, z)^4 = (xyz)^i(y^2z)^jg(x, y, z)^4
$$
for some polynomials $f, g$. Again applying unique factorization and equating powers of $x$ and $y$ gives $1 \equiv i \pmod{4}$ and $0 \equiv i + 2j \pmod{4}$. A simultaneous solution of these equations does not exist, so $c$ is not in the group $\langle a, b \rangle$, so $\langle a, b \rangle$ has index $2$ in $\langle a, b, c \rangle$. This proves that $\langle a, b, c \rangle$ has order $32$, as we wanted to show.
