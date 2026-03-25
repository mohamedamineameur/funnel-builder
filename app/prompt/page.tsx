"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

interface GenerateResponse {
  success?: boolean;
  message?: string;
  error?: string;
  page?: unknown;
}

type PromptMode = "free" | "guided";
type ColorMode = "model" | "palette" | "custom";
type GradientMode = "model" | "with" | "without";
type DirectionMode = "auto" | "ltr" | "rtl";

interface GuidedPromptState {
  websiteName: string;
  businessDescription: string;
  product: string;
  pageType: string;
  goal: string;
  audience: string;
  displayLanguage: string;
  multilingualMode: boolean;
  supportedLanguages: string;
  directionMode: DirectionMode;
  translationContext: string;
  style: string;
  tone: string;
  uiStyle: string;
  headerVariant: string;
  headerSticky: string;
  headerTransparency: string;
  headerScrollBehavior: string;
  uxLevel: string;
  uxOptions: string[];
  cornerStyle: string;
  colorMode: ColorMode;
  gradientMode: GradientMode;
  palette: string;
  paletteOther: string;
  customPrimary: string;
  customSecondary: string;
  customAccent: string;
  customBackground: string;
  customText: string;
  sections: string[];
  cta: string;
  heroImageMode: "none" | "context" | "custom";
  heroImageCustomDescription: string;
  galleryImageCount: string;
  imageDisplay: string;
  galleryDescriptionMode: "context" | "custom";
  galleryCustomDescription: string;
  notes: string;
}

interface PalettePreviewDefinition {
  value: string;
  label: string;
  description: string;
  colors: [string, string, string, string];
  isDark?: boolean;
}

type PaletteCategory = "Dark" | "Neutre" | "Flashy" | "Premium" | "Nature" | "Tech";
type UxCategory = "Engagement" | "Fluidite";

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

interface LocalizationConstraintPayload {
  locale?: string;
  direction: "ltr" | "rtl";
  isRTL: boolean;
  supportedLocales?: string[];
  translationContext?: string;
  translationsEnabled: boolean;
}

interface FreePromptSuggestion {
  key: string;
  title: string;
  prompt: string;
}

interface UxOptionDefinition {
  value: string;
  label: string;
  description: string;
  category: UxCategory;
}

type DraftSaveState = "idle" | "saved";

interface StepChecklistItem {
  label: string;
  done: boolean;
}

interface StarterPreset {
  key: string;
  title: string;
  description: string;
  apply: Partial<GuidedPromptState>;
}

interface LoadingStepDefinition {
  title: string;
  description: string;
}

const DEFAULT_PROMPT = `Genere une page de vente pour une patisserie artisanale haut de gamme a Montreal.
Je veux une hero tres appetissante, une section avantages, des avis clients, un formulaire, une FAQ et un footer.`;

const PROMPT_DRAFT_STORAGE_KEY = "capturia.prompt.draft.v1";
const SIMULATED_LOADING_DURATION_SECONDS = 100;
const ROBOT_GIF_URL = "/robot.gif";

const FREE_PROMPT_SUGGESTIONS: readonly FreePromptSuggestion[] = [
  {
    key: "arabic-rtl",
    title: "Page 100% arabe",
    prompt:
      "Genere une page pour une marque de cosmetiques premium. Toute la page doit etre en arabe et la lecture doit se faire de droite a gauche. Je veux une ouverture forte, une section avantages, des temoignages, une FAQ, un formulaire et un bas de page.",
  },
  {
    key: "multilingual",
    title: "Multilingue fr / ar / en",
    prompt:
      "Genere une page marketing pour une application mobile de livraison. Langue principale : francais. La page doit aussi exister en arabe et en anglais. Pense l'experience de maniere coherente dans ces trois langues, par exemple avec un formulaire et des textes adaptes a chaque langue.",
  },
  {
    key: "english",
    title: "Anglais uniquement",
    prompt:
      "Generate a landing page entirely in English for a B2B analytics platform. I want a top menu, a strong opening section, benefits, key numbers, pricing, FAQ, a form and a footer. All visible text must be in English.",
  },
] as const;

const GENERATION_LOADING_STEPS: readonly LoadingStepDefinition[] = [
  {
    title: "Analyse du brief",
    description: "On interprete ton besoin, ton objectif et les contraintes principales.",
  },
  {
    title: "Construction de la structure",
    description: "On choisit les sections et l'ordre le plus convaincant pour convertir.",
  },
  {
    title: "Redaction du contenu",
    description: "On affine la promesse, le ton et les messages clefs.",
  },
  {
    title: "Direction visuelle",
    description: "On applique le style, les couleurs, la hierarchie et les details visuels.",
  },
  {
    title: "Finalisation",
    description: "On verifie la coherence du rendu avant sauvegarde de la page.",
  },
] as const;

const GENERATION_ASSISTANT_MESSAGES = [
  "J'analyse ton brief pour construire une page plus claire et plus convaincante.",
  "Je cherche la meilleure combinaison entre structure, message et conversion.",
  "Je verifie que le ton, les blocs et le bouton principal racontent bien la meme histoire.",
  "Je peaufine les details visuels pour que la page paraisse plus pro des le premier regard.",
  "Je finalise la page pour qu'elle soit coherente avec tes choix.",
] as const;

const PRODUCT_OPTIONS = [
  "Application mobile",
  "SaaS B2B",
  "Formation en ligne",
  "E-commerce",
  "Restaurant",
  "Cabinet / consultant",
  "Autre",
] as const;

const PAGE_TYPE_OPTIONS = ["Landing page", "Waitlist", "Page de vente", "Page pricing", "Page app mobile"] as const;
const GOAL_OPTIONS = ["Obtenir des inscriptions", "Generer des leads", "Faire acheter", "Reserver un appel"] as const;
const AUDIENCE_OPTIONS = ["Grand public", "B2B", "Fondateurs", "Etudiants", "PME"] as const;
const LANGUAGE_OPTIONS = [
  { value: "fr", label: "Francais" },
  { value: "en", label: "Anglais" },
  { value: "ar", label: "Arabe" },
  { value: "es", label: "Espagnol" },
  { value: "de", label: "Allemand" },
  { value: "it", label: "Italien" },
  { value: "pt", label: "Portugais" },
] as const;
const STYLE_OPTIONS = ["Minimal", "Premium", "Editorial", "Bold", "Dark"] as const;
const TONE_OPTIONS = ["Professionnel", "Rassurant", "Energique", "Premium", "Direct"] as const;
const UI_STYLE_OPTIONS = ["Cartes", "Glass", "Dense", "Minimal", "Editorial"] as const;
const UX_LEVEL_OPTIONS = ["Subtil", "Equilibre", "Fort"] as const;
const HEADER_VARIANT_OPTIONS = ["Classique", "Navigation centree", "Minimal", "Editorial"] as const;
const HEADER_STICKY_OPTIONS = ["Fixe en haut", "Statique"] as const;
const HEADER_TRANSPARENCY_OPTIONS = ["Solide", "Transparent au debut"] as const;
const HEADER_SCROLL_OPTIONS = ["Toujours visible", "Se revele au scroll"] as const;
const CORNER_OPTIONS = ["Coins nets", "Coins equilibres", "Tres arrondis"] as const;
const SECTION_OPTIONS = ["navbar", "hero", "benefits", "stats", "testimonials", "faq", "gallery", "form", "pricing", "footer"] as const;
const IMAGE_DISPLAY_OPTIONS = ["auto", "carousel", "grid", "masonry", "stacked", "split"] as const;

const UX_OPTIONS: readonly UxOptionDefinition[] = [
  {
    value: "progressive_disclosure",
    label: "Revelation progressive",
    description: "Montrer l'information petit a petit pour reduire la surcharge cognitive.",
    category: "Engagement",
  },
  {
    value: "checklist_progression",
    label: "Checklist de progression",
    description: "Guider l'utilisateur avec des etapes claires et visibles.",
    category: "Engagement",
  },
  {
    value: "feedback_instantane",
    label: "Reponse immediate",
    description: "Donner une reponse immediate aux clics, validations et actions.",
    category: "Engagement",
  },
  {
    value: "microcopy_humain",
    label: "Petits textes rassurants",
    description: "Ajouter des textes courts, rassurants et plus engageants.",
    category: "Engagement",
  },
  {
    value: "empty_states_intelligents",
    label: "Ecrans vides utiles",
    description: "Rendre les etats vides utiles et orientés vers l'action.",
    category: "Engagement",
  },
  {
    value: "personalisation_dynamique",
    label: "Personnalisation dynamique",
    description: "Adapter certains messages et blocs au contexte utilisateur.",
    category: "Engagement",
  },
  {
    value: "onboarding_interactif",
    label: "Onboarding interactif",
    description: "Aider l'utilisateur a demarrer avec guidage et activation rapide.",
    category: "Engagement",
  },
  {
    value: "social_proof_dynamique",
    label: "Preuves de confiance visibles",
    description: "Ajouter des preuves de confiance visibles et modernes.",
    category: "Engagement",
  },
  {
    value: "interactive_comparison",
    label: "Comparaison interactive",
    description: "Aider a comparer offres, packs ou alternatives sans perdre l'utilisateur.",
    category: "Engagement",
  },
  {
    value: "storytelling_sections",
    label: "Storytelling progressif",
    description: "Construire un fil narratif plus convaincant entre l'ouverture, les preuves et le bouton principal.",
    category: "Engagement",
  },
  {
    value: "objection_handling",
    label: "Traitement des objections",
    description: "Anticiper les hesitations avec reponses claires, preuves et reassurance.",
    category: "Engagement",
  },
  {
    value: "trust_reassurance_strip",
    label: "Bandeau de reassurance",
    description: "Mettre en avant garanties, securite, delais ou confiance des le haut de page.",
    category: "Engagement",
  },
  {
    value: "sticky_cta",
    label: "Bouton toujours visible",
    description: "Garder les actions importantes visibles pendant la navigation.",
    category: "Fluidite",
  },
  {
    value: "inline_validation",
    label: "Verification instantanee des champs",
    description: "Valider les champs en direct pour reduire la friction.",
    category: "Fluidite",
  },
  {
    value: "skeleton_loading",
    label: "Chargement plus rassurant",
    description: "Ameliorer la perception de vitesse avec placeholders.",
    category: "Fluidite",
  },
  {
    value: "autosave_autoprogress",
    label: "Enregistrement automatique",
    description: "Sauvegarder ou memoriser automatiquement la progression.",
    category: "Fluidite",
  },
  {
    value: "optimistic_ui",
    label: "Sensation d'immediatete",
    description: "Donner une sensation d'instantaneite sur les actions clefs.",
    category: "Fluidite",
  },
  {
    value: "smart_defaults",
    label: "Valeurs conseillees",
    description: "Pre-remplir intelligemment certaines valeurs pour aller plus vite.",
    category: "Fluidite",
  },
  {
    value: "section_jump_links",
    label: "Liens d'acces rapide",
    description: "Permettre de sauter rapidement vers prix, FAQ, formulaire ou demo.",
    category: "Fluidite",
  },
  {
    value: "sticky_summary_bar",
    label: "Resume toujours visible",
    description: "Afficher un resume compact des points clefs pendant la lecture.",
    category: "Fluidite",
  },
  {
    value: "adaptive_density",
    label: "Densite adaptative",
    description: "Aeration plus premium ou plus compacte selon le type de contenu.",
    category: "Fluidite",
  },
  {
    value: "smart_navigation_cues",
    label: "Reperes de navigation",
    description: "Donner des indices visuels clairs pour orienter la lecture et les actions.",
    category: "Fluidite",
  },
] as const;

