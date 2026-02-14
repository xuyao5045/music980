<template>
  <div class="home-container">
    <div v-if="currentMusic" class="content-wrapper">
      <!-- 右侧：上下切换按钮 -->
      <div class="music-controls">
        <button class="control-btn" @click="prevMusic" title="上一首">↑</button>
        <button class="control-btn" @click="nextMusic" title="下一首">↓</button>
      </div>
      <!-- 左侧：歌曲信息 -->
      <div class="music-info-section">
        <div class="cover">
          <img :src="currentMusic.cover_url ? `http://localhost:3000${currentMusic.cover_url}` : '/default-cover.jpg'" :alt="currentMusic.title">
        </div>
        <h1 class="title">{{ currentMusic.title }}</h1>
        <p class="artist">{{ currentMusic.artist }}</p>
        <div class="music-info">
          <span class="uploader">上传者: {{ currentMusic.uploader_username }}</span>
          <span class="likes">{{ currentMusic.like_count }} 点赞</span>
        </div>
        <div class="actions">
          <button class="btn" @click="toggleLike" :class="{ 'liked': isLiked }">
            {{ isLiked ? '已点赞' : '点赞' }}
          </button>
          <button class="btn" @click="scrollToComments">评论</button>
        </div>
        <audio ref="audioRef" :src="`http://localhost:3000${currentMusic.file_url}`" @ended="nextMusic" controls autoplay>
          您的浏览器不支持音频播放
        </audio>
      </div>
      
      <!-- 右侧：评论区 -->
      <div class="comments-section">
        <h3>评论</h3>
        
        <!-- 评论表单：只有点击评论按钮时才显示 -->
        <div v-if="showCommentForm">
          <div v-if="isLoggedIn">
            <textarea v-model="newComment" placeholder="写下您的评论..."></textarea>
            <button class="btn" @click="postComment">发布评论</button>
          </div>
          <div v-else class="login-tip">
            请先登录后再评论
          </div>
        </div>
        
        <!-- 评论列表 -->
        <div class="comment-list">
          <div v-if="comments.length === 0" class="no-comments">
            暂无评论
          </div>
          <div v-else v-for="comment in comments" :key="comment.id" class="comment-item">
            <span class="comment-user">{{ comment.username }}:</span>
            <span class="comment-content">{{ comment.content }}</span>
            <span class="comment-time">{{ formatTime(comment.created_at) }}</span>
            <button v-if="isLoggedIn && comment.user_id === user?.id" class="delete-btn" @click="deleteComment(comment.id)">
              删除
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="loading">
      加载中...
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useMusicStore } from '../stores/musicStore'
import { useUserStore } from '../stores/userStore'
import axios from 'axios'

const musicStore = useMusicStore()
const userStore = useUserStore()
const audioRef = ref(null)
const showCommentForm = ref(false)
const newComment = ref('')
const comments = ref([])
const isLiked = ref(false)

const currentMusic = computed(() => musicStore.currentMusic)
const isLoggedIn = computed(() => userStore.isLoggedIn)
const user = computed(() => userStore.user)

onMounted(async () => {
  await userStore.fetchUser()
  await musicStore.fetchRandomMusic()
  if (currentMusic.value) {
    fetchComments()
    checkLikeStatus()
  }
})

watch(currentMusic, async (newMusic) => {
  if (newMusic) {
    fetchComments()
    checkLikeStatus()
  }
})

const nextMusic = () => {
  musicStore.nextMusic()
}

const prevMusic = () => {
  musicStore.prevMusic()
}

const scrollToComments = () => {
  const commentsSection = document.querySelector('.comments-section')
  if (commentsSection) {
    commentsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    showCommentForm.value = true
  }
}

const toggleLike = async () => {
  if (!isLoggedIn.value) {
    // 提示登录
    alert('请先登录后再点赞')
    return
  }
  
  try {
    await axios.post('http://localhost:3000/api/like', {
      music_id: currentMusic.value.id
    }, {
      headers: {
        Authorization: `Bearer ${userStore.token}`
      }
    })
    // 更新点赞状态
    isLiked.value = !isLiked.value
    // 更新点赞数
    if (isLiked.value) {
      currentMusic.value.like_count++
    } else {
      currentMusic.value.like_count--
    }
  } catch (error) {
    console.error('点赞失败:', error)
  }
}

