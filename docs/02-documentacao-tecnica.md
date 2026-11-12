---
titulo: Documentação Técnica do Sistema
subtitulo: Referência para desenvolvimento, implantação e manutenção do AlerGica — ambiente, configuração, dicionário de dados, APIs, serviços e componentes.
categoria: Documentação Técnica
versao: 1.1.0
atualizado: 12 de novembro de 2026
publico: Desenvolvedores e equipe de operação
classificacao: Confidencial
---

# Documentação Técnica do Sistema

## 1. Sobre este documento

Este documento é a referência técnica do AlerGica: como montar o ambiente, configurar, executar, implantar e evoluir o sistema. Ele complementa o **Documento de Arquitetura** (visão estrutural e decisões) e o **Manual do Usuário** (uso do produto).

| Documento | Arquivo-fonte | PDF |
|---|---|---|
| Arquitetura do Sistema | `docs/01-arquitetura.md` | `docs/pdf/01-arquitetura.pdf` |
| Documentação Técnica (este) | `docs/02-documentacao-tecnica.md` | `docs/pdf/02-documentacao-tecnica.pdf` |
| Manual do Usuário | `docs/03-manual-do-usuario.md` | `docs/pdf/03-manual-do-usuario.pdf` |

## 2. Pilha tecnológica

### 2.1 Frontend

| Biblioteca | Versão | Uso |
|---|---|---|
| React | 18.3 | Interface |
| TypeScript | 5.8 | Tipagem estática |
| Vite (+ plugin SWC) | 5.4 | Servidor de desenvolvimento e build |
| React Router DOM | 6.30 | Rotas da SPA |
| TanStack React Query | 5.83 | Cache de dados (provedor configurado na raiz) |
| Tailwind CSS | 3.4 | Estilos utilitários e tokens de tema |
| shadcn/ui + Radix UI | — | Componentes acessíveis (diálogos, drawer, carrossel, toasts…) |
| Framer Motion | 12 | Animações do menu inferior |
| Zod | 3.25 | Validação de formulários |
| lucide-react | 0.462 | Ícones |
| next-themes | 0.3 | Alternância tema claro/escuro |
| embla-carousel | 8.6 | Carrossel de conteúdo educativo |
| @supabase/supabase-js | 2.91 | Cliente de autenticação e dados |
| Vitest + Testing Library | 3.2 / 16 | Testes |

### 2.2 Backend e infraestrutura

| Componente | Tecnologia |
|---|---|
| Banco de dados | PostgreSQL (Supabase) |
| Autenticação | Supabase Auth |
| API REST | PostgREST (Supabase) |
| Funções serverless | Supabase Edge Functions (Deno) |
| API própria | Python 3 · FastAPI · Uvicorn · httpx · supabase-py · python-dotenv · python-jose |
| Automação de IA | n8n (webhook) |
| Hospedagem do frontend | Vercel |

## 3. Estrutura do repositório

```
alergica/
├── backend/                  API FastAPI (Python)
│   ├── app/
│   │   ├── main.py           Aplicação, CORS e registro de routers
│   │   ├── db.py             Cliente Supabase autenticado com o JWT do usuário
│   │   └── routers/          medications.py · news.py
│   └── requirements.txt
├── docs/                     Esta documentação (Markdown + PDFs)
│   ├── assets/doc.css        Estilo dos PDFs
│   └── pdf/                  PDFs gerados
├── public/                   Arquivos estáticos (favicon, mascote, robots.txt)
├── scripts/
│   └── build-docs.mjs        Gera os PDFs da documentação
├── src/
│   ├── assets/               Imagens (mascote)
│   ├── components/           Componentes de tela
│   │   └── ui/               Componentes base shadcn/ui
│   ├── contexts/             AuthContext
│   ├── hooks/                use-mobile, use-toast
│   ├── integrations/supabase Cliente e tipos gerados do banco
│   ├── lib/utils.ts          Utilitário cn() para classes
│   ├── pages/                Telas (uma por rota)
│   ├── services/             Acesso a dados e regras de negócio
│   ├── test/                 Configuração e testes Vitest
│   ├── App.tsx               Provedores e rotas
│   ├── index.css             Tokens de design (claro/escuro) e classes utilitárias
│   └── main.tsx              Ponto de entrada
├── supabase/
│   ├── config.toml           Identificação do projeto Supabase
│   ├── functions/            Edge Functions (Deno)
│   └── migrations/           Migrações SQL versionadas
├── serve.mjs                 Servidor estático local (porta 3000)
├── screenshot.mjs            Captura de tela com Puppeteer
├── vercel.json               Reescrita de rotas da SPA
└── vite.config.ts            Porta 8080, alias @ e proxy /api
```