const PALETTE_LIBRARY: readonly PalettePreviewDefinition[] = [
  {
    value: "Bleu corporate",
    label: "Bleu corporate",
    description: "SaaS clair, propre et B2B.",
    colors: ["#0f172a", "#1d4ed8", "#38bdf8", "#f8fafc"],
  },
  {
    value: "Noir et blanc premium",
    label: "Noir et blanc premium",
    description: "Monochrome premium avec fond sombre reel.",
    colors: ["#0f172a", "#111827", "#f8fafc", "#1f2937"],
    isDark: true,
  },
  {
    value: "Midnight SaaS",
    label: "Midnight SaaS",
    description: "Fond sombre premium, accents froids.",
    colors: ["#020617", "#1d4ed8", "#22d3ee", "#0f172a"],
    isDark: true,
  },
  {
    value: "Teal dark studio",
    label: "Teal dark studio",
    description: "Dark teal, moderne et produit.",
    colors: ["#071c1c", "#14b8a6", "#67e8f9", "#0b2525"],
    isDark: true,
  },
  {
    value: "Rose / orange vibrant",
    label: "Rose / orange vibrant",
    description: "Conversion, lifestyle, impact.",
    colors: ["#431407", "#f97316", "#ec4899", "#fff7ed"],
  },
  {
    value: "Forest editorial",
    label: "Forest editorial",
    description: "Nature premium, storytelling.",
    colors: ["#14532d", "#15803d", "#86efac", "#f0fdf4"],
  },
  {
    value: "Lavande product",
    label: "Lavande product",
    description: "Tech douce, moderne et rassurante.",
    colors: ["#312e81", "#8b5cf6", "#c4b5fd", "#f5f3ff"],
  },
  {
    value: "Sunset luxe",
    label: "Sunset luxe",
    description: "Chaleureux, premium et lifestyle.",
    colors: ["#7c2d12", "#f97316", "#fb7185", "#fff7ed"],
  },
  {
    value: "Sand editorial",
    label: "Sand editorial",
    description: "Beige chic pour marque elegante.",
    colors: ["#44403c", "#b45309", "#f59e0b", "#fafaf9"],
  },
  {
    value: "Ocean neon dark",
    label: "Ocean neon dark",
    description: "Dark profond avec accents aqua.",
    colors: ["#082f49", "#06b6d4", "#67e8f9", "#0f172a"],
    isDark: true,
  },
  {
    value: "Cherry velvet",
    label: "Cherry velvet",
    description: "Rouge profond, luxe et impact.",
    colors: ["#4c0519", "#e11d48", "#fb7185", "#fff1f2"],
  },
  {
    value: "Jade premium",
    label: "Jade premium",
    description: "Vert raffine pour offre premium.",
    colors: ["#052e2b", "#10b981", "#6ee7b7", "#ecfdf5"],
  },
  {
    value: "Amber finance",
    label: "Amber finance",
    description: "Confiance, richesse et clarte.",
    colors: ["#451a03", "#d97706", "#fbbf24", "#fffbeb"],
  },
  {
    value: "Arctic glass",
    label: "Arctic glass",
    description: "Clinique, net et high-end.",
    colors: ["#0f172a", "#38bdf8", "#bae6fd", "#f8fafc"],
  },
  {
    value: "Aubergine nocturne",
    label: "Aubergine nocturne",
    description: "Dark violet pour produit premium.",
    colors: ["#1e1b4b", "#7c3aed", "#c084fc", "#2e1065"],
    isDark: true,
  },
  {
    value: "Clay boutique",
    label: "Clay boutique",
    description: "Terre cuite elegante et artisanale.",
    colors: ["#7c2d12", "#c2410c", "#fdba74", "#fff7ed"],
  },
  {
    value: "Cobalt pulse",
    label: "Cobalt pulse",
    description: "Blue startup nerveux et propre.",
    colors: ["#172554", "#2563eb", "#60a5fa", "#eff6ff"],
  },
  {
    value: "Peach studio",
    label: "Peach studio",
    description: "Creatif, doux et tendance.",
    colors: ["#7c2d12", "#fb923c", "#fda4af", "#fff7ed"],
  },
  {
    value: "Graphite mint",
    label: "Graphite mint",
    description: "Sombre minimal avec mint vif.",
    colors: ["#111827", "#10b981", "#99f6e4", "#1f2937"],
    isDark: true,
  },
  {
    value: "Indigo cosmos",
    label: "Indigo cosmos",
    description: "Spatial, tech et ambitieux.",
    colors: ["#1e1b4b", "#4f46e5", "#818cf8", "#eef2ff"],
  },
  {
    value: "Ruby noir",
    label: "Ruby noir",
    description: "Luxe sombre avec accent rubis.",
    colors: ["#111111", "#dc2626", "#fb7185", "#1f172a"],
    isDark: true,
  },
  {
    value: "Sage minimal",
    label: "Sage minimal",
    description: "Calme, naturel et apaisant.",
    colors: ["#334155", "#84cc16", "#bef264", "#f7fee7"],
  },
  {
    value: "Solar flare",
    label: "Solar flare",
    description: "Energie, conversion et impact.",
    colors: ["#7f1d1d", "#f59e0b", "#fde047", "#fff7ed"],
  },
  {
    value: "Lagoon resort",
    label: "Lagoon resort",
    description: "Frais, premium et feel good.",
    colors: ["#164e63", "#06b6d4", "#67e8f9", "#ecfeff"],
  },
  {
    value: "Platinum UI",
    label: "Platinum UI",
    description: "Neutre premium pour interfaces chic.",
    colors: ["#1f2937", "#6b7280", "#d1d5db", "#f9fafb"],
  },
  {
    value: "Mocha grid",
    label: "Mocha grid",
    description: "Cafe design, chaleureux et editorial.",
    colors: ["#3f2c23", "#8b5e3c", "#d6b38a", "#faf6f1"],
  },
  {
    value: "Berry cream",
    label: "Berry cream",
    description: "Frais, feminin et e-commerce.",
    colors: ["#831843", "#db2777", "#f9a8d4", "#fdf2f8"],
  },
  {
    value: "Electric lime dark",
    label: "Electric lime dark",
    description: "Dark edgy avec accent acide.",
    colors: ["#0f172a", "#84cc16", "#d9f99d", "#1e293b"],
    isDark: true,
  },
  {
    value: "Copper craft",
    label: "Copper craft",
    description: "Artisanat haut de gamme et caractere.",
    colors: ["#431407", "#b45309", "#f59e0b", "#fef3c7"],
  },
  {
    value: "Orchid glow",
    label: "Orchid glow",
    description: "Beauty brand, doux mais vibrant.",
    colors: ["#581c87", "#c026d3", "#e879f9", "#fdf4ff"],
  },
  {
    value: "Storm revenue",
    label: "Storm revenue",
    description: "B2B sombre, sobre et solide.",
    colors: ["#0f172a", "#334155", "#38bdf8", "#1e293b"],
    isDark: true,
  },
  {
    value: "Lemon editorial",
    label: "Lemon editorial",
    description: "Clair, lifestyle et optimiste.",
    colors: ["#3f3f46", "#eab308", "#fde047", "#fefce8"],
  },
  {
    value: "Terracotta home",
    label: "Terracotta home",
    description: "Deco, habitat et authenticite.",
    colors: ["#7c2d12", "#ea580c", "#fdba74", "#fff7ed"],
  },
  {
    value: "Ice blue clinic",
    label: "Ice blue clinic",
    description: "Sante, confiance et purete.",
    colors: ["#0c4a6e", "#0ea5e9", "#7dd3fc", "#f0f9ff"],
  },
  {
    value: "Emerald night",
    label: "Emerald night",
    description: "Dark elegant avec vert luxueux.",
    colors: ["#022c22", "#059669", "#34d399", "#064e3b"],
    isDark: true,
  },
  {
    value: "Coral startup",
    label: "Coral startup",
    description: "Startup moderne, jeune et visible.",
    colors: ["#7c2d12", "#f43f5e", "#fb7185", "#fff1f2"],
  },
  {
    value: "Obsidian gold",
    label: "Obsidian gold",
    description: "Noir luxe avec touche doree.",
    colors: ["#0a0a0a", "#ca8a04", "#facc15", "#1c1917"],
    isDark: true,
  },
  {
    value: "Sky revenue",
    label: "Sky revenue",
    description: "SaaS lumineux et orienté croissance.",
    colors: ["#1e3a8a", "#3b82f6", "#93c5fd", "#eff6ff"],
  },
  {
    value: "Mint paper",
    label: "Mint paper",
    description: "Editorial clair avec vert frais.",
    colors: ["#134e4a", "#14b8a6", "#99f6e4", "#f0fdfa"],
  },
  {
    value: "Velvet plum",
    label: "Velvet plum",
    description: "Violet chic pour marque sophistiquee.",
    colors: ["#3b0764", "#9333ea", "#d8b4fe", "#faf5ff"],
  },
  {
    value: "Slate orange dark",
    label: "Slate orange dark",
    description: "Dark tech avec accent orange vif.",
    colors: ["#111827", "#f97316", "#fdba74", "#1f2937"],
    isDark: true,
  },
  {
    value: "Rose champagne",
    label: "Rose champagne",
    description: "Elegant, feminin et premium.",
    colors: ["#881337", "#f472b6", "#fbcfe8", "#fdf2f8"],
  },
  {
    value: "Nordic pine",
    label: "Nordic pine",
    description: "Nordique, stable et naturel.",
    colors: ["#164e63", "#0f766e", "#5eead4", "#f0fdfa"],
  },
] as const;

const PALETTE_CATEGORY_ORDER: readonly PaletteCategory[] = [
  "Dark",
  "Neutre",
  "Flashy",
  "Premium",
  "Nature",
  "Tech",
] as const;

const PALETTE_CATEGORY_DESCRIPTIONS: Record<PaletteCategory, string> = {
  Dark: "Couleurs sombres, elegantes et bien contrastees.",
  Neutre: "Couleurs propres, sobries et polyvalentes.",
  Flashy: "Couleurs vives, visibles et orientees conversion.",
  Premium: "Luxe, editorial et image de marque raffinee.",
  Nature: "Tons organiques, frais et apaisants.",
  Tech: "Couleurs modernes pour un service innovant.",
};

const DEFAULT_GUIDED_STATE: GuidedPromptState = {
  websiteName: "",
  businessDescription: "",
  product: "Application mobile",
  pageType: "Landing page",
  goal: "Obtenir des inscriptions",
  audience: "Grand public",
  displayLanguage: "fr",
  multilingualMode: false,
  supportedLanguages: "fr",
  directionMode: "auto",
  translationContext: "",
  style: "Minimal",
  tone: "Professionnel",
  uiStyle: "Cartes",
  uxLevel: "Equilibre",
  uxOptions: ["feedback_instantane", "sticky_cta", "inline_validation"],
  headerVariant: "Classique",
  headerSticky: "Fixe en haut",
  headerTransparency: "Solide",
  headerScrollBehavior: "Toujours visible",
  cornerStyle: "Coins equilibres",
  colorMode: "model",
  gradientMode: "model",
  palette: "Bleu corporate",
  paletteOther: "",
  customPrimary: "#2563eb",
  customSecondary: "#1d4ed8",
  customAccent: "#38bdf8",
  customBackground: "#f8fafc",
  customText: "#0f172a",
  sections: ["navbar", "hero", "benefits", "testimonials", "faq", "form", "footer"],
  cta: "Creer un compte",
  heroImageMode: "context",
  heroImageCustomDescription: "",
  galleryImageCount: "0",
  imageDisplay: "auto",
  galleryDescriptionMode: "context",
  galleryCustomDescription: "",
  notes: "",
};

const GUIDED_STEPS = [
  { id: "project", title: "Projet" },
  { id: "message", title: "Message" },
  { id: "design", title: "Design" },
  { id: "ux", title: "UX" },
  { id: "structure", title: "Structure" },
] as const;

const STEP_HELP: Record<
  (typeof GUIDED_STEPS)[number]["id"],
  { title: string; description: string; action: string; example: string }
