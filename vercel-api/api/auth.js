/**
 * GitHub OAuth 回调 — Decap CMS 认证代理
 *
 * 部署时设置环境变量:
 *   OAUTH_CLIENT_ID     — GitHub OAuth App Client ID
 *   OAUTH_CLIENT_SECRET — GitHub OAuth App Client Secret
 */

export default async function handler(req, res) {
  const { code } = req.query || {}

  if (!code) {
    return res.status(400).json({ error: 'Missing code parameter' })
  }

  const clientId = process.env.OAUTH_CLIENT_ID
  const clientSecret = process.env.OAUTH_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Server misconfigured' })
  }

  try {
    // 用授权码换取 GitHub access token
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

    // Decap CMS 期望 { token, provider }
    return res.status(200).json({
      token: data.access_token,
      provider: 'github',
    })
  } catch (e) {
    return res.status(500).json({ error: 'OAuth exchange failed' })
  }
}
