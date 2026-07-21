# Appendix D. Vector Spaces（向量空间）

The use of the theory of vector spaces is a key element in field theory. In this appendix, we review the concepts that we will need. For a more detailed account of vector spaces, see Herstein [12] or Walker [27].

## 1 Bases and Dimension

The most important property of vector spaces is the existence of a basis. Let $V$ be a vector space over a field $F$. If $v_1, \ldots, v_n \in V$, any element of the form $\alpha_1 v_1 + \cdots + \alpha_n v_n$ is called a *linear combination* of the $v_i$. A subset $B$ of $V$ is said to be *linearly independent* over $F$ provided that whenever $\alpha_1 v_1 + \cdots + \alpha_n v_n = 0$, with $\alpha_i \in F$ and $v_i \in B$, then each $\alpha_i = 0$. Therefore, $B$ is linearly independent, provided that the only way to write $0$ as a linear combination of elements of $B$ is in the trivial way, where all coefficients are $0$. If a set is not linearly independent, it is said to be *linearly dependent*. For example, any singleton set $B = \{v\}$ with $v \neq 0$ is linearly independent. By definition, the empty set $\varnothing$ is linearly independent. Any set containing $0$ is dependent.

If $B$ is a subset of $V$, then $B$ is said to *span* $V$ if every element of $V$ is a linear combination of elements of $B$. For example, if $V = F^n$, the set of all $n$-tuples of elements of $F$, then the set

$$\{(1,0,\ldots,0), (0,1,0,\ldots,0), \ldots, (0,\ldots,0,1)\}$$

spans $F^n$. The set $F^n$ also spans $F^n$. In fact, if $B$ spans a vector space $V$, then any set containing $B$ also spans $V$.

We can now define a basis. If $V$ is an $F$-vector space, a set $B$ is a *basis* for $V$ if $B$ is linearly independent and spans $V$. For finitely generated vector spaces (i.e., those spaces that are spanned by a finite set), proofs of the existence of a basis are standard. However, a use of Zorn's lemma shows that any vector space has a basis. Because this proof is less standard, we give it here. Moreover, this proof is a good example of how Zorn's lemma is used in algebra.

**Theorem 1.1** *Let $V$ be a vector space over a field $F$.*

1. *There exists a basis for $V$.*
2. *If $C$ is any linearly independent set in $V$, then $C$ is contained in a basis of $V$.*
3. *If $D$ is any spanning set for $V$, then $D$ contains a basis of $V$.*
4. *If $C \subseteq D$ are subsets of $V$ such that $C$ is linearly independent and $D$ spans $V$, then there is a basis $B$ with $C \subseteq B \subseteq D$.*

**Proof.** We give a proof for part 4. Parts 2 and 3 follow from part 4 by setting $C = \varnothing$ and $D = V$, respectively. Part 1 follows from part 4 by setting $C = \varnothing$ and $D = V$. Suppose that $C \subseteq D$ such that $C$ is linearly independent and $D$ spans $V$. Let

$$S = \{E : C \subseteq E \subseteq D,\ E \text{ is linearly independent}\}.$$

The set $S$ is nonempty, since $C \in S$, and it is partially ordered by inclusion. We check that the hypotheses of Zorn's lemma hold. Let $T$ be a chain in $S$, and let $A = \bigcup T$, the union of all sets in $T$. Since each set in $T$ is contained in $D$ and contains $C$, the same is true for $A$. Therefore, $A \in S$. Moreover, $A$ is clearly an upper bound for $T$, since every set in $T$ is contained in $A$. By Zorn's lemma, there is a maximal element $B$ of $S$. We claim that $B$ is a basis. Since $B \in S$, we see that $B$ is linearly independent. To show that $B$ spans $V$, let $W$ be the span of $B$. Since $D$ spans $V$, it is sufficient to show that each $v \in D$ is also in $W$. Suppose that there is a $v \in D$ with $v \notin W$. Then $v$ is not a linear combination of vectors in $B$, so $B \cup \{v\}$ is linearly independent. Moreover, $B \cup \{v\} \subseteq D$. However, this contradicts the maximality of $B$; hence, $v \in W$. Therefore, $B$ does span $V$, finishing the proof.
□

**Theorem 1.2** *Let $V$ be an $F$-vector space. If $B_1$ and $B_2$ are bases for $V$, then $B_1$ and $B_2$ have the same cardinality.*

