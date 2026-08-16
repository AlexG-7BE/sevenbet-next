"use client";

import { useEffect } from "react";

function normalized(value: string | null | undefined) {
  return (value || "").trim().toLowerCase();
}

export function HandoffInteractions({ name }: { name: string }) {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(`[data-handoff-page="${name}"]`);
    if (!root) return;

    const onClick = (event: MouseEvent) => {
      const button = (event.target as Element | null)?.closest<HTMLButtonElement>("button");
      if (!button) return;
      const label = normalized(button.textContent);
      if (label === "start programme") {
        window.location.assign("/program?entry=start");
        return;
      }
      if (name !== "learn") return;
      const topics = ["all topics", "bonuses", "banking", "casinos", "games", "responsible play", "industry"];
      if (!topics.includes(label)) return;
      const allGuides = [...root.querySelectorAll("h2")].find((heading) => normalized(heading.textContent) === "all guides");
      const section = allGuides?.parentElement?.parentElement;
      if (!section) return;
      const cards = [...section.querySelectorAll<HTMLAnchorElement>("a[href]")];
      for (const card of cards) card.hidden = label !== "all topics" && !normalized(card.textContent).includes(label);
      const siblings = button.parentElement?.querySelectorAll<HTMLButtonElement>("button") ?? [];
      for (const item of siblings) {
        const active = item === button;
        item.style.background = active ? "rgb(16, 15, 15)" : "transparent";
        item.style.color = active ? "rgb(250, 250, 247)" : "rgb(16, 15, 15)";
      }
    };

    const onInput = (event: Event) => {
      if (name !== "learn" || !(event.target instanceof HTMLInputElement) || event.target.type !== "search") return;
      const query = normalized(event.target.value);
      const allGuides = [...root.querySelectorAll("h2")].find((heading) => normalized(heading.textContent) === "all guides");
      const section = allGuides?.parentElement?.parentElement;
      if (!section) return;
      for (const card of section.querySelectorAll<HTMLAnchorElement>("a[href]")) card.hidden = Boolean(query) && !normalized(card.textContent).includes(query);
    };

    root.addEventListener("click", onClick);
    root.addEventListener("input", onInput);
    return () => {
      root.removeEventListener("click", onClick);
      root.removeEventListener("input", onInput);
    };
  }, [name]);
  return null;
}
