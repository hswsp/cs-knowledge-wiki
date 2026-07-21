# 23. Derivations and Differentials（导子与微分）

In this section, we discuss algebraic notions of derivation and differential, and we use these concepts to continue our study of finitely generated field extensions. We shall see that by using differentials we can determine the transcendence degree of a finitely generated extension and when a subset of a separably generated extension is a separating transcendence basis. As a geometric application, we use these ideas to define the tangent space to a point of a variety. By using tangent spaces, we are able to define the notion of nonsingular point on a variety. This is a more subtle geometric concept than those discussed in Section 21.

Let $A$ be a commutative ring, and let $M$ be an $A$-module. A derivation of $A$ into $M$ is a map $D : A \to M$ such that for all $a, b \in A$,
$$
\begin{aligned}
D(a + b) &= D(a) + D(b), \\
D(ab) &= bD(a) + aD(b).
\end{aligned}
$$
We write $\operatorname{Der}(A, M)$ for the set of all derivations of $A$ into $M$. Since the sum of derivations is easily seen to be a derivation, $\operatorname{Der}(A, M)$ is a group. Furthermore, $\operatorname{Der}(A, M)$ is an $A$-module by defining $aD : A \to M$ by $(aD)(x) = a(D(x))$.

**Example 23.1** The simplest example of a derivation is the polynomial derivative map $d/dx : k[x] \to k[x]$ defined by
$$
\frac{d}{dx}\left(\sum_{i=0}^n a_i x^i\right) = \sum_{i=1}^n i a_i x^{i-1},
$$
where $k$ is any commutative ring. The term $ia_i$ in the formula above is, of course, the sum of $a_i$ with itself $i$ times.

**Example 23.2** If $k$ is a field, then the derivation $d/dx$ on $k[x]$ can be extended to the quotient field $k(x)$ by use of the quotient rule; that is, the formula
$$
\frac{d}{dx}\left(\frac{f(x)}{g(x)}\right) = \frac{g(x)\frac{d}{dx}f(x) - f(x)\frac{d}{dx}g(x)}{g(x)^2}
$$
defines a derivation on $k(x)$. We shall see a generalization of this example in Lemma 23.10.

**Example 23.3** Let $k$ be any commutative ring, and let $A = k[x_1,\dots,x_n]$ be the polynomial ring in $n$ variables over $k$. Then the partial derivative maps $\partial/\partial x_i$ are each derivations of $A$ to itself.

**Example 23.4** Let $K$ be a field, and let $D \in \operatorname{Der}(K, K)$. If $a \in K^*$, we prove that $D(a^{-1}) = -a^{-2}D(a)$. To see this, note that $D(1) = 0$ by an application of the product rule. Thus,
$$
\begin{aligned}
0 &= D(1) = D(a \cdot a^{-1}) \\
&= a^{-1}(D(a)) + a D(a^{-1}).
\end{aligned}
$$
Solving for $D(a^{-1})$ gives $D(a^{-1}) = -a^{-2}D(a)$, as desired.

Other familiar facts from calculus can be verified for arbitrary derivations. For instance, if $K$ is a field and $a, b \in K$ with $b \ne 0$, and if $D \in \operatorname{Der}(K, K)$, then
$$
D\left(\frac{a}{b}\right) = \frac{b D(a) - a D(b)}{b^2}.
$$
To see this, we have
$$
\begin{aligned}
D(ab^{-1}) &= b^{-1} D(a) + a D(b^{-1}) \\
&= b^{-1} D(a) - a b^{-2} D(b) \\
&= b^{-2}(b D(a) - a D(b))
\end{aligned}
$$
from the previous calculation. This proves the validity of the quotient rule for derivations on a field.

Let $D$ be a derivation of a ring $A$ into an $A$-module $M$. An element $a \in A$ is said to be a constant for $D$ if $D(a) = 0$. It is not hard to see that the set of all constants for $D$ is a subring of $A$. If $B$ is a subring of $A$, let $\operatorname{Der}_B(A, M)$ be the set of all derivations $D : A \to M$ for which $D(b) = 0$ for all $b \in B$. By studying $\operatorname{Der}_B(A, A)$, we will obtain information about the extension $A/B$ when $A$ and $B$ are fields. To simplify notation, let $\operatorname{Der}_B(A) = \operatorname{Der}_B(A, A)$. We will call an element of $\operatorname{Der}_B(A)$ a $B$-derivation on $A$.

Let $K$ be a field extension of $F$. We wish to see how the vector space $\operatorname{Der}_F(K)$ gives information about the field extension $K/F$, and vice versa. We first consider algebraic extensions. The following lemma, which can be thought of as the chain rule for derivations, will be convenient in a number of places.

**Lemma 23.5** Let $K$ be a field extension of $k$, and let $D \in \operatorname{Der}_k(K)$. If $a \in K$ and $f(x) \in k[x]$, then $D(f(a)) = f'(a) D(a)$, where $f'(x)$ is the ordinary polynomial derivative of $f$. More generally, if $f(x_1,\dots,x_n) \in k[x_1,\dots,x_n]$ and $a_1,\dots,a_n \in K$, then
$$
D(f(a_1,\dots,a_n)) = \sum_{i=1}^n \frac{\partial f}{\partial x_i}(a_1,\dots,a_n) D(a_i).
$$

