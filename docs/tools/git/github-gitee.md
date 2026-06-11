---
title: 同一电脑上同时使用GitHub和Gitee
date: 2022-09-02
---

::: info
有些教程说并需要清空全局用户名和邮箱。这是错的！！！！

并不需要清除这些。全局用户名和邮箱只是你SSH对方时候，作为本机的识别标识。
:::

# 创建 ssh key

```bash
# 进入用户目录下的 .ssh 文件夹下，路径会因你使用的操作系统不同而略有差异
# 没有这个文件夹也无所谓，直接运行下一句命令也可以
cd ~/.ssh

# 生成 key，将邮件地址替换为你 Gitee 或者 Github 使用的邮件地址
ssh-keygen -t rsa -C "xxx@xxx.com"
```

接下来应该会看到下面的提示：

```swift
Generating public/private rsa key pair.
Enter file in which to save the key (/c/Users/your_user_name/.ssh/id_rsa): /c/Users/your_user_name/.ssh/id_rsa_gitee
```

这一步如果默认回车，会生成名为 id_rsa 的文件，你可以输入不同的名字来便于识别文件，比如生成 Gitee 的 ssh key 可以设置为 id_rsa_gitee，设置 Github 的 ssh key 可以设置为 id_rsa_github .
 然后一直回车就可以了

# 在 Gitee 和 Github 添加 public key

找到用户目录下的 .ssh 文件夹，查看并复制创建好的 id_rsa_gitee.pub 或 id_rsa_github.pub 的内容。

```bash
cd ~/.ssh
# 查看 id_rsa_gitee.pub 文件内容
cat id_rsa_gitee.pub
```

复制文件内容打开 Gitee 和 Github 的网站找到设置，再找到 SSH Keys，添加复制的 public key 。
 id_rsa_gitee.pub的添加给Gitee ，id_rsa_github .pub的添加到Github 。

# 创建配置文件

在 .ssh 文件夹中创建 config 文件，添加以下内容以区分两个 ssh key：

```ruby
# gitee
Host gitee.com
HostName gitee.com
PreferredAuthentications publickey
IdentityFile ~/.ssh/id_rsa_gitee

# github
Host github.com
HostName github.com
PreferredAuthentications publickey
IdentityFile ~/.ssh/id_rsa_github
```

# 测试连接是否正常

在命令行输入：

```css
ssh -T git@github.com
```

若返回如下内容，则 Github 连接正常：

```rust
Hi yourname! You've successfully authenticated, but GitHub does not provide shell access.
```

继续在命令行输入：

```css
ssh -T git@gitee.com
```

若返回如下内容，则 Gitee 连接正常。

```rust
Hi yourname! You've successfully authenticated, but GitHub does not provide shell access.
```
