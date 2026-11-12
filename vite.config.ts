import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// https://vitejs.dev/config/
// Public backend values (safe to ship in the browser) used as a fallback when the
// build environment has no .env, so the published app never starts without them.
const FALLBACK_URL = "https://hxfzsqezrxsoecctemve.supabase.co";
const FALLBACK_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4ZnpzcWV6cnhzb2VjY3RlbXZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NzQ3NDQsImV4cCI6MjA4ODI1MDc0NH0.yzm0HOuAG1rjEWkRW5cJ-iG_xYlObF5IWBT3IrhbHCU";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const url = env.VITE_SUPABASE_URL || FALLBACK_URL;
  const key = env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || FALLBACK_KEY;
  return {
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(url),
    "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(key),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(key),
  },
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
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
};
});
