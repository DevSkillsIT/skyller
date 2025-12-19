# Skyller - Frontend Agnóstico do Skills AI Nexus

Frontend moderno e agnóstico baseado no AG-UI Protocol com suporte a CopilotKit, NextAuth e integração multi-tenant.

## 🎯 Visão Geral

O **Skyller** é o frontend oficial do **Skills AI Nexus**, fornecendo uma interface conversacional para interação com agentes AI através do **AG-UI Protocol**. Principais características:

- ✅ **AG-UI Protocol** - Comunicação padronizada com backends de agentes
- 🎨 **UI Moderna** - Interface limpa com suporte a tema dark/light
- 🔐 **Autenticação** - NextAuth 5 + Keycloak para multi-tenancy
- 💬 **CopilotKit** - Componentes de chat e HITL (Human-in-the-Loop)
- 📱 **Responsivo** - Design mobile-first com Tailwind CSS
- 🚀 **Next.js 16** - Server Components e App Router

## 📋 Origem do Projeto

Este projeto foi extraído do [AG-UI Protocol Dojo](https://github.com/ag-ui-protocol/ag-ui) e adaptado para funcionar como aplicação standalone no ecossistema **Skills AI Nexus**.

**Remote Upstream:** `https://github.com/ag-ui-protocol/ag-ui.git`

## 🏗️ Stack Tecnológica

| Tecnologia | Versão | Função |
|------------|--------|--------|
| **Next.js** | 16.0.7 | Framework React com SSR |
| **React** | 19.2.1 | Biblioteca UI |
| **TypeScript** | 5.x | Type Safety |
| **Tailwind CSS** | 4.x | Estilização |
| **CopilotKit** | 1.50.0 | Componentes de chat e agentes |
| **NextAuth** | 5.0.0-beta.30 | Autenticação |
| **Keycloak-JS** | 26.2.2 | Cliente Keycloak |

## 🚀 Setup de Desenvolvimento

### Pré-requisitos

```bash
# Instalar pnpm (se ainda não tiver)
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

### Instalação

```bash
# Instalar dependências
pnpm install

# Executar em modo desenvolvimento
pnpm dev

# Build para produção
pnpm build

# Iniciar versão de produção
pnpm start
```

O projeto estará disponível em [http://localhost:3000](http://localhost:3000).

## 📁 Estrutura do Projeto

```
skyller/
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/
│   │   ├── chat/         # Componentes de chat (Phase 2)
│   │   ├── hitl/         # Human-in-the-Loop (Phase 2)
│   │   ├── ui/           # Componentes UI base
│   │   └── ...
│   ├── hooks/            # React Hooks customizados
│   ├── lib/
│   │   ├── auth/         # Configuração NextAuth (Phase 2)
│   │   └── utils.ts
│   ├── types/            # TypeScript types
│   └── utils/            # Funções utilitárias
├── public/               # Assets estáticos
└── package.json
```

## 🔧 Próximos Passos (Roadmap)

### ✅ Phase 1: Setup (Concluída)
- [x] Extrair AG-UI Dojo do monorepo
- [x] Configurar como projeto standalone
- [x] Instalar dependências (CopilotKit, NextAuth, Keycloak)
- [x] Criar estrutura de diretórios

### 🚧 Phase 2: Authentication (Próxima)
- [ ] Configurar NextAuth com Keycloak
- [ ] Implementar middleware de autenticação
- [ ] Criar componentes de login/logout

### 🔜 Phase 3: Chat Interface
- [ ] Implementar componentes de chat com CopilotKit
- [ ] Integrar AG-UI Protocol streaming
- [ ] Adicionar suporte HITL

### 🔜 Phase 4: Multi-Tenancy
- [ ] Integrar tenant_id nos headers
- [ ] Configurar roteamento por tenant
- [ ] Implementar isolamento de dados

## 🤝 Integração com Nexus Core

O Skyller se conecta ao **Nexus Core** (backend) através do **AG-UI Protocol**:

```
Skyller (Frontend)  →  AG-UI Protocol  →  Nexus Core (Agno/LiteLLM)
```

## 📚 Documentação

- [AG-UI Protocol](https://github.com/ag-ui-protocol/ag-ui)
- [CopilotKit](https://docs.copilotkit.ai/)
- [NextAuth.js](https://authjs.dev/)
- [Skills AI Nexus - CLAUDE.md](../CLAUDE.md)

## 📝 Licença

Este projeto mantém a licença original do AG-UI Protocol Dojo.

---

**Skills IT Soluções em Tecnologia** | Skills AI Nexus | Dezembro 2025
