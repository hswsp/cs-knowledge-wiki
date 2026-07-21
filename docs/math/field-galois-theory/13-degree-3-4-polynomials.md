# 13. Polynomials of Degree 3 and 4（三次与四次多项式）

In this section, we show how to determine the Galois group and the roots of an irreducible polynomial of degree 2, 3, or 4. We assume throughout that our polynomials are separable. For degree 2, 3, or 4, requiring that the base field $F$ does not have characteristic 2 or 3 is sufficient to ensure separability. Let $f(x) \in F[x]$ be separable and irreducible over $F$, and let $K$ be the splitting field over $F$ of $f$. Set $f(x) = (x - \alpha_1)\cdots(x - \alpha_n) \in K[x]$. If $n = \deg(f)$, note that $n$ divides $[K:F] = |\mathrm{Gal}(K/F)|$, since $[F(\alpha_1):F] = n$. The Galois group $\mathrm{Gal}(K/F)$ is isomorphic to a subgroup of $S_n$ by identifying $S_n$ as the group of all permutations of the roots of $f$. Furthermore, $\mathrm{Gal}(K/F)$ is isomorphic to a *transitive* subgroup of $S_n$; that is, for each pair $i, j \in \{x_1, x_2, \ldots, x_n\}$, there is a $\sigma \in \mathrm{Gal}(K/F)$ with $\sigma(x_i) = x_j$. This fact is due to the isomorphism extension theorem. This limits the possible subgroups of $S_n$ that can be isomorphic to such a Galois group. We call $\mathrm{Gal}(K/F)$ the *Galois group of $f$* in this section for convenience.

For polynomials of degree 2, there is not much to say. If $f(x) = z^2 + bx + c \in F[x]$ is separable and irreducible over $F$, then the Galois group of $f$ is $S_2$, a cyclic group of order 2. If $\mathrm{char}(F) \neq 2$, the quadratic formula can be used to find the roots of $f$. These roots are $\frac{1}{2}(-b \pm \sqrt{b^2 - 4c})$. Therefore, the splitting field $K$ of $f$ over $F$ is $F(\sqrt{b^2 - 4c})$.

## Cubic polynomials

We now consider irreducible polynomials of degree 3. Let $f$ be an irreducible, separable polynomial of degree 3 over a field $F$, and let $K$ be the splitting field of $f$ over $F$. Then $\mathrm{Gal}(K/F)$ is isomorphic to a subgroup of $S_3$. Furthermore, as noted above, $|\mathrm{Gal}(K/F)|$ is a multiple of 3. Thus, the only possibilities for $\mathrm{Gal}(K/F)$ are $A_3$ and $S_3$. The following theorem is a direct consequence of the results about discriminants in Section 12.

**Theorem 13.1.** Let $f(x) \in F[x]$ be an irreducible, separable polynomial of degree 3 over $F$, and let $K$ be the splitting field of $f$ over $F$. If $D$ is the discriminant of $f$, then $\mathrm{Gal}(K/F) \cong S_3$ if and only if $D \notin F^2$, and $\mathrm{Gal}(K/F) \cong A_3$ if and only if $D \in F^2$.

**Proof.** Let $G = \mathrm{Gal}(K/F)$. By Corollary 12.4, $G \subseteq A_3$ if and only if $D \in F^2$. But $G \cong S_3$ or $G \cong A_3$, so $G \cong S_3$ if and only if $D$ is a square in $F$.
$\square$

**Example 13.2.** The polynomial $x^3 - 3x + 1 \in \mathbb{Q}[x]$ has discriminant $81 = 9^2$, and it is irreducible over $\mathbb{Q}$ by an application of the rational root test. Thus, the Galois group of its splitting field over $\mathbb{Q}$ is $A_3$. The polynomial $x^3 - 4x + 2$ has discriminant $148 = 2^2 \cdot 37$, so the corresponding Galois group is $S_3$.

