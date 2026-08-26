"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// A narrow structural type (rather than importing LessonBlock from
// components/lesson-blocks) so this module has no dependency on that file —
// lesson-blocks.tsx imports splitIntoWords from here, so importing the other
// direction would create a cycle.
type ReadableBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "reveal"; prompt: string; content: string }
  | { type: string };

// Free, zero-setup "Listen" feature built on the browser's native
// speechSynthesis API — no TTS provider, no API key, no per-character cost.
// Trade-off vs. a paid voice API: the actual voice is whatever the user's OS/
// browser ships (varies by platform), but word-boundary highlighting works
// identically everywhere since it's driven by the SpeechSynthesisUtterance's
// own `boundary` events, not by a separately-fetched audio file.

// Splits on whitespace and drops empty strings. This exact tokenization is
// shared between the plain-text words fed to the utterance and the spans
// rendered in LessonBlocks/LessonBody, so word indices line up between what's
// being spoken and what's highlighted on screen.
export function splitIntoWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

// Flattens a lesson's readable narrative into a single ordered word list.
// Paragraph/list/reveal content is narrated; reveal cards are read as
// prompt-then-content (matching the auto-expand order in LessonBlocks' Reveal
// component). knowledge_check/try_this/scenario stay excluded — those are
// meant to be actively worked through, not read at the user passively.
// When a lesson has no content_blocks yet, falls back to body_text (same
// paragraph/bullet convention as LessonBody).
export function getReadableWords(blocks: ReadableBlock[] | null | undefined, bodyText: string | null | undefined): string[] {
  if (blocks && blocks.length > 0) {
    const words: string[] = [];
    for (const block of blocks) {
      if (block.type === "paragraph" && "text" in block) {
        words.push(...splitIntoWords(block.text));
      } else if (block.type === "list" && "items" in block) {
        for (const item of block.items) words.push(...splitIntoWords(item));
      } else if (block.type === "reveal" && "prompt" in block && "content" in block) {
        words.push(...splitIntoWords(block.prompt));
        words.push(...splitIntoWords(block.content));
      }
      // knowledge_check / try_this / scenario: intentionally skipped.
    }
    return words;
  }
  if (bodyText) {
    return splitIntoWords(bodyText);
  }
  return [];
}

export function useReadAloud(words: string[]) {
  const [playing, setPlaying] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  // Char offset (into the space-joined utterance text) where each word
  // starts, used to map a SpeechSynthesisUtterance boundary event's
  // charIndex back to a word index for highlighting.
  const offsets = useMemo(() => {
    const arr: number[] = [];
    let pos = 0;
    for (const w of words) {
      arr.push(pos);
      pos += w.length + 1; // +1 for the joining space
    }
    return arr;
  }, [words]);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  function charIndexToWordIndex(charIndex: number): number {
    // Linear scan is fine here — lessons run a few hundred words at most.
    let idx = 0;
    for (let i = 0; i < offsets.length; i++) {
      if (offsets[i] <= charIndex) idx = i;
      else break;
    }
    return idx;
  }

  function play() {
    if (!supported || words.length === 0) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(words.join(" "));
    utter.rate = 1;
    utter.onboundary = (e) => {
      if (e.name && e.name !== "word") return;
      setActiveIndex(charIndexToWordIndex(e.charIndex));
    };
    utter.onend = () => {
      setPlaying(false);
      setActiveIndex(-1);
    };
    utter.onerror = () => {
      setPlaying(false);
      setActiveIndex(-1);
    };
    utteranceRef.current = utter;
    window.speechSynthesis.speak(utter);
    setPlaying(true);
  }

  function stop() {
    if (supported) window.speechSynthesis.cancel();
    setPlaying(false);
    setActiveIndex(-1);
  }

  // Stop narration if the user navigates away mid-playback.
  useEffect(() => {
    return () => {
      if (supported) window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { supported, playing, activeIndex, play, stop };
}
