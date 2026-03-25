import { readFile } from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import { loadRuntimePage } from "@/lib/load-runtime-page";

export const dynamic = "force-dynamic";

interface RawPageDefinition {
  slug?: string;
  title?: unknown;
  theme?: {
    name?: string;
    cornerStyle?: string;
    palette?: {
      primary?: string;
      secondary?: string;
      background?: string;
      textPrimary?: string;
      accent?: string;
    };
  };
  localization?: {
    locale?: string;
    direction?: string;
    supportedLocales?: string[];
    translationsEnabled?: boolean;
  };
  sections?: Array<{
    type?: string;
    variant?: string;
    props?: Record<string, unknown>;
  }>;
}

function resolveTitle(value: unknown) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const entries = Object.values(value as Record<string, unknown>).filter(
      (item): item is string => typeof item === "string" && item.trim().length > 0,
    );
    return entries[0] ?? "Sans titre";
  }
  return "Sans titre";
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
    case "comparison":
      return "Comparaison";
    case "steps":
      return "Etapes";
    case "cta_banner":
      return "Bandeau d'action";
    default:
      return "Bloc";
  }
}

function getDirectionLabel(direction?: string) {
  return direction === "rtl" ? "De droite a gauche" : "De gauche a droite";
}

function getLanguageLabel(locale?: string) {
  switch ((locale ?? "").toLowerCase()) {
    case "fr":
      return "Francais";
    case "en":
      return "Anglais";
    case "ar":
      return "Arabe";
    case "es":
      return "Espagnol";
    case "de":
      return "Allemand";
    case "it":
      return "Italien";
    case "pt":
      return "Portugais";
    default:
      return locale?.trim() ? locale : "Francais";
  }
}

function getCornerStyleLabel(cornerStyle?: string) {
  switch ((cornerStyle ?? "").toLowerCase()) {
    case "sharp":
      return "Coins nets";
    case "rounded":
      return "Coins tres arrondis";
    case "balanced":
      return "Coins equilibres";
    default:
      return "Coins equilibres";
  }
}

function getThemeDisplayName(themeName?: string) {
  if (!themeName || themeName === "generated_theme" || themeName === "custom_user_palette") {
    return "Style personnalise";
  }

  return themeName.replace(/[_-]+/g, " ");
}

function countImageSources(value: unknown): number {
  if (!value) return 0;
  if (Array.isArray(value)) {
    return value.reduce((sum, item) => sum + countImageSources(item), 0);
  }
  if (typeof value === "object") {
    return Object.entries(value).reduce((sum, [key, nested]) => {
      if (key === "src" && typeof nested === "string" && nested.trim()) {
        return sum + 1;
      }
      return sum + countImageSources(nested);
    }, 0);
  }
  return 0;
}

function countTextNodes(value: unknown): number {
  if (typeof value === "string") {
    return value.trim() ? 1 : 0;
  }
  if (Array.isArray(value)) {
    return value.reduce((sum, item) => sum + countTextNodes(item), 0);
  }
  if (value && typeof value === "object") {
    return Object.values(value).reduce((sum, nested) => sum + countTextNodes(nested), 0);
  }
  return 0;
}

async function loadRawPageDefinition() {
  const source = await readFile(path.join(process.cwd(), "data", "page.json"), "utf8");
  return JSON.parse(source) as RawPageDefinition;
}

function ActionCard({
  href,
  title,
  description,
  accent,
  cta,
}: {
  href: string;
  title: string;
  description: string;
  accent: string;
  cta: string;
}) {
  return (
    <Link
      className="group rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(15,23,42,0.12)]"
      href={href}
    >
      <div
        className="inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white"
        style={{ background: accent }}
      >
        Action
      </div>
      <h2 className="mt-4 text-2xl font-bold text-slate-950">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
      <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 transition group-hover:gap-3">
        {cta}
        <span aria-hidden>&rarr;</span>
      </div>
    </Link>
  );
}

function StatCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{helper}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const [runtimePage, rawPage] = await Promise.all([loadRuntimePage(), loadRawPageDefinition()]);
  const sectionCount = runtimePage.sections.length;
  const localeCount = rawPage.localization?.supportedLocales?.length ?? 1;
  const imageCount = countImageSources(rawPage.sections ?? []);
  const editableTextCount = countTextNodes(rawPage);
  const title = resolveTitle(rawPage.title);
  const palette = rawPage.theme?.palette;
  const sectionEntries = rawPage.sections ?? [];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_28%),linear-gradient(180deg,#f8fbff_0%,#eef5ff_100%)] px-4 py-6 md:px-6 xl:px-8">
      <div className="mx-auto grid w-full max-w-[1520px] gap-6">
        <section className="overflow-hidden rounded-[36px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <div className="grid gap-8 p-6 lg:grid-cols-[1.25fr_0.9fr] lg:p-8 xl:p-10">
            <div>
              <div className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
                Espace de travail
              </div>
              <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
                Gere ta page depuis un seul endroit.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                Cree une nouvelle page, modifie le contenu facilement, verifie l'organisation actuelle et
                ouvre instantanement la version finale ou la version modifiable.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-950 bg-slate-950 px-5 py-3 text-sm font-semibold !text-white shadow-[0_16px_34px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-black hover:!text-white"
                  href="/prompt"
                >
                  Creer une nouvelle page
                </Link>
                <Link
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:border-slate-300"
                  href="/edition"
                >
                  Ouvrir la version modifiable
                </Link>
                <Link
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-white"
                  href="/"
                >
                  Voir la page finale
                </Link>
              </div>
            </div>

            <div className="rounded-[30px] border border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_55%,#2563eb_100%)] p-6 text-white shadow-[0_20px_55px_rgba(15,23,42,0.18)]">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-100/90">Page en cours</p>
              <h2 className="mt-3 text-2xl font-black">{title}</h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[22px] border border-white/12 bg-white/8 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-blue-100/75">Style</p>
                  <p className="mt-2 text-sm font-semibold">{getThemeDisplayName(rawPage.theme?.name)}</p>
                  <p className="mt-1 text-sm text-blue-100/80">{getCornerStyleLabel(rawPage.theme?.cornerStyle)}</p>
                </div>
                <div className="rounded-[22px] border border-white/12 bg-white/8 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-blue-100/75">Langue</p>
                  <p className="mt-2 text-sm font-semibold">{getLanguageLabel(rawPage.localization?.locale)}</p>
                  <p className="mt-1 text-sm text-blue-100/80">
                    {getDirectionLabel(rawPage.localization?.direction)} •{" "}
                    {rawPage.localization?.translationsEnabled ? "plusieurs langues disponibles" : "une seule langue"}
                  </p>
                </div>
              </div>
              {palette ? (
                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-100/75">Couleurs choisies</p>
                  <div className="mt-3 flex gap-3">
                    {[palette.primary, palette.secondary, palette.accent, palette.background].map((color, index) => (
                      <div
                        className="h-12 flex-1 rounded-2xl border border-white/20 shadow-inner"
                        key={`${color}-${index}`}
                        style={{ background: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard helper="Nombre total de blocs affiches sur la page." label="Blocs" value={`${sectionCount}`} />
          <StatCard helper="Nombre de langues prevues pour cette page." label="Langues" value={`${localeCount}`} />
          <StatCard helper="Nombre d'images utilisees dans la page." label="Images" value={`${imageCount}`} />
          <StatCard helper="Volume approximatif de textes a personnaliser." label="Textes" value={`${editableTextCount}`} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="grid gap-6">
            <div className="grid gap-4 md:grid-cols-3">
              <ActionCard
                accent="linear-gradient(135deg,#2563eb,#06b6d4)"
                cta="Ouvrir l'assistant"
                description="Lance une nouvelle creation en te laissant guider ou en decrivant librement ton besoin."
                href="/prompt"
                title="Creer"
              />
              <ActionCard
                accent="linear-gradient(135deg,#7c3aed,#ec4899)"
                cta="Modifier la page"
                description="Change les textes et certains visuels directement sur la page avec les icones de modification."
                href="/edition"
                title="Modifier visuellement"
              />
              <ActionCard
                accent="linear-gradient(135deg,#0f172a,#334155)"
                cta="Ouvrir la page"
                description="Verifie la version finale de la page, sans les outils de creation ni les icones de modification."
                href="/"
                title="Version finale"
              />
            </div>

            <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Organisation actuelle</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">Blocs de la page</h2>
                </div>
              </div>
              <div className="mt-6 grid gap-3">
                {sectionEntries.map((section, index) => (
                  <div
                    className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-slate-200 bg-slate-50/70 px-4 py-4"
                    key={`${section.type}-${index}`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-slate-900 text-sm font-bold text-white">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-slate-900">{getSectionLabel(section.type)}</p>
                        <p className="text-sm text-slate-500">
                          {section.variant ? `Style : ${section.variant}` : "Style standard"}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        {Object.keys(section.props ?? {}).length} reglages
                      </span>
                      <Link
                        className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-blue-700"
                        href="/edition"
                      >
                        Editer
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Configuration</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">Resume rapide</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Langues</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Langue principale: <strong>{rawPage.localization?.locale ?? "fr"}</strong>
                    <br />
                    Sens de lecture: <strong>{getDirectionLabel(rawPage.localization?.direction)}</strong>
                    <br />
                    Langues proposees:{" "}
                    <strong>{(rawPage.localization?.supportedLocales ?? [rawPage.localization?.locale ?? "fr"]).join(", ")}</strong>
                  </p>
                </div>
                <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Style</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Nom: <strong>{rawPage.theme?.name ?? "Style actuel"}</strong>
                    <br />
                    Coins: <strong>{rawPage.theme?.cornerStyle ?? "balanced"}</strong>
                    <br />
                    Primaire: <strong>{rawPage.theme?.palette?.primary ?? rawPage.theme?.palette?.secondary ?? "#2563eb"}</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 self-start xl:sticky xl:top-6">
            <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Apercu</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">Version finale</h2>
                </div>
                <Link
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white"
                  href="/"
                >
                  Ouvrir
                </Link>
              </div>
              <div className="mt-5 overflow-hidden rounded-[24px] border border-slate-200 bg-slate-950 shadow-inner">
                <iframe className="h-[720px] w-full bg-white" src="/" title="Apercu de la page" />
              </div>
            </div>

            <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Parcours conseille</p>
              <div className="mt-4 grid gap-3">
                {[
                  "1. Cree ta page avec l'assistant de creation.",
                  "2. Ouvre la version modifiable pour ajuster les textes et visuels.",
                  "3. Verifie ensuite la version finale comme la verront tes visiteurs.",
                ].map((step) => (
                  <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700" key={step}>
                    {step}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