We now present a solution of an arbitrary cubic equation that appeared in Cardano [3] in 1545. We assume that the characteristic of $F$ is neither 2 nor 3. Let $f(x) = x^3 + px + q$. As indicated in Example 12.8, it is sufficient to work with a polynomial of this form, for if $g(x) = x^3 + ax^2 + bx + c$, then by setting $y = x + a/3$, Taylor expansion gives
$$
g(x) = g(a/3) + g'(a/3)y + \frac{1}{2}g''(a/3)y^2 + \frac{1}{6}g'''(a/3)y^3,
$$
and $y$ is chosen as such because $g''(a/3) = 0$.

Cardano's method is to solve $f = 0$ by writing $x = u + v$ and obtaining two equations in $u$ and $v$. Replacing $x$ by $u+v$ in the equation $f = 0$ gives
$$
u^3 + v^3 + q + (3uv + p)(u + v) = 0.
$$
We set $u^3 + v^3 + q = 0$ and $3uv + p = 0$. Thus, $v = -p/(3u)$. Using this in the first equation and multiplying by $u^3$ yields $4u^6 + qu^3 - p^3/27 = 0$. This is a quadratic equation in $u^3$, so
$$
u^3 = \frac{-q \pm \sqrt{q^2 + 4p^3/27}}{2} = -q/2 \pm \sqrt{\Gamma},
$$
where $\Gamma = q^2/4 + p^3/27$. Note that the discriminant $D$ of $f$ is $-4p^3 - 27q^2$, so $\Gamma = -D/108$. Set $A = -q/2 + \sqrt{\Gamma}$ and $B = -q/2 - \sqrt{\Gamma}$. By symmetry of $u$ and $v$, we may set $u^3 = A$ and $v^3 = B$. Let $\omega$ be a primitive third root of unity. The choices for $u$ and $v$ are then
$$
\begin{aligned}
u &= \sqrt[3]{A},\; \omega\sqrt[3]{A},\; \omega^2\sqrt[3]{A}, \\
v &= \sqrt[3]{B},\; \omega\sqrt[3]{B},\; \omega^2\sqrt[3]{B}.
\end{aligned}
$$
We must choose the cube roots of $A$ and $B$ so that $\sqrt[3]{A}\sqrt[3]{B} = -p/3$. Doing so, the roots of $f$ are
$$
\sqrt[3]{A} + \sqrt[3]{B},\quad \omega\sqrt[3]{A} + \omega^2\sqrt[3]{B},\quad \omega^2\sqrt[3]{A} + \omega\sqrt[3]{B}.
$$

**Example 13.3.** Consider $x^3 - 3x + 1$. Then $\Gamma = -D/108 = -81/108 = -3/4$. We have $p = -3$ and $q = 1$. Then $A = -1/2 + i\sqrt{3}/2$ and $B = -1/2 - i\sqrt{3}/2$, so $A = \exp(2\pi i/3)$ and $B = \exp(-2\pi i/3)$. We can then set $u = \exp(2\pi i/9)$ and $v = \exp(-2\pi i/9)$. Also, $\omega = \exp(2\pi i/3)$. By simplifying the formulas for the roots of $f$, we see that the three roots are $2\cos(2\pi/9)$, $2\cos(8\pi/9)$, and $2\cos(14\pi/9)$.

