# 21. Algebraic Varieties（代数簇）

Field extensions that are finitely generated but not algebraic arise naturally in algebraic geometry. In this section, we discuss some of the basic ideas of algebraic geometry, and in Section 22 we describe the connection between varieties and finitely generated field extensions.

Let $k$ be a field, and let $f \in k[x_1,\dots,x_n]$ be a polynomial in the $n$ variables $x_1,\dots,x_n$. Then $f$ can be viewed as a function from $k^n$ to $k$ in the obvious way; if $P = (a_1,\dots,a_n) \in k^n$, we will write $f(P)$ for $f(a_1,\dots,a_n)$. It is possible for two different polynomials to yield the same function on $k^n$. For instance, if $k = \mathbb{F}_2$, then $x^2 - x$ is the zero function on $k^1$, although it is not the zero polynomial. However, if $k$ is infinite, then $f \in k[x_1,\dots,x_n]$ is the zero function on $k^n$ if and only if $f$ is the zero polynomial (see Problem 1).

**Definition 21.1** Let $k$ be a field, and let $C$ be an algebraically closed field containing $k$. If $S$ is a subset of $k[x_1,\dots,x_n]$, then the zero set of $S$ is
$$
Z(S) = \{(a_1,\dots,a_n) \in C^n : f(a_1,\dots,a_n) = 0 \text{ for all } f \in S\}.
$$

**Definition 21.2** Let $k$ be a field, and let $C$ be an algebraically closed field containing $k$. Then a set $V \subseteq C^n$ is said to be a $k$-variety if $V = Z(S)$ for some set $S$ of polynomials in $k[x_1,\dots,x_n]$. The set
$$
V(k) = \{P \in k^n : f(P) = 0 \text{ for all } f \in S\}
$$
is called the set of $k$-rational points of $V$.

Before looking at a number of examples, we look more closely at the definitions above. The reason for working in $C^n$ instead of $k^n$ is that a polynomial $f \in k[x_1,\dots,x_n]$ may not have a zero in $k^n$, but, as we shall see below, $f$ does have zeros in $C^n$. For example, if $f = x^2 + y^2 + 1 \in \mathbb{R}[x,y]$, then $f$ has no zeros in $\mathbb{R}^2$, while $f$ has the zeros $(0,\pm i)$, among others, in $\mathbb{C}^2$. Classical algebraic geometry is concerned with polynomials over $\mathbb{C}$. On the other hand, zeros of polynomials over a number field are of concern in algebraic number theory. Working with polynomials over a field $k$ but looking at zeros inside $C^n$ allows one to handle both of these situations simultaneously.

We now look at some examples of varieties. The pictures below show the $\mathbb{R}$-rational points of the given varieties.

**Example 21.3** Let $f(x,y) = y - x^2$. Then $Z(f) = \{(a,a^2) : a \in C\}$, a $k$-variety for any $k \subseteq C$.

**Example 21.4** Let $f(x,y) = y^2 - (x^3 - x)$. Then $Z(f)$ is a $k$-variety for any $k \subseteq C$. This variety is an example of an elliptic curve, a class of curves of great importance in number theory.

**Example 21.5** Let $f(x,y) = x^n + y^n - 1 \in \mathbb{Q}[x,y]$, the Fermat curve. Fermat's last theorem states that if $V = Z(f)$ and $n \ge 3$, then $V$ has no $\mathbb{Q}$-rational points other than the "trivial points," when either $x = 0$ or $y = 0$.

**Example 21.6** Let $V = \{(t^2, t^3) : t \in C\}$. Then $V$ is the $k$-variety $Z(y^2 - x^3)$. The description of $V$ as the set of points of the form $(t^2, t^3)$ is called a parameterization of $V$. We will see a connection between parameterizing varieties and field extensions in Section 22.

**Example 21.7** Let $V = \{(t^3, t^4, t^5) : t \in C\}$. Then $V$ is a $k$-variety, since $V$ is the zero set of $\{y^2 - xz, z^2 - x^2 y\}$. To verify this, note that each point of $V$ does satisfy these two polynomials. Conversely, suppose that $(a,b,c) \in C^3$ is a zero of these two polynomials. If $a = 0$, then a quick check of the polynomials shows that $b = c = 0$, so $(a,b,c) \in V$. If $a \ne 0$, then define $t = b/a$. From $b^2 = ac$, we see that $c = t^2 a$. Finally, the equation $c^2 = a^2 b$ yields $t^4 a^2 = a^3 t$, so $a = t^3$. Thus, $(a,b,c) = (t^3, t^4, t^5) \in V$.

