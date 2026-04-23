"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { chatApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { ChatConfig, UIMessage, HistoryItem } from "@/lib/chatbot/types";

interface ChatWidgetProps {
  config: ChatConfig;
}

/** Roles permitted by the backend chat endpoint. */
const ALLOWED_ROLES = ["super_admin", "sales"];

/** Renders inline markdown: **bold** → <strong> */
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    )
  );
}

/**
 * Renders assistant markdown responses into structured JSX.
 * Handles: **bold**, bullet lists (- item), blank-line spacing.
 */
function renderMarkdown(content: string): React.ReactNode {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  const bulletBuffer: string[] = [];

  function flushBullets() {
    if (bulletBuffer.length === 0) return;
    elements.push(
      <ul key={elements.length} className="space-y-1 my-1">
        {bulletBuffer.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-slate-400 shrink-0 select-none">–</span>
            <span>{renderInline(item)}</span>
          </li>
        ))}
      </ul>
    );
    bulletBuffer.length = 0;
  }

  for (const line of lines) {
    if (line.startsWith("- ")) {
      bulletBuffer.push(line.slice(2));
    } else {
      flushBullets();
      if (line.trim() === "") {
        elements.push(<div key={elements.length} className="h-1" />);
      } else {
        elements.push(
          <p key={elements.length}>{renderInline(line)}</p>
        );
      }
    }
  }
  flushBullets();

  return <div className="space-y-0.5">{elements}</div>;
}

export function ChatWidget({ config }: ChatWidgetProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [uiMessages, setUiMessages] = useState<UIMessage[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [uiMessages, isLoading]);

  useEffect(() => {
    if (isOpen) textareaRef.current?.focus();
  }, [isOpen]);

  // Don't render for roles the backend rejects
  if (!user || !ALLOWED_ROLES.includes(user.role)) return null;

  async function handleSend() {
    const message = input.trim();
    if (!message || isLoading) return;

    setInput("");
    setUiMessages((prev) => [...prev, { role: "user", content: message }]);
    setIsLoading(true);

    try {
      const { data } = await chatApi.sendMessage(message, history);
      setHistory(data.history as HistoryItem[]);
      setUiMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
    } catch {
      setUiMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const isEmpty = uiMessages.length === 0;

  return (
    <>
      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-80 md:w-96 flex flex-col bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden"
          style={{ maxHeight: "min(520px, calc(100vh - 6rem))" }}
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 bg-blue-600 text-white shrink-0">
            <Bot size={18} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-none">AI Assistant</p>
              <p className="text-xs text-blue-200 mt-0.5">{config.moduleLabel}</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded hover:bg-blue-500 transition-colors"
              aria-label="Close chat"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {isEmpty ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 py-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                  <Bot size={24} className="text-blue-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-700">
                    How can I help you?
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Ask me anything about your {config.moduleLabel.toLowerCase()} data.
                  </p>
                </div>
                <div className="flex flex-col gap-2 w-full">
                  {config.suggestedPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => {
                        setInput(prompt);
                        textareaRef.current?.focus();
                      }}
                      className="text-left text-xs text-slate-600 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 hover:border-blue-200 rounded-lg px-3 py-2 transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {uiMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed break-words",
                        msg.role === "user"
                          ? "bg-blue-600 text-white rounded-br-sm whitespace-pre-wrap"
                          : "bg-slate-100 text-slate-800 rounded-bl-sm"
                      )}
                    >
                      {msg.role === "assistant"
                        ? renderMarkdown(msg.content)
                        : msg.content}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-3">
                      <div className="flex gap-1 items-center h-4">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input area */}
          <div className="shrink-0 border-t border-slate-200 p-3 flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask something..."
              rows={1}
              className="flex-1 resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow max-h-32 overflow-y-auto"
              style={{ lineHeight: "1.5" }}
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="shrink-0 w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Send"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Floating toggle button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          "fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-200",
          isOpen
            ? "bg-slate-700 hover:bg-slate-800"
            : "bg-blue-600 hover:bg-blue-700"
        )}
        aria-label={isOpen ? "Close AI assistant" : "Open AI assistant"}
      >
        {isOpen ? (
          <X size={20} className="text-white" />
        ) : (
          <MessageSquare size={20} className="text-white" />
        )}
      </button>
    </>
  );
}
