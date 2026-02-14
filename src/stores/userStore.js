import { defineStore } from 'pinia'
import axios from 'axios'

export const useUserStore = defineStore('user', {
  state: () => ({
    isLoggedIn: false,
    user: null,
    token: localStorage.getItem('token') || ''
  }),
  actions: {
    setToken(token) {
      this.token = token
      localStorage.setItem('token', token)
      this.isLoggedIn = true
    },
    logout() {
      this.token = ''
      this.user = null
      this.isLoggedIn = false
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
    async fetchUser() {
      if (this.token) {
        try {
          const response = await axios.get('http://localhost:3000/api/user', {
            headers: {
              Authorization: `Bearer ${this.token}`
            }
          })
          this.user = response.data
          localStorage.setItem('user', JSON.stringify(response.data))
          this.isLoggedIn = true
        } catch (error) {
          console.error('获取用户信息失败:', error)
          // 暂时不登出，保留登录状态
          // this.logout()
        }
      }
    }
  }
})
