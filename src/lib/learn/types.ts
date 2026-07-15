import type { MomentType } from "@/lib/types";

/** Le 5 macro-competenze del Core (PRD §19). */
export type SkillId = "pezzi-in-presa" | "tattiche" | "sviluppo" | "re-sicuro" | "finali";

export interface LessonExercise {
  id: string;
  /** Posizione di partenza dell'esercizio. */
  fen: string;
  /** Cosa chiediamo al giocatore, in linguaggio semplice. */
  prompt: string;
  /** Mosse accettate come corrette (SAN, senza +/# obbligatori). */
  solutions: string[];
  /** Aiuto mostrato dopo il primo tentativo sbagliato. */
  hint: string;
  /** Feedback positivo alla soluzione. */
  successText: string;
}

/**
 * Una lezione è DATI, non codice (content-driven, PRD §18): aggiungerne una
 * nuova non richiede modifiche al player.
 */
/** Capitoli del percorso, nell'ordine di visualizzazione. */
export type ChapterId = "fondamenti" | "tattiche" | "aperture" | "strategia" | "finali";

export interface Lesson {
  id: string;
  title: string;
  chapter: ChapterId;
  skill: SkillId;
  objective: string;
  /** Paragrafi introduttivi, brevi e senza gergo. */
  explanation: string[];
  exercises: LessonExercise[];
  /** Tipi di errore della review che suggeriscono questa lezione. */
  triggers: MomentType[];
  /** L'unica azione concreta da portarsi nella prossima partita. */
  actionReminder: string;
}

/** Avanzamento salvato localmente per una lezione. */
export interface LessonProgress {
  lessonId: string;
  completedExercises: string[];
  completedAt: number | null;
}
