"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MAX_SECONDS = 30;
const TARGET_RATE = 16000;

/** Convertit un enregistrement (webm/opus…) en WAV 16 kHz mono, encodé en base64. */
async function toWavBase64(blob: Blob): Promise<string> {
  const ctx = new AudioContext();
  try {
    const decoded = await ctx.decodeAudioData(await blob.arrayBuffer());
    const length = Math.max(1, Math.ceil(decoded.duration * TARGET_RATE));
    const offline = new OfflineAudioContext(1, length, TARGET_RATE);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start();
    const rendered = await offline.startRendering();
    const samples = rendered.getChannelData(0);

    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    const writeString = (offset: number, s: string) => {
      for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
    };
    writeString(0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, TARGET_RATE, true);
    view.setUint32(28, TARGET_RATE * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, "data");
    view.setUint32(40, samples.length * 2, true);
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }

    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }
    return btoa(binary);
  } finally {
    void ctx.close();
  }
}

export type RecorderState = "idle" | "recording" | "processing";

/** Enregistre le micro et renvoie l'audio en WAV base64, prêt pour la transcription. */
export function useRecorder() {
  const [state, setState] = useState<RecorderState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const resolveRef = useRef<((audio: string | null) => void) | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const [supported, setSupported] = useState(false);
  useEffect(() => {
    setSupported(typeof MediaRecorder !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia));
  }, []);

  /** Démarre l'enregistrement. La promesse renvoie l'audio quand on appelle stop(). */
  const start = useCallback(async (): Promise<string | null> => {
    setError(null);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (e) {
      const name = (e as { name?: string }).name;
      setError(
        name === "NotAllowedError"
          ? "Accès au micro refusé. Clique sur le cadenas à gauche de l'adresse et autorise le micro."
          : "Aucun micro détecté.",
      );
      return null;
    }
    streamRef.current = stream;
    const recorder = new MediaRecorder(stream);
    recorderRef.current = recorder;
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };

    const result = new Promise<string | null>((resolve) => {
      resolveRef.current = resolve;
      recorder.onstop = async () => {
        cleanup();
        setState("processing");
        try {
          const blob = new Blob(chunks, { type: recorder.mimeType });
          resolve(blob.size ? await toWavBase64(blob) : null);
        } catch {
          setError("Impossible de lire l'enregistrement.");
          resolve(null);
        }
      };
    });

    recorder.start();
    setSeconds(0);
    setState("recording");
    const startedAt = Date.now();
    timerRef.current = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setSeconds(elapsed);
      if (elapsed >= MAX_SECONDS && recorder.state === "recording") recorder.stop();
    }, 250);
    return result;
  }, [cleanup]);

  const stop = useCallback(() => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  const done = useCallback(() => setState("idle"), []);

  return { supported, state, seconds, error, setError, start, stop, done };
}
