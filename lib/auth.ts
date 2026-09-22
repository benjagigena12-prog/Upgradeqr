// Utilidades para crear y verificar una "sesión firmada" del panel de
// administración, sin depender de ninguna librería externa ni de una
// base de datos de sesiones. El token va dentro de una cookie httpOnly,
// así que nunca es visible ni manipulable desde el navegador del cliente.

const encoder = new TextEncoder();

async function getKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createSessionToken(
  secret: string,
  ttlSeconds = 60 * 60 * 24 * 7 // 7 días
) {
  const expires = Date.now() + ttlSeconds * 1000;
  const key = await getKey(secret);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(String(expires))
  );
  return `${expires}.${toHex(signature)}`;
}

export async function verifySessionToken(
  secret: string,
  token: string | undefined | null
) {
  if (!token) return false;
  const [expiresStr, sig] = token.split(".");
  if (!expiresStr || !sig) return false;

  const expires = Number(expiresStr);
  if (!Number.isFinite(expires) || expires < Date.now()) return false;

  const key = await getKey(secret);
  const expectedSignature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(expiresStr)
  );
  const expectedHex = toHex(expectedSignature);

  if (expectedHex.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < expectedHex.length; i++) {
    diff |= expectedHex.charCodeAt(i) ^ sig.charCodeAt(i);
  }
  return diff === 0;
}

export const SESSION_COOKIE = "upgrading_admin_session";