## 4. Ambiente de desenvolvimento

### 4.1 Pré-requisitos

- Node.js 18 ou superior e npm
- Python 3.11+ (somente para a API FastAPI)
- Supabase CLI (para aplicar migrações e publicar Edge Functions)
- Google Chrome ou Microsoft Edge (para gerar os PDFs da documentação)

### 4.2 Instalação

```bash
git clone <URL_DO_REPOSITORIO> alergica
cd alergica
npm install
cp .env.example .env      # crie o arquivo com as variáveis da seção 5
npm run dev               # http://localhost:8080
```

API FastAPI (opcional):

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows  (Linux/macOS: source .venv/bin/activate)
pip install -r requirements.txt
uvicorn app.main:app --reload    # http://localhost:8000  ·  documentação em /docs
```

### 4.3 Scripts npm

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento Vite em `http://localhost:8080` com recarga automática |
| `npm run build` | Build de produção em `dist/` |
| `npm run build:dev` | Build em modo desenvolvimento |
| `npm run preview` | Serve o build de produção pelo Vite |
| `npm run lint` | ESLint em todo o projeto |
| `npm run test` | Executa os testes uma vez (Vitest) |
| `npm run test:watch` | Testes em modo observação |
| `npm run docs:pdf` | Gera os PDFs da documentação em `docs/pdf/` |
| `node serve.mjs` | Serve `dist/` em `http://localhost:3000` (usado para capturas de tela) |

## 5. Configuração

### 5.1 Variáveis do frontend (`.env` na raiz)

| Variável | Obrigatória | Descrição |
|---|---|---|
| `VITE_SUPABASE_URL` | Sim | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Sim | Chave pública (*anon*) do Supabase |
| `VITE_N8N_WEBHOOK_URL` | Sim, para IA | Webhook do n8n usado no onboarding e no scanner de produtos |

> **Atenção:** variáveis com prefixo `VITE_` são embutidas no JavaScript entregue ao navegador. Nunca coloque nelas chaves secretas (como a *service role key*).

### 5.2 Variáveis da API FastAPI (`backend/.env`)

| Variável | Descrição |
|---|---|
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_ANON_KEY` | Chave pública; as consultas usam o JWT do usuário, então a RLS se aplica |
| `NEWS_API_KEY` | Chave da NewsAPI para o endpoint `/news` |

CORS liberado para `http://localhost:8080` e `http://localhost:3000`. Para produção, inclua o domínio público em `backend/app/main.py`.

### 5.3 Segredos das Edge Functions (painel do Supabase)

| Segredo | Função |
|---|---|
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Fornecidos automaticamente pelo Supabase |
| `NEWS_API_KEY` | `fetch-aplv-news` |

## 6. Banco de dados

### 6.1 Convenções

- Chaves primárias `uuid` com `gen_random_uuid()`.
- Datas em `timestamptz`; `created_at` com `now()` e `updated_at` mantido pelo gatilho `update_updated_at_column`.
- Toda tabela do esquema `public` com **RLS ativada**.
- Dados do usuário referenciam `auth.users(id)` pela coluna `user_id`.
- Uma migração SQL por mudança em `supabase/migrations/AAAAMMDDHHMMSS_descricao.sql`.

