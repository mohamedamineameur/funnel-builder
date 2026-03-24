"use client";

import type { FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import QueryStatsRoundedIcon from "@mui/icons-material/QueryStatsRounded";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import ViewQuiltRoundedIcon from "@mui/icons-material/ViewQuiltRounded";
import WorkspacesRoundedIcon from "@mui/icons-material/WorkspacesRounded";
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Fade,
  LinearProgress,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

interface GenerateResponse {
  success?: boolean;
  message?: string;
  error?: string;
  page?: unknown;
}

type PromptMode = "free" | "guided";
type ColorMode = "model" | "palette" | "custom";
type GradientMode = "model" | "with" | "without";
type HeroImageMode = "none" | "context" | "custom";
type DescriptionMode = "context" | "custom";

interface GuidedPromptState {
  websiteName: string;
  businessDescription: string;
  product: string;
  productOther: string;
  pageType: string;
  pageTypeOther: string;
  goal: string;
  goalOther: string;
  complexity: string;
  complexityOther: string;
  pageLength: string;
  pageLengthOther: string;
  audience: string;
  audienceOther: string;
  awarenessLevel: string;
  awarenessLevelOther: string;
  geography: string;
  geographyOther: string;
  promise: string;
  promiseOther: string;
  marketingAngle: string;
  marketingAngleOther: string;
  proofLevel: string;
  proofLevelOther: string;
  style: string;
  styleOther: string;
  ambiance: string;
  ambianceOther: string;
  uiStyle: string;
  uiStyleOther: string;
  cornerStyle: string;
  cornerStyleOther: string;
  tone: string;
  toneOther: string;
  copyStyle: string;
  copyStyleOther: string;
  colorMode: ColorMode;
  gradientMode: GradientMode;
  palette: string;
  paletteOther: string;
  customPrimary: string;
  customSecondary: string;
  customAccent: string;
  customBackground: string;
  customText: string;
  heroLayout: string;
  heroLayoutOther: string;
  heroContent: string;
  heroContentOther: string;
  heroMedia: string;
  heroMediaOther: string;
  heroImageMode: HeroImageMode;
  heroImageCustomDescription: string;
  galleryImageCount: string;
  imageDisplay: string;
  imageDisplayOther: string;
  galleryDescriptionMode: DescriptionMode;
  galleryCustomDescription: string;
  cta: string;
  ctaOther: string;
  secondaryCta: string;
  secondaryCtaOther: string;
  formGoal: string;
  formGoalOther: string;
  formFriction: string;
  formFrictionOther: string;
  funnelStage: string;
  funnelStageOther: string;
  offerType: string;
  offerTypeOther: string;
  urgency: string;
  urgencyOther: string;
  language: string;
  languageOther: string;
  targetDevice: string;
  targetDeviceOther: string;
  density: string;
  densityOther: string;
  accessibility: string;
  accessibilityOther: string;
  headerStyle: string;
  headerStyleOther: string;
  footerStyle: string;
  footerStyleOther: string;
  sections: string[];
  sectionsOther: string;
  advancedSections: string[];
  advancedSectionsOther: string;
  requiredSections: string[];
  requiredSectionsOther: string;
  forbiddenSections: string[];
  forbiddenSectionsOther: string;
  proofElements: string[];
  proofElementsOther: string;
  formFields: string[];
  formFieldsOther: string;
  animationTypes: string[];
  animationTypesOther: string;
  specializedFocus: string[];
  specializedFocusOther: string;
  referenceVisual: string;
  avoidThings: string;
  promiseSentence: string;
  mainObjection: string;
  differentiator: string;
  emotion: string;
  quickAction: string;
  notes: string;
}

interface SelectWithOtherFieldProps {
  label: string;
  value: string;
  otherValue: string;
  options: readonly string[];
  onValueChange: (value: string) => void;
  onOtherChange: (value: string) => void;
  helperText?: string;
  otherLabel?: string;
  placeholder?: string;
}

interface CheckboxSuggestionGroupProps {
  label: string;
  options: readonly string[];
  values: string[];
  onToggle: (value: string) => void;
  helperText?: string;
  otherValue: string;
  onOtherChange: (value: string) => void;
  otherLabel?: string;
}

interface FieldPanelProps {
  title: string;
  description?: string;
  children: ReactNode;
}

interface PalettePreviewDefinition {
  value: string;
  label: string;
  description: string;
  colors: [string, string, string, string];
  isDark?: boolean;
}

interface ThemeConstraintPayload {
  name?: string;
  cornerStyle?: "sharp" | "balanced" | "rounded";
  palette: {
    primary: string;
    secondary: string;
    background: string;
    textPrimary: string;
    textSecondary: string;
    accent: string;
    muted: string;
  };
}

const DEFAULT_PROMPT = `Genere une page de vente pour une patisserie artisanale haut de gamme a Montreal.
Je veux une hero tres appetissante, une section avantages, des creations signatures, des avis clients,
un formulaire de commande, une FAQ et un footer. Le ton doit etre premium, chaleureux et gourmand.`;

const OTHER_VALUE = "__other__";

const PRODUCT_OPTIONS = [
  "Application mobile",
  "SaaS B2B",
  "Patisserie artisanale",
  "Formation en ligne",
  "Service local",
  "E-commerce",
  "Cabinet / consultant",
  "Restaurant",
  "Cours en ligne",
  "Application cybersécurité",
  OTHER_VALUE,
] as const;

const PAGE_TYPE_OPTIONS = [
  "Landing page",
  "Waitlist",
  "Page de vente",
  "Page de lancement",
  "Lead magnet",
  "Webinar",
  "Quiz funnel",
  "Page de prise de rendez-vous",
  "Preorder",
  "Coming soon",
  "Comparatif",
  "Page pricing",
  "Page portfolio",
  "Page restaurant",
  "Page evenement",
  "Page recrutement",
  "Page app mobile",
  "Page SaaS B2B",
  "Page coach / consultant",
  OTHER_VALUE,
] as const;

const GOAL_OPTIONS = [
  "Generer des leads",
  "Obtenir des inscriptions",
  "Reserver un appel",
  "Faire acheter",
  "Faire telecharger une app",
  "Rejoindre une waitlist",
  "Reserver une table",
  "Demander un devis",
  "Repondre a un quiz",
  "Telecharger un guide",
  "Voir une demo",
  OTHER_VALUE,
] as const;

const COMPLEXITY_OPTIONS = [
  "Tres simple",
  "Simple",
  "Moyen",
  "Premium detaille",
  "Funnel complet",
  OTHER_VALUE,
] as const;

const PAGE_LENGTH_OPTIONS = [
  "Courte",
  "Moyenne",
  "Longue",
  "Tres longue",
  OTHER_VALUE,
] as const;

const AUDIENCE_OPTIONS = [
  "Debutants",
  "Experts",
  "Etudiants",
  "PME",
  "Startups",
  "Grands comptes",
  "Parents",
  "Freelances",
  "Createurs",
  "Developpeurs",
  "RH",
  "Responsables marketing",
  "Restaurateurs",
  "Acheteurs haut de gamme",
  OTHER_VALUE,
] as const;

const AWARENESS_LEVEL_OPTIONS = [
  "Ne connait pas le probleme",
  "Connait le probleme",
  "Cherche une solution",
  "Compare des options",
  "Pret a acheter",
  OTHER_VALUE,
] as const;

const GEOGRAPHY_OPTIONS = [
  "Local",
  "National",
  "International",
  "Francophone",
  "Anglophone",
  "Bilingue",
  OTHER_VALUE,
] as const;

const PROMISE_OPTIONS = [
  "Gain de temps",
  "Gain d'argent",
  "Simplicite",
  "Performance",
  "Securite",
  "Fiabilite",
  "Luxe",
  "Rapidité",
  "Croissance",
  "Serenite",
  "Statut / prestige",
  OTHER_VALUE,
] as const;

const MARKETING_ANGLE_OPTIONS = [
  "Comparatif",
  "Transformation avant/apres",
  "Social proof",
  "Urgence / rarete",
  "Expertise",
  "Produit premium",
  "Produit accessible",
  "Pedagogique",
  "Storytelling",
  "Resultats chiffres",
  OTHER_VALUE,
] as const;

const PROOF_LEVEL_OPTIONS = [
  "Leger",
  "Modere",
  "Fort",
  "Tres fort",
  OTHER_VALUE,
] as const;

const STYLE_OPTIONS = [
  "Minimal",
  "Premium",
  "Luxe",
  "SaaS moderne",
  "Corporate",
  "Editorial",
  "Bold",
  "Futuriste",
  "Dark mode",
  "Light mode",
  "Mobile-first",
  "App-like",
  "High contrast",
  "Soft / airy",
  "Dense / information-rich",
  OTHER_VALUE,
] as const;

const AMBIANCE_OPTIONS = [
  "Chaleureuse",
  "Froide / tech",
  "Serieuse",
  "Energique",
  "Elegante",
  "Fun",
  "Creative",
  "Sobre",
  "Institutionnelle",
  "Haut de gamme",
  OTHER_VALUE,
] as const;

const UI_STYLE_OPTIONS = [
  "Cartes",
  "Sections plates",
  "Glassmorphism",
  "Bordures visibles",
  "Ombres legeres",
  "Ombres fortes",
  "Interface type dashboard",
  "Interface type magazine",
  "UI type app mobile",
  OTHER_VALUE,
] as const;

const CORNER_STYLE_OPTIONS = [
  "Coins nets",
  "Coins equilibres",
  "Coins tres arrondis",
  OTHER_VALUE,
] as const;

const TONE_OPTIONS = [
  "Professionnel",
  "Premium",
  "Luxe",
  "Pedagogique",
  "Rassurant",
  "Expert",
  "Chaleureux",
  "Energique",
  "Minimal",
  "Audacieux",
  OTHER_VALUE,
] as const;

const COPY_STYLE_OPTIONS = [
  "Clair et simple",
  "Axe conversion",
  "Storytelling",
  "Axe benefices",
  "Axe preuves",
  "Tres premium",
  "Tres direct",
  OTHER_VALUE,
] as const;

const COLOR_MODE_OPTIONS = [
  { value: "model", label: "Laisser le modele choisir" },
  { value: "palette", label: "Choisir une palette suggeree" },
  { value: "custom", label: "Choisir mes couleurs" },
] as const;

const GRADIENT_MODE_OPTIONS = [
  { value: "model", label: "Laisser le modele choisir" },
  { value: "with", label: "Avec gradients" },
  { value: "without", label: "Sans gradient" },
] as const;

const PALETTE_LIBRARY: readonly PalettePreviewDefinition[] = [
  {
    value: "Bleu corporate",
    label: "Bleu corporate",
    description: "SaaS rassurant, propre, B2B.",
    colors: ["#0f172a", "#1d4ed8", "#38bdf8", "#f8fafc"],
  },
  {
    value: "Noir et blanc premium",
    label: "Noir et blanc premium",
    description: "Luxe, editorial, contraste fort.",
    colors: ["#0f172a", "#111827", "#f59e0b", "#f8fafc"],
    isDark: true,
  },
  {
    value: "Violet neon",
    label: "Violet neon",
    description: "Futuriste, app, startup créative.",
    colors: ["#140f24", "#8b5cf6", "#d946ef", "#faf5ff"],
    isDark: true,
  },
  {
    value: "Rose / orange vibrant",
    label: "Rose / orange vibrant",
    description: "Energy, conversion, lifestyle.",
    colors: ["#431407", "#f97316", "#ec4899", "#fff7ed"],
  },
  {
    value: "Vert nature",
    label: "Vert nature",
    description: "Santé, bio, confiance douce.",
    colors: ["#052e16", "#10b981", "#14b8a6", "#f0fdf4"],
  },
  {
    value: "Terracotta chaleureux",
    label: "Terracotta chaleureux",
    description: "Artisanal, chaleureux, humain.",
    colors: ["#7c2d12", "#c2410c", "#fb923c", "#fff7ed"],
  },
  {
    value: "Bleu / cyan tech",
    label: "Bleu / cyan tech",
    description: "IA, automation, crédibilité tech.",
    colors: ["#0f172a", "#0ea5a4", "#2f80ed", "#eff6ff"],
  },
  {
    value: "Monochrome sobre",
    label: "Monochrome sobre",
    description: "Ultra minimal, très clean.",
    colors: ["#111827", "#334155", "#94a3b8", "#f8fafc"],
  },
  {
    value: "Accent unique",
    label: "Accent unique",
    description: "Base neutre + une couleur forte.",
    colors: ["#0f172a", "#475569", "#2563eb", "#ffffff"],
  },
  {
    value: "Ocean premium",
    label: "Ocean premium",
    description: "Bleu profond + aqua premium.",
    colors: ["#082f49", "#0369a1", "#22d3ee", "#f0f9ff"],
  },
  {
    value: "Sunset tropical",
    label: "Sunset tropical",
    description: "Coloré, solaire, mémorable.",
    colors: ["#7c2d12", "#f97316", "#f43f5e", "#fff1f2"],
  },
  {
    value: "Indigo product",
    label: "Indigo product",
    description: "Produit logiciel premium et dense.",
    colors: ["#1e1b4b", "#4338ca", "#818cf8", "#eef2ff"],
  },
  {
    value: "Emerald finance",
    label: "Emerald finance",
    description: "Fiabilité, performance, sérieux.",
    colors: ["#052e16", "#059669", "#34d399", "#ecfdf5"],
  },
  {
    value: "Graphite lime",
    label: "Graphite lime",
    description: "Tech contrastée, plus tranchante.",
    colors: ["#111827", "#1f2937", "#84cc16", "#f7fee7"],
  },
  {
    value: "Medical trust",
    label: "Medical trust",
    description: "Clinique, apaisant, très lisible.",
    colors: ["#0f172a", "#0ea5e9", "#22c55e", "#f0fdf4"],
  },
  {
    value: "Luxury aubergine",
    label: "Luxury aubergine",
    description: "Premium haut de gamme, editorial.",
    colors: ["#2e1065", "#581c87", "#e9d5ff", "#faf5ff"],
    isDark: true,
  },
  {
    value: "Minimal beige",
    label: "Minimal beige",
    description: "Sobre, créatif, design studio.",
    colors: ["#44403c", "#78716c", "#d6d3d1", "#fafaf9"],
  },
  {
    value: "Cyber dark",
    label: "Cyber dark",
    description: "Cyber, sécurité, interface sombre.",
    colors: ["#020617", "#0f172a", "#06b6d4", "#111827"],
    isDark: true,
  },
  {
    value: "Midnight SaaS",
    label: "Midnight SaaS",
    description: "Fond sombre premium, SaaS moderne, accents froids.",
    colors: ["#020617", "#1d4ed8", "#22d3ee", "#0f172a"],
    isDark: true,
  },
  {
    value: "Teal dark studio",
    label: "Teal dark studio",
    description: "Fond sombre teal, clean, tres produit tech.",
    colors: ["#071c1c", "#14b8a6", "#67e8f9", "#0b2525"],
    isDark: true,
  },
  {
    value: "Graphite purple dark",
    label: "Graphite purple dark",
    description: "Graphite profond, violet premium, contraste assume.",
    colors: ["#111827", "#7c3aed", "#c084fc", "#1f2937"],
    isDark: true,
  },
  {
    value: "Carbon orange dark",
    label: "Carbon orange dark",
    description: "Fond charbon, accents orange, energie directe.",
    colors: ["#0a0a0a", "#f97316", "#fb923c", "#171717"],
    isDark: true,
  },
  {
    value: "Royal gold",
    label: "Royal gold",
    description: "Prestige, haut ticket, autorité.",
    colors: ["#1f2937", "#92400e", "#fbbf24", "#fffbeb"],
  },
  {
    value: "Fresh startup",
    label: "Fresh startup",
    description: "Jeune, énergique, moderne.",
    colors: ["#0f172a", "#2563eb", "#22c55e", "#eff6ff"],
  },
  {
    value: "Creator candy",
    label: "Creator candy",
    description: "Créateur, social, playful.",
    colors: ["#312e81", "#8b5cf6", "#fb7185", "#fdf2f8"],
  },
  {
    value: "Warm coffee",
    label: "Warm coffee",
    description: "Artisanal, café, humain.",
    colors: ["#292524", "#a16207", "#f59e0b", "#fefce8"],
  },
  {
    value: "Slate red",
    label: "Slate red",
    description: "Forte personnalité, direct response.",
    colors: ["#1e293b", "#ef4444", "#fb7185", "#fff1f2"],
  },
  {
    value: "Azure glass",
    label: "Azure glass",
    description: "App moderne, légère, lumineuse.",
    colors: ["#082f49", "#0ea5e9", "#7dd3fc", "#f0f9ff"],
  },
  {
    value: "Forest editorial",
    label: "Forest editorial",
    description: "Nature premium, storytelling.",
    colors: ["#14532d", "#15803d", "#86efac", "#f0fdf4"],
  },
  {
    value: "Soft lavender",
    label: "Soft lavender",
    description: "Doux, féminin, premium soft.",
    colors: ["#4c1d95", "#8b5cf6", "#c4b5fd", "#faf5ff"],
  },
  {
    value: "Steel orange",
    label: "Steel orange",
    description: "Indus, énergique, conversion.",
    colors: ["#1f2937", "#f97316", "#fdba74", "#fff7ed"],
  },
  {
    value: "Mint product",
    label: "Mint product",
    description: "Produit clean, frais, moderne.",
    colors: ["#164e63", "#14b8a6", "#99f6e4", "#f0fdfa"],
  },
  {
    value: "Cherry luxe",
    label: "Cherry luxe",
    description: "Mode, beauté, premium marqué.",
    colors: ["#4c0519", "#be123c", "#fb7185", "#fff1f2"],
  },
  {
    value: "Other",
    label: "Autre",
    description: "Décris ta palette personnalisée.",
    colors: ["#0f172a", "#475569", "#94a3b8", "#f8fafc"],
  },
] as const;

const PALETTE_OPTIONS = PALETTE_LIBRARY.map((palette) =>
  palette.value === "Other" ? OTHER_VALUE : palette.value,
) as readonly string[];

const HERO_LAYOUT_OPTIONS = [
  "Centre",
  "Split",
  "Image a droite",
  "Formulaire a droite",
  OTHER_VALUE,
] as const;

const HERO_CONTENT_OPTIONS = [
  "Titre + sous-titre",
  "Titre + badges",
  "Titre + chiffres cles",
  "Titre + visuel",
  "Titre + formulaire",
  "Titre + preuve sociale",
  OTHER_VALUE,
] as const;

const HERO_MEDIA_OPTIONS = [
  "Sans media",
  "Image produit",
  "Image lifestyle",
  "Mockup app",
  "Dashboard",
  "Illustration",
  "Video",
  OTHER_VALUE,
] as const;

const HERO_IMAGE_OPTIONS = [
  { value: "none", label: "Pas d'image hero" },
  { value: "context", label: "Image hero selon le contexte" },
  { value: "custom", label: "Je donne le descriptif du hero" },
] as const;

const IMAGE_DESCRIPTION_OPTIONS = [
  { value: "context", label: "Selon le contexte" },
  { value: "custom", label: "Je donne le descriptif" },
] as const;

const GALLERY_IMAGE_COUNT_OPTIONS = ["0", "1", "2", "3", "4", "5", "6"] as const;

const IMAGE_DISPLAY_OPTIONS = [
  "Le modele choisit",
  "Hero uniquement",
  "Sequence d'images",
  "Grille galerie",
  "Style carousel",
  "Style masonry",
  "Split showcase",
  "Slider plein ecran",
  "Avant / apres",
  OTHER_VALUE,
] as const;

const CTA_OPTIONS = [
  "Creer un compte",
  "Essayer gratuitement",
  "Demander une demo",
  "Commencer maintenant",
  "Prendre rendez-vous",
  "Recevoir une soumission",
  "Commander maintenant",
  "Rejoindre la waitlist",
  "Voir les tarifs",
  OTHER_VALUE,
] as const;

const SECONDARY_CTA_OPTIONS = [
  "En savoir plus",
  "Voir la demo",
  "Voir les temoignages",
  "Voir les prix",
  "Decouvrir le produit",
  OTHER_VALUE,
] as const;

const FORM_GOAL_OPTIONS = [
  "Inscription",
  "Reservation",
  "Demande de devis",
  "Contact",
  "Precommande",
  "Audit gratuit",
  "Candidature",
  OTHER_VALUE,
] as const;

const FORM_FRICTION_OPTIONS = [
  "Tres faible",
  "Faible",
  "Moyen",
  "Qualificatif",
  OTHER_VALUE,
] as const;

const FUNNEL_STAGE_OPTIONS = [
  "Decouverte",
  "Consideration",
  "Conversion",
  "Activation",
  "Upsell",
  "Reassurance",
  OTHER_VALUE,
] as const;

const OFFER_TYPE_OPTIONS = [
  "Gratuit",
  "Freemium",
  "Abonnement",
  "One-shot",
  "Sur devis",
  "Premium",
  OTHER_VALUE,
] as const;

const URGENCY_OPTIONS = [
  "Aucune",
  "Places limitees",
  "Offre temporaire",
  "Lancement",
  "Compte a rebours",
  OTHER_VALUE,
] as const;

const LANGUAGE_OPTIONS = [
  "Francais",
  "Anglais",
  "Bilingue",
  OTHER_VALUE,
] as const;

const TARGET_DEVICE_OPTIONS = [
  "Mobile-first",
  "Desktop-first",
  "Responsive equilibre",
  OTHER_VALUE,
] as const;

const DENSITY_OPTIONS = [
  "Aeree",
  "Normale",
  "Dense",
  OTHER_VALUE,
] as const;

const ACCESSIBILITY_OPTIONS = [
  "Contraste fort",
  "Tres lisible",
  "Police plus grande",
  "Interface simple",
  OTHER_VALUE,
] as const;

const HEADER_STYLE_OPTIONS = [
  "Discret",
  "Tres visible",
  "Minimal",
  "Sticky",
  "Avec menu mobile premium",
  OTHER_VALUE,
] as const;

const FOOTER_STYLE_OPTIONS = [
  "Minimal",
  "Riche",
  "Tres simple",
  "Informations legales visibles",
  OTHER_VALUE,
] as const;

const SECTION_OPTIONS = [
  "navbar",
  "hero",
  "benefits",
  "trust_bar",
  "stats",
  "form",
  "testimonials",
  "faq",
  "cta_banner",
  "comparison",
  "gallery",
  "video",
  "rich_text",
  "countdown",
  "pricing",
  "logo_cloud",
  "steps",
  "footer",
] as const;

const ADVANCED_SECTION_OPTIONS = [
  "Objections / reponses",
  "Garanties",
  "Cas d'usage",
  "Pour qui / pas pour qui",
  "Timeline",
  "Avant / apres",
  "Methodologie",
  "Fonctionnement en 3 etapes",
  "Logos partenaires",
  "Bonus inclus",
  "Limitations assumees",
  "Equipe / fondateur",
] as const;

const PROOF_ELEMENT_OPTIONS = [
  "Avis clients",
  "Temoignages video",
  "Notes moyennes",
  "Logos clients",
  "Nombre d'utilisateurs",
  "Certifications",
  "Recompenses",
  "Avant / apres",
  "Etudes de cas",
] as const;

const FORM_FIELD_OPTIONS = [
  "Nom",
  "Email",
  "Telephone",
  "Entreprise",
  "Taille d'equipe",
  "Budget",
  "Besoin principal",
  "Date souhaitee",
  "Type d'offre",
  "Message libre",
] as const;

const ANIMATION_OPTIONS = [
  "Compteurs animes",
  "Barres de progression animees",
  "Fade-in sections",
  "Slide-up sections",
  "Stagger sur cartes",
  "Hover cards",
  "Hover buttons",
  "Carousel autoplay",
  "Progression de formulaire",
] as const;

const SPECIALIZED_FOCUS_OPTIONS = [
  "Dashboard mockup",
  "Integrations",
  "ROI",
  "Cas client",
  "Plats signatures",
  "Ambiance restaurant",
  "Ingredients premium",
  "Menu",
  "Reservation",
  "Certifications",
  "Quiz",
  "Securite / confiance",
  "Parcours patient",
  "Equipe",
  "Packaging",
] as const;

const DEFAULT_GUIDED_STATE: GuidedPromptState = {
  websiteName: "",
  businessDescription: "",
  product: "Application mobile",
  productOther: "",
  pageType: "Landing page",
  pageTypeOther: "",
  goal: "Obtenir des inscriptions",
  goalOther: "",
  complexity: "Moyen",
  complexityOther: "",
  pageLength: "Moyenne",
  pageLengthOther: "",
  audience: "Grand public",
  audienceOther: "",
  awarenessLevel: "Cherche une solution",
  awarenessLevelOther: "",
  geography: "Francophone",
  geographyOther: "",
  promise: "Simplicite",
  promiseOther: "",
  marketingAngle: "Axe benefices",
  marketingAngleOther: "",
  proofLevel: "Modere",
  proofLevelOther: "",
  style: "Mobile-first",
  styleOther: "",
  ambiance: "Energique",
  ambianceOther: "",
  uiStyle: "Cartes",
  uiStyleOther: "",
  cornerStyle: "Coins equilibres",
  cornerStyleOther: "",
  tone: "Professionnel",
  toneOther: "",
  copyStyle: "Clair et simple",
  copyStyleOther: "",
  colorMode: "model",
  gradientMode: "model",
  palette: "Bleu corporate",
  paletteOther: "",
  customPrimary: "#2563eb",
  customSecondary: "#1d4ed8",
  customAccent: "#38bdf8",
  customBackground: "#f8fafc",
  customText: "#0f172a",
  heroLayout: "Split",
  heroLayoutOther: "",
  heroContent: "Titre + visuel",
  heroContentOther: "",
  heroMedia: "Image produit",
  heroMediaOther: "",
  heroImageMode: "context",
  heroImageCustomDescription: "",
  galleryImageCount: "1",
  imageDisplay: "Le modele choisit",
  imageDisplayOther: "",
  galleryDescriptionMode: "context",
  galleryCustomDescription: "",
  cta: "Creer un compte",
  ctaOther: "",
  secondaryCta: "En savoir plus",
  secondaryCtaOther: "",
  formGoal: "Inscription",
  formGoalOther: "",
  formFriction: "Faible",
  formFrictionOther: "",
  funnelStage: "Conversion",
  funnelStageOther: "",
  offerType: "Freemium",
  offerTypeOther: "",
  urgency: "Aucune",
  urgencyOther: "",
  language: "Francais",
  languageOther: "",
  targetDevice: "Mobile-first",
  targetDeviceOther: "",
  density: "Normale",
  densityOther: "",
  accessibility: "Tres lisible",
  accessibilityOther: "",
  headerStyle: "Sticky",
  headerStyleOther: "",
  footerStyle: "Riche",
  footerStyleOther: "",
  sections: ["navbar", "hero", "benefits", "testimonials", "faq", "form", "footer"],
  sectionsOther: "",
  advancedSections: [],
  advancedSectionsOther: "",
  requiredSections: [],
  requiredSectionsOther: "",
  forbiddenSections: [],
  forbiddenSectionsOther: "",
  proofElements: ["Avis clients", "Nombre d'utilisateurs"],
  proofElementsOther: "",
  formFields: ["Nom", "Email"],
  formFieldsOther: "",
  animationTypes: [],
  animationTypesOther: "",
  specializedFocus: [],
  specializedFocusOther: "",
  referenceVisual: "",
  avoidThings: "",
  promiseSentence: "",
  mainObjection: "",
  differentiator: "",
  emotion: "",
  quickAction: "",
  notes: "",
};

const GUIDED_STEPS = [
  {
    label: "Projet",
    title: "Cadrer la page",
    description: "Definis l'offre, l'objectif, l'audience et le niveau de complexite attendu.",
  },
  {
    label: "Message",
    title: "Clarifier le message",
    description: "Travaille la promesse, l'angle marketing, les objections et le ton editorial.",
  },
  {
    label: "Design",
    title: "Designer la direction visuelle",
    description: "Choisis l'ambiance, la forme, la palette et l'intention graphique generale.",
  },
  {
    label: "Structure",
    title: "Composer la page",
    description: "Definis le hero, les visuels, les sections et les blocs indispensables.",
  },
  {
    label: "Conversion",
    title: "Optimiser la conversion",
    description: "Configure CTA, formulaire, preuves sociales, funnel et animations.",
  },
  {
    label: "Finition",
    title: "Finaliser l'experience",
    description: "Ajuste les details techniques, les contraintes et relis le brief final.",
  },
] as const;

const CAPTURIA_COLORS = {
  navy: "#0f172a",
  navySoft: "#1e293b",
  teal: "#14b8a6",
  tealDark: "#0ea5a4",
  white: "#ffffff",
  surface: "#f8fafc",
  border: "#e2e8f0",
  textMuted: "#64748b",
  success: "#22c55e",
  error: "#ef4444",
} as const;

const GUIDED_STEP_ICONS = [
  WorkspacesRoundedIcon,
  CampaignRoundedIcon,
  PaletteRoundedIcon,
  ViewQuiltRoundedIcon,
  QueryStatsRoundedIcon,
  TuneRoundedIcon,
] as const;

const GUIDED_HIGHLIGHTS = [
  { label: "Style", value: "Capturia SaaS" },
  { label: "Output", value: "JSON valide" },
  { label: "Focus", value: "Conversion" },
  { label: "Apercu", value: "En direct" },
] as const;

interface PreviewTheme {
  accent: string;
  accentSoft: string;
  secondaryAccent: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  dark: boolean;
  showHeroMedia: boolean;
  galleryDisplay: string;
  galleryCount: number;
  uiStyle: string;
  density: string;
  titleStyle: "editorial" | "display" | "minimal";
  useGradient: boolean;
  cornerRadius: number;
  pillRadius: number;
  chipRadius: number;
  smallRadius: number;
}

function slugToLabel(section: string) {
  return section
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function findPaletteDefinition(value: string) {
  const normalized = value.trim().toLowerCase();
  return PALETTE_LIBRARY.find((palette) => palette.value.toLowerCase() === normalized);
}

function resolveCornerStyleToken(value: string): "sharp" | "balanced" | "rounded" {
  const normalized = value.trim().toLowerCase();

  if (normalized.includes("net")) {
    return "sharp";
  }

  if (normalized.includes("arrond")) {
    return "rounded";
  }

  return "balanced";
}

function buildThemeConstraint(form: GuidedPromptState): ThemeConstraintPayload | null {
  const cornerStyle = resolveCornerStyleToken(resolveChoice(form.cornerStyle, form.cornerStyleOther));

  if (form.colorMode === "palette") {
    const paletteDefinition = findPaletteDefinition(resolveChoice(form.palette, form.paletteOther));

    if (!paletteDefinition || paletteDefinition.value === "Other") {
      return null;
    }

    const [base, accent, secondary, surface] = paletteDefinition.colors;
    const background = paletteDefinition.isDark ? base : surface;
    const textPrimary = paletteDefinition.isDark ? "#ffffff" : base;
    const textSecondary = paletteDefinition.isDark ? "#cbd5e1" : "#475569";
    const muted = paletteDefinition.isDark ? accent : surface;

    return {
      name: paletteDefinition.value,
      cornerStyle,
      palette: {
        primary: accent,
        secondary,
        background,
        textPrimary,
        textSecondary,
        accent,
        muted,
      },
    };
  }

  if (form.colorMode === "custom") {
    const background = form.customBackground || "#ffffff";
    const textPrimary = form.customText || "#0f172a";

    return {
      name: "custom_user_palette",
      cornerStyle,
      palette: {
        primary: form.customPrimary || "#2563eb",
        secondary: form.customSecondary || form.customAccent || form.customPrimary || "#1d4ed8",
        background,
        textPrimary,
        textSecondary: textPrimary,
        accent: form.customAccent || form.customPrimary || "#38bdf8",
        muted: background,
      },
    };
  }

  return null;
}

function isDarkHexColor(color: string) {
  const normalized = color.trim();

  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(normalized)) {
    return false;
  }

  const hex = normalized.length === 4
    ? `#${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}${normalized[3]}${normalized[3]}`
    : normalized;
  const red = parseInt(hex.slice(1, 3), 16);
  const green = parseInt(hex.slice(3, 5), 16);
  const blue = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;

  return luminance < 0.5;
}

function inferPreviewTheme(form: GuidedPromptState): PreviewTheme {
  const style = resolveChoice(form.style, form.styleOther).toLowerCase();
  const ambiance = resolveChoice(form.ambiance, form.ambianceOther).toLowerCase();
  const heroMedia = resolveChoice(form.heroMedia, form.heroMediaOther).toLowerCase();
  const galleryDisplay = resolveChoice(form.imageDisplay, form.imageDisplayOther);
  const palette = resolveChoice(form.palette, form.paletteOther).toLowerCase();
  const paletteDefinition = findPaletteDefinition(resolveChoice(form.palette, form.paletteOther));
  const uiStyle = resolveChoice(form.uiStyle, form.uiStyleOther);
  const density = resolveChoice(form.density, form.densityOther);
  const cornerStyle = resolveChoice(form.cornerStyle, form.cornerStyleOther).toLowerCase();
  const inferredDark =
    style.includes("dark") ||
    style.includes("futur") ||
    ambiance.includes("froide") ||
    ambiance.includes("serieuse");
  let dark = inferredDark;

  let accent: string = CAPTURIA_COLORS.teal;
  let secondaryAccent: string = "#2f80ed";
  let background: string = dark ? "#0f172a" : CAPTURIA_COLORS.surface;
  let surface: string = dark ? "#111827" : CAPTURIA_COLORS.white;
  let surfaceAlt: string = dark ? "#162033" : "#f1f5f9";
  let text: string = dark ? "rgba(255,255,255,0.94)" : CAPTURIA_COLORS.navy;
  let textMuted: string = dark ? "rgba(255,255,255,0.62)" : CAPTURIA_COLORS.textMuted;

  if (form.colorMode === "custom") {
    dark = isDarkHexColor(form.customBackground || background);
    accent = form.customPrimary;
    secondaryAccent = form.customSecondary || form.customAccent || form.customPrimary;
    background = form.customBackground || background;
    surface = dark ? alpha(form.customBackground || "#0f172a", 0.92) : CAPTURIA_COLORS.white;
    surfaceAlt = alpha(form.customPrimary || CAPTURIA_COLORS.teal, dark ? 0.14 : 0.08);
    text = form.customText || text;
    textMuted = alpha(form.customText || "#0f172a", dark ? 0.72 : 0.62);
  } else if (form.colorMode === "palette") {
    if (paletteDefinition) {
      const [base, accentColor, secondaryColor, surfaceColor] = paletteDefinition.colors;
      dark = Boolean(paletteDefinition.isDark);
      accent = accentColor;
      secondaryAccent = secondaryColor;
      background = dark ? base : surfaceColor;
      surface = dark ? surfaceColor : "#ffffff";
      surfaceAlt = dark ? alpha(accentColor, 0.16) : alpha(accentColor, 0.10);
      text = dark ? "rgba(255,255,255,0.94)" : base;
      textMuted = dark ? "rgba(255,255,255,0.64)" : alpha(base, 0.66);
    } else if (palette.includes("noir") || palette.includes("premium")) {
      dark = true;
      accent = "#f59e0b";
      secondaryAccent = "#d97706";
      background = "#0f172a";
      surface = "#111827";
      surfaceAlt = "#1f2937";
      text = "rgba(255,255,255,0.94)";
      textMuted = "rgba(255,255,255,0.64)";
    } else if (palette.includes("violet")) {
      dark = true;
      accent = "#8b5cf6";
      secondaryAccent = "#d946ef";
      background = dark ? "#140f24" : "#faf5ff";
      surface = dark ? "#1b1530" : "#ffffff";
      surfaceAlt = dark ? "#261f40" : "#f3e8ff";
      text = dark ? "rgba(255,255,255,0.94)" : "#2e1065";
      textMuted = dark ? "rgba(255,255,255,0.62)" : "#7c3aed";
    } else if (palette.includes("rose") || palette.includes("orange") || palette.includes("sunset")) {
      accent = "#f97316";
      secondaryAccent = "#ec4899";
      background = dark ? "#1f1720" : "#fff7ed";
      surface = dark ? "#2a1c24" : "#ffffff";
      surfaceAlt = dark ? "#3b2431" : "#ffe4e6";
      text = dark ? "rgba(255,255,255,0.94)" : "#431407";
      textMuted = dark ? "rgba(255,255,255,0.64)" : "#9a3412";
    } else if (palette.includes("vert")) {
      accent = "#10b981";
      secondaryAccent = "#14b8a6";
      background = dark ? "#0d1f1b" : "#f0fdf4";
      surface = dark ? "#112823" : "#ffffff";
      surfaceAlt = dark ? "#183630" : "#dcfce7";
      text = dark ? "rgba(255,255,255,0.94)" : "#052e16";
      textMuted = dark ? "rgba(255,255,255,0.66)" : "#166534";
    } else if (palette.includes("cyan") || palette.includes("bleu")) {
      accent = "#0ea5a4";
      secondaryAccent = "#2f80ed";
      background = dark ? "#0f172a" : "#f8fafc";
      surface = dark ? "#111827" : "#ffffff";
      surfaceAlt = dark ? "#162033" : "#eff6ff";
      text = dark ? "rgba(255,255,255,0.94)" : CAPTURIA_COLORS.navy;
      textMuted = dark ? "rgba(255,255,255,0.64)" : CAPTURIA_COLORS.textMuted;
    }
  }

  const useGradient = form.gradientMode === "with"
    ? true
    : form.gradientMode === "without"
      ? false
      : true;

  const titleStyle =
    style.includes("editorial") || style.includes("luxe")
      ? "editorial"
      : style.includes("bold") || style.includes("futur")
        ? "display"
        : "minimal";

  const cornerRadius = cornerStyle.includes("tres arrondis")
    ? 10
    : cornerStyle.includes("nets")
      ? 0
      : 4;

  return {
    accent,
    accentSoft: alpha(accent, 0.14),
    secondaryAccent,
    background,
    surface,
    surfaceAlt,
    text,
    textMuted,
    dark,
    showHeroMedia: form.heroImageMode !== "none" && heroMedia !== "sans media",
    galleryDisplay,
    galleryCount: Number(form.galleryImageCount) || 0,
    uiStyle,
    density,
    titleStyle,
    useGradient,
    cornerRadius,
    pillRadius: cornerRadius <= 0 ? 0 : cornerRadius >= 10 ? 28 : 14,
    chipRadius: cornerRadius <= 0 ? 0 : cornerRadius >= 10 ? 22 : 10,
    smallRadius: cornerRadius <= 0 ? 0 : cornerRadius >= 10 ? 20 : 8,
  };
}

function PreviewBlock({
  children,
  dark = false,
  uiStyle,
  radius = 20,
}: {
  children: ReactNode;
  dark?: boolean;
  uiStyle?: string;
  radius?: number;
}) {
  const lowerUiStyle = (uiStyle ?? "").toLowerCase();
  const glassy = lowerUiStyle.includes("glass");
  const strongBorders = lowerUiStyle.includes("bordures");
  const heavyShadow = lowerUiStyle.includes("ombres fortes");

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: `${radius}px`,
        border: "1px solid",
        borderColor: strongBorders
          ? dark
            ? alpha("#ffffff", 0.18)
            : alpha(CAPTURIA_COLORS.navy, 0.16)
          : dark
            ? alpha("#ffffff", 0.08)
            : CAPTURIA_COLORS.border,
        bgcolor: glassy
          ? dark
            ? alpha("#162033", 0.72)
            : alpha("#ffffff", 0.72)
          : dark
            ? "#162033"
            : CAPTURIA_COLORS.white,
        backdropFilter: glassy ? "blur(16px)" : "none",
        boxShadow: dark
          ? heavyShadow
            ? "0 28px 54px rgba(15,23,42,0.28)"
            : "0 20px 40px rgba(15,23,42,0.22)"
          : heavyShadow
            ? "0 22px 48px rgba(15,23,42,0.12)"
            : "0 14px 34px rgba(15,23,42,0.05)",
      }}
    >
      {children}
    </Paper>
  );
}

