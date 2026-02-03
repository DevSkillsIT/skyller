# 🇧🇷 Análise do Mercado Brasileiro de Plataformas de IA Conversacional

> **Documento de Pesquisa Independente**
> **Data:** 03 de fevereiro de 2026
> **Versão:** 2.2
> **Autor:** Skills IT - Soluções em TI
> **Objetivo:** Mapear plataformas brasileiras (end-user) que competem com o Skyller em Chat UI, Knowledge Base, Workspaces e Enterprise features

---

## 📑 Índice

1. [Contexto da Pesquisa](#1-contexto-da-pesquisa)
2. [Escopo - Features Skyller para Comparação](#2-escopo---features-skyller-para-comparação)
3. [Ferramentas Internacionais de Referência](#3-ferramentas-internacionais-de-referência)
4. [Análise de Concorrentes Brasileiros](#4-análise-de-concorrentes-brasileiros)
5. [Matriz Comparativa de Features](#5-matriz-comparativa-de-features)
6. [Gaps do Mercado Brasileiro](#6-gaps-do-mercado-brasileiro)
7. [Posicionamento Skyller](#7-posicionamento-skyller)
8. [Conclusões](#8-conclusões)
9. [Fontes e Referências](#9-fontes-e-referências)

---

## 1. Contexto da Pesquisa

### 1.1. Motivação

Esta pesquisa foi conduzida para identificar **plataformas brasileiras** que competem diretamente com o Skyller no segmento de:

- Plataformas de IA conversacional multi-tenant
- Sistemas de DocsRAG (RAG com documentos corporativos)
- Gestão de conhecimento empresarial com IA
- Workspaces/Projetos com contexto isolado

**⚠️ Escopo NÃO inclui:**
- Empresas que criam LLMs (Maritaca AI, NeuralMind, WideLabs, etc.)
- Chatbots focados apenas em atendimento ao cliente
- Frameworks de desenvolvimento (LangChain, LlamaIndex)

### 1.2. Metodologia

- Pesquisa web extensiva em janeiro/fevereiro de 2026
- Análise de sites oficiais e documentações
- Cross-reference com ferramentas internacionais de referência

---

## 2. Escopo - Features Skyller para Comparação

### 2.1. Arquitetura Hierárquica Skyller

O Skyller implementa uma hierarquia de isolamento:

```
Tenant (Organização)
├── Workspaces (Departamentos)
│   ├── Knowledge Base (docs, custom instructions)
│   └── Projetos
│       ├── Knowledge Base (herda do workspace + próprio)
│       └── Custom Instructions (herda + próprio)
└── Top-Level Features (Kanban, Canvas, Docs)
```

### 2.2. Features Críticas para Comparação

| Feature | Descrição | Referência Internacional |
|---------|-----------|--------------------------|
| **Hierarquia Organizacional** | 3 níveis: org > departamento > projeto | Exclusivo Skyller |
| **Workspaces** | Contexto departamental isolado | Claude Projects, AnythingLLM |
| **Projetos com Herança** | Projeto herda knowledge base do workspace | Exclusivo Skyller |
| **DocsRAG** | Upload → vetorização automática → RAG | Open WebUI, AnythingLLM |
| **ToolRAG** | Seleção automática de ferramentas | ChatGPT Plugins (descontinuado) |
| **Custom Instructions** | Persona configurável por workspace/projeto | ChatGPT Custom Instructions |
| **3 Modos de Chat** | Loose (sem contexto), Workspace, Projeto | Exclusivo Skyller |
| **Citações** | Fontes rastreáveis estilo Perplexity | Perplexity |
| **Artifacts** | Artefatos dentro das conversas | Claude Artifacts |
| **Canvas/Docs/Kanban** | Features top-level no tenant | Notion AI |
| **Multi-Agent** | Orquestração de agentes especializados | ChatGPT GPTs (limitado) |
| **AG-UI Protocol** | SSE streaming para frontend | Padrão emergente |

### 2.3. Público-Alvo

- Empresas brasileiras médias e grandes (B2B)
- Órgãos governamentais com requisitos de soberania
- Organizações com compliance LGPD

---

## 3. Plataformas Internacionais de Referência (End-User)

> **Nota:** Focamos em plataformas para **usuários finais**, não ferramentas para desenvolvedores (Dify, Langfuse, Flowise são dev tools, não concorrentes diretos).

### 3.1. Plataformas de Chat com IA

| Plataforma | Categoria | Feature Destaque | Público |
|------------|-----------|------------------|---------|
| **ChatGPT** | Chat IA | Custom Instructions, GPTs | Consumidor/Enterprise |
| **Claude** | Chat IA | Projects, Artifacts, 200K context | Consumidor/Enterprise |
| **Gemini** | Chat IA | Integração Google Workspace | Consumidor/Enterprise |
| **Perplexity** | Search + Chat | Citações rastreáveis | Consumidor |

### 3.2. Plataformas de Knowledge/Workspace

| Plataforma | Categoria | Feature Destaque | Público |
|------------|-----------|------------------|---------|
| **Notion AI** | Workspace + IA | Docs + Knowledge Base + IA integrada | Empresas |
| **Glean** | Enterprise Search | Busca unificada com ACL ($7B) | Enterprise |
| **Coda AI** | Docs + IA | Documentos inteligentes | Empresas |
| **Slite** | Knowledge Base | Wiki empresarial com IA | Empresas |

### 3.3. Plataformas Self-Hosted (End-User)

| Plataforma | Categoria | Feature Destaque | Público |
|------------|-----------|------------------|---------|
| **LibreChat** | Chat UI | Clone ChatGPT open-source | Empresas (self-host) |
| **Open WebUI** | Chat + RAG | Upload docs + RAG automático | Empresas (self-host) |
| **AnythingLLM** | Chat + Workspaces | Workspaces isolados, multi-tenant | Empresas (self-host) |

### 3.4. O que o Skyller combina

O Skyller propõe combinar o melhor de cada categoria:

| De... | Feature |
|-------|---------|
| **ChatGPT** | Custom Instructions por contexto |
| **Claude** | Projects, Artifacts |
| **Perplexity** | Citações rastreáveis |
| **Notion AI** | Workspace + Knowledge Base |
| **Glean** | Enterprise search com permissões |
| **AnythingLLM** | Workspaces isolados, self-hosted |

**Diferencial Skyller:** Hierarquia tenant > workspace > projeto com herança de KB

---

## 4. Análise de Concorrentes Brasileiros

### 4.1. Visão Geral

O mercado brasileiro de plataformas de IA conversacional com RAG/Knowledge Base está **fragmentado**. Não existe nenhum player que integre todas as funcionalidades que o Skyller propõe.

**Categorias relevantes:**
- **Plataformas RAG/Knowledge Base**: ConversAI (governo), DocuFlows, Nama.ai
- **Chatbot SaaS com IA**: Take Blip, Zenvia (foco em atendimento)
- **Agentes IA Enterprise**: Loomi/Olli, Toolzz AI, Spryx

---

### 4.2. DocuFlows ⭐

**Plataforma brasileira de documentação de processos e conhecimento com IA**

| Aspecto | Detalhe |
|---------|---------|
| **Tipo** | SaaS de Knowledge Management + IA |
| **Foco** | PMEs que querem sistematizar conhecimento |
| **Mercado** | Brasileiro |
| **Modelo** | SaaS |

**Funcionalidades:**
- ✅ **DocuChat**: Chat com IA treinada no conhecimento da empresa
- ✅ **Magic Text**: IA gera documentos e sugere conteúdo
- ✅ **Knowledge Base**: Centralização de processos, SOPs, políticas
- ✅ **Spaces e Libraries**: Organização de documentos
- ✅ **250+ Templates**: Onboarding, vendas, marketing, RH
- ✅ **Onboarding Automatizado**: Processos viram trilhas de treinamento
- ✅ **Quizzes**: Avaliação de aprendizado
- ✅ **Controle de Permissões**: Granular (quem edita, visualiza, revisa)
- ✅ **Versionamento**: Histórico automático de documentos

**Comparação com Skyller:**

| Feature | DocuFlows | Skyller |
|---------|-----------|---------|
| Chat com IA | ✅ DocuChat | ✅ Multi-modo |
| Knowledge Base | ✅ Centralizado | ✅ Hierárquico (tenant>ws>proj) |
| Hierarquia organizacional | ⚠️ Flat | ✅ 3 níveis com RLS |
| Workspaces | ✅ Spaces | ✅ Workspaces + Projetos |
| Herança de KB | ❌ | ✅ Projeto herda de Workspace |
| Custom Instructions | ⚠️ Básico | ✅ Por workspace/projeto |
| DocsRAG | ⚠️ Básico | ✅ Weaviate + vetorização |
| ToolRAG | ❌ | ✅ Seleção automática |
| Citações | ❌ | ✅ Estilo Perplexity |
| Artifacts | ❌ | ✅ Em conversas |
| Canvas/Kanban | ❌ | ✅ Top-level |
| Multi-Agent | ❌ | ✅ Orquestração |
| Self-Hosted | ❌ | ✅ Planejado |

**Veredicto:** DocuFlows é competidor parcial - forte em documentação/SOPs, mas não é plataforma de IA conversacional completa como o Skyller propõe.

**Fontes:**
- [DocuFlows](https://docuflows.com/)
- [DocuFlows Instagram](https://www.instagram.com/docuflows/)

---

### 4.3. ConversAI Studio (SERPRO)

**A iniciativa governamental brasileira de RAG**

| Aspecto | Detalhe |
|---------|---------|
| **Tipo** | RAG as a Service para Governo |
| **Desenvolvedor** | SERPRO (estatal federal) |
| **Investimento** | R$ 710 milhões |
| **Status** | Operacional (PGFN, IBGE) |
| **Capacidade** | 2 bilhões de tokens |

**Funcionalidades:**
- ✅ RAG com bases de conhecimento por órgão
- ✅ Assistentes conversacionais customizados
- ✅ Isolamento de dados entre instituições
- ✅ LLMs open source locais (Mistral, Llama, Gemma, DeepSeek)
- ✅ 100% em datacenters nacionais
- ✅ Compliance LGPD

**Limitações Críticas:**
- ❌ **Exclusivo para setor público** - não atende mercado privado
- ❌ Não comercializado para empresas
- ❌ Sem self-hosted para terceiros

**Comparação com Skyller:**

| Feature | ConversAI | Skyller |
|---------|-----------|---------|
| Disponível para privados | ❌ | ✅ |
| RAG | ✅ | ✅ |
| Workspaces | ✅ Por órgão | ✅ Hierárquico |
| Hierarquia organizacional | ⚠️ Por órgão | ✅ 3 níveis |
| ToolRAG | ⚠️ Limitado | ✅ |
| Custom Instructions | ⚠️ | ✅ |
| Citações | ⚠️ | ✅ |
| Self-Hosted | ❌ | ✅ |

**Veredicto:** ConversAI é referência técnica, mas não é concorrente direto pois atende exclusivamente o governo.

**Fontes:**
- [SERPRO - ConversAI Studio](https://www.serpro.gov.br/menu/noticias/noticias-2025/conversai-studio)
- [Canaltech - SERPRO](https://canaltech.com.br/inteligencia-artificial/serpro-lanca-chatgpt-para-chamar-de-seu-no-funcionalismo-publico-veja-como-e/)

---

### 4.4. Nama.ai

**Plataforma de conhecimento empresarial com RAG**

| Aspecto | Detalhe |
|---------|---------|
| **Tipo** | Knowledge Base + IA |
| **Foco** | Empresas |

**Funcionalidades:**
- ✅ RAG avançado
- ✅ API para integração
- ✅ Chatbots inteligentes

**Comparação com Skyller:**

| Feature | Nama.ai | Skyller |
|---------|---------|---------|
| RAG | ✅ | ✅ |
| Workspaces | ⚠️ | ✅ Hierárquico |
| Hierarquia organizacional | ? | ✅ 3 níveis |
| Custom Instructions | ⚠️ | ✅ |
| Citações | ❌ | ✅ |

**Veredicto:** Informações públicas limitadas. Parece focado em API/integração, não em plataforma end-user completa.

**Fontes:**
- [Nama.ai](https://nama.ai/)

---

### 4.5. Spryx

**IA conversacional com RAG**

| Aspecto | Detalhe |
|---------|---------|
| **Tipo** | IA conversacional enterprise |
| **Ranking** | TOP startups IA Brasil |

**Funcionalidades:**
- ✅ RAG para knowledge bases
- ✅ Atendimento automatizado
- ✅ Produtividade de times

**Comparação com Skyller:**

| Feature | Spryx | Skyller |
|---------|-------|---------|
| RAG | ✅ | ✅ |
| Workspaces | ⚠️ | ✅ |
| Herança KB | ❌ | ✅ |
| ToolRAG | ⚠️ | ✅ |

**Veredicto:** Foco em atendimento/produtividade. Menos features de plataforma completa.

**Fontes:**
- [Spryx.ai](https://spryx.ai/)

---

### 4.6. Toolzz AI

**Plataforma no-code de multi-agentes + LMS**

| Aspecto | Detalhe |
|---------|---------|
| **Tipo** | Multi-Agentes + LMS |
| **Localização** | São Paulo, SP |
| **Modelo** | SaaS whitelabel |

**Funcionalidades:**
- ✅ Multi-agentes sem código
- ✅ LMS integrado
- ✅ 400+ integrações
- ✅ Whitelabel

**Clientes:** iFood Decola, B3, Ágora Academy

**Comparação com Skyller:**

| Feature | Toolzz AI | Skyller |
|---------|-----------|---------|
| Multi-Agent | ✅ | ✅ |
| DocsRAG | ⚠️ | ✅ |
| Workspaces | ⚠️ | ✅ Hierárquico |
| Herança KB | ❌ | ✅ |
| Custom Instructions | ⚠️ | ✅ |

**Veredicto:** Forte em LMS/educação. Diferente do foco do Skyller (plataforma de chat + RAG).

**Fontes:**
- [Toolzz AI](https://www.toolzz.com.br/)

---

### 4.7. Loomi (Olli)

**Agentes de IA enterprise customizados**

| Aspecto | Detalhe |
|---------|---------|
| **Tipo** | Agentes personalizados |
| **Faturamento 2024** | R$ 8,6M |
| **Crescimento** | 34% |
| **Clientes** | 84 (Basf, Bayer, Neoenergia, etc.) |

**Produto Olli:**
- ✅ Plataforma plug & play para agentes
- ✅ "Segundo cérebro" para equipes
- ✅ Agentes sob medida

**Veredicto:** Modelo de consultoria + plataforma. Menos produto SaaS padronizado. Não é concorrente direto.

**Fontes:**
- [Loomi Digital](https://loomi.digital/en/)

---

### 4.8. Chatbot SaaS (Blip, Zenvia)

**Plataformas de chatbot com IA generativa**

Estas plataformas são fortes em **atendimento ao cliente** mas não competem diretamente nas features do Skyller:

| Feature | Blip/Zenvia | Skyller |
|---------|-------------|---------|
| Foco Principal | Atendimento | Produtividade + Knowledge |
| Workspaces | ⚠️ Básico | ✅ Hierárquico |
| DocsRAG | ⚠️ Básico | ✅ Avançado |
| Herança KB | ❌ | ✅ |
| ToolRAG | ⚠️ | ✅ |
| Citações | ❌ | ✅ |
| Canvas/Artifacts | ❌ | ✅ |

**Veredicto:** Competidores indiretos. Foco diferente (atendimento vs produtividade/knowledge).

**Fontes:**
- [Blip](https://www.blip.ai/)
- [Zenvia](https://www.zenvia.com/)

---

## 5. Matriz Comparativa de Features

### 5.1. Features Críticas do Skyller vs Concorrentes BR

| Feature | DocuFlows | ConversAI | Nama.ai | Spryx | Toolzz | **Skyller** |
|---------|-----------|-----------|---------|-------|--------|-------------|
| **Hierarquia 3 níveis** (org>dept>proj) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Workspaces/Spaces** | ✅ Spaces | ✅ Órgãos | ⚠️ | ⚠️ | ⚠️ | ✅ |
| **Projetos com isolamento** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Herança KB entre níveis** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **DocsRAG avançado** | ⚠️ Básico | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| **ToolRAG** | ❌ | ⚠️ | ⚠️ | ⚠️ | ✅ | ✅ |
| **Custom Instructions por nível** | ⚠️ | ⚠️ | ⚠️ | ❌ | ⚠️ | ✅ |
| **3 Modos Chat** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Citações Perplexity-style** | ❌ | ⚠️ | ❌ | ❌ | ❌ | ✅ |
| **Artifacts em conversas** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Canvas/Kanban integrado** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Multi-Agent** | ❌ | ⚠️ | ❌ | ⚠️ | ✅ | ✅ |
| **Self-Hosted para privados** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Disponível mercado privado** | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |

**Legenda:** ✅ = Completo | ⚠️ = Limitado/Básico | ❌ = Não possui

### 5.2. Features Exclusivas do Skyller

Nenhum concorrente brasileiro identificado oferece:

1. **Hierarquia Tenant > Workspace > Projeto com herança de KB**
2. **3 modos de chat** (Loose, Workspace, Projeto)
3. **Custom Instructions por nível** (workspace e projeto)
4. **Citações estilo Perplexity**
5. **Artifacts em conversas**
6. **Canvas/Kanban/Docs top-level**
7. **AG-UI Protocol** (SSE streaming para frontend)

---

## 6. Gaps do Mercado Brasileiro

### 6.1. Gaps Críticos Identificados

| Gap | Descrição | Oportunidade |
|-----|-----------|--------------|
| **Hierarquia de Knowledge Base** | Nenhuma plataforma BR oferece herança tenant>workspace>projeto | 🔴 Exclusivo Skyller |
| **Citações Perplexity-style** | Nenhuma plataforma BR implementou | 🔴 Exclusivo Skyller |
| **Workspaces com RAG** | ConversAI tem, mas só para governo | 🔴 Alto |
| **Self-Hosted para Privados** | Todas são SaaS | 🔴 Alto |
| **Multi-modo de Chat** | Ninguém oferece loose/workspace/projeto | 🔴 Exclusivo Skyller |
| **Canvas/Artifacts** | Nenhuma plataforma BR tem | 🔴 Exclusivo Skyller |
| **ToolRAG Visual** | Toolzz tem agentes, não ToolRAG puro | 🟠 Médio |

### 6.2. Conclusão dos Gaps

O mercado brasileiro **não possui** nenhuma plataforma que integre:
- Chat UI moderna + DocsRAG + ToolRAG + Workspaces hierárquicos + Citações

**DocuFlows** é o mais próximo em Knowledge Management, mas foca em SOPs/documentação, não em plataforma de IA conversacional completa.

---

## 7. Posicionamento Skyller

### 7.1. Features Únicas no Brasil

Baseado na análise, o Skyller oferece features que **nenhum concorrente brasileiro** possui:

| Feature Exclusiva | Benefício |
|-------------------|-----------|
| **Hierarquia Tenant > Workspace > Projeto** | Organização empresarial real |
| **Herança de Knowledge Base** | Projeto usa docs do workspace + próprios |
| **3 Modos de Chat** | Flexibilidade: loose, workspace, projeto |
| **Custom Instructions por nível** | Persona ajustável por contexto |
| **Citações estilo Perplexity** | Credibilidade e rastreabilidade |
| **Artifacts em conversas** | Produtividade aumentada |
| **Canvas/Kanban/Docs top-level** | Super app, não só chat |
| **Self-hosted planejado** | Soberania de dados |

### 7.2. Comparação com Plataformas End-User Internacionais

| Feature | ChatGPT | Claude | Perplexity | Notion AI | AnythingLLM | **Skyller** |
|---------|---------|--------|------------|-----------|-------------|-------------|
| **Hierarquia 3 níveis** (org>dept>proj) | ❌ | ❌ | ❌ | ⚠️ 2 níveis | ⚠️ | ✅ |
| Workspaces | ⚠️ GPTs | ✅ Projects | ❌ | ✅ | ✅ | ✅ |
| Projetos com Herança KB | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| DocsRAG (upload+busca) | ⚠️ | ⚠️ 200K | ❌ | ⚠️ | ✅ | ✅ |
| Custom Instructions por nível | ✅ Global | ⚠️ Project | ❌ | ⚠️ | ⚠️ | ✅ |
| Citações rastreáveis | ❌ | ❌ | ✅✅ | ❌ | ❌ | ✅ |
| Artifacts/Canvas | ⚠️ Canvas | ✅ Artifacts | ❌ | ⚠️ | ❌ | ✅ |
| Kanban/Docs integrado | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Self-Hosted | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Foco BR Enterprise | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

### 7.3. Análise de Distância: Skyller vs DocuFlows

**DocuFlows** é o concorrente brasileiro mais próximo. Análise de quem está mais perto de quem:

#### O que o DocuFlows tem (que Skyller não tem ainda):
- ✅ **250+ templates** de SOPs e processos prontos
- ✅ **Trilhas de onboarding** estruturadas
- ✅ **Quizzes automatizados** gerados por IA
- ✅ **Produto em produção** com clientes ativos
- ✅ **Foco claro em PMEs** e processos operacionais

#### O que o Skyller tem (que DocuFlows não tem):
- ✅ **Hierarquia 3 níveis** (tenant > workspace > projeto)
- ✅ **Herança de Knowledge Base** entre níveis
- ✅ **DocsRAG avançado** (vetorização, busca semântica, Weaviate)
- ✅ **ToolRAG** (seleção automática de ferramentas)
- ✅ **Citações estilo Perplexity**
- ✅ **Artifacts** em conversas
- ✅ **Canvas/Kanban** integrado
- ✅ **Multi-Agent** orquestrado
- ✅ **Self-hosted** planejado

#### Distância para cada um alcançar o outro:

| Para Skyller → DocuFlows | Dificuldade | Esforço |
|--------------------------|-------------|---------|
| Adicionar templates prontos | 🟢 Fácil | Criar biblioteca de templates |
| Trilhas de onboarding | 🟡 Médio | Módulo de learning path |
| Quizzes automatizados | 🟡 Médio | Sistema de avaliação |

| Para DocuFlows → Skyller | Dificuldade | Esforço |
|--------------------------|-------------|---------|
| Hierarquia 3 níveis com herança | 🔴 Difícil | Redesign de arquitetura |
| DocsRAG avançado (vetorização) | 🔴 Difícil | Stack RAG completo |
| ToolRAG | 🔴 Muito Difícil | Arquitetura de agentes |
| Multi-Agent | 🔴 Muito Difícil | Orquestração complexa |
| Citações Perplexity-style | 🟡 Médio | RAG com source tracking |

#### Veredicto de Distância

**É significativamente mais FÁCIL o Skyller adicionar as features do DocuFlows do que o contrário.**

- As features do DocuFlows são mais "superficiais" (templates, onboarding, quizzes)
- As features do Skyller são mais "profundas" (arquitetura RAG, hierarquia, multi-agent)
- DocuFlows precisaria **reescrever a arquitetura** para ter hierarquia com herança
- Skyller precisa apenas **adicionar módulos** para ter templates e onboarding

**Conclusão:** São produtos **complementares** em posicionamento, mas **Skyller tem vantagem arquitetural**. DocuFlows foca em "documentar processos", Skyller foca em "trabalhar com IA usando conhecimento".

---

## 8. Conclusões

### 8.1. Estado do Mercado Brasileiro

1. **Fragmentado**: Cada empresa foca em um nicho específico
2. **Sem integração completa**: Ninguém oferece chat + RAG + workspaces + tools
3. **SaaS-only**: Nenhuma opção self-hosted para privados
4. **Foco em atendimento**: Blip/Zenvia dominam chatbots de atendimento
5. **Knowledge Management básico**: DocuFlows é o mais avançado, mas foco é SOPs

### 8.2. Gap de Mercado Identificado

**Não existe** no Brasil uma plataforma que combine:

- ✅ Chat UI moderna estilo ChatGPT
- ✅ DocsRAG com vetorização automática
- ✅ Workspaces + Projetos com herança de KB
- ✅ ToolRAG com seleção automática
- ✅ Citações estilo Perplexity
- ✅ Hierarquia organizacional 3 níveis (org > dept > projeto)
- ✅ Artifacts/Canvas/Kanban
- ✅ Self-hosted para empresas privadas

### 8.3. Competidores por Nível

| Nível | Competidores | Observação |
|-------|--------------|------------|
| **Direto** | Nenhum | Gap de mercado |
| **Parcial (Knowledge)** | DocuFlows | Foco em SOPs, não chat |
| **Indireto (Chatbot)** | Blip, Zenvia | Foco em atendimento |
| **Potencial Futuro** | Dify (se localizar), ConversAI (se privatizar) | Monitorar |

### 8.4. Veredicto Final

O Skyller ocupa um **oceano azul** no mercado brasileiro. A combinação de features proposta não existe em nenhum concorrente nacional identificado.

---

## 9. Fontes e Referências

### 9.1. Plataformas Brasileiras

- [DocuFlows](https://docuflows.com/)
- [SERPRO - ConversAI](https://www.serpro.gov.br/menu/noticias/noticias-2025/conversai-studio)
- [Nama.ai](https://nama.ai/)
- [Spryx.ai](https://spryx.ai/)
- [Toolzz AI](https://www.toolzz.com.br/)
- [Loomi Digital](https://loomi.digital/en/)
- [Take Blip](https://www.blip.ai/)
- [Zenvia](https://www.zenvia.com/)

### 9.2. Plataformas Internacionais (End-User)

- [ChatGPT](https://chat.openai.com/)
- [Claude](https://claude.ai/)
- [Perplexity](https://www.perplexity.ai/)
- [Notion AI](https://www.notion.so/product/ai)
- [Glean](https://www.glean.com/)
- [AnythingLLM](https://anythingllm.com/)
- [LibreChat](https://www.librechat.ai/)
- [Open WebUI](https://openwebui.com/)

### 9.3. Artigos

- [Canaltech - SERPRO](https://canaltech.com.br/inteligencia-artificial/serpro-lanca-chatgpt-para-chamar-de-seu-no-funcionalismo-publico-veja-como-e/)
- [beAnalytic - Startups IA](https://beanalytic.com.br/blog/startups-de-inteligencia-artificial/)

---

## Changelog

| Versão | Data | Alterações |
|--------|------|------------|
| 2.2 | 2026-02-03 | Corrigido termo "Multi-Tenancy" para "Hierarquia 3 níveis" (mais preciso). Adicionada análise de distância Skyller vs DocuFlows |
| 2.1 | 2026-02-03 | Removidas ferramentas para devs (Dify, Langfuse, Flowise) - Skyller é plataforma end-user. Foco em ChatGPT, Claude, Perplexity, Notion AI |
| 2.0 | 2026-02-03 | Reestruturação: removidas empresas de LLM (Maritaca, NeuralMind, WideLabs), foco em plataformas concorrentes, adicionado DocuFlows |
| 1.0 | 2026-02-02 | Versão inicial |

---

**Documento produzido por:** Skills IT - Soluções em TI
**Projeto:** Skyller AI Platform
**Classificação:** Interno - Análise de Mercado
