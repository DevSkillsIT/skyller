"use client";

// Forçar renderização dinâmica (não pré-renderizar durante build)
export const dynamic = "force-dynamic";

import { useState } from "react";
import { toast } from "sonner";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessages } from "@/components/chat/chat-messages";
import { useChat } from "@/lib/contexts/chat-context";

export default function ChatPage() {
  // GAP-CRIT-01: selectedAgentId sincronizado com chat-context para useAgent dinâmico
  const {
    messages,
    addMessage,
    setMessages,
    rateLimit,
    runAgent,
    isRunning,
    selectedAgentId,
    setSelectedAgentId,
    thinking,
    steps,
    toolCalls,
    activities,
  } = useChat();
  const [input, setInput] = useState("");
  const [isAgentsGalleryOpen, setIsAgentsGalleryOpen] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isRunning) return;

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
      // GAP-CRIT-01: Usar runAgent do ChatContext (useAgent v2)
      await runAgent(message);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast.error("Erro ao enviar mensagem. Tente novamente.");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Messages */}
      <ChatMessages
        messages={messages}
        isLoading={isRunning}
        selectedAgentId={selectedAgentId}
        thinking={thinking}
        steps={steps}
        toolCalls={toolCalls}
        activities={activities}
      />

      {/* Chat Input */}
      <ChatInput
        input={input}
        setInput={setInput}
        onSend={handleSend}
        isLoading={isRunning}
        rateLimit={rateLimit}
        selectedAgentId={selectedAgentId}
        setSelectedAgentId={setSelectedAgentId}
        isAgentsGalleryOpen={isAgentsGalleryOpen}
        setIsAgentsGalleryOpen={setIsAgentsGalleryOpen}
      />
    </div>
  );
}
