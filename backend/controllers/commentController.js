const { getPool } = require('../models/db')

const commentController = {
  // 发布评论
  async postComment(req, res) {
    const { music_id, content } = req.body
    const user_id = req.user.id
    const pool = getPool()
    
    try {
      await pool.execute('INSERT INTO comment (music_id, user_id, content) VALUES (?, ?, ?)', [music_id, user_id, content])
      res.status(201).json({ message: '评论发布成功' })
    } catch (error) {
      console.error('发布评论失败:', error)
      res.status(500).json({ error: '发布评论失败' })
    }
  },
  
  // 获取音乐的评论列表
  async getComments(req, res) {
    const { music_id } = req.query
    const pool = getPool()
    
    try {
      const [comments] = await pool.execute(`
        SELECT 
          c.id, c.content, c.created_at, c.user_id,
          u.username
        FROM comment c
        JOIN user u ON c.user_id = u.id
        WHERE c.music_id = ?
        ORDER BY c.created_at DESC
      `, [music_id])
      
      res.json(comments)
    } catch (error) {
      console.error('获取评论失败:', error)
      res.status(500).json({ error: '获取评论失败' })
    }
  },
  
  // 删除评论
  async deleteComment(req, res) {
    const { id } = req.params
    const user_id = req.user.id
    const pool = getPool()
    
    try {
      // 检查评论是否存在且属于当前用户
      const [comments] = await pool.execute('SELECT * FROM comment WHERE id = ? AND user_id = ?', [id, user_id])
      if (comments.length === 0) {
        return res.status(404).json({ error: '评论不存在或无权限删除' })
      }
      
      await pool.execute('DELETE FROM comment WHERE id = ?', [id])
      res.json({ message: '评论删除成功' })
    } catch (error) {
      console.error('删除评论失败:', error)
      res.status(500).json({ error: '删除评论失败' })
    }
  }
}

module.exports = commentController
