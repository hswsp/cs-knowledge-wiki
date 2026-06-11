---
title: 存储技术介绍：SATA与NVMe
date: '2023-11-16 20:54:18'
meta: []
permalink: /post/storage-technology-introduction-sata-and-nvme-z17xdo2.html
author:
  name: champagne
  link: https://github.com/hswsp
---


<!-- more -->


# 存储技术介绍：SATA与NVMe

固态驱动器（SSD） 是一种计算机存储设备。与 依靠旋转盘片 的 传统硬盘驱动器（HDD）不同，SSD使用半导体芯片来存储和检索内存。没有任何移动部件，但访问数据比HDD 快得多。

写入和读取数据的主要方法有两种：SATA和 NVMe 。为了增加带宽并减少延迟， NVMe 专为固态硬盘开发，以访问快速存储介质。另一方面，SATA是用于连接SSD，HDD 和光盘驱动器的完善的存储协议 。但是，SATA SSD需要接口控制器，这可能会限制 数据传输并限制CPU性能。与其他传统接口（包括SATA）相比，NVMe 更加高效，可扩展，并提供低延迟的存储访问。

本文将介绍 NVMe 和SATA这两种存储技术，他们的定义及主要区别。

SATA和NVMe其实不是同一个维度的参数，SATA是传输总线或者[物理接口](https://www.zhihu.com/search?q=%E7%89%A9%E7%90%86%E6%8E%A5%E5%8F%A3&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22answer%22%2C%22sourceId%22%3A2184647051%7D)，NVMe是[数据协议](https://www.zhihu.com/search?q=%E6%95%B0%E6%8D%AE%E5%8D%8F%E8%AE%AE&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22answer%22%2C%22sourceId%22%3A2184647051%7D)

[总线接口](https://www.zhihu.com/search?q=%E6%80%BB%E7%BA%BF%E6%8E%A5%E5%8F%A3&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22answer%22%2C%22sourceId%22%3A2184647051%7D)和协议会共同决定一个硬盘的性能，如果用类比的方式来讲的话，<span style="font-weight: bold;" class="bold">传输总线可以类比为公路、数据协议类比为交通规则、物理接口可以类比为汽车</span>，从硬盘这个仓库中运输数据，到底能跑多快就由这三点共同来决定

这三点可以用一张图来表达清楚

![](https://images.spumn.eu.cc/blog/218f7b13533fdf03.webp)

> <span style="font-weight: bold;" class="bold">SATA接口就像是一台</span>​<span style="font-weight: bold;" class="bold">[老爷车](https://www.zhihu.com/search?q=%E8%80%81%E7%88%B7%E8%BD%A6&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22answer%22%2C%22sourceId%22%3A2184647051%7D)</span>​ <span style="font-weight: bold;" class="bold">，只能走弯曲的小路</span>，采用的一定是SATA[总线AHCI协议](https://www.zhihu.com/search?q=%E6%80%BB%E7%BA%BFAHCI%E5%8D%8F%E8%AE%AE&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22answer%22%2C%22sourceId%22%3A2184647051%7D)，最大传输速度550M/S
> <span style="font-weight: bold;" class="bold">M.2接口则像是一台跑车，更加灵活，能走</span>​<span style="font-weight: bold;" class="bold">[高速公路](https://www.zhihu.com/search?q=%E9%AB%98%E9%80%9F%E5%85%AC%E8%B7%AF&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22answer%22%2C%22sourceId%22%3A2184647051%7D)</span>​<span style="font-weight: bold;" class="bold">也能走小路，既可以搭载SATA</span>​<span style="font-weight: bold;" class="bold">[总线](https://www.zhihu.com/search?q=%E6%80%BB%E7%BA%BF&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22answer%22%2C%22sourceId%22%3A2184647051%7D)</span>​ <span style="font-weight: bold;" class="bold">，也可以搭载PCIe总线：</span> 
> socket2类型的M.2接口可以搭载SATA总线，采用AHCI协议，最快速度为<span style="font-weight: bold;" class="bold">550M/S</span>
> socket3类型的M.2接口可以搭载PCIe3.0*4的总线，<span style="font-weight: bold;" class="bold">如果搭载了NVMe那么最快速度就可以到4G/S</span>，如果没搭载NVMe则会慢一些

了解了这三点的概念，到了正式选择的时候就需要看自己的主板情况以及实际的需求了

如果但从性能的角度来看，NVMe协议的硬盘肯定是[PCIe总线](https://www.zhihu.com/search?q=PCIe%E6%80%BB%E7%BA%BF&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22answer%22%2C%22sourceId%22%3A2184647051%7D)，所以性能一定是大于SATA盘的，<span style="font-weight: bold;" class="bold">所以追求性能的话，就选NVMe就行了</span>

<span style="font-weight: bold;" class="bold">当然选择硬盘建议不能只考虑协议和总线，还需要考虑硬盘的4K随机读写速度、要选择的容量大小，还有硬盘的颗粒主控和缓存</span>

# <span style="font-weight: bold;" class="bold">什么是NVMe？</span>

NVMe ，或非易失性存储器快， 是一个数据，该主机连接到经由PCI存储器子系统的存储协议 快速（PCIe）总线 。他的接口规范 的缓解数据瓶颈量很大，带来的各种性能的改进，包括多个命令队列，并减少等待时间。 NVMe具体优势包括：性能有数倍的提升；可大幅降低延迟；NVMe可以把最大队列深度从32提升到64000，SSD的IOPS能力也会得到大幅提升；自动功耗状态切换和动态能耗管理功能大大降低功耗；NVMe标准的出现解决了不同PCIe SSD之间的驱动适用性问题。NVMe扩展到了诸如以太网，光纤通道和InfiniBand®，不仅可以访问单个NVMe设备，还可以访问NVMe存储系统。

# <span style="font-weight: bold;" class="bold">什么是SATA？</span>

SATA（或 串行 ATA）是用于连接SSD，HDD 和光盘驱动器的完善协议。 自2000年发布以来，该标准已进行了多次 性能增强修订。 例如，SATA I可以 高达150 MB / s的速度传输数据，而 SATA III 可以达到600 MB / s的速度。

但是，SATA SSD需要接口控制器， 这可能会限制数据传输并限制CPU性能。 具体地说，SATA使用高级主机控制器接口（AHCI），该接口包含 单个队列 块I / O层 ，该层将数据从主机发送到SSD。

AHCI和NVMe 接口控制器之间的关键区别在于块I / O层的类型。AHCI具有 一个 单队列I / O块层 ，这意味着来自每个CPU内核上运行的任务的所有I / O请求都是通过单个请求队列处理的。这从根本上造成了瓶颈， 因为单个队列无法充分利用存储的全部潜力。 另一方面， NVMe 利用多队列块I / O层，显着提高了可伸缩性。为了 减少延迟，多队列块I / O层使用了两个级别的队列：软件队列（SWQ）和硬件队列（HWQ）。 总之， NVMe SSD具有高度可扩展的架构，可以减轻相关的问题与性能瓶颈。

鉴于这些通信驱动程序在体系结构上的根本差异 ，它们在各个方面都具有不同的特征，包括与存储设备的兼容性，性能和数据延迟。

# <span style="font-weight: bold;" class="bold">NVMe的主要优点</span>

低延迟：随着增加的带宽和内部并行， NVMe 消除 I/O 瓶颈消耗 的是，在传统的存储协议持久， 因此减少在读出和写入数据的等待时间。

可扩展的 性能： NVMe 通过与PCIe 3.0通道直接接触来提供数据，从而减轻了使用连接技术时可能出现的数据瓶颈。 此功能 提供了可扩展的 性能 是需要 重新在边缘flexive推理分析。

可靠的存储： NVMe 将数据存储在没有活动部件的闪存中。这样可以 最大程度地减少灾难性故障的可能性， 并有助于提高边缘设备的耐用性。

节能 ： NVMe 架构 包含 可调节 SSD功率的功能。 高效的电源管理将帮助 企业实现最佳的总拥有成本（TCO）， 并延长电池寿命。
