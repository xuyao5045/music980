const fs = require('fs')
const path = require('path')
const { getPool } = require('../models/db')

const musicController = {
  // 上传音乐
  async upload(req, res) {
    const { title, artist } = req.body
    const musicFile = req.files?.music?.[0]
    const coverFile = req.files?.cover?.[0]
    const uploaderId = req.user.id
    const pool = getPool()
    
    try {
      if (!musicFile) {
        return res.status(400).json({ error: '请上传音乐文件' })
      }
      
      // 生成音乐文件名
      const musicFileName = `${Date.now()}_${Math.floor(Math.random() * 10000)}${path.extname(musicFile.originalname)}`
      const musicFilePath = path.join(__dirname, '../uploads/music', musicFileName)
      
      // 保存音乐文件
      await fs.promises.writeFile(musicFilePath, musicFile.buffer)
      const musicFileUrl = `/uploads/music/${musicFileName}`
      
      // 处理封面图片
      let coverFileUrl = null
      if (coverFile) {
        const coverFileName = `${Date.now()}_${Math.floor(Math.random() * 10000)}${path.extname(coverFile.originalname)}`
        const coverFilePath = path.join(__dirname, '../uploads/avatar', coverFileName)
        await fs.promises.writeFile(coverFilePath, coverFile.buffer)
        coverFileUrl = `/uploads/avatar/${coverFileName}`
      }
      
      // 保存音乐信息到数据库
      await pool.execute(
        'INSERT INTO music (title, artist, file_url, cover_url, uploader_id) VALUES (?, ?, ?, ?, ?)',
        [title, artist, musicFileUrl, coverFileUrl, uploaderId]
      )
      
      res.status(201).json({ message: '上传成功' })
    } catch (error) {
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
  },
  
  // 获取音乐详情
  async getMusicById(req, res) {
    const { id } = req.params
    const pool = getPool()
    
    try {
      const [musics] = await pool.execute(`
        SELECT 
          m.id, m.title, m.artist, m.file_url, m.cover_url, m.uploader_id, m.created_at,
          u.username as uploader_username,
          (SELECT COUNT(*) FROM likes WHERE music_id = m.id) as like_count
        FROM music m
        JOIN user u ON m.uploader_id = u.id
        WHERE m.id = ?
      `, [id])
      
      if (musics.length === 0) {
        return res.status(404).json({ error: '音乐不存在' })
      }
      
      res.json(musics[0])
    } catch (error) {
      console.error('获取音乐详情失败:', error)
      res.status(500).json({ error: '获取音乐详情失败' })
    }
  }
}

module.exports = musicController
