import { getSupabaseClient } from "@/lib/supabase/client";
import { logClientError } from "@/lib/error-logger";

export type Tool = {
  slug: string;
  name: string;
  category: string;
  subcategory: string;
  description: string;
  websiteUrl: string;
  targetIndustry: string;
  difficultyLevel: string;
  pricingTier: string;
  marketSegment: string;
};

export type Course = {
  id: string;
  slug: string;
  title: string;
  level: string;
  description: string;
  toolSlug: string | null;
};

export type Lesson = { id: string; title: string; duration: string; isPremium: boolean };

export type QuizQuestion = { question: string; options: string[]; answerIndex: number };

export async function getTools(): Promise<Tool[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("tools")
    .select("slug, name, description, website_url, target_industry, difficulty_level, pricing_tier, market_segment, subcategories(name, categories(name))")
    .order("name");

  if (error || !data) {
    if (error) logClientError(`getTools failed: ${error.message}`, { context: { table: "tools" } });
    return [];
  }

  return data.map((t: any) => ({
    slug: t.slug,
    name: t.name,
    description: t.description ?? "",
    websiteUrl: t.website_url ?? "",
    targetIndustry: t.target_industry ?? "",
    difficultyLevel: t.difficulty_level ?? "",
    pricingTier: t.pricing_tier ?? "",
    marketSegment: t.market_segment ?? "",
    category: t.subcategories?.categories?.name ?? "Uncategorized",
    subcategory: t.subcategories?.name ?? "",
  }));
}

export async function getToolBySlug(slug: string): Promise<Tool | null> {
  const tools = await getTools();
  return tools.find((t) => t.slug === slug) ?? null;
}

export async function getCourses(): Promise<Course[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("courses")
    .select("id, slug, title, level, description, tool_slug")
    .order("title");

  if (error || !data) {
    if (error) logClientError(`getCourses failed: ${error.message}`, { context: { table: "courses" } });
    return [];
  }
  return data.map((c: any) => ({
    id: c.id,
    slug: c.slug,
    title: c.title,
    level: c.level,
    description: c.description,
    toolSlug: c.tool_slug ?? null,
  }));
}

// Rough total minutes per course, summed across all lessons (free + Pro), parsed
// from strings like "5 min". Used for the "time to complete" catalog filter.
export async function getCourseDurationsMinutes(courseIds: string[]): Promise<Record<string, number>> {
  if (courseIds.length === 0) return {};
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("lessons")
    .select("course_id, duration")
    .in("course_id", courseIds);

  if (error || !data) return {};
  const totals: Record<string, number> = {};
  for (const l of data as any[]) {
    const minutes = parseInt(String(l.duration).match(/\d+/)?.[0] ?? "0", 10);
    totals[l.course_id] = (totals[l.course_id] ?? 0) + minutes;
  }
  return totals;
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("courses")
    .select("id, slug, title, level, description, tool_slug")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    if (error) logClientError(`getCourseBySlug failed: ${error.message}`, { context: { table: "courses", slug } });
    return null;
  }
  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    level: data.level,
    description: data.description,
    toolSlug: data.tool_slug ?? null,
  };
}

export async function getCourseByToolSlug(toolSlug: string): Promise<Course | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("courses")
    .select("id, slug, title, level, description, tool_slug")
    .eq("tool_slug", toolSlug)
    .maybeSingle();

  if (error || !data) return null;
  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    level: data.level,
    description: data.description,
    toolSlug: data.tool_slug ?? null,
  };
}

export async function getLessonsForCourseSlug(slug: string): Promise<Lesson[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("lessons")
    .select("id, title, duration, position, is_premium, courses!inner(slug)")
    .eq("courses.slug", slug)
    .order("position");

  if (error || !data) {
    if (error) logClientError(`getLessonsForCourseSlug failed: ${error.message}`, { context: { table: "lessons", slug } });
    return [];
  }
  return data.map((l: any) => ({ id: l.id, title: l.title, duration: l.duration, isPremium: l.is_premium ?? false }));
}

