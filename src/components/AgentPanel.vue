<script setup>
import { ref, nextTick, watch, computed } from 'vue'
import { useWebAgent } from '../composables/useWebAgent.js'

const { isRunning, logs, error, config, execute, inspectPage, clearLogs, stop } = useWebAgent()

const open = ref(false)
const showSettings = ref(false)
const taskInput = ref('')
const messagesContainer = ref(null)

// Convert logs to chat messages
const messages = computed(() => {
  const result = []
  let currentTask = null
  let currentSteps = []

  for (const log of logs) {
    if (log.message.includes('--- New Task ---')) {
      // Save previous task if exists
      if (currentTask) {
        result.push(currentTask)
      }
      currentTask = null
      currentSteps = []
    } else if (log.message.startsWith('Task started:')) {
      const task = log.message.replace('Task started: ', '')
      // Add user message
      result.push({
        id: log.id + '_user',
        type: 'user',
        content: task,
        timestamp: log.timestamp
      })
      // Start assistant message
      currentTask = {
        id: log.id + '_assistant',
        type: 'assistant',
        status: 'thinking',
        thinking: 'Đang phân tích yêu cầu của bạn...',
        response: null,  // Planner's friendly response
        plan: null,
        steps: [],
        result: null,
        timestamp: log.timestamp
      }
    } else if (log.type === 'response') {
      // Planner's response message - can be standalone for conversation mode
      if (currentTask) {
        currentTask.response = log.message
        currentTask.thinking = null
        currentTask.status = 'responding'
      } else {
        // Standalone response (rare case)
        result.push({
          id: log.id + '_response',
          type: 'assistant',
          status: 'done',
          response: log.message,
          result: { success: true, message: '' },
          timestamp: log.timestamp
        })
      }
    } else if (log.type === 'thinking') {
      // Planner's internal reasoning
      if (currentTask) {
        currentTask.thinkingDetail = log.message
      }
    } else if (log.message.startsWith('Plan created:')) {
      if (currentTask) {
        currentTask.status = 'planning'
        currentTask.thinking = null
      }
    } else if (log.message.match(/^\s*\d+\./)) {
      // Plan step
      if (currentTask && !currentTask.plan) {
        currentTask.plan = []
      }
      if (currentTask) {
        currentTask.plan.push(log.message.trim())
      }
    } else if (log.message.startsWith('Subtask:')) {
      if (currentTask) {
        currentTask.status = 'working'
        const step = log.message.replace('Subtask: ', '')
        currentSteps.push({ name: step, status: 'running' })
        currentTask.steps = [...currentSteps]
      }
    } else if (log.message.includes('[OK] Subtask done')) {
      if (currentSteps.length > 0) {
        currentSteps[currentSteps.length - 1].status = 'done'
        if (currentTask) currentTask.steps = [...currentSteps]
      }
    } else if (log.message.includes('Subtask failed') || log.type === 'error') {
      if (currentSteps.length > 0) {
        currentSteps[currentSteps.length - 1].status = 'error'
        if (currentTask) currentTask.steps = [...currentSteps]
      }
    } else if (log.message.startsWith('Task completed:') || log.message.startsWith('Task failed:')) {
      if (currentTask) {
        const success = log.message.startsWith('Task completed:')
        currentTask.status = 'done'
        currentTask.result = {
          success,
          message: success
            ? 'Còn gì cần tôi giúp không?'
            : 'Có vấn đề xảy ra. Bạn muốn tôi thử lại không?'
        }
        result.push(currentTask)
        currentTask = null
      }
    }
  }

  // Add current task if still running
  if (currentTask) {
    result.push(currentTask)
  }

  return result
})

// Auto-scroll
watch(
  () => messages.value.length,
  async () => {
    await nextTick()
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  }
)

async function handleSend() {
  const task = taskInput.value.trim()
  if (!task || isRunning.value) return
  taskInput.value = ''
  await execute(task)
}

function handleKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}
</script>

