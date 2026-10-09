const fs = require('fs')
const path = require('path')
const multer = require('multer')
const config = require('../config/config')

// 上传文件类型白名单（扩展名 + MIME 双重校验）
const ALLOWED = {
  music: {
    exts: ['.mp3', '.wav', '.flac', '.ogg', '.m4a'],
    mimes: ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/wave', 'audio/flac', 'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'application/octet-stream'],
    dir: config.uploads.music,
    maxSize: 30 * 1024 * 1024 // 30MB
  },
  cover: {
    exts: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
    mimes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    dir: config.uploads.cover,
    maxSize: 5 * 1024 * 1024 // 5MB
  }
}

// 确保上传目录存在
for (const rule of Object.values(ALLOWED)) {
  fs.mkdirSync(rule.dir, { recursive: true })
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const rule = ALLOWED[file.fieldname]
    if (!rule) return cb(new Error(`未知的上传字段: ${file.fieldname}`))
    cb(null, rule.dir)
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${Date.now()}_${Math.floor(Math.random() * 10000)}${ext}`)
  }
})

const fileFilter = (req, file, cb) => {
  const rule = ALLOWED[file.fieldname]
  if (!rule) return cb(null, false)

  const ext = path.extname(file.originalname).toLowerCase()
  const extOk = rule.exts.includes(ext)
  const mimeOk = rule.mimes.includes(file.mimetype)

  if (extOk && mimeOk) {
    cb(null, true)
  } else {
    // 拒绝接收该文件，由控制器给出统一提示
    cb(null, false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    // 取两类中的最大值作为硬上限，单类超限由业务侧提示
    fileSize: Math.max(...Object.values(ALLOWED).map(r => r.maxSize)),
    files: 2
  }
})

module.exports = { upload, ALLOWED }
