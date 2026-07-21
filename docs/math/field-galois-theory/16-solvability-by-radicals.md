# 16. Solvability by Radicals（根式可解性）

In this section, we address one of the driving forces of mathematics for hundreds of years, the solvability of polynomial equations. As we saw in Section 13, formulas for the roots of cubic and quartic polynomials are known and had been found by the mid-sixteenth century. While it was over a thousand years between the discovery of the quadratic formula and the solution of the cubic, the solution of the quartic came soon after the solution of the cubic. This success led mathematicians to believe that formulas for the roots of polynomials of arbitrary degree could be found. However, nothing had been discovered for polynomials of higher degree until Abel proved in a paper published in 1824 that there is no "algebraic" solution of the quintic; that is, there is no solution that expresses the roots in terms of the coefficients, arithmetic operations, and radicals. The full story of solvability of polynomials was then discovered by Galois, who proved a necessary and sufficient condition for a polynomial to be solvable. His work introduced the notion of a group and was the birth of abstract algebra.

We need to make precise what it means for a polynomial to be solvable. Consider, for example, the polynomial $x^4-6x^2+7$. Its roots are $\pm\sqrt{3\pm\sqrt{2}}$, all of which lie in the extension $\mathbb{Q}(\sqrt{2},\sqrt{3+\sqrt{2}},\sqrt{3-\sqrt{2}})$ of $\mathbb{Q}$. This extension gives rise to the chain of simple extensions

$$\mathbb{Q} \subseteq \mathbb{Q}(\sqrt{2}) \subseteq \mathbb{Q}(\sqrt{2})(\sqrt{3+\sqrt{2}}) \subseteq \mathbb{Q}(\sqrt{2},\sqrt{3+\sqrt{2}})(\sqrt{3-\sqrt{2}}),$$

where each successive field is obtained from the previous one by adjoining the root of an element of the previous field. This example motivates the following definitions.

**Definition 16.1.** A field extension $K$ of $F$ is a radical extension if $K = F(a_1,\dots,a_r)$, such that there are integers $n_1,\dots,n_r$ with $a_1^{n_1} \in F$ and $a_i^{n_i} \in F(a_1,\dots,a_{i-1})$ for all $i > 1$. If $n_1 = \cdots = n_r = n$, then $K$ is called an $n$-radical extension of $F$.

**Definition 16.2.** If $f(x) \in F[x]$, then $f$ is solvable by radicals if there is a radical extension $L/F$ such that $f$ splits over $L$, i.e., $S_f \subseteq L$.

If $K$ and $F$ are as in the first definition, then $K$ is an $n$-radical extension of $F$ for $n = n_1\cdots n_r$ since $a_i^n \in F(a_1,\dots,a_{i-1})$ for each $i$. The definition of radical extension is equivalent to the following statement: $K$ is a radical extension of $F$ if there is a chain of fields

$$F = F_0 \subseteq F_1 \subseteq \cdots \subseteq F_r = K,$$

where $F_{i+1} = F_i(a_i)$ for some $a_i \in F_{i+1}$ with $a_i^{n_i} \in F_i$ for each $i$. From the definition, it follows easily that if $K/F$ is a radical extension and $L/K$ is a radical extension, then $L/F$ is a radical extension.

**Example 16.3.** Any $2$-Kummer extension of a field $F$ of characteristic not $2$ is a $2$-radical extension of $F$ by Theorem 11.4. Also, if $K/F$ is a cyclic extension of degree $n$, and if $F$ contains a primitive $n$th root of unity, then $K$ is an $n$-radical extension of $F$ by Theorem 9.5.

**Example 16.4.** If $K = \mathbb{Q}(\sqrt[4]{2})$, then $K$ is both a $4$-radical extension and a $2$-radical extension of $\mathbb{Q}$. The second statement is true by considering the tower

$$\mathbb{Q} \subseteq \mathbb{Q}(\sqrt{2}) \subseteq \mathbb{Q}(\sqrt{2})(\sqrt{\sqrt{2}}) = \mathbb{Q}(\sqrt[4]{2}).$$

**Example 16.5.** Let $c \in \mathbb{R}$. By Theorem 15.2, $c$ is constructible if and only if there is a tower $\mathbb{Q} = F_0 \subseteq F_1 \subseteq \cdots \subseteq F_r$ such that for each $i$, $F_{i+1} = F_i(\sqrt{a_i})$ for some $a_i \in F_i$, and $c \in F_r$. Therefore, $c$ is constructible if and only if $c$ lies in a subfield $K$ of $\mathbb{R}$ such that $K$ is a $2$-radical extension of $\mathbb{Q}$.

