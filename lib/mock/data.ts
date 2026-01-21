// SKYLLER Mock Data - Conforme Briefing v2.1

export interface Workspace {
  id: string;
  name: string;
  icon: string;
  projectsCount: number;
  // Novos campos - Workspace agora tem os mesmos recursos de Project
  docsCount: number;
  chatsCount: number;
  description?: string;
  customInstructions?: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  emoji: string;
  docsCount: number;
  chatsCount: number;
  description?: string;
  customInstructions?: string;
}

export interface Conversation {
  id: string;
  projectId: string | null; // null = Chat Solto (sem projeto)
  workspaceId?: string | null; // Conversas no nivel do workspace
  title: string;
  lastMessage: string;
  updatedAt: Date;
  messageCount?: number;
}

export interface Agent {
  id: string;
  name: string;
  icon: string;
  description: string;
  capabilities: string[];
  isDefault?: boolean;
}

export interface Document {
  id: string;
  projectId: string;
  name: string;
  size: number;
  type: "pdf" | "docx" | "txt" | "md" | "xlsx";
  status: "processing" | "indexed" | "error";
  createdAt: Date;
}

export interface KanbanTask {
  id: string;
  title: string;
  description?: string;
  tags: string[];
  assignee?: string;
  dueDate?: string;
  comments: number;
  columnId: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  tasks: KanbanTask[];
}

export interface CanvasCard {
  id: string;
  type: "project" | "entity" | "note" | "chart";
  title: string;
  content: Record<string, unknown>;
  position: { x: number; y: number };
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  agentId?: string;
  artifacts?: Artifact[];
}

export interface Artifact {
  id: string;
  type: "document" | "code" | "chart" | "diagram" | "table";
  title: string;
  content: string;
  language?: string;
  version?: number;
  createdAt?: Date;
}

// Mock Workspaces - Agora com todos os recursos de Project
export const mockWorkspaces: Workspace[] = [
  {
    id: "ws1",
    name: "Desenvolvimento",
    icon: "💻",
    projectsCount: 5,
    docsCount: 23,
    chatsCount: 18,
    description: "Projetos de desenvolvimento de software e tecnologia",
    customInstructions:
      "Voce e um assistente especializado em desenvolvimento de software. Foque em boas praticas, clean code e arquitetura.",
  },
  {
    id: "ws2",
    name: "Clientes",
    icon: "🏢",
    projectsCount: 12,
    docsCount: 45,
    chatsCount: 32,
    description: "Gestao de relacionamento e projetos de clientes",
    customInstructions:
      "Foque em comunicacao profissional, atendimento ao cliente e gestao de expectativas.",
  },
  {
    id: "ws3",
    name: "Administrativo",
    icon: "📋",
    projectsCount: 3,
    docsCount: 15,
    chatsCount: 8,
    description: "Processos administrativos e documentacao interna",
  },
  {
    id: "ws4",
    name: "Marketing",
    icon: "📣",
    projectsCount: 7,
    docsCount: 28,
    chatsCount: 14,
    description: "Campanhas, estrategias de marketing e comunicacao",
    customInstructions:
      "Foque em criatividade, engajamento e metricas de performance.",
  },
  {
    id: "ws5",
    name: "Financeiro",
    icon: "💰",
    projectsCount: 4,
    docsCount: 52,
    chatsCount: 21,
    description: "Controle financeiro, orcamentos e relatorios",
  },
];

// Mock Projects
export const mockProjects: Project[] = [
  {
    id: "p1",
    workspaceId: "ws1",
    name: "Skyller MVP",
    emoji: "🚀",
    docsCount: 12,
    chatsCount: 5,
    description: "Plataforma de IA conversacional",
    customInstructions:
      "Você é um assistente especializado em desenvolvimento de software. Sempre responda com exemplos de código quando relevante.",
  },
  {
    id: "p2",
    workspaceId: "ws1",
    name: "Nexus Core",
    emoji: "⚡",
    docsCount: 8,
    chatsCount: 3,
    description: "Backend e APIs",
  },
  {
    id: "p3",
    workspaceId: "ws1",
    name: "Mobile App",
    emoji: "📱",
    docsCount: 3,
    chatsCount: 2,
  },
  {
    id: "p4",
    workspaceId: "ws2",
    name: "Skills IT",
    emoji: "🏢",
    docsCount: 24,
    chatsCount: 15,
  },
  {
    id: "p5",
    workspaceId: "ws2",
    name: "TechCorp",
    emoji: "🔧",
    docsCount: 18,
    chatsCount: 8,
  },
];

