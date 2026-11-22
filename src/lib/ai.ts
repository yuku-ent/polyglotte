import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { z } from "zod";

export class AiUnavailableError extends Error {
  constructor() {
    super(
      "Le tuteur IA n'est pas configuré : ajoute ANTHROPIC_API_KEY dans le fichier .env puis redémarre le serveur.",
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

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new AiUnavailableError();
  client ??= new Anthropic({ apiKey });
  return client;
}

export function aiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";

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

/**
 * Appelle Claude en forçant l'utilisation d'un outil : la réponse arrive
 * directement sous forme d'objet, qu'on valide ensuite avec Zod.
 */
export async function generateStructured<T>(req: StructuredRequest<T>): Promise<T> {
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: req.maxTokens ?? 2000,
    system: req.system,
    messages: [{ role: "user", content: req.prompt }],
    tools: [
      {
        name: req.toolName,
        description: req.toolDescription,
        input_schema: req.jsonSchema,
      },
    ],
    tool_choice: { type: "tool", name: req.toolName },
  });

  const block = response.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") throw new AiResponseError();

  const parsed = req.validator.safeParse(block.input);
  if (!parsed.success) {
    console.error("[ai] réponse invalide", parsed.error.flatten());
    throw new AiResponseError();
  }
  return parsed.data;
}
