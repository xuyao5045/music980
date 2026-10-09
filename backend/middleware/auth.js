const jwt = require('jsonwebtoken')
const config = require('../config/config')
const { getPool } = require('../models/db')

// 从请求头解析并校验 token，成功返回 decoded，失败返回 null
const verifyToken = (req) => {
  const token = req.header('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try {
    return jwt.verify(token, config.jwt.secret)
  } catch (error) {
    return null
  }
}

const auth = (req, res, next) => {
  const decoded = verifyToken(req)
  if (!decoded) {
    return res.status(401).json({ error: '未提供认证令牌或令牌无效' })
  }
  req.user = decoded
  next()
}

// 管理员认证中间件：实时查库验证，权限撤销即时生效
const adminAuth = async (req, res, next) => {
  const decoded = verifyToken(req)
  if (!decoded) {
    return res.status(401).json({ error: '未提供认证令牌或令牌无效' })
  }

  try {
    const pool = getPool()
    const [users] = await pool.execute('SELECT id, is_admin FROM user WHERE id = ?', [decoded.id])

    if (users.length === 0) {
      return res.status(401).json({ error: '用户不存在或已被删除' })
    }
    if (!users[0].is_admin) {
      return res.status(403).json({ error: '无权限访问此页面' })
    }

    req.user = { ...decoded, is_admin: users[0].is_admin }
    next()
  } catch (error) {
    console.error('管理员权限校验失败:', error)
    return res.status(500).json({ error: '权限校验失败' })
  }
}

module.exports = { auth, adminAuth }
