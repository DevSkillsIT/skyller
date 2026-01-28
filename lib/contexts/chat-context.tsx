/**
 * ChatContext - Contexto de chat integrado com CopilotKit
 * @spec SPEC-COPILOT-INTEGRATION-001
 * @acceptance AC-003: useCopilotChat Hook Integrado
 * @acceptance AC-004: sendMessage Substitui Mock
 * @acceptance AC-032: Optimistic Updates - Mensagem aparece imediatamente
 * @acceptance AC-018: Retry Logic para Mensagens Falhas
 *
 * Fornece gerenciamento de estado do chat com integracao CopilotKit:
 * - Mensagens gerenciadas localmente com sincronizacao CopilotKit
 * - sendMessage via CopilotKit appendMessage
 * - Estados de loading e thinking
 * - Gerenciamento de conversas
 * - Atualizacoes otimistas com rollback em caso de erro
 */
"use client";

import { type Message as AGUIMessage, UseAgentUpdate, useAgent } from "@copilotkitnext/react";
import { applyPatch } from "fast-json-patch";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { authGet, authPost } from "@/lib/api-client";
import { useEffectiveAgent } from "@/lib/hooks/use-effective-agent";
import { useRateLimit } from "@/lib/hooks/use-rate-limit";
import { useSessionContext } from "@/lib/hooks/use-session-context";
import type { Message } from "@/lib/mock/data";
import type { ActivityState, StepState, ThinkingState, ToolCallState } from "@/lib/types/agui";

// Re-export do tipo Artifact para uso externo
export type { Artifact };

// Status de envio da mensagem para optimistic updates
export type MessageStatus = "pending" | "sent" | "error";

// Tipo de mensagem unificado
export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  agentId?: string;
  artifacts?: Artifact[];
  isStreaming?: boolean;
  /** AC-032: Status de envio da mensagem */
  status?: MessageStatus;
  /** AC-018: Indica se a mensagem falhou e pode ser retentada */
  hasError?: boolean;
  /** Mensagem de erro (se houver) */
  errorMessage?: string;
}

