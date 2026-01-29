"use client";

// Forçar renderização dinâmica (não pré-renderizar durante build)
export const dynamic = "force-dynamic";

import { ChatScreen } from "@/components/chat/chat-screen";

export default function ChatPage() {
  return <ChatScreen />;
}