const checkLikeStatus = async () => {
  if (!isLoggedIn.value || !currentMusic.value) return
  
  try {
    const response = await axios.get(`http://localhost:3000/api/like/check?music_id=${currentMusic.value.id}`, {
      headers: {
        Authorization: `Bearer ${userStore.token}`
      }
    })
    isLiked.value = response.data.is_liked
  } catch (error) {
    console.error('检查点赞状态失败:', error)
  }
}



const fetchComments = async () => {
  if (!currentMusic.value) return
  
  try {
    const response = await axios.get(`http://localhost:3000/api/comments?music_id=${currentMusic.value.id}`)
    comments.value = response.data
  } catch (error) {
    console.error('获取评论失败:', error)
  }
}

const postComment = async () => {
  if (!newComment.value.trim()) return
  
  try {
    await axios.post('http://localhost:3000/api/comments', {
      music_id: currentMusic.value.id,
      content: newComment.value
    }, {
      headers: {
        Authorization: `Bearer ${userStore.token}`
      }
    })
    newComment.value = ''
    await fetchComments()
    // 保持评论表单显示状态，方便用户继续发表评论
    showCommentForm.value = true
  } catch (error) {
    console.error('发布评论失败:', error)
  }
}

const deleteComment = async (commentId) => {
  try {
    await axios.delete(`http://localhost:3000/api/comments/${commentId}`, {
      headers: {
        Authorization: `Bearer ${userStore.token}`
      }
    })
    await fetchComments()
  } catch (error) {
    console.error('删除评论失败:', error)
  }
}

const formatTime = (timeString) => {
  const date = new Date(timeString)
  return date.toLocaleString()
}
</script>

<style>
/* 全局样式：禁止整个页面滚动 */
html, body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  height: 100%;
}
</style>

<style scoped>
.home-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  background-color: #f5f5f5;
  overflow: hidden;
  padding: 25px 20px 20px;
  box-sizing: border-box;
}

.content-wrapper {
  display: flex;
  gap: 30px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  padding: 40px;
  max-width: 1000px;
  width: 100%;
  height: 600px;
  overflow: auto;
  position: relative;
  box-sizing: border-box;
}

/* 上下切换按钮 */
.music-controls {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 10;
}

.control-btn {
  width: 40px;
  height: 40px;
  border: 1px solid #ddd;
  border-radius: 50%;
  background-color: white;
  color: #333;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.control-btn:hover {
  background-color: #f0f0f0;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  transform: scale(1.05);
}

.control-btn:active {
  transform: scale(0.95);
}

/* 左侧：歌曲信息 */
.music-info-section {
  flex: 1;
  min-width: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.cover {
  width: 200px;
  height: 200px;
  margin: 0 auto 20px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.title {
  font-size: 1.6rem;
  margin: 0 0 10px;
  color: #333;
}

.artist {
  font-size: 1.1rem;
  color: #666;
  margin: 0 0 18px;
}

.music-info {
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin: 15px 0;
  font-size: 0.9rem;
  color: #999;
}

.actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin: 15px 0;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 25px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s ease;
}

audio {
  width: 100%;
  margin: 15px 0;
}

.btn:hover {
  background-color: #0069d9;
}

.btn.liked {
  background-color: #28a745;
}

.btn.liked:hover {
  background-color: #218838;
}

/* 右侧：评论区 */
.comments-section {
  flex: 1;
  min-width: 300px;
  max-width: 400px;
  display: flex;
  flex-direction: column;
}

.comments-section h3 {
  margin: 0 0 12px;
  color: #333;
  font-size: 1.1rem;
}

textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 8px;
  resize: vertical;
  min-height: 80px;
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.login-tip {
  color: #999;
  font-style: italic;
  margin: 8px 0;
  font-size: 0.85rem;
}

.comment-list {
  margin-top: 12px;
  max-height: 300px;
  overflow-y: auto;
  padding-right: 10px;
}

.no-comments {
  color: #999;
  text-align: center;
  padding: 30px 0;
  font-style: italic;
  font-size: 0.9rem;
}

.comment-item {
  padding: 8px;
  border-bottom: 1px solid #eee;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
}

.comment-user {
  font-weight: bold;
  color: #333;
}

.comment-content {
  flex: 1;
  color: #666;
}

.comment-time {
  font-size: 0.8rem;
  color: #999;
}

.delete-btn {
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  background-color: #dc3545;
  color: white;
  cursor: pointer;
  font-size: 0.8rem;
}

.delete-btn:hover {
  background-color: #c82333;
}

.loading {
  font-size: 1.5rem;
  color: #666;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .content-wrapper {
    flex-direction: column;
    max-height: none;
  }
  
  .comments-section {
    max-width: none;
  }
}
</style>
