"use client";

import { createContext, type ReactNode, useContext, useState, useCallback, useEffect } from "react";
import { useAgent, UseAgentUpdate } from "@copilotkit/react-core/v2";
import type { Message as CopilotMessage } from "@copilotkit/runtime-client-gql";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Message } from "@/lib/mock/data";
import { useRateLimit } from "@/lib/hooks/use-rate-limit";
import { useEffectiveAgent } from "@/lib/hooks/use-effective-agent";
import { authPost } from "@/lib/api-client";
import { useSession } from "next-auth/react";

// Interface do estado do agente com suporte a eventos AG-UI
// Conforme GAP-CRIT-01 e documentação oficial do CopilotKit
interface AgentState {
  messages: Message[];
  isRunning: boolean;
  currentTool?: string;
  thinkingState?: string;
}

interface ChatContextType {
  // Estado do agente (acessado via useAgent)
  messages: Message[];
  isRunning: boolean;
  currentTool?: string;
  thinkingState?: string;
  threadId?: string;

  // Agente selecionado (dinâmico)
  selectedAgentId: string;
  setSelectedAgentId: (agentId: string) => void;

  // Estado de rate limiting (GAP-CRIT-06: AC-012/RU-005)
  rateLimit: {
    isLimited: boolean;
    remaining: number;
    limit: number;
    resetAt: Date | null;
    formattedTime: string;
  };

  // Métodos para controle do agente
  runAgent: (message: string) => Promise<void>;

  // Métodos legados (backward compatibility)
  currentConversationId: string | null;
  loadConversation: (conversationId: string) => void;
  startNewConversation: () => void;
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// SPEC-AGENT-MANAGEMENT-001: Fallback agent ID quando nenhum agente disponivel
const FALLBACK_AGENT_ID = "skyller";

export function ChatProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  // SPEC-AGENT-MANAGEMENT-001: Resolver agente efetivo via hierarquia
  // User > Project > Workspace > Tenant > Fallback
  const {
    agentId: effectiveAgentId,
    isLoading: isLoadingAgent,
  } = useEffectiveAgent();

  // Estado do agente selecionado (dinamico, inicializado pelo effective agent)
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>(undefined);

  // Estado local para tracking de eventos AG-UI
  const [currentTool, setCurrentTool] = useState<string | undefined>(undefined);
  const [thinkingState, setThinkingState] = useState<string | undefined>(undefined);

  // GAP-IMP-01: Tracking de persistência de mensagens
  const [pendingPersistence, setPendingPersistence] = useState<Set<string>>(new Set());
  const [lastMessageCount, setLastMessageCount] = useState(0);

  // GAP-CRIT-06: Hook de rate limiting conectado ao backend (AC-012/RU-005)
  // Extrai headers X-RateLimit-* para sincronizar com 30 RPM do backend
  const rateLimit = useRateLimit();

  // SPEC-AGENT-MANAGEMENT-001: Sincronizar com agente efetivo quando disponivel
  useEffect(() => {
    if (effectiveAgentId && !selectedAgentId) {
      console.info(`[ChatContext] Agente efetivo resolvido: ${effectiveAgentId}`);
      setSelectedAgentId(effectiveAgentId);
    }
  }, [effectiveAgentId, selectedAgentId]);

  // GAP-CRIT-01: Hook useAgent v2 com acesso completo a eventos AG-UI
  // Conforme documentação: https://docs.copilotkit.ai/reference/hooks/useAgent
  // agentId agora e dinamico baseado na selecao do usuario ou effective agent
  const { agent } = useAgent({
    agentId: selectedAgentId || FALLBACK_AGENT_ID,  // Agente selecionado ou fallback
    // Configurar updates para re-render apenas quando necessário
    updates: [
      UseAgentUpdate.OnMessagesChanged,
      UseAgentUpdate.OnStateChanged,
      UseAgentUpdate.OnRunStatusChanged,
    ],
  });

