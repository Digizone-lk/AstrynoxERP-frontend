import type { ChatConfig } from "./types";

export const imsConfig: ChatConfig = {
  module: "ims",
  moduleLabel: "Invoice Management",
  suggestedPrompts: [
    "Show my overdue invoices",
    "What's my revenue this month?",
    "List all sent invoices",
    "Show paid invoices from last quarter",
  ],
};
