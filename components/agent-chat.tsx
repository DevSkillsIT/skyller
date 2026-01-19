"use client";

import { useCopilotChat } from "@copilotkit/react-core";
import { MessageRole, TextMessage } from "@copilotkit/runtime-client-gql";
import { Brain, Cpu, Send } from "lucide-react";
import { useState } from "react";
import { McpManager } from "@/components/mcp-manager";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { UploadManager } from "@/components/upload-manager";

export function AgentChat({ agentId }: { agentId: number }) {
  const {
    messages = [],
    appendMessage,
    isLoading,
  } = useCopilotChat({
    body: { agentId }, // Send agentId with every request
  });
  const [input, setInput] = useState("");
  const [model, setModel] = useState("gpt-4");
  const [thinkEffort, setThinkEffort] = useState([50]);

  const handleSend = () => {
    if (!input.trim()) return;

    appendMessage(
      new TextMessage({
        role: MessageRole.User,
        content: input,
      })
    );
    setInput("");
  };

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Header with Agent Info and Controls */}
      <header className="border-b border-zinc-800 p-3 md:p-4 bg-zinc-950">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold font-mono text-emerald-500">
              AGENT_{agentId.toString().padStart(2, "0")}
            </h1>
            <p className="text-xs text-zinc-500 mt-1 hidden md:block">
              Multi-Agent Management System • AG-UI Protocol
            </p>
          </div>

          <div className="flex items-center gap-1 md:gap-2 flex-wrap">
            {/* Model Selection */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs"
                >
                  <Cpu className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
                  <span className="hidden md:inline">Model</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-950 border-zinc-800 w-[90vw] max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-emerald-500">Select Model</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-zinc-400">AI Model</Label>
                    <Select value={model} onValueChange={setModel}>
                      <SelectTrigger className="bg-zinc-900 border-zinc-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800">
                        <SelectItem value="gpt-4">GPT-4</SelectItem>
                        <SelectItem value="gpt-3.5">GPT-3.5 Turbo</SelectItem>
                        <SelectItem value="claude-3">Claude 3</SelectItem>
                        <SelectItem value="llama-2">Llama 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Think Effort */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs"
                >
                  <Brain className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
                  <span className="hidden md:inline">Effort</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-950 border-zinc-800 w-[90vw] max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-emerald-500">Think Effort</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-zinc-400">Processing Intensity: {thinkEffort[0]}%</Label>
                    <Slider
                      value={thinkEffort}
                      onValueChange={setThinkEffort}
                      max={100}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Upload Manager */}
            <UploadManager />

            {/* MCP Manager */}
            <McpManager />
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-3 md:p-6">
        <div className="md:max-w-4xl md:mx-auto space-y-4 md:space-y-6">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-zinc-600">
              <div className="text-center">
                <div className="text-4xl md:text-6xl mb-4 font-mono text-emerald-500/20">///</div>
                <p className="text-xs md:text-sm">Start a conversation with Agent {agentId}</p>
                <p className="text-xs text-zinc-700 mt-2">Powered by Nexus Core + AG-UI Protocol</p>
              </div>
            </div>
          ) : (
            messages.map((message) => {
              if (message.role === MessageRole.Assistant) {
                return (
                  <div key={message.id} className="flex justify-start">
                    <div className="max-w-[85%] md:max-w-[80%] bg-zinc-900 border border-zinc-800 rounded-sm overflow-hidden">
                      <div className="text-xs font-mono p-3 border-b border-zinc-800 bg-zinc-950 text-emerald-500">
                        AGENT_{agentId.toString().padStart(2, "0")}
                      </div>
                      <div className="p-4 text-sm md:text-base leading-relaxed text-zinc-100 whitespace-pre-wrap">
                        {message.content}
                      </div>
                    </div>
                  </div>
                );
              }

              // User message
              return (
                <div key={message.id} className="flex justify-end">
                  <div className="max-w-[85%] md:max-w-[80%] p-3 md:p-4 rounded-sm bg-emerald-500 text-black">
                    <div className="text-xs font-mono mb-2 opacity-70">USER</div>
                    <div className="text-sm md:text-base leading-relaxed">{message.content}</div>
                  </div>
                </div>
              );
            })
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[85%] md:max-w-[80%] p-4 rounded-sm bg-zinc-900 border border-zinc-800">
                <div className="flex items-center gap-2 text-emerald-500">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse delay-75" />
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse delay-150" />
                  <span className="text-xs font-mono ml-2">Processing...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-zinc-800 p-3 md:p-4 bg-zinc-950">
        <div className="md:max-w-4xl md:mx-auto flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Enter your message..."
            className="min-h-[50px] md:min-h-[60px] resize-none bg-zinc-900 border-zinc-800 focus:border-emerald-500 text-sm"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            size="lg"
            className="bg-emerald-500 hover:bg-emerald-400 text-black"
            disabled={isLoading || !input.trim()}
          >
            <Send className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
