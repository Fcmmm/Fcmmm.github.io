/**
 * GitHub OAuth 代理 — Decap CMS 认证
 *
 * 流程:
 *   1. 无 code → 302 重定向到 GitHub OAuth
 *   2. 有 code → 换取 token → 302 重定向回 CMS，token 在 URL hash 中
 */

export default async function handler(req, res) {
  const clientId = process.env.OAUTH_CLIENT_ID
  const clientSecret = process.env.OAUTH_CLIENT_SECRET
  const cmsUrl = 'https://fcmmm.xyz/admin/'

  const { code } = req.query || {}

  // 阶段 1: 没有 code → 重定向到 GitHub 授权
  if (!code) {
    const redirectUri = 'https://vercel-api-ten-sigma.vercel.app/api/auth'
    const githubAuthUrl =
      'https://github.com/login/oauth/authorize' +
      `?client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      '&scope=repo,user'

    res.writeHead(302, { Location: githubAuthUrl })
    return res.end()
  }

  // 阶段 2: 用 code 换 token，然后重定向回 CMS
  try {
    const tokenRes = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      }
    )

    const data = await tokenRes.json()

    if (data.error) {
      return res.status(401).send(`<html><body style="text-align:center;font-family:sans-serif;padding-top:40px;">
<h2>❌ 授权失败</h2><p>${data.error_description || data.error}</p></body></html>`)
    }

    // 返回页面：将 token 传给主窗口后自动关闭
    const token = data.access_token
    res.writeHead(200, { 'Content-Type': 'text/html' })
    return res.end(`<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="text-align:center;font-family:sans-serif;padding-top:60px;background:#fff;">
<h2>✅ 授权成功</h2>
<p>即将跳转...</p>
<script>
(function() {
  var target = '${cmsUrl}#access_token=${token}&token_type=bearer&provider=github';
  if (window.opener && window.opener !== window) {
    window.opener.location.href = target;
    window.close();
  } else {
    window.location.href = target;
  }
})();
</script></body></html>`)
  } catch (e) {
    return res.status(500).send('<html><body><h2>服务器错误</h2></body></html>')
  }
}
