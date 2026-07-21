# Appendix E. Topology（拓扑）

In Section 17 and in the sections that deal with algebraic geometry, we need to use some notions from topology. In this appendix, we give a brief description of these notions.

## 1 Topological Spaces

Let $X$ be a set. A *topology* on $X$ is a collection $\mathcal{T}$ of subsets of $X$ that satisfy the following properties:

1. $X \in \mathcal{T}$ and $\varnothing \in \mathcal{T}$,
2. If $U, V \in \mathcal{T}$, then $U \cap V \in \mathcal{T}$,
3. If $\{U_i\}$ is a collection of subsets of $X$ such that each $U_i \in \mathcal{T}$, then $\bigcup_i U_i \in \mathcal{T}$.

A set with a topology on it is called a *topological space*. The elements of a topology are called *open sets*. A subset $C$ of $X$ is called *closed* if $X - C$ is open. We can define a topology by specifying which are the closed sets. The closed sets of a topology on $X$ satisfy the following properties.

1. Both $X$ and $\varnothing$ are closed sets.
2. If $A$ and $B$ are closed sets, then $A \cup B$ is closed.
3. If $\{A_i\}$ is a collection of closed sets, then $\bigcap_i A_i$ is closed.

These properties follow immediately from the definition of a topology and the DeMorgan laws of set theory.

**Example 1.1** The standard topology on $\mathbb{R}$ is defined as follows. A nonempty subset $U$ of $\mathbb{R}$ is open, provided that for every $x \in U$ there is a positive number $\delta$ such that the open interval $(x-\delta, x+\delta)$ is contained in $U$. An easy exercise shows that this does make $\mathbb{R}$ into a topological space.

**Example 1.2** Recall that a *metric space* is a set $X$ together with a function $d$ from $X \times X$ to the nonnegative real numbers such that (i) $d(x,x) = 0$ for all $x \in X$, and if $d(x,y) = 0$, then $x = y$, (ii) $d(x,y) = d(y,x)$ for all $x, y \in X$, and (iii) $d(x,y) + d(y,z) \geq d(x,z)$ for all $x, y, z \in X$. The function $d$ is called a metric. We can use $d$ to put a topology on $X$. A nonempty subset $U$ of $X$ is defined to be open, provided that for every $x \in U$ there is a positive number $\delta$ such that the open ball

$$B(x,\delta) = \{y \in X : d(x,y) < \delta\}$$

centered at $x$ with radius $\delta$ is contained in $U$. This topology is called the *metric space topology*. The standard topology on $\mathbb{R}$ is an example of this construction. For another example, if $X = \mathbb{R}^n$, then we obtain a topology on $\mathbb{R}^n$, since we have a distance function on $\mathbb{R}^n$.

**Example 1.3** If $X$ is a topological space and $Y$ is a subset of $X$, then we can put a topology on $Y$. We define a subset $V$ of $Y$ to be open if there is an open subset of $X$ with $V = Y \cap U$. It is straightforward to show that $Y$ is indeed a topological space. This topology on $Y$ is called the *subspace topology*.

**Example 1.4** Let $X$ be a set. The *discrete topology* on $X$ is the topology for which every subset of $X$ is open.

**Example 1.5** Let $X$ be a set. We define a topology on $X$ by defining a proper subset of $X$ to be closed if it is finite. The definition of a topology is easy to verify in this case. Note that a nonempty subset is open exactly when its complement is finite. This topology is called the *finite complement topology* on $X$.

There are often more efficient ways to describe a topology than to list all of the closed sets. If $X$ is a topological space, a *basis* for the topology on $X$ is a collection of open subsets such that every open set is a union of elements from the basis. For example, the collection of open intervals forms a basis for the standard topology on $\mathbb{R}$. Similarly, the collection of open balls forms a basis for the metric topology on a metric space. A collection $\mathcal{C}$ of sets forms a basis for a topology on $X$ provided that, given any two sets $U$ and $V$ in $\mathcal{C}$, for any $x \in U \cap V$ there is a set $W$ in $\mathcal{C}$ such that $x \in W$ and $W \subseteq U \cap V$. The proof of this fact is left to Problem 1.

