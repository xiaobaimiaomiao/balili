"use client";

import { useEffect, useState } from "react";
import { Country } from "@/types";
import { api } from "@/lib/api";
import { Plus, Trash2, Edit3, Globe, Sparkles, Search } from "lucide-react";
import CuteModal from "@/components/CuteModal";

export default function AdminCountriesPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [editCountry, setEditCountry] = useState<Country | null>(null);
  const [editName, setEditName] = useState("");
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadCountries = () => {
    setLoading(true);
    api.admin.getCountries()
      .then((res: any) => setCountries(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadCountries(); }, []);

  const handleAdd = async () => {
    if (!newName.trim() || submitting) return;
    setSubmitting(true);
    try {
      await api.admin.createCountry({ name: newName.trim() });
      setNewName("");
      setShowAdd(false);
      loadCountries();
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const handleEdit = (c: Country) => {
    setEditCountry(c);
    setEditName(c.name);
  };

  const handleSave = async () => {
    if (!editCountry || submitting) return;
    setSubmitting(true);
    try {
      await api.admin.updateCountry(editCountry.id, { name: editName });
      setEditCountry(null);
      loadCountries();
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this country?")) return;
    try {
      await api.admin.deleteCountry(id);
      loadCountries();
    } catch (e) { console.error(e); }
  };

  const filtered = countries.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-100 via-rose-50 to-fuchsia-100 border-2 border-pink-200 p-6">
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-pink-300/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-fuchsia-300/30 rounded-full blur-3xl" />
        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-lg">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent flex items-center gap-2">
                Countries <Sparkles className="w-5 h-5 text-pink-400" />
              </h1>
              <p className="text-sm text-pink-700/70 mt-0.5">
                {countries.length} countries · {filtered.length} shown
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="group relative px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl text-sm font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
            New Country
          </button>
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search countries..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/80 backdrop-blur border-2 border-pink-200 rounded-2xl text-sm focus:outline-none focus:border-pink-400 focus:bg-white transition-all"
          />
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur rounded-3xl border-2 border-pink-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-10 text-center">
            <div className="inline-flex items-center gap-2 text-pink-400">
              <Sparkles className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading countries...</span>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-gray-400">
            <div className="text-5xl mb-3">🌍</div>
            <p className="text-sm">No countries found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
            {filtered.map((c, i) => (
              <div
                key={c.id}
                className="group relative bg-gradient-to-br from-white to-pink-50/50 hover:from-pink-50 hover:to-rose-50 border-2 border-pink-100 hover:border-pink-300 rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md item-enter"
                style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{c.name}</p>
                    <div className="mt-2">
                      <span className="px-2 py-0.5 bg-pink-100 text-pink-600 rounded-full text-xs font-medium">
                        {c.videoCount.toLocaleString()} videos
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(c)}
                      className="p-1.5 text-gray-400 hover:text-pink-500 hover:bg-pink-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CuteModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Create New Country"
        icon="🌍"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-pink-600 mb-1.5 block">Country Name</label>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="w-full px-4 py-2.5 bg-pink-50/50 border-2 border-pink-200 rounded-2xl text-sm focus:outline-none focus:border-pink-400 focus:bg-white transition-all"
              placeholder="e.g. Japan, China, Korea"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button
              onClick={() => setShowAdd(false)}
              className="px-5 py-2.5 border-2 border-pink-200 rounded-2xl text-sm font-medium text-gray-600 hover:bg-pink-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={submitting || !newName.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl text-sm font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" /> {submitting ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      </CuteModal>

      <CuteModal
        open={!!editCountry}
        onClose={() => setEditCountry(null)}
        title="Edit Country"
        icon="✏️"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-pink-600 mb-1.5 block">Country Name</label>
            <input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              className="w-full px-4 py-2.5 bg-pink-50/50 border-2 border-pink-200 rounded-2xl text-sm focus:outline-none focus:border-pink-400 focus:bg-white transition-all"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button
              onClick={() => setEditCountry(null)}
              className="px-5 py-2.5 border-2 border-pink-200 rounded-2xl text-sm font-medium text-gray-600 hover:bg-pink-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={submitting || !editName.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl text-sm font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Edit3 className="w-4 h-4" /> {submitting ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </CuteModal>
    </div>
  );
}
