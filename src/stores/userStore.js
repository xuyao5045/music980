import { defineStore } from 'pinia'
import request from '../utils/request'
import { API_ENDPOINTS } from '../config/api'

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
          const user = await request.get(API_ENDPOINTS.USER.INFO)
          this.user = user
          localStorage.setItem('user', JSON.stringify(user))
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
