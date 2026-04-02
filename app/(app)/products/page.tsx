"use client";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "@/lib/api";
import { useProducts } from "@/lib/hooks/use-products";
import { useAuth } from "@/lib/auth-context";
import { canEdit, formatCurrency } from "@/lib/utils";
import { CURRENCIES } from "@/lib/constants";
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

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string(),
  unit_price: z.string().min(1, "Price is required").refine((v) => !isNaN(Number(v)) && Number(v) >= 0, "Must be a valid price"),
  unit: z.string().min(1, "Unit is required"),
  currency: z.string().min(1, "Currency is required"),
  is_global: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export default function ProductsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const canWrite = canEdit(user?.role);
  const orgCurrency = user?.org_currency ?? "USD";

  const { data: products = [], isLoading } = useProducts();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const { register, handleSubmit, reset, control, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "", unit_price: "", unit: "pcs", currency: orgCurrency, is_global: true },
  });

  function openCreate() {
    setEditing(null);
    reset({ name: "", description: "", unit_price: "", unit: "pcs", currency: orgCurrency, is_global: true });
    setOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    reset({ name: p.name, description: p.description ?? "", unit_price: p.unit_price, unit: p.unit, currency: p.currency ?? orgCurrency, is_global: p.is_global });
    setOpen(true);
  }

  const createMut = useMutation({
    mutationFn: (data: FormData) => productsApi.create({ ...data, unit_price: parseFloat(data.unit_price) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); toast.success("Product created"); setOpen(false); },
    onError: () => toast.error("Failed to create product"),
  });

  const updateMut = useMutation({
    mutationFn: (data: FormData) => productsApi.update(editing!.id, { ...data, unit_price: parseFloat(data.unit_price) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); toast.success("Product updated"); setOpen(false); },
    onError: () => toast.error("Failed to update product"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); toast.success("Product deleted"); },
  });

  function onSubmit(data: FormData) {
    editing ? updateMut.mutate(data) : createMut.mutate(data);
  }

  const isGlobal = watch("is_global");

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      <button onClick={() => openEdit(p)} className="p-1 text-slate-400 hover:text-blue-600" aria-label={`Edit ${p.name}`}><Pencil size={14} /></button>
                      <button onClick={() => deleteMut.mutate(p.id)} className="p-1 text-slate-400 hover:text-red-500" aria-label={`Delete ${p.name}`}><Trash2 size={14} /></button>
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
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-3 py-2">
              <div>
                <Label>Name *</Label>
                <Input className="mt-1" placeholder="Security Uniform (LSO)" {...register("name")} />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <Label>Description</Label>
                <Textarea className="mt-1" placeholder="Optional description…" rows={2} {...register("description")} />
              </div>
              <div>
                <Label>Currency</Label>
                <Controller
                  name="currency"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select currency" /></SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Unit Price *</Label>
                  <Input className="mt-1" type="number" step="0.01" placeholder="0.00" {...register("unit_price")} />
                  {errors.unit_price && <p className="text-xs text-red-500 mt-1">{errors.unit_price.message}</p>}
                </div>
                <div>
                  <Label>Unit</Label>
                  <Input className="mt-1" placeholder="pcs / hrs / kg" {...register("unit")} />
                  {errors.unit && <p className="text-xs text-red-500 mt-1">{errors.unit.message}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <Controller
                  name="is_global"
                  control={control}
                  render={({ field }) => (
                    <Switch id="is-global" checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
                <Label htmlFor="is-global" className="cursor-pointer">
                  Global product <span className="text-xs text-slate-400">(available to all clients)</span>
                </Label>
              </div>
              {!isGlobal && (
                <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                  This product will only appear when you assign it to specific clients from the client detail page.
                </p>
              )}
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting || createMut.isPending || updateMut.isPending}>
                {editing ? "Save Changes" : "Create Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
