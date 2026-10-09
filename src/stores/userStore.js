import { defineStore } from 'pinia'
import request from '../utils/request'
import { API_ENDPOINTS } from '../config/api'

export const useUserStore = defineStore('user', {
  state: () => {
    // 初始化时从 localStorage 恢复登录状态，避免刷新后界面闪烁"未登录"
    const token = localStorage.getItem('token') || ''
    let user = null
    try {
      user = JSON.parse(localStorage.getItem('user') || 'null')
    } catch (e) {
      user = null
    }
    return {
      isLoggedIn: !!token,
      user,
      token
    }
  },
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
          // token 失效（401）时拦截器已清理并跳转登录页；
          // 其他错误（如网络波动）保留本地登录状态，下次刷新再试
        }
      }
    }
  }
})
