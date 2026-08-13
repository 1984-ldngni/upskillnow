import { getSupabaseClient } from "@/lib/supabase/client";

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
  slug: string;
  title: string;
  level: string;
  description: string;
};

export type Lesson = { title: string; duration: string };

export type QuizQuestion = { question: string; options: string[]; answerIndex: number };

export async function getTools(): Promise<Tool[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("tools")
    .select("slug, name, description, website_url, target_industry, difficulty_level, pricing_tier, market_segment, subcategories(name, categories(name))")
    .order("name");

  if (error || !data) return [];

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
    .select("slug, title, level, description")
    .order("title");

  if (error || !data) return [];
  return data as Course[];
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("courses")
    .select("slug, title, level, description")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  return data as Course;
}

export async function getLessonsForCourseSlug(slug: string): Promise<Lesson[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("lessons")
    .select("title, duration, position, courses!inner(slug)")
    .eq("courses.slug", slug)
    .order("position");

  if (error || !data) return [];
  return data.map((l: any) => ({ title: l.title, duration: l.duration }));
}

export async function getQuizForCourseSlug(slug: string): Promise<QuizQuestion[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("quiz_questions")
    .select("question, options, answer_index, position, courses!inner(slug)")
    .eq("courses.slug", slug)
    .order("position");

  if (error || !data) return [];
  return data.map((q: any) => ({
    question: q.question,
    options: q.options as string[],
    answerIndex: q.answer_index,
  }));
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
