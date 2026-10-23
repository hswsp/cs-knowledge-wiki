# CS Knowledge Wiki

个人计算机知识库，基于 [VitePress](https://vitepress.dev/) 构建，支持中英文。

🌐 在线访问：[cswiki.spumn.eu.cc](https://cswiki.spumn.eu.cc)

## 内容分类

- 数学（Math）
- 算法（Algorithm）
- 机器学习（Machine Learning）
- Java
- C++
- Rust
- 数据库（Database）
- 系统设计（System Design）

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run docs:dev

# 构建生产产物
npm run docs:build

# 本地预览生产产物
npm run docs:preview
```

## 构建命令（按分支对照）

同一套 Cloudflare Pages 项目在切换分支时，**必须同步修改构建命令和输出目录**，两者是配对的：

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

为什么两个目录不一样——是各自工具的默认值，两个分支都没有改：

- **VitePress**：输出相对于内容根目录 `docs/`，即 `docs/.vitepress/dist`
- **Astro**：默认输出仓库根目录下的 `dist/`（`astro.config.ts` 里没有设置 `outDir`）

Cloudflare 的这两项是**项目级设置**（Settings → Build & deployments → Build configuration），不分分支，所以：

- 生产分支是 `main` 时 → 用 VitePress 那一行
- 把生产分支或预览切到 `astro-iris` 时 → 改成 Astro 那一行

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

切到 `astro-iris` 时如果忘了改这个变量，构建会停在：

```
Node.js v20.20.0 is not supported by Astro!
Please upgrade Node.js to a supported version: ">=22.12.0"
```

> ⚠️ **不要图省事直接删掉 `NODE_VERSION`**。删掉后会回落到构建镜像的默认版本：v3 镜像是 22.16.0（够用），但如果项目还在 v2 镜像（默认 18.17.1）就会失败。显式写死版本最稳妥。
>
> ⚠️ **`NODE_VERSION` 要改两处**：Production 和 Preview 是两个独立的环境变量集合。分支预览部署（如 `astro-iris`）读的是 Preview 那一份，只改 Production 不会生效。

## 部署到 Cloudflare Pages

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
2. 选择 `cs-knowledge-wiki` 仓库，默认分支 `main`
3. 构建设置（`main` 分支 / VitePress，完整对照见上一节）：
   - **Framework preset**: `None`
   - **Build command**: `npm run docs:build`
   - **Build output directory**: `docs/.vitepress/dist`
   - **Environment variables**: `NODE_VERSION = 20`（Production 与 Preview 各一份；切到 `astro-iris` 时必须都改成 `24`，详见上一节）
4. 部署完成后，**Custom domains** → 添加子域名 `cswiki.spumn.eu.cc`，Cloudflare 会自动签发 HTTPS

> ⚠️ **注意**：Framework preset 必须选 `None`，不能选 `VitePress`，否则 Cloudflare 会覆盖构建命令导致构建失败。

## 内容约定：新笔记怎么进入侧边栏

侧边栏的分组来自 `docs/<学科>/index.md`，不是目录结构。想让一篇笔记出现在某个分组下，就在对应学科的 `index.md` 里加一行：

```markdown
## 分布式共识              <!-- 二级分组 -->

- [Basic Paxos](./distributed-consensus/basic-paxos)
- [Raft（一）领导者选举](./distributed-consensus/raft-1-leader-election)

### 消息队列                <!-- 三级子分组（可选） -->

  - [Kafka 两年踩过的坑](./messaging/kafka-practice)

**加粗的标题**              <!-- 四级分组（可选） -->

  - [某篇文章](./某篇文章)
```

支持的层级：`##` → 二级分组，`###` → 三级子分组，`**粗体**` → 四级分组，列表项 → 文章。

链接写法：**相对路径、不带 `.md`**。同目录直接写文件名，子目录写 `./子目录/文件名`。

### 没写进 index.md 会怎样

页面仍然存在、URL 可以访问，但**不会出现在侧边栏**——只能靠搜索找到。所以新笔记记得补链接。

### 三个例外：手写侧边栏

这三个专题的侧边栏是手写文件，不走 `index.md`：

| 专题 | 文件 |
| --- | --- |
| 安全攻防 | `docs/.vitepress/securitySidebar.js` |
| 实用密码学 | `docs/.vitepress/practicalCryptographySidebar.js` |
| AI 基础设施 | `docs/.vitepress/aiInfraSidebar.js` |

改这三处即可，格式是普通的 `{ text, link, items }` 数组。

### 改完之后

```bash
npm run docs:dev    # 本地就能看到侧边栏变化，不需要额外构建步骤
```

> 提示：`astro-iris` 分支上，这套 `index.md` 分组同样决定 `/categories` 的分类层级，那边的约定见该分支 README。

## 目录结构

```
docs/
├── .vitepress/
│   ├── config.js          # 站点配置（i18n / nav / sidebar）
│   └── theme/             # 自定义主题色
├── public/                # 静态资源（logo, favicon）
├── index.md               # 中文首页
├── math/                  # 中文 - 数学
├── algorithm/             # 中文 - 算法
├── java/                  # 中文 - Java
├── cpp/                   # 中文 - C++
├── rust/                  # 中文 - Rust
├── database/              # 中文 - 数据库
├── system-design/         # 中文 - 系统设计
├── ml/                    # 中文 - 机器学习
├── about/                 # 中文 - 关于
└── en/                    # 英文镜像
    ├── index.md
    ├── math/
    ├── algorithm/
    ├── ml/
    ├── java/
    ├── cpp/
    ├── database/
    ├── system-design/
    └── about/
```

## License

MIT
