import React, { useState, useEffect, useMemo } from "react";
import {
  Film, Tv, Calendar, Trash2, Repeat, Search, Plus, X, Pencil,
  Filter, BarChart3, PlayCircle, CheckCircle2, XCircle, ChevronDown
} from "lucide-react";

// REPLACE WITH YOUR IP ADDRESS
const API_URL = "http://192.168.1.5:3001/api";

const RATINGS = {
  SKIP: {
    label: "SKIP",
    badge: "text-red-400 border-red-900/50 bg-red-900/20",
    text: "text-red-400"
  },
  TIMEPASS: {
    label: "TIMEPASS",
    badge: "text-stone-400 border-stone-700 bg-stone-800",
    text: "text-stone-400"
  },
  GO_FOR_IT: {
    label: "GO FOR IT",
    badge: "text-blue-400 border-blue-900/50 bg-blue-900/20",
    text: "text-blue-400"
  },
  LISAN_AL_GAIB: {
    label: "LISAN AL GAIB",
    badge: "text-amber-400 border-amber-900/50 bg-amber-900/20",
    text: "text-amber-400"
  },
};

const STATUS_CONFIG = {
  WATCHING: { label: "Watching", icon: PlayCircle, color: "text-emerald-400" },
  COMPLETED: { label: "Completed", icon: CheckCircle2, color: "text-stone-400" },
  DROPPED: { label: "Dropped", icon: XCircle, color: "text-red-400" },
};

