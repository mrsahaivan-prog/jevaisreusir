import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Award,
  Users,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  HelpCircle,
  ArrowLeft,
  CheckCircle2,
  Globe,
  Lock,
  Zap,
  Check,
  Flame,
  Rocket,
  Gift,
  Target,
  Heart,
  Clock
} from "lucide-react";

interface Country {
  code: string;
  name: string;
  prefix: string;
  flag: string;
}

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

export const getPriceForCountry = (countryCode: string) => {
  const code = countryCode.toUpperCase();
  switch (code) {
    case "CI":
    case "SN":
    case "CM":
    case "GA":
    case "TG":
    case "BJ":
    case "BF":
    case "ML":
    case "CG":
    case "NE":
      return { amount: "9 900", currency: "FCFA", rawAmount: 9900 };
    case "CD":
      return { amount: "45 000", currency: "CDF", rawAmount: 45000 };
    case "GN":
      return { amount: "145 000", currency: "GNF", rawAmount: 145000 };
    case "FR":
    case "BE":
    case "LU":
    case "DE":
    case "IT":
    case "ES":
    case "NL":
    case "AT":
    case "FI":
    case "IE":
    case "GR":
    case "PT":
    case "EU":
      return { amount: "15", currency: "€", rawAmount: 15 };
    case "CA":
      return { amount: "22", currency: "CAD", rawAmount: 22 };
    case "MA":
      return { amount: "150", currency: "MAD", rawAmount: 150 };
    default:
      return { amount: "9 900", currency: "FCFA", rawAmount: 9900 };
  }
};

