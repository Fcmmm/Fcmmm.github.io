# Umami 访问统计部署手册

不蒜子的公共接口长期返回 502 / 超时，侧栏的「访客量」「总浏览数」会一直转圈。博客已改为**自建 Umami**（v3.4.1 + PostgreSQL），数据完全存在自己的服务器上。

## 架构

```text
浏览器
  ├─ /api/umami/metrics.js               → fcmmm.xyz 的 Nginx → 127.0.0.1:3000/metrics.js
  ├─ /api/umami/api/send                 → 记录访问
  ├─ /api/umami/api/websites/<id>/stats  → Nginx 在服务端注入 API key → 侧栏 UV / PV
  └─ https://stats.fcmmm.xyz/            → 管理后台

Umami → PostgreSQL（数据目录 /opt/umami/data）
```

两个关键设计：

- **管理后台用独立子域名** `stats.fcmmm.xyz`。Umami 基于 Next.js，静态资源按根路径加载，官方镜像不支持子路径部署；放在 `/api/umami/` 下管理界面会白屏。
- **博客用的脚本和统计接口反代到主站 `/api/umami/`**。这样脚本和统计请求都与博客同源，不触发跨域问题，也不会被广告拦截器按第三方统计域名屏蔽；统计接口的 API key 由 Nginx 在服务端注入，浏览器不需要携带密钥。

## 1. 准备工作

- 服务器已安装 Docker 和 Docker Compose（与 Artalk 相同）。
- 在阿里云 DNS 添加一条 A 记录：`stats` → 服务器公网 IP。若 `fcmmm.xyz` 已解析到该服务器，只需新增 `stats` 子域名。
- 服务器终端可用。

## 2. 启动 Umami

在宝塔「文件」中新建 `/opt/umami`，上传本目录的 `compose.yaml` 和 `.env.example`。在**服务器终端**执行：

```bash
cd /opt/umami
cp .env.example .env
openssl rand -hex 16   # 用作 POSTGRES_PASSWORD
openssl rand -hex 32   # 用作 APP_SECRET
openssl rand -hex 32   # 用作 TWO_FACTOR_ENCRYPTION_KEY
```

在宝塔中编辑 `/opt/umami/.env`：

1. `POSTGRES_PASSWORD` 填入第一个随机值，并把 `DATABASE_URL` 里的 `CHANGE_ME` 换成**同一个密码**。
2. `APP_SECRET` 填入第二个随机值。
3. `TWO_FACTOR_ENCRYPTION_KEY` 填入第三个随机值（必须是 64 位十六进制）。
4. `TRACKER_SCRIPT_NAME=metrics.js` 保持不变；博客配置里的 `script_name` 必须与它一致。

```bash
chmod 600 .env
docker compose up -d
docker compose ps
docker compose logs --tail=100 umami
```

首次启动会执行数据库迁移，可能需要一两分钟。看到容器 `healthy` 即可。数据保存在 `/opt/umami/data`，`.env` 和 `data/` 已被 `.gitignore` 排除，不要提交到仓库。

如果 Docker Hub 拉取很慢，可先在宝塔的 Docker 设置里配置镜像加速器；也可以把 `compose.yaml` 的镜像改为 `ghcr.io/umami-software/umami:3.4.1`（需要服务器能访问 ghcr.io）。

## 3. 配置 Nginx

### 3.1 管理后台子域名

在宝塔「网站」中新建站点 `stats.fcmmm.xyz`（纯静态即可，不需要 PHP 和数据库），申请 Let's Encrypt 证书并开启强制 HTTPS。

**只加 DNS 解析记录是不够的**：DNS 只负责把域名指向服务器，Nginx 还要按 `Host` / SNI 找到对应的 server 块。没有这个站点，请求会落到默认站点——HTTP 返回宝塔默认页，HTTPS 返回默认自签名证书，浏览器会报证书错误。

打开该站点的「配置文件」，把默认的 `location / { ... }` 替换为：

```nginx
# 保留证书续签所需的验证路径
location ^~ /.well-known/ {
    root /www/wwwroot/stats.fcmmm.xyz;
    try_files $uri =404;
}

location ^~ / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 60s;
}
```

说明：

- `^~ /` 必须保留，否则宝塔默认的 `.js/.css/图片` 正则缓存规则会抢走 `/_next/...`，管理界面会 404 或白屏。
- `proxy_pass` 末尾**不要**加 `/`，管理后台需要保留原始路径。

