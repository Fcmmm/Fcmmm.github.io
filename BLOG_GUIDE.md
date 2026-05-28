# Hexo + Butterfly 博客操作手册

## 目录
- [常用命令速查](#常用命令速查)
- [文章管理](#文章管理)
- [页面管理](#页面管理)
- [配置修改](#配置修改)
- [自定义样式](#自定义样式)
- [部署相关](#部署相关)
- [进阶技巧](#进阶技巧)
- [故障排查](#故障排查)

---

## 常用命令速查

```bash
# 所有命令都在项目根目录执行
cd f:/IDEA_project/Blog02

# 创建新文章
npx hexo new "文章标题"

# 创建草稿
npx hexo new draft "草稿标题"

# 草稿转正式文章
npx hexo publish "草稿标题"

# 本地预览（http://localhost:4000）
npx hexo server

# 预览时显示草稿
npx hexo server --draft

# 生成静态文件（输出到 public/）
npx hexo generate

# 清理 + 生成（修改配置后推荐用这个）
npx hexo clean && npx hexo generate

# 一键部署到 GitHub Pages
npx hexo clean && npx hexo generate --deploy
```

---

## 文章管理

### 创建文章

```bash
npx hexo new "我的新文章"
# 生成: source/_posts/我的新文章.md
```

### Front-matter 完整写法

每篇文章顶部的 `---` 之间是元数据，常用字段：

```markdown
---
title: 文章标题
date: 2026-05-28 12:00:00
updated: 2026-05-28 15:00:00   # 可选，修改时间
categories: 技术教程           # 分类（支持多级: [前端, React]）
tags:                          # 标签
  - JavaScript
  - 教程
  - 前端
cover: https://图片URL.jpg     # 封面图
top: true                      # 置顶
description: 文章摘要           # 可选，不填则自动截取正文
---
```

### 分类多级写法

```markdown
categories:
  - [前端开发]      # 一级分类
  - [前端开发, React]  # 另一篇文章可以这样
```

### 文章中插入图片

**方式一：外链（推荐，省仓库体积）**
```markdown
![](https://图片URL.jpg)
```

**方式二：本地资源文件夹**

因为 `_config.yml` 中已开启 `post_asset_folder: true`，执行 `npx hexo new "标题"` 会自动创建同名文件夹：

```
source/_posts/
├── 我的文章.md
└── 我的文章/
    └── screenshot.png
```

文章中引用：
```markdown
![](我的文章/screenshot.png)
```

**方式三：公共图片目录**

图片放入 `source/img/`，文章引用：
```markdown
![](/img/xxx.png)
```

### Markdown 写作提示

Butterfly 主题支持一些特殊标签：

```markdown
<!-- 提示框 -->
{% note info %}
这是一条提示信息
{% endnote %}

<!-- 标签页 -->
{% tabs 标题 %}
<!-- tab 标签1 -->
内容1
<!-- endtab -->
<!-- tab 标签2 -->
内容2
<!-- endtab -->
{% endtabs %}

<!-- 折叠框 -->
{% hideToggle 点击展开 %}
隐藏的内容
{% endhideToggle %}
```

---

## 页面管理

项目中的页面文件结构：

```
source/
├── _posts/          # 文章（核心内容）
├── _drafts/         # 草稿（不发布）
├── _data/link.yml   # 友情链接数据
├── about/index.md   # 关于页
├── comments/index.md # 留言板
├── link/index.md    # 友人帐页
├── projects/index.md # 项目页
├── gallery/index.md  # 图库页
├── music/index.md    # 音乐页
├── tags/            # 标签页（自动生成）
├── categories/      # 分类页（自动生成）
├── css/custom.css   # 自定义样式
├── js/              # 自定义脚本
├── img/             # 站点图片资源
└── CNAME            # 自定义域名绑定
```

### 创建新页面

```bash
npx hexo new page "页面名称"
# 生成: source/页面名称/index.md
```

### 修改友情链接

编辑 `source/_data/link.yml`：

```yaml
- class_name: 朋友们
  class_desc: 欢迎交换友链
  link_list:
    - name: 友站名称
      link: https://example.com/
      avatar: https://头像URL
      descr: 站点描述
```

---

## 配置修改

### 两个关键配置文件

| 文件 | 用途 |
|------|------|
| `_config.yml` | Hexo 框架配置（站点名、URL、部署等） |
| `_config.butterfly.yml` | 主题配置（外观、功能、插件等） |

### 常用配置速改

**修改站点标题/副标题** → `_config.yml` 第 6-7 行

**启用/关闭功能** → `_config.butterfly.yml` 中搜索对应关键词：
- `canvas_nest` — 动态粒子背景
- `clickShowText` — 点击文字特效
- `activate_power_mode` — 输入特效
- `preloader` — 加载进度条
- `darkmode` — 深色模式
- `wordcount` — 字数统计
- `busuanzi` — 访客统计
- `pjax` — 页面无刷新切换

**修改社交链接** → `_config.butterfly.yml` 第 37-42 行

**修改运行时间** → `_config.butterfly.yml` 第 235 行 `runtime_date`

**修改 Footer 年份** → `_config.butterfly.yml` 第 166 行 `since`

### 修改后必须重新生成

```bash
npx hexo clean && npx hexo generate
# 或本地预览测试
npx hexo server
```

---

## 自定义样式

### 添加自定义 CSS

编辑 `source/css/custom.css`，此文件会自动注入到所有页面。

示例 — 修改主题色：
```css
/* 覆盖主题色为绿色 */
:root {
  --global-bg: #49b1f5;  /* 这里不能直接改 CSS 变量，仅供参考 */
}

/* 实际修改某个元素 */
#site-title {
  color: #ff6b6b;
}

/* 文章卡片圆角更大 */
.recent-post-item {
  border-radius: 16px;
}
```

### 添加自定义 JS

1. 在 `source/js/` 下创建 `.js` 文件
2. 在 `_config.butterfly.yml` 的 `inject.bottom` 中引入：

```yaml
inject:
  head:
    - <link rel="stylesheet" href="/css/custom.css">
  bottom:
    - <script src="/js/my-script.js"></script>
```

---

## 部署相关

### 当前部署方式：GitHub Pages + 阿里云域名

```
你写文章(md) → Hexo generate → 静态文件(public/) → git push → GitHub Pages → 阿里云DNS → fcmmm.xyz
```

### 部署流程

```bash
# 完整部署命令
npx hexo clean && npx hexo generate --deploy
```

### 部署配置位置

`_config.yml` 第 128-132 行：
```yaml
deploy:
  type: git
  repo: https://github.com/Fcmmm/Fcmmm.github.io.git
  branch: main
  message: 博客更新
```

### 自定义域名

- `source/CNAME` 文件中写入了你的域名（目前是 `fcmmm.xyz`）
- 阿里云 DNS 需配置 CNAME 记录指向 `Fcmmm.github.io`
- 修改域名时，同步更新 `_config.yml` 中的 `url` 字段和 `source/CNAME`

### 本地预览 vs 线上效果

```bash
# 本地预览（改配置后先预览再部署）
npx hexo server

# 浏览器打开 http://localhost:4000
# 预览满意后再部署
npx hexo clean && npx hexo generate --deploy
```

---

## 进阶技巧

### 1. 批量修改文章日期

如果你需要批量调整文章时间，用编辑器全局搜索替换，每篇错开 10 分钟即可。

### 2. 文章置顶

在 front-matter 中添加 `top: true`：

```markdown
---
title: 重要通知
top: true
---
```

### 3. 多篇文章同一分类/标签

写过一篇带某分类/标签的文章后，分类和标签页会自动生成。例如写了 3 篇 `categories: 前端开发` 的文章，访问 `/categories/前端开发/` 即可看到汇总。

### 4. 更换 Favicon

替换 `source/img/favicon.svg`，然后重新生成。

### 5. 更换头像

修改 `_config.butterfly.yml` 第 48 行 `avatar.img`。

### 6. 关闭某个页面

在 `_config.butterfly.yml` 菜单中删除对应项即可：

```yaml
menu:
  文章: /archives/ || fas fa-book
  # 音乐: /music/ || fas fa-music    ← 前面加 # 注释掉即隐藏
```

### 7. 修改首页文章排列方式

`_config.butterfly.yml` 第 116 行 `index_layout`：

| 值 | 效果 |
|----|------|
| 1 | 封面左，信息右 |
| 2 | 封面右，信息左 |
| 3 | 左右交替 |
| 4 | 封面上，信息下（当前） |
| 5 | 信息覆盖在封面上 |
| 6 | 瀑布流布局 |

### 8. Giscus 评论管理

- 所有评论存在 `https://github.com/Fcmmm/Fcmmm.github.io/discussions`
- 你能直接在 Discussions 里删除/锁定不当评论
- 新评论 GitHub 会发邮件提醒

---

## 故障排查

### 生成报错

```bash
# 先清理再生成
npx hexo clean && npx hexo generate

# 如果还是报错，检查最近修改的文件是否有语法错误
# 常见：YAML 缩进不对、front-matter 缺冒号
```

### 部署后页面没更新

1. GitHub Pages 有 1-2 分钟缓存，稍等刷新
2. 强制刷新：`Ctrl+Shift+R`
3. 检查 GitHub 仓库 Actions 是否构建成功

### 本地预览正常但线上异常

通常是路径问题。确认 `_config.yml` 中：
```yaml
url: https://fcmmm.xyz
root: /
```

### 深色模式异常

Butterfly 的深色模式会自动跟随系统。如果切换异常：
- `_config.butterfly.yml` 中 `darkmode.autoChangeMode: 1` 表示跟随系统
- 改为 `false` 则纯手动切换

### 主题升级

```bash
cd themes/butterfly
git pull origin master
cd ../..
npx hexo clean && npx hexo generate
```

> 升级前建议备份 `_config.butterfly.yml`，新版可能有新增配置项。