**Proof.** We prove only part of this theorem, taking for granted the following statement: If $V$ is spanned by a finite set $D$ and if $C$ is any linearly independent set in $V$, then $|C| \leq |D|$. A proof of this fact is a standard step in showing the uniqueness of the size of a basis for finite dimensional vector spaces.

Armed with this fact, we prove the theorem for infinite dimensional vector spaces. If one of $B_1$ or $B_2$ is finite, the fact above forces both to be finite. So, suppose that both are infinite. For each $v_i \in B_2$, write $v_i = \sum_j \alpha_{ij} w_j$ with the $w_j \in B_1$. Let $\mathcal{J}_i = \{w_j : \alpha_{ij} \neq 0\}$, a finite subset of $B_1$. Let $\mathcal{K} = \bigcup_i \mathcal{J}_i$, a subset of $B_1$. Since each element of $B_2$ is a linear combination of elements of $\mathcal{K}$, the vector space $V$ is spanned by $\mathcal{K}$. Since $\mathcal{K} \subseteq B_1$ and $B_1$ is a basis for $V$, this forces $\mathcal{K} = B_1$. By Theorem 2.1 of Appendix B, $|\mathcal{K}| \leq \aleph_0 |B_2|$, since $|\mathcal{J}_i| \leq \aleph_0$ for each $i$, and the union is over all elements of $B_2$. But $B_2$ is infinite; hence, $\aleph_0 |B_2| = |B_2|$. Therefore, $|B_1| = |\mathcal{K}| \leq |B_2|$. Reversing the roles of $B_1$ and $B_2$ gives the other inequality, proving that $|B_1| = |B_2|$.
□

This theorem allows us to define the dimension of a vector space. The *dimension* of a vector space $V$ is the cardinality of any basis of $V$. By the theorem, this is a well-defined invariant of the vector space. If $V$ has a finite basis, then $V$ is said to be a *finite dimensional* vector space.

## 2 Linear Transformations

Let $V$ and $W$ be vector spaces over a field $F$. A *linear transformation* from $V$ to $W$ is an $F$-vector space homomorphism from $V$ to $W$. Let $\mathrm{hom}_F(V, W)$ be the set of all linear transformations from $V$ to $W$. Then $\mathrm{hom}_F(V, W)$ is an $F$-vector space, where addition is defined by $(S + T)(v) = S(v) + T(v)$ and scalar multiplication by $(\alpha T)(v) = \alpha(T(v))$. It is straightforward to prove that $\mathrm{hom}_F(V, W)$ is indeed a vector space with these operations.

If $W = V$, then $\mathrm{hom}_F(V, V)$ can be given a multiplication. Define multiplication by $S \cdot T = S \circ T$, the usual function composition. It is not hard to show that $S \circ T$ is again a linear transformation and that $\mathrm{hom}_F(V, V)$ is an associative ring under these operations. We can give a more concrete description of this ring using bases. Suppose that $V$ is a finite dimensional vector space and that $\{v_1, \ldots, v_n\}$ is a basis for $V$. Let $T \in \mathrm{hom}_F(V, V)$. Then $T(v_j) = \sum_i \alpha_{ij} v_i$ for some $\alpha_{ij} \in F$. Let $M(T)$ be the $n \times n$ matrix $(\alpha_{ij})$. A straightforward calculation shows that

$$M(S + T) = M(S) + M(T),$$
$$M(S \circ T) = M(S) \cdot M(T),$$
$$M(\alpha T) = \alpha M(T).$$

Therefore, the map $\theta : T \mapsto M(T)$ is a ring and vector space homomorphism from $\mathrm{hom}_F(V, V)$ to $M_n(F)$, the ring of $n \times n$ matrices over $F$. Moreover, we see that $\theta$ is a bijection. To prove injectivity, suppose that $M(T)$ is the zero matrix. Then $T(v_j) = 0$ for each $j$. Since every element of $V$ is a linear combination of the $v_j$, this forces $T$ to be the zero map. Therefore, $\theta$ is injective. To show that $\theta$ is surjective, take $(\alpha_{ij}) \in M_n(F)$. It is an easy calculation to show that the formula

$$S\left(\sum_j a_j v_j\right) = \sum_j a_j \left(\sum_i \alpha_{ij} v_i\right)$$

