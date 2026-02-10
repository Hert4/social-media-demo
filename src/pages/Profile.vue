<script setup>
import { ref, watch } from 'vue'
import { useProfileStore } from '../stores/profileStore.js'
import { usePostStore } from '../stores/postStore.js'
import { useToastStore } from '../stores/toastStore.js'

const profileStore = useProfileStore()
const postStore = usePostStore()
const toast = useToastStore()

const isEditing = ref(false)

// Local copy of profile fields for the edit form
const form = ref({ ...profileStore.profile })

function startEdit() {
  form.value = { ...profileStore.profile }
  isEditing.value = true
}

function save() {
  profileStore.updateProfile(form.value)
  // Sync updated name/avatar across existing posts
  postStore.syncAuthor(profileStore.profile)
  isEditing.value = false
  toast.show('Profile updated!', 'success')
}

function cancel() {
  isEditing.value = false
}

function reset() {
  profileStore.resetProfile()
  postStore.syncAuthor(profileStore.profile)
  form.value = { ...profileStore.profile }
  toast.show('Profile reset to default.', 'info')
}

// Keep form in sync if store changes externally
watch(() => profileStore.profile, (v) => {
  if (!isEditing.value) form.value = { ...v }
}, { deep: true })
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    <!-- Cover banner -->
    <div class="h-32 bg-gradient-to-r from-primary-500 to-primary-700" />

    <!-- Avatar + info -->
    <div class="px-6 pb-6 -mt-12">
      <div class="flex items-end gap-4 mb-6">
        <img
          :src="profileStore.profile.avatar"
          :alt="profileStore.profile.name"
          class="w-24 h-24 rounded-full border-4 border-white bg-gray-100 shadow"
        />
        <div class="flex-1 pt-14">
          <h1 class="text-xl font-bold text-gray-900">{{ profileStore.profile.name }}</h1>
          <p class="text-sm text-gray-500 mt-0.5">{{ profileStore.profile.bio }}</p>
        </div>
      </div>

      <!-- View mode -->
      <div v-if="!isEditing" class="flex gap-2">
        <button
          @click="startEdit"
          class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition"
        >
          Edit Profile
        </button>
        <button
          @click="reset"
          class="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
        >
          Reset
        </button>
      </div>

      <!-- Edit mode -->
      <div v-else class="space-y-4 mt-2">
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">Name</label>
          <input
            v-model="form.name"
            type="text"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">Avatar URL</label>
          <input
            v-model="form.avatar"
            type="text"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
          <p class="text-xs text-gray-400 mt-1">
            Tip: Use <a href="https://www.dicebear.com/styles/avataaars/" target="_blank" class="text-primary-500 underline">DiceBear</a>
            — e.g. https://api.dicebear.com/7.x/avataaars/svg?seed=YourName
          </p>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">Bio</label>
          <textarea
            v-model="form.bio"
            rows="3"
            class="w-full resize-none border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
        </div>
        <div class="flex gap-2">
          <button
            @click="save"
            :disabled="!form.name.trim()"
            class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-40 transition"
          >
            Save
          </button>
          <button
            @click="cancel"
            class="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