Suppose that the polynomial $f(x) = x^3 + px + q$ has real coefficients. If $\Gamma > 0$, then $D < 0$, so $D$ is not a square in $F$. We can then take the real cube roots of $A$ and $B$ for $u$ and $v$. Furthermore, if $\omega = (-1 + i\sqrt{3})/2$, we see that the three roots of $f$ are
$$
\alpha_1 = \sqrt[3]{A} + \sqrt[3]{B} \in \mathbb{R},
$$
$$
\alpha_2 = -\left(\frac{\sqrt[3]{A} + \sqrt[3]{B}}{2}\right) + i\sqrt{3}\left(\frac{\sqrt[3]{A} - \sqrt[3]{B}}{2}\right),
$$
and
$$
\alpha_3 = -\left(\frac{\sqrt[3]{A} + \sqrt[3]{B}}{2}\right) - i\sqrt{3}\left(\frac{\sqrt[3]{A} - \sqrt[3]{B}}{2}\right).
$$
On the other hand, if $\Gamma < 0$, then $A = -q/2 + i\sqrt{-\Gamma}$ and $B = -q/2 - i\sqrt{-\Gamma}$. If we choose $\sqrt[3]{A} = a + bi$ to satisfy $\sqrt[3]{A}\sqrt[3]{B} = -p/3$, we must then have $\sqrt[3]{B} = a - bi$. The roots of $f$ are then $\alpha_1 = 2a$, $\alpha_2 = -a - b\sqrt{3}$, and $\alpha_3 = -a + b\sqrt{3}$, and all three are real numbers.

The case where $\Gamma < 0$ historically had been called the "irreducible case," since it was realized that even though all three roots are real, the roots cannot be expressed in terms of real radicals.

## Quartic polynomials

We now consider polynomials of degree 4. Let $f(x) = x^4 + ax^3 + bx^2 + cx + d$ be an irreducible, separable polynomial over a field $F$, and let $f$ factor as
$$
f(x) = (x - \alpha_1)(x - \alpha_2)(x - \alpha_3)(x - \alpha_4)
$$
in some splitting field. The key idea we use to find the roots and the Galois group $G$ of $f$ is to work with an associated cubic polynomial. Set
$$
\begin{aligned}
\beta_1 &= \alpha_1\alpha_2 + \alpha_3\alpha_4, \\
\beta_2 &= \alpha_1\alpha_3 + \alpha_2\alpha_4, \\
\beta_3 &= \alpha_1\alpha_4 + \alpha_2\alpha_3,
\end{aligned}
$$
and
$$
r(x) = (x - \beta_1)(x - \beta_2)(x - \beta_3).
$$
A computation shows that
$$
r(x) = x^3 - bx^2 + (ac - 4d)x + 4bd - a^2d - c^2 \in F[x].
$$
The polynomial $r$ is called the *resolvent* of $f$. An easy calculation shows that $f$ and $r$ have the same discriminant. Let $K = F(\alpha_1,\alpha_2,\alpha_3,\alpha_4)$, a splitting field of $f$ over $F$, and let $L = F(\beta_1,\beta_2,\beta_3)$, a splitting field of $r$ over $F$. Note that $L/F$ is Galois. Let
$$
V = \{e, (12)(34), (13)(24), (14)(23)\},
$$
a subgroup of $S_4$ of order 4. Then $V \subseteq A_4$ and $V$ is normal in $S_4$. Each $\beta_i$ is fixed by $V$, so $L \subseteq \mathcal{F}(G \cap V)$. The reverse inclusion is also true, which can be seen by showing that any element of $G - G \cap V$ moves one of the $\beta_i$. The group $G$ is isomorphic to a transitive subgroup of $S_4$, and it has order a multiple of 4. It is not hard to show that the transitive subgroups of $S_4$ of order 24 and 12, respectively, are $S_4$ and $A_4$, and that the transitive subgroups of order 4 are $V$ and the cyclic subgroups generated by a 4-cycle. The subgroup generated by $(1234)$ and $(24)$ is a transitive subgroup of order 8. Since this is a 2-Sylow subgroup of $S_4$, any subgroup of order 8 is isomorphic to it, and so is isomorphic to $D_4$, the dihedral group of order 8. We write $C_4$ for the unique up to isomorphism cyclic group of order 4. We now show how to determine $G$ in terms of the discriminant of $f$ and the resolvent $r$. The particular statement of the following theorem we give appeared in Kappe and Warren [18].

**Theorem 13.4.** With the notation above, let $m = [L : F]$.

