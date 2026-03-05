<p align="center">
  <img src="src/assets/mascot.png" alt="AlerGica Mascote" width="150" />
</p>

<h1 align="center">🩺 AlerGica</h1>

<p align="center">
  <strong>Plataforma inteligente para gerenciamento de alergias alimentares</strong><br/>
  Iniciando com APLV (Alergia à Proteína do Leite de Vaca), com visão de atender <em>todas</em> as alergias alimentares.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.x-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Lovable_Cloud-Backend-10B981?logo=supabase&logoColor=white" alt="Lovable Cloud" />
</p>

---

## 📖 Sobre o Projeto

O **AlerGica** é uma aplicação web voltada para **pais, mães, farmacêuticos e médicos** que lidam com alergias alimentares. A solução inicial foca na **APLV** (Alergia à Proteína do Leite de Vaca), mas a arquitetura foi projetada para expandir e atender **todas as alergias alimentares** futuramente.

### 🎯 Problema que Resolve

Pais e profissionais de saúde enfrentam dificuldade diária para identificar se medicamentos, produtos alimentícios e restaurantes são seguros para crianças/pacientes com alergias alimentares. O AlerGica centraliza essas informações com um sistema de **classificação de risco por cores** que torna a consulta rápida e intuitiva.

### 👥 Público-Alvo

| Perfil | Descrição |
|--------|-----------|
| 💗 **Mamãe** | Mães de crianças com alergias alimentares |
| 👶 **Papai** | Pais de crianças com alergias alimentares |
| 💊 **Farmacêutica(o)** | Profissionais que precisam verificar composição de medicamentos |
| 🩺 **Médico(a)** | Profissionais de saúde que orientam pacientes alérgicos |

---

## ✨ Funcionalidades

### ✅ Implementadas

#### 🔐 Autenticação e Perfis
- Cadastro com **verificação de e-mail** obrigatória
- Login seguro com validação via Zod
- **4 tipos de perfil**: Mamãe, Papai, Farmacêutica, Médico
- Experiência personalizada por perfil (saudações, placeholders, seções)
- Sistema de **RBAC** (Role-Based Access Control) com 3 níveis: `admin`, `moderator`, `user`

#### 🏠 Dashboard Multi-Módulo
- Interface controlada por **menu inferior fixo expansível** (ExpandableTabs)
- 5 módulos de navegação: Início, Medicamentos, Produtos, Restaurantes, Nutrição
- **Barra de busca inteligente** com debounce de 300ms
- Adaptação do placeholder de busca conforme o perfil do usuário
- Seção "Mais Procurados" com os 6 itens mais acessados

#### 💊 Medicamentos
- Busca por nome principal ou nome completo (busca `ilike`)
- Cards com composição resumida e classificação de risco
- **Página de detalhes** com análise completa de composição e excipientes
- Contador de acessos por medicamento (`access_count`)
- Sanitização automática de composição (remoção de dados inválidos)

#### 🚦 Sistema de Classificação de Risco
| Cor | Nível | Significado |
|-----|-------|-------------|
| 🟢 Verde | `VERDE` / `safe` | Seguro — sem derivados de leite detectados |
| 🟡 Amarelo | `AMARELO` / `caution` | Atenção — verificar com profissional |
| 🔴 Vermelho | `VERMELHO` / `risk` | Risco — contém derivados de leite |

Cada item exibe um `RiskBadge` visual com o status correspondente.

#### 📰 Carrossel de Notícias APLV
- Busca automática via **Edge Function** (`fetch-aplv-news`)
- Integração com **NewsAPI** em 3 idiomas: Português, Inglês e Espanhol
- Termos de busca especializados (APLV, CMPA, caseína, lactoglobulina, etc.)
- Exibição com tempo decorrido ("há 2 horas", "há 3 dias")
- Persistência em cache local para performance

#### 👤 Perfil do Usuário
- Edição de nome completo e dados pessoais
- Gerenciamento de e-mail (somente leitura)
- Campos para telefone, alergias e observações
- **Dashboard de estatísticas**: medicamentos, produtos e restaurantes pesquisados

