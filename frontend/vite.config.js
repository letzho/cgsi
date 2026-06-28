import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiPort = env.API_PORT || '3001'
  const frontendPort = Number(env.FRONTEND_PORT || 6174)

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: frontendPort,
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
          timeout: 120000,
          proxyTimeout: 120000,
        },
      },
    },
  }
})
