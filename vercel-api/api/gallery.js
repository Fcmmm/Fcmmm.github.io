/**
 * Vercel Serverless Function — Gallery API
 * 密码验证后返回预存的 Cloudinary signed URLs
 *
 * 新增图片时更新 IMAGE_URLS 环境变量即可
 */

// 模块级缓存（Vercel 热启动保持）
let cache = null
const CACHE_TTL = 60 * 60 * 1000

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { password } = req.body || {}

  if (!password || password !== process.env.GALLERY_PASSWORD) {
    return res.status(401).json({ error: '密码错误' })
  }

  // 缓存命中直接返回
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return res.status(200).json({ images: cache.images })
  }

  // 从环境变量读取预签名的 URL 列表
  const raw = process.env.IMAGE_URLS || ''
  const images = raw.split(',').map(s => s.trim()).filter(Boolean)

  cache = { images, ts: Date.now() }
  return res.status(200).json({ images })
}
