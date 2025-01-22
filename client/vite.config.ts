import { defineConfig, loadEnv } from 'vite'
import solid from 'vite-plugin-solid'


export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [solid()],
    server: {
      host: true,
    },
    define: {
      'import.meta.env.VITE_BACKEND_URL': env.VITE_BACKEND_URL,
      'import.meta.env.VITE_ROOT_DOMAIN': env.VITE_ROOT_DOMAIN
    }
  }
})