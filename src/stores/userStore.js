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
          this.isLoggedIn = true
        } catch (error) {
          this.logout()
        }
      }
    }
  }
})
