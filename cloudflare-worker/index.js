/**
 * Gallery API Worker — Cloudinary 签名 + 密码验证
 *
 * 部署步骤:
 *   1. npx wrangler deploy
 *   2. npx wrangler secret put GALLERY_PASSWORD
 *   3. npx wrangler secret put CLOUDINARY_API_SECRET
 */

export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders })
    }

    // Only accept POST
    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405, corsHeaders)
    }

    // Parse and validate password
    let body
    try {
      body = await request.json()
    } catch {
      return json({ error: 'Invalid request' }, 400, corsHeaders)
    }

    if (!body.password || body.password !== env.GALLERY_PASSWORD) {
      return json({ error: '密码错误' }, 401, corsHeaders)
    }

    // Image list (comma-separated public_ids, set via `wrangler secret put IMAGE_IDS`)
    const rawIds = env.IMAGE_IDS || ''
    const imageIds = rawIds.split(',').map(s => s.trim()).filter(Boolean)

    if (imageIds.length === 0) {
      return json({ images: [] }, 200, corsHeaders)
    }

    // Generate Cloudinary signed URLs (SHA1(public_id + api_secret))
    const cloudName = env.CLOUDINARY_CLOUD_NAME

    const images = await Promise.all(
      imageIds.map(async (publicId) => {
        return await signUrl(publicId, cloudName, env.CLOUDINARY_API_SECRET)
      })
    )

    return json({ images }, 200, corsHeaders)
  },
}

/**
 * Sign a Cloudinary "authenticated" delivery URL
 * Algorithm: SHA1("authenticated/<public_id><expires><api_secret>")
 */
async function signUrl(publicId, cloudName, apiSecret) {
  const toSign = publicId + apiSecret
  const encoder = new TextEncoder()
  const data = encoder.encode(toSign)
  const hashBuffer = await crypto.subtle.digest('SHA-1', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  return `https://res.cloudinary.com/${cloudName}/image/authenticated/s--${signature}--/${publicId}`
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
  })
}
