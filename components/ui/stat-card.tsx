import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color?: string;
  converting?: boolean;
}

export function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  color = "text-blue-600",
  converting = false,
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">{title}</p>
            <p className={`text-2xl font-bold mt-1 ${converting ? "opacity-50" : ""}`}>{value}</p>
            {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
          </div>
          <div className={`p-2 rounded-lg bg-slate-100 ${color}`}>
            <Icon size={20} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
