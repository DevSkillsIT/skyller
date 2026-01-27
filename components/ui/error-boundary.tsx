"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // Aqui você poderia enviar o erro para um serviço de monitoramento
    // como Sentry, LogRocket, etc.
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Fallback customizado se fornecido
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback padrão
      return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <div className="max-w-md w-full space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Ops! Algo deu errado</AlertTitle>
              <AlertDescription>
                Ocorreu um erro inesperado. Por favor, tente novamente ou recarregue a página.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button onClick={this.handleRetry} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar novamente
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()} className="flex-1">
                Recarregar página
              </Button>
            </div>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-4 p-4 bg-muted rounded-lg">
                <summary className="text-sm font-medium cursor-pointer mb-2">
                  Detalhes do erro (desenvolvimento)
                </summary>
                <pre className="text-xs overflow-auto text-muted-foreground">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook para error boundary funcional (para componentes cliente)
export function useErrorHandler() {
  return (error: Error, errorInfo?: string) => {
    console.error("Error caught by error handler:", error, errorInfo);

    // Aqui você poderia enviar para um serviço de monitoramento
    // reportError(error, errorInfo);
  };
}

// Componente de erro para situações específicas
interface ErrorFallbackProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

export function ErrorFallback({
  title = "Ops! Algo deu errado",
  description = "Ocorreu um erro inesperado. Por favor, tente novamente.",
  onRetry,
  showRetry = true,
}: ErrorFallbackProps) {
  return (
    <div className="flex items-center justify-center min-h-[200px] p-4">
      <div className="max-w-md w-full space-y-4 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        {showRetry && onRetry && (
          <Button onClick={onRetry} className="mx-auto">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        )}
      </div>
    </div>
  );
}
