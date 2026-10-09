const express = require('express')
const cors = require('cors')
const path = require('path')
const config = require('./config/config')
const { initDB } = require('./models/db')
const routes = require('./routes')

const app = express()
const port = config.port

// 不对外暴露 Express 指纹
app.disable('x-powered-by')

// 配置中间件
app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}))
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// 静态文件服务（上传目录）
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// 注册路由
app.use('/api', routes)

// 404 处理
app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' })
})

// 全局错误处理（包含 multer 文件大小超限等错误）
app.use((err, req, res, next) => {
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: '文件大小超出限制（音乐最大 30MB，封面最大 5MB）' })
  }
  if (err && err.name === 'MulterError') {
    return res.status(400).json({ error: `文件上传失败: ${err.message}` })
  }
  console.error('服务器错误:', err)
  res.status(500).json({ error: '服务器内部错误' })
})

// 启动服务器
const startServer = async () => {
  try {
    // 初始化数据库连接
    await initDB()

    // 启动 Express 服务器
    app.listen(port, () => {
      console.log(`服务器运行在 http://localhost:${port}`)
    })
  } catch (error) {
    console.error('启动服务器失败:', error)
    process.exit(1)
  }
}

startServer()
