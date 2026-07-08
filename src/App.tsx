/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { apiClient } from "./lib/apiClient";
import { motion, AnimatePresence } from "motion/react";
import { CustomVideoPlayer } from "./components/CustomVideoPlayer";
import { SalesPage, getPriceForCountry } from "./components/SalesPage";
import AdminPanel from "./components/AdminPanel";
import {
  Play,
  Volume2,
  VolumeX,
  CheckCircle2,
  Users,
  ChevronDown,
  Clock,
  Sparkles,
  Smartphone,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Send,
  HelpCircle,
  Award,
  ChevronRight,
  Check,
  X,
  Info,
  Flame,
  Rocket,
  Gift,
  Target,
  Heart,
  Globe,
  Lock,
  Zap,
  ArrowLeft
} from "lucide-react";

// Types
interface Lead {
  name: string;
  email: string;
  phone: string;
  country: string;
  timestamp: string;
}

interface Country {
  code: string;
  name: string;
  prefix: string;
  flag: string;
}

// Comprehensive list of all African countries without exception, plus France/Canada
const COUNTRIES: Country[] = [
  { code: "CI", name: "Côte d'Ivoire", prefix: "+225", flag: "🇨🇮" },
  { code: "DZ", name: "Algérie", prefix: "+213", flag: "🇩🇿" },
  { code: "AO", name: "Angola", prefix: "+244", flag: "🇦🇴" },
  { code: "BJ", name: "Bénin", prefix: "+229", flag: "🇧🇯" },
  { code: "BW", name: "Botswana", prefix: "+267", flag: "🇧🇼" },
  { code: "BF", name: "Burkina Faso", prefix: "+226", flag: "🇧🇫" },
  { code: "BI", name: "Burundi", prefix: "+257", flag: "🇧🇮" },
  { code: "CM", name: "Cameroun", prefix: "+237", flag: "🇨🇲" },
  { code: "CV", name: "Cap-Vert", prefix: "+238", flag: "🇨🇻" },
  { code: "CF", name: "République Centrafricaine", prefix: "+236", flag: "🇨🇫" },
  { code: "KM", name: "Comores", prefix: "+269", flag: "🇰🇲" },
  { code: "CG", name: "Congo-Brazzaville", prefix: "+242", flag: "🇨🇬" },
  { code: "CD", name: "RDC (Congo-Kinshasa)", prefix: "+243", flag: "🇨🇩" },
  { code: "DJ", name: "Djibouti", prefix: "+253", flag: "🇩🇯" },
  { code: "EG", name: "Égypte", prefix: "+20", flag: "🇪🇬" },
  { code: "ER", name: "Érythrée", prefix: "+291", flag: "🇪🇷" },
  { code: "SZ", name: "Eswatini", prefix: "+268", flag: "🇸🇿" },
  { code: "ET", name: "Éthiopie", prefix: "+251", flag: "🇪🇹" },
  { code: "GA", name: "Gabon", prefix: "+241", flag: "🇬🇦" },
  { code: "GM", name: "Gambie", prefix: "+220", flag: "🇬🇲" },
  { code: "GH", name: "Ghana", prefix: "+233", flag: "🇬🇭" },
  { code: "GN", name: "Guinée", prefix: "+224", flag: "🇬🇳" },
  { code: "GW", name: "Guinée-Bissau", prefix: "+245", flag: "🇬🇼" },
  { code: "GQ", name: "Guinée Équatoriale", prefix: "+240", flag: "🇬🇶" },
  { code: "KE", name: "Kenya", prefix: "+254", flag: "🇰🇪" },
  { code: "LS", name: "Lesotho", prefix: "+266", flag: "🇱🇸" },
  { code: "LR", name: "Libéria", prefix: "+231", flag: "🇱🇷" },
  { code: "LY", name: "Libye", prefix: "+218", flag: "🇱🇾" },
  { code: "MG", name: "Madagascar", prefix: "+261", flag: "🇲🇬" },
  { code: "MW", name: "Malawi", prefix: "+265", flag: "🇲🇼" },
  { code: "ML", name: "Mali", prefix: "+223", flag: "🇲🇱" },
  { code: "MA", name: "Maroc", prefix: "+212", flag: "🇲🇦" },
  { code: "MU", name: "Maurice", prefix: "+230", flag: "🇲🇺" },
  { code: "MR", name: "Mauritanie", prefix: "+222", flag: "🇲🇷" },
  { code: "MZ", name: "Mozambique", prefix: "+258", flag: "🇲🇿" },
  { code: "NA", name: "Namibie", prefix: "+264", flag: "🇳🇦" },
  { code: "NE", name: "Niger", prefix: "+227", flag: "🇳🇪" },
  { code: "NG", name: "Nigéria", prefix: "+234", flag: "🇳🇬" },
  { code: "UG", name: "Ouganda", prefix: "+256", flag: "🇺🇬" },
  { code: "RW", name: "Rwanda", prefix: "+250", flag: "🇷🇼" },
  { code: "ST", name: "Sao Tomé-et-Principe", prefix: "+239", flag: "🇸🇹" },
  { code: "SN", name: "Sénégal", prefix: "+221", flag: "🇸🇳" },
  { code: "SC", name: "Seychelles", prefix: "+248", flag: "🇸🇨" },
  { code: "SL", name: "Sierra Leone", prefix: "+232", flag: "🇸🇱" },
  { code: "SO", name: "Somalie", prefix: "+252", flag: "🇸🇴" },
  { code: "SD", name: "Soudan", prefix: "+249", flag: "🇸🇩" },
  { code: "SS", name: "Soudan du Sud", prefix: "+211", flag: "🇸🇸" },
  { code: "ZA", name: "Afrique du Sud", prefix: "+27", flag: "🇿🇦" },
  { code: "TZ", name: "Tanzanie", prefix: "+255", flag: "🇹🇿" },
  { code: "TD", name: "Tchad", prefix: "+235", flag: "🇹🇩" },
  { code: "TG", name: "Togo", prefix: "+228", flag: "🇹🇬" },
  { code: "TN", name: "Tunisie", prefix: "+216", flag: "🇹🇳" },
  { code: "ZM", name: "Zambie", prefix: "+260", flag: "🇿🇲" },
  { code: "ZW", name: "Zimbabwe", prefix: "+263", flag: "🇿🇼" },
  { code: "FR", name: "France / Europe", prefix: "+33", flag: "🇪🇺" },
  { code: "CA", name: "Canada", prefix: "+1", flag: "🇨🇦" }
];

// Interactive live social proof notifications list
const LIVE_NOTIFICATIONS = [
  { name: "Sékou K.", city: "Abidjan", country: "🇨🇮", action: "vient de réserver son accès VIP" },
  { name: "Aminata D.", city: "Dakar", country: "🇸🇳", action: "regarde actuellement la vidéo secrète" },
  { name: "Marc-Aurèle O.", city: "Douala", country: "🇨🇲", action: "vient de valider son inscription" },
  { name: "Mariam T.", city: "Bamako", country: "🇲🇱", action: "génère déjà ses premiers revenus" },
  { name: "Rodrigue S.", city: "Libreville", country: "🇬🇦", action: "vient de rejoindre le canal VIP" },
  { name: "Fatoumata B.", city: "Conakry", country: "🇬🇳", action: "a réservé sa place exclusive" },
  { name: "Koffi A.", city: "Lomé", country: "🇹🇬", action: "vient de démarrer son accompagnement" },
  { name: "Arnaud N.", city: "Cotonou", country: "🇧🇯", action: "regarde la vidéo de formation" }
];

