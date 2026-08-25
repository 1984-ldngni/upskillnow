"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getCourseBySlug,
  getLessonById,
  getLessonsForCourseSlug,
  getCompletedLessonIds,
  setLessonComplete,
  type Course,
  type Lesson,
  type LessonDetail,
} from "@/lib/data";
import { useAuth } from "@/lib/auth-context";
import { getSupabaseClient } from "@/lib/supabase/client";
import { ArrowLeft, ArrowRight, FileText, Headphones, Video, Lock } from "lucide-react";

// Renders lesson.bodyText, which uses a light convention rather than full
// markdown: paragraphs separated by a blank line, and lines starting with
// "- " rendered as a bullet list. Keeps content authoring simple (plain text
// in the DB) without pulling in a markdown parser for what's still a small
// amount of content.
function LessonBody({ text }: { text: string }) {
  const blocks = text.trim().split(/\n\n+/);
  return (
    <div className="space-y-4 text-sm leading-relaxed">
      {blocks.map((block, i) => {
        const lines = block.split("\n").filter(Boolean);
        const isList = lines.length > 0 && lines.every((l) => l.trim().startsWith("- "));
        if (isList) {
          return (
            <ul key={i} className="list-disc space-y-1.5 pl-5">
              {lines.map((l, j) => (
                <li key={j}>{l.trim().replace(/^-\s*/, "")}</li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{block}</p>;
      })}
    </div>
  );
}

export default function LessonDetailPage() {
  const params = useParams<{ slug: string; lessonId: string }>();
  const router = useRouter();
  const { loading: authLoading, userId, profile } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [siblingLessons, setSiblingLessons] = useState<Lesson[]>([]);
  const [complete, setComplete] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      router.push(`/auth?next=/courses/${params.slug}/lessons/${params.lessonId}`);
      return;
    }
    Promise.all([
      getCourseBySlug(params.slug),
      getLessonById(params.lessonId),
      getLessonsForCourseSlug(params.slug),
      getCompletedLessonIds(),
    ]).then(([c, l, siblings, completedIds]) => {
      if (!c || !l) {
        setNotFound(true);
        setDataLoading(false);
        return;
      }
      setCourse(c);
      setLesson(l);
      setSiblingLessons(siblings);
      setComplete(completedIds.has(l.id));
      setDataLoading(false);
    });
  }, [authLoading, userId, params.slug, params.lessonId, router]);

  async function toggleComplete() {
    if (!lesson || !course) return;
    const next = !complete;
    setComplete(next);
    await setLessonComplete(lesson.id, next);
    if (next) {
      try {
        const supabase = getSupabaseClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.access_token) {
          fetch("/api/notifications/progress-check", {
            method: "POST",
            headers: { "content-type": "application/json", authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({ courseSlug: course.slug }),
          }).catch(() => {});
        }
      } catch {
        // Non-critical.
      }
    }
  }

  if (authLoading || !userId || dataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (notFound || !course || !lesson) {
    return (
      <AppShell maxWidth="max-w-3xl">
        <p className="text-muted-foreground">Lesson not found.</p>
      </AppShell>
    );
  }

  const locked = lesson.isPremium && profile?.plan === "free";
  const index = siblingLessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = index > 0 ? siblingLessons[index - 1] : null;
  const nextLesson = index >= 0 && index < siblingLessons.length - 1 ? siblingLessons[index + 1] : null;

  return (
    <AppShell maxWidth="max-w-3xl">
      <Link
        href={`/courses/${course.slug}`}
        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to {course.title}
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <h1 className="font-heading text-2xl font-black">
          Lesson {index >= 0 ? index + 1 : ""}: {lesson.title}
        </h1>
        {lesson.isPremium && <Badge variant="purple">Pro</Badge>}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{lesson.duration} micro-lesson</p>

      <div className="mt-6 rounded-md border-2 border-black bg-card p-6 shadow-brutal">
        {locked ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <Lock className="h-8 w-8 text-muted-foreground" />
            <p className="font-heading text-lg font-black">This lesson is Pro-only</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Upgrade to a Pro or Team plan to unlock this lesson and the rest of the premium content in this course.
            </p>
            <Link href="/#pricing">
              <Button className="mt-1">Upgrade to unlock</Button>
            </Link>
          </div>
        ) : (
          <Tabs defaultValue="text">
            <TabsList>
              <TabsTrigger value="text">
                <FileText className="h-4 w-4 text-primary" />
                Read
              </TabsTrigger>
              <TabsTrigger value="audio">
                <Headphones className="h-4 w-4 text-amber-500" />
                Listen
              </TabsTrigger>
              <TabsTrigger value="video">
                <Video className="h-4 w-4 text-accent" />
                Watch
              </TabsTrigger>
            </TabsList>

            <div className="relative z-10 -mt-[2px] rounded-b-md rounded-tr-md pt-6">
              <TabsContent value="text">
                {lesson.bodyText ? (
                  <LessonBody text={lesson.bodyText} />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    The written version of this lesson isn't ready yet — check back soon.
                  </p>
                )}
              </TabsContent>

              <TabsContent value="audio">
                {lesson.audioUrl ? (
                  <audio controls className="w-full" src={lesson.audioUrl} />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    The audio version of this lesson isn't ready yet — check back soon.
                  </p>
                )}
              </TabsContent>

              <TabsContent value="video">
                {lesson.videoUrl ? (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <video controls className="w-full rounded-md border-2 border-black" src={lesson.videoUrl} />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    The video version of this lesson isn't ready yet — check back soon.
                  </p>
                )}
              </TabsContent>
            </div>
          </Tabs>
        )}
      </div>

      {!locked && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Button variant={complete ? "secondary" : "outline"} onClick={toggleComplete}>
            {complete ? "Completed" : "Mark complete"}
          </Button>

          <div className="flex items-center gap-2">
            {prevLesson && (
              <Link href={`/courses/${course.slug}/lessons/${prevLesson.id}`}>
                <Button size="sm" variant="outline">
                  <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                  Previous
                </Button>
              </Link>
            )}
            {nextLesson && (
              <Link href={`/courses/${course.slug}/lessons/${nextLesson.id}`}>
                <Button size="sm" variant="outline">
                  Next
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
