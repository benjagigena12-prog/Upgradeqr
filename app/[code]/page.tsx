import { redirect } from "next/navigation";
import { kv } from "@/lib/kv";
import type { Card } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CardPage({
  params,
}: {
  params: { code: string };
}) {
  const code = params.code.toUpperCase();
  const card = await kv.get<Card>(`card:${code}`);

  // Si la tarjeta está activada y tiene una URL, redirigimos
  // inmediatamente: el cliente nunca ve una página intermedia.
  if (card && card.active && card.url) {
    redirect(card.url);
  }

  return (
    <main className="status-page">
      <div className="status-card">
        <h1>Tarjeta no activada</h1>
        <p>Esta tarjeta todavía no está activada.</p>
      </div>
    </main>
  );
}