**Proof.** Suppose that $f(x) = \sum a_i x^i$. Then
$$
\begin{aligned}
D(f(a)) &= D\left(\sum a_i a^i\right) \\
&= \sum a_i D(a^i) = \sum a_i i a^{i-1} D(a) \\
&= f'(a) D(a).
\end{aligned}
$$
The second statement follows from much the same calculation. If $f = \sum_i a_i x_1^{i_1} \cdots x_n^{i_n}$, where $\mathbf{i} = (i_1,\dots,i_n)$, applying the property $D(ab) = bD(a) + aD(b)$ repeatedly, we see that
$$
\begin{aligned}
D(f(a_1,\dots,a_n)) &= \sum_{j=1}^n \sum_{\mathbf{i}} i_j a_{\mathbf{i}} a_1^{i_1} \cdots a_j^{i_j-1} a_j^{i_j-1} D(a_j) a_{j+1}^{i_{j+1}} \cdots a_n^{i_n} \\
&= \sum_{j=1}^n \frac{\partial f}{\partial x_j}(a_1,\dots,a_n) D(a_j).
\end{aligned}
$$
$\square$

**Proposition 23.6** Let $K$ be a separable algebraic field extension of $F$. Then $\operatorname{Der}_F(K) = 0$.

**Proof.** Suppose that $D \in \operatorname{Der}_F(K)$. If $a \in K$, let $p(x) = \min(F, a)$, a separable polynomial over $F$. Then
$$
0 = D(p(a)) = p'(a) D(a)
$$
by Lemma 23.5. Since $p$ is separable over $F$, the polynomials $p$ and $p'$ are relatively prime, so $p'(a) \ne 0$. Therefore, $D(a) = 0$, so $D$ is the zero derivation. $\square$

**Corollary 23.7** Let $k \subseteq F \subseteq K$ be fields, and suppose that $K/F$ is a finite separable extension. Then each $k$-derivation on $F$ extends uniquely to a $k$-derivation on $K$.

**Proof.** The uniqueness is a consequence of Proposition 23.6. If $D_1$ and $D_2$ are $k$-derivations of $K$ with the same restriction to $F$, then $D_1 - D_2 \in \operatorname{Der}_F(K)$, so $D_1 = D_2$. We now show that any derivation $D \in \operatorname{Der}_k(F)$ can be extended to a derivation $D'$ on $K$. We can write $K = F(u)$ for some $u$ separable over $F$. Let $p(x) = \min(F, u)$, and say $p(t) = \sum \beta_i t^i$. We first define $D'(u)$ by
$$
D'(u) = -\frac{\sum_i D(\beta_i) u^i}{p'(u)}.
$$
To define $D'$ in general, if $v \in K$, say $v = f(u)$ for some $f(t) \in F[t]$. If $f(t) = \sum_i a_i t^i$, define $D'$ on $K$ by
$$
D'(v) = f'(u) D'(u) + \sum_i D(a_i) u^i.
$$
These formulas are forced upon us by the requirement that $D'$ is an extension of $D$. The verification that $D'$ is indeed a well-defined derivation on $K$ is straightforward but tedious and will be left to the reader. $\square$

The converse of this proposition is also true, which we will verify shortly. To do this, we must look at inseparable extensions.

**Proposition 23.8** Suppose that $\operatorname{char}(F) = p > 0$, and let $K = F(a)$ be purely inseparable over $F$. If $K \ne F$, then $\operatorname{Der}_F(K)$ is a one-dimensional $K$-vector space.

**Proof.** Define $D : K \to K$ by $D(f(a)) = f'(a)$. We need to show that $D$ is well defined. Let $p(x) = \min(F,a)$. Then $p(x) = x^{p^m} - a$ for some $m \in \mathbb{N}$ and some $a \in F$. If $f(a) = g(a)$, then $p$ divides $f - g$, so $f(x) - g(x) = p(x) q(x)$ for some $q$. Taking derivatives, we have $f'(x) - g'(x) = p(x) q'(x)$, since $p'(x) = 0$. Therefore, $f'(a) = g'(a)$, so $D$ is well defined. A short calculation shows that $D$ is an $F$-derivation on $K$. If $E$ is any derivation of $K$, then $E(f(a)) = f'(a) E(a)$ by Lemma 23.5, so $E$ is a scalar multiple of $D$, namely $E = \beta D$ if $\beta = E(a)$. Therefore, $\operatorname{Der}_F(K)$ is spanned by $D$, so $\operatorname{Der}_F(K)$ is one dimensional as a $K$-vector space. $\square$

We can now prove the converse of Proposition 23.6. This converse gives a test for separability by using derivations.

**Corollary 23.9** If $K$ is an algebraic extension of $F$ with $\operatorname{Der}_F(K) = 0$, then $K/F$ is separable.

**Proof.** Suppose that $\operatorname{Der}_F(K) = 0$, and let $S$ be the separable closure of $F$ in $K$. If $K \ne S$, then there is a proper subfield $L$ of $K$ containing $S$ and an $a \in K$ with $K = L(a)$ and $K/L$ purely inseparable. The previous proposition shows that $\operatorname{Der}_L(K) \ne 0$, so $\operatorname{Der}_F(K)$ is also nonzero, since it contains $\operatorname{Der}_L(K)$. This contradicts the assumption that $\operatorname{Der}_F(K) = 0$, so $K$ is separable over $F$. $\square$

