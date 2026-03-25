import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { jsonError, isRecord, sanitizeProjectName } from "@/lib/api-utils";
import { getModels, syncDatabase } from "@/lib/models";
import { runAsUser } from "@/lib/rls";

export const runtime = "nodejs";

export async function GET() {
  try {
    const auth = await requireAuthenticatedUser();

    if (auth.error || !auth.user) {
      return auth.error;
    }

    await syncDatabase();
    const { Project } = getModels();

    const projects = await runAsUser(auth.user.userId, async (transaction) => {
      return Project.findAll({
        order: [["createdAt", "DESC"]],
        transaction,
      });
    });

    return NextResponse.json(projects);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Impossible de lister les projets.",
      500,
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuthenticatedUser();

    if (auth.error || !auth.user) {
      return auth.error;
    }

    const currentUserId = auth.user.userId;

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

    const project = await runAsUser(currentUserId, async (transaction) => {
      return Project.create(
        {
          name,
          userId: currentUserId,
        },
        { transaction },
      );
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Impossible de creer le projet.", 500);
  }
}
