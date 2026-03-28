"use client";
import { use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { canEdit } from "@/lib/utils";
import type { Client, Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, X, Plus } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useState } from "react";

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const qc = useQueryClient();
  const canWrite = canEdit(user?.role);
  const [selectedProduct, setSelectedProduct] = useState("");

  const { data: client } = useQuery<Client>({
    queryKey: ["client", id],
    queryFn: () => clientsApi.get(id).then((r) => r.data),
  });

  const { data: assignedProducts = [] } = useQuery<Array<{ id: string; product_id: string; product: Product }>>({
    queryKey: ["client-products", id],
    queryFn: () => clientsApi.listAssignedProducts(id).then((r) => r.data),
  });

  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: () => clientsApi.getEligibleProducts(id).then((r) => r.data),
  });

  const { data: nonGlobalProducts = [] } = useQuery<Product[]>({
    queryKey: ["products-non-global"],
    queryFn: async () => {
      const { data } = await import("@/lib/api").then(m => m.productsApi.list({ is_global: false }));
      return data;
    },
  });

  const assignMut = useMutation({
    mutationFn: () => clientsApi.assignProduct(id, selectedProduct),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-products", id] });
      toast.success("Product assigned");
      setSelectedProduct("");
    },
    onError: () => toast.error("Failed to assign product"),
  });

  const unassignMut = useMutation({
    mutationFn: (productId: string) => clientsApi.unassignProduct(id, productId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-products", id] });
      toast.success("Product removed");
    },
  });

  const assignedIds = new Set(assignedProducts.map((ap) => ap.product_id));
  const availableToAssign = nonGlobalProducts.filter((p) => !assignedIds.has(p.id));

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/clients">
          <Button variant="ghost" size="sm"><ArrowLeft size={16} className="mr-1" />Back</Button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">{client?.name ?? "…"}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Client Info</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              ["Email", client?.email],
              ["Phone", client?.phone],
              ["Contact Person", client?.contact_person],
              ["Address", client?.address],
            ].map(([label, value]) =>
              value ? (
                <div key={label}>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p>
                  <p className="text-sm text-slate-700">{value}</p>
                </div>
              ) : null
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Client-Specific Products</CardTitle>
            <p className="text-xs text-slate-500 mt-1">These products are ONLY selectable when this client is chosen in a quotation/invoice</p>
          </CardHeader>
          <CardContent>
            {canWrite && availableToAssign.length > 0 && (
              <div className="flex gap-2 mb-4">
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a product to assign…" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableToAssign.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={() => assignMut.mutate()} disabled={!selectedProduct}>
                  <Plus size={16} />
                </Button>
              </div>
            )}

            {assignedProducts.length === 0 ? (
              <p className="text-sm text-slate-400">No client-specific products assigned.</p>
            ) : (
              <div className="space-y-2">
                {assignedProducts.map((ap) => (
                  <div key={ap.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{ap.product.name}</p>
                      <p className="text-xs text-slate-500">{ap.product.unit} · ${ap.product.unit_price}</p>
                    </div>
                    {canWrite && (
                      <button
                        onClick={() => unassignMut.mutate(ap.product_id)}
                        className="text-slate-400 hover:text-red-500 p-1"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
