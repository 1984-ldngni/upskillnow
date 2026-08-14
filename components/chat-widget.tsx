"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { MarkdownLite } from "@/components/markdown-lite";
import { MessageCircle, X, Send } from "lucide-react";

type ChatMessage = { role: "user" | "assistant"; content: string };

const GREETING: ChatMessage = {
  role: "assistant",
  content: "Hi! Ask me anything about our tools, courses, learning paths, or pricing.",
};

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages = [...messages, { role: "user" as const, content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply ?? "Sorry, something went wrong." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't reach the server. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-3 flex h-[28rem] w-80 flex-col rounded-md border-4 border-black bg-card shadow-brutal sm:w-96">
          <div className="flex items-center justify-between border-b-2 border-black bg-amber-300 px-4 py-3">
            <p className="font-heading text-sm font-black text-black">Ask us</p>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="text-black hover:opacity-75"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-md border-2 border-black px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "ml-auto bg-orange-400 text-black"
                    : "bg-secondary text-foreground"
                }`}
              >
                <MarkdownLite text={m.content} />
              </div>
            ))}
            {loading && (
              <div className="max-w-[85%] rounded-md border-2 border-black bg-secondary px-3 py-2 text-sm text-muted-foreground">
                Thinking…
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 border-t-2 border-black p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Type your question…"
              className="flex-1 rounded-md border-2 border-black bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none"
            />
            <Button size="sm" onClick={sendMessage} disabled={loading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border-2 border-black bg-amber-300 px-4 py-3 font-heading text-sm font-black text-black shadow-brutal-sm transition-transform hover:-translate-y-0.5"
      >
        <MessageCircle className="h-5 w-5" />
        Ask us
      </button>
    </div>
  );
}
