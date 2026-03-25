"use client";

import type { ElementType, ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type PageEditorPathSegment = string | number;

interface EditorFieldState {
  path: PageEditorPathSegment[];
  label: string;
  value: string;
  multiline?: boolean;
}

interface PageInlineEditorContextValue {
  enabled: boolean;
  editMode: boolean;
  toggleEditMode: () => void;
  activeField: EditorFieldState | null;
  openEditor: (field: EditorFieldState) => void;
  closeEditor: () => void;
  saveField: (nextValue: string) => Promise<void>;
  isSaving: boolean;
  saveError: string | null;
  lastSavedAt: number | null;
}

const defaultContextValue: PageInlineEditorContextValue = {
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
};

const PageInlineEditorContext = createContext<PageInlineEditorContextValue>(defaultContextValue);

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function PageInlineEditorProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: PageInlineEditorContextValue;
}) {
  return <PageInlineEditorContext.Provider value={value}>{children}</PageInlineEditorContext.Provider>;
}

export function usePageInlineEditor() {
  return useContext(PageInlineEditorContext);
}

function PencilIcon() {
  return (
    <svg aria-hidden className="h-4 w-4 drop-shadow-[0_0_10px_rgba(255,255,255,0.45)]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24">
      <path d="M12 20h9" />
      <path d="m16.5 3.5 4 4L7 21l-4 1 1-4L16.5 3.5Z" />
    </svg>
  );
}

export function InlineEditButton({
  path,
  label,
  value,
  multiline = false,
  className,
  alwaysVisible = false,
}: {
  path?: PageEditorPathSegment[];
  label: string;
  value: string;
  multiline?: boolean;
  className?: string;
  alwaysVisible?: boolean;
}) {
  const editor = usePageInlineEditor();

  if (!editor.enabled || !editor.editMode || !path) {
    return null;
  }

  return (
    <button
      aria-label={`Modifier ${label}`}
      className={cx(
        "relative z-[70] inline-flex h-10 w-10 pointer-events-auto items-center justify-center rounded-full border-2 border-fuchsia-300 bg-[linear-gradient(135deg,#ff00aa,#7c3aed_55%,#22d3ee)] text-white shadow-[0_0_0_3px_rgba(255,255,255,0.22),0_0_22px_rgba(217,70,239,0.72),0_0_38px_rgba(34,211,238,0.46)] transition duration-200 hover:-translate-y-1 hover:scale-110 hover:border-white hover:shadow-[0_0_0_4px_rgba(255,255,255,0.28),0_0_28px_rgba(217,70,239,0.92),0_0_54px_rgba(34,211,238,0.7)] focus-visible:scale-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-fuchsia-300/55",
        "before:absolute before:inset-[-6px] before:-z-10 before:animate-pulse before:rounded-full before:bg-[radial-gradient(circle,rgba(255,0,170,0.42)_0%,rgba(124,58,237,0.24)_48%,rgba(34,211,238,0)_78%)]",
        alwaysVisible
          ? "opacity-100"
          : "ml-2 scale-90 opacity-0 group-hover/page-edit:scale-100 group-hover/page-edit:opacity-100 focus:scale-100 focus:opacity-100",
        className,
      )}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        editor.openEditor({ path, label, value, multiline });
      }}
      type="button"
    >
      <PencilIcon />
    </button>
  );
}

export function EditableText<TTag extends ElementType = "span">({
  as,
  className,
  label,
  multiline = false,
  path,
  value,
}: {
  as?: TTag;
  className?: string;
  label: string;
  multiline?: boolean;
  path?: PageEditorPathSegment[];
  value: string;
}) {
  const Tag = (as ?? "span") as ElementType;
  const editor = usePageInlineEditor();
  const isEditable = Boolean(path && editor.enabled && editor.editMode);
  
  function openCurrentField() {
    if (!isEditable || !path) {
      return;
    }

    editor.openEditor({ path, label, value, multiline });
  }

  return (
    <Tag
      className={cx(
        className,
        isEditable ? "group/page-edit relative pr-12" : path ? "group/page-edit" : undefined,
        isEditable
          ? "relative cursor-pointer decoration-fuchsia-400/70 underline-offset-4 transition hover:decoration-2 hover:decoration-fuchsia-500"
          : undefined,
      )}
      onClick={isEditable ? (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        openCurrentField();
      } : undefined}
    >
      {value}
      <InlineEditButton
        className={isEditable ? "absolute right-0 top-1/2 ml-0 -translate-y-1/2" : undefined}
        label={label}
        multiline={multiline}
        path={path}
        value={value}
      />
    </Tag>
  );
}