**Example 1.6** Let $R$ be a commutative ring, and let $I$ be an ideal of $R$. The *$I$-adic topology* on $R$ is defined as follows. A nonempty subset of $R$ is open if it is the union of sets of the form $a + I^n$ for some $a \in R$ and $n \geq 0$. We set $I^0 = R$ for this definition. In other words, $\{a + I^n : a \in R, n \geq 0\}$ is a basis for this topology. The only nontrivial thing to verify to see that this does define a topology is that the intersection of two open sets is open. If $\bigcup_i (a_i + I^{n_i})$ and $\bigcup_j (b_j + I^{m_j})$ are open sets, then their intersection is $\bigcup_{i,j} (a_i + I^{n_i}) \cap (b_j + I^{m_j})$. It then suffices to show that $(a + I^n) \cap (b + I^m)$ is open for any $a, b \in R$ and $n, m \geq 0$. To prove this, we can assume that $n \geq m$, so $I^m \subseteq I^n$. If this intersection is empty, there is nothing to prove. If not, let $c \in (a + I^n) \cap (b + I^m)$. Then $c + I^n = a + I^n$ and $c + I^m = b + I^m$, so

$$(a + I^n) \cap (b + I^m) = (c + I^n) \cap (c + I^m) = c + I^m,$$

an open set.

**Example 1.7** Here is an example that arises in algebraic geometry. Let $R$ be a commutative ring, and let $X = \mathrm{spec}(R)$ be the set of all prime ideals of $R$. If $S$ is a subset of $R$, we set $Z(S) = \{P \in X : S \subseteq P\}$. We define the *Zariski topology* on $X$ by defining a subset of $X$ to be closed if it is of the form $Z(S)$ for some subset $S$ of $R$. We verify that this is a topology on $X$. First, note that $R = Z(\{0\})$ and $\varnothing = Z(\{1\})$. Next, it is easy to see that $\bigcup_i Z(S_i) = Z(\bigcap_i S_i)$. Finally, we show that $Z(S) \cup Z(T) = Z(ST)$, where $ST = \{st : s \in S, t \in T\}$. Let $P \in Z(ST)$. If $P \notin Z(S)$, then there is an $s \in S$ with $s \notin P$. Since $st \in P$ for all $t \in T$, we see that $T \subseteq P$, since $P$ is a prime ideal. Thus, $P \in Z(T)$. Therefore, $Z(ST) \subseteq Z(S) \cup Z(T)$. For the reverse inclusion, let $P \in Z(S) \cup Z(T)$. Then $S \subseteq P$ or $T \subseteq P$. Since $P$ is an ideal, in either case we have $ST \subseteq P$, so $P \in Z(ST)$. We point out the relation between the Zariski topology on $\mathrm{spec}(R)$ and the Zariski topology that we define in Section 21. We require some concepts from Section 21 in order to do this. Let $C$ be an algebraically closed field, let $V$ be a variety in $C^n$, and let $R = C[V]$ be the coordinate ring of $V$. Then $V$ is homeomorphic to the subspace of $\mathrm{spec}(R)$ consisting of all maximal ideals of $R$. This is mostly a consequence of the Nullstellensatz.

**Example 1.8** Let $X$ and $Y$ be topological spaces. Then the product $X \times Y$ can be given a topology in the following way. We define a subset of $X \times Y$ to be open if it is a union of sets of the form $U \times V$, where $U$ is an open subset of $X$ and $V$ is an open subset of $Y$; that is, the collection $\mathcal{C}$ of these subsets is a basis for the topology. It is easy to verify that this collection does satisfy the requirement to be a basis. If $(x,y) \in (U \times V) \cap (U' \times V')$, then $(U \cap U') \times (V \cap V')$ is a basic open set that contains $(x,y)$ and is contained in $(U \times V) \cap (U' \times V')$. This topology on $X \times Y$ is called the *product topology*. More generally, if $X_1, \ldots, X_n$ is a collection of topological spaces, then we get a similar topology on $X_1 \times \cdots \times X_n$.