如果暂时不想加 `stats` 子域名和证书，也可以不做 3.1，改用 SSH 隧道访问后台（博客统计不受影响，只需要 3.2）：

```bash
ssh -L 3000:127.0.0.1:3000 你的服务器用户@服务器IP
```

然后在本地浏览器打开 `http://localhost:3000`。缺点是不在服务器旁边时查看数据不方便。

### 3.2 主站统计代理

打开「网站 → fcmmm.xyz → 设置 → 配置文件」，在已有的 `server { ... }` 内、原有 `location / { ... }` **之前**加入：

```nginx
# Umami 统计脚本与上报接口（不需要 API key）
location ^~ /api/umami/ {
    proxy_pass http://127.0.0.1:3000/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# 只读统计接口：Nginx 在服务端注入 API key，密钥不会下发到浏览器
location = /api/umami/api/websites/你的WEBSITE_ID/stats {
    limit_except GET { deny all; }
    proxy_pass http://127.0.0.1:3000/api/websites/你的WEBSITE_ID/stats;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Authorization "Bearer 你的API_KEY";
}
```

说明：

- 第一个 `^~ /api/umami/` 负责 `metrics.js` 和 `api/send`，不会注入密钥。`^~` 确保它不会被主站已有的静态资源正则规则截走（与 Artalk 的 `/api/comments/` 同理）；`proxy_pass` 末尾的 `/` **必须有**，否则会 404。
- 第二个 `location =` 只匹配统计接口，优先级最高，查询参数会原样转发。`limit_except GET` 拒绝 POST/PUT/DELETE，避免有人借这个代理做写操作。
- `Authorization` 里的 `Bearer` 和后面的空格都要保留，只把 `你的API_KEY` 换成完整密钥；这个 key **只放在 Nginx**，不要写进博客配置或提交到 Git。
- 如果 `www.fcmmm.xyz` 有独立的 `server` 块，两段都要加一遍。
- 原有 `location / { ... }` 保留不动。

保存并重载 Nginx。

## 4. 初始化 Umami

浏览器打开 `https://stats.fcmmm.xyz`（未配置子域名时用 3.1 的 SSH 隧道打开 `http://localhost:3000`）：

1. 默认账号 `admin` / 密码 `umami`，登录后**立即修改密码**。
2. 添加网站：名称填 `Fcmmm Blog`，域名填 `fcmmm.xyz`。
3. 进入该网站的 **设置 → 跟踪代码**，复制 `data-website-id` 的值（形如 `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`）。
4. 生成 API key：点击右上角头像 → **Settings**，在左侧菜单的 **Settings** 分组里选 **API keys**（也可以直接打开 `https://stats.fcmmm.xyz/settings/api-keys`）。点右上角 **Create API key**，填一个名称（如 `blog`）后保存，弹窗会显示完整密钥，点复制按钮拷贝（形如 `umami_...`，关闭后不再完整显示）。复制后**只填到服务器 Nginx 的统计接口**（见 3.2），不要填进 `_config.butterfly.yml`。

   注意：**API keys 在账户设置里，不在某个网站的设置里**。网站设置里的 `Settings` 只有跟踪代码、分享、删除网站等选项。

统计接口的 API key 只保存在服务器 Nginx 配置里，页面源码和 Git 仓库中都不应出现。API key 权限很高：Umami v3 只屏蔽了账号类接口，网站的 reset/delete 仍然可以用 key 调用；一旦泄露，别人可以清空统计或删除网站。泄露后立即在后台删除旧 key，并在 Nginx 里换上新 key。

## 5. 验证接口

先验证脚本和统计接口都走主站代理。统计接口**不要带 Authorization 头**，key 由 Nginx 注入：

```bash
curl -I https://fcmmm.xyz/api/umami/metrics.js

curl -sS \
  "https://fcmmm.xyz/api/umami/api/websites/你的WEBSITE_ID/stats?startAt=0&endAt=$(date +%s000)"
```

脚本应返回 200 和 JavaScript 内容；接口应返回类似：

```json
{"pageviews":0,"visitors":0,"visits":0,"bounces":0,"totaltime":0,"comparison":{...}}
```

若是 401，检查 Nginx 的 `location = .../stats` 是否生效、`Authorization` 是否为 `Bearer 你的API_KEY`（`Bearer` 和后面的空格都要保留）、key 是否已在后台删除；若是 404，检查主站代理 `proxy_pass` 末尾是否有 `/`、容器是否在 `127.0.0.1:3000` 监听。