The definition of solvability by radicals does not say that the splitting field of $f$ over $F$ is itself a radical extension. It is possible for $f$ to be solvable by radicals but that its splitting field over $F$ is not a radical extension. However, if $F$ contains "enough" roots of unity, then the splitting field of a solvable polynomial is a radical extension of $F$. For an example of the first statement, see Example 16.13. The second statement is addressed in Problem 3.

The next lemma is the key technical piece of the proof of the characterization of solvability by radicals.

**Lemma 16.6.** Let $K$ be an $n$-radical extension of $F$, and let $N$ be the normal closure of $K/F$. Then $N$ is an $n$-radical extension of $F$.

**Proof.** Let $K = F(a_1,\dots,a_r)$ with $a_i^n \in F(a_1,\dots,a_{i-1})$. We argue by induction on $r$. If $r = 1$, then $K = F(\alpha)$ with $\alpha^n = a \in F$. Then $N = F(\beta_1,\dots,\beta_m)$, where the $\beta_i$ are the roots of $\min(F,\alpha)$. However, this minimal polynomial divides $x^n-a$, so $\beta_i^n = a$. Thus, $N$ is an $n$-radical extension of $F$. Now suppose that $r > 1$. Let $N_0$ be the normal closure of $F(a_1,\dots,a_{r-1})$ over $F$. By induction, $N_0$ is an $n$-radical extension of $F$. Since $N_0$ is the splitting field over $F$ of $\{\min(F,\alpha_i) : 1 \le i \le r-1\}$, and $N$ is the splitting field of all $\min(F,\alpha_i)$, we have $N = N_0(\gamma_1,\dots,\gamma_m)$, where the $\gamma_i$ are roots of $\min(F,\alpha_r)$. Also, $\alpha_r^n = b$ for some $b \in F(\alpha_1,\dots,\alpha_{r-1}) \subseteq N_0$. By the isomorphism extension theorem, for each $i$ there is a $\sigma_i \in \operatorname{Gal}(N/F)$ with $\sigma_i(\alpha_r) = \gamma_i$. Therefore, $\gamma_i^n = \sigma_i(b)$ by Proposition 3.28. However, $N_0$ is normal over $F$, and $b \in N_0$, so $\sigma_i(b) \in N_0$. Thus, each $\gamma_i$ is an $n$th power of some element of $N_0$, so $N$ is an $n$-radical extension of $N_0$. Since $N_0$ is an $n$-radical extension of $F$, we see that $N$ is an $n$-radical extension of $F$. □

We need some group theory in order to state and prove Galois' theorem on solvability by radicals. The key group theoretic notion is that of solvability of a group. A little more information on solvability can be found in Appendix C.

**Definition 16.7.** A group $G$ is solvable if there is a chain of subgroups

$$\{e\} = H_0 \subseteq H_1 \subseteq \cdots \subseteq H_n = G$$

such that for all $i$, the subgroup $H_i$ is normal in $H_{i+1}$ and the quotient group $H_{i+1}/H_i$ is Abelian.

The following two propositions are the facts that we require about solvability. The first is proved in Appendix C, and the second can be found in any good group theory book.

**Proposition 16.8.** Let $G$ be a group and $N$ be a normal subgroup of $G$. Then $G$ is solvable if and only if $N$ and $G/N$ are solvable.

**Proposition 16.9.** If $n \ge 5$, then $S_n$ is not solvable.

We now prove Galois' theorem characterizing polynomials that are solvable by radicals.

**Theorem 16.10 (Galois).** Let $\operatorname{char}(F) = 0$ and let $f(x) \in F[x]$. If $K$ is a splitting field of $f$ over $F$, then $f$ is solvable by radicals if and only if $\operatorname{Gal}(K/F)$ is a solvable group.

**Proof.** Suppose that $f$ is solvable by radicals. Then there is an $n$-radical extension $M/F$ with $K \subseteq M$. Let $\omega$ be a primitive $n$th root of unity in some extension field of $M$. The existence of $\omega$ follows from the assumption that $\operatorname{char}(F) = 0$. Then $M(\omega)/M$ is an $n$-radical extension, so $M(\omega)/F$ is an $n$-radical extension. Let $L$ be the normal closure of $M(\omega)/F$. By Lemma 16.6, $L$ is an $n$-radical extension of $F$. Thus, $L$ is also an $n$-radical extension of $F(\omega)$. Therefore, there is a sequence of fields

