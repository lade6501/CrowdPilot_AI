import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      'process.env.BASE_URL': JSON.stringify(env.BASE_URL || 'https://crowdpilot-ai-1hps.onrender.com')
    }
  };
})
