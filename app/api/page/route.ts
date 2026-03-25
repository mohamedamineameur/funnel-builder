import { NextResponse } from "next/server";
import { getOptionalAuthenticatedUser, requireAuthenticatedUser } from "@/lib/auth";
import { createPageVersionForProject, getCurrentWorkspacePage, jsonServerError, readFallbackRuntimePage } from "@/lib/workspace";

export async function GET() {
  try {
    const auth = await getOptionalAuthenticatedUser();

    if (auth.user) {
      const workspace = await getCurrentWorkspacePage(auth.user.userId);
      return NextResponse.json(workspace.effectivePage);
    }

    return NextResponse.json(await readFallbackRuntimePage());
  } catch (error) {
    return jsonServerError(error, "Impossible de charger la page.");
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireAuthenticatedUser();

    if (auth.error || !auth.user) {
      return auth.error;
    }

    const body = (await request.json()) as unknown;
    const workspace = await getCurrentWorkspacePage(auth.user.userId);
    const result = await createPageVersionForProject(auth.user.userId, workspace.currentProject.id, body);

    if (!result) {
      return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
    }

    return NextResponse.json(result.page);
  } catch (error) {
    return jsonServerError(error, "Impossible de sauvegarder la page.");
  }
}
