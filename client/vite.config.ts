import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'

export default defineConfig({
  plugins: [solid()],
  server: {
    host: true,
  },
  // Add env variables with types
  define: {
    'import.meta.env.VITE_BACKEND_URL': JSON.stringify(process.env.VITE_BACKEND_URL),
    'import.meta.env.VITE_ROOT_DOMAIN': JSON.stringify(process.env.VITE_ROOT_DOMAIN),
  }
})