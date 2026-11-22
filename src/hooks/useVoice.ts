"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSpeechSynthesis } from "./useSpeech";

type SpeakOptions = { rate?: number; id?: string; onLine?: (index: number) => void; onEnd?: () => void };

/**
 * Lecteur audio de l'appli.
 * 1. Voix naturelle générée par le serveur (Gemini), mise en cache.
 * 2. Si elle n'est pas disponible : voix du navigateur.
 */
export function useVoicePlayer(naturalEnabled: boolean) {
  const browser = useSpeechSynthesis();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const tokenRef = useRef(0);
  const urls = useRef(new Map<string, Promise<string>>());
  const naturalBroken = useRef(false);

  useEffect(() => {
    const cache = urls.current;
    return () => {
      audioRef.current?.pause();
      cache.forEach((p) => p.then((u) => URL.revokeObjectURL(u)).catch(() => {}));
    };
  }, []);

  const fetchAudio = useCallback((text: string, lang: string) => {
    const key = `${lang}|${text}`;
    let promise = urls.current.get(key);
    if (!promise) {
      promise = fetch(`/api/tts?lang=${lang}&text=${encodeURIComponent(text)}`).then(async (res) => {
        if (!res.ok) {
          // 503 : pas de clé Gemini → on n'essaie plus la voix naturelle.
          if (res.status === 503 || res.status === 401 || res.status === 502) naturalBroken.current = true;
          throw new Error(`tts ${res.status}`);
        }
        return URL.createObjectURL(await res.blob());
      });
      promise.catch(() => urls.current.delete(key));
      urls.current.set(key, promise);
    }
    return promise;
  }, []);

  const stop = useCallback(() => {
    tokenRef.current++;
    audioRef.current?.pause();
    browser.stop();
    setPlayingId(null);
    setLoadingId(null);
  }, [browser]);

  const speak = useCallback(
    async (texts: string | string[], speechCode: string, options: SpeakOptions = {}) => {
      const list = (Array.isArray(texts) ? texts : [texts]).map((t) => t.trim()).filter(Boolean);
      if (!list.length) return;
      stop();
      const token = ++tokenRef.current;
      const id = options.id ?? list.join(" ");
      const lang = speechCode.split("-")[0];

      const fallback = (from: number) => {
        if (token !== tokenRef.current) return;
        setLoadingId(null);
        setPlayingId(null);
        browser.speak(list.slice(from), speechCode, {
          ...options,
          id,
          onLine: (i) => options.onLine?.(i + from),
        });
      };

      if (!naturalEnabled || naturalBroken.current) return fallback(0);

      setPlayingId(id);
      for (let i = 0; i < list.length; i++) {
        if (token !== tokenRef.current) return;
        setLoadingId(id);
        let url: string;
        try {
          url = await fetchAudio(list[i], lang);
          if (i + 1 < list.length) void fetchAudio(list[i + 1], lang).catch(() => {}); // préchargement
        } catch {
          return fallback(i);
        }
        if (token !== tokenRef.current) return;
        setLoadingId(null);

        const audio = new Audio(url);
        audio.playbackRate = options.rate ?? 1;
        audio.preservesPitch = true;
        audioRef.current = audio;
        options.onLine?.(i);
        const ok = await new Promise<boolean>((resolve) => {
          audio.onended = () => resolve(true);
          audio.onerror = () => resolve(false);
          audio.onpause = () => {
            if (!audio.ended) resolve(true);
          };
          audio.play().catch(() => resolve(false));
        });
        if (!ok) return fallback(i);
      }
      if (token === tokenRef.current) {
        setPlayingId(null);
        options.onEnd?.();
      }
    },
    [browser, fetchAudio, naturalEnabled, stop],
  );

  return {
    supported: naturalEnabled || browser.supported,
    speak,
    stop,
    speakingId: playingId ?? browser.speakingId,
    loadingId,
  };
}
