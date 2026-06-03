"use client";

import { useEffect, useState, useCallback } from "react";
import { ChartData } from "@/types";
import { api } from "@/lib/api";
import {
  BarChart3, Globe, Tag, Users, Clock, Timer, TrendingUp, Calendar,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";

const CHART_COLORS = [
  "#6366F1", "#EC4899", "#8B5CF6", "#F59E0B", "#22C55E",
  "#06B6D4", "#EF4444", "#84CC16", "#F97316", "#14B8A6",
  "#A855F7", "#3B82F6", "#D946EF", "#0EA5E9", "#F43F5E",
];

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur border border-gray-200 shadow-lg rounded-lg px-3 py-2 text-xs">
      <p className="text-gray-500 mb-1 font-medium">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-semibold" style={{ color: p.color || p.fill }}>
          {p.name}: {formatNum(p.value)}
        </p>
      ))}
    </div>
  );
}

/* ---------- Skeleton ---------- */
function Skeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-80 bg-gray-100 rounded-xl" />)}
      </div>
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
export default function AnalyticsPage() {
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewsGranularity, setViewsGranularity] = useState<Granularity>("month");
  const [viewsData, setViewsData] = useState<{ month: string; views: number }[]>([]);
  const [viewsLoading, setViewsLoading] = useState(false);

  useEffect(() => {
    api.admin.getCharts()
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
  if (!data) return <p className="text-gray-500 text-sm">Failed to load analytics data.</p>;

  // Prepare hour data with labels
  const hourData = (data.viewsByHour || []).map((h) => ({
    hour: `${h.hour}:00`,
    views: h.views,
  }));

  // Prepare radar data for categories (top 8)
  const radarData = (data.categories || []).slice(0, 8).map((c) => ({
    name: c.name.split(" / ")[0].slice(0, 12),
    value: c.count,
    fullMark: Math.max(...(data.categories || []).map((c) => c.count), 1),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Detailed platform analytics and insights</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Calendar className="w-3.5 h-3.5" />
          Data range: Last 12 months
        </div>
      </div>

      {/* Row 1: Views Trend + User Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Views Trend */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" /> Views Trend
            </h3>
            <GranularitySelector value={viewsGranularity} onChange={setViewsGranularity} />
          </div>
          <div className={`transition-opacity duration-200 ${viewsLoading ? "opacity-50" : "opacity-100"}`}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={viewsData}>
                <defs>
                  <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94A3B8" tickLine={false} axisLine={false} tickFormatter={(v) => viewsGranularity === "day" ? v.slice(5) : v} />
                <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" tickFormatter={(v) => formatNum(v)} tickLine={false} axisLine={false} width={50} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="views" name="Views" stroke="#6366F1" strokeWidth={2.5} fill="url(#viewsGrad)" dot={viewsData.length < 20} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Growth */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-violet-500" /> User Registrations
            </h3>
            <span className="text-xs text-gray-400">Last 30 days</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.userGrowth}>
              <defs>
                <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94A3B8" tickLine={false} axisLine={false} tickFormatter={(v) => v.slice(5)} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" tickLine={false} axisLine={false} width={30} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="count" name="Users" stroke="#8B5CF6" strokeWidth={2} fill="url(#userGrad)" dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Daily Uploads + Views by Hour */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily Uploads */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-500" /> Daily Uploads
            </h3>
            <span className="text-xs text-gray-400">Last 30 days</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.dailyUploads}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="#94A3B8" tickLine={false} axisLine={false} tickFormatter={(v) => v.slice(5)} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" tickLine={false} axisLine={false} width={30} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="count" name="Uploads" fill="#22C55E" radius={[3, 3, 0, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Views by Hour */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" /> Views by Hour of Day
            </h3>
            <span className="text-xs text-gray-400">All time</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={hourData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="hour" tick={{ fontSize: 9 }} stroke="#94A3B8" tickLine={false} axisLine={false} interval={1} />
              <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" tickFormatter={(v) => formatNum(v)} tickLine={false} axisLine={false} width={50} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="views" name="Views" fill="#F97316" radius={[3, 3, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: Category Pie + Radar + Duration Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Category Pie */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-pink-500" /> Category Share
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data.categories}
                dataKey="count"
                nameKey="name"
                cx="50%" cy="50%"
                innerRadius={50}
                outerRadius={85}
                paddingAngle={2}
                label={(e: any) => `${(e.name || "").split(" / ")[0].slice(0, 10)}`}
                labelLine={false}
              >
                {(data.categories || []).map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-1.5 mt-2 max-h-24 overflow-y-auto">
            {(data.categories || []).map((c, i) => (
              <span key={c.slug} className="inline-flex items-center gap-1 text-[10px] text-gray-600 bg-gray-50 rounded px-1.5 py-0.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                {c.name.split(" / ")[0].slice(0, 15)} ({c.count})
              </span>
            ))}
          </div>
        </div>

        {/* Category Radar */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-500" /> Category Radar
          </h3>
          {radarData.length > 2 ? (
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#E2E8F0" />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94A3B8" />
                <PolarRadiusAxis tick={{ fontSize: 9 }} stroke="#CBD5E1" />
                <Radar name="Videos" dataKey="value" stroke="#06B6D4" fill="#06B6D4" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-gray-400 text-center py-20">Need at least 3 categories for radar chart</p>
          )}
        </div>

        {/* Duration Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Timer className="w-4 h-4 text-amber-500" /> Duration Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.durationDist} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94A3B8" tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="range" tick={{ fontSize: 11 }} stroke="#94A3B8" tickLine={false} axisLine={false} width={70} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="count" name="Videos" fill="#F59E0B" radius={[0, 4, 4, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 4: Views by Country + Top Tags */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Views by Country */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Globe className="w-4 h-4 text-teal-500" /> Views by Country
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data.viewsByCountry} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94A3B8" tickFormatter={(v) => formatNum(v)} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="country" tick={{ fontSize: 11 }} stroke="#94A3B8" tickLine={false} axisLine={false} width={80} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="views" name="Views" fill="#14B8A6" radius={[0, 4, 4, 0]} maxBarSize={20}>
                {(data.viewsByCountry || []).map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Tags + Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Tag className="w-4 h-4 text-rose-500" /> Top Tags
            </h3>
            <span className="text-xs text-gray-400">By video count</span>
          </div>
          <div className="space-y-2">
            {(data.topTags || []).slice(0, 12).map((t, i) => {
              const maxCount = data.topTags[0]?.count || 1;
              const pct = (t.count / maxCount) * 100;
              return (
                <div key={t.name} className="group">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-700 font-medium">#{t.name}</span>
                    <span className="text-gray-500">{t.count} videos</span>
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
            {(data.topTags || []).length === 0 && <p className="text-xs text-gray-400 text-center py-12">No tag data available</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
