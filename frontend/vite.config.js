// Frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// docker compose inyecta las variables VITE_* desde el .env.
// Vite las expone solo en import.meta.env (no hace falta dotenv aca).

const allowedHosts = process.env.VITE_ALLOWED_HOSTS
  ? process.env.VITE_ALLOWED_HOSTS.split(',').map((h) => h.trim())
  : undefined

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: process.env.VITE_APP_HOST || '0.0.0.0',
    port: Number(process.env.VITE_APP_PORT) || 3004,
    // Vite >= 4.5 bloquea hosts que no sean localhost; en el servidor
    // hay que listar el subdominio (VITE_ALLOWED_HOSTS en el .env).
    allowedHosts,
  },
})
