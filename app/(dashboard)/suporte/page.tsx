"use client";
/* ESSA É PENAS UMA PAGINA DE TESTES */
import { useState } from "react";
import { toast } from "sonner";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessages } from "@/components/chat/chat-messages";
import { useChat } from "@/lib/contexts/chat-context";
import { Headset } from "lucide-react";

export default function SuportePage() {
    const {
        messages,
        runAgent,
        isRunning,
        selectedAgentId,
        setSelectedAgentId,
        rateLimit,
        thinking,
        steps,
        toolCalls,
        activities,
    } = useChat();

    const [input, setInput] = useState("");
    const [isAgentsGalleryOpen, setIsAgentsGalleryOpen] = useState(false);

    const handleSend = async () => {
        if (!input.trim() || isRunning) return;

        const MAX_MESSAGE_LENGTH = 10000;
        if (input.trim().length > MAX_MESSAGE_LENGTH) {
            toast.error(`Mensagem muito longa! Máximo ${MAX_MESSAGE_LENGTH.toLocaleString()} caracteres.`);
            return;
        }

        const message = input.trim();
        setInput("");

        try {
            await runAgent(message);
        } catch (error) {
            console.error("Erro ao enviar mensagem:", error);
            toast.error("Erro ao enviar mensagem para o suporte.");
        }
    };

    return (
        <div className="flex flex-col h-full bg-background/50 backdrop-blur-sm">
            {/* Header específico da página de Suporte */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-background">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                    <Headset className="w-5 h-5" />
                </div>
                <div>
                    <h1 className="text-lg font-bold leading-none">Central de Suporte Skyller</h1>
                    <p className="text-sm text-muted-foreground mt-1">Como podemos ajudar você hoje?</p>
                </div>
            </div>

            {/* Reutilizando as mensagens do chat */}
            <div className="flex-1 overflow-hidden">
                <ChatMessages
                    messages={messages}
                    isLoading={isRunning}
                    selectedAgentId={selectedAgentId}
                    thinking={thinking}
                    steps={steps}
                    toolCalls={toolCalls}
                    activities={activities}
                />
            </div>

            {/* Reutilizando o input do chat */}
            <div className="border-t border-border bg-background">
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
        </div>
    );
}
