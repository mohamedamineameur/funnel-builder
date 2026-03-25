import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";

const uploadDirectory = path.join(process.cwd(), "public", "generated");
const allowedMimeTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

function sanitizeFileSegment(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || "visuel";
}

function resolveExtension(fileName: string, mimeType: string) {
  const extensionFromName = path.extname(fileName).toLowerCase();
  if ([".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(extensionFromName)) {
    return extensionFromName === ".jpeg" ? ".jpg" : extensionFromName;
  }

  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "image/webp") return ".webp";
  if (mimeType === "image/gif") return ".gif";

  return ".png";
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuthenticatedUser();

    if (auth.error || !auth.user) {
      return auth.error;
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const slugValue = formData.get("slug");
    const slug = typeof slugValue === "string" && slugValue.trim() ? slugValue.trim() : "page";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Aucun fichier image n'a ete envoye." }, { status: 400 });
    }

    if (!allowedMimeTypes.has(file.type)) {
      return NextResponse.json(
        { error: "Format non pris en charge. Utilise PNG, JPG, WEBP ou GIF." },
        { status: 400 },
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "L'image est trop lourde. Maximum 10 Mo." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const extension = resolveExtension(file.name, file.type);
    const fileName = `${sanitizeFileSegment(slug)}-${Date.now()}${extension}`;

    await mkdir(uploadDirectory, { recursive: true });
    await writeFile(path.join(uploadDirectory, fileName), buffer);

    return NextResponse.json({
      src: `/generated/${fileName}`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Impossible d'envoyer l'image.",
      },
      { status: 500 },
    );
  }
}
