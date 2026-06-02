"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AdminUserListItem,
  AdminUserDetail,
  AdminUserVideoItem,
  AdminUserCommentItem,
} from "@/types";
import { api } from "@/lib/api";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit3,
  X,
  Save,
  Users as UsersIcon,
  Sparkles,
  Mail,
  Calendar,
  Video as VideoIcon,
  MessageCircle,
  Heart,
  Eye,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

function formatNum(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function formatDate(s: string): string {
  if (!s) return "-";
  return new Date(s).toLocaleString();
}

function defaultAvatar(name: string): string {
  const initial = (name || "?").charAt(0).toUpperCase();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initial)}&background=fce7f3&color=db2777&bold=true&size=128`;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editUser, setEditUser] = useState<AdminUserListItem | null>(null);
  const [editForm, setEditForm] = useState({ username: "", nickname: "", email: "" });
  const [saving, setSaving] = useState(false);

  const loadUsers = useCallback(() => {
    setLoading(true);
    api.admin
      .getUsers({ page, limit: 20, q: query, orderBy: "created_at desc" })
      .then((res: any) => {
        setUsers(res.data || []);
        setTotalPages(res.meta?.totalPages || 1);
        setTotal(res.meta?.total || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, query]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  const openDetail = async (u: AdminUserListItem) => {
    setDetail(null);
    setDetailLoading(true);
    try {
      const res: any = await api.admin.getUser(u.id);
      setDetail(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  };

  const openEdit = (u: AdminUserListItem) => {
    setEditUser(u);
    setEditForm({
      username: u.username,
      nickname: u.nickname || "",
      email: u.email || "",
    });
  };

  const handleSave = async () => {
    if (!editUser || saving) return;
    setSaving(true);
    try {
      await api.admin.updateUser(editUser.id, {
        username: editForm.username.trim(),
        nickname: editForm.nickname.trim(),
        email: editForm.email.trim(),
      });
      setEditUser(null);
      loadUsers();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u: AdminUserListItem) => {
    if (!confirm(`Delete user "${u.username}"? This will remove their likes, votes, comments, and detach their videos.`)) return;
    try {
      await api.admin.deleteUser(u.id);
      setDetail(null);
      if (detail?.id === u.id) setDetail(null);
      loadUsers();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-100 via-rose-50 to-fuchsia-100 border-2 border-pink-200 p-6">
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-pink-300/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-fuchsia-300/30 rounded-full blur-3xl" />
        <div className="relative flex items-center gap-3 flex-wrap">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-lg">
            <UsersIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent flex items-center gap-2">
              Users <Sparkles className="w-5 h-5 text-pink-400" />
            </h1>
            <p className="text-sm text-pink-700/70 mt-0.5">{total.toLocaleString()} users total</p>
          </div>
        </div>
        <form onSubmit={handleSearch} className="relative mt-4 flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by username, nickname, or email..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/80 backdrop-blur border-2 border-pink-200 rounded-2xl text-sm focus:outline-none focus:border-pink-400 focus:bg-white transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl text-sm font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
          >
            Search
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white/80 backdrop-blur rounded-2xl border-2 border-pink-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-pink-50/50">
              <tr className="text-left text-pink-600">
                <th className="px-5 py-3 font-semibold">User</th>
                <th className="px-5 py-3 font-semibold">Email</th>
                <th className="px-5 py-3 font-semibold w-20">Videos</th>
                <th className="px-5 py-3 font-semibold w-20">Comments</th>
                <th className="px-5 py-3 font-semibold w-20">Likes</th>
                <th className="px-5 py-3 font-semibold w-32">Joined</th>
                <th className="px-5 py-3 font-semibold w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-pink-400">
                    <span className="inline-flex items-center gap-2">
                      <Sparkles className="w-4 h-4 animate-spin" /> Loading...
                    </span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-gray-400">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((u, i) => (
                  <tr
                    key={u.id}
                    className="border-t border-pink-50 hover:bg-gradient-to-r hover:from-pink-50/50 hover:to-rose-50/50 transition-colors duration-200 item-enter"
                    style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-pink-100 shrink-0">
                          <img
                            src={u.avatar || defaultAvatar(u.username)}
                            alt=""
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <div className="min-w-0">
                          <button
                            onClick={() => openDetail(u)}
                            className="font-semibold text-gray-800 hover:text-pink-600 transition-colors truncate block text-left"
                          >
                            {u.nickname || u.username}
                          </button>
                          <p className="text-xs text-gray-400">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-600 truncate max-w-xs">
                      {u.email ? (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="w-3 h-3 text-gray-400" />
                          {u.email}
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{formatNum(u.videoCount)}</td>
                    <td className="px-5 py-3 text-gray-600">{formatNum(u.commentCount)}</td>
                    <td className="px-5 py-3 text-gray-600">{formatNum(u.likeCount)}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(u.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openDetail(u)}
                          title="View details"
                          className="p-1.5 text-gray-400 hover:text-pink-500 hover:bg-pink-100 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEdit(u)}
                          className="p-1.5 text-gray-400 hover:text-pink-500 hover:bg-pink-100 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t-2 border-pink-100 text-sm">
          <p className="text-pink-600">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 border-2 border-pink-200 rounded-xl text-gray-600 hover:bg-pink-50 hover:border-pink-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 border-2 border-pink-200 rounded-xl text-gray-600 hover:bg-pink-50 hover:border-pink-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {(detail || detailLoading) && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-10 overlay-enter"
          onClick={() => setDetail(null)}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-pink-300/30 via-fuchsia-200/20 to-rose-300/30 backdrop-blur-sm" />
          <div
            className="relative bg-white/95 backdrop-blur-xl rounded-3xl border-2 border-pink-200 w-full max-w-3xl mx-4 my-auto shadow-[0_20px_60px_rgba(255,107,157,0.25)] modal-enter max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b-2 border-pink-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-md">
                  <UsersIcon className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                  User Details
                </h3>
              </div>
              <button
                onClick={() => setDetail(null)}
                className="p-1.5 text-gray-400 hover:text-pink-500 hover:bg-pink-50 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto admin-scroll flex-1">
              {detailLoading || !detail ? (
                <div className="py-12 text-center text-pink-400">
                  <Sparkles className="w-5 h-5 animate-spin inline-block mr-2" />
                  Loading user...
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Profile card */}
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-pink-50 to-rose-50 border-2 border-pink-100 rounded-2xl">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-pink-100 shrink-0 border-2 border-white shadow-md">
                      <img
                        src={detail.avatar || defaultAvatar(detail.username)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-bold text-gray-800 truncate">
                        {detail.nickname || detail.username}
                      </p>
                      <p className="text-sm text-pink-500 truncate">@{detail.username}</p>
                      {detail.email && (
                        <p className="text-xs text-gray-500 mt-1 inline-flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {detail.email}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-xs text-gray-500 shrink-0">
                      <p className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(detail.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">User ID: #{detail.id}</p>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <StatBox icon={<VideoIcon className="w-4 h-4" />} label="Videos" value={detail.videoCount} color="from-pink-400 to-rose-500" />
                    <StatBox icon={<MessageCircle className="w-4 h-4" />} label="Comments" value={detail.commentCount} color="from-fuchsia-400 to-pink-500" />
                    <StatBox icon={<Heart className="w-4 h-4" />} label="Likes" value={detail.likeCount} color="from-rose-400 to-red-500" />
                    <StatBox icon={<ThumbsUp className="w-4 h-4" />} label="Votes" value={detail.voteCount} color="from-amber-400 to-orange-500" />
                    <StatBox icon={<Eye className="w-4 h-4" />} label="Total Views" value={detail.totalViews} color="from-violet-400 to-purple-500" />
                  </div>

                  {/* Recent videos */}
                  <div>
                    <h4 className="text-sm font-semibold text-pink-600 mb-2 flex items-center gap-1.5">
                      <VideoIcon className="w-4 h-4" /> Recent Videos
                    </h4>
                    {(detail.recentVideos?.length ?? 0) === 0 ? (
                      <p className="text-xs text-gray-400 py-3 text-center bg-pink-50/30 rounded-xl">No videos uploaded</p>
                    ) : (
                      <ul className="space-y-2">
                        {(detail.recentVideos || []).map((v: AdminUserVideoItem) => (
                          <li
                            key={v.id}
                            className="flex items-center gap-3 p-2.5 bg-white border border-pink-100 hover:border-pink-300 rounded-xl transition-colors"
                          >
                            <div className="w-16 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                              {v.posterImage && (
                                <img src={v.posterImage} alt="" className="w-full h-full object-cover" loading="lazy" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 line-clamp-1">{v.title}</p>
                              <p className="text-[11px] text-gray-400 mt-0.5">
                                {v.videoId} · {new Date(v.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right text-[11px] text-gray-500 shrink-0 space-y-0.5">
                              <p className="inline-flex items-center gap-1"><Eye className="w-3 h-3" />{formatNum(v.views)}</p>
                              <p className="inline-flex items-center gap-1"><ThumbsUp className="w-3 h-3" />{v.upvotes} / <ThumbsDown className="w-3 h-3" />{v.downvotes}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Recent comments */}
                  <div>
                    <h4 className="text-sm font-semibold text-pink-600 mb-2 flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4" /> Recent Comments
                    </h4>
                    {(detail.recentComments?.length ?? 0) === 0 ? (
                      <p className="text-xs text-gray-400 py-3 text-center bg-pink-50/30 rounded-xl">No comments posted</p>
                    ) : (
                      <ul className="space-y-2">
                        {(detail.recentComments || []).map((c: AdminUserCommentItem) => (
                          <li
                            key={c.id}
                            className="p-3 bg-white border border-pink-100 rounded-xl"
                          >
                            <p className="text-sm text-gray-700 line-clamp-2">{c.content}</p>
                            <p className="text-[11px] text-gray-400 mt-1">
                              on <span className="text-pink-500">{c.videoTitle || `Video #${c.videoId}`}</span> · {formatDate(c.createdAt)}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 overlay-enter"
          onClick={() => setEditUser(null)}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-pink-300/30 via-fuchsia-200/20 to-rose-300/30 backdrop-blur-sm" />
          <div
            className="relative bg-white/95 backdrop-blur-xl rounded-3xl border-2 border-pink-200 w-full max-w-md mx-4 my-auto shadow-[0_20px_60px_rgba(255,107,157,0.25)] modal-enter max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b-2 border-pink-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-md">
                  <Edit3 className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                  Edit User #{editUser.id}
                </h3>
              </div>
              <button
                onClick={() => setEditUser(null)}
                className="p-1.5 text-gray-400 hover:text-pink-500 hover:bg-pink-50 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="text-xs text-gray-500 mb-1 block font-medium">Username *</label>
                <input
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  className="w-full bg-pink-50/50 border-2 border-pink-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block font-medium">Nickname</label>
                <input
                  value={editForm.nickname}
                  onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
                  className="w-full bg-pink-50/50 border-2 border-pink-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block font-medium">Email</label>
                <input
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full bg-pink-50/50 border-2 border-pink-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="p-5 border-t-2 border-pink-100 flex gap-3 justify-end">
              <button
                onClick={() => setEditUser(null)}
                className="px-5 py-2.5 border-2 border-pink-200 rounded-2xl text-sm font-medium text-gray-600 hover:bg-pink-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl text-sm font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className={`relative overflow-hidden p-3 rounded-2xl bg-gradient-to-br ${color} text-white shadow-sm`}>
      <div className="flex items-center gap-1.5 text-[11px] font-medium opacity-90">
        {icon}
        {label}
      </div>
      <p className="text-2xl font-bold mt-1">{formatNum(value)}</p>
    </div>
  );
}