> **Atenção:** o esquema de produção da tabela `medications` (colunas em português) e as tabelas `products`, `restaurants` e `solicitado_inclusao` não estão nas migrações. O dicionário abaixo descreve o **banco em produção**, conforme `src/integrations/supabase/types.ts`, e as tabelas criadas pelas migrações. Ver item 1 da seção 13.2 "Itens em aberto" do documento de arquitetura.

### 6.2 Dicionário de dados — dados do usuário

#### `profiles` — perfil do usuário

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK | Identificador |
| `user_id` | uuid único → `auth.users` | Dono do perfil |
| `full_name` | text | Nome completo |
| `profile_type` | text | `alergica`, `mae`, `pai`, `farmaceutico` ou `medico` |
| `birth_date` | date | Data de nascimento |
| `gender` | text | `masculino`, `feminino`, `nao_binario`, `prefiro_nao_dizer` |
| `city` / `state` | text | Cidade e UF |
| `profession` | text | Profissão |
| `phone` | text | Telefone |
| `allergy_info` | text | Alergias (texto livre, pode vir da análise por IA no onboarding) |
| `observation` | text | Observações de saúde |
| `child_name` | text | Nome da criança (legado; substituído por `babies`) |
| `avatar_url` | text | Foto (não usada na interface atual) |
| `created_at` / `updated_at` | timestamptz | Auditoria |

RLS: o usuário lê, cria e atualiza apenas o próprio perfil. Criado automaticamente no cadastro pelo gatilho `on_auth_user_created`.

#### `babies` — crianças vinculadas ao usuário

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK | Identificador |
| `user_id` | uuid | Responsável |
| `name` | text | Nome do bebê (obrigatório) |
| `birth_date` | date | Data de nascimento (opcional; usada para calcular a idade) |
| `created_at` / `updated_at` | timestamptz | Auditoria |

RLS: CRUD completo apenas pelo dono.

#### `user_roles` — papéis de acesso

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK | Identificador |
| `user_id` | uuid → `auth.users` | Usuário |
| `role` | enum `app_role` | `admin`, `moderator` ou `user` (único por usuário + papel) |

RLS: o usuário vê os próprios papéis; somente `admin` gerencia.

#### `user_onboarding` — controle da tela de boas-vindas

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK | Identificador |
| `user_id` | uuid único | Usuário que concluiu |
| `completed_at` | timestamptz | Quando concluiu |

A ausência de linha faz o painel exibir o onboarding.

#### `suggestions` e `feedback` — mensagens dos usuários

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK | Identificador |
| `user_id` | uuid | Autor |
| `content` | text | Mensagem. Pedidos de suporte vão para `suggestions` com o prefixo `[Suporte]` |
| `created_at` | timestamptz | Data de envio |

RLS: o autor insere e lê as próprias mensagens. A equipe lê pelo painel do Supabase.

#### `solicitado_inclusao` — pedidos de inclusão no catálogo

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK | Identificador |
| `user_id` | uuid | Solicitante |
| `tipo` | text | Medicamento, produto ou restaurante |
| `nome` | text | Nome do item |
| `composicao` | text | Composição informada |
| `imagem_url` | text | Foto do rótulo/bula no Storage |
| `status` | text | Situação da análise |
| `created_at` | timestamptz | Data |

Tabela existente no banco, sem tela na versão atual.

### 6.3 Dicionário de dados — catálogo

#### `medications` — medicamentos (esquema em produção)

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK | Identificador |
| `nome_principal` | text | Nome exibido (comercial ou genérico) |
| `nome_alternativo` | text | Fabricante / laboratório |
| `nome_completo` | text | Nome completo do registro |
| `composicao` | text | Princípios ativos + `. Excipientes:` + lista de excipientes |
| `tem_risco_aplv` | boolean | `true` contém leite · `false` não contém · `null` indefinido |
| `nivel_alerta` | text | Rótulo de alerta (`VERDE`, `AMARELO`, `VERMELHO` ou texto equivalente) |
| `avisos` | jsonb | Avisos da análise (lista de textos) |
| `termos_encontrados` | jsonb | Termos lácteos encontrados na bula |
| `detalhes_criticos` | jsonb | Pontos críticos da análise por IA |
| `detalhes_atencao` | jsonb | Pontos de atenção da análise por IA |
| `arquivo_url` | text | URL do PDF da bula original |
| `data_extracao` | text | Data da análise da bula |
| `access_count` | integer | Contador de visualizações (ordena "Mais Procurados") |
| `created_at` / `updated_at` | timestamptz | Auditoria |

