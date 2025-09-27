import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [
    react({
      include: ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"],
    }),
  ],
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'https://live-dashboard-backend-production.up.railway.app',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})