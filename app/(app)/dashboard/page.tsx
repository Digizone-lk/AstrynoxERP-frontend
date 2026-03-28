"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi, exchangeRatesApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, AlertCircle, FileText, Users, Package, Receipt, RefreshCw } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { DashboardStats } from "@/lib/types";
import { CURRENCIES } from "@/lib/constants";
import { StatCard } from "@/components/ui/stat-card";

export default function DashboardPage() {
  const { user } = useAuth();
  const orgCurrency = user?.org_currency ?? "USD";
  const [displayCurrency, setDisplayCurrency] = useState(orgCurrency);

  const { data, isLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: () => dashboardApi.stats().then((r) => r.data),
  });

  const { data: ratesData, isFetching: ratesFetching } = useQuery({
    queryKey: ["exchange-rates", orgCurrency],
    queryFn: () => exchangeRatesApi.getRates(orgCurrency).then((r) => r.data),
    staleTime: 24 * 60 * 60 * 1000, // cache for 24 hours
    retry: 2,
  });

  const isConverting = displayCurrency !== orgCurrency && ratesFetching;

  function convert(amount: string | number): number {
    const num = Number(amount);
    if (displayCurrency === orgCurrency) return num;
    const rates: Record<string, number> = ratesData?.[orgCurrency.toLowerCase()] ?? {};
    const rate = rates[displayCurrency.toLowerCase()];
    return rate ? num * rate : num;
  }

  function fmt(amount: string | number) {
    return formatCurrency(convert(amount), displayCurrency);
  }

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-6"><div className="h-16 bg-slate-100 rounded animate-pulse" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  const chartData = (data?.monthly_revenue ?? []).map((m) => ({
    month: m.month,
    revenue: convert(m.revenue),
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <div className="flex items-center gap-2">
          {isConverting && <RefreshCw size={14} className="text-slate-400 animate-spin" />}
          <Select value={displayCurrency} onValueChange={setDisplayCurrency}>
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                  {c.value === orgCurrency && (
                    <span className="ml-1 text-xs text-slate-400">(org default)</span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Revenue"
          value={fmt(data?.total_revenue ?? 0)}
          sub="All paid invoices"
          icon={DollarSign}
          color="text-green-600"
          converting={isConverting}
        />
        <StatCard
          title="Outstanding"
          value={fmt(data?.outstanding_amount ?? 0)}
          sub="Sent + overdue invoices"
          icon={Receipt}
          color="text-amber-600"
          converting={isConverting}
        />
        <StatCard
          title="Overdue Invoices"
          value={String(data?.overdue_invoices_count ?? 0)}
          sub="Need attention"
          icon={AlertCircle}
          color="text-red-600"
        />
        <StatCard
          title="Draft Quotations"
          value={String(data?.draft_quotations_count ?? 0)}
          sub={`${data?.sent_quotations_count ?? 0} sent`}
          icon={FileText}
          color="text-blue-600"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Clients" value={String(data?.total_clients ?? 0)} icon={Users} />
        <StatCard title="Products" value={String(data?.total_products ?? 0)} icon={Package} />
        <StatCard
          title="Paid Invoices"
          value={String(data?.paid_invoices_count ?? 0)}
          icon={Receipt}
          color="text-green-600"
        />
        <StatCard
          title="Total Invoices"
          value={String(data?.recent_invoices_count ?? 0)}
          icon={Receipt}
        />
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Monthly Revenue
              {displayCurrency !== orgCurrency && (
                <span className="ml-2 text-xs font-normal text-slate-400">
                  converted to {displayCurrency}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => formatCurrency(v as number, displayCurrency)} />
                <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
