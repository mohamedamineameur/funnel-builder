import { PageRuntimeView } from "@/components/page-runtime-view";
import { WorkspacePageShell } from "@/components/workspace-page-shell";
import { loadRuntimePage } from "@/lib/load-runtime-page";

export const dynamic = "force-dynamic";

export default async function EditionPage() {
  const page = await loadRuntimePage();

  return (
    <WorkspacePageShell>
      <PageRuntimeView editable page={page} />
    </WorkspacePageShell>
  );
}
