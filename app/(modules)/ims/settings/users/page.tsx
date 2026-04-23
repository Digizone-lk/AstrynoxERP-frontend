"use client";
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { isAdmin, ROLE_LABELS, getApiError } from "@/lib/utils";
import type { User, UserRole } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, KeyRound, UserX, UserCheck, Activity, ShieldCheck } from "lucide-react";
import { UsersListSkeleton } from "@/components/ims/skeletons";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const ROLES: UserRole[] = ["super_admin", "accountant", "sales", "viewer"];

const ALL_MODULES = ["dashboard", "clients", "products", "quotations", "invoices", "reports"] as const;
type ModuleKey = typeof ALL_MODULES[number];
const MODULE_LABELS: Record<ModuleKey, string> = {
  dashboard: "Dashboard",
  clients: "Clients",
  products: "Products",
  quotations: "Quotations",
  invoices: "Invoices",
  reports: "Reports & Audit",
};

const ROLE_COLORS: Record<UserRole, string> = {
  super_admin: "bg-purple-100 text-purple-700",
  accountant: "bg-blue-100 text-blue-700",
  sales: "bg-green-100 text-green-700",
  viewer: "bg-slate-100 text-slate-600",
};

const createSchema = z.object({
  full_name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Min 8 characters"),
  role: z.enum(["super_admin", "accountant", "sales", "viewer"]),
});

const editSchema = z.object({
  full_name: z.string().min(1, "Name is required"),
  email: z.string().optional(),
  password: z.string().optional(),
  role: z.enum(["super_admin", "accountant", "sales", "viewer"]),
});

