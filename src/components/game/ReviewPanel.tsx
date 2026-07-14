"use client";

import type { AnalysisMoment, IntentionValue, PieceColor } from "@/lib/types";
import { MomentCard } from "./MomentCard";

export interface ReviewPanelProps {
  moments: AnalysisMoment[];
  intentions: Record<string, IntentionValue>;
  playerColor: PieceColor;
  onSetIntention: (momentId: string, value: IntentionValue) => void;
  onOpenReplay: (momentId: string) => void;
}

/**
 * Elenco dei momenti educativi. Presentazionale: usato sia dopo la partita in
 * corso sia rivedendo una partita dallo storico.
 */
export function ReviewPanel({
  moments,
  intentions,
  onSetIntention,
  onOpenReplay,
}: ReviewPanelProps) {
  if (moments.length === 0) {
    return (
      <p className="rounded-lg bg-muted p-4 text-center text-sm text-muted-foreground">
        Nessun errore rilevante trovato in questa partita. Ottimo lavoro!
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Ecco i {moments.length === 1 ? "tuo errore" : `tuoi ${moments.length} errori`} più
        istruttivi. Per ciascuno, dicci cosa volevi ottenere.
      </p>
      {moments.map((moment, index) => (
        <MomentCard
          key={moment.id}
          index={index + 1}
          moment={moment}
          intention={intentions[moment.id]}
          onSetIntention={(value) => onSetIntention(moment.id, value)}
          onReplay={() => onOpenReplay(moment.id)}
        />
      ))}
    </div>
  );
}
