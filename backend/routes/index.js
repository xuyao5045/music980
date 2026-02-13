const express = require('express')
const authController = require('../controllers/authController')
const musicController = require('../controllers/musicController')
const likeController = require('../controllers/likeController')
const commentController = require('../controllers/commentController')
const auth = require('../middleware/auth')

const router = express.Router()

// 认证路由
router.post('/auth/register', authController.register)
router.post('/auth/login', authController.login)
router.get('/user', auth, authController.getCurrentUser)

// 音乐路由
router.post('/music/upload', auth, musicController.upload)
router.get('/music/random', musicController.getRandomMusic)
router.get('/music/:id', musicController.getMusicById)

// 点赞路由
router.post('/like', auth, likeController.toggleLike)
router.get('/like/check', auth, likeController.checkLikeStatus)

// 评论路由
router.post('/comments', auth, commentController.postComment)
router.get('/comments', commentController.getComments)
router.delete('/comments/:id', auth, commentController.deleteComment)

module.exports = router
