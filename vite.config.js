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
        // target: 'https://livedashboard2026-d0d8gqd3deaqacf5.australiaeast-01.azurewebsites.net',
        target: 'https://ba-d5147e1ffcb94d448cd5604f98b1d081.ecs.ap-southeast-2.on.aws',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})