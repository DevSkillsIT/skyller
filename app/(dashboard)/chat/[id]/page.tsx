/**
 * Chat History Page - Carrega conversa existente pelo ID
 * @spec SPEC-CHAT-HISTORY-INTEGRATION-001
 * @task T3.3: Criar rota /chat/[id]
 */
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useChat } from "@/lib/contexts/chat-context";

export default function ChatHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const { loadConversation, currentConversationId, isLoadingHistory } =
    useChat();

  const conversationId = params.id as string;

  useEffect(() => {
    // Evitar reload se ja estiver na mesma conversa
    if (conversationId && conversationId !== currentConversationId) {
      loadConversation(conversationId).catch((error) => {
        console.error("[ChatHistoryPage] Erro ao carregar conversa:", error);
        // Redirecionar para home se conversa nao existir
        router.push("/");
      });
    }
  }, [conversationId, currentConversationId, loadConversation, router]);

  // Mostrar loading enquanto carrega historico
  if (isLoadingHistory) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-muted-foreground">
            Carregando conversa...
          </p>
        </div>
      </div>
    );
  }

  // A UI do chat e renderizada pelo layout pai
  // Esta pagina apenas carrega a conversa e mostra loading
  return null;
}
