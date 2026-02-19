import { defineStore } from 'pinia'
import request from '../utils/request'
import { API_ENDPOINTS } from '../config/api'

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
        const musicList = await request.get(API_ENDPOINTS.MUSIC.RANDOM)
        this.musicList = musicList
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
