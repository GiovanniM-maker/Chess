import type { MomentType } from "@/lib/types";
import type { Lesson } from "./types";

/**
 * Le 5 lezioni fondamentali del MVP Core (PRD §18.1). Ogni esercizio usa una
 * posizione semplice e verificabile: la correttezza delle soluzioni è
 * controllata dai test (legalità + matto dove dichiarato).
 */
export const LESSONS: Lesson[] = [
  {
    id: "pezzi-in-presa",
    title: "Non lasciare pezzi in presa",
    skill: "pezzi-in-presa",
    objective: "Riconoscere i pezzi indifesi: i tuoi da proteggere, quelli avversari da catturare.",
    explanation: [
      'Un pezzo è "in presa" quando l\'avversario può catturarlo gratis, perché nessuno lo difende.',
      "La maggior parte delle partite tra principianti si decide qui: chi regala meno pezzi vince.",
      "Prima di ogni mossa chiediti: il pezzo che ho appena mosso è difeso? E l'avversario ha lasciato qualcosa di indifeso?",
    ],
    exercises: [
      {
        id: "cattura-alfiere",
        fen: "4k3/8/8/4b3/8/8/4R2P/4K3 w - - 0 1",
        prompt: "L'alfiere nero è rimasto senza difesa: catturalo!",
        solutions: ["Rxe5"],
        hint: "Guarda la colonna della tua torre: cosa incontra salendo?",
        successText: "Esatto! Nessuno difendeva l'alfiere: cattura gratuita.",
      },
      {
        id: "cattura-cavallo",
        fen: "8/4k3/8/2n5/8/8/2R4P/4K3 w - - 0 1",
        prompt: "Un pezzo nero è in presa. Trovalo e catturalo.",
        solutions: ["Rxc5"],
        hint: "Il re nero è troppo lontano per difendere il cavallo.",
        successText: "Perfetto: il cavallo non era difeso da nessuno.",
      },
      {
        id: "cattura-donna",
        fen: "4k3/8/1q6/8/8/8/1R5P/4K3 w - - 0 1",
        prompt: "Persino la donna può restare in presa: approfittane!",
        solutions: ["Rxb6"],
        hint: "Torre e donna sono sulla stessa colonna…",
        successText: "Grande! Catturare una donna indifesa vale quasi una partita.",
      },
    ],
    triggers: ["pezzo-perso"],
    actionReminder:
      "Nella prossima partita, prima di muovere, controlla sempre se il pezzo che sposti resta protetto.",
  },
  {
    id: "ccm",
    title: "Controlla scacchi, catture e minacce",
    skill: "tattiche",
    objective: "Prendere l'abitudine di cercare le mosse forzanti, tue e dell'avversario.",
    explanation: [
      "Prima di muovere, passa in rassegna tre cose, in ordine: gli SCACCHI possibili, le CATTURE possibili, le MINACCE dell'avversario.",
      "Le mosse forzanti (scacchi e catture) obbligano l'avversario a reagire: sono le prime da considerare.",
      "E ricorda: anche l'avversario ha scacchi, catture e minacce. Chiediti sempre cosa vuole fare lui.",
    ],
    exercises: [
      {
        id: "trova-scacco",
        fen: "3k4/8/8/8/8/8/4R3/4K2N w - - 0 1",
        prompt: "Primo passo della checklist: trova lo scacco.",
        solutions: ["Re8"],
        hint: "L'ottava traversa è libera per la tua torre.",
        successText: "Giusto! Lo scacco obbliga il re nero a reagire.",
      },
      {
        id: "trova-cattura",
        fen: "k7/8/8/3p4/8/8/7P/K2R4 w - - 0 1",
        prompt: "Secondo passo: trova la cattura gratuita.",
        solutions: ["Rxd5"],
        hint: "Segui la colonna della torre.",
        successText: "Esatto: cattura senza contropartita.",
      },
      {
        id: "para-minaccia",
        fen: "6k1/5ppp/8/8/8/8/r4PPP/6K1 w - - 0 1",
        prompt:
          "Terzo passo: l'avversario minaccia matto sulla prima traversa. Crea una via di fuga per il tuo re.",
        solutions: ["h3", "g3", "h4", "g4"],
        hint: "Il tuo re è chiuso dai suoi stessi pedoni: aprigli una finestrella.",
        successText: "Perfetto: adesso Ta1 non è più matto, il re può scappare.",
      },
    ],
    triggers: ["tattica-mancata", "occasione-mancata"],
    actionReminder:
      "Nella prossima partita, prima di ogni mossa, controlla scacchi, catture e minacce — in questo ordine.",
  },
  {
    id: "sviluppo",
    title: "Sviluppa i pezzi",
    skill: "sviluppo",
    objective: "Portare cavalli e alfieri in gioco presto, verso il centro.",
    explanation: [
      "In apertura ogni mossa è preziosa: usala per portare un pezzo nuovo in gioco, non per muovere due volte lo stesso.",
      "I cavalli e gli alfieri sviluppati controllano il centro e preparano l'arrocco.",
      "La donna esce per ultima: se la porti fuori troppo presto, l'avversario la scaccia guadagnando tempo.",
    ],
    exercises: [
      {
        id: "sviluppa-cavallo",
        fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2",
        prompt: "Sviluppa un cavallo verso il centro.",
        solutions: ["Nf3", "Nc3"],
        hint: "I cavalli amano le case f3 e c3.",
        successText: "Ottimo: un pezzo nuovo in gioco, e il centro è sotto controllo.",
      },
      {
        id: "sviluppa-alfiere",
        fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
        prompt: "Il cavallo è già sviluppato: ora tocca all'alfiere.",
        solutions: ["Bc4", "Bb5"],
        hint: "L'alfiere di re ha due buone diagonali: verso f7 o verso c6.",
        successText: "Bene! Un altro pezzo sviluppato: sei pronto ad arroccare.",
      },
      {
        id: "completa-sviluppo",
        fen: "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
        prompt: "Continua lo sviluppo: un pezzo nuovo o il re al sicuro.",
        solutions: ["O-O", "Nc3", "d3"],
        hint: "Arroccare o sviluppare l'altro cavallo: entrambe ottime.",
        successText: "Esatto: niente avventure con la donna, prima si completa lo sviluppo.",
      },
    ],
    triggers: ["problema-sviluppo"],
    actionReminder: "Nella prossima partita sviluppa un pezzo nuovo a ogni mossa d'apertura.",
  },
  {
    id: "re-sicuro",
    title: "Metti al sicuro il re",
    skill: "re-sicuro",
    objective: "Arroccare presto e tenere il re protetto.",
    explanation: [
      "Il re al centro è un bersaglio: le colonne si aprono e gli scacchi piovono.",
      "L'arrocco fa due cose in una mossa: nasconde il re dietro i pedoni e attiva la torre.",
      "Regola pratica: arrocca entro la decima mossa, salvo ottimi motivi.",
    ],
    exercises: [
      {
        id: "arrocca",
        fen: "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
        prompt: "Il tuo re è ancora al centro: mettilo al sicuro.",
        solutions: ["O-O"],
        hint: "Hai già sviluppato cavallo e alfiere: la strada per l'arrocco corto è libera.",
        successText: "Perfetto: re al sicuro e torre pronta a giocare.",
      },
      {
        id: "arrocca-spagnola",
        fen: "r1bqkbnr/1ppp1ppp/p1n5/4p3/B3P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4",
        prompt: "Anche qui: prima di attaccare, sistema il re.",
        solutions: ["O-O"],
        hint: "L'ala di re è già sgombra.",
        successText: "Bene! Ora puoi pensare all'attacco senza rischi.",
      },
      {
        id: "via-di-fuga",
        fen: "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1",
        prompt:
          "Il tuo re è chiuso in casa: preparagli una via di fuga prima che sia troppo tardi.",
        solutions: ["h3", "g3", "h4", "g4"],
        hint: "Muovi un pedone davanti al re per aprire una finestrella.",
        successText: "Giusto: mai farsi sorprendere da un matto della prima traversa.",
      },
    ],
    triggers: ["re-esposto"],
    actionReminder: "Nella prossima partita arrocca entro la decima mossa.",
  },
  {
    id: "tattica-semplice",
    title: "Riconosci una tattica semplice",
    skill: "tattiche",
    objective: "Vedere forchette e matti in una mossa.",
    explanation: [
      "Una FORCHETTA attacca due pezzi contemporaneamente: l'avversario può salvarne solo uno.",
      "Il cavallo è il re delle forchette: salta dove nessuno lo aspetta.",
      "E ogni volta che dai scacco, chiediti: il re ha una casa di fuga? Se no… è matto.",
    ],
    exercises: [
      {
        id: "forchetta-cavallo",
        fen: "k3r3/8/8/1N6/8/8/7P/K7 w - - 0 1",
        prompt: "Trova la forchetta di cavallo: attacca re e torre insieme.",
        solutions: ["Nc7+", "Nc7"],
        hint: "Cerca la casa da cui il cavallo dà scacco E attacca la torre.",
        successText: "Forchetta perfetta! Il re deve muoversi e la torre è tua.",
      },
      {
        id: "matto-in-1",
        fen: "6k1/5ppp/8/8/8/8/7P/4R2K w - - 0 1",
        prompt: "C'è un matto in una mossa: trovalo.",
        solutions: ["Re8#", "Re8"],
        hint: "Il re nero è chiuso dai suoi pedoni: attaccalo sulla traversa di fondo.",
        successText: "Scacco matto! Il classico matto della prima traversa.",
      },
      {
        id: "forchetta-donna",
        fen: "3r4/8/1k6/8/8/8/3Q3P/6K1 w - - 0 1",
        prompt: "La donna può attaccare re e torre con una sola mossa.",
        solutions: ["Qd6+", "Qd6"],
        hint: "Cerca la casa da cui la donna vede sia il re (in orizzontale) sia la torre (in verticale).",
        successText: "Esatto: dopo lo scacco, la torre cade.",
      },
    ],
    triggers: ["tattica-mancata", "occasione-mancata"],
    actionReminder:
      "Nella prossima partita, quando vedi due pezzi avversari allineati o vicini, cerca la forchetta.",
  },
];

export function getLesson(id: string): Lesson | undefined {
  return LESSONS.find((lesson) => lesson.id === id);
}

/** Lezione consigliata per un tipo di errore della review. */
export function lessonForMoment(type: MomentType): Lesson | undefined {
  return LESSONS.find((lesson) => lesson.triggers.includes(type));
}

/** Confronto tra SAN ignorando i suffissi di scacco/matto ("Re8" ≡ "Re8#"). */
export function sanEquals(a: string, b: string): boolean {
  const normalize = (san: string) => san.replace(/[+#]/g, "");
  return normalize(a) === normalize(b);
}