RLS: leitura por qualquer usuário autenticado; escrita somente `admin`.

#### `products` e `restaurants` — módulos futuros

Mesma estrutura-base de `medications` (`nome_principal`, `nome_alternativo`, `nome_completo`, `nivel_alerta`, `tem_risco_aplv`/`avisos`, `access_count`). `products` tem `composicao`; `restaurants` tem `descricao` e `endereco`. Ainda sem uso na interface.

#### Modelo normalizado (migração `create_medication_catalog`)

| Tabela | Colunas principais | Finalidade |
|---|---|---|
| `allergen_groups` | `name`, `code` (`MILK`, `LACTOSE`, `GLUTEN`, `SOY`, `EGG`), `description` | Categorias de alergia |
| `ingredients` | `name` (único, sem diferenciar caixa), `common_names[]`, `cas_number`, `is_allergen`, `allergen_group_id` | Substâncias |
| `medication_ingredients` | `medication_id`, `ingredient_id`, `is_excipient`, `quantity`, `notes` | Composição normalizada |

A migração `seed_medications` popula 5 grupos, 34 ingredientes e 25 medicamentos de exemplo.

#### `news_cache` — cache de notícias

| Coluna | Tipo | Descrição |
|---|---|---|
| `title`, `description`, `url` (único), `source` | text | Dados da notícia |
| `published_at` | timestamptz | Data de publicação |
| `created_at` / `updated_at` | timestamptz | Usado para expirar o cache em 24 h |

### 6.4 Funções e gatilhos

| Objeto | Tipo | Descrição |
|---|---|---|
| `has_role(_user_id uuid, _role app_role) → boolean` | Função `SECURITY DEFINER` | Verifica se o usuário tem o papel. Usada nas políticas e pelo frontend (`isAdmin`). |
| `increment_medication_access(med_id uuid) → void` | Função `SECURITY DEFINER` | Soma 1 em `access_count`. `EXECUTE` liberado para `authenticated`. |
| `handle_new_user()` | Função de gatilho | Cria `profiles` (com `full_name` dos metadados) e `user_roles('user')` |
| `on_auth_user_created` | Gatilho em `auth.users` | Executa `handle_new_user` após cada cadastro |
| `update_updated_at_column()` | Função de gatilho | Atualiza `updated_at` em `profiles`, `babies`, `ingredients`, `medications`, `news_cache` |

### 6.5 Histórico de migrações

| Arquivo | Conteúdo |
|---|---|
| `20260125174611_…sql` | `profiles`, `app_role`, `user_roles`, `has_role`, `user_onboarding`, gatilhos de cadastro |
| `20260127005620_…sql` | `babies`, `suggestions`, `feedback` |
| `20260306000000_add_profile_extra_fields.sql` | `phone`, `allergy_info`, `observation` em `profiles` |
| `20260306000001_create_medication_catalog.sql` | Catálogo normalizado e RLS |
| `20260306000002_seed_medications.sql` | Dados de exemplo do catálogo |
| `20260306000003_add_access_count_and_profile_type.sql` | `access_count` e `profile_type` |
| `20260306000004_create_news_cache.sql` | `news_cache` |
| `20260306000005_increment_medication_access_fn.sql` | Função de contador de acessos |
| `20260308000000_add_profile_demographics.sql` | `birth_date`, `gender`, `city`, `state`, `profession` |

### 6.6 Como aplicar uma mudança de esquema

