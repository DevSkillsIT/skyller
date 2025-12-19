/**
 * SPEC-006-skyller - Phase 5: US3 - Human-in-the-Loop (HITL)
 * T030: Tipos TypeScript para HITL
 *
 * Define os tipos para requisições e respostas de confirmação HITL.
 */

/**
 * Status de uma solicitação HITL
 */
export type HITLStatus = "pending" | "approved" | "rejected" | "timeout"

/**
 * Ação do usuário em resposta a um HITL
 */
export type HITLAction = "approve" | "reject"

/**
 * Requisição de confirmação HITL enviada pelo agente
 */
export interface HITLRequest {
  /** ID único da requisição HITL */
  id: string

  /** ID da tool call que requer confirmação */
  toolCallId: string

  /** Nome da tool sendo executada */
  toolName: string

  /** Argumentos da tool call */
  toolArgs: Record<string, unknown>

  /** Data/hora de criação da solicitação */
  createdAt: Date

  /** Data/hora limite para resposta (timeout após 5 minutos) */
  timeoutAt: Date

  /** Status atual da solicitação */
  status: HITLStatus
}

/**
 * Resposta do usuário para uma solicitação HITL
 */
export interface HITLResponse {
  /** Ação do usuário (aprovar ou rejeitar) */
  action: HITLAction

  /** Razão da rejeição (opcional, requerido se action = "reject") */
  reason?: string
}

/**
 * Resultado da ação HITL processada pelo backend
 */
export interface HITLResult {
  /** Indica se a ação foi processada com sucesso */
  success: boolean

  /** ID da tool call que foi confirmada/rejeitada */
  toolCallId: string

  /** Status final após processamento */
  status: "approved" | "rejected" | "timeout"

  /** Mensagem de erro (se success = false) */
  error?: string
}

/**
 * Props para o componente ConfirmationModal
 */
export interface ConfirmationModalProps {
  /** Requisição HITL a ser exibida */
  request: HITLRequest

  /** Callback quando usuário aprova */
  onApprove: (toolCallId: string) => Promise<void>

  /** Callback quando usuário rejeita ou timeout */
  onReject: (toolCallId: string, reason?: string) => Promise<void>

  /** Indica se usuário tem permissão para aprovar (admin/operator) */
  canApprove: boolean

  /** Indica se modal está visível */
  isOpen: boolean

  /** Callback para fechar modal */
  onClose: () => void
}
