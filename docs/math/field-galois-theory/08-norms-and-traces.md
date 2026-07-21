# 8. Norms and Traces（范与迹）

In this section, we define the norm and trace of a finite extension of fields and prove their basic properties. To help motivate these concepts, in Examples 7.9 and 7.10 we used elements of the form $\sum_{\sigma\in H}\sigma(\omega)$ to generate the intermediate field $\mathcal{F}(H)$ of a cyclotomic extension. We will see that the sum $\sum_{\sigma\in H}\sigma(\omega)$ is the trace of $\omega$ in the extension $K/\mathcal{F}(H)$. The definitions we give will not look like these sums; instead, we define the norm and trace in terms of linear transformations. This approach generalizes more readily to other situations. For instance, given a division ring (finite dimensional over its center), there is a notion of norm and trace that is quite important.

Let $K$ be a field extension of $F$ with $[K:F]=n$. If $a\in K$, let $L_a$ be the map $L_a:K\to K$ given by $L_a(b)=ab$. It is easy to see that $L_a$ is an $F$-vector space homomorphism. Since $K$ is a finite dimensional $F$-vector space, we can view $F$-linear transformations of $K$ as matrices by using bases; that is, if $\operatorname{End}_F(K)=\operatorname{hom}_F(K,K)$ is the ring of all $F$-vector space homomorphisms from $K$ to $K$, then there is an isomorphism $\operatorname{End}_F(K)\cong M_n(F)$, where $M_n(F)$ is the ring of $n\times n$ matrices over $F$.

If $\varphi:\operatorname{End}_F(K)\to M_n(F)$ is an isomorphism, we can use $\varphi$ to define the determinant and trace of a linear transformation. If $T\in\operatorname{End}_F(K)$, let $\det(T)=\det(\varphi(T))$ and $\operatorname{Tr}(T)=\operatorname{Tr}(\varphi(T))$. These definitions do not depend on $\varphi$; to see this, let $\psi$ be another isomorphism. Then $\psi$ corresponds to choosing a basis for $K$ different from that used to obtain $\varphi$. Therefore, the two matrix representations of a transformation $T$ are similar; that is, there is an invertible matrix $A$ with $\psi(T)=A^{-1}\varphi(T)A$. Therefore, $\det(\psi(T))=\det(\varphi(T))$ and $\operatorname{Tr}(\psi(T))=\operatorname{Tr}(\varphi(T))$.

**Definition 8.1** Let $K$ be a finite extension of $F$. The norm $N_{K/F}$ and trace $T_{K/F}$ are defined for all $a\in K$ by
$$
N_{K/F}(a)=\det(L_a),\qquad T_{K/F}(a)=\operatorname{Tr}(L_a).
$$

**Example 8.2** Let $F$ be any field, and let $K=F(\sqrt{d})$ for some $d\in F-F^2$. A convenient basis for $K$ is $\{1,\sqrt{d}\}$. If $\alpha=a+b\sqrt{d}$ with $a,b\in F$, we determine the norm and trace of $\alpha$. The linear transformation $L_\alpha$ is equal to $aL_1+bL_{\sqrt{d}}$, so we first need to find the matrix representations for $L_1$ and $L_{\sqrt{d}}$. The identity transformation $L_1$ has matrix $\begin{pmatrix}1&0\\0&1\end{pmatrix}$. For $L_{\sqrt{d}}$, we have
$$
L_{\sqrt{d}}(1)=\sqrt{d}=0\cdot 1+1\cdot\sqrt{d},
$$
$$
L_{\sqrt{d}}(\sqrt{d})=d=d\cdot 1+0\cdot\sqrt{d}.
$$
Therefore, the matrix for $L_{\sqrt{d}}$ is $\begin{pmatrix}0&d\\1&0\end{pmatrix}$. The matrix for $L_\alpha$ is then
$$
a\begin{pmatrix}1&0\\0&1\end{pmatrix}+b\begin{pmatrix}0&d\\1&0\end{pmatrix}=\begin{pmatrix}a&bd\\b&a\end{pmatrix}.
$$
From this we obtain $N_{K/F}(a+b\sqrt{d})=a^2-b^2d$ and $T_{K/F}(a+b\sqrt{d})=2a$. In particular, $N_{K/F}(\sqrt{d})=-d$ and $T_{K/F}(\sqrt{d})=0$.

