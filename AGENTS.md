
- Backend connection values are injected via `define` in vite.config.ts with public fallbacks — the published build may lack .env, which crashed the app with "supabaseUrl is required".
