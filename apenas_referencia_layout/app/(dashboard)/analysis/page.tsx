"use client"

import { useState } from "react"
import {
  RefreshCw,
  Download,
  ChevronDown,
  Search,
  AlertTriangle,
  FileText,
  Twitter,
  FileSearch,
  Lock,
  Lightbulb,
  Quote,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { ToolChatSidebar } from "@/components/layout/tool-chat-sidebar"
import { ToolHistorySidebar } from "@/components/layout/tool-history-sidebar"

// Mock analysis data
const mockAnalysis = {
  document: "contract-2026.pdf",
  findings: [
    { id: 1, text: "Contrato valido ate 2028", type: "info" },
    { id: 2, text: "Multa rescisoria de 30%", type: "warning" },
    { id: 3, text: "Renovacao automatica ativa", type: "warning" },
    { id: 4, text: "3 clausulas de exclusividade", type: "info" },
    { id: 5, text: "SLA de 99.9% garantido", type: "success" },
  ],
  redacted: [
    { id: 1, text: "Secao 3.2 possivelmente removida (gap de numeracao)", type: "warning" },
    { id: 2, text: "Anexo B referenciado mas nao presente no documento", type: "error" },
    { id: 3, text: "Valores da clausula 7.3 foram censurados", type: "info" },
  ],
  tweets: [
    { id: 1, text: "Contrato de 2 anos com renovacao automatica. Cuidado com o prazo de aviso previo de 90 dias!" },
    { id: 2, text: "Multa de 30% e alta para o mercado. Recomendo renegociar antes da assinatura." },
    { id: 3, text: "SLA de 99.9% e excelente! Garante compensacao em caso de downtime." },
  ],
  summary: `## Resumo Executivo

Este contrato de prestacao de servicos tem duracao de 2 anos (2026-2028) com clausula de renovacao automatica.

### Pontos de Atencao:
- Multa rescisoria de 30% do valor restante
- Prazo de aviso previo de 90 dias para cancelamento
- Possivel remocao de informacoes na secao 3.2

### Pontos Positivos:
- SLA robusto de 99.9% com compensacoes
- Suporte 24/7 incluido
- Atualizacoes de seguranca garantidas

### Recomendacao:
Revisar clausula de renovacao automatica e renegociar multa rescisoria antes da assinatura.`,
}

const typeColors = {
  info: "text-blue-500 bg-blue-500/10",
  warning: "text-amber-500 bg-amber-500/10",
  error: "text-red-500 bg-red-500/10",
  success: "text-green-500 bg-green-500/10",
}

export default function DocumentAnalysisPage() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(true)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
      toast.success("Analise atualizada!")
    }, 1500)
  }

  return (
    <div className="flex h-full">
      {/* History Sidebar */}
      <ToolHistorySidebar
        toolType="analysis"
        isOpen={isHistoryOpen}
        onToggle={() => setIsHistoryOpen(!isHistoryOpen)}
      />
      
      <div className="flex-1 flex flex-col p-6 overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold mb-1">Analise de Documentos</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {mockAnalysis.document}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2 bg-transparent"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                Export
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => toast.success("Exportado como PDF")}>
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.success("Exportado como Markdown")}>
                Export as Markdown
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.success("Exportado como JSON")}>
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Analysis Grid - 4 Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 overflow-hidden">
        {/* Findings Panel */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4 text-blue-500" />
              FINDINGS
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden pt-0">
            <ScrollArea className="h-full pr-4">
              <ul className="space-y-2">
                {mockAnalysis.findings.map((finding) => (
                  <li
                    key={finding.id}
                    className="flex items-start gap-2 p-2 rounded-md bg-muted/50"
                  >
                    <Lightbulb className={`h-4 w-4 mt-0.5 flex-shrink-0 ${typeColors[finding.type as keyof typeof typeColors].split(' ')[0]}`} />
                    <span className="text-sm">{finding.text}</span>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Redacted Analysis Panel */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-4 w-4 text-red-500" />
              REDACTED ANALYSIS
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden pt-0">
            <ScrollArea className="h-full pr-4">
              <ul className="space-y-2">
                {mockAnalysis.redacted.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-2 p-2 rounded-md bg-muted/50"
                  >
                    <AlertTriangle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${typeColors[item.type as keyof typeof typeColors].split(' ')[0]}`} />
                    <span className="text-sm">{item.text}</span>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Tweet-sized Insights Panel */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Twitter className="h-4 w-4 text-sky-500" />
              TWEET-SIZED INSIGHTS
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden pt-0">
            <ScrollArea className="h-full pr-4">
              <ul className="space-y-3">
                {mockAnalysis.tweets.map((tweet) => (
                  <li
                    key={tweet.id}
                    className="p-3 rounded-md bg-muted/50 border-l-2 border-sky-500"
                  >
                    <Quote className="h-4 w-4 text-muted-foreground mb-1" />
                    <p className="text-sm">{tweet.text}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {tweet.text.length} caracteres
                    </p>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Summary Panel */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileSearch className="h-4 w-4 text-green-500" />
              SUMMARY
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden pt-0">
            <ScrollArea className="h-full pr-4">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {mockAnalysis.summary.split('\n').map((line, i) => {
                  if (line.startsWith('## ')) {
                    return <h2 key={i} className="text-base font-semibold mt-0 mb-2">{line.slice(3)}</h2>
                  }
                  if (line.startsWith('### ')) {
                    return <h3 key={i} className="text-sm font-medium mt-4 mb-1">{line.slice(4)}</h3>
                  }
                  if (line.startsWith('- ')) {
                    return <li key={i} className="text-sm ml-4">{line.slice(2)}</li>
                  }
                  if (line.trim() === '') return <br key={i} />
                  return <p key={i} className="text-sm mb-2">{line}</p>
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      </div>
      
      {/* Chat Sidebar */}
      <ToolChatSidebar
        toolName="Analise"
        toolDescription="Pergunte sobre seus documentos"
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen(!isChatOpen)}
      />
    </div>
  )
}