export default function App() {
  const [logs, setLogs] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("ALL");
  const [dateRange, setDateRange] = useState("ALL");
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);

  const [filters, setFilters] = useState({
    year: "ALL",
    type: "ALL",
    rating: "ALL",
    status: "ALL"
  });

  const [formData, setFormData] = useState(initialFormState());

  function initialFormState() {
    return {
      title: "", type: "MOVIE", release_year: "", rating: "GO_FOR_IT",
      status: "COMPLETED", date_watched: new Date().toISOString().split("T")[0],
      is_rewatch: false, season: "", episode: "", total_episodes: "", notes: "",
    };
  }

  // --- DATA FETCHING ---
  const fetchLogs = async (query = "") => {
    const endpoint = query ? `/search?q=${query}` : "/logs";
    try {
      const res = await fetch(`${API_URL}${endpoint}`);
      const data = await res.json();
      setLogs(data);
    } catch (error) {
      console.error("Failed to fetch logs", error);
    }
  };

  useEffect(() => { fetchLogs(search); }, [search]);

  // --- FILTERING LOGIC ---
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const d = new Date(log.date_watched);
      const now = new Date();
      if (dateRange === 'THIS_MONTH') {
        if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
      } else if (dateRange === 'LAST_MONTH') {
        const lastMonth = new Date();
        lastMonth.setMonth(now.getMonth() - 1);
        if (d.getMonth() !== lastMonth.getMonth() || d.getFullYear() !== lastMonth.getFullYear()) return false;
      }

      if (viewMode === 'ONGOING' && log.status !== 'WATCHING') return false;
      if (filters.year !== "ALL" && String(log.release_year) !== filters.year) return false;
      if (filters.type !== "ALL" && log.type !== filters.type) return false;
      if (filters.rating !== "ALL" && log.rating !== filters.rating) return false;
      if (filters.status !== "ALL" && (log.status || 'COMPLETED') !== filters.status) return false;

      return true;
    });
  }, [logs, filters, viewMode, dateRange]);

  // --- INSIGHTS ---
  const insights = useMemo(() => {
    return {
      total: filteredLogs.length,
      movies: filteredLogs.filter(l => l.type === 'MOVIE').length,
      series: filteredLogs.filter(l => l.type === 'SERIES').length
    };
  }, [filteredLogs]);

  const availableYears = [...new Set(logs.map(l => l.release_year).filter(Boolean))].sort((a, b) => b - a);

  // --- HANDLERS ---
  const resetForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData(initialFormState());
  };

  const handleEdit = (log) => {
    setEditingId(log.id);
    setFormData({
      title: log.title, type: log.type, release_year: log.release_year || '',
      rating: log.rating, status: log.status || 'COMPLETED',
      date_watched: log.date_watched, is_rewatch: !!log.is_rewatch,
      season: log.season || '', episode: log.episode || '',
      total_episodes: log.total_episodes || '', notes: log.notes || ''
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Forget this memory?")) return;
    try {
      await fetch(`${API_URL}/logs/${id}`, { method: 'DELETE' });
      fetchLogs();
    } catch (error) { alert("Network Error"); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let finalStatus = formData.status;
    const ep = parseInt(formData.episode) || 0;
    const total = parseInt(formData.total_episodes) || 0;

    if (formData.status !== 'DROPPED') {
      if (total > 0 && ep < total) finalStatus = 'WATCHING';
      else if (total > 0 && ep === total) finalStatus = 'COMPLETED';
    }

    const payload = { ...formData, status: finalStatus };
    const url = editingId ? `${API_URL}/logs/${editingId}` : `${API_URL}/logs`;
    const method = editingId ? "PUT" : "POST";
    try {
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      resetForm();
      fetchLogs();
    } catch (error) { alert("Error saving"); }
  };

  const getProgress = (log) => {
    if (!log.total_episodes || !log.episode) return 0;
    return Math.min(100, Math.round((log.episode / log.total_episodes) * 100));
  };

  const getDateRangeLabel = () => {
    if (dateRange === 'ALL') return 'All Time';
    if (dateRange === 'THIS_MONTH') return 'This Month';
    if (dateRange === 'LAST_MONTH') return 'Last Month';
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto pb-20">

      {/* HEADER WITH INSIGHTS */}
      <header className="mb-6 md:mb-8">
        <div className="flex items-center gap-4 mb-6">
          {/* AVATAR */}
          <div className="w-14 h-14 md:w-16 md:h-16 shrink-0 rounded-full border-2 border-stone-700 shadow-md overflow-hidden bg-stone-800 flex items-center justify-center">
            <img
              src="/avatar.jpg"
              alt="Profile"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerText = 'U';
                e.target.parentElement.className += " text-2xl font-bold text-stone-500";
              }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-stone-100 truncate">Watch Logs</h1>

            {/* INSIGHTS BAR - WRAPPED FOR MOBILE */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs md:text-sm text-stone-400 mt-1">
              <div className="relative">
                <button
                  onClick={() => setIsDateMenuOpen(!isDateMenuOpen)}
                  className="flex items-center gap-1 font-bold text-stone-300 hover:text-white transition-colors"
                >
                  <BarChart3 className="w-3 h-3 md:w-4 md:h-4" /> {getDateRangeLabel()} <ChevronDown className="w-3 h-3" />
                </button>

                {isDateMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsDateMenuOpen(false)}></div>
                    <div className="absolute top-full left-0 mt-1 w-32 bg-stone-800 border border-stone-700 rounded-lg shadow-xl overflow-hidden z-20">
                      <button onClick={() => { setDateRange('ALL'); setIsDateMenuOpen(false) }} className="w-full text-left px-3 py-2 hover:bg-stone-700 text-stone-300 text-xs">All Time</button>
                      <button onClick={() => { setDateRange('THIS_MONTH'); setIsDateMenuOpen(false) }} className="w-full text-left px-3 py-2 hover:bg-stone-700 text-stone-300 text-xs">This Month</button>
                      <button onClick={() => { setDateRange('LAST_MONTH'); setIsDateMenuOpen(false) }} className="w-full text-left px-3 py-2 hover:bg-stone-700 text-stone-300 text-xs">Last Month</button>
                    </div>
                  </>
                )}
              </div>

              <span className="w-px h-3 bg-stone-700 hidden md:block"></span>
              <div className="flex gap-3">
                <span className="text-white font-bold">{insights.total} Total</span>
                <span className="hidden md:inline w-1 h-1 bg-stone-600 rounded-full my-auto"></span>
                <span>{insights.movies} Movies</span>
                <span className="hidden md:inline w-1 h-1 bg-stone-600 rounded-full my-auto"></span>
                <span>{insights.series} Series</span>
              </div>
            </div>
          </div>
        </div>

        {/* CONTROLS ROW - OPTIMIZED FOR PHONE */}
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex bg-surface p-1 rounded-lg border border-stone-700 w-full md:w-auto">
            <button onClick={() => setViewMode("ALL")} className={`flex-1 md:flex-none px-6 py-2 md:py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'ALL' ? 'bg-stone-600 text-white shadow' : 'text-stone-400 hover:text-stone-200'}`}>All Memories</button>
            <button onClick={() => setViewMode("ONGOING")} className={`flex-1 md:flex-none px-6 py-2 md:py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'ONGOING' ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-900/50 shadow' : 'text-stone-400 hover:text-stone-200'}`}>Ongoing</button>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-500" />
              <input type="text" placeholder="Search title..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-surface text-stone-200 text-sm rounded-lg pl-9 pr-4 py-2 border border-stone-700 focus:outline-none focus:border-stone-500 h-10" />
            </div>

            <button onClick={() => { resetForm(); setIsFormOpen(true); }}
              className="bg-stone-100 hover:bg-white text-stone-900 rounded-lg px-4 py-2 text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-stone-900/50 whitespace-nowrap h-10">
              <Plus className="w-4 h-4" /> <span className="hidden md:inline">Log Entry</span> <span className="md:hidden">Log</span>
            </button>
          </div>
        </div>

        {/* FILTERS */}
        {viewMode === 'ALL' && (
          <div className="flex flex-wrap gap-2 mt-4 items-center">
            <Filter className="w-4 h-4 text-stone-500 mr-1" />
            <select className="bg-surface border border-stone-700 text-stone-300 text-xs rounded px-2 py-1.5 outline-none" value={filters.year} onChange={e => setFilters({ ...filters, year: e.target.value })}>
              <option value="ALL">All Years</option>
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select className="bg-surface border border-stone-700 text-stone-300 text-xs rounded px-2 py-1.5 outline-none" value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })}>
              <option value="ALL">All Types</option>
              <option value="MOVIE">Movies</option>
              <option value="SERIES">Series</option>
            </select>
            <select className="bg-surface border border-stone-700 text-stone-300 text-xs rounded px-2 py-1.5 outline-none" value={filters.rating} onChange={e => setFilters({ ...filters, rating: e.target.value })}>
              <option value="ALL">All Ratings</option>
              {Object.keys(RATINGS).map(k => <option key={k} value={k}>{RATINGS[k].label}</option>)}
            </select>
            <select className="bg-surface border border-stone-700 text-stone-300 text-xs rounded px-2 py-1.5 outline-none" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
              <option value="ALL">All Status</option>
              <option value="WATCHING">Watching</option>
              <option value="COMPLETED">Completed</option>
              <option value="DROPPED">Dropped</option>
            </select>
            {(filters.year !== 'ALL' || filters.type !== 'ALL' || filters.rating !== 'ALL' || filters.status !== 'ALL') && (
              <button onClick={() => setFilters({ year: 'ALL', type: 'ALL', rating: 'ALL', status: 'ALL' })} className="text-xs text-stone-500 hover:text-white ml-2 underline">Clear</button>
            )}
          </div>
        )}
      </header>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLogs.map(log => {
          const StatusIcon = STATUS_CONFIG[log.status || 'COMPLETED'].icon;
          const progress = getProgress(log);
          const ratingColor = RATINGS[log.rating].text;

          return (
            <article key={log.id} className="bg-surface rounded-xl border border-stone-700/50 p-5 shadow-lg group hover:border-stone-600 transition-all relative overflow-hidden">
              {log.status === 'WATCHING' && log.type === 'SERIES' && (
                <div className="absolute top-0 left-0 h-1 bg-emerald-500/20 w-full">
                  <div className="h-full bg-emerald-500" style={{ width: `${progress}%` }}></div>
                </div>
              )}
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${RATINGS[log.rating].badge}`}>
                    {RATINGS[log.rating].label}
                  </span>
                  <span className={`text-[10px] flex items-center gap-1 ${STATUS_CONFIG[log.status || 'COMPLETED'].color}`}>
                    <StatusIcon className="w-3 h-3" /> {STATUS_CONFIG[log.status || 'COMPLETED'].label}
                  </span>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(log)} className="text-stone-600 hover:text-stone-300"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(log.id)} className="text-stone-600 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <h3 className={`text-lg font-bold leading-tight mb-2 truncate pr-4 ${ratingColor}`}>
                {log.title}
              </h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-400 mb-4 font-medium">
                <span className="flex items-center gap-1 uppercase tracking-wider">
                  {log.type === 'MOVIE' ? <Film className="w-3 h-3" /> : <Tv className="w-3 h-3" />} {log.type}
                </span>
                {log.release_year && <span>{log.release_year}</span>}
                <span className="flex items-center gap-1 text-stone-500">
                  <Calendar className="w-3 h-3" /> {log.date_watched}
                </span>
              </div>
              {log.type === 'SERIES' && (log.season || log.episode) && (
                <div className="flex items-center justify-between text-xs text-stone-300 bg-stone-900/50 rounded px-2 py-1.5 mb-3 border border-stone-800">
                  <span>{log.season ? `S${log.season}` : ''} {log.season && log.episode ? ' • ' : ''}{log.episode ? `E${log.episode}` : ''}</span>
                  {log.total_episodes && log.status === 'WATCHING' && (<span className="text-emerald-500 font-mono">{progress}%</span>)}
                </div>
              )}
              {log.notes && (<p className="text-sm text-stone-400 line-clamp-3 leading-relaxed">{log.notes}</p>)}
            </article>
          )
        })}
      </div>

      {filteredLogs.length === 0 && (
        <div className="text-center py-20 text-stone-600">
          <p>No matching memories found.</p>
        </div>
      )}

      {/* MODAL FORM */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-stone-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">{editingId ? 'Edit Entry' : 'New Entry'}</h2>
              <button onClick={resetForm} className="text-stone-500 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-3">
                  <label className="text-xs text-stone-400 block mb-1">Title</label>
                  <input required className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2.5 text-white focus:border-stone-500 outline-none" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-stone-400 block mb-1">Year</label>
                  <input type="number" className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2.5 text-white focus:border-stone-500 outline-none" value={formData.release_year} onChange={e => setFormData({ ...formData, release_year: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-stone-400 block mb-1">Type</label>
                  <select className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2.5 text-white outline-none" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                    <option value="MOVIE">Movie</option>
                    <option value="SERIES">TV Series</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-stone-400 block mb-1">Status</label>
                  <select className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2.5 text-white outline-none" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                    <option value="WATCHING">Watching</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="DROPPED">Dropped</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-stone-400 block mb-1">Rating</label>
                  <select className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2.5 text-white outline-none" value={formData.rating} onChange={e => setFormData({ ...formData, rating: e.target.value })}>
                    {Object.keys(RATINGS).map(k => <option key={k} value={k}>{RATINGS[k].label}</option>)}
                  </select>
                </div>
              </div>
              {formData.type === 'SERIES' && (
                <div className="grid grid-cols-3 gap-4 bg-stone-900/50 p-3 rounded-lg border border-stone-800">
                  <div>
                    <label className="text-xs text-stone-500 block mb-1">Season</label>
                    <input type="number" className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-white outline-none" value={formData.season} onChange={e => setFormData({ ...formData, season: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-stone-500 block mb-1">Ep Watched</label>
                    <input type="number" className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-white outline-none" value={formData.episode} onChange={e => setFormData({ ...formData, episode: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-stone-500 block mb-1">Total Eps</label>
                    <input type="number" className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-white outline-none" placeholder="?" value={formData.total_episodes} onChange={e => setFormData({ ...formData, total_episodes: e.target.value })} />
                  </div>
                </div>
              )}
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <label className="text-xs text-stone-400 block mb-1">Last Watched</label>
                  <input type="date" required className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2.5 text-white outline-none [color-scheme:dark]" value={formData.date_watched} onChange={e => setFormData({ ...formData, date_watched: e.target.value })} />
                </div>
                <div className="flex items-center gap-2 mt-5">
                  <input type="checkbox" id="rewatch" className="w-4 h-4 accent-amber-500" checked={formData.is_rewatch} onChange={e => setFormData({ ...formData, is_rewatch: e.target.checked })} />
                  <label htmlFor="rewatch" className="text-sm text-stone-300">Rewatch?</label>
                </div>
              </div>
              <div>
                <label className="text-xs text-stone-400 block mb-1">Notes</label>
                <textarea rows="3" className="w-full bg-stone-900 border border-stone-700 rounded-lg p-3 text-white focus:border-stone-500 outline-none" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}></textarea>
              </div>
              <button type="submit" className="w-full bg-stone-100 hover:bg-white text-stone-900 font-bold py-3 rounded-lg transition-colors mt-2">{editingId ? 'Update Memory' : 'Save Memory'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}