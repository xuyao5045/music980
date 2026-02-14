import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/upload',
      name: 'upload',
      component: () => import('../views/Upload.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login.vue')
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/Register.vue')
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/Admin.vue'),
      meta: { requiresAdmin: true }
    }
  ]
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 检查是否需要管理员权限
  if (to.matched.some(record => record.meta.requiresAdmin)) {
    // 获取本地存储中的用户信息
    const user = JSON.parse(localStorage.getItem('user'))
    
    // 检查用户是否登录且是管理员
    if (!user || !user.is_admin) {
      // 重定向到登录页面
      next({ name: 'login' })
    } else {
      // 允许访问
      next()
    }
  } else {
    // 不需要管理员权限的页面直接访问
    next()
  }
})

export default router
