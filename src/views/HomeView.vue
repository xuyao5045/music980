<template>
  <div class="home-container" @wheel="handleWheel">
    <div v-if="currentMusic" class="music-card">
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
        <button class="btn" @click="toggleComment">评论</button>
      </div>
      <audio ref="audioRef" :src="`http://localhost:3000${currentMusic.file_url}`" @ended="nextMusic" controls autoplay>
        您的浏览器不支持音频播放
      </audio>
      
      <div v-if="showComments" class="comments-section">
        <h3>评论</h3>
        <div v-if="isLoggedIn">
          <textarea v-model="newComment" placeholder="写下您的评论..."></textarea>
          <button class="btn" @click="postComment">发布评论</button>
        </div>
        <div v-else class="login-tip">
          请先登录后再评论
        </div>
        <div class="comment-list">
          <div v-for="comment in comments" :key="comment.id" class="comment-item">
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
const showComments = ref(false)
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

const handleWheel = (event) => {
  if (event.deltaY > 0) {
    musicStore.nextMusic()
  } else {
    musicStore.prevMusic()
  }
}

const nextMusic = () => {
  musicStore.nextMusic()
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
    isLiked.value = !isLiked.value
    // 重新获取音乐信息以更新点赞数
    await musicStore.fetchRandomMusic()
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

const toggleComment = () => {
  showComments.value = !showComments.value
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

<style scoped>
.home-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
  overflow: hidden;
}

.music-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  padding: 40px;
  text-align: center;
  max-width: 500px;
  width: 90%;
  transition: transform 0.3s ease;
}

.music-card:hover {
  transform: translateY(-5px);
}

.cover {
  width: 200px;
  height: 200px;
  margin: 0 auto 30px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.title {
  font-size: 2rem;
  margin: 0 0 10px;
  color: #333;
}

.artist {
  font-size: 1.2rem;
  color: #666;
  margin: 0 0 20px;
}

.music-info {
  display: flex;
  justify-content: space-between;
  margin: 20px 0;
  font-size: 0.9rem;
  color: #999;
}

.actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin: 20px 0;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 20px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s ease;
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

audio {
  width: 100%;
  margin: 20px 0;
}

.comments-section {
  margin-top: 30px;
  text-align: left;
}

.comments-section h3 {
  margin: 0 0 15px;
  color: #333;
}

textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  resize: vertical;
  min-height: 100px;
  margin-bottom: 10px;
}

.login-tip {
  color: #999;
  font-style: italic;
  margin: 10px 0;
}

.comment-list {
  margin-top: 20px;
}

.comment-item {
  padding: 10px;
  border-bottom: 1px solid #eee;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
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
</style>
