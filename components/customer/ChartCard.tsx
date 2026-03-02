"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Card } from "@/components/ui/Card";

interface DataPoint {
  [key: string]: string | number;
}

// Use a serializable format descriptor instead of a function prop
type ChartFormat = "number" | "currency" | "percent";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  data: DataPoint[];
  type?: "line" | "bar";
  dataKey: string;
  xKey?: string;
  color?: string;
  format?: ChartFormat;
}

function applyFormat(value: number, format?: ChartFormat): string {
  if (format === "currency") return `€ ${value.toFixed(2)}`;
  if (format === "percent") return `${value.toFixed(1)}%`;
  return String(value);
}

export function ChartCard({
  title,
  subtitle,
  data,
  type = "line",
  dataKey,
  xKey = "day",
  color = "#6366f1",
  format,
}: ChartCardProps) {
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: { value: number }[];
    label?: string;
  }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 shadow-lg text-sm">
        <p className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">{label}</p>
        <p className="font-semibold text-gray-900 dark:text-gray-100">
          {applyFormat(payload[0].value, format)}
        </p>
      </div>
    );
  };

  return (
    <Card>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>

      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          {type === "bar" ? (
            <BarChart data={data} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={2.5}
                dot={{ r: 3, fill: color, strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
