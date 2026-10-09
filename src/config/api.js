/**
 * API配置模块
 * 集中管理所有API端点
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

export const API_ENDPOINTS = {
  // 认证相关
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register'
  },
  // 用户相关
  USER: {
    INFO: '/api/user'
  },
  // 音乐相关
  MUSIC: {
    RANDOM: '/api/music/random',
    UPLOAD: '/api/music/upload'
  },
  // 点赞相关
  LIKE: {
    TOGGLE: '/api/like',
    CHECK: '/api/like/check'
  },
  // 评论相关
  COMMENT: {
    LIST: '/api/comments',
    CREATE: '/api/comments',
    DELETE: '/api/comments'
  },
  // 管理员相关（列表与删除共用端点，方法不同）
  ADMIN: {
    USERS: '/api/admin/users',
    COMMENTS: '/api/admin/comments',
    MUSIC: '/api/admin/music'
  }
}

// 获取完整URL的辅助函数（用于图片、音频等资源）
export const getResourceUrl = (path) => {
  if (!path) return null
  return `${API_BASE_URL}${path}`
}
