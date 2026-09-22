import { NextResponse } from "next/server";
import { kv } from "@/lib/kv";
import type { Card } from "@/lib/types";
import { INDEX_KEY } from "@/lib/constants";

// La primera vez que se abre el panel, si todavía no existe ningún
// código en la base de datos, se crean automáticamente A001...A050.
async function ensureSeed(): Promise<string[]> {
  const existing = await kv.get<string[]>(INDEX_KEY);
  if (existing && existing.length > 0) return existing;

  const codes: string[] = [];
  const pipeline = kv.pipeline();
  for (let i = 1; i <= 50; i++) {
    const code = `A${String(i).padStart(3, "0")}`;
    codes.push(code);
    const card: Card = {
      code,
      active: false,
      url: null,
      updatedAt: new Date().toISOString(),
    };
    pipeline.set(`card:${code}`, card);
  }
  pipeline.set(INDEX_KEY, codes);
  await pipeline.exec();
  return codes;
}

export async function GET() {
  const codes = await ensureSeed();
  const cards = await Promise.all(
    codes.map(async (code) => {
      const card = await kv.get<Card>(`card:${code}`);
      return card ?? { code, active: false, url: null, updatedAt: "" };
    })
  );
  cards.sort((a, b) => a.code.localeCompare(b.code));
  return NextResponse.json({ cards });
}