// High converting benefits list adapted from the sales page
const BENEFITS = [
  {
    id: "benefit-1",
    number: "01",
    icon: "📚",
    title: "Accès à des formations complètes",
    strongLabel: "pour apprendre à générer des revenus en ligne",
    description: "Découvrez la méthode étape-par-étape ultra simplifiée pour transformer votre simple téléphone en machine à sous ! 💸 Apprenez à votre rythme et commencez à encaisser sans aucune connaissance technique préalable. Tout est prémâché pour vous ! 🎉🚀",
    badge: "Inclus à vie 💎",
    accent: "from-yellow-500/10 to-transparent"
  },
  {
    id: "benefit-2",
    number: "02",
    icon: "🤝",
    title: "Vous êtes accompagné pas à pas",
    strongLabel: "jusqu’à l’atteinte de la liberté financière",
    description: "Vous n'êtes plus jamais seul ! 🫂 Notre équipe d'experts ultra motivés est disponible pour vous tenir par la main au quotidien, répondre à vos questions et vous booster vers les sommets. Ensemble, on va chercher votre succès ! 💪❤️",
    badge: "Suivi 1-on-1 🔥",
    accent: "from-orange-500/10 to-transparent"
  },
  {
    id: "benefit-3",
    number: "03",
    icon: "⚙️",
    title: "Vous avez accès à des systèmes",
    strongLabel: "simples et automatisés pour générer des revenus sur Internet",
    description: "Activez votre système automatisé en 1 clic ! ⚡ Copiez-collez nos tunnels secrets et nos processus de gains déjà optimisés pour votre téléphone. Laissez l'automatisation faire 90% du travail difficile ! 📱✨",
    badge: "Clé en main 🎯",
    accent: "from-yellow-500/10 to-transparent"
  },
  {
    id: "benefit-4",
    number: "04",
    icon: "🎁",
    title: "Récompenses mensuelles",
    strongLabel: "basées sur l’activité et la performance de l’utilisateur",
    description: "Gagnez des primes en cash et des bonus exclusifs chaque fin de mois ! 🎁 Plus vous participez et appliquez les conseils, plus notre écosystème vous récompense financièrement. C'est le booster ultime ! 💰🥳",
    badge: "Partage de Profits 🤑",
    accent: "from-orange-500/10 to-transparent"
  }
];

