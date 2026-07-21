# 1. Field Extensions（域扩张）

In this chapter, we develop the machinery of Galois theory. The first four sections constitute the technical heart of Galois theory, and Section 5 presents the fundamental theorem and some consequences. As an application, we give a proof of the fundamental theorem of algebra using Galois theory and the Sylow theorems of group theory.

The main idea of Galois theory is to associate a group, the Galois group, to a field extension. We can then turn field theory problems into group theory problems. Since the Galois group of a finite dimensional extension is finite, we can utilize the numerical information about finite groups to help investigate such field extensions. It turns out that field theory is the right context for solving some of the famous classical problems that stumped mathematicians for centuries. As an application of field theory, in Chapter III we give proofs of the famous impossibilities of certain ruler and compass constructions, and we determine why roots of polynomials of degree 5 or greater need not be given by formulas involving field operations and extraction of roots.

In this section, we begin the study of field theory. Consequently, there are a number of definitions in this section, although there are also a large number of examples intended to help the reader with the concepts. We point out now that we take a basic knowledge of ring theory and vector space theory for granted. For instance, we use the dimension of a finite vector space frequently, and we use the theory of polynomial rings in one variable over a field equally often. Any reader who is unfamiliar with a fact used in this book is recommended to peruse the appendices; they contain most of the background a reader will need but may not have.

While field theory is of course concerned with the study of fields, the study of field theory primarily investigates field extensions. In fact, the classical problems of ruler and compass constructions and the solvability of polynomial equations were answered by analyzing appropriate field extensions, and we answer these problems in Chapter III in this way. While it may seem unusual to some readers to consider pairs of fields, we point out that much of group theory and ring theory is concerned with group extensions and ring extensions, respectively.

Recall that a field is a commutative ring with identity such that the nonzero elements form a group under multiplication. If $F \subseteq K$ are fields, then $K$ is called a *field extension* of $F$. We will refer to the pair $F \subseteq K$ as the field extension $K/F$ and to $F$ as the *base field*. We make $K$ into an $F$-vector space by defining scalar multiplication for $\alpha \in F$ and $a \in K$ as $\alpha \cdot a = \alpha a$, the multiplication of $\alpha$ and $a$ in $K$. We write $[K:F]$ for the dimension of $K$ as an $F$-vector space. This dimension is called the *degree* of $K/F$. If $[K:F] < \infty$, then $K$ is called a *finite extension* of $F$. Otherwise $K$ is an *infinite extension* of $F$. Most of this chapter will deal with finite field extensions, although in a few places we will need to work with extensions of any degree.

**Example 1.1** In order to give examples of field extensions, we first need examples of fields. In this book, the fields of rational numbers, real numbers, and complex numbers will be denoted $\mathbb{Q}$, $\mathbb{R}$, and $\mathbb{C}$, respectively. The field $\mathbb{Z}/p\mathbb{Z}$ of integers mod $p$ will be denoted $\mathbb{F}_p$. The fields $\mathbb{Q}$ and $\mathbb{F}_p$ will appear often as the base field of examples. Finite field extensions of $\mathbb{Q}$ are called *algebraic number fields* and are one of the objects of study in algebraic number theory.

**Example 1.2** Let $k$ be a field and let $x$ be a variable. The rational function field $k(x)$ is the quotient field of the polynomial ring $k[x]$; that is, $k(x)$ consists of all quotients $f(x)/g(x)$ of polynomials with $g(x) \ne 0$. Similarly, if $x_1, \ldots, x_n$ are independent variables, then the field $k(x_1, \ldots, x_n)$ of rational functions in the $x_i$ is the quotient field of the polynomial ring $k[x_1, \ldots, x_n]$ of polynomials in $n$ variables, so it consists of all quotients $f(x_1, \ldots, x_n)/g(x_1, \ldots, x_n)$ of polynomials in the $x_i$ with $g \ne 0$. Field extensions of a rational function field arise frequently in algebraic geometry and in the theory of division rings. We will work with rational function fields frequently.

**Example 1.3** Let $k$ be a field and let $k((x))$ be the set of all formal generalized power series in $x$ with coefficients in $k$; that is, the elements of $k((x))$ are formal infinite sums $\sum_{n=n_0}^\infty a_n x^n$ with $n_0 \in \mathbb{Z}$ and each $a_n \in k$. We define addition and multiplication on $k((x))$ by

$$
\sum_{n=n_0}^\infty a_n x^n + \sum_{n=n_1}^\infty b_n x^n = \sum_n (a_n + b_n) x^n
$$

and

$$
\sum_{n=n_0}^\infty a_n x^n \cdot \sum_{n=n_1}^\infty b_n x^n = \sum_{n=n_0+n_1}^\infty \left( \sum_{k=n_0}^{n-n_1} a_k b_{n-k} \right) x^n.
$$

A straightforward calculation shows that $k((x))$ is a commutative ring with identity. Moreover, we can show that $k((x))$ is a field. If $f = \sum_{n=n_0}^\infty a_n x^n$ is a nonzero element of $k((x))$, we need to produce an inverse for $f$. Suppose that we have written the series so that $a_{n_0}$ is the first nonzero coefficient. By multiplying by $a_{n_0}^{-1} x^{-n_0}$, to find an inverse for $f$ it suffices to assume that $n_0 = 0$ and $a_{n_0} = 1$. We can find the coefficients $b_n$ of the inverse $\sum_{n=0}^\infty b_n x^n$ to $f$ by recursion. To have $\sum_{n=0}^\infty a_n x^n \cdot \sum_{n=0}^\infty b_n x^n = 1$, we need $b_0 = 1$ since $a_0 = 1$. For $n > 0$, the coefficient of $x^n$ is