const faqs = [
  {
    q: "C'est quoi MZ+ ?",
    a: (
      <p className="text-gray-300 leading-relaxed text-xs sm:text-sm">
        MZ+ est un système conçu pour vous permettre de générer des revenus en ligne afin de vous rapprocher de votre liberté financière. Grâce à nos formations, à notre accompagnement et aux différents moyens de génération de revenus que nous mettons à votre disposition, vous bénéficiez des ressources et des stratégies nécessaires pour développer progressivement des revenus sur Internet.
      </p>
    )
  },
  {
    q: "Quels sont les moyens de génération de revenus avec MZ+ ?",
    a: (
      <div className="space-y-4 text-gray-300 leading-relaxed text-xs sm:text-sm">
        <p>Chez MZ+, plusieurs opportunités de revenus sont mises à votre disposition, notamment :</p>
        
        <div className="space-y-1">
          <h4 className="font-bold text-white flex items-center gap-1.5 text-xs sm:text-sm">
            <span>💼</span> L'affiliation (principal moyen de revenus)
          </h4>
          <p className="text-gray-400 pl-5 text-xs sm:text-sm">
            Vous recommandez des produits digitaux déjà conçus et percevez une commission à chaque vente réalisée grâce à votre lien d'affiliation.
          </p>
          <p className="text-gray-400 pl-5 mt-1 font-light italic text-xs sm:text-sm">
            Vous n'avez <span className="text-white font-semibold">pas besoin de créer un produit</span>, de gérer le service client ou de développer une offre : tout est déjà prêt à l'emploi. Votre rôle consiste simplement à promouvoir les produits en appliquant les stratégies enseignées dans les formations.
          </p>
        </div>

        <div className="space-y-1">
          <h4 className="font-bold text-white flex items-center gap-1.5 text-xs sm:text-sm">
            <span>💰</span> Le programme de rémunération MZ+
          </h4>
          <p className="text-gray-400 pl-5 text-xs sm:text-sm">
            Les membres éligibles peuvent recevoir une rémunération versée chaque fin de mois. Le montant dépend de leur activité sur la plateforme ainsi que du respect des critères d'éligibilité du programme.
          </p>
        </div>

        <div className="space-y-1">
          <h4 className="font-bold text-white flex items-center gap-1.5 text-xs sm:text-sm">
            <span>🏆</span> Les challenges et conférences
          </h4>
          <p className="text-gray-400 pl-5 text-xs sm:text-sm">
            MZ+ organise également des challenges et des conférences qui permettent, selon les cas, de remporter des récompenses et de générer des revenus supplémentaires.
          </p>
        </div>
      </div>
    )
  },
  {
    q: "❓ Et si je ne connais rien ? Je n'ai aucune compétence.",
    a: (
      <div className="space-y-3 text-gray-300 leading-relaxed text-xs sm:text-sm">
        <p className="font-bold text-white flex items-center gap-1.5 text-xs sm:text-sm">
          <span>✅</span> Aucun problème ! <span className="font-normal text-gray-300">Vous n'avez besoin d'aucune compétence particulière pour commencer.</span>
        </p>
        <p>
          <span>🎓</span> Chez MZ+, nous vous formons depuis les bases et vous accompagnons étape par étape afin de vous permettre de progresser dans les meilleures conditions. Notre objectif est de vous guider jusqu'à l'obtention de vos premiers résultats.
        </p>
        <p>
          <span>🚀</span> Même si vous partez de zéro et n'avez aucune expérience dans le domaine, vous pouvez tout à fait réussir.
        </p>
        <p className="text-gray-400 italic text-xs sm:text-sm">
          <span>💬</span> D'ailleurs, c'est le cas de la grande majorité de nos membres, qui ont commencé sans connaissances particulières avant d'obtenir leurs premiers résultats grâce à la formation, aux stratégies et à l'accompagnement proposés par MZ+.
        </p>
      </div>
    )
  },
  {
    q: "❓ Comment vais-je recevoir mon argent ?",
    a: (
      <div className="space-y-2.5 text-gray-300 leading-relaxed text-xs sm:text-sm">
        <p className="flex items-center gap-1.5 text-xs sm:text-sm">
          <span>💸</span> Vous recevez vos gains directement sur votre compte Mobile Money, en toute simplicité.
        </p>
        <p className="flex items-center gap-1.5 text-xs sm:text-sm">
          <span>📱</span> Vous n'avez pas besoin d'une carte bancaire, ni d'un compte PayPal pour recevoir vos paiements.
        </p>
        <p className="text-gray-400 text-xs sm:text-sm">
          <span>🔒</span> Les versements sont effectués de manière sécurisée via les principaux moyens de paiement mobile, tels que <span className="text-white font-semibold">MTN Mobile Money, Orange Money, Wave, M-Pesa, Airtel Money</span>, ainsi que d'autres services de Mobile Money disponibles selon votre pays.
        </p>
      </div>
    )
  },
  {
    q: "❓ Pourquoi l'inscription est-elle payante ?",
    a: (
      <div className="space-y-3.5 text-gray-300 leading-relaxed text-xs sm:text-sm">
        <p className="font-bold text-white text-xs sm:text-sm">
          <span>💎</span> Les frais d'inscription sont demandés parce qu'ils nous permettent de vous offrir <span className="text-[#D4AF37]">bien plus qu'un simple accès à une plateforme</span>.
        </p>
        <ul className="space-y-2 text-gray-400 pl-1 text-xs sm:text-sm">
          <li className="flex items-start gap-2 text-xs sm:text-sm">
            <span className="text-white">🎓</span>
            <span>Ils financent des formations complètes, régulièrement mises à jour, afin de vous transmettre les compétences nécessaires pour atteindre vos objectifs.</span>
          </li>
          <li className="flex items-start gap-2 text-xs sm:text-sm">
            <span className="text-white">👨‍🏫</span>
            <span>Ils permettent également de mettre à votre disposition un accompagnement personnalisé avec des coachs qui vous guident étape par étape tout au long de votre parcours.</span>
          </li>
          <li className="flex items-start gap-2 text-xs sm:text-sm">
            <span className="text-white">🖥️</span>
            <span>Une partie de ces frais est aussi consacrée au développement, à la maintenance et à l'optimisation de la plateforme, afin de vous garantir une expérience fluide, stable et de qualité.</span>
          </li>
        </ul>
        <p>
          <span>🚀</span> Notre objectif est de vous offrir un environnement sérieux, des outils performants et un accompagnement complet pour maximiser vos chances de réussite.
        </p>
        <p className="font-semibold text-[#D4AF37] bg-amber-500/5 py-2 px-3 rounded-xl border border-amber-500/10 text-center text-xs sm:text-sm">
          <span>💰</span> Ce n'est donc pas simplement un coût : c'est un investissement dans vos compétences, votre évolution et votre avenir financier.
        </p>
      </div>
    )
  }
];