We now consider transcendental extensions. First, we need a lemma that will allow us to work with polynomial rings instead of rational function fields.

**Lemma 23.10** Let $A$ be an integral domain with quotient field $K$. Then any derivation on $A$ has a unique extension to $K$. If $D \in \operatorname{Der}_B(A)$ for some subring $B$ of $A$, then the unique extension of $D$ to $K$ lies in $\operatorname{Der}_F(K)$, where $F$ is the quotient field of $B$.

**Proof.** Let $D \in \operatorname{Der}(A)$. Define $D' : K \to K$ by
$$
D'(a/b) = \frac{b D(a) - a D(b)}{b^2}
$$
if $a, b \in A$ and $b \ne 0$. We first note that $D'$ is well defined. If $a/b = c/d$, then $ad = bc$, so $a D(d) + d D(a) = b D(c) + c D(b)$. Thus, by multiplying both sides by $bd$ and rearranging terms, we get
$$
b d^2 D(a) - b c d D(b) = b^2 d D(c) - a b d D(d).
$$
Using the relation $ad = bc$, we can simplify this to
$$
d^2 (b D(a) - a D(b)) = b^2 (d D(c) - c D(d)),
$$
so
$$
\frac{b D(a) - a D(b)}{b^2} = \frac{d D(c) - c D(d)}{d^2},
$$
proving that $D'$ is well defined. Checking that $D'$ is a derivation is straightforward and will be left to the reader.

To verify uniqueness of extensions, suppose that $D$ is a derivation on $K$. If $a \in K$, we may write $a = a/b$ with $a, b \in A$. Then
$$
\begin{aligned}
D(a) &= D(a b^{-1}) \\
&= b^{-1} D(a) + a D(b^{-1}) \\
&= b^{-1} D(a) - a b^{-2} D(b),
\end{aligned}
$$
the final equality coming from Example 23.4. This formula shows that $D$ is determined by its action on $A$. $\square$

The following proposition determines the module of derivations for a purely transcendental extension of finite transcendence degree.

**Proposition 23.11** Suppose that $K = k(x_1,\dots,x_n)$ is the rational function field over a field $k$ in $n$ variables. Then $\operatorname{Der}_k(K)$ is an $n$-dimensional $K$-vector space with basis $\{\partial/\partial x_i : 1 \le i \le n\}$.

**Proof.** Let $f \in k[x_1,\dots,x_n]$. If $D \in \operatorname{Der}_k(K)$, then by Lemma 23.5, we have $D(f) = \sum_i D(x_i) (\partial f/\partial x_i)$. Therefore, the $n$ partial derivations $\partial/\partial x_i$ span $\operatorname{Der}_k(k[x_1,\dots,x_n])$. Moreover, they are $K$-linearly independent; if $\sum_j a_j \partial/\partial x_j = 0$, then
$$
0 = \sum_j a_j \frac{\partial x_i}{\partial x_j} = a_i.
$$
This proves independence, so the $\partial/\partial x_i$ form a basis for $\operatorname{Der}_k(k[x_1,\dots,x_n])$. Finally, a use of the quotient rule (Example 23.4) shows that the $\partial/\partial x_i$ form a basis for $\operatorname{Der}_k(K)$. $\square$

We can generalize this theorem to any finitely generated, separable extension.

**Theorem 23.12** Suppose that $K/k$ is a finitely generated, separable extension. Then $\operatorname{trdeg}(K/k) = \dim_K(\operatorname{Der}_k(K))$. If $\{x_1,\dots,x_n\}$ is a separating transcendence basis for $K/k$ and if $F = k(x_1,\dots,x_n)$, then there is a basis $\{\delta_i : 1 \le i \le n\}$ for $\operatorname{Der}_k(K)$ with $\delta_i|_F = \partial/\partial x_i$ for each $i$.

**Proof.** Let $\{x_1,\dots,x_n\}$ be a separating transcendence basis for $K/k$, and set $F = k(x_1,\dots,x_n)$. The extension $K/F$ is finite and separable. By Corollary 23.7, for each $i$ the derivation $\partial/\partial x_i$ extends uniquely to a derivation $\delta_i$ on $K$. We show that the $\delta_i$ form a basis for $\operatorname{Der}_k(K)$. It is easy to see that the $\delta_i$ are $K$-linearly independent, for if $\sum_i a_i \delta_i = 0$ with the $a_i \in K$, then
$$
0 = \left(\sum_i a_i \delta_i\right)(x_j) = \sum_i a_j \frac{\partial x_j}{\partial x_i} = a_j
$$
for each $j$. To show that the $\delta_i$ span $\operatorname{Der}_k(K)$, let $D$ be a $k$-derivation of $K$, and let $a_i = D(x_i)$. Then $D - \sum_i a_i \delta_i$ is a derivation on $K$ that is trivial on $F$. But $\operatorname{Der}_F(K) = 0$ by Proposition 23.6, so $D = \sum_i a_i \delta_i$. $\square$

**Differentials**

