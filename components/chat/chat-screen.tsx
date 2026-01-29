"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessages } from "@/components/chat/chat-messages";
import { useChat } from "@/lib/contexts/chat-context";

/**
 * ChatScreen - UI principal do chat (mensagens + input)
 * Reutilizado em / e /chat/[id]
 */
export function ChatScreen() {
  const {
    messages,
    rateLimit,
    runAgent,
    isRunning,
    selectedAgentId,
    setSelectedAgentId,
    thinking,
    steps,
    toolCalls,
    activities,
    hasOlderMessages,
    isLoadingOlder,
    loadOlderMessages,
    isLoadingHistory,
  } = useChat();
  const [input, setInput] = useState("");
  const [isAgentsGalleryOpen, setIsAgentsGalleryOpen] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isRunning || isLoadingHistory) return;

    // GAP-CRIT-07: Validar limite de 10.000 caracteres (AC-010/RC-003)
    const MAX_MESSAGE_LENGTH = 10000;
    if (input.trim().length > MAX_MESSAGE_LENGTH) {
      toast.error(
        `Mensagem muito longa! Máximo ${MAX_MESSAGE_LENGTH.toLocaleString()} caracteres.`
      );
      return;
    }

    const message = input.trim();
    setInput("");

    try {
      await runAgent(message);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast.error("Erro ao enviar mensagem. Tente novamente.");
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Chat Messages */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <ChatMessages
          messages={messages}
          isLoading={isRunning}
          selectedAgentId={selectedAgentId}
          thinking={thinking}
          steps={steps}
          toolCalls={toolCalls}
          activities={activities}
          hasOlderMessages={hasOlderMessages}
          isLoadingOlder={isLoadingOlder}
          onLoadOlder={loadOlderMessages}
        />
      </div>

      {/* Chat Input */}
      <ChatInput
        input={input}
        setInput={setInput}
        onSend={handleSend}
        isLoading={isRunning}
        isLoadingHistory={isLoadingHistory}
        rateLimit={rateLimit}
        selectedAgentId={selectedAgentId}
        setSelectedAgentId={setSelectedAgentId}
        isAgentsGalleryOpen={isAgentsGalleryOpen}
        setIsAgentsGalleryOpen={setIsAgentsGalleryOpen}
      />
    </div>
  );
}
