# 🚀 Ferramentas de Referência - Projeto Skyller

> Catálogo de plataformas e frameworks que servem como referência para desenvolvimento da Skyller.
> Foco em Chat UI, RAG (Retrieval Augmented Generation), ToolRAG, Workspaces e Enterprise Search.

---

## 📑 Índice

- [Open Source & Self-Hosted](#-open-source--self-hosted)
- [SaaS & Enterprise Search](#-saas--enterprise-search)
- [Low-Code & Orchestration](#-low-code--orchestration)
- [Desktop & Minimalistas](#-desktop--minimalistas)
- [UIs Avançadas (TypingMind-like)](#-uis-avançadas-typingmind-like)
- [Workplace Search (Glean-like)](#-workplace-search-glean-like)
- [Chat com Documentos (DocsRAG)](#-chat-com-documentos-docsrag)
- [Plataformas/Builders (ToolRAG + Workflows)](#-plataformasbuilders-toolrag--workflows)
- [RAG Engines](#-rag-engines)
- [Foundations (Componentes Core)](#-foundations-componentes-core)
- [Referência Arquitetural](#-referência-arquitetural)

---

## 🛠️ Open Source & Self-Hosted

### LibreChat
**Descrição:** Clone open-source mais fiel ao ChatGPT Plus. Multiplataforma e agnóstico de modelo (suporta OpenAI, Anthropic, Azure, Groq, Vertex AI, Gemini e mais).

**Diferenciais:**
- Interface UX extremamente polida e familiar
- Sistema de Plugins/Actions (OpenAPI) para ToolRAG customizado
- Suporta Agents, MCP, Code Interpreter, DALL-E-3, Function Calling
- Autenticação multi-usuário segura com controle de permissões
- Busca em mensagens, presets e histórico completo
- **Privacidade total**: dados sob seu controle, self-hosted

**Stack:** React, Node.js, MongoDB
**Licença:** MIT
**GitHub:** [danny-avila/LibreChat](https://github.com/danny-avila/LibreChat)

**Casos de Uso para Skyller:**
- Referência para UX/UI de chat moderno
- Sistema de plugins e function calling
- Arquitetura multi-provider

**Referências:**
- [LibreChat Official](https://www.librechat.ai/about)
- [GitHub Repository](https://github.com/danny-avila/LibreChat)

---

### Open WebUI
**Descrição:** Interface rica em Docker para gerenciamento de modelos locais (Ollama) e remotos. Backend-agnostic (Ollama, OpenAI, vLLM, LocalAI, LM Studio).

**Diferenciais:**
- **RAG nativo fluido**: upload de PDF no chat → vetorização automática via ChromaDB
- Suporta 9 vector databases (ChromaDB, PostgreSQL/PGVector, Qdrant, Milvus, Elasticsearch, Pinecone, etc.)
- Web Search RAG com 15+ provedores (SearXNG, Google, Brave, Kagi, Tavily, Perplexity, etc.)
- Function Calling e Tools direto no frontend
- Multi-usuário com autenticação e voice capabilities
- **Context length otimizado**: 8192+ tokens (crítico para RAG efetivo)

**Stack:** Svelte, Python, ChromaDB
**Licença:** MIT
**GitHub:** [open-webui/open-webui](https://github.com/open-webui/open-webui)

**Casos de Uso para Skyller:**
- Inspiração para sistema de RAG "plug and play"
- Arquitetura de vector database modular
- Integração de web search em RAG

**Referências:**
- [Open WebUI Documentation](https://docs.openwebui.com/)
- [RAG Features](https://docs.openwebui.com/features/rag/)

---

### Dify.ai
**Descrição:** Plataforma LLMOps que combina chat com construção de workflows agentic. Líder em desenvolvimento de aplicações GenAI.

**Diferenciais:**
- **Rei do ToolRAG**: criação visual de Apps com fluxo completo (Input → Retrieval → Tool X → LLM → Output)
- Workflow Builder visual para agentes e RAG pipelines
- Knowledge Base UI excelente para DocsRAG (upload, vetorização, chunking configurável)
- Observabilidade e LLMOps integrados (logs, métricas, prompt management)
- 50+ ferramentas built-in para agentes (Google Search, DALL-E, Stable Diffusion, WolframAlpha)
- Suporte a Function Calling e ReAct agents

**Stack:** Python, PostgreSQL, React
**Licença:** Apache 2.0
**GitHub:** [langgenius/dify](https://github.com/langgenius/dify)

**Casos de Uso para Skyller:**
- **Referência obrigatória** para ToolRAG e workflows
- Sistema de Knowledge Base e pré-processamento de documentos
- Arquitetura de agentes e observabilidade

**Referências:**
- [Dify.ai Platform](https://dify.ai/)
- [Dify Blog - LLMOps](https://dify.ai/blog/open-source-llmops-platform-define-your-ai-native-apps)

---

### AnythingLLM
**Descrição:** Solução Full-stack para RAG que roda em executável standalone ou Docker. Foco em privacidade e simplicidade.

**Diferenciais:**
- **Conceito de Workspaces**: cada chat tem contexto vetorial isolado
- Multi-departamentos com documentos segregados por workspace
- Interface desktop nativa (Windows, macOS, Linux)
- Suporte a múltiplos LLM providers e vector databases
- Sistema de permissões multi-usuário

**Stack:** React, Node.js, LanceDB/Pinecone/ChromaDB
**Licença:** MIT

**Casos de Uso para Skyller:**
- Sistema de Workspaces isolados (referência arquitetural)
- Gerenciamento de contexto por departamento/projeto

---

### FastGPT
**Descrição:** Plataforma focada em construção de Knowledge Bases com tratamento avançado de dados para RAG.

**Diferenciais:**
- **Pré-processamento visual de dados**: limpeza e formatação de texto ANTES da vetorização
- Pipeline de ETL configurável para documentos
- Workflow de transformação de dados em canvas visual

**Stack:** Next.js, MongoDB, PostgreSQL
**Licença:** Apache 2.0

**Casos de Uso para Skyller:**
- Inspiração para ETL de documentos pré-RAG
- Tratamento de qualidade de dados

---

### Lobe Chat
**Descrição:** Framework de chat com foco em alta UI/UX, plugins modulares e experiência mobile-first.

**Diferenciais:**
- Design system moderno (uma das UIs mais bonitas do mercado)
- Arquitetura de Plugins (Function Calling) extremamente modular
- TTS (Text-to-Speech) nativo integrado
- PWA com suporte offline
- Multi-provider com gestão de API keys visual

**Stack:** Next.js, React, Zustand
**Licença:** MIT
**GitHub:** [lobehub/lobe-chat](https://github.com/lobehub/lobe-chat)

**Casos de Uso para Skyller:**
- Referência para design system e componentes UI
- Sistema de plugins modular

---

## 🏢 SaaS & Enterprise Search

### Glean
**Descrição:** "Google para empresas". Motor de busca empresarial com IA conectado a 100+ fontes de dados corporativos.

**Diferenciais:**
- **Governança de Permissões (ACL)**: respeita permissões da fonte (se usuário não tem acesso no Drive, IA não usa o doc)
- Conectores para Slack, Jira, Confluence, Drive, SharePoint, Salesforce, etc.
- Glean Agents (IA agentic) com projeção de 1 bilhão de ações até fim de 2026
- Busca unificada com resultados permission-aware
- ARR de $200M+ em 2025, valoração de $7B+

**Casos de Uso para Skyller:**
- **Referência crítica** para governança e permissões em RAG corporativo
- Sistema de conectores multi-fonte
- Arquitetura de busca empresarial

**Referências:**
- [Glean Platform](https://www.glean.com/)
- [Enterprise Search Guide 2025](https://www.glean.com/blog/the-definitive-guide-to-ai-based-enterprise-search-for-2025)

---

### TypingMind
**Descrição:** Interface web estática para ChatGPT (BYOK - Bring Your Own Key). Custo zero de infraestrutura.

**Diferenciais:**
- Execução 100% no browser do cliente (sem servidor)
- **Prompt Library** com variáveis e templates customizáveis
- Ideal para usuários não-técnicos com UX simplificada
- Suporte multi-provider com gestão de API keys local

**Casos de Uso para Skyller:**
- Sistema de Prompt Templates com variáveis
- UX para gerenciamento de prompts

---

### Perplexity.ai
**Descrição:** Motor de busca conversacional com IA. Referência em apresentação de fontes e citações.

**Diferenciais:**
- **Padrão ouro de citações**: números clicáveis que abrem modal da fonte
- UI de credibilidade com rastreamento de fontes em tempo real
- Busca na web integrada ao contexto conversacional

**Casos de Uso para Skyller:**
- **Referência obrigatória** para UI de citações em DocsRAG
- Sistema de fontes e credibilidade

---

### Jasper
**Descrição:** Copiloto de IA para criação de conteúdo empresarial (marketing, copywriting).

**Diferenciais:**
- **Brand Voice**: capacidade de ingerir documentos para "aprender o estilo de escrita" da empresa
- RAG não só para responder perguntas, mas para replicar tom e voz da marca
- Templates de conteúdo especializados

**Casos de Uso para Skyller:**
- Conceito de "Brand Voice" aplicado a DocsRAG
- Personalização de estilo de resposta por workspace

---

## 🧩 Low-Code & Orchestration

### Flowise
**Descrição:** Interface drag-and-drop visual para LangChain. Construção de pipelines RAG sem código.

**Diferenciais:**
- Visualização do fluxo RAG (Splitter → Embeddings → Vector Store → Retrieval)
- Exportação de fluxos como JSON/código
- Tracing e analytics integrados
- Human-in-the-loop workflows

**Stack:** Node.js, LangChain, React
**Licença:** Apache 2.0

**Casos de Uso para Skyller:**
- Compreensão visual de pipelines RAG
- Debug de cadeias de retrieval

---

### LangFlow
**Descrição:** Similar ao Flowise, mas nativo em Python e focado em LangChain/LangGraph.

**Diferenciais:**
- Exportação direta para código Python
- Suporte a Agents e MCP (Model Context Protocol)
- Editor visual com deploy API automático

**Stack:** Python, LangChain, React
**Licença:** MIT

**Casos de Uso para Skyller:**
- Prototipagem rápida de workflows
- Integração com backend Python

---

### Chainlit
**Descrição:** Biblioteca Python para criar UIs de chat em minutos (estilo Streamlit para Chat).

**Diferenciais:**
- **Data Layer**: mostra passo-a-passo do pensamento da IA (Chain of Thought) em sidebar
- Debug visual de ToolRAG e agentes
- Deploy rápido de protótipos conversacionais

**Stack:** Python, FastAPI, React
**Licença:** Apache 2.0

**Casos de Uso para Skyller:**
- Debug de cadeias de raciocínio
- Prototipagem de interfaces conversacionais

---

## 💻 Desktop & Minimalistas

### Jan.ai
**Descrição:** Alternativa open-source ao LM Studio. Assistente de chat 100% offline.

**Diferenciais:**
- Execução local completa (sem necessidade de internet)
- Sistema de Extensões para trocar motor de inferência (llama.cpp, TensorRT)
- Interface desktop nativa

**Licença:** AGPLv3

**Casos de Uso para Skyller:**
- Referência para modo offline
- Arquitetura de extensões

---

### Chatbox
**Descrição:** App desktop minimalista para múltiplas APIs de IA.

**Diferenciais:**
- Foco total em produtividade pessoal
- Armazenamento local em JSON/Markdown (sem banco complexo)
- Cliente Windows/macOS/Linux leve

**Licença:** GPL-3.0

**Casos de Uso para Skyller:**
- Simplicidade arquitetural
- Storage local sem complexidade

---

## 🎨 UIs Avançadas (TypingMind-like)

### NextChat / ChatGPT-Next-Web
**Descrição:** Cliente ChatGPT leve e rápido com PWA.

**Diferenciais:**
- Progressive Web App (funciona offline)
- Dados locais no browser
- Deploy extremamente rápido (Vercel one-click)

**GitHub:** [ChatGPT-Next-Web](https://github.com/ChatGPTNextWeb/ChatGPT-Next-Web)

---

## 🏢 Workplace Search (Glean-like)

### Dust
**Descrição:** Plataforma para agentes corporativos com conectores empresariais.

**Diferenciais:**
- Conectar conhecimento + ferramentas em workflows agentic
- Integração via MCP para tools
- Foco em automação empresarial

---

## 📚 Chat com Documentos (DocsRAG)

### Khoj
**Descrição:** "AI Second Brain". Busca e chat em documentos pessoais e web.

**Diferenciais:**
- Busca unificada em docs locais + web
- Sistema de agentes e automações
- Indexação incremental

**Licença:** AGPLv3

---

### Quivr
**Descrição:** "Second Brain" com abordagem opinionated para RAG.

**Diferenciais:**
- Integração GenAI simplificada
- Foco em produtividade pessoal
- Multi-modal RAG (texto, áudio, vídeo)

**Licença:** Apache 2.0

---

### PrivateGPT
**Descrição:** Chat privado com documentos, 100% offline.

**Diferenciais:**
- Privacidade total (sem envio de dados externos)
- Execução em ambiente isolado
- Ideal para dados sensíveis

**Licença:** Apache 2.0

---

### Open Paper
**Descrição:** Workbench para leitura e análise de papers acadêmicos.

**Diferenciais:**
- Assistente especializado em pesquisa científica
- Organização e anotações de papers
- RAG focado em contexto acadêmico

---

## 🏗️ Plataformas/Builders (ToolRAG + Workflows)

### Dify
> Já detalhado na seção "Open Source & Self-Hosted"

---

### Flowise
> Já detalhado na seção "Low-Code & Orchestration"

---

### Langflow
> Já detalhado na seção "Low-Code & Orchestration"

---

## ⚙️ RAG Engines

### RAGFlow
**Descrição:** Engine RAG com foco em "deep document understanding".

**Diferenciais:**
- Q&A com citações e fundamentação (source tracking)
- Chunking inteligente com preservação de contexto
- Multi-modal retrieval

**Licença:** Apache 2.0

---

### RAG-Anything
**Descrição:** Framework RAG multimodal (research-oriented).

**Diferenciais:**
- Retrieval de texto + imagens + áudio em pipeline unificado
- Embeddings multimodais (CLIP, ImageBind)

---

## 🔧 Foundations (Componentes Core)

### Haystack
**Descrição:** Framework end-to-end para RAG, document search e QA.

**Diferenciais:**
- Pipelines modulares e componíveis
- Suporte a múltiplos LLMs e vector stores
- Integração com 30+ fontes de dados

**Stack:** Python
**Licença:** Apache 2.0

**Casos de Uso para Skyller:**
- Biblioteca de componentes RAG reutilizáveis
- Pipelines de processamento de documentos

---

### LlamaIndex
**Descrição:** "Data Framework" para conectar dados a LLMs.

**Diferenciais:**
- 160+ conectores de dados (APIs, DBs, arquivos)
- Estruturas de indexação otimizadas (tree, graph, vector)
- Interface de retrieval flexível

**Stack:** Python, TypeScript
**Licença:** MIT

**Casos de Uso para Skyller:**
- Sistema de conectores extensível
- Estratégias de indexação e retrieval

---

### Langfuse
**Descrição:** LLM engineering com observabilidade e prompt management.

**Diferenciais:**
- **Prompt Management** com versionamento e cache
- Tracing completo de execuções LLM
- Analytics e custos por prompt
- Ideal para "vault de prompts" em produção

**Stack:** Next.js, PostgreSQL, Prisma
**Licença:** MIT

**Casos de Uso para Skyller:**
- Sistema de gestão de prompts versionados
- Observabilidade de LLM calls
- Tracking de custos e performance

---

## 🎯 Referência Arquitetural

### Hugging Face Chat UI (chat-ui)
**Descrição:** Código que roda o HuggingChat oficial.

**Diferenciais:**
- Construído em **SvelteKit** (alternativa ao React/Next.js)
- MongoDB como storage
- Performance otimizada para SSR

**Stack:** SvelteKit, MongoDB, TailwindCSS
**Licença:** Apache 2.0
**GitHub:** [huggingface/chat-ui](https://github.com/huggingface/chat-ui)

**Casos de Uso para Skyller:**
- Referência de arquitetura não-React
- Performance patterns em Svelte

---

## 📊 Matriz de Comparação Rápida

| Ferramenta | Tipo | RAG | ToolRAG | Workspaces | Self-Host | Licença |
|-----------|------|-----|---------|------------|-----------|---------|
| **LibreChat** | Chat UI | ✅ | ✅ (Plugins) | ✅ | ✅ | MIT |
| **Open WebUI** | Chat UI | ✅✅ | ✅ | ✅ | ✅ | MIT |
| **Dify.ai** | Platform | ✅✅ | ✅✅✅ | ✅ | ✅ | Apache 2.0 |
| **AnythingLLM** | Chat+RAG | ✅✅ | ⚠️ | ✅✅✅ | ✅ | MIT |
| **Lobe Chat** | Chat UI | ✅ | ✅✅ | ✅ | ✅ | MIT |
| **Glean** | Enterprise | ✅✅✅ | ✅✅ | ✅✅ | ❌ (SaaS) | Proprietária |
| **Flowise** | Builder | ✅✅ | ✅✅ | ⚠️ | ✅ | Apache 2.0 |
| **Langflow** | Builder | ✅✅ | ✅✅ | ⚠️ | ✅ | MIT |
| **LlamaIndex** | Library | ✅✅✅ | ⚠️ | ❌ | ✅ | MIT |
| **Haystack** | Library | ✅✅✅ | ⚠️ | ❌ | ✅ | Apache 2.0 |

**Legenda:**
✅✅✅ = Excelente | ✅✅ = Muito Bom | ✅ = Bom | ⚠️ = Limitado | ❌ = Não Suportado

---

## 🎓 Aprendizados Chave para Skyller

### 1. **RAG Architecture**
- **Open WebUI**: upload → vetorização automática (zero friction)
- **Dify**: workflow visual para controle fino do pipeline
- **Glean**: permission-aware retrieval (crítico para B2B)

### 2. **ToolRAG & Agents**
- **Dify**: padrão-ouro para orquestração de ferramentas
- **LibreChat**: sistema de plugins inspirado em OpenAI
- **Flowise/Langflow**: visualização de cadeias agentic

### 3. **Workspaces & Multi-Tenancy**
- **AnythingLLM**: isolamento de contexto por workspace
- **Glean**: governança de permissões enterprise-grade

### 4. **UI/UX de Citações**
- **Perplexity**: referência absoluta para mostrar fontes
- **RAGFlow**: Q&A com fundamentação rastreável

### 5. **Observabilidade**
- **Langfuse**: prompt management + versionamento
- **Dify**: LLMOps integrado com métricas
- **Chainlit**: debug visual de Chain of Thought

### 6. **Modularidade**
- **LlamaIndex**: 160+ conectores de dados
- **Haystack**: pipelines componíveis
- **Lobe Chat**: arquitetura de plugins modular

---

## 🔗 Links de Referência

### Documentação Oficial
- [LibreChat Docs](https://www.librechat.ai/)
- [Open WebUI Docs](https://docs.openwebui.com/)
- [Dify Docs](https://docs.dify.ai/)
- [Glean Platform](https://www.glean.com/)
- [LlamaIndex Docs](https://docs.llamaindex.ai/)
- [Langfuse Docs](https://langfuse.com/docs)

### Artigos & Guias
- [Glean: The Definitive Guide to AI-Based Enterprise Search for 2025](https://www.glean.com/blog/the-definitive-guide-to-ai-based-enterprise-search-for-2025)
- [Dify Blog: Open-Source LLMOps Platform](https://dify.ai/blog/open-source-llmops-platform-define-your-ai-native-apps)
- [Open WebUI: RAG Features](https://docs.openwebui.com/features/rag/)

### Repositórios GitHub
- [LibreChat](https://github.com/danny-avila/LibreChat)
- [Open WebUI](https://github.com/open-webui/open-webui)
- [Dify](https://github.com/langgenius/dify)
- [Lobe Chat](https://github.com/lobehub/lobe-chat)
- [HuggingFace Chat UI](https://github.com/huggingface/chat-ui)

---

## 📝 Notas de Implementação

### Prioridades para Skyller v1.0
1. **RAG Pipeline** (inspiração: Open WebUI + Dify)
   - Upload de documentos com vetorização automática
   - Suporte a múltiplos vector stores
   - Chunking configurável

2. **Workspaces Isolados** (inspiração: AnythingLLM)
   - Contexto vetorial segregado por workspace
   - Permissões por usuário/grupo

3. **ToolRAG** (inspiração: Dify)
   - Sistema de ferramentas customizáveis
   - Function calling estruturado

4. **UI de Citações** (inspiração: Perplexity)
   - Rastreamento de fontes em tempo real
   - Modal de preview de documentos

5. **Observabilidade** (inspiração: Langfuse)
   - Prompt management básico
   - Logs de execuções LLM

---

**Documento criado em:** 2026-01-22
**Versão:** 1.0
**Última atualização:** 2026-01-22
**Autor:** SKILLS IT - Soluções em TI
**Projeto:** Skyller AI Platform
