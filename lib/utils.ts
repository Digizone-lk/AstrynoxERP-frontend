import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { UserRole } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: string | number, currency = "USD") {
  const num = Number(amount);
  if (currency === "LKR") {
    return `Rs. ${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num)}`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(num);
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  accountant: "Accountant",
  sales: "Sales",
  viewer: "Viewer",
};

export function canEdit(role?: UserRole) {
  return role === "super_admin" || role === "sales";
}

export function canFinance(role?: UserRole) {
  return role === "super_admin" || role === "accountant";
}

export function isAdmin(role?: UserRole) {
  return role === "super_admin";
}
