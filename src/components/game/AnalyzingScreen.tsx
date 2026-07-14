"use client";

import type { AnalysisProgress } from "@/lib/game/use-game-controller";

export interface AnalyzingScreenProps {
  progress: AnalysisProgress | null;
}

export function AnalyzingScreen({ progress }: AnalyzingScreenProps) {
  const total = progress?.total ?? 0;
  const done = progress?.done ?? 0;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="space-y-4 py-10 text-center">
      <div
        className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary"
        role="status"
        aria-label="Analisi in corso"
      />
      <h2 className="text-lg font-semibold">Sto analizzando la partita…</h2>
      <p className="text-sm text-muted-foreground">
        {total > 0 ? `Mossa ${done} di ${total}` : "Preparazione…"}
      </p>
      <div className="mx-auto h-2 max-w-xs overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
