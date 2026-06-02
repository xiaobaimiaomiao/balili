"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Video } from "@/types";
import { api } from "@/lib/api";
import VideoGrid from "@/components/video/VideoGrid";
import Pagination from "@/components/ui/Pagination";
import Skeleton from "@/components/ui/Skeleton";
import { Search as SearchIcon } from "lucide-react";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const [videos, setVideos] = useState<Video[]>([]);
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState(query);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    api.searchVideos({ q: query, page, limit: 20 })
      .then((res: any) => {
        setVideos(res.data || []);
        setTotalPages(res.meta?.totalPages || 1);
        setTotal(res.meta?.total || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [query, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      setPage(1);
      router.push(`/search?q=${encodeURIComponent(input.trim())}`);
    }
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    router.push(`/search?q=${encodeURIComponent(query)}&page=${p}`);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="max-w-xl mx-auto">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-pink-300" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search videos..."
            className="kawaii-input w-full pl-12 pr-4 py-3 text-base"
          />
        </div>
      </form>

      {query && (
        <p className="text-center text-sm text-gray-400">
          {total.toLocaleString()} results for &quot;<span className="text-primary-500 font-medium">{query}</span>&quot;
        </p>
      )}

      {loading ? <Skeleton /> : (
        <>
          {videos.length === 0 && query ? (
            <div className="text-center py-20">
              <SearchIcon className="w-12 h-12 text-pink-200 mx-auto mb-3" />
              <p className="text-gray-400">No results found</p>
            </div>
          ) : (
            <>
              <VideoGrid videos={videos} />
              <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<Skeleton count={10} />}>
      <SearchContent />
    </Suspense>
  );
}
