"use client";
import { useState, use } from "react";
import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { isAdmin } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { ActivityLog, User } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const PAGE_SIZE = 20;

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-700",
  UPDATE: "bg-blue-100 text-blue-700",
  DELETE: "bg-red-100 text-red-700",
  STATUS_CHANGE: "bg-purple-100 text-purple-700",
};

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function UserActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (user && !isAdmin(user.role)) router.replace("/dashboard");
  }, [user, router]);

  const { data: targetUser } = useQuery<User>({
    queryKey: ["user", id],
    queryFn: () => usersApi.list().then((r) => (r.data as User[]).find((u) => u.id === id) ?? Promise.reject()),
    enabled: !!id,
  });

  const { data: logs = [], isLoading, isFetching } = useQuery<ActivityLog[]>({
    queryKey: ["user-activity", id, page],
    queryFn: () => usersApi.getActivity(id, { skip: page * PAGE_SIZE, limit: PAGE_SIZE }).then((r) => r.data),
    enabled: !!id,
  });

  const hasNext = logs.length === PAGE_SIZE;
  const hasPrev = page > 0;

  if (!user || !isAdmin(user.role)) return null;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/settings/users" className="text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">User Activity</h1>
          {targetUser && (
            <p className="text-sm text-slate-500 mt-0.5">{targetUser.full_name} · {targetUser.email}</p>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Audit Trail</CardTitle>
            {isFetching && <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />)}</div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-slate-400">No activity recorded for this user.</p>
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
                    {log.ip_address && <span className="text-xs text-slate-400 hidden sm:block">{log.ip_address}</span>}
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
    </div>
  );
}
