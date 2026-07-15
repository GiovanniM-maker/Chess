"use client";

import { useCallback, useEffect, useState } from "react";
import { getPlayerProfile, listGames, savePlayerProfile } from "@/lib/storage";
import {
  applyGameOutcome,
  gradeFor,
  type GameOutcome,
  type Grade,
  type PlayerProfile,
  type ProgressionEvent,
} from "./profile";
import { getMission, suggestMission, type MissionDef } from "./missions";

export interface PlayerState {
  loading: boolean;
  profile: PlayerProfile | null;
  grade: Grade | null;
  /** Missione per la prossima partita: attivata da una lezione o suggerita. */
  mission: MissionDef | null;
  /** Evento (calibrazione/promozione/retrocessione) dell'ultima partita registrata. */
  lastEvent: ProgressionEvent | null;
  /** Registra l'esito di una partita ufficiale (calibrazione o Rivale). */
  recordOutcome: (outcome: GameOutcome) => Promise<void>;
  /** Missione compiuta: se veniva da una lezione, la disattiva. */
  completeMission: () => Promise<void>;
  /** Da chiamare all'avvio di una nuova partita: azzera l'evento precedente. */
  beginGame: () => void;
}

/** Stato del giocatore (Rivale, grado, missione) condiviso tra home e partita. */
export function usePlayer(): PlayerState {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [mission, setMission] = useState<MissionDef | null>(null);
  const [lastEvent, setLastEvent] = useState<ProgressionEvent | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.all([getPlayerProfile(), listGames()]).then(([loaded, games]) => {
      if (!active) return;
      setProfile(loaded);
      const fromLesson = loaded.activeMission
        ? getMission(loaded.activeMission.missionId)
        : undefined;
      setMission(fromLesson ?? suggestMission(games));
    });
    return () => {
      active = false;
    };
  }, []);

  const recordOutcome = useCallback(
    async (outcome: GameOutcome) => {
      if (!profile) return;
      const { profile: next, event } = applyGameOutcome(profile, outcome, Date.now());
      await savePlayerProfile(next);
      setProfile(next);
      setLastEvent(event);
    },
    [profile],
  );

  const completeMission = useCallback(async () => {
    if (!profile?.activeMission) return;
    const next = { ...profile, activeMission: null, updatedAt: Date.now() };
    await savePlayerProfile(next);
    setProfile(next);
  }, [profile]);

  const beginGame = useCallback(() => setLastEvent(null), []);

  return {
    loading: profile === null,
    profile,
    grade: profile ? gradeFor(profile.dominatedLevel) : null,
    mission,
    lastEvent,
    recordOutcome,
    completeMission,
    beginGame,
  };
}
