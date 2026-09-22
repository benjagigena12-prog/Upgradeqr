import { NextRequest, NextResponse } from "next/server";
import { kv } from "@/lib/kv";
import type { Card } from "@/lib/types";

function isValidUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();
  const key = `card:${code}`;

  const existing = await kv.get<Card>(key);
  if (!existing) {
    return NextResponse.json({ error: "Esa tarjeta no existe." }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const url = typeof body.url === "string" ? body.url.trim() : existing.url ?? "";
  const active = typeof body.active === "boolean" ? body.active : existing.active;

  if (active && !isValidUrl(url)) {
    return NextResponse.json(
      {
        error:
          "Para activar la tarjeta necesitas una URL válida que empiece por http:// o https://.",
      },
      { status: 400 }
    );
  }

  const updated: Card = {
    code,
    active,
    url: url ? url : null,
    updatedAt: new Date().toISOString(),
  };

  await kv.set(key, updated);
  return NextResponse.json({ card: updated });
}
