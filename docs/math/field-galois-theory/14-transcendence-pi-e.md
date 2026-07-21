# 14. The Transcendence of π and e（π 与 e 的超越性）

The two best known and most important nonrational real numbers are $\pi$ and $e$. In this section, we will show that both of these numbers are transcendental over $\mathbb{Q}$. In Section 15, we will use the transcendence of $\pi$ to prove that it is impossible to square the circle, one of the ruler and compass construction questions of ancient Greece that remained unsolved for 2500 years.

The recognition that irrational numbers exist can be traced back to the Pythagoreans' proof over 2000 years ago that $\sqrt{2}$ is irrational. However, it was not known whether $\pi$ was rational until 1761, when Lambert proved that $\pi$ is irrational. Euler, after finding a continued fraction expression for $e$, believed that $e$ was irrational but was not able to prove it. In 1767, Lambert gave a proof that $e$ was irrational. By this time, people suspected that not all numbers were algebraic. The existence of transcendental numbers remained an open question until Liouville in 1844 came up with a criterion for a complex number to be algebraic and showed that transcendental numbers do exist. Liouville's method showed that numbers whose decimal expansion contained increasingly long strings of 0's are transcendental. For instance, his method showed that $\sum_{n=0}^\infty 10^{-n!}$ is transcendental. Proving that a particular number, such as $\pi$ and $e$, is transcendental is another matter. The transcendence of $e$ was not proved until 1873, when Hermite gave a proof. Nine years later, Lindemann used Hermite's method to prove that $\pi$ is transcendental.

In this section, we give a more general result of Lindemann that implies the transcendence of both $e$ and $\pi$. A more detailed proof of this result was given by Weierstrass in 1895 and often goes under the name of the Lindemann-Weierstrass theorem. Actually, we give an alternative version of this theorem that is a little easier to prove than the original version. The original version is mentioned in Problem 1. The proof of the Lindemann-Weierstrass theorem requires some analysis, including complex integration, along with Galois theory.

**Theorem 14.1 (Lindemann-Weierstrass).** Let $\alpha_1,\dots,\alpha_m$ be distinct algebraic numbers. Then the exponentials $e^{\alpha_1},\dots,e^{\alpha_m}$ are linearly independent over $\mathbb{Q}$.

**Corollary 14.2.** The numbers $\pi$ and $e$ are transcendental over $\mathbb{Q}$.

**Proof of the corollary.** Suppose that $e$ is algebraic over $\mathbb{Q}$. Then there are rationals $r_i$ with $\sum_{i=0}^n r_i e^i = 0$. This means that the numbers $e^0$, $e^1,\dots,e^{n-1}$ are linearly dependent over $\mathbb{Q}$. By choosing $m = n+1$ and $\alpha_i = i-1$, this dependence is false by the theorem. Thus, $e$ is transcendental over $\mathbb{Q}$. For $\pi$, we note that if $\pi$ is algebraic over $\mathbb{Q}$, then so is $\pi i$; hence, $e^0, e^{\pi i}$ are linearly independent over $\mathbb{Q}$, which is false since $e^{\pi i} = -1$. Thus, $\pi$ is transcendental over $\mathbb{Q}$. □

**Proof of the theorem.** Suppose that there are $a_j \in \mathbb{Q}$ with

$$\sum_{j=1}^m a_j e^{\alpha_j} = 0.$$

By multiplying by a suitable integer, we may assume that each $a_j \in \mathbb{Z}$. Moreover, by eliminating terms if necessary, we may also assume that each $a_j \neq 0$. Let $K$ be the normal closure of $\mathbb{Q}(\alpha_1,\dots,\alpha_m)/\mathbb{Q}$. Then $K$ is a Galois extension of $\mathbb{Q}$. Suppose that $\operatorname{Gal}(K/\mathbb{Q}) = \{\sigma_1,\dots,\sigma_n\}$. Since $\sum_{j=1}^m a_j e^{\alpha_j} = 0$, we have

