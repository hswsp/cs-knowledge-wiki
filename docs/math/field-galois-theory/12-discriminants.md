# 12. Discriminants（判别式）

Now that we have developed Galois theory and have investigated a number of types of field extensions, we can put our knowledge to use to answer some of the most famous questions in mathematical history. In Section 15, we look at ruler and compass constructions and prove that with ruler and compass alone it is impossible to trisect an arbitrary angle, to duplicate the cube, to square the circle, and to construct most regular $n$-gons. These questions arose in the days of the ancient Greeks but were left unanswered for 2500 years. In order to prove that it is impossible to square the circle, we prove in Section 14 that $\pi$ is transcendental over $\mathbb{Q}$, and we prove at the same time that $e$ is also transcendental over $\mathbb{Q}$. In Section 16, we prove that there is no algebraic formula, involving only field operations and extraction of roots, to find the roots of an arbitrary $n$th degree polynomial if $n \geq 5$. Before doing so, we investigate in detail polynomials of degree less than 5. By the mid-sixteenth century, formulas for finding the roots of quadratic, cubic, and quartic polynomials had been found. The success in finding the roots of arbitrary cubics and quartics within a few years of each other led people to believe that formulas for arbitrary degree polynomials would be found. However, it was not until the early nineteenth century that Abel was able to prove that it is impossible to find an algebraic formula for the roots of an arbitrary fifth degree polynomial, and Galois was able to use his new theory to explain why some polynomials had formulas for their roots and others did not.

In this section, we define discriminants and give methods to calculate them. The discriminant of a polynomial is a generalization to arbitrary degree polynomials of the discriminant of a quadratic. If $K = F(\alpha)$ is a Galois extension of a field $F$, and if $f = \min(F,\alpha)$, then the Galois group $\mathrm{Gal}(K/F)$ can be viewed as a subgroup of the group of permutations of the roots of $f$. The discriminant determines when this subgroup consists solely of even permutations. We will use this information to describe the splitting field of a polynomial of degree 4 or less in Section 13. While we only need a little information about discriminants in Section 13, we go into some detail here for two reasons. First, there are some interesting relations that make calculating discriminants manageable, and there are notions of discriminants in a number of other places, such as algebraic number theory, quadratic form theory, and noncommutative ring theory. While the different notions of discriminant may seem unrelated, this is not the case, as we point out in the following discussion.

## The discriminant of a polynomial and an element

The type of discriminant we need in Section 13 is the discriminant of a polynomial. To motivate the definition, consider a quadratic polynomial $f(x) = x^2 + bx + c$ whose discriminant is $b^2 - 4c$. The roots of $f$ are $\alpha_1 = \frac{1}{2}(-b + \sqrt{b^2 - 4c})$ and $\alpha_2 = \frac{1}{2}(-b - \sqrt{b^2 - 4c})$. Therefore, $\sqrt{b^2 - 4c} = \alpha_1 - \alpha_2$, so $b^2 - 4c = (\alpha_1 - \alpha_2)^2$. This indicates a way to generalize the notion of the discriminant of a quadratic to higher degree polynomials.

**Definition 12.1.** Let $F$ be a field with $\mathrm{char}(F) \neq 2$, and let $f(x) \in F[x]$. Let $\alpha_1,\ldots,\alpha_n$ be the roots of $f$ in some splitting field $K$ of $f$ over $F$, and let $\Delta = \prod_{i<j}(\alpha_i - \alpha_j) \in K$. Then the *discriminant* $\mathrm{disc}(f)$ of $f$ is the element $D = \Delta^2 = \prod_{i<j}(\alpha_i - \alpha_j)^2$.

**Definition 12.2.** If $K$ is an algebraic extension of $F$ with $\mathrm{char}(F) \neq 2$ and $\alpha \in K$, then the *discriminant* $\mathrm{disc}(\alpha)$ is $\mathrm{disc}(\min(F,\alpha))$.

The discriminant $\mathrm{disc}(\alpha)$ defined above is dependent on the base field $F$. Also, the element $\Delta$ is dependent on the labeling of the roots of $f$, in that a different labeling can change $\Delta$ by $-1$. However, the discriminant does not depend on this labeling. Note that if $f(x) \in F[x]$, then $D = \mathrm{disc}(f) = 0$ if and only if $f$ has a repeated root. The discriminant thus will give us information only when $f$ has no repeated roots. It is in this case that we concentrate our investigation. The discriminant $D$ clearly is an element of $K$. We can say more than that. If $K$ is the splitting field of a separable, irreducible polynomial $f \in F[x]$ of degree $n$ over $F$, then we view $\mathrm{Gal}(K/F)$ as a subgroup of $S_n$ by viewing the elements of $\mathrm{Gal}(K/F)$ as permutations of the roots of $f$.

