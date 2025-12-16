import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    headers: {
      "Cache-Control": "no-store",
    },
    proxy: {
      // Proxy SSE events to the OpenCode server
      "/event": {
        target: "http://localhost:4096",
        changeOrigin: true,
      },
      // Proxy API calls to the OpenCode server
      // Use /api prefix to avoid conflicts with frontend routes
      "/session": {
        target: "http://localhost:4096",
        changeOrigin: true,
        // Only proxy if NOT /sessions (frontend route)
        bypass: (req) => {
          if (req.url?.startsWith("/sessions")) {
            return req.url; // Don't proxy, let Vite handle it
          }
        },
      },
      "/config": {
        target: "http://localhost:4096",
        changeOrigin: true,
      },
      "/provider": {
        target: "http://localhost:4096",
        changeOrigin: true,
      },
      "/file": {
        target: "http://localhost:4096",
        changeOrigin: true,
      },
    },
  },
})