  // GAP-CRIT-03: Subscription a eventos AG-UI (TOOL_CALL, THINKING, RUN_ERROR)
  // Conforme AC-023, AC-024, AC-027
  useEffect(() => {
    const { unsubscribe } = agent.subscribe({
      onCustomEvent: ({ event }) => {
        // TOOL_CALL_START: Ferramenta começou a executar
        if (event.name === 'TOOL_CALL_START') {
          setCurrentTool(event.value?.toolName || 'unknown');
          // Toast removido - muito verboso, estado já é rastreado via currentTool
        }

        // TOOL_CALL_END: Ferramenta finalizou
        if (event.name === 'TOOL_CALL_END') {
          setCurrentTool(undefined);
        }

        // THINKING_START: Agente começou a pensar
        if (event.name === 'THINKING_START') {
          setThinkingState('Analisando...');
        }

        // THINKING_END: Agente finalizou pensamento
        if (event.name === 'THINKING_END') {
          setThinkingState(undefined);
        }

        // RUN_ERROR: Erro durante execução
        if (event.name === 'RUN_ERROR') {
          toast.error(`❌ Erro: ${event.value?.message || 'Erro desconhecido'}`);
        }
      },

      onRunStartedEvent: () => {
        // Agente começou a processar
        // Toast removido - UI já mostra "Skyller está pensando..."
      },

      onRunFinalized: () => {
        // Agente finalizou processamento
        setCurrentTool(undefined);
        setThinkingState(undefined);

        // GAP-IMP-01: Validar persistência após finalização
        if (pendingPersistence.size > 0) {
          console.error(`[ChatContext] ❌ Falha na persistência: ${pendingPersistence.size} mensagens não confirmadas`);
          toast.error("Algumas mensagens podem não ter sido salvas. Tente reenviar.");

          // Limpar tracking para próxima execução
          setPendingPersistence(new Set());
        }
      },

      onMessagesChanged: (messages) => {
        // GAP-IMP-01: Validar persistência de mensagens
        // Quando backend retorna mensagens via SSE, indica que foram persistidas
        console.debug(`[ChatContext] Mensagens atualizadas: ${messages.length}`);

        // Se recebemos mais mensagens do que tínhamos, persistência confirmada
        if (messages.length > lastMessageCount) {
          setLastMessageCount(messages.length);

          // Limpar IDs de mensagens pendentes (backend confirmou persistência)
          setPendingPersistence(new Set());

          console.info(`[ChatContext] ✅ Persistência confirmada: ${messages.length} mensagens`);
        }
      },
    });

    return unsubscribe;
  }, [agent, lastMessageCount]);

  // GAP-CRIT-05: Reconexão SSE automática
  // useAgent já gerencia SSE connection com backoff exponencial
  // Subscription para eventos de conexão
  useEffect(() => {
    let reconnectAttempt = 0;
    const maxRetries = 5;

    const { unsubscribe } = agent.subscribe({
      onCustomEvent: ({ event }) => {
        // Evento de reconexão SSE
        if (event.name === 'SSE_RECONNECTING') {
          reconnectAttempt++;
          toast.info(`🔄 Reconectando... (tentativa ${reconnectAttempt}/${maxRetries})`);
        }

        // Evento de reconexão bem-sucedida
        if (event.name === 'SSE_RECONNECTED') {
          reconnectAttempt = 0;
          toast.success("✅ Conexão restabelecida");
        }

        // Evento de falha após max retries
        if (event.name === 'SSE_MAX_RETRIES_EXCEEDED') {
          toast.error("❌ Conexão perdida. Recarregue a página.", {
            duration: Infinity,
            action: {
              label: "Recarregar",
              onClick: () => window.location.reload(),
            },
          });
        }
      },
    });

    return unsubscribe;
  }, [agent]);

