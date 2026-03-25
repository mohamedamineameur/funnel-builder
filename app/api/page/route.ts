import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { normalizePagePayloadForRuntime, validatePagePayload } from "@/lib/page-dsl";

const pageFilePath = path.join(process.cwd(), "data", "page.json");

async function readStoredPage() {
  const source = await readFile(pageFilePath, "utf8");
  return JSON.parse(source) as unknown;
}

export async function GET() {
  const pageDefinition = await readStoredPage();
  return NextResponse.json(normalizePagePayloadForRuntime(pageDefinition));
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const validation = validatePagePayload(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.errors[0] ?? "JSON de page invalide." },
        { status: 400 },
      );
    }

    const normalizedPage = normalizePagePayloadForRuntime(validation.data);

    await writeFile(pageFilePath, `${JSON.stringify(normalizedPage, null, 2)}\n`, "utf8");

    return NextResponse.json(normalizedPage);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Impossible de sauvegarder la page.",
      },
      { status: 500 },
    );
  }
}
