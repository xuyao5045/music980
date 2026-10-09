<template>
  <div class="upload-container">
    <div class="upload-form">
      <h1>上传音乐</h1>
      <div v-if="!isLoggedIn" class="login-tip">
        请先登录后再上传音乐
        <router-link to="/login" class="btn">去登录</router-link>
      </div>
      <form v-else @submit.prevent="uploadMusic">
        <div class="form-group">
          <label for="title">歌曲标题</label>
          <input type="text" id="title" v-model="form.title" required>
        </div>
        <div class="form-group">
          <label for="artist">歌手</label>
          <input type="text" id="artist" v-model="form.artist" required>
        </div>
        <div class="form-group">
          <label for="musicFile">音乐文件（mp3 / wav / flac / ogg / m4a，最大 30MB）</label>
          <input type="file" id="musicFile" accept=".mp3,.wav,.flac,.ogg,.m4a" @change="handleMusicFile" required>
        </div>
        <div class="form-group">
          <label for="coverFile">封面图片（jpg / png / webp / gif，最大 5MB）</label>
          <input type="file" id="coverFile" accept=".jpg,.jpeg,.png,.webp,.gif" @change="handleCoverFile">
        </div>
        <button type="submit" class="btn" :disabled="isUploading">
          {{ isUploading ? '上传中...' : '上传音乐' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/userStore'
import request from '../utils/request'
import { API_ENDPOINTS } from '../config/api'

const router = useRouter()
const userStore = useUserStore()
const form = ref({
  title: '',
  artist: ''
})
const musicFile = ref(null)
const coverFile = ref(null)
const isUploading = ref(false)

const isLoggedIn = computed(() => userStore.isLoggedIn)

const MUSIC_MAX_SIZE = 30 * 1024 * 1024 // 30MB
const COVER_MAX_SIZE = 5 * 1024 * 1024 // 5MB

const handleMusicFile = (event) => {
  const file = event.target.files[0]
  if (file && file.size > MUSIC_MAX_SIZE) {
    alert('音乐文件不能超过 30MB')
    event.target.value = ''
    musicFile.value = null
    return
  }
  musicFile.value = file
}

const handleCoverFile = (event) => {
  const file = event.target.files[0]
  if (file && file.size > COVER_MAX_SIZE) {
    alert('封面图片不能超过 5MB')
    event.target.value = ''
    coverFile.value = null
    return
  }
  coverFile.value = file
}

const uploadMusic = async () => {
  if (!musicFile.value) {
    alert('请选择音乐文件')
    return
  }
  
  const formData = new FormData()
  formData.append('title', form.value.title)
  formData.append('artist', form.value.artist)
  formData.append('music', musicFile.value)
  if (coverFile.value) {
    formData.append('cover', coverFile.value)
  }
  
  isUploading.value = true
  
  try {
    // 大文件上传耗时不可控，本次请求不套用全局 10s 超时
    await request.post(API_ENDPOINTS.MUSIC.UPLOAD, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 0
    })
    alert('上传成功！')
    router.push('/')
  } catch (error) {
    console.error('上传失败:', error)
    alert(error.response?.data?.error || '上传失败，请稍后重试')
  } finally {
    isUploading.value = false
  }
}
</script>

<style scoped>
.upload-container {
  height: calc(100vh - 60px);
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
}

.upload-form {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 500px;
}

.upload-form h1 {
  margin: 0 0 30px;
  text-align: center;
  color: #333;
}

.login-tip {
  text-align: center;
  padding: 30px 0;
  color: #666;
}

.login-tip .btn {
  margin-top: 15px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #666;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
}

.btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s ease;
  margin: 20px 0;
  text-decoration: none;
}

.btn:hover {
  background-color: #0069d9;
  text-decoration: none;
}

.btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}
</style>
