"use client";

import { Bot, Code2, FileSearch, FileText, TrendingUp } from "lucide-react";
import { conversationSuggestions } from "@/lib/mock/data";

interface WelcomeMessageProps {
  onSelectSuggestion: (suggestion: string, agentId: string) => void;
}

export function WelcomeMessage({ onSelectSuggestion }: WelcomeMessageProps) {
  return (
    <div className="text-center py-8">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent/10 mb-3">
        <Bot className="w-7 h-7 text-accent" />
      </div>
      <h2 className="text-xl font-semibold mb-1">Como posso ajudar?</h2>
      <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
        Pergunte qualquer coisa. Posso ajudar com pesquisa, escrita, codigo, analise de dados e
        mais.
      </p>

      {/* Conversation Suggestions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl mx-auto">
        {conversationSuggestions.map((suggestion) => {
          const SuggestionIcon =
            suggestion.icon === "TrendingUp"
              ? TrendingUp
              : suggestion.icon === "FileSearch"
                ? FileSearch
                : suggestion.icon === "Code2"
                  ? Code2
                  : FileText;
          return (
            <button
              key={suggestion.id}
              onClick={() => {
                onSelectSuggestion(suggestion.title, suggestion.agentId);
              }}
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background hover:bg-muted/50 hover:border-accent/30 transition-colors text-left"
            >
              <SuggestionIcon className="h-4 w-4 text-accent flex-shrink-0" />
              <span className="text-sm">{suggestion.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
