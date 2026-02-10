import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

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
        target: 'https://defend-diagnostic-remained-ladies.trycloudflare.com',
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
