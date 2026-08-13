import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { matchFaq } from "@/lib/chat-faq";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://nososmapqfrinvefuzmv.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vc29zbWFwcWZyaW52ZWZ1em12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1NzIxODksImV4cCI6MjEwMjE0ODE4OX0.WTqKONse5jN2O6k0bWIVAJF-SSUlwQhCzDh3OO4jQzk";

const MAX_HISTORY_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 1000;

type ChatMessage = { role: "user" | "assistant"; content: string };

// Pulls a compact snapshot of the live catalog so the assistant's answers stay
// accurate as tools/courses/paths are added, without needing to hardcode or
// regenerate a static prompt.
async function buildCatalogSummary(): Promise<string> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const [{ data: tools }, { data: courses }, { data: paths }] = await Promise.all([
    supabase.from("tools").select("name, subcategories(categories(name))").order("name"),
    supabase.from("courses").select("title, level, description").order("title"),
    supabase.from("learning_paths").select("title, level, description").order("title"),
  ]);

  const toolLines = (tools ?? [])
    .map((t: any) => `- ${t.name} (${t.subcategories?.categories?.name ?? "Uncategorized"})`)
    .join("\n");
  const courseLines = (courses ?? [])
    .map((c: any) => `- ${c.title} [${c.level}] — ${c.description}`)
    .join("\n");
  const pathLines = (paths ?? [])
    .map((p: any) => `- ${p.title} [${p.level}] — ${p.description}`)
    .join("\n");

  return `TOOL DIRECTORY (${tools?.length ?? 0} tools):\n${toolLines}\n\nCOURSES (${courses?.length ?? 0}):\n${courseLines}\n\nLEARNING PATHS (${paths?.length ?? 0}):\n${pathLines}`;
}

const SYSTEM_PROMPT_BASE = `You are the "Ask us" support assistant on UpSkillNow, a site that teaches Virtual Assistants and professionals how to use AI and automation tools through short courses and Learning Paths.

Pricing (also shown on the site's pricing section): Free plan ($0/₱0, one starter course), Pro ($9/mo or ₱495/mo, full course library + quizzes), Team ($24/mo or ₱1,495/mo, for 2-4 seats with the 4th seat free). USD is shown for international visitors, PHP for the Philippines.

Answer questions about the tool directory, courses, learning paths, pricing, and how the site works, using the catalog data below. If someone asks something unrelated to UpSkillNow or that you don't have information for, say so honestly rather than guessing. Keep answers concise and friendly. Do not invent tools, courses, or prices that aren't listed below.

`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const incoming: ChatMessage[] = Array.isArray(body?.messages) ? body.messages : [];

    const messages = incoming
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-MAX_HISTORY_MESSAGES)
      .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_LENGTH) }));

    if (messages.length === 0) {
      return NextResponse.json({ error: "No message provided." }, { status: 400 });
    }

    // Check the latest user message against canned answers first. Most real
    // traffic is the same handful of questions (pricing, what's included,
    // how paths work), so this skips the AI call entirely — free, instant,
    // and consistent — and only falls through to the AI for anything novel.
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === "user") {
      const faqMatch = matchFaq(lastMessage.content);
      if (faqMatch) {
        return NextResponse.json({ reply: faqMatch.answer, source: "faq" });
      }
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        reply:
          "The chat assistant isn't fully set up yet — an admin needs to add an ANTHROPIC_API_KEY in Vercel's environment variables. In the meantime, feel free to browse the Tool Directory or Courses!",
      });
    }

    const catalog = await buildCatalogSummary();

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        system: SYSTEM_PROMPT_BASE + catalog,
        messages,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Anthropic API error:", res.status, errText);
      return NextResponse.json({
        reply: "Sorry, something went wrong answering that. Please try again in a moment.",
      });
    }

    const data = await res.json();
    const reply = data?.content?.[0]?.text ?? "Sorry, I couldn't come up with an answer for that.";

    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error("Chat API error:", err);
    return NextResponse.json(
      { reply: "Sorry, something went wrong. Please try again." },
      { status: 200 }
    );
  }
}
