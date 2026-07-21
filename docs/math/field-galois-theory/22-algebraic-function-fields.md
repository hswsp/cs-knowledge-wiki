# 22. Algebraic Function Fields（代数函数域）

In this section, we study one of the most important classes of field extensions, those arising from algebraic geometry. We will continue to use the notation defined in Section 21. The point of this section is to show how field theoretic information can be used to obtain geometric information about varieties.

**Definition 22.1** Let $V$ be an irreducible $k$-variety. Then the function field $k(V)$ of $V$ is the quotient field of the coordinate ring $k[V]$.

This definition is meaningful because if $V$ is irreducible, then $I(V)$ is a prime ideal, so $k[V] = k[x_1,\dots,x_n]/I(V)$ is an integral domain. The function field $k(V)$ of a variety $V$ can be viewed as a field of functions on $V$ in the following way. Each $f \in k[V]$ is a polynomial function from $V$ to $C$. A quotient $f/g$ of elements of $k[V]$ then defines a function from $V - Z(g)$ to $C$. Now, $V - Z(g)$ is an open subset of $V$; hence, it is a dense subset of $V$. The elements of $k(V)$ are then rational functions defined on an open, dense subset of $V$; the density follows by Example 21.20.

**Example 22.2** Let $V = Z(y - x^2)$. Then the coordinate ring of $V$ is $k[x,y]/(y - x^2)$, which is isomorphic to the polynomial ring $k[t]$ by sending $t$ to the coset of $x$ in $k[V]$. Therefore, the function field of $V$ is the rational function field $k(t)$.

**Example 22.3** Let $V = Z(y^2 - x^3)$. Then $k(V)$ is the field $k(s,t)$, where $s$ and $t$ are the images of $x$ and $y$ in $k[V] = k[x,y]/(y^2 - x^3)$, respectively. Note that $t^2 = s^3$. Let $z = t/s$. Substituting this equation into $t^2 = s^3$ and simplifying shows that $s = z^2$, and so $t = z^3$. Thus, $k(V) = k(z)$. The element $z$ is transcendental over $k$, since if $k(V)/k$ is algebraic, then $k[V]$ is a field by the argument in Example 19.11, so $(y^2 - x^3)$ is a maximal ideal of $k[x,y]$. However, this is not true, since $(y^2 - x^3)$ is properly contained in the ideal $(x,y)$. Thus, $k(V)$ is a rational function field in one variable over $k$. Note that $k[V]$ is isomorphic to $k[x^2, x^3]$, a ring that is not isomorphic to a polynomial ring in one variable over $k$.

**Example 22.4** If $V$ is an irreducible $k$-variety, then $V$ gives rise to a field extension $k(V)$ of $k$. We can reverse this construction. Let $K$ be a finitely generated field extension of $k$. Say $K = k(a_1,\dots,a_n)$ for some $a_i \in K$. Let
$$
P = \{f \in k[x_1,\dots,x_n] : f(a_1,\dots,a_n) = 0\}.
$$
Then $P$ is the kernel of the ring homomorphism $\varphi : k[x_1,\dots,x_n] \to K$ that sends $x_i$ to $a_i$, so $P$ is a prime ideal. If $V = Z(P)$, then $V$ is an irreducible $k$-variety with coordinate ring $k[x_1,\dots,x_n]/P \cong k[a_1,\dots,a_n]$, so the function field of $V$ is $K$. Note that if we start with an irreducible $k$-variety $V$ and let $K = k(V)$, then the variety we get from this construction may not be $V$. Therefore, the processes of obtaining field extensions from varieties and vice versa are not inverses of each other.

The next theorem gives the most useful method for computing the dimension of a variety. We do not give the proof, since this would go past the interests of this book. The interested reader can find a proof in Kunz [19, §3, Prop. 3.11].

**Theorem 22.5** Let $V$ be an irreducible $k$-variety. Then the dimension of $V$ is equal to the transcendence degree of $k(V)/k$.

**Example 22.6** The dimension of the $k$-variety $C^n$ is $n$, since the function field of $C^n$ is $k(x_1,\dots,x_n)$, which has transcendence degree $n$ over $k$.

