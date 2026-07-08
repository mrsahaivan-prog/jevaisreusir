import { createClient } from "@supabase/supabase-js";

// Supabase configuration - perfectly matches credentials in server.ts
const SUPABASE_URL = "https://jxmjiiorrfpufyxjajik.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4bWppaW9ycmZwdWZ5eGphamlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0NDg4OTcsImV4cCI6MjA5OTAyNDg5N30.zfN_ULhPkn7TTCfv4bnzklo7BmApRK-UhbfqZvDQE30";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Fast check if the response was HTML (indicating a SPA 404/fallback redirect)
async function isHtmlResponse(response: Response): Promise<boolean> {
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("text/html")) {
    return true;
  }
  try {
    const clone = response.clone();
    const text = await clone.text();
    return text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html");
  } catch {
    return false;
  }
}

// Check if we are running in a static deployment (e.g. Netlify) with no server backend
function isStaticDeployment(): boolean {
  // If the protocol is file: or hostname is local but we explicitly want to test static behavior, or on external deployment
  const hostname = window.location.hostname;
  // If we are on netlify or other static hosting domains, we can prefer direct Supabase
  if (hostname.includes("netlify.app") || hostname.includes("vercel.app") || hostname.includes("github.io")) {
    return true;
  }
  return false;
}

