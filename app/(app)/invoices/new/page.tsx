"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { clientsApi, invoicesApi } from "@/lib/api";
import type { Client, Product } from "@/lib/types";
import { LineItemsEditor, type LineItemDraft } from "@/components/line-items-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function NewInvoicePage() {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);

  const [clientId, setClientId] = useState("");
  const [form, setForm] = useState({ issue_date: today, due_date: "", notes: "", currency: "USD" });
  const [items, setItems] = useState<LineItemDraft[]>([{ product_name: "", description: "", qty: "1", unit_price: "0" }]);

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: () => clientsApi.list().then((r) => r.data),
  });

  const { data: eligibleProducts = [] } = useQuery<Product[]>({
    queryKey: ["eligible-products", clientId],
    queryFn: () => clientsApi.getEligibleProducts(clientId).then((r) => r.data),
    enabled: !!clientId,
  });

  const createMut = useMutation({
    mutationFn: () =>
      invoicesApi.create({
        client_id: clientId,
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
      router.push(`/invoices/${res.data.id}`);
    },
    onError: (err: any) => toast.error(err.response?.data?.detail ?? "Failed to create invoice"),
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/invoices"><Button variant="ghost" size="sm"><ArrowLeft size={16} className="mr-1" />Back</Button></Link>
        <h1 className="text-2xl font-bold text-slate-800">New Invoice</h1>
      </div>

      <div className="max-w-4xl space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Invoice Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Client *</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a client first…" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {clientId && (
                <p className="text-xs text-blue-600 mt-1">
                  Showing {eligibleProducts.length} eligible product(s) for this client
                </p>
              )}
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
              <Label>Currency</Label>
              <Input className="mt-1" placeholder="USD" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} maxLength={5} />
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
            {!clientId && <p className="text-xs text-amber-600">Select a client above to load eligible products</p>}
          </CardHeader>
          <CardContent>
            <LineItemsEditor items={items} products={eligibleProducts} onChange={setItems} />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href="/invoices"><Button variant="outline">Cancel</Button></Link>
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
