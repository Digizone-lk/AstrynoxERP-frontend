"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { auditApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { canFinance, formatDate } from "@/lib/utils";
import type { AuditLog } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList } from "lucide-react";

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-700",
  UPDATE: "bg-blue-100 text-blue-700",
  DELETE: "bg-red-100 text-red-700",
  STATUS_CHANGE: "bg-purple-100 text-purple-700",
  CONVERT: "bg-amber-100 text-amber-700",
  ASSIGN_PRODUCT: "bg-teal-100 text-teal-700",
  UNASSIGN_PRODUCT: "bg-orange-100 text-orange-700",
};

export default function AuditLogPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !canFinance(user.role)) router.replace("/dashboard");
  }, [user, router]);

  const { data: logs = [], isLoading } = useQuery<AuditLog[]>({
    queryKey: ["audit-logs"],
    queryFn: () => auditApi.list({ limit: 200 }).then((r) => r.data),
  });

  if (!user || !canFinance(user.role)) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Audit Log</h1>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <ClipboardList size={40} className="mx-auto mb-3 opacity-40" />
          <p>No audit entries yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <Card key={log.id}>
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded shrink-0 ${ACTION_COLORS[log.action] ?? "bg-slate-100 text-slate-700"}`}>
                      {log.action}
                    </span>
                    <span className="text-sm text-slate-600 capitalize">{log.resource_type}</span>
                    {log.resource_id && (
                      <span className="text-xs text-slate-400 truncate font-mono">{log.resource_id}</span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
                {!!(log.extra_data && typeof log.extra_data === "object" && Object.keys(log.extra_data as object).length > 0) && (
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    {JSON.stringify(log.extra_data as Record<string, unknown>)}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