$$
b_n a_0 + b_{n-1} a_1 + \cdots + b_0 a_n = 0,
$$

so if we have determined $b_0, \ldots, b_{n-1}$, then we determine $b_n$ from the equation $b_n = -\sum_{k=1}^n b_{n-k} a_k$. By setting $g$ to be the series with coefficients $b_n$ determined by this information, our computations yield $fg = 1$. Thus, $k((x))$ is a field. The rational function field $k(x)$ is naturally isomorphic to a subfield of $k((x))$. In algebra, the field $k((x))$ is often called the field of Laurent series over $k$, although this terminology is different from that used in complex analysis.

We now give some examples of field extensions.

**Example 1.4** The extension $\mathbb{C}/\mathbb{R}$ is a finite extension since $[\mathbb{C}:\mathbb{R}] = 2$. A basis for $\mathbb{C}$ as an $\mathbb{R}$-vector space is $\{1, i\}$. As an extension of $\mathbb{Q}$, both $\mathbb{C}$ and $\mathbb{R}$ are infinite extensions. If $a \in \mathbb{C}$, let

$$
\mathbb{Q}(a) = \left\{ \frac{\sum_i \alpha_i a^i}{\sum_i \beta_i a^i} : \alpha_i, \beta_i \in \mathbb{Q}, \sum_i \beta_i a^i \ne 0 \right\}.
$$

We shall see in Proposition 1.8 that $\mathbb{Q}(a)$ is a field extension of $\mathbb{Q}$. The degree of $\mathbb{Q}(a)/\mathbb{Q}$ can be either finite or infinite depending on $a$. For instance, if $a = \sqrt{-1}$ or $a = \exp(2\pi i / 3)$, then $[\mathbb{Q}(a) : \mathbb{Q}] = 2$. These equalities are consequences of Proposition 1.15. On the other hand, we prove in Section 14 that $[\mathbb{Q}(\pi) : \mathbb{Q}] = \infty$.

**Example 1.5** If $k$ is a field, let $K = k(t)$ be the field of rational functions in $t$ over $k$. If $f$ is a nonzero element of $K$, then we can use the construction of $\mathbb{Q}(a)$ in the previous example. Let $F = k(f)$ be the set of all rational functions in $f$; that is,

$$
F = \left\{ \frac{\sum_{i=0}^n a_i f^i}{\sum_{j=0}^m b_j f^j} : a_i, b_j \in k \text{ and } \sum_{j=0}^m b_j f^j \ne 0 \right\}.
$$

If $f(t) = t^2$, then $K/F$ is an extension of degree 2; a basis for $K$ is $\{1, t\}$. In Example 1.17, we shall see that $K/F$ is a finite extension provided that $f$ is not a constant, and in Chapter V we shall prove Lüroth's theorem, which states that every field $L$ with $k \subseteq L \subseteq K$ is of the form $L = k(f)$ for some $f \in K$.

**Example 1.6** Let $p(t) = t^3 - 2 \in \mathbb{Q}[t]$. Then $p(t)$ is irreducible over $\mathbb{Q}$ by the rational root test. Then the ideal $(p(t))$ generated by $p(t)$ in $\mathbb{Q}[t]$ is maximal; hence, $K = \mathbb{Q}[t]/(p(t))$ is a field. The set of cosets $\{a + (p(t)) : a \in \mathbb{Q}\}$ can be seen to be a field isomorphic to $\mathbb{Q}$ under the map $a \mapsto a + (p(t))$. We view the field $\mathbb{Q}[t]/(p(t))$ as an extension field of $\mathbb{Q}$ by thinking of $\mathbb{Q}$ as this isomorphic subfield. If $f(t) \in \mathbb{Q}[t]$, then by the division algorithm, $f(t) = q(t)p(t) + r(t)$ with $r(t) = 0$ or $\deg(r) < \deg(p) = 3$. Moreover, $f(t)$ and $r(t)$ generate the same coset in $\mathbb{Q}[t]/(p(t))$. What this means is that any element of $K$ has a unique representation in the form $a + bt + ct^2 + (p(t))$ for some $a, b, c \in \mathbb{Q}$. Therefore, the cosets $1 + (p(t))$, $t + (p(t))$, and $t^2 + (p(t))$ form a basis for $K$ over $\mathbb{Q}$, so $[K : \mathbb{Q}] = 3$. Let $\alpha = t + (p(t))$. Then

$$
\alpha^3 - 2 = t^3 + (p(t)) - (2 + (p(t))) = t^3 - 2 + (p(t)) = 0.
$$

The element $\alpha$ is then a root of $t^3 - 2$ in $K$. Note that we used the identification of $\mathbb{Q}$ as a subfield in this calculation.

If instead of $t^3 - 2$ we had started with any irreducible polynomial of degree $n$ over $\mathbb{Q}$, we would obtain a field extension of $\mathbb{Q}$ of degree $n$ that contains a root of the polynomial. We will use this idea in Section 3 to prove the existence of fields that contain roots of polynomials.

