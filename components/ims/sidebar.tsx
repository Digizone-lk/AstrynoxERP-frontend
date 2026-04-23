"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { canFinance, isAdmin } from "@/lib/utils";
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
  X,
  LayoutGrid,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const navItems = [
  { label: "Dashboard",   href: "/ims/dashboard",       icon: LayoutDashboard, moduleKey: "dashboard",   access: () => true },
  { label: "Clients",     href: "/ims/clients",          icon: Users,           moduleKey: "clients",     access: () => true },
  { label: "Products",    href: "/ims/products",         icon: Package,         moduleKey: "products",    access: () => true },
  { label: "Quotations",  href: "/ims/quotations",       icon: FileText,        moduleKey: "quotations",  access: () => true },
  { label: "Invoices",    href: "/ims/invoices",         icon: Receipt,         moduleKey: "invoices",    access: () => true },
  { label: "Reports",     href: "/ims/reports",          icon: BarChart2,       moduleKey: "reports",     access: (role: string) => canFinance(role as any) },
  { label: "Audit Log",   href: "/ims/audit-log",        icon: ClipboardList,   moduleKey: "reports",     access: (role: string) => canFinance(role as any) },
  { label: "Users",       href: "/ims/settings/users",   icon: Settings,        moduleKey: null,          access: (role: string) => isAdmin(role as any) },
  { label: "Org Settings",href: "/ims/settings/org",     icon: Building2,       moduleKey: null,          access: (role: string) => isAdmin(role as any) },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    toast.success("Logged out");
    router.replace("/login");
  }

  return (
    <aside
      className={cn(
        "w-64 h-screen bg-slate-900 text-white flex flex-col fixed left-0 top-0 z-40 transition-transform duration-200 ease-in-out",
        "md:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="px-6 py-5 border-b border-slate-700 flex items-center justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-blue-400">BillFlow</h1>
          <p className="text-xs text-slate-400 mt-1 truncate" suppressHydrationWarning>{user?.email}</p>
        </div>
        <button
          onClick={onClose}
          className="md:hidden p-1 rounded text-slate-400 hover:text-white shrink-0 ml-2"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navItems
          .filter((item) => {
            if (!item.access(user?.role ?? "viewer")) return false;
            // Super admins always see everything
            if (user?.role === "super_admin") return true;
            // Items with no moduleKey (admin settings) are role-gated only
            if (!item.moduleKey) return true;
            // null allowed_modules = full access
            const modules = user?.allowed_modules;
            if (!modules) return true;
            return modules.includes(item.moduleKey);
          })
          .map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
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
        <Link
          href="/ims/profile"
          onClick={onClose}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-colors",
            pathname.startsWith("/ims/profile")
              ? "bg-blue-600 text-white"
              : "hover:bg-slate-800"
          )}
        >
          <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
            {(user?.full_name ?? "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
            <p className="text-xs text-slate-400 capitalize">{user?.role?.replace("_", " ")}</p>
          </div>
        </Link>
        <Link
          href="/modules"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <LayoutGrid size={16} />
          All modules
        </Link>
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
