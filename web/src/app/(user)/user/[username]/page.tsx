"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Video, User } from "@/types";
import { api } from "@/lib/api";
import VideoGrid from "@/components/video/VideoGrid";
import Pagination from "@/components/ui/Pagination";
import Skeleton from "@/components/ui/Skeleton";
import { Film } from "lucide-react";

export default function UserProfilePage() {
  const params = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.username) return;
    setLoading(true);
    const username = params.username as string;

    api.getUserVideos(username, { page, limit: 20 })
      .then((res: any) => {
        setVideos(res.data || []);
        setTotalPages(res.meta?.totalPages || 1);
        setUser((prev) => prev || { id: 0, username, nickname: username, email: "", avatar: "", videoCount: res.meta?.total });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.username, page]);

  if (loading) return <Skeleton count={10} />;

  return (
    <div className="space-y-6">
      <div className="kawaii-card p-5 flex items-center gap-4 hover:!translate-y-0">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-lavender flex items-center justify-center text-white text-2xl font-bold shrink-0">
          {(user?.nickname || user?.username || "?").charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">{user?.nickname || user?.username}</h1>
          <p className="text-sm text-gray-400">@{user?.username}</p>
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5" /> {user?.videoCount || 0} videos uploaded
          </p>
        </div>
      </div>

      {videos.length === 0 ? (
        <p className="text-center py-20 text-gray-400">No videos uploaded yet</p>
      ) : (
        <>
          <VideoGrid videos={videos} />
          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}
