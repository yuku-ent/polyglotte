import { isLang } from "@/lib/languages";
import { courseOverview } from "@/lib/course";
import { errorResponse, json } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const lang = new URL(req.url).searchParams.get("lang");
    if (!isLang(lang)) return json({ error: "Langue inconnue." }, { status: 400 });
    return json(await courseOverview(lang));
  } catch (error) {
    return errorResponse(error);
  }
}
