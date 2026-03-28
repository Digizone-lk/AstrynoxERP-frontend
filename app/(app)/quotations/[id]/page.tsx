"use client";
import { use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { quotationsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { canEdit, canFinance, formatCurrency, formatDate, downloadBlob } from "@/lib/utils";
import type { Quotation } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, Send, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LineItemsEditor } from "@/components/line-items-editor";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  sent: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  converted: "bg-purple-100 text-purple-700",
};

export default function QuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const qc = useQueryClient();
  const router = useRouter();
  const canWrite = canEdit(user?.role);

  const { data: quotation, isLoading } = useQuery<Quotation>({
    queryKey: ["quotation", id],
    queryFn: () => quotationsApi.get(id).then((r) => r.data),
  });

  const sendMut = useMutation({
    mutationFn: () => quotationsApi.send(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["quotation", id] }); toast.success("Quotation sent"); },
  });

  const approveMut = useMutation({
    mutationFn: () => quotationsApi.approve(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["quotation", id] }); toast.success("Quotation approved"); },
  });

  const rejectMut = useMutation({
    mutationFn: () => quotationsApi.reject(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["quotation", id] }); toast.success("Quotation rejected"); },
  });

  const convertMut = useMutation({
    mutationFn: () => quotationsApi.convertToInvoice(id),
    onSuccess: (res) => {
      toast.success(`Invoice ${res.data.invoice_number} created`);
      router.push(`/invoices/${res.data.invoice_id}`);
    },
    onError: () => toast.error("Failed to convert"),
  });

  async function handleDownloadPdf() {
    try {
      const res = await quotationsApi.downloadPdf(id);
      downloadBlob(res.data, `${quotation?.quote_number}.pdf`);
    } catch {
      toast.error("PDF download failed");
    }
  }

  if (isLoading) return <div className="text-slate-400 text-sm">Loading…</div>;
  if (!quotation) return <div>Not found</div>;

  const items = (quotation.items ?? []).map((item) => ({
    product_id: item.product_id,
    product_name: item.product_name,
    description: item.description ?? "",
    qty: String(item.qty),
    unit_price: String(item.unit_price),
  }));

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/quotations"><Button variant="ghost" size="sm"><ArrowLeft size={16} className="mr-1" />Back</Button></Link>
        <h1 className="text-2xl font-bold text-slate-800">{quotation.quote_number}</h1>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[quotation.status]}`}>
          {quotation.status}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Button variant="outline" size="sm" onClick={handleDownloadPdf}><Download size={14} className="mr-1" />PDF</Button>
        {canWrite && quotation.status === "draft" && (
          <Button size="sm" onClick={() => sendMut.mutate()} disabled={sendMut.isPending}><Send size={14} className="mr-1" />Send</Button>
        )}
        {canWrite && quotation.status === "sent" && (
          <>
            <Button size="sm" variant="outline" className="text-green-600 border-green-200" onClick={() => approveMut.mutate()}>
              <CheckCircle size={14} className="mr-1" />Approve
            </Button>
            <Button size="sm" variant="outline" className="text-red-600 border-red-200" onClick={() => rejectMut.mutate()}>
              <XCircle size={14} className="mr-1" />Reject
            </Button>
          </>
        )}
        {canWrite && quotation.status === "approved" && (
          <Button size="sm" onClick={() => convertMut.mutate()} disabled={convertMut.isPending}>
            <ArrowRight size={14} className="mr-1" />Convert to Invoice
          </Button>
        )}
      </div>

      <div className="max-w-4xl space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-sm text-slate-500 font-medium uppercase tracking-wide">Client</CardTitle></CardHeader>
            <CardContent>
              <p className="font-semibold">{quotation.client?.name}</p>
              {quotation.client?.email && <p className="text-sm text-slate-500">{quotation.client.email}</p>}
              {quotation.client?.address && <p className="text-sm text-slate-500">{quotation.client.address}</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm text-slate-500 font-medium uppercase tracking-wide">Details</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Issue Date</span><span>{formatDate(quotation.issue_date)}</span></div>
              {quotation.valid_until && <div className="flex justify-between"><span className="text-slate-500">Valid Until</span><span>{formatDate(quotation.valid_until)}</span></div>}
              <div className="flex justify-between"><span className="text-slate-500">Currency</span><span>{quotation.currency}</span></div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Line Items</CardTitle></CardHeader>
          <CardContent>
            <LineItemsEditor items={items} products={[]} onChange={() => {}} disabled />
          </CardContent>
        </Card>

        {quotation.notes && (
          <Card>
            <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-slate-600 whitespace-pre-wrap">{quotation.notes}</p></CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
