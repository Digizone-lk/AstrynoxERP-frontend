"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { canEdit, formatCurrency } from "@/lib/utils";
import type { Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const CURRENCIES = [
  { value: "USD", label: "USD – US Dollar ($)" },
  { value: "LKR", label: "LKR – Sri Lankan Rupee (Rs.)" },
  { value: "EUR", label: "EUR – Euro (€)" },
  { value: "GBP", label: "GBP – British Pound (£)" },
  { value: "INR", label: "INR – Indian Rupee (₹)" },
];

export default function ProductsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const canWrite = canEdit(user?.role);
  const orgCurrency = user?.org_currency ?? "USD";

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: () => productsApi.list().then((r) => r.data),
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: "", description: "", unit_price: "", unit: "pcs", currency: orgCurrency, is_global: true });

  function openCreate() { setEditing(null); setForm({ name: "", description: "", unit_price: "", unit: "pcs", currency: orgCurrency, is_global: true }); setOpen(true); }
  function openEdit(p: Product) {
    setEditing(p);
    setForm({ name: p.name, description: p.description ?? "", unit_price: p.unit_price, unit: p.unit, currency: p.currency ?? orgCurrency, is_global: p.is_global });
    setOpen(true);
  }

  const createMut = useMutation({
    mutationFn: () => productsApi.create({ ...form, unit_price: parseFloat(form.unit_price) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); toast.success("Product created"); setOpen(false); },
    onError: () => toast.error("Failed to create product"),
  });

  const updateMut = useMutation({
    mutationFn: () => productsApi.update(editing!.id, { ...form, unit_price: parseFloat(form.unit_price) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); toast.success("Product updated"); setOpen(false); },
    onError: () => toast.error("Failed to update product"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); toast.success("Product deleted"); },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Products</h1>
        {canWrite && (
          <Button onClick={openCreate} size="sm">
            <Plus size={16} className="mr-1" /> New Product
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Package size={40} className="mx-auto mb-3 opacity-40" />
          <p>No products yet. {canWrite && "Create your first product."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {products.map((p) => (
            <Card key={p.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <Link href={`/products/${p.id}`} className="font-semibold text-slate-800 hover:text-blue-600 truncate block">{p.name}</Link>
                    {p.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{p.description}</p>}
                  </div>
                  {canWrite && (
                    <div className="flex gap-1 ml-2">
                      <button onClick={() => openEdit(p)} className="p-1 text-slate-400 hover:text-blue-600"><Pencil size={14} /></button>
                      <button onClick={() => deleteMut.mutate(p.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-lg font-bold text-blue-600">{formatCurrency(p.unit_price, p.currency)}<span className="text-xs text-slate-400 font-normal ml-1">/{p.unit}</span></p>
                  <Badge variant={p.is_global ? "default" : "secondary"} className="text-xs">
                    {p.is_global ? "Global" : "Client-specific"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Product" : "New Product"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Name *</Label>
              <Input className="mt-1" placeholder="Security Uniform (LSO)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea className="mt-1" placeholder="Optional description…" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div>
              <Label>Currency</Label>
              <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Unit Price *</Label>
                <Input className="mt-1" type="number" step="0.01" placeholder="0.00" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} />
              </div>
              <div>
                <Label>Unit</Label>
                <Input className="mt-1" placeholder="pcs / hrs / kg" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <Switch checked={form.is_global} onCheckedChange={(v) => setForm({ ...form, is_global: v })} id="is-global" />
              <Label htmlFor="is-global" className="cursor-pointer">
                Global product <span className="text-xs text-slate-400">(available to all clients)</span>
              </Label>
            </div>
            {!form.is_global && (
              <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                This product will only appear when you assign it to specific clients from the client detail page.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => editing ? updateMut.mutate() : createMut.mutate()} disabled={createMut.isPending || updateMut.isPending}>
              {editing ? "Save Changes" : "Create Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
