import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCourseBySlug, getLessonsForCourseSlug, getQuizForCourseSlug } from "@/lib/data";
import { PlayCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CourseLessonPage({ params }: { params: { slug: string } }) {
  const course = await getCourseBySlug(params.slug);
  if (!course) notFound();

  const [lessons, quiz] = await Promise.all([
    getLessonsForCourseSlug(params.slug),
    getQuizForCourseSlug(params.slug),
  ]);
  const hasQuiz = quiz.length > 0;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <h1 className="font-heading text-3xl font-black">{course.title}</h1>
        <p className="mt-2 text-muted-foreground">{course.description}</p>

        <div className="mt-8 space-y-3">
          {lessons.map((lesson, i) => (
            <Card key={lesson.title}>
              <CardHeader className="flex-row items-center justify-between space-y-0 p-4">
                <div className="flex items-center gap-3">
                  <PlayCircle className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-sm">Lesson {i + 1}: {lesson.title}</CardTitle>
                    <p className="text-xs text-muted-foreground">{lesson.duration} audio micro-lesson</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">Play</Button>
              </CardHeader>
            </Card>
          ))}
        </div>

        {hasQuiz && (
          <div className="mt-8">
            <Link href={`/quiz/${course.slug}`}>
              <Button>Take the quiz</Button>
            </Link>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
