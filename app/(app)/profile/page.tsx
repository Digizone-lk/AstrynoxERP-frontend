"use client";
import { useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { getApiError, ROLE_LABELS } from "@/lib/utils";
import type { UserProfile, Session, NotificationPrefs, ActivityLog } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  User,
  Shield,
  Bell,
  Activity,
  Camera,
  Trash2,
  Monitor,
  Smartphone,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "activity", label: "Activity", icon: Activity },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ─── Zod schemas ──────────────────────────────────────────────────────────────
const profileSchema = z.object({
  full_name: z.string().min(1, "Name is required"),
  phone: z.string(),
  job_title: z.string(),
  timezone: z.string(),
  language: z.string(),
});

const passwordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z
      .string()
      .min(8, "Min 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[a-z]/, "Must contain a lowercase letter")
      .regex(/[0-9]/, "Must contain a number"),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function deviceIcon(info: string | null) {
  if (!info) return Monitor;
  const lower = info.toLowerCase();
  if (lower.includes("mobile") || lower.includes("android") || lower.includes("iphone")) return Smartphone;
  return Monitor;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-700",
  UPDATE: "bg-blue-100 text-blue-700",
  DELETE: "bg-red-100 text-red-700",
  STATUS_CHANGE: "bg-purple-100 text-purple-700",
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const [tab, setTab] = useState<TabId>("profile");
  const { user, refresh: refreshAuth } = useAuth();
  const qc = useQueryClient();

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">My Profile</h1>

      {/* Tab nav */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              tab === id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {tab === "profile" && <ProfileTab user={user} onUpdate={() => { qc.invalidateQueries({ queryKey: ["profile"] }); refreshAuth(); }} />}
      {tab === "security" && <SecurityTab />}
      {tab === "notifications" && <NotificationsTab />}
      {tab === "activity" && <ActivityTab />}
    </div>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────
function ProfileTab({ user, onUpdate }: { user: ReturnType<typeof useAuth>["user"]; onUpdate: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ["profile"],
    queryFn: () => profileApi.get().then((r) => r.data),
  });

  const { register, handleSubmit, formState: { errors, isSubmitting, isDirty } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: profile
      ? { full_name: profile.full_name, phone: profile.phone ?? "", job_title: profile.job_title ?? "", timezone: profile.timezone, language: profile.language }
      : undefined,
  });

  const updateMut = useMutation({
    mutationFn: (data: ProfileFormData) => profileApi.update(data),
    onSuccess: () => { toast.success("Profile updated"); onUpdate(); },
    onError: (e) => toast.error(getApiError(e, "Failed to update profile")),
  });

  const avatarUploadMut = useMutation({
    mutationFn: (file: File) => profileApi.uploadAvatar(file),
    onSuccess: () => { toast.success("Avatar updated"); onUpdate(); setAvatarPreview(null); },
    onError: (e) => toast.error(getApiError(e, "Failed to upload avatar")),
  });

  const avatarDeleteMut = useMutation({
    mutationFn: () => profileApi.deleteAvatar(),
    onSuccess: () => { toast.success("Avatar removed"); onUpdate(); },
    onError: (e) => toast.error(getApiError(e, "Failed to remove avatar")),
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("File too large — max 2 MB"); return; }
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowed.includes(file.type)) { toast.error("Unsupported format — use JPEG, PNG, GIF or WebP"); return; }
    setAvatarPreview(URL.createObjectURL(file));
    avatarUploadMut.mutate(file);
  }

  const avatarSrc = avatarPreview ?? (profile?.avatar_url
    ? (profile.avatar_url.startsWith("http") ? profile.avatar_url : `${process.env.NEXT_PUBLIC_API_URL}${profile.avatar_url}`)
    : null);
  const initials = (profile?.full_name ?? user?.full_name ?? "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  if (isLoading) return <div className="text-slate-400 text-sm">Loading…</div>;

  return (
    <div className="space-y-6">
      {/* Avatar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              {avatarSrc ? (
                <img src={avatarSrc} alt="Avatar" className="w-20 h-20 rounded-full object-cover ring-2 ring-slate-200" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-bold ring-2 ring-slate-200">
                  {initials}
                </div>
              )}
              {(avatarUploadMut.isPending) && (
                <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-800">{profile?.full_name}</p>
              <p className="text-sm text-slate-500">{profile?.email}</p>
              <Badge className="mt-1 text-xs capitalize">{ROLE_LABELS[profile?.role ?? "viewer"]}</Badge>
            </div>
            <div className="flex gap-2">
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleFileChange} />
              <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={avatarUploadMut.isPending} aria-label="Upload avatar">
                <Camera size={14} className="mr-1.5" /> Change
              </Button>
              {profile?.avatar_url && (
                <Button size="sm" variant="outline" onClick={() => avatarDeleteMut.mutate()} disabled={avatarDeleteMut.isPending} aria-label="Remove avatar">
                  <Trash2 size={14} />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile form */}
      <Card>
        <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((d) => updateMut.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Full Name</Label>
                <Input className="mt-1" {...register("full_name")} />
                {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name.message}</p>}
              </div>
              <div>
                <Label>Phone</Label>
                <Input className="mt-1" placeholder="+1 555 000 0000" {...register("phone")} />
              </div>
              <div>
                <Label>Job Title</Label>
                <Input className="mt-1" placeholder="e.g. Finance Manager" {...register("job_title")} />
              </div>
              <div>
                <Label>Timezone</Label>
                <Input className="mt-1" placeholder="UTC" {...register("timezone")} />
              </div>
              <div>
                <Label>Language</Label>
                <Input className="mt-1" placeholder="en" {...register("language")} />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={!isDirty || isSubmitting || updateMut.isPending}>
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Security Tab ─────────────────────────────────────────────────────────────
function SecurityTab() {
  const qc = useQueryClient();

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<Session[]>({
    queryKey: ["sessions"],
    queryFn: () => profileApi.getSessions().then((r) => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const changePassMut = useMutation({
    mutationFn: (d: PasswordFormData) => profileApi.changePassword({ current_password: d.current_password, new_password: d.new_password }),
    onSuccess: () => { toast.success("Password changed"); reset(); },
    onError: (e) => toast.error(getApiError(e, "Failed to change password")),
  });

  const revokeOneMut = useMutation({
    mutationFn: (id: string) => profileApi.revokeSession(id),
    onSuccess: () => { toast.success("Session revoked"); qc.invalidateQueries({ queryKey: ["sessions"] }); },
    onError: (e) => toast.error(getApiError(e, "Failed to revoke session")),
  });

  const revokeAllMut = useMutation({
    mutationFn: () => profileApi.revokeAllSessions(),
    onSuccess: () => { toast.success("All other sessions revoked"); qc.invalidateQueries({ queryKey: ["sessions"] }); },
    onError: (e) => toast.error(getApiError(e, "Failed to revoke sessions")),
  });

  const otherSessions = sessions.filter((s) => !s.is_current);

  return (
    <div className="space-y-6">
      {/* Change password */}
      <Card>
        <CardHeader><CardTitle className="text-base">Change Password</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((d) => changePassMut.mutate(d))} className="space-y-4">
            <div>
              <Label>Current Password</Label>
              <Input type="password" className="mt-1" placeholder="••••••••" {...register("current_password")} />
              {errors.current_password && <p className="text-xs text-red-500 mt-1">{errors.current_password.message}</p>}
            </div>
            <div>
              <Label>New Password</Label>
              <Input type="password" className="mt-1" placeholder="••••••••" {...register("new_password")} />
              {errors.new_password && <p className="text-xs text-red-500 mt-1">{errors.new_password.message}</p>}
              <p className="text-xs text-slate-400 mt-1">Min 8 chars · uppercase · lowercase · number</p>
            </div>
            <div>
              <Label>Confirm New Password</Label>
              <Input type="password" className="mt-1" placeholder="••••••••" {...register("confirm_password")} />
              {errors.confirm_password && <p className="text-xs text-red-500 mt-1">{errors.confirm_password.message}</p>}
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isSubmitting || changePassMut.isPending}>
                Update Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Active sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Active Sessions</CardTitle>
            {otherSessions.length > 0 && (
              <Button size="sm" variant="outline" onClick={() => revokeAllMut.mutate()} disabled={revokeAllMut.isPending}>
                <LogOut size={13} className="mr-1.5" /> Revoke all others
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {sessionsLoading ? (
            <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />)}</div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-slate-400">No active sessions found.</p>
          ) : (
            <div className="space-y-2">
              {sessions.map((s) => {
                const DeviceIcon = deviceIcon(s.device_info);
                return (
                  <div key={s.id} className={cn("flex items-center gap-3 p-3 rounded-lg border", s.is_current ? "border-blue-200 bg-blue-50" : "border-slate-100")}>
                    <DeviceIcon size={18} className={s.is_current ? "text-blue-500" : "text-slate-400"} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">
                        {s.device_info ?? "Unknown device"}
                        {s.is_current && <span className="ml-2 text-xs font-normal text-blue-500">Current session</span>}
                      </p>
                      <p className="text-xs text-slate-400">{s.ip_address ?? "Unknown IP"} · Last active {formatRelative(s.last_active_at)}</p>
                    </div>
                    {!s.is_current && (
                      <button
                        onClick={() => revokeOneMut.mutate(s.id)}
                        disabled={revokeOneMut.isPending}
                        className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                        aria-label="Revoke session"
                      >
                        <LogOut size={15} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Notifications Tab ────────────────────────────────────────────────────────
function NotificationsTab() {
  const qc = useQueryClient();

  const { data: prefs, isLoading } = useQuery<NotificationPrefs>({
    queryKey: ["notifications"],
    queryFn: () => profileApi.getNotifications().then((r) => r.data),
  });

  const updateMut = useMutation({
    mutationFn: (data: Partial<NotificationPrefs>) => profileApi.updateNotifications(data),
    onSuccess: (res) => { qc.setQueryData(["notifications"], res.data); toast.success("Preferences saved"); },
    onError: (e) => toast.error(getApiError(e, "Failed to save preferences")),
  });

  function toggle(key: keyof NotificationPrefs) {
    if (!prefs) return;
    updateMut.mutate({ [key]: !prefs[key] });
  }

  const ITEMS: { key: keyof NotificationPrefs; label: string; description: string }[] = [
    { key: "invoice_paid", label: "Invoice paid", description: "When a client pays an invoice" },
    { key: "invoice_overdue", label: "Invoice overdue", description: "When an invoice becomes overdue" },
    { key: "quotation_approved", label: "Quotation approved", description: "When a quotation is approved" },
    { key: "quotation_rejected", label: "Quotation rejected", description: "When a quotation is rejected" },
    { key: "new_user_added", label: "New user added", description: "When a new member joins your organization" },
  ];

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Email Notifications</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">{[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />)}</div>
        ) : (
          <div className="space-y-1">
            {ITEMS.map(({ key, label, description }) => (
              <div key={key} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-slate-700">{label}</p>
                  <p className="text-xs text-slate-400">{description}</p>
                </div>
                <Switch
                  checked={prefs?.[key] ?? false}
                  onCheckedChange={() => toggle(key)}
                  disabled={updateMut.isPending}
                  aria-label={`Toggle ${label}`}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Activity Tab ─────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;

function ActivityTab() {
  const [page, setPage] = useState(0);

  const { data: logs = [], isLoading, isFetching } = useQuery<ActivityLog[]>({
    queryKey: ["my-activity", page],
    queryFn: () => profileApi.getActivity({ skip: page * PAGE_SIZE, limit: PAGE_SIZE }).then((r) => r.data),
  });

  const hasNext = logs.length === PAGE_SIZE;
  const hasPrev = page > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Recent Activity</CardTitle>
          {isFetching && <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />)}</div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-slate-400">No activity recorded yet.</p>
        ) : (
          <>
            <div className="space-y-1">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
                  <Badge className={cn("text-xs capitalize shrink-0", ACTION_COLORS[log.action] ?? "bg-slate-100 text-slate-600")}>
                    {log.action.toLowerCase().replace("_", " ")}
                  </Badge>
                  <p className="text-sm text-slate-700 flex-1 capitalize">
                    {log.resource_type.replace(/_/g, " ")}
                    {log.resource_id && <span className="text-slate-400 text-xs ml-1">#{log.resource_id.slice(0, 8)}</span>}
                  </p>
                  <p className="text-xs text-slate-400 shrink-0">{formatRelative(log.created_at)}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
              <Button size="sm" variant="outline" disabled={!hasPrev} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft size={14} className="mr-1" /> Previous
              </Button>
              <span className="text-xs text-slate-400">Page {page + 1}</span>
              <Button size="sm" variant="outline" disabled={!hasNext} onClick={() => setPage((p) => p + 1)}>
                Next <ChevronRight size={14} className="ml-1" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
