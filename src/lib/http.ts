import "server-only";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError, type z } from "zod";
import { AiResponseError, AiUnavailableError } from "./ai";

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function errorResponse(error: unknown) {
  if (error instanceof AiUnavailableError) {
    return NextResponse.json({ error: error.message, code: "ai_unavailable" }, { status: 503 });
  }
  if (error instanceof AiResponseError) {
    return NextResponse.json({ error: error.message, code: "ai_response" }, { status: 502 });
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Requête invalide.", code: "bad_request", details: error.flatten() },
      { status: 400 },
    );
  }
  if (error instanceof Prisma.PrismaClientInitializationError) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          "Base de données inaccessible : vérifie DATABASE_URL et DATABASE_URL_UNPOOLED dans les variables d'environnement.",
        code: "db_unavailable",
      },
      { status: 503 },
    );
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2021" || error.code === "P2022")) {
    console.error(error);
    return NextResponse.json(
      { error: "Les tables n'existent pas encore : lance « npm run db:push ».", code: "db_schema" },
      { status: 503 },
    );
  }
  const status = (error as { status?: number })?.status;
  if (status === 401) {
    return NextResponse.json(
      { error: "Clé API Claude refusée : vérifie ANTHROPIC_API_KEY.", code: "ai_auth" },
      { status: 502 },
    );
  }
  if (status === 429) {
    return NextResponse.json(
      { error: "Trop de demandes à l'IA. Patiente quelques secondes.", code: "rate_limited" },
      { status: 429 },
    );
  }
  console.error(error);
  return NextResponse.json({ error: "Erreur inattendue du serveur.", code: "server" }, { status: 500 });
}

export async function parseBody<S extends z.ZodTypeAny>(req: Request, schema: S): Promise<z.infer<S>> {
  const body: unknown = await req.json().catch(() => ({}));
  return schema.parse(body);
}