// --- Progress tracking: lesson completions, quiz attempts, certificates.
// All scoped to the current signed-in user via RLS ("Users manage own ...").

const PASSING_SCORE_RATIO = 0.6;

export async function getCompletedLessonIds(): Promise<Set<string>> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Set();

  const { data, error } = await supabase
    .from("lesson_completions")
    .select("lesson_id")
    .eq("user_id", user.id);

  if (error || !data) return new Set();
  return new Set(data.map((r: any) => r.lesson_id as string));
}

export async function setLessonComplete(lessonId: string, completed: boolean): Promise<void> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  if (completed) {
    await supabase
      .from("lesson_completions")
      .upsert({ user_id: user.id, lesson_id: lessonId }, { onConflict: "user_id,lesson_id" });
  } else {
    await supabase
      .from("lesson_completions")
      .delete()
      .eq("user_id", user.id)
      .eq("lesson_id", lessonId);
  }
}

export type QuizAttempt = { score: number; total: number; completedAt: string };

export async function saveQuizAttempt(courseId: string, score: number, total: number): Promise<void> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("quiz_attempts").insert({ user_id: user.id, course_id: courseId, score, total });
}

export async function getBestQuizAttempt(courseId: string): Promise<QuizAttempt | null> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("quiz_attempts")
    .select("score, total, completed_at")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .order("score", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return { score: data.score, total: data.total, completedAt: data.completed_at };
}

export function isQuizPassed(attempt: QuizAttempt | null): boolean {
  if (!attempt || attempt.total === 0) return false;
  return attempt.score / attempt.total >= PASSING_SCORE_RATIO;
}

export type CourseProgress = Course & {
  totalFreeLessons: number;
  completedFreeLessons: number;
  quizPassed: boolean;
  certificateEarned: boolean;
};

export async function getCoursesWithProgress(): Promise<CourseProgress[]> {
  const supabase = getSupabaseClient();
  const courses = await getCourses();
  if (courses.length === 0) return [];

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: lessons }, completedIds, { data: attempts }] = await Promise.all([
    supabase
      .from("lessons")
      .select("id, course_id, is_premium")
      .in(
        "course_id",
        courses.map((c) => c.id)
      ),
    getCompletedLessonIds(),
    user
      ? supabase.from("quiz_attempts").select("course_id, score, total").eq("user_id", user.id)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const bestByCourse = new Map<string, { score: number; total: number }>();
  for (const a of attempts ?? []) {
    const existing = bestByCourse.get(a.course_id);
    if (!existing || a.score > existing.score) bestByCourse.set(a.course_id, { score: a.score, total: a.total });
  }

  return courses.map((c) => {
    const courseLessons = (lessons ?? []).filter((l: any) => l.course_id === c.id);
    const freeLessons = courseLessons.filter((l: any) => !l.is_premium);
    const completedFreeLessons = freeLessons.filter((l: any) => completedIds.has(l.id)).length;
    const attempt = bestByCourse.get(c.id) ?? null;
    const quizPassed = attempt ? attempt.score / attempt.total >= PASSING_SCORE_RATIO : false;
    return {
      ...c,
      totalFreeLessons: freeLessons.length,
      completedFreeLessons,
      quizPassed,
      certificateEarned: freeLessons.length > 0 && completedFreeLessons === freeLessons.length && quizPassed,
    };
  });
}

export async function getQuizForCourseSlug(slug: string): Promise<QuizQuestion[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("quiz_questions")
    .select("question, options, answer_index, position, courses!inner(slug)")
    .eq("courses.slug", slug)
    .order("position");

  if (error || !data) {
    if (error) logClientError(`getQuizForCourseSlug failed: ${error.message}`, { context: { table: "quiz_questions", slug } });
    return [];
  }
  return data.map((q: any) => ({
    question: q.question,
    options: q.options as string[],
    answerIndex: q.answer_index,
  }));
}

export type LearningPath = {
  slug: string;
  title: string;
  description: string;
  level: string;
  courses: Course[];
};

export async function getLearningPaths(): Promise<LearningPath[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("learning_paths")
    .select(
      "slug, title, description, level, learning_path_courses(position, courses(id, slug, title, level, description, tool_slug))"
    )
    .order("title");

  if (error || !data) {
    if (error) logClientError(`getLearningPaths failed: ${error.message}`, { context: { table: "learning_paths" } });
    return [];
  }

  return data.map((p: any) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    level: p.level,
    courses: (p.learning_path_courses ?? [])
      .sort((a: any, b: any) => a.position - b.position)
      .map((lpc: any) => ({
        id: lpc.courses.id,
        slug: lpc.courses.slug,
        title: lpc.courses.title,
        level: lpc.courses.level,
        description: lpc.courses.description,
        toolSlug: lpc.courses.tool_slug ?? null,
      })),
  }));
}