export const apiClient = {
  // 1. Record Page Visit
  async recordVisit(data: {
    visitorId: string;
    path: string;
    referrer: string;
    deviceType: string;
    userAgent: string;
    country?: string;
    countryCode?: string;
  }): Promise<any> {
    const payload = {
      visitorId: data.visitorId,
      path: data.path,
      referrer: data.referrer || "direct",
      deviceType: data.deviceType,
      userAgent: data.userAgent,
      country: data.country || "Inconnu",
      countryCode: data.countryCode || "",
    };

    if (!isStaticDeployment()) {
      try {
        const response = await fetch("/api/visits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (response.ok && !(await isHtmlResponse(response))) {
          return await response.json();
        }
      } catch (err) {
        console.warn("[API Server] Failed to save visit, falling back to direct Supabase:", err);
      }
    }

    // Direct Supabase Fallback
    try {
      const visitId = "visit_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
      const { error } = await supabase.from("mz_visits").insert({
        id: visitId,
        visitor_id: payload.visitorId,
        ip: "client-direct",
        path: payload.path,
        referrer: payload.referrer,
        device_type: payload.deviceType,
        user_agent: payload.userAgent,
        country: payload.country,
        country_code: payload.countryCode,
        duration_seconds: 0,
        timestamp: new Date().toISOString(),
      });
      if (error) throw error;
      return { success: true, mode: "supabase-direct" };
    } catch (err: any) {
      console.error("[Supabase Direct] Failed to record visit:", err?.message || err);
      return { success: false, error: err?.message || err };
    }
  },

  // 2. Update Visit Duration (Heartbeat)
  async recordDuration(data: { visitorId: string; duration: number }): Promise<any> {
    if (!isStaticDeployment()) {
      try {
        const response = await fetch("/api/visits/duration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (response.ok && !(await isHtmlResponse(response))) {
          return await response.json();
        }
      } catch (err) {
        console.warn("[API Server] Failed to update duration, falling back to direct Supabase:", err);
      }
    }

    // Direct Supabase Fallback
    try {
      const { data: latestVisit, error: fetchError } = await supabase
        .from("mz_visits")
        .select("id, duration_seconds")
        .eq("visitor_id", data.visitorId)
        .order("timestamp", { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      if (latestVisit && latestVisit.length > 0) {
        const currentDuration = latestVisit[0].duration_seconds || 0;
        const { error: updateError } = await supabase
          .from("mz_visits")
          .update({ duration_seconds: currentDuration + data.duration })
          .eq("id", latestVisit[0].id);

        if (updateError) throw updateError;
        return { success: true, mode: "supabase-direct" };
      }
      return { success: false, error: "No visit found to update duration" };
    } catch (err: any) {
      console.error("[Supabase Direct] Failed to update duration:", err?.message || err);
      return { success: false, error: err?.message || err };
    }
  },

  // 3. Record Analytics Custom Event
  async recordEvent(data: {
    visitorId: string;
    eventType: string;
    eventValue: number;
    metadata?: any;
  }): Promise<any> {
    if (!isStaticDeployment()) {
      try {
        const response = await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (response.ok && !(await isHtmlResponse(response))) {
          return await response.json();
        }
      } catch (err) {
        console.warn("[API Server] Failed to log event, falling back to direct Supabase:", err);
      }
    }

    // Direct Supabase Fallback
    try {
      const eventId = "event_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
      const { error } = await supabase.from("mz_events").insert({
        id: eventId,
        visitor_id: data.visitorId,
        event_type: data.eventType,
        event_value: data.eventValue,
        metadata: data.metadata || {},
        timestamp: new Date().toISOString(),
      });
      if (error) throw error;
      return { success: true, mode: "supabase-direct" };
    } catch (err: any) {
      console.error("[Supabase Direct] Failed to record event:", err?.message || err);
      return { success: false, error: err?.message || err };
    }
  },

  // 4. Record Lead Registration
  async recordLead(data: {
    name: string;
    email: string;
    phone: string;
    country: string;
    countryCode: string;
    visitorId: string;
  }): Promise<any> {
    if (!isStaticDeployment()) {
      try {
        const response = await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (response.ok && !(await isHtmlResponse(response))) {
          return await response.json();
        }
      } catch (err) {
        console.warn("[API Server] Failed to save lead, falling back to direct Supabase:", err);
      }
    }

    // Direct Supabase Fallback
    try {
      const leadId = "lead_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
      const { error } = await supabase.from("mz_leads").insert({
        id: leadId,
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone.trim(),
        country: data.country || "Inconnu",
        country_code: data.countryCode || "",
        visitor_id: data.visitorId,
        timestamp: new Date().toISOString(),
      });
      if (error) throw error;
      return { success: true, mode: "supabase-direct" };
    } catch (err: any) {
      console.error("[Supabase Direct] Failed to record lead:", err?.message || err);
      return { success: false, error: err?.message || err };
    }
  },

  // 5. Record Checkout Click Event
  async recordClick(data: {
    email: string;
    phone: string;
    source: string;
    visitorId?: string;
  }): Promise<any> {
    if (!isStaticDeployment()) {
      try {
        const response = await fetch("/api/clicks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (response.ok && !(await isHtmlResponse(response))) {
          return await response.json();
        }
      } catch (err) {
        console.warn("[API Server] Failed to save click, falling back to direct Supabase:", err);
      }
    }

    // Direct Supabase Fallback
    try {
      const clickId = "click_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
      const { error } = await supabase.from("mz_clicks").insert({
        id: clickId,
        visitor_id: data.visitorId || null,
        email: data.email.trim().toLowerCase(),
        phone: data.phone.trim(),
        source: data.source,
        timestamp: new Date().toISOString(),
      });
      if (error) throw error;
      return { success: true, mode: "supabase-direct" };
    } catch (err: any) {
      console.error("[Supabase Direct] Failed to record click:", err?.message || err);
      return { success: false, error: err?.message || err };
    }
  },

  // 6. Record Legacy Video Click
  async recordVideoClick(data: { source: string }): Promise<any> {
    if (!isStaticDeployment()) {
      try {
        const response = await fetch("/api/video-clicks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (response.ok && !(await isHtmlResponse(response))) {
          return await response.json();
        }
      } catch (err) {
        console.warn("[API Server] Failed to track video click:", err);
      }
    }
    return { success: true, mode: "noop" };
  },

  // 7. Admin Login Action
  async adminLogin(username: string, password: string): Promise<{ success: boolean; token: string }> {
    if (!isStaticDeployment()) {
      try {
        const response = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        if (response.ok && !(await isHtmlResponse(response))) {
          return await response.json();
        } else if (response.status === 401) {
          throw new Error("Nom d'utilisateur ou mot de passe incorrect.");
        }
      } catch (err: any) {
        if (err.message && err.message.includes("incorrect")) {
          throw err;
        }
        console.warn("[API Server] Admin login endpoint unavailable, trying direct Client Auth:", err);
      }
    }

    // Direct Client Fallback (perfectly matching "MZPlusVIP2026" or customized password)
    const expectedPassword = "MZPlusVIP2026";
    if (username === "admin" && password === expectedPassword) {
      // Create token compatible with authorization headers
      const token = window.btoa(`admin:${expectedPassword}`);
      return { success: true, token };
    } else {
      throw new Error("Nom d'utilisateur ou mot de passe incorrect.");
    }
  },

  // 8. Fetch Statistics (Direct Client Aggregation from Supabase)
  async fetchAdminStats(token: string): Promise<any> {
    if (!isStaticDeployment()) {
      try {
        const response = await fetch("/api/admin/stats", {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        if (response.ok && !(await isHtmlResponse(response))) {
          return await response.json();
        }
      } catch (err) {
        console.warn("[API Server] Stats aggregation endpoint unavailable, trying direct client-side aggregation:", err);
      }
    }

    // Direct Client-Side Aggregation from Supabase (Highly advanced & identical results)
    try {
      // Parallel fetch from all collections
      const [
        { data: visits, error: vErr },
        { data: leads, error: lErr },
        { data: clicks, error: cErr },
        { data: events, error: eErr }
      ] = await Promise.all([
        supabase.from("mz_visits").select("*").order("timestamp", { ascending: false }),
        supabase.from("mz_leads").select("*").order("timestamp", { ascending: false }),
        supabase.from("mz_clicks").select("*").order("timestamp", { ascending: false }),
        supabase.from("mz_events").select("*").order("timestamp", { ascending: false })
      ]);

      if (vErr || lErr || cErr || eErr) {
        throw new Error(`Supabase query failed: ${vErr?.message || lErr?.message || cErr?.message || eErr?.message}`);
      }

      // Check for empty dataset to prevent division by zero errors
      const totalVisits = visits?.length || 0;
      const uniqueVisitors = new Set(visits?.map(v => v.visitor_id) || []).size;

      // Filter events
      const clickWatchVideoEvents = events?.filter(e => e.event_type === "click_watch_video") || [];
      const playVideoEvents = events?.filter(e => e.event_type === "play_video") || [];
      const videoProgressEvents = events?.filter(e => e.event_type === "video_progress") || [];
      const joinMzClicks = clicks?.filter(c => c.source !== "form_submission") || [];

      // Calculate average video watch percentage
      const visitorMaxProgress: Record<string, number> = {};
      videoProgressEvents.forEach(e => {
        const vId = e.visitor_id;
        const val = Number(e.event_value) || 0;
        if (!visitorMaxProgress[vId] || val > visitorMaxProgress[vId]) {
          visitorMaxProgress[vId] = val;
        }
      });
      const progressValues = Object.values(visitorMaxProgress);
      const averageVideoProgress = progressValues.length > 0 
        ? Math.round(progressValues.reduce((a, b) => a + b, 0) / progressValues.length)
        : 0;

      // Active visitors timeframes
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const activeToday = new Set(visits?.filter(v => new Date(v.timestamp) >= oneDayAgo).map(v => v.visitor_id) || []).size;
      const activeThisWeek = new Set(visits?.filter(v => new Date(v.timestamp) >= oneWeekAgo).map(v => v.visitor_id) || []).size;
      const activeThisMonth = new Set(visits?.filter(v => new Date(v.timestamp) >= oneMonthAgo).map(v => v.visitor_id) || []).size;

      // Average time spent on page
      const nonZeroVisits = visits?.filter(v => (v.duration_seconds || 0) > 0) || [];
      const averageTimeOnPage = nonZeroVisits.length > 0
        ? Math.round(nonZeroVisits.reduce((sum, v) => sum + (v.duration_seconds || 0), 0) / nonZeroVisits.length)
        : 0;

      // Provenance referrers mapping
      const referrerMap: Record<string, number> = {};
      visits?.forEach(v => {
        const ref = v.referrer || "Direct";
        referrerMap[ref] = (referrerMap[ref] || 0) + 1;
      });
      const referrerStats = Object.entries(referrerMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      // Countries mapping
      const countryMap: Record<string, number> = {};
      visits?.forEach(v => {
        const c = v.country || "Inconnu";
        countryMap[c] = (countryMap[c] || 0) + 1;
      });
      const countryStats = Object.entries(countryMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      // Device types mapping
      const deviceMap: Record<string, number> = { mobile: 0, tablet: 0, desktop: 0 };
      visits?.forEach(v => {
        const d = v.device_type || "desktop";
        if (deviceMap[d] !== undefined) {
          deviceMap[d]++;
        } else {
          deviceMap[d] = (deviceMap[d] || 0) + 1;
        }
      });
      const deviceStats = Object.entries(deviceMap).map(([name, value]) => ({ name, value }));

      // Conversion rates
      const visitToPlayRate = uniqueVisitors > 0
        ? Math.round((new Set(playVideoEvents.map(e => e.visitor_id)).size / uniqueVisitors) * 100)
        : 0;
      const playToCtaRate = playVideoEvents.length > 0
        ? Math.round((new Set(joinMzClicks.map(c => c.visitor_id)).size / new Set(playVideoEvents.map(e => e.visitor_id)).size) * 100)
        : 0;

      // Chronological Evolution Graph (past 14 days)
      const dailyVisitsMap: Record<string, number> = {};
      const dailyLeadsMap: Record<string, number> = {};

      for (let i = 13; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = d.toISOString().split("T")[0];
        dailyVisitsMap[dateStr] = 0;
        dailyLeadsMap[dateStr] = 0;
      }

      visits?.forEach(v => {
        const dateStr = v.timestamp.split("T")[0];
        if (dailyVisitsMap[dateStr] !== undefined) {
          dailyVisitsMap[dateStr]++;
        }
      });

      leads?.forEach(l => {
        const dateStr = l.timestamp.split("T")[0];
        if (dailyLeadsMap[dateStr] !== undefined) {
          dailyLeadsMap[dateStr]++;
        }
      });

      const dailyLeads = Object.entries(dailyLeadsMap)
        .map(([date, count]) => ({ date, count, visits: dailyVisitsMap[date] || 0 }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Conversions by day of the week
      const weekdayNames = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
      const weekdayConversions: Record<string, { visits: number; leads: number }> = {};
      weekdayNames.forEach(w => {
        weekdayConversions[w] = { visits: 0, leads: 0 };
      });

      visits?.forEach(v => {
        const dayName = weekdayNames[new Date(v.timestamp).getDay()];
        if (weekdayConversions[dayName]) weekdayConversions[dayName].visits++;
      });
      leads?.forEach(l => {
        const dayName = weekdayNames[new Date(l.timestamp).getDay()];
        if (weekdayConversions[dayName]) weekdayConversions[dayName].leads++;
      });

      const weekdayStats = Object.entries(weekdayConversions).map(([day, val]) => ({
        day,
        rate: val.visits > 0 ? Math.round((val.leads / val.visits) * 100) : 0,
        leads: val.leads,
        visits: val.visits
      }));

      // CTA Funnel breakdown
      const watchVideoClicksCount = clickWatchVideoEvents.length;
      const directCheckoutClicksCount = clicks?.filter(c => c.source === "direct_checkout_cta").length || 0;
      const formSubmissionsCount = leads?.length || 0;
      const modalCheckoutClicksCount = clicks?.filter(c => c.source === "landing_modal_checkout_cta").length || 0;

      const ctaBreakdown = {
        watchVideoClicks: watchVideoClicksCount,
        directCheckoutClicks: directCheckoutClicksCount,
        formSubmissions: formSubmissionsCount,
        modalCheckoutClicks: modalCheckoutClicksCount
      };

      const ctaPerf = {
        watchVideoClicks: clickWatchVideoEvents.length,
        videoPlays: playVideoEvents.length,
        joinMzClicks: joinMzClicks.length,
        formSubmissions: leads?.length || 0,
        direct_checkout_cta: directCheckoutClicksCount,
        landing_modal_checkout_cta: modalCheckoutClicksCount
      };

      // Clicks per day & today's clicks
      const dailyClicksMap: Record<string, number> = {};
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = d.toISOString().split("T")[0];
        dailyClicksMap[dateStr] = 0;
      }

      clicks?.forEach(c => {
        try {
          const dateStr = c.timestamp.split("T")[0];
          if (dailyClicksMap[dateStr] !== undefined) {
            dailyClicksMap[dateStr]++;
          }
        } catch {}
      });

      clickWatchVideoEvents.forEach(e => {
        try {
          const dateStr = e.timestamp.split("T")[0];
          if (dailyClicksMap[dateStr] !== undefined) {
            dailyClicksMap[dateStr]++;
          }
        } catch {}
      });

      const dailyClicks = Object.entries(dailyClicksMap)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const todayStr = now.toISOString().split("T")[0];
      const clicksToday = dailyClicksMap[todayStr] || 0;

      // Unique users redirected to registration page (direct or via form validation)
      const redirectedVisitorIds = new Set<string>();
      leads?.forEach(l => {
        if (l.visitor_id) redirectedVisitorIds.add(l.visitor_id);
      });
      clicks?.forEach(c => {
        if ((c.source === "direct_checkout_cta" || c.source === "landing_modal_checkout_cta") && c.visitor_id) {
          redirectedVisitorIds.add(c.visitor_id);
        }
      });
      const redirectedUniqueCount = redirectedVisitorIds.size;
      const registrationRedirectRate = uniqueVisitors > 0
        ? Math.round((redirectedUniqueCount / uniqueVisitors) * 100)
        : 0;

      return {
        summary: {
          totalVisits,
          uniqueVisitors,
          totalLeads: leads?.length || 0,
          totalClicks: joinMzClicks.length,
          totalVideoClicks: clickWatchVideoEvents.length,
          videoPlays: playVideoEvents.length,
          averageVideoProgress,
          averageTimeOnPage,
          optInRate: totalVisits > 0 ? Math.round(((leads?.length || 0) / totalVisits) * 100) : 0,
          conversionRate: playVideoEvents.length > 0 ? Math.round((joinMzClicks.length / playVideoEvents.length) * 100) : 0,
          activeToday,
          activeThisWeek,
          activeThisMonth,
          visitToPlayRate,
          playToCtaRate,
          clicksToday,
          registrationRedirectRate,
          redirectedUniqueCount
        },
        leads,
        recentVisits: visits?.slice(0, 50) || [],
        countryStats,
        referrerStats,
        deviceStats,
        dailyLeads,
        weekdayStats,
        ctaPerf,
        ctaBreakdown,
        dailyClicks,
        clicksToday,
        clicks: joinMzClicks,
        source: "supabase-client"
      };

    } catch (err: any) {
      console.error("[Supabase Direct Stats] Failed to fetch stats:", err?.message || err);
      throw err;
    }
  },

  // 9. Delete Lead
  async deleteLead(leadId: string, token: string): Promise<any> {
    if (!isStaticDeployment()) {
      try {
        const response = await fetch(`/api/admin/leads/${leadId}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        if (response.ok && !(await isHtmlResponse(response))) {
          return await response.json();
        }
      } catch (err) {
        console.warn("[API Server] Failed to delete lead, trying direct Supabase:", err);
      }
    }

    // Direct Supabase Fallback
    try {
      const { error } = await supabase.from("mz_leads").delete().eq("id", leadId);
      if (error) throw error;
      return { success: true, mode: "supabase-direct" };
    } catch (err: any) {
      console.error("[Supabase Direct] Failed to delete lead:", err?.message || err);
      return { success: false, error: err?.message || err };
    }
  }
};
