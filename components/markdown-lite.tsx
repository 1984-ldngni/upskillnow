import { Fragment } from "react";

// Minimal markdown rendering for chat replies — just **bold** and line breaks.
// Avoids pulling in a full markdown library for what's otherwise plain text.
function renderLine(line: string, key: number) {
  const parts = line.split(/(\*\*.+?\*\*)/g).filter(Boolean);
  return (
    <Fragment key={key}>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        )
      )}
    </Fragment>
  );
}

export function MarkdownLite({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {renderLine(line, i)}
          {i < lines.length - 1 && <br />}
        </Fragment>
      ))}
    </>
  );
}
