"use client";

import { ChevronRight, File, Folder, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface FileNode {
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
}

const mockFiles: FileNode[] = [
  {
    name: "agent-configs",
    type: "folder",
    children: [
      { name: "agent-01.json", type: "file" },
      { name: "agent-02.json", type: "file" },
    ],
  },
  {
    name: "datasets",
    type: "folder",
    children: [{ name: "training-data.csv", type: "file" }],
  },
  { name: "system-prompt.txt", type: "file" },
];

export function ProjectManager() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpand = (name: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(name)) {
      newExpanded.delete(name);
    } else {
      newExpanded.add(name);
    }
    setExpanded(newExpanded);
  };

  const renderNode = (node: FileNode, depth = 0) => {
    const isExpanded = expanded.has(node.name);

    return (
      <div key={node.name}>
        <button
          onClick={() => node.type === "folder" && toggleExpand(node.name)}
          className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-zinc-900 rounded-sm text-sm"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {node.type === "folder" && (
            <ChevronRight
              className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-90" : ""}`}
            />
          )}
          {node.type === "folder" ? (
            <Folder className="w-4 h-4 text-emerald-500" />
          ) : (
            <File className="w-4 h-4 text-zinc-500" />
          )}
          <span className="text-zinc-300 font-mono text-xs">{node.name}</span>
        </button>
        {node.type === "folder" && isExpanded && node.children && (
          <div>{node.children.map((child) => renderNode(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs text-zinc-500 font-mono">PROJECT FILES</div>
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 hover:bg-zinc-900">
          <Plus className="w-3 h-3" />
        </Button>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-2">
        {mockFiles.map((node) => renderNode(node))}
      </div>
    </div>
  );
}
