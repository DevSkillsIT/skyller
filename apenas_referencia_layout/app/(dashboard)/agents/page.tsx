"use client"

import { useState } from "react"
import {
  Bot,
  BarChart3,
  DollarSign,
  Code,
  FileText,
  Search,
  Zap,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  Activity,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

// Mock agents data
const mockAgents = [
  {
    id: "router",
    name: "Router",
    icon: Zap,
    status: "idle" as const,
    description: "Roteia mensagens para agentes especializados",
    tasksProcessed: 24,
  },
  {
    id: "web-search",
    name: "Web Search",
    icon: Search,
    status: "working" as const,
    description: "Pesquisa informacoes na web",
    tasksProcessed: 8,
    currentTask: "Buscando dados de mercado...",
  },
  {
    id: "data-analyst",
    name: "Analista de Dados",
    icon: BarChart3,
    status: "done" as const,
    description: "Analisa dados e gera visualizacoes",
    tasksProcessed: 15,
  },
  {
    id: "writer",
    name: "Writer Agent",
    icon: FileText,
    status: "working" as const,
    description: "Redige documentos e relatorios",
    tasksProcessed: 12,
    currentTask: "Gerando relatorio executivo...",
  },
  {
    id: "code-assistant",
    name: "Code Assistant",
    icon: Code,
    status: "waiting" as const,
    description: "Auxilia com programacao",
    tasksProcessed: 6,
  },
  {
    id: "financial",
    name: "Especialista Financeiro",
    icon: DollarSign,
    status: "waiting" as const,
    description: "Analises financeiras e projecoes",
    tasksProcessed: 3,
  },
]

const mockActivityLog = [
  { time: "14:32:45", agent: "Router", action: "Recebeu nova mensagem do usuario", type: "info" },
  { time: "14:32:46", agent: "Router", action: "Detectou intencao: analise de mercado", type: "info" },
  { time: "14:32:46", agent: "Router", action: "Delegou para Web Search e Data Analyst", type: "success" },
  { time: "14:32:47", agent: "Web Search", action: "Iniciou busca por dados de mercado", type: "info" },
  { time: "14:32:48", agent: "Data Analyst", action: "Aguardando dados do Web Search", type: "warning" },
  { time: "14:33:15", agent: "Web Search", action: "Encontrou 12 fontes relevantes", type: "success" },
  { time: "14:33:16", agent: "Data Analyst", action: "Processando dados recebidos", type: "info" },
  { time: "14:33:45", agent: "Data Analyst", action: "Analise concluida com sucesso", type: "success" },
  { time: "14:33:46", agent: "Router", action: "Delegou para Writer Agent", type: "info" },
  { time: "14:33:47", agent: "Writer Agent", action: "Gerando relatorio executivo", type: "info" },
]

const statusConfig = {
  idle: { color: "bg-slate-400", label: "Idle", textColor: "text-slate-600" },
  working: { color: "bg-amber-500 animate-pulse", label: "Processando", textColor: "text-amber-600" },
  done: { color: "bg-green-500", label: "Concluido", textColor: "text-green-600" },
  waiting: { color: "bg-slate-300", label: "Aguardando", textColor: "text-slate-500" },
  error: { color: "bg-red-500", label: "Erro", textColor: "text-red-600" },
}

function AgentNode({ agent, isCenter = false }: { agent: typeof mockAgents[0]; isCenter?: boolean }) {
  const Icon = agent.icon
  const status = statusConfig[agent.status]

  return (
    <Card className={cn(
      "relative transition-all duration-300",
      isCenter ? "border-2 border-primary shadow-lg" : "hover:shadow-md",
      agent.status === "working" && "ring-2 ring-amber-500/50"
    )}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            isCenter ? "bg-primary text-primary-foreground" : "bg-muted"
          )}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">{agent.name}</span>
              <div className={cn("h-2 w-2 rounded-full", status.color)} />
            </div>
            <p className="text-xs text-muted-foreground truncate">{agent.description}</p>
          </div>
        </div>
        
        {agent.currentTask && (
          <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-950/20 rounded-md">
            <p className="text-xs text-amber-700 dark:text-amber-400">{agent.currentTask}</p>
          </div>
        )}
        
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{agent.tasksProcessed} tarefas</span>
          <Badge variant="outline" className={cn("text-xs", status.textColor)}>
            {status.label}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

function ConnectionLine({ from, to, active = false }: { from: string; to: string; active?: boolean }) {
  return (
    <div className={cn(
      "absolute h-0.5 bg-gradient-to-r",
      active 
        ? "from-amber-500 to-amber-300 animate-pulse" 
        : "from-border to-transparent"
    )} />
  )
}

export default function MultiAgentPage() {
  const [isRunning, setIsRunning] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)

  const router = mockAgents.find(a => a.id === "router")
  const otherAgents = mockAgents.filter(a => a.id !== "router")
  
  const totalTasks = mockAgents.reduce((sum, a) => sum + a.tasksProcessed, 0)
  const workingAgents = mockAgents.filter(a => a.status === "working").length
  const completedTasks = mockAgents.filter(a => a.status === "done").length

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div>
          <h1 className="text-xl font-semibold">Multi-Agent Visualization</h1>
          <p className="text-sm text-muted-foreground">Analise de Mercado Q4 2025</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsRunning(!isRunning)}
          >
            {isRunning ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isRunning ? "Pausar" : "Retomar"}
          </Button>
          <Button variant="outline" size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reiniciar
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 h-full">
          {/* Agent Flow Visualization */}
          <div className="lg:col-span-2 space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Activity className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{workingAgents}</p>
                      <p className="text-xs text-muted-foreground">Agentes Ativos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{completedTasks}</p>
                      <p className="text-xs text-muted-foreground">Concluidos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                      <RefreshCw className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{totalTasks}</p>
                      <p className="text-xs text-muted-foreground">Total Tarefas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Agent Network */}
            <Card className="flex-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Fluxo de Agentes</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Router (Center) */}
                <div className="flex justify-center mb-6">
                  {router && <div className="w-64"><AgentNode agent={router} isCenter /></div>}
                </div>

                {/* Connection indicator */}
                <div className="flex justify-center mb-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="h-8 border-l-2 border-dashed border-primary/50" />
                  </div>
                </div>

                {/* Arrows */}
                <div className="flex justify-center gap-8 mb-4">
                  {[1, 2, 3, 4, 5].map((_, i) => (
                    <ArrowRight 
                      key={i} 
                      className={cn(
                        "h-4 w-4 rotate-90",
                        i < workingAgents ? "text-amber-500" : "text-muted-foreground/30"
                      )} 
                    />
                  ))}
                </div>

                {/* Specialized Agents Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {otherAgents.map((agent) => (
                    <AgentNode key={agent.id} agent={agent} />
                  ))}
                </div>

                {/* Progress */}
                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progresso Geral</span>
                    <span className="font-medium">68%</span>
                  </div>
                  <Progress value={68} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Log */}
          <Card className="flex flex-col h-full max-h-[calc(100vh-12rem)]">
            <CardHeader className="pb-2 flex-shrink-0">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Log de Atividades
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full px-4 pb-4">
                <div className="space-y-2">
                  {mockActivityLog.map((log, index) => (
                    <div 
                      key={index}
                      className={cn(
                        "p-2 rounded-lg text-xs border",
                        log.type === "success" && "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900",
                        log.type === "warning" && "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900",
                        log.type === "error" && "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900",
                        log.type === "info" && "bg-slate-50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-800"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className="text-[10px] h-5">
                          {log.agent}
                        </Badge>
                        <span className="text-muted-foreground text-[10px]">{log.time}</span>
                      </div>
                      <p className="text-foreground">{log.action}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
