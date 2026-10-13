"use client";

import { useState } from "react";

/**
 * A block of text with a copy button, for the pages of the clean route (the message a relative
 * sends, the five lines a person takes to a helpline). The text is plain and selectable, so the
 * page works where the clipboard is refused.
 */
export function CopyText({ className, copiedLabel, copyLabel, lines, text }: {
  className?: string;
  copiedLabel: string;
  copyLabel: string;
  lines?: readonly string[];
  text?: string;
}) {
  const [copied, setCopied] = useState(false);
  const content = text ?? (lines ?? []).join("\n");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // The clipboard can be refused; the text stays selectable on the page.
      setCopied(false);
    }
  };
  return <div className={className} data-copy-text>
    {lines ? <ol>{lines.map((line) => <li key={line}>{line}</li>)}</ol> : <p>{text}</p>}
    <button onClick={copy} type="button">{copied ? copiedLabel : copyLabel}</button>
  </div>;
}
