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

type Provider = "anthropic" | "groq" | "gemini";

/**
 * Ordre de préférence : Claude (payant), puis Groq (gratuit et très rapide),
 * puis Gemini (gratuit, parfois saturé). Groq bascule sur Gemini en cas de souci.
 */
function getProvider(): Provider {
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.GEMINI_API_KEY) return "gemini";
  throw new AiUnavailableError();
}

export function aiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY);
}

export function groqConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY);
}

const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

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

/** Modèles de secours, essayés quand le modèle principal est saturé ou trop lent. */
export const GEMINI_FALLBACK_MODELS = (process.env.GEMINI_FALLBACK_MODELS || "gemini-flash-lite-latest,gemma-3-27b-it")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

/** Appel brut à l'API Gemini, avec une limite de temps et des erreurs converties en statuts lisibles. */
type GeminiBody = {
  systemInstruction?: { parts: { text: string }[] };
  contents: { role?: string; parts: Record<string, unknown>[] }[];
  generationConfig?: Record<string, unknown>;
};

/** Les modèles Gemma n'acceptent ni instruction système ni mode JSON : on les fusionne dans le message. */
function adaptForModel(model: string, body: GeminiBody): GeminiBody {
  if (!model.startsWith("gemma")) return body;
  const system = body.systemInstruction?.parts.map((p) => p.text).join("\n") ?? "";
  const [first, ...rest] = body.contents;
  const { responseMimeType: _ignored, ...config } = body.generationConfig ?? {};
  return {
    contents: [{ ...first, parts: [{ text: system }, ...first.parts] }, ...rest],
    generationConfig: config,
  };
}

export async function geminiRequest(model: string, rawBody: GeminiBody, timeoutMs = 50_000): Promise<GeminiResponse> {
  if (!process.env.GEMINI_API_KEY) throw new AiUnavailableError();
  const body = adaptForModel(model, rawBody);
  let res: Response;
  try {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (e) {
    const timedOut = (e as { name?: string }).name === "TimeoutError";
    console.error("[ai] Gemini", model, timedOut ? "trop lent" : "injoignable", e);
    throw new ProviderHttpError(503, timedOut ? `Gemini (${model}) : trop lent` : "Gemini injoignable");
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("[ai] Gemini", model, res.status, detail.slice(0, 500));
    // 400/403/404 : clé invalide ou modèle inconnu → traité comme un problème de clé.
    const reason = /"message":\s*"([^"]+)"/.exec(detail)?.[1] ?? `HTTP ${res.status}`;
    throw new ProviderHttpError(res.status === 429 ? 429 : res.status >= 500 ? 503 : 401, `Gemini (${model}) : ${reason}`);
  }
  return (await res.json()) as GeminiResponse;
}

/**
 * Essaie le modèle principal, puis les modèles de secours si Google est saturé
 * (503), trop lent, ou si le quota du modèle est épuisé (429).
 * Le tout tient dans la limite de 60 s d'une fonction Vercel.
 */
export async function geminiWithFallback(
  body: GeminiBody,
  budgetMs = 54_000,
  models = [GEMINI_MODEL, ...GEMINI_FALLBACK_MODELS.filter((m) => m !== GEMINI_MODEL)],
): Promise<GeminiResponse> {
  const started = Date.now();
  let lastError: unknown;
  for (let i = 0; i < models.length; i++) {
    const remaining = budgetMs - (Date.now() - started);
    if (remaining < 4_000) break;
    const last = i === models.length - 1;
    // Chaque modèle laisse du temps aux suivants.
    const timeout = last ? remaining : Math.min(i === 0 ? 22_000 : 15_000, remaining - 10_000 * (models.length - 1 - i));
    if (timeout < 4_000) continue;
    try {
      return await geminiRequest(models[i], body, timeout);
    } catch (error) {
      lastError = error;
      const status = (error as { status?: number }).status;
      // Clé invalide sur le modèle principal : inutile d'essayer les autres.
      if (i === 0 && status === 401 && !String((error as Error).message).includes("not found")) throw error;
      console.warn(`[ai] ${models[i]} indisponible (${status}), essai du modèle suivant`);
    }
  }
  throw lastError ?? new ProviderHttpError(503, "Gemini : aucun modèle disponible");
}

/** Groq (API compatible OpenAI) : gratuit et très rapide. */
async function callGroq(req: StructuredRequest<unknown>, timeoutMs: number): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.7,
        max_tokens: Math.min(8000, req.maxTokens ?? 2000),
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: jsonInstructions(req) },
          { role: "user", content: req.prompt },
        ],
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (e) {
    const timedOut = (e as { name?: string }).name === "TimeoutError";
    throw new ProviderHttpError(503, timedOut ? "Groq : trop lent" : "Groq injoignable");
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("[ai] Groq", res.status, detail.slice(0, 500));
    const reason = /"message":\s*"([^"]+)"/.exec(detail)?.[1] ?? `HTTP ${res.status}`;
    throw new ProviderHttpError(res.status === 429 ? 429 : res.status >= 500 ? 503 : 401, `Groq (${GROQ_MODEL}) : ${reason}`);
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = data.choices?.[0]?.message?.content ?? "";
  if (!text) throw new AiResponseError();
  return extractJson(text);
}

function jsonInstructions(req: StructuredRequest<unknown>) {
  return [
    req.system,
    "",
    `Tâche : ${req.toolDescription}`,
    "Réponds UNIQUEMENT avec un objet JSON valide (sans texte autour) qui respecte ce schéma JSON :",
    JSON.stringify(req.jsonSchema),
  ].join("\n");
}

async function callGemini(req: StructuredRequest<unknown>, budgetMs = 54_000): Promise<unknown> {
  const data = await geminiWithFallback(
    {
      systemInstruction: { parts: [{ text: jsonInstructions(req) }] },
      contents: [{ role: "user", parts: [{ text: req.prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: Math.max(4096, (req.maxTokens ?? 2000) * 2),
        temperature: 0.8,
      },
    },
    budgetMs,
  );
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
    let raw: unknown;
    if (provider === "anthropic") raw = await callAnthropic(req as StructuredRequest<unknown>);
    else if (provider === "groq") {
      const started = Date.now();
      try {
        raw = await callGroq(req as StructuredRequest<unknown>, process.env.GEMINI_API_KEY ? 25_000 : 54_000);
      } catch (error) {
        // Groq saturé ou en panne : Gemini prend le relais avec le temps restant.
        if (!process.env.GEMINI_API_KEY || error instanceof AiUnavailableError) throw error;
        console.warn("[ai] Groq indisponible, bascule sur Gemini", error);
        raw = await callGemini(req as StructuredRequest<unknown>, 54_000 - (Date.now() - started));
      }
    } else raw = await callGemini(req as StructuredRequest<unknown>);
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
    if (error instanceof AiResponseError && provider === "anthropic") {
      console.warn("[ai] nouvel essai après", error);
      return attempt();
    }
    throw error;
  }
}