**Example 8.3** Let $F=\mathbb{Q}$ and $K=\mathbb{Q}(\sqrt[3]{2})$. We will determine the norm and trace of $\sqrt[3]{2}$. An $F$-basis for $K$ is $\{1,\sqrt[3]{2},\sqrt[3]{4}\}$. We can check that $L_{\sqrt[3]{2}}(1)=\sqrt[3]{2}$, $L_{\sqrt[3]{2}}(\sqrt[3]{2})=\sqrt[3]{4}$, and $L_{\sqrt[3]{2}}(\sqrt[3]{4})=2$. Therefore, the matrix representing $L_{\sqrt[3]{2}}$ using this basis is
$$
\begin{pmatrix}0&0&2\\1&0&0\\0&1&0\end{pmatrix},
$$
so $N_{K/F}(\sqrt[3]{2})=2$ and $T_{K/F}(\sqrt[3]{2})=0$.

**Example 8.4** Let $F$ be a field of characteristic $p>0$, and let $K/F$ be a purely inseparable extension of degree $p$. Say $K=F(\alpha)$ with $\alpha^p=a\in F$. For instance, we could take $K$ to be the rational function field $k(x)$ over a field $k$ of characteristic $p$ and $F=k(x^p)$. A basis for $K$ is $\{1,\alpha,\alpha^2,\dots,\alpha^{p-1}\}$. With respect to this basis, the matrix for $L_\alpha$ is
$$
\begin{pmatrix}
0&0&\cdots&0&a\\
1&0&\cdots&0&0\\
0&1&\ddots&\vdots&\vdots\\
\vdots&\vdots&\ddots&0&0\\
0&0&&1&0
\end{pmatrix}.
$$
We leave it to the reader to check that the matrix for $L_{\alpha^2}$ is obtained by taking this matrix and shifting the columns to the left, moving the first column to the end. Similar processes yield the matrices $L_{\alpha^i}$ for each $i$. From these matrices, we see that $N_{K/F}(\alpha)=(-1)^p a$. For traces, each $L_{\alpha^i}$ has trace $0$, including the identity matrix, since $p\cdot 1=0$ in $F$. Therefore, for any $\beta\in K$ we have $\operatorname{Tr}_{K/F}(\beta)=0$. The trace map $T_{K/F}$ is thus the zero function.

The following lemma gives some elementary properties of norm and trace.

**Lemma 8.5** Let $K$ be a finite extension of $F$ with $n=[K:F]$.

1. If $a\in K$, then $N_{K/F}(a)$ and $T_{K/F}(a)$ lie in $F$.
2. The trace map $T_{K/F}$ is an $F$-linear transformation.
3. If $\alpha\in F$, then $T_{K/F}(\alpha)=n\alpha$.
4. If $a,b\in K$, then $N_{K/F}(ab)=N_{K/F}(a)\cdot N_{K/F}(b)$.
5. If $\alpha\in F$, then $N_{K/F}(\alpha)=\alpha^n$.

**Proof.** These properties all follow immediately from the definitions and properties of the determinant and trace functions.
$\square$

The examples above indicate that it is not easy in general to calculate norms and traces from our definition. In order to work effectively with norms and traces, we need alternative ways of calculating them. The next proposition shows that if we know the minimal polynomial of an element, then it is easy to determine the norm and trace of that element.

