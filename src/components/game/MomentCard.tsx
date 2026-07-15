import Link from "next/link";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import type { AnalysisMoment, IntentionValue, PieceColor } from "@/lib/types";
import { buildExplanation, MOMENT_TYPE_LABELS } from "@/lib/analysis";
import { lessonForMoment } from "@/lib/learn/lessons";
import { uciSquares } from "@/lib/chess";
import { cn } from "@/lib/utils";
import { formatEval } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { BoardView } from "@/components/board/BoardView";
import { IntentionPicker } from "./IntentionPicker";

export const PLAYED_ARROW_COLOR = "#ef4444";
export const BEST_ARROW_COLOR = "#16a34a";

export interface MomentCardProps {
  index: number;
  moment: AnalysisMoment;
  playerColor: PieceColor;
  intention: IntentionValue | undefined;
  feedback: "up" | "down" | undefined;
  onSetIntention: (value: IntentionValue) => void;
  onFeedback: (value: "up" | "down") => void;
  onReplay: () => void;
}

/**
 * Scheda di un singolo errore: la POSIZIONE sulla scacchiera (freccia rossa =
 * mossa giocata, verde = migliore), mossa giocata vs migliore con valutazioni,
 * domanda sull'intenzione e spiegazione. Il replay apre la vista interattiva
 * con le varianti esplorabili.
 */
export function MomentCard({
  index,
  moment,
  playerColor,
  intention,
  feedback,
  onSetIntention,
  onFeedback,
  onReplay,
}: MomentCardProps) {
  const lesson = lessonForMoment(moment.type);
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground">Errore {index}</span>
          <Badge>{MOMENT_TYPE_LABELS[moment.type]}</Badge>
        </div>
        <span className="text-xs text-muted-foreground">Mossa {moment.moveNumber}</span>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <BoardView
            fen={moment.fenBefore}
            orientation={playerColor === "w" ? "white" : "black"}
            draggable={false}
            arrows={[
              { ...uciSquares(moment.playedUci), color: PLAYED_ARROW_COLOR },
              { ...uciSquares(moment.bestUci), color: BEST_ARROW_COLOR },
            ]}
          />
          <p className="text-center text-xs text-muted-foreground">
            <span className="font-semibold text-red-500">Rossa</span>: la tua mossa ·{" "}
            <span className="font-semibold text-primary">Verde</span>: la migliore
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border p-2">
            <div className="text-xs text-muted-foreground">La tua mossa</div>
            <div className="font-semibold">{moment.playedSan}</div>
            <div className="text-xs text-muted-foreground">
              valutazione {formatEval(moment.scoreAfterCp)}
            </div>
          </div>
          <div className="rounded-lg border border-primary/40 bg-primary/5 p-2">
            <div className="text-xs text-muted-foreground">Mossa migliore</div>
            <div className="font-semibold text-primary">{moment.bestSan}</div>
            <div className="text-xs text-muted-foreground">
              valutazione {formatEval(moment.scoreBeforeCp)}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Cosa volevi ottenere con questa mossa?</p>
          <IntentionPicker value={intention} onChange={onSetIntention} />
        </div>

        {intention ? (
          <div className="space-y-2">
            <p className="rounded-lg bg-muted p-3 text-sm leading-relaxed">
              {buildExplanation(moment, intention)}
            </p>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">Ti è stata utile?</span>
              <span className="flex gap-1">
                <button
                  type="button"
                  aria-label="Spiegazione utile"
                  aria-pressed={feedback === "up"}
                  onClick={() => onFeedback("up")}
                  className={cn(
                    "rounded-full border p-1.5 transition-colors",
                    feedback === "up"
                      ? "border-primary bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent",
                  )}
                >
                  <ThumbsUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Spiegazione non utile"
                  aria-pressed={feedback === "down"}
                  onClick={() => onFeedback("down")}
                  className={cn(
                    "rounded-full border p-1.5 transition-colors",
                    feedback === "down"
                      ? "border-destructive bg-destructive/10 text-destructive"
                      : "text-muted-foreground hover:bg-accent",
                  )}
                >
                  <ThumbsDown className="h-4 w-4" />
                </button>
              </span>
            </div>
            {lesson && (
              <Link
                href={`/learn/${lesson.id}`}
                className="block rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm hover:bg-primary/10"
              >
                📘 Lezione consigliata: <span className="font-semibold">{lesson.title}</span>
              </Link>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Scegli un&apos;intenzione per vedere la spiegazione.
          </p>
        )}

        <Button variant="outline" size="sm" onClick={onReplay} className="w-full">
          Rigioca ed esplora le varianti
        </Button>
      </CardContent>
    </Card>
  );
}
