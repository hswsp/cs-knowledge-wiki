---
title: 用github pages + hexo搭建博客详细教程
description: "Hexo 是一个博客框架。它把本地文件里的信息生成一个网页。"
date: 2022-08-30
---

# Github Pages

github pages 是github提供给用户用来展示个人或者项目主页的静态网页系统。每个用户都可以使用自己的github项目创建，上传静态页面的html文件，github会帮你自动更新你的页面。

操作如下：

1. 注册 Github 账号，然后在 Github 中创建一个以 .github.io 结尾的 Repository。
   - Repository name: 自定义名字.github.io
   - 勾选 Initialize this repository with a README
   - Create repository

2. 简单地编辑一下 README.md 这个文档。 比如添加：I am trying to create my own blog…
   保存(Commit changes)。
3. 打开网页：你自定义的名字.github.io 这里就可以看到 README.md 里的内容了。 如果没有太多的要求，其实直接用README.md 来写博客也是不错的。

这个生成好的 Repository 就是用来存放静态网页的地方，也只有这个仓库里的内容，才会被 **simonhans.github.io** 这个网页显示出来。

# Hexo安装

Hexo 是一个博客框架。它把本地文件里的信息生成一个网页。如果不需要放在网上给别人看，就没 Github Pages 什么事了。

使用 Hexo 之前，需要先安装 Node.js 和 Git。

## 安装 Node.js

1. 前往 https://nodejs.org/en/，点击 8.9.1 LTS 下载。安装(MacOS可以使用 `brew install node`)

2. 打开 命令行终端， 输入 `node -v`

```bash
 $ node -v
 v12.16.1
```

## 安装 Git

略

## 安装 Hexo

1. 打开 Command Prompt
2. 输入 `npm install -g hexo-cli`回车开始安装
3. 输入 `hexo -v`

```bash
$ hexo -v
hexo-cli: 4.2.0
os: Windows_NT 10.0.17134 win32 x64
node: 12.16.1
v8: 7.8.279.23-node.31
uv: 1.34.0
zlib: 1.2.11
brotli: 1.0.7
ares: 1.15.0
modules: 72
nghttp2: 1.40.0
napi: 5
llhttp: 2.0.4
http_parser: 2.9.3
openssl: 1.1.1d
cldr: 35.1
icu: 64.2
tz: 2019c
unicode: 12.1
```

## 创建本地博客

1. 在D盘下创建文件夹 blog
2. 鼠标右键 blog，选择 Git Bash Here。 如果没有安装 Git，就不会有这个选项。
3. Git Bash 打开之后，所在的位置就是 blog 这个文件夹的位置。（/d/blog）
4. 输入 `hexo init` 将 blog 文件夹初始化成一个博客文件夹，可能时间会有点长。
5. 输入 `npm install` 安装依赖包。
6. 输入 `hexo g` 生成（generate）网页。 由于我们还没创建任何博客，生成的网页会展示 Hexo 里面自带了一个 Hello World 的博客。
7. 输入 `hexo s` 将生成的网页放在了本地服务器（server）。

```bash
$ hexo s
INFO  Validating config
INFO  Start processing
INFO  Hexo is running at http://localhost:4000 . Press Ctrl+C to stop.
```

8. http://localhost:4000/ 。 就可以看到刚才的成果了。

9. 回到 Git Bash，按 Ctrl+C 结束，此时再看 http://localhost:4000/ 就是无法访问了。

# Hexo使用

