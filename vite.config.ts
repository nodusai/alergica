import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const publishableKey = env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

  return {
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
        "/newsapi": {
          target: "https://newsapi.org",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/newsapi/, ""),
          onError: (_err: any, _req: any, res: any) => {
            res.writeHead(503, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "NewsAPI offline" }));
          },
        },
      },
    },
    define: {
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(publishableKey),
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