**Proposition 8.6** Let $K$ be an extension of $F$ with $[K:F]=n$. If $a\in K$ and $p(x)=x^m+\alpha_{m-1}x^{m-1}+\cdots+\alpha_1 x+\alpha_0$ is the minimal polynomial of $a$ over $F$, then $N_{K/F}(a)=(-1)^n\alpha_0^{n/m}$ and $T_{K/F}(a)=-\frac{n}{m}\alpha_{m-1}$.

**Proof.** Let $\varphi:K\to\operatorname{End}_F(K)$ be the map $\varphi(a)=L_a$. It is easy to see that $L_{a+b}=L_a+L_b$ and $L_{ab}=L_a\circ L_b$, so $\varphi$ is a ring homomorphism. Also, if $\alpha\in F$ and $a\in K$, then $L_{\alpha a}=\alpha L_a$. Thus, $\varphi$ is also an $F$-vector space homomorphism. The kernel of $\varphi$ is necessarily trivial, since $\varphi$ is not the zero map. Since $\varphi$ is injective, the minimal polynomials of $a$ and $L_a$ are equal. Let $\chi(x)$ be the characteristic polynomial of $L_a$, and say $\chi(x)=x^n+\beta_{n-1}x^{n-1}+\cdots+\beta_0$. By the Cayley–Hamilton theorem, Theorem 2.1 of Appendix D, the characteristic and minimal polynomials of a linear transformation have the same irreducible factors, and the minimal polynomial divides the characteristic polynomial. Since $p$ is irreducible, by comparing degrees we see that $\chi(x)=p(x)^{n/m}$. Note that $m$ divides $n$, because $m=[F(a):F]$ and
$$
n=[K:F]=[K:F(a)]\cdot[F(a):F].
$$
Now, recalling the relation between the determinant and trace of a matrix and its characteristic polynomial, we see that $N_{K/F}(a)=\det(L_a)=(-1)^n\beta_0$ and $T_{K/F}(a)=\operatorname{Tr}(L_a)=-\beta_{n-1}$. Multiplying out $p(x)^{n/m}$ shows that $\beta_0=\alpha_0^{n/m}$ and $\beta_{n-1}=\frac{n}{m}\alpha_{m-1}$, which proves the proposition.
$\square$

**Example 8.7** If $F$ is any field and if $K=F(\sqrt{d})$ for some $d\in F-F^2$, then a short calculation shows that the minimal polynomial of $a+b\sqrt{d}$ is $x^2-2ax+(a^2-b^2d)$. Proposition 8.6 yields $N_{K/F}(a+b\sqrt{d})=a^2-b^2d$ and $T_{K/F}(a+b\sqrt{d})=2a$, as we had obtained before.

If $F=\mathbb{Q}$ and $K=\mathbb{Q}(\sqrt[3]{2})$, then the minimal polynomial of $\sqrt[3]{2}$ over $F$ is $x^3-2$. Then $N_{K/F}(\sqrt[3]{2})=2$ and $T_{K/F}(\sqrt[3]{2})=0$.

**Example 8.8** If $K$ is a purely inseparable extension of $F$ of characteristic $p$, then the minimal polynomial of any element of $K$ is of the form $x^{p^n}-a$. From this, it follows that the trace of any element is zero.

If we know the minimal polynomial of an element, then it is easy to find the norm and trace of the element. However, it may be hard to find the minimal polynomial in many situations. Therefore, additional methods of calculating norms and traces are needed. For a Galois extension $K$ of $F$, there are simple descriptions of norm and trace in terms of automorphisms. Theorem 8.12 describes the norm and trace in terms of $F$-homomorphisms for general finite extensions and has the description for Galois extensions as a special case. In order to prove this result, we need some facts about separable and purely inseparable closures. Let $K$ be a finite extension of $F$, and let $S$ be the separable closure of $F$ in $K$. Recall that the purely inseparable degree of $K/F$ is $[K:F]_i=[K:S]$. The next three lemmas prove the facts we need in order to obtain the descriptions of norms and traces that we desire.

