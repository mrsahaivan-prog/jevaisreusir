import React, { useState, useEffect } from "react";
import { apiClient } from "../lib/apiClient";
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
  Play,
  Smartphone,
  Link2
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
  videoPlays: number;
  averageVideoProgress: number;
  averageTimeOnPage: number;
  optInRate: number;
  conversionRate: number;
  activeToday: number;
  activeThisWeek: number;
  activeThisMonth: number;
  visitToPlayRate: number;
  playToCtaRate: number;
  clicksToday?: number;
  registrationRedirectRate?: number;
  redirectedUniqueCount?: number;
}

interface CountryStat {
  name: string;
  value: number;
}

interface ReferrerStat {
  name: string;
  value: number;
}

interface DeviceStat {
  name: string;
  value: number;
}

interface DailyLead {
  date: string;
  count: number;
  visits: number;
}

interface WeekdayStat {
  day: string;
  rate: number;
  leads: number;
  visits: number;
}

interface AdminStats {
  summary: Summary;
  leads: Lead[];
  recentVisits: any[];
  countryStats: CountryStat[];
  referrerStats: ReferrerStat[];
  deviceStats: DeviceStat[];
  dailyLeads: DailyLead[];
  weekdayStats: WeekdayStat[];
  ctaPerf: any;
  clicks: any[];
  source: string;
  dailyClicks?: Array<{ date: string; count: number }>;
  clicksToday?: number;
  ctaBreakdown?: {
    watchVideoClicks: number;
    directCheckoutClicks: number;
    formSubmissions: number;
    modalCheckoutClicks: number;
  };
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
      const data = await apiClient.adminLogin(username, password);
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