export default function App() {
  // Navigation & Scroll triggers
  const videoSectionRef = useRef<HTMLDivElement>(null);
  const ctaSectionRef = useRef<HTMLDivElement>(null);

  // States
  const [view, setView] = useState<'landing' | 'admin'>(() => {
    if (typeof window === "undefined") return "landing";
    const isPathAdmin = window.location.pathname === "/admin";
    const isHashAdmin = window.location.hash === "#/admin" || window.location.hash === "#admin";
    const isQueryAdmin = window.location.search.includes("page=admin") || window.location.search.includes("admin=true");
    return (isPathAdmin || isHashAdmin || isQueryAdmin) ? "admin" : "landing";
  });

  // Synchronize URL path with React state for /admin routing
  useEffect(() => {
    const handlePathChange = () => {
      const isPathAdmin = window.location.pathname === "/admin";
      const isHashAdmin = window.location.hash === "#/admin" || window.location.hash === "#admin";
      const isQueryAdmin = window.location.search.includes("page=admin") || window.location.search.includes("admin=true");
      
      if (isPathAdmin || isHashAdmin || isQueryAdmin) {
        setView("admin");
      } else {
        setView("landing");
      }
    };
    
    // Check path on mount or updates
    handlePathChange();
    window.addEventListener("popstate", handlePathChange);
    window.addEventListener("hashchange", handlePathChange);
    return () => {
      window.removeEventListener("popstate", handlePathChange);
      window.removeEventListener("hashchange", handlePathChange);
    };
  }, []);

  useEffect(() => {
    const currentPath = window.location.pathname;
    const currentHash = window.location.hash;
    const currentSearch = window.location.search;
    
    if (view === "admin") {
      const hasAdminIndicator = currentHash === "#/admin" || currentHash === "#admin" || currentSearch.includes("page=admin") || currentSearch.includes("admin=true");
      if (!hasAdminIndicator && currentPath !== "/admin") {
        window.history.pushState({}, "", "/admin");
      }
    } else if (view === "landing") {
      if (currentPath === "/admin" || currentHash === "#/admin" || currentHash === "#admin" || currentSearch.includes("page=admin") || currentSearch.includes("admin=true")) {
        window.history.pushState({}, "", "/");
      }
    }
  }, [view]);

  // Helper to retrieve or generate a unique visitor ID
  const getOrCreateVisitorId = () => {
    let id = localStorage.getItem("mz_visitor_id");
    if (!id) {
      id = "usr_" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      localStorage.setItem("mz_visitor_id", id);
    }
    return id;
  };

  // Track page visit on mount & launch active duration heartbeats
  useEffect(() => {
    const visitorId = getOrCreateVisitorId();
    const width = window.innerWidth;
    const deviceType = width < 768 ? "mobile" : width < 1024 ? "tablet" : "desktop";

    // Track initial page visit details
    apiClient.recordVisit({
      visitorId,
      path: window.location.pathname,
      referrer: document.referrer || "direct",
      deviceType,
      userAgent: navigator.userAgent,
      country: "Inconnu",
      countryCode: ""
    }).catch((err) => console.error("Error tracking visit:", err));

    // Keep page session duration updated with 10-second heartbeats
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        apiClient.recordDuration({ visitorId, duration: 10 }).catch(() => {});
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  
  // Lead state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [commitmentCheck, setCommitmentCheck] = useState(false);
  
  // Chariow Payment integration state
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [paymentError, setPaymentError] = useState("");

  // Live social proof toast state
  const [currentToast, setCurrentToast] = useState<typeof LIVE_NOTIFICATIONS[0] | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  // Fake remaining seats (highly effective CRO trigger)
  const [remainingSeats, setRemainingSeats] = useState(7);
  const [activeViewers, setActiveViewers] = useState(142);

  // Countdown Timer states for CTA
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [timerStarted, setTimerStarted] = useState(false);
  const [delayedMoveStarted, setDelayedMoveStarted] = useState(false);

  // Trigger delayed movement after 10 seconds of page load
  useEffect(() => {
    const timer = setTimeout(() => {
      setDelayedMoveStarted(true);
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  // Pricing urgency countdown timer
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      // Expiration Sunday, July 12, 2026, at 23:00 (11:00 PM)
      const targetDate = new Date("2026-07-12T23:00:00");
      const difference = +targetDate - +new Date();
      
      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isExpired: false
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Randomize viewers and seats occasionally
  useEffect(() => {
    const seatInterval = setInterval(() => {
      setRemainingSeats((prev) => (prev > 3 ? prev - 1 : prev));
    }, 45000);

    const viewerInterval = setInterval(() => {
      setActiveViewers((prev) => prev + Math.floor(Math.random() * 9) - 4);
    }, 5000);

    return () => {
      clearInterval(seatInterval);
      clearInterval(viewerInterval);
    };
  }, []);



  // Smooth scroll helper
  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // Luxury synthesizer sound on success
  const playChime = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const now = ctx.currentTime;

      // Base solid tone (warmth)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(329.63, now); // E4
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.3); // E5
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      // High golden twinkle chime
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(987.77, now + 0.08); // B5
      osc2.frequency.exponentialRampToValueAtTime(1318.51, now + 0.4); // E6
      gain2.gain.setValueAtTime(0, now);
      gain2.gain.setValueAtTime(0.12, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 1.3);
      osc2.start(now + 0.08);
      osc2.stop(now + 1.3);
    } catch (e) {
      console.log("Audio synthesize skipped");
    }
  };

  // Handles starting the video and scrolling perfectly to see both video & CTA
  const handleWatchVideo = () => {
    setIsPlaying(true);
    setTimerStarted(true);
    
    const visitorId = getOrCreateVisitorId();
    
    // Track video click in database using the unified events endpoint
    apiClient.recordEvent({
      visitorId,
      eventType: "click_watch_video",
      eventValue: 1
    }).catch((err) => console.error("Error tracking video event click:", err));
    
    apiClient.recordVideoClick({ source: "watch_video_cta" }).catch(() => {});
    
    // Give a brief moment for layout/render updates, then scroll with high precision
    setTimeout(() => {
      if (videoSectionRef.current) {
        const element = videoSectionRef.current;
        const rect = element.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        
        // Absolute position of section top and bottom relative to document
        const sectionTop = rect.top + window.scrollY;
        const sectionBottom = rect.bottom + window.scrollY;
        
        // Scroll so that the bottom of the section (containing the CTA) is 25px above the bottom of the screen
        let targetScroll = sectionBottom - viewportHeight + 25;
        
        // Ensure we do not scroll too far down that we lose the top of the video player
        // We can safely scroll past the Confidentiality header (approx 80px) if screen is tight
        const minScroll = sectionTop + 50;
        
        if (targetScroll < minScroll) {
          targetScroll = minScroll;
        }
        
        window.scrollTo({
          top: targetScroll,
          behavior: "smooth"
        });
      }
    }, 80);
  };

  // Countdown timer logic triggered when isPlaying changes to true
  useEffect(() => {
    if (!isPlaying) return;
    
    setTimerStarted(true);
    
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          playChime(); // Reward chime when registration unlocks!
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Dynamic Multi-Step Submission with direct high-converting redirect to Chariow Checkout
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !commitmentCheck) return;

    setIsLoading(true);
    setPaymentError("");
    setCheckoutUrl("");
    setLoadingText("Vérification de l'éligibilité...");

    // Keep the premium multi-step loading experience
    await new Promise((resolve) => setTimeout(resolve, 800));
    setLoadingText("Vérification des places réservées...");
    await new Promise((resolve) => setTimeout(resolve, 800));
    setLoadingText("Redirection vers la passerelle de paiement...");
    await new Promise((resolve) => setTimeout(resolve, 400));

    const targetUrl = "https://mzplus.mychariow.shop/prd_knd1e076";

    try {
      setCheckoutUrl(targetUrl);
      setIsLoading(false);
      setFormSubmitted(true);
      playChime();
      
      // Save to localStorage
      localStorage.setItem("mz_name", name);
      localStorage.setItem("mz_email", email);
      localStorage.setItem("mz_phone", phone);
      localStorage.setItem("mz_lead_registered", "true");

      // Save to server-side database for admin panel stats
      try {
        const visitorId = getOrCreateVisitorId();
        await apiClient.recordLead({
          name,
          email,
          phone,
          country: selectedCountry.name,
          countryCode: selectedCountry.flag,
          visitorId
        });
      } catch (err) {
        console.error("Failed to save lead in server database:", err);
      }

      // Direct redirection to the specified Chariow checkout URL
      try {
        window.location.href = targetUrl;
      } catch (err) {
        console.log("Direct redirect blocked or failed in sandbox iframe, fallback button active.", err);
      }
    } catch (err: any) {
      console.error("Redirection error:", err);
      setPaymentError("Une erreur est survenue lors de la redirection. Veuillez utiliser le bouton de paiement direct.");
      setIsLoading(false);
    }
  };

  // Close modal and reset state
  const closeModal = () => {
    setIsModalOpen(false);
    // Keep form submitted true or let them view success screen again
  };

  // Open registration redirect directly
  const openRegistrationModal = () => {
    const targetUrl = "https://mzplus.mychariow.shop/prd_knd1e076";
    const visitorId = getOrCreateVisitorId();
    
    // Log the click event to our database for admin analytics
    apiClient.recordLead({
      name: "Redirection Directe",
      email: "direct_checkout@chariow.shop",
      phone: "Direct",
      country: selectedCountry.name,
      countryCode: selectedCountry.flag,
      visitorId
    }).catch((err) => console.error("Failed to log redirect click:", err));

    // Track checkout click event
    apiClient.recordClick({
      email: "direct_checkout@chariow.shop",
      phone: "Direct",
      source: "direct_checkout_cta",
      visitorId
    }).catch(() => {});

    try {
      window.location.href = targetUrl;
    } catch (err) {
      console.log("Direct redirect failed/blocked, fallback window.open", err);
      window.open(targetUrl, "_blank");
    }
  };

  const faqs = [
    {
      q: "C'est quoi MZ+ ?",
      a: (
        <p className="text-gray-300 leading-relaxed">
          MZ+ est un système conçu pour vous permettre de générer des revenus en ligne afin de vous rapprocher de votre liberté financière. Grâce à nos formations, à notre accompagnement et aux différents moyens de génération de revenus que nous mettons à votre disposition, vous bénéficiez des ressources et des stratégies nécessaires pour développer progressivement des revenus sur Internet.
        </p>
      )
    },
    {
      q: "Quels sont les moyens de génération de revenus avec MZ+ ?",
      a: (
        <div className="space-y-4 text-gray-300 leading-relaxed">
          <p>Chez MZ+, plusieurs opportunités de revenus sont mises à votre disposition, notamment :</p>
          
          <div className="space-y-1">
            <h4 className="font-bold text-white flex items-center gap-1.5 text-xs sm:text-sm">
              <span>💼</span> L'affiliation (principal moyen de revenus)
            </h4>
            <p className="text-gray-400 pl-5">
              Vous recommandez des produits digitaux déjà conçus et percevez une commission à chaque vente réalisée grâce à votre lien d'affiliation.
            </p>
            <p className="text-gray-400 pl-5 mt-1 font-light italic">
              Vous n'avez <span className="text-white font-semibold">pas besoin de créer un produit</span>, de gérer le service client ou de développer une offre : tout est déjà prêt à l'emploi. Votre rôle consiste simplement à promouvoir les produits en appliquant les stratégies enseignées dans les formations.
            </p>
          </div>

          <div className="space-y-1">
            <h4 className="font-bold text-white flex items-center gap-1.5 text-xs sm:text-sm">
              <span>💰</span> Le programme de rémunération MZ+
            </h4>
            <p className="text-gray-400 pl-5">
              Les membres éligibles peuvent recevoir une rémunération versée chaque fin de mois. Le montant dépend de leur activité sur la plateforme ainsi que du respect des critères d'éligibilité du programme.
            </p>
          </div>

          <div className="space-y-1">
            <h4 className="font-bold text-white flex items-center gap-1.5 text-xs sm:text-sm">
              <span>🏆</span> Les challenges et conférences
            </h4>
            <p className="text-gray-400 pl-5">
              MZ+ organise également des challenges et des conférences qui permettent, selon les cas, de remporter des récompenses et de générer des revenus supplémentaires.
            </p>
          </div>
        </div>
      )
    },
    {
      q: "❓ Et si je ne connais rien ? Je n'ai aucune compétence.",
      a: (
        <div className="space-y-3 text-gray-300 leading-relaxed">
          <p className="font-bold text-white flex items-center gap-1.5">
            <span>✅</span> Aucun problème ! <span className="font-normal text-gray-300">Vous n'avez besoin d'aucune compétence particulière pour commencer.</span>
          </p>
          <p>
            <span>🎓</span> Chez MZ+, nous vous formons depuis les bases et vous accompagnons étape par étape afin de vous permettre de progresser dans les meilleures conditions. Notre objectif est de vous guider jusqu'à l'obtention de vos premiers résultats.
          </p>
          <p>
            <span>🚀</span> Même si vous partez de zéro et n'avez aucune expérience dans le domaine, vous pouvez tout à fait réussir.
          </p>
          <p className="text-gray-400 italic">
            <span>💬</span> D'ailleurs, c'est le cas de la grande majorité de nos membres, qui ont commencé sans connaissances particulières avant d'obtenir leurs premiers résultats grâce à la formation, aux stratégies et à l'accompagnement proposés par MZ+.
          </p>
        </div>
      )
    },
    {
      q: "❓ Comment vais-je recevoir mon argent ?",
      a: (
        <div className="space-y-2.5 text-gray-300 leading-relaxed">
          <p className="flex items-center gap-1.5">
            <span>💸</span> Vous recevez vos gains directement sur votre compte Mobile Money, en toute simplicité.
          </p>
          <p className="flex items-center gap-1.5">
            <span>📱</span> Vous n'avez pas besoin d'une carte bancaire, ni d'un compte PayPal pour recevoir vos paiements.
          </p>
          <p className="text-gray-400">
            <span>🔒</span> Les versements sont effectués de manière sécurisée via les principaux moyens de paiement mobile, tels que <span className="text-white font-semibold">MTN Mobile Money, Orange Money, Wave, M-Pesa, Airtel Money</span>, ainsi que d'autres services de Mobile Money disponibles selon votre pays.
          </p>
        </div>
      )
    },
    {
      q: "❓ Pourquoi l'inscription est-elle payante ?",
      a: (
        <div className="space-y-3.5 text-gray-300 leading-relaxed">
          <p className="font-bold text-white">
            <span>💎</span> Les frais d'inscription sont demandés parce qu'ils nous permettent de vous offrir <span className="text-[#D4AF37]">bien plus qu'un simple accès à une plateforme</span>.
          </p>
          <ul className="space-y-2 text-gray-400 pl-1">
            <li className="flex items-start gap-2">
              <span className="text-white">🎓</span>
              <span>Ils financent des formations complètes, régulièrement mises à jour, afin de vous transmettre les compétences nécessaires pour atteindre vos objectifs.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-white">👨‍🏫</span>
              <span>Ils permettent également de mettre à votre disposition un accompagnement personnalisé avec des coachs qui vous guident étape par étape tout au long de votre parcours.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-white">🖥️</span>
              <span>Une partie de ces frais est aussi consacrée au développement, à la maintenance et à l'optimisation de la plateforme, afin de vous garantir une expérience fluide, stable et de qualité.</span>
            </li>
          </ul>
          <p>
            <span>🚀</span> Notre objectif est de vous offrir un environnement sérieux, des outils performants et un accompagnement complet pour maximiser vos chances de réussite.
          </p>
          <p className="font-semibold text-[#D4AF37] bg-amber-500/5 py-2 px-3 rounded-xl border border-amber-500/10 text-center">
            <span>💰</span> Ce n'est donc pas simplement un coût : c'est un investissement dans vos compétences, votre évolution et votre avenir financier.
          </p>
        </div>
      )
    }
  ];

  if (view === 'admin') {
    return <AdminPanel onBackToHome={() => setView('landing')} />;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-gray-100 overflow-x-hidden selection:bg-[#D4AF37] selection:text-black font-sans relative">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#F27D26] opacity-10 blur-[120px] rounded-full pointer-events-none ambient-glow-orange" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-[#1E3A8A] opacity-10 blur-[100px] rounded-full pointer-events-none ambient-glow-blue" />

      {/* Top Luxury Exclusivity Ribbon */}
      <div className="w-full bg-gradient-to-r from-amber-950/40 via-black to-amber-950/40 border-b border-white/5 backdrop-blur-md py-2.5 px-4 text-center text-[10px] sm:text-xs tracking-wider uppercase font-semibold flex justify-center items-center gap-2 relative z-50 text-white/70">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse"></span>
        <span>Accès VIP Restreint :</span> 
        <span className="text-[#D4AF37] font-bold">{remainingSeats} places disponibles aujourd'hui</span>
        <span className="hidden md:inline text-white/40 font-normal">| {activeViewers} personnes analysent cette opportunité</span>
      </div>

      {/* Sleek Premium Navigation */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-4 flex justify-between items-center relative z-40">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-8 h-8 bg-gradient-to-br from-[#D4AF37] to-[#F27D26] rounded-sm transform rotate-45 flex items-center justify-center shadow-[0_0_15px_rgba(242,125,38,0.3)] group-hover:scale-105 transition-all">
            <span className="text-black font-black text-xs transform -rotate-45">MZ+</span>
          </div>
          <div>
            <span className="text-xl font-bold tracking-tighter uppercase text-white">
              MZ+ <span className="text-[#D4AF37] font-light">Elite</span>
            </span>
          </div>
        </div>

        {/* Minimalist Exclusivity Badge */}
        <div className="hidden sm:flex items-center gap-2 bg-white/[0.03] border border-white/10 px-4 py-1.5 rounded-full backdrop-blur-md">
          <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
          <span className="text-xs font-medium text-gray-300 font-display">Invitation Officielle Confirmée</span>
        </div>
      </header>

      {/* Main Hero & CRO Hook Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-5 md:pt-6 md:pb-12 text-center relative z-30">
        
        {/* Prestige Label */}
        <motion.div 
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/5 via-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-full px-3 py-1 md:px-4 md:py-1.5 mb-2.5 md:mb-5 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] animate-pulse" />
          <span className="text-[10px] md:text-xs uppercase font-semibold tracking-widest text-[#D4AF37] font-display">
            L'Élite de la Réussite Financière 
          </span>
        </motion.div>

        {/* Giant Main Conversion Hook */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] mb-2.5 md:mb-5 text-white font-display"
        >
          Génère jusqu'à <br className="hidden sm:inline" />
          <span className="relative inline-block px-2 text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#F27D26] to-[#D4AF37] drop-shadow-[0_0_15px_rgba(242,125,38,0.3)] select-all">
            1 000 000 FCFA
          </span> <br className="sm:hidden" />
          grâce à ce business.
        </motion.h1>

        {/* Magnetic Subtitle with elegant Sophisticated Dark left border style */}
        <div className="max-w-2xl mx-auto mb-3 md:mb-6 pl-4 md:pl-6 border-l-2 border-[#D4AF37]">
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-left text-xs sm:text-sm md:text-base text-white/70 font-light leading-relaxed"
          >
            L'opportunité conçue pour créer les <span className="text-white font-medium italic">futurs millionnaires</span> de cette génération. Regardez la présentation confidentielle ci-dessous.
          </motion.p>
        </div>

        {/* Responsive Objections micro-trust blocks */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1 mb-4 md:mb-8 text-[10px] sm:text-xs text-gray-400"
        >
          <div className="flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Aucune compétence requise</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-amber-550/50 hidden sm:block" />
          <div className="flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>100% faisable sur mobile</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-amber-550/50 hidden sm:block" />
          <div className="flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Accompagnement VIP</span>
          </div>
        </motion.div>

        {/* Primary Interactive Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex justify-center"
        >
          <motion.button
            onClick={handleWatchVideo}
            id="btn_watch_video_hero"
            animate={{ 
              scale: [1, 1.03, 1],
              rotate: [0, -12, 10, -12, 10, -8, 8, -4, 4, 0, 0]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 2.2, 
              ease: "easeInOut",
              times: [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 1]
            }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            className="group relative px-6 py-3 bg-gradient-to-r from-[#D4AF37] to-[#F27D26] rounded-full flex items-center justify-center gap-3 text-black font-bold text-xs sm:text-sm md:text-base shadow-[0_10px_35px_rgba(242,125,38,0.4)] cursor-pointer transition-all duration-300"
          >
            <span className="w-6 h-6 sm:w-7 sm:h-7 bg-black rounded-full flex items-center justify-center flex-shrink-0">
              <Play className="w-2.5 h-2.5 sm:w-3 text-[#F27D26] fill-[#F27D26] ml-0.5" />
            </span>
            <span className="tracking-wide">Regarder la vidéo</span>
            <ArrowRight className="w-4 h-4 text-black group-hover:translate-x-1.5 transition-transform" />
          </motion.button>
        </motion.div>

      </section>

      {/* Cinematic Premium Video Section */}
      <section 
        ref={videoSectionRef}
        id="section_video_player"
        className="max-w-5xl mx-auto px-4 sm:px-6 py-4 md:py-10 relative z-30"
      >
        {/* Subtle background blur decoration */}
        <div className="absolute inset-0 bg-[#F27D26]/2 rounded-[32px] blur-3xl pointer-events-none" />

        {/* Confidentiality Alert - Ultra compact */}
        <div className="text-center mb-6">
          <h2 className="text-xs sm:text-sm font-black tracking-widest text-[#D4AF37] uppercase font-display mb-1.5 flex items-center justify-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-ping" />
            CONFIDENTIALITÉ ABSOLUE
          </h2>
          <p className="text-[10px] sm:text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
            Ne partagez pas cette présentation. Les détails financiers révélés sont restreints.
          </p>
        </div>

        {/* Responsive layout: Beautifully centered vertical stack to fit both elements on screen simultaneously */}
        <div className="w-full flex flex-col items-center justify-center space-y-4 mx-auto transition-all duration-500 ease-in-out max-w-sm">
          
          {/* Re-established beautiful smartphone format video player wrapper */}
          <div className="w-full transition-all duration-500 ease-in-out bg-black rounded-[32px] border-[6px] border-[#1a1a1a] shadow-[0_40px_80px_rgba(0,0,0,0.8),0_0_25px_rgba(212,175,55,0.15)] relative overflow-hidden group/phone ring-1 ring-white/10 aspect-[9/16] max-w-[310px] sm:max-w-[340px]">
            
            {/* Phone notch element - always visible for realistic premium device aesthetic */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-b-xl z-30 flex items-center justify-center border-b border-l border-r border-white/5">
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-white/10" />
              <div className="w-8 h-0.5 rounded-full bg-zinc-800 ml-2" />
            </div>

            {/* Video Cover / Custom Play Trigger */}
            <AnimatePresence>
              {!isPlaying && (
                <motion.div 
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 z-20 bg-gradient-to-b from-zinc-950/95 via-black/95 to-zinc-950/95 flex flex-col items-center justify-between p-5 cursor-pointer"
                  onClick={handleWatchVideo}
                >
                  {/* Micro header inside phone */}
                  <div className="w-full pt-4 flex justify-between items-center text-[9px] text-gray-400 tracking-wider">
                    <span className="flex items-center gap-1 text-white/50">
                      <Users className="w-3 h-3 text-[#D4AF37]" />
                      142 connectés
                    </span>
                    <span className="bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[#D4AF37] px-2 py-0.5 rounded text-[9px] font-bold font-display uppercase tracking-widest">
                      LIVE MASTERCLASS
                    </span>
                  </div>

                  {/* Central Play button */}
                  <div className="flex flex-col items-center justify-center gap-4 py-6">
                    <div className="w-18 h-18 rounded-full border border-white/20 flex items-center justify-center bg-white/5 backdrop-blur-xl group-hover/phone:scale-105 transition-all duration-300">
                      <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-[0_0_18px_rgba(255,255,255,0.4)]">
                        <Play className="w-5 h-5 text-[#F27D26] fill-[#F27D26] ml-1" />
                      </div>
                    </div>
                    <div className="text-center px-1">
                      <p className="text-xs font-black text-white uppercase tracking-wider mb-1 font-display leading-tight">
                        CLIQUEZ POUR LANCER LA PRÉSENTATION
                      </p>
                      <p className="text-[10px] text-[#D4AF37] font-semibold flex items-center justify-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> 4 minutes chrono
                      </p>
                    </div>
                  </div>

                  {/* Micro benefits summary at bottom */}
                  <div className="w-full bg-white/[0.02] border border-white/5 rounded-xl p-3 text-center">
                    <p className="text-[9px] uppercase text-[#D4AF37] tracking-widest font-semibold mb-1.5">
                      Découvrez dans cette vidéo :
                    </p>
                    <ul className="text-[10px] text-gray-300 text-left space-y-1 max-w-[190px] mx-auto leading-normal">
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-[#D4AF37] flex-shrink-0" />
                        <span>Méthode 100K/semaine</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-[#D4AF37] flex-shrink-0" />
                        <span>Système automatisé MZ+</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-[#D4AF37] flex-shrink-0" />
                        <span>Preuves de gains réels</span>
                      </li>
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Embedded video player - always rendered to preload video instantly in the background */}
            <div className="absolute inset-0 w-full h-full z-10 bg-black">
              <CustomVideoPlayer
                isPlaying={isPlaying}
                onPlayStateChange={(playing) => {
                  if (playing) {
                    setTimerStarted(true);
                  }
                }}
                onEnded={() => {
                  setIsPlaying(false);
                }}
                onPlay={() => {
                  const visitorId = getOrCreateVisitorId();
                  apiClient.recordEvent({
                    visitorId,
                    eventType: "play_video",
                    eventValue: 1
                  }).catch(() => {});
                }}
                onProgress={(percent) => {
                  const visitorId = getOrCreateVisitorId();
                  apiClient.recordEvent({
                    visitorId,
                    eventType: "video_progress",
                    eventValue: percent
                  }).catch(() => {});
                }}
              />
            </div>
          </div>

          {/* Dynamic CTA Button (Matches screenshot exactly: capsules shape, sparkles left, chevron right) */}
          <div 
            ref={ctaSectionRef}
            className="w-full max-w-[310px] sm:max-w-[340px] pt-1 relative z-20 text-center animate-fade-in"
          >
            {/* Explanatory text to let user know they must watch the video to unlock access */}
            <div className="mb-2.5 text-[10px] font-bold tracking-wider text-[#D4AF37] uppercase flex items-center justify-center gap-1.5 bg-amber-500/5 py-1 px-3 rounded-full border border-amber-500/10">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
              {isPlaying ? "🔴 LECTURE DE LA VIDÉO EN COURS..." : "🎬 APPUYEZ SUR LA VIDÉO CI-DESSUS POUR COMPRENDRE LE SYSTÈME"}
            </div>

            <div className="w-full relative">
              <motion.button
                onClick={() => {
                  const targetEl = document.getElementById("section_benefits");
                  if (targetEl) {
                    targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }}
                id="btn_rejoindre_mz_cta"
                initial={{ scale: 0.95 }}
                animate={delayedMoveStarted ? {
                  scale: [1, 1.03, 1],
                  rotate: [0, -12, 10, -12, 10, -8, 8, -4, 4, 0, 0],
                  boxShadow: ["0 4px 15px rgba(242,125,38,0.25)", "0 4px 35px rgba(242,125,38,0.6)", "0 4px 15px rgba(242,125,38,0.25)"]
                } : { 
                  scale: 1,
                  y: 0,
                  rotate: 0,
                  boxShadow: "0 4px 15px rgba(242,125,38,0.2)"
                }}
                transition={delayedMoveStarted ? { 
                  repeat: Infinity, 
                  duration: 2.2, 
                  ease: "easeInOut",
                  times: [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 1]
                } : { duration: 0.3 }}
                className="group relative w-full py-4.5 bg-gradient-to-r from-[#D4AF37] to-[#F27D26] hover:scale-[1.03] active:scale-[0.98] text-black font-extrabold text-xs sm:text-sm rounded-full cursor-pointer flex items-center justify-between px-6 transition-all duration-300 font-display"
              >
                <Sparkles className="w-4 h-4 text-black fill-black flex-shrink-0" />
                <span className="tracking-wider uppercase font-black text-center flex-1">Je veux rejoindre MZ+</span>
                <ChevronRight className="w-4.5 h-4.5 text-black stroke-[3.5] group-hover:translate-x-1 transition-transform flex-shrink-0" />
              </motion.button>
            </div>
          </div>

        </div>
      </section>

      {/* Scroll indicator for instant CRO transition */}
      <div className="flex flex-col items-center justify-center -mt-2 mb-10 relative z-30 pointer-events-none">
        <p className="text-[10px] tracking-widest uppercase font-extrabold text-[#D4AF37]/80 mb-1 animate-pulse">
          Défilez pour découvrir les bénéfices exclusifs
        </p>
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="text-amber-500 text-sm font-black"
        >
          ▼
        </motion.div>
      </div>

      {/* Embedded Benefits Section - Compact, Super Vibrant Points with High Emotion */}
      <section id="section_benefits" className="max-w-xl mx-auto px-4 mb-8 relative z-30 scroll-mt-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 border-2 border-amber-500/40 rounded-3xl p-5 sm:p-6 backdrop-blur-md relative overflow-hidden shadow-[0_0_50px_rgba(212,175,55,0.2)]"
        >
          {/* Intense golden pulse indicator behind the title */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-12 bg-amber-500/15 rounded-full blur-2xl pointer-events-none animate-pulse" />

          <h2 className="text-xs uppercase tracking-widest text-[#D4AF37] font-black text-center mb-1">
            🔥 APRÈS VOTRE INSCRIPTION, VOUS AVEZ ACCÈS À :
          </h2>
          <p className="text-[9px] uppercase tracking-wider text-gray-400 text-center mb-5 font-bold animate-pulse">
            Profitez de votre opportunité unique aujourd'hui ! 🚀
          </p>

          <div className="space-y-3.5 mb-6 text-left">
            {/* Benefit 1 */}
            <div className="flex items-center gap-2.5 group">
              <span className="text-[#D4AF37] text-lg font-black shrink-0 animate-bounce">—</span>
              <p className="text-xs sm:text-sm font-extrabold text-white leading-tight group-hover:text-amber-300 transition-colors">
                Accès à des formations complètes qui vous permettront de gagner de l'argent 💸
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="flex items-center gap-2.5 group">
              <span className="text-[#D4AF37] text-lg font-black shrink-0 animate-bounce">—</span>
              <p className="text-xs sm:text-sm font-extrabold text-white leading-tight group-hover:text-amber-300 transition-colors">
                On t'accompagne étape par étape jusqu'à ta réussite ! 🤝❤️
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="flex items-center gap-2.5 group">
              <span className="text-[#D4AF37] text-lg font-black shrink-0 animate-bounce">—</span>
              <p className="text-xs sm:text-sm font-extrabold text-white leading-tight group-hover:text-amber-300 transition-colors">
                Vous pourrez générer des revenus et recevoir vos gains dès votre inscription ! ⚡💰
              </p>
            </div>

            {/* Benefit 4 */}
            <div className="flex items-center gap-2.5 group">
              <span className="text-[#D4AF37] text-lg font-black shrink-0 animate-bounce">—</span>
              <p className="text-xs sm:text-sm font-extrabold text-white leading-tight group-hover:text-amber-300 transition-colors">
                Vous avez droit à des récompenses mensuelles 🎁🏆
              </p>
            </div>
          </div>

          {/* Emotional High-converting Bottom CTA inside the benefit box */}
          <div className="border-t border-white/5 pt-5 text-center">
            <motion.button
              onClick={openRegistrationModal}
              initial={{ scale: 1 }}
              animate={{ 
                scale: [1, 1.03, 1],
                rotate: [0, -12, 10, -12, 10, -8, 8, -4, 4, 0, 0],
                boxShadow: ["0 4px 20px rgba(212,175,55,0.25)", "0 4px 35px rgba(212,175,55,0.6)", "0 4px 20px rgba(212,175,55,0.25)"]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 2.2, 
                ease: "easeInOut",
                times: [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 1]
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 bg-gradient-to-r from-yellow-400 via-[#D4AF37] to-amber-500 hover:brightness-110 text-black font-black text-xs sm:text-sm rounded-xl flex flex-col items-center justify-center gap-0.5 px-4 transition-all duration-300 font-display cursor-pointer"
            >
              <div className="flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-black fill-black shrink-0 animate-pulse" />
                <span className="tracking-wider uppercase font-black text-center text-xs sm:text-sm">
                  JE M'INCRIS MAINTENANT & TOUT DÉBLOQUER ⚡
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-black stroke-[3.5] shrink-0" />
              </div>
              <span className="text-[9px] opacity-90 font-bold tracking-wider uppercase">
                TARIF SPÉCIAL UNIQUE : SEULEMENT {getPriceForCountry(selectedCountry.code).amount} {getPriceForCountry(selectedCountry.code).currency} À VIE · SANS ABONNEMENT
              </span>
            </motion.button>
            <p className="text-[8px] text-[#D4AF37] mt-2.5 font-bold animate-pulse uppercase tracking-wider">
              🚀 PLACES LIMITÉES CE MOIS-CI · SÉCURISEZ VOTRE ACCÈS IMMÉDIAT !
            </p>
          </div>
        </motion.div>
      </section>

      {/* Hyper Emotional Proof of Success / Testimonials with lots of emojis */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 mb-12 relative z-30">
        <div className="text-center mb-6">
          <h2 className="text-xs uppercase tracking-widest text-amber-400 font-black mb-1 flex items-center justify-center gap-1.5">
            <span>🌟</span> PREUVES DE RÉUSSITE VIP <span>🌟</span>
          </h2>
          <h3 className="text-xl sm:text-2xl font-black text-white font-display">
            Leur vie a totalement changé ! 😍
          </h3>
          <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
            Découvrez les résultats sincères des membres actifs de la communauté !
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Testimonial 1 */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-zinc-900/60 border border-orange-500/20 rounded-2xl p-5 hover:border-amber-400/40 transition-all duration-300 relative shadow-md"
          >
            <div className="absolute top-2 right-2 text-xl">❤️</div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 flex items-center justify-center text-black font-black text-xs shadow">
                AD
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <p className="text-xs font-black text-white">Aminata D.</p>
                  <span className="text-xs">🇨🇮</span>
                </div>
                <p className="text-[9px] text-amber-300/80 font-bold">Abidjan · Membre VIP Actif</p>
              </div>
            </div>

            <div className="flex items-center gap-0.5 mb-2">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-xs text-yellow-400">★</span>
              ))}
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded-md ml-2 font-black">
                Membre Vérifié ✅
              </span>
            </div>

            <p className="text-[11px] text-gray-200 leading-relaxed font-normal italic">
              "C'est le paradis ! 😭 Je n'avais aucune base technique, mais les guides étape par étape de MZ+ m'ont tout appris avec mon téléphone portable ! J'ai déjà remboursé mon accès dès ma première semaine ! Merci infiniment ! ❤️"
            </p>
          </motion.div>

          {/* Testimonial 2 */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-zinc-900/60 border border-orange-500/20 rounded-2xl p-5 hover:border-amber-400/40 transition-all duration-300 relative shadow-md"
          >
            <div className="absolute top-2 right-2 text-xl">🔥</div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-yellow-400 flex items-center justify-center text-black font-black text-xs shadow">
                MS
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <p className="text-xs font-black text-white">Moussa S.</p>
                  <span className="text-xs">🇸🇳</span>
                </div>
                <p className="text-[9px] text-amber-300/80 font-bold">Dakar · Membre VIP Élite</p>
              </div>
            </div>

            <div className="flex items-center gap-0.5 mb-2">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-xs text-yellow-400">★</span>
              ))}
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded-md ml-2 font-black">
                VIP Élite ⭐
              </span>
            </div>

            <p className="text-[11px] text-gray-200 leading-relaxed font-normal italic">
              "Je n'en reviens toujours pas ! 🤯 Ma vie a totalement changé. J'applique juste les plans de MZ+ prémâchés et automatisés. C'est le meilleur choix de ma vie, l'accompagnement WhatsApp est tout simplement parfait !"
            </p>
          </motion.div>

          {/* Testimonial 3 */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-zinc-900/60 border border-orange-500/20 rounded-2xl p-5 hover:border-amber-400/40 transition-all duration-300 relative shadow-md"
          >
            <div className="absolute top-2 right-2 text-xl">🥳</div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 flex items-center justify-center text-black font-black text-xs shadow">
                YK
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <p className="text-xs font-black text-white">Youssef K.</p>
                  <span className="text-xs">🇲🇦</span>
                </div>
                <p className="text-[9px] text-amber-300/80 font-bold">Marrakech · Membre VIP</p>
              </div>
            </div>

            <div className="flex items-center gap-0.5 mb-2">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-xs text-yellow-400">★</span>
              ))}
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded-md ml-2 font-black">
                Succès Validé ✨
              </span>
            </div>

            <p className="text-[11px] text-gray-200 leading-relaxed font-normal italic">
              "La meilleure décision de ma vie ! 💎 L'ambiance dans le groupe est ultra énergique, positive et pleine d'entraide. Les récompenses de fin de mois basées sur notre activité boostent énormément ! Foncez sans hésiter !"
            </p>
          </motion.div>
        </div>
      </section>

      {/* High-Converting Pricing / Inscription Box - Expert Direct Sales Proposition */}
      <section id="section_pricing_inscription" className="mb-12 max-w-xl mx-auto px-4 relative z-30">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border-2 border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-center"
        >
          {/* Visual sparkles */}
          <div className="absolute top-3 right-3 animate-pulse text-lg">👑</div>
          <div className="absolute bottom-3 left-3 animate-bounce text-lg">✨</div>

          <span className="inline-block text-[9px] uppercase tracking-widest text-[#D4AF37] font-black bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 mb-3">
            PROPOSITION DE VENTE UNIQUE EXCLUSIVE ⏳
          </span>

          <h3 className="text-xl sm:text-2xl font-black text-white font-display mb-2 uppercase tracking-wide leading-tight">
            DEVENIR MEMBRE VIP À VIE
          </h3>
          
          <p className="text-xs text-gray-400 mb-6 max-w-sm mx-auto leading-relaxed">
            Rejoignez instantanément MZ+ et débloquez votre accompagnement, vos formations et votre système clé en main. Pas d'abonnement, pas de frais cachés.
          </p>

          {/* Countdown Timer Grid */}
          <div className="grid grid-cols-4 gap-2 max-w-xs mx-auto mb-6">
            <div className="bg-black/50 border border-white/10 rounded-xl py-2 px-1 text-center">
              <span className="block text-base sm:text-lg font-black font-display text-white leading-none">
                {timeLeft.isExpired ? "0" : timeLeft.days}
              </span>
              <span className="text-[9px] text-amber-500 uppercase font-bold tracking-wider">Jours</span>
            </div>
            <div className="bg-black/50 border border-white/10 rounded-xl py-2 px-1 text-center">
              <span className="block text-base sm:text-lg font-black font-display text-white leading-none">
                {timeLeft.isExpired ? "0" : timeLeft.hours}
              </span>
              <span className="text-[9px] text-amber-500 uppercase font-bold tracking-wider">Heures</span>
            </div>
            <div className="bg-black/50 border border-white/10 rounded-xl py-2 px-1 text-center">
              <span className="block text-base sm:text-lg font-black font-display text-white leading-none">
                {timeLeft.isExpired ? "0" : timeLeft.minutes}
              </span>
              <span className="text-[9px] text-amber-500 uppercase font-bold tracking-wider">Min</span>
            </div>
            <div className="bg-black/50 border border-white/10 rounded-xl py-2 px-1 text-center">
              <span className="block text-base sm:text-lg font-black font-display text-white leading-none">
                {timeLeft.isExpired ? "0" : timeLeft.seconds}
              </span>
              <span className="text-[9px] text-amber-500 uppercase font-bold tracking-wider">Sec</span>
            </div>
          </div>

          {/* Pricing display with interactive country resolution */}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 mb-6">
            <p className="text-xs text-gray-400 mb-1">Tarif Spécial Membre Unique :</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-sm font-bold opacity-40 line-through text-gray-500">
                {selectedCountry.code === "FR" || selectedCountry.code === "EU" ? "99 €" : `${selectedCountry.code === "CD" ? "250 000" : selectedCountry.code === "GN" ? "750 000" : "65 000"} ${getPriceForCountry(selectedCountry.code).currency}`}
              </span>
              <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 drop-shadow-[0_0_15px_rgba(212,175,55,0.3)] font-display">
                {getPriceForCountry(selectedCountry.code).amount} {getPriceForCountry(selectedCountry.code).currency}
              </span>
            </div>

            {/* Country Selector link inside checkout box */}
            <div className="mt-3 relative flex items-center justify-center gap-1.5">
              <span className="text-xs text-gray-400">Pays :</span>
              <button
                onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                className="text-xs font-bold text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{selectedCountry.flag} {selectedCountry.name}</span>
                <ChevronDown className="w-3 h-3 text-[#D4AF37]" />
              </button>

              <AnimatePresence>
                {countryDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 max-h-56 overflow-y-auto bg-zinc-950 border border-white/10 rounded-xl shadow-2xl z-50 p-1"
                  >
                    {COUNTRIES.map((country) => (
                      <button
                        key={country.code}
                        onClick={() => {
                          setSelectedCountry(country);
                          setCountryDropdownOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-white/[0.05] rounded-lg cursor-pointer transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <span>{country.flag}</span>
                          <span>{country.name}</span>
                        </span>
                        <span className="text-gray-400 font-mono">{country.prefix}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Primary CTA Button with price embedded inside for high conversion */}
          <motion.button
            onClick={openRegistrationModal}
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.04, 1], boxShadow: ["0 4px 20px rgba(242,125,38,0.25)", "0 4px 35px rgba(242,125,38,0.6)", "0 4px 20px rgba(242,125,38,0.25)"] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4.5 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 hover:brightness-110 text-black font-black text-xs sm:text-sm rounded-2xl flex flex-col items-center justify-center gap-0.5 px-6 transition-all duration-300 font-display cursor-pointer"
          >
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-black fill-black shrink-0" />
              <span className="tracking-widest uppercase font-black text-center text-xs sm:text-sm">
                S'INSCRIRE & COMMENCER VIP
              </span>
              <ChevronRight className="w-4 h-4 text-black stroke-[3.5] shrink-0" />
            </div>
            <span className="text-[10px] sm:text-[11px] opacity-80 font-black tracking-wider uppercase">
              SEULEMENT {getPriceForCountry(selectedCountry.code).amount} {getPriceForCountry(selectedCountry.code).currency} À VIE · SANS ABONNEMENT
            </span>
          </motion.button>

          <p className="text-[10px] text-amber-400/80 mt-3 font-bold flex items-center justify-center gap-1 animate-pulse">
            <span>🔒</span> PAIEMENT ULTRA SÉCURISÉ · ACCÈS IMMÉDIAT ET À VIE
          </p>
        </motion.div>
      </section>



      {/* Elegant Scannable Accordion FAQ section */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-12 relative z-30">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-white font-display mb-2">
            Questions Fréquentes
          </h2>
          <p className="text-xs sm:text-sm text-gray-400">
            Tout ce que vous devez savoir pour prendre votre décision dès aujourd'hui.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div 
                key={index} 
                className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                  className="w-full py-4.5 px-6 flex justify-between items-center text-left text-sm sm:text-base font-bold text-gray-200 hover:text-white transition-colors cursor-pointer"
                >
                  <span className="pr-4">{faq.q}</span>
                  <ChevronDown 
                    className={`w-4 h-4 text-[#D4AF37] transition-transform duration-300 flex-shrink-0 ${isOpen ? "rotate-180" : ""}`} 
                  />
                </button>
                
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="p-6 pt-0 text-xs sm:text-sm text-gray-400 leading-relaxed border-t border-white/[0.03]">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* Dynamic High-Converting FAQ Bottom CTA Section */}
      <section className="max-w-xl mx-auto px-4 mb-16 text-center relative z-30">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 border-2 border-amber-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-md relative overflow-hidden shadow-[0_0_50px_rgba(212,175,55,0.15)]"
        >
          {/* Intense subtle golden pulse indicator */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-12 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <span className="inline-block text-[9px] uppercase tracking-widest text-[#D4AF37] font-black bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 mb-3">
            DERNIÈRE ÉTAPE VERS VOTRE RÉUSSITE 🏆
          </span>

          <h3 className="text-lg sm:text-xl font-black text-white font-display mb-2 uppercase tracking-wide">
            🔥 REJOIGNEZ LES MEMBRES VIP MZ+ AUJOURD'HUI !
          </h3>
          
          <p className="text-xs text-gray-400 mb-6 max-w-sm mx-auto leading-relaxed">
            Toutes les réponses sont là. Votre plan de réussite est prêt. Prenez la décision qui va changer votre quotidien à jamais.
          </p>

          <motion.button
            onClick={openRegistrationModal}
            initial={{ scale: 1 }}
            animate={{ 
              scale: [1, 1.03, 1],
              rotate: [0, -12, 10, -12, 10, -8, 8, -4, 4, 0, 0],
              boxShadow: ["0 4px 20px rgba(212,175,55,0.25)", "0 4px 35px rgba(212,175,55,0.6)", "0 4px 20px rgba(212,175,55,0.25)"]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 2.2, 
              ease: "easeInOut",
              times: [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 1]
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 bg-gradient-to-r from-yellow-400 via-[#D4AF37] to-amber-500 hover:brightness-110 text-black font-black text-xs sm:text-sm rounded-xl flex flex-col items-center justify-center gap-0.5 px-4 transition-all duration-300 font-display cursor-pointer"
          >
            <div className="flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-black fill-black shrink-0 animate-pulse" />
              <span className="tracking-wider uppercase font-black text-center text-xs sm:text-sm">
                REJOINDRE MZ+ MAINTENANT & TOUT DE SUITE ⚡
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-black stroke-[3.5] shrink-0" />
            </div>
            <span className="text-[9px] opacity-90 font-bold tracking-wider uppercase">
              TARIF SPÉCIAL UNIQUE : SEULEMENT {getPriceForCountry(selectedCountry.code).amount} {getPriceForCountry(selectedCountry.code).currency} À VIE · SANS ABONNEMENT
            </span>
          </motion.button>
          
          <p className="text-[9px] text-[#D4AF37] mt-3 font-bold animate-pulse">
            🚀 PAS D'ENGAGEMENT · ACCÈS IMMÉDIAT ET À VIE
          </p>
        </motion.div>
      </section>

      {/* High-End Immersive Registration Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Modal Backdrop Blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />

            {/* Modal Body Container */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative w-full max-w-md bg-[#0b0b0b] border-2 border-white/10 rounded-[32px] p-6 sm:p-8 overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.8),0_0_25px_rgba(212,175,55,0.05)]"
            >
              
              {/* Decorative glows inside modal */}
              <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] rounded-full bg-[#D4AF37]/5 blur-[80px] pointer-events-none" />

              {/* Close button */}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.08] cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {!formSubmitted ? (
                <div>
                  {/* Modal Header */}
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center mx-auto mb-3 border border-[#D4AF37]/20">
                      <Award className="w-6 h-6 text-[#D4AF37]" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white font-display">
                      Candidature MZ+ VIP
                    </h3>
                    <div className="mt-2.5 inline-flex items-center gap-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/20 px-3.5 py-1 rounded-full">
                      <span className="text-[10px] text-gray-300 font-medium">Frais unique :</span>
                      <span className="text-xs text-[#D4AF37] font-black">{getPriceForCountry(selectedCountry.code).amount} {getPriceForCountry(selectedCountry.code).currency}</span>
                    </div>
                    <p className="text-xs text-white/50 mt-2 max-w-[280px] mx-auto">
                      Complétez vos coordonnées pour réserver l'une des {remainingSeats} places disponibles.
                    </p>
                  </div>

                  {/* Standard Lead Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {/* Name input */}
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-[#D4AF37] font-bold mb-1.5 font-display">
                        Votre Nom Complet
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Mamadou Koné"
                        className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-colors"
                      />
                    </div>

                    {/* Email input */}
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-[#D4AF37] font-bold mb-1.5 font-display">
                        Votre Adresse Email
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Ex: mamadou@gmail.com"
                        className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-colors"
                      />
                    </div>

                    {/* Country & Phone layout */}
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-[#D4AF37] font-bold mb-1.5 font-display">
                        Numéro WhatsApp Privé
                      </label>
                      <div className="flex gap-2">
                        {/* Custom dropdown */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                            className="flex items-center gap-1.5 bg-white/[0.02] border border-white/10 rounded-xl px-3 py-3 text-sm text-white cursor-pointer hover:bg-white/[0.05] transition-colors"
                          >
                            <span className="text-base">{selectedCountry.flag}</span>
                            <span className="text-xs font-semibold">{selectedCountry.prefix}</span>
                            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                          </button>

                          {/* Country Selection Dropdown list */}
                          <AnimatePresence>
                            {countryDropdownOpen && (
                              <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                className="absolute left-0 mt-2 w-56 max-h-56 overflow-y-auto bg-zinc-950 border border-white/10 rounded-xl shadow-2xl z-50 p-1"
                              >
                                {COUNTRIES.map((country) => (
                                  <button
                                    key={country.code}
                                    type="button"
                                    onClick={() => {
                                      setSelectedCountry(country);
                                      setCountryDropdownOpen(false);
                                    }}
                                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-white/[0.05] rounded-lg cursor-pointer transition-colors"
                                  >
                                    <span className="flex items-center gap-2">
                                      <span>{country.flag}</span>
                                      <span>{country.name}</span>
                                    </span>
                                    <span className="text-gray-400 font-mono">{country.prefix}</span>
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Phone text field */}
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Ex: 07 45 89 12"
                          className="flex-1 bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-colors"
                        />
                      </div>
                    </div>

                    {/* Neuromarketing Cognitive Commitment check */}
                    <div className="pt-2">
                      <label className="flex items-start gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          required
                          checked={commitmentCheck}
                          onChange={(e) => setCommitmentCheck(e.target.checked)}
                          className="mt-1 rounded border-white/10 text-[#D4AF37] focus:ring-[#D4AF37] bg-white/[0.02] accent-[#D4AF37]"
                        />
                        <span className="text-xs text-gray-400 leading-normal">
                          Je m'engage à consacrer au moins <span className="text-white font-semibold">2h par jour</span> pour suivre les instructions de MZ+ et viser le million de FCFA mensuel.
                        </span>
                      </label>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full group mt-4 relative bg-gradient-to-r from-[#D4AF37] to-[#F27D26] hover:scale-[1.02] active:scale-[0.98] text-black font-bold py-3.5 px-4 rounded-xl shadow-[0_10px_30px_rgba(242,125,38,0.2)] flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <svg className="animate-spin h-5 w-5 text-black" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span className="text-sm font-bold tracking-wide uppercase">{loadingText}</span>
                        </div>
                      ) : (
                        <>
                          <Send className="w-4 h-4 text-black" />
                          <span className="text-sm font-bold tracking-wide uppercase">Rejoindre le Système des Millionnaires</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                /* Cinematic Success and Onboarding Step Screen */
                <div className="text-center py-6">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", duration: 0.8 }}
                    className="w-16 h-16 bg-gradient-to-tr from-[#D4AF37] to-[#F27D26] rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(242,125,38,0.4)]"
                  >
                    <Check className="w-9 h-9 text-black stroke-[3]" />
                  </motion.div>

                  <h3 className="text-2xl font-black text-white font-display uppercase tracking-tight mb-2">
                    Demande Approuvée !
                  </h3>
                  
                  <p className="text-xs text-gray-400 max-w-[280px] mx-auto mb-6">
                    Félicitations <span className="text-white font-bold">{name}</span>, votre accès prioritaire est maintenant réservé pour les prochaines 15 minutes.
                  </p>

                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-left space-y-3 mb-6">
                    <p className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-extrabold text-center">
                      ÉTAPE CRUCIALE : PROCÉDER AU PAIEMENT
                    </p>
                    <p className="text-xs text-gray-300 text-center leading-relaxed">
                      Pour activer immédiatement vos accès VIP au système MZ+, veuillez finaliser votre paiement unique de <span className="text-white font-bold">{getPriceForCountry(selectedCountry.code).amount} {getPriceForCountry(selectedCountry.code).currency}</span> via notre passerelle sécurisée.
                    </p>
                  </div>

                  {/* Primary Secure Chariow Checkout Button */}
                  {checkoutUrl ? (
                    <a
                      href={checkoutUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={async () => {
                        try {
                          await apiClient.recordClick({
                            email: email,
                            phone: phone,
                            source: "landing_modal_checkout_cta",
                            visitorId: getOrCreateVisitorId()
                          });
                        } catch (err) {
                          console.error("Failed to track modal checkout click:", err);
                        }
                      }}
                      className="group relative w-full bg-gradient-to-r from-[#D4AF37] to-[#F27D26] hover:scale-[1.02] active:scale-[0.98] text-black font-black py-4 px-4 rounded-xl shadow-[0_0_25px_rgba(242,125,38,0.3)] hover:shadow-[0_0_35px_rgba(242,125,38,0.5)] flex items-center justify-center gap-2.5 transition-all duration-300 cursor-pointer"
                    >
                      <span className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F27D26] blur opacity-30 group-hover:opacity-60 transition-opacity animate-pulse" />
                      
                      <span className="relative flex items-center justify-center w-6 h-6 rounded-full bg-black/10">
                        <CheckCircle2 className="w-4 h-4 text-black" />
                      </span>
                      <span className="relative tracking-wider font-extrabold uppercase text-sm">PROCÉDER AU PAIEMENT SÉCURISÉ</span>
                    </a>
                  ) : (
                    <p className="text-xs text-rose-500 font-semibold mb-4">Lien de paiement introuvable.</p>
                  )}

                  {/* Secondary WhatsApp Support / Assistance Section */}
                  <div className="mt-6 pt-6 border-t border-white/5 space-y-2">
                    <p className="text-[10px] uppercase tracking-widest text-emerald-500 font-extrabold text-center">
                      BESOIN D'ASSISTANCE OU PREUVE DE PAIEMENT :
                    </p>
                    <p className="text-[11px] text-gray-400 mb-2">
                      Si vous rencontrez le moindre problème lors du paiement, contactez notre support VIP direct :
                    </p>
                    <a
                      href={`https://api.whatsapp.com/send?phone=2250700000000&text=${encodeURIComponent(
                        `Bonjour MZ+ Elite, je m'appelle ${name}. Je viens de m'inscrire depuis le pays ${selectedCountry.name} ${selectedCountry.flag} et je souhaite valider mon accès VIP au système pour un montant de ${getPriceForCountry(selectedCountry.code).amount} ${getPriceForCountry(selectedCountry.code).currency}.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="group w-full bg-white/[0.03] border border-white/10 hover:bg-emerald-500/10 hover:border-emerald-500 hover:text-emerald-400 text-gray-300 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer"
                    >
                      <span className="text-sm">💬</span>
                      <span className="text-xs uppercase tracking-wide">Contacter le Support WhatsApp VIP</span>
                    </a>
                  </div>

                  <button
                    onClick={() => setFormSubmitted(false)}
                    className="mt-4 text-xs text-gray-500 hover:text-gray-400 cursor-pointer underline transition-colors"
                  >
                    Corriger mes coordonnées
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Subtle bottom aesthetic micro-footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-white/[0.03] text-center text-[10px] sm:text-xs text-gray-500 relative z-30">
        <p className="mb-2 uppercase tracking-widest font-luxury text-amber-500/40">
          MZ+ Elite Club © 2026. Tous droits réservés.
        </p>
        <p className="max-w-md mx-auto leading-relaxed">
          Cette opportunité est réservée exclusivement aux personnes majeures et déterminées. Les gains affichés dépendent de l'implication de chaque membre dans la réalisation du programme d'action.
        </p>
      </footer>

    </div>
  );
}