**Lemma 8.9** Let $K$ be a finite extension of $F$, and let $S$ be the separable closure of $F$ in $K$. Then $[S:F]$ is equal to the number of $F$-homomorphisms from $K$ to an algebraic closure of $F$.

**Proof.** Let $M$ be an algebraic closure of $F$. We may assume that $K\subseteq M$. If $S$ is the separable closure of $F$ in $K$, then $S=F(a)$ for some $a$ by the primitive element theorem. If $r=[S:F]$, then there are $r$ distinct roots of $\min(F,a)$ in $M$. Suppose that these roots are $a_1,\dots,a_r$. Then the map $\sigma_i:S\to M$ defined by $f(a)\mapsto f(a_i)$ is a well-defined $F$-homomorphism for each $i$. Moreover, any $F$-homomorphism from $S$ to $M$ must be of this form since $a$ must map to a root of $\min(F,a)$. Therefore, there are $r$ distinct $F$-homomorphisms from $S$ to $M$. The field $K$ is purely inseparable over $S$; hence, $K$ is normal over $S$. Therefore, each $\sigma_i$ extends to an $F$-homomorphism from $K$ to $M$ by Proposition 3.28. We will be done once we show that each $\sigma_i$ extends in a unique way to $K$. To prove this, suppose that $\tau$ and $\rho$ are extensions of $\sigma_i$ to $K$. Then $\tau(K)=K$ by Proposition 3.28, and so $\tau^{-1}\rho$ is an automorphism of $K$ that fixes $S$. However, $\operatorname{Gal}(K/S)=\{\operatorname{id}\}$, since $K/S$ is purely inseparable. Therefore, $\tau^{-1}\rho=\operatorname{id}$, so $\tau=\rho$.
$\square$

**Lemma 8.10** Let $K$ be a finite dimensional, purely inseparable extension of $F$. If $a\in K$, then $a^{[K:F]}\in F$. More generally, if $N$ is a finite dimensional, Galois extension of $F$ and if $a\in NK$, then $a^{[K:F]}\in N$.

**Proof.** Let $K$ be purely inseparable over $F$, and let $n=[K:F]$. If $a\in K$, then $a^{[F(a):F]}\in F$ by Lemma 4.16. Since $[F(a):F]$ divides $n=[K:F]$, we also have $a^n\in F$. To prove the second statement, let $N$ be a Galois extension of $F$. Then $N\cap K$ is both separable and purely inseparable over $F$, so $N\cap K=F$. Therefore, $[NK:K]=[N:F]$ by the theorem of natural irrationalities, so $[NK:N]=[K:F]$. The extension $NK/N$ is purely inseparable, so by the first part of the proof, we have $a^n\in N$ for all $a\in NK$. This finishes the proof.
$\square$

**Lemma 8.11** Suppose that $F\subseteq L\subseteq K$ are fields with $[K:F]<\infty$. Then $[K:F]_i=[K:L]_i\cdot[L:F]_i$.

**Proof.** Let $S_1$ be the separable closure of $F$ in $L$, let $S_2$ be the separable closure of $L$ in $K$, and let $S$ be the separable closure of $F$ in $K$. Since any element of $K$ that is separable over $F$ is also separable over $L$, we see that $S\subseteq S_2$. Moreover, $SL$ is a subfield of $S_2$ such that $S_2/SL$ is both separable and purely inseparable, so $S_2=SL$. We claim that this means that $[L:S_1]=[S_2:S]$. If this is true, then
$$
\begin{aligned}[]
[K:F]_i&=[K:S]\\
&=[K:S_2]\cdot[S_2:S]\\
&=[K:S_2]\cdot[L:S_1]\\
&=[K:L]_i\cdot[L:F]_i,
\end{aligned}
$$
proving the result. We now verify that $[L:S_1]=[S_2:S]$. By the primitive element theorem, $S=S_1(a)$ for some $a$. Let $f(z)=\min(S_1,a)$, and let $g(z)=\min(L,a)$. Then $g$ divides $f$ in $L[x]$. However, since $L$ is purely inseparable over $S_1$, some power of $g$ lies in $S_1[x]$. Consequently, $f$ divides a power of $g$ in $F[x]$. These two divisibilities force $f$ to be a power of $g$. The polynomial $f$ has no repeated roots since $a$ is separable over $S_1$, so the only possibility is for $f=g$. Thus, $[S:S_1]=[L(a):L]$, and since $L(a)=SL=S_2$, we see that $[S:S_1]=[S_2:L]$. Therefore,
$$
[S_2:S]=\frac{[S_2:S_1]}{[S:S_1]}=\frac{[S_2:S_1]}{[S_2:L]}=[L:S_1].
$$
This finishes the proof.
$\square$