**Example 21.8** Let $S^n = \{(a_1,\dots,a_n) \in C^n : \sum_{i=1}^n a_i^2 = 1\}$. Then $V = Z(-1 + \sum_{i=1}^n x_i^2)$, so $V$ is a $k$-variety.

**Example 21.9** Let $V$ be a $C$-vector subspace of $C^n$. We can find a matrix $A$ such that $V$ is the nullspace of $A$. If $A = (a_{ij})$, then a point $(a_1,\dots,a_n)$ is in $V$ if and only if $\sum_j a_{ij} a_j = 0$ for each $i$. Thus, $V$ is the zero set of the set of linear polynomials $\sum_j a_{ij} x_j$, so $V$ is a $C$-variety. If each $a_{ij}$ lies in a subfield $k$, then $V$ is a $k$-variety.

**Example 21.10** Let $SL_n(C)$ be the set of all $n \times n$ matrices over $C$ of determinant 1. We view the set of all $n \times n$ matrices over $C$ as the set $C^{n^2}$ of $n^2$-tuples over $C$. The determinant $\det = \det(x_{ij})$ is a polynomial in the $n^2$ variables $x_{ij}$, and the coefficients of the determinant polynomial are $\pm 1$. We then see that $SL_n(C) = Z(\det - 1)$ is a $k$-variety for any subfield $k$ of $C$. For instance, if $n = 2$, then
$$
SL_2(C) = \{(a,b,c,d) \in C^4 : ad - bc - 1 = 0\}.
$$

We can define a topology on $C^n$, the $k$-Zariski topology, by defining a subset of $C^n$ to be closed if it is a $k$-variety. The following lemma shows that this does indeed define a topology on $C^n$. Some of the problems below go into more detail about the $k$-Zariski topology.

**Lemma 21.11** The sets $\{Z(S) : S \subseteq k[x_1,\dots,x_n]\}$ are the closed sets of a topology on $C^n$; that is,

1. $C^n = Z(\{0\})$ and $\varnothing = Z(\{1\})$.
2. If $S$ and $T$ are subsets of $k[x_1,\dots,x_n]$, then $Z(S) \cup Z(T) = Z(ST)$, where $ST = \{fg : f \in S, t \in T\}$.
3. If $\{S_\alpha\}$ is an arbitrary collection of subsets of $k[x_1,\dots,x_n]$, then $\bigcap_\alpha Z(S_\alpha) = Z(\bigcup_\alpha S_\alpha)$.

**Proof.** The first two parts are clear from the definitions. For the third, let $P \in Z(S)$. Then $f(P) = 0$ for all $f \in S$, so $(fg)(P) = 0$ for all $fg \in ST$. Thus, $Z(S) \subseteq Z(ST)$. Similarly, $Z(T) \subseteq Z(ST)$, so $Z(S) \cup Z(T) \subseteq Z(ST)$. For the reverse inclusion, let $P \in Z(ST)$. If $P \notin Z(S)$, then there is an $f \in S$ with $f(P) \ne 0$. If $g \in T$, then $0 = (fg)(P) = f(P)g(P)$, so $g(P) = 0$, which forces $P \in Z(T)$. Thus, $Z(ST) \subseteq Z(S) \cup Z(T)$. This proves that $Z(S) \cup Z(T) = Z(ST)$.

For the fourth part, the inclusion $Z(\bigcup_\alpha S_\alpha) \subseteq \bigcap_\alpha Z(S_\alpha)$ follows from part 1. For the reverse inclusion, take $P \in \bigcap_\alpha Z(S_\alpha)$. Then $P \in Z(S_\alpha)$ for each $\alpha$, so $f(P) = 0$ for each $f \in S_\alpha$. Thus, $P \in Z(\bigcup_\alpha S_\alpha)$. $\square$

