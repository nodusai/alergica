import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
        onError: (_err: any, _req: any, res: any) => {
          res.writeHead(503, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Backend offline" }));
        },
      },
      // Proxy direto para NewsAPI — usado como fallback quando o backend Python está offline
      "/newsapi": {
        target: "https://newsapi.org",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/newsapi/, ""),
        onError: (_err, _req, res) => {
          res.writeHead(503, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "NewsAPI offline" }));
        },
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
