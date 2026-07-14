export interface MoveListProps {
  moves: string[];
}

interface MoveRow {
  number: number;
  white: string;
  black: string | null;
}

/** Cronologia delle mosse in notazione algebrica, a coppie bianco/nero. */
export function MoveList({ moves }: MoveListProps) {
  if (moves.length === 0) {
    return <p className="text-sm text-muted-foreground">Nessuna mossa giocata.</p>;
  }

  const rows: MoveRow[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    rows.push({
      number: i / 2 + 1,
      white: moves[i] ?? "",
      black: moves[i + 1] ?? null,
    });
  }

  return (
    <div className="max-h-40 overflow-y-auto rounded-lg border bg-muted/40 p-2 text-sm">
      <ol className="grid grid-cols-[auto_1fr_1fr] gap-x-3 gap-y-1 tabular-nums">
        {rows.map((row) => (
          <li key={row.number} className="contents">
            <span className="text-muted-foreground">{row.number}.</span>
            <span className="font-medium">{row.white}</span>
            <span className="font-medium">{row.black ?? ""}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
