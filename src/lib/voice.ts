import "server-only";
import { createHash } from "node:crypto";
import { prisma } from "./db";
import { AiResponseError, GEMINI_FALLBACK_MODELS, GEMINI_MODEL, geminiRequest, geminiWithFallback } from "./ai";
import { LANGUAGES, type Lang } from "./languages";

const TTS_MODEL = process.env.GEMINI_TTS_MODEL || "gemini-3.1-flash-tts-preview";
const TTS_VOICE = process.env.GEMINI_TTS_VOICE || "Kore";

/** Ajoute un en-tête WAV à de l'audio PCM 16 bits. */
export function pcmToWav(pcm: Buffer, sampleRate = 24000, channels = 1): Buffer {
  const header = Buffer.alloc(44);
  const byteRate = sampleRate * channels * 2;
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(channels * 2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

function ttsKey(text: string, lang: Lang) {
  return createHash("sha256").update(`${TTS_MODEL}|${TTS_VOICE}|${lang}|${text}`).digest("hex");
}

/** Voix naturelle Gemini, mise en cache en base : chaque phrase n'est générée qu'une fois. */
export async function synthesize(text: string, lang: Lang): Promise<Buffer> {
  const id = ttsKey(text, lang);
  const cached = await prisma.ttsCache.findUnique({ where: { id } });
  if (cached) return Buffer.from(cached.audio);

  const data = await geminiRequest(TTS_MODEL, {
    contents: [{ role: "user", parts: [{ text }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: TTS_VOICE } } },
    },
  }, 25_000);

  const part = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  if (!part?.inlineData?.data) throw new AiResponseError("La voix n'a pas pu être générée.");
  const rate = Number(/rate=(\d+)/.exec(part.inlineData.mimeType ?? "")?.[1] ?? 24000);
  const wav = pcmToWav(Buffer.from(part.inlineData.data, "base64"), rate);

  await prisma.ttsCache
    .upsert({ where: { id }, update: {}, create: { id, audio: new Uint8Array(wav) } })
    .catch((e) => console.error("[tts] cache", e));
  return wav;
}

/** Transcription par Groq (Whisper) : gratuite et quasi instantanée. */
async function transcribeWithGroq(audioBase64: string, lang: Lang): Promise<string> {
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(Buffer.from(audioBase64, "base64"))], { type: "audio/wav" }), "audio.wav");
  form.append("model", process.env.GROQ_STT_MODEL || "whisper-large-v3-turbo");
  form.append("language", lang);
  form.append("temperature", "0");
  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: form,
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`Groq transcription ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { text?: string };
  return (data.text ?? "").trim();
}

/** Transcription d'un enregistrement du micro (WAV en base64) : Groq si disponible, sinon Gemini. */
export async function transcribe(audioBase64: string, lang: Lang): Promise<string> {
  if (process.env.GROQ_API_KEY) {
    try {
      return await transcribeWithGroq(audioBase64, lang);
    } catch (error) {
      if (!process.env.GEMINI_API_KEY) throw error;
      console.warn("[stt] Groq indisponible, bascule sur Gemini", error);
    }
  }
  const name = LANGUAGES[lang].nativeName;
  // Gemma ne comprend pas l'audio : on ne garde que les modèles Gemini.
  const audioModels = [GEMINI_MODEL, ...GEMINI_FALLBACK_MODELS].filter((m) => !m.startsWith("gemma"));
  const data = await geminiWithFallback({
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType: "audio/wav", data: audioBase64 } },
          {
            text:
              `Transcris exactement ce que dit la personne. Langue attendue : ${name} (elle peut aussi parler français). ` +
              "N'invente rien, ne corrige pas les fautes et ne traduis pas. " +
              (lang === "ar" ? "Écris l'arabe en caractères arabes. " : "") +
              "Réponds uniquement par la transcription, sans guillemets. Si on n'entend rien, réponds par une chaîne vide.",
          },
        ],
      },
    ],
    generationConfig: { temperature: 0 },
  }, 40_000, audioModels);
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  return text.trim().replace(/^["«»“”]+|["«»“”]+$/g, "").trim();
}
