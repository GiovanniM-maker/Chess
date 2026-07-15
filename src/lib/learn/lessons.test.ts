import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import { LESSONS, getLesson, lessonForMoment, sanEquals } from "./lessons";

/** Ogni soluzione dichiarata deve essere una mossa legale nella sua posizione. */
describe("lezioni: posizioni verificate", () => {
  for (const lesson of LESSONS) {
    describe(lesson.title, () => {
      it("ha almeno 2 esercizi e un'azione finale", () => {
        expect(lesson.exercises.length).toBeGreaterThanOrEqual(2);
        expect(lesson.actionReminder.length).toBeGreaterThan(10);
      });

      for (const exercise of lesson.exercises) {
        it(`esercizio "${exercise.id}": FEN valida e soluzioni legali`, () => {
          const legalSan = new Chess(exercise.fen).moves();
          for (const solution of exercise.solutions) {
            const found = legalSan.some((san) => sanEquals(san, solution));
            expect(found, `${solution} non è legale in ${exercise.fen}`).toBe(true);
          }
        });

        it(`esercizio "${exercise.id}": i suffissi # e + dichiarati sono veri`, () => {
          // Una soluzione scritta "...#" DEVE dare matto; "...+" DEVE dare scacco.
          for (const solution of exercise.solutions) {
            if (!solution.endsWith("#") && !solution.endsWith("+")) continue;
            const chess = new Chess(exercise.fen);
            chess.move(solution.replace(/[+#]/g, ""));
            if (solution.endsWith("#")) {
              expect(chess.isCheckmate(), `${solution} non è matto in ${exercise.fen}`).toBe(true);
            } else {
              expect(chess.inCheck(), `${solution} non è scacco in ${exercise.fen}`).toBe(true);
            }
          }
        });
      }
    });
  }

  it("il matto in 1 della lezione tattica dà davvero matto", () => {
    const exercise = getLesson("tattica-semplice")!.exercises.find((e) => e.id === "matto-in-1")!;
    const chess = new Chess(exercise.fen);
    chess.move("Re8");
    expect(chess.isCheckmate()).toBe(true);
  });

  it("le catture della lezione pezzi-in-presa sono davvero gratuite", () => {
    // Dopo la cattura, il pezzo catturante non deve poter essere ricatturato.
    const lesson = getLesson("pezzi-in-presa")!;
    for (const exercise of lesson.exercises) {
      const chess = new Chess(exercise.fen);
      const move = chess.move(exercise.solutions[0]!.replace(/[+#]/g, ""));
      const recaptures = chess
        .moves({ verbose: true })
        .filter((reply) => reply.to === move.to && reply.captured);
      expect(recaptures, `${exercise.id}: la cattura non era gratuita`).toHaveLength(0);
    }
  });

  it("ogni tipo di errore della review ha una lezione consigliata", () => {
    expect(lessonForMoment("pezzo-perso")?.id).toBe("pezzi-in-presa");
    expect(lessonForMoment("tattica-mancata")?.id).toBe("ccm");
    expect(lessonForMoment("occasione-mancata")?.id).toBe("ccm");
    expect(lessonForMoment("problema-sviluppo")?.id).toBe("sviluppo");
    expect(lessonForMoment("re-esposto")?.id).toBe("re-sicuro");
  });

  it("sanEquals ignora i suffissi di scacco e matto", () => {
    expect(sanEquals("Re8#", "Re8")).toBe(true);
    expect(sanEquals("Nc7+", "Nc7")).toBe(true);
    expect(sanEquals("Nf3", "Nc3")).toBe(false);
  });
});
