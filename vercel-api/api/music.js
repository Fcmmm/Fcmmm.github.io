// Meting-compatible API — 用你自己的 MUSIC_U Cookie 代理网易云请求
export default async function handler(req, res) {
  // CORS — 允许博客页面跨域请求
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
    'Cookie': MUSIC_U ? `MUSIC_U=${MUSIC_U}; os=pc; appver=2.9.7` : 'os=pc; appver=2.9.7'
  }

  try {
    switch (type) {
      case 'playlist': {
        // 获取歌单详情
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
            url: `${baseUrl}?server=netease&type=url&id=${t.id}`,
            pic: `${baseUrl}?server=netease&type=pic&id=${t.al?.picId || t.al?.pic_str || t.al?.pic || ''}`,
            lrc: `${baseUrl}?server=netease&type=lrc&id=${t.id}`
          }))

        // 缓存 10 分钟
        res.setHeader('Cache-Control', 'public, max-age=600')
        return res.json(songs)
      }

      case 'url': {
        // 获取歌曲播放 URL
        const songUrl = `https://music.163.com/api/song/enhance/player/url?id=${id}&ids=[${id}]&br=320000`
        const resp = await fetch(songUrl, { headers })
        const data = await resp.json()

        if (data.code === 200 && data.data && data.data[0]) {
          const songData = data.data[0]
          if (songData.url) {
            res.setHeader('Cache-Control', 'public, max-age=1800')
            return res.redirect(302, songData.url)
          }
        }

        // Fallback: try alternate API
        const altUrl = `https://music.163.com/api/song/detail?ids=[${id}]`
        const altResp = await fetch(altUrl, { headers })
        const altData = await altResp.json()

        if (altData.code === 200 && altData.songs && altData.songs[0]) {
          const song = altData.songs[0]
          const mp3Url = song.mp3Url || `https://music.163.com/song/media/outer/url?id=${id}.mp3`
          if (mp3Url) {
            res.setHeader('Cache-Control', 'public, max-age=1800')
            return res.redirect(302, mp3Url)
          }
        }

        // Last fallback
        res.setHeader('Cache-Control', 'public, max-age=1800')
        return res.redirect(302, `https://music.163.com/song/media/outer/url?id=${id}.mp3`)
      }

      case 'pic': {
        // 获取专辑封面
        if (!id || id === 'undefined' || id === 'null' || id === '') {
          return res.redirect(302, 'https://picsum.photos/300/300')
        }
        const picUrl = `https://music.163.com/api/album/detail?id=${id}`
        const resp = await fetch(picUrl, { headers })
        const data = await resp.json()

        if (data.code === 200 && data.album && data.album.picUrl) {
          return res.redirect(302, data.album.picUrl)
        }
        // Fallback: try by pic id directly
        return res.redirect(302, `https://p2.music.126.net/${id}.jpg`)
      }

      case 'lrc': {
        // 获取歌词
        const lrcUrl = `https://music.163.com/api/song/lyric?id=${id}&lv=1&kv=1&tv=-1`
        const resp = await fetch(lrcUrl, { headers })
        const data = await resp.json()

        if (data.code === 200) {
          let lrc = ''
          if (data.lrc && data.lrc.lyric) lrc += data.lrc.lyric
          if (data.tlyric && data.tlyric.lyric) lrc += '\n' + data.tlyric.lyric
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
