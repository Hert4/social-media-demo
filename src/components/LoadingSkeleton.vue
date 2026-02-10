<script setup>
defineProps({
  lines: { type: Number, default: 3 },
})
</script>

<template>
  <div class="animate-pulse space-y-4">
    <div v-for="i in lines" :key="i" class="bg-white rounded-xl p-5 space-y-3">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-gray-200 rounded-full" />
        <div class="space-y-1.5 flex-1">
          <div class="h-3.5 bg-gray-200 rounded w-28" />
          <div class="h-3 bg-gray-100 rounded w-16" />
        </div>
      </div>
      <div class="space-y-2">
        <div class="h-3.5 bg-gray-200 rounded w-full" />
        <div class="h-3.5 bg-gray-200 rounded w-3/4" />
      </div>
    </div>
  </div>
</template>