> = {
  project: {
    title: "Cadre du projet",
    description: "Definis le produit, le type de page et l'objectif principal pour cadrer la generation.",
    action: "Commence simplement par expliquer ce que tu vends et ce que tu veux obtenir.",
    example: "Exemple: Je vends une application pour aider les restaurants a gerer les reservations.",
  },
  message: {
    title: "Message et audience",
    description: "Precise le ton, la cible, la langue et le bouton principal pour orienter les textes.",
    action: "Dis a qui la page parle et ce que tu veux que le visiteur fasse.",
    example: "Exemple: cible PME, ton rassurant, bouton principal 'Demander une demo'.",
  },
  design: {
    title: "Direction visuelle",
    description: "Choisis le style, les couleurs, le menu du haut et les details visuels.",
    action: "Si tu n'es pas sur, garde quelque chose de simple puis personnalise les couleurs ensuite.",
    example: "Exemple: style premium, menu fixe en haut, couleurs sombres elegantes.",
  },
  ux: {
    title: "Experience de creation",
    description: "Indique les optimisations UX que le modele doit privilegier dans la page.",
    action: "Choisis seulement quelques options utiles; inutile de tout activer au debut.",
    example: "Exemple: reponse immediate + bouton toujours visible + valeurs conseillees.",
  },
  structure: {
    title: "Structure et medias",
    description: "Selectionne les sections, les images et la forme generale de la page.",
    action: "Ajoute uniquement les blocs necessaires a la conversion pour garder une page claire.",
    example: "Exemple: ouverture, avantages, temoignages, questions frequentes, formulaire, bas de page.",
  },
};

const STARTER_PRESETS: readonly StarterPreset[] = [
  {
    key: "saas",
    title: "SaaS simple",
    description: "Pour un outil en ligne ou un logiciel.",
    apply: {
      websiteName: "NovaFlow",
      businessDescription: "Un logiciel simple pour centraliser les taches, automatiser les relances et suivre les performances d'une equipe.",
      product: "SaaS B2B",
      pageType: "Landing page",
      goal: "Generer des leads",
      audience: "PME",
      tone: "Professionnel",
      cta: "Demander une demo",
    },
  },
  {
    key: "formation",
    title: "Formation en ligne",
    description: "Pour vendre un cours, un coaching ou une methode.",
    apply: {
      websiteName: "Academie Impact",
      businessDescription: "Une formation pratique pour apprendre une competence rapidement avec videos, exercices et accompagnement.",
      product: "Formation en ligne",
      pageType: "Page de vente",
      goal: "Faire acheter",
      audience: "Etudiants",
      tone: "Rassurant",
      cta: "Voir le programme",
    },
  },
  {
    key: "app",
    title: "Application mobile",
    description: "Pour presenter une app et obtenir des inscriptions.",
    apply: {
      websiteName: "PulseFit",
      businessDescription: "Une application mobile qui aide a suivre ses habitudes, rester motive et atteindre ses objectifs jour apres jour.",
      product: "Application mobile",
      pageType: "Page app mobile",
      goal: "Obtenir des inscriptions",
      audience: "Grand public",
      tone: "Energique",
      cta: "Telecharger l'application",
    },
  },
] as const;

function findPaletteDefinition(value: string) {
  return PALETTE_LIBRARY.find((palette) => palette.value.toLowerCase() === value.trim().toLowerCase());
}

function inferPaletteCategory(palette: PalettePreviewDefinition): PaletteCategory {
  const normalized = `${palette.value} ${palette.label} ${palette.description}`.toLowerCase();

  if (palette.isDark) return "Dark";
  if (/(vibrant|sunset|cherry|peach|solar|berry|coral|orchid|rose|electric|flare|lime)/.test(normalized)) {
    return "Flashy";
  }
  if (/(forest|jade|sage|lagoon|mint|emerald|nordic|pine|teal|ocean|nature)/.test(normalized)) {
    return "Nature";
  }
  if (/(corporate|saas|product|cobalt|arctic|indigo|storm|sky|clinic|revenue|tech|ui)/.test(normalized)) {
    return "Tech";
  }
  if (/(premium|luxe|editorial|platinum|champagne|velvet|obsidian|sand|mocha|clay|copper|ruby|boutique)/.test(normalized)) {
    return "Premium";
  }

  return "Neutre";
}

function resolveCornerStyleToken(value: string): "sharp" | "balanced" | "rounded" {
  const normalized = value.toLowerCase();
  if (normalized.includes("net")) return "sharp";
  if (normalized.includes("arrond")) return "rounded";
  return "balanced";
}

function resolveHeaderVariantToken(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes("centre")) return "centered";
  if (normalized.includes("editorial")) return "editorial";
  if (normalized.includes("minimal")) return "minimal";
  return "classic";
}

function resolveHeaderSticky(value: string) {
  return value.toLowerCase().includes("sticky");
}

function resolveHeaderTransparency(value: string) {
  return value.toLowerCase().includes("transparent");
}

function resolveHeaderScrollBehavior(value: string) {
  return value.toLowerCase().includes("scroll");
}

function normalizeLocaleToken(value: string) {
  const [language, region] = value.trim().replace(/_/g, "-").split("-");
  if (!language) return "";
  return region ? `${language.toLowerCase()}-${region.toUpperCase()}` : language.toLowerCase();
}

function parseSupportedLocales(value: string, fallbackLocale: string) {
  const locales = value
    .split(/[,;\n]/)
    .map((item) => normalizeLocaleToken(item))
    .filter(Boolean);

  return Array.from(new Set(locales.length > 0 ? locales : [fallbackLocale]));
}

function inferRtlFromLocale(locale: string) {
  return ["ar", "fa", "he", "ur"].includes(normalizeLocaleToken(locale).split("-")[0]);
}

function resolveDirection(form: GuidedPromptState): "ltr" | "rtl" {
  if (form.directionMode === "rtl") return "rtl";
  if (form.directionMode === "ltr") return "ltr";
  return inferRtlFromLocale(form.displayLanguage) ? "rtl" : "ltr";
}

function buildLocalizationConstraint(form: GuidedPromptState): LocalizationConstraintPayload {
  const locale = normalizeLocaleToken(form.displayLanguage) || "fr";
  const supportedLocales = form.multilingualMode
    ? parseSupportedLocales(form.supportedLanguages, locale)
    : [locale];
  const direction = resolveDirection(form);

  return {
    locale,
    direction,
    isRTL: direction === "rtl",
    supportedLocales,
    ...(form.translationContext.trim() ? { translationContext: form.translationContext.trim() } : {}),
    translationsEnabled: form.multilingualMode && supportedLocales.length > 1,
  };
}

function describeUxOption(optionValue: string) {
  return UX_OPTIONS.find((option) => option.value === optionValue)?.label ?? optionValue;
}

function buildThemeConstraint(form: GuidedPromptState): ThemeConstraintPayload | null {
  const cornerStyle = resolveCornerStyleToken(form.cornerStyle);

  if (form.colorMode === "palette") {
    const paletteDefinition = findPaletteDefinition(form.palette);
    if (!paletteDefinition) return null;

    const [base, accent, secondary, surface] = paletteDefinition.colors;
    const background = paletteDefinition.isDark ? base : surface;
    const textPrimary = paletteDefinition.isDark ? "#ffffff" : base;
    const textSecondary = paletteDefinition.isDark ? "#cbd5e1" : "#475569";
    const muted = paletteDefinition.isDark ? surface : surface;

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
    return {
      name: "custom_user_palette",
      cornerStyle,
      palette: {
        primary: form.customPrimary,
        secondary: form.customSecondary || form.customAccent || form.customPrimary,
        background: form.customBackground,
        textPrimary: form.customText,
        textSecondary: form.customText,
        accent: form.customAccent || form.customPrimary,
        muted: form.customBackground,
      },
    };
  }

  return null;
}

