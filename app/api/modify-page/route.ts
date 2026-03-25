import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { modifyPageJsonWithOpenAI } from "@/lib/openai-page-generator";
import {
  applyLocalizationConstraint,
  applyThemeConstraint,
  sanitizeLocalizationConstraint,
  sanitizePromptInput,
  sanitizeThemeConstraint,
} from "@/lib/page-generation-constraints";
import { normalizePagePayloadForRuntime, validatePagePayload, type PagePayload } from "@/lib/page-dsl";
import { createPageVersionForProject, getCurrentWorkspacePage } from "@/lib/workspace";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const auth = await requireAuthenticatedUser();

    if (auth.error || !auth.user) {
      return auth.error;
    }

    const body = (await request.json()) as {
      prompt?: unknown;
      page?: unknown;
      save?: unknown;
      themeConstraint?: unknown;
      localizationConstraint?: unknown;
    };

    const prompt = sanitizePromptInput(body.prompt);
    const themeConstraint = sanitizeThemeConstraint(body.themeConstraint);
    const localizationConstraint = sanitizeLocalizationConstraint(body.localizationConstraint);

    if (!prompt) {
      return NextResponse.json({ error: "La demande de modification est requise." }, { status: 400 });
    }

    const currentWorkspace = !body.page ? await getCurrentWorkspacePage(auth.user.userId) : null;
    const sourcePage = body.page ?? currentWorkspace?.effectivePage;
    const normalizedSourcePage = normalizePagePayloadForRuntime(sourcePage);
    const sourceValidation = validatePagePayload(normalizedSourcePage);

    if (!sourceValidation.success) {
      return NextResponse.json(
        { error: sourceValidation.errors[0] ?? "La page de depart est invalide." },
        { status: 400 },
      );
    }

    const result = await modifyPageJsonWithOpenAI(sourceValidation.data as PagePayload, prompt);
    const themedPage = applyThemeConstraint(result.page, themeConstraint);
    const finalPage = applyLocalizationConstraint(themedPage, localizationConstraint);
    const shouldSave = body.save !== false;

    if (shouldSave) {
      const workspace = currentWorkspace ?? await getCurrentWorkspacePage(auth.user.userId);
      await createPageVersionForProject(auth.user.userId, workspace.currentProject.id, finalPage);
    }

    return NextResponse.json({
      success: true,
      message: shouldSave
        ? "La page a ete modifiee puis sauvegardee."
        : "La page a ete modifiee.",
      page: finalPage,
      images: result.images,
      imageDisplay: result.imageDisplay,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Une erreur inconnue est survenue pendant la modification.",
      },
      { status: 500 },
    );
  }
}
