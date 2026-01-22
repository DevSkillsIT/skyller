/**
 * ChatErrorBoundary - Error boundary para capturar erros no chat
 * @spec SPEC-COPILOT-INTEGRATION-001
 * @acceptance AC-038: ChatErrorBoundary Criado
 *
 * Captura erros de componentes filhos e exibe UI de fallback
 * para prevenir crashes completos da aplicacao.
 */
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ChatErrorBoundaryProps {
  /** Componentes filhos a serem protegidos */
  children: ReactNode;
  /** Callback opcional quando ocorre erro */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ChatErrorBoundaryState {
  /** Indica se um erro foi capturado */
  hasError: boolean;
  /** Erro capturado */
  error: Error | null;
}

/**
 * Error Boundary para o chat que captura erros de renderizacao
 * e exibe uma UI de fallback ao inves de crashar a aplicacao.
 *
 * @example
 * ```tsx
 * <ChatErrorBoundary onError={(error) => console.error(error)}>
 *   <ChatInterface />
 * </ChatErrorBoundary>
 * ```
 */
export class ChatErrorBoundary extends Component<ChatErrorBoundaryProps, ChatErrorBoundaryState> {
  constructor(props: ChatErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  /**
   * Atualiza o estado quando um erro e capturado
   */
  static getDerivedStateFromError(error: Error): ChatErrorBoundaryState {
    return { hasError: true, error };
  }

  /**
   * Loga o erro para debugging e monitoramento
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log estruturado para debugging
    console.error("[ChatErrorBoundary] Erro capturado:", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });

    // Callback opcional para integracao com servicos de monitoramento
    this.props.onError?.(error, errorInfo);
  }

  /**
   * Handler para recarregar a pagina
   */
  handleReload = (): void => {
    window.location.reload();
  };

  /**
   * Handler para tentar novamente sem recarregar
   */
  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>

          <h2 className="text-xl font-semibold mb-2">Ocorreu um erro no chat</h2>

          <p className="text-muted-foreground mb-6 max-w-md">
            Algo deu errado ao carregar o chat. Tente recarregar a pagina ou entre em contato com o
            suporte se o problema persistir.
          </p>

          {/* Detalhes do erro em desenvolvimento */}
          {process.env.NODE_ENV === "development" && this.state.error && (
            <div className="mb-6 p-4 bg-muted rounded-lg text-left max-w-md w-full">
              <p className="text-xs font-mono text-destructive break-all">
                {this.state.error.message}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={this.handleRetry}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
            <Button onClick={this.handleReload}>Recarregar Pagina</Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ChatErrorBoundary;
