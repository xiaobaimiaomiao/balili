"use client";

import { useEffect, useState } from "react";
import { Category } from "@/types";
import { api } from "@/lib/api";
import Link from "next/link";
import { FolderOpen, Film, Search } from "lucide-react";

export default function CategoryPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filtered, setFiltered] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.getCategories()
      .then((res: any) => {
        setCategories(res.data || []);
        setFiltered(res.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    if (!q) {
      setFiltered(categories);
    } else {
      setFiltered(categories.filter(c => c.name.toLowerCase().includes(q)));
    }
  }, [search, categories]);

  if (loading) return <div className="animate-pulse grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{Array.from({length:8}).map((_,i)=><div key={i} className="h-32 bg-pink-100 rounded-3xl" />)}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-6 h-6 text-primary-400" />
          <h1 className="text-2xl font-bold text-gray-800">All Categories</h1>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 w-64 text-sm bg-pink-50 border-2 border-pink-100 rounded-full focus:border-primary-300 focus:outline-none transition-colors"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((cat) => (
          <Link key={cat.id} href={`/category/${cat.slug}`} className="kawaii-card p-5 text-center group">
            <div className="w-14 h-14 mx-auto bg-gradient-to-br from-primary-100 to-lavender rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Film className="w-6 h-6 text-primary-500" />
            </div>
            <h3 className="font-bold text-gray-700 text-sm">{cat.name}</h3>
            <p className="text-xs text-gray-400 mt-1">{cat.videoCount.toLocaleString()} videos</p>
          </Link>
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="text-center text-gray-400 py-10">No matching categories</p>
      )}
    </div>
  );
}
