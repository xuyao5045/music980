const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { getPool } = require('../models/db')
const config = require('../config/config')

const authController = {
  // 用户注册
  async register(req, res) {
    const { username, password } = req.body
    const pool = getPool()
    
    try {
      // 检查用户名是否已存在
      const [existingUser] = await pool.execute('SELECT * FROM user WHERE username = ?', [username])
      if (existingUser.length > 0) {
        return res.status(400).json({ error: '用户名已存在' })
      }
      
      // 加密密码
      const hashedPassword = await bcrypt.hash(password, 10)
      
      // 创建用户
      await pool.execute('INSERT INTO user (username, password) VALUES (?, ?)', [username, hashedPassword])
      
      res.status(201).json({ message: '注册成功' })
    } catch (error) {
      console.error('注册失败:', error)
      res.status(500).json({ error: '注册失败' })
    }
  },
  
  // 用户登录
  async login(req, res) {
    const { username, password } = req.body
    const pool = getPool()
    
    try {
      // 查找用户
      const [users] = await pool.execute('SELECT * FROM user WHERE username = ?', [username])
      if (users.length === 0) {
        return res.status(401).json({ error: '用户名或密码错误' })
      }
      
      const user = users[0]
      
      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.password)
      if (!isPasswordValid) {
        return res.status(401).json({ error: '用户名或密码错误' })
      }
      
      // 生成 JWT 令牌
      const token = jwt.sign(
        { id: user.id, username: user.username },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      )
      
      res.json({ token, user: { id: user.id, username: user.username, avatar: user.avatar } })
    } catch (error) {
      console.error('登录失败:', error)
      res.status(500).json({ error: '登录失败' })
    }
  },
  
  // 获取当前用户信息
  async getCurrentUser(req, res) {
    const pool = getPool()
    
    try {
      const [users] = await pool.execute('SELECT id, username, avatar FROM user WHERE id = ?', [req.user.id])
      if (users.length === 0) {
        return res.status(404).json({ error: '用户不存在' })
      }
      
      res.json(users[0])
    } catch (error) {
      console.error('获取用户信息失败:', error)
      res.status(500).json({ error: '获取用户信息失败' })
    }
  }
}

module.exports = authController
