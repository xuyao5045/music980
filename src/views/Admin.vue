<template>
  <div class="admin-container">
    <h1>管理后台</h1>
    
    <!-- 导航标签 -->
    <div class="admin-nav">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        :class="['nav-btn', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.name }}
      </button>
    </div>
    
    <!-- 内容区域 -->
    <div class="admin-content">
      <!-- 用户管理 -->
      <div v-if="activeTab === 'users'" class="tab-content">
        <h2>用户管理</h2>
        <div class="search-bar">
          <input type="text" v-model="searchUsers" placeholder="搜索用户名..." />
        </div>
        <table class="admin-table">
          <thead>
            <tr>
              <th>用户名</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td>{{ user.username }}</td>
              <td>
                <button class="delete-btn" @click="deleteUser(user.id)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- 评论管理 -->
      <div v-if="activeTab === 'comments'" class="tab-content">
        <h2>评论管理</h2>
        <div class="search-bar">
          <input type="text" v-model="searchComments" placeholder="搜索评论内容..." />
        </div>
        <table class="admin-table">
          <thead>
            <tr>
              <th>用户</th>
              <th>歌曲</th>
              <th>内容</th>
              <th>时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="comment in filteredComments" :key="comment.id">
              <td>{{ comment.username }}</td>
              <td>{{ comment.music_title }}</td>
              <td>{{ comment.content }}</td>
              <td>{{ formatTime(comment.created_at) }}</td>
              <td>
                <button class="delete-btn" @click="deleteComment(comment.id)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- 歌曲管理 -->
      <div v-if="activeTab === 'music'" class="tab-content">
        <h2>歌曲管理</h2>
        <div class="search-bar">
          <input type="text" v-model="searchMusic" placeholder="搜索歌曲标题..." />
        </div>
        <table class="admin-table">
          <thead>
            <tr>
              <th>标题</th>
              <th>艺术家</th>
              <th>上传者</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="song in filteredMusic" :key="song.id">
              <td>{{ song.title }}</td>
              <td>{{ song.artist }}</td>
              <td>{{ song.uploader_username }}</td>
              <td>
                <button class="delete-btn" @click="deleteMusic(song.id)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '../utils/request'
import { API_ENDPOINTS } from '../config/api'

const router = useRouter()
const activeTab = ref('users')
const searchUsers = ref('')
const searchComments = ref('')
const searchMusic = ref('')
const users = ref([])
const comments = ref([])
const music = ref([])

const tabs = [
  { id: 'users', name: '用户管理' },
  { id: 'comments', name: '评论管理' },
  { id: 'music', name: '歌曲管理' }
]

// 过滤用户列表
const filteredUsers = computed(() => {
  if (!searchUsers.value) return users.value
  return users.value.filter(user => 
    user.username.toLowerCase().includes(searchUsers.value.toLowerCase())
  )
})

// 过滤评论列表
const filteredComments = computed(() => {
  if (!searchComments.value) return comments.value
  return comments.value.filter(comment => 
    comment.content.toLowerCase().includes(searchComments.value.toLowerCase())
  )
})

// 过滤歌曲列表
const filteredMusic = computed(() => {
  if (!searchMusic.value) return music.value
  return music.value.filter(song => 
    song.title.toLowerCase().includes(searchMusic.value.toLowerCase())
  )
})

// 获取所有用户
const fetchUsers = async () => {
  try {
    const response = await request.get(API_ENDPOINTS.ADMIN.USERS)
    users.value = response
  } catch (error) {
    console.error('获取用户列表失败:', error)
    handleAuthError(error)
  }
}

// 获取所有评论
const fetchComments = async () => {
  try {
    const response = await request.get(API_ENDPOINTS.ADMIN.COMMENTS)
    comments.value = response
  } catch (error) {
    console.error('获取评论列表失败:', error)
    handleAuthError(error)
  }
}

// 获取所有歌曲
const fetchMusic = async () => {
  try {
    const response = await request.get(API_ENDPOINTS.ADMIN.MUSIC)
    music.value = response
  } catch (error) {
    console.error('获取歌曲列表失败:', error)
    handleAuthError(error)
  }
}

// 删除用户
const deleteUser = async (userId) => {
  if (!confirm('确定要删除这个用户吗？')) return
  
  try {
    await request.delete(`${API_ENDPOINTS.ADMIN.DELETE_USER}/${userId}`)
    users.value = users.value.filter(user => user.id !== userId)
    alert('用户删除成功')
  } catch (error) {
    console.error('删除用户失败:', error)
    alert('删除用户失败')
  }
}

// 删除评论
const deleteComment = async (commentId) => {
  if (!confirm('确定要删除这个评论吗？')) return
  
  try {
    await request.delete(`${API_ENDPOINTS.ADMIN.DELETE_COMMENT}/${commentId}`)
    comments.value = comments.value.filter(comment => comment.id !== commentId)
    alert('评论删除成功')
  } catch (error) {
    console.error('删除评论失败:', error)
    alert('删除评论失败')
  }
}

// 删除歌曲
const deleteMusic = async (musicId) => {
  if (!confirm('确定要删除这首歌吗？')) return
  
  try {
    await request.delete(`${API_ENDPOINTS.ADMIN.DELETE_MUSIC}/${musicId}`)
    music.value = music.value.filter(song => song.id !== musicId)
    alert('歌曲删除成功')
  } catch (error) {
    console.error('删除歌曲失败:', error)
    alert('删除歌曲失败')
  }
}

// 处理认证错误
const handleAuthError = (error) => {
  if (error.response && error.response.status === 401) {
    alert('请先登录管理员账号')
    router.push('/login')
  }
}

// 格式化时间
const formatTime = (timeString) => {
  const date = new Date(timeString)
  return date.toLocaleString()
}

// 切换标签时重新获取数据
const fetchDataByTab = () => {
  if (activeTab.value === 'users') {
    fetchUsers()
  } else if (activeTab.value === 'comments') {
    fetchComments()
  } else if (activeTab.value === 'music') {
    fetchMusic()
  }
}

// 监听标签切换
activeTab.value = 'users'
fetchDataByTab()
activeTab.value = 'comments'
fetchDataByTab()
activeTab.value = 'music'
fetchDataByTab()
activeTab.value = 'users'

// 页面加载时获取数据
onMounted(() => {
  fetchDataByTab()
})
</script>

<style scoped>
.admin-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 10px 20px;
  height: 600px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.admin-nav {
  display: flex;
  gap: 10px;
  margin: 10px 0;
  border-bottom: 1px solid #ddd;
  padding-bottom: 5px;
}

.nav-btn {
  padding: 10px 20px;
  border: none;
  background: #f0f0f0;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.nav-btn:hover {
  background: #e0e0e0;
}

.nav-btn.active {
  background: #007bff;
  color: white;
}

.admin-content {
  margin-top: 10px;
  flex: 1;
  overflow-y: auto;
  padding-right: 10px;
  padding-bottom: 20px;
}

.tab-content {
  margin-top: 5px;
}

.search-bar {
  margin-bottom: 20px;
}

.search-bar input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1rem;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border-radius: 5px;
  overflow: hidden;
}

.admin-table th,
.admin-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.admin-table th {
  background: #f8f9fa;
  font-weight: bold;
  color: #333;
}

.admin-table tr:hover {
  background: #f8f9fa;
}

.delete-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  background: #dc3545;
  color: white;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.delete-btn:hover {
  background: #c82333;
}
</style>