#### 👶 Gerenciamento de Bebês (BabyManager)
- Cadastro de múltiplos bebês por usuário
- Registro de data de nascimento
- **Cálculo automático de idade** (anos, meses, dias)
- Vinculação ao perfil do usuário

#### 🎉 Onboarding
- Modal de boas-vindas na **primeira visita** do usuário
- Apresentação do mascote (ursa enfermeira)
- Registro em tabela `user_onboarding` para não repetir
- Texto explicativo sobre a missão do AlerGica

#### 📩 Solicitação de Inclusão
- Formulário para solicitar análise de novos itens (medicamentos, produtos, restaurantes)
- **Upload de imagem** (rótulo, bula, foto) via Storage
- Composição/ingredientes em campo de texto
- Armazenamento na tabela `solicitado_inclusao` para análise posterior via IA (n8n)

#### 💬 Widget de Suporte
- **Mascote flutuante** no canto inferior direito
- 3 opções: Suporte, Sugestão e Feedback
- Sugestões e feedbacks salvos no banco de dados
- Animações de entrada/saída suaves

#### 🎨 Tema e Design
- **Tema claro e escuro** com toggle no header/sidebar
- Paleta mint green (#A8E6CF) como cor primária
- Design **mobile-first** responsivo
- Sidebar completa no desktop, Drawer no mobile
- Animações CSS customizadas (fade-in, scale-in, float)
- Componentes shadcn/ui customizados com design system semântico

#### ⚙️ Área Administrativa (Admin)
- Acesso restrito via RBAC (apenas `admin`)
- **Importação em massa** de medicamentos via arquivo JSON
- Barra de progresso durante upload
- Relatório de resultado (sucesso/erros)
- Mapeamento automático de status APLV para nível de alerta

### 🚧 Em Desenvolvimento

| Módulo | Ícone | Status | Descrição |
|--------|-------|--------|-----------|
| **Produtos** | 🛒 | Em desenvolvimento | Consulta de produtos alimentícios com classificação de risco |
| **Restaurantes** | 🍽️ | Em desenvolvimento | Restaurantes com opções seguras para alérgicos |
| **Nutrição** | 🥗 | Em desenvolvimento | Orientações nutricionais e receitas seguras |

---

## 🏗️ Arquitetura Técnica

### Stack de Tecnologias

| Camada | Tecnologia | Uso |
|--------|-----------|-----|
| **Frontend** | React 18 + TypeScript | Interface de usuário |
| **Build** | Vite 5 | Bundler e dev server |
| **Estilização** | Tailwind CSS + shadcn/ui | Design system e componentes |
| **Estado** | TanStack React Query | Cache e sincronização de dados |
| **Roteamento** | React Router DOM v6 | Navegação SPA |
| **Validação** | Zod | Schemas de validação |
| **Formulários** | React Hook Form | Gerenciamento de formulários |
| **Animações** | Framer Motion + CSS | Transições e micro-interações |
| **Backend** | Lovable Cloud | Banco de dados, autenticação, storage e Edge Functions |

### Estrutura de Pastas

```
src/
├── assets/              # Imagens e recursos estáticos
│   └── mascot.png       # Mascote do AlerGica (ursa enfermeira)
├── components/          # Componentes reutilizáveis
│   ├── ui/              # Componentes shadcn/ui (accordion, button, card, etc.)
│   ├── AddInclusionModal.tsx   # Modal de solicitação de inclusão
│   ├── APLVNewsCarousel.tsx    # Carrossel de notícias APLV
│   ├── BabyManager.tsx         # Gerenciamento de bebês
│   ├── BottomNav.tsx           # Menu inferior multi-módulo
│   ├── ChatWidget.tsx          # Widget de suporte/sugestão/feedback
│   ├── MedicationCard.tsx      # Card de medicamento com risco
│   ├── OnboardingModal.tsx     # Modal de boas-vindas
│   ├── ProductCard.tsx         # Card de produto
│   ├── RestaurantCard.tsx      # Card de restaurante
│   ├── RiskBadge.tsx           # Badge visual de nível de risco
│   ├── Sidebar.tsx             # Sidebar/Drawer de navegação
│   └── ThemeToggle.tsx         # Alternador de tema claro/escuro
├── contexts/
│   └── AuthContext.tsx  # Contexto global de autenticação
├── hooks/
│   ├── use-mobile.tsx   # Detecção de dispositivo móvel
│   ├── use-toast.ts     # Hook de notificações toast
│   └── useUserRole.ts   # Hook de verificação de roles (admin/moderator/user)
├── integrations/
│   └── supabase/        # Cliente e tipos auto-gerados (NÃO EDITAR)
├── pages/
│   ├── AuthPage.tsx     # Página de login/cadastro com animação split-screen
│   ├── Dashboard.tsx    # Dashboard principal multi-módulo
│   ├── MedicationDetails.tsx  # Detalhes do medicamento
│   ├── ProfilePage.tsx  # Perfil do usuário
│   ├── SettingsPage.tsx # Configurações (admin only)
│   └── NotFound.tsx     # Página 404
├── App.tsx              # Rotas e providers
├── index.css            # Tokens de design e estilos globais
└── main.tsx             # Entry point
```

### Rotas da Aplicação

| Rota | Página | Acesso |
|------|--------|--------|
| `/` | AuthPage | Público |
| `/dashboard` | Dashboard | Autenticado |
| `/medication/:id` | MedicationDetails | Autenticado |
| `/profile` | ProfilePage | Autenticado |
| `/settings` | SettingsPage | Admin only |
| `/medications` | Dashboard (módulo) | Autenticado |
| `/products` | Dashboard (módulo) | Autenticado |
| `/restaurants` | Dashboard (módulo) | Autenticado |
| `/nutrition` | Dashboard (módulo) | Autenticado |

---

## 🗄️ Banco de Dados

O sistema utiliza **10 tabelas** com Row-Level Security (RLS) habilitada:

| Tabela | Descrição | Campos Principais |
|--------|-----------|-------------------|
| `profiles` | Perfil do usuário | `user_id`, `full_name`, `child_name`, `profile_type`, `avatar_url` |
| `user_roles` | Roles RBAC (tabela separada por segurança) | `user_id`, `role` (enum: admin/moderator/user) |
| `user_onboarding` | Controle de onboarding | `user_id`, `completed_at` |
| `medications` | Medicamentos cadastrados | `nome_principal`, `composicao`, `nivel_alerta`, `tem_risco_aplv`, `access_count` |
| `products` | Produtos alimentícios | `nome_principal`, `composicao`, `nivel_alerta`, `tem_risco_aplv`, `access_count` |
| `restaurants` | Restaurantes | `nome_principal`, `descricao`, `endereco`, `nivel_alerta`, `access_count` |
| `babies` | Bebês vinculados ao usuário | `user_id`, `name`, `birth_date` |
| `solicitado_inclusao` | Solicitações de inclusão | `user_id`, `tipo`, `nome`, `composicao`, `imagem_url`, `status` |
| `suggestions` | Sugestões dos usuários | `user_id`, `content` |
| `feedback` | Feedbacks dos usuários | `user_id`, `content` |

### Função de Segurança

```sql
-- Verifica se um usuário possui determinado role (SECURITY DEFINER evita recursão de RLS)
function has_role(_user_id uuid, _role app_role) returns boolean
```

---

## ⚡ Backend Functions

### `fetch-aplv-news`
- **Descrição**: Busca notícias sobre APLV em tempo real
- **API**: NewsAPI (`everything` endpoint)
- **Idiomas**: Português, Inglês, Espanhol (busca paralela)
- **Autenticação**: Sem JWT (público)
- **Parâmetros**: `porIdioma` (quantidade por idioma, default: 5)
- **Termos de busca**: APLV, CMPA, caseína, lactoglobulina, whey, soro de leite, etc.

### `create-admin-user`
- **Descrição**: Criação de usuários administradores
- **Uso**: Operações administrativas

---

## 🔐 Roles e Permissões

| Funcionalidade | 👤 User | 🛡️ Moderator | ⚙️ Admin |
|----------------|---------|--------------|----------|
| Buscar medicamentos/produtos | ✅ | ✅ | ✅ |
| Ver detalhes de medicamentos | ✅ | ✅ | ✅ |
| Gerenciar perfil e bebês | ✅ | ✅ | ✅ |
| Enviar sugestões/feedback | ✅ | ✅ | ✅ |
| Solicitar inclusão de itens | ✅ | ✅ | ✅ |
| Acessar configurações | ❌ | ❌ | ✅ |
| Importar medicamentos (JSON) | ❌ | ❌ | ✅ |
| Adicionar itens diretamente | ❌ | ❌ | ✅ |

---

## 🚀 Como Executar

### Pré-requisitos
- [Node.js](https://nodejs.org/) (v18+) ou [Bun](https://bun.sh/)
- npm ou bun

### Instalação

```bash
# 1. Clone o repositório
git clone <URL_DO_REPOSITORIO>

# 2. Entre no diretório
cd alergica

# 3. Instale as dependências
npm install

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`.

### Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento com hot-reload |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build de produção |
| `npm run test` | Execução dos testes |

---

## 🗺️ Roadmap

### Fase 1 — APLV (Atual)
- [x] Autenticação com verificação de e-mail
- [x] Dashboard multi-módulo com busca
- [x] Classificação de risco de medicamentos
- [x] Carrossel de notícias APLV
- [x] Perfil com gerenciamento de bebês
- [x] Widget de suporte/sugestão/feedback
- [x] Onboarding para novos usuários
- [x] Importação de medicamentos via JSON (admin)
- [x] Solicitação de inclusão com upload de imagem
- [x] Tema claro/escuro

### Fase 2 — Expansão de Módulos
- [ ] **Módulo de Produtos**: Busca e classificação de produtos alimentícios
- [ ] **Módulo de Restaurantes**: Restaurantes com menus seguros para alérgicos
- [ ] **Módulo de Nutrição**: Orientações nutricionais, receitas e substituições
- [ ] Integração com **n8n** para análise automática de composições via IA
- [ ] Estatísticas reais de consultas por usuário (substituir mock)

### Fase 3 — Todas as Alergias
- [ ] Expansão do sistema de classificação para **todas as alergias alimentares**
  - Ovo, Soja, Trigo (Glúten), Amendoim, Frutos do Mar, Nozes, Gergelim, etc.
- [ ] Perfis de alergia múltipla por bebê/paciente
- [ ] Filtros de busca por tipo de alergia
- [ ] Alertas cruzados (medicamento seguro para APLV, mas contém soja)
- [ ] Classificação de risco dinâmica baseada no perfil de alergias do usuário

### Fase 4 — Comunidade e Inteligência
- [ ] Fórum da comunidade para pais e profissionais
- [ ] Análise automática de rótulos via **OCR + IA**
- [ ] Notificações push para atualizações de produtos
- [ ] Integração com profissionais de saúde (prescrições seguras)
- [ ] API pública para parceiros e aplicativos de saúde
- [ ] PWA (Progressive Web App) para uso offline

---

## 🎨 Identidade Visual

- **Mascote**: Ursa enfermeira simpática e acolhedora
- **Cor primária**: Mint Green (`#A8E6CF`) — transmite saúde e segurança
- **Tipografia**: Fonte extrabold para títulos, medium para corpo
- **Design**: Mobile-first, cards arredondados, sombras suaves
- **Temas**: Claro (padrão) e Escuro com tokens semânticos CSS

---

## 📄 Licença

Este projeto é propriedade privada. Todos os direitos reservados.

---

<p align="center">
  Feito com 💚 para famílias que convivem com alergias alimentares
</p>
