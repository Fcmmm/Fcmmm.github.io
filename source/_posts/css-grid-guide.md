---
title: CSS Grid 布局完全指南
categories: 前端开发
tags:
  - CSS
  - 布局
  - Grid
  - 教程
cover: 'https://picsum.photos/seed/cssgrid/800/400'
abbrlink: 466982809
date: 2026-05-28 08:50:00
---

## CSS Grid 简介

CSS Grid 布局是 CSS 中最强大的布局系统。它是一个二维布局系统，可以同时处理列和行。

## 核心概念

### 网格容器

```css
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: auto;
  gap: 20px;
}
```

### 网格项

```css
.item-1 {
  grid-column: 1 / 3;  /* 从第1列到第3列 */
  grid-row: 1;
}

.item-2 {
  grid-column: 3;
  grid-row: 1 / 3;  /* 从第1行到第3行 */
}
```

## 常用布局示例

### 圣杯布局

```css
.layout {
  display: grid;
  grid-template-columns: 200px 1fr 200px;
  grid-template-rows: 60px 1fr 60px;
  min-height: 100vh;
  grid-template-areas:
    "header header header"
    "nav    main   aside"
    "footer footer footer";
}

.header { grid-area: header; }
.nav    { grid-area: nav; }
.main   { grid-area: main; }
.aside  { grid-area: aside; }
.footer { grid-area: footer; }
```

### 响应式网格

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}
```

### 居中对齐

```css
.center-container {
  display: grid;
  place-items: center;
  min-height: 100vh;
}
```

## Grid vs Flexbox

| Grid | Flexbox |
|------|---------|
| 二维布局 | 一维布局 |
| 同时控制行列 | 控制行或列 |
| 布局优先 | 内容优先 |
| 适合页面布局 | 适合组件布局 |
