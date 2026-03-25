import { readFile } from "node:fs/promises";
import path from "node:path";
import { type RuntimePagePayload } from "@/components/page-runtime-view";
import { normalizePagePayloadForRuntime } from "@/lib/page-dsl";

export async function loadRuntimePage() {
  const source = await readFile(path.join(process.cwd(), "data", "page.json"), "utf8");
  const pageDefinition = JSON.parse(source) as unknown;
  return normalizePagePayloadForRuntime(pageDefinition) as RuntimePagePayload;
}
