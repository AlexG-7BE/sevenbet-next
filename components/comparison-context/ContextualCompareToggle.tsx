"use client";

import { useEffect, useState } from "react";

const EVENT_NAME = "b4gamble:comparison-change";

export function ContextualCompareToggle({ casinoSlug, casinoName }: { casinoSlug: string; casinoName: string }) {
  const [selected, setSelected] = useState(false);

  useEffect(() => {
    const sync = (event: Event) => {
      const values = (event as CustomEvent<{ slugs: string[] }>).detail?.slugs ?? [];
      setSelected(values.includes(casinoSlug));
    };
    window.addEventListener(EVENT_NAME, sync);
    window.dispatchEvent(new CustomEvent("b4gamble:comparison-request"));
    return () => window.removeEventListener(EVENT_NAME, sync);
  }, [casinoSlug]);

  return <button
    aria-pressed={selected}
    onClick={() => window.dispatchEvent(new CustomEvent("b4gamble:comparison-toggle", { detail: { slug: casinoSlug } }))}
    type="button"
  >{selected ? `Remove ${casinoName}` : "Compare"}</button>;
}
