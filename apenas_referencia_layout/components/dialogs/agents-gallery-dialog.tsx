"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Bot, BarChart3, Code2, FileText, DollarSign, Scale, Palette, Sparkles, Globe, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"

const globalAgents = [
  {
    id: "general",
    name: "Assistente Geral",
    description: "Assistente versátil para tarefas gerais",
    icon: Bot,
    category: "Geral",
    tasksCompleted: 1240,
  },
  {
    id: "data-analyst",
    name: "Analista de Dados",
    description: "Especialista em análise e visualização de dados",
    icon: BarChart3,
    category: "Dados",
    tasksCompleted: 856,
  },
  {
    id: "code-assistant",
    name: "Assistente de Código",
    description: "Auxilia com programação e debugging",
    icon: Code2,
    category: "Desenvolvimento",
    tasksCompleted: 632,
  },
  {
    id: "doc-analyst",
    name: "Analista de Documentos",
    description: "Analisa e resume documentos complexos",
    icon: FileText,
    category: "Documentos",
    tasksCompleted: 445,
  },
  {
    id: "financial",
    name: "Analista Financeiro",
    description: "Especialista em análises financeiras e projeções",
    icon: DollarSign,
    category: "Finanças",
    tasksCompleted: 321,
  },
]

const companyAgents = [
  {
    id: "legal-compliance",
    name: "Compliance Legal",
    description: "Especialista em regulamentações e compliance da empresa",
    icon: Scale,
    category: "Legal",
    tasksCompleted: 128,
  },
  {
    id: "brand-designer",
    name: "Designer de Marca",
    description: "Cria conteúdo visual seguindo guidelines da marca",
    icon: Palette,
    category: "Design",
    tasksCompleted: 97,
  },
  {
    id: "custom-ai",
    name: "AI Personalizado",
    description: "Agente customizado para fluxos internos",
    icon: Sparkles,
    category: "Personalizado",
    tasksCompleted: 54,
  },
]

interface AgentsGalleryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectAgent?: (agentId: string) => void
  selectedAgent?: string
}

export function AgentsGalleryDialog({ 
  open, 
  onOpenChange, 
  onSelectAgent,
  selectedAgent 
}: AgentsGalleryDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"global" | "company">("global")

  const currentAgents = activeTab === "global" ? globalAgents : companyAgents
  const filteredAgents = currentAgents.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelectAgent = (agentId: string) => {
    onSelectAgent?.(agentId)
    onOpenChange(false)
  }

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
            <DialogDescription>
              Escolha o agente especializado para sua tarefa
            </DialogDescription>
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
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "global" | "company")} className="flex-1 flex flex-col overflow-hidden min-h-0">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {filteredAgents.map((agent) => {
                const AgentIcon = agent.icon
                const isSelected = selectedAgent === agent.id
                return (
                  <button
                    key={agent.id}
                    onClick={() => handleSelectAgent(agent.id)}
                    className={cn(
                      "relative p-5 rounded-xl border-2 text-left hover:shadow-md transition-all",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <Sparkles className="h-3 w-3" />
                      </div>
                    )}
                    
                    <div className="flex items-start gap-4 mb-3">
                      <div className={cn(
                        "p-2.5 rounded-lg shrink-0",
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                      )}>
                        <AgentIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">{agent.name}</h4>
                        <Badge variant="secondary" className="text-[10px]">
                          {agent.category}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">
                      {agent.description}
                    </p>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-3 border-t">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                      <span>{agent.tasksCompleted.toLocaleString()} tarefas</span>
                    </div>
                  </button>
                )
              })}
            </div>
            
            {filteredAgents.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Bot className="h-10 w-10 mb-3 opacity-50" />
                <p>Nenhum agente encontrado</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="company" className="flex-1 mt-0 overflow-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {filteredAgents.map((agent) => {
                const AgentIcon = agent.icon
                const isSelected = selectedAgent === agent.id
                return (
                  <button
                    key={agent.id}
                    onClick={() => handleSelectAgent(agent.id)}
                    className={cn(
                      "relative p-5 rounded-xl border-2 text-left hover:shadow-md transition-all",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <Sparkles className="h-3 w-3" />
                      </div>
                    )}
                    
                    <div className="flex items-start gap-4 mb-3">
                      <div className={cn(
                        "p-2.5 rounded-lg shrink-0",
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                      )}>
                        <AgentIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">{agent.name}</h4>
                        <Badge variant="secondary" className="text-[10px]">
                          {agent.category}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">
                      {agent.description}
                    </p>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-3 border-t">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                      <span>{agent.tasksCompleted.toLocaleString()} tarefas</span>
                    </div>
                  </button>
                )
              })}
            </div>
            
            {filteredAgents.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Bot className="h-10 w-10 mb-3 opacity-50" />
                <p>Nenhum agente encontrado</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
