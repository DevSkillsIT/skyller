"use client";

// Forçar renderização dinâmica (não pré-renderizar durante build)
export const dynamic = "force-dynamic";

import {
  BarChart3,
  Building2,
  Calendar,
  CheckSquare,
  ChevronDown,
  Code2,
  FileText,
  GripVertical,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Square,
  StickyNote,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ToolChatSidebar } from "@/components/layout/tool-chat-sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { type CanvasCard, mockCanvasCards } from "@/lib/mock/data";

const cardTypeConfig = {
  project: { icon: FileText, label: "Project", color: "text-blue-500" },
  entity: { icon: Building2, label: "Entity", color: "text-purple-500" },
  note: { icon: StickyNote, label: "Note", color: "text-amber-500" },
  chart: { icon: BarChart3, label: "Chart", color: "text-green-500" },
};

export default function CanvasPage() {
  const [cards, setCards] = useState<CanvasCard[]>(mockCanvasCards);
  const [showJson, setShowJson] = useState(false);
  const [gridSize, setGridSize] = useState<"2x2" | "3x3" | "4x4">("2x2");
  const [isChatOpen, setIsChatOpen] = useState(true);

  const gridCols = {
    "2x2": "grid-cols-1 md:grid-cols-2",
    "3x3": "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    "4x4": "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  };

  const handleAddCard = (type: CanvasCard["type"]) => {
    const newCard: CanvasCard = {
      id: `card${Date.now()}`,
      type,
      title: `Novo ${cardTypeConfig[type].label}`,
      content:
        type === "project"
          ? { status: "Active", checklist: [] }
          : type === "entity"
            ? { type: "Client", tags: [] }
            : type === "chart"
              ? { metrics: [] }
              : { text: "" },
      position: { x: 0, y: 0 },
    };
    setCards([...cards, newCard]);
    toast.success(`Card ${cardTypeConfig[type].label} criado!`);
  };

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold mb-1">Visual Workspace</h1>
            <p className="text-muted-foreground">Q4 Planning - Cards estruturados</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Add Card Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Card
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {Object.entries(cardTypeConfig).map(([type, config]) => {
                  const Icon = config.icon;
                  return (
                    <DropdownMenuItem
                      key={type}
                      onClick={() => handleAddCard(type as CanvasCard["type"])}
                    >
                      <Icon className={`mr-2 h-4 w-4 ${config.color}`} />
                      {config.label} Card
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Grid Size */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 bg-transparent">
                  Grid {gridSize}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setGridSize("2x2")}>2x2</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGridSize("3x3")}>3x3</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGridSize("4x4")}>4x4</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Search */}
            <Button variant="outline" size="icon">
              <Search className="h-4 w-4" />
            </Button>

            {/* JSON Toggle */}
            <div className="flex items-center gap-2 ml-2">
              <Switch id="json-toggle" checked={showJson} onCheckedChange={setShowJson} />
              <Label htmlFor="json-toggle" className="text-sm">
                JSON
              </Label>
            </div>
          </div>
        </div>

        {/* Canvas Grid */}
        {showJson ? (
          <div className="flex-1 overflow-auto">
            <pre className="bg-muted p-4 rounded-lg text-xs font-mono overflow-auto">
              {JSON.stringify(cards, null, 2)}
            </pre>
          </div>
        ) : (
          <div className={`grid ${gridCols[gridSize]} gap-4 flex-1 overflow-auto`}>
            {cards.map((card) => (
              <CanvasCardComponent
                key={card.id}
                card={card}
                onUpdate={(updatedCard) => {
                  setCards(cards.map((c) => (c.id === updatedCard.id ? updatedCard : c)));
                }}
                onDelete={() => {
                  setCards(cards.filter((c) => c.id !== card.id));
                  toast.success("Card removido");
                }}
              />
            ))}

            {/* Empty State / Add Card Placeholder */}
            {cards.length < (gridSize === "2x2" ? 4 : gridSize === "3x3" ? 9 : 16) && (
              <Card className="border-dashed border-2 flex items-center justify-center min-h-[200px] cursor-pointer hover:bg-muted/50 transition-colors">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="text-center p-6">
                      <Plus className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Arraste cards aqui ou
                        <br />
                        clique para adicionar
                      </p>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {Object.entries(cardTypeConfig).map(([type, config]) => {
                      const Icon = config.icon;
                      return (
                        <DropdownMenuItem
                          key={type}
                          onClick={() => handleAddCard(type as CanvasCard["type"])}
                        >
                          <Icon className={`mr-2 h-4 w-4 ${config.color}`} />
                          {config.label} Card
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Chat Sidebar */}
      <ToolChatSidebar
        toolName="Canvas"
        toolDescription="Crie e edite cards visuais via IA"
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen(!isChatOpen)}
      />
    </div>
  );
}

// Canvas Card Component
function CanvasCardComponent({
  card,
  onUpdate,
  onDelete,
}: {
  card: CanvasCard;
  onUpdate: (card: CanvasCard) => void;
  onDelete: () => void;
}) {
  const config = cardTypeConfig[card.type];
  const Icon = config.icon;

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
            <Badge variant="outline" className={`${config.color} gap-1`}>
              <Icon className="h-3 w-3" />
              {config.label.toUpperCase()}
            </Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Editar</DropdownMenuItem>
              <DropdownMenuItem>Duplicar</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardTitle className="text-base mt-2">{card.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {card.type === "project" && <ProjectCardContent card={card} onUpdate={onUpdate} />}
        {card.type === "entity" && <EntityCardContent card={card} />}
        {card.type === "note" && <NoteCardContent card={card} />}
        {card.type === "chart" && <ChartCardContent card={card} />}
      </CardContent>
    </Card>
  );
}

// Project Card Content
function ProjectCardContent({
  card,
  onUpdate,
}: {
  card: CanvasCard;
  onUpdate: (card: CanvasCard) => void;
}) {
  const content = card.content as {
    status?: string;
    dueDate?: string;
    checklist?: Array<{ id: string; text: string; checked: boolean }>;
  };

  const toggleCheckItem = (itemId: string) => {
    const updatedChecklist = content.checklist?.map((item) =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    onUpdate({
      ...card,
      content: { ...content, checklist: updatedChecklist },
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Status:</span>
        <Badge variant="outline" className="bg-green-500/10 text-green-500">
          {content.status || "Active"}
        </Badge>
      </div>
      {content.dueDate && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Due:</span>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{content.dueDate}</span>
          </div>
        </div>
      )}
      {content.checklist && content.checklist.length > 0 && (
        <div className="space-y-2 pt-2 border-t">
          {content.checklist.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <Checkbox checked={item.checked} onCheckedChange={() => toggleCheckItem(item.id)} />
              <span
                className={`text-sm ${item.checked ? "line-through text-muted-foreground" : ""}`}
              >
                {item.text}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Entity Card Content
function EntityCardContent({ card }: { card: CanvasCard }) {
  const content = card.content as { type?: string; tags?: string[] };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Type:</span>
        <span>{content.type || "Entity"}</span>
      </div>
      {content.tags && content.tags.length > 0 && (
        <div className="space-y-2">
          <span className="text-sm text-muted-foreground">Tags:</span>
          <div className="flex flex-wrap gap-1">
            {content.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Note Card Content
function NoteCardContent({ card }: { card: CanvasCard }) {
  const content = card.content as { text?: string };

  return (
    <div className="prose prose-sm dark:prose-invert">
      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
        {content.text || "Clique para adicionar notas..."}
      </p>
    </div>
  );
}

// Chart Card Content
function ChartCardContent({ card }: { card: CanvasCard }) {
  const content = card.content as { metrics?: Array<{ label: string; value: number }> };

  return (
    <div className="space-y-2">
      {content.metrics && content.metrics.length > 0 ? (
        content.metrics.map((metric) => (
          <div key={metric.label} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{metric.label}</span>
              <span className="font-medium">{metric.value}%</span>
            </div>
            <Progress value={metric.value} className="h-2" />
          </div>
        ))
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">Sem métricas configuradas</p>
      )}
    </div>
  );
}