**Example 22.7** If $V = Z(y - x^2)$, then $k[V] = k[x,y]/(y - x^2) \cong k[x]$, so $k(V) \cong k(z)$ has transcendence degree 1 over $k$. Thus, $\dim(V) = 1$. More generally, if $f(x,y)$ is any irreducible polynomial in $k[x,y]$ and $V = Z(f)$, then $k[V] = k[x,y]/(f) = k[s,t]$, where $s$ and $t$ are the images in $k[V]$ of $x$ and $y$, respectively. Therefore, $k(V) = k(s,t)$. The set $\{s, t\}$ is algebraically dependent over $k$, since $f(s,t) = 0$. However, $s$ or $t$ is transcendental over $k$, for if $s$ is algebraic over $k$, then there is a $g \in k[x]$ with $g(s) = 0$. Viewing $g(x)$ as a polynomial in $x$ and $y$, we see that $g \in I(V) = (f)$. Similarly, if $t$ is algebraic over $k$, then there is an $h(y) \in k[y]$ with $h \in (f)$. These two inclusions are impossible, since $g(x)$ and $h(y)$ are relatively prime. This proves that either $\{s\}$ or $\{t\}$ is a transcendence basis for $k(V)$, so $k(V)$ has transcendence degree 1 over $k$.

**Example 22.8** Let $f \in k[x_1,\dots,x_n]$ be an irreducible polynomial and set $V = Z(f)$. Then $\dim(V) = n - 1$. To see this, we showed in Example 19.12 that the quotient field of $k[x_1,\dots,x_n]/(f)$ has transcendence degree $n - 1$ over $k$. But, this quotient field is the function field $k(V)$ of $V$. Thus, Theorem 22.5 shows that $\dim(V) = n - 1$. Note that the argument in the previous example is mostly a repeat of that given in Example 19.12 in the case of two variables.

We now give some properties of the function field of an irreducible variety. We first need two definitions. If $K/k$ is a field extension, then $K$ is a regular extension of $k$ provided that $K/k$ is separable and $k$ is algebraically closed in $K$. If $P$ is a prime ideal of $k[x_1,\dots,x_n]$, then $P$ is absolutely prime if for any field extension $L/k$ the ideal generated by $P$ in $L[x_1,\dots,x_n]$ is a prime ideal.

**Example 22.9** Let $P$ be an absolutely prime ideal of $k[x_1,\dots,x_n]$, and let $V = Z(P)$. Let $L$ be any field extension of $k$ contained in $C$. Then we can view $V$ as an $L$-variety. The coordinate ring of $V$ considered as an $L$-variety is $L[x_1,\dots,x_n]/I$, where $I$ is the ideal of $V$ computed in $L[x_1,\dots,x_n]$. The ideal $I$ contains $P$, so $I$ contains the ideal generated by $P$ in $L[x_1,\dots,x_n]$. Since $P$ is absolutely prime, the Nullstellensatz tells us that $I$ is the ideal generated by $P$. Consequently, $V$ is irreducible as an $L$-variety.

If $k = \mathbb{R}$ and $P = (x^2 + y^2) \in \mathbb{R}[x,y]$, then $V = Z(P)$ is an irreducible $\mathbb{R}$-variety but $V$ is not irreducible as a $\mathbb{C}$-variety, since the ideal of $V$ in $\mathbb{C}[x,y]$ is $(x^2 + y^2) = (x + iy)(x - iy)$.

**Theorem 22.10** Let $V$ be an irreducible $k$-variety. Then $k(V)$ is a finitely generated extension of $k$. Moreover, $k(V)/k$ is a regular extension if $I(V)$ is absolutely prime.

**Proof.** The field $k(V)$ is the quotient field of $k[V] = k[x_1,\dots,x_n]/I(V)$. The ring $k[V]$ is generated over $k$ as a ring by the images of the $x_i$, so $k(V)$ is generated as a field extension over $k$ by the images of the $x_i$. This proves that $k(V)$ is a finitely generated extension of $k$.