We are now in the position to obtain the most useful description of the norm and trace of an element. The next theorem gives formulas that are particularly useful for a Galois extension and will allow us to prove a transitivity theorem for norms and traces.

**Theorem 8.12** Let $K$ be a finite extension of $F$, and let $\sigma_1,\dots,\sigma_r$ be the distinct $F$-homomorphisms from $K$ to an algebraic closure of $F$. If $a\in K$, then
$$
N_{K/F}(a)=\left(\prod_j \sigma_j(a)\right)^{[K:F]_i}\quad\text{and}\quad T_{K/F}(a)=[K:F]_i\sum_j \sigma_j(a).
$$

**Proof.** Let $M$ be an algebraic closure of $F$, and let $\sigma_1,\dots,\sigma_r$ be the distinct $F$-homomorphisms from $K$ to $M$. Let $g(z)=\left(\prod_j x-\sigma_j(a)\right)^{[K:F]_i}$, a polynomial over $M$. If $S$ is the separable closure of $F$ in $K$, then $r=[S:F]$ by Lemma 8.9. The degree of $g$ is
$$
\begin{aligned}
r[K:F]_i=r[K:S]&=[K:S]\cdot[S:F]\\
&=[K:F]=n.
\end{aligned}
$$
We claim that $g(x)\in F[x]$ and that $g(x)$ has precisely the same roots as $p(z)=\min(F,a)$. If this is true, we see that $p$ divides $g$, and since all roots of $g$ are roots of $p$, the only irreducible factor of $g$ is $p$. Thus, $g(x)=p(x)^{n/m}$, where $m=\deg(p(x))$. It was shown in the proof of Theorem 8.6 that $p^{n/m}$ is the characteristic polynomial $\chi(x)$ of $L_a$. Thus, $g(x)=\chi(x)$. Therefore, if $g(x)=x^n+\gamma_{n-1}x^{n-1}+\cdots+\gamma_0$, we have $N_{K/F}(a)=(-1)^n\gamma_0$ and $T_{K/F}(a)=-\gamma_{n-1}$. Multiplying out $g(x)$ shows that
$$
\gamma_0=\left(\prod_j -\sigma_j(a)\right)^{[K:F]_i}
$$
and
$$
\gamma_{n-1}=-[K:F]_i\sum_j \sigma_j(a).
$$
The formulas for the norm and trace then follow from Proposition 8.6.

