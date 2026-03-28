"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clientsApi } from "@/lib/api";
import { useClients } from "@/lib/hooks/use-clients";
import { useAuth } from "@/lib/auth-context";
import { canEdit } from "@/lib/utils";
import type { Client } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Users } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").or(z.literal("")),
  phone: z.string(),
  address: z.string(),
  contact_person: z.string(),
});

type FormData = z.infer<typeof schema>;

const EMPTY: FormData = { name: "", email: "", phone: "", address: "", contact_person: "" };

export default function ClientsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const canWrite = canEdit(user?.role);

  const { data: clients = [], isLoading } = useClients();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
  });

  function openCreate() {
    setEditing(null);
    reset(EMPTY);
    setOpen(true);
  }

  function openEdit(c: Client) {
    setEditing(c);
    reset({ name: c.name, email: c.email ?? "", phone: c.phone ?? "", address: c.address ?? "", contact_person: c.contact_person ?? "" });
    setOpen(true);
  }

  const createMut = useMutation({
    mutationFn: (data: FormData) => clientsApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["clients"] }); toast.success("Client created"); setOpen(false); },
    onError: () => toast.error("Failed to create client"),
  });

  const updateMut = useMutation({
    mutationFn: (data: FormData) => clientsApi.update(editing!.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["clients"] }); toast.success("Client updated"); setOpen(false); },
    onError: () => toast.error("Failed to update client"),
  });

  function onSubmit(data: FormData) {
    // Strip empty strings so optional fields are omitted (backend EmailStr rejects "")
    const clean = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== "")
    );
    editing ? updateMut.mutate(clean as FormData) : createMut.mutate(clean as FormData);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Clients</h1>
        {canWrite && (
          <Button onClick={openCreate} size="sm">
            <Plus size={16} className="mr-1" /> New Client
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Users size={40} className="mx-auto mb-3 opacity-40" />
          <p>No clients yet. {canWrite && "Create your first client."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {clients.map((c) => (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <Link href={`/clients/${c.id}`} className="font-semibold text-slate-800 hover:text-blue-600 truncate block">
                      {c.name}
                    </Link>
                    {c.email && <p className="text-sm text-slate-500 truncate">{c.email}</p>}
                    {c.phone && <p className="text-sm text-slate-500">{c.phone}</p>}
                    {c.contact_person && <p className="text-xs text-slate-400 mt-1">Contact: {c.contact_person}</p>}
                  </div>
                  {canWrite && (
                    <button onClick={() => openEdit(c)} className="ml-2 p-1 text-slate-400 hover:text-blue-600" aria-label={`Edit ${c.name}`}>
                      <Pencil size={15} />
                    </button>
                  )}
                </div>
                <Badge variant={c.is_active ? "default" : "secondary"} className="text-xs">
                  {c.is_active ? "Active" : "Inactive"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Client" : "New Client"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-3 py-2">
              <div>
                <Label className="text-sm">Name *</Label>
                <Input className="mt-1" placeholder="Acme Corp" {...register("name")} />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <Label className="text-sm">Email</Label>
                <Input className="mt-1" placeholder="contact@acme.com" {...register("email")} />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <Label className="text-sm">Phone</Label>
                <Input className="mt-1" placeholder="+1 555 000 0000" {...register("phone")} />
              </div>
              <div>
                <Label className="text-sm">Contact Person</Label>
                <Input className="mt-1" placeholder="John Doe" {...register("contact_person")} />
              </div>
              <div>
                <Label className="text-sm">Address</Label>
                <Input className="mt-1" placeholder="123 Main St…" {...register("address")} />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting || createMut.isPending || updateMut.isPending}>
                {editing ? "Save Changes" : "Create Client"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
