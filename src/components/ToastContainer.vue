<script setup>
import { useToastStore } from '../stores/toastStore.js'

const toast = useToastStore()

const typeStyles = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  info: 'bg-primary-500',
}
</script>

<template>
  <div class="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
    <transition-group name="slide-up">
      <div
        v-for="t in toast.toasts"
        :key="t.id"
        :class="[typeStyles[t.type] || typeStyles.info]"
        class="px-4 py-2.5 rounded-lg text-white text-sm font-medium shadow-lg min-w-[200px]"
      >
        {{ t.message }}
      </div>
    </transition-group>
  </div>
</template>
