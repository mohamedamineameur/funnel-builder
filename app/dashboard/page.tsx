import { readdir } from "node:fs/promises";
import path from "node:path";
import { loadRuntimePage } from "@/lib/load-runtime-page";
import { DashboardVisualEditor } from "@/components/dashboard-visual-editor";
import { WorkspacePageShell } from "@/components/workspace-page-shell";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const runtimePage = await loadRuntimePage();
  const generatedDirectory = path.join(process.cwd(), "public", "generated");
  let availableImages: string[] = [];

  try {
    const entries = await readdir(generatedDirectory, { withFileTypes: true });
    availableImages = entries
      .filter((entry) => entry.isFile())
      .map((entry) => `/generated/${entry.name}`)
      .sort((left, right) => right.localeCompare(left));
  } catch {
    availableImages = [];
  }

  return (
    <WorkspacePageShell>
      <DashboardVisualEditor availableImages={availableImages} initialPage={runtimePage} />
    </WorkspacePageShell>
  );
}