1. $G \cong S_4$ if and only if $r(x)$ is irreducible over $F$ and $D \notin F^2$, if and only if $m = 6$.
2. $G \cong A_4$ if and only if $r(x)$ is irreducible over $F$ and $D \in F^2$, if and only if $m = 3$.
3. $G \cong V$ if and only if $r(x)$ splits over $F$, if and only if $m = 1$.
4. $G \cong C_4$ if and only if $r(x)$ has a unique root $t \in F$ and $h(x) = (x^2 - tx + d)(x^2 + ax + (b - t))$ splits over $L$, if and only if $m = 2$ and $f(x)$ is reducible over $L$.
5. $G \cong D_4$ if and only if $r(x)$ has a unique root $t \in F$ and $h(x)$ does not split over $L$, if and only if $m = 2$ and $f$ is irreducible over $L$.

**Proof.** We first point out a couple of things. First, $[K : L] \leq 4$, since $K = L(\alpha_1)$. This equality follows from the fundamental theorem, since only the identity automorphism fixes $L(\alpha_1)$. Second, $r(x)$ is irreducible over $F$ if and only if $m = 3$ or $m = 6$. Also, $r(x)$ has a unique root in $F$ if and only if $m = 2$. Finally, if $\sigma$ is a 4-cycle, then $\sigma^2 \in V$.

Suppose that $r(x)$ is irreducible over $F$. Then $m$ is either 3 or 6, so 3 divides $|G|$. This forces $G$ to be isomorphic to either $S_4$ or $A_4$. In either case, $V \subseteq G$, so $L = \mathcal{F}(V)$ by the fundamental theorem. Thus, $[K : L] = 4$, so $G = S_4$ if $m = 6$, and $G = A_4$ if $m = 3$. Conversely, if $G = S_4$, then $m = |S_4 : V| = 6$, and if $G = A_4$, then $m = |A_4 : V| = 3$. In either case, 3 divides $|G|$, so $r(x)$ is irreducible over $F$.

Next, $r(x)$ splits over $F$ if and only if $L = F$, if and only if $m = 1$. If this occurs, then $L$ corresponds to both $G$ and $G \cap V$, so $G \subseteq V$. Since $|G|$ is a multiple of 4, we see $G = V$. Conversely, if $G = V$, then $L$ corresponds to $G \cap V = G$, so $L = F$; thus, $m = 1$ and $r(x)$ splits over $F$.

For the final case, we suppose that $r(x)$ has a single root $t$ in $F$. This is equivalent to $m = 2$. Thus, $|G : G \cap V| = 2$, so $G \not\subseteq V$. The only possibilities for $G$ are $G \cong C_4$ or $G \cong D_4$. Conversely, if $G$ is either isomorphic to $D_4$ or $C_4$, then $m = |G : G \cap V| = 2$, so $r(x)$ has a unique root $F$. Now $f$ is irreducible over $L$ if and only if $[K : L] = 4$, if and only if $[K : F] = 8$, if and only if $G \cong D_4$. Therefore, $G \cong C_4$ if and only if $f$ is reducible over $L$. By relabeling if necessary, we may suppose that $t = \alpha_1\alpha_2 + \alpha_3\alpha_4$. Then $h(x)$ factors over $K$ as
$$
h(x) = (x - \alpha_1\alpha_2)(x - \alpha_3\alpha_4)(x - (\alpha_1 + \alpha_2))(x - (\alpha_3 + \alpha_4)).
$$
If $h$ splits over $L$, then $\alpha_1 + \alpha_2$ and $\alpha_1\alpha_2$ are in $L$. Thus, $\alpha_1$ satisfies the quadratic polynomial
$$
x^2 - (\alpha_1 + \alpha_2)x + \alpha_1\alpha_2 = (x - \alpha_1)(x - \alpha_2) \in L[x].
$$
Thus, $[K : L] \leq 2$ because $K = L(\alpha_1)$. Therefore, $[K : F] \leq 4$, so $G \cong C_4$. If $G \cong C_4$, let $\sigma$ be a generator for $G$. Then $\sigma^2 \in G \cap V$, since $L$ is the unique nontrivial subfield of $K/F$. To fix $t = \alpha_1\alpha_2 + \alpha_3\alpha_4$, we must have $\sigma^2 = (12)(34)$. Then $\alpha_1 + \alpha_2$, $\alpha_3 + \alpha_4$, $\alpha_1\alpha_2$, and $\alpha_3\alpha_4$ are all fixed by $\sigma^2$, so they lie in $L$. Thus, $h$ splits over $L$. This completes the proof of the theorem.
$\square$

