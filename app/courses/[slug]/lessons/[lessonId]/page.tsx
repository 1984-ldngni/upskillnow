"use client";

import { useEffect, useMemo, useState } from "react";
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
import { usePreviewMode } from "@/lib/preview-mode-context";
import { getSupabaseClient } from "@/lib/supabase/client";
import { LessonBlocks, ReadableText, type LessonBlock } from "@/components/lesson-blocks";
import { getReadableWords, useReadAloud } from "@/lib/read-aloud";
import { ArrowLeft, ArrowRight, FileText, Headphones, Square, Video, Lock, Maximize2, Minimize2 } from "lucide-react";

// Renders lesson.bodyText, which uses a light convention rather than full
// markdown: paragraphs separated by a blank line, and lines starting with
// "- " rendered as a bullet list. Keeps content authoring simple (plain text
// in the DB) without pulling in a markdown parser for what's still a small
// amount of content.
function LessonBody({ text, activeWordIndex }: { text: string; activeWordIndex?: number }) {
  const blocks = text.trim().split(/\n\n+/);
  const counter = { current: 0 };
  return (
    <div className="space-y-4 text-sm leading-relaxed">
      {blocks.map((block, i) => {
        const lines = block.split("\n").filter(Boolean);
        const isList = lines.length > 0 && lines.every((l) => l.trim().startsWith("- "));
        if (isList) {
          return (
            <ul key={i} className="list-disc space-y-1.5 pl-5">
              {lines.map((l, j) => (
                <li key={j}>
                  <ReadableText
                    text={l.trim().replace(/^-\s*/, "")}
                    counter={counter}
                    activeWordIndex={activeWordIndex}
                    keyPrefix={`bl${i}-${j}`}
                  />
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i}>
            <ReadableText text={block} counter={counter} activeWordIndex={activeWordIndex} keyPrefix={`bp${i}`} />
          </p>
        );
      })}
    </div>
  );
}

export default function LessonDetailPage() {
  const params = useParams<{ slug: string; lessonId: string }>();
  const router = useRouter();
  const { loading: authLoading, userId, profile, isAdmin } = useAuth();
  const { previewingAsLearner } = usePreviewMode();

  const [course, setCourse] = useState<Course | null>(null);
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [siblingLessons, setSiblingLessons] = useState<Lesson[]>([]);
  const [complete, setComplete] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  // Persisted in sessionStorage (same pattern as preview-mode-context) so
  // clicking Next/Previous — a full navigation to a new lesson page, which
  // remounts this component — doesn't silently drop the user back out of
  // focus mode. Only an explicit "Exit focus mode" click should do that.
  const FOCUS_MODE_KEY = "upskillnow-lesson-focus-mode";
  const [focusMode, setFocusModeState] = useState(false);
  const [activeTab, setActiveTab] = useState("text");

  // "Listen" is a speaker icon on the Read tab rather than a separate tab —
  // it reads the lesson's narrative text (paragraphs/lists, skipping
  // interactive blocks) aloud via the browser's built-in speechSynthesis,
  // highlighting each word as it's spoken. Free, no API key, works offline.
  const readableWords = useMemo(
    () => getReadableWords((lesson?.contentBlocks as LessonBlock[] | null) ?? null, lesson?.bodyText ?? null),
    [lesson]
  );
  const { supported: ttsSupported, playing: ttsPlaying, activeIndex: ttsActiveIndex, play: playTts, stop: stopTts } =
    useReadAloud(readableWords);

  // Switching to Watch mid-narration would leave the audio playing with no
  // visible highlight or stop control, so stop it when the tab changes away.
  useEffect(() => {
    if (activeTab !== "text" && ttsPlaying) stopTts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    if (window.sessionStorage.getItem(FOCUS_MODE_KEY) === "1") setFocusModeState(true);
  }, []);

  function setFocusMode(next: boolean) {
    window.sessionStorage.setItem(FOCUS_MODE_KEY, next ? "1" : "0");
    setFocusModeState(next);
  }

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

  const hasPremiumAccess = profile?.plan === "pro" || profile?.plan === "team" || (isAdmin && previewingAsLearner);
  const locked = lesson.isPremium && !hasPremiumAccess;
  const index = siblingLessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = index > 0 ? siblingLessons[index - 1] : null;
  const nextLesson = index >= 0 && index < siblingLessons.length - 1 ? siblingLessons[index + 1] : null;

  return (
    <AppShell maxWidth={focusMode ? "max-w-7xl" : "max-w-5xl"} focusMode={focusMode}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Link
          href={`/courses/${course.slug}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to {course.title}
        </Link>
        <Button size="sm" variant="outline" onClick={() => setFocusMode(!focusMode)}>
          {focusMode ? (
            <>
              <Minimize2 className="mr-1.5 h-3.5 w-3.5" />
              Exit focus mode
            </>
          ) : (
            <>
              <Maximize2 className="mr-1.5 h-3.5 w-3.5" />
              Focus mode
            </>
          )}
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <h1 className="font-heading text-2xl font-black">
          Lesson {index >= 0 ? index + 1 : ""}: {lesson.title}
        </h1>
        {lesson.isPremium && <Badge variant="purple">Pro</Badge>}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{lesson.duration} micro-lesson</p>

      {locked ? (
        <div className="mt-6 rounded-md border-2 border-black bg-card p-6 shadow-brutal">
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
        </div>
      ) : (
        <div className={`mt-6 grid gap-6 ${lesson.imageUrl ? "md:grid-cols-2 md:items-stretch" : ""}`}>
          {lesson.imageUrl && (
            <div className="overflow-y-auto rounded-md border-2 border-black shadow-brutal md:h-[85vh] md:min-h-[760px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={lesson.imageUrl} alt={`Key takeaways from ${lesson.title}`} className="w-full" />
            </div>
          )}

          <div className={`flex flex-col rounded-md border-2 border-black bg-card p-6 shadow-brutal ${lesson.imageUrl ? "md:h-[85vh] md:min-h-[760px]" : ""}`}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 flex-1 flex-col">
              <div className="flex shrink-0 flex-wrap items-end justify-between gap-2 pr-3">
                <TabsList>
                  <TabsTrigger value="text">
                    <FileText className="h-4 w-4 text-primary" />
                    Read
                  </TabsTrigger>
                  <TabsTrigger value="video">
                    <Video className="h-4 w-4 text-accent" />
                    Watch
                  </TabsTrigger>
                </TabsList>

                {activeTab === "text" && readableWords.length > 0 && ttsSupported && (
                  <button
                    onClick={ttsPlaying ? stopTts : playTts}
                    className="mb-1 inline-flex items-center gap-1.5 rounded-full border-2 border-black bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800 shadow-brutal-sm transition-transform hover:-translate-y-0.5"
                  >
                    {ttsPlaying ? (
                      <>
                        <Square className="h-3.5 w-3.5 fill-current" />
                        Stop listening
                      </>
                    ) : (
                      <>
                        <Headphones className="h-3.5 w-3.5" />
                        Listen to this lesson
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="relative z-10 -mt-[2px] min-h-0 flex-1 overflow-y-auto rounded-b-md rounded-tr-md pr-3 pt-6">
                <TabsContent value="text">
                  {lesson.contentBlocks && lesson.contentBlocks.length > 0 ? (
                    <LessonBlocks blocks={lesson.contentBlocks as LessonBlock[]} activeWordIndex={ttsPlaying ? ttsActiveIndex : undefined} />
                  ) : lesson.bodyText ? (
                    <LessonBody text={lesson.bodyText} activeWordIndex={ttsPlaying ? ttsActiveIndex : undefined} />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      The written version of this lesson isn't ready yet — check back soon.
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
          </div>
        </div>
      )}

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