**Lemma 12.3.** Let $F$ be a field with $\mathrm{char}(F) \neq 2$, let $f(x) \in F[x]$ be an irreducible, separable polynomial, and let $K$ be the splitting field of $f(x)$ over $F$. If $\Delta$ is defined as in Definition 12.2, then $\sigma \in \mathrm{Gal}(K/F)$ is an even permutation if and only if $\sigma(\Delta) = \Delta$, and $\sigma$ is odd if and only if $\sigma(\Delta) = -\Delta$. Furthermore, $\mathrm{disc}(f) \in F$.

**Proof.** Before we prove this, we note that the proof we give is the same as the typical proof that every permutation of $S_n$ is either even or odd. In fact, the proof of this result about $S_n$ is really about discriminants. It is easy to see that each $\sigma \in G = \mathrm{Gal}(K/F)$ fixes $\mathrm{disc}(f)$, so $\mathrm{disc}(f) \in F$. For the proof of the first statement, if $n = \deg(f)$, let $M = F(x_1,\ldots,x_n)$. We saw in Example 2.22 that $S_n$ acts as field automorphisms on $M$ by permuting the variables. Let $h(x) = \prod_{i<j}(x_i - x_j)$. Suppose that $\sigma \in S_n$ is a transposition, say $\sigma = (ij)$ with $i < j$. Then $\sigma$ affects only those factors of $h$ that involve $i$ or $j$. We break up these factors into four groups:
$$
\begin{aligned}
& x_i - x_j, \\
& x_k - x_i,\; x_k - x_j \quad \text{for } k < i, \\
& x_i - x_l,\; x_j - x_l \quad \text{for } j < l, \\
& x_i - x_m,\; x_m - x_j \quad \text{for } i < m < j.
\end{aligned}
$$
For $k < i$, the permutation $\sigma = (ij)$ maps $x_k - x_i$ to $x_k - x_j$ and vice versa, and $\sigma$ maps $x_i - x_l$ to $x_j - x_l$ and vice versa for $j < l$. If $i < m < j$, then
$$
\sigma(x_i - x_m) = x_j - x_m = -(x_m - x_j)
$$
and
$$
\sigma(x_m - x_j) = x_m - x_i = -(x_i - x_m).
$$
Finally,
$$
\sigma(x_i - x_j) = x_j - x_i = -(x_i - x_j).
$$
Multiplying all the terms together gives $\sigma(h) = -h$. Thus, we see for an arbitrary $\sigma \in S_n$ that $\sigma(h) = h$ if and only if $\sigma$ is a product of an even number of permutations, and $\sigma(h) = -h$ if and only if $\sigma$ is a product of an odd number of permutations. By substituting the roots $\alpha_i$ of $f$ for the $x_i$, we obtain the desired conclusion.
$\square$

Recall that the set $A_n$ of all even permutations in $S_n$ is a subgroup; it is called the *alternating group*.

**Corollary 12.4.** Let $F$, $K$, and $f$ be as in Lemma 12.3, and let $G = \mathrm{Gal}(K/F)$. Then $G \subseteq A_n$ if and only if $\mathrm{disc}(f) \in F^2$. Under the correspondence of the fundamental theorem, the field $F(\Delta) \subseteq K$ corresponds to the subgroup $G \cap A_n$ of $G$.

**Proof.** This follows from the lemma, since $G \subseteq A_n$ if and only if each $\sigma \in G$ is even, and this occurs if and only if $\sigma(\Delta) = \Delta$. Therefore, $G \subseteq A_n$ if and only if $\mathrm{disc}(f) \in F^2$.
$\square$

One problem with the definition of a discriminant is that in order to calculate it we need the roots of the polynomial. We will give other descriptions of the discriminant that do not require knowledge of the roots and lend themselves to calculation. We first obtain a description of the discriminant in terms of determinants.

Let $K$ be a field and let $\alpha_1,\ldots,\alpha_n \in K$. Then the *Vandermonde matrix* $V(\alpha_1,\ldots,\alpha_n)$ is the $n \times n$ matrix
$$
V(\alpha_1,\ldots,\alpha_n) = \begin{bmatrix}
1 & \alpha_1 & \alpha_1^2 & \cdots & \alpha_1^{n-1} \\
1 & \alpha_2 & \alpha_2^2 & \cdots & \alpha_2^{n-1} \\
\vdots & \vdots & \vdots & \ddots & \vdots \\
1 & \alpha_n & \alpha_n^2 & \cdots & \alpha_n^{n-1}
\end{bmatrix}.
$$