<template>
  <!-- Toggle button -->
  <button
    @click="open = !open"
    class="fixed bottom-5 right-5 z-[100] w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 group"
    :class="isRunning ? 'bg-gradient-to-r from-violet-500 to-purple-600 animate-pulse' : 'bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600'"
  >
    <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
  </button>

  <!-- Chat Panel -->
  <transition name="slide-up">
    <div
      v-if="open"
      class="fixed bottom-24 right-5 z-[100] w-[420px] max-h-[75vh] bg-white rounded-2xl shadow-2xl border border-gray-200/50 flex flex-col overflow-hidden"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-violet-600 to-purple-700">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
            </svg>
          </div>
          <div>
            <h3 class="font-semibold text-white">AI Assistant</h3>
            <p class="text-xs text-white/70">
              {{ isRunning ? 'Đang làm việc...' : 'Sẵn sàng giúp bạn' }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-1">
          <button
            @click="showSettings = !showSettings"
            class="p-2 rounded-lg hover:bg-white/10 text-white/80 transition-colors"
            title="Cài đặt"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </button>
          <button
            @click="clearLogs"
            class="p-2 rounded-lg hover:bg-white/10 text-white/80 transition-colors"
            title="Xóa lịch sử"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
          <button
            @click="open = false"
            class="p-2 rounded-lg hover:bg-white/10 text-white/80 transition-colors"
            title="Đóng"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Settings -->
      <transition name="fade">
        <div v-if="showSettings" class="px-5 py-4 bg-gray-50 border-b border-gray-100 space-y-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1.5">Base URL</label>
            <input
              v-model="config.baseUrl"
              type="text"
              class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
              placeholder="/llm-proxy/v1"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1.5">API Key</label>
            <input
              v-model="config.apiKey"
              type="password"
              class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
              placeholder="sk-..."
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1.5">Model</label>
            <input
              v-model="config.model"
              type="text"
              class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
              placeholder="gpt-4"
            />
          </div>
        </div>
      </transition>

      <!-- Messages -->
      <div
        ref="messagesContainer"
        class="flex-1 overflow-y-auto px-5 py-4 min-h-[300px] max-h-[400px] space-y-4 bg-gray-50/50"
      >
        <!-- Welcome message -->
        <div v-if="messages.length === 0" class="text-center py-8">
          <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
            <svg class="w-8 h-8 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
            </svg>
          </div>
          <h4 class="font-medium text-gray-800 mb-1">Xin chào! Tôi có thể giúp gì?</h4>
          <p class="text-sm text-gray-500">Hãy cho tôi biết bạn muốn làm gì trên trang này.</p>
          <div class="mt-4 flex flex-wrap gap-2 justify-center">
            <button
              @click="taskInput = 'Viết một bài post mới'"
              class="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-full hover:bg-gray-50 text-gray-600"
            >
              📝 Viết bài post
            </button>
            <button
              @click="taskInput = 'Gửi tin nhắn cho Emma'"
              class="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-full hover:bg-gray-50 text-gray-600"
            >
              💬 Nhắn tin
            </button>
          </div>
        </div>

        <!-- Chat messages -->
        <template v-for="msg in messages" :key="msg.id">
          <!-- User message -->
          <div v-if="msg.type === 'user'" class="flex justify-end">
            <div class="max-w-[80%] px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-2xl rounded-tr-md shadow-sm">
              <p class="text-sm">{{ msg.content }}</p>
            </div>
          </div>

          <!-- Assistant message -->
          <div v-else class="flex justify-start">
            <div class="max-w-[85%] space-y-2">
              <!-- Avatar -->
              <div class="flex items-start gap-2">
                <div class="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                  </svg>
                </div>

                <div class="flex-1 space-y-2">
                  <!-- Thinking state -->
                  <div v-if="msg.thinking" class="px-4 py-3 bg-white rounded-2xl rounded-tl-md shadow-sm border border-gray-100">
                    <div class="flex items-center gap-2 text-gray-500 text-sm">
                      <div class="flex gap-1">
                        <span class="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
                        <span class="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
                        <span class="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
                      </div>
                      <span>{{ msg.thinking }}</span>
                    </div>
                  </div>

                  <!-- Planner's response message (friendly chat) -->
                  <div v-if="msg.response" class="px-4 py-3 bg-white rounded-2xl rounded-tl-md shadow-sm border border-gray-100">
                    <p class="text-sm text-gray-800">{{ msg.response }}</p>
                  </div>

                  <!-- Plan (only show if there are subtasks to execute) -->
                  <div v-if="msg.plan && msg.plan.length > 0" class="px-4 py-3 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <p class="text-xs text-gray-500 mb-2 font-medium">Các bước thực hiện:</p>
                    <div class="space-y-1.5">
                      <div
                        v-for="(step, idx) in msg.plan"
                        :key="idx"
                        class="flex items-start gap-2 text-sm"
                      >
                        <span class="w-5 h-5 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                          {{ idx + 1 }}
                        </span>
                        <span class="text-gray-600">{{ step.replace(/^\d+\.\s*/, '') }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Progress -->
                  <div v-if="msg.steps && msg.steps.length > 0" class="px-4 py-3 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <div class="space-y-2">
                      <div
                        v-for="(step, idx) in msg.steps"
                        :key="idx"
                        class="flex items-center gap-2 text-sm"
                      >
                        <span v-if="step.status === 'done'" class="text-green-500">✓</span>
                        <span v-else-if="step.status === 'error'" class="text-red-500">✗</span>
                        <span v-else class="w-3 h-3 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></span>
                        <span :class="step.status === 'running' ? 'text-gray-800' : 'text-gray-500'">
                          {{ step.name }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Result -->
                  <div v-if="msg.result" class="px-4 py-3 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <div class="flex items-start gap-2">
                      <span v-if="msg.result.success" class="text-lg">✨</span>
                      <span v-else class="text-lg">😅</span>
                      <p class="text-sm text-gray-700">{{ msg.result.message }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Input -->
      <div class="px-4 py-4 border-t border-gray-100 bg-white">
        <div class="flex gap-3 items-end">
          <div class="flex-1 relative">
            <textarea
              v-model="taskInput"
              @keydown="handleKeydown"
              :disabled="isRunning"
              rows="1"
              class="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 disabled:opacity-50 pr-12"
              :class="{ 'bg-gray-50': isRunning }"
              placeholder="Nhập yêu cầu của bạn..."
              style="min-height: 46px; max-height: 120px;"
            ></textarea>
          </div>
          <button
            v-if="!isRunning"
            @click="handleSend"
            :disabled="!taskInput.trim()"
            class="w-11 h-11 flex items-center justify-center bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
          </button>
          <button
            v-else
            @click="stop"
            class="w-11 h-11 flex items-center justify-center bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all shadow-sm"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z" />
            </svg>
          </button>
        </div>
        <p v-if="error" class="mt-2 text-xs text-red-500 px-1">{{ error }}</p>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

textarea {
  field-sizing: content;
}
</style>
