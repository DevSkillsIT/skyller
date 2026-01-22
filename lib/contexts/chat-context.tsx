"use client";

import { createContext, type ReactNode, useContext, useState, useCallback, useEffect } from "react";
import { useCopilotChat } from "@copilotkit/react-core";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Message } from "@/lib/mock/data";
import { useRateLimit } from "@/lib/hooks/use-rate-limit";
import { useSse } from "@/lib/hooks/use-sse";
import { useAgentEvents } from "@/lib/hooks/use-agent-events";
import { ApiError } from "@/lib/api-client";

// Interface do estado do agente com suporte a eventos AG-UI
// TODO: Quando @ag-ui/agno estiver disponível, migrar para useCoAgent
interface AgentState {
  messages: Message[];
  isRunning: boolean;
  currentTool?: string;
  thinkingState?: string;
}

interface ChatContextType {
  // Estado do agente
  messages: Message[];
  isRunning: boolean;
  currentTool?: string;
  thinkingState?: string;
  threadId?: string;

  // Estado da conexão SSE (GAP-CRIT-05: Reconexão SSE Automática)
  isConnected: boolean;
  reconnectAttempt: number;

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

export function ChatProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [agentState, setAgentState] = useState<AgentState>({
    messages: [],
    isRunning: false,
  });

  // GAP-CRIT-06: Hook de rate limiting conectado ao backend (AC-012/RU-005)
  // Extrai headers X-RateLimit-* para sincronizar com 30 RPM do backend
  const rateLimit = useRateLimit();

  // useCopilotChat - Stack atual
  // TODO: Migrar para useCoAgent quando API estiver disponível
  const copilotAgent = useCopilotChat({
    id: "nexus-agent",
    onFinish: () => {
      setAgentState(prev => ({ ...prev, isRunning: false }));
    },
  });

  // GAP-CRIT-03: Hook de processamento de eventos AG-UI
  // Processa THINKING_START/END, TOOL_CALL_START/END, RUN_ERROR
  // Conforme AC-023, AC-024, AC-027
  const agentEvents = useAgentEvents(copilotAgent as any);

  // Sincronizar eventos AG-UI com estado local
  useEffect(() => {
    setAgentState(prev => ({
      ...prev,
      currentTool: agentEvents.currentTool?.name,
      thinkingState: agentEvents.isThinking ? agentEvents.thinkingMessage : undefined,
    }));
  }, [agentEvents.currentTool, agentEvents.thinkingMessage, agentEvents.isThinking]);

  // GAP-CRIT-05: Hook de reconexão SSE automática
  // Backoff exponencial: 1s → 2s → 4s → 8s → 16s
  // Máximo 5 tentativas conforme RE-004
  const {
    isConnected,
    reconnectAttempt,
    connect,
    disconnect,
  } = useSse({
    url: "/api/copilot",
    maxRetries: 5,
    initialRetryDelay: 1000,
    onReconnecting: (attempt, maxRetries) => {
      // AC-007: Notificar usuário durante reconexão
      toast.info(`🔄 Reconectando... (tentativa ${attempt}/${maxRetries})`);
    },
    onReconnected: () => {
      toast.success("✅ Conexão restabelecida");
    },
    onMaxRetriesExceeded: () => {
      toast.error("❌ Conexão perdida. Recarregue a página.", {
        duration: Infinity,
        action: {
          label: "Recarregar",
          onClick: () => window.location.reload(),
        },
      });
    },
    onError: (error) => {
      console.error("[ChatContext] SSE error:", error);
    },
  });

  // Conectar automaticamente ao montar
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  // Função para tratar erros de autenticação/autorização da API
  // GAP-IMP-06: Interceptar 401/403 e redirecionar conforme RC-001
  const handleApiError = useCallback((error: Error | Response) => {
    // Se for ApiError (erro customizado do api-client)
    if (error instanceof ApiError) {
      if (error.status === 401) {
        // Token expirado ou inválido
        toast.error("Sessão expirada. Redirecionando para login...");
        router.push("/api/auth/login");
        return true;
      }

      if (error.status === 403) {
        // Sem permissão (tenant não selecionado ou permissões insuficientes)
        toast.error("Sem permissão. Verifique suas permissões ou selecione um tenant.");
        router.push("/dashboard"); // Redireciona para dashboard onde pode selecionar tenant
        return true;
      }
    }

    // Se for uma Response direta, verificar status code
    if (error instanceof Response) {
      if (error.status === 401) {
        // Token expirado ou inválido
        toast.error("Sessão expirada. Redirecionando para login...");
        router.push("/api/auth/login");
        return true;
      }

      if (error.status === 403) {
        // Sem permissão (tenant não selecionado ou permissões insuficientes)
        toast.error("Sem permissão. Verifique suas permissões ou selecione um tenant.");
        router.push("/dashboard"); // Redireciona para dashboard onde pode selecionar tenant
        return true;
      }
    }

    // Se for um Error genérico, verificar se contém informações de status
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      if (errorMessage.includes("unauthorized") || errorMessage.includes("401")) {
        toast.error("Sessão expirada. Redirecionando para login...");
        router.push("/api/auth/login");
        return true;
      }

      if (errorMessage.includes("forbidden") || errorMessage.includes("403")) {
        toast.error("Sem permissão. Verifique suas permissões ou selecione um tenant.");
        router.push("/dashboard");
        return true;
      }
    }

    return false;
  }, [router]);

  // Extrair propriedades do copilotAgent
  const {
    visibleMessages,
    appendMessage,
    isLoading,
  } = copilotAgent;

  // Sincronizar mensagens do CopilotKit com estado local
  useState(() => {
    const copilotMessages: Message[] = visibleMessages.map((msg) => ({
      id: msg.id,
      role: msg.role as "user" | "assistant",
      content: msg.content,
      timestamp: new Date(msg.createdAt || Date.now()),
    }));
    setAgentState(prev => ({ ...prev, messages: copilotMessages }));
  });

  // Método para executar o agente com nova mensagem
  const runAgent = async (message: string) => {
    setAgentState(prev => ({ ...prev, isRunning: true }));

    try {
      await appendMessage({
        content: message,
        role: "user",
      });
    } catch (error) {
      console.error("Erro ao executar agente:", error);

      // Interceptar erros de autenticação/autorização (401/403)
      const wasHandled = handleApiError(error as Error);

      // Se não foi um erro de auth, mostrar mensagem genérica
      if (!wasHandled) {
        toast.error("Erro ao enviar mensagem. Tente novamente.");
      }

      setAgentState(prev => ({ ...prev, isRunning: false }));
    }
  };

  // Métodos legados para backward compatibility
  const loadConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    // TODO: Carregar mensagens da conversa do backend
  };

  const startNewConversation = () => {
    setCurrentConversationId(null);
    setAgentState({
      messages: [],
      isRunning: false,
      currentTool: undefined,
      thinkingState: undefined,
    });
  };

  const addMessage = (message: Message) => {
    setAgentState(prev => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  };

  const setMessages = (messages: Message[]) => {
    setAgentState(prev => ({
      ...prev,
      messages,
    }));
  };

  return (
    <ChatContext.Provider
      value={{
        // Estado do agente
        messages: agentState.messages,
        isRunning: agentState.isRunning || isLoading,
        currentTool: agentState.currentTool,
        thinkingState: agentState.thinkingState,
        threadId: undefined, // TODO: Adicionar quando API suportar

        // Estado da conexão SSE (GAP-CRIT-05)
        isConnected,
        reconnectAttempt,

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
