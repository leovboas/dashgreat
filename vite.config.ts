import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const proxyConfig = {
    '/api/greatpages': {
      target: 'https://api.greatpages.com.br',
      changeOrigin: true,
      rewrite: (path: string) => path.replace(/^\/api\/greatpages/, '/v1'),
      headers: { Origin: 'https://api.greatpages.com.br' },
    },
    '/api/windsor': {
      target: 'https://connectors.windsor.ai',
      changeOrigin: true,
      rewrite: (path: string) => path.replace(/^\/api\/windsor/, ''),
    },
    '/api/supabase': {
      target: env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
      changeOrigin: true,
      rewrite: (path: string) => path.replace(/^\/api\/supabase/, ''),
    },
  }

  return {
    plugins: [react()],
    server: { proxy: proxyConfig },
    preview: { proxy: proxyConfig, allowedHosts: true },
  }
})
