"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface ProjectInstructionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  currentInstructions: string;
  onSave: (instructions: string) => void;
}

export function ProjectInstructionsDialog({
  open,
  onOpenChange,
  projectName,
  currentInstructions,
  onSave,
}: ProjectInstructionsDialogProps) {
  const [instructions, setInstructions] = useState(currentInstructions);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setInstructions(currentInstructions);
  }, [currentInstructions, open]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      onSave(instructions.trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setInstructions(currentInstructions);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Criar instrucoes para o projeto
          </DialogTitle>
          <DialogDescription className="text-sm">
            De ao Skyller instrucoes e informacoes relevantes para as conversas dentro de{" "}
            {projectName}. Isso funcionara junto com as preferencias do usuario e o estilo
            selecionado em uma conversa.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Textarea
            placeholder="Divido tarefas grandes e faco perguntas esclarecedoras quando necessario."
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="min-h-[200px] resize-none"
            autoFocus
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Salvar instrucoes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
