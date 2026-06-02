"use client";

import Link from "next/link";
import { Video } from "@/types";
import { Play, Eye, Clock, Star, Heart } from "lucide-react";

function formatDuration(seconds: number): string {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatViews(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export default function VideoCard({ video, index = 0 }: { video: Video; index?: number }) {
  return (
    <Link
      href={`/video/${video.id}`}
      className="kawaii-card group block item-enter"
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
    >
      <div className="relative aspect-video bg-pink-50 overflow-hidden">
        {video.posterImage ? (
          <img
            src={video.posterImage}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-12 h-12 text-pink-200" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-2 right-2 flex gap-1.5">
          {video.durationSeconds > 0 && (
            <span className="bg-black/70 text-white text-xs rounded-lg px-2 py-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(video.durationSeconds)}
            </span>
          )}
          {(video.upvotes > 0 || video.downvotes > 0) && (
            <span className="bg-primary-500/90 text-white text-xs rounded-lg px-2 py-0.5 flex items-center gap-1">
              <Star className="w-3 h-3 fill-white" />
              {Math.round((video.upvotes / (video.upvotes + video.downvotes)) * 100)}%
            </span>
          )}
        </div>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center">
            <Play className="w-6 h-6 text-primary-500 fill-primary-500 ml-1" />
          </div>
        </div>
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug min-h-[2.5rem]">
          {video.title}
        </h3>
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {formatViews(video.views)}
          </span>
          {video.likesCount > 0 && (
            <span className="flex items-center gap-1 text-primary-400">
              <Heart className="w-3 h-3" />
              {formatViews(video.likesCount)}
            </span>
          )}
          {video.categories?.[0] && (
            <span className="kawaii-badge !px-2 !py-0 !text-xs truncate max-w-[120px]">
              {video.categories[0].name.split(" / ")[0]}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}