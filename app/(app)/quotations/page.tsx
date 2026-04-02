"use client";
import { useQuery } from "@tanstack/react-query";
import { quotationsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { canEdit, formatCurrency, formatDate } from "@/lib/utils";
import type { Quotation } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, FileText } from "lucide-react";
import Link from "next/link";
import { QUOTATION_STATUS_COLORS } from "@/lib/constants";

export default function QuotationsPage() {
  const { user } = useAuth();
  const canWrite = canEdit(user?.role);

  const { data: quotations = [], isLoading } = useQuery<Quotation[]>({
    queryKey: ["quotations"],
    queryFn: () => quotationsApi.list().then((r) => r.data),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Quotations</h1>
        {canWrite && (
          <Link href="/quotations/new">
            <Button size="sm"><Plus size={16} className="mr-1" /> New Quotation</Button>
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : quotations.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <FileText size={40} className="mx-auto mb-3 opacity-40" />
          <p>No quotations yet. {canWrite && <Link href="/quotations/new" className="text-blue-600 hover:underline">Create one</Link>}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {quotations.map((q) => (
            <Link key={q.id} href={`/quotations/${q.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-4 pb-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">{q.quote_number}</p>
                      <p className="text-sm text-slate-500">{formatDate(q.issue_date)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-slate-700">{formatCurrency(q.total, q.currency)}</p>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${QUOTATION_STATUS_COLORS[q.status]}`}>
                        {q.status}
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
