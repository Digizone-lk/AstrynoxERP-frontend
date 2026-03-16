"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { canEdit, canFinance, isAdmin } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  Receipt,
  Settings,
  ClipboardList,
  BarChart2,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { authApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    access: () => true,
  },
  {
    label: "Clients",
    href: "/clients",
    icon: Users,
    access: () => true,
  },
  {
    label: "Products",
    href: "/products",
    icon: Package,
    access: () => true,
  },
  {
    label: "Quotations",
    href: "/quotations",
    icon: FileText,
    access: () => true,
  },
  {
    label: "Invoices",
    href: "/invoices",
    icon: Receipt,
    access: () => true,
  },
  {
    label: "Reports",
    href: "/reports",
    icon: BarChart2,
    access: (role: string) => canFinance(role as any),
  },
  {
    label: "Audit Log",
    href: "/audit-log",
    icon: ClipboardList,
    access: (role: string) => canFinance(role as any),
  },
  {
    label: "Users",
    href: "/settings/users",
    icon: Settings,
    access: (role: string) => isAdmin(role as any),
  },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    toast.success("Logged out");
    router.push("/login");
  }

  return (
    <aside className="w-64 h-screen bg-slate-900 text-white flex flex-col fixed left-0 top-0 z-40">
      <div className="px-6 py-5 border-b border-slate-700">
        <h1 className="text-xl font-bold text-blue-400">BillFlow</h1>
        <p className="text-xs text-slate-400 mt-1 truncate">{user?.email}</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navItems
          .filter((item) => item.access(user?.role ?? "viewer"))
          .map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-colors",
                  active
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
      </nav>

      <div className="p-3 border-t border-slate-700">
        <div className="px-3 py-2 mb-2">
          <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
          <p className="text-xs text-slate-400 capitalize">{user?.role?.replace("_", " ")}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
