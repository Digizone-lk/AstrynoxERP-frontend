"use client";
import { useQuery } from "@tanstack/react-query";
import { invoicesApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { canEdit, formatCurrency, formatDate } from "@/lib/utils";
import type { Invoice } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Receipt } from "lucide-react";
import Link from "next/link";
import { INVOICE_STATUS_COLORS } from "@/lib/constants";

export default function InvoicesPage() {
  const { user } = useAuth();
  const canWrite = canEdit(user?.role);

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["invoices"],
    queryFn: () => invoicesApi.list().then((r) => r.data),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Invoices</h1>
        {canWrite && (
          <Link href="/invoices/new">
            <Button size="sm"><Plus size={16} className="mr-1" /> New Invoice</Button>
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Receipt size={40} className="mx-auto mb-3 opacity-40" />
          <p>No invoices yet. {canWrite && <Link href="/invoices/new" className="text-blue-600 hover:underline">Create one</Link>}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => (
            <Link key={inv.id} href={`/invoices/${inv.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-semibold text-slate-800">{inv.invoice_number}</p>
                        <p className="text-sm text-slate-500">{formatDate(inv.issue_date)}{inv.due_date && ` · Due ${formatDate(inv.due_date)}`}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-semibold text-slate-700">{formatCurrency(inv.total, inv.currency)}</p>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${INVOICE_STATUS_COLORS[inv.status]}`}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