function PageSkeletonPreview({
  sections,
  theme,
  websiteName,
  viewport = "desktop",
}: {
  sections: string[];
  theme: PreviewTheme;
  websiteName: string;
  viewport?: "desktop" | "mobile";
}) {
  const bg = theme.background;
  const pageSurface = theme.surface;
  const textColor = theme.text;
  const subColor = theme.textMuted;
  const blockRadius = theme.cornerRadius * 4;
  const sectionGap = theme.density.toLowerCase().includes("dense") ? 1.5 : 2.5;
  const cardBg = theme.surfaceAlt;
  const heroGradient = theme.useGradient
    ? theme.dark
      ? `linear-gradient(135deg, ${alpha(theme.accent, 0.18)}, ${alpha(theme.secondaryAccent, 0.12)}, rgba(255,255,255,0.02))`
      : `linear-gradient(135deg, ${theme.accentSoft}, ${alpha(theme.secondaryAccent, 0.12)}, rgba(15,23,42,0.03))`
    : theme.dark
      ? alpha(theme.accent, 0.14)
      : theme.accentSoft;
  const headingFontSize =
    theme.titleStyle === "display" ? { xs: "2rem", md: "2.6rem" } : theme.titleStyle === "editorial" ? { xs: "2rem", md: "2.35rem" } : { xs: "1.7rem", md: "2.1rem" };
  const headingWeight =
    theme.titleStyle === "display" ? 900 : theme.titleStyle === "editorial" ? 800 : 700;
  const headingLetterSpacing =
    theme.titleStyle === "display" ? "-0.05em" : theme.titleStyle === "editorial" ? "-0.03em" : "-0.02em";
  const brandName = websiteName.trim() || "Mon Site";
  const isMobile = viewport === "mobile";
  const mobileBlockRadius = Math.max(theme.smallRadius + 4, 10);
  const mobileSectionGap = 1.15;

  function renderSection(section: string) {
    if (section === "navbar") {
      return (
        <PreviewBlock
          dark={theme.dark}
          radius={isMobile ? mobileBlockRadius : blockRadius}
          uiStyle={theme.uiStyle}
        >
          <Stack alignItems="center" direction="row" justifyContent="space-between" spacing={isMobile ? 1 : 2}>
            <Stack alignItems="center" direction="row" spacing={1.25}>
              <Box
                sx={{
                  width: isMobile ? 28 : 38,
                  height: isMobile ? 28 : 38,
                  borderRadius: `${theme.smallRadius}px`,
                  bgcolor: theme.accentSoft,
                }}
              />
              <Typography
                sx={{
                  color: textColor,
                  fontWeight: 900,
                  fontSize: isMobile ? 15 : undefined,
                  maxWidth: isMobile ? 110 : "none",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                variant="h6"
              >
                {brandName}
              </Typography>
            </Stack>
            {isMobile ? (
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: `${theme.smallRadius}px`,
                  border: "1px solid",
                  borderColor: theme.dark ? alpha("#fff", 0.12) : CAPTURIA_COLORS.border,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Stack spacing={0.4}>
                  {[1, 2, 3].map((item) => (
                    <Box
                      key={item}
                      sx={{
                          width: 12,
                          height: 1.6,
                        borderRadius: 999,
                        bgcolor: textColor,
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            ) : (
              <>
                <Stack direction="row" spacing={1}>
                  {[1, 2, 3].map((item) => (
                    <Skeleton
                      key={item}
                      sx={{
                        bgcolor: theme.dark ? alpha("#fff", 0.12) : undefined,
                        borderRadius: `${theme.chipRadius}px`,
                      }}
                      variant="rounded"
                      width={72}
                      height={16}
                    />
                  ))}
                </Stack>
                <Box
                  sx={{
                    px: 2,
                    py: 1,
                    borderRadius: `${theme.pillRadius}px`,
                    bgcolor: theme.secondaryAccent,
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  CTA
                </Box>
              </>
            )}
          </Stack>
        </PreviewBlock>
      );
    }

    if (section === "hero") {
      return (
        <PreviewBlock
          dark={theme.dark}
          radius={isMobile ? mobileBlockRadius : blockRadius}
          uiStyle={theme.uiStyle}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "1fr"
                : { xs: "1fr", md: theme.showHeroMedia ? "1.25fr 0.95fr" : "1fr" },
              gap: isMobile ? 1.25 : 2.5,
              alignItems: "center",
            }}
          >
            <Stack spacing={isMobile ? 1 : 1.5}>
              <Box
                sx={{
                  px: isMobile ? 1.1 : 1.5,
                  py: isMobile ? 0.55 : 0.75,
                  width: "fit-content",
                  borderRadius: `${theme.pillRadius}px`,
                  bgcolor: theme.accentSoft,
                  color: theme.accent,
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                {brandName}
              </Box>
              <Typography
                sx={{
                  color: textColor,
                  fontWeight: headingWeight,
                  letterSpacing: headingLetterSpacing,
                  lineHeight: 1.05,
                  fontSize: isMobile
                    ? theme.titleStyle === "display"
                      ? "1.35rem"
                      : theme.titleStyle === "editorial"
                        ? "1.28rem"
                        : "1.18rem"
                    : headingFontSize,
                  maxWidth: isMobile ? "100%" : "11ch",
                }}
              >
                {theme.titleStyle === "display"
                  ? `${brandName} convertit mieux avec un funnel visuel`
                  : theme.titleStyle === "editorial"
                    ? `${brandName} adopte une direction plus premium`
                    : `${brandName} avec une page claire et orientee conversion`}
              </Typography>
              <Skeleton
                variant="text"
                width="100%"
                height={isMobile ? 18 : 22}
                sx={{ bgcolor: theme.dark ? alpha("#fff", 0.10) : undefined }}
              />
              <Skeleton
                variant="text"
                width={isMobile ? "88%" : "75%"}
                height={isMobile ? 18 : 22}
                sx={{ bgcolor: theme.dark ? alpha("#fff", 0.10) : undefined }}
              />
              <Stack direction={isMobile ? "column" : "row"} spacing={1} sx={{ pt: isMobile ? 0.5 : 1 }}>
                <Box
                  sx={{
                    px: isMobile ? 1.8 : 2.5,
                    py: isMobile ? 0.95 : 1.2,
                    borderRadius: `${theme.pillRadius}px`,
                    bgcolor: theme.accent,
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: isMobile ? 12 : 13,
                    textAlign: "center",
                  }}
                >
                  CTA principal
                </Box>
                <Box
                  sx={{
                    px: isMobile ? 1.8 : 2.5,
                    py: isMobile ? 0.95 : 1.2,
                    borderRadius: `${theme.pillRadius}px`,
                    border: "1px solid",
                    borderColor: theme.dark ? alpha("#fff", 0.14) : CAPTURIA_COLORS.border,
                    color: textColor,
                    fontWeight: 700,
                    fontSize: isMobile ? 12 : 13,
                    textAlign: "center",
                  }}
                >
                  CTA secondaire
                </Box>
              </Stack>
            </Stack>
            {theme.showHeroMedia ? (
              <Box
                sx={{
                  minHeight: isMobile ? 150 : 260,
                  borderRadius: blockRadius,
                  border: "1px solid",
                  borderColor: theme.dark ? alpha("#fff", 0.10) : CAPTURIA_COLORS.border,
                  background: heroGradient,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Skeleton
                  variant="rounded"
                  width={isMobile ? "84%" : "78%"}
                  height={isMobile ? 110 : 180}
                  sx={{ borderRadius: blockRadius, bgcolor: theme.dark ? alpha("#fff", 0.10) : undefined }}
                />
              </Box>
            ) : null}
          </Box>
        </PreviewBlock>
      );
    }

    if (["benefits", "pricing", "comparison", "testimonials"].includes(section)) {
      return (
        <PreviewBlock
          dark={theme.dark}
          radius={isMobile ? mobileBlockRadius : blockRadius}
          uiStyle={theme.uiStyle}
        >
          <Stack spacing={isMobile ? 1.25 : 2}>
            <Stack spacing={0.7}>
              <Typography sx={{ color: textColor, fontWeight: 800 }} variant="h6">
                {slugToLabel(section)}
              </Typography>
              <Typography sx={{ color: subColor }} variant="body2">
                Section de contenu adaptee aux choix du brief.
              </Typography>
            </Stack>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: isMobile
                  ? "1fr"
                  : { xs: "1fr", md: section === "comparison" ? "1fr 1fr" : "repeat(3, 1fr)" },
                gap: 1.5,
              }}
            >
              {Array.from({ length: section === "comparison" ? 2 : 3 }).map((_, index) => (
                <Paper
                  key={index}
                  elevation={0}
                  sx={{
                    p: 2,
                    minHeight: isMobile ? 128 : "auto",
                    borderRadius: `${blockRadius}px`,
                    border: "1px solid",
                    borderColor: theme.dark ? alpha("#fff", 0.08) : CAPTURIA_COLORS.border,
                    bgcolor: cardBg,
                  }}
                >
                  <Stack spacing={1.25}>
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: `${theme.smallRadius}px`,
                        bgcolor:
                          index === 0
                            ? theme.accentSoft
                            : index === 1
                              ? alpha(theme.secondaryAccent, 0.12)
                              : alpha(theme.accent, 0.08),
                      }}
                    />
                    <Skeleton variant="text" width="70%" height={28} sx={{ bgcolor: theme.dark ? alpha("#fff", 0.12) : undefined }} />
                    <Skeleton variant="text" width="95%" height={20} sx={{ bgcolor: theme.dark ? alpha("#fff", 0.08) : undefined }} />
                    <Skeleton variant="text" width="80%" height={20} sx={{ bgcolor: theme.dark ? alpha("#fff", 0.08) : undefined }} />
                  </Stack>
                </Paper>
              ))}
            </Box>
          </Stack>
        </PreviewBlock>
      );
    }

    if (section === "stats") {
      return (
        <PreviewBlock
          dark={theme.dark}
          radius={isMobile ? mobileBlockRadius : blockRadius}
          uiStyle={theme.uiStyle}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : { xs: "1fr", md: "repeat(3, 1fr)" },
              gap: 1.5,
            }}
          >
            {[1, 2, 3].map((item) => (
              <Paper
                key={item}
                elevation={0}
                sx={{
                  p: 2,
                    borderRadius: `${blockRadius}px`,
                  bgcolor: cardBg,
                  border: "1px solid",
                  borderColor: theme.dark ? alpha("#fff", 0.08) : CAPTURIA_COLORS.border,
                }}
              >
                <Stack spacing={1}>
                  <Typography sx={{ color: theme.accent, fontWeight: 900 }} variant="h4">
                    {item === 1 ? "95%" : item === 2 ? "10K+" : "50+"}
                  </Typography>
                  <Skeleton variant="text" width="82%" height={20} sx={{ bgcolor: theme.dark ? alpha("#fff", 0.08) : undefined }} />
                </Stack>
              </Paper>
            ))}
          </Box>
        </PreviewBlock>
      );
    }

    if (section === "trust_bar" || section === "logo_cloud") {
      return (
        <PreviewBlock
          dark={theme.dark}
          radius={isMobile ? mobileBlockRadius : blockRadius}
          uiStyle={theme.uiStyle}
        >
          <Stack spacing={1.1}>
            <Typography sx={{ color: subColor, fontWeight: 700 }} variant="body2">
              Logos / preuves de confiance
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1.5}>
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton
                  key={index}
                  variant="rounded"
                  width={92}
                  height={36}
                  sx={{
                    borderRadius: `${theme.smallRadius}px`,
                    bgcolor: theme.dark ? alpha("#fff", 0.10) : undefined,
                  }}
                />
              ))}
            </Stack>
          </Stack>
        </PreviewBlock>
      );
    }

    if (section === "gallery" || (theme.galleryCount > 0 && !sections.includes("gallery"))) {
      const galleryItems = Math.max(3, Math.min(6, theme.galleryCount || 3));
      return (
        <PreviewBlock
          dark={theme.dark}
          radius={isMobile ? mobileBlockRadius : blockRadius}
          uiStyle={theme.uiStyle}
        >
          <Stack spacing={1.25}>
            <Typography sx={{ color: textColor, fontWeight: 800 }} variant="h6">
              Galerie
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns:
                  isMobile
                    ? "1fr"
                    :
                  theme.galleryDisplay.toLowerCase().includes("split")
                    ? { xs: "1fr", md: "1.5fr 1fr" }
                    : { xs: "1fr 1fr", md: "repeat(3, 1fr)" },
                gap: 1.5,
              }}
            >
              {Array.from({ length: galleryItems }).map((_, index) => (
                <Skeleton
                  key={index}
                  variant="rounded"
                  height={
                    isMobile
                      ? 120
                      : index === 0 && theme.galleryDisplay.toLowerCase().includes("split")
                        ? 220
                        : 140
                  }
                  sx={{
                    borderRadius: `${blockRadius}px`,
                    bgcolor:
                      index % 2 === 0
                        ? alpha(theme.accent, theme.dark ? 0.16 : 0.10)
                        : alpha(theme.secondaryAccent, theme.dark ? 0.16 : 0.10),
                  }}
                />
              ))}
            </Box>
          </Stack>
        </PreviewBlock>
      );
    }

    if (section === "faq") {
      return (
        <PreviewBlock
          dark={theme.dark}
          radius={isMobile ? mobileBlockRadius : blockRadius}
          uiStyle={theme.uiStyle}
        >
          <Stack spacing={1}>
            <Typography sx={{ color: textColor, fontWeight: 800 }} variant="h6">
              FAQ
            </Typography>
            {[1, 2, 3].map((item) => (
              <Paper
                key={item}
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: `${blockRadius}px`,
                  border: "1px solid",
                  borderColor: theme.dark ? alpha("#fff", 0.08) : CAPTURIA_COLORS.border,
                  bgcolor: cardBg,
                }}
              >
                <Skeleton variant="text" width="88%" height={24} sx={{ bgcolor: theme.dark ? alpha("#fff", 0.10) : undefined }} />
              </Paper>
            ))}
          </Stack>
        </PreviewBlock>
      );
    }

    if (section === "form") {
      return (
        <PreviewBlock
          dark={theme.dark}
          radius={isMobile ? mobileBlockRadius : blockRadius}
          uiStyle={theme.uiStyle}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : { xs: "1fr", md: "1.1fr 0.9fr" },
              gap: 2,
              alignItems: "start",
            }}
          >
            <Stack spacing={0.8}>
              <Typography sx={{ color: textColor, fontWeight: 800 }} variant="h6">
                Formulaire
              </Typography>
              <Typography sx={{ color: subColor }} variant="body2">
                Capture de lead ou demande de contact.
              </Typography>
            </Stack>
            <Paper
              elevation={0}
              sx={{
                p: isMobile ? 1.25 : 2,
                borderRadius: `${blockRadius}px`,
                border: "1px solid",
                borderColor: theme.dark ? alpha("#fff", 0.08) : CAPTURIA_COLORS.border,
                bgcolor: cardBg,
              }}
            >
              <Stack spacing={1.25}>
                {[1, 2, 3].map((item) => (
                  <Skeleton
                    key={item}
                    variant="rounded"
                    height={isMobile ? 38 : 46}
                    sx={{
                      borderRadius: `${theme.smallRadius}px`,
                      bgcolor: theme.dark ? alpha("#fff", 0.10) : undefined,
                    }}
                  />
                ))}
                <Box
                  sx={{
                    mt: 1,
                    py: isMobile ? 0.9 : 1.2,
                    borderRadius: `${theme.pillRadius}px`,
                    bgcolor: theme.accent,
                    color: "#fff",
                    textAlign: "center",
                    fontWeight: 800,
                    fontSize: isMobile ? 12 : 13,
                  }}
                >
                  Envoyer
                </Box>
              </Stack>
            </Paper>
          </Box>
        </PreviewBlock>
      );
    }

    if (section === "cta_banner" || section === "countdown") {
      return (
        <PreviewBlock
          dark={theme.dark}
          radius={isMobile ? mobileBlockRadius : blockRadius}
          uiStyle={theme.uiStyle}
        >
          <Box
            sx={{
              p: isMobile ? 1.5 : 2.5,
              borderRadius: `${blockRadius}px`,
              background: theme.useGradient
                ? `linear-gradient(135deg, ${theme.accentSoft}, ${alpha(theme.secondaryAccent, 0.08)})`
                : theme.accentSoft,
              border: "1px solid",
              borderColor: alpha(theme.accent, 0.18),
            }}
          >
            <Stack spacing={1.25}>
              <Skeleton variant="text" width="55%" height={34} />
              <Skeleton variant="text" width="80%" height={20} />
              <Box
                sx={{
                  mt: 1,
                  width: "fit-content",
                  px: isMobile ? 1.5 : 2.25,
                  py: isMobile ? 0.8 : 1,
                  borderRadius: `${theme.pillRadius}px`,
                  bgcolor: theme.accent,
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: isMobile ? 12 : 13,
                }}
              >
                CTA
              </Box>
            </Stack>
          </Box>
        </PreviewBlock>
      );
    }

    if (section === "footer") {
      return (
        <PreviewBlock
          dark
          radius={isMobile ? mobileBlockRadius : blockRadius}
          uiStyle={theme.uiStyle}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : { xs: "1fr", md: "1.2fr 1fr 1fr" },
              gap: 2,
            }}
          >
            {[1, 2, 3].map((item) => (
              <Stack key={item} spacing={1}>
                {item === 1 ? (
                  <Typography sx={{ color: "rgba(255,255,255,0.92)", fontWeight: 800 }} variant="body1">
                    {brandName}
                  </Typography>
                ) : (
                  <Skeleton variant="text" width="58%" height={24} sx={{ bgcolor: alpha("#fff", 0.12) }} />
                )}
                <Skeleton variant="text" width="75%" height={18} sx={{ bgcolor: alpha("#fff", 0.08) }} />
                <Skeleton variant="text" width="68%" height={18} sx={{ bgcolor: alpha("#fff", 0.08) }} />
              </Stack>
            ))}
          </Box>
        </PreviewBlock>
      );
    }

    return (
      <PreviewBlock
        dark={theme.dark}
        radius={isMobile ? mobileBlockRadius : blockRadius}
        uiStyle={theme.uiStyle}
      >
        <Stack spacing={1.25}>
          <Typography sx={{ color: textColor, fontWeight: 800 }} variant="h6">
            {slugToLabel(section)}
          </Typography>
          <Skeleton variant="text" width="90%" height={22} sx={{ bgcolor: theme.dark ? alpha("#fff", 0.08) : undefined }} />
          <Skeleton
            variant="rounded"
            height={120}
            sx={{
              borderRadius: `${blockRadius}px`,
              bgcolor: theme.dark ? alpha("#fff", 0.10) : undefined,
            }}
          />
        </Stack>
      </PreviewBlock>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: isMobile ? 1 : { xs: 2.5, md: 3 },
        borderRadius: isMobile ? mobileBlockRadius + 8 : blockRadius + 4,
        border: "1px solid",
        borderColor: CAPTURIA_COLORS.border,
        bgcolor: pageSurface,
        background: theme.useGradient
          ? `linear-gradient(180deg, ${bg} 0%, ${theme.surface} 100%)`
          : bg,
        boxShadow: "0 24px 60px rgba(15,23,42,0.08)",
      }}
    >
      <Stack spacing={isMobile ? mobileSectionGap : sectionGap}>
        {sections.map((section) => (
          <Box key={section}>{renderSection(section)}</Box>
        ))}
      </Stack>
    </Paper>
  );
}

