import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getItem, setItem } from '../utils/localStorage.js'
import { useToastStore } from './toastStore.js'

const STORAGE_KEY = 'socialvue_posts'

// Seed data so the feed isn't empty on first visit
const SEED_POSTS = [
  {
    id: 'seed-1',
    author: 'Alex Johnson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    content: 'Just shipped a new feature using Vue 3 Composition API. The reactivity system is incredible!',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'seed-2',
    author: 'Alex Johnson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    content: 'TailwindCSS + Vite is the fastest way to prototype beautiful UIs. Highly recommend this stack for demos and MVPs.',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'seed-3',
    author: 'Alex Johnson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    content: 'Working on a browser automation SDK that uses multi-agent architecture with DOM distillation. Exciting stuff!',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
]

export const usePostStore = defineStore('posts', () => {
  const posts = ref(getItem(STORAGE_KEY, SEED_POSTS))

  function persist() {
    setItem(STORAGE_KEY, posts.value)
  }

  function createPost(content, profile) {
    const post = {
      id: `post-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      author: profile.name,
      avatar: profile.avatar,
      content,
      createdAt: new Date().toISOString(),
    }
    posts.value.unshift(post)
    persist()
    useToastStore().show('Post created!', 'success')
    return post
  }

  function editPost(id, newContent) {
    const post = posts.value.find((p) => p.id === id)
    if (post) {
      post.content = newContent
      persist()
      useToastStore().show('Post updated!', 'success')
    }
  }

  function deletePost(id) {
    posts.value = posts.value.filter((p) => p.id !== id)
    persist()
    useToastStore().show('Post deleted.', 'info')
  }

  // Sync author info when profile changes
  function syncAuthor(profile) {
    let changed = false
    posts.value.forEach((p) => {
      if (p.author !== profile.name || p.avatar !== profile.avatar) {
        p.author = profile.name
        p.avatar = profile.avatar
        changed = true
      }
    })
    if (changed) persist()
  }

  return { posts, createPost, editPost, deletePost, syncAuthor }
})
