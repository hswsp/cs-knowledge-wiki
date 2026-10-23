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

## 两套构建：Astro（主站）+ VitePress（备份）

内容只有一个来源 `docs/`，两个构建体系各自从它派生：

| | Astro 版（主站） | VitePress 版（备份） |
| --- | --- | --- |
| 构建命令 | `npm run build` | `npm run docs:build` |
| 输出目录 | `dist` | `docs/.vitepress/dist` |
| 内容来源 | `docs/` → 自动生成到 `src/content/docs/` | 直接读 `docs/`，无需生成 |
| 需要 Node | ≥ 22.12 | ≥ 20 |
| 本机构建耗时 | 约 2 分钟（1143 页） | 约 5 分钟 |
| 产物大小 | 约 1.2 GB（含 788 MB 图片） | 约 300 MB |

两个命令互不干扰：`npm run build` 会先跑 `prebuild`（生成导航 → 迁移内容 → 铺图片），
`npm run docs:build` 不需要任何预处理。

## 部署到 Cloudflare Pages

两个项目，**同一个仓库、同一个 `main` 分支**，只有下面两项不同。逐字段照抄即可。

| 设置项 | Astro 版（主站） | VitePress 版（备份） |
| --- | --- | --- |
| 关联仓库 | `hswsp/cs-knowledge-wiki` | `hswsp/cs-knowledge-wiki` |
| 生产分支 | **`main`** | **`main`** |
| **Framework preset** | **`None`** | **`None`** |
| **Build command** | **`npm run build`** | **`npm run docs:build`** |
| **Build output directory** | **`dist`** | **`docs/.vitepress/dist`** |
| 环境变量 `NODE_VERSION` | `24`（或删掉该变量） | `24`（或删掉该变量） |
| 开通后的自定义域名 | `cswiki.spumn.eu.cc` | 如 `old.cswiki.spumn.eu.cc` |

> **`Framework preset` 必须选 `None`**。一旦选了 `Astro` 或 `VitePress`，Cloudflare 会用自己的默认命令覆盖你填的构建命令，构建必然失败。

### 部署 Astro 版（主站）

1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. 选择仓库 `cs-knowledge-wiki`，项目名如 `cs-wiki-astro`
3. 构建设置：
   - **Framework preset**：`None`
   - **Build command**：`npm run build`
   - **Build output directory**：`dist`
4. **Environment variables**：`NODE_VERSION` 设为 `24`，或直接删掉这个变量（让 `.nvmrc` 生效）
5. **Save and Deploy**
6. 部署成功后 → **Custom domains** → 添加 `cswiki.spumn.eu.cc`

构建日志正常长这样：先 `prebuild` 输出 `sidebar 路由前缀: 31` / `migrated 897 files` /
`docassets: 1606 copied`，然后 `astro build` 输出 `1143 page(s) built`。

### 部署 VitePress 版（备份）

1. 同样 **Create** → **Pages** → **Connect to Git** → 选同一个仓库
2. 项目名如 `cs-wiki-vitepress`（不能和上面重名）
3. 构建设置：
   - **Framework preset**：`None`
   - **Build command**：`npm run docs:build`
   - **Build output directory**：`docs/.vitepress/dist`
4. **Environment variables**：同上一项目
5. **Save and Deploy**
6. 如需固定地址 → **Custom domains** 绑一个独立域名

构建日志正常长这样：`vitepress v2.0.0-alpha.x` → `building client + server bundles` →
`rendering pages...` → `build complete`。

### 两个项目为什么都用 `main`

`main` 上同时存在 `docs/`（VitePress 的内容与配置）和 `src/`（Astro 的应用），两者文件不重叠：

- Astro 的改动只碰 `src/`、`astro.config.ts`、`scripts/`
- VitePress 直接读 `docs/`，完全不看 `src/`

所以同一次提交能让两个项目各自构建，**写一次内容，两边都更新**，不需要同步。

### `vitepress` 分支是干什么的

仓库里还有一个 `vitepress` 分支，它是纯 VitePress 的**冻结快照**——不含 Astro 任何文件。
用途只有一个：万一 Astro 那套彻底出问题，把备份项目临时切到这个分支就能立刻回到旧站。
日常不需要维护它，它也不会自动跟随 `main` 的内容更新。

### 常见失败对照

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| `Missing script: "..."` | 命令写错，或选了错误的 Framework preset 导致命令被覆盖 | 确认 preset 是 `None`，命令逐字照抄上面的表 |
| `No build output directory found` | 输出目录没跟着命令改 | 两项配对：`npm run build` → `dist`；`npm run docs:build` → `docs/.vitepress/dist` |
| `Node.js v20.x is not supported by Astro!` | 项目环境变量 `NODE_VERSION` 是 20 | 改成 `24`；`scripts/astro-build.mjs` 也有一层兜底 |
| 部署成功但页面 404 | 输出目录填成了上一级或下一级 | 用表格里的值，不要自己补斜杠 |

### Node 版本优先级

| 来源 | 优先级 | 说明 |
| --- | --- | --- |
| 环境变量 `NODE_VERSION` | **最高** | Production 和 Preview **各有一份**，都要改 |
| 仓库 `.nvmrc` | 次之 | 当前为 `24` |
| `package.json` 的 `engines` | **完全不读** | Cloudflare v3 明确不支持从 engines 检测 |
| 构建镜像默认值 | 最低 | v3 = 22.16.0 / v2 = 18.17.1 |

`npm run build` 还额外走了一层 `scripts/astro-build.mjs`：检测到 Node 低于 22.12 时，
会自动用 `npx node@24` 重新执行 Astro，绕开环境变量。所以即使 `NODE_VERSION` 没改对，
Astro 版也能构建成功（代价是每次多下载一次 Node）。

### 从 Astro 回滚到 VitePress

不用改代码，两条路任选：

- **快**：把主站项目的 Build command 改成 `npm run docs:build`、输出改成 `docs/.vitepress/dist`，重新部署
- **稳**：把主站项目的生产分支切到 `vitepress` 分支，重新部署（那边是纯 VitePress 快照）

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
