---
title: Markdown 语法与外置标签写法汇总
categories: 技术文档
tags:
  - Markdown
  - Hexo
  - 教程
  - 代码块
cover: /images/covers/cover-011.jpg
top: true
abbrlink: 455384546
date: 2026-05-28 08:00:00
updated: 2026-05-28 08:00:00
---

## Markdown 语法自带格式

参考：[Markdown 语法图文全面详解(10 分钟学会)](https://www.example.com)

> 注意：此页面偶尔会存在 CSS 冲突问题!

### 代码块

**示例源码渲染演示：**

```sh
# VSCode终端
hexo clean; hexo s
hexo clean; hexo g; hexo d
git add .; git commit -m "npm publish"; npm version patch; git push

# Cmder终端
hexo clean && hexo s
hexo clean && hexo g && hexo d
git add . && git commit -m "npm publish" && npm version patch
```

### 标题

# 一级标题
## 二级标题
### 三级标题
#### 四级标题
##### 五级标题
###### 六级标题

### 文本样式

*这是斜体文字*

**这是粗体文字**

~~这是删除线文字~~

`这是行内代码`

### 列表

#### 无序列表
- 项目一
- 项目二
  - 嵌套项目
  - 嵌套项目二
- 项目三

#### 有序列表
1. 第一步
2. 第二步
3. 第三步

### 链接与图片

[这是一个链接](https://hexo.io)

### 引用

> 这是一段引用文字
> 可以多行显示

### 表格

| 左对齐 | 居中 | 右对齐 |
|:-------|:----:|-------:|
| 内容A  | 内容B | 内容C |
| 内容D  | 内容E | 内容F |

---

以上就是常用的 Markdown 语法汇总，日常写作时可以参考使用。
