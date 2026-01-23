"use client";

import { Loader2, WifiOff, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Props do componente ConnectionStatus
 */
export interface ConnectionStatusProps {
  /** Se está conectado ao SSE */
  isConnected: boolean;

  /** Tentativa atual de reconexão (0 se conectado) */
  reconnectAttempt: number;

  /** Máximo de tentativas (padrão: 5) */
  maxRetries?: number;

  /** Classe CSS adicional */
  className?: string;
}

/**
 * Componente de feedback visual para status da conexão SSE
 *
 * Implementado conforme GAP-CRIT-05 e AC-007 da SPEC-COPILOT-INTEGRATION-001
 *
 * Estados:
 * - Conectado: Não exibe nada (conexão estável)
 * - Reconectando: Exibe spinner e tentativa atual
 * - Falha total: Exibe botão para recarregar página
 *
 * @example
 * ```tsx
 * const { isConnected, reconnectAttempt } = useChat();
 *
 * return (
 *   <ConnectionStatus
 *     isConnected={isConnected}
 *     reconnectAttempt={reconnectAttempt}
 *     maxRetries={5}
 *   />
 * );
 * ```
 */
export function ConnectionStatus({
  isConnected,
  reconnectAttempt,
  maxRetries = 5,
  className,
}: ConnectionStatusProps) {
  // Se conectado, não exibe nada
  if (isConnected && reconnectAttempt === 0) {
    return null;
  }

  // Se ainda está tentando reconectar
  if (reconnectAttempt > 0 && reconnectAttempt < maxRetries) {
    return (
      <div
        className={cn(
          "connection-status",
          "bg-yellow-50 dark:bg-yellow-950/20",
          "border border-yellow-200 dark:border-yellow-800",
          "rounded-lg p-3 shadow-sm",
          className
        )}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-3">
          <Loader2
            className="h-5 w-5 animate-spin text-yellow-600 dark:text-yellow-400"
            aria-hidden="true"
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Reconectando ao servidor...
            </p>
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-0.5">
              Tentativa {reconnectAttempt} de {maxRetries}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Se excedeu o máximo de tentativas
  if (reconnectAttempt >= maxRetries) {
    return (
      <div
        className={cn(
          "connection-status",
          "bg-red-50 dark:bg-red-950/20",
          "border border-red-200 dark:border-red-800",
          "rounded-lg p-4 shadow-sm",
          className
        )}
        role="alert"
        aria-live="assertive"
      >
        <div className="flex items-start gap-3">
          <WifiOff
            className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5"
            aria-hidden="true"
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              Conexão perdida
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              Não foi possível reconectar ao servidor após {maxRetries} tentativas.
            </p>
            <button
              onClick={() => window.location.reload()}
              className={cn(
                "mt-3 px-3 py-1.5",
                "text-xs font-medium",
                "text-red-700 dark:text-red-300",
                "bg-red-100 dark:bg-red-900/30",
                "border border-red-200 dark:border-red-700",
                "rounded-md",
                "hover:bg-red-200 dark:hover:bg-red-900/50",
                "transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              )}
              type="button"
            >
              Recarregar página
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Estado inicial (conectando)
  return (
    <div
      className={cn(
        "connection-status",
        "bg-blue-50 dark:bg-blue-950/20",
        "border border-blue-200 dark:border-blue-800",
        "rounded-lg p-3 shadow-sm",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <Loader2
          className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400"
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
          Conectando ao servidor...
        </p>
      </div>
    </div>
  );
}

/**
 * Variante compacta do ConnectionStatus para exibir na barra de status
 */
export function ConnectionStatusCompact({
  isConnected,
  reconnectAttempt,
  className,
}: Omit<ConnectionStatusProps, "maxRetries">) {
  // Se conectado, exibe ícone de conectado discreto
  if (isConnected && reconnectAttempt === 0) {
    return (
      <div
        className={cn("flex items-center gap-1.5 text-green-600 dark:text-green-400", className)}
        title="Conectado"
        role="status"
      >
        <Wifi className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Conectado</span>
      </div>
    );
  }

  // Se reconectando
  if (reconnectAttempt > 0) {
    return (
      <div
        className={cn("flex items-center gap-1.5 text-yellow-600 dark:text-yellow-400", className)}
        title={`Reconectando (tentativa ${reconnectAttempt})`}
        role="status"
      >
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        <span className="text-xs font-medium">{reconnectAttempt}</span>
        <span className="sr-only">Reconectando, tentativa {reconnectAttempt}</span>
      </div>
    );
  }

  // Conectando
  return (
    <div
      className={cn("flex items-center gap-1.5 text-blue-600 dark:text-blue-400", className)}
      title="Conectando"
      role="status"
    >
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      <span className="sr-only">Conectando</span>
    </div>
  );
}
