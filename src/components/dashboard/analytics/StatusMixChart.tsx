"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { usePrefersReducedMotion } from "@/components/motion/reduced-motion";

export type StatusMixPoint = {
  status: string;
  count: number;
};

const COLORS: Record<string, string> = {
  Published: "#7b85f0",
  Draft: "#c0c8ff",
};

type Props = {
  data: StatusMixPoint[];
};

export function StatusMixChart({ data }: Props) {
  const reduceMotion = usePrefersReducedMotion();
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="mx-auto h-[200px] w-full max-w-[220px] sm:mx-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="status"
              innerRadius="58%"
              outerRadius="82%"
              paddingAngle={2}
              stroke="#ffffff"
              strokeWidth={2}
              isAnimationActive={!reduceMotion}
              animationDuration={reduceMotion ? 0 : 500}
            >
              {data.map((entry) => (
                <Cell key={entry.status} fill={COLORS[entry.status] ?? "#a8b0f8"} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [value, name]}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #c0c8ff",
                background: "#ffffff",
                boxShadow: "0 8px 24px rgba(63, 66, 133, 0.08)",
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex-1 space-y-3">
        {data.map((item) => {
          const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
          return (
            <li key={item.status} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 text-ink">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: COLORS[item.status] ?? "#a8b0f8" }}
                  aria-hidden
                />
                {item.status}
              </span>
              <span className="tabular-nums text-accent-600">
                {item.count} <span className="text-accent-400">({pct}%)</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
