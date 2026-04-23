"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { clientsApi, invoicesApi, productsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Client, Product } from "@/lib/types";
import { LineItemsEditor, type LineItemDraft } from "@/components/ims/line-items-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { getApiError } from "@/lib/utils";

export default function NewInvoicePage() {
  const router = useRouter();
  const { user } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  const orgCurrency = user?.org_currency ?? "USD";

  const [clientId, setClientId] = useState("");
  const [form, setForm] = useState({ issue_date: today, due_date: "", notes: "" });
  const [items, setItems] = useState<LineItemDraft[]>([{ product_name: "", description: "", qty: "1", unit_price: "0" }]);

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: () => clientsApi.list().then((r) => r.data),
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["eligible-products", clientId],
    queryFn: () =>
      clientId
        ? clientsApi.getEligibleProducts(clientId).then((r) => r.data)
        : productsApi.list({ is_global: true }).then((r) => r.data),
  });

  const { data: nextNumberData } = useQuery({
    queryKey: ["invoices", "next-number"],
    queryFn: () => invoicesApi.nextNumber().then((r) => r.data),
  });

  const createMut = useMutation({
    mutationFn: () =>
      invoicesApi.create({
        client_id: clientId,
        currency: orgCurrency,
        ...form,
        due_date: form.due_date || undefined,
        items: items.map((item) => ({
          product_id: item.product_id || undefined,
          product_name: item.product_name,
          description: item.description || undefined,
          qty: parseFloat(item.qty),
          unit_price: parseFloat(item.unit_price),
        })),
      }),
    onSuccess: (res) => {
      toast.success(`Invoice ${res.data.invoice_number} created`);
      router.push(`/ims/invoices/${res.data.id}`);
    },
    onError: (err) => toast.error(getApiError(err, "Failed to create invoice")),
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/ims/invoices"><Button variant="ghost" size="sm"><ArrowLeft size={16} className="mr-1" />Back</Button></Link>
        <h1 className="text-2xl font-bold text-slate-800">New Invoice</h1>
      </div>

      <div className="max-w-4xl space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Invoice Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Client *</Label>
              <Select
                value={clientId}
                onValueChange={(val) => {
                  setClientId(val);
                  setItems([{ product_name: "", description: "", qty: "1", unit_price: "0" }]);
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a client first…" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Issue Date *</Label>
              <Input type="date" className="mt-1" value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} />
            </div>
            <div>
              <Label>Due Date</Label>
              <Input type="date" className="mt-1" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </div>
            <div>
              <Label>Invoice Number</Label>
              <p className="mt-1 h-9 flex items-center px-3 rounded-md border bg-slate-50 text-sm text-slate-500 font-mono">
                {nextNumberData?.invoice_number ?? "—"}
              </p>
            </div>
            <div>
              <Label>Currency</Label>
              <p className="mt-1 h-9 flex items-center px-3 rounded-md border bg-slate-50 text-sm text-slate-600">{orgCurrency}</p>
            </div>
            <div className="sm:col-span-2">
              <Label>Notes</Label>
              <Textarea className="mt-1" placeholder="Optional notes…" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Line Items</CardTitle>
          </CardHeader>
          <CardContent>
            <LineItemsEditor items={items} products={products} onChange={setItems} currency={orgCurrency} />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href="/ims/invoices"><Button variant="outline">Cancel</Button></Link>
          <Button
            onClick={() => createMut.mutate()}
            disabled={!clientId || createMut.isPending || items.every((i) => !i.product_name)}
          >
            {createMut.isPending ? "Creating…" : "Create Invoice"}
          </Button>
        </div>
      </div>
    </div>
  );
}
