// Meting-compatible API
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { server, type, id } = req.query
  if (!server || !type || !id) return res.status(400).json({ error: 'Missing params' })

  const CK = process.env.MUSIC_U || ''
  const H = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Referer': 'https://music.163.com/',
    'Cookie': CK ? `MUSIC_U=${CK}; os=pc` : 'os=pc'
  }

  try {
    switch (type) {
      case 'playlist': {
        const r = await fetch(`https://music.163.com/api/playlist/detail?id=${id}`, { headers: H })
        const d = await r.json()
        if (d.code !== 200 || !d.result) return res.status(500).json({ error: 'Playlist fetch failed' })

        const base = `https://${req.headers.host}/api/music`

        const songs = (d.result.tracks || []).filter(t => t.id).map(t => ({
          name: t.name || '',
          artist: (t.ar || []).map(a => a.name).join(' / ') || '未知歌手',
          url: `${base}?server=netease&type=url&id=${t.id}`,
          pic: t.al?.picUrl || (t.al?.picId ? `https://p2.music.126.net/${t.al.picId}.jpg?param=300y300` : ''),
          lrc: `${base}?server=netease&type=lrc&id=${t.id}`
        }))

        res.setHeader('Cache-Control', 'public, max-age=600')
        return res.json(songs)
      }

      case 'url': {
        const r = await fetch(`https://music.163.com/api/song/enhance/player/url?id=${id}&ids=[${id}]&br=320000`, { headers: H })
        const d = await r.json()
        const mp3 = d.data?.[0]?.url
        res.setHeader('Cache-Control', 'public, max-age=1800')
        return mp3
          ? res.redirect(302, mp3)
          : res.redirect(302, `https://music.163.com/song/media/outer/url?id=${id}.mp3`)
      }

      case 'lrc': {
        const r = await fetch(`https://music.163.com/api/song/lyric?id=${id}&lv=1&kv=1&tv=-1`, { headers: H })
        const d = await r.json()
        if (d.code === 200) {
          const lrc = [d.lrc?.lyric, d.tlyric?.lyric].filter(Boolean).join('\n')
          if (lrc) {
            res.setHeader('Content-Type', 'text/plain; charset=utf-8')
            res.setHeader('Cache-Control', 'public, max-age=3600')
            return res.send(lrc)
          }
        }
        return res.status(404).send('No lyrics')
      }

      default:
        return res.status(400).json({ error: 'Unknown type' })
    }
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
