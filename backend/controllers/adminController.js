const { getPool } = require('../models/db')

const adminController = {
  // 获取所有用户
  async getUsers(req, res) {
    const pool = getPool()
    
    try {
      const [users] = await pool.execute('SELECT id, username, created_at FROM user')
      // 移除ID字段
      const usersWithoutId = users.map(user => ({
        username: user.username
      }))
      res.json(usersWithoutId)
    } catch (error) {
      console.error('获取用户列表失败:', error)
      res.status(500).json({ error: '获取用户列表失败' })
    }
  },
  
  // 删除用户
  async deleteUser(req, res) {
    const { id } = req.params
    const pool = getPool()
    
    try {
      // 开始事务
      const connection = await pool.getConnection()
      await connection.beginTransaction()
      
      try {
        // 删除用户的所有评论
        await connection.execute('DELETE FROM comment WHERE user_id = ?', [id])
        
        // 删除用户的所有点赞
        await connection.execute('DELETE FROM likes WHERE user_id = ?', [id])
        
        // 删除用户上传的所有歌曲
        const [userMusic] = await connection.execute('SELECT id, file_url, cover_url FROM music WHERE uploader_id = ?', [id])
        for (const music of userMusic) {
          // 这里可以添加删除文件系统中的音乐文件和封面图片的代码
        }
        await connection.execute('DELETE FROM music WHERE uploader_id = ?', [id])
        
        // 删除用户
        const [result] = await connection.execute('DELETE FROM user WHERE id = ?', [id])
        
        if (result.affectedRows === 0) {
          await connection.rollback()
          return res.status(404).json({ error: '用户不存在' })
        }
        
        await connection.commit()
        res.json({ message: '用户删除成功' })
      } catch (error) {
        await connection.rollback()
        throw error
      } finally {
        connection.release()
      }
    } catch (error) {
      console.error('删除用户失败:', error)
      res.status(500).json({ error: '删除用户失败' })
    }
  },
  
  // 获取所有评论
  async getComments(req, res) {
    const pool = getPool()
    
    try {
      const [comments] = await pool.execute(`
        SELECT c.id, c.content, c.created_at, u.username, m.title as music_title
        FROM comment c
        JOIN user u ON c.user_id = u.id
        JOIN music m ON c.music_id = m.id
        ORDER BY c.created_at DESC
      `)
      // 移除ID字段
      const commentsWithoutId = comments.map(comment => ({
        content: comment.content,
        created_at: comment.created_at,
        username: comment.username,
        music_title: comment.music_title
      }))
      res.json(commentsWithoutId)
    } catch (error) {
      console.error('获取评论列表失败:', error)
      res.status(500).json({ error: '获取评论列表失败' })
    }
  },
  
  // 删除评论
  async deleteComment(req, res) {
    const { id } = req.params
    const pool = getPool()
    
    try {
      const [result] = await pool.execute('DELETE FROM comment WHERE id = ?', [id])
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: '评论不存在' })
      }
      
      res.json({ message: '评论删除成功' })
    } catch (error) {
      console.error('删除评论失败:', error)
      res.status(500).json({ error: '删除评论失败' })
    }
  },
  
  // 获取所有歌曲
  async getMusic(req, res) {
    const pool = getPool()
    
    try {
      const [music] = await pool.execute(`
        SELECT m.id, m.title, m.artist, m.created_at, u.username as uploader_username
        FROM music m
        JOIN user u ON m.uploader_id = u.id
        ORDER BY m.created_at DESC
      `)
      // 移除ID字段
      const musicWithoutId = music.map(song => ({
        title: song.title,
        artist: song.artist,
        uploader_username: song.uploader_username
      }))
      res.json(musicWithoutId)
    } catch (error) {
      console.error('获取歌曲列表失败:', error)
      res.status(500).json({ error: '获取歌曲列表失败' })
    }
  },
  
  // 删除歌曲
  async deleteMusic(req, res) {
    const { id } = req.params
    const pool = getPool()
    
    try {
      // 开始事务
      const connection = await pool.getConnection()
      await connection.beginTransaction()
      
      try {
        // 删除歌曲的所有评论
        await connection.execute('DELETE FROM comment WHERE music_id = ?', [id])
        
        // 删除歌曲的所有点赞
        await connection.execute('DELETE FROM likes WHERE music_id = ?', [id])
        
        // 获取歌曲信息，用于后续删除文件
        const [musicInfo] = await connection.execute('SELECT file_url, cover_url FROM music WHERE id = ?', [id])
        if (musicInfo.length > 0) {
          // 这里可以添加删除文件系统中的音乐文件和封面图片的代码
        }
        
        // 删除歌曲
        const [result] = await connection.execute('DELETE FROM music WHERE id = ?', [id])
        
        if (result.affectedRows === 0) {
          await connection.rollback()
          return res.status(404).json({ error: '歌曲不存在' })
        }
        
        await connection.commit()
        res.json({ message: '歌曲删除成功' })
      } catch (error) {
        await connection.rollback()
        throw error
      } finally {
        connection.release()
      }
    } catch (error) {
      console.error('删除歌曲失败:', error)
      res.status(500).json({ error: '删除歌曲失败' })
    }
  }
}

module.exports = adminController