Let $B \subseteq A$ be commutative rings. Then the module of differentials $\Omega_{A/B}$ is the $A$-module spanned by symbols $da$, one for each $a \in A$, subject to the relations
$$
\begin{aligned}
da &= 0, \\
d(ab) &= a\,db + b\,da
\end{aligned}
$$
for $a \in B$ and $a,b \in A$; that is, $\Omega_{A/B}$ is the $A$-module $M/N$, where $M$ is the free $A$-module on the set of symbols $\{da : a \in A\}$ and $N$ is the submodule generated by the elements
$$
\begin{aligned}
&da, \\
&d(a + b) - da - db, \\
&d(ab) - (a\,db + b\,da)
\end{aligned}
$$
for $a \in B$ and $a, b \in A$. The map $d : A \to \Omega_{A/B}$ given by $d(a) = da$ is a $B$-derivation on $A$ by the definition of $\Omega_{A/B}$.

The module of differentials is determined by the following universal mapping property.

**Proposition 23.13** Suppose that $D : A \to M$ is a $B$-derivation from $A$ to an $A$-module $M$. Then there is a unique $A$-module homomorphism $f : \Omega_{A/B} \to M$ with $f \circ d = D$; that is, $f(da) = D(a)$ for all $a \in A$. In other words, the following diagram commutes:
$$
\begin{CD}
A @>D>> M \\
@VdVV @A{f}AA \\
\Omega_{A/B} @= \Omega_{A/B}
\end{CD}
$$

**Proof.** Given $D$, we have an $A$-module homomorphism $f$ defined on the free $A$-module on the set $\{da : a \in A\}$ into $M$ that sends $da$ to $D(a)$. Since $D$ is a $B$-derivation, $f$ is compatible with the defining relations for $\Omega_{A/B}$; hence, $f$ factors through these relations to give an $A$-module homomorphism $f : \Omega_{A/B} \to M$ with $f(da) = D(a)$ for all $a \in A$. The uniqueness of $f$ is clear from the requirement that $f(da) = D(a)$, since $\Omega_{A/B}$ is generated by $\{da : a \in A\}$. $\square$

**Corollary 23.14** If $B \subseteq A$ are commutative rings and $M$ is an $A$-module, then $\operatorname{Der}_B(A, M) \cong \operatorname{hom}_A(\Omega_{A/B}, M)$.

**Proof.** This is really just a restatement of the universal mapping property for differentials. Define $\varphi : \operatorname{Der}_B(A,M) \to \operatorname{hom}_A(\Omega_{A/B}, M)$ by letting $\varphi(D)$ be the unique element $f$ of $\operatorname{hom}_A(\Omega_{A/B}, M)$ that satisfies $f \circ d = D$. A short computation using the uniqueness part of the mapping property shows that $\varphi$ is an $A$-module homomorphism. For injectivity, if $\varphi(D) = 0$, then the condition that $\varphi(D) \circ d = D$ shows that $D = 0$. Finally, for surjectivity, if $f \in \operatorname{hom}_A(\Omega_{A/B}, M)$, then setting $D = f \circ d$ yields $\varphi(D) = f$. $\square$

If $M = A$, then the corollary shows that $\operatorname{Der}_B(A) \cong \operatorname{hom}_A(\Omega_{A/B}, A)$, the dual module to $\Omega_{A/B}$. The next corollary follows immediately from this observation.

**Corollary 23.15** If $K$ is a field extension of $F$, then
$$
\dim_K(\Omega_{K/F}) = \dim_K(\operatorname{Der}_F(K)).
$$

The following corollary is a consequence of the previous corollary together with Theorem 23.12.

**Corollary 23.16** If $\{x_1,\dots,x_n\}$ is a separating transcendence basis for an extension $K/k$, then $\{dx_1,\dots,dx_n\}$ is a $K$-basis for $\Omega_{K/k}$.

**Proof.** Suppose that $\{x_1,\dots,x_n\}$ is a separating transcendence basis for $K/k$. By Theorem 23.12, there is a basis $\{\delta_1,\dots,\delta_n\}$ of $\operatorname{Der}_k(K)$ such that $\delta_i$ extends the derivation $\partial/\partial x_i$ on $k(x_1,\dots,x_n)$. By the universal mapping property for differentials, there are $f_i \in \operatorname{hom}_K(\Omega_{K/k}, K)$ with $f_i(dx_j) = \delta_i(x_j)$ for each $j$. But, $\delta_i(x_j) = 0$ if $i \ne j$, and $\delta_i(dx_i) = 1$. Under the isomorphism $\operatorname{Der}_k(K) \cong \operatorname{hom}_K(\Omega_{K/k}, K)$, the $\delta_i$ are sent to the $f_i$, so the $f_i$ form a basis for $\operatorname{hom}_K(\Omega_{K/k}, K)$. The dual basis of $\Omega_{K/k}$ to the $f_i$ is then $\{dx_1,\dots,dx_n\}$, so this set is a basis for $\Omega_{K/k}$. $\square$

The converse of this corollary is also true, and the converse gives us a way to determine when a set of elements form a separating transcendence basis.

**Proposition 23.17** Suppose that $K$ is a separably generated extension of $k$. If $x_1,\dots,x_n \in K$ such that $dx_1,\dots,dx_n$ is a $K$-basis for $\Omega_{K/k}$, then $\{x_1,\dots,x_n\}$ is a separating transcendence basis for $K/k$.

