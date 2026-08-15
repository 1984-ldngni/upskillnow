import { NextResponse } from "next/server";
import { getUserFromAccessToken, getServiceRoleClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PASSING_SCORE_RATIO = 0.6;

// Called from the client right after an action that could newly complete
// something — submitting a passing quiz, or marking the last free lesson
// done — since certificates depend on both lessons and the quiz, and
// either one can be the "last" step depending on the order someone does
// them in. Re-derives everything server-side from lesson_completions and
// quiz_attempts rather than trusting a client-supplied "I passed" flag, so
// a user can't spoof their own achievement notifications.
type Supa = ReturnType<typeof getServiceRoleClient>;

async function isCourseComplete(supabase: Supa, userId: string, courseId: string): Promise<boolean> {
  const [{ data: lessons }, { data: attempts }] = await Promise.all([
    supabase.from("lessons").select("id, is_premium").eq("course_id", courseId),
    supabase
      .from("quiz_attempts")
      .select("score, total")
      .eq("user_id", userId)
      .eq("course_id", courseId),
  ]);

  const freeLessonIds = (lessons ?? []).filter((l) => !l.is_premium).map((l) => l.id);
  if (freeLessonIds.length === 0) return false;

  const { data: completions } = await supabase
    .from("lesson_completions")
    .select("lesson_id")
    .eq("user_id", userId)
    .in("lesson_id", freeLessonIds);
  const completedIds = new Set((completions ?? []).map((c) => c.lesson_id));
  const allFreeDone = freeLessonIds.every((id) => completedIds.has(id));

  const bestRatio = (attempts ?? []).reduce((max, a) => Math.max(max, a.total > 0 ? a.score / a.total : 0), 0);
  const quizPassed = bestRatio >= PASSING_SCORE_RATIO;

  return allFreeDone && quizPassed;
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const accessToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const user = await getUserFromAccessToken(accessToken);
    if (!user) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const courseSlug = body?.courseSlug as string | undefined;
    if (!courseSlug) {
      return NextResponse.json({ error: "Missing courseSlug." }, { status: 400 });
    }

    const supabase = getServiceRoleClient();
    const { data: course } = await supabase
      .from("courses")
      .select("id, slug, title")
      .eq("slug", courseSlug)
      .maybeSingle();
    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    const { data: attempts } = await supabase
      .from("quiz_attempts")
      .select("score, total")
      .eq("user_id", user.id)
      .eq("course_id", course.id);
    const bestRatio = (attempts ?? []).reduce((max, a) => Math.max(max, a.total > 0 ? a.score / a.total : 0), 0);
    const quizPassed = bestRatio >= PASSING_SCORE_RATIO;

    if (quizPassed) {
      await createNotification({
        userId: user.id,
        type: "quiz_passed",
        title: "Quiz passed!",
        body: `You passed the quiz for "${course.title}".`,
        link: `/courses/${course.slug}`,
        relatedId: course.id,
      });
    }

    const certificateEarned = quizPassed && (await isCourseComplete(supabase, user.id, course.id));

    if (certificateEarned) {
      await createNotification({
        userId: user.id,
        type: "certificate_earned",
        title: "Certificate earned",
        body: `You've earned your certificate for "${course.title}".`,
        link: `/certificate/${course.slug}`,
        relatedId: course.id,
      });

      // Check every Learning Path this course belongs to — completing this
      // course might be what finishes the whole path.
      const { data: memberships } = await supabase
        .from("learning_path_courses")
        .select("path_id")
        .eq("course_id", course.id);

      for (const { path_id } of memberships ?? []) {
        const { data: path } = await supabase
          .from("learning_paths")
          .select("id, slug, title")
          .eq("id", path_id)
          .maybeSingle();
        if (!path) continue;

        const { data: pathCourses } = await supabase
          .from("learning_path_courses")
          .select("course_id")
          .eq("path_id", path_id);
        const courseIds = (pathCourses ?? []).map((pc) => pc.course_id);
        if (courseIds.length === 0) continue;

        const completions = await Promise.all(
          courseIds.map((id) => isCourseComplete(supabase, user.id, id))
        );
        const pathCompleted = completions.every(Boolean);

        if (pathCompleted) {
          await createNotification({
            userId: user.id,
            type: "path_certificate_earned",
            title: "Learning Path complete!",
            body: `You've completed every course in the "${path.title}" path — your path certificate is ready.`,
            link: `/certificate/path/${path.slug}`,
            relatedId: path.id,
          });
        }
      }
    }

    return NextResponse.json({ ok: true, quizPassed, certificateEarned });
  } catch (err: any) {
    console.error("Progress-check error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
