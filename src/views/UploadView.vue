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
          <label for="musicFile">音乐文件 (.mp3 / .wav)</label>
          <input type="file" id="musicFile" accept=".mp3,.wav" @change="handleMusicFile" required>
        </div>
        <div class="form-group">
          <label for="coverFile">封面图片</label>
          <input type="file" id="coverFile" accept="image/*" @change="handleCoverFile">
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
import axios from 'axios'

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

const handleMusicFile = (event) => {
  musicFile.value = event.target.files[0]
}

const handleCoverFile = (event) => {
  coverFile.value = event.target.files[0]
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
    await axios.post('http://localhost:3000/api/music/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${userStore.token}`
      }
    })
    alert('上传成功！')
    router.push('/')
  } catch (error) {
    console.error('上传失败:', error)
    alert('上传失败，请稍后重试')
  } finally {
    isUploading.value = false
  }
}
</script>

<style scoped>
.upload-container {
  height: 100vh;
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
}

.btn:hover {
  background-color: #0069d9;
}

.btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}
</style>