### Generators of fields

In order to study the roots of a polynomial over a field $F$, we will consider a minimal field extension of $F$ that contains all the roots of the polynomial. In intuitive terms, we want this field to be generated by $F$ and the roots. We need to make this more precise.

**Definition 1.7** Let $K$ be a field extension of $F$. If $X$ is a subset of $K$, then the ring $F[X]$ generated by $F$ and $X$ is the intersection of all subrings of $K$ that contain $F$ and $X$. The field $F(X)$ generated by $F$ and $X$ is the intersection of all subfields of $K$ that contain $F$ and $X$. If $X = \{\alpha_1, \ldots, \alpha_n\}$ is finite, we will write $F[X] = F[\alpha_1, \ldots, \alpha_n]$ and $F(X) = F(\alpha_1, \ldots, \alpha_n)$. If $X$ is finite, we call the field $F(X)$ a *finitely generated extension* of $F$.

It is a simple exercise to show that an intersection of subfields or subrings of a field is again a subfield or subring, respectively. From this definition, it follows that $F(X)$ is the smallest subfield with respect to inclusion of $K$ that contains $F$ and $X$. We can give more concrete descriptions of $F[X]$ and $F(X)$. Let $K$ be a field extension of $F$ and let $\alpha \in K$. The *evaluation homomorphism* $\mathrm{ev}_\alpha$ is the map $\mathrm{ev}_\alpha : F[x] \to K$ defined by $\mathrm{ev}_\alpha(\sum_i a_i x^i) = \sum_i a_i \alpha^i$. We denote $\mathrm{ev}_\alpha(f(x))$ by $f(\alpha)$. It is straightforward (see Problem 3) to show that $\mathrm{ev}_\alpha$ is both a ring and an $F$-vector space homomorphism. We use this notion to see what it means for a field to be generated by a set of elements. We start with the easiest case, when $K$ is generated over $F$ by a single element.

**Proposition 1.8** Let $K$ be a field extension of $F$ and let $\alpha \in K$. Then

$$
F[\alpha] = \{ f(\alpha) : f(x) \in F[x] \}
$$

and

$$
F(\alpha) = \{ f(\alpha)/g(\alpha) : f, g \in F[x], g(\alpha) \ne 0 \}.
$$

Moreover, $F(\alpha)$ is the quotient field of $F[\alpha]$.

**Proof.** The evaluation map $\mathrm{ev}_\alpha : F[x] \to K$ has image $\{f(\alpha) : f \in F[x]\}$, so this set is a subring of $K$. If $R$ is a subring of $K$ that contains $F$ and $\alpha$, then $f(\alpha) \in R$ for any $f(x) \in F[x]$ by closure of addition and multiplication. Therefore, $\{f(\alpha) : f(x) \in F[x]\}$ is contained in all subrings of $K$ that contain $F$ and $\alpha$. Therefore, $F[\alpha] = \{f(\alpha) : f(x) \in F[x]\}$. The quotient field of $F[\alpha]$ is then the set $\{f(\alpha)/g(\alpha) : f, g \in F[x], g(\alpha) \ne 0\}$. It clearly is contained in any subfield of $K$ that contains $F[\alpha]$; hence, it is equal to $F(\alpha)$.
□

The notation $F[\alpha]$ and $F(\alpha)$ is consistent with the notation $F[x]$ and $F(x)$ for the ring of polynomials and field of rational functions over $F$, as the description of $F[\alpha]$ and $F(\alpha)$ shows.

By similar arguments, we can describe the ring $F[\alpha_1, \ldots, \alpha_n]$ and field $F(\alpha_1, \ldots, \alpha_n)$ generated by $F$ and $\alpha_1, \ldots, \alpha_n$. The proof of the following proposition is not much different from the proof of Proposition 1.8, so it is left to Problem 4.

**Proposition 1.9** Let $K$ be a field extension of $F$ and let $\alpha_1, \ldots, \alpha_n \in K$. Then

$$
F[\alpha_1, \ldots, \alpha_n] = \{ f(\alpha_1, \ldots, \alpha_n) : f \in F[x_1, \ldots, x_n] \}
$$

and

$$
F(\alpha_1, \ldots, \alpha_n) = \left\{ \frac{f(\alpha_1, \ldots, \alpha_n)}{g(\alpha_1, \ldots, \alpha_n)} : f, g \in F[x_1, \ldots, x_n],\ g(\alpha_1, \ldots, \alpha_n) \ne 0 \right\},
$$

so $F(\alpha_1, \ldots, \alpha_n)$ is the quotient field of $F[\alpha_1, \ldots, \alpha_n]$.

For arbitrary subsets $X$ of $K$ we can describe the field $F(X)$ in terms of finite subsets of $X$. This description is often convenient for turning questions about field extensions into questions about finitely generated field extensions.

**Proposition 1.10** Let $K$ be a field extension of $F$ and let $X$ be a subset of $K$. If $\alpha \in F(X)$, then $\alpha \in F(\alpha_1, \ldots, \alpha_n)$ for some $\alpha_1, \ldots, \alpha_n \in X$. Therefore,

$$
F(X) = \bigcup \{ F(\alpha_1, \ldots, \alpha_n) : \alpha_1, \ldots, \alpha_n \in X \},
$$

where the union is over all finite subsets of $X$.