// Mock Conversations - Inclui Chats em Projetos e Chats Soltos
export const mockConversations: Conversation[] = [
  // Chats em Projetos
  {
    id: "c1",
    projectId: "p1",
    title: "Analise Q4 2025",
    lastMessage: "2 min atras",
    updatedAt: new Date(),
    messageCount: 12,
  },
  {
    id: "c2",
    projectId: "p1",
    title: "Codigo auth",
    lastMessage: "15 min atras",
    updatedAt: new Date(Date.now() - 15 * 60000),
    messageCount: 8,
  },
  {
    id: "c3",
    projectId: "p1",
    title: "Arquitetura RAG",
    lastMessage: "1h atras",
    updatedAt: new Date(Date.now() - 60 * 60000),
    messageCount: 24,
  },
  {
    id: "c4",
    projectId: "p1",
    title: "Relatorio de Vendas",
    lastMessage: "2h atras",
    updatedAt: new Date(Date.now() - 120 * 60000),
    messageCount: 6,
  },
  {
    id: "c5",
    projectId: "p2",
    title: "API Design",
    lastMessage: "3h atras",
    updatedAt: new Date(Date.now() - 180 * 60000),
    messageCount: 15,
  },
  {
    id: "c6",
    projectId: "p2",
    title: "Database Schema",
    lastMessage: "5h atras",
    updatedAt: new Date(Date.now() - 300 * 60000),
    messageCount: 9,
  },
  {
    id: "c7",
    projectId: "p3",
    title: "React Native Setup",
    lastMessage: "1d atras",
    updatedAt: new Date(Date.now() - 24 * 60 * 60000),
    messageCount: 18,
  },
  {
    id: "c8",
    projectId: "p4",
    title: "Proposta Comercial",
    lastMessage: "2d atras",
    updatedAt: new Date(Date.now() - 48 * 60 * 60000),
    messageCount: 7,
  },

  // Chats Soltos (projectId = null) - Padrao de mercado (ChatGPT, Claude, Gemini)
  {
    id: "cs1",
    projectId: null,
    title: "Como fazer um bolo de chocolate?",
    lastMessage: "30 min atras",
    updatedAt: new Date(Date.now() - 30 * 60000),
    messageCount: 4,
  },
  {
    id: "cs2",
    projectId: null,
    title: "Explicar quantum computing",
    lastMessage: "1h atras",
    updatedAt: new Date(Date.now() - 60 * 60000),
    messageCount: 8,
  },
  {
    id: "cs3",
    projectId: null,
    title: "Ideias para presente de aniversario",
    lastMessage: "3h atras",
    updatedAt: new Date(Date.now() - 180 * 60000),
    messageCount: 6,
  },
  {
    id: "cs4",
    projectId: null,
    title: "Resumo do livro Sapiens",
    lastMessage: "1d atras",
    updatedAt: new Date(Date.now() - 24 * 60 * 60000),
    messageCount: 12,
  },
  {
    id: "cs5",
    projectId: null,
    title: "Dicas de produtividade",
    lastMessage: "2d atras",
    updatedAt: new Date(Date.now() - 48 * 60 * 60000),
    messageCount: 10,
  },
];