  // Fetch Stats from backend or direct Supabase
  const fetchStats = async () => {
    if (!token) return;
    setIsLoadingStats(true);
    setStatsError("");

    try {
      const data = await apiClient.fetchAdminStats(token);
      setStats(data);
    } catch (err: any) {
      if (err.message && (err.message.includes("401") || err.message.includes("expirée") || err.message.includes("token"))) {
        handleLogout();
        setStatsError("Session expirée. Veuillez vous reconnecter.");
      } else {
        setStatsError(err.message || "Une erreur de chargement est survenue.");
      }
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Delete lead
  const handleDeleteLead = async (leadId: string) => {
    if (!token || !window.confirm("Êtes-vous sûr de vouloir supprimer définitivement ce prospect ?")) return;
    setIsDeletingId(leadId);

    try {
      const data = await apiClient.deleteLead(leadId, token);
      if (data.error) {
        throw new Error(data.error);
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
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Audience & Temps Moyen Card */}
              <div className="bg-zinc-950/80 border border-white/5 rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Users className="w-16 h-16 text-[#D4AF37]" />
                </div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-extrabold">
                  Visites & Audience
                </p>
                <h3 className="text-3xl font-black text-white font-display mt-2 leading-none">
                  {stats.summary.totalVisits}
                </h3>
                <div className="flex flex-col gap-1 text-[10px] text-gray-400 mt-3 border-t border-white/5 pt-2">
                  <div className="flex items-center justify-between">
                    <span>Uniques:</span>
                    <span className="text-emerald-400 font-bold">{stats.summary.uniqueVisitors}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Temps moyen:</span>
                    <span className="text-amber-400 font-mono font-bold">{Math.round(stats.summary.averageTimeOnPage || 0)}s</span>
                  </div>
                </div>
              </div>

              {/* Engagement Vidéo Card */}
              <div className="bg-zinc-950/80 border border-white/5 rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Play className="w-16 h-16 text-cyan-400" />
                </div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-extrabold">
                  Lectures Vidéo
                </p>
                <h3 className="text-3xl font-black text-cyan-400 font-display mt-2 leading-none">
                  {stats.summary.videoPlays || 0}
                </h3>
                <div className="flex flex-col gap-1 text-[10px] text-gray-400 mt-3 border-t border-white/5 pt-2">
                  <div className="flex items-center justify-between">
                    <span>Visionnage moy:</span>
                    <span className="text-cyan-400 font-bold">{Math.round(stats.summary.averageVideoProgress || 0)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Clics Bouton:</span>
                    <span className="text-gray-300 font-bold">{stats.summary.totalVideoClicks || 0}</span>
                  </div>
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
                <div className="flex flex-col gap-1 text-[10px] text-gray-400 mt-3 border-t border-amber-500/10 pt-2">
                  <div className="flex items-center justify-between">
                    <span>Taux de conversion:</span>
                    <span className="text-amber-400 font-bold">{stats.summary.optInRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Aujourd'hui:</span>
                    <span className="text-gray-300 font-bold">{stats.dailyLeads?.[stats.dailyLeads.length - 1]?.count || 0}</span>
                  </div>
                </div>
              </div>

              {/* Click Payments Card */}
              <div className="bg-zinc-950/80 border border-white/5 rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <MousePointerClick className="w-16 h-16 text-orange-500" />
                </div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-extrabold">
                  Intention d'Achat
                </p>
                <h3 className="text-3xl font-black text-orange-400 font-display mt-2 leading-none">
                  {stats.summary.totalClicks}
                </h3>
                <div className="flex flex-col gap-1 text-[10px] text-gray-400 mt-3 border-t border-white/5 pt-2">
                  <div className="flex items-center justify-between">
                    <span>Visiteurs à clics:</span>
                    <span className="text-orange-400 font-bold">{stats.summary.conversionRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Source Directe:</span>
                    <span className="text-gray-300 font-bold">{stats.ctaPerf?.direct_checkout_cta || 0}</span>
                  </div>
                </div>
              </div>

              {/* Active Users/Trafic Card */}
              <div className="bg-gradient-to-br from-[#F27D26]/5 to-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-2xl p-5 relative overflow-hidden col-span-2 md:col-span-1">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <TrendingUp className="w-16 h-16 text-amber-400" />
                </div>
                <p className="text-[10px] uppercase tracking-wider text-amber-400 font-extrabold">
                  Trafic Actif (Uniques)
                </p>
                <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 font-display mt-2 leading-none">
                  {stats.summary.activeToday || 0}
                </h3>
                <div className="flex flex-col gap-1 text-[10px] text-gray-400 mt-3 border-t border-amber-500/20 pt-2">
                  <div className="flex items-center justify-between">
                    <span>Cette semaine:</span>
                    <span className="text-white font-bold">{stats.summary.activeThisWeek || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Ce mois:</span>
                    <span className="text-white font-bold">{stats.summary.activeThisMonth || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CRO Conversion Funnel */}
            <div className="bg-zinc-950/80 border border-white/5 rounded-2xl p-5">
              <h3 className="text-xs uppercase tracking-wider text-gray-400 font-extrabold mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
                Entonnoir de Conversion Premium (CRO Funnel)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5 relative">
                  <span className="absolute -top-2 -left-2 bg-zinc-800 text-gray-400 text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">1</span>
                  <p className="text-[10px] uppercase text-gray-500 font-bold">Visite → Lecture Vidéo</p>
                  <p className="text-xl font-black text-cyan-400 mt-1">{stats.summary.visitToPlayRate}%</p>
                  <div className="w-full bg-white/5 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-cyan-600 to-cyan-400 h-full" style={{ width: `${stats.summary.visitToPlayRate}%` }} />
                  </div>
                </div>
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5 relative">
                  <span className="absolute -top-2 -left-2 bg-zinc-800 text-gray-400 text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">2</span>
                  <p className="text-[10px] uppercase text-gray-500 font-bold">Lecture → Clic CTA "Rejoindre"</p>
                  <p className="text-xl font-black text-orange-400 mt-1">{stats.summary.playToCtaRate}%</p>
                  <div className="w-full bg-white/5 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-600 to-orange-400 h-full" style={{ width: `${stats.summary.playToCtaRate}%` }} />
                  </div>
                </div>
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5 relative">
                  <span className="absolute -top-2 -left-2 bg-zinc-800 text-gray-400 text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">3</span>
                  <p className="text-[10px] uppercase text-gray-500 font-bold">Visite → Inscription validée</p>
                  <p className="text-xl font-black text-emerald-400 mt-1">{stats.summary.optInRate}%</p>
                  <div className="w-full bg-white/5 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full" style={{ width: `${stats.summary.optInRate}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Suivi Avancé des Clics & Taux de Redirection */}
            <div className="bg-zinc-950/80 border border-white/5 rounded-2xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-sm font-bold tracking-wide uppercase text-white flex items-center gap-2">
                    <MousePointerClick className="w-4 h-4 text-amber-400" />
                    Analyses des Clics CTA & Taux d'Inscription
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Statistiques de conversion en temps réel basées sur les actions des visiteurs.
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
                  <span className="w-2 h-2 bg-amber-400 rounded-full animate-ping" />
                  <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                    Clics Aujourd'hui : {stats.clicksToday ?? stats.summary.clicksToday ?? 0}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left side: Specific CTA counters */}
                <div className="lg:col-span-2 space-y-4">
                  <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-gray-400">
                    Nombre de clics par bouton d'appel à l'action (CTA)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* CTA 1: Regarder la Vidéo */}
                    <div className="bg-zinc-900/40 border border-white/5 p-4 rounded-xl flex items-start gap-3">
                      <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg">
                        <Play className="w-5 h-5" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <p className="text-xs font-bold text-gray-300">Bouton "Regarder la Vidéo"</p>
                        <p className="text-[10px] text-gray-500 font-light">
                          Déclenchements de la vidéo d'explication.
                        </p>
                        <div className="flex items-baseline gap-1.5 pt-1">
                          <span className="text-lg font-black text-white">
                            {stats.ctaBreakdown?.watchVideoClicks ?? stats.ctaPerf?.watchVideoClicks ?? 0}
                          </span>
                          <span className="text-[9px] text-gray-500 font-bold uppercase">clics</span>
                        </div>
                      </div>
                    </div>

                    {/* CTA 2: Accès Direct */}
                    <div className="bg-zinc-900/40 border border-white/5 p-4 rounded-xl flex items-start gap-3">
                      <div className="p-2 bg-orange-500/10 text-orange-400 rounded-lg">
                        <Link2 className="w-5 h-5" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <p className="text-xs font-bold text-gray-300">Bouton "Rejoindre MZ+" (Accès Direct)</p>
                        <p className="text-[10px] text-gray-500 font-light">
                          Redirections directes sans passer par le formulaire d'inscription.
                        </p>
                        <div className="flex items-baseline gap-1.5 pt-1">
                          <span className="text-lg font-black text-white">
                            {stats.ctaBreakdown?.directCheckoutClicks ?? stats.ctaPerf?.direct_checkout_cta ?? 0}
                          </span>
                          <span className="text-[9px] text-gray-500 font-bold uppercase">clics</span>
                        </div>
                      </div>
                    </div>

                    {/* CTA 3: Form Leads Submission */}
                    <div className="bg-zinc-900/40 border border-white/5 p-4 rounded-xl flex items-start gap-3">
                      <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                        <Users className="w-5 h-5" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <p className="text-xs font-bold text-gray-300">Inscriptions Formulaire</p>
                        <p className="text-[10px] text-gray-500 font-light">
                          Prospects ayant validé leur nom, email et téléphone.
                        </p>
                        <div className="flex items-baseline gap-1.5 pt-1">
                          <span className="text-lg font-black text-white">
                            {stats.ctaBreakdown?.formSubmissions ?? stats.ctaPerf?.formSubmissions ?? 0}
                          </span>
                          <span className="text-[9px] text-gray-500 font-bold uppercase">prospects</span>
                        </div>
                      </div>
                    </div>

                    {/* CTA 4: Modal Payment Checkouts */}
                    <div className="bg-zinc-900/40 border border-white/5 p-4 rounded-xl flex items-start gap-3">
                      <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                        <Check className="w-5 h-5" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <p className="text-xs font-bold text-gray-300">Bouton "Paiement Sécurisé"</p>
                        <p className="text-[10px] text-gray-500 font-light">
                          Clics finaux sur le bouton de paiement sécurisé après formulaire.
                        </p>
                        <div className="flex items-baseline gap-1.5 pt-1">
                          <span className="text-lg font-black text-white">
                            {stats.ctaBreakdown?.modalCheckoutClicks ?? stats.ctaPerf?.landing_modal_checkout_cta ?? 0}
                          </span>
                          <span className="text-[9px] text-gray-500 font-bold uppercase">clics</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Right side: Conversion Rate to Signup Page */}
                <div className="bg-zinc-900/20 border border-white/5 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-gray-400">
                      Taux d'Utilisateurs Redirigés
                    </h4>
                    <p className="text-xs text-gray-500 leading-relaxed font-light font-display">
                      Pourcentage de visiteurs uniques redirigés vers la page d'inscription (via accès direct ou modal de paiement).
                    </p>
                  </div>

                  <div className="space-y-3 py-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                        {stats.summary.registrationRedirectRate ?? 0}%
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase font-mono">
                        {stats.summary.redirectedUniqueCount ?? 0} / {stats.summary.uniqueVisitors} visiteurs
                      </span>
                    </div>

                    <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-500 via-[#F27D26] to-[#D4AF37] rounded-full transition-all"
                        style={{ width: `${stats.summary.registrationRedirectRate ?? 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-white/[0.01] border border-white/5 rounded-xl p-3 text-[10px] text-gray-400 leading-relaxed">
                    💡 <span className="font-semibold text-gray-300">Taux élevé</span> signifie une excellente réactivité de l'audience aux boutons d'inscription directe et aux formulaires de capture d'informations.
                  </div>
                </div>

              </div>

              {/* Day-by-day Clicks Chart */}
              {stats.dailyClicks && stats.dailyClicks.length > 0 && (
                <div className="border-t border-white/5 pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                      Évolution des Clics CTA par Jour (14 derniers jours)
                    </h4>
                    <span className="text-[10px] text-gray-400 bg-white/5 px-2.5 py-1 rounded-md border border-white/10 font-bold">
                      Tendance Clics
                    </span>
                  </div>

                  {/* Horizontal visual chart bars */}
                  <div className="h-28 flex items-end justify-between gap-1 sm:gap-2 pt-2">
                    {stats.dailyClicks.map((day, idx) => {
                      const maxClicks = Math.max(...(stats.dailyClicks?.map(d => d.count) || [1]), 1);
                      const heightPercent = Math.round((day.count / maxClicks) * 100);
                      
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center group relative">
                          <div className="absolute bottom-full mb-1.5 bg-zinc-900 border border-amber-500/20 text-[9px] font-mono text-amber-400 px-1.5 py-0.5 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30">
                            {day.count} clic{day.count > 1 ? 's' : ''}
                          </div>
                          <div className="w-full bg-white/[0.02] group-hover:bg-white/[0.04] rounded-t h-full flex items-end overflow-hidden transition-colors">
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${heightPercent}%` }}
                              transition={{ delay: idx * 0.02, duration: 0.4 }}
                              className="w-full bg-gradient-to-t from-orange-600 to-amber-400 rounded-t relative"
                            >
                              <div className="absolute inset-x-0 top-0 h-px bg-white/30" />
                            </motion.div>
                          </div>
                          <span className="text-[7px] sm:text-[8px] font-bold text-gray-500 mt-1.5 block tracking-tighter font-mono">
                            {day.date.substring(5)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
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

        {/* 2.5. Advanced Traffic breakdowns (Device, Referrer, Weekday & Recent Visitors) */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Device breakdown & Traffic Channels */}
            <div className="bg-zinc-950/80 border border-white/5 rounded-2xl p-6 space-y-6">
              {/* Devices */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold tracking-wide uppercase text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  Terminaux & Appareils
                </h3>
                {!stats.deviceStats || stats.deviceStats.length === 0 ? (
                  <p className="text-xs text-gray-500">Aucun terminal enregistré.</p>
                ) : (
                  <div className="space-y-3">
                    {stats.deviceStats.map((device, idx) => {
                      const totalDevices = stats.summary.totalVisits || 1;
                      const pct = Math.round((device.value / totalDevices) * 100);
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs text-gray-400">
                            <span className="capitalize">{device.name}</span>
                            <span className="font-bold text-white">{pct}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Referrers */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <h3 className="text-sm font-bold tracking-wide uppercase text-white flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-orange-400" />
                  Canaux de Provenance
                </h3>
                {!stats.referrerStats || stats.referrerStats.length === 0 ? (
                  <p className="text-xs text-gray-500">Aucune provenance enregistrée.</p>
                ) : (
                  <div className="space-y-3">
                    {stats.referrerStats.map((ref, idx) => {
                      const totalRefs = stats.summary.totalVisits || 1;
                      const pct = Math.round((ref.value / totalRefs) * 100);
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs text-gray-400">
                            <span className="truncate max-w-[150px]">{ref.name}</span>
                            <span className="font-bold text-white">{pct}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Weekday Performance / Conversion optimization */}
            <div className="bg-zinc-950/80 border border-white/5 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold tracking-wide uppercase text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                Performance par jour de la semaine
              </h3>
              <p className="text-[11px] text-gray-500 leading-normal">
                Découvrez les jours de la semaine enregistrant les meilleurs taux de conversion (visites en inscriptions).
              </p>

              {!stats.weekdayStats || stats.weekdayStats.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-500">
                  Pas assez de données pour l'analyse hebdomadaire.
                </div>
              ) : (
                <div className="space-y-3.5 pt-2">
                  {stats.weekdayStats.map((w, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-300 w-20">{w.day}</span>
                      <div className="flex-1 mx-3 flex items-center gap-2">
                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${w.rate}%` }} />
                        </div>
                        <span className="text-[10px] text-gray-400 w-8 text-right font-mono font-bold">{w.rate}%</span>
                      </div>
                      <span className="text-[10px] text-gray-500 w-16 text-right font-mono">
                        {w.leads} lead{w.leads > 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent visitors mini table log */}
            <div className="bg-zinc-950/80 border border-white/5 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold tracking-wide uppercase text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#D4AF37]" />
                Journal des Visiteurs Récents
              </h3>
              
              {!stats.recentVisits || stats.recentVisits.length === 0 ? (
                <p className="text-xs text-gray-500 py-12 text-center">Aucun visiteur récent.</p>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {stats.recentVisits.slice(0, 12).map((visit, idx) => (
                    <div key={idx} className="bg-white/[0.01] border border-white/5 rounded-xl p-2.5 flex items-center justify-between text-[11px]">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-gray-300 truncate max-w-[80px]" title={visit.visitor_id}>
                            {visit.visitor_id?.substring(0, 8) || "visiteur"}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 bg-white/5 rounded border border-white/10 uppercase font-bold text-gray-400">
                            {visit.device_type || "pc"}
                          </span>
                        </div>
                        <p className="text-[9px] text-gray-500 font-mono truncate max-w-[120px]">
                          Origine: {visit.referrer || "direct"}
                        </p>
                      </div>
                      <div className="text-right space-y-0.5">
                        <p className="font-bold text-amber-400">{visit.duration || 0}s actif</p>
                        <p className="text-[9px] text-gray-500">{new Date(visit.timestamp).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))}
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