**Proof.** Each field $F(\alpha_1, \ldots, \alpha_n)$ with the $\alpha_i \in X$ is contained in $F(X)$; hence, $\bigcup \{F(\alpha_1, \ldots, \alpha_n) : \alpha_i \in X\} \subseteq F(X)$. This union contains $F$ and $X$, so if it is a field, then it is equal to $F(X)$, since $F(X)$ is the smallest subfield of $K$ containing $F$ and $X$. To show that this union is a field, let $\alpha, \beta \in \bigcup \{F(\alpha_1, \ldots, \alpha_n) : \alpha_i \in X\}$. Then there are $\alpha_i, b_i \in X$ with $\alpha \in F(a_1, \ldots, a_n)$ and $\beta \in F(b_1, \ldots, b_m)$. Then both $\alpha$ and $\beta$ are contained in $F(a_1, \ldots, a_n, b_1, \ldots, b_m)$, so $\alpha \pm \beta$, $\alpha\beta$, and $\alpha/\beta$ (if $\beta \ne 0$) all lie in $\bigcup \{F(\alpha_1, \ldots, \alpha_n) : \alpha_i \in X\}$. This union is then a field, so $F(X) = \bigcup \{F(\alpha_1, \ldots, \alpha_n) : \alpha_i \in X\}$.
□

In this chapter, our interest will be in those field extensions $K/F$ for which any $\alpha \in K$ satisfies a polynomial equation over $F$. We give this idea a formal definition.

**Definition 1.11** If $K$ is a field extension of $F$, then an element $\alpha \in K$ is *algebraic over* $F$ if there is a nonzero polynomial $f(x) \in F[x]$ with $f(\alpha) = 0$. If $\alpha$ is not algebraic over $F$, then $\alpha$ is said to be *transcendental over* $F$. If every element of $K$ is algebraic over $F$, then $K$ is said to be *algebraic over* $F$, and $K/F$ is called an *algebraic extension*.

**Definition 1.12** If $\alpha$ is algebraic over a field $F$, the *minimal polynomial* of $\alpha$ over $F$ is the monic polynomial $p(x)$ of least degree in $F[x]$ for which $p(\alpha) = 0$; it is denoted $\min(F,\alpha)$. Equivalently, $\min(F,\alpha)$ is the monic generator $p(x)$ of the kernel of the evaluation homomorphism $\mathrm{ev}_\alpha$.

**Example 1.13** The complex number $i = \sqrt{-1}$ is algebraic over $\mathbb{Q}$, since $i^2 + 1 = 0$. If $r \in \mathbb{Q}$, then $\alpha = \sqrt[n]{r}$ is algebraic over $\mathbb{Q}$, since $\alpha$ is a root of $x^n - r$. If $\omega = e^{2\pi i/n} = \cos(2\pi/n) + i\sin(2\pi/n)$, then $\omega^n - 1 = 0$, so $\omega$ is algebraic over $\mathbb{Q}$. Note that $\min(\mathbb{Q},i) = x^2 + 1 = \min(\mathbb{R},i)$ but $\min(\mathbb{C},i) = x - i$. Therefore, the minimal polynomial of an element depends on the base field, as does whether the element is algebraic or transcendental. The determination of $\min(\mathbb{Q},\omega)$ is nontrivial and will be done in Section 7.

**Example 1.14** In 1873, Hermite proved that $e$ is transcendental over $\mathbb{Q}$, and 9 years later, Lindemann proved that $\pi$ is transcendental over $\mathbb{Q}$. However, $\pi$ is algebraic over $\mathbb{Q}(\pi)$, since $\pi$ is a root of the polynomial $x - \pi \in \mathbb{Q}(\pi)[x]$. It is unknown if $e$ is transcendental over $\mathbb{Q}(\pi)$. We will prove in Section 14 that $\pi$ and $e$ are transcendental over $\mathbb{Q}$.

To work with algebraic extensions, we need some tools at our disposal. The minimal polynomial of an element and the degree of a field extension are two of the most basic tools we shall use. The following proposition gives a relation between these objects.

**Proposition 1.15** Let $K$ be a field extension of $F$ and let $\alpha \in K$ be algebraic over $F$.

1. The polynomial $\min(F,\alpha)$ is irreducible over $F$.
2. If $g(x) \in F[x]$, then $g(\alpha) = 0$ if and only if $\min(F,\alpha)$ divides $g(x)$.
3. If $n = \deg(\min(F,\alpha))$, then the elements $1, \alpha, \ldots, \alpha^{n-1}$ form a basis for $F(\alpha)$ over $F$, so $[F(\alpha) : F] = \deg(\min(F,\alpha)) < \infty$. Moreover, $F(\alpha) = F[\alpha]$.

