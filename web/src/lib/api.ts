const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("user_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function getAdminHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const authHeaders = getAuthHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...authHeaders, ...options?.headers },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function fetchAdminApi<T>(path: string, options?: RequestInit): Promise<T> {
  const adminHeaders = getAdminHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...adminHeaders, ...options?.headers },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  // Videos
  getVideos: (params?: Record<string, string | number>) => {
    const qs = params ? "?" + new URLSearchParams(
      Object.entries(params).reduce((acc, [k, v]) => {
        if (v !== undefined && v !== "") acc[k] = String(v);
        return acc;
      }, {} as Record<string, string>)
    ).toString() : "";
    return fetchApi(`/videos${qs}`);
  },
  getVideo: (id: string | number) => fetchApi(`/videos/${id}`),
  getRandomVideos: (count = 12) => fetchApi(`/videos/random?count=${count}`),
  getPopularVideos: (count = 20) => fetchApi(`/videos/popular?count=${count}`),
  searchVideos: (params: Record<string, string | number>) => {
    const qs = "?" + new URLSearchParams(
      Object.entries(params).reduce((acc, [k, v]) => {
        if (v !== undefined && v !== "") acc[k] = String(v);
        return acc;
      }, {} as Record<string, string>)
    ).toString();
    return fetchApi(`/search${qs}`);
  },

  // Categories
  getCategories: () => fetchApi("/categories"),

  // Tags
  getTags: (limit = 500) => fetchApi(`/tags?limit=${limit}`),

  // Countries
  getCountries: () => fetchApi("/countries"),

  // Stats
  getOverview: () => fetchApi("/stats/overview"),

  // Interactions
  incrementView: (id: number) => fetchApi(`/videos/${id}/view`, { method: "POST" }),
  toggleLike: (id: number) => fetchApi(`/videos/${id}/like`, { method: "POST" }),
  vote: (id: number, isUp: boolean) => fetchApi(`/videos/${id}/vote`, { method: "POST", body: JSON.stringify({ isUp }) }),
  getVoteStatus: (id: number) => fetchApi(`/videos/${id}/vote`),
  getTrendingLikes: (count = 8) => fetchApi(`/videos/trending?count=${count}`),
  getComments: (id: number, page = 1, limit = 20) => fetchApi(`/videos/${id}/comments?page=${page}&limit=${limit}`),
  createComment: (id: number, data: { content: string }) =>
    fetchApi(`/videos/${id}/comments`, { method: "POST", body: JSON.stringify(data) }),

  // User auth
  register: (data: { username: string; email: string; password: string; nickname?: string }) =>
    fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => r.json()),
  login: (data: { login: string; password: string }) =>
    fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => r.json()),
  getProfile: () => fetchApi("/auth/profile"),
  getUserVideos: (username: string, params?: Record<string, string | number>) => {
    const qs = params ? "?" + new URLSearchParams(
      Object.entries(params).reduce((acc, [k, v]) => {
        if (v !== undefined && v !== "") acc[k] = String(v);
        return acc;
      }, {} as Record<string, string>)
    ).toString() : "";
    return fetchApi(`/users/${username}/videos${qs}`);
  },
  uploadVideo: async (formData: FormData) => {
    const authHeaders = getAuthHeaders();
    const res = await fetch(`${API_BASE}/videos/upload`, {
      method: "POST",
      headers: { ...authHeaders },
      body: formData,
    });
    return res.json();
  },

  // Admin (uses admin token)
  admin: {
    login: (username: string, password: string) =>
      fetch(`${API_BASE}/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      }).then((r) => r.json()),
    getDashboard: () => fetchAdminApi("/admin/dashboard"),
    getCharts: () => fetchAdminApi("/admin/stats/charts"),
    getViewsByGranularity: (granularity: string) => fetchAdminApi(`/admin/stats/views?granularity=${granularity}`),
    getVideos: (params?: Record<string, string | number>) => {
      const qs = params ? "?" + new URLSearchParams(
        Object.entries(params).reduce((acc, [k, v]) => {
          if (v !== undefined && v !== "") acc[k] = String(v);
          return acc;
        }, {} as Record<string, string>)
      ).toString() : "";
      return fetchAdminApi(`/admin/videos${qs}`);
    },
    getVideo: (id: number) => fetchAdminApi(`/admin/videos/${id}`),
    createVideo: (data: unknown) => fetchAdminApi("/admin/videos", { method: "POST", body: JSON.stringify(data) }),
    updateVideo: (id: number, data: unknown) => fetchAdminApi(`/admin/videos/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    deleteVideo: (id: number) => fetchAdminApi(`/admin/videos/${id}`, { method: "DELETE" }),
    getCategories: () => fetchAdminApi("/admin/categories"),
    createCategory: (data: unknown) => fetchAdminApi("/admin/categories", { method: "POST", body: JSON.stringify(data) }),
    updateCategory: (id: number, data: unknown) => fetchAdminApi(`/admin/categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    deleteCategory: (id: number) => fetchAdminApi(`/admin/categories/${id}`, { method: "DELETE" }),
    getTags: (limit = 1000) => fetchAdminApi(`/admin/tags?limit=${limit}`),
    createTag: (data: unknown) => fetchAdminApi("/admin/tags", { method: "POST", body: JSON.stringify(data) }),
    updateTag: (id: number, data: unknown) => fetchAdminApi(`/admin/tags/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    deleteTag: (id: number) => fetchAdminApi(`/admin/tags/${id}`, { method: "DELETE" }),
    getCountries: () => fetchAdminApi("/admin/countries"),
    createCountry: (data: unknown) => fetchAdminApi("/admin/countries", { method: "POST", body: JSON.stringify(data) }),
    updateCountry: (id: number, data: unknown) => fetchAdminApi(`/admin/countries/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    deleteCountry: (id: number) => fetchAdminApi(`/admin/countries/${id}`, { method: "DELETE" }),
    deleteComment: (id: number) => fetchAdminApi(`/admin/comments/${id}`, { method: "DELETE" }),
    getUsers: (params?: Record<string, string | number>) => {
      const qs = params ? "?" + new URLSearchParams(
        Object.entries(params).reduce((acc, [k, v]) => {
          if (v !== undefined && v !== "") acc[k] = String(v);
          return acc;
        }, {} as Record<string, string>)
      ).toString() : "";
      return fetchAdminApi(`/admin/users${qs}`);
    },
    getUser: (id: number) => fetchAdminApi(`/admin/users/${id}`),
    updateUser: (id: number, data: unknown) => fetchAdminApi(`/admin/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    deleteUser: (id: number) => fetchAdminApi(`/admin/users/${id}`, { method: "DELETE" }),
  },
};