export function PageInlineEditorDock() {
  const { enabled, editMode, toggleEditMode, isSaving, saveError, lastSavedAt } = usePageInlineEditor();
  const savedLabel = useMemo(() => {
    if (!lastSavedAt) return "Aucune modification enregistree";

    return `Enregistre a ${new Date(lastSavedAt).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }, [lastSavedAt]);

  if (!enabled) {
    return null;
  }

  return (
    <div className="fixed left-4 top-4 z-[80] flex max-w-[calc(100vw-32px)] items-center gap-3 rounded-full border border-[color-mix(in_srgb,var(--border)_82%,white)] bg-[color-mix(in_srgb,var(--surface)_88%,white)] px-4 py-3 shadow-[0_18px_40px_rgba(15,23,42,0.16)] backdrop-blur">
      <button
        className={cx(
          "inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition",
          editMode
            ? "bg-[var(--primary)] text-[var(--button-text)] shadow-[0_12px_24px_color-mix(in_srgb,var(--primary)_26%,transparent)]"
            : "border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]",
        )}
        onClick={toggleEditMode}
        type="button"
      >
        <PencilIcon />
        {editMode ? "Modification active" : "Modifier la page"}
      </button>
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Modifications</p>
        <p className={cx("truncate text-sm", saveError ? "text-red-600" : "text-[var(--text)]")}>
          {isSaving ? "Enregistrement en cours..." : saveError ?? savedLabel}
        </p>
      </div>
    </div>
  );
}

export function PageInlineEditorModal() {
  const { activeField, closeEditor, isSaving, saveField, saveError } = usePageInlineEditor();
  const [draftValue, setDraftValue] = useState("");

  useEffect(() => {
    setDraftValue(activeField?.value ?? "");
  }, [activeField]);

  if (!activeField) {
    return null;
  }

  const InputTag = activeField.multiline ? "textarea" : "input";
  const charCount = draftValue.trim().length;

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-[90] overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.2),transparent_22%),rgba(2,6,23,0.74)] px-4 py-6 backdrop-blur-[10px] sm:px-6"
      onClick={(event) => {
        if (event.target === event.currentTarget && !isSaving) {
          closeEditor();
        }
      }}
      role="dialog"
    >
      <div className="mx-auto w-full max-w-3xl">
        <div className="overflow-hidden rounded-[34px] border border-white/30 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.96)_100%)] shadow-[0_32px_90px_rgba(15,23,42,0.34)]">
          <div className="border-b border-slate-200/80 bg-[linear-gradient(135deg,rgba(37,99,235,0.08),rgba(255,255,255,0.94)_42%,rgba(14,165,233,0.08))] px-6 py-5 sm:px-7">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-950 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
                    Edition directe
                  </span>
                </div>
                <h3 className="mt-4 text-2xl font-black tracking-[-0.03em] text-slate-950 sm:text-3xl">
                  {activeField.label}
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                  Modifie le contenu ci-dessous puis enregistre pour reappliquer immediatement le rendu.
                </p>
              </div>
              <button
                aria-label="Fermer l'editeur"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white/92 text-slate-500 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:text-slate-900"
                onClick={closeEditor}
                type="button"
              >
                <svg aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path d="M6 6 18 18" />
                  <path d="M18 6 6 18" />
                </svg>
              </button>
            </div>
          </div>

          <div className="grid gap-5 px-6 py-6 sm:px-7">
            <div className="grid gap-3 rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Champ cible</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {activeField.multiline ? "Contenu long, adapte a un texte descriptif." : "Contenu court, adapte a un titre ou un label."}
                  </p>
                </div>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {charCount} caracteres
                </div>
              </div>

              <InputTag
                className={cx(
                  "w-full rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-5 py-4 text-[15px] leading-7 text-slate-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)] outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100",
                  activeField.multiline ? "min-h-[280px] resize-y" : "min-h-14",
                )}
                dir="auto"
                onChange={(event) => setDraftValue(event.target.value)}
                placeholder="Saisis ta nouvelle valeur..."
                value={draftValue}
                {...(activeField.multiline ? { rows: 10 } : { type: "text" })}
              />
            </div>

            {saveError ? (
              <div className="rounded-[22px] border border-red-200 bg-[linear-gradient(180deg,#fff1f2_0%,#fff7f7_100%)] px-4 py-4 text-sm text-red-700 shadow-sm">
                <p className="font-semibold">L'enregistrement n'a pas fonctionne</p>
                <p className="mt-1 leading-6">{saveError}</p>
              </div>
            ) : (
              <div className="rounded-[22px] border border-emerald-100 bg-[linear-gradient(180deg,#f0fdf4_0%,#f8fffb_100%)] px-4 py-4 text-sm text-emerald-800 shadow-sm">
                <p className="font-semibold">Enregistrement instantane</p>
                <p className="mt-1 leading-6 text-emerald-700/90">
                  Clique sur <strong>Enregistrer</strong> pour mettre a jour ta page sans quitter cet ecran.
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-[26px] border border-slate-200 bg-slate-50/90 px-4 py-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">Modification en cours</p>
                <p className="mt-1 text-sm text-slate-500">
                  {isSaving ? "Ton changement est en cours d'enregistrement..." : "Verifie ton texte puis valide."}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50"
                  disabled={isSaving}
                  onClick={closeEditor}
                  type="button"
                >
                  Annuler
                </button>
                <button
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#0f172a,#2563eb)] px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(37,99,235,0.34)] disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={isSaving}
                  onClick={async () => {
                    try {
                      await saveField(draftValue);
                    } catch {
                      // L'erreur est deja exposee dans le panneau de sauvegarde.
                    }
                  }}
                  type="button"
                >
                  {isSaving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