gives a well-defined linear transformation with $M(S) = (\alpha_{ij})$. This shows that $\theta$ is surjective. Therefore, $\mathrm{hom}_F(V, V) \cong M_n(F)$. In fact, if $u_1, \ldots, u_m$ is any collection of elements of $V$, then there is a uniquely determined linear transformation $\varphi : V \to V$ given by $\varphi(v_i) = u_i$. On a general element of $V$, the map $\varphi$ is given by $\varphi(\sum_j a_j v_j) = \sum_j a_j u_j$. Thus, linear transformations can be described in terms of a basis. As a vector space, $\mathrm{hom}_F(V, V)$ has dimension $n^2$. This can be seen by showing that the set $\{e_{ij} : 1 \leq i,j \leq n\}$ of "matrix units" is a basis for $M_n(F)$, where $e_{ij}$ is the matrix of zeros, except for a $1$ in the $(i,j)$ entry.

The isomorphism $\theta : \mathrm{hom}_F(V, V) \cong M_n(F)$ does depend on the choice of basis. Given another basis $\{w_j\}$ of $V$, we obtain another isomorphism $\phi : \mathrm{hom}_F(V, V) \cong M_n(F)$. How do these isomorphisms differ? Let $S : V \to V$ be the linear transformation given by $S(v_j) = w_j$, and let $B$ be the matrix $M(S)$ calculated with respect to the basis $\{v_i\}$. If $T \in \mathrm{hom}_F(V, V)$, we write $M(T)_\mathcal{V}$ and $M(T)_\mathcal{W}$, respectively, for the matrices obtained from $T$ by using the bases $\mathcal{V} = \{v_i\}$ and $\mathcal{W} = \{w_i\}$, respectively. A matrix calculation shows that

$$M(T)_\mathcal{W} = B^{-1} M(T)_\mathcal{V} B.$$

This relation between matrix representations of linear transformations using different bases allows us to define the determinant and trace of a linear transformation. Let $T \in \mathrm{hom}_F(V, V)$, and let $A = M(T)$ be the matrix representation of $T$ with respect to some basis. Then we define the determinant and trace of $T$ by $\det(T) = \det(A)$ and $\mathrm{Tr}(T) = \mathrm{Tr}(A)$, respectively. These definitions are well defined, since $\det(B^{-1}AB) = \det(A)$ and $\mathrm{Tr}(B^{-1}AB) = \mathrm{Tr}(A)$ for any invertible matrix $B$.

The final result we describe in this section is the Cayley–Hamilton theorem. Let $A \in M_n(F)$. The *characteristic polynomial* $\chi_A(x)$ of $A$ is the polynomial $\det(xI - A)$, where $I$ is the $n \times n$ identity matrix. This is a monic polynomial of degree $n$. For instance, if $A = \begin{pmatrix} a & b \\ c & d \end{pmatrix}$, then

$$\chi_A(x) = x^2 - (a+d)x + (ad - bc) = x^2 - \mathrm{Tr}(A)x + \det(A).$$

Since

$$\det(xI - B^{-1}AB) = \det(B^{-1}(xI - A)B) = \det(xI - A),$$

we can define the characteristic polynomial of a linear transformation by $\chi_T(x) = \chi_A(x)$ if $A$ is any matrix representation of $T$.

Let $f(x) \in F[x]$, and write $f(x) = \sum_i a_i x^i$. We can evaluate $f$ at $A$ by setting $f(A) = \sum_i a_i A^i$, where $A^0 = I$. If $A$ is an $n \times n$ matrix, then there is a nonzero polynomial $f$ with $f(A) = 0$; to show the existence of such an $f$, the $n^2 + 1$ elements $I, A, \ldots, A^{n^2}$ form a dependent set in $M_n(F)$, since this vector space has dimension $n^2$. Therefore, there are $\alpha_i \in F$ with $\sum_{i=0}^{n^2} \alpha_i A^i = 0$. Letting $f(x) = \sum_i \alpha_i x^i$ proves our claim. Given a matrix $A$, the *minimal polynomial* of $A$ is the monic polynomial $p(x)$ of least degree such that $p(A) = 0$. The Cayley–Hamilton theorem relates the characteristic and minimal polynomials of a matrix.

