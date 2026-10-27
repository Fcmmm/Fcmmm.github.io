# Fcmmm's Blog

**项目地址：<https://fcmmm.xyz>** ｜ **源码仓库：<https://github.com/Fcmmm/Fcmmm.github.io>**

[![Deploy Blog](https://github.com/Fcmmm/Fcmmm.github.io/actions/workflows/deploy.yml/badge.svg?branch=source)](https://github.com/Fcmmm/Fcmmm.github.io/actions/workflows/deploy.yml)

一个基于 **Hexo + Butterfly** 的个人技术博客，记录技术教程、开发心得与生活随笔。站点以静态生成为核心，动态能力通过自建服务与 Serverless 补齐：网易云音乐代理与全站播放器、密码保护的私人图库、Artalk 评论、Umami 访问统计，以及基于 Decap CMS 的在线写作后台。

## 功能特性

- **博客主体**：文章、分类、标签、归档、时间轴；本地搜索、RSS、站点地图、Open Graph / JSON-LD。
- **音乐馆**：自建网易云音乐 API 代理，支持歌单播放与双语滚动歌词；音乐馆与全站悬浮播放器双向同步。
- **私人图库**：密码在服务端校验，支持服务器目录与 Cloudinary 双数据源，前端不接触密钥。
- **评论系统**：自建 Artalk（Docker + SQLite，邮件通知、后台审核），Giscus 保留用于查看历史评论。
- **访问统计**：自建 Umami + PostgreSQL，展示站点 UV / PV 与单篇文章 PV；统计接口的 API key 由 Nginx 在服务端注入。
- **在线写作**：Decap CMS + GitHub OAuth，可在手机或电脑浏览器直接编辑并发布 Markdown。
- **使用体验**：深色模式、PJAX 无刷新跳转、响应式布局、文章目录与阅读时长。

## 技术栈

| 模块 | 技术 |
| --- | --- |
| 静态站点 | Hexo 8.1.2、Butterfly 5.3.2（Pug + Stylus） |
| 运行环境 | Node.js 22、Nginx、阿里云 ECS、宝塔面板 |
| 音乐服务 | 零依赖 Node.js HTTP 代理、APlayer 1.10.1、Meting.js 2.0.1 |
| Serverless | Vercel Functions（GitHub OAuth / 图库 / 音乐备用）、Cloudflare Worker |
| 内容管理 | Decap CMS + GitHub OAuth |
| 评论 / 统计 | Artalk（SQLite）、Umami 3.4.1 + PostgreSQL 15 |
| 自动化 | GitHub Actions、GitHub Pages、rsync |

## 架构概览

```text
写作 / git push source
        │
        ▼
GitHub Actions ── npm install → hexo generate → public/
        ├── peaceiris/actions-gh-pages → main 分支（GitHub Pages）
        └── rsync → 阿里云 ECS + Nginx（主站）

浏览器 → https://fcmmm.xyz
        ├── /                 静态页面
        ├── /api/music        网易云音乐 API 代理（Node.js，127.0.0.1:3001）
        ├── /api/gallery      私人图库（服务端密码校验）
        ├── /api/comments     Artalk 评论
        └── /api/umami        Umami 统计（管理后台：stats.fcmmm.xyz）
```

> 本地预览（`localhost:4000`）没有 Nginx 反代，音乐、评论、统计等依赖 `/api/*` 的功能无法正常工作；GitHub Pages 预览域名同样没有这些接口。

## 目录结构

```text
.
├── source/                  # 站点内容
│   ├── _posts/              # Markdown 文章
│   ├── _data/               # 友链、图库等数据
│   ├── admin/               # Decap CMS 后台
│   ├── css/                 # 自定义样式
│   ├── js/                  # 自定义脚本（含统计兜底显示）
│   └── img/                 # 站点图片资源
├── themes/butterfly/        # Butterfly 主题（含 Umami 统计集成）
├── server/
│   └── music-api.js         # 网易云音乐 API 代理
├── vercel-api/              # Vercel Functions（OAuth / 图库 / 音乐）
├── cloudflare-worker/       # Cloudflare Worker（图库备用实现）
├── deploy/
│   ├── umami/               # Umami 部署手册与 Compose 配置
│   └── artalk/              # Artalk 部署手册与 Compose 配置
├── .github/workflows/       # GitHub Actions 构建与部署
├── _config.yml              # Hexo 配置
├── _config.butterfly.yml    # 主题配置
└── 操作手册.md              # 日常写作与运维手册
```

## 本地开发

需要 Node.js 22（与 CI 保持一致）。

```bash
# 安装依赖
npm install

# 本地预览：http://localhost:4000
npx hexo server

# 生成静态文件到 public/
npx hexo generate

# 清理缓存与产物（修改配置后推荐）
npx hexo clean
```

## 部署

推送到 `source` 分支后，GitHub Actions 会自动完成构建与双端部署：

1. `npm install` + `npx hexo generate`，产物输出到 `public/`；
2. 将 `public/` 发布到 `main` 分支（GitHub Pages）；
3. 通过 rsync 将 `public/` 同步到阿里云站点目录，并将 `server/` 同步到服务器；
4. 从 GitHub Secrets 注入服务器环境变量（如图库密码）。

敏感信息不进入仓库：服务器配置位于 `.env`（已 gitignore），Umami API key 只存在 Nginx 配置中，部署凭据统一使用 GitHub Secrets。

## 文档

- [博客操作手册](https://github.com/Fcmmm/Fcmmm.github.io/blob/source/操作手册.md)：写作、配置、部署与故障排查
- [Umami 部署手册](https://github.com/Fcmmm/Fcmmm.github.io/blob/source/deploy/umami/README.md)
- [Artalk 部署手册](https://github.com/Fcmmm/Fcmmm.github.io/blob/source/deploy/artalk/README.md)

## 版权

- 博客文章：除特别注明外，采用 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) 许可。
- 主题 [Butterfly](https://github.com/jerryc127/hexo-theme-butterfly) 采用 Apache-2.0 许可；其余依赖版权归各自作者所有。
