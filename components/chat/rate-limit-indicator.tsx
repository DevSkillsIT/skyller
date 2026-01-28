"use client";

import { AlertCircle, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRateLimit } from "@/lib/hooks/use-rate-limit";

/**
 * Componente que exibe indicador de rate limiting
 *
 * Sincronizado com headers do backend (X-RateLimit-*)
 * conforme especificação AC-012/RU-005 (30 RPM)
 *
 * @example
 * ```tsx
 * <RateLimitIndicator />
 * ```
 *
 * Estados:
 * - Oculto: Quando não está limitado e remaining > 5
 * - Aviso: Quando remaining <= 5 mas não limitado
 * - Bloqueado: Quando isLimited = true (429 recebido)
 */
export function RateLimitIndicator() {
  const { isLimited, remaining, limit, formattedTime } = useRateLimit();

  // Não exibir se tiver requisições suficientes disponíveis
  if (!isLimited && remaining > 5) {
    return null;
  }

  // Estado de bloqueio (429 recebido)
  if (isLimited) {
    return (
      <Alert variant="destructive" className="mb-4" data-testid="rate-limit-banner">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Limite de requisições atingido</AlertTitle>
        <AlertDescription>
          <p>
            Você atingiu o limite de <strong>{limit} requisições por minuto</strong>.
          </p>
          <div className="flex items-center gap-2 mt-2 font-medium">
            <Clock className="h-4 w-4" />
            <span>Aguarde {formattedTime} para enviar novas mensagens</span>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Estado de aviso (poucas requisições restantes)
  return (
    <Alert className="mb-4 border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
      <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
      <AlertTitle className="text-yellow-900 dark:text-yellow-100">
        Poucas requisições disponíveis
      </AlertTitle>
      <AlertDescription className="text-yellow-800 dark:text-yellow-200">
        <p>
          Você tem{" "}
          <strong>
            {remaining} de {limit} requisições
          </strong>{" "}
          restantes nesta janela de tempo.
        </p>
        <p className="text-xs mt-1 opacity-80">O limite será resetado em breve.</p>
      </AlertDescription>
    </Alert>
  );
}