$$0 = \prod_{k=1}^n \left( \sum_{j=1}^m a_j e^{\sigma_k(\alpha_j)} \right) = \sum_{j=0}^r c_j e^{\beta_j},$$

where the $c_j \in \mathbb{Z}$ and the $\beta_j$ can be chosen to be distinct elements of $K$ by gathering together terms with the same exponent. Moreover, some $c_j \neq 0$ (see Problem 4); without loss of generality, say $c_0 \neq 0$. If $\sigma \in \operatorname{Gal}(K/\mathbb{Q})$, then the $n$ terms $\sum_{j=1}^m a_j e^{\sigma\sigma_k(\alpha_j)}$ for $1 \le k \le n$ are the terms $\sum_{j=1}^m a_j e^{\sigma_k(\alpha_j)}$ in some order, so the product is unchanged when replacing $\sigma_k(\alpha_j)$ by $\sigma\sigma_k(\alpha_j)$. Since each $\beta_j$ is a sum of terms of the form $\sigma_k(\alpha_l)$, the exponents in the expansion of $\prod_{k=1}^n \left( \sum_{j=1}^m a_j e^{\sigma_k(\alpha_j)} \right)$ are the various $\sigma(\beta_j)$. Thus, we obtain equations

$$0 = \sum_{j=0}^r c_j e^{\sigma_i(\beta_j)}$$

for each $i$. Multiplying the $i$th equation by $e^{\sigma_i(\beta_0)}$, we get

$$0 = c_0 + \sum_{j=1}^r c_j e^{\sigma_i(\gamma_j)}, \tag{14.1}$$

where $\gamma_j = \beta_j - \beta_0$. Note that $\gamma_j \neq 0$ since the $\beta_j$ are all distinct. Each $\gamma_j \in K$; hence, each $\gamma_j$ is algebraic over $\mathbb{Q}$. Thus, for a fixed $j$, the elements $\sigma_i(\gamma_j)$ are roots of a polynomial $g_j(x) \in \mathbb{Q}[x]$, where the leading coefficient $b_j$ of $g_j(x)$ can be taken to be a positive integer. Moreover, we may assume that $g_j(0) \neq 0$ by using an appropriate multiple of $\min(\mathbb{Q},\gamma_j)$ for $g_j(x)$.

We now make estimates of some complex integrals. If $f(x)$ is a polynomial, let

$$F(x) = \sum_{i=0}^\infty f^{(i)}(x),$$

where $f^{(i)}(x)$ is the $i$th derivative of $f$. This sum is finite since $f$ is a polynomial, so $F$ is also a polynomial. Note that $F(x) - F'(x) = f(x)$, so

$$\frac{d}{dx}\left( e^{-x} F(x) \right) = -e^{-x} f(x).$$

Therefore,

$$\int_0^a e^{-x} f(x)\,dx = F(0) - e^{-a} F(a)$$

or

$$F(a) - e^a F(0) = -e^a \int_0^a e^{-x} f(x)\,dx.$$

By setting $a = \sigma_i(\gamma_j)$, multiplying by $c_j$, and summing over $i$ and $j$, we get

$$\begin{aligned}
\sum_{j=1}^r \sum_{i=1}^n c_j F(\sigma_i(\gamma_j)) - F(0) \sum_{j=1}^r \sum_{i=1}^n c_j e^{\sigma_i(\gamma_j)} \\
= -\sum_{j=1}^r \sum_{i=1}^n c_j e^{\sigma_i(\gamma_j)} \int_0^{\sigma_i(\gamma_j)} e^{-z} f(z)\,dz.
\end{aligned}$$

Using Equation (14.1) and rearranging the second sum gives us an equation

