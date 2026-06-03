"use client";

import { useEffect, useState } from "react";
import { Video, Category } from "@/types";
import { api } from "@/lib/api";
import VideoGrid from "@/components/video/VideoGrid";
import Skeleton from "@/components/ui/Skeleton";
import Link from "next/link";
import { Sparkles, TrendingUp, Clock, Tag, Heart, Search } from "lucide-react";

export default function HomePage() {
  const [popular, setPopular] = useState<Video[]>([]);
  const [recent, setRecent] = useState<Video[]>([]);
  const [trending, setTrending] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCats, setFilteredCats] = useState<Category[]>([]);

  useEffect(() => {
    Promise.all([
      api.getPopularVideos(15),
      api.getVideos({ page: 1, limit: 20, sort: "created_at", order: "desc" }),
      api.getCategories(),
      api.getTrendingLikes(8),
    ])
      .then(([popRes, recentRes, catRes, trendRes]: any[]) => {
        setPopular(popRes.data || []);
        setRecent(recentRes.data || []);
        setCategories(catRes.data || []);
        setFilteredCats(catRes.data || []);
        setTrending(trendRes.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = searchQuery.toLowerCase();
    if (!q) {
      setFilteredCats(categories);
    } else {
      setFilteredCats(categories.filter(c => c.name.toLowerCase().includes(q)));
    }
  }, [searchQuery, categories]);

  if (loading) return <Skeleton count={15} />;

  const hero = popular[0];

  return (
    <div className="space-y-10">
      {/* Hero */}
      {hero && (
        <Link href={`/video/${hero.id}`} className="kawaii-card block group overflow-hidden">
          <div className="relative h-64 md:h-80 bg-pink-50">
            {hero.posterImage && (
              <img src={hero.posterImage} alt={hero.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary-300" />
                <span className="text-primary-300 text-sm font-medium">Featured</span>
              </div>
              <h2 className="text-white text-xl md:text-2xl font-bold line-clamp-2">{hero.title}</h2>
              <div className="flex items-center gap-4 mt-2 text-white/70 text-sm">
                <span>{hero.views.toLocaleString()} views</span>
                {hero.categories?.[0] && <span className="kawaii-badge !bg-white/20 !text-white">{hero.categories[0].name.split(" / ")[0]}</span>}
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary-400" />
              <h2 className="text-lg font-bold text-gray-800">Categories</h2>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-64 text-sm bg-pink-50 border-2 border-pink-100 rounded-full focus:border-primary-300 focus:outline-none transition-colors"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {filteredCats.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="kawaii-badge hover:bg-primary-200 transition-colors cursor-pointer"
              >
                {cat.name.split(" / ")[0]} ({cat.videoCount})
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Popular */}
      {popular.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-bold text-gray-800">Popular Videos</h2>
          </div>
          <VideoGrid videos={popular} />
        </div>
      )}

      {/* Trending Likes */}
      {trending.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-red-400 fill-red-400" />
            <h2 className="text-lg font-bold text-gray-800">Trending Likes</h2>
          </div>
          <VideoGrid videos={trending} />
        </div>
      )}

      {/* Recent */}
      {recent.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-bold text-gray-800">Latest Videos</h2>
          </div>
          <VideoGrid videos={recent} />
        </div>
      )}
    </div>
  );
}
