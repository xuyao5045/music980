const jwt = require('jsonwebtoken')
const config = require('../config/config')

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' })
  }
  
  try {
    const decoded = jwt.verify(token, config.jwt.secret)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ error: '无效的认证令牌' })
  }
}

// 管理员认证中间件
const adminAuth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' })
  }
  
  try {
    const decoded = jwt.verify(token, config.jwt.secret)
    req.user = decoded
    
    // 验证是否为管理员
    if (!decoded.is_admin) {
      return res.status(403).json({ error: '无权限访问此页面' })
    }
    
    next()
  } catch (error) {
    return res.status(401).json({ error: '无效的认证令牌' })
  }
}

module.exports = { auth, adminAuth }
