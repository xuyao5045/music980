const express = require('express')
const cors = require('cors')
const path = require('path')
const multer = require('multer')
const { initDB } = require('./models/db')
const routes = require('./routes')

const app = express()
const port = 3000

// 配置中间件
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// 配置 Multer 用于文件上传
const storage = multer.memoryStorage()
const upload = multer({ storage })

// 处理文件上传的中间件
app.use((req, res, next) => {
  if (req.path === '/api/music/upload') {
    return upload.fields([{ name: 'music' }, { name: 'cover' }])(req, res, next)
  }
  next()
})

// 注册路由
app.use('/api', routes)

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