export async function getLearningPathBySlug(slug: string): Promise<LearningPath | null> {
  const paths = await getLearningPaths();
  return paths.find((p) => p.slug === slug) ?? null;
}

// Per-course completion (same rule as a course certificate: every free lesson
// done + quiz passed), for a given set of course IDs. Reused by both the
// dashboard and Learning Path progress/certificate views.
export type CourseCompletion = { completed: boolean; completedAt: string | null };

export async function getCourseCompletionMap(courseIds: string[]): Promise<Map<string, CourseCompletion>> {
  const map = new Map<string, CourseCompletion>();
  if (courseIds.length === 0) return map;

  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    for (const id of courseIds) map.set(id, { completed: false, completedAt: null });
    return map;
  }

  const [{ data: lessons }, completedIds, { data: attempts }] = await Promise.all([
    supabase.from("lessons").select("id, course_id, is_premium").in("course_id", courseIds),
    getCompletedLessonIds(),
    supabase
      .from("quiz_attempts")
      .select("course_id, score, total, completed_at")
      .eq("user_id", user.id)
      .in("course_id", courseIds),
  ]);

  const bestByCourse = new Map<string, { score: number; total: number; completedAt: string }>();
  for (const a of attempts ?? []) {
    const existing = bestByCourse.get(a.course_id);
    if (!existing || a.score > existing.score) {
      bestByCourse.set(a.course_id, { score: a.score, total: a.total, completedAt: a.completed_at });
    }
  }

  for (const courseId of courseIds) {
    const courseLessons = (lessons ?? []).filter((l: any) => l.course_id === courseId);
    const freeLessons = courseLessons.filter((l: any) => !l.is_premium);
    const allFreeDone = freeLessons.length > 0 && freeLessons.every((l: any) => completedIds.has(l.id));
    const attempt = bestByCourse.get(courseId) ?? null;
    const quizPassed = attempt ? attempt.score / attempt.total >= 0.6 : false;
    map.set(courseId, {
      completed: allFreeDone && quizPassed,
      completedAt: allFreeDone && quizPassed ? attempt!.completedAt : null,
    });
  }

  return map;
}

export type LearningPathProgress = {
  path: LearningPath;
  completionByCourseSlug: Map<string, CourseCompletion>;
  pathCompleted: boolean;
  latestCompletionDate: string | null;
};

export async function getLearningPathProgress(slug: string): Promise<LearningPathProgress | null> {
  const path = await getLearningPathBySlug(slug);
  if (!path) return null;

  const completionMap = await getCourseCompletionMap(path.courses.map((c) => c.id));
  const completionByCourseSlug = new Map<string, CourseCompletion>();
  let latest: string | null = null;

  for (const c of path.courses) {
    const entry = completionMap.get(c.id) ?? { completed: false, completedAt: null };
    completionByCourseSlug.set(c.slug, entry);
    if (entry.completedAt && (!latest || entry.completedAt > latest)) latest = entry.completedAt;
  }

  const pathCompleted = path.courses.length > 0 && path.courses.every((c) => completionByCourseSlug.get(c.slug)?.completed);

  return {
    path,
    completionByCourseSlug,
    pathCompleted,
    latestCompletionDate: pathCompleted ? latest : null,
  };
}

