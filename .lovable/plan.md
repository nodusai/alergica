

## Plan: Create Database Tables, Insert Data, and Fix .gitignore

### 1. Database Tables to Create (Migration)

Based on the CSV exports, 9 tables need to be created:

**a) `profiles`**
- `id` uuid PK default gen_random_uuid()
- `user_id` uuid NOT NULL (references auth.users)
- `full_name` text
- `avatar_url` text
- `child_name` text
- `profile_type` text
- `created_at` timestamptz default now()
- `updated_at` timestamptz default now()
- UNIQUE on user_id

**b) `babies`**
- `id` uuid PK default gen_random_uuid()
- `user_id` uuid NOT NULL (references auth.users)
- `name` text NOT NULL
- `birth_date` date
- `created_at` timestamptz default now()
- `updated_at` timestamptz default now()

**c) `medications`**
- `id` uuid PK default gen_random_uuid()
- `nome_principal` text, `nome_alternativo` text, `nome_completo` text
- `composicao` text, `tem_risco_aplv` boolean default false
- `nivel_alerta` text, `termos_encontrados` jsonb default '[]'
- `avisos` jsonb default '[]', `detalhes_criticos` jsonb default '[]', `detalhes_atencao` jsonb default '[]'
- `arquivo_url` text, `data_extracao` timestamptz
- `access_count` integer default 0
- `created_at` / `updated_at` timestamptz

**d) `products`**
- `id` uuid PK, `nome_principal` text, `nome_completo` text, `nome_alternativo` text
- `composicao` text, `nivel_alerta` text, `tem_risco_aplv` boolean default false
- `avisos` jsonb default '[]', `access_count` integer default 0
- `created_at` / `updated_at` timestamptz

**e) `restaurants`**
- `id` uuid PK, `nome_principal` text, `nome_completo` text, `nome_alternativo` text
- `descricao` text, `nivel_alerta` text, `avisos` jsonb default '[]'
- `access_count` integer default 0, `endereco` text
- `created_at` / `updated_at` timestamptz

**f) `feedback`**
- `id` uuid PK, `user_id` uuid NOT NULL, `content` text NOT NULL
- `created_at` timestamptz default now()

**g) `suggestions`**
- `id` uuid PK, `user_id` uuid NOT NULL, `content` text NOT NULL
- `created_at` timestamptz default now()

**h) `solicitado_inclusao`**
- `id` uuid PK, `user_id` uuid NOT NULL
- `tipo` text, `nome` text, `composicao` text, `imagem_url` text
- `status` text default 'pendente'
- `created_at` timestamptz default now()

**i) `user_onboarding`**
- `id` uuid PK, `user_id` uuid NOT NULL (unique)
- `completed_at` timestamptz default now()

**j) `user_roles`** (per security guidelines)
- Create `app_role` enum ('admin', 'moderator', 'user')
- `id` uuid PK, `user_id` uuid NOT NULL, `role` app_role NOT NULL
- UNIQUE(user_id, role)
- `has_role()` security definer function

### 2. RLS Policies

- **profiles**: Users can CRUD their own row
- **babies**: Users can CRUD their own rows
- **medications, products, restaurants**: Authenticated users can SELECT; admins can INSERT/UPDATE/DELETE
- **feedback, suggestions**: Users can INSERT their own; admins can SELECT all
- **solicitado_inclusao**: Users can INSERT/SELECT their own; admins can SELECT/UPDATE all
- **user_onboarding**: Users can INSERT/SELECT their own
- **user_roles**: Admin-only via `has_role()` function

### 3. Data Import

After tables are created, insert the existing data:
- **3 rows** into `babies` (from CSV)
- **1 row** into `profiles` (from CSV)
- **~9,011 rows** into `medications` - will need an edge function to bulk import via CSV since the data is large

### 4. Fix .gitignore

Add `.env` to `.gitignore` to prevent sensitive variables from being committed.

### 5. Code Dependencies Found

The code already references these tables via Supabase client:
- `profiles` - used in Sidebar, ProfilePage, Dashboard
- `babies` - used in BabyManager
- `user_onboarding` - used in Dashboard
- `suggestions` - used in ChatWidget
- `feedback` - used in ChatWidget
- `medications` - referenced in Dashboard (currently mock data), MedicationDetails (mock data)

No code changes needed beyond .gitignore since the app already queries these table names. The types will auto-regenerate after migration.

### 6. Medications Data Strategy

The medications CSV has ~9,011 rows. This will be handled via:
1. Create an edge function that accepts CSV data and bulk-inserts into the medications table
2. Or split into multiple insert batches via the insert tool

### Summary of Deliverables

1. Single migration SQL creating all 9 tables + enum + has_role function + RLS policies
2. Insert existing data (babies, profiles rows; medications in batches)
3. Add `.env` to `.gitignore`
4. Feedback report on completion

