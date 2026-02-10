<script setup>
import { useChatStore } from '../stores/chatStore.js'
import ChatWindow from '../components/ChatWindow.vue'

const chatStore = useChatStore()
</script>

<template>
  <div class="flex flex-col sm:flex-row gap-4 h-[calc(100vh-7rem)]">
    <!-- Contact sidebar (desktop) -->
    <div class="w-64 flex-shrink-0 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hidden sm:flex flex-col">
      <div class="px-4 py-3 border-b border-gray-100">
        <h2 class="text-sm font-semibold text-gray-700">Messages</h2>
      </div>
      <div class="flex-1 overflow-y-auto">
        <button
          v-for="contact in chatStore.contacts"
          :key="contact.id"
          @click="chatStore.selectContact(contact.id)"
          class="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
          :class="
            chatStore.activeContactId === contact.id
              ? 'bg-primary-50 border-r-2 border-primary-500'
              : 'hover:bg-gray-50'
          "
        >
          <div class="relative">
            <img :src="contact.avatar" :alt="contact.name" class="w-10 h-10 rounded-full bg-gray-200" />
            <span
              class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white"
              :class="contact.status === 'online' ? 'bg-green-400' : 'bg-yellow-400'"
            />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">{{ contact.name }}</p>
            <p class="text-xs text-gray-400 truncate">
              {{ (chatStore.chats[contact.id] || []).slice(-1)[0]?.text || 'No messages yet' }}
            </p>
          </div>
        </button>
      </div>
    </div>

    <!-- Mobile contact selector -->
    <div class="sm:hidden mb-3 w-full">
      <select
        :value="chatStore.activeContactId"
        @change="chatStore.selectContact($event.target.value)"
        class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
      >
        <option v-for="c in chatStore.contacts" :key="c.id" :value="c.id">
          {{ c.name }}
        </option>
      </select>
    </div>

    <!-- Chat area -->
    <div class="flex-1 min-w-0">
      <ChatWindow />
    </div>
  </div>
</template>
