"use client";
import { use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoicesApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { canEdit, canFinance, formatCurrency, formatDate, downloadBlob } from "@/lib/utils";
import type { Invoice } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, Send, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { LineItemsEditor } from "@/components/line-items-editor";
import { INVOICE_STATUS_COLORS } from "@/lib/constants";

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const qc = useQueryClient();
  const canWrite = canEdit(user?.role);
  const canFinanceOps = canFinance(user?.role);
  const orgCurrency = user?.org_currency ?? "USD";

  const { data: invoice, isLoading } = useQuery<Invoice>({
    queryKey: ["invoice", id],
    queryFn: () => invoicesApi.get(id).then((r) => r.data),
  });

  const sendMut = useMutation({
    mutationFn: () => invoicesApi.send(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["invoice", id] }); toast.success("Invoice sent"); },
  });
  const paidMut = useMutation({
    mutationFn: () => invoicesApi.markPaid(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["invoice", id] }); toast.success("Invoice marked as paid"); },
  });
  const overdueMut = useMutation({
    mutationFn: () => invoicesApi.markOverdue(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["invoice", id] }); toast.success("Invoice marked overdue"); },
  });
  const cancelMut = useMutation({
    mutationFn: () => invoicesApi.cancel(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["invoice", id] }); toast.success("Invoice cancelled"); },
  });

  async function handleDownloadPdf() {
    try {
      const res = await invoicesApi.downloadPdf(id);
      downloadBlob(res.data, `${invoice?.invoice_number}.pdf`);
    } catch {
      toast.error("PDF download failed");
    }
  }

  if (isLoading) return <div className="text-slate-400 text-sm">Loading…</div>;
  if (!invoice) return <div>Not found</div>;

  const items = (invoice.items ?? []).map((item) => ({
    product_id: item.product_id,
    product_name: item.product_name,
    description: item.description ?? "",
    qty: String(item.qty),
    unit_price: String(item.unit_price),
  }));

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Link href="/invoices"><Button variant="ghost" size="sm"><ArrowLeft size={16} className="mr-1" />Back</Button></Link>
        <h1 className="text-2xl font-bold text-slate-800">{invoice.invoice_number}</h1>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${INVOICE_STATUS_COLORS[invoice.status]}`}>
          {invoice.status}
        </span>
        {invoice.quotation_id && (
          <Link href={`/quotations/${invoice.quotation_id}`}>
            <span className="text-xs text-slate-500 hover:text-blue-600">From quotation</span>
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Button variant="outline" size="sm" onClick={handleDownloadPdf}><Download size={14} className="mr-1" />PDF</Button>
        {canWrite && invoice.status === "draft" && (
          <Button size="sm" onClick={() => sendMut.mutate()} disabled={sendMut.isPending}><Send size={14} className="mr-1" />Send</Button>
        )}
        {canFinanceOps && (invoice.status === "sent" || invoice.status === "overdue") && (
          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => paidMut.mutate()}>
            <CheckCircle size={14} className="mr-1" />Mark Paid
          </Button>
        )}
        {canFinanceOps && invoice.status === "sent" && (
          <Button size="sm" variant="outline" className="text-amber-600 border-amber-200" onClick={() => overdueMut.mutate()}>
            <AlertCircle size={14} className="mr-1" />Mark Overdue
          </Button>
        )}
        {canWrite && invoice.status !== "paid" && invoice.status !== "cancelled" && (
          <Button size="sm" variant="outline" className="text-red-600 border-red-200" onClick={() => cancelMut.mutate()}>
            <XCircle size={14} className="mr-1" />Cancel
          </Button>
        )}
      </div>

      <div className="max-w-4xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-sm text-slate-500 font-medium uppercase tracking-wide">Client</CardTitle></CardHeader>
            <CardContent>
              <p className="font-semibold">{invoice.client?.name}</p>
              {invoice.client?.email && <p className="text-sm text-slate-500">{invoice.client.email}</p>}
              {invoice.client?.address && <p className="text-sm text-slate-500">{invoice.client.address}</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm text-slate-500 font-medium uppercase tracking-wide">Details</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Issue Date</span><span>{formatDate(invoice.issue_date)}</span></div>
              {invoice.due_date && <div className="flex justify-between"><span className="text-slate-500">Due Date</span><span>{formatDate(invoice.due_date)}</span></div>}
              {invoice.paid_at && <div className="flex justify-between"><span className="text-slate-500">Paid At</span><span className="text-green-600">{formatDate(invoice.paid_at)}</span></div>}
              <div className="flex justify-between"><span className="text-slate-500">Currency</span><span>{invoice.currency || orgCurrency}</span></div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Line Items</CardTitle></CardHeader>
          <CardContent>
            <LineItemsEditor items={items} products={[]} onChange={() => {}} disabled currency={invoice.currency || orgCurrency} />
          </CardContent>
        </Card>

        {invoice.notes && (
          <Card>
            <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-slate-600 whitespace-pre-wrap">{invoice.notes}</p></CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
