import { Skeleton } from "@/components/ui/skeleton";

// ─── Shared building blocks ────────────────────────────────────────────────────

function PageHeader({ titleW = "w-36", btnW = "w-28" }: { titleW?: string; btnW?: string }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <Skeleton className={`h-8 ${titleW}`} />
      <Skeleton className={`h-9 ${btnW}`} />
    </div>
  );
}

function StatCardSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-9 rounded-lg" />
      </div>
      <Skeleton className={`${tall ? "h-8" : "h-6"} w-32 mb-2`} />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <Skeleton className="h-5 w-20 mb-4" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 px-5 py-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-52" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────

export function DashboardSkeleton() {
  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-9 w-52" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} tall />)}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <Skeleton className="h-5 w-40 mb-6" />
        <Skeleton className="h-72 w-full rounded-lg" />
      </div>
    </div>
  );
}

// ─── Lists (invoices, quotations) ─────────────────────────────────────────────

export function ListSkeleton({ title = "w-28", count = 6 }: { title?: string; count?: number }) {
  return (
    <div>
      <PageHeader titleW={title} />
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => <RowSkeleton key={i} />)}
      </div>
    </div>
  );
}

// ─── Card grids (clients, products) ───────────────────────────────────────────

export function CardGridSkeleton({ title = "w-20", count = 6 }: { title?: string; count?: number }) {
  return (
    <div>
      <PageHeader titleW={title} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="space-y-2 flex-1 min-w-0 mr-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-2/3" />
              </div>
              <Skeleton className="h-6 w-6 shrink-0" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Detail pages (invoice/[id], quotation/[id]) ──────────────────────────────

export function DocumentDetailSkeleton() {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-24" />)}
      </div>

      <div className="max-w-4xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>

        {/* Line items */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <Skeleton className="h-5 w-24 mb-5" />
          <div className="space-y-3">
            {/* Header row */}
            <div className="grid grid-cols-4 gap-4 pb-2 border-b border-slate-100">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-3" />)}
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="grid grid-cols-4 gap-4">
                <Skeleton className="h-4 col-span-2" />
                <Skeleton className="h-4" />
                <Skeleton className="h-4" />
              </div>
            ))}
            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Skeleton className="h-5 w-36" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Client / Product detail (back + 2-col cards) ─────────────────────────────

export function EntityDetailSkeleton() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <Skeleton className="h-5 w-28 mb-5" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-3 w-20 mb-1.5" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <Skeleton className="h-5 w-40 mb-2" />
          <Skeleton className="h-3 w-64 mb-5" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-5 w-5" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Reports ───────────────────────────────────────────────────────────────────

export function ReportsSkeleton() {
  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-44" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} tall />)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <Skeleton className="h-5 w-40 mb-5" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <Skeleton className="h-5 w-36 mb-5" />
          <Skeleton className="h-64 w-full rounded-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {[0, 1].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5">
            <Skeleton className="h-5 w-44 mb-5" />
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4 pb-2 border-b border-slate-100">
                {Array.from({ length: 3 }).map((_, j) => <Skeleton key={j} className="h-3" />)}
              </div>
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="grid grid-cols-3 gap-4">
                  <Skeleton className="h-4" />
                  <Skeleton className="h-4" />
                  <Skeleton className="h-4" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <Skeleton className="h-5 w-48 mb-5" />
        <div className="space-y-3">
          <div className="grid grid-cols-5 gap-4 pb-2 border-b border-slate-100">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-3" />)}
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="grid grid-cols-5 gap-4">
              <Skeleton className="h-4" />
              <Skeleton className="h-4" />
              <Skeleton className="h-4" />
              <Skeleton className="h-4" />
              <Skeleton className="h-5 w-10 rounded-full justify-self-end" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Users list ────────────────────────────────────────────────────────────────

export function UsersListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div>
      <PageHeader titleW="w-20" btnW="w-28" />
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-44" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-7 w-7 rounded-lg" />
                <Skeleton className="h-7 w-7 rounded-lg" />
                <Skeleton className="h-7 w-7 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Activity log ──────────────────────────────────────────────────────────────

export function ActivitySkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
          <Skeleton className="h-6 w-20 rounded-full shrink-0" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-3 w-16 hidden sm:block" />
          <Skeleton className="h-3 w-12 shrink-0" />
        </div>
      ))}
    </div>
  );
}
