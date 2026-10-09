const express = require('express')
const { rateLimit } = require('express-rate-limit')
const authController = require('../controllers/authController')
const musicController = require('../controllers/musicController')
const likeController = require('../controllers/likeController')
const commentController = require('../controllers/commentController')
const adminController = require('../controllers/adminController')
const { auth, adminAuth } = require('../middleware/auth')
const { upload } = require('../middleware/upload')

const router = express.Router()

// 认证接口限流：防暴力破解，每个 IP 15 分钟内最多 30 次
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '尝试次数过多，请15分钟后再试' }
})

// 认证路由
router.post('/auth/register', authLimiter, authController.register)
router.post('/auth/login', authLimiter, authController.login)
router.get('/user', auth, authController.getCurrentUser)

// 音乐路由（上传：multipart 解析 + 类型/大小校验在 upload 中间件完成）
router.post(
  '/music/upload',
  auth,
  upload.fields([{ name: 'music', maxCount: 1 }, { name: 'cover', maxCount: 1 }]),
  musicController.upload
)
router.get('/music/random', musicController.getRandomMusic)

// 点赞路由
router.post('/like', auth, likeController.toggleLike)
router.get('/like/check', auth, likeController.checkLikeStatus)

// 评论路由
router.post('/comments', auth, commentController.postComment)
router.get('/comments', commentController.getComments)
router.delete('/comments/:id', auth, commentController.deleteComment)

// 管理员路由
router.get('/admin/users', adminAuth, adminController.getUsers)
router.delete('/admin/users/:id', adminAuth, adminController.deleteUser)
router.get('/admin/comments', adminAuth, adminController.getComments)
router.delete('/admin/comments/:id', adminAuth, adminController.deleteComment)
router.get('/admin/music', adminAuth, adminController.getMusic)
router.delete('/admin/music/:id', adminAuth, adminController.deleteMusic)

module.exports = router
