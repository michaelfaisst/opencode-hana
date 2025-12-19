import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const serverUrl = env.VITE_OPENCODE_SERVER_URL || "http://localhost:4096"

  return {
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
          target: serverUrl,
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
          target: serverUrl,
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
          target: serverUrl,
          changeOrigin: true,
          // Only proxy if NOT /sessions (frontend route)
          bypass: (req) => {
            if (req.url?.startsWith("/sessions")) {
              return req.url; // Don't proxy, let Vite handle it
            }
          },
        },
        "/config": {
          target: serverUrl,
          changeOrigin: true,
        },
        "/provider": {
          target: serverUrl,
          changeOrigin: true,
        },
        "/file": {
          target: serverUrl,
          changeOrigin: true,
        },
        "/find": {
          target: serverUrl,
          changeOrigin: true,
        },
      },
    },
  }
})
