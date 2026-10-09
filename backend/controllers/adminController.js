const fs = require('fs')
const path = require('path')
const { getPool } = require('../models/db')

// 把 /uploads/xxx 形式的 URL 还原为磁盘路径并安全删除
const removeUploadFile = (fileUrl) => {
  if (!fileUrl || typeof fileUrl !== 'string') return
  // 防目录穿越：必须以 /uploads/ 开头
  if (!fileUrl.startsWith('/uploads/')) return
  const filePath = path.join(__dirname, '../uploads', fileUrl.replace('/uploads/', ''))
  const uploadsRoot = path.join(__dirname, '../uploads')
  if (!path.resolve(filePath).startsWith(path.resolve(uploadsRoot))) return
  fs.promises.unlink(filePath).catch(() => {})
}

const adminController = {
  // 获取所有用户（返回 id，供删除操作使用）
  async getUsers(req, res) {
    const pool = getPool()

    try {
      const [users] = await pool.execute('SELECT id, username, is_admin, created_at FROM user ORDER BY created_at DESC')
      res.json(users)
    } catch (error) {
      console.error('获取用户列表失败:', error)
      res.status(500).json({ error: '获取用户列表失败' })
    }
  },

  // 删除用户（连带清理其评论、点赞、歌曲及磁盘文件；管理员账号受保护）
  async deleteUser(req, res) {
    const { id } = req.params
    const pool = getPool()

    try {
      // 保护：不能删除自己，也不能删除任何管理员账号
      const [targets] = await pool.execute('SELECT id, is_admin FROM user WHERE id = ?', [id])
      if (targets.length > 0) {
        if (Number(id) === req.user.id) {
          return res.status(400).json({ error: '不能删除当前登录的管理员账号' })
        }
        if (targets[0].is_admin) {
          return res.status(403).json({ error: '管理员账号受保护，不能删除' })
        }
      }

      // 开始事务
      const connection = await pool.getConnection()
      await connection.beginTransaction()

      try {
        // 删除用户的所有评论
        await connection.execute('DELETE FROM comment WHERE user_id = ?', [id])

        // 删除用户的所有点赞
        await connection.execute('DELETE FROM likes WHERE user_id = ?', [id])

        // 找出用户上传的歌曲（先收集文件路径，提交后再删文件）
        const [userMusic] = await connection.execute('SELECT id, file_url, cover_url FROM music WHERE uploader_id = ?', [id])

        // 这些歌曲上的他人评论和点赞也要一并清理
        const musicIds = userMusic.map(m => m.id)
        if (musicIds.length > 0) {
          await connection.query(`DELETE FROM comment WHERE music_id IN (${musicIds.map(() => '?').join(',')})`, musicIds)
          await connection.query(`DELETE FROM likes WHERE music_id IN (${musicIds.map(() => '?').join(',')})`, musicIds)
        }

        await connection.execute('DELETE FROM music WHERE uploader_id = ?', [id])

        // 删除用户
        const [result] = await connection.execute('DELETE FROM user WHERE id = ?', [id])

        if (result.affectedRows === 0) {
          await connection.rollback()
          return res.status(404).json({ error: '用户不存在' })
        }

        await connection.commit()

        // 事务提交后再清理磁盘文件（避免删了文件但事务回滚）
        for (const music of userMusic) {
          removeUploadFile(music.file_url)
          removeUploadFile(music.cover_url)
        }

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

  // 获取所有评论（返回 id，供删除操作使用）
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
      res.json(comments)
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

  // 获取所有歌曲（返回 id，供删除操作使用）
  async getMusic(req, res) {
    const pool = getPool()

    try {
      const [music] = await pool.execute(`
        SELECT m.id, m.title, m.artist, m.created_at, u.username as uploader_username
        FROM music m
        JOIN user u ON m.uploader_id = u.id
        ORDER BY m.created_at DESC
      `)
      res.json(music)
    } catch (error) {
      console.error('获取歌曲列表失败:', error)
      res.status(500).json({ error: '获取歌曲列表失败' })
    }
  },

  // 删除歌曲（连带清理评论、点赞及磁盘文件）
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

        // 获取歌曲信息，用于提交后删除文件
        const [musicInfo] = await connection.execute('SELECT file_url, cover_url FROM music WHERE id = ?', [id])

        // 删除歌曲
        const [result] = await connection.execute('DELETE FROM music WHERE id = ?', [id])

        if (result.affectedRows === 0) {
          await connection.rollback()
          return res.status(404).json({ error: '歌曲不存在' })
        }

        await connection.commit()

        // 事务提交后再清理磁盘文件
        if (musicInfo.length > 0) {
          removeUploadFile(musicInfo[0].file_url)
          removeUploadFile(musicInfo[0].cover_url)
        }

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
