import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Persistent JSON Database Configuration
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
  }>;
  clicks: Array<{
    id: string;
    email: string;
    phone: string;
    source: string;
    timestamp: string;
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Enable CORS middleware for external static hosting services (e.g., Netlify)
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
  app.post("/api/leads", (req, res) => {
    const { name, email, phone, country, countryCode } = req.body;
    if (!name || !email || !phone) {
      return res.status(400).json({ error: "Champs obligatoires manquants." });
    }

    db = initDb();
    const newLead = {
      id: "lead_" + Math.random().toString(36).substr(2, 9),
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      phone: String(phone).trim(),
      country: country || "Inconnu",
      countryCode: countryCode || "",
      timestamp: new Date().toISOString()
    };

    db.leads.push(newLead);
    saveDb();

    console.log(`[Database] Lead saved successfully: ${newLead.name} (${newLead.email})`);
    return res.status(201).json({ success: true, lead: newLead });
  });

  // API to record site visits
  app.post("/api/visits", (req, res) => {
    const { path: visitPath, referrer } = req.body;
    db = initDb();

    const rawIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
    const ip = Array.isArray(rawIp) ? rawIp[0] : String(rawIp);

    const newVisit = {
      id: "visit_" + Math.random().toString(36).substr(2, 9),
      path: visitPath || "/",
      referrer: referrer || "direct",
      ip: ip.replace("::ffff:", ""),
      timestamp: new Date().toISOString()
    };

    db.visits.push(newVisit);
    saveDb();

    return res.status(201).json({ success: true });
  });

  // API to record payments clicks (conversion)
  app.post("/api/clicks", (req, res) => {
    const { email, phone, source } = req.body;
    db = initDb();

    const newClick = {
      id: "click_" + Math.random().toString(36).substr(2, 9),
      email: email || "anonymous",
      phone: phone || "anonymous",
      source: source || "sales_page",
      timestamp: new Date().toISOString()
    };

    db.clicks.push(newClick);
    saveDb();

    console.log(`[Database] Checkout payment click tracked for: ${newClick.email}`);
    return res.status(201).json({ success: true });
  });

  // API to record video play button clicks
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

  // Admin Statistics fetch API
  app.get("/api/admin/stats", (req, res) => {
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

    db = initDb();

    const totalLeads = db.leads.length;
    const totalVisits = db.visits.length;
    const totalClicks = db.clicks.length;

    // Calculate unique visitors by unique IP address
    const uniqueIps = new Set(db.visits.map(v => v.ip));
    const uniqueVisitors = uniqueIps.size || totalVisits;

    // Stats by Country (for leads)
    const countryStatsMap: Record<string, number> = {};
    db.leads.forEach(l => {
      const countryName = l.country || "Inconnu";
      countryStatsMap[countryName] = (countryStatsMap[countryName] || 0) + 1;
    });

    const countryStats = Object.entries(countryStatsMap).map(([name, value]) => ({
      name,
      value
    })).sort((a, b) => b.value - a.value);

    // Leads registered per day (past 14 days)
    const dailyLeadsMap: Record<string, number> = {};
    db.leads.forEach(l => {
      try {
        const date = l.timestamp.split("T")[0]; // YYYY-MM-DD
        dailyLeadsMap[date] = (dailyLeadsMap[date] || 0) + 1;
      } catch (e) {
        // Fallback
      }
    });

    const dailyLeads = Object.entries(dailyLeadsMap).map(([date, count]) => ({
      date,
      count
    })).sort((a, b) => a.date.localeCompare(b.date)).slice(-14);

    return res.json({
      summary: {
        totalVisits,
        uniqueVisitors,
        totalLeads,
        totalClicks,
        totalVideoClicks: db.videoClicks?.length || 0,
        optInRate: totalVisits > 0 ? Math.round((totalLeads / totalVisits) * 100) : 0,
        conversionRate: totalLeads > 0 ? Math.round((totalClicks / totalLeads) * 100) : 0
      },
      leads: db.leads.reverse(), // Show latest first
      countryStats,
      dailyLeads,
      clicks: db.clicks
    });
  });

  // API to delete a lead from database
  app.delete("/api/admin/leads/:id", (req, res) => {
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
    db = initDb();
    
    const index = db.leads.findIndex(l => l.id === id);
    if (index !== -1) {
      db.leads.splice(index, 1);
      saveDb();
      console.log(`[Database] Lead deleted: ${id}`);
      return res.json({ success: true });
    }

    return res.status(404).json({ error: "Lead non trouvé." });
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
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
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
