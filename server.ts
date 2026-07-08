import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Persistent JSON Database Configuration (used as local backup for zero-downtime reliability)
const DB_FILE = path.join(process.cwd(), "db.json");

interface DbSchema {
  leads: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    country: string;
    countryCode: string;
    timestamp: string;
  }>;
  visits: Array<{
    id: string;
    path: string;
    referrer: string;
    ip: string;
    timestamp: string;
    visitor_id?: string;
    duration_seconds?: number;
    device_type?: string;
  }>;
  clicks: Array<{
    id: string;
    email: string;
    phone: string;
    source: string;
    timestamp: string;
    visitor_id?: string;
  }>;
  videoClicks?: Array<{
    id: string;
    source: string;
    timestamp: string;
  }>;
}

function initDb(): DbSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial: DbSchema = { leads: [], visits: [], clicks: [], videoClicks: [] };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf8");
      return initial;
    }
    const content = fs.readFileSync(DB_FILE, "utf8");
    const parsed = JSON.parse(content) as DbSchema;
    if (!parsed.videoClicks) {
      parsed.videoClicks = [];
    }
    return parsed;
  } catch (err) {
    console.error("Database initialization failed:", err);
    return { leads: [], visits: [], clicks: [], videoClicks: [] };
  }
}

let db = initDb();

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");
  } catch (err) {
    console.error("Database save failed:", err);
  }
}

// Supabase client initialization
let SUPABASE_URL = process.env.SUPABASE_URL || "https://jxmjiiorrfpufyxjajik.supabase.co";

// Clean up any trailing slashes or /rest/v1 path suffix that might cause URL path duplication
SUPABASE_URL = SUPABASE_URL.trim().replace(/\/+$/, "");
if (SUPABASE_URL.endsWith("/rest/v1")) {
  SUPABASE_URL = SUPABASE_URL.substring(0, SUPABASE_URL.length - 8);
}
SUPABASE_URL = SUPABASE_URL.replace(/\/+$/, "");