**Example 1.9** Let $I$ be a set, and let $\{X_i\}_{i \in I}$ be a collection of topological spaces. We can generalize the previous construction to define the product topology on $\prod_i X_i$. If $I$ is infinite, then we need an extra step in the definition. Consider the set $\mathcal{S}$ of all subsets of $\prod_i X_i$ of the form $\prod_i U_i$, where $U_i$ is open in $X_i$ and $U_i = X_i$ for all but finitely many $i$. If $I$ is finite, then $\mathcal{S}$ is the basis described in the previous example. If $I$ is not finite, then we let $\mathcal{C}$ be the collection of all sets that are finite intersections of elements of $\mathcal{S}$. It is not hard to show that $\mathcal{C}$ does form a basis for a topology on $\prod_i X_i$, and we call this the product topology on $\prod_i X_i$. It is true that $\mathcal{S}$ also forms a basis for a topology on $X$, the box topology, but this topology is not as useful as the product topology.

## 2 Topological Properties

There are various properties of topological spaces that we need to discuss. Let $X$ be a topological space. Then $X$ is called *Hausdorff* if for every two distinct points $x, y \in X$, there are disjoint open sets $U$ and $V$ with $x \in U$ and $y \in V$. For example, if $X$ is a metric space, then we see that the metric space topology is Hausdorff. If $x, y \in X$ are distinct points, let $\delta = \frac{1}{2} d(x,y)$. Then the open balls $B(x,\delta)$ and $B(y,\delta)$ are disjoint open sets containing $x$ and $y$, respectively. The finite complement topology on an infinite set $X$ is not Hausdorff, since any two nonempty open sets must have a nonempty intersection. If $R$ is an integral domain, then we show that the Zariski topology on $\mathrm{spec}(R)$ is not Hausdorff either. We note that the zero ideal is prime and that $(0) \notin Z(S)$ for any $S$ unless $Z(S) = \mathrm{spec}(R)$. Consequently, $(0)$ is contained in any nonempty open set. Therefore, any two nonempty open sets have a nonempty intersection, so $\mathrm{spec}(R)$ is not Hausdorff.

The next concept we discuss is compactness. If $X$ is a topological space, then an *open cover* of $X$ is a collection of open sets whose union is $X$. If $\{U_i\}$ is an open cover of $X$, then a *finite subcover* is a finite subset of the collection whose union is also $X$. The space $X$ is called *compact* if every open cover of $X$ has a finite subcover.

**Example 2.1** The space $\mathbb{R}$ is not compact, since $\{(a, a+1) : a \in \mathbb{R}\}$ is an open cover of $\mathbb{R}$ that does not have a finite subcover. Subspaces of $\mathbb{R}^n$ may be compact. Recall that a subset $Y$ of $\mathbb{R}^n$ is *bounded* if $Y$ is contained in an open ball $B(0,\delta)$ for some $\delta$. The Heine–Borel theorem says that a subset of $\mathbb{R}^n$ is compact if and only if it is closed and bounded.

**Example 2.2** Let $R$ be a commutative ring. The Zariski topology on $\mathrm{spec}(R)$ is compact, as we now show. Suppose that $\{U_i\}$ is an open cover of $\mathrm{spec}(R)$. If $Z(S_i)$ is the complement of $U_i$, then $\bigcap_i Z(S_i) = Z(\bigcup S_i) = \varnothing$. We first point out that if $I_i$ is the ideal generated by $S_i$, then $Z(I_i) = Z(S_i)$ and $Z(\bigcup S_i) = Z(\sum_i I_i)$. The ideal $\sum_i I_i$ cannot be a proper ideal, since if it is, then it is contained in a maximal ideal, and so $Z(\sum_i I_i) \neq \varnothing$. Thus, $\sum_i I_i = R$, so there is a finite subcollection $I_1, \ldots, I_n$ and elements $r_i \in I_i$ such that $r_1 + \cdots + r_n = 1$. Then $\sum_{i=1}^n I_i = R$, and so there is no prime ideal that contains each $I_i$. Consequently, $\bigcap_{i=1}^n Z(I_i) = \varnothing$, so $\bigcup_{i=1}^n U_i = \mathrm{spec}(R)$. We have found a finite subcover of $\{U_i\}$, so $\mathrm{spec}(R)$ is compact.

