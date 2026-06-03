"use client";

import { useEffect, useState, useCallback } from "react";
import { Video, Category, Tag, Country } from "@/types";
import { api } from "@/lib/api";
import { Search, ChevronLeft, ChevronRight, Trash2, Edit3, X, Save, Plus, Film, Sparkles } from "lucide-react";
import Portal from "@/components/Portal";

function formatNum(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

interface VideoFormData {
  videoId: string;
  title: string;
  description: string;
  posterImage: string;
  releaseDate: string;
  durationSeconds: number;
  views: number;
  uploadedByName: string;
  year: number;
  country: string;
  categoryIds: number[];
  tagIds: number[];
  qualities: { label: string; url: string }[];
  screenshots: string[];
}

const emptyForm: VideoFormData = {
  videoId: "", title: "", description: "", posterImage: "",
  releaseDate: "", durationSeconds: 0, views: 0,
  uploadedByName: "admin", year: 0, country: "Japan",
  categoryIds: [], tagIds: [],
  qualities: [{ label: "720p", url: "" }], screenshots: [],
};

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [editVideo, setEditVideo] = useState<Video | null>(null);
  const [form, setForm] = useState<VideoFormData>(emptyForm);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadVideos = useCallback(() => {
    setLoading(true);
    api.admin.getVideos({ page, limit: 20, q: query, sort: "created_at", order: "desc" })
      .then((res: any) => {
        setVideos(res.data || []);
        setTotalPages(res.meta?.totalPages || 1);
        setTotal(res.meta?.total || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, query]);

  useEffect(() => { loadVideos(); }, [loadVideos]);

  // Load categories, tags and countries for the form
  useEffect(() => {
    api.admin.getCategories().then((r: any) => setCategories(r.data || [])).catch(() => {});
    api.admin.getTags(1000).then((r: any) => setTags(r.data || [])).catch(() => {});
    api.admin.getCountries().then((r: any) => setCountries(r.data || [])).catch(() => {});
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadVideos();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this video?")) return;
    try { await api.admin.deleteVideo(id); loadVideos(); } catch (e) { console.error(e); }
  };

  const openEdit = (v: Video) => {
    setIsNew(false);
    setEditVideo(v);
    setForm({
      videoId: v.videoId,
      title: v.title,
      description: v.description || "",
      posterImage: v.posterImage || "",
      releaseDate: v.releaseDate ? new Date(v.releaseDate).toISOString().split("T")[0] : "",
      durationSeconds: v.durationSeconds,
      views: v.views,
      uploadedByName: v.uploadedByName || "admin",
      year: v.year || 0,
      country: v.country || "Japan",
      categoryIds: v.categories?.map((c) => c.id) || [],
      tagIds: v.tags?.map((t) => t.id) || [],
      qualities: v.qualities?.map((q) => ({ label: q.label, url: q.url })) || [],
      screenshots: v.screenshots?.map((s) => s.url) || [],
    });
  };

  const openNew = () => {
    setIsNew(true);
    setEditVideo({ id: 0 } as Video);
    setForm({ ...emptyForm });
  };

  const handleSave = async () => {
    if (!editVideo) return;
    setSaving(true);
    try {
      const payload: any = {
        title: form.title,
        description: form.description,
        posterImage: form.posterImage,
        releaseDate: form.releaseDate || undefined,
        durationSeconds: form.durationSeconds,
        views: form.views,
        submittedAgo: "",
        uploadedByName: form.uploadedByName || "admin",
        year: form.year,
        country: form.country,
        categoryIds: form.categoryIds,
        tagIds: form.tagIds,
      };

      if (isNew) {
        if (!form.videoId.trim()) { alert("Video ID is required"); setSaving(false); return; }
        payload.videoId = form.videoId;
        payload.screenshots = form.screenshots;
        payload.qualities = form.qualities;
        await api.admin.createVideo(payload);
      } else {
        payload.videoId = form.videoId;
        await api.admin.updateVideo(editVideo.id, payload);
        // Update relations separately
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"}/admin/videos/${editVideo.id}/relations`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
          body: JSON.stringify({ categoryIds: form.categoryIds, tagIds: form.tagIds }),
        });
      }
      setEditVideo(null);
      loadVideos();
    } catch (e) {
      console.error(e);
      alert("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const update = (k: keyof VideoFormData, v: any) => setForm((prev) => ({ ...prev, [k]: v }));

  const toggleCategory = (id: number) => {
    setForm((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(id) ? prev.categoryIds.filter((x) => x !== id) : [...prev.categoryIds, id],
    }));
  };

  const toggleTag = (id: number) => {
    setForm((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(id) ? prev.tagIds.filter((x) => x !== id) : [...prev.tagIds, id],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-100 via-rose-50 to-fuchsia-100 border-2 border-pink-200 p-6">
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-pink-300/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-fuchsia-300/30 rounded-full blur-3xl" />
        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-lg">
              <Film className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent flex items-center gap-2">
                Videos <Sparkles className="w-5 h-5 text-pink-400" />
              </h1>
              <p className="text-sm text-pink-700/70 mt-0.5">{total.toLocaleString()} videos total</p>
            </div>
          </div>
          <button onClick={openNew}
            className="group relative px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl text-sm font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2">
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" /> Add Video
          </button>
        </div>
        <form onSubmit={handleSearch} className="relative mt-4 flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-400" />
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search videos..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/80 backdrop-blur border-2 border-pink-200 rounded-2xl text-sm focus:outline-none focus:border-pink-400 focus:bg-white transition-all" />
          </div>
          <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl text-sm font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">Search</button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white/80 backdrop-blur rounded-2xl border-2 border-pink-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-pink-50/50">
              <tr className="text-left text-pink-600">
                <th className="px-5 py-3 font-semibold">ID</th>
                <th className="px-5 py-3 font-semibold">Thumbnail</th>
                <th className="px-5 py-3 font-semibold">Title</th>
                <th className="px-5 py-3 font-semibold">Uploader</th>
                <th className="px-5 py-3 font-semibold">Country</th>
                <th className="px-5 py-3 font-semibold w-16">Year</th>
                <th className="px-5 py-3 font-semibold w-20">Views</th>
                <th className="px-5 py-3 font-semibold w-20">Rating</th>
                <th className="px-5 py-3 font-semibold w-24">Date</th>
                <th className="px-5 py-3 font-semibold w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="px-5 py-10 text-center text-pink-400">
                  <span className="inline-flex items-center gap-2">
                    <Sparkles className="w-4 h-4 animate-spin" /> Loading...
                  </span>
                </td></tr>
              ) : videos.length === 0 ? (
                <tr><td colSpan={10} className="px-5 py-10 text-center text-gray-400">No videos found</td></tr>
              ) : videos.map((v, i) => (
                <tr key={v.id} className="border-t border-pink-50 hover:bg-gradient-to-r hover:from-pink-50/50 hover:to-rose-50/50 transition-colors duration-200 item-enter" style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}>
                  <td className="px-5 py-3 text-gray-500 text-xs">{v.videoId}</td>
                  <td className="px-5 py-3">
                    <div className="w-16 h-10 rounded-lg overflow-hidden bg-gray-100">
                      {v.posterImage && <img src={v.posterImage} alt="" className="w-full h-full object-cover" loading="lazy" />}
                    </div>
                  </td>
                  <td className="px-5 py-3 max-w-xs">
                    <p className="text-gray-800 line-clamp-1">{v.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{v.categories?.map((c) => c.name.split(" / ")[0]).join(", ")}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{v.uploadedByName || "admin"}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{v.country || "-"}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{v.year || "-"}</td>
                  <td className="px-5 py-3 text-gray-600">{formatNum(v.views)}</td>
                  <td className="px-5 py-3 text-gray-600">{(v.upvotes > 0 || v.downvotes > 0) ? `${Math.round((v.upvotes / (v.upvotes + v.downvotes)) * 100)}%` : "-"}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{v.releaseDate ? new Date(v.releaseDate).toLocaleDateString() : "-"}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(v)} className="p-1.5 text-gray-400 hover:text-pink-500 hover:bg-pink-100 rounded-lg transition-colors"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(v.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t-2 border-pink-100 text-sm">
          <p className="text-pink-600">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
              className="px-3 py-1.5 border-2 border-pink-200 rounded-xl text-gray-600 hover:bg-pink-50 hover:border-pink-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="px-3 py-1.5 border-2 border-pink-200 rounded-xl text-gray-600 hover:bg-pink-50 hover:border-pink-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* Full Edit Modal */}
      {editVideo && (
        <Portal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto overlay-enter" onClick={() => setEditVideo(null)}>
            <div className="absolute inset-0 bg-gradient-to-br from-pink-300/30 via-fuchsia-200/20 to-rose-300/30 backdrop-blur-sm" />
            <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl border-2 border-pink-200 w-full max-w-2xl mx-4 my-8 shadow-[0_20px_60px_rgba(255,107,157,0.25)] modal-enter flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b-2 border-pink-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-md">
                  <Film className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                  {isNew ? "Add New Video" : `Edit Video #${editVideo.id}`}
                </h3>
              </div>
              <button onClick={() => setEditVideo(null)} className="p-1.5 text-gray-400 hover:text-pink-500 hover:bg-pink-50 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-1 min-h-0">
              {isNew && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block font-medium">Video ID * (unique identifier)</label>
                  <input value={form.videoId} onChange={(e) => update("videoId", e.target.value)}
                    className="w-full bg-pink-50/50 border-2 border-pink-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400 focus:bg-white transition-all" />
                </div>
              )}
              <div>
                <label className="text-xs text-gray-500 mb-1 block font-medium">Title</label>
                <input value={form.title} onChange={(e) => update("title", e.target.value)}
                  className="w-full bg-pink-50/50 border-2 border-pink-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400 focus:bg-white transition-all" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block font-medium">Description</label>
                <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-admin-accent resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block font-medium">Poster Image URL</label>
                  <input value={form.posterImage} onChange={(e) => update("posterImage", e.target.value)}
                    className="w-full bg-pink-50/50 border-2 border-pink-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400 focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block font-medium">Uploader Name</label>
                  <input value={form.uploadedByName} onChange={(e) => update("uploadedByName", e.target.value)}
                    className="w-full bg-pink-50/50 border-2 border-pink-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400 focus:bg-white transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block font-medium">Release Date</label>
                  <input type="date" value={form.releaseDate} onChange={(e) => update("releaseDate", e.target.value)}
                    className="w-full bg-pink-50/50 border-2 border-pink-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400 focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block font-medium">Duration (seconds)</label>
                  <input type="number" value={form.durationSeconds} onChange={(e) => update("durationSeconds", parseInt(e.target.value) || 0)}
                    className="w-full bg-pink-50/50 border-2 border-pink-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400 focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block font-medium">Views</label>
                  <input type="number" value={form.views} onChange={(e) => update("views", parseInt(e.target.value) || 0)}
                    className="w-full bg-pink-50/50 border-2 border-pink-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400 focus:bg-white transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block font-medium">Year</label>
                  <input type="number" value={form.year} onChange={(e) => update("year", parseInt(e.target.value) || 0)}
                    placeholder="e.g. 2024"
                    className="w-full bg-pink-50/50 border-2 border-pink-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400 focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block font-medium">Country</label>
                  <select value={form.country} onChange={(e) => update("country", e.target.value)}
                    className="w-full bg-pink-50/50 border-2 border-pink-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400 focus:bg-white transition-all">
                    {countries.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Qualities */}
              {isNew && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block font-medium">Qualities</label>
                  {form.qualities.map((q, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input value={q.label} placeholder="Label (e.g. 720p)"
                        onChange={(e) => { const qs = [...form.qualities]; qs[i] = { ...qs[i], label: e.target.value }; update("qualities", qs); }}
                        className="w-24 bg-pink-50/50 border-2 border-pink-200 rounded-2xl px-3 py-1.5 text-sm focus:outline-none focus:border-pink-400 focus:bg-white transition-all" />
                      <input value={q.url} placeholder="URL"
                        onChange={(e) => { const qs = [...form.qualities]; qs[i] = { ...qs[i], url: e.target.value }; update("qualities", qs); }}
                        className="flex-1 bg-pink-50/50 border-2 border-pink-200 rounded-2xl px-3 py-1.5 text-sm focus:outline-none focus:border-pink-400 focus:bg-white transition-all" />
                      <button onClick={() => update("qualities", form.qualities.filter((_, j) => j !== i))}
                        className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                  <button onClick={() => update("qualities", [...form.qualities, { label: "", url: "" }])}
                    className="text-xs text-admin-accent hover:underline">+ Add Quality</button>
                </div>
              )}

              {/* Categories */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block font-medium">Categories</label>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
                  {categories.map((c) => (
                    <button key={c.id} onClick={() => toggleCategory(c.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 ${form.categoryIds.includes(c.id) ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md" : "bg-pink-50 text-gray-600 hover:bg-pink-100 border border-pink-200"}`}>
                      {c.name.split(" / ")[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block font-medium">Tags</label>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
                  {tags.map((t) => (
                    <button key={t.id} onClick={() => toggleTag(t.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 ${form.tagIds.includes(t.id) ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md" : "bg-pink-50 text-gray-600 hover:bg-pink-100 border border-pink-200"}`}>
                      #{t.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5 border-t-2 border-pink-100 flex gap-3 justify-end">
              <button onClick={() => setEditVideo(null)}
                className="px-5 py-2.5 border-2 border-pink-200 rounded-2xl text-sm font-medium text-gray-600 hover:bg-pink-50 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl text-sm font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed">
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : isNew ? "Create Video" : "Save Changes"}
              </button>
            </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
