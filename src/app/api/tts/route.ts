import { isLang } from "@/lib/languages";
import { synthesize } from "@/lib/voice";
import { errorResponse, json } from "@/lib/http";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** GET /api/tts?lang=en&text=Hello → audio WAV (mis en cache par le navigateur et la base). */
export async function GET(req: Request) {
  try {
    const params = new URL(req.url).searchParams;
    const lang = params.get("lang");
    const text = (params.get("text") ?? "").trim();
    if (!isLang(lang) || !text) return json({ error: "Paramètres manquants." }, { status: 400 });
    if (text.length > 800) return json({ error: "Texte trop long." }, { status: 400 });

    const wav = await synthesize(text, lang);
    return new Response(new Uint8Array(wav), {
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": String(wav.length),
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