function resolveChoice(value: string, other: string) {
  if (value === OTHER_VALUE) {
    return other.trim();
  }

  return value;
}

function resolveList(values: string[], other: string) {
  return [...values, ...other.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean)];
}

function toggleInList(list: string[], value: string) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

function FieldPanel({ title, description, children }: FieldPanelProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        p: 2.5,
        borderRadius: 4,
        border: "1px solid",
        borderColor: CAPTURIA_COLORS.border,
        bgcolor: CAPTURIA_COLORS.white,
        boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
      }}
    >
      <Stack spacing={2} sx={{ width: "100%", minWidth: 0 }}>
        <Box>
          <Typography sx={{ color: CAPTURIA_COLORS.navy, fontWeight: 700 }} variant="subtitle1">
            {title}
          </Typography>
          {description ? (
            <Typography sx={{ color: CAPTURIA_COLORS.textMuted, mt: 0.5 }} variant="body2">
              {description}
            </Typography>
          ) : null}
        </Box>
        {children}
      </Stack>
    </Paper>
  );
}

function PaletteSelector({
  value,
  otherValue,
  gradientMode,
  onValueChange,
  onOtherChange,
}: {
  value: string;
  otherValue: string;
  gradientMode: GradientMode;
  onValueChange: (value: string) => void;
  onOtherChange: (value: string) => void;
}) {
  return (
    <FieldPanel
      title="Palette suggeree"
      description="Choisis une palette visuellement. L'aperçu ci-dessous montre immédiatement l'intention colorielle."
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            xl: "repeat(3, minmax(0, 1fr))",
          },
          gap: 1.5,
        }}
      >
        {PALETTE_LIBRARY.map((palette) => {
          const internalValue = palette.value === "Other" ? OTHER_VALUE : palette.value;
          const selected = value === internalValue;

          return (
            <ButtonBase
              key={palette.value}
              focusRipple
              onClick={() => onValueChange(internalValue)}
              sx={{
                width: "100%",
                textAlign: "left",
                borderRadius: 4,
                alignItems: "stretch",
                justifyContent: "stretch",
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  width: "100%",
                  p: 1.5,
                  borderRadius: 4,
                  border: "1px solid",
                  borderColor: selected ? alpha(palette.colors[1], 0.38) : CAPTURIA_COLORS.border,
                  bgcolor: selected ? alpha(palette.colors[3], 0.75) : CAPTURIA_COLORS.white,
                  boxShadow: selected
                    ? "0 18px 36px rgba(15,23,42,0.10)"
                    : "0 10px 24px rgba(15,23,42,0.04)",
                  transition: "all 180ms ease",
                  "&:hover": {
                    transform: "translateY(-1px)",
                    boxShadow: "0 18px 34px rgba(15,23,42,0.08)",
                  },
                }}
              >
                <Stack spacing={1.25}>
                  <Box
                    sx={{
                      p: 1.1,
                      borderRadius: 3,
                      background:
                        gradientMode === "without"
                          ? palette.colors[0]
                          : `linear-gradient(135deg, ${palette.colors[0]} 0%, ${palette.colors[1]} 45%, ${palette.colors[2]} 100%)`,
                      minHeight: 96,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <Stack alignItems="center" direction="row" justifyContent="space-between">
                      <Box
                        sx={{
                          width: 52,
                          height: 10,
                          borderRadius: 999,
                          bgcolor: alpha("#ffffff", 0.7),
                        }}
                      />
                      <Box
                        sx={{
                          width: 22,
                          height: 22,
                          borderRadius: 999,
                          bgcolor: alpha("#ffffff", 0.18),
                          border: "1px solid rgba(255,255,255,0.18)",
                        }}
                      />
                    </Stack>
                    <Stack spacing={0.8}>
                      <Box sx={{ width: "72%", height: 9, borderRadius: 999, bgcolor: alpha("#ffffff", 0.78) }} />
                      <Box sx={{ width: "54%", height: 9, borderRadius: 999, bgcolor: alpha("#ffffff", 0.52) }} />
                      <Stack direction="row" spacing={0.7}>
                        {palette.colors.map((color) => (
                          <Box
                            key={color}
                            sx={{
                              width: 18,
                              height: 18,
                              borderRadius: 999,
                              bgcolor: color,
                              border: "1px solid rgba(255,255,255,0.35)",
                            }}
                          />
                        ))}
                      </Stack>
                    </Stack>
                  </Box>

                  <Stack spacing={0.5}>
                    <Stack alignItems="center" direction="row" justifyContent="space-between" spacing={1}>
                      <Typography sx={{ color: CAPTURIA_COLORS.navy, fontWeight: 800 }} variant="body1">
                        {palette.label}
                      </Typography>
                      <Stack direction="row" spacing={0.75}>
                        <Chip
                          label={palette.isDark ? "Fond sombre" : "Fond clair"}
                          size="small"
                          sx={{
                            bgcolor: palette.isDark ? alpha(CAPTURIA_COLORS.navy, 0.08) : alpha("#ffffff", 0.88),
                            color: palette.isDark ? CAPTURIA_COLORS.navy : CAPTURIA_COLORS.textMuted,
                            fontWeight: 700,
                            border: "1px solid",
                            borderColor: palette.isDark ? alpha(CAPTURIA_COLORS.navy, 0.12) : CAPTURIA_COLORS.border,
                          }}
                        />
                        {selected ? (
                          <Chip
                            label="Selectionne"
                            size="small"
                            sx={{
                              bgcolor: alpha(palette.colors[1], 0.12),
                              color: palette.colors[1],
                              fontWeight: 700,
                            }}
                          />
                        ) : null}
                      </Stack>
                    </Stack>
                    <Typography sx={{ color: CAPTURIA_COLORS.textMuted }} variant="body2">
                      {palette.description}
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>
            </ButtonBase>
          );
        })}
      </Box>

      {value === OTHER_VALUE ? (
        <TextField
          fullWidth
          label="Autre palette"
          placeholder="Ex: bleu profond + or doux, sunset tropical, noir graphite + lime..."
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 3,
              bgcolor: CAPTURIA_COLORS.white,
            },
          }}
          value={otherValue}
          onChange={(event) => onOtherChange(event.target.value)}
        />
      ) : null}
    </FieldPanel>
  );
}

