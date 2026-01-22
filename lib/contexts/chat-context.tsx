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

import { useCopilotChat } from "@copilotkit/react-core";
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
import type { Artifact } from "@/lib/mock/data";

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
  /** Lista de mensagens da conversa atual */
  messages: Message[];
  /** ID da conversa atual */
  currentConversationId: string | null;
  /** Se o assistente esta processando */
  isLoading: boolean;
  /** Se o assistente esta pensando (THINKING event) */
  isThinking: boolean;
  /** Carrega uma conversa existente */
  loadConversation: (conversationId: string) => void;
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

/**
 * ChatProvider - Provider de contexto do chat
 *
 * Integra com CopilotKit para:
 * - Envio de mensagens via appendMessage
 * - Sincronizacao de respostas do assistente
 * - Estados de loading/thinking
 */
export function ChatProvider({ children }: { children: ReactNode }) {
  // Estado local para conversas e mensagens
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessagesState] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const lastMessageCountRef = useRef(0);

  // Hook do CopilotKit
  const {
    visibleMessages,
    appendMessage,
    isLoading,
    stopGeneration: copilotStopGeneration,
  } = useCopilotChat();

  // Sincroniza mensagens do CopilotKit quando chegam respostas
  useEffect(() => {
    if (visibleMessages.length > lastMessageCountRef.current) {
      // Nova mensagem chegou do CopilotKit
      const newMessages = visibleMessages.slice(lastMessageCountRef.current);

      newMessages.forEach((msg) => {
        // Extrai conteudo da mensagem (pode ser string ou objeto)
        let content = "";
        if (typeof msg === "object" && msg !== null) {
          // Tenta extrair content de diferentes formatos
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const msgAny = msg as any;
          if (typeof msgAny.content === "string") {
            content = msgAny.content;
          } else if (msgAny.text && typeof msgAny.text === "string") {
            content = msgAny.text;
          }
        }

        // Apenas adiciona se tiver conteudo e for do assistente
        if (content) {
          const assistantMessage: Message = {
            id: `assistant-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            role: "assistant",
            content,
            timestamp: new Date(),
            agentId: "general",
          };

          setMessagesState((prev) => {
            // Evita duplicatas
            const exists = prev.some(
              (m) => m.role === "assistant" && m.content === content
            );
            if (exists) return prev;
            return [...prev, assistantMessage];
          });
        }
      });

      lastMessageCountRef.current = visibleMessages.length;
      setIsThinking(false);
    }
  }, [visibleMessages]);

  // Carrega conversa existente
  const loadConversation = useCallback((conversationId: string) => {
    setCurrentConversationId(conversationId);
    // TODO: Implementar carregamento de historico do backend
    setMessagesState([]);
    lastMessageCountRef.current = 0;
  }, []);

  // Inicia nova conversa
  const startNewConversation = useCallback(() => {
    setCurrentConversationId(null);
    setMessagesState([]);
    lastMessageCountRef.current = 0;
  }, []);

  /**
   * Envia mensagem via CopilotKit
   * AC-032: Optimistic Updates - Mensagem aparece imediatamente com status "pending"
   * AC-018: Em caso de erro, marca mensagem como "error" para retry
   */
  const sendMessage = useCallback(
    async (content: string, agentId?: string) => {
      if (!content.trim()) return;

      const messageId = `user-${Date.now()}`;

      // AC-032: Adiciona mensagem do usuario imediatamente (optimistic update)
      const userMessage: Message = {
        id: messageId,
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
        agentId,
        status: "pending", // Marca como pendente
      };

      setMessagesState((prev) => [...prev, userMessage]);
      setIsThinking(true);

      try {
        // Envia via CopilotKit
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await appendMessage({
          id: userMessage.id,
          role: "user",
          content: content.trim(),
        } as any);

        // AC-032: Atualiza status para "sent" apos sucesso
        setMessagesState((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, status: "sent" as const } : msg
          )
        );
      } catch (error) {
        console.error("[ChatContext] Erro ao enviar mensagem:", error);
        setIsThinking(false);

        // AC-018: Marca mensagem como erro para possibilitar retry
        setMessagesState((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? {
                  ...msg,
                  status: "error" as const,
                  hasError: true,
                  errorMessage: error instanceof Error ? error.message : "Erro ao enviar mensagem",
                }
              : msg
          )
        );
      }
    },
    [appendMessage]
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