**Theorem 2.1 (Cayley–Hamilton)** *Let $A$ be an $n \times n$ matrix and $\chi_A(x)$ be the characteristic polynomial of $A$. Then $\chi_A(A) = 0$. Moreover, if $p(x)$ is the minimal polynomial of $A$, then $p(x)$ divides $\chi_A(x)$, and these two polynomials have the same irreducible divisors.*

**Proof.** A proof of this result can be found in most nonelementary books on linear algebra. We give a proof that uses the structure theorem for finitely generated modules over a PID and the rational canonical form. For a proof of this structure theorem and more information on this approach, see Chapter 5 of Walker [27]. Let $V = F^n$, an $n$-dimensional $F$-vector space. By using $A$, we can define an $F[x]$-module structure on $V$ as follows: If $f(x) = \sum_{i=0}^m a_i x^i \in F[x]$, then define $f(x)v = \sum_{i=0}^m a_i A^i v$. We set $A^0 = I$ in order for this definition to make sense. It is elementary to show that $V$ is an $F[x]$-module, and $V$ is finitely generated as an $F[x]$-module, since it is generated as a module by a vector space basis. Therefore, there are elements $v_1, \ldots, v_t \in V$ and polynomials $f_1, \ldots, f_t \in F[x]$ such that

$$V = \bigoplus_{i=1}^t F[x]v_i \cong \bigoplus_{i=1}^t F[x]/(f_i).$$

Recall that $\mathrm{ann}(v_i) = \{f \in F[x] : f v_i = 0\}$ and that $\mathrm{ann}(v_i) = (f_i)$. Furthermore, we may assume that $f_i$ divides $f_{i+1}$ for each $i$. We will have proved the theorem once we verify that $f_t$ is the minimal polynomial of $A$ and that $f_1 \cdots f_t$ is the characteristic polynomial of $A$. From the description of $(f_i) = \mathrm{ann}(v_i)$, we see that $f_i v_i = 0$ for each $i$, so $f_t v = 0$ for all $v \in V$. By the definition of scalar multiplication, the nullspace of $f_t(A)$ is $F^n$, so $f_t(A) = 0$. Therefore, $p$ divides $f_t$. For the reverse inclusion, since $p(A) = 0$, we see that $p v_t = 0$, so $p \in \mathrm{ann}(v_t) = (f_t)$. This gives the reverse divisibility, so $f_t = p$. This verifies our first claim. For the second, we use the rational canonical form of $A$. There is an invertible matrix $B$ such that $BAB^{-1}$ is the rational canonical form of $A$. The rational canonical form is in block matrix form

$$\begin{pmatrix} C_1 & 0 & \cdots & 0 \\ 0 & C_2 & \cdots & 0 \\ \vdots & \vdots & \ddots & \vdots \\ 0 & 0 & \cdots & C_t \end{pmatrix},$$

where $C_i$ is the companion matrix to $f_i$; if $f_i = x^s + \sum_{j<s} b_j x^j$, then

$$C_i = \begin{pmatrix} 0 & \cdots & 0 & -b_0 \\ 1 & 0 & \cdots & -b_1 \\ \vdots & \ddots & \ddots & \vdots \\ 0 & \cdots & 1 & -b_{s-1} \end{pmatrix}.$$

Moreover, $\det(xI - C_i) = f_i$; this can be seen by expanding the determinant along the first row and using induction on $\deg(f_i)$. Thus,

$$\det(xI - A) = \det(B(xI - A)B^{-1}) = \det(xI - BAB^{-1}) = f_1 \cdots f_t.$$

This proves the second claim, so the theorem is proved.
□

## 3 Systems of Linear Equations and Determinants

We give here a brief discussion of solving systems of linear equations. A system

$$a_{11} x_1 + a_{12} x_2 + \cdots + a_{1m} x_m = b_1,$$
$$a_{21} x_1 + a_{22} x_2 + \cdots + a_{2m} x_m = b_2,$$
$$\vdots$$
$$a_{n1} x_1 + a_{n2} x_2 + \cdots + a_{nm} x_m = b_n$$