function SelectWithOtherField({
  label,
  value,
  otherValue,
  options,
  onValueChange,
  onOtherChange,
  helperText,
  otherLabel,
  placeholder,
}: SelectWithOtherFieldProps) {
  return (
    <Box sx={{ flex: "1 1 0", minWidth: 0, width: "100%", display: "flex" }}>
      <FieldPanel title={label} description={helperText}>
        <TextField
          fullWidth
          label={`Choisir ${label.toLowerCase()}`}
          select
          SelectProps={{
            MenuProps: {
              PaperProps: {
                sx: {
                  mt: 1,
                  borderRadius: 3,
                  border: `1px solid ${CAPTURIA_COLORS.border}`,
                  boxShadow: "0 18px 40px rgba(15,23,42,0.10)",
                },
              },
            },
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              minHeight: 58,
              borderRadius: 3,
              bgcolor: CAPTURIA_COLORS.surface,
              transition: "all 180ms ease",
              "&:hover": {
                boxShadow: `0 0 0 4px ${alpha(CAPTURIA_COLORS.teal, 0.08)}`,
              },
            },
          }}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
        >
          {options.map((option) => (
            <MenuItem
              key={option}
              sx={{ borderRadius: 2, my: 0.5, mx: 0.75 }}
              value={option}
            >
              {option === OTHER_VALUE ? "Autre" : option}
            </MenuItem>
          ))}
        </TextField>
        {value === OTHER_VALUE ? (
          <TextField
            fullWidth
            label={otherLabel ?? `Autre ${label.toLowerCase()}`}
            placeholder={placeholder}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 3,
                bgcolor: CAPTURIA_COLORS.white,
              },
            }}
            value={otherValue}
            onChange={(event) => onOtherChange(event.target.value)}
          />
        ) : null}
      </FieldPanel>
    </Box>
  );
}

function CheckboxSuggestionGroup({
  label,
  options,
  values,
  onToggle,
  helperText,
  otherValue,
  onOtherChange,
  otherLabel,
}: CheckboxSuggestionGroupProps) {
  return (
    <Box sx={{ flex: "1 1 0", minWidth: 0, width: "100%", display: "flex" }}>
      <FieldPanel title={label} description={helperText}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(3, minmax(0, 1fr))",
            },
            gap: 1.5,
          }}
        >
          {options.map((option) => {
            const checked = values.includes(option);

            return (
              <ButtonBase
                key={option}
                focusRipple
                onClick={() => onToggle(option)}
                sx={{
                  width: "100%",
                  borderRadius: 3,
                  textAlign: "left",
                  justifyContent: "flex-start",
                  alignItems: "stretch",
                }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    width: "100%",
                    p: 1.5,
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: checked ? alpha(CAPTURIA_COLORS.teal, 0.42) : CAPTURIA_COLORS.border,
                    bgcolor: checked ? alpha(CAPTURIA_COLORS.teal, 0.09) : CAPTURIA_COLORS.surface,
                    boxShadow: checked
                      ? "0 16px 30px rgba(20,184,166,0.14)"
                      : "0 6px 18px rgba(15,23,42,0.03)",
                    transform: checked ? "translateY(-1px)" : "translateY(0)",
                    transition: "all 180ms ease",
                    "&:hover": {
                      borderColor: alpha(CAPTURIA_COLORS.teal, 0.36),
                      boxShadow: "0 14px 28px rgba(15,23,42,0.08)",
                    },
                  }}
                >
                  <Stack alignItems="center" direction="row" spacing={1.25}>
                    <Checkbox
                      checked={checked}
                      tabIndex={-1}
                      disableRipple
                      sx={{
                        p: 0,
                        color: CAPTURIA_COLORS.textMuted,
                        "&.Mui-checked": {
                          color: CAPTURIA_COLORS.teal,
                        },
                      }}
                    />
                    <Typography
                      sx={{
                        color: checked ? CAPTURIA_COLORS.navy : CAPTURIA_COLORS.navySoft,
                        fontWeight: checked ? 700 : 600,
                      }}
                      variant="body2"
                    >
                      {option}
                    </Typography>
                  </Stack>
                </Paper>
              </ButtonBase>
            );
          })}
        </Box>
        <TextField
          fullWidth
          helperText="Ajoute des elements supplementaires separes par des virgules ou des retours a la ligne."
          label={otherLabel ?? `Autres ${label.toLowerCase()}`}
          minRows={2}
          multiline
          InputProps={{
            sx: {
              borderRadius: 3,
              bgcolor: CAPTURIA_COLORS.surface,
            },
          }}
          value={otherValue}
          onChange={(event) => onOtherChange(event.target.value)}
        />
      </FieldPanel>
    </Box>
  );
}

