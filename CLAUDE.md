# CLAUDE.md — Frontend Website Rules

## Always Do First
- **Invoke the `frontend-design` skill** before writing any frontend code, every session, no exceptions.

## Project Context

**AlerGica** — Brazilian Portuguese health app for parents of children with APLV (Alergia à Proteína do Leite de Vaca — Cow Milk Protein Allergy). Helps users identify safe medications and products by analyzing ingredients.

- All UI text MUST be in **Brazilian Portuguese**
- Risk levels: `safe` (sem leite) | `caution` (risco de traços) | `risk` (contém leite)
- Primary allergen: APLV. Future: gluten, soy, egg, nuts

**Frontend:** React 18 + TypeScript, Vite (port 8080), shadcn/ui, Tailwind CSS, React Router, TanStack React Query.
- Entry: `src/main.tsx` | Pages: `src/pages/` | Components: `src/components/`
- Supabase client: `src/integrations/supabase/client.ts`
- All data calls go through `src/services/` — never call APIs directly from components

**Backend (Python/FastAPI):** Located in `backend/`. Validates Supabase JWTs (`python-jose`).
- Run: `uvicorn app.main:app --reload` from `backend/`
- API docs: `http://localhost:8000/docs`

**Database (Supabase/PostgreSQL):**
- `profiles` — user profile data (full_name, child_name, phone, allergy_info, observation)
- `babies` — children per user
- `medications`, `ingredients`, `medication_ingredients` — core product catalog
- `suggestions`, `feedback` — user-submitted content
- `user_onboarding`, `user_roles` — auth/access control
- Migrations: `supabase/migrations/` — add a new SQL file per schema change

## Documentation (always keep in sync)
- System docs live in `docs/` (Brazilian Portuguese): `01-arquitetura.md`, `02-documentacao-tecnica.md`, `03-manual-do-usuario.md`, with PDFs in `docs/pdf/`.
- **Every change to the system must update the affected docs in the same commit** — new screens/flows/user-facing text → manual; tables/columns/functions/policies → técnica §6 + arquitetura §8; services/endpoints/integrations → técnica §7–8 + arquitetura §6–7; risk/alternatives rules → arquitetura §9 + técnica §7; fixed tech-debt item → arquitetura §13.
- Bump `versao`/`atualizado` in the front-matter and add a row to the doc's "Histórico de revisões".
- Then regenerate PDFs with `npm run docs:pdf` and commit `.md` + `.pdf` together.

## Backend Rules (Python/FastAPI)
- Use FastAPI with Pydantic v2 schemas
- Connect to Supabase PostgreSQL via `supabase-py`
- Validate Supabase JWT in middleware — do not create a separate auth system
- Routers in `backend/app/routers/` are thin (no business logic)
- Business logic in `backend/app/services/` only
- Env vars in `backend/.env` — never hardcode credentials

## Reference Images
- If a reference image is provided: match layout, spacing, typography, and color exactly. Swap in placeholder content (images via `https://placehold.co/`, generic copy). Do not improve or add to the design.
- If no reference image: design from scratch with high craft (see guardrails below).
- Screenshot your output, compare against reference, fix mismatches, re-screenshot. Do at least 2 comparison rounds. Stop only when no visible differences remain or user says so.

## Local Server
- **Always serve on localhost** — never screenshot a `file:///` URL.
- For screenshots: `npm run build && node serve.mjs` (serves built app at `http://localhost:3000`)
- For development: `npm run dev` (Vite dev server at `http://localhost:8080`)
- `serve.mjs` and `screenshot.mjs` both live in the project root.
- If the server is already running, do not start a second instance.

## Screenshot Workflow
- Puppeteer is installed at `C:/Users/srluk/AppData/Local/Temp/puppeteer-test/`. Chrome cache is at `C:/Users/srluk/.cache/puppeteer/`.
- **Always screenshot from localhost:** `node screenshot.mjs http://localhost:3000`
- Screenshots are saved automatically to `./temporary screenshots/screenshot-N.png` (auto-incremented, never overwritten).
- Optional label suffix: `node screenshot.mjs http://localhost:3000 label` → saves as `screenshot-N-label.png`
- `screenshot.mjs` lives in the project root. Use it as-is.
- After screenshotting, read the PNG from `temporary screenshots/` with the Read tool — Claude can see and analyze the image directly.
- When comparing, be specific: "heading is 32px but reference shows ~24px", "card gap is 16px but should be 24px"
- Check: spacing/padding, font size/weight/line-height, colors (exact hex), alignment, border-radius, shadows, image sizing

## Output Defaults
- Single `index.html` file, all styles inline, unless user says otherwise
- Tailwind CSS via CDN: `<script src="https://cdn.tailwindcss.com"></script>`
- Placeholder images: `https://placehold.co/WIDTHxHEIGHT`
- Mobile-first responsive

## Brand Assets
- Always check the `brand_assets/` folder before designing. It may contain logos, color guides, style guides, or images.
- If assets exist there, use them. Do not use placeholders where real assets are available.
- If a logo is present, use it. If a color palette is defined, use those exact values — do not invent brand colors.

## Anti-Generic Guardrails
- **Colors:** Never use default Tailwind palette (indigo-500, blue-600, etc.). Pick a custom brand color and derive from it.
- **Shadows:** Never use flat `shadow-md`. Use layered, color-tinted shadows with low opacity.
- **Typography:** Never use the same font for headings and body. Pair a display/serif with a clean sans. Apply tight tracking (`-0.03em`) on large headings, generous line-height (`1.7`) on body.
- **Gradients:** Layer multiple radial gradients. Add grain/texture via SVG noise filter for depth.
- **Animations:** Only animate `transform` and `opacity`. Never `transition-all`. Use spring-style easing.
- **Interactive states:** Every clickable element needs hover, focus-visible, and active states. No exceptions.
- **Images:** Add a gradient overlay (`bg-gradient-to-t from-black/60`) and a color treatment layer with `mix-blend-multiply`.
- **Spacing:** Use intentional, consistent spacing tokens — not random Tailwind steps.
- **Depth:** Surfaces should have a layering system (base → elevated → floating), not all sit at the same z-plane.

## Hard Rules
- Do not add sections, features, or content not in the reference
- Do not "improve" a reference design — match it
- Do not stop after one screenshot pass
- Do not use `transition-all`
- Do not use default Tailwind blue/indigo as primary color