// Using the provided service role key or anon key to authenticate securely from backend
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4bWppaW9ycmZwdWZ5eGphamlrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzQ0ODg5NywiZXhwIjoyMDk5MDI0ODk3fQ.-f-RieLu_yh1O1h6xETllOFkWP1m4opQjKekcEYw9DU";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4bWppaW9ycmZwdWZ5eGphamlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0NDg4OTcsImV4cCI6MjA5OTAyNDg5N30.zfN_ULhPkn7TTCfv4bnzklo7BmApRK-UhbfqZvDQE30";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Enable CORS middleware for external static hosting services
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // API to record leads in the database
  app.post("/api/leads", async (req, res) => {
    const { name, email, phone, country, countryCode, visitorId } = req.body;
    if (!name || !email || !phone) {
      return res.status(400).json({ error: "Champs obligatoires manquants." });
    }

    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPhone = String(phone).trim();
    const cleanCountry = country || "Inconnu";
    const cleanCountryCode = countryCode || "";
    const nowTimestamp = new Date().toISOString();

    const newLead = {
      id: "lead_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      country: cleanCountry,
      country_code: cleanCountryCode,
      timestamp: nowTimestamp
    };

    // 1. Try Supabase Insert
    let supabaseSuccess = false;
    try {
      const { error } = await supabase.from("mz_leads").insert({
        id: newLead.id,
        name: newLead.name,
        email: newLead.email,
        phone: newLead.phone,
        country: newLead.country,
        country_code: newLead.country_code,
        timestamp: newLead.timestamp
      });
      if (error) {
        console.warn("[Supabase] Failed to save lead, falling back to local JSON:", error.message);
      } else {
        supabaseSuccess = true;
      }
    } catch (err: any) {
      console.warn("[Supabase] Lead insertion exception, falling back to local JSON:", err?.message || err);
    }

    // 2. Always fallback/replicate to local db.json
    db = initDb();
    db.leads.push({
      id: newLead.id,
      name: newLead.name,
      email: newLead.email,
      phone: newLead.phone,
      country: newLead.country,
      countryCode: newLead.country_code,
      timestamp: newLead.timestamp
    });
    saveDb();

    // 3. Log a CTA lead click event for advanced conversion analytics
    if (visitorId) {
      try {
        await supabase.from("mz_clicks").insert({
          id: "click_lead_" + Math.random().toString(36).substr(2, 9),
          visitor_id: visitorId,
          email: cleanEmail,
          phone: cleanPhone,
          source: "form_submission",
          timestamp: nowTimestamp
        });
      } catch (e) {}
    }

    console.log(`[Database] Lead saved successfully: ${newLead.name} (${newLead.email})`);
    return res.status(201).json({ success: true, lead: newLead, supabase: supabaseSuccess });
  });

  // API to record site visits
  app.post("/api/visits", async (req, res) => {
    const { visitorId, path: visitPath, referrer, deviceType, userAgent, country, countryCode } = req.body;
    if (!visitorId) {
      return res.status(400).json({ error: "visitorId requis" });
    }

    const rawIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
    const ip = (Array.isArray(rawIp) ? rawIp[0] : String(rawIp)).replace("::ffff:", "");
    const nowTimestamp = new Date().toISOString();

    const newVisit = {
      id: "visit_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
      visitor_id: visitorId,
      ip,
      path: visitPath || "/",
      referrer: referrer || "direct",
      device_type: deviceType || "desktop",
      user_agent: userAgent || "",
      country: country || "Inconnu",
      country_code: countryCode || "",
      duration_seconds: 0,
      timestamp: nowTimestamp
    };

    // 1. Save to Supabase
    let supabaseSuccess = false;
    try {
      const { error } = await supabase.from("mz_visits").insert({
        id: newVisit.id,
        visitor_id: newVisit.visitor_id,
        ip: newVisit.ip,
        path: newVisit.path,
        referrer: newVisit.referrer,
        device_type: newVisit.device_type,
        user_agent: newVisit.user_agent,
        country: newVisit.country,
        country_code: newVisit.country_code,
        duration_seconds: newVisit.duration_seconds,
        timestamp: newVisit.timestamp
      });
      if (error) {
        console.warn("[Supabase] Failed to log visit, falling back to JSON:", error.message);
      } else {
        supabaseSuccess = true;
      }
    } catch (err: any) {
      console.warn("[Supabase] Visit insertion exception, falling back to JSON:", err?.message || err);
    }

    // 2. Local Backup Sync
    db = initDb();
    db.visits.push({
      id: newVisit.id,
      path: newVisit.path,
      referrer: newVisit.referrer,
      ip: newVisit.ip,
      timestamp: newVisit.timestamp,
      visitor_id: newVisit.visitor_id,
      duration_seconds: newVisit.duration_seconds,
      device_type: newVisit.device_type
    });
    saveDb();

    return res.status(201).json({ success: true, supabase: supabaseSuccess });
  });

  // API to update visitor session duration (heartbeat)
  app.post("/api/visits/duration", async (req, res) => {
    const { visitorId, duration } = req.body;
    if (!visitorId) {
      return res.status(400).json({ error: "visitorId requis" });
    }

    const secondsToAdd = Number(duration) || 10;

    // 1. Supabase: update most recent session duration
    try {
      const { data: latestVisit, error: fetchError } = await supabase
        .from("mz_visits")
        .select("id, duration_seconds")
        .eq("visitor_id", visitorId)
        .order("timestamp", { ascending: false })
        .limit(1);

      if (!fetchError && latestVisit && latestVisit.length > 0) {
        const currentDuration = latestVisit[0].duration_seconds || 0;
        const { error: updateError } = await supabase
          .from("mz_visits")
          .update({ duration_seconds: currentDuration + secondsToAdd })
          .eq("id", latestVisit[0].id);

        if (updateError) {
          console.warn("[Supabase] Failed to update visit duration:", updateError.message);
        }
      }
    } catch (err: any) {
      console.warn("[Supabase] Duration update exception:", err?.message || err);
    }

    // 2. Update local backup as well
    try {
      db = initDb();
      const matchingVisits = db.visits.filter((v: any) => v.visitor_id === visitorId);
      if (matchingVisits.length > 0) {
        const lastVisit = matchingVisits[matchingVisits.length - 1] as any;
        lastVisit.duration_seconds = (lastVisit.duration_seconds || 0) + secondsToAdd;
        saveDb();
      }
    } catch (err) {}

    return res.json({ success: true });
  });

  // API to record custom analytics events (video play, progress, etc.)
  app.post("/api/events", async (req, res) => {
    const { visitorId, eventType, eventValue, metadata } = req.body;
    if (!visitorId || !eventType) {
      return res.status(400).json({ error: "visitorId et eventType requis" });
    }

    const nowTimestamp = new Date().toISOString();
    const newEvent = {
      id: "event_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
      visitor_id: visitorId,
      event_type: eventType,
      event_value: Number(eventValue) || 0,
      metadata: metadata || {},
      timestamp: nowTimestamp
    };

    // 1. Save to Supabase
    let supabaseSuccess = false;
    try {
      const { error } = await supabase.from("mz_events").insert({
        id: newEvent.id,
        visitor_id: newEvent.visitor_id,
        event_type: newEvent.event_type,
        event_value: newEvent.event_value,
        metadata: newEvent.metadata,
        timestamp: newEvent.timestamp
      });
      if (error) {
        console.warn("[Supabase] Failed to log event:", error.message);
      } else {
        supabaseSuccess = true;
      }
    } catch (err: any) {
      console.warn("[Supabase] Event insertion exception:", err?.message || err);
    }

    // 2. Sync to local database for compatibility
    db = initDb();
    if (!db.videoClicks) {
      db.videoClicks = [];
    }
    if (eventType === "click_watch_video" || eventType === "play_video") {
      db.videoClicks.push({
        id: newEvent.id,
        source: eventType,
        timestamp: newEvent.timestamp
      });
      saveDb();
    }

    return res.status(201).json({ success: true, supabase: supabaseSuccess });
  });

  // API to record payments clicks (conversion)
  app.post("/api/clicks", async (req, res) => {
    const { email, phone, source, visitorId } = req.body;

    const cleanEmail = email || "anonymous";
    const cleanPhone = phone || "anonymous";
    const cleanSource = source || "sales_page";
    const nowTimestamp = new Date().toISOString();

    const newClick = {
      id: "click_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
      visitor_id: visitorId || null,
      email: cleanEmail,
      phone: cleanPhone,
      source: cleanSource,
      timestamp: nowTimestamp
    };

    // 1. Try Supabase Insert
    try {
      const { error } = await supabase.from("mz_clicks").insert({
        id: newClick.id,
        visitor_id: newClick.visitor_id,
        email: newClick.email,
        phone: newClick.phone,
        source: newClick.source,
        timestamp: newClick.timestamp
      });
      if (error) {
        console.warn("[Supabase] Failed to track checkout click:", error.message);
      }
    } catch (err: any) {
      console.warn("[Supabase] Checkout click insertion exception:", err?.message || err);
    }

    // 2. Always fallback/sync to db.json
    db = initDb();
    db.clicks.push({
      id: newClick.id,
      email: newClick.email,
      phone: newClick.phone,
      source: newClick.source,
      timestamp: newClick.timestamp,
      visitor_id: newClick.visitor_id
    });
    saveDb();

    console.log(`[Database] Checkout payment click tracked for: ${newClick.email}`);
    return res.status(201).json({ success: true });
  });

  // API to record video play button clicks (Legacy support - redirect to generalized events API)
  app.post("/api/video-clicks", (req, res) => {
    const { source } = req.body;
    db = initDb();

    const newVideoClick = {
      id: "vclick_" + Math.random().toString(36).substr(2, 9),
      source: source || "hero_btn",
      timestamp: new Date().toISOString()
    };

    if (!db.videoClicks) {
      db.videoClicks = [];
    }
    db.videoClicks.push(newVideoClick);
    saveDb();

    console.log(`[Database] Video CTA click tracked from source: ${newVideoClick.source}`);
    return res.status(201).json({ success: true });
  });

  // Admin login API
  app.post("/api/admin/login", (req, res) => {
    const { username, password } = req.body;
    const expectedPassword = process.env.ADMIN_PASSWORD || "MZPlusVIP2026";

    if (username === "admin" && password === expectedPassword) {
      const token = Buffer.from(`admin:${expectedPassword}`).toString("base64");
      return res.json({ success: true, token });
    }

    return res.status(401).json({ error: "Nom d'utilisateur ou mot de passe incorrect." });
  });

  // Admin Statistics fetch API - High performance Supabase-backed analytics generator
  app.get("/api/admin/stats", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentification requise." });
    }

    const token = authHeader.split(" ")[1];
    const expectedPassword = process.env.ADMIN_PASSWORD || "MZPlusVIP2026";
    const expectedToken = Buffer.from(`admin:${expectedPassword}`).toString("base64");

    if (token !== expectedToken) {
      return res.status(401).json({ error: "Session expirée ou non valide." });
    }

    try {
      // 1. Fetch datasets from Supabase in parallel
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

      // Calculate average video watch percentage (highest progress step reached by each unique visitor)
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

      // Average time spent on page (excluding 0-second pings)
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

      lErr || leads?.forEach(l => {
        const dateStr = l.timestamp.split("T")[0];
        if (dailyLeadsMap[dateStr] !== undefined) {
          dailyLeadsMap[dateStr]++;
        }
      });

      const dailyLeads = Object.entries(dailyLeadsMap)
        .map(([date, count]) => ({ date, count, visits: dailyVisitsMap[date] || 0 }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Conversions by day of the week (best days identifier)
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
        } catch (e) {}
      });

      clickWatchVideoEvents.forEach(e => {
        try {
          const dateStr = e.timestamp.split("T")[0];
          if (dailyClicksMap[dateStr] !== undefined) {
            dailyClicksMap[dateStr]++;
          }
        } catch (e) {}
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

      return res.json({
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
        source: "supabase"
      });

    } catch (err: any) {
      console.warn("[Supabase fallback] Using local JSON database stats due to error:", err?.message || err);

      const now = new Date();
      // JSON Database fallback aggregation
      db = initDb();
      
      const totalLeads = db.leads.length;
      const totalVisits = db.visits.length;
      const totalClicks = db.clicks.length;
      const totalVideoClicks = db.videoClicks?.length || 0;

      const uniqueIps = new Set(db.visits.map(v => v.ip));
      const uniqueVisitors = uniqueIps.size || totalVisits;

      const countryStatsMap: Record<string, number> = {};
      db.leads.forEach(l => {
        const countryName = l.country || "Inconnu";
        countryStatsMap[countryName] = (countryStatsMap[countryName] || 0) + 1;
      });
      const countryStats = Object.entries(countryStatsMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      const dailyLeadsMap: Record<string, number> = {};
      db.leads.forEach(l => {
        try {
          const date = l.timestamp.split("T")[0];
          dailyLeadsMap[date] = (dailyLeadsMap[date] || 0) + 1;
        } catch (e) {}
      });
      const dailyLeads = Object.entries(dailyLeadsMap)
        .map(([date, count]) => ({ date, count, visits: 0 }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-14);

      // 1. Clicks per day (fallback JSON)
      const dailyClicksMap: Record<string, number> = {};
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = d.toISOString().split("T")[0];
        dailyClicksMap[dateStr] = 0;
      }

      db.clicks.forEach((c: any) => {
        try {
          const dateStr = c.timestamp.split("T")[0];
          if (dailyClicksMap[dateStr] !== undefined) {
            dailyClicksMap[dateStr]++;
          }
        } catch (e) {}
      });

      (db.videoClicks || []).forEach((v: any) => {
        try {
          const dateStr = v.timestamp.split("T")[0];
          if (dailyClicksMap[dateStr] !== undefined) {
            dailyClicksMap[dateStr]++;
          }
        } catch (e) {}
      });

      const dailyClicks = Object.entries(dailyClicksMap)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const todayStr = now.toISOString().split("T")[0];
      const clicksToday = dailyClicksMap[todayStr] || 0;

      // 2. Specific CTA Clicks breakdown (fallback JSON)
      const watchVideoClicksCount = db.videoClicks?.length || 0;
      const directCheckoutClicksCount = db.clicks.filter((c: any) => c.source === "direct_checkout_cta").length;
      const formSubmissionsCount = db.leads.length;
      const modalCheckoutClicksCount = db.clicks.filter((c: any) => c.source === "landing_modal_checkout_cta").length;

      const ctaBreakdown = {
        watchVideoClicks: watchVideoClicksCount,
        directCheckoutClicks: directCheckoutClicksCount,
        formSubmissions: formSubmissionsCount,
        modalCheckoutClicks: modalCheckoutClicksCount
      };

      // 3. Unique users redirected to registration page (fallback JSON)
      const redirectedVisitorIds = new Set<string>();
      db.leads.forEach((l: any) => {
        if (l.visitor_id) redirectedVisitorIds.add(l.visitor_id);
      });
      db.clicks.forEach((c: any) => {
        if ((c.source === "direct_checkout_cta" || c.source === "landing_modal_checkout_cta") && c.visitor_id) {
          redirectedVisitorIds.add(c.visitor_id);
        }
      });
      const redirectedUniqueCount = redirectedVisitorIds.size;
      const registrationRedirectRate = uniqueVisitors > 0
        ? Math.round((redirectedUniqueCount / uniqueVisitors) * 100)
        : 0;

      return res.json({
        summary: {
          totalVisits,
          uniqueVisitors,
          totalLeads,
          totalClicks,
          totalVideoClicks,
          videoPlays: totalVideoClicks,
          averageVideoProgress: 45,
          averageTimeOnPage: 35,
          optInRate: totalVisits > 0 ? Math.round((totalLeads / totalVisits) * 100) : 0,
          conversionRate: totalLeads > 0 ? Math.round((totalClicks / totalLeads) * 100) : 0,
          activeToday: uniqueVisitors,
          activeThisWeek: uniqueVisitors,
          activeThisMonth: uniqueVisitors,
          visitToPlayRate: totalVisits > 0 ? Math.round((totalVideoClicks / totalVisits) * 100) : 0,
          playToCtaRate: totalVideoClicks > 0 ? Math.round((totalClicks / totalVideoClicks) * 100) : 0,
          clicksToday,
          registrationRedirectRate,
          redirectedUniqueCount
        },
        leads: db.leads.reverse(),
        recentVisits: db.visits.map(v => ({ visitor_id: v.id, timestamp: v.timestamp, ip: v.ip, path: v.path, referrer: v.referrer, country: "Inconnu", device_type: "desktop" })).reverse().slice(0, 20),
        countryStats,
        referrerStats: [],
        deviceStats: [],
        dailyLeads,
        weekdayStats: [],
        ctaPerf: { 
          watchVideoClicks: totalVideoClicks, 
          videoPlays: totalVideoClicks, 
          joinMzClicks: totalClicks, 
          formSubmissions: totalLeads,
          direct_checkout_cta: directCheckoutClicksCount,
          landing_modal_checkout_cta: modalCheckoutClicksCount
        },
        ctaBreakdown,
        dailyClicks,
        clicksToday,
        clicks: db.clicks,
        source: "json"
      });
    }
  });

  // API to delete a lead from database
  app.delete("/api/admin/leads/:id", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentification requise." });
    }

    const token = authHeader.split(" ")[1];
    const expectedPassword = process.env.ADMIN_PASSWORD || "MZPlusVIP2026";
    const expectedToken = Buffer.from(`admin:${expectedPassword}`).toString("base64");

    if (token !== expectedToken) {
      return res.status(401).json({ error: "Session non valide ou expirée." });
    }

    const { id } = req.params;

    // 1. Delete in Supabase
    let supabaseSuccess = false;
    try {
      const { error } = await supabase.from("mz_leads").delete().eq("id", id);
      if (!error) {
        supabaseSuccess = true;
      } else {
        console.warn("[Supabase] Lead deletion failed:", error.message);
      }
    } catch (err: any) {
      console.warn("[Supabase] Lead deletion exception:", err?.message || err);
    }

    // 2. Sync / fallback deletion to local db.json
    db = initDb();
    const index = db.leads.findIndex(l => l.id === id);
    if (index !== -1) {
      db.leads.splice(index, 1);
      saveDb();
    }

    console.log(`[Database] Lead deleted: ${id}`);
    return res.json({ success: true, supabase: supabaseSuccess });
  });

  // API route for Chariow checkout proxy
  app.post("/api/checkout", async (req, res) => {
    try {
      const { name, email, phone, country_code } = req.body;

      if (!email || !name || !phone) {
        return res.status(400).json({
          error: "Veuillez fournir toutes les informations nécessaires (Nom, Email, Téléphone)."
        });
      }

      const apiKey = process.env.CHARIOW_API_KEY;
      if (!apiKey) {
        console.error("CHARIOW_API_KEY is not defined in the environment variables!");
        return res.status(500).json({
          error: "Le paiement par Chariow n'est pas encore configuré. Veuillez ajouter CHARIOW_API_KEY dans vos secrets ou votre fichier .env."
        });
      }

      // Split full name into first and last name
      const nameParts = name.trim().split(/\s+/);
      const firstName = nameParts[0] || "Client";
      const lastName = nameParts.slice(1).join(" ") || "MZ+";

      // Clean phone number (remove prefix symbols if any)
      const cleanPhone = phone.replace(/[^0-9]/g, "");

      console.log(`[Chariow] Creating checkout session for: ${firstName} ${lastName} (${email})`);

      const chariowPayload = {
        product_id: "prd_knd1e076",
        email: email,
        first_name: firstName,
        last_name: lastName,
        phone: {
          number: cleanPhone,
          country_code: country_code || "CI"
        }
      };

      const response = await fetch("https://api.chariow.com/v1/checkout", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(chariowPayload)
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[Chariow API Error] Status: ${response.status}. Response: ${errText}`);
        return res.status(response.status).json({
          error: "Erreur lors de l'initialisation du paiement chez Chariow.",
          details: errText
        });
      }

      const data = await response.json();
      console.log("[Chariow API Success] Response:", data);

      // Extract the checkout URL robustly
      const checkoutUrl = data.url || 
                          data.checkout_url || 
                          data.redirect_url || 
                          data.payment_url || 
                          (data.data && (
                            (data.data.payment && data.data.payment.checkout_url) ||
                            data.data.url || 
                            data.data.checkout_url || 
                            data.data.redirect_url || 
                            data.data.payment_url
                          ));

      if (!checkoutUrl) {
        console.error("[Chariow API Response Missing URL] No checkout URL found in data:", data);
        return res.status(500).json({
          error: "Chariow n'a pas retourné de lien de paiement valide.",
          response: data
        });
      }

      return res.json({ checkoutUrl });

    } catch (error: any) {
      console.error("[Chariow Integration Exception]:", error);
      return res.status(500).json({
        error: "Une erreur interne est survenue lors de l'accès au service de paiement.",
        details: error?.message || String(error)
      });
    }
  });

  // Serve static assets or mount Vite dev middleware
  // Highly robust environment detection to prevent starting Vite dev server in production
  const isProd = process.env.NODE_ENV === "production" || 
                 __filename.endsWith("server.cjs") || 
                 (!fs.existsSync(path.join(process.cwd(), "server.ts")) && fs.existsSync(path.join(process.cwd(), "dist/index.html")));

  if (!isProd) {
    console.log("[Server] Starting in DEVELOPMENT mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("[Server] Starting in PRODUCTION mode, serving pre-built static files from /dist...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
