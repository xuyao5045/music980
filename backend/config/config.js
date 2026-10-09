const path = require('path')

// 加载 backend/.env（无论从哪里启动都能正确定位）
require('dotenv').config({ path: path.join(__dirname, '../.env') })

// JWT 密钥是整条认证防线的基础，缺失时直接拒绝启动
if (!process.env.JWT_SECRET) {
  console.error('启动失败：缺少 JWT_SECRET 环境变量，请在 backend/.env 中配置')
  process.exit(1)
}

module.exports = {
  db: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'music980'
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  // 仅在首次创建 admin 账号时使用；未配置时启动阶段会生成随机密码并打印到控制台
  adminPassword: process.env.ADMIN_PASSWORD || '',
  port: parseInt(process.env.PORT, 10) || 3000,
  // 允许的前端来源，逗号分隔
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(s => s.trim()),
  uploads: {
    music: path.join(__dirname, '../uploads/music'),
    cover: path.join(__dirname, '../uploads/cover')
  }
}
