"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** The nonce the browser holds for this document. A script may read it; markup and selectors may not. */
function documentNonce() {
  return document.querySelector<HTMLScriptElement>("script[nonce]")?.nonce || undefined;
}

/**
 * The policy's nonce belongs to the document, not to the request that rendered a page. On a client
 * transition the page comes from a later request with a nonce of its own, and the browser refuses
 * a stylesheet under that nonce: until 11 October 2026 Home reached from another page lost its
 * phone layout and its desktop paging that way. In the browser the stylesheet therefore carries
 * the document's nonce. The server, and the hydration of a document load, use the request's,
 * which is the same value there.
 */
export function DocumentNonceStyle({ css, nonce }: { css: string; nonce?: string }) {
  const applied = useSyncExternalStore(subscribe, () => documentNonce() ?? nonce, () => nonce);
  return <style nonce={applied}>{css}</style>;
}