**Proof.** Since $K/k$ is separably generated, $n = \operatorname{trdeg}(K/k)$ by Theorem 23.12 and Corollary 23.15. Let $\{y_1,\dots,y_n\}$ be a separating transcendence basis for $K/k$. We will show that $\{x_1,\dots,x_n\}$ is also a separating transcendence basis by replacing, one at a time, a $y_i$ by an $x_j$ and showing that we still have a separating transcendence basis. The element $x_1$ is separable over $k(y_1,\dots,y_n)$, so there is an irreducible polynomial $p(t) \in k(y_1,\dots,y_n)[t]$ with $p(x_1) = 0$ and $p'(x_1) \ne 0$. We can write $p(t)$ in the form
$$
p(t) = \frac{f_0}{g_0} + \frac{f_1}{g_1} t + \cdots + \frac{f_n}{g_n} t^n
$$
with each $f_i, g_i \in k[y_1,\dots,y_n]$. By clearing denominators and dividing out the greatest common divisor of the new coefficients, we obtain a primitive irreducible polynomial $f(y_1,\dots,y_n, t)$ with $f(y_1,\dots,y_n, x_1) = 0$ and $(\partial f/\partial t)(y_1,\dots,y_n, x_1) \ne 0$. Let $P = (y_1,\dots,y_n, x_1)$. Taking differentials and using the chain rule yields
$$
0 = \frac{\partial f}{\partial t}(P) dx_1 + \sum_{j=1}^n \frac{\partial f}{\partial y_j}(P) dy_j.
$$
Consequently,
$$
dx_1 = \sum_{j=1}^n -\frac{(\partial f/\partial y_j)(P)}{(\partial f/\partial t)(P)} dy_j.
$$
The differential $dx_1 \ne 0$, so some $(\partial f/\partial y_j)(P) \ne 0$. By relabeling if necessary, we may assume that $(\partial f/\partial y_1)(P) \ne 0$. The equation $f(y_1,\dots,y_n, x_1) = 0$ shows that $y_1$ is algebraic over $k(x_1, y_2,\dots,y_n)$. Moreover, the condition $(\partial f/\partial y_1)(P) \ne 0$ implies that $y_1$ is separable over $k(x_1, y_2,\dots,y_n)$. Thus, each $y_i$ is separable over $k(x_1, y_2,\dots,y_n)$, and since $K$ is separable over $k(x_1, y_2,\dots,y_n)$, by transitivity the set $\{x_1, y_2,\dots, y_n\}$ is a separating transcendence basis for $K/k$.

Now, assume that for some $i \ge 1$, $\{x_1,\dots,x_i, y_{i+1},\dots, y_n\}$ is a separating transcendence basis for $K/k$. Repeating the argument above for $x_{i+1}$ in place of $x_1$, there is an irreducible primitive polynomial equation $g(Q) = 0$ with $(\partial g/\partial t)(Q) \ne 0$, if $Q = (x_1,\dots,x_i, y_{i+1},\dots,y_n, x_{i+1})$. This yields an equation
$$
dx_{i+1} = \sum_{j=1}^i -\frac{(\partial g/\partial x_j)(Q)}{(\partial g/\partial t)(Q)} dx_j - \sum_{j=i+1}^n \frac{(\partial g/\partial y_j)(Q)}{(\partial g/\partial t)(Q)} dy_j.
$$
The differentials $dx_1,\dots,dx_n$ are $K$-independent, so some $(\partial g/\partial y_j)(Q) \ne 0$. Relabeling if necessary, we may assume that $(\partial g/\partial y_{i+1})(Q) \ne 0$. Consequently, $y_{i+1}$ is separable over $k(x_1,\dots,x_{i+1}, y_{i+2},\dots, y_n)$. As above, this means that $\{x_1,\dots,x_{i+1}, y_{i+2},\dots, y_n\}$ is a separating transcendence basis for $K/k$. Continuing this procedure shows that $\{x_1,\dots,x_n\}$ is a separating transcendence basis for $K/k$. $\square$

**Example 23.18** Let $k_0$ be a field of characteristic $p$, let $K = k_0(x,y)$ be the rational function field in two variables over $k_0$, and let $k = k_0(x^p, y^p)$. Then $\{x,y\}$ is algebraically dependent over $k$; in fact, $K/k$ is algebraic. However, $dx$ and $dy$ are $K$-independent in $\Omega_{K/k}$; to see this, suppose that $a\,dx + b\,dy = 0$ for some $a, b \in K$. The $k_0$-derivations $\partial/\partial x$ and $\partial/\partial y$ are actually $k$-derivations by the choice of $k$. By the universal mapping property for differentials, there are $f, g \in \operatorname{hom}_K(\Omega_{K/F}, K)$ with $f \circ d = \partial/\partial x$ and $g \circ d = \partial/\partial y$. Then $f(a\,dx + b\,dy) = a f(dx) + b f(dy) = a$ and $g(a\,dx + b\,dy) = b$. Thus, $a = b = 0$, so $dx$ and $dy$ are $K$-independent. This shows that Proposition 23.17 is false if $K/k$ is not separably generated.

**The tangent space of a variety**

