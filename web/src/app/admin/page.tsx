"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardData, TopVideoItem } from "@/types";
import { api } from "@/lib/api";
import {
  Eye, Film, Users, Heart, MessageCircle, FolderOpen,
  TrendingUp, TrendingDown, Minus, BarChart3, Globe, Tag,
  Clock, ArrowUpRight, Sparkles, Activity, Calendar,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import Link from "next/link";

const CHART_COLORS = [
  "#6366F1", "#EC4899", "#8B5CF6", "#F59E0B", "#22C55E",
  "#06B6D4", "#EF4444", "#84CC16", "#F97316", "#14B8A6",
  "#A855F7", "#3B82F6",
];

const ICON_MAP: Record<string, React.ElementType> = {
  Eye, Film, Users, Heart, MessageCircle, FolderOpen,
};

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatDuration(sec: number): string {
  if (!sec) return "-";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function GrowthBadge({ change }: { change: number }) {
  if (change === 0) return <span className="inline-flex items-center gap-0.5 text-xs text-gray-400"><Minus className="w-3 h-3" />0%</span>;
  const up = change > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${up ? "text-emerald-600" : "text-red-500"}`}>
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {up ? "+" : ""}{change}%
    </span>
  );
}

/* ---------- Skeleton ---------- */
function Skeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-80 bg-gray-100 rounded-xl" />
        <div className="h-80 bg-gray-100 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-72 bg-gray-100 rounded-xl" />
        <div className="h-72 bg-gray-100 rounded-xl" />
      </div>
    </div>
  );
}

/* ---------- Custom Tooltip ---------- */
function ChartTooltip({ active, payload, label, suffix = "" }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur border border-gray-200 shadow-lg rounded-lg px-3 py-2 text-xs">
      <p className="text-gray-500 mb-1 font-medium">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-semibold" style={{ color: p.color || p.fill }}>
          {p.name}: {formatNum(p.value)}{suffix}
        </p>
      ))}
    </div>
  );
}

/* ========== Granularity Selector ========== */
type Granularity = "day" | "week" | "month" | "year";

const GRANULARITY_OPTIONS: { value: Granularity; label: string; range: string }[] = [
  { value: "day",   label: "天", range: "30d" },
  { value: "week",  label: "周", range: "4w" },
  { value: "month", label: "月", range: "1y" },
  { value: "year",  label: "年", range: "all" },
];

function GranularitySelector({ value, onChange }: { value: Granularity; onChange: (v: Granularity) => void }) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
      <Calendar className="w-3.5 h-3.5 text-gray-400 ml-1.5" />
      {GRANULARITY_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 ${
            value === opt.value
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ========== MAIN ========== */
export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewsGranularity, setViewsGranularity] = useState<Granularity>("month");
  const [viewsData, setViewsData] = useState<{ month: string; views: number }[]>([]);
  const [viewsLoading, setViewsLoading] = useState(false);

  useEffect(() => {
    api.admin.getDashboard()
      .then((res: any) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fetchViews = useCallback(() => {
    const opt = GRANULARITY_OPTIONS.find((o) => o.value === viewsGranularity);
    if (!opt) return;
    setViewsLoading(true);
    api.admin.getViewsByGranularity(viewsGranularity, opt.range)
      .then((res: any) => setViewsData(res.data || []))
      .catch(console.error)
      .finally(() => setViewsLoading(false));
  }, [viewsGranularity]);

  useEffect(() => { fetchViews(); }, [fetchViews]);

  if (loading) return <Skeleton />;
  if (!data) return <p className="text-gray-500 text-sm">Failed to load dashboard data.</p>;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Platform overview and key metrics</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Activity className="w-3.5 h-3.5" />
          Engagement Rate: <span className="font-semibold text-gray-700">{data.engagementRate}%</span>
          <span className="mx-1 text-gray-300">|</span>
          Avg Duration: <span className="font-semibold text-gray-700">{formatDuration(data.avgDuration)}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {data.kpis.map((kpi) => {
          const Icon = ICON_MAP[kpi.icon] || Sparkles;
          return (
            <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-gray-300 transition-all duration-200 group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: kpi.color + "15" }}>
                  <Icon className="w-4 h-4" style={{ color: kpi.color }} />
                </div>
                <GrowthBadge change={kpi.change} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatNum(kpi.value)}</p>
              <p className="text-xs text-gray-500 mt-0.5">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      {/* Row 2: Views Trend + Uploads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Views Trend - Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-500" /> Views Trend
            </h3>
            <GranularitySelector value={viewsGranularity} onChange={setViewsGranularity} />
          </div>
          <div className={`transition-opacity duration-200 ${viewsLoading ? "opacity-50" : "opacity-100"}`}>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={viewsData}>
                <defs>
                  <linearGradient id="viewsAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94A3B8" tickLine={false} axisLine={false} tickFormatter={(v) => viewsGranularity === "day" ? v.slice(5) : v} />
                <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" tickFormatter={(v) => formatNum(v)} tickLine={false} axisLine={false} width={50} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="views" name="Views" stroke="#6366F1" strokeWidth={2.5} fill="url(#viewsAreaGrad)" dot={viewsData.length < 20} activeDot={{ r: 4, fill: "#6366F1" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Uploads Trend - Bar Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Film className="w-4 h-4 text-pink-500" /> Daily Uploads
            </h3>
            <span className="text-xs text-gray-400">Last 30 days</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.uploadsTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="#94A3B8" tickLine={false} axisLine={false} tickFormatter={(v) => v.slice(5)} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" tickLine={false} axisLine={false} width={30} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="count" name="Uploads" fill="#EC4899" radius={[3, 3, 0, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: Category Pie + Top Countries + Top Tags */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Category Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-purple-500" /> Categories
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={data.categoryDist}
                dataKey="count"
                nameKey="name"
                cx="50%" cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
                label={(e: any) => `${(e.name || "").split(" / ")[0].slice(0, 10)}`}
                labelLine={false}
              >
                {data.categoryDist.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-1.5 mt-2 max-h-20 overflow-y-auto">
            {data.categoryDist.map((c, i) => (
              <span key={c.slug} className="inline-flex items-center gap-1 text-[10px] text-gray-600 bg-gray-50 rounded px-1.5 py-0.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                {c.name.split(" / ")[0].slice(0, 15)} ({c.count})
              </span>
            ))}
          </div>
        </div>

        {/* Views by Country */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-500" /> Top Countries
          </h3>
          <div className="space-y-2.5">
            {data.viewsByCountry.slice(0, 8).map((c, i) => {
              const maxViews = data.viewsByCountry[0]?.views || 1;
              const pct = (c.views / maxViews) * 100;
              return (
                <div key={c.country} className="group">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-700 font-medium">{c.country}</span>
                    <span className="text-gray-500">{formatNum(c.views)} views · {c.count} videos</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                  </div>
                </div>
              );
            })}
            {data.viewsByCountry.length === 0 && <p className="text-xs text-gray-400 text-center py-8">No country data</p>}
          </div>
        </div>

        {/* Top Tags */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Tag className="w-4 h-4 text-amber-500" /> Popular Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {data.topTags.map((t, i) => (
              <div
                key={t.name}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all hover:scale-105"
                style={{
                  backgroundColor: CHART_COLORS[i % CHART_COLORS.length] + "12",
                  borderColor: CHART_COLORS[i % CHART_COLORS.length] + "30",
                  color: CHART_COLORS[i % CHART_COLORS.length],
                }}
              >
                #{t.name}
                <span className="text-[10px] opacity-70">{t.count}</span>
              </div>
            ))}
            {data.topTags.length === 0 && <p className="text-xs text-gray-400 text-center py-8 w-full">No tag data</p>}
          </div>
        </div>
      </div>

      {/* Row 4: Top Videos + User Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top Videos Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-rose-500" /> Top Videos by Views
            </h3>
            <Link href="/admin/videos" className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-0.5">
              View All <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 bg-gray-50/50">
                  <th className="px-4 py-2.5 font-medium">#</th>
                  <th className="px-4 py-2.5 font-medium">Video</th>
                  <th className="px-4 py-2.5 font-medium w-20">Views</th>
                  <th className="px-4 py-2.5 font-medium w-20">Likes</th>
                  <th className="px-4 py-2.5 font-medium w-20">Duration</th>
                  <th className="px-4 py-2.5 font-medium w-24">Uploader</th>
                </tr>
              </thead>
              <tbody>
                {data.topVideos.map((v: TopVideoItem, i: number) => (
                  <tr key={v.id} className="border-t border-gray-50 hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${i < 3 ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white" : "bg-gray-100 text-gray-500"}`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-9 rounded-md overflow-hidden bg-gray-100 shrink-0">
                          {v.posterImage ? (
                            <img src={v.posterImage} alt="" className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Film className="w-4 h-4 text-gray-300" /></div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-gray-800 text-xs font-medium line-clamp-1 max-w-[240px]">{v.title}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{v.country || "-"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-gray-700 font-medium text-xs">{formatNum(v.views)}</td>
                    <td className="px-4 py-2.5 text-gray-600 text-xs">{formatNum(v.likesCount)}</td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">{formatDuration(v.durationSeconds)}</td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">{v.uploadedByName || "admin"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Growth */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-violet-500" /> User Growth
            </h3>
            <span className="text-xs text-gray-400">Last 30 days</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data.userGrowth}>
              <defs>
                <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="#94A3B8" tickLine={false} axisLine={false} tickFormatter={(v) => v.slice(5)} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" tickLine={false} axisLine={false} width={30} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="count" name="Users" stroke="#8B5CF6" strokeWidth={2} fill="url(#userGrad)" dot={false} activeDot={{ r: 4, fill: "#8B5CF6" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 5: Recent Videos */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-500" /> Recent Uploads
          </h3>
          <Link href="/admin/videos" className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-0.5">
            View All <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-0 divide-x divide-gray-100">
          {(data.recentVideos || []).slice(0, 8).map((v: any) => (
            <Link key={v.id} href={`/admin/videos`} className="group p-3 hover:bg-gray-50 transition-colors">
              <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 mb-2">
                {v.posterImage ? (
                  <img src={v.posterImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Film className="w-5 h-5 text-gray-300" /></div>
                )}
              </div>
              <p className="text-[11px] text-gray-800 line-clamp-2 font-medium leading-snug">{v.title}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{formatNum(v.views)} views</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
