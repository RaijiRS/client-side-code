import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

import SignIn from '@/views/SignIn.vue'
import Create from '@/views/Create.vue'
import Messages from '@/views/Messages.vue'
import Landing from '@/views/Landing.vue'

const routes = [
  { path: '/', component: Landing },
  { path: '/signin', component: SignIn },
  { path: '/create', component: Create },
  {
    path: '/:username/messages',
    component: Messages,
    meta: { requiresAuth: true },
  },
  {
    path: '/:username/messages/:friendUsername',
    component: Messages,
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const store = useUserStore()
  const loggedIn = store.user !== null

  if (to.meta.requiresAuth && !loggedIn) {
    return { path: '/signin', query: { redirect: to.fullPath } }
  }

  if ((to.path === '/signin' || to.path === '/create') && loggedIn) {
    return { path: `/${store.user.username}/messages` }
  }

  if (to.params.username && loggedIn && store.user?.username) {
  if (to.params.username.toLowerCase() !== store.user.username.toLowerCase()) {
    return { path: `/${store.user.username}/messages` }
  }
}
})

export default router
