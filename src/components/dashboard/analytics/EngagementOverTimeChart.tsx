"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { usePrefersReducedMotion } from "@/components/motion/reduced-motion";

export type EngagementPoint = {
  week: string;
  label: string;
  views: number;
  likes: number;
  comments: number;
};

const COLORS = {
  views: "#7b85f0",
  likes: "#636ccd",
  comments: "#a8b0f8",
};

type Props = {
  data: EngagementPoint[];
};

export function EngagementOverTimeChart({ data }: Props) {
  const reduceMotion = usePrefersReducedMotion();

  return (
    <div className="h-[260px] w-full sm:h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.views} stopOpacity={0.35} />
              <stop offset="100%" stopColor={COLORS.views} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="likesFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.likes} stopOpacity={0.3} />
              <stop offset="100%" stopColor={COLORS.likes} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e4e6f5" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "#5b5f7a", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "#c8cad6" }}
            interval="preserveStartEnd"
            minTickGap={28}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "#5b5f7a", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={36}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #c0c8ff",
              background: "#ffffff",
              boxShadow: "0 8px 24px rgba(63, 66, 133, 0.08)",
              fontSize: 12,
            }}
            labelStyle={{ color: "#3f4285", fontWeight: 600 }}
          />
          <Legend
            verticalAlign="top"
            height={28}
            iconType="circle"
            wrapperStyle={{ fontSize: 12, color: "#5b5f7a" }}
          />
          <Area
            type="monotone"
            dataKey="views"
            name="Views"
            stroke={COLORS.views}
            fill="url(#viewsFill)"
            strokeWidth={2}
            isAnimationActive={!reduceMotion}
            animationDuration={reduceMotion ? 0 : 600}
          />
          <Area
            type="monotone"
            dataKey="likes"
            name="Likes"
            stroke={COLORS.likes}
            fill="url(#likesFill)"
            strokeWidth={2}
            isAnimationActive={!reduceMotion}
            animationDuration={reduceMotion ? 0 : 600}
          />
          <Area
            type="monotone"
            dataKey="comments"
            name="Comments"
            stroke={COLORS.comments}
            fill="transparent"
            strokeWidth={2}
            strokeDasharray="4 3"
            isAnimationActive={!reduceMotion}
            animationDuration={reduceMotion ? 0 : 600}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
