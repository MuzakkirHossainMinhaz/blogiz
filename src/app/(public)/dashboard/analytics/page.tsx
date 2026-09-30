"use client";

import StatsCard from "@/components/dashboard/StatsCard";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { useEffect, useState } from "react";
import { FiEye, FiFileText, FiHeart } from "react-icons/fi";

interface Stats {
  totalBlogs: number;
  publishedBlogs: number;
  draftBlogs: number;
  totalLikes: number;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/blogs/stats")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load analytics");
        setStats(data.stats);
      })
      .catch(() => setError("Could not load analytics"));
  }, []);

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
    );
  }

  if (!stats) {
    return <p className="text-sm text-accent-500">Loading analytics…</p>;
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Analytics" description="Performance for posts you created." />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard title="Posts" value={stats.totalBlogs} icon={FiFileText} variant="primary" />
        <StatsCard title="Published" value={stats.publishedBlogs} icon={FiEye} variant="success" />
        <StatsCard title="Drafts" value={stats.draftBlogs} icon={FiFileText} />
        <StatsCard title="Likes" value={stats.totalLikes} icon={FiHeart} variant="accent" />
      </div>
    </div>
  );
}
