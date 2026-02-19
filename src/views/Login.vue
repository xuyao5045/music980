<template>
  <div class="login-container">
    <div class="login-form">
      <h1>登录</h1>
      <div class="form-group">
        <label for="username">用户名</label>
        <input type="text" id="username" v-model="form.username" required>
      </div>
      <div class="form-group">
        <label for="password">密码</label>
        <input type="password" id="password" v-model="form.password" required>
      </div>
      <button class="btn" @click="login">登录</button>
      <p class="register-link">还没有账号？<router-link to="/register">立即注册</router-link></p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/userStore'
import request from '../utils/request'
import { API_ENDPOINTS } from '../config/api'

const router = useRouter()
const userStore = useUserStore()
const form = ref({
  username: '',
  password: ''
})

const login = async () => {
  try {
    const result = await request.post(API_ENDPOINTS.AUTH.LOGIN, form.value)
    userStore.setToken(result.token)
    userStore.user = result.user
    localStorage.setItem('user', JSON.stringify(result.user))
    router.push('/')
  } catch (error) {
    console.error('登录失败:', error)
    alert('登录失败，请检查用户名和密码')
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
}

.login-form {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 400px;
}

.login-form h1 {
  margin: 0 0 30px;
  text-align: center;
  color: #333;
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

.register-link {
  text-align: center;
  margin: 0;
  color: #666;
}

.register-link a {
  color: #007bff;
  text-decoration: none;
}

.register-link a:hover {
  text-decoration: underline;
}
</style>
