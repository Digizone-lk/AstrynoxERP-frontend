export interface ChatConfig {
  module: string;
  moduleLabel: string;
  suggestedPrompts: string[];
}

/** Message shown in the chat UI (user-facing only) */
export interface UIMessage {
  role: "user" | "assistant";
  content: string;
}

/** Raw history item as the backend expects/returns it.
 *  Includes system, user, assistant, and tool roles. */
export type HistoryItem = Record<string, unknown>;
