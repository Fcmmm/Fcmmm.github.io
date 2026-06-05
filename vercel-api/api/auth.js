/**
 * GitHub OAuth 代理 — Decap CMS 认证
 *
 * 两阶段 OAuth 流程:
 *   1. 无 code → 重定向到 GitHub 授权页
 *   2. 有 code → 换取 token，通过 postMessage 回传给 CMS
 */

export default async function handler(req, res) {
  const clientId = process.env.OAUTH_CLIENT_ID
  const clientSecret = process.env.OAUTH_CLIENT_SECRET

  const { code } = req.query || {}

  // 阶段 1: 没有 code → 重定向到 GitHub 授权
  if (!code) {
    const redirectUri = `https://vercel-api-ten-sigma.vercel.app/api/auth`
    const githubAuthUrl =
      `https://github.com/login/oauth/authorize` +
      `?client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=repo,user`

    res.writeHead(302, { Location: githubAuthUrl })
    return res.end()
  }

  // 阶段 2: 用 code 换 token
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
      return res.status(401).json({ error: data.error_description || data.error })
    }

    // 通过 postMessage 将 token 传回 Decap CMS 父窗口
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(renderScript({ token: data.access_token, provider: 'github' }))
  } catch (e) {
    return res.status(500).json({ error: 'OAuth exchange failed' })
  }
}

function renderScript(data) {
  return `<!DOCTYPE html>
<html><body><script>
  (function() {
    window.opener.postMessage(
      ${JSON.stringify(data)},
      '*'
    );
  })();
</script></body></html>`
}
