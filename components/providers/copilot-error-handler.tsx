"use client";

import { useEffect } from "react";
import { useCopilotKit } from "@copilotkitnext/react";
import { toast } from "sonner";

/**
 * Error codes do CopilotKitCore (espelhado de @copilotkitnext/core)
 *
 * Definido inline para evitar dependencia direta do pacote core,
 * que nao e re-exportado pelo @copilotkitnext/react.
 */
const CopilotKitCoreErrorCode = {
  RUNTIME_INFO_FETCH_FAILED: "runtime_info_fetch_failed",
  AGENT_CONNECT_FAILED: "agent_connect_failed",
  AGENT_RUN_FAILED: "agent_run_failed",
  AGENT_RUN_FAILED_EVENT: "agent_run_failed_event",
  AGENT_RUN_ERROR_EVENT: "agent_run_error_event",
  TOOL_ARGUMENT_PARSE_FAILED: "tool_argument_parse_failed",
  TOOL_HANDLER_FAILED: "tool_handler_failed",
} as const;

type ErrorCode = (typeof CopilotKitCoreErrorCode)[keyof typeof CopilotKitCoreErrorCode];

/**
 * CopilotErrorHandler - Componente para captura de erros do CopilotKit
 *
 * Usa o subscriber pattern do @copilotkitnext/core para capturar erros
 * de forma tipada e granular, sem necessidade de Copilot Cloud.
 *
 * Error codes disponiveis:
 * - RUNTIME_INFO_FETCH_FAILED: Falha ao conectar com o runtime
 * - AGENT_CONNECT_FAILED: Falha ao conectar com o agente
 * - AGENT_RUN_FAILED: Falha na execucao do agente
 * - AGENT_RUN_FAILED_EVENT: Evento de falha do agente (AG-UI)
 * - AGENT_RUN_ERROR_EVENT: Evento de erro do agente (AG-UI RunError)
 * - TOOL_ARGUMENT_PARSE_FAILED: Falha ao parsear argumentos da tool
 * - TOOL_HANDLER_FAILED: Falha no handler da tool
 */
export function CopilotErrorHandler(): null {
  const { copilotkit } = useCopilotKit();

  useEffect(() => {
    const subscription = copilotkit.subscribe({
      onError: (event) => {
        // Log detalhado em desenvolvimento
        if (process.env.NODE_ENV === "development") {
          console.error("[CopilotKit Error]", {
            code: event.code,
            message: event.error.message,
            context: event.context,
          });
        }

        // Mapear codigo para mensagem amigavel
        const message = getErrorMessage(
          event.code as ErrorCode,
          event.error,
          event.context
        );

        // Exibir toast de erro
        toast.error("Erro ao executar agente", {
          description: message,
          duration: 5000,
        });
      },
    });

    return () => subscription.unsubscribe();
  }, [copilotkit]);

  // Componente invisivel - apenas captura erros
  return null;
}

/**
 * Mapeia codigos de erro para mensagens amigaveis ao usuario.
 */
function getErrorMessage(
  code: ErrorCode,
  error: Error,
  context: Record<string, unknown>
): string {
  switch (code) {
    // Erros de conexao
    case CopilotKitCoreErrorCode.RUNTIME_INFO_FETCH_FAILED:
      return "Nao foi possivel conectar ao servidor. Verifique sua conexao.";

    case CopilotKitCoreErrorCode.AGENT_CONNECT_FAILED:
      return "Falha ao conectar com o agente. Tente novamente.";

    // Erros de execucao do agente
    case CopilotKitCoreErrorCode.AGENT_RUN_FAILED:
      return "Falha na execucao do agente. Tente novamente.";

    case CopilotKitCoreErrorCode.AGENT_RUN_FAILED_EVENT:
      return "O agente encontrou um problema durante a execucao.";

    case CopilotKitCoreErrorCode.AGENT_RUN_ERROR_EVENT:
      // Este e o erro "Run ended without emitting a terminal event"
      return "Conexao interrompida. Tente novamente.";

    // Erros de tools
    case CopilotKitCoreErrorCode.TOOL_ARGUMENT_PARSE_FAILED:
      return "Erro ao processar parametros da ferramenta.";

    case CopilotKitCoreErrorCode.TOOL_HANDLER_FAILED: {
      const toolName = context?.toolName as string | undefined;
      return toolName
        ? `Erro ao executar ferramenta "${toolName}".`
        : "Erro ao executar ferramenta.";
    }

    // Fallback
    default:
      return error.message || "Ocorreu um erro inesperado.";
  }
}
