"use client";

import {
  LineChart,
  Line,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type ChartPoint = {
  day: string;
  calls: number;
};

type ChartCardProps = {
  title: string;
  data: ChartPoint[];
};

export default function ChartCard({ title, data }: ChartCardProps) {
  return (
    <div className="bg-white shadow-sm border rounded-2xl p-6">
      <h2 className="text-xl font-semibold mb-4 text-black">{title}</h2>

      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="day" />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="calls"
              stroke="#6366f1"
              strokeWidth={3}
              dot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}