function buildGuidedPrompt(form: GuidedPromptState) {
  const localization = buildLocalizationConstraint(form);

  return [
    `Genere une page pour ${form.product}.`,
    form.websiteName.trim() ? `Nom du site: ${form.websiteName.trim()}.` : "",
    form.businessDescription.trim() ? `Activite: ${form.businessDescription.trim()}.` : "",
    `Type de page: ${form.pageType}.`,
    `Objectif principal: ${form.goal}.`,
    `Audience: ${form.audience}.`,
    `Langue principale d'affichage: ${localization.locale}.`,
    `Sens d'affichage impose: ${localization.direction === "rtl" ? "droite vers gauche (RTL)" : "gauche vers droite (LTR)"}.`,
    localization.supportedLocales?.length > 1
      ? `Langues supportees: ${localization.supportedLocales.join(", ")}.`
      : `Une seule langue a afficher: ${localization.locale}.`,
    localization.translationsEnabled
      ? "Le JSON doit inclure un contexte multilingue avec translationsEnabled true."
      : "Le JSON peut rester en mono-langue avec translationsEnabled false.",
    "Si une langue principale est definie, tous les textes visibles de la page doivent etre rediges dans cette langue.",
    localization.supportedLocales?.length > 1
      ? "Si plusieurs langues sont demandees, ne te contente pas de localization: pense aussi la page comme une experience multilingue coherente."
      : "",
    localization.supportedLocales?.length > 1
      ? `Utilise de preference des objets localises pour les textes visibles majeurs, par exemple: { ${localization.supportedLocales.map((item) => `${item}: "..."`).join(", ")} }.`
      : "",
    localization.supportedLocales?.length > 1
      ? "Applique ce format localise au minimum sur headline, subheadline, title, CTA, labels de formulaire, questions/reponses FAQ et textes visibles principaux."
      : "",
    "Avant de finaliser, verifie que tu n'as pas oublie les langues demandees dans le contenu visible.",
    localization.supportedLocales?.length > 1
      ? "Verification finale: si supportedLocales contient plusieurs langues, le JSON ne doit pas etre un faux multilingue avec uniquement du francais."
      : "",
    localization.direction === "rtl"
      ? "Verification finale: comme la page est en RTL, controle que les textes visibles sont bien dans une langue RTL et pas restes en francais par oubli."
      : "",
    form.translationContext.trim()
      ? `Contexte de traduction: ${form.translationContext.trim()}.`
      : "",
    localization.direction === "rtl"
      ? "La mise en page doit etre pensee pour une lecture RTL complete, comme pour l'arabe."
      : "La mise en page doit etre pensee pour une lecture LTR complete.",
    `Direction visuelle: ${form.style}.`,
    `Ton: ${form.tone}.`,
    `Style d'interface: ${form.uiStyle}.`,
    `Niveau d'optimisation UX: ${form.uxLevel}.`,
    form.uxOptions.length > 0
      ? `Optimisations UX a privilegier: ${form.uxOptions.map(describeUxOption).join(", ")}.`
      : "",
    form.uxOptions.includes("progressive_disclosure")
      ? "Utilise une revelation progressive des informations pour alleger l'experience."
      : "",
    form.uxOptions.includes("checklist_progression")
      ? "Ajoute si pertinent une logique de checklist ou de progression visible."
      : "",
    form.uxOptions.includes("feedback_instantane")
      ? "Prevois un feedback instantane et rassurant sur les actions importantes."
      : "",
    form.uxOptions.includes("microcopy_humain")
      ? "Utilise une micro-copy plus humaine, rassurante et engageante."
      : "",
    form.uxOptions.includes("empty_states_intelligents")
      ? "Si la page comporte des etats vides ou blocs sans contenu initial, rends-les utiles et orientés action."
      : "",
    form.uxOptions.includes("personalisation_dynamique")
      ? "Si pertinent, integre des touches de personnalisation dynamique dans les messages ou sections."
      : "",
    form.uxOptions.includes("onboarding_interactif")
      ? "Si le contexte s'y prete, pense l'experience comme un onboarding interactif et progressif."
      : "",
    form.uxOptions.includes("social_proof_dynamique")
      ? "Renforce la confiance avec des preuves sociales modernes et bien visibles."
      : "",
    form.uxOptions.includes("sticky_cta")
      ? "Fais en sorte qu'une action principale reste facilement accessible pendant la navigation."
      : "",
    form.uxOptions.includes("inline_validation")
      ? "Si un formulaire est present, privilegie une validation inline claire et immediate."
      : "",
    form.uxOptions.includes("skeleton_loading")
      ? "Prevois une experience de chargement percue comme rapide avec skeletons ou placeholders si pertinent."
      : "",
    form.uxOptions.includes("autosave_autoprogress")
      ? "Si la page a des etapes ou saisies, pense auto-save ou auto-progress pour reduire le stress utilisateur."
      : "",
    form.uxOptions.includes("optimistic_ui")
      ? "Donne une sensation de reactivite immediate sur les interactions importantes."
      : "",
    form.uxOptions.includes("smart_defaults")
      ? "Utilise des valeurs par defaut intelligentes pour reduire l'effort utilisateur."
      : "",
    `Style de header: ${form.headerVariant}.`,
    `Header sticky: ${form.headerSticky}.`,
    `Transparence du header: ${form.headerTransparency}.`,
    `Comportement du header au scroll: ${form.headerScrollBehavior}.`,
    `Si une navbar est presente, utilise de preference variant "${resolveHeaderVariantToken(form.headerVariant)}", sticky ${resolveHeaderSticky(form.headerSticky)}, transparent ${resolveHeaderTransparency(form.headerTransparency)} et showOnScroll ${resolveHeaderScrollBehavior(form.headerScrollBehavior)}.`,
    `Style des coins: ${form.cornerStyle}.`,
    form.colorMode === "model" ? "Le modele choisit librement les couleurs." : "",
    form.colorMode === "palette" ? `Palette imposee: ${form.palette}.` : "",
    form.colorMode === "custom"
      ? `Couleurs imposees: primary ${form.customPrimary}, secondary ${form.customSecondary}, accent ${form.customAccent}, background ${form.customBackground}, text ${form.customText}.`
      : "",
    `Gradients: ${form.gradientMode}.`,
    `Sections obligatoires: ${form.sections.join(", ")}.`,
    `CTA principal: ${form.cta}.`,
    `Nombre de visuels galerie: ${form.galleryImageCount}.`,
    `Affichage de galerie: ${form.imageDisplay}.`,
    form.heroImageMode === "none" ? "Hero sans image." : "",
    form.heroImageMode === "context" ? "Image hero selon le contexte." : "",
    form.heroImageMode === "custom" && form.heroImageCustomDescription.trim()
      ? `Descriptif image hero: ${form.heroImageCustomDescription.trim()}.`
      : "",
    form.galleryImageCount !== "0" && form.galleryDescriptionMode === "custom" && form.galleryCustomDescription.trim()
      ? `Descriptif galerie: ${form.galleryCustomDescription.trim()}.`
      : "",
    form.notes.trim() ? `Notes supplementaires: ${form.notes.trim()}.` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function inferPreviewTheme(form: GuidedPromptState) {
  if (form.colorMode === "custom") {
    return {
      primary: form.customPrimary,
      secondary: form.customSecondary || form.customAccent || form.customPrimary,
      accent: form.customAccent || form.customPrimary,
      background: form.customBackground,
      text: form.customText,
      dark: form.customBackground.toLowerCase() !== "#ffffff" && form.customBackground.toLowerCase() !== "#f8fafc",
    };
  }

  if (form.colorMode === "palette") {
    const palette = findPaletteDefinition(form.palette);
    if (palette) {
      return {
        primary: palette.colors[1],
        secondary: palette.colors[2],
        accent: palette.colors[1],
        background: palette.isDark ? palette.colors[0] : palette.colors[3],
        text: palette.isDark ? "#ffffff" : palette.colors[0],
        dark: Boolean(palette.isDark),
      };
    }
  }

  return {
    primary: "#14b8a6",
    secondary: "#0f172a",
    accent: "#14b8a6",
    background: "#f8fafc",
    text: "#0f172a",
    dark: false,
  };
}

function StepBadge({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div
      className={cx(
        "rounded-2xl border px-4 py-3 text-sm font-semibold transition",
        active && "border-teal-500 bg-teal-500 text-white",
        done && !active && "border-slate-300 bg-white text-slate-900",
        !active && !done && "border-slate-200 bg-slate-50 text-slate-500",
      )}
    >
      {label}
    </div>
  );
}

function PaletteCard({
  palette,
  selected,
  onClick,
}: {
  palette: PalettePreviewDefinition;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={cx(
        "flex h-full w-full flex-col rounded-3xl border p-4 text-left transition hover:-translate-y-0.5",
        selected ? "border-teal-500 bg-teal-50 shadow-sm" : "border-slate-200 bg-white",
      )}
      onClick={onClick}
      type="button"
    >
      <div
        className="mb-3 h-20 rounded-2xl"
        style={{
          background: `linear-gradient(135deg, ${palette.colors[0]} 0%, ${palette.colors[1]} 50%, ${palette.colors[2]} 100%)`,
        }}
      />
      <div className="flex min-h-[92px] flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <p
            className="font-semibold leading-5 text-slate-900"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {palette.label}
          </p>
          <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            {palette.isDark ? "Sombre" : "Clair"}
          </span>
        </div>
        <p
          className="mt-2 text-sm leading-5 text-slate-500"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {palette.description}
        </p>
      </div>
    </button>
  );
}

function PreviewFrame({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-3 text-sm font-semibold text-slate-500">{title}</p>
      {children}
    </div>
  );
}

function getSectionDisplayLabel(section: string) {
  switch (section) {
    case "navbar":
      return "Menu du haut";
    case "hero":
      return "Bloc d'ouverture";
    case "benefits":
      return "Avantages";
    case "stats":
      return "Chiffres clefs";
    case "testimonials":
      return "Avis clients";
    case "faq":
      return "Questions frequentes";
    case "gallery":
      return "Galerie";
    case "form":
      return "Formulaire";
    case "pricing":
      return "Tarifs";
    case "footer":
      return "Bas de page";
    default:
      return section;
  }
}

function getPaletteCategoryLabel(category: PaletteCategory) {
  switch (category) {
    case "Dark":
      return "Sombre";
    case "Neutre":
      return "Neutre";
    case "Flashy":
      return "Vif";
    case "Premium":
      return "Haut de gamme";
    case "Nature":
      return "Nature";
    case "Tech":
      return "Moderne";
    default:
      return category;
  }
}

function getImageDisplayLabel(value: string) {
  switch (value) {
    case "auto":
      return "Choix automatique";
    case "carousel":
      return "Defilement horizontal";
    case "grid":
      return "Grille";
    case "masonry":
      return "Mise en page libre";
    case "stacked":
      return "Empile";
    case "split":
      return "Grand visuel + petits visuels";
    default:
      return value;
  }
}

function LoadingPreviewSkeleton({ form }: { form: GuidedPromptState }) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="h-2.5 w-24 rounded-full bg-slate-200 animate-pulse" />
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-teal-400 animate-pulse" />
          <div className="h-2.5 w-2.5 rounded-full bg-slate-300 animate-pulse" />
          <div className="h-2.5 w-2.5 rounded-full bg-slate-300 animate-pulse" />
        </div>
      </div>
      <div className="scale-[0.94] origin-top">
        <SkeletonPreview form={form} />
      </div>
    </div>
  );
}

function LoadingRobotScene() {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#eef6ff_100%)] p-5">
      <div className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-slate-950 p-4">
        <div className="absolute inset-x-0 top-0 h-16 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.25),transparent_60%)]" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-[linear-gradient(180deg,transparent,rgba(148,163,184,0.18))]" />
        <div className="relative flex min-h-[260px] items-center justify-center rounded-[18px] border border-slate-800 bg-slate-900/90 p-4">
          <img
            alt="Robot bricoleur"
            className="h-[220px] w-auto rounded-2xl object-contain"
            onError={(event) => {
              event.currentTarget.src = "/robot-builder-fallback.svg";
            }}
            src={ROBOT_GIF_URL}
          />
        </div>
      </div>
    </div>
  );
}

function LoadingProgressTrack({ progress }: { progress: number }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Progression</p>
          <p className="mt-1 text-sm text-slate-600">La progression visuelle va jusqu&apos;a 100% avant la fin.</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700 shadow-sm">{progress}%</span>
      </div>
      <div className="mt-4 grid grid-cols-10 gap-2">
        {Array.from({ length: 10 }).map((_, index) => {
          const active = progress >= (index + 1) * 10;
          return (
            <div
              className={cx(
                "h-3 rounded-full transition-all duration-700",
                active ? "bg-gradient-to-r from-teal-500 to-cyan-400 shadow-[0_0_18px_rgba(20,184,166,0.28)]" : "bg-slate-200",
              )}
              key={index}
            />
          );
        })}
      </div>
    </div>
  );
}

