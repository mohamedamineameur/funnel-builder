"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Box, CircularProgress, CssBaseline, Paper, ThemeProvider, Typography, createTheme } from "@mui/material";
import { DynamicPageRenderer, type PageSection } from "@/component-registry";

interface PageTheme {
  name?: string;
  cornerStyle?: "sharp" | "balanced" | "rounded";
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  surfaceColor?: string;
  surfaceAltColor?: string;
  textColor?: string;
  mutedTextColor?: string;
  borderColor?: string;
  buttonTextColor?: string;
  successColor?: string;
  warningColor?: string;
}

interface PagePayload {
  slug: string;
  title: string;
  theme?: PageTheme;
  sections: PageSection[];
}

interface PageBuilderClientProps {
  endpoint: string;
}

function getCornerTokens(cornerStyle?: PageTheme["cornerStyle"]) {
  switch (cornerStyle) {
    case "sharp":
      return {
        themeRadius: 10,
        section: "18px",
        card: "12px",
        inner: "8px",
        button: "10px",
        chip: "10px",
      };
    case "rounded":
      return {
        themeRadius: 24,
        section: "32px",
        card: "24px",
        inner: "18px",
        button: "999px",
        chip: "999px",
      };
    default:
      return {
        themeRadius: 16,
        section: "24px",
        card: "18px",
        inner: "12px",
        button: "18px",
        chip: "18px",
      };
  }
}

export function PageBuilderClient({ endpoint }: PageBuilderClientProps) {
  const [page, setPage] = useState<PagePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPage() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(endpoint, {
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Impossible de charger la page (${response.status}).`);
        }

        const payload = (await response.json()) as PagePayload;

        if (isMounted) {
          setPage(payload);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Une erreur inconnue est survenue pendant le chargement.",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadPage();

    return () => {
      isMounted = false;
    };
  }, [endpoint]);

  const cornerTokens = useMemo(
    () => getCornerTokens(page?.theme?.cornerStyle),
    [page?.theme?.cornerStyle],
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: "light",
          primary: {
            main: page?.theme?.primaryColor ?? "#2563eb",
            contrastText: page?.theme?.buttonTextColor ?? "#ffffff",
          },
          secondary: {
            main: page?.theme?.secondaryColor ?? "#1d4ed8",
          },
          background: {
            default: page?.theme?.backgroundColor ?? "#f8fafc",
            paper: page?.theme?.surfaceColor ?? "#ffffff",
          },
          text: {
            primary: page?.theme?.textColor ?? "#0f172a",
            secondary: page?.theme?.mutedTextColor ?? "#475569",
          },
          divider: page?.theme?.borderColor ?? "#dbe4f0",
          success: {
            main: page?.theme?.successColor ?? "#166534",
          },
          warning: {
            main: page?.theme?.warningColor ?? "#c58b4e",
          },
        },
        shape: {
          borderRadius: cornerTokens.themeRadius,
        },
        typography: {
          fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          h1: {
            fontSize: "clamp(2.6rem, 5vw, 4.75rem)",
            lineHeight: 1.05,
            fontWeight: 800,
          },
          h2: {
            fontSize: "clamp(1.8rem, 3vw, 3rem)",
            lineHeight: 1.1,
            fontWeight: 700,
          },
          h3: {
            fontWeight: 700,
          },
          button: {
            textTransform: "none",
            fontWeight: 700,
          },
        },
      }),
    [cornerTokens.themeRadius, page],
  );

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box className="page-shell" sx={{ display: "grid", placeItems: "center", minHeight: "100vh", px: 2 }}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: "var(--radius-section)", border: "1px solid", borderColor: "divider", textAlign: "center" }}>
            <Box sx={{ display: "grid", justifyItems: "center", gap: 2 }}>
              <CircularProgress />
              <Typography variant="h4">Chargement de la page dynamique</Typography>
              <Typography color="text.secondary">
                Le JSON est en cours de recuperation puis sera rendu via le registre.
              </Typography>
            </Box>
          </Paper>
        </Box>
      </ThemeProvider>
    );
  }

  if (error) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box className="page-shell" sx={{ maxWidth: 960, mx: "auto", p: 4 }}>
          <Alert severity="error">
            <Typography variant="h6">Erreur de chargement</Typography>
            <Typography>{error}</Typography>
          </Alert>
        </Box>
      </ThemeProvider>
    );
  }

  if (!page) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box className="page-shell" sx={{ maxWidth: 960, mx: "auto", p: 4 }}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: "var(--radius-section)", border: "1px solid", borderColor: "divider" }}>
            <Typography gutterBottom variant="h4">
              Aucune page disponible
            </Typography>
            <Typography color="text.secondary">
              La source JSON n&apos;a retourne aucune section exploitable.
            </Typography>
          </Paper>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        className="page-shell"
        sx={{
          minHeight: "100vh",
          background: `linear-gradient(180deg, ${page.theme?.backgroundColor ?? "#f8fafc"} 0%, ${page.theme?.surfaceAltColor ?? "#eef4ff"} 100%)`,
          "--primary": page.theme?.primaryColor ?? "#2563eb",
          "--primary-dark": page.theme?.secondaryColor ?? page.theme?.primaryColor ?? "#1d4ed8",
          "--surface": page.theme?.surfaceColor ?? "#ffffff",
          "--surface-alt": page.theme?.surfaceAltColor ?? "#eef4ff",
          "--radius-section": cornerTokens.section,
          "--radius-card": cornerTokens.card,
          "--radius-inner": cornerTokens.inner,
          "--radius-button": cornerTokens.button,
          "--radius-chip": cornerTokens.chip,
        }}
      >
        <DynamicPageRenderer sections={page.sections} />
      </Box>
    </ThemeProvider>
  );
}