// Mock Workspace Conversations - Conversas no nivel do workspace
export const mockWorkspaceConversations: Conversation[] = [
  {
    id: "wc1",
    projectId: null,
    workspaceId: "ws1",
    title: "Revisao de arquitetura geral",
    lastMessage: "10 min atras",
    updatedAt: new Date(Date.now() - 10 * 60000),
    messageCount: 15,
  },
  {
    id: "wc2",
    projectId: null,
    workspaceId: "ws1",
    title: "Padroes de codigo do time",
    lastMessage: "1h atras",
    updatedAt: new Date(Date.now() - 60 * 60000),
    messageCount: 22,
  },
  {
    id: "wc3",
    projectId: null,
    workspaceId: "ws1",
    title: "Planejamento sprint 15",
    lastMessage: "3h atras",
    updatedAt: new Date(Date.now() - 180 * 60000),
    messageCount: 8,
  },
  {
    id: "wc4",
    projectId: null,
    workspaceId: "ws2",
    title: "Estrategia de onboarding clientes",
    lastMessage: "30 min atras",
    updatedAt: new Date(Date.now() - 30 * 60000),
    messageCount: 12,
  },
  {
    id: "wc5",
    projectId: null,
    workspaceId: "ws2",
    title: "Template de proposta comercial",
    lastMessage: "2h atras",
    updatedAt: new Date(Date.now() - 120 * 60000),
    messageCount: 18,
  },
  {
    id: "wc6",
    projectId: null,
    workspaceId: "ws3",
    title: "Processos de RH",
    lastMessage: "1d atras",
    updatedAt: new Date(Date.now() - 24 * 60 * 60000),
    messageCount: 6,
  },
  {
    id: "wc7",
    projectId: null,
    workspaceId: "ws4",
    title: "Campanha Black Friday 2026",
    lastMessage: "45 min atras",
    updatedAt: new Date(Date.now() - 45 * 60000),
    messageCount: 25,
  },
  {
    id: "wc8",
    projectId: null,
    workspaceId: "ws5",
    title: "Orcamento anual 2026",
    lastMessage: "4h atras",
    updatedAt: new Date(Date.now() - 240 * 60000),
    messageCount: 14,
  },
];

// Helper para filtrar conversas
export const getProjectConversations = (projectId: string) =>
  mockConversations.filter((c) => c.projectId === projectId);

export const getWorkspaceConversations = (workspaceId: string) =>
  mockWorkspaceConversations.filter((c) => c.workspaceId === workspaceId);

export const getWorkspaceProjects = (workspaceId: string) =>
  mockProjects.filter((p) => p.workspaceId === workspaceId);

export const getRecentConversations = (limit = 10) =>
  [...mockConversations]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, limit);

// Mock Agents - Conforme Seção 3.1 do Briefing
export const mockAgents: Agent[] = [
  {
    id: "general",
    name: "Assistente Geral",
    icon: "Bot",
    description:
      "Responde qualquer pergunta, roteia internamente para especialistas quando necessário.",
    capabilities: ["Conversação geral", "Multi-domínio", "Roteamento inteligente"],
    isDefault: true,
  },
  {
    id: "data-analyst",
    name: "Analista de Dados",
    icon: "BarChart3",
    description: "Especializado em análise de dados, criação de gráficos e dashboards.",
    capabilities: ["Pandas", "SQL", "Visualizações", "Estatísticas"],
  },
  {
    id: "financial",
    name: "Especialista Financeiro",
    icon: "DollarSign",
    description: "Relatórios financeiros, projeções, análise de custos e ROI.",
    capabilities: ["Excel/Sheets", "Projeções", "Análise de custos", "ROI"],
  },
  {
    id: "code-assistant",
    name: "Assistente de Código",
    icon: "Code2",
    description: "Programação, debugging, code review e arquitetura de software.",
    capabilities: ["Python", "TypeScript", "Code review", "Arquitetura"],
  },
  {
    id: "doc-analyst",
    name: "Analista de Documentos",
    icon: "FileText",
    description: "Resumos, extração de insights, comparações de documentos.",
    capabilities: ["PDF", "DOCX", "MD", "RAG/DocsRAG", "Sumarização"],
  },
  {
    id: "web-researcher",
    name: "Pesquisador Web",
    icon: "Search",
    description: "Pesquisas na web, citações, fact-checking.",
    capabilities: ["Tavily API", "Citações", "Verificação de fatos"],
  },
  {
    id: "legal",
    name: "Assistente Jurídico",
    icon: "Scale",
    description: "Análise de contratos, compliance, questões legais.",
    capabilities: ["Contratos", "Compliance", "LGPD", "Cláusulas"],
  },
  {
    id: "creative",
    name: "Criativo",
    icon: "Palette",
    description: "Redação, copywriting, brainstorming criativo.",
    capabilities: ["Copywriting", "Brainstorming", "Storytelling"],
  },
];

