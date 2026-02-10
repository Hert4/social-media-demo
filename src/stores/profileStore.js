import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getItem, setItem } from '../utils/localStorage.js'

const STORAGE_KEY = 'socialvue_profile'

// Default demo user profile
const DEFAULT_PROFILE = {
  name: 'Alex Johnson',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
  bio: 'Full-stack developer & open-source enthusiast. Building cool things with Vue and TypeScript.',
}

export const useProfileStore = defineStore('profile', () => {
  const profile = ref(getItem(STORAGE_KEY, DEFAULT_PROFILE))

  function updateProfile(updates) {
    profile.value = { ...profile.value, ...updates }
    setItem(STORAGE_KEY, profile.value)
  }

  function resetProfile() {
    profile.value = { ...DEFAULT_PROFILE }
    setItem(STORAGE_KEY, profile.value)
  }

  return { profile, updateProfile, resetProfile }
})
