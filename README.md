# CS Knowledge Wiki

个人计算机科学知识库：数学 · 算法 · 机器学习 · Java · C++ · 存储 · 系统设计 · 工具 · 计算机系统 · 信息安全 · Rust。

基于 [Astro](https://astro.build) + [Iris 主题](https://github.com/LemonAdorable/astro-theme-iris) 构建。

## 快速开始

```bash
npm install          # 需要 Node >= 22.12（本分支 .nvmrc 为 24）
npm run dev          # 自动先准备图片资源，再启动 http://localhost:4321
npm run build        # 产出 dist/
npm run preview      # 预览构建结果
```

## 构建命令（按分支对照）

本仓库有两个构建体系并存。Cloudflare Pages 的**构建命令和输出目录是项目级设置**（Settings → Build & deployments → Build configuration），不分分支，所以切换分支时**两项必须成对修改**：

| 分支 | 构建工具 | **Build command** | **Build output directory** | Node 版本 |
| --- | --- | --- | --- | --- |
| `main` | VitePress | `npm run docs:build` | `docs/.vitepress/dist` | 20+ |
| `astro-iris` | Astro | `npm run build` | `dist` | 22.12+ |

**这两项是一对，必须同时改。** 只改一半的后果：

| 只改了什么 | 结果 |
| --- | --- |
| 只改 Build command，输出目录仍是 `docs/.vitepress/dist` | 构建会「成功」，但 Cloudflare 在 `docs/.vitepress/dist` 里找不到文件，报 `No build output directory found`，或者部署出一个空站 |
| 只改输出目录，命令仍是 `npm run docs:build` | 该脚本在 Astro 分支不存在，构建直接失败：`Missing script: "docs:build"` |
| 两项都改 | ✓ 正常构建并部署 |

为什么两个目录不一样——是各自工具的默认值，本项目都没有改：

- **VitePress**：输出相对于内容根目录 `docs/`，即 `docs/.vitepress/dist`
- **Astro**：默认输出仓库根目录下的 `dist/`（`astro.config.ts` 里没有设置 `outDir`）

### Node 版本（也是项目级设置，同样要跟着分支改）

Cloudflare 决定 Node 版本的优先级，从高到低：

| 来源 | 优先级 | 说明 |
| --- | --- | --- |
| 环境变量 `NODE_VERSION` | **最高** | Pages 项目 → Settings → Environment variables，Production 和 Preview **各有一份** |
| 仓库里的 `.nvmrc` | 次之 | 两个分支都有，但会被上面的环境变量覆盖 |
| `package.json` 的 `engines` | **完全不读** | Cloudflare v3 构建镜像明确不支持从 engines 检测版本，它只影响本地 `npm install` 的警告 |
| 构建镜像默认值 | 最低 | v3 = 22.16.0，v2 = 18.17.1，v1 = 12.18.0 |

两个分支的取值：

| 分支 | `.nvmrc` | `NODE_VERSION` 应设为 | 为什么 |
| --- | --- | --- | --- |
| `main` | `20` | `20` | VitePress 只要求 Node ≥ 20 |
| `astro-iris` | `24` | **`24`** | Astro 6 要求 Node ≥ 22.12.0，低于此版本会直接拒绝启动 |

版本不匹配时 Astro 会明确报错，很容易识别：

```
Node.js v20.20.0 is not supported by Astro!
Please upgrade Node.js to a supported version: ">=22.12.0"
```

> ⚠️ **不要图省事直接删掉 `NODE_VERSION`**。删掉后会回落到构建镜像的默认版本：v3 镜像是 22.16.0（够用），但如果项目还在 v2 镜像（默认 18.17.1）就会失败。显式写死版本最稳妥。
>
> ⚠️ **`NODE_VERSION` 要改两处**：Production 和 Preview 是两个独立的环境变量集合。分支预览部署（如 `astro-iris`）读的是 Preview 那一份，只改 Production 不会生效。

### 在 Cloudflare 上切到 Astro

把这两项改成 Astro 那一行即可，其余不动：

- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Framework preset**: `None`（务必不要选框架预设，否则 Cloudflare 会覆盖构建命令）
- **NODE_VERSION**: 设为 `24`（Production 与 Preview 各一份都要改；不要直接删，理由见上一节）

### 注意

两个分支的依赖树不同（`node_modules` 不随分支切换）。从 `main` 切到本分支或反向切换后，务必重新 `npm install`。

## 目录结构

```
docs/                # 内容源（原 VitePress 的 Markdown，迁移脚本从这里读取）
src/content/docs/    # 迁移生成，Astro 内容集合（906 篇）
scripts/
  migrate-content.mjs   # docs/ -> src/content/docs/ 的迁移脚本
  copy-doc-assets.mjs   # 把被引用的本地图片铺到 public/docassets/
public/              # 静态资源（含从 docs/public 合并的 7MB 素材）
src/utils/sections.ts  # 13 个学科的标题/图标/描述与目录树构建
```

## 内容约定：新笔记怎么进入分类导航

站点的分类来自**两个来源**，按优先级生效：

1. **学科 `index.md` 里的分组链接**（人工编排，决定分组名和顺序）
2. **目录结构**（兜底，只负责"没被列出"的笔记）

### 要出现在某个分组下，就在 index.md 里加一行

编辑 `docs/<学科>/index.md`：

```markdown
## 分布式共识              <!-- 二级分类 -->

- [Basic Paxos](./distributed-consensus/basic-paxos)
- [Raft（一）领导者选举](./distributed-consensus/raft-1-leader-election)

### 消息队列                <!-- 三级子分类（可选） -->

  - [Kafka 两年踩过的坑](./messaging/kafka-practice)

**加粗的标题**              <!-- 四级分组（可选） -->

  - [某篇文章](./某篇文章)
```

支持的层级：`##` → 二级分类，`###` → 三级子分类，`**粗体**` → 四级分组，列表项 → 文章。

链接写法：**相对路径、不带 `.md`**。同目录直接写文件名，子目录写 `./子目录/文件名`，也可以写站点绝对路径 `/数学/xxx`。

### 没写进 index.md 会怎样

不会丢，按顺序兜底：

| 情况 | 归到哪 |
| --- | --- |
| 在某个子目录里 | 该目录成为分类 |
| 正好在学科根目录 | 「未分组」 |
| `index.md` 本身 | 不算文章，只作为导航入口（各章节的「概览」页） |

### 改完之后

```bash
npm run migrate    # 重新生成内容集合，分类自动刷新
```

### 另外两类自动生成的信息

- **标签**：自动取「学科 + 各层目录」，所以 `/tags` 天然是一张扁平索引；在 frontmatter 里写 `tags:` 则用你写的。
- **归档时间**：迁移时从 git 最后一次提交取 `updatedDate`，所以提交越勤，`/archives` 越准。

## 内容迁移

`docs/` 是唯一的内容源，`src/content/docs/` 由脚本生成（可重复执行）：

```bash
npm run migrate      # 重新迁移全部 Markdown
npm run assets       # 重新铺开被引用的图片
```

迁移脚本负责：

- 生成 Iris 必需的 `title` / `description` frontmatter（超长自动截断）
- 从各学科 `index.md` 的链接顺序推导 `order`，保留原有的目录编排
- `::: tip` 容器 → blockquote 提示块
- `==高亮==` → `<mark>`
- 站内绝对链接 `/foo` → `/docs/foo`
- 相对图片 `asset/x.png` → `/docassets/...`
- `docs/about/index.md` **不进知识库**，而是生成为站点自己的 `/about` 页面（`src/pages/about/index.md`，用 Iris 的 `IndividualPage` 布局）

## 说明

- 数学公式由 KaTeX 在构建期渲染（`remark-math` + `rehype-katex`）。
- `public/docassets/` 是构建时生成物（约 790MB，已被 .gitignore 排除）；源图片仍存放在 `docs/**/asset/`，避免仓库重复存储。
- 远程 CDN 图片通过 `src/plugins/remark-remote-images.ts` 绕过 Astro 的图片优化，否则构建期会逐个下载 ~8000 张图。
- 部署目标：Cloudflare Pages（`npm run build`，输出 `dist/`），自定义域名 `cswiki.spumn.eu.cc`。