function SkeletonPreview({
  form,
}: {
  form: GuidedPromptState;
}) {
  const theme = inferPreviewTheme(form);
  const sections = form.sections.includes("footer") ? form.sections : [...form.sections, "footer"];
  const direction = resolveDirection(form);

  return (
    <div
      className={cx("overflow-hidden rounded-[28px] border p-4", direction === "rtl" && "text-right")}
      dir={direction}
      style={{
        background: form.gradientMode === "without"
          ? theme.background
          : `linear-gradient(180deg, ${theme.background} 0%, ${theme.dark ? "#111827" : "#ffffff"} 100%)`,
        color: theme.text,
        borderColor: theme.dark ? "rgba(255,255,255,0.1)" : "#e2e8f0",
      }}
    >
      <div className={cx("mb-4 flex items-center justify-between", direction === "rtl" && "flex-row-reverse")}>
        <div className="h-3 w-24 rounded-full" style={{ backgroundColor: theme.primary }} />
        <div className="h-3 w-8 rounded-full" style={{ backgroundColor: theme.text, opacity: 0.65 }} />
      </div>
      <div className={cx("mb-4 grid gap-3", direction === "rtl" ? "md:grid-cols-[0.8fr_1.2fr]" : "md:grid-cols-[1.2fr_0.8fr]")}>
        <div className="grid gap-3">
          <div className="h-3 w-20 rounded-full" style={{ backgroundColor: theme.primary, opacity: 0.9 }} />
          <div className="h-8 w-3/4 rounded-xl" style={{ backgroundColor: theme.text, opacity: 0.9 }} />
          <div className="h-4 w-full rounded-xl" style={{ backgroundColor: theme.text, opacity: 0.25 }} />
          <div className={cx("flex gap-3", direction === "rtl" && "flex-row-reverse")}>
            <div className="h-10 w-32 rounded-full" style={{ backgroundColor: theme.primary }} />
            <div className="h-10 w-28 rounded-full border" style={{ borderColor: theme.text, opacity: 0.35 }} />
          </div>
        </div>
        <div className="min-h-[160px] rounded-[24px] border" style={{ borderColor: theme.dark ? "rgba(255,255,255,0.1)" : "#cbd5e1" }} />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {sections.slice(0, 6).map((section) => (
          <div
            className="min-h-[92px] rounded-2xl border p-3"
            key={section}
            style={{ borderColor: theme.dark ? "rgba(255,255,255,0.1)" : "#cbd5e1" }}
          >
            <div className="mb-2 h-3 w-20 rounded-full" style={{ backgroundColor: theme.primary, opacity: 0.8 }} />
            <div className="h-3 w-full rounded-full" style={{ backgroundColor: theme.text, opacity: 0.2 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PromptPage() {
  const [mode, setMode] = useState<PromptMode>("guided");
  const [modeSelected, setModeSelected] = useState(false);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [guidedPrompt, setGuidedPrompt] = useState<GuidedPromptState>(DEFAULT_GUIDED_STATE);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [generatedJson, setGeneratedJson] = useState("");
  const [draftSaveState, setDraftSaveState] = useState<DraftSaveState>("idle");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [pendingSuccessMessage, setPendingSuccessMessage] = useState<string | null>(null);
  const [pendingGeneratedJson, setPendingGeneratedJson] = useState("");
  const [serverResponseReady, setServerResponseReady] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const paletteGroups = useMemo(
    () =>
      PALETTE_CATEGORY_ORDER.map((category) => ({
        category,
        description: PALETTE_CATEGORY_DESCRIPTIONS[category],
        palettes: PALETTE_LIBRARY.filter((palette) => inferPaletteCategory(palette) === category),
      })).filter((group) => group.palettes.length > 0),
    [],
  );

  const effectivePrompt = useMemo(
    () => (mode === "free" ? prompt : buildGuidedPrompt(guidedPrompt)),
    [guidedPrompt, mode, prompt],
  );

  const stepChecklists = useMemo<Record<(typeof GUIDED_STEPS)[number]["id"], StepChecklistItem[]>>(
    () => ({
      project: [
        {
          label: "Donner un nom ou un descriptif a ton activite",
          done: Boolean(guidedPrompt.websiteName.trim() || guidedPrompt.businessDescription.trim()),
        },
        {
          label: "Confirmer le type de produit",
          done: guidedPrompt.product !== DEFAULT_GUIDED_STATE.product,
        },
        {
          label: "Choisir le type de page ou l'objectif",
          done:
            guidedPrompt.pageType !== DEFAULT_GUIDED_STATE.pageType || guidedPrompt.goal !== DEFAULT_GUIDED_STATE.goal,
        },
      ],
      message: [
        {
          label: "Preciser l'audience",
          done: guidedPrompt.audience !== DEFAULT_GUIDED_STATE.audience,
        },
        {
          label: "Choisir le ton",
          done: guidedPrompt.tone !== DEFAULT_GUIDED_STATE.tone,
        },
        {
          label: "Definir le bouton principal",
          done: guidedPrompt.cta !== DEFAULT_GUIDED_STATE.cta,
        },
        {
          label: "Configurer la langue si besoin",
          done:
            guidedPrompt.displayLanguage !== DEFAULT_GUIDED_STATE.displayLanguage ||
            guidedPrompt.multilingualMode !== DEFAULT_GUIDED_STATE.multilingualMode ||
            guidedPrompt.directionMode !== DEFAULT_GUIDED_STATE.directionMode,
        },
      ],
      design: [
        {
          label: "Choisir une direction visuelle",
          done:
            guidedPrompt.style !== DEFAULT_GUIDED_STATE.style || guidedPrompt.uiStyle !== DEFAULT_GUIDED_STATE.uiStyle,
        },
        {
          label: "Personnaliser le menu du haut",
          done:
            guidedPrompt.headerVariant !== DEFAULT_GUIDED_STATE.headerVariant ||
            guidedPrompt.headerSticky !== DEFAULT_GUIDED_STATE.headerSticky ||
            guidedPrompt.headerTransparency !== DEFAULT_GUIDED_STATE.headerTransparency ||
            guidedPrompt.headerScrollBehavior !== DEFAULT_GUIDED_STATE.headerScrollBehavior,
        },
        {
          label: "Ajuster les couleurs",
          done:
            guidedPrompt.colorMode !== DEFAULT_GUIDED_STATE.colorMode ||
            guidedPrompt.gradientMode !== DEFAULT_GUIDED_STATE.gradientMode ||
            guidedPrompt.palette !== DEFAULT_GUIDED_STATE.palette ||
            guidedPrompt.customPrimary !== DEFAULT_GUIDED_STATE.customPrimary ||
            guidedPrompt.customSecondary !== DEFAULT_GUIDED_STATE.customSecondary ||
            guidedPrompt.customAccent !== DEFAULT_GUIDED_STATE.customAccent ||
            guidedPrompt.customBackground !== DEFAULT_GUIDED_STATE.customBackground ||
            guidedPrompt.customText !== DEFAULT_GUIDED_STATE.customText ||
            guidedPrompt.cornerStyle !== DEFAULT_GUIDED_STATE.cornerStyle,
        },
      ],
      ux: [
        {
          label: "Choisir un niveau UX",
          done: guidedPrompt.uxLevel !== DEFAULT_GUIDED_STATE.uxLevel,
        },
        {
          label: "Selectionner les optimisations UX utiles",
          done: JSON.stringify(guidedPrompt.uxOptions) !== JSON.stringify(DEFAULT_GUIDED_STATE.uxOptions),
        },
      ],
      structure: [
        {
          label: "Ajuster les sections affichees",
          done: JSON.stringify(guidedPrompt.sections) !== JSON.stringify(DEFAULT_GUIDED_STATE.sections),
        },
        {
          label: "Choisir les images d'ouverture ou de galerie",
          done:
            guidedPrompt.heroImageMode !== DEFAULT_GUIDED_STATE.heroImageMode ||
            guidedPrompt.galleryImageCount !== DEFAULT_GUIDED_STATE.galleryImageCount ||
            guidedPrompt.galleryCustomDescription.trim().length > 0 ||
            guidedPrompt.heroImageCustomDescription.trim().length > 0,
        },
        {
          label: "Modifier l'affichage media si besoin",
          done: guidedPrompt.imageDisplay !== DEFAULT_GUIDED_STATE.imageDisplay,
        },
      ],
    }),
    [guidedPrompt],
  );

  const stepCompletion = useMemo(
    () =>
      GUIDED_STEPS.map((step) => {
        const checklist = stepChecklists[step.id];
        const completedCount = checklist.filter((item) => item.done).length;
        return completedCount > 0;
      }),
    [stepChecklists],
  );

  const completedStepsCount = useMemo(
    () => stepCompletion.filter(Boolean).length,
    [stepCompletion],
  );

  const progressPercent = useMemo(
    () => Math.round((completedStepsCount / GUIDED_STEPS.length) * 100),
    [completedStepsCount],
  );

  const currentStepMeta = GUIDED_STEPS[activeStep];
  const currentStepChecklist = stepChecklists[currentStepMeta.id];
  const currentStepDoneCount = currentStepChecklist.filter((item) => item.done).length;
  const isFreshGuidedStart = completedStepsCount === 0;
  const loadingStepIndex = Math.min(
    GENERATION_LOADING_STEPS.length - 1,
    Math.max(0, Math.floor((loadingProgress / 100) * GENERATION_LOADING_STEPS.length)),
  );

  const loadingInsights = useMemo(() => {
    if (mode === "guided") {
      return [
        `Objectif: ${guidedPrompt.goal}`,
        `Audience: ${guidedPrompt.audience}`,
        `Sections: ${guidedPrompt.sections.length} blocs`,
        `Couleurs: ${guidedPrompt.colorMode === "palette" ? guidedPrompt.palette : guidedPrompt.colorMode === "custom" ? "Couleurs personnalisees" : "Choix automatique"}`,
        `Langue: ${guidedPrompt.multilingualMode ? guidedPrompt.supportedLanguages : guidedPrompt.displayLanguage}`,
        `UX: ${guidedPrompt.uxOptions.length} optimisations actives`,
      ];
    }

    const promptWordCount = prompt.trim().split(/\s+/).filter(Boolean).length;
    return [
      "Description libre detectee",
      `Brief: ${promptWordCount} mots`,
      "Analyse de la structure ideale en cours",
      "Preparation de la page finale",
    ];
  }, [guidedPrompt, mode, prompt]);

  function toggleSection(section: (typeof SECTION_OPTIONS)[number]) {
    setGuidedPrompt((prev) => {
      const isActive = prev.sections.includes(section);

      if (isActive) {
        return {
          ...prev,
          sections: prev.sections.filter((item) => item !== section),
          galleryImageCount: section === "gallery" ? "0" : prev.galleryImageCount,
          galleryDescriptionMode: section === "gallery" ? "context" : prev.galleryDescriptionMode,
        };
      }

      return {
        ...prev,
        sections: [...prev.sections, section],
        galleryImageCount: section === "gallery" && prev.galleryImageCount === "0" ? "3" : prev.galleryImageCount,
        imageDisplay: section === "gallery" && prev.imageDisplay === "auto" ? "grid" : prev.imageDisplay,
      };
    });
  }

  function toggleUxOption(option: string) {
    setGuidedPrompt((prev) => {
      const active = prev.uxOptions.includes(option);
      return {
        ...prev,
        uxOptions: active ? prev.uxOptions.filter((item) => item !== option) : [...prev.uxOptions, option],
      };
    });
  }

  function applyStarterPreset(preset: StarterPreset) {
    setGuidedPrompt((prev) => ({ ...prev, ...preset.apply }));
    setActiveStep(0);
  }

  useEffect(() => {
    try {
      const rawDraft = window.localStorage.getItem(PROMPT_DRAFT_STORAGE_KEY);
      if (!rawDraft) return;

      const draft = JSON.parse(rawDraft) as {
        mode?: PromptMode;
        modeSelected?: boolean;
        prompt?: string;
        guidedPrompt?: GuidedPromptState;
        activeStep?: number;
      };

      if (draft.mode === "free" || draft.mode === "guided") {
        setMode(draft.mode);
      }
      if (typeof draft.modeSelected === "boolean") {
        setModeSelected(draft.modeSelected);
      }
      if (typeof draft.prompt === "string" && draft.prompt.trim()) {
        setPrompt(draft.prompt);
      }
      if (draft.guidedPrompt && typeof draft.guidedPrompt === "object") {
        setGuidedPrompt((prev) => ({ ...prev, ...draft.guidedPrompt }));
      }
      if (typeof draft.activeStep === "number") {
        setActiveStep(Math.max(0, Math.min(draft.activeStep, GUIDED_STEPS.length - 1)));
      }
      setDraftSaveState("saved");
    } catch {
      window.localStorage.removeItem(PROMPT_DRAFT_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        PROMPT_DRAFT_STORAGE_KEY,
        JSON.stringify({
          mode,
          modeSelected,
          prompt,
          guidedPrompt,
          activeStep,
        }),
      );
      setDraftSaveState("saved");
    } catch {
      // Ignore localStorage errors in restricted environments.
    }
  }, [activeStep, guidedPrompt, mode, modeSelected, prompt]);

  useEffect(() => {
    if (!loading) {
      setLoadingProgress(0);
      setLoadingMessageIndex(0);
      return;
    }

    setLoadingProgress(0);
    setLoadingMessageIndex(0);
    setServerResponseReady(false);
    setPendingSuccessMessage(null);
    setPendingGeneratedJson("");

    const progressInterval = window.setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) return prev;
        return Math.min(prev + 1, 100);
      });
    }, 1000);

    const messageInterval = window.setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % GENERATION_ASSISTANT_MESSAGES.length);
    }, 2400);

    return () => {
      window.clearInterval(progressInterval);
      window.clearInterval(messageInterval);
    };
  }, [loading]);

  useEffect(() => {
    if (!loading || !serverResponseReady || loadingProgress < 100) {
      return;
    }

    setLoading(false);
    setSuccessMessage(pendingSuccessMessage ?? "La page a ete generee avec succes.");
    setGeneratedJson(pendingGeneratedJson);
    setShowCompletionModal(true);
  }, [loading, loadingProgress, pendingGeneratedJson, pendingSuccessMessage, serverResponseReady]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    setShowCompletionModal(false);

    try {
      const themeConstraint = mode === "guided" ? buildThemeConstraint(guidedPrompt) : null;
      const localizationConstraint = mode === "guided" ? buildLocalizationConstraint(guidedPrompt) : null;
      const response = await fetch("/api/generate-page", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: effectivePrompt, themeConstraint, localizationConstraint }),
      });

      const payload = (await response.json()) as GenerateResponse;

      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "La generation a echoue.");
      }

      setPendingSuccessMessage(payload.message ?? "La page a ete generee avec succes.");
      setPendingGeneratedJson(JSON.stringify(payload.page, null, 2));
      setServerResponseReady(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Une erreur inconnue est survenue.");
      setLoading(false);
    } finally {
      // La fermeture du modal de generation est geree apres 100%.
    }
  }

  return (
    <div
      className={cx(
        "min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.10),transparent_24%),radial-gradient(circle_at_top_right,rgba(15,23,42,0.08),transparent_26%),linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] py-8",
        modeSelected && mode === "guided" && "pb-36 xl:pb-8",
      )}
    >
      <div className="pointer-events-none fixed right-4 top-4 z-[70]">
        <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-slate-200 bg-white/92 px-3 py-3 shadow-[0_16px_36px_rgba(15,23,42,0.12)] backdrop-blur">
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-white"
            href="/dashboard"
          >
            Espace de travail
          </Link>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-slate-950 bg-slate-950 px-4 text-sm font-semibold !text-white transition hover:-translate-y-0.5 hover:bg-black hover:!text-white"
            href="/edition"
          >
            Modifier la page
          </Link>
        </div>
      </div>
      {loading ? (
        <div className="fixed inset-0 z-[80] overflow-y-auto bg-slate-950/45 backdrop-blur-[6px]">
          <div className="mx-auto flex min-h-full w-[min(1180px,calc(100%-24px))] items-start justify-center py-4 sm:py-6 xl:items-center xl:py-8">
            <div className="grid max-h-[calc(100vh-32px)] w-full gap-6 overflow-y-auto rounded-[32px] border border-white/20 bg-white/96 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.28)] xl:grid-cols-[1.15fr_0.85fr] xl:p-8">
              <div className="grid gap-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-teal-700">Creation en cours</p>
                    <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-slate-950">
                      Ta page prend forme
                    </h2>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                      L&apos;assistant construit la structure, affine le message et prepare un rendu coherent avec tes choix.
                    </p>
                  </div>
                  <div className="hidden sm:block">
                    <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
                      Minimum 100 secondes
                    </div>
                  </div>
                </div>

                <LoadingProgressTrack progress={loadingProgress} />

                <LoadingRobotScene />

                <div className="grid gap-3">
                  {GENERATION_LOADING_STEPS.map((step, index) => {
                    const isDone = index < loadingStepIndex;
                    const isActive = index === loadingStepIndex;

                    return (
                      <div
                        className={cx(
                          "flex items-start gap-4 rounded-[24px] border p-4 transition",
                          isDone && "border-emerald-200 bg-emerald-50/70",
                          isActive && "border-teal-300 bg-teal-50 shadow-sm",
                          !isDone && !isActive && "border-slate-200 bg-white",
                        )}
                        key={step.title}
                      >
                        <div
                          className={cx(
                            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                            isDone && "bg-emerald-600 text-white",
                            isActive && "bg-teal-600 text-white",
                            !isDone && !isActive && "bg-slate-100 text-slate-500",
                          )}
                        >
                          {isDone ? "✓" : index + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-slate-900">{step.title}</p>
                            {isActive ? (
                              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-teal-700">
                                En cours
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-sm leading-6 text-slate-500">{step.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Assistant</p>
                  <div className="mt-3 flex gap-3">
                    <div className="mt-1 flex gap-1">
                      <span className="h-2.5 w-2.5 rounded-full bg-teal-500 animate-bounce [animation-delay:-0.2s]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-cyan-500 animate-bounce [animation-delay:-0.1s]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-slate-900 animate-bounce" />
                    </div>
                    <p className="text-sm leading-7 text-slate-700">
                      {GENERATION_ASSISTANT_MESSAGES[loadingMessageIndex]}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-5">
                <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Ce qui se prepare</p>
                    <div className="flex gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-teal-500 animate-pulse" />
                      <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse [animation-delay:0.2s]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-slate-400 animate-pulse [animation-delay:0.4s]" />
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3">
                    {loadingInsights.slice(0, 6).map((insight, index) => {
                      const isActive = index === loadingMessageIndex % Math.max(loadingInsights.slice(0, 6).length, 1);
                      return (
                      <div
                        className={cx(
                          "rounded-2xl border px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition-all duration-500",
                          isActive
                            ? "border-teal-300 bg-teal-50 shadow-[0_12px_30px_rgba(20,184,166,0.16)] -translate-y-0.5"
                            : "border-slate-200 bg-white",
                        )}
                        key={insight}
                        style={{
                          animationDelay: `${index * 120}ms`,
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={cx(
                              "h-2.5 w-2.5 rounded-full transition-all",
                              isActive ? "bg-teal-500 shadow-[0_0_12px_rgba(20,184,166,0.6)]" : "bg-slate-300",
                            )}
                          />
                          <span>{insight}</span>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Apercu en cours</p>
                      <p className="mt-1 text-sm text-slate-600">La page prend forme pendant la creation.</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
                      En direct
                    </span>
                  </div>
                  <LoadingPreviewSkeleton form={guidedPrompt} />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showCompletionModal ? (
        <div className="fixed inset-0 z-[85] bg-slate-950/50 backdrop-blur-[6px]">
          <div className="mx-auto flex min-h-screen w-[min(680px,calc(100%-24px))] items-center justify-center py-8">
            <div className="w-full rounded-[32px] border border-white/20 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
                OK
              </div>
              <div className="mt-6 text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700">Creation terminee</p>
                <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-slate-950">Ta page est prete</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Ta page est prete. Tu peux maintenant l'ouvrir dans un nouvel onglet.
                </p>
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <button
                  className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
                  onClick={() => setShowCompletionModal(false)}
                  type="button"
                >
                  Plus tard
                </button>
                <button
                  className="rounded-full border border-teal-500 bg-teal-500 px-5 py-3 text-sm font-semibold text-white"
                  onClick={() => {
                    window.open("/", "_blank", "noopener,noreferrer");
                    setShowCompletionModal(false);
                  }}
                  type="button"
                >
                  Aller a votre page
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div
        className={cx(
          "mx-auto flex flex-col gap-6",
          modeSelected && mode === "guided"
            ? "w-[min(1380px,calc(100%-32px))] 2xl:w-[min(1320px,calc(100%-700px))]"
            : "w-[min(1320px,calc(100%-32px))]",
        )}
      >
        {!modeSelected ? (
          <div className="grid min-h-[70vh] place-items-center">
            <div className="w-full max-w-3xl rounded-[32px] border border-slate-200 bg-white/90 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="mx-auto max-w-2xl text-center">
                <h1 className="text-4xl font-black tracking-[-0.04em] text-slate-900">Choisis ton mode</h1>
                    <p className="mt-3 text-slate-500">Commence par choisir la facon dont tu veux preparer ta page.</p>
              </div>
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <button
                  className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
                  onClick={() => {
                    setMode("guided");
                    setModeSelected(true);
                  }}
                  type="button"
                >
                  <p className="text-lg font-bold text-slate-900">Mode guide</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Parcours etape par etape avec structure, design, sections, langues et images.
                  </p>
                </button>
                <button
                  className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
                  onClick={() => {
                    setMode("free");
                    setModeSelected(true);
                  }}
                  type="button"
                >
                  <p className="text-lg font-bold text-slate-900">Description libre</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Ecris librement ce que tu veux obtenir avec tes envies et tes contraintes.
                  </p>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {mode === "guided" ? (
              <div className="fixed inset-x-3 bottom-3 z-50 2xl:inset-x-auto 2xl:bottom-6 2xl:right-6 2xl:w-[300px]">
                <div className="rounded-[24px] border border-slate-200 bg-white/95 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.16)] backdrop-blur">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Progression</p>
                      <p className="mt-1 text-sm font-bold text-slate-900">
                        Etape {activeStep + 1}/{GUIDED_STEPS.length}: {currentStepMeta.title}
                      </p>
                    </div>
                    <span className="rounded-full bg-teal-50 px-3 py-1 text-sm font-semibold text-teal-700">
                      {progressPercent}%
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-teal-500 transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <button
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700"
                      onClick={() => setActiveStep((prev) => Math.max(prev - 1, 0))}
                      type="button"
                    >
                      Precedent
                    </button>
                    <div className="text-center text-xs text-slate-500">
                      {completedStepsCount}/{GUIDED_STEPS.length} etapes demarrees
                    </div>
                    <button
                      className="rounded-full border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
                      onClick={() => setActiveStep((prev) => Math.min(prev + 1, GUIDED_STEPS.length - 1))}
                      type="button"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="sticky top-4 z-40 flex justify-end">
              <div className="flex gap-3 rounded-full border border-slate-200 bg-white/90 p-2 shadow-sm backdrop-blur">
                <button
                  className={cx(
                    "rounded-full border px-4 py-2 text-sm font-semibold",
                    mode === "guided" ? "border-teal-500 bg-teal-500 text-white" : "border-slate-200 bg-white text-slate-700",
                  )}
                  onClick={() => setMode("guided")}
                  type="button"
                >
                  Mode guide
                </button>
                <button
                  className={cx(
                    "rounded-full border px-4 py-2 text-sm font-semibold",
                    mode === "free" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700",
                  )}
                  onClick={() => setMode("free")}
                  type="button"
                >
                  Description libre
                </button>
              </div>
            </div>
            <form className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]" onSubmit={handleSubmit}>
              <div className="grid gap-6 self-start">
            {mode === "guided" ? (
              <>
                <div className="sticky top-[84px] z-30 grid gap-3 rounded-[28px] border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
                        {draftSaveState === "saved" ? "Brouillon enregistre" : "En cours"}
                      </span>
                      <p className="text-sm text-slate-500">
                        Progression de creation: <span className="font-semibold text-slate-900">{progressPercent}%</span>
                        <span className="ml-2 text-slate-400">({completedStepsCount}/{GUIDED_STEPS.length} etapes demarrees)</span>
                      </p>
                    </div>
                    <button
                      className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white"
                      onClick={() => {
                        window.localStorage.removeItem(PROMPT_DRAFT_STORAGE_KEY);
                        setGuidedPrompt(DEFAULT_GUIDED_STATE);
                        setPrompt(DEFAULT_PROMPT);
                        setActiveStep(0);
                        setMode("guided");
                        setModeSelected(true);
                        setSuccessMessage(null);
                        setError(null);
                      }}
                      type="button"
                    >
                      Reinitialiser le brouillon
                    </button>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-teal-500 transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
                    {GUIDED_STEPS.map((step, index) => (
                      <button className="shrink-0" key={step.id} onClick={() => setActiveStep(index)} type="button">
                        <StepBadge active={activeStep === index} done={stepCompletion[index]} label={step.title} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-6 rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
                          Etape {activeStep + 1} sur {GUIDED_STEPS.length}
                        </p>
                        <h2 className="mt-1 text-2xl font-bold text-slate-900">{currentStepMeta.title}</h2>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700 shadow-sm">
                        {currentStepDoneCount}/{currentStepChecklist.length} points
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{STEP_HELP[currentStepMeta.id].description}</p>
                  </div>

                  {activeStep === 0 ? (
                    <div className="grid gap-6">
                      <div className="rounded-[28px] border border-teal-100 bg-teal-50/70 p-5">
                        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-teal-700">Commencer simplement</p>
                        <p className="mt-2 text-lg font-bold text-slate-900">
                          Tu n&apos;as pas besoin de tout connaitre pour creer une bonne landing page.
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          Commence juste par decrire ton activite en une phrase. Le reste peut rester sur les valeurs conseillees, puis tu ajusteras ensuite.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-3">
                          {STARTER_PRESETS.map((preset) => (
                            <button
                              className="rounded-2xl border border-teal-200 bg-white px-4 py-3 text-left transition hover:border-teal-400"
                              key={preset.key}
                              onClick={() => applyStarterPreset(preset)}
                              type="button"
                            >
                              <p className="text-sm font-semibold text-slate-900">{preset.title}</p>
                              <p className="mt-1 text-xs text-slate-500">{preset.description}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                      <label className="grid gap-2">
                        <span className="text-sm font-semibold text-slate-700">Nom du site</span>
                        <input
                          className="rounded-2xl border border-slate-200 px-4 py-3"
                          onChange={(event) => setGuidedPrompt((prev) => ({ ...prev, websiteName: event.target.value }))}
                          placeholder="Ex: NovaFlow, PulseFit, Studio Hana..."
                          value={guidedPrompt.websiteName}
                        />
                      </label>
                      <label className="grid gap-2">
                        <span className="text-sm font-semibold text-slate-700">Produit</span>
                        <select
                          className="rounded-2xl border border-slate-200 px-4 py-3"
                          onChange={(event) => setGuidedPrompt((prev) => ({ ...prev, product: event.target.value }))}
                          value={guidedPrompt.product}
                        >
                          {PRODUCT_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-2 md:col-span-2">
                        <span className="text-sm font-semibold text-slate-700">Descriptif de l&apos;activite</span>
                        <textarea
                          className="rounded-2xl border border-slate-200 px-4 py-3"
                          onChange={(event) => setGuidedPrompt((prev) => ({ ...prev, businessDescription: event.target.value }))}
                          placeholder="Explique simplement ce que tu proposes, pour qui, et pourquoi c'est utile."
                          rows={4}
                          value={guidedPrompt.businessDescription}
                        />
                      </label>
                      <label className="grid gap-2">
                        <span className="text-sm font-semibold text-slate-700">Type de page</span>
                        <select
                          className="rounded-2xl border border-slate-200 px-4 py-3"
                          onChange={(event) => setGuidedPrompt((prev) => ({ ...prev, pageType: event.target.value }))}
                          value={guidedPrompt.pageType}
                        >
                          {PAGE_TYPE_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-2">
                        <span className="text-sm font-semibold text-slate-700">Objectif</span>
                        <select
                          className="rounded-2xl border border-slate-200 px-4 py-3"
                          onChange={(event) => setGuidedPrompt((prev) => ({ ...prev, goal: event.target.value }))}
                          value={guidedPrompt.goal}
                        >
                          {GOAL_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>
                      </div>
                    </div>
                  ) : null}

                  {activeStep === 1 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="grid gap-2">
                        <span className="text-sm font-semibold text-slate-700">Audience</span>
                        <select
                          className="rounded-2xl border border-slate-200 px-4 py-3"
                          onChange={(event) => setGuidedPrompt((prev) => ({ ...prev, audience: event.target.value }))}
                          value={guidedPrompt.audience}
                        >
                          {AUDIENCE_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-2">
                        <span className="text-sm font-semibold text-slate-700">Langue principale</span>
                        <select
                          className="rounded-2xl border border-slate-200 px-4 py-3"
                          onChange={(event) =>
                            setGuidedPrompt((prev) => {
                              const nextLocale = event.target.value;
                              const supportedLocales = parseSupportedLocales(prev.supportedLanguages, nextLocale);

                              return {
                                ...prev,
                                displayLanguage: nextLocale,
                                supportedLanguages: supportedLocales.includes(normalizeLocaleToken(nextLocale))
                                  ? supportedLocales.join(", ")
                                  : [normalizeLocaleToken(nextLocale), ...supportedLocales].join(", "),
                              };
                            })
                          }
                          value={guidedPrompt.displayLanguage}
                        >
                          {LANGUAGE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-2">
                        <span className="text-sm font-semibold text-slate-700">Ton</span>
                        <select
                          className="rounded-2xl border border-slate-200 px-4 py-3"
                          onChange={(event) => setGuidedPrompt((prev) => ({ ...prev, tone: event.target.value }))}
                          value={guidedPrompt.tone}
                        >
                          {TONE_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-2">
                        <span className="text-sm font-semibold text-slate-700">Sens de lecture</span>
                        <select
                          className="rounded-2xl border border-slate-200 px-4 py-3"
                          onChange={(event) =>
                            setGuidedPrompt((prev) => ({ ...prev, directionMode: event.target.value as DirectionMode }))
                          }
                          value={guidedPrompt.directionMode}
                        >
                          <option value="auto">Automatique selon la langue</option>
                          <option value="ltr">Gauche vers droite</option>
                          <option value="rtl">Droite vers gauche</option>
                        </select>
                      </label>
                      <label className="grid gap-2 md:col-span-2">
                        <span className="text-sm font-semibold text-slate-700">Plusieurs langues</span>
                        <div className="flex flex-wrap gap-3">
                          <button
                            className={cx(
                              "rounded-full border px-4 py-2 text-sm font-semibold",
                              !guidedPrompt.multilingualMode
                                ? "border-slate-900 bg-slate-900 text-white"
                                : "border-slate-200 bg-white text-slate-700",
                            )}
                            onClick={() =>
                              setGuidedPrompt((prev) => ({
                                ...prev,
                                multilingualMode: false,
                                supportedLanguages: prev.displayLanguage,
                                translationContext: "",
                              }))
                            }
                            type="button"
                          >
                            Une seule langue
                          </button>
                          <button
                            className={cx(
                              "rounded-full border px-4 py-2 text-sm font-semibold",
                              guidedPrompt.multilingualMode
                                ? "border-teal-500 bg-teal-500 text-white"
                                : "border-slate-200 bg-white text-slate-700",
                            )}
                            onClick={() =>
                              setGuidedPrompt((prev) => ({
                                ...prev,
                                multilingualMode: true,
                                supportedLanguages:
                                  prev.supportedLanguages.trim().length > 0
                                    ? prev.supportedLanguages
                                    : `${prev.displayLanguage}, en`,
                              }))
                            }
                            type="button"
                          >
                            Multi-langue
                          </button>
                        </div>
                      </label>
                      {guidedPrompt.multilingualMode ? (
                        <>
                          <label className="grid gap-2 md:col-span-2">
                            <span className="text-sm font-semibold text-slate-700">Langues a proposer</span>
                            <input
                              className="rounded-2xl border border-slate-200 px-4 py-3"
                              onChange={(event) => setGuidedPrompt((prev) => ({ ...prev, supportedLanguages: event.target.value }))}
                              placeholder="fr, en, ar"
                              value={guidedPrompt.supportedLanguages}
                            />
                          </label>
                          <label className="grid gap-2 md:col-span-2">
                            <span className="text-sm font-semibold text-slate-700">Consignes pour les langues</span>
                            <textarea
                              className="rounded-2xl border border-slate-200 px-4 py-3"
                              onChange={(event) => setGuidedPrompt((prev) => ({ ...prev, translationContext: event.target.value }))}
                              placeholder="Ex: garder un ton premium, rester simple, utiliser des boutons courts."
                              rows={3}
                              value={guidedPrompt.translationContext}
                            />
                          </label>
                        </>
                      ) : null}
                      <label className="grid gap-2 md:col-span-2">
                        <span className="text-sm font-semibold text-slate-700">Bouton principal</span>
                        <input
                          className="rounded-2xl border border-slate-200 px-4 py-3"
                          onChange={(event) => setGuidedPrompt((prev) => ({ ...prev, cta: event.target.value }))}
                          value={guidedPrompt.cta}
                        />
                      </label>
                      <label className="grid gap-2 md:col-span-2">
                        <span className="text-sm font-semibold text-slate-700">Notes</span>
                        <textarea
                          className="rounded-2xl border border-slate-200 px-4 py-3"
                          onChange={(event) => setGuidedPrompt((prev) => ({ ...prev, notes: event.target.value }))}
                          rows={4}
                          value={guidedPrompt.notes}
                        />
                      </label>
                    </div>
                  ) : null}

                  {activeStep === 2 ? (
                    <div className="grid gap-6">
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="grid gap-2">
                          <span className="text-sm font-semibold text-slate-700">Style</span>
                          <select className="rounded-2xl border border-slate-200 px-4 py-3" onChange={(event) => setGuidedPrompt((prev) => ({ ...prev, style: event.target.value }))} value={guidedPrompt.style}>
                            {STYLE_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="grid gap-2">
                          <span className="text-sm font-semibold text-slate-700">Style UI</span>
                          <select className="rounded-2xl border border-slate-200 px-4 py-3" onChange={(event) => setGuidedPrompt((prev) => ({ ...prev, uiStyle: event.target.value }))} value={guidedPrompt.uiStyle}>
                            {UI_STYLE_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="grid gap-2">
                          <span className="text-sm font-semibold text-slate-700">Coins</span>
                          <select className="rounded-2xl border border-slate-200 px-4 py-3" onChange={(event) => setGuidedPrompt((prev) => ({ ...prev, cornerStyle: event.target.value }))} value={guidedPrompt.cornerStyle}>
                            {CORNER_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="grid gap-2">
                          <span className="text-sm font-semibold text-slate-700">Gradients</span>
                          <select className="rounded-2xl border border-slate-200 px-4 py-3" onChange={(event) => setGuidedPrompt((prev) => ({ ...prev, gradientMode: event.target.value as GradientMode }))} value={guidedPrompt.gradientMode}>
                            <option value="model">Laisser choisir</option>
                            <option value="with">Avec gradients</option>
                            <option value="without">Sans gradient</option>
                          </select>
                        </label>
                      </div>

                      <div className="grid gap-4 rounded-[28px] border border-slate-200 bg-slate-50/70 p-4 md:grid-cols-2">
                        <label className="grid gap-2">
                          <span className="text-sm font-semibold text-slate-700">Style du menu du haut</span>
                          <select
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                            onChange={(event) => setGuidedPrompt((prev) => ({ ...prev, headerVariant: event.target.value }))}
                            value={guidedPrompt.headerVariant}
                          >
                            {HEADER_VARIANT_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="grid gap-2">
                          <span className="text-sm font-semibold text-slate-700">Position du menu du haut</span>
                          <select
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                            onChange={(event) => setGuidedPrompt((prev) => ({ ...prev, headerSticky: event.target.value }))}
                            value={guidedPrompt.headerSticky}
                          >
                            {HEADER_STICKY_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="grid gap-2">
                          <span className="text-sm font-semibold text-slate-700">Fond du menu du haut</span>
                          <select
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                            onChange={(event) => setGuidedPrompt((prev) => ({ ...prev, headerTransparency: event.target.value }))}
                            value={guidedPrompt.headerTransparency}
                          >
                            {HEADER_TRANSPARENCY_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="grid gap-2">
                          <span className="text-sm font-semibold text-slate-700">Comportement au scroll</span>
                          <select
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                            onChange={(event) => setGuidedPrompt((prev) => ({ ...prev, headerScrollBehavior: event.target.value }))}
                            value={guidedPrompt.headerScrollBehavior}
                          >
                            {HEADER_SCROLL_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <div className="grid gap-3">
                        <p className="text-sm font-semibold text-slate-700">Choix des couleurs</p>
                        <div className="flex flex-wrap gap-3">
                          {[
                            { value: "model", label: "Laisser le modele choisir" },
                            { value: "palette", label: "Choisir une ambiance couleur" },
                            { value: "custom", label: "Choisir mes couleurs" },
                          ].map((option) => (
                            <button
                              className={cx(
                                "rounded-full border px-4 py-2 text-sm font-semibold",
                                guidedPrompt.colorMode === option.value
                                  ? "border-teal-500 bg-teal-500 text-white"
                                  : "border-slate-200 bg-white text-slate-700",
                              )}
                              key={option.value}
                              onClick={() => setGuidedPrompt((prev) => ({ ...prev, colorMode: option.value as ColorMode }))}
                              type="button"
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {guidedPrompt.colorMode === "palette" ? (
                        <div className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-3">
                          <div className="max-h-[560px] overflow-y-auto pr-1">
                            <div className="grid gap-6">
                              {paletteGroups.map((group) => (
                                <div className="grid gap-3" key={group.category}>
                                  <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                                    <div>
                                      <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">
                                        {getPaletteCategoryLabel(group.category)}
                                      </p>
                                      <p className="text-sm text-slate-500">{group.description}</p>
                                    </div>
                                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                                      {group.palettes.length} propositions
                                    </span>
                                  </div>
                                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                                    {group.palettes.map((palette) => (
                                      <PaletteCard
                                        key={palette.value}
                                        onClick={() => setGuidedPrompt((prev) => ({ ...prev, palette: palette.value }))}
                                        palette={palette}
                                        selected={guidedPrompt.palette === palette.value}
                                      />
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <p className="mt-3 text-xs text-slate-500">
                            Si tu coches `gallery`, des images sont maintenant generees automatiquement par defaut.
                          </p>
                        </div>
                      ) : null}

                      {guidedPrompt.colorMode === "custom" ? (
                        <div className="grid gap-4 md:grid-cols-5">
                          {[
                            ["Primaire", "customPrimary"],
                            ["Secondaire", "customSecondary"],
                            ["Accent", "customAccent"],
                            ["Fond", "customBackground"],
                            ["Texte", "customText"],
                          ].map(([label, key]) => (
                            <label className="grid gap-2" key={key}>
                              <span className="text-sm font-semibold text-slate-700">{label}</span>
                              <input
                                className="h-12 w-full rounded-2xl border border-slate-200"
                                onChange={(event) =>
                                  setGuidedPrompt((prev) => ({ ...prev, [key]: event.target.value }))
                                }
                                type="color"
                                value={guidedPrompt[key as keyof GuidedPromptState] as string}
                              />
                            </label>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {activeStep === 3 ? (
                    <div className="grid gap-6">
                      <div className="grid gap-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                        <label className="grid gap-2">
                          <span className="text-sm font-semibold text-slate-700">Niveau UX</span>
                          <select
                            className="rounded-2xl border border-slate-200 px-4 py-3"
                            onChange={(event) => setGuidedPrompt((prev) => ({ ...prev, uxLevel: event.target.value }))}
                            value={guidedPrompt.uxLevel}
                          >
                            {UX_LEVEL_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </label>
                        <div className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-4">
                          <p className="text-sm font-semibold text-slate-700">Intentions UX</p>
                          <p className="mt-2 text-sm text-slate-500">
                            Choisis les optimisations d&apos;experience que le modele doit privilegier dans la page.
                          </p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                              {guidedPrompt.uxOptions.length} options actives
                            </span>
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                              Niveau {guidedPrompt.uxLevel.toLowerCase()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {(["Engagement", "Fluidite"] as const).map((category) => (
                        <div className="grid gap-3" key={category}>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">{category}</p>
                            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                              {UX_OPTIONS.filter((option) => option.category === category).length} options
                            </span>
                          </div>
                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {UX_OPTIONS.filter((option) => option.category === category).map((option) => {
                              const active = guidedPrompt.uxOptions.includes(option.value);
                              return (
                                <button
                                  className={cx(
                                    "rounded-[24px] border p-4 text-left transition",
                                    active
                                      ? "border-teal-500 bg-teal-50 shadow-sm"
                                      : "border-slate-200 bg-white hover:border-slate-300",
                                  )}
                                  key={option.value}
                                  onClick={() => toggleUxOption(option.value)}
                                  type="button"
                                >
                                  <p className="text-sm font-semibold text-slate-900">{option.label}</p>
                                  <p className="mt-2 text-sm leading-6 text-slate-500">{option.description}</p>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {activeStep === 4 ? (
                    <div className="grid gap-6">
                      <div className="grid gap-3">
                        <p className="text-sm font-semibold text-slate-700">Blocs a afficher</p>
                        <div className="flex flex-wrap gap-3">
                          {SECTION_OPTIONS.map((section) => {
                            const active = guidedPrompt.sections.includes(section);
                            return (
                              <button
                                className={cx(
                                  "rounded-full border px-4 py-2 text-sm font-semibold",
                                  active ? "border-teal-500 bg-teal-500 text-white" : "border-slate-200 bg-white text-slate-700",
                                )}
                                key={section}
                              onClick={() => toggleSection(section)}
                                type="button"
                              >
                                {getSectionDisplayLabel(section)}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="grid gap-2">
                          <span className="text-sm font-semibold text-slate-700">Image hero</span>
                          <select className="rounded-2xl border border-slate-200 px-4 py-3" onChange={(event) => setGuidedPrompt((prev) => ({ ...prev, heroImageMode: event.target.value as GuidedPromptState["heroImageMode"] }))} value={guidedPrompt.heroImageMode}>
                            <option value="none">Pas d&apos;image</option>
                            <option value="context">Selon le contexte</option>
                            <option value="custom">Description custom</option>
                          </select>
                        </label>
                        <label className="grid gap-2">
                          <span className="text-sm font-semibold text-slate-700">Images galerie</span>
                          <select
                            className="rounded-2xl border border-slate-200 px-4 py-3"
                            onChange={(event) =>
                              setGuidedPrompt((prev) => {
                                const nextValue = event.target.value;
                                const hasGallerySection = prev.sections.includes("gallery");

                                return {
                                  ...prev,
                                  galleryImageCount: nextValue,
                                  sections:
                                    nextValue === "0"
                                      ? prev.sections.filter((item) => item !== "gallery")
                                      : hasGallerySection
                                        ? prev.sections
                                        : [...prev.sections, "gallery"],
                                  imageDisplay:
                                    nextValue !== "0" && prev.imageDisplay === "auto"
                                      ? "grid"
                                      : prev.imageDisplay,
                                  galleryDescriptionMode:
                                    nextValue === "0" ? "context" : prev.galleryDescriptionMode,
                                };
                              })
                            }
                            value={guidedPrompt.galleryImageCount}
                          >
                            {["0", "1", "2", "3", "4", "5", "6"].map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="grid gap-2">
                          <span className="text-sm font-semibold text-slate-700">Disposition des images</span>
                          <select className="rounded-2xl border border-slate-200 px-4 py-3" onChange={(event) => setGuidedPrompt((prev) => ({ ...prev, imageDisplay: event.target.value }))} value={guidedPrompt.imageDisplay}>
                            {IMAGE_DISPLAY_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {getImageDisplayLabel(option)}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      {guidedPrompt.heroImageMode === "custom" ? (
                        <label className="grid gap-2">
                          <span className="text-sm font-semibold text-slate-700">Description de l'image d'ouverture</span>
                          <textarea className="rounded-2xl border border-slate-200 px-4 py-3" onChange={(event) => setGuidedPrompt((prev) => ({ ...prev, heroImageCustomDescription: event.target.value }))} rows={3} value={guidedPrompt.heroImageCustomDescription} />
                        </label>
                      ) : null}

                      {guidedPrompt.galleryImageCount !== "0" ? (
                        <label className="grid gap-2">
                          <span className="text-sm font-semibold text-slate-700">Description galerie</span>
                          <textarea className="rounded-2xl border border-slate-200 px-4 py-3" onChange={(event) => setGuidedPrompt((prev) => ({ ...prev, galleryCustomDescription: event.target.value, galleryDescriptionMode: "custom" }))} rows={3} value={guidedPrompt.galleryCustomDescription} />
                        </label>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-3">
                    <button
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                      onClick={() => setActiveStep((prev) => Math.max(prev - 1, 0))}
                      type="button"
                    >
                      Precedent
                    </button>
                    <button
                      className="rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                      onClick={() => setActiveStep((prev) => Math.min(prev + 1, GUIDED_STEPS.length - 1))}
                      type="button"
                    >
                      Suivant
                    </button>
                  </div>
                  <button
                    className="rounded-full border border-teal-500 bg-teal-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                    disabled={loading}
                    type="submit"
                  >
                    {loading ? "Creation en cours..." : "Creer la page"}
                  </button>
                </div>
              </>
            ) : (
              <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                <label className="grid gap-3">
                  <span className="text-sm font-semibold text-slate-700">Decris ta page librement</span>
                  <p className="text-sm text-slate-500">
                    Explique simplement ce que tu veux. Par exemple : `tous les textes en arabe`,
                    `page entierement en anglais`, `lecture de droite a gauche`, `page en francais, arabe et anglais`.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {FREE_PROMPT_SUGGESTIONS.map((suggestion) => (
                      <button
                        className={cx(
                          "rounded-full border px-3 py-2 text-sm font-semibold transition",
                          suggestion.key === "multilingual"
                            ? "border-teal-500 bg-teal-500 text-white"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white",
                        )}
                        key={suggestion.key}
                        onClick={() => setPrompt(suggestion.prompt)}
                        type="button"
                      >
                        {suggestion.key === "multilingual" ? "Multi-langue" : suggestion.title}
                      </button>
                    ))}
                  </div>
                  <textarea
                    className="min-h-[320px] rounded-3xl border border-slate-200 px-5 py-4 text-sm text-slate-800"
                    onChange={(event) => setPrompt(event.target.value)}
                    value={prompt}
                  />
                </label>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {FREE_PROMPT_SUGGESTIONS.map((suggestion) => (
                    <button
                      className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-slate-300 hover:bg-white"
                      key={suggestion.key}
                      onClick={() => setPrompt(suggestion.prompt)}
                      type="button"
                    >
                      <p className="text-sm font-semibold text-slate-900">{suggestion.title}</p>
                      <p className="mt-2 line-clamp-4 text-sm text-slate-500">{suggestion.prompt}</p>
                    </button>
                  ))}
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    className="rounded-full border border-slate-900 bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                    disabled={loading}
                    type="submit"
                  >
                    {loading ? "Creation en cours..." : "Creer la page"}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-6 self-start xl:sticky xl:top-6 2xl:pt-[360px]">
            {mode === "guided" ? (
              <div className="grid gap-4">
                {isFreshGuidedStart ? (
                  <div className="rounded-[28px] border border-amber-200 bg-amber-50/80 p-5 shadow-sm">
                    <p className="text-sm font-semibold uppercase tracking-[0.12em] text-amber-800">Bienvenue</p>
                    <p className="mt-2 text-lg font-bold text-slate-900">On construit ta page pas a pas.</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Commence par l&apos;etape `Projet`. Tu peux juste ecrire une phrase sur ton activite et garder le reste
                      pour plus tard.
                    </p>
                  </div>
                ) : null}

                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm 2xl:hidden">
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Assistant</p>
                  <p className="mt-2 text-lg font-bold text-slate-900">{currentStepMeta.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{STEP_HELP[currentStepMeta.id].description}</p>
                  <div className="mt-4 rounded-2xl border border-teal-100 bg-teal-50/70 p-4">
                    <p className="text-sm font-semibold text-teal-800">Ce que tu dois faire maintenant</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{STEP_HELP[currentStepMeta.id].action}</p>
                    <p className="mt-3 text-xs leading-5 text-slate-500">{STEP_HELP[currentStepMeta.id].example}</p>
                  </div>
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">{STEP_HELP[currentStepMeta.id].title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Remplis cette etape pour guider la generation et obtenir un resultat plus coherent des le premier essai.
                    </p>
                    <div className="mt-4 grid gap-2">
                      {currentStepChecklist.map((item) => (
                        <div
                          className={cx(
                            "flex items-center justify-between rounded-2xl border px-3 py-2",
                            item.done ? "border-emerald-200 bg-emerald-50/70" : "border-slate-200 bg-white",
                          )}
                          key={item.label}
                        >
                          <span className="text-sm text-slate-700">{item.label}</span>
                          <span
                            className={cx(
                              "text-xs font-semibold uppercase tracking-[0.12em]",
                              item.done ? "text-emerald-700" : "text-slate-400",
                            )}
                          >
                            {item.done ? "OK" : "A faire"}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                      {currentStepDoneCount}/{currentStepChecklist.length} points avances dans cette etape
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {mode === "guided" ? (
              <div className="2xl:hidden">
                <PreviewFrame title="Apercu">
                  <SkeletonPreview form={guidedPrompt} />
                </PreviewFrame>
              </div>
            ) : null}

            {mode === "guided" ? (
              <div className="pointer-events-none fixed bottom-6 left-6 z-40 hidden w-[300px] 2xl:block">
                <div className="pointer-events-auto rounded-[28px] border border-slate-200 bg-white/95 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.16)] backdrop-blur">
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Assistant</p>
                  <p className="mt-2 text-lg font-bold text-slate-900">{currentStepMeta.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{STEP_HELP[currentStepMeta.id].description}</p>
                  <div className="mt-4 rounded-2xl border border-teal-100 bg-teal-50/70 p-4">
                    <p className="text-sm font-semibold text-teal-800">Ce que tu dois faire maintenant</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{STEP_HELP[currentStepMeta.id].action}</p>
                    <p className="mt-3 text-xs leading-5 text-slate-500">{STEP_HELP[currentStepMeta.id].example}</p>
                  </div>
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">{STEP_HELP[currentStepMeta.id].title}</p>
                    <div className="mt-4 grid gap-2">
                      {currentStepChecklist.map((item) => (
                        <div
                          className={cx(
                            "flex items-center justify-between rounded-2xl border px-3 py-2",
                            item.done ? "border-emerald-200 bg-emerald-50/70" : "border-slate-200 bg-white",
                          )}
                          key={item.label}
                        >
                          <span className="text-sm text-slate-700">{item.label}</span>
                          <span
                            className={cx(
                              "text-xs font-semibold uppercase tracking-[0.12em]",
                              item.done ? "text-emerald-700" : "text-slate-400",
                            )}
                          >
                            {item.done ? "OK" : "A faire"}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                      {currentStepDoneCount}/{currentStepChecklist.length} points avances dans cette etape
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {mode === "guided" ? (
              <div className="pointer-events-none fixed right-6 top-24 z-40 hidden w-[300px] 2xl:block">
                <div className="pointer-events-auto rounded-[28px] border border-slate-200 bg-white/95 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.16)] backdrop-blur">
                  <p className="mb-3 text-sm font-semibold text-slate-500">Apercu</p>
                  <div className="max-h-[260px] overflow-hidden rounded-[24px]">
                    <SkeletonPreview form={guidedPrompt} />
                  </div>
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
                {error}
              </div>
            ) : null}

            {successMessage ? (
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
                {successMessage}
              </div>
            ) : null}

            {successMessage ? (
              <div className="flex justify-end">
                <Link className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700" href="/">
                  Voir le resultat
                </Link>
              </div>
            ) : null}
          </div>
        </form>
          </>
        )}
      </div>
    </div>
  );
}
