---
title: Docker Compose 常用命令速查
categories: DevOps
tags:
  - Docker
  - Docker Compose
  - 容器管理
  - Commands
cover: 'https://picsum.photos/seed/docker/800/400'
abbrlink: 96872778
date: 2026-05-28 08:20:00
---

## 核心命令速查

Docker Compose 几乎完全兼容 docker-compose，日常开发直接当 Docker Compose 用就行。

### 常用命令一览

| 命令 | 说明 | 频率 |
|------|------|------|
| `docker compose up -d` | 后台启动 | ★★★★★ |
| `docker compose down` | 停止并删除容器 | ★★★★★ |
| `docker compose down -v` | 连卷一起删（彻底重置） | ★★★★ |
| `docker compose ps` | 查看运行状态 | ★★★★★ |
| `docker compose logs -f` | 实时看所有日志 | ★★★★ |
| `docker compose logs -f 服务名` | 跟踪某个服务日志 | ★★★★★ |
| `docker compose build` | 重新构建镜像 | ★★★★ |
| `docker compose pull` | 拉取最新镜像 | ★★★ |
| `docker compose restart` | 重启所有服务 | ★★★ |
| `docker compose exec 服务名 bash` | 进容器 | ★★★★★ |

### 使用示例

```yaml
# docker-compose.yml
version: '3.8'
services:
  web:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./html:/usr/share/nginx/html
  
  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: example
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

```bash
# 启动所有服务
docker compose up -d

# 查看运行状态
docker compose ps

# 查看 web 服务日志
docker compose logs -f web

# 进入 web 容器
docker compose exec web sh

# 停止所有
docker compose down
```
