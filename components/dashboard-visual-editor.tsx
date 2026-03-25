"use client";

import type React from "react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  componentRegistry,
  renderSection,
  type PageSection,
} from "@/component-registry";
import {
  PageInlineEditorProvider,
  type PageEditorPathSegment,
} from "@/components/page-inline-editor";
import {
  PageLocalizationProvider,
  type PageLocalizationContextValue,
} from "@/components/page-localization-provider";
import type { RuntimePagePayload } from "@/components/page-runtime-view";
import {
  PALETTE_CATEGORY_DESCRIPTIONS,
  PALETTE_CATEGORY_ORDER,
  PALETTE_LIBRARY,
  findPaletteDefinition,
  inferPaletteCategory,
  paletteToTheme,
  type PalettePreviewDefinition,
} from "@/lib/palette-library";

type ViewportMode = "desktop" | "mobile";

type SectionTemplate = {
  id: string;
  label: string;
  description: string;
  category: string;
  create: () => PageSection;
};

type EditableField = {
  path: PageEditorPathSegment[];
  label: string;
  value: string;
};

type FieldKind = "text" | "textarea" | "number" | "switch" | "select";

type RepeatableFieldDefinition = {
  key: string;
  label: string;
  kind?: FieldKind;
  options?: string[];
};

type RepeatableCollectionDefinition = {
  id: string;
  label: string;
  description: string;
  path: PageEditorPathSegment[];
  fields: RepeatableFieldDefinition[];
  createItem: () => unknown;
};

type ImageSuggestion = {
  src: string;
  score: number;
};

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function clonePage<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isLocaleLikeKey(value: string) {
  return value === "default" || /^[a-z]{2,3}([_-][a-zA-Z]{2,4})?$/.test(value.trim());
}

function isLocalizedTextRecord(value: unknown): value is Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const entries = Object.entries(value);
  return entries.length > 0 && entries.every(([key, nestedValue]) => isLocaleLikeKey(key) && typeof nestedValue === "string");
}

function pickLocalizedText(value: Record<string, string>, locale: string, supportedLocales: string[]) {
  const normalizedLocale = locale.toLowerCase();
  const baseLocale = normalizedLocale.split("-")[0];
  const localeCandidates = [
    normalizedLocale,
    baseLocale,
    ...supportedLocales.map((item) => item.toLowerCase()),
    ...supportedLocales.map((item) => item.toLowerCase().split("-")[0]),
    "default",
  ];

  for (const candidate of localeCandidates) {
    const match = Object.entries(value).find(([key]) => key.toLowerCase() === candidate);
    if (match?.[1]?.trim()) {
      return match[1];
    }
  }

  return Object.values(value).find((item) => item.trim()) ?? "";
}

function resolveLocalizedValue<TValue>(
  value: TValue,
  locale: string,
  supportedLocales: string[],
): TValue {
  if (Array.isArray(value)) {
    return value.map((item) => resolveLocalizedValue(item, locale, supportedLocales)) as TValue;
  }

  if (isLocalizedTextRecord(value)) {
    return pickLocalizedText(value, locale, supportedLocales) as TValue;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        resolveLocalizedValue(nestedValue, locale, supportedLocales),
      ]),
    ) as TValue;
  }

  return value;
}

function inferDirection(locale: string, fallbackDirection?: "ltr" | "rtl", fallbackIsRTL?: boolean) {
  if (fallbackDirection === "rtl" || fallbackIsRTL) {
    const language = locale.toLowerCase().split("-")[0];
    if (["ar", "fa", "he", "ur"].includes(language)) {
      return "rtl";
    }
  }

  return ["ar", "fa", "he", "ur"].includes(locale.toLowerCase().split("-")[0]) ? "rtl" : "ltr";
}

function isDarkColor(color?: string) {
  if (!color) return false;

  const normalized =
    color.length === 4
      ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
      : color;

  if (!/^#[0-9a-fA-F]{6}$/.test(normalized)) return false;

  const red = Number.parseInt(normalized.slice(1, 3), 16);
  const green = Number.parseInt(normalized.slice(3, 5), 16);
  const blue = Number.parseInt(normalized.slice(5, 7), 16);
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;

  return luminance < 0.5;
}

function getCornerTokens(
  cornerStyle?: NonNullable<RuntimePagePayload["theme"]>["cornerStyle"],
) {
  switch (cornerStyle) {
    case "sharp":
      return {
        section: "18px",
        card: "12px",
        inner: "8px",
        button: "10px",
        chip: "10px",
      };
    case "rounded":
      return {
        section: "32px",
        card: "24px",
        inner: "18px",
        button: "999px",
        chip: "999px",
      };
    default:
      return {
        section: "24px",
        card: "18px",
        inner: "12px",
        button: "18px",
        chip: "18px",
      };
  }
}

function getPagePreviewStyle(page: RuntimePagePayload) {
  const darkTheme = isDarkColor(page.theme?.backgroundColor);
  const cornerTokens = getCornerTokens(page.theme?.cornerStyle);
  const runtimeSurface =
    darkTheme &&
    page.theme?.surfaceColor &&
    page.theme?.primaryColor &&
    page.theme.surfaceColor.toLowerCase() === page.theme.primaryColor.toLowerCase()
      ? page.theme.surfaceAltColor ?? "#1f2937"
      : page.theme?.surfaceColor ?? (darkTheme ? "#111827" : "#ffffff");
  const runtimeSurfaceAlt = page.theme?.surfaceAltColor ?? (darkTheme ? "#1f2937" : "#eef4ff");

  return {
    background: `linear-gradient(180deg, ${page.theme?.backgroundColor ?? "#f8fafc"} 0%, ${runtimeSurfaceAlt} 100%)`,
    "--background": page.theme?.backgroundColor ?? "#f8fafc",
    "--surface": runtimeSurface,
    "--surface-alt": runtimeSurfaceAlt,
    "--surface-muted": darkTheme ? "#1f2937" : runtimeSurfaceAlt,
    "--text": page.theme?.textColor ?? "#0f172a",
    "--text-muted": page.theme?.mutedTextColor ?? "#475569",
    "--primary": page.theme?.primaryColor ?? "#2563eb",
    "--primary-dark": page.theme?.secondaryColor ?? page.theme?.primaryColor ?? "#1d4ed8",
    "--accent": page.theme?.accentColor ?? "#93c5fd",
    "--border": page.theme?.borderColor ?? "#dbe4f0",
    "--button-text": page.theme?.buttonTextColor ?? "#ffffff",
    "--success": page.theme?.successColor ?? "#166534",
    "--success-bg": darkTheme ? "#052e16" : "#f0fdf4",
    "--warning-bg": darkTheme ? "#3f2a13" : "#fff7ed",
    "--warning-text": page.theme?.warningColor ?? "#c58b4e",
    "--danger-bg": darkTheme ? "#3f1d1d" : "#fef2f2",
    "--danger-text": darkTheme ? "#fecaca" : "#991b1b",
    "--progress-track": darkTheme ? "rgba(255,255,255,0.14)" : "rgba(15,23,42,0.08)",
    "--image-frame-bg": darkTheme ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.04)",
    "--shadow": darkTheme
      ? "0 18px 44px rgba(0, 0, 0, 0.34)"
      : "0 12px 32px rgba(15, 23, 42, 0.08)",
    colorScheme: darkTheme ? "dark" : "light",
    "--radius-section": cornerTokens.section,
    "--radius-card": cornerTokens.card,
    "--radius-inner": cornerTokens.inner,
    "--radius-button": cornerTokens.button,
    "--radius-chip": cornerTokens.chip,
  } as React.CSSProperties;
}

function getSectionLabel(type?: string) {
  switch (type) {
    case "navbar":
      return "Menu du haut";
    case "hero":
      return "Bloc d'ouverture";
    case "benefits":
      return "Avantages";
    case "stats":
      return "Chiffres";
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
    case "comparison":
      return "Comparaison";
    case "steps":
      return "Etapes";
    case "cta_banner":
      return "Bandeau d'action";
    case "logo_cloud":
      return "Logos";
    case "trust_bar":
      return "Reassurance";
    case "image":
      return "Image";
    case "video":
      return "Video";
    default:
      return "Bloc";
  }
}

