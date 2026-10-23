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

| 分支 | 构建工具 | 构建命令 | 输出目录 | Node 版本 |
| --- | --- | --- | --- | --- |
| `main` | VitePress | `npm run docs:build` | `docs/.vitepress/dist` | 20+ |
| `astro-iris` | Astro | `npm run build` | `dist` | 22.12+ |

Cloudflare 的这两项是**项目级设置**（Settings → Build & deployments → Build configuration），不分分支，所以：

- 生产分支是 `main` 时 → 用 VitePress 那一行
- 把生产分支或预览切到 `astro-iris` 时 → 改成 Astro 那一行

Node 版本由仓库里的 `.nvmrc` 决定（`main` 是 20，`astro-iris` 是 24）。如果 Cloudflare 项目里显式设了 `NODE_VERSION` 环境变量，它会覆盖 `.nvmrc`，需要一并修改。

## 部署到 Cloudflare Pages

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
2. 选择 `cs-knowledge-wiki` 仓库，默认分支 `main`
3. 构建设置（`main` 分支 / VitePress，完整对照见上一节）：
   - **Framework preset**: `None`
   - **Build command**: `npm run docs:build`
   - **Build output directory**: `docs/.vitepress/dist`
   - **Environment variables**: `NODE_VERSION = 20`
4. 部署完成后，**Custom domains** → 添加子域名 `cswiki.spumn.eu.cc`，Cloudflare 会自动签发 HTTPS

> ⚠️ **注意**：Framework preset 必须选 `None`，不能选 `VitePress`，否则 Cloudflare 会覆盖构建命令导致构建失败。

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
