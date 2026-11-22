import "server-only";
import { prisma } from "./db";
import { defaultVariety, type Lang } from "./languages";
import { STARTER_DECKS } from "@/content/decks";

/** Appli personnelle : un seul profil local. L'authentification pourra venir plus tard. */
export const PROFILE_ID = "me";

export async function getProfile() {
  return prisma.profile.upsert({
    where: { id: PROFILE_ID },
    update: {},
    create: { id: PROFILE_ID },
  });
}

/** Réglages d'une langue, créés au premier usage avec le paquet de départ. */
export async function getLanguage(lang: Lang) {
  await getProfile();
  const progress = await prisma.languageProgress.upsert({
    where: { profileId_lang: { profileId: PROFILE_ID, lang } },
    update: {},
    create: { profileId: PROFILE_ID, lang, variety: defaultVariety(lang) },
  });

  if (!progress.deckSeeded) {
    const existing = await prisma.card.findMany({
      where: { profileId: PROFILE_ID, lang },
      select: { term: true },
    });
    const known = new Set(existing.map((c) => c.term));
    const toCreate = STARTER_DECKS[lang]
      .filter((item) => !known.has(item.term))
      .map((item) => ({
        profileId: PROFILE_ID,
        lang,
        term: item.term,
        translation: item.translation,
        translit: item.translit ?? null,
        example: item.example ?? null,
        source: "deck",
      }));
    if (toCreate.length) await prisma.card.createMany({ data: toCreate });
    return prisma.languageProgress.update({
      where: { id: progress.id },
      data: { deckSeeded: true },
    });
  }

  return progress;
}
