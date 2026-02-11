import { ref, reactive, shallowRef } from 'vue'
import { SITE_CONTEXT, getSiteContext } from '../siteContext.js'

// Config from environment variables (injected at build time via Vite)
// Different .env files are loaded based on environment: .env.development or .env.production
const ENV_CONFIG = {
  baseUrl: import.meta.env.VITE_LLM_BASE_URL || '/api/llm-proxy/v1',
  apiKey: import.meta.env.VITE_LLM_API_KEY || '',
  model: import.meta.env.VITE_LLM_MODEL || 'gpt-5.2',
}

// Singleton state shared across components
const agent = shallowRef(null)
const isRunning = ref(false)
const logs = reactive([])
const error = ref(null)

// Config is read-only from env, but model can be changed at runtime
const config = reactive({
  baseUrl: ENV_CONFIG.baseUrl,
  apiKey: ENV_CONFIG.apiKey,
  model: ENV_CONFIG.model,
})

// No localStorage - credentials stay in memory only
function saveConfig() {
  // Intentionally empty - don't persist sensitive data
}

function addLog(type, message) {
  logs.push({
    id: Date.now() + Math.random(),
    type,
    message,
    timestamp: new Date().toLocaleTimeString(),
  })
  // Keep last 200 logs
  if (logs.length > 200) logs.splice(0, logs.length - 200)
}

async function createAgent() {
  const { WebAgent } = await import('browserdd/browser')

  // Log the constructed URL for debugging
  const fullBaseUrl = config.baseUrl.startsWith('/') ? window.location.origin + config.baseUrl : config.baseUrl;
  console.log(`Creating agent with base URL: ${fullBaseUrl}`);
  
  // Browser DOM adapter (used in the demo UI) cannot take screenshots.
  // Only enable screenshots when running with a Playwright adapter (Node).
  const canScreenshot = typeof window === 'undefined';

  const instance = new WebAgent({
    llm: {
      provider: 'openai',
      model: config.model,
      apiKey: config.apiKey,
      baseUrl: fullBaseUrl,
      temperature: 0.1,
    },
    maxStepsPerSubtask: 12,
    maxSubtasksPerTask: 20,
    maxTotalSteps: 50,
    executionMode: 'upfront',
    screenshots: canScreenshot,
    debug: true,
    // Inject site-specific context (APPENDED to default prompts, not replacing)
    prompts: {
      // Use page-aware context when running in browser; fall back to static export otherwise
      siteContext: typeof window !== 'undefined' ? getSiteContext(window.location.pathname) : SITE_CONTEXT,
    },
  })

  // Bind events
  instance.on('task:start', ({ task }) => {
    addLog('info', `Task started: ${task}`)
  })

  instance.on('task:plan', ({ plan }) => {
    // Handle conversation mode - just respond, no tasks
    if (plan.mode === 'conversation') {
      addLog('response', plan.response || 'Tôi hiểu rồi.')
      return
    }

    // Task mode - show plan and execute
    if (plan.response) {
      addLog('response', plan.response)
    }
    if (plan.thinking) {
      addLog('thinking', plan.thinking)
    }
    addLog('plan', `Plan created: ${plan.subtasks.length} subtasks`)
    plan.subtasks.forEach((st, i) => {
      addLog('plan', `  ${i + 1}. ${st.description}`)
    })
  })

  instance.on('subtask:start', ({ subtask }) => {
    addLog('info', `Subtask: ${subtask.description}`)
  })

  instance.on('subtask:complete', ({ result }) => {
    const icon = result.success ? 'OK' : 'FAIL'
    addLog(result.success ? 'success' : 'error', `  [${icon}] Subtask done (${result.steps.length} steps)`)
  })

  instance.on('subtask:error', ({ error: err }) => {
    // Check if this is a user question (NEEDS_USER_CONFIRMATION or ask_user)
    if (err?.code === 'NEEDS_USER_CONFIRMATION' || err?.recoverable) {
      addLog('question', `🙋 ${err?.message || 'Bạn có muốn tôi thử cách khác không?'}`)
    } else {
      addLog('error', `  Subtask failed: ${err?.message || 'unknown'}`)
    }
  })

  instance.on('action:complete', ({ result }) => {
    const icon = result.success ? '+' : 'x'
    addLog(result.success ? 'action' : 'error', `    [${icon}] ${result.action}: ${result.verbalFeedback || ''}`)
  })

  instance.on('task:complete', ({ result }) => {
    addLog(result.success ? 'success' : 'error',
      `Task ${result.success ? 'completed' : 'failed'}: ${result.summary} (${result.totalSteps} steps, ${result.totalTokens} tokens, ${result.totalDuration}ms)`)
  })

  instance.on('task:error', ({ error: err }) => {
    addLog('error', `Task error: ${err?.message || 'unknown'}`)
  })

  instance.on('error:recovery', ({ strategy }) => {
    const strategyNames = {
      retry: '🔄 Thử lại với cách khác',
      alternative: '🔀 Dùng phương pháp thay thế',
      skip: '⏭️ Bỏ qua bước này',
      ask_user: '🙋 Hỏi người dùng',
      abort: '⛔ Dừng lại',
    }
    addLog('warn', `  ${strategyNames[strategy] || strategy}`)
  })

  agent.value = instance
  return instance
}

export function useWebAgent() {
  async function execute(task) {
    if (isRunning.value) return
    error.value = null
    isRunning.value = true
    saveConfig()

    try {
      // Recreate agent each time to pick up config changes
      const instance = await createAgent()
      addLog('info', '--- New Task ---')
      const result = await instance.execute(task)
      return result
    } catch (e) {
      error.value = e.message || 'Unknown error'
      addLog('error', `Error: ${e.message || e}`)
    } finally {
      isRunning.value = false
    }
  }

  async function inspectPage() {
    try {
      if (!agent.value) await createAgent()
      const { DOMDistillationMode } = await import('browserdd/browser')
      const context = await agent.value.getContext(DOMDistillationMode?.ALL_FIELDS ?? 2)
      addLog('info', `Page inspection: ${context.elements?.length || 0} interactive elements, ~${context.tokenCount || 0} tokens`)
      return context
    } catch (e) {
      addLog('error', `Inspect error: ${e.message || e}`)
    }
  }

  function clearLogs() {
    logs.splice(0, logs.length)
  }

  function stop() {
    if (agent.value) {
      agent.value.stop()
      addLog('warn', 'Stop requested')
    }
  }

  return {
    agent,
    isRunning,
    logs,
    error,
    config,
    execute,
    inspectPage,
    clearLogs,
    stop,
  }
}