function buildGuidedPrompt(form: GuidedPromptState) {
  const pageType = resolveChoice(form.pageType, form.pageTypeOther);
  const goal = resolveChoice(form.goal, form.goalOther);
  const complexity = resolveChoice(form.complexity, form.complexityOther);
  const pageLength = resolveChoice(form.pageLength, form.pageLengthOther);
  const audience = resolveChoice(form.audience, form.audienceOther);
  const awarenessLevel = resolveChoice(form.awarenessLevel, form.awarenessLevelOther);
  const geography = resolveChoice(form.geography, form.geographyOther);
  const promise = resolveChoice(form.promise, form.promiseOther);
  const marketingAngle = resolveChoice(form.marketingAngle, form.marketingAngleOther);
  const proofLevel = resolveChoice(form.proofLevel, form.proofLevelOther);
  const style = resolveChoice(form.style, form.styleOther);
  const ambiance = resolveChoice(form.ambiance, form.ambianceOther);
  const uiStyle = resolveChoice(form.uiStyle, form.uiStyleOther);
  const cornerStyle = resolveChoice(form.cornerStyle, form.cornerStyleOther);
  const tone = resolveChoice(form.tone, form.toneOther);
  const copyStyle = resolveChoice(form.copyStyle, form.copyStyleOther);
  const palette = resolveChoice(form.palette, form.paletteOther);
  const gradientTreatment =
    form.gradientMode === "with"
      ? "Avec gradients"
      : form.gradientMode === "without"
        ? "Sans gradient"
        : "Laisser le modele choisir";
  const heroLayout = resolveChoice(form.heroLayout, form.heroLayoutOther);
  const heroContent = resolveChoice(form.heroContent, form.heroContentOther);
  const heroMedia = resolveChoice(form.heroMedia, form.heroMediaOther);
  const imageDisplay = resolveChoice(form.imageDisplay, form.imageDisplayOther);
  const cta = resolveChoice(form.cta, form.ctaOther);
  const secondaryCta = resolveChoice(form.secondaryCta, form.secondaryCtaOther);
  const formGoal = resolveChoice(form.formGoal, form.formGoalOther);
  const formFriction = resolveChoice(form.formFriction, form.formFrictionOther);
  const funnelStage = resolveChoice(form.funnelStage, form.funnelStageOther);
  const offerType = resolveChoice(form.offerType, form.offerTypeOther);
  const urgency = resolveChoice(form.urgency, form.urgencyOther);
  const language = resolveChoice(form.language, form.languageOther);
  const targetDevice = resolveChoice(form.targetDevice, form.targetDeviceOther);
  const density = resolveChoice(form.density, form.densityOther);
  const accessibility = resolveChoice(form.accessibility, form.accessibilityOther);
  const headerStyle = resolveChoice(form.headerStyle, form.headerStyleOther);
  const footerStyle = resolveChoice(form.footerStyle, form.footerStyleOther);
  const sections = resolveList(form.sections, form.sectionsOther);
  const advancedSections = resolveList(form.advancedSections, form.advancedSectionsOther);
  const requiredSections = resolveList(form.requiredSections, form.requiredSectionsOther);
  const forbiddenSections = resolveList(form.forbiddenSections, form.forbiddenSectionsOther);
  const proofElements = resolveList(form.proofElements, form.proofElementsOther);
  const formFields = resolveList(form.formFields, form.formFieldsOther);
  const animationTypes = resolveList(form.animationTypes, form.animationTypesOther);
  const specializedFocus = resolveList(form.specializedFocus, form.specializedFocusOther);
  const product = resolveChoice(form.product, form.productOther);

  return [
    `Genere une page pour ${product || "un produit digital"}.`,
    form.websiteName.trim() ? `Nom du site web / de la marque: ${form.websiteName.trim()}.` : "",
    form.businessDescription.trim()
      ? `Descriptif de l'activite: ${form.businessDescription.trim()}.`
      : "",
    pageType ? `Type de page: ${pageType}.` : "",
    goal ? `Objectif principal: ${goal}.` : "",
    complexity ? `Niveau de complexite souhaite: ${complexity}.` : "",
    pageLength ? `Longueur de page souhaitee: ${pageLength}.` : "",
    audience ? `Audience cible: ${audience}.` : "",
    awarenessLevel ? `Niveau de conscience de l'audience: ${awarenessLevel}.` : "",
    geography ? `Cible geographique / linguistique: ${geography}.` : "",
    promise ? `Promesse principale: ${promise}.` : "",
    marketingAngle ? `Angle marketing: ${marketingAngle}.` : "",
    proofLevel ? `Niveau de preuve attendu: ${proofLevel}.` : "",
    tone ? `Ton souhaite: ${tone}.` : "",
    copyStyle ? `Style de copywriting: ${copyStyle}.` : "",
    style ? `Direction visuelle: ${style}.` : "",
    ambiance ? `Ambiance visuelle: ${ambiance}.` : "",
    uiStyle ? `Style d'interface: ${uiStyle}.` : "",
    cornerStyle ? `Style des coins / forme: ${cornerStyle}.` : "",
    form.colorMode === "model"
      ? "Palette couleur: laisse le modele choisir librement."
      : "",
    form.colorMode === "palette" && palette
      ? `Palette couleur souhaitee: ${palette}.`
      : "",
    form.colorMode === "custom"
      ? `Couleurs imposees: primary ${form.customPrimary}, secondary ${form.customSecondary}, accent ${form.customAccent}, background ${form.customBackground}, text ${form.customText}.`
      : "",
    `Traitement des fonds et accents: ${gradientTreatment}.`,
    heroLayout ? `Disposition hero: ${heroLayout}.` : "",
    heroContent ? `Contenu hero prefere: ${heroContent}.` : "",
    heroMedia ? `Media hero prefere: ${heroMedia}.` : "",
    form.heroImageMode === "none"
      ? "La section hero ne doit pas contenir d'image."
      : "",
    form.heroImageMode === "context"
      ? "La section hero doit contenir une image choisie selon le contexte."
      : "",
    form.heroImageMode === "custom" && form.heroImageCustomDescription.trim()
      ? `Descriptif de l'image hero: ${form.heroImageCustomDescription.trim()}.`
      : "",
    `Nombre de visuels de galerie a generer: ${form.galleryImageCount}.`,
    imageDisplay ? `Type d'affichage de la galerie: ${imageDisplay}.` : "",
    form.galleryImageCount !== "0" && form.galleryDescriptionMode === "context"
      ? "Les visuels de galerie doivent etre decrits selon le contexte."
      : "",
    form.galleryImageCount !== "0" &&
    form.galleryDescriptionMode === "custom" &&
    form.galleryCustomDescription.trim()
      ? `Descriptif personnalise des visuels de galerie: ${form.galleryCustomDescription.trim()}.`
      : "",
    cta ? `CTA principal souhaite: ${cta}.` : "",
    secondaryCta ? `CTA secondaire souhaite: ${secondaryCta}.` : "",
    formGoal ? `Objectif du formulaire: ${formGoal}.` : "",
    formFriction ? `Niveau de friction du formulaire: ${formFriction}.` : "",
    formFields.length > 0 ? `Champs de formulaire souhaites: ${formFields.join(", ")}.` : "",
    proofElements.length > 0 ? `Elements de preuve sociale / confiance: ${proofElements.join(", ")}.` : "",
    sections.length > 0 ? `Sections souhaitees: ${sections.join(", ")}.` : "",
    advancedSections.length > 0 ? `Sections avancees a considerer: ${advancedSections.join(", ")}.` : "",
    requiredSections.length > 0 ? `Sections obligatoires: ${requiredSections.join(", ")}.` : "",
    forbiddenSections.length > 0 ? `Sections a eviter absolument: ${forbiddenSections.join(", ")}.` : "",
    funnelStage ? `Etape du funnel ciblee: ${funnelStage}.` : "",
    offerType ? `Type d'offre: ${offerType}.` : "",
    urgency ? `Niveau d'urgence / rarete: ${urgency}.` : "",
    animationTypes.length > 0 ? `Animations souhaitees: ${animationTypes.join(", ")}.` : "",
    specializedFocus.length > 0 ? `Focus metier / contenu specialise: ${specializedFocus.join(", ")}.` : "",
    language ? `Langue de la page: ${language}.` : "",
    targetDevice ? `Cible device: ${targetDevice}.` : "",
    density ? `Densite du contenu: ${density}.` : "",
    accessibility ? `Preference d'accessibilite: ${accessibility}.` : "",
    headerStyle ? `Style du header: ${headerStyle}.` : "",
    footerStyle ? `Style du footer: ${footerStyle}.` : "",
    form.referenceVisual.trim() ? `Reference visuelle: ${form.referenceVisual.trim()}.` : "",
    form.promiseSentence.trim() ? `Promesse en une phrase: ${form.promiseSentence.trim()}.` : "",
    form.mainObjection.trim() ? `Objection principale a traiter: ${form.mainObjection.trim()}.` : "",
    form.differentiator.trim() ? `Element differentiant principal: ${form.differentiator.trim()}.` : "",
    form.emotion.trim() ? `Emotion a provoquer: ${form.emotion.trim()}.` : "",
    form.quickAction.trim() ? `Action que le visiteur doit faire en moins de 10 secondes: ${form.quickAction.trim()}.` : "",
    form.avoidThings.trim() ? `A eviter absolument: ${form.avoidThings.trim()}.` : "",
    form.notes.trim() ? `Notes supplementaires: ${form.notes.trim()}.` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export default function PromptPage() {
  const [mode, setMode] = useState<PromptMode>("free");
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [guidedPrompt, setGuidedPrompt] = useState<GuidedPromptState>(DEFAULT_GUIDED_STATE);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [generatedJson, setGeneratedJson] = useState<string>("");

  const effectivePrompt = useMemo(
    () => (mode === "free" ? prompt : buildGuidedPrompt(guidedPrompt)),
    [guidedPrompt, mode, prompt],
  );
  const selectedSections = useMemo(
    () => resolveList(guidedPrompt.sections, guidedPrompt.sectionsOther),
    [guidedPrompt.sections, guidedPrompt.sectionsOther],
  );
  const previewTheme = useMemo(() => inferPreviewTheme(guidedPrompt), [guidedPrompt]);
  const previewSections = useMemo(() => {
    const sections = [...selectedSections];

    if (!sections.includes("navbar")) {
      sections.unshift("navbar");
    }

    if (!sections.includes("hero")) {
      sections.splice(1, 0, "hero");
    }

    if (previewTheme.galleryCount > 0 && !sections.includes("gallery")) {
      const footerIndex = sections.indexOf("footer");
      if (footerIndex >= 0) {
        sections.splice(footerIndex, 0, "gallery");
      } else {
        sections.push("gallery");
      }
    }

    if (!sections.includes("footer")) {
      sections.push("footer");
    }

    return sections;
  }, [previewTheme.galleryCount, selectedSections]);
  const completionRatio = ((activeStep + 1) / GUIDED_STEPS.length) * 100;

  function handleReset() {
    if (mode === "free") {
      setPrompt(DEFAULT_PROMPT);
      return;
    }

    setGuidedPrompt(DEFAULT_GUIDED_STATE);
    setActiveStep(0);
  }

  function handleNextStep() {
    setActiveStep((prev) => Math.min(prev + 1, GUIDED_STEPS.length - 1));
  }

  function handlePreviousStep() {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const themeConstraint = mode === "guided" ? buildThemeConstraint(guidedPrompt) : null;
      const response = await fetch("/api/generate-page", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: effectivePrompt, themeConstraint }),
      });

      const payload = (await response.json()) as GenerateResponse;

      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "La generation a echoue.");
      }

      setSuccessMessage(payload.message ?? "La page a ete generee avec succes.");
      setGeneratedJson(JSON.stringify(payload.page, null, 2));
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Une erreur inconnue est survenue.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        py: { xs: 4, md: 6 },
        bgcolor: CAPTURIA_COLORS.surface,
        background:
          "radial-gradient(circle at top left, rgba(20,184,166,0.10), transparent 24%), radial-gradient(circle at top right, rgba(15,23,42,0.08), transparent 26%), linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={4}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 6,
              border: "1px solid",
              borderColor: CAPTURIA_COLORS.border,
              bgcolor: "rgba(255,255,255,0.88)",
              backdropFilter: "blur(14px)",
              boxShadow: "0 20px 60px rgba(15,23,42,0.08)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: -80,
                right: -60,
                width: 220,
                height: 220,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(20,184,166,0.16), transparent 68%)",
                animation: "capturiaFloat 10s ease-in-out infinite",
                "@keyframes capturiaFloat": {
                  "0%, 100%": { transform: "translateY(0px)" },
                  "50%": { transform: "translateY(16px)" },
                },
              }}
            />
            <Stack spacing={2.5} sx={{ position: "relative" }}>
              <Chip
                icon={<AutoAwesomeRoundedIcon />}
                label="Capturia Prompt Studio"
                sx={{
                  alignSelf: "flex-start",
                  px: 1,
                  color: CAPTURIA_COLORS.navy,
                  bgcolor: "rgba(20,184,166,0.10)",
                  borderColor: "rgba(20,184,166,0.24)",
                  fontWeight: 700,
                }}
                variant="outlined"
              />
              <Typography
                gutterBottom
                sx={{
                  color: CAPTURIA_COLORS.navy,
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                }}
                variant="h2"
              >
                Generer une page depuis un prompt
              </Typography>
              <Typography sx={{ maxWidth: 920, color: CAPTURIA_COLORS.textMuted }} variant="body1">
                Utilise le mode libre si tu veux tout ecrire toi-meme, ou le mode guide si tu
                veux construire un brief tres complet avec beaucoup de suggestions. Le serveur
                validera ensuite la reponse contre le DSL puis enregistrera le JSON dans
                <code> data/page.json</code>.
              </Typography>
            </Stack>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 6,
              border: "1px solid",
              borderColor: CAPTURIA_COLORS.border,
              bgcolor: CAPTURIA_COLORS.white,
              boxShadow: "0 24px 70px rgba(15,23,42,0.08)",
            }}
          >
            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                  backgroundColor: CAPTURIA_COLORS.surface,
                  transition: "all 180ms ease",
                  "&:hover": {
                    boxShadow: `0 0 0 4px ${alpha(CAPTURIA_COLORS.teal, 0.06)}`,
                  },
                },
                "& .MuiInputBase-input": {
                  color: CAPTURIA_COLORS.navySoft,
                },
                "& .MuiFormLabel-root": {
                  color: CAPTURIA_COLORS.textMuted,
                  fontWeight: 600,
                },
                "& .MuiFormLabel-root.Mui-focused": {
                  color: CAPTURIA_COLORS.tealDark,
                },
                "& .MuiFormHelperText-root": {
                  color: CAPTURIA_COLORS.textMuted,
                  marginLeft: 2,
                  marginTop: 1,
                },
                "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: CAPTURIA_COLORS.tealDark,
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: CAPTURIA_COLORS.border,
                },
              }}
            >
              <Stack spacing={3}>
                <Tabs
                  value={mode}
                  onChange={(_, value: PromptMode) => setMode(value)}
                  variant="fullWidth"
                  sx={{
                    p: 0.75,
                    borderRadius: 999,
                    bgcolor: CAPTURIA_COLORS.surface,
                    border: "1px solid",
                    borderColor: CAPTURIA_COLORS.border,
                    "& .MuiTabs-indicator": {
                      display: "none",
                    },
                    "& .MuiTab-root": {
                      minHeight: 52,
                      borderRadius: 999,
                      color: CAPTURIA_COLORS.textMuted,
                      fontWeight: 700,
                      textTransform: "none",
                    },
                    "& .Mui-selected": {
                      color: `${CAPTURIA_COLORS.navy} !important`,
                      bgcolor: CAPTURIA_COLORS.white,
                      boxShadow: "0 8px 20px rgba(15,23,42,0.08)",
                    },
                  }}
                >
                  <Tab label="Prompt libre" value="free" />
                  <Tab label="Prompt guide ultra complet" value="guided" />
                </Tabs>

                {mode === "free" ? (
                  <TextField
                    fullWidth
                    helperText="Reste descriptif: produit, audience, ton, sections souhaitees, style visuel, CTA, contraintes."
                    label="Prompt de generation"
                    minRows={10}
                    multiline
                    placeholder="Ex: Genere une landing page SaaS moderne pour Capturia, avec une hero claire, preuves sociales, comparatif, CTA demo et palette navy + teal rassurante."
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        alignItems: "flex-start",
                        borderRadius: 4,
                        bgcolor: CAPTURIA_COLORS.surface,
                        boxShadow: "inset 0 1px 2px rgba(15,23,42,0.03)",
                      },
                    }}
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                  />
                ) : (
                  <Stack spacing={3}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: { xs: 3, md: 4 },
                        borderRadius: 7,
                        color: "common.white",
                        border: "1px solid",
                        borderColor: "rgba(255,255,255,0.12)",
                        background:
                          `linear-gradient(135deg, ${CAPTURIA_COLORS.navy} 0%, ${CAPTURIA_COLORS.navySoft} 48%, ${CAPTURIA_COLORS.tealDark} 100%)`,
                        boxShadow: "0 30px 80px rgba(20,184,166,0.18)",
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
                      <Box
                        sx={{
                          position: "absolute",
                          inset: 0,
                          background:
                            "radial-gradient(circle at top right, rgba(255,255,255,0.16), transparent 32%)",
                          pointerEvents: "none",
                        }}
                      />
                      <Stack spacing={2} sx={{ position: "relative" }}>
                        <Stack
                          alignItems={{ xs: "flex-start", md: "center" }}
                          direction={{ xs: "column", md: "row" }}
                          justifyContent="space-between"
                          spacing={2}
                        >
                          <Stack spacing={1.2}>
                            <Chip
                              icon={<AutoAwesomeRoundedIcon />}
                              label="Assistant guide premium"
                              sx={{
                                alignSelf: "flex-start",
                                color: "inherit",
                                bgcolor: "rgba(255,255,255,0.12)",
                                borderColor: "rgba(255,255,255,0.18)",
                              }}
                              variant="outlined"
                            />
                            <Typography variant="h4">
                              Construit ton brief etape par etape
                            </Typography>
                            <Typography sx={{ color: "rgba(255,255,255,0.82)", maxWidth: 760 }}>
                              Ce parcours transforme le gros formulaire en workflow guide. Chaque
                              etape affine le rendu visuel, le message et la conversion pour obtenir
                              une page plus professionnelle.
                            </Typography>
                            <Stack direction="row" flexWrap="wrap" gap={1}>
                              {["Style Capturia", "Conversion first", "Prompt securise"].map((item) => (
                                <Chip
                                  key={item}
                                  label={item}
                                  size="small"
                                  sx={{
                                    color: "common.white",
                                    bgcolor: "rgba(255,255,255,0.08)",
                                    border: "1px solid rgba(255,255,255,0.10)",
                                  }}
                                />
                              ))}
                            </Stack>
                          </Stack>
                          <Paper
                            elevation={0}
                            sx={{
                              minWidth: { xs: "100%", md: 240 },
                              p: 2,
                              borderRadius: 4,
                              bgcolor: "rgba(255,255,255,0.1)",
                              border: "1px solid rgba(255,255,255,0.14)",
                              backdropFilter: "blur(10px)",
                              boxShadow: "0 18px 40px rgba(15,23,42,0.16)",
                            }}
                          >
                            <Stack spacing={1}>
                              <Typography sx={{ color: "rgba(255,255,255,0.75)" }} variant="body2">
                                Progression
                              </Typography>
                              <Typography variant="h5">
                                {activeStep + 1}/{GUIDED_STEPS.length}
                              </Typography>
                              <LinearProgress
                                sx={{
                                  height: 8,
                                  borderRadius: 999,
                                  bgcolor: "rgba(255,255,255,0.16)",
                                  "& .MuiLinearProgress-bar": {
                                    borderRadius: 999,
                                    bgcolor: CAPTURIA_COLORS.teal,
                                  },
                                }}
                                value={completionRatio}
                                variant="determinate"
                              />
                            </Stack>
                          </Paper>
                        </Stack>
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: {
                              xs: "repeat(2, minmax(0, 1fr))",
                              md: "repeat(4, minmax(0, 1fr))",
                            },
                            gap: 1.5,
                          }}
                        >
                          {GUIDED_HIGHLIGHTS.map((item) => (
                            <Paper
                              key={item.label}
                              elevation={0}
                              sx={{
                                p: 1.75,
                                borderRadius: 4,
                                bgcolor: "rgba(255,255,255,0.08)",
                                border: "1px solid rgba(255,255,255,0.10)",
                                backdropFilter: "blur(6px)",
                              }}
                            >
                              <Typography sx={{ color: "rgba(255,255,255,0.66)" }} variant="caption">
                                {item.label}
                              </Typography>
                              <Typography sx={{ mt: 0.4, fontWeight: 700 }} variant="body1">
                                {item.value}
                              </Typography>
                            </Paper>
                          ))}
                        </Box>
                      </Stack>
                    </Paper>

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1.65fr) 340px" },
                        gap: 3,
                        alignItems: "start",
                      }}
                    >
                      <Stack spacing={3}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 1.5,
                            borderRadius: 6,
                            border: "1px solid",
                            borderColor: CAPTURIA_COLORS.border,
                            bgcolor: CAPTURIA_COLORS.white,
                            boxShadow: "0 18px 40px rgba(15,23,42,0.05)",
                          }}
                        >
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: {
                                xs: "1fr",
                                sm: "repeat(2, minmax(0, 1fr))",
                                lg: "repeat(3, minmax(0, 1fr))",
                              },
                              gap: 1.25,
                            }}
                          >
                            {GUIDED_STEPS.map((step, index) => {
                              const Icon = GUIDED_STEP_ICONS[index];
                              const isActive = index === activeStep;
                              const isCompleted = index < activeStep;

                              return (
                                <ButtonBase
                                  key={step.label}
                                  focusRipple
                                  onClick={() => setActiveStep(index)}
                                  sx={{
                                    width: "100%",
                                    textAlign: "left",
                                    borderRadius: 4,
                                    justifyContent: "stretch",
                                  }}
                                >
                                  <Paper
                                    elevation={0}
                                    sx={{
                                      width: "100%",
                                      p: 2,
                                      borderRadius: 4,
                                      border: "1px solid",
                                      borderColor: isActive
                                        ? alpha(CAPTURIA_COLORS.teal, 0.45)
                                        : CAPTURIA_COLORS.border,
                                      bgcolor: isActive
                                        ? alpha(CAPTURIA_COLORS.teal, 0.08)
                                        : isCompleted
                                          ? alpha(CAPTURIA_COLORS.navy, 0.02)
                                          : CAPTURIA_COLORS.surface,
                                      boxShadow: isActive
                                        ? "0 18px 34px rgba(20,184,166,0.12)"
                                        : "0 6px 18px rgba(15,23,42,0.03)",
                                      transition: "all 180ms ease",
                                      "&:hover": {
                                        transform: "translateY(-1px)",
                                        boxShadow: "0 18px 34px rgba(15,23,42,0.08)",
                                      },
                                    }}
                                  >
                                    <Stack direction="row" spacing={1.5}>
                                      <Box
                                        sx={{
                                          width: 44,
                                          height: 44,
                                          borderRadius: 3,
                                          display: "grid",
                                          placeItems: "center",
                                          bgcolor: isActive
                                            ? CAPTURIA_COLORS.teal
                                            : isCompleted
                                              ? alpha(CAPTURIA_COLORS.tealDark, 0.16)
                                              : CAPTURIA_COLORS.white,
                                          color: isActive
                                            ? CAPTURIA_COLORS.white
                                            : isCompleted
                                              ? CAPTURIA_COLORS.tealDark
                                              : CAPTURIA_COLORS.navySoft,
                                          border: `1px solid ${
                                            isActive
                                              ? alpha(CAPTURIA_COLORS.teal, 0.5)
                                              : alpha(CAPTURIA_COLORS.border, 0.9)
                                          }`,
                                        }}
                                      >
                                        <Icon fontSize="small" />
                                      </Box>
                                      <Box sx={{ minWidth: 0 }}>
                                        <Typography
                                          sx={{
                                            color: CAPTURIA_COLORS.textMuted,
                                            fontSize: 12,
                                            fontWeight: 800,
                                            letterSpacing: "0.06em",
                                            textTransform: "uppercase",
                                          }}
                                        >
                                          {`Etape ${index + 1}`}
                                        </Typography>
                                        <Typography
                                          sx={{
                                            color: CAPTURIA_COLORS.navy,
                                            fontWeight: 800,
                                            lineHeight: 1.2,
                                            mt: 0.35,
                                          }}
                                          variant="body1"
                                        >
                                          {step.label}
                                        </Typography>
                                        <Typography
                                          sx={{
                                            color: CAPTURIA_COLORS.textMuted,
                                            mt: 0.5,
                                            display: "-webkit-box",
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: "vertical",
                                            overflow: "hidden",
                                          }}
                                          variant="body2"
                                        >
                                          {step.description}
                                        </Typography>
                                      </Box>
                                    </Stack>
                                  </Paper>
                                </ButtonBase>
                              );
                            })}
                          </Box>
                        </Paper>

                        <Paper
                          elevation={0}
                          sx={{
                            p: { xs: 2, md: 3 },
                            borderRadius: 5,
                            border: "1px solid",
                            borderColor: CAPTURIA_COLORS.border,
                            bgcolor: "background.paper",
                            boxShadow: "0 20px 44px rgba(15,23,42,0.06)",
                            position: "relative",
                            overflow: "hidden",
                          }}
                        >
                          <Box
                            sx={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              right: 0,
                              height: 4,
                              background: `linear-gradient(90deg, ${CAPTURIA_COLORS.teal}, ${CAPTURIA_COLORS.tealDark})`,
                            }}
                          />
                          <Stack spacing={2.5}>
                            <Stack
                              alignItems={{ xs: "flex-start", md: "center" }}
                              direction={{ xs: "column", md: "row" }}
                              justifyContent="space-between"
                              spacing={2}
                            >
                              <Box>
                                <Typography
                                  sx={{ color: CAPTURIA_COLORS.tealDark }}
                                  fontWeight={800}
                                  variant="overline"
                                >
                                  Etape {activeStep + 1}
                                </Typography>
                                <Typography sx={{ color: CAPTURIA_COLORS.navy, fontWeight: 800 }} variant="h5">
                                  {GUIDED_STEPS[activeStep].title}
                                </Typography>
                                <Typography sx={{ mt: 0.5, color: CAPTURIA_COLORS.textMuted }}>
                                  {GUIDED_STEPS[activeStep].description}
                                </Typography>
                              </Box>
                              <Chip
                                label={`${selectedSections.length} sections selectionnees`}
                                sx={{
                                  borderColor: "rgba(20,184,166,0.18)",
                                  bgcolor: "rgba(20,184,166,0.08)",
                                  color: CAPTURIA_COLORS.navySoft,
                                  fontWeight: 600,
                                }}
                                variant="outlined"
                              />
                            </Stack>

                            <Fade in key={activeStep} timeout={350}>
                              <Box>
                                {activeStep === 0 ? (
                                  <Stack spacing={3}>
                                    <FieldPanel
                                      title="Identite du projet"
                                      description="Commence par definir le nom du site et decrire clairement l'activite."
                                    >
                                      <Stack spacing={2}>
                                        <TextField
                                          fullWidth
                                          label="Nom du site web"
                                          placeholder="Ex: Capturia, CyberPrep, Atelier Luna..."
                                          value={guidedPrompt.websiteName}
                                          onChange={(event) =>
                                            setGuidedPrompt((prev) => ({
                                              ...prev,
                                              websiteName: event.target.value,
                                            }))
                                          }
                                        />
                                        <TextField
                                          fullWidth
                                          label="Descriptif de l'activite"
                                          minRows={3}
                                          multiline
                                          placeholder="Ex: Plateforme qui aide les entreprises a capturer, qualifier et convertir leurs leads automatiquement."
                                          value={guidedPrompt.businessDescription}
                                          onChange={(event) =>
                                            setGuidedPrompt((prev) => ({
                                              ...prev,
                                              businessDescription: event.target.value,
                                            }))
                                          }
                                        />
                                      </Stack>
                                    </FieldPanel>
                                    <SelectWithOtherField
                                      label="Produit / offre"
                                      value={guidedPrompt.product}
                                      otherValue={guidedPrompt.productOther}
                                      options={PRODUCT_OPTIONS}
                                      onValueChange={(value) => setGuidedPrompt((prev) => ({ ...prev, product: value }))}
                                      onOtherChange={(value) => setGuidedPrompt((prev) => ({ ...prev, productOther: value }))}
                                      placeholder="Ex: plateforme de formation cyber, agence no-code premium..."
                                    />
                                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                                      <SelectWithOtherField
                                        label="Type de page"
                                        value={guidedPrompt.pageType}
                                        otherValue={guidedPrompt.pageTypeOther}
                                        options={PAGE_TYPE_OPTIONS}
                                        onValueChange={(value) => setGuidedPrompt((prev) => ({ ...prev, pageType: value }))}
                                        onOtherChange={(value) => setGuidedPrompt((prev) => ({ ...prev, pageTypeOther: value }))}
                                      />
                                      <SelectWithOtherField
                                        label="Objectif principal"
                                        value={guidedPrompt.goal}
                                        otherValue={guidedPrompt.goalOther}
                                        options={GOAL_OPTIONS}
                                        onValueChange={(value) => setGuidedPrompt((prev) => ({ ...prev, goal: value }))}
                                        onOtherChange={(value) => setGuidedPrompt((prev) => ({ ...prev, goalOther: value }))}
                                      />
                                    </Stack>
                                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                                      <SelectWithOtherField
                                        label="Niveau de complexite"
                                        value={guidedPrompt.complexity}
                                        otherValue={guidedPrompt.complexityOther}
                                        options={COMPLEXITY_OPTIONS}
                                        onValueChange={(value) => setGuidedPrompt((prev) => ({ ...prev, complexity: value }))}
                                        onOtherChange={(value) => setGuidedPrompt((prev) => ({ ...prev, complexityOther: value }))}
                                      />
                                      <SelectWithOtherField
                                        label="Longueur de page"
                                        value={guidedPrompt.pageLength}
                                        otherValue={guidedPrompt.pageLengthOther}
                                        options={PAGE_LENGTH_OPTIONS}
                                        onValueChange={(value) => setGuidedPrompt((prev) => ({ ...prev, pageLength: value }))}
                                        onOtherChange={(value) => setGuidedPrompt((prev) => ({ ...prev, pageLengthOther: value }))}
                                      />
                                    </Stack>
                                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                                      <SelectWithOtherField
                                        label="Audience cible"
                                        value={guidedPrompt.audience}
                                        otherValue={guidedPrompt.audienceOther}
                                        options={AUDIENCE_OPTIONS}
                                        onValueChange={(value) => setGuidedPrompt((prev) => ({ ...prev, audience: value }))}
                                        onOtherChange={(value) => setGuidedPrompt((prev) => ({ ...prev, audienceOther: value }))}
                                      />
                                      <SelectWithOtherField
                                        label="Niveau de conscience"
                                        value={guidedPrompt.awarenessLevel}
                                        otherValue={guidedPrompt.awarenessLevelOther}
                                        options={AWARENESS_LEVEL_OPTIONS}
                                        onValueChange={(value) => setGuidedPrompt((prev) => ({ ...prev, awarenessLevel: value }))}
                                        onOtherChange={(value) => setGuidedPrompt((prev) => ({ ...prev, awarenessLevelOther: value }))}
                                      />
                                    </Stack>
                                    <SelectWithOtherField
                                      label="Zone geographique / langue"
                                      value={guidedPrompt.geography}
                                      otherValue={guidedPrompt.geographyOther}
                                      options={GEOGRAPHY_OPTIONS}
                                      onValueChange={(value) => setGuidedPrompt((prev) => ({ ...prev, geography: value }))}
                                      onOtherChange={(value) => setGuidedPrompt((prev) => ({ ...prev, geographyOther: value }))}
                                    />
                                  </Stack>
                                ) : null}

                                {activeStep === 1 ? (
                                  <Stack spacing={3}>
                                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                                      <SelectWithOtherField
                                        label="Promesse principale"
                                        value={guidedPrompt.promise}
                                        otherValue={guidedPrompt.promiseOther}
                                        options={PROMISE_OPTIONS}
                                        onValueChange={(value) => setGuidedPrompt((prev) => ({ ...prev, promise: value }))}
                                        onOtherChange={(value) => setGuidedPrompt((prev) => ({ ...prev, promiseOther: value }))}
                                      />
                                      <SelectWithOtherField
                                        label="Angle marketing"
                                        value={guidedPrompt.marketingAngle}
                                        otherValue={guidedPrompt.marketingAngleOther}
                                        options={MARKETING_ANGLE_OPTIONS}
                                        onValueChange={(value) => setGuidedPrompt((prev) => ({ ...prev, marketingAngle: value }))}
                                        onOtherChange={(value) => setGuidedPrompt((prev) => ({ ...prev, marketingAngleOther: value }))}
                                      />
                                    </Stack>
                                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                                      <SelectWithOtherField
                                        label="Niveau de preuve"
                                        value={guidedPrompt.proofLevel}
                                        otherValue={guidedPrompt.proofLevelOther}
                                        options={PROOF_LEVEL_OPTIONS}
                                        onValueChange={(value) => setGuidedPrompt((prev) => ({ ...prev, proofLevel: value }))}
                                        onOtherChange={(value) => setGuidedPrompt((prev) => ({ ...prev, proofLevelOther: value }))}
                                      />
                                      <SelectWithOtherField
                                        label="Ton"
                                        value={guidedPrompt.tone}
                                        otherValue={guidedPrompt.toneOther}
                                        options={TONE_OPTIONS}
                                        onValueChange={(value) => setGuidedPrompt((prev) => ({ ...prev, tone: value }))}
                                        onOtherChange={(value) => setGuidedPrompt((prev) => ({ ...prev, toneOther: value }))}
                                      />
                                    </Stack>
                                    <SelectWithOtherField
                                      label="Style de copywriting"
                                      value={guidedPrompt.copyStyle}
                                      otherValue={guidedPrompt.copyStyleOther}
                                      options={COPY_STYLE_OPTIONS}
                                      onValueChange={(value) => setGuidedPrompt((prev) => ({ ...prev, copyStyle: value }))}
                                      onOtherChange={(value) => setGuidedPrompt((prev) => ({ ...prev, copyStyleOther: value }))}
                                    />
                                    <TextField
                                      fullWidth
                                      label="Promesse en une phrase"
                                      value={guidedPrompt.promiseSentence}
                                      onChange={(event) => setGuidedPrompt((prev) => ({ ...prev, promiseSentence: event.target.value }))}
                                    />
                                    <TextField
                                      fullWidth
                                      label="Objection principale du visiteur"
                                      value={guidedPrompt.mainObjection}
                                      onChange={(event) => setGuidedPrompt((prev) => ({ ...prev, mainObjection: event.target.value }))}
                                    />
                                    <TextField
                                      fullWidth
                                      label="Element differentiant principal"
                                      value={guidedPrompt.differentiator}
                                      onChange={(event) => setGuidedPrompt((prev) => ({ ...prev, differentiator: event.target.value }))}
                                    />
                                  </Stack>
                                ) : null}

                                {activeStep === 2 ? (
                                  <Stack spacing={3}>
                                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                                      <SelectWithOtherField
                                        label="Direction artistique"
                                        value={guidedPrompt.style}
                                        otherValue={guidedPrompt.styleOther}
                                        options={STYLE_OPTIONS}
                                        onValueChange={(value) => setGuidedPrompt((prev) => ({ ...prev, style: value }))}
                                        onOtherChange={(value) => setGuidedPrompt((prev) => ({ ...prev, styleOther: value }))}
                                      />
                                      <SelectWithOtherField
                                        label="Ambiance"
                                        value={guidedPrompt.ambiance}
                                        otherValue={guidedPrompt.ambianceOther}
                                        options={AMBIANCE_OPTIONS}
                                        onValueChange={(value) => setGuidedPrompt((prev) => ({ ...prev, ambiance: value }))}
                                        onOtherChange={(value) => setGuidedPrompt((prev) => ({ ...prev, ambianceOther: value }))}
                                      />
                                    </Stack>
                                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                                      <SelectWithOtherField
                                        label="Style d'interface"
                                        value={guidedPrompt.uiStyle}
                                        otherValue={guidedPrompt.uiStyleOther}
                                        options={UI_STYLE_OPTIONS}
                                        onValueChange={(value) => setGuidedPrompt((prev) => ({ ...prev, uiStyle: value }))}
                                        onOtherChange={(value) => setGuidedPrompt((prev) => ({ ...prev, uiStyleOther: value }))}
                                      />
                                      <SelectWithOtherField
                                        label="Forme"
                                        value={guidedPrompt.cornerStyle}
                                        otherValue={guidedPrompt.cornerStyleOther}
                                        options={CORNER_STYLE_OPTIONS}
                                        onValueChange={(value) => setGuidedPrompt((prev) => ({ ...prev, cornerStyle: value }))}
                                        onOtherChange={(value) => setGuidedPrompt((prev) => ({ ...prev, cornerStyleOther: value }))}
                                      />
                                    </Stack>
                                    <TextField
                                      fullWidth
                                      label="Reference visuelle"
                                      placeholder="Ex: inspire de Linear, Notion, Apple, magazine luxe, application mobile premium..."
                                      value={guidedPrompt.referenceVisual}
                                      onChange={(event) => setGuidedPrompt((prev) => ({ ...prev, referenceVisual: event.target.value }))}
                                    />
                                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                                      <TextField
                                        fullWidth
                                        label="Emotion a provoquer"
                                        value={guidedPrompt.emotion}
                                        onChange={(event) => setGuidedPrompt((prev) => ({ ...prev, emotion: event.target.value }))}
                                      />
                                      <TextField
                                        fullWidth
                                        label="Action en moins de 10 secondes"
                                        value={guidedPrompt.quickAction}
                                        onChange={(event) => setGuidedPrompt((prev) => ({ ...prev, quickAction: event.target.value }))}
                                      />
                                    </Stack>
                                    <TextField
                                      fullWidth
                                      label="Gestion des couleurs"
                                      select
                                      value={guidedPrompt.colorMode}
                                      onChange={(event) =>
                                        setGuidedPrompt((prev) => ({
                                          ...prev,
                                          colorMode: event.target.value as ColorMode,
                                        }))
                                      }
                                    >
                                      {COLOR_MODE_OPTIONS.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                          {option.label}
                                        </MenuItem>
                                      ))}
                                    </TextField>
                                    <TextField
                                      fullWidth
                                      label="Gradients"
                                      select
                                      value={guidedPrompt.gradientMode}
                                      onChange={(event) =>
                                        setGuidedPrompt((prev) => ({
                                          ...prev,
                                          gradientMode: event.target.value as GradientMode,
                                        }))
                                      }
                                      helperText="Tu peux imposer un rendu plus flat ou laisser le modele utiliser des gradients."
                                    >
                                      {GRADIENT_MODE_OPTIONS.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                          {option.label}
                                        </MenuItem>
                                      ))}
                                    </TextField>
                                    {guidedPrompt.colorMode === "palette" ? (
                                      <PaletteSelector
                                        value={guidedPrompt.palette}
                                        otherValue={guidedPrompt.paletteOther}
                                        gradientMode={guidedPrompt.gradientMode}
                                        onValueChange={(value) => setGuidedPrompt((prev) => ({ ...prev, palette: value }))}
                                        onOtherChange={(value) => setGuidedPrompt((prev) => ({ ...prev, paletteOther: value }))}
                                      />
                                    ) : null}
                                    {guidedPrompt.colorMode === "custom" ? (
                                      <Stack direction={{ xs: "column", md: "row" }} flexWrap="wrap" gap={2}>
                                        <TextField
                                          label="Couleur primaire"
                                          type="color"
                                          value={guidedPrompt.customPrimary}
                                          onChange={(event) => setGuidedPrompt((prev) => ({ ...prev, customPrimary: event.target.value }))}
                                          sx={{ minWidth: 160 }}
                                          InputLabelProps={{ shrink: true }}
                                        />
                                        <TextField
                                          label="Couleur secondaire"
                                          type="color"
                                          value={guidedPrompt.customSecondary}
                                          onChange={(event) => setGuidedPrompt((prev) => ({ ...prev, customSecondary: event.target.value }))}
                                          sx={{ minWidth: 160 }}
                                          InputLabelProps={{ shrink: true }}
                                        />
                                        <TextField
                                          label="Couleur accent"
                                          type="color"
                                          value={guidedPrompt.customAccent}
                                          onChange={(event) => setGuidedPrompt((prev) => ({ ...prev, customAccent: event.target.value }))}
                                          sx={{ minWidth: 160 }}
                                          InputLabelProps={{ shrink: true }}
                                        />
                                        <TextField
                                          label="Fond"
                                          type="color"
                                          value={guidedPrompt.customBackground}
                                          onChange={(event) => setGuidedPrompt((prev) => ({ ...prev, customBackground: event.target.value }))}
                                          sx={{ minWidth: 160 }}
                                          InputLabelProps={{ shrink: true }}
                                        />
                                        <TextField
                                          label="Texte"
                                          type="color"
                                          value={guidedPrompt.customText}
                                          onChange={(event) => setGuidedPrompt((prev) => ({ ...prev, customText: event.target.value }))}
                                          sx={{ minWidth: 160 }}
                                          InputLabelProps={{ shrink: true }}
                                        />
                                      </Stack>
                                    ) : null}
                                  </Stack>
                                ) : null}

                                {activeStep === 3 ? (
                                  <Stack spacing={3}>
                                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                                      <SelectWithOtherField
                                        label="Disposition hero"
                                        value={guidedPrompt.heroLayout}
                                        otherValue={guidedPrompt.heroLayoutOther}
                                        options={HERO_LAYOUT_OPTIONS}
                                        onValueChange={(value) => setGuidedPrompt((prev) => ({ ...prev, heroLayout: value }))}
                                        onOtherChange={(value) => setGuidedPrompt((prev) => ({ ...prev, heroLayoutOther: value }))}
                                      />
                                      <SelectWithOtherField
                                        label="Contenu hero"
                                        value={guidedPrompt.heroContent}
                                        otherValue={guidedPrompt.heroContentOther}
                                        options={HERO_CONTENT_OPTIONS}
                                        onValueChange={(value) => setGuidedPrompt((prev) => ({ ...prev, heroContent: value }))}
                                        onOtherChange={(value) => setGuidedPrompt((prev) => ({ ...prev, heroContentOther: value }))}
                                      />
                                    </Stack>
                                    <SelectWithOtherField
                                      label="Media hero"
                                      value={guidedPrompt.heroMedia}
                                      otherValue={guidedPrompt.heroMediaOther}
                                      options={HERO_MEDIA_OPTIONS}
                                      onValueChange={(value) => setGuidedPrompt((prev) => ({ ...prev, heroMedia: value }))}
                                      onOtherChange={(value) => setGuidedPrompt((prev) => ({ ...prev, heroMediaOther: value }))}
                                    />
                                    <TextField
                                      fullWidth
                                      label="Image de la section hero"
                                      select
                                      value={guidedPrompt.heroImageMode}
                                      onChange={(event) =>
                                        setGuidedPrompt((prev) => ({
                                          ...prev,
                                          heroImageMode: event.target.value as HeroImageMode,
                                        }))
                                      }
                                    >
                                      {HERO_IMAGE_OPTIONS.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                          {option.label}
                                        </MenuItem>
                                      ))}
                                    </TextField>
                                    {guidedPrompt.heroImageMode === "custom" ? (
                                      <TextField
                                        fullWidth
                                        helperText="Ex: dashboard cyber premium sur ecran sombre, plat signature en gros plan, mockup iPhone moderne..."
                                        label="Descriptif de l'image hero"
                                        minRows={3}
                                        multiline
                                        value={guidedPrompt.heroImageCustomDescription}
                                        onChange={(event) =>
                                          setGuidedPrompt((prev) => ({
                                            ...prev,
                                            heroImageCustomDescription: event.target.value,
                                          }))
                                        }
                                      />
                                    ) : null}
                                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                                      <TextField
                                        fullWidth
                                        label="Nombre de visuels de galerie"
                                        select
                                        value={guidedPrompt.galleryImageCount}
                                        onChange={(event) =>
                                          setGuidedPrompt((prev) => ({ ...prev, galleryImageCount: event.target.value }))
                                        }
                                      >
                                        {GALLERY_IMAGE_COUNT_OPTIONS.map((option) => (
                                          <MenuItem key={option} value={option}>
                                            {option}
                                          </MenuItem>
                                        ))}
                                      </TextField>
                                      <SelectWithOtherField
                                        label="Affichage de la galerie"
                                        value={guidedPrompt.imageDisplay}
                                        otherValue={guidedPrompt.imageDisplayOther}
                                        options={IMAGE_DISPLAY_OPTIONS}
                                        onValueChange={(value) => setGuidedPrompt((prev) => ({ ...prev, imageDisplay: value }))}
                                        onOtherChange={(value) => setGuidedPrompt((prev) => ({ ...prev, imageDisplayOther: value }))}
                                        helperText="React s'adaptera a carousel, grid, masonry, stacked ou split si possible."
                                      />
                                    </Stack>
                                    {guidedPrompt.galleryImageCount !== "0" ? (
                                      <Stack spacing={2}>
                                        <TextField
                                          fullWidth
                                          label="Descriptif des visuels de galerie"
                                          select
                                          value={guidedPrompt.galleryDescriptionMode}
                                          onChange={(event) =>
                                            setGuidedPrompt((prev) => ({
                                              ...prev,
                                              galleryDescriptionMode: event.target.value as DescriptionMode,
                                            }))
                                          }
                                        >
                                          {IMAGE_DESCRIPTION_OPTIONS.map((option) => (
                                            <MenuItem key={option.value} value={option.value}>
                                              {option.label}
                                            </MenuItem>
                                          ))}
                                        </TextField>
                                        {guidedPrompt.galleryDescriptionMode === "custom" ? (
                                          <TextField
                                            fullWidth
                                            helperText="Ex: captures produit, scenes d'usage, details premium, equipe en action..."
                                            label="Descriptif personnalise de la galerie"
                                            minRows={3}
                                            multiline
                                            value={guidedPrompt.galleryCustomDescription}
                                            onChange={(event) =>
                                              setGuidedPrompt((prev) => ({ ...prev, galleryCustomDescription: event.target.value }))
                                            }
                                          />
                                        ) : null}
                                      </Stack>
                                    ) : null}
                                    <Divider />
                                    <CheckboxSuggestionGroup
                                      label="Sections principales"
                                      options={SECTION_OPTIONS}
                                      values={guidedPrompt.sections}
                                      onToggle={(value) =>
                                        setGuidedPrompt((prev) => ({
                                          ...prev,
                                          sections: toggleInList(prev.sections, value),
                                        }))
                                      }
                                      otherValue={guidedPrompt.sectionsOther}
                                      onOtherChange={(value) => setGuidedPrompt((prev) => ({ ...prev, sectionsOther: value }))}
                                      otherLabel="Autres sections"
                                    />
                                    <Divider />
                                    <CheckboxSuggestionGroup
                                      label="Sections avancees"
                                      options={ADVANCED_SECTION_OPTIONS}
                                      values={guidedPrompt.advancedSections}
                                      onToggle={(value) =>
                                        setGuidedPrompt((prev) => ({
                                          ...prev,
                                          advancedSections: toggleInList(prev.advancedSections, value),
                                        }))
                                      }
                                      otherValue={guidedPrompt.advancedSectionsOther}
                                      onOtherChange={(value) => setGuidedPrompt((prev) => ({ ...prev, advancedSectionsOther: value }))}
                                      otherLabel="Autres sections avancees"
                                    />
                                    <Divider />
                                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                                      <Box sx={{ flex: 1 }}>
                                        <CheckboxSuggestionGroup
                                          label="Sections obligatoires"
                                          options={SECTION_OPTIONS}
                                          values={guidedPrompt.requiredSections}
                                          onToggle={(value) =>
                                            setGuidedPrompt((prev) => ({
                                              ...prev,
                                              requiredSections: toggleInList(prev.requiredSections, value),
                                            }))
                                          }
                                          otherValue={guidedPrompt.requiredSectionsOther}
                                          onOtherChange={(value) => setGuidedPrompt((prev) => ({ ...prev, requiredSectionsOther: value }))}
                                          otherLabel="Autres sections obligatoires"
                                        />
                                      </Box>
                                      <Box sx={{ flex: 1 }}>
                                        <CheckboxSuggestionGroup
                                          label="Sections interdites"
                                          options={SECTION_OPTIONS}
                                          values={guidedPrompt.forbiddenSections}
                                          onToggle={(value) =>
                                            setGuidedPrompt((prev) => ({
                                              ...prev,
                                              forbiddenSections: toggleInList(prev.forbiddenSections, value),
                                            }))
                                          }
                                          otherValue={guidedPrompt.forbiddenSectionsOther}
                                          onOtherChange={(value) => setGuidedPrompt((prev) => ({ ...prev, forbiddenSectionsOther: value }))}
                                          otherLabel="Autres sections interdites"
                                        />
                                      </Box>
                                    </Stack>
                                  </Stack>
                                ) : null}

                                {activeStep === 4 ? (
                                  <Stack spacing={3}>
                                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                                      <SelectWithOtherField
                                        label="CTA principal"
                                        value={guidedPrompt.cta}
                                        otherValue={guidedPrompt.ctaOther}
                                        options={CTA_OPTIONS}
                                        onValueChange={(value) => setGuidedPrompt((prev) => ({ ...prev, cta: value }))}
                                        onOtherChange={(value) => setGuidedPrompt((prev) => ({ ...prev, ctaOther: value }))}
                                      />
                                      <SelectWithOtherField
                                        label="CTA secondaire"
                                        value={guidedPrompt.secondaryCta}
                                        otherValue={guidedPrompt.secondaryCtaOther}
                                        options={SECONDARY_CTA_OPTIONS}
                                        onValueChange={(value) => setGuidedPrompt((prev) => ({ ...prev, secondaryCta: value }))}
                                        onOtherChange={(value) => setGuidedPrompt((prev) => ({ ...prev, secondaryCtaOther: value }))}
                                      />
                                    </Stack>
                                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                                      <SelectWithOtherField
                                        label="Objectif du formulaire"
                                        value={guidedPrompt.formGoal}
                                        otherValue={guidedPrompt.formGoalOther}
                                        options={FORM_GOAL_OPTIONS}
                                        onValueChange={(value) => setGuidedPrompt((prev) => ({ ...prev, formGoal: value }))}
                                        onOtherChange={(value) => setGuidedPrompt((prev) => ({ ...prev, formGoalOther: value }))}
                                      />
                                      <SelectWithOtherField
                                        label="Niveau de friction du formulaire"
                                        value={guidedPrompt.formFriction}
                                        otherValue={guidedPrompt.formFrictionOther}
                                        options={FORM_FRICTION_OPTIONS}
                                        onValueChange={(value) => setGuidedPrompt((prev) => ({ ...prev, formFriction: value }))}
                                        onOtherChange={(value) => setGuidedPrompt((prev) => ({ ...prev, formFrictionOther: value }))}
                                      />
                                    </Stack>
                                    <CheckboxSuggestionGroup
                                      label="Champs du formulaire"
                                      options={FORM_FIELD_OPTIONS}
                                      values={guidedPrompt.formFields}
                                      onToggle={(value) =>
                                        setGuidedPrompt((prev) => ({
                                          ...prev,
                                          formFields: toggleInList(prev.formFields, value),
                                        }))
                                      }
                                      otherValue={guidedPrompt.formFieldsOther}
                                      onOtherChange={(value) => setGuidedPrompt((prev) => ({ ...prev, formFieldsOther: value }))}
                                      otherLabel="Autres champs"
                                    />
                                    <Divider />
                                    <CheckboxSuggestionGroup
                                      label="Elements de preuve sociale"
                                      options={PROOF_ELEMENT_OPTIONS}
                                      values={guidedPrompt.proofElements}
                                      onToggle={(value) =>
                                        setGuidedPrompt((prev) => ({
                                          ...prev,
                                          proofElements: toggleInList(prev.proofElements, value),
                                        }))
                                      }
                                      otherValue={guidedPrompt.proofElementsOther}
                                      onOtherChange={(value) => setGuidedPrompt((prev) => ({ ...prev, proofElementsOther: value }))}
                                      otherLabel="Autres elements de preuve"
                                    />
                                    <Divider />
                                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                                      <SelectWithOtherField
                                        label="Etape du funnel"
                                        value={guidedPrompt.funnelStage}
                                        otherValue={guidedPrompt.funnelStageOther}
                                        options={FUNNEL_STAGE_OPTIONS}
                                        onValueChange={(value) => setGuidedPrompt((prev) => ({ ...prev, funnelStage: value }))}
                                        onOtherChange={(value) => setGuidedPrompt((prev) => ({ ...prev, funnelStageOther: value }))}
                                      />
                                      <SelectWithOtherField
                                        label="Type d'offre"
                                        value={guidedPrompt.offerType}
                                        otherValue={guidedPrompt.offerTypeOther}
                                        options={OFFER_TYPE_OPTIONS}
                                        onValueChange={(value) => setGuidedPrompt((prev) => ({ ...prev, offerType: value }))}
                                        onOtherChange={(value) => setGuidedPrompt((prev) => ({ ...prev, offerTypeOther: value }))}
                                      />
                                    </Stack>
                                    <SelectWithOtherField
                                      label="Urgence / rarete"
                                      value={guidedPrompt.urgency}
                                      otherValue={guidedPrompt.urgencyOther}
                                      options={URGENCY_OPTIONS}
                                      onValueChange={(value) => setGuidedPrompt((prev) => ({ ...prev, urgency: value }))}
                                      onOtherChange={(value) => setGuidedPrompt((prev) => ({ ...prev, urgencyOther: value }))}
                                    />
                                    <CheckboxSuggestionGroup
                                      label="Animations"
                                      options={ANIMATION_OPTIONS}
                                      values={guidedPrompt.animationTypes}
                                      onToggle={(value) =>
                                        setGuidedPrompt((prev) => ({
                                          ...prev,
                                          animationTypes: toggleInList(prev.animationTypes, value),
                                        }))
                                      }
                                      otherValue={guidedPrompt.animationTypesOther}
                                      onOtherChange={(value) => setGuidedPrompt((prev) => ({ ...prev, animationTypesOther: value }))}
                                      otherLabel="Autres animations"
                                    />
                                  </Stack>
                                ) : null}

                                {activeStep === 5 ? (
                                  <Stack spacing={3}>
                                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                                      <SelectWithOtherField
                                        label="Langue"
                                        value={guidedPrompt.language}
                                        otherValue={guidedPrompt.languageOther}
                                        options={LANGUAGE_OPTIONS}
                                        onValueChange={(value) => setGuidedPrompt((prev) => ({ ...prev, language: value }))}
                                        onOtherChange={(value) => setGuidedPrompt((prev) => ({ ...prev, languageOther: value }))}
                                      />
                                      <SelectWithOtherField
                                        label="Cible device"
                                        value={guidedPrompt.targetDevice}
                                        otherValue={guidedPrompt.targetDeviceOther}
                                        options={TARGET_DEVICE_OPTIONS}
                                        onValueChange={(value) => setGuidedPrompt((prev) => ({ ...prev, targetDevice: value }))}
                                        onOtherChange={(value) => setGuidedPrompt((prev) => ({ ...prev, targetDeviceOther: value }))}
                                      />
                                    </Stack>
                                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                                      <SelectWithOtherField
                                        label="Densite"
                                        value={guidedPrompt.density}
                                        otherValue={guidedPrompt.densityOther}
                                        options={DENSITY_OPTIONS}
                                        onValueChange={(value) => setGuidedPrompt((prev) => ({ ...prev, density: value }))}
                                        onOtherChange={(value) => setGuidedPrompt((prev) => ({ ...prev, densityOther: value }))}
                                      />
                                      <SelectWithOtherField
                                        label="Accessibilite"
                                        value={guidedPrompt.accessibility}
                                        otherValue={guidedPrompt.accessibilityOther}
                                        options={ACCESSIBILITY_OPTIONS}
                                        onValueChange={(value) => setGuidedPrompt((prev) => ({ ...prev, accessibility: value }))}
                                        onOtherChange={(value) => setGuidedPrompt((prev) => ({ ...prev, accessibilityOther: value }))}
                                      />
                                    </Stack>
                                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                                      <SelectWithOtherField
                                        label="Header"
                                        value={guidedPrompt.headerStyle}
                                        otherValue={guidedPrompt.headerStyleOther}
                                        options={HEADER_STYLE_OPTIONS}
                                        onValueChange={(value) => setGuidedPrompt((prev) => ({ ...prev, headerStyle: value }))}
                                        onOtherChange={(value) => setGuidedPrompt((prev) => ({ ...prev, headerStyleOther: value }))}
                                      />
                                      <SelectWithOtherField
                                        label="Footer"
                                        value={guidedPrompt.footerStyle}
                                        otherValue={guidedPrompt.footerStyleOther}
                                        options={FOOTER_STYLE_OPTIONS}
                                        onValueChange={(value) => setGuidedPrompt((prev) => ({ ...prev, footerStyle: value }))}
                                        onOtherChange={(value) => setGuidedPrompt((prev) => ({ ...prev, footerStyleOther: value }))}
                                      />
                                    </Stack>
                                    <CheckboxSuggestionGroup
                                      label="Focus specialise"
                                      options={SPECIALIZED_FOCUS_OPTIONS}
                                      values={guidedPrompt.specializedFocus}
                                      onToggle={(value) =>
                                        setGuidedPrompt((prev) => ({
                                          ...prev,
                                          specializedFocus: toggleInList(prev.specializedFocus, value),
                                        }))
                                      }
                                      otherValue={guidedPrompt.specializedFocusOther}
                                      onOtherChange={(value) => setGuidedPrompt((prev) => ({ ...prev, specializedFocusOther: value }))}
                                      otherLabel="Autres focus specialises"
                                    />
                                    <TextField
                                      fullWidth
                                      helperText="Ex: jargon trop technique, trop de sections, style trop corporate, trop de texte..."
                                      label="Ce qu'il faut absolument eviter"
                                      minRows={3}
                                      multiline
                                      value={guidedPrompt.avoidThings}
                                      onChange={(event) => setGuidedPrompt((prev) => ({ ...prev, avoidThings: event.target.value }))}
                                    />
                                    <TextField
                                      fullWidth
                                      helperText="Ex: reference visuelle, contraintes business, angle marketing, infos produit, structure specifique..."
                                      label="Notes supplementaires"
                                      minRows={4}
                                      multiline
                                      value={guidedPrompt.notes}
                                      onChange={(event) => setGuidedPrompt((prev) => ({ ...prev, notes: event.target.value }))}
                                    />
                                  </Stack>
                                ) : null}
                              </Box>
                            </Fade>

                            <Stack
                              direction={{ xs: "column", md: "row" }}
                              justifyContent="space-between"
                              spacing={2}
                            >
                              <Button
                                disabled={activeStep === 0 || loading}
                                startIcon={<ChevronLeftRoundedIcon />}
                                type="button"
                                variant="text"
                                sx={{
                                  borderRadius: 999,
                                  color: CAPTURIA_COLORS.navySoft,
                                }}
                                onClick={handlePreviousStep}
                              >
                                Etape precedente
                              </Button>
                              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                                {activeStep < GUIDED_STEPS.length - 1 ? (
                                  <Button
                                    disabled={loading}
                                    endIcon={<ChevronRightRoundedIcon />}
                                    type="button"
                                    variant="contained"
                                    sx={{
                                      borderRadius: 999,
                                      px: 3,
                                      bgcolor: CAPTURIA_COLORS.teal,
                                      boxShadow: "0 14px 30px rgba(20,184,166,0.24)",
                                      "&:hover": {
                                        bgcolor: CAPTURIA_COLORS.tealDark,
                                      },
                                    }}
                                    onClick={handleNextStep}
                                  >
                                    Continuer
                                  </Button>
                                ) : (
                                  <Button
                                    disabled={loading}
                                    endIcon={
                                      loading ? <CircularProgress color="inherit" size={18} /> : <RocketLaunchRoundedIcon />
                                    }
                                    type="submit"
                                    variant="contained"
                                    sx={{
                                      borderRadius: 999,
                                      px: 3,
                                      bgcolor: CAPTURIA_COLORS.teal,
                                      boxShadow: "0 14px 30px rgba(20,184,166,0.24)",
                                      "&:hover": {
                                        bgcolor: CAPTURIA_COLORS.tealDark,
                                      },
                                    }}
                                  >
                                    {loading ? "Generation..." : "Generer la page"}
                                  </Button>
                                )}
                              </Stack>
                            </Stack>
                          </Stack>
                        </Paper>
                      </Stack>
                      <Stack
                        spacing={2}
                        sx={{
                          position: { xl: "sticky" },
                          top: { xl: 24 },
                        }}
                      >
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2.5,
                            borderRadius: 5,
                            border: "1px solid",
                            borderColor: alpha(CAPTURIA_COLORS.teal, 0.18),
                            background:
                              `linear-gradient(180deg, ${CAPTURIA_COLORS.navy} 0%, ${CAPTURIA_COLORS.navySoft} 100%)`,
                            color: CAPTURIA_COLORS.white,
                            boxShadow: "0 20px 44px rgba(15,23,42,0.16)",
                          }}
                        >
                          <Stack spacing={2}>
                            <Typography sx={{ color: "rgba(255,255,255,0.72)" }} variant="overline">
                              Synthese du brief
                            </Typography>
                            <Typography sx={{ fontWeight: 800 }} variant="h6">
                              {GUIDED_STEPS[activeStep].title}
                            </Typography>
                            <Typography sx={{ color: "rgba(255,255,255,0.78)" }} variant="body2">
                              {GUIDED_STEPS[activeStep].description}
                            </Typography>
                            <LinearProgress
                              sx={{
                                height: 8,
                                borderRadius: 999,
                                bgcolor: "rgba(255,255,255,0.12)",
                                "& .MuiLinearProgress-bar": {
                                  borderRadius: 999,
                                  bgcolor: CAPTURIA_COLORS.teal,
                                },
                              }}
                              value={completionRatio}
                              variant="determinate"
                            />
                            <Stack direction="row" justifyContent="space-between">
                              <Typography sx={{ color: "rgba(255,255,255,0.72)" }} variant="body2">
                                Progression
                              </Typography>
                              <Typography sx={{ fontWeight: 700 }} variant="body2">
                                {Math.round(completionRatio)}%
                              </Typography>
                            </Stack>
                          </Stack>
                        </Paper>

                        <Paper
                          elevation={0}
                          sx={{
                            p: 2.5,
                            borderRadius: 5,
                            border: "1px solid",
                            borderColor: CAPTURIA_COLORS.border,
                            bgcolor: CAPTURIA_COLORS.white,
                            boxShadow: "0 16px 34px rgba(15,23,42,0.05)",
                          }}
                        >
                          <Stack spacing={1.5}>
                            <Typography sx={{ color: CAPTURIA_COLORS.navy, fontWeight: 800 }} variant="subtitle1">
                              Sections retenues
                            </Typography>
                            <Stack direction="row" flexWrap="wrap" gap={1}>
                              {selectedSections.map((section) => (
                                <Chip
                                  key={section}
                                  label={section}
                                  size="small"
                                  sx={{
                                    borderColor: alpha(CAPTURIA_COLORS.teal, 0.18),
                                    bgcolor: alpha(CAPTURIA_COLORS.teal, 0.06),
                                    color: CAPTURIA_COLORS.navySoft,
                                  }}
                                  variant="outlined"
                                />
                              ))}
                            </Stack>
                          </Stack>
                        </Paper>

                        <Paper
                          elevation={0}
                          sx={{
                            p: 2.5,
                            borderRadius: 5,
                            border: "1px solid",
                            borderColor: CAPTURIA_COLORS.border,
                            bgcolor: CAPTURIA_COLORS.white,
                            boxShadow: "0 16px 34px rgba(15,23,42,0.05)",
                          }}
                        >
                          <Stack spacing={1.5}>
                            <Typography sx={{ color: CAPTURIA_COLORS.navy, fontWeight: 800 }} variant="subtitle1">
                              Apercus responsive
                            </Typography>
                            <Stack spacing={2}>
                              <Box>
                                <Typography sx={{ color: CAPTURIA_COLORS.textMuted, mb: 1 }} variant="body2">
                                  Mobile
                                </Typography>
                                <Box
                                  sx={{
                                    mx: "auto",
                                    width: { xs: 238, sm: 250 },
                                    borderRadius: `${previewTheme.cornerRadius * 5}px`,
                                    p: 1.1,
                                    bgcolor: "#0f172a",
                                    boxShadow: "0 28px 54px rgba(15,23,42,0.24)",
                                  }}
                                >
                                  <Box
                                    sx={{
                                      width: "100%",
                                      borderRadius: `${previewTheme.cornerRadius * 4}px`,
                                      overflow: "hidden",
                                      bgcolor: "#111827",
                                      border: "1px solid rgba(255,255,255,0.08)",
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        px: 1.3,
                                        py: 0.9,
                                        color: "rgba(255,255,255,0.82)",
                                        fontSize: 11,
                                        fontWeight: 700,
                                      }}
                                    >
                                      <Box>9:41</Box>
                                      <Box
                                        sx={{
                                          width: 70,
                                          height: 6,
                                          borderRadius: `${previewTheme.pillRadius}px`,
                                          bgcolor: "rgba(255,255,255,0.16)",
                                        }}
                                      />
                                      <Box>5G</Box>
                                    </Box>
                                    <Box
                                      sx={{
                                        p: 0.85,
                                        maxHeight: 500,
                                        overflow: "auto",
                                        bgcolor: previewTheme.surface,
                                      }}
                                    >
                                      <PageSkeletonPreview
                                        sections={previewSections}
                                        theme={previewTheme}
                                        viewport="mobile"
                                        websiteName={guidedPrompt.websiteName}
                                      />
                                    </Box>
                                  </Box>
                                </Box>
                              </Box>

                            </Stack>
                          </Stack>
                        </Paper>
                      </Stack>
                    </Box>
                  </Stack>
                )}

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  {mode === "free" ? (
                    <Button
                      disabled={loading}
                      size="large"
                      type="submit"
                      variant="contained"
                      sx={{
                        borderRadius: 999,
                        px: 3,
                        bgcolor: CAPTURIA_COLORS.teal,
                        boxShadow: "0 14px 30px rgba(20,184,166,0.24)",
                        "&:hover": {
                          bgcolor: CAPTURIA_COLORS.tealDark,
                        },
                      }}
                    >
                      {loading ? <CircularProgress color="inherit" size={20} /> : "Generer et sauvegarder"}
                    </Button>
                  ) : null}
                  <Button
                    href="/"
                    size="large"
                    type="button"
                    variant="text"
                    sx={{
                      borderRadius: 999,
                      color: CAPTURIA_COLORS.navy,
                    }}
                  >
                    Voir le resultat
                  </Button>
                  <Button
                    disabled={loading}
                    size="large"
                    type="button"
                    variant="outlined"
                    sx={{
                      borderRadius: 999,
                      borderColor: CAPTURIA_COLORS.border,
                      color: CAPTURIA_COLORS.navySoft,
                    }}
                    onClick={handleReset}
                  >
                    Reinitialiser
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </Paper>

          {error ? (
            <Alert
              severity="error"
              sx={{
                borderRadius: 4,
                border: "1px solid rgba(239,68,68,0.18)",
              }}
            >
              {error}
            </Alert>
          ) : null}
          {successMessage ? (
            <Alert
              severity="success"
              sx={{
                borderRadius: 4,
                border: "1px solid rgba(34,197,94,0.18)",
              }}
            >
              {successMessage}
            </Alert>
          ) : null}

          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 6,
              border: "1px solid",
              borderColor: CAPTURIA_COLORS.border,
              bgcolor: CAPTURIA_COLORS.white,
              boxShadow: "0 18px 44px rgba(15,23,42,0.06)",
            }}
          >
            <Stack spacing={2.5}>
              <Stack
                alignItems={{ xs: "flex-start", md: "center" }}
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                spacing={2}
              >
                <Box>
                  <Typography sx={{ color: CAPTURIA_COLORS.navy, fontWeight: 800 }} variant="h4">
                    Apercu live de la page
                  </Typography>
                  <Typography sx={{ color: CAPTURIA_COLORS.textMuted, maxWidth: 760 }}>
                    Cette maquette squelette evolue selon les sections, les visuels et le style
                    choisis. Elle aide l'utilisateur a visualiser la page avant generation.
                  </Typography>
                </Box>
                <Chip
                  label={`${previewSections.length} blocs affiches`}
                  sx={{
                    borderColor: alpha(previewTheme.accent, 0.18),
                    bgcolor: alpha(previewTheme.accent, 0.08),
                    color: CAPTURIA_COLORS.navySoft,
                    fontWeight: 700,
                  }}
                  variant="outlined"
                />
              </Stack>

              <Box
                sx={{
                  borderRadius: 5,
                  bgcolor: "#0f172a",
                  p: 1.1,
                  boxShadow: "0 28px 60px rgba(15,23,42,0.16)",
                }}
              >
                <Stack
                  alignItems="center"
                  direction="row"
                  justifyContent="space-between"
                  sx={{
                    px: 1,
                    py: 0.8,
                  }}
                >
                  <Stack direction="row" spacing={0.75}>
                    {["#fb7185", "#f59e0b", "#22c55e"].map((dot) => (
                      <Box
                        key={dot}
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: 999,
                          bgcolor: dot,
                        }}
                      />
                    ))}
                  </Stack>
                  <Box
                    sx={{
                      px: 2,
                      py: 0.65,
                      borderRadius: 999,
                      bgcolor: "rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.72)",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    Desktop preview
                  </Box>
                  <Box sx={{ width: 56 }} />
                </Stack>

                <Box
                  sx={{
                    borderRadius: 4,
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.06)",
                    bgcolor: previewTheme.surface,
                  }}
                >
                  <Box
                    sx={{
                      maxHeight: 720,
                      overflow: "auto",
                      p: { xs: 1.25, md: 1.5 },
                    }}
                  >
                    <PageSkeletonPreview
                      sections={previewSections}
                      theme={previewTheme}
                      viewport="desktop"
                      websiteName={guidedPrompt.websiteName}
                    />
                  </Box>
                </Box>
              </Box>
            </Stack>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 6,
              border: "1px solid",
              borderColor: CAPTURIA_COLORS.border,
              bgcolor: CAPTURIA_COLORS.white,
              boxShadow: "0 16px 40px rgba(15,23,42,0.05)",
            }}
          >
            <Stack spacing={2}>
              <Typography sx={{ color: CAPTURIA_COLORS.navy, fontWeight: 800 }} variant="h4">
                JSON genere
              </Typography>
              <Typography sx={{ color: CAPTURIA_COLORS.textMuted }}>
                Apercu du dernier JSON retourne puis ecrit dans <code>data/page.json</code>.
              </Typography>
              <Box
                component="pre"
                sx={{
                  overflowX: "auto",
                  m: 0,
                  p: 3,
                  borderRadius: 4,
                  bgcolor: CAPTURIA_COLORS.surface,
                  border: "1px solid",
                  borderColor: CAPTURIA_COLORS.border,
                  fontSize: 13,
                  color: CAPTURIA_COLORS.navySoft,
                }}
              >
                {generatedJson || "{\n  \"status\": \"Aucune generation pour le moment\"\n}"}
              </Box>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
