import type { AnalysisMoment, IntentionValue, MomentType } from "@/lib/types";

/**
 * Frase che riconosce l'intenzione dichiarata dal giocatore. Il feedback parte
 * sempre da ciò che il giocatore voleva fare (Principio educativo: partire
 * dall'intenzione), non dalla verità del motore.
 */
const INTENTION_BRIDGE: Record<IntentionValue, string> = {
  attaccare: "Volevi attaccare, e l'idea è giusta,",
  difendere: "Volevi difenderti,",
  sviluppare: "Volevi sviluppare,",
  catturare: "Volevi catturare,",
  "evitare-minaccia": "Volevi evitare una minaccia,",
  "non-lo-so": "",
};

/** Spiegazione del problema in base al tipo di errore. */
const TYPE_CORE: Record<MomentType, string> = {
  "pezzo-perso": "ma il pezzo che hai mosso è rimasto indifeso e l'avversario poteva conquistarlo.",
  "tattica-mancata": "ma avevi a disposizione una mossa forzante più forte che è sfuggita.",
  "problema-sviluppo":
    "ma in apertura conviene prima sviluppare i pezzi e mettere al sicuro il re.",
  "re-esposto": "ma questa mossa ha lasciato il tuo re troppo esposto.",
  "occasione-mancata": "ma in questa posizione esisteva una mossa nettamente migliore.",
};

/** Come il tipo di errore si legge quando non c'è un'intenzione dichiarata. */
const TYPE_STANDALONE: Record<MomentType, string> = {
  "pezzo-perso": "Il pezzo che hai mosso è rimasto indifeso e l'avversario poteva conquistarlo.",
  "tattica-mancata": "Avevi a disposizione una mossa forzante più forte che è sfuggita.",
  "problema-sviluppo": "In apertura conviene prima sviluppare i pezzi e mettere al sicuro il re.",
  "re-esposto": "Questa mossa ha lasciato il tuo re troppo esposto.",
  "occasione-mancata": "In questa posizione esisteva una mossa nettamente migliore.",
};

/** Azione concreta finale, una sola, orientata al comportamento futuro. */
const TYPE_ACTION: Record<MomentType, string> = {
  "pezzo-perso":
    "La prossima volta, prima di muovere, controlla se il pezzo che sposti resta protetto.",
  "tattica-mancata":
    "La prossima volta cerca sempre catture e scacchi prima di scegliere la mossa.",
  "problema-sviluppo": "La prossima volta sviluppa un nuovo pezzo verso il centro.",
  "re-esposto": "La prossima volta cerca di arroccare presto per proteggere il re.",
  "occasione-mancata": "La prossima volta valuta almeno due mosse candidate prima di decidere.",
};

/**
 * Genera una spiegazione deterministica di un momento, personalizzata in base
 * all'intenzione dichiarata. Nessuna AI: solo dati del motore + template.
 * L'output è breve (max 120 parole per Definition of Done) e termina con una
 * sola azione concreta.
 */
export function buildExplanation(moment: AnalysisMoment, intention?: IntentionValue): string {
  const bridge = intention ? INTENTION_BRIDGE[intention] : "";
  const problem = bridge ? `${bridge} ${TYPE_CORE[moment.type]}` : TYPE_STANDALONE[moment.type];
  const suggestion = `La mossa più forte era ${moment.bestSan}.`;
  const action = TYPE_ACTION[moment.type];
  return `${problem} ${suggestion} ${action}`;
}

/** Conteggio parole, utile per verificare il vincolo di lunghezza nei test. */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
