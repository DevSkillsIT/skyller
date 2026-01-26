export type ThinkingStatus = "idle" | "active" | "completed";

export interface ThinkingState {
  status: ThinkingStatus;
  content: string;
  title?: string;
  startedAt?: number;
  endedAt?: number;
}

export type StepStatus = "running" | "completed";

export interface StepState {
  stepName: string;
  status: StepStatus;
  startedAt: number;
  endedAt?: number;
}

export type ToolCallStatus = "running" | "completed" | "failed";

export interface ToolCallState {
  toolCallId: string;
  toolCallName: string;
  status: ToolCallStatus;
  args: string;
  result?: string;
  startedAt: number;
  endedAt?: number;
  parentMessageId?: string;
}

export interface ActivityState {
  messageId: string;
  activityType: string;
  content: unknown;
  status?: string;
  updatedAt: number;
  replace?: boolean;
}
