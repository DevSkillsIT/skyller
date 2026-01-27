"use client";

import { Bot, Building2, Cpu, Globe, Loader2, Search, Sparkles } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type Agent, useAgents } from "@/lib/hooks/use-agents";
import { cn } from "@/lib/utils";

interface AgentsGalleryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectAgent?: (agentId: string) => void;
  selectedAgent?: string;
}

export function AgentsGalleryDialog({
  open,
  onOpenChange,
  onSelectAgent,
  selectedAgent,
}: AgentsGalleryDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"global" | "company">("global");

  // Hook para buscar agentes da API
  const { globalAgents, companyAgents, isLoading, error } = useAgents();

  const currentAgents = activeTab === "global" ? globalAgents : companyAgents;
  const filteredAgents = currentAgents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectAgent = (agentId: string) => {
    onSelectAgent?.(agentId);
    onOpenChange(false);
  };

  // Renderiza um card de agente (DRY - evita duplicacao)
  const renderAgentCard = (agent: Agent) => {
    const AgentIcon = agent.icon;
    const isSelected = selectedAgent === agent.id;
    return (
      <button
        key={agent.id}
        onClick={() => handleSelectAgent(agent.id)}
        disabled={!agent.isActive}
        className={cn(
          "relative p-5 rounded-xl border-2 text-left hover:shadow-md transition-all",
          isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
          !agent.isActive && "opacity-60 cursor-not-allowed hover:shadow-none"
        )}
      >
        {isSelected && (
          <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <Sparkles className="h-3 w-3" />
          </div>
        )}

        {/* Status badge (ativo/inativo) */}
        <div className="absolute top-3 right-3">
          <Badge
            variant={agent.isActive ? "default" : "secondary"}
            className={cn(
              "text-[10px]",
              agent.isActive
                ? "bg-green-500/10 text-green-600 border-green-200"
                : "bg-gray-100 text-gray-500"
            )}
          >
            {agent.isActive ? "Ativo" : "Inativo"}
          </Badge>
        </div>

        <div className="flex items-start gap-4 mb-3">
          <div
            className={cn(
              "p-2.5 rounded-lg shrink-0",
              isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
            )}
          >
            <AgentIcon className="h-5 w-5" />
          </div>
          <div className="pr-16">
            <h4 className="font-semibold mb-1">{agent.name}</h4>
            <div className="flex items-center gap-1.5">
              <Badge variant="secondary" className="text-[10px]">
                {agent.category}
              </Badge>
              {agent.model && (
                <Badge variant="outline" className="text-[10px] gap-1">
                  <Cpu className="h-2.5 w-2.5" />
                  {agent.model}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{agent.description}</p>

        {/* Informacoes tecnicas do agente */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground pt-3 border-t">
          <div
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              agent.isActive ? "bg-green-500" : "bg-gray-400"
            )}
          ></div>
          <span>{agent.tasksCompleted.toLocaleString()} tarefas</span>
          <span className="mx-1">•</span>
          <span>{agent.capabilities.length} ferramentas</span>
          {agent.knowledgeBases.length > 0 && (
            <>
              <span className="mx-1">•</span>
              <span>{agent.knowledgeBases.length} bases</span>
            </>
          )}
          {agent.temperature !== undefined && (
            <>
              <span className="mx-1">•</span>
              <span title="Temperatura do modelo">T: {agent.temperature}</span>
            </>
          )}
        </div>
      </button>
    );
  };

  // Estado de loading
  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <Loader2 className="h-10 w-10 mb-3 animate-spin" />
      <p>Carregando agentes...</p>
    </div>
  );

  // Estado de erro
  const renderError = () => (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <Bot className="h-10 w-10 mb-3 opacity-50" />
      <p>Erro ao carregar agentes</p>
      <p className="text-xs mt-1">{error}</p>
    </div>
  );

  // Estado vazio
  const renderEmpty = () => (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <Bot className="h-10 w-10 mb-3 opacity-50" />
      <p>Nenhum agente encontrado</p>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 gap-0 flex flex-col"
        style={{ maxWidth: "1200px", width: "90vw", height: "80vh" }}
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b shrink-0">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Galeria de Agentes</DialogTitle>
            <DialogDescription>Escolha o agente especializado para sua tarefa</DialogDescription>
          </DialogHeader>

          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar agentes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "global" | "company")}
          className="flex-1 flex flex-col overflow-hidden min-h-0"
        >
          <div className="px-8 py-4 border-b shrink-0">
            <TabsList>
              <TabsTrigger value="global" className="gap-2">
                <Globe className="h-4 w-4" />
                Globais ({globalAgents.length})
              </TabsTrigger>
              <TabsTrigger value="company" className="gap-2">
                <Building2 className="h-4 w-4" />
                Empresa ({companyAgents.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="global" className="flex-1 mt-0 overflow-auto">
            {isLoading ? (
              renderLoading()
            ) : error ? (
              renderError()
            ) : filteredAgents.length === 0 ? (
              renderEmpty()
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                {filteredAgents.map(renderAgentCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="company" className="flex-1 mt-0 overflow-auto">
            {isLoading ? (
              renderLoading()
            ) : error ? (
              renderError()
            ) : filteredAgents.length === 0 ? (
              renderEmpty()
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                {filteredAgents.map(renderAgentCard)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
