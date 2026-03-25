import { readFile } from "node:fs/promises";
import path from "node:path";
import { cookies, headers } from "next/headers";
import { type RuntimePagePayload } from "@/components/page-runtime-view";
import { CURRENT_PROJECT_COOKIE_NAME } from "@/lib/project-selection";
import { getCurrentWorkspacePage } from "@/lib/workspace";
import { normalizePagePayloadForRuntime } from "@/lib/page-dsl";

export async function loadRuntimePage() {
  const requestHeaders = await headers();
  const authenticatedUserId = requestHeaders.get("x-auth-user-id");

  if (authenticatedUserId) {
    const cookieStore = await cookies();
    const preferredProjectId = cookieStore.get(CURRENT_PROJECT_COOKIE_NAME)?.value ?? null;
    const workspacePage = await getCurrentWorkspacePage(authenticatedUserId, preferredProjectId);
    return workspacePage.effectivePage;
  }

  const source = await readFile(path.join(process.cwd(), "data", "page.json"), "utf8");
  const pageDefinition = JSON.parse(source) as unknown;
  return normalizePagePayloadForRuntime(pageDefinition) as RuntimePagePayload;
}