// Mock Documents
export const mockDocuments: Document[] = [
  {
    id: "d1",
    projectId: "p1",
    name: "arquitetura.md",
    size: 45000,
    type: "md",
    status: "indexed",
    createdAt: new Date(),
  },
  {
    id: "d2",
    projectId: "p1",
    name: "roadmap-2026.pdf",
    size: 2400000,
    type: "pdf",
    status: "indexed",
    createdAt: new Date(),
  },
  {
    id: "d3",
    projectId: "p1",
    name: "requisitos-v2.docx",
    size: 890000,
    type: "docx",
    status: "processing",
    createdAt: new Date(),
  },
  {
    id: "d4",
    projectId: "p1",
    name: "api-reference.md",
    size: 120000,
    type: "md",
    status: "indexed",
    createdAt: new Date(),
  },
  {
    id: "d5",
    projectId: "p1",
    name: "briefing-ui.md",
    size: 85000,
    type: "md",
    status: "indexed",
    createdAt: new Date(),
  },
  {
    id: "d6",
    projectId: "p1",
    name: "contrato-cliente.pdf",
    size: 1500000,
    type: "pdf",
    status: "indexed",
    createdAt: new Date(),
  },
  {
    id: "d7",
    projectId: "p1",
    name: "metricas-q4.xlsx",
    size: 340000,
    type: "xlsx",
    status: "indexed",
    createdAt: new Date(),
  },
  {
    id: "d8",
    projectId: "p1",
    name: "deploy-guide.txt",
    size: 15000,
    type: "txt",
    status: "indexed",
    createdAt: new Date(),
  },
  {
    id: "d9",
    projectId: "p1",
    name: "error-logs.txt",
    size: 8000,
    type: "txt",
    status: "error",
    createdAt: new Date(),
  },
  {
    id: "d10",
    projectId: "p1",
    name: "database-schema.md",
    size: 32000,
    type: "md",
    status: "indexed",
    createdAt: new Date(),
  },
  {
    id: "d11",
    projectId: "p1",
    name: "user-stories.docx",
    size: 560000,
    type: "docx",
    status: "indexed",
    createdAt: new Date(),
  },
  {
    id: "d12",
    projectId: "p1",
    name: "security-audit.pdf",
    size: 3200000,
    type: "pdf",
    status: "indexed",
    createdAt: new Date(),
  },
];

