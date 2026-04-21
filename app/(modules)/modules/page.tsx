"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  FileText,
  Users,
  LogOut,
  ChevronRight,
  Clock,
} from "lucide-react";

interface Module {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  available: boolean;
  accentColor: string;
  bgGlow: string;
}

const MODULES: Module[] = [
  {
    id: "ims",
    title: "Invoice Management",
    subtitle: "System",
    description:
      "Create and manage invoices, quotations, clients, and products. Track revenue, outstanding payments, and generate financial reports.",
    icon: <FileText size={32} />,
    href: "/ims/dashboard",
    available: true,
    accentColor: "from-blue-500 to-blue-600",
    bgGlow: "group-hover:shadow-blue-500/20",
  },
  {
    id: "hris",
    title: "Human Resource",
    subtitle: "Integrated System",
    description:
      "Manage employees, payroll processing, attendance tracking, leave management, and HR analytics all in one place.",
    icon: <Users size={32} />,
    href: "/hris",
    available: false,
    accentColor: "from-violet-500 to-violet-600",
    bgGlow: "group-hover:shadow-violet-500/20",
  },
];

export default function ModulesPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <FileText size={16} className="text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">Astrynox ERP</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-white">{user?.full_name}</p>
            <p className="text-xs text-slate-400">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        {/* Heading */}
        <div className="text-center mb-14">
          <p className="text-blue-400 text-sm font-semibold tracking-widest uppercase mb-3">
            Welcome back, {user?.full_name?.split(" ")[0]}
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
            Select a Module
          </h1>
          <p className="text-slate-400 text-lg max-w-md mx-auto">
            Choose the system you want to work in today.
          </p>
        </div>

        {/* Module cards — 4-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full max-w-5xl">
          {MODULES.map((mod) => (
            <button
              key={mod.id}
              onClick={() => router.push(mod.href)}
              disabled={!mod.available}
              className={`
                group relative flex flex-col text-left rounded-2xl border p-6
                transition-all duration-300 outline-none
                ${
                  mod.available
                    ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 hover:shadow-2xl cursor-pointer"
                    : "bg-white/[0.02] border-white/5 cursor-default opacity-75"
                }
                ${mod.bgGlow}
              `}
            >
              {/* Coming soon badge */}
              {!mod.available && (
                <span className="absolute top-4 right-4 flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
                  <Clock size={10} />
                  Soon
                </span>
              )}

              {/* Icon */}
              <div
                className={`
                  w-14 h-14 rounded-xl bg-gradient-to-br ${mod.accentColor}
                  flex items-center justify-center text-white mb-5
                  ${mod.available ? "group-hover:scale-110 transition-transform duration-300" : "opacity-60"}
                `}
              >
                {mod.icon}
              </div>

              {/* Title */}
              <h2 className="text-white font-bold text-lg leading-snug mb-1">
                {mod.title}
              </h2>
              <p className={`text-sm font-medium mb-3 ${mod.available ? "text-blue-400" : "text-slate-500"}`}>
                {mod.subtitle}
              </p>

              {/* Description */}
              <p className="text-slate-400 text-sm leading-relaxed flex-1">
                {mod.description}
              </p>

              {/* CTA */}
              {mod.available && (
                <div className="flex items-center gap-1 mt-5 text-blue-400 text-sm font-medium group-hover:gap-2 transition-all duration-200">
                  Open module <ChevronRight size={15} />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* User info */}
        <p className="mt-12 text-slate-600 text-xs">
          {user?.email} &middot; {user?.role?.replace("_", " ")}
        </p>
      </main>
    </div>
  );
}
