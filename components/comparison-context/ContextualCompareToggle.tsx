"use client";

import React from "react";
import { useEffect, useState } from "react";
import type { ProductPageMessages } from "@/lib/i18n/product-pages-catalog";

const EVENT_NAME = "b4gamble:comparison-change";

export function ContextualCompareToggle({ casinoSlug, casinoName, messages }: { casinoSlug: string; casinoName: string; messages?: ProductPageMessages["comparison"] }) {
  const [selected, setSelected] = useState(false);
  const [atCapacity, setAtCapacity] = useState(false);

  useEffect(() => {
    const sync = (event: Event) => {
      const values = (event as CustomEvent<{ slugs: string[] }>).detail?.slugs ?? [];
      setSelected(values.includes(casinoSlug));
      setAtCapacity(values.length >= 3);
    };
    window.addEventListener(EVENT_NAME, sync);
    window.dispatchEvent(new CustomEvent("b4gamble:comparison-request"));
    return () => window.removeEventListener(EVENT_NAME, sync);
  }, [casinoSlug]);

  return <button
    aria-disabled={atCapacity && !selected}
    aria-pressed={selected}
    data-comparison-toggle={casinoSlug}
    disabled={atCapacity && !selected}
    onClick={() => window.dispatchEvent(new CustomEvent("b4gamble:comparison-toggle", { detail: { slug: casinoSlug } }))}
    type="button"
  >{selected ? `${messages?.remove ?? "Remove"} ${casinoName}` : messages?.add ?? "Compare"}</button>;
}
