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

同一个分支里并存两个构建体系，内容只有一个来源 `docs/`：

| 站点 | 构建命令 | 输出目录 | 说明 |
| --- | --- | --- | --- |
| **Astro（主站）** | `npm run build` | `dist` | 内容由 `npm run migrate` 从 `docs/` 生成到 `src/content/docs/` |
| **VitePress（备份）** | `npm run docs:build` | `docs/.vitepress/dist` | 直接读 `docs/`，无需生成步骤 |

两个命令互不干扰，`prebuild` 会先跑导航生成和内容迁移。

### 部署：两个 Cloudflare Pages 项目，同一个分支

| 项目 | Build command | Build output directory |
| --- | --- | --- |
| 主站（如 `cswiki.spumn.eu.cc`） | `npm run build` | `dist` |
| 备份（另一个域名） | `npm run docs:build` | `docs/.vitepress/dist` |

两项是配对的：只改命令不改输出目录，Cloudflare 会报 `No build output directory found`；只改目录不改命令，直接 `Missing script`。

- **Framework preset** 必须选 `None`，否则 Cloudflare 会覆盖构建命令。
- **Node 版本**：`.nvmrc` 已设为 `24`（Astro 6 要求 ≥22.12，VitePress 也兼容）。如果项目里显式设了 `NODE_VERSION` 环境变量，它会覆盖 `.nvmrc`——那个变量必须是 `24`，或干脆删掉。

### Node 版本优先级

| 来源 | 优先级 | 说明 |
| --- | --- | --- |
| 环境变量 `NODE_VERSION` | **最高** | Production 和 Preview **各有一份**，都要改 |
| 仓库 `.nvmrc` | 次之 | 当前为 `24` |
| `package.json` 的 `engines` | **完全不读** | Cloudflare v3 明确不支持从 engines 检测 |
| 构建镜像默认值 | 最低 | v3 = 22.16.0 / v2 = 18.17.1 |

### Node 版本兜底

`npm run build` 走的是 `scripts/astro-build.mjs`，不是直接 `astro build`。原因：Cloudflare 的
`NODE_VERSION` 环境变量优先级高于 `.nvmrc`，一旦它被设成 20，Astro 6 会直接拒绝启动。

包装脚本会检查当前 Node 版本：

- **≥ 22.12** → 直接构建（本地、正常配置的 CI 都走这条）
- **< 22.12** → 自动改用 `npx node@24` 提供的二进制重新执行，绕开环境变量

所以即使 dashboard 里那个变量没改对，构建也能成功。当然还是建议把 `NODE_VERSION` 改成 `24`，
省掉每次构建多下载一次 Node 的开销。

### 切换与回滚

- **想临时回到 VitePress**：把主站项目的构建命令改成 `npm run docs:build`、输出改成 `docs/.vitepress/dist` 即可，代码不用动。
- **VitePress 出问题不影响 Astro**：两套依赖、两套产物，互不引用。

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
