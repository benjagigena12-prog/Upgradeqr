import { NextRequest, NextResponse } from "next/server";
import { kv } from "@/lib/kv";
import type { Card } from "@/lib/types";
import { INDEX_KEY } from "@/lib/constants";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const count = Number(body.count);

  if (!Number.isInteger(count) || count < 1 || count > 200) {
    return NextResponse.json(
      { error: "Indica un número de tarjetas nuevas entre 1 y 200." },
      { status: 400 }
    );
  }

  const existing = (await kv.get<string[]>(INDEX_KEY)) ?? [];

  let maxNum = 0;
  for (const code of existing) {
    const match = code.match(/^A(\d+)$/);
    if (match) maxNum = Math.max(maxNum, parseInt(match[1], 10));
  }

  const newCodes: string[] = [];
  const pipeline = kv.pipeline();
  for (let i = 1; i <= count; i++) {
    const num = maxNum + i;
    const code = `A${String(num).padStart(3, "0")}`;
    newCodes.push(code);
    const card: Card = {
      code,
      active: false,
      url: null,
      updatedAt: new Date().toISOString(),
    };
    pipeline.set(`card:${code}`, card);
  }
  pipeline.set(INDEX_KEY, [...existing, ...newCodes]);
  await pipeline.exec();

  return NextResponse.json({ newCodes });
}