// Dashboard "recommended for you" — points the learner at a Learning Path
// (specialization) instead of a random tool, on the theory that someone
// dabbling in scattered courses is better served by a nudge toward
// finishing a themed track than by an arbitrary "here's another tool."
export type RecommendedPath = {
  status: "in-progress" | "no-path-progress" | "all-completed";
  path: LearningPath | null;
  nextCourse: Course | null;
  completedCount: number;
  totalCount: number;
  // True if the learner has started *any* course, even one that isn't part
  // of a tracked path — lets the dashboard say "explore a specialization"
  // instead of "you haven't started anything" when that'd be misleading.
  hasAnyCourseProgress: boolean;
};

export async function getRecommendedPath(): Promise<RecommendedPath> {
  const [paths, progressList] = await Promise.all([getLearningPaths(), getCoursesWithProgress()]);
  const progressById = new Map(progressList.map((p) => [p.id, p]));
  const hasAnyCourseProgress = progressList.some((p) => p.completedFreeLessons > 0);

  const scored = paths.map((path) => {
    let completedCount = 0;
    let startedCount = 0;
    let nextCourse: Course | null = null;
    for (const c of path.courses) {
      const progress = progressById.get(c.id);
      const isComplete = progress?.certificateEarned ?? false;
      const isStarted = (progress?.completedFreeLessons ?? 0) > 0;
      if (isComplete) completedCount++;
      if (isStarted) startedCount++;
      if (!isComplete && !nextCourse) nextCourse = c;
    }
    return { path, nextCourse, completedCount, startedCount, totalCount: path.courses.length };
  });

  // Prefer a path that's partially done (closest to finishing first), then
  // fall back to one that's merely been started, before giving up.
  const partiallyDone = scored
    .filter((s) => s.completedCount > 0 && s.completedCount < s.totalCount)
    .sort((a, b) => b.completedCount / b.totalCount - a.completedCount / a.totalCount || b.startedCount - a.startedCount);
  const merelyStarted = scored
    .filter((s) => s.startedCount > 0 && s.completedCount === 0)
    .sort((a, b) => b.startedCount - a.startedCount);

  const pick = partiallyDone[0] ?? merelyStarted[0];
  if (pick) {
    return {
      status: "in-progress",
      path: pick.path,
      nextCourse: pick.nextCourse,
      completedCount: pick.completedCount,
      totalCount: pick.totalCount,
      hasAnyCourseProgress,
    };
  }

  const allPathsComplete = scored.length > 0 && scored.every((s) => s.completedCount === s.totalCount);
  if (allPathsComplete) {
    return {
      status: "all-completed",
      path: null,
      nextCourse: null,
      completedCount: 0,
      totalCount: 0,
      hasAnyCourseProgress,
    };
  }

  return {
    status: "no-path-progress",
    path: null,
    nextCourse: null,
    completedCount: 0,
    totalCount: 0,
    hasAnyCourseProgress,
  };
}

// --- Admin-only data. RLS enforces that only rows the caller is actually
// allowed to see come back (e.g. "Admins read all profiles"), so a non-admin
// calling these just gets their own row / an empty list rather than an error.

export type Profile = {
  id: string;
  email: string | null;
  fullName: string | null;
  role: string;
};

export async function getAllProfiles(): Promise<Profile[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((p: any) => ({
    id: p.id,
    email: p.email,
    fullName: p.full_name,
    role: p.role,
  }));
}

export type CourseManagement = Course & { lessonCount: number; quizCount: number };

export async function getCourseManagementList(): Promise<CourseManagement[]> {
  const courses = await getCourses();
  const withCounts = await Promise.all(
    courses.map(async (c) => {
      const [lessons, quiz] = await Promise.all([
        getLessonsForCourseSlug(c.slug),
        getQuizForCourseSlug(c.slug),
      ]);
      return { ...c, lessonCount: lessons.length, quizCount: quiz.length };
    })
  );
  return withCounts;
}
