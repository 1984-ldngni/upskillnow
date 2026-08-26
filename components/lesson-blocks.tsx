"use client";

import { useEffect, useState } from "react";
import { ChevronDown, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { splitIntoWords } from "@/lib/read-aloud";

// The Read tab's structured, interactive content format. Each lesson's
// content_blocks column is an array of these — mixing plain reading with
// small interactive moments (reveal cards, knowledge checks, self-check
// exercises, branching scenarios) so a lesson isn't just a wall of text.
// Falls back to plain body_text (rendered elsewhere) when a lesson hasn't
// been authored in this format yet.
type ParagraphBlock = { type: "paragraph"; text: string };
type ListBlock = { type: "list"; items: string[] };
type RevealBlock = { type: "reveal"; prompt: string; content: string };
type KnowledgeCheckBlock = {
  type: "knowledge_check";
  question: string;
  options: string[];
  answerIndex: number;
  explanation?: string;
};
type TryThisBlock = { type: "try_this"; prompt: string; checklist: string[] };
type ScenarioChoice = { label: string; outcome: string };
type ScenarioBlock = { type: "scenario"; setup: string; choices: ScenarioChoice[] };

export type LessonBlock =
  | ParagraphBlock
  | ListBlock
  | RevealBlock
  | KnowledgeCheckBlock
  | TryThisBlock
  | ScenarioBlock;

// Renders `words` (already split) as spans starting at `startIndex`, so
// indices align with the shared global word list computed by
// getReadableWords — used instead of <ReadableText> here because Reveal
// needs to know its own word range (promptStart/blockEnd) synchronously, up
// front, to decide whether to auto-expand — reading counter.current *after*
// handing a child <ReadableText> its words wouldn't reflect that child's
// increments yet, since React doesn't actually render children until this
// component's own function body has finished returning its JSX.
function WordSpans({ words, startIndex, activeWordIndex, keyPrefix }: { words: string[]; startIndex: number; activeWordIndex?: number; keyPrefix: string }) {
  return (
    <>
      {words.map((w, i) => {
        const idx = startIndex + i;
        const active = activeWordIndex !== undefined && idx === activeWordIndex;
        return (
          <span key={`${keyPrefix}-${i}`} className={active ? "rounded bg-amber-200 text-black" : undefined}>
            {w}
            {i < words.length - 1 ? " " : ""}
          </span>
        );
      })}
    </>
  );
}

function Reveal({
  block,
  counter,
  activeWordIndex,
  keyPrefix,
}: {
  block: RevealBlock;
  counter: { current: number };
  activeWordIndex?: number;
  keyPrefix: string;
}) {
  const [manualOpen, setManualOpen] = useState(false);

  // Computed directly (not via a shared counter incremented inside child
  // renders) so the range is known before deciding whether to auto-expand.
  const promptWords = splitIntoWords(block.prompt);
  const contentWords = splitIntoWords(block.content);
  const promptStart = counter.current;
  const contentStart = promptStart + promptWords.length;
  const blockEnd = contentStart + contentWords.length;
  counter.current = blockEnd;

  const activeInThisBlock =
    activeWordIndex !== undefined && activeWordIndex >= promptStart && activeWordIndex < blockEnd;

  // Listen auto-expands this card as narration reaches it, and leaves it
  // open afterward (matches how a reveal would look once you've read it —
  // snapping shut again as narration moves on would be jarring).
  useEffect(() => {
    if (activeInThisBlock) setManualOpen(true);
  }, [activeInThisBlock]);

  return (
    <div className="overflow-hidden rounded-md border-2 border-black">
      <button
        onClick={() => setManualOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 bg-secondary px-4 py-3 text-left text-sm font-bold"
      >
        <span>
          <WordSpans words={promptWords} startIndex={promptStart} activeWordIndex={activeWordIndex} keyPrefix={`${keyPrefix}-prompt`} />
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${manualOpen ? "rotate-180" : ""}`} />
      </button>
      {manualOpen && (
        <div className="max-h-56 overflow-y-auto border-t-2 border-black bg-card px-4 py-3 text-sm leading-relaxed">
          <WordSpans words={contentWords} startIndex={contentStart} activeWordIndex={activeWordIndex} keyPrefix={`${keyPrefix}-content`} />
        </div>
      )}
    </div>
  );
}

function KnowledgeCheck({ block }: { block: KnowledgeCheckBlock }) {
  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;
  const correct = selected === block.answerIndex;
  return (
    <div className="flex min-h-[220px] flex-col rounded-md border-2 border-black bg-amber-50 p-4">
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-amber-700">
        <Sparkles className="h-3.5 w-3.5" />
        Quick check
      </p>
      <p className="mt-2 max-h-24 overflow-y-auto text-sm font-bold text-black">{block.question}</p>
      <div className="mt-3 space-y-2">
        {block.options.map((opt, i) => {
          const isSelected = selected === i;
          const showCorrect = answered && i === block.answerIndex;
          const showWrong = answered && isSelected && i !== block.answerIndex;
          return (
            <button
              key={i}
              disabled={answered}
              onClick={() => setSelected(i)}
              className={`flex w-full items-center justify-between gap-2 rounded-md border-2 px-3 py-2 text-left text-sm font-medium transition-colors ${
                showCorrect
                  ? "border-emerald-600 bg-emerald-100 text-black"
                  : showWrong
                  ? "border-destructive bg-destructive/10 text-black"
                  : "border-black bg-card hover:bg-secondary disabled:hover:bg-card"
              }`}
            >
              {opt}
              {showCorrect && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />}
              {showWrong && <XCircle className="h-4 w-4 shrink-0 text-destructive" />}
            </button>
          );
        })}
      </div>
      {answered && (
        <p className={`mt-3 max-h-24 overflow-y-auto text-sm font-medium ${correct ? "text-emerald-700" : "text-destructive"}`}>
          {correct ? "Correct. " : "Not quite. "}
          {block.explanation}
        </p>
      )}
    </div>
  );
}

function TryThis({ block }: { block: TryThisBlock }) {
  const [value, setValue] = useState("");
  const [showChecklist, setShowChecklist] = useState(false);
  return (
    <div className="flex min-h-[220px] flex-col rounded-md border-2 border-black bg-secondary/60 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-primary">Try this</p>
      <p className="mt-2 max-h-20 overflow-y-auto text-sm">{block.prompt}</p>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Jot a quick note here (not saved — just for you to think it through)"
        rows={3}
        className="mt-3 w-full rounded-md border-2 border-black bg-card p-2 text-sm outline-none focus:ring-2 focus:ring-primary"
      />
      <button
        onClick={() => setShowChecklist((v) => !v)}
        className="mt-2 text-xs font-bold text-primary underline underline-offset-2"
      >
        {showChecklist ? "Hide self-check" : "Show self-check"}
      </button>
      {showChecklist && (
        <ul className="mt-2 max-h-24 list-disc space-y-1 overflow-y-auto pl-5 text-sm text-muted-foreground">
          {block.checklist.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Scenario({ block }: { block: ScenarioBlock }) {
  const [chosen, setChosen] = useState<number | null>(null);
  return (
    <div className="flex min-h-[220px] flex-col rounded-md border-2 border-black bg-card p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-accent">Scenario</p>
      <p className="mt-2 max-h-24 overflow-y-auto text-sm font-medium">{block.setup}</p>
      <div className="mt-3 space-y-2">
        {block.choices.map((choice, i) => (
          <button
            key={i}
            onClick={() => setChosen(i)}
            className={`w-full rounded-md border-2 px-3 py-2 text-left text-sm font-medium transition-colors ${
              chosen === i ? "border-black bg-accent/10" : "border-black hover:bg-secondary"
            }`}
          >
            {choice.label}
          </button>
        ))}
      </div>
      {chosen !== null && (
        <div className="mt-3 max-h-32 overflow-y-auto rounded-md border-2 border-black bg-secondary p-3 text-sm">
          {block.choices[chosen].outcome}
        </div>
      )}
    </div>
  );
}

// Renders `text` as individual word spans, consuming and advancing a shared
// counter (passed by reference) so word indices stay continuous across
// paragraphs, list items, and blocks. Whitespace is preserved as plain text
// (not counted) so visual spacing is unaffected — only non-whitespace tokens
// get an index, matching splitIntoWords' tokenization exactly so the Listen
// feature's activeWordIndex lines up with the right span.
export function ReadableText({
  text,
  counter,
  activeWordIndex,
  keyPrefix,
}: {
  text: string;
  counter: { current: number };
  activeWordIndex?: number;
  keyPrefix: string;
}) {
  const tokens = text.split(/(\s+)/);
  return (
    <>
      {tokens.map((token, i) => {
        if (token === "" || /^\s+$/.test(token)) return token;
        const idx = counter.current++;
        const active = activeWordIndex !== undefined && idx === activeWordIndex;
        return (
          <span key={`${keyPrefix}-${i}`} className={active ? "rounded bg-amber-200 text-black" : undefined}>
            {token}
          </span>
        );
      })}
    </>
  );
}

export function LessonBlocks({ blocks, activeWordIndex }: { blocks: LessonBlock[]; activeWordIndex?: number }) {
  const counter = { current: 0 };
  return (
    <div className="space-y-4 text-sm leading-relaxed">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "paragraph":
            return (
              <p key={i}>
                <ReadableText text={block.text} counter={counter} activeWordIndex={activeWordIndex} keyPrefix={`p${i}`} />
              </p>
            );
          case "list":
            return (
              <ul key={i} className="list-disc space-y-1.5 pl-5">
                {block.items.map((item, j) => (
                  <li key={j}>
                    <ReadableText text={item} counter={counter} activeWordIndex={activeWordIndex} keyPrefix={`l${i}-${j}`} />
                  </li>
                ))}
              </ul>
            );
          case "reveal":
            return <Reveal key={i} block={block} counter={counter} activeWordIndex={activeWordIndex} keyPrefix={`r${i}`} />;
          case "knowledge_check":
            return <KnowledgeCheck key={i} block={block} />;
          case "try_this":
            return <TryThis key={i} block={block} />;
          case "scenario":
            return <Scenario key={i} block={block} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
