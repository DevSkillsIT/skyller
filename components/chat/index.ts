/**
 * Chat Components - Exports centralizados
 * @spec SPEC-COPILOT-INTEGRATION-001
 *
 * Exporta todos os componentes do modulo de chat:
 * - Message: Mensagem individual com Markdown
 * - MessageList: Lista de mensagens com auto-scroll
 * - ChatInput: Area de entrada estilo Gemini
 * - ChatErrorBoundary: Error boundary para o chat
 * - ToolCallDisplay: Exibicao de chamadas de ferramentas
 */

// Re-export de tipos uteis
export type { ErrorInfo } from "react";
// Re-export de tipos do contexto
export type { Artifact } from "@/lib/contexts/chat-context";
export { ChatErrorBoundary } from "./chat-error-boundary";
export {
  ChatInput,
  type ChatInputProps,
} from "./chat-input";
// Componentes principais
export { Message, type Message as MessageData, type MessageProps } from "./message";
export { type ConversationSuggestion, MessageList, type MessageListProps } from "./message-list";
export {
  ActiveToolCalls,
  type ActiveToolCallsProps,
  ToolCallDisplay,
  type ToolCallDisplayProps,
} from "./tool-call-display";
