import { NextResponse, type NextRequest } from "next/server";

/**
 * Protection par mot de passe (authentification HTTP Basic).
 * Active seulement si APP_PASSWORD est défini : indispensable en ligne,
 * sinon n'importe qui ayant le lien utilise ton profil et ta clé API.
 */
export function middleware(req: NextRequest) {
  const password = process.env.APP_PASSWORD;
  if (!password) return NextResponse.next();

  const header = req.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    try {
      const decoded = atob(header.slice(6));
      const given = decoded.slice(decoded.indexOf(":") + 1);
      if (given === password) return NextResponse.next();
    } catch {
      /* en-tête invalide */
    }
  }

  return new NextResponse("Accès protégé", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Polyglotte", charset="UTF-8"' },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
