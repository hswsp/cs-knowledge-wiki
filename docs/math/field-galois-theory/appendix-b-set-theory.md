# Appendix B. Set Theory（集合论）

In this appendix, we discuss Zorn's lemma and cardinal arithmetic. For more information on these topics, see Enderton [8] or Stoll [26].

## 1 Zorn's Lemma

In this book, we use Zorn's lemma in algebra to prove the isomorphism extension theorem, the existence of an algebraic closure, and some other results. We point out that Zorn's lemma has a large number of equivalent formulations; for instance, Zorn's lemma is equivalent to the axiom of choice and to the well ordering principle. However, we only require the statement of Zorn's lemma in this book.

We now describe the terms involved in the statement of Zorn's lemma. A *partial order* $\leq$ on a set $S$ is a binary relation such that (1) $s \leq s$ for all $s \in S$, (2) if $s \leq t$ and $t \leq s$, then $s = t$, and (3) if $r \leq s$ and $s \leq t$, then $r \leq t$. Examples of a set with a partial order include the real numbers with the usual ordering, and the set of all subsets of a given set, with set inclusion as the order. If $S$ is a set with partial order $\leq$, we shall refer to the pair $(S, \leq)$ as a *partially ordered set*.

Let $(S, \leq)$ be a partially ordered set. An element $m \in S$ is said to be *maximal* if whenever $s \in S$ with $m \leq s$, then $s = m$. If $T$ is a subset of $S$, then an element $s \in S$ is said to be an *upper bound* for $T$ if $t \leq s$ for all $t \in T$. For instance, if $S$ is the set of all subsets of $\{1,2,3,4\}$, then $\{1,2,3,4\}$ is a maximal element of $S$. If $T$ is the set of all proper subsets of $\{1,2,3,4\}$, then $\{1,2,3,4\}$ is an upper bound for $T$. Note that this upper bound is not in $T$. Also, $\{1,2,3\}$ and $\{1,2,4\}$ are both maximal elements of $T$. Finally, a subset $T$ of a partially ordered set $(S, \leq)$ is said to be a *chain* if for every $t_1, t_2 \in T$, then either $t_1 \leq t_2$ or $t_2 \leq t_1$. With the example above, $\{\varnothing, \{1\}, \{1,2\}, \{1,2,4\}\}$ is a chain in $S$.

We can now state Zorn's lemma.

