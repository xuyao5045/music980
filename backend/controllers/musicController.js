const fs = require('fs')
const { getPool } = require('../models/db')
const { ALLOWED } = require('../middleware/upload')

// 安全删除磁盘文件（忽略不存在的文件）
const safeUnlink = (filePath) => {
  if (!filePath) return
  fs.promises.unlink(filePath).catch(() => {})
}

const musicController = {
  // 上传音乐（multipart 解析与类型/大小校验已在 upload 中间件完成）
  async upload(req, res) {
    const { title, artist } = req.body || {}
    const musicFile = req.files?.music?.[0]
    const coverFile = req.files?.cover?.[0]
    const uploaderId = req.user.id
    const pool = getPool()

    // 出错时清理已落盘的文件
    const cleanup = () => {
      safeUnlink(musicFile?.path)
      safeUnlink(coverFile?.path)
    }

    try {
      if (!musicFile) {
        cleanup()
        return res.status(400).json({ error: '请上传音乐文件（支持 mp3 / wav / flac / ogg / m4a，最大 30MB）' })
      }

      // 按文件类型强制执行大小上限（multer 只设了全局上限 30MB）
      if (musicFile.size > ALLOWED.music.maxSize) {
        cleanup()
        return res.status(413).json({ error: '音乐文件不能超过 30MB' })
      }
      if (coverFile && coverFile.size > ALLOWED.cover.maxSize) {
        cleanup()
        return res.status(413).json({ error: '封面图片不能超过 5MB' })
      }

      if (typeof title !== 'string' || !title.trim() || title.trim().length > 100) {
        cleanup()
        return res.status(400).json({ error: '歌曲标题不能为空且不能超过100个字符' })
      }
      if (typeof artist !== 'string' || !artist.trim() || artist.trim().length > 100) {
        cleanup()
        return res.status(400).json({ error: '歌手不能为空且不能超过100个字符' })
      }

      const musicFileUrl = `/uploads/music/${musicFile.filename}`
      const coverFileUrl = coverFile ? `/uploads/cover/${coverFile.filename}` : null

      // 保存音乐信息到数据库
      await pool.execute(
        'INSERT INTO music (title, artist, file_url, cover_url, uploader_id) VALUES (?, ?, ?, ?, ?)',
        [title.trim(), artist.trim(), musicFileUrl, coverFileUrl, uploaderId]
      )

      res.status(201).json({ message: '上传成功' })
    } catch (error) {
      cleanup()
      console.error('上传失败:', error)
      res.status(500).json({ error: '上传失败' })
    }
  },

  // 获取随机音乐
  async getRandomMusic(req, res) {
    const pool = getPool()

    try {
      const [musics] = await pool.execute(`
        SELECT
          m.id, m.title, m.artist, m.file_url, m.cover_url, m.uploader_id, m.created_at,
          u.username as uploader_username,
          (SELECT COUNT(*) FROM likes WHERE music_id = m.id) as like_count
        FROM music m
        JOIN user u ON m.uploader_id = u.id
        ORDER BY RAND()
        LIMIT 10
      `)

      res.json(musics)
    } catch (error) {
      console.error('获取随机音乐失败:', error)
      res.status(500).json({ error: '获取随机音乐失败' })
    }
  }
}

module.exports = musicController
