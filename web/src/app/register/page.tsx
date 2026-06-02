"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { UserPlus, Play, Sparkles, User, AtSign, Mail, KeyRound } from "lucide-react";

export default function RegisterPage() {
  const [form, setForm] = useState({ username: "", email: "", password: "", nickname: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const router = useRouter();
  const { register } = useAuth();

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password.trim()) {
      setError("Username and password required");
      triggerShake();
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      triggerShake();
      return;
    }
    setLoading(true);
    setError("");
    const ok = await register(form);
    if (ok) {
      setTimeout(() => router.push("/"), 400);
    } else {
      setError("Registration failed. Username may already exist.");
      triggerShake();
      setLoading(false);
    }
  };

  const update = (k: string, v: string) => setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden px-4 py-8">
      <div className="absolute inset-0 bg-gradient-to-br from-pink-100 via-rose-50 to-fuchsia-100" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-pink-300/40 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-fuchsia-300/40 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-200/20 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8 page-enter">
          <Link href="/" className="inline-flex items-center gap-2 mb-5 group">
            <div className="w-14 h-14 bg-gradient-to-br from-pink-400 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-200/60 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <Play className="w-6 h-6 text-white fill-white ml-0.5" />
            </div>
            <Sparkles className="w-5 h-5 text-pink-400 group-hover:rotate-12 transition-transform" />
          </Link>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
            Join Balili
          </h1>
          <p className="text-sm text-pink-700/70 mt-1.5">Create your account in seconds</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className={`kawaii-card p-6 space-y-4 hover:!translate-y-0 ${shake ? "shake" : ""}`}
        >
          <div className="absolute -top-3 -right-3 text-3xl pointer-events-none">✨</div>
          {error && (
            <div className="bg-gradient-to-r from-red-50 to-pink-50 text-red-500 text-sm rounded-2xl px-4 py-2.5 border-2 border-red-200 modal-enter">
              {error}
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-pink-600 mb-1.5 block">Username *</label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-300" />
              <input
                value={form.username}
                onChange={(e) => update("username", e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-pink-50/50 border-2 border-pink-200 rounded-2xl text-sm focus:outline-none focus:border-pink-400 focus:bg-white transition-all"
                placeholder="Choose a username"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-pink-600 mb-1.5 block">Nickname</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-300" />
              <input
                value={form.nickname}
                onChange={(e) => update("nickname", e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-pink-50/50 border-2 border-pink-200 rounded-2xl text-sm focus:outline-none focus:border-pink-400 focus:bg-white transition-all"
                placeholder="Display name (optional)"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-pink-600 mb-1.5 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-300" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-pink-50/50 border-2 border-pink-200 rounded-2xl text-sm focus:outline-none focus:border-pink-400 focus:bg-white transition-all"
                placeholder="your@email.com (optional)"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-pink-600 mb-1.5 block">Password *</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-300" />
              <input
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-pink-50/50 border-2 border-pink-200 rounded-2xl text-sm focus:outline-none focus:border-pink-400 focus:bg-white transition-all"
                placeholder="At least 6 characters"
                autoComplete="new-password"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-80 disabled:cursor-wait"
          >
            <UserPlus className="w-4 h-4" />
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating account...
              </span>
            ) : "Sign Up"}
          </button>
          <p className="text-center text-sm text-gray-400">
            Already have an account?{" "}
            <Link href="/login" className="text-pink-500 hover:text-rose-500 font-medium hover:underline transition-colors">Log In</Link>
          </p>
        </form>
      </div>

      {/* Loading overlay */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-pink-100/95 via-rose-50/95 to-fuchsia-100/95 backdrop-blur-md transition-opacity duration-300 ${loading ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      >
        <div className="text-center modal-enter">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-pink-200" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-pink-500 border-r-rose-500 smooth-spin" />
            <UserPlus className="absolute inset-0 m-auto w-7 h-7 text-pink-500" />
          </div>
          <p className="text-lg font-semibold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
            Setting things up...
          </p>
          <p className="text-xs text-pink-400 mt-1">Just a moment ✨</p>
        </div>
      </div>
    </div>
  );
}