**Example 21.12** Let $GL_n(C)$ be the set of all invertible $n \times n$ matrices over $C$. Then $GL_n(C)$ is the complement of the zero set $Z(\det)$, so $GL_n(C)$ is an open subset of $C^{n^2}$ with respect to the $k$-Zariski topology. We can view $GL_n(C)$ differently in order to view it as an algebraic variety. Let $t$ be a new variable, and consider the zero set $Z(t\det - 1)$ in $C^{n^2+1}$. Then the map $GL_n(C) \to Z(t\det - 1)$ given by $P \mapsto (P, 1/\det(P))$ is a bijection between $GL_n(C)$ and $Z(t\det - 1)$. If we introduce the definition of a morphism of varieties, this map would turn out to be an isomorphism. In Problem 10, we give the definition of a morphism between varieties.

Starting with an ideal $I$ of $k[x_1,\dots,x_n]$, we obtain a $k$-variety $Z(I)$. We can reverse this process and obtain an ideal from a $k$-variety.

**Definition 21.13** Let $V \subseteq C^n$. The ideal of $V$ is
$$
\mathcal{I}(V) = I(V) = \{f \in k[x_1,\dots,x_n] : f(P) = 0 \text{ for all } P \in V\}.
$$

The coordinate ring of $V$ is the ring $k[V] = k[x_1,\dots,x_n]/I(V)$.

If $f \in k[x_1,\dots,x_n]$ and $V \subseteq C^n$, then $f$ can be viewed as a function from $V$ to $k$. Two polynomials $f$ and $g$ yield the same polynomial function on $V$ if and only if $f - g \in I(V)$; hence, we see that $k[V]$ can be thought of as the ring of polynomial functions on $V$.

One of the main techniques of algebraic geometry is to translate back and forth from geometric properties of varieties to algebraic properties of their coordinate rings. We state Hilbert's Nullstellensatz below, the most fundamental result that connects the geometry of varieties with the algebra of polynomial rings.

Let $A$ be a commutative ring, and let $I$ be an ideal of $A$. Then the radical of $I$ is the ideal
$$
\sqrt{I} = \{f \in A : f^r \in I \text{ for some } r \in \mathbb{N}\}.
$$

If $I = \sqrt{I}$, then $I$ is said to be a radical ideal. A standard result of commutative ring theory is that $\sqrt{I}$ is the intersection of all prime ideals of $A$ containing $I$ (see Problem 2).

**Lemma 21.14** If $V$ is any subset of $C^n$, then $I(V)$ is a radical ideal of $k[x_1,\dots,x_n]$.

**Proof.** Let $f \in k[x_1,\dots,x_n]$ with $f^r \in I(V)$ for some $r$. Then $f^r(P) = 0$ for all $P \in V$. But $f^r(P) = (f(P))^r$, so $f(P) = 0$. Therefore, $f \in I(V)$; hence, $I(V)$ is equal to its radical, so $I(V)$ is a radical ideal. $\square$

**Lemma 21.15** The following statements are some properties of ideals of subsets of $C^n$.

1. If $X$ and $Y$ are subsets of $C^n$ with $X \subseteq Y$, then $I(Y) \subseteq I(X)$.
2. If $J$ is a subset of $k[x_1,\dots,x_n]$, then $J \subseteq I(Z(J))$.
3. If $V \subseteq C^n$, then $V \subseteq Z(I(V))$, and $V = Z(I(V))$ if and only if $V$ is a $k$-variety.

**Proof.** The first two parts of the lemma are clear from the definition of $I(V)$. For the third, let $V$ be a subset of $C^n$. If $f \in I(V)$, then $f(P) = 0$ for all $P \in V$, so $P \in Z(I(V))$, which shows that $V \subseteq Z(I(V))$. Suppose that $V = Z(S)$ for some subset $S \in k[x_1,\dots,x_n]$. Then $S \subseteq I(V)$, so $Z(I(V)) \subseteq Z(S) = V$ by the previous lemma. Thus, $V = Z(I(V))$. Conversely, if $V = Z(I(V))$, then $V$ is a $k$-variety by definition. $\square$

In the lemma above, if $J$ is an ideal of $k[x_1,\dots,x_n]$, we have $J \subseteq I(Z(J))$, and actually $\sqrt{J} \subseteq I(Z(J))$, since $I(Z(J))$ is a radical ideal. The following theorem, Hilbert's Nullstellensatz, shows that $I(Z(J))$ is always equal to $\sqrt{J}$.

**Theorem 21.16 (Nullstellensatz)** Let $J$ be an ideal of $k[x_1,\dots,x_n]$, and let $V = Z(J)$. Then $I(V) = \sqrt{J}$.

