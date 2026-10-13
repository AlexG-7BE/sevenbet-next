"use client";

import { useSyncExternalStore } from "react";

import { RESEARCH_ACCESS_CHANGED_EVENT, researchDoorOpen } from "@/lib/research-access";

const subscribe = (onChange: () => void) => {
  window.addEventListener(RESEARCH_ACCESS_CHANGED_EVENT, onChange);
  return () => window.removeEventListener(RESEARCH_ACCESS_CHANGED_EVENT, onChange);
};
const readDoor = () => researchDoorOpen(document.cookie);
const serverDoor = () => true;

/**
 * Whether this browser's research door is open: the lesson flag without a declared pause and
 * without the clean route (lib/research-access.ts, Founder decision of 13 October 2026). The
 * Programme screens read the same plain cookies as the public menu, on the client only, and follow
 * the same event the pause page fires; the server assumes open so nothing is hidden before the
 * cookies can be read.
 */
export function useResearchDoor() {
  return useSyncExternalStore(subscribe, readDoor, serverDoor);
}