const resetPasswordSchema = z
  .object({
    new_password: z
      .string()
      .min(8, "Min 8 characters")
      .regex(/[A-Z]/, "Must contain uppercase")
      .regex(/[a-z]/, "Must contain lowercase")
      .regex(/[0-9]/, "Must contain a number"),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type CreateFormData = z.infer<typeof createSchema>;
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function UsersPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !isAdmin(user.role)) router.replace("/ims/dashboard");
  }, [user, router]);

  const qc = useQueryClient();
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: () => usersApi.list().then((r) => r.data),
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<User | null>(null);
  const [reactivateTarget, setReactivateTarget] = useState<User | null>(null);
  const [modulesTarget, setModulesTarget] = useState<User | null>(null);

  // ── Create/edit form ──
  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm<CreateFormData>({
    resolver: zodResolver(editing ? editSchema : createSchema) as never,
    defaultValues: { full_name: "", email: "", password: "", role: "viewer" },
  });

  function openCreate() {
    setEditing(null);
    reset({ full_name: "", email: "", password: "", role: "viewer" });
    setOpen(true);
  }

  function openEdit(u: User) {
    setEditing(u);
    reset({ full_name: u.full_name, email: u.email, password: "", role: u.role });
    setOpen(true);
  }

  const createMut = useMutation({
    mutationFn: (data: CreateFormData) => usersApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); toast.success("User created"); setOpen(false); },
    onError: (e) => toast.error(getApiError(e, "Failed to create user")),
  });

  const updateMut = useMutation({
    mutationFn: (data: { full_name: string; role: UserRole }) => usersApi.update(editing!.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); toast.success("User updated"); setOpen(false); },
    onError: (e) => toast.error(getApiError(e, "Failed to update user")),
  });

  const deactivateMut = useMutation({
    mutationFn: (id: string) => usersApi.deactivate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); toast.success("User deactivated"); setDeactivateTarget(null); },
    onError: (e) => toast.error(getApiError(e, "Failed to deactivate user")),
  });

  const reactivateMut = useMutation({
    mutationFn: (id: string) => usersApi.reactivate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); toast.success("User reactivated"); setReactivateTarget(null); },
    onError: (e) => toast.error(getApiError(e, "Failed to reactivate user")),
  });

  function onSubmit(data: CreateFormData) {
    editing ? updateMut.mutate({ full_name: data.full_name, role: data.role }) : createMut.mutate(data);
  }

  if (!user || !isAdmin(user.role)) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Users</h1>
        <Button onClick={openCreate} size="sm"><Plus size={16} className="mr-1" /> Create User</Button>
      </div>

      {isLoading ? (
        <UsersListSkeleton />
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <Card key={u.id} className={!u.is_active ? "opacity-60" : ""}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm shrink-0">
                      {u.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 flex items-center gap-2 flex-wrap">
                        <span className="truncate">{u.full_name}</span>
                        {!u.is_active && <span className="text-xs text-slate-400 font-normal">(inactive)</span>}
                      </p>
                      <p className="text-sm text-slate-500 truncate">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_COLORS[u.role]}`}>
                      {ROLE_LABELS[u.role]}
                    </span>
                    {u.id !== user.id && (
                      <>
                        <button onClick={() => openEdit(u)} className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors" aria-label={`Edit ${u.full_name}`}>
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setResetTarget(u)} className="text-slate-400 hover:text-amber-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors" aria-label={`Reset password for ${u.full_name}`}>
                          <KeyRound size={14} />
                        </button>
                        {u.is_active ? (
                          <button onClick={() => setDeactivateTarget(u)} className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors" aria-label={`Deactivate ${u.full_name}`}>
                            <UserX size={14} />
                          </button>
                        ) : (
                          <button onClick={() => setReactivateTarget(u)} className="text-slate-400 hover:text-green-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors" aria-label={`Reactivate ${u.full_name}`}>
                            <UserCheck size={14} />
                          </button>
                        )}
                        {u.role !== "super_admin" && (
                          <button onClick={() => setModulesTarget(u)} className="text-slate-400 hover:text-purple-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors" aria-label={`Manage module access for ${u.full_name}`}>
                            <ShieldCheck size={14} />
                          </button>
                        )}
                        <button onClick={() => router.push(`/ims/settings/users/${u.id}/activity`)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors" aria-label={`View activity for ${u.full_name}`}>
                          <Activity size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit User" : "Create User"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-3 py-2">
              <div>
                <Label>Full Name</Label>
                <Input className="mt-1" placeholder="Jane Smith" {...register("full_name")} />
                {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name.message}</p>}
              </div>
              {!editing && (
                <>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" className="mt-1" placeholder="jane@company.com" {...register("email")} />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                  </div>
                  <div>
                    <Label>Password</Label>
                    <Input type="password" className="mt-1" placeholder="Min 8 chars" {...register("password")} />
                    {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
                  </div>
                </>
              )}
              <div>
                <Label>Role</Label>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting || createMut.isPending || updateMut.isPending}>
                {editing ? "Save" : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Module access dialog */}
      {modulesTarget && (
        <ModuleAccessDialog
          user={modulesTarget}
          onClose={() => setModulesTarget(null)}
          onSaved={() => { qc.invalidateQueries({ queryKey: ["users"] }); setModulesTarget(null); }}
        />
      )}

      {/* Reset password dialog */}
      {resetTarget && (
        <ResetPasswordDialog
          user={resetTarget}
          onClose={() => setResetTarget(null)}
        />
      )}

      {/* Deactivate confirm dialog */}
      <Dialog open={!!deactivateTarget} onOpenChange={() => setDeactivateTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Deactivate User</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600 py-2">
            Are you sure you want to deactivate <strong>{deactivateTarget?.full_name}</strong>? They will no longer be able to log in.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deactivateTarget && deactivateMut.mutate(deactivateTarget.id)}
              disabled={deactivateMut.isPending}
            >
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reactivate confirm dialog */}
      <Dialog open={!!reactivateTarget} onOpenChange={() => setReactivateTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Reactivate User</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600 py-2">
            Reactivate <strong>{reactivateTarget?.full_name}</strong>? They will be able to log in again.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReactivateTarget(null)}>Cancel</Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => reactivateTarget && reactivateMut.mutate(reactivateTarget.id)}
              disabled={reactivateMut.isPending}
            >
              Reactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Module Access Dialog ───────────────────────────────────────────────────────
function ModuleAccessDialog({
  user,
  onClose,
  onSaved,
}: {
  user: User;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [selected, setSelected] = useState<Set<ModuleKey>>(
    new Set(user.allowed_modules ? (user.allowed_modules as ModuleKey[]) : ALL_MODULES)
  );
  const isFullAccess = selected.size === ALL_MODULES.length;

  const mut = useMutation({
    mutationFn: () =>
      usersApi.updateModules(
        user.id,
        isFullAccess ? null : Array.from(selected)
      ),
    onSuccess: () => { toast.success("Module access updated"); onSaved(); },
    onError: (e) => toast.error(getApiError(e, "Failed to update modules")),
  });

  function toggle(m: ModuleKey) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(m) ? next.delete(m) : next.add(m);
      return next;
    });
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Module Access — {user.full_name}</DialogTitle>
          <p className="text-xs text-slate-500 mt-1">Uncheck modules to hide them from this user's sidebar.</p>
        </DialogHeader>
        <div className="py-2 space-y-2">
          {ALL_MODULES.map((m) => (
            <label key={m} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.has(m)}
                onChange={() => toggle(m)}
                className="w-4 h-4 accent-blue-600"
              />
              <span className="text-sm font-medium text-slate-700">{MODULE_LABELS[m]}</span>
            </label>
          ))}
        </div>
        {isFullAccess && (
          <p className="text-xs text-slate-400 px-1">All modules selected — saved as "full access" (no restriction).</p>
        )}
        <DialogFooter className="mt-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending || selected.size === 0}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


// ── Reset Password Dialog ──────────────────────────────────────────────────────
function ResetPasswordDialog({ user, onClose }: { user: User; onClose: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const resetMut = useMutation({
    mutationFn: (data: ResetPasswordFormData) => usersApi.resetPassword(user.id, data.new_password),
    onSuccess: () => { toast.success(`Password reset for ${user.full_name}`); onClose(); },
    onError: (e) => toast.error(getApiError(e, "Failed to reset password")),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Reset Password — {user.full_name}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit((d) => resetMut.mutate(d))}>
          <div className="space-y-3 py-2">
            <div>
              <Label>New Password</Label>
              <Input type="password" className="mt-1" placeholder="••••••••" {...register("new_password")} />
              {errors.new_password && <p className="text-xs text-red-500 mt-1">{errors.new_password.message}</p>}
              <p className="text-xs text-slate-400 mt-1">Min 8 · uppercase · lowercase · number</p>
            </div>
            <div>
              <Label>Confirm Password</Label>
              <Input type="password" className="mt-1" placeholder="••••••••" {...register("confirm_password")} />
              {errors.confirm_password && <p className="text-xs text-red-500 mt-1">{errors.confirm_password.message}</p>}
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || resetMut.isPending}>Reset Password</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
