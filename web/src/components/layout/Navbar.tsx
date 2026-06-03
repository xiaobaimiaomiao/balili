"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Search, Play, Sparkles, User, LogOut, Upload, ChevronDown, SlidersHorizontal } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function Navbar() {
  const [query, setQuery] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user, logout, loading } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b-2 border-pink-100">
      <div className="max-w-[1400px] mx-auto px-4 h-16 flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-400 rounded-2xl flex items-center justify-center">
            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
            Balili
          </span>
          <Sparkles className="w-4 h-4 text-primary-400" />
        </Link>

        <div className="hidden md:flex items-center gap-4 text-sm font-medium text-gray-500">
          <Link href="/" prefetch={true} className="hover:text-primary-500 transition-colors">Home</Link>
          <Link href="/filter" prefetch={true} className="hover:text-primary-500 transition-colors flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5" /> 筛选
          </Link>
        </div>

        <form onSubmit={handleSearch} className="flex-1 max-w-md ml-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-300" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search videos..."
              className="kawaii-input w-full pl-10 pr-4 py-2 text-sm"
            />
          </div>
        </form>

        {/* Right side: user menu or login */}
        <div className="shrink-0 flex items-center gap-3">
          {!loading && user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 hover:bg-pink-50 rounded-full pl-1 pr-3 py-1 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-lavender flex items-center justify-center text-white text-sm font-bold">
                  {(user.nickname || user.username).charAt(0).toUpperCase()}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-pink-100 py-2 z-50">
                  <div className="px-4 py-2 border-b border-pink-50 mb-1">
                    <p className="text-sm font-semibold text-gray-800">{user.nickname || user.username}</p>
                    <p className="text-xs text-gray-400">@{user.username}</p>
                  </div>
                  <Link
                    href={`/user/${user.username}`}
                    onClick={() => setShowMenu(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 hover:bg-pink-50 transition-colors"
                  >
                    <User className="w-4 h-4" /> My Profile
                  </Link>
                  <Link
                    href="/upload"
                    onClick={() => setShowMenu(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 hover:bg-pink-50 transition-colors"
                  >
                    <Upload className="w-4 h-4" /> Upload Video
                  </Link>
                  <div className="border-t border-pink-50 mt-1 pt-1">
                    <button
                      onClick={() => { logout(); setShowMenu(false); router.push("/"); }}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-red-500 hover:bg-red-50 w-full text-left transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : !loading ? (
            <div className="flex items-center gap-2">
              <Link href="/login" className="text-sm text-gray-500 hover:text-primary-500 transition-colors font-medium">
                Log In
              </Link>
              <Link href="/register" className="kawaii-btn !px-4 !py-1.5 !text-sm">
                Sign Up
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