// Mock Kanban Columns
export const mockKanbanColumns: KanbanColumn[] = [
  {
    id: "backlog",
    title: "BACKLOG",
    tasks: [
      {
        id: "t1",
        title: "Auth API",
        description: "Implementar Keycloak com NextAuth para SSO corporativo",
        tags: ["feat", "backend"],
        assignee: "João",
        dueDate: "Jan 20",
        comments: 3,
        columnId: "backlog",
      },
      {
        id: "t2",
        title: "Upload UI",
        description: "Criar interface de upload com drag-and-drop",
        tags: ["feat", "frontend"],
        assignee: "Maria",
        dueDate: "Jan 22",
        comments: 1,
        columnId: "backlog",
      },
      {
        id: "t3",
        title: "Rate Limiting",
        description: "Implementar rate limiting no LiteLLM gateway",
        tags: ["infra"],
        assignee: "Pedro",
        dueDate: "Jan 25",
        comments: 0,
        columnId: "backlog",
      },
      {
        id: "t4",
        title: "Multi-tenant RLS",
        description: "Configurar Row Level Security no PostgreSQL",
        tags: ["security", "backend"],
        assignee: "Ana",
        dueDate: "Jan 28",
        comments: 5,
        columnId: "backlog",
      },
      {
        id: "t5",
        title: "Mobile Responsive",
        description: "Ajustar layout para dispositivos móveis",
        tags: ["frontend"],
        assignee: "Lucas",
        dueDate: "Feb 1",
        comments: 2,
        columnId: "backlog",
      },
    ],
  },
  {
    id: "doing",
    title: "DOING",
    tasks: [
      {
        id: "t6",
        title: "DocsRAG Integration",
        description: "Integrar Weaviate para busca semântica de documentos",
        tags: ["feat", "ai"],
        assignee: "Maria",
        dueDate: "Jan 18",
        comments: 8,
        columnId: "doing",
      },
      {
        id: "t7",
        title: "Artifacts Panel",
        description: "Implementar painel lateral para documentos gerados",
        tags: ["feat", "frontend"],
        assignee: "João",
        dueDate: "Jan 19",
        comments: 4,
        columnId: "doing",
      },
      {
        id: "t8",
        title: "AG-UI Protocol",
        description: "Configurar streaming SSE com CopilotKit",
        tags: ["feat", "backend"],
        assignee: "Pedro",
        dueDate: "Jan 20",
        comments: 6,
        columnId: "doing",
      },
    ],
  },
  {
    id: "review",
    title: "REVIEW",
    tasks: [
      {
        id: "t9",
        title: "Kanban UI",
        description: "Interface do quadro Kanban com drag-and-drop",
        tags: ["feat", "frontend"],
        assignee: "Lucas",
        dueDate: "Jan 16",
        comments: 12,
        columnId: "review",
      },
      {
        id: "t10",
        title: "Agent Router",
        description: "SemanticRouter para roteamento automático de agentes",
        tags: ["feat", "ai"],
        assignee: "Ana",
        dueDate: "Jan 17",
        comments: 7,
        columnId: "review",
      },
    ],
  },
  {
    id: "done",
    title: "DONE",
    tasks: [
      {
        id: "t11",
        title: "Login Page",
        description: "Página de login split-screen",
        tags: ["done"],
        assignee: "Maria",
        comments: 3,
        columnId: "done",
      },
      {
        id: "t12",
        title: "Sidebar Navigation",
        description: "Sidebar colapsável com projetos",
        tags: ["done"],
        assignee: "João",
        comments: 5,
        columnId: "done",
      },
      {
        id: "t13",
        title: "Chat UI Base",
        description: "Interface base do chat conversacional",
        tags: ["done"],
        assignee: "Lucas",
        comments: 4,
        columnId: "done",
      },
      {
        id: "t14",
        title: "Design System",
        description: "Configuração do Tailwind v4 + shadcn/ui",
        tags: ["done"],
        assignee: "Pedro",
        comments: 2,
        columnId: "done",
      },
      {
        id: "t15",
        title: "Project Setup",
        description: "Next.js 16 + TypeScript + Biome",
        tags: ["done"],
        assignee: "Ana",
        comments: 1,
        columnId: "done",
      },
      {
        id: "t16",
        title: "Workspace Selector",
        description: "Dropdown de seleção de workspace",
        tags: ["done"],
        assignee: "Maria",
        comments: 2,
        columnId: "done",
      },
      {
        id: "t17",
        title: "Knowledge Base UI",
        description: "Interface de upload de documentos",
        tags: ["done"],
        assignee: "João",
        comments: 6,
        columnId: "done",
      },
      {
        id: "t18",
        title: "TanStack Table Setup",
        description: "Configuração de tabelas com sorting e filtering",
        tags: ["done"],
        assignee: "Lucas",
        comments: 3,
        columnId: "done",
      },
    ],
  },
];

// Mock Canvas Cards
export const mockCanvasCards: CanvasCard[] = [
  {
    id: "card1",
    type: "project",
    title: "Q4 Goals",
    content: {
      status: "Active",
      dueDate: "Dec 31",
      checklist: [
        { id: "c1", text: "Define scope", checked: true },
        { id: "c2", text: "Assign team", checked: false },
        { id: "c3", text: "Set budget", checked: false },
      ],
    },
    position: { x: 0, y: 0 },
  },
  {
    id: "card2",
    type: "entity",
    title: "Skills IT",
    content: {
      type: "Client",
      tags: ["enterprise", "priority"],
    },
    position: { x: 1, y: 0 },
  },
  {
    id: "card3",
    type: "chart",
    title: "Sales Metrics",
    content: {
      metrics: [
        { label: "Q1", value: 80 },
        { label: "Q2", value: 60 },
        { label: "Q3", value: 40 },
      ],
    },
    position: { x: 2, y: 0 },
  },
  {
    id: "card4",
    type: "note",
    title: "Meeting Notes",
    content: {
      text: "Meeting notes from kickoff...\n\nRich text with **formatting** and bullet points.",
    },
    position: { x: 0, y: 1 },
  },
];