**Lemma 12.5.** If $K$ is a field and $\alpha_1,\ldots,\alpha_n \in K$, then the determinant of the Vandermonde matrix $V(\alpha_1,\ldots,\alpha_n)$ is $\prod_{i<j}(\alpha_j - \alpha_i)$. Consequently, if $f \in F[x]$ has roots $\alpha_1,\ldots,\alpha_n \in K$ in some extension $K$ of $F$, then the discriminant of $f$ is equal to $(\det(V(\alpha_1,\ldots,\alpha_n)))^2$.

**Proof.** Let $A = V(\alpha_1,\ldots,\alpha_n)$. That $\det(A) = \prod_{i<j}(\alpha_j - \alpha_i)$ is a moderately standard fact from linear algebra. For those who have not seen this, we give a proof. Note that if $\alpha_i = \alpha_j$ with $i \neq j$, then $\det(A) = 0$, since two rows of $A$ are the same, so the determinant formula is true in this case. We therefore assume that the $\alpha_i$ are distinct, and we prove the result using induction on $n$. If $n = 1$, this is clear, so suppose that $n > 1$. Let $h(x) = \det(V(\alpha_1,\alpha_2,\ldots,\alpha_{n-1},x))$. Then $h(x)$ is a polynomial of degree less than $n$. By expanding the determinant about the last row, we see that the leading coefficient of $h$ is $\det(V(\alpha_1,\alpha_2,\ldots,\alpha_{n-1}))$. Moreover, $h(\alpha_i) = \det(V(\alpha_1,\ldots,\alpha_{n-1},\alpha_i))$, so $h(\alpha_i) = 0$ if $1 \leq i \leq n-1$. Therefore, $h(x)$ is divisible by each $x - \alpha_i$. Since $\deg(h) < n$ and $h$ has $n-1$ distinct factors, $h(x) = c(x-\alpha_1)\cdots(x-\alpha_{n-1})$, where $c = \det(V(\alpha_1,\alpha_2,\ldots,\alpha_{n-1}))$. By evaluating $h$ at $\alpha_n$ and using induction, we get
$$
\begin{aligned}
h(\alpha_n) &= \det(V(\alpha_1,\alpha_2,\ldots,\alpha_n)) \\
&= \prod_{i<j\leq n-1}(\alpha_j - \alpha_i)\prod_{i<n}(\alpha_n - \alpha_i) \\
&= \prod_{i<j}(\alpha_j - \alpha_i).
\end{aligned}
$$
This finishes the proof that $\det(V(\alpha_1,\alpha_2,\ldots,\alpha_n)) = \prod_{i<j}(\alpha_j - \alpha_i)$. The last statement of the lemma is an immediate consequence of this formula and the definition of discriminant.
$\square$

The discriminant of a polynomial can be determined by the coefficients without having to find the roots, as we proceed to show. This is a convenient fact and will be used in Section 13 to describe polynomials of degree 3 and 4. Let $A = V(\alpha_1,\ldots,\alpha_n)$. Then $\det(A)^2 = \det(A^tA)$. Moreover,
$$
\begin{aligned}
A^tA &= \begin{bmatrix}
1 & 1 & \cdots & 1 \\
\alpha_1 & \alpha_2 & \cdots & \alpha_n \\
\vdots & \vdots & \ddots & \vdots \\
\alpha_1^{n-1} & \alpha_2^{n-1} & \cdots & \alpha_n^{n-1}
\end{bmatrix} \cdot
\begin{bmatrix}
1 & \alpha_1 & \alpha_1^2 & \cdots & \alpha_1^{n-1} \\
1 & \alpha_2 & \alpha_2^2 & \cdots & \alpha_2^{n-1} \\
\vdots & \vdots & \vdots & \ddots & \vdots \\
1 & \alpha_n & \alpha_n^2 & \cdots & \alpha_n^{n-1}
\end{bmatrix} \\
&= \begin{bmatrix}
t_0 & t_1 & \cdots & t_{n-1} \\
t_1 & t_2 & \cdots & t_n \\
\vdots & \vdots & \ddots & \vdots \\
t_{n-1} & t_n & \cdots & t_{2n-2}
\end{bmatrix},
\end{aligned}
$$
where $t_i = \sum_j \alpha_j^i$ for $i \geq 1$, and $t_0 = n$. Therefore, $\det(A)^2$ is the determinant of this latter matrix. This is helpful because if the roots of $f(x)$ are $\alpha_1,\ldots,\alpha_n$, then there are recursive relations between the $t_i$ and the coefficients of $f$, and so the determinant of the $t_i$ can be found in terms of the coefficients of $f$. These relations are called *Newton's identities*. Note that $t_i = T_{K/F}(\alpha_1^i)$ if $K$ is the splitting field of $\min(F,\alpha_1)$.