**Proof.** For a proof of the Nullstellensatz, see Atiyah and Macdonald [2, p. 85] or Kunz [19, p. 16]. $\square$

**Corollary 21.17** There is a 1-1 inclusion reversing correspondence between the $k$-varieties in $C^n$ and the radical ideals of $k[x_1,\dots,x_n]$ given by $V \mapsto I(V)$. The inverse correspondence is given by $J \mapsto Z(J)$.

**Proof.** If $V$ is a $k$-variety, then the previous lemma shows that $V = Z(I(V))$. Also, the Nullstellensatz shows that if $I$ is a radical ideal, then $J = I(Z(J))$. These two formulas tell us that the association $V \mapsto I(V)$ is a bijection and that its inverse is given by $J \mapsto Z(J)$. $\square$

Another consequence of the Nullstellensatz is that any proper ideal defines a nonempty variety. Suppose that $I$ is a proper ideal of $k[x_1,\dots,x_n]$. If $V = Z(J)$, then the Nullstellensatz shows that $I(V) = \sqrt{J}$. Since $J$ is a proper ideal, the radical $\sqrt{J}$ is also proper. However, if $Z(J) = \varnothing$, then $I(Z(J)) = k[x_1,\dots,x_n]$. Thus, $Z(J)$ is nonempty.

**Example 21.18** Let $f \in k[x_1,\dots,x_n]$ be a polynomial, and let $V = Z(f)$. If $f = p_1^{r_1} \cdots p_t^{r_t}$ is the irreducible factorization of $f$, then $I(V) = \sqrt{(f)}$ by the Nullstellensatz. However, we show that $\sqrt{(f)} = (p_1 \cdots p_t)$ for, if $g \in \sqrt{(f)}$, then $g^m = fh$ for some $h \in k[x_1,\dots,x_n]$ and some $m > 0$. Each $p_i$ then divides $g^m$; hence, each $p_i$ divides $g$. Thus, $g \in (p_1 \cdots p_t)$. For the reverse inclusion, $p_1 \cdots p_t \in \sqrt{(f)}$, since if $r$ is the maximum of the $r_i$, then $(p_1 \cdots p_t)^r \in (f)$.

If $f \in k[x_1,\dots,x_n]$ is irreducible, then $\sqrt{(f)} = (f)$, so the coordinate ring of $Z(f)$ is $k[x_1,\dots,x_n]/(f)$. For example, the coordinate ring of $Z(y - x^2) \subseteq C^2$ is $k[x,y]/(y - x^2)$. This ring is isomorphic to the polynomial ring $k[t]$. Similarly, the coordinate ring of $Z(y^2 - x^3)$ is $k[x,y]/(y^2 - x^3)$. This ring is isomorphic to the subring $k[t^2, t^3]$ of the polynomial ring $k[t]$; an isomorphism is given by sending $x$ to $t^2$ and $y$ to $t^3$.

**Definition 21.19** Let $V$ be a $k$-variety. Then $V$ is said to be irreducible if $V$ is not the union of two proper $k$-varieties.

Every $k$-variety can be written as a finite union of irreducible subvarieties, as Problem 7 shows. This fact reduces many questions about varieties to the case of irreducible varieties.

**Example 21.20** Let $V$ be an irreducible $k$-variety. By taking complements, we see that the definition of irreducibility is equivalent to the condition that any two nonempty open sets have a nonempty intersection. Therefore, if $U$ and $U'$ are nonempty open subsets of $V$, then $U \cap U' \ne \varnothing$. One consequence of this fact is that any nonempty open subset of $V$ is dense in $V$, as we now prove. If $U$ is a nonempty open subset of $V$, and if $C$ is the closure of $U$ in $V$, then $U \cap (V - C) = \varnothing$. The set $V - C$ is open, so one of $U$ or $V - C$ is empty. Since $U$ is nonempty, this forces $V - C = \varnothing$, so $C = V$. But then the closure of $U$ in $V$ is all of $V$, so $U$ is dense in $V$. This unusual fact about the Zariski topology is used often in algebraic geometry.

**Proposition 21.21** Let $V$ be a $k$-variety. Then $V$ is irreducible if and only if $I(V)$ is a prime ideal, if and only if the coordinate ring $k[V]$ is an integral domain.