can be represented as a matrix equation $AX = B$, where $A = (a_{ij})$, $X = (x_i)$, and $B = (b_i)$. Multiplication by $A$ determines a linear transformation $T : F^m \to F^n$. The existence of a solution is equivalent to the condition that $B$ is in the image of $T$. The *rank* of $A$, denoted $\mathrm{rank}(A)$, is the dimension of the image $\{Av : v \in F^m\}$ of $T$, a subspace of $F^n$. The rank of $A$ is an integer no larger than $\min\{n,m\}$. If $\mathrm{rank}(A) = n$, then the system above has a solution for every $B$. More generally, the image of $T$ is spanned by the columns of $A$; hence, the image of $T$ is the column space of $A$. Therefore, $\mathrm{rank}(A)$ is equal to the dimension of the column space of $A$. A fundamental fact about rank is that the rank of $A$ is also equal to the dimension of the row space of $A$, the subspace of $F^m$ spanned by the rows of $A$. For a proof of this, see Theorem 3.4.16 of [27].

Suppose that $A$ is an $n \times n$ matrix. If $\det(A) \neq 0$, then $A$ is an invertible matrix, and so the system $AX = B$ has a unique solution $X = A^{-1}B$ for any $B$. Therefore, $\mathrm{rank}(A) = n$. If $\det(A) = 0$, then the system $AX = B$ cannot be solved for every $B$; to see this, suppose that there are $X_i$ with $AX_i = e_i$, where $\{e_i\}$ is a basis for $F^n$. Then the matrix $C$ whose $i$th column is $X_i$ is an inverse of $A$; hence, $\det(A) \neq 0$, which is false. Therefore, $\mathrm{rank}(A) < n$. Thus, the determinant function can help us to determine when square systems of linear equations can be solved.

## 4 Tensor Products

In Section 20, we make use of the tensor product of vector spaces. For readers unfamiliar with tensor products, we give the basics here. We only consider tensor products of vector spaces over a field, the only case that we need in Section 20. In order to work with tensor products, we need the concept of a bilinear map. Let $U$, $V$, and $W$ be vector spaces over a field $F$. A *bilinear map* from $U \times V$ to $W$ is a function $B : U \times V \to W$ such that

$$B(au_1 + bu_2, v) = a B(u_1, v) + b B(u_2, v),$$
$$B(u, av_1 + bv_2) = a B(u, v_1) + b B(u, v_2).$$

for all scalars $a, b$, all $u, u_1, u_2 \in U$ and all $v, v_1, v_2 \in V$; that is, a bilinear map is linear in each component. To say this in another way, for all $u \in U$ and $v \in V$, the functions $B_u : V \to W$ and $B_v : U \to W$ given by

$$B_u(v) = B(u, v),$$
$$B_v(u) = B(u, v)$$

are linear transformations.

The tensor product $U \otimes_F V$ can be defined as follows. Let $M$ be the $F$-vector space with basis $\{(u,v) \in U \times V\}$; that is, for each pair $(u,v)$ in $U \times V$, there is a corresponding basis vector in $M$. Let $N$ be the subspace spanned by

$$(au_1 + bu_2, v) - a(u_1,v) - b(u_2,v),$$
$$(u, av_1 + bv_2) - a(u,v_1) - b(u,v_2),$$
$$(au, v) - a(u,v),$$
$$(u, av) - a(u,v)$$

for all $a, b \in F$, all $u_1, u_2 \in U$, and all $v_1, v_2 \in V$. Then $U \otimes_F V$ is defined to be $M/N$. We will denote by $u \otimes v$ the coset $(u,v) + N$ in $U \otimes_F V$. Note that since the $(u,v)$ form a basis for $M$, each element of $U \otimes_F V$ is a sum of elements of the form $u \otimes v$. Looking at the generators of $N$, we obtain the following relations in $U \otimes_F V$:

$$(au_1 + bu_2) \otimes v = a(u_1 \otimes v) + b(u_2 \otimes v),$$
$$u \otimes (av_1 + bv_2) = a(u \otimes v_1) + b(u \otimes v_2),$$
$$au \otimes v = a(u \otimes v),$$
$$u \otimes av = a(u \otimes v).$$

Define $B : U \times V \to U \otimes_F V$ by $B(u,v) = u \otimes v$. By the definition of tensor products, $B$ is a bilinear map.

It is not terribly convenient to work with the construction of tensor products. The tensor product of $U$ and $V$ is best thought of in terms of the universal mapping property it satisfies.

**Proposition 4.1** *Let $U$ and $V$ be $F$-vector spaces, and let $B : U \times V \to U \otimes_F V$ be the canonical bilinear map defined by $B(u,v) = u \otimes v$. If $W$ is an $F$-vector space and $C : U \times V \to W$ is a bilinear map, then there is a unique linear transformation $\varphi : U \otimes_F V \to W$ such that $C = \varphi \circ B$; that is, the following diagram commutes:*