// Interface do contexto
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
  regenerateAssistantResponse: (assistantMessageId: string) => Promise<void>;

  // Métodos legados (backward compatibility)
  currentConversationId: string | null;
  /** Se o assistente esta processando */
  isLoading: boolean;
  /** Se o assistente esta pensando (THINKING event) */
  isThinking: boolean;
  /** Carrega uma conversa existente (AC-008: busca historico do backend) */
  loadConversation: (conversationId: string) => Promise<void>;
  /** Inicia nova conversa */
  startNewConversation: () => void;
  /** Envia mensagem (integrado com CopilotKit) */
  sendMessage: (content: string, agentId?: string) => Promise<void>;
  /** Adiciona mensagem manualmente */
  addMessage: (message: Message) => void;
  /** Define mensagens diretamente */
  setMessages: (messages: Message[]) => void;
  /** Regenera ultima resposta */
  regenerateLastResponse: () => Promise<void>;
  /** Para geracao de resposta */
  stopGeneration: () => void;
  /** AC-018: Retenta envio de mensagem com erro */
  retryMessage: (messageId: string, content: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// SPEC-AGENT-MANAGEMENT-001: Fallback agent ID quando nenhum agente disponivel
const FALLBACK_AGENT_ID = "skyller";

export function ChatProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessagesState] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const lastMessageCountRef = useRef(0);

  // SPEC-AGENT-MANAGEMENT-001: Resolver agente efetivo via hierarquia
  // User > Project > Workspace > Tenant > Fallback
  const { agentId: effectiveAgentId, isLoading: isLoadingAgent } = useEffectiveAgent();

  // GAP-CONTEXT-HEADERS: Gerenciamento centralizado de contexto para headers de API
  // Inclui sessionId, conversationId, threadId, workspaceId, agentId
  const {
    apiContext,
    setConversationId: setSessionConversationId,
    setThreadId: setSessionThreadId,
    setAgentId: setSessionAgentId,
  } = useSessionContext();

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
  const wasRunningRef = useRef(false);

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

  // GAP-CONTEXT-HEADERS: Sincronizar contexto de sessao com IDs atuais
  // Propaga conversationId e agentId para headers de API
  useEffect(() => {
    setSessionConversationId(currentConversationId);
  }, [currentConversationId, setSessionConversationId]);

  useEffect(() => {
    setSessionAgentId(selectedAgentId || FALLBACK_AGENT_ID);
  }, [selectedAgentId, setSessionAgentId]);

  // GAP-CRIT-01: Hook useAgent v2 com acesso completo a eventos AG-UI
  // Conforme documentação: https://docs.copilotkit.ai/reference/hooks/useAgent
  // SPEC-AGENT-MANAGEMENT-001: CopilotKit Runtime usa "skyller" como proxy fixo
  // O agente real (selectedAgentId) e passado via forwardedProps para o backend
  const { agent } = useAgent({
    agentId: FALLBACK_AGENT_ID, // Proxy fixo - agente real via forwardedProps
    // Configurar updates para re-render apenas quando necessário
    updates: [
      UseAgentUpdate.OnMessagesChanged,
      UseAgentUpdate.OnStateChanged,
      UseAgentUpdate.OnRunStatusChanged,
    ],
  });

  // GAP-CONTEXT-HEADERS: Sincronizar threadId do AG-UI com contexto de sessao
  useEffect(() => {
    if (agent.threadId) {
      setSessionThreadId(agent.threadId);
    }
  }, [agent.threadId, setSessionThreadId]);

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
        step.status === "running"
          ? { ...step, status: "completed", endedAt: step.endedAt ?? now }
          : step
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

      // GAP-IMP-06: Handler para erros de transporte HTTP (401/403/5xx)
      // onRunFailed é chamado pelo AG-UI quando runHttpRequest falha
      onRunFailed: ({ error }) => {
        const status = (error as any)?.status;

        if (status === 401) {
          toast.error("Sessão expirada. Redirecionando para login...");
          router.push("/api/auth/signin");
          return;
        }

        if (status === 403) {
          toast.error("Sem permissão. Verifique suas permissões.");
          router.push("/dashboard");
          return;
        }

        // Erros HTTP genéricos
        if (status >= 400) {
          toast.error(`❌ Erro ${status}: ${error.message || "Erro de comunicação"}`);
          return;
        }

        toast.error(`❌ Erro: ${error.message || "Erro desconhecido"}`);
      },

      // RUN_ERROR via SSE (erros do backend durante execução)
      onRunErrorEvent: ({ event }) => {
        const eventAny = event as any;
        if (eventAny.code === "401" || event.message?.includes("401")) {
          toast.error("Sessão expirada. Redirecionando para login...");
          router.push("/api/auth/signin");
          return;
        }
        toast.error(`❌ Erro: ${event.message || "Erro desconhecido"}`);
      },

      onRunFinalized: () => {
        finalizeRunVisualization();

        // GAP-IMP-01: Validar persistência após finalização
        if (pendingPersistence.size > 0) {
          console.error(
            `[ChatContext] ❌ Falha na persistência: ${pendingPersistence.size} mensagens não confirmadas`
          );
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
            step.stepName === stepName
              ? { ...step, status: "completed", endedAt: Date.now() }
              : step
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

  // Fallback: garantir finalização da visualização quando isRunning cair
  useEffect(() => {
    if (wasRunningRef.current && !agent.isRunning) {
      finalizeRunVisualization();
    }
    wasRunningRef.current = agent.isRunning;
  }, [agent.isRunning, finalizeRunVisualization]);

  // GAP-CRIT-05: Reconexão SSE automática
  // useAgent já gerencia SSE connection com backoff exponencial
  // Subscription para eventos de conexão
  useEffect(() => {
    const { unsubscribe } = agent.subscribe({
      onCustomEvent: ({ event }) => {
        // Evento de reconexão SSE
        if (event.name === "SSE_RECONNECTING") {
          setIsConnected(false);
          setReconnectAttempt((prev) => {
            const nextAttempt = prev + 1;
            toast.info(`🔄 Reconectando... (tentativa ${nextAttempt}/5)`);
            return nextAttempt;
          });
        }

        // Evento de reconexão bem-sucedida
        if (event.name === "SSE_RECONNECTED") {
          setIsConnected(true);
          setReconnectAttempt(0);
          toast.success("✅ Conexão restabelecida");
        }

        // Evento de falha após max retries
        if (event.name === "SSE_MAX_RETRIES_EXCEEDED") {
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
  const handleApiError = useCallback(
    (error: any) => {
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
    },
    [router]
  );

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
  const runAgentInternal = async (
    message: string,
    options: { appendUserMessage?: boolean } = {}
  ) => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000; // 2 segundos
    const appendUserMessage = options.appendUserMessage ?? true;

    // Helper para sleep
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    // Adicionar mensagem antes de tentar executar
    if (appendUserMessage) {
      const messageId = crypto.randomUUID();
      (agent.addMessage as any)({
        id: messageId,
        role: "user",
        content: message,
        createdAt: new Date(),
      });

      // GAP-IMP-01: Marcar mensagem como pendente de persistência
      setPendingPersistence(new Set([messageId]));
    }

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
            agent_id: selectedAgentId || FALLBACK_AGENT_ID, // Agente real para backend (snake_case)
          },
        });

        // SPEC-AGENT-MANAGEMENT-001: Registrar uso do agente apos sucesso
        // GAP-CONTEXT-HEADERS: Incluir contexto completo nos headers
        const usedAgentId = selectedAgentId || FALLBACK_AGENT_ID;
        try {
          await authPost(
            `/api/v1/agents/${usedAgentId}/track-usage`,
            session,
            {},
            {
              context: apiContext,
            }
          );
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
          await sleep(RETRY_DELAY * 2 ** (attempt - 1)); // Backoff exponencial: 2s → 4s → 8s
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

  const runAgent = async (message: string) => {
    await runAgentInternal(message, { appendUserMessage: true });
  };

  // Métodos legados para backward compatibility
  // GAP-IMP-03: Carregar histórico ordenado (AC-008/RE-005)
  const loadConversation = async (conversationId: string) => {
    setCurrentConversationId(conversationId);

    try {
      // Verificar sessao valida
      if (!session?.user) {
        toast.error("Sessão inválida. Faça login novamente.");
        router.push("/api/auth/login");
        return;
      }

      // AC-008: Carregar histórico completo da API com headers obrigatórios
      // GAP-CONTEXT-HEADERS: Incluir contexto completo nos headers
      // Backend exige X-Tenant-ID, X-User-ID + contexto (conversationId, sessionId, etc.)
      const response = await authGet<
        Array<{
          id: string;
          role: "user" | "assistant";
          content: string;
          created_at: string; // Backend retorna created_at, não timestamp
          created_at_ts?: number;
        }>
      >(`/api/v1/conversations/${conversationId}/messages`, session, {
        context: {
          ...apiContext,
          conversationId, // Usar conversationId do parametro (mais atual)
        },
      });

      // Mapear created_at para timestamp (compatibilidade com Message interface)
      const messages: Message[] = response.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.created_at), // Mapear created_at → timestamp
      }));

      // RE-005: Ordenar em ordem cronológica (antigo → recente)
      const sortedMessages = messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

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

    try {
      // Buscar historico de mensagens do backend via API proxy
      const response = await fetch(`/api/conversations/${conversationId}/messages`);

      if (!response.ok) {
        console.error("[ChatContext] Erro ao carregar historico:", response.status);
        setMessagesState([]);
        lastMessageCountRef.current = 0;
        return;
      }

      const historyMessages = await response.json();

      // Converter mensagens do backend para o formato do contexto
      const formattedMessages: Message[] = historyMessages.map(
        (msg: { id: string; role: string; content: string; created_at?: string }) => ({
          id: msg.id,
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content,
          timestamp: msg.created_at ? new Date(msg.created_at) : new Date(),
          status: "sent" as const,
        })
      );

      // Hidratar o contexto com o historico
      setMessagesState(formattedMessages);
      lastMessageCountRef.current = formattedMessages.length;

      console.log(`[ChatContext] Historico carregado: ${formattedMessages.length} mensagens`);
    } catch (error) {
      console.error("[ChatContext] Erro ao carregar historico:", error);
      setMessagesState([]);
      lastMessageCountRef.current = 0;
    }
  }, []);

  // Inicia nova conversa
  const startNewConversation = useCallback(() => {
    setCurrentConversationId(null);
    agent.setMessages([]);
    resetRunVisualization();
  };

  const applyMessages = useCallback(
    (newMessages: Message[]) => {
      agent.setMessages(
        newMessages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          createdAt: msg.timestamp,
        }))
      );
    },
    [agent]
  );

  const addMessage = (message: Message) => {
    (agent.addMessage as any)({
      id: message.id,
      role: message.role,
      content: message.content,
      createdAt: message.timestamp,
    });
  };

  const setMessages = (newMessages: Message[]) => {
    applyMessages(newMessages);
  };

  const regenerateAssistantResponse = async (assistantMessageId: string) => {
    if (agent.isRunning) {
      toast.info("Aguarde a resposta atual finalizar antes de regenerar.");
      return;
    }

    const assistantIndex = messages.findIndex((message) => message.id === assistantMessageId);
    if (assistantIndex === -1) {
      toast.error("Não foi possível localizar a resposta para regenerar.");
      return;
    }

    if (assistantIndex !== messages.length - 1) {
      toast.info("Regeneração disponível apenas para a última resposta.");
      return;
    }

    const userIndex = [...messages]
      .slice(0, assistantIndex)
      .reverse()
      .findIndex((message) => message.role === "user");

    if (userIndex === -1) {
      toast.error("Não foi possível localizar a mensagem original.");
      return;
    }

    const originalUserMessage = messages[assistantIndex - 1 - userIndex];

    // Remove a última resposta antes de regenerar para evitar duplicidade visual.
    applyMessages(messages.slice(0, assistantIndex));

    await runAgentInternal(originalUserMessage.content, { appendUserMessage: false });
  };

  // Handler para mudar agente selecionado
  const handleSetSelectedAgentId = useCallback(
    (agentId: string) => {
      if (agentId !== selectedAgentId) {
        console.info(`[ChatContext] Agente alterado: ${selectedAgentId} → ${agentId}`);
        setSelectedAgentId(agentId);
        // Limpar mensagens ao trocar de agente (nova conversa)
        agent.setMessages([]);
        setCurrentConversationId(null);
        resetRunVisualization();
      }
    },
    [selectedAgentId, agent, resetRunVisualization]
  );

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
        regenerateAssistantResponse,

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

  /**
   * AC-018: Retenta envio de mensagem com erro
   */
  const retryMessage = useCallback(
    async (messageId: string, content: string) => {
      // Remove a mensagem antiga com erro
      setMessagesState((prev) => prev.filter((msg) => msg.id !== messageId));

      // Reenvia a mensagem
      await sendMessage(content);
    },
    [sendMessage]
  );

  // Adiciona mensagem manualmente (para compatibilidade)
  const addMessage = useCallback((message: Message) => {
    setMessagesState((prev) => [...prev, message]);
  }, []);

  // Define mensagens diretamente
  const setMessages = useCallback((newMessages: Message[]) => {
    setMessagesState(newMessages);
    lastMessageCountRef.current = 0;
  }, []);

  // Regenera ultima resposta
  const regenerateLastResponse = useCallback(async () => {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMessage) {
      // Remove ultima resposta do assistente
      setMessagesState((prev) => {
        const lastAssistantIndex = prev.findLastIndex((m) => m.role === "assistant");
        if (lastAssistantIndex > -1) {
          return prev.slice(0, lastAssistantIndex);
        }
        return prev;
      });

      // Reenvia a mensagem
      await sendMessage(lastUserMessage.content, lastUserMessage.agentId);
    }
  }, [messages, sendMessage]);

  // Para geracao
  const stopGeneration = useCallback(() => {
    copilotStopGeneration();
    setIsThinking(false);
  }, [copilotStopGeneration]);

  const value = useMemo(
    () => ({
      messages,
      currentConversationId,
      isLoading,
      isThinking,
      loadConversation,
      startNewConversation,
      sendMessage,
      addMessage,
      setMessages,
      regenerateLastResponse,
      stopGeneration,
      retryMessage,
    }),
    [
      messages,
      currentConversationId,
      isLoading,
      isThinking,
      loadConversation,
      startNewConversation,
      sendMessage,
      addMessage,
      setMessages,
      regenerateLastResponse,
      stopGeneration,
      retryMessage,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

/**
 * Hook para acessar o contexto do chat
 *
 * @throws Error se usado fora do ChatProvider
 *
 * @example
 * ```tsx
 * const { messages, sendMessage, isLoading } = useChat();
 *
 * const handleSend = async () => {
 *   await sendMessage("Ola, como posso ajudar?");
 * };
 * ```
 */
export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
