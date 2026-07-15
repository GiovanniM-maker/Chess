import type { PieceSymbol } from "@/lib/chess";

const GLYPHS: Partial<Record<PieceSymbol, string>> = {
  p: "♟",
  n: "♞",
  b: "♝",
  r: "♜",
  q: "♛",
};

export interface CapturedRowProps {
  /** Chi ha catturato questi pezzi (es. "Tu", "Bot"). */
  label: string;
  /** Pezzi catturati, in ordine di valore crescente. */
  pieces: PieceSymbol[];
  /** Vantaggio materiale di questo lato; mostrato solo se positivo. */
  advantage: number;
}

/**
 * Riga dei pezzi catturati da un lato, stile chess.com: glifi dei pezzi presi
 * e, se questo lato è in vantaggio, il bilancio materiale (+n). Ha un'altezza
 * fissa per non far "saltare" il layout alla prima cattura.
 */
export function CapturedRow({ label, pieces, advantage }: CapturedRowProps) {
  return (
    <div className="flex min-h-6 items-center gap-2">
      <span className="w-8 shrink-0 text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-lg leading-none tracking-tight text-muted-foreground" aria-hidden>
        {pieces.map((piece) => GLYPHS[piece] ?? "").join("")}
      </span>
      <span className="sr-only">
        {pieces.length === 0 ? "nessun pezzo catturato" : `${pieces.length} pezzi catturati`}
      </span>
      {advantage > 0 && <span className="text-xs font-semibold text-primary">+{advantage}</span>}
    </div>
  );
}