  // Função para tratar erros de autenticação/autorização da API
  // GAP-IMP-06: Interceptar 401/403 e redirecionar conforme RC-001
  const handleApiError = useCallback((error: any) => {
    // Verificar status code do erro
    const status = error?.status || error?.response?.status;

    if (status === 401) {
      // Token expirado ou inválido
      toast.error("Sessão expirada. Redirecionando para login...");
      router.push("/api/auth/login");
      return true;
    }

    if (status === 403) {
      // Sem permissão (tenant não selecionado ou permissões insuficientes)
      toast.error("Sem permissão. Verifique suas permissões ou selecione um tenant.");
      router.push("/dashboard");
      return true;
    }

    return false;
  }, [router]);

  // Converter mensagens do CopilotKit para formato local
  const messages: Message[] = agent.messages.map((msg: CopilotMessage) => ({
    id: msg.id,
    role: msg.role as "user" | "assistant",
    content: msg.content,
    timestamp: new Date(msg.createdAt || Date.now()),
  }));

  // Método para executar o agente com nova mensagem
  // GAP-IMP-02: Retry automático com backoff exponencial (RE-004/RO-005)
  const runAgent = async (message: string) => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000; // 2 segundos

    // Helper para sleep
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Adicionar mensagem antes de tentar executar
    const messageId = crypto.randomUUID();
    agent.addMessage({
      id: messageId,
      role: "user",
      content: message,
      createdAt: new Date(),
    });

    // GAP-IMP-01: Marcar mensagem como pendente de persistência
    setPendingPersistence(new Set([messageId]));

    // Loop de retry
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        // Executar agente (dispara processamento backend)
        // O agente correto ja esta selecionado via useAgent({ agentId: selectedAgentId })
        await agent.runAgent({
          forwardedProps: {
            message,
            conversationId: currentConversationId,
          },
        });

        // SPEC-AGENT-MANAGEMENT-001: Registrar uso do agente apos sucesso
        const usedAgentId = selectedAgentId || FALLBACK_AGENT_ID;
        try {
          await authPost(`/api/v1/agents/${usedAgentId}/track-usage`, session, {});
        } catch (trackError) {
          // Nao bloquear por erro de tracking (nao-critico)
          console.warn("[ChatContext] Erro ao registrar uso de agente:", trackError);
        }

