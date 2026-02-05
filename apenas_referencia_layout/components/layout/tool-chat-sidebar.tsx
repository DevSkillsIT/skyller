"use client"

import React from "react"

import { useState, useRef, useEffect } from "react"
import {
  Send,
  Loader2,
  Bot,
  User,
  X,
  MessageSquare,
  Minimize2,
  Maximize2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface ToolChatSidebarProps {
  toolName: string
  toolDescription: string
  isOpen: boolean
  onToggle: () => void
  className?: string
}

export function ToolChatSidebar({
  toolName,
  toolDescription,
  isOpen,
  onToggle,
  className,
}: ToolChatSidebarProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: `m${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Simular resposta do agente
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: `m${Date.now() + 1}`,
        role: "assistant",
        content: `Entendi! Vou ajudar com "${input.trim()}" no ${toolName}. Esta funcionalidade sera integrada com o CopilotKit para permitir controle via IA.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1500)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!isOpen) {
    return (
      <Button
        onClick={onToggle}
        className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg z-50"
      >
        <MessageSquare className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <div
      className={cn(
        "flex flex-col border-l border-border bg-background transition-all duration-300",
        isMinimized ? "w-[48px]" : "w-[320px]",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        {!isMinimized && (
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#0A2463] to-[#6366f1] text-white">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-medium">{toolName} Copilot</h3>
              <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                {toolDescription}
              </p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? (
              <Maximize2 className="h-4 w-4" />
            ) : (
              <Minimize2 className="h-4 w-4" />
            )}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggle}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <ScrollArea className="flex-1 p-3" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="text-center py-8 px-4">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-accent/10 mb-3">
                  <Bot className="w-5 h-5 text-accent" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Como posso ajudar com {toolName}?
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-2",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role === "assistant" && (
                      <Avatar className="h-6 w-6 flex-shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-[#0A2463] to-[#6366f1] text-white text-[10px]">
                          AI
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm max-w-[85%]",
                        message.role === "user"
                          ? "bg-accent text-accent-foreground"
                          : "bg-muted"
                      )}
                    >
                      {message.content}
                    </div>
                    {message.role === "user" && (
                      <Avatar className="h-6 w-6 flex-shrink-0">
                        <AvatarFallback className="bg-muted text-[10px]">
                          <User className="h-3 w-3" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-2">
                    <Avatar className="h-6 w-6 flex-shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-[#0A2463] to-[#6366f1] text-white text-[10px]">
                        AI
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-lg px-3 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="p-3 border-t border-border">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Pergunte sobre ${toolName}...`}
                className="min-h-[40px] max-h-[100px] resize-none pr-10 py-2 text-sm"
                disabled={isLoading}
              />
              <Button
                size="icon"
                className="absolute right-1.5 bottom-1.5 h-7 w-7"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
