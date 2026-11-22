import { z } from "zod";
import { LANGS } from "@/lib/languages";
import { transcribe } from "@/lib/voice";
import { errorResponse, json, parseBody } from "@/lib/http";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const schema = z.object({
  lang: z.enum(LANGS),
  // WAV 16 kHz mono en base64 : ~1,3 Mo pour 30 secondes.
  audio: z.string().min(100).max(3_000_000),
});

export async function POST(req: Request) {
  try {
    const { lang, audio } = await parseBody(req, schema);
    return json({ text: await transcribe(audio, lang) });
  } catch (error) {
    return errorResponse(error);
  }
}
