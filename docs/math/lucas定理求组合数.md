---
title: "Lucas定理求组合数"
description: "定律定义Lucass theorem：我们令n=sp+q , m=tp+r.（0≤q ，r ≤p-1）那么： 其中p为素数的值。在编程时你只要继续对调用Lucas定理即可。代码可以递归的去完成这个过程，其中递归终点为t = 0 ；时间推导过程Lucas定理证明：首先你需要这个算式:,其中f ..."
---

# Lucas定理求组合数

# 定律定义

[Lucas's theorem](https://en.wikipedia.org/wiki/Lucas%27s_theorem)：我们令**n=sp+q , m=tp+r.（0≤q ，r ≤p-1）**

那么：

![image](https://bkimg.cdn.bcebos.com/formula/a784fd83c19921085f6e12dff816ef1d.svg)
 其中p为[素数](https://baike.baidu.com/item/%E7%B4%A0%E6%95%B0/115069)的值。

在编程时你只要继续对
![image](https://bkimg.cdn.bcebos.com/formula/82487f6edd8cbc15d79019296d825bdf.svg)
调用Lucas定理即可。代码可以递归的去完成这个过程，其中递归终点为t = 0 ；

时间1813718137

# 推导过程

Lucas定理证明：

首先你需要这个算式:
![image](https://bkimg.cdn.bcebos.com/formula/6fbc158c882526c6d29b9a88b1530e38.svg)
,其中f > 0&& f < p，然后

1813718137

![image](https://bkimg.cdn.bcebos.com/formula/9063d0ceb5845e349f44c8d96de90c4e.svg)
1813718137

所以得1813718137
![image](https://bkimg.cdn.bcebos.com/formula/9063d0ceb5845e349f44c8d96de90c4e.svg)
**(mod p)**

我们求左边1813718137 中的
![image](https://bkimg.cdn.bcebos.com/formula/4325a76844ca800dc382f529b8c4ab2d.svg)
的系数为：
![image](https://bkimg.cdn.bcebos.com/formula/862453a90e1b69b9d230aa0b7f57164a.svg)

求右边公式中的
![image](https://cdn.nlark.com/yuque/0/2021/svg/22382307/1639020025566-b2e694c8-efd0-42fe-b424-9ed86eeff581.svg)
的系数：通过观察你会发现当且仅当i = t , j = r ,能够得到
![image](https://bkimg.cdn.bcebos.com/formula/4325a76844ca800dc382f529b8c4ab2d.svg)
的系数，即

![image](https://bkimg.cdn.bcebos.com/formula/e744c4a7d4cd33bfae78d5457b66ffc0.svg)

所以

![image](https://bkimg.cdn.bcebos.com/formula/a784fd83c19921085f6e12dff816ef1d.svg)

得证。
​

# 组合数的性质

## 对偶公式

1813718137​

可以理解为：将原本的每个组合都反转，把原来没选的选上，原来选了的去掉，这样就变成从n个元素种取出n−m个元素，显然方案数是相等的。

## 递推公式

1813718137

1813718137

可理解为：含特定元素的组合有1813718137，不含特定元素的排列为1813718137。还不懂？看下面。

**Example**

从1，2，3，4，5（n=5）中取出2（m=2）个元素的组合（1813718137）：

12 13 14 15 23 24 25 34 35 45

显然，这些组合中要么含有元素“1”，要么不含���

其中含有“1”的是：12 13 14 15
把里面的“1”都挖掉：2 3 4 5
而上面这个等价于从2，3，4，5（n−1）中取出（m−1）个元素的组合。 ​

其中不含“1”的是：23 24 25 34 35 45
上面等价于从2，3，4，5（n−1）中取出（m）个元素的组合。 

而总方案数等于上面两种情况方案数之和，即1813718137。

## 组合数求和公式

1813718137

我们感性认知一下，上面这个式子的左边表示什么呢？

把从n个球中抽出0个球的组合数（值为1）、抽出1个球的组合数、抽出2个球的组合数、……、抽出n个球的组合数相加。

换句话说，就是从n个球中随便抽出一些不定个数球，问一共有多少种组合。
​

对于第1个球，可以选，也可以不选，有2种情况。
对于第2个球，可以选，也可以不选，有2种情况。
对于任意一个球，可以选，也可以不选，有2种情况。

根据乘法原理，一共1813718137种组合。
## 

## 小组合数代码实现
​

利用递推公式递推：
​

（1）如果m=n位置及m=0位置上元素为1:

```c
if(m == 0 || m == n)
    return 1;
```

（2）其它情况：

    按列计算，当列和行相同时填1；当列为0时，也填1；

    其它情况根据递推公式求：`mat[i][j] = mat[i-1][j-1] + mat[i-1][j]  (i>=j)`;

```c
// 一列一列的计算下去
for(j = 0; j 

动态规划算法实现程序

```c
//  计算组合数：使用动态规划算法
 
#include 
 
int mat[100][100];
 
int combinat(int n, int m) {
    int i, j;
    
    if(m == 0 || m == n)
        return 1;
    // 一列一列的计算下去
    for(j = 0; j > m >> n;
    std::cout ​

对动态规划进行状态压缩，全部压缩到一列（去除列下标，详细参考[动态规划详解](https://www.yuque.com/docs/share/9e4cf5e2-2cd2-4bbc-9f9c-0a8f191594a8?# 《动态规划详解》)）

```cpp
long long comb(int n, int m) {
    int i, j;
    
    if(m == 0 || m == n)
        return 1;
    
    vector mat(n+1,1);//初始化第一列 j= 0,一共n行
   
    // 一列一列的计算下去
    for(j = 1; j # Lucas代码实现

```cpp
#include 
#include 

using namespace std;

int p;

long long combinat(int n, int m) {
    int i, j;
    
    if(m == 0 || m == n)
        return 1;
    
    vector mat(n+1,1);//初始化第一列 j= 0,一共n行
   
    // 一列一列的计算下去
    for(j = 1; j > m >> n >> p;
    long long t = combinat(n,m);
    cout## 

# 中国剩余定理
​

下面会用到的数学公式：
​

①如果a%b=c，那么如果x%b=c/2，此时x=a/2；也就是说除数相等时，被除数和余数是成比例的。
​

②如果a%b=c，那么 (a + k*b)%b=c，其中k为整数
## 

## 问题引入

在《孙子算经》中有这样一个问题：“今有物不知其数，三三数之剩二（除以3余2），五五数之剩三（除以5余3），七七数之剩二（除以7余2），问物几何？”这个问题称为“孙子问题”，该问题的一般解法国际上称为“中国剩余定理”。

具体解法分下面三步：

1、找出三个数：从3和5的公倍数中找出被7除余1的最小数15，从3和7的公倍数中找出被5除余1 的最小数21，最后从5和7的公倍数中找出除3余1的最小数70。

2、用15乘以2（2为最终结果除以7的余数），用21乘以3（3为最终结果除以5的余数），同理，用70乘以2（2为最终结果除以3的余数），然后把三个乘积相加15∗2+21∗3+70∗215∗2+21∗3+70∗2得到和233。

3、用233除以3、5、7的最小公倍数105，得到余数23，这个余数23就是符合条件的最小数。

解释：

那么我们可能会问：为什么要这样算……

如果我们设出三个数n1、n2、n3，满足：n1%3=2、n2%5=3、n3%7=2；

那么，我们先从n1这个角度出发，能不能让n1+n2也满足%3=2呢？根据上面的公式②，如果n2是3的倍数就完全可以满足，  同样如果让n1+n2+n3满足%3=2，需要n2和n3都是3的倍数；

同样的，我们从n2和n3的角度出发可以得到：

1、n1需要是5、7的倍数；

2、n2需要是3、7的倍数；

3、n3需要是3、5的倍数；

如果找到了满足上面的三个条件的n1、n2、n3，根据上面的推论，n1+n2+n3就是满足题目要求的那个数，（但不一定是最小的哈）

接下来的问题就是我们要怎么在5和7的倍数中找出一个数满足%3=2（2、3条件类似）

我们最开始列出的第一个公式还没有用呢！是不是可以转化成在5和7的倍数中找到一个数满足%3=1就可以了呢？然��我们再*2就可以了，为什么会想要让余数为1呢？因为这个跟逆元的求法几乎一样。

## 公式

用现代数学的语言来说明的话，中国剩余定理给出了以下的一元[线性同余方程](https://baike.baidu.com/item/%E7%BA%BF%E6%80%A7%E5%90%8C%E4%BD%99%E6%96%B9%E7%A8%8B/5544515)组：

![image](https://cdn.nlark.com/yuque/0/2021/svg/22382307/1639070155959-7e0bc7ec-e936-42c1-8462-f9863ff8f724.svg)
有解的判定条件，并用[构造法](https://baike.baidu.com/item/%E6%9E%84%E9%80%A0%E6%B3%95)给出了在有解情况下解的具体形式。
​

中国剩余定理说明：假设[整数](https://baike.baidu.com/item/%E6%95%B4%E6%95%B0)m_1,m_2, ... ,m_n[两两互质](https://baike.baidu.com/item/%E4%B8%A4%E4%B8%A4%E4%BA%92%E8%B4%A8)，则对任意的整数：a_1,a_2, ... ,a_n，方程组(S)有解，并且通解可以用如下方式构造得到：
​

设
![image](https://cdn.nlark.com/yuque/0/2021/svg/22382307/1639070155788-6408e050-6d61-4cf5-9766-0a85d452b96c.svg)
是整数m_1,m_2, ... ,m_n的乘积，并设
![image](https://cdn.nlark.com/yuque/0/2021/svg/22382307/1639070155812-ab894e13-3bab-4381-9308-0a513b87fea3.svg)
是除了1813718137以外的*n*- 1个整数的乘积。​

设1813718137为1813718137模1813718137的数论倒数(1813718137**为**1813718137**模**1813718137**意义下的逆元**)

![image](https://cdn.nlark.com/yuque/0/2021/svg/22382307/1639070156189-1d02b809-823c-4f72-adf6-4c9064dde0e4.svg)
​

方程组(S)的通解形式为

![image](https://cdn.nlark.com/yuque/0/2021/svg/22382307/1639070156308-01469754-a7ca-4119-aa0c-b9824be30a3e.svg)
在模M的意义下，方程组(S)只有一个解：

![image](https://cdn.nlark.com/yuque/0/2021/svg/22382307/1639070156573-2438c6b3-7056-4590-9070-82a3661d7796.svg)
补充：求逆元的方法：
​

①费马小定理

![297dbd33-28ae-4879-8231-0458c569df5c.png](https://cdn.nlark.com/yuque/0/2021/png/22382307/1639070488932-4ca3884b-7a15-42e3-909d-827469f37d24.png)
②扩展欧几里得

![1f5f7801-625a-4f59-8fdb-78936620fbc4.png](https://cdn.nlark.com/yuque/0/2021/png/22382307/1639070497387-7ff973d5-4b72-48c4-87d1-62f743c48673.png)
## 代码

```c
//中国剩余定理模板
typedef long long ll;
ll china(vector a,vector b,int n)//a[]为除数,即模mi，b[]为余数
{
    ll M=1,y,x=0;
    for(int i=0;i

注：在倒数第二行的式子中，`w*(b[i]/t)*tx`中，x其实是式子 `w*tx+a[i]*y=gcd`求出来的“逆元”，打引号是因为真正的逆元式子右边应该是1而不是gcd 因此要把tx/t，这是的tx/t才是真正的逆元，然后我们再乘以余数`b[i]*w`，得到的就是我们想要的
​

# 拓展Lucas定理
​

若p不是素数，将p分解质因数，将C(n,m)分别按照Lucas定理中的方法求对p的质因数的模，然后用中国剩余定理合并。

比如计算C(10,3)%14。C(10,3)=120,14有两个质因数2和7，120%2=0,120%7=1,这样用(2,0)(7,1)找到最小的正整数8即是答案，即C(10,3)%14=8。

注意，这里只适用于p分解完质因数后每个质因数只出现一次，例如`12=2*2*3`就不行，因为2出现了两次。若p分解完质因数后，含有某个质因数出现多次，比如C(10,3)%98,其中`98=2*7*7`,此时就要把`7*7`看做一个数,即:`120%2=0,120%49=22`,用(2,0)(49,22)和中国剩余定理得到答案22，即C(10,3)%98=22。

此时，你又会有疑问，C(10,3)%49不也是模一个非素数吗？此时不同的是这个非素数不是一般的非素数，而是某个素数的某次方。

如何计算1813718137(t>=2,p为素数)。 计算1813718137。

我们知道，C(n,m)=n!/m!/(n-m)!，若我们可以计算出1813718137，我们就能计算出1813718137。我们不妨设1813718137那么答案就是1813718137(reverse(a,b)计算a对b的乘法逆元)。

那么下面问题就转化成如何计算1813718137。比如1813718137,
1813718137
1813718137
1813718137
然后发现后面的是(n/p)!，于是递归即可。

前半部分是以p^t为周期的1813718137。下面是孤立的19，可以知道孤立出来的长度不超过 1813718137,于是暴力即可。那么最后剩下的1813718137啊这些数怎么办呢？我们只要计算出1813718137里含有多少个p(不妨设a,b,c)，那么a-b-c就是C(n,m)中p的个数，直接算一下就行。 至此整个计算C(n,m)%p(p为任意数)的问题完美解决。
​

代码

```cpp
#include 
#include 
#include 
#include
 
using namespace std;
 
typedef long long ll;
 
ll quick_mod(ll a,ll b,ll m){
    ll ans=1ll;
    while(b){
        if(b&1) ans=ans*a%m;
        b>>=1;
        a=a*a%m;
    }
    return ans;
}
 
ll exgcd(ll a,ll b,ll &x,ll &y){
    if(a%b==0){
        x=0ll;y=1ll;
        return b;
    }
    ll v,tx,ty;
    v=exgcd(b,a%b,tx,ty);
    x=ty;
    y=tx-a/b*ty;
    return v;
}
 
ll inv(ll a,ll p){
    if(!a) return 0ll;
    ll x,y;
    exgcd(a,p,x,y);
    x=(x%p+p)%p;
    return x;
}
 
ll Mul(ll n,ll pi,ll pk){
    if(!n) return 1ll;
    ll ans=1ll;
    for(ll i=2;in) return 0ll;
    ll a=Mul(n,pi,pk),b=Mul(m,pi,pk),c=Mul(n-m,pi,pk);
    ll k=0ll,ans=0ll;
    for(ll i=n;i;i/=pi) k+=i/pi;
    for(ll i=m;i;i/=pi) k-=i/pi;
    for(ll i=n-m;i;i/=pi) k-=i/pi;
    ans=a*inv(b,pk)%pk*inv(c,pk)%pk*quick_mod(pi,k,pk)%pk;
    return ans*(p/pk)%p*inv(p/pk,pk)%p;     
}
 
int main()
{
    ll n,m,p,ans=0;
    while(cin>>n>>m>>p){
        for(ll x=p,i=2;i