1. Crie `supabase/migrations/AAAAMMDDHHMMSS_descricao.sql` (use `IF NOT EXISTS` quando fizer sentido).
2. Habilite RLS e crie as políticas na mesma migração de qualquer tabela nova.
3. Aplique: `supabase db push`.
4. Regenere os tipos: `supabase gen types typescript --project-id <id> > src/integrations/supabase/types.ts`.
5. Atualize o dicionário de dados neste documento e gere os PDFs (`npm run docs:pdf`).

## 7. Camada de serviços do frontend

Regra do projeto: **componentes não chamam APIs diretamente** — usam as funções de `src/services/`.

### 7.1 `services/medications.ts`

| Função | Retorno | Descrição |
|---|---|---|
| `getPopularMedications()` | `MedRow[]` | 6 medicamentos com maior `access_count` |
| `getMedicationsPage(page, pageSize = MEDS_PAGE_SIZE)` | `{ items: MedRow[], total }` | Uma página do catálogo em ordem alfabética (desempate por `id`), com total via `count: "exact"`. Usada no filtro "Todos" do módulo Remédios |
| `getRecentMedications(limit = 10)` | `MedRow[]` | Lista em ordem alfabética (sem uso na interface atual) |
| `getMedicationsByRisk(risk)` | `MedRow[]` | Lista completa de um nível; pré-filtra no banco em lotes de 1000 linhas (limite do PostgREST) e confirma com `medToRisk` |
| `searchMedications(q, limit = 12)` | `MedRow[]` | Busca `ILIKE` em `nome_principal`, `nome_alternativo` e `nome_completo`. O painel chama com `limit = 300`; o Início exibe os 12 primeiros |
| `getMedication(id)` | `MedicationDetail` | Registro completo |
| `getSafeAlternatives(med, limit = 6)` | `SafeAlternative[]` | Mesmos princípios ativos, sem leite, um por fabricante |
| `recordMedicationView(id)` | `void` | Chama a RPC de contador; falhas são ignoradas |
| `medToRisk(temRisco, nivel, avisos)` | `"safe" \| "caution" \| "risk"` | Regra de classificação (ver 7.2) |
| `parseTextField(raw)` | `string[]` | Normaliza campos JSON/texto em lista de strings |
| `activeKeysOf(med)` | `string[]` | Chaves canônicas de princípios ativos |

Tipos e constantes exportados: `MedRow` (campos de listagem), `MedicationDetail` (registro completo), `SafeAlternative`, `MEDS_PAGE_SIZE` (30).

**Paginação do módulo Remédios.** Com o filtro "Todos" e sem busca, a paginação é feita no banco (`range`), buscando só os 30 itens da página. Nos filtros Seguro/Atenção/Risco a classificação final depende de `medToRisk` (que lê `avisos`), então a lista filtrada é carregada uma vez e paginada no navegador; trocar de página não faz nova consulta. Resultados de busca também são paginados no navegador. Trocar filtro ou busca volta para a página 1.

### 7.2 Regra de classificação — `medToRisk`

Avaliada na ordem abaixo; a primeira condição verdadeira decide.

| Ordem | Condição | Resultado |
|---|---|---|
| 1 | `nivel_alerta` contém "crítico", "critico" ou "proibido" | `risk` |
| 2 | `avisos` contém "crítico", "critico", "proibido" ou 🔴 | `risk` |
| 3 | `nivel_alerta` contém "atenção", "atencao" ou "cuidado" | `caution` |
| 4 | `avisos` contém "atenção", "atencao", "cuidado" ou 🟡 | `caution` |
| 5 | `tem_risco_aplv = true` | `risk` |
| 6 | `tem_risco_aplv = false` | `safe` |
| 7 | `nivel_alerta` contém "seguro" ou "liberado" | `safe` |
| 8 | Nenhuma das anteriores | `caution` (padrão seguro) |

### 7.3 Algoritmo de alternativas seguras

