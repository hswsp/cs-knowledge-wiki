---
title: "外部排序 - 基于堆排序(最大堆)+最大赢者树"
description: "外部排序，则是每次进行部分排序，然后将各组部分排序的结果合并，再次排序得到最终的结果．本文中的程序用最大堆和最大赢者树完成了一个外部排序算法，基本思想如下：将Ｎ个元素的大数组拆成每个元素为Ｍ的子数组，得到X=(N/M)个子数组；对这Ｘ个子数组，依次使用堆排序进行排序；初始化最大赢者树：取出这Ｘ..."
---

# 外部排序 - 基于堆排序(最大堆)+最大赢者树

外部排序，则是每次进行部分排序，然后将各组部分排序的结果合并，再次排序得到最终的结果．

本文中的程序用最大堆和最大赢者树完成了一个外部排序算法，基本思想如下：

- 将Ｎ个元素的大数组拆成每个元素为Ｍ的子数组，得到X=(N/M)个子数组；
- 对这Ｘ个子数组，依次使用堆排序进行排序；
- 初始化最大赢者树：取出这Ｘ个子数组的最大元素，初始化一颗Ｘ个元素的最大赢者树；
- 每次从最大赢者树弹出一个最大值后，再从对应最大堆里面取出一个次大元素，补充进最大赢者树；
- 不停循环步骤４，直到所有最大堆里的元素都被弹出．

# 外存交互方式

为了便于分别管理子数组，这里使用文件存放每一个子数组，一个子数组存放到一个文件里面，记录下来其对应的文件名。使用`vector fileNames`记录每一个子数组文件名称。

# 子数组内部排序

这里使用c++ 提供的快速排序算法。从原始的输入文件里面一次读入`vector arr`，这里将`arr`大小,即每一个子数组大小，设置为`heap_size`。当数组存满时，便排序后写入外存文件，再清空数组。

```cpp
if(arr.size()==heap_size)
{
  sort(arr.begin(),arr.end(),greater());//降序排列
  out.open(fileNames[i++]);
  if (!out)
  {
  cout 

# 最大赢者树

c++提供了现成的堆：优先队列，这里为了找到堆中每一个元素所属于哪一个子数组（文件），堆里存放的是元素和其对应的子数组的外存位置（文件名）：`pair = make_pair(待排序元素，所在文件名)`，采用自定义堆排序：根据待排序元素大小构建一个大顶堆

```cpp
/**
自构建比较函数
**/
struct cmp
{
    bool operator()(Pair a, Pair b) { 
        return a  Tree; //使用大顶堆构造最大赢者树
```

初始化大顶堆后删除每一个子数组文件的头一个元素（最大值），表示该元素由外存引入内存。然后依次弹出大顶堆第一个元素（最大值）写入结果文件中。

每次从最大赢者树弹出一个最大值后，再从对应最大堆里面取出一个次大元素，补充进最大赢者树，刷新大顶堆。

这里都需要用到从文件中删除头一个元素的操作：

```cpp
/**
 * 删除文件头一个元素以及其后面的空格,并返回文件的第一个原素
 * 文件为空返回false*/
bool delFirstElement(string fileName,int * firstElement)
{
    vector arr;
    int data;
    std::ifstream inputs(fileName);
    while(inputs>>data)
    {
        arr.push_back(data);
    }
    inputs.close();
    if(arr.empty())
    {
        return false;
    }
    std::ofstream outs(fileName);
    if(arr.size()>1)
    {
        for(int i = 1;isize();++i)
            outs

# 测试案例生成

按道理，测试案例的输入文件应该是一个超过内存的足够多的数字的文件：比如存放了100亿个数字的文件。

这里为了测试方便，就从内存随机生成了一组数字，自己写到输入文件中

```cpp
bool generateData(string inputsFileName,int total_nums, int heap_size)
{
      /*
     * 生成原始数据, 一行 heap_size 个元素,依此打印出来
     */
    ofstream out;
    out.open(inputsFileName);
    if (!out)
    {
        cout 

# 完整代码

```cpp
#include 
#include 
#include 
#include 
#include 
#include 
#include 
#include 
#include 
#include 
#include  
using namespace std;

typedef pair Pair;
/**
自构建比较函数
**/
struct cmp
{
    bool operator()(Pair a, Pair b) { 
        return a  arr;
    int data;
    std::ifstream inputs(fileName);
    while(inputs>>data)
    {
        arr.push_back(data);
    }
    inputs.close();
    if(arr.empty())
    {
        return false;
    }
    std::ofstream outs(fileName);
    if(arr.size()>1)
    {
        for(int i = 1;isize();++i)
            outs arr;
    ifstream inputs;
    ofstream out;
    string inputsFileName = "./data.txt";
    string outputFileName = "./sortedData.txt";
    vector fileNames;
    srand( (unsigned)time( NULL ) );//srand()函数产生一个以当前时间开始的随机种子

    if(argc != 3) 
    {
        printf("Usage like : ./outerSort 10 100\n");
        return -1;
    }
    heap_size  = atoi(argv[1]);
    total_nums = atoi(argv[2]);

    if(heap_size >data)
    {
        arr.push_back(data);
        if(arr.size()==heap_size)
        {
            sort(arr.begin(),arr.end(),greater());//降序排列
            out.open(fileNames[i++]);
            if (!out)
            {
                cout  Tree; //使用大顶堆构造最大赢者树
    for(string name: fileNames)
    {
        int max;
        // cout>max; //第一个就是最大值
        Tree.push(make_pair(max,name));
        inputs.close();
        delFirstElement(name,firstElement);
    }
    //每次从最大赢者树弹出一个最大值后，再从对应最大堆里面取出一个次大元素，补充进最大赢者树；
    out.open(outputFileName);
    if (!out)
    {
        cout 

程序输出：`./Sort 5 20`，表示总共20个元素，拆成４个子数组，每个数组元素为5个．

```bash
C++ % ./outerSort 5 20
Input Array: 
  1 -   5: 763 375 478 948 822 
  6 -  10: 205 203 333 777  46 
 11 -  15: 175 883 926 696 413 
 16 -  20: 910 680 711 477 327 

948 926 910 883 822 777 763 711 696 680 478 477 413 375 333 327 205 203 175 46 %
```