**Proof.** First suppose that $V$ is irreducible. Let $f,g \in k[x_1,\dots,x_n]$ with $fg \in I(V)$. Then $I = I(V) + (f)$ and $J = I(V) + (g)$ are ideals of $k[x_1,\dots,x_n]$ containing $I(V)$; hence, their zero sets $Y = Z(I)$ and $Z = Z(J)$ are contained in $Z(I(V)) = V$. Moreover, $IJ \subseteq I(V)$, since $fg \in I(V)$, so $Y \cup Z = Z(IJ)$ contains $V$. This forces $V = Y \cup Z$, so either $Y = V$ or $Z = V$, since $V$ is irreducible. If $Y = V$, then $I \subseteq I(Y) = I(V)$, and if $Z = V$, then $J \subseteq I(Z) = I(V)$. Thus, either $f \in I(V)$ or $g \in I(V)$, so $I(V)$ is a prime ideal of $k[x_1,\dots,x_n]$.

Conversely, suppose that $I(V)$ is prime. If $V = Y \cup Z$ for some $k$-varieties $Y$ and $Z$, let $I = I(Y)$ and $J = I(Z)$. Then $IJ \subseteq I(Y \cup Z) = I(V)$, so either $I \subseteq I(V)$ or $J \subseteq I(V)$. This means that $V \subseteq Z(I) = Y$ or $V \subseteq Z(J) = Z$. Therefore, $Y = V$ or $Z = V$, so $V$ is irreducible. $\square$

In Section 22, we will obtain finitely generated field extensions by considering the quotient field of the coordinate ring of an irreducible $k$-variety as an extension of $k$. We finish this section with a brief discussion of the dimension of a variety. In Theorem 22.5, we will see that the dimension of an irreducible variety $V$ is equal to the transcendence degree over $k$ of the quotient field of $k[V]$.

**Definition 21.22** Let $V$ be a $k$-variety. Then the dimension of $V$, denoted $\dim(V)$, is the largest integer $n$ such that there is a chain
$$
Y_0 \subset Y_1 \subset \cdots \subset Y_n \subseteq V
$$
of irreducible $k$-subvarieties of $V$.

While it is not obvious, there is indeed a maximum among the lengths of chains of irreducible subvarieties of any variety. This is a consequence of Theorem 22.5. In fact, if $V \subseteq C^n$, then $\dim(V) \le n$.

The definition above is purely topological. However, the dimension of a $k$-variety can be determined with purely algebraic methods. One way to determine the dimension of a $k$-variety is given in the proposition below.

**Proposition 21.23** Let $V$ be a $k$-variety. Then $\dim(V)$ is the maximum nonnegative integer $n$ such that there is a chain
$$
P_0 \subset P_1 \subset \cdots \subset P_n
$$
of prime ideals of $k[V]$.

**Proof.** Suppose that $Y_0 \subset Y_1 \subset \cdots \subset Y_n \subseteq V$ is a chain of closed irreducible subsets of $V$. Then
$$
I(V) \subseteq I(Y_n) \subset \cdots \subset I(Y_0)
$$
is a chain of prime ideals of $k[x_1,\dots,x_n]$ by the previous proposition. Moreover, the inclusions are proper by the Nullstellensatz. By taking images in the quotient ring $k[V] = k[x_1,\dots,x_n]/I(V)$, we get a chain of prime ideals of length $n$. However, if we have a chain of prime ideals of $k[V]$ of length $n$, then we get a chain $I(V) \subseteq Q_0 \subset Q_1 \subset \cdots \subset Q_n$ of prime ideals of $k[x_1,\dots,x_n]$. Taking zero sets gives a chain
$$
Z(Q_n) \subset \cdots \subset Z(Q_0) \subseteq Z(I(V)) = V
$$
of irreducible $k$-subvarieties in $V$. The maximum length of a chain of irreducible $k$-subvarieties of $V$ is then the maximum length of a chain of prime ideals of $k[V]$. $\square$

If $A$ is a commutative ring, then the supremum of integers $n$ such that there is a chain of prime ideals of $A$ of length $n$ is called the dimension of $A$. The proposition says that $\dim(V) = \dim(k[V])$ if $V$ is a $k$-variety. Calculating the dimension of a $k$-variety by either the definition or by use of the proposition above is not easy. Instead, we will use Theorem 22.5 to calculate the dimension of a variety.
