"use client";

import StatsCard from "@/components/dashboard/StatsCard";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { ChartCard } from "@/components/dashboard/analytics/ChartCard";
import {
  EngagementOverTimeChart,
  type EngagementPoint,
} from "@/components/dashboard/analytics/EngagementOverTimeChart";
import {
  StatusMixChart,
  type StatusMixPoint,
} from "@/components/dashboard/analytics/StatusMixChart";
import {
  TopPostsChart,
  type TopPostPoint,
} from "@/components/dashboard/analytics/TopPostsChart";
import { useEffect, useState } from "react";
import { FiEye, FiFileText, FiHeart, FiMessageCircle } from "react-icons/fi";

interface AnalyticsPayload {
  stats: {
    totalBlogs: number;
    publishedBlogs: number;
    draftBlogs: number;
    totalLikes: number;
    totalViews: number;
    totalComments: number;
  };
  statusMix: StatusMixPoint[];
  engagementOverTime: EngagementPoint[];
  topPosts: TopPostPoint[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/blogs/analytics")
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Could not load analytics");
        if (!cancelled) setData(body as AnalyticsPayload);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load analytics");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
    );
  }

  if (!data) {
    return <p className="text-sm text-accent-500">Loading Analytics…</p>;
  }

  const { stats, statusMix, engagementOverTime, topPosts } = data;
  const hasPosts = stats.totalBlogs > 0;
  const engagementTotal = engagementOverTime.reduce(
    (sum, point) => sum + point.views + point.likes + point.comments,
    0
  );
  const hasEngagement = engagementTotal > 0;
  const hasTopPosts = topPosts.some((post) => post.totalLikes > 0 || post.totalViews > 0);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Analytics"
        description="Performance for posts you created."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard title="Posts" value={stats.totalBlogs} icon={FiFileText} variant="primary" />
        <StatsCard title="Published" value={stats.publishedBlogs} icon={FiEye} variant="success" />
        <StatsCard title="Drafts" value={stats.draftBlogs} icon={FiFileText} />
        <StatsCard title="Likes" value={stats.totalLikes} icon={FiHeart} variant="accent" />
      </div>

      {!hasPosts ? (
        <div className="rounded-2xl border border-primary-100 bg-primary-50/50 px-5 py-10 text-center">
          <p className="text-base font-semibold text-ink">No Posts Yet</p>
          <p className="mt-2 text-sm text-accent-500">
            Publish a post to start seeing engagement trends, top posts, and draft balance.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCard
            title="Engagement Over Time"
            description="Weekly views, likes, and comments on your posts (last 12 weeks)."
            className="lg:col-span-2"
            empty={!hasEngagement}
            emptyMessage="No Views, Likes, Or Comments In The Last 12 Weeks"
          >
            <EngagementOverTimeChart data={engagementOverTime} />
          </ChartCard>

          <ChartCard
            title="Top Posts By Likes"
            description="Which published posts earn the most likes."
            empty={!hasTopPosts}
            emptyMessage="No Engagement On Published Posts Yet"
          >
            <TopPostsChart data={topPosts} />
          </ChartCard>

          <ChartCard
            title="Draft Vs Published"
            description="How your library balances drafts and live posts."
          >
            <StatusMixChart data={statusMix} />
          </ChartCard>

          {stats.totalComments > 0 ? (
            <div className="lg:col-span-2 rounded-2xl border border-primary-100 bg-surface px-4 py-3 sm:px-5 flex flex-wrap items-center gap-3 text-sm text-accent-600">
              <FiMessageCircle className="h-4 w-4 text-primary-600 shrink-0" />
              <span>
                <span className="font-semibold text-ink">{stats.totalComments}</span> total comments
                across your posts — see the weekly Comments line above for recent activity.
              </span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
