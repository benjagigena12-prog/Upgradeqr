import { Redis } from "@upstash/redis";

// Vercel puede llamar a las variables de entorno de dos formas distintas
// según cómo hayas conectado el almacenamiento (integración "KV" antigua
// o "Upstash Redis" del Marketplace). Aceptamos ambas para que funcione
// sin que tengas que fijarte en el nombre exacto.
const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
const token =
  process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";

export const kv = new Redis({ url, token });
