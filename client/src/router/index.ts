import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/adventure',
    name: 'Adventure',
    component: () => import('@/views/Adventure.vue'),
    meta: { title: '冒险模式' }
  },
  {
    path: '/evolution',
    name: 'Evolution',
    component: () => import('@/views/Evolution.vue'),
    meta: { title: '进化系统' }
  },
  {
    path: '/battle',
    name: 'Battle',
    component: () => import('@/views/Battle.vue'),
    meta: { title: '对战系统' }
  },
  {
    path: '/pets',
    name: 'Pets',
    component: () => import('@/views/Pets.vue'),
    meta: { title: '我的宠物' }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/Settings.vue'),
    meta: { title: '设置' }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 路由守卫 - 设置页面标题
router.beforeEach((to, _from, next) => {
  const title = to.meta.title as string
  if (title) {
    document.title = `${title} - 灵境斗宠录`
  }
  next()
})

export default router