$$\begin{aligned}
n c_0 F(0) + \sum_{j=1}^r c_j \sum_{i=1}^n F(\sigma_i(\gamma_j)) \\
= -\sum_{j=1}^r \sum_{i=1}^n c_j e^{\sigma_i(\gamma_j)} \int_0^{\sigma_i(\gamma_j)} e^{-z} f(z)\,dz.
\end{aligned} \tag{14.2}$$

We define $f$ by

$$f(z) = \frac{(b_1\cdots b_r)^{prn}}{(p-1)!} z^{p-1} \left( \prod_{j=1}^r g_j(x) \right)^p,$$

where $p$ is a prime yet to be specified. Recall that $b_i$ is the leading coefficient of $g_i(x)$ and that each $b_i$ is a positive integer. From this definition, we see that

$$0 = f(0) = f'(0) = \cdots = f^{(p-2)}(0)$$

while $f^{(p-1)}(0) = (b_1\cdots b_r)^{prn} \prod_{j=1}^r g_j(0)^p \neq 0$. We choose $p$ to be any prime larger than $\max_j \{b_j, g_j(0)\}$, so that $p$ does not divide $f^{(p-1)}(0)$. However, for $t \ge p$, the polynomial $f^{(t)}(x)$ can be written in the form

$$f^{(t)}(x) = p(b_1\cdots b_r)^{prn} h_t(x),$$

where $h_t(x) \in \mathbb{Z}[x]$ has degree at most $prn - 1$. Thus, $f^{(t)}(0)$ is divisible by $p$ for $t \ge p$; hence, $F(0) = f^{(p-1)}(0) + \sum_{j \neq p-1} f^{(j)}(0)$ is not divisible by $p$. If we further restrict $p$ so that $p > n$ and $p > c_0$, then $p$ does not divide $n c_0 F(0)$. We will complete the proof by showing that the first sum in Equation (14.2) is an integer divisible by $p$ and that the right-hand side of Equation (14.2) goes to $0$ as $p$ gets large. This will show that the left-hand side is at least $1$ in absolute value, which will then give a contradiction.

We now show that $\sum_{j=1}^r c_j \sum_{i=1}^n F(\sigma_i(\gamma_j))$ is an integer divisible by $p$. We do this by showing that each term $\sum_{i=1}^n F(\sigma_i(\gamma_j))$ is an integer divisible by $p$. Now,

$$\sum_{i=1}^n F(\sigma_i(\gamma_j)) = \sum_k \sum_{i=1}^n f^{(k)}(\sigma_i(\gamma_j)).$$

Since $g_j(x)^p$ divides $f(x)$ and each $\sigma_i(\gamma_j)$ is a root of $g_j(x)$, we see that

$$0 = f(\sigma_i(\gamma_j)) = f'(\sigma_i(\gamma_j)) = \cdots = f^{(p-1)}(\sigma_i(\gamma_j)).$$

For $t \ge p$, since $f^{(t)}(x) = p(b_1\cdots b_r)^{prn} h_t(x)$,

$$\sum_{i=1}^n f^{(t)}(\sigma_i(\gamma_j)) = p \cdot \sum_{i=1}^n (b_1\cdots b_r)^{prn} h_t(\sigma_i(\gamma_j)). \tag{14.3}$$

However, this sum is invariant under the action of $\operatorname{Gal}(K/\mathbb{Q})$, so it is a rational number. Moreover, $\sum_{i=1}^n (b_1\cdots b_r)^{prn} h_t(x_i)$ is a symmetric polynomial in $x_1,\dots,x_n$ of degree at most $prn - 1$. The $\sigma_i(\gamma_j)$ are roots of the polynomial $g_j(x)$, whose leading coefficient is $b_j$, so the second sum in Equation (14.3) is actually an integer by an application of the symmetric function theorem (see Problem 5). This shows that $\sum_{j=1}^r c_j \sum_{i=1}^n F(\sigma_i(\gamma_j))$ is an integer divisible by $p$; hence, the left-hand side of Equation (14.2) is a nonzero integer. This means that

