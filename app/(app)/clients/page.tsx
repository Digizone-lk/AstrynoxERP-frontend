"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { canEdit } from "@/lib/utils";
import type { Client } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const EMPTY = { name: "", email: "", phone: "", address: "", contact_person: "" };

export default function ClientsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const canWrite = canEdit(user?.role);

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: () => clientsApi.list().then((r) => r.data),
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState(EMPTY);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  }

  function openEdit(c: Client) {
    setEditing(c);
    setForm({ name: c.name, email: c.email ?? "", phone: c.phone ?? "", address: c.address ?? "", contact_person: c.contact_person ?? "" });
    setOpen(true);
  }

  const createMut = useMutation({
    mutationFn: () => clientsApi.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["clients"] }); toast.success("Client created"); setOpen(false); },
    onError: () => toast.error("Failed to create client"),
  });

  const updateMut = useMutation({
    mutationFn: () => clientsApi.update(editing!.id, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["clients"] }); toast.success("Client updated"); setOpen(false); },
    onError: () => toast.error("Failed to update client"),
  });

  function handleSave() {
    editing ? updateMut.mutate() : createMut.mutate();
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
                    <button onClick={() => openEdit(c)} className="ml-2 p-1 text-slate-400 hover:text-blue-600">
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
          <div className="space-y-3 py-2">
            {[
              { key: "name", label: "Name *", placeholder: "Acme Corp" },
              { key: "email", label: "Email", placeholder: "contact@acme.com" },
              { key: "phone", label: "Phone", placeholder: "+1 555 000 0000" },
              { key: "contact_person", label: "Contact Person", placeholder: "John Doe" },
              { key: "address", label: "Address", placeholder: "123 Main St…" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <Label className="text-sm">{label}</Label>
                <Input
                  className="mt-1"
                  placeholder={placeholder}
                  value={(form as any)[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>
              {editing ? "Save Changes" : "Create Client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
