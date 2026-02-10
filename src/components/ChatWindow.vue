<script setup>
import { ref, nextTick, watch } from 'vue'
import { useChatStore } from '../stores/chatStore.js'
import { timeAgo } from '../utils/timeAgo.js'

const chatStore = useChatStore()
const messageInput = ref('')
const messagesContainer = ref(null)

function send() {
  if (!messageInput.value.trim()) return
  chatStore.sendMessage(messageInput.value)
  messageInput.value = ''
  scrollToBottom()
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// Auto-scroll when new messages arrive
watch(
  () => chatStore.activeMessages.length,
  () => scrollToBottom()
)
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-7rem)] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    <!-- Chat header -->
    <div class="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
      <img
        v-if="chatStore.activeContact"
        :src="chatStore.activeContact.avatar"
        :alt="chatStore.activeContact.name"
        class="w-9 h-9 rounded-full bg-gray-200"
      />
      <div v-if="chatStore.activeContact">
        <p class="text-sm font-semibold text-gray-900">{{ chatStore.activeContact.name }}</p>
        <p class="text-xs text-gray-400">
          <span
            class="inline-block w-2 h-2 rounded-full mr-1"
            :class="chatStore.activeContact.status === 'online' ? 'bg-green-400' : 'bg-yellow-400'"
          />
          {{ chatStore.activeContact.status }}
        </p>
      </div>
    </div>

    <!-- Messages -->
    <div ref="messagesContainer" class="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      <!-- Empty state -->
      <div v-if="chatStore.activeMessages.length === 0" class="flex flex-col items-center justify-center h-full text-gray-400">
        <svg class="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p class="text-sm">No messages yet. Say hello!</p>
      </div>

      <!-- Message bubbles -->
      <div
        v-for="msg in chatStore.activeMessages"
        :key="msg.id"
        class="flex"
        :class="msg.sender === 'me' ? 'justify-end' : 'justify-start'"
      >
        <div
          class="max-w-[75%] px-3.5 py-2 rounded-2xl text-sm"
          :class="
            msg.sender === 'me'
              ? 'bg-primary-600 text-white rounded-br-md'
              : 'bg-gray-100 text-gray-800 rounded-bl-md'
          "
        >
          <p>{{ msg.text }}</p>
          <p
            class="text-[10px] mt-1 opacity-60"
            :class="msg.sender === 'me' ? 'text-right' : 'text-left'"
          >
            {{ timeAgo(msg.timestamp) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Input -->
    <div class="border-t border-gray-100 px-4 py-3">
      <form @submit.prevent="send" class="flex gap-2">
        <input
          v-model="messageInput"
          type="text"
          placeholder="Type a message..."
          class="flex-1 text-sm border border-gray-200 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-transparent"
        />
        <button
          type="submit"
          :disabled="!messageInput.trim()"
          class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-full hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  </div>
</template>
