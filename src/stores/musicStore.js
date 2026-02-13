import { defineStore } from 'pinia'
import axios from 'axios'

export const useMusicStore = defineStore('music', {
  state: () => ({
    currentMusic: null,
    musicList: [],
    currentIndex: 0,
    isPlaying: false
  }),
  actions: {
    async fetchRandomMusic() {
      try {
        const response = await axios.get('http://localhost:3000/api/music/random')
        this.musicList = response.data
        if (this.musicList.length > 0) {
          this.currentMusic = this.musicList[0]
          this.currentIndex = 0
        }
      } catch (error) {
        console.error('Failed to fetch random music:', error)
      }
    },
    nextMusic() {
      if (this.musicList.length > 0) {
        this.currentIndex = (this.currentIndex + 1) % this.musicList.length
        this.currentMusic = this.musicList[this.currentIndex]
      }
    },
    prevMusic() {
      if (this.musicList.length > 0) {
        this.currentIndex = (this.currentIndex - 1 + this.musicList.length) % this.musicList.length
        this.currentMusic = this.musicList[this.currentIndex]
      }
    },
    setPlaying(status) {
      this.isPlaying = status
    }
  }
})
