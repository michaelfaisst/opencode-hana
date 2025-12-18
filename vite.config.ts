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
      // Proxy global SSE events to the OpenCode server (receives events from all directories)
      "/global/event": {
        target: "http://localhost:4096",
        changeOrigin: true,
        // SSE requires these headers to prevent buffering
        configure: (proxy) => {
          proxy.on("proxyRes", (proxyRes) => {
            // Ensure SSE responses are not buffered
            proxyRes.headers["cache-control"] = "no-cache";
            proxyRes.headers["x-accel-buffering"] = "no";
          });
        },
      },
      // Proxy SSE events to the OpenCode server (per-directory)
      "/event": {
        target: "http://localhost:4096",
        changeOrigin: true,
        // SSE requires these headers to prevent buffering
        configure: (proxy) => {
          proxy.on("proxyRes", (proxyRes) => {
            // Ensure SSE responses are not buffered
            proxyRes.headers["cache-control"] = "no-cache";
            proxyRes.headers["x-accel-buffering"] = "no";
          });
        },
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
      "/find": {
        target: "http://localhost:4096",
        changeOrigin: true,
      },
    },
  },
})
