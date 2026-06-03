"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, Film, FolderOpen, BarChart3, ArrowLeft, LogOut, Shield, Hash, Sparkles, Users, Globe } from "lucide-react";
import { useAuth } from "@/lib/auth";
import PageTransition from "@/components/PageTransition";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/videos", label: "Videos", icon: Film },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/categories", label: "Categories", icon: FolderOpen },
  { href: "/admin/tags", label: "Tags", icon: Hash },
  { href: "/admin/countries", label: "Countries", icon: Globe },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { adminToken, adminLogout, loading: authLoading } = useAuth();

  // Login page - no guard, no sidebar
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return <AdminGuard pathname={pathname} router={router} adminToken={adminToken} adminLogout={adminLogout} authLoading={authLoading}>{children}</AdminGuard>;
}

function AdminGuard({ children, pathname, router, adminToken, adminLogout, authLoading }: {
  children: React.ReactNode;
  pathname: string;
  router: ReturnType<typeof useRouter>;
  adminToken: string | null;
  adminLogout: () => void;
  authLoading: boolean;
}) {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Wait for AuthProvider to finish reading from localStorage
    if (authLoading) return;
    if (!adminToken) {
      router.replace("/admin/login");
    } else {
      setChecked(true);
    }
  }, [adminToken, router, authLoading]);

  if (authLoading || !checked) {
    return (
      <div className="min-h-screen bg-admin-bg flex items-center justify-center">
        <div className="text-gray-400 text-sm flex items-center gap-2">
          <Shield className="w-4 h-4 animate-pulse" />
          Checking authentication...
        </div>
      </div>
    );
  }

  if (!adminToken) {
    return null;
  }

  return (
    <div className="min-h-screen bg-admin-bg font-admin flex" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Sidebar */}
      <aside className="w-60 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col shrink-0 fixed h-full border-r border-white/5">
        <div className="p-5 border-b border-white/10 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-pink-500/20 rounded-full blur-2xl" />
          <div className="relative flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-lg">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-pink-300 to-rose-200 bg-clip-text text-transparent">Balili</h1>
              <p className="text-[10px] text-gray-400 mt-0.5 tracking-wider uppercase">Admin Panel</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-all duration-200 ${
                  active
                    ? "bg-gradient-to-r from-pink-500/20 to-rose-500/10 text-white border border-pink-400/30 shadow-[0_0_20px_rgba(244,114,182,0.15)]"
                    : "text-gray-400 hover:bg-white/5 hover:text-gray-100 border border-transparent"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-pink-400 to-rose-500 rounded-r-full" />
                )}
                <Icon className={`w-4 h-4 transition-transform duration-200 ${active ? "text-pink-300 scale-110" : ""}`} size={18} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/10 space-y-1">
          <Link href="/" className="flex items-center gap-2 text-xs text-gray-400 hover:text-pink-300 hover:bg-white/5 px-3 py-2 rounded-lg transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Site
          </Link>
          <button
            onClick={() => { adminLogout(); router.push("/admin/login"); }}
            className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-2 rounded-lg transition-colors w-full"
          >
            <LogOut className="w-3.5 h-3.5" /> Log Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 ml-60">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 sticky top-0 z-10">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/admin" className="hover:text-admin-accent transition-colors">Admin</Link>
            {pathname !== "/admin" && (
              <>
                <span className="text-gray-300">/</span>
                <span className="text-gray-800 font-medium capitalize">{pathname.split("/").pop()}</span>
              </>
            )}
          </nav>
        </header>
        <main className="p-6 admin-scroll">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
