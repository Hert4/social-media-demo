import { createRouter, createWebHistory } from 'vue-router'
import Feed from '../pages/Feed.vue'
import Profile from '../pages/Profile.vue'
import Chat from '../pages/Chat.vue'

const routes = [
  { path: '/', name: 'Feed', component: Feed },
  { path: '/profile', name: 'Profile', component: Profile },
  { path: '/chat', name: 'Chat', component: Chat },
  // Catch-all redirect to feed
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
