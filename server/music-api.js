// 网易云音乐 + 图库 API 代理 — 运行在阿里云服务器上，与博客同源无 CORS 问题
const https = require('https')
const http = require('http')
const fs = require('fs')
const path = require('path')

// 读取 .env 文件（若存在）
try {
  const envFile = fs.readFileSync(path.join(__dirname, '.env'), 'utf8')
  envFile.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim()
      const val = trimmed.slice(eqIdx + 1).trim()
      if (!process.env[key]) process.env[key] = val
    }
  })
} catch (_) { /* .env 不存在，跳过 */ }

const PORT = process.env.PORT || 3001
const MUSIC_U = process.env.MUSIC_U || '00980E2BFECAE6222B93A81CD2B69531602AA6E9F5A0652C665FBB6085E12BE4951F2B618BEB7B486E3BED244F46329C4DB16EFFE5DC4E14B31520762062A1042A16554EF2329692834261EB5B21565071C7A996C205D3FC2E5166A8DBF067DD03360658A8667FC4867100C6D9B30606080EE1BEBF915F11D3ED7BA46262FDDEE065FAFC9119B641F1468179061C28DD89025A455039437C6A082F51830129AB2DB28AC91D19CF0BA0F913C423B4CD4879F277FB3B443F13DA9B27E3E1D2C4EC4B4D6CF3F2B964BED0CE0CBBA7A53629DEB9AAC4781D83AC3D7036B945D908F6621071CC625A105E390A94C7C3BFDD5ADE4E7E6A00ADE541A6D577F036143BAD8001C4B3D2800C2FA797E678D72692EFBCC3D1324CEF08B48AB835CD157979828136E4E68810B6DCE57B83E71785A5A6BBF45B1A46EC36E6EA00A676E075611E5282988C7A0F0D15107504ED64F9A7DB7EE84F04D1C8C344390B257C4D774171D0491536452A2D3B444304283B7086ACB1AFC617F0FEDE7B6524238EC1F71EE160E9CF10A412D64C79714D7A5C9F64BCAE204190E216AF760EB51BFD5F166673B0'

const agent = new https.Agent({ keepAlive: true, maxSockets: 20 })

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      agent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://music.163.com/',
        'Cookie': MUSIC_U ? `MUSIC_U=${MUSIC_U}; os=pc` : 'os=pc'
      }
    }, res => {
      let body = ''
      res.on('data', c => body += c)
      res.on('end', () => {
        try { resolve(JSON.parse(body)) }
        catch (e) { reject(e) }
      })
    }).on('error', reject)
  })
}

function fetchRaw(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      agent,
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://music.163.com/',
        'Cookie': MUSIC_U ? `MUSIC_U=${MUSIC_U}; os=pc` : 'os=pc'
      }
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400) {
        resolve({ redirect: res.headers.location })
        return
      }
      let body = ''
      res.on('data', c => body += c)
      res.on('end', () => resolve({ status: res.statusCode, body }))
    }).on('error', reject)
  })
}

// URL 参数解析
function parseQuery(url) {
  const q = {}
  const i = url.indexOf('?')
  if (i < 0) return q
  url.substring(i + 1).split('&').forEach(p => {
    const [k, v] = p.split('=')
    q[decodeURIComponent(k)] = decodeURIComponent(v || '')
  })
  return q
}