To see that $g(x)\in F[x]$ and that $g$ and $p$ have the same roots, first note that each $\sigma_j(a)$ is a root of $p$ since $\sigma_j$ is an $F$-homomorphism. If $b\in M$ is a root of $p(z)$, then by the isomorphism extension theorem there is a $\tau:M\to M$ with $\tau(a)=b$. Since $\tau|_K$ is one of the $\sigma_j$, say $\tau|_K=\sigma_k$, then $\tau(a)=\sigma_k(a)=b$, so $b$ is a root of $g$. This proves that $g$ and $p$ have the same roots. To see that $g(x)\in F[x]$, let $N$ be the normal closure of $S/F$. Then $N/F$ is Galois; hence, $N/F$ is separable. Also, $KN/K$ is Galois, and by the theorem of natural irrationalities, $[KN:K]$ divides $[N:S]$. Therefore, $[KN:N]$ divides $[K:S]=[K:F]_i$, since
$$
[KN:N]\cdot[N:S]=[KN:S]=[KN:K]\cdot[K:S].
$$
The extension $KN/N$ is purely inseparable since $K/S$ is purely inseparable, so $c^{[K:F]_i}\in N$ for any $c\in KN$ by Lemma 8.10. Because $KN$ is the composite of a Galois extension of $S$ with a purely inseparable, hence normal, extension, $KN/S$ is normal. Thus, $\sigma_i(K)\subseteq KN$ by Proposition 3.28. So we see that $g(x)\in N[x]$, using $(KN)^{[K:F]_i}\subseteq N$. However, if $\tau$ is any element of $\operatorname{Gal}(M/N)$, then
$$
\{(\tau\sigma_1)|_K,\dots,(\tau\sigma_r)|_K\}=\{\sigma_1,\dots,\sigma_r\},
$$
so $\tau(g)=g$. Thus, the coefficients of $g$ lie in the fixed field of $\operatorname{Gal}(M/F)$. This fixed field is the purely inseparable closure of $F$ in $M$, since $M/F$ is normal. We have seen that the coefficients of $g$ lie in $N$, so they are separable over $F$. These coefficients must then be in $F$. This completes the proof of the theorem.
$\square$

Suppose that $K$ is Galois over $F$. Then $\{\sigma_1,\dots,\sigma_r\}=\operatorname{Gal}(K/F)$ and $[K:F]_i=1$. The following corollary is immediate from Theorem 8.12.

**Corollary 8.13** If $K/F$ is Galois with Galois group $G$, then for all $a\in K$,
$$
N_{K/F}(a)=\prod_{\sigma\in G}\sigma(a)\quad\text{and}\quad T_{K/F}(a)=\sum_{\sigma\in G}\sigma(a).
$$

**Example 8.14** Let $F$ be a field of characteristic not 2, and let $K=F(\sqrt{d})$ for some $d\in F-F^2$. Then $\operatorname{Gal}(K/F)=\{\operatorname{id},\sigma\}$, where $\sigma(\sqrt{d})=-\sqrt{d}$. Therefore,
$$
N_{K/F}(a+b\sqrt{d})=(a+b\sqrt{d})(a-b\sqrt{d})=a^2-b^2d,
$$
$$
T_{K/F}(a+b\sqrt{d})=(a+b\sqrt{d})+(a-b\sqrt{d})=2a.
$$

**Example 8.15** Suppose that $F$ is a field containing a primitive $n$th root of unity $\omega$, and let $K$ be an extension of $F$ of degree $n$ with $K=F(\alpha)$ and $\alpha^n=a\in F$. By the isomorphism extension theorem, there is an automorphism of $K$ with $\sigma(\alpha)=\omega\alpha$. From this, we can see that the order of $\sigma$ is $n$, so $\operatorname{Gal}(K/F)=\langle\sigma\rangle$. Therefore,
$$
\begin{aligned}
N_{K/F}(\alpha)&=\alpha\sigma(\alpha)\cdots\sigma^{n-1}(\alpha)=\alpha\cdot\omega\alpha\cdots\omega^{n-1}\alpha\\
&=\omega^{n(n-1)/2}\alpha^n=(-1)^{n-1}a.
\end{aligned}
$$
If $n$ is odd, then $n(n-1)/2$ is a multiple of $n$, so $\omega^{n(n-1)/2}=1$. If $n$ is even, then this exponent is not a multiple of $n$, so $\omega^{n(n-1)/2}\neq 1$. However, $(\omega^{n(n-1)/2})^2=1$, so $\omega^{n(n-1)/2}=-1$. This justifies the final equality $N_{K/F}(\alpha)=(-1)^{n-1}a$.

