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
    },
  },
  plugins: [react()],
  // tesseract.js é importado sob demanda (leitura de rótulos); pré-otimizar evita
  // o erro "Failed to fetch dynamically imported module" na primeira análise em dev
  optimizeDeps: {
    include: ["tesseract.js"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
