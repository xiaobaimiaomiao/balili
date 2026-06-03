"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Video, Category } from "@/types";
import { api } from "@/lib/api";
import VideoGrid from "@/components/video/VideoGrid";
import Pagination from "@/components/ui/Pagination";
import Skeleton from "@/components/ui/Skeleton";
import Link from "next/link";
import { ArrowLeft, FolderOpen } from "lucide-react";

function CategoryContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [videos, setVideos] = useState<Video[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Decode slug to handle URL-encoded Chinese characters
  const categorySlug = typeof params.slug === "string" ? decodeURIComponent(params.slug) : "";

  useEffect(() => {
    if (!categorySlug) return;
    setLoading(true);

    // First fetch category by slug to get the ID, then fetch videos by category ID
    fetch(`/api/v1/categories/${categorySlug}`)
      .then((r) => r.json())
      .then((catRes: any) => {
        const cat = catRes?.data;
        if (cat) {
          setCategory(cat);
          // Use categoryId instead of slug for reliable filtering
          return api.getVideos({ page, limit: 20, categoryId: cat.id, sort: "created_at", order: "desc" });
        }
        return null;
      })
      .then((videoRes: any) => {
        if (videoRes) {
          setVideos(videoRes.data || []);
          setTotalPages(videoRes.meta?.totalPages || 1);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [categorySlug, page]);

  const handlePageChange = (p: number) => {
    setPage(p);
    router.push(`/category/${encodeURIComponent(categorySlug)}?page=${p}`);
  };

  return (
    <div className="space-y-6">
      <Link href="/category" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-primary-500 transition-colors">
        <ArrowLeft className="w-4 h-4" /> All Categories
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-lavender rounded-2xl flex items-center justify-center">
          <FolderOpen className="w-6 h-6 text-primary-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">{category?.name || categorySlug}</h1>
          {category && <p className="text-sm text-gray-400">{category.videoCount.toLocaleString()} videos</p>}
        </div>
      </div>

      {loading ? <Skeleton /> : (
        <>
          {videos.length === 0 ? (
            <p className="text-center py-20 text-gray-400">No videos found</p>
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

export default function CategoryDetailPage() {
  return (
    <Suspense fallback={<Skeleton count={10} />}>
      <CategoryContent />
    </Suspense>
  );
}
