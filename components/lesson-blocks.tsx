"use client";

import { useState } from "react";
import { ChevronDown, CheckCircle2, XCircle, Sparkles } from "lucide-react";

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

function Reveal({ block }: { block: RevealBlock }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-md border-2 border-black">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 bg-secondary px-4 py-3 text-left text-sm font-bold"
      >
        {block.prompt}
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="max-h-56 overflow-y-auto border-t-2 border-black bg-card px-4 py-3 text-sm leading-relaxed">
          {block.content}
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

export function LessonBlocks({ blocks }: { blocks: LessonBlock[] }) {
  return (
    <div className="space-y-4 text-sm leading-relaxed">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "paragraph":
            return <p key={i}>{block.text}</p>;
          case "list":
            return (
              <ul key={i} className="list-disc space-y-1.5 pl-5">
                {block.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            );
          case "reveal":
            return <Reveal key={i} block={block} />;
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
