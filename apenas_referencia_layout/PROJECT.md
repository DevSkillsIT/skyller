# SKYLLER - Documentação Técnica Completa

**Última atualização:** Janeiro 2026  
**Status do Projeto:** Frontend Framework Completo (Backend Pendente)  
**Stack Ativo:** Next.js 16, React 19, TypeScript 5.6, Tailwind v4, shadcn/ui

---

## 📋 Índice
1. [Visão Geral do Projeto](#visão-geral)
2. [Stack Técnica](#stack-técnica)
3. [Arquitetura e Estrutura](#arquitetura-e-estrutura)
4. [Features Implementadas](#features-implementadas)
5. [Layout e UX](#layout-e-ux)
6. [Dados Mockados](#dados-mockados)
7. [Próximos Passos (Crítico)](#próximos-passos-crítico)
8. [Guia de Integração Backend](#guia-de-integração-backend)
9. [Observações e Notas](#observações-e-notas)

---

## Visão Geral

**SKYLLER** é uma plataforma de gerenciamento de agentes IA multi-projeto com interface intuitiva, chat interativo, gerenciamento de documentos, kanban, análise e pesquisa.

### Objetivo Original (Briefing)
- Criar interface moderna para gestão de projetos com agentes IA
- Integrar CopilotKit + AG-UI Protocol para chat em tempo real
- Suportar múltiplos workspaces com isolamento de dados
- Oferecer recursos como: Chat, Kanban, Documentos, Análise, Agentes, Apresentações, Pesquisa
- Fluxo intuitivo: Selecionar Workspace → Ver Projetos → Acessar Projeto → Chat

---

## Stack Técnica

### Frontend (✅ Implementado)
```
Next.js 16.0.10          → Framework principal, App Router
React 19.2.0            → UI library com hooks modernos
TypeScript 5.6          → Type safety completo
Tailwind CSS 4.1.9      → Styling via utility classes + design tokens CSS variables
shadcn/ui               → ~30 componentes Radix UI pré-configurados
Lucide Icons 0.454      → 1000+ ícones vetoriais
React Hook Form 7.60    → Gerenciamento de formulários
Zod 3.25.76            → Validação com type-safe schemas
@dnd-kit 6.3.1         → Drag-and-drop para Kanban
TanStack Table 8.21    → Tabelas tipadas e otimizadas
SWR 2.3.8              → Client-side data fetching e caching
Radix UI Primitives    → Componentes sem estilo (base dos shadcn)
```

### Backend (❌ Não Implementado - PENDENTE)
```
Agno v2.3.18+          → Framework de agentes IA
LiteLLM Gateway        → Abstração para múltiplos LLMs
PostgreSQL + RLS       → Banco de dados com segurança por linha
Weaviate               → Vector database para DocsRAG
@copilotkit/backend    → Backend do CopilotKit (SSE streaming)
FastAPI / Node.js      → Framework de API
```

### DevTools (Setup Local)
```
Biome (recomendado)    → Linting + Formatting (trocar ESLint)
Vitest                 → Unit testing
Playwright             → E2E testing
```

---

## Arquitetura e Estrutura

### Diretórios Principais
```
/app
├── (dashboard)
│   ├── layout.tsx               → Layout principal com sidebar persistente
│   ├── projects/
│   │   ├── page.tsx             → Listagem de projetos do workspace
│   │   ├── [id]/
│   │   │   └── page.tsx         → Página individual do projeto (chat + config)
│   │   └── loading.tsx
│   ├── kanban/
│   │   └── page.tsx             → Kanban com @dnd-kit
│   ├── knowledge/
│   │   └── page.tsx             → Documentos com TanStack Table
│   ├── analysis/
│   │   └── page.tsx
│   ├── agents/
│   │   └── page.tsx             → Galeria de agentes
│   ├── presentations/
│   │   └── page.tsx
│   └── research/
│       └── page.tsx

/components
├── ui/                          → Componentes shadcn/ui base
├── layout/
│   ├── app-sidebar.tsx          → Sidebar principal (colapsível)
│   ├── app-header.tsx           → Header com busca
│   ├── artifact-panel.tsx       → Painel direito flutuante
│   └── mobile-nav.tsx           → Navegação mobile
└── dialogs/
    ├── create-project-dialog.tsx → Modal de novo projeto (nome + descrição)
    ├── project-instructions-dialog.tsx → Modal de instruções
    └── search-dialog.tsx

/lib
├── mock/
│   └── data.ts                  → Dados mockados (workspaces, projetos, conversas)
├── contexts/
│   ├── panel-context.tsx        → Context para painel flutuante
│   └── chat-context.tsx         → Context para chat (vazio, aguardando CopilotKit)
└── utils.ts                     → Funções utilitárias (cn, formatRelativeTime)

/public                          → Assets estáticos
```

### Hierarquia de Componentes
```
RootLayout
└── DashboardLayout (com Sidebar + Header)
    ├── AppSidebar
    │   ├── Workspace Selector
    │   ├── Ferramentas (Kanban, Canvas, Docs, etc)
    │   └── Suas Conversas (histórico)
    ├── AppHeader
    │   ├── SearchDialog
    │   └── User Menu
    └── Main Content
        ├── ProjectsPage (listagem)
        ├── ProjectPage (chat + config)
        ├── KanbanPage
        ├── KnowledgePage
        └── ... outras pages
```

---

## Features Implementadas

### ✅ Sidebar Inteligente
- **Workspace Selector**: Dropdown para trocar workspace
- **Redirecionamento Automático**: Ao selecionar workspace → redireciona para `/projects?workspace={id}`
- **Persistência**: Workspace selecionado salvo em `localStorage`
- **Seções Colapsáveis**:
  - Ferramentas (Kanban, Canvas, Documentos, Análise, Agentes, Apresentações, Pesquisa)
  - Suas Conversas (histórico de chats com timestamps relativos)
- **Indicadores de Hover**: Badge com contagem + chevron rotativo aparecem no hover
- **Responsivo**: Modo colapsado/expandido baseado em `useSidebar`

### ✅ Sistema de Projetos
- **Página de Listagem** (`/projects`):
  - Grid de cards com todos os projetos do workspace
  - Search/filter
  - Botão "Novo Projeto"
  
- **Modal de Criação** (minimalista estilo Claude):
  - Campo: Nome do projeto
  - Campo: Descrição
  - Redireciona para página do projeto após criação

- **Página do Projeto** (`/projects/[id]`):
  - **Layout Claude-inspired**: Chat à esquerda, sidebar de config à direita
  - **Chat Interface**:
    - Empty state com título, descrição e input
    - Histórico de conversas do projeto abaixo (como Claude)
    - Timestamps relativos (agora, minutos, horas, dias)
  - **Sidebar de Configuração**:
    - **Memória**: Contexto do projeto (apenas você + data)
    - **Instruções**: Modal para adicionar/editar system prompt
    - **Arquivos**: Grid de arquivos com barra de capacidade + dropdown de upload (GitHub, Google Drive, etc)
    - **Conversas Recentes**: Links para conversas do projeto

### ✅ Outras Features
- **Kanban Page**: Board com @dnd-kit (drag-and-drop de cards entre colunas)
- **Documentos Page**: Tabela com TanStack Table (busca, sort, filtro)
- **Galeria de Agentes**: Cards com descrições e ícones
- **Header**: Search dialog funcional + user menu

### ✅ Design System
- **Colors**: 3-5 cores principais via design tokens CSS variables
- **Typography**: Duas font families (headings + body)
- **Spacing**: Escala Tailwind consistente
- **Icons**: Lucide Icons em todo projeto
- **Components**: Buttons, Dialogs, Inputs, Cards, Badges, Tooltips, Dropdowns

---

## Layout e UX

### Estrutura Visual
```
┌─────────────────────────────────────────┐
│  Header (Search + User Menu)            │
├──────────┬──────────────────────────────┤
│          │                              │
│ Sidebar  │  Main Content Area           │
│ (280px)  │  (com Artifact Panel lado)  │
│          │                              │
│ • New    │  Projects Grid ou            │
│   Chat   │  Project Chat               │
│          │                              │
│ • Search │  ┌────────────────────────┐ │
│          │  │   Chat/Config Pages    │ │
│ Workspace│  │   (variável conforme)  │ │
│          │  └────────────────────────┘ │
│ Tools    │                              │
│ (colap)  │  ┌──────────────────────┐   │
│          │  │ Artifact Panel       │   │
│ Recent   │  │ (painel flutuante)   │   │
│ (colap)  │  └──────────────────────┘   │
│          │                              │
└──────────┴──────────────────────────────┘
```

### Workspace - Projetos e Chat (Seção Sidebar)
- **Workspace Selector**: Dropdown com todos os workspaces
- **Link "Projetos de {workspace}"**: Leva para `/projects?workspace={id}`
- **Status**: Persiste em localStorage, não limpa ao trocar de ferramenta

### Ferramentas (Seção Sidebar - Colapsável)
- 7 ferramentas disponíveis
- Chevron rotativo indica estado
- Não usa workspace (ferramentas globais)

### Suas Conversas (Seção Sidebar - Colapsável)
- Histórico global de chats
- Mostra "agora", "5min", "1h", "2d", etc
- Links diretos para chats

---

## Dados Mockados

### Estrutura de Dados
```typescript
mockWorkspaces: [
  {
    id: "ws_dev",
    name: "Desenvolvimento",
    emoji: "🚀",
    createdAt: Date,
    description: string
  },
  ...
]

mockProjects: [
  {
    id: "proj_1",
    workspaceId: "ws_dev",
    name: "Skills Hub Dev",
    emoji: "🎯",
    description: string,
    docsCount: number,
    createdAt: Date,
    memory: string,
    instructions: string
  },
  ...
]

mockConversations: [
  {
    id: "conv_1",
    projectId: "proj_1",
    title: "Comparação Diffy vs Agnos",
    updatedAt: Date,
    messages: []
  },
  ...
]
```

### Arquivo: `/lib/mock/data.ts`
- **8 workspaces** de exemplo
- **20+ projetos** distribuídos entre workspaces
- **30+ conversas** com timestamps variados
- Funções helper: `getRecentConversations()`, `getProjectById()`, etc

---

## Próximos Passos (CRÍTICO)

### 1. Instalar CopilotKit (Prioridade 1)
```bash
pnpm add @copilotkit/react @copilotkit/react-textarea @copilotkit/backend
```

### 2. Criar Backend com Agno + LiteLLM
```bash
# Backend em FastAPI ou Node.js
# Integrar: Agno v2.3.18+ + LiteLLM Gateway
# Endpoints necessários:
# - POST /copilot/chat (SSE streaming)
# - POST /projects (criar projeto)
# - GET /projects/{id}/conversations
```

### 3. Implementar CopilotProvider no Layout
```tsx
// app/(dashboard)/layout.tsx
<CopilotProvider publicApiKey={process.env.NEXT_PUBLIC_COPILOT_KEY}>
  <DashboardInner>
    {children}
  </DashboardInner>
</CopilotProvider>
```

### 4. Conectar Chat Real
```tsx
// app/(dashboard)/projects/[id]/page.tsx
const { useCopilot } = useCopilot()
// Substituir mock chat por CopilotChat component
```

### 5. Configurar PostgreSQL + RLS
- Criar schema de workspaces, projects, conversations
- Implementar RLS policies para isolamento de dados
- Substituir mock data por queries reais

### 6. Integração Weaviate para DocsRAG
- Setup Weaviate (Docker ou cloud)
- Implementar indexação de documentos
- Criar endpoint de search

### 7. Trocar ESLint por Biome (Local)
```bash
pnpm remove eslint eslint-config-next
pnpm add -D @biomejs/biome
biome init  # gera biome.json
```

### 8. Adicionar Testes (Vitest + Playwright)
```bash
pnpm add -D vitest @vitest/ui playwright @playwright/test
```

---

## Guia de Integração Backend

### API Endpoints Esperados

#### Chat/Conversas
```
POST /api/projects/{projectId}/chat
  body: { message: string, conversationId?: string }
  response: { conversationId, response, streaming: SSE }

GET /api/projects/{projectId}/conversations
  response: Conversation[]

POST /api/conversations/{id}
  body: { title, instructions, files }
  response: Conversation
```

#### Projetos
```
GET /api/workspaces/{id}/projects
  response: Project[]

POST /api/projects
  body: { name, description, workspaceId }
  response: Project

GET /api/projects/{id}
  response: Project (com memory, instructions, files)

PATCH /api/projects/{id}
  body: { memory?, instructions?, files? }
  response: Project
```

#### Workspaces
```
GET /api/workspaces
  response: Workspace[]

POST /api/workspaces
  body: { name, description }
  response: Workspace
```

### Server Actions vs Fetch
- Usar **Server Actions** para operações simples (criar projeto)
- Usar **fetch + SWR** para dados que precisam sync (conversas, projetos)
- CopilotKit gerencia SSE streaming automaticamente

### Environment Variables Necessárias
```
NEXT_PUBLIC_COPILOT_KEY=sk_...
NEXT_PUBLIC_API_URL=http://localhost:3001
DATABASE_URL=postgresql://user:pass@localhost:5432/skyller
WEAVIATE_URL=http://localhost:8080
AGNO_API_KEY=...
LITELLM_API_KEY=...
```

---

## Observações e Notas

### O que Funciona 100%
- ✅ UI/UX completa e responsiva
- ✅ Navegação entre pages
- ✅ Sidebar inteligente com persistência
- ✅ Componentes shadcn bem integrados
- ✅ TypeScript com type safety completo
- ✅ Design system consistente

### O que é Mock
- ❌ Chat (vazio, aguardando CopilotKit)
- ❌ Criação de projetos (não persiste)
- ❌ Upload de arquivos
- ❌ Execução de agentes
- ❌ Análises e relatórios

### Decisões de Design

1. **Workspace como contexto global**: Salvo em localStorage, não limpa ao trocar de ferramenta
2. **Sidebar Projetos como link, não expansion**: Evita poluição visual com muitos projetos
3. **Chat layout Claude-inspired**: Melhor UX com histórico acessível
4. **Format relativo de timestamps**: "5 minutos ago" é mais amigável

### Performance
- SWR para caching automático
- Code splitting via Next.js App Router
- Lazy loading de componentes com `React.lazy()`
- Images otimizadas com `next/image`

### Segurança (Implementar Backend)
- Usar RLS no PostgreSQL por workspace/projeto
- JWT tokens com refresh rotation
- CORS configurado corretamente
- Rate limiting na API

### Browser Compatibility
- Modern browsers apenas (Next.js 16 requer Edge Runtime para algumas features)
- Desktop-first (mobile suportado mas não é foco)

---

## Comandos Úteis

```bash
# Desenvolvimento
pnpm dev              # Inicia servidor em http://localhost:3000

# Build
pnpm build           # Build production
pnpm start           # Serve production build

# Linting (quando trocar para Biome)
biome check .        # Check code
biome check . --write # Fix issues

# Testes (depois de instalar)
pnpm test            # Vitest
pnpm test:e2e        # Playwright
```

---

## Resumo Executivo

**Status**: 60% pronto (frontend completo, backend pendente)

**Próximo passo imediato**: Instalar CopilotKit + criar backend com Agno

**Timeline estimada**: 2-3 semanas (com backend competente)

**Risco principal**: Integração CopilotKit + SSE streaming requer testes cuidadosos

**Escalabilidade**: Design é escalável (RLS, workspace isolation, multi-tenant ready)

---

**Documentação criada em v0 | Janeiro 2026**
