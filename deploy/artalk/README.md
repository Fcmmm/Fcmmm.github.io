# Artalk 评论部署手册

博客前端默认使用 Artalk，Giscus 作为旧评论入口保留。访客填写昵称、邮箱和正文即可评论，不要求 GitHub 登录。Artalk 服务独立运行，不要放进现有的 `music-api` 进程或目录。

## 1. 上线前准备

- 阿里云服务器需安装 Docker 和 Docker Compose。若终端显示 `docker: command not found`，先在宝塔左侧点击「Docker」并按提示安装 Docker；若看不到该入口，在「软件商店」搜索并安装 Docker 管理器。安装完成后，在服务器终端确认 `docker --version` 和 `docker compose version` 均可运行。
- 准备一个可通过 SMTP 发信的邮箱，开启 SMTP，并取得**授权码**。不要把邮箱登录密码或授权码提交到 Git。
- 确认服务器允许出站连接邮箱服务商的 SMTP 端口；反向代理使用已有的 80/443 端口，Artalk 的 23366 端口只监听本机。

## 2. 在服务器启动 Artalk

在宝塔「文件」中新建 `/opt/artalk`，把本目录的 `compose.yaml` 和 `.env.example` 上传进去。上传后应看到 `/opt/artalk/compose.yaml` 与 `/opt/artalk/.env.example`。下面的命令均在**服务器终端**执行：

```bash
cd /opt/artalk
cp .env.example .env
openssl rand -hex 32
```

在宝塔「文件」中编辑 `/opt/artalk/.env`：

1. 将随机值填入 `ATK_APP_KEY`，创建后保持不变。
2. 填写 `ATK_EMAIL_SEND_ADDR`、`ATK_EMAIL_SMTP_HOST`、`ATK_EMAIL_SMTP_PORT`、`ATK_EMAIL_SMTP_USERNAME`、`ATK_EMAIL_SMTP_PASSWORD`。`PASSWORD` 应填写 SMTP 授权码。
3. 邮箱设置齐全后，将 `ATK_EMAIL_ENABLED` 改成 `true`。如果暂时没有邮箱凭据，可保持 `false` 先测试评论，但不会发送通知。
4. 默认站点名 `Fcmmm Blog` 要与博客的 `_config.butterfly.yml` 中 `artalk.site` 完全一致；`ATK_SITE_URL` 应是博客的正式访问地址。

```bash
chmod 600 .env
docker compose up -d
docker compose logs --tail=100 artalk
docker compose exec artalk artalk admin
```

最后一条命令按提示创建管理员账户。评论数据存储在 `/opt/artalk/data/artalk.db`。`.env` 与 `data/` 已被本目录的 `.gitignore` 排除，不应提交到仓库。

## 3. 在现有网站配置中添加评论代理

只使用宝塔现有的 `fcmmm.xyz` 网站，不需要新建 `comments.fcmmm.xyz`、添加 DNS 记录或申请新证书。打开「网站 → fcmmm.xyz → 设置 → 配置文件」，在已有的 `server { ... }` 内，建议放在 `# 主站：fcmmm.xyz/` 和原有 `location / { ... }` **之前**，加入下面两段。原有 `location /` 必须保留：

```nginx
# Artalk 评论服务
location = /api/comments {
    return 301 /api/comments/;
}

location ^~ /api/comments/ {
    proxy_pass http://127.0.0.1:23366/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

`^~` 确保 Artalk 的 JS/CSS 请求不会被此网站已有的静态资源正则规则截走；`proxy_pass` 末尾的 `/` 会去掉对外路径 `/api/comments/`，再交给 Artalk。宝塔保存配置并重载 Nginx 后，检查：

```text
https://fcmmm.xyz/api/comments/dist/Artalk.js
https://fcmmm.xyz/api/comments/dist/Artalk.css
```

两个地址应显示资源内容，而不是博客首页或 404。若是 502，先在服务器终端执行 `cd /opt/artalk && docker compose ps`，确认 Artalk 容器已经运行。

若博客在 `fcmmm.xyz`、`www.fcmmm.xyz` 和 GitHub Pages 域名之间切换，`.env` 中的 `ATK_TRUSTED_DOMAINS` 已列出这三个来源。以后新增博客域名时也要更新这一项并重建容器。

## 4. 上线前检查

博客前端发布后，从评论框登录管理员并进入「控制中心」检查邮件设置，开启管理员的新评论邮件通知。完整的评论与邮件测试在前端发布后进行。

初始配置为**新评论先审核**；验证码仅在一分钟内连续操作达到阈值后出现。这样访客首次评论只需填写昵称和邮箱，管理员可在控制中心审核。运行稳定后，如希望评论即时显示，可将 `.env` 的 `ATK_MODERATOR_PENDING_DEFAULT` 改成 `false`，再执行 `docker compose up -d --force-recreate`。

填写邮箱默认不验证所有权。邮箱只承担回复通知的作用，不应据此认定评论者身份。如有冒名问题，可在 Artalk 控制中心开启邮箱账号验证，但这会增加访客操作步骤。

## 5. 发布博客前端

**先完成第 2 至 4 步并确认评论服务可用，再推送 `source` 分支。** 在本地项目根目录的 PowerShell 中执行：

```powershell
git push origin backup-before-artalk-20261022
git push origin source
```

仓库的 GitHub Actions 会在推送 `source` 后自动构建，并同步到 GitHub Pages 和阿里云。推送后检查文章页及留言板：

1. 默认出现 Artalk 评论框；用普通访客视角提交一条评论，确认进入待审列表。
2. 用自己的邮箱 A 留言，使用管理员账户审核并回复，确认 A 收到回复邮件；再确认管理员收到新评论邮件，邮件中的链接能跳到原文章。
3. 切换到 Giscus，确认旧 GitHub Discussions 仍可查看。
4. 用手机网络测试 `fcmmm.xyz/api/comments/dist/Artalk.js` 和评论框是否加载。

如果 Git 推送提示无法连接 `127.0.0.1:7890`，先启动你平时使用的本地代理，再重试；这表示本机 Git 当前设置的代理没有运行，与 Artalk 部署无关。

Butterfly 当前将 `pageKey` 设为页面路径。请保持 Artalk 站点 URL 为 `https://fcmmm.xyz`，这样邮件中的回复链接会指向正确文章。

## 备份与回退

定期在 Artalk 控制中心导出评论数据，或在停止容器后备份 `/opt/artalk/data/`。保管好 `.env` 中的 `ATK_APP_KEY`。Git 代码回退不包含新收到的评论数据。

修改前的代码已在本机标记为 `backup-before-artalk-20261022`。如前端上线后需要暂时恢复 Giscus，在本地仓库执行：

```bash
git restore --source=backup-before-artalk-20261022 -- _config.butterfly.yml
git add _config.butterfly.yml
git commit -m "Restore Giscus comments"
git push origin source
```

Artalk 服务可以继续保留，方便修复后重新切换；不要删除 `data/`。

官方参考：[部署](https://artalk.js.org/zh/guide/deploy.html)、[配置](https://artalk.js.org/zh/guide/backend/config)、[邮件通知](https://artalk.js.org/zh/guide/backend/email)、[评论审核](https://artalk.js.org/zh/guide/backend/moderator)。
