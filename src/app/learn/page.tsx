"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { CHAPTERS, LESSONS } from "@/lib/learn/lessons";
import type { LessonProgress } from "@/lib/learn/types";
import { listLessonProgress } from "@/lib/storage";
import { Card, CardContent } from "@/components/ui/card";

export default function LearnPage() {
  const [progress, setProgress] = React.useState<Map<string, LessonProgress> | null>(null);

  React.useEffect(() => {
    void listLessonProgress().then((all) => {
      setProgress(new Map(all.map((p) => [p.lessonId, p])));
    });
  }, []);

  const completedCount = LESSONS.filter((lesson) =>
    Boolean(progress?.get(lesson.id)?.completedAt),
  ).length;

  return (
    <div className="space-y-6">
      <section className="space-y-1">
        <h1 className="text-xl font-bold">Impara</h1>
        <p className="text-sm text-muted-foreground">
          Un percorso in {CHAPTERS.length} capitoli. Ogni lezione si collega agli errori delle tue
          review e si chiude con una missione per la prossima partita.
          {completedCount > 0 && ` Completate: ${completedCount}/${LESSONS.length}.`}
        </p>
      </section>

      {CHAPTERS.map((chapter) => {
        const lessons = LESSONS.filter((lesson) => lesson.chapter === chapter.id);
        if (lessons.length === 0) return null;
        return (
          <section key={chapter.id} className="space-y-2">
            <div>
              <h2 className="font-semibold">{chapter.title}</h2>
              <p className="text-xs text-muted-foreground">{chapter.description}</p>
            </div>
            <div className="space-y-2">
              {lessons.map((lesson) => {
                const state = progress?.get(lesson.id);
                const done = Boolean(state?.completedAt);
                const solved = state?.completedExercises.length ?? 0;
                return (
                  <Link key={lesson.id} href={`/learn/${lesson.id}`} className="block">
                    <Card className="transition-colors hover:bg-accent">
                      <CardContent className="flex items-center gap-3 p-4">
                        {done ? (
                          <CheckCircle2 className="h-6 w-6 shrink-0 text-primary" />
                        ) : (
                          <Circle className="h-6 w-6 shrink-0 text-muted-foreground" />
                        )}
                        <span className="flex-1">
                          <span className="block font-semibold">{lesson.title}</span>
                          <span className="block text-sm text-muted-foreground">
                            {lesson.objective}
                          </span>
                        </span>
                        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                          {solved}/{lesson.exercises.length}
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