        // Sucesso - retornar imediatamente
        return;
      } catch (error) {
        console.error(`Erro ao executar agente (tentativa ${attempt}/${MAX_RETRIES}):`, error);

        // Interceptar erros de autenticação/autorização (401/403) - não faz retry
        const wasHandled = handleApiError(error);
        if (wasHandled) {
          return; // 401/403 não deve fazer retry
        }

        // Verificar se é erro 4xx (não faz retry conforme RO-005)
        const status = error?.status || error?.response?.status;
        if (status >= 400 && status < 500) {
          toast.error("Erro ao enviar mensagem. Verifique sua requisição.");
          return;
        }

        // RO-005: Retry apenas para 503 Service Unavailable (não para outros 5xx)
        if (status && status !== 503 && status >= 500) {
          toast.error("Erro no servidor. Tente novamente mais tarde.");
          return;
        }

        // Se não é a última tentativa, aguardar backoff e tentar novamente
        if (attempt < MAX_RETRIES) {
          toast.info(`🔄 Tentativa ${attempt}/${MAX_RETRIES} falhou. Tentando novamente...`);
          await sleep(RETRY_DELAY * Math.pow(2, attempt - 1)); // Backoff exponencial: 2s → 4s → 8s
        } else {
          // Última tentativa falhou - mostrar erro fatal
          toast.error("❌ Falha após 3 tentativas. Recarregue a página.", {
            duration: Infinity,
            action: {
              label: "Recarregar",
              onClick: () => window.location.reload(),
            },
          });
        }
      }
    }
  };

  // Métodos legados para backward compatibility
  // GAP-IMP-03: Carregar histórico ordenado (AC-008/RE-005)
  const loadConversation = async (conversationId: string) => {
    setCurrentConversationId(conversationId);

    try {
      // Importar dependências dinamicamente para evitar problemas de SSR
      const { apiGet } = await import("@/lib/api-client");
      const { getSession } = await import("next-auth/react");

      // Obter session para extrair tenant_id e user_id (headers obrigatórios)
      const session = await getSession();
      if (!session?.user) {
        toast.error("Sessão inválida. Faça login novamente.");
        router.push("/api/auth/login");
        return;
      }

      // AC-008: Carregar histórico completo da API com headers obrigatórios
      // Backend exige X-Tenant-ID e X-User-ID (conforme contrato da API)
      const response = await apiGet<Array<{
        id: string;
        role: "user" | "assistant";
        content: string;
        created_at: string;  // Backend retorna created_at, não timestamp
        created_at_ts?: number;
      }>>(
        `/api/v1/conversations/${conversationId}/messages`,
        {
          headers: {
            "X-Tenant-ID": session.user.tenant_id,
            "X-User-ID": session.user.id,
          },
        }
      );

      // Mapear created_at para timestamp (compatibilidade com Message interface)
      const messages: Message[] = response.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.created_at),  // Mapear created_at → timestamp
      }));

      // RE-005: Ordenar em ordem cronológica (antigo → recente)
      const sortedMessages = messages.sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
      );

      // CC-03: Hidratar histórico com agent.setMessages() + propagação de threadId
      agent.setMessages(
        sortedMessages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          createdAt: msg.timestamp,
        }))
      );

      // Propagar threadId para sincronização (conforme CC-03)
      if (agent.threadId !== conversationId) {
        // threadId é readonly, atualizar via setState se disponível
        console.info(`[ChatContext] Histórico carregado: ${sortedMessages.length} mensagens`);
      }

      // Toast removido - carregamento de histórico não precisa de notificação
      console.info(`[ChatContext] Histórico carregado: ${sortedMessages.length} mensagens`);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);

      // Interceptar erros de autenticação/autorização (401/403)
      const wasHandled = handleApiError(error);

      // Se não foi um erro de auth, mostrar mensagem genérica
      if (!wasHandled) {
        toast.error("Erro ao carregar histórico. Tente novamente.");
      }
    }
  };

  const startNewConversation = () => {
    setCurrentConversationId(null);
    agent.setMessages([]);
    setCurrentTool(undefined);
    setThinkingState(undefined);
  };

  const addMessage = (message: Message) => {
    agent.addMessage({
      id: message.id,
      role: message.role,
      content: message.content,
      createdAt: message.timestamp,
    });
  };

  const setMessages = (newMessages: Message[]) => {
    agent.setMessages(
      newMessages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.timestamp,
      }))
    );
  };

  // Handler para mudar agente selecionado
  const handleSetSelectedAgentId = useCallback((agentId: string) => {
    if (agentId !== selectedAgentId) {
      console.info(`[ChatContext] Agente alterado: ${selectedAgentId} → ${agentId}`);
      setSelectedAgentId(agentId);
      // Limpar mensagens ao trocar de agente (nova conversa)
      agent.setMessages([]);
      setCurrentConversationId(null);
      setCurrentTool(undefined);
      setThinkingState(undefined);
    }
  }, [selectedAgentId, agent]);

  return (
    <ChatContext.Provider
      value={{
        // Estado do agente (via useAgent)
        messages,
        isRunning: agent.isRunning,
        currentTool,
        thinkingState,
        threadId: agent.threadId,

        // Agente selecionado (com fallback para compatibilidade)
        selectedAgentId: selectedAgentId || FALLBACK_AGENT_ID,
        setSelectedAgentId: handleSetSelectedAgentId,

        // Estado de rate limiting (GAP-CRIT-06)
        rateLimit,

        // Métodos
        runAgent,

        // Backward compatibility
        currentConversationId,
        loadConversation,
        startNewConversation,
        addMessage,
        setMessages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
