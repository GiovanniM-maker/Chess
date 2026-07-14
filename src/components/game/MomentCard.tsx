import type { AnalysisMoment, IntentionValue } from "@/lib/types";
import { buildExplanation, MOMENT_TYPE_LABELS } from "@/lib/analysis";
import { formatEval } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { IntentionPicker } from "./IntentionPicker";

export interface MomentCardProps {
  index: number;
  moment: AnalysisMoment;
  intention: IntentionValue | undefined;
  onSetIntention: (value: IntentionValue) => void;
  onReplay: () => void;
}

/**
 * Scheda di un singolo errore: mossa giocata vs migliore, valutazioni, domanda
 * sull'intenzione e — solo dopo aver risposto — la spiegazione educativa.
 */
export function MomentCard({
  index,
  moment,
  intention,
  onSetIntention,
  onReplay,
}: MomentCardProps) {
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
          <p className="rounded-lg bg-muted p-3 text-sm leading-relaxed">
            {buildExplanation(moment, intention)}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Scegli un&apos;intenzione per vedere la spiegazione.
          </p>
        )}

        <Button variant="outline" size="sm" onClick={onReplay} className="w-full">
          Rigioca la posizione
        </Button>
      </CardContent>
    </Card>
  );
}