**Theorem 1.1 (Zorn's Lemma)** *Let $(S, \leq)$ be a nonempty partially ordered set. Suppose that for any chain $T$ in $S$ there is an upper bound for $T$ in $S$. Then $S$ contains a maximal element.*

In the statement of Zorn's lemma, an upper bound for a chain $T$ need not be an element of $T$, merely an element of $S$.

**Example 1.2** Here is the first place that Zorn's lemma usually arises in algebra. Let $R$ be a ring with identity. We show that $R$ contains a maximal ideal. Let $S$ be the set of all proper ideals of $R$. Then $S \neq \varnothing$, since $(0) \in S$. The set $S$ is partially ordered by set inclusion. To verify that Zorn's lemma applies, let $T$ be a chain in $S$. Define $I$ to be $\bigcup T$, the union of all ideals in $T$. We can see that $I$ is an ideal of $R$, for if $a, b \in I$, then $a, b \in J$ for some $J \in T$, since $T$ is a chain. Then $a - b \in J \subseteq I$. Also, if $a \in I$ and $r \in R$, then $a \in J$ for some $J \in T$, so $ra, ar \in J \subseteq I$. Thus, $I$ is an ideal of $R$. Moreover, $I$ is a proper ideal of $R$ since no $J \in T$ contains $1$, so $I$ does not contain $1$. Therefore, $I \in S$. By Zorn's lemma, $S$ contains a maximal element $M$. A maximal ideal of $R$ is precisely a maximal element of the set of proper ideals of $R$, so $M$ is a maximal ideal of $R$.

We now give a couple of general examples of how Zorn's lemma can be used in algebra. All of the uses of Zorn's lemma in this book, including the example above, are special examples of these. Appendix D uses Zorn's lemma to prove that any vector space contains a basis.

**Example 1.3** Let $X$ be a set, and let $S$ be a nonempty collection of subsets of $X$, with the partial order of set inclusion. Suppose that for every chain $T$ in $S$ the set $\bigcup T$ is an element of $S$. Then $S$ has a maximal element. To verify this, all we need to see to apply Zorn's lemma is that the chain $T$ has an upper bound in $S$. But the union $\bigcup T$ clearly is an upper bound for $T$, since any $t \in T$ is a subset of this union. The assumption is that this union is in $S$; hence, Zorn's lemma applies.

**Example 1.4** Let $X$ and $Y$ be sets, and let $S$ be a nonempty collection of pairs $(A, f)$, where $A$ is a subset of $X$ and $f : A \to Y$ is a function. We can define a partial order on $S$ as follows: Let $(A, f) \leq (B, g)$ if $A \subseteq B$ and $g|_A = f$. It is easy to see that $\leq$ is indeed a partial order on $S$. Suppose that $T$ is a chain in $S$. Let $M = \bigcup T$, and define a function $h : T \to Y$ by $h(x) = g(x)$ if $(X, g) \in T$ and $x \in X$. The function $h$ is well defined by the condition that $T$ is a chain. Suppose that for each chain $T$, the pair $(M, h)$ as constructed is an element of $S$. Then $S$ has a maximal element. This follows from Zorn's lemma because the element $(M, h)$ is an upper bound for $T$ by construction and, by hypothesis, lies in $S$.

## 2 Cardinality and Cardinal Arithmetic

We will require the use of cardinal arithmetic in a couple of places in this book. The theorem that any two bases of a finite dimensional vector space have the same number of elements can be extended to arbitrary vector spaces by using Zorn's lemma and some results of cardinal arithmetic. We now give the basic definitions and results on cardinal arithmetic that we require in this book.

If $S$ and $T$ are sets, we write $S \preceq T$ if there is an injective function from $S$ to $T$. It is proved in most set theory texts that $S \preceq T$ if and only if there is a surjective function from $T$ to $S$. If $S \preceq T$ and $T \preceq S$, then we say $S$ and $T$ have the same cardinality and write $S \approx T$. The Schröder–Bernstein theorem says that this is equivalent to the existence of a bijection between $S$ and $T$. We will write $S \prec T$ if $S \preceq T$ and if $S$ and $T$ do not have the same cardinality.

The cardinality of a set $S$ will be denoted $|S|$. Addition and multiplication of cardinal numbers is defined by $|S| + |T| = |S \uplus T|$, where $S \uplus T$ is the disjoint union of $S$ and $T$. Also, $|S| \cdot |T| = |S \times T|$. We write $|S| \leq |T|$ and $|S| < |T|$ if $S \preceq T$ and $S \prec T$, respectively. If $S$ is an infinite set, then $|S|$ is called an *infinite cardinal*. If $S$ is finite or if $S \approx \mathbb{N}$, then $S$ is said to be *countable*. If $S$ is countable and infinite, we write $|S| = \aleph_0$. The cardinal $\aleph_0$ is the smallest infinite cardinal; that is, if $S$ is a countably infinite set and $T$ is any infinite set, there is an injective function $S \to T$. We recall the basic facts of cardinal arithmetic in the following proposition.

**Proposition 2.1** *Let $S$ and $T$ be sets.*

1. *If $T$ is infinite and if $\{S_n : n \in \mathbb{N}\}$ is a collection of subsets of $S$ with $|S_n| \leq |T|$ for all $n$, then $|\bigcup_{n \in \mathbb{N}} S_n| \leq |T|$.*
2. *If $S$ and $T$ are sets, then $|S| \leq |S| + |T|$. If either $S$ or $T$ is infinite, then $|S| + |T| = \max\{|S|, |T|\}$.*
3. *If $S$ and $T$ are nonempty sets, then $|S| \leq |S| \cdot |T|$. If either $S$ or $T$ is infinite, then $|S| \cdot |T| = \max\{|S|, |T|\}$.*
4. *If $T$ is an infinite set, then $\aleph_0 \cdot |T| = |T|$.*

**Example 2.2** Let $X$ be a set, and let $\mathcal{P}(X)$ be the set of all subsets of $X$. We show that $|\mathcal{P}(X)| > |X|$. Note that there is an injective map $X \to \mathcal{P}(X)$ given by $a \mapsto \{a\}$. Therefore, $|X| \leq |\mathcal{P}(X)|$. We finish the proof by showing that there is no surjective map from $X$ to $\mathcal{P}(X)$. Let $f : X \to \mathcal{P}(X)$ be any function. Define $S$ by $S = \{a \in X : a \notin f(a)\}$. We claim that $S$ is not in the image of $f$. Suppose instead that $S = f(x)$ for some $x$. Then $x \in S$ if and only if $x \notin f(x) = S$. This is impossible, so $S \notin \mathrm{im}(f)$.
