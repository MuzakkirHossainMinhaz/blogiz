"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { usePrefersReducedMotion } from "@/components/motion/reduced-motion";

export type TopPostPoint = {
  id: string;
  title: string;
  totalLikes: number;
  totalViews: number;
  totalComments: number;
};

type Props = {
  data: TopPostPoint[];
};

function shortTitle(title: string, max = 22): string {
  const trimmed = title.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

export function TopPostsChart({ data }: Props) {
  const reduceMotion = usePrefersReducedMotion();
  const chartData = data.map((post) => ({
    ...post,
    shortTitle: shortTitle(post.title),
  }));

  return (
    <div className="h-[260px] w-full sm:h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
        >
          <CartesianGrid stroke="#e4e6f5" strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fill: "#5b5f7a", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "#c8cad6" }}
          />
          <YAxis
            type="category"
            dataKey="shortTitle"
            width={96}
            tick={{ fill: "#3f4285", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value: number) => [value, "Likes"]}
            labelFormatter={(_, payload) => {
              const item = payload?.[0]?.payload as TopPostPoint | undefined;
              return item?.title ?? "";
            }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #c0c8ff",
              background: "#ffffff",
              boxShadow: "0 8px 24px rgba(63, 66, 133, 0.08)",
              fontSize: 12,
            }}
          />
          <Bar
            dataKey="totalLikes"
            name="Likes"
            fill="#7b85f0"
            radius={[0, 8, 8, 0]}
            maxBarSize={28}
            isAnimationActive={!reduceMotion}
            animationDuration={reduceMotion ? 0 : 500}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
