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

interface WorkspaceInstructionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceName: string;
  currentInstructions: string;
  onSave: (instructions: string) => void;
}

export function WorkspaceInstructionsDialog({
  open,
  onOpenChange,
  workspaceName,
  currentInstructions,
  onSave,
}: WorkspaceInstructionsDialogProps) {
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
            Criar instrucoes para o workspace
          </DialogTitle>
          <DialogDescription className="text-sm">
            De ao Skyller instrucoes e informacoes relevantes para todas as conversas dentro do
            workspace {workspaceName}. Isso se aplica a todos os projetos e chats deste workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Textarea
            placeholder="Voce e um assistente especializado em... Sempre considere... Foque em..."
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
