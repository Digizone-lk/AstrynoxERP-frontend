export const INVOICE_STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  sent: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-slate-400",
};

export const QUOTATION_STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  sent: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  converted: "bg-purple-100 text-purple-700",
};

// Hex variants used in charts (reports page)
export const INVOICE_STATUS_HEX: Record<string, string> = {
  paid: "#16a34a",
  sent: "#2563eb",
  overdue: "#dc2626",
  draft: "#94a3b8",
  cancelled: "#e2e8f0",
};

export const QUOTATION_STATUS_HEX: Record<string, string> = {
  approved: "#16a34a",
  sent: "#2563eb",
  converted: "#7c3aed",
  rejected: "#dc2626",
  draft: "#94a3b8",
};

export const CURRENCIES = [
  { value: "USD", label: "USD – US Dollar ($)" },
  { value: "LKR", label: "LKR – Sri Lankan Rupee (Rs.)" },
  { value: "EUR", label: "EUR – Euro (€)" },
  { value: "GBP", label: "GBP – British Pound (£)" },
  { value: "INR", label: "INR – Indian Rupee (₹)" },
];

export const REPORT_PERIODS = [
  { value: "this_month", label: "This Month" },
  { value: "this_quarter", label: "This Quarter" },
  { value: "this_year", label: "This Year" },
  { value: "all", label: "All Time" },
];
