import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/components/Login.vue'
import Messenger from '@/components/Messenger.vue'
import { useUserStore } from '@/stores/userStore'

const routes = [
  { path: '/', component: Login },
  { path: '/chat', component: Messenger },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to) => {
  const userStore = useUserStore()
  if (!userStore.currentUser && to.path !== '/') {
    return '/'
  }
})

export default router
