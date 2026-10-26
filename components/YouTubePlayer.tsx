"use client";

import { useEffect, useRef } from "react";
import { saveWatchProgress, type SaveProgressResult } from "@/app/actions/progress";
import type { Range } from "@/lib/types";

// Parte mínima da API do player do YouTube que usamos.
type YTPlayer = {
  getCurrentTime(): number;
  getPlayerState(): number;
  destroy(): void;
};

type YTNamespace = {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      width: string;
      height: string;
      playerVars: Record<string, string | number>;
      events: {
        onReady: () => void;
        onStateChange: (event: { data: number }) => void;
      };
    },
  ) => YTPlayer;
};

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const STATE_ENDED = 0;
const STATE_PLAYING = 1;
const STATE_PAUSED = 2;

const SAVE_EVERY_SECONDS = 10;
// Entre dois "tiques" de 1s o vídeo avança até 2s (velocidade 2x). Mais que isso = pulou no vídeo.
const MAX_STEP = 3;

let apiPromise: Promise<YTNamespace> | null = null;

function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!apiPromise) {
    apiPromise = new Promise((resolve) => {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previous?.();
        resolve(window.YT as YTNamespace);
      };
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(script);
    });
  }
  return apiPromise;
}

function toRanges(seconds: number[]): Range[] {
  const sorted = [...seconds].sort((a, b) => a - b);
  const ranges: Range[] = [];
  for (const s of sorted) {
    const last = ranges[ranges.length - 1];
    if (last && s === last[1]) last[1] = s + 1;
    else ranges.push([s, s + 1]);
  }
  return ranges;
}

// Player do YouTube que conta só os segundos REALMENTE assistidos:
// pular para a frente não conta, e o progresso é salvo a cada 10s e ao pausar.
export default function YouTubePlayer({
  lessonId,
  videoId,
  startAt,
  onSaved,
}: {
  lessonId: string;
  videoId: string;
  startAt: number;
  onSaved: (result: SaveProgressResult) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const onSavedRef = useRef(onSaved);

  useEffect(() => {
    onSavedRef.current = onSaved;
  });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let player: YTPlayer | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;
    let previous: number | null = null; // último segundo visto enquanto tocava
    let sinceSave = 0;
    let saving = false;
    const pending = new Set<number>(); // segundos assistidos ainda não salvos

    // Soma os segundos que passaram desde a última leitura (se foi reprodução normal).
    function capture() {
      if (!player || previous === null) return;
      const current = Math.floor(player.getCurrentTime());
      const step = current - previous;
      if (step >= 0 && step <= MAX_STEP) {
        for (let s = previous; s < current; s++) pending.add(s);
      }
      previous = current;
    }

    async function flush() {
      if (saving || pending.size === 0) return;
      saving = true;
      const batch = [...pending];
      try {
        const position = player?.getCurrentTime() ?? 0;
        const result = await saveWatchProgress(lessonId, toRanges(batch), position);
        if (result.ok) batch.forEach((s) => pending.delete(s));
        onSavedRef.current(result);
      } catch {
        // Sem rede? Mantém pendente e tenta de novo no próximo ciclo.
      } finally {
        saving = false;
      }
    }

    function tick() {
      if (!player) return;
      if (player.getPlayerState() !== STATE_PLAYING) {
        previous = null;
        return;
      }
      if (previous === null) {
        previous = Math.floor(player.getCurrentTime());
      } else {
        capture();
      }
      sinceSave += 1;
      if (sinceSave >= SAVE_EVERY_SECONDS) {
        sinceSave = 0;
        void flush();
      }
    }

    function onVisibility() {
      if (document.visibilityState === "hidden") {
        capture();
        void flush();
      }
    }

    loadYouTubeApi().then((YT) => {
      if (disposed || !hostRef.current) return;
      const target = document.createElement("div");
      host.appendChild(target);

      player = new YT.Player(target, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          ...(startAt > 5 ? { start: Math.floor(startAt) } : {}),
        },
        events: {
          onReady: () => {
            timer = setInterval(tick, 1000);
          },
          onStateChange: (event) => {
            if (event.data === STATE_PAUSED || event.data === STATE_ENDED) {
              capture();
              previous = null;
              void flush();
            }
          },
        },
      });
    });

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onVisibility);

    return () => {
      disposed = true;
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onVisibility);
      try {
        capture();
        void flush();
        player?.destroy();
      } catch {
        // player já destruído
      }
      host.replaceChildren();
    };
  }, [lessonId, videoId, startAt]);

  return (
    <div
      ref={hostRef}
      className="aspect-video w-full overflow-hidden rounded-xl bg-black [&_iframe]:h-full [&_iframe]:w-full"
    />
  );
}
