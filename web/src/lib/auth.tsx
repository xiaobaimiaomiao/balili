"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "@/types";
import { api } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  adminToken: string | null;
  loading: boolean;
  login: (login: string, password: string) => Promise<boolean>;
  register: (data: { username: string; email: string; password: string; nickname?: string }) => Promise<boolean>;
  logout: () => void;
  adminLogin: (username: string, password: string) => Promise<boolean>;
  adminLogout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("admin_token");
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem("user_token");
    const at = localStorage.getItem("admin_token");
    if (at && !adminToken) setAdminToken(at);
    if (t) {
      setToken(t);
      api.getProfile()
        .then((res: any) => { if (res.data) setUser(res.data); })
        .catch(() => { localStorage.removeItem("user_token"); setToken(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (loginStr: string, password: string) => {
    try {
      const res: any = await api.login({ login: loginStr, password });
      if (res.success && res.data) {
        localStorage.setItem("user_token", res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        return true;
      }
    } catch { /* ignore */ }
    return false;
  };

  const register = async (data: { username: string; email: string; password: string; nickname?: string }) => {
    try {
      const res: any = await api.register(data);
      if (res.success && res.data) {
        localStorage.setItem("user_token", res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        return true;
      }
    } catch { /* ignore */ }
    return false;
  };

  const logout = () => {
    localStorage.removeItem("user_token");
    setToken(null);
    setUser(null);
  };

  const adminLogin = async (username: string, password: string) => {
    try {
      const res: any = await api.admin.login(username, password);
      if (res.success && res.data) {
        localStorage.setItem("admin_token", res.data.token);
        setAdminToken(res.data.token);
        return true;
      }
    } catch { /* ignore */ }
    return false;
  };

  const adminLogout = () => {
    localStorage.removeItem("admin_token");
    setAdminToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, adminToken, loading, login, register, logout, adminLogin, adminLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
