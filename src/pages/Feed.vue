<script setup>
import { ref, onMounted } from 'vue'
import { usePostStore } from '../stores/postStore.js'
import { useProfileStore } from '../stores/profileStore.js'
import PostEditor from '../components/PostEditor.vue'
import PostItem from '../components/PostItem.vue'
import LoadingSkeleton from '../components/LoadingSkeleton.vue'

const postStore = usePostStore()
const profileStore = useProfileStore()
const loading = ref(true)

// Simulate initial load delay for skeleton demo
onMounted(() => {
  postStore.syncAuthor(profileStore.profile)
  setTimeout(() => (loading.value = false), 600)
})
</script>

<template>
  <div>
    <PostEditor />

    <!-- Loading skeleton -->
    <LoadingSkeleton v-if="loading" :lines="3" />

    <!-- Posts list -->
    <template v-else>
      <div v-if="postStore.posts.length === 0" class="text-center py-16">
        <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
        <p class="text-gray-400 text-sm">No posts yet. Be the first to share something!</p>
      </div>

      <TransitionGroup name="fade">
        <PostItem
          v-for="post in postStore.posts"
          :key="post.id"
          :post="post"
        />
      </TransitionGroup>
    </template>
  </div>
</template>