$$\left| \sum_{j=1}^r \sum_{i=1}^n c_j e^{\sigma_i(\gamma_j)} \int_0^{\sigma_i(\gamma_j)} e^{-z} f(z)\,dz \right| \ge 1.$$

Let

$$m_1 = \max_j \{|c_j|\},$$
$$m_2 = \max_{i,j} \left\{ \left| e^{\sigma_i(\gamma_j)} \right| \right\},$$
$$m_3 = \max_{i,j} \left\{ \left| \sigma_i(\gamma_j) \right| \right\},$$

and

$$m_4 = \max_{s \in [0,1]} \left\{ \left| e^{-z} \right| : z = s \sigma_i(\gamma_j) \right\},$$
$$m_5 = \max_{s \in [0,1]} \left\{ \prod_{j=1}^r \left| g_j(z) \right| : z = s \sigma_i(\gamma_j) \right\}.$$

On the straight-line path from $0$ to $\sigma_i(\gamma_j)$ we have the bound $|z^{p-1}| \le |\sigma_i(\gamma_j)|^{p-1} \le m_3^{p-1}$. This yields the inequality

$$\begin{aligned}
\left| \int_0^{\sigma_i(\gamma_j)} e^{-z} f(z)\,dz \right| &\le m_3 m_4 \frac{(b_1\cdots b_r)^{prn}}{(p-1)!} m_3^{p-1} m_5^p \\
&= m_4 \frac{(b_1\cdots b_r)^{prn}}{(p-1)!} m_3^p m_5^p.
\end{aligned}$$

Combining this with the previous inequality gives

$$\begin{aligned}
1 &\le \left| \sum_{j=1}^r \sum_{i=1}^n c_j e^{\sigma_i(\gamma_j)} \int_0^{\sigma_i(\gamma_j)} e^{-z} f(z)\,dz \right| \\
&\le r n m_1 m_2 \left( m_4 \frac{(b_1\cdots b_r)^{prn}}{(p-1)!} m_3^p m_5^p \right) \\
&= r n m_1 m_2 m_4 \frac{((b_1\cdots b_r)^{rn} m_3 m_5)^p}{(p-1)!}.
\end{aligned}$$

Since $u^p/(p-1)! \to 0$ as $p \to \infty$, the last term in the inequality above can be made arbitrarily small by choosing $p$ large enough. This gives a contradiction, so our original hypothesis that the exponentials $e^{\alpha_1},\dots,e^{\alpha_m}$ are linearly dependent over $\mathbb{Q}$ is false. This proves the theorem. □

While we have proved that $\pi$ and $e$ are transcendental over $\mathbb{Q}$, it is unknown if $\pi$ is transcendental over $\mathbb{Q}(e)$ or if $e$ is transcendental over $\mathbb{Q}(\pi)$. To discuss this further, we need a definition from Section 19. If $K$ is a field extension of $F$, then $a_1,\dots,a_n \in K$ are algebraically independent over $F$ if whenever $f \in F[x_1,\dots,x_n]$ is a polynomial with $f(a_1,\dots,a_n) = 0$, then $f = 0$. It is not hard to show that $\pi$ and $e$ are algebraically independent over $\mathbb{Q}$ if and only if $\pi$ is transcendental over $\mathbb{Q}(e)$, if and only if $e$ is transcendental over $\mathbb{Q}(\pi)$; see Problem 2. A possible generalization of the Lindemann-Weierstrass theorem is Schanuel's conjecture, which states that if $y_1,\dots,y_n$ are $\mathbb{Q}$-linearly independent complex numbers, then at least $n$ of the numbers $y_1,\dots,y_n, e^{y_1},\dots,e^{y_n}$ are algebraically independent over $\mathbb{Q}$. If Schanuel's conjecture is true, then $e$ and $\pi$ are algebraically independent over $\mathbb{Q}$; this is left to Problem 3.
