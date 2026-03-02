import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import path from "path"

const apiTarget = process.env.VITE_API_TARGET || "http://localhost:3001"
const wsTarget = process.env.VITE_API_TARGET?.replace(/^http/, "ws") || "ws://localhost:3001"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: apiTarget,
        changeOrigin: true,
      },
      "/ws": {
        target: wsTarget,
        ws: true,
      },
      "/graphql": {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
})
