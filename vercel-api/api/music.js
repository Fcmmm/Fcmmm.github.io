// Meting-compatible API — 用你自己的 MUSIC_U Cookie 代理网易云请求
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const { server, type, id } = req.query
  if (!server || !type || !id) {
    return res.status(400).json({ error: 'Missing server/type/id params' })
  }

  const MUSIC_U = process.env.MUSIC_U || ''
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Referer': 'https://music.163.com/',
    'Cookie': MUSIC_U ? `MUSIC_U=${MUSIC_U}; os=pc` : 'os=pc'
  }

  try {
    switch (type) {
      // 获取歌单 — 直接返回 Netease 原始封面 URL，不用代理
      case 'playlist': {
        const detailUrl = `https://music.163.com/api/playlist/detail?id=${id}`
        const resp = await fetch(detailUrl, { headers })
        const data = await resp.json()

        if (data.code !== 200 || !data.result) {
          return res.status(500).json({ error: 'Failed to fetch playlist' })
        }

        const tracks = data.result.tracks || []
        const baseUrl = `https://${req.headers.host}/api/music`

        const songs = tracks
          .filter(t => t.id)
          .map(t => ({
            name: t.name || '',
            artist: (t.ar || []).map(a => a.name).join(' / '),
            // 音频和歌词走 Vercel 代理
            url: `${baseUrl}?server=netease&type=url&id=${t.id}`,
            lrc: `${baseUrl}?server=netease&type=lrc&id=${t.id}`,
            // 封面直接用 Netease CDN（公开访问，不需要代理）
            pic: t.al?.picUrl || `https://p2.music.126.net/${t.al?.picId || 0}.jpg?param=300y300`,
          }))

        res.setHeader('Cache-Control', 'public, max-age=600')
        return res.json(songs)
      }

      // 获取音频 URL — 异步获取，支持并发
      case 'url': {
        const songUrl = `https://music.163.com/api/song/enhance/player/url?id=${id}&ids=[${id}]&br=320000`
        const resp = await fetch(songUrl, { headers })
        const data = await resp.json()

        if (data.code === 200 && data.data?.[0]?.url) {
          res.setHeader('Cache-Control', 'public, max-age=1800')
          return res.redirect(302, data.data[0].url)
        }

        // Fallback: 通用外链（可能只有 30s 试听）
        res.setHeader('Cache-Control', 'public, max-age=1800')
        return res.redirect(302, `https://music.163.com/song/media/outer/url?id=${id}.mp3`)
      }

      // 获取歌词
      case 'lrc': {
        const lrcUrl = `https://music.163.com/api/song/lyric?id=${id}&lv=1&kv=1&tv=-1`
        const resp = await fetch(lrcUrl, { headers })
        const data = await resp.json()

        if (data.code === 200) {
          let lrc = ''
          if (data.lrc?.lyric) lrc += data.lrc.lyric
          if (data.tlyric?.lyric) lrc += '\n' + data.tlyric.lyric
          if (lrc) {
            res.setHeader('Content-Type', 'text/plain; charset=utf-8')
            res.setHeader('Cache-Control', 'public, max-age=3600')
            return res.send(lrc)
          }
        }
        return res.status(404).send('No lyrics')
      }

      default:
        return res.status(400).json({ error: `Unsupported type: ${type}` })
    }
  } catch (e) {
    console.error('Music API error:', e)
    return res.status(500).json({ error: e.message })
  }
}
