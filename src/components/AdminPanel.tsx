import React, { useState, useEffect } from "react";
import { 
  Lock, 
  Users, 
  TrendingUp, 
  MousePointerClick, 
  Globe, 
  Search, 
  Download, 
  Trash2, 
  LogOut, 
  RefreshCw, 
  ArrowLeft, 
  ShieldAlert,
  Loader2,
  Calendar,
  Eye,
  Check,
  Play
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  countryCode: string;
  timestamp: string;
}

interface Summary {
  totalVisits: number;
  uniqueVisitors: number;
  totalLeads: number;
  totalClicks: number;
  totalVideoClicks: number;
  optInRate: number;
  conversionRate: number;
}

interface CountryStat {
  name: string;
  value: number;
}

interface DailyLead {
  date: string;
  count: number;
}

interface AdminStats {
  summary: Summary;
  leads: Lead[];
  countryStats: CountryStat[];
  dailyLeads: DailyLead[];
  clicks: any[];
}

interface AdminPanelProps {
  onBackToHome: () => void;
}

export default function AdminPanel({ onBackToHome }: AdminPanelProps) {
  // Authentication states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState<string | null>(localStorage.getItem("mz_admin_token"));
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Stats states
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountryFilter, setSelectedCountryFilter] = useState("all");
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Handle Login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setIsLoggingIn(true);
    setLoginError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Échec de l'authentification.");
      }

      localStorage.setItem("mz_admin_token", data.token);
      setToken(data.token);
    } catch (err: any) {
      setLoginError(err.message || "Une erreur est survenue lors de la connexion.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Logout admin
  const handleLogout = () => {
    localStorage.removeItem("mz_admin_token");
    setToken(null);
    setStats(null);
  };

  // Fetch Stats from backend
  const fetchStats = async () => {
    if (!token) return;
    setIsLoadingStats(true);
    setStatsError("");

    try {
      const response = await fetch("/api/admin/stats", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          handleLogout();
          throw new Error("Session expirée. Veuillez vous reconnecter.");
        }
        throw new Error(data.error || "Impossible de récupérer les statistiques.");
      }

      setStats(data);
    } catch (err: any) {
      setStatsError(err.message || "Une erreur de chargement est survenue.");
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Delete lead
  const handleDeleteLead = async (leadId: string) => {
    if (!token || !window.confirm("Êtes-vous sûr de vouloir supprimer définitivement ce prospect ?")) return;
    setIsDeletingId(leadId);

    try {
      const response = await fetch(`/api/admin/leads/${leadId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur de suppression.");
      }

      // Update local state directly to reflect deletion immediately
      if (stats) {
        const updatedLeads = stats.leads.filter(l => l.id !== leadId);
        
        // Recalculate summary locally if needed
        const newTotalLeads = updatedLeads.length;
        const newOptInRate = stats.summary.totalVisits > 0 
          ? Math.round((newTotalLeads / stats.summary.totalVisits) * 100) 
          : 0;
        const newConversionRate = newTotalLeads > 0 
          ? Math.round((stats.summary.totalClicks / newTotalLeads) * 100) 
          : 0;

        setStats({
          ...stats,
          summary: {
            ...stats.summary,
            totalLeads: newTotalLeads,
            optInRate: newOptInRate,
            conversionRate: newConversionRate
          },
          leads: updatedLeads
        });
      }
    } catch (err: any) {
      alert(err.message || "Une erreur est survenue lors de la suppression.");
    } finally {
      setIsDeletingId(null);
    }
  };

  // Fetch stats on login
  useEffect(() => {
    if (token) {
      fetchStats();
    }
  }, [token]);

  // Download leads in CSV format
  const exportToCSV = () => {
    if (!stats || stats.leads.length === 0) return;

    const headers = ["ID", "Nom", "Email", "Téléphone", "Pays", "Date d'Inscription"];
    const rows = stats.leads.map(l => [
      l.id,
      l.name,
      l.email,
      l.phone,
      l.country,
      new Date(l.timestamp).toLocaleString("fr-FR")
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mz_plus_leads_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter leads based on query
  const filteredLeads = stats?.leads.filter(l => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      l.name.toLowerCase().includes(query) ||
      l.email.toLowerCase().includes(query) ||
      l.phone.includes(query) ||
      l.country.toLowerCase().includes(query);

    const matchesCountry = selectedCountryFilter === "all" || l.country === selectedCountryFilter;

    return matchesSearch && matchesCountry;
  }) || [];

  // List of unique countries for filter dropdown
  const uniqueCountriesInLeads = stats 
    ? Array.from(new Set(stats.leads.map(l => l.country)))
    : [];

  // Format date helper
  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return isoString;
    }
  };

  // Login Screen Component
  if (!token) {
    return (
      <div className="min-h-screen bg-[#050505] text-gray-100 flex flex-col justify-center items-center px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 via-transparent to-orange-500/5 pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-zinc-950 border border-amber-500/20 rounded-3xl p-8 shadow-[0_20px_50px_rgba(242,125,38,0.15)] relative overflow-hidden"
        >
          {/* Top glow */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-[#D4AF37] to-[#F27D26] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(242,125,38,0.4)] rotate-45 mb-4">
              <Lock className="w-5 h-5 text-black transform -rotate-45" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white font-display">MZ+ ELITE</h2>
            <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-semibold text-center">
              Espace d'Administration Sécurisé
            </p>
          </div>

          {loginError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-4 py-3 rounded-xl flex items-start gap-2.5 mb-6">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-400 tracking-wider mb-1.5">
                Utilisateur
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-400 tracking-wider mb-1.5">
                Mot de Passe
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F27D26] hover:scale-[1.01] active:scale-[0.99] transition-all text-black font-extrabold py-3.5 px-4 rounded-xl shadow-[0_4px_20px_rgba(242,125,38,0.25)] cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <span>Déverrouiller le Tableau de Bord</span>
              )}
            </button>
          </form>

          <button
            onClick={onBackToHome}
            className="w-full mt-6 text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour au site principal</span>
          </button>
        </motion.div>
      </div>
    );
  }

  // Loading Dashboard Screen
  if (isLoadingStats && !stats) {
    return (
      <div className="min-h-screen bg-[#050505] text-gray-100 flex flex-col justify-center items-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#D4AF37] mb-4" />
        <p className="text-sm text-gray-400 font-medium animate-pulse">
          Chargement du centre de contrôle de la plateforme...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-gray-100 selection:bg-[#D4AF37] selection:text-black">
      {/* Dynamic top glass header */}
      <div className="border-b border-white/5 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#D4AF37] to-[#F27D26] rounded-lg rotate-45 flex items-center justify-center shadow-lg">
              <Lock className="w-4 h-4 text-black transform -rotate-45" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-white font-display">
                MZ+ CONTROL PANEL
              </h1>
              <span className="text-[9px] uppercase tracking-widest text-[#D4AF37] font-semibold block -mt-1">
                Statistiques & Base de Données
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchStats}
              title="Rafraîchir"
              className="p-2 bg-white/[0.02] border border-white/10 rounded-xl hover:bg-white/[0.06] transition-colors cursor-pointer text-gray-300 hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingStats ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onBackToHome}
              className="px-3 py-1.5 bg-white/[0.02] border border-white/10 hover:bg-white/[0.06] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all text-gray-300 hover:text-white cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Voir le Site</span>
            </button>
            <button
              onClick={handleLogout}
              className="p-2 bg-red-500/5 border border-red-500/20 rounded-xl text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Quitter</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {statsError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-2xl flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>{statsError}</span>
          </div>
        )}

        {/* 1. KPIs Cards Section */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Visitors Card */}
            <div className="bg-zinc-950/80 border border-white/5 rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Users className="w-16 h-16 text-[#D4AF37]" />
              </div>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-extrabold">
                Visites Totales
              </p>
              <h3 className="text-3xl font-black text-white font-display mt-2 leading-none">
                {stats.summary.totalVisits}
              </h3>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-2">
                <span className="text-emerald-400 font-bold">
                  {stats.summary.uniqueVisitors}
                </span>
                <span>visiteurs uniques</span>
              </div>
            </div>

            {/* Video Clicks Card */}
            <div className="bg-zinc-950/80 border border-white/5 rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Play className="w-16 h-16 text-cyan-400" />
              </div>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-extrabold">
                Clics Vidéo
              </p>
              <h3 className="text-3xl font-black text-cyan-400 font-display mt-2 leading-none">
                {stats.summary.totalVideoClicks || 0}
              </h3>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-2">
                <span>Taux de lecture :</span>
                <span className="text-cyan-400 font-bold">
                  {stats.summary.totalVisits > 0 ? Math.round(((stats.summary.totalVideoClicks || 0) / stats.summary.totalVisits) * 100) : 0}%
                </span>
              </div>
            </div>

            {/* Leads Card */}
            <div className="bg-zinc-950/80 border border-amber-500/10 rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Users className="w-16 h-16 text-amber-400" />
              </div>
              <p className="text-[10px] uppercase tracking-wider text-amber-500/70 font-extrabold">
                Inscriptions (Leads)
              </p>
              <h3 className="text-3xl font-black text-amber-400 font-display mt-2 leading-none">
                {stats.summary.totalLeads}
              </h3>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-2">
                <span>Taux de conversion :</span>
                <span className="text-amber-400 font-bold">
                  {stats.summary.optInRate}%
                </span>
              </div>
            </div>

            {/* Click Payments Card */}
            <div className="bg-zinc-950/80 border border-white/5 rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <MousePointerClick className="w-16 h-16 text-orange-500" />
              </div>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-extrabold">
                Clics Paiement
              </p>
              <h3 className="text-3xl font-black text-white font-display mt-2 leading-none">
                {stats.summary.totalClicks}
              </h3>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-2">
                <span>Intention d'achat :</span>
                <span className="text-orange-400 font-bold">
                  {stats.summary.conversionRate}%
                </span>
              </div>
            </div>

            {/* Overall Conversion Card */}
            <div className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/20 rounded-2xl p-5 relative overflow-hidden col-span-2 md:col-span-1">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <TrendingUp className="w-16 h-16 text-amber-400" />
              </div>
              <p className="text-[10px] uppercase tracking-wider text-amber-400 font-extrabold">
                Score d'Efficacité
              </p>
              <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 font-display mt-2 leading-none">
                {stats.summary.totalVisits > 0 ? Math.round((stats.summary.totalClicks / stats.summary.totalVisits) * 100) : 0}%
              </h3>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-2">
                <span>Visiteurs à Clic-Paiement</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. Visualizations Grid (Daily signup chart & country breakout) */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Daily Leads Bar Chart */}
            <div className="bg-zinc-950/80 border border-white/5 rounded-2xl p-6 lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold tracking-wide uppercase text-white">
                    Évolution des Inscriptions (14 derniers jours)
                  </h3>
                </div>
              </div>

              {stats.dailyLeads.length === 0 ? (
                <div className="h-48 border border-dashed border-white/5 rounded-xl flex items-center justify-center text-xs text-gray-500">
                  Aucune donnée disponible pour le graphique.
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Custom columns chart */}
                  <div className="h-48 flex items-end justify-between gap-1.5 pt-4">
                    {stats.dailyLeads.map((day, idx) => {
                      // Calculate height percentage safely
                      const maxLeads = Math.max(...stats.dailyLeads.map(d => d.count), 1);
                      const heightPercent = Math.round((day.count / maxLeads) * 100);
                      
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center group relative">
                          {/* Tooltip on hover */}
                          <div className="absolute bottom-full mb-2 bg-zinc-900 border border-amber-500/20 text-[10px] font-mono text-amber-400 px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30">
                            {day.count} lead{day.count > 1 ? 's' : ''}
                          </div>
                          
                          {/* Column Bar */}
                          <div className="w-full bg-white/[0.03] group-hover:bg-white/[0.05] rounded-t-md h-full flex items-end overflow-hidden transition-colors">
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${heightPercent}%` }}
                              transition={{ delay: idx * 0.03, duration: 0.5 }}
                              className="w-full bg-gradient-to-t from-[#F27D26] to-[#D4AF37] rounded-t-md relative"
                            >
                              <div className="absolute inset-x-0 top-0 h-px bg-white/40" />
                            </motion.div>
                          </div>
                          
                          {/* Label (short date) */}
                          <span className="text-[8px] font-semibold text-gray-500 mt-2 block tracking-tight">
                            {day.date.substring(5)} {/* MM-DD */}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Country Breakdown list with progress meters */}
            <div className="bg-zinc-950/80 border border-white/5 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="text-sm font-bold tracking-wide uppercase text-white">
                  Répartition Géographique
                </h3>
              </div>

              {stats.countryStats.length === 0 ? (
                <div className="h-48 border border-dashed border-white/5 rounded-xl flex items-center justify-center text-xs text-gray-500">
                  Aucun lead enregistré pour le moment.
                </div>
              ) : (
                <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
                  {stats.countryStats.map((country, idx) => {
                    const maxCount = stats.summary.totalLeads || 1;
                    const percent = Math.round((country.value / maxCount) * 100);

                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-gray-300">{country.name}</span>
                          <span className="text-gray-500 font-medium">
                            <span className="text-white font-bold">{country.value}</span> ({percent}%)
                          </span>
                        </div>
                        
                        {/* Custom Progress bar */}
                        <div className="w-full h-1.5 bg-white/[0.02] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F27D26] rounded-full" 
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. Leads Database Table View */}
        {stats && (
          <div className="bg-zinc-950/80 border border-white/5 rounded-2xl overflow-hidden space-y-4">
            
            {/* Header / Table Actions */}
            <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold tracking-wide uppercase text-white">
                  Base de Données des Prospects ({filteredLeads.length} trouvés)
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Recherchez, filtrez ou exportez l'intégralité des inscrits au système MZ+.
                </p>
              </div>

              {/* Table Quick Filters */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Nom, email, tel..."
                    className="pl-9 pr-4 py-1.5 bg-white/[0.02] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#D4AF37] w-48 sm:w-56"
                  />
                </div>

                {/* Country Filter dropdown */}
                <select
                  value={selectedCountryFilter}
                  onChange={(e) => setSelectedCountryFilter(e.target.value)}
                  className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="all">Tous les Pays</option>
                  {uniqueCountriesInLeads.map((c, idx) => (
                    <option key={idx} value={c}>{c}</option>
                  ))}
                </select>

                {/* Export button */}
                <button
                  onClick={exportToCSV}
                  disabled={stats.leads.length === 0}
                  className="px-3.5 py-1.5 bg-[#D4AF37] text-black font-extrabold rounded-xl text-xs flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exporter CSV</span>
                </button>
              </div>
            </div>

            {/* Table Container */}
            {filteredLeads.length === 0 ? (
              <div className="py-16 text-center text-xs text-gray-500">
                Aucun résultat correspondant à votre recherche.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-white/[0.01] border-b border-white/5 text-gray-400 font-extrabold uppercase tracking-wider">
                      <th className="py-3.5 px-6">Prospect</th>
                      <th className="py-3.5 px-6">Coordonnées</th>
                      <th className="py-3.5 px-6">Pays</th>
                      <th className="py-3.5 px-6">Date d'Inscription</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredLeads.map((lead) => (
                      <tr 
                        key={lead.id} 
                        className="hover:bg-white/[0.01] transition-colors"
                      >
                        {/* Name and avatar/status */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-tr from-[#D4AF37] to-[#F27D26] rounded-lg text-black font-extrabold text-xs flex items-center justify-center">
                              {lead.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-white text-sm">{lead.name}</p>
                              <span className="text-[10px] font-mono text-gray-500 font-semibold uppercase">{lead.id}</span>
                            </div>
                          </div>
                        </td>

                        {/* Contacts details */}
                        <td className="py-4 px-6 space-y-0.5">
                          <p className="text-gray-300 font-medium select-all">{lead.email}</p>
                          <p className="text-gray-500 font-mono select-all">{lead.phone}</p>
                        </td>

                        {/* Country tag */}
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1.5 bg-white/[0.02] border border-white/5 px-2.5 py-1 rounded-full text-gray-300 font-medium">
                            <span className="text-sm">{lead.countryCode ? lead.countryCode : "🌍"}</span>
                            <span>{lead.country}</span>
                          </span>
                        </td>

                        {/* Registered Date */}
                        <td className="py-4 px-6 text-gray-400 font-medium">
                          {formatDate(lead.timestamp)}
                        </td>

                        {/* Table Actions */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a 
                              href={`https://api.whatsapp.com/send?phone=${lead.phone.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Contacter sur WhatsApp"
                              className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors cursor-pointer"
                            >
                              <span className="text-xs font-bold block px-1">💬</span>
                            </a>
                            <button
                              onClick={() => handleDeleteLead(lead.id)}
                              disabled={isDeletingId === lead.id}
                              title="Supprimer définitivement"
                              className="p-1.5 bg-red-500/5 border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/40 rounded-lg transition-colors cursor-pointer"
                            >
                              {isDeletingId === lead.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