**Proof.** If $p(x) = \min(F,\alpha)$, then $F[x]/(p(x)) \cong F[\alpha]$ is an integral domain. Therefore, $(p(x))$ is a prime ideal, so $p(x)$ is irreducible. To prove statement 2, if $g(x) \in F[x]$ with $g(\alpha) = 0$, then $g(x) \in \ker(\mathrm{ev}_\alpha)$. But this kernel is the ideal generated by $p(x)$, so $p(x)$ divides $g(x)$. For statement 3, we first prove that $F[\alpha] = F(\alpha)$. To see this, note that $F[\alpha]$ is the image of the evaluation map $\mathrm{ev}_\alpha$. The kernel of $\mathrm{ev}_\alpha$ is a prime ideal since $\mathrm{ev}_\alpha$ maps $F[x]$ into an integral domain. However, $F[x]$ is a principal ideal domain, so every nonzero prime ideal of $F[x]$ is maximal. Thus, $\ker(\mathrm{ev}_\alpha)$ is maximal, so $F[\alpha] \cong F[x]/\ker(\mathrm{ev}_\alpha)$ is a field. Consequently, $F[\alpha] = F(\alpha)$. To finish the proof of statement 3, let $n = \deg(p(x))$. If $b \in F(\alpha)$, then $b = g(\alpha)$ for some $g(x) \in F[x]$. By the division algorithm, $g(x) = q(x)p(x) + r(x)$, where $r(x) = 0$ or $\deg(r) < n$. Thus, $b = g(\alpha) = r(\alpha)$. Since $r(\alpha)$ is an $F$-linear combination of $1, \alpha, \ldots, \alpha^{n-1}$, we see that $1, \alpha, \ldots, \alpha^{n-1}$ span $F(\alpha)$ as an $F$-vector space. If $\sum_{i=0}^{n-1} a_i \alpha^i = 0$, then $f(x) = \sum_{i=0}^{n-1} a_i x^i$ is divisible by $p(x)$, so $f(x) = 0$, or else $f$ is divisible by a polynomial of larger degree than itself. Thus, $1, \alpha, \ldots, \alpha^{n-1}$ is a basis for $F(\alpha)$ over $F$.
□

**Example 1.16** The element $\sqrt[3]{2}$ satisfies the polynomial $x^3 - 2$ over $\mathbb{Q}$, which is irreducible by the Eisenstein criterion, so $x^3 - 2$ is the minimal polynomial of $\sqrt[3]{2}$ over $\mathbb{Q}$. Thus, $[\mathbb{Q}(\sqrt[3]{2}) : \mathbb{Q}] = 3$. If $p$ is a prime, then $x^n - p$ is irreducible over $\mathbb{Q}$, again by Eisenstein, so $[\mathbb{Q}(\sqrt[n]{p}) : \mathbb{Q}] = n$. The complex number $\omega = \cos(2\pi/3) + i\sin(2\pi/3)$ satisfies $x^3 - 1$ over $\mathbb{Q}$. This factors as $x^3 - 1 = (x - 1)(x^2 + x + 1)$. The second factor has $\omega$ as a root and is irreducible since it has no rational root; hence, it is the minimal polynomial of $\omega$ over $\mathbb{Q}$. Consequently, $[\mathbb{Q}(\omega) : \mathbb{Q}] = 2$.

Let $p$ be a prime and let $\rho = \exp(2\pi i/p) = \cos(2\pi/p) + i\sin(2\pi/p)$. Then $\rho$ satisfies the polynomial $x^p - 1 = (x - 1)(x^{p-1} + x^{p-2} + \cdots + x + 1)$. Since $\rho \ne 1$, it satisfies the polynomial $x^{p-1} + x^{p-2} + \cdots + x + 1$. Moreover, this polynomial is irreducible over $\mathbb{Q}$ (see Problem 22b); hence, it is the minimal polynomial of $\rho$ over $\mathbb{Q}$.

**Example 1.17** Here is a very nice, nontrivial example of a finite field extension. Let $k$ be a field and let $K = k(t)$ be the field of rational functions in $t$ over $k$. Let $u \in K$ with $u \notin k$. Write $u = f(t)/g(t)$ with $f, g \in k[t]$ and $\gcd(f(t), g(t)) = 1$, and let $F = k(u)$. We claim that

$$
[K : F] = \max \{ \deg(f(t)), \deg(g(t)) \},
$$

which will show that $K/F$ is a finite extension. To see this, first note that $K = F(t)$. By using Proposition 1.15, we need to determine the minimal polynomial of $t$ over $F$ to determine $[K : F]$. Consider the polynomial $p(z) = u g(z) - f(z) \in F[z]$. Then $t$ is a root of $p(z)$. Therefore, $t$ is algebraic over $F$, and so $[K : F] < \infty$ as $K = F(t)$. Say $f(t) = \sum_{i=0}^n a_i t^i$ and $g(t) = \sum_{i=0}^m b_i t^i$. First note that $\deg(p(z)) = \max \{ \deg(f(t)), \deg(g(t)) \}$. If this were false, then the only way this could happen would be if $m = n$ and the coefficient of $x^n$ in $p(x)$ were zero. But this coefficient is $u b_n - a_n$, which is nonzero since $u \notin k$. We now show that $p(z)$ is irreducible over $F$, which will verify that $[K : F] = \max\{n, m\}$. We do this by viewing $p(z)$ in two ways. The element $u$ is not algebraic over $k$, otherwise $[K : k] = [K : F] \cdot [F : k] < \infty$, which is false. Therefore, $u$ is transcendental over $k$, so $k[u] \cong k[x]$. Viewing $p$ as a polynomial in $u$, we have $p \in k[x][u] \subseteq k(x)[u]$, and $p$ has degree 1 in $u$. Therefore, $p$ is irreducible over $k(x)$. Moreover, since $\gcd(f(t), g(t)) = 1$, the polynomial $p$ is primitive in $k[x][u]$. Therefore, $p$ is irreducible over $k[x]$. We have $p \in k[u][x] = k[x][u]$ (think about this!), so $p$ is irreducible over $k[u]$, as a polynomial in $x$. Therefore, $p$ is irreducible over $k(u) = F$, which shows that $p$ is the minimal polynomial of $u$ over $F$, by Proposition 1.15. Therefore, we have $[K : F] = \max\{\deg(f(t)), \deg(g(t))\}$, as desired.

