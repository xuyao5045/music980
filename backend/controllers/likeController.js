const { getPool } = require('../models/db')

const likeController = {
  // 点赞或取消点赞
  async toggleLike(req, res) {
    const { music_id } = req.body || {}
    const user_id = req.user.id
    const pool = getPool()

    try {
      if (!music_id) {
        return res.status(400).json({ error: '缺少 music_id 参数' })
      }

      // 确认音乐存在，避免外键错误被当成 500
      const [musics] = await pool.execute('SELECT id FROM music WHERE id = ?', [music_id])
      if (musics.length === 0) {
        return res.status(404).json({ error: '音乐不存在' })
      }

      // 检查是否已点赞
      const [existingLike] = await pool.execute('SELECT * FROM likes WHERE user_id = ? AND music_id = ?', [user_id, music_id])
      
      if (existingLike.length > 0) {
        // 已点赞，取消点赞
        await pool.execute('DELETE FROM likes WHERE user_id = ? AND music_id = ?', [user_id, music_id])
        res.json({ message: '取消点赞成功' })
      } else {
        // 未点赞，添加点赞
        await pool.execute('INSERT INTO likes (user_id, music_id) VALUES (?, ?)', [user_id, music_id])
        res.json({ message: '点赞成功' })
      }
    } catch (error) {
      console.error('点赞操作失败:', error)
      res.status(500).json({ error: '点赞操作失败' })
    }
  },
  
  // 检查用户是否已点赞
  async checkLikeStatus(req, res) {
    const { music_id } = req.query
    const user_id = req.user.id
    const pool = getPool()
    
    try {
      const [likes] = await pool.execute('SELECT * FROM likes WHERE user_id = ? AND music_id = ?', [user_id, music_id])
      res.json({ is_liked: likes.length > 0 })
    } catch (error) {
      console.error('检查点赞状态失败:', error)
      res.status(500).json({ error: '检查点赞状态失败' })
    }
  }
}

module.exports = likeController
