"use client";

// Forçar renderização dinâmica (não pré-renderizar durante build)
export const dynamic = "force-dynamic";

import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Edit3,
  Eye,
  Grid3X3,
  ImageIcon,
  List,
  Maximize2,
  Play,
  Plus,
  Presentation,
  Quote,
  Settings,
  Share2,
  Trash2,
  Type,
} from "lucide-react";
import { useState } from "react";
import { ToolChatSidebar } from "@/components/layout/tool-chat-sidebar";
import { ToolHistorySidebar } from "@/components/layout/tool-history-sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Mock slides data
const mockSlides = [
  {
    id: "1",
    type: "title" as const,
    title: "Analise de Mercado Q4 2025",
    subtitle: "Skills IT - Relatorio Executivo",
    background: "gradient",
  },
  {
    id: "2",
    type: "content" as const,
    title: "Visao Geral do Mercado",
    bullets: [
      "Crescimento de 15% no setor de tecnologia",
      "Aumento da demanda por solucoes de IA",
      "Expansao para novos mercados regionais",
      "Consolidacao de parcerias estrategicas",
    ],
  },
  {
    id: "3",
    type: "chart" as const,
    title: "Metricas de Desempenho",
    chartType: "bar",
    data: [
      { label: "Q1", value: 65 },
      { label: "Q2", value: 78 },
      { label: "Q3", value: 85 },
      { label: "Q4", value: 92 },
    ],
  },
  {
    id: "4",
    type: "quote" as const,
    quote: "A inovacao distingue um lider de um seguidor.",
    author: "Steve Jobs",
  },
  {
    id: "5",
    type: "image" as const,
    title: "Nossa Equipe",
    imageUrl: "/placeholder-team.jpg",
    caption: "Time de desenvolvimento - Janeiro 2026",
  },
  {
    id: "6",
    type: "content" as const,
    title: "Proximos Passos",
    bullets: [
      "Lancamento do produto em marco",
      "Expansao internacional no Q2",
      "Nova rodada de investimentos",
      "Contratacao de 50 novos colaboradores",
    ],
  },
];

const slideTypeIcons = {
  title: Type,
  content: List,
  chart: BarChart3,
  quote: Quote,
  image: ImageIcon,
  grid: Grid3X3,
};