**Example 1.18** Let $K$ be a finitely generated extension of $F$, and suppose that $K = F(\alpha_1, \ldots, \alpha_n)$. We can break up the extension $K/F$ into a collection of subextensions that are easier to analyze. Let $L_i = F(\alpha_1, \ldots, \alpha_i)$, and set $L_0 = F$. Then we have a chain of fields

$$
F = L_0 \subseteq L_1 \subseteq L_2 \subseteq \cdots \subseteq L_n = K
$$

with $L_{i+1} = L_i(\alpha_{i+1})$. Therefore, we can break up the extension $K/F$ into a series of subextensions $L_{i+1}/L_i$, each generated by a single element. Results such as Proposition 1.15 will help to study the extensions $L_{i+1}/L_i$. To make this idea of decomposing $K/F$ into these subextensions useful, we will need to have transitivity results that tell us how to translate information about subextensions to the full extension $K/F$. We will prove a number of transitivity results in this book. We prove two below, one dealing with field degrees and the other about the property of being algebraic.

Recall that the field $K$ is finitely generated as a field over $F$ if $K = F(\alpha_1, \ldots, \alpha_n)$ for some $\alpha_i \in K$. This is not the same as being finitely generated as a vector space or as a ring. The field $K$ is finitely generated as an $F$-vector space if and only if $[K : F] < \infty$, and $K$ is finitely generated as a ring over $F$ if $K = F[\alpha_1, \ldots, \alpha_n]$ for some $\alpha_i \in K$.

**Lemma 1.19** If $K$ is a finite extension of $F$, then $K$ is algebraic and finitely generated over $F$.

**Proof.** Suppose that $\alpha_1, \ldots, \alpha_n$ is a basis for $K$ over $F$. Then every element of $K$ is of the form $\sum_i a_i \alpha_i$ with $a_i \in F$, so certainly we have $K = F(\alpha_1, \ldots, \alpha_n)$; thus, $K$ is finitely generated over $F$. If $\alpha \in K$, then $\{1, \alpha, \ldots, \alpha^n\}$ is dependent over $F$, since $[K : F] = n$. Thus, there are $\beta_i \in F$, not all zero, with $\sum_i \beta_i \alpha^i = 0$. If $f(x) = \sum_i \beta_i x^i$, then $f(x) \in F[x]$ and $f(\alpha) = 0$. Therefore, $\alpha$ is algebraic over $F$, and so $K$ is algebraic over $F$.
□

The converse of this lemma is also true. In order to give a proof of the converse, we need the following property of degrees. The degree of a field extension is the most basic invariant of an extension. It is therefore important to have some information about this degree. We will use the following transitivity result frequently.

**Proposition 1.20** Let $F \subseteq L \subseteq K$ be fields. Then

$$
[K : F] = [K : L] \cdot [L : F].
$$

**Proof.** Let $\{a_i : i \in I\}$ be a basis for $L/F$, and let $\{b_j : j \in J\}$ be a basis for $K/L$. Consider the set $\{a_i b_j : i \in I, j \in J\}$. We will show that this set is a basis for $K/F$. If $x \in K$, then $x = \sum_j \alpha_j b_j$ for some $\alpha_j \in L$, with only finitely many of the $b_j \ne 0$. But $\alpha_j = \sum_i \beta_{ij} a_j$ for some $\beta_{ij} \in F$, with only finitely many $\beta_{ij}$ nonzero for each $j$. Thus, $x = \sum_{i,j} \beta_{ij} a_i b_j$, so the $\{a_i b_j\}$ span $K$ as an $F$-vector space. For linear independence, if $\sum_{i,j} \beta_{ij} a_i b_j = 0$ with $\beta_{ij} \in F$, then the independence of the $b_j$ over $L$ shows that $\sum_i \beta_{ij} a_i = 0$ for each $j$. But independence of the $a_i$ over $F$ gives $\beta_{ij} = 0$ for each $i, j$. Thus, the $a_i b_j$ are independent over $F$, so they form a basis for $K/F$. Therefore,

$$
[K : F] = |\{a_i b_j : i \in I, j \in J\}| = |\{a_i : i \in I\}| \cdot |\{b_j : j \in J\}| = [K : L] \cdot [L : F].
$$

□

This proposition is used primarily with finite extensions, although it is true for arbitrary extensions. Note that the proof above does not assume that the dimensions are finite, although we are being somewhat informal in our treatment of infinite cardinals.

We now prove the converse to Proposition 1.19.

**Proposition 1.21** Let $K$ be a field extension of $F$. If each $\alpha_i \in K$ is algebraic over $F$, then $F[\alpha_1, \ldots, \alpha_n]$ is a finite dimensional field extension of $F$ with

$$
[F[\alpha_1, \ldots, \alpha_n] : F] \le \prod_{i=1}^n [F(\alpha_i) : F].
$$

