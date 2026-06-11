import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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
    target: process.env.VITE_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/api\/supabase/, ''),
  },
}

export default defineConfig({
  plugins: [react()],
  server: { proxy: proxyConfig },
  preview: { proxy: proxyConfig, allowedHosts: true },
})