1. `activeKeysOf` extrai princípios ativos do `nome_principal` e do trecho da `composicao` antes de "Excipientes".
2. `normalizeName` remove acentos, ®/™, parênteses (inclusive aninhados) e dosagens (`500 mg`, `10 mg/ml`, `%`, `UI`).
3. A lista é separada por `+`, `;`, `,` ou " e "; cada item passa por `canonicalIngredient`, que remove prefixos de laboratório público (`furp-`, `lfm-`), sais, hidratos e formas farmacêuticas.
4. Itens únicos são ordenados e unidos por " + " → **chave canônica**.
5. A palavra mais longa (≥ 4 letras) de cada chave vira termo de busca, com vogais e "c" trocados por `_` (ignora acentos no `ILIKE`).
6. Consulta: `tem_risco_aplv = false`, id diferente do atual, termo em nome ou composição, ordenado por `access_count`, até 300 linhas.
7. No cliente: mantém só registros cuja chave canônica é idêntica; deduplica por fabricante normalizado (sem `Ltda`, `S.A.`, `EIRELI`, `ME`, `EPP`); para em 6.

### 7.4 `services/studies.ts`

| Item | Detalhe |
|---|---|
| `getRecentStudies()` | Busca, une, ordena por data e traduz os estudos |
| Fonte | `https://www.ebi.ac.uk/europepmc/webservices/rest/search` (somente `SRC:MED`, sem cartas e comentários) |
| Categoria `formulas` | Título com "milk allergy" + fórmula/hidrolisado/aminoácidos, 2024 em diante, até 7 |
| Categoria `medicamentos` | Título com "milk allergy" + medicamento/excipiente/vacina/inalador, 2019 em diante, até 5 |
| Link | PubMed (`pmid`) → DOI → página Europe PMC |
| Tradução | MyMemory `en → pt-BR`, tempo limite de 4 s, cache em `localStorage` (`alergica:study-title-pt`) |

### 7.5 `services/api.ts`

`apiFetch<T>(path, options)` chama `/api{path}` com o cabeçalho `Authorization: Bearer <JWT>` da sessão atual e lança erro `API <status>: <corpo>` em respostas não-2xx. Preparado para a API FastAPI; ainda sem chamadas na interface.

## 8. APIs de servidor

### 8.1 Edge Function `fetch-aplv-news`

| Item | Detalhe |
|---|---|
| Método | `POST` / `GET` (com pré-voo `OPTIONS` para CORS) |
| Resposta | `[{ title, description, url, publishedAt, source }]` — até 10 itens |
| Lógica | Devolve o cache (`news_cache`) se houver itens com menos de 24 h; senão consulta a NewsAPI em pt, en e fr, remove duplicados e "[Removed]", grava o cache (`upsert` por `url`) |
| Erros | Sempre devolve lista (vazia em caso de falha) |

### 8.2 Edge Function `create-admin-user`

| Item | Detalhe |
|---|---|
| Autenticação | `Authorization: Bearer <JWT de um usuário com papel admin>` |
| Corpo | `{ email, password, fullName?, makeAdmin? }` |
| Resposta | `200 { success, user: { id, email } }` · `400 { error }` · `401` sem login válido · `403` se não for `admin` · `500 { error }` |
| Lógica | Valida o JWT (`auth.getUser`) e o papel (`has_role`); então cria usuário confirmado com a chave de serviço e, com `makeAdmin`, grava papel `admin` |

> **Nota:** a chave pública (*anon*) também é um JWT válido para a plataforma, por isso a função faz a própria checagem de usuário e papel em vez de confiar só no `verify_jwt`. O primeiro administrador deve ser criado pelo painel do Supabase (inserindo a linha em `user_roles`).

### 8.3 API FastAPI

Todos os endpoints de medicamentos exigem `Authorization: Bearer <JWT do Supabase>`.

