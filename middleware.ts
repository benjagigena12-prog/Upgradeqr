import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "./lib/auth";

// Este middleware protege TODA la API de administración (crear, editar,
// activar/desactivar tarjetas, generar nuevos códigos) excepto el propio
// endpoint de login/logout. La contraseña de administrador nunca se envía
// al navegador: solo vive en el servidor, como variable de entorno.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const secret = process.env.SESSION_SECRET;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const valid = secret ? await verifySessionToken(secret, token) : false;

  if (valid) {
    return NextResponse.next();
  }

  return NextResponse.json(
    { error: "No autorizado. Inicia sesión de nuevo." },
    { status: 401 }
  );
}

export const config = {
  matcher: ["/api/admin/cards/:path*"],
};
