<script setup>
import { ref } from 'vue'
import { usePostStore } from '../stores/postStore.js'
import { useProfileStore } from '../stores/profileStore.js'

const postStore = usePostStore()
const profileStore = useProfileStore()

const content = ref('')
const isFocused = ref(false)

function submit() {
  if (!content.value.trim()) return
  postStore.createPost(content.value.trim(), profileStore.profile)
  content.value = ''
  isFocused.value = false
}
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
    <div class="flex gap-3">
      <img
        :src="profileStore.profile.avatar"
        :alt="profileStore.profile.name"
        class="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0"
      />
      <div class="flex-1">
        <textarea
          v-model="content"
          placeholder="What's on your mind?"
          rows="2"
          class="w-full resize-none border-0 focus:ring-0 text-sm placeholder-gray-400 bg-gray-50 rounded-lg px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-200 transition"
          @focus="isFocused = true"
        />
        <transition name="fade">
          <div v-if="isFocused || content.trim()" class="flex justify-end mt-2">
            <button
              @click="isFocused = false; content = ''"
              class="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 mr-2"
            >
              Cancel
            </button>
            <button
              @click="submit"
              :disabled="!content.trim()"
              class="px-4 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Post
            </button>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>
