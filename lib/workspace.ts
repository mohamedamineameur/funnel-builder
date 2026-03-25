import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import type { Transaction } from "sequelize";
import { type RuntimePagePayload } from "@/components/page-runtime-view";
import { getModels, syncDatabase } from "@/lib/models";
import { normalizePagePayloadForRuntime, validatePagePayload } from "@/lib/page-dsl";
import { runAsUser } from "@/lib/rls";

const pageFilePath = path.join(process.cwd(), "data", "page.json");
const DEFAULT_PROJECT_NAME = "Projet principal";

function normalizeStoredPagePayload(value: unknown) {
  return normalizePagePayloadForRuntime(value) as RuntimePagePayload;
}

export function validateRuntimePagePayload(value: unknown) {
  const normalizedPage = normalizeStoredPagePayload(value);
  const validation = validatePagePayload(normalizedPage);

  if (!validation.success) {
    throw new Error(validation.errors[0] ?? "JSON de page invalide.");
  }

  return validation.data as RuntimePagePayload;
}

export function jsonServerError(error: unknown, fallbackMessage: string) {
  return NextResponse.json(
    {
      error: error instanceof Error ? error.message : fallbackMessage,
    },
    { status: 500 },
  );
}

export async function readFallbackRuntimePage() {
  const source = await readFile(pageFilePath, "utf8");
  return validateRuntimePagePayload(JSON.parse(source) as unknown);
}

async function ensureEffectivePageForProject(projectId: string, transaction: Transaction) {
  const { Page } = getModels();
  let effectivePage = await Page.findOne({
    where: {
      projectId,
      isEffective: true,
    },
    order: [["createdAt", "DESC"]],
    transaction,
  });

  if (!effectivePage) {
    const seedPage = await readFallbackRuntimePage();
    effectivePage = await Page.create(
      {
        projectId,
        payload: seedPage,
        isEffective: true,
      },
      { transaction },
    );
  }

  return effectivePage;
}

export async function getWorkspaceForUser(userId: string, preferredProjectId?: string | null) {
  await syncDatabase();
  const { Page, Project, User } = getModels();

  const user = await User.findByPk(userId);

  if (!user) {
    throw new Error("Utilisateur introuvable.");
  }

  return runAsUser(userId, async (transaction) => {
    let projects = await Project.findAll({
      order: [["createdAt", "DESC"]],
      transaction,
    });

    if (projects.length === 0) {
      const seedPage = await readFallbackRuntimePage();
      const project = await Project.create(
        {
          name: DEFAULT_PROJECT_NAME,
          userId,
        },
        { transaction },
      );

      await Page.create(
        {
          projectId: project.id,
          payload: seedPage,
          isEffective: true,
        },
        { transaction },
      );

      projects = [project];
    }

    const currentProject =
      (preferredProjectId ? projects.find((project) => project.id === preferredProjectId) : null) ?? projects[0];
    const effectivePageRecord = await ensureEffectivePageForProject(currentProject.id, transaction);

    return {
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
      },
      projects,
      currentProject,
      effectivePageRecord,
      effectivePage: normalizeStoredPagePayload(effectivePageRecord.payload),
    };
  });
}

export async function getEffectivePageForProject(userId: string, projectId: string) {
  await syncDatabase();
  const { Project } = getModels();

  return runAsUser(userId, async (transaction) => {
    const project = await Project.findByPk(projectId, { transaction });

    if (!project) {
      return null;
    }

    const effectivePageRecord = await ensureEffectivePageForProject(project.id, transaction);

    return {
      project,
      effectivePageRecord,
      effectivePage: normalizeStoredPagePayload(effectivePageRecord.payload),
    };
  });
}

export async function getCurrentWorkspacePage(userId: string, preferredProjectId?: string | null) {
  const workspace = await getWorkspaceForUser(userId, preferredProjectId);

  return {
    currentProject: workspace.currentProject,
    effectivePageRecord: workspace.effectivePageRecord,
    effectivePage: workspace.effectivePage,
  };
}

export async function createPageVersionForProject(
  userId: string,
  projectId: string,
  value: unknown,
) {
  const normalizedPage = validateRuntimePagePayload(value);

  await syncDatabase();
  const { Page, Project } = getModels();

  return runAsUser(userId, async (transaction) => {
    const project = await Project.findByPk(projectId, { transaction });

    if (!project) {
      return null;
    }

    await Page.update(
      { isEffective: false },
      {
        where: { projectId },
        transaction,
      },
    );

    const pageRecord = await Page.create(
      {
        projectId,
        payload: normalizedPage,
        isEffective: true,
      },
      { transaction },
    );

    return {
      project,
      pageRecord,
      page: normalizeStoredPagePayload(pageRecord.payload),
    };
  });
}
