"use client";

import { FileText, FolderOpen, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function UploadManager() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-zinc-800 bg-zinc-900 hover:bg-zinc-800"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-emerald-500 font-mono">UPLOAD RESOURCES</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="local" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-zinc-900">
            <TabsTrigger
              value="local"
              className="data-[state=active]:bg-emerald-500 data-[state=active]:text-black"
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              Local
            </TabsTrigger>
            <TabsTrigger
              value="notion"
              className="data-[state=active]:bg-emerald-500 data-[state=active]:text-black"
            >
              📝 Notion
            </TabsTrigger>
            <TabsTrigger
              value="gdrive"
              className="data-[state=active]:bg-emerald-500 data-[state=active]:text-black"
            >
              📁 Drive
            </TabsTrigger>
          </TabsList>

          <TabsContent value="local" className="space-y-4 mt-4">
            <div className="border-2 border-dashed border-zinc-800 rounded-sm p-8 text-center hover:border-emerald-500/50 transition-colors cursor-pointer">
              <FileText className="w-12 h-12 mx-auto mb-4 text-zinc-600" />
              <p className="text-sm text-zinc-400">Click to browse or drag files here</p>
              <p className="text-xs text-zinc-600 mt-2">Supports: PDF, TXT, CSV, JSON</p>
            </div>
          </TabsContent>

          <TabsContent value="notion" className="space-y-4 mt-4">
            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-sm text-center">
              <p className="text-sm text-zinc-400">Connect to Notion to access your pages</p>
              <Button className="mt-4 bg-emerald-500 hover:bg-emerald-400 text-black">
                Connect Notion
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="gdrive" className="space-y-4 mt-4">
            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-sm text-center">
              <p className="text-sm text-zinc-400">Connect to Google Drive to access your files</p>
              <Button className="mt-4 bg-emerald-500 hover:bg-emerald-400 text-black">
                Connect Google Drive
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