function SlidePreview({
  slide,
  isActive,
  onClick,
}: {
  slide: (typeof mockSlides)[0];
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative cursor-pointer rounded-lg border-2 transition-all overflow-hidden",
        isActive
          ? "border-primary ring-2 ring-primary/20"
          : "border-transparent hover:border-muted-foreground/30"
      )}
    >
      <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-800 p-3">
        {slide.type === "title" && (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <p className="text-[10px] font-bold truncate w-full">{slide.title}</p>
            {slide.subtitle && (
              <p className="text-[8px] text-muted-foreground truncate w-full">{slide.subtitle}</p>
            )}
          </div>
        )}
        {slide.type === "content" && (
          <div className="h-full">
            <p className="text-[8px] font-semibold mb-1 truncate">{slide.title}</p>
            <div className="space-y-0.5">
              {slide.bullets?.slice(0, 3).map((bullet, i) => (
                <div key={i} className="flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                  <p className="text-[6px] text-muted-foreground truncate">{bullet}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {slide.type === "chart" && (
          <div className="h-full flex flex-col">
            <p className="text-[8px] font-semibold mb-1 truncate">{slide.title}</p>
            <div className="flex-1 flex items-end gap-1 px-2">
              {slide.data?.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-primary/60 rounded-t"
                    style={{ height: `${d.value * 0.3}px` }}
                  />
                  <p className="text-[5px] mt-0.5">{d.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {slide.type === "quote" && (
          <div className="h-full flex flex-col items-center justify-center text-center px-2">
            <Quote className="h-3 w-3 text-primary/50 mb-1" />
            <p className="text-[6px] italic line-clamp-2">{slide.quote}</p>
            <p className="text-[5px] text-muted-foreground mt-1">- {slide.author}</p>
          </div>
        )}
        {slide.type === "image" && (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="w-12 h-8 bg-muted rounded flex items-center justify-center">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-[6px] text-muted-foreground mt-1">{slide.title}</p>
          </div>
        )}
      </div>
      <div className="absolute bottom-1 right-1">
        <Badge variant="secondary" className="text-[8px] h-4 px-1">
          {slide.id}
        </Badge>
      </div>
    </div>
  );
}

function SlideEditor({ slide }: { slide: (typeof mockSlides)[0] }) {
  return (
    <div className="aspect-video bg-white dark:bg-slate-900 rounded-xl shadow-lg border overflow-hidden">
      {slide.type === "title" && (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-gradient-to-br from-primary/5 to-accent/5">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{slide.title}</h1>
          {slide.subtitle && (
            <p className="text-lg md:text-xl text-muted-foreground">{slide.subtitle}</p>
          )}
        </div>
      )}
      {slide.type === "content" && (
        <div className="h-full p-8">
          <h2 className="text-2xl font-bold mb-6">{slide.title}</h2>
          <ul className="space-y-4">
            {slide.bullets?.map((bullet, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span className="text-lg">{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {slide.type === "chart" && (
        <div className="h-full p-8 flex flex-col">
          <h2 className="text-2xl font-bold mb-6">{slide.title}</h2>
          <div className="flex-1 flex items-end gap-4 pb-8">
            {slide.data?.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-gradient-to-t from-primary to-accent rounded-t transition-all duration-500"
                  style={{ height: `${d.value}%` }}
                />
                <p className="text-sm font-medium mt-2">{d.label}</p>
                <p className="text-xs text-muted-foreground">{d.value}%</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {slide.type === "quote" && (
        <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <Quote className="h-12 w-12 text-primary/30 mb-6" />
          <blockquote className="text-2xl md:text-3xl italic font-light max-w-2xl">
            "{slide.quote}"
          </blockquote>
          <p className="text-lg text-muted-foreground mt-6">- {slide.author}</p>
        </div>
      )}
      {slide.type === "image" && (
        <div className="h-full flex flex-col items-center justify-center p-8">
          <h2 className="text-2xl font-bold mb-6">{slide.title}</h2>
          <div className="flex-1 w-full max-w-lg bg-muted rounded-lg flex items-center justify-center">
            <ImageIcon className="h-16 w-16 text-muted-foreground" />
          </div>
          {slide.caption && <p className="text-sm text-muted-foreground mt-4">{slide.caption}</p>}
        </div>
      )}
    </div>
  );
}

export default function PresentationsPage() {
  const [slides, setSlides] = useState(mockSlides);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(true);
  const [presentationTitle, setPresentationTitle] = useState("Analise de Mercado Q4 2025");
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Derived state
  const currentSlide = slides[currentSlideIndex];

  // Navigation functions
  const goToPrevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  const goToNextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  // Add slide function - cria slide com todas as propriedades requeridas para cada tipo
  const addSlide = (type: keyof typeof slideTypeIcons) => {
    const slideId = String(slides.length + 1);
    const slideTitle = `Novo Slide ${slides.length + 1}`;

    // Criar slide baseado no tipo com todas as propriedades requeridas
    let newSlide: (typeof mockSlides)[number];

    switch (type) {
      case "title":
        newSlide = {
          id: slideId,
          type: "title" as const,
          title: slideTitle,
          subtitle: "Subtitulo da apresentacao",
          background: "gradient",
        };
        break;
      case "content":
        newSlide = {
          id: slideId,
          type: "content" as const,
          title: slideTitle,
          bullets: ["Item 1", "Item 2", "Item 3"],
        };
        break;
      case "chart":
        newSlide = {
          id: slideId,
          type: "chart" as const,
          title: slideTitle,
          chartType: "bar",
          data: [
            { label: "A", value: 50 },
            { label: "B", value: 75 },
          ],
        };
        break;
      case "quote":
        newSlide = {
          id: slideId,
          type: "quote" as const,
          quote: "Adicione sua citacao aqui",
          author: "Autor",
        };
        break;
      case "image":
        newSlide = {
          id: slideId,
          type: "image" as const,
          title: slideTitle,
          imageUrl: "/placeholder.jpg",
          caption: "Descricao da imagem",
        };
        break;
      default:
        // Grid e tipos desconhecidos usam content como fallback
        newSlide = {
          id: slideId,
          type: "content" as const,
          title: slideTitle,
          bullets: ["Item 1", "Item 2", "Item 3"],
        };
        break;
    }

    setSlides([...slides, newSlide]);
    setCurrentSlideIndex(slides.length);
  };

  return (
    <TooltipProvider>
      <div className="flex h-full">
        {/* History Sidebar */}
        <ToolHistorySidebar
          toolType="presentation"
          isOpen={isHistoryOpen}
          onToggle={() => setIsHistoryOpen(!isHistoryOpen)}
        />

        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-4">
              <Presentation className="h-5 w-5 text-primary" />
              <Input
                value={presentationTitle}
                onChange={(e) => setPresentationTitle(e.target.value)}
                className="w-64 h-8 text-sm font-medium border-none shadow-none focus-visible:ring-0 px-0"
              />
              <Badge variant="outline" className="text-xs">
                {slides.length} slides
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={isEditing ? "default" : "outline"}
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button
                variant={!isEditing ? "default" : "outline"}
                size="sm"
                onClick={() => setIsEditing(false)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
              <Button size="sm">
                <Play className="h-4 w-4 mr-2" />
                Apresentar
              </Button>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Slides Sidebar */}
            <div className="w-48 border-r bg-muted/30 flex flex-col">
              <div className="p-2 border-b">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Slide
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    {Object.entries(slideTypeIcons).map(([type, Icon]) => (
                      <DropdownMenuItem
                        key={type}
                        onClick={() => addSlide(type as keyof typeof slideTypeIcons)}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <ScrollArea className="flex-1 p-2">
                <div className="space-y-2">
                  {slides.map((slide, index) => (
                    <SlidePreview
                      key={slide.id}
                      slide={slide}
                      isActive={index === currentSlideIndex}
                      onClick={() => setCurrentSlideIndex(index)}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Main Editor Area */}
            <div className="flex-1 flex flex-col">
              {/* Toolbar */}
              {isEditing && (
                <div className="flex items-center gap-1 p-2 border-b bg-muted/20">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Type className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Adicionar Texto</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Adicionar Imagem</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Adicionar Grafico</TooltipContent>
                  </Tooltip>
                  <Separator orientation="vertical" className="h-6 mx-2" />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Duplicar Slide</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Deletar Slide</TooltipContent>
                  </Tooltip>
                  <div className="flex-1" />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Tela Cheia</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Configuracoes</TooltipContent>
                  </Tooltip>
                </div>
              )}

              {/* Slide Canvas */}
              <div className="flex-1 flex items-center justify-center p-8 bg-slate-100 dark:bg-slate-950">
                <div className="w-full max-w-4xl">
                  <SlideEditor slide={currentSlide} />
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-center gap-4 p-4 border-t bg-background">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToPrevSlide}
                  disabled={currentSlideIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground min-w-[80px] text-center">
                  {currentSlideIndex + 1} / {slides.length}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToNextSlide}
                  disabled={currentSlideIndex === slides.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        <ToolChatSidebar
          toolName="Apresentacoes"
          toolDescription="Crie e edite slides com IA"
          isOpen={isChatOpen}
          onToggle={() => setIsChatOpen(!isChatOpen)}
        />
      </div>
    </TooltipProvider>
  );
}
