import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// https://vitejs.dev/config/
// Banco oficial do AlerGica (projeto yigfbx…). Valores PÚBLICOS (chave publishable),
// usados quando o build não tem .env (ex.: site publicado pelo Lovable).
const FALLBACK_URL = "https://yigfbxctogqohmnjjglo.supabase.co";
const FALLBACK_KEY = "sb_publishable_zcd7TPtbBpAwMe6bEIrH4A_FePbzITZ";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const url = env.VITE_SUPABASE_URL || FALLBACK_URL;
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || FALLBACK_KEY;
  // Tudo que vai para o navegador é público: chave secreta aqui daria acesso total ao banco
  if (/^sb_secret_|service_role/.test(key)) {
    throw new Error("Chave SECRETA do Supabase em variável VITE_: use a chave publishable (sb_publishable_…).");
  }
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
};
});
