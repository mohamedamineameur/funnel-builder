import { NextResponse } from "next/server";
import pageDefinition from "@/data/page.json";
import { normalizePagePayloadForRuntime } from "@/lib/page-dsl";

export async function GET() {
  return NextResponse.json(normalizePagePayloadForRuntime(pageDefinition));
}
