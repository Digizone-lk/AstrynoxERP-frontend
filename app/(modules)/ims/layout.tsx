"use client";
import { useState } from "react";
import { Sidebar } from "@/components/ims/sidebar";
import { ChatWidget } from "@/components/chatbot/ChatWidget";
import { imsConfig } from "@/lib/chatbot/ims-config";
import { Menu } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="flex-1 flex flex-col md:ml-64 min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <span className="text-lg font-bold text-blue-600">BillFlow</span>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">{children}</main>
      </div>

      <ChatWidget config={imsConfig} />
    </div>
  );
}
