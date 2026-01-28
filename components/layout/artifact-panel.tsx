"use client";

import {
  BarChart3,
  Bookmark,
  Check,
  Code2,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  FileText,
  GitBranch,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  Presentation,
  RotateCcw,
  Save,
  Share2,
  Table,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { usePanel } from "@/lib/contexts/panel-context";

interface ArtifactPanelProps {
  content: "artifact" | "knowledge" | "settings";
  onClose: () => void;
}

const mockArtifact = {
  id: "a1",
  type: "document" as const,
  title: "Relatorio de Vendas Q4 2025",
  content: `# Relatorio de Vendas Q4 2025

## Resumo Executivo

As vendas do Q4 2025 atingiram **R$ 4.2 milhoes**, representando um crescimento de **15%** YoY.

## Analise por Regiao

| Regiao | Vendas | Delta% |
|--------|--------|--------|
| Norte | R$ 1.2M | +15% |
| Sul | R$ 980K | +8% |
| Sudeste | R$ 1.5M | +22% |
| Centro | R$ 520K | +5% |

## Principais Insights

1. **Sudeste lidera crescimento** - Com 22% de aumento YoY, a regiao Sudeste consolidou-se como o principal motor de crescimento.

2. **Centro-Oeste estagnado** - A regiao apresentou crescimento de apenas 5%, indicando necessidade de revisao estrategica.

3. **Norte surpreende** - Com 15% de crescimento, a regiao Norte superou expectativas e merece investimento adicional.

## Recomendacoes

- Investir mais no Sudeste
- Revisar estrategia Centro-Oeste
- Expandir equipe Norte
- Implementar programa de fidelizacao
- Aumentar investimento em marketing digital

## Proximos Passos

- [ ] Reuniao com equipe regional Norte
- [ ] Analise detalhada Centro-Oeste
- [ ] Proposta de investimento Sudeste
- [ ] Review Q1 2026`,
  version: 1,
  createdAt: new Date(),
};

const _mockCodeArtifact = {
  id: "a2",
  type: "code" as const,
  title: "auth-utils.ts",
  language: "typescript",
  content: `import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Handle server component scenario
          }
        },
      },
    }
  )
}

export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}`,
  version: 2,
  createdAt: new Date(Date.now() - 3600000),
};

const artifactTypeIcons = {
  document: FileText,
  code: Code2,
  chart: BarChart3,
  diagram: GitBranch,
  table: Table,
  presentation: Presentation,
};

export function ArtifactPanel({ content, onClose }: ArtifactPanelProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "source">("preview");

  // Pegar artifact selecionado e estado expandido do contexto
  const { selectedArtifact, isPanelExpanded, togglePanelExpanded } = usePanel();

  // Usar artifact selecionado ou mock como fallback
  const artifact = selectedArtifact || mockArtifact;

  const handleCopy = () => {
    navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    toast.success("Conteudo copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    toast.success("Artifact salvo no projeto!");
  };

  const TypeIcon = artifactTypeIcons[artifact.type];

  if (content === "settings") {
    return (
      <div className="border-l border-border bg-background flex flex-col h-full">
        <PanelHeader
          title="Configuracoes Rapidas"
          onClose={onClose}
          isExpanded={isPanelExpanded}
          onToggleExpand={togglePanelExpanded}
        />
        <ScrollArea className="flex-1 p-4">
          <p className="text-sm text-muted-foreground">
            Painel de configuracoes rapidas. Acesse /settings para configuracoes completas.
          </p>
        </ScrollArea>
      </div>
    );
  }

  if (content === "knowledge") {
    return (
      <div className="border-l border-border bg-background flex flex-col h-full">
        <PanelHeader
          title="Knowledge Base"
          onClose={onClose}
          isExpanded={isPanelExpanded}
          onToggleExpand={togglePanelExpanded}
        />
        <ScrollArea className="flex-1 p-4">
          <p className="text-sm text-muted-foreground">
            Painel rapido da Knowledge Base. Acesse /knowledge para gerenciamento completo.
          </p>
        </ScrollArea>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="border-l border-border bg-background flex flex-col h-full">
        {/* Header estilo Claude/ChatGPT */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent/10">
              <TypeIcon className="h-4 w-4 text-accent" />
            </div>
            <div className="overflow-hidden">
              <h2 className="font-medium text-sm truncate">{artifact.title}</h2>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  v{artifact.version}
                </Badge>
                <span>Editado ha 2 min</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={togglePanelExpanded}
                >
                  {isPanelExpanded ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {isPanelExpanded ? "Reduzir" : "Expandir"}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Fechar</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Toolbar estilo moderno */}
        <div className="flex items-center justify-between px-2 py-1.5 border-b border-border bg-background">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "preview" | "source")}>
            <TabsList className="h-8 bg-muted/50">
              <TabsTrigger value="preview" className="text-xs h-7 px-3">
                Preview
              </TabsTrigger>
              <TabsTrigger value="source" className="text-xs h-7 px-3">
                Source
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Edit3 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Editar</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy}>
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Copiar</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSave}>
                  <Save className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Salvar no projeto</TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar PDF
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Markdown
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar DOCX
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartilhar
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bookmark className="h-4 w-4 mr-2" />
                  Favoritar
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir em nova aba
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Historico de versoes
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          {activeTab === "preview" ? (
            <div className="p-5">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {artifact.content.split("\n").map((line, i) => {
                  if (line.startsWith("# ")) {
                    return (
                      <h1 key={i} className="text-xl font-bold mt-0 mb-4 text-foreground">
                        {line.slice(2)}
                      </h1>
                    );
                  }
                  if (line.startsWith("## ")) {
                    return (
                      <h2
                        key={i}
                        className="text-lg font-semibold mt-6 mb-3 text-foreground border-b border-border pb-2"
                      >
                        {line.slice(3)}
                      </h2>
                    );
                  }
                  if (line.startsWith("- [ ]")) {
                    return (
                      <label key={i} className="flex items-center gap-2 my-1.5 cursor-pointer">
                        <input type="checkbox" className="rounded border-border" />
                        <span className="text-sm">{line.slice(6)}</span>
                      </label>
                    );
                  }
                  if (line.startsWith("- ")) {
                    return (
                      <li key={i} className="text-sm my-1 ml-4">
                        {line.slice(2)}
                      </li>
                    );
                  }
                  if (line.match(/^\d+\. \*\*/)) {
                    const match = line.match(/^\d+\. \*\*(.*?)\*\* - (.*)/);
                    if (match) {
                      return (
                        <div key={i} className="my-3 p-3 bg-muted/50 rounded-lg">
                          <div className="font-medium text-sm">{match[1]}</div>
                          <div className="text-sm text-muted-foreground mt-1">{match[2]}</div>
                        </div>
                      );
                    }
                  }
                  if (line.startsWith("|")) {
                    return (
                      <code
                        key={i}
                        className="block text-xs bg-muted p-1.5 my-0.5 font-mono rounded"
                      >
                        {line}
                      </code>
                    );
                  }
                  if (line.trim() === "") return <div key={i} className="h-2" />;

                  // Parse bold text
                  const parts = line.split(/(\*\*.*?\*\*)/g);
                  return (
                    <p key={i} className="my-2 text-sm leading-relaxed">
                      {parts.map((part, j) => {
                        if (part.startsWith("**") && part.endsWith("**")) {
                          return (
                            <strong key={j} className="font-semibold">
                              {part.slice(2, -2)}
                            </strong>
                          );
                        }
                        return part;
                      })}
                    </p>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4">
              <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto font-mono leading-relaxed">
                {artifact.content}
              </pre>
            </div>
          )}
        </ScrollArea>

        {/* Footer com status */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border text-xs text-muted-foreground bg-muted/30">
          <div className="flex items-center gap-3">
            <span>{artifact.content.split("\n").length} linhas</span>
            <Separator orientation="vertical" className="h-3" />
            <span>{artifact.content.length} caracteres</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>Salvo</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

// Componente auxiliar para header simples
function PanelHeader({
  title,
  onClose,
  isExpanded,
  onToggleExpand,
}: {
  title: string;
  onClose: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
      <h2 className="font-semibold">{title}</h2>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggleExpand}>
          {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
