"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import Link from "next/link";
import { Upload, ArrowLeft, Film, Sparkles, Image as ImageIcon, Camera } from "lucide-react";

export default function UploadPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!user) {
    return (
      <div className="text-center py-20">
        <Film className="w-12 h-12 text-pink-200 mx-auto mb-4" />
        <p className="text-gray-400 mb-4">Please log in to upload videos</p>
        <Link href="/login" className="kawaii-btn inline-block">Log In</Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError("Title is required"); return; }
    if (!videoFile) { setError("Please select a video file"); return; }

    setSubmitting(true);
    setError("");

    const fd = new FormData();
    fd.append("title", title.trim());
    fd.append("description", description.trim());
    fd.append("tags", tags.trim());
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
        <h1 className="text-2xl font-bold text-gray-800">Upload Video</h1>
      </div>

      <form onSubmit={handleSubmit} className="kawaii-card p-6 space-y-5 hover:!translate-y-0">
        {error && (
          <div className="bg-red-50 text-red-500 text-sm rounded-xl px-4 py-2.5 border border-red-100">{error}</div>
        )}

        <div>
          <label className="text-xs text-gray-500 mb-1.5 block font-medium">Title *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="kawaii-input w-full text-sm" placeholder="Video title" maxLength={500} />
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1.5 block font-medium">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="kawaii-input w-full text-sm resize-none" rows={4} placeholder="Describe your video..." maxLength={5000} />
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1.5 block font-medium">Tags</label>
          <input value={tags} onChange={(e) => setTags(e.target.value)} className="kawaii-input w-full text-sm" placeholder="anime, cosplay, dance (comma separated)" />
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1.5 block font-medium">Video File *</label>
          <input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
            className="kawaii-input w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-primary-100 file:text-primary-700 file:px-3 file:py-1 file:text-xs file:font-medium" />
        </div>

        <div className="rounded-xl bg-gradient-to-br from-primary-50 to-pink-50 border border-primary-100 px-4 py-3 text-xs text-gray-600 space-y-1.5">
          <p className="font-medium text-primary-600 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Auto-generated after upload
          </p>
          <p className="inline-flex items-center gap-1.5"><ImageIcon className="w-3 h-3 text-primary-400" /> 1 cover image (extracted from the video)</p>
          <p className="inline-flex items-center gap-1.5"><Camera className="w-3 h-3 text-primary-400" /> 5 preview screenshots at evenly spaced timestamps</p>
          <p className="text-gray-400 text-[11px] pt-1">Just upload the video — no need to prepare cover or screenshots yourself.</p>
        </div>

        <div className="bg-pink-50 rounded-xl px-4 py-3 text-xs text-gray-500">
          <p>Uploaded as: <span className="font-medium text-primary-600">{user.nickname || user.username}</span></p>
        </div>

        <button type="submit" disabled={submitting} className="kawaii-btn w-full flex items-center justify-center gap-2 disabled:opacity-50">
          <Upload className="w-4 h-4" />
          {submitting ? "Uploading..." : "Upload Video"}
        </button>
      </form>
    </div>
  );
}
