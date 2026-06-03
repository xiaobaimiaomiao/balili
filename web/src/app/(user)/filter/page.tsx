"use client";

import { useEffect, useState, useCallback } from "react";
import { Video, Category, Tag, Country } from "@/types";
import { api } from "@/lib/api";
import VideoGrid from "@/components/video/VideoGrid";
import FilterBar, { FilterState } from "@/components/FilterBar";
import Skeleton from "@/components/ui/Skeleton";
import { SlidersHorizontal, Search, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";

export default function FilterPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    tags: [],
    country: "",
    year: 0,
    sort: "created_at",
  });

  // Results
  const [videos, setVideos] = useState<Video[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [fetching, setFetching] = useState(false);

  const hasFilter = filters.categories.length > 0 || filters.tags.length > 0 || filters.country !== "" || filters.year > 0;

  // Generate years list (current year down to 2018)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2017 }, (_, i) => currentYear - i);

  // Load filter options
  useEffect(() => {
    Promise.all([
      api.getCategories(),
      api.getTags(500),
      api.getCountries(),
    ])
      .then(([catRes, tagRes, countryRes]: any[]) => {
        setCategories(catRes.data || []);
        setTags(tagRes.data || []);
        setCountries(countryRes.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Fetch filtered videos
  const fetchVideos = useCallback(() => {
    setFetching(true);
    const params: Record<string, string | number> = {
      page,
      limit: 20,
      sort: filters.sort || "created_at",
      order: "desc",
    };
    if (filters.categories.length > 0) params.category = filters.categories[0];
    if (filters.tags.length > 0) params.tags = filters.tags.join(",");
    if (filters.country) params.country = filters.country;
    if (filters.year > 0) params.year = filters.year;

    api.getVideos(params)
      .then((res: any) => {
        setVideos(res.data || []);
        setTotalPages(res.meta?.totalPages || 1);
        setTotal(res.meta?.total || 0);
      })
      .catch(console.error)
      .finally(() => setFetching(false));
  }, [filters, page]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const resetAll = () => {
    setFilters({ categories: [], tags: [], country: "", year: 0, sort: "created_at" });
  };

  if (loading) return <Skeleton count={10} />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-primary-400" />
          <h1 className="text-xl font-bold text-gray-800">筛选视频</h1>
        </div>
        {hasFilter && (
          <button
            onClick={resetAll}
            className="flex items-center gap-1.5 text-xs text-pink-500 hover:text-pink-600 font-medium transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> 重置全部筛选
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <FilterBar
        categories={categories}
        tags={tags}
        countries={countries}
        years={years}
        filters={filters}
        onChange={setFilters}
      />

      {/* Results */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-bold text-gray-800">
              {hasFilter ? "筛选结果" : "全部视频"}
            </h2>
            <span className="text-sm text-gray-400">({total} videos)</span>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 border-2 border-pink-200 rounded-xl text-gray-600 hover:bg-pink-50 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-500">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 border-2 border-pink-200 rounded-xl text-gray-600 hover:bg-pink-50 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {fetching ? (
          <Skeleton count={10} />
        ) : videos.length > 0 ? (
          <VideoGrid videos={videos} />
        ) : (
          <div className="text-center py-16 text-gray-400">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">没有找到匹配的视频</p>
            <p className="text-sm mt-1">试试调整筛选条件</p>
          </div>
        )}
      </div>
    </div>
  );
}
