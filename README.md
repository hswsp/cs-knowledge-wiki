# CS Knowledge Wiki

个人计算机知识库，基于 [VitePress](https://vitepress.dev/) 构建，支持中英文。

🌐 在线访问：[cswiki.spumn.eu.cc](https://cswiki.spumn.eu.cc)

## 内容分类

- 数学（Math）
- 算法（Algorithm）
- 机器学习（Machine Learning）
- Java
- C++
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

## 部署到 Cloudflare Pages

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
2. 选择 `cs-knowledge-wiki` 仓库，默认分支 `main`
3. 构建设置：
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