Let $f(x,y)$ be a polynomial in $\mathbb{R}[x,y]$. The equation $f(x,y) = 0$ defines $y$ implicitly as a function of $x$. If $P = (a,b)$ is a point on the curve $f = 0$, then, as long as the tangent line to the curve at $P$ is not vertical, we have
$$
\frac{dy}{dx}(a) = -\frac{\partial f/\partial x}{\partial f/\partial y}(P),
$$
so the tangent line to the curve at $P$ can be written in the form
$$
\frac{\partial f}{\partial x}(P)(x - a) + \frac{\partial f}{\partial y}(P)(y - b) = 0.
$$
This formula is valid even if the tangent line at $P$ is vertical. To deal with vector subspaces, we define the tangent space to the curve $f = 0$ at $P$ to be the set of solutions to the equation
$$
\frac{\partial f}{\partial x}(P) \cdot x + \frac{\partial f}{\partial y}(P) \cdot y = 0.
$$
This tangent space is a vector subspace of $\mathbb{R}^2$.

The curve $f = 0$ is nothing more than the set of $\mathbb{R}$-rational points of the $\mathbb{R}$-variety $Z(f)$. We can give a meaningful definition of the tangent space to any $k$-variety, for any field $k$, by mimicking the case of real plane curves. Let $V$ be a $k$-variety in $C^n$, where, as usual, $C$ is an algebraically closed extension of $k$, and let $P \in V$. For $f \in k[x_1,\dots,x_n]$, let
$$
d_P f = \sum_{i=1}^n \frac{\partial f}{\partial x_i}(P) x_i.
$$
The linear polynomial $d_P f$ is called the differential of $f$ at $P$.

**Definition 23.19** If $V$ is a $k$-variety, then the tangent space $T_P(V)$ to $V$ at $P$ is the zero set $Z(\{d_P f : f \in I(V)\})$.

**Example 23.20** By the Hilbert basis theorem, any ideal of $k[x_1,\dots,x_n]$ can be generated by a finite number of polynomials. Suppose that $I(V)$ is generated by $\{f_1,\dots,f_r\}$. Then we show that $T_P(V) = Z(\{d_P f_1,\dots,d_P f_r\})$. If $h = \sum g_i f_i$, then by the product rule,
$$
\begin{aligned}
d_P h &= \sum g_i(P) d_P f_i + \sum d_P g_i \cdot f_i(P) \\
&= \sum g_i(P) d_P f_i.
\end{aligned}
$$
This shows that $d_P h$ is a linear combination of the $d_P f_i$ for any $h \in I(V)$.

**Example 23.21** If $V = Z(y - x^2)$ and $P = (a, a^2)$, then $T_P(V) = Z(y + 2a x)$. If $P = (0,0)$ is the origin, then $T_P(V)$ is the $x$-axis.

**Example 23.22** Let $V = Z(y^2 - x^3)$. If $P = (0,0)$, then $d_P f = 0$ for all $f \in I(V)$. Consequently, $T_P(V) = C^2$.

**Example 23.23** Let $V = Z(x^2 + y^2 + z^2 - 1)$, and assume that $\operatorname{char}(k) \ne 2$. If $P = (a,b,c)$ and $f = x^2 + y^2 + z^2 - 1$, then $d_P f = 2a x + 2b y + 2c z$, so $T_P(V) = Z(a x + b y + c z)$. Since $(a,b,c) \ne (0,0,0)$ for all $P \in V$, the tangent space $T_P(V)$ is a 2-dimensional vector space over $C$.

One of the uses of the tangent space is to define nonsingularity. To keep things as simple as possible, we first consider hypersurfaces; that is, varieties of the form $Z(f)$ for a single polynomial $f$.

**Definition 23.24** Let $V = Z(f)$ be a $k$-hypersurface. A point $P \in V$ is nonsingular, provided that at least one of the partial derivatives $\partial f/\partial x_i$ does not vanish at $P$; that is, $P$ is nonsingular, provided that $d_P f \ne 0$. Otherwise, $P$ is said to be singular. If every point on $V$ is nonsingular, then $V$ is said to be nonsingular.

We can interpret this definition in other ways. The tangent space of $V = Z(f)$ at $P$ is the zero set of $d_P f = \sum_i (\partial f/\partial x_i)(P) x_i$, so $T_P(V)$ is the zero set of a single linear polynomial. If $f \in k[x_1,\dots,x_n]$, then $T_P(V)$ is either an $(n - 1)$-dimensional vector space or is all of $C^n$, depending on whether $d_P f \ne 0$ or not. But, the point $P \in V$ is nonsingular if and only if $d_P f \ne 0$, so $P$ is nonsingular if and only if $\dim_k(T_P(V)) = \dim(V) = n - 1$, the latter equality from Example 22.8, and $P$ is singular if $\dim_k(T_P(V)) > \dim(V)$.

**Example 23.25** The parabola $Z(y - x^2)$ is a nonsingular curve, whereas $Z(y^2 - x^3)$ has a singularity at the origin. Every other point of $Z(y^2 - x^3)$ is nonsingular by an easy calculation. The sphere $Z(x^2 + y^2 + z^2 - 1)$ is also a nonsingular variety, provided that $\operatorname{char}(k) \ne 2$.

For one application of the notion of nonsingularity, we point to Problem 6, which outlines a proof that the function field of the $\mathbb{C}$-variety $Z(y^2 - (x^3 - x))$ is not rational over $\mathbb{C}$.

