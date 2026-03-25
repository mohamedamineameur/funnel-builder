import { PageRuntimeView } from "@/components/page-runtime-view";
import { loadRuntimePage } from "@/lib/load-runtime-page";

export const dynamic = "force-dynamic";

export default async function EditionPage() {
  const page = await loadRuntimePage();

  return <PageRuntimeView editable page={page} />;
}
