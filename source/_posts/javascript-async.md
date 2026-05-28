---
title: JavaScript 异步编程详解
categories: 前端开发
tags:
  - JavaScript
  - 异步编程
  - Promise
  - async/await
cover: 'https://picsum.photos/seed/javascript/800/400'
abbrlink: 433671610
date: 2026-05-28 08:40:00
---

## 从回调到 async/await

JavaScript 异步编程模型经历了巨大的演进。本文从基础概念出发，逐步深入讲解各种异步模式。

### 1. 回调函数

最基础的异步模式：

```javascript
function fetchData(callback) {
  setTimeout(() => {
    const data = { id: 1, name: 'example' };
    callback(null, data);
  }, 1000);
}

fetchData((err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(data);
});
```

### 2. Promise

Promise 提供了更优雅的异步处理方式：

```javascript
function fetchData() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const data = { id: 1, name: 'example' };
      resolve(data);
    }, 1000);
  });
}

fetchData()
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

### 3. async/await

让异步代码看起来像同步代码：

```javascript
async function getData() {
  try {
    const data = await fetchData();
    console.log(data);
  } catch (err) {
    console.error(err);
  }
}

getData();
```

### Promise 工具方法

```javascript
// 并发请求
const [user, posts] = await Promise.all([
  fetch('/api/user'),
  fetch('/api/posts')
]);

// 竞速
const result = await Promise.race([
  fetch('/api/fast'),
  timeout(5000)
]);

// 所有结果（不管成功失败）
const results = await Promise.allSettled([
  fetch('/api/a'),
  fetch('/api/b'),
  fetch('/api/c')
]);
```

### 错误处理

```javascript
async function safeFetch(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Fetch failed:', err);
    return null;
  }
}
```