interface SalesPageProps {
  onJoinClick: (priceInfo: { amount: string; currency: string }) => void;
  onBackClick: () => void;
  selectedCountry: Country;
  onCountrySelect: (country: Country) => void;
}

export const SalesPage: React.FC<SalesPageProps> = ({
  onJoinClick,
  onBackClick,
  selectedCountry,
  onCountrySelect,
}) => {
  const [showCountrySelector, setShowCountrySelector] = useState<boolean>(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

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

  const priceInfo = getPriceForCountry(selectedCountry.code);

  const benefits = [
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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="min-h-screen bg-[#050505] text-gray-100 overflow-x-hidden relative pb-36"
    >
      {/* Dynamic Floating Emoji Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10 opacity-30 select-none">
        <div className="absolute top-[15%] left-[5%] animate-bounce text-3xl">💸</div>
        <div className="absolute top-[25%] right-[10%] animate-pulse text-4xl">🔥</div>
        <div className="absolute top-[45%] left-[12%] animate-bounce text-2xl">✨</div>
        <div className="absolute top-[65%] right-[5%] animate-pulse text-3xl">🚀</div>
        <div className="absolute top-[80%] left-[8%] animate-bounce text-4xl">💰</div>
        <div className="absolute top-[90%] right-[15%] animate-pulse text-3xl">🎉</div>
      </div>

      {/* Radiant ultra-warm glow gradients for high energy */}
      <div className="absolute top-[-5%] right-[-10%] w-[450px] h-[450px] bg-amber-500 opacity-10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-[35%] left-[-10%] w-[450px] h-[450px] bg-orange-600 opacity-10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[15%] right-[5%] w-[400px] h-[400px] bg-yellow-500 opacity-5 blur-[120px] rounded-full pointer-events-none" />

      {/* Header / Top Navigation */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex justify-between items-center relative z-40">
        <button
          onClick={onBackClick}
          id="btn_back_to_presentation"
          className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-amber-400 transition-colors cursor-pointer group bg-white/[0.02] border border-white/5 py-1.5 px-3 rounded-xl backdrop-blur-md"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-amber-500" />
          <span>⬅️ Voir la présentation</span>
        </button>

        <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          <span className="text-[10px] sm:text-xs font-extrabold text-amber-300 uppercase tracking-wider">
            Rejoindre MZ+ VIP 👑
          </span>
        </div>
      </header>

      {/* Main content body */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 relative z-30 pt-2">
        
        {/* Main Emotional Hook Title with Emojis */}
        <section className="text-center mb-8 relative">
          <div className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 rounded-full px-3 py-1 mb-4">
            <span className="text-xs">⚡</span>
            <span className="text-[10px] tracking-widest uppercase font-black text-amber-300">
              ACCÈS INSTANTANÉ ÉLITE
            </span>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.25] text-white font-display max-w-2xl mx-auto"
          >
            🔥 Rejoins le système qui va créer les <br />
            <span className="relative inline-block mt-1 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-300 drop-shadow-[0_0_20px_rgba(242,125,38,0.35)] animate-pulse">
              MILLIONNAIRES DE CETTE GÉNÉRATION 🚀
            </span>
          </motion.h1>

          <p className="text-xs sm:text-sm text-amber-400/90 font-medium mt-3 max-w-md mx-auto flex items-center justify-center gap-1.5">
            <span>✨</span> Ne laisse pas passer ta chance unique d'intégrer le club ! <span>💸</span>
          </p>
        </section>

        {/* Benefits Section - Super Vibrant Cards */}
        <section className="mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="bg-gradient-to-b from-zinc-900/85 to-zinc-950/95 border-2 border-orange-500/20 rounded-3xl p-5 sm:p-7 backdrop-blur-md relative overflow-hidden shadow-[0_20px_50px_rgba(242,125,38,0.1)]"
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

            <h2 className="text-xs sm:text-sm uppercase tracking-widest text-amber-300 font-extrabold text-center mb-6 flex items-center justify-center gap-1.5">
              <span className="text-base">🎉</span>
              Voici ce que tu débloques après inscription :
              <span className="text-base">👇</span>
            </h2>

            {/* Grid of highly emotional benefits */}
            <div className="space-y-4">
              {benefits.map((b, idx) => (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.08 }}
                  id={`benefit_card_${idx}`}
                  className="group relative bg-gradient-to-r from-zinc-950 to-zinc-900/60 border border-white/10 rounded-2xl p-4 sm:p-5 hover:border-amber-400/40 transition-all duration-300 flex flex-col sm:flex-row items-start gap-4 shadow-lg overflow-hidden"
                >
                  {/* Luxury dynamic color beam on hover */}
                  <div className={`absolute top-0 left-0 w-28 h-28 bg-gradient-to-br ${b.accent} opacity-30 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-500`} />

                  {/* Icon Badge Side */}
                  <div className="flex sm:flex-col items-center justify-between sm:justify-start gap-2.5 w-full sm:w-auto shrink-0">
                    <span className="font-mono text-[9px] font-black text-amber-400/80 tracking-widest bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      ÉTAPE {b.number} ⭐
                    </span>
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30 text-2xl shadow-md group-hover:scale-110 transition-transform">
                      {b.icon}
                    </div>
                  </div>

                  {/* Copywriting side */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wide text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-lg">
                        {b.badge}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-extrabold text-white leading-snug">
                      {b.title}{" "}
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-amber-300 font-black block sm:inline">
                        {b.strongLabel}
                      </span>
                    </h3>

                    <p className="text-[11px] sm:text-xs text-gray-300 leading-relaxed font-normal">
                      {b.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Elegant Animated Scroll Indicator right under benefits card */}
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mt-6 flex flex-col items-center justify-center gap-1.5 cursor-pointer pb-1"
              onClick={() => {
                const ctaEl = document.getElementById("btn_sales_page_mid_cta");
                if (ctaEl) {
                  ctaEl.scrollIntoView({ behavior: "smooth", block: "center" });
                }
              }}
            >
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-400 hover:text-amber-400 transition-colors flex items-center gap-1">
                Défile vers le bas pour réserver ton accès exclusif 👇
              </span>
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="w-5 h-8 border border-white/20 rounded-full flex justify-center p-1"
              >
                <div className="w-1.5 h-1.5 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-full" />
              </motion.div>
            </motion.div>
          </motion.div>
        </section>

        {/* Dynamic & Hyper Exciting Middle Call To Action */}
        <div className="my-8 text-center max-w-md mx-auto px-4 relative z-40">
          <motion.button
            onClick={() => onJoinClick(priceInfo)}
            id="btn_sales_page_mid_cta"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              scale: [1, 1.05, 0.98, 1.04, 1],
              rotate: [0, 1.5, -1.5, 1, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 2,
              ease: "easeInOut"
            }}
            className="relative w-full py-5 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 text-black font-black text-sm rounded-2xl shadow-[0_15px_35px_rgba(242,125,38,0.4)] cursor-pointer transition-all duration-300 flex items-center justify-between px-6 font-display overflow-hidden group border-2 border-yellow-300"
          >
            {/* Sheen reflection effect */}
            <span className="absolute inset-y-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12 shimmer-effect pointer-events-none" />
            <span className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
            
            <div className="flex items-center gap-2 relative z-10">
              <span className="text-lg">🔥</span>
              <span className="tracking-widest uppercase font-black text-xs sm:text-sm">
                Je m'inscris maintenant !
              </span>
            </div>

            <div className="flex items-center gap-2 relative z-10 font-black">
              <span className="text-[10px] font-bold opacity-60 line-through mr-1 text-black">
                {selectedCountry.code === "FR" || selectedCountry.code === "EU" ? "99 €" : `${selectedCountry.code === "CD" ? "250 000" : selectedCountry.code === "GN" ? "750 000" : "65 000"} ${priceInfo.currency}`}
              </span>
              <span className="bg-black text-yellow-300 text-xs px-3.5 py-1.5 rounded-xl border border-white/15 font-black shadow-md">
                {priceInfo.amount} {priceInfo.currency}
              </span>
              <ChevronRight className="w-4 h-4 text-black stroke-[3.5] group-hover:translate-x-1.5 transition-transform" />
            </div>
          </motion.button>
          
          <p className="text-[10px] text-amber-400/80 mt-2.5 font-bold flex items-center justify-center gap-1 animate-pulse">
            <span>🔒</span> INSCRIPTION ULTRA SÉCURISÉE · PLACES TRÈS LIMITÉES ⏳
          </p>
        </div>

        {/* Hyper Emotional Proof of Success / Testimonials with lots of emojis */}
        <section className="mb-10 relative">
          <div className="text-center mb-6">
            <h2 className="text-xs uppercase tracking-widest text-amber-400 font-black mb-1 flex items-center justify-center gap-1.5">
              <span>🌟</span> PREUVES DE RÉUSSITE VIP <span>🌟</span>
            </h2>
            <h3 className="text-xl sm:text-2xl font-black text-white font-display">
              Leur vie a totalement changé ! 😍
            </h3>
            <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
              Regarde les résultats incroyables et sincères des membres de la communauté !
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



        {/* High-Converting CTA Box in place of old country detection */}
        <section className="mb-10 max-w-xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border-2 border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-center"
          >
            {/* Visual sparkles */}
            <div className="absolute top-3 right-3 animate-pulse text-lg">👑</div>
            <div className="absolute bottom-3 left-3 animate-bounce text-lg">✨</div>

            <h3 className="text-lg sm:text-xl font-black text-white font-display mb-2 uppercase tracking-wide">
              🌟 RÉSERVE TA PLACE DANS LE SYSTÈME 🌟
            </h3>

            {/* High-Converting Countdown Timer Grid directly integrated in CTA Box */}
            <div className="grid grid-cols-4 gap-2 max-w-xs mx-auto mb-4 mt-2">
              <div className="bg-black/50 border border-white/10 rounded-xl py-2 px-1 text-center">
                <span className="block text-base sm:text-lg font-black font-display text-white leading-none">
                  {timeLeft.isExpired ? "0" : timeLeft.days}
                </span>
                <span className="text-[7px] uppercase tracking-widest text-gray-500 font-extrabold">Jours</span>
              </div>
              <div className="bg-black/50 border border-white/10 rounded-xl py-2 px-1 text-center">
                <span className="block text-base sm:text-lg font-black font-display text-amber-400 leading-none">
                  {timeLeft.isExpired ? "00" : String(timeLeft.hours).padStart(2, "0")}
                </span>
                <span className="text-[7px] uppercase tracking-widest text-gray-500 font-extrabold">Heures</span>
              </div>
              <div className="bg-black/50 border border-white/10 rounded-xl py-2 px-1 text-center">
                <span className="block text-base sm:text-lg font-black font-display text-amber-400 leading-none">
                  {timeLeft.isExpired ? "00" : String(timeLeft.minutes).padStart(2, "0")}
                </span>
                <span className="text-[7px] uppercase tracking-widest text-gray-500 font-extrabold">Min</span>
              </div>
              <div className="bg-black/50 border border-white/10 rounded-xl py-2 px-1 text-center">
                <span className="block text-base sm:text-lg font-black font-display text-orange-500 leading-none animate-pulse">
                  {timeLeft.isExpired ? "00" : String(timeLeft.seconds).padStart(2, "0")}
                </span>
                <span className="text-[7px] uppercase tracking-widest text-gray-500 font-extrabold">Sec</span>
              </div>
            </div>

            <p className="text-xs text-gray-400 max-w-sm mx-auto mb-5 leading-relaxed">
              Accédez instantanément au club privé, aux formations complètes, aux outils automatisés et à l'accompagnement VIP avant l'expiration définitive dimanche à 23h !
            </p>

            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 mb-6 max-w-xs mx-auto">
              <p className="text-[10px] text-amber-400 uppercase tracking-widest font-black mb-1">
                Tarif Exceptionnel - Accès à Vie
              </p>
              <div className="flex items-center justify-center gap-2.5">
                <span className="text-xs text-gray-500 line-through font-bold">
                  {selectedCountry.code === "FR" || selectedCountry.code === "EU" ? "99 €" : `${selectedCountry.code === "CD" ? "250 000" : selectedCountry.code === "GN" ? "750 000" : "65 000"} ${priceInfo.currency}`}
                </span>
                <span className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-yellow-300">
                  {priceInfo.amount} {priceInfo.currency}
                </span>
              </div>
              <p className="text-[9px] text-emerald-400 font-bold mt-1">
                ✅ Économie immédiate de plus de 85%
              </p>
            </div>

            <motion.button
              onClick={() => onJoinClick(priceInfo)}
              id="btn_pricing_box_cta"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="relative w-full py-4.5 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 text-black font-black text-sm rounded-2xl shadow-[0_12px_25px_rgba(242,125,38,0.3)] cursor-pointer hover:shadow-[0_15px_30px_rgba(242,125,38,0.5)] transition-all duration-300 flex items-center justify-center gap-2 font-display uppercase tracking-wider"
            >
              <Sparkles className="w-4 h-4 text-black fill-black animate-pulse animate-spin" />
              <span>Rejoindre le Système des Millionnaires</span>
              <ChevronRight className="w-4 h-4 text-black stroke-[3]" />
            </motion.button>

            <div className="mt-5 flex items-center justify-center gap-2">
              <span className="text-sm">{selectedCountry.flag}</span>
              <p className="text-xs text-gray-400">
                Région sélectionnée : <span className="font-bold text-white">{selectedCountry.name}</span>
              </p>
              <button
                onClick={() => setShowCountrySelector(!showCountrySelector)}
                className="text-[10px] text-amber-400 hover:text-amber-300 transition-colors underline font-bold tracking-widest uppercase ml-1 cursor-pointer"
              >
                (Modifier)
              </button>
            </div>

            {/* Picker list with flags */}
            <AnimatePresence>
              {showCountrySelector && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 bg-zinc-950 border border-orange-500/20 rounded-2xl max-h-56 overflow-y-auto p-2"
                >
                  <p className="text-[9px] uppercase font-black tracking-widest text-amber-400 py-1.5 border-b border-white/5 mb-2 text-center">
                    Sélectionnez votre pays 🗺️
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {COUNTRIES.map((country) => (
                      <button
                        key={country.code}
                        onClick={() => {
                          onCountrySelect(country);
                          setShowCountrySelector(false);
                        }}
                        className={`flex items-center gap-2 px-3 py-2.5 text-left text-xs rounded-xl transition-all cursor-pointer ${
                          selectedCountry.code === country.code
                            ? "bg-amber-500/20 text-white border-2 border-amber-500/40 font-bold"
                            : "text-gray-400 hover:text-white hover:bg-white/[0.04] border border-transparent"
                        }`}
                      >
                        <span className="text-sm">{country.flag}</span>
                        <span className="truncate">{country.name}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </section>

        {/* Elegant Accordion FAQ Section on the Sales Page */}
        <section className="max-w-xl mx-auto px-4 py-8 relative z-30 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-white font-display mb-1.5">
              Questions Fréquentes
            </h2>
            <p className="text-[11px] sm:text-xs text-gray-400">
              Tout ce que vous devez savoir pour prendre votre décision dès aujourd'hui.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div 
                  key={index} 
                  className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full py-4 px-5 flex justify-between items-center text-left text-xs sm:text-sm font-bold text-gray-200 hover:text-white transition-colors cursor-pointer"
                  >
                    <span className="pr-4">{faq.q}</span>
                    <ChevronDown 
                      className={`w-3.5 h-3.5 text-[#D4AF37] transition-transform duration-300 flex-shrink-0 ${isOpen ? "rotate-180" : ""}`} 
                    />
                  </button>
                  
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className="p-5 pt-0 text-xs text-gray-400 leading-relaxed border-t border-white/[0.03]">
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

        {/* Emotion Trust Counters */}
        <section className="text-center max-w-lg mx-auto py-1">
          <div className="grid grid-cols-3 gap-3 text-center bg-zinc-900/30 border border-white/5 p-3 rounded-2xl">
            <div className="p-1">
              <p className="text-xl font-black text-white leading-none">🛡️ 100%</p>
              <p className="text-[9px] text-amber-400 uppercase font-black mt-1 tracking-wider">Sécurisé & Garanti</p>
            </div>
            <div className="p-1 border-x border-white/10">
              <p className="text-xl font-black text-white leading-none">💬 Direct</p>
              <p className="text-[9px] text-amber-400 uppercase font-black mt-1 tracking-wider">Lien WhatsApp VIP</p>
            </div>
            <div className="p-1">
              <p className="text-xl font-black text-white leading-none">⚡ 05 min</p>
              <p className="text-[9px] text-amber-400 uppercase font-black mt-1 tracking-wider">Mise en place rapide</p>
            </div>
          </div>
        </section>

      </main>

      {/* Dynamic & Exciting Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-black via-zinc-950/98 to-transparent border-t border-orange-500/20 backdrop-blur-xl">
        <div className="max-w-md mx-auto flex flex-col items-center justify-center">
          
          {/* Subtle ultra-emotional count down text */}
          <div className="text-[10px] font-black text-orange-400 flex items-center gap-1 mb-2 bg-orange-500/10 py-1 px-3.5 rounded-full border border-orange-500/20 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
            <span>⚠️ TARIF EXCLUSIF EXPIRE LE 12/07 À 23H :</span>
            <span className="text-white font-mono bg-black/60 px-1.5 py-0.5 rounded ml-1 border border-orange-500/20 text-[11px] tracking-wide font-black">
              {timeLeft.isExpired ? "EXPIRED" : `${timeLeft.days}j ${String(timeLeft.hours).padStart(2, "0")}h ${String(timeLeft.minutes).padStart(2, "0")}m ${String(timeLeft.seconds).padStart(2, "0")}s`}
            </span>
          </div>

          {/* Golden animated bouncy CTA */}
          <motion.button
            onClick={() => onJoinClick(priceInfo)}
            id="btn_sales_page_sticky_cta"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            animate={{
              scale: [1, 1.05, 0.98, 1.04, 1],
              rotate: [0, 1.2, -1.2, 0.8, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 2,
              ease: "easeInOut"
            }}
            className="relative w-full py-5 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 text-black font-black text-sm rounded-2xl shadow-[0_15px_40px_rgba(242,125,38,0.4)] cursor-pointer transition-all duration-300 flex items-center justify-between px-6 font-display overflow-hidden group border-2 border-yellow-300"
          >
            {/* Glossy sheen */}
            <span className="absolute inset-y-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12 shimmer-effect pointer-events-none" />
            
            <div className="flex items-center gap-2 relative z-10">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-80"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-black"></span>
              </span>
              <span className="tracking-widest uppercase font-black text-xs sm:text-sm">
                Je m'inscris maintenant ! 🚀
              </span>
            </div>

            <div className="flex items-center gap-2.5 relative z-10 font-black">
              <span className="text-[10px] font-bold opacity-60 line-through mr-1 text-black">
                {selectedCountry.code === "FR" || selectedCountry.code === "EU" ? "99 €" : `${selectedCountry.code === "CD" ? "250 000" : selectedCountry.code === "GN" ? "750 000" : "65 000"} ${priceInfo.currency}`}
              </span>
              <span className="bg-black text-yellow-300 text-xs px-3.5 py-1.5 rounded-xl border border-white/15 font-black shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                {priceInfo.amount} {priceInfo.currency}
              </span>
              <ChevronRight className="w-4 h-4 text-black stroke-[4] group-hover:translate-x-1.5 transition-transform" />
            </div>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