// JSON Body 解析（用于 POST 请求）
function parseBody(req) {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', c => body += c)
    req.on('end', () => {
      try { resolve(JSON.parse(body)) }
      catch (_) { resolve({}) }
    })
  })
}

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    return res.end()
  }

  // 图库 API — 密码验证 + 返回图片列表
  if (req.url.startsWith('/api/gallery') || req.url.includes('/api/gallery')) {
    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json' })
      return res.end(JSON.stringify({ error: 'Method not allowed' }))
    }
    const body = await parseBody(req)
    const galleryPwd = process.env.GALLERY_PASSWORD || '20020113'
    if (!body.password || body.password !== galleryPwd) {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      return res.end(JSON.stringify({ error: '密码错误' }))
    }

    // 1. 扫描服务器上的图库图片目录
    const GALLERY_DIR = process.env.GALLERY_DIR || '/www/wwwroot/fcmmm.xyz/gallery-files'
    let dirImages = []
    try {
      if (fs.existsSync(GALLERY_DIR)) {
        dirImages = fs.readdirSync(GALLERY_DIR)
          .filter(f => /\.(jpg|jpeg|png|gif|webp|mp4|webm)$/i.test(f))
          .map(f => `/gallery-files/${f}`)
      }
    } catch (_) { /* 目录读取失败，跳过 */ }

    // 2. 合并 IMAGE_URLS 中的图片（兼容旧有 Cloudinary 链接）
    const raw = process.env.IMAGE_URLS || ''
    const envImages = raw.split(',').map(s => s.trim()).filter(Boolean)

    const images = [...dirImages, ...envImages]
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
    return res.end(JSON.stringify({ images }))
  }

  const url = req.url.startsWith('http') ? req.url : `https://fcmmm.xyz${req.url}`
  const q = parseQuery(url)
  const { server: srv, type, id } = q

  if (!type || !id) {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({ error: 'Missing type/id' }))
  }

  try {
    switch (type) {
      case 'playlist': {
        const d = await fetchJSON(`https://music.163.com/api/playlist/detail?id=${id}`)
        if (d.code !== 200 || !d.result) {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          return res.end(JSON.stringify({ error: 'Playlist fetch failed' }))
        }
        const baseUrl = 'https://fcmmm.xyz/api/music?server=netease'

        // 调试：打印第一条歌曲的原始结构
        if (d.result.tracks && d.result.tracks[0]) {
          console.log('First track ar:', JSON.stringify(d.result.tracks[0].ar))
          console.log('First track al:', JSON.stringify(d.result.tracks[0].al))
        }

        const songs = (d.result.tracks || []).filter(t => t.id).map(t => {
          // 歌手 — Netease API 字段是 ar (array of {name})
          let artist = '未知歌手'
          if (t.ar && t.ar.length) {
            artist = t.ar.map(a => a.name).join(' / ')
          } else if (t.artists && t.artists.length) {
            artist = t.artists.map(a => a.name).join(' / ')
          }

          // 封面 — 优先 picUrl，其次根据 picId 拼 CDN 地址
          let pic = ''
          if (t.al && t.al.picUrl) {
            pic = t.al.picUrl
          } else if (t.al && t.al.picId) {
            pic = `https://p2.music.126.net/${t.al.picId}.jpg?param=300y300`
          } else if (t.album && t.album.picUrl) {
            pic = t.album.picUrl
          }

          return {
            name: t.name || '',
            artist: artist,
            url: `${baseUrl}&type=url&id=${t.id}`,
            pic: pic,
            lrc: `${baseUrl}&type=lrc&id=${t.id}`
          }
        })
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'public, max-age=600'
        })
        return res.end(JSON.stringify(songs))
      }

      case 'url': {
        const d = await fetchJSON(`https://music.163.com/api/song/enhance/player/url?id=${id}&ids=[${id}]&br=320000`)
        const mp3 = d.data?.[0]?.url
        if (mp3) {
          res.writeHead(302, { 'Location': mp3, 'Cache-Control': 'public, max-age=1800' })
        } else {
          res.writeHead(302, {
            'Location': `https://music.163.com/song/media/outer/url?id=${id}.mp3`,
            'Cache-Control': 'public, max-age=1800'
          })
        }
        return res.end()
      }

      case 'lrc': {
        const d = await fetchJSON(`https://music.163.com/api/song/lyric?id=${id}&lv=1&kv=1&tv=-1`)
        if (d.code === 200) {
          const lrc = [d.lrc?.lyric, d.tlyric?.lyric].filter(Boolean).join('\n')
          if (lrc) {
            res.writeHead(200, {
              'Content-Type': 'text/plain; charset=utf-8',
              'Cache-Control': 'public, max-age=3600'
            })
            return res.end(lrc)
          }
        }
        res.writeHead(404)
        return res.end('No lyrics')
      }

      default:
        res.writeHead(400, { 'Content-Type': 'application/json' })
        return res.end(JSON.stringify({ error: `Unknown type: ${type}` }))
    }
  } catch (e) {
    console.error('API error:', e)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: e.message }))
  }
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Music API running on http://127.0.0.1:${PORT}`)
})
