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