$$\begin{CD}
U \times V @>C>> W \\
@VB VV @| \\
U \otimes_F V @<\varphi<< W
\end{CD}$$

**Proof.** Let $M$ and $N$ be the vector spaces defined above in the construction of the tensor product. There is a unique linear transformation $f : M \to W$ with $f((u,v)) = C(u,v)$. The bilinearity of $C$ implies precisely that the generators of $N$ lie in $\ker(f)$. Thus, there is a linear transformation $\varphi : M/N \to W$ given by $\varphi((u,v) + N) = C(u,v)$. In other words, $\varphi(u \otimes v) = C(u,v)$. Since $B(u,v) = u \otimes v$, we see that $C = \varphi \circ B$. Moreover, this definition of $\varphi$ is forced upon us by the restriction that $C = \varphi \circ B$; if $\sigma : U \otimes_F V \to W$ satisfies $C = \sigma \circ B$, then $\sigma(B(u,v)) = C(u,v)$, so $\sigma(u \otimes v) = C(u,v)$. Thus, $\sigma$ and $\varphi$ agree on the generators of $U \otimes_F V$, so $\sigma = \varphi$.
□

Perhaps the most fundamental property of tensor products of vector spaces, other than the universal mapping property, is that the dimension of $U \otimes_F V$ is equal to $\dim_F(U) \cdot \dim_F(V)$. This is not a trivial fact to prove, which is the reason for the form of the next result.

**Proposition 4.2** *Let $U$ and $V$ be finite dimensional $F$-vector spaces. Then $V \otimes_F \mathrm{hom}_F(U, F) \cong \mathrm{hom}_F(U, V)$. Consequently, $\dim_F(U \otimes_F V) = \dim_F(U) \cdot \dim_F(V)$.*

**Proof.** Define a function $C : V \times \mathrm{hom}_F(U,F) \to \mathrm{hom}_F(U,V)$ by

$$C(v, f)(u) = f(u)v.$$

We leave it to the reader to verify that $C(v,f)$ is indeed a linear transformation and that $C$ is bilinear. By the universal mapping property, we get a linear transformation $\varphi : V \otimes_F \mathrm{hom}_F(U,F) \to \mathrm{hom}_F(U,V)$ given on generators by $\varphi(v \otimes f) = C(v,f)$.

Let $\{u_1, \ldots, u_n\}$ be a basis for $U$, and let $\{v_1, \ldots, v_m\}$ be a basis for $V$. Then the standard basis for $\mathrm{hom}_F(U,V)$ is $\{T_{ij}\}$, where

$$T_{ij}(u_k) = \begin{cases} v_j & \text{if } k = i, \\ 0 & \text{if } k \neq i. \end{cases}$$

Taking the dual basis $\{\widehat{u}_1, \ldots, \widehat{u}_n\}$ for $\mathrm{hom}_F(U,F)$ (i.e., $\widehat{u}_i(u_j) = 0$ if $i \neq j$ and $\widehat{u}_i(u_i) = 1$), a short computation shows that $\varphi(v_i \otimes \widehat{u}_j) = T_{ij}$; hence, $\varphi$ is surjective. Another short computation shows that $\{v_i \otimes \widehat{u}_j\}$ is a spanning set for $V \otimes_F \mathrm{hom}_F(U,F)$, which shows that $V \otimes_F \mathrm{hom}_F(U,F)$ has dimension at most $nm$, while the image of $\varphi$ has dimension $nm$. Thus, $\varphi$ is an isomorphism.

To finish the proof, we note that since $U$ and $\mathrm{hom}_F(U,F)$ are isomorphic, the tensor products $V \otimes_F U$ and $V \otimes_F \mathrm{hom}_F(U,F)$ are isomorphic; hence, $V \otimes_F U$ has dimension $nm$. That $U \otimes_F V$ has the same dimension follows by reversing $U$ and $V$ and noting that $\mathrm{hom}_F(V,U)$ is also of dimension $nm$.
□