// Mock Messages
export const mockMessages: Message[] = [
  {
    id: "m1",
    role: "user",
    content: "Crie um relatório de vendas do Q4 2025 com gráficos e análise por região.",
    timestamp: new Date(Date.now() - 5 * 60000),
  },
  {
    id: "m2",
    role: "assistant",
    content:
      "Vou criar o relatório de vendas. Analisando os dados do Q4 2025...\n\nO relatório está pronto! Inclui análise por região, gráficos comparativos e recomendações estratégicas.",
    timestamp: new Date(Date.now() - 4 * 60000),
    agentId: "data-analyst",
    artifacts: [
      {
        id: "a1",
        type: "document",
        title: "Relatório de Vendas Q4 2025",
        content: `# Relatório de Vendas Q4 2025

## Resumo Executivo

As vendas do Q4 2025 atingiram **R$ 4.2 milhões**, representando um crescimento de **15%** YoY.

## Análise por Região

| Região | Vendas | Δ% |
|--------|--------|-----|
| Norte | R$ 1.2M | +15% |
| Sul | R$ 980K | +8% |
| Sudeste | R$ 1.5M | +22% |
| Centro | R$ 520K | +5% |

## Recomendações

1. Investir mais no Sudeste
2. Revisar estratégia Centro-Oeste
3. Expandir equipe Norte`,
      },
    ],
  },
  {
    id: "m3",
    role: "user",
    content: "Agora analise o contrato do cliente Skills IT e identifique cláusulas de risco.",
    timestamp: new Date(Date.now() - 3 * 60000),
  },
  {
    id: "m4",
    role: "assistant",
    content:
      "Analisando o contrato da Skills IT...\n\nIdentifiquei 3 cláusulas que merecem atenção especial:\n\n1. **Cláusula 5.2** - Multa rescisória de 30%\n2. **Cláusula 8.1** - Renovação automática sem aviso prévio\n3. **Cláusula 12.3** - Exclusividade territorial limitada\n\nRecomendo revisar especialmente a cláusula de renovação automática.",
    timestamp: new Date(Date.now() - 2 * 60000),
    agentId: "doc-analyst",
  },
];

// Conversation Suggestions for New Chat
export const conversationSuggestions = [
  {
    id: "s1",
    title: "Crie uma estrategia de marketing para Q1",
    icon: "TrendingUp",
    agentId: "data-analyst",
  },
  {
    id: "s2",
    title: "Analise os documentos da minha base de conhecimento",
    icon: "FileSearch",
    agentId: "doc-analyst",
  },
  {
    id: "s3",
    title: "Escreva codigo para uma nova feature",
    icon: "Code2",
    agentId: "code-assistant",
  },
  {
    id: "s4",
    title: "Resuma as atualizacoes recentes do projeto",
    icon: "FileText",
    agentId: "general",
  },
];

// Utility functions
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

export function getDocumentIcon(type: Document["type"]): string {
  const icons: Record<Document["type"], string> = {
    pdf: "PDF",
    docx: "DOC",
    txt: "TXT",
    md: "MD",
    xlsx: "XLS",
  };
  return icons[type] || "FILE";
}

export function getDocumentIconColor(type: Document["type"]): string {
  const colors: Record<Document["type"], string> = {
    pdf: "bg-red-500/10 text-red-600 border-red-200",
    docx: "bg-blue-500/10 text-blue-600 border-blue-200",
    txt: "bg-gray-500/10 text-gray-600 border-gray-200",
    md: "bg-purple-500/10 text-purple-600 border-purple-200",
    xlsx: "bg-green-500/10 text-green-600 border-green-200",
  };
  return colors[type] || "bg-gray-500/10 text-gray-600 border-gray-200";
}

export function getStatusColor(
  status: Document["status"]
): "default" | "secondary" | "destructive" {
  const colors: Record<Document["status"], "default" | "secondary" | "destructive"> = {
    processing: "secondary",
    indexed: "default",
    error: "destructive",
  };
  return colors[status];
}

export function getStatusIcon(status: Document["status"]): string {
  const icons: Record<Document["status"], string> = {
    processing: "⏳",
    indexed: "✅",
    error: "❌",
  };
  return icons[status];
}
