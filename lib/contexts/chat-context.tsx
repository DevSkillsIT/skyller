"use client";

import { createContext, type ReactNode, useContext, useState, useCallback, useEffect, useMemo } from "react";
import { applyPatch } from "fast-json-patch";
import { useAgent, UseAgentUpdate, type Message as AGUIMessage } from "@copilotkitnext/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Message } from "@/lib/mock/data";
import { useRateLimit } from "@/lib/hooks/use-rate-limit";
import { useEffectiveAgent } from "@/lib/hooks/use-effective-agent";
import { authPost } from "@/lib/api-client";
import { useSession } from "next-auth/react";
import type { ActivityState, StepState, ThinkingState, ToolCallState } from "@/lib/types/agui";

interface ChatContextType {
  // Estado do agente (acessado via useAgent)
  messages: Message[];
  isRunning: boolean;
  isConnected: boolean;
  reconnectAttempt: number;
  currentTool?: string;
  thinkingState?: string;
  thinking?: ThinkingState;
  steps: StepState[];
  toolCalls: ToolCallState[];
  activities: ActivityState[];
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

  // Estado local para tracking de eventos AG-UI (Thinking/Steps/Tool Calls/Activities)
  const [thinking, setThinking] = useState<ThinkingState | undefined>(undefined);
  const [steps, setSteps] = useState<StepState[]>([]);
  const [toolCallsById, setToolCallsById] = useState<Record<string, ToolCallState>>({});
  const [activitiesById, setActivitiesById] = useState<Record<string, ActivityState>>({});
  const [isConnected, setIsConnected] = useState(true);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  // GAP-IMP-01: Tracking de persistência de mensagens
  const [pendingPersistence, setPendingPersistence] = useState<Set<string>>(new Set());
  const [lastMessageCount, setLastMessageCount] = useState(0);

  // GAP-CRIT-06: Hook de rate limiting conectado ao backend (AC-012/RU-005)
  // Extrai headers X-RateLimit-* para sincronizar com 30 RPM do backend
  const rateLimit = useRateLimit();

  const toolCalls = useMemo(() => {
    return Object.values(toolCallsById).sort((a, b) => a.startedAt - b.startedAt);
  }, [toolCallsById]);

  const activities = useMemo(() => {
    return Object.values(activitiesById).sort((a, b) => a.updatedAt - b.updatedAt);
  }, [activitiesById]);

  const currentTool = useMemo(() => {
    return toolCalls.find((toolCall) => toolCall.status === "running")?.toolCallName;
  }, [toolCalls]);

  const thinkingState = useMemo(() => {
    if (!thinking || thinking.status !== "active") {
      return undefined;
    }
    return thinking.title || "Analisando...";
  }, [thinking]);

  // SPEC-AGENT-MANAGEMENT-001: Sincronizar com agente efetivo quando disponivel
  useEffect(() => {
    if (effectiveAgentId && !selectedAgentId) {
      console.info(`[ChatContext] Agente efetivo resolvido: ${effectiveAgentId}`);
      setSelectedAgentId(effectiveAgentId);
    }
  }, [effectiveAgentId, selectedAgentId]);

  // GAP-CRIT-01: Hook useAgent v2 com acesso completo a eventos AG-UI
  // Conforme documentação: https://docs.copilotkit.ai/reference/hooks/useAgent
  // SPEC-AGENT-MANAGEMENT-001: CopilotKit Runtime usa "skyller" como proxy fixo
  // O agente real (selectedAgentId) e passado via forwardedProps para o backend
  const { agent } = useAgent({
    agentId: FALLBACK_AGENT_ID,  // Proxy fixo - agente real via forwardedProps
    // Configurar updates para re-render apenas quando necessário
    updates: [
      UseAgentUpdate.OnMessagesChanged,
      UseAgentUpdate.OnStateChanged,
      UseAgentUpdate.OnRunStatusChanged,
    ],
  });

  const resetRunVisualization = useCallback(() => {
    setThinking(undefined);
    setSteps([]);
    setToolCallsById({});
    setActivitiesById({});
  }, []);

  const getToolStepName = useCallback((toolCallName?: string, toolCallId?: string) => {
    const safeName = toolCallName ? toolCallName.replace(/[\s:]+/g, "_") : "tool";
    if (!toolCallId) {
      return `tool:${safeName}`;
    }
    return `tool:${safeName}:${toolCallId}`;
  }, []);