Welcome to [Hexo](https://hexo.io/)! （中文官网：[Hexo](https://hexo.io/zh-cn/) ）Check [documentation](https://hexo.io/docs/) for more info. If you get any problems when using Hexo, you can find the answer in [troubleshooting](https://hexo.io/docs/troubleshooting.html) or you can ask me on [GitHub](https://github.com/hexojs/hexo/issues).

## Quick Start

1. Create a new post

``` bash
$ hexo new "My New Post"
```

More info: [Writing](https://hexo.io/docs/writing.html)

2. Run server

``` bash
$ hexo server
```

More info: [Server](https://hexo.io/docs/server.html)

3. Generate static files

``` bash
$ hexo generate
```

More info: [Generating](https://hexo.io/docs/generating.html)

4. Deploy to remote sites

``` bash
$ hexo deploy
```

More info: [Deployment](https://hexo.io/docs/one-command-deployment.html)

每次修改之后，使用下面命令重新部署：

```bash
hexo clean && hexo g && hexo d
```

推送过程中可能因为数据量大而失败，使用下面命令解决：

```
git config --global http.postBuffer 524288000
```

（将 buffer 增加到 500MB）

## 发布一篇博客

1. 在 Git Bash 里，所在路径还是 /d/blog。输入 `hexo new “My First Post”`
2. 在 D:\blog\source_posts 路径下，会有一个 My-First-Post.md 的文件。 编辑这个文件，然后保存。
3. 回到 Git Bash，输入 `hexo g`
4. 输入 `hexo s`
5. 前往 http://localhost:4000/ 查看成果。
   ![在这里插入图片描述](https://cdn.spphoto.top/img/20250710232040.png)

## 更换主题

嫌弃自带的主题，可以用官网的一些[优秀主题模板](https://hexo.io/themes/)，当然有能力也可以按官网文档来自定义

以[hexo-theme-fluid](https://github.com/fluid-dev/hexo-theme-fluid)主题为例

1. 下载主题，在git bash中博客根目录

```bash
$ git clone https://github.com/fluid-dev/hexo-theme-fluid.git themes/fluid
```

2. 修改_config.yml中的theme: landscape改为theme: fluid，然后重新执行`hexo g`来重新生成

3. 输入 `hexo clean && hexo s` (或者` hexo cl`—清除缓存 )启动项目

详细参考主题README.md文档：[Hexo Fluid 用户手册](https://hexo.fluid-dev.com/docs/)

## 将本地 Hexo 博客部署在 Github 上

前面两个部分，我们已经有了本地博客，和一个能托管这些资料的线上仓库。只要把本地博客部署（deploy）在我们的 Github 对应的 Repository 就可以了。

操作如下：

1. 获取 Github 对应的 Repository 的链接。

2. 登陆 Github，进入到 ryanluoxu.github.io

3. 点击 Clone or download

4. 复制 URL,我的是 https://github.com/Simonhans/simonhans.github.io.git

5. 修改博客的配置文件

   打开本地博客路径下blog/_config.yml （使用 bash 里的 vi 或者 notepad++）找到 `#Deployment`，填入以下内容：

   ```bash
   deploy:
     type: git
     repository: https://github.com/Simonhans/simonhans.github.io.git
     branch: master
   ```

6. 部署，回到 Git Bash，需要先安装`hexo-deployer-git`插件

7. 回到 Git Bash

   ```bash
   npm install hexo-deployer-git --save
   ```


8. 输入 `hexo d`
9. 得到 INFO Deploy done: git 即为部署成功
10. 查看成果，https://simonhans.github.io
    
# 域名绑定js.org

可以申请自己域名来绑定自己的博客地址https://simonhans.github.io，博主这里用的js.org免费二级域名

很多知名项目会把自己的文档托管在 .js.org 域名下面，作为开发者，拥有一个是一件很酷的事。官网：[jsorg](https://js.org/)

![在这里插入图片描述](https://cdn.spphoto.top/img/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3dlaXhpbl80MzcxMzEwNQ==,size_16,color_FFFFFF,t_70-20250710234243907.png)

1. 在你的github pages里的博客项目下新建CNAME文件，内容为你需要申请的js.org域名，例如：

```bash
simonhans.js.org
```

2. 此时你再访问之前你的XXX.github.io已经无法访问并跳转到了CNAME文件里面的网址。使用过域名解析的都知道，目前只是单方面绑定了，js.org那边还没绑定你的地址

3. 进入js.org官方仓库：https://github.com/js-org/js.org 点击右上角的fork，你会发现这个仓库被fork到自己名下了。

   ![在这里插入图片描述](https://cdn.spphoto.top/img/20201028120351288.png)

4. 修改fork过来的仓库中`cnames_active.js`文件，注意他是按照字母排序的，请找到相应位置写入。例如：

```bash
"simonhans": "simonhans.github.io",
```

前部分表示你要申请的二级域名，也就是之前说的XXX，后部分表示你的GitHub仓库名

5. 回到你fork的仓库，点击Pull Request，并提交它。然后就是等待审核
6. 审核通过你会收到下图所示邮件：
   ![在这里插入图片描述](https://cdn.spphoto.top/img/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3dlaXhpbl80MzcxMzEwNQ==,size_16,color_FFFFFF,t_70-20250710234320465.png)
7. 通过后不要着急，人家只是通过了你的申请，但是还没给你解析呢，解析后会收到下图所示邮件：
   ![在这里插入图片描述](https://cdn.spphoto.top/img/20201028122330166-20250711000203893.png)
8. 现在就可以用你申请的域名访问你的博客了，我的博客:
   ![在这里插入图片描述](https://cdn.spphoto.top/img/watermark%2Ctype_ZmFuZ3poZW5naGVpdGk%2Cshadow_10%2Ctext_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3dlaXhpbl80MzcxMzEwNQ%3D%3D%2Csize_16%2Ccolor_FFFFFF%2Ct_70-20250710234350104.png)



但是现在js.org已经不支持个人博客了。我们可以自己购买一个域名进行绑定。

# 配置个人域名

## 申请域名

这里就不介绍了，详情百度，建议阿里云购买，腾讯云也可以

如果有域名了就不多说了。这里就直接去购买域名的地方去解析域名

## 解析域名

如果没有实名记得实名

打开购买域名的网址，这里我就使用阿里云做演示。

我是在阿里云购买的域名，这里以阿里云的操作为例，登陆阿里云，依次进入`控制台-万网-域名` 找到已购买的域名点击解析按钮，添加三项解析

![image](https://cdn.spphoto.top/img/5615781-03cc818f75427083.webp)



前两项是Github Pages绑定域名教程里提示添加的；

> Custom domain
>
> Custom domains allow you to serve your site from a domain other than `hswsp.github.io`. [Learn more](https://docs.github.com/articles/using-a-custom-domain-with-github-pages/).

点击 Learn more:

> Navigate to your DNS provider and create either an `ALIAS`, `ANAME`, or `A` record. You can also create `AAAA` records for IPv6 support. For more information about how to create the correct record, see your DNS provider's documentation.
>
> - To create an `ALIAS` or `ANAME` record, point your apex domain to the default domain for your site. For more information about the default domain for your site, see "[About GitHub Pages](https://docs.github.com/en/articles/about-github-pages#types-of-github-pages-sites)."
>
> - To create`A`records, point your apex domain to the IP addresses for GitHub Pages.
>
>   ```shell
>   185.199.108.153
>   185.199.109.153
>   185.199.110.153
>   185.199.111.153
>   ```

就把这几项配到A record里面。

后一项是为了绑定www,注意添加的时候不要忘了最后面的那个"点"  即 hswsp.github.io.

## CNAME配置

进入设置，找到 Custom domain添加域名后保存即可，它会自动在你的repository相应的branch里生成一个CNAME的文件。

![image](https://cdn.spphoto.top/img/webp)

但是由于是静态博客，每次Hexo都会重新把之前的所有内容删除重写。所以我们需要把这个CNAME写到我们的Hexo源文件里。

桌面新建CNAME文件，不要后缀。在该文件里写入你的域名。例如我的：

```bash
yuxiaoshao.top
```

把cname放入博客根目录的source文件夹下，然后hexo cl，hexo g,hexo deploy

之后就可以通过域名访问了

## https支持配置

下面进行GitHub的设置，打开GitHub仓库的settings，在custom domain 中填上刚申请的域名（如果是用namecheap的域名，GitHub Pages会自动填充域名），勾选enforce https，使能https支持，如下图所示。

![img](https://cdn.spphoto.top/img/2787497-03fa5a9ab8194014.webp)



**最后，别忘记修`_config.yml`里配置的`url`！！！！**

# 配置七牛云图床

1. 创建七牛云存储空间

   ![image-20220330002946984](https://cdn.spphoto.top/img/6c4fcf368c805a142c67076eef32a3e1.png)

2. 给自己的域名添加二级域名

   > 这里用阿里云的举例

进入[阿里云域名列表](https://dc.console.aliyun.com/next/index?#/domain-list/all)

选择解析

![image-20220330003123314](https://cdn.spphoto.top/img/0747689e1cdc2205b238140aa93e8416.png)

然后添加一个二级域名，这个完了先不要关，等下还要改

![image-20220330003356467](https://cdn.spphoto.top/img/8de4e1820d58da359b6b48fada2b63ce.png)

3. 绑定二级域名

进入[七牛云域名绑定页面](https://portal.qiniu.com/cdn/domain)，点击添加域名，然后下图只需要把刚刚配置的域名写上，然后其余默认就行，点击创建

![image-20220330003544871](https://cdn.spphoto.top/img/66cd88be1aa780a8fda147c1faea7b51.png)

这里由于是github.io，没有进行备案，只能申请海外服务器。同时在绑定域名后会让你进行TXT记录验证。输入它给的主机名和主机值新增一条域名解析即可。

然后回到上一个页面，跟着下图操作

![image-20220330003733736](https://cdn.spphoto.top/img/61f324a844768635a01bb06b50866447.png)

![image-20220330003847097](https://cdn.spphoto.top/img/4699773498babd6a54a6016f80e908e1.png)

![image-20220330003847097](https://cdn.spphoto.top/img/4699773498babd6a54a6016f80e908e1-20250711002202305.png)

然后回到刚刚添加域名的页面，点击刚刚添加的域名，把www.baidu.com改成刚刚复制的东西

配置完了之后等一会，系统审核完成后会发邮件，等状态变成成功说明配置完成了

4. 配置PicGO

进入七牛云页面，右上角头像->密钥管理->复制 AccessKey和SecretKey到PicGo中，

- 存储空间名是你第二步建立的空间的名字
- 网址是刚刚绑定的那个二级域名。注意加上http。
- 存储区域：七牛云的存储区域（华东 z0，华北 z1，华南 z2，北美 na0，东南亚 as0 ），根据你空间所在的区域，填对应的代码

![image-20220330004201058](https://cdn.spphoto.top/img/842bafe5e6389bee18752ec69c1a7930.png)

# ssl免费证书申请

但是，hexo使用七牛图床 放到github pages上无法显示。问题的根源在于 谷歌浏览器 ， 在https的网站里面放http格式的图片，那么http的链接会被自动转为https，从而导致找不到链接，会显示叉叉。

故而在七牛云申请一个免费的SSL证书。**在ssl证书服务中选择购买证书，选择免费的TrustAsia证书**。

![8b5962587655cdfbe59cb805083481abb2e.jpg](https://cdn.spphoto.top/img/8b5962587655cdfbe59cb805083481abb2e.jpg)

**核对信息，确认支付即可**

![ba24df3b5b7785726ee3a084c73ebfb7929.jpg](https://cdn.spphoto.top/img/ba24df3b5b7785726ee3a084c73ebfb7929.jpg)

**补全相关信息**

![4f66317234eb658ca59865dbdb9e5fc2258.jpg](https://cdn.spphoto.top/img/4f66317234eb658ca59865dbdb9e5fc2258-20250711002954633.jpg)

具体参见[证书申请指南](https://developer.qiniu.com/ssl/3667/ssl-certificate-of-free-dns-validation-guide)

# 创建相册页面

新建相册页 `hexo new page photos`,编辑 `/source/photos/index.md`，输入以下内容：

```markdown
