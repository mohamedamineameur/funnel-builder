import { normalizePagePayloadForRuntime, validatePagePayload, type PagePayload } from "@/lib/page-dsl";

export interface ThemeConstraint {
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

export interface LocalizationConstraint {
  locale?: string;
  direction?: "ltr" | "rtl";
  isRTL?: boolean;
  supportedLocales?: string[];
  translationContext?: string;
  translationsEnabled?: boolean;
}

export function sanitizePromptInput(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, 3000);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
}

function isLocaleString(value: unknown): value is string {
  return typeof value === "string" && /^[a-z]{2,3}([_-][a-zA-Z]{2,4})?$/.test(value.trim());
}

function normalizeLocale(value: string) {
  const [language, region] = value.trim().replace(/_/g, "-").split("-");
  return region ? `${language.toLowerCase()}-${region.toUpperCase()}` : language.toLowerCase();
}

function inferIsRtl(locale?: string) {
  if (!locale) return false;
  return ["ar", "fa", "he", "ur"].includes(normalizeLocale(locale).split("-")[0]);
}

function isDarkColor(value: string) {
  const normalized = value.length === 4
    ? `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`
    : value;
  const red = parseInt(normalized.slice(1, 3), 16);
  const green = parseInt(normalized.slice(3, 5), 16);
  const blue = parseInt(normalized.slice(5, 7), 16);
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;

  return luminance < 0.5;
}

export function sanitizeThemeConstraint(value: unknown): ThemeConstraint | null {
  if (!isObject(value) || !isObject(value.palette)) {
    return null;
  }

  const palette = value.palette;
  const primary = isHexColor(palette.primary) ? palette.primary : null;
  const secondary = isHexColor(palette.secondary) ? palette.secondary : null;
  const background = isHexColor(palette.background) ? palette.background : null;
  const textPrimary = isHexColor(palette.textPrimary) ? palette.textPrimary : null;
  const textSecondary = isHexColor(palette.textSecondary) ? palette.textSecondary : null;
  const accent = isHexColor(palette.accent) ? palette.accent : null;
  const muted = isHexColor(palette.muted) ? palette.muted : null;

  if (!primary || !secondary || !background || !textPrimary || !textSecondary || !accent || !muted) {
    return null;
  }

  return {
    name: typeof value.name === "string" ? value.name.trim().slice(0, 80) : undefined,
    cornerStyle:
      value.cornerStyle === "sharp" || value.cornerStyle === "balanced" || value.cornerStyle === "rounded"
        ? value.cornerStyle
        : undefined,
    palette: {
      primary,
      secondary,
      background,
      textPrimary,
      textSecondary,
      accent,
      muted,
    },
  };
}

export function sanitizeLocalizationConstraint(value: unknown): LocalizationConstraint | null {
  if (!isObject(value)) {
    return null;
  }

  const locale = isLocaleString(value.locale) ? normalizeLocale(value.locale) : undefined;
  const supportedLocales = Array.isArray(value.supportedLocales)
    ? Array.from(
        new Set(
          value.supportedLocales
            .filter((localeValue): localeValue is string => isLocaleString(localeValue))
            .map((localeValue) => normalizeLocale(localeValue)),
        ),
      )
    : locale
      ? [locale]
      : [];
  const inferredDirection =
    value.direction === "rtl" || value.direction === "ltr"
      ? value.direction
      : ((typeof value.isRTL === "boolean" ? value.isRTL : inferIsRtl(locale ?? supportedLocales[0])) ? "rtl" : "ltr");

  if (!locale && supportedLocales.length === 0 && typeof value.translationContext !== "string") {
    return null;
  }

  return {
    ...(locale ? { locale } : {}),
    ...(supportedLocales.length > 0 ? { supportedLocales } : {}),
    ...(typeof value.translationContext === "string" && value.translationContext.trim()
      ? { translationContext: value.translationContext.trim().slice(0, 500) }
      : {}),
    direction: inferredDirection,
    isRTL: inferredDirection === "rtl",
    translationsEnabled:
      typeof value.translationsEnabled === "boolean" ? value.translationsEnabled : supportedLocales.length > 1,
  };
}

export function applyThemeConstraint(page: PagePayload, themeConstraint: ThemeConstraint | null) {
  if (!themeConstraint) {
    return page;
  }

  const darkBackground = isDarkColor(themeConstraint.palette.background);
  const primaryIsDark = isDarkColor(themeConstraint.palette.primary);

  const normalized = normalizePagePayloadForRuntime({
    ...page,
    theme: {
      name: themeConstraint.name ?? page.theme?.name,
      cornerStyle: themeConstraint.cornerStyle ?? page.theme?.cornerStyle,
      primaryColor: themeConstraint.palette.primary,
      secondaryColor: themeConstraint.palette.secondary,
      accentColor: themeConstraint.palette.accent,
      backgroundColor: themeConstraint.palette.background,
      surfaceColor: darkBackground ? "#111827" : "#ffffff",
      surfaceAltColor: darkBackground ? themeConstraint.palette.muted : themeConstraint.palette.muted,
      textColor: themeConstraint.palette.textPrimary,
      mutedTextColor: themeConstraint.palette.textSecondary,
      borderColor: darkBackground ? "#334155" : "#dbe4f0",
      buttonTextColor: primaryIsDark ? "#ffffff" : "#0f172a",
      successColor: page.theme?.successColor ?? "#15803d",
      warningColor: page.theme?.warningColor ?? "#d97706",
      ...(themeConstraint.name ? { name: themeConstraint.name } : {}),
      ...(themeConstraint.cornerStyle ? { cornerStyle: themeConstraint.cornerStyle } : {}),
      palette: themeConstraint.palette,
    },
  });
  const validation = validatePagePayload(normalized);

  if (!validation.success) {
    throw new Error(`La palette imposee produit un theme invalide: ${validation.errors.join(" | ")}`);
  }

  return validation.data;
}

export function applyLocalizationConstraint(page: PagePayload, localizationConstraint: LocalizationConstraint | null) {
  if (!localizationConstraint) {
    return page;
  }

  const normalized = normalizePagePayloadForRuntime({
    ...page,
    localization: {
      ...page.localization,
      ...localizationConstraint,
      direction: localizationConstraint.direction,
      isRTL: localizationConstraint.isRTL,
      translationsEnabled: localizationConstraint.translationsEnabled,
    },
  });
  const validation = validatePagePayload(normalized);

  if (!validation.success) {
    throw new Error(`La configuration de langue imposee est invalide: ${validation.errors.join(" | ")}`);
  }

  return validation.data;
}