Suppose that $I(V)$ is absolutely prime. We need to show that $k(V)/k$ is separable and that $k$ is algebraically closed in $k(V)$. For this, we first show that if $L$ is any extension of $k$, then $k(V)$ and $L$ are linearly disjoint over $k$. To see this, note that
$$
k[V] \otimes_k L \cong L[x_1,\dots,x_n]/Q,
$$
where $Q = I(V)L[x_1,\dots,x_n]$. This isomorphism is given on generators by $(f + I(V)) \otimes l \mapsto fl + Q$. The ring $L[x_1,\dots,x_n]/Q$ contains an isomorphic copy of $k[V] = k[x_1,\dots,x_n]/I(V)$, and it is the ring generated by $L$ and this copy of $k[V]$. By the assumption that $I(V)$ is absolutely prime, $Q$ is a prime ideal, so $L[x_1,\dots,x_n]/Q$ is a domain. If $K$ is the quotient field of this domain, there are isomorphic copies of $k[V]$ and $L$ inside $K$, and the tensor product $k[V] \otimes_k L$ is isomorphic to a subring of $K$. Therefore, $k[V]$ and $L$ are linearly disjoint over $k$, so $k(V)$ and $L$ are linearly disjoint over $k$ by Lemma 20.10. To see that $k(V)$ is separable over $k$, set $L = k^{1/p^\infty}$. From what we have shown, $k(V)$ and $k^{1/p^\infty}$ are linearly disjoint, so $k(V)$ is separable over $k$. Let $k'$ be the algebraic closure of $k$ in $k(V)$. By setting $L = k'$, since $k(V)$ and $k'$ are linearly disjoint over $k$, it follows that $k'$ and $k'$ are linearly disjoint over $k$, so $k' = k$. Thus, $k$ is algebraically closed in $k(V)$. This finishes the proof that $k(V)$ is a regular extension of $k$. $\square$

**Corollary 22.11** Let $f \in k[x_1,\dots,x_n]$ be an absolutely irreducible polynomial. If $V = Z(f)$, then $V$ is an irreducible $k$-variety, and $k(V)$ is a regular extension of $k$.

**Proof.** Since $f$ is irreducible in $k[x_1,\dots,x_n]$, the principal ideal $(f)$ is prime; hence, $I(V) = (f)$ is prime. Thus, $V$ is an irreducible $k$-variety. Moreover, $(f)$ is absolutely prime, since $f$ is absolutely irreducible. By the previous theorem, $k(V)$ is a regular extension of $k$. $\square$

**Example 22.12** Let $f = y^2 - (x^3 - x)$ and $V = Z(f)$. If $L/k$ is any field extension, then $f$ is irreducible in $L[x,y]$, since $x^3 - x$ is not a square in $L[x]$. Therefore, $k(V)$ is a regular extension of $k$.

**Example 22.13** If $f = x^2 + y^2 \in \mathbb{R}[x,y]$ and $V = Z(f)$, then $f$ is irreducible over $\mathbb{R}$, but $f$ is not irreducible over $\mathbb{C}$, since $f = (x + iy)(x - iy)$. The field extension $\mathbb{R}(V)/\mathbb{R}$ is therefore not regular. This extension is separable, since $\operatorname{char}(\mathbb{R}) = 0$. In $\mathbb{R}(V)$, we have $x^2 + y^2 = 0$, so $(x/y)^2 = -1$. Thus, $\mathbb{C}$ is a subfield of $\mathbb{R}(V)$, which shows that $\mathbb{R}$ is not algebraically closed in $\mathbb{R}(V)$.

A natural question to ask is what geometric information about a variety can be determined from field theoretic information about its function field. Problem 6 below investigates one aspect of this question. We now investigate another.

**Definition 22.14** An irreducible $k$-variety $V$ is said to be rational if $k(V)$ is a purely transcendental extension of $k$.

