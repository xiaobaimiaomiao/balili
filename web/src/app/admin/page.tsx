"use client";

import { useEffect, useState } from "react";
import { DashboardData } from "@/types";
import { api } from "@/lib/api";
import { Film, Eye, FolderOpen, Tag, TrendingUp, Sparkles } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import Link from "next/link";

const COLORS = ["#6366F1", "#8B5CF6", "#EC4899", "#F59E0B", "#22C55E", "#06B6D4", "#EF4444", "#84CC16"];

function formatNum(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin.getDashboard()
      .then((res: any) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-4 gap-4">{Array.from({length:4}).map((_,i)=><div key={i} className="h-28 bg-gray-200 rounded-xl" />)}</div>
        <div className="grid grid-cols-2 gap-4">{Array.from({length:2}).map((_,i)=><div key={i} className="h-72 bg-gray-200 rounded-xl" />)}</div>
      </div>
    );
  }

  if (!data) return <p className="text-gray-500">Failed to load dashboard</p>;

  const stats = [
    { label: "Total Videos", value: data.totalVideos, icon: Film, gradient: "from-indigo-400 to-purple-500", shadow: "shadow-indigo-200" },
    { label: "Total Views", value: data.totalViews, icon: Eye, gradient: "from-pink-400 to-rose-500", shadow: "shadow-pink-200" },
    { label: "Categories", value: data.totalCategories, icon: FolderOpen, gradient: "from-amber-400 to-orange-500", shadow: "shadow-amber-200" },
    { label: "Tags", value: data.totalTags, icon: Tag, gradient: "from-emerald-400 to-teal-500", shadow: "shadow-emerald-200" },
  ];

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-100 via-rose-50 to-fuchsia-100 border-2 border-pink-200 p-6">
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-pink-300/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-fuchsia-300/30 rounded-full blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent flex items-center gap-2">
              Dashboard <Sparkles className="w-5 h-5 text-pink-400" />
            </h1>
            <p className="text-sm text-pink-700/70 mt-0.5">Overview of your video platform</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="group relative bg-white/80 backdrop-blur rounded-2xl border-2 border-pink-100 hover:border-pink-300 p-5 flex items-center gap-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg item-enter overflow-hidden"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-gradient-to-br ${s.gradient} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`} />
              <div className={`relative w-12 h-12 bg-gradient-to-br ${s.gradient} rounded-xl flex items-center justify-center shadow-md ${s.shadow} group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="relative">
                <p className="text-2xl font-bold text-gray-800">{formatNum(s.value)}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Views by Month */}
        <div className="bg-white/80 backdrop-blur rounded-2xl border-2 border-pink-100 p-5 transition-all duration-200 hover:border-pink-200 hover:shadow-md">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" /> Views by Month
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.viewsByMonth.slice(-12)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#FCE7F3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94A3B8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" tickFormatter={(v) => formatNum(v)} />
              <Tooltip formatter={(v: any) => [formatNum(Number(v)), "Views"]} />
              <Bar dataKey="views" fill="#EC4899" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="bg-white/80 backdrop-blur rounded-2xl border-2 border-pink-100 p-5 transition-all duration-200 hover:border-pink-200 hover:shadow-md">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Category Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={data.topCategories} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(entry: any) => `${(entry.name || "").split(" / ")[0].substring(0, 15)} (${entry.count})`} labelLine={false}>
                {data.topCategories.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Videos */}
      <div className="bg-white/80 backdrop-blur rounded-2xl border-2 border-pink-100 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Film className="w-4 h-4 text-pink-500" /> Recent Videos
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b-2 border-pink-100">
                <th className="pb-3 font-medium">Title</th>
                <th className="pb-3 font-medium w-24">Views</th>
                <th className="pb-3 font-medium w-24">Rating</th>
                <th className="pb-3 font-medium w-32">Date</th>
              </tr>
            </thead>
            <tbody>
              {(data.recentVideos || []).slice(0, 8).map((v: any, i: number) => (
                <tr key={v.id} className="border-b border-pink-50 hover:bg-gradient-to-r hover:from-pink-50 hover:to-rose-50 transition-colors duration-200 item-enter" style={{ animationDelay: `${i * 40}ms` }}>
                  <td className="py-2.5">
                    <Link href={`/video/${v.id}`} className="text-gray-800 hover:text-pink-500 line-clamp-1 max-w-md transition-colors">
                      {v.title}
                    </Link>
                  </td>
                  <td className="py-2.5 text-gray-600">{formatNum(v.views)}</td>
                  <td className="py-2.5 text-gray-600">{(v.upvotes > 0 || v.downvotes > 0) ? `${Math.round((v.upvotes / (v.upvotes + v.downvotes)) * 100)}%` : "-"}</td>
                  <td className="py-2.5 text-gray-500 text-xs">{v.releaseDate ? new Date(v.releaseDate).toLocaleDateString() : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