We now look into nonsingularity for an arbitrary variety. Suppose that $V$ is a $k$-variety, and let $f_1,\dots,f_m$ be polynomials that generate the ideal $I(V)$. Let $P \in V$, and consider the Jacobian matrix
$$
J(f_1,\dots,f_m) = \begin{pmatrix}
\frac{\partial f_1}{\partial x_1}(P) & \cdots & \frac{\partial f_1}{\partial x_n}(P) \\
\vdots & \ddots & \vdots \\
\frac{\partial f_m}{\partial x_1}(P) & \cdots & \frac{\partial f_m}{\partial x_n}(P)
\end{pmatrix}.
$$
One interpretation of the definition of a nonsingular point on a hypersurface is that a point $P \in Z(f)$ is nonsingular if $\operatorname{rank}(J(f)) = 1$, and $P$ is singular if $\operatorname{rank}(J(f)) = 0$. In other words, $P$ is nonsingular if the rank of $J(f)$ is equal to $n - \dim(V)$.

**Definition 23.26** Suppose that $V$ is an irreducible $k$-variety in $C^n$, and let $f_1,\dots,f_m$ be generators of $I(V)$. If $P \in V$, then $P$ is nonsingular if the rank of $J(f_1,\dots,f_m)$ is equal to $n - \dim(V)$.

The following proposition shows that $n - \dim(V)$ is an upper bound for the rank of the Jacobian matrix. Thus, a point is nonsingular, provided that the Jacobian matrix has maximal rank. We will call an irreducible $k$-variety $V$ absolutely irreducible if the ideal $I(V)$ is an absolutely prime ideal of $k[x_1,\dots,x_n]$.

**Proposition 23.27** Suppose that $V$ is an absolutely irreducible $k$-variety in $C^n$. Let $P \in V$, and let $f_1,\dots,f_m$ be generators of the ideal $I(V)$. Then $\operatorname{rank}(J(f_1,\dots,f_m)) \le n - \dim(V)$.

**Proof.** We will prove this in a number of steps. Let $K$ be the function field of $V$. The assumption that $V$ is absolutely irreducible means that $K/k$ is a regular extension, by Theorem 22.10. Therefore, $K/k$ is separably generated, so $\operatorname{trdeg}(K/k) = \dim(\operatorname{Der}_k(K))$, and so $\dim(V) = \dim(\operatorname{Der}_k(K))$. The coordinate ring of $V$ is $k[V] = k[x_1,\dots,x_n]/I(V) = k[s_1,\dots,s_n]$, where $s_i = x_i + I(V)$. Thus, $K = k(s_1,\dots,s_n)$. Let $Q = (s_1,\dots,s_n) \in K^n$. We first point out that
$$
I(V) = \{f \in k[x_1,\dots,x_n] : f(s_1,\dots,s_n) = 0\}.
$$
For $f \in I(V)$, let $d_Q f = \sum_{i=1}^n x_i (\partial f/\partial x_i)(Q)$. We view $d_Q f$ as a linear functional on $K^n$; that is, we view $d_Q f$ as a linear transformation from $K^n$ to $K$ defined by
$$
(d_Q f)(\alpha_1,\dots,\alpha_n) = \sum_{i=1}^n \alpha_i \frac{\partial f}{\partial x_i}(Q).
$$
Let $M$ be the subspace of $\operatorname{hom}_K(K^n, K)$ spanned by the $d_Q f$ as $f$ ranges over $I(V)$. Now that we have given an interpretation of the differentials $d_Q f$ as linear functionals, we interpret derivations as elements of $K^n$. For $D \in \operatorname{Der}_k(K)$, we obtain an $n$-tuple $(D(s_1),\dots,D(s_n))$. A $k$-derivation on $K$ is determined by its action on the generators $s_1,\dots,s_n$ of $K/k$. Therefore, the map $D \mapsto (D(s_1),\dots,D(s_n))$ is a $K$-vector space injection from $\operatorname{Der}_k(K)$ to $K^n$. We denote by $\mathcal{D}$ the image of this transformation.

Next, we verify that an $n$-tuple $(\alpha_1,\dots,\alpha_n)$ lies in $\mathcal{D}$ if and only if $d_Q f(\alpha_1,\dots,\alpha_n) = 0$. One direction of this is easy. By the chain rule, we see that
$$
\sum_{i=1}^n \frac{\partial f}{\partial x_i}(Q) D(s_i) = D(f(s_1,\dots,s_n)) = 0
$$
if $f \in I(V)$. For the other direction, suppose that $d_Q f(\alpha_1,\dots,\alpha_n) = 0$. We define a derivation $D$ on $K$ with $D(s_i) = \alpha_i$ as follows. First, let $D'$ be the derivation $D' : k[x_1,\dots,x_n] \to K$ defined by $D' = \sum_i \alpha_i (\partial/\partial x_i)(Q)$; that is, $D'(f) = \sum_i \alpha_i (\partial f/\partial x_i)(Q)$. The condition on the $\alpha_i$ shows that $D'(f) = 0$ if $f \in I(V)$, so $D'$ induces a $k$-derivation $D : k[V] \to K$ defined by $D(g + I(V)) = D'(g)$. The quotient rule for derivations shows that $D$ extends uniquely to a derivation on $K$, which we also call $D$. The definition of $D'$ gives us $D(s_i) = \alpha_i$, so $(\alpha_1,\dots,\alpha_n) \in \mathcal{D}$ as desired. Now that we have verified our claim, we use linear algebra. The subspace $\mathcal{D}$ of $K^n$ is the set
$$
\mathcal{D} = \{v \in K^n : d_Q f(v) = 0 \text{ for all } d_Q f \in M\}.
$$
From linear algebra, this implies that $\dim(\mathcal{D}) + \dim(M) = n$. Since
$$
\dim(M) = \dim(\operatorname{Der}_k(K)) = \dim(V),
$$
we get $\dim(\mathcal{D}) = n - \dim(V)$.

