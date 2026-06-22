---
title: Kibana使用之Lucene的语法查询
description: "Grammar of Lucene"
date: 2022-11-02
---

Kibana使用的查询语法是Lucene的查询语法，下面了解下Lucene的查询语法，了解了Lucene的查询语法也就知道了改如何使用Kibana的使用方式。

Lucene查询语法以可读的方式书写，然后使用JavaCC进行词法转换，转换成机器可识别的查询。

# **词语查询**

```javascript
"here","there"
"here,there"
```

## **字段查询**

```javascript
tag:there
tag:"there are"
```

搜索语句是需要加上双引号，否则

```javascript
tag:there are
```

就意味着，搜索tag为there，或者包含are关键字的文档

## **修饰符查询**

通过增加修饰，从而扩大查询的范围。通配符一般包括如下

> ?:匹配单个字符
> *:匹配0个或多个字符

语法如下

```javascript
?tere
```

意味着搜索there、where等类似的文档

```javascript
test*
```

意味着搜索test、tests、tester

## 模糊词查询

就是在词语后面加上符号~。语法如下

```javascript
he~
```

意味着搜索her或hei等词

也可以在~后面添加模糊系数，模糊系数[0-1]，越靠近1表示越相近，默认模糊系数为0.5。语法如下

```javascript
he~0.8
```

## **邻近词查询**

语法如下

```javascript
"here there"~10
```

代表搜索包含"here","there"的文档，这两个词中间可以有一部分内容（这部分的内容通过字符个数显示）能够匹配到结果的如下

```javascript
"here wowo wowo there"
"here,wowow,wowow,there"
```

## **范围查询**。

可以指定最大值和最小值，会自动查找在这之间的文档。如果是单词，则会按照字典顺序搜索

> {}尖括号表示不包含最小值和最大值，可以单独使用
> []方括号表示包含最小值和最大值，可以单独使用。如下：

如果搜索成绩grade字段小于等于80分，大于60分的可以写成下面的方式

```javascript
grade:{60,80]
```

如果搜索name在A和C之间的，可以使用如下的语法

```javascript
name:{A,C}
```

## **词语相关度查询**

如果单词的匹配度很高，一个文档中或者一个字段中可以匹配多次，那么可以提升该词的相关度。使用符号^提高相关度。

提高jarkarta的比重`jakarta apache`可以采用下面的语法：

```javascript
jakarta^4 apache
```

## **布尔操作符**

支持多种操作符：

### **AND**

AND操作符用于连接两个搜索条件，仅当两个搜索条件都满足时，才认为匹配。通常用来做交集操作。也可以使用&&替换。

注意必须使用大写。如果不使用AND，而是and，可能会被单做关键词进行搜索！

例如：搜索同时包含a和b的文档

```javascript
a AND b
```

或者

```javascript
a && b
```

### **OR**

OR操作符用于连接两个搜索条件，当其中一个条件满足时，就认为匹配。通常用来做并集操作。也可以使用||替换。注意必须使用大写。

例如：搜索包含a或者b的文档

```javascript
a OR b
```

或者

```javascript
a || b
```

### **NOT**

NOT操作符排除某个搜索条件。通常用来做差集操作也可以使用!替换。注意必须大写。

例如：搜索包含a，不包含b的文档

```javascript
a NOT b
```

或者

```javascript
a && !b
```

在kibana中支持单独使用，如：排除包含test的文档

```javascript
NOT test
```

### **+（加号）**

包含该操作符后跟着的搜索条件，如：搜索包含tom的文档

```javascript
+tom
```

作用和AND的差不多，但是支持单独使用

### **-（减号）**

排除该操作符后跟着的搜索条件，如：搜索不包含tom的文档

```javascript
-tom
```

效果类似NOT

## **分组**

支持使用小括号对每个子句进行分组，形成更为复杂的查询逻辑。
例如：要搜索包含a的文档中，也包含b或者c的

```javascript
a AND (b OR c)
```

也支持在字段中使用小括号。如：要搜索标题中，既包含a也包含b的

```javascript
title:(+a +"b")
```

## **转义字符**

由于Lucene中支持很多的符号，如

```javascript
+ - && || ! ( ) { } [ ] ^ " ~ * ? : \
```

因此如果需要搜索 (1+1):2 需要对改串进行转换，使用字符\。

```javascript
\(1\+1\)\:2
```

## 参考文档：

1. http://www.cnblogs.com/xing901022/p/4974977.html
2. https://segmentfault.com/a/1190000002972420