We now find the roots of the general polynomial of degree 4. We point out that the formulas we derive below only require us to find one root of the resolvent polynomial, and such a root can be found by Cardano's method. Our approach is not that of Ferrari, a student of Cardano and the first to solve the quartic, although deep down it is much the same. His method is addressed in Problem 1. Instead, our method is based on the theorem of Galois, which says that there is an algebraic formula for the roots of a polynomial if and only if the Galois group of the polynomial is a solvable group. We shall discuss this theorem in detail in Section 16. To use hindsight, the idea is that given a sequence of subgroups $G \supseteq H_1 \supseteq \cdots \supseteq H_t = \{\mathrm{id}\}$ for which $H_{i+1}$ is normal in $H_i$, with $H_i/H_{i+1}$ Abelian, which exists for a solvable group, we obtain a sequence of intermediate subfields $F = L_t \subseteq L_{t-1} \subseteq \cdots \subseteq K$ for which the extension $L_{i-1}/L_i$ is easy to describe. By describing $L_{t-1}$, then $L_{t-2}$, and so on, eventually we describe $K$. This brings up the question of how to motivate the definition of the resolvent polynomial. For $S_4$, a natural chain of subgroups is $S_4 \supseteq A_4 \supseteq V \supseteq \{\mathrm{id}\}$, since this is the usual sequence that shows $S_4$ is solvable. If $f(x) = (x - t_1)(x - t_2)(x - t_3)(x - t_4)$, then the automorphisms in $V$ fix $t_1t_2 + t_3t_4$, $t_1t_3 + t_2t_4$, and $t_1t_4 + t_2t_3$, and we have seen that the fixed field of $V$ is the field generated by these three elements. This field is then the splitting field of the polynomial whose three roots are these three elements; that is, it is the splitting field of the resolvent of $f$.

Let us now find the roots of the general fourth degree polynomial. Let $k$ be a field of characteristic not 2, and let $K = k(t_1, t_2, t_3, t_4)$ be the rational function field in four variables over $k$. Let
$$
\begin{aligned}
f(x) &= (x - t_1)(x - t_2)(x - t_3)(x - t_4) \\
&= x^4 + ax^3 + bx^2 + cx + d \in k(s_1, s_2, s_3, s_4)[x],
\end{aligned}
$$
where $s_i$ is the $i$th elementary symmetric polynomial in the $t_j$. Then $s_1 = -a$, $s_2 = b$, $s_3 = -c$, and $s_4 = d$. Recall from Example 3.9 that if $F = k(s_1, s_2, s_3, s_4)$, then $K = F(t_1, t_2, t_3, t_4)$ is the splitting field over $F$ of $f$, and $\mathrm{Gal}(K/F) = S_4$. Set
$$
\begin{aligned}
\beta_1 &= t_1t_2 + t_3t_4, \\
\beta_2 &= t_1t_3 + t_2t_4, \\
\beta_3 &= t_1t_4 + t_2t_3.
\end{aligned}
$$
The resolvent $r$ is
$$
\begin{aligned}
r(x) &= (x - \beta_1)(x - \beta_2)(x - \beta_3) \\
&= x^3 - bx^2 + (ac - 4d)x + 4bd - a^2d - c^2.
\end{aligned}
$$
Let $L = F(\beta_1, \beta_2, \beta_3)$, the fixed field of $V$. For simplicity, we write $\sigma_1 = (12)(34)$, $\sigma_2 = (13)(24)$, and $\sigma_3 = (14)(23)$. Let $u = (t_1 + t_2) - (t_3 + t_4)$. Then $\sigma_1(u) = u$ and $\sigma_i(u) = -u$ for $i = 2, 3$. Therefore, $u^2 \in L$. Let $M = L(u)$. Then $M$ corresponds to $\{\mathrm{id}, \sigma_1\}$. Finally, let $v = t_1 - t_2$. Then $\sigma_1(v) = -v$, so $v^2 \in M$. Also, $M(v)$ is fixed only by $\mathrm{id}$, so $K = M(v)$. We have
$$
\begin{aligned}
u^2 &= (t_1 + t_2)^2 + (t_3 + t_4)^2 - 2(t_1 + t_2)(t_3 + t_4) \\
&= t_1^2 + t_2^2 + t_3^2 + t_4^2 + 2(t_1t_2 + t_3t_4) - 2(t_1t_3 + t_2t_4 + t_1t_4 + t_2t_3) \\
&= s_1^2 - 2s_2 + 2\beta_1 - 2(\beta_2 + \beta_3) = s_1^2 - 2s_2 + 4\beta_1 - 2b \\
&= a^2 - 4b + 4\beta_1.
\end{aligned}
$$
To determine $v^2$, we first point out that $u + s_1 = 2(t_1 + t_2)$, so $t_1 + t_2 = \frac{1}{2}(s_1 + u)$. Similarly, $t_3 + t_4 = \frac{1}{2}(s_1 - u)$. Now,
$$
\begin{aligned}
v^2 &= (t_1 - t_2)^2 = (t_1 + t_2)^2 - 4t_1t_2 = \frac{1}{4}(s_1 + u)^2 - 4t_1t_2 \\
&= \frac{1}{4}(-a + u)^2 - 4t_1t_2.
\end{aligned}
$$