  const cloneValue = useCallback((value: unknown) => {
    if (typeof structuredClone === "function") {
      return structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value));
  }, []);

  const finalizeRunVisualization = useCallback(() => {
    const now = Date.now();

    setThinking((prev) => {
      if (!prev) return prev;
      if (prev.status === "completed") return prev;
      return { ...prev, status: "completed", endedAt: prev.endedAt ?? now };
    });

    setSteps((prev) =>
      prev.map((step) =>
        step.status === "running" ? { ...step, status: "completed", endedAt: step.endedAt ?? now } : step
      )
    );

    setToolCallsById((prev) => {
      const next = { ...prev };
      for (const [id, toolCall] of Object.entries(next)) {
        if (toolCall.status === "running") {
          next[id] = { ...toolCall, status: "completed", endedAt: toolCall.endedAt ?? now };
        }
      }
      return next;
    });
  }, []);

  // GAP-CRIT-03: Subscription a eventos AG-UI (THINKING, STEPS, TOOL_CALL, ACTIVITY, RUN_ERROR)
  // Conforme AC-023, AC-024, AC-027
  useEffect(() => {
    const { unsubscribe } = agent.subscribe({
      onRunStartedEvent: () => {
        resetRunVisualization();
      },

      onRunErrorEvent: ({ event }) => {
        toast.error(`❌ Erro: ${event.message || "Erro desconhecido"}`);
      },

      onRunFinalized: () => {
        finalizeRunVisualization();

        // GAP-IMP-01: Validar persistência após finalização
        if (pendingPersistence.size > 0) {
          console.error(`[ChatContext] ❌ Falha na persistência: ${pendingPersistence.size} mensagens não confirmadas`);
          toast.error("Algumas mensagens podem não ter sido salvas. Tente reenviar.");

          // Limpar tracking para próxima execução
          setPendingPersistence(new Set());
        }
      },

      onStepStartedEvent: ({ event }) => {
        const startedAt = event.timestamp ?? Date.now();
        setSteps((prev) => {
          const existingIndex = prev.findIndex((step) => step.stepName === event.stepName);
          if (existingIndex >= 0) {
            const next = [...prev];
            next[existingIndex] = { ...next[existingIndex], status: "running", startedAt };
            return next;
          }
          return [...prev, { stepName: event.stepName, status: "running", startedAt }];
        });
      },

      onStepFinishedEvent: ({ event }) => {
        const endedAt = event.timestamp ?? Date.now();
        setSteps((prev) =>
          prev.map((step) =>
            step.stepName === event.stepName ? { ...step, status: "completed", endedAt } : step
          )
        );
      },

      onToolCallStartEvent: ({ event }) => {
        const startedAt = event.timestamp ?? Date.now();
        const eventAny = event as any;
        const stepName = getToolStepName(eventAny.toolCallName, eventAny.toolCallId);
        setToolCallsById((prev) => ({
          ...prev,
          [eventAny.toolCallId]: {
            toolCallId: eventAny.toolCallId,
            toolCallName: eventAny.toolCallName,
            status: "running",
            args: "",
            startedAt,
            parentMessageId: eventAny.parentMessageId,
          },
        }));
        setSteps((prev) => {
          const existingIndex = prev.findIndex((step) => step.stepName === stepName);
          if (existingIndex >= 0) {
            const next = [...prev];
            next[existingIndex] = { ...next[existingIndex], status: "running", startedAt };
            return next;
          }
          return [...prev, { stepName, status: "running", startedAt }];
        });
      },

      onToolCallArgsEvent: ({ event, toolCallName, partialToolCallArgs }) => {
        const eventAny = event as any;
        const delta = eventAny.delta ?? partialToolCallArgs ?? "";
        setToolCallsById((prev) => {
          const existing = prev[eventAny.toolCallId];
          const base: ToolCallState = existing ?? {
            toolCallId: eventAny.toolCallId,
            toolCallName: toolCallName || "unknown",
            status: "running",
            args: "",
            startedAt: event.timestamp ?? Date.now(),
          };
          return {
            ...prev,
            [eventAny.toolCallId]: {
              ...base,
              args: `${base.args}${delta}`,
            },
          };
        });
      },

      onToolCallEndEvent: ({ event }) => {
        const endedAt = event.timestamp ?? Date.now();
        const eventAny = event as any;
        const stepName = getToolStepName(eventAny.toolCallName, eventAny.toolCallId);
        setToolCallsById((prev) => {
          const existing = prev[eventAny.toolCallId];
          if (!existing) return prev;
          return {
            ...prev,
            [eventAny.toolCallId]: { ...existing, status: "completed", endedAt },
          };
        });
        setSteps((prev) =>
          prev.map((step) =>
            step.stepName === stepName ? { ...step, status: "completed", endedAt } : step
          )
        );
      },

      onToolCallResultEvent: ({ event }) => {
        const eventAny = event as any;
        const stepName = getToolStepName(eventAny.toolCallName, eventAny.toolCallId);
        setToolCallsById((prev) => {
          const existing = prev[eventAny.toolCallId];
          if (!existing) return prev;
          return {
            ...prev,
            [eventAny.toolCallId]: {
              ...existing,
              result: eventAny.content,
              status: existing.status === "failed" ? "failed" : "completed",
            },
          };
        });
        setSteps((prev) =>
          prev.map((step) =>
            step.stepName === stepName ? { ...step, status: "completed", endedAt: Date.now() } : step
          )
        );
      },

      onActivitySnapshotEvent: ({ event }) => {
        const updatedAt = event.timestamp ?? Date.now();
        const eventAny = event as any;
        setActivitiesById((prev) => ({
          ...prev,
          [event.messageId]: {
            messageId: event.messageId,
            activityType: event.activityType,
            content: event.content,
            status: eventAny.status,
            replace: event.replace,
            updatedAt,
          },
        }));
      },

      onActivityDeltaEvent: ({ event }) => {
        const updatedAt = event.timestamp ?? Date.now();
        setActivitiesById((prev) => {
          const existing = prev[event.messageId];
          if (!existing || !event.patch) return prev;
          try {
            const applied = applyPatch(
              cloneValue(existing.content ?? {}),
              event.patch,
              true,
              false
            );
            return {
              ...prev,
              [event.messageId]: {
                ...existing,
                content: applied.newDocument ?? existing.content,
                updatedAt,
              },
            };
          } catch (error) {
            console.warn("[ChatContext] Falha ao aplicar patch de activity:", error);
            return prev;
          }
        });
      },

      // Thinking ainda não possui handlers tipados no SDK atual.
      // Mantemos o onEvent para THINKING_* para garantir cobertura completa.
      onEvent: ({ event }) => {
        const timestamp = event.timestamp ?? Date.now();
        const eventAny = event as any;

        if (event.type === "THINKING_START") {
          setSteps((prev) => {
            const existingIndex = prev.findIndex((step) => step.stepName === "reasoning");
            if (existingIndex >= 0) {
              const next = [...prev];
              next[existingIndex] = {
                ...next[existingIndex],
                status: "running",
                startedAt: next[existingIndex].startedAt ?? timestamp,
              };
              return next;
            }
            return [...prev, { stepName: "reasoning", status: "running", startedAt: timestamp }];
          });
          setThinking((prev) => ({
            status: "active",
            content: prev?.status === "active" ? prev.content : "",
            title: eventAny.title || prev?.title || "Analisando...",
            startedAt: prev?.startedAt ?? timestamp,
          }));
        }

        if (event.type === "THINKING_TEXT_MESSAGE_START") {
          setSteps((prev) => {
            const existingIndex = prev.findIndex((step) => step.stepName === "reasoning");
            if (existingIndex >= 0) {
              const next = [...prev];
              next[existingIndex] = {
                ...next[existingIndex],
                status: "running",
                startedAt: next[existingIndex].startedAt ?? timestamp,
              };
              return next;
            }
            return [...prev, { stepName: "reasoning", status: "running", startedAt: timestamp }];
          });
          setThinking((prev) => ({
            status: "active",
            content: prev?.status === "active" ? prev.content : "",
            title: prev?.title || "Analisando...",
            startedAt: prev?.startedAt ?? timestamp,
          }));
        }

        if (event.type === "THINKING_TEXT_MESSAGE_CONTENT") {
          setThinking((prev) => ({
            status: "active",
            content: `${prev?.content ?? ""}${eventAny.delta ?? ""}`,
            title: prev?.title || "Analisando...",
            startedAt: prev?.startedAt ?? timestamp,
          }));
        }

        if (event.type === "THINKING_TEXT_MESSAGE_END" || event.type === "THINKING_END") {
          setSteps((prev) =>
            prev.map((step) =>
              step.stepName === "reasoning"
                ? { ...step, status: "completed", endedAt: step.endedAt ?? timestamp }
                : step
            )
          );
          setThinking((prev) => {
            if (!prev) {
              return {
                status: "completed",
                content: "",
                title: "Pensando",
                endedAt: timestamp,
              };
            }
            return { ...prev, status: "completed", endedAt: timestamp };
          });
        }

        if (event.type === "TOOL_CALL_CHUNK") {
          setToolCallsById((prev) => {
            const existing = prev[eventAny.toolCallId];
            const base: ToolCallState = existing ?? {
              toolCallId: eventAny.toolCallId,
              toolCallName: eventAny.toolCallName || "unknown",
              status: "running",
              args: "",
              startedAt: timestamp,
            };
            return {
              ...prev,
              [eventAny.toolCallId]: {
                ...base,
                args: `${base.args}${eventAny.delta ?? ""}`,
              },
            };
          });
        }
      },

      onMessagesChanged: ({ messages }) => {
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
  }, [
    agent,
    cloneValue,
    finalizeRunVisualization,
    getToolStepName,
    lastMessageCount,
    pendingPersistence.size,
    resetRunVisualization,
  ]);

  // GAP-CRIT-05: Reconexão SSE automática
  // useAgent já gerencia SSE connection com backoff exponencial
  // Subscription para eventos de conexão
  useEffect(() => {
    const { unsubscribe } = agent.subscribe({
      onCustomEvent: ({ event }) => {
        // Evento de reconexão SSE
        if (event.name === 'SSE_RECONNECTING') {
          setIsConnected(false);
          setReconnectAttempt((prev) => {
            const nextAttempt = prev + 1;
            toast.info(`🔄 Reconectando... (tentativa ${nextAttempt}/5)`);
            return nextAttempt;
          });
        }

        // Evento de reconexão bem-sucedida
        if (event.name === 'SSE_RECONNECTED') {
          setIsConnected(true);
          setReconnectAttempt(0);
          toast.success("✅ Conexão restabelecida");
        }

        // Evento de falha após max retries
        if (event.name === 'SSE_MAX_RETRIES_EXCEEDED') {
          setIsConnected(false);
          setReconnectAttempt(5);
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

  // Converter mensagens do AG-UI para formato local
  // Ignora mensagens "tool/system/developer" para evitar vazamento de payloads de tools na UI.
  const copilotMessages = agent.messages as unknown as AGUIMessage[];
  const messages: Message[] = copilotMessages
    .filter((msg) => (msg as any).role === "user" || (msg as any).role === "assistant")
    .map((msg) => ({
      id: (msg as any).id,
      role: (msg as any).role as "user" | "assistant",
      content: (msg as any).content,
      timestamp: new Date((msg as any).createdAt || Date.now()),
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
    (agent.addMessage as any)({
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
        // SPEC-AGENT-MANAGEMENT-001: Passar agente real via forwardedProps
        // CopilotKit usa "skyller" como proxy, backend usa agentId real
        await agent.runAgent({
          forwardedProps: {
            message,
            conversationId: currentConversationId,
            agent_id: selectedAgentId || FALLBACK_AGENT_ID,  // Agente real para backend (snake_case)
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
        const errorAny = error as any;
        const status = errorAny?.status || errorAny?.response?.status;
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
    resetRunVisualization();
  };

  const addMessage = (message: Message) => {
    (agent.addMessage as any)({
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
      resetRunVisualization();
    }
  }, [selectedAgentId, agent, resetRunVisualization]);

  return (
    <ChatContext.Provider
      value={{
        // Estado do agente (via useAgent)
        messages,
        isRunning: agent.isRunning,
        isConnected,
        reconnectAttempt,
        currentTool,
        thinkingState,
        thinking,
        steps,
        toolCalls,
        activities,
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