**Example 2.3** Let $\{X_i\}$ be a collection of compact topological spaces. Then the product $\prod_i X_i$ is compact in the product topology. This nontrivial fact is the Tychonoff theorem and can be found in Chapter 5 of Munkres [22].

Let $X$ be a topological space, and let $S$ be a subset of $X$. The *closure* $\overline{S}$ of $S$ is defined to be the intersection of all closed sets that contain $S$. Since $X$ is closed, the closure is a closed set that contains $S$. The main property about this concept is given in the following proposition. The simple proof is left to Problem 4.

**Proposition 2.4** *Let $X$ be a topological space, and let $S$ be a subset of $X$.*

1. *If $C$ is any closed set that contains $S$, then $\overline{S} \subseteq C$.*
2. *If $U$ is an open set with $U \cap \overline{S} \neq \varnothing$, then $U \cap S \neq \varnothing$.*

One consequence of this proposition is that an element $x \in X$ is in the closure of a subset $S$, provided that for any open set $U$ that contains $x$, we have $U \cap S \neq \varnothing$. This is a useful way to determine when an element is in $\overline{S}$.

If $X$ is a topological space and $Y$ is a subset of $X$, then $Y$ is *dense* in $X$ if $\overline{Y} = X$. For example, any set $S$ is dense in its closure $\overline{S}$. The open interval $(0,1)$ is dense in $[0,1]$. If $R$ is a commutative ring, then we show that any nonempty open subset of $\mathrm{spec}(R)$ is dense in $\mathrm{spec}(R)$. If $U$ is an open set, then $\overline{U}$ is a closed subset of $\mathrm{spec}(R)$, and $U \cap (\mathrm{spec}(R) - \overline{U}) = \varnothing$. However, we have seen that any two nonempty open sets in $\mathrm{spec}(R)$ have a nonempty intersection. This forces $\overline{U} = \mathrm{spec}(R)$, so $U$ is dense in $\mathrm{spec}(R)$.

We have not yet discussed functions between topological spaces. If $X$ and $Y$ are topological spaces, then a function $f : X \to Y$ is called *continuous* if $f^{-1}(V)$ is open in $X$ for any open set $V$ in $Y$. If $X$ and $Y$ are subsets of $\mathbb{R}$, then this definition of continuity is equivalent to the limit definition given in calculus; see Problem 6.

Let $X$ be a topological space, and let $\sim$ be an equivalence relation on $X$. We let $X^*$ be the set of equivalence classes, and for $x \in X$ we denote the equivalence class of $x$ by $\overline{x}$. We have a natural surjective function $\pi : X \to X^*$ given by $\pi(x) = \overline{x}$. We define the *quotient topology* on $X^*$ as follows. A subset $Y$ of $X^*$ is defined to be open if $\pi^{-1}(Y)$ is open in $X$. It is a simple exercise to show that this does define a topology on $X^*$ and that $\pi$ is continuous. Moreover, the quotient topology is the topology on $X^*$ that has the fewest open sets for which $\pi$ is continuous.

We end this appendix with a concept that will arise in Section 17. A topological space $X$ is called *connected* if $X$ is not the union of two disjoint closed sets. For example, $\mathbb{R}$ is a connected set, while the subspace $[0,1] \cup [2,3]$ is not connected. On the other extreme, a space $X$ is called *totally disconnected* if the only connected subsets of $X$ are singleton sets. A space with the discrete topology is totally disconnected. The topology on a Galois group we define in Section 17 is totally disconnected.