| Método e rota | Parâmetros | Resposta |
|---|---|---|
| `GET /medications/search` | `q` (texto, opcional), `limit` (padrão 12) | Lista de medicamentos; sem `q`, os 6 mais acessados |
| `GET /medications/{medication_id}` | — | Medicamento com `medication_ingredients` → `ingredients` → `allergen_groups`; `404` se não existir |
| `POST /medications/{medication_id}/view` | — | `{ "ok": "true" }` (falha do contador é ignorada) |
| `GET /news` | — | Até 10 notícias; `500` se `NEWS_API_KEY` ausente |

Documentação interativa em `http://localhost:8000/docs`.

### 8.4 Webhook n8n

| Uso | Requisição | Resposta esperada |
|---|---|---|
| Onboarding — perfil de alergias | `POST` JSON `{ "allergies": "<texto livre>" }` | Texto com o perfil gerado (qualquer campo de texto retornado é aceito) |
| Scanner de produtos | `POST` multipart, campo `image` (JPEG) | `{ safe: boolean, product?: string, allergens?: string[], details?: string }`. Se `safe` não vier como booleano, ou a chamada falhar, o app mostra a tela de erro — nunca um resultado padrão. |

## 9. Componentes de interface

| Componente | Responsabilidade |
|---|---|
| `Sidebar` | Barra lateral (desktop) e conteúdo do drawer (celular): logo, tema, Meu Perfil, Configurações, Sair |
| `ExpandableTabs` | Menu inferior fixo com os módulos Início, Remédios, Produtos, Restaurantes, Nutrição |
| `MedicationCard` | Card de medicamento com nome, fabricante e selo de risco |
| `RiskBadge` | Selo colorido do nível de risco |
| `PaginationBar` | Navegação entre páginas (Anterior, números com reticências, Próxima; no celular mostra "página / total") |
| `APLVInfoCarousel` | Carrossel com 10 fichas educativas com fonte e estudos recentes traduzidos |
| `OnboardingModal` | Boas-vindas e configuração do perfil de alergias com IA (pulada para profissionais de saúde) |
| `ProductScanner` | Câmera, captura, envio ao n8n e exibição do resultado; estados `idle`, `camera`, `preview`, `analyzing`, `result` ou `error` |
| `BabyManager` | Lista, inclusão e remoção de bebês, com cálculo de idade |
| `ChatWidget` | Botão flutuante do mascote: Suporte, Sugestão e Feedback |
| `ThemeToggle` | Alterna tema claro/escuro |
| `NavLink` | Link de navegação com estado ativo |
| `ui/*` | Biblioteca shadcn/ui (botões, cards, drawer, diálogo, carrossel, skeleton, toasts…) |

## 10. Design system

### 10.1 Tokens de cor (tema claro, HSL)

| Token | Valor | Uso |
|---|---|---|
| `--primary` | `152 76% 65%` | Verde-menta da marca, botões e destaques |
| `--background` | `120 20% 98%` | Fundo da aplicação |
| `--foreground` | `160 25% 20%` | Texto principal |
| `--secondary` | `140 30% 94%` | Superfícies suaves |
| `--safe` | `152 70% 55%` | Nível Seguro |
| `--caution` | `40 90% 60%` | Nível Atenção |
| `--risk` | `0 65% 70%` | Nível Risco |
| `--radius` | `1rem` (lg `1.5rem`, xl `2rem`) | Cantos arredondados |

Há um conjunto equivalente para o tema escuro (classe `.dark`). Use sempre os tokens (`bg-primary`, `text-risk-foreground`…), nunca cores fixas.

### 10.2 Tipografia, sombra e movimento

- Fonte: **Nunito** (400–800) carregada do Google Fonts.
- Sombras em camadas, tingidas com a cor da marca (`--shadow-soft`, `--shadow-card`, `--shadow-hover`).
- Animações utilitárias: `animate-fade-in`, `animate-slide-in-right`, `animate-float`. Anime apenas `transform` e `opacity`; não use `transition-all`.
- Todo elemento clicável precisa de estados `hover`, `focus-visible` e `active`.

## 11. Testes e qualidade