$$F = F_0 \subseteq F_1 = F(\omega) \subseteq F_2 \subseteq \cdots \subseteq F_r = L,$$

where $F_{i+1} = F_i(a_i)$ with $a_i^n \in F_i$. For $i \ge 1$, the extension $F_{i+1}/F_i$ is Galois with a cyclic Galois group by Theorem 9.6, since $F_i$ contains a primitive $n$th root of unity. Also, $F_1/F_0$ is an Abelian Galois extension, since $F_1$ is a cyclotomic extension of $F$. Because $\operatorname{char}(F) = 0$ and $L/F$ is normal, $L/F$ is Galois by Theorem 4.9. Let $G = \operatorname{Gal}(L/F)$ and $H_i = \operatorname{Gal}(L/F_i)$. We have the chain of subgroups

$$\{\operatorname{id}\} = H_r \subseteq H_{r-1} \subseteq \cdots \subseteq H_0 = G.$$

By the fundamental theorem, $H_{i+1}$ is normal in $H_i$ since $F_{i+1}$ is Galois over $F_i$. Furthermore, $H_i/H_{i+1} \cong \operatorname{Gal}(F_{i+1}/F_i)$, so $H_i/H_{i+1}$ is an Abelian group. Thus, we see that $G$ is solvable, so $\operatorname{Gal}(K/F)$ is also solvable, since $\operatorname{Gal}(K/F) \cong G/\operatorname{Gal}(L/K)$.

For the converse, suppose that $\operatorname{Gal}(K/F)$ is a solvable group. We have a chain

$$\operatorname{Gal}(K/F) = H_0 \supseteq H_1 \supseteq \cdots \supseteq H_r = \{\operatorname{id}\}$$

with $H_{i+1}$ normal in $H_i$ and $H_i/H_{i+1}$ Abelian. Let $K_i = \mathcal{F}(H_i)$. By the fundamental theorem, $K_{i+1}$ is Galois over $K_i$ and $\operatorname{Gal}(K_{i+1}/K_i) \cong H_i/H_{i+1}$. Let $n$ be the exponent of $\operatorname{Gal}(K/F)$, let $\omega$ be a primitive $n$th root of unity, and set $L_i = K_i(\omega)$. We have the chain of fields

$$F \subseteq L_0 \subseteq L_1 \subseteq \cdots \subseteq L_r$$

with $K \subseteq L_r$. Note that $L_{i+1} = L_i K_{i+1}$. Since $K_{i+1}/K_i$ is Galois, by the theorem of natural irrationalities, $L_{i+1}/L_i$ is Galois and $\operatorname{Gal}(L_{i+1}/L_i)$ is isomorphic to a subgroup of $\operatorname{Gal}(K_{i+1}/K_i)$. This second group is isomorphic to $H_i/H_{i+1}$, an Abelian group. Thus, $\operatorname{Gal}(L_{i+1}/L_i)$ is Abelian, and its exponent divides $n$. The field $L_{i+1}$ is an $n$-Kummer extension of $L_i$ by Theorem 11.4, so $L_{i+1}$ is an $n$-radical extension of $L_i$. Since $L_0 = F(\omega)$ is a radical extension, transitivity shows that $L_r$ is a radical extension of $F$. As $K \subseteq L_r$, the polynomial $f$ is solvable by radicals. □

Our definition of radical extension is somewhat lacking for fields of characteristic $p$, in that Theorem 16.10 is not true in general for prime characteristic. However, by modifying the definition of radical extension in an appropriate way, we can extend this theorem to fields of characteristic $p$. This is addressed in Problem 2. Also, note that we only needed that $\operatorname{char}(F)$ does not divide $n$ in both directions of the proof. Therefore, the proof above works for fields of characteristic $p$ for adequately large $p$.

Let $k$ be a field. The general $n$th degree polynomial over $k$ is the polynomial

$$\begin{aligned}
f(x) &= (x - t_1)(x - t_2)\cdots(x - t_n) = x^n - s_1 x^{n-1} + \cdots + (-1)^n s_n \\
&\in k(t_1,\dots,t_n)[x],
\end{aligned}$$

