import { PageRuntimeView } from "@/components/page-runtime-view";
import { loadRuntimePage } from "@/lib/load-runtime-page";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const page = await loadRuntimePage();

  return <PageRuntimeView page={page} />;
}
