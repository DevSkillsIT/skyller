"use client";

import {
  AlertTriangle,
  Bookmark,
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  ExternalLink,
  FileText,
  Filter,
  Globe,
  Grid3X3,
  Lightbulb,
  Link2,
  List,
  MoreVertical,
  Plus,
  Quote,
  Search,
  Share2,
  SortAsc,
  Sparkles,
  Tag,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { ToolChatSidebar } from "@/components/layout/tool-chat-sidebar";
import { ToolHistorySidebar } from "@/components/layout/tool-history-sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// Mock research data
const mockSources = [
  {
    id: "1",
    type: "web" as const,
    title: "State of AI Report 2025",
    url: "https://www.stateof.ai/2025",
    summary:
      "Relatorio abrangente sobre o estado atual da inteligencia artificial, cobrindo avancos em LLMs, computer vision e aplicacoes empresariais.",
    tags: ["AI", "Report", "2025"],
    status: "verified" as const,
    addedAt: "2025-01-15",
  },
  {
    id: "2",
    type: "paper" as const,
    title: "Attention Is All You Need",
    url: "https://arxiv.org/abs/1706.03762",
    authors: ["Vaswani et al."],
    summary:
      "Paper fundamental que introduziu a arquitetura Transformer, base para todos os modelos de linguagem modernos.",
    tags: ["Transformer", "Deep Learning", "Paper"],
    status: "verified" as const,
    addedAt: "2025-01-14",
  },
  {
    id: "3",
    type: "article" as const,
    title: "Como LLMs estao transformando o mercado de trabalho",
    url: "https://example.com/llm-mercado",
    summary: "Analise do impacto dos modelos de linguagem no mercado de trabalho brasileiro.",
    tags: ["LLM", "Mercado", "Brasil"],
    status: "pending" as const,
    addedAt: "2025-01-16",
  },
  {
    id: "4",
    type: "book" as const,
    title: "Designing Machine Learning Systems",
    authors: ["Chip Huyen"],
    summary:
      "Guia pratico para construir sistemas de ML em producao, cobrindo desde coleta de dados ate monitoramento.",
    tags: ["ML", "Engineering", "Book"],
    status: "verified" as const,
    addedAt: "2025-01-10",
  },
];

const mockNotes = [
  {
    id: "n1",
    title: "Principais insights do State of AI",
    content:
      "1. LLMs estao se tornando commodities\n2. Foco esta migrando para aplicacoes\n3. Custos de inferencia caindo rapidamente",
    tags: ["AI", "Insights"],
    linkedSources: ["1"],
    createdAt: "2025-01-15",
  },
  {
    id: "n2",
    title: "Arquitetura Transformer - Resumo",
    content:
      "Mecanismo de atencao permite capturar dependencias de longo alcance sem recursao. Self-attention e a chave.",
    tags: ["Transformer", "Resumo"],
    linkedSources: ["2"],
    createdAt: "2025-01-14",
  },
];

const mockIdeas = [
  {
    id: "i1",
    title: "Aplicar RAG no Skyller",
    description: "Usar a tecnica de RAG para melhorar respostas do chat com documentos do usuario.",
    priority: "high" as const,
    linkedSources: ["1", "2"],
  },
  {
    id: "i2",
    title: "Fine-tuning para dominio especifico",
    description: "Explorar fine-tuning de modelos menores para casos de uso empresariais.",
    priority: "medium" as const,
    linkedSources: ["4"],
  },
];

const sourceTypeIcons = {
  web: Globe,
  paper: FileText,
  article: BookOpen,
  book: BookOpen,
};

const statusConfig = {
  verified: {
    color: "text-green-500",
    bg: "bg-green-500/10",
    icon: CheckCircle2,
    label: "Verificado",
  },
  pending: { color: "text-amber-500", bg: "bg-amber-500/10", icon: Clock, label: "Pendente" },
  disputed: {
    color: "text-red-500",
    bg: "bg-red-500/10",
    icon: AlertTriangle,
    label: "Contestado",
  },
};

function SourceCard({ source }: { source: (typeof mockSources)[0] }) {
  const Icon = sourceTypeIcons[source.type];
  const status = statusConfig[source.status];
  const StatusIcon = status.icon;

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0",
              status.bg
            )}
          >
            <Icon className={cn("h-5 w-5", status.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm truncate">{source.title}</h3>
              <StatusIcon className={cn("h-4 w-4 flex-shrink-0", status.color)} />
            </div>
            {source.authors && (
              <p className="text-xs text-muted-foreground">{source.authors.join(", ")}</p>
            )}
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{source.summary}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {source.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px] h-5">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir Fonte
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit3 className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link2 className="h-4 w-4 mr-2" />
                Copiar Link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Remover
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

function NoteCard({ note }: { note: (typeof mockNotes)[0] }) {
  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <h3 className="font-medium text-sm">{note.title}</h3>
          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 whitespace-pre-line line-clamp-4">
          {note.content}
        </p>
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {note.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-[10px] h-5">
              <Tag className="h-2.5 w-2.5 mr-1" />
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
          <Link2 className="h-3 w-3" />
          {note.linkedSources.length} fonte(s) vinculada(s)
        </div>
      </CardContent>
    </Card>
  );
}

function IdeaCard({ idea }: { idea: (typeof mockIdeas)[0] }) {
  const priorityColors = {
    high: "border-l-red-500 bg-red-50 dark:bg-red-950/20",
    medium: "border-l-amber-500 bg-amber-50 dark:bg-amber-950/20",
    low: "border-l-green-500 bg-green-50 dark:bg-green-950/20",
  };

  return (
    <Card className={cn("border-l-4", priorityColors[idea.priority])}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Lightbulb className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-sm">{idea.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{idea.description}</p>
            <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
              <Link2 className="h-3 w-3" />
              {idea.linkedSources.length} fonte(s)
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ResearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState("sources");
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  return (
    <div className="flex h-full">
      {/* History Sidebar */}
      <ToolHistorySidebar
        toolType="research"
        isOpen={isHistoryOpen}
        onToggle={() => setIsHistoryOpen(!isHistoryOpen)}
      />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div>
            <h1 className="text-xl font-semibold">Research Canvas</h1>
            <p className="text-sm text-muted-foreground">Pesquisa: Inteligencia Artificial 2025</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Bookmark className="h-4 w-4 mr-2" />
              Salvar
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button size="sm">
              <Sparkles className="h-4 w-4 mr-2" />
              Gerar Resumo
            </Button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Search and Filters */}
            <div className="flex items-center gap-4 p-4 border-b">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar fontes, notas, ideias..."
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
              <Button variant="outline" size="sm">
                <SortAsc className="h-4 w-4 mr-2" />
                Ordenar
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-1">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <div className="px-4 border-b">
                <TabsList className="h-10">
                  <TabsTrigger value="sources" className="gap-2">
                    <Globe className="h-4 w-4" />
                    Fontes ({mockSources.length})
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Notas ({mockNotes.length})
                  </TabsTrigger>
                  <TabsTrigger value="ideas" className="gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Ideias ({mockIdeas.length})
                  </TabsTrigger>
                  <TabsTrigger value="quotes" className="gap-2">
                    <Quote className="h-4 w-4" />
                    Citacoes (0)
                  </TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="flex-1">
                <TabsContent value="sources" className="p-4 mt-0">
                  <div
                    className={cn(
                      "gap-4",
                      viewMode === "grid"
                        ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
                        : "flex flex-col"
                    )}
                  >
                    {mockSources.map((source) => (
                      <SourceCard key={source.id} source={source} />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="notes" className="p-4 mt-0">
                  <div
                    className={cn(
                      "gap-4",
                      viewMode === "grid"
                        ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
                        : "flex flex-col"
                    )}
                  >
                    {mockNotes.map((note) => (
                      <NoteCard key={note.id} note={note} />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="ideas" className="p-4 mt-0">
                  <div
                    className={cn(
                      "gap-4",
                      viewMode === "grid"
                        ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
                        : "flex flex-col"
                    )}
                  >
                    {mockIdeas.map((idea) => (
                      <IdeaCard key={idea.id} idea={idea} />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="quotes" className="p-4 mt-0">
                  <div className="flex flex-col items-center justify-center h-48 text-center">
                    <Quote className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">Nenhuma citacao adicionada ainda</p>
                    <Button variant="outline" size="sm" className="mt-4 bg-transparent">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Citacao
                    </Button>
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>

          {/* Right Sidebar - Quick Add */}
          <div className="w-80 border-l bg-muted/30 flex flex-col">
            <div className="p-4 border-b">
              <h2 className="font-medium text-sm">Adicionar Rapidamente</h2>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {/* Add Source */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Link2 className="h-4 w-4" />
                      Nova Fonte
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Input placeholder="Cole uma URL aqui..." className="text-sm" />
                    <Button size="sm" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Fonte
                    </Button>
                  </CardContent>
                </Card>

                {/* Add Note */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Nova Nota
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Input placeholder="Titulo da nota..." className="text-sm" />
                    <Textarea placeholder="Escreva sua nota..." className="text-sm min-h-[80px]" />
                    <Button size="sm" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Salvar Nota
                    </Button>
                  </CardContent>
                </Card>

                {/* Add Idea */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Nova Ideia
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Input placeholder="Titulo da ideia..." className="text-sm" />
                    <Textarea
                      placeholder="Descreva sua ideia..."
                      className="text-sm min-h-[60px]"
                    />
                    <Button size="sm" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Ideia
                    </Button>
                  </CardContent>
                </Card>

                {/* Stats */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Estatisticas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Fontes</span>
                        <span className="font-medium">{mockSources.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Notas</span>
                        <span className="font-medium">{mockNotes.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Ideias</span>
                        <span className="font-medium">{mockIdeas.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Verificadas</span>
                        <span className="font-medium text-green-500">
                          {mockSources.filter((s) => s.status === "verified").length}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Chat Sidebar */}
      <ToolChatSidebar
        toolName="Pesquisa"
        toolDescription="Pesquise e organize informacoes com IA"
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen(!isChatOpen)}
      />
    </div>
  );
}
