"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { WorkspacePageShell } from "@/components/workspace-page-shell";
import { authorizedFetch } from "@/lib/client-api";

interface GenerateResponse {
  success?: boolean;
  message?: string;
  error?: string;
  page?: unknown;
  images?: Array<{ prompt?: string; alt?: string; target?: string }>;
}

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export default function PromptPage() {
  const { currentProject } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [generatedJson, setGeneratedJson] = useState("");
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  const promptLength = useMemo(() => prompt.trim().length, [prompt]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!prompt.trim()) {
      setError("Le prompt est requis.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await authorizedFetch("/api/generate-page", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const payload = (await response.json()) as GenerateResponse;

      if (!response.ok || !payload.success || !payload.page) {
        throw new Error(payload.error ?? "La generation a echoue.");
      }

      setSuccessMessage(payload.message ?? "La page a ete generee avec succes.");
      setGeneratedJson(JSON.stringify(payload.page, null, 2));
      setGeneratedImages(
        Array.isArray(payload.images)
          ? payload.images
              .map((image) => image.alt ?? image.prompt ?? image.target ?? "")
              .filter(Boolean)
          : [],
      );
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Une erreur inconnue est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <WorkspacePageShell>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.10),transparent_24%),radial-gradient(circle_at_top_right,rgba(15,23,42,0.08),transparent_26%),linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] py-8">
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

        <div className="mx-auto grid w-[min(1200px,calc(100%-32px))] gap-6 pt-16 xl:grid-cols-[minmax(0,1fr)_380px]">
          <form
            className="grid gap-6 rounded-[32px] border border-slate-200 bg-white/92 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur"
            onSubmit={handleSubmit}
          >
            <div className="space-y-4">
              <span className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white">
                Generation IA
              </span>
              <div>
                <h1 className="text-4xl font-black tracking-[-0.04em] text-slate-950">
                  Decris la page que tu veux generer
                </h1>
                <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                  Le resultat sera sauvegarde comme nouvelle version effective dans ton projet courant.
                </p>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Projet courant</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {currentProject?.name ?? "Projet principal"}
                  </p>
                </div>
                <div className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {promptLength} caracteres
                </div>
              </div>
            </div>

            <label className="grid gap-3">
              <span className="text-sm font-semibold text-slate-700">Prompt</span>
              <textarea
                className="min-h-[320px] rounded-[28px] border border-slate-200 bg-white px-5 py-4 text-sm leading-7 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Ex: Cree une landing page premium pour une application SaaS de gestion d'equipe, en francais, avec hero, benefits, pricing, FAQ et un appel a l'action tres visible."
                value={prompt}
              />
            </label>

            <div className="flex flex-wrap gap-3">
              {[
                "Landing page SaaS premium en francais avec hero, pricing et FAQ.",
                "Page en arabe, lecture de droite a gauche, avec hero, temoignages et formulaire.",
                "Page d'agence moderne en anglais avec sections services, process et contact.",
              ].map((suggestion) => (
                <button
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-white"
                  key={suggestion}
                  onClick={() => setPrompt(suggestion)}
                  type="button"
                >
                  Exemple
                </button>
              ))}
            </div>

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

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50"
                href="/"
              >
                Voir la page publique
              </Link>
              <button
                className={cx(
                  "inline-flex min-h-12 items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(37,99,235,0.28)] transition",
                  loading
                    ? "cursor-wait bg-slate-400"
                    : "bg-[linear-gradient(135deg,#0f172a,#2563eb)] hover:-translate-y-0.5",
                )}
                disabled={loading}
                type="submit"
              >
                {loading ? "Generation en cours..." : "Generer la page"}
              </button>
            </div>
          </form>

          <div className="grid gap-6 self-start xl:sticky xl:top-6">
            <div className="rounded-[32px] border border-slate-200 bg-white/92 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Conseils</p>
              <ul className="mt-4 grid gap-3 text-sm leading-6 text-slate-600">
                <li>Precise le type de business, la langue et les sections souhaitees.</li>
                <li>Indique le ton, le style visuel ou les contraintes de marque si besoin.</li>
                <li>Chaque generation cree une nouvelle version de page dans ton historique.</li>
              </ul>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white/92 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Sortie JSON</p>
              {generatedJson ? (
                <pre className="mt-4 max-h-[420px] overflow-auto rounded-[24px] bg-slate-950 p-4 text-xs leading-6 text-slate-100">
                  {generatedJson}
                </pre>
              ) : (
                <p className="mt-4 text-sm leading-6 text-slate-500">
                  Le JSON genere apparaitra ici apres la creation.
                </p>
              )}
            </div>

            {generatedImages.length > 0 ? (
              <div className="rounded-[32px] border border-slate-200 bg-white/92 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur">
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Images preparees</p>
                <ul className="mt-4 grid gap-3 text-sm leading-6 text-slate-600">
                  {generatedImages.map((imageLabel) => (
                    <li key={imageLabel}>{imageLabel}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </WorkspacePageShell>
  );
}
