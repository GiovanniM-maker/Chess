"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { LESSONS } from "@/lib/learn/lessons";
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

  return (
    <div className="space-y-4">
      <section className="space-y-1">
        <h1 className="text-xl font-bold">Impara</h1>
        <p className="text-sm text-muted-foreground">
          Cinque lezioni brevi sulle cose che decidono davvero le partite. Ognuna si collega agli
          errori delle tue review.
        </p>
      </section>

      <div className="space-y-3">
        {LESSONS.map((lesson, index) => {
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
                    <span className="block font-semibold">
                      {index + 1}. {lesson.title}
                    </span>
                    <span className="block text-sm text-muted-foreground">{lesson.objective}</span>
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
    </div>
  );
}
