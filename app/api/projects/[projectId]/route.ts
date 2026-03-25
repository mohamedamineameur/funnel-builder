import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { jsonError, isUuid, isRecord, sanitizeProjectName } from "@/lib/api-utils";
import { getModels, syncDatabase } from "@/lib/models";
import { runAsUser } from "@/lib/rls";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    projectId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const auth = await requireAuthenticatedUser();

    if (auth.error || !auth.user) {
      return auth.error;
    }

    const { projectId } = await context.params;

    if (!isUuid(projectId)) {
      return jsonError("Le projectId doit etre un UUID valide.");
    }

    await syncDatabase();
    const { Project } = getModels();

    const project = await runAsUser(auth.user.userId, async (transaction) => {
      return Project.findByPk(projectId, { transaction });
    });

    if (!project) {
      return jsonError("Projet introuvable.", 404);
    }

    return NextResponse.json(project);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Impossible de recuperer le projet.", 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireAuthenticatedUser();

    if (auth.error || !auth.user) {
      return auth.error;
    }

    const { projectId } = await context.params;

    if (!isUuid(projectId)) {
      return jsonError("Le projectId doit etre un UUID valide.");
    }

    const body = (await request.json()) as unknown;

    if (!isRecord(body)) {
      return jsonError("Le corps de la requete est invalide.");
    }

    const name = sanitizeProjectName(body.name);

    if (!name) {
      return jsonError("Le nom du projet est requis.");
    }

    await syncDatabase();
    const { Project } = getModels();

    const project = await runAsUser(auth.user.userId, async (transaction) => {
      const ownedProject = await Project.findByPk(projectId, { transaction });

      if (!ownedProject) {
        return null;
      }

      ownedProject.name = name;
      await ownedProject.save({ transaction });

      return ownedProject;
    });

    if (!project) {
      return jsonError("Projet introuvable.", 404);
    }

    return NextResponse.json(project);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Impossible de mettre a jour le projet.", 500);
  }
}