function getSectionSummary(
  section: PageSection,
  locale: string,
  supportedLocales: string[],
) {
  const props = resolveLocalizedValue(
    (section.props ?? {}) as Record<string, unknown>,
    locale,
    supportedLocales,
  ) as Record<string, unknown>;

  const candidates = [
    props.headline,
    props.title,
    props.logoText,
    props.subtitle,
    props.subheadline,
    Array.isArray(props.items) && props.items[0] && typeof props.items[0] === "object"
      ? (props.items[0] as Record<string, unknown>).title ??
        (props.items[0] as Record<string, unknown>).question ??
        (props.items[0] as Record<string, unknown>).name
      : undefined,
  ];

  const match = candidates.find((value) => typeof value === "string" && value.trim().length > 0);
  return typeof match === "string" ? match : "Selectionne ce bloc pour le modifier.";
}

function formatFieldLabel(path: PageEditorPathSegment[]) {
  const lastSegment = path[path.length - 1];
  const previousSegment = path[path.length - 2];
  const rawLabel =
    typeof lastSegment === "string"
      ? lastSegment
      : typeof previousSegment === "string"
        ? previousSegment
        : "champ";
  const index = typeof lastSegment === "number" ? lastSegment + 1 : typeof previousSegment === "number" ? previousSegment + 1 : null;

  const baseLabel = rawLabel
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const normalized = baseLabel.charAt(0).toUpperCase() + baseLabel.slice(1).toLowerCase();

  return index ? `${normalized} ${index}` : normalized;
}

function collectTextFields(
  value: unknown,
  basePath: PageEditorPathSegment[] = [],
  fields: EditableField[] = [],
) {
  if (typeof value === "string") {
    const key = basePath[basePath.length - 1];
    const blockedKeys = new Set(["href", "action", "icon", "style", "kind", "name"]);
    if (typeof key === "string" && !blockedKeys.has(key)) {
      fields.push({
        path: basePath,
        label: formatFieldLabel(basePath),
        value,
      });
    }
    return fields;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => collectTextFields(item, [...basePath, index], fields));
    return fields;
  }

  if (isLocalizedTextRecord(value)) {
    fields.push({
      path: basePath,
      label: formatFieldLabel(basePath),
      value: "",
    });
    return fields;
  }

  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, nestedValue]) => {
      collectTextFields(nestedValue, [...basePath, key], fields);
    });
  }

  return fields;
}

function collectImageFields(
  value: unknown,
  basePath: PageEditorPathSegment[] = [],
  fields: EditableField[] = [],
) {
  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, nestedValue]) => {
      const nextPath = [...basePath, key];

      if (key === "src" && typeof nestedValue === "string") {
        fields.push({
          path: nextPath,
          label: formatFieldLabel(nextPath),
          value: nestedValue,
        });
        return;
      }

      collectImageFields(nestedValue, nextPath, fields);
    });
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => collectImageFields(item, [...basePath, index], fields));
  }

  return fields;
}

function getValueAtPath(target: unknown, path: PageEditorPathSegment[]) {
  let cursor = target;

  for (const segment of path) {
    if (typeof segment === "number") {
      cursor = Array.isArray(cursor) ? cursor[segment] : undefined;
      continue;
    }

    if (!cursor || typeof cursor !== "object") {
      return undefined;
    }

    cursor = (cursor as Record<string, unknown>)[segment];
  }

  return cursor;
}

function updatePageValue<TPage extends { [key: string]: unknown }>(
  page: TPage,
  path: PageEditorPathSegment[],
  nextValue: unknown,
  locale: string,
) {
  const clonedPage = clonePage(page);
  let cursor: unknown = clonedPage;

  for (let index = 0; index < path.length - 1; index += 1) {
    const segment = path[index];

    if (typeof segment === "number") {
      cursor = Array.isArray(cursor) ? cursor[segment] : undefined;
    } else if (cursor && typeof cursor === "object") {
      cursor = (cursor as Record<string, unknown>)[segment];
    }
  }

  const targetKey = path[path.length - 1];

  if (!cursor || typeof cursor !== "object") {
    return clonedPage;
  }

  const targetRecord = cursor as Record<string, unknown>;
  const currentValue = targetRecord[String(targetKey)];

  if (isLocalizedTextRecord(currentValue) && typeof nextValue === "string") {
    targetRecord[String(targetKey)] = {
      ...currentValue,
      [locale]: nextValue,
    };
  } else {
    targetRecord[String(targetKey)] = nextValue;
  }

  return clonedPage;
}

function updateArrayAtPath<TPage extends { [key: string]: unknown }>(
  page: TPage,
  path: PageEditorPathSegment[],
  mutate: (items: unknown[]) => void,
) {
  const clonedPage = clonePage(page);
  const target = getValueAtPath(clonedPage, path);
  if (!Array.isArray(target)) {
    return clonedPage;
  }
  mutate(target);
  return clonedPage;
}

function getColorValue(value?: string) {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#2563eb";
}

function normalizeImageSource(value: string) {
  return value.trim();
}

function getImageSuggestions(
  allImages: string[],
  slug: string,
  currentValue?: string,
  limit = 10,
) {
  const normalizedCurrent = currentValue?.trim();
  const slugTokens = slug
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);

  const scored = allImages.map((src) => {
    const normalized = src.toLowerCase();
    let score = 0;

    if (normalizedCurrent && src === normalizedCurrent) score += 1000;
    if (normalized.includes(slug.toLowerCase())) score += 120;

    slugTokens.forEach((token) => {
      if (normalized.includes(token)) score += 24;
    });

    if (normalized.includes("landing")) score += 8;
    if (normalized.includes("generated")) score += 2;

    return { src, score };
  });

  const uniqueValues = new Set<string>();
  const ordered = scored
    .sort((left, right) => right.score - left.score || right.src.localeCompare(left.src))
    .filter((item) => {
      if (uniqueValues.has(item.src)) return false;
      uniqueValues.add(item.src);
      return true;
    });

  if (normalizedCurrent && !uniqueValues.has(normalizedCurrent)) {
    ordered.unshift({ src: normalizedCurrent, score: 2000 });
  }

  return ordered.slice(0, limit);
}

function getImageCaption(src: string) {
  return src
    .split("/")
    .pop()
    ?.replace(/\.[a-z0-9]+$/i, "")
    .replace(/[-_]+/g, " ")
    .trim() ?? "Visuel";
}

function getRepeatableCollections(section: PageSection | null): RepeatableCollectionDefinition[] {
  switch (section?.type) {
    case "benefits":
      return [
        {
          id: "benefits-items",
          label: "Cartes d'avantages",
          description: "Ajoute, retire ou reordonne les avantages affiches.",
          path: ["items"],
          fields: [
            { key: "title", label: "Titre" },
            { key: "description", label: "Texte", kind: "textarea" },
            { key: "icon", label: "Icone" },
          ],
          createItem: () => ({
            title: "Nouvel avantage",
            description: "Explique en une phrase ce point fort.",
            icon: "star",
          }),
        },
      ];
    case "testimonials":
      return [
        {
          id: "testimonials-items",
          label: "Avis",
          description: "Travaille les temoignages visibles sur la page.",
          path: ["items"],
          fields: [
            { key: "name", label: "Nom" },
            { key: "role", label: "Role" },
            { key: "quote", label: "Avis", kind: "textarea" },
            { key: "rating", label: "Note", kind: "number" },
          ],
          createItem: () => ({
            name: "Nouveau client",
            role: "Client satisfait",
            quote: "Ajoute ici un nouvel avis client.",
            rating: 5,
          }),
        },
      ];
    case "faq":
      return [
        {
          id: "faq-items",
          label: "Questions",
          description: "Ajoute des questions et reponses a la section.",
          path: ["items"],
          fields: [
            { key: "question", label: "Question" },
            { key: "answer", label: "Reponse", kind: "textarea" },
          ],
          createItem: () => ({
            question: "Nouvelle question",
            answer: "Ajoute ici une reponse simple et rassurante.",
          }),
        },
      ];
    case "gallery":
      return [
        {
          id: "gallery-items",
          label: "Images",
          description: "Gere les visuels de la galerie.",
          path: ["items"],
          fields: [
            { key: "src", label: "Lien image" },
            { key: "alt", label: "Description" },
          ],
          createItem: () => ({
            src: "",
            alt: "Nouveau visuel",
          }),
        },
      ];
    case "form":
      return [
        {
          id: "form-fields",
          label: "Champs du formulaire",
          description: "Choisis les champs demandes a tes visiteurs.",
          path: ["fields"],
          fields: [
            { key: "label", label: "Libelle" },
            { key: "placeholder", label: "Exemple affiche" },
            {
              key: "type",
              label: "Type de champ",
              kind: "select",
              options: ["text", "email", "tel", "number", "textarea", "select"],
            },
            { key: "required", label: "Obligatoire", kind: "switch" },
          ],
          createItem: () => ({
            type: "text",
            name: `field_${Date.now()}`,
            label: "Nouveau champ",
            required: false,
            placeholder: "Votre reponse",
          }),
        },
      ];
    case "navbar":
      return [
        {
          id: "navbar-links",
          label: "Liens du menu",
          description: "Change les liens visibles dans le menu du haut.",
          path: ["links"],
          fields: [
            { key: "label", label: "Texte du lien" },
            { key: "href", label: "Lien cible" },
          ],
          createItem: () => ({
            label: "Nouveau lien",
            href: "#content",
          }),
        },
      ];
    case "footer":
      return [
        {
          id: "footer-columns",
          label: "Colonnes",
          description: "Ajoute ou retire des colonnes dans le bas de page.",
          path: ["columns"],
          fields: [{ key: "title", label: "Titre de colonne" }],
          createItem: () => ({
            title: "Nouvelle colonne",
            links: [
              {
                label: "Nouveau lien",
                href: "#content",
              },
            ],
          }),
        },
      ];
    default:
      return [];
  }
}

