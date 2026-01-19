# Skyller - Multi-Agent Chat Platform

Interface de chat multi-agente conectada ao **Nexus Core** via **AG-UI Protocol**.

## Features

- **AG-UI Protocol** - Streaming bidirecional com Nexus Core (Agno)
- **CopilotKit Integration** - Real-time streaming e orquestração
- **Dark Brutalist Design** - Interface moderna com tema escuro
- **Multi-Tenant Ready** - Preparado para múltiplos tenants via Keycloak
- **Collapsible Sidebar** - Gestão de projetos e configurações

## Tech Stack

- **Next.js 16.1.2** (App Router, React 19.2.3)
- **CopilotKit** - AG-UI Protocol implementation
- **TypeScript 5.9** - Full type safety
- **Tailwind CSS v4** - Styling with design tokens
- **shadcn/ui** - UI component library
- **Lucide Icons** - Icon system

## Ferramentas de Desenvolvimento

- **pnpm** - Package manager
- **Biome** - Linter + Formatter (substitui ESLint)
- **Lefthook** - Git hooks
- **Vitest** - Testes unitários
- **Playwright** - Testes E2E

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm instalado
- Nexus Core rodando em localhost:8000

### Installation

1. Instalar dependências:
   ```bash
   pnpm install
   ```

2. Copiar variáveis de ambiente:
   ```bash
   cp env.sample .env.local
   ```

3. Rodar servidor de desenvolvimento:
   ```bash
   pnpm dev
   ```

4. Acessar [http://localhost:3004](http://localhost:3004)

## Portas do Ambiente

| Serviço | Porta |
|---------|-------|
| **Skyller** | 3004 |
| Nexus Core | 8000 |
| MCPHub | 3000 |
| Agent-UI (Agno Playground) | 3001 |
| LibreChat | 3080 |

## Arquitetura

```
┌─────────────────┐     AG-UI Protocol     ┌─────────────────┐
│   Skyller       │ ◄──────────────────────► │   Nexus Core    │
│  (Next.js)      │      SSE Streaming      │    (Agno)       │
│  Port: 3004     │                         │   Port: 8000    │
└─────────────────┘                         └─────────────────┘
```

## Documentação

- [SPEC-SKYLLER-ADMIN-001.md](../_shared/docs/02-SKYLLER/SPEC-SKYLLER-ADMIN-001.md) - Especificação do Admin
- [SKYLLER-FEATURES-SPEC.md](../_shared/docs/02-SKYLLER/SKYLLER-FEATURES-SPEC.md) - Features completas