However, we can determine $t_1t_2$ in terms of the coefficients as follows. If we expand $(t_1t_2 - t_3t_4)u$, recalling that $u = (t_1 + t_2) - (t_3 + t_4)$, we get
$$
\begin{aligned}
&(t_1t_2 - t_3t_4)((t_1 + t_2) - (t_3 + t_4)) \\
&= t_1^2t_2 + t_1t_2^2 + t_3^2t_4 + t_3t_4^2 - (t_1t_2t_3 + t_1t_2t_4 + t_2t_3t_4 + t_1t_3t_4) \\
&= (t_1t_2 + t_3t_4)(t_1 + t_2 + t_3 + t_4) - 2s_3 \\
&= s_1\beta_1 - 2s_3 = -a\beta_1 + 2c.
\end{aligned}
$$
Thus, $t_1t_2 - t_3t_4 = u^{-1}(2c - a\beta_1)$. Since $\beta_1 = t_1t_2 + t_3t_4$, we see that
$$
\begin{aligned}
t_1t_2 &= \frac{1}{2}\left(\beta_1 + \frac{1}{u}(2c - a\beta_1)\right), \\
t_3t_4 &= \frac{1}{2}\left(\beta_1 - \frac{1}{u}(2c - a\beta_1)\right),
\end{aligned}
$$
so
$$
v^2 = \frac{1}{4}(u - a)^2 - 2\left(\beta_1 + \frac{1}{u}(2c - a\beta_1)\right).
$$
Once we have a formula for $t_1$, we will have formulas for the other $t_i$, since $t_2 = \sigma_1(t_1)$, $t_3 = \sigma_2(t_1)$, and $t_4 = \sigma_3(t_1)$. To find $t_1$, note that
$$
t_1 = \frac{1}{2}(t_1 + t_2 + t_1 - t_2) = \frac{1}{2}\left(v + \frac{1}{2}(u - a)\right).
$$
To get formulas for $t_2$, $t_3$, and $t_4$, we need to know $\sigma_i(v)$. We have $\sigma_1(v) = -v$. Let
$$
v' = t_3 - t_4 = \sigma_2(v) = \sigma_3(v).
$$
Since $\sigma_1(u) = u$, $\sigma_2(u) = -u$, and $\sigma_3(u) = -u$, we see that
$$
(v')^2 = \frac{1}{4}(u - a)^2 - 2\left(\beta_1 - \frac{1}{u}(2c - a\beta_1)\right).
$$
Therefore, we have
$$
\begin{aligned}
t_1 &= \frac{1}{2}\left(v + \frac{1}{2}(u - a)\right), \\
t_2 &= \frac{1}{2}\left(-v + \frac{1}{2}(u - a)\right), \\
t_3 &= \frac{1}{2}\left(v' + \frac{1}{2}(-u - a)\right), \\
t_4 &= \frac{1}{2}\left(-v' + \frac{1}{2}(-u - a)\right).
\end{aligned}
$$
For a specific polynomial, these formulas will work provided that $u \neq 0$. Since the roots of $r(x)$ are distinct, provided that $f$ has no repeated roots, at most one choice of $\beta$ will make $u = 0$.

Recall that the Galois group of $f$ over $F$ is $S_4$. Figures 13.1 and 13.2 list some of the subgroups of $S_4$ and the corresponding intermediate subfields. To make the diagrams manageable, we list only one subgroup/subfield of each "type." For instance, there are three subgroups generated by a 4-cycle, and six subgroups generated by a 3-cycle. We list only one of each. The group $S(1)$ below is the group of permutations that fix $1$, and the element $\Delta$ is the element $\prod_{i<j}(t_i - t_j)$, so $\Delta^2$ is the discriminant of $f$ and also of $r$.

*[Figure 13.1: Field tower for $F(t_1,t_2,t_3,t_4)/F$ — showing $K$, $L(u)$, $F(\beta_1,u,v)$, $F(t_1,\Delta)$, $L$, $F(\beta_1,u\Delta)$, $F(\beta_1,u)$, $F(t_1)$, $F(\beta_1)$, $F(\Delta)$, $F$ with degrees marked.]*

*[Figure 13.2: Group tower for $S_4$ — showing $\langle(12)(34)\rangle$, $\langle(34)\rangle$, $\langle(234)\rangle$, $V$, $\langle(1324)\rangle$, $\langle(12),(34)\rangle$, $S(1)$, $\langle(1324),(12)\rangle$, $A_4$, $S_4$ with indices marked.]*

**Example 13.5.** Let $f(x) = x^4 + x^3 + x^2 + x + 1$. Then $a = b = c = d = 1$, so $s_1 = s_3 = -1$ and $s_2 = s_4 = 1$. Also,
$$
r(x) = x^3 - x^2 - 3x + 2 = (x - 2)(x^2 + x - 1).
$$
Set $\beta_1 = 2$. Then $u = \sqrt{5}$. Also,
$$
\begin{aligned}
v^2 &= \frac{1}{4}(-1 + u)^2 - 2(2 + u^{-1}(-2 + 2)) \\
&= \frac{1}{4}(u^2 - 2u + 1) - 4 = -\frac{5 + u}{2}.
\end{aligned}
$$
Thus, $v = \frac{i}{2}\sqrt{10 - 2\sqrt{5}}$. In addition, we see that $v' = \frac{i}{2}\sqrt{10 - 2\sqrt{5}}$. The roots of $f$ are then
$$
\frac{1}{2}\left(\frac{i}{2}\sqrt{10 + 2\sqrt{5}} + \frac{1}{2}(-1 + \sqrt{5})\right) = \frac{1}{4}(-1 + \sqrt{5}) + \frac{i}{4}\sqrt{10 + 2\sqrt{5}},
$$
$$
\frac{1}{2}\left(-\frac{i}{2}\sqrt{10 + 2\sqrt{5}} + \frac{1}{2}(-1 + \sqrt{5})\right) = \frac{1}{4}(-1 + \sqrt{5}) - \frac{i}{4}\sqrt{10 + 2\sqrt{5}},
$$
$$
\frac{1}{2}\left(\frac{i}{2}\sqrt{10 - 2\sqrt{5}} + \frac{1}{2}(-1 - \sqrt{5})\right) = \frac{1}{4}(-1 - \sqrt{5}) + \frac{i}{4}\sqrt{10 - 2\sqrt{5}},
$$
$$
\frac{1}{2}\left(-\frac{i}{2}\sqrt{10 - 2\sqrt{5}} + \frac{1}{2}(-1 - \sqrt{5})\right) = \frac{1}{4}(-1 - \sqrt{5}) - \frac{i}{4}\sqrt{10 - 2\sqrt{5}}.
$$
The polynomial $h(x) = (x^2 - 2x + 1)(x^2 + x - 1)$ splits over $L$, so by Theorem 13.4 the Galois group of $f$ is isomorphic to $C_4$. Alternatively, $f(x)$ is the fifth cyclotomic polynomial $\Psi_5(x)$, so Section 7 tells us that the Galois group of $f$ is cyclic.

**Example 13.6.** Let $f(x) = x^4 - 4x^3 + 4x^2 + 6$. This polynomial is irreducible by the Eisenstein criterion. Now,
$$
r(x) = x^3 - 4x^2 - 24x = x(x^2 - 4x - 24),
$$
so $L = \mathbb{Q}(\sqrt{7})$. Take $\beta_1 = 0$. Then
$$
h(x) = (x^2 + 6)(x^2 - 4x + 4) = (x^2 + 6)(x - 2)^2.
$$
Since $h$ does not split over $L$, we see that the Galois group of $f$ is isomorphic to $D_4$.

**Example 13.7.** Let $p$ be a prime, and let $f(x) = x^4 + px + p$. Then $r(x) = x^3 - 4px - p^2$. To test for roots of $r(x)$ in $\mathbb{Q}$, we only need to check $\pm 1$, $\pm p$, $\pm p^2$. We see that $\pm 1$ and $\pm p^2$ are never roots, but $r(p) = p^2(p - 5)$ and $r(-p) = p^2(3 - p)$. Therefore, for $p \neq 3, 5$, the resolvent $r$ has no roots in $\mathbb{Q}$; hence, $r$ is irreducible over $\mathbb{Q}$. The discriminant $D = p^3(256 - 27p)$ is not a square in $\mathbb{Q}$, since if $p$ is odd, then $p$ does not divide $256 - 27p$, and $D = 1616 \notin \mathbb{Q}^2$ for $p = 2$. Let $G$ be the Galois group of $f$. Then $G \cong S_4$ for $p \neq 3, 5$. If $p = 3$, let $\beta_1 = -3$. Then $r(x) = (x + 3)(x^2 - 3x - 3)$, so $L = \mathbb{Q}(\sqrt{21})$. Then $h(x) = (x^2 + 3x + 3)(x^2 + 3)$ does not split over $L$, so $G \cong D_4$. If $p = 5$, then $r(x) = (x - 5)(x^2 + 5x + 5)$, so $L = \mathbb{Q}(\sqrt{5})$. As $h(x) = (x^2 - 5x + 5)(x^2 - 5)$, $h$ splits over $L$, so $G \cong C_4$.

**Example 13.8.** Let $l \in \mathbb{Q}$, and let $f(x) = x^4 - l$. Then the resolvent of $f$ is $r(x) = x^3 + 4lx = x(x^2 + 4l)$. If $-l$ is not a square in $\mathbb{Q}$, then $r(x)$ has exactly one root in $\mathbb{Q}$. Moreover, $h(x) = x^2(x^2 + l)$ does not factor completely over $\mathbb{Q}$, so the Galois group $G$ of $f$ is $D_4$ by Theorem 13.4. On the other hand, if $-l$ is a square in $\mathbb{Q}$, then $r$ factors completely over $\mathbb{Q}$, so $G \cong V$. For example, the Galois group of $x^4 + 4$ is $V$. The splitting field of $x^4 + 4$ over $\mathbb{Q}$ is then $\mathbb{Q}(\sqrt[4]{-4})$.
