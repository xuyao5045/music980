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

module.exports = auth