Recall that a purely transcendental extension with finite transcendence degree is often called a rational extension. Thus, a $k$-variety $V$ is rational if $k(V)/k$ is a rational extension. A fundamental problem of algebraic geometry is to determine when a variety is rational. The problem of rationality has a more geometric formulation. Recall from vector calculus that a curve in $\mathbb{R}^2$ can be parameterized in the form $x = f(t)$ and $y = g(t)$, where $f$ and $g$ are real-valued functions; that is, the curve consists of the points $(f(t), g(t))$ as $t$ ranges over $\mathbb{R}$. The functions $f$ and $g$ can be completely general, and even with a curve defined by polynomial equations, the functions $f$ and $g$ may be transcendental. For example, the most common parameterization of the unit circle is $x = \cos t$ and $y = \sin t$. In the case of algebraic varieties, we are interested in parameterizations involving polynomial or rational functions.

**Example 22.15** Let $V$ be the zero set of $x^2 + y^2 - 1$, an irreducible $k$-variety in $C^2$. As noted above, if $k = \mathbb{R}$, then the curve $V$ has a transcendental parameterization. We wish to find a parameterization of $V$ in terms of rational functions. We can do this as follows.

Pick a point on $V$, for instance $P = (-1,0)$. For a point $(x,y)$ on $V$, let $t$ be the slope of the line connecting these two points. Then $t = y/(x + 1)$. If we solve for $y$ and substitute into the equation $x^2 + y^2 - 1 = 0$, we can solve for $x$ in terms of $t$. Doing this, we see that
$$
x = \frac{1 - t^2}{1 + t^2}, \quad y = \frac{2t}{1 + t^2}.
$$
Moreover, we can reverse this calculation to show that
$$
\left\{\left(\frac{1 - t^2}{1 + t^2}, \frac{2t}{1 + t^2}\right) : t \in C, t^2 \ne -1\right\} = V - \{P\},
$$
for, given $(x,y) \in V$ with $(x,y) \ne (-1,0)$, solving for $t$ in the equation $(1 - t^2)/(1 + t^2) = x$ yields
$$
t = \pm \sqrt{\frac{1 - x}{1 + x}},
$$
which are elements of $C$, since $1 + x \ne 0$ and $C$ is algebraically closed, so $C$ contains a square root of any element. With either of these values of $t$, we see that $2t/(1 + t^2) = t(1 + x)$, and we can check that $x^2 + (t(1 + x))^2 = 1$; hence, $y = 2t/(1 + t^2)$ if the sign of the square root is chosen appropriately. So, this parameterization of $V$ picks up all but one point of $V$. There is no value of $t$ that yields the point $P$. Intuitively, we would need $t = \infty$ to get $x = -1$ and $y = 0$. Starting with any point $Q$ on the curve and following this procedure will yield a parameterization of $V - \{Q\}$.

**Example 22.16** For another example of a parameterization, let $Y = Z(y^2 - x^3)$. If we start with the point $(0,0)$ and follow the procedure of Example 22.15, we obtain the parameterization $x = t^2$ and $y = t^3$ given in Example 21.6. With this parameterization, we get all points of $Y$; that is,
$$
Y = \{(t^2, t^3) : t \in C\}.
$$

Not every algebraic curve can be parameterized with rational functions. To give an intuitive feel for why this is true, let $V$ be the zero set of $y^2 - (x^3 - x)$. Pick $P = (0,0)$ on $V$. If we follow the procedure above, we would get $t = y/x$, or $y = tx$. Substituting this into the equation $y^2 = x^3 - x$ yields $t^2 x^2 = x^3 - x$, or $x^2 - t^2 x - 1 = 0$. This has the two solutions
$$
x = \frac{t^2 \pm \sqrt{t^2 + 4}}{2},
$$
neither of which are rational functions in $t$. While this does not prove that $Y$ cannot be parameterized, it does indicate that $Y$ is more complicated than the two previous examples. In Proposition 22.18, we show that an irreducible curve $V$ can be parameterized if and only if the function field $k(V)$ is rational over $k$. A proof that $\mathbb{C}(V)/\mathbb{C}$ is not rational if $V = Z(y^2 - x^3 + x)$ is outlined in Problem 23.6. It is nontrivial to show that a field extension $K/F$ is not rational when $F$ is algebraically closed. If $F$ is not algebraically closed, then it is easier to prove that an extension of $F$ is not rational, as can be seen in Problems 1 and 4.

We now relate the concept of parameterization to that of rationality. We make precise what it means to parameterize a variety. We will restrict to curves. An algebraic variety of dimension 1 is said to be a curve.

