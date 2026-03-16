"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { isAdmin, ROLE_LABELS } from "@/lib/utils";
import type { User, UserRole } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Users } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const ROLES: UserRole[] = ["super_admin", "accountant", "sales", "viewer"];

const ROLE_COLORS: Record<UserRole, string> = {
  super_admin: "bg-purple-100 text-purple-700",
  accountant: "bg-blue-100 text-blue-700",
  sales: "bg-green-100 text-green-700",
  viewer: "bg-slate-100 text-slate-600",
};

export default function UsersPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !isAdmin(user.role)) router.replace("/dashboard");
  }, [user, router]);

  const qc = useQueryClient();
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: () => usersApi.list().then((r) => r.data),
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({ full_name: "", email: "", password: "", role: "viewer" as UserRole });

  function openCreate() {
    setEditing(null);
    setForm({ full_name: "", email: "", password: "", role: "viewer" });
    setOpen(true);
  }

  function openEdit(u: User) {
    setEditing(u);
    setForm({ full_name: u.full_name, email: u.email, password: "", role: u.role });
    setOpen(true);
  }

  const createMut = useMutation({
    mutationFn: () => usersApi.create({ full_name: form.full_name, email: form.email, password: form.password, role: form.role }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); toast.success("User created"); setOpen(false); },
    onError: (e: any) => toast.error(e.response?.data?.detail ?? "Failed to create user"),
  });

  const updateMut = useMutation({
    mutationFn: () => usersApi.update(editing!.id, { full_name: form.full_name, role: form.role }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); toast.success("User updated"); setOpen(false); },
  });

  if (!user || !isAdmin(user.role)) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Users</h1>
        <Button onClick={openCreate} size="sm"><Plus size={16} className="mr-1" /> Invite User</Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <Card key={u.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
                      {u.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{u.full_name}</p>
                      <p className="text-sm text-slate-500">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_COLORS[u.role]}`}>
                      {ROLE_LABELS[u.role]}
                    </span>
                    {u.id !== user.id && (
                      <button onClick={() => openEdit(u)} className="text-slate-400 hover:text-blue-600 p-1">
                        <Pencil size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit User" : "Invite User"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Full Name</Label>
              <Input className="mt-1" placeholder="Jane Smith" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            {!editing && (
              <>
                <div>
                  <Label>Email</Label>
                  <Input type="email" className="mt-1" placeholder="jane@company.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input type="password" className="mt-1" placeholder="Min 8 chars" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                </div>
              </>
            )}
            <div>
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as UserRole })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => editing ? updateMut.mutate() : createMut.mutate()} disabled={createMut.isPending || updateMut.isPending}>
              {editing ? "Save" : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
