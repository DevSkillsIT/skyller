"use client";

import { Key, Link, Plus, Settings } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Integration {
  name: string;
  icon: string;
  connected: boolean;
}

const integrations: Integration[] = [
  { name: "Notion", icon: "📝", connected: false },
  { name: "Google Drive", icon: "📁", connected: false },
  { name: "Shopify", icon: "🛒", connected: false },
  { name: "Klaviyo", icon: "📧", connected: false },
];

export function IntegrationSettings() {
  const [open, setOpen] = useState(false);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);

  const handleConnect = (integration: Integration) => {
    setSelectedIntegration(integration);
    setConnectDialogOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-start text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-zinc-950 border-zinc-800 max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-emerald-500 text-xl font-mono">
              SYSTEM SETTINGS
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="api-keys" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-zinc-900">
              <TabsTrigger
                value="api-keys"
                className="data-[state=active]:bg-emerald-500 data-[state=active]:text-black"
              >
                <Key className="w-4 h-4 mr-2" />
                API Keys
              </TabsTrigger>
              <TabsTrigger
                value="integrations"
                className="data-[state=active]:bg-emerald-500 data-[state=active]:text-black"
              >
                <Link className="w-4 h-4 mr-2" />
                Integrations
              </TabsTrigger>
            </TabsList>

            <TabsContent value="api-keys" className="space-y-4 mt-4">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {["OpenAI", "Anthropic", "Cohere", "Hugging Face"].map((provider) => (
                    <div
                      key={provider}
                      className="space-y-2 p-4 bg-zinc-900 border border-zinc-800 rounded-sm"
                    >
                      <Label className="text-zinc-300 font-mono text-sm">{provider} API Key</Label>
                      <div className="flex gap-2">
                        <Input
                          type="password"
                          placeholder="sk-..."
                          className="bg-black border-zinc-800 font-mono text-xs"
                        />
                        <Button
                          size="sm"
                          className="bg-emerald-500 hover:bg-emerald-400 text-black"
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    className="w-full border-zinc-800 bg-zinc-900 hover:bg-zinc-800"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add API Key
                  </Button>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="integrations" className="space-y-4 mt-4">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {integrations.map((integration) => (
                    <div
                      key={integration.name}
                      className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{integration.icon}</span>
                        <div>
                          <div className="text-sm font-medium text-zinc-200">
                            {integration.name}
                          </div>
                          <div className="text-xs text-zinc-500">
                            {integration.connected ? "Connected" : "Not connected"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {integration.connected && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:bg-zinc-800"
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => handleConnect(integration)}
                          className={
                            integration.connected
                              ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                              : "bg-emerald-500 hover:bg-emerald-400 text-black"
                          }
                        >
                          {integration.connected ? "Disconnect" : "Connect"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Connection Dialog */}
      <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-emerald-500">
              Connect {selectedIntegration?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-400">API Key / Token</Label>
              <Input
                type="password"
                placeholder="Enter your credentials..."
                className="bg-zinc-900 border-zinc-800"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">Workspace ID (optional)</Label>
              <Input
                type="text"
                placeholder="workspace-id"
                className="bg-zinc-900 border-zinc-800"
              />
            </div>
            <Button className="w-full bg-emerald-500 hover:bg-emerald-400 text-black">
              Connect
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
