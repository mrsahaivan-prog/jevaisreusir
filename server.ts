import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