**Definition 22.17** Let $V \subseteq C^n$ be a curve defined over $k$. Then $V$ can be parameterized if there are rational functions $f_i(t) \in k(t)$ such that $\{(f_1(t),\dots,f_n(t)) : t \in C\}$ is a dense subset of $V$ with respect to the $k$-Zariski topology.

From Theorem 22.5, the function field of a curve defined over a field $k$ has transcendence degree 1 over $k$. We could define what it means to parameterize a variety of dimension greater than 1, although we will not do so.

To clarify the definition above, if $f(t)$ is a rational function, say $f(t) = g(t)/h(t)$ with $g, h \in k[t]$. Then $f(a)$ is defined for $a \in C$ only if $h(a) \ne 0$. The polynomial $h$ has at most finitely many roots, so $f(a)$ is defined at all but finitely many $a \in C$. In the definition of parameterization of a curve, it is being assumed that the point $(f_1(t),\dots,f_n(t))$ exists only when each $f_i(t)$ is defined.

**Proposition 22.18** Let $V$ be an irreducible curve defined over $k$. Then $V$ can be parameterized if and only if the function field $k(V)$ is rational over $k$.

**Proof.** First, suppose that $V \subseteq C^n$ can be parameterized. Let $f_1(t),\dots,f_n(t) \in k(t)$ such that $U = \{(f_1(t),\dots,f_n(t)) : t \in C\}$ is a dense subset of $V$. Define $\varphi : k[x_1,\dots,x_n] \to k(t)$ by sending $x_i$ to $f_i(t)$. Then $\varphi$ uniquely defines a $k$-homomorphism. The kernel of $\varphi$ consists of all polynomials $h(x_1,\dots,x_n)$ with $h(f_1(t),\dots,f_n(t)) = 0$. For such an $h$, we have $h(P) = 0$ for all $P \in U$. Therefore, $U \subseteq Z(h)$, so by density we have $V \subseteq Z(h)$. Thus, $h \in I(V)$. It is clear that $I(V) \subseteq \ker(\varphi)$; hence, we see that $\ker(\varphi) = I(V)$, so $\varphi$ induces an injective $k$-homomorphism $\varphi' : k[V] \to k(t)$. The map $\varphi'$ then induces a $k$-homomorphism $k(V) \to k(t)$, so $k(V)$ is isomorphic to an intermediate field of $k(t)/k$. By Lüroth's theorem, which we prove below, $k(V)$ is a rational extension of $k$.

For the converse, suppose that $k(V) = k(t)$ for some $t$. We abuse notation by writing $x_i$ for the image of $x_i$ in $k[V]$. We have $x_i = f_i(t)$ for some rational function $f_i$, and we can write $t = g(x_1,\dots,x_n)/h(x_1,\dots,x_n)$ for some polynomials $g, h$. If $P \in V$, let $a = g(P)/h(P)$, provided that $h(P) \ne 0$. Then $P = (f_1(a),\dots,f_n(a))$ by the relations between the $x_i$ and $t$. On the other hand, given $a \in C$, if each $f_i(a)$ is defined, let $Q = (f_1(a),\dots,f_n(a))$. Then $u(Q) = 0$ for all $u \in I(V)$, again by the relations between the $x_i$ and $t$. Thus, $Q \in Z(I(V)) = V$. The points of $V$ not of the form $(f_1(a),\dots,f_n(a))$ all satisfy $h(P) = 0$. This does not include all points of $V$, or else $h \in I(V)$, which is false by the choice of $h$. Thus, $V \cap Z(h)$ is a finite set, so $\{(f_1(t),\dots,f_n(t)) : t \in C\}$ contains all but finitely many points of $V$, so it is a dense subset of $V$. The equations $x_i = f_i(t)$ thus give a parameterization of $V$. $\square$

We now finish the proof of Proposition 22.18 by proving Lüroth's theorem.

**Theorem 22.19 (Lüroth)** Let $k(t)$ be the rational function field in one variable over a field $k$, and let $F$ be a field with $k \subset F \subseteq k(t)$. Then $F = k(u)$ for some $u \in F$. Thus, $F$ is purely transcendental over $k$.

