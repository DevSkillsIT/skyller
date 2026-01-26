"use client";

import { Streamdown } from "streamdown";
import "katex/dist/katex.min.css";
import { ActivityCard } from "@/components/chat/activity-card";
import { StepIndicator } from "@/components/chat/step-indicator";
import { ThinkingPanel } from "@/components/chat/thinking-panel";
import { ToolCallCard } from "@/components/chat/tool-call-card";
import { FEATURES } from "@/lib/config/features";
import { STREAMDOWN_CONTROLS, STREAMDOWN_MERMAID, STREAMDOWN_PLUGINS, STREAMDOWN_REMEND, STREAMDOWN_SHIKI_THEMES } from "@/lib/streamdown-config";
import type { ActivityState, StepState, ThinkingState, ToolCallState } from "@/lib/types/agui";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface MessageProps {
  message: Message;
  isStreaming?: boolean;
  thinking?: ThinkingState;
  steps?: StepState[];
  toolCalls?: ToolCallState[];
  activities?: ActivityState[];
}

export function Message({
  message,
  isStreaming = false,
  thinking,
  steps,
  toolCalls,
  activities,
}: MessageProps) {
  const showAuxiliary = message.role === "assistant";
  const hasToolCalls = Boolean(toolCalls && toolCalls.length > 0);
  const hasSteps = Boolean(steps && steps.length > 0);
  const hasActivities = Boolean(activities && activities.length > 0);
  const hasThinking = Boolean(thinking && (thinking.content.trim() || thinking.status === "active"));
  // Flags para habilitar/desabilitar visualizações enterprise.
  const showThinking = FEATURES.SHOW_THINKING && showAuxiliary && hasThinking && Boolean(thinking);
  const showSteps = FEATURES.SHOW_STEPS && showAuxiliary && hasSteps && Boolean(steps);

  return (
    <div className="message-container">
      {showThinking && thinking && (
        <div className="mb-3">
          <ThinkingPanel thinking={thinking} isStreaming={isStreaming} />
        </div>
      )}

      {showSteps && steps && (
        <div className="mb-3">
          <StepIndicator steps={steps} />
        </div>
      )}

      {showAuxiliary && hasToolCalls && toolCalls && (
        <div className="mb-3 space-y-2">
          {toolCalls.map((toolCall) => (
            <ToolCallCard key={toolCall.toolCallId} toolCall={toolCall} />
          ))}
        </div>
      )}

      {showAuxiliary && hasActivities && activities && (
        <div className="mb-3 space-y-2">
          {activities.map((activity) => (
            <ActivityCard key={activity.messageId} activity={activity} />
          ))}
        </div>
      )}

      {/* Conteúdo da mensagem com Streamdown */}
      <Streamdown
        plugins={STREAMDOWN_PLUGINS}
        controls={STREAMDOWN_CONTROLS}
        remend={STREAMDOWN_REMEND}
        shikiTheme={STREAMDOWN_SHIKI_THEMES}
        mermaid={STREAMDOWN_MERMAID}
        mode={isStreaming ? "streaming" : "static"}
        parseIncompleteMarkdown
        isAnimating={isStreaming}
      >
        {message.content}
      </Streamdown>
    </div>
  );
}