where the $s_i$ are the elementary symmetric functions in the $t_i$. If we could find a formula for the roots of $f$ in terms of the coefficients of $f$, we could use this to find a formula for the roots of an arbitrary $n$th degree polynomial over $k$. If $n \le 4$, we found formulas for the roots of $f$ in Section 13. For $n \ge 5$, the story is different. The symmetric group $S_n$ is a group of automorphisms on $K = k(t_1,\dots,t_n)$ as in Example 2.22, and the fixed field is $F = k(s_1,\dots,s_n)$. Therefore, $\operatorname{Gal}(K/F) = S_n$. Theorem 16.10 shows that no such formula exists if $n \ge 5$.

**Corollary 16.11.** Let $f(x)$ be the general $n$th degree polynomial over a field of characteristic $0$. If $n \ge 5$, then $f$ is not solvable by radicals.

**Example 16.12.** Let $f(x) = x^5 - 4x + 2 \in \mathbb{Q}[x]$. By graphing techniques of calculus, we see that this polynomial has exactly two nonreal roots, as indicated in the graph below.

Furthermore, $f$ is irreducible over $\mathbb{Q}$ by the Eisenstein criterion. Let $K$ be the splitting field of $f$ over $\mathbb{Q}$. Then $[K:\mathbb{Q}]$ is a multiple of $5$, since any root of $f$ generates a field of dimension $5$ over $\mathbb{Q}$. Let $G = \operatorname{Gal}(K/\mathbb{Q})$. We can view $G \subseteq S_5$. There is an element of $G$ of order $5$ by Cayley's theorem, since $5$ divides $|G|$. Any element of $S_5$ of order $5$ is a $5$-cycle. Also, if $\sigma$ is complex conjugation restricted to $K$, then $\sigma$ permutes the two nonreal roots of $f$ and fixes the three others, so $\sigma$ is a transposition. The subgroup of $S_5$ generated by a transposition and a $5$-cycle is all of $S_5$, so $G = S_5$ is not solvable. Thus, $f$ is not solvable by radicals.

**Example 16.13.** Let $f(x) = x^3 - 3x + 1 \in \mathbb{Q}[x]$, and let $K$ be the splitting field of $f$ over $\mathbb{Q}$. We show that $f$ is solvable by radicals but that $K$ is not a radical extension of $\mathbb{Q}$. Since $f$ has no roots in $\mathbb{Q}$ and $\deg(f) = 3$, the polynomial $f$ is irreducible over $\mathbb{Q}$. The discriminant of $f$ is $81 = 9^2$, so the Galois group of $K/\mathbb{Q}$ is $A_3$ and $[K:\mathbb{Q}] = 3$, by Corollary 12.4. Therefore, $\operatorname{Gal}(K/F)$ is solvable, so $f$ is solvable by radicals by Galois' theorem. If $K$ is a radical extension of $\mathbb{Q}$, then there is a chain of fields

$$\mathbb{Q} \subseteq F_1 \subseteq \cdots \subseteq F_r = K$$

with $F_i = F_{i-1}(a_i)$ and $a_i^n \in F_{i-1}$ for some $n$. Since $[K:\mathbb{Q}]$ is prime, we see that there is only one proper inclusion in this chain. Thus, $K = \mathbb{Q}(b)$ with $b^n = u \in \mathbb{Q}$ for some $n$. The minimal polynomial $p(x)$ of $b$ over $\mathbb{Q}$ splits in $K$, since $K/\mathbb{Q}$ is normal. Let $b'$ be another root of $p(x)$. Then $b^n = (b')^n = u$, so $b'/b$ is an $n$th root of unity. Suppose that $\mu = b'/b$ is a primitive $m$th root of unity, where $m$ divides $n$. Then $\mathbb{Q}(\mu) \subseteq K$, so $[\mathbb{Q}(\mu):\mathbb{Q}] = \phi(m)$ is either $1$ or $3$. An easy calculation shows that $\phi(m) \ne 3$ for all $m$. Thus, $[\mathbb{Q}(\mu):\mathbb{Q}] = 1$, so $\mu \in \mathbb{Q}$. However, the only roots of unity in $\mathbb{Q}$ are $\pm 1$, so $\mu = \pm 1$. Therefore, $b' = \pm b$. This proves that $p(x)$ has at most two roots, so $[\mathbb{Q}(b):\mathbb{Q}] \le 2 < [K:\mathbb{Q}]$, a contradiction to the equality $\mathbb{Q}(b) = K$. Thus, $K$ is not a radical extension of $\mathbb{Q}$.
