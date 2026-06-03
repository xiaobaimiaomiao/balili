"use client";

import { Category, Tag, Country } from "@/types";
import { Filter, RotateCcw } from "lucide-react";

interface FilterState {
  categories: string[]; // slugs
  tags: string[];       // slugs
  country: string;      // name
  year: number;         // 0 = all
  sort: string;         // created_at | views | likes_count | rating_percent
}

interface FilterBarProps {
  categories: Category[];
  tags: Tag[];
  countries: Country[];
  years: number[];
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

export type { FilterState };

export default function FilterBar({ categories, tags, countries, years, filters, onChange }: FilterBarProps) {
  const hasFilter = filters.categories.length > 0 || filters.tags.length > 0 || filters.country !== "" || filters.year > 0;

  const sortOptions = [
    { value: "created_at", label: "最新上传" },
    { value: "views", label: "播放量" },
    { value: "likes_count", label: "点赞量" },
    { value: "rating_percent", label: "投票好评" },
  ];

  const toggleCategory = (slug: string) => {
    const cur = filters.categories;
    const next = cur.includes(slug) ? cur.filter((s) => s !== slug) : [slug];
    onChange({ ...filters, categories: next });
  };

  const toggleTag = (slug: string) => {
    const cur = filters.tags;
    const next = cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug];
    onChange({ ...filters, tags: next });
  };

  const toggleCountry = (name: string) => {
    onChange({ ...filters, country: filters.country === name ? "" : name });
  };

  const toggleYear = (y: number) => {
    onChange({ ...filters, year: filters.year === y ? 0 : y });
  };

  const resetAll = () => {
    onChange({ categories: [], tags: [], country: "", year: 0, sort: filters.sort || "created_at" });
  };

  return (
    <div className="bg-white/90 backdrop-blur rounded-2xl border-2 border-pink-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-pink-50 to-rose-50 border-b border-pink-100">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary-400" />
          <span className="text-sm font-semibold text-gray-700">筛选</span>
        </div>
        {hasFilter && (
          <button
            onClick={resetAll}
            className="flex items-center gap-1.5 text-xs text-pink-500 hover:text-pink-600 font-medium transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> 重置筛选
          </button>
        )}
      </div>

      <div className="divide-y divide-pink-50">
        {/* Categories Row */}
        {categories.length > 0 && (
          <FilterRow label="分类">
            <FilterChip active={filters.categories.length === 0} onClick={() => onChange({ ...filters, categories: [] })}>
              全部
            </FilterChip>
            {categories.slice(0, 20).map((c) => (
              <FilterChip
                key={c.id}
                active={filters.categories.includes(c.slug)}
                onClick={() => toggleCategory(c.slug)}
              >
                {c.name.split(" / ")[0]}
              </FilterChip>
            ))}
          </FilterRow>
        )}

        {/* Tags Row */}
        {tags.length > 0 && (
          <FilterRow label="标签">
            <FilterChip active={filters.tags.length === 0} onClick={() => onChange({ ...filters, tags: [] })}>
              全部
            </FilterChip>
            {tags.slice(0, 30).map((t) => (
              <FilterChip
                key={t.id}
                active={filters.tags.includes(t.slug)}
                onClick={() => toggleTag(t.slug)}
              >
                {t.name}
              </FilterChip>
            ))}
          </FilterRow>
        )}

        {/* Country Row */}
        {countries.length > 0 && (
          <FilterRow label="地区">
            <FilterChip active={filters.country === ""} onClick={() => onChange({ ...filters, country: "" })}>
              全部
            </FilterChip>
            {countries.map((c) => (
              <FilterChip
                key={c.id}
                active={filters.country === c.name}
                onClick={() => toggleCountry(c.name)}
              >
                {c.name}
              </FilterChip>
            ))}
          </FilterRow>
        )}

        {/* Year Row */}
        {years.length > 0 && (
          <FilterRow label="时间">
            <FilterChip active={filters.year === 0} onClick={() => onChange({ ...filters, year: 0 })}>
              全部
            </FilterChip>
            {years.map((y) => (
              <FilterChip
                key={y}
                active={filters.year === y}
                onClick={() => toggleYear(y)}
              >
                {y}
              </FilterChip>
            ))}
          </FilterRow>
        )}

        {/* Sort Row */}
        <FilterRow label="排序">
          {sortOptions.map((opt) => (
            <FilterChip
              key={opt.value}
              active={(filters.sort || "created_at") === opt.value}
              onClick={() => onChange({ ...filters, sort: opt.value })}
            >
              {opt.label}
            </FilterChip>
          ))}
        </FilterRow>
      </div>
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex px-5 py-3 gap-3 items-start">
      <span className="shrink-0 text-xs font-bold text-pink-500 bg-pink-50 px-2.5 py-1 rounded-lg mt-0.5">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {children}
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 ${
        active
          ? "bg-gradient-to-r from-primary-500 to-primary-400 text-white shadow-md"
          : "bg-gray-50 text-gray-600 hover:bg-pink-50 hover:text-pink-600 border border-gray-200 hover:border-pink-200"
      }`}
    >
      {active && <span className="mr-0.5">✓</span>}
      {children}
    </button>
  );
}