**Proof.** We prove this by induction on $n$; the case $n = 1$ follows from Proposition 1.15. If we set $L = F[\alpha_1, \ldots, \alpha_{n-1}]$, then by induction $L$ is a field and $[L : F] \le \prod_{i=1}^{n-1} [F(\alpha_i) : F]$. Then $F[\alpha_1, \ldots, \alpha_n] = L[\alpha_n]$ is a field since $\alpha_n$ is algebraic over $L$, and since $\min(L, \alpha_n)$ divides $\min(F, \alpha_n)$ by Proposition 1.15, we have $[F[\alpha_1, \ldots, \alpha_n] : L] \le [F(\alpha_n) : F]$. Hence, by Proposition 1.20 and the induction hypothesis,

$$
[F[\alpha_1, \ldots, \alpha_n] : F] = [F[\alpha_1, \ldots, \alpha_n] : L] \cdot [L : F] \le \prod_{i=1}^n [F(\alpha_i) : F].
$$

This finishes the proof.
□

The inequality of the proposition above can be strict. For example, if $a = \sqrt[4]{2}$ and $b = \sqrt[4]{18}$, then $[\mathbb{Q}(a) : \mathbb{Q}] = [\mathbb{Q}(b) : \mathbb{Q}] = 4$, since the polynomials $x^4 - 2$ and $x^4 - 18$ are irreducible over $\mathbb{Q}$ by an application of the Eisenstein criterion. However, we know that $\mathbb{Q}(a,b) = \mathbb{Q}(\sqrt[4]{2}, \sqrt{3})$, which has degree 8 over $\mathbb{Q}$. To see this equality, note that $(b/a)^4 = 3$, so $(b/a)^2$ is a square root of 3. Thus, $\sqrt{3} \in \mathbb{Q}(a,b)$. However, $[\mathbb{Q}(a,b) : \mathbb{Q}(a)] \le 2$ because $b$ satisfies the polynomial $z^2 - 3\sqrt{2} = z^2 - 3a^2 \in \mathbb{Q}(a)[x]$. Thus, by Proposition 1.20,

$$
|\mathbb{Q}(a,b) : \mathbb{Q}| = [\mathbb{Q}(a,b) : \mathbb{Q}(a)] \cdot [\mathbb{Q}(a) : \mathbb{Q}] \le 8 = [\mathbb{Q}(\sqrt[4]{2}, \sqrt{3}) : \mathbb{Q}],
$$

so since $\mathbb{Q}(\sqrt[4]{2}, \sqrt{3})$ is a subfield of $\mathbb{Q}(a,b)$, we obtain $\mathbb{Q}(a,b) = \mathbb{Q}(\sqrt[4]{2}, \sqrt{3})$. The equality $[\mathbb{Q}(\sqrt[4]{2}, \sqrt{3}) : \mathbb{Q}] = 8$ is left as an exercise (see Problem 18).

As a corollary to the previous proposition, we have the following convenient criterion for an element to be algebraic over a field.

**Corollary 1.22** If $K$ is a field extension of $F$, then $\alpha \in K$ is algebraic over $F$ if and only if $[F(\alpha) : F] < \infty$. Moreover, $K$ is algebraic over $F$ if $[K : F] < \infty$.

The converse to the second statement of the corollary is false. There are algebraic extensions of infinite degree. The set of all complex numbers algebraic over $\mathbb{Q}$ is a field, and this field is infinite dimensional over $\mathbb{Q}$ (see Problem 16).

Proposition 1.21 can be extended easily to the case of fields generated by an arbitrary number of elements.

**Proposition 1.23** Let $K$ be a field extension of $F$, and let $X$ be a subset of $K$ such that each element of $X$ is algebraic over $F$. Then $F(X)$ is algebraic over $F$. If $|X| < \infty$, then $[F(X) : F] < \infty$.

**Proof.** Let $a \in F(X)$. By Proposition 1.10, there are $\alpha_1, \ldots, \alpha_n \in X$ with $a \in F(\alpha_1, \ldots, \alpha_n)$. By Proposition 1.21, $F(\alpha_1, \ldots, \alpha_n)$ is algebraic over $F$. Thus, $a$ is algebraic over $F$ and, hence, $F(X)$ is algebraic over $F$. If $|X| < \infty$, then $[F(X) : F] < \infty$ by Proposition 1.21.
□

We are now ready to prove that the property of being algebraic is transitive. We will use this result frequently. In the case of finite extensions, transitivity follows from Proposition 1.20 and Corollary 1.22, but it is harder to prove for general extensions.

**Theorem 1.24** Let $F \subseteq L \subseteq K$ be fields. If $L/F$ and $K/L$ are algebraic, then $K/F$ is algebraic.

**Proof.** Let $\alpha \in K$, and let $f(x) = a_0 + a_1 x + \cdots + x^n$ be the minimal polynomial of $\alpha$ over $L$. Since $L/F$ is algebraic, the field $L_0 = F(a_0, \ldots, a_{n-1})$ is a finite extension of $F$ by Corollary 1.22. Now $f(x) \in L_0[x]$, so $\alpha$ is algebraic over $L_0$. Thus,

$$
[L_0(\alpha) : F] = [L_0(\alpha) : L_0] \cdot [L_0 : F] < \infty.
$$

