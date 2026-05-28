---
title: Python 数据分析入门
categories: 后端开发
tags:
  - Python
  - 数据分析
  - Pandas
  - Matplotlib
cover: 'https://picsum.photos/seed/python/800/400'
abbrlink: 335312452
date: 2026-05-28 09:00:00
---

## Python 数据分析工具链

Python 拥有丰富的数据分析生态系统。本文介绍最核心的库和常见用法。

### NumPy

```python
import numpy as np

# 创建数组
arr = np.array([1, 2, 3, 4, 5])
zeros = np.zeros((3, 4))
random_arr = np.random.randn(100)

# 基本运算
print(arr.mean())    # 平均值
print(arr.std())     # 标准差
print(arr.sum())     # 求和
```

### Pandas

```python
import pandas as pd

# 读取数据
df = pd.read_csv('data.csv')

# 数据概览
print(df.head())
print(df.info())
print(df.describe())

# 数据筛选
filtered = df[df['age'] > 25]
grouped = df.groupby('category').mean()

# 处理缺失值
df.dropna(inplace=True)
df.fillna(0, inplace=True)
```

### Matplotlib

```python
import matplotlib.pyplot as plt

# 折线图
plt.plot(df['date'], df['value'])
plt.title('Trend Over Time')
plt.xlabel('Date')
plt.ylabel('Value')
plt.show()

# 柱状图
df['category'].value_counts().plot(kind='bar')
plt.show()
```

### 简单分析流程

```python
import pandas as pd
import matplotlib.pyplot as plt

# 1. 加载数据
df = pd.read_csv('sales.csv')

# 2. 数据清洗
df['date'] = pd.to_datetime(df['date'])
df = df.dropna()

# 3. 分析
monthly = df.groupby(df['date'].dt.month)['revenue'].sum()

# 4. 可视化
monthly.plot(kind='bar', title='Monthly Revenue')
plt.show()
```
