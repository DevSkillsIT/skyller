"use client";

import { createContext, type ReactNode, useContext, useState } from "react";
import type { Message } from "@/lib/mock/data";
import { mockMessages } from "@/lib/mock/data";

interface ChatContextType {
  messages: Message[];
  currentConversationId: string | null;
  loadConversation: (conversationId: string) => void;
  startNewConversation: () => void;
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  const loadConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    // Simula carregamento de mensagens da conversa
    setMessages(mockMessages);
  };

  const startNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
  };

  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        currentConversationId,
        loadConversation,
        startNewConversation,
        addMessage,
        setMessages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