Because $F(\alpha) \subseteq L_0(\alpha)$, we see that $[F(\alpha) : F] < \infty$, so $\alpha$ is algebraic over $F$. Since this is true for all $\alpha \in K$, we have shown that $K/F$ is algebraic.
□

As an application of some of the results we have obtained, we can help to describe the set of algebraic elements of a field extension.

**Definition 1.25** Let $K$ be a field extension of $F$. The set

$$
\{ a \in K : a \text{ is algebraic over } F \}
$$

is called the *algebraic closure* of $F$ in $K$.

**Corollary 1.26** Let $K$ be a field extension of $F$, and let $L$ be the algebraic closure of $F$ in $K$. Then $L$ is a field, and therefore is the largest algebraic extension of $F$ contained in $K$.

**Proof.** Let $a, b \in L$. Then $F(a,b)$ is algebraic over $F$ by Proposition 1.23, so $F(a,b) \subseteq L$, and since $a \pm b, ab, a/b \in F(a,b) \subseteq L$, the set $L$ is closed under the field operations, so it is a subfield of $K$. Each element of $K$ that is algebraic over $F$ lies in $L$, which means that $L$ is the largest algebraic extension of $F$ contained in $K$.
□

### Composites of field extensions

Let $F$ be a field, and suppose that $L_1$ and $L_2$ are field extensions of $F$ contained in some common extension $K$ of $F$. Then the *composite* $L_1 L_2$ of $L_1$ and $L_2$ is the subfield of $K$ generated by $L_1$ and $L_2$; that is, $L_1 L_2 = L_1(L_2) = L_2(L_1)$. We will use this concept throughout this book. Some properties of composites are given in the Problems. We finish this section with some examples of composites.

**Example 1.27** Let $F = \mathbb{Q}$, and view all fields in this example as subfields of $\mathbb{C}$. Let $\omega = e^{2\pi i/3}$, so $\omega^3 = 1$ and $\omega \ne 1$. The composite of $\mathbb{Q}(\sqrt[3]{2})$ and $\mathbb{Q}(\omega \sqrt[3]{2})$ is $\mathbb{Q}(\omega, \sqrt[3]{2})$. To see that this is the composite, note that both $\mathbb{Q}(\sqrt[3]{2})$ and $\mathbb{Q}(\omega \sqrt[3]{2})$ are contained in $\mathbb{Q}(\sqrt[3]{2}, \omega)$, so their composite is also contained in $\mathbb{Q}(\sqrt[3]{2}, \omega)$. However, if a field $L$ contains $\sqrt[3]{2}$ and $\omega \sqrt[3]{2}$, then it also contains $\omega = \omega \sqrt[3]{2}/\sqrt[3]{2}$. Thus, $L$ must contain $\sqrt[3]{2}$ and $\omega$, so it must contain $\mathbb{Q}(\sqrt[3]{2}, \omega)$. Therefore, $\mathbb{Q}(\sqrt[3]{2}, \omega)$ is the smallest field containing both $\mathbb{Q}(\sqrt[3]{2})$ and $\mathbb{Q}(\omega \sqrt[3]{2})$. We can also show that $\mathbb{Q}(\sqrt[3]{2}, \omega) = \mathbb{Q}(\sqrt[3]{2} + \omega)$, so $\mathbb{Q}(\sqrt[3]{2}, \omega)$ is generated by one element over $\mathbb{Q}$. If $a = \omega + \sqrt[3]{2}$, then $(a - \omega)^3 = 2$. Expanding this and using the relation $\omega^2 = -1 - \omega$, solving for $\omega$ yields

$$
\omega = \frac{a^3 - 3a - 3}{3a^2 + 3a},
$$

so $\omega \in \mathbb{Q}(a)$. Thus, $\sqrt[3]{2} = a - \omega \in \mathbb{Q}(a)$, so $\mathbb{Q}(\sqrt[3]{2}, \omega) = \mathbb{Q}(\sqrt[3]{2} + \omega)$.

**Example 1.28** The composite of $\mathbb{Q}(\sqrt{2})$ and $\mathbb{Q}(\sqrt{3})$ is the field $\mathbb{Q}(\sqrt{2}, \sqrt{3})$. This composite can be generated by a single element over $\mathbb{Q}$. In fact, $\mathbb{Q}(\sqrt{2}, \sqrt{3}) = \mathbb{Q}(\sqrt{2} + \sqrt{3})$. To see this, the inclusion $\supseteq$ is clear. For the reverse inclusion, let $a = \sqrt{2} + \sqrt{3}$. Then $(a - \sqrt{2})^2 = 3$. Multiplying this and rearranging gives $2\sqrt{2}a = a^2 - 1$, so

$$
\sqrt{2} = \frac{a^2 - 1}{2a} \in \mathbb{Q}(a).
$$

Similar calculations show that

$$
\sqrt{3} = \frac{(a^2 + 1)}{2a} \in \mathbb{Q}(a).
$$

Therefore, $\mathbb{Q}(\sqrt{2}, \sqrt{3}) \subseteq \mathbb{Q}(a)$, which, together with the previous inclusion, gives $\mathbb{Q}(\sqrt{2}, \sqrt{3}) = \mathbb{Q}(a)$.

We will see in Section 5 that every finite extension of $\mathbb{Q}$ is of the form $\mathbb{Q}(\alpha)$ for some $\alpha$, which indicates that there is some reason behind these ad hoc calculations.
