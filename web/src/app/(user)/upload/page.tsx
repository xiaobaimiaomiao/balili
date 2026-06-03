"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Category, Tag, Country } from "@/types";
import Link from "next/link";
import { Upload, ArrowLeft, Film, Sparkles, Image as ImageIcon, Camera, Plus, X, Check, Tag as TagIcon, Globe, FolderOpen } from "lucide-react";

export default function UploadPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Selectable data
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);

  // Selections
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("");

  // New tag input
  const [newTagInput, setNewTagInput] = useState("");
  const [newTags, setNewTags] = useState<string[]>([]);

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
      .catch(console.error);
  }, []);

  if (!user) {
    return (
      <div className="text-center py-20">
        <Film className="w-12 h-12 text-pink-200 mx-auto mb-4" />
        <p className="text-gray-400 mb-4">Please log in to upload videos</p>
        <Link href="/login" className="kawaii-btn inline-block">Log In</Link>
      </div>
    );
  }

  const toggleTag = (id: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const addNewTag = () => {
    const name = newTagInput.trim();
    if (!name) return;
    // check duplicate with existing tags
    const existsInList = tags.some((t) => t.name.toLowerCase() === name.toLowerCase());
    if (existsInList) {
      setError(`Tag "${name}" already exists in the list`);
      return;
    }
    // check duplicate with already added new tags
    if (newTags.some((t) => t.toLowerCase() === name.toLowerCase())) {
      setError(`Tag "${name}" already added`);
      return;
    }
    setNewTags((prev) => [...prev, name]);
    setNewTagInput("");
    setError("");
  };

  const removeNewTag = (idx: number) => {
    setNewTags((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError("标题是必填的"); return; }
    if (!videoFile) { setError("请选择视频文件"); return; }
    if (!selectedCatId) { setError("请选择一个分类"); return; }
    if (!selectedCountry) { setError("请选择国家/地区"); return; }

    setSubmitting(true);
    setError("");

    const fd = new FormData();
    fd.append("title", title.trim());
    fd.append("description", description.trim());
    fd.append("categoryId", String(selectedCatId));
    fd.append("tagIds", selectedTagIds.join(","));
    fd.append("newTags", newTags.join(","));
    fd.append("country", selectedCountry);
    fd.append("video", videoFile);

    try {
      const res: any = await api.uploadVideo(fd);
      if (res.success) {
        router.push(`/video/${res.data?.id || ""}`);
      } else {
        setError(res.error?.message || "Upload failed");
      }
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-primary-500 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <div className="flex items-center gap-3">
        <Upload className="w-6 h-6 text-primary-400" />
        <h1 className="text-2xl font-bold text-gray-800">上传视频</h1>
      </div>

      <form onSubmit={handleSubmit} className="kawaii-card p-6 space-y-6 hover:!translate-y-0">
        {error && (
          <div className="bg-red-50 text-red-500 text-sm rounded-xl px-4 py-2.5 border border-red-100">{error}</div>
        )}

        {/* Title */}
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block font-medium">标题 *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="kawaii-input w-full text-sm" placeholder="Video title" maxLength={500} />
        </div>

        {/* Description */}
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block font-medium">描述</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="kawaii-input w-full text-sm resize-none" rows={3} placeholder="Describe your video..." maxLength={5000} />
        </div>

        {/* Category - Radio (single select) */}
        <div>
          <label className="text-xs text-gray-500 mb-2 block font-medium flex items-center gap-1.5">
            <FolderOpen className="w-3.5 h-3.5 text-primary-400" /> 分类 * <span className="text-gray-300">（单选）</span>
          </label>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCatId(selectedCatId === cat.id ? null : cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  selectedCatId === cat.id
                    ? "bg-gradient-to-r from-primary-500 to-primary-400 text-white shadow-md"
                    : "bg-gray-50 text-gray-600 hover:bg-pink-50 hover:text-pink-600 border border-gray-200 hover:border-pink-200"
                }`}
              >
                {selectedCatId === cat.id && <Check className="w-3 h-3 inline mr-1" />}
                {cat.name.split(" / ")[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Tags - Checkboxes (multi-select) + add new */}
        <div>
          <label className="text-xs text-gray-500 mb-2 block font-medium flex items-center gap-1.5">
            <TagIcon className="w-3.5 h-3.5 text-primary-400" /> 标签 <span className="text-gray-300">（多选，也可以添加新标签）</span>
          </label>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto mb-3">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  selectedTagIds.includes(tag.id)
                    ? "bg-gradient-to-r from-pink-500 to-rose-400 text-white shadow-md"
                    : "bg-gray-50 text-gray-600 hover:bg-pink-50 hover:text-pink-600 border border-gray-200 hover:border-pink-200"
                }`}
              >
                {selectedTagIds.includes(tag.id) && <Check className="w-3 h-3 inline mr-1" />}
                {tag.name}
              </button>
            ))}
          </div>

          {/* New tags added by user */}
          {newTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {newTags.map((name, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                  <Plus className="w-3 h-3" /> {name}
                  <button type="button" onClick={() => removeNewTag(idx)} className="ml-0.5 hover:text-red-500 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Add new tag input */}
          <div className="flex gap-2">
            <input
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addNewTag(); } }}
              className="kawaii-input flex-1 text-sm"
              placeholder="输入新标签名称..."
            />
            <button
              type="button"
              onClick={addNewTag}
              className="px-4 py-2 rounded-xl bg-primary-100 text-primary-600 text-xs font-medium hover:bg-primary-200 transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> 添加
            </button>
          </div>
        </div>

        {/* Country - Radio (single select) */}
        <div>
          <label className="text-xs text-gray-500 mb-2 block font-medium flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-primary-400" /> 国家/地区 * <span className="text-gray-300">（单选）</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {countries.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCountry(selectedCountry === c.name ? "" : c.name)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  selectedCountry === c.name
                    ? "bg-gradient-to-r from-blue-500 to-indigo-400 text-white shadow-md"
                    : "bg-gray-50 text-gray-600 hover:bg-pink-50 hover:text-pink-600 border border-gray-200 hover:border-pink-200"
                }`}
              >
                {selectedCountry === c.name && <Check className="w-3 h-3 inline mr-1" />}
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Video File */}
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block font-medium">视频文件 *</label>
          <input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
            className="kawaii-input w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-primary-100 file:text-primary-700 file:px-3 file:py-1 file:text-xs file:font-medium" />
        </div>

        {/* Info box */}
        <div className="rounded-xl bg-gradient-to-br from-primary-50 to-pink-50 border border-primary-100 px-4 py-3 text-xs text-gray-600 space-y-1.5">
          <p className="font-medium text-primary-600 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> 上传后自动生成
          </p>
          <p className="inline-flex items-center gap-1.5"><ImageIcon className="w-3 h-3 text-primary-400" /> 1 张封面图（从视频中截取）</p>
          <p className="inline-flex items-center gap-1.5"><Camera className="w-3 h-3 text-primary-400" /> 5 张预览截图（均匀时间戳）</p>
          <p className="text-gray-400 text-[11px] pt-1">只需上传视频 — 封面和截图会自动生成。</p>
        </div>

        <div className="bg-pink-50 rounded-xl px-4 py-3 text-xs text-gray-500">
          <p>上传者: <span className="font-medium text-primary-600">{user.nickname || user.username}</span></p>
        </div>

        <button type="submit" disabled={submitting} className="kawaii-btn w-full flex items-center justify-center gap-2 disabled:opacity-50">
          <Upload className="w-4 h-4" />
          {submitting ? "上传中..." : "上传视频"}
        </button>
      </form>
    </div>
  );
}
