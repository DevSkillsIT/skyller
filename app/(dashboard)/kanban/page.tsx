"use client";

// Forçar renderização dinâmica (não pré-renderizar durante build)
export const dynamic = "force-dynamic";

import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Calendar,
  CheckCircle2,
  Eye,
  GripVertical,
  Inbox,
  MessageSquare,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Settings,
  User,
} from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ToolChatSidebar } from "@/components/layout/tool-chat-sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { type KanbanColumn, type KanbanTask, mockKanbanColumns } from "@/lib/mock/data";

const columnIcons = {
  backlog: Inbox,
  doing: RotateCcw,
  review: Eye,
  done: CheckCircle2,
};

const tagColors: Record<string, string> = {
  feat: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  feature: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  frontend: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  backend: "bg-green-500/10 text-green-500 border-green-500/20",
  infra: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  security: "bg-red-500/10 text-red-500 border-red-500/20",
  ai: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  done: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
};

export default function KanbanPage() {
  const [columns, setColumns] = useState<KanbanColumn[]>(mockKanbanColumns);
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskColumn, setNewTaskColumn] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const taskIds = useMemo(() => {
    return columns.flatMap((col) => col.tasks.map((task) => task.id));
  }, [columns]);

  const findColumn = (taskId: string) => {
    return columns.find((col) => col.tasks.some((task) => task.id === taskId));
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const column = findColumn(active.id as string);
    if (column) {
      const task = column.tasks.find((t) => t.id === active.id);
      if (task) setActiveTask(task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeColumn = findColumn(activeId);
    const overColumn = findColumn(overId) || columns.find((col) => col.id === overId);

    if (!activeColumn || !overColumn || activeColumn.id === overColumn.id) return;

    setColumns((prev) => {
      const activeTask = activeColumn.tasks.find((t) => t.id === activeId);
      if (!activeTask) return prev;

      return prev.map((col) => {
        if (col.id === activeColumn.id) {
          return {
            ...col,
            tasks: col.tasks.filter((t) => t.id !== activeId),
          };
        }
        if (col.id === overColumn.id) {
          const overIndex = col.tasks.findIndex((t) => t.id === overId);
          const newTasks = [...col.tasks];
          const insertIndex = overIndex >= 0 ? overIndex : col.tasks.length;
          newTasks.splice(insertIndex, 0, { ...activeTask, columnId: col.id });
          return { ...col, tasks: newTasks };
        }
        return col;
      });
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const column = findColumn(activeId);
    if (!column) return;

    const activeIndex = column.tasks.findIndex((t) => t.id === activeId);
    const overIndex = column.tasks.findIndex((t) => t.id === overId);

    if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
      setColumns((prev) =>
        prev.map((col) => {
          if (col.id === column.id) {
            return {
              ...col,
              tasks: arrayMove(col.tasks, activeIndex, overIndex),
            };
          }
          return col;
        })
      );
    }
  };

  const handleAddTask = (columnId: string, title: string, description: string) => {
    const newTask: KanbanTask = {
      id: `t${Date.now()}`,
      title,
      description,
      tags: ["feat"],
      assignee: "Você",
      comments: 0,
      columnId,
    };

    setColumns((prev) =>
      prev.map((col) => {
        if (col.id === columnId) {
          return { ...col, tasks: [...col.tasks, newTask] };
        }
        return col;
      })
    );

    toast.success("Tarefa criada com sucesso!");
    setIsAddingTask(false);
    setNewTaskColumn(null);
  };

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold mb-1">Kanban Board</h1>
            <p className="text-muted-foreground">Sprint 1 - Skyller MVP</p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nova Tarefa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Tarefa</DialogTitle>
                </DialogHeader>
                <NewTaskForm
                  columns={columns}
                  defaultColumn={newTaskColumn}
                  onSubmit={handleAddTask}
                  onCancel={() => {
                    setIsAddingTask(false);
                    setNewTaskColumn(null);
                  }}
                />
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Kanban Board */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="flex gap-4 pb-4 min-w-max">
              {columns.map((column) => (
                <KanbanColumnComponent
                  key={column.id}
                  column={column}
                  onAddTask={() => {
                    setNewTaskColumn(column.id);
                    setIsAddingTask(true);
                  }}
                />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <DragOverlay>{activeTask ? <TaskCard task={activeTask} isDragging /> : null}</DragOverlay>
        </DndContext>
      </div>

      {/* Chat Sidebar */}
      <ToolChatSidebar
        toolName="Kanban"
        toolDescription="Crie, mova e gerencie tarefas via IA"
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen(!isChatOpen)}
      />
    </div>
  );
}

// Kanban Column Component
function KanbanColumnComponent({
  column,
  onAddTask,
}: {
  column: KanbanColumn;
  onAddTask: () => void;
}) {
  const Icon = columnIcons[column.id as keyof typeof columnIcons] || Inbox;

  return (
    <div className="w-[300px] flex-shrink-0 flex flex-col bg-muted/30 rounded-lg">
      {/* Column Header */}
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">{column.title}</h3>
          <Badge variant="secondary" className="text-xs">
            {column.tasks.length}
          </Badge>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onAddTask}>Adicionar tarefa</DropdownMenuItem>
            <DropdownMenuItem>Ordenar por data</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Arquivar todas</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tasks */}
      <ScrollArea className="flex-1 px-2">
        <SortableContext
          items={column.tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2 pb-2">
            {column.tasks.map((task) => (
              <SortableTaskCard key={task.id} task={task} />
            ))}
          </div>
        </SortableContext>
      </ScrollArea>

      {/* Add Task Button */}
      <div className="p-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-muted-foreground"
          onClick={onAddTask}
        >
          <Plus className="h-4 w-4" />
          Adicionar tarefa
        </Button>
      </div>
    </div>
  );
}

// Sortable Task Card
function SortableTaskCard({ task }: { task: KanbanTask }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <TaskCard task={task} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  );
}

// Task Card Component
function TaskCard({
  task,
  isDragging,
  dragHandleProps,
}: {
  task: KanbanTask;
  isDragging?: boolean;
  dragHandleProps?: Record<string, unknown>;
}) {
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isDragging ? "shadow-lg ring-2 ring-accent" : ""
      }`}
    >
      <CardHeader className="p-3 pb-2">
        <div className="flex items-start gap-2">
          {dragHandleProps && (
            <button
              className="mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
              {...dragHandleProps}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm leading-tight">{task.title}</h4>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.map((tag) => (
            <Badge key={tag} variant="outline" className={`text-xs ${tagColors[tag] || ""}`}>
              {tag}
            </Badge>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {task.assignee && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{task.assignee}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {task.dueDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{task.dueDate}</span>
              </div>
            )}
            {task.comments > 0 && (
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                <span>{task.comments}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// New Task Form
function NewTaskForm({
  columns,
  defaultColumn,
  onSubmit,
  onCancel,
}: {
  columns: KanbanColumn[];
  defaultColumn: string | null;
  onSubmit: (columnId: string, title: string, description: string) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [columnId, setColumnId] = useState(defaultColumn || columns[0]?.id || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Titulo é obrigatório");
      return;
    }
    onSubmit(columnId, title.trim(), description.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Titulo</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Implementar autenticação"
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descreva a tarefa..."
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="column">Coluna</Label>
        <select
          id="column"
          value={columnId}
          onChange={(e) => setColumnId(e.target.value)}
          className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
        >
          {columns.map((col) => (
            <option key={col.id} value={col.id}>
              {col.title}
            </option>
          ))}
        </select>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Criar Tarefa</Button>
      </div>
    </form>
  );
}