The final step is to verify that $\dim(\mathcal{D}) = \operatorname{rank}(J')$, where $J'$ is the matrix $((\partial f_i/\partial x_j)(Q))$, and that $\operatorname{rank}(J') \ge \operatorname{rank}(J)$, if $J$ is the Jacobian matrix $((\partial f_i/\partial x_j)(P))$. This will show that
$$
\operatorname{rank}(J) \le \operatorname{rank}(J') = n - \dim(V),
$$
our desired result. The first of these claims is easy. The space $\mathcal{D}$ is spanned by the $d_Q f_i$, since the $f_i$ generate the ideal $I(V)$. The $i$th row of $J'$ is the matrix representation of the linear transformation $d_Q f_i$, so the rank of $J'$ is the dimension of the space spanned by the $d_Q f_i$; in other words, $\operatorname{rank}(J) = \dim(\mathcal{D})$. For the inequality $\operatorname{rank}(J') \ge \operatorname{rank}(J)$, let $P = (a_1,\dots,a_n) \in V$. There is a homomorphism $\varphi : k[x_1,\dots,x_n] \to C$ with $\varphi(x_i) = a_i$. Since $P \in V$, we have $f(P) = 0$ for all $f \in I(V)$, so $I(V) \subseteq \ker(\varphi)$. We get an induced map $\overline{\varphi} : k[V] \to C$ that sends $s_i$ to $a_i$. Under this map $(\partial f_i/\partial x_j)(Q)$ is sent to $(\partial f_i/\partial x_j)(P)$. If $\operatorname{rank}(J') = r$, then the rows of $J'$ are linear combinations of some $r$ rows of $J'$. Viewing $\overline{\varphi}$ as a map on matrices, since $\overline{\varphi}(J') = J$ the rows of $J$ are linear combinations of the corresponding $r$ rows of $J$. Thus, the rank of $J$ is at most $r$, so $\operatorname{rank}(J') \ge \operatorname{rank}(J)$. This finishes the proof. $\square$

As a consequence of the proof of this proposition, we obtain a relation between the dimension of the tangent space $T_P(V)$ and of $V$.

**Corollary 23.28** Let $V$ be an absolutely irreducible $k$-variety, and let $P \in V$. Then $\dim(T_P(V)) \ge \dim(V)$, and $\dim(T_P(V)) = \dim(V)$ if and only if $P$ is nonsingular.

**Proof.** The tangent space $T_P(V)$ is the set
$$
T_P(V) = \{Q \in C^n : d_P f(Q) = 0 \text{ for all } f \in I(V)\}.
$$
Using the notation of the proof of the previous proposition, the map $\overline{\varphi}$ induces a map on differentials that sends $d_Q f$ to $d_P f$. If $N = \{d_P f : f \in I(V)\}$, viewed as a subspace of $\operatorname{hom}_C(C^n, C)$, then by linear algebra, we have $\dim(N) + \dim(T_P(V)) = n$. However, $\overline{\varphi}$ sends $M$ to $N$, so $\dim(M) \ge \dim(N)$; hence,
$$
\begin{aligned}
\dim(T_P(V)) &= n - \dim(N) \ge n - \dim(M) \\
&= n - \dim(V).
\end{aligned}
$$
Moreover, $\dim(T_P(V)) = \operatorname{rank}(J)$ by the same argument that shows $\dim(\mathcal{D}) = \operatorname{rank}(J')$. Therefore, we get equality above exactly when $\operatorname{rank}(J') = \operatorname{rank}(J)$ or when $\operatorname{rank}(J) = n - \dim(V)$. However, this is true if and only if $P$ is nonsingular, by the definition of nonsingularity. $\square$

Let $k$ be a field, and let $C$ be an algebraically closed extension of $k$. In Example 22.4, we showed how one can obtain an irreducible $k$-variety from a finitely generated field extension of $k$. This map is not the inverse of the map that associates to each irreducible $k$-variety $V$ the function field $k(V)$. In that example, we saw that the nonsingular curve $y = x^2$ has the same function field as the singular curve $y^2 = x^3$. However, nonsingularity is not the only problem. We have only talked about affine varieties; that is, varieties inside the affine space $C^n$. In algebraic geometry, one usually works with projective varieties. It is proved in many algebraic geometry books that there is a 1-1 correspondence between finitely generated regular extensions of $k$ of transcendence degree 1 and nonsingular projective curves. Moreover, if we work over $\mathbb{C}$, then there is also a 1-1 correspondence between finitely generated extensions of $\mathbb{C}$ of transcendence degree 1 and Riemann surfaces. The interested reader can find the correspondence between nonsingular projective curves and extensions of transcendence degree 1 in Section 1.6 of Hartshorne [11] and can find the connection with Riemann surfaces in Chevalley [4].