| Item | Estado |
|---|---|
| Executor | Vitest com ambiente jsdom e Testing Library (`src/test/setup.ts`) |
| Cobertura atual | Apenas um teste de exemplo |
| Prioridade 1 | Testes unitários de `medToRisk`, `parseTextField`, `activeKeysOf`, `getSafeAlternatives` (com cliente simulado) |
| Prioridade 2 | Testes de componentes: `AuthPage` (validações), `MedicationDetails` (destaque de excipientes) |
| Prioridade 3 | Testes ponta a ponta (Playwright) de cadastro, busca e detalhe |
| Lint | ESLint 9 com regras de React Hooks (`npm run lint`) |

## 12. Implantação

### 12.1 Frontend (Vercel)

1. Conecte o repositório ao Vercel (framework: Vite).
2. Comando de build `npm run build`, diretório de saída `dist`.
3. Cadastre `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e `VITE_N8N_WEBHOOK_URL` em *Environment Variables*.
4. `vercel.json` reescreve todas as rotas para `index.html` (necessário para a SPA).
5. Em Supabase → Authentication → URL Configuration, cadastre o domínio de produção.

### 12.2 Banco e funções (Supabase)

```bash
supabase link --project-ref <id-do-projeto>
supabase db push                                   # aplica migrações pendentes
supabase functions deploy fetch-aplv-news
supabase secrets set NEWS_API_KEY=<chave>
```

### 12.3 API FastAPI

Execute com `uvicorn app.main:app --host 0.0.0.0 --port 8000` em um serviço de contêiner (Render, Railway, Fly.io, Cloud Run). Ajuste o CORS para o domínio de produção e defina as variáveis de ambiente da seção 5.2.

### 12.4 Checklist de publicação

- [ ] `npm run lint` e `npm run test` sem erros
- [ ] `npm run build` concluído
- [ ] Migrações aplicadas e tipos regenerados
- [ ] Variáveis de ambiente conferidas no Vercel
- [ ] Documentação atualizada e PDFs regerados (`npm run docs:pdf`)

## 13. Manutenção da documentação

A documentação vive junto ao código, em `docs/`, e deve ser atualizada **no mesmo commit** de qualquer mudança que a afete.

| Mudança no sistema | Documento(s) a atualizar |
|---|---|
| Nova tela, fluxo ou texto visível ao usuário | Manual do Usuário |
| Nova tabela, coluna, função ou política | Documentação Técnica (seção 6) e Arquitetura (seção 8) |
| Novo serviço, endpoint ou integração | Documentação Técnica (seções 7–8) e Arquitetura (seções 6–7) |
| Mudança na regra de classificação ou alternativas | Arquitetura (seção 9) e Documentação Técnica (seção 7) |
| Correção de item de dívida técnica | Arquitetura (seção 13) |

Passos:

1. Edite o(s) arquivo(s) `.md` em `docs/`.
2. Atualize o campo `versao` e `atualizado` no cabeçalho e adicione uma linha ao **Histórico de revisões**. Use versionamento semântico: correção de texto → `x.y.Z`; seção ou funcionalidade nova → `x.Y.0`; reestruturação → `X.0.0`.
3. Gere os PDFs: `npm run docs:pdf`.
4. Faça commit dos `.md` e dos `.pdf` juntos.

O gerador (`scripts/build-docs.mjs`) monta capa, sumário e diagramas Mermaid e imprime com o Chrome/Edge em modo *headless*. Se o navegador estiver em local não padrão, defina `CHROME_PATH`.

## 14. Histórico de revisões

| Versão | Data | Alterações |
|---|---|---|
| 1.0.0 | 12/11/2026 | Primeira versão completa da documentação técnica. |
| 1.0.1 | 12/11/2026 | `create-admin-user` restrita a administradores (seção 8.2); tratamento de erro do scanner (seções 8.4 e 9). |
| 1.1.0 | 12/11/2026 | Paginação de 30 itens no módulo Remédios: `getMedicationsPage`, `MEDS_PAGE_SIZE`, busca em lotes em `getMedicationsByRisk` e componente `PaginationBar` (seções 7.1 e 9). |