As for the trace,
$$
\begin{aligned}
T_{K/F}(\alpha)&=\alpha+\omega\alpha+\cdots+\omega^{n-1}\alpha=(1+\omega+\cdots+\omega^{n-1})\alpha\\
&=0
\end{aligned}
$$
because $\omega$ is a root of $(z^n-1)/(z-1)=1+z+\cdots+z^{n-1}$. These norm and trace calculations could also have been obtained by using the minimal polynomial of $\alpha$, which is $x^n-a$.

In the examples above, we often calculated the norm and trace of an element $\alpha$ for the field extension $F(\alpha)/F$. If we want the norm and trace of an element that does not generate the larger field, our calculations will be more involved. This complication is eliminated by the following transitivity theorem, which gives relations between the norm and trace of an extension and a subextension.

**Theorem 8.16** If $F\subseteq L\subseteq K$ are fields with $[K:F]<\infty$, then
$$
N_{K/F}=N_{L/F}\circ N_{K/L}\quad\text{and}\quad T_{K/F}=T_{L/F}\circ T_{K/L};
$$
that is, $N_{K/F}(a)=N_{L/F}(N_{K/L}(a))$ and $T_{K/F}(a)=T_{L/F}(T_{K/L}(a))$ for each $a\in K$.

**Proof.** Let $M$ be an algebraic closure of $F$, let $\sigma_1,\dots,\sigma_r$ be the distinct $F$-homomorphisms of $L$ to $M$, and let $\tau_1,\dots,\tau_s$ be the distinct $L$-homomorphisms of $K$ to $M$. By the isomorphism extension theorem, we can extend each $\sigma_j$ and $\tau_k$ to automorphisms $M\to M$, which we will also call $\sigma_j$ and $\tau_k$, respectively. Each $\sigma_j\tau_k$ is an $F$-homomorphism from $K$ to $M$. In fact, any $F$-homomorphism of $K$ to $M$ is of this type, as we now prove. If $\rho:K\to M$ is an $F$-homomorphism, then $\rho|_L:L\to M$ is equal to $\sigma_j$ for some $j$. The map $\sigma_j^{-1}\rho$ is then an $F$-homomorphism $K\to M$ which fixes $L$. Thus, $\sigma_j^{-1}\rho=\tau_k$ for some $k$, so $\rho=\sigma_j\tau_k$. If $a\in K$, then by Theorem 8.12,
$$
\begin{aligned}
N_{K/L}(a)&=\left(\prod_k \tau_k(a)\right)^{[K:L]_i},\\
N_{L/F}(N_{K/L}(a))&=\left(\prod_j \sigma_j(N_{K/L}(a))\right)^{[L:F]_i}\\
&=\left(\prod_j \sigma_j\left(\left(\prod_k \tau_k(a)\right)^{[K:L]_i}\right)\right)^{[L:F]_i}\\
&=\left(\prod_j\prod_k \sigma_j\tau_k(a)\right)^{[K:L]_i[L:F]_i}\\
&=\left(\prod_{j,k} (\sigma_j\tau_k)(a)\right)^{[K:F]_i}\\
&=N_{K/F}(a),
\end{aligned}
$$
since the $\sigma_j\tau_k$ give all $F$-homomorphisms of $K$ into $M$ and $[K:L]_i[L:F]_i=[K:F]_i$ by Lemma 8.11. For the trace,
$$
\begin{aligned}
T_{K/L}(a)&=[K:L]_i\sum_k \tau_k(a),\\
T_{L/F}(T_{K/L}(a))&=[L:F]_i\sum_j \sigma_j(T_{K/L}(a))\\
&=[L:F]_i\sum_j \sigma_j\left([K:L]_i\sum_k \tau_k(a)\right)\\
&=[L:F]_i[K:L]_i\sum_{j,k} \sigma_j\tau_k(a)\\
&=[K:F]_i\sum_{j,k} (\sigma_j\tau_k)(a)\\
&=T_{K/F}(a).
\end{aligned}
$$
This completes the proof.
$\square$

