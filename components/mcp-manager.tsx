"use client";

import { Plus, Server, Settings } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";

interface McpServer {
  name: string;
  url: string;
  tools: { name: string; enabled: boolean }[];
}

export function McpManager() {
  const [mcpServers, setMcpServers] = useState<McpServer[]>([
    {
      name: "Data Processing Server",
      url: "mcp://localhost:8001",
      tools: [
        { name: "parse_json", enabled: true },
        { name: "transform_data", enabled: true },
        { name: "validate_schema", enabled: false },
      ],
    },
    {
      name: "Web Scraper Server",
      url: "mcp://localhost:8002",
      tools: [
        { name: "fetch_url", enabled: true },
        { name: "extract_text", enabled: true },
      ],
    },
  ]);

  const toggleTool = (serverIndex: number, toolIndex: number) => {
    setMcpServers((prev) =>
      prev.map((server, si) =>
        si === serverIndex
          ? {
              ...server,
              tools: server.tools.map((tool, ti) =>
                ti === toolIndex ? { ...tool, enabled: !tool.enabled } : tool
              ),
            }
          : server
      )
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-zinc-800 bg-zinc-900 hover:bg-zinc-800"
        >
          <Server className="w-4 h-4 mr-2" />
          MCP
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-zinc-800 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-emerald-500 font-mono">MCP SERVER MANAGEMENT</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {mcpServers.map((server, serverIndex) => (
              <div
                key={serverIndex}
                className="p-4 bg-zinc-900 border border-zinc-800 rounded-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-zinc-200">{server.name}</div>
                    <div className="text-xs text-zinc-500 font-mono mt-1">{server.url}</div>
                  </div>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-zinc-800">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2 pt-2 border-t border-zinc-800">
                  <div className="text-xs text-zinc-500 font-mono uppercase">Tools</div>
                  {server.tools.map((tool, toolIndex) => (
                    <div
                      key={toolIndex}
                      className="flex items-center justify-between py-2 px-3 bg-black rounded-sm"
                    >
                      <span className="text-sm font-mono text-zinc-300">{tool.name}</span>
                      <Switch
                        checked={tool.enabled}
                        onCheckedChange={() => toggleTool(serverIndex, toolIndex)}
                        className="data-[state=checked]:bg-emerald-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              className="w-full border-zinc-800 bg-zinc-900 hover:bg-zinc-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add MCP Server
            </Button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
