<script setup>
import { ref } from 'vue'
import { usePostStore } from '../stores/postStore.js'
import { timeAgo } from '../utils/timeAgo.js'

const props = defineProps({
  post: { type: Object, required: true },
})

const postStore = usePostStore()

const isEditing = ref(false)
const editContent = ref('')
const showMenu = ref(false)

function startEdit() {
  editContent.value = props.post.content
  isEditing.value = true
  showMenu.value = false
}

function saveEdit() {
  if (!editContent.value.trim()) return
  postStore.editPost(props.post.id, editContent.value.trim())
  isEditing.value = false
}

function cancelEdit() {
  isEditing.value = false
  editContent.value = ''
}

function confirmDelete() {
  showMenu.value = false
  postStore.deletePost(props.post.id)
}
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3 transition hover:shadow-md">
    <!-- Header -->
    <div class="flex items-start justify-between">
      <div class="flex items-center gap-3">
        <img
          :src="post.avatar"
          :alt="post.author"
          class="w-10 h-10 rounded-full bg-gray-100"
        />
        <div>
          <p class="text-sm font-semibold text-gray-900">{{ post.author }}</p>
          <p class="text-xs text-gray-400">{{ timeAgo(post.createdAt) }}</p>
        </div>
      </div>

      <!-- Action menu -->
      <div class="relative">
        <button
          @click="showMenu = !showMenu"
          class="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
          </svg>
        </button>
        <transition name="fade">
          <div
            v-if="showMenu"
            class="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10"
          >
            <button
              @click="startEdit"
              class="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Edit
            </button>
            <button
              @click="confirmDelete"
              class="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        </transition>
      </div>
    </div>

    <!-- Content -->
    <div class="mt-3">
      <template v-if="isEditing">
        <textarea
          v-model="editContent"
          rows="3"
          class="w-full resize-none text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200"
        />
        <div class="flex justify-end gap-2 mt-2">
          <button
            @click="cancelEdit"
            class="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
          <button
            @click="saveEdit"
            :disabled="!editContent.trim()"
            class="px-4 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-40 transition"
          >
            Save
          </button>
        </div>
      </template>
      <p v-else class="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
        {{ post.content }}
      </p>
    </div>
  </div>
</template>