**Proposition 12.6 (Newton's Identities).** Let $f(x) = a_0 + a_1x + \cdots + a_{n-1}x^{n-1} + x^n$ be a monic polynomial over $F$ with roots $\alpha_1,\ldots,\alpha_n$. If $t_i = \sum_j \alpha_j^i$, then
$$
\begin{aligned}
t_m + a_{n-1}t_{m-1} + \cdots + a_{n-m+1}t_1 + ma_{n-m} &= 0 \quad \text{for } m \leq n, \\
t_m + a_{n-1}t_{m-1} + \cdots + a_0t_{m-n} &= 0 \quad \text{for } m > n.
\end{aligned}
$$

**Proof.** An alternative way of stating Newton's identities is to use the elementary symmetric functions $s_i$ in the $\alpha_i$, instead of the $a_i$. Since $s_i = (-1)^i a_{n-i}$, Newton's identities can also be written as
$$
\begin{aligned}
t_m - s_1t_{m-1} + s_2t_{m-2} - \cdots + (-1)^m m s_m &= 0 \quad \text{for } m \leq n, \\
t_m - s_1t_{m-1} + \cdots + (-1)^n s_n t_{m-n} &= 0 \quad \text{for } m > n.
\end{aligned}
$$
The proof we give here is from Mead [21]. The key is arranging the terms in the identities in a useful manner. We start with a bit of notation. If $(a_1,a_2,\ldots,a_r)$ is a sequence of nonincreasing, nonnegative integers, let
$$
f_{(a_1,a_2,\ldots,a_r)} = \sum \alpha_{\sigma(1)}^{a_1}\cdots\alpha_{\sigma(r)}^{a_r},
$$
where the sum is over all permutations $\sigma$ of $\{1,2,\ldots,n\}$ that give distinct terms. Then $s_i = f_{(1,1,\ldots,1)}$ ($i$ ones) and $t_i = f_{(i)}$. To simplify the notation a little, the sequence of $i$ ones will be denoted $(1_i)$, and the sequence $(a,1,\ldots,1)$ of length $i+1$ will be denoted $(a,1_i)$. It is then straightforward to see that
$$
\begin{aligned}
f_{(m-1)}f_{(1)} &= f_{(m)} + f_{(m-1,1)}, \\
f_{(m-2)}f_{(1,1)} &= f_{(m-1,1)} + f_{(m-2,1,1)}, \\
f_{(m-3)}f_{(1,1,1)} &= f_{(m-2,1,1)} + f_{(m-3,1,1,1)},
\end{aligned}
$$
and, in general,
$$
f_{(m-i)}f_{(1_i)} = f_{(m-i+1,1_{i-1})} + f_{(m-i,1_i)} \quad \text{for } 1 \leq i < \min\{m-1,n\}. \tag{12.1}
$$
Moreover, if $m \leq n$ and $i = m-1$, then
$$
f_{(1)}f_{(1_{m-1})} = f_{(2,1_{m-2})} + m f_{(1_m)}.
$$
If $m > n = i$, then
$$
f_{(m-n)}f_{(1_n)} = f_{(m-n+1,1_{n-1})}.
$$
Newton's identities then follow from these equations by multiplying the $i$th equation in (12.1) by $(-1)^{i-1}$ and summing over $i$.
$\square$

Newton's identities together with Lemma 12.5 give us a manageable way of calculating discriminants of polynomials. As an illustration, we determine the discriminant of a quadratic and of a cubic. The calculation of the discriminant of a cubic will come up in Section 13.

**Example 12.7.** Let $f(x) = x^2 + bx + c$. Then $t_0 = 2$. Also, Newton's identities yield $t_1 + b = 0$, so $t_1 = -b$. For $t_2$, we have $t_2 + bt_1 + 2c = 0$, so $t_2 = -bt_1 - 2c = b^2 - 2c$. Therefore,
$$
\mathrm{disc}(f) = \begin{vmatrix} 2 & -b \\ -b & b^2 - 2c \end{vmatrix} = 2(b^2 - 2c) - b^2 = b^2 - 4c,
$$
the usual discriminant of a monic quadratic.

**Example 12.8.** Let $f(x) = x^3 + px + q$. Then $a_0 = q$, $a_1 = p$, and $a_2 = 0$, so by Newton's identities we get
$$
t_1 = 0,\quad t_2 = -2p,\quad t_3 = -3q,\quad t_4 = 2p^2.
$$
Therefore,
$$
\mathrm{disc}(f) = \begin{vmatrix} 3 & 0 & -2p \\ 0 & -2p & -3q \\ -2p & -3q & 2p^2 \end{vmatrix} = -4p^3 - 27q^2.
$$

For an arbitrary monic cubic, we could do a similar calculation, but looking ahead to Section 13, where we find the roots of a cubic, we note that the case above is sufficient. For, if $g(x) = x^3 + ax^2 + bx + c$, let $y = x - a/3$. By Taylor expansion, we have
$$
g(x) = g(a/3) + g'(a/3)(x - a/3) + \frac{g''(a/3)}{2!}(x - a/3)^2 + \frac{g'''(a/3)}{3!}(x - a/3)^3.
$$
The choice of $y$ was made to satisfy $g''(a/3) = 0$. If $p = g'(a/3)$ and $q = g(a/3)$, then $g(x) = y^3 + py + q$. If the roots of $g$ are $\alpha_1$, $\alpha_2$, and $\alpha_3$, then the roots of $y^3+py+q$ are $\alpha_1-a/3$, $\alpha_2-a/3$, and $\alpha_3-a/3$. Therefore, the definition of discriminant shows that $\mathrm{disc}(g(x)) = \mathrm{disc}(y^3+py+q)$. The interested reader can check that $\mathrm{disc}(g(x)) = a^2(b^2-4ac) - 4b^3 - 27c^2 + 18abc$.

