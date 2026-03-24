import { writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { generatePageWithImage } from "@/lib/openai-page-generator";
import { normalizePagePayloadForRuntime, validatePagePayload, type PagePayload } from "@/lib/page-dsl";

export const runtime = "nodejs";

interface ThemeConstraint {
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

function sanitizePromptInput(value: unknown) {
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

function sanitizeThemeConstraint(value: unknown): ThemeConstraint | null {
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

function applyThemeConstraint(page: PagePayload, themeConstraint: ThemeConstraint | null) {
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
      surfaceColor: darkBackground ? themeConstraint.palette.primary : "#ffffff",
      surfaceAltColor: darkBackground ? "#1f2937" : themeConstraint.palette.muted,
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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { prompt?: unknown; themeConstraint?: unknown };
    const prompt = sanitizePromptInput(body.prompt);
    const themeConstraint = sanitizeThemeConstraint(body.themeConstraint);

    if (!prompt) {
      return NextResponse.json(
        { error: "Le prompt est requis." },
        { status: 400 },
      );
    }

    const result = await generatePageWithImage(prompt);
    const page = applyThemeConstraint(result.page, themeConstraint);
    const targetPath = path.join(process.cwd(), "data", "page.json");

    await writeFile(targetPath, `${JSON.stringify(page, null, 2)}\n`, "utf8");

    return NextResponse.json({
      success: true,
      message: "La page et son image ont ete generees puis sauvegardees dans data/page.json.",
      page,
      images: result.images,
      imageDisplay: result.imageDisplay,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Une erreur inconnue est survenue pendant la generation.",
      },
      { status: 500 },
    );
  }
}