还可以确认密钥没有从其他路径泄露：

```bash
# 网站详情接口不应能匿名访问，预期 401
curl -sS -o /dev/null -w "%{http_code}\n" \
  "https://fcmmm.xyz/api/umami/api/websites/你的WEBSITE_ID"

# 统计接口只允许 GET，POST 预期 403
curl -sS -o /dev/null -w "%{http_code}\n" -X POST \
  "https://fcmmm.xyz/api/umami/api/websites/你的WEBSITE_ID/stats"
```

## 6. 配置博客前端

编辑 `_config.butterfly.yml` 的 `umami_analytics` 段，填入 `website_id` 并启用（**不需要填 API key**，统计接口的 key 由 Nginx 注入）：

```yaml
umami_analytics:
  enable: true
  serverURL: /api/umami
  script_name: metrics.js
  website_id: 你的 WEBSITE_ID
  option:
  UV_PV:
    site_uv: true
    site_pv: true
    page_pv: true
```

`serverURL` 使用相对路径，博客在 `fcmmm.xyz`、`www.fcmmm.xyz` 等下都能同源访问；GitHub Pages 的预览域名没有这个反代，预览时统计不显示属于正常现象。同时确认 `busuanzi` 三项为 `false`（仓库中已改好）。然后在本机构建、提交并推送 `source` 分支，GitHub Actions 会自动发布：

```powershell
npx hexo clean
npx hexo generate
git add .
git commit -m "Switch visitor stats to self-hosted Umami"
git push origin source
```

发布后检查：

1. 首页侧栏「访客量」「总浏览数」能显示数字，不再是转圈。
2. 打开任意文章，标题下方显示该文章浏览量，刷新一次数字加一。
3. 浏览器 Network 中 `metrics.js`、`api/send` 和 `stats` 请求均为 200。
4. 手机流量访问一次，确认统计正常。

新站的统计从 0 开始，旧的不蒜子数据无法迁移。

## 7. 日常维护

```bash
# 查看状态 / 日志
cd /opt/umami
docker compose ps
docker compose logs --tail=100 umami

# 备份数据库（建议定期执行）
docker compose exec -T db pg_dump -U umami umami > "umami-$(date +%F).sql"

# 升级：修改 compose.yaml 中的镜像版本后
docker compose pull
docker compose up -d
```

升级不会清空数据；不要删除 `/opt/umami/data`。如果不再使用 Umami，把 `_config.butterfly.yml` 的 `enable` 改为 `false` 即可，侧栏统计项会自动隐藏，页面不会残留转圈。

## 故障排查

| 现象 | 检查 |
| --- | --- |
| `stats.fcmmm.xyz` 显示默认页 / 证书错误 | 只加了 DNS 解析；按 3.1 新建站点并申请证书 |
| `/api/umami/...` 返回 502 | 3.2 规则已生效但上游没起来：`docker compose ps`、`docker compose logs umami`、`curl http://127.0.0.1:3000/api/heartbeat` |
| `stats.fcmmm.xyz` 502 | `docker compose ps` 是否 healthy；`curl http://127.0.0.1:3000/api/heartbeat` |
| 管理界面白屏 / 404 | 子域名 Nginx 是否用了 `^~ /`；`proxy_pass` 是否误加了末尾 `/` |
| `/api/umami/metrics.js` 404 | 主站代理 `proxy_pass` 末尾是否有 `/`；`.env` 的 `TRACKER_SCRIPT_NAME` 与博客的 `script_name` 是否一致 |
| 接口 401 | Nginx 的 `location = .../stats` 是否生效；`Authorization` 是否为 `Bearer 你的API_KEY`（`Bearer` 和后面的空格都要保留）；key 是否已在后台删除 |
| 数字一直是 0 | 是否有广告拦截插件拦了 `metrics.js`；Network 里看 `/api/umami/api/send` 是否成功 |
| 数字 6 秒后变成 — | 统计接口请求失败，见上方 401/404 排查；本地预览或 GitHub Pages 预览没有 `/api/umami/` 反代也会这样；`source/js/stat-fallback.js` 只是兜底显示 |

## 官方参考

- [Umami 安装文档](https://umami.is/docs/install)
- [Docker 镜像](https://hub.docker.com/r/umamisoftware/umami)
- [API 认证](https://docs.umami.is/docs/api/authentication)
- [环境变量](https://docs.umami.is/docs/environment-variables)
