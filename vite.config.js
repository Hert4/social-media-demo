import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Get the target URL from environment variable, fallback to default
const targetUrl = process.env.LLM_BASE_URL || 'http://test-k8s.misa.local/llm-gateway';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    proxy: {
      '/llm-proxy': {
        target: targetUrl,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/llm-proxy/, ''),
      },
    },
  },
  optimizeDeps: {
    include: ['openai', 'eventemitter3'],
  },
})
