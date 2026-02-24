import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type TrendDir = "up" | "down" | "neutral";

interface StatCardProps {
  title: string;
  value: string;
  trend?: string;
  trendDir?: TrendDir;
  subtext?: string;
  icon?: React.ReactNode;
  valueColor?: string;
}

const trendConfig: Record<TrendDir, { color: string; Icon: React.ElementType }> = {
  up: { color: "text-emerald-600 bg-emerald-50", Icon: TrendingUp },
  down: { color: "text-red-600 bg-red-50", Icon: TrendingDown },
  neutral: { color: "text-gray-500 bg-gray-100", Icon: Minus },
};

export function StatCard({
  title,
  value,
  trend,
  trendDir = "neutral",
  subtext,
  icon,
  valueColor,
}: StatCardProps) {
  const { color, Icon } = trendConfig[trendDir];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className={cn("text-3xl font-bold text-gray-900 truncate", valueColor)}>
            {value}
          </p>
        </div>
        {icon && (
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 ml-3 flex-shrink-0">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mt-4">
        {trend && (
          <span className={cn("inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full", color)}>
            <Icon className="w-3 h-3" />
            {trend}
          </span>
        )}
        {subtext && (
          <span className="text-xs text-gray-400">{subtext}</span>
        )}
      </div>
    </div>
  );
}