const SECTION_LIBRARY: SectionTemplate[] = [
  {
    id: "hero-split",
    label: "Bloc d'ouverture",
    description: "Une premiere section claire avec titre, texte et bouton.",
    category: "Essentiels",
    create: () => ({
      type: "hero",
      variant: "split",
      props: {
        eyebrow: "Nouveau",
        headline: "Presente ton offre en quelques secondes",
        subheadline: "Ajoute un message simple, rassurant et oriente conversion.",
        primaryCta: {
          label: "Je decouvre",
          action: "#lead-form",
        },
        secondaryCta: {
          label: "Voir plus",
          action: "#benefits",
        },
        media: {
          kind: "image",
          src: "",
        },
      },
    }),
  },
  {
    id: "benefits-cards",
    label: "Avantages",
    description: "Trois points forts pour expliquer pourquoi choisir ton offre.",
    category: "Essentiels",
    create: () => ({
      type: "benefits",
      variant: "cards",
      props: {
        title: "Pourquoi choisir cette offre ?",
        subtitle: "Des points forts clairs, lisibles et convaincants.",
        columns: 3,
        items: [
          {
            title: "Simple a prendre en main",
            description: "Une experience fluide pour aller a l'essentiel.",
            icon: "layers",
          },
          {
            title: "Fiable",
            description: "Des resultats stables pour rassurer tes visiteurs.",
            icon: "shield",
          },
          {
            title: "Rapide",
            description: "Un parcours court pour passer a l'action plus vite.",
            icon: "check",
          },
        ],
      },
    }),
  },
  {
    id: "testimonials-carousel",
    label: "Avis clients",
    description: "Ajoute de la preuve sociale avec plusieurs retours clients.",
    category: "Confiance",
    create: () => ({
      type: "testimonials",
      variant: "carousel",
      props: {
        title: "Ils en parlent mieux que nous",
        items: [
          {
            name: "Client 1",
            role: "Utilisateur",
            quote: "Le resultat est plus clair et plus professionnel.",
            rating: 5,
          },
          {
            name: "Client 2",
            role: "Utilisateur",
            quote: "La page inspire confiance et convertit mieux.",
            rating: 5,
          },
        ],
      },
    }),
  },
  {
    id: "faq-basic",
    label: "Questions frequentes",
    description: "Reponds aux hesitations les plus courantes.",
    category: "Confiance",
    create: () => ({
      type: "faq",
      props: {
        title: "Questions frequentes",
        items: [
          {
            question: "Combien de temps faut-il pour commencer ?",
            answer: "Quelques minutes suffisent pour mettre la page en ligne.",
          },
          {
            question: "Puis-je changer le contenu ensuite ?",
            answer: "Oui, tu pourras modifier textes, images et blocs.",
          },
        ],
      },
    }),
  },
  {
    id: "gallery-grid",
    label: "Galerie",
    description: "Montre ton produit ou ton travail avec plusieurs visuels.",
    category: "Visuels",
    create: () => ({
      type: "gallery",
      variant: "grid",
      props: {
        title: "Quelques apercus",
        subtitle: "Ajoute ici plusieurs visuels pour illustrer ton offre.",
        items: [
          { src: "", alt: "Visuel 1" },
          { src: "", alt: "Visuel 2" },
          { src: "", alt: "Visuel 3" },
        ],
      },
    }),
  },
  {
    id: "form-card",
    label: "Formulaire",
    description: "Capture une demande ou une inscription facilement.",
    category: "Conversion",
    create: () => ({
      type: "form",
      variant: "card",
      props: {
        title: "Parlons de ton projet",
        submitLabel: "Envoyer",
        successMessage: "Merci, nous revenons vers vous rapidement.",
        fields: [
          {
            type: "text",
            name: "fullname",
            label: "Nom complet",
            required: true,
            placeholder: "Votre nom",
          },
          {
            type: "email",
            name: "email",
            label: "Adresse email",
            required: true,
            placeholder: "vous@exemple.com",
          },
        ],
      },
    }),
  },
];

function ViewportButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={cx(
        "inline-flex h-11 items-center justify-center rounded-full px-4 text-sm font-semibold transition",
        active
          ? "bg-slate-950 text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)]"
          : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300",
      )}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function Panel({
  title,
  eyebrow,
  children,
  className,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cx("rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{eyebrow}</p>
      <h2 className="mt-2 text-xl font-black tracking-[-0.02em] text-slate-950">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
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
        "flex h-full w-full flex-col rounded-[24px] border p-4 text-left transition hover:-translate-y-0.5",
        selected ? "border-blue-500 bg-blue-50 shadow-sm" : "border-slate-200 bg-white",
      )}
      onClick={onClick}
      type="button"
    >
      <div
        className="mb-3 h-16 rounded-[18px]"
        style={{
          background: `linear-gradient(135deg, ${palette.colors[0]} 0%, ${palette.colors[1]} 50%, ${palette.colors[2]} 100%)`,
        }}
      />
      <div className="flex min-h-[84px] flex-1 flex-col">
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
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
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

export function DashboardVisualEditor({
  initialPage,
  availableImages,
}: {
  initialPage: RuntimePagePayload;
  availableImages: string[];
}) {
  const [savedPage, setSavedPage] = useState(initialPage);
  const [draftPage, setDraftPage] = useState(initialPage);
  const [imageLibrary, setImageLibrary] = useState(availableImages);
  const [selectedSectionIndex, setSelectedSectionIndex] = useState<number | null>(
    initialPage.sections.length > 0 ? 0 : null,
  );
  const [viewport, setViewport] = useState<ViewportMode>("desktop");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [libraryInsertIndex, setLibraryInsertIndex] = useState<number | null>(null);
  const [draggedSectionIndex, setDraggedSectionIndex] = useState<number | null>(null);
  const [uploadingFieldKey, setUploadingFieldKey] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const mobilePreviewFrameRef = useRef<HTMLIFrameElement | null>(null);
  const localization = draftPage.localization;
  const initialLocale = localization?.locale ?? localization?.supportedLocales?.[0] ?? "fr";
  const supportedLocales =
    localization?.supportedLocales && localization.supportedLocales.length > 0
      ? localization.supportedLocales
      : [initialLocale];
  const [activeLocale, setActiveLocale] = useState(initialLocale);
  const direction = inferDirection(activeLocale, localization?.direction, localization?.isRTL);
  const hasChanges = JSON.stringify(draftPage) !== JSON.stringify(savedPage);

  const localizationValue: PageLocalizationContextValue = useMemo(
    () => ({
      locale: activeLocale,
      direction,
      isRTL: direction === "rtl",
      supportedLocales,
      translationContext: localization?.translationContext,
      translationsEnabled:
        localization?.translationsEnabled ??
        Boolean(localization?.supportedLocales && localization.supportedLocales.length > 1),
      setLocale: setActiveLocale,
    }),
    [activeLocale, direction, localization?.supportedLocales, localization?.translationContext, localization?.translationsEnabled, supportedLocales],
  );

  const previewPage = useMemo(() => {
    const resolvedSections = resolveLocalizedValue(
      draftPage.sections,
      activeLocale,
      supportedLocales,
    ) as PageSection[];

    const preparedSections = resolvedSections.map((section) => {
      if (section.type !== "navbar") {
        return section;
      }

      const clonedSection = clonePage(section);
      const props = (clonedSection.props ?? {}) as Record<string, unknown>;

      return {
        ...clonedSection,
        props: {
          ...props,
          sticky: false,
          showOnScroll: false,
        },
      };
    });

    return {
      ...draftPage,
      title: resolveLocalizedValue(draftPage.title, activeLocale, supportedLocales),
      sections: preparedSections,
    };
  }, [activeLocale, draftPage, supportedLocales]);

  const previewStyle = useMemo(() => getPagePreviewStyle(previewPage), [previewPage]);
  const selectedSection =
    selectedSectionIndex !== null ? draftPage.sections[selectedSectionIndex] : null;
  const selectedAllowedVariants =
    selectedSection && selectedSection.type in componentRegistry
      ? componentRegistry[selectedSection.type as keyof typeof componentRegistry].allowedVariants ?? []
      : [];
  const repeatableCollections = useMemo(
    () => getRepeatableCollections(selectedSection),
    [selectedSection],
  );

  function postPreviewPageToMobileFrame() {
    mobilePreviewFrameRef.current?.contentWindow?.postMessage(
      {
        type: "dashboard-preview:update",
        page: previewPage,
      },
      window.location.origin,
    );
  }

  useEffect(() => {
    if (viewport !== "mobile") {
      return;
    }

    postPreviewPageToMobileFrame();
  }, [previewPage, viewport]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent<unknown>) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      if (
        !event.data ||
        typeof event.data !== "object" ||
        (event.data as { type?: string }).type !== "dashboard-preview:ready"
      ) {
        return;
      }

      postPreviewPageToMobileFrame();
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [previewPage]);

  const sectionTextFields = useMemo(() => {
    if (selectedSectionIndex === null || !selectedSection?.props) {
      return [];
    }

    return collectTextFields(selectedSection.props, ["sections", selectedSectionIndex, "props"])
      .map((field) => {
        const currentValue = getValueAtPath(draftPage, field.path);
        return {
          ...field,
          value: isLocalizedTextRecord(currentValue)
            ? pickLocalizedText(currentValue, activeLocale, supportedLocales)
            : typeof currentValue === "string"
              ? currentValue
              : "",
        };
      })
      .filter((field) => field.value.trim().length > 0)
      .slice(0, 12);
  }, [activeLocale, draftPage, selectedSection, selectedSectionIndex, supportedLocales]);

  const sectionImageFields = useMemo(() => {
    if (selectedSectionIndex === null || !selectedSection?.props) {
      return [];
    }

    return collectImageFields(selectedSection.props, ["sections", selectedSectionIndex, "props"]).slice(0, 6);
  }, [selectedSection, selectedSectionIndex]);
  const suggestedImages = useMemo(() => {
    const map = new Map<string, ImageSuggestion[]>();

    sectionImageFields.forEach((field) => {
      map.set(
        field.path.join("-"),
        getImageSuggestions(imageLibrary, draftPage.slug, field.value, 12),
      );
    });

    return map;
  }, [draftPage.slug, imageLibrary, sectionImageFields]);
  const activePalette = useMemo(() => {
    const paletteName = typeof draftPage.theme?.name === "string" ? draftPage.theme.name : "";
    return paletteName ? findPaletteDefinition(paletteName) ?? null : null;
  }, [draftPage.theme?.name]);
  const paletteGroups = useMemo(
    () =>
      PALETTE_CATEGORY_ORDER.map((category) => ({
        category,
        description: PALETTE_CATEGORY_DESCRIPTIONS[category],
        palettes: PALETTE_LIBRARY.filter((palette) => inferPaletteCategory(palette) === category),
      })).filter((group) => group.palettes.length > 0),
    [],
  );

  function setFieldValue(path: PageEditorPathSegment[], nextValue: string) {
    setDraftPage((current) => updatePageValue(current, path, nextValue, activeLocale));
    setSaveMessage(null);
    setUploadError(null);
  }

  function setGenericValue(path: PageEditorPathSegment[], nextValue: unknown) {
    setDraftPage((current) => updatePageValue(current, path, nextValue, activeLocale));
    setSaveMessage(null);
    setUploadError(null);
  }

  function registerUploadedImage(src: string) {
    setImageLibrary((current) => [src, ...current.filter((item) => item !== src)]);
  }

  function updateThemeColor(field: keyof NonNullable<RuntimePagePayload["theme"]>, nextValue: string) {
    setDraftPage((current) => {
      const nextPage = clonePage(current);
      if (!nextPage.theme) {
        nextPage.theme = {};
      }
      nextPage.theme[field] = nextValue;
      nextPage.theme.palette = {
        ...(nextPage.theme.palette ?? {}),
      };

      if (field === "primaryColor") nextPage.theme.palette.primary = nextValue;
      if (field === "secondaryColor") nextPage.theme.palette.secondary = nextValue;
      if (field === "accentColor") nextPage.theme.palette.accent = nextValue;
      if (field === "backgroundColor") nextPage.theme.palette.background = nextValue;
      if (field === "textColor") nextPage.theme.palette.textPrimary = nextValue;
      if (field === "mutedTextColor") nextPage.theme.palette.textSecondary = nextValue;
      if (field === "surfaceAltColor") nextPage.theme.palette.muted = nextValue;

      return nextPage;
    });
    setSaveMessage(null);
  }

  function applyPalette(palette: PalettePreviewDefinition) {
    const nextTheme = paletteToTheme(palette);
    setDraftPage((current) => {
      const nextPage = clonePage(current);
      nextPage.theme = {
        ...(nextPage.theme ?? {}),
        ...nextTheme,
        cornerStyle: nextPage.theme?.cornerStyle ?? "balanced",
      };
      return nextPage;
    });
    setSaveMessage(`Palette appliquee : ${palette.label}.`);
  }

  function moveSection(from: number, to: number) {
    if (to < 0 || to >= draftPage.sections.length) {
      return;
    }

    setDraftPage((current) => {
      const nextPage = clonePage(current);
      const [movedSection] = nextPage.sections.splice(from, 1);
      nextPage.sections.splice(to, 0, movedSection);
      return nextPage;
    });
    setSelectedSectionIndex(to);
    setSaveMessage(null);
  }

  function openLibraryAt(insertAt: number) {
    setLibraryInsertIndex(insertAt);
    setShowLibrary(true);
    setSaveMessage(null);
  }

  function duplicateSection(index: number) {
    setDraftPage((current) => {
      const nextPage = clonePage(current);
      const source = nextPage.sections[index];
      nextPage.sections.splice(index + 1, 0, clonePage(source));
      return nextPage;
    });
    setSelectedSectionIndex(index + 1);
    setSaveMessage(null);
  }

  function deleteSection(index: number) {
    setDraftPage((current) => {
      const nextPage = clonePage(current);
      nextPage.sections.splice(index, 1);
      return nextPage;
    });
    setSelectedSectionIndex((current) => {
      if (draftPage.sections.length <= 1) return null;
      if (current === null) return null;
      if (current > index) return current - 1;
      if (current === index) return Math.max(0, index - 1);
      return current;
    });
    setSaveMessage(null);
  }

  function addSection(template: SectionTemplate) {
    const insertAt =
      libraryInsertIndex ??
      (selectedSectionIndex === null ? draftPage.sections.length : selectedSectionIndex + 1);

    setDraftPage((current) => {
      const nextPage = clonePage(current);
      nextPage.sections.splice(insertAt, 0, template.create());
      return nextPage;
    });
    setSelectedSectionIndex(insertAt);
    setShowLibrary(false);
    setLibraryInsertIndex(null);
    setSaveMessage(null);
  }

  function addCollectionItem(path: PageEditorPathSegment[], createItem: () => unknown) {
    setDraftPage((current) =>
      updateArrayAtPath(current, path, (items) => {
        items.push(createItem());
      }),
    );
    setSaveMessage(null);
  }

  function fillImageCollection(path: PageEditorPathSegment[]) {
    setDraftPage((current) =>
      updateArrayAtPath(current, path, (items) => {
        const suggestions = getImageSuggestions(imageLibrary, current.slug, undefined, Math.max(items.length, 8));
        

        items.forEach((item, index) => {
          if (!item || typeof item !== "object" || Array.isArray(item)) {
            return;
          }

          const suggestion = suggestions[index];
          if (!suggestion) return;

          const record = item as Record<string, unknown>;
          record.src = suggestion.src;

          if (typeof record.alt !== "string" || !record.alt.trim()) {
            record.alt = getImageCaption(suggestion.src);
          }
        });
      }),
    );
    setSaveMessage(null);
  }

  async function uploadImage(file: File, path: PageEditorPathSegment[]) {
    const fieldKey = path.join("-");
    setUploadingFieldKey(fieldKey);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("slug", draftPage.slug);

      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as { src?: string; error?: string };
      if (!response.ok || !payload.src) {
        throw new Error(payload.error ?? "Impossible d'envoyer cette image.");
      }

      registerUploadedImage(payload.src);
      setGenericValue(path, payload.src);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Impossible d'envoyer cette image.");
    } finally {
      setUploadingFieldKey(null);
    }
  }

  function duplicateCollectionItem(path: PageEditorPathSegment[], index: number) {
    setDraftPage((current) =>
      updateArrayAtPath(current, path, (items) => {
        const source = items[index];
        items.splice(index + 1, 0, clonePage(source));
      }),
    );
    setSaveMessage(null);
  }

  function removeCollectionItem(path: PageEditorPathSegment[], index: number) {
    setDraftPage((current) =>
      updateArrayAtPath(current, path, (items) => {
        items.splice(index, 1);
      }),
    );
    setSaveMessage(null);
  }

  function moveCollectionItem(path: PageEditorPathSegment[], from: number, to: number) {
    setDraftPage((current) =>
      updateArrayAtPath(current, path, (items) => {
        if (to < 0 || to >= items.length) return;
        const [moved] = items.splice(from, 1);
        items.splice(to, 0, moved);
      }),
    );
    setSaveMessage(null);
  }

  async function saveChanges() {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch("/api/page", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(draftPage),
      });
      const payload = (await response.json()) as RuntimePagePayload & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Impossible d'enregistrer les changements.");
      }

      setDraftPage(payload);
      setSavedPage(payload);
      setSaveMessage("Tous les changements sont enregistres.");
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "Une erreur est survenue.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_30%),linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)] px-3 py-3 md:px-4 md:py-4 xl:px-5">
      <div className="mx-auto flex w-full max-w-[1820px] flex-col gap-4">
        <header className="sticky top-3 z-40 rounded-[30px] border border-white/70 bg-white/88 px-4 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.1)] backdrop-blur md:px-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">Editeur visuel</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="truncate text-2xl font-black tracking-[-0.03em] text-slate-950 md:text-3xl">
                  {typeof previewPage.title === "string" ? previewPage.title : "Page sans titre"}
                </h1>
                <span
                  className={cx(
                    "rounded-full px-3 py-1 text-xs font-semibold",
                    hasChanges ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-700",
                  )}
                >
                  {hasChanges ? "Changements non enregistres" : "Tout est a jour"}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Selectionne un bloc, ajuste son contenu a droite, puis enregistre quand tout te convient.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ViewportButton active={viewport === "desktop"} onClick={() => setViewport("desktop")}>
                Ordinateur
              </ViewportButton>
              <ViewportButton active={viewport === "mobile"} onClick={() => setViewport("mobile")}>
                Telephone
              </ViewportButton>
              <button
                className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                onClick={() => {
                  setDraftPage(savedPage);
                  setSaveMessage("Retour a la derniere version enregistree.");
                }}
                type="button"
              >
                Revenir
              </button>
              <button
                className="inline-flex h-11 items-center justify-center rounded-full border border-slate-950 bg-slate-950 px-5 text-sm font-semibold !text-white shadow-[0_16px_34px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-black hover:!text-white disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSaving || !hasChanges}
                onClick={saveChanges}
                type="button"
              >
                {isSaving ? "Enregistrement..." : "Enregistrer"}
              </button>
              <Link
                className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition hover:bg-white"
                href="/"
                target="_blank"
              >
                Ouvrir la page
              </Link>
              <Link
                className="inline-flex h-11 items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
                href="/prompt"
              >
                Nouvelle page
              </Link>
            </div>
          </div>
          {saveMessage ? <p className="mt-3 text-sm text-slate-600">{saveMessage}</p> : null}
        </header>

        <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_360px]">
          <aside className="grid gap-4 self-start xl:sticky xl:top-[124px]">
            <Panel eyebrow="Structure" title="Blocs de la page">
              <button
                className="inline-flex h-12 w-full items-center justify-center rounded-[20px] border border-slate-950 bg-slate-950 px-4 text-sm font-semibold !text-white shadow-[0_16px_32px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-black hover:!text-white"
                onClick={() => {
                  if (showLibrary) {
                    setShowLibrary(false);
                    setLibraryInsertIndex(null);
                  } else {
                    openLibraryAt(
                      selectedSectionIndex === null ? draftPage.sections.length : selectedSectionIndex + 1,
                    );
                  }
                }}
                type="button"
              >
                {showLibrary ? "Fermer l'ajout de bloc" : "Ajouter un bloc"}
              </button>

              {showLibrary ? (
                <div className="mt-4 grid gap-3">
                  <div className="rounded-[20px] border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                    {libraryInsertIndex === null
                      ? "Le nouveau bloc sera ajoute a la fin de la page."
                      : `Le nouveau bloc sera ajoute a la position ${libraryInsertIndex + 1}.`}
                  </div>
                  {SECTION_LIBRARY.map((template) => (
                    <button
                      className="rounded-[20px] border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-slate-300 hover:bg-white"
                      key={template.id}
                      onClick={() => addSection(template)}
                      type="button"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                        {template.category}
                      </p>
                      <p className="mt-2 text-sm font-bold text-slate-900">{template.label}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">{template.description}</p>
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="mt-4 grid gap-3">
                {draftPage.sections.map((section, index) => (
                  <div
                    className={cx(
                      "rounded-[22px] border p-4 text-left transition",
                      selectedSectionIndex === index
                        ? "border-slate-950 bg-slate-950 text-white shadow-[0_18px_34px_rgba(15,23,42,0.18)]"
                        : "border-slate-200 bg-slate-50/80 text-slate-900 hover:border-slate-300 hover:bg-white",
                    )}
                    draggable
                    key={`${section.type}-${index}`}
                    onDragEnd={() => setDraggedSectionIndex(null)}
                    onDragOver={(event) => event.preventDefault()}
                    onDragStart={() => setDraggedSectionIndex(index)}
                    onDrop={() => {
                      if (draggedSectionIndex !== null && draggedSectionIndex !== index) {
                        moveSection(draggedSectionIndex, index);
                      }
                      setDraggedSectionIndex(null);
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button className="min-w-0 flex-1 text-left" onClick={() => setSelectedSectionIndex(index)} type="button">
                        <p
                          className={cx(
                            "text-[11px] font-semibold uppercase tracking-[0.16em]",
                            selectedSectionIndex === index ? "text-white/70" : "text-slate-400",
                          )}
                        >
                          Bloc {index + 1}
                        </p>
                        <p className="mt-2 text-sm font-bold">{getSectionLabel(section.type)}</p>
                        <p
                          className={cx(
                            "mt-1 line-clamp-2 text-sm leading-5",
                            selectedSectionIndex === index ? "text-white/80" : "text-slate-500",
                          )}
                        >
                          {getSectionSummary(section, activeLocale, supportedLocales)}
                        </p>
                      </button>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <span
                          className={cx(
                            "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                            selectedSectionIndex === index ? "bg-white/10 text-white" : "bg-white text-slate-500",
                          )}
                        >
                          {section.variant ? section.variant : "standard"}
                        </span>
                        <span
                          className={cx(
                            "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]",
                            selectedSectionIndex === index ? "bg-white/10 text-white/80" : "bg-slate-900 text-white",
                          )}
                        >
                          Glisser
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        className={cx(
                          "rounded-full px-3 py-2 text-xs font-semibold transition",
                          selectedSectionIndex === index
                            ? "bg-white/10 text-white hover:bg-white/15"
                            : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                        )}
                        onClick={() => openLibraryAt(index)}
                        type="button"
                      >
                        Ajouter avant
                      </button>
                      <button
                        className={cx(
                          "rounded-full px-3 py-2 text-xs font-semibold transition",
                          selectedSectionIndex === index
                            ? "bg-white/10 text-white hover:bg-white/15"
                            : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                        )}
                        onClick={() => openLibraryAt(index + 1)}
                        type="button"
                      >
                        Ajouter apres
                      </button>
                      <button
                        className={cx(
                          "rounded-full px-3 py-2 text-xs font-semibold transition",
                          selectedSectionIndex === index
                            ? "bg-white/10 text-white hover:bg-white/15"
                            : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                        )}
                        onClick={() => duplicateSection(index)}
                        type="button"
                      >
                        Dupliquer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel eyebrow="Aide" title="Ce que tu peux faire">
              <div className="grid gap-3 text-sm leading-6 text-slate-600">
                <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                  Clique sur un bloc au centre ou dans la liste pour le selectionner.
                </div>
                <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                  Glisse un bloc dans la colonne de gauche pour changer son ordre.
                </div>
                <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                  Utilise le panneau de droite pour gerer les questions, avis, images, liens et champs.
                </div>
              </div>
            </Panel>
          </aside>

          <section className="min-w-0">
            <Panel eyebrow="Apercu interactif" title="Page en cours" className="h-full overflow-hidden">
              <div className="max-h-[calc(100vh-180px)] overflow-auto rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#eff6ff_0%,#e2e8f0_100%)] p-3 md:p-5">
                {viewport === "mobile" ? (
                  <div className="mx-auto max-w-[420px]">
                    <div className="mb-4 rounded-[20px] border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800">
                      Apercu telephone reel. Pour modifier un bloc, selectionne-le depuis la colonne de gauche ou de droite.
                    </div>
                    <div className="mx-auto w-[390px] rounded-[42px] border-[10px] border-slate-950 bg-slate-950 p-2 shadow-[0_28px_70px_rgba(15,23,42,0.26)]">
                      <div className="mx-auto mb-2 h-6 w-28 rounded-full bg-slate-800" />
                      <div className="overflow-hidden rounded-[32px] border border-slate-800 bg-white">
                        <iframe
                          className="block h-[844px] w-full bg-white"
                          onLoad={() => {
                            mobilePreviewFrameRef.current?.contentWindow?.postMessage(
                              {
                                type: "dashboard-preview:update",
                                page: previewPage,
                              },
                              window.location.origin,
                            );
                          }}
                          ref={mobilePreviewFrameRef}
                          src="/dashboard/preview"
                          title="Apercu telephone reel"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mx-auto max-w-[1240px] overflow-hidden rounded-[30px] border border-slate-300 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.16)] transition-all duration-300">
                    <PageLocalizationProvider value={localizationValue}>
                      <PageInlineEditorProvider
                        value={{
                          enabled: false,
                          editMode: false,
                          toggleEditMode: () => undefined,
                          activeField: null,
                          openEditor: () => undefined,
                          closeEditor: () => undefined,
                          saveField: async () => undefined,
                          isSaving: false,
                          saveError: null,
                          lastSavedAt: null,
                        }}
                      >
                        <div
                          className="page-shell min-h-[780px]"
                          dir={direction}
                          lang={activeLocale}
                          style={previewStyle}
                        >
                          {previewPage.sections.map((section, index) => (
                            <div
                              className={cx(
                                "group relative rounded-[30px] transition",
                                selectedSectionIndex === index
                                  ? "ring-4 ring-blue-500/85 ring-offset-4 ring-offset-transparent"
                                  : "hover:ring-2 hover:ring-blue-300/70 hover:ring-offset-2 hover:ring-offset-transparent",
                              )}
                              key={`${section.type}-${index}`}
                            >
                              <button
                                aria-label={`Selectionner ${getSectionLabel(section.type)}`}
                                className="absolute inset-0 z-20 rounded-[30px]"
                                onClick={() => setSelectedSectionIndex(index)}
                                type="button"
                              />
                              <div className="pointer-events-none absolute left-4 top-4 z-30 flex max-w-[calc(100%-32px)] items-center gap-2 opacity-0 transition group-hover:opacity-100">
                                <span className="rounded-full bg-slate-950 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white shadow-lg">
                                  {getSectionLabel(section.type)}
                                </span>
                                <span className="rounded-full bg-white/92 px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm">
                                  Bloc {index + 1}
                                </span>
                              </div>
                              <div className="absolute right-4 top-4 z-30 flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
                                <button
                                  className="rounded-full border border-white/70 bg-white/92 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-white"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openLibraryAt(index);
                                  }}
                                  type="button"
                                >
                                  + avant
                                </button>
                                <button
                                  className="rounded-full border border-white/70 bg-white/92 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-white"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openLibraryAt(index + 1);
                                  }}
                                  type="button"
                                >
                                  + apres
                                </button>
                                <button
                                  className="rounded-full border border-white/70 bg-white/92 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-white"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    moveSection(index, index - 1);
                                  }}
                                  type="button"
                                >
                                  Monter
                                </button>
                                <button
                                  className="rounded-full border border-white/70 bg-white/92 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-white"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    moveSection(index, index + 1);
                                  }}
                                  type="button"
                                >
                                  Descendre
                                </button>
                                <button
                                  className="rounded-full border border-white/70 bg-white/92 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-white"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    duplicateSection(index);
                                  }}
                                  type="button"
                                >
                                  Dupliquer
                                </button>
                                <button
                                  className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 shadow-sm transition hover:bg-rose-100"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    deleteSection(index);
                                  }}
                                  type="button"
                                >
                                  Supprimer
                                </button>
                              </div>
                              {renderSection(section, index)}
                            </div>
                          ))}
                        </div>
                      </PageInlineEditorProvider>
                    </PageLocalizationProvider>
                  </div>
                )}
              </div>
            </Panel>
          </section>

          <aside className="grid gap-4 self-start xl:sticky xl:top-[124px]">
            {selectedSection ? (
              <>
                <Panel eyebrow="Bloc selectionne" title={getSectionLabel(selectedSection.type)}>
                  <div className="grid gap-4">
                    <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">Resume</p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {getSectionSummary(selectedSection, activeLocale, supportedLocales)}
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                      <button
                        className="inline-flex h-11 items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                        onClick={() => openLibraryAt(selectedSectionIndex ?? 0)}
                        type="button"
                      >
                        Ajouter avant ce bloc
                      </button>
                      <button
                        className="inline-flex h-11 items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                        onClick={() => openLibraryAt((selectedSectionIndex ?? 0) + 1)}
                        type="button"
                      >
                        Ajouter apres ce bloc
                      </button>
                      <button
                        className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                        onClick={() => duplicateSection(selectedSectionIndex ?? 0)}
                        type="button"
                      >
                        Dupliquer ce bloc
                      </button>
                      <button
                        className="inline-flex h-11 items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                        onClick={() => deleteSection(selectedSectionIndex ?? 0)}
                        type="button"
                      >
                        Supprimer ce bloc
                      </button>
                    </div>

                    {selectedAllowedVariants.length > 0 ? (
                      <label className="grid gap-2">
                        <span className="text-sm font-semibold text-slate-800">Presentation</span>
                        <select
                          className="h-12 rounded-[18px] border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-400"
                          onChange={(event) =>
                            setDraftPage((current) => {
                              const nextPage = clonePage(current);
                              if (selectedSectionIndex !== null) {
                                nextPage.sections[selectedSectionIndex].variant = event.target.value;
                              }
                              return nextPage;
                            })
                          }
                          value={selectedSection.variant ?? ""}
                        >
                          <option value="">Standard</option>
                          {selectedAllowedVariants.map((variant) => (
                            <option key={variant} value={variant}>
                              {variant}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                      <button
                        className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                        onClick={() => moveSection(selectedSectionIndex ?? 0, (selectedSectionIndex ?? 0) - 1)}
                        type="button"
                      >
                        Monter ce bloc
                      </button>
                      <button
                        className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                        onClick={() => moveSection(selectedSectionIndex ?? 0, (selectedSectionIndex ?? 0) + 1)}
                        type="button"
                      >
                        Descendre ce bloc
                      </button>
                    </div>
                  </div>
                </Panel>

                <Panel eyebrow="Contenu" title="Textes rapides">
                  {sectionTextFields.length > 0 ? (
                    <div className="grid gap-3">
                      {sectionTextFields.map((field) => (
                        <label className="grid gap-2" key={field.path.join("-")}>
                          <span className="text-sm font-semibold text-slate-800">{field.label}</span>
                          <textarea
                            className="min-h-[90px] rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
                            onChange={(event) => setFieldValue(field.path, event.target.value)}
                            value={field.value}
                          />
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[20px] border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm leading-6 text-slate-500">
                      Ce bloc n'a pas encore de texte simple detecte dans ce premier niveau d'edition.
                    </div>
                  )}
                </Panel>

                <Panel eyebrow="Visuels" title="Liens d'images">
                  {sectionImageFields.length > 0 ? (
                    <div className="grid gap-3">
                      {uploadError ? (
                        <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                          {uploadError}
                        </div>
                      ) : null}
                      {sectionImageFields.map((field) => (
                        <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4" key={field.path.join("-")}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <span className="text-sm font-semibold text-slate-800">{field.label}</span>
                              <p className="mt-1 text-xs leading-5 text-slate-500">
                                Choisis un visuel deja present ou colle un nouveau lien.
                              </p>
                            </div>
                          </div>
                          <div className="mt-4 overflow-hidden rounded-[20px] border border-slate-200 bg-white">
                            {field.value ? (
                              <img
                                alt={field.label}
                                className="h-44 w-full object-cover"
                                src={normalizeImageSource(field.value)}
                              />
                            ) : (
                              <div className="grid h-44 place-items-center bg-[linear-gradient(135deg,#eff6ff,#f8fafc)] px-6 text-center text-sm text-slate-500">
                                Aucun visuel selectionne pour le moment.
                              </div>
                            )}
                          </div>
                          <label className="mt-4 grid gap-2">
                            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                              Lien du visuel
                            </span>
                            <input
                              className="h-12 rounded-[18px] border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-400"
                              onChange={(event) => setFieldValue(field.path, event.target.value)}
                              value={field.value}
                            />
                          </label>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <label className="cursor-pointer rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300">
                              {uploadingFieldKey === field.path.join("-") ? "Envoi en cours..." : "Envoyer une image"}
                              <input
                                accept="image/png,image/jpeg,image/webp,image/gif"
                                className="hidden"
                                disabled={uploadingFieldKey !== null}
                                onChange={async (event) => {
                                  const file = event.target.files?.[0];
                                  if (file) {
                                    await uploadImage(file, field.path);
                                  }
                                  event.currentTarget.value = "";
                                }}
                                type="file"
                              />
                            </label>
                            {suggestedImages.get(field.path.join("-"))?.[0] ? (
                              <button
                                className="rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                                onClick={() =>
                                  setFieldValue(
                                    field.path,
                                    suggestedImages.get(field.path.join("-"))?.[0]?.src ?? field.value,
                                  )
                                }
                                type="button"
                              >
                                Utiliser la meilleure suggestion
                              </button>
                            ) : null}
                            <button
                              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300"
                              onClick={() => setFieldValue(field.path, "")}
                              type="button"
                            >
                              Effacer le visuel
                            </button>
                          </div>
                          {suggestedImages.get(field.path.join("-"))?.length ? (
                            <div className="mt-4">
                              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                                Suggestions disponibles
                              </p>
                              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                {suggestedImages.get(field.path.join("-"))?.map((suggestion) => (
                                  <button
                                    className={cx(
                                      "overflow-hidden rounded-[20px] border bg-white text-left transition hover:-translate-y-0.5 hover:border-slate-300",
                                      field.value === suggestion.src
                                        ? "border-blue-400 shadow-[0_14px_30px_rgba(59,130,246,0.16)]"
                                        : "border-slate-200",
                                    )}
                                    key={suggestion.src}
                                    onClick={() => setFieldValue(field.path, suggestion.src)}
                                    type="button"
                                  >
                                    <img
                                      alt={getImageCaption(suggestion.src)}
                                      className="h-28 w-full object-cover"
                                      src={suggestion.src}
                                    />
                                    <div className="p-3">
                                      <p className="line-clamp-2 text-sm font-semibold text-slate-900">
                                        {getImageCaption(suggestion.src)}
                                      </p>
                                      <p className="mt-1 truncate text-xs text-slate-500">{suggestion.src}</p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[20px] border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm leading-6 text-slate-500">
                      Aucun visuel detecte sur ce bloc pour l'instant.
                    </div>
                  )}
                </Panel>

                {repeatableCollections.map((collection) => {
                  const collectionPath =
                    selectedSectionIndex === null
                      ? []
                      : ["sections", selectedSectionIndex, "props", ...collection.path];
                  const items = getValueAtPath(draftPage, collectionPath);
                  const arrayItems = Array.isArray(items) ? items : [];

                  return (
                    <Panel eyebrow="Elements repetes" key={collection.id} title={collection.label}>
                      <div className="grid gap-3">
                        <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                          {collection.description}
                        </div>
                        <button
                          className="inline-flex h-11 items-center justify-center rounded-full border border-slate-950 bg-slate-950 px-4 text-sm font-semibold !text-white transition hover:bg-black hover:!text-white"
                          onClick={() => addCollectionItem(collectionPath, collection.createItem)}
                          type="button"
                        >
                          Ajouter un element
                        </button>
                        {collection.fields.some((field) => field.key === "src") ? (
                          <button
                            className="inline-flex h-11 items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                            onClick={() => fillImageCollection(collectionPath)}
                            type="button"
                          >
                            Remplir avec des visuels disponibles
                          </button>
                        ) : null}
                        {arrayItems.length > 0 ? (
                          arrayItems.map((item, itemIndex) => {
                            const itemRecord =
                              item && typeof item === "object" && !Array.isArray(item)
                                ? (item as Record<string, unknown>)
                                : {};
                            const summaryValue =
                              collection.fields
                                .map((field) => itemRecord[field.key])
                                .find((value) => typeof value === "string" && value.trim().length > 0) ?? `Element ${itemIndex + 1}`;

                            return (
                              <div
                                className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4"
                                key={`${collection.id}-${itemIndex}`}
                              >
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                                      Element {itemIndex + 1}
                                    </p>
                                    <p className="mt-1 text-sm font-bold text-slate-900">
                                      {typeof summaryValue === "string" ? summaryValue : `Element ${itemIndex + 1}`}
                                    </p>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300"
                                      onClick={() => moveCollectionItem(collectionPath, itemIndex, itemIndex - 1)}
                                      type="button"
                                    >
                                      Monter
                                    </button>
                                    <button
                                      className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300"
                                      onClick={() => moveCollectionItem(collectionPath, itemIndex, itemIndex + 1)}
                                      type="button"
                                    >
                                      Descendre
                                    </button>
                                    <button
                                      className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300"
                                      onClick={() => duplicateCollectionItem(collectionPath, itemIndex)}
                                      type="button"
                                    >
                                      Dupliquer
                                    </button>
                                    <button
                                      className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                                      onClick={() => removeCollectionItem(collectionPath, itemIndex)}
                                      type="button"
                                    >
                                      Supprimer
                                    </button>
                                  </div>
                                </div>

                                <div className="mt-4 grid gap-3">
                                  {"src" in itemRecord ? (
                                    <label className="cursor-pointer rounded-full border border-slate-200 bg-white px-3 py-2 text-center text-xs font-semibold text-slate-700 transition hover:border-slate-300">
                                      {uploadingFieldKey === [...collectionPath, itemIndex, "src"].join("-")
                                        ? "Envoi en cours..."
                                        : "Envoyer une image pour cet element"}
                                      <input
                                        accept="image/png,image/jpeg,image/webp,image/gif"
                                        className="hidden"
                                        disabled={uploadingFieldKey !== null}
                                        onChange={async (event) => {
                                          const file = event.target.files?.[0];
                                          if (file) {
                                            await uploadImage(file, [...collectionPath, itemIndex, "src"]);
                                          }
                                          event.currentTarget.value = "";
                                        }}
                                        type="file"
                                      />
                                    </label>
                                  ) : null}
                                  {("src" in itemRecord && typeof itemRecord.src === "string") || ("alt" in itemRecord && typeof itemRecord.alt === "string") ? (
                                    <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-white">
                                      {typeof itemRecord.src === "string" && itemRecord.src.trim() ? (
                                        <img
                                          alt={typeof itemRecord.alt === "string" ? itemRecord.alt : `Element ${itemIndex + 1}`}
                                          className="h-36 w-full object-cover"
                                          src={itemRecord.src}
                                        />
                                      ) : (
                                        <div className="grid h-36 place-items-center bg-[linear-gradient(135deg,#eff6ff,#f8fafc)] px-6 text-center text-sm text-slate-500">
                                          Ajoute un visuel pour cet element.
                                        </div>
                                      )}
                                    </div>
                                  ) : null}
                                  {collection.fields.map((field) => {
                                    const fieldPath = [...collectionPath, itemIndex, field.key];
                                    const fieldValue = itemRecord[field.key];

                                    if (field.kind === "switch") {
                                      return (
                                        <label className="flex items-center justify-between gap-3" key={fieldPath.join("-")}>
                                          <span className="text-sm font-semibold text-slate-800">{field.label}</span>
                                          <button
                                            className={cx(
                                              "inline-flex h-10 min-w-[130px] items-center justify-center rounded-full px-4 text-sm font-semibold transition",
                                              fieldValue
                                                ? "bg-emerald-100 text-emerald-700"
                                                : "border border-slate-200 bg-white text-slate-700",
                                            )}
                                            onClick={() => setGenericValue(fieldPath, !Boolean(fieldValue))}
                                            type="button"
                                          >
                                            {fieldValue ? "Oui" : "Non"}
                                          </button>
                                        </label>
                                      );
                                    }

                                    if (field.kind === "select") {
                                      return (
                                        <label className="grid gap-2" key={fieldPath.join("-")}>
                                          <span className="text-sm font-semibold text-slate-800">{field.label}</span>
                                          <select
                                            className="h-12 rounded-[18px] border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-400"
                                            onChange={(event) => setGenericValue(fieldPath, event.target.value)}
                                            value={typeof fieldValue === "string" ? fieldValue : ""}
                                          >
                                            {(field.options ?? []).map((option) => (
                                              <option key={option} value={option}>
                                                {option}
                                              </option>
                                            ))}
                                          </select>
                                        </label>
                                      );
                                    }

                                    if (field.kind === "textarea") {
                                      return (
                                        <label className="grid gap-2" key={fieldPath.join("-")}>
                                          <span className="text-sm font-semibold text-slate-800">{field.label}</span>
                                          <textarea
                                            className="min-h-[100px] rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
                                            onChange={(event) => setGenericValue(fieldPath, event.target.value)}
                                            value={typeof fieldValue === "string" ? fieldValue : ""}
                                          />
                                        </label>
                                      );
                                    }

                                    if (field.kind === "number") {
                                      return (
                                        <label className="grid gap-2" key={fieldPath.join("-")}>
                                          <span className="text-sm font-semibold text-slate-800">{field.label}</span>
                                          <input
                                            className="h-12 rounded-[18px] border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
                                            onChange={(event) =>
                                              setGenericValue(
                                                fieldPath,
                                                event.target.value === "" ? 0 : Number(event.target.value),
                                              )
                                            }
                                            type="number"
                                            value={typeof fieldValue === "number" ? fieldValue : 0}
                                          />
                                        </label>
                                      );
                                    }

                                    return (
                                      <label className="grid gap-2" key={fieldPath.join("-")}>
                                        <span className="text-sm font-semibold text-slate-800">{field.label}</span>
                                        <input
                                          className="h-12 rounded-[18px] border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
                                          onChange={(event) => setGenericValue(fieldPath, event.target.value)}
                                          value={typeof fieldValue === "string" ? fieldValue : ""}
                                        />
                                      </label>
                                    );
                                  })}

                                  {"src" in itemRecord ? (
                                    <div className="grid gap-3 sm:grid-cols-2">
                                      {getImageSuggestions(
                                        imageLibrary,
                                        draftPage.slug,
                                        typeof itemRecord.src === "string" ? itemRecord.src : undefined,
                                        6,
                                      ).map((suggestion) => (
                                        <button
                                          className={cx(
                                            "overflow-hidden rounded-[18px] border bg-white text-left transition hover:-translate-y-0.5 hover:border-slate-300",
                                            itemRecord.src === suggestion.src
                                              ? "border-blue-400 shadow-[0_14px_30px_rgba(59,130,246,0.16)]"
                                              : "border-slate-200",
                                          )}
                                          key={`${collection.id}-${itemIndex}-${suggestion.src}`}
                                          onClick={() =>
                                            setGenericValue([...collectionPath, itemIndex, "src"], suggestion.src)
                                          }
                                          type="button"
                                        >
                                          <img
                                            alt={getImageCaption(suggestion.src)}
                                            className="h-24 w-full object-cover"
                                            src={suggestion.src}
                                          />
                                          <div className="p-3">
                                            <p className="truncate text-xs font-semibold text-slate-700">
                                              {getImageCaption(suggestion.src)}
                                            </p>
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="rounded-[20px] border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm leading-6 text-slate-500">
                            Aucun element pour le moment dans cette partie.
                          </div>
                        )}
                      </div>
                    </Panel>
                  );
                })}
              </>
            ) : null}

            <Panel eyebrow="Couleurs et page" title="Style general">
              <div className="grid gap-4">
                <div className="rounded-[20px] border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800">
                  Les couleurs se changent ici a tout moment, meme quand un bloc est selectionne.
                </div>

                <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Palette prete a l'emploi</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Retrouve ici les memes ambiances couleur que dans la creation.
                      </p>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                      {activePalette ? activePalette.label : "Aucune palette choisie"}
                    </span>
                  </div>
                  <div className="mt-4 max-h-[520px] space-y-4 overflow-y-auto pr-1">
                    {paletteGroups.map((group) => (
                      <div key={group.category}>
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-slate-900">{group.category}</p>
                            <p className="text-xs text-slate-500">{group.description}</p>
                          </div>
                          <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-slate-500">
                            {group.palettes.length} palettes
                          </span>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {group.palettes.map((palette) => (
                            <PaletteCard
                              key={palette.value}
                              onClick={() => applyPalette(palette)}
                              palette={palette}
                              selected={activePalette?.value === palette.value}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-800">Nom de la page</span>
                  <input
                    className="h-12 rounded-[18px] border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
                    onChange={(event) => setFieldValue(["title"], event.target.value)}
                    value={
                      isLocalizedTextRecord(draftPage.title)
                        ? pickLocalizedText(draftPage.title, activeLocale, supportedLocales)
                        : String(draftPage.title ?? "")
                    }
                  />
                </label>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-800">Langue affichee</span>
                    <select
                      className="h-12 rounded-[18px] border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-400"
                      onChange={(event) => setActiveLocale(event.target.value)}
                      value={activeLocale}
                    >
                      {supportedLocales.map((locale) => (
                        <option key={locale} value={locale}>
                          {locale.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-800">Sens de lecture</span>
                    <select
                      className="h-12 rounded-[18px] border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-400"
                      onChange={(event) =>
                        setDraftPage((current) => {
                          const nextPage = clonePage(current);
                          nextPage.localization = {
                            ...(nextPage.localization ?? {}),
                            direction: event.target.value as "ltr" | "rtl",
                            isRTL: event.target.value === "rtl",
                          };
                          return nextPage;
                        })
                      }
                      value={draftPage.localization?.direction ?? "ltr"}
                    >
                      <option value="ltr">De gauche a droite</option>
                      <option value="rtl">De droite a gauche</option>
                    </select>
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-800">Couleur principale</span>
                    <input
                      className="h-12 w-full rounded-[18px] border border-slate-200 bg-white px-2"
                      onChange={(event) => updateThemeColor("primaryColor", event.target.value)}
                      type="color"
                      value={getColorValue(draftPage.theme?.primaryColor)}
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-800">Couleur secondaire</span>
                    <input
                      className="h-12 w-full rounded-[18px] border border-slate-200 bg-white px-2"
                      onChange={(event) => updateThemeColor("secondaryColor", event.target.value)}
                      type="color"
                      value={getColorValue(draftPage.theme?.secondaryColor ?? draftPage.theme?.primaryColor)}
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-800">Accent</span>
                    <input
                      className="h-12 w-full rounded-[18px] border border-slate-200 bg-white px-2"
                      onChange={(event) => updateThemeColor("accentColor", event.target.value)}
                      type="color"
                      value={getColorValue(draftPage.theme?.accentColor ?? draftPage.theme?.primaryColor)}
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-800">Fond</span>
                    <input
                      className="h-12 w-full rounded-[18px] border border-slate-200 bg-white px-2"
                      onChange={(event) => updateThemeColor("backgroundColor", event.target.value)}
                      type="color"
                      value={getColorValue(draftPage.theme?.backgroundColor ?? "#ffffff")}
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-800">Texte principal</span>
                    <input
                      className="h-12 w-full rounded-[18px] border border-slate-200 bg-white px-2"
                      onChange={(event) => updateThemeColor("textColor", event.target.value)}
                      type="color"
                      value={getColorValue(draftPage.theme?.textColor ?? "#111827")}
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-800">Texte secondaire</span>
                    <input
                      className="h-12 w-full rounded-[18px] border border-slate-200 bg-white px-2"
                      onChange={(event) => updateThemeColor("mutedTextColor", event.target.value)}
                      type="color"
                      value={getColorValue(draftPage.theme?.mutedTextColor ?? "#6b7280")}
                    />
                  </label>
                </div>
              </div>
            </Panel>
          </aside>
        </div>
      </div>
    </main>
  );
}