We give a further description of the discriminant, this time in terms of norms.

**Proposition 12.9.** Let $L = F(\alpha)$ be a field extension of $F$. If $f(x) = \min(F,\alpha)$, then $\mathrm{disc}(f) = (-1)^{n(n-1)/2}N_{L/F}(f'(\alpha))$, where $f'(x)$ is the formal derivative of $f$.

**Proof.** Let $K$ be a splitting field for $f$ over $F$, and write $f(x) = (x-\alpha_1)\cdots(x-\alpha_n) \in K[x]$. Set $\alpha = \alpha_1$. Then a short calculation shows that $f'(\alpha_j) = \prod_{i=1,i\neq j}^n (\alpha_j - \alpha_i)$. If $\sigma_1,\ldots,\sigma_n$ are the $F$-homomorphisms of $L$ to $K$ that satisfy $\sigma_i(\alpha) = \alpha_i$, then by Proposition 8.12,
$$
N_{L/F}(f'(\alpha)) = \prod_j \sigma_j(f'(\alpha)) = \prod_j f'(\alpha_j).
$$
Using the formula above for $f'(\alpha_j)$, we see by checking signs carefully that
$$
N_{L/F}(f'(\alpha)) = \prod_j f'(\alpha_j) = \prod_j \prod_{\substack{i=1 \\ i\neq j}}^n (\alpha_j - \alpha_i) = (-1)^{n(n-1)/2} \mathrm{disc}(f).
$$
$\square$

**Example 12.10.** Let $p$ be an odd prime, and let $\omega$ be a primitive $p$th root of unity in $\mathbb{C}$. We use the previous result to determine $\mathrm{disc}(\omega)$. Let $K = \mathbb{Q}(\omega)$, the $p$th cyclotomic extension of $\mathbb{Q}$. If $f(x) = \min(\mathbb{Q},\omega)$, then $f(x) = 1 + x + \cdots + x^{p-1} = (x^p - 1)/(x - 1)$. We need to calculate $N_{K/\mathbb{Q}}(f'(\omega))$. First,
$$
f'(x) = \frac{px^{p-1}(x-1) - (x^p - 1)}{(x-1)^2},
$$
so $f'(\omega) = p\omega^{p-1}/(\omega - 1)$. We claim that $N_{K/\mathbb{Q}}(\omega) = 1$ and $N_{K/\mathbb{Q}}(\omega - 1) = p$. To prove the first equality, by the description of $\mathrm{Gal}(K/\mathbb{Q})$ given in Corollary 7.8, we have
$$
N_{K/\mathbb{Q}}(\omega) = \prod_{i=1}^{p-1} \omega^i = \omega^{p(p-1)/2} = 1
$$
since $p$ is odd. For the second equality, note that
$$
1 + x + \cdots + x^{p-1} = \prod_{i=1}^{p-1} (x - \omega^i),
$$
so $p = \prod_{i=1}^{p-1}(1 - \omega^i)$. However,
$$
N_{K/\mathbb{Q}}(\omega - 1) = \prod_{i=1}^{p-1} (\omega^i - 1),
$$
so $N_{K/\mathbb{Q}}(\omega - 1) = p$, where again we use $p$ odd. From this, we see that
$$
\begin{aligned}
N_{K/\mathbb{Q}}(f'(\omega)) &= N_{K/\mathbb{Q}}\left(\frac{p\omega^{p-1}}{\omega - 1}\right) = \frac{N_{K/\mathbb{Q}}(p)N_{K/\mathbb{Q}}(\omega)^{p-1}}{N_{K/\mathbb{Q}}(\omega - 1)} \\
&= \frac{p^{p-1} \cdot 1}{p} = p^{p-2}.
\end{aligned}
$$

By Proposition 12.9, we have
$$
\mathrm{disc}(\omega) = (-1)^{(p-1)(p-2)/2} N_{K/\mathbb{Q}}(f'(\omega)) = (-1)^{(p-1)/2} p^{p-2},
$$
since $(p-1)(p-2)/2 \equiv (p-1)/2 \pmod{2}$ for odd $p$.

## The discriminant of an $n$-tuple and of a field extension

We now define the discriminant of a field extension of degree $n$ and of an $n$-tuple in the field extension. We shall see that our definition of the discriminant of an element is a special case of this new definition. Let $K$ be a separable extension of $F$ with $[K:F] = n$. Recall from Lemma 8.9 that $[K:F]$ is equal to the number of $F$-homomorphisms from $K$ into an algebraic closure of $F$.

**Definition 12.11.** Let $K$ be a separable extension of $F$ of degree $n$, and let $\sigma_1,\sigma_2,\ldots,\sigma_n$ be the distinct $F$-homomorphisms from $K$ to an algebraic closure of $F$. If $\alpha_1,\alpha_2,\ldots,\alpha_n$ are any $n$ elements of $K$, then the *discriminant of the $n$-tuple* $(\alpha_1,\ldots,\alpha_n)$ is $\mathrm{disc}(\alpha_1,\ldots,\alpha_n) = \det(\sigma_i(\alpha_j))^2$. If $\beta_1,\ldots,\beta_n$ is any $F$-basis of $K$, then the *discriminant of the field extension* $K/F$ is $\mathrm{disc}(K/F) = \mathrm{disc}(\beta_1,\ldots,\beta_n)$.

The definition of $\mathrm{disc}(K/F)$ depends on the choice of basis. We will show just how it depends on the basis. But first, we give another description of the discriminant of an $n$-tuple, which will show us that this discriminant is an element of the base field $F$.

**Lemma 12.12.** Let $K$ be a separable field extension of $F$ of degree $n$, and let $\alpha_1,\ldots,\alpha_n \in K$. Then $\mathrm{disc}(\alpha_1,\ldots,\alpha_n) = \det(\mathrm{Tr}_{K/F}(\alpha_i\alpha_j))$. Consequently, $\mathrm{disc}(\alpha_1,\ldots,\alpha_n) \in F$.

**Proof.** Let $\sigma_1,\ldots,\sigma_n$ be the distinct $F$-homomorphisms from $K$ to an algebraic closure of $F$. If $A = (\sigma_i(\alpha_j))$, then the discriminant of the $n$-tuple $\alpha_1,\ldots,\alpha_n$ is the determinant of the matrix $A^tA$, whose $ij$ entry is
$$
\sum_k \sigma_k(\alpha_i)\sigma_k(\alpha_j) = \sum_k \sigma_k(\alpha_i\alpha_j) = \mathrm{Tr}_{K/F}(\alpha_i\alpha_j).
$$
Therefore, $\mathrm{disc}(\alpha_1,\ldots,\alpha_n) = \det(\mathrm{Tr}_{K/F}(\alpha_i\alpha_j))$.
$\square$

The next result shows that the discriminant can be used to test whether or not an $n$-tuple in $K$ forms a basis for $K$.

**Proposition 12.13.** Let $K$ be a separable field extension of $F$ of degree $n$, and let $\alpha_1,\ldots,\alpha_n \in K$. Then $\mathrm{disc}(\alpha_1,\ldots,\alpha_n) = 0$ if and only if $\alpha_1,\ldots,\alpha_n$ are linearly dependent over $F$. Thus, $\{\alpha_1,\ldots,\alpha_n\}$ is an $F$-basis for $K$ if and only if $\mathrm{disc}(\alpha_1,\ldots,\alpha_n) \neq 0$.

**Proof.** Suppose that the $\alpha_i$ are linearly dependent over $F$. Then one of the $\alpha_i$ is an $F$-linear combination of the others. If $\alpha_i = \sum_{k\neq i} a_k\alpha_k$ with $a_j \in F$, then
$$
\mathrm{Tr}_{K/F}(\alpha_i\alpha_j) = \sum_k a_k \mathrm{Tr}_{K/F}(\alpha_k\alpha_j).
$$
Therefore, the columns of the matrix $(\mathrm{Tr}_{K/F}(\alpha_i\alpha_j))$ are linearly dependent over $F$, so $\det(\mathrm{Tr}_{K/F}(\alpha_i\alpha_j)) = 0$.

Conversely, suppose that $\det(\mathrm{Tr}_{K/F}(\alpha_i\alpha_j)) = 0$. Then the rows $R_1,\ldots,R_n$ of the matrix $(\mathrm{Tr}_{K/F}(\alpha_i\alpha_j))$ are dependent over $F$, so there are $a_i \in F$, not all zero, with $\sum_i a_i R_i = 0$. The vector equation $\sum_i a_i R_i = 0$ means that $\sum_i a_i \mathrm{Tr}_{K/F}(\alpha_i\alpha_j) = 0$ for each $j$. Let $x = \sum_i a_i\alpha_i$. By linearity of the trace, we see that $\mathrm{Tr}_{K/F}(x\alpha_j) = 0$ for each $j$. If the $\alpha_i$ are independent over $F$, then they form a basis for $K$. Consequently, linearity of the trace then implies that $\mathrm{Tr}_{K/F}(xy) = 0$ for all $y \in K$. This means that the trace map is identically zero, which is false by the Dedekind independence lemma. Thus, the $\alpha_i$ are dependent over $F$.
$\square$

We now see exactly how the discriminant of a field extension depends on the basis chosen to calculate it.

**Proposition 12.14.** Let $\{\alpha_1,\ldots,\alpha_n\}$ and $\{\beta_1,\ldots,\beta_n\}$ be two $F$-bases for $K$. Let $A = (a_{ij})$ be the $n \times n$ transition matrix between the two bases; that is, $\beta_j = \sum_i a_{ij}\alpha_i$. Then $\mathrm{disc}(\beta_1,\ldots,\beta_n) = \det(A)^2 \mathrm{disc}(\alpha_1,\ldots,\alpha_n)$. Consequently, the coset of $\mathrm{disc}(K/F)$ in $F^*/F^{*2}$ is well defined, independent of the basis chosen.

**Proof.** Since $\beta_j = \sum_k a_{kj}\alpha_k$, we have $\sigma_i(\beta_j) = \sum_k a_{kj}\sigma_i(\alpha_k)$. In terms of matrices, this says that
$$
(\sigma_i(\beta_j)) = (a_{ij})^t (\sigma_i(\alpha_j)) = A^t(\sigma_i(\alpha_j)).
$$
Therefore, by taking determinants, we obtain
$$
\mathrm{disc}(\beta_1,\ldots,\beta_n) = \det(A)^2 \mathrm{disc}(\alpha_1,\ldots,\alpha_n).
$$
The final statement of the proposition follows immediately from this relation, together with the fact that the discriminant of a basis is nonzero, by Proposition 12.13.
$\square$

To make the definition of discriminant of a field extension well defined, one can define it to be the coset in $F^*/F^{*2}$ represented by $\mathrm{disc}(\alpha_1,\ldots,\alpha_n)$ for any basis $\{\alpha_1,\ldots,\alpha_n\}$ of $K$. This eliminates ambiguity, although it is not always the most convenient way to work with discriminants.

**Example 12.15.** In this example, we show that the discriminant of a polynomial is equal to the discriminant of an appropriate field extension. Suppose that $K = F(\alpha)$ is an extension of $F$ of degree $n$. Then $1, \alpha, \alpha^2, \ldots, \alpha^{n-1}$ is a basis for $K$. We calculate $\mathrm{disc}(K/F)$ relative to this basis. We have $\mathrm{disc}(K/F) = \det(\sigma_i(\alpha^{j-1}))^2$. Consequently, if $\alpha_i = \sigma_i(\alpha)$, then
$$
\begin{aligned}
\mathrm{disc}(K/F) &= \det\begin{pmatrix}
1 & \sigma_1(\alpha) & \cdots & \sigma_1(\alpha^{n-1}) \\
1 & \sigma_2(\alpha) & \cdots & \sigma_2(\alpha^{n-1}) \\
\vdots & \vdots & \ddots & \vdots \\
1 & \sigma_n(\alpha) & \cdots & \sigma_n(\alpha^{n-1})
\end{pmatrix}^2 \\
&= \det(V(\alpha_1,\alpha_2,\ldots,\alpha_n))^2.
\end{aligned}
$$
Therefore, $\mathrm{disc}(K/F) = \mathrm{disc}(\alpha) = \mathrm{disc}(\min(F,\alpha))$.

**Example 12.16.** Let $K = \mathbb{Q}(\sqrt{-1})$. If $i = \sqrt{-1}$, then using the basis $1, i$ of $K/\mathbb{Q}$, we get
$$
\mathrm{disc}(\mathbb{Q}(i)/\mathbb{Q}) = \det\begin{pmatrix} 1 & i \\ 1 & -i \end{pmatrix}^2 = (-2i)^2 = -4.
$$
More generally, if $K = \mathbb{Q}(\sqrt{d})$ with $d$ a square-free integer, then using $1, \sqrt{d}$ as a basis, we see that the discriminant is $4d$.

## The discriminant of a bilinear form

We now extend the idea of discriminant to its most general form that we consider. The two previous notions of discriminant will be special cases of this general form. The starting point here is similar to that considered in Section 11, when we discussed Kummer pairings. If $V$ is an $F$-vector space, a *bilinear form* on $V$ is a mapping $B : V \times V \to F$ that is linear in each variable. In other words, for all $u, v, w \in V$ and all $\alpha, \beta \in F$, we have
$$
\begin{aligned}
B(u, \alpha v + \beta w) &= \alpha B(u, v) + \beta B(u, w), \\
B(\alpha u + \beta v, w) &= \alpha B(u, w) + \beta B(v, w).
\end{aligned}
$$

**Definition 12.17.** If $V$ is an $F$-vector space and if $B : V \times V \to F$ is a bilinear form, then the *discriminant* of $B$ relative to a basis $\mathcal{V} = \{v_1,\ldots,v_n\}$ of $V$ is $\mathrm{disc}(B)_{\mathcal{V}} = \det(B(v_i,v_j))$.

As with the discriminant of a field extension, this definition depends on the choice of basis. If $\mathcal{W} = \{w_1,\ldots,w_n\}$ is another basis, let $A$ be the matrix describing the basis change; that is, if $A = (a_{ij})$, then $w_j = \sum_i a_{ij}v_i$. By the bilinearity of $B$, we have
$$
B(w_i,w_j) = B\left(\sum_k a_{ki}v_k, \sum_l a_{lj}v_l\right) = \sum_{k,l} a_{ki}B(v_k,v_l)a_{lj}.
$$
Therefore, it follows that $(B(w_i,w_j)) = A^t(B(v_k,v_l))A$. Taking determinants gives
$$
\mathrm{disc}(B)_{\mathcal{W}} = \det(A)^2 \mathrm{disc}(B)_{\mathcal{V}},
$$
the same relation that was found for field extensions.

A bilinear form is *nondegenerate* if $B(v,w) = 0$ for all $w$ only if $v = 0$, and if $B(v,w) = 0$ for all $v$ only if $w = 0$. As in Section 11, if we define $B_v : V \to F$ by $B_v(w) = B(v,w)$, then the map $v \mapsto B_v$ is a homomorphism from $V$ to $\mathrm{hom}_F(V,F)$. The form $B$ is nondegenerate if and only if this homomorphism is injective. If we represent this homomorphism by a matrix, using the basis $\mathcal{V}$ and the dual basis for $\mathrm{hom}_F(V,F)$, then this matrix is $(B(v_i,v_j))$. Therefore, $B$ is nondegenerate if and only if $\mathrm{disc}(B)_{\mathcal{V}} \neq 0$. This condition is independent of the basis, by the change of basis formula above for the discriminant.

**Example 12.18.** We now show that the discriminant of a field extension is the discriminant of the trace form. Let $K$ be a finite separable extension of $F$. Let $B : K \times K \to F$ be defined by $B(a,b) = T_{K/F}(ab)$. Then $B$ is a bilinear form because the trace is linear. The discriminant of $B$ relative to a basis $\mathcal{V} = \{v_1,\ldots,v_n\}$ is $\det(T_{K/F}(v_iv_j))$. But, by Lemma 12.12, this is the discriminant of $K/F$. Therefore, the previous notions of discriminant are special cases of the notion of discriminant of a bilinear form.
