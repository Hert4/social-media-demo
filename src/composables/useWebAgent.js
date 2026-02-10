import { ref, reactive, shallowRef } from 'vue'

// Config from environment variables (injected at build time via Vite)
// Copy .env.example -> .env and fill VITE_LLM_* values.
const ENV_CONFIG = {
  // In production on Vercel, we must hit the Serverless Function under `/api/*`.
  // Vite's `server.proxy` only works in `vite dev`.
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

  const instance = new WebAgent({
    llm: {
      provider: 'openai',
      model: config.model,
      apiKey: config.apiKey,
      baseUrl: config.baseUrl.startsWith('/') ? window.location.origin + config.baseUrl : config.baseUrl,
      temperature: 0.7,
    },
    maxStepsPerSubtask: 10,
    maxSubtasksPerTask: 15,
    maxTotalSteps: 50,
    debug: true,
  })

  // Bind events
  instance.on('task:start', ({ task }) => {
    addLog('info', `Task started: ${task}`)
  })

  instance.on('task:plan', ({ plan }) => {
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

  instance.on('subtask:error', ({ subtask, error: err }) => {
    addLog('error', `  Subtask failed: ${err?.message || 'unknown'}`)
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
    addLog('warn', `  Recovery strategy: ${strategy}`)
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
