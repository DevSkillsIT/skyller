"use client";

// Forçar renderização dinâmica (não pré-renderizar durante build)
export const dynamic = "force-dynamic";

import { Bot, RefreshCw, Save, Settings, Shield, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { mockAgents, mockProjects } from "@/lib/mock/data";

const settingsSections = [
  { id: "general", label: "Geral", icon: Settings },
  { id: "agents", label: "Agentes", icon: Bot },
  { id: "collaborators", label: "Colaboradores", icon: Users },
  { id: "permissions", label: "Permissoes", icon: Shield },
  { id: "danger", label: "Zona Perigosa", icon: Trash2 },
];

const features = [
  { id: "kanban", label: "Kanban Board", enabled: true },
  { id: "canvas", label: "Visual Workspace", enabled: true },
  { id: "analysis", label: "Document Analysis", enabled: true },
  { id: "presentations", label: "Presentations", enabled: false },
  { id: "research", label: "Research Mode", enabled: false },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("general");
  const [selectedAgent, setSelectedAgent] = useState(mockAgents[0].id);
  const [routingMode, setRoutingMode] = useState<"auto" | "fixed">("auto");
  const [customInstructions, setCustomInstructions] = useState(
    mockProjects[0].customInstructions || ""
  );
  const [enabledFeatures, setEnabledFeatures] = useState(
    features.reduce((acc, f) => ({ ...acc, [f.id]: f.enabled }), {} as Record<string, boolean>)
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Configuracoes salvas com sucesso!");
    }, 1000);
  };

  const toggleFeature = (featureId: string) => {
    setEnabledFeatures((prev) => ({
      ...prev,
      [featureId]: !prev[featureId],
    }));
  };

  return (
    <div className="flex h-full">
      {/* Sidebar Navigation */}
      <div className="w-64 border-r border-border p-4">
        <h2 className="font-semibold mb-4 px-2">Configuracoes</h2>
        <nav className="space-y-1">
          {settingsSections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                } ${section.id === "danger" ? "text-destructive hover:text-destructive" : ""}`}
              >
                <Icon className="h-4 w-4" />
                {section.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Settings Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 max-w-2xl">
          {activeSection === "general" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-1">Configuracoes Gerais</h3>
                <p className="text-sm text-muted-foreground">
                  Configure as preferencias do projeto Skyller MVP
                </p>
              </div>

              <Separator />

              {/* Project Info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="project-name">Nome do Projeto</Label>
                  <Input id="project-name" defaultValue="Skyller MVP" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-description">Descricao</Label>
                  <Textarea
                    id="project-description"
                    defaultValue="Plataforma de IA conversacional"
                    rows={2}
                  />
                </div>
              </div>

              <Separator />

              {/* Features */}
              <div className="space-y-4">
                <h4 className="font-medium">Features Habilitadas</h4>
                <div className="space-y-3">
                  {features.map((feature) => (
                    <div key={feature.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={feature.id}
                        checked={enabledFeatures[feature.id]}
                        onCheckedChange={() => toggleFeature(feature.id)}
                      />
                      <Label htmlFor={feature.id} className="font-normal cursor-pointer">
                        {feature.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === "agents" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-1">Configuracao de Agentes</h3>
                <p className="text-sm text-muted-foreground">
                  Configure o agente padrao e modo de roteamento
                </p>
              </div>

              <Separator />

              {/* Default Agent */}
              <div className="space-y-4">
                <h4 className="font-medium">Agente Padrao</h4>
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {mockAgents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4" />
                          {agent.name}
                          {agent.isDefault && (
                            <span className="text-xs text-muted-foreground">(Default)</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Routing Mode */}
              <div className="space-y-4">
                <h4 className="font-medium">Modo de Roteamento</h4>
                <RadioGroup
                  value={routingMode}
                  onValueChange={(v) => setRoutingMode(v as "auto" | "fixed")}
                >
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="auto" id="auto" className="mt-1" />
                    <div>
                      <Label htmlFor="auto" className="font-normal cursor-pointer">
                        Automatico (recomendado)
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Sistema sugere o melhor agente por mensagem
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="fixed" id="fixed" className="mt-1" />
                    <div>
                      <Label htmlFor="fixed" className="font-normal cursor-pointer">
                        Fixo
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Usar sempre o mesmo agente selecionado
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <Separator />

              {/* Custom Instructions */}
              <div className="space-y-4">
                <h4 className="font-medium">Custom Instructions</h4>
                <p className="text-sm text-muted-foreground">
                  Defina como a IA deve se comportar neste projeto
                </p>
                <Textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="Ex: Voce e um consultor de vendas especializado..."
                  rows={5}
                  className="font-mono text-sm"
                />
              </div>
            </div>
          )}

          {activeSection === "collaborators" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-1">Colaboradores</h3>
                <p className="text-sm text-muted-foreground">
                  Gerencie quem tem acesso a este projeto
                </p>
              </div>

              <Separator />

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Membros do Projeto</CardTitle>
                  <CardDescription>3 membros ativos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { name: "Joao Dev", email: "joao@skillsit.com.br", role: "Admin" },
                    { name: "Maria Santos", email: "maria@skillsit.com.br", role: "Editor" },
                    { name: "Pedro Costa", email: "pedro@skillsit.com.br", role: "Viewer" },
                  ].map((member) => (
                    <div key={member.email} className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium text-sm">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                      <Select defaultValue={member.role.toLowerCase()}>
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Button variant="outline" className="gap-2 bg-transparent">
                <Users className="h-4 w-4" />
                Convidar Colaborador
              </Button>
            </div>
          )}

          {activeSection === "permissions" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-1">Permissoes</h3>
                <p className="text-sm text-muted-foreground">Configure as permissoes de acesso</p>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-sm">Visibilidade do Projeto</p>
                    <p className="text-xs text-muted-foreground">Quem pode ver este projeto</p>
                  </div>
                  <Select defaultValue="private">
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Privado</SelectItem>
                      <SelectItem value="team">Time</SelectItem>
                      <SelectItem value="public">Publico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-sm">Permitir Duplicacao</p>
                    <p className="text-xs text-muted-foreground">
                      Outros podem copiar este projeto
                    </p>
                  </div>
                  <Checkbox defaultChecked />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-sm">Exportar Dados</p>
                    <p className="text-xs text-muted-foreground">Permitir export de conversas</p>
                  </div>
                  <Checkbox defaultChecked />
                </div>
              </div>
            </div>
          )}

          {activeSection === "danger" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-1 text-destructive">Zona Perigosa</h3>
                <p className="text-sm text-muted-foreground">Acoes irreversiveis. Tenha cuidado.</p>
              </div>

              <Separator />

              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="text-base text-destructive">Excluir Projeto</CardTitle>
                  <CardDescription>
                    Esta acao nao pode ser desfeita. Todos os dados, conversas e documentos serao
                    permanentemente excluidos.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="destructive"
                    onClick={() => toast.error("Funcionalidade desabilitada no modo demo")}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir Projeto
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="text-base text-destructive">Limpar Dados</CardTitle>
                  <CardDescription>
                    Remove todas as conversas e documentos, mantendo as configuracoes do projeto.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground bg-transparent"
                    onClick={() => toast.error("Funcionalidade desabilitada no modo demo")}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Limpar Todos os Dados
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end gap-2 mt-8 pt-6 border-t">
            <Button variant="outline">Cancelar</Button>
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              {isSaving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
