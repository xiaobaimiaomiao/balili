"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Video } from "@/types";
import { api } from "@/lib/api";
import VideoGrid from "@/components/video/VideoGrid";
import Pagination from "@/components/ui/Pagination";
import Skeleton from "@/components/ui/Skeleton";
import Link from "next/link";
import { ArrowLeft, Hash } from "lucide-react";

function TagContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [videos, setVideos] = useState<Video[]>([]);
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.slug) return;
    setLoading(true);
    api.getVideos({ page, limit: 20, tag: params.slug as string, sort: "created_at", order: "desc" })
      .then((res: any) => {
        setVideos(res.data || []);
        setTotalPages(res.meta?.totalPages || 1);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.slug, page]);

  const handlePageChange = (p: number) => {
    setPage(p);
    router.push(`/tag/${params.slug}?page=${p}`);
  };

  return (
    <div className="space-y-6">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-primary-500 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Home
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-mint rounded-2xl flex items-center justify-center">
          <Hash className="w-6 h-6 text-primary-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-800">#{params.slug}</h1>
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

export default function TagDetailPage() {
  return (
    <Suspense fallback={<Skeleton count={10} />}>
      <TagContent />
    </Suspense>
  );
}