**Proof.** Let $K = k(t)$, and take $v \in F - k$. We have seen in Example 1.17 that $[K : k(v)] < \infty$, so $[K : F] < \infty$. Let $f(x) = x^n + l_{n-1}x^{n-1} + \cdots + l_0$ be the minimal polynomial of $t$ over $F$. Then $[K : F] = n$. Since $t$ is transcendental over $k$, some $l_i \notin k$. Let $u = l_i$, and set $m = [K : k(u)]$. Therefore, $m \ge n$, since $k(u) \subseteq F$. If we show $m \le n$, then we will have proved that $F = k(u)$. All $l_j \in k(t)$, so there are polynomials $c_1(t),\dots,c_n(t)$ and $d(t)$ in $k[t]$ with $l_j = c_j(t)/d(t)$, and such that $\{d, c_1, \dots, c_n\}$ is relatively prime. Note that $c_n(t) = d(t)$, since $f$ is monic, and $u = c_i(t)/d(t)$, so $m \le \max\{\deg(c_i), \deg(d)\}$ by Example 1.17. This may be an inequality instead of an equality because $c_i$ and $d$ may not be relatively prime. Let
$$
f(x,t) = d(t)f(x) = c_n(t)x^n + c_{n-1}(t)x^{n-1} + \cdots + c_0(t).
$$
Then $f(x,t) \in k[x,t]$, and $f$ is primitive as a polynomial in $x$. Moreover, $\deg_x(f(x,t)) = n$, where $\deg_x$ refers to the degree in $x$ of a polynomial, and $\deg_t(f(x,t)) \ge m$, since $c_i$ and $d$ are both coefficients of $f$. By dividing out $\gcd(c_i, d)$, we may write $u = g(t)/h(t)$ with $g, h \in k[t]$ relatively prime. Now $t$ is a root of $g(x) - uh(x) \in F[x]$, so we may write
$$
g(x) - uh(x) = q(x)f(x) \tag{22.1}
$$
with $q(x) \in F[x]$. Plugging $u = g(t)/h(t)$ into Equation (22.1), we see that $g(x)h(t) - g(t)h(x)$ is divisible by $f(x,t)$ in $k(t)[x]$ as $F \subseteq k(t)$. These polynomials are in $k[x,t]$, and $f$ is primitive in $x$, so we can write
$$
g(x)h(t) - g(t)h(x) = r(x,t)f(x,t)
$$
with $r(x,t) \in k[x,t]$. The left-hand side has degree in $t$ at most $m$, since $m = \max\{\deg(g), \deg(h)\}$; this equality was proved in Example 1.17. But we know that the degree of $f$ in $t$ is at least $m$. Thus, $r(x,t) = r(x) \in k[x]$. In particular, $r$ is primitive as a polynomial in $k[t][x]$. Thus, $rf$ is primitive in $k[t][x]$ by Proposition 4.3 of Appendix A, so $f(x,t) = g(x)h(t) - g(t)h(x)$ is a primitive polynomial in $k[t][x]$. By symmetry, it is also primitive in $k[x][t]$. But $r(x)$ divides all of its coefficients, so $r \in k$. Thus,
$$
\begin{aligned}
n &= \deg_x(f) = \deg_x(g(x)h(t) - g(t)h(x)) \\
&= \deg_t(g(x)h(t) - g(t)h(x)) \\
&= \deg_t(f) \ge m.
\end{aligned}
$$
Therefore, $n \ge m$. Since we have already proved that $n \le m$, we get $n = m$, and so $F = k(u)$. $\square$

Lüroth proved this theorem in 1876. It led to the following rationality problem: If $L$ is an intermediate field of $k(x_1,\dots,x_n)/k$ with $\operatorname{trdeg}(L/k) = n$, is $L/k$ rational? Castelnuovo proved in 1893 that this is true for $n = 2$ if $k$ is algebraically closed. It was not until the early 1970s, however, that an example of an intermediate field of $\mathbb{C}(x,y,z)/\mathbb{C}$ that is not rational over $\mathbb{C}$ was found.