**Corollary 4.3** *Suppose that $U$ and $V$ are finite dimensional $F$-vector spaces. Let $\{u_1, \ldots, u_n\}$ and $\{v_1, \ldots, v_m\}$ be bases for $U$ and $V$, respectively. Then $\{u_i \otimes v_j : 1 \leq i \leq n, 1 \leq j \leq m\}$ is a basis for $U \otimes_F V$.*

**Proof.** The proof of the previous proposition shows that $\{v_i \otimes \widehat{u}_j\}$ is a basis for $V \otimes_F \mathrm{hom}_F(U,F)$. There is an isomorphism $\sigma : U \otimes_F V \to V \otimes_F \mathrm{hom}_F(U,F)$ given on generators by $\sigma(u \otimes v) \mapsto v \otimes \widehat{u}$ (see Problem 13), and this isomorphism sends $\{u_i \otimes v_j\}$ to the basis $\{v_i \otimes \widehat{u}_j\}$. This forces the set $\{u_i \otimes v_j\}$ to be a basis for $U \otimes_F V$.
□

We will need to use tensor products of vector spaces of arbitrary dimension in Section 20. The following result is an analog of the previous corollary.

**Proposition 4.4** *Let $U$ and $V$ be $F$-vector spaces. If $\{u_i\}_{i \in I}$ is a basis for $U$, then every element of $U \otimes_F V$ has a unique representation as a finite sum $\sum_i u_i \otimes v_i$ for some $v_i \in V$.*

**Proof.** If an element of $U \otimes_F V$ has two different representations in the form above, then subtracting the two yields an equation $\sum_{i=1}^n u_i \otimes v_i = 0$ with not all $v_i = 0$. By reducing the number of terms, if necessary, we may assume that the nonzero $v_i$ in this equation are linearly independent. Let $U_0$ and $V_0$ be the subspaces of $U$ and $V$ generated by the $u_i$ and the $v_i$, respectively. Extend $\{u_i\}$ and $\{v_i\}$ to bases of $U$ and $V$, respectively. There are well-defined linear transformations $\sigma : U \to U_0$ and $\tau : V \to V_0$ with $\sigma(u_i) = u_i$ and $\tau(v_i) = v_i$ for $1 \leq i \leq n$, and all other $u_j$ and $v_j$ mapped to $0$. The universal mapping property of tensor products shows that there is a linear transformation $\varphi : U \otimes_F V \to U_0 \otimes_F V_0$ given on generators by $\varphi(u \otimes v) = \sigma(u) \otimes \tau(v)$. Applying $\varphi$ to the equation $\sum_{i=1}^n u_i \otimes v_i = 0$ yields the same equation in $U_0 \otimes_F V_0$, an impossibility by the previous corollary. This proves the proposition.
□

We may ask why this proposition requires any proof at all, much less the roundabout proof given. The answer is that if we deal with modules over a ring $R$ that is not a field, then it is common to have $R$-modules $M_0 \subseteq M$ and $N_0 \subseteq N$ such that $M_0 \otimes_R N_0$ is not isomorphic to the submodule of $M \otimes_R N$ consisting of elements of the form $\sum_i m_i \otimes n_i$ with $m_i \in M_0$ and $n_i \in N_0$. This pathological behavior happens quite frequently, even over rings such as $\mathbb{Z}$, although it does not occur with vector spaces over a field.

We finish this section by discussing the tensor product of $F$-algebras. If $A$ is simultaneously a ring and an $F$-vector space, then $A$ is called an *$F$-algebra* if

$$\alpha(ab) = (\alpha a)b = a(\alpha b)$$

for all $a, b \in A$ and all $\alpha \in F$; that is, there is a compatibility between the ring multiplication in $A$ and the scalar multiplication. If $A$ and $B$ are $F$-algebras, then we can define a multiplication on $A \otimes_F B$ by the formula

$$\left(\sum_i a_i \otimes b_i\right) \left(\sum_i a'_i \otimes b'_i\right) = \sum_{i,j} a_i a'_j \otimes b_i b'_j. \tag{D.1}$$

On single tensors this says that $(a \otimes b)(a' \otimes b') = aa' \otimes bb'$. It needs to be checked that this formula gives a well-defined operation on $A \otimes_F B$. We leave it to the reader to verify the following result.

**Proposition 4.5** *Let $A$ and $B$ be $F$-algebras. Then Equation D.1 is a well-defined multiplication on $A \otimes_F B$, and with respect to this multiplication, $A \otimes_F B$ is an $F$-algebra.*
