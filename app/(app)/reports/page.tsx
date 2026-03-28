"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { reportsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { canFinance, formatCurrency } from "@/lib/utils";
import type { ReportSummary } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Receipt, AlertCircle, TrendingUp, Users, FileText } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { INVOICE_STATUS_HEX, QUOTATION_STATUS_HEX, REPORT_PERIODS } from "@/lib/constants";
import { StatCard } from "@/components/ui/stat-card";

export default function ReportsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const orgCurrency = user?.org_currency ?? "USD";

  // Access guard
  if (user && !canFinance(user.role)) {
    router.replace("/dashboard");
    return null;
  }

  const [period, setPeriod] = useState("this_year");

  const { data, isLoading } = useQuery<ReportSummary>({
    queryKey: ["report-summary", period],
    queryFn: () => reportsApi.summary(period).then((r) => r.data),
    enabled: !!user,
  });

  const fmt = (v: string | number) => formatCurrency(v, orgCurrency);

  const revenueChartData = (data?.revenue_by_month ?? []).map((m) => ({
    month: m.month,
    revenue: Number(m.revenue),
    invoices: m.invoice_count,
  }));

  const invoicePieData = (data?.invoice_status_breakdown ?? []).map((r) => ({
    name: r.status.charAt(0).toUpperCase() + r.status.slice(1),
    value: Number(r.total),
    count: r.count,
    fill: INVOICE_STATUS_HEX[r.status] ?? "#cbd5e1",
  }));

  const quotationPieData = (data?.quotation_status_breakdown ?? []).map((r) => ({
    name: r.status.charAt(0).toUpperCase() + r.status.slice(1),
    value: r.count,
    fill: QUOTATION_STATUS_HEX[r.status] ?? "#cbd5e1",
  }));

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Reports</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="h-16 bg-slate-100 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">Financial overview for your organisation</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REPORT_PERIODS.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Revenue"
          value={fmt(data?.total_revenue ?? 0)}
          sub="Paid invoices"
          icon={DollarSign}
          color="text-green-600"
        />
        <StatCard
          title="Total Invoiced"
          value={fmt(data?.total_invoiced ?? 0)}
          sub="Excl. cancelled"
          icon={Receipt}
          color="text-blue-600"
        />
        <StatCard
          title="Outstanding"
          value={fmt(data?.total_outstanding ?? 0)}
          sub="Sent + overdue"
          icon={TrendingUp}
          color="text-amber-600"
        />
        <StatCard
          title="Overdue"
          value={fmt(data?.total_overdue ?? 0)}
          sub="Needs immediate action"
          icon={AlertCircle}
          color="text-red-600"
        />
      </div>

      {/* Revenue chart + Invoice pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Revenue Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueChartData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
                No paid invoices in this period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v, name) =>
                      name === "revenue" ? fmt(v as number) : v
                    }
                    labelFormatter={(l) => `Month: ${l}`}
                  />
                  <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invoice Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {invoicePieData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
                No invoices in this period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={invoicePieData}
                    cx="50%"
                    cy="45%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, payload }) => `${name} (${(payload as { count?: number })?.count ?? ""})`}
                    labelLine={false}
                  >
                    {invoicePieData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v as number)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invoice status table + Quotation breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt size={16} /> Invoice Status Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.invoice_status_breakdown.length === 0 ? (
              <p className="text-sm text-slate-400">No data</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-400 uppercase border-b border-slate-100">
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Count</th>
                    <th className="pb-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.invoice_status_breakdown ?? []).map((row) => (
                    <tr key={row.status} className="border-b border-slate-50 last:border-0">
                      <td className="py-2.5">
                        <Badge
                          variant="secondary"
                          style={{
                            backgroundColor: INVOICE_STATUS_HEX[row.status] + "20",
                            color: INVOICE_STATUS_HEX[row.status],
                          }}
                          className="capitalize text-xs font-medium"
                        >
                          {row.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-right text-slate-600">{row.count}</td>
                      <td className="py-2.5 text-right font-medium text-slate-800">
                        {fmt(row.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText size={16} /> Quotation Status Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.quotation_status_breakdown.length === 0 ? (
              <p className="text-sm text-slate-400">No data</p>
            ) : (
              <div className="space-y-3">
                {(data?.quotation_status_breakdown ?? []).map((row) => {
                  const total = (data?.quotation_status_breakdown ?? []).reduce(
                    (s, r) => s + r.count, 0
                  );
                  const pct = total > 0 ? Math.round((row.count / total) * 100) : 0;
                  return (
                    <div key={row.status}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span
                          className="capitalize font-medium"
                          style={{ color: QUOTATION_STATUS_HEX[row.status] ?? "#64748b" }}
                        >
                          {row.status}
                        </span>
                        <span className="text-slate-500">{row.count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: QUOTATION_STATUS_HEX[row.status] ?? "#cbd5e1",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top clients */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users size={16} /> Top Clients by Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(data?.top_clients ?? []).length === 0 ? (
            <p className="text-sm text-slate-400">No client data in this period</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-400 uppercase border-b border-slate-100">
                    <th className="pb-2">Client</th>
                    <th className="pb-2 text-right">Invoiced</th>
                    <th className="pb-2 text-right">Paid</th>
                    <th className="pb-2 text-right">Outstanding</th>
                    <th className="pb-2 text-right">Collection Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.top_clients ?? []).map((c) => {
                    const rate =
                      Number(c.total_invoiced) > 0
                        ? Math.round((Number(c.total_paid) / Number(c.total_invoiced)) * 100)
                        : 0;
                    return (
                      <tr key={c.client_id} className="border-b border-slate-50 last:border-0">
                        <td className="py-3 font-medium text-slate-800">{c.client_name}</td>
                        <td className="py-3 text-right text-slate-600">{fmt(c.total_invoiced)}</td>
                        <td className="py-3 text-right text-green-600 font-medium">{fmt(c.total_paid)}</td>
                        <td className="py-3 text-right text-amber-600">{fmt(c.outstanding)}</td>
                        <td className="py-3 text-right">
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              rate >= 80
                                ? "bg-green-50 text-green-700"
                                : rate >= 50
                                ? "bg-amber-50 text-amber-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {rate}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
