"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Shield, Lock, Sparkles, User, KeyRound } from "lucide-react";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorShake, setErrorShake] = useState(false);
  const router = useRouter();
  const { adminLogin } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please fill in all fields");
      setErrorShake(true);
      setTimeout(() => setErrorShake(false), 400);
      return;
    }
    setLoading(true);
    setError("");
    const ok = await adminLogin(username.trim(), password);
    if (ok) {
      // Give the loading screen a moment to show before navigation
      setTimeout(() => router.push("/admin"), 350);
    } else {
      setError("Invalid admin credentials");
      setErrorShake(true);
      setTimeout(() => setErrorShake(false), 400);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-100 via-rose-50 to-fuchsia-100" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-pink-300/40 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-fuchsia-300/40 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-rose-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />

      <style>{`
        @keyframes adminFadeIn {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes spin3d {
          to { transform: rotate(360deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .admin-login-card { animation: adminFadeIn 0.5s ease-out both; }
        .admin-fade-1 { animation: adminFadeIn 0.4s ease-out 0.1s both; }
        .admin-fade-2 { animation: adminFadeIn 0.4s ease-out 0.2s both; }
        .admin-fade-3 { animation: adminFadeIn 0.4s ease-out 0.3s both; }
        .admin-fade-4 { animation: adminFadeIn 0.4s ease-out 0.4s both; }
        .admin-fade-5 { animation: adminFadeIn 0.4s ease-out 0.5s both; }
        .admin-fade-6 { animation: adminFadeIn 0.4s ease-out 0.6s both; }
        .admin-login-icon { animation: float 3s ease-in-out infinite; }
        .admin-login-card input { transition: all 0.2s ease; }
        .admin-login-card input:focus {
          box-shadow: 0 0 0 4px rgba(244,114,182,0.15);
          border-color: #f472b6;
        }
      `}</style>

      <div className="relative w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <div className="admin-login-icon w-20 h-20 bg-gradient-to-br from-pink-400 to-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-pink-200/60 rotate-3">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="admin-fade-1 text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent flex items-center justify-center gap-2">
            Admin Login <Sparkles className="w-5 h-5 text-pink-400" />
          </h1>
          <p className="admin-fade-2 text-sm text-pink-700/70 mt-1.5">Balili Content Management</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className={`admin-login-card relative bg-white/80 backdrop-blur-xl rounded-3xl border-2 border-pink-200 p-6 space-y-4 shadow-xl shadow-pink-200/30 ${errorShake ? "shake" : ""}`}
          style={{ animationDelay: "0.15s" }}
        >
          <div className="absolute -top-2 -right-2 text-2xl">🌸</div>
          {error && (
            <div
              className="bg-gradient-to-r from-red-50 to-pink-50 text-red-500 text-sm rounded-2xl px-4 py-2.5 border-2 border-red-200"
              style={{ animation: "adminFadeIn 0.3s ease-out both" }}
            >
              {error}
            </div>
          )}
          <div className="admin-fade-3">
            <label className="text-xs font-semibold text-pink-600 mb-1.5 block">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-300" />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-pink-50/50 border-2 border-pink-200 rounded-2xl text-sm focus:outline-none focus:bg-white transition-all"
                placeholder="Admin username"
                autoComplete="username"
              />
            </div>
          </div>
          <div className="admin-fade-4">
            <label className="text-xs font-semibold text-pink-600 mb-1.5 block">Password</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-300" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-pink-50/50 border-2 border-pink-200 rounded-2xl text-sm focus:outline-none focus:bg-white transition-all"
                placeholder="Admin password"
                autoComplete="current-password"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="admin-fade-5 w-full py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-80 disabled:cursor-wait"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Logging in...
              </span>
            ) : (
              <>
                <Lock className="w-4 h-4" /> Log In
              </>
            )}
          </button>
          <p className="admin-fade-6 text-center text-xs text-pink-400">
            Default: <span className="font-mono bg-pink-100 px-1.5 py-0.5 rounded">admin</span> / <span className="font-mono bg-pink-100 px-1.5 py-0.5 rounded">admin123</span>
          </p>
        </form>
      </div>

      {/* Loading overlay - shown while submitting */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-pink-100/95 via-rose-50/95 to-fuchsia-100/95 backdrop-blur-md transition-opacity duration-300 ${loading ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      >
        <div className="text-center" style={{ animation: "adminFadeIn 0.3s ease-out both" }}>
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-pink-200" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-pink-500 border-r-rose-500" style={{ animation: "spin3d 0.9s linear infinite" }} />
            <Shield className="absolute inset-0 m-auto w-8 h-8 text-pink-500" />
          </div>
          <p className="text-lg font-semibold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
            Signing you in...
          </p>
          <p className="text-xs text-pink-400 mt-1">Get ready to manage your platform ✨</p>
        </div>
      </div>
    </div>
  );
}
