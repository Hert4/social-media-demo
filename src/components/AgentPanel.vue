<script setup>
import { ref, nextTick, watch } from 'vue'
import { useWebAgent } from '../composables/useWebAgent.js'

const { isRunning, logs, error, config, execute, inspectPage, clearLogs, stop } = useWebAgent()

const open = ref(false)
const showSettings = ref(false)
const taskInput = ref('')
const logsContainer = ref(null)

// Auto-scroll logs
watch(
  () => logs.length,
  async () => {
    await nextTick()
    if (logsContainer.value) {
      logsContainer.value.scrollTop = logsContainer.value.scrollHeight
    }
  }
)

async function handleExecute() {
  const task = taskInput.value.trim()
  if (!task || isRunning.value) return
  taskInput.value = ''
  await execute(task)
}

function handleKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleExecute()
  }
}

function logColor(type) {
  const colors = {
    info: 'text-gray-600',
    plan: 'text-blue-600',
    success: 'text-green-600',
    error: 'text-red-500',
    warn: 'text-yellow-600',
    action: 'text-indigo-500',
  }
  return colors[type] || 'text-gray-500'
}
</script>

<template>
  <!-- Toggle button -->
  <button
    @click="open = !open"
    class="fixed bottom-5 right-5 z-[100] w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-200"
    :class="isRunning ? 'bg-yellow-500 hover:bg-yellow-600 animate-pulse' : 'bg-primary-600 hover:bg-primary-700'"
    title="AI Agent Panel"
  >
    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
      <path stroke-linecap="round" stroke-linejoin="round"
        d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
    </svg>
  </button>

  <!-- Panel -->
  <transition name="fade">
    <div
      v-if="open"
      class="fixed bottom-20 right-5 z-[100] w-96 max-h-[70vh] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div class="flex items-center gap-2">
          <div
            class="w-2.5 h-2.5 rounded-full"
            :class="isRunning ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'"
          ></div>
          <span class="font-semibold text-sm text-gray-700">AI Agent</span>
        </div>
        <div class="flex items-center gap-1">
          <button
            @click="showSettings = !showSettings"
            class="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"
            title="Settings"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </button>
          <button
            @click="clearLogs"
            class="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"
            title="Clear logs"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
          <button
            @click="open = false"
            class="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"
            title="Close"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Settings -->
      <transition name="fade">
        <div v-if="showSettings" class="px-4 py-3 bg-gray-50 border-b border-gray-200 space-y-2">
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Base URL</label>
            <input
              v-model="config.baseUrl"
              type="text"
              class="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              placeholder="/llm-proxy/v1"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">API Key</label>
            <input
              v-model="config.apiKey"
              type="password"
              class="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              placeholder="sk-..."
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Model</label>
            <input
              v-model="config.model"
              type="text"
              class="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              placeholder="claude-opus-4-5"
            />
          </div>
          <button
            @click="inspectPage"
            class="w-full text-xs py-1.5 px-3 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 transition-colors"
          >
            Inspect Page Elements
          </button>
        </div>
      </transition>

      <!-- Logs -->
      <div
        ref="logsContainer"
        class="flex-1 overflow-y-auto px-4 py-2 min-h-[200px] max-h-[350px] font-mono text-xs space-y-0.5 bg-gray-900"
      >
        <div v-if="logs.length === 0" class="text-gray-500 text-center py-8">
          No logs yet. Enter a task below to start.
        </div>
        <div
          v-for="log in logs"
          :key="log.id"
          class="leading-relaxed"
          :class="logColor(log.type)"
        >
          <span class="text-gray-600 select-none">{{ log.timestamp }}</span>
          {{ log.message }}
        </div>
      </div>

      <!-- Input -->
      <div class="px-3 py-3 border-t border-gray-200 bg-white">
        <div class="flex gap-2">
          <textarea
            v-model="taskInput"
            @keydown="handleKeydown"
            :disabled="isRunning"
            rows="2"
            class="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
            placeholder="e.g. Write a post saying Hello World"
          ></textarea>
          <div class="flex flex-col gap-1">
            <button
              v-if="!isRunning"
              @click="handleExecute"
              :disabled="!taskInput.trim()"
              class="px-3 py-2 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Run
            </button>
            <button
              v-else
              @click="stop"
              class="px-3 py-2 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors"
            >
              Stop
            </button>
          </div>
        </div>
        <p v-if="error" class="mt-1 text-xs text-red-500">{{ error }}</p>
      </div>
    </div>
  </transition>
</template>
