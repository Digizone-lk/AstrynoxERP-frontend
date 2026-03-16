export type UserRole = "super_admin" | "accountant" | "sales" | "viewer";

export interface User {
  id: string;
  org_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  org_currency: string;
}

export interface Client {
  id: string;
  org_id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contact_person?: string;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  org_id: string;
  name: string;
  description?: string;
  unit_price: string;
  unit: string;
  currency: string;
  is_global: boolean;
  is_active: boolean;
  created_at: string;
}

export type QuotationStatus = "draft" | "sent" | "approved" | "rejected" | "converted";
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";

export interface LineItem {
  id: string;
  product_id?: string;
  product_name: string;
  description?: string;
  qty: string;
  unit_price: string;
  subtotal: string;
  sort_order: number;
}

export interface Quotation {
  id: string;
  org_id: string;
  client_id: string;
  quote_number: string;
  status: QuotationStatus;
  issue_date: string;
  valid_until?: string;
  notes?: string;
  subtotal: string;
  total: string;
  currency: string;
  created_at: string;
  client?: Client;
  items?: LineItem[];
}

export interface Invoice {
  id: string;
  org_id: string;
  client_id: string;
  quotation_id?: string;
  invoice_number: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date?: string;
  paid_at?: string;
  notes?: string;
  subtotal: string;
  total: string;
  currency: string;
  created_at: string;
  client?: Client;
  items?: LineItem[];
}

export interface DashboardStats {
  total_revenue: string;
  outstanding_amount: string;
  paid_invoices_count: number;
  overdue_invoices_count: number;
  draft_quotations_count: number;
  sent_quotations_count: number;
  total_clients: number;
  total_products: number;
  recent_invoices_count: number;
  monthly_revenue: Array<{ month: string; revenue: string }>;
}

export interface RevenueByMonth {
  month: string;
  revenue: string;
  invoice_count: number;
}

export interface InvoiceStatusRow {
  status: string;
  count: number;
  total: string;
}

export interface QuotationStatusRow {
  status: string;
  count: number;
}

export interface TopClient {
  client_id: string;
  client_name: string;
  total_invoiced: string;
  total_paid: string;
  outstanding: string;
}

export interface ReportSummary {
  period: string;
  total_revenue: string;
  total_invoiced: string;
  total_outstanding: string;
  total_overdue: string;
  invoice_status_breakdown: InvoiceStatusRow[];
  quotation_status_breakdown: QuotationStatusRow[];
  revenue_by_month: RevenueByMonth[];
  top_clients: TopClient[];
}

export interface AuditLog {
  id: string;
  org_id: string;
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  extra_data?: unknown;
  ip_address?: string;
  created_at: string;
}
