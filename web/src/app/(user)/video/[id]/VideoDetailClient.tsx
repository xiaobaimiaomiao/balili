"use client";

import { useState, useRef, useCallback } from "react";
import { Video, Quality, Comment } from "@/types";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import {
  ArrowLeft, Eye, Clock, Star, Calendar, Tag, Image as ImageIcon,
  Play, Pause, Maximize, Minimize, Volume2, VolumeX,
  Heart, Send, MessageCircle, Settings, ChevronDown,
  User, MonitorPlay, ThumbsUp, ThumbsDown,
} from "lucide-react";
import Hls from "hls.js";

function formatDuration(seconds: number): string {
  if (!seconds) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

/* ─────────── Modern Video Player ─────────── */
function ModernPlayer({
  qualities,
  poster,
  onFirstPlay,
}: {
  qualities: Quality[];
  poster: string;
  onFirstPlay: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [activeQuality, setActiveQuality] = useState<Quality | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showQuality, setShowQuality] = useState(false);
  const [loading, setLoading] = useState(false);

  const playable = qualities.filter((q) => q.url);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (isPlaying) {
      hideTimerRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [isPlaying]);

  const loadStream = useCallback(
    (quality: Quality) => {
      const video = videoRef.current;
      if (!video) return;
      setActiveQuality(quality);
      setLoading(true);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      const url = quality.url;
      if (!url) return;

      if (url.includes(".m3u8")) {
        if (Hls.isSupported()) {
          const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
          hlsRef.current = hls;
          hls.loadSource(url);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play().catch(() => {});
            setLoading(false);
          });
          hls.on(Hls.Events.ERROR, () => setLoading(false));
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = url;
          video.addEventListener("loadedmetadata", () => {
            video.play().catch(() => {});
            setLoading(false);
          });
        }
      } else {
        video.src = url;
        video.play().catch(() => {});
        setLoading(false);
      }
      setIsPlaying(true);
      if (!hasStarted) {
        setHasStarted(true);
        onFirstPlay();
      }
    },
    [hasStarted, onFirstPlay]
  );

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play().catch(() => {}); setIsPlaying(true); }
    else { v.pause(); setIsPlaying(false); }
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen();
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }, []);

  const handleVolume = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const val = parseFloat(e.target.value);
    v.volume = val; v.muted = val === 0;
    setVolume(val); setMuted(val === 0);
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const t = parseFloat(e.target.value);
    v.currentTime = t; setCurrentTime(t);
  }, []);

  const handleVideoTime = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(v.currentTime);
    if (v.buffered.length > 0) setBuffered(v.buffered.end(v.buffered.length - 1));
  }, []);

  const handleLoadedMeta = useCallback(() => {
    const v = videoRef.current;
    if (v) setDuration(v.duration);
  }, []);

  const startPlayback = () => {
    const q = playable[playable.length - 1];
    if (q) loadStream(q);
  };

  return (
    <div
      ref={containerRef}
      className="relative group bg-black rounded-2xl overflow-hidden select-none"
      style={{ aspectRatio: "16/9" }}
      onMouseMove={resetHideTimer}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button, input, .quality-menu")) return;
        if (hasStarted) togglePlay();
      }}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        poster={hasStarted ? undefined : poster}
        playsInline
        onTimeUpdate={handleVideoTime}
        onLoadedMetadata={handleLoadedMeta}
        onPlay={() => setIsPlaying(true)}
        onPause={() => { setIsPlaying(false); setShowControls(true); }}
        onWaiting={() => setLoading(true)}
        onCanPlay={() => setLoading(false)}
      />

      {!hasStarted && (
        <>
          {poster && <img src={poster} alt="" className="absolute inset-0 w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
            {playable.length > 0 ? (
              <>
                <button onClick={startPlayback}
                  className="w-20 h-20 bg-white/90 hover:bg-white rounded-full flex items-center justify-center hover:scale-110 transition-all shadow-xl">
                  <Play className="w-9 h-9 text-primary-500 fill-primary-500 ml-1" />
                </button>
                {playable.length > 1 && (
                  <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-4 py-2">
                    <Settings className="w-4 h-4 text-white/70" />
                    {playable.map((q) => (
                      <button key={q.id} onClick={() => loadStream(q)}
                        className="px-3 py-1 rounded-full text-xs font-medium text-white/80 hover:bg-white/20 transition-all">
                        {q.label}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-white/50 text-center">
                <Play className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No playable source</p>
              </div>
            )}
          </div>
        </>
      )}

      {loading && hasStarted && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {hasStarted && (
        <div className={`absolute inset-0 flex flex-col justify-end transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center">
              <button onClick={togglePlay}
                className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all">
                <Play className="w-8 h-8 text-white fill-white ml-1" />
              </button>
            </div>
          )}
          <div className="relative z-10 px-4 pb-3 space-y-2">
            <div className="flex items-center gap-3 group/progress">
              <span className="text-[11px] text-white/80 font-mono w-12 text-right">{formatDuration(Math.floor(currentTime))}</span>
              <div className="flex-1 relative h-1 group-hover/progress:h-1.5 transition-all">
                <input type="range" min={0} max={duration || 0} step={0.1} value={currentTime} onChange={handleSeek}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <div className="absolute inset-0 bg-white/20 rounded-full" />
                <div className="absolute left-0 top-0 h-full bg-white/40 rounded-full"
                  style={{ width: `${duration ? (buffered / duration) * 100 : 0}%` }} />
                <div className="absolute left-0 top-0 h-full bg-primary-500 rounded-full"
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }} />
              </div>
              <span className="text-[11px] text-white/80 font-mono w-12">{formatDuration(Math.floor(duration))}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={togglePlay} className="p-1.5 text-white hover:text-primary-300 transition-colors">
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 group/vol">
                  <button onClick={toggleMute} className="p-1.5 text-white hover:text-primary-300 transition-colors">
                    {muted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume} onChange={handleVolume}
                    className="volume-slider w-0 group-hover/vol:w-20 transition-all duration-200 h-1 cursor-pointer" />
                </div>
                <button onClick={toggleFullscreen} className="p-1.5 text-white hover:text-primary-300 transition-colors">
                  {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────── Comment Section ─────────── */
function CommentSection({ videoId }: { videoId: number }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res: any = await api.getComments(videoId, p, 20);
      if (res.data) setComments((prev) => (p === 1 ? res.data : [...prev, ...res.data]));
      if (res.meta) setTotal(res.meta.total);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [videoId]);

  useState(() => { fetchComments(1); });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      await api.createComment(videoId, { content: content.trim() });
      setContent("");
      setPage(1);
      fetchComments(1);
    } catch { /* ignore */ }
    finally { setSubmitting(false); }
  };

  return (
    <div className="kawaii-card p-5">
      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-5">
        <MessageCircle className="w-5 h-5 text-primary-400" />
        Comments {total > 0 && <span className="text-sm font-normal text-gray-400">({total})</span>}
      </h3>

      {user ? (
        <form onSubmit={handleSubmit} className="mb-6 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-lavender flex items-center justify-center text-white text-xs font-bold">
              {(user.nickname || user.username).charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-gray-600">{user.nickname || user.username}</span>
          </div>
          <textarea
            placeholder="Write a comment..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="kawaii-input w-full text-sm resize-none"
            rows={3}
            maxLength={2000}
          />
          <div className="flex justify-end">
            <button type="submit" disabled={submitting || !content.trim()}
              className="kawaii-btn flex items-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed">
              <Send className="w-4 h-4" />
              {submitting ? "Posting..." : "Post Comment"}
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-6 bg-pink-50 rounded-2xl p-4 text-center">
          <p className="text-sm text-gray-500 mb-2">Log in to leave a comment</p>
          <Link href="/login" className="kawaii-btn !px-4 !py-1.5 !text-sm inline-block">Log In</Link>
        </div>
      )}

      <div className="space-y-4">
        {comments.length === 0 && !loading && (
          <p className="text-center text-gray-400 text-sm py-6">No comments yet. Be the first!</p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-300 to-lavender flex items-center justify-center text-white text-sm font-bold shrink-0">
              {c.nickname.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">{c.nickname}</span>
                <span className="text-xs text-gray-400">{timeAgo(c.createdAt)}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap break-words">{c.content}</p>
            </div>
          </div>
        ))}
      </div>

      {comments.length > 0 && comments.length < total && (
        <div className="text-center mt-5">
          <button onClick={() => { const n = page + 1; setPage(n); fetchComments(n); }}
            disabled={loading}
            className="text-sm text-primary-500 hover:text-primary-600 font-medium disabled:opacity-50">
            {loading ? "Loading..." : "Load more comments"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─────────── Main Page ─────────── */
export default function VideoDetailClient({ video, related }: { video: Video; related: Video[] }) {
  const { user } = useAuth();
  const [activeScreenshot, setActiveScreenshot] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(video.likesCount || 0);
  const [theaterMode, setTheaterMode] = useState(false);
  const [voteStatus, setVoteStatus] = useState({
    upvotes: video.upvotes || 0,
    downvotes: video.downvotes || 0,
    userVote: null as boolean | null,
    rating: (video.upvotes > 0 || video.downvotes > 0) 
      ? Math.round((video.upvotes / (video.upvotes + video.downvotes)) * 100) 
      : 0,
  });
  const viewIncremented = useRef(false);

  const handleFirstPlay = useCallback(() => {
    if (!viewIncremented.current) {
      viewIncremented.current = true;
      api.incrementView(video.id).catch(() => {});
    }
  }, [video.id]);

  const handleLike = useCallback(async () => {
    if (!video) return;
    try {
      const res: any = await api.toggleLike(video.id);
      const newLiked = res.data?.liked ?? !liked;
      setLiked(newLiked);
      localStorage.setItem(`liked_${video.id}`, newLiked ? "1" : "0");
      setLikesCount((prev) => (newLiked ? prev + 1 : Math.max(0, prev - 1)));
    } catch { /* ignore */ }
  }, [video, liked]);

  const handleVote = useCallback(async (isUp: boolean) => {
    if (!video || !user) return;
    try {
      const res: any = await api.vote(video.id, isUp);
      if (res.data) {
        setVoteStatus(res.data);
      }
    } catch { /* ignore */ }
  }, [video, user]);

  // Fetch vote status on mount
  useState(() => {
    if (user) {
      api.getVoteStatus(video.id)
        .then((res: any) => {
          if (res.data) {
            setVoteStatus(res.data);
          }
        })
        .catch(() => {});
    }
  });

  const gridCols = theaterMode ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-3";
  const mainSpan = theaterMode ? "" : "lg:col-span-2";

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-primary-500 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>

      <div className={`grid ${gridCols} gap-6`}>
        <div className={`${mainSpan} space-y-6`}>
          {/* Video Player */}
          <div className={theaterMode ? "max-w-[95vw] mx-auto" : ""}>
            <ModernPlayer qualities={video.qualities || []} poster={video.posterImage} onFirstPlay={handleFirstPlay} />
          </div>

          {/* Title & Meta */}
          <div className="kawaii-card p-5">
            <h1 className="text-xl font-bold text-gray-800 leading-snug">{video.title}</h1>

            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5"><Eye className="w-4 h-4 text-primary-400" />{video.views.toLocaleString()} views</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-primary-400" />{formatDuration(video.durationSeconds)}</span>
              {(voteStatus.rating > 0 || voteStatus.totalVotes > 0) && (
                <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-primary-400 fill-primary-400" />{Math.round(voteStatus.rating)}% ({voteStatus.totalVotes} votes)</span>
              )}
              {video.releaseDate && (
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-primary-400" />{new Date(video.releaseDate).toLocaleDateString()}</span>
              )}
              {video.uploadedByName && (
                <Link href={`/user/${video.uploadedByName}`}
                  className="flex items-center gap-1.5 text-primary-500 hover:text-primary-600 transition-colors">
                  <User className="w-4 h-4" />{video.uploadedByName}
                </Link>
              )}
            </div>

            {/* Like & Vote buttons */}
            <div className="mt-4 pt-4 border-t border-pink-100 flex flex-wrap items-center gap-3">
              {/* Vote buttons */}
              {user ? (
                <div className="flex items-center gap-1">
                  <button onClick={() => handleVote(true)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full font-medium transition-all ${voteStatus.userVote === true ? "bg-green-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-green-100"}`}>
                    <ThumbsUp className="w-4 h-4" />
                    <span className="text-sm">{voteStatus.upvotes}</span>
                  </button>
                  <button onClick={() => handleVote(false)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full font-medium transition-all ${voteStatus.userVote === false ? "bg-red-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-red-100"}`}>
                    <ThumbsDown className="w-4 h-4" />
                    <span className="text-sm">{voteStatus.downvotes}</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-sm text-gray-400">
                  <ThumbsUp className="w-4 h-4" /><span>{voteStatus.upvotes}</span>
                  <ThumbsDown className="w-4 h-4 ml-2" /><span>{voteStatus.downvotes}</span>
                </div>
              )}
              {/* Like button */}
              {user ? (
                <button onClick={handleLike}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all duration-200 ${liked ? "bg-primary-500 text-white shadow-md hover:bg-primary-600" : "bg-pink-50 text-gray-500 hover:bg-pink-100 border-2 border-pink-200"}`}>
                  <Heart className={`w-5 h-5 ${liked ? "fill-white" : ""}`} />
                  {liked ? "Liked" : "Like"}
                  <span className={`text-sm ${liked ? "text-white/80" : "text-gray-400"}`}>{likesCount.toLocaleString()}</span>
                </button>
              ) : (
                <Link href="/login"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full font-medium bg-pink-50 text-gray-400 border-2 border-pink-200 hover:border-primary-300 transition-colors inline-flex">
                  <Heart className="w-5 h-5" /> Login to Like
                  <span className="text-sm text-gray-400">{likesCount.toLocaleString()}</span>
                </Link>
              )}
            </div>

            {/* Description */}
            {video.description && (
              <p className="mt-4 text-sm text-gray-600 whitespace-pre-wrap">{video.description}</p>
            )}

            {/* Categories & Tags */}
            <div className="mt-4 space-y-3">
              {video.categories?.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="w-4 h-4 text-primary-400 shrink-0" />
                  {video.categories.map((c) => (
                    <Link key={c.id} href={`/category/${c.slug}`} className="kawaii-badge hover:bg-primary-200 transition-colors">{c.name}</Link>
                  ))}
                </div>
              )}
              {video.tags?.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-400 shrink-0">Tags:</span>
                  {video.tags.map((t) => (
                    <Link key={t.id} href={`/tag/${t.slug}`}
                      className="text-xs bg-gray-100 text-gray-600 rounded-full px-2.5 py-0.5 hover:bg-primary-100 hover:text-primary-600 transition-colors">
                      #{t.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Comments */}
          <CommentSection videoId={video.id} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {video.screenshots?.length > 0 && (
            <div className="kawaii-card p-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-primary-400" /> Screenshots
              </h3>
              <div className="aspect-video bg-pink-50 rounded-2xl overflow-hidden mb-2">
                <img src={video.screenshots[activeScreenshot]?.url} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {video.screenshots.map((s, i) => (
                  <button key={s.id} onClick={() => setActiveScreenshot(i)}
                    className={`aspect-video rounded-lg overflow-hidden border-2 transition-colors ${i === activeScreenshot ? "border-primary-400" : "border-transparent hover:border-pink-200"}`}>
                    <img src={s.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {related.length > 0 && (
            <div className="kawaii-card p-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3">Related Videos</h3>
              <div className="space-y-3">
                {related.slice(0, 5).map((v) => (
                  <Link key={v.id} href={`/video/${v.id}`} className="flex gap-3 group">
                    <div className="w-28 aspect-video rounded-xl overflow-hidden bg-pink-50 shrink-0">
                      {v.posterImage && (
                        <img src={v.posterImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700 line-clamp-2">{v.title}</p>
                      <p className="text-xs text-gray-400 mt-1">{v.views.toLocaleString()} views</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}