import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { z } from "zod";

export class AiUnavailableError extends Error {
  constructor() {
    super(
      "Le tuteur IA n'est pas configuré : ajoute GEMINI_API_KEY (gratuit) ou ANTHROPIC_API_KEY dans les variables d'environnement.",
    );
    this.name = "AiUnavailableError";
  }
}

export class AiResponseError extends Error {
  constructor(message = "La réponse de l'IA était incomplète. Réessaie.") {
    super(message);
    this.name = "AiResponseError";
  }
}

let client: Anthropic | null = null;

type Provider = "anthropic" | "gemini";

/** Claude si ANTHROPIC_API_KEY est défini, sinon Gemini (offre gratuite) si GEMINI_API_KEY l'est. */
function getProvider(): Provider {
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.GEMINI_API_KEY) return "gemini";
  throw new AiUnavailableError();
}

export function aiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY);
}

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";

type StructuredRequest<T> = {
  system: string;
  prompt: string;
  /** Nom de l'outil que le modèle doit appeler : garantit une sortie JSON structurée. */
  toolName: string;
  toolDescription: string;
  jsonSchema: Anthropic.Tool["input_schema"];
  validator: z.ZodType<T, z.ZodTypeDef, unknown>;
  maxTokens?: number;
};

/** Erreur HTTP d'un fournisseur, convertie en message lisible par errorResponse. */
class ProviderHttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function callAnthropic(req: StructuredRequest<unknown>): Promise<unknown> {
  client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: req.maxTokens ?? 2000,
    system: req.system,
    messages: [{ role: "user", content: req.prompt }],
    tools: [{ name: req.toolName, description: req.toolDescription, input_schema: req.jsonSchema }],
    tool_choice: { type: "tool", name: req.toolName },
  });
  const block = response.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") throw new AiResponseError();
  return block.input;
}

function extractJson(text: string): unknown {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) throw new AiResponseError();
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    throw new AiResponseError();
  }
}

export type GeminiResponse = {
  candidates?: { content?: { parts?: { text?: string; inlineData?: { mimeType?: string; data?: string } }[] } }[];
};

export function geminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

/** Appel brut à l'API Gemini, avec des erreurs converties en statuts lisibles. */
export async function geminiRequest(model: string, body: unknown): Promise<GeminiResponse> {
  if (!process.env.GEMINI_API_KEY) throw new AiUnavailableError();
  let res: Response;
  try {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
      body: JSON.stringify(body),
    });
  } catch (e) {
    console.error("[ai] Gemini injoignable", e);
    throw new ProviderHttpError(502, "Gemini injoignable");
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("[ai] Gemini", model, res.status, detail.slice(0, 500));
    // 400/403 : clé invalide ou modèle inconnu → traité comme un problème de clé.
    const reason = /"message":\s*"([^"]+)"/.exec(detail)?.[1] ?? `HTTP ${res.status}`;
    throw new ProviderHttpError(res.status === 429 ? 429 : res.status >= 500 ? 502 : 401, `Gemini (${model}) : ${reason}`);
  }
  return (await res.json()) as GeminiResponse;
}

async function callGemini(req: StructuredRequest<unknown>): Promise<unknown> {
  const instructions = [
    req.system,
    "",
    `Tâche : ${req.toolDescription}`,
    "Réponds UNIQUEMENT avec un objet JSON valide (sans texte autour) qui respecte ce schéma JSON :",
    JSON.stringify(req.jsonSchema),
  ].join("\n");

  const data = await geminiRequest(GEMINI_MODEL, {
    systemInstruction: { parts: [{ text: instructions }] },
    contents: [{ role: "user", parts: [{ text: req.prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens: Math.max(4096, (req.maxTokens ?? 2000) * 2),
      temperature: 0.8,
    },
  });
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text) throw new AiResponseError();
  return extractJson(text);
}

/**
 * Appelle le modèle et renvoie un objet validé par Zod.
 * Claude : outil forcé. Gemini : réponse JSON guidée par le schéma.
 */
export async function generateStructured<T>(req: StructuredRequest<T>): Promise<T> {
  const provider = getProvider();
  const attempt = async () => {
    const raw =
      provider === "anthropic"
        ? await callAnthropic(req as StructuredRequest<unknown>)
        : await callGemini(req as StructuredRequest<unknown>);
    const parsed = req.validator.safeParse(raw);
    if (!parsed.success) {
      console.error("[ai] réponse invalide", JSON.stringify(parsed.error.flatten()).slice(0, 1000));
      throw new AiResponseError();
    }
    return parsed.data;
  };

  try {
    return await attempt();
  } catch (error) {
    // Réponse inutilisable ou surcharge passagère : un second essai suffit le plus souvent.
    const status = (error as { status?: number }).status;
    if (error instanceof AiResponseError || status === 502 || status === 503) {
      console.warn("[ai] nouvel essai après", error);
      return attempt();
    }
    throw error;
  }
}
