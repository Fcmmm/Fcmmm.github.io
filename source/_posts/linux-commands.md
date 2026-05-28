---
title: Linux 常用命令整理
categories: Linux
tags:
  - Linux
  - 命令
  - Shell
  - Debian
cover: 'https://picsum.photos/seed/linux/800/400'
abbrlink: 2956639621
date: 2026-05-28 09:10:00
---

## Linux 常用命令速查

日常使用 Linux 时最常用的命令合集。

### 文件与目录

```bash
# 列出文件
ls -la              # 详细信息
ls -lh              # 人类可读的大小
ls *.txt            # 通配符

# 目录操作
mkdir -p a/b/c      # 递归创建
rmdir empty_dir     # 删除空目录
rm -rf dir/         # 强制递归删除（慎用！）

# 文件操作
cp -r src/ dst/     # 递归复制
mv old new          # 移动/重命名
ln -s target link   # 创建软链接
```

### 权限管理

```bash
chmod 755 file      # rwxr-xr-x
chmod +x script.sh  # 添加执行权限
chown user:group file
```

### 进程管理

```bash
ps aux              # 所有进程
top                 # 实时进程监控
htop                # 更好看的 top
kill -9 PID         # 强制终止进程
killall name        # 按名称终止
```

### 网络

```bash
curl http://example.com
wget http://example.com/file.tar.gz
ss -tlnp            # 查看监听端口
ping example.com
```

### 磁盘与内存

```bash
df -h               # 磁盘使用
du -sh dir/         # 目录大小
free -h             # 内存使用
```

### 搜索

```bash
grep -r "pattern" ./
find . -name "*.txt"
which command       # 命令位置
```

### 压缩

```bash
tar -czvf archive.tar.gz dir/
tar -xzvf archive.tar.gz
zip -r archive.zip dir/
unzip archive.zip
```
