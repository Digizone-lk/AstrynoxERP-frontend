"use client";
import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi, clientsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { canEdit, formatCurrency } from "@/lib/utils";
import type { Product, Client } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, X, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const qc = useQueryClient();
  const canWrite = canEdit(user?.role);
  const [selectedClient, setSelectedClient] = useState("");

  const { data: product } = useQuery<Product>({
    queryKey: ["product", id],
    queryFn: () => productsApi.get(id).then((r) => r.data),
  });

  const { data: assignedClients = [] } = useQuery<Client[]>({
    queryKey: ["product-clients", id],
    queryFn: () => productsApi.getAssignedClients(id).then((r) => r.data),
    enabled: product?.is_global === false,
  });

  const { data: allClients = [] } = useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: () => clientsApi.list().then((r) => r.data),
    enabled: product?.is_global === false,
  });

  const assignMut = useMutation({
    mutationFn: () => clientsApi.assignProduct(selectedClient, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product-clients", id] });
      toast.success("Client assigned");
      setSelectedClient("");
    },
    onError: () => toast.error("Failed to assign client"),
  });

  const unassignMut = useMutation({
    mutationFn: (clientId: string) => clientsApi.unassignProduct(clientId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product-clients", id] });
      toast.success("Client removed");
    },
  });

  const assignedIds = new Set(assignedClients.map((c) => c.id));
  const availableClients = allClients.filter((c) => !assignedIds.has(c.id));

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/products">
          <Button variant="ghost" size="sm"><ArrowLeft size={16} className="mr-1" />Back</Button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">{product?.name ?? "…"}</h1>
        {product && (
          <Badge variant={product.is_global ? "default" : "secondary"}>
            {product.is_global ? "Global" : "Client-specific"}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Product Info</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {product?.description && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Description</p>
                <p className="text-sm text-slate-700">{product.description}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Unit Price</p>
              <p className="text-lg font-bold text-blue-600">
                {product ? formatCurrency(product.unit_price, product.currency) : "—"}
                <span className="text-xs text-slate-400 font-normal ml-1">/ {product?.unit}</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Availability</p>
              <p className="text-sm text-slate-700">
                {product?.is_global
                  ? "Available to all clients"
                  : "Must be explicitly assigned to clients"}
              </p>
            </div>
          </CardContent>
        </Card>

        {product?.is_global ? (
          <Card>
            <CardHeader><CardTitle className="text-base">Client Assignments</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-slate-400 py-4">
                <Users size={20} className="opacity-50" />
                <p className="text-sm">This is a global product — available to all clients automatically.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assigned Clients</CardTitle>
              <p className="text-xs text-slate-500 mt-1">Only these clients will see this product in quotations & invoices</p>
            </CardHeader>
            <CardContent>
              {canWrite && availableClients.length > 0 && (
                <div className="flex gap-2 mb-4">
                  <Select value={selectedClient} onValueChange={setSelectedClient}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a client to assign…" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableClients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={() => assignMut.mutate()} disabled={!selectedClient}>
                    <Plus size={16} />
                  </Button>
                </div>
              )}

              {assignedClients.length === 0 ? (
                <p className="text-sm text-slate-400">No clients assigned yet.</p>
              ) : (
                <div className="space-y-2">
                  {assignedClients.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{c.name}</p>
                        {c.email && <p className="text-xs text-slate-500">{c.email}</p>}
                      </div>
                      {canWrite && (
                        <button
                          onClick={() => unassignMut.mutate(c.id)}
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
        )}
      </div>
    </div>
  );
}
