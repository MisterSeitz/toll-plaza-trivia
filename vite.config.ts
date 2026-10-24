import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import path from 'node:path'

const envDir = path.resolve(import.meta.dirname, '.gemini')

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Server-side only: secret keys are never exposed to the browser bundle.
  const env = loadEnv(mode, envDir, '')
  const clean = (v?: string) => (v ?? '').trim().replace(/,$/, '').trim()

  return {
    plugins: [react()],
    envDir,
    // Only these public vars are exposed to client code (SUPABASE_SECRET_KEY, GEMINI_API_KEY, FAL_API_KEY are NOT).
    envPrefix: ['VITE_', 'SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY'],
    server: {
      proxy: {
        '/api/gemini': {
          target: 'https://generativelanguage.googleapis.com',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/gemini/, ''),
          headers: { 'x-goog-api-key': clean(env.GEMINI_API_KEY) },
        },
        '/api/fal': {
          target: 'https://fal.run',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/fal/, ''),
          headers: { Authorization: `Key ${clean(env.FAL_API_KEY)}` },
        },
      },
    },
  }
})
